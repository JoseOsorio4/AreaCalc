# Formulario matemático de ÁreaCalc

> **Estado:** v0.4. Aprobado como base del diseño el 19 de octubre de 2026, con las confirmaciones del equipo incorporadas (véase `requirements.md` §16). La v0.3 añadió el teorema de las raíces racionales (§2.1, punto 5) y CR-31. La v0.4 añade la parte primitiva y el presupuesto de D-09, y los casos CR-32, CR-35 y CR-36. · **Fecha:** 19 de octubre de 2026
> **Función del documento:** fuente canónica de definiciones, fórmulas, condiciones y casos académicos. `requirements.md`, `design.md` y `tasks.md` deben coincidir con él; cualquier contradicción se corrige aquí primero.

## 0. Fuentes, etiquetas y notación

### 0.1 Fuentes

| Id. | Fuente | Contenido |
|---|---|---|
| P1-A | PDF, pág. 1, pizarra superior | «Valor medio para integrales», ejemplo 1: 1 + x² en [−1, 2] |
| P1-B | PDF, pág. 1, pizarra en rojo | Enunciado del teorema del valor medio para integrales |
| P1-C | PDF, pág. 1, pizarra inferior izquierda | Lista de 4 ejercicios de valor medio (sin resolver) |
| P1-D | PDF, pág. 1, cuaderno | «Resolver los ejercicios sobre áreas», ej. 1: x³ − 1 |
| P2-A | PDF, pág. 2, recuadro rojo | «Fórmulas originales» de x̄ y ȳ |
| P2-B | PDF, pág. 2, pizarra superior derecha | Centroide de la región entre y = −√x e y = −x²/8: planteamiento y área |
| P2-C | PDF, pág. 2, pizarra inferior | «Centros de masa»: desarrollo de x̄ |
| PC | Prompt consolidado del equipo | Alcance, fórmulas y casos (citado como PC §n) |
| CP | Comprobación propia de Kiro | Cálculo independiente; **no** aparece en las fotografías |
| CE | Confirmación del equipo, 19 de octubre de 2026 | Correcciones de lectura C-07 y C-08, y regla de costos C-09 |
| MP | «Markdown pegado.md» (fuente histórica) | Mencionado como adjunto, pero no recibido. Si contradice las confirmaciones, prevalecen estas. Su costo de Q666.50 es erróneo (§7.2). |

El PDF contiene solo fotografías y se revisó visualmente. Las lecturas dudosas de la v0.1 ya fueron confirmadas por el equipo. No se reconstruye contenido ilegible.

### 0.2 Etiquetas

- **[Apuntes]**: visible en el PDF. **[Equipo]**: decidido en el PC. **[CP]**: comprobación propia.
- **[Propuesta]**: propuesta pendiente de aprobación. **[Pendiente]**: decisión abierta.

### 0.3 Notación y convenciones

| Símbolo | Significado | Unidad abstracta | Perfil físico |
|---|---|---|---|
| x | posición horizontal | u | m |
| f(x) | altura o valor de la función | u | m |
| a, b | límites del intervalo, con a < b | u | m |
| F(x) | antiderivada de f | u² | m² |
| I | integral con signo (área neta) | u² | m² |
| A_geo | área geométrica total | u² | m² |
| f_prom | valor promedio de f | u | m |
| p | precio por metro cuadrado | — | Q/m² |
| w | adicional de material sobre el área útil | — | % |

- ∫[a,b] f(x) dx: integral definida de a a b. [F(x)] de a a b significa F(b) − F(a).
- «=» indica valor exacto; «≈» indica aproximación redondeada.
- Punto decimal. Intervalos cerrados [a, b] con a < b finitos.
- Los valores negativos sustituidos se escriben entre paréntesis: (−1)³ = −1, mientras que −1⁴ = −(1⁴) = −1.

---

## 1. Integral definida

**Fórmula (teorema fundamental del cálculo, regla de Barrow):**

I = ∫[a,b] f(x) dx = F(b) − F(a), donde F′(x) = f(x).

**Condiciones:** f real y continua en [a, b]; a y b finitos; a < b. Los polinomios son continuos en todo ℝ, por lo que la condición se cumple siempre dentro de la familia admitida del MVP.

**Reglas deterministas para polinomios** (las únicas que usa el MVP):

| Regla | Fórmula |
|---|---|
| Constante | ∫ k dx = k·x |
| Potencia (n entero ≥ 0) | ∫ xⁿ dx = xⁿ⁺¹/(n + 1) |
| Linealidad | ∫ [α·f(x) + β·g(x)] dx = α∫ f(x) dx + β∫ g(x) dx |

**Constante de integración.** En una integral definida la constante se cancela: [F(b) + C] − [F(a) + C] = F(b) − F(a). Por eso **ningún resultado definido ni valor promedio lleva «+C»**.

**Límites invertidos.** Matemáticamente ∫[a,b] f = −∫[b,a] f, pero ÁreaCalc rechaza a ≥ b y no reordena los límites [Equipo, PC §7.4 caso 8], porque el área y el promedio se definen aquí para a < b.

**Grados internos.** La entrada admite grado ≤ 3 [Propuesta]. Las operaciones derivadas aumentan el grado: la antiderivada llega a grado 4; en la fase de centroides, x·f(x) llega a 4, [f(x)]² a 6 y sus antiderivadas a 7. La representación interna debe admitirlos sin ampliar la entrada.

---

## 2. Integral con signo y área geométrica

**Definiciones:**

