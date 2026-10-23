// Procedimientos paso a paso de ÁreaCalc (T-12; design.md §10 y §14.2; requirements R-09;
// formulario §2, §4.2, §5.2, §7.2 y §8).
//
// Este archivo SOLO FORMATEA los datos que ya calcularon el núcleo y los casos de uso
// (R-09.1, R-24.2): no integra, no busca ceros, no decide signos, no suma tramos ni
// calcula costos. Cada número sale de un campo del resultado:
//   F(b) y F(a), con sus términos ........ integral.terminos[].valorEnB / valorEnA, Fb, Fa
//   I ...................................... integral.I
//   tramos, |Iₖ| y A_geo ................... area.tramos y area.area
//   ceros, tipos y signo de cada tramo ..... analisis
//   f_prom, b − a y el rectángulo .......... promedio y rectangulo
//   áreas de figuras y costos .............. ResultadoFigura y ResultadoEstimacion
// Los textos usan presentacion/formato.js (T-11). Ningún paso lleva «+C» (R-09.7).
//
// Procedimientos (design §14.2):
//   área sin cambio de signo  datos, desarrollo (si huboDesarrollo), signo, planteamiento,
//                             antiderivada, limiteSuperior, limiteInferior, resta, resultado,
//                             interpretacion
//   área con cambio de signo  datos, desarrollo, signo, planteamiento, antiderivada, ceros,
//                             un tramo por cada uno, suma, comparacion, resultado, interpretacion
//   valor promedio            formula, sustitucion, integral, division, unidades, interpretacion
//   figura                    datos, formula, sustitucion, resultado, conversion (si es en cm)
//   estimación                areaUtil, adicional, costoBase, costoEstimado, supuestos
//
// La antiderivada se escribe por potencia descendente (design §14.1); su explicación
// muestra el orden ascendente de los apuntes (x + x³/3), que es el mismo polinomio.
// Un tramo se escribe como Iₖ = F(rₖ) − F(rₖ₋₁) con su valor: el núcleo no entrega F
// en los cortes interiores, y evaluarlo aquí sería volver a calcular.
import * as racional from '../nucleo/racional.js';
import {
  aDecimal, cantidadTexto, cotaLatex, decimalConSimboloLatex, esDecimalExacto, fraccionLatex, fraccionTexto,
  monomioTexto, multiploPiLatex, multiploPiTexto, polinomioLatex, polinomioTexto, quetzales,
  quetzalesCantidad, sustitucionLatex, sustitucionTexto
} from './formato.js';

/**
 * @typedef {Object} Paso design §10.
 * @property {string} id Identificador del paso (design §14.2), p. ej. 'limiteSuperior'.
 * @property {string} titulo
 * @property {string} texto Versión en Unicode, siempre presente (R-09.8).
 * @property {string | null} latex Generada desde el modelo, nunca desde el texto del
 *   usuario (R-20.5); null en los pasos que solo explican.
 * @property {string | null} explicacion
 * @typedef {import('../nucleo/racional.js').Racional} Racional
 * @typedef {import('../nucleo/unidades.js').Cantidad} Cantidad
 */

const MENOS = '\u2212';
const SUPERINDICES = Object.freeze(['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']);
const SUBINDICES = Object.freeze(['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉']);
const cifras = (n, tabla) => [...`${n}`].map((d) => tabla[d.charCodeAt(0) - 48]).join('');
const sub = (n) => cifras(n, SUBINDICES);

const UNIDADES_LATEX = Object.freeze({
  u: '\\text{u}', 'u²': '\\text{u}^{2}', m: '\\text{m}', 'm²': '\\text{m}^{2}', cm: '\\text{cm}', 'cm²': '\\text{cm}^{2}'
});

/** Paso congelado (design §10). */
function paso(id, titulo, texto, latex = null, explicacion = null) {
  return Object.freeze({ id, titulo, texto, latex, explicacion });
}

/** Estilos de escritura: texto Unicode o LaTeX. */
const TEXTO = Object.freeze({
  menos: MENOS,
  fraccion: fraccionTexto,
  base: sustitucionTexto,
  restando: (r) => (racional.signo(r) < 0 ? `(${fraccionTexto(r)})` : fraccionTexto(r)),
  potencia: (base, k) => `${base}${cifras(k, SUPERINDICES)}`,
  producto: (a, b) => `${a}·${b}`,
  cociente: (n, d) => `${n}/${d}`
});
const LATEX = Object.freeze({
  menos: '-',
  fraccion: fraccionLatex,
  base: sustitucionLatex,
  restando: (r) => (racional.signo(r) < 0 ? `\\left(${fraccionLatex(r)}\\right)` : fraccionLatex(r)),
  potencia: (base, k) => `${base}^{${k}}`,
  producto: (a, b) => `${a} \\cdot ${b}`,
  cociente: (n, d) => `\\frac{${n}}{${d}}`
});

/**
 * Une términos que ya llevan su signo («x³», «−4x²/3», «2/3») con « + » o « − »:
 * «x³ − 4x²/3 + 2/3». Solo es escritura: no suma nada.
 */
