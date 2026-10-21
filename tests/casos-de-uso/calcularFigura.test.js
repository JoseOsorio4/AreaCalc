// Pruebas de src/casos-de-uso/calcularFigura.js (T-08; design.md §9 a §11; R-14).
// Los valores esperados vienen de tests/casos-referencia.js (CR-09, CR-10 y CR-19).
// Las fórmulas se transcriben del formulario §8 y los rangos, de la Tabla 9.3.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { calcularFigura } from '../../src/casos-de-uso/calcularFigura.js';
import { CATALOGO } from '../../src/nucleo/errores.js';
import { CASOS } from '../casos-referencia.js';
import { aDecimal, comparar, producto, q, suma } from '../aritmetica-independiente.js';

afterEach(() => vi.restoreAllMocks());

const codigos = (resultado) => resultado.errores.map((e) => e.codigo);

function valida(entrada) {
  const resultado = calcularFigura(entrada);
  expect(resultado.ok, JSON.stringify(entrada)).toBe(true);
  return resultado.valor;
}

/** π con 50 decimales (truncado), independiente de racional.PI_APROX: π ∈ [PI_INF, PI_INF + 10⁻⁵⁰]. */
const PI_INF = q(314159265358979323846264338327950288419716939937510n, 10n ** 50n);
const PI_SUP = suma(PI_INF, q(1n, 10n ** 50n));

describe('casos de referencia', () => {
  it.each(['CR-09', 'CR-10'])('%s', (id) => {
    const { entrada, esperado } = CASOS[id];
    const valor = valida(entrada);
    expect(valor.area).toEqual({ clase: 'exacta', valor: esperado.area.valor });
    expect(valor.unidadArea).toBe(esperado.unidadArea);
    expect(valor.areaM2).toEqual({ clase: 'exacta', valor: esperado.areaM2.valor });
  });

  it('CR-19: triángulo 4 × 3 m → 6 m²', () => {
    const { entrada, esperado } = CASOS['CR-19'].subcasos[0];
    const valor = valida(entrada);
    expect(valor.area).toEqual({ clase: 'exacta', valor: esperado.area.valor });
    expect(valor.unidadArea).toBe(esperado.unidadArea);
  });

  it('CR-19: círculo r = 5 m → 25π m² exacto, con su aproximación y su cota', () => {
    const { entrada, esperado } = CASOS['CR-19'].subcasos[1];
    const { area, areaM2, unidadArea } = valida(entrada);
    expect(area.clase).toBe('multiploPi');
    expect(area.coeficiente).toEqual(esperado.area.coeficiente);
    expect(aDecimal(area.aprox)).toBeCloseTo(78.5398, 4); // «≈ 78.5398»
    // 25π está en [aprox, aprox + cota] (PI_APROX es π truncado, design §6).
    const k = q(esperado.area.coeficiente.num, esperado.area.coeficiente.den);
    expect(comparar(area.aprox, producto(k, PI_INF))).toBeLessThanOrEqual(0);
    expect(comparar(producto(k, PI_SUP), suma(area.aprox, area.cota))).toBeLessThanOrEqual(0);
    expect(comparar(area.cota, producto(k, q(1n, 10n ** 35n)))).toBeLessThanOrEqual(0);
    expect([unidadArea, areaM2]).toEqual([esperado.unidadArea, area]);
  });

  it('CR-19: el trapecio es DESEABLE y no está en el MVP (T-D1)', () => {
    const { entrada, prioridad } = CASOS['CR-19'].subcasos[2];
    expect(prioridad).toBe('DESEABLE');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(codigos(calcularFigura(entrada))).toEqual(['E-SIS-02']);
  });

  it('CR-19: una dimensión 0 → E-NUM-06, en cualquier figura y dimensión', () => {
    const { entrada, esperado } = CASOS['CR-19'].subcasos[3];
    // Pendiente de CR-19: la figura y la dimensión; se prueban todas.
    const casos = [
      { tipo: 'rectangulo', base: entrada.textoDimension, altura: '2' },
      { tipo: 'rectangulo', base: '2', altura: entrada.textoDimension },
      { tipo: 'triangulo', base: entrada.textoDimension, altura: '3' },
      { tipo: 'triangulo', base: '4', altura: entrada.textoDimension },
      { tipo: 'circulo', radio: entrada.textoDimension }
    ];
    for (const unidad of ['m', 'cm']) {
      for (const caso of casos) expect(codigos(calcularFigura({ unidad, ...caso })), JSON.stringify(caso)).toEqual(esperado.errores);
    }
  });
});

