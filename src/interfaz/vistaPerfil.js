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
// Puntos de integración (no se simulan):
//   - resultado.pasos ({ area, promedio }) vale null hasta que T-17 conecte
//     presentacion/pasos.js con analizarPerfil; mientras tanto se avisa de que falta.
//   - resultado.grafica vale null hasta T-15/T-17; la vista usa el contenedor
//     #perfil-grafica y, si recibe `grafica` ({ dibujar, limpiar } de
//     adaptadores/graficaPlotly.js, design §14.3) y hay datos, lo usa.
//   - El selector de ejemplos solo aparece si `catalogo` trae ejemplos del perfil
//     (ejemplos.js, T-16); main.js pasa hoy un catálogo vacío.
//   - Los textos con `data-latex` los mejorará formulasKatex.mejorar (T-16).
import { calcularPerfil, cargarEjemplo, editarPerfil, usarComoFuente } from './estado.js';
import { irA } from './navegacion.js';
import { aDecimal, cantidadTexto, fraccionTexto } from '../presentacion/formato.js';
import {
  cifra, crear, enfocar, estadoVacio, fijarValor, listaAdvertencias, listaPasos, mostrarErrores, pendiente, porId,
  textoError, tituloResumen
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

  if (ejemplos.length > 0) prepararEjemplos(documento, ejemplos, catalogo, despachar);

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

      // El estado es inmutable: si el resultado y los errores no cambiaron, no se redibuja.
      if (ultimo.resultado === resultado && ultimo.errores === errores) return;
      const cambioResultado = ultimo.resultado !== resultado;
      ultimo = { resultado, errores };
      mostrarErrores(documento, { campos: CAMPOS, resumen, errores });
      resultados.replaceChildren(resultado === null ? vacio(documento, errores) : tarjetaResumen(documento, resultado));
      if (cambioResultado) {
        pintarGrafica(documento, figura, resultado, grafica);
        detalles.replaceChildren(...(resultado === null
          ? []
          : [desplegablePasos(documento, resultado), bandaEstimacion(documento, resultado, ventana, despachar)]));
      }
    }
  };
}

/** Muestra el selector de ejemplos (T-16) y carga el elegido por el mismo camino que una entrada manual. */
function prepararEjemplos(documento, ejemplos, catalogo, despachar) {
  const contenedor = porId(documento, 'perfil-ejemplos');
  const selector = porId(documento, 'perfil-ejemplo');
  selector.replaceChildren(
    crear(documento, 'option', { value: '', texto: 'Elija un ejemplo…' }),
    ...ejemplos.map((ejemplo) => crear(documento, 'option', { value: ejemplo.id, texto: ejemplo.titulo ?? ejemplo.id })));
  contenedor.hidden = false;
  selector.addEventListener('change', () => {
    if (selector.value === '') return;
    const estado = despachar(cargarEjemplo, selector.value, catalogo);
    if (estado.perfil.resultado !== null) enfocar(porId(documento, ID_TITULO));
  });
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

// ── Gráfica (punto de integración de T-15/T-17) ──────────────────────

function pintarGrafica(documento, figura, resultado, grafica) {
  if (grafica !== null) grafica.limpiar(figura);
  if (resultado !== null && resultado.grafica !== null && grafica !== null) {
    figura.replaceChildren();
    grafica.dibujar(figura, resultado.grafica);
    return;
  }
  figura.replaceChildren(crear(documento, 'div', { clase: 'grafica__aviso' },
    ejesDecorativos(documento),
    crear(documento, 'p', { clase: 'grafica__aviso-titulo', texto: 'Gráfica pendiente de integración' }),
    crear(documento, 'p', {
      texto: resultado === null
        ? 'Aquí se dibujarán la curva, las regiones sobre y bajo el eje y el valor promedio cuando se conecte la gráfica.'
        : 'La gráfica se conectará en la integración final. Los resultados no dependen de ella.'
    })));
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

function desplegablePasos(documento, resultado) {
  const sinPasos = resultado.pasos === null;
  const contenido = crear(documento, 'div', { clase: 'desplegable__contenido' });
  if (sinPasos) {
    // Punto de integración de T-17: pasosArea y pasosPromedio en ResultadoPerfil.pasos.
    contenido.append(pendiente(documento,
      'El procedimiento paso a paso se mostrará aquí cuando se conecte en la integración final.'));
  } else {
    contenido.append(
      crear(documento, 'h3', { clase: 'subtitulo', texto: 'Integral y área' }),
      listaPasos(documento, resultado.pasos.area),
      crear(documento, 'h3', { clase: 'subtitulo', texto: 'Valor promedio' }),
      listaPasos(documento, resultado.pasos.promedio));
  }
  return crear(documento, 'details', { clase: 'desplegable', open: sinPasos ? null : true },
    crear(documento, 'summary', { clase: 'desplegable__resumen' }, 'Procedimiento paso a paso',
      sinPasos ? crear(documento, 'span', { clase: 'insignia', texto: 'Pendiente de integración' }) : null),
    contenido);
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
