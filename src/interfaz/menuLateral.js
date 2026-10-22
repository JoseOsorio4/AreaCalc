// Menú lateral de ÁreaCalc (revisión visual de T-14; design.md §14.5; requirements R-23).
//
// Solo maneja la presentación del menú; la sección activa sigue saliendo del fragmento de
// la URL (navegacion.js), así que #perfil, #figuras, #estimacion y «Atrás» no cambian.
//   - Escritorio: el botón «Contraer menú» alterna entre la barra con iconos y nombres y una
//     franja de iconos (data-menu en .app). aria-expanded refleja el estado y la
//     preferencia se recuerda en localStorage si está disponible.
//   - Pantallas estrechas: el menú es un panel. El botón de menú lo abre (aria-expanded),
//     el resto de la página queda inerte, el foco entra al panel y vuelve al botón al
//     cerrar con Escape, con el botón de cierre o tocando el fondo.
import { enfocar, porId } from './vistaComun.js';

const CLAVE_PREFERENCIA = 'areacalc.menu';
const CONSULTA_ESTRECHA = '(max-width: 767px)';

/**
 * @param {{ documento: Document, ventana: Window }} opciones
 * @returns {{ cerrarPanel: () => void }}
 */
export function iniciarMenuLateral({ documento, ventana }) {
  const app = documento.querySelector('.app');
  if (app === null) throw new Error('menuLateral: falta el contenedor .app en index.html');
  const lateral = porId(documento, 'menu-lateral');
  const alternar = porId(documento, 'menu-contraer');
  const textoAlternar = alternar.querySelector('.lateral__alternar-texto');
  const abrir = porId(documento, 'menu-abrir');
  const cerrar = porId(documento, 'menu-cerrar');
  const velo = porId(documento, 'menu-velo');
  // Lo que queda inerte mientras el panel está abierto: así el Tab no sale del panel.
  const resto = ['.principal', '.barra-movil', '.saltar'].map((selector) => documento.querySelector(selector)).filter(Boolean);
  const estrecha = ventana.matchMedia(CONSULTA_ESTRECHA);

  // ── Escritorio: expandir o contraer ──
  function fijarContraido(contraido, guardar) {
    app.dataset.menu = contraido ? 'contraido' : 'expandido';
    alternar.setAttribute('aria-expanded', String(!contraido));
    textoAlternar.textContent = contraido ? 'Expandir menú' : 'Contraer menú';
    if (guardar) {
      try {
        ventana.localStorage.setItem(CLAVE_PREFERENCIA, app.dataset.menu);
      } catch {
        // Sin almacenamiento (modo privado o bloqueado): la preferencia dura la sesión.
      }
    }
  }

  let preferencia = null;
  try {
    preferencia = ventana.localStorage.getItem(CLAVE_PREFERENCIA);
  } catch {
    preferencia = null;
  }
  fijarContraido(preferencia === 'contraido', false);
  alternar.addEventListener('click', () => fijarContraido(app.dataset.menu !== 'contraido', true));

  // ── Pantallas estrechas: panel desplegable ──
  const abierto = () => app.dataset.panel === 'abierto';

  function abrirPanel() {
    app.dataset.panel = 'abierto';
    abrir.setAttribute('aria-expanded', 'true');
    velo.hidden = false;
    for (const elemento of resto) elemento.inert = true;
    const actual = lateral.querySelector('.lateral__enlace[aria-current="page"]') ?? lateral.querySelector('.lateral__enlace');
    // Tras un fotograma: el panel ya es visible y puede recibir el foco.
    ventana.requestAnimationFrame(() => actual?.focus());
  }

  function cerrarPanel(devolverFoco = true) {
    if (!abierto()) return;
    delete app.dataset.panel;
    abrir.setAttribute('aria-expanded', 'false');
    velo.hidden = true;
    for (const elemento of resto) elemento.inert = false;
    if (devolverFoco) abrir.focus();
  }

  abrir.addEventListener('click', () => (abierto() ? cerrarPanel() : abrirPanel()));
  cerrar.addEventListener('click', () => cerrarPanel());
  velo.addEventListener('click', () => cerrarPanel());
  documento.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && abierto()) {
      evento.preventDefault();
      cerrarPanel();
    }
  });

  // Elegir una sección en el panel lo cierra. Si cambia la sección, main.js lleva el foco a
  // su título al recibir «hashchange»; si es la misma, se lleva aquí.
  for (const enlace of lateral.querySelectorAll('.lateral__enlace[data-seccion]')) {
    enlace.addEventListener('click', () => {
      if (!abierto()) return;
      const misma = enlace.getAttribute('aria-current') === 'page';
      cerrarPanel(false);
      if (misma) enfocar(documento.querySelector(`#seccion-${enlace.dataset.seccion} .seccion__titulo`));
    });
  }

  // Al pasar a escritorio con el panel abierto, se cierra para no dejar la página inerte.
  estrecha.addEventListener('change', (evento) => {
    if (!evento.matches) cerrarPanel(false);
  });

  return { cerrarPanel };
}
