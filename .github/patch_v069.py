from pathlib import Path
import json
import re

panel = Path('custom_components/s8_omni/frontend/s8-omni-panel.js')
text = panel.read_text(encoding='utf-8')
text = text.replace('const UI_VERSION = "v0.6.8";', 'const UI_VERSION = "v0.6.9";')

replacements = {
    r'\.omni-legend\{[^}]*\}': '.omni-legend{position:absolute;right:8px;top:10px;bottom:10px;width:25%;z-index:5;display:flex;flex-direction:column;justify-content:center;gap:7px;padding:9px;border-radius:19px;background:rgba(255,255,255,.97);border:1px solid rgba(101,112,118,.12);box-shadow:0 10px 26px rgba(0,0,0,.09);backdrop-filter:blur(14px) saturate(115%)}',
    r'\.legend-row\{[^}]*\}': '.legend-row{display:grid;grid-template-columns:24px minmax(0,1fr);gap:7px;align-items:center;min-height:32px;padding:5px 5px;color:#4b5359;font-size:11px;font-weight:800;line-height:1.12;border-radius:11px;background:rgba(247,249,250,.94);border:1px solid rgba(91,101,107,.07)}',
    r'\.legend-row ha-icon\{[^}]*\}': '.legend-row ha-icon{--mdc-icon-size:20px;color:#667078}',
    r'\.legend-row\.active\{[^}]*\}': '.legend-row.active{color:#20272c;background:#ffffff;border-color:rgba(72,82,88,.10);box-shadow:0 2px 7px rgba(0,0,0,.045)}',
    r'\.legend-row\.water\.active\{[^}]*\}': '.legend-row.water.active{background:#edf8ff;color:#166d96;border-color:#c8e9f7}',
    r'\.legend-row\.water\.active ha-icon\{[^}]*\}': '.legend-row.water.active ha-icon{color:#16a9e5}',
    r'\.legend-row\.dust\.active\{[^}]*\}': '.legend-row.dust.active{background:#f1f3f4;color:#454d53;border-color:#d8dde0}',
    r'\.legend-row\.dust\.active ha-icon\{[^}]*\}': '.legend-row.dust.active ha-icon{color:#626c74}',
    r'\.legend-row\.dry\.active\{[^}]*\}': '.legend-row.dry.active{background:#fff3e9;color:#a85d22;border-color:#f5d7bd}',
    r'\.legend-row\.dry\.active ha-icon\{[^}]*\}': '.legend-row.dry.active ha-icon{color:#ee914c}',
    r'\.legend-row\.charge\.active\{[^}]*\}': '.legend-row.charge.active{background:#edf9f0;color:#2e914b;border-color:#bfe3c8}',
    r'\.legend-row\.charge\.active ha-icon\{[^}]*\}': '.legend-row.charge.active ha-icon{color:#32aa56}',
}
for pattern, replacement in replacements.items():
    text, count = re.subn(pattern, replacement, text, count=1)
    if count != 1:
        raise SystemExit(f'Expected exactly one CSS match for {pattern!r}, got {count}')

panel.write_text(text, encoding='utf-8')

const = Path('custom_components/s8_omni/const.py')
c = const.read_text(encoding='utf-8')
c = c.replace('VERSION = "v1.00_b031"', 'VERSION = "v1.00_b032"')
c = c.replace('DASHBOARD_VERSION = "v0.6.8"', 'DASHBOARD_VERSION = "v0.6.9"')
const.write_text(c, encoding='utf-8')

manifest = Path('custom_components/s8_omni/manifest.json')
data = json.loads(manifest.read_text(encoding='utf-8'))
data['version'] = '1.0.0b32'
manifest.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

panel_json = Path('panel.json')
data = json.loads(panel_json.read_text(encoding='utf-8'))
data['panel']['dashboard_version'] = 'v0.6.9'
panel_json.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

changelog = Path('CHANGELOG.md')
cl = changelog.read_text(encoding='utf-8')
entry = '## v1.00_b032 / UI v0.6.9\n\n- Increased contrast and opacity of the Overview OMNI process legend for reliable readability on the bright hero illustration.\n- Preserved verified-only process highlighting and the existing robot/station composition.\n\n'
if entry not in cl:
    lines = cl.splitlines(keepends=True)
    if lines and lines[0].startswith('#'):
        cl = lines[0] + '\n' + entry + ''.join(lines[1:]).lstrip('\n')
    else:
        cl = entry + cl
    changelog.write_text(cl, encoding='utf-8')
