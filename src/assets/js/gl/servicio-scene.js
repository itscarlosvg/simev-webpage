/* Escena 3D de servicio técnico: despiece de un servidor de rack controlado por el scroll. Se crea al acercarse a la sección. */
import { $, $$, RM, clamp, ss, io3 } from "../core/utils.js";
import { state } from "../core/state.js";
import { persp, lookAt, mul4, toScreen } from "./math.js";
import { Stage, NIGHT, isoFallback, runLoop, mouse } from "./stage.js";

export function initServicioScene() {
  const sec = $("#servicio"), canvas = $("#show-gl"), sticky = $("#show-sticky");
  const init = () => {
    const st = Stage(canvas);
    if (!st) { canvas.hidden = true; isoFallback($("#show-fb")); return; }
    const B = [];
    const add = (L, p, h, col, metal, rough, type = 0, seed = 0, glow = 1) => B.push({ L, p, h, col, metal, rough, type, seed, glow });
    const ST = [.76, .79, .84], DK = [.12, .14, .19], AL = [.92, .94, .97], PCB = [.07, .07, .32], DR = [.4, .43, .49];
    add(0, [0, .03, 0], [2.2, .03, 3.4], ST, 1, .4);
    add(0, [-2.17, .47, 0], [.03, .41, 3.4], ST, 1, .4); add(0, [2.17, .47, 0], [.03, .41, 3.4], ST, 1, .4); add(0, [0, .47, -3.37], [2.14, .41, .03], ST, 1, .4);
    add(1, [-.5, .1, -1.25], [1.6, .02, 1.95], PCB, 0, .5, 4, .3);
    [-1.45, .05].forEach(x => { add(2, [x, .16, -1.25], [.5, .04, .5], AL, 1, .3); for (let i = 0; i < 8; i++) add(2, [x, .46, -1.67 + i * .12], [.5, .26, .02], AL, 1, .28); });
    [-.86, -.74, -.62, -.5, .64, .76, .88, 1].forEach((x, i) => add(3, [x, .33, -1.25], [.022, .21, .62], DK, .2, .4, 1, i === 2 ? .9 : .2));
    for (let i = 0; i < 5; i++) add(4, [-1.68 + i * .84, .47, 1.1], [.37, .37, .14], DK, 0, .5, 5, i * .17);
    for (let i = 0; i < 8; i++) add(5, [-1.82 + i * .52, .47, 2.72], [.23, .37, .6], DR, 1, .38, 6, i === 5 ? .9 : i * .1);
    add(6, [1.6, .27, -1.95], [.48, .19, 1.3], ST, 1, .36, 2, .6); add(6, [1.6, .67, -1.95], [.48, .19, 1.3], ST, 1, .36, 2, .9);
    add(8, [-.3, .34, -2.9], [.62, .2, .02], PCB, 0, .5); add(8, [-.7, .44, -2.86], [.035, .035, .02], [.4, .7, 1], 0, 0, 3, 0, 3); add(8, [-.5, .44, -2.86], [.035, .035, .02], [.4, .7, 1], 0, 0, 3, 0, 3); add(8, [-.3, .44, -2.86], [.035, .035, .02], [1, .3, .34], 0, 0, 3, 0, 3);
    add(7, [0, .93, 0], [2.2, .025, 3.4], ST, 1, .3, 7);
    const EX = { 0: [0, 0, 0], 1: [0, .5, 0], 2: [0, 1.5, 0], 3: [0, 2.35, 0], 4: [0, 1.35, .6], 5: [0, .7, 2.2], 6: [1.6, 1.0, -.8], 7: [-1.3, 3.5, -2.5], 8: [-.5, 1.1, -1.6] };
    const ORD = { 7: 0, 5: 1, 6: 2, 4: 3, 8: 4, 3: 5, 2: 6, 1: 7, 0: 8 };
    const ANC = { cpu: [2, [-1.45, .78, -1.25]], ram: [3, [1, .56, -.7]], disk: [5, [1.82, .86, 2.72]], fan: [4, [-1.68, .86, 1.1]], psu: [6, [1.6, .9, -1.95]], nic: [8, [-.3, .56, -2.9]], base: [0, [-2.1, .06, 2.4]] };
    const batchO = st.batch(B.length);
    const labels = $$(".show .co").map(el => ({ el, a: ANC[el.dataset.k] }));
    const t0 = performance.now(); let last = t0, born = 0;
    const frame = now => {
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      const time = RM ? 5 : (now - t0) / 1000;
      const { w, h } = st.size();
      if (!w || !h) return;
      born = RM ? 1 : Math.min(1, born + dt * 1.2);
      const mk = 1 - Math.exp(-dt * 3); mouse.x += (mouse.tx - mouse.x) * mk; mouse.y += (mouse.ty - mouse.y) * mk;
      const asp = w / h, narrow = asp < .9, p = RM ? 1 : state.showP;
      const le = L => { if (RM) return 1; const e = io3(clamp((p * 1.25 - ORD[L] * .045) / .78)); return L === 7 ? .16 + .84 * e : e; };
      batchO.n = 0;
      for (const b of B) { const e = le(b.L), x = EX[b.L]; batchO.add(b.p[0] + x[0] * e, b.p[1] + x[1] * e, b.p[2] + x[2] * e, b.h[0], b.h[1], b.h[2], 0, b.col[0], b.col[1], b.col[2], b.metal, b.type, b.seed, b.glow, b.rough); }
      const eAll = io3(clamp(p * 1.2));
      const yaw = .44 + p * .42 + mouse.x * .1 + Math.sin(time * .16) * .05, pitch = .4 + eAll * .08 - mouse.y * .04;
      const d0 = Math.max(15.5, 17.5 / asp), dist = d0 * (1 + eAll * .3);
      const tgt = [0, .55 + eAll * 1.55, 0];
      const eye = [tgt[0] + Math.sin(yaw) * Math.cos(pitch) * dist, tgt[1] + Math.sin(pitch) * dist, tgt[2] + Math.cos(yaw) * Math.cos(pitch) * dist];
      const view = lookAt(eye, tgt);
      const vp = mul4(persp(.52, asp, .5, 200, narrow ? 0 : .2, narrow ? -.2 : -.16), view.m);
      const c = toScreen(vp, tgt, 1, 1);
      st.render({ vp, eye, time, bg: NIGHT, glow: [.13, .15, .6], fog: [dist * 1.3, dist * 3.2], bevel: .018, appear: born, mirror: true, ref: .5, floor: 1, center: [c[0], 1 - c[1]], opaque: batchO, glass: null, rings: null, points: false, px: 0, ao: 0, redk: .12 });
      labels.forEach((L, i) => {
        const e = le(L.a[0]), x = EX[L.a[0]], q = L.a[1];
        const s2 = toScreen(vp, [q[0] + x[0] * e, q[1] + x[1] * e, q[2] + x[2] * e], w, h);
        const left = s2[0] < w * .5;
        L.el.classList.toggle("l", left);
        if (!L.w) L.w = L.el.offsetWidth;
        const lx = left ? Math.max(s2[0], L.w + 10) : Math.min(s2[0], w - L.w - 10);
        L.el.style.transform = `translate3d(${lx.toFixed(1)}px,${s2[1].toFixed(1)}px,0) translate(${left ? "-100%" : "0"},-50%)`;
        L.el.style.opacity = ss(.5 + i * .035, .72 + i * .035, p).toFixed(3);
      });
    };
    canvas.addEventListener("webglcontextlost", e => e.preventDefault());
    runLoop(sticky, frame, () => { last = performance.now(); });
  };
  if (RM || !("IntersectionObserver" in window)) { init(); return; }
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); init(); } }, { rootMargin: "120% 0px" });
  io.observe(sec);
}
