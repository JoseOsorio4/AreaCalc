// Pruebas de src/expresiones/sintaxis.js (T-09; design.md §5.3 y §15; requirements Tabla 9.1 y §10).
// Los códigos esperados de los casos CR vienen de tests/casos-referencia.js. Los
// demás árboles y códigos se transcriben de requirements Tabla 9.1 y §10, de
// design §5.3 y de tasks T-09; las posiciones se cuentan a mano, desde 1.
//
// Los árboles se comparan en una forma prefija escrita a mano, que produce
// `forma`, definida aquí y no en el código bajo prueba:
//   numero → su texto · x → x · negacion → (neg a) · suma → (+ a b) · resta → (- a b)
//   producto explícito → (* a b) · producto implícito → (*i a b) · division → (/ a b)
//   potencia → (^ base exponente)
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { analizarLexico } from '../../src/expresiones/lexico.js';
import { analizarExpresion, analizarSintaxis } from '../../src/expresiones/sintaxis.js';
import { CASOS } from '../casos-referencia.js';

function forma(nodo) {
  switch (nodo.tipo) {
    case 'numero': return nodo.valor;
    case 'x': return 'x';
    case 'negacion': return `(neg ${forma(nodo.arg)})`;
    case 'suma': return `(+ ${forma(nodo.izq)} ${forma(nodo.der)})`;
    case 'resta': return `(- ${forma(nodo.izq)} ${forma(nodo.der)})`;
    case 'producto': return `(${nodo.implicito ? '*i' : '*'} ${forma(nodo.izq)} ${forma(nodo.der)})`;
    case 'division': return `(/ ${forma(nodo.izq)} ${forma(nodo.der)})`;
    case 'potencia': return `(^ ${forma(nodo.base)} ${forma(nodo.exponente)})`;
    default: throw new Error(`nodo desconocido: ${nodo.tipo}`);
  }
}

/** Forma prefija del árbol de un texto válido. */
function arbol(texto) {
  const resultado = analizarExpresion(texto);
  expect(resultado.ok, `${texto}: ${resultado.errores?.[0]?.codigo}`).toBe(true);
  return forma(resultado.valor);
}

/** Único error como [codigo, posicion]. */
function error(texto) {
  const resultado = analizarExpresion(texto);
  expect(resultado.ok, texto).toBe(false);
  expect(resultado.errores).toHaveLength(1);
  return [resultado.errores[0].codigo, resultado.errores[0].posicion];
}

/** Todos los nodos de un árbol. */
function nodos(nodo) {
  const hijos = [nodo.arg, nodo.izq, nodo.der, nodo.base, nodo.exponente].filter(Boolean);
  return [nodo, ...hijos.flatMap(nodos)];
}

describe('construcciones admitidas (Tabla 9.1, columna «Válidos»)', () => {
  it.each([
    ['x', 'x'], ['3', '3'], ['0.25', '0.25'],
    ['x^3 - 1', '(- (^ x 3) 1)'], ['-x^2', '(neg (^ x 2))'], ['-(x-1)', '(neg (- x 1))'],
    ['3*x', '(* 3 x)'], ['x*x', '(* x x)'],
    ['3x', '(*i 3 x)'], ['3x^2', '(*i 3 (^ x 2))'], ['2(x-1)', '(*i 2 (- x 1))'],
    ['(x-1)(x+1)', '(*i (- x 1) (+ x 1))'], ['(x+1)x', '(*i (+ x 1) x)'], ['x(x+1)', '(*i x (+ x 1))'],
    ['x^2/4', '(/ (^ x 2) 4)'], ['(1/3)x^3', '(*i (/ 1 3) (^ x 3))'],
    ['x^2', '(^ x 2)'], ['(x-1)^2', '(^ (- x 1) 2)'], ['(2x)^3', '(^ (*i 2 x) 3)'], ['x^(2)', '(^ x 2)'],
    ['(x-1)^3', '(^ (- x 1) 3)'], ['x ^ 2 - 1', '(- (^ x 2) 1)'], ['x^3 \u2212 1', '(- (^ x 3) 1)']
  ])('«%s» → %s', (texto, esperado) => {
    expect(arbol(texto)).toBe(esperado);
  });
});

