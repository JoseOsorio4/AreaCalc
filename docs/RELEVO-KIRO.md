# Relevo de ÁreaCalc para un chat o cuenta nuevos de Kiro

Este documento permite continuar sin el historial anterior. Si algo de aquí contradice las especificaciones, prevalecen las especificaciones y hay que avisar al equipo.

## 1. Qué es ÁreaCalc

Aplicación web estática para el curso de Cálculo Integral. Analiza un perfil y = f(x) en [a, b]: integral con signo, área geométrica, valor promedio, rectángulo equivalente, gráfica y procedimiento paso a paso. Además, calcula áreas de figuras y da una estimación teórica de material y costo. La exposición es el 31 de octubre de 2026, en una laptop Windows **sin internet** (requirements C-04).

**Alcance vigente del MVP** (requirements §6 y §9):

- polinomios en x de grado ≤ 3 con coeficientes racionales, escritos con la gramática de la Tabla 9.1;
- tres secciones: **Perfil**, **Figuras** (rectángulo, triángulo y círculo; el trapecio es DESEABLE) y **Estimación** de material;
- aritmética racional exacta; solo se redondea al presentar.

**Fuera del MVP:** terrenos y topografía, área entre dos curvas (el ejemplo de clase es solo una referencia), centroides (R-27, POSTERIOR), comparación numérica (R-28, POSTERIOR), volúmenes, integrales impropias, cortes o compra de material, fotografías y backend. Los rótulos, paneles y paredes de los ejemplos son el mismo problema geométrico; no justifican motores separados (requirements §3 y §7).

**Tecnologías:** Vite 8.3.4, Vitest 5.0.5, `plotly.js-basic-dist-min` 4.1.2 y `katex` 0.19.0, con Node 24.22.0. Son las únicas dependencias permitidas (AGENTS.md). Sin React, TypeScript, Math.js ni CDN. El analizador de expresiones es propio (design §5).

## 2. Dónde está el trabajo

- Repositorio: `https://github.com/JoseOsorio4/AreaCalc`.
- Rama: **`avance-t04`**. El nombre es histórico: empezó como respaldo de T-04 y ya contiene T-01 a T-13.
- Último trabajo: el commit «T-13: estado e invalidación con pruebas», encima de `ac0569c` (T-12). Para ver los SHA: `git log --oneline -n 5`.
- `main` solo tiene el primer commit; no se ha hecho merge.

## 3. Estado de las tareas

| Tarea | Estado | Commit |
|---|---|---|
| T-01 Base del proyecto | Completada | `a2cde5c` y `bc08e42` |
| T-02 Racionales y casos de referencia | Implementada y probada | `bc08e42` |
| T-03 Polinomios | Implementada y probada | `bc08e42` |
| T-04 Ceros y signos | Implementada y probada | `bc08e42` |
| T-05 Integral y promedio | Implementada y probada | `d3bffdf` |
| T-06 Área geométrica | Implementada y probada | `e22ec7f` |
| T-07 Números, errores, unidades, materiales y figuras | Implementada y probada | `ea16afd` |
| T-08 Casos de uso y pruebas globales | Implementada y probada; `pasos` y `grafica` quedan en `null` (§6) | `21f7c08` |
| T-09 Analizador léxico y sintáctico | Implementada y probada | `dac0250` |
| T-10 Normalización al modelo validado | Implementada y probada | `bfa956e` |
| T-11 Formato de números y fórmulas | Implementada y probada | `9efdfb9` |
| T-12 Procedimientos paso a paso | Implementada y probada; aún no conectada a los casos de uso (T-17) | `ac0569c` |
| T-13 Estado e invalidación | Implementada y probada; el catálogo de ejemplos llega como argumento hasta T-16 | commit «T-13: …» |
| T-14 en adelante | Sin iniciar | — |

Última ejecución, con T-13: `npm test` dio **1155/1155** pruebas en 23 archivos, con código de salida 0, y `npm run build` fue correcto, también con código 0 (solo el aviso esperado por el tamaño de Plotly, design §13). T-13 añadió 42 pruebas de estado y navegación.

**La revisión independiente de R no se ha hecho** para T-02 a T-13: T-R1 y T-R6 siguen pendientes. Implementada no equivale a revisada (tasks.md §0).

## 4. Mapa de archivos

**Especificaciones** (leerlas antes de cada tarea):

- `.kiro/specs/areacalc/requirements.md`: requisitos R-01 a R-28, catálogo de errores (§10) y casos CR (§14).
- `.kiro/specs/areacalc/design.md`: arquitectura (§2), contratos (§6 a §10), interfaz (§14), pruebas (§15) y riesgos (§16).
- `.kiro/specs/areacalc/tasks.md`: plan, calendario y criterios de cada tarea.
- `docs/formulario-matematico.md`: fuente canónica de fórmulas y procedimientos del curso.
- `AGENTS.md`: reglas de trabajo para el asistente.

**Núcleo** (`src/nucleo/`, funciones puras, sin DOM):

| Archivo | Contenido |
|---|---|
| `racional.js` | Fracciones exactas con BigInt |
| `polinomio.js` | Polinomios con coeficientes racionales |
| `ceros.js` | Análisis de ceros y signos (Sturm, bisección, prueba de racionalidad) |
| `integral.js` | Antiderivada e integral definida con desglose |
| `promedio.js` | Valor promedio y rectángulo equivalente |
| `area.js` | Área geométrica por tramos y cota de error |
| `errores.js` | Catálogo de errores y advertencias de requirements §10 |
| `numeros.js` | Texto de un campo → Racional exacto, y el intervalo [a, b] |
| `unidades.js` | Unidades por interpretación y conversión cm² → m² |
| `geometria.js` | Rectángulo, triángulo y círculo (k·π) |
| `materiales.js` | Área estimada, costo base y costo estimado |

