// Analizador sintáctico de ÁreaCalc (T-09; design.md §5.3; requirements Tabla 9.1 y §10).
//
// analizarSintaxis(fichas) construye el árbol de la expresión por descenso
// recursivo, con una función por regla de la gramática de design §5.3:
//   expresion = termino { ("+" | "-") termino } ;
//   termino   = unario { ("*" | "/") unario | implicito } ;
//   implicito = potencia   (solo en los pares de fichas de PRODUCTO_IMPLICITO)
//   unario    = ("+" | "-") unario | potencia ;
//   potencia  = primario [ "^" exponente ] ;
//   exponente = ENTERO | "(" ENTERO ")" ;   ENTERO: NUMERO sin punto decimal
//   primario  = NUMERO | X | "(" expresion ")" ;
// Precedencia: paréntesis > potencia > signo unario > producto y división (de
// izquierda a derecha) > suma y resta. Así, -x^2 = −(x²), 3x^2 = 3·(x²) y 1/2x = (1/2)·x.
//
// El árbol solo describe la expresión y nunca se evalúa (R-20.1). El valor del
// exponente, los grados y los divisores se comprueban al normalizar (T-10): por
// eso x^4, x^0, 2^4, 1/x y x/x son árboles válidos aquí.
//
// Se informa el primer error encontrado, con su posición (contando desde 1):
//   E-EXP-02  ficha inesperada, final prematuro o paréntesis sin cerrar;
//   E-EXP-07  exponente que no es un entero literal, o un segundo «^»;
//   E-EXP-11  más de 10 paréntesis anidados (cuentan también los del exponente).
import { crearError } from '../nucleo/errores.js';
import { LIMITES, TIPOS, analizarLexico } from './lexico.js';

/**
 * Nodos del árbol (design §5.3). `posicion` es la de su ficha principal: el
 * operador, el signo, el «^» o, en un producto implícito, el primer carácter
 * del segundo factor. El signo unario «+» no crea nodo.
 * @typedef {import('./lexico.js').Ficha} Ficha
 * @typedef {import('../nucleo/errores.js').ErrorAreaCalc} ErrorAreaCalc
 * @typedef {{ tipo: 'numero', valor: string, posicion: number }} NodoNumero
 *   `valor` es el texto del literal; normalizar.js lo convierte con racional.desdeDecimal.
 * @typedef {{ tipo: 'x', posicion: number }} NodoX
 * @typedef {{ tipo: 'negacion', arg: Nodo, posicion: number }} NodoNegacion
 * @typedef {{ tipo: 'suma' | 'resta' | 'division', izq: Nodo, der: Nodo, posicion: number }} NodoBinario
 * @typedef {{ tipo: 'producto', izq: Nodo, der: Nodo, implicito: boolean, posicion: number }} NodoProducto
 * @typedef {{ tipo: 'potencia', base: Nodo, exponente: NodoNumero, posicion: number }} NodoPotencia
 *   `exponente` es siempre un entero escrito sin punto decimal.
 * @typedef {NodoNumero | NodoX | NodoNegacion | NodoBinario | NodoProducto | NodoPotencia} Nodo
 * @typedef {{ ok: true, valor: Readonly<Nodo>, advertencias: ReadonlyArray<never> }
 *   | { ok: false, errores: ReadonlyArray<ErrorAreaCalc> }} ResultadoSintaxis Resultado de design §10.
 */

const { NUMERO, X, MAS, MENOS, POR, ENTRE, POTENCIA, ABRE, CIERRA } = TIPOS;

/** Producto implícito: ficha anterior → fichas siguientes admitidas; el resto da E-EXP-02 (design §5.3). */
const PRODUCTO_IMPLICITO = new Map([
  [NUMERO, new Set([X, ABRE])], // 3x, 2(x-1)
  [CIERRA, new Set([X, ABRE])], // (x+1)x, (x-1)(x+1)
  [X, new Set([ABRE])] // x(x+1); x x y x 2 dan E-EXP-02
]);

