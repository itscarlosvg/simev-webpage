/* Empresa: declaración que se enciende palabra a palabra y franja de texto en movimiento. */
import { $, $$, RM, clamp, lerp } from "../core/utils.js";
import { onFrame, onResize } from "../core/loop.js";

export function initEmpresa() {
  {
    const st = $("#statement");
    if (st && !RM) {
      const text = st.textContent.trim();
      st.innerHTML = `<span class="sr">${text}</span>` + text.split(/\s+/).map(w => `<span class="wd" aria-hidden="true">${w}</span>`).join(" ");
      const wds = $$(".wd", st), n = wds.length;
      onFrame((y, vh) => {
        const r = st.getBoundingClientRect();
        if (r.bottom < -40 || r.top > vh + 40) return;
        const head = clamp((vh * .86 - r.top) / (r.height + vh * .34)) * (n + 7);
        for (let i = 0; i < n; i++) wds[i].style.opacity = lerp(.15, 1, clamp((head - i) / 7)).toFixed(3);
      });
    }
    const mq = $("#mq-row");
    if (mq && !RM) {
      let third = 1;
      const meas = () => { third = Math.max(1, mq.scrollWidth / 3); };
      meas(); onResize(meas);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(meas);
      onFrame(y => { mq.style.transform = `translate3d(${(-((y * .45) % third)).toFixed(1)}px,0,0)`; });
    }
  }
}
