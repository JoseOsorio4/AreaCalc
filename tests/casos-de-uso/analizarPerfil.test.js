// Pruebas de src/casos-de-uso/analizarPerfil.js, de principio a fin y sin DOM (T-08; design.md §4, §9 a §11 y §15).
// Los valores esperados vienen de tests/casos-referencia.js. Cuando una fuente
// no fija un dato (campo `pendientes`), la prueba lo dice y usa una entrada válida
// cualquiera. Las comprobaciones extra se hacen con tests/aritmetica-independiente.js,
// que no importa nada de src/.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { analizarPerfil } from '../../src/casos-de-uso/analizarPerfil.js';
import { calcularFigura } from '../../src/casos-de-uso/calcularFigura.js';
import { CATALOGO } from '../../src/nucleo/errores.js';
import { CASOS } from '../casos-referencia.js';
import {
  aDecimal, antiderivada, comparar, evaluar, leer, producto, q, resta, suma
} from '../aritmetica-independiente.js';

const perfil = (entrada, interpretacion = 'abstracta') => analizarPerfil({ interpretacion, ...entrada });

afterEach(() => vi.restoreAllMocks());

function valido(entrada, interpretacion) {
  const resultado = perfil(entrada, interpretacion);
  expect(resultado.ok, `${entrada.textoFuncion}: ${resultado.errores?.map((e) => e.codigo)}`).toBe(true);
  return resultado.valor;
}

const codigos = (resultado) => resultado.errores.map((e) => e.codigo);

/** Antiderivadas de casos-referencia.js, transcritas a mano como coeficientes desde x⁰. */
const ANTIDERIVADAS = Object.freeze({
  'x⁴/4 − x': ['0', '-1', '0', '0', '1/4'],
  'x + x³/3': ['0', '1', '0', '1/3'],
  '2x + x³/12': ['0', '2', '0', '1/12'],
  'x²/2': ['0', '0', '1/2'],
  'x²/2 − x/3': ['0', '-1/3', '1/2']
});

/**
 * Advertencias que se deducen de los ceros de referencia con las definiciones de
 * requirements §10: W-01 si algún cero cambia de signo, W-02 por cada tangencia,
 * W-03 por cada cero en un extremo, W-04 si alguno es aproximado y W-09 si f ≡ 0.
 * Devuelve null si algún cero de referencia no fija su tipo.
 */
function advertenciasEsperadas(esperado) {
  if (esperado.identicamenteCero) return ['W-09'];
  if (!esperado.ceros || esperado.ceros.some((c) => !c.tipo)) return null;
  const tipos = esperado.ceros.map((c) => c.tipo);
  return [
    ...(tipos.includes('cambio-signo') ? ['W-01'] : []),
    ...tipos.filter((t) => t === 'tangencia').map(() => 'W-02'),
    ...tipos.filter((t) => t === 'extremo').map(() => 'W-03'),
    ...(esperado.ceros.some((c) => c.valor.clase === 'aproximada') ? ['W-04'] : [])
  ];
}

