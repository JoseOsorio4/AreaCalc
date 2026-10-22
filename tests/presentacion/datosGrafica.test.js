// Pruebas de src/presentacion/datosGrafica.js (T-15; design.md §10 y §14.3; requirements R-10).
//
// Las entradas son resultados reales de analizarPerfil. Lo esperado sale de
// tests/casos-referencia.js (intervalos, ceros, f_prom, rectángulo) y de la aritmética
// independiente de las pruebas (valores de f en a y b, signo de cada tramo), con los
// coeficientes transcritos a mano del texto de cada función. Los 401 y 101 puntos y el
// margen de 0.1·(b − a) son los de design §14.3.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { analizarPerfil } from '../../src/casos-de-uso/analizarPerfil.js';
import { crearAdvertencia } from '../../src/nucleo/errores.js';
import { datosGrafica } from '../../src/presentacion/datosGrafica.js';
import { CASOS } from '../casos-referencia.js';
import { aDecimal, evaluar, leer, q } from '../aritmetica-independiente.js';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MENOS = '\u2212';
const PUNTOS_CURVA = 401; // design §14.3
const PUNTOS_REGION = 101; // design §14.3

/** Coeficientes (de x⁰ en adelante) transcritos del texto de cada función. */
const COEFICIENTES = {
  'CR-01': ['-1', '0', '0', '1'], // x³ − 1
  'CR-02': ['1', '0', '1'], // 1 + x²
  'CR-03': ['2', '0', '1/4'], // 2 + x²/4
  'CR-05': ['0', '1'], // x
  'CR-06': ['-2'], // −2
  'CR-07': ['1', '-2', '1'], // (x − 1)²
  'CR-08': [], // 0
  'CR-14': ['0', '-1', '0', '1'], // x³ − x
  'CR-15': ['-2', '0', '1'], // x² − 2
  'CR-30': ['2', '-3', '0', '1'], // (x − 1)²(x + 2) = x³ − 3x + 2
  'CR-31': ['-1/3', '1'] // x − 1/3
};

const entradaDe = (id) => CASOS[id].entrada ?? CASOS[id].entradas[0];

function perfil(entrada) {
  const resultado = analizarPerfil({ interpretacion: 'abstracta', ...entrada });
  expect(resultado.ok, entrada.textoFuncion).toBe(true);
  return resultado.valor;
}

/** DatosGrafica de un caso, comprobando que no hay W-07. */
function datosDe(id) {
  const salida = datosGrafica(perfil(entradaDe(id)));
  expect(salida.motivo, id).toBeNull();
  expect(salida.advertencias, id).toEqual([]);
  return salida.datos;
}

/** f(t) con la aritmética independiente, en Number solo para comparar con tolerancia. */
const fEn = (id, t) => aDecimal(evaluar(COEFICIENTES[id].map(leer), t));
const numero = (r) => aDecimal(r);
const estrictamenteCreciente = (valores) => valores.every((v, i) => i === 0 || v > valores[i - 1]);

/**
 * Comprobaciones de design §14.3 comunes a todos los casos con gráfica: dominio con
 * margen, a, b y los ceros entre los puntos de la curva, y f = 0 en los ceros.
 */
function comprobarCurva(id, datos) {
  const entrada = entradaDe(id);
  const a = leer(entrada.textoA);
  const b = leer(entrada.textoB);
  const xa = numero(a);
  const xb = numero(b);
  const m = 0.1 * (xb - xa);
  const { x, y } = datos.curva;
  expect(x).toHaveLength(y.length);
  expect(estrictamenteCreciente(x), `${id}: x en orden y sin repetir`).toBe(true);
  expect(x.length).toBeGreaterThanOrEqual(PUNTOS_CURVA);
  expect(x.length).toBeLessThanOrEqual(PUNTOS_CURVA + 2 + datos.ceros.length);
  expect(x[0]).toBeCloseTo(xa - m, 12);
  expect(x.at(-1)).toBeCloseTo(xb + m, 12);
  expect(datos.rango.x[0]).toBeCloseTo(xa - m, 12);
  expect(datos.rango.x[1]).toBeCloseTo(xb + m, 12);
  // a y b están entre los puntos, con el valor de f.
  expect(x).toContain(xa);
  expect(x).toContain(xb);
  const enA = x.indexOf(xa);
  const enB = x.indexOf(xb);
  expect(y[enA]).toBeCloseTo(fEn(id, a), 9);
  expect(y[enB]).toBeCloseTo(fEn(id, b), 9);
  // Cada cero está entre los puntos y la curva vale 0 en él.
  for (const cero of datos.ceros) {
    expect(x).toContain(cero.x);
    expect(y[x.indexOf(cero.x)]).toBe(0);
  }
  // El rango vertical contiene el eje, la curva y la línea del promedio.
  expect(datos.rango.y[0]).toBeLessThan(datos.rango.y[1]);
  for (const valor of [0, ...y, datos.promedio.y]) {
    expect(valor).toBeGreaterThanOrEqual(datos.rango.y[0]);
    expect(valor).toBeLessThanOrEqual(datos.rango.y[1]);
  }
}