/** Fichas que pueden empezar un factor implícito. */
const INICIA_FACTOR = new Set([NUMERO, X, ABRE]);

/** Fichas que empiezan un operando; tras «^» indican un exponente no admitido (E-EXP-07). */
const INICIA_OPERANDO = new Set([MAS, MENOS, NUMERO, X, ABRE]);

/** Error de análisis; solo circula dentro de este módulo. */
class FalloSintaxis extends Error {
  constructor(error) {
    super(error.mensaje);
    this.error = error;
  }
}

const fallo = (codigo, posicion, datos = {}) => new FalloSintaxis(crearError(codigo, { ...datos, posicion }));
const nodo = (campos) => Object.freeze(campos);
const nodoNumero = (f) => nodo({ tipo: 'numero', valor: f.texto, posicion: f.posicion });
const esEntero = (f) => f.tipo === NUMERO && !f.texto.includes('.');
const exito = (valor) => Object.freeze({ ok: true, valor, advertencias: Object.freeze([]) });
const fracaso = (error) => Object.freeze({ ok: false, errores: Object.freeze([error]) });

/** Recorre las fichas y lleva la profundidad de paréntesis. */
class Lector {
  constructor(fichas) {
    this.fichas = fichas;
    this.indice = 0;
    this.profundidad = 0;
    const ultima = fichas[fichas.length - 1];
    this.posicionFinal = ultima.posicion + ultima.texto.length;
  }

  /** Ficha actual, o null al final. */
  actual() {
    return this.indice < this.fichas.length ? this.fichas[this.indice] : null;
  }

  /** Ficha actual; al final, E-EXP-02 en la posición siguiente a la última ficha. */
  exigir() {
    const f = this.actual();
    if (f === null) throw fallo('E-EXP-02', this.posicionFinal);
    return f;
  }

  es(tipo) {
    const f = this.actual();
    return f !== null && f.tipo === tipo;
  }

  anterior() {
    return this.fichas[this.indice - 1];
  }

  avanzar() {
    const f = this.exigir();
    this.indice += 1;
    return f;
  }

  /** Consume «(»; más de LIMITES.profundidad niveles abiertos → E-EXP-11. */
  abrir() {
    const f = this.avanzar();
    this.profundidad += 1;
    if (this.profundidad > LIMITES.profundidad) throw fallo('E-EXP-11', f.posicion, { limite: 'profundidad' });
  }

  /** Consume «)»; cualquier otra ficha es el `codigo` indicado. */
  cerrar(codigo) {
    const f = this.exigir();
    if (f.tipo !== CIERRA) throw fallo(codigo, f.posicion);
    this.indice += 1;
    this.profundidad -= 1;
  }
}

/** expresion = termino { ("+" | "-") termino } */
function expresion(lector) {
  let izq = termino(lector);
  while (lector.es(MAS) || lector.es(MENOS)) {
    const operador = lector.avanzar();
    const der = termino(lector);
    izq = nodo({ tipo: operador.tipo === MAS ? 'suma' : 'resta', izq, der, posicion: operador.posicion });
  }
  return izq;
}

/** termino = unario { ("*" | "/") unario | implicito } */
function termino(lector) {
  let izq = unario(lector);
  for (;;) {
    const siguiente = lector.actual();
    if (siguiente === null) return izq;
    if (siguiente.tipo === POR || siguiente.tipo === ENTRE) {
      lector.avanzar();
      const der = unario(lector);
      izq = siguiente.tipo === POR
        ? nodo({ tipo: 'producto', izq, der, implicito: false, posicion: siguiente.posicion })
        : nodo({ tipo: 'division', izq, der, posicion: siguiente.posicion });
    } else if (INICIA_FACTOR.has(siguiente.tipo)) {
      const admitidas = PRODUCTO_IMPLICITO.get(lector.anterior().tipo);
      if (admitidas === undefined || !admitidas.has(siguiente.tipo)) throw fallo('E-EXP-02', siguiente.posicion);
      const der = potencia(lector);
      izq = nodo({ tipo: 'producto', izq, der, implicito: true, posicion: siguiente.posicion });
    } else {
      return izq;
    }
  }
}