/** Compara un ResultadoPerfil con los campos que fija `esperado`. */
function comprobar(valor, esperado) {
  if (esperado.I) expect(valor.integral.I).toEqual(esperado.I.valor);
  if (esperado.Fb) expect(valor.integral.Fb).toEqual(esperado.Fb.valor);
  if (esperado.Fa) expect(valor.integral.Fa).toEqual(esperado.Fa.valor);
  if (esperado.fProm) expect(valor.promedio.fProm).toEqual(esperado.fProm.valor);
  if (esperado.antiderivada) {
    expect(Object.hasOwn(ANTIDERIVADAS, esperado.antiderivada), esperado.antiderivada).toBe(true);
    expect(valor.integral.antiderivada.coef).toEqual(ANTIDERIVADAS[esperado.antiderivada].map(leer));
  }
  if (esperado.Ageo?.clase === 'exacta') expect(valor.area.area).toEqual({ clase: 'exacta', valor: esperado.Ageo.valor });
  if (esperado.Ageo?.clase === 'aproximada') expect(valor.area.area.clase).toBe('aproximada');
  if (esperado.identicamenteCero !== undefined) expect(valor.analisis.identicamenteCero).toBe(esperado.identicamenteCero);
  if (esperado.ceros) {
    expect(valor.analisis.ceros).toHaveLength(esperado.ceros.length);
    esperado.ceros.forEach((ref, i) => {
      const cero = valor.analisis.ceros[i];
      if (ref.tipo) expect(cero.tipo).toBe(ref.tipo);
      if (ref.multiplicidad) expect(cero.multiplicidad).toBe(ref.multiplicidad);
      expect(cero.exacto).toBe(ref.valor.clase === 'exacta');
      if (ref.valor.clase === 'exacta') expect(cero.valor).toEqual(ref.valor.valor);
    });
  }
  if (esperado.tramos) {
    expect(valor.area.tramos.map(({ desde, hasta, integral, valorAbsoluto }) => ({ desde, hasta, integral, valorAbsoluto })))
      .toEqual(esperado.tramos.map((t) => ({
        desde: t.desde.valor, hasta: t.hasta.valor, integral: t.integral.valor, valorAbsoluto: t.valorAbsoluto.valor
      })));
  }
  if (esperado.valoresAbsolutosTramos) {
    expect(valor.area.tramos.map((t) => t.valorAbsoluto)).toEqual(esperado.valoresAbsolutosTramos.map((v) => v.valor));
  }
  if (esperado.rectangulo === null) expect(valor.rectangulo).toEqual({ rectangulo: null, motivo: 'requiere-f-no-negativa' });
  if (esperado.rectangulo) {
    expect(valor.rectangulo.rectangulo).toEqual({
      base: esperado.rectangulo.base.valor, altura: esperado.rectangulo.altura.valor, area: esperado.rectangulo.area.valor
    });
  }
  if (esperado.unidades) expect([valor.unidades.area, valor.unidades.y]).toEqual([esperado.unidades.area, esperado.unidades.fProm]);
  const avisos = valor.advertencias.map((a) => a.codigo);
  if (esperado.advertencias) expect(avisos).toEqual(expect.arrayContaining(esperado.advertencias));
  const deducidas = advertenciasEsperadas(esperado);
  if (deducidas !== null) expect(avisos).toEqual(deducidas);
}

/** CR con una sola entrada de perfil válida y valores numéricos esperados. */
const CR_SIMPLES = ['CR-01', 'CR-02', 'CR-03', 'CR-04', 'CR-05', 'CR-06', 'CR-08', 'CR-14', 'CR-15', 'CR-17',
  'CR-28', 'CR-29', 'CR-30', 'CR-31', 'CR-32', 'CR-35', 'CR-36'];

