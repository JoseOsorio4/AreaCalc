# ÁreaCalc — Diseño técnico (Etapa B)

> **Estado:** v0.5. **Etapa B cerrada** (requirements C-10 a C-12). La v0.3 añadió el registro único de raíces (§8) y el plan de 59 h (§16). La v0.5 aplica D-09: no hay tope de coeficientes, A se calcula sobre la parte primitiva y se precisa cuándo se agota el presupuesto (§8). También separa T-01 (entorno de Kiro Web) de la prueba en la laptop (§13, §16). · **Fecha:** 19 de octubre de 2026
> **Cambios de la v0.2:** §8 reconoce exactamente toda raíz racional (CR-31: x − 1/3 en [0, 1], área 5/18); §5 asigna E-EXP-10 a `x^4` y alinea con requirements §10 los códigos de `=`, unidades y producto implícito. El detalle está en §20.
> **Base:** `requirements.md` v0.5 y `docs/formulario-matematico.md` v0.4.
> Este documento **no autoriza implementar**. `tasks.md` (Etapa C) se redactará después de aprobar el diseño.

## 0. Verificaciones realizadas en esta etapa

| Afirmación usada en el diseño | Fuente consultada | Estado |
|---|---|---|
| Vite 7 exige Node.js 20.19+ o 22.12+ | página de `create-vite` en npm; anuncio de Vite 7 | Verificada (fragmento de búsqueda) |
| `vite preview` sirve `dist/` en `http://localhost:4173`; es para revisar el build en local, no un servidor de producción | documentación de Vite, «Deploying a Static Site» | Verificada |
| Si el puerto está ocupado, la vista previa prueba el siguiente puerto libre | documentación de Vite, «Preview Options» | Verificada |
| Vitest requiere Vite 6 o superior y Node 20 o superior; `vitest run` ejecuta una sola vez | guía de vitest.dev; espejo de su documentación | Verificada (fragmento) |
| `plotly.js-basic-dist-min` contiene las trazas bar, pie y scatter; npm indica unos 1.04 MB | npm | Verificada (fragmento) |
| La serie publicada de Plotly es la 3.x, y la traza scatter está en todos los paquetes | README de `dist` y `CUSTOM_BUNDLE.md` de plotly.js | Verificada (fragmento) |
| KaTeX lanza `ParseError` ante LaTeX inválido, porque `throwOnError` vale `true` por defecto | katex.org, «Options» | Verificada |
| Math.js no integra simbólicamente y tiene avisos de seguridad en 2026 | Etapa A | Verificada |
| **Versiones exactas vigentes en npm** | el registro npm devolvió HTTP 403 desde el sandbox | **No verificadas.** Se fijan al instalar, en T-01 (§13). |
| Formas (*shapes*) y anotaciones en el paquete *basic*; importación del paquete de Plotly desde Vite; copia de las fuentes de KaTeX en `dist/` | — | **Por verificar** en T-01, en el entorno de Kiro Web |
| Reglas de D-09 (§8): parte primitiva, presupuesto agotado y entradas sin tope | prototipo desechable v5, en `/tmp` | Validado: CR-32 a CR-36 dan lo esperado; se mantienen CR-01, CR-04 a CR-07, CR-14, CR-15 y CR-28 a CR-31; 500 polinomios con raíces racionales (100 de ellos multiplicados por factores de hasta 10⁸⁰) dan todas sus raíces exactas, sin ningún E-SIS-01. **No es código del producto.** |
| Método de análisis de ceros (§8, v0.2) | prototipo desechable v3 en Python, en `/tmp` y fuera del repositorio | Validado: 10 casos CR (incluido CR-31), 5 casos con raíces racionales, 3 con raíces irracionales, 400 polinomios con raíces racionales aleatorias y 300 polinomios aleatorios frente a un oráculo numérico independiente. Resultados en §8. **No es código del producto.** |
| Gramática y códigos de error (§5, v0.2) | prototipo desechable de la gramática, en `/tmp` | Validado: 33 entradas válidas dan los coeficientes esperados y 59 inválidas dan el código que fija requirements (Tabla 9.1, §10, CR-13, CR-21), incluido `x^4` → E-EXP-10. **No es código del producto.** |

`Markdown pegado.md` no llegó a esta sesión. Por la regla del equipo, prevalecen las confirmaciones C-01 a C-09 (`requirements.md` §16).

**T-01** es la primera tarea de `tasks.md`: base del proyecto, verificada en el entorno de Kiro Web. La prueba en la laptop Windows es la tarea T-R5, a cargo del equipo (C-12).

**Limitación del entorno:** el 19 de octubre, el registro npm devolvió HTTP 403 desde este entorno de Kiro Web, incluso para consultas de solo lectura. Si sigue así cuando se autorice T-01, la instalación, las pruebas y el build se harán en la computadora de A, y Kiro revisará los resultados (`tasks.md`, T-01).

## 1. Decisión tecnológica

**Decisión (C-05, D-01):** opción A: Vite, HTML5, CSS3 y JavaScript modular (módulos ES, ES2022), con Plotly.js, KaTeX y Vitest. No se usan React, TypeScript, Math.js ni un backend.

**Justificación:**

- El alcance es de tres secciones con estado simple y en memoria.
- Un *framework* añadiría conceptos (componentes, ciclo de render, *hooks*) que el equipo tendría que explicar sin un beneficio proporcional.
- Los contratos (§10) se documentan en tablas y en comentarios JSDoc `@typedef`. Los comentarios sirven de documentación para el equipo y para Codex; no hay verificación de tipos en la compilación.
- `BigInt` es parte del JavaScript estándar en los navegadores modernos y permite la aritmética exacta (§6) sin dependencias.

**Dependencias.** No se permite ninguna otra sin aprobación: ni jsdom, ni *linters*, ni frameworks CSS, ni fuentes remotas.

| Paquete | Tipo | Necesidad | Responsabilidad | Complejidad que introduce | Capacidad verificada | Alternativa más simple |
|---|---|---|---|---|---|---|
| `vite` | desarrollo | Servidor de desarrollo, build estático y vista previa local | Construir y servir | Baja: configuración mínima | build y `preview` (§0) | Módulos ES nativos sin empaquetador. Se descarta porque las dependencias de npm necesitan resolución de módulos. |
| `vitest` | desarrollo | Pruebas del núcleo y de los casos de uso | Ejecutar pruebas en Node, sin DOM | Baja | `vitest run` | `node:test`, integrado en Node. Vitest se conserva por la decisión del equipo y su integración con Vite. |
| `plotly.js-basic-dist-min` | producción | Curva, regiones sombreadas, línea de promedio y rectángulo | Solo el adaptador de gráficas | Media: paquete de unos 1 MB y API declarativa | trazas scatter, bar y pie | Gráfica SVG propia, como contingencia si falla la prueba de humo (§16) |
| `katex` | producción | Fórmulas legibles | Solo el adaptador de fórmulas | Baja | `ParseError` controlable | Texto Unicode, que siempre se muestra como respaldo (R-09.8) |
| `mathjs` | — | **No se usa** (D-03, §5) | — | — | — | Analizador propio |

## 2. Arquitectura y dependencias permitidas

```
            ┌──────────────────────────── interfaz/ (DOM, eventos, estado en memoria)
            │                 │                    │
            ▼                 ▼                    ▼
     casos-de-uso/       adaptadores/          ejemplos/
       │       │       (Plotly, KaTeX)      (datos de entrada)
       ▼       ▼
 expresiones/  presentacion/  (formato, pasos, datos de gráfica; sin DOM)
       │       │
       ▼       ▼
          nucleo/   (matemática pura: racionales, polinomios, integral, ceros, áreas, unidades, materiales)
```

**Regla:** las dependencias apuntan hacia adentro. El núcleo no conoce nada exterior.

| Módulo (origen) | Puede importar | No puede importar |
|---|---|---|
| `nucleo/` | otros archivos de `nucleo/` | todo lo demás; `document`, `window`, Plotly, KaTeX |
| `expresiones/` | `nucleo/` | `presentacion/`, `interfaz/`, `adaptadores/`, DOM |
| `presentacion/` | `nucleo/` | `interfaz/`, `adaptadores/`, DOM, Plotly, KaTeX |
| `casos-de-uso/` | `nucleo/`, `expresiones/`, `presentacion/` | `interfaz/`, `adaptadores/`, DOM |
| `adaptadores/` | `plotly.js-basic-dist-min`, `katex`, DOM del contenedor recibido | `nucleo/`: recibe datos ya calculados y no calcula |
| `interfaz/` | `casos-de-uso/`, `adaptadores/`, `ejemplos/`, `presentacion/formato.js` | operaciones matemáticas sobre los resultados; solo los muestra |
| `ejemplos/` | nada | — |

Una **prueba de arquitectura** automatizada (§15) revisa los `import` y las palabras prohibidas. Así la regla no depende solo de la disciplina.

**Puntos únicos de fallo de una aplicación estática y su respuesta:**

| Falla | Respuesta del diseño |
|---|---|
| Plotly no carga o falla al dibujar | El fragmento se carga de forma diferida y dentro de `try/catch`. Se muestra W-07 y se conservan los resultados y los pasos (R-10.6). |
| KaTeX no carga o rechaza una fórmula | Primero se muestra el texto y KaTeX solo lo mejora. Si falla, queda el texto y se muestra W-08. |
| Error de programación en el núcleo | El caso de uso lo captura y devuelve E-SIS-02 sin resultados parciales. La aplicación sigue operativa. |
| Un cálculo agota su presupuesto de iteraciones | El caso de uso devuelve E-SIS-01. |
| El servidor de vista previa no arranca en la laptop | Plan de contingencia en §13: puerto alternativo, segunda computadora con el build y capturas en el documento. |
| No hay internet | No hay servicios remotos. Todos los recursos están empaquetados (§13). |

## 3. Árbol de archivos y responsabilidades

