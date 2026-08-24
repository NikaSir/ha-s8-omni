from pathlib import Path
import json
import re

ART = "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"

panel = Path('custom_components/s8_omni/frontend/s8-omni-panel.js')
text = panel.read_text(encoding='utf-8')
old_header = 'const UI_VERSION = "v0.6.9";'
if old_header not in text:
    raise SystemExit('Expected UI v0.6.9 header')
text = text.replace(old_header, 'const UI_VERSION = "v0.7.0";\nconst PRODUCT_ART = "data:image/webp;base64,' + ART + '";', 1)

css_pattern = r'\.omni-scene\{.*?\.legend-row\.charge\.active ha-icon\{[^}]*\}'
css_replacement = '''.omni-scene{position:relative;z-index:1;height:210px;margin-top:12px;border-radius:22px;border:1px solid color-mix(in srgb,var(--divider-color) 64%,transparent);background:linear-gradient(145deg,#ffffff 0%,#f7fbfd 56%,#edf8fc 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.98),0 8px 24px rgba(18,56,72,.035);overflow:hidden}.omni-scene::before{content:"";position:absolute;left:12px;right:102px;bottom:8px;height:42px;border-radius:50%;background:radial-gradient(ellipse at center,rgba(161,177,186,.26) 0%,rgba(161,177,186,.06) 58%,rgba(161,177,186,0) 78%)}.omni-scene::after{content:"";position:absolute;right:-16px;top:-24px;width:184px;height:184px;border-radius:50%;background:radial-gradient(circle,rgba(211,243,255,.78) 0%,rgba(223,244,253,0) 68%)}.omni-art{position:absolute;left:5px;top:7px;bottom:7px;width:77%;display:grid;place-items:center;z-index:2}.product-art{width:100%;max-height:100%;object-fit:contain;border-radius:20px;filter:drop-shadow(0 10px 13px rgba(43,62,70,.13));transition:opacity .2s ease,filter .2s ease}.omni-art.muted .product-art{opacity:.52;filter:grayscale(.3) drop-shadow(0 8px 11px rgba(43,62,70,.08))}.tank-glow,.charge-glow{position:absolute;pointer-events:none;opacity:0;transition:opacity .22s ease}.tank-glow.on,.charge-glow.on{opacity:1}.tank-glow{top:13%;height:57%;width:17%;border-radius:18px}.tank-glow.wash{left:38.5%;box-shadow:inset 0 0 0 2px rgba(30,170,229,.35),0 0 26px 7px rgba(30,170,229,.23)}.tank-glow.dust{left:54.5%;box-shadow:inset 0 0 0 2px rgba(92,103,111,.28),0 0 22px 6px rgba(92,103,111,.16)}.tank-glow.dry{left:70.5%;box-shadow:inset 0 0 0 2px rgba(242,144,70,.38),0 0 28px 8px rgba(242,144,70,.28)}.charge-glow{left:1%;top:35%;width:39%;height:42%;border-radius:50%;box-shadow:inset 0 0 0 2px rgba(54,177,91,.25),0 0 27px 7px rgba(54,177,91,.20)}.omni-legend{position:absolute;right:8px;top:10px;bottom:10px;width:24%;z-index:5;display:flex;flex-direction:column;justify-content:center;gap:7px;padding:9px;border-radius:19px;background:rgba(255,255,255,.98);border:1px solid rgba(101,112,118,.11);box-shadow:0 10px 26px rgba(0,0,0,.075);backdrop-filter:blur(14px) saturate(115%)}.legend-row{display:grid;grid-template-columns:23px minmax(0,1fr);gap:7px;align-items:center;min-height:32px;padding:5px 5px;color:#4b5359;font-size:11px;font-weight:800;line-height:1.12;border-radius:11px;background:rgba(248,250,251,.96);border:1px solid rgba(91,101,107,.065)}.legend-row ha-icon{--mdc-icon-size:20px;color:#667078}.legend-row.active{color:#20272c;background:#ffffff;border-color:rgba(72,82,88,.10);box-shadow:0 2px 7px rgba(0,0,0,.045)}.legend-row.water.active{background:#edf8ff;color:#166d96;border-color:#c8e9f7}.legend-row.water.active ha-icon{color:#16a9e5}.legend-row.dust.active{background:#f1f3f4;color:#454d53;border-color:#d8dde0}.legend-row.dust.active ha-icon{color:#626c74}.legend-row.dry.active{background:#fff3e9;color:#a85d22;border-color:#f5d7bd}.legend-row.dry.active ha-icon{color:#ee914c}.legend-row.charge.active{background:#edf9f0;color:#2e914b;border-color:#bfe3c8}.legend-row.charge.active ha-icon{color:#32aa56}'''
text, count = re.subn(css_pattern, css_replacement, text, count=1, flags=re.S)
if count != 1:
    raise SystemExit(f'Expected one OMNI CSS block, got {count}')

