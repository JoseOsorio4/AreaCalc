// Formato de números y fórmulas de ÁreaCalc (T-11; design.md §14.1; requirements §12,
// R-15.1 y R-18.2 a R-18.4). Es el ÚNICO lugar donde se redondea (AGENTS.md).
//
// Decimales: 4 para los valores matemáticos y 2 para los quetzales. El redondeo es
// mitad alejándose de cero y se calcula exactamente sobre el racional: se escala
// |p/q| por 10ⁿ, se toman el cociente y el resto de la división entera, y si
// 2·resto ≥ q se suma 1 al cociente. Se redondea una sola vez, al presentar.
//   - «=» si la expansión decimal termina dentro de esos dígitos (sin ceros finales):
//     243/4 = 60.75;
//   - «≈» si no: 40/3 ≈ 13.3333;
//   - nunca «−0»: un valor que redondea a cero se muestra sin signo (−1/10⁹ ≈ 0.0000).
// Los quetzales llevan siempre 2 decimales y no llevan «=» ni «≈»: 2000/3 → Q666.67.
//
// Fracciones, monomios y polinomios al estilo del curso (design §14.1): «−3/4»,
// «x⁴/4», «5x⁴/4», potencias descendentes y «−» (U+2212) en el texto; «-» en LaTeX.
// polinomioTexto y polinomioLatex dan el mismo resultado que textoNormalizado y
// latexNormalizado de expresiones/normalizar.js para grado ≤ 3: expresiones/ no
// puede importar este archivo (design §2), así que las dos escrituras conviven y
// una prueba comprueba que coinciden.
//
// No usa Number para ningún valor: todo se calcula con BigInt.
import * as polinomio from '../nucleo/polinomio.js';
import * as racional from '../nucleo/racional.js';

/**
 * @typedef {import('../nucleo/racional.js').Racional} Racional
 * @typedef {import('../nucleo/polinomio.js').Polinomio} Polinomio
 * @typedef {import('../nucleo/unidades.js').Cantidad} Cantidad
 */

/** Decimales de los valores matemáticos: integrales, áreas, promedios y ceros (requirements §12). */
export const DECIMALES_VALOR = 4;
/** Decimales de los importes en quetzales (requirements §12). */
export const DECIMALES_QUETZALES = 2;
/** Unidades que pueden acompañar a un valor (design §14.1; requirements §11). Los quetzales usan `quetzales`. */
export const UNIDADES = Object.freeze(['u', 'u²', 'm', 'm²', 'cm', 'cm²', 'Q/m²', '%']);

const MENOS = '\u2212';
const DIGITOS_SUPERINDICE = Object.freeze(['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']);

/** Valida un Racional; racional.signo lanza TypeError si no lo es. */
const exigirRacional = (r) => racional.signo(r);

function exigirDecimales(decimales) {
  if (!Number.isSafeInteger(decimales) || decimales < 0) throw new RangeError('formato: los decimales deben ser un entero ≥ 0');
}

function exigirUnidad(unidad) {
  if (!UNIDADES.includes(unidad)) throw new RangeError(`formato: unidad desconocida «${String(unidad)}»`);
}

/** Exponente entero en superíndice: 4 → «⁴», −25 → «⁻²⁵». */
function superindice(k) {
  const texto = `${k < 0 ? -k : k}`;
  return `${k < 0 ? '⁻' : ''}${[...texto].map((d) => DIGITOS_SUPERINDICE[d.charCodeAt(0) - 48]).join('')}`;
}

/**
 * Redondeo mitad alejándose de cero de r a `decimales` cifras, exacto.
 * `negativo` solo es verdadero si el valor redondeado no es cero (sin «−0»).
 * @returns {{ negativo: boolean, entero: string, fraccion: string, exacto: boolean }}
 */
function redondear(r, decimales) {
  exigirRacional(r);
  exigirDecimales(decimales);
  const magnitud = (r.num < 0n ? -r.num : r.num) * 10n ** BigInt(decimales);
  let cociente = magnitud / r.den;
  const resto = magnitud % r.den;
  if (2n * resto >= r.den) cociente += 1n;
  const cifras = cociente.toString().padStart(decimales + 1, '0');
  return {
    negativo: r.num < 0n && cociente !== 0n,
    entero: cifras.slice(0, cifras.length - decimales),
    fraccion: cifras.slice(cifras.length - decimales),
    exacto: resto === 0n
  };
}

