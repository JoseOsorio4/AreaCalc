// Pruebas de src/presentacion/formato.js (T-11; design.md §14.1; requirements §12 y R-18.2 a R-18.4).
// Los textos esperados vienen de tasks T-11, de design §14.1 y de los campos
// `decimal` de tests/casos-referencia.js. Los valores se construyen con
// tests/aritmetica-independiente.js; los demás textos se escriben a mano.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { analizarPerfil } from '../../src/casos-de-uso/analizarPerfil.js';
import { interpretarFuncion } from '../../src/expresiones/normalizar.js';
import {
  UNIDADES, aDecimal, cantidadTexto, cotaLatex, cotaTexto, decimalConSimbolo, decimalConSimboloLatex, esDecimalExacto,
  fraccionLatex, fraccionTexto, monomioLatex, monomioTexto, multiploPiLatex, multiploPiTexto, polinomioLatex,
  polinomioTexto, quetzales, quetzalesCantidad, sustitucionLatex, sustitucionTexto
} from '../../src/presentacion/formato.js';
import { CASOS } from '../casos-referencia.js';
import { comparar, leer, producto, q } from '../aritmetica-independiente.js';
import { VALIDAS } from '../expresiones/tabla-gramatica.js';

const MENOS = '\u2212';
/** Polinomio { coef } a partir de coeficientes 'p/q' desde x⁰ (sin ceros finales). */
const pol = (...coef) => ({ coef: coef.map(leer) });
/** PI_APROX de design §6, transcrito: 35 decimales de π. */
const PI_APROX = q(314159265358979323846264338327950288n, 10n ** 35n);

describe('criterios de T-11', () => {
  it('243/4 → «= 60.75»; 40/3 → «≈ 13.3333»', () => {
    expect(decimalConSimbolo(q(243n, 4n))).toBe('= 60.75');
    expect(decimalConSimbolo(q(40n, 3n))).toBe('≈ 13.3333');
  });

  it('2000/3 → «Q666.67»; 2200/3 → «Q733.33»', () => {
    expect(quetzales(q(2000n, 3n))).toBe('Q666.67');
    expect(quetzales(q(2200n, 3n))).toBe('Q733.33');
  });

  it('−1/10⁹ → «≈ 0.0000», sin signo', () => {
    const texto = decimalConSimbolo(q(-1n, 10n ** 9n));
    expect(texto).toBe('≈ 0.0000');
    expect(texto).not.toMatch(/[-\u2212]/);
  });
});

describe('decimales de los casos de referencia', () => {
  /** Todos los valores exactos de casos-referencia.js que traen su texto decimal. */
  const conDecimal = [];
  (function recorrer(nodo, ruta) {
    if (nodo === null || typeof nodo !== 'object') return;
    if (nodo.clase === 'exacta' && typeof nodo.decimal === 'string') conDecimal.push([ruta, nodo.decimal, nodo.valor]);
    for (const [clave, hijo] of Object.entries(nodo)) recorrer(hijo, `${ruta}.${clave}`);
  }(CASOS, 'CASOS'));

  it('hay al menos 20 valores con su texto decimal', () => {
    expect(conDecimal.length).toBeGreaterThanOrEqual(20);
  });

  it.each(conDecimal)('%s → «%s»', (_, texto, valor) => {
    const obtenido = texto.startsWith('Q') ? quetzales(valor) : decimalConSimbolo(valor);
    expect(obtenido).toBe(texto);
  });

  it('CR-03: nunca aparecen los costos con redondeo prematuro', () => {
    const { estimacion } = CASOS['CR-03'].esperado;
    const textos = [quetzales(estimacion.costoBase.valor), quetzales(estimacion.costoEstimado.valor)];
    for (const incorrecto of estimacion.costosIncorrectos) expect(textos).not.toContain(incorrecto);
  });
});

