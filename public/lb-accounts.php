<?php
// LaunchBuilder v66 — lb-accounts.php  (included by lb-server.php and lb-router.php)
// Accounts on the server: who is calling (Supabase login), who owns which website / domain / subdomain,
// white-label workspaces (tenants), and limits (5 free subdomains per user).
// Settings live OUTSIDE the web folder in /etc/launchbuilder/saas.json (created by vps/lb-saas-setup.sh).

/* Some servers have PHP without the "curl" add-on (error: Call to undefined function curl_init).
   This small stand-in does the same web requests with PHP's built-in streams, so everything still works. */
if (!function_exists('curl_init')) {
  foreach (array('CURLOPT_URL' => 10002, 'CURLOPT_RETURNTRANSFER' => 19913, 'CURLOPT_TIMEOUT' => 13, 'CURLOPT_CONNECTTIMEOUT' => 78, 'CURLOPT_HTTPHEADER' => 10023,
    'CURLOPT_POST' => 47, 'CURLOPT_POSTFIELDS' => 10015, 'CURLOPT_FOLLOWLOCATION' => 52, 'CURLOPT_MAXREDIRS' => 68, 'CURLOPT_SSL_VERIFYPEER' => 64,
    'CURLOPT_SSL_VERIFYHOST' => 81, 'CURLOPT_USERAGENT' => 10018, 'CURLOPT_NOBODY' => 44, 'CURLOPT_CUSTOMREQUEST' => 10036, 'CURLINFO_HTTP_CODE' => 2097154) as $k => $v)
    if (!defined($k)) define($k, $v);
  function curl_init($url = null) { $h = new stdClass(); $h->o = array(CURLOPT_URL => $url); $h->code = 0; $h->err = ''; return $h; }
  function curl_setopt($h, $k, $v) { $h->o[$k] = $v; return true; }
  function curl_setopt_array($h, $a) { foreach ($a as $k => $v) $h->o[$k] = $v; return true; }
  function curl_getinfo($h, $k = null) { return $k === CURLINFO_HTTP_CODE ? $h->code : array('http_code' => $h->code); }
  function curl_error($h) { return $h->err; }
  function curl_close($h) { }
  function curl_exec($h) {
    $o = $h->o; $g = function ($k, $d) use ($o) { return isset($o[$k]) ? $o[$k] : $d; };
    if (!ini_get('allow_url_fopen')) { $h->err = 'PHP setting allow_url_fopen is off and the curl add-on is missing'; return false; }
    $body = $g(CURLOPT_POSTFIELDS, null); if (is_array($body)) $body = http_build_query($body);
    $method = $g(CURLOPT_CUSTOMREQUEST, '') ?: ($g(CURLOPT_NOBODY, false) ? 'HEAD' : (($g(CURLOPT_POST, false) || $body !== null) ? 'POST' : 'GET'));
    $hd = (array)$g(CURLOPT_HTTPHEADER, array()); $hasCT = false;
    foreach ($hd as $x) if (stripos($x, 'content-type:') === 0) $hasCT = true;
    if ($body !== null && !$hasCT) $hd[] = 'Content-Type: application/x-www-form-urlencoded';
    $hd[] = 'User-Agent: ' . $g(CURLOPT_USERAGENT, 'LaunchBuilder');
    $follow = (bool)$g(CURLOPT_FOLLOWLOCATION, false);
    $http = array('method' => $method, 'header' => implode("\r\n", $hd), 'ignore_errors' => true, 'protocol_version' => 1.1,
      'timeout' => (float)$g(CURLOPT_TIMEOUT, 30), 'follow_location' => $follow ? 1 : 0, 'max_redirects' => $follow ? max(1, (int)$g(CURLOPT_MAXREDIRS, 5)) : 1);
    if ($body !== null) $http['content'] = (string)$body;
    $vp = (bool)$g(CURLOPT_SSL_VERIFYPEER, true);
    $ctx = stream_context_create(array('http' => $http, 'ssl' => array('verify_peer' => $vp, 'verify_peer_name' => $vp && $g(CURLOPT_SSL_VERIFYHOST, 2) ? true : false)));
    $res = @file_get_contents((string)$o[CURLOPT_URL], false, $ctx);
    $lines = function_exists('http_get_last_response_headers') ? (array)http_get_last_response_headers() : (isset($http_response_header) ? $http_response_header : array());
    foreach ($lines as $l) if (preg_match('#^HTTP/\S+\s+(\d{3})#', $l, $m)) $h->code = (int)$m[1];   /* last status line wins (after redirects) */
    if ($res === false && $h->code === 0) { $e = error_get_last(); $h->err = $e ? preg_replace('/^.*?\):\s*/', '', $e['message']) : 'Could not connect'; return false; }
    $res = (string)$res;
    return $g(CURLOPT_RETURNTRANSFER, false) ? $res : (print($res) ? true : true);
  }
}

