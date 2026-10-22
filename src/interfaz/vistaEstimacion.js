// Vista de la estimación de material (T-14 y su revisión visual; design.md §14.5; requirements R-16, R-17 y R-23).
//
// Muestra la fuente vigente (o el motivo de que no la haya) en una banda destacada, el
// precio en Q/m², el adicional en %, el resultado y los supuestos. Los supuestos
// generales están fijos en index.html, así que se ven siempre, haya o no resultado
// (R-17.5); el resultado añade los supuestos que devuelve estimarMaterial (W-06 y, con
// datos simulados, W-05).
//
// La vista no calcula: despacha editarEstimacion y calcularEstimacion (T-13) y escribe
// el ResultadoEstimacion con presentacion/formato.js.
//
// Punto de integración (no se simula): ResultadoEstimacion no trae pasos; el
// procedimiento de la estimación (pasosEstimacion, presentacion/pasos.js) lo conecta T-17.
import { calcularEstimacion, editarEstimacion } from './estado.js';
import { cantidadTexto, fraccionTexto } from '../presentacion/formato.js';
import {
  cifra, crear, enfocar, estadoVacio, fijarValor, mostrarErrores, pendiente, porId, textoError, tituloResumen
} from './vistaComun.js';

/** Dónde se muestra cada `error.campo` de la estimación; E-MOD-04 ('estimacion') va solo al resumen. */
const CAMPOS = Object.freeze({
  precio: Object.freeze({ controles: Object.freeze(['estimacion-precio']), mensaje: 'estimacion-precio-error' }),
  adicional: Object.freeze({ controles: Object.freeze(['estimacion-adicional']), mensaje: 'estimacion-adicional-error' })
});

const NOMBRE_FIGURA = Object.freeze({ rectangulo: 'Rectángulo', triangulo: 'Triángulo', circulo: 'Círculo' });

