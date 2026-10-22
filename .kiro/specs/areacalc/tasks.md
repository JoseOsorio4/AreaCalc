# ÁreaCalc — Plan de tareas (Etapa C)

> **Estado:** v0.3, con el registro de avance actualizado. **Plan de la Etapa C en ejecución:** T-01 está completada; T-02 a T-14 están implementadas y probadas, con la revisión de R pendiente (T-R1, T-R3 y T-R6). Los casos de uso de T-08 siguen devolviendo `pasos` y `grafica` en `null` hasta T-15 y T-17, y las vistas de T-14 lo indican sin simular datos. T-15 en adelante no se han iniciado. · **Fecha del plan:** 19 de octubre de 2026
> **Cambios de la v0.3:** D-09 decidida sin tope de coeficientes (requirements C-11), con las pruebas CR-32 a CR-36. T-01 se verifica en el entorno de Kiro Web y la prueba en la laptop pasa a T-R5, sin bloquear T-02 (C-12).
> **Base:** `requirements.md` v0.5, `design.md` v0.5 (Etapa B cerrada) y `docs/formulario-matematico.md` v0.4.
> Este plan **no autoriza implementar** por sí solo. Cada tarea necesita autorización explícita del equipo antes de que Codex la ejecute. El estado para continuar en otro chat está en `docs/RELEVO-KIRO.md`.

## 0. Convenciones

- **Responsables:** A y B son los dos programadores, que supervisan a Codex y prueban; R es el revisor de pruebas y documentación (C-02). Cada uno trabaja solo en sus carpetas (design §16).
- **Horas:** tiempo de cada persona, con 3 h diarias del 20 al 29 de octubre (C-03). Programación: A 29 h y B 30 h, es decir 59 h, más 1 h de reserva de A. Revisión: R unas 30 h.
- **Prioridad:** MVP · COMP (complemento incluido en el MVP) · DESEABLE (pospuesto; solo con reserva) · POSTERIOR.
- **D-09 decidida (C-11):** no hay tope de coeficientes. El análisis de ceros usa como máximo 200 bisecciones y solo responde E-SIS-01 si agota ese presupuesto, sin resultado parcial y sin presentar como aproximada una raíz racional (design §8, paso 6).
- **Definición de terminado:**
  - Desde que T-01 crea el proyecto, `npm test` y `npm run build` pasan donde se trabaja: el entorno de Kiro Web o la computadora del responsable. Antes de T-01 no hay proyecto que probar ni construir.
  - La prueba de arquitectura pasa, también desde T-01.
  - Los valores esperados salen de `tests/casos-referencia.js`, nunca del código bajo prueba.
  - R revisa los cambios en la copia local o en la rama de respaldo. El equipo autorizó commits y push normal de respaldo en `avance-t04`; no hay PR ni merge a `main` sin autorización explícita.
- **Estado y revisión, por separado:** la casilla `[x]` de una tarea T indica que está implementada, con `npm test` y `npm run build` correctos. **No** significa que R la haya revisado. La revisión de R solo se registra en T-R1 (casos de referencia) y T-R6 (revisión de cambios), y únicamente cuando R la hace.
- **Explicación matemática:** cada tarea indica qué debe poder explicar el equipo en la exposición.

## 1. Orden y calendario

```
T-01 ─► T-02 ─► T-03 ─► T-04 ──────────┐
          │       │                    ├─► T-06 ─┐
          │       └─► T-05 ────────────┘         │
          ├─► T-07 ──────────────────────────────┼─► T-08 ─┐
T-09 ─► T-10 (necesita T-03) ────────────────────┘         │
T-02 ─► T-11 ─► T-12 (contratos; datos simulados)          ├─► T-17
T-13 ─► T-14 (necesita T-11)                               │
T-01 ─► T-15 ;  T-12 ─► T-16 ──────────────────────────────┘
```

| Día | A (3 h) | B (3 h) | R (3 h) |
|---|---|---|---|
| 20 oct | T-01 (2), T-02 (1) | T-09 (3) | T-R2 (3) |
| 21 oct | T-02 (1.5), T-03 (1.5) | T-09 (1), T-13 (2) | T-R4 (3) |
| 22 oct | T-04 (3) | T-13 (1), T-11 (2) | T-R1 (2), T-R5 (1) · laptop, primera sesión |
| 23 oct | T-04 (3) | T-11 (0.5), T-10 (2.5) | T-R1 (2), T-R4 (1) |
| 24 oct | T-04 (1), T-05 (2) · **hito: ceros** | T-10 (1.5), T-12 (1.5) | T-R4 (2), T-R6 (1) |
| 25 oct | T-05 (1), T-06 (2) | T-12 (2), T-15 (1) | T-R4 (2), T-R6 (1) |
| 26 oct | T-07 (3) · **hito: núcleo; alcance congelado** | T-15 (2), T-14 (1) | T-R4 (2), T-R6 (1) |
| 27 oct | T-07 (1.5), T-08 (1.5) | T-14 (3) | T-R4 (3) |
| 28 oct | T-08 (2.5), reserva (0.5) | T-14 (3) · **hito: interfaz** | T-R3 (2), T-R4 (1) |
| 29 oct | T-17 (2.5), reserva (0.5) | T-16 (2), T-17 (1) | T-R3 (2), T-R5 (1) · laptop, ensayo final · **hito: ensayo** |

