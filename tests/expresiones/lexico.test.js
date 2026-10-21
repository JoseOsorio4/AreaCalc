// Pruebas de src/expresiones/lexico.js (T-09; design.md §5.2; requirements Tablas 9.1 y 9.2, y §10).
// Los códigos de CR-13 y CR-21 vienen de tests/casos-referencia.js. Los demás
// códigos se transcriben de requirements §10, la Tabla 9.1 y design §5.2; las
// posiciones se cuentan a mano, desde 1, sobre el texto de cada caso.
import { describe, expect, it } from 'vitest';
import { analizarLexico } from '../../src/expresiones/lexico.js';
import { CASOS } from '../casos-referencia.js';

/** Fichas como [tipo, texto, posicion]. */
function fichas(texto) {
  const resultado = analizarLexico(texto);
  expect(resultado.ok, texto).toBe(true);
  return resultado.valor.map((f) => [f.tipo, f.texto, f.posicion]);
}

/** Único error como [codigo, posicion]. */
function error(texto) {
  const resultado = analizarLexico(texto);
  expect(resultado.ok, texto).toBe(false);
  expect(resultado.errores).toHaveLength(1);
  return [resultado.errores[0].codigo, resultado.errores[0].posicion];
}

const primerError = (texto) => analizarLexico(texto).errores[0];

describe('fichas de las construcciones admitidas (Tabla 9.1)', () => {
  it('números, x, operadores y paréntesis, con su texto y su posición', () => {
    expect(fichas('3x^2 - 0.25')).toEqual([
      ['NUMERO', '3', 1], ['X', 'x', 2], ['POTENCIA', '^', 3], ['NUMERO', '2', 4],
      ['MENOS', '-', 6], ['NUMERO', '0.25', 8]
    ]);
    expect(fichas('(x\u22121)*(x+1)/4')).toEqual([
      ['ABRE', '(', 1], ['X', 'x', 2], ['MENOS', '\u2212', 3], ['NUMERO', '1', 4], ['CIERRA', ')', 5],
      ['POR', '*', 6], ['ABRE', '(', 7], ['X', 'x', 8], ['MAS', '+', 9], ['NUMERO', '1', 10],
      ['CIERRA', ')', 11], ['ENTRE', '/', 12], ['NUMERO', '4', 13]
    ]);
  });

  it('los espacios se omiten y separan fichas: x x son dos fichas X', () => {
    expect(fichas('x x')).toEqual([['X', 'x', 1], ['X', 'x', 3]]);
    expect(fichas('\tx ^\u00a02 ')).toEqual([['X', 'x', 2], ['POTENCIA', '^', 4], ['NUMERO', '2', 6]]);
  });

  it('los literales guardan su texto, sin convertirlos (tasks T-09)', () => {
    expect(fichas('007.50 + 1000000 - 0.000001')).toEqual([
      ['NUMERO', '007.50', 1], ['MAS', '+', 8], ['NUMERO', '1000000', 10], ['MENOS', '-', 18], ['NUMERO', '0.000001', 20]
    ]);
    // En el límite de la Tabla 9.2: |v| ≤ 1 000 000 y ≤ 6 decimales.
    for (const texto of ['1000000.000000', '0001000000', '999999.999999']) {
      expect(fichas(texto)).toEqual([['NUMERO', texto, 1]]);
    }
  });

  it('el resultado y las fichas están congelados', () => {
    const resultado = analizarLexico('x+1');
    expect(resultado.advertencias).toEqual([]);
    expect(Object.isFrozen(resultado)).toBe(true);
    expect(Object.isFrozen(resultado.valor)).toBe(true);
    expect(resultado.valor.every(Object.isFrozen)).toBe(true);
  });
});

describe('1: vacío o solo espacios → E-EXP-01', () => {
  it('CR-13: texto vacío', () => {
    const { entrada, esperado } = CASOS['CR-13'].subcasos[0];
    expect([error(entrada.textoFuncion)[0]]).toEqual(esperado.errores);
  });

  it.each(['   ', '\t ', '\u00a0'])('«%s» → E-EXP-01, sin posición', (texto) => {
    expect(error(texto)).toEqual(['E-EXP-01', null]);
  });
});

describe('2: más de 200 caracteres → E-EXP-11 (Tabla 9.2)', () => {
  it('CR-21: un texto de 201 caracteres', () => {
    const { entrada, esperado } = CASOS['CR-21'].subcasos[7];
    // La fuente solo fija la longitud (pendiente de CR-21); se prueban dos contenidos.
    const textos = ['x' + ' '.repeat(entrada.longitudFuncion - 1), 'x+1+'.repeat(51).slice(0, entrada.longitudFuncion)];
    for (const texto of textos) {
      expect(texto).toHaveLength(201);
      expect([error(texto)[0]]).toEqual(esperado.errores);
    }
  });

  it('señala el carácter 201 e indica el límite', () => {
    const fallo = primerError('x+1+'.repeat(50) + 'x');
    expect([fallo.codigo, fallo.posicion, fallo.datos.limite]).toEqual(['E-EXP-11', 201, 'caracteres']);
  });

  it('200 caracteres sí se admiten', () => {
    expect(fichas('x' + ' '.repeat(199))).toEqual([['X', 'x', 1]]);
  });

  it('va después de E-EXP-01 y antes del prefijo de asignación', () => {
    expect(error(' '.repeat(201))).toEqual(['E-EXP-01', null]);
    expect(error('y = ' + 'x'.repeat(197))[0]).toBe('E-EXP-11');
  });
});

