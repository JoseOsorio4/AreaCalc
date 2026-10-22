// Punto de entrada de ÁreaCalc (design.md §3 y §12; T-14).
//
// Une el estado de T-13 con las vistas: hay un solo estado en memoria (R-12.3); cada
// acción de la interfaz es una transición pura de estado.js que `despachar` aplica antes
// de volver a pintar. La interfaz no calcula: las transiciones llaman a los casos de uso.
//
// Pendiente de T-17 (no se simula aquí):
//   - catálogo de ejemplos de src/ejemplos/ejemplos.js (T-16), hoy vacío;
//   - adaptador de la gráfica (graficaPlotly.js, T-15) y su precarga diferida;
//   - mejora de fórmulas con KaTeX (formulasKatex.js, T-16) sobre los elementos con data-latex;
//   - conexión de pasos y gráfica a los casos de uso.
import { estadoInicial, irASeccion } from './interfaz/estado.js';
import { iniciarNavegacion } from './interfaz/navegacion.js';
import { iniciarMenuLateral } from './interfaz/menuLateral.js';
import { enfocar, mostrarSeccion } from './interfaz/vistaComun.js';
import { crearVistaEstimacion } from './interfaz/vistaEstimacion.js';
import { crearVistaFiguras } from './interfaz/vistaFiguras.js';
import { crearVistaPerfil } from './interfaz/vistaPerfil.js';

const documento = document;
const ventana = window;

/** Catálogo de ejemplos: lo proporcionará ejemplos.js en T-16. */
const CATALOGO_EJEMPLOS = Object.freeze([]);

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
  crearVistaPerfil({ documento, ventana, despachar, catalogo: CATALOGO_EJEMPLOS }),
  crearVistaFiguras({ documento, ventana, despachar }),
  crearVistaEstimacion({ documento, despachar })
];

function pintar() {
  mostrarSeccion(documento, estado.seccion);
  for (const vista of vistas) vista.render(estado);
}

pintar();

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