/** Una región por tramo, con sus extremos, 101 puntos (más tangencias) y su signo. */
function comprobarRegiones(id, datos, cortes, signos) {
  expect(datos.regiones).toHaveLength(signos.length);
  datos.regiones.forEach((region, k) => {
    const desde = numero(cortes[k]);
    const hasta = numero(cortes[k + 1]);
    expect(region.signo, `${id}: tramo ${k}`).toBe(signos[k]);
    expect(region.x).toHaveLength(region.y.length);
    expect(region.x.length).toBeGreaterThanOrEqual(PUNTOS_REGION);
    expect(estrictamenteCreciente(region.x)).toBe(true);
    expect(region.x[0]).toBeCloseTo(desde, 12);
    expect(region.x.at(-1)).toBeCloseTo(hasta, 12);
    if (signos[k] > 0) expect(region.y.every((v) => v >= 0)).toBe(true);
    if (signos[k] < 0) expect(region.y.every((v) => v <= 0)).toBe(true);
  });
}

/** Signo de f en el punto medio de cada tramo, con la aritmética independiente. */
function signosEsperados(id, cortes) {
  return cortes.slice(0, -1).map((desde, k) => {
    const medio = q(desde.num * cortes[k + 1].den + cortes[k + 1].num * desde.den, 2n * desde.den * cortes[k + 1].den);
    const valor = evaluar(COEFICIENTES[id].map(leer), medio);
    return valor.num > 0n ? 1 : valor.num < 0n ? -1 : 0;
  });
}

describe('CR-03: f > 0 en [0, 4], perfil físico (formulario §7.1)', () => {
  const datos = datosDe('CR-03');
  const esperado = CASOS['CR-03'].esperado;

  it('curva con a, b, margen y rango (design §14.3)', () => comprobarCurva('CR-03', datos));

  it('una región sobre el eje y sin ceros', () => {
    comprobarRegiones('CR-03', datos, [q(0n), q(4n)], [1]);
    expect(datos.ceros).toEqual([]);
  });

  it('línea de promedio y rectángulo equivalente con base [a, b] y altura f_prom (R-10.3)', () => {
    expect(datos.promedio.y).toBeCloseTo(numero(esperado.fProm.valor), 12);
    expect(datos.promedio.etiqueta).toBe('f_prom = 10/3 m'); // design §14.3
    expect(datos.rectangulo).toEqual({ x0: 0, x1: 4, altura: expect.any(Number) });
    expect(datos.rectangulo.altura).toBeCloseTo(numero(esperado.rectangulo.altura.valor), 12);
  });

  it('ejes en metros (R-10.4) y descripción textual', () => {
    expect(datos.ejes).toEqual({ etiquetaX: 'x (m)', etiquetaY: 'f(x) (m)' });
    expect(datos.descripcion).toBe(
      'Gráfica de f(x) = x²/4 + 2 en [0, 4], con x y f(x) en m. Tramos sombreados: 1 sobre el eje (+) y 0 bajo el eje (−). '
      + 'Sin ceros marcados en [a, b]. Línea discontinua f_prom = 10/3 m. Contorno del rectángulo equivalente sobre [a, b].');
  });

  it('los datos están congelados', () => {
    expect(Object.isFrozen(datos)).toBe(true);
    expect(Object.isFrozen(datos.curva.x)).toBe(true);
    expect(Object.isFrozen(datos.regiones[0])).toBe(true);
  });
});

describe('CR-02: f > 0 en un ejercicio abstracto', () => {
  const datos = datosDe('CR-02');

  it('curva, región positiva, ejes en u y rectángulo de altura f_prom = 2', () => {
    comprobarCurva('CR-02', datos);
    comprobarRegiones('CR-02', datos, [q(-1n), q(2n)], [1]);
    expect(datos.ejes).toEqual({ etiquetaX: 'x (u)', etiquetaY: 'f(x) (u)' });
    expect(datos.promedio.etiqueta).toBe('f_prom = 2 u');
    expect(datos.rectangulo.altura).toBeCloseTo(numero(CASOS['CR-02'].esperado.fProm.valor), 12);
    expect([datos.rectangulo.x0, datos.rectangulo.x1]).toEqual([-1, 2]);
  });
});