function unir(partes, estilo) {
  return partes.map((parte, i) => {
    if (i === 0) return parte;
    return parte.startsWith(estilo.menos) ? ` ${estilo.menos} ${parte.slice(estilo.menos.length)}` : ` + ${parte}`;
  }).join('');
}

/** Elimina las igualdades repetidas: «F(1) = 1/2 = 1/2» → «F(1) = 1/2». */
const cadena = (miembros) => miembros.filter((m, i) => i === 0 || m !== miembros[i - 1]).join(' = ');

/** «A_geo = 1 u²», o «A_geo ≈ 2.4379 u² (…)» si la cantidad ya empieza con «≈». */
const igual = (nombre, valor) => (valor.startsWith('≈') ? `${nombre} ${valor}` : `${nombre} = ${valor}`);

const intervaloTexto = ({ a, b }) => `[${fraccionTexto(a)}, ${fraccionTexto(b)}]`;
const exacta = (valor) => ({ clase: 'exacta', valor });

/** Unidad en LaTeX. */
function unidadLatex(unidad) {
  if (!Object.hasOwn(UNIDADES_LATEX, unidad)) throw new RangeError(`pasos: unidad sin LaTeX «${String(unidad)}»`);
  return UNIDADES_LATEX[unidad];
}

const decimalLatex = (r) => aDecimal(r).replace(MENOS, '-');

/** Cantidad con unidad en LaTeX, como cantidadTexto de formato.js. */
function cantidadLatex(cantidad, unidad) {
  const u = unidadLatex(unidad);
  switch (cantidad.clase) {
    case 'exacta':
      return racional.esEntero(cantidad.valor)
        ? `${fraccionLatex(cantidad.valor)}\\,${u}`
        : `${fraccionLatex(cantidad.valor)} ${decimalConSimboloLatex(cantidad.valor)}\\,${u}`;
    case 'multiploPi':
      return `${multiploPiLatex(cantidad.coeficiente)} \\approx ${decimalLatex(cantidad.aprox)}\\,${u}`;
    case 'aproximada':
      return `\\approx ${decimalLatex(cantidad.valor)}\\,${u}\\ (\\text{cota} \\le ${cotaLatex(cantidad.cota)})`;
    default:
      throw new TypeError('pasos: se esperaba una Cantidad');
  }
}

// ── Piezas del procedimiento del área ────────────────────────────────

/** f entre paréntesis si tiene varios términos o empieza con signo: «(x³ − 1)», «x». */
function integrando(modelo, estilo) {
  const t = estilo === TEXTO ? modelo.textoNormalizado : modelo.latexNormalizado;
  if (!(t.includes(' ') || t.startsWith(estilo.menos))) return t;
  return estilo === TEXTO ? `(${t})` : `\\left(${t}\\right)`;
}

function integralTexto({ a, b }, modelo) {
  return `∫[${fraccionTexto(a)},${fraccionTexto(b)}] ${integrando(modelo, TEXTO)} dx`;
}

function integralLatex({ a, b }, modelo) {
  return `\\int_{${fraccionLatex(a)}}^{${fraccionLatex(b)}} ${integrando(modelo, LATEX)}\\,dx`;
}

/** c·vᵏ con v sustituido y su signo: «4⁴/4», «−4», «2·4», «(−1)³/3», «5·2⁴/4». */
function terminoSustituido(c, k, v, estilo) {
  const potencia = k === 1 ? estilo.base(v) : estilo.potencia(estilo.base(v), k);
  const p = c.num < 0n ? -c.num : c.num;
  const numerador = p === 1n ? potencia : estilo.producto(`${p}`, potencia);
  const cuerpo = c.den === 1n ? numerador : estilo.cociente(numerador, `${c.den}`);
  return `${c.num < 0n ? estilo.menos : ''}${cuerpo}`;
}

/**
 * F(v) con sus sustituciones, los valores de cada término y el total, todos del núcleo:
 * «F(4) = 4⁴/4 − 4 = 64 − 4 = 60» (design §14.2). F(0) = 0 por construcción.
 * @param {(t: object) => Racional} valorDe valorEnB o valorEnA de cada término.
 */
function evaluacion(integral, v, valorDe, total, estilo) {
  const nombre = `F(${estilo.fraccion(v)})`;
  if (racional.esCero(v) || integral.terminos.length === 0) return `${nombre} = ${estilo.fraccion(total)}`;
  const sustituido = unir(integral.terminos.map((t) => terminoSustituido(t.coefAntiderivada, t.potencia, v, estilo)), estilo);
  const valores = unir(integral.terminos.map((t) => estilo.fraccion(valorDe(t))), estilo);
  return cadena([nombre, sustituido, valores, estilo.fraccion(total)]);
}

/** La antiderivada en orden ascendente, como en los apuntes, si difiere del descendente. */
function antiderivadaAscendente(F) {
  const terminos = F.coef.map((c, k) => [c, k]).filter(([c]) => !racional.esCero(c));
  if (terminos.length < 2) return null;
  return unir(terminos.map(([c, k]) => monomioTexto(c, k)), TEXTO);
}

