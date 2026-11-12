/* Por qué SIMEV: recorrido horizontal anclado al scroll. */
import { $, $$, RM, WIDE, clamp, root } from "../core/utils.js";
import { onFrame, onResize, requestTick } from "../core/loop.js";

export function initPorque() {
  {
    const track = $("#why-track"), row = $("#why-row"), hud = $("#why-hud"), count = $("#why-n");
    const panels = $$(".why-p"), words = $$(".why-word");
    let travel = 0;
    const measure = () => {
      const on = WIDE.matches && !RM && innerHeight >= 560;
      root.classList.toggle("h-on", on);
      if (!on) { travel = 0; track.style.removeProperty("--travel"); row.style.transform = ""; words.forEach(w => w.style.transform = ""); return; }
      travel = Math.max(0, row.scrollWidth - root.clientWidth);
      track.style.setProperty("--travel", travel + "px");
    };
    measure(); onResize(measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); requestTick(); });
    onFrame((y, vh) => {
      if (!travel) return;
      const r = track.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const p = clamp(-r.top / Math.max(1, r.height - vh));
      row.style.transform = `translate3d(${(-p * travel).toFixed(1)}px,0,0)`;
      hud.style.setProperty("--p", p.toFixed(4));
      const mid = innerWidth * .5;
      let best = 0, bd = 1e9;
      panels.forEach((el, i) => {
        const b = el.getBoundingClientRect(), d = Math.abs(b.left + b.width * .4 - mid);
        if (d < bd) { bd = d; best = i; }
        el.classList.toggle("is-in", b.left < innerWidth * .74);
        words[i].style.transform = `translate3d(${((b.left - mid * .5) * .09).toFixed(1)}px,0,0)`;
      });
      count.textContent = `${best + 1} / ${panels.length}`;
    });
  }
}
