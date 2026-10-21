// Caso de uso «calcular una figura» de ÁreaCalc (T-08; design.md §9, §10 y §11; R-14).
//
// calcularFigura(entrada) valida cada dimensión por separado con las reglas de la
// unidad elegida (requirements Tabla 9.3) y acumula sus errores; después calcula
// el área con nucleo/geometria.js y la lleva a m² con nucleo/unidades.js (R-14.4).
// Las fórmulas son geométricas directas, sin integración (R-14.6), y se escriben
// como en el formulario §8.
//
// El trapecio es DESEABLE y queda fuera del MVP (tasks T-D1): la interfaz no lo
// ofrece, así que un tipo 'trapecio' es un error de programación (E-SIS-02).
// Pendiente de T-12: `pasos` vale null hasta que exista presentacion/pasos.js.
import { areaCirculo, areaRectangulo, areaTriangulo } from '../nucleo/geometria.js';
import { REGLAS, conCampo, leerNumero } from '../nucleo/numeros.js';
import { areaAMetrosCuadrados, unidadDeArea } from '../nucleo/unidades.js';
import { erroresDe, exito, fracaso, protegido } from './comun.js';

/**
 * @typedef {import('../nucleo/racional.js').Racional} Racional
 * @typedef {import('../nucleo/unidades.js').Cantidad} Cantidad
 * @typedef {Object} EntradaFigura design §10.
 * @property {'rectangulo' | 'triangulo' | 'circulo'} tipo
 * @property {'cm' | 'm'} unidad
 * @property {string} [base] Rectángulo y triángulo.
 * @property {string} [altura] Rectángulo y triángulo.
 * @property {string} [radio] Círculo.
 * @typedef {Object} ResultadoFigura design §10.
 * @property {Readonly<EntradaFigura>} entrada
 * @property {string} tipo
 * @property {'cm' | 'm'} unidad
 * @property {Readonly<Record<string, Racional>>} dimensiones
 * @property {Cantidad} area En la unidad² de la figura.
 * @property {'cm²' | 'm²'} unidadArea
 * @property {Cantidad} areaM2
 * @property {{ texto: string, latex: string }} formula
 * @property {null} pasos Pendiente de T-12.
 */

/** Dimensiones de cada figura: [campo, etiqueta del mensaje]. */
const FIGURAS = Object.freeze({
  rectangulo: Object.freeze({
    dimensiones: Object.freeze([['base', 'base'], ['altura', 'altura']]),
    formula: Object.freeze({ texto: 'A = b × h', latex: 'A = b \\times h' }),
    area: (d) => areaRectangulo(d.base, d.altura)
  }),
  triangulo: Object.freeze({
    dimensiones: Object.freeze([['base', 'base'], ['altura', 'altura']]),
    formula: Object.freeze({ texto: 'A = (b × h)/2', latex: 'A = \\frac{b \\times h}{2}' }),
    area: (d) => areaTriangulo(d.base, d.altura)
  }),
  circulo: Object.freeze({
    dimensiones: Object.freeze([['radio', 'radio']]),
    formula: Object.freeze({ texto: 'A = π r²', latex: 'A = \\pi r^{2}' }),
    area: (d) => areaCirculo(d.radio)
  })
});

const REGLAS_DIMENSION = Object.freeze({ cm: REGLAS.dimensionCm, m: REGLAS.dimensionM });

/** La entrada viene de la interfaz; una forma distinta es un error de programación (E-SIS-02). */
function exigirEntrada(entrada) {
  if (entrada === null || typeof entrada !== 'object') throw new TypeError('calcularFigura: se esperaba una EntradaFigura');
  if (!Object.hasOwn(FIGURAS, entrada.tipo)) throw new TypeError(`calcularFigura: figura no admitida «${String(entrada.tipo)}»`);
  unidadDeArea(entrada.unidad); // lanza RangeError si no es 'cm' ni 'm'
  const figura = FIGURAS[entrada.tipo];
  for (const [campo] of figura.dimensiones) {
    if (typeof entrada[campo] !== 'string') throw new TypeError(`calcularFigura: «${campo}» debe ser un texto`);
  }
  return figura;
}

/**
 * Área de una figura en su unidad² y en m².
 * @param {EntradaFigura} entrada
 * @returns {import('./comun.js').Resultado} Con `valor` ResultadoFigura si es válido.
 */
export function calcularFigura(entrada) {
  return protegido(() => {
    const figura = exigirEntrada(entrada);
    const reglas = REGLAS_DIMENSION[entrada.unidad];
    const lecturas = figura.dimensiones.map(([campo, etiqueta]) => [
      campo, leerNumero(entrada[campo], conCampo(reglas, campo, etiqueta))
    ]);
    const errores = lecturas.flatMap(([, lectura]) => erroresDe(lectura));
    if (errores.length > 0) return fracaso(errores);
    const dimensiones = Object.freeze(Object.fromEntries(lecturas.map(([campo, lectura]) => [campo, lectura.valor])));
    const area = figura.area(dimensiones);
    const copia = { tipo: entrada.tipo, unidad: entrada.unidad };
    for (const [campo] of figura.dimensiones) copia[campo] = entrada[campo];
    return exito({
      entrada: Object.freeze(copia),
      tipo: entrada.tipo,
      unidad: entrada.unidad,
      dimensiones,
      area,
      unidadArea: unidadDeArea(entrada.unidad),
      areaM2: areaAMetrosCuadrados(area, entrada.unidad),
      formula: figura.formula,
      pasos: null // T-12
    });
  });
}
