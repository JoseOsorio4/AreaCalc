// Comprueba la versión construida (T-01 y T-R5; design.md §13): que estén las
// páginas, que el HTML y el CSS no carguen recursos externos y que se hayan
// copiado las fuentes de KaTeX. Uso: npm run build y después npm run verificar-dist.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const DIST = 'dist';
const EXTERNO = /^(?:[a-z]+:)?\/\//i;

if (!existsSync(DIST)) {
  console.error('No existe la carpeta dist/. Ejecute antes: npm run build');
  process.exit(1);
}

function archivos(carpeta) {
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = join(carpeta, nombre);
    return statSync(ruta).isDirectory() ? archivos(ruta) : [ruta];
  });
}

const todos = archivos(DIST);
const problemas = [];

for (const pagina of ['index.html', 'prueba-recursos.html']) {
  if (!existsSync(join(DIST, pagina))) problemas.push(`Falta dist/${pagina}`);
}

for (const archivo of todos.filter((ruta) => extname(ruta) === '.html')) {
  const html = readFileSync(archivo, 'utf8');
  for (const [, url] of html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/g)) {
    if (EXTERNO.test(url)) problemas.push(`${archivo}: recurso externo ${url}`);
  }
}

for (const archivo of todos.filter((ruta) => extname(ruta) === '.css')) {
  const css = readFileSync(archivo, 'utf8');
  for (const [, url] of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
    if (EXTERNO.test(url.trim())) problemas.push(`${archivo}: recurso externo ${url}`);
  }
  for (const [, url] of css.matchAll(/@import\s+(?:url\()?\s*['"]?([^'")\s;]+)/g)) {
    if (EXTERNO.test(url)) problemas.push(`${archivo}: @import externo ${url}`);
  }
}

const fuentes = todos.filter((ruta) => /KaTeX_[\w-]+\.(?:woff2|woff|ttf)$/.test(ruta));
if (fuentes.length === 0) {
  problemas.push('No hay fuentes de KaTeX en dist/ (se esperaban archivos KaTeX_*.woff2).');
}

console.log(`Archivos en dist/: ${todos.length}; fuentes de KaTeX: ${fuentes.length}.`);
if (problemas.length > 0) {
  console.error('La verificación de dist/ falló:');
  for (const problema of problemas) console.error(`  - ${problema}`);
  process.exit(1);
}
console.log('Verificación de dist/ correcta: sin recursos externos en HTML ni CSS.');
