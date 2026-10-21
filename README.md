# ÁreaCalc

Aplicación web estática para el curso de Cálculo Integral (Universidad Mariano Gálvez de Guatemala, Campus Jutiapa). Calcula el área bajo un perfil polinómico de grado ≤ 3, la integral con signo y el valor promedio; muestra la gráfica y el procedimiento, y da una estimación teórica de material y costo.

> **Estado:** base del proyecto creada y verificada en T-01 (véase «Estado de T-01»). El núcleo matemático de T-02 a T-07 (racionales exactos, polinomios, análisis de ceros, integral, valor promedio, área geométrica, lectura de números, errores, unidades, figuras y materiales) está implementado y probado. T-09 y T-10 añaden el analizador propio de las expresiones (`src/expresiones/`): convierte el texto de la función en un árbol sin ejecutarlo y lo normaliza a un polinomio exacto de grado ≤ 3, con su forma interpretada («x³ − 1»). Los casos de uso que unen todo (T-08) aún no existen. En la última ejecución, con T-10, `npm test` dio 766/766 en 16 archivos y `npm run build` fue correcto. Falta la revisión independiente de R. **Todavía no hay una aplicación funcional ni una interfaz terminada:** la página principal no calcula nada. Para continuar el trabajo, lea [`docs/RELEVO-KIRO.md`](docs/RELEVO-KIRO.md).

## Documentación

| Documento | Contenido |
|---|---|
| `.kiro/specs/areacalc/requirements.md` | Requisitos y casos de referencia |
| `.kiro/specs/areacalc/design.md` | Diseño técnico |
| `.kiro/specs/areacalc/tasks.md` | Plan de tareas |
| `docs/formulario-matematico.md` | Fórmulas y procedimientos del curso |
| `AGENTS.md` | Reglas para Codex |
| [`docs/RELEVO-KIRO.md`](docs/RELEVO-KIRO.md) | Estado actual y guía para continuar en otro chat o cuenta |

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

Mientras exista, la página temporal `prueba-recursos.html`, enlazada desde la página principal, comprueba Plotly y KaTeX.

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