/** unario = ("+" | "-") unario | potencia */
function unario(lector) {
  if (lector.es(MAS) || lector.es(MENOS)) {
    const signo = lector.avanzar();
    const arg = unario(lector);
    return signo.tipo === MENOS ? nodo({ tipo: 'negacion', arg, posicion: signo.posicion }) : arg;
  }
  return potencia(lector);
}

/** potencia = primario [ "^" exponente ]; otro «^» justo después → E-EXP-07. */
function potencia(lector) {
  const base = primario(lector);
  if (!lector.es(POTENCIA)) return base;
  const operador = lector.avanzar();
  const exponente = exponenteEntero(lector);
  if (lector.es(POTENCIA)) throw fallo('E-EXP-07', lector.actual().posicion);
  return nodo({ tipo: 'potencia', base, exponente, posicion: operador.posicion });
}

/**
 * exponente = ENTERO | "(" ENTERO ")". Un signo, un decimal, x, una fracción o
 * cualquier otra expresión → E-EXP-07; un final prematuro o una ficha que no
 * puede empezar un operando (x^, x^*2, x^()) → E-EXP-02.
 */
function exponenteEntero(lector) {
  const siguiente = lector.exigir();
  if (esEntero(siguiente)) {
    lector.avanzar();
    return nodoNumero(siguiente);
  }
  if (siguiente.tipo !== ABRE) {
    throw fallo(INICIA_OPERANDO.has(siguiente.tipo) ? 'E-EXP-07' : 'E-EXP-02', siguiente.posicion);
  }
  lector.abrir();
  const dentro = lector.exigir();
  if (!esEntero(dentro)) throw fallo(INICIA_OPERANDO.has(dentro.tipo) ? 'E-EXP-07' : 'E-EXP-02', dentro.posicion);
  lector.avanzar();
  lector.cerrar('E-EXP-07'); // x^(1/2), x^(2+1)
  return nodoNumero(dentro);
}

/** primario = NUMERO | X | "(" expresion ")" */
function primario(lector) {
  const siguiente = lector.exigir();
  if (siguiente.tipo === NUMERO) {
    lector.avanzar();
    return nodoNumero(siguiente);
  }
  if (siguiente.tipo === X) {
    lector.avanzar();
    return nodo({ tipo: 'x', posicion: siguiente.posicion });
  }
  if (siguiente.tipo === ABRE) {
    lector.abrir();
    const dentro = expresion(lector);
    lector.cerrar('E-EXP-02');
    return dentro;
  }
  throw fallo('E-EXP-02', siguiente.posicion);
}

/**
 * Fichas de analizarLexico → árbol de la expresión, o el primer error.
 * @param {ReadonlyArray<Ficha>} fichas
 * @returns {Readonly<ResultadoSintaxis>}
 */
export function analizarSintaxis(fichas) {
  if (!Array.isArray(fichas)) throw new TypeError('sintaxis: analizarSintaxis espera las fichas de analizarLexico');
  if (fichas.length === 0) return fracaso(crearError('E-EXP-01'));
  const lector = new Lector(fichas);
  try {
    const arbol = expresion(lector);
    const sobrante = lector.actual(); // solo puede ser un «)» sin abrir
    if (sobrante !== null) throw fallo('E-EXP-02', sobrante.posicion);
    return exito(arbol);
  } catch (e) {
    if (e instanceof FalloSintaxis) return fracaso(e.error);
    throw e;
  }
}

/**
 * Texto de la función → árbol: análisis léxico y después sintáctico, con el
 * primer error de cualquiera de los dos.
 * @param {string} texto
 * @returns {Readonly<ResultadoSintaxis>}
 */
export function analizarExpresion(texto) {
  const lexico = analizarLexico(texto);
  return lexico.ok ? analizarSintaxis(lexico.valor) : lexico;
}
