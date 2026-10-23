# Revisión manual de ÁreaCalc (T-R2)

Lista de comprobación de la interfaz (41 puntos) para T-R3 (revisión manual) y T-R5 (ensayo en la laptop sin internet), según requirements R-25.4 y §15, punto 4. La redactó Kiro el 22 de octubre de 2026 a pedido del equipo. R puede ajustarla antes de usarla.

**Estado de la lista:** redactada y en ejecución. El 22 de octubre el equipo hizo una primera revisión parcial en el navegador (§0.2). Solo FIG-02 cubre todos sus criterios y está **Aprobado**; los demás puntos siguen en «Pendiente», algunos con evidencia parcial anotada. T-R3 y T-R5 no están terminadas.

## 0. Cómo usar esta lista

- Haga las comprobaciones en orden. Cada una dice qué preparar, qué escribir exactamente, qué pulsar y qué debe verse.
- Escriba los datos tal como aparecen entre comillas invertidas, por ejemplo `x^3 - 1`, sin las comillas.
- En cada punto, cambie **Estado** a una de estas tres palabras:
  - **Pendiente:** todavía no se hizo.
  - **Aprobado:** todo lo de «Resultado esperado» se vio igual.
  - **Fallido:** algo no coincide, falta o da error. Anote qué vio, con una captura si puede, y siga con el punto siguiente. No intente corregir la aplicación durante la revisión.
- **Documentar un fallo no aprueba la aplicación.** Un punto «Fallido» bien anotado cuenta como comprobación ejecutada, pero el defecto sigue abierto: el equipo decide si se corrige (y entonces el punto se repite) o si se acepta como limitación conocida. La aplicación solo se considera aprobada cuando no quedan fallos sin resolver o aceptar.
- Si solo se comprobó una parte de un punto, déjelo en «Pendiente» y anote en «Observaciones» qué se vio y qué falta.
- En **Observaciones y evidencia** anote quién revisó, la fecha, el navegador y el nombre de la captura (por ejemplo `MR-01-cr01.png`).
- «Recargar» significa pulsar F5. Recargar borra todos los datos escritos (R-12.3); varios puntos empiezan así para partir de una página limpia.
- Los decimales usan punto: `0.5`, no `0,5`.

### 0.1 Lo que ya se comprobó automáticamente (no aprueba esta lista)

`docs/verificacion-integracion.md` registra un recorrido automático en Chrome sin interfaz, sobre el build servido en la computadora de trabajo: CR-01, CR-02, CR-03, CR-05, figuras, errores, invalidación, Plotly y KaTeX bloqueados, 360 px, teclado y ausencia de solicitudes externas. También registra `npm test` (1304/1304), `npm run build` y `npm run verificar-dist`, todos con código de salida 0. Esa comprobación **no sustituye** la revisión de personas: no usó lectores de pantalla, no probó el zoom ni la laptop de exposición, y no apagó el Wi-Fi.

**Antecedente del equipo:** el equipo comprobó visualmente CR-03 en Estimación: 40/3 m², 44/3 m², Q666.67 y Q733.33. Es un antecedente de MR-03 y de EST-01; esos puntos siguen en «Pendiente» hasta recorrerlos completos.

### 0.2 Primera revisión parcial del equipo (22 de octubre)

El equipo informó estas observaciones en el navegador. No se registraron nombres de capturas, tiempos ni comprobaciones de teclado. Cada observación está copiada también en el punto que le corresponde.

| Observación del equipo | Punto | Efecto |
|---|---|---|
| CR-01: I = A_geo = 243/4 = 60.75 u², promedio 81/4 = 20.25 u, gráfica, procedimiento, W-03 y bloqueo E-MOD-01 | MR-01 | Parcial: falta Intro en b, foco y los textos concretos de los pasos |
| CR-02: I = A_geo = 6 m², promedio 2 m, gráfica y procedimientos; estimación habilitada | MR-02 | Parcial: faltan la función mostrada, las notas, la ausencia de advertencias y la equivalencia con la pizarra |
| CR-03 desde el selector: carga y cálculo automáticos, 40/3 m², 10/3 m; estimación con 50 y 10: 44/3 m², Q666.67 y Q733.33 | EST-01 y MR-03 | Parcial: faltan la nota de origen, el recuadro «Datos simulados» y W-05; MR-03 pide la entrada a mano |
| CR-05: I = 0, A_geo = 1 m², promedio 0; gráfica con ambas regiones, W-01, integrales −1/2 y 1/2, bloqueo E-MOD-02 | MR-04 | Parcial: faltan distintivos, notas, leyendas y rayas; además, el texto de E-MOD-02 y la interpretación del promedio cambiaron después (§0.3) |
| Tras CR-03 y su estimación, cambiar b de 4 a 5 sin recalcular retiró resultados, gráfica y la estimación anterior; precio 50 y adicional 10 permanecieron. No se comprobó todo el contenido inferior de pasos | INV-01 | Parcial: faltan la retirada del procedimiento y la banda, y la banda «Sin fuente del área» en Estimación |
| Rectángulo 100 × 200 cm: 20000 cm² = 2 m² y procedimiento de conversión correcto | FIG-02 | **Aprobado** |
| Al usarlo como fuente: 2.2 m² con adicional, Q100.00 y Q110.00 | EST-02 | Parcial: faltan la banda de la fuente y el área útil |
| Círculo r = 50 cm: 2500π cm² ≈ 7853.9816 cm² y π/4 m² ≈ 0.7854 m² | FIG-03 | Parcial: falta el círculo de radio 5 m |
| Triángulo de base 4 m y altura perpendicular 3 m: 6 m², procedimiento correcto | FIG-03 | Parte del mismo punto |
| Estimación del círculo de 50 cm con 50 y 10: 11π/40 m² ≈ 0.8639 m², Q39.27 y Q43.20 | EST-03 (relacionada) | No cubre EST-03, que usa otro caso; se anota como evidencia adicional |
| Estimación del triángulo con 50 y 10: 6.6 m², Q300.00 y Q330.00 | EST-02 (relacionada) | Evidencia adicional |
| Radio −1 y Calcular área: E-NUM-06 y se retiró el resultado | FIG-04 | Parcial: FIG-04 prueba el rectángulo con 0, −3 y vacío |
| Después, en Estimación, Calcular: E-MOD-04 y «Sin estimación» | EST-04 | Parcial: cubre la idea del paso 1, pero falta la banda «Sin fuente del área» y los pasos 2 a 4 |

### 0.3 Textos corregidos después de la revisión parcial

Tras la revisión del 22 de octubre se corrigieron dos textos; los puntos que los muestran deben comprobarse con la versión nueva:

