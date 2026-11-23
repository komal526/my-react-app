<?php
// LaunchBuilder server v20 — accounts (each login sees only its own sites, leads and domains), admin panel, Google Sheets by link + email by password (lb-connect.php),
// white-label workspaces and free subdomains (name.crecapo.tech, 5 per account). Needs lb-accounts.php next to it.
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
/* v17: the answer is ALWAYS clean JSON — PHP warnings never mix into it (they go to lb-data/php-errors.log),
   and a crash comes back as a readable error instead of an empty page */
@ini_set('display_errors', '0'); ob_start();
set_error_handler(function ($no, $msg, $file, $line) { if (!(error_reporting() & $no)) return false; /* @-silenced */ @file_put_contents(__DIR__ . '/lb-data/php-errors.log', date('c') . " [$no] $msg (" . basename($file) . ":$line)\n", FILE_APPEND); return true; });
register_shutdown_function(function () {
  $e = error_get_last();
  if ($e && in_array($e['type'], array(E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR), true)) {
    while (ob_get_level()) ob_end_clean();
    if (!headers_sent()) { http_response_code(200); header('Content-Type: application/json; charset=utf-8'); }
    @file_put_contents(__DIR__ . '/lb-data/php-errors.log', date('c') . ' FATAL ' . $e['message'] . ' (' . basename($e['file']) . ':' . $e['line'] . ")\n", FILE_APPEND);
    echo json_encode(array('ok' => false, 'error' => 'Server error: ' . $e['message'] . ' (' . basename($e['file']) . ' line ' . $e['line'] . ')'));
  }
});
if (!file_exists(__DIR__ . '/lb-accounts.php')) { echo json_encode(array('ok' => false, 'error' => 'lb-accounts.php is missing next to lb-server.php — push all files to GitHub and run lb-deploy again.')); exit; }
require_once __DIR__ . '/lb-accounts.php';
if (!file_exists(__DIR__ . '/lb-connect.php')) { echo json_encode(array('ok' => false, 'error' => 'lb-connect.php is missing next to lb-server.php — push all files to GitHub and run lb-deploy again.')); exit; }
require_once __DIR__ . '/lb-connect.php';

$ROOT  = __DIR__;
$DATA  = $ROOT . '/lb-data';
$SITES = $ROOT . '/sites';
@ini_set('memory_limit', '512M');
if (!is_dir($DATA))  @mkdir($DATA, 0755, true);
if (!is_dir($SITES)) @mkdir($SITES, 0755, true);
if (!file_exists($DATA . '/.htaccess')) @file_put_contents($DATA . '/.htaccess', "Require all denied\nDeny from all\n");
if (!file_exists($DATA . '/index.html')) @file_put_contents($DATA . '/index.html', '');

function out($a)  { while (ob_get_level()) ob_end_clean(); $j = json_encode($a, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | (defined('JSON_INVALID_UTF8_SUBSTITUTE') ? JSON_INVALID_UTF8_SUBSTITUTE : 0) | JSON_PARTIAL_OUTPUT_ON_ERROR); echo $j === false ? '{"ok":false,"error":"Could not encode the answer"}' : $j; exit; }
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
/* VPS mode: no hPanel — customers only add a DNS record */
function vps_info() {
  /* LaunchBuilder runs on its own VPS: customers only add DNS records. The setup script saves the public IP in lb-data/vps.json. */
  $v = @json_decode((string)@file_get_contents(__DIR__ . '/lb-data/vps.json'), true); if (!is_array($v)) $v = array();
  $ip = !empty($v['ip']) ? $v['ip'] : '';
  if ($ip === '') { $a = isset($_SERVER['SERVER_ADDR']) ? $_SERVER['SERVER_ADDR'] : ''; if (filter_var($a, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) $ip = $a; }
  if ($ip === '') { $h = preg_replace('/:\d+$/', '', isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : ''); $g = $h ? @gethostbyname($h) : ''; if ($g && $g !== $h) $ip = $g; }
  return array('vps' => true, 'ip' => $ip, 'builder' => !empty($v['domain']) ? $v['domain'] : preg_replace('/:\d+$/', '', isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : ''), 'ssl' => !empty($v['ssl']));
}
function server_ips() { $v = vps_info(); return array('ip' => $v['ip'], 'ip6' => ''); }
/* ---------- "Add website" mode: each domain is its own Hostinger website; we copy the published site into its folder ---------- */
function domain_folder($domain) {
  $base = dirname(dirname(__DIR__));            // /home/uXXXX/domains
  foreach (array($base . '/' . $domain . '/public_html', $base . '/www.' . $domain . '/public_html') as $c) if (@is_dir($c)) return $c;
  return '';
}
function copy_dir($src, $dst) {
  if (!is_dir($dst)) @mkdir($dst, 0755, true);
  foreach (scandir($src) as $x) { if ($x === '.' || $x === '..') continue; $a = $src . '/' . $x; $b = $dst . '/' . $x; if (is_dir($a)) copy_dir($a, $b); else @copy($a, $b); }
}
function deploy_to($domain, $target, $SITES) {
  $parts = explode('/', $target, 2); $slug = $parts[0]; $pg = isset($parts[1]) ? $parts[1] : '';
  $src = $SITES . '/' . $slug;
  if (!is_dir($src)) return 'Publish this website first, then connect the domain.';
  $dst = domain_folder($domain);
  if ($dst === '') return 'nofolder';
  if (@realpath($dst) === @realpath(__DIR__)) return 'This domain opens the builder itself. Use another domain for your website.';
  if (!file_exists($dst . '/lb-site.txt') && (file_exists($dst . '/wp-config.php') || file_exists($dst . '/index.php'))) return 'That Hostinger website already has another site in it (WordPress or PHP). Delete those files in File Manager first, or use an empty website.';
  if (!is_writable($dst)) return 'Hostinger did not allow writing to this domain\'s folder. In File Manager set its public_html permission to 755.';
  if (file_exists($dst . '/default.php')) @rename($dst . '/default.php', $dst . '/default.php.bak');
  copy_dir($src, $dst);
  if ($pg !== '' && file_exists($src . '/' . $pg)) @copy($src . '/' . $pg, $dst . '/index.html');
  @file_put_contents($dst . '/lb-site.txt', $target);
  return '';
}
function lb_get($url) {
  if (function_exists('curl_init')) {
    $c = curl_init($url);
    curl_setopt_array($c, array(CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10, CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 3, CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => 0, CURLOPT_USERAGENT => 'LaunchBuilder-check'));
    $body = curl_exec($c); $code = (int)curl_getinfo($c, CURLINFO_HTTP_CODE); $err = curl_error($c); curl_close($c);
    return array($code, $body === false ? '' : (string)$body, $err);
  }
  $ctx = stream_context_create(array('http' => array('timeout' => 10, 'ignore_errors' => true), 'ssl' => array('verify_peer' => false, 'verify_peer_name' => false)));
  $body = @file_get_contents($url, false, $ctx); $code = 0;
  if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) $code = (int)$m[1];
  return array($code, $body === false ? '' : (string)$body, '');
}
/* ---------- routing rules (.htaccess) for custom domains + automatic subdomains ---------- */
function write_rules($ROOT, $SITES, $prefix, $map, $sub) {
  $host = isset($_SERVER['HTTP_HOST']) ? preg_replace('/:\d+$/', '', strtolower($_SERVER['HTTP_HOST'])) : '';
  $block = "# BEGIN LaunchBuilder domains\n<IfModule mod_rewrite.c>\nRewriteEngine On\n";
  foreach ($map as $dm => $sl) {
    $parts = explode('/', $sl, 2); $site = $parts[0]; $pg = isset($parts[1]) ? $parts[1] : '';
    $hc = 'RewriteCond %{HTTP_HOST} ^(www\.)?' . preg_quote($dm, '/') . "$ [NC]\n";
    if ($pg !== '') $block .= $hc . 'RewriteRule ^$ ' . $prefix . '/sites/' . $site . '/' . $pg . " [L]\n";
    $block .= $hc . 'RewriteCond %{REQUEST_URI} !^' . $prefix . "/sites/\n";
    $block .= 'RewriteRule ^(.*)$ ' . $prefix . '/sites/' . $site . "/$1 [L]\n";
  }
  if ($sub !== '') {   /* anything.SUB  →  sites/anything/  (wildcard pointing at public_html) */
    $block .= 'RewriteCond %{REQUEST_URI} !^' . $prefix . "/sites/\n";
    $block .= "RewriteCond %{HTTP_HOST} !^(www|app|admin|builder|mail|webmail|cpanel|ftp)\\. [NC]\n";
    if ($host !== '') $block .= 'RewriteCond %{HTTP_HOST} !^' . preg_quote($host, '/') . "$ [NC]\n";
    $block .= 'RewriteCond %{HTTP_HOST} ^([a-z0-9-]+)\.' . preg_quote($sub, '/') . "$ [NC]\n";
    $block .= 'RewriteRule ^(.*)$ ' . $prefix . "/sites/%1/$1 [L]\n";
  }
  $block .= "</IfModule>\n# END LaunchBuilder domains\n";
  $ht = $ROOT . '/.htaccess';
  $old = file_exists($ht) ? (string)file_get_contents($ht) : '';
  $old = preg_replace('/# BEGIN LaunchBuilder domains.*?# END LaunchBuilder domains\n?/s', '', $old);
  if (@file_put_contents($ht, $block . $old) === false) return 'Could not update .htaccess — check permissions.';
  /* same idea when the wildcard subdomain's folder is public_html/sites */
  $sht = $SITES . '/.htaccess';
  $sold = file_exists($sht) ? (string)file_get_contents($sht) : '';
  $sold = preg_replace('/# BEGIN LaunchBuilder subdomains.*?# END LaunchBuilder subdomains\n?/s', '', $sold);
  $sblock = $sub === '' ? '' : "# BEGIN LaunchBuilder subdomains\n<IfModule mod_rewrite.c>\nRewriteEngine On\nRewriteCond %{ENV:REDIRECT_STATUS} ^$\nRewriteCond %{HTTP_HOST} ^([a-z0-9-]+)\." . preg_quote($sub, '/') . "$ [NC]\nRewriteRule ^(.*)$ %1/$1 [L]\n</IfModule>\n# END LaunchBuilder subdomains\n";
  @file_put_contents($sht, $sblock . $sold);
  return '';
}
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
if ($act === 'info') out(array('ok' => true, 'app' => 'launchbuilder', 'version' => 20, 'accounts' => (bool)lb_saas(), 'http' => extension_loaded('curl') ? 'curl' : 'php', 'configured' => !empty($cfg['key']), 'sitesDomain' => isset($cfg['sites_domain']) ? $cfg['sites_domain'] : '') + vps_info());

/* ---------- Google Sheets + email alerts (one Apps Script web app per account) ---------- */
function lb_hook_file($DATA, $uid) { $d = $DATA . '/hooks'; if (!is_dir($d)) @mkdir($d, 0700, true); return $d . '/' . substr(hash('sha256', 'u:' . $uid), 0, 24) . '.json'; }
function lb_lead_owner($lead, $DATA) {
  $own = jread($DATA . '/owners.json', array()); $fo = jread($DATA . '/formowners.json', array()); $u = '';
  if (!empty($lead['site'])) $u = isset($own[$lead['site']]) ? $own[$lead['site']] : 'owner';   /* a site made before accounts → the admin */
  if ($u === '' && !empty($lead['formId']) && isset($fo[$lead['formId']])) $u = $fo[$lead['formId']];
  return $u === 'owner' ? 'admin' : $u;
}
function lb_hook_post($url, $payload, $follow) {
  $c = curl_init($url);
  curl_setopt_array($c, array(CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => $follow ? 25 : 8, CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_FOLLOWLOCATION => $follow, CURLOPT_MAXREDIRS => 4,
    CURLOPT_HTTPHEADER => array('Content-Type: application/json'), CURLOPT_POSTFIELDS => json_encode($payload)));
  $b = curl_exec($c); $code = (int)curl_getinfo($c, CURLINFO_HTTP_CODE); $err = curl_error($c); curl_close($c);
  return array($code, (string)$b, $err);
}
function lb_hook_payload($lead, $h) {
  return array('lead' => $lead, 'options' => array('notify' => !empty($h['notify']) ? $h['email'] : '', 'autoreply' => !empty($h['autoreply']), 'subject' => isset($h['subject']) ? $h['subject'] : '', 'reply' => isset($h['reply']) ? $h['reply'] : '', 'from' => isset($h['from']) ? $h['from'] : ''));
}
/* sheet connected with a link → new-lead alert + thank-you email go out from the user's connected mailbox */
function lb_hook_mails($DATA, $u, $h, $lead, $sheetUrl) {
  $m = jread(mail_file($DATA, $u), array()); if (empty($m['enc'])) return array(false, (!empty($h['notify']) || !empty($h['autoreply'])) ? 'connect your email (Integrations → Email automation) to get email alerts' : '');
  $name = mail_lead_get($lead, '/^(name|full.?name|your.?name)$/i'); if ($name === '') $name = mail_lead_get($lead, '/name/i');
  $em = mail_lead_get($lead, '/e-?mail/i'); $sent = false; $err = '';
  $pg = isset($lead['page']) && $lead['page'] !== '' ? $lead['page'] : (isset($lead['url']) ? $lead['url'] : '');
  if (!empty($h['notify']) && !empty($h['email'])) {
    $err = mail_send_as($DATA, $u, $h['email'], 'New lead: ' . ($name !== '' ? $name : ($em !== '' ? $em : 'someone')) . ' — ' . (isset($lead['form']) ? $lead['form'] : 'Form'),
      '<h2 style="margin:0 0 10px">New lead 🎉</h2>' . mail_lead_table($lead) . '<p style="color:#5d6785">' . mail_esc(isset($lead['form']) ? $lead['form'] : '') . ' · ' . mail_esc($pg) . '</p>' . ($sheetUrl ? '<p><a href="' . mail_esc($sheetUrl) . '">Open the sheet</a></p>' : ''), $em);
    $sent = $err === '';
  }
  if (!empty($h['autoreply']) && filter_var($em, FILTER_VALIDATE_EMAIL)) {
    $body = str_replace('{{name}}', mail_esc($name !== '' ? $name : 'there'), nl2br(mail_esc(!empty($h['reply']) ? $h['reply'] : 'Hi {{name}}, thank you — we received your details and will contact you soon.')));
    $e2 = mail_send_as($DATA, $u, $em, !empty($h['subject']) ? $h['subject'] : 'Thank you!', $body, isset($h['email']) ? $h['email'] : ''); if ($err === '') $err = $e2;
  }
  return array($sent, $err);
}
function lb_forward_lead($lead, $DATA) {
  $u = lb_lead_owner($lead, $DATA); if ($u === '') return;
  $hf = lb_hook_file($DATA, $u); $h = jread($hf, array());
  if (!empty($h['sid'])) {
    list($url, $e) = gs_append($DATA, $h, $lead); list($ok, $e2) = lb_hook_mails($DATA, $u, $h, $lead, $url);
    $h = jread($hf, $h); $h['last'] = array('t' => time(), 'code' => $e === '' ? 200 : 0, 'err' => $e !== '' ? $e : $e2); jwrite($hf, $h); return;
  }
  if (empty($h['url'])) return;
  list($code, $b, $err) = lb_hook_post($h['url'], lb_hook_payload($lead, $h), false);
  $h['last'] = array('t' => time(), 'code' => $code, 'err' => $err); jwrite($hf, $h);
}

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
  /* answer the visitor first, then send the lead to the owner's Google Sheet / email (if connected) */
  header('Content-Type: application/json'); echo json_encode(array('ok' => true));
  if (function_exists('fastcgi_finish_request')) fastcgi_finish_request();
  lb_forward_lead($lead, $DATA);
  exit;
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

