// Adaptador de la gráfica con Plotly (T-15; design.md §2, §13 y §14.3; requirements R-10).
//
// Recibe DatosGrafica ya preparados por presentacion/datosGrafica.js y solo los dibuja:
// no calcula áreas, ceros ni signos, y no importa el núcleo (design §2).
//
// Contrato que espera interfaz/vistaPerfil.js:
//   - dibujar(contenedor, datos) carga Plotly de forma diferida (import()), dibuja con
//     Plotly.react en un lienzo propio dentro del contenedor y devuelve una promesa que
//     NUNCA se rechaza: { estado: 'dibujada' | 'cancelada' | 'fallida', etapa?, aviso? }.
//   - limpiar(contenedor) invalida cualquier carga o dibujo pendiente, desconecta el
//     observador de tamaño, llama a Plotly.purge y retira lo que el adaptador añadió.
// Para main.js (T-17): precargar() y programarPrecarga(ventana) (design §13).
//
// Fallos (R-10.6): si Plotly no carga, si falla al dibujar o si los datos no son
// dibujables (null o con valores no finitos), el contenedor muestra W-07 y la promesa
// resuelve { estado: 'fallida', aviso: AVISO_W07 }. Los resultados y los pasos están
// fuera del contenedor y no se tocan. El detalle técnico va a console.error.
//
// Concurrencia: cada dibujo lleva una generación por contenedor. Si mientras Plotly
// carga o dibuja llega limpiar() u otro dibujar(), el dibujo anterior se cancela y, si
// llegó a pintar, se purga: una gráfica vieja no puede reaparecer con datos nuevos.
//
// Ancho: Plotly con `responsive: true` solo escucha el «resize» de la ventana. Al
// contraer o expandir el menú lateral cambia el ancho del contenido sin ese evento, así
// que un ResizeObserver sobre el contenedor pide Plotly.Plots.resize (como mucho una vez
// por fotograma). limpiar() y los fallos lo desconectan.

const MODULO_PLOTLY = 'plotly.js-basic-dist-min';

/**
 * W-07 del catálogo de requirements §10 (nucleo/errores.js). El adaptador no puede
 * importar el núcleo (design §2); la prueba comprueba que el texto coincide.
 */
export const AVISO_W07 = Object.freeze({
  codigo: 'W-07',
  mensaje: 'La gráfica no está disponible; los resultados y los pasos se conservan.'
});

/** Leyenda de las regiones (tasks T-15; R-10.2): el signo no depende solo del color. */
export const LEYENDA = Object.freeze({ positivo: 'Sobre el eje (+)', negativo: 'Bajo el eje (−)' });

/** Colores de app.css (contrastes anotados allí). Plotly necesita los valores, no variables CSS. */
const COLORES = Object.freeze({
  curva: '#0b1b36', // --marino
  texto: '#0f1d33', // --texto
  positivo: '#0f766e', // --area
  positivoRelleno: 'rgba(15, 118, 110, 0.26)',
  negativo: '#be123c',
  negativoRelleno: 'rgba(190, 18, 60, 0.14)',
  promedio: '#9a3412', // --promedio
  rectangulo: '#4338ca', // --integral
  rejilla: 'rgba(29, 78, 216, 0.14)',
  fondoTrazado: 'rgba(255, 255, 255, 0.82)'
});

const FUENTE = '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Roboto, Arial, sans-serif'; // --fuente-texto

/**
 * Altura del lienzo; el ancho es el del contenedor. En pantallas estrechas la leyenda
 * ocupa varias filas, así que el mínimo deja sitio al trazado (revisado a 360 px).
 */
const ALTO_LIENZO = 'clamp(340px, 44vw, 400px)';

/** Configuración de design §14.3, sin barra de herramientas ni avisos en inglés. */
const CONFIGURACION = Object.freeze({
  responsive: true,
  displaylogo: false,
  displayModeBar: false,
  showTips: false,
  scrollZoom: false,
  doubleClick: false
});

const CANCELADA = Object.freeze({ estado: 'cancelada' });
const DIBUJADA = Object.freeze({ estado: 'dibujada' });

// ── Traducción de DatosGrafica a Plotly (pura) ───────────────────────

/**
 * Trazas, diseño y configuración de Plotly para unos DatosGrafica (design §14.3).
 * Sin anotaciones «+» y «−» en los tramos: están pospuestas (T-D3).
 * @param {import('../presentacion/datosGrafica.js').DatosGrafica} datos
 * @returns {{ data: object[], layout: object, config: object }}
 */
