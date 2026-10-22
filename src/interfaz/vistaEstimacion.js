// Vista de la estimación de material (T-14; design.md §14.5; requirements R-16, R-17 y R-23).
//
// Muestra la fuente vigente (o el motivo de que no la haya), el precio en Q/m², el
// adicional en %, el resultado y los supuestos. Los supuestos generales están fijos en
// index.html, así que se ven siempre, haya o no resultado (R-17.5); el resultado añade
// los supuestos que devuelve estimarMaterial (W-06 y, con datos simulados, W-05).
//
// La vista no calcula: despacha editarEstimacion y calcularEstimacion (T-13) y escribe
// el ResultadoEstimacion con presentacion/formato.js.
//
// Punto de integración (no se simula): ResultadoEstimacion no trae pasos; el
// procedimiento de la estimación (pasosEstimacion, presentacion/pasos.js) lo conecta T-17.
import { calcularEstimacion, editarEstimacion } from './estado.js';
import { cantidadTexto, fraccionTexto, quetzalesCantidad } from '../presentacion/formato.js';
import {
  crear, enfocar, estadoVacio, fijarValor, mostrarErrores, pendiente, porId, textoError, tituloResumen
} from './vistaComun.js';

/** Dónde se muestra cada `error.campo` de la estimación; E-MOD-04 ('estimacion') va solo al resumen. */
const CAMPOS = Object.freeze({
  precio: Object.freeze({ controles: Object.freeze(['estimacion-precio']), mensaje: 'estimacion-precio-error' }),
  adicional: Object.freeze({ controles: Object.freeze(['estimacion-adicional']), mensaje: 'estimacion-adicional-error' })
});

const NOMBRE_FIGURA = Object.freeze({ rectangulo: 'Rectángulo', triangulo: 'Triángulo', circulo: 'Círculo' });

const ID_TITULO = 'estimacion-resultados-titulo';
const ID_TITULO_FUENTE = 'estimacion-fuente-titulo';

/**
 * @param {{
 *   documento: Document,
 *   despachar: (transicion: Function, ...argumentos: unknown[]) => object
 * }} opciones
 * @returns {{ render: (estado: object) => void }}
 */
export function crearVistaEstimacion({ documento, despachar }) {
  const formulario = porId(documento, 'estimacion-formulario');
  const precio = porId(documento, 'estimacion-precio');
  const adicional = porId(documento, 'estimacion-adicional');
  const fuente = porId(documento, 'estimacion-fuente');
  const resumen = porId(documento, 'estimacion-errores');
  const resultados = porId(documento, 'estimacion-resultados');

  for (const control of [precio, adicional]) {
    control.addEventListener('input', () => despachar(editarEstimacion, control.name, control.value));
  }

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const estado = despachar(calcularEstimacion);
    if (estado.estimacion.resultado !== null) enfocar(porId(documento, ID_TITULO));
    else enfocar(tituloResumen(resumen));
  });

  let ultimo = { fuente: undefined, origen: undefined, perfil: undefined, resultado: undefined, errores: undefined };

  return {
    render(estado) {
      const { estimacion } = estado;
      fijarValor(precio, estimacion.entrada.textoPrecio);
      fijarValor(adicional, estimacion.entrada.textoAdicional);

      // La tarjeta de la fuente depende de la fuente elegida y de los resultados de perfil y figura.
      const origen = estimacion.fuente === null ? null : estado[estimacion.fuente].resultado;
      if (ultimo.fuente !== estimacion.fuente || ultimo.origen !== origen || ultimo.perfil !== estado.perfil.resultado) {
        fuente.replaceChildren(...tarjetaFuente(documento, estado));
      }
      if (ultimo.resultado !== estimacion.resultado || ultimo.errores !== estimacion.errores) {
        mostrarErrores(documento, { campos: CAMPOS, resumen, errores: estimacion.errores });
        resultados.replaceChildren(estimacion.resultado === null
          ? vacio(documento, estimacion)
          : tarjetaResultado(documento, estimacion.resultado));
      }
      ultimo = {
        fuente: estimacion.fuente, origen, perfil: estado.perfil.resultado,
        resultado: estimacion.resultado, errores: estimacion.errores
      };
    }
  };
}

