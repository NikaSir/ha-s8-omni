from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
js_path = ROOT / "custom_components/s8_omni/frontend/s8-omni-panel.js"
text = js_path.read_text(encoding="utf-8")

if 'const UI_VERSION = "v0.6.8";' not in text:
    text = text.replace('const UI_VERSION = "v0.6.7";', 'const UI_VERSION = "v0.6.8";')

    css_re = re.compile(r'\.omni-scene\{.*?\.legend-row\.charge\.active ha-icon\{color:#35ad5c\}', re.S)
    css_new = r'''.omni-scene{position:relative;z-index:1;height:210px;margin-top:12px;border-radius:22px;border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);background:linear-gradient(145deg,#fcfdfe 0%,#f4f8fa 52%,#edf8fc 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.98);overflow:hidden}.omni-scene::before{content:"";position:absolute;left:12px;right:104px;bottom:7px;height:54px;border-radius:50%;background:radial-gradient(ellipse at center,rgba(183,194,201,.48) 0%,rgba(183,194,201,.13) 56%,rgba(183,194,201,0) 78%)}.omni-scene::after{content:"";position:absolute;right:-12px;top:-16px;width:174px;height:174px;border-radius:50%;background:radial-gradient(circle,#dff4fd 0%,rgba(223,244,253,0) 69%)}.omni-art{position:absolute;left:-2px;top:0;width:78%;height:100%;padding:0}.omni-art svg{width:100%;height:100%;display:block}.omni-legend{position:absolute;right:8px;top:18px;bottom:18px;width:24%;display:flex;flex-direction:column;justify-content:center;gap:6px;padding:8px 7px;border-radius:19px;background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(255,255,255,.88));box-shadow:0 10px 25px rgba(0,0,0,.055);backdrop-filter:blur(12px)}.legend-row{display:grid;grid-template-columns:23px 1fr;gap:6px;align-items:center;min-height:31px;padding:4px 3px;color:#70757a;font-size:10.5px;font-weight:760;line-height:1.12;border-radius:11px}.legend-row ha-icon{--mdc-icon-size:20px}.legend-row.active{color:var(--primary-text-color);background:rgba(255,255,255,.82);box-shadow:inset 0 0 0 1px rgba(0,0,0,.035)}.legend-row.water.active{background:#edf8ff}.legend-row.water.active ha-icon{color:#12a9e8}.legend-row.dust.active{background:#f2f4f5}.legend-row.dust.active ha-icon{color:#626c74}.legend-row.dry.active{background:#fff3e9}.legend-row.dry.active ha-icon{color:#f08f43}.legend-row.charge.active{background:#eefaf1;color:#2d9950}.legend-row.charge.active ha-icon{color:#32ad58}'''
    text, count = css_re.subn(css_new, text, count=1)
    if count != 1:
        raise SystemExit(f"hero CSS replacement failed: {count}")

    hero_re = re.compile(r'  _hero\(\) \{.*?\n  \}\n\n  _quickActions\(\) \{', re.S)
    hero_new = r'''  _hero() {
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
    const battery = snap.battery === null ? "—" : `${Math.round(snap.battery)}%`;
    const age = snap.age === null ? "—" : this._formatDuration(snap.age);
    const chargeActive = charging || charged || docked;
    const blue = wash ? "#0aaeea" : "#75c9e8";
    const gray = dust ? "#5f6971" : "#9da7ae";
    const orange = dry ? "#f08a3b" : "#eda879";
    const green = chargeActive ? "#2faf57" : "#8fc19d";
    const blueOpacity = wash ? "1" : ".36";
    const grayOpacity = dust ? "1" : ".28";
    const orangeOpacity = dry ? "1" : ".32";

    return `<section class="card hero" data-more="composite_status">
      <div class="hero-top"><div><span class="eyebrow">Состояние</span><h1>${escapeHtml(compositeLabel)}</h1><p class="hero-hint">${escapeHtml(this._heroHint(snap))}</p></div><div class="connection-badge ${connection !== "Локально" ? "bad" : ""}"><i class="dot"></i>${escapeHtml(connection)}</div></div>
      <div class="omni-scene">
        <div class="omni-art">
          <svg viewBox="0 0 490 220" aria-label="OMNI station live visualization" role="img">
            <defs>
              <linearGradient id="stationFront" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#f7f9fa"/><stop offset="1" stop-color="#e5ebee"/></linearGradient>
              <linearGradient id="stationSide" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef3f5"/><stop offset="1" stop-color="#d8e0e4"/></linearGradient>
              <linearGradient id="dockFront" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3b3c"/><stop offset="1" stop-color="#181a1b"/></linearGradient>
              <linearGradient id="robotTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".68" stop-color="#f4f6f7"/><stop offset="1" stop-color="#e3e8eb"/></linearGradient>
              <linearGradient id="robotSide" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#303437"/><stop offset="1" stop-color="#151819"/></linearGradient>
              <linearGradient id="tankBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${wash ? '#d7f4ff' : '#edf9fd'}"/><stop offset=".62" stop-color="${wash ? '#89daf8' : '#d8f0f8'}"/><stop offset="1" stop-color="${wash ? '#53c5f1' : '#bce2f0'}"/></linearGradient>
              <linearGradient id="tankGray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${dust ? '#dde2e5' : '#f0f2f4'}"/><stop offset=".65" stop-color="${dust ? '#aeb6bc' : '#dde2e5'}"/><stop offset="1" stop-color="${dust ? '#7e8991' : '#c9d0d4'}"/></linearGradient>
              <linearGradient id="tankWarm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${dry ? '#ffe5ce' : '#fff4eb'}"/><stop offset=".65" stop-color="${dry ? '#ffbd83' : '#f8dec8'}"/><stop offset="1" stop-color="${dry ? '#ff9950' : '#efc7a8'}"/></linearGradient>
              <filter id="stationShadow" x="-20%" y="-20%" width="160%" height="190%"><feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="#000" flood-opacity=".13"/></filter>
              <filter id="robotShadow" x="-25%" y="-25%" width="170%" height="190%"><feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#000" flood-opacity=".13"/></filter>
              <filter id="glowBlue" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <filter id="glowGray" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <filter id="glowWarm" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>

            <ellipse cx="285" cy="195" rx="181" ry="18" fill="#cfd9de" opacity=".52"/>
            <ellipse cx="93" cy="193" rx="76" ry="13" fill="#d4dde1" opacity=".58"/>

            <g filter="url(#stationShadow)">
              <path d="M123 27 Q123 14 139 14 H400 Q418 14 426 29 L440 49 V157 Q440 173 424 178 H143 Q123 177 123 158 Z" fill="url(#stationFront)" stroke="#c7d1d6" stroke-width="1.8"/>
              <path d="M410 21 Q421 25 426 34 L440 49 V157 Q440 171 426 176 L411 167 Z" fill="url(#stationSide)" opacity=".95"/>
              <path d="M137 117 H425 V160 Q425 177 408 177 H154 Q137 177 137 160 Z" fill="url(#dockFront)"/>
              <rect x="172" y="130" width="216" height="31" rx="15.5" fill="#0b0e0f"/>
              <path d="M151 170 H405" stroke="#c9d2d7" stroke-width="7" stroke-linecap="round" opacity=".72"/>

              <rect x="147" y="34" width="74" height="87" rx="15" fill="url(#tankBlue)" stroke="#c5d5dc"/>
              <rect x="231" y="34" width="74" height="87" rx="15" fill="url(#tankGray)" stroke="#cbd3d7"/>
              <rect x="315" y="34" width="74" height="87" rx="15" fill="url(#tankWarm)" stroke="#d6cec8"/>
              <path d="M158 42 Q169 34 187 34 H209 V111 H158 Z" fill="rgba(255,255,255,.30)"/>
              <path d="M242 42 Q253 34 271 34 H293 V111 H242 Z" fill="rgba(255,255,255,.25)"/>
              <path d="M326 42 Q337 34 355 34 H377 V111 H326 Z" fill="rgba(255,255,255,.25)"/>
              <path d="M153 94 Q184 84 215 94 V116 H153 Z" fill="${blue}" opacity="${wash ? '.42' : '.19'}"/>
              <path d="M237 94 Q268 86 299 94 V116 H237 Z" fill="${gray}" opacity="${dust ? '.36' : '.16'}"/>
              <path d="M321 94 Q352 84 383 94 V116 H321 Z" fill="${orange}" opacity="${dry ? '.40' : '.18'}"/>
            </g>

            <g opacity=".44" stroke="#cdd6da" stroke-width="2"><line x1="184" y1="119" x2="184" y2="177"/><line x1="268" y1="119" x2="268" y2="177"/><line x1="352" y1="119" x2="352" y2="177"/></g>
            <g fill="none" stroke-linecap="round">
              <path d="M184 118 L184 156 L129 156 L111 148" stroke="${blue}" opacity="${blueOpacity}" stroke-width="5.2" ${wash ? 'filter="url(#glowBlue)"' : ''}/>
              <path d="M268 118 L268 162 L136 162 L114 154" stroke="${gray}" opacity="${grayOpacity}" stroke-width="4.2" ${dust ? 'filter="url(#glowGray)"' : ''}/>
              <path d="M352 118 L352 168 L143 168 L118 160" stroke="${orange}" opacity="${orangeOpacity}" stroke-width="5.2" ${dry ? 'filter="url(#glowWarm)"' : ''}/>
              <path d="M140 144 L119 144" stroke="${green}" stroke-width="5.8"/>
            </g>

            <g filter="url(#robotShadow)">
              <ellipse cx="83" cy="167" rx="76" ry="39" fill="#e7ecef" stroke="#cbd4d9" stroke-width="2"/>
              <path d="M8 154 Q10 124 37 116 Q81 103 123 116 Q148 123 156 151 V164 Q148 185 83 187 Q18 184 8 164 Z" fill="url(#robotTop)" stroke="#c8d2d7" stroke-width="2"/>
              <path d="M13 156 Q83 166 151 156 V170 Q134 184 83 186 Q31 184 13 170 Z" fill="url(#robotSide)"/>
              <rect x="23" y="159" width="41" height="8" rx="4" fill="#0b0f11"/>
              <rect x="70" y="159" width="27" height="8" rx="4" fill="#394044"/>
              <rect x="104" y="159" width="22" height="8" rx="4" fill="#111416"/>
              <circle cx="83" cy="124" r="15" fill="#eef2f4" stroke="#c8d2d7"/>
              <circle cx="83" cy="123" r="7" fill="#c6cfd4"/>
              <ellipse cx="83" cy="117" rx="6" ry="2.5" fill="#ffffff" opacity=".78"/>
              <path d="M23 140 Q82 119 143 140" fill="none" stroke="#ffffff" stroke-width="2.5" opacity=".82"/>
              <circle cx="137" cy="159" r="3" fill="#1ba9dc" opacity=".82"/>
            </g>

            <circle cx="132" cy="144" r="18" fill="#ffffff" stroke="${green}" stroke-width="3"/>
            <path d="M128 132 L138 132 L134 142 L141 142 L128 157 L132 146 L124 146 Z" fill="${green}"/>

            <g opacity=".86">
              <path d="M178 58 C171 68 169 73 169 80 A15 15 0 0 0 199 80 C199 73 195 66 188 57 C185 53 181 53 178 58 Z" fill="none" stroke="${blue}" stroke-width="3.4"/>
              <path d="M254 62 h29 l-3 31 h-23 z" fill="none" stroke="${gray}" stroke-width="3.2"/><path d="M258 57 h21" stroke="${gray}" stroke-width="3.2" stroke-linecap="round"/>
              <path d="M336 61 c-7 8 7 8 0 16 c-7 8 7 8 0 16 M350 61 c-7 8 7 8 0 16 c-7 8 7 8 0 16 M364 61 c-7 8 7 8 0 16 c-7 8 7 8 0 16" fill="none" stroke="${orange}" stroke-width="3.2" stroke-linecap="round"/>
            </g>
          </svg>
        </div>
        <div class="omni-legend">
          <div class="legend-row water ${wash ? 'active' : ''}"><ha-icon icon="mdi:water-outline"></ha-icon><span>Промывка</span></div>
          <div class="legend-row dust ${dust ? 'active' : ''}"><ha-icon icon="mdi:delete-outline"></ha-icon><span>Пыль/мешок</span></div>
          <div class="legend-row dry ${dry ? 'active' : ''}"><ha-icon icon="mdi:weather-windy"></ha-icon><span>Тёплый воздух</span></div>
          <div class="legend-row charge ${chargeActive ? 'active' : ''}"><ha-icon icon="${charging ? 'mdi:battery-charging' : 'mdi:flash'}"></ha-icon><span>${charging ? 'Зарядка' : docked ? 'На базе' : 'Заряд'}</span></div>
        </div>
      </div>
      <div class="hero-metrics"><div data-more="battery"><span>АКБ</span><strong>${battery}</strong><div class="battery-bar"><i style="width:${snap.battery ?? 0}%"></i></div></div><div data-more="mode"><span>Режим</span><strong>${escapeHtml(this._modeLabel(snap))}</strong></div><div data-more="telemetry_age"><span>Телеметрия</span><strong>${escapeHtml(age)}</strong></div></div>
    </section>`;
  }

  _quickActions() {'''
    text, count = hero_re.subn(hero_new, text, count=1)
    if count != 1:
        raise SystemExit(f"hero replacement failed: {count}")