describe('3: prefijo de asignación o definición → E-EXP-12', () => {
  it('CR-21: f(x)=x^2', () => {
    const { entrada, esperado } = CASOS['CR-21'].subcasos[4];
    expect([error(entrada.textoFuncion)[0]]).toEqual(esperado.errores);
  });

  it.each([
    ['f(x)=x^2', 1], ['y = x^2', 1], ['x = 1', 1], ['  f ( x ) = x', 3], ['Y=2', 1], ['g(t)=t', 1], ['y =', 1]
  ])('«%s» → E-EXP-12 en %i, el comienzo del prefijo', (texto, posicion) => {
    expect(error(texto)).toEqual(['E-EXP-12', posicion]);
  });

  it('se comprueba antes del recorrido', () => {
    expect(error('y = sqrt(x)')).toEqual(['E-EXP-12', 1]);
    expect(error('y = 0,5x')).toEqual(['E-EXP-12', 1]);
  });

  it('un «=» seguido de «=» o fuera del prefijo no es asignación', () => {
    expect(error('x==1')).toEqual(['E-EXP-06', 2]);
    expect(error('y==1')).toEqual(['E-EXP-03', 1]);
    expect(error('2=x')).toEqual(['E-EXP-06', 2]);
    expect(error('f(2)=x')).toEqual(['E-EXP-06', 1]);
    expect(error('x+y=1')).toEqual(['E-EXP-03', 3]);
  });
});

describe('4: formato numérico no admitido → E-EXP-04', () => {
  it('CR-21: 0,5x', () => {
    const { entrada, esperado } = CASOS['CR-21'].subcasos[5];
    expect([error(entrada.textoFuncion)[0]]).toEqual(esperado.errores);
  });

  it.each([
    ['0,5x', 2], ['1,000', 2], ['3 + 1,5', 6], // coma
    ['1e3', 2], ['2E-1', 2], ['2.5e+3', 4], ['2e\u22121', 2], // notación científica
    ['.5x', 1], ['5.', 2], ['x.5', 2], ['1.5.3', 4], ['5.e3', 2] // punto con dígitos a un solo lado
  ])('«%s» → E-EXP-04 en %i', (texto, posicion) => {
    expect(error(texto)).toEqual(['E-EXP-04', posicion]);
  });
});

describe('4: nombres distintos de x', () => {
  it('CR-13 y CR-21: y + 1 y X^2 → E-EXP-03', () => {
    for (const { entrada, esperado } of [CASOS['CR-13'].subcasos[1], CASOS['CR-21'].subcasos[6]]) {
      expect([error(entrada.textoFuncion)[0]]).toEqual(esperado.errores);
    }
  });

  it.each([
    ['y + 1', 1, 'y'], ['X^2', 1, 'X'], ['pi*x', 1, 'pi'], ['t^2', 1, 't'], ['e*x', 1, 'e'], ['2e', 2, 'e'],
    ['2ex', 2, 'ex'], ['x2', 1, 'x2'], ['xx', 1, 'xx'], ['3xx', 2, 'xx'], ['2x + y', 6, 'y'], ['M', 1, 'M'], ['CM', 1, 'CM']
  ])('«%s» → E-EXP-03 en %i con el símbolo «%s»', (texto, posicion, simbolo) => {
    const fallo = primerError(texto);
    expect([fallo.codigo, fallo.posicion, fallo.datos.simbolo]).toEqual(['E-EXP-03', posicion, simbolo]);
    expect(fallo.mensaje).toContain(`«${simbolo}»`);
  });

  it('X recibe la sugerencia de escribir x minúscula', () => {
    expect(primerError('X^2').sugerencia).toMatch(/minúscula/);
    expect(primerError('y + 1').sugerencia).toBeNull();
  });

  it('CR-21: sqrt(x) → E-EXP-06, función no admitida', () => {
    const { entrada, esperado } = CASOS['CR-21'].subcasos[0];
    expect([error(entrada.textoFuncion)[0]]).toEqual(esperado.errores);
  });

  it.each([
    ['sqrt(x)', 1, 'sqrt'], ['sin (x)', 1, 'sin'], ['abs(x)', 1, 'abs'], ['2*ln(x)', 3, 'ln'], ['X(x+1)', 1, 'X']
  ])('«%s» → E-EXP-06 en %i: «%s» seguido de «(» es una función', (texto, posicion, simbolo) => {
    const fallo = primerError(texto);
    expect([fallo.codigo, fallo.posicion, fallo.datos.simbolo]).toEqual(['E-EXP-06', posicion, simbolo]);
    expect(fallo.sugerencia).toMatch(/funciones/);
  });

  it.each([
    ['5 cm', 3, 'cm'], ['5cm', 2, 'cm'], ['2 m', 3, 'm'], ['3km', 2, 'km'], ['4 mm', 3, 'mm']
  ])('«%s» → E-EXP-06 en %i: «%s» es una unidad', (texto, posicion, simbolo) => {
    const fallo = primerError(texto);
    expect([fallo.codigo, fallo.posicion, fallo.datos.simbolo]).toEqual(['E-EXP-06', posicion, simbolo]);
    expect(fallo.sugerencia).toMatch(/Interpretación/);
  });
});