**Expresiones** (`src/expresiones/`, carpeta de B; solo importa `nucleo/`):

| Archivo | Contenido |
|---|---|
| `lexico.js` | Texto de la función → fichas `{ tipo, texto, posicion }`, con los pasos 1 a 6 de design §5.2 |
| `sintaxis.js` | Fichas → árbol, por descenso recursivo (design §5.3); `analizarExpresion(texto)` hace léxico y sintaxis |
| `normalizar.js` | Árbol → polinomio de grado ≤ 3 (design §5.4); `interpretarFuncion(texto)` → `ModeloValidado` (design §10) |

**Casos de uso** (`src/casos-de-uso/`, carpeta de A; importan `nucleo/` y `expresiones/`; nunca lanzan excepciones):

| Archivo | Contenido |
|---|---|
| `analizarPerfil.js` | Valida función, a y b por separado; integral, ceros, área, promedio, rectángulo, aptitud y advertencias |
| `calcularFigura.js` | Valida las dimensiones según la unidad; área exacta o k·π, y su conversión a m² |
| `estimarMaterial.js` | Fuente apta, precio y adicional → área estimada y costos exactos, con los supuestos |
| `comun.js` | `exito`, `fracaso` y `protegido`, que convierte las excepciones en E-SIS-01 o E-SIS-02 (archivo añadido a design §3) |

**Presentación** (`src/presentacion/`, carpeta de B; solo importa `nucleo/`; sin DOM):

| Archivo | Contenido |
|---|---|
| `formato.js` | Único lugar donde se redondea: decimales con «=» o «≈», quetzales, fracciones, sustituciones, monomios, polinomios, k·π, cotas y cantidades con unidad, en texto y LaTeX (design §14.1) |

| `pasos.js` | Procedimientos (design §14.2): `pasosArea`, `pasosPromedio`, `pasosPerfil`, `pasosFigura` y `pasosEstimacion`; solo formatea los datos del núcleo con `formato.js` |

`datosGrafica.js` (T-15) todavía no existe.

**Interfaz** (`src/interfaz/`, carpeta de B; importa `casos-de-uso/`; las vistas son de T-14):

| Archivo | Contenido |
|---|---|
| `estado.js` | Estado en memoria y transiciones puras, con invalidación (design §12) |
| `navegacion.js` | Sección según el fragmento de la URL (`#perfil`, `#figuras`, `#estimacion`); la ventana se recibe como argumento |

**Pruebas** (`tests/`): `casos-referencia.js` (valores esperados transcritos, sin importar `src/`), `aritmetica-independiente.js` (aritmética exacta propia de las pruebas, sin importar `src/`), `arquitectura.test.js` (versión completa de T-08), `propiedades.test.js` (T-04 y T-08), `casos-de-uso/` con una prueba por caso de uso y una de robustez, `presentacion/formato.test.js` y `presentacion/pasos.test.js`, `interfaz/estado.test.js` (estado y navegación), `nucleo/` con una prueba por módulo y `expresiones/` con `lexico.test.js`, `sintaxis.test.js`, `normalizar.test.js` y `tabla-gramatica.js`. Esta última es la **tabla reconstruida para pruebas** de T-10 (60 entradas válidas y 84 inválidas, cada una con su fuente); no procede del prototipo de design §0.

**Otros:** `index.html` y `src/main.js` son mínimos y vacíos. `prueba-recursos.html` y `src/prueba-recursos.js` son temporales de T-01 y se eliminan en T-17. `scripts/verificar-dist.js` comprueba que `dist/` no use recursos externos.

## 5. Contratos clave ya implementados

