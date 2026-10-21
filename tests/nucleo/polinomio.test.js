// Pruebas de src/nucleo/polinomio.js (T-03; design.md §7).
// Los valores esperados son cálculos hechos a mano, escritos como { num, den }
// sin usar el módulo, o vienen de tests/casos-referencia.js: antiderivadas y
// sustituciones de CR-01, CR-02, CR-03 y CR-31, y raíces múltiples de CR-04,
// CR-29 y CR-30.
import { describe, expect, it } from 'vitest';
import {
  POLINOMIO_CERO, derivar, desdeCoeficientes, dividirConResto, escalar, esCero, evaluar,
  evaluarAprox, grado, mcd, multiplicar, potencia, restar, sumar
} from '../../src/nucleo/polinomio.js';
import { fraccion } from '../../src/nucleo/racional.js';
import { CASOS } from '../casos-referencia.js';

/** Racional de entrada: q(3) = 3 y q(-1, 4) = −1/4. */
const q = (n, d = 1) => fraccion(BigInt(n), BigInt(d));
/** Polinomio de entrada, de x^0 hacia arriba; [n, d] es la fracción n/d. */
const pol = (...coef) => desdeCoeficientes(coef.map((c) => (Array.isArray(c) ? q(...c) : q(c))));
/** Coeficientes esperados como { num, den }, escritos a mano y ya irreducibles. */
const coefs = (...coef) => coef.map((c) => (Array.isArray(c)
  ? { num: BigInt(c[0]), den: BigInt(c[1]) }
  : { num: BigInt(c), den: 1n }));

describe('contrato y polinomio cero (design §7)', () => {
  it('el polinomio cero es coef = [] con grado −1', () => {
    expect(POLINOMIO_CERO.coef).toEqual([]);
    expect(grado(POLINOMIO_CERO)).toBe(-1);
    expect(esCero(POLINOMIO_CERO)).toBe(true);
    expect(grado(pol(5))).toBe(0);
    expect(grado(pol(0, 0, 0, 1))).toBe(3);
    expect(esCero(pol(5))).toBe(false);
  });

  it('quita los ceros finales: el coeficiente principal nunca es 0', () => {
    expect(pol(1, 0, 0).coef).toEqual(coefs(1));
    expect(pol(0, 0).coef).toEqual([]);
    expect(pol(0, [3, 6], 0).coef).toEqual(coefs(0, [1, 2]));
  });

  it('las operaciones que se anulan dan exactamente el polinomio cero', () => {
    const p = pol(2, -3, 0, 1);
    const ceros = [
      restar(p, p), sumar(p, escalar(p, q(-1))), multiplicar(p, POLINOMIO_CERO),
      escalar(p, q(0)), derivar(pol(7)), derivar(POLINOMIO_CERO)
    ];
    for (const cero of ceros) {
      expect(cero.coef).toEqual([]);
      expect(grado(cero)).toBe(-1);
    }
  });

  it('baja el grado si se cancela el término principal', () => {
    // (x³ + x) − x³ = x: el resultado no puede quedar como [0, 1, 0, 0].
    const diferencia = restar(pol(0, 1, 0, 1), pol(0, 0, 0, 1));
    expect(diferencia.coef).toEqual(coefs(0, 1));
    expect(grado(diferencia)).toBe(1);
  });

  it('los polinomios están congelados', () => {
    const p = multiplicar(pol(-1, 1), pol(1, 1));
    expect(Object.isFrozen(p)).toBe(true);
    expect(Object.isFrozen(p.coef)).toBe(true);
    expect(() => { p.coef.push(q(1)); }).toThrow(TypeError);
  });

  it('rechaza coeficientes que no son racionales y argumentos que no son polinomios', () => {
    expect(() => desdeCoeficientes([1, 2])).toThrow(TypeError);
    expect(() => desdeCoeficientes([q(1), 0.5])).toThrow(TypeError);
    expect(() => desdeCoeficientes('x^2')).toThrow(TypeError);
    expect(() => sumar(pol(1), [q(1)])).toThrow(TypeError);
    expect(() => grado(null)).toThrow(TypeError);
    expect(() => escalar(pol(1), 2)).toThrow(TypeError);
  });
});

