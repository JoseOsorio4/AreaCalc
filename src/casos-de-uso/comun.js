// Piezas comunes de los casos de uso de ÁreaCalc (T-08; design.md §10 y §11).
//
// Los casos de uso devuelven siempre un Resultado<T> y nunca lanzan excepciones
// hacia la interfaz (design §10). `protegido` envuelve cada caso de uso:
//   - PresupuestoAgotado de nucleo/ceros.js → E-SIS-01 (R-21.3);
//   - cualquier otra excepción → E-SIS-02 (R-19.4).
// En los dos casos se descarta todo lo calculado. El error que recibe el usuario
// solo lleva el mensaje del catálogo; el detalle técnico de E-SIS-02 va a la
// consola del navegador, nunca al mensaje (R-19.5; design §11).
import { PresupuestoAgotado } from '../nucleo/ceros.js';
import { crearError } from '../nucleo/errores.js';

/**
 * @typedef {import('../nucleo/errores.js').ErrorAreaCalc} ErrorAreaCalc
 * @typedef {import('../nucleo/errores.js').Advertencia} Advertencia
 * @typedef {{ ok: true, valor: any, advertencias: ReadonlyArray<Advertencia> }
 *   | { ok: false, errores: ReadonlyArray<ErrorAreaCalc> }} Resultado design §10.
 */

/** Resultado válido, congelado. */
export function exito(valor, advertencias = []) {
  return Object.freeze({ ok: true, valor: Object.freeze(valor), advertencias: Object.freeze([...advertencias]) });
}

/** Resultado con errores, congelado y sin ningún valor parcial. */
export function fracaso(errores) {
  return Object.freeze({ ok: false, errores: Object.freeze([...errores]) });
}

/** Errores de un Resultado, o ninguno si es válido. */
export const erroresDe = (resultado) => (resultado.ok ? [] : resultado.errores);

/** Error de programación dentro de un caso de uso; `protegido` lo convierte en E-SIS-02. */
export function errorInterno(mensaje) {
  const error = new Error(`casos-de-uso: ${mensaje}`);
  error.codigo = 'E-SIS-02';
  return error;
}

/**
 * Ejecuta un caso de uso sin dejar escapar excepciones.
 * @param {() => Resultado} calcular
 * @returns {Resultado}
 */
export function protegido(calcular) {
  try {
    return calcular();
  } catch (error) {
    if (error instanceof PresupuestoAgotado) return fracaso([crearError('E-SIS-01')]);
    console.error('ÁreaCalc: error interno (E-SIS-02)', error);
    return fracaso([crearError('E-SIS-02')]);
  }
}
