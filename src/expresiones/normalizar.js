// Normalización al modelo validado de ÁreaCalc (T-10; design.md §5.4 y §10; requirements R-02).
//
// normalizarArbol(arbol) recorre el árbol de sintaxis.js de abajo arriba y de
// izquierda a derecha, y construye un Polinomio exacto con nucleo/polinomio.js.
// Cada operación se comprueba ANTES de hacerla (design §5.4):
//   producto   suma de los grados de los factores ≤ 3 ............ si no, E-EXP-10
//   potencia   exponente 0 ........................................ E-EXP-07
//              base de grado g ≥ 1: g·n ≤ 3 ....................... si no, E-EXP-10
//              base constante: n ≤ 3 .............................. si no, E-EXP-07
//   división   divisor normalizado constante ...................... si no, E-EXP-08
//              divisor distinto de cero ........................... si no, E-EXP-09
// Así ninguna subexpresión supera el grado 3, y x^4 - x^4 da E-EXP-10 (R-02.4).
// No hay tope para los coeficientes normalizados (D-09). Los literales se leen
// con racional.desdeDecimal, sin Number (R-03.2), y ninguna decisión usa coma
// flotante.
//
// interpretarFuncion(texto) une léxico, sintaxis y normalización y devuelve el
// ModeloValidado de design §10. textoNormalizado y latexNormalizado se generan
// desde el polinomio, nunca desde el texto del usuario (R-20.5), al estilo del
// curso (design §14.1): potencias descendentes y monomios como x²/4 o 5x/3.
import { crearError } from '../nucleo/errores.js';
import * as polinomio from '../nucleo/polinomio.js';
import * as racional from '../nucleo/racional.js';
import { analizarExpresion } from './sintaxis.js';

/**
 * @typedef {import('../nucleo/polinomio.js').Polinomio} Polinomio
 * @typedef {import('../nucleo/racional.js').Racional} Racional
 * @typedef {import('../nucleo/errores.js').ErrorAreaCalc} ErrorAreaCalc
 * @typedef {import('./sintaxis.js').Nodo} Nodo
 * @typedef {Object} ArbolNormalizado
 * @property {Polinomio} polinomio Grado ≤ 3.
 * @property {boolean} huboDesarrollo Hubo un producto o una potencia con un factor
 *   que es una suma o una resta, aunque lleve signos delante (R-09.5).
 * @typedef {Object} ModeloValidado design §10.
 * @property {string} textoOriginal El texto tal como lo escribió el usuario.
 * @property {Polinomio} polinomio Grado ≤ 3, con coeficientes racionales exactos.
 * @property {boolean} huboDesarrollo
 * @property {string} textoNormalizado Por ejemplo «x³ − 1», con «−» (U+2212).
 * @property {string} latexNormalizado Por ejemplo «x^{3} - 1».
 * @typedef {{ ok: true, valor: any, advertencias: ReadonlyArray<never> }
 *   | { ok: false, errores: ReadonlyArray<ErrorAreaCalc> }} Resultado design §10.
 */

const GRADO_MAXIMO = 3n;
const MENOS_UNO = racional.entero(-1n);
const UNO = racional.entero(1n);
const POLINOMIO_X = polinomio.desdeCoeficientes([racional.entero(0n), UNO]);

/** Error de normalización; solo circula dentro de este módulo. */
class FalloNormalizacion extends Error {
  constructor(error) {
    super(error.mensaje);
    this.error = error;
  }
}

const fallo = (codigo, posicion, datos = {}) => new FalloNormalizacion(crearError(codigo, { ...datos, posicion }));
const exito = (valor) => Object.freeze({ ok: true, valor, advertencias: Object.freeze([]) });
const fracaso = (error) => Object.freeze({ ok: false, errores: Object.freeze([error]) });
const gradoDe = (p) => BigInt(polinomio.grado(p)); // −1 para el polinomio cero

/** Un nodo es una suma o una resta, aunque lleve signos delante, como −(x + 1). */
function esSumaOResta(nodo) {
  let actual = nodo;
  while (actual.tipo === 'negacion') actual = actual.arg;
  return actual.tipo === 'suma' || actual.tipo === 'resta';
}

/** Exponente del árbol como BigInt; la sintaxis garantiza un entero sin punto. */
function exponenteDe(nodo) {
  if (nodo?.tipo !== 'numero' || !/^\d+$/.test(nodo.valor)) {
    throw new TypeError('normalizar: el exponente debe ser un nodo numero entero');
  }
  return BigInt(nodo.valor);
}

/** Normaliza un nodo; `estado.huboDesarrollo` se activa al desarrollar. */
function normalizarNodo(nodo, estado) {
  switch (nodo?.tipo) {
    case 'numero':
      return polinomio.desdeCoeficientes([racional.desdeDecimal(nodo.valor)]);
    case 'x':
      return POLINOMIO_X;
    case 'negacion':
      return polinomio.escalar(normalizarNodo(nodo.arg, estado), MENOS_UNO);
    case 'suma': {
      const izq = normalizarNodo(nodo.izq, estado);
      return polinomio.sumar(izq, normalizarNodo(nodo.der, estado));
    }
    case 'resta': {
      const izq = normalizarNodo(nodo.izq, estado);
      return polinomio.restar(izq, normalizarNodo(nodo.der, estado));
    }
    case 'producto':
      return producto(nodo, estado);
    case 'division':
      return division(nodo, estado);
    case 'potencia':
      return potencia(nodo, estado);
    default:
      throw new TypeError(`normalizar: nodo desconocido «${String(nodo?.tipo)}»`);
  }
}

