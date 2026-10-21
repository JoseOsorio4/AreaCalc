// Lectura de campos numéricos de ÁreaCalc (design.md §11; requirements R-03 y Tabla 9.3).
//
// leerNumero(texto, reglas) convierte el texto de un campo en un Racional exacto
// o devuelve el primer error, en el orden de design §11. El valor se obtiene con
// racional.desdeDecimal: nunca con Number(texto), así que 0.1 es 1/10 (R-03.2).
// leerIntervalo lee a y b, acumula sus errores y solo después comprueba
// E-INT-01 y E-INT-02, sin intercambiar los límites (R-01.6).
import * as racional from './racional.js';
import { crearError } from './errores.js';

/**
 * @typedef {import('./racional.js').Racional} Racional
 * @typedef {import('./errores.js').ErrorAreaCalc} ErrorAreaCalc
 * @typedef {import('./errores.js').Advertencia} Advertencia
 * @typedef {{ ok: true, valor: any, advertencias: ReadonlyArray<Advertencia> }
 *   | { ok: false, errores: ReadonlyArray<ErrorAreaCalc> }} Resultado design §10.
 * @typedef {Object} ReglasCampo Tabla 9.3 de requirements.
 * @property {Racional} maximo Valor máximo admitido.
 * @property {Racional | null} minimo Valor mínimo, solo si el campo admite negativos.
 * @property {number} decimales Decimales escritos como máximo.
 * @property {boolean} rechazaNegativos Un negativo da E-NUM-05 (precio y adicional).
 * @property {boolean} exigePositivo Cero o negativo da E-NUM-06 (dimensiones).
 * @property {string} rango Texto del rango para la sugerencia de E-NUM-04.
 * @property {string} [campo] Identificador del campo, por ejemplo 'a' o 'precio'.
 * @property {string} [etiqueta] Nombre del campo que muestra el mensaje.
 */

const q = (n) => racional.entero(BigInt(n));
const reglas = (r) => Object.freeze(r);

/** Reglas por tipo de campo (requirements Tabla 9.3). */
export const REGLAS = Object.freeze({
  limite: reglas({ maximo: q(1000), minimo: q(-1000), decimales: 6, rechazaNegativos: false,
    exigePositivo: false, rango: 'entre −1000 y 1000, con 6 decimales como máximo' }),
  dimensionM: reglas({ maximo: q(1000), minimo: null, decimales: 6, rechazaNegativos: false,
    exigePositivo: true, rango: 'entre 0 (sin incluirlo) y 1000 m, con 6 decimales como máximo' }),
  dimensionCm: reglas({ maximo: q(100000), minimo: null, decimales: 6, rechazaNegativos: false,
    exigePositivo: true, rango: 'entre 0 (sin incluirlo) y 100 000 cm, con 6 decimales como máximo' }),
  precio: reglas({ maximo: q(1000000), minimo: null, decimales: 2, rechazaNegativos: true,
    exigePositivo: false, rango: 'entre Q0 y Q1 000 000 por m², con 2 decimales como máximo' }),
  adicional: reglas({ maximo: q(100), minimo: null, decimales: 2, rechazaNegativos: true,
    exigePositivo: false, rango: 'entre 0 % y 100 %, con 2 decimales como máximo' })
});

/**
 * Las reglas de un tipo, con el campo y la etiqueta que nombran el mensaje.
 * @param {ReglasCampo} base
 * @param {string} campo
 * @param {string} etiqueta
 * @returns {Readonly<ReglasCampo>}
 */
export function conCampo(base, campo, etiqueta) {
  return Object.freeze({ ...base, campo, etiqueta });
}

export const REGLAS_A = conCampo(REGLAS.limite, 'a', 'límite inferior a');
export const REGLAS_B = conCampo(REGLAS.limite, 'b', 'límite superior b');

const DECIMAL = /^[+-]?\d+(\.\d+)?$/;
const NO_FINITO = /^[+-]?(?:infinity|∞)$|^nan$/i;
const CIENTIFICA = /^[+-]?\d+(?:\.\d+)?[eE][+-]?\d+$/;

