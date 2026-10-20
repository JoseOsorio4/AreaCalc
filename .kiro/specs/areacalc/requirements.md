# ÁreaCalc — Documento de requisitos

> **Estado:** v0.5. Etapa A aprobada el 19 de octubre de 2026. La v0.2 incorporó las confirmaciones del equipo y la v0.3 añadió CR-31. La v0.4 registró la decisión D-09, y la v0.5 incorpora su resolución (C-11): no hay tope nuevo de coeficientes, R-05.3 queda confirmado y se añaden CR-32 a CR-36. · **Fecha:** 19 de octubre de 2026
> **Documentos canónicos:** este archivo (requisitos) · `docs/formulario-matematico.md` (definiciones académicas) · `design.md` (Etapa B, cerrada) · `tasks.md` (Etapa C, plan listo y sin ejecutar).
> Aprobar este documento no autoriza implementar.

## 0. Convenciones

**Procedencia:** **[Confirmado]** = decidido por el equipo en el prompt consolidado (PC) o visible en los apuntes (PDF) · **[Propuesta]** = propuesta de Kiro, requiere aprobación · **[Supuesto]** = supuesto reversible para avanzar · **[Pendiente]** = decisión abierta (§17).

**Prioridad:** **MVP** = obligatorio para la entrega · **COMP** = complemento del MVP · **DESEABLE** = solo si no retrasa el núcleo · **POSTERIOR** = fuera de la primera entrega.

**EARS en español:**

- Ubicuo: «EL SISTEMA DEBERÁ…».
- Evento: «CUANDO…, EL SISTEMA DEBERÁ…».
- Estado: «MIENTRAS…, EL SISTEMA DEBERÁ…».
- No deseado: «SI…, ENTONCES EL SISTEMA DEBERÁ…».
- Opcional: «DONDE se incluya…, EL SISTEMA DEBERÁ…».

**Fuentes revisadas:**

- PC «AreaCalcPromt», leído completo desde el adjunto del mensaje; no existe como archivo en el repositorio.
- PDF «Procesos que usamos en clases»: 2 páginas de fotografías, revisadas visualmente. Sus identificadores (P1-A … P2-C) están en el formulario §0.
- **No disponibles:** los dos enlaces de ChatGPT, que devuelven HTTP 403.
- **«Markdown pegado.md»:** el mensaje del 19 de octubre lo menciona como adjunto, pero no llegó ni al contexto ni al sistema de archivos.
  - Es una fuente histórica. El equipo estableció que, si contradice las confirmaciones o los requisitos aprobados, prevalecen estos.
  - La única contradicción conocida es el costo de Q666.50, que proviene de redondear el área antes de multiplicar. El valor correcto es Q666.67 (CR-03).

**Estado del repositorio:** `JoseOsorio4/AreaCalc`, rama `main`, un solo commit («first commit»). Solo contiene `README.md` con el título. No hay código, `AGENTS.md` ni `CONTRIBUTING.md`. Las especificaciones están en `.kiro/specs/areacalc/` y `docs/`, sin commit.

**Aprobación (v0.2).** Las etiquetas [Propuesta] de la v0.1 quedaron aprobadas como línea base, salvo los ajustes indicados en §17. Las confirmaciones del equipo figuran en §16 con el código C-nn.

## 1. Problema [Confirmado]

Cuando una superficie tiene un borde curvo, aproximarla con un solo rectángulo puede sobrestimar o subestimar su área. En el caso práctico, el error va de −40 % a +80 % según la altura elegida (formulario §7.3). Además, aplicar y verificar integrales a mano es difícil y propenso a errores.

ÁreaCalc relaciona:

- el modelo matemático de la superficie;
- el cálculo verificable de su área;
- su altura o valor promedio;
- su gráfica;
- el procedimiento académico;
- una estimación teórica de material y costo.

## 2. Público [Confirmado]

- Estudiantes de Cálculo Integral.
- Personas que hacen cálculos preliminares de superficies en proyectos técnicos de diseño, construcción y fabricación.
- Usuarios inmediatos: el equipo y el catedrático durante la exposición del 31 de octubre de 2026 [Supuesto].

## 3. Propósito [Confirmado]

Aplicación web para analizar superficies planas regulares y perfiles de altura variable, calcular sus áreas y valores promedio, visualizar sus procedimientos y obtener estimaciones teóricas de material y costo.

- **Valor educativo:** mostrar cómo se obtiene cada resultado con el método del curso.
- **Valor práctico:** dar una estimación preliminar con supuestos explícitos.

Los ejemplos de aplicación son un panel decorativo, una pared con borde superior variable, una pieza de lámina, un revestimiento y un rótulo con borde curvo. Todos son **el mismo problema geométrico**: la región entre un perfil y = f(x) ≥ 0 y el eje X sobre [a, b]. No justifican motores ni productos separados, y el sistema no se diseña para un único negocio.

## 4. Límites [Confirmado]

ÁreaCalc **no**:

- optimiza cortes, minimiza desperdicios, garantiza ahorro ni determina la compra comercial exacta;
- obtiene ecuaciones a partir de fotografías: el usuario escribe la función o elige un ejemplo admitido;
- es una calculadora universal ni un solucionador simbólico: solo admite la familia de §9;
- usa IA generativa para calcular ni para redactar procedimientos durante el uso;
- hace análisis de cargas ni recomendaciones estructurales;
- convierte áreas en litros de pintura, baldosas o láminas.

## 5. Glosario

| Término | Definición |
|---|---|
| Perfil | Función y = f(x) que describe la altura del borde de una superficie sobre el eje X. |
| Familia admitida | Funciones que el MVP acepta: polinomios en x de grado ≤ 3 con coeficientes racionales (§9). |
| Modelo validado | Representación única y normalizada de la función ya validada. La comparten el cálculo, la gráfica y el procedimiento. |
| Forma normalizada | Polinomio desarrollado c₀ + c₁x + c₂x² + c₃x³ con coeficientes racionales exactos. |
| Integral con signo (I) | ∫[a,b] f(x) dx = F(b) − F(a). Las partes bajo el eje restan (área neta). |
| Área geométrica (A_geo) | ∫[a,b] \|f(x)\| dx. Todas las partes suman. |
| Antiderivada (F) | Función con F′ = f. En resultados definidos no lleva «+C». |
| Valor promedio (f_prom) | I/(b − a). Tiene las unidades de f. |
| Rectángulo equivalente | Rectángulo de base b − a y altura f_prom. Tiene el área de la región solo si f ≥ 0. |
| Cero con cambio de signo | Raíz interior donde f pasa de positiva a negativa o al revés. Divide el intervalo en tramos. |
| Tangencia | Raíz interior sin cambio de signo (raíz doble): la curva toca el eje sin cruzarlo. |
| Tramo | Subintervalo donde f tiene signo constante. |
| Exacto / aproximado | Un valor es exacto si se obtuvo sin aproximaciones; tener muchos decimales no lo hace exacto. |
| Interpretación | Abstracta (u, u²) o perfil físico (x y f(x) en metros). |
| Perfil físico válido | Interpretación en metros, f(x) ≥ 0 en todo [a, b] y A_geo > 0. |
| Área útil / área estimada | A_geo (o el área de una figura) en m² / área útil × (1 + w/100). |
| Adicional (w) | Porcentaje añadido sobre el área útil. No es un porcentaje de pérdida sobre lo comprado. |
| Resultado vigente | Resultado que corresponde exactamente a los datos actuales. |
| Centroide (x̄, ȳ) | Centro geométrico de una región. Coincide con el centro de masa solo si la densidad es uniforme. |
| Analizador sintáctico (parser) | Componente que convierte el texto en una estructura (árbol) sin ejecutarlo. |
| Lista blanca | Conjunto cerrado de construcciones permitidas. Todo lo demás se rechaza. |
| CDN | Servidor externo de bibliotecas. Prohibido en tiempo de uso porque exige internet. |

## 6. Alcance del MVP

**Recorrido principal [Confirmado]:** definir superficie → validar modelo → calcular → visualizar y explicar → estimar material. El área y el valor promedio comparten el mismo cálculo de la integral.

### 6.1 Núcleo obligatorio (MVP) [Confirmado]

| N.º | Capacidad | Requisitos |
|---|---|---|
| 1 | Área bajo una curva mediante la integral definida, dentro de la familia admitida | R-01 a R-06 |
| 2 | Diferenciación entre integral con signo y área geométrica | R-04 a R-06, R-11 |
| 3 | Valor promedio | R-07, R-08 |
| 4 | Gráfica de la función y de la región | R-10 |
| 5 | Procedimiento conforme al método del curso | R-09 |
| 6 | Estimación de material y costo teórico | R-16, R-17 |
| 7 | Ejemplos resueltos | R-13 |
| 8 | Validaciones, unidades, errores y pruebas | R-03, R-15, R-18 a R-25 |

### 6.2 Complemento geométrico (COMP) [Confirmado]

Rectángulo, triángulo y círculo (R-14). El trapecio es **DESEABLE**. El complemento no desplaza el contenido de Cálculo Integral.

## 7. Ampliaciones y exclusiones