const ID_TITULO = 'estimacion-resultados-titulo';
const ID_TITULO_FUENTE = 'estimacion-fuente-titulo';
const SVG = 'http://www.w3.org/2000/svg';

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

      // La banda de la fuente depende de la fuente elegida y de los resultados de perfil y figura.
      const origen = estimacion.fuente === null ? null : estado[estimacion.fuente].resultado;
      if (ultimo.fuente !== estimacion.fuente || ultimo.origen !== origen || ultimo.perfil !== estado.perfil.resultado) {
        fuente.replaceChildren(bandaFuente(documento, estado));
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

/** Banda de la fuente: la fuente vigente o el motivo de que no la haya (design §14.5). */
function bandaFuente(documento, estado) {
  const { fuente } = estado.estimacion;
  let etiqueta;
  let descripcion;
  let detalle;
  if (fuente === 'perfil') {
    const { modelo, intervalo, area } = estado.perfil.resultado;
    etiqueta = 'Fuente activa · perfil';
    descripcion = `Perfil f(x) = ${modelo.textoNormalizado} en [${fraccionTexto(intervalo.a)}, ${fraccionTexto(intervalo.b)}] m`;
    detalle = crear(documento, 'p', { clase: 'banda__cifra', texto: `A_geo = ${cantidadTexto(area.area, 'm²')}` });
  } else if (fuente === 'figura') {
    const { tipo, unidad, areaM2 } = estado.figura.resultado;
    etiqueta = 'Fuente activa · figura';
    descripcion = `${NOMBRE_FIGURA[tipo]} medido en ${unidad}`;
    detalle = crear(documento, 'p', { clase: 'banda__cifra', texto: `A = ${cantidadTexto(areaM2, 'm²')}` });
  } else {
    const perfil = estado.perfil.resultado;
    etiqueta = 'Sin fuente del área';
    descripcion = perfil !== null && !perfil.aptitud.apta
      ? `El perfil calculado no se puede usar. ${perfil.aptitud.error.codigo}: ${textoError(perfil.aptitud.error)}`
      : 'Calcule un perfil físico con f ≥ 0 o una figura y pulse «Usar esta área para estimar material».';
    detalle = crear(documento, 'p', { clase: 'banda__texto' },
      'Ir a ', crear(documento, 'a', { href: '#perfil', texto: 'Perfil' }),
      ' o a ', crear(documento, 'a', { href: '#figuras', texto: 'Figuras' }), '.');
  }
  return crear(documento, 'section', { clase: 'banda', 'aria-labelledby': ID_TITULO_FUENTE },
    crear(documento, 'div', { clase: 'banda__cuerpo' },
      crear(documento, 'p', { clase: 'banda__etiqueta', texto: etiqueta }),
      crear(documento, 'h2', { clase: 'banda__titulo', id: ID_TITULO_FUENTE, texto: 'Fuente del área' }),
      crear(documento, 'p', { clase: 'banda__texto', texto: descripcion }),
      detalle),
    superficieDecorativa(documento));
}

/** Lámina plana con su retícula: ilustra una superficie, no un volumen. */
function superficieDecorativa(documento) {
  const svg = documento.createElementNS(SVG, 'svg');
  for (const [nombre, valor] of [['viewBox', '0 0 170 100'], ['width', '170'], ['height', '100'],
    ['aria-hidden', 'true'], ['focusable', 'false'], ['class', 'banda__ilustracion']]) {
    svg.setAttribute(nombre, valor);
  }
  const trazos = [
    ['rect', { x: '14', y: '14', width: '142', height: '72', rx: '4', fill: 'currentColor', 'fill-opacity': '0.14', stroke: 'currentColor', 'stroke-width': '2' }],
    ['path', { d: 'M49.5 14 V 86 M 85 14 V 86 M 120.5 14 V 86 M 14 50 H 156', fill: 'none', stroke: 'currentColor', 'stroke-opacity': '0.55', 'stroke-width': '1.2' }],
    ['path', { d: 'M14 94 H 156 M 14 90 V 98 M 156 90 V 98', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.4' }]
  ];
  for (const [etiqueta, atributos] of trazos) {
    const elemento = documento.createElementNS(SVG, etiqueta);
    for (const [nombre, valor] of Object.entries(atributos)) elemento.setAttribute(nombre, valor);
    svg.append(elemento);
  }
  return svg;
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

function indicador(documento, termino, contenido, total = false) {
  return crear(documento, 'div', { clase: total ? 'indicador indicador--total' : 'indicador' },
    crear(documento, 'dt', { texto: termino }),
    crear(documento, 'dd', {}, contenido));
}

function tarjetaResultado(documento, resultado) {
  return crear(documento, 'section', { clase: 'tarjeta', 'aria-labelledby': ID_TITULO },
    crear(documento, 'div', { clase: 'resumen-perfil__cabecera' },
      crear(documento, 'h2', { clase: 'tarjeta__titulo', id: ID_TITULO, texto: 'Estimación' }),
      crear(documento, 'p', { clase: 'tarjeta__subtitulo', texto: resultado.descripcionFuente })),
    crear(documento, 'dl', { clase: 'indicadores' },
      indicador(documento, 'Área útil', cifra(documento, resultado.areaUtilM2, 'm²')),
      indicador(documento, 'Área con adicional', cifra(documento, resultado.areaEstimadaM2, 'm²')),
      indicador(documento, 'Costo base', cifra(documento, resultado.costoBase, '', { enQuetzales: true })),
      indicador(documento, 'Costo estimado', cifra(documento, resultado.costoEstimado, '', { enQuetzales: true }), true)),
    crear(documento, 'ul', { clase: 'parametros-aplicados', 'aria-label': 'Parámetros aplicados' },
      crear(documento, 'li', { clase: 'etiqueta-dato', texto: `Adicional w = ${cantidadTexto(resultado.adicional, '%')}` }),
      crear(documento, 'li', { clase: 'etiqueta-dato', texto: `Precio = ${cantidadTexto(resultado.precio, 'Q/m²')}` })),
    crear(documento, 'h3', { clase: 'subtitulo', texto: 'Supuestos de este cálculo' }),
    crear(documento, 'ul', { clase: 'avisos' },
      resultado.supuestos.map((texto) => crear(documento, 'li', { clase: 'aviso', texto }))),
    // Punto de integración de T-17: pasosEstimacion.
    pendiente(documento, 'El procedimiento de la estimación se mostrará aquí cuando se conecte en la integración final.'));
}