- **Interpretación del promedio** cuando f toma valores negativos (MR-04): ahora dice que (b − a)·f_prom = I siempre se cumple y que, por los valores negativos, ese producto no es el área geométrica y no se muestra el rectángulo equivalente.
- **E-MOD-02** (MR-04): ya no sugiere g(x) = −f(x); ahora dice «El perfil toma valores negativos y no representa una altura no negativa en todo el intervalo. Revise el modelo físico y el intervalo antes de estimar material.»

## 1. Preparación general

### PREP-01 · Servir la versión construida

- **Preparación:** computadora con el proyecto en `C:\Users\Brianita\Proyectos\AreaCalc-1` (o la carpeta donde lo tenga) y dependencias ya instaladas.
- **Pasos:**
  1. Abra el **Símbolo del sistema** (`cmd`), no PowerShell.
  2. Escriba `cd /d C:\Users\Brianita\Proyectos\AreaCalc-1` y pulse Intro.
  3. Escriba `npm run build` y espere a que termine. El aviso amarillo sobre fragmentos de más de 500 kB es normal.
  4. Escriba `npm run preview`. Deje esa ventana abierta durante toda la revisión.
  5. Abra en Chrome o Edge la dirección que muestra la consola (normalmente `http://localhost:4173/`).
- **Resultado esperado:** se ve «Analizador de perfiles» con el menú lateral azul oscuro (Perfil, Figuras, Estimación). Al pie, «Cálculo exacto con fracciones; los decimales se redondean solo al mostrarlos.» No hay enlace a una página de prueba.
- **Estado:** Pendiente
- **Observaciones y evidencia:**

### PREP-02 · Navegador para la revisión

- **Preparación:** la página de PREP-01 abierta, en una ventana de escritorio de al menos 1280 px de ancho.
- **Pasos:**
  1. Pulse F12 para abrir las herramientas de desarrollo.
  2. Vaya a la pestaña **Red** (Network) y marque **Inhabilitar caché** (Disable cache). Déjela marcada mientras las herramientas estén abiertas.
  3. Compruebe que el zoom del navegador está al 100 % (Ctrl + 0).
- **Resultado esperado:** al recargar, la pestaña Red lista solo direcciones que empiezan por `http://localhost:4173` (o `127.0.0.1`). Ninguna fila en rojo, salvo quizá `favicon.ico`, que no afecta a la aplicación.
- **Estado:** Pendiente
- **Observaciones y evidencia:**

## 2. Casos de la exposición

Para los cuatro casos: recargue, quédese en **Perfil**, escriba los datos a mano (no use el selector de ejemplos; el selector se prueba en NAV-04) y pulse **Calcular**.

### MR-01 · CR-01: x³ − 1 en [1, 4], ejercicio abstracto

- **Preparación:** recargar; sección Perfil.
- **Entrada:** Interpretación **Ejercicio abstracto**; Función del perfil f(x) `x^3 - 1`; Límite inferior a `1`; Límite superior b `4`.
- **Pasos:** escriba los datos y, con el cursor en el campo b, pulse **Intro** (no el botón).
- **Resultado esperado:**
  - El foco pasa al encabezado «Resultados» (contorno visible).
  - Arriba a la derecha: f(x) = x³ − 1.
  - Integral con signo I: **243/4 u²** y debajo **= 60.75 u²**. Área geométrica A_geo: **243/4 u²**, = 60.75 u². Valor promedio f_prom: **81/4 u**, = 20.25 u.
  - Notas: «Ceros de f en [a, b]: x = 1.» y el rectángulo equivalente con base 3 u, altura 81/4 = 20.25 u y área 243/4 = 60.75 u².
  - Advertencia: «W-03 Hay un cero en un extremo del intervalo, en x = 1.»
  - Gráfica: curva, región sombreada con la leyenda «Sobre el eje (+)», un marcador en x = 1, una recta discontinua «f_prom = 81/4 u» y el contorno del «Rectángulo equivalente». Ejes «x (u)» y «f(x) (u)».
  - Procedimiento paso a paso (abierto): incluye «F(4) = 4⁴/4 − 4 = 64 − 4 = 60», «F(1) = 1⁴/4 − 1 = 1/4 − 1 = −3/4» y «A = 243/4 = 60.75 u²». Ningún resultado lleva «+C».
  - Banda «Área no apta»: botón «Usar esta área para estimar material» deshabilitado y el motivo «E-MOD-01: Un ejercicio abstracto no tiene escala física…».
- **Estado:** Pendiente (evidencia parcial)
- **Observaciones y evidencia:** 22 oct, equipo: I = A_geo = 243/4 = 60.75 u², promedio 81/4 = 20.25 u, gráfica, procedimiento, W-03 y bloqueo E-MOD-01 vistos. Falta: calcular con Intro en b, comprobar el foco en «Resultados», los textos de F(4), F(1) y A, la ausencia de «+C» y los elementos concretos de la gráfica.

### MR-02 · CR-02: 1 + x² en [−1, 2], perfil físico

- **Preparación:** recargar; sección Perfil.
- **Entrada:** Interpretación **Perfil físico**; f(x) `1 + x^2`; a `-1`; b `2`.
- **Pasos:** escriba los datos y pulse **Calcular**.
- **Resultado esperado:**
  - f(x) = x² + 1 (el orden es descendente; es la misma función).
  - I = **6 m²**; A_geo = **6 m²**; f_prom = **2 m**. Los límites negativos se aceptan.
  - Notas: «Ceros: f no tiene ceros en [a, b].» y rectángulo con base 3 m, altura 2 m y área 6 m².
  - Sin advertencias.
  - En «Valor promedio», paso «División entre b − a», la explicación dice «Equivalencia con la pizarra… (1/3)·(14/3) − (1/3)·(−4/3) = (1/3)·[14/3 − (−4/3)] = (1/3)·6 = 2».
  - Banda «Área apta» con el botón habilitado.
- **Estado:** Pendiente (evidencia parcial)
- **Observaciones y evidencia:** 22 oct, equipo: I = A_geo = 6 m², promedio 2 m, gráfica y procedimientos; estimación habilitada. Falta: f(x) = x² + 1 mostrada, las notas (sin ceros, rectángulo 3 m × 2 m), que no haya advertencias y la equivalencia con la pizarra en el paso de división.

### MR-03 · CR-03: 2 + x²/4 en [0, 4] m, con estimación

- **Preparación:** recargar; sección Perfil.
- **Entrada:** Interpretación **Perfil físico**; f(x) `2 + x^2/4`; a `0`; b `4`. Después, en Estimación: Precio por metro cuadrado `50`; Adicional w `10`.
- **Pasos:**
  1. Escriba los datos del perfil y pulse **Calcular**.
  2. Pulse **Usar esta área para estimar material**.
  3. En Estimación, escriba el precio y el adicional y pulse **Calcular estimación**.
