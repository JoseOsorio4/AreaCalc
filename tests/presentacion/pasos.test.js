// Pruebas de src/presentacion/pasos.js (T-12; design.md §10 y §14.2; requirements R-09;
// formulario §2, §4.2, §5.2, §7.2 y §8).
// Las entradas son resultados reales de los casos de uso, que cumplen los contratos de
// design §10. Los textos esperados se transcriben del formulario y de design §14.2;
// donde ÁreaCalc escribe la antiderivada en orden descendente (design §14.1), se indica.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { analizarPerfil } from '../../src/casos-de-uso/analizarPerfil.js';
import { calcularFigura } from '../../src/casos-de-uso/calcularFigura.js';
import { estimarMaterial } from '../../src/casos-de-uso/estimarMaterial.js';
import { pasosArea, pasosEstimacion, pasosFigura, pasosPerfil, pasosPromedio } from '../../src/presentacion/pasos.js';
import { CASOS } from '../casos-referencia.js';
import { q } from '../aritmetica-independiente.js';

const MENOS = '\u2212';
const perfil = (entrada, interpretacion = 'abstracta') => {
  const resultado = analizarPerfil({ interpretacion, ...entrada });
  expect(resultado.ok, entrada.textoFuncion).toBe(true);
  return resultado.valor;
};
/** Paso con ese id (el primero si hay varios). */
const buscar = (pasos, id) => {
  const encontrado = pasos.find((p) => p.id === id);
  expect(encontrado, id).toBeDefined();
  return encontrado;
};
const textos = (pasos, id) => pasos.filter((p) => p.id === id).map((p) => p.texto);

describe('CR-01: área sin cambio de signo (formulario §4.2)', () => {
  const pasos = pasosArea(perfil(CASOS['CR-01'].entrada));

  it('sigue el orden de R-09.2 y design §14.2', () => {
    expect(pasos.map((p) => p.id)).toEqual([
      'datos', 'signo', 'planteamiento', 'antiderivada', 'limiteSuperior', 'limiteInferior', 'resta', 'resultado', 'interpretacion'
    ]);
  });

  it('datos, análisis de signo y planteamiento', () => {
    expect(buscar(pasos, 'datos').texto).toBe('f(x) = x³ − 1,  [a, b] = [1, 4],  unidades abstractas (u, u²)');
    expect(buscar(pasos, 'signo').texto)
      .toBe('f(1) = 0 (cero en el extremo); en el resto de [1, 4], f(x) > 0 → f(x) ≥ 0 en [1, 4], así que A_geo = I.');
    expect(buscar(pasos, 'planteamiento').texto).toBe('A = ∫[1,4] (x³ − 1) dx');
  });

  it('antiderivada, sin «+C» y explicando que la constante se cancela', () => {
    const antiderivada = buscar(pasos, 'antiderivada');
    expect(antiderivada.texto).toBe('F(x) = x⁴/4 − x   (regla de la potencia y linealidad)');
    expect(antiderivada.latex).toBe('F(x) = \\frac{x^{4}}{4} - x');
    expect(antiderivada.explicacion).toMatch(/constante de integración se cancela/);
  });

  it('F(4) = 60 y F(1) = −3/4, con los valores de cada término', () => {
    expect(buscar(pasos, 'limiteSuperior').texto).toBe('F(4) = 4⁴/4 − 4 = 64 − 4 = 60'); // design §14.2
    expect(buscar(pasos, 'limiteSuperior').latex).toBe('F(4) = \\frac{4^{4}}{4} - 4 = 64 - 4 = 60');
    expect(buscar(pasos, 'limiteInferior').texto).toBe('F(1) = 1⁴/4 − 1 = 1/4 − 1 = −3/4'); // formulario §4.2
  });

  it('resta con el negativo entre paréntesis y resultado 243/4 (R-09.6)', () => {
    expect(buscar(pasos, 'resta').texto).toBe(`A = F(4) ${MENOS} F(1) = 60 ${MENOS} (${MENOS}3/4) = 243/4`);
    expect(buscar(pasos, 'resta').latex).toBe('A = F(4) - F(1) = 60 - \\left(-\\frac{3}{4}\\right) = \\frac{243}{4}');
    expect(buscar(pasos, 'resultado').texto).toBe('A = 243/4 = 60.75 u²');
    expect(buscar(pasos, 'interpretacion').texto).toBe('La región entre la curva y el eje X en [1, 4] mide 243/4 = 60.75 u².');
  });
});

