// Estado de la interfaz de ÁreaCalc y sus transiciones (T-13; design.md §12; requirements R-12 y R-13.2).
//
// Hay un solo objeto de estado en memoria (R-12.3). Cada transición es una función
// pura: recibe el estado y los datos de la acción y devuelve un estado NUEVO,
// congelado, sin modificar el anterior. Se prueban sin DOM. Las que calculan solo
// llaman a los casos de uso, que son deterministas y nunca lanzan excepciones.
//
// Invalidación (R-12.1, D-04):
//   - editar el perfil o la figura retira su resultado y sus errores; si era la fuente
//     de la estimación, retira también la fuente y la estimación;
//   - calcular el perfil o la figura reemplaza su resultado (o lo retira si hay errores,
//     R-12.2) y, si era la fuente, retira la fuente y la estimación, que dependían del
//     resultado anterior;
//   - editar el precio o el adicional retira la estimación.
// Los pasos y la gráfica viven dentro del resultado (ResultadoPerfil.pasos y .grafica),
// así que se retiran con él.
//
// cargarEjemplo sigue el mismo camino que una entrada manual (R-13.2): copia los textos
// con las mismas transiciones de edición y después calcula. El catálogo de ejemplos es
// de T-16; aquí se recibe como argumento y solo se leen sus textos de entrada, nunca
// resultados (R-13.3).
import { analizarPerfil } from '../casos-de-uso/analizarPerfil.js';
import { calcularFigura as casoCalcularFigura } from '../casos-de-uso/calcularFigura.js';
import { estimarMaterial } from '../casos-de-uso/estimarMaterial.js';

/**
 * @typedef {'perfil' | 'figuras' | 'estimacion'} Seccion
 * @typedef {'perfil' | 'figura'} Fuente
 * @typedef {Object} Estado design §12.
 * @property {Seccion} seccion
 * @property {{ entrada: object, resultado: object | null, errores: ReadonlyArray<object> }} perfil
 * @property {{ entrada: object, resultado: object | null, errores: ReadonlyArray<object> }} figura
 * @property {{ fuente: Fuente | null, entrada: { textoPrecio: string, textoAdicional: string },
 *   datosSimulados: boolean, resultado: object | null, errores: ReadonlyArray<object> }} estimacion
 *   `datosSimulados` (añadido a design §12) indica que el precio y el adicional vienen de un
 *   caso práctico simulado; estimarMaterial añade entonces W-05 a los supuestos.
 * @typedef {Object} Ejemplo Contrato que se espera del catálogo de T-16.
 * @property {string} id
 * @property {'perfil' | 'figuras'} seccion
 * @property {Record<string, string>} entrada Textos de los campos del perfil o de la figura.
 * @property {{ textoPrecio: string, textoAdicional: string }} [estimacion]
 * @property {boolean} [simulado] Caso práctico simulado (R-13.4).
 */

/** Las tres secciones de la interfaz (design §14.5; R-23.1). */
export const SECCIONES = Object.freeze(['perfil', 'figuras', 'estimacion']);

/** Campos editables de cada entrada (design §10). */
const CAMPOS = Object.freeze({
  perfil: Object.freeze(['textoFuncion', 'textoA', 'textoB', 'interpretacion']),
  figura: Object.freeze(['tipo', 'unidad', 'base', 'altura', 'radio']),
  estimacion: Object.freeze(['textoPrecio', 'textoAdicional'])
});

const NINGUNO = Object.freeze([]);

/** Congela un objeto nuevo con los cambios, sin tocar el original. */
const con = (objeto, cambios) => Object.freeze({ ...objeto, ...cambios });

/** Una parte del estado sin resultado ni errores. */
const sinResultado = (parte) => con(parte, { resultado: null, errores: NINGUNO });

/** La estimación sin fuente ni resultado; se conservan el precio y el adicional escritos. */
const sinEstimacion = (estimacion) => con(estimacion, { fuente: null, resultado: null, errores: NINGUNO });

/**
 * Estado inicial: sección «perfil», campos vacíos e interpretación abstracta (R-01.3).
 * @returns {Readonly<Estado>}
 */
export function estadoInicial() {
  return Object.freeze({
    seccion: 'perfil',
    perfil: Object.freeze({
      entrada: Object.freeze({ textoFuncion: '', textoA: '', textoB: '', interpretacion: 'abstracta' }),
      resultado: null,
      errores: NINGUNO
    }),
    figura: Object.freeze({
      entrada: Object.freeze({ tipo: 'rectangulo', unidad: 'm', base: '', altura: '', radio: '' }),
      resultado: null,
      errores: NINGUNO
    }),
    estimacion: Object.freeze({
      fuente: null,
      entrada: Object.freeze({ textoPrecio: '', textoAdicional: '' }),
      datosSimulados: false,
      resultado: null,
      errores: NINGUNO
    })
  });
}