describe('precedencia (Tabla 9.1 y design §5.3)', () => {
  it.each([
    ['-x^2', '(neg (^ x 2))'], // −(x²)
    ['3x^2', '(*i 3 (^ x 2))'], // 3·(x²)
    ['1/2x', '(*i (/ 1 2) x)'], // (1/2)·x
    ['2 + x*x/4', '(+ 2 (/ (* x x) 4))'],
    ['x - 1 - 1', '(- (- x 1) 1)'], ['8/4/2', '(/ (/ 8 4) 2)'], // de izquierda a derecha
    ['1 + 2*3^2', '(+ 1 (* 2 (^ 3 2)))'],
    ['-x^2 + 3x - 2', '(- (+ (neg (^ x 2)) (*i 3 x)) 2)'],
    ['2*-x', '(* 2 (neg x))'], ['-2x', '(*i (neg 2) x)'], ['--x', '(neg (neg x))'], ['x+-2', '(+ x (neg 2))'],
    ['x^2x', '(*i (^ x 2) x)'], ['2x^2(x+1)', '(*i (*i 2 (^ x 2)) (+ x 1))']
  ])('«%s» → %s', (texto, esperado) => {
    expect(arbol(texto)).toBe(esperado);
  });

  it('el signo unario «+» no crea nodo', () => {
    expect(arbol('+x')).toBe('x');
    expect(arbol('+(x-1)')).toBe('(- x 1)');
  });
});

describe('producto implícito según el par de fichas (design §5.3)', () => {
  it.each([
    ['3x', '(*i 3 x)'], ['2(x-1)', '(*i 2 (- x 1))'], ['(x+1)x', '(*i (+ x 1) x)'],
    ['(x-1)(x+1)', '(*i (- x 1) (+ x 1))'], ['x(x+1)', '(*i x (+ x 1))'], ['2 x', '(*i 2 x)'], ['x^(2)x', '(*i (^ x 2) x)']
  ])('producto: «%s» → %s', (texto, esperado) => {
    expect(arbol(texto)).toBe(esperado);
  });

  it.each([
    ['x x', 3], ['x 2', 3], ['2 3', 3], ['(x+1)2', 6], ['3x x', 4], ['x^2 3', 5], ['x^(2)3', 6]
  ])('E-EXP-02: «%s» en %i, la segunda ficha del par', (texto, posicion) => {
    expect(error(texto)).toEqual(['E-EXP-02', posicion]);
  });
});

describe('exponentes en la sintaxis (design §5.3)', () => {
  it.each([
    ['x^', 3], ['x^   ', 3], ['x^(', 4], ['x^(2', 5], ['x^()', 4], ['x^*2', 3], ['x^)', 3], ['x^^2', 3]
  ])('E-EXP-02: «%s» en %i (exponente incompleto)', (texto, posicion) => {
    expect(error(texto)).toEqual(['E-EXP-02', posicion]);
  });

  it('CR-21: x^(1/2) → E-EXP-07', () => {
    const { entrada, esperado } = CASOS['CR-21'].subcasos[2];
    expect([error(entrada.textoFuncion)[0]]).toEqual(esperado.errores);
  });

  it.each([
    ['x^-1', 3], ['x^+2', 3], ['x^(-1)', 4], // signo
    ['x^1.5', 3], ['x^2.0', 3], ['x^(2.0)', 4], // decimal
    ['2^x', 3], ['x^(x)', 4], // x
    ['x^(1/2)', 5], ['x^(2+1)', 5], ['x^((2))', 4], // fracción u otra expresión
    ['x^2^3', 4], ['x^(2)^3', 6] // otro «^» justo después del exponente
  ])('E-EXP-07: «%s» en %i', (texto, posicion) => {
    expect(error(texto)).toEqual(['E-EXP-07', posicion]);
  });

  it.each([
    ['x^4', '(^ x 4)'], ['x^(4)', '(^ x 4)'], ['x^0', '(^ x 0)'], ['2^4', '(^ 2 4)'], ['(x^2)^2', '(^ (^ x 2) 2)'],
    ['x^999999', '(^ x 999999)'], ['x^02', '(^ x 02)']
  ])('«%s» es sintácticamente válido; su valor se comprueba al normalizar (T-10)', (texto, esperado) => {
    expect(arbol(texto)).toBe(esperado);
  });

  it('el exponente es un nodo numero con el texto del entero', () => {
    const { valor } = analizarExpresion('x^(3)');
    expect(valor.exponente).toEqual({ tipo: 'numero', valor: '3', posicion: 4 });
  });
});

describe('sintaxis incompleta o inválida → E-EXP-02 (requirements §10)', () => {
  it.each([
    ['(x-1', 5], ['x+*2', 3], ['2**x', 3], ['x)', 2], [')x', 1], ['()', 2], ['-', 2], ['x-', 3],
    ['(x))', 4], ['*x', 1], ['x*', 3], ['((x)', 5], ['2(x', 4], ['x /', 4]
  ])('«%s» → E-EXP-02 en %i', (texto, posicion) => {
    expect(error(texto)).toEqual(['E-EXP-02', posicion]);
  });

  it('el mensaje indica la posición', () => {
    expect(analizarExpresion('(x-1').errores[0].mensaje).toContain('posición 5');
  });
});