describe('CR-02: valor promedio y equivalencia con la pizarra (formulario §5.2)', () => {
  const resultado = perfil(CASOS['CR-02'].entrada);
  const pasos = pasosPromedio(resultado);

  it('sigue el orden de R-09.3 y design §14.2', () => {
    expect(pasos.map((p) => p.id)).toEqual(['formula', 'sustitucion', 'integral', 'division', 'unidades', 'interpretacion']);
  });

  it('fórmula, sustitución de a y b, integral y división', () => {
    expect(buscar(pasos, 'formula').texto).toBe('f_prom = [1/(b − a)] · ∫[a,b] f(x) dx');
    expect(buscar(pasos, 'sustitucion').texto)
      .toBe(`f_prom = [1/(2 ${MENOS} (${MENOS}1))] · ∫[${MENOS}1,2] (x² + 1) dx = (1/3) · ∫[${MENOS}1,2] (x² + 1) dx`);
    expect(buscar(pasos, 'integral').texto).toBe(`I = F(2) ${MENOS} F(${MENOS}1) = 14/3 ${MENOS} (${MENOS}4/3) = 6`);
    expect(buscar(pasos, 'division').texto).toBe('f_prom = (1/3) · 6 = 2'); // formulario §5.2, paso 8
  });

  it('explica la equivalencia con la pizarra sin calcular nada nuevo', () => {
    expect(buscar(pasos, 'division').explicacion).toBe(
      `Equivalencia con la pizarra: en los apuntes, (1/3) se distribuye antes de restar: (1/3)·(14/3) ${MENOS} (1/3)·(${MENOS}4/3)`
      + ` = (1/3)·[14/3 ${MENOS} (${MENOS}4/3)] = (1/3)·6 = 2. El resultado es el mismo porque el producto se distribuye sobre la resta.`
    );
  });

  it('unidades sin «+C» y rectángulo equivalente (f > 0)', () => {
    expect(buscar(pasos, 'unidades').texto).toBe('I = 6 u² (es el área, porque f ≥ 0);  f_prom = 2 u, sin constante de integración.');
    expect(buscar(pasos, 'interpretacion').texto).toBe(
      'El valor promedio de f en [−1, 2] es 2 u. El rectángulo equivalente, de base 3 u y altura 2 u, tiene área 6 u², la misma que la región.'
    );
  });

  it('las sustituciones del área: F(2) = 14/3 y F(−1) = −4/3, con el negativo entre paréntesis', () => {
    const area = pasosArea(resultado);
    // El formulario escribe x + x³/3 (orden ascendente); ÁreaCalc usa el descendente de design §14.1.
    expect(buscar(area, 'limiteSuperior').texto).toBe('F(2) = 2³/3 + 2 = 8/3 + 2 = 14/3');
    expect(buscar(area, 'limiteInferior').texto).toBe(`F(${MENOS}1) = (${MENOS}1)³/3 + (${MENOS}1) = ${MENOS}1/3 ${MENOS} 1 = ${MENOS}4/3`);
    expect(buscar(area, 'antiderivada').texto).toBe('F(x) = x³/3 + x   (regla de la potencia y linealidad)');
    expect(buscar(area, 'antiderivada').explicacion).toContain('en los apuntes puede escribirse x + x³/3, que es la misma antiderivada');
  });
});

