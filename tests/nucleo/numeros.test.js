// Pruebas de src/nucleo/numeros.js (T-07; design.md §11; requirements R-03 y Tabla 9.3).
// Los códigos esperados de CR-11 y CR-13 vienen de tests/casos-referencia.js; los
// demás textos y códigos se transcriben de requirements R-03, §10 y la Tabla 9.3.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { REGLAS, REGLAS_A, conCampo, leerIntervalo, leerNumero } from '../../src/nucleo/numeros.js';
import { fraccion } from '../../src/nucleo/racional.js';
import { CASOS } from '../casos-referencia.js';

const q = (n, d = 1) => fraccion(BigInt(n), BigInt(d));
const PRECIO = conCampo(REGLAS.precio, 'precio', 'precio');
const ADICIONAL = conCampo(REGLAS.adicional, 'adicional', 'adicional');
const BASE_M = conCampo(REGLAS.dimensionM, 'base', 'base');
const BASE_CM = conCampo(REGLAS.dimensionCm, 'base', 'base');
/** Código del primer error, o 'ok'. */
const codigo = (texto, reglas) => {
  const r = leerNumero(texto, reglas);
  return r.ok ? 'ok' : r.errores[0].codigo;
};

describe('valores válidos, leídos como fracciones exactas (R-03.1, R-03.2)', () => {
  it.each([
    ['-1', -1, 1], ['0', 0, 1], ['2.5', 5, 2], ['0.1', 1, 10], ['  3  ', 3, 1], ['+4', 4, 1],
    ['\u22122.5', -5, 2], ['1000', 1000, 1], ['-1000', -1000, 1], ['999.999999', 999999999, 1000000], ['007.50', 15, 2]
  ])('límite «%s» → %i/%i', (texto, num, den) => {
    const resultado = leerNumero(texto, REGLAS_A);
    expect(resultado).toEqual({ ok: true, valor: q(num, den), advertencias: [] });
    expect(Object.isFrozen(resultado)).toBe(true);
  });

  it('el cero es válido en límites, precio y adicional, y no en dimensiones (R-03.4)', () => {
    expect(leerNumero('0', REGLAS_A).valor).toEqual(q(0));
    expect(leerNumero('0', PRECIO).valor).toEqual(q(0));
    expect(leerNumero('0', ADICIONAL).valor).toEqual(q(0));
    expect(codigo('0', BASE_M)).toBe('E-NUM-06');
  });

  it('respeta los máximos de la Tabla 9.3', () => {
    expect(leerNumero('1000', BASE_M).valor).toEqual(q(1000));
    expect(leerNumero('100000', BASE_CM).valor).toEqual(q(100000));
    expect(leerNumero('1000000', PRECIO).valor).toEqual(q(1000000));
    expect(leerNumero('100', ADICIONAL).valor).toEqual(q(100));
    expect(leerNumero('49.99', PRECIO).valor).toEqual(q(4999, 100));
  });
});

