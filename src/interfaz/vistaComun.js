// Utilidades comunes de las vistas de ÁreaCalc (T-14; design.md §14.5; requirements R-19, R-20.5 y R-23).
//
// Mensajes por campo, resumen de errores, foco, estados vacíos, avisos y listas de pasos.
// Todo el DOM se construye con createElement, setAttribute, textContent, append y
// replaceChildren: el texto del usuario y los mensajes se insertan siempre como texto,
// nunca como marcado (R-20.5).
//
// Las vistas reciben el `documento` como argumento; aquí no se usa el objeto global.
import {
  aDecimal, cotaTexto, decimalConSimbolo, fraccionTexto, multiploPiTexto, quetzalesCantidad
} from '../presentacion/formato.js';

/**
 * @typedef {import('../nucleo/errores.js').ErrorAreaCalc} ErrorAreaCalc
 * @typedef {import('../nucleo/errores.js').Advertencia} Advertencia
 * @typedef {import('../presentacion/pasos.js').Paso} Paso
 * @typedef {Object} CampoVista Dónde se muestra el error de un campo del caso de uso.
 * @property {ReadonlyArray<string>} controles Ids de los controles que se marcan con aria-invalid.
 * @property {string} mensaje Id del párrafo que recibe el mensaje.
 * @typedef {Readonly<Record<string, CampoVista>>} MapaCampos Clave: `error.campo`
 *   ('funcion', 'a', 'b', 'intervalo', 'base', 'precio'…).
 * @typedef {null | undefined | false | string | Node | ReadonlyArray<Hijo>} Hijo
 */

/**
 * Crea un elemento. Atributos especiales: `clase` (className) y `texto` (textContent).
 * Un valor `true` deja el atributo vacío; `null`, `undefined` y `false` lo omiten.
 * Los hijos de tipo texto se insertan como nodos de texto.
 * @param {Document} documento
 * @param {string} etiqueta
 * @param {Record<string, string | number | boolean | null | undefined>} [atributos]
 * @param {...Hijo} hijos
 * @returns {HTMLElement}
 */
export function crear(documento, etiqueta, atributos = {}, ...hijos) {
  const elemento = documento.createElement(etiqueta);
  for (const [nombre, valor] of Object.entries(atributos ?? {})) {
    if (valor === null || valor === undefined || valor === false) continue;
    if (nombre === 'clase') elemento.className = String(valor);
    else if (nombre === 'texto') elemento.textContent = String(valor);
    else elemento.setAttribute(nombre, valor === true ? '' : String(valor));
  }
  elemento.append(...aplanar(hijos));
  return elemento;
}

function aplanar(hijos) {
  return hijos.flat(Infinity).filter((h) => h !== null && h !== undefined && h !== false);
}

/**
 * Busca un elemento por id y falla con un mensaje claro si el HTML no lo tiene.
 * @param {Document} documento
 * @param {string} id
 * @returns {HTMLElement}
 */
export function porId(documento, id) {
  const elemento = documento.getElementById(id);
  if (elemento === null) throw new Error(`vista: falta el elemento #${id} en index.html`);
  return elemento;
}

/**
 * Lleva el foco a un elemento que no es un control (un encabezado o un resumen).
 * Le da tabindex="-1" para que pueda recibirlo sin entrar en el orden de tabulación.
 * @param {HTMLElement | null} elemento
 */
export function enfocar(elemento) {
  if (!elemento) return;
  if (!elemento.hasAttribute('tabindex')) elemento.setAttribute('tabindex', '-1');
  elemento.focus();
}

/**
 * Muestra solo la sección activa (atributo hidden) y marca su enlace con
 * aria-current="page" (design §14.5).
 * @param {Document} documento
 * @param {import('./estado.js').Seccion} seccion
 */
export function mostrarSeccion(documento, seccion) {
  for (const elemento of documento.querySelectorAll('.seccion[data-seccion]')) {
    elemento.hidden = elemento.dataset.seccion !== seccion;
  }
  for (const enlace of documento.querySelectorAll('.lateral__enlace[data-seccion]')) {
    if (enlace.dataset.seccion === seccion) enlace.setAttribute('aria-current', 'page');
    else enlace.removeAttribute('aria-current');
  }
}

// ── Errores por campo y resumen (design §14.5; R-19.1) ───────────────

function tokens(elemento, atributo) {
  return (elemento.getAttribute(atributo) ?? '').split(/\s+/).filter((t) => t !== '');
}