### 7.1 Fase posterior (POSTERIOR)

- Centroides de regiones bajo una sola función no negativa (R-27). Sus fórmulas ya están documentadas (formulario §10–§11).
- Comparación numérica acotada (R-28) [Propuesta: evaluada, pero no forma parte del MVP].

### 7.2 Fuera del MVP [Confirmado]

- Calculadora general de área entre dos curvas.
- Terrenos por coordenadas o con la fórmula del zapatero; mapas, GPS y topografía.
- Volúmenes y superficies de revolución; integrales impropias; intervalos infinitos; tratamiento general de singularidades.
- Derivadas parciales y optimización multivariable; análisis de cargas.
- Optimización de cortes o del aprovechamiento de rollos; ajuste de curvas a partir de puntos.
- Reconocimiento de fotografías o medidas.
- Litros de pintura o baldosas sin un modelo de cobertura.
- Cuentas, roles, pagos, inventario o base de datos.
- Solucionador simbólico universal y procedimientos generados por IA.
- Métodos de sustitución o por partes como calculadoras independientes. Podrán incorporarse más adelante para familias concretas.
- Circuitos eléctricos y Kirchhoff (corresponden a Física; descartados).
- Exportación a PDF e historial persistente.

## 8. Requisitos

Los identificadores son estables: si un requisito se elimina, su número no se reutiliza.

### R-01 Entrada del perfil · MVP

**Historia:** Como estudiante, quiero escribir una función de x y un intervalo, para analizar la región que forma con el eje X.

1. **R-01.1** EL SISTEMA DEBERÁ ofrecer campos etiquetados para f(x), el límite inferior a y el límite superior b. Junto al campo de la función se mostrará el prefijo «f(x) =».
2. **R-01.2** EL SISTEMA DEBERÁ mostrar junto a la función el soporte admitido («polinomios en x de grado ≤ 3») y al menos dos ejemplos válidos, como `x^3 - 1` y `2 + x^2/4`.
3. **R-01.3** EL SISTEMA DEBERÁ ofrecer un selector de interpretación: «Ejercicio abstracto (u, u²)» o «Perfil físico (x y f(x) en metros)». El valor inicial será «Ejercicio abstracto» [Propuesta].
4. **R-01.4** CUANDO el usuario solicite calcular, EL SISTEMA DEBERÁ validar la función, los límites y la interpretación antes de cualquier cálculo. SI alguna validación falla, ENTONCES NO DEBERÁ mostrar resultados parciales.
5. **R-01.5** EL SISTEMA DEBERÁ aceptar límites negativos, cero o positivos, porque representan posiciones y no dimensiones.
6. **R-01.6** SI a = b, ENTONCES EL SISTEMA DEBERÁ rechazar el intervalo con E-INT-01. SI a > b, ENTONCES DEBERÁ rechazarlo con E-INT-02 **sin intercambiar los límites**.
7. **R-01.7** CUANDO la entrada sea válida, EL SISTEMA DEBERÁ mostrar la forma interpretada de la función, para que el usuario confirme cómo se leyó.
8. **R-01.8** EL SISTEMA DEBERÁ calcular solo cuando el usuario lo solicite, con el botón «Calcular» o la tecla Intro [Propuesta].

### R-02 Familia admitida y modelo validado · MVP

**Historia:** Como estudiante, quiero saber exactamente qué funciones se aceptan y que las expresiones equivalentes den el mismo resultado, para confiar en el cálculo.

1. **R-02.1** EL SISTEMA DEBERÁ admitir únicamente polinomios en x cuya forma normalizada tenga grado ≤ 3 y coeficientes racionales, escritos con las construcciones de la Tabla 9.1. Es una [Propuesta] de viabilidad, no una exigencia académica confirmada.
2. **R-02.2** EL SISTEMA DEBERÁ convertir cada entrada admitida en **un único modelo validado**, con coeficientes racionales exactos en fracciones irreducibles. El cálculo, la gráfica y el procedimiento usarán ese modelo.
3. **R-02.3** CUANDO dos entradas sean algebraicamente equivalentes, por ejemplo `(x-1)^2` y `x^2 - 2x + 1`, EL SISTEMA DEBERÁ producir el mismo modelo y resultados idénticos.
4. **R-02.4** SI alguna subexpresión normalizada supera el grado 3, ENTONCES EL SISTEMA DEBERÁ rechazar la entrada con E-EXP-10 [Propuesta].
5. **R-02.5** SI la entrada contiene una construcción no admitida, ENTONCES EL SISTEMA DEBERÁ rechazarla con el error específico de §10, explicar la limitación y sugerir una entrada admitida.
6. **R-02.6** EL SISTEMA NO DEBERÁ simplificar divisiones entre expresiones con x (`x/x`, `(x^2-1)/(x-1)`) para volverlas admisibles. DEBERÁ rechazarlas, porque la expresión original no está definida en algún punto.
7. **R-02.7** La representación interna DEBERÁ admitir los grados que generan las operaciones derivadas: antiderivada ≤ 4 en el MVP; x·f(x) ≤ 4, [f(x)]² ≤ 6 y antiderivadas ≤ 7 en la fase de centroides. Esto no amplía el grado de entrada.
8. **R-02.8** SI la entrada supera los límites de la Tabla 9.2, ENTONCES EL SISTEMA DEBERÁ rechazarla con E-EXP-11 antes de normalizarla.

### R-03 Validación de valores numéricos · MVP

**Historia:** Como usuario, quiero que se distinga un campo vacío, un cero válido y un valor inválido, para corregir exactamente lo que está mal.

1. **R-03.1** EL SISTEMA DEBERÁ aceptar en límites, dimensiones, precio y adicional números enteros o decimales con punto, como `-1`, `0` y `2.5`.
2. **R-03.2** EL SISTEMA DEBERÁ interpretar cada decimal escrito como una fracción decimal exacta (`0.1` = 1/10), no como una aproximación binaria.
3. **R-03.3** SI un campo obligatorio está vacío o solo contiene espacios, ENTONCES EL SISTEMA DEBERÁ mostrar E-NUM-01. No lo tratará como cero.
4. **R-03.4** EL SISTEMA DEBERÁ aceptar el cero en los límites, los coeficientes, el precio (Q0) y el adicional (0 %). DEBERÁ rechazarlo en las dimensiones geométricas (E-NUM-06) y en la longitud del intervalo (E-INT-01).
5. **R-03.5** SI un valor no es numérico, usa coma decimal, separadores de miles o notación científica, ENTONCES EL SISTEMA DEBERÁ rechazarlo con E-NUM-02 e indicar el formato admitido [Propuesta].
6. **R-03.6** SI un valor no es finito (`Infinity`, `NaN`), ENTONCES EL SISTEMA DEBERÁ rechazarlo con E-NUM-03. SI excede los rangos o decimales de la Tabla 9.3, ENTONCES DEBERÁ rechazarlo con E-NUM-04.

### R-04 Integral con signo · MVP

**Historia:** Como estudiante, quiero obtener la integral definida exacta, con su signo, para comprobar el teorema fundamental del cálculo.

1. **R-04.1** CUANDO la entrada sea válida, EL SISTEMA DEBERÁ calcular I = F(b) − F(a). F se obtiene sobre el modelo validado con reglas deterministas: linealidad, integral de constantes y regla de la potencia.
2. **R-04.2** EL SISTEMA DEBERÁ presentar I como «integral con signo (área neta)», con su valor exacto y su aproximación (§12), en u² o m².
3. **R-04.3** EL SISTEMA NO DEBERÁ añadir «+C» a I ni a ningún resultado definido.
4. **R-04.4** EL SISTEMA NO DEBERÁ obtener I por integración numérica ni presentar un resultado numérico como exacto.

### R-05 Análisis de signo y ceros · MVP

**Historia:** Como estudiante, quiero saber si la función cruza o toca el eje X, para entender cuándo la integral coincide con el área.

1. **R-05.1** EL SISTEMA DEBERÁ determinar los ceros de f en [a, b] y clasificarlos como: interior con cambio de signo, interior sin cambio de signo (tangencia) o en un extremo.
2. **R-05.2** EL SISTEMA DEBERÁ decidir si f cambia de signo en (a, b) y si f ≥ 0 en [a, b] con un método válido para toda la familia admitida. El método no dependerá solo de muestrear puntos ni de comparar con cero valores en coma flotante. El método concreto se definirá en la Etapa B.
3. **R-05.3** CUANDO un cero sea racional y se verifique evaluando el polinomio exactamente, EL SISTEMA DEBERÁ tratarlo como exacto. Las raíces múltiples de esta familia siempre son racionales (formulario §2). EL SISTEMA DEBERÁ reconocer como exacto **todo** cero racional de [a, b], incluidos los no enteros como 1/3 (CR-28, CR-31, CR-35), salvo que el análisis agote su presupuesto (R-21.3). En ese caso responderá E-SIS-01 y NO DEBERÁ presentar ese cero como aproximado (CR-34) [Confirmado C-11].
4. **R-05.4** CUANDO un cero con cambio de signo sea irracional, EL SISTEMA DEBERÁ localizarlo con un método acotado, con un máximo de iteraciones y una tolerancia declarados (§12). Solo DEBERÁ tratar un cero como aproximado después de demostrar que es irracional (design.md §8). Lo mostrará con «≈» y marcará como aproximado todo resultado que dependa de él.
5. **R-05.5** SI f es idénticamente cero, ENTONCES EL SISTEMA DEBERÁ informarlo (W-09) y no listará ceros individuales.

