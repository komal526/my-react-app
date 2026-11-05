<?php
// LaunchBuilder server v6 — runs on your own hosting (Hostinger etc.), no extra service needed.
// • Publishes your pages to a public link:  https://your-site/sites/<name>/
// • Collects form submissions from live sites into your CRM
// • Routes your own domains to a published site
// Put this file in the same folder as the builder (public_html). It creates /sites and /lb-data automatically.

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$ROOT  = __DIR__;
$DATA  = $ROOT . '/lb-data';
$SITES = $ROOT . '/sites';
@ini_set('memory_limit', '512M');
if (!is_dir($DATA))  @mkdir($DATA, 0755, true);
if (!is_dir($SITES)) @mkdir($SITES, 0755, true);
if (!file_exists($DATA . '/.htaccess')) @file_put_contents($DATA . '/.htaccess', "Require all denied\nDeny from all\n");
if (!file_exists($DATA . '/index.html')) @file_put_contents($DATA . '/index.html', '');

function out($a)  { echo json_encode($a, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); exit; }
function fail($m) { out(array('ok' => false, 'error' => $m)); }
function jread($f, $def) { if (!file_exists($f)) return $def; $j = json_decode((string)@file_get_contents($f), true); return is_array($j) ? $j : $def; }
function jwrite($f, $v) {
  $fp = @fopen($f, 'c+'); if (!$fp) return false;
  flock($fp, LOCK_EX); ftruncate($fp, 0); rewind($fp);
  fwrite($fp, json_encode($v, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
  fflush($fp); flock($fp, LOCK_UN); fclose($fp); return true;
}
function rrmdir($d) {
  if (!is_dir($d)) return;
  foreach (scandir($d) as $x) { if ($x === '.' || $x === '..') continue; $p = $d . '/' . $x; if (is_dir($p)) rrmdir($p); else @unlink($p); }
  @rmdir($d);
}
/* Hostinger serves sites through a CDN / load balancer, so the address PHP sees is NOT the
   website's DNS address and changes between requests. Never guess it — the user copies it from hPanel. */
function server_ips() { return array('ip' => '', 'ip6' => ''); }
function clean_str($v, $max) { $v = is_scalar($v) ? (string)$v : ''; return function_exists('mb_substr') ? mb_substr($v, 0, $max) : substr($v, 0, $max); }

$https  = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
$prefix = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
$BASE   = ($https ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . $prefix;

$raw = file_get_contents('php://input');
$d = json_decode($raw ? $raw : '{}', true);
if (!is_array($d)) $d = array();
$act = isset($d['action']) ? $d['action'] : (isset($_GET['action']) ? $_GET['action'] : 'info');
$cfg = jread($DATA . '/config.json', array());

/* ---------------- public actions (used by your live websites) ---------------- */
if ($act === 'info') out(array('ok' => true, 'app' => 'launchbuilder', 'version' => 1, 'configured' => !empty($cfg['key'])));

if ($act === 'lead') {
  // simple flood protection: max 30 submissions per minute per visitor
  $ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '0';
  $rate = jread($DATA . '/rate.json', array()); $now = time(); $k = md5($ip);
  foreach ($rate as $rk => $rv) if ($rv['t'] < $now - 60) unset($rate[$rk]);
  if (isset($rate[$k]) && $rate[$k]['n'] >= 30) fail('Too many submissions, try again in a minute.');
  $rate[$k] = array('t' => isset($rate[$k]) ? $rate[$k]['t'] : $now, 'n' => isset($rate[$k]) ? $rate[$k]['n'] + 1 : 1);
  jwrite($DATA . '/rate.json', $rate);

  $l = isset($d['lead']) && is_array($d['lead']) ? $d['lead'] : null;
  if (!$l) fail('No lead');
  $data = array();
  if (isset($l['data']) && is_array($l['data'])) foreach (array_slice($l['data'], 0, 40, true) as $fk => $fv) $data[clean_str($fk, 60)] = clean_str($fv, 4000);
  $lead = array(
    'lid' => preg_replace('/[^A-Za-z0-9]/', '', clean_str(isset($l['lid']) ? $l['lid'] : uniqid('L'), 40)),
    'form' => clean_str(isset($l['form']) ? $l['form'] : 'Form', 120), 'formId' => clean_str(isset($l['formId']) ? $l['formId'] : '', 40),
    'site' => preg_replace('/[^a-z0-9-]/', '', clean_str(isset($l['site']) ? $l['site'] : '', 64)),
    'page' => clean_str(isset($l['page']) ? $l['page'] : '', 120), 'url' => clean_str(isset($l['url']) ? $l['url'] : '', 400),
    'data' => $data, 'ts' => round(microtime(true) * 1000), 'source' => 'live-site',
  );
  if (isset($l['payment']) && is_array($l['payment'])) $lead['payment'] = array('status' => 'pending', 'amount' => (float)(isset($l['payment']['amount']) ? $l['payment']['amount'] : 0), 'mode' => clean_str(isset($l['payment']['mode']) ? $l['payment']['mode'] : '', 20));
  $all = jread($DATA . '/leads.json', array());
  $all[] = $lead;
  if (count($all) > 20000) $all = array_slice($all, -20000);
  jwrite($DATA . '/leads.json', $all);
  out(array('ok' => true));
}

/* booked times for a calendar event, so the same slot can't be booked twice */
if ($act === 'busy') {
  $fid = clean_str(isset($d['formId']) ? $d['formId'] : '', 40);
  $busy = array();
  if ($fid !== '') foreach (jread($DATA . '/leads.json', array()) as $l) {
    if (isset($l['formId']) && $l['formId'] === $fid && isset($l['data']['date']) && isset($l['data']['time']) && (!isset($l['status']) || $l['status'] !== 'cancelled')) $busy[] = $l['data']['date'] . ' ' . $l['data']['time'];
  }
  out(array('ok' => true, 'busy' => array_values(array_unique($busy))));
}

if ($act === 'leadpay') {
  $lid = preg_replace('/[^A-Za-z0-9]/', '', clean_str(isset($d['lid']) ? $d['lid'] : '', 40));
  $p = isset($d['payment']) && is_array($d['payment']) ? $d['payment'] : array();
  $st = in_array(isset($p['status']) ? $p['status'] : '', array('paid', 'claimed', 'pending'), true) ? $p['status'] : 'pending';
  $all = jread($DATA . '/leads.json', array());
  foreach ($all as $i => $l) if ($l['lid'] === $lid && $lid !== '') {
    $all[$i]['payment'] = array_merge(isset($l['payment']) ? $l['payment'] : array(), array('status' => $st, 'id' => clean_str(isset($p['id']) ? $p['id'] : '', 80), 'ref' => clean_str(isset($p['ref']) ? $p['ref'] : '', 80), 'ts' => round(microtime(true) * 1000)));
  }
  jwrite($DATA . '/leads.json', $all);
  out(array('ok' => true));
}

/* ---------------- owner actions (need your secret key) ---------------- */
$key = isset($d['key']) ? (string)$d['key'] : '';

if ($act === 'setup') {
  if (!empty($cfg['key'])) fail('This server is already connected to a builder. Paste its existing key, or delete lb-data/config.json in File Manager to reset.');
  if (strlen($key) < 16) fail('Key too short');
  if (!jwrite($DATA . '/config.json', array('key' => $key, 'created' => time())) || !file_exists($DATA . '/config.json')) fail('Could not save settings — in File Manager give the folder lb-data permission 755 (or create it), then try again.');
  out(array('ok' => true, 'base' => $BASE) + server_ips());
}
if (empty($cfg['key'])) fail('Server not set up yet — click Connect in Integrations.');
if (!hash_equals((string)$cfg['key'], $key)) fail('Wrong key for this server.');

if ($act === 'ping') out(array('ok' => true, 'base' => $BASE, 'php' => PHP_VERSION) + server_ips());

$ALLOWED = array('html', 'htm', 'xml', 'txt', 'css', 'js', 'json', 'mp4', 'webm', 'mov', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'ico', 'woff', 'woff2', 'pdf');
function valid_slug($s) { return is_string($s) && preg_match('/^[a-z0-9][a-z0-9-]{1,60}$/', $s); }

if ($act === 'publish') {
  $slug = isset($d['slug']) ? $d['slug'] : '';
  if (!valid_slug($slug)) fail('Use only lowercase letters, numbers and dashes for the link name.');
  $files = isset($d['files']) && is_array($d['files']) ? $d['files'] : array();
  if (!$files) fail('No files');
  $tmp = $SITES . '/.tmp-' . $slug . '-' . uniqid();
  @mkdir($tmp, 0755, true);
  foreach ($files as $f) {
    $name = isset($f['name']) ? (string)$f['name'] : '';
    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    if (!preg_match('#^[A-Za-z0-9][A-Za-z0-9._/-]*$#', $name) || strpos($name, '..') !== false || !in_array($ext, $ALLOWED, true)) { rrmdir($tmp); fail('Blocked file name: ' . $name); }
    $bin = base64_decode(isset($f['b64']) ? $f['b64'] : '', true);
    if ($bin === false) { rrmdir($tmp); fail('Bad file data: ' . $name); }
    $dest = $tmp . '/' . $name;
    if (!is_dir(dirname($dest))) @mkdir(dirname($dest), 0755, true);
    if (@file_put_contents($dest, $bin) === false) { rrmdir($tmp); fail('Could not write ' . $name . ' — check folder permissions.'); }
  }
  /* every extra page also gets its own folder (p/<page>/) so a subdomain can point at one page */
  foreach (glob($tmp . '/*.html') as $hf) {
    $bn = basename($hf, '.html');
    if ($bn === 'index' || $bn === '404') continue;
    $html = (string)file_get_contents($hf);
    $html = preg_replace('/<head([^>]*)>/i', '<head$1><base href="../../">', $html, 1);
    @mkdir($tmp . '/p/' . $bn, 0755, true);
    @file_put_contents($tmp . '/p/' . $bn . '/index.html', $html);
  }
  $target = $SITES . '/' . $slug;
  rrmdir($target);
  if (!@rename($tmp, $target)) { rrmdir($tmp); fail('Could not save the site folder.'); }
  out(array('ok' => true, 'slug' => $slug, 'url' => $BASE . '/sites/' . $slug . '/', 'folder' => 'public_html' . $prefix . '/sites/' . $slug));
}

if ($act === 'unpublish') {
  $slug = isset($d['slug']) ? $d['slug'] : '';
  if (!valid_slug($slug)) fail('Bad name');
  rrmdir($SITES . '/' . $slug);
  out(array('ok' => true));
}

if ($act === 'sites') {
  $list = array();
  foreach (scandir($SITES) as $x) if ($x[0] !== '.' && is_dir($SITES . '/' . $x)) $list[] = array('slug' => $x, 'url' => $BASE . '/sites/' . $x . '/', 'updated' => filemtime($SITES . '/' . $x) * 1000);
  out(array('ok' => true, 'sites' => $list));
}

if ($act === 'leads') {
  $since = isset($d['since']) ? (float)$d['since'] : 0;
  $all = jread($DATA . '/leads.json', array());
  $res = array(); foreach ($all as $l) if ($l['ts'] > $since || (isset($l['payment']['ts']) && $l['payment']['ts'] > $since)) $res[] = $l;
  out(array('ok' => true, 'leads' => $res, 'now' => round(microtime(true) * 1000)));
}

if ($act === 'deletelead') {
  $lids = isset($d['lids']) && is_array($d['lids']) ? $d['lids'] : array();
  $all = jread($DATA . '/leads.json', array());
  $all = array_values(array_filter($all, function ($l) use ($lids) { return !in_array($l['lid'], $lids, true); }));
  jwrite($DATA . '/leads.json', $all);
  out(array('ok' => true));
}

/* check from the server itself whether a domain really reaches THIS hosting folder */
if ($act === 'probe') {
  $domain = strtolower(trim(isset($d['domain']) ? (string)$d['domain'] : ''));
  if (!preg_match('/^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/', $domain)) fail('Invalid domain');
  $res = array('ok' => true, 'domain' => $domain, 'code' => 0, 'ours' => false, 'page' => 0);
  $get = function ($url) {
    if (function_exists('curl_init')) {
      $c = curl_init($url);
      curl_setopt_array($c, array(CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10, CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 3, CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => 0, CURLOPT_USERAGENT => 'LaunchBuilder-check'));
      $body = curl_exec($c); $code = (int)curl_getinfo($c, CURLINFO_HTTP_CODE); curl_close($c);
      return array($code, $body === false ? '' : (string)$body);
    }
    $ctx = stream_context_create(array('http' => array('timeout' => 10, 'ignore_errors' => true, 'header' => "User-Agent: LaunchBuilder-check\r\n"), 'ssl' => array('verify_peer' => false, 'verify_peer_name' => false)));
    $body = @file_get_contents($url, false, $ctx); $code = 0;
    if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) $code = (int)$m[1];
    return array($code, $body === false ? '' : (string)$body);
  };
  list($c1, $b1) = $get('http://' . $domain . '/lb-server.php?action=info');
  $res['code'] = $c1;
  $j = json_decode($b1, true);
  $res['ours'] = is_array($j) && isset($j['app']) && $j['app'] === 'launchbuilder';
  if ($res['ours']) { list($c2, $b2) = $get('http://' . $domain . '/'); $res['page'] = $c2; }
  out($res);
}

/* point your own domain at a published site (needs the domain parked on this hosting) */
if ($act === 'domain') {
  $domain = strtolower(trim(isset($d['domain']) ? (string)$d['domain'] : ''));
  $slug = isset($d['slug']) ? $d['slug'] : '';
  $page = isset($d['page']) ? preg_replace('/[^A-Za-z0-9._-]/', '', (string)$d['page']) : '';
  $target = $page !== '' && $page !== 'index.html' ? $slug . '/' . $page : $slug;
  $map = jread($DATA . '/domains.json', array());
  foreach ($map as $dm => $sl) if ($sl === $target) unset($map[$dm]);
  if ($domain !== '') {
    if (!preg_match('/^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/', $domain)) fail('Invalid domain');
    if (!valid_slug($slug)) fail('Publish the site first');
    $map[preg_replace('/^www\./', '', $domain)] = $target;
  }
  jwrite($DATA . '/domains.json', $map);
  $block = "# BEGIN LaunchBuilder domains\n<IfModule mod_rewrite.c>\nRewriteEngine On\n";
  foreach ($map as $dm => $sl) {
    $parts = explode('/', $sl, 2); $site = $parts[0]; $pg = isset($parts[1]) ? $parts[1] : '';
    $hc = 'RewriteCond %{HTTP_HOST} ^(www\.)?' . preg_quote($dm, '/') . "$ [NC]\n";
    if ($pg !== '') { $block .= $hc . 'RewriteRule ^$ ' . $prefix . '/sites/' . $site . '/' . $pg . " [L]\n"; }
    $block .= $hc . 'RewriteCond %{REQUEST_URI} !^' . $prefix . "/sites/\n";
    $block .= 'RewriteRule ^(.*)$ ' . $prefix . '/sites/' . $site . "/$1 [L]\n";
  }
  $block .= "</IfModule>\n# END LaunchBuilder domains\n";
  $ht = $ROOT . '/.htaccess';
  $old = file_exists($ht) ? (string)file_get_contents($ht) : '';
  $old = preg_replace('/# BEGIN LaunchBuilder domains.*?# END LaunchBuilder domains\n?/s', '', $old);
  if (@file_put_contents($ht, $block . $old) === false) fail('Could not update .htaccess — check permissions.');
  out(array('ok' => true, 'domains' => $map));
}

fail('Unknown action');