Insertar en el documento las capturas del 29 queda fuera de las horas declaradas (C-03): hay que hacerlo el 29 por la noche o el 30 antes de la entrega.

El calendario no tiene holgura. Si una tarea se retrasa más de medio día, se aplica el orden de recorte de design §16 y se avisa al equipo.

## 2. Tareas del MVP

### Núcleo matemático (A)

- [x] **T-01 · Base del proyecto, verificada en el entorno de Kiro Web** · A · 2 h · MVP
  - **Estado (20 de octubre): completada.** Los archivos base se crearon en el entorno de Kiro Web, donde `npm install` falló con HTTP 403 (red del entorno: solo integraciones). Por eso la instalación y las comprobaciones se hicieron en la computadora de A, con Node 24.22.0:
    - `npm test` (6 pruebas), `npm run build` y `npm run verificar-dist` pasan.
    - A revisó la página de prueba en el navegador. Plotly *basic* dibuja el relleno, el rectángulo, la línea y la anotación, y KaTeX dibuja la fórmula. La pestaña Red no muestra fallos ni recursos externos.
    - Las versiones fijadas están en el README, «Versiones instaladas».
  - **Depende de:** aprobación de `tasks.md`. Es la única tarea que instala dependencias.
  - **Archivos:** `package.json`, `package-lock.json`, `vite.config.js`, `index.html` mínimo, `src/main.js` vacío, `AGENTS.md` (design §18), `README.md` con los comandos de design §13, `tests/arquitectura.test.js` inicial y una página de prueba temporal.
  - **Aceptación (en el entorno de Kiro Web):**
    - **Instalación:** `npm install` instala solo `vite`, `vitest`, `plotly.js-basic-dist-min` y `katex`, y genera `package-lock.json` con las versiones fijadas. El README anota esas versiones y la versión de Node utilizada.
    - **Pruebas:** `npm test` ejecuta la prueba de arquitectura inicial y pasa.
    - **Build:** `npm run build` termina sin errores.
    - **Recursos locales:** `dist/index.html` y los CSS solo referencian archivos de `dist/`, sin direcciones `http` ni `https`; Plotly y KaTeX están empaquetados y las fuentes de KaTeX aparecen en `dist/assets`.
    - **Página de prueba:** confirma que Plotly *basic* dibuja una traza con relleno, una forma `rect`, una forma `line` y una anotación. Si el entorno no permite verla en un navegador, A la abre con `npm run preview` en su computadora. Si algo falla, se informa antes de seguir (design §14.3).
  - **Fuera de T-01:** la prueba en la laptop Windows (`npm ci`, `npm run preview` y el ensayo con el Wi-Fi apagado) corresponde al equipo en T-R5. **No bloquea T-02.**
  - **Si el registro npm sigue bloqueado** (HTTP 403 el 19 de octubre): la instalación, las pruebas y el build se hacen en la computadora de A con internet, y Kiro revisa los resultados y la carpeta `dist/`.
  - **Pruebas:** prueba de arquitectura inicial; revisión de `dist/`.
  - _Requisitos: R-22.1 a R-22.3, R-24; design §1, §13._
  - **Explicar:** qué hace cada dependencia y por qué la versión construida no necesita internet.

- [x] **T-02 · Racionales exactos y casos de referencia** · A · 2.5 h · MVP
  - **Estado: implementada y probada; revisión de R pendiente (T-R1 y T-R6).** Commit `bc08e42` en `avance-t04`. `tests/nucleo/racional.test.js` tiene 79 pruebas. `tests/casos-referencia.js` contiene los CR del MVP y COMP; CR-11, CR-13, CR-19 y CR-21 tienen entradas que las fuentes no fijan, anotadas en su campo `pendientes` sin rellenarlas.
  - **Depende de:** T-01.
  - **Archivos:** `src/nucleo/racional.js`, `tests/nucleo/racional.test.js`, `tests/casos-referencia.js` (lo transcribe A y lo verifica R en T-R1).
  - **Aceptación:**
    - Las invariantes de design §6 se cumplen: denominador positivo, fracción irreducible y sin «−0».
    - `desdeDecimal("0.1")` da 1/10 exacto; con la división entre cero se lanza un error interno.
    - `tests/casos-referencia.js` contiene todos los CR del MVP de requirements §14 con sus valores exactos.
  - **Pruebas:** invariantes, aritmética y comparación; CR-17 (0.1 + 0.2 = 3/10).
  - _Requisitos: R-03.2, R-18.1, R-18.5._
  - **Explicar:** por qué `Number` no basta (2⁵³) y cómo se simplifica una fracción con el mcd.

