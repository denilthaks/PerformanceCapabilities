// Builds the prototype as ONE self-contained HTML file that opens straight
// from disk (double-click, file://), with no server. Browsers block module
// scripts loaded from file:// URLs, so the JavaScript, CSS, room art and
// favicon are all inlined into the page.
//   npm run build:standalone  →  dist-standalone/prototype-standalone.html
//
// The only outside request is Google Fonts; offline, the page falls back to
// system fonts and still works.

import { build } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'dist-standalone');
const TMP = path.join(OUT, '.tmp');
// There is no full game beside a lone file, so "Full game" points at the repository.
const FULL_GAME = process.env.PC_FULL_GAME || 'https://github.com/denilthaks/PerformanceCapabilities';

await build({
  root: ROOT,
  configFile: false,
  base: './',
  logLevel: 'warn',
  build: {
    outDir: TMP,
    emptyOutDir: true,
    target: 'es2020',
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: { input: path.join(ROOT, 'prototype/index.html'), output: { inlineDynamicImports: true } },
  },
});

const pageFile = path.join(TMP, 'prototype', 'index.html');
let html = fs.readFileSync(pageFile, 'utf8');
const read = (href) => fs.readFileSync(path.resolve(path.dirname(pageFile), href), 'utf8');

let scripts = 0;
html = html.replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/g, (_, src) => {
  scripts += 1;
  return `<script type="module">${read(src).replace(/<\/script/gi, '<\\/script')}</script>`;
});
let styles = 0;
html = html.replace(/<link rel="stylesheet" crossorigin href="([^"]+)">/g, (_, href) => {
  styles += 1;
  return `<style>${read(href)}</style>`;
});
const favicon = fs.readFileSync(path.join(ROOT, 'public', 'favicon.svg'), 'utf8');
html = html
  .replace('href="../favicon.svg"', `href="data:image/svg+xml,${encodeURIComponent(favicon)}"`)
  .replace('<a class="ch-r" href="../">Full game ↗</a>', `<a class="ch-r" href="${FULL_GAME}" target="_blank" rel="noopener">Full game ↗</a>`)
  .replace('</title>', `</title>\n  <meta name="pc-full-game" content="${FULL_GAME}">`);

if (scripts !== 1 || styles !== 1) throw new Error(`expected 1 script and 1 stylesheet to inline, found ${scripts} and ${styles}`);
const leftovers = html.match(/(?:src|href)="\.{1,2}\/[^"]*"/g);
if (leftovers) throw new Error(`relative references left in the page: ${leftovers.join(', ')}`);

fs.writeFileSync(path.join(OUT, 'prototype-standalone.html'), html);
fs.rmSync(TMP, { recursive: true, force: true });
console.log(`dist-standalone/prototype-standalone.html (${Math.round(html.length / 1024)} KB)`);
