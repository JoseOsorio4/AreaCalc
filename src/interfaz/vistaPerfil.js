// Vista del analizador de perfiles (T-14 y su revisión visual; design.md §14.5; requirements R-01, R-11, R-15 y R-23).
//
// La vista no calcula: lee el estado de T-13, despacha transiciones (editarPerfil,
// calcularPerfil, usarComoFuente, cargarEjemplo) y escribe el ResultadoPerfil vigente
// con presentacion/formato.js. Todo lo que muestra sale de ese resultado; si no hay
// resultado, muestra un estado vacío sin cifras.
//
// Composición: formulario a la izquierda; a la derecha, el resumen de resultados
// (#perfil-resultados, aria-live), la gráfica (#perfil-grafica, fija en index.html) y
// los detalles (#perfil-detalles: procedimiento desplegable y acceso a la estimación).
//
// Integración (T-17):
//   - resultado.pasos ({ area, promedio }) viene de analizarPerfil (pasosPerfil, T-12).
//   - resultado.grafica viene de analizarPerfil (datosGrafica, T-15) y la dibuja el
//     adaptador `grafica` ({ dibujar, limpiar } de adaptadores/graficaPlotly.js). Si es
//     null, la figura muestra el W-07 que trae el resultado; sin resultado, un estado vacío.
//     Primero se pintan los resultados y los pasos; el adaptador cede un fotograma antes
//     de dibujar, así que la gráfica no los retrasa.
//   - El selector de ejemplos se llena con el catálogo de ejemplos.js (T-16); debajo se
//     ve el origen del ejemplo elegido y si sus datos son simulados (R-13.1 y R-13.4).
//     Vuelve a «Elija un ejemplo…» en cuanto la entrada deja de coincidir con el ejemplo.
//   - Los textos con `data-latex` los mejora formulasKatex desde main.js, tras pintar.
import { calcularPerfil, cargarEjemplo, editarPerfil, usarComoFuente } from './estado.js';
import { irA } from './navegacion.js';
import { aDecimal, cantidadTexto, fraccionTexto } from '../presentacion/formato.js';
import {
  avisoAdvertencia, cifra, crear, enfocar, estadoVacio, fijarValor, listaAdvertencias, listaPasos, mostrarErrores,
  porId, prepararEjemplos, sincronizarEjemplo, textoError, tituloResumen
} from './vistaComun.js';

/** Dónde se muestra cada `error.campo` del perfil. E-INT-01/02 se explican bajo b y marcan a y b. */
const CAMPOS = Object.freeze({
  funcion: Object.freeze({ controles: Object.freeze(['perfil-funcion']), mensaje: 'perfil-funcion-error' }),
  a: Object.freeze({ controles: Object.freeze(['perfil-a']), mensaje: 'perfil-a-error' }),
  b: Object.freeze({ controles: Object.freeze(['perfil-b']), mensaje: 'perfil-b-error' }),
  intervalo: Object.freeze({ controles: Object.freeze(['perfil-a', 'perfil-b']), mensaje: 'perfil-b-error' })
});

const ID_TITULO = 'perfil-resultados-titulo';
const ID_MOTIVO = 'perfil-aptitud-motivo';
const SVG = 'http://www.w3.org/2000/svg';

const exacta = (valor) => ({ clase: 'exacta', valor });

/**
 * @param {{
 *   documento: Document,
 *   ventana: object,
 *   despachar: (transicion: Function, ...argumentos: unknown[]) => object,
 *   catalogo?: ReadonlyArray<import('./estado.js').Ejemplo>,
 *   grafica?: { dibujar: (contenedor: HTMLElement, datos: object) => unknown, limpiar: (contenedor: HTMLElement) => void }
 * }} opciones
 * @returns {{ render: (estado: object) => void }}
 */
