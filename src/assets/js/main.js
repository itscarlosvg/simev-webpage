/* Punto de entrada: inicia cada módulo solo si su sección existe en la página. */
import { $ } from "./core/utils.js";
import { initNav } from "./modules/nav.js";
import { initReveal } from "./modules/reveal.js";
import { initHero } from "./modules/hero.js";
import { initEmpresa } from "./modules/empresa.js";
import { initSoluciones } from "./modules/soluciones.js";
import { initEcosistema } from "./modules/ecosistema.js";
import { initMetodo } from "./modules/metodo.js";
import { initServicio } from "./modules/servicio.js";
import { initPreguntas } from "./modules/preguntas.js";
import { initContacto } from "./modules/contacto.js";
import { initHeroScene } from "./gl/hero-scene.js";
import { initServicioScene } from "./gl/servicio-scene.js";

const modules = [
  [initNav, "#nav"],
  [initReveal, "body"],
  [initHero, "#inicio"],
  [initEmpresa, "#empresa"],
  [initSoluciones, "#soluciones"],
  [initEcosistema, "#ecosistema"],
  [initMetodo, "#metodo"],
  [initServicio, "#servicio"],
  [initPreguntas, "#preguntas"],
  [initContacto, "#f-contact"],
  [initHeroScene, "#hero-gl"],
  [initServicioScene, "#show-gl"]
];

for (const [init, selector] of modules) {
  if (!$(selector)) continue;
  try { init(); } catch (err) { console.error(`SIMEV: no se pudo iniciar ${init.name}`, err); }
}
