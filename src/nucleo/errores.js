// Catálogo de errores y advertencias de ÁreaCalc (requirements §10; design §11).
//
// CATALOGO contiene exactamente los códigos de requirements §10. crearError y
// crearAdvertencia rellenan la plantilla siempre como texto (R-20.5): los datos
// se convierten con String y nunca se interpretan como HTML. Los números deben
// llegar ya formateados por presentacion/formato.js, porque aquí no se redondea.

/**
 * @typedef {string | number | bigint} DatoMensaje
 * @typedef {Object} ErrorAreaCalc
 * @property {string} codigo Código estable de requirements §10.
 * @property {string | null} campo Campo afectado, por ejemplo 'a', 'precio' o 'funcion'.
 * @property {string} mensaje
 * @property {string | null} sugerencia
 * @property {number | null} posicion Posición del error en el texto de la función.
 * @property {Readonly<Record<string, DatoMensaje>>} datos
 * @typedef {Object} Advertencia
 * @property {string} codigo
 * @property {string} mensaje
 * @property {Readonly<Record<string, DatoMensaje>>} datos
 */

const error = (categoria, campo, plantilla, sugerencia = null) =>
  Object.freeze({ tipo: 'error', categoria, campo, plantilla, sugerencia });
const advertencia = (plantilla) =>
  Object.freeze({ tipo: 'advertencia', categoria: 'advertencia', campo: null, plantilla, sugerencia: null });

const EXP = (plantilla, sugerencia) => error('expresion', 'funcion', plantilla, sugerencia);
const NUM = (plantilla, sugerencia) => error('numero', null, plantilla, sugerencia);

/** Catálogo congelado: código → { tipo, categoria, campo, plantilla, sugerencia }. */
export const CATALOGO = Object.freeze({
  // Expresión
  'E-EXP-01': EXP('Escriba una función de x, por ejemplo x^3 - 1.'),
  'E-EXP-02': EXP('La expresión está incompleta o no es válida cerca de la posición {posicion}.',
    'Revise los operadores y que cada paréntesis esté cerrado.'),
  'E-EXP-03': EXP('El símbolo «{simbolo}» no está admitido; use solo x minúscula.'),
  'E-EXP-04': EXP('Use punto decimal, sin separadores de miles ni notación científica.', 'Por ejemplo, 0.5x.'),
  'E-EXP-05': EXP('El número «{numero}» está fuera de rango o tiene más de 6 decimales.',
    'Use números de hasta 1 000 000 en valor absoluto y con 6 decimales como máximo.'),
  'E-EXP-06': EXP('«{simbolo}» no está en el soporte del MVP (polinomios en x de grado ≤ 3).',
    'Pruebe, por ejemplo, con x^2. Las unidades se eligen en «Interpretación».'),
  'E-EXP-07': EXP('El exponente debe ser un entero 1, 2 o 3 escrito directamente.', 'Por ejemplo, x^2.'),
  'E-EXP-08': EXP('Solo se puede dividir entre constantes; 1/x no es un polinomio y no está definida en x = 0.'),
  'E-EXP-09': EXP('La expresión divide entre cero.'),
  'E-EXP-10': EXP('El MVP admite polinomios de grado ≤ 3; esta expresión supera ese grado.'),
  'E-EXP-11': EXP('La expresión es demasiado compleja.',
    'Use como máximo 200 caracteres, 100 elementos y 10 paréntesis anidados.'),
  'E-EXP-12': EXP('Escriba solo la expresión, sin «y =» ni «f(x) =».'),
  // Valores numéricos: el mensaje nombra el campo
  'E-NUM-01': NUM('El campo «{etiqueta}» está vacío.', 'Escriba un número; un campo vacío no se toma como cero.'),
  'E-NUM-02': NUM('«{etiqueta}» no es un número válido.', 'Use un número entero o decimal con punto, por ejemplo 2.5.'),
  'E-NUM-03': NUM('«{etiqueta}» debe ser un número finito.', 'Infinity, NaN y ∞ no se admiten.'),
  'E-NUM-04': NUM('«{etiqueta}» está fuera de rango o tiene demasiados decimales.', 'Debe estar {rango}.'),
  'E-NUM-05': NUM('«{etiqueta}» no puede ser negativo.', 'El cero sí es válido.'),
  'E-NUM-06': NUM('«{etiqueta}» debe ser mayor que cero.', 'Una dimensión geométrica no puede ser cero ni negativa.'),
  // Intervalo
  'E-INT-01': error('intervalo', 'intervalo', 'El intervalo tiene longitud cero; b debe ser mayor que a.'),
  'E-INT-02': error('intervalo', 'intervalo',
    'El límite inferior es mayor que el superior. ÁreaCalc no los intercambia automáticamente.'),
  // Modelo físico
  'E-MOD-01': error('modelo-fisico', 'estimacion',
    'Un ejercicio abstracto no tiene escala física, así que no se estima material.',
    'Elija «Perfil físico (x y f(x) en metros)» para estimar.'),
  'E-MOD-02': error('modelo-fisico', 'estimacion',
    'El perfil toma valores negativos y no representa una altura no negativa en todo el intervalo.',
    'Revise el modelo físico y el intervalo antes de estimar material.'),
  'E-MOD-03': error('modelo-fisico', 'estimacion', 'El área es cero: no hay superficie que presupuestar.'),
  'E-MOD-04': error('modelo-fisico', 'estimacion', 'No hay un resultado apto vigente para estimar.',
    'Calcule primero un perfil físico válido o una figura.'),
  // Sistema
  'E-SIS-01': error('sistema', null, 'El cálculo superó su presupuesto de operaciones y se detuvo sin resultados.',
    'Pruebe con coeficientes más sencillos.'),
  'E-SIS-02': error('sistema', null, 'Ocurrió un error interno inesperado; se descartaron los resultados parciales.'),
  // Centroides (POSTERIOR, R-27)
  'E-CEN-01': error('centroide', null, 'Región no admitida para el centroide: f cambia de signo o es negativa.'),
  'E-CEN-02': error('centroide', null, 'El área es cero: el centroide no está definido.'),
  // Advertencias: no bloquean el resultado
  'W-01': advertencia('f cambia de signo: la integral con signo y el área geométrica son distintas.'),
  'W-02': advertencia('Tangencia: f toca el eje en x = {x} sin cambiar de signo.'),
  'W-03': advertencia('Hay un cero en un extremo del intervalo, en x = {x}.'),
  'W-04': advertencia('Hay ceros irracionales aproximados: el área geométrica es aproximada (cota de error ≤ {cota}).'),
  'W-05': advertencia('Los precios y datos de este ejemplo son simulados.'),
  'W-06': advertencia('El adicional se aplica sobre el área útil. El material realmente comprado depende de '
    + 'formatos comerciales, márgenes y cortes, y no se calcula. No incluye mano de obra, impuestos, '
    + 'márgenes comerciales, láminas ni litros de pintura.'),
  'W-07': advertencia('La gráfica no está disponible; los resultados y los pasos se conservan.'),
  'W-08': advertencia('La representación enriquecida no está disponible; las fórmulas se muestran en texto.'),
  'W-09': advertencia('f es idénticamente cero.')
});