```
AreaCalc/
├── index.html                 Estructura HTML5: encabezado, <nav>, tres <section> y <main>
├── package.json               Scripts dev, build, preview y test; dependencias de §1
├── package-lock.json          Versiones exactas (se genera en T-01)
├── vite.config.js             base './'; Vitest con environment 'node'
├── README.md                  Instalar, construir, servir sin internet, probar y limitaciones
├── AGENTS.md                  Reglas para Codex (§18); se crea en T-01 tras aprobar el diseño
├── docs/
│   ├── formulario-matematico.md
│   ├── arquitectura.md        Etapa C: resumen de entrega a Codex
│   └── revision-manual.md     Lista de comprobación de la interfaz (R-25.4)
├── src/
│   ├── main.js                Punto de entrada: crea el estado, conecta vistas y precarga Plotly
│   ├── estilos/app.css        Variables de color con contraste AA, diseño adaptable, :focus-visible
│   ├── nucleo/
│   │   ├── racional.js        Fracciones exactas con BigInt (§6)
│   │   ├── polinomio.js       Polinomios con coeficientes racionales: aritmética, derivada, división, mcd (§7)
│   │   ├── integral.js        Antiderivada, F(b), F(a), I y desglose por términos (§7)
│   │   ├── ceros.js           Análisis de signo: mcd, Sturm, bisección exacta, clasificación (§8)
│   │   ├── area.js            A_geo por tramos y cota de aproximación (§9)
│   │   ├── promedio.js        f_prom y rectángulo equivalente (§7)
│   │   ├── geometria.js       Rectángulo, triángulo, círculo (k·π) y trapecio (§9)
│   │   ├── unidades.js        Unidades por interpretación; conversiones cm↔m y cm²↔m² (§9)
│   │   ├── materiales.js      Área estimada, costo base y costo estimado (§9)
│   │   ├── numeros.js         Texto de un campo numérico → Racional, con reglas por campo (§11)
│   │   └── errores.js         Catálogo de códigos y fábrica de errores y advertencias (§11)
│   ├── expresiones/
│   │   ├── lexico.js          Texto → fichas con posición (§5)
│   │   ├── sintaxis.js        Fichas → árbol, por descenso recursivo (§5)
│   │   └── normalizar.js      Árbol → modelo validado; límites de grado y división (§5)
│   ├── presentacion/
│   │   ├── formato.js         Racional → texto o LaTeX; decimales, «=» o «≈», unidades, Q (§14)
│   │   ├── pasos.js           Procedimientos a partir de los resultados del núcleo (§14)
│   │   └── datosGrafica.js    Modelo y análisis → arreglos numéricos para dibujar (§14)
│   ├── casos-de-uso/
│   │   ├── analizarPerfil.js  Valida, calcula, decide si es apto para estimar, genera pasos y gráfica
│   │   ├── calcularFigura.js  Valida dimensiones, calcula el área y la convierte a m²
│   │   └── estimarMaterial.js Valida precio y adicional, y calcula la estimación desde una fuente vigente
│   ├── interfaz/
│   │   ├── estado.js          Estado en memoria y transiciones puras, con invalidación (§12)
│   │   ├── navegacion.js      Secciones por fragmento de URL (#perfil, #figuras, #estimacion)
│   │   ├── vistaPerfil.js     Formulario, resultados, pasos y gráfica del analizador
│   │   ├── vistaFiguras.js    Formulario y resultado de las figuras
│   │   ├── vistaEstimacion.js Fuente, precio, adicional y supuestos
│   │   └── vistaComun.js      Mensajes por campo, resumen de errores, foco y regiones aria-live
│   ├── adaptadores/
│   │   ├── graficaPlotly.js   DatosGrafica → Plotly, con carga diferida, limpieza y aviso de falla (§14)
│   │   └── formulasKatex.js   LaTeX → KaTeX con texto de respaldo (§14)
│   └── ejemplos/ejemplos.js   Entradas de los ejemplos, sin resultados (R-13.3)
└── tests/
    ├── casos-referencia.js    Valores esperados transcritos del formulario y de requirements §14
    ├── nucleo/                Una prueba por módulo del núcleo
    ├── expresiones/           Tabla de gramática: válidos → coeficientes; inválidos → códigos
    ├── casos-de-uso/          CR-01 a CR-23 y CR-27 a CR-31, de principio a fin y sin DOM
    ├── presentacion/          Formato y pasos
    ├── interfaz/estado.test.js Transiciones e invalidación (CR-22)
    ├── propiedades.test.js    Relaciones de R-25.3 y oráculo numérico (§15)
    └── arquitectura.test.js   Dependencias permitidas y palabras prohibidas (§2)
```

Las responsabilidades no se reparten en una clase por fórmula. Cada archivo agrupa funciones afines.

## 4. Flujo de datos y ubicación de cada cálculo

```
Usuario ─► vistaPerfil (envío del formulario) ─► estado.calcularPerfil()
              │
              ▼
   casos-de-uso/analizarPerfil(EntradaPerfil)
     1. nucleo/numeros       a, b          → Racional, o E-NUM / E-INT
     2. expresiones/*        texto de f    → ModeloValidado, o E-EXP
     3. nucleo/integral      F, F(b), F(a), I y desglose
     4. nucleo/ceros         AnalisisSigno (ceros, tramos, no negatividad)
     5. nucleo/area          A_geo (exacta o aproximada con cota)
     6. nucleo/promedio      f_prom = I/(b − a); rectángulo equivalente si corresponde
     7. aptoEstimacion       unidades + análisis + A_geo  (E-MOD-01/02/03)
     8. presentacion/pasos   Paso[] a partir de 3–6, sin recalcular
     9. presentacion/datosGrafica  DatosGrafica a partir de 2, 4 y 6
              │
              ▼  ResultadoPerfil  o  errores[]
   estado.perfil.resultado ─► render ─► vistaPerfil
        ├─ valores con presentacion/formato
        ├─ pasos con adaptadores/formulasKatex (texto primero)
        └─ gráfica con adaptadores/graficaPlotly (W-07 si falla)
```

| Cálculo | Único lugar | Función propuesta |
|---|---|---|
| Texto numérico → Racional exacto | `nucleo/numeros.js` | `leerNumero(texto, reglasDelCampo)` |
| Texto de la función → polinomio validado | `expresiones/` | `interpretarFuncion(texto)` |
| Antiderivada, F(b), F(a) e I | `nucleo/integral.js` | `integrarDefinida(polinomio, a, b)` |
| Ceros, multiplicidades y tramos | `nucleo/ceros.js` | `analizarSigno(polinomio, a, b)` |
| A_geo y su cota | `nucleo/area.js` | `areaGeometrica(antiderivada, analisis)` |
| f_prom y rectángulo equivalente | `nucleo/promedio.js` | `valorPromedio(I, a, b)`, `rectanguloEquivalente(…)` |
| Áreas de figuras | `nucleo/geometria.js` | `areaRectangulo`, `areaTriangulo`, `areaCirculo`, `areaTrapecio` |
| Conversión de unidades | `nucleo/unidades.js` | `areaAMetrosCuadrados(cantidad, unidad)` |
| Área estimada y costos | `nucleo/materiales.js` | `estimarMaterial(areaM2, precio, adicional)` |
| Redondeo para mostrar | `presentacion/formato.js` | `aDecimal(racional, decimales)` |
| Pasos | `presentacion/pasos.js` | `pasosArea(resultado)`, `pasosPromedio(resultado)` |
| Puntos de la gráfica (aproximados, solo para dibujar) | `presentacion/datosGrafica.js` | `datosGrafica(modelo, intervalo, analisis, promedio)` |

Los nombres de las funciones son una propuesta: identificadores en español, sin tildes ni «ñ» (§18).

## 5. Analizador de expresiones (D-03)

### 5.1 Comparación

| Criterio | Math.js usado solo como analizador | Analizador propio limitado a §9 de requirements |
|---|---|---|
| Ejecución de la entrada como código | No, si nunca se llama a su evaluador. Su superficie es grande e incluye unidades, matrices, cadenas, asignaciones y acceso a propiedades. Hubo avisos de 2026 en el evaluador (versiones 13.1 a 15.1.1). | **Imposible por construcción:** el único resultado es un polinomio de racionales. No hay evaluación dinámica ni acceso a propiedades. |
| Coincidencia con la gramática aprobada | Hay que traducir sus reglas al contrato aprobado: precedencia del producto implícito (`1/2x`), `x(…)` como llamada a función, notación científica y nodos de unidades. Es un riesgo de discrepancia sutil. | La gramática **es** el contrato: cada regla de la Tabla 9.1 es una función. |
| Exactitud de los decimales | Los literales se convierten a número salvo que se configure otro tipo, lo que exige verificar más su comportamiento. | El analizador léxico lee `0.1` directamente como 1/10 (R-03.2). |
| Mensajes con posición (E-EXP-02) | Hay que adaptar sus excepciones. | La posición de cada ficha es conocida. |
| Facilidad para explicarlo | Es una caja negra, más una capa de lista blanca. | Unas 250 líneas que siguen la Tabla 9.1. |
| Tamaño y dependencias | Una biblioteca grande, solo para analizar. | Ninguna dependencia. |
| Esfuerzo estimado | 4–5 h: lista blanca, recorrido del árbol, normalización y pruebas | 7–8 h: léxico, sintaxis, normalización y pruebas |

**Decisión propuesta: analizador propio.** Es la opción más segura, la más fácil de explicar y la que respeta la gramática aprobada. El esfuerzo extra (unas 3 h) cabe en el plazo (§16). Math.js sale de las dependencias.

Consecuencia sobre D-02: `x(x+1)` es un producto sin ambigüedad, porque la gramática no tiene funciones. Por eso se admite (CR-27).

### 5.2 Analizador léxico (`lexico.js`)

Recorre el texto de izquierda a derecha y produce fichas `{ tipo, texto, posicion }`. Un **nombre** es una letra seguida de letras o dígitos, como `x`, `x2`, `pi`, `sqrt` o `cm`.

| Ficha | Patrón | Nota |
|---|---|---|
| `NUMERO` | dígitos, con un punto y dígitos opcionales | Se convierte con `racional.desdeDecimal(texto)`, sin pasar por `Number`. Se recuerda si llevaba punto, para la regla del exponente (§5.3). |
| `X` | el nombre `x` | Cualquier otro nombre es un error (punto 4 del orden de comprobación) |
| `MAS`, `MENOS` | `+`, `-` y `−` (U+2212) | `−` se trata como `-` (D-02) |
| `POR`, `ENTRE`, `POTENCIA` | `*`, `/`, `^` | |
| `ABRE`, `CIERRA` | `(`, `)` | |
| espacios | se omiten | Separan fichas: `x x` son dos fichas `X` |

**Orden de comprobación.** Se informa el primer error encontrado, con su posición:

1. Texto vacío o solo espacios → E-EXP-01.
2. Más de 200 caracteres → E-EXP-11.
3. **Prefijo de asignación o definición:** el texto empieza con un nombre, opcionalmente seguido de `(nombre)`, y después un `=` que no va seguido de otro `=` → E-EXP-12. Ejemplos: `y = x^2`, `f(x)=x^2` y `x = 1`.
4. Recorrido de izquierda a derecha:
   - `,` → E-EXP-04 (`0,5x`, `1,000`);
   - un número seguido de `e` o `E`, un signo opcional y un dígito (notación científica) → E-EXP-04 (`1e3`, `2E-1`);
   - un punto con dígitos a un solo lado (`.5`, `5.`) → E-EXP-04;
   - un nombre distinto de `x`:
     - seguido de `(` → E-EXP-06, función no admitida (`sqrt(x)`, `sin(x)`, `abs(x)`);
     - si es una unidad (`mm`, `cm`, `m`, `km`) → E-EXP-06, con la sugerencia de elegir las unidades en «Interpretación» (`5 cm`);
     - en otro caso → E-EXP-03 (`y`, `pi`, `e`, `x2`, `xx`), con la sugerencia «use x minúscula» si es `X`;
   - cualquier otro carácter → E-EXP-06. Incluye `!`, `%`, `[`, `]`, `;`, `"`, `=`, `<`, `>`, `×`, `÷`, `²` y un `.` sin dígitos al lado. Así, `x!`, `[1,2]`, `x.y` y `x==1` dan E-EXP-06, como fija requirements §10.
