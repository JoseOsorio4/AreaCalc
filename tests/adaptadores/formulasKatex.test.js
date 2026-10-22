// Pruebas de src/adaptadores/formulasKatex.js (T-16; design.md §2, §14.4; requirements R-09.8).
//
// En Node no hay DOM: el elemento y el documento se simulan, y el adaptador recibe un
// KaTeX simulado con crearFormulasKatex. Además se usa el KaTeX real instalado para
// comprobar que rechaza una fórmula inválida sin tocar el texto, que `trust: false` no
// deja pasar \href y que todo el LaTeX que genera la aplicación para los casos de
// referencia es válido (así, en la práctica, W-08 solo aparece si falla la carga).
// La revisión con el fragmento de KaTeX bloqueado en el navegador es manual (tasks T-16).
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import katexReal from 'katex';
import { describe, expect, it, vi } from 'vitest';
import * as adaptadorApp from '../../src/adaptadores/formulasKatex.js';
import { AVISO_W08, OPCIONES_KATEX, crearFormulasKatex } from '../../src/adaptadores/formulasKatex.js';
import { analizarPerfil } from '../../src/casos-de-uso/analizarPerfil.js';
import { calcularFigura } from '../../src/casos-de-uso/calcularFigura.js';
import { estimarMaterial } from '../../src/casos-de-uso/estimarMaterial.js';
import { crearAdvertencia } from '../../src/nucleo/errores.js';
import { pasosEstimacion, pasosFigura, pasosPerfil } from '../../src/presentacion/pasos.js';
import { CASOS } from '../casos-referencia.js';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

// ── DOM mínimo ───────────────────────────────────────────────────────

class NodoTexto {
  constructor(texto) {
    this.texto = texto;
    this.parentNode = null;
  }

  get textContent() {
    return this.texto;
  }
}

class ElementoFalso {
  constructor(documento, etiqueta) {
    this.ownerDocument = documento;
    this.localName = etiqueta;
    this.childNodes = [];
    this.parentNode = null;
    this.atributos = new Map();
    this.raiz = false; // true en el «documento» de la prueba
  }

  get isConnected() {
    let nodo = this;
    while (nodo) {
      if (nodo.raiz) return true;
      nodo = nodo.parentNode;
    }
    return false;
  }

  get textContent() {
    return this.childNodes.map((n) => n.textContent).join('');
  }

  set textContent(texto) {
    this.replaceChildren(String(texto));
  }

  append(...nodos) {
    for (const nodo of nodos) {
      const hijo = typeof nodo === 'string' ? new NodoTexto(nodo) : nodo;
      if (hijo.parentNode) hijo.parentNode.childNodes = hijo.parentNode.childNodes.filter((n) => n !== hijo);
      hijo.parentNode = this;
      this.childNodes.push(hijo);
    }
  }

  replaceChildren(...nodos) {
    for (const hijo of this.childNodes) hijo.parentNode = null;
    this.childNodes = [];
    this.append(...nodos);
  }

  remove() {
    if (this.parentNode) this.parentNode.childNodes = this.parentNode.childNodes.filter((n) => n !== this);
    this.parentNode = null;
  }

  setAttribute(nombre, valor) {
    this.atributos.set(nombre, String(valor));
  }

  getAttribute(nombre) {
    return this.atributos.has(nombre) ? this.atributos.get(nombre) : null;
  }

  hasAttribute(nombre) {
    return this.atributos.has(nombre);
  }

  /** Solo admite el selector que usa el adaptador. */
  querySelectorAll(selector) {
    expect(selector).toBe('[data-latex]');
    const encontrados = [];
    const recorrer = (nodo) => {
      for (const hijo of nodo.childNodes ?? []) {
        if (hijo instanceof ElementoFalso) {
          if (hijo.hasAttribute('data-latex')) encontrados.push(hijo);
          recorrer(hijo);
        }
      }
    };
    recorrer(this);
    return encontrados;
  }
}

function pagina() {
  const documento = { createElement: (etiqueta) => new ElementoFalso(documento, etiqueta) };
  const cuerpo = documento.createElement('body');
  cuerpo.raiz = true;
  /** Un párrafo con la versión en texto, como lo deja la vista (R-09.8). */
  const parrafo = (texto, latex) => {
    const p = documento.createElement('p');
    p.textContent = texto;
    if (latex !== undefined) p.setAttribute('data-latex', latex);
    cuerpo.append(p);
    return p;
  };
  return { documento, cuerpo, parrafo };
}