- **Racional** (`racional.js`): objeto congelado `{ num, den }` de BigInt, con `den > 0n`, fracción irreducible y cero = `{ num: 0n, den: 1n }` (sin «−0»). `desdeDecimal('0.1')` da 1/10 exacto, sin `Number`. Denominador o divisor cero lanza `RangeError`. `aNumber` es solo para dibujar.
- **Polinomio** (`polinomio.js`): `{ coef }` congelado, con `coef[k]` el coeficiente de xᵏ, sin ceros finales; el polinomio cero es `coef = []`, grado −1. Incluye `dividirConResto`, `mcd` mónico, `evaluar` (Horner exacto) y `evaluarAprox` (solo gráfica).
- **Ceros y signos** (`ceros.js`): `analizarSigno(f, a, b)` con grado ≤ 3 y a < b devuelve `AnalisisSigno` (design §8): `ceros` (exactos, o aproximados con intervalo y representante), `tramos` con su signo, `cambiaSigno`, `noNegativa` y `hayAproximaciones`. Los signos se deciden sin coma flotante; toda raíz racional sale exacta; cada raíz se registra una vez con su multiplicidad. Presupuesto de 200 bisecciones compartido: si se agota antes de saber si una raíz es racional, lanza `PresupuestoAgotado` (código E-SIS-01). Los errores de programación llevan `codigo: 'E-SIS-02'`.
- **Integral con signo** (`integral.js`): `integrarDefinida(p, a, b)` devuelve `antiderivada` (F con F(0) = 0, sin «+C»), `terminos` (`coefOriginal`, `potencia`, `coefAntiderivada`, `valorEnB`, `valorEnA`), `Fb`, `Fa` e `I = Fb − Fa`, todo exacto.
- **Promedio** (`promedio.js`): `valorPromedio(I, a, b)` reutiliza I y devuelve `{ longitud, fProm }`. I = (b − a)·fProm exactamente.
- **Rectángulo equivalente** (`promedio.js`): `rectanguloEquivalente(analisis, fProm, a, b)` devuelve `{ rectangulo: { base, altura, area } | null, motivo: string | null }`; solo hay rectángulo si `analisis.noNegativa`, y si no, `motivo` vale `'requiere-f-no-negativa'` (design §7 y §10).
- **Área geométrica** (`area.js`): `areaGeometrica(integral, analisis)` suma |F(hasta) − F(desde)| por tramo; nunca usa |I|. Devuelve `tramos`, `area` (`{ clase: 'exacta', valor }` o `{ clase: 'aproximada', valor, cota, motivo: 'ceros-irracionales' }`) e `igualAI`. Si A_geo < |I|, error E-SIS-02.
- **Cota de cortes irracionales:** `ceros.cotaCorte(f, l, h)` = M₁·δ² (formulario §2.1, punto 4) es el único lugar de la fórmula; `area.js` suma esa cota sobre los ceros aproximados. La bisección se detiene con ancho ≤ 10⁻¹² y cota ≤ 10⁻¹², o a la profundidad 200 (entonces W-04 con la cota obtenida, como CR-36).
- Las advertencias W-01 a W-04 y W-09 se deducen de estos campos; las genera `analizarPerfil` (T-08).
- **Errores** (`errores.js`): `CATALOGO` tiene exactamente los 28 errores y las 9 advertencias de requirements §10. `crearError(codigo, datos)` devuelve `{ codigo, campo, mensaje, sugerencia, posicion, datos }` y `crearAdvertencia(codigo, datos)`, `{ codigo, mensaje, datos }`; los datos se insertan como texto. Un código desconocido o un dato que falta para la plantilla es un error de programación.
- **Números** (`numeros.js`): `leerNumero(texto, reglas)` sigue los 7 pasos de design §11 sin `Number(texto)` y devuelve `Resultado`: `{ ok: true, valor, advertencias }` o `{ ok: false, errores }`. `REGLAS` (limite, dimensionM, dimensionCm, precio, adicional) transcribe la Tabla 9.3, y `conCampo` les pone el campo y la etiqueta. `leerIntervalo(textoA, textoB)` acumula los errores de a y b y después da E-INT-01 o E-INT-02, sin intercambiar.
- **Cantidad** (design §10): `{ clase: 'exacta', valor }`, `{ clase: 'multiploPi', coeficiente, aprox, cota }` o `{ clase: 'aproximada', valor, cota, motivo }`. `unidades.escalarCantidad` la multiplica por un racional ≥ 0 sin perder la clase; `areaAMetrosCuadrados(c, 'cm')` divide entre 10 000 = 100².
- **Figuras** (`geometria.js`): `areaRectangulo`, `areaTriangulo` (exactas) y `areaCirculo` (k = r², aprox = k·`PI_APROX` y cota = k·10⁻³⁵, `COTA_PI`). No hay trapecio (T-D1).
- **Materiales** (`materiales.js`): `estimarMaterial(areaUtil, precio, w)` devuelve `areaUtil`, `factorAdicional`, `areaEstimada`, `costoBase` y `costoEstimado`, todo exacto (CR-03: 2000/3 y 2200/3). Formatear «Q666.67» es trabajo de `formato.js` (T-11).
- **Léxico** (`lexico.js`): `analizarLexico(texto)` devuelve `Resultado` con `valor` = fichas congeladas `{ tipo, texto, posicion }` (tipos `NUMERO`, `X`, `MAS`, `MENOS`, `POR`, `ENTRE`, `POTENCIA`, `ABRE`, `CIERRA`), o un solo error: el primero en el orden de design §5.2. Los `NUMERO` guardan el texto del literal, sin convertirlo (tasks T-09). `LIMITES` = 200 caracteres, 100 fichas, 10 paréntesis y 6 decimales.
- **Sintaxis** (`sintaxis.js`): `analizarSintaxis(fichas)` y `analizarExpresion(texto)` devuelven `Resultado` con el árbol congelado, o un solo error (E-EXP-02, E-EXP-07 o E-EXP-11). Nodos: `numero{valor}` (texto del literal), `x`, `negacion{arg}`, `suma`, `resta`, `division{izq, der}`, `producto{izq, der, implicito}` y `potencia{base, exponente}`, donde `exponente` es un nodo `numero` entero. Todos llevan `posicion`. El `+` unario no crea nodo y no hay nodo de paréntesis. `x^4`, `x^0`, `2^4`, `1/x` y `x/x` son árboles válidos: sus errores (E-EXP-10, E-EXP-07, E-EXP-08) son de T-10.
- **Posiciones:** en fichas, nodos y errores son el número de carácter en el texto original **contando desde 1**, como en el mensaje de E-EXP-02 («cerca de la posición n»). Un final prematuro se señala justo después de la última ficha (`x^` → 3).
- **Normalización** (`normalizar.js`): `normalizarArbol(arbol)` devuelve `Resultado` con `{ polinomio, huboDesarrollo }`, o un solo error. Recorre el árbol de abajo arriba y de izquierda a derecha, con `racional.desdeDecimal` para los literales y las operaciones de `polinomio.js`, y comprueba cada operación **antes** de hacerla: producto con grados que suman > 3 → E-EXP-10; exponente 0 → E-EXP-07; base de grado g ≥ 1 con g·n > 3 → E-EXP-10 (sin calcular la potencia: `x^999999` es inmediato); base constante con n > 3 → E-EXP-07; divisor normalizado de grado ≥ 1 → E-EXP-08, y divisor cero → E-EXP-09. E-EXP-10 lleva `datos.grado`. No hay tope de coeficientes (D-09).
- **Posición de esos errores:** E-EXP-07 señala el exponente; E-EXP-10, el `^` o el producto (el `*`, o el primer carácter del segundo factor si es implícito); E-EXP-08 y E-EXP-09, la `/`.
- **Casos de uso** (T-08): devuelven siempre `Resultado` congelado y nunca lanzan. `PresupuestoAgotado` → E-SIS-01; cualquier otra excepción → E-SIS-02, con el mensaje del catálogo y sin datos técnicos (el detalle va a `console.error`).
  - `analizarPerfil(entrada)`: valida la función (`interpretarFuncion`) y a y b (`leerIntervalo`) por separado y acumula los errores en ese orden; con errores no calcula nada. Después: `integrarDefinida`, `analizarSigno`, `areaGeometrica`, `valorPromedio` y `rectanguloEquivalente`. Devuelve `ResultadoPerfil`: `entrada`, `modelo`, `intervalo`, `unidades`, `integral`, `analisis`, `area` (`area.area` es la Cantidad A_geo), `promedio`, `rectangulo`, `aptitud`, `pasos: null`, `grafica: null` y `advertencias`.
  - `aptitud` = `{ apta, motivo, error }`: abstracta → E-MOD-01; física y no `noNegativa` → E-MOD-02; física y A_geo = 0 → E-MOD-03; si no, apta (su área siempre es exacta). `error` es el `ErrorAreaCalc` del motivo.
  - Advertencias: W-01 si cambia de signo; W-02 por tangencia y W-03 por cero en un extremo (con `datos.x`); W-04 con `datos.cota`; W-09 si f ≡ 0.
  - `calcularFigura(entrada)`: rectángulo, triángulo y círculo en cm o m; reglas `dimensionCm` o `dimensionM`, errores acumulados por dimensión. Devuelve `entrada`, `tipo`, `unidad`, `dimensiones`, `area`, `unidadArea`, `areaM2`, `formula` (texto y LaTeX del formulario §8) y `pasos: null`.
  - `estimarMaterial(entrada)`: sin fuente → E-MOD-04; perfil no apto → su motivo; después precio y adicional, acumulados. Devuelve `descripcionFuente`, `areaUtilM2`, `adicional`, `factorAdicional`, `areaEstimadaM2`, `precio`, `costoBase`, `costoEstimado` y `supuestos` (W-06, y W-05 si `datosSimulados`).