- Integral con signo: I = ∫[a,b] f(x) dx. Las partes bajo el eje restan.
- Área geométrica total: A_geo = ∫[a,b] |f(x)| dx. Todas las partes suman.

Si f⁺ = máx(f, 0) y f⁻ = máx(−f, 0), entonces I = ∫f⁺ − ∫f⁻ y A_geo = ∫f⁺ + ∫f⁻. Por tanto:

- A_geo ≥ 0 y A_geo ≥ |I|.
- Si f(x) ≥ 0 en todo [a, b], A_geo = I.
- Si f(x) ≤ 0 en todo [a, b], A_geo = −I.
- **|I| no sustituye en general a A_geo**: solo coinciden si f no cambia de signo.

**Procedimiento cuando f cambia de signo:**

1. Hallar los ceros de f en [a, b].
2. Clasificarlos:
   - *Cero interior con cambio de signo* (raíz simple o de multiplicidad impar): divide el intervalo.
   - *Cero interior sin cambio de signo* (raíz doble, tangencia): la gráfica toca el eje sin cruzarlo; no es necesario dividir.
   - *Cero en un extremo*: no divide el intervalo.
3. Formar los tramos a = r₀ < r₁ < … < rₙ = b con los ceros que cambian el signo.
4. Calcular Iₖ = F(rₖ) − F(rₖ₋₁) en cada tramo; el signo de f es constante en cada uno.
5. A_geo = |I₁| + |I₂| + … + |Iₙ|.

**Exactitud de los ceros [CP].** Un cero racional puede comprobarse exactamente evaluando el polinomio. Un cero irracional (p. ej., √2) solo puede localizarse de forma aproximada; entonces A_geo es aproximada y debe rotularse así, aunque I y f_prom sigan siendo exactos. El teorema de las raíces racionales (§2.1, punto 5) permite reconocer exactamente **todo** cero racional, aunque no sea entero ni tenga denominador potencia de 2, como 1/3.

En un polinomio de grado ≤ 3 con coeficientes racionales, **toda raíz múltiple es racional**: si una raíz doble r fuese irracional, su conjugada también sería raíz doble y el polinomio tendría grado ≥ 4. Por eso las tangencias de esta familia pueden detectarse exactamente.

**Muestrear algunos puntos no demuestra ausencia de raíces.** El método de análisis de signo que usa ÁreaCalc (design.md §8) se apoya en los cinco resultados de §2.1.

### 2.1 Base matemática del análisis de ceros [CP]

1. **Teorema de Bolzano.** Si f es continua en [l, h] y f(l)·f(h) < 0, existe un c ∈ (l, h) con f(c) = 0. Partir el intervalo por la mitad repetidamente (bisección) reduce a la mitad el intervalo que contiene la raíz.

2. **Teorema de Sturm.** Sea f un polinomio. Su sucesión de Sturm es:
   - p₀ = f;
   - p₁ = f′;
   - pₖ₊₁ = −(residuo de dividir pₖ₋₁ entre pₖ), hasta obtener residuo cero.

   Sea V(t) el número de cambios de signo de la sucesión p₀(t), p₁(t), … (ignorando ceros). Si l < h y ninguno es raíz de f, el número de raíces reales **distintas** de f en (l, h] es exactamente V(l) − V(h).

   Solo usa sumas, productos y divisiones de polinomios con coeficientes racionales, más evaluaciones en números racionales, todo exacto. Para grado ≤ 3, la sucesión tiene como máximo 4 polinomios.

   *Ejemplo:* para x² − 2 en [0, 2], la sucesión es x² − 2, 2x, 2.
   - En t = 0 los signos son (−, 0, +): 1 cambio de signo.
   - En t = 2 los signos son (+, +, +): 0 cambios.
   - V(0) − V(2) = 1: hay exactamente una raíz en (0, 2], que es √2.

3. **Multiplicidad.** Las raíces múltiples de f son las raíces de mcd(f, f′). En esta familia siempre son racionales (§2).
   - Una raíz de multiplicidad par (doble) **no** cambia el signo: es una tangencia.
   - Una de multiplicidad impar (simple o triple) **sí** lo cambia. Por ejemplo, (x − 1)³ cambia de signo en x = 1.

4. **Cota de error de un corte aproximado.** Supongamos que una raíz r con cambio de signo solo se conoce dentro de [l, h] y se corta en el punto medio r̃, de modo que |r̃ − r| ≤ δ = (h − l)/2. Entonces el área calculada difiere de A_geo como máximo en

   M₁·δ², con M₁ = máx |f′(x)| en [l, h].

   Justificación: la franja mal asignada entre r y r̃ tiene una integral S que cumple |S| ≤ M₁·δ²/2, porque |f(x)| ≤ M₁·|x − r|. Asignarla al tramo equivocado cambia la suma de valores absolutos en, como mucho, 2|S|.

