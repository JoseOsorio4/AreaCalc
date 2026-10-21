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
- Rama: **`avance-t04`**. El nombre es histórico: empezó como respaldo de T-04 y ya contiene T-01 a T-07, T-09 y T-10 (T-08 sigue pendiente).
- Último trabajo: el commit «T-10: normalización al modelo validado con pruebas», encima de `dac0250` (T-09). Para ver los SHA: `git log --oneline -n 5`.
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
| T-08 Casos de uso | Sin iniciar; sus dependencias (T-06, T-07 y T-10) ya están | — |
| T-09 Analizador léxico y sintáctico | Implementada y probada | `dac0250` |
| T-10 Normalización al modelo validado | Implementada y probada | commit «T-10: …» |
| T-11 en adelante | Sin iniciar | — |

Última ejecución, con T-10: `npm test` dio **766/766** pruebas en 16 archivos (290 del núcleo y la arquitectura, 95 del léxico, 174 de la sintaxis y 207 de la normalización), con código de salida 0, y `npm run build` fue correcto, también con código 0 (solo el aviso esperado por el tamaño de Plotly, design §13).

**La revisión independiente de R no se ha hecho** para T-02 a T-07, T-09 ni T-10: T-R1 y T-R6 siguen pendientes. Implementada no equivale a revisada (tasks.md §0).

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

**Pruebas** (`tests/`): `casos-referencia.js` (valores esperados transcritos, sin importar `src/`), `arquitectura.test.js`, `propiedades.test.js` (parte de T-04), `nucleo/` con una prueba por módulo y `expresiones/` con `lexico.test.js`, `sintaxis.test.js`, `normalizar.test.js` y `tabla-gramatica.js`. Esta última es la **tabla reconstruida para pruebas** de T-10 (60 entradas válidas y 84 inválidas, cada una con su fuente); no procede del prototipo de design §0.

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
- Las advertencias W-02, W-03, W-04 y W-09 se deducen de estos campos; las generará `analizarPerfil` en T-08.
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
- **ModeloValidado** (`interpretarFuncion(texto)`): `{ textoOriginal, polinomio, huboDesarrollo, textoNormalizado, latexNormalizado }`, congelado. `huboDesarrollo` es verdadero si un producto o una potencia tiene un factor que es una suma o resta, aunque lleve signos delante. El texto y el LaTeX salen del polinomio, al estilo de design §14.1: potencias descendentes, «−» (U+2212) en el texto, y monomios como `x²/4`, `5x/3` o `\frac{5x}{3}`. Ejemplos: «x³ − 1» y «x³ − 4x²/3 − 5x/3 + 2/3».

## 6. Siguiente tarea según las dependencias: T-08

El núcleo de A (T-02 a T-07) y el analizador de B (T-09 y T-10) están implementados, así que **T-08 · Casos de uso y pruebas globales** (carpeta de A: `src/casos-de-uso/`, `tests/casos-de-uso/`, `tests/propiedades.test.js` y la versión completa de `tests/arquitectura.test.js`) ya tiene todas sus dependencias. `analizarPerfil` debe usar `interpretarFuncion(texto)` para la función y `leerIntervalo` para a y b, acumular sus errores (design §11) y capturar E-SIS-01 y E-SIS-02. Sus criterios están en `tasks.md`, en el bloque que empieza por `**T-08 ·`.

También están desbloqueadas T-11 (formato, depende de T-02), T-13 (estado) y T-15 (datos de la gráfica). El equipo decide cuál se autoriza; se sigue `tasks.md` §1, **una tarea por vez y solo con instrucción del equipo**.

## 7. Asuntos pendientes (no son fallos confirmados)

- **Revisión de R:** T-R1 (verificar `tests/casos-referencia.js`) y T-R6 (revisar los cambios de T-02 a T-07, T-09 y T-10). R también debe verificar `tests/expresiones/tabla-gramatica.js`, porque sus valores se derivaron a mano.
- **Tabla del prototipo para T-10:** las «33 entradas válidas y 59 inválidas del prototipo» de tasks T-10 no están en el repositorio. Por autorización del equipo, T-10 usa en su lugar una **tabla reconstruida para pruebas** (60 válidas y 84 inválidas), derivada de requirements Tabla 9.1, Tabla 9.2, §10 y §14, y de design §5.2 a §5.4 y §14.1. Las especificaciones no se cambiaron: tasks T-10 sigue citando el prototipo.
- **Escritura de polinomios en dos capas:** `textoNormalizado` y `latexNormalizado` se escriben en `normalizar.js` porque `expresiones/` no puede importar `presentacion/` (design §2). T-11 (`formato.js`) también tendrá que escribir polinomios, como la antiderivada. Para no duplicar reglas, el equipo puede autorizar mover esa escritura a `nucleo/`, o aceptar dos implementaciones con las mismas pruebas de estilo.
- **Área de los 400 polinomios:** design §15 pide comprobar también el área calculada con los cortes conocidos en la propiedad de raíces racionales. Está prevista para T-08 (`tests/propiedades.test.js`).
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
- **Textos desactualizados no autorizados para cambio:** `design.md` §18, regla 8, y `requirements.md` §0 («Estado del repositorio») describen el estado anterior a los commits. `AGENTS.md` ya recoge la regla vigente, aunque dice que la rama «ya contiene T-01 a T-06»; hoy contiene T-01 a T-07, T-09 y T-10.

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

`npm ci` instala exactamente lo de `package-lock.json`. **No** usar `npm install` para actualizar versiones. En Windows, si PowerShell bloquea `npm.ps1`, usar `cmd` o `npm.cmd`. En la terminal de Kiro, `npm test` a veces devolvía el control antes de terminar; funcionó lanzarlo como proceso en segundo plano y leer su salida. Para confirmar el código de salida se añade una impresión al final del mismo comando, por ejemplo `npm.cmd test; "CODIGO_SALIDA=$LASTEXITCODE"`, y se espera a que aparezca esa línea.

## 10. Reglas de continuidad

1. Leer primero este relevo, `AGENTS.md` y las especificaciones.
2. Comprobar la rama (`avance-t04`), el último commit y `git status` antes de editar.
3. No dar por terminada una tarea que no esté implementada y probada, ni atribuir a R revisiones que no hizo.
4. No iniciar otra tarea sin instrucción del equipo; implementar una por vez.
5. No cambiar especificaciones ni alcance sin autorización explícita.
6. Commit y push normal solo cuando el equipo lo pida; nunca PR, merge a `main` ni force push sin autorización.
