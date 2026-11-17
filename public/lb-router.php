<?php
// LaunchBuilder router v66 (VPS) — decides what a domain opens:
//   • a white-label builder address (app.abc.com)      → the builder, with that workspace's name, logo and colours
//   • a connected domain or free subdomain (domains.json) → that account's published website
// nginx sends every request for a domain that isn't crecapo.tech here.
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

$types = array('html' => 'text/html; charset=utf-8', 'htm' => 'text/html; charset=utf-8', 'css' => 'text/css', 'js' => 'application/javascript', 'mjs' => 'application/javascript', 'json' => 'application/json', 'xml' => 'application/xml', 'txt' => 'text/plain; charset=utf-8', 'webmanifest' => 'application/manifest+json',
  'svg' => 'image/svg+xml', 'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'gif' => 'image/gif', 'webp' => 'image/webp', 'avif' => 'image/avif', 'ico' => 'image/x-icon',
  'mp4' => 'video/mp4', 'webm' => 'video/webm', 'mov' => 'video/quicktime', 'mp3' => 'audio/mpeg', 'pdf' => 'application/pdf', 'woff' => 'font/woff', 'woff2' => 'font/woff2', 'ttf' => 'font/ttf');
function send_file($real, $types, $cache) {
  $ext = strtolower(pathinfo($real, PATHINFO_EXTENSION));
  header('Content-Type: ' . (isset($types[$ext]) ? $types[$ext] : 'application/octet-stream'));
  header('Cache-Control: ' . $cache); header('Content-Length: ' . filesize($real)); readfile($real); exit;
}

/* ---------- white-label builder: app.abc.com opens the builder in the workspace's brand ---------- */
$tenants = jr($DATA . '/tenants.json');
foreach ($tenants as $tid => $t) {
  if (empty($t['app_domain']) || strtolower($t['app_domain']) !== $bare) continue;
  if (isset($t['active']) && !$t['active']) nf('This workspace is paused. Please contact support.');
  $rel = rawurldecode((string)parse_url($path, PHP_URL_PATH));
  if (strpos($rel, '..') !== false || preg_match('#/(\.|lb-data(/|$))#', $rel)) nf('Not found');
  if (substr($rel, -1) === '/') $rel .= 'index.html';
  $real = realpath($ROOT . $rel); $rootR = realpath($ROOT);
  $ext = $real ? strtolower(pathinfo($real, PATHINFO_EXTENSION)) : '';
  if ($real && strpos($real, $rootR . DIRECTORY_SEPARATOR) === 0 && is_file($real) && $ext !== 'php' && $real !== $rootR . '/index.html' && isset($types[$ext]))
  {
    /* published sites under the builder's own address run sandboxed, so their code can never read anyone's builder login */
    if (preg_match('#^/sites/#', $rel)) header("Content-Security-Policy: sandbox allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads allow-top-navigation-by-user-activation");
    send_file($real, $types, preg_match('#^/assets/#', $rel) ? 'public, max-age=31536000, immutable' : (preg_match('#^/sites/#', $rel) ? 'no-cache' : 'public, max-age=3600'));
  }
  if (preg_match('#^/sites/#', $rel)) nf('Page not found');
  /* everything else → the builder page with the workspace's brand */
  $h = (string)@file_get_contents($ROOT . '/index.html');
  $name = !empty($t['product']) ? $t['product'] : (!empty($t['name']) ? $t['name'] : 'Website Builder');
  $e = function ($v) { return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); };
  $pub = array('id' => $tid, 'name' => isset($t['name']) ? $t['name'] : '', 'product' => $name, 'logo' => isset($t['logo']) ? $t['logo'] : '', 'color' => isset($t['color']) ? $t['color'] : '', 'color2' => isset($t['color2']) ? $t['color2'] : '',
    'support_email' => isset($t['support_email']) ? $t['support_email'] : '', 'whatsapp' => isset($t['whatsapp']) ? $t['whatsapp'] : '', 'sites_domain' => isset($t['sites_domain']) ? $t['sites_domain'] : '');
  $inj = '<script>window.LB_TENANT=' . json_encode($pub, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_SLASHES) . '</script>';
  $c1 = preg_match('/^#[0-9a-fA-F]{6}$/', isset($t['color']) ? $t['color'] : '') ? $t['color'] : ''; $c2 = preg_match('/^#[0-9a-fA-F]{6}$/', isset($t['color2']) ? $t['color2'] : '') ? $t['color2'] : $c1;
  if ($c1) $inj .= '<style>:root{--lb-y:' . $c1 . ';--lb-y2:' . $c2 . ';--lb-yr:' . implode(',', array_map('hexdec', str_split(substr($c1, 1), 2))) . '}</style>';
  $h = preg_replace('#<title>[^<]*</title>#', '<title>' . $e($name) . '</title>', $h, 1);
  $h = str_replace('LaunchBuilder', $e($name), preg_replace('/<!--.*?-->/s', '', $h));
  if (!empty($t['logo'])) $h = preg_replace('#<link rel="icon"[^>]*>#', '<link rel="icon" href="' . $e($t['logo']) . '">', $h);
  $h = preg_replace('/<head([^>]*)>/i', '<head$1>' . $inj, $h, 1);
  header('Content-Type: text/html; charset=utf-8'); header('Cache-Control: no-cache'); echo $h; exit;
}

// which site does this domain show?
$cfg = jr($DATA . '/config.json'); $map = jr($DATA . '/domains.json'); $target = '';
if (isset($map[$bare])) $target = $map[$bare];
elseif (isset($map[$host])) $target = $map[$host];
elseif (!empty($cfg['sites_domain'])) {
  /* old automatic subdomains: kept only for websites made before accounts (new ones use Free subdomains, 5 per account) */
  $sd = $cfg['sites_domain']; $own = jr($DATA . '/owners.json');
  if (substr($bare, -strlen('.' . $sd)) === '.' . $sd) { $label = substr($bare, 0, -strlen('.' . $sd)); if (preg_match('/^[a-z0-9][a-z0-9-]{0,60}$/', $label) && (!isset($own[$label]) || $own[$label] === 'owner')) $target = $label; }
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
$ext = strtolower(pathinfo($real, PATHINFO_EXTENSION));
send_file($real, $types, $ext === 'html' ? 'no-cache' : 'public, max-age=86400');
