// Pruebas de src/casos-de-uso/estimarMaterial.js (T-08; design.md §9 a §11; R-16 y R-17).
// Los valores esperados vienen de tests/casos-referencia.js (CR-03, CR-05, CR-08,
// CR-09, CR-10, CR-19 y CR-20). Las fuentes se obtienen con los casos de uso de
// perfil y de figura, como en la aplicación. Los demás valores se calculan con
// tests/aritmetica-independiente.js.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { analizarPerfil } from '../../src/casos-de-uso/analizarPerfil.js';
import { calcularFigura } from '../../src/casos-de-uso/calcularFigura.js';
import { estimarMaterial } from '../../src/casos-de-uso/estimarMaterial.js';
import { CATALOGO } from '../../src/nucleo/errores.js';
import { CASOS } from '../casos-referencia.js';
import { producto, q } from '../aritmetica-independiente.js';

afterEach(() => vi.restoreAllMocks());

const codigos = (resultado) => resultado.errores.map((e) => e.codigo);
const exacta = (valor) => ({ clase: 'exacta', valor });

const fuentePerfil = (entrada, interpretacion) => ({
  tipo: 'perfil', resultado: analizarPerfil({ interpretacion: 'abstracta', ...entrada, ...(interpretacion ? { interpretacion } : {}) }).valor
});
const fuenteFigura = (entrada) => ({ tipo: 'figura', resultado: calcularFigura(entrada).valor });

function valida(entrada) {
  const resultado = estimarMaterial(entrada);
  expect(resultado.ok, JSON.stringify(resultado.errores?.map((e) => e.codigo))).toBe(true);
  return resultado;
}

describe('casos de referencia', () => {
  it('CR-03: Q50/m² y w = 10 % dan 2000/3 y 2200/3, sin redondeo previo (R-17.3)', () => {
    const { entrada, esperado } = CASOS['CR-03'];
    const { valor } = valida({
      fuente: fuentePerfil(entrada), textoPrecio: entrada.textoPrecio, textoAdicional: entrada.textoAdicional
    });
    expect(valor.areaUtilM2).toEqual(exacta(esperado.estimacion.areaUtil.valor));
    expect(valor.areaEstimadaM2).toEqual(exacta(esperado.estimacion.areaEstimada.valor));
    expect(valor.costoBase).toEqual(exacta(esperado.estimacion.costoBase.valor));
    expect(valor.costoEstimado).toEqual(exacta(esperado.estimacion.costoEstimado.valor));
    expect(valor.precio).toEqual(exacta(q(50n)));
    expect(valor.adicional).toEqual(exacta(q(10n)));
    expect(valor.factorAdicional).toEqual(q(11n, 10n));
    // Redondear 13.33 m² antes de multiplicar daría Q666.50 (formulario §7.2): no es el costo base.
    expect(valor.costoBase.valor).not.toEqual(producto(q(1333n, 100n), q(50n)));
    expect(valor.descripcionFuente).toBe('Perfil x²/4 + 2 en [0, 4] m');
  });

  it('CR-20: precio 0 y w = 0 son válidos (R-17.4)', () => {
    const { entrada, esperado } = CASOS['CR-20'];
    const { valor } = valida({
      fuente: fuentePerfil(entrada), textoPrecio: entrada.textoPrecio, textoAdicional: entrada.textoAdicional
    });
    expect(valor.areaEstimadaM2).toEqual(exacta(esperado.estimacion.areaEstimada.valor));
    expect(valor.costoBase).toEqual(exacta(esperado.estimacion.costoBase.valor));
    expect(valor.costoEstimado).toEqual(exacta(esperado.estimacion.costoEstimado.valor));
  });

  it('CR-10: el área de la figura se usa ya convertida a m² (R-15.5)', () => {
    const { entrada, esperado } = CASOS['CR-10'];
    const { valor } = valida({ fuente: fuenteFigura(entrada), textoPrecio: '50', textoAdicional: '10' });
    expect(valor.areaUtilM2).toEqual(exacta(esperado.areaM2.valor));
    // 2 m² × 50 = 100; 2 m² × 1.1 = 11/5 m²; 11/5 × 50 = 110.
    expect(valor.costoBase).toEqual(exacta(q(100n)));
    expect(valor.areaEstimadaM2).toEqual(exacta(q(11n, 5n)));
    expect(valor.costoEstimado).toEqual(exacta(q(110n)));
    expect(valor.descripcionFuente).toBe('Rectángulo de base 100 cm y altura 200 cm');
  });

  it('CR-19: un círculo conserva el coeficiente exacto de π en los costos', () => {
    const { entrada } = CASOS['CR-19'].subcasos[1];
    const { valor } = valida({ fuente: fuenteFigura(entrada), textoPrecio: '10', textoAdicional: '0' });
    expect(valor.costoBase.clase).toBe('multiploPi');
    expect(valor.costoBase.coeficiente).toEqual(q(250n)); // 25π m² × Q10/m²
    expect(valor.descripcionFuente).toBe('Círculo de radio 5 m');
  });
});

