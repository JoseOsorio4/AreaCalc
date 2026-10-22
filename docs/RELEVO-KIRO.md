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
- Rama: **`avance-t04`**. El nombre es histórico: empezó como respaldo de T-04 y ya contiene T-01 a T-16.
- Último trabajo: el commit «T-16: fórmulas con KaTeX y catálogo de ejemplos», encima de `98fab65` (T-15). La apariencia de `13c6c5c` (revisión visual de T-14) está **aprobada por el equipo** y se conserva. Para ver los SHA: `git log --oneline -n 5`.
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
| T-13 Estado e invalidación | Implementada y probada; el catálogo de ejemplos llega como argumento hasta T-16 | `fdbb742` |
| T-14 Vistas, HTML y CSS accesibles | Implementada; gráfica, pasos, KaTeX y ejemplos quedan como puntos de integración (§6); revisión manual pendiente (T-R3) | `bd03fa0` |
| T-14, revisión visual | Menú lateral expandible, fondo con trama suave, tarjetas e ilustraciones geométricas; **apariencia aprobada por el equipo** (22 de octubre), que pide conservarla en las tareas siguientes | `13c6c5c` |
| T-15 Datos de la gráfica y adaptador de Plotly | Implementada y probada; **no conectada** a `analizarPerfil` ni a `main.js` (T-17, §6) | `98fab65` |
| T-16 Fórmulas con KaTeX y ejemplos | Implementada y probada; **no conectada** a las vistas ni a `main.js` (T-17, §6) | commit «T-16: fórmulas con KaTeX…» |
| T-17 Integración | Sin iniciar | — |

Última ejecución, con T-16: `npm test` dio **1284/1284** pruebas en 27 archivos, con código de salida 0, y `npm run build` fue correcto, también con código 0 (solo el aviso esperado por el tamaño de Plotly, design §13); `npm run verificar-dist` también dio 0. T-16 añade 61 pruebas (21 del adaptador de KaTeX y 40 de los ejemplos). Los dos módulos se revisaron además en Chrome sin interfaz con un montaje temporal (ya borrado); lo observado está en §7.

**La revisión independiente de R no se ha hecho** para T-02 a T-16: T-R1, T-R3 y T-R6 siguen pendientes. Implementada no equivale a revisada (tasks.md §0).

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
| `datosGrafica.js` | `datosGrafica({ modelo, intervalo, analisis, promedio, rectangulo, unidades })` → `{ datos: DatosGrafica \| null, advertencias, motivo }` (T-15, §5); Number solo para dibujar; W-07 si algo no es finito |

**Adaptadores** (`src/adaptadores/`, carpeta de B; solo importan `plotly.js-basic-dist-min` y `katex`, nunca `src/`):

| Archivo | Contenido |
|---|---|
| `graficaPlotly.js` | `dibujar(contenedor, datos)`, `limpiar(contenedor)`, `precargar()` y `programarPrecarga(ventana)`; además `crearGraficaPlotly(dependencias)` para las pruebas, `figuraPlotly(datos)` (trazas y formas, pura), `sonDibujables(datos)`, `AVISO_W07` y `LEYENDA` (T-15, §5) |
| `formulasKatex.js` | `mejorar(elemento, latex)`, `mejorarDentro(raiz)` y `cancelar(elemento)`; además `crearFormulasKatex(dependencias)` para las pruebas, `OPCIONES_KATEX` y `AVISO_W08` (T-16, §5) |

**Ejemplos** (`src/ejemplos/`, carpeta de B; no importa nada):

| Archivo | Contenido |
|---|---|
| `ejemplos.js` | `EJEMPLOS` (10 ejemplos, solo entradas) y `ORIGENES` (las tres etiquetas de R-13.1) (T-16, §5) |

**Interfaz** (`src/interfaz/`, carpeta de B; importa `casos-de-uso/` y, de `presentacion/`, solo `formato.js`):

| Archivo | Contenido |
|---|---|
| `estado.js` | Estado en memoria y transiciones puras, con invalidación (design §12) |
| `navegacion.js` | Sección según el fragmento de la URL (`#perfil`, `#figuras`, `#estimacion`); la ventana se recibe como argumento |
| `vistaComun.js` | DOM solo con `createElement`, `textContent` y `replaceChildren`: `crear`, `porId`, `enfocar`, `mostrarSeccion`, `describir`, `mostrarErrores` (mensaje bajo el campo, `aria-invalid`, `aria-describedby` y resumen con enlaces), `estadoVacio`, `listaAdvertencias`, `listaPasos` (con `data-latex`) y `pendiente` |
| `vistaPerfil.js` | `crearVistaPerfil({ documento, ventana, despachar, catalogo, grafica })` → `{ render(estado) }` |
| `vistaFiguras.js` | `crearVistaFiguras({ documento, ventana, despachar })` → `{ render(estado) }` |
| `vistaEstimacion.js` | `crearVistaEstimacion({ documento, despachar })` → `{ render(estado) }` |
| `menuLateral.js` | `iniciarMenuLateral({ documento, ventana })`: contraer o expandir en escritorio (preferencia en `localStorage`) y panel en pantallas estrechas; no toca el estado |

**Estilos:** `src/estilos/app.css`, enlazado desde `index.html`. Variables de color con su contraste anotado, fuentes del sistema (títulos en Palatino Linotype o Georgia), foco de 3 px, consultas de contenedor sobre `.principal` para que la composición se adapte al ancho real del contenido, panel de menú por debajo de 768 px y animaciones que se anulan con `prefers-reduced-motion`.

