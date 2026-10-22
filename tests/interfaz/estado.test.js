// Pruebas de src/interfaz/estado.js y src/interfaz/navegacion.js (T-13; design.md §12 y §14.5;
// requirements R-12, R-13.2 y R-23.1). Sin DOM: el estado es un objeto y la ventana del
// navegador se sustituye por un objeto que imita location.hash, «hashchange» y el historial.
// Los valores esperados vienen de tests/casos-referencia.js o se calculan con
// tests/aritmetica-independiente.js.
import { describe, expect, it } from 'vitest';
import {
  SECCIONES, aptoParaEstimar, calcularEstimacion, calcularFigura, calcularPerfil, cargarEjemplo, editarEstimacion,
  editarFigura, editarPerfil, estadoInicial, irASeccion, usarComoFuente
} from '../../src/interfaz/estado.js';
import { fragmentoDe, iniciarNavegacion, irA, seccionDesdeFragmento } from '../../src/interfaz/navegacion.js';
import { CASOS } from '../casos-referencia.js';
import { antiderivada, evaluar, q } from '../aritmetica-independiente.js';

/** Aplica las ediciones de un objeto { campo: valor } con editar(estado, campo, valor). */
const aplicar = (estado, editar, campos) => Object.entries(campos).reduce((e, [campo, valor]) => editar(e, campo, valor), estado);

/** Entrada de perfil de un CR, con la interpretación por omisión si no la fija. */
const entradaPerfil = (entrada) => ({
  textoFuncion: entrada.textoFuncion, textoA: entrada.textoA, textoB: entrada.textoB, interpretacion: entrada.interpretacion ?? 'abstracta'
});

/** CR-03 calculado, usado como fuente y con su estimación de Q50/m² y 10 %. */
function cr03ConEstimacion() {
  const { entrada } = CASOS['CR-03'];
  let estado = calcularPerfil(aplicar(estadoInicial(), editarPerfil, entradaPerfil(entrada)));
  estado = usarComoFuente(estado, 'perfil');
  estado = aplicar(estado, editarEstimacion, { textoPrecio: entrada.textoPrecio, textoAdicional: entrada.textoAdicional });
  return calcularEstimacion(estado);
}

/** Congela de forma profunda para comprobar que ninguna transición modifica su entrada. */
const instantanea = (estado) => JSON.stringify(estado, (_, v) => (typeof v === 'bigint' ? `${v}n` : v));

describe('estado inicial (design §12)', () => {
  it('tiene las tres partes, la sección perfil y la interpretación abstracta (R-01.3)', () => {
    const estado = estadoInicial();
    expect(Object.keys(estado).sort()).toEqual(['estimacion', 'figura', 'perfil', 'seccion']);
    expect(estado.seccion).toBe('perfil');
    expect(estado.perfil).toEqual({
      entrada: { textoFuncion: '', textoA: '', textoB: '', interpretacion: 'abstracta' }, resultado: null, errores: []
    });
    expect(estado.figura.resultado).toBeNull();
    expect(estado.estimacion).toEqual({
      fuente: null, entrada: { textoPrecio: '', textoAdicional: '' }, datosSimulados: false, resultado: null, errores: []
    });
    expect(Object.isFrozen(estado) && Object.isFrozen(estado.perfil) && Object.isFrozen(estado.perfil.entrada)).toBe(true);
  });

  it('las secciones son perfil, figuras y estimacion (R-23.1)', () => {
    expect(SECCIONES).toEqual(['perfil', 'figuras', 'estimacion']);
  });
});

