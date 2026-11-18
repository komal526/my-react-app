<?php
// LaunchBuilder v66 — lb-accounts.php  (included by lb-server.php and lb-router.php)
// Accounts on the server: who is calling (Supabase login), who owns which website / domain / subdomain,
// white-label workspaces (tenants), and limits (5 free subdomains per user).
// Settings live OUTSIDE the web folder in /etc/launchbuilder/saas.json (created by vps/lb-saas-setup.sh).

if (!function_exists('lb_saas')) {

function lb_j($f, $def) { if (!file_exists($f)) return $def; $j = json_decode((string)@file_get_contents($f), true); return is_array($j) ? $j : $def; }
function lb_w($f, $v) {
  $fp = @fopen($f, 'c+'); if (!$fp) return false;
  flock($fp, LOCK_EX); ftruncate($fp, 0); rewind($fp);
  fwrite($fp, json_encode($v, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
  fflush($fp); flock($fp, LOCK_UN); fclose($fp); return true;
}
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
    'name' => isset($j['user_metadata']['name']) ? (string)$j['user_metadata']['name'] : '',
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
  $f = $DATA . '/users.json'; $all = lb_j($f, array()); $id = $u['id']; $now = time();
  $admin = lb_is_admin_email($u['email']);
  $r = isset($all[$id]) ? $all[$id] : null; $isNew = !$r; $tenants = lb_tenants($DATA);
  if ($isNew) {
    if ($hostTenant !== '' && !$admin) {
      $t = $tenants[$hostTenant]; $max = isset($t['max_users']) ? (int)$t['max_users'] : 0;
      if ($max > 0) { $n = 0; foreach ($all as $x) if (isset($x['tenant']) && $x['tenant'] === $hostTenant) $n++; if ($n >= $max) return array('error' => 'WORKSPACE_FULL: This workspace has reached its account limit. Please contact the owner.'); }
    }
    $r = array('email' => $u['email'], 'name' => $u['name'], 'tenant' => $admin ? '' : $hostTenant, 'created' => $u['created'] ?: $now, 'first_seen' => $now, 'seen' => 0, 'disabled' => false);
  }
  $tn = isset($r['tenant']) ? $r['tenant'] : '';
  /* an account belongs to one workspace: it logs in on that workspace's address */
  if (!$admin && $tn !== $hostTenant) {
    $where = $tn !== '' && isset($tenants[$tn]['app_domain']) ? $tenants[$tn]['app_domain'] : lb_main_domain($DATA);
    return array('error' => 'WRONG_WORKSPACE: This account belongs to another workspace. Log in at https://' . $where);
  }
  $r['email'] = $u['email']; if ($u['name'] !== '') $r['name'] = $u['name']; if ($u['last_login']) $r['last_login'] = $u['last_login'];
  if ($isNew || $now - (isset($r['last_seen']) ? (int)$r['last_seen'] : 0) > 60) {
    $r['last_seen'] = $now; $r['seen'] = (isset($r['seen']) ? (int)$r['seen'] : 0) + 1; $r['ip'] = lb_ip(); $r['dev'] = lb_device();
    $all[$id] = $r; lb_w($f, $all); @chmod($f, 0600);
  }
  $role = $admin ? 'admin' : ($tn !== '' && isset($tenants[$tn]['owner_email']) && strtolower($tenants[$tn]['owner_email']) === $u['email'] ? 'owner' : 'user');
  return array('uid' => $id, 'email' => $u['email'], 'name' => isset($r['name']) ? $r['name'] : '', 'role' => $role, 'tenant' => $tn,
    'disabled' => !empty($r['disabled']), 'sub_limit' => isset($r['sub_limit']) ? $r['sub_limit'] : null);
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
  if ($ME['role'] === 'admin') foreach ((array)@scandir($SITES) as $x) if ($x !== '' && $x[0] !== '.' && is_dir($SITES . '/' . $x) && !isset($own[$x])) $res[$x] = 1;
  return $res;
}
function lb_dom_mine($host, $ME, $DATA) { $dw = lb_downers($DATA); return lb_is_me(isset($dw[$host]['uid']) ? $dw[$host]['uid'] : '', $ME); }

/* the domain a user's free subdomains live under: crecapo.tech, or the white-label workspace's domain */
function lb_sub_base($ME, $DATA) {
  if ($ME['tenant'] !== '') { $t = lb_tenants($DATA); return isset($t[$ME['tenant']]['sites_domain']) ? strtolower($t[$ME['tenant']]['sites_domain']) : ''; }
  return lb_main_domain($DATA);
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
