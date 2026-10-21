// Pruebas de src/nucleo/ceros.js (T-04; design.md §8).
// Los ceros, multiplicidades, tipos, coeficientes A y errores esperados vienen de
// tests/casos-referencia.js. Los signos de los tramos y los casos que no son CR
// son cálculos manuales señalados en cada prueba. Los intervalos de las raíces
// irracionales y las cotas se comprueban con comparaciones racionales exactas,
// nunca con Number.
import { describe, expect, it } from 'vitest';
import {
  PROFUNDIDAD_MAXIMA, PresupuestoAgotado, analizarSigno, coeficienteA, cotaCorte, crearRegistro
} from '../../src/nucleo/ceros.js';
import { POLINOMIO_CERO, desdeCoeficientes, escalar, evaluar, multiplicar } from '../../src/nucleo/polinomio.js';
import {
  abs, aTexto, comparar, desdeDecimal, dividir, fraccion, negar, potencia, restar, sumar
} from '../../src/nucleo/racional.js';
import { CASOS } from '../casos-referencia.js';

/** Racional: q(3) = 3 y q(-1, 4) = −1/4; acepta BigInt. */
const q = (n, d = 1) => fraccion(BigInt(n), BigInt(d));
/** Polinomio de x^0 hacia arriba; [n, d] es la fracción n/d. */
const pol = (...coef) => desdeCoeficientes(coef.map((c) => (Array.isArray(c) ? q(...c) : q(c))));
/** Producto de los factores (x − r), para construir raíces conocidas. */
const conRaices = (...raices) => raices.reduce((p, r) => multiplicar(p, desdeCoeficientes([negar(r), q(1)])), pol(1));
const TOLERANCIA = q(1, 10 ** 12);
const capturar = (fn) => {
  try { fn(); } catch (error) { return error; }
  return null;
};

/** Intervalo [a, b] de la entrada de un caso de referencia. */
function intervalo(id) {
  const entrada = CASOS[id].entrada ?? CASOS[id].entradas[0];
  return [desdeDecimal(entrada.textoA), desdeDecimal(entrada.textoB)];
}

/** r redondea al texto de la fuente («≈ 1.4142»): |r − d| ≤ media unidad del último decimal. */
function redondeaA(r, texto) {
  const decimal = texto.replace('≈', '').trim();
  const media = fraccion(1n, 2n * 10n ** BigInt(decimal.split('.')[1].length));
  return comparar(abs(restar(r, desdeDecimal(decimal))), media) <= 0;
}

/** Compara los ceros obtenidos con los de un caso de referencia, campo por campo. */
function comprobarCeros(analisis, esperados) {
  expect(analisis.ceros).toHaveLength(esperados.length);
  esperados.forEach((esperado, i) => {
    const cero = analisis.ceros[i];
    expect(cero.exacto).toBe(esperado.valor.clase === 'exacta');
    if (cero.exacto) {
      expect(cero.valor).toEqual(esperado.valor.valor);
      expect(cero.intervalo).toBeNull();
    }
    if (esperado.tipo) expect(cero.tipo).toBe(esperado.tipo);
    if (esperado.multiplicidad) expect(cero.multiplicidad).toBe(esperado.multiplicidad);
  });
}