describe('casos de referencia de principio a fin', () => {
  it.each(CR_SIMPLES)('%s', (id) => {
    const { entrada, esperado } = CASOS[id];
    comprobar(valido(entrada), esperado);
  });

  it.each(['CR-07', 'CR-27'])('%s: las entradas equivalentes dan resultados idénticos (R-02.3)', (id) => {
    const { entradas, esperado } = CASOS[id];
    const valores = entradas.map((e) => valido(e));
    for (const valor of valores) comprobar(valor, esperado);
    for (const campo of ['integral', 'analisis', 'area', 'promedio', 'rectangulo', 'aptitud', 'advertencias']) {
      expect(valores[1][campo], campo).toEqual(valores[0][campo]);
    }
    expect(valores[1].modelo.polinomio).toEqual(valores[0].modelo.polinomio);
    if (esperado.modelo) for (const valor of valores) expect(valor.modelo.textoNormalizado).toBe(esperado.modelo);
  });

  it('CR-16: las cuatro escrituras dan los resultados de CR-03', () => {
    const referencia = valido(CASOS['CR-03'].entrada);
    for (const entrada of CASOS['CR-16'].entradas) {
      const valor = valido(entrada);
      for (const campo of ['integral', 'analisis', 'area', 'promedio', 'rectangulo', 'aptitud', 'advertencias', 'unidades']) {
        expect(valor[campo], `${entrada.textoFuncion}: ${campo}`).toEqual(referencia[campo]);
      }
      expect(valor.modelo.polinomio).toEqual(referencia.modelo.polinomio);
    }
  });

  it.each(CASOS['CR-18'].subcasos.map((s, i) => [i, s]))('CR-18, subcaso %i', (_, { entrada, esperado }) => {
    comprobar(valido(entrada), esperado);
  });

  it('CR-15: la cota acota el error real del área y el cero contiene a √2', () => {
    const { area, analisis } = valido(CASOS['CR-15'].entrada);
    const { valor, cota } = area.area;
    expect(aDecimal(valor)).toBeCloseTo(2.4379, 4); // «A_geo ≈ 2.4379»
    // Valor exacto (8√2 − 4)/3 (formaExacta): A − cota ≤ V ≤ A + cota ⇔ (3(A ∓ cota) + 4)² ≶ 128.
    const lado = (x) => suma(producto(q(3n), x), q(4n));
    const cuadrado = (x) => producto(x, x);
    expect(comparar(cuadrado(lado(resta(valor, cota))), q(128n))).toBeLessThanOrEqual(0);
    expect(comparar(cuadrado(lado(suma(valor, cota))), q(128n))).toBeGreaterThanOrEqual(0);
    const [l, h] = analisis.ceros[0].intervalo;
    expect(comparar(producto(l, l), q(2n))).toBeLessThanOrEqual(0);
    expect(comparar(producto(h, h), q(2n))).toBeGreaterThanOrEqual(0);
    expect(aDecimal(analisis.ceros[0].valor)).toBeCloseTo(1.4142, 4);
  });

  it('CR-36: W-04 con una cota mayor que 10⁻¹² que acota el error real', () => {
    const { area } = valido(CASOS['CR-36'].entrada);
    const { valor, cota } = area.area;
    expect(comparar(cota, q(1n, 10n ** 12n))).toBe(1);
    // Valor exacto 3·∛2·10¹²⁶: con t = (A ∓ cota)/(3·10¹²⁶), t³ ≶ 2.
    const escala = q(3n * 10n ** 126n);
    const cubo = (x) => producto(producto(x, x), x);
    const inferior = resta(valor, cota);
    expect(comparar(inferior, q(0n))).toBe(1);
    expect(comparar(cubo(producto(inferior, q(1n, escala.num))), q(2n))).toBeLessThanOrEqual(0);
    expect(comparar(cubo(producto(suma(valor, cota), q(1n, escala.num))), q(2n))).toBeGreaterThanOrEqual(0);
  });

  it('CR-32: el coeficiente 1/10¹⁸ llega sin tope al modelo', () => {
    const { entrada, esperado } = CASOS['CR-32'];
    expect(valido(entrada).modelo.polinomio.coef[3]).toEqual(esperado.coeficiente.valor);
  });

  it.each(['CR-33', 'CR-34'])('%s: E-SIS-01 sin resultados, pasos ni gráfica', (id) => {
    const { entrada, esperado } = CASOS[id];
    const errorConsola = vi.spyOn(console, 'error').mockImplementation(() => {});
    const resultado = perfil(entrada);
    expect(resultado.ok).toBe(false);
    expect(codigos(resultado)).toEqual(esperado.errores);
    expect(resultado).not.toHaveProperty('valor');
    expect(resultado.errores[0].mensaje).toBe(CATALOGO['E-SIS-01'].plantilla);
    expect(errorConsola).not.toHaveBeenCalled(); // E-SIS-01 es previsto, no un fallo interno
  });

  it('CR-12: 1/x → E-EXP-08, nunca un área finita', () => {
    const { entrada, esperado } = CASOS['CR-12'];
    const resultado = perfil(entrada);
    expect(codigos(resultado)).toEqual(esperado.errores);
    expect(resultado).not.toHaveProperty('valor');
  });

  it.each(CASOS['CR-21'].subcasos.map((s, i) => [i, s]))('CR-21, subcaso %i', (_, { entrada, esperado }) => {
    // Pendientes de CR-21: el intervalo y el contenido del texto de 201 caracteres.
    const textoFuncion = entrada.textoFuncion ?? 'x+1+'.repeat(51).slice(0, entrada.longitudFuncion);
    const resultado = perfil({ textoFuncion, textoA: '0', textoB: '1' });
    expect(codigos(resultado)).toEqual(esperado.errores);
    expect(resultado.errores[0].campo).toBe('funcion');
  });

  it('CR-13: vacío, y + 1 e Infinity en a o en b', () => {
    const [vacio, simbolo, limite] = CASOS['CR-13'].subcasos;
    // Pendientes de CR-13: el intervalo de los dos primeros y la función y el lugar de Infinity.
    expect(codigos(perfil({ textoFuncion: vacio.entrada.textoFuncion, textoA: '0', textoB: '1' }))).toEqual(vacio.esperado.errores);
    expect(codigos(perfil({ textoFuncion: simbolo.entrada.textoFuncion, textoA: '0', textoB: '1' }))).toEqual(simbolo.esperado.errores);
    for (const [textoA, textoB, campo] of [[limite.entrada.textoLimite, '1', 'a'], ['0', limite.entrada.textoLimite, 'b']]) {
      const resultado = perfil({ textoFuncion: 'x', textoA, textoB });
      expect(codigos(resultado)).toEqual(limite.esperado.errores);
      expect(resultado.errores[0].campo).toBe(campo);
    }
  });

  it.each([0, 1])('CR-11, subcaso %i: E-INT sin reordenar los límites', (i) => {
    const { entrada, esperado } = CASOS['CR-11'].subcasos[i];
    // Pendiente de CR-11: la función; se usa x, que es válida.
    const resultado = perfil({ textoFuncion: 'x', ...entrada });
    expect(codigos(resultado)).toEqual(esperado.errores);
    expect(resultado.errores[0].campo).toBe('intervalo');
    expect(resultado).not.toHaveProperty('valor');
  });

  it('CR-22: el caso de uso no guarda estado; la invalidación en pantalla es de T-13', () => {
    const { entrada } = CASOS['CR-03'];
    const primero = valido(entrada);
    const segundo = valido({ ...entrada, textoB: '5' });
    // F(x) = 2x + x³/12, transcrita de CR-03: I en [0, 5] = F(5).
    const F = antiderivada([q(2n), q(0n), q(1n, 4n)]);
    expect(segundo.integral.I).toEqual(evaluar(F, q(5n)));
    expect(primero.integral.I).toEqual(CASOS['CR-03'].esperado.I.valor);
    expect(Object.isFrozen(primero)).toBe(true);
  });

  it('CR-23: el área del perfil coincide con la de la figura equivalente', () => {
    const [constante, recta] = CASOS['CR-23'].subcasos;
    const rectangulo = calcularFigura(CASOS['CR-09'].entrada).valor;
    const triangulo = calcularFigura(CASOS['CR-19'].subcasos[0].entrada).valor;
    for (const [{ entrada, esperado }, figura] of [[constante, rectangulo], [recta, triangulo]]) {
      const valor = valido(entrada);
      expect(valor.area.area).toEqual({ clase: 'exacta', valor: esperado.Ageo.valor });
      expect(valor.unidades.area).toBe(esperado.unidadArea);
      expect(valor.area.area).toEqual(figura.areaM2);
    }
  });
});

