// Datos de la gráfica del perfil (T-15; design.md §4, paso 9, §10 y §14.3; requirements R-10).
//
// datosGrafica convierte el modelo validado y los resultados exactos del núcleo en
// arreglos Number que SOLO sirven para dibujar (R-10.5). No calcula integrales, áreas,
// ceros, signos ni la existencia del rectángulo: los toma tal como llegan.
//   - Curva: 401 puntos uniformes en [a − m, b + m], con m = 0.1·(b − a), a los que se
//     añaden a, b y los ceros, en orden y sin repetir (design §14.3).
//   - Regiones: una por tramo de `analisis.tramos`, con 101 puntos y el signo del tramo.
//     Se añaden también los ceros que caen dentro del tramo (tangencias), para que el
//     relleno toque el eje donde la curva lo toca. Un tramo de signo +1 nunca baja de 0
//     ni uno de −1 sube de 0 por ruido de coma flotante: manda el signo exacto.
//   - Ceros: posición y texto flotante («x = 1 (exacto)» o «x ≈ 1.4142»); en los ceros
//     la curva vale 0, porque el núcleo ya lo decidió.
//   - Promedio: y = f_prom con la etiqueta «f_prom = 10/3 m».
//   - Rectángulo equivalente: solo si `rectangulo.rectangulo` no es null (R-08.1, T-05).
// Los textos usan formato.js, el único lugar donde se redondea.
//
// Si algún valor no es finito en Number (por ejemplo, `(((1000000^3)^3)^3)^3` = 10⁴⁸⁶),
// no hay gráfica: devuelve `datos: null` y la advertencia W-07; los resultados exactos
// no se tocan (R-10.6). Cualquier otra excepción también se convierte en W-07, para que
// un fallo de la gráfica nunca se lleve los resultados del perfil.
import { crearAdvertencia } from '../nucleo/errores.js';
import { evaluarAprox } from '../nucleo/polinomio.js';
import { aNumber } from '../nucleo/racional.js';
import { aDecimal, fraccionTexto } from './formato.js';

/**
 * @typedef {import('../nucleo/errores.js').Advertencia} Advertencia
 * @typedef {{ x: number[], y: number[] }} Serie
 * @typedef {Object} RegionGrafica Un tramo de `analisis.tramos`.
 * @property {number[]} x
 * @property {number[]} y
 * @property {1 | -1 | 0} signo El del tramo; 0 solo si f ≡ 0.
 * @typedef {Object} CeroGrafica
 * @property {number} x
 * @property {boolean} exacto
 * @property {string} etiqueta Texto flotante del marcador (añadido a design §10).
 * @typedef {Object} DatosGrafica design §10.
 * @property {Serie} curva
 * @property {RegionGrafica[]} regiones
 * @property {CeroGrafica[]} ceros
 * @property {{ y: number, etiqueta: string }} promedio
 * @property {{ x0: number, x1: number, altura: number } | null} rectangulo
 * @property {{ etiquetaX: string, etiquetaY: string }} ejes
 * @property {{ x: [number, number], y: [number, number] }} rango Rango visible de cada eje.
 * @property {string} descripcion Resumen en texto para lectores de pantalla (añadido a design §10).
 * @typedef {Object} SalidaGrafica
 * @property {Readonly<DatosGrafica> | null} datos null si no se puede dibujar.
 * @property {ReadonlyArray<Advertencia>} advertencias Vacía, o [W-07].
 * @property {null | 'no-finito' | 'error'} motivo Por qué no hay datos.
 */

/** Puntos uniformes de la curva en [a − m, b + m] (design §14.3). */
export const PUNTOS_CURVA = 401;
/** Puntos uniformes de cada región (design §14.3). */
export const PUNTOS_REGION = 101;
/** Margen visual a cada lado de [a, b], como fracción de b − a (R-10.1). */
export const MARGEN = 0.1;
/** Holgura vertical, como fracción del recorrido de los valores dibujados. */
const HOLGURA_Y = 0.08;

/**
 * Datos para dibujar el perfil (design §4, paso 9).
 * @param {{
 *   modelo: import('../expresiones/normalizar.js').ModeloValidado,
 *   intervalo: { a: import('../nucleo/racional.js').Racional, b: import('../nucleo/racional.js').Racional },
 *   analisis: import('../nucleo/ceros.js').AnalisisSigno,
 *   promedio: { longitud: import('../nucleo/racional.js').Racional, fProm: import('../nucleo/racional.js').Racional },
 *   rectangulo: import('../nucleo/promedio.js').RectanguloEquivalente,
 *   unidades: { x: string, y: string }
 * }} resultado Los campos homónimos de ResultadoPerfil (design §10).
 * @returns {Readonly<SalidaGrafica>}
 */
export function datosGrafica(resultado) {
  let datos;
  try {
    datos = construir(resultado);
  } catch (error) {
    console.error('datosGrafica: no se pudieron preparar los datos de la gráfica (W-07).', error);
    return sinGrafica('error');
  }
  if (!todosFinitos(datos)) return sinGrafica('no-finito');
  return Object.freeze({ datos: congelar(datos), advertencias: Object.freeze([]), motivo: null });
}

function sinGrafica(motivo) {
  return Object.freeze({ datos: null, advertencias: Object.freeze([crearAdvertencia('W-07')]), motivo });
}

