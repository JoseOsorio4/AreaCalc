// Pruebas de src/adaptadores/graficaPlotly.js (T-15; design.md §2, §12, §13 y §14.3; R-10).
//
// Se ejecutan en Node, sin navegador: Plotly, el DOM del contenedor, ResizeObserver y
// los fotogramas se simulan, y el adaptador los recibe con crearGraficaPlotly. Los
// DatosGrafica son reales (analizarPerfil + datosGrafica). Lo que se comprueba:
// traducción a trazas y formas, carga diferida y precarga, W-07 ante cualquier fallo,
// que limpiar() cancela lo pendiente y libera el observador, y el ajuste de ancho.
// La revisión con el fragmento real de Plotly bloqueado es manual (tasks T-15).
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import * as adaptadorApp from '../../src/adaptadores/graficaPlotly.js';
import {
  AVISO_W07, LEYENDA, crearGraficaPlotly, figuraPlotly, sonDibujables
} from '../../src/adaptadores/graficaPlotly.js';
import { analizarPerfil } from '../../src/casos-de-uso/analizarPerfil.js';
import { crearAdvertencia } from '../../src/nucleo/errores.js';
import { datosGrafica } from '../../src/presentacion/datosGrafica.js';
import { CASOS } from '../casos-referencia.js';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

// ── Datos reales ─────────────────────────────────────────────────────

function datosDe(entrada) {
  const resultado = analizarPerfil({ interpretacion: 'abstracta', ...entrada });
  expect(resultado.ok).toBe(true);
  const salida = datosGrafica(resultado.valor);
  expect(salida.datos).not.toBeNull();
  return salida.datos;
}

const CR03 = datosDe(CASOS['CR-03'].entrada); // f > 0, con rectángulo
const CR05 = datosDe(CASOS['CR-05'].entrada); // cambio de signo
const CR08 = datosDe(CASOS['CR-08'].entrada); // f ≡ 0
const CR14 = datosDe(CASOS['CR-14'].entrada); // cuatro tramos

// ── DOM mínimo ───────────────────────────────────────────────────────

