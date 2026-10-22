# Verificación de la integración (T-17)

Registro de las comprobaciones de T-17 hechas el 22 de octubre de 2026 en la computadora de trabajo (Windows, Node 24.22.0). **No sustituye** la revisión manual de R (T-R2 y T-R3) ni el ensayo en la laptop de exposición sin internet (T-R5).

## 1. Punto de partida

- Rama `avance-t04`. La sesión anterior dejó el respaldo parcial `b43108b` («WIP T-17»), encima de `e6b9623` (T-16). Se revisó su diff completo (22 archivos) y se conservó.
- Ya integrado en `b43108b`: pasos en los tres casos de uso, `datosGrafica` en `analizarPerfil`, W-02/W-03/W-04 con `formato.js`, adaptador de Plotly y precarga en `main.js`, KaTeX tras cada repintado con un W-08 por sección, selectores de ejemplos de Perfil y Figuras, retirada de `prueba-recursos.*`.
- Completado en el cierre de T-17:
  - nota de origen bajo cada selector de ejemplos («Origen: Caso práctico simulado. El precio y el adicional que se copian a Estimación son simulados…», R-13.1 y R-13.4) y rótulo «Datos simulados» en el formulario de Estimación mientras el precio y el adicional son los del ejemplo (desaparece al editarlos);
  - contención de números y fórmulas muy largos: `.tarjeta` usa una columna `minmax(0, 1fr)`. El CSS del respaldo no bastaba: con `(((1000000^3)^3)^3)^3` la página medía 7206 px de ancho a 1366 px;
  - pruebas de la nota de origen (11), comentario desactualizado en `tests/ejemplos/ejemplos.test.js`, contratos de design §10, README, `tasks.md` y el relevo.

## 2. Comandos

| Comando | Resultado | Código de salida |
|---|---|---|
| `npm.cmd test` | 27 archivos, **1304/1304** pruebas (antes del cierre: 1293/1293) | 0 |
| `npm.cmd run build` | Correcto; solo el aviso esperado por el tamaño de Plotly (design §13) | 0 |
| `npm.cmd run verificar-dist` | 65 archivos en `dist/`, 59 fuentes de KaTeX, sin recursos externos en HTML ni CSS | 0 |

La salida se redirigió a archivos temporales y se leyó la línea `CODIGO_SALIDA` (relevo §9).

## 3. Recorrido en el navegador

**Cómo:** build servido con `vite preview` en `http://127.0.0.1:4173`, Chrome 155 sin interfaz, guion temporal por el protocolo de DevTools (fuera del repositorio, ya borrado). Toda solicitud a un host distinto de `127.0.0.1` o `localhost` se interceptaba y se hacía fallar, y se registraba. Se revisaron además capturas de pantalla completas de cada estado.

