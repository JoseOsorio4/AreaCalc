// Caso de uso «estimar material» de ÁreaCalc (T-08; design.md §9, §10 y §11; R-16 y R-17).
//
// estimarMaterial(entrada) toma el área útil de una fuente apta, ya en m², y
// calcula con nucleo/materiales.js el área estimada y los costos, todo exacto:
// el redondeo a centavos solo ocurre al presentar (R-17.3).
//   - Sin fuente o sin resultado: E-MOD-04 (R-17.6).
//   - Perfil no apto: el motivo de su aptitud, E-MOD-01, E-MOD-02 o E-MOD-03.
//     Nunca se usa la integral con signo (R-16.4): el área útil es A_geo.
//   - Figura válida: siempre es apta (R-16.1); su área ya está en m² (R-15.5).
//   - Precio y adicional se validan por separado y se acumulan sus errores.
// Que la fuente siga vigente lo garantiza el estado de la interfaz (T-13; D-04).
import { crearAdvertencia, crearError } from '../nucleo/errores.js';
import { estimarMaterial as calcularEstimacion } from '../nucleo/materiales.js';
import { REGLAS, conCampo, leerNumero } from '../nucleo/numeros.js';
import { errorInterno, erroresDe, exito, fracaso, protegido } from './comun.js';

/**
 * @typedef {import('../nucleo/racional.js').Racional} Racional
 * @typedef {import('../nucleo/unidades.js').Cantidad} Cantidad
 * @typedef {Object} EntradaEstimacion design §10.
 * @property {{ tipo: 'perfil' | 'figura', resultado: object | null } | null} fuente
 *   `resultado` es el ResultadoPerfil o el ResultadoFigura vigente.
 * @property {string} textoPrecio
 * @property {string} textoAdicional
 * @property {boolean} [datosSimulados] Añade W-05 a los supuestos; lo fija la interfaz
 *   al cargar un caso práctico simulado (añadido a design §10).
 * @typedef {Object} ResultadoEstimacion design §10.
 * @property {string} descripcionFuente Por ejemplo «Perfil x²/4 + 2 en [0, 4] m».
 * @property {Cantidad} areaUtilM2
 * @property {Cantidad} adicional w, en %.
 * @property {Racional} factorAdicional 1 + w/100, para los pasos (añadido a design §10).
 * @property {Cantidad} areaEstimadaM2
 * @property {Cantidad} precio Q/m².
 * @property {Cantidad} costoBase Q.
 * @property {Cantidad} costoEstimado Q.
 * @property {ReadonlyArray<string>} supuestos Textos de W-06 y, si corresponde, W-05.
 */

const REGLAS_PRECIO = conCampo(REGLAS.precio, 'precio', 'precio');
const REGLAS_ADICIONAL = conCampo(REGLAS.adicional, 'adicional', 'adicional');
const exacta = (valor) => Object.freeze({ clase: 'exacta', valor });

const NOMBRE_FIGURA = Object.freeze({ rectangulo: 'Rectángulo', triangulo: 'Triángulo', circulo: 'Círculo' });

/** Descripción de una figura con los textos que escribió el usuario, ya validados. */
function describirFigura(figura) {
  const { entrada, tipo, unidad } = figura;
  if (!Object.hasOwn(NOMBRE_FIGURA, tipo)) throw errorInterno(`figura desconocida «${String(tipo)}»`);
  if (tipo === 'circulo') return `${NOMBRE_FIGURA[tipo]} de radio ${entrada.radio.trim()} ${unidad}`;
  return `${NOMBRE_FIGURA[tipo]} de base ${entrada.base.trim()} ${unidad} y altura ${entrada.altura.trim()} ${unidad}`;
}

/**
 * Área útil en m² y descripción de la fuente, o el error E-MOD que impide estimar.
 * @returns {{ areaUtil: Cantidad, descripcion: string } | { error: object }}
 */
function areaDeLaFuente(fuente) {
  const { tipo, resultado } = fuente;
  if (tipo === 'perfil') {
    const { aptitud } = resultado;
    if (typeof aptitud?.apta !== 'boolean') throw errorInterno('el perfil no tiene aptitud');
    if (!aptitud.apta) return { error: crearError(aptitud.motivo) };
    if (resultado.unidades.area !== 'm²' || resultado.area.area.clase !== 'exacta') {
      throw errorInterno('un perfil apto debe tener un área exacta en m²');
    }
    const { textoA, textoB } = resultado.entrada;
    return {
      areaUtil: resultado.area.area,
      descripcion: `Perfil ${resultado.modelo.textoNormalizado} en [${textoA.trim()}, ${textoB.trim()}] m`
    };
  }
  if (tipo === 'figura') return { areaUtil: resultado.areaM2, descripcion: describirFigura(resultado) };
  throw errorInterno(`fuente desconocida «${String(tipo)}»`);
}

/**
 * Estimación teórica de material y costo (design §9).
 * @param {EntradaEstimacion} entrada
 * @returns {import('./comun.js').Resultado} Con `valor` ResultadoEstimacion si es válido.
 */
export function estimarMaterial(entrada) {
  return protegido(() => {
    if (entrada === null || typeof entrada !== 'object') throw new TypeError('estimarMaterial: se esperaba una EntradaEstimacion');
    if (typeof entrada.textoPrecio !== 'string' || typeof entrada.textoAdicional !== 'string') {
      throw new TypeError('estimarMaterial: el precio y el adicional deben ser textos');
    }
    // La fuente es una condición previa: sin una fuente apta no se valida nada más (R-17.6).
    if (entrada.fuente === null || entrada.fuente === undefined
      || entrada.fuente.resultado === null || entrada.fuente.resultado === undefined) {
      return fracaso([crearError('E-MOD-04')]);
    }
    const fuente = areaDeLaFuente(entrada.fuente);
    if ('error' in fuente) return fracaso([fuente.error]);
    const precio = leerNumero(entrada.textoPrecio, REGLAS_PRECIO);
    const adicional = leerNumero(entrada.textoAdicional, REGLAS_ADICIONAL);
    const errores = [...erroresDe(precio), ...erroresDe(adicional)];
    if (errores.length > 0) return fracaso(errores);
    const estimacion = calcularEstimacion(fuente.areaUtil, precio.valor, adicional.valor);
    const avisos = [crearAdvertencia('W-06'), ...(entrada.datosSimulados === true ? [crearAdvertencia('W-05')] : [])];
    return exito({
      descripcionFuente: fuente.descripcion,
      areaUtilM2: estimacion.areaUtil,
      adicional: exacta(adicional.valor),
      factorAdicional: estimacion.factorAdicional,
      areaEstimadaM2: estimacion.areaEstimada,
      precio: exacta(precio.valor),
      costoBase: estimacion.costoBase,
      costoEstimado: estimacion.costoEstimado,
      supuestos: Object.freeze(avisos.map((aviso) => aviso.mensaje))
    }, avisos);
  });
}
