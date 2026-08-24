from pathlib import Path
import json
import re

panel = Path('custom_components/s8_omni/frontend/s8-omni-panel.js')
text = panel.read_text(encoding='utf-8')
text = text.replace('const UI_VERSION = "v0.7.0";', 'const UI_VERSION = "v0.7.1";', 1)
text, count = re.subn(
    r'^const PRODUCT_ART = "data:image/webp;base64,[^"]*";$',
    'const PRODUCT_ART = "/s8_omni/frontend/omni-product-v071.webp?v=v0.7.1";',
    text,
    count=1,
    flags=re.MULTILINE,
)
if count != 1:
    raise SystemExit(f'Expected one embedded PRODUCT_ART line, got {count}')
panel.write_text(text, encoding='utf-8')

const = Path('custom_components/s8_omni/const.py')
c = const.read_text(encoding='utf-8')
c = c.replace('VERSION = "v1.00_b033"', 'VERSION = "v1.00_b034"', 1)
c = c.replace('DASHBOARD_VERSION = "v0.7.0"', 'DASHBOARD_VERSION = "v0.7.1"', 1)
const.write_text(c, encoding='utf-8')

manifest = Path('custom_components/s8_omni/manifest.json')
data = json.loads(manifest.read_text(encoding='utf-8'))
data['version'] = '1.0.0b34'
manifest.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

panel_json = Path('panel.json')
data = json.loads(panel_json.read_text(encoding='utf-8'))
data['panel']['dashboard_version'] = 'v0.7.1'
panel_json.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

changelog = Path('CHANGELOG.md')
cl = changelog.read_text(encoding='utf-8')
entry = '''## v1.00_b034 / UI v0.7.1

- Fixed Overview product-art delivery on iOS/Home Assistant WebView by replacing the embedded data URI with a bundled static WebP asset served by Home Assistant.
- Kept the approved product-art composition and all verified live process overlays unchanged.
- Added cache busting to the product-art asset URL.

'''
if entry not in cl:
    lines = cl.splitlines(keepends=True)
    if lines and lines[0].startswith('#'):
        cl = lines[0] + '\n' + entry + ''.join(lines[1:]).lstrip('\n')
    else:
        cl = entry + cl
    changelog.write_text(cl, encoding='utf-8')