/** Notas sobre los ceros que no dividen el intervalo: extremos y tangencias. */
function notasDeCeros(ceros) {
  return ceros.map((cero) => {
    const x = fraccionTexto(cero.valor);
    if (cero.tipo === 'extremo') return `f(${x}) = 0 (cero en el extremo)`;
    if (cero.tipo === 'tangencia') return `f(${x}) = 0 sin cambiar de signo (tangencia)`;
    return null;
  }).filter((nota) => nota !== null);
}

/** Paso «signo»: describe el análisis ya hecho por ceros.js (R-09.2, punto 2). */
function pasoSigno({ analisis, intervalo }) {
  const I = intervaloTexto(intervalo);
  let texto;
  if (analisis.identicamenteCero) {
    texto = `f(x) = 0 en todo ${I}: la curva coincide con el eje X, así que A_geo = I = 0.`;
  } else if (analisis.cambiaSigno) {
    texto = `f cambia de signo en ${I}: la integral con signo no es el área, así que hay que dividir en tramos.`;
  } else {
    const positiva = analisis.tramos[0].signo > 0;
    const notas = notasDeCeros(analisis.ceros);
    const estricto = positiva ? 'f(x) > 0' : 'f(x) < 0';
    const conclusion = positiva ? `f(x) ≥ 0 en ${I}, así que A_geo = I` : `f(x) ≤ 0 en ${I}, así que A_geo = ${MENOS}I`;
    texto = notas.length === 0
      ? `${estricto} en todo ${I}, así que A_geo = ${positiva ? 'I' : `${MENOS}I`}.`
      : `${notas.join('; ')}; en el resto de ${I}, ${estricto} → ${conclusion}.`;
  }
  return paso('signo', 'Análisis de signo', texto, null,
    'El signo se decidió de forma exacta (Sturm, mcd y evaluación con fracciones), sin muestrear puntos.');
}

function pasoDatos({ modelo, intervalo, unidades }) {
  const interpretacion = unidades.estimable
    ? `perfil físico (x y f(x) en ${unidades.x}; área en ${unidades.area})`
    : `unidades abstractas (${unidades.x}, ${unidades.area})`;
  return paso('datos', 'Datos',
    `f(x) = ${modelo.textoNormalizado},  [a, b] = ${intervaloTexto(intervalo)},  ${interpretacion}`,
    `f(x) = ${modelo.latexNormalizado},\\quad [a, b] = [${fraccionLatex(intervalo.a)}, ${fraccionLatex(intervalo.b)}]`);
}

/** Paso «desarrollo» (R-09.5): el texto del usuario se muestra solo como texto (R-20.5). */
function pasoDesarrollo({ modelo }) {
  return paso('desarrollo', 'Desarrollo a la forma normalizada',
    `${modelo.textoOriginal.trim()} = ${modelo.textoNormalizado}`,
    `f(x) = ${modelo.latexNormalizado}`,
    'Se desarrollan los productos y las potencias para escribir f como suma de términos c·xⁿ.');
}

function pasoAntiderivada({ integral }) {
  const F = integral.antiderivada;
  const ascendente = antiderivadaAscendente(F);
  const orden = ascendente === null || ascendente === polinomioTexto(F)
    ? ''
    : ` Los términos van de mayor a menor potencia; en los apuntes puede escribirse ${ascendente}, que es la misma antiderivada (el orden de una suma no cambia su valor).`;
  return paso('antiderivada', 'Antiderivada', `F(x) = ${polinomioTexto(F)}   (regla de la potencia y linealidad)`,
    `F(x) = ${polinomioLatex(F)}`,
    `Cada término c·xⁿ pasa a c·xⁿ⁺¹/(n + 1). La constante de integración se cancela al restar F(b) − F(a), por eso no se escribe.${orden}`);
}

/** Datos, desarrollo, signo, planteamiento y antiderivada: comunes a los dos procedimientos del área. */
function pasosIniciales(resultado, planteamiento) {
  return [
    pasoDatos(resultado),
    ...(resultado.modelo.huboDesarrollo ? [pasoDesarrollo(resultado)] : []),
    pasoSigno(resultado),
    planteamiento,
    pasoAntiderivada(resultado)
  ];
}

// ── Área sin cambio de signo (formulario §4.2) ───────────────────────