describe('casos de referencia con ceros exactos', () => {
  // f se escribe a mano desde el texto de la entrada del caso. Los signos de los
  // tramos son cálculos manuales: por ejemplo, en CR-28 f(0) = (−1/3)(−2)(1) > 0.
  const casos = [
    ['CR-01', pol(-1, 0, 0, 1), [1]], // x³ − 1: cero en el extremo 1
    ['CR-04', pol(0, 0, 1), [1]], // x²: cero doble en el extremo 0
    ['CR-05', pol(0, 1), [-1, 1]], // x
    ['CR-06', pol(-2), [-1]], // −2: sin ceros, negativa
    ['CR-07', pol(1, -2, 1), [1]], // (x − 1)²: tangencia
    ['CR-14', pol(0, -1, 0, 1), [-1, 1, -1, 1]], // x³ − x
    ['CR-28', conRaices(q(1, 3), q(2), q(-1)), [1, -1, 1]],
    ['CR-29', conRaices(q(1), q(1), q(1)), [-1, 1]], // (x − 1)³: triple que cambia de signo
    ['CR-30', conRaices(q(1), q(1), q(-2)), [-1, 1]], // (x − 1)²(x + 2)
    ['CR-31', pol([-1, 3], 1), [-1, 1]], // x − 1/3
    ['CR-32', desdeCoeficientes([q(0), q(0), q(0), CASOS['CR-32'].esperado.coeficiente.valor]), [-1, 1]]
  ];

  it.each(casos)('%s: ceros, multiplicidades, tipos y signos de los tramos', (id, f, signos) => {
    const analisis = analizarSigno(f, ...intervalo(id));
    comprobarCeros(analisis, CASOS[id].esperado.ceros);
    expect(analisis.tramos.map((t) => t.signo)).toEqual(signos);
    expect(analisis.cambiaSigno).toBe(signos.length >= 2);
    expect(analisis.noNegativa).toBe(signos.every((s) => s > 0));
    expect(analisis.hayAproximaciones).toBe(false);
    expect(analisis.identicamenteCero).toBe(false);
  });

  it('CR-18 (5x − x² en [0, 5]): ceros en ambos extremos y f ≥ 0', () => {
    const subcaso = CASOS['CR-18'].subcasos[2];
    const a = desdeDecimal(subcaso.entrada.textoA);
    const b = desdeDecimal(subcaso.entrada.textoB);
    const analisis = analizarSigno(pol(0, 5, -1), a, b);
    comprobarCeros(analisis, subcaso.esperado.ceros);
    expect(analisis.tramos.map((t) => t.signo)).toEqual([1]);
    expect(analisis.noNegativa).toBe(true);
  });

  it.each([['CR-05', pol(0, 1)], ['CR-31', pol([-1, 3], 1)]])(
    '%s: los tramos y sus signos coinciden con los del formulario',
    (id, f) => {
      const analisis = analizarSigno(f, ...intervalo(id));
      const esperados = CASOS[id].esperado.tramos;
      expect(analisis.tramos.map((t) => [t.desde, t.hasta]))
        .toEqual(esperados.map((t) => [t.desde.valor, t.hasta.valor]));
      // El signo de cada tramo es el de su integral en el formulario.
      expect(analisis.tramos.map((t) => t.signo))
        .toEqual(esperados.map((t) => (t.integral.valor.num < 0n ? -1 : 1)));
      expect(analisis.tramos.every((t) => t.desdeExacto && t.hastaExacto)).toBe(true);
    }
  );

  it('CR-08: f ≡ 0 no lista ceros y deja un tramo de signo 0', () => {
    const analisis = analizarSigno(POLINOMIO_CERO, ...intervalo('CR-08'));
    expect(analisis.identicamenteCero).toBe(CASOS['CR-08'].esperado.identicamenteCero);
    expect(analisis.ceros).toEqual(CASOS['CR-08'].esperado.ceros);
    expect(analisis.tramos.map((t) => t.signo)).toEqual([0]);
    expect(analisis.cambiaSigno).toBe(false);
    expect(analisis.noNegativa).toBe(true); // 0 ≥ 0; E-MOD-03 depende del área, no del signo
  });

  it('CR-35: 1/3 exacta pese al factor 10⁶⁰, porque A sale de la parte primitiva', () => {
    const f = escalar(multiplicar(conRaices(q(1, 3)), pol(1, 0, 1)), q(10n ** 60n));
    const esperado = CASOS['CR-35'].esperado;
    expect(coeficienteA(f)).toBe(esperado.coeficienteA);
    const analisis = analizarSigno(f, ...intervalo('CR-35'));
    comprobarCeros(analisis, esperado.ceros);
    expect(analisis.hayAproximaciones).toBe(false);
  });
});

