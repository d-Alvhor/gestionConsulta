// Ensambla app/src/{index.html, styles.css, core.js, ui.js} en un único fichero: node app/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = f => readFileSync(join(here, 'src', f), 'utf8');
let html = src('index.html');
for (const f of ['styles.css', 'core.js', 'ui.js']) {
  const marker = `<!--INLINE:${f}-->`;
  if (!html.includes(marker)) throw new Error(`Falta el marcador ${marker} en index.html`);
  let content = src(f);
  if (f.endsWith('.js')) content = content.replace(/<\/script/gi, '<\\/script');
  if (f.endsWith('.css')) content = content.replace(/<\/style/gi, '<\\/style');
  html = html.replace(marker, content);
}
const out = join(here, 'cuadrante-de-consulta.html');
writeFileSync(out, html);
console.log(`escrito ${out} (${(html.length / 1024).toFixed(0)} KB)`);