5. Más de 100 fichas → E-EXP-11.
6. Literal con más de 6 decimales o mayor que 1 000 000 en valor absoluto → E-EXP-05.

### 5.3 Gramática (`sintaxis.js`, descenso recursivo)

```
expresion  = termino { ("+" | "-") termino } ;
termino    = unario { ("*" | "/") unario | implicito } ;
implicito  = potencia        (* solo en los pares de fichas admitidos; tabla siguiente *)
unario     = ("+" | "-") unario | potencia ;
potencia   = primario [ "^" exponente ] ;
exponente  = ENTERO | "(" ENTERO ")" ;   (* ENTERO: NUMERO sin punto decimal *)
primario   = NUMERO | X | "(" expresion ")" ;
```

- **Precedencia:** paréntesis > potencia > signo unario > producto y división (de izquierda a derecha) > suma y resta. Así, `-x^2` = −(x²), `3x^2` = 3·(x²) y `1/2x` = (1/2)·x.
- **Producto implícito**, según la ficha anterior y la siguiente:

| Ficha anterior | Ficha siguiente | Resultado | Ejemplos |
|---|---|---|---|
| `NUMERO` o `)` | `X` o `(` | producto | `3x`, `2(x-1)`, `(x+1)x`, `(x-1)(x+1)` |
| `X` | `(` | producto | `x(x+1)` (CR-27) |
| `X` | `X` o `NUMERO` | E-EXP-02 | `x x`, `x 2` |
| `NUMERO` o `)` | `NUMERO` | E-EXP-02 | `2 3`, `(x+1)2` |

- **Exponentes, en la sintaxis:** tras `^` se exige un ENTERO, solo o entre paréntesis.
  - Si el texto termina antes (`x^`, `x^(2`) → E-EXP-02.
  - Si sigue un signo, un decimal, `x` o una fracción → E-EXP-07 (`x^-1`, `x^1.5`, `2^x`, `x^(1/2)`).
  - Otro `^` justo después del exponente → E-EXP-07 (`x^2^3`).
  - El **valor** del exponente se comprueba en la normalización (§5.4). Por eso `x^4` es sintácticamente válido y recibe **E-EXP-10** al normalizar, como fijan requirements Tabla 9.1 y CR-21.
- **Profundidad:** más de 10 paréntesis anidados da E-EXP-11. Las fichas inesperadas o los paréntesis sin cerrar dan E-EXP-02, con la posición.
- **Árbol resultante:** nodos `numero{valor}`, `x`, `negacion{arg}`, `suma{izq, der}`, `resta`, `producto{implicito?}`, `division` y `potencia{base, exponente}`. El árbol nunca se evalúa con `eval`, `Function` ni con acceso dinámico a propiedades.

### 5.4 Normalización (`normalizar.js`)

Recorre el árbol y construye un `Polinomio` (§7) **con comprobaciones después de cada operación**:

| Operación | Regla | Error |
|---|---|---|
| producto | la suma de los grados de los factores debe ser ≤ 3; se comprueba antes de multiplicar | E-EXP-10 (`x*x*x*x`) |
| potencia con exponente n = 0 | no admitida (D-02) | E-EXP-07 (`x^0`) |
| potencia con base de grado g ≥ 1 | g·n ≤ 3; se comprueba **antes** de calcular la potencia | E-EXP-10 (`x^4`, `x^(4)`, `(x^2)^2`, `(x-1)^4`, `x^999999`) |
| potencia con base constante | n ≤ 3, porque el exponente debe ser 1, 2 o 3 (Tabla 9.1) aunque el grado no supere 3 | E-EXP-07 (`2^4`) |
| división | el divisor normalizado debe ser una constante | E-EXP-08 |
| división | el divisor no puede ser cero | E-EXP-09 |
| cualquiera | tope de coeficientes normalizados, **solo** si D-09 adopta la alternativa (§17) | E-EXP-05 |

Una subexpresión de grado mayor que 3 se rechaza aunque el total resulte de grado menor: `x^4 - x^4` → E-EXP-10 (R-02.4).

`huboDesarrollo` vale `true` si hubo un producto o una potencia con algún factor que fuera una suma o resta, como `(x − 1)²`, `2(x + 1)` o `(x − 1)(x + 1)`. Activa el paso de desarrollo (R-09.5).

## 6. Representación de racionales exactos (`racional.js`)

**Representación:** objeto inmutable `{ num: BigInt, den: BigInt }` con estas invariantes:

- `den > 0n`;
- `mcd(|num|, den) = 1`;
- el cero es `{ num: 0n, den: 1n }`, así que no existe «−0».

Todas las funciones devuelven objetos nuevos, congelados con `Object.freeze`.

| Grupo | Funciones propuestas |
|---|---|
| Creación | `entero(n)`, `fraccion(n, d)` (error interno si d = 0), `desdeDecimal("2.5")` → 5/2 exacto |
| Aritmética | `sumar`, `restar`, `multiplicar`, `dividir` (error si el divisor es 0), `negar`, `abs`, `potencia(r, k)` con k entero ≥ 0 |
| Comparación | `comparar(a, b)` (−1, 0 o 1), `signo(r)`, `esCero`, `esEntero` |
| Conversión | `aNumber(r)`, **solo** para dibujar (§14); `aTexto(r)` → `"-3/4"`; los decimales están en `formato.js` |

**Por qué BigInt:** los enteros de `Number` son exactos solo hasta 2⁵³ ≈ 9·10¹⁵. Con límites de hasta 1000 y 6 decimales, F(b) contiene b⁴ con numeradores de hasta unos 10³⁶. Con `Number` se perdería exactitud; con BigInt nunca hay desbordamiento (R-18.5).

**Coste:** en grado ≤ 3, todas las operaciones de un análisis completo usan enteros de pocos cientos de bits. El tiempo es despreciable, del orden de milisegundos (R-21).

**π para el círculo:** se usa la constante racional `PI_APROX` = 3.14159265358979323846264338327950288. Su error es menor que 10⁻³⁵, así que el área y los costos del círculo son aproximaciones con una cota conocida (§9).

## 7. Polinomios, integral y promedio

**Contrato `Polinomio`:** `{ coef: Racional[] }`, donde `coef[k]` es el coeficiente de xᵏ.

- Sin ceros al final de la lista: el polinomio cero es `coef = []` y su grado se representa como −1.
- El grado interno no está limitado: la antiderivada llega a 4 y, en la fase de centroides, x·f llega a 4, f² a 6 y su antiderivada a 7 (R-02.7). El límite de 3 solo se aplica en `normalizar.js`.

**`polinomio.js`:**

- operaciones: `sumar`, `restar`, `multiplicar`, `potencia`, `escalar` y `derivar`;
- `dividirConResto(a, b)` → `{ cociente, resto }`;
- `mcd(a, b)`, mónico;
- `evaluar(p, r)` con Horner, exacto, para un Racional;
- `evaluarAprox(p, x)` con Horner en `Number`, **solo** para la gráfica.

**`integral.js`:** `integrarDefinida(p, a, b)` devuelve:

| Campo | Contenido |
|---|---|
| `antiderivada` | Polinomio F, con F(0) = 0. Se escribe sin «+C» (R-04.3). |
| `terminos` | `[{ coefOriginal, potencia, coefAntiderivada, valorEnB, valorEnA }]`. Es el desglose que usa `pasos.js` para mostrar cada sustitución **sin recalcular**. |
| `Fb`, `Fa`, `I` | Racionales exactos, con I = Fb − Fa |

**`promedio.js`:**

- `valorPromedio(I, a, b)` devuelve `{ longitud: b − a, fProm: I/(b − a) }`. Reutiliza I y no vuelve a integrar (R-07.1).
- `rectanguloEquivalente(analisis, fProm, a, b)` solo devuelve `{ base, altura, area }` si `analisis.noNegativa`. En otro caso devuelve `null` con el motivo (R-08.2).

## 8. Análisis de ceros y signos (`ceros.js`), la parte de mayor riesgo

**Objetivo (R-05):** decidir **exactamente** si f cambia de signo en (a, b) y si f ≥ 0 en [a, b]; localizar los ceros, de forma exacta si son racionales y con una cota si no; y clasificarlos. La base matemática está en el formulario §2.1.

**Algoritmo** (revisado en la v0.2 y validado con el prototipo v3; §0). Todas las evaluaciones son exactas, con racionales.

1. **Polinomio cero:** si `coef = []`, devuelve `identicamenteCero: true` y W-09.
2. **Coeficiente A para la prueba de racionalidad:**
   - Sea L el mínimo común múltiplo de los denominadores de los coeficientes de f; L·f tiene coeficientes enteros.
   - Se divide L·f entre el mcd de esos enteros para obtener su **parte primitiva**, y A = |coeficiente principal de la parte primitiva| ≥ 1.
   - Por el teorema de las raíces racionales (formulario §2.1, punto 5), **toda raíz racional r de f cumple que A·r es entero**.
   - Usar la parte primitiva evita que un factor común agrande A: 10⁶⁰·(x − 1/3)(x² + 1) tiene A = 3 y se resuelve con exactitud (CR-35).
3. **Raíces múltiples (exactas):** g = mcd(f, f′), mónico.
   - Si g tiene grado 1, hay una raíz doble r = −g₀.
   - Si g tiene grado 2, hay una raíz triple: g = (x − r)², así que r = −g₁/2.
   - Son siempre racionales en esta familia. Se registran con su multiplicidad si r ∈ [a, b] y se **eliminan** de f por división exacta. El polinomio restante q no tiene raíces repetidas.
   - **Regla de registro único:** cada raíz se registra **una sola vez**, con la multiplicidad que tiene en el f original. Tras dividir m veces entre (x − r), (x − r) ya no divide a q, así que los pasos 4 y 5 no pueden volver a encontrarla como raíz simple. Si un paso posterior intentara registrar una raíz ya registrada, es un error de programación: se devuelve E-SIS-02 y la multiplicidad nunca se sobrescribe. Una raíz múltiple situada en un extremo se registra como cero en el extremo con su multiplicidad (x² en [0, 3]: cero doble en x = 0).
