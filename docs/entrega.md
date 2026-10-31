# Entrega de ÁreaCalc · 30 de octubre de 2026

Paquete de código fuente para el espacio del curso. T-01 a T-17 están implementadas; las revisiones humanas abiertas se detallan en [revision-manual.md](revision-manual.md) y [RELEVO-KIRO.md](RELEVO-KIRO.md). El comentario de los compañeros sobre que les funcionó es verbal y no aporta evidencia suficiente para aprobar criterios nuevos.

## Instalación y ejecución

1. Extraiga el ZIP en una carpeta local, fuera de OneDrive. Abra una terminal en la carpeta `AreaCalc`, donde están `package.json` y `package-lock.json`.
2. Use Node.js 24 LTS (en este cierre: 24.22.0, npm 11.19.1) y un navegador moderno. Compruebe `node --version`.
3. Con internet, ejecute en `cmd`:

```bat
npm ci
npm test
npm run build
npm run verificar-dist
npm run preview
```

En PowerShell use `npm.cmd` en lugar de `npm` si la política de ejecución bloquea `npm.ps1`. `npm ci` respeta las versiones fijadas; no actualice las dependencias para la demostración.

Abra la dirección que muestra la consola, normalmente `http://localhost:4173/`. Mantenga la terminal abierta; `Ctrl+C` detiene el servidor. Si el puerto está ocupado, use la URL alternativa que imprime Vite o `npm run preview -- --port 4174`. Sirva la aplicación por HTTP local; no abra `index.html` con doble clic.

## Demostración local breve

Puede usar el selector de ejemplos para la explicación. Para completar la revisión formal, siga las entradas manuales y todos los criterios de la lista de revisión.

| Caso | Qué mostrar | Resultado esperado del formulario matemático |
|---|---|---|
| CR-01 | `x^3 - 1`, [1, 4], abstracto; integral y pasos | I = A_geo = 243/4 = 60.75 u²; promedio 81/4 = 20.25 u |
| CR-02 | `1 + x^2`, [-1, 2], físico; promedio y rectángulo | I = A_geo = 6 m²; promedio 2 m |
| CR-03 | `2 + x^2/4`, [0, 4], físico; usar como fuente, precio 50 y adicional 10 | 40/3 m²; promedio 10/3 m; 44/3 m²; Q666.67 y Q733.33 |
| CR-05 | `x`, [-1, 1], físico; regiones y bloqueo de estimación | I = 0, A_geo = 1 m², promedio 0; E-MOD-02 |

Muestre también el rectángulo de 100 × 200 cm (20000 cm² = 2 m²) y, tras un cálculo, edite un dato sin recalcular para explicar por qué se retiran sus resultados dependientes. Explique que Plotly dibuja datos calculados y que KaTeX mejora fórmulas con texto de respaldo. Los precios del ejemplo son simulados y la estimación no calcula cortes ni compras reales.

## Preparación de la exposición sin internet

El ZIP no contiene `node_modules/` ni `dist/`: **no basta llevarlo a una laptop sin preparar**. Instale y construya con internet en esa misma laptop antes de salir. Conserve allí las dependencias y el build; luego desactive el Wi-Fi y ejecute `npm run preview`.

El equipo debe completar OFF-01 a OFF-04: recorrer los cuatro casos, revisar la pestaña Red, registrar tiempos y capturas, y preparar una segunda computadora con las dependencias y el build. Debe comprobar también el proyector y completar los puntos de accesibilidad ACC-01 a ACC-07. Este cierre no hizo ese ensayo físico ni aprueba esos puntos.

## Comprobaciones de este cierre

Ejecutadas en `C:\Users\Brianita\Proyectos\AreaCalc-1`, Windows, Node 24.22.0 y npm 11.19.1. En PowerShell se usó `npm.cmd`.

| Comando solicitado | Resultado observado | Código de salida |
|---|---|---|
| `npm test` | 1307 pruebas correctas en 27 archivos, incluida arquitectura | 0 |
| `npm run build` | Build correcto; aviso esperado de fragmento > 500 kB por Plotly | 0 |
| `npm run verificar-dist` | 65 archivos y 59 fuentes KaTeX; sin recursos externos en HTML ni CSS | 0 |

La verificación de recursos examina HTML y CSS; no es una prueba física de la laptop ni una revisión manual de accesibilidad. El recorrido automático anterior de T-17 se conserva como antecedente en [verificacion-integracion.md](verificacion-integracion.md); no se atribuye a este cierre.

## Contenido y trazabilidad del ZIP

Destino: `C:\Users\Brianita\Proyectos\AreaCalc-entrega-2026-10-30\AreaCalc-entrega.zip`, fuera del repositorio. Carpeta raíz del paquete: `AreaCalc/`.

- `src/`, `index.html`: código fuente comentado y estilos.
- `tests/`: casos de referencia, pruebas matemáticas, de integración y arquitectura.
- `package.json`, `package-lock.json`, `vite.config.js` y `scripts/`: dependencias fijadas y comandos.
- `README.md`, `AGENTS.md`, `.gitignore`, `.kiro/specs/areacalc/` y `docs/`: instrucciones, especificaciones, formulario y registros de revisión.
- `docs/diagramas/`: arquitectura y flujo en PNG y flujo editable en draw.io, con procedencia.

Se exportan los archivos versionados del commit de cierre con `git archive`. Se compara el inventario contra ese commit, se extrae en una carpeta nueva y se compara cada archivo mediante SHA-256 con su contenido versionado. El resultado, SHA del commit, tamaño y SHA-256 del ZIP se guardan en `VERIFICACION.txt`, al lado del ZIP, fuera del repositorio.

Quedan excluidos `.git/`, `node_modules/`, `dist/`, registros, temporales y credenciales. No se sube el ZIP al respaldo de Git; los diagramas sí forman parte de la documentación versionada. T-R1, T-R3, T-R4, T-R5 y T-R6 no se marcan terminadas por preparar este paquete.
