// Punto de entrada de ÁreaCalc (design.md §3 y §12; T-14 e integración de T-17).
//
// Une el estado de T-13 con las vistas: hay un solo estado en memoria (R-12.3); cada
// acción de la interfaz es una transición pura de estado.js que `despachar` aplica antes
// de volver a pintar. La interfaz no calcula: las transiciones llaman a los casos de uso,
// que ya traen los pasos (T-12) y los datos de la gráfica (T-15).
//
// Integración (T-17):
//   - catálogo de ejemplos (ejemplos.js, T-16) para los selectores de Perfil y Figuras;
//   - adaptador de la gráfica (graficaPlotly.js, T-15) para la vista del perfil, con su
//     precarga diferida al terminar de cargar la página (design §13);
//   - mejora de fórmulas con KaTeX (formulasKatex.js, T-16) tras cada pintado, sin
//     esperarla: primero se ve el texto (R-09.8). Solo se procesan las fórmulas nuevas.
//     Cada sección muestra un solo W-08 mientras alguna de sus fórmulas visibles quedó
//     como texto, y lo retira cuando ya no hay ninguna (al editar o al recuperarse).
import * as formulas from './adaptadores/formulasKatex.js';
import * as graficaPlotly from './adaptadores/graficaPlotly.js';
import { EJEMPLOS } from './ejemplos/ejemplos.js';
import { estadoInicial, irASeccion } from './interfaz/estado.js';
import { iniciarNavegacion } from './interfaz/navegacion.js';
import { iniciarMenuLateral } from './interfaz/menuLateral.js';
import { avisoAdvertencia, enfocar, mostrarSeccion, porId } from './interfaz/vistaComun.js';
import { crearVistaEstimacion } from './interfaz/vistaEstimacion.js';
import { crearVistaFiguras } from './interfaz/vistaFiguras.js';
import { crearVistaPerfil } from './interfaz/vistaPerfil.js';

const documento = document;
const ventana = window;

let estado = estadoInicial();

/**
 * Aplica una transición de estado.js, vuelve a pintar y devuelve el estado nuevo.
 * @param {(estado: object, ...argumentos: unknown[]) => object} transicion
 * @param {...unknown} argumentos
 */
function despachar(transicion, ...argumentos) {
  estado = transicion(estado, ...argumentos);
  pintar();
  return estado;
}

const vistas = [
  crearVistaPerfil({ documento, ventana, despachar, catalogo: EJEMPLOS, grafica: graficaPlotly }),
  crearVistaFiguras({ documento, ventana, despachar, catalogo: EJEMPLOS }),
  crearVistaEstimacion({ documento, despachar })
];

/** Secciones con fórmulas y el contenedor de su aviso W-08 (index.html). */
const FORMULAS = ['perfil', 'figura', 'estimacion'].map((prefijo) => Object.freeze({
  seccion: porId(documento, `seccion-${prefijo === 'figura' ? 'figuras' : prefijo}`),
  aviso: porId(documento, `${prefijo}-aviso-formulas`)
}));

/**
 * W-08 de una sección según lo que se ve ahora: si alguna fórmula visible quedó como
 * texto (data-katex="fallida"), un solo aviso; si no, ninguno. Como se decide con el DOM
 * actual, una mejora antigua no puede dejar un aviso sobre un resultado nuevo o retirado.
 */
function sincronizarAvisoFormulas({ seccion, aviso }) {
  const hayTexto = seccion.querySelector('[data-latex][data-katex="fallida"]') !== null;
  const mostrado = aviso.firstElementChild !== null;
  if (hayTexto === mostrado) return;
  aviso.replaceChildren(...(hayTexto ? [avisoAdvertencia(documento, formulas.AVISO_W08, 'p')] : []));
}

/** Mejora con KaTeX las fórmulas nuevas de cada sección; no se espera (R-09.8). */
function mejorarFormulas() {
  for (const region of FORMULAS) {
    sincronizarAvisoFormulas(region);
    if (region.seccion.querySelector('[data-latex]:not([data-katex])') === null) continue;
    void formulas.mejorarDentro(region.seccion).then(() => sincronizarAvisoFormulas(region));
  }
}

function pintar() {
  mostrarSeccion(documento, estado.seccion);
  for (const vista of vistas) vista.render(estado);
  mejorarFormulas();
}

pintar();

// Plotly se carga cuando la página terminó de cargar y el navegador está libre, para que
// el primer cálculo no espere la descarga (design §13). Si falla, al dibujar se ve W-07.
graficaPlotly.programarPrecarga(ventana);

// Menú lateral (contraer en escritorio, panel en pantallas estrechas); no toca el estado.
iniciarMenuLateral({ documento, ventana });

// «Saltar al contenido» lleva el foco a <main> sin cambiar el fragmento: un fragmento que
// no es una sección haría volver a «Perfil» (navegacion.seccionDesdeFragmento).
for (const enlace of documento.querySelectorAll('a.saltar')) {
  enlace.addEventListener('click', (evento) => {
    evento.preventDefault();
    enfocar(documento.getElementById('contenido'));
  });
}

// La sección sale del fragmento de la URL; «Atrás» y «Adelante» funcionan sin código extra.
// Al cambiar de sección (no al cargar la página), el foco va al título de la nueva sección.
let cargaInicial = true;
iniciarNavegacion(ventana, (seccion) => {
  const cambia = seccion !== estado.seccion;
  despachar(irASeccion, seccion);
  if (cambia && !cargaInicial) enfocar(documento.querySelector(`#seccion-${seccion} .seccion__titulo`));
  cargaInicial = false;
});