describe('CR-22: cambiar b retira resultado, pasos, gráfica y estimación (R-12.1)', () => {
  const { esperado, secuencia } = CASOS['CR-22'];

  it('después de calcular CR-03 hay resultado y estimación', () => {
    const estado = cr03ConEstimacion();
    expect(estado.perfil.resultado.integral.I).toEqual(CASOS['CR-03'].esperado.I.valor);
    expect(estado.estimacion.fuente).toBe('perfil');
    expect(estado.estimacion.resultado.costoBase.valor).toEqual(CASOS['CR-03'].esperado.estimacion.costoBase.valor);
  });

  it('al editar b ya no queda nada calculado con la entrada vieja', () => {
    const [, edicion] = secuencia;
    expect(edicion).toEqual({ accion: 'editar', campo: 'textoB', valor: '5' });
    const estado = editarPerfil(cr03ConEstimacion(), edicion.campo, edicion.valor);
    expect(esperado.retirados).toEqual(['resultado', 'grafica', 'pasos', 'estimacion']);
    expect(estado.perfil.entrada.textoB).toBe('5');
    // El resultado, sus pasos y su gráfica (ResultadoPerfil.pasos y .grafica) desaparecen juntos.
    expect(estado.perfil.resultado).toBeNull();
    expect(estado.perfil.errores).toEqual([]);
    expect(estado.estimacion.resultado).toBeNull();
    expect(estado.estimacion.fuente).toBeNull();
    // El precio y el adicional escritos se conservan; solo se retira lo calculado.
    expect(estado.estimacion.entrada).toEqual({ textoPrecio: '50', textoAdicional: '10' });
  });

  it('al recalcular aparece el resultado nuevo y la estimación sigue retirada hasta elegir la fuente', () => {
    const estado = calcularPerfil(editarPerfil(cr03ConEstimacion(), 'textoB', '5'));
    // F(x) = 2x + x³/12 (CR-03): I en [0, 5] = F(5).
    expect(estado.perfil.resultado.integral.I).toEqual(evaluar(antiderivada([q(2n), q(0n), q(1n, 4n)]), q(5n)));
    expect(estado.estimacion.fuente).toBeNull();
    expect(estado.estimacion.resultado).toBeNull();
  });
});

describe('invalidación del perfil y de la figura (R-12.1, R-12.2)', () => {
  const valido = () => calcularPerfil(aplicar(estadoInicial(), editarPerfil, entradaPerfil(CASOS['CR-01'].entrada)));

  it.each(['textoFuncion', 'textoA', 'textoB', 'interpretacion'])('editar %s retira el resultado y los errores', (campo) => {
    const estado = editarPerfil(valido(), campo, campo === 'interpretacion' ? 'fisica' : '2');
    expect([estado.perfil.resultado, estado.perfil.errores]).toEqual([null, []]);
  });

  it('un cálculo fallido no deja visible el resultado anterior (R-12.2)', () => {
    const estado = calcularPerfil(editarPerfil(valido(), 'textoFuncion', 'y'));
    expect(estado.perfil.resultado).toBeNull();
    expect(estado.perfil.errores.map((e) => e.codigo)).toEqual(['E-EXP-03']);
  });

  it('un cálculo válido retira los errores anteriores', () => {
    const conError = calcularPerfil(editarPerfil(valido(), 'textoFuncion', 'y'));
    const corregido = calcularPerfil(editarPerfil(conError, 'textoFuncion', 'x^3 - 1'));
    expect(corregido.perfil.errores).toEqual([]);
    expect(corregido.perfil.resultado.integral.I).toEqual(CASOS['CR-01'].esperado.I.valor);
  });

  it('los errores acumulados de varios campos se guardan juntos', () => {
    const estado = calcularPerfil(aplicar(estadoInicial(), editarPerfil, { textoFuncion: 'y', textoA: '', textoB: 'abc' }));
    expect(estado.perfil.errores.map((e) => [e.campo, e.codigo])).toEqual([['funcion', 'E-EXP-03'], ['a', 'E-NUM-01'], ['b', 'E-NUM-02']]);
  });

  it('la figura se calcula y se invalida igual', () => {
    const { entrada, esperado } = CASOS['CR-09'];
    const calculado = calcularFigura(aplicar(estadoInicial(), editarFigura, entrada));
    expect(calculado.figura.resultado.area.valor).toEqual(esperado.area.valor);
    const editado = editarFigura(calculado, 'altura', '3');
    expect([editado.figura.resultado, editado.figura.errores]).toEqual([null, []]);
    const fallido = calcularFigura(editarFigura(calculado, 'base', '0'));
    expect(fallido.figura.resultado).toBeNull();
    expect(fallido.figura.errores.map((e) => e.codigo)).toEqual(['E-NUM-06']);
  });

  it('un círculo solo usa su radio, aunque queden base y altura escritas', () => {
    const { entrada, esperado } = CASOS['CR-19'].subcasos[1];
    const estado = calcularFigura(aplicar(estadoInicial(), editarFigura, { base: 'abc', altura: '', ...entrada }));
    expect(estado.figura.errores).toEqual([]);
    expect(estado.figura.resultado.area.coeficiente).toEqual(esperado.area.coeficiente);
  });
});