describe('raíces irracionales aproximadas', () => {
  it('CR-15: √2 aproximada, con un intervalo que la contiene y la tolerancia de §12', () => {
    const f = pol(-2, 0, 1);
    const analisis = analizarSigno(f, ...intervalo('CR-15'));
    const esperado = CASOS['CR-15'].esperado.ceros[0];
    expect(analisis.ceros).toHaveLength(1);
    const [cero] = analisis.ceros;
    expect(cero.exacto).toBe(false);
    expect(cero.tipo).toBe(esperado.tipo);
    expect(cero.multiplicidad).toBe(1);
    expect(redondeaA(cero.valor, esperado.valor.decimal)).toBe(true);
    const [l, h] = cero.intervalo;
    // 0 ≤ l < h, así que l² < 2 < h² equivale a l < √2 < h.
    expect(comparar(potencia(l, 2), q(2))).toBe(-1);
    expect(comparar(potencia(h, 2), q(2))).toBe(1);
    expect(cero.valor).toEqual(dividir(sumar(l, h), q(2)));
    expect(comparar(restar(h, l), TOLERANCIA)).toBeLessThanOrEqual(0);
    expect(comparar(cotaCorte(f, l, h), TOLERANCIA)).toBeLessThanOrEqual(0);
    expect(analisis.hayAproximaciones).toBe(true);
    expect(analisis.tramos.map((t) => t.signo)).toEqual([-1, 1]);
    expect(analisis.tramos.map((t) => [t.desdeExacto, t.hastaExacto])).toEqual([[true, false], [false, true]]);
  });

  it('CR-36: ∛2 con la profundidad agotada, cota > 10⁻¹² y error del área menor que la cota', () => {
    const p126 = 10n ** 126n;
    const f = desdeCoeficientes([q(-2n * p126), q(0), q(0), q(p126)]); // 10¹²⁶(x³ − 2)
    const [a, b] = intervalo('CR-36');
    const analisis = analizarSigno(f, a, b);
    const esperado = CASOS['CR-36'].esperado;
    expect(analisis.ceros).toHaveLength(1);
    const [cero] = analisis.ceros;
    expect(cero.exacto).toBe(false);
    expect(cero.tipo).toBe(esperado.ceros[0].tipo);
    const [l, h] = cero.intervalo;
    // l³ < 2 < h³: el intervalo contiene ∛2.
    expect(comparar(potencia(l, 3), q(2))).toBe(-1);
    expect(comparar(potencia(h, 3), q(2))).toBe(1);
    // La aproximación llegó a la profundidad máxima: ancho (b − a)/2²⁰⁰.
    expect(restar(h, l)).toEqual(dividir(restar(b, a), q(2n ** BigInt(PROFUNDIDAD_MAXIMA))));
    const cota = cotaCorte(f, l, h);
    expect(comparar(cota, TOLERANCIA)).toBe(1);
    // Área con el corte en r̃: F = 10¹²⁶(x⁴/4 − 2x), con F(0) = F(2) = 0.
    const F = desdeCoeficientes([q(0), q(-2n * p126), q(0), q(0), q(p126, 4)]);
    const Fr = evaluar(F, cero.valor);
    const areaCalculada = sumar(abs(restar(Fr, evaluar(F, a))), abs(restar(evaluar(F, b), Fr)));
    // |A − 3·∛2·10¹²⁶| < cota equivale, porque x³ es creciente y A − cota > 0, a
    // ((A − cota)/(3·10¹²⁶))³ < 2 < ((A + cota)/(3·10¹²⁶))³. Todo es exacto.
    const escala = q(3n * p126);
    expect(comparar(potencia(dividir(restar(areaCalculada, cota), escala), 3), q(2))).toBe(-1);
    expect(comparar(potencia(dividir(sumar(areaCalculada, cota), escala), 3), q(2))).toBe(1);
  });
});