- **Resultado esperado:**
  - Perfil: I = **40/3 m²** (≈ 13.3333 m²); A_geo = **40/3 m²**; f_prom = **10/3 m** (≈ 3.3333 m); rectángulo base 4 m, altura 10/3 ≈ 3.3333 m. Gráfica con la recta «f_prom = 10/3 m» y el rectángulo. Banda «Área apta».
  - Al pulsar el botón, la dirección termina en `#estimacion` y la banda «Fuente activa · perfil» dice «Perfil f(x) = x²/4 + 2 en [0, 4] m» y «A_geo = 40/3 ≈ 13.3333 m²».
  - Estimación: Área útil **40/3 m²**; Área con adicional **44/3 m²** (≈ 14.6667 m²); Costo base **Q666.67**; Costo estimado **Q733.33**. No debe aparecer Q666.50 (sería el error de redondear 13.33 antes de multiplicar).
  - «Supuestos de este cálculo» muestra el texto de W-06. Como el precio se escribió a mano, **no** aparece «Los precios y datos de este ejemplo son simulados.»
  - «Procedimiento de la estimación»: «… = 2000/3 ≈ Q666.67» y «… = 2200/3 ≈ Q733.33».
- **Antecedente:** el equipo ya vio 40/3 m², 44/3 m², Q666.67 y Q733.33 en Estimación. Falta recorrer el punto completo.
- **Estado:** Pendiente (evidencia parcial)
- **Observaciones y evidencia:** 22 oct, equipo: CR-03 se cargó **desde el selector** (no a mano): 40/3 m², 10/3 m; con 50 y 10, 44/3 m², Q666.67 y Q733.33. Falta: escribir los datos a mano, la banda de la fuente, el rectángulo, que no aparezca W-05 y el procedimiento de la estimación.

### MR-04 · CR-05: x en [−1, 1] m, integral frente a área

- **Preparación:** recargar; sección Perfil.
- **Entrada:** Interpretación **Perfil físico**; f(x) `x`; a `-1`; b `1`.
- **Pasos:** escriba los datos y pulse **Calcular**.
- **Resultado esperado:**
  - I = **0 m²** con el distintivo «Distinta de A_geo»; A_geo = **1 m²** con «Distinta de I»; f_prom = **0 m**.
  - «Ceros de f en [a, b]: x = 0.»; «Rectángulo equivalente: solo se muestra cuando f ≥ 0 en todo [a, b].»
  - Advertencia «W-01 f cambia de signo: la integral con signo y el área geométrica son distintas.»
  - Gráfica: dos regiones, «Bajo el eje (−)» (rosa, con rayas diagonales) y «Sobre el eje (+)» (turquesa). La diferencia no depende solo del color: hay leyenda y rayas.
  - Procedimiento: tramos «I₁ = F(0) − F(−1) = −1/2, |I₁| = 1/2» e «I₂ = F(1) − F(0) = 1/2, |I₂| = 1/2», y la suma 1 m².
  - En «Valor promedio», paso «Interpretación»: «El valor promedio de f en [−1, 1] es 0 m. La base multiplicada por el valor promedio coincide con la integral con signo: (b − a)·f_prom = I. Como la función toma valores negativos, ese producto no representa el área geométrica y no se muestra el rectángulo equivalente.»
  - Banda «Área no apta» con el botón deshabilitado: «E-MOD-02: El perfil toma valores negativos y no representa una altura no negativa en todo el intervalo. Revise el modelo físico y el intervalo antes de estimar material.» No sugiere g(x) = −f(x).
- **Estado:** Pendiente (evidencia parcial)
- **Observaciones y evidencia:** 22 oct, equipo: I = 0, A_geo = 1 m², promedio 0; gráfica con ambas regiones, W-01, procedimiento con integrales −1/2 y 1/2 y bloqueo E-MOD-02, vistos **antes** de corregir los textos de §0.3. Falta: los distintivos, las notas, las leyendas y las rayas de la gráfica, la suma 1 m², y ver la interpretación del promedio y el texto de E-MOD-02 nuevos.

## 3. Figuras y conversión de unidades

### FIG-01 · Rectángulo en metros (CR-09)

- **Preparación:** recargar; menú **Figuras**.
- **Entrada:** tarjeta **Rectángulo**; Unidad de longitud **m (metros)**; Base b `4`; Altura h `2`.
- **Pasos:** pulse **Calcular área**.
- **Resultado esperado:** «Resultado: rectángulo», fórmula A = b × h, etiquetas «Base b = 4 m» y «Altura h = 2 m», una sola tarjeta de área **8 m²** («Ya está en m²…»). Procedimiento con Datos, Fórmula, Sustitución «A = 4 × 2» y Resultado «A = 8 m²», sin paso de conversión.
- **Estado:** Pendiente
- **Observaciones y evidencia:**

### FIG-02 · Rectángulo en centímetros (CR-10), cm² → m²

- **Preparación:** sigue en Figuras.
- **Entrada:** Rectángulo; Unidad **cm (centímetros)**; Base b `100`; Altura h `200`.
- **Pasos:** cambie la unidad, escriba las medidas y pulse **Calcular área**.
- **Resultado esperado:** dos tarjetas: «Área en cm²» **20000 cm²** y «Área en m²» **2 m²** («1 m² = 10 000 cm²…»). El último paso, «Conversión a m²», muestra 20000/10 000 m² = 2 m² y explica que el área se divide entre el cuadrado del factor (100² = 10 000).
- **Estado:** Aprobado
- **Observaciones y evidencia:** 22 oct, equipo, en el navegador: 20000 cm² = 2 m² y procedimiento de conversión correcto. Sin captura registrada.

### FIG-03 · Triángulo y círculo

- **Preparación:** sigue en Figuras, unidad **m (metros)**.
- **Entrada y pasos:**
  1. Tarjeta **Triángulo**; Base b `4`; Altura h `3`; **Calcular área**.
  2. Tarjeta **Círculo**; Radio r `5`; **Calcular área**.
  3. Círculo en **cm (centímetros)**; Radio r `50`; **Calcular área**.
- **Resultado esperado:**
  1. Triángulo: **6 m²**, fórmula A = (b × h)/2. Mientras está elegido el triángulo, bajo la altura se lee «Perpendicular a la base.»
  2. Círculo: **25π m²** y debajo **≈ 78.5398 m²**; solo se ve el campo Radio.
  3. Círculo de 50 cm: **2500π cm²** (≈ 7853.9816 cm²) y en m² **π/4 m²** (≈ 0.7854 m²).
- **Estado:** Pendiente (evidencia parcial)
- **Observaciones y evidencia:** 22 oct, equipo: triángulo de base 4 m y altura perpendicular 3 m → 6 m², procedimiento correcto; círculo de radio 50 cm → 2500π cm² ≈ 7853.9816 cm² y π/4 m² ≈ 0.7854 m². Falta: el círculo de radio 5 m (25π m² ≈ 78.5398 m²) y que solo se vea el campo Radio.

