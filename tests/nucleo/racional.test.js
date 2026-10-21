// Pruebas de src/nucleo/racional.js (T-02; design.md §6).
// Los valores esperados son cálculos manuales o, en CR-17, vienen de
// tests/casos-referencia.js; nunca se obtienen con el código bajo prueba. Las
// invariantes se comprueban con un mcd propio de esta prueba, y las propiedades,
// con aritmética BigInt directa.
import { describe, expect, it } from 'vitest';
import {
  PI_APROX, abs, aNumber, aTexto, comparar, desdeDecimal, dividir, entero,
  esCero, esEntero, fraccion, multiplicar, negar, potencia, restar, signo, sumar
} from '../../src/nucleo/racional.js';
import { CASOS } from '../casos-referencia.js';

/** mcd propio de la prueba (Euclides), independiente del módulo. */
function mcdPrueba(a, b) {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
}

/** Invariantes de design §6: { num, den } de BigInt, den > 0n, irreducible y congelado. */
function cumpleInvariantes(r) {
  return Object.isFrozen(r)
    && Object.keys(r).join(',') === 'num,den'
    && typeof r.num === 'bigint'
    && typeof r.den === 'bigint'
    && r.den > 0n
    && mcdPrueba(r.num, r.den) === 1n; // con num = 0n, obliga a que den sea 1n
}

describe('invariantes (design §6)', () => {
  it('deja el denominador positivo y el signo en el numerador', () => {
    expect(fraccion(3n, -4n)).toEqual({ num: -3n, den: 4n });
    expect(fraccion(-3n, -4n)).toEqual({ num: 3n, den: 4n });
    expect(fraccion(-3n, 4n)).toEqual({ num: -3n, den: 4n });
  });

  it('simplifica con el mcd: 6/8 = 3/4, 18/3 = 6 y −10/4 = −5/2', () => {
    expect(fraccion(6n, 8n)).toEqual({ num: 3n, den: 4n });
    expect(fraccion(6n, -8n)).toEqual({ num: -3n, den: 4n });
    expect(fraccion(18n, 3n)).toEqual({ num: 6n, den: 1n });
    expect(fraccion(-10n, 4n)).toEqual({ num: -5n, den: 2n });
  });

  it('el cero siempre es 0/1, sin «−0»', () => {
    const ceros = [
      fraccion(0n, 5n), fraccion(0n, -7n), entero(-0), desdeDecimal('-0'),
      desdeDecimal('-0.000'), negar(entero(0n)), restar(fraccion(3n, 4n), fraccion(3n, 4n)),
      multiplicar(fraccion(-3n, 4n), entero(0n)), sumar(fraccion(-1n, 2n), fraccion(1n, 2n))
    ];
    for (const cero of ceros) {
      expect(cero).toEqual({ num: 0n, den: 1n });
      expect(aTexto(cero)).toBe('0');
      expect(signo(cero)).toBe(0);
      expect(aNumber(cero)).toBe(0); // toBe usa Object.is: −0 no pasaría
    }
  });

  it('los resultados están congelados y no se pueden modificar', () => {
    const r = fraccion(1n, 2n);
    expect(Object.isFrozen(r)).toBe(true);
    expect(() => { r.num = 5n; }).toThrow(TypeError);
    expect(() => { r.otro = 1n; }).toThrow(TypeError);
    expect(r).toEqual({ num: 1n, den: 2n });
  });

  it('todas las funciones devuelven racionales que cumplen las invariantes', () => {
    const a = fraccion(-6n, 8n);
    const b = desdeDecimal('2.5');
    const resultados = [
      a, b, entero(-4), sumar(a, b), restar(a, b), multiplicar(a, b), dividir(a, b),
      negar(a), abs(a), potencia(a, 3), PI_APROX
    ];
    for (const r of resultados) expect(cumpleInvariantes(r)).toBe(true);
  });
});