4. **Extremos:** si q(a) = 0 o q(b) = 0, se registra un cero en el extremo (W-03) y se elimina dividiendo entre (x − a) o (x − b). Así, q(a) ≠ 0 y q(b) ≠ 0.
5. **Raíces restantes de q.** Se repite hasta que q sea constante o no queden raíces racionales por encontrar:
   1. **Grado 1:** la raíz es r = −q₀/q₁, **exacta**. Se registra si a < r < b. *Ejemplo: x − 1/3 en [0, 1] da r = 1/3 exacta (CR-31).*
   2. **Grado 2 o 3, conteo:** se construye la sucesión de Sturm de q. N(l, h) = V(l) − V(h) es el número exacto de raíces de q en (l, h).
   3. **Aislamiento:** se biseca [a, b] mientras un subintervalo tenga N ≥ 2. Si un punto medio m cumple q(m) = 0, m es una raíz exacta: se registra, se divide q entre (x − m) y se vuelve al inicio del paso 5.
   4. **Prueba de racionalidad** de cada intervalo [l, h] con N = 1, donde q cambia de signo:
      - se biseca conservando el cambio de signo (Bolzano) hasta que h − l < 1/A; si en un punto medio q(m) = 0, la raíz es exacta;
      - entonces el intervalo (A·l, A·h) mide menos de 1 y contiene a lo sumo un entero, k = ⌊A·l⌋ + 1;
      - si k < A·h y q(k/A) = 0, la raíz es **exactamente k/A**: se registra, se divide q y se vuelve al inicio del paso 5;
      - si no, **la raíz es irracional**, y queda demostrado.
   5. **Aproximación**, solo de las raíces irracionales: se sigue bisecando hasta que el ancho sea ≤ 10⁻¹² **y** la cota del área (§9) sea ≤ 10⁻¹², o hasta la profundidad 200 (paso 6). Se registra como aproximada: `{ intervalo: [l, h], representante: (l + h)/2 }`. Es simple, así que cambia de signo.
6. **Presupuesto (D-09, C-11):** la profundidad de bisección a partir de [a, b] es como máximo 200, compartida por el aislamiento, la prueba de racionalidad y la aproximación. No hay tope para los coeficientes: se analiza toda entrada admitida por requirements §9, como `(0.000001x)^3`, que tiene A = 1 y un cero triple exacto (CR-32).
   - La prueba de racionalidad necesita ⌊log₂((b − a)·A)⌋ + 1 bisecciones. Con coeficientes moderados son pocas: el prototipo llegó a una profundidad de 4 en CR-28 y de 41 en CR-15, incluida la aproximación de √2.
   - **Presupuesto agotado (E-SIS-01):** si se llega a 200 durante el aislamiento o la prueba de racionalidad, todavía no se sabe si alguna raíz es racional. El análisis se detiene con E-SIS-01 (R-21.3) y se descarta todo lo calculado: no hay resultado parcial ni se marca como aproximada una raíz cuya irracionalidad no está demostrada.
     - Ocurre con coeficientes extremos, cuando (b − a)·A ≥ 2²⁰⁰ (CR-33, CR-34), o con dos raíces separadas por menos de (b − a)/2²⁰⁰.
     - CR-34 tiene una raíz racional: con más de 200 bisecciones se reconocería como exacta, así que mostrarla como aproximada sería falso.
   - **Límite en la aproximación:** si se llega a 200 durante la aproximación, la raíz ya está demostrada irracional y su ancho ya cumple la tolerancia en x de requirements §12, porque (b − a)/2²⁰⁰ < 10⁻⁵⁷. El resultado está completo: se muestra con la cota de error obtenida en W-04 aunque sea mayor que 10⁻¹² (CR-36, con coeficientes del orden de 10¹²⁶).
7. **Clasificación:**
   - Un cero interior con multiplicidad impar (simple o triple) **cambia de signo**.
   - Uno de multiplicidad par es una **tangencia** (W-02).
   - Los ceros en extremos no dividen el intervalo.
8. **Tramos y signo:** los cortes son los ceros con cambio de signo. El signo de cada tramo se obtiene evaluando f, de forma exacta, en un punto racional interior que no sea raíz.
   - `noNegativa` = ningún tramo negativo.
   - `cambiaSigno` = hay al menos dos tramos.

**Contrato `AnalisisSigno`:**

| Campo | Tipo | Significado |
|---|---|---|
| `identicamenteCero` | booleano | f ≡ 0 |
| `ceros` | `Cero[]`, ordenados | Todos los ceros de [a, b] |
| `tramos` | `{ desde, hasta, signo: 1 \| −1 \| 0, desdeExacto, hastaExacto }[]` | Los extremos son exactos o el representante de un cero aproximado |
| `cambiaSigno` | booleano | Hay ceros interiores con multiplicidad impar |
| `noNegativa` | booleano | f(x) ≥ 0 en todo [a, b], decidido de forma **exacta** (R-05.2) |
| `hayAproximaciones` | booleano | Algún corte es aproximado (W-04) |

**Contrato `Cero`:** `{ exacto: boolean, valor: Racional (exacto o representante), intervalo: [Racional, Racional] | null, multiplicidad: 1 | 2 | 3 | null, tipo: 'cambio-signo' | 'tangencia' | 'extremo' }`. Si `exacto` es falso, la raíz es irracional (demostrado en el paso 5.4) y `valor` es el representante de su intervalo.

**Por qué es suficiente:**

- La existencia de cambios de signo y la no negatividad se deciden con aritmética exacta: mcd, Sturm y evaluación.
- **Toda raíz racional se reconoce exactamente**: en grado 1, con la fórmula directa; en grado 2 y 3, con la prueba de racionalidad.
- Solo la **posición** de las raíces irracionales es aproximada, y su irracionalidad está demostrada.
- Por eso nunca se presupuesta un perfil que en realidad es negativo, y ninguna decisión depende de la coma flotante.

**Corrección respecto de la v0.1.** La v0.1 probaba la fracción de menor denominador solo una vez, al principio de cada intervalo. En x − 1/3 sobre [0, 1], esa fracción es 0. La bisección posterior solo usa puntos medios con denominador potencia de 2, así que nunca alcanza 1/3: la raíz quedaba aproximada y el área, que vale exactamente 5/18, se habría rotulado como aproximada. La v0.2 sustituye esa prueba por la fórmula directa en grado 1 y por la prueba de racionalidad, que es una garantía demostrada.

**Validación del prototipo v3**, que implementa exactamente los pasos 1–8:

- Coinciden exactamente CR-01, CR-04 a CR-07, CR-14, CR-28 a CR-30 y **CR-31: x − 1/3 en [0, 1] da el cero exacto 1/3 y A_geo = 5/18 exacta**.
- Cinco casos con raíces racionales reconocen todas sus raíces como exactas: (x − 1/3)(x² + 1), (x − 1/3)(x − 2/7), (x − 1/7)(x − 5/11)(x + 2/13), una cúbica con las raíces 1/999983 y 2/999979 en [0, 1], y x(x − 1/3)².
- **Registro único (v0.3, prototipo v4):** CR-29 registra una sola raíz, x = 1, triple y con cambio de signo; CR-30 registra x = −2 simple y x = 1 doble (tangencia), sin repeticiones. También CR-04 (doble en el extremo 0), CR-07 y (x − 1)³ en [1, 2] (triple en el extremo). En 400 polinomios con raíces conocidas, 31 de ellos con raíces múltiples, cada raíz aparece una vez con su multiplicidad exacta: 0 fallos.
- 400 polinomios construidos con raíces racionales aleatorias (denominadores de hasta 60, con multiplicidades y ceros en los extremos): 0 fallos. Todas las raíces resultan exactas y el área coincide con la calculada a partir de los cortes conocidos. Profundidad máxima: 21.
- Raíces irracionales: CR-15 (≈ 2.437903, cota 5.85·10⁻²⁵), x³ − 2 en [−3, 3] y una cúbica con A ≈ 10²⁴ (profundidad 81). Las tres se reconocen como irracionales y coinciden con el oráculo.
- 300 polinomios aleatorios frente a un oráculo numérico independiente: 0 fallos. El peor error relativo es 9.8·10⁻⁹, atribuible al oráculo. Profundidad máxima: 44.

## 9. Área geométrica, geometría, unidades y materiales

**`area.js`:** `areaGeometrica(integral, analisis)`.

- Para cada tramo [rₖ, rₖ₊₁], calcula Iₖ = F(rₖ₊₁) − F(rₖ) con evaluación exacta en los cortes; si un corte es aproximado, usa su representante racional.
- A_geo = Σ |Iₖ|.
- **Cota:** si hay cortes aproximados, E = Σ M₁·δ², con δ igual a la mitad del ancho del intervalo del cero y M₁ = Σ |k·cₖ|·máx(|l|, |h|)ᵏ⁻¹, una cota de |f′| en [l, h] (formulario §2.1).
- Si no hay cortes aproximados, A_geo es exacta, la cota no aplica y E = 0.
- Nunca usa |I| como sustituto (R-06.2). Comprueba internamente que A_geo ≥ |I|; si no se cumple, es un error de programación y devuelve E-SIS-02.

Salida:

| Campo | Contenido |
|---|---|
| `tramos[]` | `{ desde, hasta, integral: Iₖ, valorAbsoluto: \|Iₖ\| }` |
| `area` | `Cantidad` (§10): exacta, o aproximada con cota |
| `igualAI` | `analisis.noNegativa` (R-06.3) |

**`geometria.js`:** dimensiones Racionales > 0, ya validadas.

| Figura | Resultado |
|---|---|
| Rectángulo | b·h, exacto |
| Triángulo | b·h/2, exacto |
| Trapecio (DESEABLE) | (B + b)·h/2, exacto |
| Círculo | `{ clase: 'multiploPi', coeficiente: r² }` (exacto simbólico) más una aproximación con `PI_APROX` y su cota |

**`unidades.js`:**

| Función | Resultado |
|---|---|
| `unidadesDe('abstracta')` | `{ x: 'u', y: 'u', area: 'u²', estimable: false }` |
| `unidadesDe('fisica')` | `{ x: 'm', y: 'm', area: 'm²', estimable: true }` |
| `areaAMetrosCuadrados(c, 'cm')` | c/10 000 |
| `areaAMetrosCuadrados(c, 'm')` | c |

En el MVP no hay conversión de unidades para perfiles (R-15.4).

**Aptitud para estimar** (en `analizarPerfil`, R-16):

| Situación | Resultado |
|---|---|
| Interpretación abstracta | E-MOD-01 |
| Interpretación física y `cambiaSigno` o algún tramo negativo | E-MOD-02 |
| Interpretación física y A_geo = 0 | E-MOD-03 |
| Interpretación física, `noNegativa` y A_geo > 0 | Apto |

Como un perfil apto no cambia de signo, su A_geo = I es **siempre exacta**.