if (!function_exists('lb_saas')) {

function lb_j($f, $def) { if (!file_exists($f)) return $def; $j = json_decode((string)@file_get_contents($f), true); return is_array($j) ? $j : $def; }
function lb_w($f, $v) {
  /* v114: temp file + swap → readers never see an empty file (that wiped accounts and their limits before) */
  $j = json_encode($v, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | (defined('JSON_INVALID_UTF8_SUBSTITUTE') ? JSON_INVALID_UTF8_SUBSTITUTE : 0));
  if ($j === false) return false;
  $tmp = $f . '.tmp' . bin2hex(random_bytes(4));
  if (@file_put_contents($tmp, $j) === false) { @unlink($tmp); return false; }
  @chmod($tmp, file_exists($f) ? (fileperms($f) & 0777) : 0644);
  if (!@rename($tmp, $f)) { @unlink($tmp); return false; }
  return true;
}
function lb_lock($f) { $h = @fopen($f . '.lock', 'c'); if ($h) flock($h, LOCK_EX); return $h; }
function lb_unlock($h) { if ($h) { flock($h, LOCK_UN); fclose($h); } }
/* /etc/launchbuilder/saas.json → { supabase_url, anon_key, service_key?, admins:[emails], main_domain, sub_limit } */
function lb_saas() {
  static $s = null; if ($s !== null) return $s;
  $f = getenv('LB_SAAS_FILE') ?: '/etc/launchbuilder/saas.json';
  $s = lb_j($f, array());
  if (empty($s['supabase_url']) || empty($s['anon_key'])) $s = array();
  return $s;
}
function lb_host() { return preg_replace('/^www\./', '', strtolower(preg_replace('/:\d+$/', '', isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : ''))); }
function lb_main_domain($DATA) {
  $s = lb_saas(); if (!empty($s['main_domain'])) return strtolower($s['main_domain']);
  $v = lb_j($DATA . '/vps.json', array()); return !empty($v['domain']) ? strtolower($v['domain']) : '';
}
function lb_valid_domain($d) { return is_string($d) && preg_match('/^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/', $d); }

/* ---------- white-label workspaces ---------- */
function lb_tenants($DATA) { return lb_j($DATA . '/tenants.json', array()); }
function lb_tenant_for_host($DATA, $host) {
  foreach (lb_tenants($DATA) as $id => $t) if (!empty($t['app_domain']) && strtolower($t['app_domain']) === $host) return $id;
  return '';
}
/* what the browser may see about a workspace (never the owner's private settings) */
function lb_tenant_public($id, $t) {
  if (!$t) return null;
  return array('id' => $id, 'name' => isset($t['name']) ? $t['name'] : '', 'product' => !empty($t['product']) ? $t['product'] : (isset($t['name']) ? $t['name'] : ''),
    'logo' => isset($t['logo']) ? $t['logo'] : '', 'color' => isset($t['color']) ? $t['color'] : '', 'color2' => isset($t['color2']) ? $t['color2'] : '',
    'support_email' => isset($t['support_email']) ? $t['support_email'] : '', 'whatsapp' => isset($t['whatsapp']) ? $t['whatsapp'] : '',
    'app_domain' => isset($t['app_domain']) ? $t['app_domain'] : '', 'sites_domain' => isset($t['sites_domain']) ? $t['sites_domain'] : '', 'active' => !isset($t['active']) || !empty($t['active']));
}

/* ---------- who is calling: check the Supabase login token with Supabase itself (cached 10 min) ---------- */
function lb_http($url, $headers, $timeout = 8) {
  $c = curl_init($url);
  curl_setopt_array($c, array(CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => $timeout, CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_HTTPHEADER => $headers));
  $b = curl_exec($c); $code = (int)curl_getinfo($c, CURLINFO_HTTP_CODE); curl_close($c);
  return array($code, $b === false ? '' : (string)$b);
}
/* returns the user array, null (no token sent / accounts not set up) or false (token rejected) */
function lb_token_user($tok, $DATA) {
  $s = lb_saas(); if (!$s || !is_string($tok) || strlen($tok) < 10) return null;
  $dir = $DATA . '/tok'; if (!is_dir($dir)) @mkdir($dir, 0700, true);
  $cf = $dir . '/' . substr(hash('sha256', $tok), 0, 40) . '.json';
  if (file_exists($cf) && filemtime($cf) > time() - 600) { $u = lb_j($cf, null); if ($u && !empty($u['id'])) return $u; }
  list($code, $b) = lb_http(rtrim($s['supabase_url'], '/') . '/auth/v1/user', array('apikey: ' . $s['anon_key'], 'Authorization: Bearer ' . $tok));
  if ($code === 0) { if (file_exists($cf)) { $u = lb_j($cf, null); if ($u && !empty($u['id'])) return $u; } $GLOBALS['LB_SB_DOWN'] = true; return null; }   /* Supabase not reachable: use the last answer */
  $j = json_decode($b, true);
  if ($code !== 200 || !is_array($j) || empty($j['id'])) return false;
  $u = array('id' => (string)$j['id'], 'email' => strtolower(isset($j['email']) ? $j['email'] : ''),
    'name' => isset($j['user_metadata']['name']) ? (string)$j['user_metadata']['name'] : (isset($j['user_metadata']['full_name']) ? (string)$j['user_metadata']['full_name'] : ''),   /* full_name = Google sign-in */
    'created' => isset($j['created_at']) ? (int)strtotime($j['created_at']) : 0, 'last_login' => isset($j['last_sign_in_at']) ? (int)strtotime($j['last_sign_in_at']) : 0);
  @file_put_contents($cf, json_encode($u)); @chmod($cf, 0600);
  if (mt_rand(1, 200) === 1) foreach (glob($dir . '/*.json') as $o) if (filemtime($o) < time() - 7200) @unlink($o);
  return $u;
}
function lb_is_admin_email($e) { $s = lb_saas(); foreach ((isset($s['admins']) ? $s['admins'] : array()) as $a) if (strtolower(trim($a)) === strtolower($e) && $e !== '') return true; return false; }
function lb_device() { $ua = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : ''; return preg_match('/iPad|Tablet/i', $ua) ? 'tablet' : (preg_match('/Mobi|Android|iPhone/i', $ua) ? 'mobile' : 'desktop'); }
function lb_ip() { return isset($_SERVER['HTTP_X_REAL_IP']) ? $_SERVER['HTTP_X_REAL_IP'] : (isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : ''); }

/* remembers every account the first time it opens the builder, and when it was last active */
function lb_register($u, $DATA, $hostTenant) {
  $f = $DATA . '/users.json'; $LK = lb_lock($f); $all = lb_j($f, array()); $id = $u['id']; $now = time();
  $admin = lb_is_admin_email($u['email']);
  $r = isset($all[$id]) ? $all[$id] : null; $isNew = !$r; $tenants = lb_tenants($DATA);
  if ($isNew) {
    if ($hostTenant !== '' && !$admin) {
      $t = $tenants[$hostTenant]; $max = isset($t['max_users']) ? (int)$t['max_users'] : 0;
      if ($max > 0) { $n = 0; foreach ($all as $x) if (isset($x['tenant']) && $x['tenant'] === $hostTenant) $n++; if ($n >= $max) { lb_unlock($LK); return array('error' => 'WORKSPACE_FULL: This workspace has reached its account limit. Please contact the owner.'); } }
    }
    $r = array('email' => $u['email'], 'name' => $u['name'], 'tenant' => $admin ? '' : $hostTenant, 'created' => $u['created'] ?: $now, 'first_seen' => $now, 'seen' => 0, 'disabled' => false);
  }
  /* made by the admin before the first login (limits set early): it joins the workspace it logs in on, unless the admin chose one */
  if (!empty($r['pre'])) { if (empty($r['tenant_fixed'])) $r['tenant'] = $admin ? '' : $hostTenant; unset($r['pre'], $r['tenant_fixed'], $r['never']); $r['first_seen'] = $now; $isNew = true; }
  $tn = isset($r['tenant']) ? $r['tenant'] : '';
  /* an account belongs to one workspace: it logs in on that workspace's address */
  if (!$admin && $tn !== $hostTenant) {
    $where = $tn !== '' && isset($tenants[$tn]['app_domain']) ? $tenants[$tn]['app_domain'] : lb_main_domain($DATA);
    lb_unlock($LK); return array('error' => 'WRONG_WORKSPACE: This account belongs to another workspace. Log in at https://' . $where);
  }
  $r['email'] = $u['email']; if ($u['name'] !== '') $r['name'] = $u['name']; if ($u['last_login']) $r['last_login'] = $u['last_login'];
  if ($isNew || $now - (isset($r['last_seen']) ? (int)$r['last_seen'] : 0) > 60) {
    $r['last_seen'] = $now; $r['seen'] = (isset($r['seen']) ? (int)$r['seen'] : 0) + 1; $r['ip'] = lb_ip(); $r['dev'] = lb_device();
    $all[$id] = $r; lb_w($f, $all); @chmod($f, 0600);
  }
  lb_unlock($LK);
  $role = $admin ? 'admin' : ($tn !== '' && isset($tenants[$tn]['owner_email']) && strtolower($tenants[$tn]['owner_email']) === $u['email'] ? 'owner' : 'user');
  return array('uid' => $id, 'email' => $u['email'], 'name' => isset($r['name']) ? $r['name'] : '', 'role' => $role, 'tenant' => $tn,
    'disabled' => !empty($r['disabled']), 'sub_limit' => isset($r['sub_limit']) ? $r['sub_limit'] : null,
    'site_limit' => isset($r['site_limit']) ? $r['site_limit'] : null, 'dom_limit' => isset($r['dom_limit']) ? $r['dom_limit'] : null);
}

/* ---------- ownership: website (slug) → account, domain → account ---------- */
function lb_owners($DATA) { return lb_j($DATA . '/owners.json', array()); }
function lb_downers($DATA) { return lb_j($DATA . '/downers.json', array()); }
/* is this owner id "me"? Websites made before accounts existed (no owner / 'owner') belong to the admins */
function lb_is_me($o, $ME) { return $o === $ME['uid'] || ($ME['role'] === 'admin' && ($o === '' || $o === 'owner')); }
function lb_site_mine($slug, $ME, $DATA, $SITES) {
  $own = lb_owners($DATA); $o = isset($own[$slug]) ? $own[$slug] : '';
  if ($o === '' && !is_dir($SITES . '/' . $slug)) return true;   /* free name */
  return lb_is_me($o, $ME);
}
function lb_claim_site($slug, $ME, $DATA) { $own = lb_owners($DATA); $own[$slug] = $ME['uid']; lb_w($DATA . '/owners.json', $own); }
function lb_my_slugs($ME, $DATA, $SITES) {
  $own = lb_owners($DATA); $res = array();
  foreach ($own as $sl => $o) if (lb_is_me($o, $ME)) $res[$sl] = 1;
  if ($ME['role'] === 'admin') foreach ((array)@scandir($SITES) as $x) if ($x !== '' && $x[0] !== '.' && $x[0] !== '_' && is_dir($SITES . '/' . $x) && !isset($own[$x])) $res[$x] = 1;
  return $res;
}
function lb_dom_mine($host, $ME, $DATA) { $dw = lb_downers($DATA); return lb_is_me(isset($dw[$host]['uid']) ? $dw[$host]['uid'] : '', $ME); }

/* the domain a user's free subdomains live under: crecapo.tech, or the white-label workspace's domain */
function lb_sub_base($ME, $DATA) {
  if ($ME['tenant'] !== '') { $t = lb_tenants($DATA); return isset($t[$ME['tenant']]['sites_domain']) ? strtolower($t[$ME['tenant']]['sites_domain']) : ''; }
  return lb_main_domain($DATA);
}
/* limits per account: websites (published), custom domains — 0 = unlimited. Account setting → workspace default → server default */
function lb_limit($ME, $DATA, $k) {
  if ($ME['role'] === 'admin') return 0;
  if (isset($ME[$k]) && $ME[$k] !== null && $ME[$k] !== '') return (int)$ME[$k];
  if ($ME['tenant'] !== '') { $t = lb_tenants($DATA); if (isset($t[$ME['tenant']][$k]) && $t[$ME['tenant']][$k] !== '') return (int)$t[$ME['tenant']][$k]; }
  $s = lb_saas(); return isset($s[$k]) ? (int)$s[$k] : 0;
}
function lb_count_owned($ME, $DATA, $kind) {
  if ($kind === 'site') { $n = 0; foreach (lb_owners($DATA) as $o) if ($o === $ME['uid']) $n++; return $n; }
  $n = 0; foreach (lb_downers($DATA) as $o) if ($o['uid'] === $ME['uid'] && $o['kind'] === $kind) $n++; return $n;
}
function lb_sub_limit($ME, $DATA) {
  if ($ME['role'] === 'admin') return 1000;
  if ($ME['sub_limit'] !== null && $ME['sub_limit'] !== '') return (int)$ME['sub_limit'];
  if ($ME['tenant'] !== '') { $t = lb_tenants($DATA); if (isset($t[$ME['tenant']]['sub_limit']) && $t[$ME['tenant']]['sub_limit'] !== '') return (int)$t[$ME['tenant']]['sub_limit']; }
  $s = lb_saas(); return isset($s['sub_limit']) ? (int)$s['sub_limit'] : 5;
}
/* addresses that belong to the platform itself (builder, white-label apps, free-subdomain domains) */
function lb_platform_host($host, $DATA) {
  $m = lb_main_domain($DATA);
  if ($m && $host === $m) return 'app';
  $bases = $m ? array($m) : array();
  foreach (lb_tenants($DATA) as $t) { if (!empty($t['app_domain']) && $host === strtolower($t['app_domain'])) return 'app'; if (!empty($t['sites_domain'])) $bases[] = strtolower($t['sites_domain']); }
  /* name.<base> is a free subdomain; the base itself (abc.com) can still be connected to a website */
  foreach ($bases as $b) if (substr($host, -strlen('.' . $b)) === '.' . $b) return 'sub';
  return '';
}
function lb_reserved($label) { return in_array($label, array('www', 'app', 'admin', 'api', 'mail', 'smtp', 'imap', 'pop', 'webmail', 'ftp', 'cpanel', 'whm', 'ns1', 'ns2', 'ns3', 'mx', 'sites', 'static', 'cdn', 'assets', 'support', 'help', 'login', 'auth', 'billing', 'dashboard', 'builder', 'status', 'dev', 'test', 'staging', 'root', 'server', 'vps', 'email'), true); }

}
