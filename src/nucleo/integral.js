// Integral definida exacta de ÁreaCalc (design.md §7; formulario §1).
//
// integrarDefinida(p, a, b) aplica la regla de la potencia y la linealidad:
// cada término c·x^k pasa a c/(k + 1)·x^(k + 1). La antiderivada se elige con
// F(0) = 0, así que no lleva «+C» (R-04.3), e I = F(b) − F(a) (teorema
// fundamental del cálculo). Todo es exacto y no hay integración numérica (R-04.4).
import * as racional from './racional.js';
import * as polinomio from './polinomio.js';

/**
 * @typedef {import('./racional.js').Racional} Racional
 * @typedef {import('./polinomio.js').Polinomio} Polinomio
 * @typedef {Object} TerminoIntegral Desglose de un término, para que pasos.js
 *   muestre cada sustitución sin recalcular.
 * @property {Racional} coefOriginal c, el coeficiente de x^k en p.
 * @property {number} potencia k + 1, el exponente del término de F.
 * @property {Racional} coefAntiderivada c/(k + 1).
 * @property {Racional} valorEnB c/(k + 1)·b^(k + 1).
 * @property {Racional} valorEnA c/(k + 1)·a^(k + 1).
 * @typedef {Object} IntegralDefinida
 * @property {Polinomio} antiderivada F, con F(0) = 0.
 * @property {ReadonlyArray<TerminoIntegral>} terminos De la potencia mayor a la menor.
 * @property {Racional} Fb F(b).
 * @property {Racional} Fa F(a).
 * @property {Racional} I F(b) − F(a).
 */

/**
 * Antiderivada F de p con F(0) = 0: el coeficiente de x^(k + 1) es c_k/(k + 1).
 * @param {Polinomio} p
 * @returns {Polinomio}
 */
export function antiderivar(p) {
  polinomio.grado(p); // valida p
  const coef = [racional.entero(0n), ...p.coef.map((c, k) => racional.dividir(c, racional.entero(k + 1)))];
  return polinomio.desdeCoeficientes(coef);
}

/**
 * Integral definida exacta de p en [a, b], con su desglose (design §7).
 * Exige a < b: ÁreaCalc no integra con los límites invertidos (formulario §1).
 * @param {Polinomio} p
 * @param {Racional} a
 * @param {Racional} b
 * @returns {Readonly<IntegralDefinida>}
 */
export function integrarDefinida(p, a, b) {
  if (racional.comparar(a, b) >= 0) throw new RangeError('integral: se esperaba a < b');
  const antiderivada = antiderivar(p);
  const terminos = [];
  // De la potencia mayor a la menor, como se escribe F en clase (design §14.1).
  for (let k = p.coef.length - 1; k >= 0; k -= 1) {
    const coefOriginal = p.coef[k];
    if (racional.esCero(coefOriginal)) continue;
    const potencia = k + 1;
    const coefAntiderivada = antiderivada.coef[potencia];
    terminos.push(Object.freeze({
      coefOriginal,
      potencia,
      coefAntiderivada,
      valorEnB: racional.multiplicar(coefAntiderivada, racional.potencia(b, potencia)),
      valorEnA: racional.multiplicar(coefAntiderivada, racional.potencia(a, potencia))
    }));
  }
  const Fb = polinomio.evaluar(antiderivada, b);
  const Fa = polinomio.evaluar(antiderivada, a);
  return Object.freeze({
    antiderivada,
    terminos: Object.freeze(terminos),
    Fb,
    Fa,
    I: racional.restar(Fb, Fa)
  });
}