export function crearVistaPerfil({ documento, ventana, despachar, catalogo = [], grafica = null }) {
  const formulario = porId(documento, 'perfil-formulario');
  const funcion = porId(documento, 'perfil-funcion');
  const a = porId(documento, 'perfil-a');
  const b = porId(documento, 'perfil-b');
  const radios = [...formulario.querySelectorAll('input[name="interpretacion"]')];
  const unidades = [...documento.querySelectorAll('[data-unidad-perfil]')];
  const resumen = porId(documento, 'perfil-errores');
  const resultados = porId(documento, 'perfil-resultados');
  const figura = porId(documento, 'perfil-grafica');
  const detalles = porId(documento, 'perfil-detalles');
  const selectorEjemplo = porId(documento, 'perfil-ejemplo');
  const origenEjemplo = porId(documento, 'perfil-ejemplo-origen');
  const ejemplos = catalogo.filter((ejemplo) => ejemplo?.seccion === 'perfil');

  // Edición: cada cambio pasa por el estado, que retira el resultado anterior (R-12.1).
  for (const control of [funcion, a, b]) {
    control.addEventListener('input', () => despachar(editarPerfil, control.name, control.value));
  }
  for (const radio of radios) {
    radio.addEventListener('change', () => {
      if (radio.checked) despachar(editarPerfil, 'interpretacion', radio.value);
    });
  }

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const estado = despachar(calcularPerfil);
    // Tras calcular, el foco va al encabezado de los resultados; si hay errores, al resumen.
    if (estado.perfil.resultado !== null) enfocar(porId(documento, ID_TITULO));
    else enfocar(tituloResumen(resumen));
  });

  if (ejemplos.length > 0) {
    prepararEjemplos(documento, {
      contenedor: porId(documento, 'perfil-ejemplos'),
      selector: selectorEjemplo,
      ejemplos,
      alElegir: (id) => {
        const estado = despachar(cargarEjemplo, id, catalogo);
        if (estado.perfil.resultado !== null) enfocar(porId(documento, ID_TITULO));
      }
    });
  }

  let ultimo = { resultado: undefined, errores: undefined };

  return {
    render(estado) {
      const { entrada, resultado, errores } = estado.perfil;
      fijarValor(funcion, entrada.textoFuncion);
      fijarValor(a, entrada.textoA);
      fijarValor(b, entrada.textoB);
      for (const radio of radios) radio.checked = radio.value === entrada.interpretacion;
      const unidad = entrada.interpretacion === 'fisica' ? '(m)' : '(u)';
      for (const elemento of unidades) elemento.textContent = unidad;
      sincronizarEjemplo(selectorEjemplo, ejemplos, entrada, origenEjemplo);

      // El estado es inmutable: si el resultado y los errores no cambiaron, no se redibuja.
      if (ultimo.resultado === resultado && ultimo.errores === errores) return;
      const cambioResultado = ultimo.resultado !== resultado;
      ultimo = { resultado, errores };
      mostrarErrores(documento, { campos: CAMPOS, resumen, errores });
      resultados.replaceChildren(resultado === null ? vacio(documento, errores) : tarjetaResumen(documento, resultado));
      if (cambioResultado) {
        // Resultados y pasos primero; la gráfica se dibuja después (no los retrasa).
        detalles.replaceChildren(...(resultado === null
          ? []
          : [desplegablePasos(documento, resultado), bandaEstimacion(documento, resultado, ventana, despachar)]));
        pintarGrafica(documento, figura, resultado, grafica, errores);
      } else if (resultado === null) {
        // Solo cambiaron los errores: el estado vacío de la gráfica cambia de texto.
        pintarGrafica(documento, figura, resultado, grafica, errores);
      }
    }
  };
}

function vacio(documento, errores) {
  if (errores.length > 0) {
    return estadoVacio(documento, {
      idTitulo: ID_TITULO,
      titulo: 'Sin resultados',
      texto: 'Corrija los datos marcados y pulse «Calcular». No se muestran resultados de un cálculo anterior.'
    });
  }
  return estadoVacio(documento, {
    idTitulo: ID_TITULO,
    titulo: 'Todavía no hay resultados',
    texto: 'Elija la interpretación, escriba f(x) y los límites a y b, y pulse «Calcular». '
      + 'Verá la integral con signo, el área geométrica y el valor promedio.'
  });
}

// ── Resumen de resultados ────────────────────────────────────────────

