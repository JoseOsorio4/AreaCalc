# ÁreaCalc

Aplicación web estática para el curso de Cálculo Integral (Universidad Mariano Gálvez de Guatemala, Campus Jutiapa). Calcula el área bajo un perfil polinómico de grado ≤ 3, la integral con signo y el valor promedio; muestra la gráfica y el procedimiento, y da una estimación teórica de material y costo.

> **Estado de entrega (30 de octubre de 2026):** T-01 a T-17 implementadas y probadas. Perfil, Figuras y Estimación integran cálculos exactos, procedimientos, gráfica con Plotly, fórmulas con KaTeX y catálogo de ejemplos. La apariencia aprobada por el equipo se conserva. El cierre solo añade comentarios necesarios al código y actualiza la documentación y los diagramas.

Comprobaciones de este cierre: `npm test` **1307/1307 en 27 archivos**, `npm run build` y `npm run verificar-dist`, los tres con **código de salida 0**. La verificación de `dist/` encontró 65 archivos y 59 fuentes de KaTeX, sin recursos externos en HTML ni CSS. El aviso de tamaño del fragmento de Plotly es esperado. Detalle y demostración: [`docs/entrega.md`](docs/entrega.md).

Los compañeros comunicaron verbalmente que la aplicación les funcionó; **no hay capturas ni reporte completo que respalden ese comentario**. No aprueba criterios formales: T-R3 sigue parcial (solo FIG-02 aprobado en el registro del 22 de octubre), ACC-01 a ACC-07 y OFF-01 a OFF-04 pendientes. No se ha probado físicamente la laptop de exposición sin internet en este cierre. T-R1, T-R4 y T-R6 también conservan sus pendientes humanos. Consulte [`docs/revision-manual.md`](docs/revision-manual.md) y [`docs/RELEVO-KIRO.md`](docs/RELEVO-KIRO.md).

## Documentación

| Documento | Contenido |
|---|---|
| `.kiro/specs/areacalc/requirements.md` | Requisitos y casos de referencia |
| `.kiro/specs/areacalc/design.md` | Diseño técnico |
| `.kiro/specs/areacalc/tasks.md` | Plan de tareas |
| `docs/formulario-matematico.md` | Fórmulas y procedimientos del curso |
| `AGENTS.md` | Reglas para Codex |
| [`docs/RELEVO-KIRO.md`](docs/RELEVO-KIRO.md) | Estado actual y guía para continuar en otro chat o cuenta |
| [`docs/verificacion-integracion.md`](docs/verificacion-integracion.md) | Comprobaciones de T-17, resultados, limitaciones y pendientes del equipo |
| [`docs/revision-manual.md`](docs/revision-manual.md) | Lista de revisión manual (T-R2) para T-R3 y el ensayo sin internet de T-R5 |

Los diagramas aportados por el equipo están en [`docs/diagramas/`](docs/diagramas/README.md): arquitectura y flujo en PNG, más el flujo editable en draw.io.

El ZIP de entrega se prepara fuera del repositorio, en `C:\Users\Brianita\Proyectos\AreaCalc-entrega-2026-10-30\AreaCalc-entrega.zip`; contiene las fuentes, pruebas, configuración, especificaciones y documentación, sin dependencias instaladas ni build. Instrucciones: [`docs/entrega.md`](docs/entrega.md).

## Requisitos

- Node.js 22.12 o posterior; se recomienda 24 LTS, la versión usada en T-01. Vite 8.3.4 admite Node 20.19+ o 22.12+, pero Vitest 5.0.5 exige 22.12+, 24 o 26+. Compruébelo con `node --version`.
- Un navegador moderno.
- Internet solo para instalar las dependencias. Después, la versión construida funciona sin conexión.

## Instalación inicial (ya hecha en T-01)

T-01 instaló las cuatro dependencias aprobadas con estos comandos, que fijaron sus versiones exactas en `package.json` y `package-lock.json`:

```
npm install --save-dev --save-exact vite vitest
npm install --save-exact plotly.js-basic-dist-min katex
npm ls --depth=0
```

No los repita: instalarían las versiones más recientes y cambiarían el lock. En una copia nueva use `npm ci`. `npm ls --depth=0` debe mostrar solo los cuatro paquetes de «Versiones instaladas».