**Pruebas** (`tests/`): `casos-referencia.js` (valores esperados transcritos, sin importar `src/`), `aritmetica-independiente.js` (aritmética exacta propia de las pruebas, sin importar `src/`), `arquitectura.test.js` (versión completa de T-08), `propiedades.test.js` (T-04 y T-08), `casos-de-uso/` con una prueba por caso de uso y una de robustez, `presentacion/formato.test.js`, `presentacion/pasos.test.js` y `presentacion/datosGrafica.test.js`, `adaptadores/graficaPlotly.test.js` (Plotly, DOM, ResizeObserver y fotogramas simulados), `adaptadores/formulasKatex.test.js` (KaTeX y DOM simulados, más el KaTeX real), `ejemplos/ejemplos.test.js`, `interfaz/estado.test.js` (estado y navegación), `nucleo/` con una prueba por módulo y `expresiones/` con `lexico.test.js`, `sintaxis.test.js`, `normalizar.test.js` y `tabla-gramatica.js`. Esta última es la **tabla reconstruida para pruebas** de T-10 (60 entradas válidas y 84 inválidas, cada una con su fuente); no procede del prototipo de design §0.

**Otros:** `index.html` tiene los tres formularios estáticos (ids `perfil-…`, `figura-…` y `estimacion-…`) y los supuestos fijos de la estimación. `src/main.js` crea el estado, `despachar(transicion, …args)` (aplica la transición, repinta y devuelve el estado nuevo), las tres vistas y la navegación. `prueba-recursos.html` y `src/prueba-recursos.js` son temporales de T-01 y se eliminan en T-17. `scripts/verificar-dist.js` comprueba que `dist/` no use recursos externos.

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

- **Datos de la gráfica** (`datosGrafica.js`, T-15): recibe un objeto con los campos homónimos de `ResultadoPerfil` (`modelo`, `intervalo`, `analisis`, `promedio`, `rectangulo` y `unidades`) y devuelve, congelado, `{ datos, advertencias, motivo }`:
  - Con éxito, `datos` es `DatosGrafica` (design §10): `curva { x, y }` con 401 puntos uniformes en [a − m, b + m], m = 0.1·(b − a), más a, b y los ceros, en orden y sin repetir; `regiones [{ x, y, signo }]`, una por tramo de `analisis.tramos`, con 101 puntos más las tangencias interiores; `ceros [{ x, exacto, etiqueta }]` («x = 1/3 (exacto)», «x ≈ 1.4142»); `promedio { y, etiqueta }` («f_prom = 10/3 m»); `rectangulo { x0: a, x1: b, altura } | null`; `ejes { etiquetaX, etiquetaY }` («x (m)», «f(x) (u)»); `rango { x: [a − m, b + m], y: [mín, máx] }` (incluye y = 0 y el promedio, con 8 % de holgura; [−1, 1] si f ≡ 0) y `descripcion` (resumen textual para el `aria-label`). `advertencias` es `[]` y `motivo`, `null`.
  - Si algún Number no es finito: `datos: null`, `advertencias: [W-07]` (`crearAdvertencia('W-07')`) y `motivo: 'no-finito'`. Cualquier excepción da lo mismo con `motivo: 'error'` y el detalle en `console.error`, para que un fallo de la gráfica nunca convierta el perfil en E-SIS-02 (R-10.6).
  - No recalcula: signos, ceros, rectángulo y f_prom salen tal cual del núcleo; en los ceros la curva vale 0, y la región de un tramo +1 (−1) se recorta a y ≥ 0 (y ≤ 0) para quitar el ruido de coma flotante. Solo importa `aNumber`, `evaluarAprox`, `crearAdvertencia`, `aDecimal` y `fraccionTexto` (lo comprueba una prueba).
- **Adaptador de Plotly** (`graficaPlotly.js`, T-15):
  - `dibujar(contenedor, datos)` devuelve una promesa que **nunca se rechaza**: `{ estado: 'dibujada' }`, `{ estado: 'cancelada' }` (llegó `limpiar` u otro `dibujar` antes de terminar) o `{ estado: 'fallida', etapa: 'datos' | 'carga' | 'dibujo' | 'interna', aviso: AVISO_W07 }`. Dibuja con `Plotly.react` en un `div.grafica__lienzo` propio (`role="img"`, `aria-label` = `datos.descripcion`, ancho 100 % y alto `clamp(340px, 44vw, 400px)` en línea) que añade al contenedor; mientras carga muestra «Preparando la gráfica…» con `aria-busy`.
  - Si falla, retira el lienzo (con `Plotly.purge`) y deja en el contenedor un `.grafica__aviso` con `role="status"`: «Gráfica no disponible» y «W-07: La gráfica no está disponible; los resultados y los pasos se conservan.» (`AVISO_W07`, igual al catálogo; lo comprueba una prueba, porque el adaptador no puede importar el núcleo). El detalle va a `console.error`. Una carga fallida no se guarda: el siguiente dibujo vuelve a intentarlo.
  - `limpiar(contenedor)` nunca lanza: invalida la generación del contenedor, desconecta el observador, cancela el ajuste pendiente, purga y retira el lienzo y el aviso. Si un dibujo terminaba después, purga su lienzo huérfano.
  - Ancho: un `ResizeObserver` sobre el contenedor llama a `Plotly.Plots.resize` como mucho una vez por fotograma cuando cambia su ancho o su alto (contraer o expandir el menú lateral, o la ventana); ignora la medida inicial y los tamaños 0 (sección oculta).
  - Trazas: una por región con `fill: 'tozeroy'` (turquesa sobre el eje; rosa con trama diagonal bajo el eje), leyenda «Sobre el eje (+)» / «Bajo el eje (−)» una vez por signo, curva `f(x)` y marcadores «Ceros de f» con su etiqueta como texto flotante (el único texto flotante, para no redondear fuera de `formato.js`). Formas: recta y = f_prom discontinua en todo el ancho, con su etiqueta, y rectángulo con contorno punteado sin relleno; las dos aparecen en la leyenda. Configuración: `responsive: true`, `displaylogo: false`, `displayModeBar: false`, más `showTips`, `scrollZoom` y `doubleClick` en `false`; ejes fijos (`dragmode: false`, `fixedrange`). Fondo del papel transparente para que se vea la trama del contenedor.
  - `precargar()` resuelve `true` o `false` y nunca se rechaza. `programarPrecarga(ventana)` espera a `load` (o actúa si `readyState` es `complete`) y precarga en `requestIdleCallback` (o `setTimeout`); devuelve cómo cancelarla.

