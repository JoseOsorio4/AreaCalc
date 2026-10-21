// Polinomios con coeficientes racionales exactos de ÁreaCalc (design.md §7).
//
// Un Polinomio es un objeto inmutable { coef } donde coef[k] es el coeficiente
// de x^k, un Racional (racional.js). La lista nunca termina en cero: el
// polinomio cero es { coef: [] } y su grado es −1. El grado no está limitado
// aquí (la antiderivada llega a 4 y los centroides a 7, R-02.7); el límite de 3
// de la entrada solo se aplica en expresiones/normalizar.js.
//
// Todas las operaciones son exactas, salvo evaluarAprox(), que usa Number y
// sirve únicamente para dibujar (design.md §14.3).
import * as racional from './racional.js';

/**
 * Polinomio con coeficientes racionales exactos (design.md §7 y §10).
 * @typedef {Object} Polinomio
 * @property {ReadonlyArray<import('./racional.js').Racional>} coef coef[k] es
 *   el coeficiente de x^k; el último nunca es cero.
 */

const CERO_Q = racional.entero(0n);
const UNO_Q = racional.entero(1n);

/**
 * Único lugar donde nace un Polinomio: comprueba que cada coeficiente sea un
 * Racional, quita los ceros finales y congela el resultado.
 */
function normalizar(coef) {
  for (const c of coef) racional.signo(c); // lanza TypeError si c no es un Racional
  let fin = coef.length;
  while (fin > 0 && racional.esCero(coef[fin - 1])) fin -= 1;
  return Object.freeze({ coef: Object.freeze(coef.slice(0, fin)) });
}

/** Exige la forma { coef: [] } de un Polinomio. */
function exigirPolinomio(p) {
  if (!Array.isArray(p?.coef)) {
    throw new TypeError('polinomio: se esperaba un Polinomio { coef: Racional[] }');
  }
}

/** Exponente entero ≥ 0, como BigInt. */
function exponente(k) {
  if (typeof k !== 'bigint' && !Number.isSafeInteger(k)) {
    throw new TypeError('polinomio: el exponente debe ser un BigInt o un entero exacto de Number');
  }
  const n = BigInt(k);
  if (n < 0n) throw new RangeError('polinomio: el exponente debe ser un entero ≥ 0');
  return n;
}

// ── Creación y consulta ──────────────────────────────────────────────

/** El polinomio cero: coef = [] y grado −1. */
export const POLINOMIO_CERO = normalizar([]);

/**
 * Polinomio a partir de sus coeficientes, de x^0 hacia arriba:
 * desdeCoeficientes([c0, c1, c2]) = c0 + c1·x + c2·x². Quita los ceros finales.
 * @param {ReadonlyArray<import('./racional.js').Racional>} coef
 * @returns {Polinomio}
 */
export function desdeCoeficientes(coef) {
  if (!Array.isArray(coef)) throw new TypeError('polinomio: se esperaba una lista de coeficientes');
  return normalizar([...coef]);
}

/**
 * Grado del polinomio; −1 para el polinomio cero.
 * @param {Polinomio} p
 * @returns {number}
 */
export function grado(p) {
  exigirPolinomio(p);
  return p.coef.length - 1;
}

/**
 * @param {Polinomio} p
 * @returns {boolean} true si p es el polinomio cero.
 */
export function esCero(p) {
  exigirPolinomio(p);
  return p.coef.length === 0;
}

// ── Operaciones ──────────────────────────────────────────────────────

/**
 * a + b.
 * @param {Polinomio} a
 * @param {Polinomio} b
 * @returns {Polinomio}
 */
export function sumar(a, b) {
  return combinar(a, b, racional.sumar);
}

/**
 * a − b.
 * @param {Polinomio} a
 * @param {Polinomio} b
 * @returns {Polinomio}
 */
export function restar(a, b) {
  return combinar(a, b, racional.restar);
}

/** Aplica una operación coeficiente a coeficiente; un coeficiente que falta vale 0. */
function combinar(a, b, operacion) {
  exigirPolinomio(a);
  exigirPolinomio(b);
  const largo = Math.max(a.coef.length, b.coef.length);
  const coef = [];
  for (let k = 0; k < largo; k += 1) coef.push(operacion(a.coef[k] ?? CERO_Q, b.coef[k] ?? CERO_Q));
  return normalizar(coef);
}

/**
 * r·p, con r racional; si r = 0 da el polinomio cero.
 * @param {Polinomio} p
 * @param {import('./racional.js').Racional} r
 * @returns {Polinomio}
 */
export function escalar(p, r) {
  exigirPolinomio(p);
  racional.signo(r); // valida r aunque p sea el polinomio cero
  return normalizar(p.coef.map((c) => racional.multiplicar(c, r)));
}

/**
 * a·b. El coeficiente de x^k es la suma de los a_i·b_j con i + j = k.
 * @param {Polinomio} a
 * @param {Polinomio} b
 * @returns {Polinomio}
 */
