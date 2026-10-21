// Áreas de figuras de ÁreaCalc (design.md §9; requirements R-14; formulario §8).
//
// Fórmulas geométricas directas, sin integración (R-14.6). Las dimensiones llegan
// ya validadas por numeros.leerNumero (Racionales > 0, en la misma unidad). El
// rectángulo y el triángulo dan un área exacta; el círculo da k·π exacto, con
// k = r², y una aproximación con racional.PI_APROX y su cota (R-14.5). El
// trapecio es DESEABLE y queda fuera del MVP (tasks T-D1).
import * as racional from './racional.js';

/**
 * @typedef {import('./racional.js').Racional} Racional
 * @typedef {import('./unidades.js').Cantidad} Cantidad
 */

/**
 * Cota de |π − PI_APROX|. PI_APROX es π truncado a 35 decimales (design §6), así
 * que 0 < π − PI_APROX < 10⁻³⁵, y k·PI_APROX difiere de k·π en menos de k·10⁻³⁵.
 */
export const COTA_PI = racional.fraccion(1n, 10n ** 35n);

const DOS = racional.entero(2n);

/** Una dimensión ya validada debe ser positiva; si no, es un error de programación. */
function exigirPositiva(dimension, nombre) {
  if (racional.signo(dimension) <= 0) throw new RangeError(`geometria: la dimensión ${nombre} debe ser > 0`);
}

/**
 * Rectángulo: A = b·h, exacta.
 * @param {Racional} base
 * @param {Racional} altura
 * @returns {Readonly<Cantidad>}
 */
export function areaRectangulo(base, altura) {
  exigirPositiva(base, 'base');
  exigirPositiva(altura, 'altura');
  return Object.freeze({ clase: 'exacta', valor: racional.multiplicar(base, altura) });
}

/**
 * Triángulo: A = b·h/2, con h perpendicular a la base; exacta.
 * @param {Racional} base
 * @param {Racional} altura
 * @returns {Readonly<Cantidad>}
 */
export function areaTriangulo(base, altura) {
  exigirPositiva(base, 'base');
  exigirPositiva(altura, 'altura');
  return Object.freeze({ clase: 'exacta', valor: racional.dividir(racional.multiplicar(base, altura), DOS) });
}

/**
 * Círculo: A = π·r². El coeficiente k = r² es exacto; aprox = k·PI_APROX y
 * cota = k·10⁻³⁵ acotan el decimal, que se rotula «≈».
 * @param {Racional} radio
 * @returns {Readonly<Cantidad>}
 */
export function areaCirculo(radio) {
  exigirPositiva(radio, 'radio');
  const coeficiente = racional.potencia(radio, 2);
  return Object.freeze({
    clase: 'multiploPi',
    coeficiente,
    aprox: racional.multiplicar(coeficiente, racional.PI_APROX),
    cota: racional.multiplicar(coeficiente, COTA_PI)
  });
}
