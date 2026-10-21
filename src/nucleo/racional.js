// Racionales exactos de ÁreaCalc (design.md §6).
//
// Un Racional es un objeto inmutable { num, den } de BigInt con tres invariantes:
//   1. den > 0n: el signo va siempre en el numerador;
//   2. mcd(|num|, den) = 1: la fracción es irreducible;
//   3. el cero es { num: 0n, den: 1n }, así que no existe «−0».
// Toda fracción nueva pasa por crear(), que mueve el signo al numerador y divide
// numerador y denominador entre su mcd: 6/(−8) se guarda como −3/4. Los objetos
// se congelan con Object.freeze y ninguna función modifica sus argumentos.
//
// Por qué BigInt y no Number: Number solo representa todos los enteros hasta
// 2^53 ≈ 9·10^15 (en Number, 2 ** 53 + 1 da 2 ** 53) y guarda 0.1 en binario,
// así que 0.1 + 0.2 da 0.30000000000000004. Con BigInt no hay desbordamiento
// (R-18.5) y desdeDecimal lee 0.1 como 1/10 exacto (R-03.2). Number solo se usa
// para validar argumentos y en aNumber(), que sirve únicamente para dibujar.

/**
 * Fracción exacta e inmutable (design.md §6 y §10). Solo se crea con las
 * funciones de este módulo, que garantizan las invariantes.
 * @typedef {Object} Racional
 * @property {bigint} num Numerador, con el signo.
 * @property {bigint} den Denominador, siempre mayor que 0n.
 */

/** Decimal con punto: signo opcional, dígitos y, si hay punto, dígitos a ambos lados. */
const DECIMAL = /^([+-]?)(\d+)(?:\.(\d+))?$/;

/** Máximo común divisor (algoritmo de Euclides); siempre ≥ 0n. */
function mcd(a, b) {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const resto = x % y;
    x = y;
    y = resto;
  }
  return x;
}

/**
 * Único lugar donde nace un Racional: pasa el signo al numerador y divide
 * entre el mcd. El cero queda como 0/1, porque mcd(0, d) = d.
 */
function crear(num, den) {
  if (den === 0n) throw new RangeError('racional: el denominador no puede ser 0');
  const divisor = den < 0n ? -mcd(num, den) : mcd(num, den);
  return Object.freeze({ num: num / divisor, den: den / divisor });
}

/** BigInt, o entero exacto de Number (|n| ≤ 2^53 − 1); lo demás es un error. */
function aEntero(valor, nombre) {
  if (typeof valor === 'bigint') return valor;
  if (Number.isSafeInteger(valor)) return BigInt(valor);
  throw new TypeError(`racional: ${nombre} debe ser un BigInt o un entero exacto de Number`);
}

/** Exige la forma de un Racional, para que un Number no se mezcle en silencio. */
function exigirRacional(r) {
  if (typeof r?.num !== 'bigint' || typeof r?.den !== 'bigint' || r.den <= 0n) {
    throw new TypeError('racional: se esperaba un Racional { num, den } de BigInt con den > 0n');
  }
}

/** Cantidad de bits de un entero positivo. */
function bits(n) {
  return n.toString(2).length;
}

// ── Creación ─────────────────────────────────────────────────────────

/**
 * Entero exacto: entero(3n) → 3. También acepta un entero exacto de Number.
 * @param {bigint | number} n
 * @returns {Racional}
 */
export function entero(n) {
  return crear(aEntero(n, 'el entero'), 1n);
}

/**
 * Fracción n/d simplificada: fraccion(6n, -8n) → −3/4.
 * Si d = 0 lanza RangeError, un error interno (E-SIS-02 en los casos de uso).
 * @param {bigint | number} n
 * @param {bigint | number} d
 * @returns {Racional}
 */
export function fraccion(n, d) {
  return crear(aEntero(n, 'el numerador'), aEntero(d, 'el denominador'));
}

/**
 * Lee un decimal escrito como fracción decimal exacta, sin pasar por Number
 * (R-03.2): desdeDecimal('0.1') → 1/10 y desdeDecimal('2.5') → 5/2.
 * Acepta un signo opcional, dígitos y, si hay punto, dígitos a ambos lados, sin
 * límite de cifras. Los campos y el analizador validan antes el texto del usuario
 * (E-NUM-02, E-EXP-04); aquí un texto con otra forma es un error de programación.
 * @param {string} texto
 * @returns {Racional}
 */
export function desdeDecimal(texto) {
  if (typeof texto !== 'string') throw new TypeError('racional: desdeDecimal espera el texto del número');
  const partes = DECIMAL.exec(texto);
  if (partes === null) throw new SyntaxError(`racional: «${texto}» no es un decimal con punto, como -2.5`);
  const [, signoTexto, enteros, decimales = ''] = partes;
  const magnitud = BigInt(enteros + decimales);
  return crear(signoTexto === '-' ? -magnitud : magnitud, 10n ** BigInt(decimales.length));
}

// ── Aritmética ───────────────────────────────────────────────────────

/**
 * a + b.
 * @param {Racional} a
 * @param {Racional} b
 * @returns {Racional}
 */
export function sumar(a, b) {
  exigirRacional(a);
  exigirRacional(b);
  return crear(a.num * b.den + b.num * a.den, a.den * b.den);
}