describe('redondeo mitad alejándose de cero, sobre el racional (requirements §12)', () => {
  it.each([
    ['1/8', 'Q0.13'], ['-1/8', `${MENOS}Q0.13`], ['469/200', 'Q2.35'], ['-469/200', `${MENOS}Q2.35`], // a mitad: se aleja de cero
    ['1249999/10000000', 'Q0.12'], ['1/200', 'Q0.01'], ['1999/200', 'Q10.00'], ['100', 'Q100.00'], ['0', 'Q0.00']
  ])('quetzales(%s) → «%s»', (valor, texto) => {
    expect(quetzales(leer(valor))).toBe(texto);
  });

  it.each([
    ['1/20000', '≈ 0.0001'], ['-1/20000', `≈ ${MENOS}0.0001`], ['3/20000', '≈ 0.0002'], ['5/20000', '≈ 0.0003'],
    ['49999/1000000000', '≈ 0.0000'], ['19999/20000', '≈ 1.0000'], ['-19999/20000', `≈ ${MENOS}1.0000`]
  ])('decimalConSimbolo(%s) → «%s»', (valor, texto) => {
    expect(decimalConSimbolo(leer(valor))).toBe(texto);
  });

  it('se redondea una sola vez, sobre el valor exacto', () => {
    // 0.004445 redondeado en dos pasos (0.00445 y luego 0.0045) daría una cifra de más; en uno da 0.0044.
    expect(aDecimal(leer('889/200000'))).toBe('0.0044');
    expect(aDecimal(leer('89/20000'))).toBe('0.0045'); // 0.00445: a mitad, se aleja de cero
  });
});

describe('«=» o «≈», sin ceros finales y sin «−0» (R-18.2 a R-18.4)', () => {
  it.each([
    ['6', '= 6'], ['-6', `= ${MENOS}6`], ['0', '= 0'], ['3/10', '= 0.3'], ['-3/4', `= ${MENOS}0.75`],
    ['-2/3', `≈ ${MENOS}0.6667`], ['-4/3', `≈ ${MENOS}1.3333`], ['1/16', '= 0.0625'], ['1/32', '≈ 0.0313'],
    ['1/10000', '= 0.0001'], ['-1/30000', '≈ 0.0000'], ['-1/20001', '≈ 0.0000']
  ])('%s → «%s»', (valor, texto) => {
    expect(decimalConSimbolo(leer(valor))).toBe(texto);
  });

  it('la expansión exacta decide el símbolo: 1/16 es exacta con 4 decimales, 1/32 no', () => {
    expect(esDecimalExacto(leer('1/16'))).toBe(true);
    expect(esDecimalExacto(leer('1/32'))).toBe(false);
    expect(esDecimalExacto(leer('1/32'), 5)).toBe(true);
  });

  it('un negativo que redondea a cero no lleva signo en ningún formato', () => {
    const casi = q(-1n, 10n ** 9n);
    expect(aDecimal(casi)).toBe('0.0000');
    expect(quetzales(q(-1n, 1000n))).toBe('Q0.00');
    expect(decimalConSimboloLatex(casi)).toBe('\\approx 0.0000');
    expect(cantidadTexto({ clase: 'exacta', valor: casi }, 'u')).toBe(`${MENOS}1/1000000000 ≈ 0.0000 u`);
  });

  it('LaTeX usa «\\approx» y el signo «-»', () => {
    expect(decimalConSimboloLatex(q(243n, 4n))).toBe('= 60.75');
    expect(decimalConSimboloLatex(q(-2n, 3n))).toBe('\\approx -0.6667');
  });

  it('con valores enormes, el decimal sigue exacto (CR-35)', () => {
    const { I } = CASOS['CR-35'].esperado; // 275·10⁵⁸/9 = 30.5̄·10⁵⁸
    expect(decimalConSimbolo(I.valor)).toBe(`≈ 30${'5'.repeat(58)}.5556`);
  });
});

