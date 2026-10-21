// Caso de uso «analizar un perfil» de ÁreaCalc (T-08; design.md §4, §9, §10 y §11).
//
// analizarPerfil(entrada) une los módulos existentes sin repetir ningún cálculo:
//   1. función, a y b se validan por separado y se acumulan todos sus errores;
//      E-INT-01 y E-INT-02 solo se comprueban si a y b son válidos, y los límites
//      nunca se intercambian (expresiones/normalizar.js, nucleo/numeros.js);
//   2. con errores, se devuelven y no se calcula nada;
//   3. integral, análisis de signo, área, promedio y rectángulo, en ese orden
//      (nucleo/integral.js, ceros.js, area.js y promedio.js);
//   4. aptitud para estimar (design §9) y advertencias W-01 a W-04 y W-09.
// Todas las decisiones (signo, área cero, aptitud) son exactas: no se convierte
// ningún resultado a Number.
//
// Pendiente de otras tareas (design §4, pasos 8 y 9): `pasos` lo producirá
// presentacion/pasos.js (T-12) y `grafica`, presentacion/datosGrafica.js (T-15).
// Hasta que existan y T-17 los conecte aquí, los dos campos valen null; no se
// inventan pasos ni puntos de la gráfica.
import { analizarSigno } from '../nucleo/ceros.js';
import { areaGeometrica } from '../nucleo/area.js';
import { crearAdvertencia, crearError } from '../nucleo/errores.js';
import { integrarDefinida } from '../nucleo/integral.js';
import { leerIntervalo } from '../nucleo/numeros.js';
import { rectanguloEquivalente, valorPromedio } from '../nucleo/promedio.js';
import * as racional from '../nucleo/racional.js';
import { unidadesDe } from '../nucleo/unidades.js';
import { interpretarFuncion } from '../expresiones/normalizar.js';
import { errorInterno, erroresDe, exito, fracaso, protegido } from './comun.js';

/**
 * @typedef {import('../nucleo/racional.js').Racional} Racional
 * @typedef {import('../nucleo/errores.js').ErrorAreaCalc} ErrorAreaCalc
 * @typedef {import('../nucleo/errores.js').Advertencia} Advertencia
 * @typedef {import('../nucleo/ceros.js').AnalisisSigno} AnalisisSigno
 * @typedef {import('../nucleo/integral.js').IntegralDefinida} IntegralDefinida
 * @typedef {import('../nucleo/area.js').AreaGeometrica} AreaGeometrica
 * @typedef {import('../nucleo/promedio.js').RectanguloEquivalente} RectanguloEquivalente
 * @typedef {import('../expresiones/normalizar.js').ModeloValidado} ModeloValidado
 * @typedef {Object} EntradaPerfil design §10.
 * @property {string} textoFuncion
 * @property {string} textoA
 * @property {string} textoB
 * @property {'abstracta' | 'fisica'} interpretacion
 * @typedef {Object} Aptitud design §10 y §9.
 * @property {boolean} apta
 * @property {'E-MOD-01' | 'E-MOD-02' | 'E-MOD-03' | null} motivo
 * @property {ErrorAreaCalc | null} error El error del motivo, para que la interfaz lo
 *   muestre sin importar el núcleo (añadido a design §10).
 * @typedef {Object} ResultadoPerfil design §10.
 * @property {Readonly<EntradaPerfil>} entrada Copia de los textos usados (R-11.1).
 * @property {ModeloValidado} modelo
 * @property {{ a: Racional, b: Racional }} intervalo
 * @property {{ x: string, y: string, area: string, estimable: boolean }} unidades
 * @property {IntegralDefinida} integral
 * @property {AnalisisSigno} analisis
 * @property {AreaGeometrica} area `area.area` es la Cantidad A_geo.
 * @property {{ longitud: Racional, fProm: Racional }} promedio
 * @property {RectanguloEquivalente} rectangulo
 * @property {Aptitud} aptitud
 * @property {null} pasos Pendiente de T-12 (pasosArea y pasosPromedio).
 * @property {null} grafica Pendiente de T-15 (datosGrafica).
 * @property {ReadonlyArray<Advertencia>} advertencias
 */

const CAMPOS_TEXTO = Object.freeze(['textoFuncion', 'textoA', 'textoB']);

