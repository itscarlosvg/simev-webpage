/* Héroe: el texto se retira con el scroll. */
import { $, RM, clamp, ss } from "../core/utils.js";
import { onFrame } from "../core/loop.js";

export function initHero() {
  {
    const copy = $("#hero-copy"), hero = $("#inicio");
    if (!RM) onFrame(y => {
      const s = clamp(y / Math.max(1, hero.offsetHeight));
      if (s >= 1) return;
      copy.style.transform = `translate3d(0,${(-s * 70).toFixed(1)}px,0)`;
      copy.style.opacity = (1 - ss(.25, .8, s)).toFixed(3);
    });
  }
}
