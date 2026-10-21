// Robustez de los casos de uso (T-08; design.md §10 y §11; R-19.4).
// Los casos de uso nunca lanzan excepciones hacia la interfaz: con cualquier
// entrada devuelven un Resultado congelado, con códigos del catálogo. Las entradas
// se generan con una semilla fija, mezclando textos válidos, inválidos y valores
// que no son textos.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { analizarPerfil } from '../../src/casos-de-uso/analizarPerfil.js';
import { calcularFigura } from '../../src/casos-de-uso/calcularFigura.js';
import { estimarMaterial } from '../../src/casos-de-uso/estimarMaterial.js';
import { CATALOGO } from '../../src/nucleo/errores.js';

afterEach(() => vi.restoreAllMocks());

let estado = 20261021 + 8;
function azar() {
  estado = (estado + 0x6d2b79f5) >>> 0;
  let t = estado;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const elegir = (lista) => lista[Math.floor(azar() * lista.length)];

const TEXTOS = ['x', 'x^3 - 1', '2 + x^2/4', '(x-1)^2', 'x^4', '1/x', 'y', '', '   ', 'sqrt(x)', 'f(x)=x', '0,5', '1e3',
  '-1', '0', '4', '1000', '1000.5', 'Infinity', 'NaN', '−2', 'abc', '50', '10', '101', '((((((((((((x', 'x'.repeat(250)];
const VALORES = [...TEXTOS, null, undefined, 5, {}, [], true];
const INTERPRETACIONES = ['abstracta', 'fisica', 'otra', null];

function revisar(resultado) {
  expect(Object.isFrozen(resultado)).toBe(true);
  expect(typeof resultado.ok).toBe('boolean');
  if (resultado.ok) {
    expect(Object.isFrozen(resultado.valor)).toBe(true);
    expect(resultado).not.toHaveProperty('errores');
  } else {
    expect(resultado.errores.length).toBeGreaterThan(0);
    expect(resultado).not.toHaveProperty('valor');
    for (const error of resultado.errores) expect(Object.hasOwn(CATALOGO, error.codigo), error.codigo).toBe(true);
  }
}

describe('ningún caso de uso lanza excepciones (design §10)', () => {
  it('analizarPerfil con 300 entradas arbitrarias', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    for (let i = 0; i < 300; i += 1) {
      const entrada = azar() < 0.05 ? elegir(VALORES)
        : { textoFuncion: elegir(VALORES), textoA: elegir(VALORES), textoB: elegir(VALORES), interpretacion: elegir(INTERPRETACIONES) };
      revisar(analizarPerfil(entrada));
    }
  });

  it('calcularFigura con 300 entradas arbitrarias', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    for (let i = 0; i < 300; i += 1) {
      const entrada = azar() < 0.05 ? elegir(VALORES) : {
        tipo: elegir(['rectangulo', 'triangulo', 'circulo', 'trapecio', null]), unidad: elegir(['cm', 'm', 'mm']),
        base: elegir(VALORES), altura: elegir(VALORES), radio: elegir(VALORES)
      };
      revisar(calcularFigura(entrada));
    }
  });

  it('estimarMaterial con 300 entradas arbitrarias, con fuentes válidas e inválidas', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const perfilApto = analizarPerfil({ textoFuncion: '2 + x^2/4', textoA: '0', textoB: '4', interpretacion: 'fisica' }).valor;
    const perfilNoApto = analizarPerfil({ textoFuncion: 'x', textoA: '-1', textoB: '1', interpretacion: 'fisica' }).valor;
    const figura = calcularFigura({ tipo: 'circulo', unidad: 'cm', radio: '50' }).valor;
    const FUENTES = [
      { tipo: 'perfil', resultado: perfilApto }, { tipo: 'perfil', resultado: perfilNoApto }, { tipo: 'figura', resultado: figura },
      { tipo: 'figura', resultado: perfilApto }, { tipo: 'perfil', resultado: figura }, { tipo: 'perfil', resultado: null }, null, 5
    ];
    for (let i = 0; i < 300; i += 1) {
      const entrada = azar() < 0.05 ? elegir(VALORES)
        : { fuente: elegir(FUENTES), textoPrecio: elegir(VALORES), textoAdicional: elegir(VALORES), datosSimulados: elegir([true, false, undefined]) };
      revisar(estimarMaterial(entrada));
    }
  });
});