### FIG-04 · Medidas no válidas en figuras

- **Preparación:** Figuras; Rectángulo; unidad m.
- **Entrada y pasos:** pruebe por separado, pulsando **Calcular área** cada vez: Base `0` y Altura `2`; Base `-3` y Altura `2`; Base vacía y Altura `2`.
- **Resultado esperado:** con 0 y con −3, «E-NUM-06 «Base b» debe ser mayor que cero…»; vacío, «E-NUM-01 El campo «Base b» está vacío…». El mensaje aparece bajo el campo y en el resumen «Hay 1 dato por corregir». No queda ningún resultado anterior.
- **Estado:** Pendiente (evidencia parcial)
- **Observaciones y evidencia:** 22 oct, equipo, caso relacionado: círculo con radio `-1` → E-NUM-06 y se retiró el resultado anterior. Falta: los tres casos del rectángulo (0, −3 y vacío).

## 4. Estimación, adicional y redondeo final

### EST-01 · Estimación desde CR-03 con el ejemplo simulado

- **Preparación:** recargar; Perfil.
- **Pasos:**
  1. En **Ejemplo**, elija «Caso práctico simulado · 2 + x²/4 en [0, 4] m, precio y adicional simulados».
  2. Pulse **Usar esta área para estimar material**.
  3. Sin tocar los campos, pulse **Calcular estimación**.
- **Resultado esperado:**
  - Paso 1: los campos se rellenan solos (`2 + x^2/4`, 0, 4, Perfil físico), se calcula sin pulsar Calcular y bajo el selector aparece «Origen: Caso práctico simulado. El precio y el adicional que se copian a Estimación son simulados, no son precios reales.»
  - Paso 2: en Estimación, el precio ya dice 50 y el adicional 10, y sobre el botón se ve el recuadro «Datos simulados El precio y el adicional vienen del caso práctico simulado…».
  - Paso 3: Q666.67 y Q733.33, como en MR-03, y además en los supuestos «Los precios y datos de este ejemplo son simulados.»
- **Antecedente:** ver MR-03.
- **Estado:** Pendiente (evidencia parcial)
- **Observaciones y evidencia:** 22 oct, equipo: carga y cálculo automáticos desde el selector; 40/3 m² y 10/3 m; estimación con 50 y 10: 44/3 m², Q666.67 y Q733.33. Falta: la nota de origen bajo el selector, el recuadro «Datos simulados» antes de calcular y W-05 en los supuestos.

### EST-02 · Estimación desde una figura en cm

- **Preparación:** recargar; Figuras.
- **Entrada:** Rectángulo, cm, Base `100`, Altura `200`; en Estimación, Precio `50`, Adicional `10`.
- **Pasos:** calcule el área, pulse **Usar esta área para estimar material**, escriba el precio y el adicional y pulse **Calcular estimación**.
- **Resultado esperado:** «Fuente activa · figura», «Rectángulo medido en cm», «A = 2 m²». Área útil **2 m²**, Área con adicional **11/5 m²** (= 2.2 m²), Costo base **Q100.00**, Costo estimado **Q110.00**. El precio se aplica al área en m², no a 20000 cm².
- **Estado:** Pendiente (evidencia parcial)
- **Observaciones y evidencia:** 22 oct, equipo: con el rectángulo de 100 × 200 cm como fuente, 2.2 m² con adicional, Q100.00 y Q110.00. Falta: la banda «Fuente activa · figura» con «Rectángulo medido en cm» y «A = 2 m²», y el área útil 2 m². Evidencia relacionada: el triángulo de 4 m × 3 m con 50 y 10 dio 6.6 m², Q300.00 y Q330.00.

### EST-03 · Adicional 0, círculo y redondeo una sola vez

- **Preparación:** recargar; Figuras; Círculo; m; Radio `5`; Calcular área; Usar esta área.
- **Entrada:** Precio `10`; Adicional `0`.
- **Pasos:** pulse **Calcular estimación**.
- **Resultado esperado:** Área útil 25π m² (≈ 78.5398 m²); Área con adicional igual; Costo base y Costo estimado **Q250π ≈ Q785.40**. El adicional 0 es válido. Los quetzales llevan siempre 2 decimales.
- **Estado:** Pendiente
- **Observaciones y evidencia:** evidencia relacionada (no cubre este punto, que usa r = 5 m, precio 10 y adicional 0): 22 oct, equipo, círculo de radio 50 cm con 50 y 10 → 11π/40 m² ≈ 0.8639 m², Q39.27 y Q43.20.

### EST-04 · Errores de la estimación

- **Preparación:** recargar; menú **Estimación** directamente, sin calcular nada antes.
- **Pasos y entradas:**
  1. Precio `50`, Adicional `10`, **Calcular estimación** sin fuente.
  2. Con una fuente válida (repita EST-02 hasta «Usar esta área»): Precio `-1`, Adicional `10`.
  3. Precio `50`, Adicional `150`.
  4. Precio `50.123`, Adicional `10`.
- **Resultado esperado:**
  1. «E-MOD-04 No hay un resultado apto vigente para estimar. Calcule primero un perfil físico válido o una figura.» La banda dice «Sin fuente del área» con enlaces a Perfil y a Figuras.
  2. E-NUM-05 bajo el precio («no puede ser negativo»).
  3. E-NUM-04 bajo el adicional (entre 0 % y 100 %).
  4. E-NUM-04 bajo el precio (2 decimales como máximo).
  En ningún caso queda una estimación anterior visible. Los supuestos generales de la derecha siempre están visibles.
- **Estado:** Pendiente (evidencia parcial)
- **Observaciones y evidencia:** 22 oct, equipo: después de que el círculo con radio −1 diera E-NUM-06, calcular en Estimación mostró E-MOD-04 y «Sin estimación». Falta: el paso 1 tal como está escrito (sin calcular nada antes) con la banda «Sin fuente del área», y los pasos 2 a 4.

## 5. Edición sin recalcular (invalidación, R-12.1)

### INV-01 · Editar el perfil retira resultado, gráfica, pasos y estimación

- **Preparación:** haga MR-03 completo (perfil y estimación calculados).
- **Pasos:**
  1. Vuelva a **Perfil** con el menú.
  2. En Límite superior b, cambie `4` por `5`. **No** pulse Calcular.
  3. Vaya a **Estimación**.
- **Resultado esperado:**
  - Perfil: «Todavía no hay resultados», la gráfica dice «Todavía no hay gráfica», no hay procedimiento ni banda de estimación, y no quedan cifras antiguas (ni 40/3).
  - Estimación: banda «Sin fuente del área» y «Todavía no hay estimación». El precio 50 y el adicional 10 escritos se conservan.