### R-06 Área geométrica total · MVP

1. **R-06.1** EL SISTEMA DEBERÁ calcular A_geo = ∫[a,b] |f(x)| dx. Dividirá [a, b] en los ceros con cambio de signo y sumará el valor absoluto de la integral de cada tramo.
2. **R-06.2** EL SISTEMA NO DEBERÁ calcular A_geo como |I|, salvo que el análisis de signo haya establecido que f no cambia de signo en [a, b].
3. **R-06.3** CUANDO f(x) ≥ 0 en todo [a, b], EL SISTEMA DEBERÁ indicar que A_geo = I.
4. **R-06.4** CUANDO f cambie de signo, EL SISTEMA DEBERÁ mostrar I y A_geo por separado, junto con la contribución de cada tramo, y advertir que son distintos (W-01).
5. **R-06.5** EL SISTEMA DEBERÁ rotular A_geo como exacta si todos los puntos de separación son exactos; en caso contrario, como aproximada, con la tolerancia usada (W-04).

### R-07 Valor promedio · MVP

1. **R-07.1** EL SISTEMA DEBERÁ calcular f_prom = I/(b − a) **reutilizando la misma I** de R-04, sin volver a calcular la integral.
2. **R-07.2** EL SISTEMA NO DEBERÁ calcular el valor promedio como A_geo/(b − a).
3. **R-07.3** EL SISTEMA DEBERÁ expresar f_prom en las unidades de f(x): u en ejercicios abstractos y m (altura promedio) en perfiles físicos.
4. **R-07.4** EL SISTEMA DEBERÁ mostrar la fórmula del curso, f_prom = [1/(b − a)]·∫[a,b] f(x) dx, con el valor exacto y el aproximado.
5. Nota [Confirmado]: el MVP no calcula el punto c del teorema del valor medio.

### R-08 Rectángulo equivalente · MVP

1. **R-08.1** CUANDO f(x) ≥ 0 en todo [a, b], EL SISTEMA DEBERÁ presentar el rectángulo equivalente, de base b − a y altura f_prom, y mostrar que (b − a)·f_prom = A_geo.
2. **R-08.2** SI f cambia de signo o es negativa en algún tramo, ENTONCES EL SISTEMA NO DEBERÁ presentar el rectángulo equivalente. Explicará que esa igualdad requiere f ≥ 0.

### R-09 Procedimiento paso a paso · MVP

**Historia:** Como estudiante, quiero ver el procedimiento con los pasos del curso, para estudiar y explicar cada resultado.

1. **R-09.1** EL SISTEMA DEBERÁ generar los pasos a partir de los mismos datos y reglas del cálculo: modelo validado, antiderivada, evaluaciones y tramos. Nunca los generará a partir del resultado final ni con plantillas que no correspondan al cálculo ejecutado.
2. **R-09.2** Para el área sin cambio de signo, el procedimiento DEBERÁ incluir, en este orden:
   1. función, intervalo y unidades;
   2. análisis de signo y justificación de A = I;
   3. planteamiento de la integral;
   4. antiderivada con la regla aplicada;
   5. sustitución del límite superior;
   6. sustitución del límite inferior;
   7. resta F(b) − F(a);
   8. resultado exacto, aproximación y unidades;
   9. interpretación.

   El formulario §4.2 muestra el modelo.
3. **R-09.3** Para el valor promedio, el procedimiento DEBERÁ incluir la fórmula, la sustitución de a y b en 1/(b − a), los pasos de la integral, la división final, las unidades y la interpretación (formulario §5.2).
4. **R-09.4** CUANDO f cambie de signo, el procedimiento DEBERÁ mostrar los ceros, los tramos, la integral de cada tramo, su valor absoluto y la suma, además de la comparación con I.
5. **R-09.5** SI la entrada no está en forma polinómica estándar, ENTONCES el procedimiento DEBERÁ incluir el desarrollo a la forma normalizada, por ejemplo (x − 1)² = x² − 2x + 1.
6. **R-09.6** EL SISTEMA DEBERÁ escribir entre paréntesis toda sustitución de un valor negativo, como F(−1) = (−1) + (−1)³/3, y usar operadores explícitos entre términos.
7. **R-09.7** EL SISTEMA NO DEBERÁ incluir «+C» en resultados definidos. DONDE se muestre la antiderivada, PODRÁ indicar que la constante se cancela.
8. **R-09.8** Cada paso DEBERÁ tener una versión textual legible que no dependa de la biblioteca de fórmulas. SI falla la representación enriquecida, ENTONCES EL SISTEMA DEBERÁ mostrar la versión textual (W-08).
9. **R-09.9** EL SISTEMA NO DEBERÁ usar IA generativa para producir pasos ni resultados.

### R-10 Gráfica · MVP

1. **R-10.1** CUANDO exista un resultado válido, EL SISTEMA DEBERÁ graficar f sobre [a, b], con un margen visual, a partir del modelo validado.
2. **R-10.2** EL SISTEMA DEBERÁ sombrear la región entre la curva y el eje X. Distinguirá los tramos sobre y bajo el eje con algo más que el color: leyenda, patrón o rótulo.
3. **R-10.3** EL SISTEMA DEBERÁ dibujar la recta y = f_prom y, cuando se cumpla R-08.1, el contorno del rectángulo equivalente.
4. **R-10.4** EL SISTEMA DEBERÁ marcar los ceros relevantes y rotular los ejes con sus unidades.
5. **R-10.5** La gráfica NO DEBERÁ usarse para calcular áreas, promedios ni ceros.
6. **R-10.6** SI la gráfica no puede generarse, ENTONCES EL SISTEMA DEBERÁ mantener visibles los resultados y el procedimiento e informar con W-07.
7. **R-10.7** DONDE se incluya (DESEABLE), EL SISTEMA DEBERÁ ofrecer una tabla de valores (x, f(x)) del modelo validado. Sigue el método de los apuntes (P1-D) y sirve como alternativa textual a la gráfica.

### R-11 Identificación de resultados · MVP

1. **R-11.1** Cada resultado DEBERÁ indicar:
   - la operación;
   - la función normalizada o la figura;
   - el intervalo o las dimensiones;
   - las unidades;
   - el método;
   - el valor exacto, cuando exista;
   - la aproximación mostrada;
   - las advertencias pertinentes.
2. **R-11.2** EL SISTEMA DEBERÁ diferenciar visualmente I, A_geo y f_prom. Nunca rotulará I como «área» cuando f cambie de signo.
3. **R-11.3** EL SISTEMA DEBERÁ mostrar junto al resultado los supuestos que lo condicionan, como «perfil en metros», «datos simulados» o «ceros aproximados».

### R-12 Estado e invalidación · MVP

1. **R-12.1** CUANDO cambie un dato del que depende un resultado (función, límites, interpretación, dimensiones, unidad, precio o adicional), EL SISTEMA DEBERÁ retirar el resultado, su gráfica, su procedimiento y la estimación dependiente hasta que el usuario vuelva a calcular [Confirmado D-04].
2. **R-12.2** SI un nuevo cálculo no supera la validación, ENTONCES EL SISTEMA DEBERÁ mostrar el error y NO DEBERÁ mantener resultados ni gráficas anteriores como si correspondieran a la nueva entrada.
3. **R-12.3** EL SISTEMA DEBERÁ mantener el estado solo en memoria; al recargar la página pueden perderse los datos [Confirmado].

### R-13 Ejemplos · MVP

1. **R-13.1** EL SISTEMA DEBERÁ ofrecer ejemplos para el analizador y las figuras, rotulados por origen: «Ejercicio de clase», «Caso de comprobación» o «Caso práctico simulado».
2. **R-13.2** CUANDO el usuario elija un ejemplo, EL SISTEMA DEBERÁ completar los campos (interpretación y, si aplica, precio y adicional) y aplicar la misma validación y el mismo cálculo que a una entrada manual.
3. **R-13.3** EL SISTEMA NO DEBERÁ contener respuestas fijas para reconocer ejemplos. Los valores esperados solo se usan en las pruebas y en el formulario.
4. **R-13.4** EL SISTEMA DEBERÁ rotular como simulados los precios y datos que no provienen de mediciones reales.
5. **R-13.5** Los ejemplos DEBERÁN incluir, como mínimo, CR-01, CR-02, CR-03, CR-05, CR-06, CR-07, CR-09 y CR-10 [Propuesta].

### R-14 Figuras geométricas · COMP