describe('profundidad de paréntesis → E-EXP-11 (Tabla 9.2)', () => {
  it('10 niveles se admiten; el paréntesis 11 da E-EXP-11', () => {
    expect(arbol('('.repeat(10) + 'x' + ')'.repeat(10))).toBe('x');
    const fallo = analizarExpresion('('.repeat(11) + 'x' + ')'.repeat(11)).errores[0];
    expect([fallo.codigo, fallo.posicion, fallo.datos.limite]).toEqual(['E-EXP-11', 11, 'profundidad']);
  });

  it('cuentan también los paréntesis del exponente', () => {
    expect(error('('.repeat(10) + 'x^(2)' + ')'.repeat(10))).toEqual(['E-EXP-11', 13]);
  });

  it('se informa al llegar al nivel 11, aunque el texto no cierre los paréntesis', () => {
    expect(error('('.repeat(11) + 'x')).toEqual(['E-EXP-11', 11]);
  });

  it('los grupos sucesivos no se anidan', () => {
    const { ok, valor } = analizarExpresion('(x)'.repeat(12));
    expect(ok).toBe(true);
    expect([valor.tipo, valor.implicito]).toEqual(['producto', true]);
  });

  it('un error anterior tiene prioridad', () => {
    expect(error('x x' + '('.repeat(11) + 'x' + ')'.repeat(11))).toEqual(['E-EXP-02', 3]);
  });
});

describe('textos de los casos de referencia', () => {
  // Códigos del léxico y de la sintaxis (T-09). E-EXP-08, E-EXP-09 y E-EXP-10 son
  // de la normalización (T-10), y E-SIS-01 del núcleo: esos textos son árboles válidos.
  // E-EXP-07 también puede venir de la normalización (x^0, 2^4); en los casos de
  // referencia solo aparece con x^(1/2), que es de la sintaxis.
  const DE_T09 = new Set(['E-EXP-01', 'E-EXP-02', 'E-EXP-03', 'E-EXP-04', 'E-EXP-05', 'E-EXP-06', 'E-EXP-07', 'E-EXP-11', 'E-EXP-12']);
  const textos = Object.entries(CASOS).flatMap(([id, caso]) => [
    ...(caso.entrada?.textoFuncion !== undefined ? [[id, caso.entrada.textoFuncion, caso.esperado.errores ?? []]] : []),
    ...(caso.entradas ?? []).map((e) => [id, e.textoFuncion, caso.esperado.errores ?? []]),
    ...(caso.subcasos ?? []).filter((s) => s.entrada.textoFuncion !== undefined)
      .map((s) => [id, s.entrada.textoFuncion, s.esperado.errores ?? []])
  ]);

  it('incluye los textos de la función de todos los casos', () => {
    expect(textos.length).toBeGreaterThanOrEqual(40);
  });

  it.each(textos)('%s: «%s» → %j', (id, texto, errores) => {
    const sintacticos = errores.filter((codigo) => DE_T09.has(codigo));
    const resultado = analizarExpresion(texto);
    if (sintacticos.length === 0) expect(resultado.ok).toBe(true);
    else expect(resultado.errores.map((e) => e.codigo)).toEqual(sintacticos);
  });

  it.each([
    ['CR-03', '2 + x^2/4', '(+ 2 (/ (^ x 2) 4))'],
    ['CR-16', '0.25x^2 + 2', '(+ (*i 0.25 (^ x 2)) 2)'],
    ['CR-16', '(1/4)x^2 + 2', '(+ (*i (/ 1 4) (^ x 2)) 2)'],
    ['CR-16', '2 + x*x/4', '(+ 2 (/ (* x x) 4))'],
    ['CR-27', 'x(x+1)', '(*i x (+ x 1))'],
    ['CR-27', 'x*(x+1)', '(* x (+ x 1))'],
    ['CR-28', '(x - 1/3)(x - 2)(x + 1)', '(*i (*i (- x (/ 1 3)) (- x 2)) (+ x 1))'],
    ['CR-30', '(x-1)^2(x+2)', '(*i (^ (- x 1) 2) (+ x 2))'],
    ['CR-32', '(0.000001x)^3', '(^ (*i 0.000001 x) 3)'],
    ['CR-35', '1000000^3*1000000^3*1000000^3*1000000*(x - 1/3)(x^2 + 1)',
      '(*i (* (* (* (* (^ 1000000 3) (^ 1000000 3)) (^ 1000000 3)) 1000000) (- x (/ 1 3))) (+ (^ x 2) 1))']
  ])('%s: «%s» → %s', (id, texto, esperado) => {
    expect(textos.some(([cr, t]) => cr === id && t === texto), 'el texto está en casos-referencia.js').toBe(true);
    expect(arbol(texto)).toBe(esperado);
  });

  it('CR-12 y CR-21: 1/x, x/x y x^4 son árboles válidos; sus errores son de T-10', () => {
    expect(arbol('1/x')).toBe('(/ 1 x)');
    expect(arbol('x/x')).toBe('(/ x x)');
    expect(arbol('x/0')).toBe('(/ x 0)');
    expect(arbol('x/(2-2)')).toBe('(/ x (- 2 2))');
    expect(arbol('x*x*x*x')).toBe('(* (* (* x x) x) x)');
    expect(arbol('x^4 - x^4')).toBe('(- (^ x 4) (^ x 4))');
  });
});