- **Formato** (`formato.js`, T-11): todo con BigInt, sin `Number`. Redondeo mitad alejándose de cero sobre el racional: |p/q|·10ⁿ, cociente y resto, y +1 si 2·resto ≥ q.
  - `aDecimal(r, n = 4)` → «60.75», «13.3333», «−0.6667»; sin ceros finales si es exacto. `esDecimalExacto(r, n)` decide el símbolo. `decimalConSimbolo(r)` → «= 60.75» o «≈ 13.3333»; `decimalConSimboloLatex` usa `\approx`. Nunca «−0»: −1/10⁹ → «≈ 0.0000».
  - `quetzales(r)` → «Q666.67», «Q0.00»: siempre 2 decimales y sin «=» ni «≈».
  - `fraccionTexto` / `fraccionLatex` → «−3/4» / `-\frac{3}{4}`; `sustitucionTexto` / `sustitucionLatex` ponen entre paréntesis los negativos y las fracciones: «(−1)», «(1/2)», `\left(-1\right)`.
  - `monomioTexto`, `monomioLatex`, `polinomioTexto` y `polinomioLatex`, de cualquier grado: «x⁴/4 − x», «x³ − 4x²/3 − 5x/3 + 2/3».
  - `multiploPiTexto` / `multiploPiLatex` → «25π», «π/4», `\frac{9\pi}{4}`. `cotaTexto` / `cotaLatex` → «6·10⁻²⁵», con una cifra redondeada hacia arriba.
  - `cantidadTexto(cantidad, unidad)`: «243/4 = 60.75 u²», «6 u²», «25π ≈ 78.5398 m²», «≈ 2.4379 u² (aproximada; cota de error ≤ 6·10⁻²⁵)». `quetzalesCantidad`: «Q666.67», «Q250π ≈ Q785.40». `UNIDADES` = u, u², m, m², cm, cm², Q/m² y %.
- **Pasos** (`pasos.js`, T-12): cada `Paso` es `{ id, titulo, texto, latex, explicacion }`, congelado (design §10); `latex` y `explicacion` pueden ser `null`. Solo formatea: F(b) y F(a) salen de `integral.terminos[].valorEnB/valorEnA`, `Fb` y `Fa`; los tramos, de `area.tramos`; los signos, de `analisis`; los costos, de `ResultadoEstimacion`. Una prueba comprueba que, si el resultado trae otros valores, los pasos muestran esos valores, y que `pasos.js` no hace aritmética ni importa el núcleo de cálculo.
  - `pasosArea(resultado)`: sin cambio de signo, `datos`, `desarrollo` (si `huboDesarrollo`), `signo`, `planteamiento`, `antiderivada`, `limiteSuperior`, `limiteInferior`, `resta`, `resultado` e `interpretacion`. Con cambio de signo, después de `antiderivada`: `ceros`, un `tramo` por tramo, `suma`, `comparacion`, `resultado` e `interpretacion`.
  - `pasosPromedio(resultado)`: `formula`, `sustitucion`, `integral`, `division`, `unidades` e `interpretacion`. La equivalencia con la pizarra va en la explicación de `division`.
  - `pasosPerfil(resultado)` → `{ area, promedio }`, la forma de `ResultadoPerfil.pasos`. `pasosFigura(figura)`: `datos`, `formula`, `sustitucion`, `resultado` y `conversion` si es en cm. `pasosEstimacion(estimacion)`: `areaUtil`, `adicional`, `costoBase`, `costoEstimado` y `supuestos`.
