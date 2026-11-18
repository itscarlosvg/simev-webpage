<?php
/* Copia este archivo como config.php y completa la clave secreta. config.php nunca se sube al repositorio. */
return [
    'recaptcha_secret' => '',                     // clave secreta de reCAPTCHA v3
    'to'               => 'maria@simev.cl',        // destinatario de los mensajes
    'from'             => 'no-reply@simev.cl',     // remitente: debe ser del dominio simev.cl
    'min_score'        => 0.5,                     // puntuación mínima de reCAPTCHA v3 (0 = bot, 1 = humano)
    'from_name'        => 'Sitio web SIMEV',
    'allowed_hosts'    => ['simev.cl', 'www.simev.cl'],
    'rate_limit'       => 5,                       // máximo de envíos por IP…
    'rate_window'      => 3600,                    // …en este intervalo (segundos)
];