describe('fuente y estimación (R-12.1, R-16, R-17.6)', () => {
  it('editar el precio o el adicional retira la estimación', () => {
    for (const campo of ['textoPrecio', 'textoAdicional']) {
      const estado = editarEstimacion(cr03ConEstimacion(), campo, '20');
      expect([estado.estimacion.resultado, estado.estimacion.errores]).toEqual([null, []]);
      expect(estado.estimacion.fuente).toBe('perfil'); // la fuente sigue vigente
      expect(estado.perfil.resultado).not.toBeNull();
    }
  });

  it('recalcular la fuente retira la estimación, que dependía del resultado anterior', () => {
    const estado = calcularPerfil(cr03ConEstimacion());
    expect(estado.perfil.resultado).not.toBeNull();
    expect([estado.estimacion.fuente, estado.estimacion.resultado]).toEqual([null, null]);
  });

  it('editar la figura no toca una estimación cuya fuente es el perfil, y al revés', () => {
    const conPerfil = editarFigura(cr03ConEstimacion(), 'base', '7');
    expect(conPerfil.estimacion.resultado).not.toBeNull();
    let conFigura = calcularFigura(aplicar(estadoInicial(), editarFigura, CASOS['CR-09'].entrada));
    conFigura = calcularEstimacion(aplicar(usarComoFuente(conFigura, 'figura'), editarEstimacion, { textoPrecio: '50', textoAdicional: '10' }));
    expect(conFigura.estimacion.resultado.costoBase.valor).toEqual(q(400n)); // 8 m² × Q50
    expect(editarPerfil(conFigura, 'textoA', '1').estimacion.resultado).not.toBeNull();
    const editada = editarFigura(conFigura, 'base', '5');
    expect([editada.estimacion.fuente, editada.estimacion.resultado]).toEqual([null, null]);
  });

  it('usarComoFuente no hace nada si el resultado no existe o no es apto', () => {
    const inicial = estadoInicial();
    expect(usarComoFuente(inicial, 'perfil')).toBe(inicial);
    expect(usarComoFuente(inicial, 'figura')).toBe(inicial);
    const abstracto = calcularPerfil(aplicar(estadoInicial(), editarPerfil, entradaPerfil(CASOS['CR-01'].entrada)));
    expect(aptoParaEstimar(abstracto, 'perfil')).toBe(false);
    expect(usarComoFuente(abstracto, 'perfil')).toBe(abstracto);
    expect(abstracto.perfil.resultado.aptitud.error.codigo).toBe('E-MOD-01'); // el motivo que muestra la interfaz
    const negativo = calcularPerfil(aplicar(estadoInicial(), editarPerfil, { ...entradaPerfil(CASOS['CR-05'].entrada), interpretacion: 'fisica' }));
    expect(usarComoFuente(negativo, 'perfil')).toBe(negativo);
  });

  it('elegir una fuente retira la estimación anterior', () => {
    const estado = usarComoFuente(cr03ConEstimacion(), 'perfil');
    expect([estado.estimacion.fuente, estado.estimacion.resultado]).toEqual(['perfil', null]);
  });

  it('sin fuente, calcular la estimación da E-MOD-04', () => {
    const estado = calcularEstimacion(aplicar(estadoInicial(), editarEstimacion, { textoPrecio: '50', textoAdicional: '10' }));
    expect(estado.estimacion.resultado).toBeNull();
    expect(estado.estimacion.errores.map((e) => e.codigo)).toEqual(['E-MOD-04']);
  });

  it('una estimación fallida no deja visible la anterior', () => {
    const estado = calcularEstimacion(editarEstimacion(cr03ConEstimacion(), 'textoPrecio', '-1'));
    expect(estado.estimacion.resultado).toBeNull();
    expect(estado.estimacion.errores.map((e) => e.codigo)).toEqual(['E-NUM-05']);
  });
});