**`materiales.js`:** `estimarMaterial(areaUtil, precio, w)`, con área en m² (exacta, o múltiplo de π), precio en Q/m² y w en %.

```
areaEstimada   = areaUtil × (1 + w/100)
costoBase      = areaUtil × precio
costoEstimado  = areaEstimada × precio
```

- Todo se calcula con racionales exactos. El redondeo a centavos ocurre solo en `formato.js` (R-17.3).
- Para CR-03: 40/3 × 50 = 2000/3 → «Q666.67» y 44/3 × 50 = 2200/3 → «Q733.33».
- Si la fuente es un círculo, el coeficiente de π se mantiene exacto (k·(1 + w/100)·p) y el decimal se obtiene con `PI_APROX`, marcado con «≈».

## 10. Contratos de entrada y salida

Son contratos **documentales**. En el código se expresarán con `@typedef` de JSDoc, sin lógica adicional.

**Tipos base:**

| Tipo | Forma | Reglas |
|---|---|---|
| `Racional` | `{ num: BigInt, den: BigInt }` | §6 |
| `Cantidad` | `{ clase: 'exacta', valor }` · `{ clase: 'multiploPi', coeficiente, aprox, cota }` · `{ clase: 'aproximada', valor, cota, motivo }` | Solo `exacta` se rotula como exacto (R-18.2) |
| `ErrorAreaCalc` | `{ codigo, campo, mensaje, sugerencia, posicion, datos }` | `codigo` según el catálogo de requirements §10 |
| `Advertencia` | `{ codigo: 'W-0n', mensaje, datos }` | No bloquea el resultado |
| `Resultado<T>` | `{ ok: true, valor: T, advertencias }` · `{ ok: false, errores: ErrorAreaCalc[] }` | Los casos de uso nunca lanzan excepciones hacia la interfaz |

**Perfil:**

| Contrato | Campos |
|---|---|
| `EntradaPerfil` | `textoFuncion`, `textoA`, `textoB` (cadenas sin interpretar); `interpretacion: 'abstracta' \| 'fisica'` |
| `ModeloValidado` | `textoOriginal`; `polinomio` (grado ≤ 3); `huboDesarrollo`; `textoNormalizado` (p. ej., «x³ − 1»); `latexNormalizado` |
| `Intervalo` | `{ a: Racional, b: Racional }` con a < b; las posiciones negativas son válidas (R-01.5) |
| `ResultadoPerfil` | `entrada` (copia de los textos usados, para R-11.1); `modelo`; `intervalo`; `unidades`; `integral` (§7); `analisis` (§8); `area` (§9); `promedio`; `rectangulo` (o `null` con motivo); `aptitud: { apta, motivo: 'E-MOD-0n' \| null }`; `pasos: { area: Paso[], promedio: Paso[] }`; `grafica: DatosGrafica`; `advertencias` |

**Procedimiento y gráfica:**

| Contrato | Campos |
|---|---|
| `Paso` | `id` (p. ej., `limiteSuperior`); `titulo`; `texto` (Unicode, siempre presente, R-09.8); `latex` (generado desde el modelo, nunca desde el texto del usuario, R-20.5); `explicacion` |
| `DatosGrafica` | `curva: { x: number[], y: number[] }`; `regiones: [{ x[], y[], signo }]`; `ceros: [{ x, exacto }]`; `promedio: { y, etiqueta }`; `rectangulo: { x0, x1, altura }` o `null`; `ejes: { etiquetaX, etiquetaY }`; `rango` |

**Figuras y estimación:**

| Contrato | Campos |
|---|---|
| `EntradaFigura` | `tipo: 'rectangulo' \| 'triangulo' \| 'circulo' \| 'trapecio'`; `unidad: 'cm' \| 'm'`; textos de `base`, `altura`, `radio`, `baseMayor` y `baseMenor` según el tipo |
| `ResultadoFigura` | `entrada`; dimensiones Racionales; `area: Cantidad` en unidad²; `areaM2: Cantidad`; `formula: { texto, latex }`; `pasos: Paso[]` |
| `EntradaEstimacion` | `fuente: { tipo: 'perfil' \| 'figura', resultado }` (debe estar vigente y ser apta); `textoPrecio`; `textoAdicional` |
| `ResultadoEstimacion` | `descripcionFuente` (p. ej., «Perfil 2 + x²/4 en [0, 4] m»); `areaUtilM2`; `adicional`; `areaEstimadaM2`; `precio`; `costoBase`; `costoEstimado` (todas `Cantidad`); `supuestos` (textos de W-06 y W-05) |

**Contrato futuro de centroides (R-27, POSTERIOR):**

| Elemento | Contrato |
|---|---|
| Entrada | `ModeloValidado`, `Intervalo` y unidades. La región está entre y = 0 e y = f(x). |
| Precondiciones | `analisis.noNegativa` es verdadero y A > 0. Si no, `E-CEN-01` (región no admitida: f cambia de signo o es negativa) o `E-CEN-02` (A = 0: centroide no definido). |
| Cálculo | `integral.js` sobre x·f (grado ≤ 4) y f² (grado ≤ 6), exactos |
| Salida | `{ A, xBarra, yBarra }` racionales exactos, en las unidades de x e y; `pasos`; una advertencia fija («propiedad geométrica; centro de masa solo con densidad uniforme») |
| Fuera | La región entre dos curvas: es solo una referencia académica (formulario §11) |

## 11. Validación y errores

**Campos numéricos (`numeros.js`):** `leerNumero(texto, reglas)`, donde `reglas` define el rango, los decimales, si admite cero y si admite negativos (Tabla 9.3). Pasos, en orden:

1. Recorta espacios y trata `−` como `-`.
2. Vacío → E-NUM-01.
3. `Infinity`, `-Infinity`, `NaN` o `∞` → E-NUM-03.
4. No coincide con `^[+-]?\d+(\.\d+)?$` → E-NUM-02. Si contiene `,`, se sugiere el punto decimal; si tiene notación científica, se avisa de que no se admite.
5. Más decimales de los permitidos, o fuera de rango → E-NUM-04.
6. Negativo donde no se admite → E-NUM-05.
7. Cero o negativo en una dimensión → E-NUM-06.

Nunca se usa `Number(texto)` para obtener el valor: se usa `racional.desdeDecimal`.

**Orden de validación en `analizarPerfil`:**

1. La función, a y b se validan **por separado** y se acumulan todos los errores. Así, cada campo muestra el suyo (R-19.2, R-19.3).
2. Solo si a y b son válidos se comprueban E-INT-01 (a = b) y E-INT-02 (a > b). Los límites nunca se intercambian.
3. Si hay errores, se devuelve `{ ok: false, errores }` y no se calcula nada.
4. El cálculo (§4, pasos 3 a 9) va dentro de `try/catch`:
   - una excepción de presupuesto excedido → E-SIS-01;
   - cualquier otra → E-SIS-02, con detalle técnico solo en la consola de desarrollo (R-19.5).

**`errores.js`:** catálogo congelado con este formato:

`{ 'E-EXP-03': { categoria: 'funcion-no-admitida', plantilla: 'El símbolo «{simbolo}» no está admitido…', campo: 'funcion' }, … }`

Contiene exactamente los códigos de requirements §10. Las funciones `crearError(codigo, datos)` y `crearAdvertencia(codigo, datos)` rellenan la plantilla, siempre como texto (R-20.5). Una prueba verifica que todo código usado exista en el catálogo.

## 12. Estado de la interfaz (`interfaz/estado.js`)

Hay un solo objeto en memoria (R-12.3). Las transiciones son **funciones puras** que reciben el estado y una acción y devuelven el estado nuevo. Se prueban sin DOM.

```
estado = {
  seccion: 'perfil' | 'figuras' | 'estimacion',
  perfil:     { entrada, resultado: ResultadoPerfil | null,  errores: [] },
  figura:     { entrada, resultado: ResultadoFigura | null,  errores: [] },
  estimacion: { fuente: 'perfil' | 'figura' | null, entrada: { textoPrecio, textoAdicional },
                resultado: ResultadoEstimacion | null, errores: [] }
}
```

| Acción | Efecto |
|---|---|
| `editarPerfil(campo, valor)` | Actualiza `entrada` y retira `perfil.resultado` y `perfil.errores` (D-04). Si `estimacion.fuente === 'perfil'`, retira también la fuente y el resultado de la estimación (R-12.1). |
| `calcularPerfil()` | Llama a `analizarPerfil(entrada)` y guarda el resultado o los errores. Si falla, el resultado anterior ya no existe (R-12.2). |
| `editarFigura` / `calcularFigura` | Igual que las dos anteriores, para las figuras. |
| `usarComoFuente('perfil' \| 'figura')` | Solo si ese resultado existe y es apto. Fija la fuente y retira la estimación anterior. |
| `editarEstimacion` / `calcularEstimacion()` | Retira la estimación al editar y la calcula con `estimarMaterial`. |
| `cargarEjemplo(id)` | Copia los textos del ejemplo en `entrada` (y el precio y el adicional, si los tiene), retira los resultados y ejecuta `calcular…()`. Sigue el mismo camino que una entrada manual (R-13.2). |

**Ciclo:** evento del DOM → acción → nuevo estado → `render(estado)` de la sección activa.

- Al retirar un resultado, `render` vacía el panel y llama a `graficaPlotly.limpiar(contenedor)`. Así no queda ninguna gráfica anterior.
- Se calcula **solo al enviar el formulario**, con el botón «Calcular» o con Intro (R-01.8).
- No hay persistencia; recargar la página reinicia el estado.

## 13. Funcionamiento local sin internet (laptop Windows, C-04)

**Requisitos de la laptop:**

- Node.js que cumpla el requisito del Vite instalado. Para Vite 7 es 20.19+ o 22.12+, y se comprueba con `node --version`.
- Un navegador moderno de escritorio.
- Proyecto en una carpeta local, por ejemplo `C:\proyectos\AreaCalc`. Se recomienda **evitar** carpetas sincronizadas como OneDrive, porque bloquean archivos de `node_modules`.

**Scripts de `package.json`:**

| Script | Comando |
|---|---|
| `dev` | `vite` (solo para desarrollo) |
| `build` | `vite build` |
| `preview` | `vite preview` |
| `test` | `vitest run` (una sola vez, sin modo de vigilancia) |

**Reparto de la verificación (C-12):**

- **T-01, en el entorno de Kiro Web:** instalación (`npm install`, que genera `package-lock.json`), `npm test`, `npm run build` y revisión de que `dist/` contiene todos los recursos sin referencias externas.
- **T-R5, el equipo en la laptop:** `npm ci`, `npm run preview` y ensayo con el Wi-Fi apagado. No bloquea T-02.
- Para llevar el proyecto a la laptop sin commits, se copia la carpeta sin `node_modules` ni `dist`, por ejemplo con un ZIP descargado del espacio de trabajo. Si el equipo autoriza commits, se usa git.

