<?php
// LaunchBuilder v102 — lb-connect.php  (included by lb-server.php)
// 1) Google Sheets with just a link: the admin adds ONE Google "robot" (service account) once.
//    Every user then shares their sheet with the robot's email and pastes the sheet link — no code.
// 2) Email with email + password: leads' thank-you emails and new-lead alerts go out through the
//    user's own mailbox (Gmail / Zoho / Hostinger / Yahoo / Titan / any SMTP). Passwords are stored encrypted.

/* ================= Google Sheets ================= */
function gs_file($DATA) { return $DATA . '/gsheets.json'; }
function gs_cfg($DATA) { return jread(gs_file($DATA), array()); }
function gs_base() { $b = getenv('LB_GS_BASE'); return $b ? rtrim($b, '/') : ''; }           /* testing only */
function gs_token_url() { $b = gs_base(); return $b ? $b . '/token' : 'https://oauth2.googleapis.com/token'; }
function gs_api() { $b = gs_base(); return ($b ? $b : 'https://sheets.googleapis.com') . '/v4/spreadsheets/'; }
function gs_b64u($s) { return rtrim(strtr(base64_encode($s), '+/', '-_'), '='); }
function gs_robot($DATA) { $c = gs_cfg($DATA); return isset($c['robot']) ? $c['robot'] : ''; }

function gs_http($method, $url, $token, $body = null) {
  $c = curl_init($url);
  $h = array('Accept: application/json'); if ($token !== '') $h[] = 'Authorization: Bearer ' . $token;
  $o = array(CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 25, CURLOPT_CONNECTTIMEOUT => 8, CURLOPT_CUSTOMREQUEST => $method);
  if ($body !== null) { $h[] = 'Content-Type: ' . (is_string($body) ? 'application/x-www-form-urlencoded' : 'application/json'); $o[CURLOPT_POSTFIELDS] = is_string($body) ? $body : json_encode($body); }
  $o[CURLOPT_HTTPHEADER] = $h; curl_setopt_array($c, $o);
  $r = curl_exec($c); $code = (int)curl_getinfo($c, CURLINFO_HTTP_CODE); $err = curl_error($c); curl_close($c);
  $j = json_decode((string)$r, true); if (!is_array($j)) $j = array();
  return array($code, $j, $r === false ? ($err ? $err : 'no answer') : '');
}

/* a short-lived access token for the robot (cached ~1 hour) */
function gs_token($DATA, $keyJson = null) {
  $c = gs_cfg($DATA); $stored = $keyJson === null;
  if ($stored) {
    if (empty($c['enc'])) return array('', 'Google Sheets is not switched on for this server yet — ask the admin to add the Google robot (Integrations → Google Sheets).');
    if (!empty($c['tok']) && isset($c['exp']) && $c['exp'] > time() + 90) { $t = ai_dec($c['tok'], $DATA); if ($t !== '') return array($t, ''); }
    $keyJson = ai_dec($c['enc'], $DATA);
  }
  $k = json_decode((string)$keyJson, true);
  if (!is_array($k) || empty($k['client_email']) || empty($k['private_key'])) return array('', 'The robot key could not be read — paste the whole JSON file again.');
  $now = time();
  $jwt = gs_b64u(json_encode(array('alg' => 'RS256', 'typ' => 'JWT'))) . '.' . gs_b64u(json_encode(array('iss' => $k['client_email'], 'scope' => 'https://www.googleapis.com/auth/spreadsheets', 'aud' => 'https://oauth2.googleapis.com/token', 'iat' => $now, 'exp' => $now + 3600)));
  $sig = '';
  if (!@openssl_sign($jwt, $sig, $k['private_key'], OPENSSL_ALGO_SHA256)) return array('', 'The private key inside the JSON file is not valid — download a new key file and paste it again.');
  list($code, $j, $err) = gs_http('POST', gs_token_url(), '', http_build_query(array('grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer', 'assertion' => $jwt . '.' . gs_b64u($sig))));
  if ($code !== 200 || empty($j['access_token'])) return array('', 'Google did not accept the robot key: ' . ($err !== '' ? $err : (isset($j['error_description']) ? $j['error_description'] : (isset($j['error']) && is_string($j['error']) ? $j['error'] : 'HTTP ' . $code))));
  if ($stored) { $c['tok'] = ai_enc($j['access_token'], $DATA); $c['exp'] = $now + (isset($j['expires_in']) ? (int)$j['expires_in'] : 3600); jwrite(gs_file($DATA), $c); @chmod(gs_file($DATA), 0600); }
  return array($j['access_token'], '');
}

