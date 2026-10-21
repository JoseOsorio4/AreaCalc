// Tabla reconstruida para pruebas de la gramática (T-10; design.md §15).
//
// Procedencia: tasks T-10 pide «las 33 entradas válidas y 59 inválidas del
// prototipo» (design §0), pero ese prototipo desechable estaba fuera del
// repositorio y sus entradas no se conservan. Por autorización del equipo, esta
// es una TABLA RECONSTRUIDA PARA PRUEBAS: no procede del prototipo ni lo
// reproduce. Se derivó a mano de requirements Tabla 9.1, Tabla 9.2, §10 y §14,
// y de design §5.2 a §5.4 y §14.1. Cada entrada cita su fuente en `fuente`.
//
// Este archivo no importa nada de src/: los coeficientes, los textos y las
// posiciones se calcularon a mano (R-25.1).
//
// Convenciones:
// - coef: coeficientes del polinomio normalizado desde x⁰ hacia arriba, como
//   fracciones irreducibles 'p/q' o enteros 'p'; [] es el polinomio cero.
// - desarrollo: valor esperado de huboDesarrollo (design §5.4): un producto o
//   una potencia con un factor que es una suma o una resta.
// - normalizado: textoNormalizado esperado (design §14.1), con «−» (U+2212).
// - posicion: carácter del error, contando desde 1 (T-09); null si no hay.

const E18 = 10n ** 18n;
const E60 = 10n ** 60n;
const E126 = 10n ** 126n;
const D34 = 999983n ** 21n; // denominador de la raíz racional de CR-34

/** Textos de CR-33 a CR-36, copiados de requirements §14. */
export const TEXTOS_D09 = Object.freeze({
  'CR-33': 'x^3 + 0.000001*0.000001*0.000001*0.000001*0.000001*0.000001*0.000001*0.000001*0.000001*0.000001*x - 2',
  'CR-34': '(x - (1/999983)^3*(1/999983)^3*(1/999983)^3*(1/999983)^3*(1/999983)^3*(1/999983)^3*(1/999983)^3)(x^2 + 1)',
  'CR-35': '1000000^3*1000000^3*1000000^3*1000000*(x - 1/3)(x^2 + 1)',
  'CR-36': '1000000^3*1000000^3*1000000^3*1000000^3*1000000^3*1000000^3*1000000^3*(x^3 - 2)'
});

const valida = (categoria, texto, coef, desarrollo, normalizado, fuente) =>
  Object.freeze({ categoria, texto, coef: Object.freeze(coef), desarrollo, normalizado, fuente });

