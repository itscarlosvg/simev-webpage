/* Contacto: datos visibles, formulario, verificación y envío. */
import { $, $$ } from "../core/utils.js";
import { onResize, runResize } from "../core/loop.js";
import { CONFIG } from "../config.js";

export function initContacto() {
  {
    const dl = $("#cdata"), fc = $("#f-contact"), rows = [];
    const selectText = el => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    const add = (k, v, copy, href) => {
      const row = document.createElement("div"), dt = document.createElement("dt"), dd = document.createElement("dd");
      dt.className = "cap"; dt.textContent = k;
      if (href) { const a = document.createElement("a"); a.href = href; a.textContent = v; if (/^https?:/.test(href)) { a.target = "_blank"; a.rel = "noopener"; } dd.appendChild(a); } else dd.textContent = v;
      row.append(dt, dd);
      if (copy) {
        const b = document.createElement("button"); b.type = "button"; b.className = "copy"; b.textContent = "Copiar";
        b.addEventListener("click", () => {
          const done = () => { b.textContent = "Copiado"; setTimeout(() => b.textContent = "Copiar", 1600); };
          try { navigator.clipboard.writeText(v).then(done, () => selectText(dd)); } catch { selectText(dd); }
        });
        row.appendChild(b);
      } else row.appendChild(document.createElement("span"));
      rows.push(row);
      const li = document.createElement("li");
      if (href) { const a = document.createElement("a"); a.href = href; a.textContent = /^https?:/.test(href) ? k : v; if (/^https?:/.test(href)) { a.target = "_blank"; a.rel = "noopener"; } li.appendChild(a); } else li.textContent = v;
      fc.appendChild(li);
    };
    const short = u => u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
    if (CONFIG.email) add("Correo", CONFIG.email, true, "mailto:" + CONFIG.email);
    if (CONFIG.telefono) add("Teléfono", CONFIG.telefono, true, "tel:" + CONFIG.telefono.replace(/[^\d+]/g, ""));
    if (CONFIG.direccion) add("Dirección", CONFIG.direccion, false);
    if (CONFIG.linkedin) add("LinkedIn", short(CONFIG.linkedin), false, CONFIG.linkedin);
    if (CONFIG.instagram) add("Instagram", short(CONFIG.instagram), false, CONFIG.instagram);
    if (rows.length && dl) { dl.append(...rows); dl.hidden = false; }

    const fit = () => $$("[data-fit]").forEach(el => {
      const w = el.parentElement.clientWidth;
      el.style.fontSize = "100px";
      const tw = el.getBoundingClientRect().width;
      el.style.fontSize = Math.min(Math.floor(100 * w / tw * .985), +el.dataset.fitMax || 260) + "px";
    });
    fit(); onResize(fit);
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(fit); document.fonts.addEventListener && document.fonts.addEventListener("loadingdone", () => { fit(); runResize(); }); }

    const form = $("#form"), status = $("#status");
    if (!form) return;
    const msgs = { nombre: "Ingresa tu nombre.", correo: "Ingresa un correo válido.", mensaje: "Cuéntanos brevemente qué necesitas.", acepto: "Acepta la política para continuar." };
    // reCAPTCHA v3: invisible; el script de Google se carga solo cuando el formulario está cerca.
    const key = CONFIG.recaptchaSiteKey;
    const loadRecaptcha = () => {
      if (!key || $("#recaptcha-js")) return;
      const sc = document.createElement("script");
      sc.id = "recaptcha-js"; sc.async = true;
      sc.src = "https://www.google.com/recaptcha/api.js?render=" + encodeURIComponent(key) + "&hl=es-419";
      document.head.appendChild(sc);
    };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(es => { if (es.some(en => en.isIntersecting)) { io.disconnect(); loadRecaptcha(); } }, { rootMargin: "600px 0px" });
      io.observe(form);
    } else loadRecaptcha();
    form.addEventListener("focusin", loadRecaptcha, { once: true });
    const getToken = () => new Promise((ok, fail) => {
      loadRecaptcha();
      const t0 = Date.now();
      const wait = () => {
        if (window.grecaptcha && grecaptcha.execute) grecaptcha.ready(() => grecaptcha.execute(key, { action: "contacto" }).then(ok, fail));
        else if (Date.now() - t0 > 10000) fail(new Error("No se pudo cargar la verificación. Revisa tu conexión e inténtalo de nuevo."));
        else setTimeout(wait, 150);
      };
      wait();
    });

    const check = input => {
      const f = input.closest(".fld"), err = $(".err", f);
      const ok = input.name === "correo" ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim())
        : input.name === "acepto" ? input.checked
        : input.value.trim().length > 1;
      f.toggleAttribute("data-bad", !ok); if (err) err.textContent = ok ? "" : msgs[input.name];
      input.setAttribute("aria-invalid", String(!ok)); return ok;
    };
    $$("[required]", form).forEach(i => {
      i.addEventListener(i.type === "checkbox" ? "change" : "input", () => { if (i.closest(".fld").hasAttribute("data-bad")) check(i); });
      if (i.type !== "checkbox") i.addEventListener("blur", () => { if (i.value) check(i); });
    });

    form.addEventListener("submit", async e => {
      e.preventDefault(); status.textContent = "";
      const bad = $$("[required]", form).filter(i => !check(i));
      if (bad.length) { bad[0].focus(); return; }
      const data = Object.fromEntries(new FormData(form));
      delete data.acepto;
      const btn = $("button[type=submit]", form); btn.disabled = true; status.textContent = "Enviando…";
      try {
        data.recaptcha = await getToken();
        const r = await fetch(CONFIG.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
        const res = await r.json().catch(() => ({}));
        if (!r.ok || !res.ok) throw new Error(res.error || "");
        form.reset();
        status.textContent = "Mensaje enviado. Te contactaremos a la brevedad.";
      } catch (err) {
        status.textContent = err.message || "No se pudo enviar. Inténtalo nuevamente en unos minutos.";
      }
      btn.disabled = false;
    });

  }
}
