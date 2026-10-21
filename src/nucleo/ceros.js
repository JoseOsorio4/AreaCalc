// Análisis de ceros y signos de ÁreaCalc (design.md §8), la parte de mayor riesgo.
//
// analizarSigno(f, a, b) decide de forma exacta, sin coma flotante, si f cambia
// de signo en (a, b) y si f ≥ 0 en [a, b]; localiza los ceros (exactos si son
// racionales, con intervalo si son irracionales) y los clasifica. Sigue los
// pasos 1 a 8 de design §8:
//   1. f ≡ 0;  2. coeficiente A de la parte primitiva;  3. raíces múltiples con
//   mcd(f, f′);  4. ceros en los extremos;  5. raíces restantes con Sturm,
//   bisección y prueba de racionalidad;  6. presupuesto de 200 bisecciones;
//   7. clasificación;  8. tramos y signo.
// Solo admite el grado ≤ 3 de la familia del MVP, porque el paso 3 depende de ello.
import * as racional from './racional.js';
import * as polinomio from './polinomio.js';

/** Profundidad máxima de bisección a partir de [a, b], compartida por todo el análisis. */
export const PROFUNDIDAD_MAXIMA = 200;

/** Tolerancia de la aproximación: ancho en x y cota del área (requirements §12). */
const TOLERANCIA = racional.fraccion(1n, 10n ** 12n);
const UNO = racional.entero(1n);
const DOS = racional.entero(2n);
/** Puntos de prueba dentro de un tramo; f tiene a lo sumo 3 raíces, así que alguno sirve. */
const FRACCIONES_PRUEBA = [[1n, 2n], [1n, 3n], [2n, 3n], [1n, 4n], [3n, 4n]]
  .map(([n, d]) => racional.fraccion(n, d));

/**
 * Presupuesto agotado antes de saber si cada raíz es racional (E-SIS-01, R-21.3).
 * El caso de uso la convierte en E-SIS-01 y descarta todo lo calculado.
 */
export class PresupuestoAgotado extends Error {
  constructor(fase) {
    super(`ceros: se agotaron las ${PROFUNDIDAD_MAXIMA} bisecciones durante ${fase}`);
    this.name = 'PresupuestoAgotado';
    this.codigo = 'E-SIS-01';
  }
}

/** Error de programación (E-SIS-02): nunca debería ocurrir. */
function errorInterno(mensaje) {
  const error = new Error(`ceros: ${mensaje}`);
  error.codigo = 'E-SIS-02';
  return error;
}

/**
 * @typedef {import('./racional.js').Racional} Racional
 * @typedef {import('./polinomio.js').Polinomio} Polinomio
 * @typedef {Object} Cero
 * @property {boolean} exacto Si es falso, la raíz es irracional (demostrado, paso 5.4).
 * @property {Racional} valor Valor exacto o representante de su intervalo.
 * @property {[Racional, Racional] | null} intervalo Intervalo de la raíz aproximada.
 * @property {1 | 2 | 3} multiplicidad Multiplicidad en el f original.
 * @property {'cambio-signo' | 'tangencia' | 'extremo'} tipo
 * @typedef {Object} Tramo
 * @property {Racional} desde Extremo exacto o representante de un cero aproximado.
 * @property {Racional} hasta
 * @property {1 | -1 | 0} signo
 * @property {boolean} desdeExacto
 * @property {boolean} hastaExacto
 * @typedef {Object} AnalisisSigno
 * @property {boolean} identicamenteCero f ≡ 0 (W-09).
 * @property {ReadonlyArray<Cero>} ceros Todos los ceros de [a, b], de menor a mayor.
 * @property {ReadonlyArray<Tramo>} tramos
 * @property {boolean} cambiaSigno Hay ceros interiores de multiplicidad impar.
 * @property {boolean} noNegativa f(x) ≥ 0 en todo [a, b], decidido de forma exacta.
 * @property {boolean} hayAproximaciones Algún corte es aproximado (W-04).
 */