describe('suma, resta y escalado', () => {
  it('opera coeficiente a coeficiente, también con grados distintos', () => {
    // (1 + 2x) + (3 − 2x + x²) = 4 + x²
    expect(sumar(pol(1, 2), pol(3, -2, 1)).coef).toEqual(coefs(4, 0, 1));
    // (1/2 + x³) − (1/3 + x) = 1/6 − x + x³
    expect(restar(pol([1, 2], 0, 0, 1), pol([1, 3], 1)).coef).toEqual(coefs([1, 6], -1, 0, 1));
    expect(sumar(POLINOMIO_CERO, pol(0, 5)).coef).toEqual(coefs(0, 5));
  });

  it('escala por un racional', () => {
    // (−2/3)·(1/2 − x) = −1/3 + 2x/3
    expect(escalar(pol([1, 2], -1), q(-2, 3)).coef).toEqual(coefs([-1, 3], [2, 3]));
  });
});

describe('producto y potencia', () => {
  it('T-03: (x − 1)² = x² − 2x + 1', () => {
    expect(potencia(pol(-1, 1), 2).coef).toEqual(coefs(1, -2, 1));
    expect(multiplicar(pol(-1, 1), pol(-1, 1)).coef).toEqual(coefs(1, -2, 1));
  });

  it('multiplica con coeficientes fraccionarios', () => {
    expect(multiplicar(pol(-1, 1), pol(1, 1)).coef).toEqual(coefs(-1, 0, 1)); // x² − 1
    // (1/3 + x/2)(−1/2 + 3x) = −1/6 + 3x/4 + 3x²/2
    expect(multiplicar(pol([1, 3], [1, 2]), pol([-1, 2], 3)).coef).toEqual(coefs([-1, 6], [3, 4], [3, 2]));
  });

  it('eleva a potencias enteras no negativas', () => {
    expect(potencia(pol(-1, 1), 3).coef).toEqual(coefs(-1, 3, -3, 1)); // (x − 1)³
    expect(potencia(pol(0, 2), 3n).coef).toEqual(coefs(0, 0, 0, 8)); // (2x)³ = 8x³
    expect(potencia(pol(-1, 1), 1).coef).toEqual(coefs(-1, 1));
    expect(potencia(pol(-1, 1), 0).coef).toEqual(coefs(1));
    expect(potencia(POLINOMIO_CERO, 0).coef).toEqual(coefs(1)); // p⁰ = 1, como en racional.js
    expect(potencia(POLINOMIO_CERO, 2).coef).toEqual([]);
  });

  it('rechaza exponentes negativos o no enteros', () => {
    expect(() => potencia(pol(1, 1), -1)).toThrow(RangeError);
    expect(() => potencia(pol(1, 1), 1.5)).toThrow(TypeError);
  });
});

describe('derivada', () => {
  it('aplica la regla de la potencia término a término', () => {
    expect(derivar(pol(-1, 0, 0, 1)).coef).toEqual(coefs(0, 0, 3)); // (x³ − 1)′ = 3x²
    // (5 + x/2 − 2x²/3)′ = 1/2 − 4x/3
    expect(derivar(pol(5, [1, 2], [-2, 3])).coef).toEqual(coefs([1, 2], [-4, 3]));
  });

  it('la derivada de la antiderivada es la función (CR-01, CR-02 y CR-31)', () => {
    // Cada F de casos-referencia, escrita en coeficientes.
    expect(CASOS['CR-01'].esperado.antiderivada).toBe('x⁴/4 − x');
    expect(derivar(pol(0, -1, 0, 0, [1, 4])).coef).toEqual(coefs(-1, 0, 0, 1)); // x³ − 1
    expect(CASOS['CR-02'].esperado.antiderivada).toBe('x + x³/3');
    expect(derivar(pol(0, 1, 0, [1, 3])).coef).toEqual(coefs(1, 0, 1)); // 1 + x²
    expect(CASOS['CR-31'].esperado.antiderivada).toBe('x²/2 − x/3');
    expect(derivar(pol(0, [-1, 3], [1, 2])).coef).toEqual(coefs([-1, 3], 1)); // x − 1/3
  });
});