- [x] **T-03 · Polinomios** · A · 1.5 h · MVP
  - **Estado: implementada y probada; revisión de R pendiente (T-R6).** Commit `bc08e42`. `tests/nucleo/polinomio.test.js` tiene 30 pruebas, incluidos los tres ejemplos de aceptación.
  - **Depende de:** T-02.
  - **Archivos:** `src/nucleo/polinomio.js` y su prueba.
  - **Aceptación:** suma, resta, producto, potencia, escalado, derivada, división con resto, mcd mónico, `evaluar` exacto (Horner) y `evaluarAprox` solo para la gráfica. El polinomio cero es `coef = []`.
  - **Pruebas:** (x − 1)² = x² − 2x + 1; división de x³ − x entre (x − 1) sin resto; mcd((x − 1)²(x + 2), su derivada) = x − 1.
  - _Requisitos: R-02.2, R-02.7._
  - **Explicar:** la regla de Horner y qué significa que el mcd de f y f′ revele raíces repetidas.

- [x] **T-04 · Análisis de ceros y signos** · A · 7 h · MVP · **mayor riesgo**
  - **Estado: implementada y probada; revisión de R pendiente (T-R6).** Commit `bc08e42`. `tests/nucleo/ceros.test.js` tiene 30 pruebas con los CR de esta tarea. `tests/propiedades.test.js` tiene la parte de raíces racionales (3 pruebas sobre 400 polinomios, 100 escalados hasta 10⁸⁰, sin ningún E-SIS-01).
  - **Depende de:** T-03.
  - **Archivos:** `src/nucleo/ceros.js`, `tests/nucleo/ceros.test.js`, la parte de raíces racionales de `tests/propiedades.test.js`.
  - **Aceptación:**
    - Implementa los pasos 1 a 8 de design §8 y devuelve `AnalisisSigno` (design §8).
    - **Registro único:** cada raíz aparece una vez con su multiplicidad original; un segundo registro da E-SIS-02.
    - Toda raíz racional sale exacta; las irracionales salen con intervalo, representante y la cota de §9.
    - A se calcula sobre la parte primitiva (design §8, paso 2).
    - Profundidad máxima de 200 bisecciones, compartida por todo el análisis (paso 6). Si se agota antes de determinar la naturaleza de una raíz, E-SIS-01 sin resultado parcial. Si se agota en la aproximación, W-04 con la cota obtenida.
    - Ninguna raíz se marca como aproximada sin haber demostrado que es irracional.
    - `noNegativa` y `cambiaSigno` se deciden sin coma flotante.
  - **Pruebas:**
    - CR-01 (cero en el extremo 1), CR-04 (cero doble en el extremo 0), CR-05, CR-06 (sin ceros), CR-07 (tangencia), CR-08 (idénticamente cero), CR-14, CR-15 (√2 aproximada), CR-28, CR-29 (una sola raíz triple que cambia de signo), CR-30 (−2 simple y 1 doble), CR-31 (1/3 exacta).
    - Propiedad: 400 polinomios construidos con raíces racionales conocidas devuelven exactamente esas raíces y multiplicidades.
    - D-09:
      - CR-32 da un cero triple exacto en 0.
      - CR-33 y CR-34 terminan con E-SIS-01. En CR-34, la raíz racional nunca aparece como aproximada.
      - CR-35 da 1/3 exacta gracias a la parte primitiva.
      - CR-36 da ∛2 aproximada, con W-04 y una cota mayor que 10⁻¹²; el error frente a 3·∛2·10¹²⁶ es menor que la cota.
      - Los 100 polinomios escalados con factores de hasta 10⁸⁰ de la propiedad de raíces racionales no dan ningún E-SIS-01.
  - **Hito:** el 24 de octubre todas estas pruebas pasan.
  - _Requisitos: R-05.1 a R-05.5, R-21.1, R-21.3._
  - **Explicar:** Bolzano, Sturm, multiplicidad par frente a impar y el teorema de las raíces racionales (formulario §2.1).

- [x] **T-05 · Integral definida y valor promedio** · A · 3 h · MVP
  - **Estado: implementada y probada; revisión de R pendiente (T-R6).** Commit `d3bffdf`. `tests/nucleo/integral.test.js` (22 pruebas) y `tests/nucleo/promedio.test.js` (23 pruebas).
  - **Depende de:** T-03.
  - **Archivos:** `src/nucleo/integral.js`, `src/nucleo/promedio.js` y sus pruebas.
  - **Aceptación:**
    - `integrarDefinida` devuelve la antiderivada con F(0) = 0, el desglose `terminos` con `valorEnB` y `valorEnA`, y Fb, Fa e I exactos.
    - `valorPromedio` reutiliza I y no vuelve a integrar.
    - `rectanguloEquivalente` solo existe si `noNegativa`; si no, devuelve el motivo.
  - **Pruebas:** CR-01 (243/4; F(4) = 60, F(1) = −3/4), CR-02 (I = 6, f_prom = 2), CR-03 (40/3 y 10/3), CR-04, CR-18; I = (b − a)·f_prom exactamente.
  - _Requisitos: R-04, R-07, R-08._
  - **Explicar:** el teorema fundamental del cálculo, por qué no hay «+C» y por qué el promedio usa la integral con signo.