5. **Teorema de las raíces racionales.** Si el polinomio de coeficientes enteros aₙxⁿ + … + a₁x + a₀ tiene una raíz racional r = p/q, escrita como fracción irreducible, entonces q divide a aₙ (y p divide a a₀).

   Para un f con coeficientes racionales, se multiplica por el mínimo común múltiplo L de sus denominadores y se divide L·f entre el mcd de sus coeficientes enteros, lo que da su **parte primitiva**. A es el valor absoluto del coeficiente principal de esa parte primitiva. Entonces **A·r es entero** para toda raíz racional r. Al dividir entre el mcd, un factor común no agranda A: 10⁶⁰(x³ − 2) tiene A = 1.

   **Prueba de racionalidad.** Si una raíz está sola en (l, h) y h − l < 1/A, el intervalo (A·l, A·h) mide menos de 1 y contiene a lo sumo un entero k. Basta evaluar f(k/A) de forma exacta:
   - si vale 0, la raíz es exactamente k/A;
   - si no, o si no hay ningún entero en el intervalo, la raíz es irracional.

   *Ejemplo:* (x − 1/3)(x² + 1) = x³ − x²/3 + x − 1/3 tiene L = 3, así que 3x³ − x² + 3x − 1 da A = 3.
   - Su única raíz real está en (0, 1). Dos bisecciones dan el intervalo (1/4, 1/2), de ancho 1/4 < 1/3.
   - (A·l, A·h) = (3/4, 3/2) contiene solo el entero k = 1, y f(1/3) = 0: la raíz es exactamente 1/3.

   *Ejemplo:* x² − 2 tiene A = 1, así que una raíz racional tendría que ser entera.
   - Dos bisecciones aíslan la raíz en (1, 3/2), de ancho 1/2 < 1.
   - El intervalo (1, 3/2) no contiene ningún entero, así que la raíz es irracional, como se sabe de √2.

   En una ecuación de primer grado no hace falta la prueba: la raíz de c₁x + c₀ es exactamente −c₀/c₁.

   **Presupuesto (D-09):** la prueba necesita unas log₂((b − a)·A) bisecciones. ÁreaCalc admite como máximo 200 (design.md §8, paso 6). Si A es tan grande que no alcanzan, la respuesta es E-SIS-01, nunca una raíz «aproximada» que podría ser racional (CR-33, CR-34).

### Ejemplos

| Caso | I | A_geo | f_prom | Observación | Fuente |
|---|---|---|---|---|---|
| x en [−1, 1] | 0 | 1 | 0 | cambio de signo en x = 0; tramos de −1/2 y 1/2 | PC §6.2 |
| x³ − x en [−2, 2] | 0 | 5 | 0 | ceros −1, 0, 1; tramos 9/4, 1/4, 1/4, 9/4 | CP |
| x² − 2 en [0, 2] | −4/3 | (8√2 − 4)/3 ≈ 2.4379 | −2/3 | cero irracional √2 ≈ 1.414214; A_geo aproximada | CP |
| (x − 1)² en [0, 2] | 2/3 | 2/3 | 1/3 | tangencia en x = 1, sin cambio de signo | PC §7.4 |
| −2 en [0, 3] | −6 | 6 | −2 | negativa en todo el intervalo; A_geo = −I | PC §7.4 |
| x − 1/3 en [0, 1] | 1/6 | 5/18 ≈ 0.2778 (exacta) | 1/6 | cero racional no entero 1/3, reconocido exactamente (CR-31) | CP |

Desarrollo de x en [−1, 1], con F(x) = x²/2:

```
Tramo [−1, 0]:  F(0) − F(−1) = 0 − 1/2 = −1/2   →  |−1/2| = 1/2
Tramo [0, 1]:   F(1) − F(0)  = 1/2 − 0 = 1/2
A_geo = 1/2 + 1/2 = 1 u²        I = −1/2 + 1/2 = 0        f_prom = 0/2 = 0
```

Desarrollo de x − 1/3 en [0, 1], con F(x) = x²/2 − x/3 y el cero exacto r = 1/3:

```
F(0) = 0     F(1/3) = 1/18 − 1/9 = −1/18     F(1) = 1/2 − 1/3 = 1/6
Tramo [0, 1/3]:  F(1/3) − F(0)   = −1/18           →  |−1/18| = 1/18
Tramo [1/3, 1]:  F(1) − F(1/3)   = 1/6 + 1/18 = 4/18 = 2/9
A_geo = 1/18 + 4/18 = 5/18 u²     I = −1/18 + 4/18 = 1/6     f_prom = (1/6)/1 = 1/6
```

---

## 3. Valor promedio de una función

**Fórmula [Apuntes P1-A, P1-B; Equipo PC §6.3]:**

f_prom = [1/(b − a)] · ∫[a,b] f(x) dx = I/(b − a)

**Condiciones:** f continua en [a, b], a < b.

**Reglas:**

- Usa la **integral con signo**. No se reemplaza por A_geo/(b − a) cuando f cambia de signo: en x sobre [−1, 1], f_prom = 0 aunque A_geo = 1.
- Tiene las unidades de f(x): si f es una altura en metros, f_prom es una altura en metros. El área está en unidades cuadradas.
- Área e integral comparten el mismo cálculo de I: f_prom se obtiene dividiendo esa I.

**Rectángulo equivalente.** Si f(x) ≥ 0 en todo [a, b]:

A_geo = I = (b − a) · f_prom

El rectángulo de base b − a y altura f_prom tiene exactamente el área de la región. La igualdad con el área geométrica **requiere no negatividad**.

**Teorema del valor medio para integrales [Apuntes P1-B].** Si f es continua en [a, b], existe al menos un c ∈ [a, b] tal que f(c) = f_prom. La fotografía escribe «debe existir tal que»; falta nombrar c, aunque la fórmula f(c) lo usa. El MVP **no** calcula c [Equipo].

*Nota didáctica [CP]:* en el ejemplo de clase, 1 + c² = 2 da c = 1 y c = −1; ambos están en [−1, 2], así que c no tiene por qué ser único.

---

## 4. Procedimiento de clase: área bajo y = x³ − 1 en [1, 4] (P1-D)