/* "https://docs.google.com/spreadsheets/d/<ID>/edit#gid=123" → [ID, 123] */
function gs_parse($s) {
  $s = trim((string)$s); $id = ''; $gid = null;
  if (preg_match('#/spreadsheets/d/([A-Za-z0-9_-]{20,})#', $s, $m)) $id = $m[1]; elseif (preg_match('#^[A-Za-z0-9_-]{25,}$#', $s)) $id = $s;
  if (preg_match('#[\#&?]gid=(\d+)#', $s, $m)) $gid = (int)$m[1];
  return array($id, $gid);
}
function gs_why($code, $j, $err, $DATA) {
  if ($err !== '') return 'Could not reach Google: ' . $err;
  if ($code === 403 || $code === 401) return 'No permission yet — open your sheet → Share → add ' . gs_robot($DATA) . ' as Editor, then try again.';
  if ($code === 404) return 'This sheet was not found — copy the link again from the address bar of your Google Sheet.';
  return isset($j['error']['message']) ? 'Google: ' . $j['error']['message'] : 'Google answered HTTP ' . $code;
}
/* look at the sheet: its title and tabs, and which tab the leads will go into */
function gs_check($DATA, $link, $tab, $gidIn = null) {
  list($id, $gid) = gs_parse($link); if ($gidIn !== null && $gidIn !== '' && preg_match('/^\d+$/', (string)$gidIn)) $gid = (int)$gidIn;   /* Grid ID typed by hand wins */
  if ($id === '') return array('error' => 'Paste the link of your Google Sheet (it looks like docs.google.com/spreadsheets/d/…).');
  list($tok, $e) = gs_token($DATA); if ($e !== '') return array('error' => $e);
  list($code, $j, $err) = gs_http('GET', gs_api() . $id . '?fields=' . rawurlencode('properties.title,sheets.properties(sheetId,title)'), $tok);
  if ($code !== 200) return array('error' => gs_why($code, $j, $err, $DATA));
  $tabs = array(); foreach ((isset($j['sheets']) ? $j['sheets'] : array()) as $s) $tabs[] = array('id' => (int)$s['properties']['sheetId'], 'title' => (string)$s['properties']['title']);
  $tab = trim((string)$tab); $pick = null;
  if ($tab !== '') { foreach ($tabs as $t) if (strcasecmp($t['title'], $tab) === 0) $pick = $t; if (!$pick) $pick = array('id' => null, 'title' => $tab); }
  elseif ($gid !== null) { foreach ($tabs as $t) if ($t['id'] === $gid) $pick = $t; }
  if (!$pick) $pick = $tabs ? $tabs[0] : array('id' => null, 'title' => 'Leads');
  return array('id' => $id, 'title' => isset($j['properties']['title']) ? $j['properties']['title'] : 'Sheet', 'tabs' => $tabs, 'tab' => $pick['title'], 'tabId' => $pick['id'], 'token' => $tok);
}
function gs_rng($tab, $r) { return rawurlencode("'" . str_replace("'", "''", $tab) . "'!" . $r); }
/* add one lead as a row; the first row holds the column names (new form fields get new columns) */
function gs_append($DATA, $h, $lead) {
  list($tok, $e) = gs_token($DATA); if ($e !== '') return array('', $e);
  $sid = $h['sid']; $tab = $h['tab']; $tabId = isset($h['tabId']) ? $h['tabId'] : null;
  list($code, $j, $err) = gs_http('GET', gs_api() . $sid . '/values/' . gs_rng($tab, '1:1'), $tok);
  if ($code === 400 && $err === '') {   /* the tab does not exist yet → make it */
    list($c2, $j2, $e2) = gs_http('POST', gs_api() . $sid . ':batchUpdate', $tok, array('requests' => array(array('addSheet' => array('properties' => array('title' => $tab))))));
    if ($c2 !== 200) return array('', gs_why($c2, $j2, $e2, $DATA));
    $tabId = isset($j2['replies'][0]['addSheet']['properties']['sheetId']) ? (int)$j2['replies'][0]['addSheet']['properties']['sheetId'] : null; $j = array();
  } elseif ($code !== 200) return array('', gs_why($code, $j, $err, $DATA));
  $old = isset($j['values'][0]) ? array_map('strval', $j['values'][0]) : array();
  $head = $old ? $old : array('Date', 'Form', 'Page', 'Website');
  $data = isset($lead['data']) && is_array($lead['data']) ? $lead['data'] : array();
  /* form field → sheet column (set in Integrations → Google Sheets → Form fields) */
  $fid = isset($lead['formId']) ? (string)$lead['formId'] : ''; $mapped = $fid !== '' && isset($h['maps'][$fid]['cols']) && is_array($h['maps'][$fid]['cols']) && $h['maps'][$fid]['cols'];
  if ($mapped) {
    $nd = array(); foreach ($h['maps'][$fid]['cols'] as $k => $col) { $col = trim((string)$col); if ($col !== '') $nd[$col] = isset($data[$k]) ? $data[$k] : ''; }
    $data = $nd; if (!$old) $head = array('Date');
  }
  foreach ($data as $k => $v) if (!in_array((string)$k, $head, true)) $head[] = (string)$k;
  if ($head !== $old) {
    list($c3, $j3, $e3) = gs_http('PUT', gs_api() . $sid . '/values/' . gs_rng($tab, 'A1') . '?valueInputOption=RAW', $tok, array('values' => array($head)));
    if ($c3 !== 200) return array('', gs_why($c3, $j3, $e3, $DATA));
    if (!$old && $tabId !== null) gs_http('POST', gs_api() . $sid . ':batchUpdate', $tok, array('requests' => array(
      array('repeatCell' => array('range' => array('sheetId' => $tabId, 'startRowIndex' => 0, 'endRowIndex' => 1), 'cell' => array('userEnteredFormat' => array('textFormat' => array('bold' => true), 'backgroundColor' => array('red' => 1, 'green' => 0.96, 'blue' => 0.8))), 'fields' => 'userEnteredFormat(textFormat,backgroundColor)')),
      array('updateSheetProperties' => array('properties' => array('sheetId' => $tabId, 'gridProperties' => array('frozenRowCount' => 1)), 'fields' => 'gridProperties.frozenRowCount')))));
  }
  $ts = isset($lead['ts']) ? (int)($lead['ts'] / 1000) : time();
  $dt = new DateTime('@' . $ts); try { $dt->setTimezone(new DateTimeZone('Asia/Kolkata')); } catch (Exception $x) { /* keep UTC */ }
  $row = array();
  foreach ($head as $c) {
    if ($c === 'Date') $row[] = $dt->format('d M Y, h:i A'); elseif ($c === 'Form') $row[] = isset($lead['form']) ? $lead['form'] : '';
    elseif ($c === 'Page') $row[] = isset($lead['page']) && $lead['page'] !== '' ? $lead['page'] : (isset($lead['url']) ? $lead['url'] : '');
    elseif ($c === 'Website') $row[] = isset($lead['site']) ? $lead['site'] : ''; else $row[] = isset($data[$c]) ? (string)$data[$c] : '';
  }
  list($c4, $j4, $e4) = gs_http('POST', gs_api() . $sid . '/values/' . gs_rng($tab, 'A1') . ':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS', $tok, array('values' => array($row)));
  if ($c4 !== 200) return array('', gs_why($c4, $j4, $e4, $DATA));
  return array('https://docs.google.com/spreadsheets/d/' . $sid . '/edit' . ($tabId !== null ? '#gid=' . $tabId : ''), '');
}

