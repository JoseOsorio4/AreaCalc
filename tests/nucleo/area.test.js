// Pruebas de src/nucleo/area.js (T-06; design.md §9).
// A_geo, I y los tramos esperados vienen de tests/casos-referencia.js. Cada f se
// escribe a mano desde el texto de la entrada del caso; la integral y el análisis
// se obtienen con integral.js y ceros.js, que ya tienen sus pruebas. Las áreas
// aproximadas y sus cotas se comprueban con comparaciones racionales exactas,
// nunca con Number.
import { describe, expect, it } from 'vitest';
import { MOTIVO_CEROS_IRRACIONALES, areaGeometrica } from '../../src/nucleo/area.js';
import { analizarSigno, cotaCorte } from '../../src/nucleo/ceros.js';
import { integrarDefinida } from '../../src/nucleo/integral.js';
import { POLINOMIO_CERO, desdeCoeficientes, escalar, multiplicar } from '../../src/nucleo/polinomio.js';
import {
  abs, comparar, desdeDecimal, dividir, fraccion, multiplicar as por, negar, potencia, restar, sumar
} from '../../src/nucleo/racional.js';
import { CASOS } from '../casos-referencia.js';

const q = (n, d = 1) => fraccion(BigInt(n), BigInt(d));
/** Polinomio de x^0 hacia arriba; [n, d] es la fracción n/d. */
const pol = (...coef) => desdeCoeficientes(coef.map((c) => (Array.isArray(c) ? q(...c) : q(c))));
/** Producto de los factores (x − r). */
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

/** Integral, análisis y área de f en [a, b]. */
function calcular(f, a, b) {
  const integral = integrarDefinida(f, a, b);
  const analisis = analizarSigno(f, a, b);
  return { integral, analisis, resultado: areaGeometrica(integral, analisis) };
}

/** r redondea al texto de la fuente («≈ 2.4379»): |r − d| ≤ media unidad del último decimal. */
function redondeaA(r, texto) {
  const decimal = texto.replace('≈', '').trim();
  const media = fraccion(1n, 2n * 10n ** BigInt(decimal.split('.')[1].length));
  return comparar(abs(restar(r, desdeDecimal(decimal))), media) <= 0;
}

/** Casos con todos los cortes exactos: f escrita desde la entrada de cada caso. */
const EXACTOS = {
  'CR-01': pol(-1, 0, 0, 1), // x³ − 1
  'CR-02': pol(1, 0, 1), // 1 + x²
  'CR-03': pol(2, 0, [1, 4]), // 2 + x²/4
  'CR-04': pol(0, 0, 1), // x²
  'CR-05': pol(0, 1), // x
  'CR-06': pol(-2), // −2
  'CR-07': pol(1, -2, 1), // (x − 1)²
  'CR-08': POLINOMIO_CERO, // 0
  'CR-14': pol(0, -1, 0, 1), // x³ − x
  'CR-28': conRaices(q(1, 3), q(2), q(-1)),
  'CR-29': conRaices(q(1), q(1), q(1)), // (x − 1)³
  'CR-30': conRaices(q(1), q(1), q(-2)), // (x − 1)²(x + 2)
  'CR-31': pol([-1, 3], 1), // x − 1/3
  'CR-32': desdeCoeficientes([q(0), q(0), q(0), CASOS['CR-32'].esperado.coeficiente.valor]), // (0.000001x)³
  'CR-35': escalar(multiplicar(conRaices(q(1, 3)), pol(1, 0, 1)), q(10n ** 60n)) // 10⁶⁰(x − 1/3)(x² + 1)
};
/** Casos con f ≥ 0 en [a, b] (formulario §2, §4 a §7 y §13). */
const NO_NEGATIVOS = ['CR-01', 'CR-02', 'CR-03', 'CR-04', 'CR-07', 'CR-08'];

