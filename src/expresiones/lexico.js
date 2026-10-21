// Analizador léxico de ÁreaCalc (T-09; design.md §5.2; requirements Tablas 9.1 y 9.2, y §10).
//
// analizarLexico(texto) recorre el texto de izquierda a derecha y produce las
// fichas { tipo, texto, posicion }, o el primer error en el orden de design §5.2:
//   1. vacío o solo espacios → E-EXP-01;
//   2. más de 200 caracteres → E-EXP-11;
//   3. prefijo de asignación o definición («y =», «f(x) =», «x =») → E-EXP-12;
//   4. recorrido: coma, notación científica o punto con dígitos a un solo lado → E-EXP-04;
//      nombre distinto de x: seguido de «(» o unidad → E-EXP-06, si no → E-EXP-03;
//      cualquier otro carácter → E-EXP-06;
//   5. más de 100 fichas → E-EXP-11;
//   6. literal con más de 6 decimales o mayor que 1 000 000 → E-EXP-05.
//
// Las fichas NUMERO guardan el texto del literal: la conversión a racional se
// hace al normalizar (tasks T-09). Analizar el texto no lo ejecuta (R-20.1).
//
// Posiciones: número de carácter en el texto original, contando desde 1, como en
// el mensaje de E-EXP-02 («cerca de la posición n»). Se cuentan unidades UTF-16,
// igual que `texto.length` y el límite de 200 caracteres. Una posición igual a
// la longitud del texto más 1 señala el final.
import { crearError } from '../nucleo/errores.js';
import * as racional from '../nucleo/racional.js';

/**
 * @typedef {'NUMERO' | 'X' | 'MAS' | 'MENOS' | 'POR' | 'ENTRE' | 'POTENCIA' | 'ABRE' | 'CIERRA'} TipoFicha
 * @typedef {Object} Ficha
 * @property {TipoFicha} tipo
 * @property {string} texto Texto tal como se escribió; «−» (U+2212) se conserva y su tipo es MENOS.
 * @property {number} posicion Número de su primer carácter, contando desde 1.
 * @typedef {import('../nucleo/errores.js').ErrorAreaCalc} ErrorAreaCalc
 * @typedef {{ ok: true, valor: ReadonlyArray<Readonly<Ficha>>, advertencias: ReadonlyArray<never> }
 *   | { ok: false, errores: ReadonlyArray<ErrorAreaCalc> }} ResultadoLexico Resultado de design §10.
 */

/** Tipos de ficha de design §5.2. */
export const TIPOS = Object.freeze({
  NUMERO: 'NUMERO',
  X: 'X',
  MAS: 'MAS',
  MENOS: 'MENOS',
  POR: 'POR',
  ENTRE: 'ENTRE',
  POTENCIA: 'POTENCIA',
  ABRE: 'ABRE',
  CIERRA: 'CIERRA'
});

/** Límites de complejidad y de los literales (requirements Tabla 9.2). */
export const LIMITES = Object.freeze({ caracteres: 200, fichas: 100, profundidad: 10, decimales: 6 });
const VALOR_MAXIMO = racional.entero(1000000n);

/** Operadores y paréntesis de un carácter; el signo menos tipográfico es MENOS (D-02). */
const OPERADORES = new Map([
  ['+', TIPOS.MAS], ['-', TIPOS.MENOS], ['\u2212', TIPOS.MENOS], ['*', TIPOS.POR],
  ['/', TIPOS.ENTRE], ['^', TIPOS.POTENCIA], ['(', TIPOS.ABRE], [')', TIPOS.CIERRA]
]);

/** Nombres que se interpretan como unidades (design §5.2, punto 4). */
const UNIDADES = new Set(['mm', 'cm', 'm', 'km']);

/**
 * Prefijo de asignación o definición: un nombre, opcionalmente «(nombre)», y un
 * «=» que no va seguido de otro «=». Los espacios se admiten entre sus partes.
 */
const PREFIJO_ASIGNACION = /^(\s*)[A-Za-z][A-Za-z0-9]*\s*(?:\(\s*[A-Za-z][A-Za-z0-9]*\s*\)\s*)?=(?!=)/;

const SUGERENCIA_FUNCION = 'Las funciones como sqrt o sin no se admiten; escriba un polinomio en x, por ejemplo x^2.';
const SUGERENCIA_UNIDAD = 'Escriba solo la expresión; las unidades se eligen en «Interpretación».';
const SUGERENCIA_CARACTER = 'Use solo números, x, los operadores + - * / ^ y paréntesis.';
const SUGERENCIA_MAYUSCULA = 'Escriba la variable en minúscula: x.';

const esDigito = (c) => c !== undefined && c >= '0' && c <= '9';
const esLetra = (c) => c !== undefined && ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z'));
const esEspacio = (c) => /\s/.test(c);
const esSigno = (c) => c === '+' || c === '-' || c === '\u2212';

const ficha = (tipo, texto, indice) => Object.freeze({ tipo, texto, posicion: indice + 1 });
const exito = (valor) => Object.freeze({ ok: true, valor, advertencias: Object.freeze([]) });
const fracaso = (error) => Object.freeze({ ok: false, errores: Object.freeze([error]) });
const fallo = (codigo, datos) => fracaso(crearError(codigo, datos));

