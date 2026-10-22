// Catálogo de ejemplos de ÁreaCalc (T-16; design.md §3; requirements R-13).
//
// Solo contiene ENTRADAS: los textos que escribiría el usuario. No hay resultados,
// pasos ni puntos de gráfica (R-13.3): al elegir un ejemplo, estado.cargarEjemplo copia
// estos textos con las mismas transiciones que una entrada manual y llama a los casos de
// uso (R-13.2). Los valores esperados solo están en tests/casos-referencia.js.
//
// Contrato (interfaz/estado.js, typedef Ejemplo):
//   { id, seccion: 'perfil' | 'figuras', origen, titulo, entrada, estimacion?, simulado? }
//   - origen: una de las tres etiquetas de R-13.1 (ORIGENES).
//   - titulo: texto legible para el selector; empieza por el origen.
//   - estimacion: precio y adicional; solo el caso práctico, cuyos datos son simulados
//     (simulado: true, R-13.4). No hay precios reales en el catálogo.
//
// Fuentes de cada entrada: requirements §14 y docs/formulario-matematico.md §13
// (columna «Fuente»): P1-A y P1-D son ejercicios de clase; PC §7.3, el caso práctico
// simulado; PC §6.2 y §7.4 y CP, casos de comprobación. Donde requirements §14 fija el
// resultado «en metros» (CR-02, CR-05, CR-06), el ejemplo usa la interpretación física;
// en el resto, la abstracta, que es la del enunciado (CR-01) o no está fijada (CR-07,
// CR-14, CR-15). I, A_geo y f_prom no dependen de ella.
// Este módulo no importa nada (design §2).

/** Etiquetas de origen de R-13.1. */
export const ORIGENES = Object.freeze({
  clase: 'Ejercicio de clase',
  comprobacion: 'Caso de comprobación',
  simulado: 'Caso práctico simulado'
});

function congelar(valor) {
  if (valor !== null && typeof valor === 'object') {
    for (const interno of Object.values(valor)) congelar(interno);
    Object.freeze(valor);
  }
  return valor;
}

const perfil = (id, origen, descripcion, entrada, extra = {}) => ({
  id, seccion: 'perfil', origen, titulo: `${origen} · ${descripcion}`, entrada, ...extra
});

const figura = (id, origen, descripcion, entrada) => ({
  id, seccion: 'figuras', origen, titulo: `${origen} · ${descripcion}`, entrada
});

/**
 * Catálogo para cargarEjemplo (interfaz/estado.js) y para el selector de la vista.
 * @type {ReadonlyArray<Readonly<import('../interfaz/estado.js').Ejemplo & { origen: string, titulo: string }>>}
 */
export const EJEMPLOS = congelar([
  // CR-01: requirements §14 y formulario §4 (P1-D).
  perfil('CR-01', ORIGENES.clase, 'x³ − 1 en [1, 4]',
    { textoFuncion: 'x^3 - 1', textoA: '1', textoB: '4', interpretacion: 'abstracta' }),
  // CR-02: requirements §14 («en metros, perfil válido») y formulario §5 (P1-A).
  perfil('CR-02', ORIGENES.clase, '1 + x² en [−1, 2] m (valor promedio)',
    { textoFuncion: '1 + x^2', textoA: '-1', textoB: '2', interpretacion: 'fisica' }),
  // CR-03: requirements §14 y formulario §7 (PC §7.3). Precio y adicional simulados.
  perfil('CR-03', ORIGENES.simulado, '2 + x²/4 en [0, 4] m, precio y adicional simulados',
    { textoFuncion: '2 + x^2/4', textoA: '0', textoB: '4', interpretacion: 'fisica' },
    { estimacion: { textoPrecio: '50', textoAdicional: '10' }, simulado: true }),
  // CR-05: requirements §14 («en metros, E-MOD-02») y formulario §13 (PC §6.2).
  perfil('CR-05', ORIGENES.comprobacion, 'x en [−1, 1] m: integral frente a área',
    { textoFuncion: 'x', textoA: '-1', textoB: '1', interpretacion: 'fisica' }),
  // CR-06: requirements §14 («E-MOD-02») y formulario §13 (PC §7.4).
  perfil('CR-06', ORIGENES.comprobacion, 'función negativa −2 en [0, 3] m',
    { textoFuncion: '-2', textoA: '0', textoB: '3', interpretacion: 'fisica' }),
  // CR-07: requirements §14 y formulario §13 (PC §7.4).
  perfil('CR-07', ORIGENES.comprobacion, 'tangencia (x − 1)² en [0, 2]',
    { textoFuncion: '(x-1)^2', textoA: '0', textoB: '2', interpretacion: 'abstracta' }),
  // CR-14: requirements §14 y formulario §2 y §13 (CP).
  perfil('CR-14', ORIGENES.comprobacion, 'x³ − x en [−2, 2]: tres cambios de signo',
    { textoFuncion: 'x^3 - x', textoA: '-2', textoB: '2', interpretacion: 'abstracta' }),
  // CR-15: requirements §14 y formulario §2 y §13 (CP).
  perfil('CR-15', ORIGENES.comprobacion, 'x² − 2 en [0, 2]: cero irracional',
    { textoFuncion: 'x^2 - 2', textoA: '0', textoB: '2', interpretacion: 'abstracta' }),
  // CR-09: requirements §14 y formulario §8 (PC §7.4, caso 6).
  figura('CR-09', ORIGENES.comprobacion, 'rectángulo de 4 m × 2 m',
    { tipo: 'rectangulo', unidad: 'm', base: '4', altura: '2' }),
  // CR-10: requirements §14 y formulario §8 (PC §7.4, caso 7).
  figura('CR-10', ORIGENES.comprobacion, 'rectángulo de 100 cm × 200 cm',
    { tipo: 'rectangulo', unidad: 'cm', base: '100', altura: '200' })
]);