- **Estado:** Pendiente (evidencia parcial)
- **Observaciones y evidencia:** 22 oct, equipo: tras CR-03 y su estimación, cambiar b de 4 a 5 sin recalcular retiró los resultados y la gráfica del perfil y la estimación anterior; precio 50 y adicional 10 permanecieron. No se comprobó expresamente todo el contenido inferior (procedimiento y banda de estimación) ni la banda «Sin fuente del área» en Estimación.

### INV-02 · Cambiar la interpretación o la función

- **Preparación:** recargar; calcule CR-02 (MR-02).
- **Pasos:** cambie la interpretación a **Ejercicio abstracto** sin pulsar Calcular. Después vuelva a calcular CR-02 y borre una letra de la función.
- **Resultado esperado:** en los dos casos desaparecen al instante los resultados, la gráfica y el procedimiento. Las unidades de las etiquetas cambian a (u) al elegir Ejercicio abstracto.
- **Estado:** Pendiente
- **Observaciones y evidencia:**

### INV-03 · Editar la figura que es fuente

- **Preparación:** haga EST-02 completo.
- **Pasos:** vuelva a **Figuras** y cambie la Base de `100` a `101` sin pulsar Calcular área; después vaya a **Estimación**.
- **Resultado esperado:** en Figuras, «Todavía no hay resultado» y el selector de ejemplo (si se usó) vuelve a «Elija un ejemplo…». En Estimación, sin fuente y sin estimación.
- **Estado:** Pendiente
- **Observaciones y evidencia:**

### INV-04 · Editar el precio o el adicional

- **Preparación:** haga EST-01 completo (con «Datos simulados»).
- **Pasos:** en Estimación, cambie el adicional de `10` a `15` sin pulsar Calcular estimación.
- **Resultado esperado:** desaparece la estimación («Todavía no hay estimación»), la fuente del perfil sigue activa y desaparece el recuadro «Datos simulados» (el valor ya es del usuario). Al recalcular, los supuestos ya no incluyen W-05.
- **Estado:** Pendiente
- **Observaciones y evidencia:**

### INV-05 · Ningún resultado antiguo reaparece después

- **Preparación:** recargar; Perfil.
- **Pasos:** elija el ejemplo CR-03 y, en cuanto se vean los resultados, cambie b a `6` lo más rápido que pueda. Espere 5 segundos sin tocar nada.
- **Resultado esperado:** durante y después de la espera no reaparece ninguna gráfica, fórmula ni aviso W-08 del cálculo retirado. Se ve el estado vacío.
- **Estado:** Pendiente
- **Observaciones y evidencia:**

## 6. Entradas inválidas después de un cálculo válido (R-12.2)

### ERR-01 · Errores del perfil tras un resultado válido

- **Preparación:** recargar; calcule CR-01 (MR-01). Antes de cada fila de la tabla, vuelva a escribir CR-01 y calcule, para partir siempre de un resultado válido.
- **Pasos:** cambie solo lo indicado y pulse **Calcular**.

| Fila | Cambio | Resultado esperado |
|---|---|---|
| a | Función vacía | E-EXP-01 «Escriba una función de x, por ejemplo x^3 - 1.» bajo f(x) |
| b | Función `y + 1` | E-EXP-03 (solo se admite x minúscula) |
| c | Función `0,5x` | E-EXP-04 (decimal con coma) |
| d | Función `x^4` | E-EXP-10 (grado mayor que 3) |
| e | b = `Infinity` | E-NUM-03 «… debe ser un número finito. Infinity, NaN y ∞ no se admiten.» bajo b |
| f | b vacío | E-NUM-01 «El campo «Límite superior b» está vacío…» |
| g | a = `4`, b = `1` | E-INT-02 «El límite inferior es mayor que el superior. ÁreaCalc no los intercambia automáticamente.»; a y b marcados |
| h | a = `1`, b = `1` | E-INT-01 (intervalo de longitud cero) |

- **Resultado esperado en todas las filas:** el campo afectado se marca en rojo con el mensaje debajo; arriba aparece «Hay 1 dato por corregir» con el código y el foco va a ese título; al pulsar el enlace del resumen, el cursor va al campo. Desaparecen los resultados de CR-01, la gráfica («No se muestra la gráfica de un cálculo anterior») y el procedimiento. Nunca se ve 243/4 junto a datos inválidos.
- **Estado:** Pendiente (anote las filas que fallen)
- **Observaciones y evidencia:**

### ERR-02 · Varios errores a la vez

- **Preparación:** recargar; Perfil.
- **Entrada:** f(x) `y + 1`; a vacío; b `abc`.
- **Pasos:** pulse **Calcular**.
- **Resultado esperado:** el resumen dice «Hay 3 datos por corregir» y lista un error para la función, uno para a y uno para b, cada uno bajo su campo.
- **Estado:** Pendiente
- **Observaciones y evidencia:**

## 7. Navegación, botón Atrás, menú lateral y ejemplos

### NAV-01 · Secciones y botón Atrás

- **Preparación:** recargar en `http://localhost:4173/`.
- **Pasos:** pulse Figuras, luego Estimación, luego Perfil en el menú. Después pulse tres veces el botón **Atrás** del navegador y dos veces **Adelante**.
- **Resultado esperado:** la dirección cambia a `#figuras`, `#estimacion` y `#perfil`, y se ve una sola sección a la vez, con su enlace resaltado en el menú. Atrás y Adelante recorren las mismas secciones en orden, sin recargar la página ni perder datos ya calculados.
- **Estado:** Pendiente
- **Observaciones y evidencia:**

### NAV-02 · «Usar esta área» y volver

- **Preparación:** calcule CR-03 en Perfil.
- **Pasos:** pulse **Usar esta área para estimar material** y después **Atrás**.
- **Resultado esperado:** primero se abre Estimación con la fuente activa; al volver, Perfil conserva los resultados, la gráfica y el procedimiento de CR-03.
- **Estado:** Pendiente
- **Observaciones y evidencia:**

### NAV-03 · Contraer y expandir el menú lateral

- **Preparación:** ventana de escritorio, CR-03 calculado en Perfil.
- **Pasos:**
  1. Pulse **Contraer menú** (abajo en el menú).
  2. Pase el ratón por cada icono.
  3. Recargue la página.
  4. Pulse **Expandir menú**.
- **Resultado esperado:** al contraer, el menú queda como una franja de iconos y la gráfica se ensancha hasta ocupar el espacio libre, sin cortes ni barras de desplazamiento. Al pasar el ratón aparece el nombre de cada sección. Tras recargar, el menú sigue contraído (se recuerda la preferencia). Al expandir, vuelve a verse con los nombres y la gráfica se ajusta de nuevo.
- **Estado:** Pendiente
- **Observaciones y evidencia:**

