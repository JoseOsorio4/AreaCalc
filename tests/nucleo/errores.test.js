// Pruebas de src/nucleo/errores.js (T-07; requirements §10; design §11).
// La lista de códigos se transcribe de requirements §10.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CATALOGO, crearAdvertencia, crearError } from '../../src/nucleo/errores.js';

const ERRORES_R10 = [
  'E-EXP-01', 'E-EXP-02', 'E-EXP-03', 'E-EXP-04', 'E-EXP-05', 'E-EXP-06',
  'E-EXP-07', 'E-EXP-08', 'E-EXP-09', 'E-EXP-10', 'E-EXP-11', 'E-EXP-12',
  'E-NUM-01', 'E-NUM-02', 'E-NUM-03', 'E-NUM-04', 'E-NUM-05', 'E-NUM-06',
  'E-INT-01', 'E-INT-02',
  'E-MOD-01', 'E-MOD-02', 'E-MOD-03', 'E-MOD-04',
  'E-SIS-01', 'E-SIS-02',
  'E-CEN-01', 'E-CEN-02'
];
const ADVERTENCIAS_R10 = ['W-01', 'W-02', 'W-03', 'W-04', 'W-05', 'W-06', 'W-07', 'W-08', 'W-09'];
/** Datos de ejemplo para todos los marcadores de las plantillas. */
const DATOS = { posicion: 3, simbolo: 'y', numero: '10000000', etiqueta: 'precio', rango: 'entre 0 y 1', x: '1', cota: '6·10⁻²⁵' };
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CODIGO = /\b(?:E-[A-Z]{3}-\d{2}|W-\d{2})\b/g;

describe('catálogo (requirements §10)', () => {
  it('contiene exactamente los 28 errores y las 9 advertencias', () => {
    expect(Object.keys(CATALOGO).sort()).toEqual([...ERRORES_R10, ...ADVERTENCIAS_R10].sort());
    for (const codigo of ERRORES_R10) expect(CATALOGO[codigo].tipo, codigo).toBe('error');
    for (const codigo of ADVERTENCIAS_R10) expect(CATALOGO[codigo].tipo, codigo).toBe('advertencia');
  });

  it('agrupa los errores por categoría y está congelado', () => {
    const categorias = { EXP: 'expresion', NUM: 'numero', INT: 'intervalo', MOD: 'modelo-fisico', SIS: 'sistema', CEN: 'centroide' };
    for (const codigo of ERRORES_R10) expect(CATALOGO[codigo].categoria, codigo).toBe(categorias[codigo.slice(2, 5)]);
    expect(Object.isFrozen(CATALOGO)).toBe(true);
    expect(Object.isFrozen(CATALOGO['E-NUM-01'])).toBe(true);
  });

  it('todo código usado en src/ y en los casos de referencia existe en el catálogo', () => {
    const archivos = (carpeta) => (existsSync(carpeta) ? readdirSync(carpeta).flatMap((nombre) => {
      const ruta = join(carpeta, nombre);
      if (statSync(ruta).isDirectory()) return archivos(ruta);
      return nombre.endsWith('.js') ? [ruta] : [];
    }) : []);
    const usados = new Set([...archivos(join(RAIZ, 'src')), join(RAIZ, 'tests', 'casos-referencia.js')]
      .flatMap((ruta) => readFileSync(ruta, 'utf8').match(CODIGO) ?? []));
    expect(usados.size).toBeGreaterThan(10);
    expect([...usados].filter((codigo) => !Object.hasOwn(CATALOGO, codigo))).toEqual([]);
  });
});

describe('crearError y crearAdvertencia', () => {
  it('todo código produce un mensaje completo, sin marcadores sin rellenar', () => {
    for (const codigo of ERRORES_R10) {
      const error = crearError(codigo, DATOS);
      expect(Object.keys(error).sort(), codigo).toEqual(['campo', 'codigo', 'datos', 'mensaje', 'posicion', 'sugerencia']);
      expect(error.codigo).toBe(codigo);
      expect(error.mensaje.length, codigo).toBeGreaterThan(10);
      expect(`${error.mensaje} ${error.sugerencia ?? ''}`, codigo).not.toMatch(/[{}]/);
      expect(Object.isFrozen(error)).toBe(true);
    }
    for (const codigo of ADVERTENCIAS_R10) {
      const advertencia = crearAdvertencia(codigo, DATOS);
      expect(Object.keys(advertencia).sort(), codigo).toEqual(['codigo', 'datos', 'mensaje']);
      expect(advertencia.mensaje, codigo).not.toMatch(/[{}]/);
    }
  });

  it('rellena los datos y aplica campo, posición y sugerencia', () => {
    expect(crearError('E-EXP-03', { simbolo: 'y' }).mensaje).toContain('«y»');
    const sintaxis = crearError('E-EXP-02', { posicion: 4 });
    expect([sintaxis.campo, sintaxis.posicion]).toEqual(['funcion', 4]);
    expect(sintaxis.mensaje).toContain('posición 4');
    const numero = crearError('E-NUM-02', { etiqueta: 'precio', campo: 'precio', sugerencia: 'Use 2.5.' });
    expect([numero.campo, numero.sugerencia]).toEqual(['precio', 'Use 2.5.']);
    expect(crearError('E-INT-01').campo).toBe('intervalo');
    expect(crearAdvertencia('W-02', { x: '1' }).mensaje).toContain('x = 1');
  });

  it('inserta los datos como texto, sin interpretarlos (R-20.5)', () => {
    expect(crearError('E-EXP-03', { simbolo: '<img src=x>' }).mensaje).toContain('«<img src=x>»');
    expect(() => crearError('E-EXP-03', { simbolo: { toString: () => 'y' } })).toThrow(TypeError);
  });

  it('un código desconocido, del tipo equivocado o sin sus datos es un error de programación', () => {
    expect(() => crearError('E-XYZ-01')).toThrow(RangeError);
    expect(() => crearError('W-01')).toThrow(RangeError);
    expect(() => crearAdvertencia('E-SIS-02')).toThrow(RangeError);
    expect(() => crearError('E-NUM-01')).toThrow(TypeError); // falta etiqueta
    expect(() => crearError('E-EXP-02', { posicion: 1.5 })).toThrow(TypeError);
    expect(() => crearError('E-SIS-02', 'detalle')).toThrow(TypeError);
  });
});
