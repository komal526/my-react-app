<?php
// LaunchBuilder (VPS mode): Caddy asks "may I create an SSL certificate for this domain?"
// 200 = yes (it's connected to a website), 404 = no. Only reachable from the server itself.
$DATA = __DIR__ . '/lb-data'; $SITES = __DIR__ . '/sites';
function jr($f) { if (!file_exists($f)) return array(); $j = json_decode((string)@file_get_contents($f), true); return is_array($j) ? $j : array(); }
$d = strtolower(trim(isset($_GET['domain']) ? (string)$_GET['domain'] : ''));
$bare = preg_replace('/^www\./', '', $d);
$ok = false;
$map = jr($DATA . '/domains.json'); if (isset($map[$bare])) $ok = true;
$cfg = jr($DATA . '/config.json');
if (!$ok && !empty($cfg['sites_domain'])) { $sd = $cfg['sites_domain']; if (substr($bare, -strlen('.' . $sd)) === '.' . $sd) { $label = substr($bare, 0, -strlen('.' . $sd)); $ok = preg_match('/^[a-z0-9][a-z0-9-]{0,60}$/', $label) && is_dir($SITES . '/' . $label); } }
http_response_code($ok ? 200 : 404); echo $ok ? 'ok' : 'no';