**Preparación en la laptop, con internet (T-R5, primera sesión, 22 de octubre; se repite el 28 si cambian las dependencias):**

1. `npm ci`, que instala exactamente lo indicado en `package-lock.json`.
2. `npm test`.
3. `npm run build`.

**Ensayo sin internet, en la misma laptop:**

1. Desactivar el Wi-Fi.
2. Ejecutar `npm run preview`.
3. Abrir la URL que imprime la consola (por defecto `http://localhost:4173`; si el puerto está ocupado, Vite usa el siguiente).
4. Recorrer CR-01, CR-02, CR-03 y CR-05.
5. En las herramientas de desarrollo, en la pestaña Red, recargar la página y comprobar que ningún recurso externo falla.

**El día de la exposición:** abrir el Símbolo del sistema (`cmd`) en la carpeta del proyecto, ejecutar `npm run preview` y abrir la URL. Se recomienda `cmd` porque PowerShell puede bloquear el script `npm.ps1` por su política de ejecución; si ocurre, se usa `cmd` o `npm.cmd`.

**Por qué todo está disponible sin conexión:**

- `index.html` no incluye `<script>` ni `<link>` externos.
- Vite empaqueta Plotly y KaTeX desde `node_modules`. Las fuentes de KaTeX referenciadas por su CSS se copian a `dist/assets`; T-01 lo verifica.
- La interfaz usa fuentes del sistema; no hay fuentes web remotas.
- `base: './'` hace que las rutas sean relativas. Aun así, se sirve por HTTP; **no** se promete que funcione con doble clic (R-22.4).

**Contingencia:**

- una copia de `dist/` y del proyecto con `node_modules` en la segunda computadora del equipo;
- las capturas de CR-01, CR-02, CR-03 y CR-05 en el documento académico.

**Impacto en rendimiento** (estimación; se medirá en T-01 y en la revisión manual):

| Elemento | Impacto | Medida |
|---|---|---|
| Plotly basic (unos 1 MB según npm) | Es el recurso más pesado. Su análisis inicial puede tardar algunas centenas de milisegundos en una laptop común. | Fragmento separado con `import()` dinámico, **precargado al terminar de cargar la aplicación**. Así, el primer cálculo no espera la descarga y R-21.2 se cumple. Vite probablemente advertirá del tamaño del fragmento durante el build; es esperado. |
| KaTeX, su CSS y sus fuentes | Moderado. La carpeta `dist` incluye las fuentes en varios formatos, pero el navegador solo descarga las que usa. | Carga diferida. El texto se muestra primero y la fórmula enriquecida lo reemplaza al estar lista. |
| Aritmética BigInt y análisis de ceros | Milisegundos: profundidad de bisección ≤ 200 por cero (§8, paso 6), como máximo 3 ceros y grado ≤ 3. El prototipo v3, en Python, analizó 400 polinomios en 0.2 s. | No necesita Web Worker (R-21). |
| Gráfica | Unos 400 puntos para la curva y hasta 101 por tramo | `Plotly.react` para redibujar y `Plotly.purge` al invalidar |

## 14. Procedimientos, formato, gráfica e interfaz

### 14.1 Formato (`presentacion/formato.js`)

**Fracciones:** `-3/4`. Los enteros se muestran sin denominador. En LaTeX: `\frac{3}{4}`, `-\frac{3}{4}`.

**Decimales:**

- 4 decimales para los valores matemáticos y 2 para los quetzales.
- El redondeo es **mitad alejándose de cero**, calculado exactamente sobre el racional: se escala por 10ⁿ, se toma el cociente y el resto, y se compara 2·resto con el denominador.
- Si la expansión decimal termina dentro de esos dígitos, se usa «=» sin ceros finales: 243/4 = 60.75.
- Si no, se usa «≈»: 40/3 ≈ 13.3333.
- Nunca se muestra «−0» (R-18.4).

**Monomios, al estilo del curso:**

- Para c = p/q en cxⁿ: si |p| = 1, se escribe xⁿ/q; si no, p·xⁿ/q. Por ejemplo, x⁴/4, 5x⁴/4 y x³/12.
- Los términos se ordenan por potencia descendente: «x³ − 4x²/3 − 5x/3 + 2/3».
- Las sustituciones negativas van entre paréntesis: (−1)³ (R-09.6).

**Unidades:** «u», «u²», «m», «m²», «cm²» y «Q». Siempre van junto al valor (R-15.1).

**Cantidades aproximadas:** «≈ 2.4379 u² (aproximada; cota de error ≤ 6·10⁻²⁵)», con W-04.

### 14.2 Procedimientos (`presentacion/pasos.js`)

Solo **formatea** los objetos del núcleo, como `integral.terminos`, `area.tramos` y `promedio`. No vuelve a calcular nada (R-09.1, R-24.2).

| Procedimiento | Pasos (id) | Ejemplo canónico |
|---|---|---|
| Área sin cambio de signo | `datos`, `desarrollo` (si `huboDesarrollo`), `signo`, `planteamiento`, `antiderivada`, `limiteSuperior`, `limiteInferior`, `resta`, `resultado`, `interpretacion` | formulario §4.2 (CR-01) |
| Área con cambio de signo | los anteriores hasta `antiderivada`, y luego `ceros`, un `tramo` por cada uno (F(rₖ₊₁) − F(rₖ) y su valor absoluto), `suma`, `comparacion` (I frente a A_geo), `resultado` e `interpretacion` | formulario §2 (CR-05) |
| Valor promedio | `formula`, `sustitucion` (1/(b − a)), `integral` (referencia a los pasos de la antiderivada y de la resta), `division`, `unidades` e `interpretacion`, con la equivalencia con la pizarra (D-06) | formulario §5.2 (CR-02) |
| Figura | `datos`, `formula`, `sustitucion`, `resultado`, `conversion` (si es en cm) | CR-10 |
| Estimación | `areaUtil`, `adicional`, `costoBase`, `costoEstimado` y `supuestos` | formulario §7.2 (CR-03) |

Reglas:

- El paso `antiderivada` indica la regla aplicada (potencia y linealidad) y que la constante se cancela. **Ningún** resultado lleva «+C» (R-09.7); una prueba verifica que ningún texto de resultado definido contenga «+C» ni «+ C».
- Sustitución en el límite superior para CR-01: «F(4) = 4⁴/4 − 4 = 64 − 4 = 60». Los valores de cada término salen de `terminos[].valorEnB`.

### 14.3 Datos de la gráfica y adaptador de Plotly

**`datosGrafica.js`:**

- Dominio [a − m, b + m], con m = 0.1·(b − a), y 401 puntos uniformes en ese dominio, a los que se añaden a, b y los ceros, en orden.
- Regiones: una por tramo, con 101 puntos y el signo del tramo.
- Los valores son `Number`, porque **solo sirven para dibujar** (R-10.5).
- Si algún valor no es finito en `Number`, no se dibuja la gráfica: se muestra W-07 y se conservan los resultados exactos (R-10.6). Puede ocurrir dentro de la Tabla 9.2; por ejemplo, `(((1000000^3)^3)^3)^3` vale 10⁴⁸⁶.

**`graficaPlotly.js`:** `dibujar(contenedor, datos)` y `limpiar(contenedor)`.

| Elemento | Traza o forma de Plotly |
|---|---|
| Curva | traza scatter en modo `lines` |
| Regiones | una traza por tramo con `fill: 'tozeroy'`, en dos colores con contraste suficiente, más la leyenda «Sobre el eje (+)» / «Bajo el eje (−)» y una anotación «+» o «−» en cada tramo. Así la diferencia no depende solo del color (R-10.2). |
| Promedio | forma `line` discontinua, con la etiqueta «f_prom = 10/3 m» |
| Rectángulo equivalente | forma `rect` con contorno discontinuo y sin relleno (R-10.3) |
| Ceros | marcadores; el texto flotante indica «x = 1 (exacto)» o «x ≈ 1.4142» |
| Ejes | títulos «x (m)» y «f(x) (m)», o «(u)» en ejercicios abstractos |
| Configuración | `{ responsive: true, displaylogo: false, displayModeBar: false }`. Sin barra de herramientas en inglés y sin enlaces externos. |

- La carga es diferida con `import('plotly.js-basic-dist-min')`.
- Cualquier excepción de carga o de dibujo se convierte en W-07; los resultados y los pasos permanecen visibles (R-10.6).
- Si T-01 muestra que el paquete *basic* no admite formas o anotaciones, se cambiará a `plotly.js-dist-min` (más pesado) con aprobación. No se rediseña.

### 14.4 Adaptador de KaTeX

`formulasKatex.js`: `mejorar(elemento, latex)`.

- El elemento ya contiene `paso.texto`.
- Se carga `katex` y su CSS de forma diferida y se llama a `katex.render(latex, elemento, { throwOnError: true, trust: false, output: 'htmlAndMathml' })` dentro de `try/catch`. `trust: false` se fija de forma explícita, aunque coincida con el comportamiento esperado, para no habilitar comandos como `\href`.
- Si falla, se conserva el texto y se muestra W-08. La salida MathML ayuda a los lectores de pantalla.

### 14.5 Flujo del usuario y accesibilidad

**Navegación:** tres enlaces en `<nav>`: `#perfil`, `#figuras` y `#estimacion`. Se muestra una sección a la vez y el botón «Atrás» del navegador funciona.

**Analizador:**

1. Selector de ejemplos.
2. Campo f(x), con el soporte visible: «Polinomios en x de grado ≤ 3, p. ej., `x^3 - 1`».
3. Campos a y b.
4. Interpretación, como un `fieldset` de opciones.
5. Botón «Calcular».
6. Resumen de resultados (I, A_geo, f_prom con sus unidades y supuestos), luego la gráfica y después los pasos.
7. Botón «Usar esta área para estimar material», que aparece deshabilitado con el motivo E-MOD si el resultado no es apto.

**Figuras:** selector de figura y unidad, dimensiones y el mismo patrón de resultado y botón de estimación.

**Estimación:** muestra la fuente vigente (o el motivo de que no la haya), el precio en Q/m², el adicional en %, el resultado y los supuestos, siempre visibles (R-17.5).

**Accesibilidad (R-23):**

- `<label>` en cada campo y la unidad en el texto de la etiqueta.
- Errores con `aria-invalid` y `aria-describedby` hacia el mensaje del campo, más un resumen con `role="alert"`.
- Región `aria-live="polite"` para los resultados.
- Tras calcular, el foco pasa al encabezado de los resultados.
- `:focus-visible` con contorno de 3 px.
- Colores definidos como variables CSS que cumplen 4.5:1.
- Diseño de una columna por debajo de 768 px, utilizable desde 360 px.
- `lang="es"` en el documento.

## 15. Estrategia de pruebas

En esta etapa las pruebas solo se especifican; se implementarán en la Etapa C.