for pattern, replacement in {
    r'\.hero-metrics>div\{[^}]*\}': '.hero-metrics>div{min-height:68px;border-radius:18px;padding:10px;background:rgba(255,255,255,.90);border:1px solid rgba(92,108,116,.10);box-shadow:0 4px 12px rgba(20,52,66,.045);overflow:hidden}',
    r'\.action\{[^}]*\}': '.action{min-height:90px;border:1px solid color-mix(in srgb,var(--divider-color) 68%,transparent);border-radius:21px;padding:8px 5px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;background:linear-gradient(180deg,var(--card-background-color),color-mix(in srgb,var(--primary-color) 2%,var(--card-background-color)));color:var(--primary-text-color);box-shadow:0 5px 15px rgba(20,52,66,.045);text-align:center}',
    r'\.action\.primary\{[^}]*\}': '.action.primary{background:linear-gradient(145deg,color-mix(in srgb,var(--primary-color) 92%,white),var(--primary-color));color:var(--text-primary-color,white);border-color:transparent;box-shadow:0 9px 20px color-mix(in srgb,var(--primary-color) 22%,transparent)}',
    r'\.status-card\{[^}]*\}': '.status-card{min-height:96px;border:1px solid rgba(91,108,118,.09);border-radius:18px;padding:9px 7px;background:linear-gradient(180deg,var(--card-background-color),color-mix(in srgb,var(--primary-color) 2%,var(--card-background-color)));box-shadow:0 4px 12px rgba(20,52,66,.04);color:var(--primary-text-color);text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden}',
    r'\.status-icon\{[^}]*\}': '.status-icon{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:color-mix(in srgb,var(--primary-color) 6%,var(--card-background-color));color:var(--primary-color);margin-bottom:7px;box-shadow:inset 0 0 0 1px rgba(92,108,116,.06)}',
}.items():
    text, n = re.subn(pattern, replacement, text, count=1)
    if n != 1:
        raise SystemExit(f'Expected one CSS match for {pattern!r}, got {n}')

