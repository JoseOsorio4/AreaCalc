// Prueba de arquitectura de ÁreaCalc (design.md §2, §15 y §18; AGENTS.md).
// Versión inicial de T-01, completada en T-08. Lee los archivos como texto: no
// ejecuta el código de src/. Comprueba:
//   - las dependencias npm aprobadas y que las páginas no carguen recursos externos;
//   - las dependencias entre carpetas de design §2;
//   - que las capas sin interfaz no usen el DOM;
//   - las construcciones prohibidas (eval, new Function, innerHTML…);
//   - que no se use coma flotante para decidir resultados exactos y que solo se
//     redondee en presentacion/formato.js;
//   - que el propio comprobador detecta las infracciones (código sintético).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(RAIZ, 'src');

/** Dependencias npm aprobadas (design.md §1 y §18). */
const DEPENDENCIAS_PERMITIDAS = ['vite', 'vitest', 'plotly.js-basic-dist-min', 'katex'];

/**
 * Qué puede importar cada carpeta de src/, además de sí misma (design.md §2).
 * carpetas: otras carpetas de src/; paquetes: paquetes npm; archivos: archivos sueltos.
 */
const REGLAS = {
  nucleo: { carpetas: [], paquetes: [], archivos: [] },
  expresiones: { carpetas: ['nucleo'], paquetes: [], archivos: [] },
  presentacion: { carpetas: ['nucleo'], paquetes: [], archivos: [] },
  'casos-de-uso': { carpetas: ['nucleo', 'expresiones', 'presentacion'], paquetes: [], archivos: [] },
  adaptadores: { carpetas: [], paquetes: ['plotly.js-basic-dist-min', 'katex'], archivos: [] },
  interfaz: { carpetas: ['casos-de-uso', 'adaptadores', 'ejemplos'], paquetes: [], archivos: ['presentacion/formato.js'] },
  ejemplos: { carpetas: [], paquetes: [], archivos: [] }
};

/** Carpetas que no pueden usar el DOM (design.md §2). */
const SIN_DOM = ['nucleo', 'expresiones', 'presentacion', 'casos-de-uso'];

/**
 * Construcciones prohibidas en todo src/ (R-20.1 y R-20.5; design.md §18).
 * Una prueba estática no distingue si un texto viene del usuario, así que se
 * prohíben innerHTML y similares en todos los casos.
 */