function pasosAreaSinCambio(resultado) {
  const { modelo, intervalo, unidades, integral, analisis, area } = resultado;
  const { a, b } = intervalo;
  const positiva = analisis.noNegativa;
  const nombre = positiva ? 'A' : 'I';
  const planteamiento = paso('planteamiento', 'Planteamiento',
    positiva ? `A = ${integralTexto(intervalo, modelo)}` : `I = ${integralTexto(intervalo, modelo)};  A_geo = ${MENOS}I`,
    positiva ? `A = ${integralLatex(intervalo, modelo)}` : `I = ${integralLatex(intervalo, modelo)},\\quad A_{\\text{geo}} = -I`,
    positiva ? 'Como f ≥ 0 en [a, b], el área coincide con la integral definida.'
      : 'Como f ≤ 0 en [a, b], la integral es negativa o cero y el área es su opuesto.');
  const superior = paso('limiteSuperior', 'Límite superior',
    evaluacion(integral, b, (t) => t.valorEnB, integral.Fb, TEXTO), evaluacion(integral, b, (t) => t.valorEnB, integral.Fb, LATEX),
    'Se sustituye x = b en cada término de F.');
  const inferior = paso('limiteInferior', 'Límite inferior',
    evaluacion(integral, a, (t) => t.valorEnA, integral.Fa, TEXTO), evaluacion(integral, a, (t) => t.valorEnA, integral.Fa, LATEX),
    'Se sustituye x = a en cada término de F; los valores negativos van entre paréntesis.');
  const resta = paso('resta', 'Resta F(b) − F(a)',
    `${nombre} = F(${fraccionTexto(b)}) ${MENOS} F(${fraccionTexto(a)}) = ${fraccionTexto(integral.Fb)} ${MENOS} ${TEXTO.restando(integral.Fa)} = ${fraccionTexto(integral.I)}`,
    `${nombre} = F(${fraccionLatex(b)}) - F(${fraccionLatex(a)}) = ${fraccionLatex(integral.Fb)} - ${LATEX.restando(integral.Fa)} = ${fraccionLatex(integral.I)}`,
    'Teorema fundamental del cálculo: ∫[a,b] f(x) dx = F(b) − F(a).');
  const I = exacta(integral.I);
  const resultadoPaso = positiva
    ? paso('resultado', 'Resultado', `A = ${cantidadTexto(area.area, unidades.area)}`, `A = ${cantidadLatex(area.area, unidades.area)}`)
    : paso('resultado', 'Resultado',
      `I = ${cantidadTexto(I, unidades.area)};  A_geo = ${MENOS}I = ${cantidadTexto(area.area, unidades.area)}`,
      `I = ${cantidadLatex(I, unidades.area)},\\quad A_{\\text{geo}} = -I = ${cantidadLatex(area.area, unidades.area)}`);
  let interpretacion;
  if (analisis.identicamenteCero) {
    interpretacion = `f es idénticamente cero: no encierra ninguna región y el área es ${cantidadTexto(area.area, unidades.area)}.`;
  } else if (positiva) {
    interpretacion = `La región entre la curva y el eje X en ${intervaloTexto(intervalo)} mide ${cantidadTexto(area.area, unidades.area)}.`;
  } else {
    interpretacion = `La región está bajo el eje X: la integral con signo vale ${cantidadTexto(I, unidades.area)}, `
      + `pero el área, que nunca es negativa, mide ${cantidadTexto(area.area, unidades.area)}.`;
  }
  return [
    ...pasosIniciales(resultado, planteamiento), superior, inferior, resta, resultadoPaso,
    paso('interpretacion', 'Interpretación', interpretacion)
  ];
}

// ── Área con cambio de signo (formulario §2) ─────────────────────────

/** Puntos que separan los tramos: a, los cortes (exactos o rₖ) y b. */
function puntosDeCorte({ analisis, intervalo, area }) {
  const cortes = analisis.ceros.filter((c) => c.tipo === 'cambio-signo');
  if (cortes.length + 1 !== area.tramos.length || area.tramos.length !== analisis.tramos.length) {
    throw new TypeError('pasos: los tramos del área no corresponden a los cortes del análisis');
  }
  const etiqueta = (cero, k) => (cero.exacto
    ? { texto: fraccionTexto(cero.valor), latex: fraccionLatex(cero.valor) }
    : { texto: `r${sub(k)}`, latex: `r_{${k}}` });
  return [
    { texto: fraccionTexto(intervalo.a), latex: fraccionLatex(intervalo.a) },
    ...cortes.map((cero, i) => etiqueta(cero, i + 1)),
    { texto: fraccionTexto(intervalo.b), latex: fraccionLatex(intervalo.b) }
  ];
}

/** Valor de un tramo: exacto si sus dos extremos lo son; si no, su decimal con «≈». */
function valorTramo(r, exacto, estilo) {
  if (exacto) return estilo.fraccion(r);
  return estilo === TEXTO ? aDecimal(r) : decimalLatex(r);
}

function pasoCeros({ analisis, intervalo }) {
  let k = 0;
  const lineas = analisis.ceros.map((cero) => {
    if (cero.tipo === 'cambio-signo') k += 1;
    const valor = cero.exacto
      ? `x = ${fraccionTexto(cero.valor)}`
      : `r${sub(k)} ≈ ${aDecimal(cero.valor)} (irracional; se usa un valor aproximado)`;
    const tipo = { 'cambio-signo': 'cambia de signo', tangencia: 'tangencia: toca el eje sin cruzarlo', extremo: 'en un extremo' }[cero.tipo];
    return `${valor}, ${tipo}`;
  });
  return paso('ceros', 'Ceros de f', `Ceros en ${intervaloTexto(intervalo)}: ${lineas.join('; ')}.`, null,
    'Solo los ceros que cambian de signo dividen el intervalo; las tangencias y los ceros en un extremo no.');
}

