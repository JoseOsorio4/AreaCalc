// Estimación teórica de material y costo de ÁreaCalc (design.md §9; requirements R-17).
//
//   areaEstimada  = areaUtil × (1 + w/100)
//   costoBase     = areaUtil × precio
//   costoEstimado = areaEstimada × precio
//
// Todo se calcula con los valores exactos y se redondea una sola vez, al presentar,
// en presentacion/formato.js (R-17.3, R-18.3). Por eso CR-03 da 2000/3 y 2200/3, que
// se muestran como Q666.67 y Q733.33; redondear 13.33 m² antes daría Q666.50. Si el
// área es un múltiplo de π (círculo), el coeficiente de π sigue exacto y su
// aproximación y su cota se escalan igual.
import * as racional from './racional.js';
import { escalarCantidad } from './unidades.js';

/**
 * @typedef {import('./racional.js').Racional} Racional
 * @typedef {import('./unidades.js').Cantidad} Cantidad
 * @typedef {Object} EstimacionMaterial
 * @property {Cantidad} areaUtil m².
 * @property {Racional} factorAdicional 1 + w/100.
 * @property {Cantidad} areaEstimada m².
 * @property {Cantidad} costoBase Q.
 * @property {Cantidad} costoEstimado Q.
 */

const CERO = racional.entero(0n);
const UNO = racional.entero(1n);
const CIEN = racional.entero(100n);

/**
 * Estimación a partir de un área útil ya apta y en m² (R-16), con el precio en Q/m²
 * y el adicional w en %. Las entradas llegan validadas por numeros.leerNumero; un
 * precio negativo o un w fuera de [0, 100] es un error de programación.
 * @param {Cantidad} areaUtil
 * @param {Racional} precio
 * @param {Racional} adicional w, en %.
 * @returns {Readonly<EstimacionMaterial>}
 */
export function estimarMaterial(areaUtil, precio, adicional) {
  if (racional.comparar(precio, CERO) < 0) throw new RangeError('materiales: el precio debe ser ≥ 0');
  if (racional.comparar(adicional, CERO) < 0 || racional.comparar(adicional, CIEN) > 0) {
    throw new RangeError('materiales: el adicional debe estar entre 0 y 100');
  }
  const factorAdicional = racional.sumar(UNO, racional.dividir(adicional, CIEN));
  const areaEstimada = escalarCantidad(areaUtil, factorAdicional);
  return Object.freeze({
    areaUtil: escalarCantidad(areaUtil, UNO), // valida y copia
    factorAdicional,
    areaEstimada,
    costoBase: escalarCantidad(areaUtil, precio),
    costoEstimado: escalarCantidad(areaEstimada, precio)
  });
}