function ponerToken(elemento, atributo, token) {
  const lista = tokens(elemento, atributo);
  if (!lista.includes(token)) elemento.setAttribute(atributo, [...lista, token].join(' '));
}

function quitarToken(elemento, atributo, token) {
  const lista = tokens(elemento, atributo).filter((t) => t !== token);
  if (lista.length === 0) elemento.removeAttribute(atributo);
  else elemento.setAttribute(atributo, lista.join(' '));
}

/**
 * Añade o quita un id de aria-describedby sin tocar los demás.
 * @param {HTMLElement} control
 * @param {string} id
 * @param {boolean} activo
 */
export function describir(control, id, activo) {
  if (activo) ponerToken(control, 'aria-describedby', id);
  else quitarToken(control, 'aria-describedby', id);
}

/** Mensaje completo de un error: causa y acción sugerida (R-19.1). */
export function textoError(error) {
  return error.sugerencia ? `${error.mensaje} ${error.sugerencia}` : error.mensaje;
}

/**
 * Muestra los errores de un cálculo: cada mensaje bajo su campo, los controles con
 * aria-invalid="true" y aria-describedby hacia el mensaje, y un resumen con enlaces a
 * los campos dentro del contenedor con role="alert". Sin errores, lo limpia todo.
 * Los errores sin campo propio (por ejemplo E-SIS-01 o E-MOD-04) solo van al resumen.
 * @param {Document} documento
 * @param {{ campos: MapaCampos, resumen: HTMLElement, errores: ReadonlyArray<ErrorAreaCalc> }} opciones
 */
export function mostrarErrores(documento, { campos, resumen, errores }) {
  const porMensaje = new Map();
  for (const config of Object.values(campos)) {
    const parrafo = porId(documento, config.mensaje);
    parrafo.textContent = '';
    parrafo.hidden = true;
    for (const id of config.controles) {
      const control = porId(documento, id);
      control.removeAttribute('aria-invalid');
      quitarToken(control, 'aria-describedby', config.mensaje);
    }
    porMensaje.set(config.mensaje, []);
  }

  const elementos = [];
  for (const error of errores) {
    const config = error.campo === null ? undefined : campos[error.campo];
    if (config !== undefined) {
      porMensaje.get(config.mensaje).push(textoError(error));
      for (const id of config.controles) {
        const control = porId(documento, id);
        control.setAttribute('aria-invalid', 'true');
        ponerToken(control, 'aria-describedby', config.mensaje);
      }
    }
    elementos.push(elementoResumen(documento, error, config));
  }
  for (const [id, mensajes] of porMensaje) {
    if (mensajes.length === 0) continue;
    const parrafo = porId(documento, id);
    parrafo.textContent = mensajes.join(' ');
    parrafo.hidden = false;
  }

  if (errores.length === 0) {
    resumen.replaceChildren();
    return;
  }
  const titulo = errores.length === 1 ? 'Hay 1 dato por corregir' : `Hay ${errores.length} datos por corregir`;
  resumen.replaceChildren(
    crear(documento, 'p', { clase: 'resumen-errores__titulo', texto: titulo }),
    crear(documento, 'ul', { clase: 'resumen-errores__lista' }, elementos)
  );
}

/**
 * Elemento del resumen: código, causa y sugerencia. Si el error tiene campo, es un enlace
 * que lleva el foco al primer control. El enlace no cambia el fragmento de la URL, que
 * se reserva para la navegación entre secciones.
 */
function elementoResumen(documento, error, config) {
  const contenido = [crear(documento, 'span', { clase: 'aviso__codigo', texto: error.codigo }), ` ${textoError(error)}`];
  if (config === undefined) return crear(documento, 'li', {}, contenido);
  const destino = config.controles[0];
  const enlace = crear(documento, 'a', { href: `#${destino}` }, contenido);
  enlace.addEventListener('click', (evento) => {
    evento.preventDefault();
    porId(documento, destino).focus();
  });
  return crear(documento, 'li', {}, enlace);
}

/**
 * Título del resumen de errores, para llevar el foco tras un cálculo fallido.
 * @param {HTMLElement} resumen
 * @returns {HTMLElement | null}
 */
export function tituloResumen(resumen) {
  return resumen.querySelector('.resumen-errores__titulo');
}

// ── Piezas de los resultados ─────────────────────────────────────────

/**
 * Estado vacío: todavía no hay resultado. No muestra cifras.
 * @param {Document} documento
 * @param {{ titulo: string, texto: string, idTitulo?: string }} opciones
 */
