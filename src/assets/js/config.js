/* Configuración del sitio: datos de contacto y destino del formulario.
   Los campos vacíos no se muestran en la página. */
export const CONFIG = {
  email: "info@simev.cl",
  telefono: "+56 9 4665 4808",
  direccion: "",
  linkedin: "",       // URL completa
  instagram: "",      // URL completa
  formEndpoint: "api/enviar.php",   // script PHP que verifica el reCAPTCHA y envía el correo
  recaptchaSiteKey: "6Ld6LR0uAAAAALi-QhFT9f_lp0DTc6EbU-CRB5RL"             // clave del sitio de reCAPTCHA v2 (pública)
};