describe('aptitud de la fuente (R-16, R-17.6)', () => {
  it.each([
    ['sin fuente', null],
    ['fuente sin resultado', { tipo: 'perfil', resultado: null }],
    ['figura sin resultado', { tipo: 'figura', resultado: undefined }]
  ])('%s → E-MOD-04', (_, fuente) => {
    expect(codigos(estimarMaterial({ fuente, textoPrecio: '50', textoAdicional: '10' }))).toEqual(['E-MOD-04']);
  });

  it('CR-01 abstracto → E-MOD-01', () => {
    expect(codigos(estimarMaterial({ fuente: fuentePerfil(CASOS['CR-01'].entrada), textoPrecio: '50', textoAdicional: '10' })))
      .toEqual(['E-MOD-01']);
  });

  it.each(['CR-05', 'CR-06', 'CR-08'])('%s en metros → el motivo de su aptitud', (id) => {
    const { entrada, esperado } = CASOS[id];
    const resultado = estimarMaterial({ fuente: fuentePerfil(entrada, 'fisica'), textoPrecio: '50', textoAdicional: '10' });
    expect(codigos(resultado)).toEqual([esperado.aptitudEnMetros.codigo]);
    expect(resultado.errores[0].campo).toBe('estimacion');
    expect(resultado).not.toHaveProperty('valor');
  });

  it('el área útil de un perfil es A_geo, nunca la integral con signo (R-16.4)', () => {
    const fuente = fuentePerfil(CASOS['CR-02'].entrada, 'fisica');
    const { valor } = valida({ fuente, textoPrecio: '1', textoAdicional: '0' });
    expect(valor.areaUtilM2).toEqual(fuente.resultado.area.area);
    expect(valor.descripcionFuente).toBe('Perfil x² + 1 en [-1, 2] m');
  });

  it('sin una fuente apta no se validan el precio ni el adicional', () => {
    expect(codigos(estimarMaterial({ fuente: null, textoPrecio: '', textoAdicional: 'abc' }))).toEqual(['E-MOD-04']);
  });
});

describe('precio y adicional (R-17.4; Tabla 9.3)', () => {
  const fuente = fuenteFigura(CASOS['CR-09'].entrada);

  it('se validan por separado y se acumulan sus errores', () => {
    const resultado = estimarMaterial({ fuente, textoPrecio: '', textoAdicional: '101' });
    expect(resultado.errores.map((e) => [e.campo, e.codigo])).toEqual([['precio', 'E-NUM-01'], ['adicional', 'E-NUM-04']]);
  });

  it.each([
    ['-1', '10', 'E-NUM-05'], ['2.505', '10', 'E-NUM-04'], ['1000000.01', '10', 'E-NUM-04'],
    ['50', '-0.5', 'E-NUM-05'], ['50', '10.001', 'E-NUM-04'], ['Infinity', '10', 'E-NUM-03'], ['50,5', '10', 'E-NUM-02']
  ])('precio «%s» y adicional «%s» → %s', (textoPrecio, textoAdicional, codigo) => {
    expect(codigos(estimarMaterial({ fuente, textoPrecio, textoAdicional }))).toEqual([codigo]);
  });

  it('los extremos de la Tabla 9.3 son válidos', () => {
    const { valor } = valida({ fuente, textoPrecio: '1000000', textoAdicional: '100' });
    // 8 m² × 2 = 16 m²; 8 × 10⁶ y 16 × 10⁶.
    expect(valor.areaEstimadaM2).toEqual(exacta(q(16n)));
    expect(valor.costoBase).toEqual(exacta(q(8000000n)));
    expect(valor.costoEstimado).toEqual(exacta(q(16000000n)));
  });
});

