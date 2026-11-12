/* Navegación: fondo al hacer scroll, sección activa, ambiente de color y menú móvil. */
import { $, $$, RM, WIDE, clamp, root } from "../core/utils.js";
import { onFrame, requestTick } from "../core/loop.js";

export function initNav() {
  $("#year").textContent = new Date().getFullYear();
  {
    const nav = $("#nav"), bar = $("#nav-bar"), secs = $$("[data-t]"), links = $$(".nav-links a");
    onFrame((y, vh) => {
      nav.classList.toggle("is-solid", y > 16);
      bar.style.transform = `scaleX(${clamp(y / Math.max(1, root.scrollHeight - vh)).toFixed(4)})`;
      let mid = null, top = null;
      for (const s of secs) {
        const r = s.getBoundingClientRect();
        if (r.top <= vh * .55 && r.bottom > vh * .55) mid = s;
        if (r.top <= 38 && r.bottom > 38) top = s;
      }
      if (mid) {
        if (document.body.dataset.tone !== mid.dataset.t) document.body.dataset.tone = mid.dataset.t;
        links.forEach(a => a.getAttribute("href") === "#" + mid.id ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current"));
      }
      if (top) { const t = top.dataset.t === "blue" ? "night" : top.dataset.t; if (nav.dataset.tone !== t) nav.dataset.tone = t; }
    });

    const btn = $("#menu-btn"), sheet = $("#sheet");
    const setOpen = open => {
      sheet.classList.toggle("is-open", open);
      sheet.setAttribute("aria-hidden", String(!open));
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      document.body.style.overflow = open ? "hidden" : "";
      $$("a", sheet).forEach(a => a.tabIndex = open ? 0 : -1);
      if (open) nav.dataset.tone = "night"; else requestTick();
    };
    setOpen(false);
    btn.addEventListener("click", () => setOpen(!sheet.classList.contains("is-open")));
    sheet.addEventListener("click", e => { if (e.target.closest("a")) setOpen(false); });
    addEventListener("keydown", e => { if (e.key === "Escape" && sheet.classList.contains("is-open")) { setOpen(false); btn.focus(); } });
    WIDE.addEventListener("change", e => { if (e.matches) setOpen(false); });
    $("#top-btn").addEventListener("click", () => scrollTo({ top: 0, behavior: RM ? "auto" : "smooth" }));
  }
}
