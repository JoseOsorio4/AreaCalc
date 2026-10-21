// Pruebas de propiedades de ÁreaCalc (design.md §15; requirements R-05.3 y R-25.3).
// T-04: raíces racionales conocidas. Se construyen 400 polinomios de grado ≤ 3
// como c·Π(x − rᵢ)^mᵢ, a veces por (x² + s) con s > 0, con un generador
// determinista propio de la prueba. Los ceros, multiplicidades, tipos y signos
// esperados salen de esas raíces, nunca de analizarSigno.
// T-08: el área de esos 400 con los cortes conocidos; las relaciones de R-25.3 en
// todos los CR y en 300 polinomios aleatorios, de principio a fin con
// analizarPerfil; un oráculo numérico propio (punto medio con 20 000
// subintervalos), y los costos exactos en m². Las expectativas exactas se
// calculan con tests/aritmetica-independiente.js, que no importa nada de src/.
import { describe, expect, it } from 'vitest';
import { analizarPerfil } from '../src/casos-de-uso/analizarPerfil.js';
import { calcularFigura } from '../src/casos-de-uso/calcularFigura.js';
import { estimarMaterial } from '../src/casos-de-uso/estimarMaterial.js';
import { areaGeometrica } from '../src/nucleo/area.js';
import { analizarSigno } from '../src/nucleo/ceros.js';
import { integrarDefinida } from '../src/nucleo/integral.js';
import { desdeCoeficientes, multiplicar } from '../src/nucleo/polinomio.js';
import { aTexto, comparar, entero, fraccion, negar, signo } from '../src/nucleo/racional.js';
import * as ind from './aritmetica-independiente.js';
import { CASOS } from './casos-referencia.js';

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

  it('los 400 dan, exacta, el área calculada con los cortes conocidos (T-08; design §15)', () => {
    const fallos = [];
    casos.forEach((caso, i) => {
      // Cortes: raíces interiores de multiplicidad impar, según la construcción.
      const cortes = caso.raices
        .filter((r) => r.multiplicidad % 2 === 1 && ind.comparar(caso.a, r.valor) < 0 && ind.comparar(r.valor, caso.b) < 0)
        .map((r) => r.valor)
        .sort(ind.comparar);
      const F = ind.antiderivada(caso.f.coef);
      const puntos = [caso.a, ...cortes, caso.b];
      let esperada = ind.q(0n);
      for (let k = 0; k + 1 < puntos.length; k += 1) {
        esperada = ind.suma(esperada, ind.valorAbsoluto(ind.resta(ind.evaluar(F, puntos[k + 1]), ind.evaluar(F, puntos[k]))));
      }
      const { area } = areaGeometrica(integrarDefinida(caso.f, caso.a, caso.b), analizarSigno(caso.f, caso.a, caso.b));
      if (area.clase !== 'exacta' || ind.comparar(area.valor, esperada) !== 0) fallos.push(`#${i}: ${aTexto(area.valor)}`);
    });
    expect(fallos).toEqual([]);
  });
});

// ── T-08: relaciones de R-25.3 de principio a fin ────────────────────

