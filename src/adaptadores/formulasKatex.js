// Adaptador de fórmulas con KaTeX (T-16; design.md §2, §13 y §14.4; requirements R-09.8).
//
// El texto va primero: la vista escribe `paso.texto` (o el texto de la fórmula) en el
// elemento y deja el LaTeX en `data-latex`. Este adaptador solo MEJORA ese elemento:
//   - mejorar(elemento, latex) carga KaTeX y su CSS local de forma diferida (import()),
//     dibuja la fórmula en un elemento TEMPORAL con
//     { throwOnError: true, trust: false, output: 'htmlAndMathml' } y, solo si eso
//     funcionó, reemplaza el contenido del elemento. Si falla la carga (de KaTeX o de su
//     CSS) o la fórmula, el elemento conserva su texto y la promesa resuelve W-08.
//   - mejorarDentro(raiz) hace lo mismo con cada [data-latex] de la raíz y devuelve un
//     resumen con UN solo aviso W-08 si alguna falló, para mostrarlo una vez.
//   - cancelar(elemento) invalida una mejora pendiente.
// Las promesas NUNCA se rechazan.
//
// Solo se representa el LaTeX que genera la aplicación (pasos.js, formato.js y
// normalizar.js lo escriben desde el polinomio validado, R-20.5). El texto del usuario
// no se pasa nunca como LaTeX: mejorarDentro solo lee `data-latex`, nunca el texto.
//
// Pendientes: cada elemento lleva una generación. Si llega otra mejora o cancelar()
// antes de terminar, o el elemento ya no está en el documento (la vista lo retiró al
// editar), la operación vieja termina como 'cancelada' sin tocar nada.
//
// Este módulo solo importa `katex` (design §2).

/**
 * W-08 del catálogo de requirements §10 (nucleo/errores.js). El adaptador no puede
 * importar el núcleo (design §2); la prueba comprueba que el texto coincide.
 */
export const AVISO_W08 = Object.freeze({
  codigo: 'W-08',
  mensaje: 'La representación enriquecida no está disponible; las fórmulas se muestran en texto.'
});

/** Opciones de design §14.4. `trust: false` explícito: sin \href ni comandos similares. */
export const OPCIONES_KATEX = Object.freeze({ throwOnError: true, trust: false, output: 'htmlAndMathml' });

/** Marca del elemento ya mejorado. */
const MARCA = 'data-katex';

const CANCELADA = Object.freeze({ estado: 'cancelada' });
const MEJORADA = Object.freeze({ estado: 'mejorada' });
const OMITIDA = Object.freeze({ estado: 'omitida' });

/** KaTeX y su CSS, empaquetados localmente por Vite (design §13). */
function cargarPredeterminado() {
  return Promise.all([import('katex'), import('katex/dist/katex.min.css')]).then(([modulo]) => modulo);
}

const informarPredeterminado = (mensaje, error) => console.error(mensaje, error);

/**
 * Crea un adaptador independiente. El módulo exporta uno ya creado (mejorar,
 * mejorarDentro y cancelar); las pruebas crean otros con KaTeX simulado.
 * @param {{ cargarModulo?: () => Promise<unknown>, informar?: (mensaje: string, error: unknown) => void }} [dependencias]
 */
