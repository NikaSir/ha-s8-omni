from pathlib import Path

path = Path("custom_components/s8_omni/frontend/s8-omni-panel.js")
text = path.read_text(encoding="utf-8")

old_head = '''const UI_VERSION = "v0.7.7";
function productArtUrl(mode) {
  const safeMode = mode === "dock" ? "dock" : "clean";
  return `/s8_omni/frontend/product-${safeMode}.jpg?v=${encodeURIComponent(UI_VERSION)}`;
}
'''
new_head = '''const UI_VERSION = "v0.7.8";
const ASSET_ROOT = "/s8_omni/frontend/assets";
const PRODUCT_CLEAN_IMAGE = `${ASSET_ROOT}/product-clean.jpg?v=${encodeURIComponent(UI_VERSION)}`;
const PRODUCT_DOCK_IMAGE = `${ASSET_ROOT}/product-dock.jpg?v=${encodeURIComponent(UI_VERSION)}`;

function productArtUrl(mode) {
  return mode === "dock" ? PRODUCT_DOCK_IMAGE : PRODUCT_CLEAN_IMAGE;
}
'''
if old_head not in text:
    raise SystemExit("product-art header marker not found")
text = text.replace(old_head, new_head, 1)

old_status = '    const asset = (name) => `/s8_omni/frontend/status-${name}.jpg?v=${encodeURIComponent(UI_VERSION)}`;'
new_status = '    const asset = (name) => `${ASSET_ROOT}/status-${name}.jpg?v=${encodeURIComponent(UI_VERSION)}`;'
if old_status not in text:
    raise SystemExit("status asset marker not found")
text = text.replace(old_status, new_status, 1)

path.write_text(text, encoding="utf-8")