// ── KaTeX simulado ───────────────────────────────────────────────────

class ParseErrorFalso extends Error {}

/** Escribe «K[latex]» en el destino; con \malo escribe algo a medias y lanza, como un fallo real. */
function katexFalso() {
  return {
    render: vi.fn((latex, destino) => {
      const salida = destino.ownerDocument.createElement('span');
      destino.replaceChildren(salida);
      if (latex.includes('\\malo')) throw new ParseErrorFalso(`KaTeX parse error: ${latex}`);
      salida.textContent = `K[${latex}]`;
    })
  };
}

function diferido() {
  let resolver;
  let rechazar;
  const promesa = new Promise((si, no) => {
    resolver = si;
    rechazar = no;
  });
  return { promesa, resolver, rechazar };
}

function entorno({ cargarModulo, katex = katexFalso() } = {}) {
  const informes = [];
  const cargar = cargarModulo ?? vi.fn(async () => ({ default: katex }));
  const adaptador = crearFormulasKatex({ cargarModulo: cargar, informar: (mensaje, error) => informes.push({ mensaje, error }) });
  return { adaptador, katex, cargar, informes, ...pagina() };
}

const TEXTO = 'F(x) = x⁴/4 − x';
const LATEX = 'F(x) = \\frac{x^{4}}{4} - x';

// ── Contrato ─────────────────────────────────────────────────────────

describe('contrato de mejorar (design §14.4)', () => {
  it('W-08 es el del catálogo (requirements §10)', () => {
    const catalogo = crearAdvertencia('W-08');
    expect(AVISO_W08).toEqual({ codigo: catalogo.codigo, mensaje: catalogo.mensaje });
  });

  it('usa throwOnError: true, trust: false y output: htmlAndMathml', async () => {
    expect(OPCIONES_KATEX).toEqual({ throwOnError: true, trust: false, output: 'htmlAndMathml' });
    const { adaptador, katex, parrafo } = entorno();
    await adaptador.mejorar(parrafo(TEXTO), LATEX);
    expect(katex.render).toHaveBeenCalledWith(LATEX, expect.anything(), OPCIONES_KATEX);
  });

  it('el texto se ve primero; después se reemplaza por la fórmula dibujada en un elemento temporal', async () => {
    const { adaptador, katex, parrafo } = entorno();
    const p = parrafo(TEXTO);
    const promesa = adaptador.mejorar(p, LATEX);
    expect(p.textContent).toBe(TEXTO); // mientras KaTeX carga
    expect(await promesa).toEqual({ estado: 'mejorada' });
    expect(katex.render.mock.calls[0][1]).not.toBe(p); // nunca dibuja directamente en el original
    expect(p.textContent).toBe(`K[${LATEX}]`);
    expect(p.getAttribute('data-katex')).toBe('mejorada');
  });

  it('sin LaTeX (paso solo textual) no hace nada ni avisa', async () => {
    const { adaptador, katex, cargar, parrafo } = entorno();
    const p = parrafo(TEXTO);
    expect(await adaptador.mejorar(p, null)).toEqual({ estado: 'omitida' });
    expect(await adaptador.mejorar(p, '')).toEqual({ estado: 'omitida' });
    expect(p.textContent).toBe(TEXTO);
    expect(katex.render).not.toHaveBeenCalled();
    expect(cargar).not.toHaveBeenCalled();
  });

  it('la carga de KaTeX se comparte entre fórmulas', async () => {
    const { adaptador, cargar, parrafo } = entorno();
    await Promise.all([adaptador.mejorar(parrafo('a'), 'a'), adaptador.mejorar(parrafo('b'), 'b')]);
    await adaptador.mejorar(parrafo('c'), 'c');
    expect(cargar).toHaveBeenCalledTimes(1);
  });

  it('las funciones de la aplicación existen y la carga es diferida, con el CSS local de KaTeX', () => {
    for (const nombre of ['mejorar', 'mejorarDentro', 'cancelar']) expect(typeof adaptadorApp[nombre]).toBe('function');
    const codigo = readFileSync(join(RAIZ, 'src', 'adaptadores', 'formulasKatex.js'), 'utf8');
    expect(codigo).toContain("import('katex')");
    expect(codigo).toContain("import('katex/dist/katex.min.css')");
    expect(codigo).not.toMatch(/^import\b/m);
  });
});

