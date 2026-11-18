<?php
/* Recibe el formulario de contacto, verifica reCAPTCHA v3 en Google y envía el mensaje por correo. */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');
header('Cache-Control: no-store');

function respond(int $code, array $body): never {
    http_response_code($code);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

$cfg = require __DIR__ . '/config.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, ['ok' => false, 'error' => 'Método no permitido.']);
}

// Solo se aceptan envíos desde el propio sitio.
$origin = parse_url($_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '', PHP_URL_HOST);
if ($origin && !in_array(strtolower($origin), $cfg['allowed_hosts'], true)) {
    respond(403, ['ok' => false, 'error' => 'Origen no permitido.']);
}

$raw = file_get_contents('php://input', false, null, 0, 20000);
$in = json_decode($raw ?: '', true);
if (!is_array($in)) $in = $_POST;

$field = fn(string $k, int $max) => mb_substr(trim(str_replace(["\r", "\0"], '', (string)($in[$k] ?? ''))), 0, $max);
$nombre   = $field('nombre', 120);
$empresa  = $field('empresa', 160);
$correo   = $field('correo', 160);
$telefono = $field('telefono', 40);
$interes  = $field('interes', 60);
$mensaje  = $field('mensaje', 5000);
$token    = (string)($in['recaptcha'] ?? '');

// Campo trampa: los humanos no lo ven; si viene con contenido, es un bot.
if ($field('web', 200) !== '') respond(200, ['ok' => true]);

if (mb_strlen($nombre) < 2 || mb_strlen($mensaje) < 2 || !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    respond(422, ['ok' => false, 'error' => 'Revisa los datos del formulario.']);
}
$interesesValidos = ['Venta de equipos', 'Mantenimiento', 'Ciberseguridad', 'Por definir'];
if (!in_array($interes, $interesesValidos, true)) $interes = 'Por definir';

// Límite de envíos por IP.
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$rlFile = sys_get_temp_dir() . '/simev_rl_' . hash('sha256', $ip);
$now = time();
$hits = array_filter((array)json_decode((string)@file_get_contents($rlFile), true), fn($t) => is_int($t) && $t > $now - $cfg['rate_window']);
if (count($hits) >= $cfg['rate_limit']) {
    respond(429, ['ok' => false, 'error' => 'Has enviado varios mensajes seguidos. Inténtalo más tarde.']);
}

// Verificación de reCAPTCHA con Google.
if ($cfg['recaptcha_secret'] === '' || $token === '') {
    respond(400, ['ok' => false, 'error' => 'No se pudo verificar el envío. Inténtalo de nuevo.']);
}
$post = http_build_query(['secret' => $cfg['recaptcha_secret'], 'response' => $token, 'remoteip' => $ip]);
$verify = false;
if (function_exists('curl_init')) {
    $ch = curl_init('https://www.google.com/recaptcha/api/siteverify');
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $post, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10]);
    $verify = curl_exec($ch);
    curl_close($ch);
} else {
    $verify = @file_get_contents('https://www.google.com/recaptcha/api/siteverify', false, stream_context_create([
        'http' => ['method' => 'POST', 'header' => 'Content-Type: application/x-www-form-urlencoded', 'content' => $post, 'timeout' => 10],
    ]));
}
$result = json_decode((string)$verify, true);
if (empty($result['success'])) {
    respond(400, ['ok' => false, 'error' => 'No pudimos verificar el reCAPTCHA. Inténtalo de nuevo.']);
}
if (($result['action'] ?? '') !== 'contacto' || (float)($result['score'] ?? 0) < (float)($cfg['min_score'] ?? 0.5)) {
    respond(400, ['ok' => false, 'error' => 'No pudimos confirmar que el envío es de una persona. Escríbenos a info@simev.cl.']);
}
if (!empty($result['hostname']) && !in_array(strtolower($result['hostname']), $cfg['allowed_hosts'], true)) {
    respond(403, ['ok' => false, 'error' => 'Origen no permitido.']);
}

// Correo.
$encode = fn(string $s) => '=?UTF-8?B?' . base64_encode($s) . '?=';
$subject = $encode("Contacto web SIMEV: $interes");
$body = "Nuevo mensaje desde el formulario de simev.cl\n\n"
      . "Nombre:    $nombre\n"
      . "Empresa:   " . ($empresa ?: '-') . "\n"
      . "Correo:    $correo\n"
      . "Teléfono:  " . ($telefono ?: '-') . "\n"
      . "Interés:   $interes\n\n"
      . "Mensaje:\n$mensaje\n\n"
      . "—\nEnviado el " . date('d-m-Y H:i') . " desde la IP $ip\n";
$headers = [
    'From: ' . $encode($cfg['from_name']) . " <{$cfg['from']}>",
    'Reply-To: ' . $encode($nombre) . " <$correo>",
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: SIMEV',
];
$sent = mail($cfg['to'], $subject, $body, implode("\r\n", $headers), '-f' . $cfg['from']);
if (!$sent) {
    respond(500, ['ok' => false, 'error' => 'No se pudo enviar. Inténtalo nuevamente en unos minutos.']);
}

$hits[] = $now;
@file_put_contents($rlFile, json_encode(array_values($hits)), LOCK_EX);
respond(200, ['ok' => true]);