/** Entradas válidas: texto → polinomio, huboDesarrollo y textoNormalizado. */
export const VALIDAS = Object.freeze([
  // Variable y números (Tabla 9.1)
  valida('variable', 'x', ['0', '1'], false, 'x', 'Tabla 9.1; CR-05'),
  valida('numero', '3', ['3'], false, '3', 'Tabla 9.1'),
  valida('numero', '2', ['2'], false, '2', 'CR-23'),
  valida('numero', '0.25', ['1/4'], false, '1/4', 'Tabla 9.1; R-03.2'),
  valida('numero', '0', [], false, '0', 'CR-08; design §7 (polinomio cero)'),
  valida('numero', '0.1 + 0.2', ['3/10'], false, '3/10', 'CR-17'),
  valida('numero', '1000000x^3', ['0', '0', '0', '1000000'], false, '1000000x³', 'Tabla 9.2 (|v| ≤ 1 000 000)'),
  valida('numero', '0.000001x', ['0', '1/1000000'], false, 'x/1000000', 'Tabla 9.2 (≤ 6 decimales)'),
  // Suma, resta y signo unario
  valida('suma', 'x^3 - 1', ['-1', '0', '0', '1'], false, 'x³ − 1', 'CR-01; design §10'),
  valida('suma', 'x^3 \u2212 1', ['-1', '0', '0', '1'], false, 'x³ − 1', 'Tabla 9.1 (signo − tipográfico)'),
  valida('suma', '1 + x^2', ['1', '0', '1'], false, 'x² + 1', 'CR-02'),
  valida('suma', 'x^3 - x', ['0', '-1', '0', '1'], false, 'x³ − x', 'CR-14'),
  valida('suma', 'x^2 - 2', ['-2', '0', '1'], false, 'x² − 2', 'CR-15'),
  valida('suma', 'x - 1/3', ['-1/3', '1'], false, 'x − 1/3', 'CR-31'),
  valida('suma', 'x - x', [], false, '0', 'design §7 (polinomio cero)'),
  valida('signo', '-2', ['-2'], false, '−2', 'CR-06; Tabla 9.1'),
  valida('signo', '-x^2', ['0', '0', '-1'], false, '−x²', 'Tabla 9.1 (precedencia)'),
  valida('signo', '-(x-1)', ['1', '-1'], false, '−x + 1', 'Tabla 9.1'),
  valida('signo', '5x - x^2', ['0', '5', '-1'], false, '−x² + 5x', 'CR-18'),
  valida('signo', '2x^2 - 3x^3', ['0', '0', '2', '-3'], false, '−3x³ + 2x²', 'design §14.1 (orden descendente)'),
  // Productos explícitos e implícitos (Tabla 9.1; design §5.3)
  valida('producto', '3*x', ['0', '3'], false, '3x', 'Tabla 9.1'),
  valida('producto', 'x*x', ['0', '0', '1'], false, 'x²', 'Tabla 9.1'),
  valida('producto', '3x', ['0', '3'], false, '3x', 'Tabla 9.1'),
  valida('producto', '3x^2', ['0', '0', '3'], false, '3x²', 'CR-18; Tabla 9.1'),
  valida('producto', '5x^3 - 2', ['-2', '0', '0', '5'], false, '5x³ − 2', 'CR-18'),
  valida('producto', '2(x-1)', ['-2', '2'], true, '2x − 2', 'Tabla 9.1; design §5.4'),
  valida('producto', '(x-1)(x+1)', ['-1', '0', '1'], true, 'x² − 1', 'Tabla 9.1; design §5.4'),
  valida('producto', '(x+1)x', ['0', '1', '1'], true, 'x² + x', 'Tabla 9.1'),
  valida('producto', 'x(x+1)', ['0', '1', '1'], true, 'x² + x', 'CR-27'),
  valida('producto', 'x*(x+1)', ['0', '1', '1'], true, 'x² + x', 'CR-27'),
  valida('producto', '(x - 1/3)(x - 2)(x + 1)', ['2/3', '-5/3', '-4/3', '1'], true, 'x³ − 4x²/3 − 5x/3 + 2/3',
    'CR-28; design §14.1'),
  valida('producto', '-2(x+1)^2', ['-2', '-4', '-2'], true, '−2x² − 4x − 2', 'design §5.3 y §5.4'),
  valida('producto', '2*-(x+1)', ['-2', '-2'], true, '−2x − 2', 'design §5.3 y §5.4 (factor con signo)'),
  // División entre constantes
  valida('division', '2 + x^2/4', ['2', '0', '1/4'], false, 'x²/4 + 2', 'CR-03'),
  valida('division', 'x^2/4 + 2', ['2', '0', '1/4'], false, 'x²/4 + 2', 'CR-16'),
  valida('division', '0.25x^2 + 2', ['2', '0', '1/4'], false, 'x²/4 + 2', 'CR-16'),
  valida('division', '(1/4)x^2 + 2', ['2', '0', '1/4'], false, 'x²/4 + 2', 'CR-16'),
  valida('division', '2 + x*x/4', ['2', '0', '1/4'], false, 'x²/4 + 2', 'CR-16'),
  valida('division', '(3/4)x', ['0', '3/4'], false, '3x/4', 'CR-23'),
  valida('division', '(1/3)x^3', ['0', '0', '0', '1/3'], false, 'x³/3', 'Tabla 9.1'),
  valida('division', '1/2x', ['0', '1/2'], false, 'x/2', 'Tabla 9.1 (precedencia)'),
  valida('division', '-x^3/3 + 2x/5 - 7/2', ['-7/2', '2/5', '0', '-1/3'], false, '−x³/3 + 2x/5 − 7/2', 'design §14.1'),
  valida('division', '(x+1)/2', ['1/2', '1/2'], false, 'x/2 + 1/2', 'design §5.4 (una división no es desarrollo)'),
  valida('division', '1/(x-x+1)', ['1'], false, '1', 'design §5.4 (el divisor normalizado es constante)'),
  // Potencias
  valida('potencia', 'x^2', ['0', '0', '1'], false, 'x²', 'CR-04; Tabla 9.1'),
  valida('potencia', 'x^(2)', ['0', '0', '1'], false, 'x²', 'Tabla 9.1'),
  valida('potencia', 'x ^ 2 - 1', ['-1', '0', '1'], false, 'x² − 1', 'Tabla 9.1 (espacios)'),
  valida('potencia', '(2x)^3', ['0', '0', '0', '8'], false, '8x³', 'Tabla 9.1'),
  valida('potencia', '2^3x', ['0', '8'], false, '8x', 'design §5.4 (base constante, n ≤ 3)'),
  valida('potencia', '(1/2)^2', ['1/4'], false, '1/4', 'design §5.4 (base constante)'),
  valida('potencia', '(x+1)^1', ['1', '1'], true, 'x + 1', 'design §5.4'),
  valida('potencia', '(x-1)^2', ['1', '-2', '1'], true, 'x² − 2x + 1', 'CR-07; R-09.5'),
  valida('potencia', 'x^2 - 2x + 1', ['1', '-2', '1'], false, 'x² − 2x + 1', 'CR-07'),
  valida('potencia', '(x-1)^3', ['-1', '3', '-3', '1'], true, 'x³ − 3x² + 3x − 1', 'CR-29'),
  valida('potencia', '(x-1)^2(x+2)', ['2', '-3', '0', '1'], true, 'x³ − 3x + 2', 'CR-30'),
  // Coeficientes sin tope (D-09)
  valida('sin-tope', '(0.000001x)^3', ['0', '0', '0', `1/${E18}`], false, `x³/${E18}`, 'CR-32'),
  valida('sin-tope', TEXTOS_D09['CR-33'], ['-2', `1/${E60}`, '0', '1'], false, `x³ + x/${E60} − 2`, 'CR-33'),
  valida('sin-tope', TEXTOS_D09['CR-34'], [`-1/${D34}`, '1', `-1/${D34}`, '1'], true,
    `x³ − x²/${D34} + x − 1/${D34}`, 'CR-34'),
  valida('sin-tope', TEXTOS_D09['CR-35'], [`-${E60}/3`, `${E60}`, `-${E60}/3`, `${E60}`], true,
    `${E60}x³ − ${E60}x²/3 + ${E60}x − ${E60}/3`, 'CR-35'),
  valida('sin-tope', TEXTOS_D09['CR-36'], [`-${2n * E126}`, '0', '0', `${E126}`], true,
    `${E126}x³ − ${2n * E126}`, 'CR-36')
]);

