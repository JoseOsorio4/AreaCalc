// Pruebas de src/nucleo/materiales.js (T-07; design.md §9; requirements R-17).
// Áreas, costos y textos esperados de CR-03 y CR-20 vienen de tests/casos-referencia.js.
// `redondear` es un ayudante propio de la prueba, independiente del producto: solo
// demuestra que los valores exactos permiten mostrar Q666.67 y Q733.33 (en src/ el
// redondeo vive únicamente en presentacion/formato.js, T-11).
import { describe, expect, it } from 'vitest';
import { estimarMaterial } from '../../src/nucleo/materiales.js';
import { COTA_PI, areaCirculo, areaRectangulo } from '../../src/nucleo/geometria.js';
import { REGLAS, leerNumero } from '../../src/nucleo/numeros.js';
import { PI_APROX, desdeDecimal, fraccion, multiplicar } from '../../src/nucleo/racional.js';
import { areaAMetrosCuadrados } from '../../src/nucleo/unidades.js';
import { CASOS } from '../casos-referencia.js';

const q = (n, d = 1) => fraccion(BigInt(n), BigInt(d));
const exacta = (r) => ({ clase: 'exacta', valor: r });
const leer = (texto, reglas) => {
  const resultado = leerNumero(texto, reglas);
  expect(resultado.ok).toBe(true);
  return resultado.valor;
};

/** Redondeo mitad alejándose de cero a n decimales, con BigInt (solo para la prueba). */
function redondear(r, n) {
  const escala = 10n ** BigInt(n);
  const magnitud = r.num < 0n ? -r.num : r.num;
  let cociente = (magnitud * escala) / r.den;
  if (2n * ((magnitud * escala) % r.den) >= r.den) cociente += 1n;
  const cifras = cociente.toString().padStart(n + 1, '0');
  const texto = `${cifras.slice(0, -n)}.${cifras.slice(-n)}`;
  return r.num < 0n && cociente !== 0n ? `-${texto}` : texto;
}

/** Estimación de un caso con su área útil y los textos de precio y adicional. */
function estimar(id) {
  const { entrada, esperado } = CASOS[id];
  const areaUtil = exacta(CASOS['CR-03'].esperado.estimacion.areaUtil.valor); // 40/3 m²
  return {
    esperado: esperado.estimacion,
    resultado: estimarMaterial(areaUtil, leer(entrada.textoPrecio, REGLAS.precio), leer(entrada.textoAdicional, REGLAS.adicional))
  };
}

describe('CR-03: Q50/m² y adicional del 10 %, sin redondeo previo (R-17.3)', () => {
  it('área estimada 44/3 m², costo base 2000/3 y costo estimado 2200/3, exactos', () => {
    const { esperado, resultado } = estimar('CR-03');
    expect(resultado.areaUtil).toEqual(exacta(esperado.areaUtil.valor));
    expect(resultado.factorAdicional).toEqual(q(11, 10));
    expect(resultado.areaEstimada).toEqual(exacta(esperado.areaEstimada.valor));
    expect(resultado.costoBase).toEqual(exacta(esperado.costoBase.valor));
    expect(resultado.costoEstimado).toEqual(exacta(esperado.costoEstimado.valor));
  });

  it('esos valores exactos permiten mostrar Q666.67, Q733.33 y ≈ 14.6667', () => {
    const { esperado, resultado } = estimar('CR-03');
    expect(`Q${redondear(resultado.costoBase.valor, 2)}`).toBe(esperado.costoBase.decimal);
    expect(`Q${redondear(resultado.costoEstimado.valor, 2)}`).toBe(esperado.costoEstimado.decimal);
    expect(`≈ ${redondear(resultado.areaEstimada.valor, 4)}`).toBe(esperado.areaEstimada.decimal);
  });

  it('redondear el área antes de multiplicar da los costos incorrectos del formulario §7.2', () => {
    const { esperado } = estimar('CR-03');
    const cincuenta = q(50);
    const prematuros = [
      multiplicar(desdeDecimal('13.33'), cincuenta), // Q666.50
      multiplicar(multiplicar(desdeDecimal('13.33'), desdeDecimal('1.10')), cincuenta), // Q733.15
      multiplicar(desdeDecimal('14.67'), cincuenta) // Q733.50
    ].map((r) => `Q${redondear(r, 2)}`);
    expect(prematuros).toEqual(esperado.costosIncorrectos);
    expect(prematuros).not.toContain(esperado.costoBase.decimal);
  });
});

describe('CR-20: precio 0 y adicional 0 son válidos', () => {
  it('área estimada igual al área útil y costos de Q0.00', () => {
    const { esperado, resultado } = estimar('CR-20');
    expect(resultado.areaEstimada).toEqual(exacta(esperado.areaEstimada.valor));
    expect(resultado.costoBase).toEqual(exacta(esperado.costoBase.valor));
    expect(resultado.costoEstimado).toEqual(exacta(esperado.costoEstimado.valor));
    expect(`Q${redondear(resultado.costoBase.valor, 2)}`).toBe(esperado.costoBase.decimal);
  });
});

describe('figuras como fuente (R-15.5; design §9)', () => {
  it('CR-10: el precio se aplica a 2 m², no a 20 000 cm²', () => {
    const area = areaAMetrosCuadrados(areaRectangulo(q(100), q(200)), 'cm');
    const { costoBase } = estimarMaterial(area, q(50), q(0));
    expect(costoBase).toEqual(exacta(q(100)));
  });

  it('círculo de r = 5 m: el coeficiente de π sigue exacto, k·(1 + w/100)·p', () => {
    const { areaEstimada, costoBase, costoEstimado } = estimarMaterial(areaCirculo(q(5)), q(50), q(10));
    // 25·1.1 = 55/2, 25·50 = 1250 y 25·1.1·50 = 1375.
    const conPi = (k) => ({ clase: 'multiploPi', coeficiente: k, aprox: multiplicar(k, PI_APROX), cota: multiplicar(k, COTA_PI) });
    expect(areaEstimada).toEqual(conPi(q(55, 2)));
    expect(costoBase).toEqual(conPi(q(1250)));
    expect(costoEstimado).toEqual(conPi(q(1375)));
  });

  it('el adicional máximo, 100 %, duplica el área', () => {
    expect(estimarMaterial(exacta(q(3)), q(1), q(100)).areaEstimada).toEqual(exacta(q(6)));
  });
});

describe('validación', () => {
  it('un precio negativo o un adicional fuera de [0, 100] es un error de programación', () => {
    expect(() => estimarMaterial(exacta(q(1)), q(-1), q(0))).toThrow(RangeError);
    expect(() => estimarMaterial(exacta(q(1)), q(1), q(101))).toThrow(RangeError);
    expect(() => estimarMaterial(exacta(q(1)), q(1), q(-1))).toThrow(RangeError);
  });

  it('exige una Cantidad y racionales', () => {
    expect(() => estimarMaterial(q(1), q(1), q(0))).toThrow(TypeError);
    expect(() => estimarMaterial(exacta(q(1)), 50, q(0))).toThrow(TypeError);
  });

  it('el resultado está congelado', () => {
    const resultado = estimarMaterial(exacta(q(1)), q(1), q(0));
    expect(Object.isFrozen(resultado)).toBe(true);
    expect(Object.isFrozen(resultado.costoBase)).toBe(true);
  });
});
