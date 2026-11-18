/* Shaders GLSL de las escenas 3D: fondo, cajas con bisel y vidrio, suelo reflectante, anillos y partículas. */
export const GL_UNI = `#version 300 es
precision highp float;
uniform mat4 uVP; uniform vec3 uCam; uniform vec3 uBg; uniform vec3 uGlow; uniform float uTime; uniform vec2 uFog; uniform vec2 uRes; uniform vec2 uC; uniform float uAppear;
const vec3 BLUE = vec3(0.24, 0.5, 1.0); const vec3 VIOLET = BLUE; const vec3 RED = vec3(0.0);
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
`;
export const GL_FS = GL_UNI + `
vec3 backdrop(){ return uBg; }
vec3 tone(vec3 c){ return vec3(1.0) - exp(-c * 1.25); }
vec3 fogged(vec3 c, vec3 w){ return mix(c, backdrop(), smoothstep(uFog.x, uFog.y, length(w - uCam))); }
`;
export const VS_BACK = `#version 300 es
void main(){ vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;
export const FS_BACK = GL_FS + `out vec4 o;
void main(){ vec3 c = backdrop(); c += (hash(gl_FragCoord.xy) - 0.5) / 128.0; o = vec4(c, 1.0); }`;

export const VS_BOX = GL_UNI + `
layout(location=0) in vec3 aPos; layout(location=1) in vec3 aNor;
layout(location=2) in vec3 iPos; layout(location=3) in vec3 iHalf; layout(location=4) in float iRot; layout(location=5) in vec4 iCol; layout(location=6) in vec4 iFx;
uniform float uMirror;
out vec3 vLocal; out vec3 vHalf; out vec3 vFaceN; out vec2 vSC; out vec4 vCol; out vec4 vFx; out vec3 vWorld;
void main(){
  vec3 l = aPos * iHalf; float s = sin(iRot), c = cos(iRot);
  vec3 w = vec3(l.x * c + l.z * s, l.y, -l.x * s + l.z * c) + iPos;
  w.y *= uMirror;
  vLocal = l; vHalf = iHalf; vFaceN = aNor; vSC = vec2(s, c); vCol = iCol; vFx = iFx; vWorld = w;
  gl_Position = uVP * vec4(w, 1.0);
}`;
export const FS_BOX = GL_FS + `
in vec3 vLocal; in vec3 vHalf; in vec3 vFaceN; in vec2 vSC; in vec4 vCol; in vec4 vFx; in vec3 vWorld;
uniform float uMirror; uniform float uBevel; uniform float uGlass; uniform float uRef; uniform float uAO; uniform float uRedK;
out vec4 o;
vec3 rotY(vec3 v){ return vec3(v.x * vSC.y + v.z * vSC.x, v.y, -v.x * vSC.x + v.z * vSC.y); }
vec3 env(vec3 r, float rough){
  float b = mix(0.03, 0.4, rough);
  vec3 c = mix(vec3(0.05), vec3(0.16), smoothstep(-0.6, 0.9, r.y));
  c += vec3(0.05) * smoothstep(0.05, -0.7, r.y);
  c += vec3(0.72) * smoothstep(0.02, 0.8, r.y) * 0.6;
  c += vec3(1.25, 1.3, 1.42) * smoothstep(0.52 - b, 0.78 + b * 0.3, r.y) * (1.0 - 0.45 * rough);
  c += vec3(0.95) * pow(max(dot(r, normalize(vec3(0.75, 0.3, 0.6))), 0.0), mix(42.0, 6.0, rough)) * 1.5;
  c += RED * pow(max(dot(r, normalize(vec3(-0.85, 0.15, -0.3))), 0.0), mix(26.0, 6.0, rough)) * uRedK;
  c += vec3(0.45) * exp(-abs(r.y) * mix(22.0, 7.0, rough)) * 0.44;
  return c;
}
void main(){
  float r = min(uBevel, min(vHalf.x, min(vHalf.y, vHalf.z)) * 0.8);
  vec3 q = abs(vLocal) - (vHalf - r);
  vec3 nl = normalize(max(q, 0.0) + 1e-5) * sign(vLocal + 1e-6);
  vec3 N = rotY(nl); N.y *= uMirror;
  vec3 V = normalize(uCam - vWorld);
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  vec3 R = reflect(-V, N);
  float type = vFx.x, seed = vFx.y, glow = vFx.z, rough = vFx.w, metal = vCol.a;
  vec3 base = vCol.rgb;
  vec3 fa = abs(vFaceN);
  float side = 1.0 - step(0.5, fa.y);
  float u = fa.x > 0.5 ? vLocal.z : vLocal.x;
  float hw = fa.x > 0.5 ? vHalf.z : vHalf.x;
  float v = vLocal.y, hv = vHalf.y;
  float fogk = 1.0 - smoothstep(uFog.x, uFog.y, length(vWorld - uCam));
  if (uGlass > 0.5) {
    float fres = pow(1.0 - ndv, 2.2);
    vec3 gc = mix(BLUE, BLUE, clamp(seed * 1.3, 0.0, 1.0));
    vec3 c = gc * (0.08 + fres * 1.15) + env(R, 0.08) * fres * 0.45;
    if (fa.y > 0.5) {
      vec2 g = vLocal.xz * 5.0 + seed * 3.0;
      vec2 gw = fwidth(g) * 1.5;
      vec2 gl2 = 1.0 - smoothstep(vec2(0.0), gw, abs(fract(g) - 0.5));
      float run = 0.5 + 0.5 * sin((vLocal.x + vLocal.z) * 4.0 - uTime * 1.3 + seed * 10.0);
      c += gc * max(gl2.x, gl2.y) * (0.14 + 0.6 * run);
    }
    float ev = fa.y > 0.5 ? vHalf.z - abs(vLocal.z) : hv - abs(v);
    float e = min(hw - abs(u), ev);
    c += mix(gc, vec3(1.0), 0.45) * (1.0 - smoothstep(0.0, 0.022, e)) * 0.9;
    o = vec4(tone(c * glow) * fogk * uAppear, 1.0);
    return;
  }
  vec3 col; vec3 emi = vec3(0.0);
  if (type > 2.5 && type < 3.5) {
    col = base * glow;
  } else {
    vec3 L = normalize(vec3(-0.35, 0.9, 0.3));
    float dif = max(dot(N, L), 0.0);
    vec3 F0 = mix(vec3(0.04), base, metal);
    vec3 F = F0 + (1.0 - F0) * pow(1.0 - ndv, 5.0);
    col = base * (1.0 - metal) * (0.08 + 0.9 * dif) + env(R, rough) * F * (1.0 - 0.35 * rough) + base * metal * dif * 0.07;
    if (uAO > 0.5 && fa.y > 0.5) {
      float e2 = max(abs(vLocal.x) / vHalf.x, abs(vLocal.z) / vHalf.z);
      col *= mix(0.5, 1.0, smoothstep(0.5, 1.0, e2));
    }
    if (type > 0.5 && type < 1.5) {
      float w = min(0.012, hv * 0.3);
      float strip = (1.0 - smoothstep(w * 0.6, w, abs(v))) * step(abs(u), hw - 0.05) * side;
      float flow = 0.55 + 0.45 * sin(u * 2.5 - uTime * 1.4 + seed * 31.0);
      vec3 lc = seed > 0.86 ? RED : mix(BLUE, VIOLET, fract(seed * 5.0));
      emi = lc * (strip * flow * 2.8 + exp(-abs(v) / (w * 5.0)) * side * 0.12) * glow;
    } else if (type > 1.5 && type < 2.5) {
      float band = step(abs(v), hv * 0.55) * step(abs(u), hw - 0.14) * side;
      float k = u * 9.0;
      float aw = fwidth(k);
      float slot = smoothstep(0.25 - aw, 0.25 + aw, abs(fract(k) - 0.5));
      col *= 1.0 - 0.55 * band * slot;
      vec2 lp = vec2(u + hw - 0.07, v);
      emi = (seed > 0.86 ? RED : BLUE) * (1.0 - smoothstep(0.012, 0.022, length(lp))) * side * (0.55 + 0.45 * sin(uTime * 2.0 + seed * 40.0)) * 2.4 * glow;
    } else if (type > 3.5 && type < 4.5) {
      if (fa.y > 0.5 && vFaceN.y > 0.0) {
        vec2 g = vLocal.xz * 7.0; vec2 id = floor(g); vec2 f = fract(g) - 0.5; float hs = hash(id + seed);
        float tr = hs > 0.5 ? abs(f.x) : abs(f.y);
        col += vec3(0.12) * (1.0 - smoothstep(0.03, 0.08, tr));
        col += vec3(0.4) * (1.0 - smoothstep(0.08, 0.13, length(f))) * step(0.84, hs) * 0.5;
      }
    } else if (type > 4.5 && type < 5.5) {
      if (fa.z > 0.5) {
        float rr = length(vec2(u, v)) / min(hw, hv);
        float blades = smoothstep(-0.25, 0.25, sin(atan(v, u) * 7.0 + uTime * 9.0 * (0.6 + seed) + rr * 2.5));
        float disk = 1.0 - smoothstep(0.82, 0.86, rr);
        float hub = 1.0 - smoothstep(0.22, 0.26, rr);
        col = mix(col, col * (0.3 + 0.9 * blades), disk * (1.0 - hub));
        emi = BLUE * (1.0 - smoothstep(0.0, 0.035, abs(rr - 0.9))) * 0.55 * glow;
      }
    } else if (type > 6.5) {
      if (fa.y > 0.5 && vFaceN.y > 0.0) {
        vec2 g = vLocal.xz * 9.0; vec2 f = fract(g) - 0.5;
        float area = step(abs(vLocal.x), vHalf.x * 0.82) * step(-vHalf.z * 0.15, vLocal.z) * step(vLocal.z, vHalf.z * 0.8);
        float gw2 = fwidth(g.x) * 1.2;
        col *= 1.0 - 0.6 * area * (1.0 - smoothstep(0.26 - gw2, 0.26 + gw2, length(f)));
        emi = BLUE * (1.0 - smoothstep(0.0, 0.02, abs(vLocal.z + vHalf.z * 0.55))) * step(abs(vLocal.x), vHalf.x * 0.5) * 1.6 * glow;
      }
    } else if (type > 5.5) {
      if (fa.z > 0.5 && vFaceN.z > 0.0) {
        vec2 lp = vec2(u + hw * 0.55, v + hv * 0.74);
        emi = (seed > 0.86 ? RED : BLUE) * (1.0 - smoothstep(0.02, 0.034, length(lp))) * (0.45 + 0.55 * step(0.5, fract(uTime * (0.7 + seed * 3.0) + seed * 9.0))) * 2.6 * glow;
        col *= 1.0 - 0.5 * step(abs(v - hv * 0.25), 0.014) * step(abs(u), hw * 0.62);
      }
    }
  }
  col = tone(col + emi);
  col = fogged(col, vWorld);
  vec3 bd = backdrop();
  if (uMirror < 0.0) col = mix(bd, col, uRef * exp(-abs(vWorld.y) * 0.85));
  o = vec4(mix(bd, col, uAppear), 1.0);
}`;

export const VS_FLOOR = GL_UNI + `layout(location=0) in vec3 aPos; out vec3 vW; void main(){ vW = aPos; gl_Position = uVP * vec4(aPos, 1.0); }`;
export const FS_FLOOR = GL_FS + `
in vec3 vW; uniform float uMode; out vec4 o;
void main(){
  float r = length(vW.xz);
  float pw = length(fwidth(vW.xz));
  float lines;
  if (uMode < 0.5) {
    float dr = abs(fract(r * 0.5 + 0.5) - 0.5) * 2.0;
    float ring = 1.0 - smoothstep(0.0, pw * 1.6, dr);
    float st = 3.14159265 / 18.0;
    float da = abs(fract(atan(vW.z, vW.x) / st + 0.5) - 0.5) * st * r;
    float tick = (1.0 - smoothstep(0.0, pw * 1.6, da)) * (step(2.0, r) * step(r, 2.22) + step(4.0, r) * step(r, 4.14) + step(6.0, r) * step(r, 6.1));
    lines = max(ring, tick);
  } else {
    vec2 g = abs(fract(vW.xz + 0.5) - 0.5) / fwidth(vW.xz);
    lines = 1.0 - min(min(g.x, g.y), 1.0);
  }
  vec3 bd = backdrop();
  vec3 col = uBg * 0.82 + vec3(0.3, 0.28, 0.9) * lines * (1.0 - smoothstep(2.0, 11.0, r)) * 0.55;
  col += mix(BLUE, VIOLET, 0.6) * exp(-r * r / 5.0) * 0.16;
  float a = mix(0.66, 1.0, smoothstep(1.2, 6.5, r));
  float f = smoothstep(uFog.x, uFog.y, length(vW - uCam));
  col = mix(col, bd, f);
  o = vec4(mix(bd, col, uAppear), max(a, f));
}`;

export const VS_RING = GL_UNI + `layout(location=0) in vec2 aRing; uniform mat4 uM; uniform float uR; uniform float uW; out float vA; out vec3 vW;
void main(){ float rr = uR + aRing.y * uW; vec4 w = uM * vec4(cos(aRing.x) * rr, 0.0, sin(aRing.x) * rr, 1.0); vA = aRing.x; vW = w.xyz; gl_Position = uVP * w; }`;
export const FS_RING = GL_UNI + `in float vA; in vec3 vW; uniform float uHead; uniform vec3 uCol; out vec4 o;
void main(){
  float d = fract(vA / 6.2831853 - uHead + 0.5) - 0.5;
  float tail = d < 0.0 ? exp(d * 15.0) : exp(-d * d * 6000.0);
  float fogk = 1.0 - smoothstep(uFog.x, uFog.y, length(vW - uCam));
  o = vec4(uCol * (0.16 + tail * 1.35) * fogk * uAppear, 1.0);
}`;
export const VS_PTS = GL_UNI + `layout(location=0) in vec4 aP; uniform float uPx; out float vS;
void main(){ vec3 p = aP.xyz; float s = aP.w;
  p.y += sin(uTime * 0.25 + s * 40.0) * 0.35; p.x += cos(uTime * 0.17 + s * 23.0) * 0.25; p.z += sin(uTime * 0.21 + s * 11.0) * 0.25;
  vS = s; gl_Position = uVP * vec4(p, 1.0); gl_PointSize = uPx * (0.5 + 2.4 * fract(s * 7.31)) / gl_Position.w; }`;
export const FS_PTS = GL_UNI + `in float vS; out vec4 o;
void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); a *= a;
  vec3 c = mix(vec3(0.82, 0.82, 1.0), VIOLET, fract(vS * 3.7));
  o = vec4(c * a * (0.12 + 0.4 * fract(vS * 5.3)) * uAppear, 1.0); }`;
