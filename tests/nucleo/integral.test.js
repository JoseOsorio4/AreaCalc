// Pruebas de src/nucleo/integral.js (T-05; design.md §7).
// I, Fb, Fa y las antiderivadas vienen de tests/casos-referencia.js. Los valores de
// cada término son las sustituciones escritas en el formulario §4.2 (CR-01) y
// §5.2 (CR-02). Cada f se escribe a mano desde el texto de la entrada del caso.
import { describe, expect, it } from 'vitest';
import { antiderivar, integrarDefinida } from '../../src/nucleo/integral.js';
import { POLINOMIO_CERO, derivar, desdeCoeficientes } from '../../src/nucleo/polinomio.js';
import { desdeDecimal, fraccion, sumar } from '../../src/nucleo/racional.js';
import { CASOS } from '../casos-referencia.js';

const q = (n, d = 1) => fraccion(BigInt(n), BigInt(d));
/** Polinomio de x^0 hacia arriba; [n, d] es la fracción n/d. */
const pol = (...coef) => desdeCoeficientes(coef.map((c) => (Array.isArray(c) ? q(...c) : q(c))));
/** Coeficientes esperados como { num, den }, escritos a mano. */
const coefs = (...coef) => coef.map((c) => (Array.isArray(c)
  ? { num: BigInt(c[0]), den: BigInt(c[1]) }
  : { num: BigInt(c), den: 1n }));
const limites = (entrada) => [desdeDecimal(entrada.textoA), desdeDecimal(entrada.textoB)];

const FUNCIONES = {
  'CR-01': pol(-1, 0, 0, 1), // x³ − 1
  'CR-02': pol(1, 0, 1), // 1 + x²
  'CR-03': pol(2, 0, [1, 4]), // 2 + x²/4
  'CR-04': pol(0, 0, 1), // x²
  'CR-05': pol(0, 1), // x
  'CR-06': pol(-2) // −2
};
// CR-18, ejercicios de P1-C: x², 3x², 5x − x² y 5x³ − 2.
const FUNCIONES_CR18 = [pol(0, 0, 1), pol(0, 0, 3), pol(0, 5, -1), pol(-2, 0, 0, 5)];

describe('integral definida de los casos de referencia', () => {
  it.each(Object.keys(FUNCIONES))('%s: I exacta', (id) => {
    const { I } = integrarDefinida(FUNCIONES[id], ...limites(CASOS[id].entrada));
    expect(I).toEqual(CASOS[id].esperado.I.valor);
  });

  it.each(['CR-01', 'CR-02', 'CR-03'])('%s: F(b) y F(a) del formulario', (id) => {
    const resultado = integrarDefinida(FUNCIONES[id], ...limites(CASOS[id].entrada));
    expect(resultado.Fb).toEqual(CASOS[id].esperado.Fb.valor);
    expect(resultado.Fa).toEqual(CASOS[id].esperado.Fa.valor);
  });

  it.each([0, 1, 2, 3])('CR-18, ejercicio %i de P1-C: I exacta', (i) => {
    const subcaso = CASOS['CR-18'].subcasos[i];
    expect(integrarDefinida(FUNCIONES_CR18[i], ...limites(subcaso.entrada)).I).toEqual(subcaso.esperado.I.valor);
  });

  it('CR-08: el polinomio cero da F = 0, ningún término e I = 0', () => {
    const resultado = integrarDefinida(POLINOMIO_CERO, ...limites(CASOS['CR-08'].entrada));
    expect(resultado.antiderivada.coef).toEqual([]);
    expect(resultado.terminos).toEqual([]);
    expect(resultado.I).toEqual(CASOS['CR-08'].esperado.I.valor);
  });
});

