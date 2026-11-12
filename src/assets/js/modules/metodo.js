/* Cómo trabajamos: pasos sincronizados con el scroll. */
import { $, $$, RM } from "../core/utils.js";
import { onFrame } from "../core/loop.js";

export function initMetodo() {
  {
    const stepsEl = $("#steps"), steps = $$(".step"), num = $("#dial-num"), ttl = $("#dial-ttl"), btns = $$("#dial-nav button");
    let cur = -1;
    const set = i => {
      if (i === cur) return; cur = i;
      steps.forEach((s, k) => s.classList.toggle("is-active", k === i));
      btns.forEach((b, k) => { b.classList.toggle("is-active", k === i); b.classList.toggle("is-done", k < i); });
      num.textContent = String(i + 1).padStart(2, "0");
      ttl.textContent = $("h3", steps[i]).textContent;
      if (!RM) { num.classList.remove("flip"); void num.offsetWidth; num.classList.add("flip"); }
    };
    if (!RM) stepsEl.classList.add("live");
    onFrame((y, vh) => {
      const r = stepsEl.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      let best = 0, bd = 1e9;
      steps.forEach((s, i) => { const b = s.getBoundingClientRect(), d = Math.abs(b.top + b.height / 2 - vh * .5); if (d < bd) { bd = d; best = i; } });
      set(best);
    });
    btns.forEach((b, i) => b.addEventListener("click", () => steps[i].scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "center" })));
    set(0);
  }
}
