// Unidades y conversión de áreas de ÁreaCalc (design.md §9; requirements §11 y R-15).
//
// Un perfil usa u y u² (abstracto) o m y m² (físico); no se convierten unidades de
// perfiles (R-15.4). Una figura se mide en cm o en m, y su área se lleva a m² con
// el cuadrado del factor: 1 m = 100 cm, así que 1 m² = 100² cm² = 10 000 cm².
import * as racional from './racional.js';

/**
 * @typedef {import('./racional.js').Racional} Racional
 * @typedef {{ clase: 'exacta', valor: Racional }
 *   | { clase: 'multiploPi', coeficiente: Racional, aprox: Racional, cota: Racional }
 *   | { clase: 'aproximada', valor: Racional, cota: Racional, motivo: string }} Cantidad design §10.
 */

const UNIDADES = Object.freeze({
  abstracta: Object.freeze({ x: 'u', y: 'u', area: 'u²', estimable: false }),
  fisica: Object.freeze({ x: 'm', y: 'm', area: 'm²', estimable: true })
});

/**
 * Unidades de una interpretación del perfil.
 * @param {'abstracta' | 'fisica'} interpretacion
 */
export function unidadesDe(interpretacion) {
  if (!Object.hasOwn(UNIDADES, interpretacion)) throw new RangeError(`unidades: interpretación desconocida «${interpretacion}»`);
  return UNIDADES[interpretacion];
}

/** Centímetros en un metro. */
export const CM_POR_M = racional.entero(100n);
/** Centímetros cuadrados en un metro cuadrado: el cuadrado del factor lineal, 100² = 10 000. */
export const CM2_POR_M2 = racional.potencia(CM_POR_M, 2);

const UNIDAD_AREA = Object.freeze({ cm: 'cm²', m: 'm²' });

/**
 * Unidad de área de una figura medida en cm o en m.
 * @param {'cm' | 'm'} unidad
 * @returns {'cm²' | 'm²'}
 */
export function unidadDeArea(unidad) {
  if (!Object.hasOwn(UNIDAD_AREA, unidad)) throw new RangeError(`unidades: unidad desconocida «${unidad}»`);
  return UNIDAD_AREA[unidad];
}

/**
 * Multiplica una Cantidad por un racional ≥ 0 sin perder su clase: en k·π escala el
 * coeficiente exacto, su aproximación y su cota; en una aproximada, el valor y la
 * cota. La usan la conversión de unidades y la estimación de material.
 * @param {Cantidad} cantidad
 * @param {Racional} factor
 * @returns {Readonly<Cantidad>}
 */
export function escalarCantidad(cantidad, factor) {
  if (racional.signo(factor) < 0) throw new RangeError('unidades: el factor debe ser ≥ 0');
  const por = (r) => racional.multiplicar(r, factor);
  switch (cantidad?.clase) {
    case 'exacta':
      return Object.freeze({ clase: 'exacta', valor: por(cantidad.valor) });
    case 'multiploPi':
      return Object.freeze({
        clase: 'multiploPi', coeficiente: por(cantidad.coeficiente), aprox: por(cantidad.aprox), cota: por(cantidad.cota)
      });
    case 'aproximada':
      return Object.freeze({ clase: 'aproximada', valor: por(cantidad.valor), cota: por(cantidad.cota), motivo: cantidad.motivo });
    default:
      throw new TypeError('unidades: se esperaba una Cantidad (exacta, multiploPi o aproximada)');
  }
}

/**
 * Área en cm² o m² → m² (R-14.4, R-15.5): en cm² se divide entre 10 000.
 * @param {Cantidad} cantidad Área en la unidad² de la figura.
 * @param {'cm' | 'm'} unidad Unidad lineal de la figura.
 * @returns {Readonly<Cantidad>}
 */
export function areaAMetrosCuadrados(cantidad, unidad) {
  unidadDeArea(unidad); // valida la unidad
  const factor = unidad === 'cm' ? racional.dividir(racional.entero(1n), CM2_POR_M2) : racional.entero(1n);
  return escalarCantidad(cantidad, factor);
}