describe('cargarEjemplo sigue el camino de una entrada manual (R-13.2)', () => {
  // Datos de prueba con el contrato que se espera de ejemplos.js (T-16); no es el catálogo real.
  const CATALOGO = Object.freeze([
    {
      id: 'practico', seccion: 'perfil', origen: 'Caso práctico simulado', simulado: true,
      entrada: entradaPerfil(CASOS['CR-03'].entrada),
      estimacion: { textoPrecio: CASOS['CR-03'].entrada.textoPrecio, textoAdicional: CASOS['CR-03'].entrada.textoAdicional },
      // Un ejemplo no debe traer resultados (R-13.3); si los trae, se ignoran.
      resultado: { integral: { I: q(999n) } }
    },
    { id: 'clase', seccion: 'perfil', origen: 'Ejercicio de clase', entrada: { textoFuncion: 'x^3 - 1', textoA: '1', textoB: '4' } },
    { id: 'rectangulo', seccion: 'figuras', origen: 'Caso de comprobación', entrada: CASOS['CR-10'].entrada }
  ]);

  it('da el mismo estado que escribir los textos y calcular', () => {
    const cargado = cargarEjemplo(estadoInicial(), 'practico', CATALOGO);
    let manual = calcularPerfil(aplicar(estadoInicial(), editarPerfil, entradaPerfil(CASOS['CR-03'].entrada)));
    manual = aplicar(manual, editarEstimacion, { textoPrecio: '50', textoAdicional: '10' });
    expect(cargado.perfil).toEqual(manual.perfil);
    expect(cargado.estimacion.entrada).toEqual(manual.estimacion.entrada);
    expect(cargado.perfil.resultado.integral.I).toEqual(CASOS['CR-03'].esperado.I.valor); // no el 999 del ejemplo
  });

  it('retira los resultados anteriores, también la estimación que dependía del perfil', () => {
    const estado = cargarEjemplo(cr03ConEstimacion(), 'clase', CATALOGO);
    expect(estado.perfil.resultado.integral.I).toEqual(CASOS['CR-01'].esperado.I.valor);
    expect([estado.estimacion.fuente, estado.estimacion.resultado]).toEqual([null, null]);
  });

  it('un campo que el ejemplo no trae vuelve a su valor inicial', () => {
    const previo = aplicar(estadoInicial(), editarPerfil, { interpretacion: 'fisica' });
    expect(cargarEjemplo(previo, 'clase', CATALOGO).perfil.entrada.interpretacion).toBe('abstracta');
  });

  it('un caso simulado marca sus datos y la estimación añade W-05 (R-13.4)', () => {
    const cargado = cargarEjemplo(estadoInicial(), 'practico', CATALOGO);
    expect(cargado.estimacion.datosSimulados).toBe(true);
    const estimado = calcularEstimacion(usarComoFuente(cargado, 'perfil'));
    expect(estimado.estimacion.resultado.costoEstimado.valor).toEqual(CASOS['CR-03'].esperado.estimacion.costoEstimado.valor);
    expect(estimado.estimacion.resultado.supuestos).toHaveLength(2);
    expect(editarEstimacion(cargado, 'textoPrecio', '60').estimacion.datosSimulados).toBe(false);
  });

  it('carga también ejemplos de figuras', () => {
    const estado = cargarEjemplo(estadoInicial(), 'rectangulo', CATALOGO);
    expect(estado.figura.resultado.areaM2.valor).toEqual(CASOS['CR-10'].esperado.areaM2.valor);
  });

  it('un ejemplo o un catálogo inválidos son errores de programación', () => {
    expect(() => cargarEjemplo(estadoInicial(), 'otro', CATALOGO)).toThrow(RangeError);
    expect(() => cargarEjemplo(estadoInicial(), 'x', null)).toThrow(TypeError);
    expect(() => cargarEjemplo(estadoInicial(), 'x', [{ id: 'x', seccion: 'estimacion', entrada: {} }])).toThrow(RangeError);
  });
});

