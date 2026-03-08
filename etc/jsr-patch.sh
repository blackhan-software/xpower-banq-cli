#!/usr/bin/env bash
# jsr-patch.sh — Vendor JSR @std/* packages locally for environments where
# jsr.io is unreachable (e.g. behind an egress proxy that blocks the host).
#
# How it works:
#   1. Downloads denoland/std source from GitHub (codeload.github.com)
#   2. Reads each package's deno.json to discover subpath exports
#   3. Generates a Deno import-map JSON that redirects @std/* → local files
#   4. Prints the path; use with: deno test --import-map=<path> --no-lock --no-check
#
# Usage:
#   bash etc/jsr-patch.sh            # vendor to /tmp/jsr-vendor, print import-map path
#   bash etc/jsr-patch.sh /my/dir    # vendor to custom directory
#
# To run tests with the patched imports:
#   IMPORT_MAP=$(bash etc/jsr-patch.sh)
#   deno test -A --no-lock --no-check --import-map="$IMPORT_MAP" \
#     --env=./etc/banq/banq.env.testnet --env=.env.testnet cli/ cmd/
#
set -euo pipefail

VENDOR_DIR="${1:-/tmp/jsr-vendor}"
STD_DIR="$VENDOR_DIR/std-main"
TARBALL="$VENDOR_DIR/std.tar.gz"
IMPORT_MAP="$VENDOR_DIR/import-map.json"

# Packages to vendor (must match deno.json imports)
PACKAGES=(assert cli dotenv internal)

# ──────────────────────────────────────────────────────────────────────
# Step 1: Download denoland/std from GitHub if not already present
# ──────────────────────────────────────────────────────────────────────
if [[ ! -d "$STD_DIR" ]]; then
  mkdir -p "$VENDOR_DIR"
  echo >&2 "[jsr-patch] Downloading denoland/std from GitHub..."

  # codeload.github.com is typically on the proxy's allowed-hosts list
  curl -sL -o "$TARBALL" \
    "https://codeload.github.com/denoland/std/tar.gz/main"

  if ! file "$TARBALL" | grep -q gzip; then
    echo >&2 "[jsr-patch] ERROR: download failed (not a gzip archive)"
    echo >&2 "           Check proxy settings or download manually."
    rm -f "$TARBALL"
    exit 1
  fi

  tar xzf "$TARBALL" -C "$VENDOR_DIR"
  rm -f "$TARBALL"
  echo >&2 "[jsr-patch] Extracted to $STD_DIR"
else
  echo >&2 "[jsr-patch] Using cached $STD_DIR"
fi

# ──────────────────────────────────────────────────────────────────────
# Step 2: Build import-map from each package's deno.json exports
# ──────────────────────────────────────────────────────────────────────
# We need python3 or node to parse JSON; prefer python3, fall back to node.
if command -v python3 &>/dev/null; then
  JSON_CMD="python3"
elif command -v node &>/dev/null; then
  JSON_CMD="node"
else
  echo >&2 "[jsr-patch] ERROR: need python3 or node to parse deno.json exports"
  exit 1
fi

generate_map() {
  if [[ "$JSON_CMD" == "python3" ]]; then
    python3 - "$STD_DIR" "${PACKAGES[@]}" <<'PYEOF'
import json, sys, os

std_dir = sys.argv[1]
packages = sys.argv[2:]
imports = {}

for pkg in packages:
    pkg_dir = os.path.join(std_dir, pkg)
    deno_json = os.path.join(pkg_dir, "deno.json")
    if not os.path.exists(deno_json):
        print(f"[jsr-patch] WARNING: {deno_json} not found, skipping", file=sys.stderr)
        continue
    with open(deno_json) as f:
        meta = json.load(f)
    exports = meta.get("exports", {})
    for key, val in exports.items():
        # key is like "." or "./parse-args"
        # val is like "./mod.ts" or "./parse_args.ts"
        file_path = os.path.join(pkg_dir, val.lstrip("./"))
        if key == ".":
            imports[f"@std/{pkg}"] = file_path
        else:
            subpath = key.lstrip("./")
            imports[f"@std/{pkg}/{subpath}"] = file_path

print(json.dumps({"imports": imports}, indent=2))
PYEOF
  else
    node -e "
const fs = require('fs'), path = require('path');
const stdDir = process.argv[1];
const packages = process.argv.slice(2);
const imports = {};
for (const pkg of packages) {
  const denoJson = path.join(stdDir, pkg, 'deno.json');
  if (!fs.existsSync(denoJson)) continue;
  const meta = JSON.parse(fs.readFileSync(denoJson, 'utf8'));
  const exports = meta.exports || {};
  for (const [key, val] of Object.entries(exports)) {
    const filePath = path.join(stdDir, pkg, val.replace(/^\\.\\/?/, ''));
    if (key === '.') imports[\`@std/\${pkg}\`] = filePath;
    else imports[\`@std/\${pkg}/\${key.replace(/^\\.\\/?/, '')}\`] = filePath;
  }
}
console.log(JSON.stringify({ imports }, null, 2));
" "$STD_DIR" "${PACKAGES[@]}"
  fi
}

generate_map > "$IMPORT_MAP"
echo >&2 "[jsr-patch] Generated $IMPORT_MAP"

# ──────────────────────────────────────────────────────────────────────
# Step 3: Verify key files exist
# ──────────────────────────────────────────────────────────────────────
MISSING=0
for pkg in "${PACKAGES[@]}"; do
  if [[ ! -f "$STD_DIR/$pkg/deno.json" ]]; then
    echo >&2 "[jsr-patch] WARNING: missing $STD_DIR/$pkg/deno.json"
    MISSING=1
  fi
done
if [[ $MISSING -eq 1 ]]; then
  echo >&2 "[jsr-patch] WARNING: some packages may be incomplete"
fi

# Print the import-map path to stdout (for capture via $(...))
echo "$IMPORT_MAP"