- [x] **T-06 · Área geométrica** · A · 2 h · MVP
  - **Estado: implementada y probada; revisión de R pendiente (T-R6).** Commit `e22ec7f`. `tests/nucleo/area.test.js` tiene 34 pruebas. Con T-06, `npm test` da 227/227 y `npm run build` es correcto. Queda para T-08 comprobar el área de los 400 polinomios con raíces conocidas (design §15).
  - **Depende de:** T-04 y T-05.
  - **Archivos:** `src/nucleo/area.js` y su prueba.
  - **Aceptación:** A_geo es la suma de |Iₖ| por tramos; nunca se usa |I| como sustituto; la cota M₁·δ² se calcula si hay cortes aproximados; si A_geo < |I|, E-SIS-02.
  - **Pruebas:** CR-05 (1), CR-06 (6), CR-14 (5), CR-15 (≈ 2.4379, aproximada), CR-28 (5923/972), CR-29 (1/2), CR-30 (59/4), CR-31 (5/18, exacta); A_geo ≥ |I|.
  - **Hito:** el 26 de octubre, T-02 a T-06 completas.
  - _Requisitos: R-06._
  - **Explicar:** por qué el área de x en [−1, 1] es 1 aunque la integral sea 0.

- [x] **T-07 · Números, errores, unidades, materiales y figuras** · A · 4.5 h · MVP y COMP
  - **Estado: implementada y probada; revisión de R pendiente (T-R6).** Commit «T-07: numeros, errores, unidades, materiales y figuras con pruebas» en `avance-t04`. Pruebas en `tests/nucleo/`: `numeros` (27), `errores` (7), `unidades` (7), `geometria` (12) y `materiales` (10). Con T-07, `npm test` da 290/290 y `npm run build` es correcto. El decimal del círculo usa `PI_APROX`; requirements §12 se alineó con design §6 y §9 por autorización del equipo.
  - **Depende de:** T-02.
  - **Archivos:** `src/nucleo/numeros.js`, `errores.js`, `unidades.js`, `materiales.js`, `geometria.js` y sus pruebas.
  - **Aceptación:**
    - `leerNumero` sigue el orden de design §11 y nunca usa `Number(texto)`.
    - El catálogo de errores contiene exactamente los códigos de requirements §10.
    - La conversión de cm² a m² divide entre 10 000.
    - Los costos se calculan con valores exactos.
    - Figuras: rectángulo, triángulo y círculo (k·π exacto y su aproximación). **El trapecio queda fuera** (T-D1).
  - **Pruebas:** CR-03 (Q666.67 y Q733.33 a partir de 2000/3 y 2200/3), CR-09, CR-10 (2 m²), CR-11, CR-13 (vacío; `Infinity`), CR-19 (sin trapecio; dimensión 0 → E-NUM-06), CR-20.
  - _Requisitos: R-03, R-14, R-15, R-17, R-19._
  - **Explicar:** por qué el área se convierte con el cuadrado del factor y por qué redondear 13.33 antes de multiplicar da Q666.50.

- [x] **T-08 · Casos de uso y pruebas globales** · A · 4 h · MVP
  - **Estado: implementada y probada; revisión de R pendiente (T-R6).** Commit «T-08: casos de uso, propiedades y arquitectura con pruebas» en `avance-t04`. Se cumplen los cuatro criterios de aceptación y las pruebas que pide la tarea. Hay 110 pruebas en `tests/casos-de-uso/` (`analizarPerfil` 62, `calcularFigura` 17, `estimarMaterial` 28 y `robustez` 3, con 900 entradas arbitrarias); `tests/propiedades.test.js` pasa de 3 a 43, y `tests/arquitectura.test.js`, de 6 a 43. Con T-08, `npm test` da 953/953 en 20 archivos y `npm run build` es correcto, ambos con código de salida 0.
  - **Pendiente fuera de T-08** (design §4, pasos 8 y 9): los campos `pasos` y `grafica` de `ResultadoPerfil` y `pasos` de `ResultadoFigura` valen `null`. Sus productores son `presentacion/pasos.js` (T-12) y `presentacion/datosGrafica.js` (T-15); T-17 debe conectarlos a los casos de uso. También quedan para T-11 el formato decimal de las cifras de W-02, W-03 y W-04 (hoy son fracciones exactas) y los textos «Q666.67» y «Q733.33» de CR-03. La invalidación en pantalla de CR-13 y CR-22 es de T-13. Las decisiones de contrato que R debe revisar están en `docs/RELEVO-KIRO.md` §7.
  - **Depende de:** T-06, T-07 y T-10.
  - **Archivos:** `src/casos-de-uso/analizarPerfil.js`, `calcularFigura.js`, `estimarMaterial.js`, `tests/casos-de-uso/`, `tests/propiedades.test.js` y la versión completa de `tests/arquitectura.test.js`.
  - **Aceptación:**
    - Validación por campos con errores acumulados; E-INT-01 y E-INT-02 sin intercambiar los límites.
    - Aptitud para estimar según design §9 (E-MOD-01 a E-MOD-03).
    - Los casos de uso devuelven `Resultado<T>` y nunca lanzan excepciones; E-SIS-01 y E-SIS-02 se capturan.
    - La prueba de arquitectura comprueba las dependencias de design §2 y la ausencia de `eval` y `new Function`.
  - **Pruebas:** todos los CR del MVP de principio a fin, en particular CR-03, CR-05, CR-06 y CR-08 (aptitud), CR-16 y CR-27 (equivalencias), CR-21 y CR-23; CR-33 y CR-34 devuelven E-SIS-01 sin resultados, pasos ni gráfica; propiedades de R-25.3 con 300 polinomios y el oráculo.
  - _Requisitos: R-01, R-16, R-19, R-20, R-24, R-25._
  - **Explicar:** el recorrido completo de un cálculo (design §4) y dónde está cada operación.