/** mcd de dos enteros BigInt, siempre ≥ 0n. */
function mcdEnteros(a, b) {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
}

/**
 * Paso 2: A = |coeficiente principal de la parte primitiva de f|. Por el teorema
 * de las raíces racionales, A·r es entero para toda raíz racional r de f
 * (formulario §2.1, punto 5). f no puede ser el polinomio cero.
 * @param {Polinomio} f
 * @returns {bigint}
 */
export function coeficienteA(f) {
  if (polinomio.esCero(f)) throw new RangeError('ceros: el polinomio cero no tiene coeficiente A');
  const L = f.coef.reduce((m, c) => (m / mcdEnteros(m, c.den)) * c.den, 1n); // mcm de los denominadores
  const enteros = f.coef.map((c) => c.num * (L / c.den));
  const divisor = enteros.reduce((m, n) => mcdEnteros(m, n), 0n);
  const principal = enteros[enteros.length - 1] / divisor;
  return principal < 0n ? -principal : principal;
}

/** ⌊r⌋ de un racional, como BigInt. */
function piso(r) {
  const cociente = r.num / r.den; // BigInt trunca hacia 0
  return r.num < 0n && cociente * r.den !== r.num ? cociente - 1n : cociente;
}

const medio = (l, h) => racional.dividir(racional.sumar(l, h), DOS);
/** El polinomio x − r. */
const lineal = (r) => polinomio.desdeCoeficientes([racional.negar(r), UNO]);

/** p / d cuando la división debe ser exacta; un resto distinto de 0 es un error interno. */
function dividirExacta(p, d) {
  const { cociente, resto } = polinomio.dividirConResto(p, d);
  if (!polinomio.esCero(resto)) throw errorInterno('una división que debía ser exacta dejó resto');
  return cociente;
}

/**
 * Cota del error del área por cortar en el punto medio de [l, h] (design §9;
 * formulario §2.1, punto 4): M₁·δ², con δ = (h − l)/2 y
 * M₁ = Σ |k·cₖ|·máx(|l|, |h|)^(k−1), una cota de |f′| en [l, h]. Es exacta.
 * area.js debe reutilizarla para no calcularla en dos lugares.
 * @param {Polinomio} f
 * @param {Racional} l
 * @param {Racional} h
 * @returns {Racional}
 */
export function cotaCorte(f, l, h) {
  polinomio.grado(f); // valida f
  const radio = racional.comparar(racional.abs(l), racional.abs(h)) >= 0 ? racional.abs(l) : racional.abs(h);
  let m1 = racional.entero(0n);
  for (let k = 1; k < f.coef.length; k += 1) {
    const derivadaK = racional.abs(racional.multiplicar(racional.entero(k), f.coef[k]));
    m1 = racional.sumar(m1, racional.multiplicar(derivadaK, racional.potencia(radio, k - 1)));
  }
  const delta = racional.dividir(racional.restar(h, l), DOS);
  return racional.multiplicar(m1, racional.multiplicar(delta, delta));
}

/** Sucesión de Sturm: p₀ = q, p₁ = q′ y pₖ₊₁ = −resto(pₖ₋₁, pₖ) (formulario §2.1, punto 2). */
function sucesionSturm(q) {
  const sucesion = [q, polinomio.derivar(q)];
  for (;;) {
    const anterior = sucesion[sucesion.length - 2];
    const ultimo = sucesion[sucesion.length - 1];
    const { resto } = polinomio.dividirConResto(anterior, ultimo);
    if (polinomio.esCero(resto)) return sucesion;
    sucesion.push(polinomio.escalar(resto, racional.entero(-1n)));
  }
}

/** Cambios de signo de la sucesión evaluada en t, sin contar los ceros. */
function cambiosDeSigno(sucesion, t) {
  const signos = sucesion.map((p) => racional.signo(polinomio.evaluar(p, t))).filter((s) => s !== 0);
  let cambios = 0;
  for (let i = 1; i < signos.length; i += 1) if (signos[i] !== signos[i - 1]) cambios += 1;
  return cambios;
}