describe('fracciones (design §14.1)', () => {
  it.each([
    ['243/4', '243/4', '\\frac{243}{4}'], ['-3/4', `${MENOS}3/4`, '-\\frac{3}{4}'], ['6', '6', '6'], ['-2', `${MENOS}2`, '-2'],
    ['0', '0', '0'], ['1/1000000000000000000', '1/1000000000000000000', '\\frac{1}{1000000000000000000}']
  ])('%s → «%s» y «%s»', (valor, texto, latex) => {
    expect(fraccionTexto(leer(valor))).toBe(texto);
    expect(fraccionLatex(leer(valor))).toBe(latex);
  });

  it.each([
    ['-1', `(${MENOS}1)`, '\\left(-1\\right)'], ['4', '4', '4'], ['0', '0', '0'],
    ['-3/4', `(${MENOS}3/4)`, '\\left(-\\frac{3}{4}\\right)'], ['1/2', '(1/2)', '\\left(\\frac{1}{2}\\right)']
  ])('sustitución de %s → «%s» y «%s» (R-09.6)', (valor, texto, latex) => {
    expect(sustitucionTexto(leer(valor))).toBe(texto);
    expect(sustitucionLatex(leer(valor))).toBe(latex);
  });
});

describe('monomios y polinomios al estilo del curso (design §14.1)', () => {
  it.each([
    ['1/4', 4, 'x⁴/4', '\\frac{x^{4}}{4}'], ['5/4', 4, '5x⁴/4', '\\frac{5x^{4}}{4}'], ['1/12', 3, 'x³/12', '\\frac{x^{3}}{12}'],
    ['-1/3', 1, `${MENOS}x/3`, '-\\frac{x}{3}'], ['2', 1, '2x', '2x'], ['1', 2, 'x²', 'x^{2}'], ['-1', 1, `${MENOS}x`, '-x'],
    ['2/3', 0, '2/3', '\\frac{2}{3}'], ['1/7', 7, 'x⁷/7', '\\frac{x^{7}}{7}'], ['0', 3, '0', '0'], ['3', 10, '3x¹⁰', '3x^{10}']
  ])('%s·x^%i → «%s» y «%s»', (c, k, texto, latex) => {
    expect(monomioTexto(leer(c), k)).toBe(texto);
    expect(monomioLatex(leer(c), k)).toBe(latex);
  });

  it('el ejemplo de design §14.1, por potencia descendente', () => {
    const p = pol('2/3', '-5/3', '-4/3', '1');
    expect(polinomioTexto(p)).toBe(`x³ ${MENOS} 4x²/3 ${MENOS} 5x/3 + 2/3`);
    expect(polinomioLatex(p)).toBe('x^{3} - \\frac{4x^{2}}{3} - \\frac{5x}{3} + \\frac{2}{3}');
  });

  it('el polinomio cero es «0» y un coeficiente principal negativo lleva el signo pegado', () => {
    expect(polinomioTexto({ coef: [] })).toBe('0');
    expect(polinomioLatex({ coef: [] })).toBe('0');
    expect(polinomioTexto(pol('0', '5', '-1'))).toBe(`${MENOS}x² + 5x`);
  });

  /**
   * Antiderivadas de casos-referencia.js. Las de CR-02 y CR-03 están escritas en
   * orden ascendente, como en la pizarra (formulario §5.2 y §7.1); design §14.1
   * fija el descendente, así que se comparan con sus términos invertidos.
   */
  it.each([
    ['CR-01', ['0', '-1', '0', '0', '1/4'], false], ['CR-05', ['0', '0', '1/2'], false], ['CR-31', ['0', '-1/3', '1/2'], false],
    ['CR-02', ['0', '1', '0', '1/3'], true], ['CR-03', ['0', '2', '0', '1/12'], true]
  ])('antiderivada de %s', (id, coef, ascendente) => {
    const referencia = CASOS[id].esperado.antiderivada;
    const esperado = ascendente ? referencia.split(' + ').reverse().join(' + ') : referencia;
    expect(polinomioTexto(pol(...coef))).toBe(esperado);
  });

  it('coincide con textoNormalizado y latexNormalizado de T-10 en las 60 entradas de la tabla reconstruida', () => {
    const distintos = VALIDAS.flatMap(({ texto }) => {
      const { valor } = interpretarFuncion(texto);
      return polinomioTexto(valor.polinomio) === valor.textoNormalizado && polinomioLatex(valor.polinomio) === valor.latexNormalizado
        ? [] : [texto];
    });
    expect(VALIDAS.length).toBe(60);
    expect(distintos).toEqual([]);
  });
});

