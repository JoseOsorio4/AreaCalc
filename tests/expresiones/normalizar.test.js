// Pruebas de src/expresiones/normalizar.js (T-10; design.md §5.4, §10 y §15; requirements R-02).
// Los valores esperados vienen de tests/casos-referencia.js (CR) y de la tabla
// reconstruida para pruebas, tests/expresiones/tabla-gramatica.js, derivada a
// mano de las especificaciones. Ninguno se calcula con el código bajo prueba.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { interpretarFuncion, normalizarArbol } from '../../src/expresiones/normalizar.js';
import { analizarExpresion } from '../../src/expresiones/sintaxis.js';
import { CASOS } from '../casos-referencia.js';
import { INVALIDAS, TEXTOS_D09, VALIDAS } from './tabla-gramatica.js';

/** 'p/q' o 'p' → { num, den } de BigInt, como un Racional irreducible. */
function q(texto) {
  const [num, den = '1'] = texto.split('/');
  return { num: BigInt(num), den: BigInt(den) };
}

/** Modelo de un texto válido. */
function modelo(texto) {
  const resultado = interpretarFuncion(texto);
  expect(resultado.ok, `${texto}: ${resultado.errores?.[0]?.codigo}`).toBe(true);
  return resultado.valor;
}

/** Único error como [codigo, posicion]. */
function error(texto) {
  const resultado = interpretarFuncion(texto);
  expect(resultado.ok, texto).toBe(false);
  expect(resultado.errores).toHaveLength(1);
  return [resultado.errores[0].codigo, resultado.errores[0].posicion];
}

const CODIGOS_EXP = Array.from({ length: 12 }, (_, i) => `E-EXP-${String(i + 1).padStart(2, '0')}`);

describe('tabla reconstruida para pruebas (design §15)', () => {
  it('tiene al menos 33 entradas válidas y 59 inválidas, sin textos repetidos', () => {
    expect(VALIDAS.length).toBeGreaterThanOrEqual(33);
    expect(INVALIDAS.length).toBeGreaterThanOrEqual(59);
    const textos = [...VALIDAS, ...INVALIDAS].map((e) => e.texto);
    expect(new Set(textos).size).toBe(textos.length);
  });

  it('cubre todos los códigos de expresión de requirements §10', () => {
    const usados = new Set(INVALIDAS.map((e) => e.codigo));
    expect(CODIGOS_EXP.filter((c) => !usados.has(c))).toEqual([]);
  });

  it('cada entrada cita su fuente', () => {
    expect([...VALIDAS, ...INVALIDAS].filter((e) => !e.fuente)).toEqual([]);
  });

  it('los textos de CR-33 a CR-36 coinciden con casos-referencia.js', () => {
    for (const [id, texto] of Object.entries(TEXTOS_D09)) expect(texto, id).toBe(CASOS[id].entrada.textoFuncion);
  });

  it.each(VALIDAS.map((e) => [e.texto, e]))('válida: «%s»', (texto, entrada) => {
    const m = modelo(texto);
    expect(m.polinomio.coef).toEqual(entrada.coef.map(q));
    expect(m.polinomio.coef.length).toBeLessThanOrEqual(4); // grado ≤ 3
    expect(m.huboDesarrollo).toBe(entrada.desarrollo);
    expect(m.textoNormalizado).toBe(entrada.normalizado);
  });

  it.each(INVALIDAS.map((e) => [e.texto.length > 40 ? `${e.texto.slice(0, 37)}…` : e.texto, e]))(
    'inválida: «%s»',
    (_, entrada) => {
      expect(error(entrada.texto)).toEqual([entrada.codigo, entrada.posicion]);
    }
  );
});