### 4.1 Lo que muestra la fotografía [Apuntes]

- Enunciado: «Calcular el área bajo la curva y = x³ − 1 en el intervalo (1, 4)». En esta letra, el «1» tiene un trazo parecido a un «7». La tabla confirma la lectura x³ − 1, porque y(2) = 7 e y(4) = 63.
- Tabla de valores para x = 1, 2, 3 y 4, y un bosquejo de la curva.
- Integral ∫[1,4] (x³ − 1) dx, antiderivada x⁴/4 − x, evaluación y resultado 243/4 = **60.75 u²**, resaltado.

### 4.2 Procedimiento que debe mostrar ÁreaCalc

```
1. Datos:            f(x) = x³ − 1,  [a, b] = [1, 4],  unidades abstractas (u, u²)
2. Análisis de signo: f(1) = 0 (cero en el extremo) y f(x) > 0 para 1 < x ≤ 4
                     → f(x) ≥ 0 en [1, 4], así que A_geo = I
3. Planteamiento:    A = ∫[1,4] (x³ − 1) dx
4. Antiderivada:     F(x) = x⁴/4 − x            (regla de la potencia y linealidad)
5. Límite superior:  F(4) = 4⁴/4 − 4 = 256/4 − 4 = 64 − 4 = 60
6. Límite inferior:  F(1) = 1⁴/4 − 1 = 1/4 − 1 = −3/4
7. Resta:            A = F(4) − F(1) = 60 − (−3/4) = 240/4 + 3/4 = 243/4
8. Resultado:        A = 243/4 u² = 60.75 u²
9. Interpretación:   la región entre la curva y el eje X en [1, 4] mide 60.75 u²; gráfica coherente
```

Valor promedio del mismo caso [CP]: f_prom = (243/4)/3 = 81/4 = 20.25 u.

### 4.3 Observaciones y correcciones

| Ubicación | Aparece | Corrección o comentario |
|---|---|---|
| Enunciado | intervalo «(1, 4)» | Escribir [1, 4]. Para una función continua el valor no cambia, pero la integral definida se plantea sobre un intervalo cerrado. |
| Tabla, x = 3 | «27» | 3³ − 1 = **26**. El equipo confirmó que fue un error del apunte [CE]. No afecta la integral; solo un punto del bosquejo. |
| Evaluación | primer corchete [1⁴/4 − 1] tachado | Es una corrección del propio desarrollo; el resultado final es correcto. |
| Evaluación | «[64 − 4] [−1/4 + 1]», sin operador | Dos corchetes yuxtapuestos se leen como producto. Escribir [64 − 4] + [−1/4 + 1] o F(4) − F(1). |
| Evaluación | «−1⁴/4» | Es correcto como −(1⁴/4), pero se confunde con (−1)⁴. Escribir −(1⁴/4) o −F(1). |
| Resultado | 60 + 3/4 = 243/4 = 60.75 u² | Correcto. La función es no negativa en [1, 4], así que la integral coincide con el área. |

---

## 5. Procedimiento de clase: valor promedio de f(x) = 1 + x² en [−1, 2] (P1-A)

### 5.1 Lo que muestra la fotografía [Apuntes]

```
f_prom = 1/(2 − (−1)) ∫[−1,2] (1 + x²) dx
f_prom = 1/3 ∫[−1,2] (1 + x²) dx
f_prom = 1/3 (x + x³/3) evaluada de −1 a 2
f_prom = 1/3 [2 + 2³/3] − [(−1) + (−1)³/3]
f_prom = 1/3 [2/1 + 8/3] − 1/3 [−1/1 − 1/3]
f_prom = 1/3 [(6 + 8)/3] − 1/3 [(−3 − 1)/3]
f_prom = [14/9] + [4/9]
f_prom = 18/9
f_prom = 2      (rodeado, con una flecha hacia «+C»)
```

También aparece un bosquejo de la parábola.

### 5.2 Procedimiento que debe mostrar ÁreaCalc

Para que el área y el promedio compartan el mismo cálculo, ÁreaCalc calcula primero I y después divide [Propuesta]. El resultado es idéntico al de la pizarra, donde 1/3 se distribuye antes de restar.

```
1. Datos:            f(x) = 1 + x²,  [a, b] = [−1, 2]
2. Fórmula:          f_prom = [1/(b − a)] · ∫[a,b] f(x) dx
3. Sustitución:      f_prom = [1/(2 − (−1))] · ∫[−1,2] (1 + x²) dx = (1/3) · ∫[−1,2] (1 + x²) dx
4. Antiderivada:     F(x) = x + x³/3
5. Límite superior:  F(2) = 2 + 2³/3 = 2 + 8/3 = 14/3
6. Límite inferior:  F(−1) = (−1) + (−1)³/3 = −1 − 1/3 = −4/3
7. Integral:         I = F(2) − F(−1) = 14/3 − (−4/3) = 18/3 = 6
8. Promedio:         f_prom = (1/3) · 6 = 2
9. Unidades:         I = 6 u² (área, porque f > 0); f_prom = 2 u. Sin «+C».
```

Equivalencia con la pizarra: (1/3)(14/3) − (1/3)(−4/3) = 14/9 + 4/9 = 18/9 = 2.

Como f(x) = 1 + x² > 0, A_geo = I = 6. En la interpretación física (metros) es un perfil válido: A = 6 m² y altura promedio 2 m. **Las coordenadas negativas de x son posiciones, no dimensiones negativas** [Equipo PC §7.2].

