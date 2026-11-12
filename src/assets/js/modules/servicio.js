/* Servicio técnico: progreso del despiece 3D. */
import { $, RM, clamp } from "../core/utils.js";
import { onFrame } from "../core/loop.js";
import { state } from "../core/state.js";

export function initServicio() {
  {
    const track = $("#show-track"), bar = $("#show-bar");
    onFrame((y, vh) => {
      const r = track.getBoundingClientRect();
      state.showP = RM ? 1 : clamp(-r.top / Math.max(1, r.height - vh));
      bar.style.setProperty("--p", state.showP.toFixed(4));
    });
  }
}
