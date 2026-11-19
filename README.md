<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="src/assets/img/logo-night.png">
  <img src="src/assets/img/logo-day.png" alt="SIMEV" width="300">
</picture>

### Sitio corporativo de Servicios Integrales MEV SpA

Equipos electrónicos y de oficina, servicio técnico y ciberseguridad para empresas en Chile.

[![Sitio](https://img.shields.io/badge/sitio-simev.cl-2f6bff?style=for-the-badge)](https://simev.cl)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-663399?style=for-the-badge&logo=css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![WebGL2](https://img.shields.io/badge/WebGL2-990000?style=for-the-badge&logo=webgl&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white)
![Licencia](https://img.shields.io/badge/licencia-todos%20los%20derechos%20reservados-ff3d6e?style=for-the-badge)

</div>

---

## Sobre el proyecto

Sitio web de SIMEV, empresa chilena que vende equipos electrónicos y de oficina a empresas, se encarga de su mantenimiento y ofrece un servicio de ciberseguridad.

Está hecho a mano, sin frameworks ni dependencias: HTML, CSS y JavaScript modernos, dos escenas 3D con un motor WebGL2 propio y un formulario de contacto protegido con reCAPTCHA v3 y verificado en el servidor con PHP. Node solo se usa para generar la versión publicable.

## Características

| | |
|---|---|
| **3D propio** | Motor WebGL2 escrito desde cero, sin Three.js, con respaldo en SVG cuando el navegador no tiene WebGL. |
| **Accesible** | Navegación por teclado, foco visible y respeto de `prefers-reduced-motion`. |
| **Adaptable** | Diseñado desde 320 px hasta pantallas grandes, sin desbordes horizontales. |
| **Rápido** | Sin dependencias en el navegador, recursos versionados con caché larga y compresión en el servidor. |
| **Formulario seguro** | reCAPTCHA v3 verificado en PHP, campo trampa, límite de envíos por IP y claves fuera del repositorio. |
| **Endurecido** | HTTPS obligatorio, cabeceras de seguridad y página 404 propia desde `.htaccess`. |
| **Legal** | Política de privacidad propia. |
| **Listo para Google** | Sitemap, robots, canonical, Open Graph y datos estructurados de schema.org (empresa, servicios y preguntas frecuentes). |

## Tecnologías

- **Frontend:** HTML5, CSS moderno (variables, `@import`, tipografía del sistema) y JavaScript con módulos ES.
- **Gráficos:** WebGL2 con shaders y matemáticas propias.
- **Servidor:** PHP 8 (`mail()` y verificación de reCAPTCHA) sobre Apache con `.htaccess`.
- **Herramientas:** Node 18+ para el build y el servidor local.

## Empezar

```bash
git clone https://github.com/itscarlosvg/simev-webpage.git
cd simev-webpage
cp src/public/api/config.example.php src/public/api/config.php   # y completa la clave secreta
npm run dev                                                    # http://localhost:4173
```

| Comando | Qué hace |
|---|---|
| `npm run build` | Genera `dist/`, la carpeta que se sube al hosting. |
| `npm run dev` | Genera `dist/` y la sirve en http://localhost:4173 |
| `npm run preview` | Genera además `preview/`, una versión de un solo archivo para revisiones. |

El formulario necesita PHP; para probarlo en local: `cd dist && php -S localhost:8000`.

## Estructura

```
src/
├── pages/                 Páginas: cada una declara sus variables y qué parciales incluye
│   ├── index.html
│   ├── privacidad.html
│   └── 404.html
├── partials/              Fragmentos HTML reutilizables
│   ├── head.html · header.html · footer.html · notfound.html
│   ├── legal/privacidad.html
│   ├── seo/               Datos estructurados de schema.org
│   └── sections/          Una sección de la portada por archivo
├── assets/
│   ├── css/
│   │   ├── main.css       Orden de carga (@import); el build lo combina en styles.css
│   │   ├── base/          Variables, reinicio, tipografía y retícula
│   │   ├── components/    Botones, navegación, ilustraciones y revelados
│   │   ├── sections/      Un archivo por sección de la portada
│   │   └── pages/         Estilos propios de otras páginas
│   ├── js/
│   │   ├── main.js        Punto de entrada: inicia cada módulo si su sección existe
│   │   ├── config.js      Datos de contacto, destino del formulario y clave pública de reCAPTCHA
│   │   ├── core/          Utilidades, bucle de animación y estado compartido
│   │   ├── modules/       Un módulo por sección o componente
│   │   └── gl/            Motor WebGL2 y las dos escenas 3D
│   └── img/
└── public/                Se copia tal cual a la raíz del sitio
    ├── .htaccess          HTTPS, caché, compresión, cabeceras y 404
    ├── robots.txt · sitemap.xml · site.webmanifest
    └── api/
        ├── enviar.php           Recibe el formulario, verifica reCAPTCHA y envía el correo
        ├── config.example.php   Plantilla de configuración (la real no se sube)
        └── .htaccess            Solo deja acceder a enviar.php
scripts/                   Build, servidor local y versión de un solo archivo
docs/SEO.md                Guía de indexación en Google
```

### Parciales y variables

En `src/pages/*.html`:

- `<!-- @include partials/ruta.html -->` inserta un parcial (pueden anidarse).
- `<!-- @vars title="…" description="…" -->` define variables que se usan como `{{title}}`.

El build añade `?v=<huella>` a `styles.css`, `main.js` y a cada import de JavaScript, así que el servidor puede pedir caché larga sin que nadie vea versiones viejas.

## Formulario de contacto

1. El navegador carga reCAPTCHA solo cuando el formulario está cerca, valida los campos y envía JSON a `api/enviar.php`.
2. `enviar.php` comprueba el origen, el campo trampa y el límite por IP, y verifica el token con Google.
3. Si todo es correcto, envía el mensaje con `mail()` y deja `Reply-To` con el correo del visitante.

La clave secreta, el destinatario y el remitente están en `src/public/api/config.php`, que está en `.gitignore` y además queda bloqueado en el servidor.

## Publicar en cPanel

1. `npm run build`
2. En el Administrador de archivos de cPanel, entra en `public_html` y respalda lo que haya.
3. Sube el **contenido** de `dist/` a `public_html`. Activa «Mostrar archivos ocultos» para ver los `.htaccess`.
4. Activa SSL con AutoSSL. `.htaccess` ya redirige a `https://simev.cl` sin www.
5. Crea la cuenta `no-reply@simev.cl` y activa SPF y DKIM en **Correo → Entregabilidad**.

## Indexación en Google

Todo lo que trae el sitio para buscadores y los pasos para darlo de alta en Google Search Console están en [docs/SEO.md](docs/SEO.md).

## Autor

**Carlos Vispo** · Vispo & Co. · [@itscarlosvg](https://github.com/itscarlosvg)

## Licencia

Copyright © 2026 Carlos Adolfo Vispo González. Todos los derechos reservados. Consulta [LICENSE](LICENSE).

La marca, el nombre y el logotipo de SIMEV pertenecen a Servicios Integrales MEV SpA.