### 5.3 Correcciones

| Ubicación | Aparece | Corrección |
|---|---|---|
| Resultado | «f_prom = 2» con «+C» | Eliminar «+C». Un valor promedio y una integral definida son números; la constante se cancela en F(b) − F(a). |
| 4.ª línea | «1/3 [2 + 2³/3] − [(−1) + (−1)³/3]» | El factor 1/3 multiplica toda la diferencia: (1/3){[2 + 2³/3] − [(−1) + (−1)³/3]}. La línea siguiente lo corrige al distribuir 1/3. |
| P1-B | «debe existir tal que» | «debe existir c ∈ [a, b] tal que f(c) = f_prom». |

---

## 6. Ejercicios propuestos en la pizarra (P1-C, sin resolver en las fotos)

Los enunciados son [Apuntes]; los resultados son [CP]. Todas las funciones son positivas o no negativas en su intervalo, así que I = A_geo.

| N.º | Enunciado (lectura) | I | f_prom | Observación |
|---|---|---|---|---|
| 1 | f(x) = x² en «(1, 3)» | 26/3 ≈ 8.6667 | 13/3 ≈ 4.3333 | Intervalo escrito con paréntesis; usar [1, 3]. |
| 2 | y = 3x² en «(1, 4)» | 63 | 21 | Ídem: usar [1, 4]. |
| 3 | y = 5x − x² en [0, 5] | 125/6 ≈ 20.8333 | 25/6 ≈ 4.1667 | Ceros en ambos extremos; f ≥ 0. |
| 4 | f(x) = 5x³ − 2 en [2, 5] (lectura confirmada [CE]) | 3021/4 = 755.25 | 1007/4 = 251.75 | f(2) = 38 > 0, así que f > 0 en el intervalo. |

---

## 7. Caso práctico simulado (PC §7.3)

**Modelo [Equipo]:** perfil de una pieza con **ambos ejes en metros**: f(x) = 2 + x²/4 en [0, 4]. Los coeficientes pertenecen al modelo dimensional elegido: 2 está en m y 1/4 en 1/m, de modo que x²/4 queda en m. Todos los datos son **simulados**.

### 7.1 Área, altura promedio y rectángulo equivalente

```
Análisis de signo:  f(x) ≥ 2 > 0 en [0, 4]  →  perfil físico válido, A_geo = I
Antiderivada:       F(x) = 2x + x³/12
F(4) = 8 + 64/12 = 8 + 16/3 = 40/3          F(0) = 0
A = 40/3 m² ≈ 13.3333 m²
f_prom = (40/3)/4 = 10/3 m ≈ 3.3333 m
Rectángulo equivalente: 4 m × 10/3 m = 40/3 m²   (misma área)
```

*Nota didáctica [CP], no requerida por el MVP:* la altura promedio se alcanza en c = 4/√3 ≈ 2.3094 m.

### 7.2 Material y costo (precio simulado Q50/m², adicional w = 10 %)

```
Área útil:          A_geo = 40/3 m²
Costo base:         (40/3) × 50 = 2000/3 ≈ Q666.67
Área estimada:      (40/3) × 1.10 = (40/3) × (11/10) = 44/3 m² ≈ 14.6667 m²
Costo estimado:     (44/3) × 50 = 2200/3 ≈ Q733.33
```

**Redondeo prematuro (incorrecto):**

| Procedimiento erróneo | Resultado | Correcto |
|---|---|---|
| 13.33 × 50 | Q666.50 | Q666.67 |
| 13.33 × 1.10 × 50 | Q733.15 | Q733.33 |
| 14.67 × 50 | Q733.50 | Q733.33 |

Regla: calcular con los valores exactos y redondear **una sola vez**, al presentar [CE, C-09].

La fuente histórica MP registra Q666.50. Ese valor proviene de redondear el área a 13.33 m² antes de multiplicar y queda **sustituido** por Q666.67 (costo base) y Q733.33 (costo estimado).

### 7.3 Por qué no basta un solo rectángulo (comparación didáctica [CP])

Esta comparación sustenta el «problema identificado». Ilustra sobrestimaciones y subestimaciones, pero **no** constituye una afirmación de ahorro.

| Aproximación con una sola altura | Altura usada | Área | Diferencia con 40/3 |
|---|---|---|---|
| Altura mínima f(0) | 2 m | 8 m² | −40 % |
| Altura en el punto medio f(2) | 3 m | 12 m² | −10 % |
| Altura máxima f(4) | 6 m | 24 m² | +80 % |
| Altura promedio f_prom | 10/3 m | 40/3 m² | 0 % (por definición) |

### 7.4 Cambiar de unidad exige transformar el modelo [CP]

Si las mismas medidas se expresan en centímetros (X = 100x, Y = 100y), el modelo se convierte en Y = 200 + X²/400 en [0, 400]. Su área es 400000/3 cm² ≈ 133333.33 cm² = 40/3 m², el mismo valor.

En cambio, si solo se cambiara la etiqueta «m» por «cm» sin transformar el modelo, se obtendrían 40/3 cm², un resultado 10 000 veces menor. Por eso el MVP limita los perfiles físicos a metros [Propuesta, aceptada como posible por el PC §10.1].

---

## 8. Figuras geométricas (complemento)

Son fórmulas directas: **no requieren integración** [Equipo PC §6.4].