function tarjetaResumen(documento, resultado) {
  const { modelo, intervalo, unidades, integral, analisis, area, promedio } = resultado;
  const distintos = !area.igualAI;
  const supuesto = unidades.estimable
    ? 'Perfil físico: x y f(x) en metros'
    : 'Ejercicio abstracto: unidades u y u²';

  return crear(documento, 'section', { clase: 'tarjeta resumen-perfil', 'aria-labelledby': ID_TITULO },
    crear(documento, 'div', { clase: 'resumen-perfil__cabecera' },
      crear(documento, 'h2', { clase: 'tarjeta__titulo', id: ID_TITULO, texto: 'Resultados' }),
      crear(documento, 'p', {
        clase: 'modelo__funcion', 'data-latex': `f(x) = ${modelo.latexNormalizado}`,
        texto: `f(x) = ${modelo.textoNormalizado}`
      })),
    crear(documento, 'ul', { clase: 'etiquetas', 'aria-label': 'Datos del cálculo' },
      crear(documento, 'li', {
        clase: 'etiqueta-dato', texto: `Intervalo [${fraccionTexto(intervalo.a)}, ${fraccionTexto(intervalo.b)}]`
      }),
      crear(documento, 'li', { clase: 'etiqueta-dato', texto: supuesto }),
      modelo.huboDesarrollo ? crear(documento, 'li', { clase: 'etiqueta-dato', texto: 'Desarrollado a forma estándar' }) : null),
    crear(documento, 'div', { clase: 'valores' },
      valor(documento, {
        variante: 'integral', nombre: 'Integral con signo', simbolo: 'I',
        cantidad: exacta(integral.I), unidad: unidades.area,
        distintivo: distintos ? 'Distinta de A_geo' : null,
        nota: 'Suma con signo: lo que queda bajo el eje resta.'
      }),
      valor(documento, {
        variante: 'area', nombre: 'Área geométrica', simbolo: 'A_geo',
        cantidad: area.area, unidad: unidades.area,
        distintivo: distintos ? 'Distinta de I' : null,
        nota: distintos
          ? 'Suma de |Iₖ| por tramos: no coincide con I porque f toma valores negativos en [a, b].'
          : 'f ≥ 0 en [a, b], así que coincide con I.'
      }),
      valor(documento, {
        variante: 'promedio', nombre: 'Valor promedio', simbolo: 'f_prom',
        cantidad: exacta(promedio.fProm), unidad: unidades.y,
        distintivo: null,
        nota: `f_prom = I / (b − a), con b − a = ${cantidadTexto(exacta(promedio.longitud), unidades.x)}.`
      })),
    notas(documento, analisis, resultado),
    listaAdvertencias(documento, resultado.advertencias));
}

function valor(documento, { variante, nombre, simbolo, cantidad, unidad, distintivo, nota }) {
  return crear(documento, 'div', { clase: `valor valor--${variante}` },
    crear(documento, 'p', { clase: 'valor__nombre' }, `${nombre} `,
      crear(documento, 'span', { clase: 'valor__simbolo', texto: simbolo })),
    cifra(documento, cantidad, unidad),
    distintivo === null ? null : crear(documento, 'p', { clase: 'distintivo', texto: distintivo }),
    crear(documento, 'p', { clase: 'valor__nota', texto: nota }));
}

/** Ceros de f y rectángulo equivalente (R-08), como notas bajo las tarjetas. */
function notas(documento, analisis, resultado) {
  const lineas = [textoCeros(analisis), textoRectangulo(resultado)].filter((t) => t !== null);
  if (lineas.length === 0) return null;
  return crear(documento, 'ul', { clase: 'notas' },
    lineas.map(([titulo, texto]) => crear(documento, 'li', {}, crear(documento, 'strong', { texto: `${titulo}: ` }), texto)));
}

/** Ceros de f en [a, b]: exactos como fracción y aproximados con «≈» (R-18.2). */
function textoCeros(analisis) {
  if (analisis.identicamenteCero) return null; // W-09 lo explica
  if (analisis.ceros.length === 0) return ['Ceros', 'f no tiene ceros en [a, b].'];
  const lista = analisis.ceros
    .map((cero) => (cero.exacto ? `x = ${fraccionTexto(cero.valor)}` : `x ≈ ${aDecimal(cero.valor)}`))
    .join('; ');
  return ['Ceros de f en [a, b]', `${lista}.`];
}

function textoRectangulo(resultado) {
  const { rectangulo, motivo } = resultado.rectangulo;
  const { unidades } = resultado;
  if (rectangulo === null) {
    return motivo === null ? null : ['Rectángulo equivalente', 'solo se muestra cuando f ≥ 0 en todo [a, b].'];
  }
  return ['Rectángulo equivalente',
    `base b − a = ${cantidadTexto(exacta(rectangulo.base), unidades.x)}, `
    + `altura f_prom = ${cantidadTexto(exacta(rectangulo.altura), unidades.y)} `
    + `y área ${cantidadTexto(exacta(rectangulo.area), unidades.area)}.`];
}

// ── Gráfica (design §14.3; R-10) ─────────────────────────────────────

/**
 * Sin resultado: estado vacío. Con resultado y DatosGrafica: el adaptador la dibuja (y
 * muestra W-07 él mismo si Plotly falla). Con resultado y grafica null (valores no
 * finitos, R-10.6): el W-07 que trae el resultado. La promesa de dibujar no se espera.
 */