export function figuraPlotly(datos) {
  // Copias: DatosGrafica llega congelado y Plotly guarda las trazas en el lienzo.
  const copia = (valores) => Array.from(valores);
  const data = [];
  const enLeyenda = new Set();
  for (const region of datos.regiones) {
    if (region.signo === 0) continue; // f ≡ 0: no hay región que sombrear
    const clave = region.signo > 0 ? 'positivo' : 'negativo';
    data.push({
      type: 'scatter',
      mode: 'lines',
      x: copia(region.x),
      y: copia(region.y),
      fill: 'tozeroy',
      fillcolor: COLORES[`${clave}Relleno`],
      ...(clave === 'negativo' ? { fillpattern: { shape: '/', fgcolor: COLORES.negativo, size: 9, solidity: 0.15 } } : {}),
      line: { color: COLORES[clave], width: 1 },
      name: LEYENDA[clave],
      legendgroup: clave,
      showlegend: !enLeyenda.has(clave),
      hoverinfo: 'skip'
    });
    enLeyenda.add(clave);
  }
  data.push({
    type: 'scatter',
    mode: 'lines',
    x: copia(datos.curva.x),
    y: copia(datos.curva.y),
    name: 'f(x)',
    line: { color: COLORES.curva, width: 2.5 },
    hoverinfo: 'skip'
  });
  if (datos.ceros.length > 0) {
    data.push({
      type: 'scatter',
      mode: 'markers',
      x: datos.ceros.map((cero) => cero.x),
      y: datos.ceros.map(() => 0),
      text: datos.ceros.map((cero) => cero.etiqueta),
      hovertemplate: '%{text}<extra></extra>',
      name: 'Ceros de f',
      cliponaxis: false,
      marker: { symbol: 'circle', size: 10, color: '#ffffff', line: { color: COLORES.curva, width: 2.5 } }
    });
  }

  const shapes = [{
    type: 'line',
    xref: 'paper',
    x0: 0,
    x1: 1,
    yref: 'y',
    y0: datos.promedio.y,
    y1: datos.promedio.y,
    line: { color: COLORES.promedio, width: 2, dash: 'dash' },
    label: { text: datos.promedio.etiqueta, textposition: 'end', yanchor: 'bottom', font: { color: COLORES.promedio, size: 12 } },
    name: datos.promedio.etiqueta,
    showlegend: true
  }];
  if (datos.rectangulo !== null) {
    shapes.push({
      type: 'rect',
      xref: 'x',
      yref: 'y',
      x0: datos.rectangulo.x0,
      x1: datos.rectangulo.x1,
      y0: 0,
      y1: datos.rectangulo.altura,
      line: { color: COLORES.rectangulo, width: 2, dash: 'dot' },
      fillcolor: 'rgba(0, 0, 0, 0)',
      layer: 'above',
      name: 'Rectángulo equivalente',
      showlegend: true
    });
  }

  const eje = (titulo, rango) => ({
    title: { text: titulo, standoff: 8 },
    range: [...rango],
    fixedrange: true,
    automargin: true,
    gridcolor: COLORES.rejilla,
    linecolor: COLORES.curva,
    zeroline: true,
    zerolinecolor: COLORES.curva,
    zerolinewidth: 1.5,
    ticks: 'outside',
    tickcolor: COLORES.rejilla
  });

  const layout = {
    autosize: true,
    margin: { l: 56, r: 16, t: 8, b: 48 },
    paper_bgcolor: 'rgba(0, 0, 0, 0)',
    plot_bgcolor: COLORES.fondoTrazado,
    font: { family: FUENTE, size: 13, color: COLORES.texto },
    showlegend: true,
    legend: {
      orientation: 'h', x: 0, xanchor: 'left', y: 1.02, yanchor: 'bottom',
      bgcolor: 'rgba(255, 255, 255, 0.9)', font: { size: 12 }, itemwidth: 24
    },
    hovermode: 'closest',
    dragmode: false,
    xaxis: eje(datos.ejes.etiquetaX, datos.rango.x),
    yaxis: eje(datos.ejes.etiquetaY, datos.rango.y),
    shapes
  };

  return { data, layout, config: { ...CONFIGURACION } };
}