describe('creación', () => {
  it('entero acepta BigInt y enteros exactos de Number', () => {
    expect(entero(5n)).toEqual({ num: 5n, den: 1n });
    expect(entero(-7)).toEqual({ num: -7n, den: 1n });
    expect(entero(Number.MAX_SAFE_INTEGER)).toEqual({ num: 9007199254740991n, den: 1n });
  });

  it.each([2.5, 2 ** 53, Number.NaN, Infinity, '5', null, undefined])(
    'entero rechaza %s, que no es un entero exacto',
    (valor) => {
      expect(() => entero(valor)).toThrow(TypeError);
    }
  );

  it('fraccion lanza un error interno si el denominador es 0', () => {
    expect(() => fraccion(1n, 0n)).toThrow(RangeError);
    expect(() => fraccion(0n, 0n)).toThrow(RangeError);
    expect(() => fraccion(-5, 0)).toThrow(RangeError);
  });
});

describe('desdeDecimal: decimales exactos (R-03.2)', () => {
  it('lee 0.1 como 1/10 exacto', () => {
    expect(desdeDecimal('0.1')).toEqual({ num: 1n, den: 10n });
  });

  it.each([
    ['2.5', 5n, 2n],
    ['0.25', 1n, 4n],
    ['-1', -1n, 1n],
    ['+3', 3n, 1n],
    ['-0.5', -1n, 2n],
    ['2.50', 5n, 2n],
    ['007.10', 71n, 10n],
    ['3.000', 3n, 1n],
    ['0.000001', 1n, 1000000n],
    ['1000000', 1000000n, 1n],
    ['-999.999999', -999999999n, 1000000n]
  ])('«%s» → %s/%s', (texto, num, den) => {
    expect(desdeDecimal(texto)).toEqual({ num, den });
  });

  it('conserva todas las cifras, también más allá de 2^53', () => {
    expect(desdeDecimal('9007199254740993')).toEqual({ num: 9007199254740993n, den: 1n });
    expect(desdeDecimal('123456789012345678901234567890.123456789'))
      .toEqual({ num: 123456789012345678901234567890123456789n, den: 1000000000n });
  });

  it.each([
    '', ' ', ' 1', '1 ', '.5', '5.', '0,5', '1,000', '1e3', '2E-1', 'Infinity',
    '-Infinity', 'NaN', '0x10', '1_000', '−1', '--1', '+-1', '1.2.3', 'abc'
  ])('rechaza «%s» con un error interno', (texto) => {
    expect(() => desdeDecimal(texto)).toThrow(SyntaxError);
  });

  it.each([0.1, 1n, null, undefined])('exige el texto del número: rechaza %s', (valor) => {
    expect(() => desdeDecimal(valor)).toThrow(TypeError);
  });
});