// ── Respaldo textual y W-08 (R-09.8) ─────────────────────────────────

describe('si KaTeX falla, queda el texto y se informa W-08', () => {
  it('fallo de carga (KaTeX o su CSS bloqueados): texto intacto, W-08 y nuevo intento después', async () => {
    const katex = katexFalso();
    const cargar = vi.fn()
      .mockRejectedValueOnce(new Error('Failed to fetch dynamically imported module: katex.min.css'))
      .mockResolvedValue({ default: katex });
    const { adaptador, informes, parrafo } = entorno({ cargarModulo: cargar, katex });
    const p = parrafo(TEXTO);
    expect(await adaptador.mejorar(p, LATEX)).toEqual({ estado: 'fallida', etapa: 'carga', aviso: AVISO_W08 });
    expect(p.textContent).toBe(TEXTO);
    expect(p.getAttribute('data-katex')).toBe('fallida'); // marca para el aviso de la sección (T-17)
    expect(informes).toHaveLength(1);
    expect(await adaptador.mejorar(p, LATEX)).toEqual({ estado: 'mejorada' });
    expect(p.getAttribute('data-katex')).toBe('mejorada');
    expect(cargar).toHaveBeenCalledTimes(2);
  });

  it('un error síncrono del cargador o un módulo sin render también dan W-08', async () => {
    const sincrono = entorno({
      cargarModulo: () => {
        throw new Error('import() no disponible');
      }
    });
    const p = sincrono.parrafo(TEXTO);
    expect((await sincrono.adaptador.mejorar(p, LATEX)).aviso).toBe(AVISO_W08);
    const vacio = entorno({ cargarModulo: async () => ({ default: {} }) });
    const q = vacio.parrafo(TEXTO);
    expect(await vacio.adaptador.mejorar(q, LATEX)).toEqual({ estado: 'fallida', etapa: 'carga', aviso: AVISO_W08 });
    expect([p.textContent, q.textContent]).toEqual([TEXTO, TEXTO]);
  });

  it('fórmula rechazada: lo que KaTeX escribió a medias queda en el temporal, no en el elemento', async () => {
    const { adaptador, parrafo } = entorno();
    const p = parrafo(TEXTO);
    const antes = [...p.childNodes];
    expect(await adaptador.mejorar(p, '\\malo{')).toEqual({ estado: 'fallida', etapa: 'formula', aviso: AVISO_W08 });
    expect(p.childNodes).toEqual(antes);
    expect(p.textContent).toBe(TEXTO);
  });

  it('con el KaTeX real, un LaTeX inválido lanza ParseError y el texto se conserva', async () => {
    const { adaptador, informes, parrafo } = entorno({ cargarModulo: () => import('katex') });
    const p = parrafo(TEXTO);
    expect(await adaptador.mejorar(p, '\\frac{1}{')).toEqual({ estado: 'fallida', etapa: 'formula', aviso: AVISO_W08 });
    expect(p.textContent).toBe(TEXTO);
    expect(informes[0].error).toBeInstanceOf(katexReal.ParseError);
  });

  it('datos inválidos y elemento ausente no rechazan la promesa', async () => {
    const { adaptador, parrafo } = entorno();
    expect(await adaptador.mejorar(parrafo(TEXTO), 42)).toEqual({ estado: 'fallida', etapa: 'datos', aviso: AVISO_W08 });
    expect(await adaptador.mejorar(null, LATEX)).toEqual({ estado: 'fallida', etapa: 'interna', aviso: AVISO_W08 });
    expect(() => adaptador.cancelar(null)).not.toThrow();
  });
});

// ── Operaciones pendientes ───────────────────────────────────────────