describe('criterios de aceptación de T-10', () => {
  it.each([
    ['x^4', 'E-EXP-10'], ['2^4', 'E-EXP-07'], ['x^0', 'E-EXP-07'], ['x/x', 'E-EXP-08'], ['x/(2-2)', 'E-EXP-09']
  ])('«%s» → %s', (texto, codigo) => {
    expect(error(texto)[0]).toBe(codigo);
  });

  it('E-EXP-10 indica el grado que se habría obtenido, sin calcular la potencia', () => {
    expect(interpretarFuncion('x^4').errores[0].datos.grado).toBe('4');
    expect(interpretarFuncion('x*x*x*x').errores[0].datos.grado).toBe('4');
    expect(interpretarFuncion('x^999999').errores[0].datos.grado).toBe('999999');
    expect(interpretarFuncion('(x^3)^999999').errores[0].datos.grado).toBe('2999997');
  });

  it('CR-32: (0.000001x)^3 se admite con el coeficiente 1/10¹⁸ (sin tope, D-09)', () => {
    const caso = CASOS['CR-32'];
    expect(caso.esperado.admitida).toBe(true);
    const { polinomio } = modelo(caso.entrada.textoFuncion);
    expect(polinomio.coef).toHaveLength(4);
    expect(polinomio.coef[3]).toEqual(caso.esperado.coeficiente.valor);
    expect(polinomio.coef.slice(0, 3)).toEqual([q('0'), q('0'), q('0')]);
  });

  it.each(['CR-33', 'CR-34', 'CR-35', 'CR-36'])('%s se interpreta sin error (su E-SIS-01 o W-04 es del núcleo)', (id) => {
    const caso = CASOS[id];
    const esperado = VALIDAS.find((e) => e.texto === caso.entrada.textoFuncion);
    expect(esperado, 'entrada de la tabla').toBeDefined();
    expect(modelo(caso.entrada.textoFuncion).polinomio.coef).toEqual(esperado.coef.map(q));
  });

  it('CR-34: los coeficientes contienen la raíz racional exacta 1/999983²¹', () => {
    const raiz = CASOS['CR-34'].esperado.raizRacional.valor;
    const { coef } = modelo(CASOS['CR-34'].entrada.textoFuncion).polinomio;
    // (x − r)(x² + 1) = x³ − r·x² + x − r
    expect(coef).toEqual([{ num: -raiz.num, den: raiz.den }, q('1'), { num: -raiz.num, den: raiz.den }, q('1')]);
  });
});

