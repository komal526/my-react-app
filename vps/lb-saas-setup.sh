#!/bin/bash
# LaunchBuilder v66 — lb-saas-setup.sh
# ONE-TIME on the VPS (as root):  bash /opt/launchbuilder/vps/lb-saas-setup.sh
# Turns on accounts on the server: every login sees only its own websites, leads and domains,
# you (admin) get the Admin page, white-label workspaces work, and free subdomains (name.crecapo.tech, 5 per account).
# Run it again any time to change the admin emails or the subdomain limit.
set -e
WEB=${WEB:-/var/www/crecapo.tech}
APP=${APP:-/opt/launchbuilder}
OUT=/etc/launchbuilder/saas.json
mkdir -p /etc/launchbuilder

echo "== LaunchBuilder accounts setup =="
ENVF=""; for f in "$APP/.env" "$APP/.env.production" "$APP/.env.local"; do [ -f "$f" ] && ENVF="$f" && break; done
[ -n "$ENVF" ] || { echo "✕ No .env found in $APP (it should have VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)."; exit 1; }
getv() { grep -E "^$1=" "$ENVF" | tail -1 | cut -d= -f2- | tr -d '"'"'"' \r'; }
SURL=$(getv VITE_SUPABASE_URL); SANON=$(getv VITE_SUPABASE_ANON_KEY)
[ -n "$SURL" ] && [ -n "$SANON" ] || { echo "✕ VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing in $ENVF"; exit 1; }
echo "✓ Supabase: $SURL  (public key from $ENVF)"

OLD=$( [ -f "$OUT" ] && cat "$OUT" || echo '{}' )
old() { php -r '$j=json_decode($argv[1],true)?:[]; $v=$j[$argv[2]]??""; echo is_array($v)?implode(",",$v):$v;' "$OLD" "$1"; }
DEF_MAIN=$(old main_domain); [ -n "$DEF_MAIN" ] || DEF_MAIN=$(php -r '$v=json_decode(@file_get_contents($argv[1]),true)?:[]; echo $v["domain"]??"crecapo.tech";' "$WEB/lb-data/vps.json")
DEF_ADM=$(old admins); DEF_LIM=$(old sub_limit); [ -n "$DEF_LIM" ] || DEF_LIM=5

read -r -p "Admin email(s), comma separated [$DEF_ADM]: " ADM; ADM=${ADM:-$DEF_ADM}
[ -n "$ADM" ] || { echo "✕ At least one admin email is needed (the email you log in to the builder with)."; exit 1; }
read -r -p "Main domain for free subdomains [$DEF_MAIN]: " MAIN; MAIN=${MAIN:-$DEF_MAIN}
read -r -p "Free subdomains per account [$DEF_LIM]: " LIM; LIM=${LIM:-$DEF_LIM}
echo "Optional: Supabase SECRET key (service_role / sb_secret_…) lets the Admin page list EVERY account,"
echo "including ones that signed up but never opened the builder. It stays only on this server. Press Enter to skip."
read -r -s -p "Secret key (hidden, Enter = keep/skip): " SKEY; echo
[ -n "$SKEY" ] || SKEY=$(old service_key)

php -r '
  $o = ["supabase_url"=>$argv[1], "anon_key"=>$argv[2], "admins"=>array_values(array_filter(array_map(function($x){return strtolower(trim($x));}, explode(",", $argv[3])))),
        "main_domain"=>strtolower(trim($argv[4])), "sub_limit"=>(int)$argv[5]];
  if ($argv[6] !== "") $o["service_key"] = $argv[6];
  file_put_contents($argv[7], json_encode($o, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES)."\n");' "$SURL" "$SANON" "$ADM" "$MAIN" "$LIM" "$SKEY" "$OUT"
chown root:www-data "$OUT"; chmod 640 "$OUT"
mkdir -p "$WEB/lb-data"; chown -R www-data:www-data "$WEB/lb-data"
echo "✓ Saved $OUT (readable only by root and the web server)"
echo "  Admins: $ADM · Free subdomains: name.$MAIN · $LIM per account"

IP=$(php -r '$v=json_decode(@file_get_contents($argv[1]),true)?:[]; echo $v["ip"]??"";' "$WEB/lb-data/vps.json")
echo
echo "== One DNS record for free subdomains (once) =="
echo "Where $MAIN's DNS is managed (Hostinger → Domains → $MAIN → DNS records) add:"
echo "   Type A    Name *    Points to ${IP:-<your VPS IP>}    TTL 3600"
echo "Then name.$MAIN opens that account's website, with https added automatically within ~2 minutes."
echo
if curl -s --max-time 5 "http://127.0.0.1/lb-server.php?action=info" -H "Host: $MAIN" | grep -q '"accounts":true'; then echo "✓ Server answers with accounts ON"; else echo "• Run lb-deploy (new lb-server.php v14 + lb-accounts.php), then reload the builder."; fi
