// Vista de las figuras geométricas (T-14 y su revisión visual; design.md §14.5; requirements R-14, R-15 y R-23).
//
// Rectángulo, triángulo y círculo, con fórmulas directas. La figura se elige con tarjetas
// (un grupo de radios nativos en index.html). La vista no calcula: despacha editarFigura,
// calcularFigura y usarComoFuente (T-13) y escribe el ResultadoFigura vigente con
// presentacion/formato.js. Sin resultado, muestra un estado vacío sin cifras.
//
// Integración (T-17): resultado.pasos viene de calcularFigura (pasosFigura, T-12). El
// selector de ejemplos (#figura-ejemplo) ofrece los ejemplos de figuras de ejemplos.js
// (CR-09 y CR-10) y los carga con cargarEjemplo, como una entrada manual (R-13.2).
import { calcularFigura, cargarEjemplo, editarFigura, usarComoFuente } from './estado.js';
import { irA } from './navegacion.js';
import { cantidadTexto } from '../presentacion/formato.js';
import {
  cifra, crear, describir, desplegablePasos, enfocar, estadoVacio, fijarValor, mostrarErrores, porId, prepararEjemplos,
  sincronizarEjemplo, tituloResumen
} from './vistaComun.js';

/** Dónde se muestra cada `error.campo` de la figura. */
const CAMPOS = Object.freeze({
  base: Object.freeze({ controles: Object.freeze(['figura-base']), mensaje: 'figura-base-error' }),
  altura: Object.freeze({ controles: Object.freeze(['figura-altura']), mensaje: 'figura-altura-error' }),
  radio: Object.freeze({ controles: Object.freeze(['figura-radio']), mensaje: 'figura-radio-error' })
});

/** Dimensiones visibles de cada figura y nombre que se muestra. */
const FIGURAS = Object.freeze({
  rectangulo: Object.freeze({ nombre: 'Rectángulo', dimensiones: Object.freeze(['base', 'altura']) }),
  triangulo: Object.freeze({ nombre: 'Triángulo', dimensiones: Object.freeze(['base', 'altura']) }),
  circulo: Object.freeze({ nombre: 'Círculo', dimensiones: Object.freeze(['radio']) })
});

const NOMBRE_DIMENSION = Object.freeze({ base: 'Base b', altura: 'Altura h', radio: 'Radio r' });

const ID_TITULO = 'figura-resultados-titulo';
const ID_AYUDA_ALTURA = 'figura-altura-ayuda';
const ID_MOTIVO = 'figura-aptitud-motivo';

const exacta = (valor) => ({ clase: 'exacta', valor });

/**
 * @param {{
 *   documento: Document,
 *   ventana: object,
 *   despachar: (transicion: Function, ...argumentos: unknown[]) => object,
 *   catalogo?: ReadonlyArray<import('./estado.js').Ejemplo>
 * }} opciones
 * @returns {{ render: (estado: object) => void }}
 */
export function crearVistaFiguras({ documento, ventana, despachar, catalogo = [] }) {
  const formulario = porId(documento, 'figura-formulario');
  const tipos = [...porId(documento, 'figura-tipo').querySelectorAll('input[name="tipo"]')];
  const unidad = porId(documento, 'figura-unidad');
  const dimensiones = {
    base: porId(documento, 'figura-base'),
    altura: porId(documento, 'figura-altura'),
    radio: porId(documento, 'figura-radio')
  };
  const grupos = [...formulario.querySelectorAll('[data-dimension]')];
  const ayudaTriangulo = porId(documento, ID_AYUDA_ALTURA);
  const unidades = [...documento.querySelectorAll('[data-unidad-figura]')];
  const resumen = porId(documento, 'figura-errores');
  const resultados = porId(documento, 'figura-resultados');
  const selectorEjemplo = porId(documento, 'figura-ejemplo');
  const ejemplos = catalogo.filter((ejemplo) => ejemplo?.seccion === 'figuras');

  if (ejemplos.length > 0) {
    prepararEjemplos(documento, {
      contenedor: porId(documento, 'figura-ejemplos'),
      selector: selectorEjemplo,
      ejemplos,
      alElegir: (id) => {
        const estado = despachar(cargarEjemplo, id, catalogo);
        if (estado.figura.resultado !== null) enfocar(porId(documento, ID_TITULO));
      }
    });
  }

  for (const radio of tipos) {
    radio.addEventListener('change', () => {
      if (radio.checked) despachar(editarFigura, 'tipo', radio.value);
    });
  }
  unidad.addEventListener('change', () => despachar(editarFigura, 'unidad', unidad.value));
  for (const control of Object.values(dimensiones)) {
    control.addEventListener('input', () => despachar(editarFigura, control.name, control.value));
  }

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const estado = despachar(calcularFigura);
    if (estado.figura.resultado !== null) enfocar(porId(documento, ID_TITULO));
    else enfocar(tituloResumen(resumen));
  });

  let ultimo = { resultado: undefined, errores: undefined };

  return {
    render(estado) {
      const { entrada, resultado, errores } = estado.figura;
      for (const radio of tipos) radio.checked = radio.value === entrada.tipo;
      fijarValor(unidad, entrada.unidad);
      for (const [campo, control] of Object.entries(dimensiones)) fijarValor(control, entrada[campo]);

      // Solo se ven las dimensiones de la figura elegida; la ayuda de la altura, solo en el triángulo.
      const visibles = FIGURAS[entrada.tipo].dimensiones;
      for (const grupo of grupos) grupo.hidden = !visibles.includes(grupo.dataset.dimension);
      const esTriangulo = entrada.tipo === 'triangulo';
      ayudaTriangulo.hidden = !esTriangulo;
      describir(dimensiones.altura, ID_AYUDA_ALTURA, esTriangulo);
      for (const elemento of unidades) elemento.textContent = `(${entrada.unidad})`;
      sincronizarEjemplo(selectorEjemplo, ejemplos, entrada);

      if (ultimo.resultado === resultado && ultimo.errores === errores) return;
      ultimo = { resultado, errores };
      mostrarErrores(documento, { campos: CAMPOS, resumen, errores });
      resultados.replaceChildren(...(resultado === null
        ? [vacio(documento, errores)]
        : [tarjetaResultado(documento, resultado, ventana, despachar), desplegablePasos(documento, resultado.pasos)]));
    }
  };
}