describe('validación y unidades (R-14.3, R-14.4; Tabla 9.3)', () => {
  it('cada dimensión se valida por separado y se acumulan los errores', () => {
    const resultado = calcularFigura({ tipo: 'rectangulo', unidad: 'm', base: '', altura: '-1' });
    expect(resultado.errores.map((e) => [e.campo, e.codigo])).toEqual([['base', 'E-NUM-01'], ['altura', 'E-NUM-06']]);
    expect(resultado.errores[0].mensaje).toContain('«base»');
    expect(resultado).not.toHaveProperty('valor');
  });

  it('el rango depende de la unidad: ≤ 1000 m o ≤ 100 000 cm', () => {
    expect(valida({ tipo: 'rectangulo', unidad: 'm', base: '1000', altura: '1' }).area.valor).toEqual(q(1000n));
    expect(codigos(calcularFigura({ tipo: 'rectangulo', unidad: 'm', base: '1000.5', altura: '1' }))).toEqual(['E-NUM-04']);
    expect(valida({ tipo: 'circulo', unidad: 'cm', radio: '100000' }).area.coeficiente).toEqual(q(10n ** 10n));
    expect(codigos(calcularFigura({ tipo: 'circulo', unidad: 'cm', radio: '100001' }))).toEqual(['E-NUM-04']);
    expect(codigos(calcularFigura({ tipo: 'triangulo', unidad: 'm', base: '0.0000001', altura: '1' }))).toEqual(['E-NUM-04']);
  });

  it('en cm, el área se divide entre 100² = 10 000 para pasar a m², también la de un círculo', () => {
    const triangulo = valida({ tipo: 'triangulo', unidad: 'cm', base: '30', altura: '0.5' });
    expect(triangulo.area).toEqual({ clase: 'exacta', valor: q(15n, 2n) });
    expect(triangulo.unidadArea).toBe('cm²');
    expect(triangulo.areaM2).toEqual({ clase: 'exacta', valor: q(3n, 4000n) });
    const circulo = valida({ tipo: 'circulo', unidad: 'cm', radio: '50' });
    expect(circulo.area.coeficiente).toEqual(q(2500n));
    expect(circulo.areaM2.clase).toBe('multiploPi');
    expect(circulo.areaM2.coeficiente).toEqual(q(1n, 4n));
  });

  it('los decimales se leen exactos (R-03.2)', () => {
    expect(valida({ tipo: 'rectangulo', unidad: 'm', base: '0.1', altura: '0.3' }).area.valor).toEqual(q(3n, 100n));
  });
});

describe('contrato ResultadoFigura (design §10)', () => {
  it.each([
    ['rectangulo', { base: '4', altura: '2' }, 'A = b × h'],
    ['triangulo', { base: '4', altura: '3' }, 'A = (b × h)/2'],
    ['circulo', { radio: '5' }, 'A = π r²']
  ])('%s: fórmula del formulario §8, dimensiones exactas y pasos pendientes de T-12', (tipo, dimensiones, formula) => {
    const valor = valida({ tipo, unidad: 'm', ...dimensiones });
    expect(Object.keys(valor).sort())
      .toEqual(['area', 'areaM2', 'dimensiones', 'entrada', 'formula', 'pasos', 'tipo', 'unidad', 'unidadArea']);
    expect(valor.formula.texto).toBe(formula);
    expect(valor.formula.latex.length).toBeGreaterThan(0);
    expect(valor.pasos).toBeNull();
    expect(valor.entrada).toEqual({ tipo, unidad: 'm', ...dimensiones });
    expect(Object.keys(valor.dimensiones)).toEqual(Object.keys(dimensiones));
    expect(Object.isFrozen(valor)).toBe(true);
  });

  it.each([
    ['sin entrada', null],
    ['unidad desconocida', { tipo: 'rectangulo', unidad: 'mm', base: '1', altura: '1' }],
    ['falta una dimensión', { tipo: 'rectangulo', unidad: 'm', base: '1' }],
    ['figura desconocida', { tipo: 'hexagono', unidad: 'm', base: '1' }]
  ])('%s → E-SIS-02 sin detalles técnicos', (_, entrada) => {
    const errorConsola = vi.spyOn(console, 'error').mockImplementation(() => {});
    const resultado = calcularFigura(entrada);
    expect(codigos(resultado)).toEqual(['E-SIS-02']);
    expect(resultado.errores[0].mensaje).toBe(CATALOGO['E-SIS-02'].plantilla);
    expect(resultado).not.toHaveProperty('valor');
    expect(errorConsola).toHaveBeenCalledTimes(1);
  });
});
