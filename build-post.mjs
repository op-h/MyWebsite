/* Post-build steps Vite cannot do for us.
 *
 * 1. app.js is a *classic* script (not `type="module"`) on purpose: ES modules
 *    are blocked by CORS on file:// URLs, and the page has to survive being
 *    opened by double-clicking it. Vite therefore leaves it out of the bundle
 *    graph, so we minify and copy it ourselves.
 * 2. Vite stamps `crossorigin` on built tags. Harmless over http, but a
 *    file:// page fails the CORS check and silently drops the stylesheet.
 */
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { transform } from 'esbuild';

const html = readFileSync('dist/index.html', 'utf8');
const stripped = html.replace(/\s+crossorigin(?=[\s>])/g, '');
writeFileSync('dist/index.html', stripped);

const src = readFileSync('app.js', 'utf8');
const { code } = await transform(src, {
  loader: 'js',
  minify: true,
  target: ['es2018'],
  legalComments: 'none'
});
writeFileSync('dist/app.js', code);

copyFileSync('robots.txt', 'dist/robots.txt');
copyFileSync('sitemap.xml', 'dist/sitemap.xml');

const pct = (100 - (code.length / src.length) * 100).toFixed(0);
console.log(`post: app.js ${src.length} -> ${code.length} B (-${pct}%), crossorigin stripped, robots+sitemap copied`);
