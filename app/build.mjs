// Ensambla app/src/{index.html, styles.css, core.js, ui.js} en:
//   app/cuadrante-de-consulta.html  (documento completo, para abrir en local o subir a un hosting)
//   app/artifact.html               (solo contenido, para publicar como Artifact)
// Uso: node app/build.mjs
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
  html = html.replace(marker, () => content);
}
const full = join(here, 'cuadrante-de-consulta.html');
writeFileSync(full, html);

const between = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b); if (i < 0 || j < 0) throw new Error(`Faltan marcadores ${a}/${b}`); return html.slice(i + a.length, j); };
const artifact = between('<!--HEAD-START-->', '<!--HEAD-END-->').trim() + '\n' + between('<!--BODY-START-->', '<!--BODY-END-->').trim() + '\n';
const art = join(here, 'artifact.html');
writeFileSync(art, artifact);
console.log(`escrito ${full} (${(html.length / 1024).toFixed(0)} KB) y ${art} (${(artifact.length / 1024).toFixed(0)} KB)`);