/** Producto: la suma de los grados se comprueba antes de multiplicar. */
function producto(nodo, estado) {
  const izq = normalizarNodo(nodo.izq, estado);
  const der = normalizarNodo(nodo.der, estado);
  const grado = gradoDe(izq) + gradoDe(der);
  if (grado > GRADO_MAXIMO) throw fallo('E-EXP-10', nodo.posicion, { grado: String(grado) });
  if (esSumaOResta(nodo.izq) || esSumaOResta(nodo.der)) estado.huboDesarrollo = true;
  return polinomio.multiplicar(izq, der);
}

/** Potencia: exponente 0, g·n ≤ 3 o n ≤ 3, siempre antes de calcularla. */
function potencia(nodo, estado) {
  const base = normalizarNodo(nodo.base, estado);
  const n = exponenteDe(nodo.exponente);
  if (n === 0n) throw fallo('E-EXP-07', nodo.exponente.posicion);
  const g = gradoDe(base);
  if (g >= 1n) {
    if (g * n > GRADO_MAXIMO) throw fallo('E-EXP-10', nodo.posicion, { grado: String(g * n) });
  } else if (n > GRADO_MAXIMO) {
    throw fallo('E-EXP-07', nodo.exponente.posicion); // base constante: 2^4
  }
  if (esSumaOResta(nodo.base)) estado.huboDesarrollo = true;
  return polinomio.potencia(base, n);
}

/** División: solo entre una constante distinta de cero, según el divisor normalizado. */
function division(nodo, estado) {
  const dividendo = normalizarNodo(nodo.izq, estado);
  const divisor = normalizarNodo(nodo.der, estado);
  const g = gradoDe(divisor);
  if (g >= 1n) throw fallo('E-EXP-08', nodo.posicion);
  if (g < 0n) throw fallo('E-EXP-09', nodo.posicion);
  return polinomio.escalar(dividendo, racional.dividir(UNO, divisor.coef[0]));
}

/**
 * Árbol de sintaxis.js → polinomio de grado ≤ 3, o el primer error de design §5.4.
 * @param {Nodo} arbol
 * @returns {Readonly<Resultado>} Con `valor` ArbolNormalizado si es válido.
 */
export function normalizarArbol(arbol) {
  if (arbol === null || typeof arbol !== 'object' || typeof arbol.tipo !== 'string') {
    throw new TypeError('normalizar: normalizarArbol espera el árbol de analizarExpresion');
  }
  const estado = { huboDesarrollo: false };
  try {
    const p = normalizarNodo(arbol, estado);
    return exito(Object.freeze({ polinomio: p, huboDesarrollo: estado.huboDesarrollo }));
  } catch (e) {
    if (e instanceof FalloNormalizacion) return fracaso(e.error);
    throw e;
  }
}

// ── Escritura del modelo (design §14.1) ──────────────────────────────

const POTENCIAS_TEXTO = Object.freeze(['', 'x', 'x²', 'x³']);
const POTENCIAS_LATEX = Object.freeze(['', 'x', 'x^{2}', 'x^{3}']);
const TEXTO = Object.freeze({ potencias: POTENCIAS_TEXTO, menos: '\u2212', fraccion: (n, d) => `${n}/${d}` });
const LATEX = Object.freeze({ potencias: POTENCIAS_LATEX, menos: '-', fraccion: (n, d) => `\\frac{${n}}{${d}}` });

/** |c|·xᵏ al estilo del curso: con c = p/q, xᵏ/q si |p| = 1, y p·xᵏ/q si no. */
function monomio(c, k, estilo) {
  const p = c.num < 0n ? -c.num : c.num;
  let numerador = `${p}`;
  if (k > 0) numerador = p === 1n ? estilo.potencias[k] : `${p}${estilo.potencias[k]}`;
  return c.den === 1n ? numerador : estilo.fraccion(numerador, `${c.den}`);
}

/** Términos por potencia descendente, con el signo entre ellos; el cero es «0». */
function escribir(p, estilo) {
  const partes = [];
  for (let k = p.coef.length - 1; k >= 0; k -= 1) {
    const c = p.coef[k];
    if (racional.esCero(c)) continue;
    const negativo = racional.signo(c) < 0;
    const cuerpo = monomio(c, k, estilo);
    if (partes.length === 0) partes.push(negativo ? `${estilo.menos}${cuerpo}` : cuerpo);
    else partes.push(`${negativo ? ` ${estilo.menos} ` : ' + '}${cuerpo}`);
  }
  return partes.length === 0 ? '0' : partes.join('');
}

/**
 * Texto de la función → ModeloValidado (design §4 y §10), o el primer error del
 * léxico, de la sintaxis o de la normalización.
 * @param {string} texto
 * @returns {Readonly<Resultado>} Con `valor` ModeloValidado si es válido.
 */
export function interpretarFuncion(texto) {
  const sintaxis = analizarExpresion(texto);
  if (!sintaxis.ok) return sintaxis;
  const normal = normalizarArbol(sintaxis.valor);
  if (!normal.ok) return normal;
  const { polinomio: p, huboDesarrollo } = normal.valor;
  return exito(Object.freeze({
    textoOriginal: texto,
    polinomio: p,
    huboDesarrollo,
    textoNormalizado: escribir(p, TEXTO),
    latexNormalizado: escribir(p, LATEX)
  }));
}