1. **R-14.1** EL SISTEMA DEBERÁ calcular el área del rectángulo (b·h), del triángulo (b·h/2) y del círculo (πr²).
2. **R-14.2** DONDE se incluya el trapecio (DESEABLE), EL SISTEMA DEBERÁ calcular (B + b)·h/2.
3. **R-14.3** EL SISTEMA DEBERÁ exigir dimensiones estrictamente positivas, finitas y dentro de la Tabla 9.3, todas en la misma unidad (cm o m) por figura.
4. **R-14.4** EL SISTEMA DEBERÁ mostrar el área en la unidad elegida al cuadrado y su conversión a m², con el cuadrado del factor: 1 m² = 10 000 cm².
5. **R-14.5** Para el círculo, EL SISTEMA DEBERÁ mostrar la forma exacta k·π y una aproximación rotulada como tal.
6. **R-14.6** EL SISTEMA DEBERÁ presentar estas fórmulas como fórmulas geométricas directas, sin sugerir que requieren integración.

### R-15 Unidades · MVP

1. **R-15.1** EL SISTEMA DEBERÁ aplicar la política de §11 y mostrar la unidad junto a cada valor.
2. **R-15.2** MIENTRAS la interpretación sea «Ejercicio abstracto», EL SISTEMA DEBERÁ usar u y u², y NO DEBERÁ ofrecer una estimación de costo (E-MOD-01).
3. **R-15.3** MIENTRAS la interpretación sea «Perfil físico», EL SISTEMA DEBERÁ interpretar x y f(x) en metros, y expresar I y A_geo en m² y f_prom en m.
4. **R-15.4** EL SISTEMA NO DEBERÁ cambiar la unidad de un perfil sin transformar el modelo. En el MVP no ofrecerá otras unidades para perfiles [Propuesta, aceptada como posible por PC §10.1].
5. **R-15.5** EL SISTEMA DEBERÁ convertir a m² cualquier área antes de aplicarle un precio por m².

### R-16 Validez del modelo físico · MVP

1. **R-16.1** EL SISTEMA DEBERÁ considerar apto para estimar material solo un resultado vigente que cumpla una de estas condiciones:
   - provenga de una figura válida; o
   - provenga de un perfil en metros con f(x) ≥ 0 en todo [a, b], verificado según R-05.2, y A_geo > 0.
2. **R-16.2** SI un perfil físico cambia de signo o es negativo en algún tramo, ENTONCES EL SISTEMA DEBERÁ conservar el análisis académico, no emitir la estimación (E-MOD-02) y explicar que el modelo no describe una altura no negativa. PODRÁ sugerir redefinir el perfil, por ejemplo como g(x) = −f(x), pero sin aplicarlo automáticamente.
3. **R-16.3** SI A_geo = 0, ENTONCES EL SISTEMA NO DEBERÁ emitir la estimación (E-MOD-03) [Confirmado D-05].
4. **R-16.4** EL SISTEMA NO DEBERÁ usar nunca la integral con signo para estimar material.
5. **R-16.5** Las coordenadas x negativas no invalidan un perfil físico. Por ejemplo, 1 + x² en [−1, 2] m es válido.

### R-17 Estimación de material y costo · MVP

**Historia:** Como persona que prepara un cálculo preliminar, quiero obtener el área con un adicional y su costo teórico, para tener una referencia con supuestos explícitos.

1. **R-17.1** CUANDO exista un resultado apto (R-16.1), EL SISTEMA DEBERÁ permitir ingresar el precio (Q/m²) y el adicional w (%), e identificar el resultado del que proviene el área.
2. **R-17.2** EL SISTEMA DEBERÁ calcular:
   - A_útil, en m²;
   - A_estimada = A_útil·(1 + w/100);
   - Costo_base = A_útil·precio;
   - Costo_estimado = A_estimada·precio.
3. **R-17.3** EL SISTEMA DEBERÁ calcular con los valores exactos y redondear solo al presentar. CR-03 DEBERÁ dar Q666.67 y Q733.33, no Q666.50.
4. **R-17.4** EL SISTEMA DEBERÁ aceptar precio ≥ 0 y 0 ≤ w ≤ 100, dentro de la Tabla 9.3. El precio cero y el adicional cero son válidos.
5. **R-17.5** EL SISTEMA DEBERÁ mostrar junto a la estimación:
   - que w es un adicional sobre el área útil;
   - que el material realmente comprado depende de los formatos comerciales, los márgenes y los cortes, y no se calcula;
   - que no incluye mano de obra, impuestos, márgenes comerciales, láminas ni litros de pintura;
   - que los precios de ejemplo son simulados.
6. **R-17.6** MIENTRAS no exista un resultado apto, EL SISTEMA DEBERÁ mantener inhabilitada la estimación y explicar el motivo (E-MOD-01 a E-MOD-04).
7. **R-17.7** EL SISTEMA DEBERÁ expresar los importes en quetzales (Q) [Supuesto].

### R-18 Precisión y redondeo · MVP

1. **R-18.1** EL SISTEMA DEBERÁ usar aritmética racional exacta en:
   - los coeficientes y los límites;
   - las antiderivadas, I y f_prom;
   - A_geo, cuando sus puntos de separación sean exactos;
   - las áreas del rectángulo, el triángulo y el trapecio;
   - los costos.
2. **R-18.2** EL SISTEMA DEBERÁ rotular un valor como exacto solo cuando se haya obtenido sin aproximaciones.
3. **R-18.3** EL SISTEMA DEBERÁ redondear una sola vez, al presentar, según §12.
4. **R-18.4** EL SISTEMA NO DEBERÁ mostrar «−0» ni «−0.0000».
5. **R-18.5** La aritmética exacta NO DEBERÁ perder precisión por desbordamiento dentro de los rangos de la Tabla 9.3.

### R-19 Errores y advertencias · MVP

1. **R-19.1** EL SISTEMA DEBERÁ informar cada error con un código estable de §10, el campo afectado, la causa y una acción sugerida o un ejemplo válido.
2. **R-19.2** EL SISTEMA DEBERÁ distinguir:
   - campo vacío;
   - cero válido;
   - valor inválido;
   - valor no finito o fuera de rango;
   - función no admitida;
   - modelo físico incompatible.
3. **R-19.3** EL SISTEMA DEBERÁ asociar cada mensaje a su campo de forma perceptible, tanto visualmente como para las tecnologías de asistencia.
4. **R-19.4** SI ocurre un error interno inesperado, ENTONCES EL SISTEMA DEBERÁ mostrar E-SIS-02, descartar los resultados parciales y seguir operativo.
5. **R-19.5** EL SISTEMA NO DEBERÁ mostrar trazas técnicas al usuario.

### R-20 Seguridad en la interpretación de expresiones · MVP

1. **R-20.1** EL SISTEMA NO DEBERÁ usar `eval`, `new Function` ni ningún mecanismo que ejecute como código el texto del usuario.
2. **R-20.2** SI se usa una biblioteca de análisis sintáctico, ENTONCES EL SISTEMA DEBERÁ:
   - limitarla a construir el árbol de la expresión;
   - verificar cada nodo contra la lista blanca de la Tabla 9.1;
   - rechazar asignaciones, definiciones y llamadas de funciones, acceso a propiedades, matrices, cadenas y unidades;
   - no evaluar el texto con el evaluador general de la biblioteca.

   La sintaxis se contrastará con la documentación real en la Etapa B.
3. **R-20.3** SI se usa una dependencia para interpretar expresiones, ENTONCES su versión DEBERÁ estar libre de vulnerabilidades publicadas que afecten al uso previsto (véase D-03).
4. **R-20.4** EL SISTEMA DEBERÁ aplicar los límites de la Tabla 9.2 antes de cualquier procesamiento costoso.
5. **R-20.5** EL SISTEMA DEBERÁ mostrar el texto del usuario solo como texto, nunca como HTML, y generar las fórmulas representadas a partir del modelo validado.

### R-21 Respuesta y límites de cálculo · MVP

1. **R-21.1** Para toda entrada admitida, EL SISTEMA DEBERÁ completar la validación y el cálculo con un número acotado de operaciones. Las iteraciones de búsqueda de ceros y los puntos de la gráfica tendrán máximos documentados en la Etapa B.
2. **R-21.2** EL SISTEMA DEBERÁ mostrar los resultados de un cálculo admitido, incluida la gráfica, en menos de 1 segundo en una computadora portátil de uso común [Propuesta; verificación manual].
3. **R-21.3** SI una operación supera su presupuesto de iteraciones, ENTONCES EL SISTEMA DEBERÁ detenerla, informar E-SIS-01 y no presentar un resultado parcial como válido. En el análisis de ceros, el presupuesto es una profundidad máxima de 200 bisecciones (§12), y E-SIS-01 solo se devuelve si se agota antes de determinar si cada cero es racional o irracional (CR-33, CR-34) [Confirmado C-11].
4. Nota [Propuesta]: las operaciones del MVP no justifican un Web Worker, es decir, un hilo separado para no bloquear la interfaz. Se reconsiderará solo si una ampliación lo necesita.

### R-22 Funcionamiento local y sin servicios externos · MVP