### Analizador, presentación e interfaz (B)

- [x] **T-09 · Analizador léxico y sintáctico** · B · 4 h · MVP
  - **Estado: implementada y probada; revisión de R pendiente (T-R6).** Commit «T-09: analizador léxico y sintáctico con pruebas» en `avance-t04`. `tests/expresiones/lexico.test.js` (95 pruebas) y `tests/expresiones/sintaxis.test.js` (174 pruebas, incluidos los textos de la función de todos los CR). Con T-09, `npm test` da 559/559 en 15 archivos y `npm run build` es correcto. Las posiciones de fichas, nodos y errores cuentan desde 1; las interpretaciones que R debe confirmar están en `docs/RELEVO-KIRO.md` §7.
  - **Depende de:** T-01, solo para ejecutar las pruebas; el código puede escribirse en paralelo. Las fichas guardan el texto del número y la conversión a racional se hace en la normalización.
  - **Archivos:** `src/expresiones/lexico.js`, `sintaxis.js` y sus pruebas.
  - **Aceptación:** el orden de comprobación de design §5.2, la gramática y la tabla de productos implícitos de §5.3; errores con posición; sin `eval` ni `new Function`.
  - **Pruebas:** la parte sintáctica de la tabla de gramática (design §15): `x^` y `x x` → E-EXP-02; `y + 1` y `X^2` → E-EXP-03; `0,5x` y `1e3` → E-EXP-04; `sqrt(x)`, `x==1` y `5 cm` → E-EXP-06; `x^-1` y `x^2^3` → E-EXP-07; `f(x)=x^2` → E-EXP-12; textos de más de 200 caracteres y más de 10 paréntesis → E-EXP-11.
  - _Requisitos: R-02.5, R-02.8, R-20._
  - **Explicar:** qué es un árbol de expresión y por qué analizar el texto no es ejecutarlo.

- [x] **T-10 · Normalización al modelo validado** · B · 4 h · MVP
  - **Estado: implementada y probada; revisión de R pendiente (T-R6).** Commit «T-10: normalización al modelo validado con pruebas» en `avance-t04`. `tests/expresiones/normalizar.test.js` tiene 207 pruebas. Las entradas del prototipo no están en el repositorio; por autorización del equipo se usa en su lugar una **tabla reconstruida para pruebas**, `tests/expresiones/tabla-gramatica.js` (60 válidas y 84 inválidas, con los 12 códigos E-EXP), derivada a mano de requirements y design y sin atribuirla al prototipo. Con T-10, `npm test` da 766/766 en 16 archivos y `npm run build` es correcto. Las interpretaciones que R debe confirmar están en `docs/RELEVO-KIRO.md` §7.
  - **Depende de:** T-03 y T-09.
  - **Archivos:** `src/expresiones/normalizar.js` y la tabla de gramática completa en `tests/expresiones/`.
  - **Aceptación:**
    - Reglas de design §5.4; `x^4` → E-EXP-10, `2^4` y `x^0` → E-EXP-07, `x/x` → E-EXP-08 y `x/(2-2)` → E-EXP-09.
    - Sin tope para los coeficientes normalizados (D-09): `(0.000001x)^3` se acepta con el coeficiente 1/10¹⁸ (CR-32). Los textos de CR-33 a CR-36 se interpretan sin error y dan los polinomios esperados.
    - `huboDesarrollo` y `textoNormalizado` correctos.
  - **Pruebas:** las 33 entradas válidas y 59 inválidas del prototipo (design §0); CR-07, CR-12, CR-16, CR-17, CR-21, CR-27 y CR-32 a CR-36.
  - _Requisitos: R-02, R-03.2._
  - **Explicar:** por qué `(x-1)^2` y `x^2 - 2x + 1` dan el mismo modelo y por qué se rechaza `1/x`.