describe('múltiplos de π y cotas', () => {
  it.each([
    ['25', '25π', '25\\pi'], ['1', 'π', '\\pi'], ['1/4', 'π/4', '\\frac{\\pi}{4}'], ['9/4', '9π/4', '\\frac{9\\pi}{4}'],
    ['-1/2', `${MENOS}π/2`, '-\\frac{\\pi}{2}'], ['0', '0', '0']
  ])('%s·π → «%s» y «%s»', (k, texto, latex) => {
    expect(multiploPiTexto(leer(k))).toBe(texto);
    expect(multiploPiLatex(leer(k))).toBe(latex);
  });

  /** n·10⁻ᵉ como fracción exacta. */
  const porDiezA = (n, e) => q(n, 10n ** e);

  it.each([
    ['5.85·10⁻²⁵ (design §8 y §14.1)', '6·10⁻²⁵', '6 \\cdot 10^{-25}', porDiezA(585n, 27n)],
    ['6·10⁻²⁵', '6·10⁻²⁵', '6 \\cdot 10^{-25}', porDiezA(6n, 25n)],
    ['10⁻¹²', '1·10⁻¹²', '1 \\cdot 10^{-12}', porDiezA(1n, 12n)],
    ['9.5·10⁻¹³', '1·10⁻¹²', '1 \\cdot 10^{-12}', porDiezA(95n, 14n)],
    ['1.0000001·10⁻¹²', '2·10⁻¹²', '2 \\cdot 10^{-12}', porDiezA(10000001n, 19n)],
    ['3', '3', '3', q(3n)], ['25', '3·10¹', '3 \\cdot 10^{1}', q(25n)], ['0', '0', '0', q(0n)]
  ])('cota %s → «%s» y «%s»', (_, texto, latex, c) => {
    expect(cotaTexto(c)).toBe(texto);
    expect(cotaLatex(c)).toBe(latex);
  });

  it('la cota mostrada nunca es menor que la real (se redondea hacia arriba)', () => {
    const superindices = '⁰¹²³⁴⁵⁶⁷⁸⁹';
    const leerCota = (texto) => {
      const [m, potencia = '⁰'] = texto.split('·10');
      const negativo = potencia.startsWith('⁻');
      const e = Number([...potencia.replace('⁻', '')].map((d) => superindices.indexOf(d)).join(''));
      return negativo ? q(BigInt(m), 10n ** BigInt(e)) : q(BigInt(m) * 10n ** BigInt(e));
    };
    for (let n = 1n; n <= 400n; n += 7n) {
      for (const d of [1n, 3n, 7n, 10n ** 13n, 3n * 10n ** 25n]) {
        const c = q(n, d);
        const cota = leerCota(cotaTexto(c));
        expect(comparar(cota, c), `${n}/${d}`).toBeGreaterThanOrEqual(0);
        expect(comparar(cota, producto(c, q(10n))), `${n}/${d}`).toBeLessThanOrEqual(0); // y no más de 10 veces mayor
      }
    }
  });
});