/** Raíces distintas de q en (l, h), si q(l) ≠ 0 y q(h) ≠ 0 (teorema de Sturm). */
const contarRaices = (sucesion, l, h) => cambiosDeSigno(sucesion, l) - cambiosDeSigno(sucesion, h);

/**
 * Registro único de raíces exactas (design §8, paso 3). Cada raíz entra una sola
 * vez, con su multiplicidad en el f original; un segundo registro es un error de
 * programación (E-SIS-02) y nunca sobrescribe la multiplicidad. Aquí se aplica la
 * clasificación del paso 7. Se exporta para probar la regla del registro único.
 * @param {Racional} a
 * @param {Racional} b
 */
export function crearRegistro(a, b) {
  const ceros = [];
  const claves = new Set();
  return {
    ceros,
    /** @param {Racional} valor @param {1 | 2 | 3} multiplicidad */
    registrar(valor, multiplicidad) {
      const clave = racional.aTexto(valor);
      if (claves.has(clave)) throw errorInterno(`la raíz ${clave} se registró dos veces`);
      claves.add(clave);
      const enExtremo = racional.comparar(valor, a) === 0 || racional.comparar(valor, b) === 0;
      // Paso 7: los extremos no dividen; impar cambia de signo; par es tangencia (W-02).
      let tipo = 'tangencia';
      if (enExtremo) tipo = 'extremo';
      else if (multiplicidad % 2 === 1) tipo = 'cambio-signo';
      ceros.push(Object.freeze({ exacto: true, valor, intervalo: null, multiplicidad, tipo }));
    }
  };
}

/**
 * Pasos 5.4 y 5.5 para [l, h] con una sola raíz de q, y q(l), q(h) ≠ 0.
 * Devuelve { exacta } si la raíz es racional, o { aproximado } con un Cero
 * aproximado si quedó demostrado que es irracional.
 */
function resolverIntervalo(q, f, A, l0, h0, profundidad0) {
  let l = l0;
  let h = h0;
  let profundidad = profundidad0;
  const signoIzquierda = racional.signo(polinomio.evaluar(q, l));
  // Biseca conservando el cambio de signo (Bolzano); devuelve el punto medio si es raíz.
  const bisecar = () => {
    const m = medio(l, h);
    const s = racional.signo(polinomio.evaluar(q, m));
    if (s === 0) return m;
    if (s === signoIzquierda) l = m;
    else h = m;
    profundidad += 1;
    return null;
  };
  // 5.4: prueba de racionalidad. Se biseca hasta que h − l < 1/A.
  const umbral = racional.fraccion(1n, A);
  while (racional.comparar(racional.restar(h, l), umbral) >= 0) {
    if (profundidad >= PROFUNDIDAD_MAXIMA) throw new PresupuestoAgotado('la prueba de racionalidad');
    const raiz = bisecar();
    if (raiz) return { exacta: raiz };
  }
  // (A·l, A·h) mide menos de 1, así que contiene a lo sumo el entero k = ⌊A·l⌋ + 1.
  const enteroA = racional.entero(A);
  const k = piso(racional.multiplicar(enteroA, l)) + 1n;
  if (racional.comparar(racional.entero(k), racional.multiplicar(enteroA, h)) < 0) {
    const candidato = racional.fraccion(k, A);
    if (racional.esCero(polinomio.evaluar(q, candidato))) return { exacta: candidato };
  }
  // Queda demostrado que la raíz es irracional. 5.5: aproximación hasta que el ancho
  // y la cota del área sean ≤ 10⁻¹², o hasta la profundidad máxima (W-04 con la cota).
  const cumpleTolerancia = () => racional.comparar(racional.restar(h, l), TOLERANCIA) <= 0
    && racional.comparar(cotaCorte(f, l, h), TOLERANCIA) <= 0;
  while (profundidad < PROFUNDIDAD_MAXIMA && !cumpleTolerancia()) {
    if (bisecar()) throw errorInterno('una raíz demostrada irracional resultó racional');
  }
  const intervalo = Object.freeze([l, h]);
  return {
    aproximado: Object.freeze({ exacto: false, valor: medio(l, h), intervalo, multiplicidad: 1, tipo: 'cambio-signo' })
  };
}