- [x] **T-11 · Formato de números y fórmulas** · B · 2.5 h · MVP
  - **Estado: implementada y probada; revisión de R pendiente (T-R6).** Commit «T-11: formato de números y fórmulas con pruebas» en `avance-t04`. `tests/presentacion/formato.test.js` tiene 123 pruebas: los cinco casos de esta tarea, los 25 textos decimales de `casos-referencia.js`, valores a mitad, negativos, «−0», unidades, las tres clases de Cantidad y la coincidencia con `textoNormalizado` y `latexNormalizado` de T-10 en las 60 entradas válidas de la tabla reconstruida. Con T-11, `npm test` da 1076/1076 en 21 archivos y `npm run build` es correcto, ambos con código de salida 0. Las decisiones que R debe revisar están en `docs/RELEVO-KIRO.md` §7.
  - **Depende de:** T-02.
  - **Archivos:** `src/presentacion/formato.js` y su prueba.
  - **Aceptación:** fracciones y LaTeX; 4 decimales en los valores y 2 en los quetzales; «=» o «≈» según la expansión decimal; redondeo mitad alejándose de cero calculado sobre el racional; sin «−0»; monomios al estilo del curso (design §14.1).
  - **Pruebas:** 243/4 → «= 60.75»; 40/3 → «≈ 13.3333»; 2000/3 → «Q666.67»; 2200/3 → «Q733.33»; −1/10⁹ → «≈ 0.0000», sin signo.
  - _Requisitos: R-18.2 a R-18.4._
  - **Explicar:** por qué se redondea una sola vez, al final.

- [x] **T-12 · Procedimientos paso a paso** · B · 3.5 h · MVP
  - **Estado: implementada y probada; revisión de R pendiente (T-R6).** Commit «T-12: procedimientos paso a paso con pruebas» en `avance-t04`. `tests/presentacion/pasos.test.js` tiene 37 pruebas, con resultados reales de los casos de uso: CR-01 (F(4) = 60, F(1) = −3/4, 243/4), CR-02 (equivalencia con la pizarra), CR-05 (tramos), CR-03 (estimación) y además CR-06, CR-07, CR-08, CR-14, CR-15, CR-20 y las figuras. Ningún paso de los perfiles válidos de los CR ni de 4 figuras contiene «+C». `pasos.js` todavía no está conectado a `analizarPerfil` ni a `calcularFigura`: eso es de T-17. Con T-12, `npm test` da 1113/1113 en 22 archivos y `npm run build` es correcto, ambos con código de salida 0. Las decisiones que R debe revisar están en `docs/RELEVO-KIRO.md` §7.
  - **Depende de:** T-11 y los contratos de design §10. Se desarrolla con datos simulados y se conecta con los reales durante la integración.
  - **Archivos:** `src/presentacion/pasos.js` y su prueba.
  - **Aceptación:** los procedimientos de design §14.2, que solo formatean los datos del núcleo; sustituciones negativas entre paréntesis; ningún resultado contiene «+C».
  - **Pruebas:** los textos de CR-01 coinciden con el formulario §4.2 (F(4) = 60, F(1) = −3/4, 243/4); CR-02 con §5.2, incluida la equivalencia con la pizarra; CR-05 con los tramos de §2; CR-03 con la estimación de §7.2.
  - _Requisitos: R-09._
  - **Explicar:** cada paso de los ejercicios de clase de x³ − 1 y 1 + x².

- [x] **T-13 · Estado e invalidación** · B · 3 h · MVP
  - **Estado: implementada y probada; revisión de R pendiente (T-R6).** Commit «T-13: estado e invalidación con pruebas» en `avance-t04`. `tests/interfaz/estado.test.js` tiene 42 pruebas sin DOM, también las de `navegacion.js`, sobre una ventana simulada con historial. Cubren CR-22 (tras calcular CR-03 y cambiar b a 5 no quedan resultado, pasos, gráfica ni estimación), un error tras un resultado válido, la invalidación de la estimación, `cargarEjemplo` con un catálogo de prueba y el botón Atrás. `ejemplos.js` (T-16) todavía no existe: `cargarEjemplo` recibe el catálogo como argumento. Con T-13, `npm test` da 1155/1155 en 23 archivos y `npm run build` es correcto, ambos con código de salida 0. Las decisiones de contrato están en `docs/RELEVO-KIRO.md` §7.
  - **Depende de:** los contratos de design §10 y §12.
  - **Archivos:** `src/interfaz/estado.js`, `navegacion.js` y `tests/interfaz/estado.test.js`.
  - **Aceptación:** transiciones puras de design §12; al editar se retiran el resultado y la estimación que depende de él (D-04); `cargarEjemplo` sigue el mismo camino que una entrada manual.
  - **Pruebas:** CR-22 (calcular CR-03, cambiar b a 5 y comprobar que no quedan resultado, pasos, gráfica ni estimación); un error tras un resultado válido no conserva el anterior.
  - _Requisitos: R-12, R-13.2._
  - **Explicar:** por qué un resultado viejo no puede quedar visible con datos nuevos.

