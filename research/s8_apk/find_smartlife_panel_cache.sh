#!/usr/bin/env bash
set -euo pipefail

PACKAGE="${1:-com.tuya.smartlife}"

command -v adb >/dev/null 2>&1 || {
  echo "adb not found" >&2
  exit 2
}
adb get-state >/dev/null

cat <<'EOF'
This read-only scan needs root on the Android test device/emulator.
It lists likely MiniApp bundles without copying account databases, cookies,
tokens, or local keys. Review the list before pulling any individual file.
EOF

adb shell su -c "find /data/user/0/$PACKAGE \
  -type f \
  \( -iname '*.js' -o -iname '*.json' -o -iname '*.zip' -o -iname '*.mpk' -o -iname '*.tpk' -o -iname '*.bundle' \) \
  -size +1k \
  2>/dev/null" \
  | tr -d '\r' \
  | grep -Ei 'mini|panel|ray|thing|tuya|robot|sweep|resource|bundle|plugin' \
  | sort -u