describe('presupuesto de bisecciones agotado (E-SIS-01)', () => {
  it('CR-33: la prueba de racionalidad necesitaría 201 bisecciones', () => {
    const esperado = CASOS['CR-33'].esperado;
    const f = desdeCoeficientes([q(-2), q(1, 10n ** 60n), q(0), q(1)]); // x³ + 10⁻⁶⁰x − 2
    const [a, b] = intervalo('CR-33');
    // design §8, paso 6: ⌊log₂((b − a)·A)⌋ + 1 bisecciones, es decir, los bits de (b − a)·A.
    const ancho = restar(b, a);
    expect(ancho.den).toBe(1n);
    const necesarias = (ancho.num * coeficienteA(f)).toString(2).length;
    expect(necesarias).toBe(esperado.biseccionesNecesarias);
    expect(necesarias).toBeGreaterThan(PROFUNDIDAD_MAXIMA);
    const error = capturar(() => analizarSigno(f, a, b));
    expect(error).toBeInstanceOf(PresupuestoAgotado);
    expect([error.codigo]).toEqual(esperado.errores);
  });

  it('CR-34: E-SIS-01, así que la raíz racional nunca aparece como aproximada', () => {
    const esperado = CASOS['CR-34'].esperado;
    const c = esperado.raizRacional.valor; // 1/999983²¹
    const f = desdeCoeficientes([negar(c), q(1), negar(c), q(1)]); // (x − c)(x² + 1)
    expect(evaluar(f, c)).toEqual({ num: 0n, den: 1n });
    const error = capturar(() => analizarSigno(f, ...intervalo('CR-34')));
    expect(error).toBeInstanceOf(PresupuestoAgotado);
    expect([error.codigo]).toEqual(esperado.errores);
  });
});

describe('registro único (design §8, paso 3)', () => {
  it('un segundo registro de la misma raíz da E-SIS-02 y no cambia la multiplicidad', () => {
    const registro = crearRegistro(q(0), q(2));
    registro.registrar(q(1), 2);
    const error = capturar(() => registro.registrar(fraccion(2n, 2n), 3)); // 2/2 es la misma raíz
    expect(error?.codigo).toBe('E-SIS-02');
    expect(registro.ceros).toHaveLength(1);
    expect(registro.ceros[0].multiplicidad).toBe(2);
    expect(registro.ceros[0].tipo).toBe('tangencia');
  });

  it('clasifica por posición y multiplicidad (paso 7)', () => {
    const registro = crearRegistro(q(0), q(2));
    registro.registrar(q(0), 3);
    registro.registrar(q(1, 2), 1);
    registro.registrar(q(1), 2);
    registro.registrar(q(3, 2), 3);
    expect(registro.ceros.map((c) => c.tipo)).toEqual(['extremo', 'cambio-signo', 'tangencia', 'cambio-signo']);
  });

  it('ninguna raíz aparece dos veces, ni siquiera tras reiniciar el paso 5', () => {
    const casos = [
      [conRaices(q(1), q(1), q(1)), q(0), q(2)], // CR-29
      [conRaices(q(1), q(1), q(-2)), q(-3), q(2)], // CR-30
      [pol(0, -1, 0, 1), q(-2), q(2)], // CR-14: tres reinicios
      [multiplicar(pol(0, 1), pol(-2, 0, 1)), q(-2), q(2)] // x(x² − 2): exacta y dos aproximadas
    ];
    for (const [f, a, b] of casos) {
      const valores = analizarSigno(f, a, b).ceros.map((c) => aTexto(c.valor));
      expect(new Set(valores).size).toBe(valores.length);
    }
  });
});