### NAV-04 · Ejemplos de Perfil

- **Preparación:** recargar; Perfil.
- **Pasos:**
  1. Abra el selector **Ejemplo** y cuente las opciones.
  2. Elija «Ejercicio de clase · x³ − 1 en [1, 4]».
  3. Elija «Caso de comprobación · x² − 2 en [0, 2]: cero irracional».
  4. Cambie una letra de la función.
- **Resultado esperado:**
  1. «Elija un ejemplo…» y 8 ejemplos, cada uno empieza por su origen: «Ejercicio de clase», «Caso práctico simulado» o «Caso de comprobación».
  2. Se rellenan los campos y se calcula solo: los mismos valores que MR-01; bajo el selector, «Origen: Ejercicio de clase.»
  3. A_geo «≈ 2.4379 u²» con «aproximada; cota de error ≤ …» y la advertencia W-04 con la cota (por ejemplo «≤ 6·10⁻²⁵»); cero «x ≈ 1.4142».
  4. Desaparece el resultado, el selector vuelve a «Elija un ejemplo…» y la nota de origen desaparece.
- **Estado:** Pendiente
- **Observaciones y evidencia:**

### NAV-05 · Ejemplos de Figuras

- **Preparación:** recargar; Figuras.
- **Pasos:** abra el selector **Ejemplo** de Medidas y elija «Caso de comprobación · rectángulo de 100 cm × 200 cm».
- **Resultado esperado:** 2 ejemplos (CR-09 y CR-10). Al elegir CR-10 se elige Rectángulo, la unidad pasa a cm, se rellenan 100 y 200 y se ve el resultado de FIG-02, con «Origen: Caso de comprobación.»
- **Estado:** Pendiente
- **Observaciones y evidencia:**

### NAV-06 · Recargar reinicia el estado

- **Preparación:** cualquier resultado calculado.
- **Pasos:** pulse F5.
- **Resultado esperado:** todos los campos y resultados vuelven a vacío (es el comportamiento acordado, R-12.3), salvo la preferencia del menú contraído.
- **Estado:** Pendiente
- **Observaciones y evidencia:**

## 8. Teclado, foco, zoom y 360 px

### ACC-01 · Recorrido de Perfil solo con teclado

- **Preparación:** recargar; no use el ratón en todo el punto.
- **Pasos:** pulse **Tab** repetidamente y anote el orden. En el selector de ejemplos, use las flechas. En Interpretación, use las flechas izquierda y derecha. Escriba CR-05 con el teclado y pulse Intro.
- **Resultado esperado:** orden lógico: «Saltar al contenido» → Perfil → Figuras → Estimación → Contraer menú → Ejemplo → Interpretación → f(x) → a → b → Calcular. Cada elemento enfocado tiene un contorno azul visible de unos 3 px (en Interpretación, alrededor de la tarjeta). Tras calcular, el foco queda en «Resultados»; con Tab se llega al botón del procedimiento y a la banda. Nada queda inaccesible.
- **Estado:** Pendiente
- **Observaciones y evidencia:**

### ACC-02 · «Saltar al contenido», Figuras y Estimación con teclado

- **Pasos:**
  1. Recargue y pulse Tab una vez; pulse Intro sobre «Saltar al contenido».
  2. En Figuras, llegue con Tab a las tarjetas de figura y cambie de figura con las flechas; complete FIG-01 con el teclado.
  3. Use «Usar esta área» con Intro y complete la estimación con el teclado.
- **Resultado esperado:** 1, el foco salta al contenido principal sin cambiar de sección. 2, las flechas cambian entre Rectángulo, Triángulo y Círculo (la elegida lleva ✓ además del color) y se puede calcular con Intro. 3, se llega a Estimación y el foco pasa al título; tras calcular, a «Estimación».
- **Estado:** Pendiente
- **Observaciones y evidencia:**

### ACC-03 · Zoom al 200 %

- **Preparación:** ventana de escritorio; CR-03 calculado.
- **Pasos:** pulse **Ctrl** y **+** hasta 200 %. Recorra Perfil, Figuras y Estimación. Vuelva al 100 % con Ctrl + 0.
- **Resultado esperado:** todo el texto se lee y no se superpone; los formularios no necesitan desplazamiento horizontal; si el menú pasa a botón de menú, se abre y se cierra bien. Anote cualquier recorte.
- **Estado:** Pendiente
- **Observaciones y evidencia:**

### ACC-04 · Ancho de 360 px (teléfono)

- **Preparación:** F12; pulse **Ctrl + Shift + M** (barra de dispositivos); en la parte superior elija «Responsive» (Adaptable) y escriba ancho `360` y alto `740`. Recargue.
- **Pasos:**
  1. En Perfil, calcule CR-03 y desplácese hasta el final.
  2. Pulse el botón de menú (tres rayas, arriba a la izquierda); pulse **Escape**.
  3. Abra el menú otra vez y elija Figuras; calcule un círculo de radio `5` y después pruebe radio `-1`.
  4. Haga la estimación de EST-02.
  5. En Perfil, calcule f(x) `(((1000000^3)^3)^3)^3`, a `0`, b `1`, abstracto.
- **Resultado esperado:** en ningún momento la página se desplaza en horizontal (se puede comprobar arrastrando hacia la izquierda). La gráfica cabe en el ancho. El menú se abre como panel con fondo oscuro; con Escape se cierra y el foco vuelve al botón de menú; al elegir una sección, el panel se cierra. En el paso 5 el número largo se parte en varias líneas dentro de su tarjeta, sin perder cifras; la gráfica dice «Gráfica no disponible» y W-07; el procedimiento sigue visible.
- **Restaurar:** vuelva a pulsar Ctrl + Shift + M para salir de la vista de dispositivo.
- **Estado:** Pendiente
- **Observaciones y evidencia:**

### ACC-05 · Información que no depende del color (R-23.4)

- **Preparación:** CR-05 calculado.
- **Pasos:** observe las tarjetas, la gráfica y los avisos.
- **Resultado esperado:** los distintivos «Distinta de A_geo» / «Distinta de I» son texto; la región negativa tiene rayas y leyenda; cada advertencia lleva su código (W-01…); los errores llevan su código (E-…) y texto.
- **Estado:** Pendiente
- **Observaciones y evidencia:**

### ACC-06 · Lector de pantalla (opcional)

- **Preparación:** Windows: active el Narrador con **Ctrl + Windows + Intro** (se desactiva igual).
- **Pasos:** calcule CR-01 con Intro y escuche; provoque un error (ERR-01, fila a).
- **Resultado esperado:** se anuncian los resultados al aparecer y el resumen de errores; los campos se leen con su etiqueta y su unidad; la gráfica se anuncia con su descripción («Gráfica de f(x) = x³ − 1 en [1, 4]…»). Si no se hace, déjelo como «Pendiente» y anote el motivo.
- **Estado:** Pendiente
- **Observaciones y evidencia:**

