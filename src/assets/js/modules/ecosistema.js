/* Ecosistema: diagrama interactivo de cómo se relacionan las tres líneas. */
import { $, $$, RM, FINE, clamp } from "../core/utils.js";
import { onResize } from "../core/loop.js";

export function initEcosistema() {
  {
    const T = {
      core: { kind: "El centro", label: "Tu empresa", text: "Todo parte de lo que tu empresa necesita para trabajar: equipos que funcionen, alguien que los mantenga y la seguridad de que su información está protegida." },
      ciber: { a: -90, kind: "Línea de trabajo", label: "Ciberseguridad", text: "Lo que protege a la organización completa: vigilancia continua, pruebas de seguridad y cumplimiento.", kids: ["expo", "apps", "pers", "cumpl"], rel: ["equipos", "mant"] },
      mant: { a: 30, kind: "Línea de trabajo", label: "Mantenimiento", title: "Mantenimiento y servicio técnico", text: "Lo que mantiene los equipos en operación: diagnóstico, reparación y puesta a punto.", kids: ["diag", "rep", "punto"], rel: ["equipos"] },
      equipos: { a: 150, kind: "Línea de trabajo", label: "Venta de equipos", text: "Los equipos electrónicos y de oficina con los que trabaja tu empresa. Lo que vendemos es también lo que después mantenemos.", kids: ["electro", "oficina"], rel: ["mant"] },
      expo: { label: "Exposición externa", text: "Vigilar lo que la organización expone a internet." },
      apps: { label: "Aplicaciones", text: "Probar la seguridad de sitios y aplicaciones." },
      pers: { label: "Personas", text: "Preparar al equipo frente al phishing." },
      cumpl: { label: "Cumplimiento", text: "Relacionar los hallazgos con la normativa y los marcos de seguridad." },
      diag: { label: "Diagnóstico", text: "Identificar qué falla antes de intervenir." },
      rep: { label: "Reparación", text: "Devolver el equipo a su funcionamiento." },
      punto: { label: "Puesta a punto", text: "Dejar los equipos en condiciones para seguir operando." },
      electro: { label: "Equipos electrónicos", text: "Los equipos con los que tu empresa opera a diario." },
      oficina: { label: "Equipos de oficina", text: "El equipamiento de cada puesto de trabajo." }
    };
    const lines = ["ciber", "mant", "equipos"], parentOf = {};
    lines.forEach(l => T[l].kids.forEach(k => parentOf[k] = l));
    const related = id => id === "core" ? new Set(["core", ...lines]) : parentOf[id] ? new Set([id, parentOf[id], "core"]) : new Set(["core", id, ...T[id].kids, ...T[id].rel]);
    const stage = $("#eco-stage"), kindEl = $("#eco-kind"), titleEl = $("#eco-title"), textEl = $("#eco-text"), relEl = $("#eco-rel");
    let svg = null, pinned = "core", shown = null;
    const name = id => T[id].title || T[id].label;
    const select = id => {
      if (!svg) return;
      const set = related(id);
      svg.classList.toggle("dim", id !== "core");
      $$(".nd", svg).forEach(g => { g.classList.toggle("on", set.has(g.dataset.id)); g.classList.toggle("sel", g.dataset.id === id); });
      $$("[data-l]", svg).forEach(l => { const p = l.dataset.l.split(" "); l.classList.toggle("on", l.classList.contains("ch") ? p.includes(id) : id === "core" ? p[1] === "core" : p.every(x => set.has(x))); });
      if (shown === id) return;
      shown = id;
      kindEl.textContent = T[id].kind || name(parentOf[id]);
      titleEl.textContent = name(id);
      textEl.textContent = T[id].text;
      relEl.innerHTML = "";
      [...set].filter(x => x !== id).forEach(x => {
        const b = document.createElement("button"); b.type = "button"; b.textContent = name(x);
        b.addEventListener("click", () => { pinned = x; select(x); });
        relEl.appendChild(b);
      });
      if (!RM) [titleEl, textEl].forEach(el => { el.classList.remove("eco-swap"); void el.offsetWidth; el.classList.add("eco-swap"); });
    };
    const build = () => {
      const W = Math.round(stage.clientWidth);
      if (!W) return;
      const narrow = W < 640, fs = narrow ? 12.5 : 14, fo = narrow ? 12.5 : 13, ph = narrow ? 32 : 38;
      const pw = id => T[id].label.length * fs * .62 + 32;
      const f = v => v.toFixed(1), pos = {}, ang = {};
      let H, R, cx, cy;
      if (narrow) {
        R = 38; cx = W / 2; cy = 56; let y = 142;
        lines.forEach(l => { pos[l] = [26 + pw(l) / 2, y]; T[l].kids.forEach((k, i) => { pos[k] = [50, y + 42 + i * 30]; }); y += 42 + T[l].kids.length * 30 + 30; });
        H = y - 14;
      } else {
        R = 54; H = Math.round(clamp(W * .74, 480, 640)); cx = W / 2; cy = H / 2;
        const rx = W / 2 - 162, ry = H / 2 - 50, ri = Math.min(rx, ry) * .54;
        const pol = (a, r1, r2) => [cx + Math.cos(a * Math.PI / 180) * r1, cy + Math.sin(a * Math.PI / 180) * r2];
        lines.forEach(l => { pos[l] = pol(T[l].a, ri, ri); const ks = T[l].kids, n = ks.length; ks.forEach((k, i) => { ang[k] = T[l].a + (i - (n - 1) / 2) * 32; pos[k] = pol(ang[k], rx, ry); }); });
      }
      pos.core = [cx, cy];
      let links = "", pulses = "", chords = "", nodes = "", n = 0;
      const link = (a, b, d) => {
        links += `<path class="lk" data-l="${a} ${b}" d="${d}"/>`;
        pulses += `<path class="pu" data-l="${a} ${b}" pathLength="1" style="animation-delay:-${((n++ * .47) % 3.2).toFixed(2)}s" d="${d}"/>`;
      };
      lines.forEach(l => {
        const [x, y] = pos[l];
        link(l, "core", narrow ? `M26 ${y}H12V${cy}H${f(cx - R)}` : `M${f(x)} ${f(y)}L${f(cx)} ${f(cy)}`);
        T[l].kids.forEach(k => { const [kx, ky] = pos[k]; link(k, l, narrow ? `M${kx - 6} ${ky}H36V${y + ph / 2}` : `M${f(kx)} ${f(ky)}L${f(x)} ${f(y)}`); });
      });
      if (!narrow) [["equipos", "mant"], ["ciber", "equipos"], ["ciber", "mant"]].forEach(([a, b]) => {
        const [x1, y1] = pos[a], [x2, y2] = pos[b], mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        chords += `<path class="ch" data-l="${a} ${b}" d="M${f(x1)} ${f(y1)}Q${f(mx + (mx - cx) * .9)} ${f(my + (my - cy) * .9)} ${f(x2)} ${f(y2)}"/>`;
      });
      lines.forEach(l => T[l].kids.forEach(k => {
        const [x, y] = pos[k];
        let tx = x + 14, ty = y + fo * .36, anchor = "start";
        if (!narrow) {
          const c = Math.cos(ang[k] * Math.PI / 180), s = Math.sin(ang[k] * Math.PI / 180);
          if (Math.abs(c) < .45) { tx = x; anchor = "middle"; ty = y + (s < 0 ? -15 : 15 + fo * .7); }
          else if (c < 0) { tx = x - 14; anchor = "end"; }
        }
        nodes += `<g class="nd o" data-id="${k}" tabindex="0" role="button" aria-label="${T[k].label}"><rect class="hit" x="${f(x - 22)}" y="${f(y - 15)}" width="44" height="30"/><circle class="sh" cx="${f(x)}" cy="${f(y)}" r="6"/><text x="${f(tx)}" y="${f(ty)}" text-anchor="${anchor}" font-size="${fo}">${T[k].label}</text></g>`;
      }));
      lines.forEach(l => {
        const [x, y] = pos[l], w = pw(l);
        nodes += `<g class="nd i" data-id="${l}" tabindex="0" role="button" aria-label="${name(l)}"><rect class="sh" x="${f(x - w / 2)}" y="${f(y - ph / 2)}" width="${f(w)}" height="${ph}" rx="${ph / 2}"/><text x="${f(x)}" y="${f(y + fs * .36)}" text-anchor="middle" font-size="${fs}">${T[l].label}</text></g>`;
      });
      nodes += `<g class="nd c" data-id="core" tabindex="0" role="button" aria-label="Tu empresa"><circle class="sh" cx="${f(cx)}" cy="${f(cy)}" r="${R}"/><text x="${f(cx)}" y="${f(cy - 3)}" text-anchor="middle" font-size="${fs + 1}">Tu</text><text x="${f(cx)}" y="${f(cy + fs + 1)}" text-anchor="middle" font-size="${fs + 1}">empresa</text></g>`;
      stage.innerHTML = `<svg class="eco" viewBox="0 0 ${W} ${H}" role="group" aria-label="Diagrama: cómo se relacionan la venta de equipos, el mantenimiento y la ciberseguridad">${links}${chords}${pulses}${nodes}</svg>`;
      svg = $("svg", stage);
      $$(".nd", svg).forEach(g => {
        const id = g.dataset.id;
        g.addEventListener("click", () => { pinned = id; select(id); });
        g.addEventListener("focus", () => select(id));
        g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pinned = id; select(id); } });
        if (FINE) g.addEventListener("mouseenter", () => select(id));
      });
      if (FINE) svg.addEventListener("mouseleave", () => select(pinned));
      shown = null; select(pinned);
    };
    build();
    let lastW = stage.clientWidth;
    onResize(() => { if (Math.abs(stage.clientWidth - lastW) > 2) { lastW = stage.clientWidth; build(); } });
  }
}
