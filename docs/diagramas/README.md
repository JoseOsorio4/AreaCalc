# Diagramas de entrega

Archivos aportados por el equipo y copiados sin modificar el 30 de octubre de 2026:

| Archivo en esta carpeta | Procedencia |
|---|---|
| `AreaCalc_arquitectura.png` | `C:\Users\Brianita\Desktop\AreaCalc_arquitectura.png` |
| `AreaCalc_flujo.png` | `C:\Users\Brianita\Desktop\AreaCalc_flujo.png` |
| `AreaCalc_Diagrama_Flujo.drawio` | `C:\Users\Brianita\Desktop\AreaCalc_Diagrama_Flujo_nuevo (1).drawio` |

Los PNG se pueden consultar localmente; el archivo draw.io permite editar el diagrama. No son capturas de ejecución ni evidencia de pruebas manuales, de accesibilidad o sin internet. Su incorporación no aprueba T-R3 ni T-R5.

Para explicar las relaciones, prevalecen el código y `design.md` §2 y §4: los casos de uso llaman al núcleo, al analizador y a la presentación; las vistas reciben los pasos y datos de gráfica ya preparados; los adaptadores dibujan y no importan el núcleo. La flecha hacia el núcleo desde «Presentación de datos» representa su dependencia, no un recálculo del resultado. Las líneas de pruebas representan verificación, no dependencias de ejecución. La arquitectura se comprueba con `tests/arquitectura.test.js`.