/** Decimal redondeado; si es exacto, sin ceros finales. `menos` es el signo que se usa. */
function decimal(r, decimales, menos) {
  const { negativo, entero, fraccion, exacto } = redondear(r, decimales);
  const parte = exacto ? fraccion.replace(/0+$/, '') : fraccion;
  return `${negativo ? menos : ''}${entero}${parte === '' ? '' : `.${parte}`}`;
}

// ── Decimales y quetzales ────────────────────────────────────────────

/**
 * r como decimal redondeado: «60.75», «13.3333», «−0.6667», «6», «0.0000».
 * Si la expansión termina dentro de los decimales, sin ceros finales.
 * @param {Racional} r
 * @param {number} [decimales]
 * @returns {string}
 */
export function aDecimal(r, decimales = DECIMALES_VALOR) {
  return decimal(r, decimales, MENOS);
}

/**
 * true si la expansión decimal de r termina dentro de `decimales` cifras, es decir,
 * si el decimal se muestra con «=».
 * @param {Racional} r
 * @param {number} [decimales]
 */
export function esDecimalExacto(r, decimales = DECIMALES_VALOR) {
  return redondear(r, decimales).exacto;
}

/**
 * «= 60.75» o «≈ 13.3333» (requirements §12).
 * @param {Racional} r
 * @param {number} [decimales]
 * @returns {string}
 */
export function decimalConSimbolo(r, decimales = DECIMALES_VALOR) {
  return `${esDecimalExacto(r, decimales) ? '=' : '≈'} ${aDecimal(r, decimales)}`;
}

/**
 * La misma aproximación en LaTeX: «= 60.75» o «\approx 13.3333», con «-».
 * @param {Racional} r
 * @param {number} [decimales]
 * @returns {string}
 */
export function decimalConSimboloLatex(r, decimales = DECIMALES_VALOR) {
  return `${esDecimalExacto(r, decimales) ? '=' : '\\approx'} ${decimal(r, decimales, '-')}`;
}

/**
 * Importe en quetzales con 2 decimales fijos: 2000/3 → «Q666.67», 0 → «Q0.00».
 * @param {Racional} r
 * @returns {string}
 */
export function quetzales(r) {
  const { negativo, entero, fraccion } = redondear(r, DECIMALES_QUETZALES);
  return `${negativo ? MENOS : ''}Q${entero}.${fraccion}`;
}

// ── Fracciones ───────────────────────────────────────────────────────

/**
 * Fracción irreducible con el signo en el numerador: «243/4», «−3/4», «6».
 * @param {Racional} r
 * @returns {string}
 */
export function fraccionTexto(r) {
  exigirRacional(r);
  const signo = r.num < 0n ? MENOS : '';
  const p = r.num < 0n ? -r.num : r.num;
  return r.den === 1n ? `${signo}${p}` : `${signo}${p}/${r.den}`;
}

/**
 * Fracción en LaTeX: «\frac{3}{4}», «-\frac{3}{4}», «6», «-2» (design §14.1).
 * @param {Racional} r
 * @returns {string}
 */
export function fraccionLatex(r) {
  exigirRacional(r);
  const signo = r.num < 0n ? '-' : '';
  const p = r.num < 0n ? -r.num : r.num;
  return r.den === 1n ? `${signo}${p}` : `${signo}\\frac{${p}}{${r.den}}`;
}

/**
 * Valor que se sustituye en un término: los negativos y las fracciones van entre
 * paréntesis, para que «(−1)³» y «(1/2)⁴» no se lean mal (R-09.6); los enteros
 * no negativos, sin ellos: «4⁴».
 * @param {Racional} r
 * @returns {string}
 */
export function sustitucionTexto(r) {
  const texto = fraccionTexto(r);
  return r.num < 0n || r.den !== 1n ? `(${texto})` : texto;
}

/**
 * La misma sustitución en LaTeX: «\left(-1\right)», «\left(\frac{1}{2}\right)», «4».
 * @param {Racional} r
 * @returns {string}
 */
export function sustitucionLatex(r) {
  const latex = fraccionLatex(r);
  return r.num < 0n || r.den !== 1n ? `\\left(${latex}\\right)` : latex;
}

// ── Monomios y polinomios (design §14.1) ─────────────────────────────

const TEXTO = Object.freeze({
  menos: MENOS,
  potencia: (k) => (k === 1 ? 'x' : `x${superindice(k)}`),
  fraccion: (n, d) => `${n}/${d}`
});
const LATEX = Object.freeze({
  menos: '-',
  potencia: (k) => (k === 1 ? 'x' : `x^{${k}}`),
  fraccion: (n, d) => `\\frac{${n}}{${d}}`
});