/** Comprueba la forma de DatosGrafica y que todo lo que se dibuja sea finito (design §14.3). */
export function sonDibujables(datos) {
  if (datos === null || typeof datos !== 'object') return false;
  const finitos = (valores) => Array.isArray(valores) && valores.every(Number.isFinite);
  const serie = (s) => s != null && finitos(s.x) && finitos(s.y) && s.x.length === s.y.length && s.x.length > 1;
  const rango = (r) => finitos(r) && r.length === 2 && r[0] < r[1];
  const texto = (t) => typeof t === 'string';
  const { curva, regiones, ceros, promedio, rectangulo, ejes, rango: rangos } = datos;
  return serie(curva)
    && Array.isArray(regiones) && regiones.every((region) => serie(region) && [1, -1, 0].includes(region.signo))
    && Array.isArray(ceros) && ceros.every((cero) => Number.isFinite(cero?.x) && texto(cero.etiqueta))
    && promedio != null && Number.isFinite(promedio.y) && texto(promedio.etiqueta)
    && (rectangulo === null || (rectangulo != null && finitos([rectangulo.x0, rectangulo.x1, rectangulo.altura])))
    && ejes != null && texto(ejes.etiquetaX) && texto(ejes.etiquetaY)
    && rangos != null && rango(rangos.x) && rango(rangos.y);
}

// ── Adaptador con estado (carga, dibujo, limpieza y tamaño) ──────────

/** ResizeObserver del navegador; null si no existe (queda el «resize» de Plotly). */
function observadorPredeterminado(alCambiar) {
  return typeof globalThis.ResizeObserver === 'function' ? new globalThis.ResizeObserver(alCambiar) : null;
}

/** Ejecuta la tarea en el próximo fotograma y devuelve cómo cancelarla. */
function programarPredeterminado(tarea) {
  if (typeof globalThis.requestAnimationFrame === 'function') {
    const id = globalThis.requestAnimationFrame(tarea);
    return () => globalThis.cancelAnimationFrame(id);
  }
  const id = globalThis.setTimeout(tarea, 16);
  return () => globalThis.clearTimeout(id);
}

const informarPredeterminado = (mensaje, error) => console.error(mensaje, error);

/**
 * Crea un adaptador independiente. El módulo exporta uno ya creado (dibujar, limpiar,
 * precargar, programarPrecarga); las pruebas crean otros con dependencias simuladas.
 * @param {{
 *   cargarModulo?: () => Promise<unknown>,
 *   crearObservador?: (alCambiar: (entradas: ReadonlyArray<{ contentRect: { width: number, height: number } }>) => void)
 *     => ({ observe: (elemento: object) => void, disconnect: () => void } | null),
 *   programar?: (tarea: () => void) => () => void,
 *   informar?: (mensaje: string, error: unknown) => void
 * }} [dependencias]
 */