js_path.write_text(text, encoding="utf-8")

const_path = ROOT / "custom_components/s8_omni/const.py"
const_text = const_path.read_text(encoding="utf-8")
const_text = const_text.replace('VERSION = "v1.00_b030"', 'VERSION = "v1.00_b031"').replace('DASHBOARD_VERSION = "v0.6.7"', 'DASHBOARD_VERSION = "v0.6.8"')
const_path.write_text(const_text, encoding="utf-8")

manifest_path = ROOT / "custom_components/s8_omni/manifest.json"
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
manifest["version"] = "1.0.0b31"
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

panel_path = ROOT / "panel.json"
panel = json.loads(panel_path.read_text(encoding="utf-8"))
panel["panel"]["dashboard_version"] = "v0.6.8"
panel["panel"]["mobile_fit"]["overview_scene"] = "large_product_scale_live_omni_illustration"
panel_path.write_text(json.dumps(panel, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

changelog_path = ROOT / "CHANGELOG.md"
changelog = changelog_path.read_text(encoding="utf-8")
entry = "## v1.00_b031 / UI v0.6.8\n\n- Rebalanced Overview hero to match the approved render composition: larger robot and station, less empty space, narrower legend, deeper product materials and larger glass-like tanks.\n- Verified HA state remains the only source for process highlighting; no synthetic tank levels or unverified station writes were added.\n\n"
if "## v1.00_b031 / UI v0.6.8" not in changelog:
    changelog = entry + changelog
    changelog_path.write_text(changelog, encoding="utf-8")