| Figura | Fórmula | Datos | Condición |
|---|---|---|---|
| Rectángulo | A = b × h | base b, altura h | b > 0, h > 0 |
| Triángulo | A = (b × h)/2 | base b, altura h perpendicular a la base | b > 0, h > 0 |
| Círculo | A = π r² | radio r | r > 0 |
| Trapecio (deseable) | A = [(B + b) × h]/2 | bases paralelas B y b, altura h | B > 0, b > 0, h > 0 |

**Unidades:** todas las dimensiones de una figura se ingresan en la misma unidad (cm o m) [Propuesta].

- Longitudes: 1 m = 100 cm (conversión lineal).
- Áreas: 1 m² = 100² cm² = 10 000 cm² (conversión con el cuadrado del factor).
- Para aplicar un precio por m², el área se convierte primero a m².

**Exactitud:** rectángulo, triángulo y trapecio dan resultados racionales exactos. El círculo da k·π con k racional, que es exacto; su decimal es una aproximación.

| Caso | Resultado | Fuente |
|---|---|---|
| Rectángulo 4 m × 2 m | 8 m² | PC §7.4 caso 6 |
| Rectángulo 100 cm × 200 cm | 20 000 cm² = 2 m² | PC §7.4 caso 7 |
| Triángulo b = 4 m, h = 3 m | 6 m² | CP |
| Círculo r = 5 m | 25π m² ≈ 78.5398 m² | CP |
| Trapecio B = 6 m, b = 4 m, h = 2 m | 10 m² | CP |

**Comprobación cruzada con el analizador [CP]:** f(x) = 2 en [0, 4] m da 8 m², como el rectángulo 4 × 2. f(x) = (3/4)x en [0, 4] m da 6 m², como el triángulo b = 4 y h = 3.

---

## 9. Materiales y costo teórico

| Concepto | Definición | ¿Lo calcula el MVP? |
|---|---|---|
| Área geométrica útil | A_útil = A_geo de un perfil físico válido, o el área de una figura, en m² | Sí |
| Área con adicional estimado | A_estimada = A_útil × (1 + w/100) | Sí |
| Material realmente comprado | Depende del ancho del rollo, del tamaño de las láminas, del formato comercial, de los márgenes y de la distribución de cortes | **No** |
| Costo base | Costo_base = A_útil × p | Sí |
| Costo estimado | Costo_estimado = A_estimada × p | Sí |

**Condiciones [Equipo PC §10]:**

- Solo con áreas físicas en m². No se asigna precio a u².
- **Nunca** con la integral con signo.
- Un perfil solo es presupuestable si f(x) ≥ 0 en todo [a, b]. Si cambia de signo o es negativo, se conserva el análisis académico, pero no se emite el presupuesto.
- p ≥ 0 y w ≥ 0. Precio cero y adicional cero son válidos.
- w es un **adicional sobre el área útil**, no un porcentaje de pérdida medido sobre lo comprado. Por ejemplo, w = 10 % produce 1.10 × A_útil.
- No se incluyen mano de obra, impuestos, márgenes comerciales, número de láminas ni litros de pintura.
- Se calcula con valores exactos y se redondea a centavos una sola vez, al presentar.

---

## 10. Centroides de regiones planas (fase posterior)

**Prioridad:** fase posterior al MVP [Equipo PC §5.3]. Se documentan ahora para que el diseño las contemple, pero su implementación no bloquea la entrega.

### 10.1 Región bajo una sola función no negativa [Apuntes P2-A, «Fórmulas originales»]

Región R = {(x, y): a ≤ x ≤ b, 0 ≤ y ≤ f(x)}

A = ∫[a,b] f(x) dx
x̄ = (1/A) · ∫[a,b] x · f(x) dx
ȳ = (1/(2A)) · ∫[a,b] [f(x)]² dx

**Hipótesis:** f continua, **f(x) ≥ 0** en [a, b], la región está sobre el eje X y **A > 0**. Si A = 0, el centroide no está definido.

**Unidades:** x̄ en las unidades de x; ȳ en las de y (u o m).

**Origen de la fórmula de ȳ [CP].** Una franja vertical de ancho dx tiene área f(x)·dx y su centroide está a la altura f(x)/2. Por tanto ȳ = (1/A)∫ [f(x)/2]·f(x) dx = (1/(2A))∫ [f(x)]² dx.

**Interpretación:** el centroide es una propiedad geométrica. Coincide con el centro de masa de una lámina de **densidad superficial uniforme**. No se usa para recomendar soportes ni para evaluar la seguridad estructural.

**Grados internos:** con f de grado ≤ 3, x·f(x) tiene grado ≤ 4 y [f(x)]² grado ≤ 6; sus antiderivadas llegan a grado 5 y 7.

### 10.2 Casos de referencia para la fase posterior

| Región | A | x̄ | ȳ | Fuente |
|---|---|---|---|---|
| f(x) = 2 en [0, 4] m (rectángulo 4 × 2) | 8 m² | 2 m | 1 m | PC §7.4 caso 6 |
| f(x) = x² en [0, 3] | 9 u² | 9/4 = 2.25 u | 27/10 = 2.7 u | CP |
| f(x) = 2 + x²/4 en [0, 4] m | 40/3 m² | 12/5 = 2.4 m | 47/25 = 1.88 m | CP |
| f(x) = 0 en [0, 4] | 0 | no definido | no definido | PC §7.4 caso 5 |

---

## 11. Ejemplo de clase: centroide entre dos curvas bajo el eje X (P2-B, P2-C)

### 11.1 Planteamiento [Apuntes]

