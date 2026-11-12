/* Utilidades compartidas: selección del DOM, preferencias del usuario y funciones de interpolación. */
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const FINE = matchMedia("(hover: hover) and (pointer: fine)").matches;
export const WIDE = matchMedia("(min-width: 901px)");
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const outExpo = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
export const io3 = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const root = document.documentElement;