function quitar(nodo) {
  const padre = nodo.parentNode;
  if (padre) {
    padre.childNodes = padre.childNodes.filter((hijo) => hijo !== nodo);
    nodo.parentNode = null;
  }
}

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
    this.style = {};
  }

  get children() {
    return this.childNodes.filter((nodo) => nodo instanceof ElementoFalso);
  }

  get textContent() {
    return this.childNodes.map((nodo) => nodo.textContent).join('');
  }

  set textContent(texto) {
    this.replaceChildren(String(texto));
  }

  append(...nodos) {
    for (const nodo of nodos) {
      const hijo = typeof nodo === 'string' ? new NodoTexto(nodo) : nodo;
      quitar(hijo);
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
    quitar(this);
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

  removeAttribute(nombre) {
    this.atributos.delete(nombre);
  }
}

function documentoFalso() {
  const documento = { createElement: (etiqueta) => new ElementoFalso(documento, etiqueta) };
  return documento;
}

const conClase = (contenedor, clase) => contenedor.children.filter((hijo) => hijo.getAttribute('class') === clase);
const lienzoDe = (contenedor) => conClase(contenedor, 'grafica__lienzo')[0] ?? null;
const avisoDe = (contenedor) => conClase(contenedor, 'grafica__aviso')[0] ?? null;

// ── Plotly, observador y fotogramas simulados ────────────────────────

function diferido() {
  let resolver;
  let rechazar;
  const promesa = new Promise((si, no) => {
    resolver = si;
    rechazar = no;
  });
  return { promesa, resolver, rechazar };
}

/** Deja correr las microtareas y los temporizadores pendientes. */
const esperar = () => new Promise((listo) => setTimeout(listo, 0));

function plotlyFalso() {
  return {
    react: vi.fn(async (lienzo, data, layout, config) => {
      lienzo.dibujo = { data, layout, config };
    }),
    purge: vi.fn((lienzo) => {
      delete lienzo.dibujo;
    }),
    Plots: { resize: vi.fn(async () => {}) }
  };
}

function entorno({ api = plotlyFalso(), cargarModulo, ceder = () => Promise.resolve() } = {}) {
  const observadores = [];
  const marcos = [];
  const informes = [];
  const cargar = cargarModulo ?? vi.fn(async () => ({ default: api }));
  const adaptador = crearGraficaPlotly({
    cargarModulo: cargar,
    ceder,
    crearObservador: (alCambiar) => {
      const observador = {
        alCambiar,
        observados: [],
        observe(elemento) {
          this.observados.push(elemento);
        },
        disconnect: vi.fn()
      };
      observadores.push(observador);
      return observador;
    },
    programar: (tarea) => {
      const marco = { tarea, cancelado: false };
      marcos.push(marco);
      return () => {
        marco.cancelado = true;
      };
    },
    informar: (mensaje, error) => informes.push({ mensaje, error })
  });
  const contenedor = documentoFalso().createElement('figure');
  /** Ejecuta los fotogramas no cancelados, como el navegador. */
  const fotograma = () => {
    for (const marco of marcos.splice(0)) if (!marco.cancelado) marco.tarea();
  };
  return { adaptador, api, cargar, observadores, marcos, informes, contenedor, fotograma };
}

const tamano = (width, height = 380) => [{ contentRect: { width, height } }];

// ── Traducción a Plotly ──────────────────────────────────────────────

describe('figuraPlotly: DatosGrafica → trazas y formas (design §14.3)', () => {
  it('configuración sin barra de herramientas ni logotipo, y adaptable', () => {
    expect(figuraPlotly(CR05).config).toMatchObject({ responsive: true, displaylogo: false, displayModeBar: false });
  });

  it('CR-05: regiones con relleno y leyenda por signo, curva y marcador del cero', () => {
    const { data } = figuraPlotly(CR05);
    const regiones = data.filter((traza) => traza.fill === 'tozeroy');
    expect(regiones.map((r) => r.name)).toEqual([LEYENDA.negativo, LEYENDA.positivo]);
    expect(LEYENDA).toEqual({ positivo: 'Sobre el eje (+)', negativo: 'Bajo el eje (−)' }); // tasks T-15
    expect(regiones.map((r) => r.showlegend)).toEqual([true, true]);
    expect(regiones.every((r) => r.type === 'scatter')).toBe(true);
    expect(regiones[0].x).toEqual(CR05.regiones[0].x);
    expect(regiones[0].y).toEqual(CR05.regiones[0].y);
    expect(regiones[0].fillcolor).not.toBe(regiones[1].fillcolor);

    const curva = data.find((traza) => traza.name === 'f(x)');
    expect(curva).toMatchObject({ type: 'scatter', mode: 'lines' });
    expect(curva.x).toEqual(CR05.curva.x);
    expect(curva.y).toEqual(CR05.curva.y);

    const ceros = data.find((traza) => traza.mode === 'markers');
    expect(ceros.x).toEqual([0]);
    expect(ceros.y).toEqual([0]);
    expect(ceros.text).toEqual(['x = 0 (exacto)']);
  });

  it('CR-14: cada signo aparece una sola vez en la leyenda', () => {
    const regiones = figuraPlotly(CR14).data.filter((traza) => traza.fill === 'tozeroy');
    expect(regiones.map((r) => [r.legendgroup, r.showlegend])).toEqual([
      ['negativo', true], ['positivo', true], ['negativo', false], ['positivo', false]
    ]);
  });

  it('CR-05: línea discontinua del promedio, sin rectángulo, ejes con unidades y rango', () => {
    const { layout } = figuraPlotly(CR05);
    expect(layout.shapes).toHaveLength(1);
    expect(layout.shapes[0]).toMatchObject({ type: 'line', y0: CR05.promedio.y, y1: CR05.promedio.y, name: 'f_prom = 0 u' });
    expect(layout.shapes[0].line.dash).toBe('dash');
    expect(layout.xaxis.title.text).toBe('x (u)');
    expect(layout.yaxis.title.text).toBe('f(x) (u)');
    expect(layout.xaxis.range).toEqual(CR05.rango.x);
    expect(layout.yaxis.range).toEqual(CR05.rango.y);
  });

  it('CR-03: rectángulo equivalente con contorno discontinuo y sin relleno (R-10.3)', () => {
    const { data, layout } = figuraPlotly(CR03);
    const rect = layout.shapes.find((forma) => forma.type === 'rect');
    expect(rect).toMatchObject({ x0: 0, x1: 4, y0: 0, y1: CR03.rectangulo.altura, fillcolor: 'rgba(0, 0, 0, 0)' });
    expect(rect.line.dash).toBeDefined();
    expect(layout.shapes.find((forma) => forma.type === 'line').label.text).toBe('f_prom = 10/3 m');
    expect(data.some((traza) => traza.mode === 'markers')).toBe(false); // sin ceros
  });

  it('CR-08: f ≡ 0 no sombrea regiones', () => {
    const { data } = figuraPlotly(CR08);
    expect(data.filter((traza) => traza.fill === 'tozeroy')).toEqual([]);
    expect(data.map((traza) => traza.name)).toEqual(['f(x)']);
  });

  it('sin anotaciones «+» y «−» en los tramos (pospuestas a T-D3)', () => {
    for (const datos of [CR03, CR05, CR14]) expect(figuraPlotly(datos).layout.annotations).toBeUndefined();
  });

  it('sonDibujables rechaza datos ausentes, incompletos o no finitos', () => {
    expect(sonDibujables(CR05)).toBe(true);
    expect(sonDibujables(null)).toBe(false);
    expect(sonDibujables({ ...CR05, curva: { x: [0, 1], y: [0, Number.NaN] } })).toBe(false);
    expect(sonDibujables({ ...CR05, promedio: { y: Number.POSITIVE_INFINITY, etiqueta: '' } })).toBe(false);
    expect(sonDibujables({ ...CR05, rango: { x: CR05.rango.x, y: [1, -1] } })).toBe(false);
    expect(sonDibujables({ ...CR03, rectangulo: { x0: 0, x1: 4, altura: Number.NEGATIVE_INFINITY } })).toBe(false);
    expect(sonDibujables({ ...CR05, regiones: [{ x: [0, 1], y: [0, 1], signo: 2 }] })).toBe(false);
  });
});

// ── Dibujo, carga diferida y precarga ────────────────────────────────

describe('dibujar y precargar', () => {
  it('dibuja con Plotly.react en un lienzo propio y observa el contenedor', async () => {
    const { adaptador, api, observadores, contenedor } = entorno();
    const resultado = await adaptador.dibujar(contenedor, CR05);
    expect(resultado).toEqual({ estado: 'dibujada' });
    const lienzo = lienzoDe(contenedor);
    expect(lienzo).not.toBeNull();
    expect(contenedor.children).toEqual([lienzo]);
    expect(lienzo.getAttribute('role')).toBe('img');
    expect(lienzo.getAttribute('aria-label')).toBe(CR05.descripcion);
    expect(lienzo.style.width).toBe('100%');
    const figura = figuraPlotly(CR05);
    expect(api.react).toHaveBeenCalledTimes(1);
    expect(api.react).toHaveBeenCalledWith(lienzo, figura.data, figura.layout, figura.config);
    expect(contenedor.hasAttribute('aria-busy')).toBe(false);
    expect(observadores).toHaveLength(1);
    expect(observadores[0].observados).toEqual([contenedor]);
  });

  it('muestra «Preparando la gráfica…» mientras Plotly carga', async () => {
    const carga = diferido();
    const api = plotlyFalso();
    const { adaptador, contenedor } = entorno({ api, cargarModulo: vi.fn(() => carga.promesa) });
    const promesa = adaptador.dibujar(contenedor, CR05);
    expect(avisoDe(contenedor).textContent).toContain('Preparando la gráfica');
    expect(contenedor.getAttribute('aria-busy')).toBe('true');
    carga.resolver({ default: api });
    expect(await promesa).toEqual({ estado: 'dibujada' });
    expect(avisoDe(contenedor)).toBeNull();
  });

  it('la precarga y los dibujos comparten una sola carga del módulo', async () => {
    const { adaptador, cargar, contenedor } = entorno();
    expect(await adaptador.precargar()).toBe(true);
    await adaptador.dibujar(contenedor, CR05);
    await adaptador.dibujar(contenedor, CR03);
    expect(cargar).toHaveBeenCalledTimes(1);
  });

  it('acepta el módulo con o sin exportación por defecto', async () => {
    const api = plotlyFalso();
    const { adaptador, contenedor } = entorno({ api, cargarModulo: async () => api });
    expect(await adaptador.dibujar(contenedor, CR05)).toEqual({ estado: 'dibujada' });
  });

  it('redibujar el mismo contenedor reutiliza el lienzo y renueva el observador', async () => {
    const { adaptador, api, observadores, contenedor } = entorno();
    await adaptador.dibujar(contenedor, CR05);
    await adaptador.dibujar(contenedor, CR03);
    expect(api.react).toHaveBeenCalledTimes(2);
    expect(api.react.mock.calls[0][0]).toBe(api.react.mock.calls[1][0]);
    expect(contenedor.children).toHaveLength(1);
    expect(observadores[0].disconnect).toHaveBeenCalled();
    expect(observadores).toHaveLength(2);
  });

  it('las funciones de la aplicación existen y limpiar no lanza sin un dibujo previo', () => {
    for (const nombre of ['dibujar', 'limpiar', 'precargar', 'programarPrecarga']) expect(typeof adaptadorApp[nombre]).toBe('function');
    expect(() => adaptadorApp.limpiar(documentoFalso().createElement('figure'))).not.toThrow();
  });

  it('la carga es diferida: Plotly solo se importa con import() dentro del adaptador', () => {
    const codigo = readFileSync(join(RAIZ, 'src', 'adaptadores', 'graficaPlotly.js'), 'utf8');
    expect(codigo).toContain("import('plotly.js-basic-dist-min')");
    expect(codigo).not.toMatch(/^import\b/m);
    expect(codigo).toMatch(/\.react\(/);
    expect(codigo).toMatch(/\.purge\(/);
  });
});

// ── W-07 ante cualquier fallo (R-10.6) ───────────────────────────────

describe('W-07: fallos de carga, de dibujo y de datos', () => {
  it('el texto de W-07 es el del catálogo (requirements §10)', () => {
    const catalogo = crearAdvertencia('W-07');
    expect(AVISO_W07).toEqual({ codigo: catalogo.codigo, mensaje: catalogo.mensaje });
  });

  it('si Plotly no carga: aviso W-07 en el contenedor, promesa resuelta y nuevo intento después', async () => {
    const api = plotlyFalso();
    const cargar = vi.fn().mockRejectedValueOnce(new Error('fragmento bloqueado')).mockResolvedValue({ default: api });
    const { adaptador, contenedor, informes, observadores } = entorno({ api, cargarModulo: cargar });
    const resultado = await adaptador.dibujar(contenedor, CR05);
    expect(resultado).toEqual({ estado: 'fallida', etapa: 'carga', aviso: AVISO_W07 });
    const aviso = avisoDe(contenedor);
    expect(aviso.getAttribute('role')).toBe('status');
    expect(aviso.textContent).toContain(`W-07: ${AVISO_W07.mensaje}`);
    expect(lienzoDe(contenedor)).toBeNull();
    expect(contenedor.hasAttribute('aria-busy')).toBe(false);
    expect(api.react).not.toHaveBeenCalled();
    expect(observadores).toHaveLength(0);
    expect(informes).toHaveLength(1);
    // La carga fallida no queda guardada: el siguiente dibujo vuelve a intentarlo.
    expect(await adaptador.dibujar(contenedor, CR05)).toEqual({ estado: 'dibujada' });
    expect(cargar).toHaveBeenCalledTimes(2);
    expect(avisoDe(contenedor)).toBeNull();
  });

  it('precargar resuelve false si la carga falla, sin rechazar', async () => {
    const { adaptador, informes } = entorno({ cargarModulo: () => Promise.reject(new Error('sin red')) });
    expect(await adaptador.precargar()).toBe(false);
    expect(informes).toHaveLength(1);
  });

  it('un error síncrono del cargador también se convierte en W-07', async () => {
    const { adaptador, contenedor } = entorno({
      cargarModulo: () => {
        throw new Error('import() no disponible');
      }
    });
    expect((await adaptador.dibujar(contenedor, CR05)).estado).toBe('fallida');
    expect(avisoDe(contenedor).textContent).toContain('W-07');
  });

  it('un módulo sin Plotly.react ni Plotly.purge da W-07', async () => {
    const { adaptador, contenedor } = entorno({ cargarModulo: async () => ({ default: {} }) });
    expect(await adaptador.dibujar(contenedor, CR05)).toEqual({ estado: 'fallida', etapa: 'carga', aviso: AVISO_W07 });
  });

  it('si Plotly.react falla: W-07, purga y retira el lienzo', async () => {
    const api = plotlyFalso();
    api.react.mockRejectedValue(new Error('fallo al dibujar'));
    const { adaptador, contenedor } = entorno({ api });
    const resultado = await adaptador.dibujar(contenedor, CR05);
    expect(resultado).toEqual({ estado: 'fallida', etapa: 'dibujo', aviso: AVISO_W07 });
    const lienzo = api.react.mock.calls[0][0];
    expect(api.purge).toHaveBeenCalledWith(lienzo);
    expect(lienzo.parentNode).toBeNull();
    expect(avisoDe(contenedor).textContent).toContain('W-07');
  });

  it.each([
    ['null (datosGrafica devolvió W-07)', null],
    ['un valor NaN en la curva', { ...CR05, curva: { x: [0, 1], y: [0, Number.NaN] } }],
    ['un rango infinito', { ...CR05, rango: { x: [0, Number.POSITIVE_INFINITY], y: CR05.rango.y } }]
  ])('datos no dibujables (%s): W-07 sin cargar Plotly', async (_, datos) => {
    const { adaptador, api, cargar, contenedor } = entorno();
    expect(await adaptador.dibujar(contenedor, datos)).toEqual({ estado: 'fallida', etapa: 'datos', aviso: AVISO_W07 });
    expect(cargar).not.toHaveBeenCalled();
    expect(api.react).not.toHaveBeenCalled();
    expect(avisoDe(contenedor).textContent).toContain('W-07');
  });

  it('un contenedor inválido no rechaza la promesa', async () => {
    const { adaptador, informes } = entorno();
    expect(await adaptador.dibujar(null, CR05)).toEqual({ estado: 'fallida', etapa: 'interna', aviso: AVISO_W07 });
    expect(informes).toHaveLength(1);
  });

  it('limpiar retira el aviso W-07', async () => {
    const { adaptador, contenedor } = entorno({ cargarModulo: () => Promise.reject(new Error('bloqueado')) });
    await adaptador.dibujar(contenedor, CR05);
    adaptador.limpiar(contenedor);
    expect(contenedor.childNodes).toEqual([]);
  });
});

// ── Cancelación: nada viejo reaparece (design §12; CR-13 y CR-22) ────

describe('limpiar() y dibujos pendientes', () => {
  it('limpiar durante la carga: no se dibuja nada y el contenedor queda vacío', async () => {
    const carga = diferido();
    const api = plotlyFalso();
    const { adaptador, contenedor, observadores } = entorno({ api, cargarModulo: () => carga.promesa });
    const promesa = adaptador.dibujar(contenedor, CR05);
    adaptador.limpiar(contenedor);
    expect(contenedor.childNodes).toEqual([]);
    expect(contenedor.hasAttribute('aria-busy')).toBe(false);
    carga.resolver({ default: api });
    expect(await promesa).toEqual({ estado: 'cancelada' });
    expect(api.react).not.toHaveBeenCalled();
    expect(contenedor.childNodes).toEqual([]);
    expect(observadores).toHaveLength(0);
  });

  it('limpiar durante la carga y después fallo de carga: no aparece W-07 de un dibujo ya retirado', async () => {
    const carga = diferido();
    const { adaptador, contenedor } = entorno({ cargarModulo: () => carga.promesa });
    const promesa = adaptador.dibujar(contenedor, CR05);
    adaptador.limpiar(contenedor);
    carga.rechazar(new Error('bloqueado'));
    expect(await promesa).toEqual({ estado: 'cancelada' });
    expect(contenedor.childNodes).toEqual([]);
  });

  it('limpiar mientras Plotly dibuja: al terminar, el lienzo viejo se purga y no vuelve', async () => {
    const api = plotlyFalso();
    const dibujo = diferido();
    // Como Plotly: parte del dibujo termina después, al resolverse la promesa.
    api.react.mockImplementation((lienzo, data) => dibujo.promesa.then(() => {
      lienzo.dibujo = { data };
    }));
    const { adaptador, contenedor, observadores } = entorno({ api });
    const promesa = adaptador.dibujar(contenedor, CR05);
    await esperar();
    expect(api.react).toHaveBeenCalledTimes(1);
    const lienzo = api.react.mock.calls[0][0];
    adaptador.limpiar(contenedor);
    expect(api.purge).toHaveBeenCalledWith(lienzo);
    expect(contenedor.childNodes).toEqual([]);
    dibujo.resolver();
    expect(await promesa).toEqual({ estado: 'cancelada' });
    expect(lienzo.dibujo).toBeUndefined(); // se volvió a purgar al terminar
    expect(lienzo.parentNode).toBeNull();
    expect(api.purge).toHaveBeenCalledTimes(2);
    expect(observadores).toHaveLength(0);
  });

  it('dos dibujos seguidos con la carga pendiente: solo se dibuja el último', async () => {
    const carga = diferido();
    const api = plotlyFalso();
    const cargar = vi.fn(() => carga.promesa);
    const { adaptador, contenedor } = entorno({ api, cargarModulo: cargar });
    const primero = adaptador.dibujar(contenedor, CR05);
    const segundo = adaptador.dibujar(contenedor, CR03);
    carga.resolver({ default: api });
    expect(await primero).toEqual({ estado: 'cancelada' });
    expect(await segundo).toEqual({ estado: 'dibujada' });
    expect(api.react).toHaveBeenCalledTimes(1);
    expect(api.react.mock.calls[0][1]).toEqual(figuraPlotly(CR03).data);
    expect(cargar).toHaveBeenCalledTimes(1);
    expect(contenedor.children).toHaveLength(1);
  });

  it('limpiar y dibujar de nuevo mientras el primero dibujaba: queda solo el lienzo nuevo', async () => {
    const api = plotlyFalso();
    const primero = diferido();
    api.react.mockImplementationOnce(() => primero.promesa);
    const { adaptador, contenedor } = entorno({ api });
    const viejo = adaptador.dibujar(contenedor, CR05);
    await esperar();
    const lienzoViejo = api.react.mock.calls[0][0];
    adaptador.limpiar(contenedor);
    expect(await adaptador.dibujar(contenedor, CR03)).toEqual({ estado: 'dibujada' });
    primero.resolver();
    expect(await viejo).toEqual({ estado: 'cancelada' });
    const lienzoNuevo = lienzoDe(contenedor);
    expect(lienzoNuevo).not.toBe(lienzoViejo);
    expect(contenedor.children).toEqual([lienzoNuevo]);
    expect(lienzoNuevo.dibujo.data).toEqual(figuraPlotly(CR03).data);
  });

  it('cede un fotograma antes de Plotly.react, para que la vista pinte primero los resultados (T-17)', async () => {
    const fotograma = diferido();
    const api = plotlyFalso();
    const { adaptador, contenedor } = entorno({ api, ceder: () => fotograma.promesa });
    const promesa = adaptador.dibujar(contenedor, CR05);
    await esperar();
    expect(api.react).not.toHaveBeenCalled(); // Plotly ya cargó, pero espera al fotograma
    fotograma.resolver();
    expect(await promesa).toEqual({ estado: 'dibujada' });
    expect(api.react).toHaveBeenCalledTimes(1);
  });

  it('limpiar mientras se espera el fotograma: no se dibuja nada', async () => {
    const fotograma = diferido();
    const api = plotlyFalso();
    const { adaptador, contenedor } = entorno({ api, ceder: () => fotograma.promesa });
    const promesa = adaptador.dibujar(contenedor, CR05);
    await esperar();
    adaptador.limpiar(contenedor);
    fotograma.resolver();
    expect(await promesa).toEqual({ estado: 'cancelada' });
    expect(api.react).not.toHaveBeenCalled();
    expect(contenedor.childNodes).toEqual([]);
  });

  it('limpiar es idempotente y no lanza aunque Plotly.purge falle', async () => {
    const api = plotlyFalso();
    api.purge.mockImplementation(() => {
      throw new Error('purge');
    });
    const { adaptador, contenedor, informes } = entorno({ api });
    await adaptador.dibujar(contenedor, CR05);
    expect(() => adaptador.limpiar(contenedor)).not.toThrow();
    expect(() => adaptador.limpiar(contenedor)).not.toThrow();
    expect(contenedor.childNodes).toEqual([]);
    expect(informes.length).toBeGreaterThan(0);
  });
});

// ── Ancho: ventana y menú lateral ────────────────────────────────────

describe('ajuste al ancho del contenedor (menú lateral y ventana)', () => {
  it('la primera medida no redibuja; un cambio de ancho pide Plots.resize una vez por fotograma', async () => {
    const { adaptador, api, observadores, marcos, contenedor, fotograma } = entorno();
    await adaptador.dibujar(contenedor, CR05);
    const [observador] = observadores;
    observador.alCambiar(tamano(800));
    expect(marcos).toHaveLength(0);
    // Al contraer el menú, el contenido se ensancha durante la transición.
    observador.alCambiar(tamano(860));
    observador.alCambiar(tamano(900));
    expect(marcos).toHaveLength(1);
    fotograma();
    await esperar();
    expect(api.Plots.resize).toHaveBeenCalledTimes(1);
    expect(api.Plots.resize).toHaveBeenCalledWith(lienzoDe(contenedor));
    // Un cambio de alto (ventana más estrecha) también ajusta.
    observador.alCambiar(tamano(900, 300));
    fotograma();
    await esperar();
    expect(api.Plots.resize).toHaveBeenCalledTimes(2);
  });

  it('una sección oculta (ancho 0) no ajusta; al volver a verse con otro ancho, sí', async () => {
    const { adaptador, api, observadores, contenedor, fotograma } = entorno();
    await adaptador.dibujar(contenedor, CR05);
    const [observador] = observadores;
    observador.alCambiar(tamano(800));
    observador.alCambiar(tamano(0, 0));
    fotograma();
    await esperar();
    expect(api.Plots.resize).not.toHaveBeenCalled();
    observador.alCambiar(tamano(700));
    fotograma();
    await esperar();
    expect(api.Plots.resize).toHaveBeenCalledTimes(1);
  });

  it('dibujada con la sección oculta (primera medida 0): al verse, se ajusta al ancho real', async () => {
    const { adaptador, api, observadores, contenedor, fotograma } = entorno();
    await adaptador.dibujar(contenedor, CR05);
    const [observador] = observadores;
    observador.alCambiar(tamano(0, 0));
    observador.alCambiar(tamano(557));
    fotograma();
    await esperar();
    expect(api.Plots.resize).toHaveBeenCalledTimes(1);
  });

  it('un rechazo de Plots.resize no deja promesas sin atender', async () => {
    const api = plotlyFalso();
    api.Plots.resize.mockRejectedValue(new Error('Resize must be passed a displayed plot div element.'));
    const { adaptador, observadores, contenedor, fotograma } = entorno({ api });
    await adaptador.dibujar(contenedor, CR05);
    observadores[0].alCambiar(tamano(800));
    observadores[0].alCambiar(tamano(600));
    fotograma();
    await esperar();
    expect(api.Plots.resize).toHaveBeenCalledTimes(1);
  });

  it('limpiar desconecta el observador y cancela el ajuste pendiente', async () => {
    const { adaptador, api, observadores, marcos, contenedor } = entorno();
    await adaptador.dibujar(contenedor, CR05);
    const [observador] = observadores;
    observador.alCambiar(tamano(800));
    observador.alCambiar(tamano(600));
    expect(marcos).toHaveLength(1);
    adaptador.limpiar(contenedor);
    expect(observador.disconnect).toHaveBeenCalledTimes(1);
    expect(marcos[0].cancelado).toBe(true);
    marcos[0].tarea(); // aunque el fotograma llegara, no ajusta un lienzo retirado
    await esperar();
    expect(api.Plots.resize).not.toHaveBeenCalled();
  });

  it('sin Plots.resize no se crea observador (queda el «resize» de Plotly)', async () => {
    const api = plotlyFalso();
    delete api.Plots;
    const { adaptador, observadores, contenedor } = entorno({ api });
    expect(await adaptador.dibujar(contenedor, CR05)).toEqual({ estado: 'dibujada' });
    expect(observadores).toHaveLength(0);
  });
});

// ── Precarga programada (para main.js en T-17) ───────────────────────

describe('programarPrecarga(ventana)', () => {
  function ventanaFalsa(readyState) {
    const oyentes = new Map();
    const reposo = [];
    return {
      document: { readyState },
      addEventListener: vi.fn((tipo, oyente) => oyentes.set(tipo, oyente)),
      removeEventListener: vi.fn((tipo) => oyentes.delete(tipo)),
      requestIdleCallback: vi.fn((tarea) => reposo.push(tarea)),
      cancelIdleCallback: vi.fn(),
      setTimeout: vi.fn(),
      clearTimeout: vi.fn(),
      disparar: (tipo) => oyentes.get(tipo)?.(),
      reposo
    };
  }

  it('con la página cargada, precarga en el siguiente momento libre', async () => {
    const { adaptador, cargar } = entorno();
    const ventana = ventanaFalsa('complete');
    adaptador.programarPrecarga(ventana);
    expect(cargar).not.toHaveBeenCalled();
    ventana.reposo[0]();
    await esperar();
    expect(cargar).toHaveBeenCalledTimes(1);
  });

  it('si la página todavía carga, espera al evento «load»', async () => {
    const { adaptador, cargar } = entorno();
    const ventana = ventanaFalsa('loading');
    adaptador.programarPrecarga(ventana);
    expect(ventana.addEventListener).toHaveBeenCalledWith('load', expect.any(Function), { once: true });
    expect(ventana.requestIdleCallback).not.toHaveBeenCalled();
    ventana.disparar('load');
    ventana.reposo[0]();
    await esperar();
    expect(cargar).toHaveBeenCalledTimes(1);
  });

  it('sin requestIdleCallback usa setTimeout, y se puede cancelar', () => {
    const { adaptador, cargar } = entorno();
    const ventana = { ...ventanaFalsa('complete'), requestIdleCallback: undefined };
    ventana.setTimeout = vi.fn(() => 7);
    const cancelar = adaptador.programarPrecarga(ventana);
    expect(ventana.setTimeout).toHaveBeenCalledWith(expect.any(Function), 0);
    cancelar();
    expect(ventana.clearTimeout).toHaveBeenCalledWith(7);
    expect(cargar).not.toHaveBeenCalled();
  });

  it('cancelar antes de «load» retira el oyente', () => {
    const { adaptador, cargar } = entorno();
    const ventana = ventanaFalsa('loading');
    const cancelar = adaptador.programarPrecarga(ventana);
    cancelar();
    expect(ventana.removeEventListener).toHaveBeenCalledWith('load', expect.any(Function));
    expect(cargar).not.toHaveBeenCalled();
  });
});