- **Fórmulas con KaTeX** (`formulasKatex.js`, T-16):
  - `mejorar(elemento, latex)` devuelve una promesa que **nunca se rechaza**: `{ estado: 'mejorada' }`; `{ estado: 'omitida' }` si `latex` es `null` o `''` (paso solo textual, sin W-08); `{ estado: 'cancelada' }` si antes de terminar llegó otra mejora del mismo elemento, `cancelar(elemento)` o el elemento ya no está en el documento (la vista lo retiró al editar), y entonces no lo toca ni avisa; o `{ estado: 'fallida', etapa: 'datos' | 'carga' | 'formula' | 'interna', aviso: AVISO_W08 }`.
  - Carga diferida y compartida: `Promise.all([import('katex'), import('katex/dist/katex.min.css')])`. Vite deja KaTeX en su propio fragmento (unos 259 kB), su CSS aparte y las fuentes en `dist/assets`. Si falla la carga de KaTeX o de su CSS, W-08 con `etapa: 'carga'`; una carga fallida no se guarda y la siguiente mejora vuelve a intentarla.
  - Dibuja con `katex.render(latex, temporal, { throwOnError: true, trust: false, output: 'htmlAndMathml' })` en un `span` temporal; solo si no lanza reemplaza el contenido del elemento y le pone `data-katex="mejorada"`. Si KaTeX lanza (por ejemplo, `ParseError`), el elemento conserva exactamente su texto (R-09.8). El detalle va a `console.error`.
  - `mejorarDentro(raiz)` mejora cada `[data-latex]` de la raíz y devuelve `{ total, mejoradas, fallidas, canceladas, aviso }`, con `aviso: AVISO_W08` si al menos una falló y `null` si no: **un solo W-08 por raíz**, aunque fallen todas. Solo lee el atributo `data-latex`, que la aplicación escribe desde el polinomio (`latexNormalizado`, `paso.latex`, `formula.latex`); el texto del usuario nunca se pasa como LaTeX.
  - `AVISO_W08` copia el texto del catálogo, porque `adaptadores/` no puede importar el núcleo; una prueba lo compara.
- **Ejemplos** (`ejemplos.js`, T-16): `EJEMPLOS` es un arreglo congelado de `{ id, seccion: 'perfil' | 'figuras', origen, titulo, entrada, estimacion?, simulado? }`, el contrato de `cargarEjemplo` (T-13) más `origen` y `titulo` («Ejercicio de clase · x³ − 1 en [1, 4]»). Solo hay textos de entrada: ningún resultado, paso ni punto de gráfica (R-13.3).

| id | sección | origen | entrada |
|---|---|---|---|
| CR-01 | perfil | Ejercicio de clase (P1-D) | `x^3 - 1`, [1, 4], abstracta |
| CR-02 | perfil | Ejercicio de clase (P1-A) | `1 + x^2`, [−1, 2], física |
| CR-03 | perfil | Caso práctico simulado (PC §7.3) | `2 + x^2/4`, [0, 4], física; precio 50 y adicional 10, `simulado: true` |
| CR-05 | perfil | Caso de comprobación | `x`, [−1, 1], física |
| CR-06 | perfil | Caso de comprobación | `-2`, [0, 3], física |
| CR-07 | perfil | Caso de comprobación | `(x-1)^2`, [0, 2], abstracta |
| CR-14 | perfil | Caso de comprobación | `x^3 - x`, [−2, 2], abstracta |
| CR-15 | perfil | Caso de comprobación | `x^2 - 2`, [0, 2], abstracta |
| CR-09 | figuras | Caso de comprobación | rectángulo 4 × 2 m |
| CR-10 | figuras | Caso de comprobación | rectángulo 100 × 200 cm |

## 6. Qué falta después de T-16 y siguiente tarea

El núcleo (T-02 a T-07), el analizador (T-09 y T-10) y los casos de uso (T-08) están implementados. **Lo que T-08 no puede producir todavía**, porque sus productores son de otras tareas:

