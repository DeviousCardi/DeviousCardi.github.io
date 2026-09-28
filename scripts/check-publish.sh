#!/bin/sh
# Pre-publish gate: refuses to publish private notes, and checks the built
# site is locked down. Run from the repo root: npm run check:publish
set -eu
cd "$(dirname "$0")/.."
fail=0
say() { printf '%s\n' "$*"; }
bad() { say "FAIL: $*"; fail=1; }

say "repo:   $(pwd)"
say "remote: $(git remote get-url origin 2>/dev/null || echo '(none yet)')"
say "dist:   $(pwd)/dist"

# 1. Private working files must never be tracked or built.
for f in PRODUCT.md DESIGN.md .impeccable; do
  git ls-files --error-unmatch "$f" >/dev/null 2>&1 && bad "$f is tracked by git"
  [ -e "dist/$f" ] && bad "$f is inside dist/"
done
git ls-files | grep -Ei '(^|/)\.env|jobs_requirements|\.xlsx$' && bad "job-search or env files are tracked"

# 2. The build exists and every page carries the CSP.
[ -d dist ] || { bad "dist/ missing: run npm run build"; exit 1; }
for page in dist/*.html; do
  grep -q 'http-equiv="Content-Security-Policy"' "$page" || bad "$page has no CSP"
  grep -q '<script>' "$page" && bad "$page has an inline script"
done

# 3. No third-party loads: only links out to known profiles are allowed.
grep -rhoE 'https?://[a-zA-Z0-9.-]+' dist --include='*.js' --include='*.css' --include='*.html' \
  | sort -u \
  | grep -vE '^https://(github\.com|www\.linkedin\.com)$' \
  | grep -vE '^http://www\.w3\.org$' \
  | grep -vE '^https://react\.dev$' \
  | while read -r url; do say "WARN: external URL in build: $url"; done

# 4. No source maps shipped.
find dist -name '*.map' | grep -q . && bad "source maps in dist/"

# 5. Dependencies have no known vulnerabilities.
npm audit --omit=dev --audit-level=low >/dev/null 2>&1 || bad "npm audit reports vulnerabilities (run npm audit)"

[ "$fail" -eq 0 ] && say "OK: safe to publish" || { say "Refusing to publish."; exit 1; }
