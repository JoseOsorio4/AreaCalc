// Pruebas de src/nucleo/promedio.js (T-05; design.md §7).
// I, f_prom, A_geo y el rectángulo esperados vienen de tests/casos-referencia.js.
// Cada f se escribe a mano desde el texto de la entrada del caso.
import { describe, expect, it } from 'vitest';
import { analizarSigno } from '../../src/nucleo/ceros.js';
import { integrarDefinida } from '../../src/nucleo/integral.js';
import { desdeCoeficientes } from '../../src/nucleo/polinomio.js';
import { MOTIVO_SIN_RECTANGULO, rectanguloEquivalente, valorPromedio } from '../../src/nucleo/promedio.js';
import { desdeDecimal, fraccion, multiplicar } from '../../src/nucleo/racional.js';
import { CASOS } from '../casos-referencia.js';

const q = (n, d = 1) => fraccion(BigInt(n), BigInt(d));
const pol = (...coef) => desdeCoeficientes(coef.map((c) => (Array.isArray(c) ? q(...c) : q(c))));
const limites = (entrada) => [desdeDecimal(entrada.textoA), desdeDecimal(entrada.textoB)];
const entradaDe = (id) => CASOS[id].entrada ?? CASOS[id].entradas[0];

const FUNCIONES = {
  'CR-01': pol(-1, 0, 0, 1), // x³ − 1
  'CR-02': pol(1, 0, 1), // 1 + x²
  'CR-03': pol(2, 0, [1, 4]), // 2 + x²/4
  'CR-04': pol(0, 0, 1), // x²
  'CR-05': pol(0, 1), // x
  'CR-06': pol(-2), // −2
  'CR-07': pol(1, -2, 1) // (x − 1)²
};
const FUNCIONES_CR18 = [pol(0, 0, 1), pol(0, 0, 3), pol(0, 5, -1), pol(-2, 0, 0, 5)];

describe('valor promedio (R-07)', () => {
  it.each(Object.keys(FUNCIONES))('%s: f_prom = I/(b − a) con la I del caso', (id) => {
    const [a, b] = limites(entradaDe(id));
    const { longitud, fProm } = valorPromedio(CASOS[id].esperado.I.valor, a, b);
    expect(longitud).toEqual(fraccion(b.num * a.den - a.num * b.den, a.den * b.den)); // b − a
    expect(fProm).toEqual(CASOS[id].esperado.fProm.valor);
  });

  it.each([0, 1, 2, 3])('CR-18, ejercicio %i de P1-C: f_prom exacto', (i) => {
    const { entrada, esperado } = CASOS['CR-18'].subcasos[i];
    expect(valorPromedio(esperado.I.valor, ...limites(entrada)).fProm).toEqual(esperado.fProm.valor);
  });

  it('solo divide la I que recibe: no vuelve a integrar', () => {
    // Con una I arbitraria, el resultado es esa I entre b − a, sin ninguna función de por medio.
    expect(valorPromedio(q(7), q(0), q(2)).fProm).toEqual(q(7, 2));
    expect(valorPromedio(q(-1, 3), q(-1), q(1)).fProm).toEqual(q(-1, 6));
  });

  it('I = (b − a)·f_prom exactamente, con la I calculada por integral.js', () => {
    const casos = [
      ...Object.keys(FUNCIONES).map((id) => [FUNCIONES[id], entradaDe(id), CASOS[id].esperado.fProm.valor]),
      ...FUNCIONES_CR18.map((f, i) => [f, CASOS['CR-18'].subcasos[i].entrada, CASOS['CR-18'].subcasos[i].esperado.fProm.valor])
    ];
    for (const [f, entrada, fPromEsperado] of casos) {
      const [a, b] = limites(entrada);
      const { I } = integrarDefinida(f, a, b);
      const { longitud, fProm } = valorPromedio(I, a, b);
      expect(fProm).toEqual(fPromEsperado);
      expect(multiplicar(longitud, fProm)).toEqual(I);
    }
  });
});

describe('rectángulo equivalente (R-08)', () => {
  /** Rectángulo de un caso, con el análisis de signo real de ceros.js. */
  function rectanguloDe(id) {
    const [a, b] = limites(entradaDe(id));
    const analisis = analizarSigno(FUNCIONES[id], a, b);
    return rectanguloEquivalente(analisis, CASOS[id].esperado.fProm.valor, a, b);
  }

  it('CR-03: rectángulo de 4 × 10/3 con área 40/3', () => {
    const { rectangulo, motivo } = rectanguloDe('CR-03');
    const esperado = CASOS['CR-03'].esperado.rectangulo;
    expect(rectangulo).toEqual({ base: esperado.base.valor, altura: esperado.altura.valor, area: esperado.area.valor });
    expect(motivo).toBeNull();
  });

  it.each(['CR-02', 'CR-03', 'CR-04', 'CR-07'])('%s: f ≥ 0, y el rectángulo conserva el área: (b − a)·f_prom = A_geo', (id) => {
    const { rectangulo } = rectanguloDe(id);
    expect(rectangulo.area).toEqual(CASOS[id].esperado.Ageo.valor);
  });

  it('CR-06: f negativa, sin rectángulo y con el motivo', () => {
    const { rectangulo, motivo } = rectanguloDe('CR-06');
    expect(rectangulo).toBe(CASOS['CR-06'].esperado.rectangulo); // null
    expect(motivo).toBe(MOTIVO_SIN_RECTANGULO);
  });

  it('CR-05: f cambia de signo, sin rectángulo', () => {
    expect(rectanguloDe('CR-05')).toEqual({ rectangulo: null, motivo: MOTIVO_SIN_RECTANGULO });
  });

  it('el resultado está congelado', () => {
    const resultado = rectanguloDe('CR-03');
    expect(Object.isFrozen(resultado)).toBe(true);
    expect(Object.isFrozen(resultado.rectangulo)).toBe(true);
  });
});

describe('validación', () => {
  it('exige a < b', () => {
    expect(() => valorPromedio(q(1), q(2), q(2))).toThrow(RangeError);
    expect(() => valorPromedio(q(1), q(3), q(1))).toThrow(RangeError);
    expect(() => rectanguloEquivalente({ noNegativa: true }, q(1), q(2), q(1))).toThrow(RangeError);
  });

  it('exige el análisis de signo y valores racionales', () => {
    expect(() => rectanguloEquivalente({}, q(1), q(0), q(1))).toThrow(TypeError);
    expect(() => rectanguloEquivalente({ noNegativa: true }, 2, q(0), q(1))).toThrow(TypeError);
    expect(() => valorPromedio(6, q(0), q(1))).toThrow(TypeError);
  });
});
