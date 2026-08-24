from pathlib import Path
from io import BytesIO
import base64
import json
import re
from PIL import Image

JS = Path("custom_components/s8_omni/frontend/s8-omni-panel.js")
CONST = Path("custom_components/s8_omni/const.py")
MANIFEST = Path("custom_components/s8_omni/manifest.json")
PANEL = Path("panel.json")
CHANGELOG = Path("CHANGELOG.md")

text = JS.read_text(encoding="utf-8")
text = text.replace('const UI_VERSION = "v0.7.3";', 'const UI_VERSION = "v0.7.4";', 1)
match = re.search(r'const PRODUCT_ART_BASE64 = "([^"]+)";', text)
if not match:
    raise SystemExit("embedded product art not found")
webp = base64.b64decode(match.group(1))
img = Image.open(BytesIO(webp)).convert("RGB")
if img.width > 720:
    h = round(img.height * 720 / img.width)
    img = img.resize((720, h), Image.Resampling.LANCZOS)
img = img.quantize(colors=256, method=Image.Quantize.MEDIANCUT)
buf = BytesIO()
img.save(buf, format="PNG", optimize=True)
png_b64 = base64.b64encode(buf.getvalue()).decode("ascii")
text = text[:match.start(1)] + png_b64 + text[match.end(1):]
text = text.replace('new Blob([bytes], { type: "image/webp" })', 'new Blob([bytes], { type: "image/png" })', 1)
text = text.replace('.omni-art{position:absolute;left:5px;top:7px;bottom:7px;width:77%;display:grid;place-items:center;z-index:2}', '.omni-art{position:absolute;left:4px;top:7px;bottom:7px;width:71%;display:grid;place-items:center;z-index:2}', 1)
text = text.replace('.omni-legend{position:absolute;right:8px;top:10px;bottom:10px;width:24%;z-index:5;display:flex;flex-direction:column;justify-content:center;gap:7px;padding:9px;', '.omni-legend{position:absolute;right:8px;top:10px;bottom:10px;width:29%;z-index:5;display:flex;flex-direction:column;justify-content:center;gap:6px;padding:8px 7px;', 1)
text = text.replace('.legend-row{display:grid;grid-template-columns:23px minmax(0,1fr);gap:7px;align-items:center;min-height:32px;padding:5px 5px;color:#4b5359;font-size:11px;', '.legend-row{display:grid;grid-template-columns:21px minmax(0,1fr);gap:6px;align-items:center;min-height:31px;padding:5px 4px;color:#4b5359;font-size:10.5px;', 1)
text = text.replace('.legend-row ha-icon{--mdc-icon-size:20px;color:#667078}', '.legend-row ha-icon{--mdc-icon-size:19px;color:#667078}', 1)
text = text.replace('const scale = Math.min(width / bitmap.width, height / bitmap.height);', 'const scale = Math.min((width * 1.04) / bitmap.width, (height * 1.04) / bitmap.height);', 1)
JS.write_text(text, encoding="utf-8")

const = CONST.read_text(encoding="utf-8")
const = const.replace('VERSION = "v1.00_b036"', 'VERSION = "v1.00_b037"')
const = const.replace('DASHBOARD_VERSION = "v0.7.3"', 'DASHBOARD_VERSION = "v0.7.4"')
CONST.write_text(const, encoding="utf-8")
manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
manifest["version"] = "1.0.0b37"
MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
panel = json.loads(PANEL.read_text(encoding="utf-8"))
panel["panel"]["dashboard_version"] = "v0.7.4"
panel["panel"]["frontend"]["product_art_delivery"] = "embedded_png_bytes_to_canvas_via_createImageBitmap"
PANEL.write_text(json.dumps(panel, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
ENTRY = '## v1.00_b037 / UI v0.7.4\n\n- Converted the embedded approved product artwork from WebP to palette PNG for reliable Canvas decoding in Home Assistant iOS WebView.\n- Rebalanced the hero art/legend split so all process labels remain readable on iPhone portrait.\n- Preserved Canvas rendering, verified-only process overlays, controls, and the SVG emergency fallback.\n\n'
ch = CHANGELOG.read_text(encoding="utf-8")
if ENTRY not in ch:
    CHANGELOG.write_text(ENTRY + ch, encoding="utf-8")
