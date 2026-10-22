// Vista de las figuras geométricas (T-14; design.md §14.5; requirements R-14, R-15 y R-23).
//
// Rectángulo, triángulo y círculo, con fórmulas directas. La vista no calcula: despacha
// editarFigura, calcularFigura y usarComoFuente (T-13) y escribe el ResultadoFigura
// vigente con presentacion/formato.js. Sin resultado, muestra un estado vacío sin cifras.
//
// Punto de integración (no se simula): resultado.pasos vale null hasta que T-17 conecte
// pasosFigura (presentacion/pasos.js) con calcularFigura; mientras tanto se avisa.
import { calcularFigura, editarFigura, usarComoFuente } from './estado.js';
import { irA } from './navegacion.js';
import { cantidadTexto } from '../presentacion/formato.js';
import {
  crear, describir, enfocar, estadoVacio, fijarValor, listaPasos, mostrarErrores, pendiente, porId, tituloResumen
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

const exacta = (valor) => ({ clase: 'exacta', valor });

/**
 * @param {{
 *   documento: Document,
 *   ventana: object,
 *   despachar: (transicion: Function, ...argumentos: unknown[]) => object
 * }} opciones
 * @returns {{ render: (estado: object) => void }}
 */
export function crearVistaFiguras({ documento, ventana, despachar }) {
  const formulario = porId(documento, 'figura-formulario');
  const tipo = porId(documento, 'figura-tipo');
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

  for (const control of [tipo, unidad]) {
    control.addEventListener('change', () => despachar(editarFigura, control.name, control.value));
  }
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
      fijarValor(tipo, entrada.tipo);
      fijarValor(unidad, entrada.unidad);
      for (const [campo, control] of Object.entries(dimensiones)) fijarValor(control, entrada[campo]);

      // Solo se ven las dimensiones de la figura elegida; la ayuda de la altura, solo en el triángulo.
      const visibles = FIGURAS[entrada.tipo].dimensiones;
      for (const grupo of grupos) grupo.hidden = !visibles.includes(grupo.dataset.dimension);
      const esTriangulo = entrada.tipo === 'triangulo';
      ayudaTriangulo.hidden = !esTriangulo;
      describir(dimensiones.altura, ID_AYUDA_ALTURA, esTriangulo);
      for (const elemento of unidades) elemento.textContent = `(${entrada.unidad})`;

      if (ultimo.resultado === resultado && ultimo.errores === errores) return;
      ultimo = { resultado, errores };
      mostrarErrores(documento, { campos: CAMPOS, resumen, errores });
      resultados.replaceChildren(...(resultado === null
        ? [vacio(documento, errores)]
        : [tarjetaResultado(documento, resultado), tarjetaPasos(documento, resultado),
          tarjetaFuente(documento, ventana, despachar)]));
    }
  };
}

function vacio(documento, errores) {
  if (errores.length > 0) {
    return estadoVacio(documento, {
      idTitulo: ID_TITULO,
      titulo: 'Sin resultado',
      texto: 'Corrija las dimensiones marcadas y pulse «Calcular». No se muestra el resultado de un cálculo anterior.'
    });
  }
  return estadoVacio(documento, {
    idTitulo: ID_TITULO,
    titulo: 'Todavía no hay resultado',
    texto: 'Elija la figura y la unidad, escriba sus dimensiones y pulse «Calcular». '
      + 'Verá el área en su unidad y en m².'
  });
}

function tarjetaResultado(documento, resultado) {
  const { tipo, unidad, dimensiones, area, unidadArea, areaM2, formula } = resultado;
  const figura = FIGURAS[tipo];
  const enCentimetros = unidad === 'cm';
  return crear(documento, 'section', { clase: 'tarjeta', 'aria-labelledby': ID_TITULO },
    crear(documento, 'h2', { clase: 'tarjeta__titulo', id: ID_TITULO, texto: `Resultado: ${figura.nombre.toLowerCase()}` }),
    crear(documento, 'div', { clase: 'modelo' },
      crear(documento, 'p', { clase: 'modelo__funcion', 'data-latex': formula.latex, texto: formula.texto }),
      crear(documento, 'ul', { clase: 'modelo__datos', 'aria-label': 'Dimensiones' },
        figura.dimensiones.map((campo) => crear(documento, 'li', {
          clase: 'etiqueta-dato', texto: `${NOMBRE_DIMENSION[campo]} = ${cantidadTexto(exacta(dimensiones[campo]), unidad)}`
        })))),
    crear(documento, 'div', { clase: 'valores' },
      valorArea(documento, {
        nombre: 'Área', simbolo: 'A', cifra: cantidadTexto(area, unidadArea),
        nota: enCentimetros ? 'En la unidad de las dimensiones.' : 'En m², lista para estimar material.'
      }),
      enCentimetros
        ? valorArea(documento, {
          nombre: 'Área en metros cuadrados', simbolo: 'A', cifra: cantidadTexto(areaM2, 'm²'),
          nota: '1 m² = 10 000 cm². Es el área que se usa para estimar material.'
        })
        : null));
}

function valorArea(documento, { nombre, simbolo, cifra, nota }) {
  return crear(documento, 'div', { clase: 'valor valor--area' },
    crear(documento, 'p', { clase: 'valor__nombre' }, `${nombre} `,
      crear(documento, 'span', { clase: 'valor__simbolo', texto: simbolo })),
    crear(documento, 'p', { clase: 'valor__cifra', texto: cifra }),
    crear(documento, 'p', { clase: 'valor__nota', texto: nota }));
}

function tarjetaPasos(documento, resultado) {
  const idTitulo = 'figura-pasos-titulo';
  const tarjeta = crear(documento, 'section', { clase: 'tarjeta', 'aria-labelledby': idTitulo },
    crear(documento, 'h3', { clase: 'tarjeta__titulo', id: idTitulo, texto: 'Procedimiento' }));
  if (resultado.pasos === null) {
    // Punto de integración de T-17: pasosFigura en ResultadoFigura.pasos.
    tarjeta.append(pendiente(documento,
      'El procedimiento paso a paso se mostrará aquí cuando se conecte en la integración final.'));
  } else {
    tarjeta.append(listaPasos(documento, resultado.pasos));
  }
  return tarjeta;
}

/** Toda figura calculada es apta (R-16.1): el botón siempre está habilitado. */
function tarjetaFuente(documento, ventana, despachar) {
  const idTitulo = 'figura-aptitud-titulo';
  const idMotivo = 'figura-aptitud-motivo';
  const boton = crear(documento, 'button', {
    clase: 'boton boton--secundario', type: 'button', 'aria-describedby': idMotivo,
    texto: 'Usar esta área para estimar material'
  });
  boton.addEventListener('click', () => {
    const estado = despachar(usarComoFuente, 'figura');
    if (estado.estimacion.fuente === 'figura') irA(ventana, 'estimacion');
  });
  return crear(documento, 'section', { clase: 'tarjeta', 'aria-labelledby': idTitulo },
    crear(documento, 'h3', { clase: 'tarjeta__titulo', id: idTitulo, texto: 'Estimación de material' }),
    crear(documento, 'div', { clase: 'aptitud' },
      boton,
      crear(documento, 'p', {
        clase: 'aptitud__motivo', id: idMotivo, texto: 'Se usará el área en m² con el precio y el adicional que indique.'
      })));
}