describe('validación por campos (design §11; R-19.2)', () => {
  it('función, a y b se validan por separado y se acumulan sus errores', () => {
    const resultado = perfil({ textoFuncion: 'y', textoA: '', textoB: 'abc' });
    expect(resultado.errores.map((e) => [e.campo, e.codigo]))
      .toEqual([['funcion', 'E-EXP-03'], ['a', 'E-NUM-01'], ['b', 'E-NUM-02']]);
  });

  it('E-INT-01 y E-INT-02 se suman a un error de la función, sin intercambiar los límites', () => {
    expect(codigos(perfil({ textoFuncion: 'x^4', textoA: '2', textoB: '2' }))).toEqual(['E-EXP-10', 'E-INT-01']);
    expect(codigos(perfil({ textoFuncion: '', textoA: '3', textoB: '1' }))).toEqual(['E-EXP-01', 'E-INT-02']);
  });

  it('E-INT solo se comprueba si a y b son válidos', () => {
    expect(codigos(perfil({ textoFuncion: 'x', textoA: '5', textoB: '1001' }))).toEqual(['E-NUM-04']);
    expect(codigos(perfil({ textoFuncion: 'x', textoA: 'Infinity', textoB: '-5' }))).toEqual(['E-NUM-03']);
  });

  it('límites negativos y decimales exactos son válidos (R-01.5, R-03.2)', () => {
    const { intervalo } = valido({ textoFuncion: 'x', textoA: '\u22120.1', textoB: '0.3' });
    expect(intervalo).toEqual({ a: q(-1n, 10n), b: q(3n, 10n) });
  });
});

