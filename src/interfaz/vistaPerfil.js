// Vista del analizador de perfiles (T-14; design.md §14.5; requirements R-01, R-11, R-15 y R-23).
//
// La vista no calcula: lee el estado de T-13, despacha transiciones (editarPerfil,
// calcularPerfil, usarComoFuente, cargarEjemplo) y escribe el ResultadoPerfil vigente
// con presentacion/formato.js. Todo lo que muestra sale de ese resultado; si no hay
// resultado, muestra un estado vacío sin cifras.
//
// Puntos de integración (no se simulan):
//   - resultado.pasos ({ area, promedio }) vale null hasta que T-17 conecte
//     presentacion/pasos.js con analizarPerfil; mientras tanto se avisa de que falta.
//   - resultado.grafica vale null hasta T-15/T-17; la vista deja el contenedor
//     <figure data-grafica> y, si recibe `grafica` ({ dibujar, limpiar } de
//     adaptadores/graficaPlotly.js, design §14.3) y hay datos, lo usa.
//   - El selector de ejemplos solo aparece si `catalogo` trae ejemplos del perfil
//     (ejemplos.js, T-16); main.js pasa hoy un catálogo vacío.
//   - Los textos con `data-latex` los mejorará formulasKatex.mejorar (T-16).
import { calcularPerfil, cargarEjemplo, editarPerfil, usarComoFuente } from './estado.js';
import { irA } from './navegacion.js';
import { aDecimal, cantidadTexto, fraccionTexto } from '../presentacion/formato.js';
import {
  crear, enfocar, estadoVacio, fijarValor, listaAdvertencias, listaPasos, mostrarErrores, pendiente, porId,
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
      ultimo = { resultado, errores };
      mostrarErrores(documento, { campos: CAMPOS, resumen, errores });
      if (grafica !== null) {
        for (const contenedor of resultados.querySelectorAll('[data-grafica]')) grafica.limpiar(contenedor);
      }
      resultados.replaceChildren(...(resultado === null
        ? [vacio(documento, errores)]
        : contenidoResultado(documento, resultado, { ventana, despachar, grafica })));
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
    texto: 'Escriba f(x), los límites a y b, elija la interpretación y pulse «Calcular». '
      + 'Verá la integral con signo, el área geométrica y el valor promedio.'
  });
}

/** Tarjetas del resultado, en el orden de design §14.5: resumen, gráfica, pasos y estimación. */
function contenidoResultado(documento, resultado, { ventana, despachar, grafica }) {
  return [
    tarjetaResumen(documento, resultado),
    tarjetaGrafica(documento, resultado, grafica),
    tarjetaPasos(documento, resultado),
    tarjetaAptitud(documento, resultado, ventana, despachar)
  ];
}

function tarjetaResumen(documento, resultado) {
  const { modelo, intervalo, unidades, integral, analisis, area, promedio } = resultado;
  const distintos = !area.igualAI;
  const supuesto = unidades.estimable
    ? 'Perfil físico: x y f(x) en metros; áreas en m²'
    : 'Ejercicio abstracto: x y f(x) en u; áreas en u²';

  return crear(documento, 'section', { clase: 'tarjeta', 'aria-labelledby': ID_TITULO },
    crear(documento, 'h2', { clase: 'tarjeta__titulo', id: ID_TITULO, texto: 'Resultados' }),
    crear(documento, 'div', { clase: 'modelo' },
      crear(documento, 'p', {
        clase: 'modelo__funcion', 'data-latex': `f(x) = ${modelo.latexNormalizado}`,
        texto: `f(x) = ${modelo.textoNormalizado}`
      }),
      crear(documento, 'ul', { clase: 'modelo__datos', 'aria-label': 'Datos del cálculo' },
        crear(documento, 'li', {
          clase: 'etiqueta-dato', texto: `Intervalo [${fraccionTexto(intervalo.a)}, ${fraccionTexto(intervalo.b)}]`
        }),
        crear(documento, 'li', { clase: 'etiqueta-dato', texto: supuesto }),
        modelo.huboDesarrollo
          ? crear(documento, 'li', { clase: 'etiqueta-dato', texto: 'Desarrollado a forma estándar' })
          : null)),
    crear(documento, 'div', { clase: 'valores' },
      valor(documento, {
        variante: 'integral', nombre: 'Integral con signo', simbolo: 'I',
        cifra: cantidadTexto(exacta(integral.I), unidades.area),
        distintivo: distintos ? 'Distinta de A_geo' : null,
        nota: 'Cuenta con signo: lo que queda bajo el eje resta.'
      }),
      valor(documento, {
        variante: 'area', nombre: 'Área geométrica', simbolo: 'A_geo',
        cifra: cantidadTexto(area.area, unidades.area),
        distintivo: distintos ? 'Distinta de I' : null,
        nota: distintos
          ? 'Suma de |Iₖ| por tramos: no coincide con I porque f toma valores negativos en [a, b].'
          : 'f ≥ 0 en [a, b], así que coincide con I.'
      }),
      valor(documento, {
        variante: 'promedio', nombre: 'Valor promedio', simbolo: 'f_prom',
        cifra: cantidadTexto(exacta(promedio.fProm), unidades.y),
        distintivo: null,
        nota: `f_prom = I / (b − a), con b − a = ${cantidadTexto(exacta(promedio.longitud), unidades.x)}.`
      })),
    textoCeros(documento, analisis),
    textoRectangulo(documento, resultado),
    listaAdvertencias(documento, resultado.advertencias));
}