hero_pattern = r'  _hero\(\) \{.*?\n  \}\n\n  _quickActions\(\) \{'
hero_replacement = '''  _hero() {
    const snap = this._snapshot();
    const compositeLabel = snap.connection === "disconnected" ? "Нет связи" : snap.connection === "unknown" ? "Связь не подтверждена" : this._label(COMPOSITE_LABELS, snap.composite, "Нет данных");
    const connection = this._connectionLabel();
    const ops = new Set(snap.stationOperations || []);
    const wash = !snap.unreliable && (ops.has("roller_cleaning") || snap.station === "roller_cleaning");
    const dust = !snap.unreliable && (ops.has("dust_collection") || snap.station === "dust_collection");
    const dry = !snap.unreliable && (ops.has("drying") || snap.station === "drying");
    const charging = !snap.unreliable && snap.robot === "charging";
    const charged = !snap.unreliable && snap.robot === "charged";
    const docked = !snap.unreliable && snap.onDock === true;
    const chargeActive = charging || charged || docked;
    const battery = snap.battery === null ? "—" : `${Math.round(snap.battery)}%`;
    const age = snap.age === null ? "—" : this._formatDuration(snap.age);

    return `<section class="card hero" data-more="composite_status">
      <div class="hero-top"><div><span class="eyebrow">Состояние</span><h1>${escapeHtml(compositeLabel)}</h1><p class="hero-hint">${escapeHtml(this._heroHint(snap))}</p></div><div class="connection-badge ${connection !== "Локально" ? "bad" : ""}"><i class="dot"></i>${escapeHtml(connection)}</div></div>
      <div class="omni-scene">
        <div class="omni-art ${snap.unreliable ? "muted" : ""}">
          <img class="product-art" src="${PRODUCT_ART}" alt="S8 OMNI robot and station" />
          <i class="tank-glow wash ${wash ? "on" : ""}"></i>
          <i class="tank-glow dust ${dust ? "on" : ""}"></i>
          <i class="tank-glow dry ${dry ? "on" : ""}"></i>
          <i class="charge-glow ${chargeActive ? "on" : ""}"></i>
        </div>
        <div class="omni-legend">
          <div class="legend-row water ${wash ? "active" : ""}"><ha-icon icon="mdi:water-outline"></ha-icon><span>Промывка</span></div>
          <div class="legend-row dust ${dust ? "active" : ""}"><ha-icon icon="mdi:delete-outline"></ha-icon><span>Пыль/мешок</span></div>
          <div class="legend-row dry ${dry ? "active" : ""}"><ha-icon icon="mdi:weather-windy"></ha-icon><span>Тёплый воздух</span></div>
          <div class="legend-row charge ${chargeActive ? "active" : ""}"><ha-icon icon="${charging ? "mdi:battery-charging" : "mdi:flash"}"></ha-icon><span>${charging ? "Зарядка" : docked ? "На базе" : "Заряд"}</span></div>
        </div>
      </div>
      <div class="hero-metrics"><div data-more="battery"><span>АКБ</span><strong>${battery}</strong><div class="battery-bar"><i style="width:${snap.battery ?? 0}%"></i></div></div><div data-more="mode"><span>Режим</span><strong>${escapeHtml(this._modeLabel(snap))}</strong></div><div data-more="telemetry_age"><span>Телеметрия</span><strong>${escapeHtml(age)}</strong></div></div>
    </section>`;
  }

  _quickActions() {'''
text, count = re.subn(hero_pattern, hero_replacement, text, count=1, flags=re.S)
if count != 1:
    raise SystemExit(f'Expected one _hero block, got {count}')
panel.write_text(text, encoding='utf-8')

const = Path('custom_components/s8_omni/const.py')
c = const.read_text(encoding='utf-8')
c = c.replace('VERSION = "v1.00_b032"', 'VERSION = "v1.00_b033"')
c = c.replace('DASHBOARD_VERSION = "v0.6.9"', 'DASHBOARD_VERSION = "v0.7.0"')
const.write_text(c, encoding='utf-8')

manifest = Path('custom_components/s8_omni/manifest.json')
data = json.loads(manifest.read_text(encoding='utf-8'))
data['version'] = '1.0.0b33'
manifest.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

panel_json = Path('panel.json')
data = json.loads(panel_json.read_text(encoding='utf-8'))
data['panel']['dashboard_version'] = 'v0.7.0'
panel_json.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

changelog = Path('CHANGELOG.md')
cl = changelog.read_text(encoding='utf-8')
entry = '## v1.00_b033 / UI v0.7.0\n\n- Replaced the hand-drawn Overview robot/station SVG with the approved product-art composition from the target render.\n- Kept verified Home Assistant state dynamic by overlaying live wash, dust, drying and dock/charge highlights on the product illustration.\n- Refined hero metrics, quick actions and status cards with lighter product-style surfaces and softer depth.\n- No synthetic tank percentages and no unverified station commands were added.\n\n'
if entry not in cl:
    lines = cl.splitlines(keepends=True)
    if lines and lines[0].startswith('#'):
        cl = lines[0] + '\n' + entry + ''.join(lines[1:]).lstrip('\n')
    else:
        cl = entry + cl
    changelog.write_text(cl, encoding='utf-8')
