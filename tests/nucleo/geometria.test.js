// Pruebas de src/nucleo/geometria.js (T-07; design.md §9; requirements R-14; formulario §8).
// Las entradas y los resultados de CR-09, CR-10 y CR-19 vienen de tests/casos-referencia.js;
// las dimensiones se leen con numeros.leerNumero, como en la aplicación.
import { describe, expect, it } from 'vitest';
import * as geometria from '../../src/nucleo/geometria.js';
import { REGLAS, leerNumero } from '../../src/nucleo/numeros.js';
import { PI_APROX, abs, comparar, desdeDecimal, fraccion, multiplicar, restar, sumar } from '../../src/nucleo/racional.js';
import { areaAMetrosCuadrados, unidadDeArea } from '../../src/nucleo/unidades.js';
import { CASOS } from '../casos-referencia.js';

const { COTA_PI, areaCirculo, areaRectangulo, areaTriangulo } = geometria;
const q = (n, d = 1) => fraccion(BigInt(n), BigInt(d));
const reglasDe = (unidad) => (unidad === 'cm' ? REGLAS.dimensionCm : REGLAS.dimensionM);
/** Dimensión leída del texto del caso; falla la prueba si el texto no es válido. */
function dimension(texto, unidad) {
  const resultado = leerNumero(texto, reglasDe(unidad));
  expect(resultado.ok).toBe(true);
  return resultado.valor;
}
/** r redondea al texto de la fuente («≈ 78.5398»): |r − d| ≤ media unidad del último decimal. */
function redondeaA(r, texto) {
  const decimal = texto.replace('≈', '').trim();
  const media = fraccion(1n, 2n * 10n ** BigInt(decimal.split('.')[1].length));
  return comparar(abs(restar(r, desdeDecimal(decimal))), media) <= 0;
}

describe('rectángulo y triángulo, exactos', () => {
  it.each(['CR-09', 'CR-10'])('%s: área en la unidad² y en m²', (id) => {
    const { entrada, esperado } = CASOS[id];
    const area = areaRectangulo(dimension(entrada.base, entrada.unidad), dimension(entrada.altura, entrada.unidad));
    expect(area).toEqual({ clase: 'exacta', valor: esperado.area.valor });
    expect(unidadDeArea(entrada.unidad)).toBe(esperado.unidadArea);
    expect(areaAMetrosCuadrados(area, entrada.unidad)).toEqual({ clase: 'exacta', valor: esperado.areaM2.valor });
  });

  it('CR-19: triángulo de base 4 m y altura 3 m', () => {
    const { entrada, esperado } = CASOS['CR-19'].subcasos[0];
    const area = areaTriangulo(dimension(entrada.base, entrada.unidad), dimension(entrada.altura, entrada.unidad));
    expect(area).toEqual({ clase: 'exacta', valor: esperado.area.valor });
  });

  it('con dimensiones decimales sigue siendo exacta: 2.5 × 0.4 = 1 y 3 × 0.5 / 2 = 3/4', () => {
    expect(areaRectangulo(desdeDecimal('2.5'), desdeDecimal('0.4'))).toEqual({ clase: 'exacta', valor: q(1) });
    expect(areaTriangulo(q(3), desdeDecimal('0.5'))).toEqual({ clase: 'exacta', valor: q(3, 4) });
  });
});

describe('círculo: k·π exacto y su aproximación (R-14.5)', () => {
  it('CR-19: r = 5 m da 25π ≈ 78.5398 m², con PI_APROX y su cota', () => {
    const { entrada, esperado } = CASOS['CR-19'].subcasos[1];
    const area = areaCirculo(dimension(entrada.radio, entrada.unidad));
    expect(area.clase).toBe(esperado.area.clase);
    expect(area.coeficiente).toEqual(esperado.area.coeficiente);
    expect(area.aprox).toEqual(multiplicar(area.coeficiente, PI_APROX));
    expect(area.cota).toEqual(multiplicar(area.coeficiente, COTA_PI));
    expect(redondeaA(area.aprox, esperado.area.decimal)).toBe(true);
  });

  it('25π está entre aprox y aprox + cota (comparación exacta)', () => {
    // π con 50 decimales, truncado: PI_50 ≤ π < PI_50 + 10⁻⁵⁰.
    const PI_50 = fraccion(314159265358979323846264338327950288419716939937510n, 10n ** 50n);
    const { aprox, cota } = areaCirculo(q(5));
    expect(comparar(aprox, multiplicar(q(25), PI_50))).toBe(-1);
    expect(comparar(multiplicar(q(25), sumar(PI_50, fraccion(1n, 10n ** 50n))), sumar(aprox, cota))).toBe(-1);
  });

  it('COTA_PI es 10⁻³⁵', () => {
    expect(COTA_PI).toEqual(fraccion(1n, 10n ** 35n));
  });
});

describe('alcance y validación', () => {
  it('CR-19: el trapecio es DESEABLE y queda fuera del MVP (T-D1)', () => {
    expect(CASOS['CR-19'].subcasos[2].prioridad).toBe('DESEABLE');
    expect(Object.keys(geometria).sort()).toEqual(['COTA_PI', 'areaCirculo', 'areaRectangulo', 'areaTriangulo']);
  });

  it.each(['m', 'cm'])('CR-19: una dimensión 0 en %s da E-NUM-06', (unidad) => {
    const { entrada, esperado } = CASOS['CR-19'].subcasos[3];
    const resultado = leerNumero(entrada.textoDimension, reglasDe(unidad));
    expect(resultado.errores.map((e) => e.codigo)).toEqual(esperado.errores);
  });

  it('una dimensión no positiva que llegue sin validar es un error de programación', () => {
    expect(() => areaRectangulo(q(0), q(1))).toThrow(RangeError);
    expect(() => areaTriangulo(q(1), q(-1))).toThrow(RangeError);
    expect(() => areaCirculo(q(-1))).toThrow(RangeError);
    expect(() => areaCirculo(5)).toThrow(TypeError);
  });

  it('los resultados están congelados', () => {
    expect(Object.isFrozen(areaRectangulo(q(1), q(2)))).toBe(true);
    expect(Object.isFrozen(areaCirculo(q(1)))).toBe(true);
  });
});