- [x] **T-14 · Vistas, HTML y CSS accesibles** · B · 7 h · MVP y COMP
  - **Estado: implementada; revisión manual de R pendiente (T-R2 y T-R3).** Commit «T-14: vistas, HTML y CSS accesibles» en `avance-t04`. Las tres secciones funcionan con los casos de uso reales a través del estado de T-13: perfil (I, A_geo y f_prom con unidades, distintivo cuando I ≠ A_geo, ceros, rectángulo equivalente, advertencias y aptitud), figuras (rectángulo, triángulo y círculo, en m o cm, con el área en m²) y estimación (fuente o motivo, costos y supuestos fijos). La gráfica, los pasos, KaTeX y el selector de ejemplos son puntos de integración marcados (T-15, T-16 y T-17); la página dice que faltan y no muestra datos simulados. Comprobación automática en Chrome sin interfaz sobre el build: CR-01, CR-03 (Q666.67 y Q733.33) y CR-05; errores por campo con `aria-invalid` y `aria-describedby`; resumen con `role="alert"`; foco al encabezado o al resumen; sin desplazamiento horizontal a 360 px; contraste mínimo medido 5.05:1; orden de tabulación y contorno de 3 px. La tarea no añade pruebas automáticas (su prueba es la revisión manual); `npm test` sigue en 1155/1155 en 23 archivos y `npm run build` es correcto, ambos con código de salida 0. Las decisiones están en `docs/RELEVO-KIRO.md` §7.
  - **Depende de:** T-11 y T-13. Los resultados reales llegan durante la integración.
  - **Archivos:** `index.html`, `src/estilos/app.css`, `src/interfaz/vistaPerfil.js`, `vistaFiguras.js`, `vistaEstimacion.js`, `vistaComun.js` y `src/main.js`.
  - **Aceptación:**
    - El flujo de design §14.5 con tres secciones; la figura permite rectángulo, triángulo y círculo.
    - Etiquetas y unidades visibles; errores asociados con `aria-describedby`; regiones `aria-live`; foco visible; contraste de 4.5:1; utilizable desde 360 px.
    - El texto del usuario se muestra solo como texto (sin `innerHTML`).
    - Los supuestos de la estimación siempre están visibles.
  - **Pruebas:** revisión manual (T-R2): teclado, 360 px y mensajes por campo.
  - _Requisitos: R-01, R-11, R-17.5, R-19.3, R-23._
  - **Explicar:** el recorrido del usuario y por qué la interfaz no calcula.

- [ ] **T-15 · Datos de la gráfica y adaptador de Plotly** · B · 3 h · MVP
  - **Depende de:** T-01 y el contrato `AnalisisSigno`.
  - **Archivos:** `src/presentacion/datosGrafica.js`, `src/adaptadores/graficaPlotly.js` y la prueba de `datosGrafica`.
  - **Aceptación:** curva, regiones por tramo con leyenda «Sobre el eje (+)» y «Bajo el eje (−)», línea de promedio, rectángulo equivalente si corresponde y ceros marcados; carga diferida y precargada; `limpiar` al invalidar; cualquier fallo se convierte en W-07 y los resultados se conservan; si algún valor no es finito, tampoco se dibuja (W-07). **Sin anotaciones «+» y «−»** (T-D3).
  - **Pruebas:** `datosGrafica` incluye a, b y los ceros entre los puntos; revisión manual con el fragmento de Plotly bloqueado (W-07).
  - _Requisitos: R-10.1 a R-10.6._
  - **Explicar:** por qué la gráfica dibuja el modelo pero no calcula el área.

- [ ] **T-16 · Fórmulas con KaTeX y ejemplos** · B · 2 h · MVP
  - **Depende de:** T-12.
  - **Archivos:** `src/adaptadores/formulasKatex.js` y `src/ejemplos/ejemplos.js`.
  - **Aceptación:** primero el texto y después la mejora con KaTeX (`throwOnError: true`, `trust: false`), con W-08 si falla; los ejemplos solo contienen entradas, sin resultados, y están rotulados por origen.
  - **Pruebas:** los ejemplos incluyen como mínimo CR-01, CR-02, CR-03, CR-05, CR-06, CR-07, CR-09 y CR-10 (R-13.5); revisión manual con KaTeX bloqueado.
  - _Requisitos: R-09.8, R-13._
  - **Explicar:** qué ocurre si falla una biblioteca durante la exposición.
  - **Recorte:** si hay retraso, la mejora con KaTeX es lo primero que se recorta (design §16).

### Integración (A y B)

- [ ] **T-17 · Integración y correcciones** · A 2.5 h + B 1 h · MVP
  - **Depende de:** T-08 y T-12 a T-15. T-16 se incorpora en la última hora del 29 de octubre.
  - **Archivos:** `src/main.js` y correcciones puntuales en las carpetas de cada uno.
  - **Aceptación:** los datos simulados se reemplazan por los casos de uso reales; los cuatro casos de la exposición (CR-01, CR-02, CR-03 y CR-05) funcionan en el build servido con `npm run preview`; no queda ningún dato simulado en `src/`.
  - **Pruebas:** `npm test` completo; recorrido manual de T-R2.
  - _Requisitos: R-25.4; condiciones de requirements §15._
  - **Explicar:** cómo se conectan las capas sin que la interfaz calcule.