describe('CR-06: f < 0 en todo [0, 3]', () => {
  const datos = datosDe('CR-06');
  const esperado = CASOS['CR-06'].esperado;

  it('una región bajo el eje, sin ceros ni rectángulo', () => {
    comprobarCurva('CR-06', datos);
    comprobarRegiones('CR-06', datos, [q(0n), q(3n)], [-1]);
    for (const valor of datos.regiones[0].y) expect(valor).toBeCloseTo(-2, 12);
    expect(datos.ceros).toEqual(esperado.ceros);
    expect(datos.rectangulo).toBe(esperado.rectangulo); // null: «sin rectángulo»
  });

  it('el promedio negativo se dibuja y se rotula con «−»', () => {
    expect(datos.promedio.y).toBeCloseTo(numero(esperado.fProm.valor), 12);
    expect(datos.promedio.etiqueta).toBe(`f_prom = ${MENOS}2 u`);
    expect(datos.rango.y[1]).toBeGreaterThanOrEqual(0); // el eje sigue visible
  });
});

describe('CR-05: cambio de signo en x = 0 (formulario §2)', () => {
  const datos = datosDe('CR-05');
  const esperado = CASOS['CR-05'].esperado;
  const cortes = [esperado.tramos[0].desde.valor, esperado.tramos[0].hasta.valor, esperado.tramos[1].hasta.valor];

  it('curva con a, b y el cero', () => comprobarCurva('CR-05', datos));

  it('dos regiones: bajo el eje en [−1, 0] y sobre el eje en [0, 1]', () => {
    comprobarRegiones('CR-05', datos, cortes, signosEsperados('CR-05', cortes));
    expect(datos.regiones.map((r) => r.signo)).toEqual([-1, 1]);
    expect(datos.regiones[0].y.at(-1)).toBe(0);
    expect(datos.regiones[1].y[0]).toBe(0);
  });

  it('marca el cero exacto y no dibuja rectángulo, porque f cambia de signo (R-08.1)', () => {
    expect(datos.ceros).toEqual([{ x: numero(esperado.ceros[0].valor.valor), exacto: true, etiqueta: 'x = 0 (exacto)' }]);
    expect(datos.rectangulo).toBeNull();
    expect(datos.promedio).toEqual({ y: numero(esperado.fProm.valor), etiqueta: 'f_prom = 0 u' });
  });
});

describe('CR-14: tres cambios de signo', () => {
  const datos = datosDe('CR-14');
  const ceros = CASOS['CR-14'].esperado.ceros.map((c) => c.valor.valor);
  const cortes = [q(-2n), ...ceros, q(2n)];

  it('cuatro regiones con signos alternos y los tres ceros marcados', () => {
    comprobarCurva('CR-14', datos);
    comprobarRegiones('CR-14', datos, cortes, signosEsperados('CR-14', cortes));
    expect(datos.regiones.map((r) => r.signo)).toEqual([-1, 1, -1, 1]);
    expect(datos.ceros.map((c) => c.x)).toEqual(ceros.map(numero));
    expect(datos.ceros.map((c) => c.etiqueta)).toEqual([`x = ${MENOS}1 (exacto)`, 'x = 0 (exacto)', 'x = 1 (exacto)']);
    expect(datos.descripcion).toContain('Tramos sombreados: 2 sobre el eje (+) y 2 bajo el eje (−)');
  });
});

describe('CR-01: cero en el extremo a = 1', () => {
  const datos = datosDe('CR-01');
  const esperado = CASOS['CR-01'].esperado;

  it('el cero del extremo está en la curva, en el marcador y al inicio de la región', () => {
    comprobarCurva('CR-01', datos);
    comprobarRegiones('CR-01', datos, [q(1n), q(4n)], [1]);
    expect(datos.ceros).toEqual([{ x: numero(esperado.ceros[0].valor.valor), exacto: true, etiqueta: 'x = 1 (exacto)' }]);
    expect(datos.regiones[0].y[0]).toBe(0);
  });

  it('f ≥ 0 en [1, 4]: rectángulo de altura f_prom = 81/4', () => {
    expect(datos.rectangulo.altura).toBeCloseTo(numero(esperado.fProm.valor), 12);
    expect(datos.promedio.etiqueta).toBe('f_prom = 81/4 u');
  });
});

