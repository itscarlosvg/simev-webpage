/* Motor WebGL2: escenario con cajas instanciadas, suelo, anillos y partículas; respaldo SVG y bucle de render pausable. */
import { $, RM, FINE } from "../core/utils.js";
import { onResize } from "../core/loop.js";
import { v3 } from "./math.js";
import { VS_BACK, FS_BACK, VS_BOX, FS_BOX, VS_FLOOR, FS_FLOOR, VS_RING, FS_RING, VS_PTS, FS_PTS } from "./shaders.js";

export function Stage(canvas) {
  const gl = canvas.getContext("webgl2", { antialias: true, alpha: false, powerPreference: "high-performance" });
  if (!gl) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = (vs, fs) => {
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const cache = new Map();
    return { p, u: n => { if (!cache.has(n)) cache.set(n, gl.getUniformLocation(p, n)); return cache.get(n); } };
  };
  let P;
  try { P = { back: prog(VS_BACK, FS_BACK), box: prog(VS_BOX, FS_BOX), floor: prog(VS_FLOOR, FS_FLOOR), ring: prog(VS_RING, FS_RING), pts: prog(VS_PTS, FS_PTS) }; }
  catch (err) { console.warn("SIMEV 3D:", err.message); return null; }

  const cube = [];
  for (const n of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const a = [n[1], n[2], n[0]], b = v3.cross(n, a);
    for (const [s, t] of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]) cube.push(n[0] + a[0] * s + b[0] * t, n[1] + a[1] * s + b[1] * t, n[2] + a[2] * s + b[2] * t, n[0], n[1], n[2]);
  }
  const cubeBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube), gl.STATIC_DRAW);
  const batch = max => {
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuf);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, max * 60, gl.DYNAMIC_DRAW);
    [[2, 3, 0], [3, 3, 12], [4, 1, 24], [5, 4, 28], [6, 4, 44]].forEach(([l, n, off]) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, n, gl.FLOAT, false, 60, off); gl.vertexAttribDivisor(l, 1); });
    gl.bindVertexArray(null);
    const data = new Float32Array(max * 15);
    return { vao, buf, data, n: 0, add(...v) { if (this.n < max) { data.set(v, this.n * 15); this.n++; } } };
  };
  const vaoBack = gl.createVertexArray();
  const vaoFloor = gl.createVertexArray(); gl.bindVertexArray(vaoFloor);
  { const F = 70; gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-F, 0, -F, F, 0, -F, F, 0, F, -F, 0, -F, F, 0, F, -F, 0, F]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0); }
  const vaoRing = gl.createVertexArray(); gl.bindVertexArray(vaoRing);
  const RN = 180, ring = [];
  for (let i = 0; i <= RN; i++) { const a = i / RN * Math.PI * 2; ring.push(a, -1, a, 1); }
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ring), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const vaoPts = gl.createVertexArray(); let ptsN = 0;
  const setPoints = arr => { gl.bindVertexArray(vaoPts); gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0); ptsN = arr.length / 4; gl.bindVertexArray(null); };
  gl.bindVertexArray(null);

  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.75), w = canvas.clientWidth, h = canvas.clientHeight;
    const W = Math.max(1, Math.round(w * dpr)), H = Math.max(1, Math.round(h * dpr));
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    return { w, h, dpr };
  };
  const render = S => {
    const W = canvas.width, H = canvas.height;
    gl.viewport(0, 0, W, H);
    gl.depthMask(true);
    gl.clearColor(S.bg[0], S.bg[1], S.bg[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const use = pr => {
      gl.useProgram(pr.p);
      gl.uniformMatrix4fv(pr.u("uVP"), false, S.vp); gl.uniform3fv(pr.u("uCam"), S.eye); gl.uniform3fv(pr.u("uBg"), S.bg); gl.uniform3fv(pr.u("uGlow"), S.glow);
      gl.uniform1f(pr.u("uTime"), S.time); gl.uniform2fv(pr.u("uFog"), S.fog); gl.uniform2f(pr.u("uRes"), W, H); gl.uniform2fv(pr.u("uC"), S.center); gl.uniform1f(pr.u("uAppear"), S.appear);
      return pr;
    };
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
    use(P.back); gl.bindVertexArray(vaoBack); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.enable(gl.DEPTH_TEST);
    const boxes = (b, mirror, glass) => {
      if (!b || !b.n) return;
      const pr = use(P.box);
      gl.uniform1f(pr.u("uMirror"), mirror); gl.uniform1f(pr.u("uGlass"), glass); gl.uniform1f(pr.u("uBevel"), S.bevel); gl.uniform1f(pr.u("uRef"), S.ref); gl.uniform1f(pr.u("uAO"), S.ao); gl.uniform1f(pr.u("uRedK"), S.redk);
      gl.bindVertexArray(b.vao); gl.bindBuffer(gl.ARRAY_BUFFER, b.buf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, b.data, 0, b.n * 15);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, b.n);
    };
    if (S.mirror) boxes(S.opaque, -1, 0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    { const pr = use(P.floor); gl.uniform1f(pr.u("uMode"), S.floor); gl.bindVertexArray(vaoFloor); gl.drawArrays(gl.TRIANGLES, 0, 6); }
    gl.disable(gl.BLEND);
    boxes(S.opaque, 1, 0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.depthMask(false);
    boxes(S.glass, 1, 1);
    if (S.rings && S.rings.length) {
      const pr = use(P.ring); gl.bindVertexArray(vaoRing);
      for (const r of S.rings) { gl.uniformMatrix4fv(pr.u("uM"), false, r.m); gl.uniform1f(pr.u("uR"), r.r); gl.uniform1f(pr.u("uW"), r.w); gl.uniform1f(pr.u("uHead"), r.head); gl.uniform3fv(pr.u("uCol"), r.col); gl.drawArrays(gl.TRIANGLE_STRIP, 0, (RN + 1) * 2); }
    }
    if (S.points && ptsN) { const pr = use(P.pts); gl.uniform1f(pr.u("uPx"), S.px); gl.bindVertexArray(vaoPts); gl.drawArrays(gl.POINTS, 0, ptsN); }
    gl.depthMask(true); gl.disable(gl.BLEND); gl.bindVertexArray(null);
  };
  return { gl, batch, setPoints, size, render };
}

export const NIGHT = [7 / 255, 10 / 255, 31 / 255];
export const isoFallback = svg => {
  svg.removeAttribute("hidden"); svg.setAttribute("viewBox", "0 0 1000 700"); svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
  let o = "";
  for (let i = 0; i < 10; i++) { const w = 200 - i * 10, y = 600 - i * 46, cx = 700; o += `<path d="M${cx} ${y - w * .5}L${cx + w} ${y}L${cx} ${y + w * .5}L${cx - w} ${y}Z" fill="#0f1334" stroke="#7c4dff" stroke-opacity="${i % 3 === 2 ? .9 : .35}" stroke-width="1.5"/>`; }
  svg.innerHTML = o;
};
export const runLoop = (el, frame, onStart) => {
  if (RM) { frame(performance.now()); onResize(() => frame(performance.now())); return; }
  let vis = false, raf = 0;
  const loop = now => { frame(now); raf = vis && !document.hidden ? requestAnimationFrame(loop) : 0; };
  const kick = () => { if (!raf && vis && !document.hidden) { if (onStart) onStart(); raf = requestAnimationFrame(loop); } };
  new IntersectionObserver(([en]) => { vis = en.isIntersecting; kick(); }).observe(el);
  document.addEventListener("visibilitychange", kick);
};
export const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
if (FINE && !RM) addEventListener("pointermove", e => { mouse.tx = e.clientX / innerWidth * 2 - 1; mouse.ty = e.clientY / innerHeight * 2 - 1; }, { passive: true });