describe('casos de referencia', () => {
  it('CR-07: (x-1)^2 y x^2 - 2x + 1 dan el mismo modelo (R-02.3)', () => {
    const [a, b] = CASOS['CR-07'].entradas.map((e) => modelo(e.textoFuncion));
    expect(a.polinomio).toEqual(b.polinomio);
    expect(a.textoNormalizado).toBe(b.textoNormalizado);
    expect(a.latexNormalizado).toBe(b.latexNormalizado);
    expect([a.huboDesarrollo, b.huboDesarrollo]).toEqual([true, false]);
  });

  it('CR-16: las cuatro escrituras dan el modelo de CR-03', () => {
    const referencia = modelo(CASOS['CR-03'].entrada.textoFuncion);
    expect(CASOS['CR-16'].esperado.mismoQue).toBe('CR-03');
    for (const { textoFuncion } of CASOS['CR-16'].entradas) {
      const m = modelo(textoFuncion);
      expect(m.polinomio, textoFuncion).toEqual(referencia.polinomio);
      expect(m.textoNormalizado).toBe(referencia.textoNormalizado);
    }
  });

  it('CR-27: x(x+1) y x*(x+1) dan el modelo x² + x', () => {
    const modelos = CASOS['CR-27'].entradas.map((e) => modelo(e.textoFuncion));
    expect(modelos[0].polinomio).toEqual(modelos[1].polinomio);
    for (const m of modelos) expect(m.textoNormalizado).toBe(CASOS['CR-27'].esperado.modelo);
  });

  it('CR-12: 1/x → E-EXP-08, sin modelo', () => {
    const { entrada, esperado } = CASOS['CR-12'];
    const resultado = interpretarFuncion(entrada.textoFuncion);
    expect(resultado.errores.map((e) => e.codigo)).toEqual(esperado.errores);
    expect(resultado).not.toHaveProperty('valor');
  });

  it('CR-17: 0.1 + 0.2 es exactamente 3/10 (R-03.2)', () => {
    const { entrada, esperado } = CASOS['CR-17'];
    expect(modelo(entrada.textoFuncion).polinomio.coef).toEqual([esperado.suma.valor]);
  });

  it('CR-13: vacío → E-EXP-01; y + 1 → E-EXP-03', () => {
    for (const { entrada, esperado } of CASOS['CR-13'].subcasos.slice(0, 2)) {
      expect(interpretarFuncion(entrada.textoFuncion).errores.map((e) => e.codigo)).toEqual(esperado.errores);
    }
  });

  it.each(CASOS['CR-21'].subcasos.map((s, i) => [i, s]))('CR-21, subcaso %i', (_, { entrada, esperado }) => {
    // El texto de 201 caracteres no lo fija la fuente (pendiente de CR-21): se usa uno de esa longitud.
    const texto = entrada.textoFuncion ?? 'x+1+'.repeat(51).slice(0, entrada.longitudFuncion);
    expect(interpretarFuncion(texto).errores.map((e) => e.codigo)).toEqual(esperado.errores);
  });

  it('los textos de la función de todos los CR sin errores de expresión dan un modelo', () => {
    const textos = Object.values(CASOS).flatMap((caso) => [
      ...(caso.entrada?.textoFuncion !== undefined ? [[caso.entrada.textoFuncion, caso.esperado.errores ?? []]] : []),
      ...(caso.entradas ?? []).map((e) => [e.textoFuncion, caso.esperado.errores ?? []]),
      ...(caso.subcasos ?? []).filter((s) => s.entrada.textoFuncion !== undefined)
        .map((s) => [s.entrada.textoFuncion, s.esperado.errores ?? []])
    ]);
    const sinErrorDeExpresion = textos.filter(([, errores]) => !errores.some((c) => c.startsWith('E-EXP')));
    expect(sinErrorDeExpresion.length).toBeGreaterThanOrEqual(30);
    for (const [texto] of sinErrorDeExpresion) expect(interpretarFuncion(texto).ok, texto).toBe(true);
  });
});

describe('huboDesarrollo (design §5.4; R-09.5)', () => {
  it.each(['(x-1)^2', '2(x+1)', '(x-1)(x+1)', '2 + (x+1)(x-1)', '-(x+1)^2', '((x+1))^2', '(1+1)x'])(
    '«%s» → true: producto o potencia con un factor que es una suma o una resta',
    (texto) => {
      expect(modelo(texto).huboDesarrollo).toBe(true);
    }
  );

  it.each(['x^2 - 2x + 1', '(1/4)x^2 + 2', '2 + x*x/4', '(2x)^3', '-(x-1)', '(x+1)/2', 'x', '(x)(x)'])(
    '«%s» → false',
    (texto) => {
      expect(modelo(texto).huboDesarrollo).toBe(false);
    }
  );
});

describe('interpretaciones de design §5.4 que R debe confirmar', () => {
  it('el grado se comprueba sobre cada subexpresión ya normalizada (R-02.4)', () => {
    // 0·x vale 0 (grado −1), así que ninguna subexpresión de 0*x*x*x*x pasa de grado 3.
    expect(modelo('0*x*x*x*x').polinomio.coef).toEqual([]);
    expect(modelo('(x-x)^2').polinomio.coef).toEqual([]);
    // En cambio, x*x*x*x ya tiene grado 4 antes de multiplicar por 0.
    expect(error('x*x*x*x*0')).toEqual(['E-EXP-10', 6]);
  });
});

