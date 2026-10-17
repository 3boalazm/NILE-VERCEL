#!/usr/bin/env bash
# Full-route crawl audit — the post-F-74 acceptance sweep.
#
# Proves, against a running stack (storefront :3000 + Vendure :3001 + worker):
#   - every real page renders 200 in ar + en
#   - missing products/articles/pages return REAL 404s (the F-74 soft-404
#     regression check — a loading boundary reintroduced above products/
#     would flip these back to HTTP 200 and fail this script)
#   - /offline is served at root only; unknown locale prefixes 307 by design
#   - infra endpoints + content sanity (JSON-LD, WhatsApp/email CTAs,
#     registration badge, zero "2030")
#
# Usage: BASE=http://localhost:3000 bash scripts/crawl-audit.sh
set -u
BASE="${BASE:-http://localhost:3000}"
ROUTES_AR=("" "/about" "/story" "/products" "/products/proxeed-plus" "/products/proxeed-men" "/products/proxeed-women" "/products/proxeed-women-inositol" "/products/proxerex" "/products/ellamuselle" "/products/ca-mi-pulse-oximeter" "/products/ca-mi-ir-thermometer" "/blogs" "/blogs/fertility-supplements-evidence-guide" "/blogs/proxeed-plus-scientific-evidence" "/blogs/proxeed-women-scientific-evidence" "/blogs/proxeed-men-scientific-evidence" "/blogs/proxeed-women-inositol-scientific-evidence" "/blogs/proxerex-scientific-evidence" "/blogs/ellamuselle-scientific-evidence" "/quality-sourcing" "/careers" "/contact" "/shipping-delivery" "/privacy-policy" "/terms" "/cart" "/checkout" "/login" "/register" "/wishlist")
ROUTES_EN=("" "/about" "/story" "/products" "/products/proxeed-plus" "/blogs" "/blogs/proxeed-plus-scientific-evidence" "/quality-sourcing" "/careers" "/contact" "/shipping-delivery" "/privacy-policy" "/terms" "/cart" "/login" "/register" "/wishlist")
PASS=0; FAIL=0
check() {
  local url="$1" expect="$2"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" -g "$url")
  if [ "$code" = "$expect" ]; then PASS=$((PASS+1)); else FAIL=$((FAIL+1)); echo "FAIL $code (want $expect): $url"; fi
}
for r in "${ROUTES_AR[@]}"; do check "$BASE/ar$r" 200; done
for r in "${ROUTES_EN[@]}"; do check "$BASE/en$r" 200; done
# /offline: root only
check "$BASE/offline" 200
check "$BASE/ar/offline" 404
# negatives: must be exactly 404 (F-74 guard — real 404, not soft)
check "$BASE/ar/nonexistent-page" 404
check "$BASE/ar/products/does-not-exist" 404
check "$BASE/en/products/does-not-exist" 404
check "$BASE/ar/products/%D8%BA%D9%8A%D8%B1-%D9%85%D9%88%D8%AC%D9%88%D8%AF" 404
check "$BASE/ar/blogs/not-a-real-article" 404
check "$BASE/en/products/proxeed-plus/extra" 404
# unknown locale prefix → 307 redirect to default locale (by design)
check "$BASE/fr/products" 307
check "$BASE/fr" 307
# infrastructure endpoints
check "$BASE/sitemap.xml" 200
check "$BASE/robots.txt" 200
check "$BASE/manifest.webmanifest" 200
check "$BASE/serwist/sw.js" 200
check "$BASE/admin" 200
# shipping page sanity: MECS carrier line + branch locator (ar + en)
for loc in ar en; do
  ship=$(curl -s "$BASE/$loc/shipping-delivery")
  echo "$ship" | grep -q "ميدل ايست\|Middle East Courier" && PASS=$((PASS+1)) || { FAIL=$((FAIL+1)); echo "FAIL: carrier line missing on $loc shipping page"; }
  echo "$ship" | grep -q 'href="tel:+20' && PASS=$((PASS+1)) || { FAIL=$((FAIL+1)); echo "FAIL: branch tel links missing on $loc shipping page"; }
done
# checkout page mentions the carrier (client-visible promise)
curl -s "$BASE/ar/checkout" | grep -q "ميدل ايست" && PASS=$((PASS+1)) || { FAIL=$((FAIL+1)); echo "FAIL: carrier note missing on ar checkout"; }
# 2026 split: zone 1 FREE + tier prices (85/1400) visible on both locales
curl -s "$BASE/ar/shipping-delivery" | grep -q "1,400 جنيه" && PASS=$((PASS+1)) || { FAIL=$((FAIL+1)); echo "FAIL: 1400 tier missing on ar shipping table"; }
curl -s "$BASE/ar/shipping-delivery" | grep -q "85 جنيه" && PASS=$((PASS+1)) || { FAIL=$((FAIL+1)); echo "FAIL: 85 tier missing on ar shipping table"; }
curl -s "$BASE/en/shipping-delivery" | grep -q "1,400 EGP" && PASS=$((PASS+1)) || { FAIL=$((FAIL+1)); echo "FAIL: 1400 tier missing on en shipping table"; }
# content sanity: JSON-LD Product + Offer on a PDP
pdp=$(curl -s "$BASE/ar/products/proxeed-plus")
echo "$pdp" | grep -q '"@type":"Product"' && PASS=$((PASS+1)) || { FAIL=$((FAIL+1)); echo "FAIL: JSON-LD Product missing on ar PDP"; }
echo "$pdp" | grep -q '"@type":"Offer"' && PASS=$((PASS+1)) || { FAIL=$((FAIL+1)); echo "FAIL: JSON-LD Offer missing on ar PDP"; }
# blog sanity: WhatsApp + email contact CTA on an article
art=$(curl -s "$BASE/ar/blogs/proxeed-plus-scientific-evidence")
echo "$art" | grep -q "wa.me/201024442340" && PASS=$((PASS+1)) || { FAIL=$((FAIL+1)); echo "FAIL: WhatsApp CTA missing on ar article"; }
echo "$art" | grep -q "info@nilepharmafood.com" && PASS=$((PASS+1)) || { FAIL=$((FAIL+1)); echo "FAIL: email CTA missing on ar article"; }
# zero-2030 guarantee + registration badge on live pages
echo "$art" | grep -q "2030" && { FAIL=$((FAIL+1)); echo "FAIL: 2030 found on ar article"; } || PASS=$((PASS+1))
home=$(curl -s "$BASE/ar")
echo "$home" | grep -q "2030" && { FAIL=$((FAIL+1)); echo "FAIL: 2030 found on ar home"; } || PASS=$((PASS+1))
echo "$home" | grep -q "مسجّل لدى NFSA" && PASS=$((PASS+1)) || { FAIL=$((FAIL+1)); echo "FAIL: badge text missing on ar home"; }
echo "═══ CRAWL: $PASS OK / $FAIL FAILED"
[ "$FAIL" -eq 0 ]