describe('antiderivada con F(0) = 0, sin «+C»', () => {
  it('coincide con las antiderivadas de CR-01, CR-02 y CR-03', () => {
    expect(CASOS['CR-01'].esperado.antiderivada).toBe('x⁴/4 − x');
    expect(antiderivar(FUNCIONES['CR-01']).coef).toEqual(coefs(0, -1, 0, 0, [1, 4]));
    expect(CASOS['CR-02'].esperado.antiderivada).toBe('x + x³/3');
    expect(antiderivar(FUNCIONES['CR-02']).coef).toEqual(coefs(0, 1, 0, [1, 3]));
    expect(CASOS['CR-03'].esperado.antiderivada).toBe('2x + x³/12');
    expect(antiderivar(FUNCIONES['CR-03']).coef).toEqual(coefs(0, 2, 0, [1, 12]));
  });

  it('su derivada es la función original', () => {
    for (const f of [...Object.values(FUNCIONES), ...FUNCIONES_CR18]) expect(derivar(antiderivar(f))).toEqual(f);
  });
});

describe('desglose de términos (design §7)', () => {
  it('CR-01: F(4) = 4⁴/4 − 4 = 64 − 4 y F(1) = 1⁴/4 − 1 (formulario §4.2)', () => {
    const { terminos } = integrarDefinida(FUNCIONES['CR-01'], ...limites(CASOS['CR-01'].entrada));
    expect(terminos).toEqual([
      { coefOriginal: q(1), potencia: 4, coefAntiderivada: q(1, 4), valorEnB: q(64), valorEnA: q(1, 4) },
      { coefOriginal: q(-1), potencia: 1, coefAntiderivada: q(-1), valorEnB: q(-4), valorEnA: q(-1) }
    ]);
  });

  it('CR-02: F(2) = 2 + 2³/3 y F(−1) = (−1) + (−1)³/3 (formulario §5.2)', () => {
    const { terminos } = integrarDefinida(FUNCIONES['CR-02'], ...limites(CASOS['CR-02'].entrada));
    expect(terminos).toEqual([
      { coefOriginal: q(1), potencia: 3, coefAntiderivada: q(1, 3), valorEnB: q(8, 3), valorEnA: q(-1, 3) },
      { coefOriginal: q(1), potencia: 1, coefAntiderivada: q(1), valorEnB: q(2), valorEnA: q(-1) }
    ]);
  });

  it('los términos suman F(b) y F(a) y omiten los coeficientes nulos', () => {
    const casos = [
      ...Object.keys(FUNCIONES).map((id) => [FUNCIONES[id], CASOS[id].entrada]),
      ...FUNCIONES_CR18.map((f, i) => [f, CASOS['CR-18'].subcasos[i].entrada])
    ];
    for (const [f, entrada] of casos) {
      const resultado = integrarDefinida(f, ...limites(entrada));
      expect(resultado.terminos).toHaveLength(f.coef.filter((c) => c.num !== 0n).length);
      expect(resultado.terminos.reduce((s, t) => sumar(s, t.valorEnB), q(0))).toEqual(resultado.Fb);
      expect(resultado.terminos.reduce((s, t) => sumar(s, t.valorEnA), q(0))).toEqual(resultado.Fa);
    }
  });

  it('el resultado está congelado', () => {
    const resultado = integrarDefinida(FUNCIONES['CR-01'], q(1), q(4));
    expect(Object.isFrozen(resultado)).toBe(true);
    expect(Object.isFrozen(resultado.terminos)).toBe(true);
    expect(Object.isFrozen(resultado.terminos[0])).toBe(true);
  });
});

describe('validación', () => {
  it('exige a < b, sin intercambiar los límites', () => {
    expect(() => integrarDefinida(pol(1), q(2), q(2))).toThrow(RangeError);
    expect(() => integrarDefinida(pol(1), q(3), q(1))).toThrow(RangeError);
  });

  it('rechaza lo que no es un polinomio', () => {
    expect(() => integrarDefinida([q(1)], q(0), q(1))).toThrow(TypeError);
    expect(() => antiderivar(null)).toThrow(TypeError);
  });
});