describe('CR-05: integral con signo frente a área por tramos (formulario §2)', () => {
  const resultado = perfil(CASOS['CR-05'].entrada);
  const pasos = pasosArea(resultado);

  it('sigue el orden de R-09.4 y design §14.2, con un paso por tramo', () => {
    expect(pasos.map((p) => p.id)).toEqual([
      'datos', 'signo', 'planteamiento', 'antiderivada', 'ceros', 'tramo', 'tramo', 'suma', 'comparacion', 'resultado', 'interpretacion'
    ]);
  });

  it('plantea I y A_geo por separado', () => {
    expect(buscar(pasos, 'planteamiento').texto).toBe(`I = ∫[${MENOS}1,1] x dx;  A_geo = ∫[${MENOS}1,1] |x| dx`);
    expect(buscar(pasos, 'ceros').texto).toBe(`Ceros en [${MENOS}1, 1]: x = 0, cambia de signo.`);
  });

  it('los tramos, su valor absoluto y la suma coinciden con el formulario', () => {
    expect(textos(pasos, 'tramo')).toEqual([
      `Tramo 1: [${MENOS}1, 0]:  I₁ = F(0) ${MENOS} F(${MENOS}1) = ${MENOS}1/2  →  |I₁| = 1/2`,
      `Tramo 2: [0, 1]:  I₂ = F(1) ${MENOS} F(0) = 1/2  →  |I₂| = 1/2`
    ]);
    expect(buscar(pasos, 'suma').texto).toBe('A_geo = 1/2 + 1/2 = 1 u²');
  });

  it('distingue la integral con signo del área (R-11.2)', () => {
    expect(buscar(pasos, 'comparacion').texto).toBe(`I = ${MENOS}1/2 + 1/2 = 0 u², mientras que A_geo = 1 u².`);
    expect(buscar(pasos, 'resultado').texto).toBe('A_geo = 1 u² (área geométrica);  I = 0 u² (integral con signo)');
  });

  it('el promedio usa I y no muestra el rectángulo equivalente', () => {
    const promedio = pasosPromedio(resultado);
    expect(buscar(promedio, 'division').texto).toBe('f_prom = (1/2) · 0 = 0');
    expect(buscar(promedio, 'interpretacion').texto).toMatch(/no se muestra el rectángulo equivalente: esa igualdad requiere f ≥ 0/);
  });
});

describe('CR-03: estimación con los valores exactos (formulario §7.2)', () => {
  const fuente = { tipo: 'perfil', resultado: perfil(CASOS['CR-03'].entrada) };
  const { entrada } = CASOS['CR-03'];
  const estimacion = estimarMaterial({ fuente, textoPrecio: entrada.textoPrecio, textoAdicional: entrada.textoAdicional }).valor;
  const pasos = pasosEstimacion(estimacion);

  it('sigue el orden de design §14.2', () => {
    expect(pasos.map((p) => p.id)).toEqual(['areaUtil', 'adicional', 'costoBase', 'costoEstimado', 'supuestos']);
  });

  it('área útil y área con el adicional', () => {
    expect(buscar(pasos, 'areaUtil').texto).toBe('A_útil = 40/3 ≈ 13.3333 m²   (Perfil x²/4 + 2 en [0, 4] m)');
    expect(buscar(pasos, 'adicional').texto)
      .toBe('A_estimada = A_útil × (1 + w/100) = (40/3) × (1 + 10/100) = (40/3) × (11/10) = 44/3 ≈ 14.6667 m²');
  });

  it('costos: 2000/3 ≈ Q666.67 y 2200/3 ≈ Q733.33, sin redondeo previo', () => {
    expect(buscar(pasos, 'costoBase').texto).toBe('Costo_base = A_útil × p = (40/3) × 50 = 2000/3 ≈ Q666.67');
    expect(buscar(pasos, 'costoEstimado').texto).toBe('Costo_estimado = A_estimada × p = (44/3) × 50 = 2200/3 ≈ Q733.33');
    const todo = pasos.map((p) => `${p.texto} ${p.latex ?? ''}`).join(' ');
    for (const incorrecto of CASOS['CR-03'].esperado.estimacion.costosIncorrectos) expect(todo).not.toContain(incorrecto);
  });

  it('muestra los supuestos de la estimación (R-17.5)', () => {
    expect(buscar(pasos, 'supuestos').texto).toBe(estimacion.supuestos.join(' '));
    expect(buscar(pasos, 'supuestos').texto).toMatch(/mano de obra/);
  });

  it('el área del perfil: F(4) con el término 2x y F(0) = 0', () => {
    const area = pasosArea(fuente.resultado);
    expect(buscar(area, 'limiteSuperior').texto).toBe('F(4) = 4³/12 + 2·4 = 16/3 + 8 = 40/3');
    expect(buscar(area, 'limiteInferior').texto).toBe('F(0) = 0');
    expect(buscar(area, 'datos').texto).toContain('perfil físico (x y f(x) en m; área en m²)');
  });

  it('CR-20: precio 0 da Q0.00', () => {
    const cero = estimarMaterial({ fuente, textoPrecio: '0', textoAdicional: '0' }).valor;
    expect(buscar(pasosEstimacion(cero), 'costoBase').texto).toBe('Costo_base = A_útil × p = (40/3) × 0 = Q0.00');
  });
});