describe('cada paso de design §11', () => {
  it('2: vacío o solo espacios → E-NUM-01, nunca cero (R-03.3)', () => {
    for (const texto of ['', '   ', '\t']) expect(codigo(texto, REGLAS_A)).toBe('E-NUM-01');
  });

  it('3: valores no finitos → E-NUM-03 (CR-13)', () => {
    const { entrada, esperado } = CASOS['CR-13'].subcasos[2];
    expect([codigo(entrada.textoLimite, REGLAS_A)]).toEqual(esperado.errores);
    for (const texto of ['-Infinity', 'NaN', '∞', '\u2212∞', ' infinity ']) expect(codigo(texto, REGLAS_A)).toBe('E-NUM-03');
  });

  it('4: formato no admitido → E-NUM-02, con la sugerencia que corresponde', () => {
    for (const texto of ['abc', '.5', '5.', '2..1', '--1', '0x10', '1/2', '3m']) expect(codigo(texto, REGLAS_A)).toBe('E-NUM-02');
    const coma = leerNumero('0,5', REGLAS_A).errores[0];
    expect(coma.codigo).toBe('E-NUM-02');
    expect(coma.sugerencia).toMatch(/punto decimal/);
    expect(leerNumero('1 000', REGLAS_A).errores[0].sugerencia).toMatch(/separadores de miles/);
    const cientifica = leerNumero('1e3', REGLAS_A).errores[0];
    expect(cientifica.codigo).toBe('E-NUM-02');
    expect(cientifica.sugerencia).toMatch(/notación científica/);
  });

  it('5: demasiados decimales o fuera de rango → E-NUM-04, con el rango', () => {
    const casos = [
      ['1000.5', REGLAS_A], ['-1000.000001', REGLAS_A], ['1.0000001', REGLAS_A], ['2.505', PRECIO],
      ['1000000.01', PRECIO], ['100.01', ADICIONAL], ['1000.1', BASE_M], ['100001', BASE_CM]
    ];
    for (const [texto, reglas] of casos) expect(codigo(texto, reglas), texto).toBe('E-NUM-04');
    expect(leerNumero('2.505', PRECIO).errores[0].sugerencia).toContain(REGLAS.precio.rango);
  });

  it('6: negativo en precio o adicional → E-NUM-05', () => {
    for (const texto of ['-1', '-0.5', '-1500']) expect(codigo(texto, PRECIO), texto).toBe('E-NUM-05');
    expect(codigo('-0.5', ADICIONAL)).toBe('E-NUM-05');
  });

  it('7: cero o negativo en una dimensión → E-NUM-06', () => {
    for (const texto of ['0', '-2', '-0', '0.000', '-5000']) expect(codigo(texto, BASE_M), texto).toBe('E-NUM-06');
    expect(codigo('0', BASE_CM)).toBe('E-NUM-06');
  });

  it('el orden decide el código cuando hay más de un problema', () => {
    expect(codigo(' ', BASE_M)).toBe('E-NUM-01'); // vacío antes que todo
    expect(codigo('Infinity', BASE_M)).toBe('E-NUM-03'); // no finito antes que formato
    expect(codigo('-1e3', PRECIO)).toBe('E-NUM-02'); // formato antes que signo
    expect(codigo('-0.0000001', BASE_M)).toBe('E-NUM-04'); // decimales antes que E-NUM-06
    expect(codigo('-2.505', PRECIO)).toBe('E-NUM-04'); // decimales antes que E-NUM-05
  });
});

describe('mensajes por campo (R-19.1)', () => {
  it('el error nombra el campo y lleva su identificador', () => {
    const [error] = leerNumero('', PRECIO).errores;
    expect(error.campo).toBe('precio');
    expect(error.mensaje).toContain('«precio»');
    expect(leerNumero('', REGLAS_A).errores[0].mensaje).toContain('«límite inferior a»');
  });

  it('rechaza lo que no es texto o no son reglas', () => {
    expect(() => leerNumero(5, REGLAS_A)).toThrow(TypeError);
    expect(() => leerNumero('5', {})).toThrow(TypeError);
  });
});

describe('intervalo [a, b] (R-01.6, R-19.2)', () => {
  it.each([0, 1])('CR-11, subcaso %i: E-INT sin reordenar los límites', (i) => {
    const { entrada, esperado } = CASOS['CR-11'].subcasos[i];
    const resultado = leerIntervalo(entrada.textoA, entrada.textoB);
    expect(resultado.ok).toBe(false);
    expect(resultado.errores.map((e) => e.codigo)).toEqual(esperado.errores);
    expect(resultado.errores[0].campo).toBe('intervalo');
    expect(resultado).not.toHaveProperty('valor');
  });

  it('acumula los errores de a y b y no comprueba el orden si alguno falla', () => {
    const ambos = leerIntervalo('', 'abc');
    expect(ambos.errores.map((e) => [e.campo, e.codigo])).toEqual([['a', 'E-NUM-01'], ['b', 'E-NUM-02']]);
    expect(leerIntervalo('5', '').errores.map((e) => e.codigo)).toEqual(['E-NUM-01']);
    expect(leerIntervalo('Infinity', '1').errores.map((e) => [e.campo, e.codigo])).toEqual([['a', 'E-NUM-03']]);
  });

  it('un intervalo válido conserva a y b exactos, también con límites negativos', () => {
    expect(leerIntervalo('-1', '2')).toEqual({ ok: true, valor: { a: q(-1), b: q(2) }, advertencias: [] });
    expect(leerIntervalo('0.1', '0.3').valor).toEqual({ a: q(1, 10), b: q(3, 10) });
  });
});

describe('sin Number para los valores exactos (T-07)', () => {
  it('los módulos de T-07 no usan Number(), parseFloat ni parseInt', () => {
    const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'nucleo');
    for (const archivo of ['numeros.js', 'errores.js', 'unidades.js', 'materiales.js', 'geometria.js']) {
      // Sin comentarios, porque la documentación menciona Number(texto) para prohibirlo.
      const codigoFuente = readFileSync(join(raiz, archivo), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
      expect(codigoFuente, archivo).not.toMatch(/\bNumber\s*\(|\bparseFloat\b|\bparseInt\b/);
    }
  });
});