| Capa | Herramienta | Qué verifica | Casos |
|---|---|---|---|
| Núcleo | Vitest, entorno `node` | Invariantes de racionales: normalización, sin «−0», decimal exacto y redondeo mitad alejándose de cero. Operaciones de polinomios, mcd y división. Integral y desglose. Ceros y tramos, incluidas la prueba de racionalidad con la parte primitiva y las dos situaciones de presupuesto agotado. Área y cota. Promedio. Geometría. Unidades. Materiales. | CR-01 a CR-10, CR-14, CR-15, CR-17 a CR-20, CR-28 a CR-36 |
| Expresiones | Vitest | Tabla de gramática: entradas válidas → coeficientes esperados; entradas inválidas → código y posición. Incluye, como mínimo, las 33 válidas y 59 inválidas del prototipo (§0), entre ellas `x^4` → E-EXP-10, `2^4` → E-EXP-07, `x==1` y `5 cm` → E-EXP-06, `x x` → E-EXP-02. | CR-12, CR-13, CR-16, CR-21, CR-27 |
| Casos de uso | Vitest | `analizarPerfil`, `calcularFigura` y `estimarMaterial` de principio a fin, sin DOM | Todos los CR del MVP |
| Estado | Vitest | Transiciones e invalidación | CR-22 |
| Propiedades | Vitest | Relaciones de R-25.3 sobre todos los CR y sobre 300 polinomios generados con semilla fija (el generador pseudoaleatorio se define en la propia prueba): A_geo ≥ \|I\|, I = (b − a)·f_prom, y f ≥ 0 ⇒ A_geo = I. También se compara A_geo con un **oráculo numérico propio de la prueba** (integral de \|f\| por punto medio, con 20 000 subintervalos), que es independiente del código bajo prueba. Además, 400 polinomios **construidos a partir de raíces racionales conocidas** deben devolver exactamente esas raíces, marcadas como exactas, y el área calculada con esos cortes. | R-05.3, R-25.3 |
| Arquitectura | Vitest y `node:fs` | Los archivos de `src/nucleo`, `src/expresiones`, `src/presentacion` y `src/casos-de-uso` no importan `interfaz/`, `adaptadores/`, `plotly` ni `katex`, y no usan `document` ni `window`. Nada en `src/` contiene `eval(`, `new Function` ni `innerHTML` con textos del usuario. | R-20.1, R-24.1 |
| Interfaz | Manual, con `docs/revision-manual.md` | Recorrido de las tres secciones, uso con teclado, 360 px, contraste, invalidación visible, sin internet, falla de Plotly (bloquear su fragmento desde las herramientas de desarrollo → W-07) y falla de KaTeX (→ W-08) | R-25.4 |

`tests/casos-referencia.js` transcribe los valores del formulario y de requirements §14. **Nunca** se generan con el código del producto (R-25.1).

## 16. Viabilidad, riesgos y protección del núcleo

**Capacidad (C-02, C-03):** del 20 al 29 de octubre hay unas 60 h de programación (2 personas × 3 h × 10 días) y unas 30 h de revisión y documentación.

**Estimación por bloques** (v0.3, ajustada a 60 h; supone que Codex implementa y los programadores supervisan y prueban; el detalle está en `tasks.md`):

| Bloque | Responsable propuesto | Horas |
|---|---|---|
| Base del proyecto, verificada en el entorno de Kiro Web (la prueba en la laptop es del revisor, T-R5) | Programador A | 2 |
| `racional.js`, `polinomio.js`, `integral.js` y `promedio.js` | Programador A | 7 |
| **`ceros.js` y `area.js`** | Programador A | 9 |
| Números, errores, unidades, materiales y geometría (rectángulo, triángulo, círculo) | Programador A | 4.5 |
| Casos de uso y pruebas de propiedades y arquitectura | Programador A | 4 |
| Analizador `expresiones/` | Programador B | 8 |
| `formato.js` y `pasos.js` | Programador B | 6 |
| HTML, CSS, estado y tres vistas con accesibilidad, con CSS sobrio | Programador B | 10 |
| Adaptadores de Plotly y KaTeX, `datosGrafica` y ejemplos | Programador B | 5 |
| Integración y correcciones | A (2.5) y B (1) | 3.5 |
| **Total de programación** | A: 29 · B: 30 | **59 h** y 1 h de reserva (de A), frente a unas 60 h |
| Casos de referencia, revisión manual, ensayo del equipo en la laptop (T-R5), documento académico y revisión de cambios | Revisor | unas 30 h |

**Cambios frente a la v0.2 (62 h):**

- Se posponen los elementos DESEABLE (D-08): el trapecio (−0.5 h), la tabla de valores y las anotaciones «+» y «−» de la gráfica (−1 h). La leyenda y el resumen textual de los tramos se conservan, así que R-10.2 se sigue cumpliendo.
- El CSS se limita a lo necesario para el contraste, el foco y los 360 px (−1 h).
- El ensayo sin internet en la laptop pasa al revisor; la integración baja de 4 a 3.5 h (−0.5 h).
- `expresiones/` pasa de A a B para equilibrar la carga: con el reparto de la v0.2, A tenía unas 34 h frente a sus 30 h disponibles.
- No se recorta nada de la corrección matemática, de los procedimientos ni de las pruebas del núcleo.

**Conclusión:** es viable, pero **sin holgura**: solo queda 1 h de reserva y el trabajo ocupa hasta el 29 de octubre. Si algo se retrasa, se aplica el orden de recorte de abajo.

**Los dos programadores trabajan en carpetas distintas**, así que dos asistentes no editan los mismos archivos:

- A: `nucleo/`, `casos-de-uso/`, la configuración del proyecto y las pruebas de `tests/nucleo`, `tests/casos-de-uso`, `propiedades` y `arquitectura`.
- B: `expresiones/`, `presentacion/`, `interfaz/`, `adaptadores/`, `ejemplos/`, los estilos y sus pruebas.
- B desarrolla con resultados simulados que siguen los contratos de §10 hasta que A entrega los casos de uso.

**Riesgos:**

| N.º | Riesgo | Gravedad | Mitigación |
|---|---|---|---|
| 1 | **`ceros.js`**: algoritmo con varios pasos (§8). Si falla, se pierde todo el análisis de cúbicas, incluido CR-01. | **Alta, el mayor riesgo para el plazo** | Es lo primero que hace A después de `racional.js` y `polinomio.js`, entre el 22 y el 24 de octubre, siguiendo el algoritmo validado en el prototipo. Pruebas CR y oráculo desde el primer día. Hito: el 24 de octubre deben pasar CR-01, CR-04 a CR-07, CR-14, CR-15, CR-28 a CR-31, el registro único y la propiedad de raíces racionales aleatorias (§15). |
| 2 | Casos límite del analizador (producto implícito, posiciones de error) | Media | La tabla de gramática es la especificación de pruebas. |
| 3 | 10 h para la interfaz completa y accesible | Media | HTML semántico simple, un patrón de campo reutilizable y CSS sobrio. |
| 4 | Laptop Windows: versión de Node, política de PowerShell, carpeta sincronizada | Media | Primera sesión de T-R5 en **esa** laptop el 22 de octubre (`npm ci`, `npm run build` y `npm run preview` sin red). No bloquea T-02 y deja una semana para corregir. |
| 5 | Plotly: compatibilidad del paquete con Vite y disponibilidad de formas y anotaciones | Media-baja | Página de prueba en T-01 (entorno de Kiro Web). Alternativas: `plotly.js-dist-min`, o una gráfica SVG propia, que se reserva como último recurso. |
| 8 | El registro npm devolvió HTTP 403 desde el entorno de Kiro Web el 19 de octubre | Media | Si persiste al autorizar T-01, la instalación, las pruebas y el build pasan a la computadora de A con internet, y Kiro revisa los resultados (§0). |
| 6 | El revisor tiene 30 h para pruebas, revisión manual y el documento | Media | El documento se escribe desde el formulario, ya validado; se empieza el 22 de octubre. |
| 7 | Las fuentes de KaTeX no se empaquetan | Baja | T-01 lo verifica en `dist/assets`; el texto de respaldo cubre R-09.8. |

**Protección del núcleo del MVP:**

- Orden estricto: núcleo y pruebas, después casos de uso, y la interfaz al final.
- Ninguna tarea de interfaz bloquea las del núcleo.
- **Hitos** (v0.3, según el calendario de `tasks.md`):
  - 20 de octubre: T-01 verificada en el entorno de Kiro Web.
  - 22 de octubre: primera sesión en la laptop (T-R5), sin bloquear el núcleo.
  - 24 de octubre: `ceros.js` pasa sus casos (riesgo 1).
  - 26 de octubre: núcleo matemático completo y probado, y alcance congelado.
  - 28 de octubre: casos de uso e interfaz completos.
  - 29 de octubre: integración, ensayo sin internet en la laptop y capturas para el documento.
- **Pospuesto desde el inicio** (DESEABLE, D-08): trapecio, tabla de valores y anotaciones «+» y «−» de la gráfica. Solo se hacen si sobra la reserva.
- **Orden de recorte si aun así hay retraso** (nunca se recortan la corrección matemática, los procedimientos ni las pruebas del núcleo):
  1. la mejora con KaTeX, dejando solo el texto, que ya cumple R-09.8;
  2. ajustes visuales del CSS que no afecten al contraste, al foco ni a los 360 px;
  3. el selector de ejemplos se reduce a CR-01, CR-02, CR-03 y CR-05.
- R-27 (centroides) y R-28 (comparación numérica) no se tocan antes del 29 de octubre.

## 17. Ajustes a D-07 y decisión D-09 (resuelta)

**Decisión (requirements C-11, 19 de octubre):** se adopta la propuesta sin un tope nuevo de coeficientes. La Tabla 9.2 no cambia y se conservan todas sus entradas, incluida `(0.000001x)^3`. Se descartó la alternativa del tope de 10⁹, que habría rechazado entradas hoy válidas.

**Reglas que quedan en vigor (§8, pasos 2, 5 y 6):**

1. Sin tope de coeficientes. A se calcula sobre la parte primitiva para que un factor común no lo agrande (CR-35).
2. Profundidad máxima de 200 bisecciones, compartida por todo el análisis. E-SIS-01 solo si se agota antes de saber si cada raíz es racional, sin resultado parcial (CR-33, CR-34). Una raíz racional nunca se presenta como aproximada.
3. Si el límite solo se alcanza en la aproximación de una raíz ya demostrada irracional, se muestra la cota obtenida en W-04 (CR-36).
4. Si los coeficientes no caben en `Number`, la gráfica muestra W-07 (§14.3).