function pintarGrafica(documento, figura, resultado, grafica, errores) {
  if (grafica !== null) grafica.limpiar(figura);
  if (resultado === null) {
    figura.replaceChildren(crear(documento, 'div', { clase: 'grafica__aviso' },
      ejesDecorativos(documento),
      crear(documento, 'p', { clase: 'grafica__aviso-titulo', texto: 'Todavía no hay gráfica' }),
      crear(documento, 'p', {
        texto: errores.length > 0
          ? 'Corrija los datos marcados y pulse «Calcular». No se muestra la gráfica de un cálculo anterior.'
          : 'Al calcular verá la curva, las regiones sobre y bajo el eje, el valor promedio y los ceros.'
      })));
    return;
  }
  if (resultado.grafica !== null && grafica !== null) {
    figura.replaceChildren();
    void grafica.dibujar(figura, resultado.grafica);
    return;
  }
  const w07 = resultado.advertencias.find((aviso) => aviso.codigo === 'W-07') ?? null;
  figura.replaceChildren(crear(documento, 'div', { clase: 'grafica__aviso', role: 'status' },
    crear(documento, 'p', { clase: 'grafica__aviso-titulo', texto: 'Gráfica no disponible' }),
    w07 === null
      ? crear(documento, 'p', { texto: 'Los resultados y los pasos se conservan.' })
      : avisoAdvertencia(documento, w07, 'p')));
}

/** Solo ejes, sin curva: no sugiere un resultado. */
function ejesDecorativos(documento) {
  const svg = documento.createElementNS(SVG, 'svg');
  for (const [nombre, valorAtributo] of [['viewBox', '0 0 64 48'], ['width', '64'], ['height', '48'],
    ['aria-hidden', 'true'], ['focusable', 'false'], ['class', 'grafica__ejes']]) {
    svg.setAttribute(nombre, valorAtributo);
  }
  const trazo = documento.createElementNS(SVG, 'path');
  for (const [nombre, valorAtributo] of [['d', 'M8 6 V 40 H 58 M 4 10 L 8 6 L 12 10 M 54 36 L 58 40 L 54 44'],
    ['fill', 'none'], ['stroke', 'currentColor'], ['stroke-width', '2'], ['stroke-linecap', 'round'],
    ['stroke-linejoin', 'round']]) {
    trazo.setAttribute(nombre, valorAtributo);
  }
  svg.append(trazo);
  return svg;
}

// ── Procedimiento y estimación ───────────────────────────────────────

/** Procedimientos de analizarPerfil (pasosPerfil), abiertos por defecto (design §14.2). */
function desplegablePasos(documento, resultado) {
  return crear(documento, 'details', { clase: 'desplegable', open: true },
    crear(documento, 'summary', { clase: 'desplegable__resumen' }, 'Procedimiento paso a paso'),
    crear(documento, 'div', { clase: 'desplegable__contenido' },
      crear(documento, 'h3', { clase: 'subtitulo', texto: 'Integral y área' }),
      listaPasos(documento, resultado.pasos.area),
      crear(documento, 'h3', { clase: 'subtitulo', texto: 'Valor promedio' }),
      listaPasos(documento, resultado.pasos.promedio)));
}

/** Banda «Usar esta área para estimar material»: deshabilitada con el motivo E-MOD si no es apta. */
function bandaEstimacion(documento, resultado, ventana, despachar) {
  const { aptitud, area } = resultado;
  const idTitulo = 'perfil-aptitud-titulo';
  const boton = crear(documento, 'button', {
    clase: 'boton boton--claro', type: 'button', disabled: !aptitud.apta, 'aria-describedby': ID_MOTIVO
  }, 'Usar esta área para estimar material ', crear(documento, 'span', { clase: 'boton__flecha', 'aria-hidden': 'true', texto: '→' }));
  boton.addEventListener('click', () => {
    const estado = despachar(usarComoFuente, 'perfil');
    if (estado.estimacion.fuente === 'perfil') irA(ventana, 'estimacion');
  });
  const motivo = aptitud.apta
    ? `Perfil físico con f ≥ 0 y área positiva: A_geo = ${cantidadTexto(area.area, 'm²')} se puede usar para estimar material.`
    : `${aptitud.error.codigo}: ${textoError(aptitud.error)}`;
  return crear(documento, 'section', { clase: 'banda', 'aria-labelledby': idTitulo },
    crear(documento, 'div', { clase: 'banda__cuerpo' },
      crear(documento, 'p', { clase: 'banda__etiqueta', texto: aptitud.apta ? 'Área apta' : 'Área no apta' }),
      crear(documento, 'h3', { clase: 'banda__titulo', id: idTitulo, texto: 'Estimación de material' }),
      crear(documento, 'p', { clase: 'banda__texto', id: ID_MOTIVO, texto: motivo })),
    crear(documento, 'div', { clase: 'banda__acciones' }, boton));
}