«Hallar el centroide de la región encerrada por las curvas y = −√x, y = −x²/8». La gráfica muestra ambas curvas debajo del eje X entre x = 0 y x = 4, con una franja vertical sombreada en rojo.

- Curva superior: u(x) = −x²/8. Curva inferior: l(x) = −√x.
- Se cortan en x = 0 (ambas valen 0) y en x = 4 (ambas valen −2).
- En [0, 4], u(x) ≥ l(x). Por ejemplo, en x = 1: u = −1/8 y l = −1.

### 11.2 Fórmulas adaptadas a una región entre dos curvas

Región R = {(x, y): a ≤ x ≤ b, l(x) ≤ y ≤ u(x)}, con u ≥ l:

A = ∫[a,b] [u(x) − l(x)] dx
x̄ = (1/A) · ∫[a,b] x · [u(x) − l(x)] dx
ȳ = (1/(2A)) · ∫[a,b] [u(x)² − l(x)²] dx

La franja vertical tiene altura u − l y su centroide está en y = (u + l)/2; de ahí sale (u + l)(u − l)/2 = (u² − l²)/2. Estas fórmulas valen aunque las curvas estén bajo el eje. El caso de una sola función es u = f y l = 0.

### 11.3 Área [Apuntes P2-B, desarrollo fotografiado]

```
A = ∫[0,4] [−x²/8 − (−√x)] dx = ∫[0,4] [−x²/8 + x^(1/2)] dx
A = [−(1/8)(1/3)x³ + (2/3)x^(3/2)] de 0 a 4         (el término en x = 0 vale 0)
A = −(1/24)(64) + (2/3)(8) = −64/24 + 16/3 = −8/3 + 16/3 = 8/3
```

### 11.4 Coordenada x̄ [Apuntes P2-C, desarrollo fotografiado]

```
x̄ = (3/8) ∫[0,4] x[−x²/8 + x^(1/2)] dx = (3/8) ∫[0,4] [−x³/8 + x^(3/2)] dx
x̄ = (3/8) [−(1/32)x⁴ + (2/5)x^(5/2)] de 0 a 4
x̄ = (3/8) [−(1/32)(256) + (2/5)(32)] = (3/8) [−8 + 64/5] = −3 + 24/5 = 9/5
```

La pizarra usa el integrando adaptado x(u − l), aunque el recuadro «Fórmulas originales» está escrito para una sola f.

### 11.5 Coordenada ȳ [CP, no fotografiada]

Las fotografías muestran la fórmula de ȳ, pero **no su desarrollo** para este ejemplo.

```
u² = x⁴/64        l² = (−√x)² = x        u² − l² = x⁴/64 − x   (≤ 0 en [0, 4])
∫[0,4] (x⁴/64 − x) dx = [x⁵/320 − x²/2] de 0 a 4 = 1024/320 − 8 = 16/5 − 8 = −24/5
ȳ = (1/(2 · 8/3)) · (−24/5) = (3/16) · (−24/5) = −9/10
```

**Centroide: (9/5, −9/10) = (1.8, −0.9).** La coordenada Y negativa es coherente porque la región está bajo el eje. Además, en x = 1.8 el punto queda entre l ≈ −1.342 y u = −0.405.

### 11.6 Por qué no se aplica sin adaptar la fórmula de una sola función

Si se tomara f = u − l = √x − x²/8 (que es ≥ 0) y se aplicara ȳ = (1/(2A))∫ f² dx, se obtendría:

∫[0,4] (√x − x²/8)² dx = 8 − 64/7 + 16/5 = 72/35, y entonces ȳ = (3/16)(72/35) = **27/70 ≈ 0.386**. Es positivo y **erróneo**: corresponde a la región trasladada entre y = 0 e y = u − l, no a la región original.

x̄ coincide en ambos casos porque solo depende de la altura de cada franja (u − l), no de su posición vertical.

### 11.7 Estado

Es una referencia académica. Requiere √x, que está fuera de la familia del MVP, y una región entre dos curvas, que es una calculadora excluida del MVP [Equipo PC §5.4]. Documentarlo **no** autoriza a añadir esa calculadora.

---

## 12. Comparación numérica (ampliación posterior, opcional)

**Trapecios compuestos:** con h = (b − a)/n y xᵢ = a + i·h,

Tₙ = h · [ (f(x₀) + f(xₙ))/2 + f(x₁) + … + f(xₙ₋₁) ]

Su error es −(b − a)·h²·f″(ξ)/12 para algún ξ en [a, b]. En el caso práctico f″ = 1/2 es constante, así que Tₙ − 40/3 = 8/(3n²) exactamente [CP]:

| n | Tₙ (m²) | Error respecto de 40/3 |
|---|---|---|
| 1 | 16 | +8/3 ≈ 2.6667 |
| 2 | 14 | +2/3 ≈ 0.6667 |
| 4 | 13.5 | +1/6 ≈ 0.1667 |
| 8 | 13.375 | +1/24 ≈ 0.0417 |

**Simpson** (n par) es **exacta para polinomios de grado ≤ 3**. Por ejemplo, S₂ = (2/3)[f(0) + 4f(2) + f(4)] = (2/3)(20) = 40/3. Por eso, en esta familia no ilustra un error de aproximación.

Una comparación se limita a las funciones admitidas, se rotula como aproximación y no se presenta como garantía universal.

---

## 13. Resumen de casos de comprobación

Los identificadores coinciden con `requirements.md` §14.