| Comprobación | Observado |
|---|---|
| Solicitudes externas | **Ninguna** en ningún escenario (10 u 11 solicitudes en todo el recorrido de escritorio: página, JS y CSS principales, Plotly, KaTeX con su CSS y fuentes, y favicon, todas locales); la aplicación funcionó con todo lo externo bloqueado. Sin `unhandledrejection` ni errores de consola salvo los avisos esperados de los escenarios con bloqueo. |
| Página temporal de T-01 | Sin enlace a `prueba-recursos.html` |
| Precarga de Plotly | El fragmento `plotly-basic.min-*.js` se pidió al terminar la carga, antes de calcular |
| CR-01 (escrito a mano, Intro en b) | 243/4 u² (= 60.75), 243/4 u², 81/4 u (= 20.25); W-03 en x = 1; 15 pasos, «F(4) = 4⁴/4 − 4 = 64 − 4 = 60», ningún «+C»; gráfica con leyenda «Sobre el eje (+)», ceros y recta «f_prom = 81/4 u»; E-MOD-01 con el botón deshabilitado; foco en «Resultados» |
| CR-02 (selector) | Campos rellenados (`1 + x^2`, −1, 2, físico); 6 m², 6 m², 2 m; equivalencia con la pizarra en el paso de división; banda apta; «Origen: Ejercicio de clase.» |
| CR-03 (selector) | 40/3 ≈ 13.3333 m², rectángulo 4 × 10/3; estimación con **Q666.67** y **Q733.33**, 44/3 ≈ 14.6667 m², W-05 en los supuestos y pasos «2000/3 ≈ Q666.67» y «2200/3 ≈ Q733.33» con KaTeX; rótulo de datos simulados en el formulario |
| CR-05 (escrito a mano) | 0 m² y 1 m² con «Distinta de A_geo» / «Distinta de I»; W-01; tramos −1/2 y 1/2; leyenda «Bajo el eje (−)» y «Sobre el eje (+)», trama en la región negativa; E-MOD-02 |
| W-02, W-03 y W-04 | «x = 1» (CR-07), «x = −1» con «−» U+2212 en (x + 1)² en [−2, 0], «x = −1/2» en x + 1/2 en [−0.5, 1], «cota de error ≤ 6·10⁻²⁵» (CR-15) |
| Figuras | Rectángulo 4 × 2 m → 8 m²; círculo r = 5 m → 25π ≈ 78.5398 m²; CR-10 por el selector → 20000 cm² y 2 m², paso de conversión 20000/10 000; «Usar esta área» lleva a Estimación (Q100.00 y Q110.00 con 50 y 10 escritos a mano, sin W-05) |
| Entradas inválidas tras un cálculo válido | Vacío → E-EXP-01; `y + 1` → E-EXP-03; b = `Infinity` → E-NUM-03; a > b → E-INT-02 (a y b marcados); `x^4` → E-EXP-10. En todos: `aria-invalid`, sin resultados, sin gráfica («No se muestra la gráfica de un cálculo anterior»), sin pasos ni fórmulas, foco en el resumen |
| Invalidación al editar | Editar b tras CR-03 + estimación: sin resultado, figura sin lienzo, detalles vacíos, sin fuente ni estimación. Editar una figura retira su resultado y el ejemplo elegido vuelve a «Elija un ejemplo…» |
| Trabajo asíncrono antiguo | Cargar CR-03 y editar b en el mismo turno: 2.5 s después, ningún lienzo de Plotly, ninguna fórmula KaTeX, ningún W-08 |
| Valores muy largos | `(((1000000^3)^3)^3)^3` en [0, 1]: 490 caracteres en la cifra, sin perder dígitos; W-07 en la lista y en la figura; 15 pasos; ancho de página = ancho visible (1351 px y 360 px) y ningún elemento sale de su tarjeta. Las fórmulas KaTeX largas se desplazan dentro de su línea |
| Menú lateral y ancho | Gráfica de 559/509 px → 710/660 px al contraer y de vuelta a 559/509 al expandir. Contraído con la sección oculta, la gráfica se ajustó (710/660) al volver a Perfil |
| 360 px (emulación móvil) | Sin desplazamiento horizontal en Perfil vacío, con CR-03, con el número largo, en Estimación y en Figuras con resultado y con error; gráfica de 302 px. Panel del menú: `aria-expanded`, velo, contenido `inert`, foco al enlace actual; Escape lo cierra y devuelve el foco al botón |
| Teclado | Tab: saltar → 3 enlaces → contraer menú → selector de ejemplos → interpretación → f(x) → a → b → Calcular, todos con contorno de 3 px (la interpretación lo dibuja en su tarjeta). Flecha abajo en el selector carga CR-01 y lleva el foco a «Resultados» |
| Plotly bloqueado | La precarga y cada dibujo fallan; la figura muestra «Gráfica no disponible» y W-07; resultados, 15 pasos y fórmulas KaTeX visibles. Un segundo cálculo (CR-05) lo reintenta y vuelve a mostrar W-07 |
| KaTeX (JS y CSS) bloqueado | Pasos y función en texto Unicode («F(4) = 4⁴/4 − 4 = 64 − 4 = 60»); un solo W-08 en Perfil y uno en Figuras; editar lo retira; recalcular lo vuelve a mostrar una sola vez; la gráfica se dibuja |
| Tiempo (R-21.2, esta computadora) | Con Plotly precargado: resultados en 9–61 ms, gráfica en 56–183 ms, fórmulas en 56–260 ms (CR-01, CR-02, CR-03 y CR-05, dos vueltas) |

Las capturas de pantalla completas muestran el menú lateral y la barra móvil desplazados hacia abajo: es un efecto de capturar más allá de la ventana con elementos `sticky`, no de la página.

## 4. Limitaciones

- Chrome sin interfaz en la computadora de trabajo, con la red externa bloqueada por el guion: no equivale a apagar el Wi-Fi en la laptop de exposición.
- No se usaron lectores de pantalla ni zoom del navegador, y el contraste no se volvió a medir (T-14 midió 4.81:1 como mínimo; T-17 no cambió colores).
- Los tiempos son de esta computadora; R-21.2 se confirma en la laptop.
- Las fórmulas KaTeX que no caben se desplazan en horizontal dentro de su línea; con teclado, ese desplazamiento depende de que el navegador enfoque contenedores desplazables.

## 5. Pendientes del equipo

- **T-R2 y T-R3:** lista y recorrido manual completos (teclado, 360 px, contraste, lectores de pantalla, invalidación, Plotly y KaTeX bloqueados desde las herramientas de desarrollo).
- **T-R5:** ensayo en la laptop con `npm ci`, `npm run build`, `npm run preview`, el Wi-Fi apagado y CR-01, CR-02, CR-03 y CR-05; capturas para el documento.
- **T-R1 y T-R6:** revisión de los casos de referencia y de los cambios de T-02 a T-17, incluidas las decisiones de `docs/RELEVO-KIRO.md` §7.