describe('aptitud para estimar (design §9; R-16)', () => {
  it('interpretación abstracta → E-MOD-01', () => {
    const { aptitud } = valido(CASOS['CR-01'].entrada);
    expect([aptitud.apta, aptitud.motivo, aptitud.error.codigo, aptitud.error.campo]).toEqual([false, 'E-MOD-01', 'E-MOD-01', 'estimacion']);
  });

  it.each(['CR-02', 'CR-03', 'CR-05', 'CR-06', 'CR-08'])('%s en metros', (id) => {
    const { entrada, esperado } = CASOS[id];
    const { aptitud, unidades } = valido(entrada, 'fisica');
    expect(unidades).toEqual({ x: 'm', y: 'm', area: 'm²', estimable: true });
    expect(aptitud.apta).toBe(esperado.aptitudEnMetros.apta);
    expect(aptitud.motivo).toBe(esperado.aptitudEnMetros.codigo ?? null);
    expect(aptitud.error?.codigo ?? null).toBe(esperado.aptitudEnMetros.codigo ?? null);
  });

  it('una tangencia no impide estimar: f ≥ 0 y A_geo > 0 (R-16.1, con CR-07)', () => {
    const { aptitud, analisis } = valido(CASOS['CR-07'].entradas[0], 'fisica');
    expect(analisis.noNegativa).toBe(true);
    expect([aptitud.apta, aptitud.motivo, aptitud.error]).toEqual([true, null, null]);
  });

  it('las x negativas no invalidan un perfil físico (R-16.5, CR-02)', () => {
    expect(valido(CASOS['CR-02'].entrada, 'fisica').aptitud.apta).toBe(true);
  });
});

describe('errores internos (R-19.4, R-19.5)', () => {
  it.each([
    ['sin entrada', null],
    ['un número', 5],
    ['textoFuncion no es texto', { textoFuncion: 5, textoA: '0', textoB: '1', interpretacion: 'abstracta' }],
    ['interpretación desconocida', { textoFuncion: 'x', textoA: '0', textoB: '1', interpretacion: 'otra' }]
  ])('%s → E-SIS-02 sin detalles técnicos ni resultados', (_, entrada) => {
    const errorConsola = vi.spyOn(console, 'error').mockImplementation(() => {});
    const resultado = analizarPerfil(entrada);
    expect(resultado.ok).toBe(false);
    expect(codigos(resultado)).toEqual(['E-SIS-02']);
    const [error] = resultado.errores;
    expect(error.mensaje).toBe(CATALOGO['E-SIS-02'].plantilla);
    expect([error.campo, error.posicion, error.sugerencia, error.datos]).toEqual([null, null, null, {}]);
    expect(resultado).not.toHaveProperty('valor');
    expect(errorConsola).toHaveBeenCalledTimes(1); // el detalle va a la consola del navegador
  });
});

describe('contrato ResultadoPerfil (design §10)', () => {
  it('tiene los campos de design §10; pasos y grafica quedan para T-12 y T-15', () => {
    const resultado = perfil(CASOS['CR-01'].entrada);
    expect(Object.keys(resultado.valor).sort()).toEqual([
      'advertencias', 'analisis', 'aptitud', 'area', 'entrada', 'grafica', 'integral', 'intervalo', 'modelo',
      'pasos', 'promedio', 'rectangulo', 'unidades'
    ]);
    expect(resultado.valor.pasos).toBeNull();
    expect(resultado.valor.grafica).toBeNull();
    expect(resultado.advertencias).toEqual(resultado.valor.advertencias);
    expect(resultado.valor.entrada).toEqual({ ...CASOS['CR-01'].entrada });
  });

  it('el resultado y sus partes están congelados', () => {
    const resultado = perfil(CASOS['CR-03'].entrada);
    for (const parte of [resultado, resultado.valor, resultado.valor.entrada, resultado.valor.aptitud, resultado.advertencias]) {
      expect(Object.isFrozen(parte)).toBe(true);
    }
  });

  it('W-02 y W-03 llevan el cero exacto; W-04, la cota exacta', () => {
    const tangencia = valido(CASOS['CR-07'].entradas[0]).advertencias;
    expect(tangencia.map((a) => [a.codigo, a.datos.x])).toEqual([['W-02', '1']]);
    const extremo = valido(CASOS['CR-01'].entrada).advertencias;
    expect(extremo.map((a) => [a.codigo, a.datos.x])).toEqual([['W-03', '1']]);
    const { advertencias, area } = valido(CASOS['CR-15'].entrada);
    const w04 = advertencias.find((a) => a.codigo === 'W-04');
    expect(leer(w04.datos.cota)).toEqual(area.area.cota);
  });
});