describe('transiciones puras (design §12)', () => {
  it('ninguna transición modifica el estado que recibe, y todas devuelven estados congelados', () => {
    const base = cr03ConEstimacion();
    const antes = instantanea(base);
    const siguientes = [
      editarPerfil(base, 'textoB', '5'), calcularPerfil(base), editarFigura(base, 'base', '1'), calcularFigura(base),
      usarComoFuente(base, 'perfil'), editarEstimacion(base, 'textoPrecio', '1'), calcularEstimacion(base), irASeccion(base, 'figuras')
    ];
    expect(instantanea(base)).toBe(antes);
    for (const s of siguientes) {
      expect(Object.isFrozen(s) && Object.isFrozen(s.perfil) && Object.isFrozen(s.figura) && Object.isFrozen(s.estimacion)).toBe(true);
      expect(Object.isFrozen(s.perfil.entrada) && Object.isFrozen(s.estimacion.entrada)).toBe(true);
    }
  });

  it('el mismo estado y la misma acción dan el mismo resultado', () => {
    const a = cr03ConEstimacion();
    const b = cr03ConEstimacion();
    expect(instantanea(a)).toBe(instantanea(b));
  });

  it('irASeccion solo cambia la sección', () => {
    const base = cr03ConEstimacion();
    const estado = irASeccion(base, 'estimacion');
    expect(estado.seccion).toBe('estimacion');
    expect([estado.perfil, estado.figura, estado.estimacion]).toEqual([base.perfil, base.figura, base.estimacion]);
    expect(irASeccion(estado, 'estimacion')).toBe(estado);
  });

  it('rechaza campos, valores y secciones desconocidos', () => {
    const inicial = estadoInicial();
    expect(() => editarPerfil(inicial, 'resultado', 'x')).toThrow(RangeError);
    expect(() => editarPerfil(inicial, 'textoA', 5)).toThrow(TypeError);
    expect(() => editarFigura(inicial, 'lado', '1')).toThrow(RangeError);
    expect(() => editarEstimacion(inicial, 'textoFuncion', '1')).toThrow(RangeError);
    expect(() => irASeccion(inicial, 'terrenos')).toThrow(RangeError);
    expect(() => aptoParaEstimar(inicial, 'terreno')).toThrow(RangeError);
  });
});

/** Ventana simulada: location.hash, «hashchange» y un historial con «Atrás». */
function ventanaSimulada(inicial = '') {
  const historial = [inicial];
  let posicion = 0;
  const oyentes = new Set();
  const avisar = () => oyentes.forEach((f) => f());
  const location = {};
  Object.defineProperty(location, 'hash', {
    get: () => historial[posicion],
    set: (valor) => {
      const hash = valor.startsWith('#') ? valor : `#${valor}`;
      if (hash === historial[posicion]) return;
      historial.splice(posicion + 1);
      historial.push(hash);
      posicion += 1;
      avisar();
    }
  });
  return {
    location,
    addEventListener: (tipo, f) => { if (tipo === 'hashchange') oyentes.add(f); },
    removeEventListener: (tipo, f) => { if (tipo === 'hashchange') oyentes.delete(f); },
    atras: () => { if (posicion > 0) { posicion -= 1; avisar(); } },
    historial,
    oyentes
  };
}

describe('navegación por fragmento (design §14.5)', () => {
  it.each([['#perfil', 'perfil'], ['#figuras', 'figuras'], ['#estimacion', 'estimacion'], ['figuras', 'figuras'],
    ['', 'perfil'], ['#terrenos', 'perfil'], [undefined, 'perfil']])('«%s» → %s', (fragmento, seccion) => {
    expect(seccionDesdeFragmento(fragmento)).toBe(seccion);
  });

  it('cada sección tiene su fragmento', () => {
    expect(SECCIONES.map(fragmentoDe)).toEqual(['#perfil', '#figuras', '#estimacion']);
    expect(() => fragmentoDe('terrenos')).toThrow(RangeError);
  });

  it('avisa de la sección inicial, sigue los cambios y el botón Atrás vuelve a la anterior', () => {
    const ventana = ventanaSimulada('#figuras');
    const vistas = [];
    let estado = estadoInicial();
    const detener = iniciarNavegacion(ventana, (seccion) => {
      vistas.push(seccion);
      estado = irASeccion(estado, seccion);
    });
    expect(vistas).toEqual(['figuras']);
    irA(ventana, 'estimacion');
    irA(ventana, 'perfil');
    expect(estado.seccion).toBe('perfil');
    ventana.atras();
    expect(estado.seccion).toBe('estimacion');
    ventana.atras();
    expect(estado.seccion).toBe('figuras');
    expect(vistas).toEqual(['figuras', 'estimacion', 'perfil', 'estimacion', 'figuras']);
    detener();
    expect(ventana.oyentes.size).toBe(0);
  });

  it('ir a la sección actual no añade otra entrada al historial', () => {
    const ventana = ventanaSimulada('#perfil');
    irA(ventana, 'perfil');
    expect(ventana.historial).toEqual(['#perfil']);
  });

  it('rechaza una ventana o una función inválidas', () => {
    expect(() => iniciarNavegacion({}, () => {})).toThrow(TypeError);
    expect(() => iniciarNavegacion(ventanaSimulada(), null)).toThrow(TypeError);
    expect(() => irA(null, 'perfil')).toThrow(TypeError);
  });
});