1. **R-22.1** EL SISTEMA DEBERÁ ser una aplicación web estática, sin backend, base de datos, cuentas, pagos ni servicios de IA.
2. **R-22.2** Tras instalar las dependencias y construir la aplicación, la versión construida DEBERÁ funcionar **sin internet**. Las bibliotecas, los estilos, las fuentes y los recursos irán empaquetados localmente, sin CDN.
3. **R-22.3** El proyecto DEBERÁ documentar cómo instalar, construir y servir localmente la versión construida, y los requisitos del equipo de exposición (§13).
4. **R-22.4** La documentación NO DEBERÁ prometer que la aplicación funciona abriendo `index.html` con doble clic, salvo que se verifique explícitamente.
5. **R-22.5** Node y el servidor de desarrollo son herramientas de construcción. El cálculo NO DEBERÁ depender de ellos en tiempo de uso.

### R-23 Interfaz, navegación y accesibilidad · MVP

1. **R-23.1** EL SISTEMA DEBERÁ seguir el recorrido de §6 y ofrecer tres secciones [Propuesta]:
   - Analizador de perfiles;
   - Figuras geométricas;
   - Estimación de materiales, vinculada a un resultado apto.
2. **R-23.2** Todas las funciones DEBERÁN poder usarse solo con teclado, con un orden de tabulación lógico y foco visible.
3. **R-23.3** Cada campo DEBERÁ tener una etiqueta y una unidad visibles.
4. **R-23.4** El texto DEBERÁ tener un contraste mínimo de 4.5:1 (nivel AA de WCAG 2.1), y la información no se transmitirá solo con color [Propuesta].
5. **R-23.5** La interfaz DEBERÁ poder usarse en computadora y en teléfono, desde 360 px de ancho, sin desplazamiento horizontal de los formularios [Propuesta].
6. **R-23.6** La interfaz DEBERÁ estar en español y NO DEBERÁ pedir al usuario decisiones sobre tecnologías internas.

### R-24 Arquitectura modular y explicabilidad · MVP

1. **R-24.1** Todos los cálculos DEBERÁN residir en un núcleo matemático independiente de la interfaz, del DOM y de las bibliotecas de gráficas y fórmulas.
2. **R-24.2** Cada cálculo DEBERÁ existir en un solo lugar identificable. La interfaz, la gráfica y el procedimiento no recalcularán por su cuenta.
3. **R-24.3** La documentación de las Etapas B y C DEBERÁ indicar en qué módulo se realiza cada cálculo, para que el equipo pueda localizarlo y explicarlo.
4. **R-24.4** El diseño DEBERÁ evitar abstracciones pensadas para reemplazos hipotéticos y estructuras creadas para cada fórmula.

### R-25 Verificación · MVP

1. **R-25.1** El núcleo matemático y los casos de uso DEBERÁN tener pruebas automatizadas con valores esperados independientes, tomados de los apuntes, del formulario o de un cálculo manual, y no generados por el mismo código.
2. **R-25.2** Las pruebas DEBERÁN cubrir los casos MVP de §14, incluidos equivalencias, rechazos, límites inválidos, área cero, tangencia, cambio de signo, valores no finitos, complejidad excesiva e invalidación.
3. **R-25.3** Las pruebas DEBERÁN comprobar estas relaciones:
   - A_geo ≥ 0;
   - A_geo ≥ |I|, con tolerancia solo si hay aproximación;
   - I = (b − a)·f_prom, exactamente;
   - si f ≥ 0, entonces A_geo = I;
   - el rectángulo equivalente conserva el área;
   - los costos se calculan desde valores exactos en m².
4. **R-25.4** La interfaz DEBERÁ verificarse con una revisión manual documentada del recorrido completo, que incluya teclado, ancho de teléfono, falla simulada de la gráfica y funcionamiento sin internet.
5. **R-25.5** Los casos de centroides no son condición para cerrar el MVP.

### R-26 Documentación de entrega · MVP

1. **R-26.1** El formulario matemático DEBERÁ ser la fuente compartida de definiciones y casos. Los ejemplos y las pruebas DEBERÁN coincidir con él.
2. **R-26.2** La documentación DEBERÁ permitir explicar el problema, la justificación, el modelo matemático, el desarrollo, los resultados y las conclusiones [Confirmado como contenido; formato y extensión no verificados].
3. **R-26.3** La documentación DEBERÁ listar las limitaciones conocidas: familia admitida, unidades y carácter teórico de la estimación.

### R-27 Centroides · POSTERIOR

1. **R-27.1** DONDE se incluya, EL SISTEMA DEBERÁ calcular el centroide de la región entre y = 0 e y = f(x), para una sola función admitida con f ≥ 0 en [a, b] y A > 0, con x̄ = (1/A)∫x·f dx e ȳ = (1/(2A))∫f² dx (formulario §10).
2. **R-27.2** SI A = 0, ENTONCES EL SISTEMA DEBERÁ indicar que el centroide no está definido.
3. **R-27.3** EL SISTEMA DEBERÁ expresar x̄ e ȳ en las unidades de x e y. Lo presentará como una propiedad geométrica y NO DEBERÁ derivar de él recomendaciones estructurales.
4. **R-27.4** La región entre dos curvas del ejemplo de clase (formulario §11) es una referencia académica. Su implementación no bloquea el MVP.

### R-28 Comparación numérica acotada · POSTERIOR

1. **R-28.1** DONDE se incluya, EL SISTEMA DEBERÁ comparar, solo para funciones admitidas, el valor exacto con aproximaciones rotuladas como tales:
   - rectángulos de una sola altura;
   - trapecios compuestos con n ∈ {1, 2, 4, 8, 16}.

   Mostrará el error respecto del valor exacto.
2. **R-28.2** La comparación NO DEBERÁ ampliar la familia admitida ni presentarse como integrador universal, y su error no se presentará como garantía universal.
3. **R-28.3** DONDE se muestre Simpson, EL SISTEMA DEBERÁ explicar que es exacta para grado ≤ 3.

## 9. Soporte de funciones [Propuesta]

La familia es la de los polinomios en x de grado ≤ 3 con coeficientes racionales sencillos. Cubre todos los ejercicios de clase del MVP, el caso práctico y las funciones constantes, lineales, cuadráticas y cúbicas. **Es una limitación de viabilidad**, no una exigencia académica confirmada.

**Tabla 9.1. Construcciones admitidas (lista blanca)**

| Elemento | Regla | Válidos | Rechazos (§10) |
|---|---|---|---|
| Variable | solo `x` minúscula | `x` | `X`, `y`, `t`, `pi`, `e` → E-EXP-03 |
| Número | entero o decimal con punto y dígitos a ambos lados | `3`, `0.25` | `.5`, `5.`, `0,5`, `1e3` → E-EXP-04 |
| Suma y resta | `+`, `-`; el signo menos tipográfico `−` se acepta como `-` | `x^3 - 1` | — |
| Signo unario | delante de un término | `-x^2`, `-(x-1)` | — |
| Producto explícito | `*` | `3*x`, `x*x` | `2**x` → E-EXP-02 |
| Producto implícito | número o `)` seguido de `x` o `(`, y `x` seguido de `(` | `3x`, `3x^2`, `2(x-1)`, `(x-1)(x+1)`, `(x+1)x`, `x(x+1)` | `x2`, `xx` → E-EXP-03; `x x`, `2 3` → E-EXP-02 |
| División | solo si el divisor normalizado es una constante ≠ 0 | `x^2/4`, `(1/3)x^3` | `1/x`, `x/x` → E-EXP-08; `x/0` → E-EXP-09 |
| Potencia | `^` con exponente entero literal 1, 2 o 3; se admite entre paréntesis | `x^2`, `(x-1)^2`, `(2x)^3`, `x^(2)` | `x^0`, `x^-1`, `x^(1/2)`, `2^x`, `x^2^3` → E-EXP-07; `x^4` → E-EXP-10 |
| Paréntesis | `(` y `)` | `(x-1)^3` | `(x-1` → E-EXP-02 |
| Espacios | se ignoran | `x ^ 2 - 1` | — |

**Precedencia, de mayor a menor:**

1. paréntesis;
2. potencia;
3. signo unario;
4. producto, implícito o explícito, y división, de izquierda a derecha;
5. suma y resta.

Por tanto, `-x^2` = −(x²), `3x^2` = 3·(x²) y `1/2x` = (1/2)·x. La forma interpretada se muestra siempre (R-01.7).

`x(x+1)` se admite como producto porque el analizador propio elegido para D-03 (design.md §5) lo distingue sin ambigüedad: la gramática no tiene funciones. Es la condición que fijaba el valor por defecto aprobado de D-02 [Aprobado con el diseño, C-10].

**Tabla 9.2. Límites de complejidad**

| Límite | Valor | Error |
|---|---|---|
| Longitud del texto | ≤ 200 caracteres | E-EXP-11 |
| Elementos léxicos (números, `x`, operadores, paréntesis) | ≤ 100 | E-EXP-11 |
| Profundidad de paréntesis | ≤ 10 | E-EXP-11 |
| Grado de toda subexpresión normalizada | ≤ 3 | E-EXP-10 |
| Literales numéricos | \|v\| ≤ 1 000 000; ≤ 6 decimales | E-EXP-05 |

**Tabla 9.3. Rangos de valores**