/* many rows at once into a tab (made if missing). $rows = list of [column name => value]; new columns are added to row 1 */
function gs_put_rows($DATA, $sid, $tab, $rows) {
  list($tok, $e) = gs_token($DATA); if ($e !== '') return array('', $e);
  $tab = trim(preg_replace('/[\[\]\*\?\/\\:]+/', ' ', (string)$tab)); $tab = $tab === '' ? 'Leads' : mb_substr($tab, 0, 90);
  list($code, $j, $err) = gs_http('GET', gs_api() . $sid . '?fields=' . rawurlencode('sheets.properties(sheetId,title)'), $tok);
  if ($code !== 200) return array('', gs_why($code, $j, $err, $DATA));
  $tabId = null; foreach ((isset($j['sheets']) ? $j['sheets'] : array()) as $x) if (strcasecmp($x['properties']['title'], $tab) === 0) { $tabId = (int)$x['properties']['sheetId']; $tab = $x['properties']['title']; }
  if ($tabId === null) {
    list($c2, $j2, $e2) = gs_http('POST', gs_api() . $sid . ':batchUpdate', $tok, array('requests' => array(array('addSheet' => array('properties' => array('title' => $tab))))));
    if ($c2 !== 200) return array('', gs_why($c2, $j2, $e2, $DATA));
    $tabId = (int)$j2['replies'][0]['addSheet']['properties']['sheetId']; $old = array();
  } else {
    list($c1, $j1, $e1) = gs_http('GET', gs_api() . $sid . '/values/' . gs_rng($tab, '1:1'), $tok);
    if ($c1 !== 200) return array('', gs_why($c1, $j1, $e1, $DATA));
    $old = isset($j1['values'][0]) ? array_map('strval', $j1['values'][0]) : array();
  }
  $head = $old; foreach ($rows as $r) foreach ($r as $k => $v) if (!in_array((string)$k, $head, true)) $head[] = (string)$k;
  if ($head !== $old) {
    list($c3, $j3, $e3) = gs_http('PUT', gs_api() . $sid . '/values/' . gs_rng($tab, 'A1') . '?valueInputOption=RAW', $tok, array('values' => array($head)));
    if ($c3 !== 200) return array('', gs_why($c3, $j3, $e3, $DATA));
    if (!$old) gs_http('POST', gs_api() . $sid . ':batchUpdate', $tok, array('requests' => array(
      array('repeatCell' => array('range' => array('sheetId' => $tabId, 'startRowIndex' => 0, 'endRowIndex' => 1), 'cell' => array('userEnteredFormat' => array('textFormat' => array('bold' => true), 'backgroundColor' => array('red' => 1, 'green' => 0.96, 'blue' => 0.8))), 'fields' => 'userEnteredFormat(textFormat,backgroundColor)')),
      array('updateSheetProperties' => array('properties' => array('sheetId' => $tabId, 'gridProperties' => array('frozenRowCount' => 1)), 'fields' => 'gridProperties.frozenRowCount')))));
  }
  $vals = array(); foreach ($rows as $r) { $row = array(); foreach ($head as $c) $row[] = isset($r[$c]) ? (string)$r[$c] : ''; $vals[] = $row; }
  list($c4, $j4, $e4) = gs_http('POST', gs_api() . $sid . '/values/' . gs_rng($tab, 'A1') . ':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS', $tok, array('values' => $vals));
  if ($c4 !== 200) return array('', gs_why($c4, $j4, $e4, $DATA));
  return array('https://docs.google.com/spreadsheets/d/' . $sid . '/edit#gid=' . $tabId, '');
}