/** mulberry32 con su propia semilla, para no alterar la secuencia de los 400 casos. */
function crearAzar(semilla) {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Relaciones exactas de R-25.3 y R-06 sobre un ResultadoPerfil, con aritmética
 * independiente. Devuelve la lista de las que fallan.
 */
function relacionesQueFallan(valor) {
  const fallan = [];
  const { a, b } = valor.intervalo;
  const { I } = valor.integral;
  const A = valor.area.area.valor;
  const base = ind.resta(b, a);
  if (ind.comparar(A, ind.q(0n)) < 0) fallan.push('A_geo ≥ 0');
  if (ind.comparar(A, ind.valorAbsoluto(I)) < 0) fallan.push('A_geo ≥ |I|');
  if (ind.comparar(I, ind.producto(base, valor.promedio.fProm)) !== 0) fallan.push('I = (b − a)·f_prom');
  const tramos = valor.area.tramos;
  if (ind.comparar(A, tramos.reduce((s, t) => ind.suma(s, t.valorAbsoluto), ind.q(0n))) !== 0) fallan.push('A_geo = Σ|Iₖ|');
  if (ind.comparar(I, tramos.reduce((s, t) => ind.suma(s, t.integral), ind.q(0n))) !== 0) fallan.push('Σ Iₖ = I');
  if ((valor.area.area.clase === 'aproximada') !== valor.analisis.hayAproximaciones) fallan.push('aproximada ⇔ cortes aproximados');
  const { rectangulo } = valor.rectangulo;
  if (valor.analisis.noNegativa) {
    if (valor.area.area.clase !== 'exacta' || ind.comparar(A, I) !== 0) fallan.push('f ≥ 0 ⇒ A_geo = I, exacta');
    if (rectangulo === null || ind.comparar(rectangulo.area, A) !== 0 || ind.comparar(rectangulo.base, base) !== 0
      || ind.comparar(rectangulo.altura, valor.promedio.fProm) !== 0) fallan.push('el rectángulo conserva el área');
  } else if (rectangulo !== null) {
    fallan.push('sin f ≥ 0 no hay rectángulo');
  }
  return fallan;
}

describe('relaciones de R-25.3 en todos los casos de referencia (T-08)', () => {
  const entradas = Object.entries(CASOS).flatMap(([id, caso]) => [
    ...(caso.entrada ? [caso.entrada] : []), ...(caso.entradas ?? []), ...(caso.subcasos ?? []).map((s) => s.entrada)
  ].filter((e) => e.textoFuncion !== undefined && e.textoA !== undefined && !caso.esperado?.errores)
    .map((e) => [id, e.textoFuncion, e]));

  it('incluye los CR de perfil válidos', () => {
    // CR-01 a CR-08, CR-14 a CR-18, CR-20, CR-23, CR-27 a CR-32, CR-35 y CR-36.
    expect(new Set(entradas.map(([id]) => id)).size).toBe(23);
  });

  it.each(entradas)('%s: «%s»', (_, __, entrada) => {
    const resultado = analizarPerfil({ interpretacion: 'abstracta', ...entrada });
    expect(resultado.ok).toBe(true);
    expect(relacionesQueFallan(resultado.valor)).toEqual([]);
  });
});

describe('300 polinomios aleatorios frente a un oráculo numérico (T-08; design §15)', () => {
  const azar = crearAzar(20261021 + 300);
  const entre = (min, max) => min + Math.floor(azar() * (max - min + 1));
  /** k/4 como texto decimal exacto: −7 → «-1.75». */
  const cuartos = (k) => `${k < 0 ? '-' : ''}${Math.floor(Math.abs(k) / 4)}${['', '.25', '.5', '.75'][Math.abs(k) % 4]}`;

  const casos = Array.from({ length: 300 }, () => {
    const grado = entre(0, 3);
    const coef = Array.from({ length: grado + 1 }, () => [entre(-9, 9), entre(1, 6)]);
    if (grado > 0 && coef[grado][0] === 0) coef[grado][0] = entre(1, 9) * (azar() < 0.5 ? -1 : 1);
    const ka = entre(-12, 11);
    const kb = entre(ka + 1, 12);
    const textoFuncion = coef.map(([n, m], k) => (k === 0 ? `(${n}/${m})` : `(${n}/${m})*x^${k}`)).join('+');
    return { coef, ka, kb, textoFuncion, textoA: cuartos(ka), textoB: cuartos(kb) };
  });
  let calculados = null;
  const resultados = () => {
    calculados ??= casos.map((c) => analizarPerfil({ textoFuncion: c.textoFuncion, textoA: c.textoA, textoB: c.textoB, interpretacion: 'fisica' }));
    return calculados;
  };

  /** ∫|f| por punto medio con n subintervalos, en Number; también el mínimo muestreado. */
  function oraculo({ coef, ka, kb }, n = 20000) {
    const c = coef.map(([num, den]) => num / den);
    const a = ka / 4;
    const b = kb / 4;
    const h = (b - a) / n;
    let suma = 0;
    let minimo = Infinity;
    let maximo = 0;
    for (let i = 0; i < n; i += 1) {
      const x = a + (i + 0.5) * h;
      let y = 0;
      for (let k = c.length - 1; k >= 0; k -= 1) y = y * x + c[k];
      suma += Math.abs(y);
      minimo = Math.min(minimo, y);
      maximo = Math.max(maximo, Math.abs(y));
    }
    // Cota del error del punto medio: (b − a)·h²·M₂/24 en los tramos suaves y h²·M₁/2
    // en cada uno de los ≤ 3 subintervalos con un cambio de signo; más el redondeo.
    const R = Math.max(Math.abs(a), Math.abs(b));
    const M1 = c.reduce((s, ck, k) => (k >= 1 ? s + k * Math.abs(ck) * R ** (k - 1) : s), 0);
    const M2 = c.reduce((s, ck, k) => (k >= 2 ? s + k * (k - 1) * Math.abs(ck) * R ** (k - 2) : s), 0);
    const tolerancia = ((b - a) * h * h * M2) / 24 + 3 * h * h * M1 + 1e-9 * (1 + suma * h);
    return { area: suma * h, minimo, maximo, tolerancia };
  }

  it('el generador cubre polinomios de todos los grados, con y sin cambio de signo y con ceros irracionales', () => {
    const valores = resultados().map((r) => r.valor);
    const cuenta = (condicion) => valores.filter(condicion).length;
    expect(cuenta((v) => v.analisis.cambiaSigno)).toBeGreaterThanOrEqual(50);
    expect(cuenta((v) => v.analisis.noNegativa && !v.analisis.identicamenteCero)).toBeGreaterThanOrEqual(50);
    expect(cuenta((v) => v.analisis.hayAproximaciones)).toBeGreaterThanOrEqual(20);
    expect(cuenta((v) => v.modelo.polinomio.coef.length === 4)).toBeGreaterThanOrEqual(50);
    expect(cuenta((v) => v.modelo.polinomio.coef.length <= 1)).toBeGreaterThanOrEqual(20);
  });

  it('los 300 se interpretan como el polinomio construido, sin errores ni E-SIS-01', () => {
    const fallos = [];
    casos.forEach((caso, i) => {
      const resultado = resultados()[i];
      if (!resultado.ok) {
        fallos.push(`#${i} ${caso.textoFuncion}: ${resultado.errores.map((e) => e.codigo)}`);
        return;
      }
      const esperado = caso.coef.map(([n, m]) => ind.q(BigInt(n), BigInt(m)));
      while (esperado.length > 0 && ind.esCero(esperado[esperado.length - 1])) esperado.pop();
      const { modelo, intervalo } = resultado.valor;
      const coincide = JSON.stringify(modelo.polinomio.coef, (_, v) => (typeof v === 'bigint' ? `${v}` : v))
        === JSON.stringify(esperado, (_, v) => (typeof v === 'bigint' ? `${v}` : v))
        && ind.comparar(intervalo.a, ind.q(BigInt(caso.ka), 4n)) === 0
        && ind.comparar(intervalo.b, ind.q(BigInt(caso.kb), 4n)) === 0;
      if (!coincide) fallos.push(`#${i} ${caso.textoFuncion}`);
    });
    expect(fallos).toEqual([]);
  });

  it('los 300 cumplen las relaciones exactas de R-25.3', () => {
    const fallos = resultados().flatMap((r, i) => relacionesQueFallan(r.valor).map((f) => `#${i}: ${f}`));
    expect(fallos).toEqual([]);
  });

  it('A_geo coincide con el oráculo, dentro de su cota de error y de la del área', () => {
    const fallos = [];
    casos.forEach((caso, i) => {
      const { area } = resultados()[i].valor.area;
      const o = oraculo(caso);
      const cota = area.clase === 'aproximada' ? ind.aDecimal(area.cota) : 0;
      if (Math.abs(ind.aDecimal(area.valor) - o.area) > o.tolerancia + cota) {
        fallos.push(`#${i} ${caso.textoFuncion} en [${caso.textoA}, ${caso.textoB}]: ${ind.aDecimal(area.valor)} frente a ${o.area}`);
      }
    });
    expect(fallos).toEqual([]);
  });

  it('el signo y la aptitud son coherentes con el muestreo del oráculo (R-05.2, R-16)', () => {
    const fallos = [];
    casos.forEach((caso, i) => {
      const { analisis, aptitud, area } = resultados()[i].valor;
      const o = oraculo(caso, 2000);
      const umbral = 1e-9 * (1 + o.maximo);
      // Un valor muestreado claramente negativo prueba que f no es ≥ 0 (el muestreo solo puede refutar).
      if (o.minimo < -umbral && (analisis.noNegativa || aptitud.apta || aptitud.motivo !== 'E-MOD-02')) fallos.push(`#${i}: signo`);
      if (aptitud.apta && (o.minimo < -umbral || ind.esCero(area.area.valor))) fallos.push(`#${i}: aptitud`);
    });
    expect(fallos).toEqual([]);
  });
});

describe('costos calculados desde valores exactos en m² (R-25.3; R-17.2)', () => {
  it('60 figuras aleatorias con precio y adicional dan los costos exactos', () => {
    const azar = crearAzar(20261021 + 60);
    const entre = (min, max) => min + Math.floor(azar() * (max - min + 1));
    const centesimas = (k) => `${Math.floor(k / 100)}.${String(k % 100).padStart(2, '0')}`;
    const fallos = [];
    for (let i = 0; i < 60; i += 1) {
      const tipo = azar() < 0.5 ? 'rectangulo' : 'triangulo';
      const unidad = azar() < 0.5 ? 'cm' : 'm';
      const [kb, kh] = [entre(1, 400), entre(1, 400)]; // dimensiones de k/4
      const precio = entre(0, 100000000); // centavos, hasta Q1 000 000
      const adicional = entre(0, 10000); // centésimas de %, hasta 100 %
      const figura = calcularFigura({ tipo, unidad, base: `${kb / 4}`, altura: `${kh / 4}` });
      const resultado = estimarMaterial({
        fuente: { tipo: 'figura', resultado: figura.valor }, textoPrecio: centesimas(precio), textoAdicional: centesimas(adicional)
      });
      let area = ind.producto(ind.q(BigInt(kb), 4n), ind.q(BigInt(kh), 4n));
      if (tipo === 'triangulo') area = ind.producto(area, ind.q(1n, 2n));
      const m2 = unidad === 'cm' ? ind.producto(area, ind.q(1n, 10000n)) : area;
      const p = ind.q(BigInt(precio), 100n);
      const estimada = ind.producto(m2, ind.suma(ind.q(1n), ind.q(BigInt(adicional), 10000n)));
      const v = resultado.valor;
      const coincide = resultado.ok
        && ind.comparar(v.areaUtilM2.valor, m2) === 0
        && ind.comparar(v.areaEstimadaM2.valor, estimada) === 0
        && ind.comparar(v.costoBase.valor, ind.producto(m2, p)) === 0
        && ind.comparar(v.costoEstimado.valor, ind.producto(estimada, p)) === 0;
      if (!coincide) fallos.push(`#${i}: ${tipo} ${kb / 4} × ${kh / 4} ${unidad}`);
    }
    expect(fallos).toEqual([]);
  });
});