- **Estado** (`estado.js`, T-13): `estadoInicial()` → `{ seccion, perfil, figura, estimacion }` de design §12, congelado; `perfil` y `figura` son `{ entrada, resultado, errores }`, y `estimacion` es `{ fuente, entrada, datosSimulados, resultado, errores }`. Todas las transiciones son funciones `(estado, …) → estado nuevo`, congelado, sin modificar el anterior.
  - `editarPerfil` / `editarFigura (estado, campo, valor)`: retiran el resultado y los errores; si esa parte era la fuente, retiran también la fuente y la estimación.
  - `calcularPerfil` / `calcularFigura (estado)`: guardan el valor o los errores, nunca los dos; si esa parte era la fuente, retiran la fuente y la estimación.
  - `usarComoFuente (estado, 'perfil' | 'figura')`: solo si `aptoParaEstimar`; si no, devuelve el mismo estado.
  - `editarEstimacion (estado, 'textoPrecio' | 'textoAdicional', valor)`: retira la estimación y `datosSimulados`.
  - `calcularEstimacion (estado)`: sin fuente da E-MOD-04.
  - `irASeccion (estado, seccion)`: solo cambia la sección.
  - `cargarEjemplo (estado, id, catalogo)`: aplica `editar…` a cada campo (un campo que falta vuelve a su valor inicial), copia el precio y el adicional si los trae, marca `datosSimulados` si `simulado` y calcula. Solo lee los campos de entrada, nunca resultados.
- **Navegación** (`navegacion.js`, T-13): `seccionDesdeFragmento('#figuras')` → `'figuras'` (vacío o desconocido → `'perfil'`); `fragmentoDe(seccion)`; `irA(ventana, seccion)` cambia `location.hash`, así el historial y «Atrás» funcionan; `iniciarNavegacion(ventana, alCambiar)` avisa al iniciar y en cada `hashchange`, y devuelve la función que deja de escuchar.
- **ModeloValidado** (`interpretarFuncion(texto)`): `{ textoOriginal, polinomio, huboDesarrollo, textoNormalizado, latexNormalizado }`, congelado. `huboDesarrollo` es verdadero si un producto o una potencia tiene un factor que es una suma o resta, aunque lleve signos delante. El texto y el LaTeX salen del polinomio, al estilo de design §14.1: potencias descendentes, «−» (U+2212) en el texto, y monomios como `x²/4`, `5x/3` o `\frac{5x}{3}`. Ejemplos: «x³ − 1» y «x³ − 4x²/3 − 5x/3 + 2/3».

## 6. Qué falta después de T-08 y siguiente tarea

El núcleo (T-02 a T-07), el analizador (T-09 y T-10) y los casos de uso (T-08) están implementados. **Lo que T-08 no puede producir todavía**, porque sus productores son de otras tareas:

| Campo o texto | Hoy | Lo produce | Lo conecta |
|---|---|---|---|
| `ResultadoPerfil.pasos` (`{ area, promedio }`) | `null` | ya existe: `pasosPerfil` de `presentacion/pasos.js` (T-12) | T-17, en `analizarPerfil` (design §4, paso 8) |
| `ResultadoPerfil.grafica` (`DatosGrafica`) | `null` | `presentacion/datosGrafica.js` (T-15) | T-17, en `analizarPerfil` (design §4, paso 9) |
| `ResultadoFigura.pasos` | `null` | ya existe: `pasosFigura` de `pasos.js` (T-12) | T-17, en `calcularFigura` |
| Pasos de la estimación | `ResultadoEstimacion` no tiene ese campo en design §10 | ya existe: `pasosEstimacion` de `pasos.js` (T-12) | T-17 decide si la vista lo llama o se añade el campo |
| Cifras de W-02, W-03 y W-04 | fracción exacta (`racional.aTexto`), p. ej. la cota de W-04 | ya existe: `fraccionTexto` y `cotaTexto` de `formato.js` (T-11) | T-17, en `analizarPerfil` |
| «Q666.67» y «Q733.33» de CR-03 | el caso de uso da 2000/3 y 2200/3 exactos | ya existe: `quetzales` de `formato.js` (T-11) | la vista (T-14) |
| Invalidación de CR-13 y CR-22 en pantalla | el estado ya retira los resultados (T-13) | `render` de las vistas (T-14) debe vaciar el panel y llamar a `graficaPlotly.limpiar` | T-14 y T-17 |
| Catálogo de ejemplos | `cargarEjemplo` lo recibe como argumento | `ejemplos/ejemplos.js` (T-16), con el contrato `{ id, seccion, origen, entrada, estimacion?, simulado? }` | T-14 o T-17, al llamar a `cargarEjemplo` |

Siguientes tareas desbloqueadas: T-14 (vistas, ya tiene T-11 y T-13), T-15 (datos de la gráfica) y T-16 (KaTeX y ejemplos). El equipo decide cuál se autoriza; se sigue `tasks.md` §1, **una tarea por vez y solo con instrucción del equipo**.

## 7. Asuntos pendientes (no son fallos confirmados)

