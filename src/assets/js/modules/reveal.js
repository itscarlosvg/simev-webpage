/* Revelados al entrar en pantalla. */
import { $$, RM } from "../core/utils.js";

export function initReveal() {
  if (!RM && "IntersectionObserver" in window) {
    const els = $$(".rv,.rh").filter(el => el.getBoundingClientRect().top > innerHeight * .92);
    els.forEach(el => el.classList.add("pre"));
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target, sibs = [...el.parentElement.children].filter(c => c.classList.contains("pre"));
      el.style.transitionDelay = Math.min(Math.max(sibs.indexOf(el), 0), 4) * 90 + "ms";
      el.classList.remove("pre"); io.unobserve(el);
    }), { rootMargin: "0px 0px -8% 0px" });
    els.forEach(el => io.observe(el));
  }
}