| Campo o texto | Hoy | Lo produce | Lo conecta |
|---|---|---|---|
| `ResultadoPerfil.pasos` (`{ area, promedio }`) | `null` | ya existe: `pasosPerfil` de `presentacion/pasos.js` (T-12) | T-17, en `analizarPerfil` (design §4, paso 8) |
| `ResultadoPerfil.grafica` (`DatosGrafica`) | `null` | ya existe: `datosGrafica` de `presentacion/datosGrafica.js` (T-15) | T-17, en `analizarPerfil` (design §4, paso 9; ver «Cómo conectar la gráfica») |
| `ResultadoFigura.pasos` | `null` | ya existe: `pasosFigura` de `pasos.js` (T-12) | T-17, en `calcularFigura` |
| Pasos de la estimación | `ResultadoEstimacion` no tiene ese campo en design §10 | ya existe: `pasosEstimacion` de `pasos.js` (T-12) | T-17 decide si la vista lo llama o se añade el campo |
| Cifras de W-02, W-03 y W-04 | fracción exacta (`racional.aTexto`), p. ej. la cota de W-04 | ya existe: `fraccionTexto` y `cotaTexto` de `formato.js` (T-11) | T-17, en `analizarPerfil` |
| «Q666.67» y «Q733.33» de CR-03 | **resuelto en T-14**: la vista usa `quetzalesCantidad` | — | — |
| Invalidación de CR-13 y CR-22 en pantalla | **resuelto en T-14** para resultados, errores y estimación: `render` vacía el panel cuando el estado retira el resultado | ya existe: `graficaPlotly.limpiar` (T-15), que también cancela lo pendiente | T-17, pasando el adaptador a `crearVistaPerfil` |
| Catálogo de ejemplos | `main.js` pasa `CATALOGO_EJEMPLOS = []`, así que `#perfil-ejemplos` sigue oculto | ya existe: `EJEMPLOS` de `ejemplos/ejemplos.js` (T-16); la vista muestra `titulo` | T-17, en `main.js` (ver «Cómo conectar KaTeX y los ejemplos») |

**Puntos de integración que dejó T-14** (la página dice que faltan; no hay datos simulados en `src/`):

| Punto | Dónde | Qué hace hoy | Qué debe hacer T-17 |
|---|---|---|---|
| Gráfica | `<figure id="perfil-grafica" class="grafica" data-grafica>`, fija en `index.html`; la llena `pintarGrafica` de `vistaPerfil.js` | aviso «Gráfica pendiente de integración», solo con unos ejes decorativos, sin curva | llenar `resultado.grafica` con `datosGrafica` y pasar el adaptador en `crearVistaPerfil`; la vista ya llama a `limpiar` y a `dibujar(figura, datos)` cuando cambia el resultado. Ajustar `pintarGrafica` para W-07 (ver abajo). El CSS de `.grafica` no necesita cambios: en el montaje de T-15 el lienzo ocupó todo el ancho con su estilo en línea |
| Pasos del perfil y de la figura | `desplegablePasos` de `vistaPerfil.js` y `vistaFiguras.js` (un `<details>`) | cerrado, con la insignia «Pendiente de integración» y el aviso dentro | conectar `pasosPerfil` y `pasosFigura` en los casos de uso; la vista ya pinta `pasos.area`, `pasos.promedio` o el arreglo de la figura con `listaPasos` y abre el panel |
| Pasos de la estimación | `tarjetaResultado` de `vistaEstimacion.js` | aviso fijo | decidir si la vista llama a `pasosEstimacion` (interfaz no puede importar `pasos.js`, design §2) o si se añade el campo a `ResultadoEstimacion` |
| KaTeX | elementos con `data-latex` (`.paso__texto`, `.modelo__funcion`, `.resultado-figura__formula`) | se ve el texto Unicode (R-09.8) | llamar a `formulasKatex.mejorarDentro(raiz)` (T-16) tras cada repintado y mostrar un solo W-08 (ver abajo) |
| Precarga de Plotly | `main.js` | no se precarga | llamar a `graficaPlotly.programarPrecarga(window)` al iniciar (design §13 y §14.3) |
| Página temporal de T-01 | enlace en el pie de `index.html` | sigue visible | quitarla con `prueba-recursos.*`, su entrada en `vite.config.js` y su comprobación en `verificar-dist.js` |
| Cifras de W-02, W-03 y W-04 | `listaAdvertencias` muestra `aviso.mensaje` tal cual | fracciones exactas | ver la fila de arriba (T-17, en `analizarPerfil`) |

**Cómo conectar la gráfica en T-17 (no se hizo en T-15):**

1. `analizarPerfil` (carpeta de A; `casos-de-uso/` puede importar `presentacion/`): tras calcular el rectángulo, `const grafica = datosGrafica({ modelo, intervalo, analisis, promedio, rectangulo, unidades })`; en el resultado, `grafica: grafica.datos`, y las advertencias pasan a ser `[...advertenciasDe(analisis, area), ...grafica.advertencias]`. Así W-07 por valores no finitos llega a la lista de advertencias que ya pinta `listaAdvertencias`, y los resultados exactos se conservan. Las pruebas de T-08 que esperan `grafica: null` deben actualizarse.
2. `main.js`: `import * as graficaPlotly from './adaptadores/graficaPlotly.js'`, `crearVistaPerfil({ …, grafica: graficaPlotly })` y `graficaPlotly.programarPrecarga(window)` después de `pintar()`.
3. `vistaPerfil.pintarGrafica` (carpeta de B): con resultado y adaptador, vaciar la figura (ya lo hace) y llamar a `grafica.dibujar(figura, resultado.grafica)` **también cuando `resultado.grafica` es `null`**: el adaptador muestra entonces W-07 en la figura (`etapa: 'datos'`). Así W-07 se ve igual venga de valores no finitos (lista de advertencias + figura) o de un fallo de carga o dibujo de Plotly (solo figura; si el equipo lo quiere también en la lista, la vista puede usar el `aviso` que devuelve la promesa). Sin resultado, se mantiene `limpiar` y el estado vacío; el texto «Gráfica pendiente de integración» debe sustituirse por uno definitivo. La vista no debe esperar la promesa para pintar los resultados.
4. Revisión de T-R3: con el fragmento `plotly-basic.min-*.js` bloqueado, la figura muestra W-07 y los resultados siguen visibles (comprobado en el montaje de T-15, §7).