describe('aritmética', () => {
  const unMedio = fraccion(1n, 2n);
  const unTercio = fraccion(1n, 3n);

  it('suma y resta con denominador común', () => {
    expect(sumar(unMedio, unTercio)).toEqual({ num: 5n, den: 6n });
    expect(restar(unTercio, unMedio)).toEqual({ num: -1n, den: 6n });
    expect(sumar(fraccion(-1n, 6n), fraccion(-1n, 3n))).toEqual({ num: -1n, den: 2n });
    expect(restar(entero(2n), fraccion(-3n, 4n))).toEqual({ num: 11n, den: 4n });
  });

  it('multiplica y simplifica', () => {
    expect(multiplicar(fraccion(2n, 3n), fraccion(9n, 4n))).toEqual({ num: 3n, den: 2n });
    expect(multiplicar(fraccion(-2n, 5n), fraccion(5n, 2n))).toEqual({ num: -1n, den: 1n });
    expect(multiplicar(fraccion(-2n, 3n), fraccion(-3n, 4n))).toEqual({ num: 1n, den: 2n });
  });

  it('divide y deja el signo en el numerador', () => {
    expect(dividir(fraccion(3n, 4n), fraccion(3n, 8n))).toEqual({ num: 2n, den: 1n });
    expect(dividir(unMedio, fraccion(-1n, 4n))).toEqual({ num: -2n, den: 1n });
    expect(dividir(fraccion(-2n, 3n), fraccion(-4n, 9n))).toEqual({ num: 3n, den: 2n });
    expect(dividir(entero(0n), unTercio)).toEqual({ num: 0n, den: 1n });
  });

  it('lanza un error interno al dividir entre cero', () => {
    expect(() => dividir(unMedio, entero(0n))).toThrow(RangeError);
    expect(() => dividir(entero(0n), fraccion(0n, 3n))).toThrow(RangeError);
  });

  it('niega y obtiene el valor absoluto', () => {
    expect(negar(fraccion(3n, 4n))).toEqual({ num: -3n, den: 4n });
    expect(negar(fraccion(-3n, 4n))).toEqual({ num: 3n, den: 4n });
    expect(abs(fraccion(-3n, 4n))).toEqual({ num: 3n, den: 4n });
    expect(abs(fraccion(3n, 4n))).toEqual({ num: 3n, den: 4n });
  });

  it('eleva a potencias enteras no negativas', () => {
    expect(potencia(fraccion(-2n, 3n), 3)).toEqual({ num: -8n, den: 27n });
    expect(potencia(fraccion(-2n, 3n), 2)).toEqual({ num: 4n, den: 9n });
    expect(potencia(fraccion(-2n, 3n), 1n)).toEqual({ num: -2n, den: 3n });
    expect(potencia(fraccion(-2n, 3n), 0)).toEqual({ num: 1n, den: 1n });
    expect(potencia(entero(0n), 0)).toEqual({ num: 1n, den: 1n }); // 0^0 = 1, como en los polinomios
    expect(potencia(entero(0n), 3)).toEqual({ num: 0n, den: 1n });
    expect(potencia(fraccion(1n, 10n), 18)).toEqual({ num: 1n, den: 10n ** 18n });
  });

  it.each([-1, -1n])('rechaza el exponente negativo %s', (k) => {
    expect(() => potencia(unMedio, k)).toThrow(RangeError);
  });

  it.each([1.5, '2', Infinity, null])('rechaza el exponente no entero %s', (k) => {
    expect(() => potencia(unMedio, k)).toThrow(TypeError);
  });

  it('rechaza operandos que no son racionales, para no mezclar Number', () => {
    expect(() => sumar(unMedio, 1)).toThrow(TypeError);
    expect(() => sumar(unMedio, { num: 1, den: 2 })).toThrow(TypeError);
    expect(() => multiplicar(null, unMedio)).toThrow(TypeError);
    expect(() => comparar(unMedio, { num: 1n, den: -2n })).toThrow(TypeError);
    expect(() => signo(0)).toThrow(TypeError);
    expect(() => aTexto('3/4')).toThrow(TypeError);
  });
});

describe('enteros mayores que 2^53 (R-18.5)', () => {
  it('2^53 + 1 es exacto, aunque en Number se pierde la unidad', () => {
    const dosA53 = potencia(entero(2n), 53);
    expect(dosA53).toEqual({ num: 9007199254740992n, den: 1n });
    expect(sumar(dosA53, entero(1n))).toEqual({ num: 9007199254740993n, den: 1n });
    expect(2 ** 53 + 1).toBe(2 ** 53); // Number ya no distingue 2^53 de 2^53 + 1
  });

  it('opera con enteros mucho mayores que 2^53 sin perder cifras', () => {
    const diezA20 = 10n ** 20n;
    expect(multiplicar(entero(diezA20 + 1n), entero(diezA20 - 1n)))
      .toEqual({ num: 10n ** 40n - 1n, den: 1n }); // (n + 1)(n − 1) = n² − 1
    expect(dividir(entero(10n ** 30n), entero(4n * 10n ** 10n)))
      .toEqual({ num: 25n * 10n ** 18n, den: 1n });
    expect(fraccion(2n ** 60n, 2n ** 62n)).toEqual({ num: 1n, den: 4n });
  });

  it('b⁴ es exacto en el límite de la Tabla 9.3 con 6 decimales', () => {
    // F(b) contiene b⁴ (design §6): con b = 999.999999, el numerador tiene 36 cifras.
    const b4 = potencia(desdeDecimal('999.999999'), 4);
    expect(b4).toEqual({ num: 999999999n ** 4n, den: 10n ** 24n });
    expect(String(b4.num)).toHaveLength(36);
  });
});