function exigirCampo(parte, campo, valor) {
  if (!CAMPOS[parte].includes(campo)) throw new RangeError(`estado: campo desconocido «${String(campo)}» en ${parte}`);
  if (typeof valor !== 'string') throw new TypeError(`estado: el valor de «${campo}» debe ser un texto`);
}

/** Edita un campo de la entrada del perfil o de la figura y aplica la invalidación. */
function editar(estado, parte, campo, valor) {
  exigirCampo(parte, campo, valor);
  const actual = estado[parte];
  return con(estado, {
    [parte]: con(sinResultado(actual), { entrada: con(actual.entrada, { [campo]: valor }) }),
    estimacion: estado.estimacion.fuente === parte ? sinEstimacion(estado.estimacion) : estado.estimacion
  });
}

/** Guarda el Resultado de un caso de uso: el valor o los errores, nunca los dos (R-12.2). */
function guardar(estado, parte, resultado) {
  const nueva = resultado.ok
    ? con(estado[parte], { resultado: resultado.valor, errores: NINGUNO })
    : con(estado[parte], { resultado: null, errores: resultado.errores });
  return con(estado, {
    [parte]: nueva,
    estimacion: estado.estimacion.fuente === parte ? sinEstimacion(estado.estimacion) : estado.estimacion
  });
}

// ── Navegación ───────────────────────────────────────────────────────

/**
 * Cambia la sección visible; no toca los datos.
 * @param {Readonly<Estado>} estado
 * @param {Seccion} seccion
 * @returns {Readonly<Estado>}
 */
export function irASeccion(estado, seccion) {
  if (!SECCIONES.includes(seccion)) throw new RangeError(`estado: sección desconocida «${String(seccion)}»`);
  return estado.seccion === seccion ? estado : con(estado, { seccion });
}

// ── Perfil ───────────────────────────────────────────────────────────

/**
 * Edita un campo del perfil (textoFuncion, textoA, textoB o interpretacion) y retira el
 * resultado; si el perfil era la fuente, retira también la estimación (R-12.1).
 * @param {Readonly<Estado>} estado
 * @param {string} campo
 * @param {string} valor
 * @returns {Readonly<Estado>}
 */
export function editarPerfil(estado, campo, valor) {
  return editar(estado, 'perfil', campo, valor);
}

/**
 * Calcula el perfil con analizarPerfil. Si hay errores, el resultado anterior desaparece (R-12.2).
 * @param {Readonly<Estado>} estado
 * @returns {Readonly<Estado>}
 */
export function calcularPerfil(estado) {
  return guardar(estado, 'perfil', analizarPerfil(estado.perfil.entrada));
}

// ── Figura ───────────────────────────────────────────────────────────

/**
 * Edita un campo de la figura (tipo, unidad, base, altura o radio) y retira el resultado;
 * si la figura era la fuente, retira también la estimación (R-12.1).
 * @param {Readonly<Estado>} estado
 * @param {string} campo
 * @param {string} valor
 * @returns {Readonly<Estado>}
 */
export function editarFigura(estado, campo, valor) {
  return editar(estado, 'figura', campo, valor);
}

/** Entrada de calcularFigura: solo las dimensiones del tipo elegido. */
function entradaFigura({ tipo, unidad, base, altura, radio }) {
  return tipo === 'circulo' ? { tipo, unidad, radio } : { tipo, unidad, base, altura };
}

/**
 * Calcula la figura con calcularFigura. Si hay errores, el resultado anterior desaparece.
 * @param {Readonly<Estado>} estado
 * @returns {Readonly<Estado>}
 */
export function calcularFigura(estado) {
  return guardar(estado, 'figura', casoCalcularFigura(entradaFigura(estado.figura.entrada)));
}

// ── Estimación ───────────────────────────────────────────────────────

/**
 * true si el resultado vigente de esa fuente existe y es apto para estimar (R-16.1):
 * un perfil con aptitud.apta o cualquier figura calculada.
 * @param {Readonly<Estado>} estado
 * @param {Fuente} fuente
 */