/** La entrada viene de la interfaz; una forma distinta es un error de programación (E-SIS-02). */
function exigirEntrada(entrada) {
  if (entrada === null || typeof entrada !== 'object') throw new TypeError('analizarPerfil: se esperaba una EntradaPerfil');
  for (const campo of CAMPOS_TEXTO) {
    if (typeof entrada[campo] !== 'string') throw new TypeError(`analizarPerfil: «${campo}» debe ser un texto`);
  }
  return unidadesDe(entrada.interpretacion); // lanza RangeError si no es 'abstracta' ni 'fisica'
}

const aptitud = (apta, motivo) => Object.freeze({ apta, motivo, error: motivo === null ? null : crearError(motivo) });

/**
 * Aptitud para estimar material (design §9; R-16), decidida de forma exacta.
 * Un perfil no negativo no tiene cortes aproximados, así que su área es exacta.
 */
function aptitudEstimacion(unidades, analisis, area) {
  if (!unidades.estimable) return aptitud(false, 'E-MOD-01');
  if (!analisis.noNegativa) return aptitud(false, 'E-MOD-02');
  if (area.area.clase !== 'exacta') throw errorInterno('un perfil no negativo dio un área aproximada');
  if (racional.esCero(area.area.valor)) return aptitud(false, 'E-MOD-03');
  return aptitud(true, null);
}

/**
 * Advertencias del análisis (requirements §10): W-01 si cambia de signo, W-02 por
 * cada tangencia, W-03 por cada cero en un extremo, W-04 si hay ceros aproximados
 * y W-09 si f ≡ 0. Los valores van como fracción exacta (racional.aTexto); su
 * formato decimal será trabajo de presentacion/formato.js (T-11).
 */
function advertenciasDe(analisis, area) {
  const lista = [];
  if (analisis.cambiaSigno) lista.push(crearAdvertencia('W-01'));
  for (const cero of analisis.ceros) {
    if (cero.tipo === 'tangencia') lista.push(crearAdvertencia('W-02', { x: racional.aTexto(cero.valor) }));
  }
  for (const cero of analisis.ceros) {
    if (cero.tipo === 'extremo') lista.push(crearAdvertencia('W-03', { x: racional.aTexto(cero.valor) }));
  }
  if (analisis.hayAproximaciones) {
    if (area.area.clase !== 'aproximada') throw errorInterno('hay ceros aproximados y el área no es aproximada');
    lista.push(crearAdvertencia('W-04', { cota: racional.aTexto(area.area.cota) }));
  }
  if (analisis.identicamenteCero) lista.push(crearAdvertencia('W-09'));
  return Object.freeze(lista);
}

/**
 * Analiza el perfil y = f(x) en [a, b] (design §4).
 * @param {EntradaPerfil} entrada
 * @returns {import('./comun.js').Resultado} Con `valor` ResultadoPerfil si es válido.
 */
export function analizarPerfil(entrada) {
  return protegido(() => {
    const unidades = exigirEntrada(entrada);
    // 1. Validación por campos, con los errores acumulados (design §11).
    const funcion = interpretarFuncion(entrada.textoFuncion);
    const limites = leerIntervalo(entrada.textoA, entrada.textoB);
    const errores = [...erroresDe(funcion), ...erroresDe(limites)];
    // 2. Con errores no se calcula nada.
    if (errores.length > 0) return fracaso(errores);
    const modelo = funcion.valor;
    const intervalo = limites.valor;
    const { a, b } = intervalo;
    const f = modelo.polinomio;
    // 3. Cálculo; PresupuestoAgotado y cualquier otra excepción los convierte `protegido`.
    const integral = integrarDefinida(f, a, b);
    const analisis = analizarSigno(f, a, b);
    const area = areaGeometrica(integral, analisis);
    const promedio = valorPromedio(integral.I, a, b);
    const rectangulo = rectanguloEquivalente(analisis, promedio.fProm, a, b);
    // 4. Aptitud y advertencias.
    const advertencias = advertenciasDe(analisis, area);
    return exito({
      entrada: Object.freeze({
        textoFuncion: entrada.textoFuncion, textoA: entrada.textoA, textoB: entrada.textoB,
        interpretacion: entrada.interpretacion
      }),
      modelo,
      intervalo,
      unidades,
      integral,
      analisis,
      area,
      promedio,
      rectangulo,
      aptitud: aptitudEstimacion(unidades, analisis, area),
      pasos: null, // T-12
      grafica: null, // T-15
      advertencias
    }, advertencias);
  });
}
