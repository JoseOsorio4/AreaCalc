// Área geométrica de ÁreaCalc (design.md §9; formulario §2).
//
// areaGeometrica(integral, analisis) recorre los tramos del análisis de signo,
// calcula cada Iₖ = F(hasta) − F(desde) con la antiderivada exacta y suma sus
// valores absolutos: A_geo = Σ |Iₖ| (R-06.1). Nunca usa |I| como sustituto
// (R-06.2). Si algún corte es un cero aproximado, el tramo usa su representante
// racional y el área se rotula aproximada, con la cota Σ M₁·δ² de esos cortes
// (R-06.5; formulario §2.1, punto 4). La cota se calcula con ceros.cotaCorte,
// el único lugar donde está la fórmula.
import * as racional from './racional.js';
import * as polinomio from './polinomio.js';
import { cotaCorte } from './ceros.js';

/**
 * @typedef {import('./racional.js').Racional} Racional
 * @typedef {import('./integral.js').IntegralDefinida} IntegralDefinida
 * @typedef {import('./ceros.js').AnalisisSigno} AnalisisSigno
 * @typedef {Object} TramoArea
 * @property {Racional} desde Extremo exacto o representante de un cero aproximado.
 * @property {Racional} hasta
 * @property {Racional} integral Iₖ = F(hasta) − F(desde).
 * @property {Racional} valorAbsoluto |Iₖ|.
 * @typedef {{ clase: 'exacta', valor: Racional }
 *   | { clase: 'aproximada', valor: Racional, cota: Racional, motivo: string }} Cantidad
 *   Solo `exacta` se rotula como exacto (design §10; R-18.2).
 * @typedef {Object} AreaGeometrica
 * @property {ReadonlyArray<TramoArea>} tramos
 * @property {Readonly<Cantidad>} area A_geo.
 * @property {boolean} igualAI A_geo = I, porque f ≥ 0 en [a, b] (R-06.3).
 */

/** Motivo de un área aproximada: algún corte es un cero irracional (W-04). */
export const MOTIVO_CEROS_IRRACIONALES = 'ceros-irracionales';

const CERO = racional.entero(0n);

/** Error de programación (E-SIS-02), como en ceros.js. */
function errorInterno(mensaje) {
  const error = new Error(`area: ${mensaje}`);
  error.codigo = 'E-SIS-02';
  return error;
}

/**
 * A_geo = Σ |Iₖ| sobre los tramos del análisis de signo (design §9).
 * Lanza un error con código E-SIS-02 si A_geo < |I|: solo puede ocurrir si la
 * integral y el análisis no corresponden al mismo intervalo (error de programación).
 * @param {IntegralDefinida} integral Resultado de integral.integrarDefinida.
 * @param {AnalisisSigno} analisis Resultado de ceros.analizarSigno, en el mismo [a, b].
 * @returns {Readonly<AreaGeometrica>}
 */
export function areaGeometrica(integral, analisis) {
  if (!Array.isArray(analisis?.tramos) || !Array.isArray(analisis?.ceros)
    || typeof analisis.noNegativa !== 'boolean') {
    throw new TypeError('area: se esperaba el análisis de signo de ceros.analizarSigno');
  }
  const F = integral?.antiderivada;
  polinomio.grado(F); // valida la antiderivada
  racional.signo(integral.I); // valida I
  // Iₖ con evaluación exacta en los cortes; un corte aproximado es su representante.
  const tramos = analisis.tramos.map(({ desde, hasta }) => {
    const Ik = racional.restar(polinomio.evaluar(F, hasta), polinomio.evaluar(F, desde));
    return Object.freeze({ desde, hasta, integral: Ik, valorAbsoluto: racional.abs(Ik) });
  });
  const valor = tramos.reduce((suma, t) => racional.sumar(suma, t.valorAbsoluto), CERO);
  if (racional.comparar(valor, racional.abs(integral.I)) < 0) {
    throw errorInterno(`A_geo = ${racional.aTexto(valor)} es menor que |I| = ${racional.aTexto(racional.abs(integral.I))}`);
  }
  const aproximados = analisis.ceros.filter((cero) => !cero.exacto);
  let area;
  if (aproximados.length === 0) {
    area = Object.freeze({ clase: 'exacta', valor });
  } else {
    // f = F′ exactamente; F(0) = 0 no cambia la derivada.
    const f = polinomio.derivar(F);
    const cota = aproximados.reduce(
      (suma, cero) => racional.sumar(suma, cotaCorte(f, cero.intervalo[0], cero.intervalo[1])),
      CERO
    );
    area = Object.freeze({ clase: 'aproximada', valor, cota, motivo: MOTIVO_CEROS_IRRACIONALES });
  }
  return Object.freeze({ tramos: Object.freeze(tramos), area, igualAI: analisis.noNegativa });
}