describe('una mejora pendiente no pisa una fórmula nueva ni toca contenido retirado', () => {
  function conCargaLenta() {
    const carga = diferido();
    const katex = katexFalso();
    const datos = entorno({ cargarModulo: () => carga.promesa, katex });
    return { ...datos, terminarCarga: () => carga.resolver({ default: katex }), fallarCarga: (e) => carga.rechazar(e) };
  }

  it('dos mejoras seguidas del mismo elemento: gana la última', async () => {
    const { adaptador, katex, parrafo, terminarCarga } = conCargaLenta();
    const p = parrafo(TEXTO);
    const vieja = adaptador.mejorar(p, 'vieja');
    const nueva = adaptador.mejorar(p, 'nueva');
    terminarCarga();
    expect(await vieja).toEqual({ estado: 'cancelada' });
    expect(await nueva).toEqual({ estado: 'mejorada' });
    expect(katex.render).toHaveBeenCalledTimes(1);
    expect(p.textContent).toBe('K[nueva]');
  });

  it('una mejora sin LaTeX posterior también invalida la pendiente', async () => {
    const { adaptador, katex, parrafo, terminarCarga } = conCargaLenta();
    const p = parrafo(TEXTO);
    const vieja = adaptador.mejorar(p, LATEX);
    expect(await adaptador.mejorar(p, null)).toEqual({ estado: 'omitida' });
    terminarCarga();
    expect(await vieja).toEqual({ estado: 'cancelada' });
    expect(katex.render).not.toHaveBeenCalled();
    expect(p.textContent).toBe(TEXTO);
  });

  it('si la vista retira el elemento al editar, la mejora pendiente no lo modifica ni avisa', async () => {
    const { adaptador, katex, informes, parrafo, terminarCarga } = conCargaLenta();
    const p = parrafo(TEXTO);
    const promesa = adaptador.mejorar(p, LATEX);
    p.remove(); // vistaPerfil reemplaza el panel al cambiar el resultado
    terminarCarga();
    expect(await promesa).toEqual({ estado: 'cancelada' });
    expect(katex.render).not.toHaveBeenCalled();
    expect(p.textContent).toBe(TEXTO);
    expect(p.parentNode).toBeNull();
    expect(informes).toEqual([]);
  });

  it('elemento retirado y carga fallida: tampoco hay W-08 de un paso que ya no se ve', async () => {
    const { adaptador, parrafo, fallarCarga, informes } = conCargaLenta();
    const p = parrafo(TEXTO);
    const promesa = adaptador.mejorar(p, LATEX);
    p.remove();
    fallarCarga(new Error('bloqueado'));
    expect(await promesa).toEqual({ estado: 'cancelada' });
    expect(informes).toEqual([]);
  });

  it('cancelar(elemento) invalida la mejora pendiente', async () => {
    const { adaptador, parrafo, terminarCarga } = conCargaLenta();
    const p = parrafo(TEXTO);
    const promesa = adaptador.mejorar(p, LATEX);
    adaptador.cancelar(p);
    terminarCarga();
    expect(await promesa).toEqual({ estado: 'cancelada' });
    expect(p.textContent).toBe(TEXTO);
  });
});

// ── mejorarDentro: un solo W-08 por raíz ─────────────────────────────