/* email automation through the owner's connected mailbox (email + password).
   Only two kinds of email, once per lead: the thank-you to the email typed IN that lead, and the alert to the owner's own address. */
/* sign up without the confirmation email: the account is created ready to use (needs the Supabase secret key on the server).
   Without the secret key the app falls back to Supabase's normal sign-up. Max 5 new accounts per hour from one internet address. */
if ($act === 'signup') {
  $S = lb_saas(); if (!$S || empty($S['service_key'])) out(array('ok' => false, 'fallback' => true));
  $em = strtolower(trim(isset($d['email']) ? (string)$d['email'] : '')); $pw = (string)(isset($d['password']) ? $d['password'] : ''); $nm = clean_str(isset($d['name']) ? $d['name'] : '', 80);
  if (!filter_var($em, FILTER_VALIDATE_EMAIL)) fail('Type a valid email.'); if (strlen($pw) < 6) fail('Password must be at least 6 characters.');
  $rf = $DATA . '/signup-ip.json'; $rl = jread($rf, array()); $ip = substr(hash('sha256', lb_ip() . '|su'), 0, 20); $now = time();
  foreach ($rl as $k => $ts) { $rl[$k] = array_values(array_filter((array)$ts, function ($t) use ($now) { return $t > $now - 3600; })); if (!$rl[$k]) unset($rl[$k]); }
  if (isset($rl[$ip]) && count($rl[$ip]) >= 5) fail('Too many new accounts from this internet connection. Please try again in an hour.');
  $rl[$ip][] = $now; jwrite($rf, $rl);
  $sk = $S['service_key']; $h = array('apikey: ' . $sk, 'Content-Type: application/json'); if (strpos($sk, 'sb_') !== 0) $h[] = 'Authorization: Bearer ' . $sk;
  $c = curl_init(rtrim($S['supabase_url'], '/') . '/auth/v1/admin/users');
  curl_setopt_array($c, array(CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15, CURLOPT_HTTPHEADER => $h, CURLOPT_POSTFIELDS => json_encode(array('email' => $em, 'password' => $pw, 'email_confirm' => true, 'user_metadata' => array('name' => $nm !== '' ? $nm : explode('@', $em)[0])))));
  $b = curl_exec($c); $code = (int)curl_getinfo($c, CURLINFO_HTTP_CODE); curl_close($c); $j = json_decode((string)$b, true);
  if ($code === 0) out(array('ok' => false, 'fallback' => true));
  if ($code >= 300 || empty($j['id'])) { $m = isset($j['msg']) ? $j['msg'] : (isset($j['message']) ? $j['message'] : (isset($j['error_description']) ? $j['error_description'] : 'HTTP ' . $code)); fail(preg_match('/already|exists|registered/i', $m) ? 'An account with this email already exists — log in instead (or use “Forgot password?”).' : 'Could not create the account: ' . $m); }
  out(array('ok' => true));
}

if ($act === 'leadmail') {
  $lid = preg_replace('/[^A-Za-z0-9]/', '', clean_str(isset($d['lid']) ? $d['lid'] : '', 40)); $kind = isset($d['kind']) && $d['kind'] === 'owner' ? 'owner' : 'auto';
  if ($lid === '') fail('No lead');
  $lead = null;
  for ($i = 0; $i < 5 && !$lead; $i++) { if ($i) usleep(800000); foreach (array_reverse(array_slice(jread($DATA . '/leads.json', array()), -1500)) as $l) if (isset($l['lid']) && $l['lid'] === $lid) { $lead = $l; break; } }
  if (!$lead) fail('Lead not found');
  if ($lead['ts'] < (time() - 3 * 3600) * 1000) fail('Too late for this lead');
  $sf = $DATA . '/mail-sent.json'; $sent = jread($sf, array()); $now = time();
  foreach ($sent as $sk => $st) if ($st < $now - 86400) unset($sent[$sk]);
  if (isset($sent[$lid . ':' . $kind])) out(array('ok' => true, 'dup' => true));
  $u = lb_lead_owner($lead, $DATA); if ($u === '') fail('No owner');
  $m = jread(mail_file($DATA, $u), array()); if (empty($m['enc'])) fail('Email is not connected');
  $lem = mail_lead_get($lead, '/e-?mail/i');
  $to = $kind === 'owner' ? (!empty($m['owner']) ? $m['owner'] : $m['user']) : $lem;
  if (!filter_var($to, FILTER_VALIDATE_EMAIL)) fail('No email address in this lead');
  $sent[$lid . ':' . $kind] = $now; jwrite($sf, $sent);
  $html = preg_replace('#<(script|iframe|object|embed|form)\b.*?</\1>#is', '', clean_str(isset($d['html']) ? $d['html'] : '', 20000));
  $subj = clean_str(isset($d['subject']) ? $d['subject'] : '', 200); if (trim($subj) === '') $subj = $kind === 'owner' ? 'New lead' : 'Thank you!';
  $e = mail_send_as($DATA, $u, $to, $subj, $html, $kind === 'owner' ? $lem : (!empty($m['owner']) ? $m['owner'] : $m['user']));
  out($e === '' ? array('ok' => true) : array('ok' => false, 'error' => $e));
}

/* Smart Insights — page views, CTA clicks and form starts from your live sites.
   One small line per event, appended to a file per day (fast, no big rewrites). */