describe('supuestos y contrato ResultadoEstimacion (design §10; R-17.5)', () => {
  const fuente = fuenteFigura(CASOS['CR-09'].entrada);

  it('siempre lleva W-06; W-05 solo con datos simulados', () => {
    const real = valida({ fuente, textoPrecio: '50', textoAdicional: '10' });
    expect(real.advertencias.map((a) => a.codigo)).toEqual(['W-06']);
    expect(real.valor.supuestos).toEqual([CATALOGO['W-06'].plantilla]);
    expect(real.valor.supuestos[0]).toMatch(/mano de obra/);
    const simulado = valida({ fuente, textoPrecio: '50', textoAdicional: '10', datosSimulados: true });
    expect(simulado.advertencias.map((a) => a.codigo)).toEqual(['W-06', 'W-05']);
    expect(simulado.valor.supuestos[1]).toBe(CATALOGO['W-05'].plantilla);
  });

  it('tiene los campos de design §10, más factorAdicional y pasos, y está congelado', () => {
    const { valor } = valida({ fuente, textoPrecio: '50', textoAdicional: '10' });
    expect(Object.keys(valor).sort()).toEqual([
      'adicional', 'areaEstimadaM2', 'areaUtilM2', 'costoBase', 'costoEstimado', 'descripcionFuente', 'factorAdicional',
      'pasos', 'precio', 'supuestos'
    ]);
    expect(Object.isFrozen(valor)).toBe(true);
    expect(Object.isFrozen(valor.supuestos)).toBe(true);
    expect(Object.isFrozen(valor.pasos)).toBe(true);
  });

  it('pasos (T-17): el procedimiento de design §14.2 con los costos de CR-03, sin recalcularlos en la vista', () => {
    const cr03 = fuentePerfil(CASOS['CR-03'].entrada, 'fisica');
    const { textoPrecio, textoAdicional } = CASOS['CR-03'].entrada;
    const { pasos } = valida({ fuente: cr03, textoPrecio, textoAdicional, datosSimulados: true }).valor;
    expect(pasos.map((p) => p.id)).toEqual(['areaUtil', 'adicional', 'costoBase', 'costoEstimado', 'supuestos']);
    const { costoBase, costoEstimado } = CASOS['CR-03'].esperado.estimacion;
    expect(pasos[2].texto).toMatch(new RegExp(`${costoBase.decimal}$`)); // «… ≈ Q666.67»
    expect(pasos[3].texto).toMatch(new RegExp(`${costoEstimado.decimal}$`)); // «… ≈ Q733.33»
    expect(pasos[4].texto).toContain(CATALOGO['W-05'].plantilla);
  });

  it.each([
    ['sin entrada', null],
    ['precio que no es texto', { fuente, textoPrecio: 50, textoAdicional: '10' }],
    ['fuente de tipo desconocido', { fuente: { tipo: 'terreno', resultado: {} }, textoPrecio: '50', textoAdicional: '10' }],
    ['perfil sin aptitud', { fuente: { tipo: 'perfil', resultado: {} }, textoPrecio: '50', textoAdicional: '10' }]
  ])('%s → E-SIS-02 sin detalles técnicos', (_, entrada) => {
    const errorConsola = vi.spyOn(console, 'error').mockImplementation(() => {});
    const resultado = estimarMaterial(entrada);
    expect(codigos(resultado)).toEqual(['E-SIS-02']);
    expect(resultado.errores[0].mensaje).toBe(CATALOGO['E-SIS-02'].plantilla);
    expect(resultado).not.toHaveProperty('valor');
    expect(errorConsola).toHaveBeenCalledTimes(1);
  });
});
