// Genera dist/ a partir de src/: ensambla las páginas con sus parciales,
// combina el CSS en un solo archivo y versiona los recursos para la caché.
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, copyFileSync } from "node:fs";
import { join, dirname, relative, resolve } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const DIST = join(ROOT, "dist");

const read = p => readFileSync(p, "utf8");
const write = (p, text) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, text); };
const walk = dir => readdirSync(dir).flatMap(n => { const p = join(dir, n); return statSync(p).isDirectory() ? walk(p) : [p]; });

// CSS: resuelve los @import de main.css en orden y quita los comentarios.
const bundleCss = file => read(file).replace(/@import\s+"([^"]+)";/g, (_, rel) => bundleCss(join(dirname(file), rel)));
const css = bundleCss(join(SRC, "assets/css/main.css"))
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\n{2,}/g, "\n")
  .trim() + "\n";

// Versión: huella del CSS y el JS, para invalidar la caché en cada cambio.
const jsFiles = walk(join(SRC, "assets/js"));
const hash = createHash("sha1");
hash.update(css);
jsFiles.forEach(f => hash.update(read(f)));
const version = hash.digest("hex").slice(0, 8);

// HTML: parciales con <!-- @include ruta -->, variables con <!-- @vars a="b" --> y {{a}}.
const include = (text, indent = "") => text.replace(/^([ \t]*)<!-- @include ([^ ]+) -->$/gm, (_, ind, rel) =>
  include(read(join(SRC, rel)).trimEnd(), ind).split("\n").map(l => (l ? ind + l : l)).join("\n"));
const renderPage = file => {
  let html = read(file);
  const vars = {};
  html = html.replace(/^<!-- @vars (.*) -->\n/m, (_, attrs) => {
    for (const [, k, v] of attrs.matchAll(/(\w+)="([^"]*)"/g)) vars[k] = v;
    return "";
  });
  html = include(html);
  html = html.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));
  return html
    .replace(/href="(\/?)assets\/css\/main\.css"/, `href="$1assets/css/styles.css?v=${version}"`)
    .replace(/src="(\/?)assets\/js\/main\.js"/, `src="$1assets/js/main.js?v=${version}"`);
};

rmSync(DIST, { recursive: true, force: true });
for (const page of readdirSync(join(SRC, "pages"))) write(join(DIST, page), renderPage(join(SRC, "pages", page)));
write(join(DIST, "assets/css/styles.css"), css);
for (const f of jsFiles) {
  const code = read(f).replace(/(from\s+"\.{1,2}\/[^"]+\.js)"/g, `$1?v=${version}"`);
  write(join(DIST, relative(SRC, f)), code);
}
for (const f of walk(join(SRC, "assets/img"))) { mkdirSync(dirname(join(DIST, relative(SRC, f))), { recursive: true }); copyFileSync(f, join(DIST, relative(SRC, f))); }
for (const f of walk(join(SRC, "public"))) { if (f.endsWith(".example.php")) continue; const out = join(DIST, relative(join(SRC, "public"), f)); mkdirSync(dirname(out), { recursive: true }); copyFileSync(f, out); }

console.log(`dist/ generado (versión ${version})`);
