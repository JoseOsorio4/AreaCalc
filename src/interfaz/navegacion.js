// Navegación por secciones de ÁreaCalc (T-13; design.md §12 y §14.5; requirements R-23.1).
//
// Tres secciones, una visible a la vez: #perfil, #figuras y #estimacion. La sección
// sale del fragmento de la URL, así que cada cambio crea una entrada en el historial
// y el botón «Atrás» del navegador vuelve a la sección anterior sin código extra.
//
// Las funciones de traducción son puras. iniciarNavegacion e irA reciben la ventana
// como argumento: en el navegador es `window`, y en las pruebas, un objeto con
// `location`, `addEventListener` y `removeEventListener`. No hay dependencias nuevas.
import { SECCIONES } from './estado.js';

/** Sección por omisión cuando el fragmento está vacío o no es una sección. */
export const SECCION_INICIAL = 'perfil';

/**
 * Sección de un fragmento de URL: «#figuras» → 'figuras'; vacío o desconocido → 'perfil'.
 * @param {string} fragmento location.hash, con o sin «#».
 * @returns {import('./estado.js').Seccion}
 */
export function seccionDesdeFragmento(fragmento) {
  const nombre = typeof fragmento === 'string' ? fragmento.replace(/^#/, '') : '';
  return SECCIONES.includes(nombre) ? nombre : SECCION_INICIAL;
}

/**
 * Fragmento de una sección: 'estimacion' → «#estimacion».
 * @param {import('./estado.js').Seccion} seccion
 * @returns {string}
 */
export function fragmentoDe(seccion) {
  if (!SECCIONES.includes(seccion)) throw new RangeError(`navegacion: sección desconocida «${String(seccion)}»`);
  return `#${seccion}`;
}

function exigirVentana(ventana) {
  if (typeof ventana?.location !== 'object' || ventana.location === null
    || typeof ventana.addEventListener !== 'function' || typeof ventana.removeEventListener !== 'function') {
    throw new TypeError('navegacion: se esperaba la ventana del navegador');
  }
}

/**
 * Lleva a una sección cambiando el fragmento; el navegador añade la entrada al historial
 * y dispara «hashchange», que recibe iniciarNavegacion.
 * @param {object} ventana window, o un sustituto en las pruebas.
 * @param {import('./estado.js').Seccion} seccion
 */
export function irA(ventana, seccion) {
  exigirVentana(ventana);
  const fragmento = fragmentoDe(seccion);
  if (ventana.location.hash !== fragmento) ventana.location.hash = fragmento;
}

/**
 * Avisa de la sección actual al iniciar y cada vez que cambia el fragmento, también con
 * «Atrás» y «Adelante». Devuelve una función que deja de escuchar.
 * @param {object} ventana window, o un sustituto en las pruebas.
 * @param {(seccion: import('./estado.js').Seccion) => void} alCambiar
 * @returns {() => void}
 */
export function iniciarNavegacion(ventana, alCambiar) {
  exigirVentana(ventana);
  if (typeof alCambiar !== 'function') throw new TypeError('navegacion: se esperaba una función alCambiar');
  const avisar = () => alCambiar(seccionDesdeFragmento(ventana.location.hash));
  ventana.addEventListener('hashchange', avisar);
  avisar();
  return () => ventana.removeEventListener('hashchange', avisar);
}
