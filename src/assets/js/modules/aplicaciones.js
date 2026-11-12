/* Aplicaciones: carrusel arrastrable. */
import { $, RM, clamp } from "../core/utils.js";
import { onResize } from "../core/loop.js";

export function initAplicaciones() {
  {
    const pl = $("#plates"), bar = $("#pl-bar"), prev = $("#pl-prev"), next = $("#pl-next");
    const upd = () => {
      const max = pl.scrollWidth - pl.clientWidth, p = max > 0 ? pl.scrollLeft / max : 0, vis = clamp(pl.clientWidth / pl.scrollWidth);
      bar.style.setProperty("--p", (vis + (1 - vis) * p).toFixed(4));
      prev.disabled = pl.scrollLeft < 4; next.disabled = pl.scrollLeft > max - 4;
    };
    const stepW = () => $(".plate", pl).getBoundingClientRect().width + (parseFloat(getComputedStyle(pl).columnGap) || 16);
    pl.addEventListener("scroll", upd, { passive: true });
    prev.addEventListener("click", () => pl.scrollBy({ left: -stepW(), behavior: RM ? "auto" : "smooth" }));
    next.addEventListener("click", () => pl.scrollBy({ left: stepW(), behavior: RM ? "auto" : "smooth" }));
    let drag = null;
    pl.addEventListener("pointerdown", e => { if (e.pointerType === "mouse" && e.button === 0) drag = { x: e.clientX, s: pl.scrollLeft, moved: false }; });
    addEventListener("pointermove", e => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 4) { drag.moved = true; pl.classList.add("is-drag"); }
      if (drag.moved) pl.scrollLeft = drag.s - dx;
    });
    addEventListener("pointerup", () => { if (drag) { pl.classList.remove("is-drag"); drag = null; } });
    pl.addEventListener("dragstart", e => e.preventDefault());
    upd(); onResize(upd);
  }
}
