<?php
// LaunchBuilder v111 — lb-api.php  (included by lb-server.php)
// LEAD API: lets an outside app (e.g. a WhatsApp CRM) PULL the leads of ONE account.
//   GET  /lb-server.php?api=leads            list (newest-safe pagination, filters below)
//   GET  /lb-server.php?api=lead&id=LID      one lead
//   GET  /lb-server.php?api=forms            the forms / pages that have leads (ids + names)
//   GET  /lb-server.php?api=ping             check the key
// Auth: header  "Authorization: Bearer lbk_…"  (or "X-API-Key: lbk_…").  Keys are made per account in
//       Integrations → Lead API; only a hash is stored. Each key sees only its own account's leads.
// Filters for api=leads: since (ISO date or ms — "created after"), from / to (dates), form_id, page_id (site slug),
//       limit (1–500, default 100), cursor (from next_cursor), order=asc|desc (default asc = oldest first, best for syncing).

function lbapi_keys_file($DATA) { return $DATA . '/api-keys.json'; }
function lbapi_json($code, $o) {
  http_response_code($code); header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store');
  echo json_encode($o, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit;
}
function lbapi_err($code, $type, $msg) { lbapi_json($code, array('ok' => false, 'error' => array('type' => $type, 'message' => $msg))); }
function lbapi_log($DATA, $kh, $line) {
  $f = $DATA . '/api-log.txt'; @file_put_contents($f, gmdate('c') . ' ' . substr($kh, 0, 8) . ' ' . $line . "\n", FILE_APPEND);
  if (@filesize($f) > 2000000) { $l = @file($f); if ($l) @file_put_contents($f, implode('', array_slice($l, -5000))); }
}
/* "2026-11-24", "2026-11-24T10:00:00+05:30" or milliseconds → ms */
function lbapi_ms($v) {
  $v = trim((string)$v); if ($v === '') return null;
  if (preg_match('/^\d{10,13}$/', $v)) return strlen($v) === 13 ? (float)$v : (float)$v * 1000;
  $t = strtotime($v); return $t === false ? false : (float)$t * 1000;
}
/* look up one field by what its name means — the forms are user-made, so names vary ("Full name", "your_name", "WhatsApp number"…) */
function lbapi_pick($data, $re, $not = '') {
  foreach ($data as $k => $v) { $k2 = strtolower(preg_replace('/[^a-z0-9]+/i', ' ', (string)$k)); if (preg_match($re, $k2) && ($not === '' || !preg_match($not, $k2)) && trim((string)$v) !== '') return trim((string)$v); }
  return '';
}
function lbapi_phone($raw, $cc) {
  $d = preg_replace('/\D/', '', (string)$raw); if ($d === '') return array('', false);
  if (strlen($d) === 11 && $d[0] === '0') $d = substr($d, 1);
  if (strlen($d) === 10 && $cc !== '') $d = $cc . $d;
  return array($d, strlen($d) >= 10 && strlen($d) <= 15);
}
/* one stored lead → the shape the CRM receives. "fields" always carries every question + answer exactly as submitted. */
function lbapi_lead($l, $cc) {
  $data = isset($l['data']) && is_array($l['data']) ? $l['data'] : array();
  $utm = array(); $fields = array();
  foreach ($data as $k => $v) { if (preg_match('/^utm_[a-z]+$/i', (string)$k)) $utm[strtolower($k)] = (string)$v; else $fields[(string)$k] = (string)$v; }
  $full = lbapi_pick($data, '/^(full )?name$|^your name$|^name /', '/first|last|business|company|page|form/');
  $first = lbapi_pick($data, '/first ?name|^fname$/'); $last = lbapi_pick($data, '/last ?name|surname|^lname$/');
  if ($full === '' && ($first !== '' || $last !== '')) $full = trim($first . ' ' . $last);
  if ($full === '') $full = lbapi_pick($data, '/name/', '/business|company|page|form|user ?name/');
  if ($full !== '' && $first === '') { $p = preg_split('/\s+/', $full, 2); $first = $p[0]; if ($last === '' && isset($p[1])) $last = $p[1]; }
  $wraw = lbapi_pick($data, '/whats ?app|wa number|^wa$/'); $praw = lbapi_pick($data, '/phone|mobile|^tel|contact number|cell/');
  list($phone, $pok) = lbapi_phone($praw !== '' ? $praw : $wraw, $cc); list($wa, $wok) = lbapi_phone($wraw !== '' ? $wraw : $praw, $cc);
  $email = lbapi_pick($data, '/e ?mail/'); if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) $email = '';
  $ts = (float)$l['ts'];
  $o = array(
    'id' => (string)$l['lid'], 'created_at' => gmdate('c', (int)($ts / 1000)), 'created_ms' => $ts,
    'name' => $full, 'first_name' => $first, 'last_name' => $last,
    'phone' => $phone, 'whatsapp' => $wa, 'phone_valid' => $pok, 'whatsapp_valid' => $wok, 'phone_raw' => $praw !== '' ? $praw : $wraw,
    'email' => $email,
    'address' => lbapi_pick($data, '/address|street/'), 'city' => lbapi_pick($data, '/city|town/'), 'state' => lbapi_pick($data, '/state|province|region/'),
    'country' => lbapi_pick($data, '/country/'), 'pincode' => lbapi_pick($data, '/pin ?code|zip|postal/'),
    'form' => array('id' => isset($l['formId']) ? (string)$l['formId'] : '', 'name' => isset($l['form']) ? (string)$l['form'] : ''),
    'page' => array('id' => isset($l['site']) ? (string)$l['site'] : '', 'name' => isset($l['page']) ? (string)$l['page'] : '', 'url' => isset($l['url']) ? (string)$l['url'] : ''),
    'source' => isset($l['source']) ? (string)$l['source'] : 'live-site',
    'utm' => (object)$utm, 'campaign' => isset($utm['utm_campaign']) ? $utm['utm_campaign'] : '',
    'fields' => (object)$fields,
  );
  if (isset($l['payment']) && is_array($l['payment'])) $o['payment'] = array('status' => isset($l['payment']['status']) ? $l['payment']['status'] : '', 'amount' => isset($l['payment']['amount']) ? $l['payment']['amount'] : 0, 'mode' => isset($l['payment']['mode']) ? $l['payment']['mode'] : '');
  return $o;
}