export function crearFormulasKatex({ cargarModulo = cargarPredeterminado, informar = informarPredeterminado } = {}) {
  /** @type {Promise<{ render: Function }> | null} */
  let carga = null;
  /** elemento → generación de su última mejora pedida */
  const generaciones = new WeakMap();

  function cargar() {
    if (carga === null) {
      carga = Promise.resolve()
        .then(cargarModulo)
        .then((modulo) => {
          const katex = modulo?.default ?? modulo;
          if (typeof katex?.render !== 'function') throw new TypeError('formulasKatex: el módulo cargado no expone katex.render');
          return katex;
        });
      // Si falla, la próxima mejora vuelve a intentarlo; quien espera atiende el rechazo.
      carga.catch(() => {
        carga = null;
      });
    }
    return carga;
  }

  function fallar(etapa, error) {
    informar(`formulasKatex: ${AVISO_W08.codigo} (${etapa}); se conserva el texto.`, error);
    return Object.freeze({ estado: 'fallida', etapa, aviso: AVISO_W08 });
  }

  async function mejorarSinProteger(elemento, latex) {
    const generacion = (generaciones.get(elemento) ?? 0) + 1;
    generaciones.set(elemento, generacion);
    const vigente = () => generaciones.get(elemento) === generacion && elemento.isConnected !== false;

    if (latex === null || latex === undefined || latex === '') return OMITIDA; // el paso solo tiene texto
    if (typeof latex !== 'string') return fallar('datos', new TypeError('formulasKatex: el LaTeX debe ser un texto'));

    let katex;
    try {
      katex = await cargar();
    } catch (error) {
      return vigente() ? fallar('carga', error) : CANCELADA;
    }
    if (!vigente()) return CANCELADA;

    // Primero en un elemento temporal: si KaTeX lanza, el elemento original no cambia.
    const temporal = elemento.ownerDocument.createElement('span');
    try {
      katex.render(latex, temporal, { ...OPCIONES_KATEX });
    } catch (error) {
      return fallar('formula', error);
    }
    elemento.replaceChildren(...Array.from(temporal.childNodes));
    elemento.setAttribute(MARCA, 'mejorada');
    return MEJORADA;
  }

  /**
   * Mejora el texto del elemento con la fórmula de `latex` (design §14.4). Nunca se rechaza.
   * @param {HTMLElement} elemento Ya contiene la versión en texto (R-09.8).
   * @param {string | null} latex Generado por la aplicación; null o '' no hace nada.
   * @returns {Promise<Readonly<{ estado: 'mejorada' | 'omitida' | 'cancelada' | 'fallida',
   *   etapa?: 'datos' | 'carga' | 'formula' | 'interna', aviso?: typeof AVISO_W08 }>>}
   */
  function mejorar(elemento, latex) {
    return mejorarSinProteger(elemento, latex).catch((error) => fallar('interna', error));
  }

  /**
   * Mejora todos los [data-latex] de la raíz y resume el resultado con un solo aviso.
   * @param {ParentNode} raiz
   * @returns {Promise<Readonly<{ total: number, mejoradas: number, fallidas: number, canceladas: number,
   *   aviso: typeof AVISO_W08 | null }>>}
   */
  async function mejorarDentro(raiz) {
    let elementos;
    try {
      elementos = Array.from(raiz.querySelectorAll('[data-latex]'));
    } catch (error) {
      informar('formulasKatex: no se pudieron buscar las fórmulas.', error);
      return Object.freeze({ total: 0, mejoradas: 0, fallidas: 1, canceladas: 0, aviso: AVISO_W08 });
    }
    const resultados = await Promise.all(elementos.map((elemento) => mejorar(elemento, elemento.getAttribute('data-latex'))));
    const contar = (estado) => resultados.filter((r) => r.estado === estado).length;
    const fallidas = contar('fallida');
    return Object.freeze({
      total: elementos.length,
      mejoradas: contar('mejorada'),
      fallidas,
      canceladas: contar('cancelada'),
      aviso: fallidas > 0 ? AVISO_W08 : null
    });
  }

  /**
   * Invalida una mejora pendiente del elemento: al terminar, no lo tocará. Nunca lanza.
   * @param {HTMLElement} elemento
   */
  function cancelar(elemento) {
    try {
      generaciones.set(elemento, (generaciones.get(elemento) ?? 0) + 1);
    } catch (error) {
      informar('formulasKatex: no se pudo cancelar.', error);
    }
  }

  return Object.freeze({ mejorar, mejorarDentro, cancelar });
}

// ── Adaptador de la aplicación ───────────────────────────────────────

const adaptador = crearFormulasKatex();

/** Mejora un elemento con su fórmula; W-08 y el texto intacto si falla. */
export const mejorar = adaptador.mejorar;
/** Mejora todos los [data-latex] de una raíz, con un solo W-08 en el resumen. */
export const mejorarDentro = adaptador.mejorarDentro;
/** Cancela una mejora pendiente. */
export const cancelar = adaptador.cancelar;