export function aptoParaEstimar(estado, fuente) {
  if (fuente === 'perfil') return estado.perfil.resultado?.aptitud?.apta === true;
  if (fuente === 'figura') return estado.figura.resultado !== null;
  throw new RangeError(`estado: fuente desconocida «${String(fuente)}»`);
}

/**
 * Fija la fuente de la estimación y retira la estimación anterior. Si ese resultado no
 * existe o no es apto, no cambia nada: la interfaz muestra el botón deshabilitado con el
 * motivo de aptitud.error (design §14.5).
 * @param {Readonly<Estado>} estado
 * @param {Fuente} fuente
 * @returns {Readonly<Estado>}
 */
export function usarComoFuente(estado, fuente) {
  if (!aptoParaEstimar(estado, fuente)) return estado;
  return con(estado, { estimacion: con(sinEstimacion(estado.estimacion), { fuente }) });
}

/**
 * Edita el precio o el adicional y retira la estimación (R-12.1). Un valor escrito por el
 * usuario ya no es el del ejemplo simulado, así que retira también datosSimulados.
 * @param {Readonly<Estado>} estado
 * @param {'textoPrecio' | 'textoAdicional'} campo
 * @param {string} valor
 * @returns {Readonly<Estado>}
 */
export function editarEstimacion(estado, campo, valor) {
  exigirCampo('estimacion', campo, valor);
  const { estimacion } = estado;
  return con(estado, {
    estimacion: con(estimacion, {
      entrada: con(estimacion.entrada, { [campo]: valor }), datosSimulados: false, resultado: null, errores: NINGUNO
    })
  });
}

/**
 * Calcula la estimación con estimarMaterial desde el resultado vigente de la fuente.
 * Sin fuente, el caso de uso devuelve E-MOD-04 (R-17.6).
 * @param {Readonly<Estado>} estado
 * @returns {Readonly<Estado>}
 */
export function calcularEstimacion(estado) {
  const { estimacion } = estado;
  const fuente = estimacion.fuente === null ? null : { tipo: estimacion.fuente, resultado: estado[estimacion.fuente].resultado };
  const resultado = estimarMaterial({ fuente, ...estimacion.entrada, datosSimulados: estimacion.datosSimulados });
  return con(estado, {
    estimacion: resultado.ok
      ? con(estimacion, { resultado: resultado.valor, errores: NINGUNO })
      : con(estimacion, { resultado: null, errores: resultado.errores })
  });
}

// ── Ejemplos (R-13.2) ────────────────────────────────────────────────

/**
 * Carga un ejemplo del catálogo con el mismo recorrido que una entrada manual: copia sus
 * textos con editarPerfil o editarFigura (que retiran los resultados), copia el precio y el
 * adicional con editarEstimacion si los trae, y calcula. Solo se leen los campos de entrada
 * conocidos: cualquier otro dato del ejemplo, como un resultado, se ignora (R-13.3).
 * @param {Readonly<Estado>} estado
 * @param {string} id
 * @param {ReadonlyArray<Ejemplo>} catalogo Lo proporcionará ejemplos.js (T-16).
 * @returns {Readonly<Estado>}
 */
export function cargarEjemplo(estado, id, catalogo) {
  if (!Array.isArray(catalogo)) throw new TypeError('estado: cargarEjemplo espera el catálogo de ejemplos');
  const ejemplo = catalogo.find((e) => e?.id === id);
  if (ejemplo === undefined) throw new RangeError(`estado: ejemplo desconocido «${String(id)}»`);
  const parte = { perfil: 'perfil', figuras: 'figura' }[ejemplo.seccion];
  if (parte === undefined) throw new RangeError(`estado: el ejemplo «${id}» no indica una sección válida`);
  const editarParte = parte === 'perfil' ? editarPerfil : editarFigura;
  const inicial = estadoInicial()[parte].entrada;
  let nuevo = estado;
  // Un campo que el ejemplo no trae vuelve a su valor inicial, para no mezclarlo con lo escrito antes.
  for (const campo of CAMPOS[parte]) nuevo = editarParte(nuevo, campo, ejemplo.entrada?.[campo] ?? inicial[campo]);
  if (ejemplo.estimacion !== undefined) {
    for (const campo of CAMPOS.estimacion) nuevo = editarEstimacion(nuevo, campo, ejemplo.estimacion[campo]);
    nuevo = con(nuevo, { estimacion: con(nuevo.estimacion, { datosSimulados: ejemplo.simulado === true }) });
  }
  return parte === 'perfil' ? calcularPerfil(nuevo) : calcularFigura(nuevo);
}