| Dato | Rango | Decimales | ¿Cero? |
|---|---|---|---|
| Límites a, b | −1000 ≤ a < b ≤ 1000 | ≤ 6 | válido |
| Dimensiones | 0 < d ≤ 1000 m o ≤ 100 000 cm | ≤ 6 | inválido |
| Precio | 0 ≤ p ≤ 1 000 000 Q/m² | ≤ 2 | válido |
| Adicional w | 0 ≤ w ≤ 100 % | ≤ 2 | válido |

**Métodos de cálculo (nivel de requisito):**

- Integral: reglas deterministas (§8, R-04) y teorema fundamental del cálculo, con resultado exacto.
- Ceros: todo cero racional es exacto. Los irracionales se localizan por bisección con una profundidad máxima de 200 a partir de [a, b] (§12) [Confirmado C-11].
- Coeficientes normalizados: **no tienen tope** adicional. Se admite toda entrada que cumpla las Tablas 9.1 y 9.2, como `(0.000001x)^3`, cuyo coeficiente es 1/10¹⁸ (CR-32) [Confirmado C-11].
- En el núcleo del MVP no hay integración numérica.

Las capacidades de las bibliotecas no se dan por supuestas. Los contratos detallados (campos, estructuras y estados) se definirán en `design.md`.

## 10. Catálogo de errores y advertencias [Propuesta]

Los códigos son estables. Los mensajes son orientativos.

**Expresión**

| Código | Situación | Ejemplos | Mensaje orientativo |
|---|---|---|---|
| E-EXP-01 | Vacía | `` (vacío), `   ` | «Escriba una función de x, por ejemplo x^3 - 1.» |
| E-EXP-02 | Sintaxis incompleta o inválida | `x^`, `(x-1`, `x+*2` | «La expresión está incompleta cerca de la posición n.» |
| E-EXP-03 | Símbolo o variable no admitidos | `y+1`, `X^2`, `pi*x` | «El símbolo "y" no está admitido; use solo x minúscula.» |
| E-EXP-04 | Formato numérico no admitido | `0,5x`, `.5x`, `1e3`, `1,000` | «Use punto decimal, sin separadores de miles ni notación científica.» |
| E-EXP-05 | Número fuera de rango o con más de 6 decimales | `10000000x` | — |
| E-EXP-06 | Función, operador o construcción no admitidos | `sqrt(x)`, `sin(x)`, `abs(x)`, `x!`, `[1,2]`, `x.y`, `x==1`, `5 cm` | «Las funciones como sqrt no están en el soporte del MVP (polinomios en x de grado ≤ 3). Pruebe, por ejemplo, con x^2.» |
| E-EXP-07 | Exponente no admitido | `x^0`, `x^-1`, `x^(1/2)`, `2^x` | «El exponente debe ser un entero 1, 2 o 3 escrito directamente.» |
| E-EXP-08 | División entre una expresión con x | `1/x`, `x/x`, `(x^2-1)/(x-1)` | «Solo se puede dividir entre constantes; 1/x no es un polinomio y no está definida en x = 0.» |
| E-EXP-09 | División entre cero | `x/0`, `x/(2-2)` | — |
| E-EXP-10 | Grado mayor que 3 | `x^4`, `(x^2)^2`, `x*x*x*x` | «El MVP admite grado ≤ 3; esta expresión tiene grado 4.» |
| E-EXP-11 | Complejidad excesiva | Tabla 9.2 | — |
| E-EXP-12 | Asignación o definición | `y = x^2`, `f(x) = x^2` | «Escriba solo la expresión, sin "y =" ni "f(x) =".» (D-02) |

**Valores numéricos** (a, b, dimensiones, precio y w; el mensaje nombra el campo)

| Código | Situación |
|---|---|
| E-NUM-01 | Campo vacío |
| E-NUM-02 | Formato no numérico o no admitido: texto, coma decimal, separadores de miles, notación científica |
| E-NUM-03 | Valor no finito (`Infinity`, `NaN`) |
| E-NUM-04 | Fuera de rango o con demasiados decimales (Tabla 9.3) |
| E-NUM-05 | Negativo donde no se admite (precio, w) |
| E-NUM-06 | Cero o negativo donde se exige un valor positivo (dimensiones) |

**Intervalo, modelo físico y sistema**

| Código | Situación |
|---|---|
| E-INT-01 | a = b: «El intervalo tiene longitud cero; b debe ser mayor que a.» |
| E-INT-02 | a > b: «El límite inferior es mayor que el superior. ÁreaCalc no los intercambia automáticamente.» |
| E-MOD-01 | Estimación pedida con interpretación abstracta: no hay escala física |
| E-MOD-02 | El perfil cambia de signo o es negativo: no describe una altura no negativa |
| E-MOD-03 | Área nula: no hay superficie que presupuestar |
| E-MOD-04 | No hay un resultado apto vigente para estimar |
| E-SIS-01 | Se superó el presupuesto de cálculo |
| E-SIS-02 | Error interno inesperado: se descartan los resultados parciales |
| E-CEN-01 | POSTERIOR (R-27): región no admitida para el centroide, porque f cambia de signo o es negativa |
| E-CEN-02 | POSTERIOR (R-27): A = 0, el centroide no está definido |

**Advertencias** (no bloquean el resultado)

| Código | Situación |
|---|---|
| W-01 | f cambia de signo: I ≠ A_geo |
| W-02 | Tangencia: f toca el eje en x = r sin cambiar de signo |
| W-03 | Cero en un extremo del intervalo |
| W-04 | Ceros irracionales aproximados: A_geo es aproximada (se indica la cota de error obtenida) |
| W-05 | Datos simulados |
| W-06 | Supuestos de la estimación (R-17.5) |
| W-07 | Gráfica no disponible: los resultados y los pasos se conservan |
| W-08 | Representación enriquecida no disponible: se muestran fórmulas en texto |
| W-09 | f es idénticamente cero |

## 11. Política de unidades

| Contexto | x | f(x) | I, A_geo | f_prom | ¿Estimación? |
|---|---|---|---|---|---|
| Ejercicio abstracto | u | u | u² | u | No (E-MOD-01) |
| Perfil físico (MVP) [Propuesta] | m | m | m² | m | Sí, si cumple R-16 |
| Figuras geométricas | cm o m, una unidad por figura | — | cm² o m², con conversión a m² | — | Sí |

- **Longitudes:** 1 m = 100 cm. **Áreas:** 1 m² = 10 000 cm².
- **Precio:** siempre en Q/m², aplicado a áreas en m². No se aplica a u².
- **Cambio de unidad de un perfil:** exige transformar el modelo (formulario §7.4). Queda fuera del MVP.
- Los coeficientes de un perfil físico pertenecen al modelo dimensional elegido. Por ejemplo, en 2 + x²/4, el coeficiente 1/4 está en 1/m.

## 12. Precisión y presentación numérica [Propuesta]

- **Valores exactos:** fracción irreducible, con denominador positivo y el signo en el numerador. Los enteros se muestran sin denominador.
- **Aproximaciones:**
  - 4 decimales para integrales, áreas, promedios y ceros aproximados;
  - 2 decimales para importes en quetzales.
- **Símbolo:**
  - «=» si el decimal es exacto, como 243/4 = 60.75, sin ceros finales;
  - «≈» si se redondeó, como 40/3 ≈ 13.3333.
- **Redondeo:** mitad alejándose de cero, aplicado **una sola vez** sobre el valor exacto. Nunca se redondean resultados intermedios.
- **Cero:** nunca se muestra «−0». Un valor que redondea a cero se muestra sin signo y con «≈» si no es exactamente cero.
- **Ceros irracionales** [Confirmado C-11]:
  - La bisección se detiene cuando el ancho es ≤ 1×10⁻¹² en x **y** la cota de error del área (M₁·δ², formulario §2.1) es ≤ 1×10⁻¹².
  - La profundidad máxima es de 200 bisecciones a partir de [a, b], compartida por todo el análisis de ceros. Con ella el ancho siempre queda por debajo de 1×10⁻¹² en x.
  - Si la profundidad se agota antes de demostrar que un cero es irracional, la respuesta es E-SIS-01, sin resultado parcial (CR-33, CR-34).
  - Si se agota después, solo en la aproximación, el resultado se muestra con la cota obtenida en W-04 (CR-36).
  - A_geo se rotula «aproximada», y la cota **no** se presenta como garantía universal.
- **Círculo:** el resultado exacto es k·π; el decimal se calcula con el valor de π en doble precisión y se rotula «≈».

## 13. Funcionamiento local

- **[Confirmado]** Aplicación estática sin servidores de negocio ni base de datos. Funciona sin internet después de instalar las dependencias (que sí requiere internet una vez) y construir.
- **[Confirmado]** No se cargan bibliotecas, fuentes ni recursos esenciales desde una CDN durante el uso.
- **[Confirmado C-04]** La exposición se hará en una laptop Windows con un navegador moderno y Node.js instalado. **No habrá internet en el salón.**
- **[Confirmado C-04]** La versión construida se sirve localmente con Node.js mediante el comando de vista previa de Vite. Según su documentación, ese comando sirve el build en local y no es un servidor de producción, lo cual basta para la demostración. Los comandos están en design.md §13.
- Las dependencias se instalan y el proyecto se construye **antes** del día de la exposición, con internet. Después, todo funciona sin conexión.
- No se promete que funcione abriendo `index.html` con doble clic.
- **[Propuesta aprobada]** Verificación previa en la misma laptop:
  - construir el proyecto;
  - desactivar la red;
  - recorrer los casos CR-01, CR-02, CR-03 y CR-05;
  - comprobar la resolución del proyector.
