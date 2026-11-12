/* Preguntas frecuentes: acordeón. */
import { $, $$ } from "../core/utils.js";

export function initPreguntas() {
  $$(".qa").forEach(q => {
    const b = $(".qa-q", q), a = $(".qa-a", q);
    const set = open => { q.classList.toggle("is-open", open); b.setAttribute("aria-expanded", String(open)); a.inert = !open; };
    set(q.classList.contains("is-open"));
    b.addEventListener("click", () => set(!q.classList.contains("is-open")));
  });
}