## Comandos

| Comando | Uso |
|---|---|
| `npm ci` | Instala exactamente lo que fija `package-lock.json` (en otra computadora, con internet) |
| `npm test` | Ejecuta las pruebas una sola vez |
| `npm run build` | Construye la versión final en `dist/` |
| `npm run verificar-dist` | Comprueba que `dist/` no cargue recursos externos y que incluya las fuentes de KaTeX |
| `npm run preview` | Sirve `dist/` en `http://localhost:4173` o en el puerto que indique la consola |
| `npm run dev` | Servidor de desarrollo |

No abra `index.html` con doble clic: la aplicación se sirve con `npm run preview`.

## Funcionamiento sin internet (ensayo y exposición)

1. Con internet: `npm ci`, `npm test`, `npm run build` y `npm run verificar-dist`.
2. Desactive el Wi-Fi.
3. Ejecute `npm run preview` y abra la dirección que muestra la consola.
4. En las herramientas de desarrollo del navegador (pestaña Red), recargue y compruebe que ningún recurso externo falla.

En Windows, use el Símbolo del sistema (`cmd`), porque PowerShell puede bloquear `npm.ps1` (en la computadora de A la política es `Restricted`). En PowerShell también funciona `npm.cmd`, por ejemplo `npm.cmd run preview`. Evite carpetas sincronizadas como OneDrive.

Para comprobar Plotly y KaTeX sin conexión, calcule CR-03 desde el selector de ejemplos de Perfil: deben verse la gráfica y las fórmulas del procedimiento. La página temporal `prueba-recursos.html` de T-01 se retiró en T-17.

## Copiar el proyecto a otra computadora

Copie la carpeta del proyecto **sin** `node_modules/` ni `dist/` y ejecute `npm ci` con internet.

## Versiones instaladas

| Elemento | Versión |
|---|---|
| Node.js | 24.22.0 (npm 11.19.1) |
| vite | 8.3.4 |
| vitest | 5.0.5 |
| plotly.js-basic-dist-min | 4.1.2 |
| katex | 0.19.0 |

El fragmento minificado de Plotly ocupa unos 1.16 MB. Al cerrar T-01 se actualizaron las referencias de versiones de `design.md` (§0, §13 y §20), que mencionaban Vite 7, Vitest con Node 20 y Plotly 3.x.

## Limitaciones conocidas

- Solo polinomios en x de grado ≤ 3.
- Los perfiles físicos usan metros en ambos ejes.
- La estimación de material es teórica: no calcula cortes, láminas ni compras reales.

## Estado de T-01

| Comprobación | Estado (20 de octubre) |
|---|---|
| Archivos base | Creados en el entorno de Kiro Web; conservados sin cambios |
| Instalación de dependencias | Correcta en la computadora de A (en Kiro Web, npm respondía HTTP 403). `npm ls --depth=0` muestra solo los cuatro paquetes y `npm audit` no encontró vulnerabilidades. |
| `npm test` | Correcto: 1 archivo y 6 pruebas |
| `npm run build` | Correcto. El aviso por el tamaño del fragmento de Plotly es esperado (design §13). |
| `npm run verificar-dist` | Correcto: 66 archivos, sin recursos externos en HTML ni CSS. Hay 59 fuentes de KaTeX en `dist/assets`; la restante, de menos de 4 KB, va incrustada en el CSS. |
| Página de prueba, comprobación automática | Correcta: con `npm run preview`, Edge sin interfaz y con el acceso externo bloqueado informó que KaTeX y Plotly dibujaron sin errores. La gráfica contiene el relleno, dos formas y la anotación. No comprueba la apariencia. |
| Página de prueba, revisión visual | Correcta, revisada por A en el navegador: la fórmula, el área sombreada, el rectángulo y la línea del promedio se ven bien. La pestaña Red muestra 9 solicitudes de la página y de sus recursos, sin fallos ni recursos externos; los 304 son respuestas de caché. |

T-01 quedó marcada como completada en `tasks.md`. El punto 5 de la página, con el Wi-Fi apagado, corresponde a T-R5.
