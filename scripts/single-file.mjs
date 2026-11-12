// Genera preview/: versiones de un solo archivo (CSS, JS e imágenes en línea)
// para revisiones donde no se pueden servir varios archivos. Requiere haber ejecutado el build.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist"), OUT = join(ROOT, "preview");
const read = p => readFileSync(p, "utf8");
const dataUri = p => "data:image/png;base64," + readFileSync(p).toString("base64");

// JS: recorre las importaciones desde main.js y concatena los módulos en orden de dependencia.
const order = [], seen = new Set();
const visit = file => {
  if (seen.has(file)) return; seen.add(file);
  const code = read(file);
  for (const [, spec] of code.matchAll(/from\s+"([^"?]+)(?:\?[^"]*)?"/g)) visit(resolve(dirname(file), spec));
  order.push(file);
};
visit(join(DIST, "assets/js/main.js"));
const js = order.map(f => read(f)
  .replace(/^import [^;]+;\n/gm, "")
  .replace(/^export (const|function|let)/gm, "$1")).join("\n");

let css = read(join(DIST, "assets/css/styles.css"))
  .replace(/url\("\.\.\/img\/([\w.-]+)"\)/g, (_, n) => `url("${dataUri(join(DIST, "assets/img", n))}")`);

const page = (name, wrapDocument) => {
  let html = read(join(DIST, name))
    .replace(/<link rel="stylesheet" href="assets\/css\/styles\.css[^"]*">/, () => `<style>\n${css}</style>`)
    .replace(/<script type="module" src="assets\/js\/main\.js[^"]*"><\/script>/, () => `<script>\n(() => {\n"use strict";\n${js}\n})();\n</script>`)
    .replace(/<link rel="icon"[^>]*>\n?/, "");
  if (!wrapDocument) {
    const head = html.slice(html.indexOf("<head>") + 6, html.indexOf("</head>"))
      .replace(/<meta charset[^>]*>\n?|<meta name="viewport"[^>]*>\n?/g, "");
    const body = html.slice(html.indexOf(">", html.indexOf("<body")) + 1, html.indexOf("</body>"));
    html = head.trim() + "\n" + body.trim() + "\n";
  }
  return html;
};
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "simev.html"), page("index.html", false));
writeFileSync(join(OUT, "privacidad.html"), page("privacidad.html", true));
console.log("preview/ generado");