/**
 * 5.2 y 5.3: cuenta con Sturm y aísla con bisección desde [a, b]. Se detiene en
 * la primera raíz exacta que encuentra; si no hay ninguna, devuelve las aproximadas.
 */
function recorrerConSturm(q, f, a, b, A) {
  const sturm = sucesionSturm(q);
  const pendientes = [{ l: a, h: b, profundidad: 0 }];
  const aproximados = [];
  while (pendientes.length > 0) {
    const { l, h, profundidad } = pendientes.pop();
    const n = contarRaices(sturm, l, h);
    if (n === 0) continue;
    if (n === 1) {
      const resuelto = resolverIntervalo(q, f, A, l, h, profundidad);
      if (resuelto.exacta) return { exacta: resuelto.exacta };
      aproximados.push(resuelto.aproximado);
      continue;
    }
    if (profundidad >= PROFUNDIDAD_MAXIMA) throw new PresupuestoAgotado('el aislamiento de las raíces');
    const m = medio(l, h);
    if (racional.esCero(polinomio.evaluar(q, m))) return { exacta: m };
    // Primero se resuelve la mitad izquierda; el orden final lo fija analizarSigno.
    pendientes.push({ l: m, h, profundidad: profundidad + 1 }, { l, h: m, profundidad: profundidad + 1 });
  }
  return { aproximados };
}

/**
 * Paso 5: raíces de q en (a, b), con q sin raíces repetidas y q(a), q(b) ≠ 0.
 * Registra las exactas y devuelve las aproximadas. Cada raíz exacta divide q y
 * reinicia el paso desde [a, b]; las aproximadas de esa pasada se descartan y se
 * vuelven a encontrar, así que ninguna aparece dos veces.
 */
function raicesRestantes(q0, f, a, b, A, registro) {
  let q = q0;
  for (;;) {
    const grado = polinomio.grado(q);
    if (grado <= 0) return [];
    if (grado === 1) {
      // 5.1: en grado 1 la raíz es −q₀/q₁, exacta.
      const r = racional.dividir(racional.negar(q.coef[0]), q.coef[1]);
      if (racional.comparar(a, r) < 0 && racional.comparar(r, b) < 0) registro.registrar(r, 1);
      return [];
    }
    const resultado = recorrerConSturm(q, f, a, b, A);
    if (!resultado.exacta) return resultado.aproximados;
    registro.registrar(resultado.exacta, 1);
    q = dividirExacta(q, lineal(resultado.exacta));
  }
}

/**
 * Paso 8: signo de f en un tramo, evaluando de forma exacta en un punto interior
 * de (izquierda, derecha) que no sea raíz.
 */
function signoEnTramo(f, izquierda, derecha) {
  if (racional.comparar(izquierda, derecha) < 0) {
    const ancho = racional.restar(derecha, izquierda);
    for (const t of FRACCIONES_PRUEBA) {
      const s = racional.signo(polinomio.evaluar(f, racional.sumar(izquierda, racional.multiplicar(ancho, t))));
      if (s !== 0) return s;
    }
  } else {
    // Dos intervalos de raíces aproximadas que se tocan: el punto común no es raíz de q.
    const s = racional.signo(polinomio.evaluar(f, izquierda));
    if (s !== 0) return s;
  }
  throw errorInterno('no se encontró un punto del tramo que no fuera raíz');
}

/**
 * Paso 8: los cortes son los ceros que cambian de signo. Cada tramo se evalúa
 * entre el borde superior del corte anterior y el inferior del siguiente, así
 * que un corte aproximado nunca hace evaluar del lado equivocado de la raíz.
 */
