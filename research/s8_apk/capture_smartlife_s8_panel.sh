#!/usr/bin/env bash
set -euo pipefail

PACKAGE="com.tuya.smartlife"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUTPUT_DIR="${1:-smartlife-s8-panel-${STAMP}}"

if ! command -v adb >/dev/null 2>&1; then
  echo "adb не найден. Установите Android Platform Tools и повторите запуск." >&2
  exit 1
fi

adb start-server >/dev/null
DEVICE_COUNT="$(adb devices | awk 'NR>1 && $2 == "device" {count++} END {print count+0}')"
if [[ "$DEVICE_COUNT" -ne 1 ]]; then
  echo "Нужно подключить ровно одно разблокированное Android-устройство. Найдено: $DEVICE_COUNT" >&2
  adb devices >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"
adb shell am force-stop "$PACKAGE" >/dev/null 2>&1 || true

pull_if_present() {
  local remote_path="$1"
  local local_name="$2"
  if adb shell "test -d '$remote_path'" >/dev/null 2>&1; then
    mkdir -p "$OUTPUT_DIR/$local_name"
    adb pull "$remote_path" "$OUTPUT_DIR/$local_name/" >/dev/null
    echo "Скопировано: $remote_path"
  fi
}

# Общедоступная область приложения. Учётные данные сюда не копируются.
pull_if_present "/sdcard/Android/data/$PACKAGE/files/Godzilla" "external-files"
pull_if_present "/sdcard/Android/data/$PACKAGE/cache/Godzilla" "external-cache"

# На эмуляторе или отладочном устройстве adb root позволяет забрать основной кэш панели.
ROOT_AVAILABLE=false
if adb root >/dev/null 2>&1; then
  adb wait-for-device
  if [[ "$(adb shell id -u 2>/dev/null | tr -d '\r')" == "0" ]]; then
    ROOT_AVAILABLE=true
    pull_if_present "/data/user/0/$PACKAGE/files/Godzilla" "private-files"
    pull_if_present "/data/user/0/$PACKAGE/cache/Godzilla" "private-cache"
  fi
fi

find "$OUTPUT_DIR" -type f -printf '%s\t%p\n' | sort -nr > "$OUTPUT_DIR/inventory.tsv"
find "$OUTPUT_DIR" -type f \( -name '*.js' -o -name '*.json' -o -name '*.bundle' -o -name '*.zip' -o -name '*.gz' -o -name '__SubPackage__Downloaded__' \) -print | sort > "$OUTPUT_DIR/panel_candidates.txt"

if [[ "$ROOT_AVAILABLE" == false ]]; then
  echo "Основной внутренний кэш недоступен: adb root не поддерживается этим устройством."
  echo "Используйте root-доступный Android-эмулятор и повторите запуск."
fi

echo "Готово: $OUTPUT_DIR"
echo "Кандидаты панели: $OUTPUT_DIR/panel_candidates.txt"