- **Revisión de R:** T-R1 (verificar `tests/casos-referencia.js`) y T-R6 (revisar los cambios de T-02 a T-13). R también debe verificar `tests/expresiones/tabla-gramatica.js` y las transcripciones a mano de T-08 (las antiderivadas de los CR como coeficientes y los valores calculados en las pruebas de casos de uso).
- **Área de los 400 polinomios:** resuelto en T-08: `tests/propiedades.test.js` comprueba que los 400 dan, exacta, el área calculada con sus cortes conocidos.
- **Tabla del prototipo para T-10:** las «33 entradas válidas y 59 inválidas del prototipo» de tasks T-10 no están en el repositorio. Por autorización del equipo, T-10 usa en su lugar una **tabla reconstruida para pruebas** (60 válidas y 84 inválidas), derivada de requirements Tabla 9.1, Tabla 9.2, §10 y §14, y de design §5.2 a §5.4 y §14.1. Las especificaciones no se cambiaron: tasks T-10 sigue citando el prototipo.
- **Escritura de polinomios en dos capas (duplicación conocida):** `normalizar.js` (T-10) escribe `textoNormalizado` y `latexNormalizado`, y `formato.js` (T-11) tiene `polinomioTexto` y `polinomioLatex` con las mismas reglas, ampliadas a cualquier grado para la antiderivada. No se puede reutilizar una desde la otra sin romper design §2: `expresiones/` no importa `presentacion/`, y `presentacion/` no importa `expresiones/`. No se tocó T-10. Mientras tanto, `formato.test.js` comprueba que las dos dan el mismo texto y el mismo LaTeX en las 60 entradas válidas de la tabla reconstruida. Para resolverlo en la integración, el equipo puede autorizar mover la escritura de polinomios a `nucleo/` y que las dos capas la importen.
- **Ensayo en la laptop sin internet:** T-R5 (`npm ci`, `npm run preview` con el Wi-Fi apagado).
- **Entradas no fijadas en las fuentes:** CR-11 (la función), CR-13 (intervalo y lugar de `Infinity`), CR-19 (figura y dimensión que valen 0) y CR-21 (contenido del texto de 201 caracteres e intervalo). Están anotadas en `pendientes` dentro de `tests/casos-referencia.js`; el equipo debe fijarlas o aceptarlas. Mientras tanto, la prueba de T-09 usa dos contenidos de 201 caracteres (`x` seguida de espacios y `x+1+` repetido), sin rellenar el pendiente.
- **Resuelto en T-07:** requirements §12 decía que el decimal del círculo usaba π en doble precisión; por autorización del equipo ahora dice `PI_APROX`, como design §6 y §9.
- **Interpretaciones que R debe confirmar:**
  - T-02 a T-06: el campo `potencia` de `terminos` es el exponente del término de F; `racional.potencia(r, 0)` y `polinomio.potencia(p, 0)` valen 1 también para cero; `analizarSigno` rechaza grado > 3; en CR-35 los valores se guardaron irreducibles (275·10⁵⁸/9 y 10175·10⁵⁸/243).
  - T-07: los decimales se cuentan tal como se escriben (`1.0000000` tiene 7); en precio, adicional y dimensiones el paso 5 solo comprueba el máximo, para que un negativo llegue a E-NUM-05 o E-NUM-06; `leerIntervalo` es una función añadida en `numeros.js` para CR-11; los textos de los mensajes son una propuesta basada en los orientativos de requirements §10.
  - T-09, posiciones: cuentan desde 1 en fichas, nodos y errores (unidades UTF-16, como `texto.length`). E-EXP-12 señala el comienzo del prefijo; E-EXP-11 por longitud, el carácter 201, y por fichas, la ficha 101. E-EXP-11 lleva `datos.limite` (`'caracteres'`, `'elementos'` o `'profundidad'`).
  - T-09, léxico: los 200 caracteres se miden sin recortar los espacios; un nombre seguido de `(` aunque haya espacios (`sin (x)`) es una función (E-EXP-06), también `X(x+1)`, por el orden de design §5.2; las unidades solo se reconocen en minúscula (`CM` y `M` dan E-EXP-03); las letras son solo ASCII, así que `π` da E-EXP-06; `1.5.3` da E-EXP-04, como un punto con dígitos al lado.
  - T-09, sintaxis: los paréntesis del exponente cuentan para la profundidad; tras `^`, un signo, un decimal, `x`, `(` sin entero o un entero seguido de algo que no es `)` dan E-EXP-07 (`x^(2+1)`, `x^((2))`, `x^2.0`), y una ficha que no puede empezar un operando o el final dan E-EXP-02 (`x^()`, `x^*2`, `x^^2`); `x^2x` es x²·x por la tabla del producto implícito. `analizarExpresion` es una función añadida para unir léxico y sintaxis. Las sugerencias de funciones, unidades, caracteres y `X` son una propuesta.
  - T-10, divisiones: se decide por el divisor **normalizado** (design §5.4), así que `1/(x-x+1)` se admite (vale 1, definido en todo x) y `x/(x-x)` da E-EXP-09, no E-EXP-08. `x/x` y `(x^2-1)/(x-1)` siguen dando E-EXP-08 (R-02.6).
  - T-10, potencias y productos: la base constante también se decide normalizada, así que `(x-x+1)^4` y `0^4` dan E-EXP-07. El grado se comprueba en cada subexpresión normalizada: `0*x*x*x*x` y `(x-x)^2` dan el polinomio cero, mientras que `x*x*x*x*0` da E-EXP-10 porque `x*x*x*x` ya tiene grado 4.
  - T-10, `huboDesarrollo`: mira a través de los signos (`2*-(x+1)` y `-2(x+1)^2` dan true) y se activa también con sumas de constantes (`(1+1)x`) y con exponente 1 (`(x+1)^1`). La división de una suma (`(x+1)/2`) y el signo delante de una suma (`-(x-1)`) dan false, porque design §5.4 solo menciona productos y potencias.
  - T-10, otros: `latexNormalizado` se implementó porque forma parte del contrato `ModeloValidado` (design §10), aunque los criterios de T-10 solo nombran `textoNormalizado`; `normalizarArbol` es una función añadida; el polinomio esperado de CR-33 (x³ + x/10⁶⁰ − 2) se dedujo a mano de su texto, porque `casos-referencia.js` no lo fija.
  - T-08, contratos añadidos a design §10: `aptitud.error` (el ErrorAreaCalc del motivo, porque `interfaz/` no puede importar el núcleo para crear el mensaje); `ResultadoFigura.tipo`, `unidad` y `unidadArea`; `ResultadoEstimacion.factorAdicional` (para que T-12 muestre 1 + w/100 sin recalcular); `EntradaEstimacion.datosSimulados` (W-05 solo cuando la interfaz carga un caso simulado, porque el caso de uso no sabe de dónde viene el precio); y el archivo `casos-de-uso/comun.js`.
  - T-08, `pasos` y `grafica` valen `null` en vez de omitirse, para que el contrato tenga ya todos sus campos; T-17 debe sustituirlos (§6).
  - T-08, errores: la forma de la entrada (un campo que no es texto, una interpretación, unidad o figura desconocidas, el trapecio) se trata como error de programación (E-SIS-02), porque la interfaz controla esos valores. E-SIS-02 escribe el detalle en `console.error` y E-SIS-01 no escribe nada. En `estimarMaterial`, la fuente es una condición previa: sin una fuente apta solo se informa E-MOD, sin validar el precio ni el adicional.
  - T-08, advertencias y textos: las cifras de W-02, W-03 y W-04 son fracciones exactas hasta que T-17 use `formato.js` en `analizarPerfil` (T-11 no tocó los casos de uso); `descripcionFuente` usa `textoNormalizado` (orden descendente: «Perfil x²/4 + 2 en [0, 4] m», no «2 + x²/4» como el ejemplo de design §10) y los textos de a, b y las dimensiones tal como los escribió el usuario, sin espacios. W-01 se añade siempre que f cambia de signo, también en CR-15 y CR-36, aunque su referencia solo nombre W-04.
  - T-08, prueba de arquitectura: añade reglas que no estaban escritas como prueba: las capas exactas (`nucleo/`, `expresiones/`, `casos-de-uso/`) no usan `Number()`, `parseFloat`, `parseInt`, `aNumber`, `evaluarAprox` ni `Math.round/floor/ceil/sqrt/…`, salvo `racional.js` y `polinomio.js`, que los definen; y solo `presentacion/formato.js` puede usar `toFixed`, `toPrecision`, `toLocaleString` o `Math.round`. T-11 a T-15 deben respetarlas.
  - T-11, símbolos: el texto usa «−» (U+2212), como `textoNormalizado`, y el LaTeX usa «-». Los decimales «≈» conservan los ceros finales («≈ 0.0000», «≈ 1.0000»), y los «=» los quitan («= 60.75», «= 6»).
  - T-11, quetzales: siempre 2 decimales, sin «=» ni «≈» aunque se redondee («Q666.67», como fija CR-03). Un costo de un círculo se muestra «Q250π ≈ Q785.40» (coeficiente exacto y decimal con PI_APROX, design §9); el diseño no fija ese texto. Un importe negativo, que el MVP no produce, se escribe «−Q1.50».
  - T-11, cantidades: una exacta entera se muestra sin decimal («6 u²»); una no entera, con la fracción y su decimal («40/3 ≈ 13.3333 m²»). Un múltiplo de π siempre lleva «≈» y no muestra su cota de 10⁻³⁵. La cota de una aproximada se escribe con una cifra redondeada **hacia arriba** («5.85·10⁻²⁵» → «6·10⁻²⁵»), para que siga siendo una cota. Con la cota real del núcleo, CR-15 da exactamente el ejemplo de design §14.1.
  - T-11, sustituciones: además de los negativos (R-09.6), las fracciones van entre paréntesis («(1/2)⁴»), para que una potencia no se lea mal.
  - T-11, orden de la antiderivada: design §14.1 manda potencias descendentes, pero `casos-referencia.js` (y el formulario §5.2 y §7.1) escriben las antiderivadas de CR-02 y CR-03 en orden ascendente («x + x³/3», «2x + x³/12»). `polinomioTexto` da «x³/3 + x» y «x³/12 + 2x»; la prueba compara con los términos de la referencia invertidos. T-12 aplicó el orden descendente también en los pasos (ver abajo).
  - T-12, orden de los términos: por indicación del equipo, la antiderivada y las sustituciones usan el orden descendente de design §14.1. En CR-02 el paso dice «F(x) = x³/3 + x», y su explicación añade que en los apuntes puede escribirse «x + x³/3», la misma antiderivada. Por eso «F(−1) = (−1)³/3 + (−1) = −1/3 − 1 = −4/3» invierte el orden del formulario §5.2 («(−1) + (−1)³/3 = −1 − 1/3»). Los valores no cambian. R debe confirmarlo.
  - T-12, sin cálculos nuevos: los pasos omiten igualdades intermedias que exigirían calcular en presentación. CR-01: «F(4) = 4⁴/4 − 4 = 64 − 4 = 60», sin el «256/4» del formulario §4.2, y «60 − (−3/4) = 243/4», sin «240/4 + 3/4». CR-02: la equivalencia con la pizarra se muestra sacando factor común, «(1/3)·(14/3) − (1/3)·(−4/3) = (1/3)·[14/3 − (−4/3)] = (1/3)·6 = 2», en lugar de los productos «14/9 + 4/9 = 18/9» del formulario, que habría que calcular.
  - T-12, tramos: cada tramo se escribe «Iₖ = F(hasta) − F(desde) = valor», con el valor de `area.tramos`, pero sin el desglose de F en los cortes interiores. El formulario CR-31 muestra «F(1/3) = 1/18 − 1/9 = −1/18», y el núcleo no entrega F en los cortes, así que evaluarla aquí sería recalcular. Si el equipo quiere ese desglose, el núcleo (`area.js`) debería entregar F en cada corte. Un corte irracional se llama r₁, r₂… y sus tramos usan decimales con «≈».
  - T-12, textos: el paso `desarrollo` muestra el texto del usuario recortado («(x-1)^2 = x² − 2x + 1») solo como texto; su LaTeX sale del modelo (R-20.5). Los costos llevan la fracción delante como en el formulario §7.2 («2000/3 ≈ Q666.67»). Las dimensiones de una figura se muestran con sus decimales exactos (hasta 6). El LaTeX de las cantidades se escribe en `pasos.js` (`\,\text{m}^{2}`), porque `formato.js` solo da cantidades en texto.
  - T-12, alcance: `pasos.js` no está conectado a los casos de uso (T-17). `ResultadoEstimacion` no tiene campo de pasos en design §10; `pasosEstimacion` existe para que T-17 o la vista lo usen.
  - T-13, invalidación al recalcular: además de al editar, `calcularPerfil` y `calcularFigura` retiran la fuente y la estimación si esa parte era la fuente, aunque la entrada no cambie. La estimación dependía del resultado anterior, y si el nuevo cálculo falla ya no hay de dónde sacar el área. El usuario vuelve a pulsar «Usar esta área».
  - T-13, se conservan los textos: al invalidar, el precio y el adicional escritos se conservan; solo se retiran la fuente, el resultado y los errores. Lo mismo pasa con los textos de la figura que no usa el tipo elegido (un círculo ignora base y altura).
  - T-13, `usarComoFuente` con un resultado ausente o no apto devuelve el mismo estado, sin errores: la interfaz muestra el botón deshabilitado con `aptitud.error` (design §14.5). E-MOD-04 solo aparece al calcular la estimación sin fuente.
  - T-13, `datosSimulados` es un campo añadido al estado de design §12. `cargarEjemplo` lo pone en true si el ejemplo es `simulado`, y editar el precio o el adicional lo devuelve a false (el valor ya no es el del ejemplo). Se pasa a `estimarMaterial`, que añade W-05.
  - T-13, `cargarEjemplo` no cambia la sección y lanza RangeError o TypeError ante un id, catálogo o sección inválidos, porque la interfaz solo ofrece ids del catálogo. Las transiciones también lanzan ante campos desconocidos o valores que no son texto: son errores de programación, no del usuario.
  - T-13, `navegacion.js` recibe la ventana como argumento en lugar de usar `window`, para probarla sin DOM. Las pruebas de navegación están en `tests/interfaz/estado.test.js`, el único archivo de pruebas que fija T-13.