describe('división con resto', () => {
  it('T-03: x³ − x entre x − 1 da x² + x, sin resto', () => {
    const { cociente, resto } = dividirConResto(pol(0, -1, 0, 1), pol(-1, 1));
    expect(cociente.coef).toEqual(coefs(0, 1, 1));
    expect(resto.coef).toEqual([]);
  });

  it('deja un resto de grado menor que el divisor', () => {
    // x³ + 2x + 5 = x·(x² + 1) + (x + 5)
    const { cociente, resto } = dividirConResto(pol(5, 2, 0, 1), pol(1, 0, 1));
    expect(cociente.coef).toEqual(coefs(0, 1));
    expect(resto.coef).toEqual(coefs(5, 1));
  });

  it('divide entre divisores con coeficiente principal distinto de 1', () => {
    // x² − 1 = (x/2 − 1/2)·(2x + 2)
    const { cociente, resto } = dividirConResto(pol(-1, 0, 1), pol(2, 2));
    expect(cociente.coef).toEqual(coefs([-1, 2], [1, 2]));
    expect(resto.coef).toEqual([]);
    // (4x² − 2)/2 = 2x² − 1
    expect(dividirConResto(pol(-2, 0, 4), pol(2)).cociente.coef).toEqual(coefs(-1, 0, 2));
  });

  it('si el dividendo tiene menor grado, el cociente es 0 y el resto es el dividendo', () => {
    const { cociente, resto } = dividirConResto(pol(1, 1), pol(0, 0, 1));
    expect(cociente.coef).toEqual([]);
    expect(resto.coef).toEqual(coefs(1, 1));
    expect(dividirConResto(POLINOMIO_CERO, pol(-1, 1)).resto.coef).toEqual([]);
  });

  it('lanza un error interno al dividir entre el polinomio cero', () => {
    expect(() => dividirConResto(pol(1, 1), POLINOMIO_CERO)).toThrow(RangeError);
  });
});

describe('mcd mónico', () => {
  it('T-03: mcd((x − 1)²(x + 2), su derivada) = x − 1, la tangencia de CR-30', () => {
    const f = pol(2, -3, 0, 1); // (x − 1)²(x + 2) = x³ − 3x + 2
    expect(derivar(f).coef).toEqual(coefs(-3, 0, 3));
    const g = mcd(f, derivar(f));
    expect(g.coef).toEqual(coefs(-1, 1));
    const tangencia = CASOS['CR-30'].esperado.ceros.find((cero) => cero.tipo === 'tangencia');
    expect(tangencia.multiplicidad).toBe(2);
    expect(evaluar(g, tangencia.valor.valor)).toEqual({ num: 0n, den: 1n });
  });

  it('raíz triple: mcd(f, f′) = (x − r)² (CR-29); raíz doble en 0: x (CR-04)', () => {
    expect(CASOS['CR-29'].esperado.ceros[0].multiplicidad).toBe(3);
    const cubo = potencia(pol(-1, 1), 3); // (x − 1)³
    expect(mcd(cubo, derivar(cubo)).coef).toEqual(coefs(1, -2, 1));
    expect(CASOS['CR-04'].esperado.ceros[0].multiplicidad).toBe(2);
    expect(mcd(pol(0, 0, 1), derivar(pol(0, 0, 1))).coef).toEqual(coefs(0, 1));
  });

  it('sin raíces repetidas, mcd(f, f′) = 1 (CR-14: x³ − x)', () => {
    const f = pol(0, -1, 0, 1);
    expect(mcd(f, derivar(f)).coef).toEqual(coefs(1));
    expect(mcd(pol(1, 0, 1), pol(-1, 1)).coef).toEqual(coefs(1)); // x² + 1 y x − 1
  });

  it('es mónico aunque las entradas no lo sean, y no depende del orden', () => {
    const a = pol(-2, 2); // 2x − 2
    const b = pol(-4, 0, 4); // 4x² − 4
    expect(mcd(a, b).coef).toEqual(coefs(-1, 1));
    expect(mcd(b, a).coef).toEqual(coefs(-1, 1));
    // (x/3 + 1/6)(x − 2) y (6x + 3)·x comparten 2x + 1; mónico: x + 1/2
    expect(mcd(pol([-1, 3], [-1, 2], [1, 3]), pol(0, 3, 6)).coef).toEqual(coefs([1, 2], 1));
  });

  it('con el polinomio cero o una constante', () => {
    expect(mcd(POLINOMIO_CERO, pol(-3, 3)).coef).toEqual(coefs(-1, 1));
    expect(mcd(pol(-3, 3), POLINOMIO_CERO).coef).toEqual(coefs(-1, 1));
    expect(mcd(POLINOMIO_CERO, POLINOMIO_CERO).coef).toEqual([]);
    expect(mcd(pol(-1, 0, 1), pol(5)).coef).toEqual(coefs(1));
  });
});

