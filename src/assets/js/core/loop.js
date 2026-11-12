/* Bus de scroll y resize: una sola lectura por frame para todos los módulos. */
const frameSubs = [], resizeSubs = [];
let queued = false, resizeTimer = 0;
const tick = () => { queued = false; const y = scrollY, vh = innerHeight; for (const f of frameSubs) f(y, vh); };
export const requestTick = () => { if (!queued) { queued = true; requestAnimationFrame(tick); } };
export const onFrame = f => { frameSubs.push(f); };
export const onResize = f => { resizeSubs.push(f); };
export const runResize = () => { resizeSubs.forEach(f => f()); requestTick(); };
addEventListener("scroll", requestTick, { passive: true });
addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(runResize, 140); });
