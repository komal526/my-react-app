<?php
// LaunchBuilder router (VPS mode) — decides which published website a domain opens.
// The web server (Caddy) sends every request for a non-builder domain here.
$ROOT = __DIR__; $DATA = $ROOT . '/lb-data'; $SITES = $ROOT . '/sites';
function jr($f) { if (!file_exists($f)) return array(); $j = json_decode((string)@file_get_contents($f), true); return is_array($j) ? $j : array(); }
function nf($msg) { http_response_code(404); header('Content-Type: text/html; charset=utf-8');
  echo '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Not found</title><body style="font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0;background:#f4f5f9;color:#333"><div style="text-align:center"><h1 style="font-size:48px;margin:0">404</h1><p>' . htmlspecialchars($msg) . '</p></div>'; exit; }

$host = strtolower(preg_replace('/:\d+$/', '', isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : ''));
$bare = preg_replace('/^www\./', '', $host);
$path = isset($_GET['lbpath']) ? (string)$_GET['lbpath'] : '/';
if ($path === '' || $path[0] !== '/') $path = '/' . $path;

// health checks from the builder (Connect & check) go to the real server file
if ($path === '/lb-server.php') { unset($_GET['lbpath']); include $ROOT . '/lb-server.php'; exit; }

// which site does this domain show?
$cfg = jr($DATA . '/config.json'); $map = jr($DATA . '/domains.json'); $target = '';
if (isset($map[$bare])) $target = $map[$bare];
elseif (!empty($cfg['sites_domain'])) {
  $sd = $cfg['sites_domain'];
  if (substr($bare, -strlen('.' . $sd)) === '.' . $sd) { $label = substr($bare, 0, -strlen('.' . $sd)); if (preg_match('/^[a-z0-9][a-z0-9-]{0,60}$/', $label)) $target = $label; }
}
if ($target === '') nf('This domain is not connected to a website yet.');
$parts = explode('/', $target, 2); $slug = $parts[0]; $page = isset($parts[1]) ? $parts[1] : '';
if (!preg_match('/^[a-z0-9][a-z0-9-]{0,60}$/', $slug)) nf('Not found');
$dir = $SITES . '/' . $slug;
if (!is_dir($dir)) nf('This website is not published yet.');

// map the URL to a file inside that site (never outside it)
$rel = rawurldecode(parse_url($path, PHP_URL_PATH));
if ($rel === '/' && $page !== '') $rel = '/' . $page;
if (substr($rel, -1) === '/') $rel .= 'index.html';
$file = $dir . $rel;
if (!is_file($file) && is_file($file . '.html')) $file .= '.html';
$real = realpath($file); $base = realpath($dir);
if ($real === false || strpos($real, $base . DIRECTORY_SEPARATOR) !== 0 || !is_file($real)) {
  if (is_file($dir . '/404.html')) { http_response_code(404); header('Content-Type: text/html; charset=utf-8'); readfile($dir . '/404.html'); exit; }
  nf('Page not found');
}
$types = array('html' => 'text/html; charset=utf-8', 'htm' => 'text/html; charset=utf-8', 'css' => 'text/css', 'js' => 'application/javascript', 'json' => 'application/json', 'xml' => 'application/xml', 'txt' => 'text/plain; charset=utf-8',
  'svg' => 'image/svg+xml', 'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'gif' => 'image/gif', 'webp' => 'image/webp', 'ico' => 'image/x-icon',
  'mp4' => 'video/mp4', 'webm' => 'video/webm', 'mov' => 'video/quicktime', 'pdf' => 'application/pdf', 'woff' => 'font/woff', 'woff2' => 'font/woff2');
$ext = strtolower(pathinfo($real, PATHINFO_EXTENSION));
header('Content-Type: ' . (isset($types[$ext]) ? $types[$ext] : 'application/octet-stream'));
header('Cache-Control: ' . ($ext === 'html' ? 'no-cache' : 'public, max-age=86400'));
header('Content-Length: ' . filesize($real));
readfile($real);
