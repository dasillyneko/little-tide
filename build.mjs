import { readFile, mkdir, writeFile } from 'node:fs/promises';
const read = path => readFile(new URL(path, import.meta.url), 'utf8');
const [html, css, core, app] = await Promise.all(['src/index.html','src/style.css','src/core.mjs','src/app.js'].map(read));
await mkdir(new URL('dist/', import.meta.url), { recursive: true });
await writeFile(new URL('dist/index.html', import.meta.url), html.replace('/* STYLES */', css).replace('/* APPLICATION */', core.replaceAll('export ', '') + '\n' + app));
console.log('Built dist/index.html (self-contained; no runtime dependencies).');