describe('otros casos de área', () => {
  it('CR-06: función negativa, A_geo = −I', () => {
    const pasos = pasosArea(perfil(CASOS['CR-06'].entrada));
    expect(buscar(pasos, 'signo').texto).toBe(`f(x) < 0 en todo [0, 3], así que A_geo = ${MENOS}I.`);
    expect(buscar(pasos, 'planteamiento').texto).toBe(`I = ∫[0,3] (${MENOS}2) dx;  A_geo = ${MENOS}I`);
    expect(buscar(pasos, 'limiteSuperior').texto).toBe(`F(3) = ${MENOS}2·3 = ${MENOS}6`);
    expect(buscar(pasos, 'resultado').texto).toBe(`I = ${MENOS}6 u²;  A_geo = ${MENOS}I = 6 u²`);
  });

  it('CR-07: desarrollo a la forma normalizada y tangencia', () => {
    const resultado = perfil(CASOS['CR-07'].entradas[0]);
    const pasos = pasosArea(resultado);
    expect(pasos.map((p) => p.id).slice(0, 3)).toEqual(['datos', 'desarrollo', 'signo']);
    expect(buscar(pasos, 'desarrollo').texto).toBe(`(x-1)^2 = x² ${MENOS} 2x + 1`);
    // El LaTeX sale del modelo, nunca del texto del usuario (R-20.5).
    expect(buscar(pasos, 'desarrollo').latex).toBe('f(x) = x^{2} - 2x + 1');
    expect(buscar(pasos, 'signo').texto).toContain('f(1) = 0 sin cambiar de signo (tangencia)');
    expect(pasosArea(perfil(CASOS['CR-07'].entradas[1])).map((p) => p.id)).not.toContain('desarrollo');
  });

  it('CR-08: f idénticamente cero', () => {
    const pasos = pasosArea(perfil(CASOS['CR-08'].entrada));
    expect(buscar(pasos, 'signo').texto).toBe('f(x) = 0 en todo [0, 4]: la curva coincide con el eje X, así que A_geo = I = 0.');
    expect(buscar(pasos, 'resultado').texto).toBe('A = 0 u²');
  });

  it('CR-14: cuatro tramos con los valores absolutos de la referencia', () => {
    const { entrada, esperado } = CASOS['CR-14'];
    const pasos = pasosArea(perfil(entrada));
    expect(textos(pasos, 'tramo')).toHaveLength(esperado.valoresAbsolutosTramos.length);
    // valoresAbsolutosTramos de CR-14: 9/4, 1/4, 1/4 y 9/4; A_geo = 5.
    expect(buscar(pasos, 'suma').texto).toBe('A_geo = 9/4 + 1/4 + 1/4 + 9/4 = 5 u²');
    expect(buscar(pasos, 'ceros').texto).toBe(`Ceros en [${MENOS}2, 2]: x = ${MENOS}1, cambia de signo; x = 0, cambia de signo; x = 1, cambia de signo.`);
  });

  it('CR-15: área aproximada con el corte irracional r₁ y su cota', () => {
    const pasos = pasosArea(perfil(CASOS['CR-15'].entrada));
    expect(buscar(pasos, 'ceros').texto).toBe('Ceros en [0, 2]: r₁ ≈ 1.4142 (irracional; se usa un valor aproximado), cambia de signo.');
    expect(textos(pasos, 'tramo')).toEqual([
      `Tramo 1: [0, r₁]:  I₁ = F(r₁) ${MENOS} F(0) ≈ ${MENOS}1.8856  →  |I₁| ≈ 1.8856`,
      `Tramo 2: [r₁, 2]:  I₂ = F(2) ${MENOS} F(r₁) ≈ 0.5523  →  |I₂| ≈ 0.5523`
    ]);
    expect(buscar(pasos, 'suma').texto).toBe('A_geo ≈ 1.8856 + 0.5523 ≈ 2.4379 u² (aproximada; cota de error ≤ 6·10⁻²⁵)');
    expect(buscar(pasos, 'comparacion').texto).toBe(
      `I = F(2) ${MENOS} F(0) = ${MENOS}4/3 ${MENOS} 0 = ${MENOS}4/3 ≈ ${MENOS}1.3333 u², mientras que A_geo ≈ 2.4379 u² (aproximada; cota de error ≤ 6·10⁻²⁵).`
    );
    expect(buscar(pasos, 'resultado').texto).toBe(
      `A_geo ≈ 2.4379 u² (aproximada; cota de error ≤ 6·10⁻²⁵) (área geométrica);  I = ${MENOS}4/3 ≈ ${MENOS}1.3333 u² (integral con signo)`
    );
  });
});

