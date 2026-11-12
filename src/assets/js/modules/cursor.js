/* Cursor personalizado. */
import { $, RM, FINE, root } from "../core/utils.js";

export function initCursor() {
  if (FINE && !RM) {
    const cur = $("#cur"), lab = $("#cur-l");
    let x = 0, y = 0, tx = 0, ty = 0, raf = 0;
    const loop = () => {
      x += (tx - x) * .22; y += (ty - y) * .22;
      cur.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) > .2 ? requestAnimationFrame(loop) : 0;
    };
    addEventListener("pointermove", e => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX; ty = e.clientY;
      if (!cur.classList.contains("on")) { x = tx; y = ty; cur.classList.add("on"); }
      const t = e.target.closest ? e.target : null;
      const hit = t && t.closest("a,button,.nd,label,input,textarea"), zone = t && t.closest("[data-cur]");
      const tz = t && t.closest("[data-tone],[data-t]"), tone = tz ? (tz.dataset.tone || tz.dataset.t) : document.body.dataset.tone || "night";
      if (cur.dataset.tone !== tone) cur.dataset.tone = tone;
      const useLab = zone && !hit;
      cur.classList.toggle("lab", !!useLab);
      cur.classList.toggle("act", !!hit && !t.closest("input,textarea"));
      if (useLab && lab.textContent !== zone.dataset.cur) lab.textContent = zone.dataset.cur;
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    root.addEventListener("pointerleave", () => cur.classList.remove("on"));
  }
}