/* ================= the public API (key-authenticated, read-only) ================= */
if (isset($_GET['api']) && ($_SERVER['REQUEST_METHOD'] === 'GET' || $_SERVER['REQUEST_METHOD'] === 'OPTIONS')) {
  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { header('Access-Control-Allow-Origin: *'); header('Access-Control-Allow-Headers: Authorization, X-API-Key'); exit; }
  $hdr = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION']) ? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] : '');
  $tok = preg_match('/^Bearer\s+(\S+)/i', $hdr, $m) ? $m[1] : (isset($_SERVER['HTTP_X_API_KEY']) ? $_SERVER['HTTP_X_API_KEY'] : (isset($_GET['api_key']) ? $_GET['api_key'] : ''));
  if (!preg_match('/^lbk_[a-f0-9]{40}$/', (string)$tok)) lbapi_err(401, 'unauthorized', 'Missing or malformed API key. Send it as "Authorization: Bearer lbk_…".');
  $kh = hash('sha256', $tok); $keys = jread(lbapi_keys_file($DATA), array());
  if (!isset($keys[$kh])) lbapi_err(401, 'unauthorized', 'This API key is not valid (it may have been deleted). Create a new one in Integrations → Lead API.');
  $K = $keys[$kh];
  /* rate limit: 120 requests / minute per key */
  $rf = $DATA . '/api-rate.json'; $rl = jread($rf, array()); $now = time();
  foreach ($rl as $rk => $rv) if ($rv['t'] < $now - 60) unset($rl[$rk]);
  $rl[$kh] = isset($rl[$kh]) ? array('t' => $rl[$kh]['t'], 'n' => $rl[$kh]['n'] + 1) : array('t' => $now, 'n' => 1); jwrite($rf, $rl);
  if ($rl[$kh]['n'] > 120) { header('Retry-After: 60'); lbapi_err(429, 'rate_limited', 'Too many requests — max 120 per minute. Retry after 60 seconds.'); }
  if ((!isset($keys[$kh]['last']) || $keys[$kh]['last'] < $now - 300)) { $keys[$kh]['last'] = $now; jwrite(lbapi_keys_file($DATA), $keys); }

  $owners = array($K['uid']); if (!empty($K['admin'])) { $owners[] = 'admin'; $owners[] = 'owner'; }
  $mine = function ($l) use ($DATA, $owners) { return in_array(lb_lead_owner($l, $DATA), $owners, true); };
  $cc = isset($K['cc']) && preg_match('/^\d{1,4}$/', $K['cc']) ? $K['cc'] : '91';
  $api = (string)$_GET['api'];

  if ($api === 'ping') { lbapi_log($DATA, $kh, 'ping'); lbapi_json(200, array('ok' => true, 'account' => $K['email'], 'key_name' => $K['name'])); }

  if ($api === 'lead') {
    $id = preg_replace('/[^A-Za-z0-9]/', '', isset($_GET['id']) ? $_GET['id'] : ''); if ($id === '') lbapi_err(400, 'bad_request', 'Add ?id=<lead id>.');
    foreach (array_reverse(jread($DATA . '/leads.json', array())) as $l) if (isset($l['lid']) && $l['lid'] === $id) {
      if (!$mine($l)) break;   /* other account's lead → same answer as "not found" */
      lbapi_log($DATA, $kh, 'lead ' . $id); lbapi_json(200, array('ok' => true, 'lead' => lbapi_lead($l, $cc)));
    }
    lbapi_err(404, 'not_found', 'No lead with this id in your account (it may have been deleted).');
  }

  if ($api === 'forms') {
    $f = array(); $p = array();
    foreach (jread($DATA . '/leads.json', array()) as $l) { if (!$mine($l)) continue;
      $fi = isset($l['formId']) ? $l['formId'] : ''; if ($fi !== '') { if (!isset($f[$fi])) $f[$fi] = array('id' => $fi, 'name' => $l['form'], 'leads' => 0, 'last_at' => ''); $f[$fi]['leads']++; $f[$fi]['last_at'] = gmdate('c', (int)($l['ts'] / 1000)); }
      $si = isset($l['site']) ? $l['site'] : ''; if ($si !== '') { if (!isset($p[$si])) $p[$si] = array('id' => $si, 'name' => isset($l['page']) ? $l['page'] : '', 'leads' => 0); $p[$si]['leads']++; } }
    lbapi_log($DATA, $kh, 'forms'); lbapi_json(200, array('ok' => true, 'forms' => array_values($f), 'pages' => array_values($p)));
  }

  if ($api === 'leads') {
    $since = lbapi_ms(isset($_GET['since']) ? $_GET['since'] : ''); $from = lbapi_ms(isset($_GET['from']) ? $_GET['from'] : ''); $to = lbapi_ms(isset($_GET['to']) ? $_GET['to'] : '');
    if ($since === false || $from === false || $to === false) lbapi_err(400, 'bad_request', 'since / from / to must be a date like 2026-11-24 or 2026-11-24T10:00:00Z, or milliseconds.');
    if ($to !== null && isset($_GET['to']) && preg_match('/^\d{4}-\d\d-\d\d$/', $_GET['to'])) $to += 86400000 - 1;   /* "to=2026-11-24" includes that whole day */
    $fid = isset($_GET['form_id']) ? (string)$_GET['form_id'] : ''; $pid = isset($_GET['page_id']) ? (string)$_GET['page_id'] : '';
    $limit = isset($_GET['limit']) ? max(1, min(500, (int)$_GET['limit'])) : 100; $desc = isset($_GET['order']) && $_GET['order'] === 'desc';
    $cur = null; if (!empty($_GET['cursor'])) { $c = json_decode((string)base64_decode(strtr($_GET['cursor'], '-_', '+/')), true); if (!is_array($c) || !isset($c[0], $c[1])) lbapi_err(400, 'bad_cursor', 'This cursor is not valid — start again without it.'); $cur = $c; }
    $rows = array();
    foreach (jread($DATA . '/leads.json', array()) as $l) {
      if (!isset($l['lid'], $l['ts']) || !$mine($l)) continue; $t = (float)$l['ts'];
      if ($since !== null && $t <= $since) continue; if ($from !== null && $t < $from) continue; if ($to !== null && $t > $to) continue;
      if ($fid !== '' && (!isset($l['formId']) || $l['formId'] !== $fid)) continue; if ($pid !== '' && (!isset($l['site']) || $l['site'] !== $pid)) continue;
      $rows[] = $l;
    }
    usort($rows, function ($a, $b) use ($desc) { $c = $a['ts'] == $b['ts'] ? strcmp($a['lid'], $b['lid']) : ($a['ts'] < $b['ts'] ? -1 : 1); return $desc ? -$c : $c; });
    if ($cur) $rows = array_values(array_filter($rows, function ($l) use ($cur, $desc) { $c = $l['ts'] == $cur[0] ? strcmp($l['lid'], $cur[1]) : ($l['ts'] < $cur[0] ? -1 : 1); return $desc ? $c < 0 : $c > 0; }));
    $total = count($rows); $page = array_slice($rows, 0, $limit); $more = $total > $limit;
    $last = $page ? end($page) : null;
    $out = array('ok' => true, 'count' => count($page), 'has_more' => $more, 'next_cursor' => $more && $last ? rtrim(strtr(base64_encode(json_encode(array($last['ts'], $last['lid']))), '+/', '-_'), '=') : null,
      'leads' => array_map(function ($l) use ($cc) { return lbapi_lead($l, $cc); }, $page), 'server_time' => gmdate('c'));
    lbapi_log($DATA, $kh, 'leads n=' . count($page) . ($fid !== '' ? ' form=' . $fid : '') . ($since !== null ? ' since=' . $since : ''));
    lbapi_json(200, $out);
  }
  lbapi_err(404, 'unknown_endpoint', 'Use api=leads, api=lead&id=…, api=forms or api=ping.');
}