**Cómo conectar KaTeX y los ejemplos en T-17 (no se hizo en T-16):**

1. `main.js`: `import { EJEMPLOS } from './ejemplos/ejemplos.js'` y pasar `catalogo: EJEMPLOS` a `crearVistaPerfil` en lugar de `CATALOGO_EJEMPLOS = []`. El selector `#perfil-ejemplos` aparece solo y llama a `cargarEjemplo`. La vista filtra `seccion === 'perfil'`: CR-09 y CR-10 (figuras) no se ven hasta que T-17 decida si `vistaFiguras.js` tiene su propio selector (hoy no lo tiene; `index.html` tampoco tiene el `<select>`). `cargarEjemplo` funciona con ellos (probado).
2. `main.js`: `import * as formulas from './adaptadores/formulasKatex.js'` y, al final de `pintar()`, `formulas.mejorarDentro(documento.getElementById('contenido'))`, sin esperar la promesa. Las fórmulas ya mejoradas no se vuelven a tocar (la vista solo recrea los elementos cuando cambia el resultado; un elemento ya marcado con `data-katex` puede saltarse si se quiere ahorrar trabajo).
3. **W-08 sin duplicar:** con el `aviso` del resumen, mostrar **un solo** aviso por sección, por ejemplo un `.aviso` con `role="status"` encima del procedimiento, y quitarlo cuando el siguiente resumen dé `aviso: null`. No añadir un aviso por fórmula. Los avisos de `mejorar` con `estado: 'cancelada'` no cuentan, así que un paso retirado al editar no deja W-08. Como `interfaz/` no puede importar el núcleo, el texto sale de `AVISO_W08` del resumen.
4. Revisión de T-R3: con el fragmento de KaTeX bloqueado, los pasos y la función se leen como texto y aparece W-08 (comprobado en el montaje de T-16, §7).

Siguiente tarea desbloqueada: T-17 (integración). Depende de T-08 y de T-12 a T-16, todas implementadas. El equipo decide cuál se autoriza; se sigue `tasks.md` §1, **una tarea por vez y solo con instrucción del equipo**.

## 7. Asuntos pendientes (no son fallos confirmados)

- **Revisión de R:** T-R1 (verificar `tests/casos-referencia.js`) y T-R6 (revisar los cambios de T-02 a T-14) y T-R3 (revisión manual de la interfaz: teclado, foco, 360 px, contraste y lectores de pantalla). R también debe verificar `tests/expresiones/tabla-gramatica.js` y las transcripciones a mano de T-08 (las antiderivadas de los CR como coeficientes y los valores calculados en las pruebas de casos de uso).
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
  - T-14, foco: tras un cálculo correcto va al encabezado de los resultados (design §14.5); tras uno fallido, al título del resumen de errores, porque no hay resultados. Al cambiar de sección (no al cargar la página) va al `h1` de la nueva sección. Cada sección tiene su `h1` y solo una es visible.
  - T-14, enlaces que no cambian el fragmento: los del resumen de errores y «Saltar al contenido» llevan el foco con `preventDefault`, porque un fragmento que no es una sección haría volver a «Perfil» (`seccionDesdeFragmento`). `navegacion.js` no se tocó.
  - T-14, errores: E-INT-01 y E-INT-02 se escriben bajo b y marcan a y b; E-MOD-04 y los errores sin campo solo van al resumen. Cada elemento del resumen muestra el código, la causa y la sugerencia (R-19.1). Al editar un campo, el estado retira los errores y la vista los limpia.
  - T-14, supuestos: el texto fijo de `index.html` resume R-17.5 (equivale a W-06 y W-05), porque `interfaz/` no puede importar `nucleo/errores.js`. El resultado muestra además los `supuestos` que devuelve `estimarMaterial`.
  - T-14, textos propuestos: notas de las tarjetas («Cuenta con signo…», «Suma de |Iₖ| por tramos…»), distintivos «Distinta de A_geo» y «Distinta de I» (texto, no solo color, R-23.4), estados vacíos y avisos de partes pendientes. La fuente de la estimación se describe desde el resultado vigente («Perfil f(x) = x²/4 + 2 en [0, 4] m», «Rectángulo medido en cm») antes de calcular; tras calcular se ve `descripcionFuente`.
  - T-14, figuras: en m se muestra una sola área (ya en m²); en cm, el área en cm² y en m². El botón de estimar siempre está habilitado porque toda figura calculada es apta (R-16.1). El selector de unidad dice «m (metros)» y «cm (centímetros)» para que no se corte en la columna de 360 px.
  - T-14, cálculo de estimación sin fuente: el botón «Calcular estimación» no se deshabilita; sin fuente da E-MOD-04 en el resumen, y la tarjeta de la fuente explica el motivo (incluido el E-MOD del perfil no apto) con enlaces a Perfil y Figuras.
  - T-14, repintado: el estado es inmutable, así que cada vista solo reconstruye sus resultados cuando cambian las referencias de `resultado` o `errores`; los campos se sincronizan sin mover el cursor (`fijarValor`).
  - T-14, comprobación en Chrome sin interfaz (build servido en local, guion temporal ya borrado): CR-01 (243/4 = 60.75 u², sin distintivos, W-03, botón deshabilitado con E-MOD-01), CR-05 (0 u² y 1 u² con los dos distintivos, W-01) y CR-03 (40/3 ≈ 13.3333 m², rectángulo equivalente; estimación con Q666.67 y Q733.33); «Usar esta área» lleva a `#estimacion`; «Atrás» vuelve a Perfil; editar b retira la fuente y la estimación; errores por campo con `aria-invalid="true"` y `aria-describedby`; resumen con `role="alert"`; círculo r = 5 m da 25π ≈ 78.5398 m² y el rectángulo de 200 × 150 cm, 30000 cm² y 3 m². A 360 px, `scrollWidth` = 360 en las tres secciones y con errores. Contraste mínimo medido en los textos visibles: 5.05:1. Tabulación: saltar → 3 enlaces → función → a → b → interpretación → Calcular, todos con contorno de 3 px. No se probaron lectores de pantalla ni zoom; eso queda para T-R3.