export function multiplicar(a, b) {
  exigirPolinomio(a);
  exigirPolinomio(b);
  if (a.coef.length === 0 || b.coef.length === 0) return POLINOMIO_CERO;
  const coef = new Array(a.coef.length + b.coef.length - 1).fill(CERO_Q);
  a.coef.forEach((ai, i) => {
    b.coef.forEach((bj, j) => {
      coef[i + j] = racional.sumar(coef[i + j], racional.multiplicar(ai, bj));
    });
  });
  return normalizar(coef);
}

/**
 * p^k con k entero ≥ 0; p^0 = 1, también para el polinomio cero.
 * @param {Polinomio} p
 * @param {bigint | number} k
 * @returns {Polinomio}
 */
export function potencia(p, k) {
  exigirPolinomio(p);
  let n = exponente(k);
  let resultado = normalizar([UNO_Q]);
  let base = p;
  // Exponenciación binaria: unas log2(k) multiplicaciones.
  while (n > 0n) {
    if (n & 1n) resultado = multiplicar(resultado, base);
    n >>= 1n;
    if (n > 0n) base = multiplicar(base, base);
  }
  return resultado;
}

/**
 * Derivada: c·x^k pasa a k·c·x^(k−1); la de una constante es el polinomio cero.
 * @param {Polinomio} p
 * @returns {Polinomio}
 */
export function derivar(p) {
  exigirPolinomio(p);
  return normalizar(p.coef.slice(1).map((c, i) => racional.multiplicar(racional.entero(i + 1), c)));
}

/**
 * División con resto: a = cociente·b + resto, con grado(resto) < grado(b).
 * Si b es el polinomio cero lanza RangeError, un error interno.
 * @param {Polinomio} a
 * @param {Polinomio} b
 * @returns {Readonly<{ cociente: Polinomio, resto: Polinomio }>}
 */
export function dividirConResto(a, b) {
  exigirPolinomio(a);
  exigirPolinomio(b);
  if (b.coef.length === 0) throw new RangeError('polinomio: división entre el polinomio cero');
  const largoB = b.coef.length;
  const principal = b.coef[largoB - 1];
  const resto = [...a.coef];
  const cociente = new Array(Math.max(a.coef.length - largoB + 1, 0)).fill(CERO_Q);
  // De la potencia más alta a la más baja, como en la división larga.
  for (let k = cociente.length - 1; k >= 0; k -= 1) {
    const factor = racional.dividir(resto[k + largoB - 1], principal);
    cociente[k] = factor;
    for (let j = 0; j < largoB; j += 1) {
      resto[k + j] = racional.restar(resto[k + j], racional.multiplicar(factor, b.coef[j]));
    }
  }
  return Object.freeze({ cociente: normalizar(cociente), resto: normalizar(resto) });
}

/**
 * Máximo común divisor mónico (coeficiente principal 1), con el algoritmo de
 * Euclides. mcd(0, 0) es el polinomio cero. mcd(f, f′) revela las raíces
 * repetidas de f (formulario §2.1, punto 3).
 * @param {Polinomio} a
 * @param {Polinomio} b
 * @returns {Polinomio}
 */
export function mcd(a, b) {
  exigirPolinomio(a);
  exigirPolinomio(b);
  let x = a;
  let y = b;
  while (y.coef.length > 0) {
    const { resto } = dividirConResto(x, y);
    x = y;
    y = resto;
  }
  if (x.coef.length === 0) return POLINOMIO_CERO;
  return escalar(x, racional.dividir(UNO_Q, x.coef[x.coef.length - 1]));
}

// ── Evaluación ───────────────────────────────────────────────────────

/**
 * p(r) exacto con la regla de Horner: c0 + r·(c1 + r·(c2 + r·c3)).
 * @param {Polinomio} p
 * @param {import('./racional.js').Racional} r
 * @returns {import('./racional.js').Racional}
 */
export function evaluar(p, r) {
  exigirPolinomio(p);
  racional.signo(r); // valida r aunque p sea el polinomio cero
  let valor = CERO_Q;
  for (let k = p.coef.length - 1; k >= 0; k -= 1) {
    valor = racional.sumar(racional.multiplicar(valor, r), p.coef[k]);
  }
  return valor;
}

/**
 * p(x) aproximado en Number, también con Horner, SOLO para dibujar (design.md
 * §7 y §14.3); nunca se usa para decidir signos, ceros ni áreas. Puede dar
 * ±Infinity o NaN si los coeficientes no caben en Number: datosGrafica.js lo
 * detecta y muestra W-07.
 * @param {Polinomio} p
 * @param {number} x
 * @returns {number}
 */
export function evaluarAprox(p, x) {
  exigirPolinomio(p);
  if (typeof x !== 'number') throw new TypeError('polinomio: evaluarAprox espera un Number');
  let valor = 0;
  for (let k = p.coef.length - 1; k >= 0; k -= 1) valor = valor * x + racional.aNumber(p.coef[k]);
  return valor;
}