describe('textoNormalizado y latexNormalizado (design §10 y §14.1)', () => {
  it('siguen los ejemplos del diseño', () => {
    expect(modelo('x^3 - 1').textoNormalizado).toBe('x³ − 1'); // design §10
    expect(modelo('(x - 1/3)(x - 2)(x + 1)').textoNormalizado).toBe('x³ − 4x²/3 − 5x/3 + 2/3'); // design §14.1
  });

  it.each([
    ['x^3 - 1', 'x^{3} - 1'],
    ['(x - 1/3)(x - 2)(x + 1)', 'x^{3} - \\frac{4x^{2}}{3} - \\frac{5x}{3} + \\frac{2}{3}'],
    ['2 + x^2/4', '\\frac{x^{2}}{4} + 2'],
    ['-x^3/3 + 2x/5 - 7/2', '-\\frac{x^{3}}{3} + \\frac{2x}{5} - \\frac{7}{2}'],
    ['-2', '-2'], ['0', '0'], ['x - x', '0'], ['3x', '3x'], ['(0.000001x)^3', `\\frac{x^{3}}{${10n ** 18n}}`]
  ])('LaTeX de «%s» → %s', (texto, latex) => {
    expect(modelo(texto).latexNormalizado).toBe(latex);
  });

  it('se generan desde el polinomio, no desde el texto del usuario (R-20.5)', () => {
    const a = modelo('  1 +   x^2 ');
    const b = modelo('x*x+1');
    expect(a.textoOriginal).toBe('  1 +   x^2 ');
    expect([a.textoNormalizado, a.latexNormalizado]).toEqual([b.textoNormalizado, b.latexNormalizado]);
    expect([a.textoNormalizado, a.latexNormalizado]).toEqual(['x² + 1', 'x^{2} + 1']);
  });
});

describe('contrato', () => {
  it('ModeloValidado tiene los campos de design §10 y está congelado', () => {
    const resultado = interpretarFuncion('(x-1)^2');
    expect(Object.isFrozen(resultado)).toBe(true);
    expect(resultado.advertencias).toEqual([]);
    expect(Object.keys(resultado.valor).sort())
      .toEqual(['huboDesarrollo', 'latexNormalizado', 'polinomio', 'textoNormalizado', 'textoOriginal']);
    expect(Object.isFrozen(resultado.valor)).toBe(true);
    expect(Object.isFrozen(resultado.valor.polinomio)).toBe(true);
  });

  it('un error es un único ErrorAreaCalc del campo de la función, congelado y sin modelo', () => {
    const resultado = interpretarFuncion('x^4');
    expect(Object.isFrozen(resultado)).toBe(true);
    expect(Object.isFrozen(resultado.errores)).toBe(true);
    expect(resultado.errores[0].campo).toBe('funcion');
    expect(resultado).not.toHaveProperty('valor');
  });

  it('normalizarArbol recibe el árbol de analizarExpresion', () => {
    const { valor: arbol } = analizarExpresion('2(x+1)');
    expect(normalizarArbol(arbol).valor).toEqual({ polinomio: { coef: [q('2'), q('2')] }, huboDesarrollo: true });
    expect(normalizarArbol(analizarExpresion('x/0').valor).errores[0].codigo).toBe('E-EXP-09');
  });

  it('lo que no es un árbol es un error de programación', () => {
    expect(() => normalizarArbol(null)).toThrow(TypeError);
    expect(() => normalizarArbol('x')).toThrow(TypeError);
    expect(() => normalizarArbol({ tipo: 'llamada', posicion: 1 })).toThrow(TypeError);
    expect(() => normalizarArbol({
      tipo: 'potencia', posicion: 2, base: { tipo: 'x', posicion: 1 }, exponente: { tipo: 'numero', valor: '1.5', posicion: 3 }
    })).toThrow(TypeError);
    expect(() => interpretarFuncion(5)).toThrow(TypeError);
  });
});

describe('sin ejecución ni coma flotante (R-20.1; design §5.4)', () => {
  it('normalizar.js no usa eval, Function, Number(), parseFloat, parseInt, Math ni aproximaciones', () => {
    const archivo = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'expresiones', 'normalizar.js');
    const codigo = readFileSync(archivo, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
    expect(codigo).not.toMatch(/\beval\b|\bFunction\b|\bNumber\s*\(|\bparseFloat\b|\bparseInt\b|\bMath\.|\baNumber\b|\bevaluarAprox\b/);
  });
});