/** Primer carácter que no es un espacio a partir de `indice`, o undefined al final. */
function siguienteVisible(texto, indice) {
  let i = indice;
  while (i < texto.length && esEspacio(texto[i])) i += 1;
  return texto[i];
}

/**
 * Fin de un literal que empieza en `inicio`: dígitos y, si los hay, un punto con
 * dígitos detrás. Un punto sin dígitos detrás queda fuera y lo trata el recorrido.
 * @returns {{ fin: number } | { error: ErrorAreaCalc }} Error E-EXP-04 si sigue una notación científica.
 */
function finDeLiteral(texto, inicio) {
  let i = inicio;
  while (esDigito(texto[i])) i += 1;
  if (texto[i] === '.' && esDigito(texto[i + 1])) {
    i += 1;
    while (esDigito(texto[i])) i += 1;
  }
  const cientifica = (texto[i] === 'e' || texto[i] === 'E')
    && (esDigito(texto[i + 1]) || (esSigno(texto[i + 1]) && esDigito(texto[i + 2])));
  if (cientifica) return { error: crearError('E-EXP-04', { posicion: i + 1 }) };
  return { fin: i };
}

/** Error de un nombre distinto de x (design §5.2, punto 4). */
function errorDeNombre(nombre, indice, siguiente) {
  const posicion = indice + 1;
  if (siguiente === '(') return crearError('E-EXP-06', { simbolo: nombre, posicion, sugerencia: SUGERENCIA_FUNCION });
  if (UNIDADES.has(nombre)) return crearError('E-EXP-06', { simbolo: nombre, posicion, sugerencia: SUGERENCIA_UNIDAD });
  return crearError('E-EXP-03', { simbolo: nombre, posicion, sugerencia: nombre === 'X' ? SUGERENCIA_MAYUSCULA : null });
}

/** Más de 6 decimales escritos, o mayor que 1 000 000; se compara de forma exacta. */
function literalFueraDeLimites(texto) {
  const punto = texto.indexOf('.');
  const decimales = punto === -1 ? 0 : texto.length - punto - 1;
  return decimales > LIMITES.decimales || racional.comparar(racional.desdeDecimal(texto), VALOR_MAXIMO) > 0;
}

/**
 * Texto de la función → fichas, o el primer error en el orden de design §5.2.
 * @param {string} texto Texto sin interpretar del campo de la función.
 * @returns {Readonly<ResultadoLexico>}
 */
export function analizarLexico(texto) {
  if (typeof texto !== 'string') throw new TypeError('lexico: analizarLexico espera el texto de la función');
  if (texto.trim() === '') return fallo('E-EXP-01'); // 1
  if (texto.length > LIMITES.caracteres) { // 2
    return fallo('E-EXP-11', { limite: 'caracteres', posicion: LIMITES.caracteres + 1 });
  }
  const prefijo = PREFIJO_ASIGNACION.exec(texto); // 3
  if (prefijo !== null) return fallo('E-EXP-12', { posicion: prefijo[1].length + 1 });

  const fichas = []; // 4
  let i = 0;
  while (i < texto.length) {
    const c = texto[i];
    if (esEspacio(c)) {
      i += 1;
    } else if (esDigito(c)) {
      const literal = finDeLiteral(texto, i);
      if ('error' in literal) return fracaso(literal.error);
      fichas.push(ficha(TIPOS.NUMERO, texto.slice(i, literal.fin), i));
      i = literal.fin;
    } else if (esLetra(c)) {
      let fin = i + 1;
      while (esLetra(texto[fin]) || esDigito(texto[fin])) fin += 1;
      const nombre = texto.slice(i, fin);
      if (nombre !== 'x') return fracaso(errorDeNombre(nombre, i, siguienteVisible(texto, fin)));
      fichas.push(ficha(TIPOS.X, nombre, i));
      i = fin;
    } else if (OPERADORES.has(c)) {
      fichas.push(ficha(OPERADORES.get(c), c, i));
      i += 1;
    } else if (c === ',') {
      return fallo('E-EXP-04', { posicion: i + 1 });
    } else if (c === '.') {
      // Con un dígito al lado es un número mal escrito (.5, 5., 1.5.3); sin dígitos, un símbolo (x.y).
      if (esDigito(texto[i - 1]) || esDigito(texto[i + 1])) return fallo('E-EXP-04', { posicion: i + 1 });
      return fallo('E-EXP-06', { simbolo: '.', posicion: i + 1, sugerencia: SUGERENCIA_CARACTER });
    } else {
      const simbolo = String.fromCodePoint(texto.codePointAt(i));
      return fallo('E-EXP-06', { simbolo, posicion: i + 1, sugerencia: SUGERENCIA_CARACTER });
    }
  }

  if (fichas.length > LIMITES.fichas) { // 5
    return fallo('E-EXP-11', { limite: 'elementos', posicion: fichas[LIMITES.fichas].posicion });
  }
  const fuera = fichas.find((f) => f.tipo === TIPOS.NUMERO && literalFueraDeLimites(f.texto)); // 6
  if (fuera !== undefined) return fallo('E-EXP-05', { numero: fuera.texto, posicion: fuera.posicion });
  return exito(Object.freeze(fichas));
}