### ACC-07 · Contraste del texto (R-23.4: mínimo 4.5:1)

- **Requisito vigente:** R-23.4 exige un contraste mínimo de **4.5:1** para el texto (nivel AA de WCAG 2.1). Aplíquelo a todo texto visible, también al grande; los controles deshabilitados se anotan aparte.
- **Preparación:** ventana de escritorio, zoom al 100 %; CR-01 calculado (para ver la banda «Área no apta») y, en otra pasada, CR-03 con su estimación y un error de ERR-01.
- **Pasos:**
  1. F12 y pulse **Ctrl + Shift + C** (seleccionar elemento).
  2. Pase el puntero sobre cada texto de la tabla. La ventanita muestra «Contraste» con un número (por ejemplo «Contraste 5.05») y una marca verde si pasa. Si no aparece, haga clic en el texto, y en el panel **Estilos** haga clic en el cuadrito de color de `color`: el selector muestra «Relación de contraste».
  3. Anote el número de cada fila.

| Texto que medir | Dónde | Medido |
|---|---|---|
| Texto normal de párrafos y etiquetas de los campos | formulario de Perfil | |
| Ayudas grises («Polinomios en x de grado ≤ 3…», «Origen: …») | bajo los campos y el selector | |
| Nombres y detalles del menú lateral (texto claro sobre azul oscuro) | menú | |
| Texto de los botones (blanco sobre azul) | Calcular, Calcular área | |
| Cifra secundaria y notas de las tarjetas («= 60.75 u²», «Suma con signo…») | tarjetas de resultados | |
| Distintivos «Distinta de A_geo» / «Distinta de I» | CR-05 | |
| Avisos W-01, W-03, W-08 (texto ámbar sobre fondo claro) | lista de advertencias | |
| Mensajes de error en rojo bajo un campo y en el resumen | ERR-01 | |
| Banda oscura (etiqueta turquesa y texto claro) | «Área apta» / «Área no apta», «Fuente activa» | |
| Etiquetas de la gráfica (ejes, leyenda, «f_prom = …») | tarjeta Gráfica | |
| Indicadores de Estimación, incluido «Costo estimado» sobre azul | resultados de la estimación | |

- **Resultado esperado:** todas las filas miden **4.5 o más**. Una fila por debajo de 4.5 es **Fallido** (anote el elemento, el color y el número).
- **Antecedente (no aprueba este punto):** en T-14 una medición automática dio un mínimo de 4.81:1 en los textos visibles de entonces; no se repitió con los elementos añadidos después.
- **Estado:** Pendiente
- **Observaciones y evidencia:**

## 9. Fallos de Plotly y KaTeX

Las bibliotecas se bloquean desde las herramientas de desarrollo; la aplicación no se modifica. **Haga un solo bloqueo a la vez** y restaure antes del siguiente.

**Cómo abrir el bloqueo de solicitudes (Chrome o Edge):** con F12 abierto, pulse **Ctrl + Shift + P**, escriba `bloque` (o `block`) y elija la opción que abre el panel de bloqueo de solicitudes de red (según la versión se llama «Bloqueo de solicitudes de red», «Network request blocking» o «Request conditions»). En ese panel: marque **Habilitar bloqueo de solicitudes**, pulse **+** (Agregar patrón) y escriba el patrón. Alternativa: en la pestaña Red, clic derecho sobre la fila del archivo → **Bloquear URL de la solicitud**.

### FAL-01 · Plotly bloqueado (W-07)

- **Preparación:** PREP-02 hecho (caché inhabilitada).
- **Pasos:**
  1. Agregue el patrón `*plotly-basic*` y compruebe que está marcado.
  2. Recargue (F5) y espere 3 segundos.
  3. Calcule CR-03 desde el selector de ejemplos y después CR-05.
- **Resultado esperado:** en la pestaña Red, la fila `plotly-basic.min-….js` aparece bloqueada. En la tarjeta Gráfica se lee «Gráfica no disponible» y «W-07: La gráfica no está disponible; los resultados y los pasos se conservan.». Las tres tarjetas de resultados, las notas y el procedimiento (con fórmulas) siguen visibles y correctos. La página no se congela; el segundo cálculo vuelve a mostrar W-07.
- **Restaurar:** desmarque **Habilitar bloqueo de solicitudes** y elimine el patrón (icono de papelera o clic derecho → Quitar). Recargue y calcule CR-03: la gráfica debe volver a dibujarse.
- **Estado:** Pendiente
- **Observaciones y evidencia:**

### FAL-02 · KaTeX bloqueado (W-08)

- **Preparación:** FAL-01 restaurado; caché inhabilitada.
- **Pasos:**
  1. Agregue el patrón `*assets/katex-*` (bloquea el programa y la hoja de estilos de KaTeX).
  2. Recargue y calcule CR-01 desde el selector.
  3. Cambie b a `5` sin calcular; después pulse **Calcular**.
  4. Vaya a Figuras y elija el ejemplo CR-09.
- **Resultado esperado:**
  - Paso 2: las fórmulas se ven como texto normal y legible, por ejemplo «F(4) = 4⁴/4 − 4 = 64 − 4 = 60» y «f(x) = x³ − 1». Aparece **un solo** aviso «W-08 La representación enriquecida no está disponible; las fórmulas se muestran en texto.» encima del procedimiento, no uno por fórmula. La gráfica se dibuja normalmente.
  - Paso 3: al editar desaparece el W-08 junto con el resultado; al recalcular vuelve a aparecer una sola vez.
  - Paso 4: en Figuras, un solo W-08 y la fórmula «A = b × h» en texto.
- **Restaurar:** desmarque el bloqueo, elimine el patrón, recargue y calcule CR-01: las fórmulas deben verse con tipografía matemática (fracciones apiladas) y sin W-08.
- **Estado:** Pendiente
- **Observaciones y evidencia:**

### FAL-03 · Restauración completa

- **Pasos:** cierre el panel de bloqueo, desmarque «Inhabilitar caché» si no lo necesita, recargue y repita MR-01 rápidamente.
- **Resultado esperado:** gráfica, fórmulas y resultados normales, sin W-07 ni W-08. Si algo sigue bloqueado, revise que no quede ningún patrón activo.
- **Estado:** Pendiente
- **Observaciones y evidencia:**

## 10. Ensayo sin internet (T-R5, en la laptop de exposición)

Estos puntos se hacen en la laptop Windows de la exposición (C-04). La primera parte necesita internet; la segunda, no.

### OFF-01 · Preparación con internet