- **Revisión visual de T-14 (commit `13c6c5c`; apariencia aprobada por el equipo el 22 de octubre, que pide conservarla en las tareas siguientes):**
  - Contratos sin cambios: `estado.js`, `navegacion.js`, los casos de uso, `formato.js` y los ids de los campos y de los mensajes de error se conservan. Cambios de HTML que las vistas ya siguen: el tipo de figura es un grupo de radios `name="tipo"` dentro de `<fieldset id="figura-tipo">` (antes era un `<select>`); la gráfica es `#perfil-grafica`, fija junto a los resultados; los detalles del perfil van en `#perfil-detalles`; el enlace activo ahora es `.lateral__enlace`.
  - `cifra` (en `vistaComun.js`) reparte en dos líneas el mismo texto que da `cantidadTexto`: fracción y decimal; k·π y su decimal; o el decimal aproximado y su cota. Usa solo funciones de `formato.js`, así que el redondeo sigue en un único sitio. Los costos usan `quetzalesCantidad` en una línea.
  - El panel de procedimiento queda cerrado mientras no hay pasos (insignia «Pendiente de integración»); con pasos reales se abre por defecto.
  - Tipografía: los títulos usan «Palatino Linotype» (Windows), con Georgia como respaldo; las fórmulas, «Cambria Math». No hay fuentes descargadas.
  - Movimiento: la sección entra con opacidad y 8 px de desplazamiento (240 ms), las tarjetas de resultado en 200 ms, la anchura del menú en 220 ms; las cifras no se animan. `prefers-reduced-motion` lo anula todo. Se quitó el fondo fijo (`background-attachment`) para no costar en la laptop.
  - Comprobación en Chrome sin interfaz (guion temporal ya borrado), a 1366 px y a 360 px: errores por campo y foco al resumen; CR-05 con los dos distintivos y la banda deshabilitada (E-MOD-01); CR-03 con banda habilitada, estimación con Q666.67 y Q733.33 y foco a cada encabezado; «Atrás»; figuras con flechas del teclado (rectángulo → triángulo), círculo 25π ≈ 78.5398 m² y rectángulo 200 × 150 cm = 3 m²; menú contraído a 80 px con `aria-expanded="false"`, «Expandir menú» y la etiqueta visible al enfocar; panel móvil con `aria-expanded`, `inert`, foco al enlace actual, Tab que no sale del panel, Escape y fondo que cierran y devuelven el foco, y enlace que cierra y lleva al título; `scrollWidth` = 360 en las tres secciones, con resultados y con errores; contraste mínimo medido 4.81:1. No se probaron lectores de pantalla, zoom ni la laptop de exposición.
- **T-15, decisiones que R debe confirmar** (design §10 y §14.3 no se cambiaron):
  - Firma: `datosGrafica` recibe un objeto con los campos de `ResultadoPerfil`, no los cuatro argumentos de design §4 (`modelo, intervalo, analisis, promedio`), porque también necesita `rectangulo` (para no decidir por su cuenta si hay rectángulo) y `unidades` (ejes y etiqueta del promedio). Devuelve `{ datos, advertencias, motivo }` en vez de `DatosGrafica` a secas, para poder entregar W-07; `ResultadoPerfil.grafica` quedará `null` cuando haya W-07.
  - Campos añadidos a `DatosGrafica`: `ceros[].etiqueta` (el texto flotante necesita `formato.js`, que el adaptador no puede importar), `descripcion` (alternativa textual, R-23) y la forma `rango: { x, y }`, que design §10 no detalla.
  - Regiones: 101 puntos uniformes **más** las tangencias interiores del tramo (p. ej., x = 1 en CR-07 y CR-30), para que el relleno toque el eje donde lo toca la curva. Si f ≡ 0, hay una región de signo 0, que el adaptador no sombrea.
  - La recta y = f_prom cruza todo el ancho dibujado (R-10.3 habla de «la recta»); el rectángulo va de a a b.
  - Además de la leyenda, las regiones bajo el eje llevan trama diagonal, otra señal que no depende del color (R-10.2). No hay anotaciones «+» ni «−» (T-D3).
  - Solo los ceros tienen texto flotante; la curva no, para no mostrar decimales redondeados por Plotly fuera de `formato.js`.
  - El texto de W-07 está copiado en `AVISO_W07`, porque `adaptadores/` no puede importar el núcleo (design §2); una prueba lo compara con el catálogo.
  - Colores: turquesa `--area` (sobre el eje), rosa `#be123c` con trama (bajo el eje), ámbar `--promedio` (recta), violeta `--integral` (rectángulo) y marino (curva y ejes), copiados de `app.css` porque Plotly no lee variables CSS. No se tocó `app.css`.
