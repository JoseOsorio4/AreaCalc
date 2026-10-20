// Prueba de arquitectura de ÁreaCalc (design.md §2, §15 y §18).
// Versión inicial de T-01; se completa en T-08. Lee los archivos como texto:
// no ejecuta el código de src/.
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

/** Especificadores de `import … from`, `export … from`, `import '…'` e `import('…')`. */
function importaciones(codigo) {
  const patron = /\b(?:import|export)\b[^'"`;]*?\bfrom\s*['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)|\bimport\s+['"]([^'"]+)['"]/g;
  return [...codigo.matchAll(patron)].map((m) => m[1] ?? m[2] ?? m[3]);
}

/** Paquete npm, o carpeta y ruta dentro de src/, a los que apunta un import. */
function destino(archivo, especificador) {
  if (!especificador.startsWith('.')) {
    const partes = especificador.split('/');
    return { paquete: especificador.startsWith('@') ? partes.slice(0, 2).join('/') : partes[0] };
  }
  const ruta = relative(SRC, resolve(dirname(archivo), especificador)).split(sep).join('/');
  return { ruta, carpeta: ruta.split('/')[0] };
}

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
  it('existe el punto de entrada', () => {
    expect(existsSync(join(SRC, 'main.js'))).toBe(true);
  });

  it('no contiene construcciones prohibidas', () => {
    const hallazgos = archivosJs(SRC).flatMap((archivo) => {
      const codigo = sinComentarios(readFileSync(archivo, 'utf8'));
      return PROHIBIDAS.filter(({ patron }) => patron.test(codigo))
        .map(({ motivo }) => `${relative(RAIZ, archivo)}: ${motivo}`);
    });
    expect(hallazgos).toEqual([]);
  });

  it('respeta las dependencias entre carpetas', () => {
    const hallazgos = [];
    for (const [carpeta, regla] of Object.entries(REGLAS)) {
      for (const archivo of archivosJs(join(SRC, carpeta))) {
        for (const especificador of importaciones(sinComentarios(readFileSync(archivo, 'utf8')))) {
          const objetivo = destino(archivo, especificador);
          const permitido = objetivo.paquete
            ? regla.paquetes.includes(objetivo.paquete)
            : objetivo.carpeta === carpeta
              || regla.carpetas.includes(objetivo.carpeta)
              || regla.archivos.includes(objetivo.ruta);
          if (!permitido) hallazgos.push(`${relative(RAIZ, archivo)} importa ${especificador}`);
        }
      }
    }
    expect(hallazgos).toEqual([]);
  });

  it('el núcleo y las capas sin interfaz no usan el DOM', () => {
    const hallazgos = SIN_DOM.flatMap((carpeta) => archivosJs(join(SRC, carpeta)))
      .filter((archivo) => /\b(?:document|window)\b/.test(sinComentarios(readFileSync(archivo, 'utf8'))))
      .map((archivo) => relative(RAIZ, archivo));
    expect(hallazgos).toEqual([]);
  });
});
