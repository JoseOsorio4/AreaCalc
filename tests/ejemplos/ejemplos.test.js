// Pruebas de src/ejemplos/ejemplos.js (T-16; requirements R-13; design.md §12).
//
// Comprueban el contrato que espera interfaz/estado.cargarEjemplo (T-13), que el
// catálogo solo tiene entradas (R-13.3), que las entradas son las de
// tests/casos-referencia.js y que, cargadas por el mismo camino que una entrada manual,
// dan los resultados de referencia con los casos de uso reales.
import { describe, expect, it } from 'vitest';
import { EJEMPLOS, ORIGENES } from '../../src/ejemplos/ejemplos.js';
import {
  calcularEstimacion, cargarEjemplo, estadoInicial, irASeccion, usarComoFuente
} from '../../src/interfaz/estado.js';
import { textoOrigenEjemplo } from '../../src/interfaz/vistaComun.js';
import { crearAdvertencia } from '../../src/nucleo/errores.js';
import { CASOS } from '../casos-referencia.js';

const MINIMOS = ['CR-01', 'CR-02', 'CR-03', 'CR-05', 'CR-06', 'CR-07', 'CR-09', 'CR-10']; // R-13.5
const CLAVES = ['id', 'seccion', 'origen', 'titulo', 'entrada', 'estimacion', 'simulado'];
const CAMPOS = {
  perfil: ['textoFuncion', 'textoA', 'textoB', 'interpretacion'],
  figuras: ['tipo', 'unidad', 'base', 'altura', 'radio']
};
/** Origen según la columna «Verifica» de requirements §14 y la fuente del formulario §13. */
const ORIGEN_ESPERADO = {
  'CR-01': 'Ejercicio de clase', // P1-D
  'CR-02': 'Ejercicio de clase', // P1-A
  'CR-03': 'Caso práctico simulado', // PC §7.3
  'CR-05': 'Caso de comprobación',
  'CR-06': 'Caso de comprobación',
  'CR-07': 'Caso de comprobación',
  'CR-09': 'Caso de comprobación',
  'CR-10': 'Caso de comprobación',
  'CR-14': 'Caso de comprobación',
  'CR-15': 'Caso de comprobación'
};

const ejemplo = (id) => EJEMPLOS.find((e) => e.id === id);
const entradaReferencia = (id) => CASOS[id].entrada ?? CASOS[id].entradas[0];

/** Hojas del árbol de un objeto: solo textos y el indicador booleano «simulado». */
function hojas(valor, ruta = '') {
  if (valor !== null && typeof valor === 'object') {
    return Object.entries(valor).flatMap(([clave, interno]) => hojas(interno, `${ruta}.${clave}`));
  }
  return [[ruta, typeof valor]];
}