/**
 * a − b.
 * @param {Racional} a
 * @param {Racional} b
 * @returns {Racional}
 */
export function restar(a, b) {
  exigirRacional(a);
  exigirRacional(b);
  return crear(a.num * b.den - b.num * a.den, a.den * b.den);
}

/**
 * a · b.
 * @param {Racional} a
 * @param {Racional} b
 * @returns {Racional}
 */
export function multiplicar(a, b) {
  exigirRacional(a);
  exigirRacional(b);
  return crear(a.num * b.num, a.den * b.den);
}

/**
 * a / b. Si b = 0 lanza RangeError, un error interno (E-SIS-02 en los casos de uso).
 * @param {Racional} a
 * @param {Racional} b
 * @returns {Racional}
 */
export function dividir(a, b) {
  exigirRacional(a);
  exigirRacional(b);
  if (b.num === 0n) throw new RangeError('racional: división entre cero');
  return crear(a.num * b.den, a.den * b.num);
}

/**
 * −r.
 * @param {Racional} r
 * @returns {Racional}
 */
export function negar(r) {
  exigirRacional(r);
  return crear(-r.num, r.den);
}

/**
 * |r|.
 * @param {Racional} r
 * @returns {Racional}
 */
export function abs(r) {
  exigirRacional(r);
  return crear(r.num < 0n ? -r.num : r.num, r.den);
}

/**
 * r^k con k entero ≥ 0. Como en los polinomios, r^0 = 1 también para r = 0.
 * @param {Racional} r
 * @param {bigint | number} k
 * @returns {Racional}
 */
export function potencia(r, k) {
  exigirRacional(r);
  const exponente = aEntero(k, 'el exponente');
  if (exponente < 0n) throw new RangeError('racional: el exponente debe ser un entero ≥ 0');
  return crear(r.num ** exponente, r.den ** exponente);
}

// ── Comparación ──────────────────────────────────────────────────────

/**
 * −1 si a < b, 0 si a = b y 1 si a > b. Compara a.num·b.den con b.num·a.den,
 * que conserva el orden porque los denominadores son positivos.
 * @param {Racional} a
 * @param {Racional} b
 * @returns {-1 | 0 | 1}
 */
export function comparar(a, b) {
  exigirRacional(a);
  exigirRacional(b);
  const izquierda = a.num * b.den;
  const derecha = b.num * a.den;
  if (izquierda < derecha) return -1;
  if (izquierda > derecha) return 1;
  return 0;
}

/**
 * −1, 0 o 1 según el signo de r.
 * @param {Racional} r
 * @returns {-1 | 0 | 1}
 */
export function signo(r) {
  exigirRacional(r);
  if (r.num < 0n) return -1;
  if (r.num > 0n) return 1;
  return 0;
}

/**
 * @param {Racional} r
 * @returns {boolean} true si r = 0.
 */
export function esCero(r) {
  exigirRacional(r);
  return r.num === 0n;
}

/**
 * @param {Racional} r
 * @returns {boolean} true si r es entero (denominador 1).
 */
export function esEntero(r) {
  exigirRacional(r);
  return r.den === 1n;
}

// ── Conversión ───────────────────────────────────────────────────────

/**
 * Aproximación en Number, SOLO para dibujar (design.md §14.3); nunca se usa
 * para decidir ni para mostrar resultados. Funciona aunque num o den no quepan
 * en Number: divide con BigInt dejando un cociente de 64 o 65 bits y lo escala
 * por 2^s. Redondea al Number más cercano (en el rango normal), da ±Infinity si
 * el valor no cabe y nunca devuelve NaN ni −0.
 * @param {Racional} r
 * @returns {number}
 */
export function aNumber(r) {
  exigirRacional(r);
  if (r.num === 0n) return 0;
  const magnitud = r.num < 0n ? -r.num : r.num;
  const s = bits(magnitud) - bits(r.den) - 64;
  const dividendo = s < 0 ? magnitud << BigInt(-s) : magnitud;
  const divisor = s > 0 ? r.den << BigInt(s) : r.den;
  let cociente = dividendo / divisor;
  // Bit «pegajoso»: si la división no es exacta, Number() redondea una sola vez.
  if (cociente * divisor !== dividendo) cociente |= 1n;
  // 2^s en dos factores, para no desbordar ni perder valores muy pequeños.
  const mitad = Math.trunc(s / 2);
  const valor = Number(cociente) * 2 ** mitad * 2 ** (s - mitad);
  if (valor === 0) return 0; // subdesbordamiento: 0, nunca −0
  return r.num < 0n ? -valor : valor;
}

/**
 * Texto simple con el signo en el numerador: «-3/4»; los enteros, sin
 * denominador: «5». Los decimales y el LaTeX están en presentacion/formato.js.
 * @param {Racional} r
 * @returns {string}
 */
export function aTexto(r) {
  exigirRacional(r);
  return r.den === 1n ? `${r.num}` : `${r.num}/${r.den}`;
}

// ── Constante ────────────────────────────────────────────────────────

/**
 * π truncado a 35 decimales, para la aproximación del círculo (design.md §6
 * y §9). Su error es menor que 10^-35.
 * @type {Racional}
 */
export const PI_APROX = desdeDecimal('3.14159265358979323846264338327950288');
