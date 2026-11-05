#!/usr/bin/env bash
set -euo pipefail

PACKAGE="${1:-com.tuya.smartlife}"
OUT="${2:-smartlife-apks}"
mkdir -p "$OUT"

command -v adb >/dev/null 2>&1 || {
  echo "adb not found" >&2
  exit 2
}
adb get-state >/dev/null

mapfile -t APK_PATHS < <(adb shell pm path "$PACKAGE" | tr -d '\r' | sed 's/^package://')
if ((${#APK_PATHS[@]} == 0)); then
  echo "Package $PACKAGE is not installed or not visible to adb" >&2
  exit 3
fi

printf 'Pulling %d APK split(s) for %s\n' "${#APK_PATHS[@]}" "$PACKAGE"
index=0
for remote in "${APK_PATHS[@]}"; do
  index=$((index + 1))
  base="$(basename "$remote")"
  local_name="$(printf '%02d_%s' "$index" "$base")"
  adb pull "$remote" "$OUT/$local_name"
done

adb shell dumpsys package "$PACKAGE" \
  | tr -d '\r' \
  | grep -E 'versionName=|versionCode=|firstInstallTime=|lastUpdateTime=' \
  > "$OUT/package-version.txt" || true

(
  cd "$OUT"
  sha256sum ./*.apk > SHA256SUMS
)

cat <<EOF
Saved to: $OUT
Manifest: $OUT/package-version.txt
Hashes:   $OUT/SHA256SUMS

Note: pm path/pull retrieves the base and split APKs without root.
The S8-specific Panel MiniApp is usually downloaded after login and is not
necessarily embedded in these APKs.
EOF