describe('mejorarDentro(raiz)', () => {
  it('mejora cada [data-latex], deja el resto como texto y resume con un solo W-08', async () => {
    const { adaptador, katex, cuerpo, parrafo } = entorno();
    const a = parrafo('a', 'a');
    const malo = parrafo('texto del paso', '\\malo{');
    const b = parrafo('b', 'b');
    // Texto escrito por el usuario, sin data-latex: nunca se interpreta como LaTeX.
    const usuario = parrafo('\\frac{1}{2} escrito por el usuario');
    const resumen = await adaptador.mejorarDentro(cuerpo);
    expect(resumen).toEqual({ total: 3, mejoradas: 2, fallidas: 1, canceladas: 0, aviso: AVISO_W08 });
    expect([a.textContent, malo.textContent, b.textContent]).toEqual(['K[a]', 'texto del paso', 'K[b]']);
    expect(usuario.textContent).toBe('\\frac{1}{2} escrito por el usuario');
    expect(katex.render.mock.calls.map(([latex]) => latex)).toEqual(['a', '\\malo{', 'b']);
  });

  it('sin fallos no hay aviso; con la carga bloqueada, todas fallan y el aviso es uno', async () => {
    const bien = entorno();
    bien.parrafo('a', 'a');
    expect((await bien.adaptador.mejorarDentro(bien.cuerpo)).aviso).toBeNull();
    const mal = entorno({ cargarModulo: () => Promise.reject(new Error('bloqueado')) });
    for (const t of ['a', 'b', 'c']) mal.parrafo(t, t);
    const resumen = await mal.adaptador.mejorarDentro(mal.cuerpo);
    expect(resumen).toMatchObject({ total: 3, mejoradas: 0, fallidas: 3, aviso: AVISO_W08 });
    expect(mal.cuerpo.textContent).toBe('abc');
  });

  it('no vuelve a procesar fórmulas ya mejoradas, fallidas ni en curso (T-17)', async () => {
    const carga = diferido();
    const katex = katexFalso();
    const { adaptador, cuerpo, parrafo } = entorno({ cargarModulo: () => carga.promesa, katex });
    parrafo('a', 'a');
    parrafo('malo', '\\malo{');
    const primera = adaptador.mejorarDentro(cuerpo);
    // Un repintado mientras la primera sigue en curso no las repite.
    const mientras = adaptador.mejorarDentro(cuerpo);
    carga.resolver({ default: katex });
    expect(await mientras).toMatchObject({ total: 0, aviso: null });
    expect(await primera).toMatchObject({ total: 2, mejoradas: 1, fallidas: 1 });
    // Después, ni la mejorada ni la fallida se vuelven a dibujar; un elemento nuevo, sí.
    const nuevo = parrafo('b', 'b');
    expect(await adaptador.mejorarDentro(cuerpo)).toMatchObject({ total: 1, mejoradas: 1, aviso: null });
    expect(nuevo.textContent).toBe('K[b]');
    expect(katex.render).toHaveBeenCalledTimes(3);
  });

  it('una raíz inválida da W-08 sin rechazar', async () => {
    const { adaptador } = entorno();
    expect((await adaptador.mejorarDentro(null)).aviso).toBe(AVISO_W08);
  });
});

// ── KaTeX real ───────────────────────────────────────────────────────

describe('KaTeX real con las opciones de design §14.4', () => {
  const dibujar = (latex) => katexReal.renderToString(latex, { ...OPCIONES_KATEX });

  it('trust: false no genera enlaces con \\href', () => {
    expect(dibujar('\\href{javascript:alert(1)}{x}')).not.toMatch(/href="javascript/);
  });

  /** Todo el LaTeX que la aplicación genera para los casos de referencia. */
  function latexDeLaAplicacion() {
    const latex = [];
    for (const id of ['CR-01', 'CR-02', 'CR-03', 'CR-05', 'CR-06', 'CR-07', 'CR-08', 'CR-14', 'CR-15', 'CR-31']) {
      const entrada = CASOS[id].entrada ?? CASOS[id].entradas[0];
      const resultado = analizarPerfil({ interpretacion: 'abstracta', ...entrada }).valor;
      latex.push(`f(x) = ${resultado.modelo.latexNormalizado}`); // vistaPerfil
      const pasos = pasosPerfil(resultado);
      latex.push(...[...pasos.area, ...pasos.promedio].map((p) => p.latex));
    }
    const fisico = analizarPerfil({ ...CASOS['CR-03'].entrada, interpretacion: 'fisica' }).valor;
    const { textoPrecio, textoAdicional } = CASOS['CR-03'].entrada;
    const estimacion = estimarMaterial({ fuente: { tipo: 'perfil', resultado: fisico }, textoPrecio, textoAdicional }).valor;
    latex.push(...pasosEstimacion(estimacion).map((p) => p.latex));
    for (const entrada of [CASOS['CR-09'].entrada, CASOS['CR-10'].entrada, { tipo: 'circulo', unidad: 'm', radio: '5' },
      { tipo: 'triangulo', unidad: 'cm', base: '4', altura: '3' }]) {
      const figura = calcularFigura(entrada).valor;
      latex.push(figura.formula.latex, ...pasosFigura(figura).map((p) => p.latex));
    }
    return latex.filter((l) => l !== null);
  }

  it('todo el LaTeX generado para los casos de referencia es válido para KaTeX', () => {
    const lista = latexDeLaAplicacion();
    expect(lista.length).toBeGreaterThan(100);
    const invalidos = lista.filter((l) => {
      try {
        dibujar(l);
        return false;
      } catch {
        return true;
      }
    });
    expect(invalidos).toEqual([]);
  });
});