describe('evaluación exacta con Horner', () => {
  it('sustituye en las antiderivadas de los casos de referencia', () => {
    expect(CASOS['CR-03'].esperado.antiderivada).toBe('2x + x³/12');
    const F01 = pol(0, -1, 0, 0, [1, 4]); // x⁴/4 − x
    const F02 = pol(0, 1, 0, [1, 3]); // x + x³/3
    const F03 = pol(0, 2, 0, [1, 12]); // 2x + x³/12
    const F31 = pol(0, [-1, 3], [1, 2]); // x²/2 − x/3
    const casos = [
      ['CR-01, F(4)', F01, q(4), CASOS['CR-01'].esperado.Fb],
      ['CR-01, F(1)', F01, q(1), CASOS['CR-01'].esperado.Fa],
      ['CR-02, F(2)', F02, q(2), CASOS['CR-02'].esperado.Fb],
      ['CR-02, F(−1)', F02, q(-1), CASOS['CR-02'].esperado.Fa],
      ['CR-03, F(4)', F03, q(4), CASOS['CR-03'].esperado.Fb],
      ['CR-03, F(0)', F03, q(0), CASOS['CR-03'].esperado.Fa],
      ['CR-31, F(1/3)', F31, q(1, 3), CASOS['CR-31'].esperado.FenRaiz],
      ['CR-31, F(1)', F31, q(1), CASOS['CR-31'].esperado.Fb]
    ];
    for (const [nombre, F, punto, esperado] of casos) {
      expect(evaluar(F, punto), nombre).toEqual(esperado.valor);
    }
  });

  it('evalúa el polinomio cero, constantes y puntos que exceden 2^53', () => {
    expect(evaluar(POLINOMIO_CERO, q(7))).toEqual({ num: 0n, den: 1n });
    expect(evaluar(pol(-5, 0, 0), q(1000))).toEqual({ num: -5n, den: 1n });
    // x³ − 1 en 2^20 da 2^60 − 1, que Number no representa
    expect(evaluar(pol(-1, 0, 0, 1), q(2 ** 20))).toEqual({ num: 2n ** 60n - 1n, den: 1n });
    expect(evaluar(pol(-1, 0, 0, 1), q(1, 2))).toEqual({ num: -7n, den: 8n }); // −7/8
  });

  it('exige un punto racional, no un Number', () => {
    expect(() => evaluar(pol(1, 1), 2)).toThrow(TypeError);
    expect(() => evaluar(POLINOMIO_CERO, 0.5)).toThrow(TypeError);
  });
});

describe('evaluación aproximada, solo para la gráfica', () => {
  it('da el valor en Number', () => {
    expect(evaluarAprox(pol(-1, 0, 0, 1), 4)).toBe(63);
    expect(evaluarAprox(pol(-1, 0, 0, 1), 0.5)).toBe(-0.875);
    const { num, den } = CASOS['CR-03'].esperado.Fb.valor; // F(4) = 40/3
    expect(evaluarAprox(pol(0, 2, 0, [1, 12]), 4)).toBeCloseTo(Number(num) / Number(den), 12);
    expect(evaluarAprox(POLINOMIO_CERO, 3)).toBe(0);
  });

  it('da Infinity si un coeficiente no cabe en Number (W-07 en la gráfica)', () => {
    expect(evaluarAprox(desdeCoeficientes([fraccion(10n ** 400n, 1n)]), 1)).toBe(Infinity);
  });

  it('exige un Number como punto', () => {
    expect(() => evaluarAprox(pol(1, 1), q(2))).toThrow(TypeError);
  });
});