describe('Tangencias: la región toca el eje sin cambiar de signo', () => {
  it('CR-07: (x − 1)² en [0, 2], una región que incluye x = 1 con f = 0', () => {
    const datos = datosDe('CR-07');
    const esperado = CASOS['CR-07'].esperado;
    comprobarCurva('CR-07', datos);
    comprobarRegiones('CR-07', datos, [q(0n), q(2n)], [1]);
    const region = datos.regiones[0];
    expect(region.x).toContain(1);
    expect(region.y[region.x.indexOf(1)]).toBe(0);
    expect(region.x.length).toBeLessThanOrEqual(PUNTOS_REGION + 1);
    expect(datos.ceros).toEqual([{ x: numero(esperado.ceros[0].valor.valor), exacto: true, etiqueta: 'x = 1 (exacto)' }]);
    expect(datos.rectangulo.altura).toBeCloseTo(numero(esperado.fProm.valor), 12);
  });

  it('CR-30: (x − 1)²(x + 2) en [−3, 2], corte en −2 y tangencia en 1 dentro del segundo tramo', () => {
    const datos = datosDe('CR-30');
    const ceros = CASOS['CR-30'].esperado.ceros.map((c) => c.valor.valor);
    const cortes = [q(-3n), ceros[0], q(2n)]; // la tangencia no corta
    comprobarCurva('CR-30', datos);
    comprobarRegiones('CR-30', datos, cortes, signosEsperados('CR-30', cortes));
    expect(datos.regiones.map((r) => r.signo)).toEqual([-1, 1]);
    const segunda = datos.regiones[1];
    expect(segunda.x).toContain(1);
    expect(segunda.y[segunda.x.indexOf(1)]).toBe(0);
    expect(datos.ceros.map((c) => c.etiqueta)).toEqual([`x = ${MENOS}2 (exacto)`, 'x = 1 (exacto)']);
    expect(datos.rectangulo).toBeNull();
  });
});

describe('Ceros racionales y aproximados', () => {
  it('CR-31: el cero 1/3 se marca exacto con su fracción', () => {
    const datos = datosDe('CR-31');
    const esperado = CASOS['CR-31'].esperado;
    const cortes = [esperado.tramos[0].desde.valor, esperado.tramos[0].hasta.valor, esperado.tramos[1].hasta.valor];
    comprobarCurva('CR-31', datos);
    comprobarRegiones('CR-31', datos, cortes, signosEsperados('CR-31', cortes));
    expect(datos.ceros).toEqual([{ x: numero(esperado.ceros[0].valor.valor), exacto: true, etiqueta: 'x = 1/3 (exacto)' }]);
  });

  it('CR-15: el cero √2 se marca aproximado, con «≈», y separa las dos regiones', () => {
    const datos = datosDe('CR-15');
    const esperado = CASOS['CR-15'].esperado;
    comprobarCurva('CR-15', datos);
    expect(datos.ceros).toHaveLength(1);
    const [cero] = datos.ceros;
    expect(cero.exacto).toBe(false);
    expect(cero.x).toBeCloseTo(Math.SQRT2, 11);
    expect(cero.etiqueta).toBe(`x ${esperado.ceros[0].valor.decimal}`); // «x ≈ 1.4142»
    expect(datos.regiones.map((r) => r.signo)).toEqual([-1, 1]);
    expect(datos.regiones[0].x.at(-1)).toBe(cero.x);
    expect(datos.regiones[1].x[0]).toBe(cero.x);
    expect(datos.regiones[0].y.at(-1)).toBe(0);
    expect(datos.regiones[1].y[0]).toBe(0);
    expect(datos.rectangulo).toBeNull();
  });

  it('CR-36: coeficientes de 10¹²⁶ todavía caben en Number; el cero ∛2 se marca aproximado', () => {
    const salida = datosGrafica(perfil(CASOS['CR-36'].entrada));
    expect(salida.motivo).toBeNull();
    expect(salida.datos.ceros).toHaveLength(1);
    expect(salida.datos.ceros[0].exacto).toBe(false);
    expect(salida.datos.ceros[0].x).toBeCloseTo(Math.cbrt(2), 11);
    expect(salida.datos.ceros[0].etiqueta).toMatch(/^x ≈ \d\.\d{4}$/);
  });
});