function construirTramos(f, a, b, ceros) {
  const borde = (valor) => ({ valor, exacto: true, inferior: valor, superior: valor });
  const cortes = ceros.filter((c) => c.tipo === 'cambio-signo').map((c) => (c.exacto
    ? borde(c.valor)
    : { valor: c.valor, exacto: false, inferior: c.intervalo[0], superior: c.intervalo[1] }));
  const puntos = [borde(a), ...cortes, borde(b)];
  const tramos = [];
  for (let i = 0; i + 1 < puntos.length; i += 1) {
    const desde = puntos[i];
    const hasta = puntos[i + 1];
    tramos.push(Object.freeze({
      desde: desde.valor,
      hasta: hasta.valor,
      signo: signoEnTramo(f, desde.superior, hasta.inferior),
      desdeExacto: desde.exacto,
      hastaExacto: hasta.exacto
    }));
  }
  return tramos;
}

/**
 * Análisis exacto de signo y ceros de f en [a, b] (design §8).
 * Lanza PresupuestoAgotado (E-SIS-01) si se agotan las 200 bisecciones antes de
 * saber si cada raíz es racional: nunca devuelve un resultado parcial ni marca
 * como aproximada una raíz cuya irracionalidad no está demostrada.
 * @param {Polinomio} f Grado ≤ 3.
 * @param {Racional} a
 * @param {Racional} b Con a < b.
 * @returns {AnalisisSigno}
 */
export function analizarSigno(f, a, b) {
  if (polinomio.grado(f) > 3) throw new RangeError('ceros: el análisis admite grado ≤ 3 (design §8)');
  if (racional.comparar(a, b) >= 0) throw new RangeError('ceros: se esperaba a < b');
  // Paso 1: f ≡ 0 (W-09); no se listan ceros (R-05.5).
  if (polinomio.esCero(f)) {
    const tramo = Object.freeze({ desde: a, hasta: b, signo: 0, desdeExacto: true, hastaExacto: true });
    return Object.freeze({
      identicamenteCero: true, ceros: Object.freeze([]), tramos: Object.freeze([tramo]),
      cambiaSigno: false, noNegativa: true, hayAproximaciones: false
    });
  }
  const A = coeficienteA(f); // paso 2
  const registro = crearRegistro(a, b);
  let q = f;
  // Paso 3: raíces múltiples con g = mcd(f, f′), mónico; en grado ≤ 3 son racionales.
  const g = polinomio.mcd(f, polinomio.derivar(f));
  const gradoG = polinomio.grado(g);
  if (gradoG >= 1) {
    // g = x − r: raíz doble.  g = (x − r)² = x² − 2r·x + r²: raíz triple.
    const r = gradoG === 1 ? racional.negar(g.coef[0]) : racional.dividir(racional.negar(g.coef[1]), DOS);
    const multiplicidad = gradoG + 1;
    if (racional.comparar(a, r) <= 0 && racional.comparar(r, b) <= 0) registro.registrar(r, multiplicidad);
    q = dividirExacta(q, polinomio.potencia(lineal(r), multiplicidad));
  }
  // Paso 4: ceros simples en los extremos (W-03); después q(a) ≠ 0 y q(b) ≠ 0.
  for (const extremo of [a, b]) {
    if (racional.esCero(polinomio.evaluar(q, extremo))) {
      registro.registrar(extremo, 1);
      q = dividirExacta(q, lineal(extremo));
    }
  }
  // Pasos 5 y 6: raíces restantes, con el presupuesto compartido.
  const aproximados = raicesRestantes(q, f, a, b, A, registro);
  // Paso 8 (la clasificación del paso 7 la hace el registro).
  const ceros = [...registro.ceros, ...aproximados].sort((x, y) => racional.comparar(x.valor, y.valor));
  const tramos = construirTramos(f, a, b, ceros);
  return Object.freeze({
    identicamenteCero: false,
    ceros: Object.freeze(ceros),
    tramos: Object.freeze(tramos),
    cambiaSigno: tramos.length >= 2,
    noNegativa: tramos.every((t) => t.signo >= 0),
    hayAproximaciones: ceros.some((c) => !c.exacto)
  });
}