- **[Propuesta aprobada]** Plan de contingencia: capturas de los casos principales incluidas en el documento académico.

## 14. Casos matemáticos de referencia

Los valores esperados están comprobados de forma independiente (formulario §13). Ningún caso debe resolverse con respuestas fijas (R-13.3).

| Id. | Entrada | Esperado | Verifica | Prioridad |
|---|---|---|---|---|
| CR-01 | `x^3 - 1`, [1, 4], abstracto | I = A_geo = 243/4 = 60.75 u²; f_prom = 81/4 = 20.25 u; W-03 en x = 1 | ejercicio de clase (P1-D), cero en el extremo | MVP |
| CR-02 | `1 + x^2`, [−1, 2] | I = A_geo = 6; f_prom = 2; en metros, perfil válido | ejercicio de clase (P1-A), x negativas | MVP |
| CR-03 | `2 + x^2/4`, [0, 4] m; Q50/m²; w = 10 % | A = 40/3 ≈ 13.3333 m²; f_prom = 10/3 ≈ 3.3333 m; rectángulo 4 × 10/3; A_est = 44/3 ≈ 14.6667 m²; Q666.67; Q733.33 | caso práctico, sin redondeo prematuro | MVP |
| CR-04 | `x^2`, [0, 3] | 9; f_prom = 3 | caso básico | MVP |
| CR-05 | `x`, [−1, 1] | I = 0; A_geo = 1; f_prom = 0; W-01; en metros, E-MOD-02 | integral frente a área | MVP |
| CR-06 | `-2`, [0, 3] | I = −6; A_geo = 6; f_prom = −2; sin rectángulo; E-MOD-02 | función negativa | MVP |
| CR-07 | `(x-1)^2` y `x^2 - 2x + 1`, [0, 2] | 2/3; f_prom = 1/3; W-02 en x = 1; resultados idénticos | tangencia, equivalencia | MVP |
| CR-08 | `0`, [0, 4] | 0; 0; 0; W-09; E-MOD-03 | área cero | MVP |
| CR-09 | rectángulo 4 m × 2 m | 8 m² | figura | COMP |
| CR-10 | rectángulo 100 cm × 200 cm | 20 000 cm² = 2 m² | conversión de áreas | COMP |
| CR-11 | [2, 2] y [3, 1] | E-INT-01 y E-INT-02, sin reordenar | límites inválidos | MVP |
| CR-12 | `1/x`, [−1, 1] | E-EXP-08; nunca un área finita | singularidad | MVP |
| CR-13 | `` (vacío); `y + 1`; límite `Infinity` | E-EXP-01; E-EXP-03; E-NUM-03; sin resultados anteriores visibles | errores específicos | MVP |
| CR-14 | `x^3 - x`, [−2, 2] | I = 0; A_geo = 5; f_prom = 0; ceros −1, 0, 1 | varios cambios de signo | MVP |
| CR-15 | `x^2 - 2`, [0, 2] | I = −4/3; A_geo ≈ 2.4379 (W-04); cero ≈ 1.4142; f_prom = −2/3 | cero irracional | MVP |
| CR-16 | `x^2/4 + 2`, `0.25x^2 + 2`, `(1/4)x^2 + 2`, `2 + x*x/4` | mismo modelo y resultados que CR-03 | equivalencias, decimales | MVP |
| CR-17 | `0.1 + 0.2`, [0, 1] | I = 3/10 = 0.3, exacto | exactitud decimal | MVP |
| CR-18 | `x^2` [1, 3]; `3x^2` [1, 4]; `5x - x^2` [0, 5]; `5x^3 - 2` [2, 5] | 26/3 y 13/3; 63 y 21; 125/6 y 25/6; 3021/4 y 1007/4 | ejercicios de P1-C | MVP |
| CR-19 | triángulo 4 × 3 m; círculo r = 5 m; trapecio 6, 4 y 2 m; dimensión 0 | 6 m²; 25π ≈ 78.5398 m²; 10 m² (DESEABLE); E-NUM-06 | figuras | COMP |
| CR-20 | CR-03 con precio 0 y w = 0 | A_est = 40/3 m²; Q0.00 | ceros válidos | MVP |
| CR-21 | `sqrt(x)`, `x^4`, `x^(1/2)`, `x/x`, `f(x)=x^2`, `0,5x`, `X^2`, texto de 201 caracteres | E-EXP-06, -10, -07, -08, -12, -04, -03 y -11 | lista blanca | MVP |
| CR-22 | calcular CR-03 y luego cambiar b a 5 | resultados, gráfica, pasos y estimación retirados o desactualizados | invalidación | MVP |
| CR-23 | `2` en [0, 4] m; `(3/4)x` en [0, 4] m | 8 m² (= CR-09); 6 m² (= triángulo de CR-19) | coherencia entre módulos | MVP |
| CR-24 | centroides (formulario §10.2) | (2, 1); (9/4, 27/10); (12/5, 47/25); no definido si A = 0 | fase posterior | POSTERIOR |
| CR-25 | región entre −x²/8 y −√x en [0, 4] | A = 8/3; x̄ = 9/5; ȳ = −9/10 | referencia académica, fuera de la familia | POSTERIOR |
| CR-26 | comparación numérica de CR-03 | T₁ = 16; T₂ = 14; T₄ = 13.5; S₂ = 40/3 | ampliación | POSTERIOR |
| CR-27 | `x(x+1)` y `x*(x+1)`, [0, 1] | mismo modelo x² + x; I = A_geo = 5/6; f_prom = 5/6 | producto implícito tras x (D-02/D-03) | MVP |
| CR-28 | `(x - 1/3)(x - 2)(x + 1)`, [0, 3] | ceros exactos 1/3 y 2 con cambio de signo; I = 11/4; A_geo = 5923/972 ≈ 6.0936; f_prom = 11/12 | ceros racionales no enteros (design.md §8) | MVP |
| CR-29 | `(x-1)^3`, [0, 2] | cero triple en x = 1, que **sí** cambia de signo; I = 0; A_geo = 1/2; f_prom = 0 | multiplicidad impar | MVP |
| CR-30 | `(x-1)^2(x+2)`, [−3, 2] | cambio de signo en −2 y tangencia en 1; I = 5/4; A_geo = 59/4 = 14.75; f_prom = 1/4 | tangencia y cambio de signo en una misma función | MVP |
| CR-31 | `x - 1/3`, [0, 1] | cero **exacto** 1/3 con cambio de signo; I = 1/6; A_geo = 5/18 ≈ 0.2778, rotulada exacta; f_prom = 1/6 | cero racional con denominador que no es potencia de 2 (R-05.3) | MVP |
| CR-32 | `(0.000001x)^3`, [−1, 1] | se admite; cero triple **exacto** en 0 con cambio de signo; I = 0; A_geo = 1/(2·10¹⁸), exacta (se muestra «≈ 0.0000» junto a la fracción); f_prom = 0 | sin tope de coeficientes (D-09) | MVP |
| CR-33 | `x^3 + 0.000001*0.000001*0.000001*0.000001*0.000001*0.000001*0.000001*0.000001*0.000001*0.000001*x - 2`, [0, 2] (101 caracteres) | E-SIS-01: la prueba de racionalidad necesitaría 201 bisecciones; sin resultados, pasos ni gráfica | presupuesto agotado (R-21.3) | MVP |
| CR-34 | `(x - (1/999983)^3*(1/999983)^3*(1/999983)^3*(1/999983)^3*(1/999983)^3*(1/999983)^3*(1/999983)^3)(x^2 + 1)`, [0, 1] (105 caracteres) | E-SIS-01. Tiene una raíz racional (1/999983²¹) que no puede verificarse en 200 bisecciones: **nunca** se muestra como aproximada | sin clasificación incorrecta (R-05.3) | MVP |
| CR-35 | `1000000^3*1000000^3*1000000^3*1000000*(x - 1/3)(x^2 + 1)`, [0, 1] | cero **exacto** 1/3; I = 10⁶⁰·11/36; A_geo = 10⁶⁰·407/972, exacta; f_prom = 10⁶⁰·11/36 | el factor común no impide reconocer la raíz (design §8, paso 2) | MVP |
| CR-36 | `1000000^3*1000000^3*1000000^3*1000000^3*1000000^3*1000000^3*1000000^3*(x^3 - 2)`, [0, 2] | cero irracional ∛2, aproximado; I = 0; A_geo ≈ 3·∛2·10¹²⁶, con W-04 y la cota obtenida (mayor que 10⁻¹²; error real menor que la cota) | presupuesto agotado solo en la aproximación (§12) | MVP |

