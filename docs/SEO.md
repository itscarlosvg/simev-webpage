# Indexación en Google

Qué trae el sitio para buscadores y qué hay que hacer una vez publicado para que Google lo indexe.

## Qué incluye el sitio

| Archivo o etiqueta | Para qué sirve |
|---|---|
| `robots.txt` | Permite rastrear todo el sitio salvo `/api/` e indica dónde está el sitemap. |
| `sitemap.xml` | Lista de páginas indexables. El build pone la fecha de `lastmod` automáticamente. |
| `<title>` y `meta description` | Título y resumen que Google muestra en los resultados. Se definen en el `@vars` de cada página de `src/pages/`. |
| `link rel="canonical"` | Dirección oficial de cada página (`https://simev.cl/...`), para que Google no la duplique con o sin www. |
| `hreflang="es-CL"` | Indica que el contenido es en español de Chile. |
| `meta robots` | `index, follow` en la portada y la privacidad; `noindex` en la página 404. |
| Open Graph y Twitter | Título, descripción e imagen (`assets/img/og-simev.png`, 1200 × 630) al compartir el enlace en WhatsApp, LinkedIn, Facebook o X. |
| Datos estructurados (schema.org) | `Organization` y `WebSite` en todas las páginas; `Service` y `FAQPage` en la portada. El `FAQPage` se genera en el build a partir de la sección de preguntas, así que siempre coincide con lo que se ve. |
| `site.webmanifest` e iconos | Favicon, icono de iPhone y del navegador. |
| `.htaccess` | Fuerza `https://simev.cl` sin www (una sola versión del sitio) y devuelve un 404 real para direcciones inexistentes. |

Los datos de la empresa para buscadores están en `src/partials/seo/organizacion.html`. Si se agrega dirección física, LinkedIn o Instagram, hay que añadirlos ahí (`address`, `sameAs`) además de en `src/assets/js/config.js`.

## Pasos después de publicar

### 1. Comprobar que el sitio responde bien

- `https://simev.cl` carga y `http://simev.cl` y `https://www.simev.cl` redirigen a él.
- `https://simev.cl/robots.txt` y `https://simev.cl/sitemap.xml` se abren.
- `https://simev.cl/una-direccion-que-no-existe` muestra la página 404.

### 2. Dar de alta el sitio en Google Search Console

1. Entra en https://search.google.com/search-console con la cuenta de Google de la empresa.
2. **Agregar propiedad → Dominio** y escribe `simev.cl`.
3. Google entrega un registro **TXT** (`google-site-verification=...`).
4. En cPanel: **Dominios → Zone Editor → simev.cl → Administrar → Agregar registro**. Tipo `TXT`, nombre `simev.cl.`, valor el texto que dio Google.
5. Vuelve a Search Console y pulsa **Verificar**. Si no verifica, espera unos minutos (hasta 24 h) y repite.

La verificación por DNS cubre http, https, con y sin www, y no requiere subir archivos.

### 3. Enviar el sitemap

En Search Console: **Sitemaps → Agregar un sitemap nuevo**, escribe `sitemap.xml` y pulsa **Enviar**. Debe quedar en estado «Correcto» con 2 páginas descubiertas.

### 4. Pedir la indexación de la portada

**Inspección de URLs** → pega `https://simev.cl/` → **Solicitar indexación**. Repite con `https://simev.cl/privacidad.html`.

Google suele indexar en días; aparecer arriba para búsquedas genéricas lleva semanas.

### 5. Validar los datos estructurados

- https://search.google.com/test/rich-results con `https://simev.cl/`: debe detectar **Preguntas frecuentes** y **Organización** sin errores.
- https://validator.schema.org para revisar todo el marcado.

### 6. Revisar la vista previa al compartir

- https://www.opengraph.xyz o el **Post Inspector** de LinkedIn con `https://simev.cl/`.
- Si WhatsApp o Facebook muestran una vista previa antigua, usa https://developers.facebook.com/tools/debug y pulsa **Volver a extraer**.

### 7. Perfil de empresa en Google (recomendado)

Para aparecer en Google Maps y en el panel lateral al buscar «SIMEV», crea el perfil en https://business.google.com con el mismo nombre, teléfono (+56 9 4665 4808), correo y web (`https://simev.cl`) que figuran en el sitio. Mantener esos datos idénticos en todas partes ayuda a Google a relacionarlos.

### 8. Bing (opcional)

En https://www.bing.com/webmasters elige **Importar desde Google Search Console**: copia el sitio y el sitemap automáticamente.

## Mantenimiento

- Cada vez que cambie el contenido, ejecuta `npm run build` y sube `dist/`: el sitemap se actualiza con la fecha del día.
- Si se agrega una página nueva, añádela a `src/public/sitemap.xml` y dale su `title`, `description` y `path` en el `@vars`.
- Revisa en Search Console, una vez al mes, **Páginas** (errores de indexación) y **Experiencia → Métricas web principales**.