- **Preparación:** laptop con Node.js instalado; proyecto copiado en una carpeta local que **no** esté en OneDrive, por ejemplo `C:\proyectos\AreaCalc` (con git: `git clone` y `git checkout avance-t04`; sin git: carpeta copiada sin `node_modules` ni `dist`).
- **Pasos:** en `cmd`:
  1. `cd /d C:\proyectos\AreaCalc`
  2. `node --version` (anote la versión; debe ser 22.12 o posterior, se recomienda 24).
  3. `npm ci`
  4. `npm test`
  5. `npm run build`
  6. `npm run verificar-dist`
- **Resultado esperado:** `npm ci` termina sin errores; `npm test` dice «Test Files 27 passed» y «Tests 1304 passed» (o el número vigente); el build termina con «built in …» (el aviso de 500 kB es normal); `verificar-dist` dice «Verificación de dist/ correcta: sin recursos externos en HTML ni CSS.».
- **Estado:** Pendiente
- **Observaciones y evidencia (versión de Node, problemas de Windows):**

### OFF-02 · Servidor local con el Wi-Fi apagado

- **Pasos:**
  1. Apague el Wi-Fi (y desconecte el cable de red si lo hay). Compruebe que una página externa no abre.
  2. En `cmd`, en la carpeta del proyecto: `npm run preview`.
  3. Abra la dirección que muestra la consola (normalmente `http://localhost:4173/`; si el puerto está ocupado, Vite usa otro y lo indica).
  4. F12 → Red → recargue.
- **Resultado esperado:** la aplicación se abre sin internet. En Red, todas las solicitudes son de `localhost` y ninguna falla, salvo quizá `favicon.ico`.
- **Si falla:** si PowerShell bloquea `npm`, use `cmd` o `npm.cmd run preview`. No abra `index.html` con doble clic: la aplicación se sirve con `npm run preview`.
- **Estado:** Pendiente
- **Observaciones y evidencia:**

### OFF-03 · Recorrido de exposición sin internet

- **Pasos:** con el Wi-Fi todavía apagado, haga MR-01, MR-02, MR-03 (con estimación) y MR-04. Fíjese en el tiempo entre pulsar Calcular y ver la gráfica. Tome una captura de cada caso para el documento académico (Windows: **Windows + Shift + S**).
- **Resultado esperado:** los mismos valores que en MR-01 a MR-04, con gráfica y fórmulas. Los resultados, incluida la gráfica, aparecen en menos de 1 segundo (R-21.2). Hay 4 capturas guardadas.
- **Estado:** Pendiente
- **Observaciones y evidencia (tiempos, nombres de las capturas):**

### OFF-04 · Cierre y contingencia

- **Pasos:** cierre el servidor con **Ctrl + C** en la ventana de `cmd`. Confirme que existe la copia de contingencia (design §13): `dist/` y el proyecto con `node_modules` en la segunda computadora, y las capturas en el documento.
- **Resultado esperado:** el servidor se detiene; la contingencia está lista.
- **Estado:** Pendiente
- **Observaciones y evidencia:**

## 11. Resumen de estados

Actualice esta tabla al terminar cada sesión. Un punto «Fallido» se informa al equipo con su observación; la corrección se decide aparte.

| Id. | Tema | Estado | Revisó / fecha |
|---|---|---|---|
| PREP-01 | Servir la versión construida | Pendiente | |
| PREP-02 | Navegador para la revisión | Pendiente | |
| MR-01 | CR-01 | Pendiente (parcial) | equipo, 22 oct |
| MR-02 | CR-02 | Pendiente (parcial) | equipo, 22 oct |
| MR-03 | CR-03 con estimación | Pendiente (parcial, vía selector) | equipo, 22 oct |
| MR-04 | CR-05 (textos corregidos después) | Pendiente (parcial) | equipo, 22 oct |
| FIG-01 | Rectángulo en m (CR-09) | Pendiente | |
| FIG-02 | Rectángulo en cm (CR-10) | **Aprobado** | equipo, 22 oct |
| FIG-03 | Triángulo y círculo | Pendiente (parcial) | equipo, 22 oct |
| FIG-04 | Medidas no válidas | Pendiente (parcial) | equipo, 22 oct |
| EST-01 | Estimación con el ejemplo simulado | Pendiente (parcial) | equipo, 22 oct |
| EST-02 | Estimación desde figura en cm | Pendiente (parcial) | equipo, 22 oct |
| EST-03 | Adicional 0 y círculo | Pendiente (evidencia relacionada) | |
| EST-04 | Errores de la estimación | Pendiente (parcial) | equipo, 22 oct |
| INV-01 | Editar perfil retira todo | Pendiente (parcial) | equipo, 22 oct |
| INV-02 | Interpretación y función | Pendiente | |
| INV-03 | Editar la figura fuente | Pendiente | |
| INV-04 | Editar precio o adicional | Pendiente | |
| INV-05 | Nada antiguo reaparece | Pendiente | |
| ERR-01 | Errores tras un resultado válido | Pendiente | |
| ERR-02 | Varios errores a la vez | Pendiente | |
| NAV-01 | Secciones y Atrás | Pendiente | |
| NAV-02 | «Usar esta área» y volver | Pendiente | |
| NAV-03 | Menú lateral | Pendiente | |
| NAV-04 | Ejemplos de Perfil | Pendiente | |
| NAV-05 | Ejemplos de Figuras | Pendiente | |
| NAV-06 | Recargar reinicia | Pendiente | |
| ACC-01 | Teclado en Perfil | Pendiente | |
| ACC-02 | Saltar, Figuras y Estimación con teclado | Pendiente | |
| ACC-03 | Zoom 200 % | Pendiente | |
| ACC-04 | 360 px | Pendiente | |
| ACC-05 | No solo color | Pendiente | |
| ACC-06 | Lector de pantalla (opcional) | Pendiente | |
| ACC-07 | Contraste ≥ 4.5:1 (R-23.4) | Pendiente | |
| FAL-01 | Plotly bloqueado | Pendiente | |
| FAL-02 | KaTeX bloqueado | Pendiente | |
| FAL-03 | Restauración | Pendiente | |
| OFF-01 | Preparación en la laptop (T-R5) | Pendiente | |
| OFF-02 | Servidor sin Wi-Fi (T-R5) | Pendiente | |
| OFF-03 | Recorrido sin Wi-Fi (T-R5) | Pendiente | |
| OFF-04 | Cierre y contingencia (T-R5) | Pendiente | |

T-R3 queda ejecutada cuando PREP-01 a FAL-03 tienen estado Aprobado o Fallido documentado; T-R5, cuando OFF-01 a OFF-04 lo tienen. Ejecutar no es aprobar: cada Fallido sigue abierto hasta que el equipo lo corrija (y se repita el punto) o lo acepte como limitación. Ninguna de las dos está terminada hoy: hay 1 punto aprobado de 41.