- **T-15, revisión en Chrome sin interfaz** (build temporal con un montaje que repite `main.js`, pasa el adaptador a la vista y añade `datosGrafica` al resultado como hará T-17; servido con `vite preview`; montaje, guion y capturas ya borrados). Observado:
  - Precarga correcta en 157 a 183 ms. Plotly queda en su propio fragmento (`plotly-basic.min-*.js`, 1.16 MB).
  - CR-03 a 1366 px: región «Sobre el eje (+)» de 101 puntos, curva de 403 puntos (401 + a + b), recta «f_prom = 10/3 m» con su etiqueta, rectángulo punteado, títulos «x (m)» y «f(x) (m)», leyenda con f(x), la recta y el rectángulo; sin barra de herramientas ni enlaces; `role="img"` con la descripción.
  - Menú lateral: al contraerlo, la figura pasó de 557 a 708 px y el SVG de Plotly de 509 a 660 px; al expandirlo volvió a 509 px. A 1000 px de ventana, 556 px. A 360 px, 261 × 340 px, área de trazado de 189 px de alto, `scrollWidth` 345 (sin desplazamiento horizontal). Con el primer alto probado (mínimo 240 px), la leyenda de cuatro filas dejaba el trazado demasiado bajo; por eso el mínimo es 340 px.
  - CR-05, CR-14, CR-30 y CR-15: regiones por signo con la leyenda una vez por signo, trama en las regiones negativas, marcadores en x = 0; −1, 0, 1; −2, 1 (tangencia) y «x ≈ 1.4142».
  - Al editar b, la vista llamó a `limpiar`: ningún `.js-plotly-plot` en la figura y vuelve el estado vacío.
  - Carrera con un adaptador de carga lenta (400 ms): «Preparando la gráfica…» durante la carga; `limpiar` a los 100 ms → `cancelada`, figura vacía al terminar la carga. Sin limpiar, el mismo adaptador dibujó.
  - `(((1000000^3)^3)^3)^3` en [0, 1]: W-07 en la lista de advertencias y resultados visibles; `dibujar(figura, null)` → `fallida`, `etapa: 'datos'`, con el aviso W-07 en la figura.
  - Fragmento de Plotly bloqueado (`Network.setBlockedURLs`, página recargada): `precargar` → `false`; al calcular CR-03, la figura muestra «Gráfica no disponible» y «W-07: …» con `role="status"`, y las tres tarjetas de resultados siguen visibles. Un segundo cálculo (CR-05) volvió a intentar la carga y volvió a mostrar W-07. Ningún `unhandledrejection` en toda la revisión; los únicos `console.error` son los del adaptador al informar W-07.
  - No se probó con lectores de pantalla, con zoom ni en la laptop de exposición.
- **T-16, decisiones que R debe confirmar** (design §14.4 y requirements R-13 no se cambiaron):
  - Interpretación de los ejemplos de perfil: física donde requirements §14 fija el resultado «en metros» (CR-02 «perfil válido», CR-05 y CR-06 «E-MOD-02»; CR-03 la fija la fuente); abstracta en CR-01 (fijada) y en CR-07, CR-14 y CR-15 (no fijada). I, A_geo y f_prom no dependen de ella. Así el selector muestra los tres motivos de aptitud: apta (CR-02, CR-03), E-MOD-02 (CR-05, CR-06) y E-MOD-01 (los abstractos).
  - Orígenes: «Ejercicio de clase» para CR-01 (P1-D) y CR-02 (P1-A); «Caso práctico simulado» para CR-03 (PC §7.3); «Caso de comprobación» para el resto (PC §6.2, §7.4 y CP del formulario §13). Además de los ocho de R-13.5 se incluyen CR-14 y CR-15 (varios cambios de signo y cero irracional).
  - Solo CR-03 trae precio y adicional (Q50/m² y 10 %, simulados en el formulario §7); no hay ningún precio real. Al cargarlo, `datosSimulados` queda en true y la estimación añade W-05.
  - `titulo` empieza por el origen, para que el selector lo rotule (R-13.1). En la columna del formulario a 1366 px, los títulos largos se ven cortados en el `<select>` cerrado (la lista abierta los muestra completos); se acortaron los de CR-02 y CR-03.
  - Estados añadidos a design §14.4: `omitida` (sin LaTeX, sin W-08) y `cancelada`. `mejorarDentro` y `cancelar` son funciones añadidas para cubrir el resumen con un solo W-08 y las mejoras pendientes. El fallo del CSS de KaTeX también da W-08: sin su CSS, KaTeX mostraría la fórmula duplicada (HTML y MathML).
