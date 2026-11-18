/* Escena 3D del héroe: estructura de capas que se arma al cargar y responde al puntero y al scroll. */
import { $, $$, RM, clamp, ss, outExpo } from "../core/utils.js";
import { persp, lookAt, mul4, toScreen, prng } from "./math.js";
import { Stage, NIGHT, isoFallback, runLoop, mouse } from "./stage.js";

export function initHeroScene() {
  const canvas = $("#hero-gl"), hero = $("#inicio");
  const st = Stage(canvas);
  if (!st) { canvas.hidden = true; isoFallback($("#hero-fb")); return; }
  const SIL = [.8, .82, .86], STE = [.46, .49, .55], GRA = [.18, .21, .27], WHI = [.93, .94, .96], GLS = [1, 1, 1];
  /* zona, medio ancho, medio alto, tipo, vidrio, color, metal, rugosidad, brillo, semilla */
  const D = [
    [0, 1.34, .17, 2, 0, STE, 1, .42, 1, .2], [0, 1.22, .055, 1, 0, SIL, 1, .25, 1, .35], [0, 1.3, .15, 2, 0, GRA, 1, .4, 1, .6], [0, 1.16, .05, 1, 0, SIL, 1, .25, 1, .9], [0, 1.24, .13, 2, 0, STE, 1, .42, 1, .45],
    [1, 1.0, .1, 1, 0, GRA, 1, .32, 1, .1], [1, .9, .045, 0, 0, SIL, 1, .2, 1, 0], [1, 1.02, .12, 2, 0, STE, 1, .36, 1, .7], [1, .88, .045, 1, 0, WHI, 1, .22, 1, .92], [1, .98, .1, 2, 0, GRA, 1, .32, 1, .3], [1, .86, .045, 0, 0, SIL, 1, .2, 1, 0],
    [2, .8, .05, 0, 1, GLS, 0, 0, 1, .1], [2, .66, .02, 0, 0, SIL, 1, .18, 1, 0], [2, .76, .05, 0, 1, GLS, 0, 0, 1.1, .4], [2, .6, .02, 0, 0, SIL, 1, .18, 1, 0], [2, .7, .05, 0, 1, GLS, 0, 0, 1.2, .7], [2, .46, .025, 1, 0, WHI, 1, .18, 1, .3]
  ];
  const opaque = st.batch(D.length + 6), glass = st.batch(6);
  const rnd = prng(11), pts = new Float32Array(160 * 4);
  for (let i = 0; i < 160; i++) { const a = rnd() * 6.283, r = 2.2 + rnd() * 7.5; pts.set([Math.cos(a) * r, .2 + rnd() * 6.5, Math.sin(a) * r, rnd()], i * 4); }
  st.setPoints(pts);
  const ringOf = (r, ax, az, cy, sp, ph, col) => {
    const ca = Math.cos(ax), sa = Math.sin(ax), cz = Math.cos(az), sz = Math.sin(az);
    const m = new Float32Array([cz, sz, 0, 0, -sz * ca, cz * ca, sa, 0, sz * sa, -cz * sa, ca, 0, 0, cy, 0, 1]);
    return { r, w: .008, sp, ph, col, m, head: 0, at: a => { const x = Math.cos(a) * r, z = Math.sin(a) * r; return [m[0] * x + m[8] * z, m[1] * x + m[9] * z + cy, m[2] * x + m[10] * z]; } };
  };
  const rings = [ringOf(2.3, .34, .12, 1.4, .05, 0, [.42, .6, 1]), ringOf(2.95, -.22, .26, 2.3, .036, .4, [.42, .6, 1]), ringOf(3.6, .14, -.2, 3.0, .026, .75, [.42, .6, 1])];
  const labels = $$(".hero .co").map(el => ({ el, z: +el.dataset.z }));
  const zw = [1.36, 1.04, .82];
  const t0 = performance.now(); let last = t0;
  const frame = now => {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const time = RM ? 9 : (now - t0) / 1000;
    const { w, h, dpr } = st.size();
    if (!w || !h) return;
    const asp = w / h, narrow = asp < .9;
    const s = RM ? 0 : clamp(scrollY / Math.max(1, hero.offsetHeight));
    const k = 1 - Math.exp(-dt * 3); mouse.x += (mouse.tx - mouse.x) * k; mouse.y += (mouse.ty - mouse.y) * k;
    const appear = RM ? 1 : ss(0, 1.5, time);
    const spin = time * .07, twist = .118 + mouse.x * .06 + Math.sin(time * .32) * .012;
    opaque.n = 0; glass.n = 0;
    let y = .14, ph = 0; const zy = [[], [], []];
    D.forEach((d, i) => {
      const zg = i > 0 && d[0] !== D[i - 1][0] ? .2 + s * 1.15 : 0;
      y += ph + (i ? .05 + s * .09 : 0) + zg + d[2]; ph = d[2];
      const e = RM ? 1 : outExpo(clamp((time - .15 - i * .07) / 1.5));
      const py = y + (1 - e) * (2.6 + i * .3), rot = spin + i * twist + (1 - e) * 1.3 * (i % 2 ? 1 : -1);
      (d[4] ? glass : opaque).add(0, py, 0, d[1], d[2], d[1], rot, d[5][0], d[5][1], d[5][2], d[6], d[3], d[9], d[8], d[7]);
      zy[d[0]].push(py);
    });
    rings.forEach(r => { r.head = (time * r.sp + r.ph) % 1; const a = r.head * 6.2831853, p = r.at(a); opaque.add(p[0], p[1], p[2], .05, .05, .05, a, r.col[0], r.col[1], r.col[2], 0, 3, 0, 3.4, 0); });
    const yaw = .58 + mouse.x * .2 + s * .7, pitch = .15 - mouse.y * .05 + s * .2;
    const dist = (narrow ? 22.5 : 15) * (1 + (1 - appear) * .14);
    const tgt = [0, 2.05 + s * 1.3, 0];
    const eye = [tgt[0] + Math.sin(yaw) * Math.cos(pitch) * dist, tgt[1] + Math.sin(pitch) * dist, tgt[2] + Math.cos(yaw) * Math.cos(pitch) * dist];
    const view = lookAt(eye, tgt);
    const vp = mul4(persp(.52, asp, .5, 160, narrow ? 0 : (asp > 1.5 ? .42 : .37), narrow ? -.5 : .04), view.m);
    const c = toScreen(vp, [0, 2.1, 0], 1, 1);
    st.render({ vp, eye, time, bg: NIGHT, glow: [.14, .16, .64], fog: [dist * 1.25, dist * 3.4], bevel: .028, appear, mirror: true, ref: .55, floor: 0, center: [c[0], 1 - c[1]], opaque, glass, rings, points: true, px: h * dpr * .056, ao: 1, redk: .95 });
    if (!narrow) labels.forEach(L => {
      const arr = zy[L.z], my = arr.reduce((a, b) => a + b, 0) / arr.length, off = zw[L.z] * 1.22 + .15;
      const p = toScreen(vp, [view.x[0] * off, my, view.x[2] * off], w, h);
      if (!L.w) L.w = L.el.offsetWidth;
      L.el.style.transform = `translate3d(${Math.min(p[0], w - L.w - 20).toFixed(1)}px,${p[1].toFixed(1)}px,0) translate(0,-50%)`;
      L.el.style.opacity = (RM ? 1 : ss(2.1 + (2 - L.z) * .2, 2.9 + (2 - L.z) * .2, time) * (1 - ss(.3, .65, s))).toFixed(3);
    });
  };
  canvas.addEventListener("webglcontextlost", e => e.preventDefault());
  runLoop(hero, frame, () => { last = performance.now(); });
}