describe('4: otros caracteres → E-EXP-06', () => {
  it.each([
    ['x==1', 2, '='], ['x!', 2, '!'], ['[1,2]', 1, '['], ['x.y', 2, '.'], ['.', 1, '.'], ['50%', 3, '%'],
    ['x;1', 2, ';'], ['"x"', 1, '"'], ['x<1', 2, '<'], ['x>1', 2, '>'], ['2\u00d7x', 2, '\u00d7'],
    ['6\u00f72', 2, '\u00f7'], ['x\u00b2', 2, '\u00b2'], ['\u03c0*x', 1, '\u03c0'], ['{x}', 1, '{'], ['x_1', 2, '_'],
    ['x\u{1F600}', 2, '\u{1F600}']
  ])('«%s» → E-EXP-06 en %i con el símbolo «%s»', (texto, posicion, simbolo) => {
    const fallo = primerError(texto);
    expect([fallo.codigo, fallo.posicion, fallo.datos.simbolo]).toEqual(['E-EXP-06', posicion, simbolo]);
    expect(fallo.mensaje).toContain(`«${simbolo}»`);
  });
});

describe('4: se informa el primer error, de izquierda a derecha', () => {
  it.each([
    ['y + sqrt(x)', 'E-EXP-03', 1], ['sqrt(y)', 'E-EXP-06', 1], ['0,5 + y', 'E-EXP-04', 2],
    ['x + y + 0,5', 'E-EXP-03', 5], ['[1,2]', 'E-EXP-06', 1]
  ])('«%s» → %s en %i', (texto, codigo, posicion) => {
    expect(error(texto)).toEqual([codigo, posicion]);
  });
});

describe('5: más de 100 fichas → E-EXP-11 (Tabla 9.2)', () => {
  it('101 fichas: señala la ficha 101', () => {
    const fallo = primerError('x+'.repeat(50) + 'x');
    expect([fallo.codigo, fallo.posicion, fallo.datos.limite]).toEqual(['E-EXP-11', 101, 'elementos']);
  });

  it('100 fichas sí se admiten', () => {
    expect(fichas('2x+'.repeat(33) + 'x')).toHaveLength(100);
  });

  it('va después del recorrido y antes de los literales', () => {
    expect(error('x+'.repeat(50) + 'y')).toEqual(['E-EXP-03', 101]);
    expect(error('10000000' + '+x'.repeat(50))).toEqual(['E-EXP-11', 108]);
  });
});

describe('6: literal fuera de rango o con más de 6 decimales → E-EXP-05 (Tabla 9.2)', () => {
  it.each([
    ['10000000x', 1, '10000000'], ['1000000.5', 1, '1000000.5'], ['0.0000001', 1, '0.0000001'],
    ['1.0000000', 1, '1.0000000'], ['x + 2000000', 5, '2000000'], ['x + 2000000 + 3000000', 5, '2000000']
  ])('«%s» → E-EXP-05 en %i con el número «%s»', (texto, posicion, numero) => {
    const fallo = primerError(texto);
    expect([fallo.codigo, fallo.posicion, fallo.datos.numero]).toEqual(['E-EXP-05', posicion, numero]);
    expect(fallo.mensaje).toContain(`«${numero}»`);
  });

  it('va después del recorrido', () => {
    expect(error('10000000 + y')).toEqual(['E-EXP-03', 12]);
  });
});

describe('contrato', () => {
  it('rechaza lo que no es texto', () => {
    for (const valor of [5, null, undefined, ['x']]) expect(() => analizarLexico(valor)).toThrow(TypeError);
  });

  it('un error es un ErrorAreaCalc del campo de la función, congelado', () => {
    const resultado = analizarLexico('y');
    expect(Object.isFrozen(resultado)).toBe(true);
    expect(Object.isFrozen(resultado.errores)).toBe(true);
    expect(resultado.errores[0].campo).toBe('funcion');
    expect(resultado).not.toHaveProperty('valor');
  });
});