describe('comparación', () => {
  it('comparar devuelve −1, 0 o 1', () => {
    expect(comparar(fraccion(1n, 3n), fraccion(1n, 2n))).toBe(-1);
    expect(comparar(fraccion(1n, 2n), fraccion(1n, 3n))).toBe(1);
    expect(comparar(fraccion(2n, 4n), fraccion(1n, 2n))).toBe(0);
    expect(comparar(fraccion(-1n, 2n), fraccion(-1n, 3n))).toBe(-1);
    expect(comparar(fraccion(-1n, 2n), entero(0n))).toBe(-1);
    expect(comparar(entero(0n), fraccion(0n, 9n))).toBe(0);
  });

  it('distingue valores que en Number son iguales', () => {
    const n = 10n ** 30n;
    const a = fraccion(n, n + 1n);
    const b = fraccion(n - 1n, n);
    expect(comparar(a, b)).toBe(1); // a − b = 1/(n(n + 1)) > 0
    expect(comparar(b, a)).toBe(-1);
    expect(aNumber(a)).toBe(aNumber(b)); // en Number las dos valen 1
    expect(comparar(entero(9007199254740993n), entero(9007199254740992n))).toBe(1);
  });

  it('signo, esCero y esEntero', () => {
    expect(signo(fraccion(-3n, 4n))).toBe(-1);
    expect(signo(fraccion(5n, 2n))).toBe(1);
    expect(esCero(fraccion(0n, 5n))).toBe(true);
    expect(esCero(fraccion(1n, 10n ** 30n))).toBe(false);
    expect(esEntero(fraccion(6n, 3n))).toBe(true);
    expect(esEntero(desdeDecimal('3.000'))).toBe(true);
    expect(esEntero(entero(0n))).toBe(true);
    expect(esEntero(fraccion(5n, 2n))).toBe(false);
  });
});

describe('conversión', () => {
  it('aTexto pone el signo en el numerador y escribe los enteros sin denominador', () => {
    expect(aTexto(fraccion(-3n, 4n))).toBe('-3/4');
    expect(aTexto(fraccion(3n, -4n))).toBe('-3/4');
    expect(aTexto(fraccion(6n, 3n))).toBe('2');
    expect(aTexto(entero(-5n))).toBe('-5');
    expect(aTexto(entero(9007199254740993n))).toBe('9007199254740993');
  });

  it('aNumber da lo mismo que la división de Number con operandos exactos', () => {
    const casos = [[1n, 10n], [1n, 3n], [2n, 3n], [-3n, 4n], [22n, 7n], [-1n, 7n], [9007199254740991n, 3n]];
    for (const [n, d] of casos) expect(aNumber(fraccion(n, d))).toBe(Number(n) / Number(d));
    expect(aNumber(desdeDecimal('0.1'))).toBe(0.1);
  });

  it('aNumber funciona aunque num y den no quepan en Number, sin NaN ni −0', () => {
    const grande = 10n ** 400n;
    expect(aNumber(fraccion(grande + 1n, grande))).toBe(1);
    expect(aNumber(fraccion(-3n * grande - 1n, grande))).toBe(-3);
    expect(aNumber(entero(grande))).toBe(Infinity);
    expect(aNumber(entero(-grande))).toBe(-Infinity);
    expect(aNumber(fraccion(1n, grande))).toBe(0);
    expect(aNumber(fraccion(-1n, grande))).toBe(0); // toBe(0) rechaza −0
  });
});