/** |c|·xᵏ: con c = p/q, xᵏ/q si |p| = 1, y p·xᵏ/q si no. */
function cuerpoMonomio(c, k, estilo) {
  const p = c.num < 0n ? -c.num : c.num;
  let numerador = `${p}`;
  if (k > 0) numerador = p === 1n ? estilo.potencia(k) : `${p}${estilo.potencia(k)}`;
  return c.den === 1n ? numerador : estilo.fraccion(numerador, `${c.den}`);
}

function exigirExponente(k) {
  if (!Number.isSafeInteger(k) || k < 0) throw new RangeError('formato: el exponente debe ser un entero ≥ 0');
}

/** Términos por potencia descendente, con el signo entre ellos; el polinomio cero es «0». */
function escribirPolinomio(p, estilo) {
  polinomio.grado(p); // valida p
  const partes = [];
  for (let k = p.coef.length - 1; k >= 0; k -= 1) {
    const c = p.coef[k];
    if (racional.esCero(c)) continue;
    const negativo = racional.signo(c) < 0;
    const cuerpo = cuerpoMonomio(c, k, estilo);
    if (partes.length === 0) partes.push(negativo ? `${estilo.menos}${cuerpo}` : cuerpo);
    else partes.push(`${negativo ? ` ${estilo.menos} ` : ' + '}${cuerpo}`);
  }
  return partes.length === 0 ? '0' : partes.join('');
}

/**
 * Monomio c·xᵏ con su signo: «x⁴/4», «5x⁴/4», «−x/3», «2/3»; «0» si c = 0.
 * @param {Racional} c
 * @param {number} k
 * @returns {string}
 */
export function monomioTexto(c, k) {
  exigirRacional(c);
  exigirExponente(k);
  if (racional.esCero(c)) return '0';
  return `${racional.signo(c) < 0 ? MENOS : ''}${cuerpoMonomio(c, k, TEXTO)}`;
}

/**
 * Monomio en LaTeX: «\frac{x^{4}}{4}», «\frac{5x^{4}}{4}», «-\frac{x}{3}».
 * @param {Racional} c
 * @param {number} k
 * @returns {string}
 */
export function monomioLatex(c, k) {
  exigirRacional(c);
  exigirExponente(k);
  if (racional.esCero(c)) return '0';
  return `${racional.signo(c) < 0 ? '-' : ''}${cuerpoMonomio(c, k, LATEX)}`;
}

/**
 * Polinomio por potencia descendente: «x³ − 4x²/3 − 5x/3 + 2/3», «x⁴/4 − x».
 * Admite cualquier grado (la antiderivada llega a 4; los centroides, a 7).
 * @param {Polinomio} p
 * @returns {string}
 */
export function polinomioTexto(p) {
  return escribirPolinomio(p, TEXTO);
}

/**
 * Polinomio en LaTeX: «x^{3} - \frac{4x^{2}}{3} - \frac{5x}{3} + \frac{2}{3}».
 * @param {Polinomio} p
 * @returns {string}
 */
export function polinomioLatex(p) {
  return escribirPolinomio(p, LATEX);
}

// ── Múltiplos de π y cotas ───────────────────────────────────────────

/**
 * k·π al estilo de los monomios: «25π», «π», «π/4», «9π/4», «−π/2».
 * @param {Racional} k
 * @returns {string}
 */
export function multiploPiTexto(k) {
  exigirRacional(k);
  if (racional.esCero(k)) return '0';
  const p = k.num < 0n ? -k.num : k.num;
  const numerador = p === 1n ? 'π' : `${p}π`;
  return `${k.num < 0n ? MENOS : ''}${k.den === 1n ? numerador : `${numerador}/${k.den}`}`;
}

/**
 * k·π en LaTeX: «25\pi», «\frac{\pi}{4}», «\frac{9\pi}{4}».
 * @param {Racional} k
 * @returns {string}
 */
export function multiploPiLatex(k) {
  exigirRacional(k);
  if (racional.esCero(k)) return '0';
  const p = k.num < 0n ? -k.num : k.num;
  const numerador = p === 1n ? '\\pi' : `${p}\\pi`;
  return `${k.num < 0n ? '-' : ''}${k.den === 1n ? numerador : `\\frac{${numerador}}{${k.den}}`}`;
}

/** 10^e como Racional exacto, para comparar sin Number. */
const potenciaDiez = (e) => (e >= 0 ? racional.entero(10n ** BigInt(e)) : racional.fraccion(1n, 10n ** BigInt(-e)));