/** Contenido de la tarjeta de la fuente: la fuente vigente o el motivo de que no la haya. */
function tarjetaFuente(documento, estado) {
  const titulo = crear(documento, 'h2', { clase: 'tarjeta__titulo', id: ID_TITULO_FUENTE, texto: 'Fuente del área' });
  const { fuente } = estado.estimacion;
  if (fuente === 'perfil') {
    const { modelo, intervalo, area } = estado.perfil.resultado;
    return [titulo,
      crear(documento, 'p', {
        clase: 'fuente__descripcion',
        texto: `Perfil f(x) = ${modelo.textoNormalizado} en [${fraccionTexto(intervalo.a)}, ${fraccionTexto(intervalo.b)}] m`
      }),
      crear(documento, 'p', { clase: 'valor__nota', texto: `Área útil A_geo: ${cantidadTexto(area.area, 'm²')}` })];
  }
  if (fuente === 'figura') {
    const { tipo, unidad, areaM2 } = estado.figura.resultado;
    return [titulo,
      crear(documento, 'p', { clase: 'fuente__descripcion', texto: `${NOMBRE_FIGURA[tipo]} medido en ${unidad}` }),
      crear(documento, 'p', { clase: 'valor__nota', texto: `Área útil: ${cantidadTexto(areaM2, 'm²')}` })];
  }
  // Sin fuente: se explica por qué y cómo elegir una (design §14.5).
  const perfil = estado.perfil.resultado;
  const motivo = perfil !== null && !perfil.aptitud.apta
    ? `El perfil calculado no se puede usar. ${perfil.aptitud.error.codigo}: ${textoError(perfil.aptitud.error)}`
    : 'Todavía no hay una fuente. Calcule un perfil físico con f ≥ 0 o una figura y pulse '
      + '«Usar esta área para estimar material».';
  return [titulo,
    crear(documento, 'div', { clase: 'vacio' },
      crear(documento, 'p', { clase: 'vacio__titulo', texto: 'Sin fuente del área' }),
      crear(documento, 'p', { texto: motivo }),
      crear(documento, 'p', {},
        'Ir a ', crear(documento, 'a', { href: '#perfil', texto: 'Perfil' }),
        ' o a ', crear(documento, 'a', { href: '#figuras', texto: 'Figuras' }), '.'))];
}

function vacio(documento, estimacion) {
  if (estimacion.errores.length > 0) {
    return estadoVacio(documento, {
      idTitulo: ID_TITULO,
      titulo: 'Sin estimación',
      texto: 'Revise los mensajes del formulario. No se muestra una estimación anterior.'
    });
  }
  return estadoVacio(documento, {
    idTitulo: ID_TITULO,
    titulo: 'Todavía no hay estimación',
    texto: estimacion.fuente === null
      ? 'Elija primero una fuente del área; después escriba el precio y el adicional.'
      : 'Escriba el precio por m² y el adicional, y pulse «Calcular estimación».'
  });
}

function fila(documento, termino, definicion, total = false) {
  return crear(documento, 'div', { clase: total ? 'costos__fila costos__fila--total' : 'costos__fila' },
    crear(documento, 'dt', { texto: termino }),
    crear(documento, 'dd', { texto: definicion }));
}

function tarjetaResultado(documento, resultado) {
  return crear(documento, 'section', { clase: 'tarjeta', 'aria-labelledby': ID_TITULO },
    crear(documento, 'h2', { clase: 'tarjeta__titulo', id: ID_TITULO, texto: 'Estimación' }),
    crear(documento, 'p', { clase: 'fuente__descripcion', texto: resultado.descripcionFuente }),
    crear(documento, 'dl', { clase: 'costos' },
      fila(documento, 'Área útil', cantidadTexto(resultado.areaUtilM2, 'm²')),
      fila(documento, 'Adicional w', cantidadTexto(resultado.adicional, '%')),
      fila(documento, 'Área estimada', cantidadTexto(resultado.areaEstimadaM2, 'm²')),
      fila(documento, 'Precio', cantidadTexto(resultado.precio, 'Q/m²')),
      fila(documento, 'Costo base', quetzalesCantidad(resultado.costoBase)),
      fila(documento, 'Costo estimado', quetzalesCantidad(resultado.costoEstimado), true)),
    crear(documento, 'h3', { clase: 'subtitulo', texto: 'Supuestos de este cálculo' }),
    crear(documento, 'ul', { clase: 'avisos' },
      resultado.supuestos.map((texto) => crear(documento, 'li', { clase: 'aviso', texto }))),
    // Punto de integración de T-17: pasosEstimacion.
    pendiente(documento, 'El procedimiento de la estimación se mostrará aquí cuando se conecte en la integración final.'));
}
