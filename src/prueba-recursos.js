// Página temporal de T-01 (tasks.md): comprueba que Plotly y KaTeX funcionan
// empaquetados localmente, sin internet. No forma parte de la aplicación y se
// elimina en T-17, junto con su entrada en vite.config.js.

const estado = document.getElementById('estado');

/** Añade una línea de resultado como texto, sin interpretar HTML. */
function informar(texto, correcto) {
  const linea = document.createElement('li');
  linea.className = correcto ? 'correcto' : 'fallo';
  linea.textContent = `${correcto ? 'Correcto' : 'Fallo'}: ${texto}`;
  estado.append(linea);
}

async function probarKatex() {
  const contenedor = document.getElementById('formula');
  try {
    const { default: katex } = await import('katex');
    await import('katex/dist/katex.min.css');
    katex.render('\\int_{1}^{4} (x^3 - 1)\\,dx = \\frac{243}{4}', contenedor, {
      throwOnError: true,
      trust: false,
      output: 'htmlAndMathml'
    });
    informar('KaTeX dibujó la fórmula. Compruebe la tipografía (punto 1).', true);
  } catch (error) {
    informar(`KaTeX no pudo dibujar la fórmula: ${error.message}`, false);
  }
}

async function probarPlotly() {
  const contenedor = document.getElementById('grafica');
  try {
    const modulo = await import('plotly.js-basic-dist-min');
    const Plotly = modulo.default ?? modulo;
    const x = Array.from({ length: 41 }, (_, i) => i / 10);
    const y = x.map((valor) => 2 + (valor * valor) / 4);
    const promedio = 10 / 3;
    await Plotly.newPlot(
      contenedor,
      [{ x, y, type: 'scatter', mode: 'lines', fill: 'tozeroy', name: 'f(x) = 2 + x²/4' }],
      {
        title: { text: 'Relleno, rectángulo, línea y anotación' },
        xaxis: { title: { text: 'x (m)' } },
        yaxis: { title: { text: 'f(x) (m)' } },
        shapes: [
          {
            type: 'rect', x0: 0, x1: 4, y0: 0, y1: promedio,
            line: { dash: 'dash', width: 2 }, fillcolor: 'rgba(0, 0, 0, 0)'
          },
          { type: 'line', x0: 0, x1: 4, y0: promedio, y1: promedio, line: { dash: 'dot', width: 2 } }
        ],
        annotations: [{ x: 3, y: promedio, text: 'f_prom = 10/3 m', showarrow: true }]
      },
      { responsive: true, displaylogo: false, displayModeBar: false }
    );
    informar('Plotly dibujó la gráfica sin errores. Compruebe los puntos 2 a 4.', true);
  } catch (error) {
    informar(`Plotly no pudo dibujar la gráfica: ${error.message}`, false);
  }
}

informar(`Página servida desde ${window.location.origin}.`, true);
probarKatex();
probarPlotly();