- **T-16, revisión en Chrome sin interfaz** (build temporal con un montaje que repite `main.js`, pasa `EJEMPLOS` a la vista y llama a `mejorarDentro` tras cada pintado; montaje, guion y capturas ya borrados). Observado:
  - El selector «Ejemplo» aparece con los 8 ejemplos de perfil, rotulados por origen. Elegir CR-03 rellena «2 + x^2/4», 0, 4 y «Perfil físico», y muestra 40/3 m², 40/3 m² y 10/3 m; CR-01 muestra 243/4 u², 243/4 u² y 81/4 u.
  - `.modelo__funcion` quedó mejorada con KaTeX (`.katex` con su `.katex-mathml`; familia calculada `KaTeX_Main`, servida desde `dist/assets`), resumen `{ total: 1, mejoradas: 1, aviso: null }`. La apariencia aprobada se conserva; sin desplazamiento horizontal a 1366 px.
  - Una mejora sobre un párrafo retirado antes de terminar devolvió `cancelada` y el párrafo siguió con su texto, fuera del documento.
  - Con KaTeX y su CSS bloqueados (`Network.setBlockedURLs`, página recargada): CR-05 se calcula, la función se ve como texto «f(x) = x», el resumen da `fallidas: 1` y un solo W-08; el único `console.error` es el del adaptador («Unable to preload CSS…»); ningún `unhandledrejection`.
  - No se probaron los pasos con KaTeX en pantalla, porque todavía son `null` (T-17); sí se comprobó en Node que todo su LaTeX es válido para KaTeX. Tampoco lectores de pantalla, zoom ni la laptop.
- **Observación fuera de T-15 (para T-17 o T-R3):** con `(((1000000^3)^3)^3)^3`, el número de 487 cifras desborda en horizontal la tarjeta de resultados (`.modelo__funcion` y `.valores`; `scrollWidth` 4694 a 1366 px). Es del CSS y las vistas de T-14, no de la gráfica; no se cambió.
- **Textos desactualizados no autorizados para cambio:** `design.md` §18, regla 8, y `requirements.md` §0 («Estado del repositorio») describen el estado anterior a los commits. `AGENTS.md` ya recoge la regla vigente, aunque dice que la rama «ya contiene T-01 a T-06»; hoy contiene T-01 a T-16.

## 8. Intención visual (T-14 y su revisión visual)

**Revisión visual (commit `13c6c5c`; aprobada por el equipo el 22 de octubre).** Hay que conservar esta apariencia en las tareas siguientes: menú lateral expandible, fondo con trama suave, tarjetas e ilustraciones geométricas. La gráfica de T-15 la respeta: papel transparente sobre la trama de `.grafica`, colores de `app.css` y fuentes del sistema. Se tomaron como referencia de apariencia las imágenes que aportó el equipo (tarjetas azules, gráfica tipo plano técnico, navegación lateral), sin sus funciones antiguas: solo Perfil, Figuras y Estimación; sin rótulos, terrenos, áreas entre curvas, reportes ni trapecio. Composición aplicada:
- **Menú lateral** marino con marca, iconos SVG propios y las tres secciones; la activa lleva `aria-current="page"`, fondo cian translúcido y una barra cian. «Contraer menú» lo deja en una franja de iconos de 80 px (transición de la anchura de la rejilla); el nombre sigue en el DOM y aparece como etiqueta al pasar o enfocar. Por debajo de 768 px hay una barra superior con botón de menú (`aria-expanded`, `aria-controls`) que abre un panel con fondo; la página, la barra y «Saltar al contenido» quedan `inert`, el foco entra a la sección actual y vuelve al botón con Escape, con el botón de cierre o al tocar el fondo.
- **Cabecera de sección**: etiqueta numerada («01 · Integral definida»), título con serifa del sistema, explicación breve e ilustración SVG decorativa (`aria-hidden`); la trama cuadriculada solo aparece en su mitad derecha.
- **Perfil**: formulario fijo (sticky) a la izquierda, con la interpretación como dos tarjetas de radio y el prefijo «f(x) =» unido al campo; a la derecha, resultados, gráfica y detalles. Las tres tarjetas de valor muestran la fracción grande y el decimal debajo (`cifra` de `vistaComun.js`, con textos de `formato.js`). El procedimiento va en un `<details>` y el acceso a la estimación en una banda oscura con el botón claro.
- **Figuras**: selector con tres tarjetas dibujadas (radios nativos, flechas del teclado, marca ✓ además del color); medidas y resultado lado a lado.
- **Estimación**: banda oscura con la fuente (o su motivo), parámetros y supuestos lado a lado, y resultados en cuatro indicadores: área útil, área con adicional, costo base y costo estimado (destacado). El adicional y el precio aplicados aparecen como etiquetas.

**Dirección original de T-14 (sigue vigente):** fondo claro, azul marino, tarjetas blancas y acentos cian o turquesa; animaciones breves; fuentes del sistema; ningún recurso externo.

Dirección aprobada por el equipo para T-14 y aplicada: fondo claro, navegación azul oscuro, tarjetas blancas y acentos turquesa; solo tres secciones (Perfil, Figuras y Estimación). El perfil es el protagonista: tres tarjetas de valor (integral en violeta, área en turquesa y promedio en ámbar, cada una con nombre y símbolo en texto), una zona amplia para la gráfica y un bloque para el procedimiento. Fuentes del sistema, sin recursos externos, animaciones de entrada breves que se anulan con `prefers-reduced-motion`. Respeta design §14.5 y R-23. Los ajustes visuales siguen siendo lo segundo en el orden de recorte (design §16).

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
