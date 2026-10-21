// Valor promedio y rectángulo equivalente de ÁreaCalc (design.md §7; formulario §3).
//
// valorPromedio recibe la integral con signo I ya calculada por integral.js y solo
// la divide entre b − a: no vuelve a integrar (R-07.1) y nunca usa A_geo (R-07.2).
// rectanguloEquivalente solo existe si el análisis de signo demostró que f ≥ 0 en
// [a, b] (R-08.1); si no, devuelve null con el motivo (R-08.2).
import * as racional from './racional.js';

/**
 * @typedef {import('./racional.js').Racional} Racional
 * @typedef {Object} Rectangulo
 * @property {Racional} base b − a.
 * @property {Racional} altura f_prom.
 * @property {Racional} area base·altura, igual a I y, como f ≥ 0, a A_geo.
 * @typedef {Object} RectanguloEquivalente
 * @property {Rectangulo | null} rectangulo
 * @property {'requiere-f-no-negativa' | null} motivo Por qué no hay rectángulo.
 */

/** Motivo de que no haya rectángulo: la igualdad exige f ≥ 0 (R-08.2). */
export const MOTIVO_SIN_RECTANGULO = 'requiere-f-no-negativa';

/** Exige a < b, para que b − a no sea 0 ni negativo. */
function longitud(a, b) {
  if (racional.comparar(a, b) >= 0) throw new RangeError('promedio: se esperaba a < b');
  return racional.restar(b, a);
}

/**
 * f_prom = I/(b − a), con la misma I de la integral (R-07.1).
 * @param {Racional} I Integral con signo de f en [a, b].
 * @param {Racional} a
 * @param {Racional} b
 * @returns {Readonly<{ longitud: Racional, fProm: Racional }>}
 */
export function valorPromedio(I, a, b) {
  const base = longitud(a, b);
  return Object.freeze({ longitud: base, fProm: racional.dividir(I, base) });
}

/**
 * Rectángulo de base b − a y altura f_prom, solo si analisis.noNegativa (R-08).
 * @param {{ noNegativa: boolean }} analisis Resultado de ceros.analizarSigno.
 * @param {Racional} fProm
 * @param {Racional} a
 * @param {Racional} b
 * @returns {Readonly<RectanguloEquivalente>}
 */
export function rectanguloEquivalente(analisis, fProm, a, b) {
  if (typeof analisis?.noNegativa !== 'boolean') {
    throw new TypeError('promedio: se esperaba el análisis de signo, con noNegativa');
  }
  const base = longitud(a, b);
  racional.signo(fProm); // valida fProm
  if (!analisis.noNegativa) return Object.freeze({ rectangulo: null, motivo: MOTIVO_SIN_RECTANGULO });
  const rectangulo = Object.freeze({ base, altura: fProm, area: racional.multiplicar(base, fProm) });
  return Object.freeze({ rectangulo, motivo: null });
}
