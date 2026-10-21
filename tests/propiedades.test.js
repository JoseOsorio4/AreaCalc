// Pruebas de propiedades de ÁreaCalc (design.md §15).
// Parte de T-04: raíces racionales conocidas. Se construyen 400 polinomios de
// grado ≤ 3 como c·Π(x − rᵢ)^mᵢ, a veces por (x² + s) con s > 0, con un generador
// determinista propio de la prueba. Los ceros, multiplicidades, tipos y signos
// esperados salen de esas raíces, nunca de analizarSigno.
// Las relaciones de R-25.3 (área, promedio) y el oráculo numérico se añaden en T-08.
import { describe, expect, it } from 'vitest';
import { analizarSigno } from '../src/nucleo/ceros.js';
import { desdeCoeficientes, multiplicar } from '../src/nucleo/polinomio.js';
import { aTexto, comparar, entero, fraccion, negar, signo } from '../src/nucleo/racional.js';

// mulberry32: generador pseudoaleatorio de 32 bits con semilla fija.
let estado = 20261021;
function azar() {
  estado = (estado + 0x6d2b79f5) >>> 0;
  let t = estado;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const enteroEntre = (min, max) => min + Math.floor(azar() * (max - min + 1));
const elegir = (lista) => lista[enteroEntre(0, lista.length - 1)];

/** Racional en [−3, 3] con denominador de 1 a 60 (design §8). */
function racionalAzar() {
  const d = enteroEntre(1, 60);
  return fraccion(BigInt(enteroEntre(-3 * d, 3 * d)), BigInt(d));
}

/** Factor k o 1/k, con k entero de 1 a 80 cifras (|k| < 10⁸⁰) y signo al azar. */
function factorAzar() {
  const cifras = enteroEntre(1, 80);
  let k = BigInt(enteroEntre(1, 9));
  for (let i = 1; i < cifras; i += 1) k = k * 10n + BigInt(enteroEntre(0, 9));
  if (azar() < 0.5) k = -k;
  return azar() < 0.5 ? fraccion(k, 1n) : fraccion(1n, k);
}

/** Multiplicidades de las raíces distintas; todas suman como mucho 3. */
const PATRONES = [[1], [2], [3], [1, 1], [2, 1], [1, 2], [1, 1, 1]];

/**
 * Un caso determinista: f = c·Π(x − r)^m, a veces por (x² + s) con s > 0, que no
 * tiene raíces reales. A veces un extremo del intervalo coincide con una raíz (W-03).
 */
function generarCaso(escalado) {
  const patron = elegir(PATRONES);
  const raices = [];
  while (raices.length < patron.length) {
    const r = racionalAzar();
    if (raices.every((x) => comparar(x.valor, r) !== 0)) raices.push({ valor: r, multiplicidad: patron[raices.length] });
  }
  const c = escalado
    ? factorAzar()
    : fraccion(BigInt(elegir([-1, 1]) * enteroEntre(1, 9)), BigInt(enteroEntre(1, 9)));
  let f = desdeCoeficientes([c]);
  for (const { valor, multiplicidad } of raices) {
    for (let k = 0; k < multiplicidad; k += 1) f = multiplicar(f, desdeCoeficientes([negar(valor), entero(1n)]));
  }
  const conCuadratica = patron.length === 1 && patron[0] === 1 && azar() < 0.5;
  if (conCuadratica) {
    const s = fraccion(BigInt(enteroEntre(1, 20)), BigInt(enteroEntre(1, 20)));
    f = multiplicar(f, desdeCoeficientes([s, entero(0n), entero(1n)]));
  }
  let a;
  let b;
  do {
    a = azar() < 0.25 ? elegir(raices).valor : fraccion(BigInt(enteroEntre(-240, 0)), 60n);
    b = azar() < 0.25 ? elegir(raices).valor : fraccion(BigInt(enteroEntre(0, 240)), 60n);
  } while (comparar(a, b) >= 0);
  return { f, a, b, raices, c, escalado, conCuadratica };
}

/**
 * Lo esperado, solo a partir de las raíces de la construcción: los ceros de [a, b]
 * ordenados, su tipo (paso 7 de design §8) y el signo de cada tramo. En un tramo
 * (u, v), cada raíz r ≥ v de multiplicidad impar cambia el signo de c; las de
 * multiplicidad par, las menores o iguales que u y el factor x² + s no lo cambian.
 */
function esperado({ a, b, raices, c }) {
  const dentro = raices
    .filter((r) => comparar(a, r.valor) <= 0 && comparar(r.valor, b) <= 0)
    .sort((x, y) => comparar(x.valor, y.valor));
  const ceros = dentro.map(({ valor, multiplicidad }) => {
    let tipo = multiplicidad % 2 === 1 ? 'cambio-signo' : 'tangencia';
    if (comparar(valor, a) === 0 || comparar(valor, b) === 0) tipo = 'extremo';
    return { exacto: true, valor: aTexto(valor), multiplicidad, tipo };
  });
  const cortes = dentro.filter((_, i) => ceros[i].tipo === 'cambio-signo').map((r) => r.valor);
  const signos = [...cortes, b].map((v) => raices.reduce(
    (s, r) => (comparar(r.valor, v) >= 0 && r.multiplicidad % 2 === 1 ? -s : s),
    signo(c)
  ));
  return { ceros, signos };
}

const capturar = (fn) => {
  try { fn(); } catch (error) { return error; }
  return null;
};

describe('raíces racionales conocidas (T-04; design §15)', () => {
  // Los casos 300 a 399 se escalan por un factor de hasta 10⁸⁰ (D-09).
  const casos = Array.from({ length: 400 }, (_, i) => generarCaso(i >= 300));

  it('el generador cubre los casos difíciles: múltiples, extremos, tangencias y raíces fuera', () => {
    const tipos = casos.map((caso) => esperado(caso).ceros.map((z) => z.tipo));
    const cuenta = (condicion) => casos.filter(condicion).length;
    expect(cuenta((caso) => caso.raices.some((r) => r.multiplicidad === 3))).toBeGreaterThanOrEqual(20);
    expect(cuenta((_, i) => tipos[i].includes('tangencia'))).toBeGreaterThanOrEqual(20);
    expect(cuenta((_, i) => tipos[i].includes('extremo'))).toBeGreaterThanOrEqual(20);
    expect(cuenta((caso, i) => tipos[i].length < caso.raices.length)).toBeGreaterThanOrEqual(20);
    expect(cuenta((caso) => caso.conCuadratica)).toBeGreaterThanOrEqual(20);
    expect(cuenta((caso) => caso.raices.length === 3)).toBeGreaterThanOrEqual(20);
  });

  it('los 400 devuelven exactamente sus raíces, multiplicidades, tipos y signos de tramo', () => {
    const fallos = [];
    casos.forEach((caso, i) => {
      const { ceros, signos } = esperado(caso);
      let analisis;
      try {
        analisis = analizarSigno(caso.f, caso.a, caso.b);
      } catch (error) {
        fallos.push(`#${i}: lanzó ${error.codigo ?? error.message}`);
        return;
      }
      const obtenidos = analisis.ceros.map((z) => ({
        exacto: z.exacto, valor: aTexto(z.valor), multiplicidad: z.multiplicidad, tipo: z.tipo
      }));
      const obtenidosSignos = analisis.tramos.map((t) => t.signo);
      const coincide = JSON.stringify(obtenidos) === JSON.stringify(ceros)
        && JSON.stringify(obtenidosSignos) === JSON.stringify(signos)
        && analisis.cambiaSigno === (signos.length >= 2)
        && analisis.noNegativa === signos.every((s) => s > 0)
        && !analisis.hayAproximaciones
        && !analisis.identicamenteCero;
      if (!coincide) fallos.push(`#${i}: f en [${aTexto(caso.a)}, ${aTexto(caso.b)}]`);
    });
    expect(fallos).toEqual([]);
  });

  it('los 100 escalados hasta 10⁸⁰ no agotan el presupuesto (ningún E-SIS-01)', () => {
    const escalados = casos.filter((caso) => caso.escalado);
    expect(escalados).toHaveLength(100);
    // El rango se cubre de verdad: algún factor tiene 70 cifras o más.
    const cifras = (caso) => Math.max(...aTexto(caso.c).replace('-', '').split('/').map((p) => p.length));
    expect(escalados.some((caso) => cifras(caso) >= 70)).toBe(true);
    expect(escalados.every((caso) => cifras(caso) <= 80)).toBe(true);
    const agotados = escalados.filter((caso) => capturar(() => analizarSigno(caso.f, caso.a, caso.b))?.codigo === 'E-SIS-01');
    expect(agotados).toHaveLength(0);
  });
});