- **Textos desactualizados no autorizados para cambio:** `design.md` §18, regla 8, y `requirements.md` §0 («Estado del repositorio») describen el estado anterior a los commits. `AGENTS.md` ya recoge la regla vigente, aunque dice que la rama «ya contiene T-01 a T-06»; hoy contiene T-01 a T-13.

## 8. Intención visual (para antes de T-14)

Interfaz cuidada, con esencia de fondo claro, azul oscuro, tarjetas y acentos turquesa; la gráfica es la protagonista y las animaciones son discretas. Se adapta solo a las tres secciones: Perfil, Figuras y Estimación. **La maqueta final todavía debe definirse** con el equipo antes de T-14. Debe respetar design §14.5 y R-23: contraste de 4.5:1, foco visible, uso con teclado, desde 360 px y sin fuentes remotas. El plan reserva poco tiempo al CSS (design §16) y los ajustes visuales son lo segundo en el orden de recorte.

## 9. Comandos en una copia nueva

```
npm ci
npm test
npm run build
npm run verificar-dist
npm run preview
```

`npm ci` instala exactamente lo de `package-lock.json`. **No** usar `npm install` para actualizar versiones. En Windows, si PowerShell bloquea `npm.ps1`, usar `cmd` o `npm.cmd`. En la terminal de Kiro, `npm test` a veces devolvía el control antes de terminar; funcionó lanzarlo como proceso en segundo plano y leer su salida. Para confirmar el código de salida se añade una impresión al final del mismo comando, por ejemplo `npm.cmd test; "CODIGO_SALIDA=$LASTEXITCODE"`, y se espera a que aparezca esa línea. Si ni así se lee la salida, se redirige a un archivo (`npm.cmd run build *> registro.log; "CODIGO_SALIDA=$LASTEXITCODE" | Out-File -Append registro.log`), se lee el archivo y se borra después; no se añade al commit.

## 10. Reglas de continuidad

1. Leer primero este relevo, `AGENTS.md` y las especificaciones.
2. Comprobar la rama (`avance-t04`), el último commit y `git status` antes de editar.
3. No dar por terminada una tarea que no esté implementada y probada, ni atribuir a R revisiones que no hizo.
4. No iniciar otra tarea sin instrucción del equipo; implementar una por vez.
5. No cambiar especificaciones ni alcance sin autorización explícita.
6. Commit y push normal solo cuando el equipo lo pida; nunca PR, merge a `main` ni force push sin autorización.