/* ================= Email with email + password (SMTP) ================= */
function mail_presets() {
  return array(
    'gmail' => array('smtp.gmail.com', 465, 'ssl'), 'zoho' => array('smtp.zoho.in', 465, 'ssl'), 'zohocom' => array('smtp.zoho.com', 465, 'ssl'),
    'hostinger' => array('smtp.hostinger.com', 465, 'ssl'), 'yahoo' => array('smtp.mail.yahoo.com', 465, 'ssl'), 'titan' => array('smtp.titan.email', 465, 'ssl'),
  );
}
function mail_file($DATA, $uid) { $d = $DATA . '/mail'; if (!is_dir($d)) @mkdir($d, 0700, true); return $d . '/' . substr(hash('sha256', 'm:' . $uid), 0, 24) . '.json'; }
function mail_public($m) { if (!$m) return null; $o = $m; unset($o['enc']); return $o; }
function mail_clean($s) { return trim(str_replace(array("\r", "\n", "\0"), ' ', (string)$s)); }
function mail_hdr($s) { $s = mail_clean($s); return preg_match('/[^\x20-\x7e]/', $s) ? '=?UTF-8?B?' . base64_encode($s) . '?=' : $s; }

/* send one HTML email; returns '' when sent, otherwise a plain-English reason */
function smtp_send($m, $pass, $to, $subject, $html, $replyTo = '') {
  $host = $m['host']; $port = (int)$m['port']; $sec = $m['sec']; $user = $m['user'];
  if (!filter_var($to, FILTER_VALIDATE_EMAIL)) return 'Not a valid email address: ' . $to;
  if ($sec === 'none' && !getenv('LB_SMTP_PLAIN')) return 'An encrypted connection is required (use SSL 465 or STARTTLS 587).';
  $ctx = stream_context_create(array('ssl' => array('verify_peer' => true, 'verify_peer_name' => true, 'peer_name' => $host, 'SNI_enabled' => true)));
  $fp = @stream_socket_client(($sec === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port, $en, $es, 15, STREAM_CLIENT_CONNECT, $ctx);
  if (!$fp) return 'Could not connect to ' . $host . ':' . $port . ($es ? ' (' . $es . ')' : '') . ' — check the server name and port, or your VPS may block outgoing email ports.';
  stream_set_timeout($fp, 25);
  $read = function () use ($fp) { $s = ''; while (($l = fgets($fp, 4096)) !== false) { $s .= $l; if (strlen($l) < 4 || $l[3] === ' ') break; } return $s; };
  $cmd = function ($c, $ok) use ($fp, $read) { if ($c !== null) fwrite($fp, $c . "\r\n"); $r = $read(); if (!in_array((int)substr($r, 0, 3), (array)$ok, true)) throw new Exception(trim($r) !== '' ? trim($r) : 'The mail server stopped answering'); return $r; };
  try {
    $me = 'EHLO ' . (preg_replace('/[^a-z0-9.-]/i', '', (string)gethostname()) ?: 'launchbuilder');
    $cmd(null, 220); $cmd($me, 250);
    if ($sec === 'tls') {
      $cmd('STARTTLS', 220);
      $meth = STREAM_CRYPTO_METHOD_TLS_CLIENT; if (defined('STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT')) $meth |= STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT; if (defined('STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT')) $meth |= STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT;
      if (!@stream_socket_enable_crypto($fp, true, $meth)) throw new Exception('Could not start an encrypted connection (STARTTLS)');
      $cmd($me, 250);
    }
    $cmd('AUTH LOGIN', 334); $cmd(base64_encode($user), 334); $cmd(base64_encode($pass), 235);
    $cmd('MAIL FROM:<' . $user . '>', 250); $cmd('RCPT TO:<' . $to . '>', array(250, 251)); $cmd('DATA', 354);
    $from = isset($m['from']) && $m['from'] !== '' ? mail_hdr($m['from']) . ' <' . $user . '>' : $user;
    $dom = substr(strrchr($user, '@'), 1);
    $hd = array('Date: ' . date('r'), 'From: ' . $from, 'To: <' . mail_clean($to) . '>', 'Subject: ' . mail_hdr($subject), 'Message-ID: <' . bin2hex(random_bytes(10)) . '@' . $dom . '>',
      'MIME-Version: 1.0', 'Content-Type: text/html; charset=UTF-8', 'Content-Transfer-Encoding: base64');
    if ($replyTo !== '' && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) $hd[] = 'Reply-To: <' . mail_clean($replyTo) . '>';
    $body = '<!doctype html><html><body style="margin:0;padding:18px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2937">' . $html . '</body></html>';
    $cmd(implode("\r\n", $hd) . "\r\n\r\n" . rtrim(chunk_split(base64_encode($body), 76, "\r\n")) . "\r\n.", 250);
    try { $cmd('QUIT', 221); } catch (Exception $x) { /* already sent */ }
    fclose($fp); return '';
  } catch (Exception $x) {
    @fclose($fp); $r = $x->getMessage();
    if (preg_match('/^535|^534|Username and Password not accepted|authentication failed|Invalid login/i', $r)) {
      return strpos($host, 'gmail') !== false ? 'Gmail did not accept the password. Gmail needs an "App password" (16 letters) — not your normal password. Turn on 2-Step Verification, then create one at myaccount.google.com/apppasswords.'
        : (strpos($host, 'yahoo') !== false ? 'Yahoo did not accept the password — create an "App password" in Yahoo Account Security and use that.' : 'The email or password was not accepted by ' . $host . '.');
    }
    return 'The mail server said: ' . substr($r, 0, 220);
  }
}
/* send with the saved mailbox of this account ($uid). returns '' when sent */
function mail_send_as($DATA, $uid, $to, $subject, $html, $replyTo = '') {
  $f = mail_file($DATA, $uid); $m = jread($f, array()); if (empty($m['enc'])) return 'Email is not connected.';
  $e = smtp_send($m, ai_dec($m['enc'], $DATA), $to, $subject, $html, $replyTo);
  $m['last'] = array('t' => time(), 'err' => $e); jwrite($f, $m); @chmod($f, 0600);
  return $e;
}
function mail_esc($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
function mail_lead_table($lead) {
  $rows = ''; foreach ((isset($lead['data']) ? $lead['data'] : array()) as $k => $v) $rows .= '<tr><td style="padding:6px 12px;color:#5d6785;border-bottom:1px solid #eee">' . mail_esc($k) . '</td><td style="padding:6px 12px;border-bottom:1px solid #eee"><b>' . mail_esc($v) . '</b></td></tr>';
  return '<table style="border-collapse:collapse">' . $rows . '</table>';
}
function mail_lead_get($lead, $re) { foreach ((isset($lead['data']) ? $lead['data'] : array()) as $k => $v) if (preg_match($re, (string)$k)) return trim((string)$v); return ''; }