export function estadoVacio(documento, { titulo, texto, idTitulo }) {
  return crear(documento, 'div', { clase: 'vacio' },
    crear(documento, 'span', { clase: 'vacio__icono', 'aria-hidden': 'true', texto: '∫' }),
    crear(documento, 'div', { clase: 'vacio__cuerpo' },
      crear(documento, 'h2', { clase: 'vacio__titulo', id: idTitulo, texto: titulo }),
      crear(documento, 'p', { texto })));
}

/**
 * Cifra en dos líneas: la principal (fracción exacta, k·π o el decimal aproximado) y la
 * secundaria (su decimal o la cota). Todo el texto sale de presentacion/formato.js; aquí
 * solo se reparte en dos elementos para que la fracción sea la protagonista.
 *   exacta      «40/3 m²» + «≈ 13.3333 m²» (un entero no lleva línea secundaria)
 *   multiploPi  «25π m²» + «≈ 78.5398 m²»
 *   aproximada  «≈ 2.4379 u²» + «aproximada; cota de error ≤ 6·10⁻²⁵»
 * Con `enQuetzales`, la cantidad se escribe con quetzalesCantidad en una sola línea.
 * @param {Document} documento
 * @param {object} cantidad Cantidad de design §10.
 * @param {string} unidad Una de formato.UNIDADES (se ignora con enQuetzales).
 * @param {{ enQuetzales?: boolean }} [opciones]
 * @returns {HTMLElement}
 */
export function cifra(documento, cantidad, unidad, { enQuetzales = false } = {}) {
  const linea = (clase, texto) => crear(documento, 'span', { clase, texto });
  if (enQuetzales) {
    return crear(documento, 'span', { clase: 'cifra' }, linea('cifra__principal', quetzalesCantidad(cantidad)));
  }
  switch (cantidad?.clase) {
    case 'exacta': {
      const r = cantidad.valor;
      return crear(documento, 'span', { clase: 'cifra' },
        linea('cifra__principal', `${fraccionTexto(r)} ${unidad}`),
        r.den === 1n ? null : linea('cifra__secundaria', `${decimalConSimbolo(r)} ${unidad}`));
    }
    case 'multiploPi':
      return crear(documento, 'span', { clase: 'cifra' },
        linea('cifra__principal', `${multiploPiTexto(cantidad.coeficiente)} ${unidad}`),
        linea('cifra__secundaria', `≈ ${aDecimal(cantidad.aprox)} ${unidad}`));
    case 'aproximada':
      return crear(documento, 'span', { clase: 'cifra' },
        linea('cifra__principal', `≈ ${aDecimal(cantidad.valor)} ${unidad}`),
        linea('cifra__secundaria', `aproximada; cota de error ≤ ${cotaTexto(cantidad.cota)}`));
    default:
      throw new TypeError('vista: se esperaba una Cantidad (exacta, multiploPi o aproximada)');
  }
}

/**
 * Una advertencia con su código delante: «W-07 La gráfica no está disponible…».
 * @param {Document} documento
 * @param {{ codigo: string, mensaje: string }} aviso Advertencia del caso de uso o de un adaptador.
 * @param {string} [etiqueta]
 * @returns {HTMLElement}
 */
export function avisoAdvertencia(documento, aviso, etiqueta = 'li') {
  return crear(documento, etiqueta, { clase: 'aviso' },
    crear(documento, 'span', { clase: 'aviso__codigo', texto: aviso.codigo }), ` ${aviso.mensaje}`);
}

/**
 * Lista de advertencias, con su código (requirements §10). Vacía → null.
 * @param {Document} documento
 * @param {ReadonlyArray<Advertencia>} advertencias
 * @returns {HTMLElement | null}
 */
export function listaAdvertencias(documento, advertencias) {
  if (!advertencias || advertencias.length === 0) return null;
  return crear(documento, 'ul', { clase: 'avisos', 'aria-label': 'Advertencias' },
    advertencias.map((aviso) => avisoAdvertencia(documento, aviso)));
}

/**
 * Lista numerada de pasos con su versión en texto (R-09.8). La versión LaTeX queda en
 * `data-latex` del texto del paso; main.js la mejora con formulasKatex tras pintar
 * (T-17). Si KaTeX falla, se sigue leyendo el texto.
 * @param {Document} documento
 * @param {ReadonlyArray<Paso>} pasos
 * @returns {HTMLElement}
 */