const PROHIBIDAS = [
  { patron: /\beval\s*\(/, motivo: 'eval' },
  { patron: /\bnew\s+Function\b/, motivo: 'new Function' },
  { patron: /(^|[^.\w])Function\s*\(/, motivo: 'constructor Function' },
  { patron: /\.(innerHTML|outerHTML)\b/, motivo: 'innerHTML u outerHTML' },
  { patron: /\binsertAdjacentHTML\b/, motivo: 'insertAdjacentHTML' },
  { patron: /\bdocument\.write\b/, motivo: 'document.write' }
];

/** Capas que deciden resultados exactos: ningún resultado pasa por Number (AGENTS.md; design §6 y §8). */
const CAPAS_EXACTAS = ['nucleo', 'expresiones', 'casos-de-uso'];

/**
 * Conversiones a coma flotante prohibidas en las capas exactas. `permitidos` son
 * los únicos archivos que las definen: racional.aNumber y polinomio.evaluarAprox,
 * que solo sirven para dibujar (design §6 y §7).
 */
const FLOTANTE = [
  { patron: /\bNumber\s*\(/, motivo: 'Number()', permitidos: ['nucleo/racional.js'] },
  { patron: /\b(?:parseFloat|parseInt)\b/, motivo: 'parseFloat o parseInt', permitidos: [] },
  { patron: /\b(?:aNumber|evaluarAprox)\b/, motivo: 'aNumber o evaluarAprox', permitidos: ['nucleo/racional.js', 'nucleo/polinomio.js'] },
  { patron: /\bMath\.(?:round|floor|ceil|sqrt|cbrt|pow|exp|log)\b/, motivo: 'Math en coma flotante', permitidos: [] }
];

/** Redondeo para mostrar: solo en presentacion/formato.js (AGENTS.md; design §4 y §14.1). */
const REDONDEO = { patron: /\.(?:toFixed|toPrecision|toLocaleString)\s*\(|\bMath\.round\s*\(/, permitido: 'presentacion/formato.js' };

/** Quita los comentarios para no confundir el texto explicativo con código. */
function sinComentarios(codigo) {
  return codigo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
}

/** Archivos .js de una carpeta, de forma recursiva; vacía si la carpeta no existe. */
function archivosJs(carpeta) {
  if (!existsSync(carpeta)) return [];
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) return archivosJs(ruta);
    return nombre.endsWith('.js') ? [ruta] : [];
  });
}

/** Ruta de un archivo dentro de src/, con «/»: 'nucleo/racional.js'. */
const rutaEnSrc = (archivo) => relative(SRC, archivo).split(sep).join('/');

/** Especificadores de `import … from`, `export … from`, `import '…'` e `import('…')`. */
function importaciones(codigo) {
  const patron = /\b(?:import|export)\b[^'"`;]*?\bfrom\s*['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)|\bimport\s+['"]([^'"]+)['"]/g;
  return [...codigo.matchAll(patron)].map((m) => m[1] ?? m[2] ?? m[3]);
}

/**
 * Paquete npm, o carpeta y ruta dentro de src/, a los que apunta un import hecho
 * desde `ruta` (relativa a src/, con «/»).
 */
function destino(ruta, especificador) {
  if (!especificador.startsWith('.')) {
    const partes = especificador.split('/');
    return { paquete: especificador.startsWith('@') ? partes.slice(0, 2).join('/') : partes[0] };
  }
  const objetivo = resolve(SRC, dirname(ruta), especificador);
  const enSrc = rutaEnSrc(objetivo);
  return { ruta: enSrc, carpeta: enSrc.split('/')[0] };
}

/** Imports de `codigo` que la carpeta de `ruta` no puede hacer (design §2). */
function importsNoPermitidos(ruta, codigo) {
  const carpeta = ruta.split('/')[0];
  const regla = REGLAS[carpeta];
  if (!regla) return [];
  return importaciones(sinComentarios(codigo)).filter((especificador) => {
    const objetivo = destino(ruta, especificador);
    if (objetivo.paquete) return !regla.paquetes.includes(objetivo.paquete);
    return !(objetivo.carpeta === carpeta || regla.carpetas.includes(objetivo.carpeta) || regla.archivos.includes(objetivo.ruta));
  });
}

/** Construcciones prohibidas presentes en `codigo`. */
const prohibidasEn = (codigo) => PROHIBIDAS.filter(({ patron }) => patron.test(sinComentarios(codigo))).map(({ motivo }) => motivo);

/** Conversiones a coma flotante o redondeos que `ruta` no puede usar. */
function numericasNoPermitidas(ruta, codigo) {
  const limpio = sinComentarios(codigo);
  const hallazgos = [];
  if (CAPAS_EXACTAS.includes(ruta.split('/')[0])) {
    for (const { patron, motivo, permitidos } of FLOTANTE) {
      if (patron.test(limpio) && !permitidos.includes(ruta)) hallazgos.push(motivo);
    }
  }
  if (REDONDEO.patron.test(limpio) && ruta !== REDONDEO.permitido) hallazgos.push('redondeo fuera de formato.js');
  return hallazgos;
}

const fuentes = () => archivosJs(SRC).map((archivo) => ({ ruta: rutaEnSrc(archivo), codigo: readFileSync(archivo, 'utf8') }));

describe('dependencias npm', () => {
  it('solo usa las cuatro dependencias aprobadas', () => {
    const paquete = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf8'));
    const usadas = Object.keys({ ...paquete.dependencies, ...paquete.devDependencies });
    expect(usadas.filter((nombre) => !DEPENDENCIAS_PERMITIDAS.includes(nombre))).toEqual([]);
  });
});

describe('recursos locales', () => {
  it('las páginas HTML no cargan recursos externos', () => {
    const paginas = readdirSync(RAIZ).filter((nombre) => nombre.endsWith('.html'));
    expect(paginas).toContain('index.html');
    const externos = paginas.flatMap((pagina) => {
      const html = readFileSync(join(RAIZ, pagina), 'utf8');
      return [...html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/g)]
        .map((m) => m[1])
        .filter((url) => /^(?:[a-z]+:)?\/\//i.test(url))
        .map((url) => `${pagina}: ${url}`);
    });
    expect(externos).toEqual([]);
  });
});

describe('código de src/', () => {
  it('existen el punto de entrada y los casos de uso de T-08', () => {
    for (const ruta of ['main.js', 'casos-de-uso/analizarPerfil.js', 'casos-de-uso/calcularFigura.js', 'casos-de-uso/estimarMaterial.js']) {
      expect(existsSync(join(SRC, ruta)), ruta).toBe(true);
    }
  });

  it('no contiene construcciones prohibidas', () => {
    const hallazgos = fuentes().flatMap(({ ruta, codigo }) => prohibidasEn(codigo).map((motivo) => `${ruta}: ${motivo}`));
    expect(hallazgos).toEqual([]);
  });

  it('respeta las dependencias entre carpetas', () => {
    const hallazgos = fuentes().flatMap(({ ruta, codigo }) => importsNoPermitidos(ruta, codigo).map((e) => `${ruta} importa ${e}`));
    expect(hallazgos).toEqual([]);
  });

  it('el núcleo y las capas sin interfaz no usan el DOM', () => {
    const hallazgos = fuentes()
      .filter(({ ruta }) => SIN_DOM.includes(ruta.split('/')[0]))
      .filter(({ codigo }) => /\b(?:document|window)\b/.test(sinComentarios(codigo)))
      .map(({ ruta }) => ruta);
    expect(hallazgos).toEqual([]);
  });

  it('las capas exactas no usan coma flotante y solo formato.js redondea', () => {
    const hallazgos = fuentes().flatMap(({ ruta, codigo }) => numericasNoPermitidas(ruta, codigo).map((m) => `${ruta}: ${m}`));
    expect(hallazgos).toEqual([]);
  });

  it('las capas exactas tienen archivos que revisar', () => {
    const rutas = fuentes().map(({ ruta }) => ruta.split('/')[0]);
    for (const capa of CAPAS_EXACTAS) expect(rutas, capa).toContain(capa);
  });
});

describe('el comprobador detecta las infracciones (código sintético)', () => {
  it('reconoce todas las formas de import', () => {
    const codigo = "import a from './a.js';\nimport { b } from \"../b.js\";\nexport { c } from './c.js';\nimport './d.css';\nconst e = import('./e.js');";
    expect(importaciones(codigo)).toEqual(['./a.js', '../b.js', './c.js', './d.css', './e.js']);
  });

  it.each([
    ['nucleo/x.js', "import { f } from '../interfaz/estado.js';", ['../interfaz/estado.js']],
    ['nucleo/x.js', "import katex from 'katex';", ['katex']],
    ['nucleo/x.js', "import { q } from './racional.js';", []],
    ['expresiones/x.js', "import * as r from '../nucleo/racional.js';", []],
    ['expresiones/x.js', "import { f } from '../presentacion/formato.js';", ['../presentacion/formato.js']],
    ['casos-de-uso/x.js', "import { f } from '../presentacion/pasos.js';", []],
    ['casos-de-uso/x.js', "import { g } from '../adaptadores/graficaPlotly.js';", ['../adaptadores/graficaPlotly.js']],
    ['interfaz/x.js', "import { f } from '../presentacion/formato.js';", []],
    ['interfaz/x.js', "import { p } from '../presentacion/pasos.js';", ['../presentacion/pasos.js']],
    ['interfaz/x.js', "import { r } from '../nucleo/racional.js';", ['../nucleo/racional.js']],
    ['adaptadores/x.js', "import Plotly from 'plotly.js-basic-dist-min';", []],
    ['adaptadores/x.js', "import { r } from '../nucleo/racional.js';", ['../nucleo/racional.js']],
    ['ejemplos/x.js', "import { r } from '../nucleo/racional.js';", ['../nucleo/racional.js']],
    ['nucleo/x.js', "// import { f } from '../interfaz/estado.js';", []]
  ])('%s: «%s»', (ruta, codigo, esperado) => {
    expect(importsNoPermitidos(ruta, codigo)).toEqual(esperado);
  });

  it.each([
    ['eval("1")', ['eval']], ['const f = new Function("x");', ['new Function', 'constructor Function']],
    ['const f = Function("x");', ['constructor Function']],
    ['el.innerHTML = texto;', ['innerHTML u outerHTML']], ['el.insertAdjacentHTML("x", t);', ['insertAdjacentHTML']],
    ['document.write(t);', ['document.write']], ['evaluar(p, x); el.textContent = t;', []], ['// eval(1)\n/* new Function */', []]
  ])('«%s» → %j', (codigo, esperado) => {
    expect(prohibidasEn(codigo)).toEqual(esperado);
  });

  it.each([
    ['casos-de-uso/x.js', 'const v = Number(r.num);', ['Number()']],
    ['casos-de-uso/x.js', 'const v = racional.aNumber(area);', ['aNumber o evaluarAprox']],
    ['casos-de-uso/x.js', 'if (Math.sqrt(d) > 1) {}', ['Math en coma flotante']],
    ['expresiones/x.js', 'parseFloat(texto)', ['parseFloat o parseInt']],
    ['nucleo/area.js', 'polinomio.evaluarAprox(f, 1)', ['aNumber o evaluarAprox']],
    ['nucleo/racional.js', 'return Number(cociente);', []],
    ['nucleo/polinomio.js', 'valor = valor * x + racional.aNumber(c);', []],
    ['nucleo/polinomio.js', 'const largo = Math.max(a.length, b.length);', []],
    ['presentacion/datosGrafica.js', 'const y = aNumber(r);', []],
    ['presentacion/pasos.js', 'x.toFixed(4)', ['redondeo fuera de formato.js']],
    ['presentacion/formato.js', 'x.toFixed(4)', []],
    ['interfaz/vistaPerfil.js', 'Math.round(x)', ['redondeo fuera de formato.js']]
  ])('%s: «%s» → %j', (ruta, codigo, esperado) => {
    expect(numericasNoPermitidas(ruta, codigo)).toEqual(esperado);
  });
});