const exito = (valor) => Object.freeze({ ok: true, valor, advertencias: Object.freeze([]) });
const fracaso = (errores) => Object.freeze({ ok: false, errores: Object.freeze(errores) });

/** Sugerencia específica de E-NUM-02 para la coma, los separadores y la notación científica. */
function sugerenciaFormato(texto) {
  if (CIENTIFICA.test(texto)) return { sugerencia: 'La notación científica no se admite; escriba el número completo, por ejemplo 1000.' };
  if (/[,\s]/.test(texto)) return { sugerencia: 'Use punto decimal, por ejemplo 2.5, sin separadores de miles.' };
  return {};
}

function exigirReglas(r) {
  if (typeof r?.decimales !== 'number' || typeof r.maximo?.num !== 'bigint') {
    throw new TypeError('numeros: se esperaban las reglas de un campo (REGLAS)');
  }
}

/**
 * Texto de un campo → Racional exacto, o el primer error de design §11:
 *   1. recorta los espacios y trata «−» (U+2212) como «-»;  2. vacío → E-NUM-01;
 *   3. Infinity, NaN o ∞ → E-NUM-03;  4. no es ^[+-]?\d+(\.\d+)?$ → E-NUM-02;
 *   5. demasiados decimales escritos o fuera de rango → E-NUM-04;
 *   6. negativo donde no se admite → E-NUM-05;  7. cero o negativo en una dimensión → E-NUM-06.
 * @param {string} texto
 * @param {ReglasCampo} reglasCampo
 * @returns {Readonly<Resultado>} Con `valor` Racional si es válido.
 */
export function leerNumero(texto, reglasCampo) {
  if (typeof texto !== 'string') throw new TypeError('numeros: leerNumero espera el texto del campo');
  exigirReglas(reglasCampo);
  const fallo = (codigo, extra = {}) => fracaso([crearError(codigo, {
    campo: reglasCampo.campo, etiqueta: reglasCampo.etiqueta ?? 'valor', ...extra
  })]);
  const limpio = texto.trim().replaceAll('\u2212', '-'); // 1
  if (limpio === '') return fallo('E-NUM-01'); // 2
  if (NO_FINITO.test(limpio)) return fallo('E-NUM-03'); // 3
  if (!DECIMAL.test(limpio)) return fallo('E-NUM-02', sugerenciaFormato(limpio)); // 4
  const valor = racional.desdeDecimal(limpio);
  const decimales = limpio.includes('.') ? limpio.length - limpio.indexOf('.') - 1 : 0;
  if (decimales > reglasCampo.decimales // 5
    || racional.comparar(valor, reglasCampo.maximo) > 0
    || (reglasCampo.minimo !== null && racional.comparar(valor, reglasCampo.minimo) < 0)) {
    return fallo('E-NUM-04', { rango: reglasCampo.rango });
  }
  if (reglasCampo.rechazaNegativos && racional.signo(valor) < 0) return fallo('E-NUM-05'); // 6
  if (reglasCampo.exigePositivo && racional.signo(valor) <= 0) return fallo('E-NUM-06'); // 7
  return exito(valor);
}

/**
 * Lee a y b por separado y acumula sus errores (R-19.2). Solo si los dos son
 * válidos comprueba a = b (E-INT-01) y a > b (E-INT-02). Nunca los intercambia.
 * @param {string} textoA
 * @param {string} textoB
 * @returns {Readonly<Resultado>} Con `valor` { a, b } si es válido.
 */
export function leerIntervalo(textoA, textoB) {
  const a = leerNumero(textoA, REGLAS_A);
  const b = leerNumero(textoB, REGLAS_B);
  const errores = [...(a.ok ? [] : a.errores), ...(b.ok ? [] : b.errores)];
  if (errores.length > 0) return fracaso(errores);
  const orden = racional.comparar(a.valor, b.valor);
  if (orden === 0) return fracaso([crearError('E-INT-01')]);
  if (orden > 0) return fracaso([crearError('E-INT-02')]);
  return exito(Object.freeze({ a: a.valor, b: b.valor }));
}