describe('cantidades con unidad (design §10 y §14.1; R-15.1)', () => {
  it.each([
    ['243/4 = 60.75 u²', q(243n, 4n), 'u²'],
    ['40/3 ≈ 13.3333 m²', q(40n, 3n), 'm²'],
    ['6 u²', q(6n), 'u²'],
    ['81/4 = 20.25 u', q(81n, 4n), 'u'],
    ['20000 cm²', q(20000n), 'cm²'],
    [`${MENOS}2/3 ≈ ${MENOS}0.6667 m`, q(-2n, 3n), 'm'],
    ['10 %', q(10n), '%'],
    ['50 Q/m²', q(50n), 'Q/m²']
  ])('exacta → «%s»', (texto, valor, unidad) => {
    expect(cantidadTexto({ clase: 'exacta', valor }, unidad)).toBe(texto);
  });

  it('CR-32: el área exacta 1/(2·10¹⁸) se muestra con «≈ 0.0000» junto a la fracción', () => {
    const { Ageo } = CASOS['CR-32'].esperado;
    expect(cantidadTexto({ clase: 'exacta', valor: Ageo.valor }, 'u²')).toBe(`1/2000000000000000000 ${Ageo.decimal} u²`);
  });

  it('CR-19: el círculo de radio 5 m muestra 25π y su aproximación con PI_APROX', () => {
    const { area } = CASOS['CR-19'].subcasos[1].esperado;
    const k = q(area.coeficiente.num, area.coeficiente.den);
    const cantidad = { clase: 'multiploPi', coeficiente: k, aprox: producto(k, PI_APROX), cota: producto(k, q(1n, 10n ** 35n)) };
    expect(cantidadTexto(cantidad, 'm²')).toBe(`25π ${area.decimal} m²`);
  });

  it('CR-15: el área aproximada muestra «≈», la unidad y la cota, como el ejemplo de design §14.1', () => {
    const { esperado } = CASOS['CR-15'];
    const resultado = analizarPerfil({ ...CASOS['CR-15'].entrada, interpretacion: 'abstracta' });
    expect(cantidadTexto(resultado.valor.area.area, 'u²')).toBe(`${esperado.Ageo.decimal} u² (aproximada; cota de error ≤ 6·10⁻²⁵)`);
  });

  it('quetzales de una Cantidad: exacta, múltiplo de π y aproximada', () => {
    expect(quetzalesCantidad({ clase: 'exacta', valor: q(2000n, 3n) })).toBe('Q666.67');
    const k = q(250n);
    expect(quetzalesCantidad({ clase: 'multiploPi', coeficiente: k, aprox: producto(k, PI_APROX), cota: producto(k, q(1n, 10n ** 35n)) }))
      .toBe('Q250π ≈ Q785.40');
    expect(quetzalesCantidad({ clase: 'aproximada', valor: q(1234n, 100n), cota: q(1n, 10n ** 12n) }))
      .toBe('≈ Q12.34 (aproximada; cota de error ≤ Q1·10⁻¹²)');
  });

  it('las unidades admitidas son las de design §14.1 y requirements §11', () => {
    expect([...UNIDADES].sort()).toEqual(['%', 'Q/m²', 'cm', 'cm²', 'm', 'm²', 'u', 'u²'].sort());
    expect(() => cantidadTexto({ clase: 'exacta', valor: q(1n) }, 'km²')).toThrow(RangeError);
  });
});

describe('contrato', () => {
  it('rechaza lo que no es un Racional, una Cantidad o un número de decimales válido', () => {
    expect(() => aDecimal(0.5)).toThrow(TypeError);
    expect(() => fraccionTexto({ num: 1, den: 2 })).toThrow(TypeError);
    expect(() => aDecimal(q(1n), -1)).toThrow(RangeError);
    expect(() => aDecimal(q(1n), 1.5)).toThrow(RangeError);
    expect(() => cotaTexto(q(-1n))).toThrow(RangeError);
    expect(() => monomioTexto(q(1n), -1)).toThrow(RangeError);
    expect(() => cantidadTexto({ clase: 'otra' }, 'u')).toThrow(TypeError);
    expect(() => quetzalesCantidad(null)).toThrow(TypeError);
    expect(() => polinomioTexto({})).toThrow(TypeError);
  });

  it('formato.js no usa Number(), parseFloat, parseInt, toFixed, toPrecision ni Math', () => {
    const archivo = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'presentacion', 'formato.js');
    const codigo = readFileSync(archivo, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
    expect(codigo).not.toMatch(/\bNumber\s*\(|\bparseFloat\b|\bparseInt\b|\.toFixed\b|\.toPrecision\b|\bMath\./);
  });
});