describe('CR-17: 0.1 + 0.2 = 3/10, exacto (requirements §14)', () => {
  // Valor esperado transcrito en tests/casos-referencia.js.
  const esperado = CASOS['CR-17'].esperado.suma.valor;

  it('suma los decimales escritos sin error binario', () => {
    const suma = sumar(desdeDecimal('0.1'), desdeDecimal('0.2'));
    expect(suma).toEqual(esperado);
    expect(comparar(suma, desdeDecimal('0.3'))).toBe(0);
    expect(aTexto(suma)).toBe('3/10');
  });

  it('con Number la misma suma no da 0.3', () => {
    expect(0.1 + 0.2).not.toBe(0.3);
  });
});

describe('PI_APROX (design §6)', () => {
  it('vale exactamente 3.14159265358979323846264338327950288', () => {
    // p/q = c/d si y solo si p·d = c·q
    expect(PI_APROX.num * 10n ** 35n).toBe(314159265358979323846264338327950288n * PI_APROX.den);
  });

  it('difiere de π en menos de 10^-35', () => {
    // π con 50 decimales, truncado (error < 10^-50): PI_50 / 10^50
    const PI_50 = 314159265358979323846264338327950288419716939937510n;
    const diferencia = PI_50 * PI_APROX.den - PI_APROX.num * 10n ** 50n; // (π₅₀ − PI_APROX)·10^50·q
    expect(diferencia > 0n).toBe(true);
    // (π₅₀ − PI_APROX) + 10^-50 < 10^-35
    expect((diferencia + PI_APROX.den) * 10n ** 35n < 10n ** 50n * PI_APROX.den).toBe(true);
  });
});

describe('propiedades con semilla fija', () => {
  // splitmix64: generador pseudoaleatorio propio de la prueba (design §15).
  let estado = 20261020n;
  function azar() {
    estado = BigInt.asUintN(64, estado + 0x9e3779b97f4a7c15n);
    let z = estado;
    z = BigInt.asUintN(64, (z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n);
    z = BigInt.asUintN(64, (z ^ (z >> 27n)) * 0x94d049bb133111ebn);
    return z ^ (z >> 31n);
  }
  /** Entero con signo de hasta `bits` bits. */
  function enteroAzar(bits) {
    let valor = 0n;
    for (let i = 0; i < bits; i += 64) valor = (valor << 64n) | azar();
    valor = BigInt.asUintN(bits, valor);
    return azar() >> 63n ? -valor : valor;
  }
  const TAMANOS = [2, 8, 52, 64, 200];
  const tamano = () => TAMANOS[Number(azar() % BigInt(TAMANOS.length))];
  const crudo = () => ({ num: enteroAzar(tamano()), den: enteroAzar(tamano()) || 1n });
  const pares = Array.from({ length: 300 }, () => [crudo(), crudo()]);

  it('fraccion conserva el valor y cumple las invariantes', () => {
    const fallos = pares.flat().filter(({ num, den }) => {
      const r = fraccion(num, den);
      return !cumpleInvariantes(r) || r.num * den !== num * r.den;
    });
    expect(fallos).toEqual([]);
  });

  it('las operaciones y comparar coinciden con el cálculo directo con BigInt', () => {
    // r representa p/q si cumple las invariantes y r.num·q = p·r.den
    const representa = (r, p, q) => cumpleInvariantes(r) && r.num * q === p * r.den;
    const fallos = [];
    for (const [x, y] of pares) {
      const a = fraccion(x.num, x.den);
      const b = fraccion(y.num, y.den);
      const diferencia = a.num * b.den - b.num * a.den;
      if (!representa(sumar(a, b), a.num * b.den + b.num * a.den, a.den * b.den)) fallos.push(['sumar', x, y]);
      if (!representa(restar(a, b), diferencia, a.den * b.den)) fallos.push(['restar', x, y]);
      if (!representa(multiplicar(a, b), a.num * b.num, a.den * b.den)) fallos.push(['multiplicar', x, y]);
      if (b.num !== 0n && !representa(dividir(a, b), a.num * b.den, a.den * b.num)) fallos.push(['dividir', x, y]);
      if (comparar(a, b) !== (diferencia < 0n ? -1 : diferencia > 0n ? 1 : 0)) fallos.push(['comparar', x, y]);
    }
    expect(fallos).toEqual([]);
  });
});