function pasosAreaConCambio(resultado) {
  const { modelo, intervalo, unidades, integral, analisis, area } = resultado;
  const puntos = puntosDeCorte(resultado);
  const planteamiento = paso('planteamiento', 'Planteamiento',
    `I = ${integralTexto(intervalo, modelo)};  A_geo = ∫[${fraccionTexto(intervalo.a)},${fraccionTexto(intervalo.b)}] |${modelo.textoNormalizado}| dx`,
    `I = ${integralLatex(intervalo, modelo)},\\quad A_{\\text{geo}} = \\int_{${fraccionLatex(intervalo.a)}}^{${fraccionLatex(intervalo.b)}} \\left|${modelo.latexNormalizado}\\right|\\,dx`,
    'La integral con signo resta las partes bajo el eje; el área geométrica las suma.');
  const exactos = analisis.tramos.map((t) => t.desdeExacto && t.hastaExacto);
  const tramos = area.tramos.map((tramo, i) => {
    const k = i + 1;
    const [desde, hasta] = [puntos[i], puntos[i + 1]];
    const signo = exactos[i] ? '=' : '≈';
    const signoLatex = exactos[i] ? '=' : '\\approx';
    return paso('tramo', `Tramo ${k}`,
      `Tramo ${k}: [${desde.texto}, ${hasta.texto}]:  I${sub(k)} = F(${hasta.texto}) ${MENOS} F(${desde.texto}) ${signo} `
        + `${valorTramo(tramo.integral, exactos[i], TEXTO)}  →  |I${sub(k)}| ${signo} ${valorTramo(tramo.valorAbsoluto, exactos[i], TEXTO)}`,
      `I_{${k}} = F(${hasta.latex}) - F(${desde.latex}) ${signoLatex} ${valorTramo(tramo.integral, exactos[i], LATEX)},\\quad `
        + `|I_{${k}}| ${signoLatex} ${valorTramo(tramo.valorAbsoluto, exactos[i], LATEX)}`,
      `En [${desde.texto}, ${hasta.texto}] f tiene signo ${analisis.tramos[i].signo > 0 ? 'positivo' : 'negativo'}.`);
  });
  const todosExactos = exactos.every(Boolean);
  const absolutos = area.tramos.map((t, i) => valorTramo(t.valorAbsoluto, exactos[i], TEXTO));
  const absolutosLatex = area.tramos.map((t, i) => valorTramo(t.valorAbsoluto, exactos[i], LATEX));
  const A = cantidadTexto(area.area, unidades.area);
  const ALatex = cantidadLatex(area.area, unidades.area);
  const suma = area.area.clase === 'exacta'
    ? paso('suma', 'Suma de los tramos', `A_geo = ${absolutos.join(' + ')} = ${A}`, `A_{\\text{geo}} = ${absolutosLatex.join(' + ')} = ${ALatex}`)
    : paso('suma', 'Suma de los tramos', `A_geo ≈ ${absolutos.join(' + ')} ${A}`, `A_{\\text{geo}} \\approx ${absolutosLatex.join(' + ')} ${ALatex}`,
      'Los cortes irracionales se aproximan, así que el área es aproximada; la cota acota su error (W-04).');
  const I = exacta(integral.I);
  const conSigno = area.tramos.map((t, i) => valorTramo(t.integral, exactos[i], TEXTO));
  const sumaI = todosExactos
    ? `I = ${unir(conSigno, TEXTO)} = ${cantidadTexto(I, unidades.area)}`
    : `I = F(${fraccionTexto(intervalo.b)}) ${MENOS} F(${fraccionTexto(intervalo.a)}) = ${fraccionTexto(integral.Fb)} ${MENOS} ${TEXTO.restando(integral.Fa)} = ${cantidadTexto(I, unidades.area)}`;
  const comparacion = paso('comparacion', 'Integral frente a área',
    `${sumaI}, mientras que ${igual('A_geo', A)}.`,
    `I = ${cantidadLatex(I, unidades.area)},\\quad A_{\\text{geo}} = ${ALatex}`,
    'Como f cambia de signo, A_geo es mayor que |I|: la integral con signo resta las partes bajo el eje y el área las suma.');
  return [
    ...pasosIniciales(resultado, planteamiento),
    pasoCeros(resultado),
    ...tramos,
    suma,
    comparacion,
    paso('resultado', 'Resultado', `${igual('A_geo', A)} (área geométrica);  I = ${cantidadTexto(I, unidades.area)} (integral con signo)`,
      `A_{\\text{geo}} = ${ALatex},\\quad I = ${cantidadLatex(I, unidades.area)}`),
    paso('interpretacion', 'Interpretación',
      `f cambia de signo en ${intervaloTexto(intervalo)}: la región entre la curva y el eje X mide ${A}, `
        + `aunque la integral con signo valga ${cantidadTexto(I, unidades.area)}.`)
  ];
}

// ── API ──────────────────────────────────────────────────────────────

function exigirPerfil(resultado) {
  if (!resultado?.integral?.terminos || !resultado.analisis || !resultado.area?.area || !resultado.modelo || !resultado.unidades) {
    throw new TypeError('pasos: se esperaba un ResultadoPerfil (design §10)');
  }
}