describe('figuras (formulario §8)', () => {
  it('CR-10: rectángulo en cm, con la conversión a m²', () => {
    const pasos = pasosFigura(calcularFigura(CASOS['CR-10'].entrada).valor);
    expect(pasos.map((p) => p.id)).toEqual(['datos', 'formula', 'sustitucion', 'resultado', 'conversion']);
    expect(pasos.map((p) => p.texto)).toEqual([
      'Rectángulo: base b = 100 cm, altura h = 200 cm.', 'A = b × h', 'A = 100 × 200', 'A = 20000 cm²', 'A = 20000 cm² ÷ 10 000 = 2 m²'
    ]);
    expect(buscar(pasos, 'formula').explicacion).toMatch(/no requiere integración/);
  });

  it('CR-09 y CR-19: rectángulo y triángulo en m, sin conversión', () => {
    const rectangulo = pasosFigura(calcularFigura(CASOS['CR-09'].entrada).valor);
    expect(rectangulo.map((p) => p.id)).not.toContain('conversion');
    expect(buscar(rectangulo, 'resultado').texto).toBe('A = 8 m²');
    const triangulo = pasosFigura(calcularFigura(CASOS['CR-19'].subcasos[0].entrada).valor);
    expect(buscar(triangulo, 'sustitucion').texto).toBe('A = (4 × 3)/2');
    expect(buscar(triangulo, 'resultado').texto).toBe('A = 6 m²');
  });

  it('CR-19: círculo con 25π y su aproximación', () => {
    const pasos = pasosFigura(calcularFigura(CASOS['CR-19'].subcasos[1].entrada).valor);
    expect(buscar(pasos, 'formula').texto).toBe('A = π r²');
    expect(buscar(pasos, 'sustitucion').texto).toBe('A = π · 5²');
    expect(buscar(pasos, 'resultado').texto).toBe('A = 25π ≈ 78.5398 m²');
  });

  it('un círculo en cm conserva π en la conversión', () => {
    const pasos = pasosFigura(calcularFigura({ tipo: 'circulo', unidad: 'cm', radio: '50' }).valor);
    expect(buscar(pasos, 'conversion').texto).toBe('A = 2500π ≈ 7853.9816 cm² ÷ 10 000 = π/4 ≈ 0.7854 m²');
  });
});