describe('CR-08: f ≡ 0 (W-09)', () => {
  const datos = datosDe('CR-08');

  it('la curva es el eje, sin ceros marcados y con una región de signo 0', () => {
    comprobarCurva('CR-08', datos);
    expect(datos.curva.y.every((v) => v === 0)).toBe(true);
    expect(datos.ceros).toEqual(CASOS['CR-08'].esperado.ceros);
    expect(datos.regiones).toHaveLength(1);
    expect(datos.regiones[0].signo).toBe(0);
    expect(datos.regiones[0].y.every((v) => v === 0)).toBe(true);
    expect(datos.rango.y).toEqual([-1, 1]);
    expect(datos.promedio.etiqueta).toBe('f_prom = 0 u');
  });
});

describe('Valores no finitos: W-07 y resultados exactos intactos (R-10.6, design §14.3)', () => {
  it('(((1000000^3)^3)^3)^3 = 10⁴⁸⁶ no cabe en Number: sin datos y con W-07', () => {
    const resultado = perfil({ textoFuncion: '(((1000000^3)^3)^3)^3', textoA: '0', textoB: '1' });
    const salida = datosGrafica(resultado);
    expect(salida.datos).toBeNull();
    expect(salida.motivo).toBe('no-finito');
    expect(salida.advertencias).toEqual([crearAdvertencia('W-07')]);
    // El resultado exacto no cambia: I = 10⁴⁸⁶·(1 − 0).
    expect(resultado.integral.I).toEqual(q(10n ** 486n));
    expect(Object.isFrozen(resultado)).toBe(true);
  });

  it('coeficiente 10³⁰⁰ finito, pero f(x) se desborda cerca de b = 1000: W-07', () => {
    const texto = '((1000000^3)^3)^3*(1000000^3)^3*(1000000^3)^3*1000000^3*1000000*1000000*x^3';
    const resultado = perfil({ textoFuncion: texto, textoA: '0', textoB: '1000' });
    const salida = datosGrafica(resultado);
    expect(salida.datos).toBeNull();
    expect(salida.motivo).toBe('no-finito');
    expect(salida.advertencias.map((a) => a.codigo)).toEqual(['W-07']);
    expect(resultado.integral.I).toEqual(q(10n ** 300n * 1000n ** 4n, 4n));
  });

  it('una entrada que no cumple el contrato también da W-07, sin lanzar', () => {
    const espia = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const salida = datosGrafica(null);
      expect(salida).toEqual({ datos: null, advertencias: [crearAdvertencia('W-07')], motivo: 'error' });
      expect(espia).toHaveBeenCalledTimes(1);
    } finally {
      espia.mockRestore();
    }
  });
});

describe('La gráfica dibuja lo que decidió el núcleo; no recalcula (R-10.5)', () => {
  const base = perfil(entradaDe('CR-03'));

  it('sin rectángulo en el resultado, no hay rectángulo en la gráfica', () => {
    const { datos } = datosGrafica({ ...base, rectangulo: { rectangulo: null, motivo: 'requiere-f-no-negativa' } });
    expect(datos.rectangulo).toBeNull();
  });

  it('el signo de cada región es el del tramo recibido', () => {
    const tramos = base.analisis.tramos.map((tramo) => ({ ...tramo, signo: -1 }));
    const { datos } = datosGrafica({ ...base, analisis: { ...base.analisis, tramos } });
    expect(datos.regiones.map((r) => r.signo)).toEqual([-1]);
    expect(datos.regiones[0].y.every((v) => v === 0)).toBe(true); // f > 0 recortada al signo recibido
  });

  it('la línea del promedio usa f_prom recibido', () => {
    const { datos } = datosGrafica({ ...base, promedio: { ...base.promedio, fProm: q(7n) } });
    expect(datos.promedio).toEqual({ y: 7, etiqueta: 'f_prom = 7 m' });
  });

  it('solo importa la conversión a Number, la evaluación aproximada, W-07 y formato.js', () => {
    const codigo = readFileSync(join(RAIZ, 'src', 'presentacion', 'datosGrafica.js'), 'utf8');
    const importaciones = [...codigo.matchAll(/^import\s+\{([^}]+)\}\s+from\s+'([^']+)';$/gm)]
      .map(([, nombres, ruta]) => `${ruta}: ${nombres.split(',').map((n) => n.trim()).sort().join(', ')}`);
    expect(importaciones).toEqual([
      '../nucleo/errores.js: crearAdvertencia',
      '../nucleo/polinomio.js: evaluarAprox',
      '../nucleo/racional.js: aNumber',
      './formato.js: aDecimal, fraccionTexto'
    ]);
    expect(codigo.match(/^import\b/gm)).toHaveLength(4);
  });
});
