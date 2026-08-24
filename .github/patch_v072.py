from pathlib import Path
import base64
import json
import re

ROOT = Path(".")
JS = ROOT / "custom_components/s8_omni/frontend/s8-omni-panel.js"
ART = ROOT / "custom_components/s8_omni/frontend/omni-product-v071.webp"
CONST = ROOT / "custom_components/s8_omni/const.py"
MANIFEST = ROOT / "custom_components/s8_omni/manifest.json"
PANEL = ROOT / "panel.json"
CHANGELOG = ROOT / "CHANGELOG.md"

if not ART.exists():
    raise SystemExit("Verified product-art source asset is missing")
product_b64 = base64.b64encode(ART.read_bytes()).decode("ascii")

text = JS.read_text(encoding="utf-8")
text = re.sub(
    r'^const UI_VERSION = "v0\\.7\\.1";\\nconst PRODUCT_ART = .*?;\\n',
    'const UI_VERSION = "v0.7.2";\\n'
    + f'const PRODUCT_ART_BASE64 = "{product_b64}";\\n'
    + 'let _productArtUrl = null;\\n'
    + 'function productArtUrl() {\\n'
    + '  if (_productArtUrl) return _productArtUrl;\\n'
    + '  const binary = atob(PRODUCT_ART_BASE64);\\n'
    + '  const bytes = new Uint8Array(binary.length);\\n'
    + '  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);\\n'
    + '  _productArtUrl = URL.createObjectURL(new Blob([bytes], { type: "image/webp" }));\\n'
    + '  return _productArtUrl;\\n'
    + '}\\n',
    text,
    count=1,
    flags=re.M,
)
if 'src="${PRODUCT_ART}"' not in text:
    raise SystemExit("PRODUCT_ART image source not found")
text = text.replace('src="${PRODUCT_ART}"', 'src="${productArtUrl()}"', 1)
JS.write_text(text, encoding="utf-8")

const = CONST.read_text(encoding="utf-8")
const = const.replace('VERSION = "v1.00_b034"', 'VERSION = "v1.00_b035"')
const = const.replace('DASHBOARD_VERSION = "v0.7.1"', 'DASHBOARD_VERSION = "v0.7.2"')
CONST.write_text(const, encoding="utf-8")

manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
manifest["version"] = "1.0.0b35"
MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

panel = json.loads(PANEL.read_text(encoding="utf-8"))
panel["panel"]["dashboard_version"] = "v0.7.2"
PANEL.write_text(json.dumps(panel, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

entry = '''## v1.00_b035 / UI v0.7.2

- Replaced static/data-URI Overview product-art delivery with a Blob URL built from verified WebP bytes embedded in the standalone frontend bundle.
- Product artwork no longer depends on HACS copying a secondary frontend asset or on `data:` image handling in the Home Assistant iOS WebView.
- Preserved the approved product illustration, live verified overlays, process legend, controls, and verified-only state semantics.

'''
ch = CHANGELOG.read_text(encoding="utf-8")
if entry not in ch:
    CHANGELOG.write_text(entry + ch, encoding="utf-8")

# The asset bytes are now embedded into the production bundle; remove the secondary file
# so HACS installation cannot diverge from the JS bundle again.
ART.unlink()