**Historial:** la v0.2 proponía un tope de 10¹², que no garantizaba el límite (A hasta 10⁶⁰, es decir, 211 bisecciones). La v0.3 lo bajó a 10⁹, lo que contradecía requirements §9, y la v0.4 lo dejó como decisión pendiente. Los casos se comprobaron con el prototipo desechable, fuera del repositorio.

| N.º | Límite actual | Problema | Cambio propuesto |
|---|---|---|---|
| 1 | Literales ≤ 10⁶. No hay límite para los coeficientes **normalizados**. | Con 100 fichas, un producto de literales puede dar coeficientes de hasta 10³⁰⁰. La aritmética exacta lo soporta, pero la gráfica pasaría a `Infinity`, la cota de §9 perdería utilidad y la prueba de racionalidad de §8 podría necesitar más de 200 bisecciones. | **Decidido (D-09): sin tope.** El riesgo se controla con el presupuesto de bisección (regla 2), la parte primitiva (regla 1) y W-07 en la gráfica (regla 4). |
| 2 | Ceros irracionales: ancho ≤ 10⁻¹² en x y máximo de 200 iteraciones | El ancho en x no limita el error del **área** cuando los coeficientes son grandes. | Detener la bisección cuando **el ancho sea ≤ 10⁻¹² y la cota del área (M₁·δ², §9) sea ≤ 10⁻¹²**, con el mismo máximo de 200 iteraciones. En CR-15 bastan 41 bisecciones. Si se alcanza el máximo sin cumplir la cota, se muestra la cota obtenida en W-04, sin tratarlo como error (CR-36). **Aprobado (D-09).** |
| 3 | «Máximo de 200 iteraciones por cero» (requirements §9 y §12) | Con la prueba de racionalidad, un mismo intervalo pasa por el aislamiento, la prueba de racionalidad y la aproximación; contar las iteraciones por fase sería ambiguo. | Interpretarlo como **profundidad máxima de bisección de 200 a partir de [a, b]**, compartida por las tres fases (§8, paso 6). Si se agota antes de determinar la naturaleza de las raíces, E-SIS-01 (R-21.3): con raíces separadas por menos de (b − a)/2²⁰⁰ o con coeficientes extremos (§8, paso 6). **Aprobado (D-09).** |

## 18. Reglas de trabajo propuestas para Codex (futuro `AGENTS.md`)

No hay un `AGENTS.md` existente, así que no hay incompatibilidades. El archivo se creará en T-01 solo después de aprobar este diseño.

1. Leer `requirements.md`, `design.md` y `docs/formulario-matematico.md` antes de cada tarea. Implementar **solo** la tarea autorizada de `tasks.md`, de una en una.
2. No modificar las especificaciones. Si algo contradice el diseño, detenerse e informar al equipo del cambio propuesto.
3. Dependencias permitidas: `vite`, `vitest`, `plotly.js-basic-dist-min` y `katex`. Ninguna otra sin aprobación.
4. Prohibido: `eval`, `new Function`, `innerHTML` con textos del usuario, CDN, fuentes remotas y `Number` para resultados exactos. Solo se redondea en `formato.js`.
5. Respetar las dependencias de §2. La prueba de arquitectura debe pasar.
6. Cada función del núcleo lleva pruebas. Los valores esperados salen de `tests/casos-referencia.js`, nunca del código bajo prueba.
7. Desde que T-01 crea el proyecto, ejecutar `npm test` y `npm run build` antes de entregar cada tarea para revisión.
8. Por ahora no hay commits ni PR: el revisor revisa los cambios en la copia local. Si el equipo los autoriza más adelante: una rama por tarea, un PR hacia `main` y mensajes de commit en español con el identificador de la tarea, por ejemplo «T-04: análisis de ceros con Sturm».
9. Identificadores y comentarios en español, sin tildes ni «ñ» en los nombres. JSDoc `@typedef` para los contratos de §10. Funciones puras en `nucleo/`.
10. Cada asistente trabaja solo en las carpetas de su programador (§16). No hay ediciones simultáneas de un mismo archivo.

## 19. Trazabilidad

| Requisitos | Componentes | Pruebas y casos |
|---|---|---|
| R-01 Entrada | `vistaPerfil`, `estado`, `analizarPerfil`, `numeros` | CR-11, CR-13 |
| R-02 Familia | `expresiones/*`, `polinomio` | CR-07, CR-12, CR-16, CR-21, CR-27; tabla de gramática (§15) |
| R-03 Números | `numeros`, `racional.desdeDecimal` | CR-13, CR-17, CR-20 |
| R-04 Integral | `integral` | CR-01 a CR-08, CR-18 |
| R-05 Ceros | `ceros` | CR-05, CR-07, CR-08, CR-14, CR-15, CR-28 a CR-36; oráculo; raíces racionales aleatorias |
| R-06 Área | `area` | CR-05, CR-06, CR-14, CR-15, CR-28 a CR-31; propiedades |
| R-07, R-08 Promedio y rectángulo | `promedio` | CR-02 a CR-06; propiedades |
| R-09 Pasos | `pasos`, `formato`, `formulasKatex` | CR-01, CR-02, CR-05; búsqueda de «+C» |
| R-10 Gráfica | `datosGrafica`, `graficaPlotly` | revisión manual; W-07 simulado |
| R-11 Identificación | `formato`, vistas | revisión manual |
| R-12 Estado | `estado` | CR-22 |
| R-13 Ejemplos | `ejemplos`, `estado.cargarEjemplo` | casos de uso con las entradas de los ejemplos |
| R-14, R-15 Figuras y unidades | `geometria`, `unidades`, `calcularFigura` | CR-09, CR-10, CR-19, CR-23 |
| R-16, R-17 Aptitud y estimación | `analizarPerfil` (aptitud), `materiales`, `estimarMaterial` | CR-03, CR-05, CR-06, CR-08, CR-20 |
| R-18 Precisión | `racional`, `formato` | CR-03, CR-15, CR-17; prueba de «−0» |
| R-19 Errores | `errores`, `vistaComun` | CR-11 a CR-13, CR-21 |
| R-20 Seguridad | `expresiones/*`, `formulasKatex` | prueba de arquitectura; CR-21 |
| R-21 Rendimiento | todos | medición manual; presupuesto de 200 bisecciones: CR-33 y CR-34 (E-SIS-01), CR-36 (W-04) |
| R-22 Sin internet | `vite.config.js`, `index.html` | ensayo sin red (§13) |
| R-23 Accesibilidad | vistas, `app.css` | revisión manual |
| R-24 Arquitectura | estructura de §2 y §3 | prueba de arquitectura |
| R-25, R-26 Verificación y documentación | `tests/`, `docs/` | este plan de pruebas |
| R-27, R-28 | contratos futuros (§10) | CR-24 a CR-26: no bloquean el MVP |

## 20. Auditoría del diseño

| Gravedad | Evidencia | Consecuencia | Corrección aplicada |
|---|---|---|---|
| Alta | Analizar el signo con coma flotante o muestreo puede presupuestar un perfil negativo. | Estimación de material errónea | Decisión exacta con mcd y Sturm (§8), validada con un prototipo y un oráculo |
| Alta | La lista inicial del equipo incluía Math.js. | Superficie de ataque y diferencias con la gramática aprobada | Analizador propio (§5). Math.js sale de las dependencias. |
| Media | Plotly es el recurso más pesado y es una biblioteca externa. | Primer render lento, o falla de la gráfica | Carga diferida y precarga, W-07, resultados independientes de la gráfica (§13, §14) |
| Media | Las versiones exactas no pudieron verificarse (el registro npm devolvió 403). | Incompatibilidad con Node | Fijarlas en `package-lock.json` en T-01 y probar en la laptop real |
| Media | Las 62 h estimadas superan ligeramente las 60 h disponibles. | Retraso del núcleo | Orden de recorte, alcance congelado el 26 de octubre y carpetas separadas (§16) |
| Alta | v0.1 de §8: la fracción de menor denominador se probaba solo una vez, al principio; en x − 1/3 sobre [0, 1] esa fracción es 0 y la bisección nunca alcanza 1/3. | Raíz racional tratada como aproximada; un área exacta (5/18) rotulada como aproximada, en contra de R-05.3 y R-18.2 | Fórmula directa en grado 1 y prueba de racionalidad con el teorema de las raíces racionales (§8, pasos 2 y 5); CR-31; propiedad de raíces racionales aleatorias (§15). Validado con el prototipo v3. |
| Media | v0.1 de §5.3: la gramática solo aceptaba los exponentes 1 a 3, así que `x^4` habría recibido un error de sintaxis o E-EXP-07. | Incumple requirements Tabla 9.1 y CR-21, que fijan E-EXP-10 | El exponente es cualquier entero en la sintaxis; el grado se comprueba al normalizar (§5.4) |
| Media | v0.1 de §5.2–§5.3: cualquier `=` daba E-EXP-12 (también `x==1`), `5 cm` daba E-EXP-03 y la regla del producto implícito admitía `x x`, aunque el mismo texto lo rechazaba. | Códigos distintos de los de requirements §10 y una regla contradictoria | Prefijo de asignación (E-EXP-12) separado de otros `=` (E-EXP-06), regla de unidades (E-EXP-06) y tabla de pares de fichas (§5.3). Validado con el prototipo de la gramática. |
| Baja | Coeficientes normalizados sin tope (decisión D-09) | Gráfica con valores no finitos; presupuesto de bisección agotado | W-07 para la gráfica (§14.3); E-SIS-01 sin resultado parcial (CR-33, CR-34); W-04 con la cota obtenida (CR-36); parte primitiva para no agrandar A (CR-35) |
| Media | v0.2 y v0.3 de §17: el tope de 10¹² no garantizaba el límite de 200 bisecciones (A hasta 10⁶⁰), y el de 10⁹ rechazaba entradas que la Tabla 9.2 admite, como `(0.000001x)^3` | Contradicción con requirements §9 | D-09 decidida por el equipo sin tope (requirements C-11); requisitos y casos alineados (§8, §17) |
| Media | v0.2 de §16: 62 h estimadas frente a unas 60 h, y el programador A con unas 34 h frente a 30 h | Retraso del núcleo | Trapecio, tabla de valores y anotaciones de la gráfica pospuestos; `expresiones/` pasa a B; 59 h y 1 h de reserva (§16) |
| Media | v0.2 de §8 no decía qué pasa con una raíz múltiple tras simplificar | Riesgo de registrarla dos veces o como raíz simple | Regla de registro único (§8, paso 3), verificada con CR-29 y CR-30 |

**Comprobaciones sin hallazgos:**

- El núcleo no depende de la interfaz: lo garantizan las reglas de §2 y la prueba de arquitectura.
- No hay cálculos duplicados: cada uno tiene un único lugar (§4) y los pasos solo formatean.
- Contratos: las entradas, salidas, unidades y errores están definidos en §10 y §11.
- No hay servicios ni bases de datos que auditar.

Esta auditoría no garantiza la ausencia de errores.