function construir({ modelo, intervalo, analisis, promedio, rectangulo, unidades }) {
  const f = modelo.polinomio;
  const xa = aNumber(intervalo.a);
  const xb = aNumber(intervalo.b);
  const margen = MARGEN * (xb - xa);

  const ceros = analisis.ceros.map((cero) => ({ x: aNumber(cero.valor), exacto: cero.exacto, etiqueta: etiquetaCero(cero) }));
  const xCeros = ceros.map((cero) => cero.x);
  const enCero = new Set(xCeros);
  // En un cero, f vale 0 (lo decidió el núcleo); en el resto, el valor aproximado.
  const altura = (x) => (enCero.has(x) ? 0 : sinMenosCero(evaluarAprox(f, x)));

  const xCurva = mezclar(uniformes(xa - margen, xb + margen, PUNTOS_CURVA), [xa, xb, ...xCeros]);
  const curva = { x: xCurva, y: xCurva.map(altura) };

  const regiones = analisis.tramos.map((tramo) => {
    const desde = aNumber(tramo.desde);
    const hasta = aNumber(tramo.hasta);
    const x = mezclar(uniformes(desde, hasta, PUNTOS_REGION), xCeros.filter((c) => c > desde && c < hasta));
    return { x, y: x.map((xi) => conSigno(altura(xi), tramo.signo)), signo: tramo.signo };
  });

  const lineaPromedio = { y: aNumber(promedio.fProm), etiqueta: `f_prom = ${fraccionTexto(promedio.fProm)} ${unidades.y}` };
  const equivalente = rectangulo.rectangulo === null
    ? null
    : { x0: xa, x1: xb, altura: aNumber(rectangulo.rectangulo.altura) };

  const datos = {
    curva,
    regiones,
    ceros,
    promedio: lineaPromedio,
    rectangulo: equivalente,
    ejes: { etiquetaX: `x (${unidades.x})`, etiquetaY: `f(x) (${unidades.y})` },
    rango: {
      x: [xa - margen, xb + margen],
      y: rangoY([...curva.y, lineaPromedio.y, ...(equivalente === null ? [] : [equivalente.altura])])
    }
  };
  datos.descripcion = describir(modelo, intervalo, unidades, datos);
  return datos;
}

/** «x = 1/3 (exacto)» o «x ≈ 1.4142» (design §14.3); el redondeo es de formato.js. */
function etiquetaCero(cero) {
  return cero.exacto ? `x = ${fraccionTexto(cero.valor)} (exacto)` : `x ≈ ${aDecimal(cero.valor)}`;
}

/** n puntos uniformes de desde a hasta, ambos incluidos. */
function uniformes(desde, hasta, n) {
  const paso = (hasta - desde) / (n - 1);
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? hasta : desde + paso * i));
}

/** Une los puntos uniformes con los añadidos, en orden y sin repetir un mismo x. */
function mezclar(base, extra) {
  const todos = [...base, ...extra].sort((p, q) => p - q);
  return todos.filter((x, i) => i === 0 || x !== todos[i - 1]);
}

/** Ajusta el ruido de coma flotante al signo exacto del tramo. */
function conSigno(y, signo) {
  if (signo > 0) return Math.max(y, 0);
  if (signo < 0) return sinMenosCero(Math.min(y, 0));
  return 0;
}

const sinMenosCero = (y) => (y === 0 ? 0 : y);

/** Rango vertical: incluye el eje (y = 0) y todos los valores dibujados, con holgura. */
function rangoY(valores) {
  let minimo = 0;
  let maximo = 0;
  for (const y of valores) {
    if (y < minimo) minimo = y;
    if (y > maximo) maximo = y;
  }
  if (minimo === maximo) return [-1, 1]; // f ≡ 0: solo el eje
  const holgura = (maximo - minimo) * HOLGURA_Y;
  return [minimo - holgura, maximo + holgura];
}

/** Resumen textual de lo que muestra la gráfica (alternativa para lectores de pantalla, R-23). */
function describir(modelo, intervalo, unidades, datos) {
  const sobre = datos.regiones.filter((region) => region.signo > 0).length;
  const bajo = datos.regiones.filter((region) => region.signo < 0).length;
  const frases = [
    `Gráfica de f(x) = ${modelo.textoNormalizado} en [${fraccionTexto(intervalo.a)}, ${fraccionTexto(intervalo.b)}], `
      + `con x y f(x) en ${unidades.x}`,
    `Tramos sombreados: ${sobre} sobre el eje (+) y ${bajo} bajo el eje (−)`,
    datos.ceros.length === 0
      ? 'Sin ceros marcados en [a, b]'
      : `Ceros marcados: ${datos.ceros.map((cero) => cero.etiqueta).join('; ')}`,
    `Línea discontinua ${datos.promedio.etiqueta}`
  ];
  if (datos.rectangulo !== null) frases.push('Contorno del rectángulo equivalente sobre [a, b]');
  return `${frases.join('. ')}.`;
}

/** Todos los Number que se dibujarían son finitos (design §14.3). */
function todosFinitos(datos) {
  const finitos = (valores) => valores.every(Number.isFinite);
  const { curva, regiones, ceros, promedio, rectangulo, rango } = datos;
  return finitos(curva.x) && finitos(curva.y)
    && regiones.every((region) => finitos(region.x) && finitos(region.y))
    && finitos(ceros.map((cero) => cero.x))
    && Number.isFinite(promedio.y)
    && (rectangulo === null || finitos([rectangulo.x0, rectangulo.x1, rectangulo.altura]))
    && finitos(rango.x) && finitos(rango.y);
}

function congelar(valor) {
  if (valor !== null && typeof valor === 'object') {
    for (const interno of Object.values(valor)) congelar(interno);
    Object.freeze(valor);
  }
  return valor;
}