describe('árbol resultante (design §5.3)', () => {
  it('cada nodo lleva la posición de su ficha principal', () => {
    const { valor } = analizarExpresion('x^3 - 1');
    expect(valor).toEqual({
      tipo: 'resta', posicion: 5,
      izq: { tipo: 'potencia', posicion: 2, base: { tipo: 'x', posicion: 1 }, exponente: { tipo: 'numero', valor: '3', posicion: 3 } },
      der: { tipo: 'numero', valor: '1', posicion: 7 }
    });
    expect(analizarExpresion('3x').valor).toMatchObject({ tipo: 'producto', implicito: true, posicion: 2 });
    expect(analizarExpresion('3*x').valor).toMatchObject({ tipo: 'producto', implicito: false, posicion: 2 });
    expect(analizarExpresion('x/4').valor).toMatchObject({ tipo: 'division', posicion: 2 });
    expect(analizarExpresion('-x').valor).toMatchObject({ tipo: 'negacion', posicion: 1 });
    expect(analizarExpresion('(x+1)').valor).toMatchObject({ tipo: 'suma', posicion: 3 }); // sin nodo de paréntesis
  });

  it('los números guardan el texto del literal, sin convertirlo (tasks T-09)', () => {
    expect(analizarExpresion('0.25x').valor.izq).toEqual({ tipo: 'numero', valor: '0.25', posicion: 1 });
    expect(analizarExpresion('007.50').valor.valor).toBe('007.50');
  });

  it('el resultado y todos los nodos están congelados', () => {
    const resultado = analizarExpresion('-(x - 1/3)(x^2 + 1) + 2x');
    expect(Object.isFrozen(resultado)).toBe(true);
    expect(resultado.advertencias).toEqual([]);
    const todos = nodos(resultado.valor);
    expect(todos.length).toBeGreaterThan(10);
    expect(todos.every(Object.isFrozen)).toBe(true);
  });
});

describe('contrato de analizarSintaxis y analizarExpresion', () => {
  it('analizarExpresion equivale a léxico y después sintaxis', () => {
    for (const texto of ['x^3 - 1', 'x x', '(x-1']) {
      expect(analizarExpresion(texto)).toEqual(analizarSintaxis(analizarLexico(texto).valor));
    }
  });

  it('un error léxico se devuelve sin pasar por la sintaxis', () => {
    expect(error('')).toEqual(['E-EXP-01', null]);
    expect(analizarExpresion('y + 1')).toEqual(analizarLexico('y + 1'));
  });

  it('sin fichas → E-EXP-01; lo que no es una lista de fichas es un error de programación', () => {
    expect(analizarSintaxis([]).errores.map((e) => e.codigo)).toEqual(['E-EXP-01']);
    expect(() => analizarSintaxis('x')).toThrow(TypeError);
    expect(() => analizarExpresion(5)).toThrow(TypeError);
  });

  it('un error es un ErrorAreaCalc del campo de la función, congelado y sin árbol', () => {
    const resultado = analizarExpresion('x^');
    expect(Object.isFrozen(resultado)).toBe(true);
    expect(Object.isFrozen(resultado.errores)).toBe(true);
    expect(resultado.errores[0].campo).toBe('funcion');
    expect(resultado).not.toHaveProperty('valor');
  });
});

describe('analizar el texto no lo ejecuta (R-20.1)', () => {
  it.each([
    ['constructor', 'E-EXP-03'], ['toString', 'E-EXP-03'], ['hasOwnProperty', 'E-EXP-03'], ['__proto__', 'E-EXP-06'],
    ['alert(1)', 'E-EXP-06'], ['x; process.exit()', 'E-EXP-06'], ['`x`', 'E-EXP-06'], ['x[0]', 'E-EXP-06']
  ])('«%s» se rechaza con %s', (texto, codigo) => {
    expect(error(texto)[0]).toBe(codigo);
  });

  it('los módulos de expresiones/ no usan eval, Function, Number(), parseFloat ni parseInt', () => {
    const carpeta = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'expresiones');
    for (const archivo of ['lexico.js', 'sintaxis.js']) {
      const codigo = readFileSync(join(carpeta, archivo), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
      expect(codigo, archivo).not.toMatch(/\beval\b|\bFunction\b|\bNumber\s*\(|\bparseFloat\b|\bparseInt\b/);
    }
  });
});