export function crearGraficaPlotly({
  cargarModulo = () => import('plotly.js-basic-dist-min'),
  crearObservador = observadorPredeterminado,
  programar = programarPredeterminado,
  informar = informarPredeterminado
} = {}) {
  /** @type {Promise<object> | null} */
  let carga = null;
  /** Plotly ya cargado, para purgar de forma síncrona en limpiar(). */
  let plotly = null;
  /** contenedor → { generacion, lienzo, aviso, observador, cancelarMarco, tamano } */
  const registros = new WeakMap();

  function cargar() {
    if (carga === null) {
      carga = Promise.resolve()
        .then(cargarModulo)
        .then((modulo) => {
          const api = modulo?.default ?? modulo;
          if (typeof api?.react !== 'function' || typeof api?.purge !== 'function') {
            throw new TypeError(`graficaPlotly: «${MODULO_PLOTLY}» no expone Plotly.react y Plotly.purge`);
          }
          plotly = api;
          return api;
        });
      // Si falla, el próximo dibujo vuelve a intentarlo. Quien espera la carga atiende el rechazo.
      carga.catch(() => {
        carga = null;
      });
    }
    return carga;
  }

  /**
   * Carga Plotly sin dibujar, para que el primer cálculo no espere (design §13).
   * @returns {Promise<boolean>} true si cargó; nunca se rechaza.
   */
  function precargar() {
    return cargar().then(() => true, (error) => {
      informar('graficaPlotly: no se pudo precargar Plotly; al dibujar se mostrará W-07.', error);
      return false;
    });
  }

  /**
   * Precarga cuando la página termina de cargar y el navegador está libre (T-17, main.js).
   * @param {{ document?: { readyState?: string }, addEventListener: Function, removeEventListener: Function,
   *   requestIdleCallback?: Function, cancelIdleCallback?: Function, setTimeout: Function, clearTimeout: Function }} ventana
   * @returns {() => void} Cancela la precarga si todavía no empezó.
   */
  function programarPrecarga(ventana) {
    let cancelar = () => {};
    const lanzar = () => {
      cancelar = () => {};
      void precargar();
    };
    const enReposo = () => {
      if (typeof ventana.requestIdleCallback === 'function') {
        const id = ventana.requestIdleCallback(lanzar, { timeout: 2000 });
        cancelar = () => ventana.cancelIdleCallback?.(id);
      } else {
        const id = ventana.setTimeout(lanzar, 0);
        cancelar = () => ventana.clearTimeout(id);
      }
    };
    if (ventana.document?.readyState === 'complete') {
      enReposo();
    } else {
      ventana.addEventListener('load', enReposo, { once: true });
      cancelar = () => ventana.removeEventListener('load', enReposo);
    }
    return () => cancelar();
  }

  function registroDe(contenedor) {
    let registro = registros.get(contenedor);
    if (registro === undefined) {
      registro = { generacion: 0, lienzo: null, aviso: null, observador: null, cancelarMarco: null, tamano: null };
      registros.set(contenedor, registro);
    }
    return registro;
  }

  function purgar(lienzo) {
    if (plotly === null) return;
    try {
      plotly.purge(lienzo);
    } catch (error) {
      informar('graficaPlotly: Plotly.purge falló.', error);
    }
  }

  function liberarObservador(registro) {
    registro.observador?.disconnect();
    registro.observador = null;
    registro.cancelarMarco?.();
    registro.cancelarMarco = null;
    registro.tamano = null;
  }

  function retirarLienzo(registro) {
    if (registro.lienzo === null) return;
    purgar(registro.lienzo);
    registro.lienzo.remove();
    registro.lienzo = null;
  }

  function retirarAviso(registro) {
    registro.aviso?.remove();
    registro.aviso = null;
  }

  /** Aviso dentro del contenedor, con las clases que ya define app.css (.grafica__aviso). */
  function mostrarAviso(contenedor, registro, { titulo, texto, codigo = null, rol = null }) {
    retirarAviso(registro);
    const documento = contenedor.ownerDocument;
    const aviso = elemento(documento, 'div', rol === null ? { class: 'grafica__aviso' } : { class: 'grafica__aviso', role: rol });
    const cuerpo = elemento(documento, 'p', {});
    if (codigo !== null) cuerpo.append(elemento(documento, 'span', { class: 'aviso__codigo' }, codigo), ': ');
    cuerpo.append(texto);
    aviso.append(elemento(documento, 'p', { class: 'grafica__aviso-titulo' }, titulo), cuerpo);
    contenedor.append(aviso);
    registro.aviso = aviso;
  }

  function fallar(contenedor, registro, etapa, error) {
    informar(`graficaPlotly: ${AVISO_W07.codigo} (${etapa}).`, error);
    liberarObservador(registro);
    retirarLienzo(registro);
    contenedor.removeAttribute('aria-busy');
    mostrarAviso(contenedor, registro, {
      titulo: 'Gráfica no disponible', texto: AVISO_W07.mensaje, codigo: AVISO_W07.codigo, rol: 'status'
    });
    return Object.freeze({ estado: 'fallida', etapa, aviso: AVISO_W07 });
  }

  /** Observa el ancho y el alto del contenedor y ajusta Plotly una vez por fotograma. */
  function observar(contenedor, registro, api) {
    const ajustar = api.Plots?.resize;
    if (typeof ajustar !== 'function') return;
    const observador = crearObservador((entradas) => {
      const ultima = entradas[entradas.length - 1];
      if (ultima === undefined) return;
      const { width, height } = ultima.contentRect;
      if (width === 0 || height === 0) return; // sección oculta: se ajusta al volver a verse
      const anterior = registro.tamano;
      registro.tamano = { width, height };
      // La primera notificación es la medida inicial: Plotly ya dibujó con ese tamaño.
      if (anterior === null || (anterior.width === width && anterior.height === height)) return;
      if (registro.cancelarMarco !== null) return;
      registro.cancelarMarco = programar(() => {
        registro.cancelarMarco = null;
        if (registros.get(contenedor) !== registro || registro.lienzo === null) return;
        // Plots.resize se rechaza si el lienzo deja de verse; la gráfica sigue dibujada.
        Promise.resolve().then(() => ajustar(registro.lienzo)).catch(() => {});
      });
    });
    if (observador === null) return;
    registro.observador = observador;
    observador.observe(contenedor);
  }

  async function dibujarSinProteger(contenedor, datos) {
    const registro = registroDe(contenedor);
    const generacion = ++registro.generacion;
    const vigente = () => registros.get(contenedor) === registro && registro.generacion === generacion;
    liberarObservador(registro);

    if (!sonDibujables(datos)) {
      return fallar(contenedor, registro, 'datos', new TypeError('graficaPlotly: los datos no se pueden dibujar'));
    }
    const figura = figuraPlotly(datos);

    if (registro.lienzo === null) {
      mostrarAviso(contenedor, registro, { titulo: 'Preparando la gráfica…', texto: 'Los resultados no dependen de ella.' });
    }
    contenedor.setAttribute('aria-busy', 'true');

    let api;
    try {
      api = await cargar();
    } catch (error) {
      return vigente() ? fallar(contenedor, registro, 'carga', error) : CANCELADA;
    }
    if (!vigente()) return CANCELADA;

    let lienzo = registro.lienzo;
    if (lienzo === null) {
      lienzo = crearLienzo(contenedor.ownerDocument);
      registro.lienzo = lienzo;
    }
    retirarAviso(registro);
    if (lienzo.parentNode !== contenedor) contenedor.append(lienzo);
    lienzo.setAttribute('aria-label', datos.descripcion ?? 'Gráfica de f(x) en [a, b].');

    try {
      await api.react(lienzo, figura.data, figura.layout, figura.config);
    } catch (error) {
      if (vigente()) return fallar(contenedor, registro, 'dibujo', error);
      if (registro.lienzo !== lienzo) purgarHuerfano(lienzo);
      return CANCELADA;
    }
    if (!vigente()) {
      // limpiar() llegó mientras Plotly dibujaba: este lienzo ya no es de nadie.
      if (registro.lienzo !== lienzo) purgarHuerfano(lienzo);
      return CANCELADA;
    }
    contenedor.removeAttribute('aria-busy');
    observar(contenedor, registro, api);
    return DIBUJADA;
  }

  function purgarHuerfano(lienzo) {
    purgar(lienzo);
    lienzo.remove();
  }

  /**
   * Dibuja los datos en el contenedor (design §14.3). Nunca se rechaza.
   * @param {HTMLElement} contenedor
   * @param {import('../presentacion/datosGrafica.js').DatosGrafica | null} datos
   * @returns {Promise<Readonly<{ estado: 'dibujada' | 'cancelada' | 'fallida', etapa?: string, aviso?: typeof AVISO_W07 }>>}
   */
  function dibujar(contenedor, datos) {
    return dibujarSinProteger(contenedor, datos).catch((error) => {
      informar('graficaPlotly: fallo inesperado al dibujar.', error);
      return Object.freeze({ estado: 'fallida', etapa: 'interna', aviso: AVISO_W07 });
    });
  }

  /**
   * Retira la gráfica y cancela lo pendiente (design §12: al retirar un resultado).
   * Nunca lanza.
   * @param {HTMLElement} contenedor
   */
  function limpiar(contenedor) {
    try {
      const registro = registros.get(contenedor);
      if (registro === undefined) return;
      registros.delete(contenedor);
      registro.generacion += 1;
      liberarObservador(registro);
      retirarLienzo(registro);
      retirarAviso(registro);
      contenedor.removeAttribute('aria-busy');
    } catch (error) {
      informar('graficaPlotly: fallo inesperado al limpiar.', error);
    }
  }

  return Object.freeze({ dibujar, limpiar, precargar, programarPrecarga });
}

