// Aritmética exacta propia de las pruebas (T-08; design.md §15; R-25.1).
//
// Las expectativas de las pruebas de casos de uso y de propiedades se calculan
// con estas funciones, que no importan nada de src/. Así ninguna comprobación
// depende del código bajo prueba. Un número es { num, den } de BigInt, como un
// Racional (design §6), y todas las funciones devuelven fracciones irreducibles
// con den > 0n, para poder compararlas con toEqual.

function mcd(a, b) {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
}

/** Fracción irreducible num/den, con den > 0n. */
export function q(num, den = 1n) {
  const n = BigInt(num);
  const d = BigInt(den);
  if (d === 0n) throw new RangeError('aritmetica-independiente: denominador 0');
  const g = mcd(n, d) * (d < 0n ? -1n : 1n);
  return { num: n / g, den: d / g };
}

/** 'p/q' o 'p' → fracción. */
export const leer = (texto) => {
  const [num, den = '1'] = texto.split('/');
  return q(BigInt(num), BigInt(den));
};

export const suma = (x, y) => q(x.num * y.den + y.num * x.den, x.den * y.den);
export const resta = (x, y) => q(x.num * y.den - y.num * x.den, x.den * y.den);
export const producto = (x, y) => q(x.num * y.num, x.den * y.den);
export const cociente = (x, y) => q(x.num * y.den, x.den * y.num);
export const valorAbsoluto = (x) => q(x.num < 0n ? -x.num : x.num, x.den);
/** −1, 0 o 1 según x < y, x = y o x > y. */
export const comparar = (x, y) => {
  const d = x.num * y.den - y.num * x.den;
  return d < 0n ? -1 : d > 0n ? 1 : 0;
};
export const esCero = (x) => x.num === 0n;

/** p(t) exacto, con coef[k] el coeficiente de t^k. */
export function evaluar(coef, t) {
  let valor = q(0n);
  for (let k = coef.length - 1; k >= 0; k -= 1) valor = suma(producto(valor, t), coef[k]);
  return valor;
}

/** Antiderivada con F(0) = 0: el coeficiente de t^(k + 1) es c_k/(k + 1). */
export const antiderivada = (coef) => [q(0n), ...coef.map((c, k) => cociente(c, q(BigInt(k + 1))))];

/** Aproximación en Number, solo para el oráculo numérico y las tolerancias. */
export const aDecimal = (x) => Number(x.num) / Number(x.den);