/** Definición de un código; un código desconocido o del tipo equivocado es un error de programación. */
function definicionDe(codigo, tipo) {
  const definicion = Object.hasOwn(CATALOGO, codigo) ? CATALOGO[codigo] : null;
  if (definicion === null) throw new RangeError(`errores: el código «${codigo}» no está en el catálogo`);
  if (definicion.tipo !== tipo) throw new RangeError(`errores: «${codigo}» no es un código de ${tipo}`);
  return definicion;
}

/** Copia congelada de los datos; solo admite textos y números, para no insertar objetos. */
function copiarDatos(datos) {
  if (datos === null || typeof datos !== 'object' || Array.isArray(datos)) {
    throw new TypeError('errores: los datos deben ser un objeto');
  }
  const copia = {};
  for (const [clave, valor] of Object.entries(datos)) {
    if (valor === undefined || valor === null) continue;
    if (!['string', 'number', 'bigint'].includes(typeof valor)) {
      throw new TypeError(`errores: el dato «${clave}» debe ser un texto o un número`);
    }
    copia[clave] = valor;
  }
  return Object.freeze(copia);
}

/** Sustituye cada {nombre} por su dato, como texto; un dato que falta es un error de programación. */
function rellenar(plantilla, datos, codigo) {
  return plantilla.replace(/\{(\w+)\}/g, (_, nombre) => {
    if (!Object.hasOwn(datos, nombre)) throw new TypeError(`errores: falta el dato «${nombre}» para ${codigo}`);
    return String(datos[nombre]);
  });
}

/**
 * Error con el formato de design §10. Las claves `campo`, `posicion` y `sugerencia`
 * de `datos` sustituyen los valores por defecto del catálogo.
 * @param {string} codigo
 * @param {Record<string, DatoMensaje | null | undefined>} [datos]
 * @returns {Readonly<ErrorAreaCalc>}
 */
export function crearError(codigo, datos = {}) {
  const definicion = definicionDe(codigo, 'error');
  const copia = copiarDatos(datos);
  if (copia.posicion !== undefined && !Number.isSafeInteger(copia.posicion)) {
    throw new TypeError('errores: la posición debe ser un entero');
  }
  let sugerencia = null;
  if (copia.sugerencia !== undefined) sugerencia = String(copia.sugerencia);
  else if (definicion.sugerencia !== null) sugerencia = rellenar(definicion.sugerencia, copia, codigo);
  return Object.freeze({
    codigo,
    campo: copia.campo !== undefined ? String(copia.campo) : definicion.campo,
    mensaje: rellenar(definicion.plantilla, copia, codigo),
    sugerencia,
    posicion: copia.posicion ?? null,
    datos: copia
  });
}

/**
 * Advertencia con el formato de design §10.
 * @param {string} codigo
 * @param {Record<string, DatoMensaje | null | undefined>} [datos]
 * @returns {Readonly<Advertencia>}
 */
export function crearAdvertencia(codigo, datos = {}) {
  const definicion = definicionDe(codigo, 'advertencia');
  const copia = copiarDatos(datos);
  return Object.freeze({ codigo, mensaje: rellenar(definicion.plantilla, copia, codigo), datos: copia });
}