if ($act === 'track') {
  $t = isset($d['t']) ? (string)$d['t'] : '';
  if (!in_array($t, array('view', 'cta', 'fstart'), true)) out(array('ok' => false));
  $dir = $DATA . '/ev'; if (!is_dir($dir)) @mkdir($dir, 0755, true);
  $f = $dir . '/' . gmdate('Y-m-d') . '.ndjson';
  if (file_exists($f) && filesize($f) > 60 * 1024 * 1024) out(array('ok' => true, 'skipped' => true));
  $dev = isset($d['dev']) && in_array($d['dev'], array('mobile', 'tablet', 'desktop'), true) ? $d['dev'] : 'desktop';
  $e = array('ts' => round(microtime(true) * 1000), 't' => $t,
    'site' => preg_replace('/[^a-z0-9-]/', '', clean_str(isset($d['site']) ? $d['site'] : '', 64)),
    'page' => clean_str(isset($d['page']) ? $d['page'] : '', 120), 'sid' => preg_replace('/[^a-z0-9]/', '', clean_str(isset($d['sid']) ? $d['sid'] : '', 16)),
    'label' => clean_str(isset($d['label']) ? $d['label'] : '', 60), 'dev' => $dev, 'ref' => clean_str(isset($d['ref']) ? $d['ref'] : '', 200));
  @file_put_contents($f, json_encode($e, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);
  if (mt_rand(1, 500) === 1) foreach (glob($dir . '/*.ndjson') as $old) if (filemtime($old) < time() - 120 * 86400) @unlink($old);
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
/* ---------------- who is calling? ----------------
   Every account signs in with its own login (tok = Supabase login token, checked with Supabase).
   The old server key still works for the owner (websites made before accounts existed). */
$LEGACY = !empty($cfg['key']) && $key !== '' && hash_equals((string)$cfg['key'], $key);
$HOSTT = lb_tenant_for_host($DATA, lb_host());
$TU = lb_token_user(isset($d['tok']) ? (string)$d['tok'] : '', $DATA);
$ME = null;
if ($TU) { $ME = lb_register($TU, $DATA, $HOSTT); if (isset($ME['error'])) fail($ME['error']); }
elseif ($LEGACY) { $s0 = lb_saas(); $ME = array('uid' => 'owner', 'email' => isset($s0['admins'][0]) ? strtolower($s0['admins'][0]) : '', 'name' => 'Owner', 'role' => 'admin', 'tenant' => '', 'disabled' => false, 'sub_limit' => null); }
if (!$ME) {
  if ($TU === false) fail('LOGIN_EXPIRED: Your login expired. Log out and log in again.');
  $sentTok = isset($d['tok']) && strlen((string)$d['tok']) >= 10;
  /* a logged-in account that the server can't recognise yet → say exactly why */
  if ($sentTok && !lb_saas()) fail('SETUP: Accounts are not switched on on this server yet. Admin: on the VPS run  bash /opt/launchbuilder/vps/lb-saas-setup.sh  then reload.');
  if ($sentTok && !empty($GLOBALS['LB_SB_DOWN'])) fail('The server could not reach Supabase to check your login. Try again in a minute (admin: check the VPS internet / supabase_url in /etc/launchbuilder/saas.json).');
  if (empty($cfg['key'])) fail('Server not set up yet — click Connect in Integrations.');
  fail('Wrong key for this server.');
}
if ($ME['disabled']) fail('ACCOUNT_PAUSED: Your account is paused. Please contact support.');
if ($ME['tenant'] !== '' && $ME['role'] !== 'admin') { $t0 = lb_tenants($DATA); if (isset($t0[$ME['tenant']]) && isset($t0[$ME['tenant']]['active']) && !$t0[$ME['tenant']]['active']) fail('ACCOUNT_PAUSED: This workspace is paused. Please contact support.'); }
/* private files (AI key, voice notes) per account; the owner keeps the files made with the old key */
$KID = $LEGACY ? substr(hash('sha256', $key), 0, 16) : substr(hash('sha256', 'uid:' . $ME['uid']), 0, 16);
$IS_ADMIN = $ME['role'] === 'admin';

if ($act === 'ping') out(array('ok' => true, 'base' => $BASE, 'php' => PHP_VERSION, 'uid' => $ME['uid']) + server_ips());

$ALLOWED = array('html', 'htm', 'xml', 'txt', 'css', 'js', 'json', 'mp4', 'webm', 'mov', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'ico', 'woff', 'woff2', 'pdf');
function valid_slug($s) { return is_string($s) && preg_match('/^[a-z0-9][a-z0-9-]{1,60}$/', $s); }

if ($act === 'publish') {
  $slug = isset($d['slug']) ? $d['slug'] : '';
  if (!valid_slug($slug)) fail('Use only lowercase letters, numbers and dashes for the link name.');
  if (!lb_site_mine($slug, $ME, $DATA, $SITES)) fail('TAKEN: The link name "' . $slug . '" is already used by another account. Change the link name and publish again.');
  $own0 = lb_owners($DATA); $lim = lb_limit($ME, $DATA, 'site_limit');
  if ($lim > 0 && !isset($own0[$slug]) && lb_count_owned($ME, $DATA, 'site') >= $lim) fail('LIMIT: Your plan allows ' . $lim . ' live website' . ($lim > 1 ? 's' : '') . '. Unpublish one or ask for a bigger plan.');
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
  @file_put_contents($tmp . '/lb-site.txt', $slug);
  $target = $SITES . '/' . $slug;
  rrmdir($target);
  if (!@rename($tmp, $target)) { rrmdir($tmp); fail('Could not save the site folder.'); }
  lb_claim_site($slug, $ME, $DATA);
  $deploys = jread($DATA . '/deploys.json', array()); $updated = array();
  foreach ($deploys as $dm => $tg) { $p0 = explode('/', $tg, 2); if ($p0[0] === $slug && deploy_to($dm, $tg, $SITES) === '') $updated[] = $dm; }
  out(array('ok' => true, 'slug' => $slug, 'url' => $BASE . '/sites/' . $slug . '/', 'folder' => 'public_html' . $prefix . '/sites/' . $slug, 'domains' => $updated));
}

if ($act === 'unpublish') {
  $slug = isset($d['slug']) ? $d['slug'] : '';
  if (!valid_slug($slug)) fail('Bad name');
  if (!lb_site_mine($slug, $ME, $DATA, $SITES)) fail('This website belongs to another account.');
  rrmdir($SITES . '/' . $slug);   /* the name stays reserved for this account, so nobody else can take its domains */
  out(array('ok' => true));
}

if ($act === 'sites') {
  $list = array();
  $mine = lb_my_slugs($ME, $DATA, $SITES);
  foreach (scandir($SITES) as $x) if ($x[0] !== '.' && is_dir($SITES . '/' . $x) && isset($mine[$x])) $list[] = array('slug' => $x, 'url' => $BASE . '/sites/' . $x . '/', 'updated' => filemtime($SITES . '/' . $x) * 1000);
  out(array('ok' => true, 'sites' => $list));
}

if ($act === 'leads') {
  $since = isset($d['since']) ? (float)$d['since'] : 0;
  $all = jread($DATA . '/leads.json', array());
  $mine = lb_my_slugs($ME, $DATA, $SITES); $fids = array();
  if (isset($d['forms']) && is_array($d['forms'])) foreach (array_slice($d['forms'], 0, 2000) as $fi) if (is_string($fi) && $fi !== '') $fids[$fi] = 1;
  if (isset($d['forms']) && is_array($d['forms'])) lb_remember_forms($ME, $DATA, $d['forms']);
  $all = array_filter($all, function ($l) use ($mine, $fids, $IS_ADMIN) { $s = isset($l['site']) ? $l['site'] : ''; return ($s !== '' && isset($mine[$s])) || (isset($l['formId']) && isset($fids[$l['formId']])) || ($s === '' && $IS_ADMIN && !$fids); });
  $res = array(); foreach ($all as $l) if ($l['ts'] > $since || (isset($l['payment']['ts']) && $l['payment']['ts'] > $since)) $res[] = $l;
  out(array('ok' => true, 'leads' => $res, 'now' => round(microtime(true) * 1000)));
}

if ($act === 'deletelead') {
  $lids = isset($d['lids']) && is_array($d['lids']) ? $d['lids'] : array();
  $all = jread($DATA . '/leads.json', array());
  $mine = lb_my_slugs($ME, $DATA, $SITES);
  $all = array_values(array_filter($all, function ($l) use ($lids, $mine, $IS_ADMIN) { $s = isset($l['site']) ? $l['site'] : ''; $ok = isset($mine[$s]) || ($s === '' && $IS_ADMIN) || $s === ''; return !($ok && in_array($l['lid'], $lids, true)); }));
  jwrite($DATA . '/leads.json', $all);
  out(array('ok' => true));
}

/* Smart Insights — events since a time (the builder merges them into Analytics) */
if ($act === 'events') {
  $since = isset($d['since']) ? (float)$d['since'] : 0; $res = array(); $mine = lb_my_slugs($ME, $DATA, $SITES);
  $from = max($since / 1000, time() - 90 * 86400);
  for ($day = strtotime(gmdate('Y-m-d', (int)$from)); $day <= time() && count($res) < 30000; $day += 86400) {
    $f = $DATA . '/ev/' . gmdate('Y-m-d', $day) . '.ndjson'; if (!file_exists($f)) continue;
    $fh = @fopen($f, 'r'); if (!$fh) continue;
    while (($line = fgets($fh)) !== false && count($res) < 30000) { $e = json_decode($line, true); if (is_array($e) && $e['ts'] > $since && (isset($mine[isset($e['site']) ? $e['site'] : '']) || ($IS_ADMIN && empty($e['site'])))) $res[] = $e; }
    fclose($fh);
  }
  out(array('ok' => true, 'events' => $res, 'now' => round(microtime(true) * 1000)));
}

/* ---------------- AI Consultant ----------------
   Your own API key (BYOK) is saved here ENCRYPTED and never sent back to the browser.
   Without your own key, the platform key in /etc/launchbuilder/ai.json is used (with a daily limit). */
function ai_secret($DATA) {
  $f = $DATA . '/secret.key';
  if (!file_exists($f)) { @file_put_contents($f, base64_encode(random_bytes(32))); @chmod($f, 0600); }
  return base64_decode((string)@file_get_contents($f));
}
function ai_enc($plain, $DATA) { $iv = random_bytes(12); $tag = ''; $c = openssl_encrypt($plain, 'aes-256-gcm', ai_secret($DATA), OPENSSL_RAW_DATA, $iv, $tag); return base64_encode($iv . $tag . $c); }
function ai_dec($blob, $DATA) { $b = base64_decode((string)$blob); if (strlen($b) < 29) return ''; $p = openssl_decrypt(substr($b, 28), 'aes-256-gcm', ai_secret($DATA), OPENSSL_RAW_DATA, substr($b, 0, 12), substr($b, 12, 16)); return $p === false ? '' : $p; }
function ai_models() { return array('claude' => 'claude-sonnet-5-5', 'openai' => 'gpt-4o', 'gemini' => 'gemini-flash-latest', 'deepseek' => 'deepseek-chat'); }
function ai_post_raw($url, $headers, $body) {
  $ch = curl_init($url);
  curl_setopt_array($ch, array(CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 170, CURLOPT_CONNECTTIMEOUT => 10, CURLOPT_HTTPHEADER => array_merge(array('Content-Type: application/json'), $headers), CURLOPT_POSTFIELDS => json_encode($body)));
  $r = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); $err = curl_error($ch); curl_close($ch);
  if ($r === false) return array(0, array(), 'Could not reach the AI service: ' . $err);
  $j = json_decode($r, true); if (!is_array($j)) $j = array();
  return array($code, $j, $code >= 400 ? (isset($j['error']['message']) ? $j['error']['message'] : ('HTTP ' . $code)) : '');
}
/* "busy" answers (high demand, rate limit, overloaded) → wait a moment and retry, then try the next model in the list */
function ai_busy($code, $msg) { return in_array($code, array(0, 429, 500, 502, 503, 504, 529), true) || preg_match('/high demand|overloaded|unavailable|try again later|resource.?exhausted|rate.?limit/i', $msg); }
/* the model was switched off by the AI company ("no longer available to new users", "not found", "deprecated") */
function ai_retired($code, $msg) { return preg_match('/no longer available|deprecated|not found|does not exist|not supported|unknown model|invalid model|no such model|update your code/i', $msg) || $code === 404; }
/* Gemini: the newest "flash" models this key can use (asked from Google, remembered for a day) */
function ai_gemini_models($key) {
  global $DATA; $cf = $DATA . '/ai-gemini-models.json'; $c = jread($cf, array());
  if (!empty($c['t']) && $c['t'] > time() - 86400 && !empty($c['m'])) return $c['m'];
  $ch = curl_init('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200');
  curl_setopt_array($ch, array(CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10, CURLOPT_HTTPHEADER => array('x-goog-api-key: ' . $key)));
  $j = json_decode((string)curl_exec($ch), true); curl_close($ch);
  $ids = array(); if (isset($j['models'])) foreach ($j['models'] as $m) if (in_array('generateContent', isset($m['supportedGenerationMethods']) ? $m['supportedGenerationMethods'] : array(), true)) $ids[] = preg_replace('#^models/#', '', $m['name']);
  $ver = function ($x) { return preg_match('/gemini-(\d+(?:\.\d+)?)/', $x, $mm) ? (float)$mm[1] : 0; };
  $fl = array_values(array_filter($ids, function ($x) { return preg_match('/^gemini-\d+(\.\d+)?-flash$/', $x); })); usort($fl, function ($a, $b) use ($ver) { return $ver($b) < $ver($a) ? -1 : 1; });
  $lt = array_values(array_filter($ids, function ($x) { return preg_match('/^gemini-(flash|flash-lite)-latest$/', $x); }));
  $out = array_merge($fl, $lt); if ($out) jwrite($cf, array('t' => time(), 'm' => $out));
  return $out ? $out : array('gemini-flash-latest', 'gemini-flash-lite-latest');
}
function ai_post_models($models, $build, $more = null) {
  $last = ''; $queue = array_values(array_unique(array_filter($models))); $tried = array(); $moreUsed = false;
  while ($queue) {
    $m = array_shift($queue); if (isset($tried[$m])) continue; $tried[$m] = 1;
    for ($try = 0; $try < 2; $try++) {
      list($url, $headers, $body) = $build($m);
      list($code, $j, $err) = ai_post_raw($url, $headers, $body);
      if ($err === '') return $j;
      $last = $err;
      if (ai_retired($code, $err)) {   /* switched off → the model they suggest, then the newest ones */
        if (preg_match_all('#models/([a-z0-9][\w.-]*[a-z0-9])#i', $err, $mm)) { $s = end($mm[1]); if ($s && $s !== $m) array_unshift($queue, $s); }
        if ($more && !$moreUsed) { $moreUsed = true; $queue = array_merge($queue, $more()); }
        break;
      }
      if (!ai_busy($code, $err)) fail('AI service error: ' . $err);
      if ($try === 0) { usleep(1500000); continue; }
      if ($more && !$moreUsed) { $moreUsed = true; $queue = array_merge($queue, $more()); }
    }
  }
  if (ai_busy(0, $last)) fail('The AI is very busy right now. Please try again in a minute.');
  fail('AI service error: ' . $last);
}
function ai_post($url, $headers, $body) { list($code, $j, $err) = ai_post_raw($url, $headers, $body); if ($err !== '') fail('AI service error: ' . $err); return $j; }
function ai_run($prov, $key, $model, $system, $msgs, $max, $files = array()) {
  if ($prov === 'claude') {
    if ($files && $msgs) { $li = count($msgs) - 1; $c = array(); foreach ($files as $f) $c[] = $f['kind'] === 'pdf' ? array('type' => 'document', 'source' => array('type' => 'base64', 'media_type' => 'application/pdf', 'data' => $f['b64'])) : array('type' => 'image', 'source' => array('type' => 'base64', 'media_type' => $f['mime'], 'data' => $f['b64'])); $c[] = array('type' => 'text', 'text' => $msgs[$li]['content']); $msgs[$li]['content'] = $c; }
    $j = ai_post_models(array($model), function ($m) use ($key, $max, $system, $msgs) { return array('https://api.anthropic.com/v1/messages', array('x-api-key: ' . $key, 'anthropic-version: 2023-06-01'), array('model' => $m, 'max_tokens' => $max, 'system' => $system, 'messages' => $msgs)); });
    $t = ''; if (isset($j['content'])) foreach ($j['content'] as $c) if (isset($c['type']) && $c['type'] === 'text') $t .= $c['text']; return $t;
  }
  if ($prov === 'gemini') {
    $cs = array(); foreach ($msgs as $m) $cs[] = array('role' => $m['role'] === 'assistant' ? 'model' : 'user', 'parts' => array(array('text' => $m['content'])));
    if ($files && $cs) { $li = count($cs) - 1; foreach ($files as $f) array_unshift($cs[$li]['parts'], array('inline_data' => array('mime_type' => $f['mime'], 'data' => $f['b64']))); }
    $j = ai_post_models(array($model), function ($m) use ($key, $max, $system, $cs) { return array('https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($m) . ':generateContent', array('x-goog-api-key: ' . $key), array('systemInstruction' => array('parts' => array(array('text' => $system))), 'contents' => $cs, 'generationConfig' => array('maxOutputTokens' => $max))); }, function () use ($key) { return ai_gemini_models($key); });
    $t = ''; if (isset($j['candidates'][0]['content']['parts'])) foreach ($j['candidates'][0]['content']['parts'] as $p) $t .= isset($p['text']) ? $p['text'] : ''; return $t;
  }
  $url = $prov === 'deepseek' ? 'https://api.deepseek.com/chat/completions' : 'https://api.openai.com/v1/chat/completions';
  if ($files && $msgs && $prov === 'openai') { $li = count($msgs) - 1; $c = array(array('type' => 'text', 'text' => $msgs[$li]['content'])); foreach ($files as $f) $c[] = $f['kind'] === 'pdf' ? array('type' => 'file', 'file' => array('filename' => 'document.pdf', 'file_data' => 'data:application/pdf;base64,' . $f['b64'])) : array('type' => 'image_url', 'image_url' => array('url' => 'data:' . $f['mime'] . ';base64,' . $f['b64'])); $msgs[$li]['content'] = $c; }
  if ($files && $prov === 'deepseek') fail('DeepSeek can\'t read pictures or PDFs — use Gemini, ChatGPT or Claude for this.');
  $j = ai_post_models($prov === 'openai' ? array($model, 'gpt-4o-mini') : array($model), function ($m) use ($url, $key, $max, $system, $msgs) { return array($url, array('Authorization: Bearer ' . $key), array('model' => $m, 'max_tokens' => min($max, 8000), 'messages' => array_merge(array(array('role' => 'system', 'content' => $system)), $msgs))); });
  return isset($j['choices'][0]['message']['content']) ? $j['choices'][0]['message']['content'] : '';
}
$AIF = $DATA . '/ai-' . $KID . '.json';
function ai_platform() { $p = @json_decode((string)@file_get_contents('/etc/launchbuilder/ai.json'), true); return is_array($p) && !empty($p['key']) && !empty($p['provider']) ? $p : null; }

if ($act === 'aistatus') {
  $mine = jread($AIF, array()); $pl = ai_platform();
  out(array('ok' => true, 'own' => !empty($mine['enc']) ? array('provider' => $mine['provider'], 'model' => $mine['model'], 'last4' => $mine['last4']) : null, 'platform' => $pl ? array('provider' => $pl['provider'], 'limit' => isset($pl['daily_limit']) ? (int)$pl['daily_limit'] : 40) : null));
}
if ($act === 'aikey') {
  if (!empty($d['remove'])) { @unlink($AIF); out(array('ok' => true, 'own' => null)); }
  $prov = isset($d['provider']) ? (string)$d['provider'] : ''; $mods = ai_models();
  if (!isset($mods[$prov])) fail('Choose an AI provider.');
  $k = trim(isset($d['apikey']) ? (string)$d['apikey'] : ''); if (strlen($k) < 20 || strlen($k) > 300) fail('That API key looks wrong — paste the full key.');
  $model = preg_replace('/[^A-Za-z0-9._:-]/', '', clean_str(isset($d['model']) ? $d['model'] : '', 80)); if ($model === '') $model = $mods[$prov];
  if (!empty($d['test'])) { $txt = ai_run($prov, $k, $model, 'Reply with the single word OK.', array(array('role' => 'user', 'content' => 'Test')), 20); if (trim($txt) === '') fail('The key was accepted but the AI returned nothing. Check the model name.'); }
  jwrite($AIF, array('provider' => $prov, 'model' => $model, 'enc' => ai_enc($k, $DATA), 'last4' => substr($k, -4), 'saved' => time()));
  @chmod($AIF, 0600);
  out(array('ok' => true, 'own' => array('provider' => $prov, 'model' => $model, 'last4' => substr($k, -4))));
}
if ($act === 'ai') {
  @set_time_limit(180);
  $system = clean_str(isset($d['system']) ? $d['system'] : '', 20000);
  $max = max(200, min(12000, (int)(isset($d['max']) ? $d['max'] : 1500)));
  $msgs = array(); if (isset($d['messages']) && is_array($d['messages'])) foreach (array_slice($d['messages'], -16) as $m) {
    if (!is_array($m) || !isset($m['content'])) continue;
    $msgs[] = array('role' => (isset($m['role']) && $m['role'] === 'assistant') ? 'assistant' : 'user', 'content' => clean_str($m['content'], 60000));
  }
  if (!$msgs) fail('Ask a question first.');
  /* pictures / PDFs the user attached in AI Studio (max 6 files, 15 MB in total) */
  $files = array(); $tot = 0;
  if (isset($d['files']) && is_array($d['files'])) foreach (array_slice($d['files'], 0, 6) as $f) {
    if (!is_array($f) || empty($f['b64']) || !preg_match('#^(image/(png|jpeg|webp|gif)|application/pdf)$#', isset($f['mime']) ? $f['mime'] : '')) continue;
    $b = preg_replace('/[^A-Za-z0-9+\/=]/', '', (string)$f['b64']); $tot += strlen($b); if ($tot > 20000000) fail('The attached files are too big together — keep them under 15 MB.');
    $files[] = array('kind' => $f['mime'] === 'application/pdf' ? 'pdf' : 'image', 'mime' => $f['mime'], 'b64' => $b);
  }
  $mine = jread($AIF, array());
  if (!empty($mine['enc'])) { $k = ai_dec($mine['enc'], $DATA); if ($k === '') fail('Your saved AI key could not be read — save it again.'); $txt = ai_run($mine['provider'], $k, $mine['model'], $system, $msgs, $max, $files); $src = 'own'; }
  else {
    $pl = ai_platform(); if (!$pl) fail('NO_AI_KEY');
    $lim = isset($pl['daily_limit']) ? (int)$pl['daily_limit'] : 40; $uf = $DATA . '/ai-usage.json'; $use = jread($uf, array()); $uk = $KID . '-' . gmdate('Y-m-d');
    foreach ($use as $uk2 => $n) if (substr($uk2, -10) !== gmdate('Y-m-d')) unset($use[$uk2]);
    if ((isset($use[$uk]) ? $use[$uk] : 0) >= $lim) fail('Daily AI limit reached (' . $lim . ' questions). Add your own API key in AI Consultant → Settings to keep going.');
    $use[$uk] = (isset($use[$uk]) ? $use[$uk] : 0) + 1; jwrite($uf, $use);
    $mods = ai_models(); $txt = ai_run($pl['provider'], $pl['key'], !empty($pl['model']) ? $pl['model'] : $mods[$pl['provider']], $system, $msgs, $max, $files); $src = 'platform';
  }
  if (trim($txt) === '') fail('The AI returned an empty answer. Try again.');
  out(array('ok' => true, 'text' => $txt, 'source' => $src));
}

/* ---------------- Lead Finder: find local businesses on Google (Places API) ----------------
   The Google key is saved on this server only (encrypted). Every account gets a monthly number of searches. */
function lf_url() { return getenv('LB_PLACES_URL') ?: 'https://places.googleapis.com/v1/places:searchText'; }   /* the env var is only for testing */
function lf_cfg() { global $DATA; return jread($DATA . '/places.json', array()); }
function lf_month() { return gmdate('Y-m'); }
function lf_used($kid) { global $DATA; $u = jread($DATA . '/places-usage.json', array()); return (isset($u[$kid]) && $u[$kid]['m'] === lf_month()) ? (int)$u[$kid]['n'] : 0; }
function lf_limit() { global $IS_ADMIN; $c = lf_cfg(); if ($IS_ADMIN) return 0; return isset($c['limit']) ? (int)$c['limit'] : 100; }
/* v103 — every account connects its OWN Google key (saved encrypted, per account).
   The admin's server key is only used by the admin — and by everyone else only if the admin switches on "share". */
function lf_kfile() { global $DATA, $KID; $d = $DATA . '/places-keys'; if (!is_dir($d)) @mkdir($d, 0700, true); return $d . '/' . $KID . '.json'; }
function lf_mine() { return jread(lf_kfile(), array()); }
function lf_shared() { $c = lf_cfg(); return !empty($c['enc']) && !empty($c['share']); }   /* v104: the server key is used only when the admin shares it — otherwise everyone (admin too) connects a key first */
function lf_test_key($k) {
  if (!preg_match('/^[A-Za-z0-9_\-]{20,80}$/', $k)) fail('That does not look like a Google API key (it starts with AIza…).');
  list($code, $j, $err) = ai_post_raw(lf_url(), array('X-Goog-Api-Key: ' . $k, 'X-Goog-FieldMask: places.id'), array('textQuery' => 'cafe in Delhi', 'pageSize' => 1));
  if ($code !== 200) fail('Google did not accept the key: ' . ($err ?: (isset($j['error']['message']) ? $j['error']['message'] : 'HTTP ' . $code)) . ' — make sure "Places API (New)" is enabled for this key and billing is on.');
}
if ($act === 'lf_status') {
  $c = lf_cfg(); $m = lf_mine(); $own = !empty($m['enc']); $sh = lf_shared();
  $lim = $own || $IS_ADMIN ? 0 : lf_limit(); $used = lf_used($KID);
  out(array('ok' => true, 'ready' => $own || $sh, 'own' => $own ? array('tail' => $m['tail'], 'saved' => $m['saved']) : null, 'using' => $own ? 'own' : ($sh ? 'shared' : ''),
    'limit' => $lim, 'used' => $used, 'left' => $lim ? max(0, $lim - $used) : -1, 'admin' => $IS_ADMIN, 'perUser' => isset($c['limit']) ? (int)$c['limit'] : 100,
    'server' => $IS_ADMIN ? array('on' => !empty($c['enc']), 'tail' => isset($c['tail']) ? $c['tail'] : '', 'share' => !empty($c['share'])) : null));
}
if ($act === 'lf_key') {   /* any account: connect / remove its own key */
  if (!empty($d['remove'])) { @unlink(lf_kfile()); out(array('ok' => true)); }
  $k = trim(isset($d['gkey']) ? (string)$d['gkey'] : ''); lf_test_key($k);
  jwrite(lf_kfile(), array('enc' => ai_enc($k, $DATA), 'tail' => substr($k, -4), 'saved' => time())); @chmod(lf_kfile(), 0600);
  out(array('ok' => true, 'tail' => substr($k, -4)));
}
if ($act === 'lf_setup') {
  if (!$IS_ADMIN) fail('Only the admin can set the Google key.');
  $c = lf_cfg(); $k = trim(isset($d['gkey']) ? (string)$d['gkey'] : '');
  if ($k !== '') { lf_test_key($k); $c['enc'] = ai_enc($k, $DATA); $c['tail'] = substr($k, -4); }
  if (isset($d['limit'])) $c['limit'] = max(0, (int)$d['limit']);
  if (isset($d['share'])) $c['share'] = !empty($d['share']);
  if (!empty($d['remove'])) unset($c['enc'], $c['tail']);
  jwrite($DATA . '/places.json', $c); out(array('ok' => true, 'ready' => !empty($c['enc']), 'tail' => isset($c['tail']) ? $c['tail'] : ''));
}
if ($act === 'lf_search') {
  @set_time_limit(90);
  $c = lf_cfg(); $m = lf_mine(); $own = !empty($m['enc']);
  if (!$own && !lf_shared()) fail('NO_PLACES_KEY');
  $city = clean_str(trim(isset($d['city']) ? $d['city'] : ''), 80); $q = clean_str(trim(isset($d['q']) ? $d['q'] : ''), 120);
  if ($city === '' || $q === '') fail('Type a city and a business type.');
  $n = max(20, min(60, (int)(isset($d['n']) ? $d['n'] : 20)));
  $lim = $own ? 0 : lf_limit(); $used = lf_used($KID); if ($lim && $used >= $lim) fail('You have used all ' . $lim . ' free searches for this month — connect your own Google key for unlimited searches.');
  $key = ai_dec($own ? $m['enc'] : $c['enc'], $DATA);
  $mask = 'places.id,places.displayName,places.formattedAddress,places.addressComponents,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.primaryTypeDisplayName,places.googleMapsUri,places.businessStatus,nextPageToken';
  $out = array(); $tok = '';
  for ($page = 0; $page < $n / 20; $page++) {
    $body = array('textQuery' => $q . ' in ' . $city, 'pageSize' => 20, 'languageCode' => 'en', 'regionCode' => 'IN');
    if ($tok !== '') $body['pageToken'] = $tok;
    list($code, $j, $err) = ai_post_raw(lf_url(), array('X-Goog-Api-Key: ' . $key, 'X-Goog-FieldMask: ' . $mask), $body);
    if ($code !== 200) { if ($out) break; fail('Google search failed: ' . ($err ?: 'HTTP ' . $code)); }
    foreach ((isset($j['places']) ? $j['places'] : array()) as $p) {
      $loc = ''; foreach ((isset($p['addressComponents']) ? $p['addressComponents'] : array()) as $ac) if (in_array('locality', isset($ac['types']) ? $ac['types'] : array(), true)) { $loc = isset($ac['longText']) ? $ac['longText'] : ''; break; }
      $out[] = array('id' => $p['id'], 'name' => isset($p['displayName']['text']) ? $p['displayName']['text'] : '', 'address' => isset($p['formattedAddress']) ? $p['formattedAddress'] : '',
        'city' => $loc, 'phone' => isset($p['nationalPhoneNumber']) ? $p['nationalPhoneNumber'] : '', 'intl' => isset($p['internationalPhoneNumber']) ? $p['internationalPhoneNumber'] : '',
        'website' => isset($p['websiteUri']) ? $p['websiteUri'] : '', 'rating' => isset($p['rating']) ? $p['rating'] : 0, 'reviews' => isset($p['userRatingCount']) ? (int)$p['userRatingCount'] : 0,
        'category' => isset($p['primaryTypeDisplayName']['text']) ? $p['primaryTypeDisplayName']['text'] : '', 'maps' => isset($p['googleMapsUri']) ? $p['googleMapsUri'] : '',
        'open' => !isset($p['businessStatus']) || $p['businessStatus'] === 'OPERATIONAL');
    }
    $tok = isset($j['nextPageToken']) ? $j['nextPageToken'] : ''; if ($tok === '') break;
    usleep(400000);
  }
  $u = jread($DATA . '/places-usage.json', array()); $u[$KID] = array('m' => lf_month(), 'n' => $used + 1); jwrite($DATA . '/places-usage.json', $u);
  out(array('ok' => true, 'results' => $out, 'left' => $lim ? max(0, $lim - $used - 1) : -1, 'limit' => $lim));
}

/* ---------------- natural (human-sounding) AI voice for voice chat — Gemini speech ---------------- */
function ai_tts_models($key) {
  global $DATA; $cf = $DATA . '/ai-tts-models.json'; $c = jread($cf, array());
  if (!empty($c['ids']) && isset($c['ts']) && $c['ts'] > time() - 86400) return $c['ids'];
  $ids = array();
  list($code, $b) = array(0, '');
  $ch = curl_init('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200');
  curl_setopt_array($ch, array(CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10, CURLOPT_HTTPHEADER => array('x-goog-api-key: ' . $key)));
  $j = json_decode((string)curl_exec($ch), true); curl_close($ch);
  if (isset($j['models'])) foreach ($j['models'] as $m) { $id = preg_replace('#^models/#', '', isset($m['name']) ? $m['name'] : ''); if (strpos($id, 'tts') !== false) $ids[] = $id; }
  usort($ids, function ($a, $b) { $fa = strpos($a, 'flash') !== false ? 0 : 1; $fb = strpos($b, 'flash') !== false ? 0 : 1; return $fa !== $fb ? $fa - $fb : strcmp($b, $a); });
  if (!$ids) $ids = array('gemini-2.5-flash-preview-tts', 'gemini-2.5-pro-preview-tts');
  jwrite($cf, array('ids' => $ids, 'ts' => time())); return $ids;
}
if ($act === 'tts') {
  @set_time_limit(60);
  $text = clean_str(isset($d['text']) ? $d['text'] : '', 1800); if (trim($text) === '') fail('Nothing to say.');
  $voice = preg_replace('/[^A-Za-z]/', '', isset($d['voice']) ? (string)$d['voice'] : 'Kore') ?: 'Kore';
  $style = clean_str(isset($d['style']) ? $d['style'] : '', 200);
  $mine = jread($AIF, array()); $key = '';
  if (!empty($mine['enc']) && $mine['provider'] === 'gemini') $key = ai_dec($mine['enc'], $DATA);
  if ($key === '') { $pl = ai_platform(); if ($pl && $pl['provider'] === 'gemini') $key = $pl['key']; }
  if ($key === '') fail('NO_TTS');
  $body = array('contents' => array(array('parts' => array(array('text' => ($style !== '' ? $style . ': ' : '') . $text)))),
    'generationConfig' => array('responseModalities' => array('AUDIO'), 'speechConfig' => array('voiceConfig' => array('prebuiltVoiceConfig' => array('voiceName' => $voice)))));
  $last = '';
  foreach (array_slice(ai_tts_models($key), 0, 3) as $m) {
    list($code, $j, $err) = ai_post_raw('https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($m) . ':generateContent', array('x-goog-api-key: ' . $key), $body);
    if (isset($j['candidates'][0]['content']['parts'])) foreach ($j['candidates'][0]['content']['parts'] as $pt) if (isset($pt['inlineData']['data'])) {
      $mt = isset($pt['inlineData']['mimeType']) ? $pt['inlineData']['mimeType'] : 'audio/L16;rate=24000';
      out(array('ok' => true, 'b64' => $pt['inlineData']['data'], 'mime' => $mt, 'model' => $m));
    }
    $last = $err !== '' ? $err : (isset($j['error']['message']) ? $j['error']['message'] : 'no audio');
    if ($code === 429) break;
  }
  fail('Voice: ' . $last);
}

/* ---------------- voice notes on leads (recorded in the pipeline) ---------------- */
$VDIR = $DATA . '/voice/' . $KID;
if ($act === 'voice') {
  $b = base64_decode(isset($d['data']) ? (string)$d['data'] : '', true);
  if ($b === false || strlen($b) < 200) fail('Empty recording.');
  if (strlen($b) > 8 * 1024 * 1024) fail('Recording is too long (max about 5 minutes).');
  if (!is_dir($VDIR)) @mkdir($VDIR, 0755, true);
  $id = 'v' . bin2hex(random_bytes(8));
  $type = preg_match('#^audio/(webm|ogg|mp4|mpeg|wav|x-m4a|aac)(;.*)?$#', isset($d['type']) ? (string)$d['type'] : '') ? preg_replace('/;.*/', '', $d['type']) : 'audio/webm';
  if (!@file_put_contents($VDIR . '/' . $id . '.bin', $b)) fail('Could not save the recording — check folder permissions of lb-data.');
  @file_put_contents($VDIR . '/' . $id . '.type', $type);
  out(array('ok' => true, 'id' => $id));
}
if ($act === 'voiceget' || $act === 'voicedel') {
  $id = preg_replace('/[^a-z0-9]/', '', isset($d['id']) ? (string)$d['id'] : '');
  $f = $VDIR . '/' . $id . '.bin';
  if ($id === '' || !file_exists($f)) fail('Recording not found.');
  if ($act === 'voicedel') { @unlink($f); @unlink($VDIR . '/' . $id . '.type'); out(array('ok' => true)); }
  out(array('ok' => true, 'type' => (string)@file_get_contents($VDIR . '/' . $id . '.type') ?: 'audio/webm', 'data' => base64_encode((string)file_get_contents($f))));
}

/* VPS check, step by step: does the domain point here, is it connected, does it open the site, is https on? */
if ($act === 'vcheck') {
  $domain = strtolower(trim(isset($d['domain']) ? (string)$d['domain'] : ''));
  if (!preg_match('/^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/', $domain)) fail('Invalid domain');
  $bare = preg_replace('/^www\./', '', $domain); $v = vps_info();
  $ips = @gethostbynamel($domain); $ips = $ips ? array_values(array_unique($ips)) : array();
  $wips = @gethostbynamel('www.' . $bare); $wips = $wips ? array_values(array_unique($wips)) : array();
  /* AAAA (IPv6) records that point somewhere else break https and show the old host to some visitors */
  $v6 = array(); foreach ((array)@dns_get_record($domain, DNS_AAAA) as $rr) if (!empty($rr['ipv6'])) $v6[] = $rr['ipv6'];
  $vj = jread($DATA . '/vps.json', array()); $my6 = isset($vj['ip6']) ? $vj['ip6'] : '';
  $bad6 = array(); foreach ($v6 as $x) if ($my6 === '' || inet_pton($x) !== @inet_pton($my6)) $bad6[] = $x;
  $map = jread($DATA . '/domains.json', array()); $target = isset($map[$bare]) ? $map[$bare] : '';
  $slug = $target !== '' ? explode('/', $target)[0] : '';
  $opens = 0; $ours = false; $https = 0; $herr = '';
  if (function_exists('curl_init') && $ips) {
    /* follow the http → https redirect that is added once the certificate exists */
    $c = curl_init('http://' . $domain . '/lb-server.php?action=info'); curl_setopt_array($c, array(CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8, CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 3, CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => 0, CURLOPT_USERAGENT => 'LaunchBuilder-check'));
    $b = curl_exec($c); curl_close($c); $j = json_decode((string)$b, true); $ours = is_array($j) && isset($j['app']) && $j['app'] === 'launchbuilder';
    $c = curl_init('http://' . $domain . '/'); curl_setopt_array($c, array(CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8, CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 3, CURLOPT_SSL_VERIFYPEER => false, CURLOPT_USERAGENT => 'LaunchBuilder-check'));
    curl_exec($c); $opens = (int)curl_getinfo($c, CURLINFO_HTTP_CODE); curl_close($c);
    $c = curl_init('https://' . $domain . '/'); curl_setopt_array($c, array(CURLOPT_RETURNTRANSFER => true, CURLOPT_NOBODY => true, CURLOPT_TIMEOUT => 8, CURLOPT_USERAGENT => 'LaunchBuilder-check'));
    curl_exec($c); $https = (int)curl_getinfo($c, CURLINFO_HTTP_CODE); $herr = curl_error($c); curl_close($c);
  }
  out(array('ok' => true, 'domain' => $domain, 'server_ip' => $v['ip'], 'dns' => $ips, 'www_dns' => $wips,
    'points_here' => $v['ip'] !== '' && in_array($v['ip'], $ips, true), 'connected' => $target !== '', 'published' => $slug !== '' && is_dir($SITES . '/' . $slug),
    'ours' => $ours, 'opens' => $opens, 'https' => $https, 'https_err' => substr($herr, 0, 140), 'aaaa' => $v6, 'bad_aaaa' => $bad6, 'mine' => $target === '' || lb_dom_mine($bare, $ME, $DATA)));
}

/* full step-by-step check of one domain — tells the user exactly which step is missing */
if ($act === 'diag') {
  $domain = strtolower(trim(isset($d['domain']) ? (string)$d['domain'] : ''));
  if (!preg_match('/^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/', $domain)) fail('Invalid domain');
  $base = dirname(dirname(__DIR__)); $sites = array();
  $list = @scandir($base);
  if (is_array($list)) foreach ($list as $x) if ($x[0] !== '.' && @is_dir($base . '/' . $x . '/public_html')) $sites[] = $x;
  $folder = domain_folder($domain);
  $files = array(); if ($folder !== '') { $fl = @scandir($folder); if (is_array($fl)) foreach ($fl as $x) if ($x[0] !== '.') $files[] = $x; }
  $ips = @gethostbynamel($domain); $mine = @gethostbynamel(preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST']));
  list($c1, $b1, $e1) = lb_get('http://' . $domain . '/lb-site.txt');
  list($c2, $b2, $e2) = lb_get('http://' . $domain . '/');
  list($c3, $b3, $e3) = lb_get('https://' . $domain . '/');
  $deploys = jread($DATA . '/deploys.json', array());
  out(array('ok' => true, 'version' => 8, 'domain' => $domain,
    'dns' => $ips ? $ips : array(), 'builder_ips' => $mine ? $mine : array(),
    'can_list' => is_array($list), 'websites' => array_slice($sites, 0, 30),
    'folder' => $folder !== '', 'writable' => $folder !== '' && is_writable($folder), 'files' => array_slice($files, 0, 12),
    'copied' => $folder !== '' && file_exists($folder . '/lb-site.txt'), 'linked' => isset($deploys[$domain]) ? $deploys[$domain] : '',
    'http_marker' => $c1, 'marker_ok' => $c1 === 200 && strlen(trim($b1)) > 0 && strlen($b1) < 200,
    'http_home' => $c2, 'https_home' => $c3, 'https_err' => $e3 ? substr($e3, 0, 120) : ''));
}

/* put a published site into the domain's own Hostinger website folder */
if ($act === 'deploy') {
  if (vps_info()) out(array('ok' => true, 'deployed' => false, 'reason' => 'nofolder'));   /* VPS: nginx serves domains directly */
  $domain = strtolower(trim(isset($d['domain']) ? (string)$d['domain'] : ''));
  $slug = isset($d['slug']) ? $d['slug'] : '';
  $page = isset($d['page']) ? preg_replace('/[^A-Za-z0-9._-]/', '', (string)$d['page']) : '';
  if (!preg_match('/^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/', $domain) || !valid_slug($slug)) fail('Invalid domain');
  $target = $page !== '' && $page !== 'index.html' ? $slug . '/' . $page : $slug;
  $deploys = jread($DATA . '/deploys.json', array());
  foreach ($deploys as $dm => $tg) if ($tg === $target && $dm !== $domain) unset($deploys[$dm]);
  $err = deploy_to($domain, $target, $SITES);
  if ($err === 'nofolder') out(array('ok' => true, 'deployed' => false, 'reason' => 'nofolder'));
  if ($err !== '') fail($err);
  $deploys[$domain] = $target; jwrite($DATA . '/deploys.json', $deploys);
  out(array('ok' => true, 'deployed' => true));
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
  list($c1, $b1) = $get('http://' . $domain . '/lb-server.php?action=info');  // $get follows redirects
  $res['code'] = $c1;
  $j = json_decode($b1, true);
  $res['ours'] = is_array($j) && isset($j['app']) && $j['app'] === 'launchbuilder';
  if ($res['ours']) { list($c2, $b2) = $get('http://' . $domain . '/'); $res['page'] = $c2; }
  $res['folder'] = domain_folder($domain) !== '';
  if (!$res['ours']) { list($c3, $b3) = $get('http://' . $domain . '/lb-site.txt'); $res['site'] = $c3 === 200 && trim($b3) !== '' && strlen($b3) < 200; if ($res['site']) $res['code'] = 200; }
  out($res);
}

/* connect your own domain (DNS A record → this VPS) to one of YOUR published websites — any number of sites, each with its own domain */
if ($act === 'domain') {
  $domain = strtolower(trim(isset($d['domain']) ? (string)$d['domain'] : ''));
  $slug = isset($d['slug']) ? $d['slug'] : '';
  $page = isset($d['page']) ? preg_replace('/[^A-Za-z0-9._-]/', '', (string)$d['page']) : '';
  $target = $page !== '' && $page !== 'index.html' ? $slug . '/' . $page : $slug;
  if (!valid_slug($slug)) fail('Publish the site first');
  if (!lb_site_mine($slug, $ME, $DATA, $SITES)) fail('This website belongs to another account.');
  $map = jread($DATA . '/domains.json', array()); $dw = lb_downers($DATA);
  /* this website (or page) had another custom domain → replace it (free subdomains stay) */
  foreach ($map as $dm => $sl) if ($sl === $target && (!isset($dw[$dm]['kind']) || $dw[$dm]['kind'] !== 'sub') && lb_is_me(isset($dw[$dm]['uid']) ? $dw[$dm]['uid'] : '', $ME)) { unset($map[$dm]); unset($dw[$dm]); }
  /* disconnect a named domain (works even if it was connected to another page of the site) */
  $rm = preg_replace('/^www\./', '', strtolower(trim(isset($d['remove']) ? (string)$d['remove'] : '')));
  if ($rm !== '' && isset($map[$rm])) {
    if (!lb_is_me(isset($dw[$rm]['uid']) ? $dw[$rm]['uid'] : '', $ME)) fail('This domain belongs to another account.');
    unset($map[$rm]); unset($dw[$rm]);
  }
  if ($domain !== '') {
    $bare = preg_replace('/^www\./', '', $domain);
    if (!lb_valid_domain($bare)) fail('Invalid domain');
    $pl = lb_platform_host($bare, $DATA);
    if ($pl === 'app') fail('That is the builder\'s own address — use another domain for your website.');
    if ($pl === 'sub') fail('Addresses ending in this platform\'s domain are free subdomains — create it under "Free subdomains" on the Domains page.');
    if (isset($map[$bare]) && !lb_is_me(isset($dw[$bare]['uid']) ? $dw[$bare]['uid'] : '', $ME)) fail('This domain is already connected by another account. If it is yours, contact support.');
    $dl = lb_limit($ME, $DATA, 'dom_limit');
    $dn = 0; foreach ($dw as $o0) if ($o0['uid'] === $ME['uid'] && $o0['kind'] === 'custom') $dn++;
    if ($dl > 0 && !isset($map[$bare]) && $dn >= $dl) fail('LIMIT: Your plan allows ' . $dl . ' own domain' . ($dl > 1 ? 's' : '') . '. Disconnect one or ask for a bigger plan.');
    $map[$bare] = $target; $dw[$bare] = array('uid' => $ME['uid'], 'kind' => 'custom', 'ts' => time());
  }
  jwrite($DATA . '/domains.json', $map); jwrite($DATA . '/downers.json', $dw);
  if (!vps_info()) write_rules($ROOT, $SITES, $prefix, $map, isset($cfg['sites_domain']) ? $cfg['sites_domain'] : '');
  $mineMap = array(); foreach ($map as $dm => $sl) if (lb_is_me(isset($dw[$dm]['uid']) ? $dw[$dm]['uid'] : '', $ME)) $mineMap[$dm] = $sl;
  out(array('ok' => true, 'domains' => $mineMap));
}

/* old "automatic subdomains for every site" switch — admin only (accounts use Free subdomains instead) */
if ($act === 'sitesdomain') {
  if (!$IS_ADMIN) fail('Only the admin can change this.');
  $sub = strtolower(trim(isset($d['domain']) ? (string)$d['domain'] : ''));
  $sub = preg_replace('/^(\*\.|www\.)/', '', $sub);
  if ($sub !== '' && !lb_valid_domain($sub)) fail('Type a domain like mysites.in or sites.mybrand.com');
  $cfg['sites_domain'] = $sub;
  if (!jwrite($DATA . '/config.json', $cfg)) fail('Could not save settings (lb-data folder permissions).');
  out(array('ok' => true, 'sitesDomain' => $sub));
}

/* ================= my account ================= */
function lb_my_subs($ME, $DATA) {
  $map = jread($DATA . '/domains.json', array()); $dw = lb_downers($DATA); $res = array();
  foreach ($dw as $h => $o) if (isset($o['kind']) && $o['kind'] === 'sub' && isset($map[$h]) && lb_is_me($o['uid'], $ME))
    $res[] = array('host' => $h, 'target' => $map[$h], 'ts' => isset($o['ts']) ? $o['ts'] : 0, 'https' => @file_exists('/etc/nginx/lb-ssl/' . $h . '.conf'));
  usort($res, function ($a, $b) { return $a['ts'] - $b['ts']; });
  return $res;
}
if ($act === 'me') {
  $ts = lb_tenants($DATA);
  out(array('ok' => true, 'uid' => $ME['uid'], 'email' => $ME['email'], 'name' => $ME['name'], 'role' => $ME['role'], 'accounts' => (bool)lb_saas(), 'legacy' => !$TU,
    'tenant' => $ME['tenant'] !== '' && isset($ts[$ME['tenant']]) ? lb_tenant_public($ME['tenant'], $ts[$ME['tenant']]) : null,
    'subBase' => lb_sub_base($ME, $DATA), 'subLimit' => lb_sub_limit($ME, $DATA), 'subsUsed' => count(lb_my_subs($ME, $DATA)), 'siteLimit' => lb_limit($ME, $DATA, 'site_limit'), 'sitesUsed' => lb_count_owned($ME, $DATA, 'site'), 'domLimit' => lb_limit($ME, $DATA, 'dom_limit'), 'domsUsed' => lb_count_owned($ME, $DATA, 'custom'), 'canCreate' => !empty(lb_saas()['service_key']), 'ip' => vps_info()['ip']));
}

/* ---------- free subdomains: name.crecapo.tech (or name.<white-label domain>) — 5 per account ---------- */
if ($act === 'subs') out(array('ok' => true, 'subs' => lb_my_subs($ME, $DATA), 'base' => lb_sub_base($ME, $DATA), 'limit' => lb_sub_limit($ME, $DATA)));
if ($act === 'subclaim') {
  $name = strtolower(trim(isset($d['name']) ? (string)$d['name'] : ''));
  $slug = isset($d['slug']) ? (string)$d['slug'] : '';
  $page = isset($d['page']) ? preg_replace('/[^A-Za-z0-9._-]/', '', (string)$d['page']) : '';
  if (!preg_match('/^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$/', $name)) fail('Use 1–40 lowercase letters, numbers or dashes (not at the start or end).');
  if (lb_reserved($name)) fail('"' . $name . '" is reserved — choose another name.');
  $base = lb_sub_base($ME, $DATA); if ($base === '') fail('Free subdomains are not set up for this workspace yet.');
  if (!valid_slug($slug) || !is_dir($SITES . '/' . $slug)) fail('Publish this website first.');
  if (!lb_site_mine($slug, $ME, $DATA, $SITES)) fail('This website belongs to another account.');
  $host = $name . '.' . $base;
  foreach (lb_tenants($DATA) as $t) if (!empty($t['app_domain']) && strtolower($t['app_domain']) === $host) fail('"' . $name . '" is taken — choose another name.');
  $target = $page !== '' && $page !== 'index.html' ? $slug . '/' . $page : $slug;
  $map = jread($DATA . '/domains.json', array()); $dw = lb_downers($DATA);
  if (isset($map[$host])) {
    if (!(isset($dw[$host]['kind']) && $dw[$host]['kind'] === 'sub' && lb_is_me($dw[$host]['uid'], $ME))) fail('"' . $host . '" is taken — choose another name.');
  } else {
    $lim = lb_sub_limit($ME, $DATA); $used = count(lb_my_subs($ME, $DATA));
    if ($used >= $lim) fail('LIMIT: You can have up to ' . $lim . ' free subdomains. Remove one to add another.');
    $dw[$host] = array('uid' => $ME['uid'], 'kind' => 'sub', 'ts' => time());
  }
  $map[$host] = $target;
  jwrite($DATA . '/domains.json', $map); jwrite($DATA . '/downers.json', $dw);
  out(array('ok' => true, 'host' => $host, 'url' => 'https://' . $host . '/', 'subs' => lb_my_subs($ME, $DATA)));
}
if ($act === 'subdel') {
  $host = strtolower(trim(isset($d['host']) ? (string)$d['host'] : ''));
  $map = jread($DATA . '/domains.json', array()); $dw = lb_downers($DATA);
  if (!isset($dw[$host]) || $dw[$host]['kind'] !== 'sub' || !lb_is_me($dw[$host]['uid'], $ME)) fail('Subdomain not found.');
  unset($map[$host]); unset($dw[$host]);
  jwrite($DATA . '/domains.json', $map); jwrite($DATA . '/downers.json', $dw);
  out(array('ok' => true, 'subs' => lb_my_subs($ME, $DATA)));
}

/* ---------- Google Sheets + email alerts: save / test ---------- */
function lb_remember_forms($ME, $DATA, $ids) {
  if (!$ids) return; $f = $DATA . '/formowners.json'; $fo = jread($f, array()); $ch = false;
  foreach (array_slice($ids, 0, 2000) as $fid) if (is_string($fid) && preg_match('/^[\w-]{3,40}$/', $fid) && !isset($fo[$fid])) { $fo[$fid] = $ME['uid']; $ch = true; }
  if ($ch) jwrite($f, $fo);
}
if ($act === 'gs_status') { $c = gs_cfg($DATA); out(array('ok' => true, 'ready' => !empty($c['enc']), 'robot' => isset($c['robot']) ? $c['robot'] : '', 'admin' => $IS_ADMIN)); }
if ($act === 'gs_setup') {
  if (!$IS_ADMIN) fail('Only the admin can add the Google robot.');
  if (!empty($d['remove'])) { @unlink(gs_file($DATA)); out(array('ok' => true, 'ready' => false)); }
  $raw = trim(isset($d['json']) ? (string)$d['json'] : ''); $k = json_decode($raw, true);
  if (!is_array($k) || empty($k['client_email']) || empty($k['private_key'])) fail('Paste the whole JSON key file (it has "type": "service_account", "client_email" and "private_key").');
  list($tok, $e) = gs_token($DATA, json_encode(array('client_email' => $k['client_email'], 'private_key' => $k['private_key']))); if ($e !== '') fail($e);
  jwrite(gs_file($DATA), array('enc' => ai_enc(json_encode(array('client_email' => $k['client_email'], 'private_key' => $k['private_key'])), $DATA), 'robot' => (string)$k['client_email'], 'project' => isset($k['project_id']) ? (string)$k['project_id'] : '', 'saved' => time())); @chmod(gs_file($DATA), 0600);
  out(array('ok' => true, 'ready' => true, 'robot' => (string)$k['client_email']));
}
if ($act === 'gs_check') {
  $r = gs_check($DATA, isset($d['link']) ? $d['link'] : '', isset($d['tab']) ? $d['tab'] : '', isset($d['gid']) ? $d['gid'] : null); if (isset($r['error'])) fail($r['error']);
  unset($r['token']); out(array('ok' => true) + $r);
}
/* email with email + password */
if ($act === 'mail_get') { $m = jread(mail_file($DATA, $ME['uid']), array()); out(array('ok' => true, 'mail' => !empty($m['enc']) ? mail_public($m) : null)); }
if ($act === 'mail_off') { @unlink(mail_file($DATA, $ME['uid'])); if ($IS_ADMIN) @unlink(mail_file($DATA, 'admin')); out(array('ok' => true, 'mail' => null)); }
if ($act === 'mail_save') {
  $f = mail_file($DATA, $ME['uid']); $old = jread($f, array()); $P = mail_presets();
  $prov = isset($d['provider']) && (isset($P[$d['provider']]) || $d['provider'] === 'custom') ? $d['provider'] : 'gmail';
  $user = strtolower(mail_clean(isset($d['user']) ? $d['user'] : '')); if (!filter_var($user, FILTER_VALIDATE_EMAIL)) fail('Type your full email address.');
  $pass = str_replace(' ', '', (string)(isset($d['pass']) ? $d['pass'] : '')); if ($prov !== 'gmail' && $prov !== 'yahoo') $pass = (string)(isset($d['pass']) ? $d['pass'] : '');
  if ($pass === '' && !empty($old['enc']) && $old['user'] === $user) $pass = ai_dec($old['enc'], $DATA);
  if ($pass === '') fail($prov === 'gmail' ? 'Paste your Gmail App password (16 letters).' : 'Type the password of this email.');
  if ($prov === 'custom') {
    $host = strtolower(preg_replace('/[^a-z0-9.-]/i', '', isset($d['host']) ? $d['host'] : '')); $port = (int)(isset($d['port']) ? $d['port'] : 465);
    $sec = isset($d['sec']) && in_array($d['sec'], array('ssl', 'tls', 'none'), true) ? $d['sec'] : 'ssl';
    if ($host === '' || strpos($host, '.') === false) fail('Type the SMTP server (for example smtp.yourdomain.com).');
    if ($port < 1 || $port > 65535) fail('Type the port (usually 465 or 587).');
  } else list($host, $port, $sec) = $P[$prov];
  $owner = strtolower(mail_clean(isset($d['owner']) ? $d['owner'] : '')); if ($owner === '') $owner = $user; if (!filter_var($owner, FILTER_VALIDATE_EMAIL)) fail('Type a valid email for new-lead alerts.');
  $m = array('provider' => $prov, 'host' => $host, 'port' => $port, 'sec' => $sec, 'user' => $user, 'from' => clean_str(mail_clean(isset($d['from']) ? $d['from'] : ''), 80), 'owner' => $owner);
  $e = smtp_send($m, $pass, $owner, '✓ Your email is connected', '<h2 style="margin:0 0 8px">It works! 🎉</h2><p>Thank-you emails and new-lead alerts will now be sent from <b>' . mail_esc($user) . '</b>.</p>');
  if ($e !== '') fail($e);
  $m['enc'] = ai_enc($pass, $DATA); $m['saved'] = time(); $m['last'] = array('t' => time(), 'err' => '');
  jwrite($f, $m); @chmod($f, 0600);
  if ($IS_ADMIN) { jwrite(mail_file($DATA, 'admin'), $m); @chmod(mail_file($DATA, 'admin'), 0600); }   /* websites made before accounts send as the admin */
  out(array('ok' => true, 'mail' => mail_public($m)));
}

/* v103 — "Save to Google Sheet": send many rows (Lead Finder results, leads) to the account's connected sheet */
if ($act === 'gs_rows') {
  @set_time_limit(180);
  $h = jread(lb_hook_file($DATA, $ME['uid']), array());
  $rows = isset($d['rows']) && is_array($d['rows']) ? array_slice($d['rows'], 0, 2000) : array(); if (!$rows) fail('Nothing to save.');
  $clean = array(); foreach ($rows as $r) { if (!is_array($r)) continue; $o = array(); foreach ($r as $k => $v) { $k = clean_str((string)$k, 60); if ($k !== '') $o[$k] = clean_str(is_scalar($v) ? (string)$v : '', 2000); } if ($o) $clean[] = $o; }
  $tab = clean_str(isset($d['tab']) ? $d['tab'] : 'Leads', 90);
  if (!empty($h['sid'])) { list($url, $e) = gs_put_rows($DATA, $h['sid'], $tab, $clean); if ($e !== '') fail($e); out(array('ok' => true, 'n' => count($clean), 'sheet' => $url, 'tab' => $tab)); }
  if (!empty($h['url'])) {   /* connected with Apps Script: each row goes in as one entry */
    if (count($clean) > 150) fail('With the Apps Script connection you can send up to 150 rows at a time. Select fewer rows — or connect the sheet with its link (Integrations → Google Sheets → Sheet link) for big lists.');
    $n = 0; foreach ($clean as $r) { $lead = array('lid' => 'S' . bin2hex(random_bytes(5)), 'ts' => (int)(microtime(true) * 1000), 'form' => $tab, 'page' => '', 'url' => '', 'site' => '', 'data' => $r);
      list($code, $b, $err) = lb_hook_post($h['url'], lb_hook_payload($lead, array('notify' => false, 'autoreply' => false) + $h), true); if ($err !== '' || $code >= 400) { if (!$n) fail('Could not reach your Apps Script: ' . ($err !== '' ? $err : 'HTTP ' . $code)); break; } $n++; }
    out(array('ok' => true, 'n' => $n, 'sheet' => '', 'tab' => 'Leads'));
  }
  fail('NO_SHEET');
}

if ($act === 'hooks') {
  $hf = lb_hook_file($DATA, $ME['uid']); $h = jread($hf, array());
  if (!empty($d['get'])) out(array('ok' => true, 'hooks' => $h ? $h : null));
  if (isset($d['link']) && trim((string)$d['link']) !== '') {   /* connect with the sheet's link (Google robot) */
    $r = gs_check($DATA, $d['link'], isset($d['tab']) ? $d['tab'] : '', isset($d['gid']) ? $d['gid'] : null); if (isset($r['error'])) fail($r['error']);
    $em = strtolower(trim(isset($d['email']) ? (string)$d['email'] : $ME['email'])); if ($em !== '' && !filter_var($em, FILTER_VALIDATE_EMAIL)) fail('Type a valid email for the alerts.');
    $h = array('mode' => 'link', 'sid' => $r['id'], 'link' => clean_str($d['link'], 400), 'tab' => $r['tab'], 'tabId' => $r['tabId'], 'title' => clean_str($r['title'], 120), 'email' => $em, 'notify' => !empty($d['notify']), 'autoreply' => !empty($d['autoreply']),
      'subject' => clean_str(isset($d['subject']) ? $d['subject'] : '', 150), 'reply' => clean_str(isset($d['reply']) ? $d['reply'] : '', 3000), 'from' => clean_str(isset($d['from']) ? $d['from'] : '', 80), 'saved' => time());
    /* form field → column maps: { formId: { name, cols: { fieldKey: "Column" } } } */
    $h['maps'] = array();
    if (isset($d['maps']) && is_array($d['maps'])) foreach (array_slice($d['maps'], 0, 100, true) as $fid => $m) {
      $fid = preg_replace('/[^A-Za-z0-9_-]/', '', (string)$fid); if ($fid === '' || !is_array($m) || !isset($m['cols']) || !is_array($m['cols'])) continue;
      $cols = array(); foreach (array_slice($m['cols'], 0, 60, true) as $k => $c) { $k = clean_str((string)$k, 60); $c = clean_str((string)$c, 60); if ($k !== '' && trim($c) !== '') $cols[$k] = $c; }
      if (!$cols) continue;
      $one = array('name' => clean_str(isset($m['name']) ? $m['name'] : '', 80), 'cols' => $cols);
      $ft = trim(clean_str(isset($m['tab']) ? $m['tab'] : '', 90));
      if (!empty($m['link']) && trim((string)$m['link']) !== '') {   /* this form has its own Google Sheet */
        $fr = gs_check($DATA, $m['link'], $ft, isset($m['gid']) ? $m['gid'] : null);
        if (isset($fr['error'])) fail('Form “' . $one['name'] . '”: ' . $fr['error']);
        $one += array('link' => clean_str($m['link'], 400), 'sid' => $fr['id'], 'tab' => $fr['tab'], 'tabId' => $fr['tabId'], 'title' => clean_str($fr['title'], 120));
      } elseif ($ft !== '') $one['tab'] = $ft;   /* own tab inside the main sheet */
      $h['maps'][$fid] = $one;
    }
    jwrite($hf, $h); @chmod($hf, 0600);
    if ($IS_ADMIN) jwrite(lb_hook_file($DATA, 'admin'), $h);
    if (isset($d['forms']) && is_array($d['forms'])) lb_remember_forms($ME, $DATA, $d['forms']);
    out(array('ok' => true, 'hooks' => $h));
  }
  $url = trim(isset($d['url']) ? (string)$d['url'] : '');
  if ($url !== '' && preg_match('#script\.google\.com/.*/edit#', $url)) fail('That is the editor link. Use Deploy → New deployment → Web app, and copy the "Web app URL" (it ends with /exec).');
  if ($url !== '' && (strlen($url) > 500 || !preg_match('#^https://[^\s"<>]+$#', $url))) fail('Paste the Web app URL from Apps Script (it starts with https://script.google.com/macros/s/… and ends with /exec).');
  $em = strtolower(trim(isset($d['email']) ? (string)$d['email'] : $ME['email'])); if ($em !== '' && !filter_var($em, FILTER_VALIDATE_EMAIL)) fail('Type a valid email for the alerts.');
  if ($url === '') { @unlink($hf); if ($IS_ADMIN) @unlink(lb_hook_file($DATA, 'admin')); out(array('ok' => true, 'hooks' => null)); }
  $h = array('url' => $url, 'email' => $em, 'notify' => !empty($d['notify']), 'autoreply' => !empty($d['autoreply']), 'subject' => clean_str(isset($d['subject']) ? $d['subject'] : '', 150), 'reply' => clean_str(isset($d['reply']) ? $d['reply'] : '', 3000), 'from' => clean_str(isset($d['from']) ? $d['from'] : '', 80), 'saved' => time());
  jwrite($hf, $h); @chmod($hf, 0600);
  if ($IS_ADMIN) jwrite(lb_hook_file($DATA, 'admin'), $h);   /* websites made before accounts send their leads here too */
  if (isset($d['forms']) && is_array($d['forms'])) lb_remember_forms($ME, $DATA, $d['forms']);
  out(array('ok' => true, 'hooks' => $h));
}
if ($act === 'hooktest') {
  $h = jread(lb_hook_file($DATA, $ME['uid']), array()); if (empty($h['url']) && empty($h['sid'])) fail('Connect your sheet first.');
  $tf = isset($d['form']) ? (string)$d['form'] : ''; if ($tf === '' && !empty($h['maps'])) { $ks = array_keys($h['maps']); $tf = $ks[0]; }
  $lead = array('lid' => 'TEST' . time(), 'form' => $tf !== '' && isset($h['maps'][$tf]) ? $h['maps'][$tf]['name'] : 'Test form', 'formId' => $tf, 'site' => '', 'page' => 'Test from ' . (isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'builder'), 'url' => '', 'ts' => round(microtime(true) * 1000),
    'data' => array('Name' => 'Test Lead', 'Email' => $h['email'] ? $h['email'] : 'test@example.com', 'Phone' => '9876543210', 'Message' => 'This is a test — your sheet and email alerts work'));
  if ($tf !== '' && isset($h['maps'][$tf])) { $td = array(); foreach ($h['maps'][$tf]['cols'] as $k => $c) $td[$k] = preg_match('/mail/i', $k . $c) ? ($h['email'] ? $h['email'] : 'test@example.com') : (preg_match('/phone|mobile|whats|tel/i', $k . $c) ? '9876543210' : 'Test ' . $c); $lead['data'] = $td; }
  if (!empty($h['sid'])) {
    list($url, $e) = gs_append($DATA, $h, $lead); if ($e !== '') fail($e);
    list($mailed, $e2) = lb_hook_mails($DATA, $ME['uid'], $h, $lead, $url);
    out(array('ok' => true, 'sheet' => $url, 'mailed' => $mailed, 'mailNote' => $e2));
  }
  list($code, $b, $err) = lb_hook_post($h['url'], lb_hook_payload($lead, $h), true);
  if ($err !== '') fail('Could not reach the Web app: ' . $err);
  $j = json_decode($b, true);
  if (is_array($j) && !empty($j['ok'])) out(array('ok' => true, 'sheet' => isset($j['sheet']) ? $j['sheet'] : '', 'mailed' => !empty($j['mailed'])));
  if (stripos($b, 'accounts.google.com') !== false || stripos($b, 'ServiceLogin') !== false || $code === 401 || $code === 403) fail('Google asked to sign in — in Apps Script open Deploy → Manage deployments → edit → "Who has access: Anyone", then Deploy again.');
  if (is_array($j) && !empty($j['error'])) fail('The script answered: ' . $j['error']);
  if ($code >= 200 && $code < 400 && !preg_match('#script\.google#', $h['url'])) out(array('ok' => true, 'sheet' => '', 'mailed' => false, 'webhook' => true));
  fail('The Web app answered something unexpected (HTTP ' . $code . '). Paste the whole script again, then Deploy → New deployment → Web app.');
}

/* ================= admin panel =================
   admin  = email listed in /etc/launchbuilder/saas.json → sees everything
   owner  = the owner email of a white-label workspace   → sees only that workspace's accounts */
if (strpos($act, 'adm_') === 0) {
  if ($ME['role'] !== 'admin' && $ME['role'] !== 'owner') fail('Admins only.');
  $OWN_T = $ME['role'] === 'owner' ? $ME['tenant'] : null;   /* null = all workspaces */
}
function lb_counts($DATA) {
  $c = array(); $own = lb_owners($DATA); $dw = lb_downers($DATA);
  foreach ($own as $sl => $o) { if (!isset($c[$o])) $c[$o] = array('sites' => 0, 'subs' => 0, 'domains' => 0); $c[$o]['sites']++; }
  foreach ($dw as $h => $o) { $u = $o['uid']; if (!isset($c[$u])) $c[$u] = array('sites' => 0, 'subs' => 0, 'domains' => 0); $c[$u][$o['kind'] === 'sub' ? 'subs' : 'domains']++; }
  return $c;
}
/* every connected domain + free subdomain, with its account — the admin can disconnect any of them */
if ($act === 'adm_domains') {
  $map = jread($DATA . '/domains.json', array()); $dw = lb_downers($DATA); $users = jread($DATA . '/users.json', array()); $res = array();
  foreach ($map as $h => $t) {
    $uid = isset($dw[$h]['uid']) ? $dw[$h]['uid'] : 'owner'; $u = isset($users[$uid]) ? $users[$uid] : array();
    if ($OWN_T !== null && (!isset($u['tenant']) || $u['tenant'] !== $OWN_T)) continue;
    $res[] = array('host' => $h, 'target' => $t, 'kind' => isset($dw[$h]['kind']) ? $dw[$h]['kind'] : 'custom', 'uid' => $uid,
      'email' => $uid === 'owner' || $uid === '' ? 'admin (old site)' : (isset($u['email']) ? $u['email'] : $uid), 'ts' => isset($dw[$h]['ts']) ? $dw[$h]['ts'] : 0,
      'https' => @file_exists('/etc/nginx/lb-ssl/' . $h . '.conf'));
  }
  usort($res, function ($a, $b) { return $b['ts'] - $a['ts']; });
  out(array('ok' => true, 'domains' => $res));
}
if ($act === 'adm_domain_del') {
  $h = preg_replace('/^www\./', '', strtolower(trim(isset($d['host']) ? (string)$d['host'] : '')));
  $map = jread($DATA . '/domains.json', array()); $dw = lb_downers($DATA);
  if (!isset($map[$h])) fail('Already disconnected.');
  if ($OWN_T !== null) { $users = jread($DATA . '/users.json', array()); $uid = isset($dw[$h]['uid']) ? $dw[$h]['uid'] : ''; if (!isset($users[$uid]['tenant']) || $users[$uid]['tenant'] !== $OWN_T) fail('Not one of your clients\' domains.'); }
  unset($map[$h]); unset($dw[$h]);
  jwrite($DATA . '/domains.json', $map); jwrite($DATA . '/downers.json', $dw);
  if (!vps_info()) write_rules($ROOT, $SITES, $prefix, $map, isset($cfg['sites_domain']) ? $cfg['sites_domain'] : '');
  out(array('ok' => true));
}
if ($act === 'adm_users') {
  $users = jread($DATA . '/users.json', array()); $c = lb_counts($DATA); $S = lb_saas();
  /* with the service key, also list accounts that signed up but never opened the builder since */
  $sbErr = '';
  if ($OWN_T === null && !empty($S['service_key'])) {
    $sk = $S['service_key']; $h = array('apikey: ' . $sk); if (strpos($sk, 'sb_') !== 0) $h[] = 'Authorization: Bearer ' . $sk;
    list($code, $b) = lb_http(rtrim($S['supabase_url'], '/') . '/auth/v1/admin/users?page=1&per_page=1000', $h, 12);
    $j = json_decode($b, true);
    if ($code === 200 && isset($j['users'])) foreach ($j['users'] as $su) {
      $id = $su['id']; $em = strtolower(isset($su['email']) ? $su['email'] : '');
      if (!isset($users[$id])) $users[$id] = array('email' => $em, 'name' => isset($su['user_metadata']['name']) ? $su['user_metadata']['name'] : '', 'tenant' => '', 'created' => strtotime($su['created_at']), 'never' => true);
      if (!empty($su['last_sign_in_at'])) $users[$id]['last_login'] = strtotime($su['last_sign_in_at']);
      $users[$id]['confirmed'] = !empty($su['email_confirmed_at']) || !empty($su['confirmed_at']);
    } else $sbErr = 'Supabase admin list failed (HTTP ' . $code . ') — check service_key in saas.json.';
  }
  $list = array(); $tn = lb_tenants($DATA); $now = time(); $act7 = 0;
  foreach ($users as $id => $u) {
    $t = isset($u['tenant']) ? $u['tenant'] : '';
    if ($OWN_T !== null && $t !== $OWN_T) continue;
    $k = isset($c[$id]) ? $c[$id] : array('sites' => 0, 'subs' => 0, 'domains' => 0);
    $ls = isset($u['last_seen']) ? (int)$u['last_seen'] : 0; if ($ls > $now - 7 * 86400) $act7++;
    $list[] = array('uid' => $id, 'email' => isset($u['email']) ? $u['email'] : '', 'name' => isset($u['name']) ? $u['name'] : '', 'tenant' => $t, 'tenantName' => $t !== '' && isset($tn[$t]) ? $tn[$t]['name'] : '',
      'created' => isset($u['created']) ? (int)$u['created'] : 0, 'last_login' => isset($u['last_login']) ? (int)$u['last_login'] : 0, 'last_seen' => $ls, 'seen' => isset($u['seen']) ? (int)$u['seen'] : 0,
      'ip' => $OWN_T === null && isset($u['ip']) ? $u['ip'] : '', 'dev' => isset($u['dev']) ? $u['dev'] : '', 'disabled' => !empty($u['disabled']), 'never' => !empty($u['never']), 'confirmed' => isset($u['confirmed']) ? $u['confirmed'] : null,
      'sub_limit' => isset($u['sub_limit']) ? $u['sub_limit'] : null, 'site_limit' => isset($u['site_limit']) ? $u['site_limit'] : null, 'dom_limit' => isset($u['dom_limit']) ? $u['dom_limit'] : null, 'admin' => lb_is_admin_email(isset($u['email']) ? $u['email'] : '')) + $k;
  }
  usort($list, function ($a, $b) { return max($b['last_seen'], $b['last_login']) - max($a['last_seen'], $a['last_login']); });
  $tot = array('users' => count($list), 'active7' => $act7, 'sites' => array_sum(array_column($list, 'sites')), 'subs' => array_sum(array_column($list, 'subs')), 'domains' => array_sum(array_column($list, 'domains')), 'tenants' => $OWN_T === null ? count($tn) : 1);
  out(array('ok' => true, 'users' => $list, 'totals' => $tot, 'warn' => $sbErr, 'serviceKey' => !empty($S['service_key']), 'role' => $ME['role']));
}
if ($act === 'adm_user') {
  $id = isset($d['uid']) ? (string)$d['uid'] : ''; $f = $DATA . '/users.json'; $users = jread($f, array());
  if (!isset($users[$id])) fail('This account hasn\'t opened the builder yet — it can be changed after its first login.');
  if ($OWN_T !== null && (isset($users[$id]['tenant']) ? $users[$id]['tenant'] : '') !== $OWN_T) fail('Not your workspace.');
  if (lb_is_admin_email(isset($users[$id]['email']) ? $users[$id]['email'] : '')) fail('Admin accounts can\'t be changed here.');
  if (isset($d['disabled'])) $users[$id]['disabled'] = (bool)$d['disabled'];
  foreach (array('sub_limit', 'site_limit', 'dom_limit') as $lk) if (array_key_exists($lk, $d)) { $v = $d[$lk]; if ($v === null || $v === '') unset($users[$id][$lk]); else $users[$id][$lk] = max(0, min(1000, (int)$v)); }
  if (isset($d['tenant']) && $OWN_T === null) { $tn = lb_tenants($DATA); $tv = (string)$d['tenant']; if ($tv !== '' && !isset($tn[$tv])) fail('Unknown workspace'); $users[$id]['tenant'] = $tv; }
  lb_w($f, $users);
  out(array('ok' => true));
}
/* create a login for a client (email + password) — needs the Supabase secret key in saas.json */
if ($act === 'adm_create_user') {
  $S = lb_saas(); if (empty($S['service_key'])) fail('To create logins here, add the Supabase secret key: on the VPS run  bash /opt/launchbuilder/vps/lb-saas-setup.sh  again and paste it when asked. (Or ask the client to sign up themselves on the builder address.)');
  $em = strtolower(trim(isset($d['email']) ? (string)$d['email'] : '')); $pw = (string)(isset($d['password']) ? $d['password'] : ''); $nm = clean_str(isset($d['name']) ? $d['name'] : '', 80);
  if (!filter_var($em, FILTER_VALIDATE_EMAIL)) fail('Type a valid email.'); if (strlen($pw) < 8) fail('Password: at least 8 characters.');
  $tid = $OWN_T !== null ? $OWN_T : (string)(isset($d['tenant']) ? $d['tenant'] : ''); $tn = lb_tenants($DATA);
  if ($tid !== '' && !isset($tn[$tid])) fail('Unknown workspace.');
  $users = jread($DATA . '/users.json', array());
  if ($tid !== '' && !empty($tn[$tid]['max_users'])) { $c = 0; foreach ($users as $u) if (isset($u['tenant']) && $u['tenant'] === $tid) $c++; if ($c >= (int)$tn[$tid]['max_users']) fail('This workspace has reached its account limit (' . $tn[$tid]['max_users'] . ').'); }
  $sk = $S['service_key']; $h = array('apikey: ' . $sk, 'Content-Type: application/json'); if (strpos($sk, 'sb_') !== 0) $h[] = 'Authorization: Bearer ' . $sk;
  $c = curl_init(rtrim($S['supabase_url'], '/') . '/auth/v1/admin/users');
  curl_setopt_array($c, array(CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15, CURLOPT_HTTPHEADER => $h, CURLOPT_POSTFIELDS => json_encode(array('email' => $em, 'password' => $pw, 'email_confirm' => true, 'user_metadata' => array('name' => $nm)))));
  $b = curl_exec($c); $code = (int)curl_getinfo($c, CURLINFO_HTTP_CODE); curl_close($c); $j = json_decode((string)$b, true);
  if ($code >= 300 || empty($j['id'])) { $m = isset($j['msg']) ? $j['msg'] : (isset($j['message']) ? $j['message'] : (isset($j['error_description']) ? $j['error_description'] : 'HTTP ' . $code)); fail(preg_match('/already|exists|registered/i', $m) ? 'An account with this email already exists.' : 'Supabase: ' . $m); }
  $r = array('email' => $em, 'name' => $nm, 'tenant' => $tid, 'created' => time(), 'first_seen' => 0, 'seen' => 0, 'disabled' => false, 'by' => $ME['email']);
  foreach (array('sub_limit', 'site_limit', 'dom_limit') as $lk) if (isset($d[$lk]) && $d[$lk] !== '' && $d[$lk] !== null) $r[$lk] = max(0, min(1000, (int)$d[$lk]));
  $users[$j['id']] = $r; lb_w($DATA . '/users.json', $users);
  $where = $tid !== '' && !empty($tn[$tid]['app_domain']) ? $tn[$tid]['app_domain'] : lb_main_domain($DATA);
  out(array('ok' => true, 'uid' => $j['id'], 'login' => 'https://' . $where));
}
if ($act === 'adm_tenants') {
  $tn = lb_tenants($DATA); $users = jread($DATA . '/users.json', array()); $res = array();
  foreach ($tn as $id => $t) {
    if ($OWN_T !== null && $id !== $OWN_T) continue;
    $n = 0; foreach ($users as $u) if (isset($u['tenant']) && $u['tenant'] === $id) $n++;
    $res[] = array_merge(array('id' => $id, 'users' => $n, 'https' => !empty($t['app_domain']) && @file_exists('/etc/nginx/lb-ssl/' . $t['app_domain'] . '.conf')), $t);
  }
  out(array('ok' => true, 'tenants' => $res, 'ip' => vps_info()['ip'], 'main' => lb_main_domain($DATA)));
}
if ($act === 'adm_tenant_save') {
  $tn = lb_tenants($DATA); $in = isset($d['tenant']) && is_array($d['tenant']) ? $d['tenant'] : array();
  $id = isset($in['id']) ? preg_replace('/[^a-z0-9-]/', '', strtolower((string)$in['id'])) : '';
  $isNew = $id === '' || !isset($tn[$id]);
  if ($OWN_T !== null && ($isNew || $id !== $OWN_T)) fail('Only the admin can add workspaces.');
  $cur = $isNew ? array('created' => time(), 'active' => true) : $tn[$id];
  $str = function ($k, $max) use ($in, &$cur) { if (isset($in[$k])) $cur[$k] = trim(clean_str($in[$k], $max)); };
  $str('product', 60); $str('support_email', 120); $str('whatsapp', 20);
  if (isset($in['logo'])) {
    /* logo = an https:// link, or an uploaded picture (the builder shrinks it to a small PNG first) */
    $lg = trim((string)$in['logo']); $okL = $lg === '' || (strlen($lg) <= 600 && preg_match('#^https://[^\s"<>]+$#', $lg));
    if (!$okL && preg_match('#^data:image/(png|jpeg|webp|gif);base64,#', $lg, $mm)) { $raw = base64_decode(substr($lg, strlen($mm[0])), true); $okL = $raw !== false && strlen($raw) > 20 && strlen($raw) <= 400000 && @getimagesizefromstring($raw) !== false; }
    if (!$okL) fail('Logo: that picture could not be used — try another image, or paste an https:// image link.');
    $cur['logo'] = $lg;
  }
  foreach (array('color', 'color2') as $ck) if (isset($in[$ck])) { $cv = trim((string)$in[$ck]); if ($cv !== '' && !preg_match('/^#[0-9a-fA-F]{6}$/', $cv)) fail('Colors must look like #f5b301'); $cur[$ck] = $cv; }
  if ($OWN_T === null) {   /* admin-only fields */
    $str('name', 80); if (empty($cur['name'])) fail('Give the workspace a name.');
    foreach (array('app_domain', 'sites_domain') as $dk) if (isset($in[$dk])) {
      $v = strtolower(preg_replace('#^https?://|/.*$#', '', trim((string)$in[$dk]))); $v = preg_replace('/^(\*\.|www\.)/', '', $v);
      if ($v !== '' && !lb_valid_domain($v)) fail(($dk === 'app_domain' ? 'Builder address' : 'Subdomain domain') . ': type a domain like app.abc.com');
      $mn = lb_main_domain($DATA);
      if ($v !== '' && $mn !== '' && ($v === $mn || substr($v, -strlen('.' . $mn)) === '.' . $mn)) fail(($dk === 'app_domain' ? 'Builder address' : 'Subdomain domain') . ': use the client\'s own domain (like app.theirbrand.com), not ' . $mn . '.');
      foreach ($tn as $oid => $ot) if ($oid !== $id && $v !== '' && ((isset($ot['app_domain']) && $ot['app_domain'] === $v) || (isset($ot['sites_domain']) && $ot['sites_domain'] === $v))) fail($v . ' is already used by workspace "' . $ot['name'] . '".');
      $cur[$dk] = $v;
    }
    if (empty($cur['app_domain'])) fail('Builder address is needed (for example app.abc.com).');
    /* the builder address must be a free address: not one that already shows a website */
    $dm0 = jread($DATA . '/domains.json', array());
    if (isset($dm0[$cur['app_domain']])) fail($cur['app_domain'] . ' already shows a website. Use a new address for the builder, like app.' . $cur['app_domain'] . ' (add an A record "app" → your server IP).');
    if (isset($in['owner_email'])) $cur['owner_email'] = strtolower(trim(clean_str($in['owner_email'], 120)));
    if (!empty($cur['owner_email']) && lb_is_admin_email($cur['owner_email'])) fail('That is your admin email. Use the client\'s own email — they create their account with it on their address.');
    foreach (array('max_users', 'sub_limit', 'site_limit', 'dom_limit') as $nk) if (array_key_exists($nk, $in)) $cur[$nk] = $in[$nk] === '' || $in[$nk] === null ? '' : max(0, min(100000, (int)$in[$nk]));
    if (isset($in['active'])) $cur['active'] = (bool)$in['active'];
    if (isset($in['note'])) $cur['note'] = clean_str($in['note'], 500);
    if ($isNew) { $id = preg_replace('/[^a-z0-9-]+/', '-', strtolower($cur['name'])); $id = trim($id, '-') ?: 'ws'; $b0 = $id; $i = 2; while (isset($tn[$id])) $id = $b0 . '-' . $i++; }
  }
  $cur['updated'] = time(); $tn[$id] = $cur; lb_w($DATA . '/tenants.json', $tn);
  out(array('ok' => true, 'id' => $id, 'tenant' => $cur));
}
if ($act === 'adm_tenant_del') {
  if ($OWN_T !== null) fail('Admins only.');
  $tn = lb_tenants($DATA); $id = isset($d['id']) ? (string)$d['id'] : '';
  if (!isset($tn[$id])) fail('Workspace not found.');
  foreach (jread($DATA . '/users.json', array()) as $u) if (isset($u['tenant']) && $u['tenant'] === $id) fail('This workspace still has accounts. Pause it instead (switch "Active" off).');
  unset($tn[$id]); lb_w($DATA . '/tenants.json', $tn); out(array('ok' => true));
}
/* DNS check for a white-label workspace: builder address + wildcard for its subdomains */
if ($act === 'adm_tenant_check') {
  $tn = lb_tenants($DATA); $id = isset($d['id']) ? (string)$d['id'] : '';
  if (!isset($tn[$id]) || ($OWN_T !== null && $id !== $OWN_T)) fail('Workspace not found.');
  $t = $tn[$id]; $ip = vps_info()['ip'];
  $res = function ($h) { $a = @gethostbynamel($h); return $a ? array_values(array_unique($a)) : array(); };
  $app = !empty($t['app_domain']) ? $res($t['app_domain']) : array();
  $probe = !empty($t['sites_domain']) ? 'lbcheck' . mt_rand(1000, 9999) . '.' . $t['sites_domain'] : '';
  $wild = $probe ? $res($probe) : array();
  $opens = 0; if ($app && in_array($ip, $app, true)) { list($opens) = lb_get('http://' . $t['app_domain'] . '/lb-server.php?action=info'); }
  out(array('ok' => true, 'ip' => $ip, 'app' => $app, 'app_ok' => in_array($ip, $app, true), 'app_opens' => $opens,
    'app_https' => !empty($t['app_domain']) && @file_exists('/etc/nginx/lb-ssl/' . $t['app_domain'] . '.conf'), 'wild' => $wild, 'wild_ok' => $probe !== '' && in_array($ip, $wild, true)));
}

fail('Unknown action');