| Id. | Entrada | Resultado esperado | Fuente |
|---|---|---|---|
| CR-01 | x³ − 1, [1, 4] | I = A_geo = 243/4 = 60.75 u²; f_prom = 81/4 = 20.25 u | P1-D; f_prom CP |
| CR-02 | 1 + x², [−1, 2] | I = A_geo = 6; f_prom = 2 | P1-A; PC §7.2 |
| CR-03 | 2 + x²/4, [0, 4] m; Q50/m²; w = 10 % | A = 40/3 m²; f_prom = 10/3 m; Q666.67; 44/3 m²; Q733.33 | PC §7.3 |
| CR-04 | x², [0, 3] | 9; f_prom = 3 | PC §7.4 |
| CR-05 | x, [−1, 1] | I = 0; A_geo = 1; f_prom = 0 | PC §6.2 |
| CR-06 | −2, [0, 3] | I = −6; A_geo = 6; f_prom = −2; sin presupuesto | PC §7.4 |
| CR-07 | (x − 1)², [0, 2] | 2/3; f_prom = 1/3; tangencia en x = 1 | PC §7.4 |
| CR-08 | 0, [0, 4] | 0; 0; 0; centroide no definido | PC §7.4 |
| CR-09 | rectángulo 4 m × 2 m | 8 m²; centroide futuro (2, 1) m | PC §7.4 |
| CR-10 | rectángulo 100 cm × 200 cm | 20 000 cm² = 2 m² | PC §7.4 |
| CR-14 | x³ − x, [−2, 2] | I = 0; A_geo = 5; f_prom = 0 | CP |
| CR-15 | x² − 2, [0, 2] | I = −4/3; A_geo ≈ 2.4379 (aprox.); f_prom = −2/3 | CP |
| CR-18 | ejercicios de P1-C | ver §6 | P1-C; CP |
| CR-19 | triángulo, círculo y trapecio de §8 | 6 m²; 25π ≈ 78.5398 m²; 10 m² | CP |
| CR-24 | centroides de §10.2 | ver §10.2 | PC; CP |
| CR-25 | entre dos curvas, §11 | A = 8/3; x̄ = 9/5; ȳ = −9/10 | P2-B, P2-C; ȳ CP |
| CR-26 | comparación numérica, §12 | T₁ = 16, T₂ = 14, T₄ = 13.5; S₂ = 40/3 | CP |
| CR-28 | (x − 1/3)(x − 2)(x + 1), [0, 3] | ceros 1/3 y 2; I = 11/4; A_geo = 5923/972 ≈ 6.0936; f_prom = 11/12 | CP |
| CR-29 | (x − 1)³, [0, 2] | cero triple que cambia de signo; I = 0; A_geo = 1/2; f_prom = 0 | CP |
| CR-30 | (x − 1)²(x + 2), [−3, 2] | cambio de signo en −2 y tangencia en 1; I = 5/4; A_geo = 59/4; f_prom = 1/4 | CP |
| CR-31 | x − 1/3, [0, 1] | cero exacto 1/3 con cambio de signo; I = 1/6; A_geo = 5/18 exacta; f_prom = 1/6 | CP |
| CR-32 | (0.000001x)³, [−1, 1] | cero triple exacto en 0; I = 0; A_geo = 1/(2·10¹⁸); f_prom = 0 | CP |
| CR-35 | 10⁶⁰(x − 1/3)(x² + 1), [0, 1] | cero exacto 1/3 (A = 3 por la parte primitiva); I = 10⁶⁰·11/36; A_geo = 10⁶⁰·407/972 | CP |
| CR-36 | 10¹²⁶(x³ − 2), [0, 2] | ∛2 irracional; I = 0; A_geo = 3·∛2·10¹²⁶, aproximada con la cota obtenida (W-04) | CP |

Los casos de validación, rechazo e invalidación (CR-11 a CR-13, CR-16, CR-17, CR-20 a CR-23, CR-33 y CR-34) están en `requirements.md` §14.

---

## 14. Registro de correcciones a los apuntes

| N.º | Ubicación | Aparece | Corrección | Impacto |
|---|---|---|---|---|
| 1 | P1-A | «+C» junto a f_prom = 2 | Eliminar: los resultados definidos no llevan constante | Conceptual; el valor 2 es correcto |
| 2 | P1-A | 1/3 [ … ] − [ … ] sin agrupar | (1/3){[…] − […]} | Notación; la línea siguiente lo corrige |
| 3 | P1-B | «debe existir tal que» | «existe c ∈ [a, b] tal que» | Enunciado incompleto |
| 4 | P1-C, P1-D | intervalos «(1, 3)», «(1, 4)» | [1, 3], [1, 4] | Notación; el valor no cambia |
| 5 | P1-D | tabla: x = 3 → 27 | 26 (confirmado por el equipo) | Solo afecta un punto del bosquejo |
| 6 | P1-D | [64 − 4] [−1/4 + 1] | [64 − 4] + [−1/4 + 1] | Notación; el resultado es correcto |
| 7 | P1-D | −1⁴/4 | −(1⁴/4) | Ambigüedad con (−1)⁴ |
| 8 | P2-A, P2-C | «Fórmulas originales» para una sola f aplicadas a dos curvas | Usar las fórmulas adaptadas (§11.2) | x̄ = 9/5 es correcto porque se usó x(u − l); ȳ requiere u² − l² |
| 9 | P2 | No se muestra el desarrollo de ȳ | ȳ = −9/10 (CP) | No atribuirlo a las fotografías |
| 10 | P2-B | Título «centros de masa» para un centroide | Equivalen solo con densidad uniforme | Interpretación |