/** Lienzo de Plotly: role="img" y aria-label con el resumen de datosGrafica (R-23). */
function crearLienzo(documento) {
  const lienzo = elemento(documento, 'div', { class: 'grafica__lienzo', role: 'img' });
  lienzo.style.width = '100%';
  lienzo.style.minWidth = '0';
  lienzo.style.height = ALTO_LIENZO;
  return lienzo;
}

/** Elemento con atributos y texto, sin interpretar HTML. */
function elemento(documento, etiqueta, atributos, texto) {
  const nodo = documento.createElement(etiqueta);
  for (const [nombre, valor] of Object.entries(atributos)) nodo.setAttribute(nombre, valor);
  if (texto !== undefined) nodo.textContent = texto;
  return nodo;
}

// ── Adaptador de la aplicación ───────────────────────────────────────

const adaptador = crearGraficaPlotly();

/** Dibuja DatosGrafica en el contenedor; nunca se rechaza (W-07 si falla). */
export const dibujar = adaptador.dibujar;
/** Retira la gráfica del contenedor y cancela lo pendiente. */
export const limpiar = adaptador.limpiar;
/** Carga Plotly sin dibujar. */
export const precargar = adaptador.precargar;
/** Precarga al terminar de cargar la página (T-17). */
export const programarPrecarga = adaptador.programarPrecarga;