describe('otros casos calculados a mano', () => {
  it('raíz triple en un extremo: (x − 1)³ en [1, 2] (design §8)', () => {
    const analisis = analizarSigno(conRaices(q(1), q(1), q(1)), q(1), q(2));
    expect(analisis.ceros.map((c) => [c.valor, c.multiplicidad, c.tipo])).toEqual([[q(1), 3, 'extremo']]);
    expect(analisis.tramos.map((t) => t.signo)).toEqual([1]);
  });

  it('raíces exactas con denominadores 7 y 11: (x − 1/7)(x − 5/11)(x + 2/13) en [0, 1]', () => {
    // −2/13 queda fuera; f(0) = (−1/7)(−5/11)(2/13) > 0.
    const analisis = analizarSigno(conRaices(q(1, 7), q(5, 11), q(-2, 13)), q(0), q(1));
    expect(analisis.ceros.map((c) => [c.exacto, c.valor, c.tipo]))
      .toEqual([[true, q(1, 7), 'cambio-signo'], [true, q(5, 11), 'cambio-signo']]);
    expect(analisis.tramos.map((t) => t.signo)).toEqual([1, -1, 1]);
  });

  it('una raíz exacta entre dos irracionales: x(x² − 2) en [−2, 2]', () => {
    const analisis = analizarSigno(multiplicar(pol(0, 1), pol(-2, 0, 1)), q(-2), q(2));
    expect(analisis.ceros.map((c) => c.exacto)).toEqual([false, true, false]);
    expect(analisis.ceros[1].valor).toEqual(q(0));
    // Cada intervalo aproximado contiene una raíz de x² − 2: cambia de signo entre l y h.
    for (const cero of [analisis.ceros[0], analisis.ceros[2]]) {
      const [l, h] = cero.intervalo;
      const signoEn = (x) => comparar(potencia(x, 2), q(2));
      expect(signoEn(l) * signoEn(h)).toBe(-1);
    }
    // f(−3/2) < 0, f(−1) > 0, f(1) < 0 y f(3/2) > 0.
    expect(analisis.tramos.map((t) => t.signo)).toEqual([-1, 1, -1, 1]);
    expect(analisis.hayAproximaciones).toBe(true);
  });

  it('sin ceros en [a, b]: x² + 1, y una raíz doble fuera del intervalo: (x − 1)² en [2, 3]', () => {
    const sinRaices = analizarSigno(pol(1, 0, 1), q(-1), q(1));
    expect(sinRaices.ceros).toEqual([]);
    expect(sinRaices.tramos.map((t) => t.signo)).toEqual([1]);
    const fuera = analizarSigno(pol(1, -2, 1), q(2), q(3));
    expect(fuera.ceros).toEqual([]);
    expect(fuera.noNegativa).toBe(true);
  });

  it('coeficienteA usa la parte primitiva (formulario §2.1, punto 5)', () => {
    expect(coeficienteA(multiplicar(conRaices(q(1, 3)), pol(1, 0, 1)))).toBe(3n); // 3x³ − x² + 3x − 1
    expect(coeficienteA(pol(-2, 0, 1))).toBe(1n); // x² − 2
    expect(coeficienteA(escalar(pol(-2, 0, 0, 1), q(10n ** 60n)))).toBe(1n); // 10⁶⁰(x³ − 2)
    expect(() => coeficienteA(POLINOMIO_CERO)).toThrow(RangeError);
  });

  it('cotaCorte: x² − 2 en [1, 3/2] da M₁·δ² = 3·(1/4)² = 3/16', () => {
    expect(cotaCorte(pol(-2, 0, 1), q(1), q(3, 2))).toEqual(q(3, 16));
  });

  it('rechaza grado mayor que 3 y a ≥ b', () => {
    expect(() => analizarSigno(pol(0, 0, 0, 0, 1), q(0), q(1))).toThrow(RangeError);
    expect(() => analizarSigno(pol(0, 1), q(1), q(1))).toThrow(RangeError);
    expect(() => analizarSigno(pol(0, 1), q(3), q(1))).toThrow(RangeError);
  });
});