### Revisión y documentación (R, unas 30 h; fuera de las 60 h de programación)

- [ ] **T-R1 · Verificar los casos de referencia** · R · 4 h · Depende de T-02. Comprueba cada valor de `tests/casos-referencia.js` contra el formulario y requirements §14. _R-25.1._
- [ ] **T-R2 · Lista de revisión manual** · R · 3 h · Redacta `docs/revision-manual.md`: tres secciones, teclado, 360 px, contraste, invalidación, Plotly y KaTeX bloqueados, y modo sin internet. _R-25.4._
- [ ] **T-R3 · Ejecutar la revisión manual** · R · 4 h · Depende de T-R2; la segunda parte, de T-17. El 28 (2 h), al final del día, revisa lo que no depende de datos reales con T-14: teclado, foco, 360 px y contraste. El 29 (2 h), tras T-17: invalidación, fallos de Plotly y KaTeX, los cuatro casos y el tiempo de respuesta inferior a 1 s (R-21.2). Registra cada punto como aprobado o fallido.
- [ ] **T-R4 · Documento académico** · R · 14 h · Desde el 21 de octubre, a partir del formulario: problema, justificación, modelo matemático, desarrollo, resultados y conclusiones (R-26.2), con las limitaciones conocidas (R-26.3). Las capturas se añaden en T-R5.
- [ ] **T-R5 · Ensayo del equipo en la laptop de exposición** · R · 2 h · Dos sesiones en la laptop Windows; ninguna bloquea las tareas de programación (C-12).
  - **Primera sesión (22 oct, 1 h; depende de T-01):** copiar el proyecto sin `node_modules` ni `dist` (por ejemplo, con un ZIP descargado del espacio de trabajo). Con internet: `npm ci`, `npm test` y `npm run build`. Después, con el Wi-Fi apagado: `npm run preview` y la página de prueba. Se registran la versión de Node y cualquier problema de Windows (PowerShell, OneDrive) para corregirlo con tiempo.
  - **Ensayo final (29 oct, 1 h; depende de T-17):** con el Wi-Fi apagado, `npm run preview` y CR-01, CR-02, CR-03 y CR-05. Las capturas van al documento (design §13).
  - _Requisitos: R-22, R-25.4._
- [ ] **T-R6 · Revisión de cambios** · R · 3 h · Repartidas del 24 al 26 de octubre: revisa en la copia local los cambios de cada tarea terminada, comprueba la definición de terminado y que el código coincide con el diseño. No hay PR mientras el equipo no los autorice.

## 3. Complementos pospuestos (DESEABLE, D-08)

Solo se hacen si sobra la reserva de 1 h después del 29 de octubre o tras la entrega; ninguno es condición del MVP.

- [ ] **T-D1 · Trapecio** · A · 0.5 h · `geometria.js` y la opción en `vistaFiguras.js` (con acuerdo de B). Prueba: CR-19, trapecio de 6, 4 y 2 m → 10 m². _R-14.2._
- [ ] **T-D2 · Tabla de valores (x, f(x))** · B · 0.5 h · Desde el modelo validado; muestra el método de los apuntes (P1-D, con el valor confirmado 26 en x = 3). _R-10.7._
- [ ] **T-D3 · Anotaciones «+» y «−» en la gráfica** · B · 0.5 h · La leyenda y el resumen textual de los tramos ya cumplen R-10.2.

## 4. Trabajo posterior (POSTERIOR, no antes del 29 de octubre)

- [ ] **T-P1 · Centroides de una sola función no negativa** · R-27 · Contrato de design §10; pruebas CR-24; E-CEN-01 y E-CEN-02. El ejemplo entre dos curvas (CR-25) sigue siendo solo una referencia académica.
- [ ] **T-P2 · Comparación numérica acotada** · R-28 · Rectángulos de una altura y trapecios compuestos con n ∈ {1, 2, 4, 8, 16}; prueba CR-26; Simpson se explica como exacta para grado ≤ 3.

## 5. Primer paso de implementación (histórico: T-01 ya está completada)

**T-01** es la primera tarea y la única que instala dependencias. Cuando el equipo la autorice:

1. En el entorno de Kiro Web, sin commits ni PR, se crea la base del proyecto y se ejecutan `npm install`, `npm test` y `npm run build`.
2. Se revisa `dist/`: todos los recursos son locales, Plotly y KaTeX están empaquetados y las fuentes de KaTeX están en `dist/assets`. La página de prueba confirma las formas de Plotly.
3. Si el registro npm sigue bloqueado, los pasos 1 y 2 se hacen en la computadora de A y Kiro revisa los resultados. Si Plotly *basic* no dibuja las formas, se informa antes de seguir (design §14.3 y §16, riesgo 5).
4. Al terminar T-01 empieza T-02. La prueba física en la laptop es la primera sesión de T-R5 (22 de octubre) y no la bloquea.
5. En paralelo, B puede empezar T-09, que no depende de T-01 para escribir código, pero sí para ejecutar las pruebas.