describe('contrato del catálogo (cargarEjemplo de T-13; R-13.1, R-13.3 y R-13.5)', () => {
  it('incluye como mínimo CR-01, CR-02, CR-03, CR-05, CR-06, CR-07, CR-09 y CR-10, sin ids repetidos', () => {
    const ids = EJEMPLOS.map((e) => e.id);
    for (const id of MINIMOS) expect(ids).toContain(id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('las etiquetas de origen son las de R-13.1', () => {
    expect(Object.values(ORIGENES).sort()).toEqual(['Caso de comprobación', 'Caso práctico simulado', 'Ejercicio de clase']);
  });

  it.each(EJEMPLOS.map((e) => [e.id, e]))('%s: forma, origen y título', (id, e) => {
    expect(Object.keys(e).every((clave) => CLAVES.includes(clave)), Object.keys(e).join(', ')).toBe(true);
    expect(['perfil', 'figuras']).toContain(e.seccion);
    expect(e.origen).toBe(ORIGEN_ESPERADO[id]);
    expect(e.titulo.startsWith(`${e.origen} · `)).toBe(true);
    expect(Object.keys(e.entrada).every((campo) => CAMPOS[e.seccion].includes(campo))).toBe(true);
    if (e.seccion === 'perfil') expect(['abstracta', 'fisica']).toContain(e.entrada.interpretacion);
  });

  it('solo hay entradas: todos los datos son textos, sin resultados, pasos ni gráfica (R-13.3)', () => {
    for (const e of EJEMPLOS) {
      for (const [ruta, tipo] of hojas(e)) {
        expect(ruta === '.simulado' ? tipo === 'boolean' : tipo === 'string', `${e.id}${ruta}: ${tipo}`).toBe(true);
      }
    }
  });

  it('el catálogo está congelado', () => {
    expect(Object.isFrozen(EJEMPLOS)).toBe(true);
    for (const e of EJEMPLOS) {
      expect(Object.isFrozen(e)).toBe(true);
      expect(Object.isFrozen(e.entrada)).toBe(true);
    }
  });

  it('solo el caso práctico trae precio y adicional, y está marcado como simulado (R-13.4)', () => {
    const conPrecio = EJEMPLOS.filter((e) => e.estimacion !== undefined);
    expect(conPrecio.map((e) => e.id)).toEqual(['CR-03']);
    for (const e of conPrecio) {
      expect(e.simulado).toBe(true);
      expect(e.origen).toBe(ORIGENES.simulado);
      expect(e.titulo).toContain('simulados');
    }
    expect(EJEMPLOS.filter((e) => e.simulado === true).map((e) => e.id)).toEqual(['CR-03']);
  });
});

describe('las entradas son las de tests/casos-referencia.js', () => {
  it.each(EJEMPLOS.map((e) => [e.id]))('%s', (id) => {
    const e = ejemplo(id);
    const referencia = entradaReferencia(id);
    if (e.seccion === 'figuras') {
      expect(e.entrada).toEqual(referencia);
      return;
    }
    expect([e.entrada.textoFuncion, e.entrada.textoA, e.entrada.textoB])
      .toEqual([referencia.textoFuncion, referencia.textoA, referencia.textoB]);
    // Si la fuente fija la interpretación (CR-01, CR-03), el ejemplo la respeta.
    if (referencia.interpretacion !== undefined) expect(e.entrada.interpretacion).toBe(referencia.interpretacion);
    // Si la fuente da el resultado «en metros», el ejemplo es físico.
    if (CASOS[id].esperado.aptitudEnMetros !== undefined) expect(e.entrada.interpretacion).toBe('fisica');
  });

  it('CR-03: precio Q50/m² y adicional del 10 %, del caso práctico simulado', () => {
    const { textoPrecio, textoAdicional } = CASOS['CR-03'].entrada;
    expect(ejemplo('CR-03').estimacion).toEqual({ textoPrecio, textoAdicional });
  });
});

describe('cargados con cargarEjemplo, dan los resultados de referencia (R-13.2)', () => {
  const cargar = (id, estado = estadoInicial()) => cargarEjemplo(estado, id, EJEMPLOS);
  const perfiles = EJEMPLOS.filter((e) => e.seccion === 'perfil').map((e) => [e.id]);

  it.each(perfiles)('%s: I, A_geo y f_prom con analizarPerfil', (id) => {
    const estado = cargar(id);
    const { esperado } = CASOS[id];
    const resultado = estado.perfil.resultado;
    expect(resultado, id).not.toBeNull();
    expect(estado.perfil.entrada).toEqual(ejemplo(id).entrada);
    expect(resultado.integral.I).toEqual(esperado.I.valor);
    expect(resultado.promedio.fProm).toEqual(esperado.fProm.valor);
    if (esperado.Ageo.clase === 'exacta') expect(resultado.area.area).toEqual({ clase: 'exacta', valor: esperado.Ageo.valor });
    else expect(resultado.area.area.clase).toBe('aproximada');
    // Contiene las de la referencia; W-01 se añade además cuando f cambia de signo (T-08).
    if (esperado.advertencias) {
      expect(resultado.advertencias.map((a) => a.codigo)).toEqual(expect.arrayContaining(esperado.advertencias));
    }
    if (esperado.aptitudEnMetros) {
      expect(resultado.aptitud.apta).toBe(esperado.aptitudEnMetros.apta);
      if (esperado.aptitudEnMetros.codigo) expect(resultado.aptitud.motivo).toBe(esperado.aptitudEnMetros.codigo);
    }
    // El resultado sale del caso de uso: desde T-17 trae también los pasos y la gráfica.
    expect(resultado.pasos.area.length).toBeGreaterThan(0);
    expect(resultado.grafica).not.toBeNull();
  });

  it.each([['CR-09'], ['CR-10']])('%s: área y área en m² con calcularFigura', (id) => {
    const estado = cargar(id);
    const { esperado } = CASOS[id];
    expect(estado.figura.resultado.area).toEqual({ clase: 'exacta', valor: esperado.area.valor });
    expect(estado.figura.resultado.unidadArea).toBe(esperado.unidadArea);
    expect(estado.figura.resultado.areaM2).toEqual({ clase: 'exacta', valor: esperado.areaM2.valor });
    expect(estado.figura.entrada.radio).toBe(''); // el campo que no trae vuelve a su valor inicial
  });

  it('CR-03: rectángulo, estimación con Q666.67 y Q733.33 exactos y W-05 por datos simulados', () => {
    let estado = cargar('CR-03');
    const { esperado } = CASOS['CR-03'];
    const { rectangulo } = estado.perfil.resultado.rectangulo;
    expect([rectangulo.base, rectangulo.altura, rectangulo.area])
      .toEqual([esperado.rectangulo.base.valor, esperado.rectangulo.altura.valor, esperado.rectangulo.area.valor]);
    expect(estado.estimacion.entrada).toEqual(ejemplo('CR-03').estimacion);
    expect(estado.estimacion.datosSimulados).toBe(true);
    estado = calcularEstimacion(usarComoFuente(estado, 'perfil'));
    const estimacion = estado.estimacion.resultado;
    expect(estimacion.areaEstimadaM2).toEqual({ clase: 'exacta', valor: esperado.estimacion.areaEstimada.valor });
    expect(estimacion.costoBase).toEqual({ clase: 'exacta', valor: esperado.estimacion.costoBase.valor });
    expect(estimacion.costoEstimado).toEqual({ clase: 'exacta', valor: esperado.estimacion.costoEstimado.valor });
    expect(estimacion.supuestos).toContain(crearAdvertencia('W-05').mensaje);
  });

  it('los ejemplos sin estimación no marcan datos simulados ni cambian la sección', () => {
    const estado = cargar('CR-01', irASeccion(estadoInicial(), 'figuras'));
    expect(estado.estimacion.datosSimulados).toBe(false);
    expect(estado.seccion).toBe('figuras');
  });

  it('cargar un ejemplo reemplaza lo escrito antes y retira el resultado anterior', () => {
    const primero = cargar('CR-03');
    const segundo = cargar('CR-07', primero);
    expect(segundo.perfil.entrada).toEqual(ejemplo('CR-07').entrada);
    expect(segundo.perfil.resultado).not.toBe(primero.perfil.resultado);
    expect(segundo.perfil.resultado.integral.I).toEqual(CASOS['CR-07'].esperado.I.valor);
  });

  it('CR-07: la otra escritura de la fuente da el mismo resultado (R-02.3)', () => {
    const [, otra] = CASOS['CR-07'].entradas;
    const catalogo = [{ ...ejemplo('CR-07'), id: 'otra', entrada: { ...ejemplo('CR-07').entrada, textoFuncion: otra.textoFuncion } }];
    const a = cargar('CR-07').perfil.resultado;
    const b = cargarEjemplo(estadoInicial(), 'otra', catalogo).perfil.resultado;
    expect(b.modelo.textoNormalizado).toBe(a.modelo.textoNormalizado);
    expect(b.area.area).toEqual(a.area.area);
  });
});

describe('nota de origen bajo el selector (T-17; R-13.1 y R-13.4)', () => {
  it.each(EJEMPLOS.map((e) => [e.id, e]))('%s: dice su origen y solo CR-03 avisa de datos simulados', (id, e) => {
    const texto = textoOrigenEjemplo(e);
    expect(texto.startsWith(`Origen: ${ORIGEN_ESPERADO[id]}.`)).toBe(true);
    expect(texto.includes('simulados')).toBe(id === 'CR-03');
  });

  it('CR-03: el aviso nombra el precio y el adicional que se copian a Estimación', () => {
    expect(textoOrigenEjemplo(ejemplo('CR-03'))).toBe('Origen: Caso práctico simulado. '
      + 'El precio y el adicional que se copian a Estimación son simulados, no son precios reales.');
  });
});