function valor(documento, { variante, nombre, simbolo, cifra, distintivo, nota }) {
  return crear(documento, 'div', { clase: `valor valor--${variante}` },
    crear(documento, 'p', { clase: 'valor__nombre' }, `${nombre} `,
      crear(documento, 'span', { clase: 'valor__simbolo', texto: simbolo })),
    crear(documento, 'p', { clase: 'valor__cifra', texto: cifra }),
    distintivo === null ? null : crear(documento, 'p', { clase: 'distintivo', texto: distintivo }),
    crear(documento, 'p', { clase: 'valor__nota', texto: nota }));
}

/** Ceros de f en [a, b]: exactos como fracción y aproximados con «≈» (R-18.2). */
function textoCeros(documento, analisis) {
  if (analisis.identicamenteCero) return null; // W-09 lo explica
  if (analisis.ceros.length === 0) {
    return crear(documento, 'p', { clase: 'valor__nota', texto: 'f no tiene ceros en [a, b].' });
  }
  const lista = analisis.ceros
    .map((cero) => (cero.exacto ? `x = ${fraccionTexto(cero.valor)}` : `x ≈ ${aDecimal(cero.valor)}`))
    .join('; ');
  return crear(documento, 'p', { clase: 'valor__nota', texto: `Ceros de f en [a, b]: ${lista}.` });
}

/** Rectángulo equivalente (R-08): solo cuando f ≥ 0; si no, se dice por qué no aparece. */
function textoRectangulo(documento, resultado) {
  const { rectangulo, motivo } = resultado.rectangulo;
  const { unidades } = resultado;
  if (rectangulo === null) {
    if (motivo === null) return null;
    return crear(documento, 'p', {
      clase: 'valor__nota', texto: 'El rectángulo equivalente solo se muestra cuando f ≥ 0 en todo [a, b].'
    });
  }
  return crear(documento, 'p', {
    clase: 'valor__nota',
    texto: `Rectángulo equivalente: base b − a = ${cantidadTexto(exacta(rectangulo.base), unidades.x)}, `
      + `altura f_prom = ${cantidadTexto(exacta(rectangulo.altura), unidades.y)} `
      + `y área ${cantidadTexto(exacta(rectangulo.area), unidades.area)}.`
  });
}

function tarjetaGrafica(documento, resultado, grafica) {
  const idTitulo = 'perfil-grafica-titulo';
  const figura = crear(documento, 'figure', { clase: 'grafica', 'data-grafica': true, 'aria-labelledby': idTitulo });
  const tarjeta = crear(documento, 'section', { clase: 'tarjeta', 'aria-labelledby': idTitulo },
    crear(documento, 'h3', { clase: 'tarjeta__titulo', id: idTitulo, texto: 'Gráfica' }),
    figura);
  if (resultado.grafica !== null && grafica !== null) {
    grafica.dibujar(figura, resultado.grafica);
  } else {
    // Punto de integración de T-15/T-17: datosGrafica + graficaPlotly.dibujar.
    figura.append(crear(documento, 'p', {
      clase: 'grafica__pendiente',
      texto: 'La gráfica se conectará en la integración final. Los resultados de arriba no dependen de ella.'
    }));
  }
  return tarjeta;
}

function tarjetaPasos(documento, resultado) {
  const idTitulo = 'perfil-pasos-titulo';
  const tarjeta = crear(documento, 'section', { clase: 'tarjeta', 'aria-labelledby': idTitulo },
    crear(documento, 'h3', { clase: 'tarjeta__titulo', id: idTitulo, texto: 'Procedimiento' }));
  if (resultado.pasos === null) {
    // Punto de integración de T-17: pasosArea y pasosPromedio en ResultadoPerfil.pasos.
    tarjeta.append(pendiente(documento,
      'El procedimiento paso a paso se mostrará aquí cuando se conecte en la integración final.'));
    return tarjeta;
  }
  tarjeta.append(
    crear(documento, 'h4', { clase: 'subtitulo', texto: 'Integral y área' }),
    listaPasos(documento, resultado.pasos.area),
    crear(documento, 'h4', { clase: 'subtitulo', texto: 'Valor promedio' }),
    listaPasos(documento, resultado.pasos.promedio));
  return tarjeta;
}

/** Botón «Usar esta área para estimar material»: deshabilitado con el motivo E-MOD si no es apto. */
function tarjetaAptitud(documento, resultado, ventana, despachar) {
  const idTitulo = 'perfil-aptitud-titulo';
  const { aptitud } = resultado;
  const boton = crear(documento, 'button', {
    clase: 'boton boton--secundario', type: 'button', disabled: !aptitud.apta,
    'aria-describedby': ID_MOTIVO, texto: 'Usar esta área para estimar material'
  });
  boton.addEventListener('click', () => {
    const estado = despachar(usarComoFuente, 'perfil');
    if (estado.estimacion.fuente === 'perfil') irA(ventana, 'estimacion');
  });
  const motivo = aptitud.apta
    ? 'Perfil físico con f ≥ 0 y área positiva: el área geométrica se puede usar para estimar material.'
    : `${aptitud.error.codigo}: ${textoError(aptitud.error)}`;
  return crear(documento, 'section', { clase: 'tarjeta', 'aria-labelledby': idTitulo },
    crear(documento, 'h3', { clase: 'tarjeta__titulo', id: idTitulo, texto: 'Estimación de material' }),
    crear(documento, 'div', { clase: 'aptitud' },
      boton,
      crear(documento, 'p', { clase: 'aptitud__motivo', id: ID_MOTIVO, texto: motivo })));
}