export function listaPasos(documento, pasos) {
  return crear(documento, 'ol', { clase: 'pasos' },
    pasos.map((paso) => crear(documento, 'li', { clase: 'paso', 'data-paso': paso.id },
      crear(documento, 'p', { clase: 'paso__titulo', texto: paso.titulo }),
      crear(documento, 'p', { clase: 'paso__texto', 'data-latex': paso.latex, texto: paso.texto }),
      paso.explicacion ? crear(documento, 'p', { clase: 'paso__explicacion', texto: paso.explicacion }) : null)));
}

/**
 * Procedimiento en un panel desplegable, abierto por defecto (design §14.2).
 * @param {Document} documento
 * @param {ReadonlyArray<Paso>} pasos
 * @param {string} [titulo]
 * @returns {HTMLElement}
 */
export function desplegablePasos(documento, pasos, titulo = 'Procedimiento paso a paso') {
  return crear(documento, 'details', { clase: 'desplegable', open: true },
    crear(documento, 'summary', { clase: 'desplegable__resumen', texto: titulo }),
    crear(documento, 'div', { clase: 'desplegable__contenido' }, listaPasos(documento, pasos)));
}

// ── Selector de ejemplos (R-13; T-16 y T-17) ─────────────────────────

/**
 * Llena y muestra un selector de ejemplos. Al elegir uno, llama a `alElegir(id)`, que
 * despacha cargarEjemplo: el mismo camino que una entrada manual (R-13.2). El título ya
 * empieza por el origen del ejemplo (R-13.1); la nota de origen la escribe
 * sincronizarEjemplo en cada repintado.
 * @param {Document} documento
 * @param {{ contenedor: HTMLElement, selector: HTMLSelectElement,
 *   ejemplos: ReadonlyArray<{ id: string, titulo?: string }>, alElegir: (id: string) => void }} opciones
 */
export function prepararEjemplos(documento, { contenedor, selector, ejemplos, alElegir }) {
  selector.replaceChildren(
    crear(documento, 'option', { value: '', texto: 'Elija un ejemplo…' }),
    ...ejemplos.map((ejemplo) => crear(documento, 'option', { value: ejemplo.id, texto: ejemplo.titulo ?? ejemplo.id })));
  contenedor.hidden = false;
  selector.addEventListener('change', () => {
    if (selector.value !== '') alElegir(selector.value);
  });
}

/**
 * Origen del ejemplo con las etiquetas del catálogo (R-13.1) y, si sus datos son
 * simulados, el aviso de R-13.4. Solo copia textos del catálogo; no describe resultados.
 * @param {{ origen?: string, simulado?: boolean, estimacion?: object }} ejemplo
 * @returns {string}
 */
export function textoOrigenEjemplo(ejemplo) {
  const partes = [`Origen: ${ejemplo.origen ?? 'catálogo de ejemplos'}.`];
  if (ejemplo.simulado === true) {
    partes.push(ejemplo.estimacion === undefined
      ? 'Sus datos son simulados.'
      : 'El precio y el adicional que se copian a Estimación son simulados, no son precios reales.');
  }
  return partes.join(' ');
}

/**
 * Si la entrada ya no coincide con el ejemplo elegido (el usuario editó un campo), el
 * selector vuelve a «Elija un ejemplo…»: así no rotula como «simulado» un dato propio.
 * Mientras coincide, `nota` muestra su origen y se asocia al selector con aria-describedby.
 * @param {HTMLSelectElement} selector
 * @param {ReadonlyArray<{ id: string, entrada: Record<string, string>, origen?: string, simulado?: boolean }>} ejemplos
 * @param {Record<string, string>} entrada
 * @param {HTMLElement | null} [nota]
 */
export function sincronizarEjemplo(selector, ejemplos, entrada, nota = null) {
  let elegido = selector.value === '' ? undefined : ejemplos.find((ejemplo) => ejemplo.id === selector.value);
  const coincide = elegido !== undefined
    && Object.entries(elegido.entrada).every(([campo, valor]) => entrada[campo] === valor);
  if (!coincide) {
    if (selector.value !== '') selector.value = '';
    elegido = undefined;
  }
  if (nota === null) return;
  const texto = elegido === undefined ? '' : textoOrigenEjemplo(elegido);
  if (nota.textContent !== texto) nota.textContent = texto;
  nota.hidden = texto === '';
  describir(selector, nota.id, texto !== '');
}

/**
 * Sincroniza el valor de un control con el estado sin mover el cursor si ya coincide.
 * @param {HTMLInputElement | HTMLSelectElement} control
 * @param {string} valor
 */
export function fijarValor(control, valor) {
  if (control.value !== valor) control.value = valor;
}