describe('área exacta: todos los cortes son exactos', () => {
  it.each(Object.keys(EXACTOS))('%s: A_geo del caso, exacta y sin cota', (id) => {
    const { resultado } = calcular(EXACTOS[id], ...intervalo(id));
    expect(resultado.area).toEqual({ clase: 'exacta', valor: CASOS[id].esperado.Ageo.valor });
    for (const tramo of resultado.tramos) expect(tramo.valorAbsoluto).toEqual(abs(tramo.integral));
  });

  it.each(NO_NEGATIVOS)('%s: f ≥ 0, así que A_geo = I e igualAI (R-06.3)', (id) => {
    const { resultado } = calcular(EXACTOS[id], ...intervalo(id));
    expect(resultado.igualAI).toBe(true);
    expect(resultado.area.valor).toEqual(CASOS[id].esperado.I.valor);
  });

  it('con cambio de signo, A_geo > |I|: nunca se usa |I| como sustituto (R-06.2)', () => {
    for (const id of ['CR-05', 'CR-14', 'CR-28', 'CR-29', 'CR-30', 'CR-31', 'CR-32', 'CR-35']) {
      const { resultado } = calcular(EXACTOS[id], ...intervalo(id));
      expect(resultado.igualAI, id).toBe(false);
      expect(comparar(resultado.area.valor, abs(CASOS[id].esperado.I.valor)), id).toBe(1);
    }
  });

  it.each(['CR-05', 'CR-31'])('%s: tramos, integrales y valores absolutos del formulario', (id) => {
    const { resultado } = calcular(EXACTOS[id], ...intervalo(id));
    expect(resultado.tramos).toEqual(CASOS[id].esperado.tramos.map((t) => ({
      desde: t.desde.valor, hasta: t.hasta.valor, integral: t.integral.valor, valorAbsoluto: t.valorAbsoluto.valor
    })));
  });

  it('CR-14: los cuatro tramos valen 9/4, 1/4, 1/4 y 9/4', () => {
    const { resultado } = calcular(EXACTOS['CR-14'], ...intervalo('CR-14'));
    expect(resultado.tramos.map((t) => t.valorAbsoluto))
      .toEqual(CASOS['CR-14'].esperado.valoresAbsolutosTramos.map((v) => v.valor));
  });

  it('CR-06: f negativa, un solo tramo con I = −6 y A_geo = −I = 6', () => {
    const [a, b] = intervalo('CR-06');
    const { resultado } = calcular(EXACTOS['CR-06'], a, b);
    const { I, Ageo } = CASOS['CR-06'].esperado;
    expect(resultado.tramos).toEqual([{ desde: a, hasta: b, integral: I.valor, valorAbsoluto: Ageo.valor }]);
    expect(resultado.igualAI).toBe(false);
  });

  it('CR-08: f ≡ 0, un tramo de integral 0 y A_geo = 0 exacta', () => {
    const [a, b] = intervalo('CR-08');
    const { resultado } = calcular(POLINOMIO_CERO, a, b);
    expect(resultado.tramos).toEqual([{ desde: a, hasta: b, integral: q(0), valorAbsoluto: q(0) }]);
    expect(resultado.area).toEqual({ clase: 'exacta', valor: CASOS['CR-08'].esperado.Ageo.valor });
  });
});

