from pathlib import Path
import json
import re

JS = Path("custom_components/s8_omni/frontend/s8-omni-panel.js")
CONST = Path("custom_components/s8_omni/const.py")
MANIFEST = Path("custom_components/s8_omni/manifest.json")
PANEL = Path("panel.json")
CHANGELOG = Path("CHANGELOG.md")
CLEAN = Path(".github/product_clean_v075_small.b64")
DOCK = Path(".github/product_dock_v075_small.b64")

clean_b64 = CLEAN.read_text(encoding="ascii").strip()
dock_b64 = DOCK.read_text(encoding="ascii").strip()
if not clean_b64.startswith("/9j/") or not dock_b64.startswith("/9j/"):
    raise SystemExit("approved JPEG sources are invalid")

text = JS.read_text(encoding="utf-8")
text = text.replace('const UI_VERSION = "v0.7.4";', 'const UI_VERSION = "v0.7.5";', 1)

runtime = (
    f'const PRODUCT_ART_CLEAN_BASE64 = "{clean_b64}";\n'
    f'const PRODUCT_ART_DOCK_BASE64 = "{dock_b64}";\n'
    'function productArtData(mode) {\n'
    '  const payload = mode === "dock" ? PRODUCT_ART_DOCK_BASE64 : PRODUCT_ART_CLEAN_BASE64;\n'
    '  return `data:image/jpeg;base64,${payload}`;\n'
    '}\n'
)

# First application: replace the legacy Canvas/WebP runtime.
canvas_pattern = re.compile(
    r'const PRODUCT_ART_BASE64 = ".*?";\nlet _productArtBitmapPromise = null;.*?if \(!customElements\.get\("s8-product-art"\)\) customElements\.define\("s8-product-art", S8ProductArt\);\n',
    re.S,
)
if canvas_pattern.search(text):
    text = canvas_pattern.sub(runtime, text, count=1)
else:
    # Re-runs only refresh the two approved JPEG constants.
    text, c1 = re.subn(r'const PRODUCT_ART_CLEAN_BASE64 = ".*?";\n', f'const PRODUCT_ART_CLEAN_BASE64 = "{clean_b64}";\n', text, count=1, flags=re.S)
    text, c2 = re.subn(r'const PRODUCT_ART_DOCK_BASE64 = ".*?";\n', f'const PRODUCT_ART_DOCK_BASE64 = "{dock_b64}";\n', text, count=1, flags=re.S)
    if c1 != 1 or c2 != 1:
        raise SystemExit(f"approved product-art constants missing: clean={c1} dock={c2}")

text = text.replace(
    '.omni-art{position:absolute;left:4px;top:7px;bottom:7px;width:71%;display:grid;place-items:center;z-index:2}',
    '.omni-art{position:absolute;left:4px;top:7px;bottom:7px;width:73%;display:grid;place-items:center;z-index:2}',
    1,
)
text = text.replace(
    '.product-art{display:block;width:100%;height:100%;max-height:100%;border-radius:20px;filter:drop-shadow(0 10px 13px rgba(43,62,70,.13));transition:opacity .2s ease,filter .2s ease}',
    '.product-art{display:block;width:100%;height:100%;max-height:100%;object-fit:cover;object-position:center;border-radius:18px;filter:drop-shadow(0 9px 13px rgba(43,62,70,.11));transition:opacity .2s ease,filter .2s ease}',
    1,
)
text = re.sub(r'\.tank-glow,\.charge-glow\{.*?\}\.omni-legend\{', '.omni-legend{', text, count=1, flags=re.S)
text = text.replace(
    '.omni-legend{position:absolute;right:8px;top:10px;bottom:10px;width:29%;z-index:5;display:flex;flex-direction:column;justify-content:center;gap:6px;padding:8px 7px;',
    '.omni-legend{position:absolute;right:8px;top:10px;bottom:10px;width:26%;z-index:5;display:flex;flex-direction:column;justify-content:center;gap:7px;padding:9px 8px;',
    1,
)
text = text.replace(
    'const chargeActive = charging || charged || docked;\n    const battery =',
    'const chargeActive = charging || charged || docked;\n    const artMode = chargeActive ? "dock" : "clean";\n    const battery =',
    1,
)
old_markup = '''          <s8-product-art class="product-art" aria-label="S8 OMNI robot and station"></s8-product-art>\n          <i class="tank-glow wash ${wash ? "on" : ""}"></i>\n          <i class="tank-glow dust ${dust ? "on" : ""}"></i>\n          <i class="tank-glow dry ${dry ? "on" : ""}"></i>\n          <i class="charge-glow ${chargeActive ? "on" : ""}"></i>'''
if old_markup in text:
    text = text.replace(old_markup, '          <img class="product-art" src="${productArtData(artMode)}" alt="S8 OMNI robot and station" />', 1)
text = text.replace('.omni-legend{width:31%}.omni-art{width:67%}', '.omni-legend{width:30%}.omni-art{width:69%}', 1)
JS.write_text(text, encoding="utf-8")

const = CONST.read_text(encoding="utf-8")
const = const.replace('VERSION = "v1.00_b037"', 'VERSION = "v1.00_b038"')
const = const.replace('DASHBOARD_VERSION = "v0.7.4"', 'DASHBOARD_VERSION = "v0.7.5"')
CONST.write_text(const, encoding="utf-8")
manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
manifest["version"] = "1.0.0b38"
MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
panel = json.loads(PANEL.read_text(encoding="utf-8"))
panel["panel"]["dashboard_version"] = "v0.7.5"
panel["panel"]["frontend"]["product_art_delivery"] = "embedded_approved_clean_and_dock_jpeg_data_uri"
panel["panel"]["frontend"]["product_art_states"] = ["clean", "dock"]
PANEL.write_text(json.dumps(panel, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
entry = '''## v1.00_b038 / UI v0.7.5\n\n- Installed the two approved product scenes from the accepted UI renders: cleaning and docked.\n- The hero selects the scene from verified dock state: cleaning/away uses the cleaning scene; charging/charged/docked/station operation uses the dock scene.\n- Product art is embedded as compact verified JPEG data URIs inside the standalone frontend bundle.\n- Preserved the HA menu header, live composite state, verified process legend, controls, status cards, navigation and no-synthetic-data rules.\n\n'''
ch = CHANGELOG.read_text(encoding="utf-8")
if entry not in ch:
    CHANGELOG.write_text(entry + ch, encoding="utf-8")
