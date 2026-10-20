# ÁreaCalc

Aplicación web estática para el curso de Cálculo Integral (Universidad Mariano Gálvez de Guatemala, Campus Jutiapa). Calcula el área bajo un perfil polinómico de grado ≤ 3, la integral con signo y el valor promedio; muestra la gráfica y el procedimiento, y da una estimación teórica de material y costo.

> **Estado:** base del proyecto creada (T-01). La aplicación todavía no tiene funciones. La instalación de dependencias, las pruebas y el build están **pendientes de verificar**: el registro npm no fue accesible desde el entorno de Kiro Web (véase «Estado de T-01»).

## Documentación

| Documento | Contenido |
|---|---|
| `.kiro/specs/areacalc/requirements.md` | Requisitos y casos de referencia |
| `.kiro/specs/areacalc/design.md` | Diseño técnico |
| `.kiro/specs/areacalc/tasks.md` | Plan de tareas |
| `docs/formulario-matematico.md` | Fórmulas y procedimientos del curso |
| `AGENTS.md` | Reglas para Codex |

## Requisitos

- Node.js compatible con la versión de Vite que se instale. Vite 7 exige Node 20.19+ o 22.12+; compruébelo con `node --version`.
- Un navegador moderno.
- Internet solo para instalar las dependencias. Después, la versión construida funciona sin conexión.

## Instalación inicial (una sola vez, T-01)

Estos comandos instalan las cuatro dependencias aprobadas y fijan sus versiones exactas en `package.json` y `package-lock.json`:

```
npm install --save-dev --save-exact vite vitest
npm install --save-exact plotly.js-basic-dist-min katex
npm ls --depth=0
```

`npm ls` debe mostrar solo esos cuatro paquetes. Anote las versiones en «Versiones instaladas».

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

En Windows, use el Símbolo del sistema (`cmd`), porque PowerShell puede bloquear `npm.ps1`. Evite carpetas sincronizadas como OneDrive.

Mientras exista, la página temporal `prueba-recursos.html`, enlazada desde la página principal, comprueba Plotly y KaTeX.

## Copiar el proyecto a otra computadora

Copie la carpeta del proyecto **sin** `node_modules/` ni `dist/` y ejecute `npm ci` con internet.

## Versiones instaladas

| Elemento | Versión |
|---|---|
| Node.js | pendiente |
| vite | pendiente |
| vitest | pendiente |
| plotly.js-basic-dist-min | pendiente |
| katex | pendiente |

## Limitaciones conocidas

- Solo polinomios en x de grado ≤ 3.
- Los perfiles físicos usan metros en ambos ejes.
- La estimación de material es teórica: no calcula cortes, láminas ni compras reales.

## Estado de T-01

| Comprobación | Estado (20 de octubre) |
|---|---|
| Archivos base | Creados en el entorno de Kiro Web |
| Sintaxis de los archivos JavaScript (`node --check`) | Correcta en Kiro Web |
| Lógica de `tests/arquitectura.test.js` | Revisada en Kiro Web con un sustituto mínimo de Vitest: 6 de 6 comprobaciones correctas y 5 fallos detectados con infracciones deliberadas. **No sustituye a `npm test`.** |
| Instalación de dependencias | Pendiente: el registro npm respondió HTTP 403 |
| `npm test` | Pendiente |
| `npm run build` y `npm run verificar-dist` | Pendientes |
| Página de prueba de Plotly y KaTeX | Pendiente |

El programador A ejecuta los pasos pendientes en su computadora (`tasks.md`, T-01):

1. Los comandos de «Instalación inicial».
2. Anotar las versiones en «Versiones instaladas».
3. `npm test`, `npm run build` y `npm run verificar-dist`.
4. `npm run preview` y la comprobación visual de `prueba-recursos.html`.

T-01 se marca como completada solo cuando estos pasos pasen y se hayan revisado sus resultados.