/**
 * Procedimiento del área (design §14.2): sin cambio de signo (formulario §4.2) o con
 * él, por tramos (formulario §2). Lo elige `analisis.cambiaSigno`, ya decidido.
 * @param {object} resultado ResultadoPerfil.
 * @returns {ReadonlyArray<Paso>}
 */
export function pasosArea(resultado) {
  exigirPerfil(resultado);
  return Object.freeze(resultado.analisis.cambiaSigno ? pasosAreaConCambio(resultado) : pasosAreaSinCambio(resultado));
}

/**
 * Procedimiento del valor promedio (design §14.2; formulario §5.2): reutiliza la
 * misma I y muestra la equivalencia con la pizarra, donde 1/(b − a) se distribuye
 * antes de restar (D-06).
 * @param {object} resultado ResultadoPerfil.
 * @returns {ReadonlyArray<Paso>}
 */
export function pasosPromedio(resultado) {
  exigirPerfil(resultado);
  const { modelo, intervalo, unidades, integral, analisis, area, promedio, rectangulo } = resultado;
  const { a, b } = intervalo;
  const L = promedio.longitud;
  const entero = racional.esEntero(L);
  const factor = entero ? `(1/${fraccionTexto(L)})` : `(1/(${fraccionTexto(L)}))`;
  const factorLatex = `\\frac{1}{${fraccionLatex(L)}}`;
  const fProm = exacta(promedio.fProm);
  const I = exacta(integral.I);
  const distribuida = `${factor}·${sustitucionTexto(integral.Fb)} ${MENOS} ${factor}·${sustitucionTexto(integral.Fa)}`
    + ` = ${factor}·[${fraccionTexto(integral.Fb)} ${MENOS} ${TEXTO.restando(integral.Fa)}] = ${factor}·${sustitucionTexto(integral.I)}`
    + ` = ${fraccionTexto(promedio.fProm)}`;
  const pasos = [
    paso('formula', 'Fórmula', 'f_prom = [1/(b − a)] · ∫[a,b] f(x) dx', 'f_{\\text{prom}} = \\frac{1}{b - a} \\int_{a}^{b} f(x)\\,dx',
      'Usa la integral con signo I, la misma del área; no se reemplaza por A_geo.'),
    paso('sustitucion', 'Sustitución de a y b',
      `f_prom = [1/(${fraccionTexto(b)} ${MENOS} ${TEXTO.restando(a)})] · ${integralTexto(intervalo, modelo)} = ${factor} · ${integralTexto(intervalo, modelo)}`,
      `f_{\\text{prom}} = \\frac{1}{${fraccionLatex(b)} - ${LATEX.restando(a)}} ${integralLatex(intervalo, modelo)} = ${factorLatex} ${integralLatex(intervalo, modelo)}`),
    paso('integral', 'Integral',
      `I = F(${fraccionTexto(b)}) ${MENOS} F(${fraccionTexto(a)}) = ${fraccionTexto(integral.Fb)} ${MENOS} ${TEXTO.restando(integral.Fa)} = ${fraccionTexto(integral.I)}`,
      `I = F(${fraccionLatex(b)}) - F(${fraccionLatex(a)}) = ${fraccionLatex(integral.Fb)} - ${LATEX.restando(integral.Fa)} = ${fraccionLatex(integral.I)}`,
      `Con F(x) = ${polinomioTexto(integral.antiderivada)}; la antiderivada y las sustituciones son las de los pasos del área.`),
    paso('division', 'División entre b − a',
      entero
        ? `f_prom = ${factor} · ${sustitucionTexto(integral.I)} = ${fraccionTexto(promedio.fProm)}`
        : `f_prom = ${sustitucionTexto(integral.I)}/(${fraccionTexto(L)}) = ${fraccionTexto(promedio.fProm)}`,
      `f_{\\text{prom}} = ${factorLatex} \\cdot ${LATEX.restando(integral.I)} = ${fraccionLatex(promedio.fProm)}`,
      `Equivalencia con la pizarra: en los apuntes, ${factor} se distribuye antes de restar: ${distribuida}. `
        + 'El resultado es el mismo porque el producto se distribuye sobre la resta.'),
    paso('unidades', 'Unidades',
      analisis.noNegativa
        ? `I = ${cantidadTexto(I, unidades.area)} (es el área, porque f ≥ 0);  f_prom = ${cantidadTexto(fProm, unidades.y)}, sin constante de integración.`
        : `I = ${cantidadTexto(I, unidades.area)} (integral con signo; el área es A_geo = ${cantidadTexto(area.area, unidades.area)});  `
          + `f_prom = ${cantidadTexto(fProm, unidades.y)}, sin constante de integración.`,
      null,
      'El promedio tiene las unidades de f(x); el área, las unidades al cuadrado.')
  ];
  const rect = rectangulo.rectangulo;
  const interpretacion = rect
    ? `El valor promedio de f en ${intervaloTexto(intervalo)} es ${cantidadTexto(fProm, unidades.y)}. El rectángulo equivalente, de base `
      + `${cantidadTexto(exacta(rect.base), unidades.x)} y altura ${cantidadTexto(exacta(rect.altura), unidades.y)}, tiene área `
      + `${cantidadTexto(exacta(rect.area), unidades.area)}, la misma que la región.`
    // (b − a)·f_prom = I se cumple siempre; lo que exige f ≥ 0 es que ese producto sea A_geo (R-08).
    : `El valor promedio de f en ${intervaloTexto(intervalo)} es ${cantidadTexto(fProm, unidades.y)}. La base multiplicada por el `
      + 'valor promedio coincide con la integral con signo: (b − a)·f_prom = I. Como la función toma valores negativos, ese '
      + 'producto no representa el área geométrica y no se muestra el rectángulo equivalente.';
  pasos.push(paso('interpretacion', 'Interpretación', interpretacion));
  return Object.freeze(pasos);
}