const invalida = (categoria, texto, codigo, posicion, fuente) =>
  Object.freeze({ categoria, texto, codigo, posicion, fuente });

/** Entradas inválidas: texto → código y posición del primer error. */
export const INVALIDAS = Object.freeze([
  // E-EXP-01: vacía
  invalida('vacia', '', 'E-EXP-01', null, 'CR-13; requirements §10'),
  invalida('vacia', '   ', 'E-EXP-01', null, 'requirements §10'),
  // E-EXP-02: sintaxis incompleta o inválida
  invalida('sintaxis', 'x^', 'E-EXP-02', 3, 'requirements §10'),
  invalida('sintaxis', '(x-1', 'E-EXP-02', 5, 'Tabla 9.1; requirements §10'),
  invalida('sintaxis', 'x+*2', 'E-EXP-02', 3, 'requirements §10'),
  invalida('sintaxis', '2**x', 'E-EXP-02', 3, 'Tabla 9.1'),
  invalida('sintaxis', 'x x', 'E-EXP-02', 3, 'Tabla 9.1; design §5.3'),
  invalida('sintaxis', '2 3', 'E-EXP-02', 3, 'Tabla 9.1; design §5.3'),
  invalida('sintaxis', 'x 2', 'E-EXP-02', 3, 'design §5.3'),
  invalida('sintaxis', '(x+1)2', 'E-EXP-02', 6, 'design §5.3'),
  invalida('sintaxis', 'x^(2', 'E-EXP-02', 5, 'design §5.3'),
  invalida('sintaxis', ')x', 'E-EXP-02', 1, 'design §5.3'),
  invalida('sintaxis', 'x-', 'E-EXP-02', 3, 'design §5.3'),
  // E-EXP-03: símbolo o variable no admitidos
  invalida('simbolo', 'y + 1', 'E-EXP-03', 1, 'CR-13'),
  invalida('simbolo', 'X^2', 'E-EXP-03', 1, 'CR-21'),
  invalida('simbolo', 'pi*x', 'E-EXP-03', 1, 'requirements §10'),
  invalida('simbolo', 't', 'E-EXP-03', 1, 'Tabla 9.1'),
  invalida('simbolo', 'e*x', 'E-EXP-03', 1, 'Tabla 9.1'),
  invalida('simbolo', 'x2', 'E-EXP-03', 1, 'Tabla 9.1'),
  invalida('simbolo', 'xx', 'E-EXP-03', 1, 'Tabla 9.1'),
  // E-EXP-04: formato numérico
  invalida('formato', '0,5x', 'E-EXP-04', 2, 'CR-21'),
  invalida('formato', '.5x', 'E-EXP-04', 1, 'requirements §10'),
  invalida('formato', '5.', 'E-EXP-04', 2, 'Tabla 9.1'),
  invalida('formato', '1e3', 'E-EXP-04', 2, 'Tabla 9.1'),
  invalida('formato', '1,000', 'E-EXP-04', 2, 'requirements §10'),
  invalida('formato', '2E-1', 'E-EXP-04', 2, 'design §5.2'),
  // E-EXP-05: literal fuera de rango o con más de 6 decimales
  invalida('literal', '10000000x', 'E-EXP-05', 1, 'requirements §10'),
  invalida('literal', '0.0000001x', 'E-EXP-05', 1, 'Tabla 9.2'),
  invalida('literal', '1000000.5', 'E-EXP-05', 1, 'Tabla 9.2'),
  // E-EXP-06: función, operador o construcción no admitidos
  invalida('construccion', 'sqrt(x)', 'E-EXP-06', 1, 'CR-21'),
  invalida('construccion', 'sin(x)', 'E-EXP-06', 1, 'requirements §10'),
  invalida('construccion', 'abs(x)', 'E-EXP-06', 1, 'requirements §10'),
  invalida('construccion', 'x!', 'E-EXP-06', 2, 'requirements §10'),
  invalida('construccion', '[1,2]', 'E-EXP-06', 1, 'requirements §10'),
  invalida('construccion', 'x.y', 'E-EXP-06', 2, 'requirements §10'),
  invalida('construccion', 'x==1', 'E-EXP-06', 2, 'requirements §10'),
  invalida('construccion', '5 cm', 'E-EXP-06', 3, 'requirements §10'),
  invalida('construccion', 'x\u00b2', 'E-EXP-06', 2, 'design §5.2'),
  invalida('construccion', '2\u00d7x', 'E-EXP-06', 2, 'design §5.2'),
  // E-EXP-07: exponente no admitido (sintaxis y normalización)
  invalida('exponente', 'x^0', 'E-EXP-07', 3, 'Tabla 9.1; design §5.4; tasks T-10'),
  invalida('exponente', 'x^-1', 'E-EXP-07', 3, 'Tabla 9.1'),
  invalida('exponente', 'x^(1/2)', 'E-EXP-07', 5, 'CR-21'),
  invalida('exponente', '2^x', 'E-EXP-07', 3, 'Tabla 9.1'),
  invalida('exponente', 'x^2^3', 'E-EXP-07', 4, 'Tabla 9.1'),
  invalida('exponente', 'x^1.5', 'E-EXP-07', 3, 'design §5.3'),
  invalida('exponente', '2^4', 'E-EXP-07', 3, 'design §5.4; tasks T-10'),
  invalida('exponente', '(x+1)^0', 'E-EXP-07', 7, 'design §5.4 (D-02)'),
  invalida('exponente', '2^0', 'E-EXP-07', 3, 'design §5.4 (D-02)'),
  invalida('exponente', '0^4', 'E-EXP-07', 3, 'design §5.4 (base constante)'),
  invalida('exponente', '(x-x+1)^4', 'E-EXP-07', 9, 'design §5.4 (base normalizada constante)'),
  // E-EXP-08: división entre una expresión con x
  invalida('division', '1/x', 'E-EXP-08', 2, 'CR-12'),
  invalida('division', 'x/x', 'E-EXP-08', 2, 'CR-21; tasks T-10'),
  invalida('division', '(x^2-1)/(x-1)', 'E-EXP-08', 8, 'requirements §10; R-02.6'),
  invalida('division', '2/(x+1)', 'E-EXP-08', 2, 'design §5.4'),
  invalida('division', 'x^2/x', 'E-EXP-08', 4, 'design §5.4'),
  invalida('division', '1/(x-1)^2', 'E-EXP-08', 2, 'design §5.4'),
  // E-EXP-09: división entre cero
  invalida('division-cero', 'x/0', 'E-EXP-09', 2, 'Tabla 9.1'),
  invalida('division-cero', 'x/(2-2)', 'E-EXP-09', 2, 'requirements §10; tasks T-10'),
  invalida('division-cero', '1/0.0', 'E-EXP-09', 2, 'design §5.4'),
  invalida('division-cero', '3x/(1-1)', 'E-EXP-09', 3, 'design §5.4'),
  invalida('division-cero', 'x/(x-x)', 'E-EXP-09', 2, 'design §5.4 (divisor normalizado: la constante 0)'),
  // E-EXP-10: grado mayor que 3
  invalida('grado', 'x^4', 'E-EXP-10', 2, 'CR-21; tasks T-10'),
  invalida('grado', 'x^(4)', 'E-EXP-10', 2, 'design §5.4'),
  invalida('grado', '(x^2)^2', 'E-EXP-10', 6, 'requirements §10; design §5.4'),
  invalida('grado', '(x-1)^4', 'E-EXP-10', 6, 'design §5.4'),
  invalida('grado', 'x^999999', 'E-EXP-10', 2, 'design §5.4'),
  invalida('grado', 'x*x*x*x', 'E-EXP-10', 6, 'requirements §10; design §5.4'),
  invalida('grado', 'x^4 - x^4', 'E-EXP-10', 2, 'design §5.4; R-02.4'),
  invalida('grado', 'x^2*x^2', 'E-EXP-10', 4, 'design §5.4'),
  invalida('grado', 'x^3x', 'E-EXP-10', 4, 'design §5.3 y §5.4'),
  invalida('grado', '(x+1)^2(x-1)^2', 'E-EXP-10', 8, 'design §5.3 y §5.4'),
  invalida('grado', '2x^2*3x^2', 'E-EXP-10', 7, 'design §5.3 y §5.4 (de izquierda a derecha)'),
  // E-EXP-11: complejidad excesiva (Tabla 9.2)
  invalida('complejidad', 'x+1+'.repeat(50) + 'x', 'E-EXP-11', 201, 'Tabla 9.2; CR-21 (201 caracteres)'),
  invalida('complejidad', '('.repeat(11) + 'x' + ')'.repeat(11), 'E-EXP-11', 11, 'Tabla 9.2 (profundidad)'),
  invalida('complejidad', 'x+'.repeat(50) + 'x', 'E-EXP-11', 101, 'Tabla 9.2 (elementos)'),
  // E-EXP-12: asignación o definición
  invalida('asignacion', 'f(x)=x^2', 'E-EXP-12', 1, 'CR-21'),
  invalida('asignacion', 'y = x^2', 'E-EXP-12', 1, 'requirements §10'),
  invalida('asignacion', 'x = 1', 'E-EXP-12', 1, 'design §5.2'),
  // Orden: se informa el primer error
  invalida('orden', '1/x + x^4', 'E-EXP-08', 2, 'design §5.4 (de izquierda a derecha)'),
  invalida('orden', 'x^4 + 1/x', 'E-EXP-10', 2, 'design §5.4 (de izquierda a derecha)'),
  invalida('orden', '(x^4)^0', 'E-EXP-10', 3, 'design §5.4 (la base antes que el exponente)'),
  invalida('orden', 'x^3*x^0', 'E-EXP-07', 7, 'design §5.4 (los factores antes que el producto)'),
  invalida('orden', 'sqrt(x^4)', 'E-EXP-06', 1, 'design §5.2 (el léxico antes que la normalización)'),
  invalida('orden', 'x^4 + y', 'E-EXP-03', 7, 'design §5.2 (el léxico antes que la normalización)')
]);
