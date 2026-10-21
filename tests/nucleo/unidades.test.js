// Pruebas de src/nucleo/unidades.js (T-07; design.md §9; requirements §11 y R-15).
// CR-10 viene de tests/casos-referencia.js; las tablas de unidades, de design §9.
import { describe, expect, it } from 'vitest';
import {
  CM2_POR_M2, areaAMetrosCuadrados, escalarCantidad, unidadDeArea, unidadesDe
} from '../../src/nucleo/unidades.js';
import { fraccion } from '../../src/nucleo/racional.js';
import { CASOS } from '../casos-referencia.js';

const q = (n, d = 1) => fraccion(BigInt(n), BigInt(d));
const exacta = (n, d = 1) => ({ clase: 'exacta', valor: q(n, d) });

describe('unidades por interpretación (design §9)', () => {
  it('abstracta usa u y u² y no se estima; física usa m y m²', () => {
    expect(unidadesDe('abstracta')).toEqual({ x: 'u', y: 'u', area: 'u²', estimable: false });
    expect(unidadesDe('fisica')).toEqual({ x: 'm', y: 'm', area: 'm²', estimable: true });
    expect(() => unidadesDe('cm')).toThrow(RangeError);
  });

  it('unidad de área de una figura', () => {
    expect(unidadDeArea('cm')).toBe('cm²');
    expect(unidadDeArea('m')).toBe('m²');
    expect(() => unidadDeArea('km')).toThrow(RangeError);
  });
});

describe('conversión de áreas a m² (R-14.4, R-15.5)', () => {
  it('1 m² = 100² cm² = 10 000 cm²', () => {
    expect(CM2_POR_M2).toEqual(q(10000));
    expect(areaAMetrosCuadrados(exacta(1), 'cm')).toEqual(exacta(1, 10000));
  });

  it('CR-10: 20 000 cm² = 2 m²; un área en m² no cambia', () => {
    const { area, areaM2 } = CASOS['CR-10'].esperado;
    expect(areaAMetrosCuadrados(area, 'cm')).toEqual({ clase: 'exacta', valor: areaM2.valor });
    expect(areaAMetrosCuadrados(exacta(8), 'm')).toEqual(exacta(8));
  });

  it('en k·π divide el coeficiente, su aproximación y su cota', () => {
    const circulo = { clase: 'multiploPi', coeficiente: q(2500), aprox: q(7853981, 1000), cota: q(1, 1000) };
    expect(areaAMetrosCuadrados(circulo, 'cm')).toEqual({
      clase: 'multiploPi', coeficiente: q(1, 4), aprox: q(7853981, 10000000), cota: q(1, 10000000)
    });
  });

  it('en una cantidad aproximada divide el valor y la cota y conserva el motivo', () => {
    const aproximada = { clase: 'aproximada', valor: q(30000), cota: q(1), motivo: 'ceros-irracionales' };
    expect(areaAMetrosCuadrados(aproximada, 'cm'))
      .toEqual({ clase: 'aproximada', valor: q(3), cota: q(1, 10000), motivo: 'ceros-irracionales' });
  });

  it('rechaza unidades, factores y cantidades no válidos', () => {
    expect(() => areaAMetrosCuadrados(exacta(1), 'km')).toThrow(RangeError);
    expect(() => escalarCantidad(exacta(1), q(-1))).toThrow(RangeError);
    expect(() => escalarCantidad(q(1), q(2))).toThrow(TypeError);
    expect(Object.isFrozen(areaAMetrosCuadrados(exacta(5), 'cm'))).toBe(true);
  });
});