/**
 * Los dos procedimientos de un perfil, con la forma de ResultadoPerfil.pasos (design §10).
 * @param {object} resultado ResultadoPerfil.
 * @returns {Readonly<{ area: ReadonlyArray<Paso>, promedio: ReadonlyArray<Paso> }>}
 */
export function pasosPerfil(resultado) {
  return Object.freeze({ area: pasosArea(resultado), promedio: pasosPromedio(resultado) });
}

// ── Figuras (formulario §8) ──────────────────────────────────────────

const dimension = (r) => aDecimal(r, 6); // las dimensiones llegan con ≤ 6 decimales: es su valor exacto
const dimensionLatex = (r) => aDecimal(r, 6).replace(MENOS, '-');

const FIGURAS = Object.freeze({
  rectangulo: Object.freeze({
    nombre: 'Rectángulo',
    datos: (d, u) => `base b = ${dimension(d.base)} ${u}, altura h = ${dimension(d.altura)} ${u}`,
    sustitucion: (d) => `A = ${dimension(d.base)} × ${dimension(d.altura)}`,
    sustitucionLatex: (d) => `A = ${dimensionLatex(d.base)} \\times ${dimensionLatex(d.altura)}`
  }),
  triangulo: Object.freeze({
    nombre: 'Triángulo',
    datos: (d, u) => `base b = ${dimension(d.base)} ${u}, altura h = ${dimension(d.altura)} ${u} (perpendicular a la base)`,
    sustitucion: (d) => `A = (${dimension(d.base)} × ${dimension(d.altura)})/2`,
    sustitucionLatex: (d) => `A = \\frac{${dimensionLatex(d.base)} \\times ${dimensionLatex(d.altura)}}{2}`
  }),
  circulo: Object.freeze({
    nombre: 'Círculo',
    datos: (d, u) => `radio r = ${dimension(d.radio)} ${u}`,
    sustitucion: (d) => `A = π · ${dimension(d.radio)}²`,
    sustitucionLatex: (d) => `A = \\pi \\cdot ${dimensionLatex(d.radio)}^{2}`
  })
});

/**
 * Procedimiento de una figura (design §14.2): datos, fórmula, sustitución, resultado
 * y, si es en cm, la conversión a m² con el cuadrado del factor (R-14.4).
 * @param {object} figura ResultadoFigura.
 * @returns {ReadonlyArray<Paso>}
 */
export function pasosFigura(figura) {
  if (!figura?.area || !figura.areaM2 || !figura.dimensiones || !Object.hasOwn(FIGURAS, figura.tipo)) {
    throw new TypeError('pasos: se esperaba un ResultadoFigura (design §10)');
  }
  const f = FIGURAS[figura.tipo];
  const pasos = [
    paso('datos', 'Datos', `${f.nombre}: ${f.datos(figura.dimensiones, figura.unidad)}.`),
    paso('formula', 'Fórmula', figura.formula.texto, figura.formula.latex, 'Fórmula geométrica directa: no requiere integración.'),
    paso('sustitucion', 'Sustitución', f.sustitucion(figura.dimensiones), f.sustitucionLatex(figura.dimensiones)),
    paso('resultado', 'Resultado', `A = ${cantidadTexto(figura.area, figura.unidadArea)}`, `A = ${cantidadLatex(figura.area, figura.unidadArea)}`)
  ];
  if (figura.unidad === 'cm') {
    pasos.push(paso('conversion', 'Conversión a m²',
      `A = ${cantidadTexto(figura.area, 'cm²')} ÷ 10 000 = ${cantidadTexto(figura.areaM2, 'm²')}`,
      `A = \\frac{${figura.area.clase === 'multiploPi' ? multiploPiLatex(figura.area.coeficiente) : fraccionLatex(figura.area.valor)}}{10\\,000}\\,\\text{m}^{2} = ${cantidadLatex(figura.areaM2, 'm²')}`,
      '1 m = 100 cm, así que 1 m² = 100² cm² = 10 000 cm²: el área se divide entre el cuadrado del factor.'));
  }
  return Object.freeze(pasos);
}

// ── Estimación de material (formulario §7.2 y §9) ────────────────────

