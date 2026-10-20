# Reglas para Codex en ÁreaCalc

Este archivo resume `design.md` §18 y se aplica a todo el repositorio. Si hay dudas, prevalecen las especificaciones.

## Antes de cada tarea

1. Leer `.kiro/specs/areacalc/requirements.md`, `.kiro/specs/areacalc/design.md`, `.kiro/specs/areacalc/tasks.md` y `docs/formulario-matematico.md`.
2. Implementar **solo** la tarea autorizada de `tasks.md`, de una en una. No empezar la siguiente sin autorización del equipo.
3. No modificar las especificaciones. Si algo las contradice, detenerse e informar al equipo del cambio propuesto.

## Dependencias y seguridad

- Dependencias permitidas: `vite`, `vitest`, `plotly.js-basic-dist-min` y `katex`, instaladas con `--save-exact`. Ninguna otra sin aprobación.
- Prohibido: `eval`, `new Function`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, CDN, fuentes remotas y `Number` para resultados exactos.
- Solo se redondea en `src/presentacion/formato.js`.
- Respetar las dependencias entre carpetas de `design.md` §2. `tests/arquitectura.test.js` debe pasar.

## Pruebas

- Cada función del núcleo lleva pruebas. Los valores esperados salen de `tests/casos-referencia.js`, nunca del código bajo prueba.
- Antes de entregar una tarea para revisión: `npm test` y `npm run build`.

## Control de versiones

- Por ahora no hay commits ni PR: el revisor revisa los cambios en la copia local.
- Si el equipo los autoriza: una rama por tarea, un PR hacia `main` y mensajes de commit en español con el identificador de la tarea, por ejemplo «T-04: análisis de ceros con Sturm».

## Estilo

- Identificadores y comentarios en español, sin tildes ni «ñ» en los nombres.
- JSDoc `@typedef` para los contratos de `design.md` §10.
- Funciones puras en `src/nucleo/`.

## Reparto de carpetas (design.md §16)

- **Programador A:** `src/nucleo/`, `src/casos-de-uso/`, la configuración del proyecto, `scripts/`, `tests/nucleo/`, `tests/casos-de-uso/`, `tests/propiedades.test.js` y `tests/arquitectura.test.js`.
- **Programador B:** `src/expresiones/`, `src/presentacion/`, `src/interfaz/`, `src/adaptadores/`, `src/ejemplos/`, `src/estilos/` y sus pruebas.
- Dos asistentes no editan a la vez el mismo archivo.

## Archivos temporales

- `prueba-recursos.html` y `src/prueba-recursos.js` existen solo para comprobar T-01. Se eliminan en T-17, junto con su entrada en `vite.config.js` y la comprobación correspondiente de `scripts/verificar-dist.js`.
