/* Soluciones: pestañas de las tres líneas de trabajo. */
import { $, $$, FINE, WIDE } from "../core/utils.js";

export function initSoluciones() {
  let setSvc = () => {};
  {
    const svcs = $$(".svc");
    let cur = 0;
    setSvc = i => {
      cur = i;
      svcs.forEach((s, k) => {
        const on = k === i;
        s.classList.toggle("is-active", on);
        if (WIDE.matches) s.classList.toggle("is-on", on);
        $(".svc-tab", s).setAttribute("aria-expanded", String(on || !WIDE.matches));
      });
    };
    svcs.forEach((s, i) => {
      const tab = $(".svc-tab", s);
      tab.addEventListener("click", () => setSvc(i));
      tab.addEventListener("focus", () => { if (WIDE.matches) setSvc(i); });
      if (FINE) tab.addEventListener("mousemove", e => { if (WIDE.matches && (e.movementX || e.movementY) && !s.classList.contains("is-active")) setSvc(i); });
    });
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(es => es.forEach(en => { if (!WIDE.matches) en.target.closest(".svc").classList.toggle("is-on", en.isIntersecting); }), { threshold: .15 });
      svcs.forEach(s => io.observe($(".fig", s)));
    }
    WIDE.addEventListener("change", () => setSvc(cur));
    setSvc(0);
    $$("[data-svc]").forEach(a => a.addEventListener("click", () => setSvc(+a.dataset.svc)));
    $$("[data-interes]").forEach(a => a.addEventListener("click", () => {
      const r = $$('input[name="interes"]').find(x => x.value === a.dataset.interes);
      if (r) r.checked = true;
    }));
  }
}