/** Factor de un producto: «(40/3)», «2», «(25π)». */
function factorTexto(cantidad) {
  if (cantidad.clase === 'exacta') return sustitucionTexto(cantidad.valor);
  if (cantidad.clase === 'multiploPi') return `(${multiploPiTexto(cantidad.coeficiente)})`;
  return `(≈ ${aDecimal(cantidad.valor)})`;
}

function factorLatex(cantidad) {
  if (cantidad.clase === 'exacta') return sustitucionLatex(cantidad.valor);
  if (cantidad.clase === 'multiploPi') return `\\left(${multiploPiLatex(cantidad.coeficiente)}\\right)`;
  return `\\left(\\approx ${decimalLatex(cantidad.valor)}\\right)`;
}

/** Importe con su fracción exacta delante, como en el formulario §7.2: «2000/3 ≈ Q666.67». */
function importeTexto(cantidad) {
  if (cantidad.clase !== 'exacta') return quetzalesCantidad(cantidad);
  if (racional.esEntero(cantidad.valor)) return quetzales(cantidad.valor);
  return `${fraccionTexto(cantidad.valor)} ${esDecimalExacto(cantidad.valor, 2) ? '=' : '≈'} ${quetzales(cantidad.valor)}`;
}

/** «Q666.67» de formato.js, escrito en LaTeX: «\text{Q}666.67». */
const quetzalesLatex = (r) => quetzales(r).replace('Q', '\\text{Q}').replace(MENOS, '-');

function importeLatex(cantidad) {
  if (cantidad.clase === 'multiploPi') {
    return `\\text{Q}\\,${multiploPiLatex(cantidad.coeficiente)} \\approx ${quetzalesLatex(cantidad.aprox)}`;
  }
  if (cantidad.clase !== 'exacta') return `\\approx ${quetzalesLatex(cantidad.valor)}`;
  if (racional.esEntero(cantidad.valor)) return quetzalesLatex(cantidad.valor);
  return `${fraccionLatex(cantidad.valor)} ${esDecimalExacto(cantidad.valor, 2) ? '=' : '\\approx'} ${quetzalesLatex(cantidad.valor)}`;
}

/**
 * Procedimiento de la estimación (design §14.2; formulario §7.2): área útil, área con
 * el adicional, costo base, costo estimado y supuestos, todos con los valores exactos
 * que ya calculó nucleo/materiales.js.
 * @param {object} estimacion ResultadoEstimacion.
 * @returns {ReadonlyArray<Paso>}
 */
export function pasosEstimacion(estimacion) {
  if (!estimacion?.areaUtilM2 || !estimacion.areaEstimadaM2 || !estimacion.costoBase || !estimacion.costoEstimado
    || !Array.isArray(estimacion.supuestos)) {
    throw new TypeError('pasos: se esperaba un ResultadoEstimacion (design §10)');
  }
  const { areaUtilM2, areaEstimadaM2, adicional, factorAdicional, precio, costoBase, costoEstimado } = estimacion;
  const w = aDecimal(adicional.valor, 2);
  const p = aDecimal(precio.valor, 2);
  const pLatex = p.replace(MENOS, '-');
  return Object.freeze([
    paso('areaUtil', 'Área útil', `A_útil = ${cantidadTexto(areaUtilM2, 'm²')}   (${estimacion.descripcionFuente})`,
      `A_{\\text{útil}} = ${cantidadLatex(areaUtilM2, 'm²')}`,
      'Es el área geométrica del perfil o de la figura, en m²; nunca la integral con signo.'),
    paso('adicional', 'Área con el adicional',
      `A_estimada = A_útil × (1 + w/100) = ${factorTexto(areaUtilM2)} × (1 + ${w}/100) = ${factorTexto(areaUtilM2)} × ${sustitucionTexto(factorAdicional)} = ${cantidadTexto(areaEstimadaM2, 'm²')}`,
      `A_{\\text{estimada}} = ${factorLatex(areaUtilM2)} \\times \\left(1 + \\frac{${w.replace(MENOS, '-')}}{100}\\right) = ${factorLatex(areaUtilM2)} \\times ${sustitucionLatex(factorAdicional)} = ${cantidadLatex(areaEstimadaM2, 'm²')}`,
      'w es un adicional sobre el área útil, no un porcentaje de pérdida medido sobre lo comprado.'),
    paso('costoBase', 'Costo base', `Costo_base = A_útil × p = ${factorTexto(areaUtilM2)} × ${p} = ${importeTexto(costoBase)}`,
      `\\text{Costo}_{\\text{base}} = ${factorLatex(areaUtilM2)} \\times ${pLatex} = ${importeLatex(costoBase)}`,
      'Se multiplica el valor exacto y se redondea a centavos una sola vez, al final.'),
    paso('costoEstimado', 'Costo estimado', `Costo_estimado = A_estimada × p = ${factorTexto(areaEstimadaM2)} × ${p} = ${importeTexto(costoEstimado)}`,
      `\\text{Costo}_{\\text{estimado}} = ${factorLatex(areaEstimadaM2)} \\times ${pLatex} = ${importeLatex(costoEstimado)}`),
    paso('supuestos', 'Supuestos', estimacion.supuestos.join(' '))
  ]);
}