/**
 * Cota en notación científica con una cifra, redondeada HACIA ARRIBA para que
 * siga siendo una cota: 5.85·10⁻²⁵ → «6·10⁻²⁵» (design §14.1). Devuelve
 * { m, e } con m entero de 1 a 9 y c ≤ m·10^e, o null si c = 0.
 */
function cotaCientifica(c) {
  exigirRacional(c);
  if (racional.signo(c) < 0) throw new RangeError('formato: una cota no puede ser negativa');
  if (racional.esCero(c)) return null;
  // e = ⌊log₁₀ c⌋, es decir, 10^e ≤ c < 10^(e + 1). La longitud de las cifras da una primera estimación.
  let e = c.num.toString().length - c.den.toString().length;
  while (racional.comparar(c, potenciaDiez(e)) < 0) e -= 1;
  while (racional.comparar(c, potenciaDiez(e + 1)) >= 0) e += 1;
  // m = ⌈c / 10^e⌉, entre 1 y 10.
  const t = racional.dividir(c, potenciaDiez(e));
  let m = (t.num + t.den - 1n) / t.den;
  if (m === 10n) {
    m = 1n;
    e += 1;
  }
  return { m, e };
}

/**
 * Cota de error: «6·10⁻²⁵», «1·10⁻¹²», «3»; «0» si es cero.
 * @param {Racional} c c ≥ 0.
 * @returns {string}
 */
export function cotaTexto(c) {
  const cientifica = cotaCientifica(c);
  if (cientifica === null) return '0';
  const { m, e } = cientifica;
  return e === 0 ? `${m}` : `${m}·10${superindice(e)}`;
}

/**
 * La misma cota en LaTeX: «6 \cdot 10^{-25}».
 * @param {Racional} c
 * @returns {string}
 */
export function cotaLatex(c) {
  const cientifica = cotaCientifica(c);
  if (cientifica === null) return '0';
  const { m, e } = cientifica;
  return e === 0 ? `${m}` : `${m} \\cdot 10^{${e}}`;
}

// ── Cantidades (design §10 y §14.1) ──────────────────────────────────

/**
 * Cantidad con su unidad (R-15.1):
 *   exacta      «243/4 = 60.75 u²», «40/3 ≈ 13.3333 m²», «6 u²»;
 *   multiploPi  «25π ≈ 78.5398 m²» (el decimal sale de PI_APROX, siempre «≈»);
 *   aproximada  «≈ 2.4379 u² (aproximada; cota de error ≤ 6·10⁻²⁵)».
 * @param {Cantidad} cantidad
 * @param {string} unidad Una de UNIDADES.
 * @returns {string}
 */
export function cantidadTexto(cantidad, unidad) {
  exigirUnidad(unidad);
  switch (cantidad?.clase) {
    case 'exacta': {
      const r = cantidad.valor;
      if (r?.den === 1n) return `${fraccionTexto(r)} ${unidad}`;
      return `${fraccionTexto(r)} ${decimalConSimbolo(r)} ${unidad}`;
    }
    case 'multiploPi':
      return `${multiploPiTexto(cantidad.coeficiente)} ≈ ${aDecimal(cantidad.aprox)} ${unidad}`;
    case 'aproximada':
      return `≈ ${aDecimal(cantidad.valor)} ${unidad} (aproximada; cota de error ≤ ${cotaTexto(cantidad.cota)})`;
    default:
      throw new TypeError('formato: se esperaba una Cantidad (exacta, multiploPi o aproximada)');
  }
}

/**
 * Cantidad en quetzales:
 *   exacta      «Q666.67» (2 decimales, sin «=» ni «≈», como en CR-03);
 *   multiploPi  «Q250π ≈ Q785.40» (coeficiente exacto y decimal con PI_APROX, design §9);
 *   aproximada  «≈ Q12.34 (aproximada; cota de error ≤ Q1·10⁻¹²)».
 * @param {Cantidad} cantidad
 * @returns {string}
 */
export function quetzalesCantidad(cantidad) {
  switch (cantidad?.clase) {
    case 'exacta':
      return quetzales(cantidad.valor);
    case 'multiploPi':
      return `Q${multiploPiTexto(cantidad.coeficiente)} ≈ ${quetzales(cantidad.aprox)}`;
    case 'aproximada':
      return `≈ ${quetzales(cantidad.valor)} (aproximada; cota de error ≤ Q${cotaTexto(cantidad.cota)})`;
    default:
      throw new TypeError('formato: se esperaba una Cantidad (exacta, multiploPi o aproximada)');
  }
}