## 15. Condiciones para aprobar el MVP

1. R-01 a R-26 se cumplen, o su aplazamiento consta con aprobación del equipo.
2. Todos los casos MVP de §14 pasan las pruebas automatizadas con los valores exactos esperados, y se cumplen las relaciones de R-25.3.
3. CR-03 muestra exactamente Q666.67 y Q733.33.
4. La revisión manual documentada (R-25.4) cubre las tres secciones, el teclado, el ancho de teléfono, la falla de la gráfica, la invalidación y el funcionamiento sin internet.
5. No hay `eval` ni `new Function`, y no se usa una CDN en tiempo de uso. Se verifica revisando el código y el build, y con una prueba sin red.
6. Los expositores pueden localizar cada cálculo en el código y explicar los procedimientos de CR-01, CR-02, CR-03 y CR-05.
7. El formulario, los ejemplos y las pruebas coinciden, y existen instrucciones de ejecución local.
8. Los centroides (R-27) y la comparación numérica (R-28) **no** son condiciones de aprobación.

## 16. Confirmaciones del equipo y supuestos

**Confirmaciones del 19 de octubre de 2026**

| Id. | Confirmación |
|---|---|
| C-01 | La Etapa A queda aprobada como base del diseño. |
| C-02 | El equipo tiene **3 integrantes**: dos programan con asistencia de IA y uno revisa las pruebas y la documentación. |
| C-03 | Cada integrante dispone de unas **3 horas diarias hasta el 29 de octubre**. Del 20 al 29 de octubre son 10 días: unas 60 h de programación y unas 30 h de revisión y documentación (viabilidad en design.md §16). |
| C-04 | La exposición será en una laptop Windows con un navegador moderno y Node.js instalado, que servirá el build localmente. **No habrá internet en el salón.** |
| C-05 | D-01: opción A, con Vite, HTML5, CSS3, JavaScript modular, Plotly.js, KaTeX y Vitest. |
| C-06 | Se aceptan D-02 y D-04 a D-08 con sus valores por defecto. D-03 se resuelve en design.md §5. |
| C-07 | En la tabla de x³ − 1 (P1-D), el valor correcto para x = 3 es **26**; el «27» fue un error del apunte. |
| C-08 | El ejercicio de P1-C es **5x³ − 2 en [2, 5]**. |
| C-09 | Los costos se calculan sin redondeos intermedios: **Q666.67** de costo base y **Q733.33** con el adicional del ejemplo. |
| C-10 | El diseño queda aprobado, incluido el analizador propio (D-03). La Etapa B se cierra con la resolución de D-09. |
| C-11 | D-09 se resuelve sin un tope nuevo de coeficientes y se conservan todas las entradas de §9, incluida `(0.000001x)^3`. El análisis intenta resolver cada entrada dentro de 200 bisecciones y solo responde E-SIS-01 si agota realmente ese presupuesto: sin resultado parcial y sin presentar como aproximada una raíz racional. |
| C-12 | T-01 se verifica en el entorno de Kiro Web. La prueba física en la laptop Windows corresponde al ensayo del equipo (`tasks.md`, T-R5) y no bloquea T-02. |

**Supuestos que se mantienen**

| Id. | Supuesto |
|---|---|
| S-02 | El documento del 30 de octubre usará resultados de la aplicación, así que el núcleo debe funcionar varios días antes. |
| S-04 | Las dependencias se instalan, con internet, en la laptop de exposición antes del 29 de octubre. |
| S-05 | La interfaz estará en español, con punto decimal y moneda en quetzales (Q). |
| S-06 | No hay una rúbrica verificada. Estos requisitos no representan criterios del catedrático. |

S-01, S-03 y S-07 fueron reemplazados por C-02, C-03, C-04, C-07 y C-08.

## 17. Registro de decisiones

| Id. | Decisión | Estado |
|---|---|---|
| D-01 | Tecnología | **Decidida (C-05):** Vite, HTML5, CSS3 y JavaScript modular, con Plotly.js, KaTeX y Vitest. |
| D-02 | Gramática: prefijos `y =` o `f(x) =`, exponente 0, signo `−` tipográfico y `x(x+1)` | **Aceptada:** se rechazan los prefijos (E-EXP-12) y `x^0`; se acepta `−`. `x(x+1)` se admite porque el analizador propio lo distingue sin ambigüedad (§9, CR-27). |
| D-03 | Analizador de expresiones | **Decidida (C-10):** analizador propio limitado a la gramática de §9 (design.md §5). Math.js sale de las dependencias. |
| D-04 | Resultados al cambiar una entrada | **Aceptada:** se retiran (R-12.1). |
| D-05 | Perfil con A_geo = 0 | **Aceptada:** no se presupuesta (E-MOD-03). |
| D-06 | Orden de los pasos del promedio | **Aceptada:** calcular I y dividir, mostrando la equivalencia con la pizarra. |
| D-07 | Límites de las Tablas 9.2 y 9.3 | **Aceptada.** Ningún límite es inviable en el plazo. Las precisiones sobre el análisis de ceros quedaron resueltas en D-09: no hay tope de coeficientes; la cota del área y la profundidad de bisección están en §9 y §12. |
| D-08 | Trapecio y tabla de valores | **Aceptada:** DESEABLE. Pospuestos desde el inicio en el plan (design §16; tareas T-D1 y T-D2). |
| D-09 | Tope de coeficientes y presupuesto del análisis de ceros (design §17, ajustes 1 a 3). El tope de 10⁹ que proponía design v0.3 rechazaría entradas que la Tabla 9.2 admite, como `(0.000001x)^3`. | **Decidida (C-11): sin tope nuevo.** La Tabla 9.2 no cambia. La profundidad máxima es de 200 bisecciones, con E-SIS-01 solo si se agota antes de determinar la naturaleza de cada cero (R-21.3). R-05.3 queda confirmado y nunca se presenta como aproximada una raíz racional. Casos: CR-32 a CR-36. Se descartó la alternativa del tope de 10⁹. |

## 18. Registro de contradicciones y auditoría de la Etapa A

| N.º | Gravedad | Evidencia | Consecuencia | Corrección aplicada |
|---|---|---|---|---|
| 1 | Alta | El PC §13 dice que no hay decisión entre A y B; el PC §12 menciona React; la lista final del equipo elige HTML/CSS/JS, Vite, Math.js, Plotly, KaTeX y Vitest | Riesgo de diseñar dos aplicaciones | Requisitos neutrales; decisión única en la Etapa B (D-01) |
| 2 | Alta | Las listas antiguas de módulos (terrenos, volúmenes, Kirchhoff, dos curvas) no pudieron revisarse (enlaces con 403) | Riesgo de reintroducir funciones descartadas | Se usa solo el alcance del PC (§6–§7) |
| 3 | Alta | «Área bajo la curva» calculada como una integral (P1-D) solo es válida si f ≥ 0 | Presupuestar con I o con \|I\| | R-05, R-06, R-16.4; CR-05, CR-06, CR-14 |
| 4 | Alta | Las «Fórmulas originales» de P2-A, para una sola f ≥ 0, se aplican en P2-C a dos curvas bajo el eje | ȳ positivo erróneo (27/70) si no se adaptan | Formulario §11; R-27 limitado a una sola función |
| 5 | Media | «+C» en el valor promedio (P1-A) | Error conceptual en los pasos | R-04.3, R-09.7; formulario §5.3 |
| 6 | Media | 13.33 × 50 = Q666.50 | Costo alterado | R-17.3, R-18.3; CR-03 |
| 7 | Media | Muestrear puntos no prueba la ausencia de raíces | Signo o área incorrectos | R-05.2 |
| 8 | Media | Math.js no integra y tiene avisos de seguridad recientes | Capacidad sobrestimada; ejecución de código | R-04.1, R-20; D-03 |
| 9 | Media | Exposición sin internet garantizado; posible falla de la biblioteca gráfica | Demostración fallida | R-22, R-10.6, R-09.8; §13 |
| 10 | Media | Unas 60 h de programación y 30 h de revisión entre el 20 y el 29 de octubre (C-03) | Núcleo incompleto | R-27 y R-28 son POSTERIOR; trapecio y tabla son DESEABLE; orden de recorte y protección del núcleo en design.md §16 |
| 11 | Baja | Intervalos «(1, 4)», tabla «27» (era 26, C-07), corchetes sin operador | Errores de transcripción en los pasos | Formulario §14; R-09.6 |
| 12 | Baja | «Markdown pegado.md» mencionado como adjunto, pero no recibido; registra Q666.50 | Valor histórico erróneo | Prevalecen las confirmaciones (C-09); CR-03 fija Q666.67 y Q733.33 |
| 13 | Media | design v0.3 proponía un tope de coeficientes de 10⁹ que rechazaba entradas que la Tabla 9.2 admite, como `(0.000001x)^3` | Requisitos y diseño contradictorios | D-09 decidida sin tope (C-11); CR-32 a CR-36 |

No hay hallazgos sobre servidores ni bases de datos porque la arquitectura propuesta no los incluye. Esta auditoría no garantiza la ausencia de errores.