describe('los pasos solo muestran datos ya calculados (R-09.1, R-24.2)', () => {
  it('si el resultado trae otros valores, los pasos muestran esos valores, sin recalcular', () => {
    const real = perfil(CASOS['CR-01'].entrada);
    const [t0, t1] = real.integral.terminos;
    const alterado = {
      ...real,
      integral: { ...real.integral, Fb: q(999n), I: q(777n), terminos: [{ ...t0, valorEnB: q(500n) }, t1] },
      area: { ...real.area, area: { clase: 'exacta', valor: q(7n) } }
    };
    const pasos = pasosArea(alterado);
    expect(buscar(pasos, 'limiteSuperior').texto).toBe('F(4) = 4⁴/4 − 4 = 500 − 4 = 999');
    expect(buscar(pasos, 'resta').texto).toBe(`A = F(4) ${MENOS} F(1) = 999 ${MENOS} (${MENOS}3/4) = 777`);
    expect(buscar(pasos, 'resultado').texto).toBe('A = 7 u²');
  });

  it('pasos.js solo importa formato.js y racional.js, y no hace aritmética', () => {
    const archivo = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'presentacion', 'pasos.js');
    const codigo = readFileSync(archivo, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
    const importados = [...codigo.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]).sort();
    expect(importados).toEqual(['../nucleo/racional.js', './formato.js']);
    expect(codigo).not.toMatch(/racional\.(?:sumar|restar|multiplicar|dividir|potencia|abs|negar|comparar)\b/);
    expect(codigo).not.toMatch(/\bevaluar|integrar|analizarSigno|areaGeometrica|estimarMaterial\(|\bNumber\s*\(|\bMath\./);
  });
});

describe('contrato Paso (design §10) y ningún «+C» (R-09.7)', () => {
  const perfiles = Object.values(CASOS).flatMap((caso) => [
    ...(caso.entrada ? [caso.entrada] : []), ...(caso.entradas ?? []), ...(caso.subcasos ?? []).map((s) => s.entrada)
  ]).filter((e) => e.textoFuncion !== undefined && e.textoA !== undefined)
    .map((e) => analizarPerfil({ interpretacion: 'abstracta', ...e }))
    .filter((r) => r.ok)
    .map((r) => r.valor);
  const figuras = [CASOS['CR-09'].entrada, CASOS['CR-10'].entrada, CASOS['CR-19'].subcasos[0].entrada, CASOS['CR-19'].subcasos[1].entrada]
    .map((e) => calcularFigura(e).valor);
  const todos = [
    ...perfiles.flatMap((v) => { const { area, promedio } = pasosPerfil(v); return [...area, ...promedio]; }),
    ...figuras.flatMap((f) => pasosFigura(f))
  ];

  it('hay pasos de al menos 25 perfiles y 4 figuras', () => {
    expect(perfiles.length).toBeGreaterThanOrEqual(25);
    expect(todos.length).toBeGreaterThan(400);
  });

  it('cada paso tiene id, título y texto; latex y explicación son textos o null; está congelado', () => {
    for (const p of todos) {
      expect(Object.keys(p).sort()).toEqual(['explicacion', 'id', 'latex', 'texto', 'titulo']);
      expect(typeof p.texto === 'string' && p.texto.length > 0, p.id).toBe(true);
      expect(p.latex === null || typeof p.latex === 'string').toBe(true);
      expect(p.explicacion === null || typeof p.explicacion === 'string').toBe(true);
      expect(Object.isFrozen(p)).toBe(true);
    }
  });

  it('ningún texto, LaTeX ni explicación contiene «+C» ni «+ C»', () => {
    const conC = todos.filter((p) => [p.texto, p.latex, p.explicacion].some((t) => t !== null && /\+\s*C\b/.test(t)));
    expect(conC.map((p) => `${p.id}: ${p.texto}`)).toEqual([]);
  });

  it('pasosPerfil devuelve la forma de ResultadoPerfil.pasos', () => {
    const resultado = pasosPerfil(perfiles[0]);
    expect(Object.keys(resultado).sort()).toEqual(['area', 'promedio']);
    expect(Object.isFrozen(resultado)).toBe(true);
  });

  it('rechaza lo que no cumple el contrato', () => {
    expect(() => pasosArea({})).toThrow(TypeError);
    expect(() => pasosPromedio(null)).toThrow(TypeError);
    expect(() => pasosFigura({ tipo: 'trapecio' })).toThrow(TypeError);
    expect(() => pasosEstimacion({})).toThrow(TypeError);
  });
});