describe('área aproximada: algún corte es un cero irracional (R-06.5)', () => {
  it('CR-15: corta en el representante de √2 y devuelve el área con su cota', () => {
    const f = pol(-2, 0, 1); // x² − 2
    const [a, b] = intervalo('CR-15');
    const { analisis, resultado } = calcular(f, a, b);
    const [cero] = analisis.ceros;
    const [l, h] = cero.intervalo;
    const { area } = resultado;
    expect(area.clase).toBe(CASOS['CR-15'].esperado.Ageo.clase);
    expect(area.motivo).toBe(MOTIVO_CEROS_IRRACIONALES);
    // La cota existe, es positiva, es la de cotaCorte en el intervalo del cero y cumple §12.
    expect(Object.keys(area).sort()).toEqual(['clase', 'cota', 'motivo', 'valor']);
    expect(comparar(area.cota, q(0))).toBe(1);
    expect(area.cota).toEqual(cotaCorte(f, l, h));
    expect(comparar(area.cota, TOLERANCIA)).toBeLessThanOrEqual(0);
    // Los tramos cortan en el representante, con F(x) = x³/3 − 2x escrita a mano.
    const F = (x) => restar(dividir(potencia(x, 3), q(3)), por(q(2), x));
    expect(resultado.tramos.map((t) => [t.desde, t.hasta])).toEqual([[a, cero.valor], [cero.valor, b]]);
    expect(resultado.tramos.map((t) => t.integral)).toEqual([restar(F(cero.valor), F(a)), restar(F(b), F(cero.valor))]);
    expect(redondeaA(area.valor, CASOS['CR-15'].esperado.Ageo.decimal)).toBe(true);
    // El valor exacto (8√2 − 4)/3 está en (valor − cota, valor + cota). Con u(x) = 3x + 4,
    // equivale a u(valor − cota)² < 128 < u(valor + cota)², porque 8√2 = √128 y u > 0.
    const u = (x) => sumar(por(q(3), x), q(4));
    expect(comparar(potencia(u(restar(area.valor, area.cota)), 2), q(128))).toBe(-1);
    expect(comparar(potencia(u(sumar(area.valor, area.cota)), 2), q(128))).toBe(1);
  });

  it('dos cortes aproximados: x³ − 2x en [−2, 2] suma las dos cotas, y |A_geo − 4| ≤ cota', () => {
    // F = x⁴/4 − x²: los tramos valen −1, 1, −1 y 1, así que A_geo = 4 exactamente.
    const f = pol(0, -2, 0, 1);
    const { analisis, resultado } = calcular(f, q(-2), q(2));
    const aproximados = analisis.ceros.filter((c) => !c.exacto);
    expect(aproximados).toHaveLength(2);
    const { area } = resultado;
    expect(area.clase).toBe('aproximada');
    expect(area.cota).toEqual(sumar(
      cotaCorte(f, ...aproximados[0].intervalo),
      cotaCorte(f, ...aproximados[1].intervalo)
    ));
    expect(comparar(abs(restar(area.valor, q(4))), area.cota)).toBeLessThanOrEqual(0);
  });

  it('CR-36: cota mayor que 10⁻¹² (W-04) y error real menor que la cota', () => {
    const p126 = 10n ** 126n;
    const f = desdeCoeficientes([q(-2n * p126), q(0), q(0), q(p126)]); // 10¹²⁶(x³ − 2)
    const { resultado } = calcular(f, ...intervalo('CR-36'));
    const { area } = resultado;
    expect(area.clase).toBe(CASOS['CR-36'].esperado.Ageo.clase);
    expect(comparar(area.cota, TOLERANCIA)).toBe(1);
    // |A − 3·∛2·10¹²⁶| < cota ⟺ ((A − cota)/(3·10¹²⁶))³ < 2 < ((A + cota)/(3·10¹²⁶))³,
    // porque x³ es creciente y A − cota > 0.
    const escala = q(3n * p126);
    expect(comparar(restar(area.valor, area.cota), q(0))).toBe(1);
    expect(comparar(potencia(dividir(restar(area.valor, area.cota), escala), 3), q(2))).toBe(-1);
    expect(comparar(potencia(dividir(sumar(area.valor, area.cota), escala), 3), q(2))).toBe(1);
  });
});

describe('A_geo ≥ |I| (R-25.3) y E-SIS-02', () => {
  it('A_geo ≥ 0 y A_geo ≥ |I| en todos los casos, exactos y aproximados', () => {
    const casos = [
      ...Object.keys(EXACTOS).map((id) => [id, EXACTOS[id], ...intervalo(id)]),
      ['CR-15', pol(-2, 0, 1), ...intervalo('CR-15')],
      ['x³ − 2x', pol(0, -2, 0, 1), q(-2), q(2)]
    ];
    for (const [nombre, f, a, b] of casos) {
      const { integral, resultado } = calcular(f, a, b);
      expect(comparar(resultado.area.valor, q(0)), nombre).toBeGreaterThanOrEqual(0);
      expect(comparar(resultado.area.valor, abs(integral.I)), nombre).toBeGreaterThanOrEqual(0);
    }
  });

  it('si la integral y el análisis son de intervalos distintos, A_geo < |I| da E-SIS-02', () => {
    const integral = integrarDefinida(pol(0, 1), q(0), q(2)); // I = 2
    const analisis = analizarSigno(pol(0, 1), q(-1), q(1)); // tramos que dan A_geo = 1
    expect(capturar(() => areaGeometrica(integral, analisis))?.codigo).toBe('E-SIS-02');
  });

  it('rechaza entradas que no son una integral ni un análisis', () => {
    const { integral, analisis } = calcular(pol(0, 1), q(-1), q(1));
    expect(() => areaGeometrica(integral, null)).toThrow(TypeError);
    expect(() => areaGeometrica(integral, { tramos: analisis.tramos })).toThrow(TypeError);
    expect(() => areaGeometrica(null, analisis)).toThrow(TypeError);
    expect(() => areaGeometrica({ antiderivada: integral.antiderivada, I: 0 }, analisis)).toThrow(TypeError);
  });

  it('el resultado está congelado', () => {
    const { resultado } = calcular(pol(-2, 0, 1), q(0), q(2));
    expect(Object.isFrozen(resultado)).toBe(true);
    expect(Object.isFrozen(resultado.tramos)).toBe(true);
    expect(Object.isFrozen(resultado.tramos[0])).toBe(true);
    expect(Object.isFrozen(resultado.area)).toBe(true);
  });
});