function vacio(documento, errores) {
  if (errores.length > 0) {
    return estadoVacio(documento, {
      idTitulo: ID_TITULO,
      titulo: 'Sin resultado',
      texto: 'Corrija las medidas marcadas y pulse «Calcular área». No se muestra el resultado de un cálculo anterior.'
    });
  }
  return estadoVacio(documento, {
    idTitulo: ID_TITULO,
    titulo: 'Todavía no hay resultado',
    texto: 'Elija la figura y la unidad, escriba sus medidas y pulse «Calcular área». '
      + 'Verá el área en su unidad y en m².'
  });
}

function tarjetaResultado(documento, resultado, ventana, despachar) {
  const { tipo, unidad, dimensiones, area, unidadArea, areaM2, formula } = resultado;
  const figura = FIGURAS[tipo];
  const enCentimetros = unidad === 'cm';

  const boton = crear(documento, 'button', {
    clase: 'boton boton--principal', type: 'button', 'aria-describedby': ID_MOTIVO
  }, 'Usar esta área para estimar material ', crear(documento, 'span', { clase: 'boton__flecha', 'aria-hidden': 'true', texto: '→' }));
  boton.addEventListener('click', () => {
    const estado = despachar(usarComoFuente, 'figura');
    if (estado.estimacion.fuente === 'figura') irA(ventana, 'estimacion');
  });

  return crear(documento, 'section', { clase: 'tarjeta resultado-figura', 'aria-labelledby': ID_TITULO },
    crear(documento, 'div', { clase: 'resumen-perfil__cabecera' },
      crear(documento, 'h2', { clase: 'tarjeta__titulo', id: ID_TITULO, texto: `Resultado: ${figura.nombre.toLowerCase()}` }),
      crear(documento, 'p', { clase: 'resultado-figura__formula', 'data-latex': formula.latex, texto: formula.texto })),
    crear(documento, 'ul', { clase: 'etiquetas', 'aria-label': 'Medidas' },
      figura.dimensiones.map((campo) => crear(documento, 'li', {
        clase: 'etiqueta-dato', texto: `${NOMBRE_DIMENSION[campo]} = ${cantidadTexto(exacta(dimensiones[campo]), unidad)}`
      }))),
    crear(documento, 'div', { clase: 'valores' },
      valorArea(documento, {
        nombre: enCentimetros ? 'Área en cm²' : 'Área', simbolo: 'A', cantidad: area, unidad: unidadArea,
        nota: enCentimetros ? 'En la unidad de las medidas.' : 'Ya está en m²: es el área que se usa para estimar.'
      }),
      enCentimetros
        ? valorArea(documento, {
          nombre: 'Área en m²', simbolo: 'A', cantidad: areaM2, unidad: 'm²',
          nota: '1 m² = 10 000 cm². Es el área que se usa para estimar material.'
        })
        : null),
    // Toda figura calculada es apta (R-16.1): el botón siempre está habilitado.
    crear(documento, 'div', { clase: 'acciones' },
      boton,
      crear(documento, 'p', {
        clase: 'acciones__motivo', id: ID_MOTIVO, texto: 'Se usará el área en m² con el precio y el adicional que indique.'
      })));
}

function valorArea(documento, { nombre, simbolo, cantidad, unidad, nota }) {
  return crear(documento, 'div', { clase: 'valor valor--area' },
    crear(documento, 'p', { clase: 'valor__nombre' }, `${nombre} `,
      crear(documento, 'span', { clase: 'valor__simbolo', texto: simbolo })),
    cifra(documento, cantidad, unidad),
    crear(documento, 'p', { clase: 'valor__nota', texto: nota }));
}

