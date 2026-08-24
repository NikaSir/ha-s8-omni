from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components" / "s8_omni" / "frontend" / "s8-omni-panel.js"
CONST = ROOT / "custom_components" / "s8_omni" / "const.py"
MANIFEST = ROOT / "custom_components" / "s8_omni" / "manifest.json"
PANEL_JSON = ROOT / "panel.json"
CHANGELOG = ROOT / "CHANGELOG.md"

text = PANEL.read_text(encoding="utf-8")
text = text.replace('const UI_VERSION = "v0.6.5";', 'const UI_VERSION = "v0.6.6";')

scene_css = r'''.omni-scene{position:relative;z-index:1;height:194px;margin-top:12px;border-radius:22px;border:1px solid color-mix(in srgb,var(--divider-color) 72%,transparent);background:linear-gradient(145deg,#fbfcfd 0%,#f3f7f9 56%,#edf8fc 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.97);overflow:hidden}.omni-scene::before{content:"";position:absolute;left:16px;right:132px;bottom:11px;height:38px;border-radius:50%;background:radial-gradient(ellipse at center,rgba(188,198,204,.58) 0%,rgba(188,198,204,.16) 58%,rgba(188,198,204,0) 78%)}.omni-scene::after{content:"";position:absolute;right:-18px;top:-8px;width:164px;height:164px;border-radius:50%;background:radial-gradient(circle,#dff4fd 0%,rgba(223,244,253,0) 69%)}.omni-art{position:absolute;left:0;top:0;width:69%;height:100%;padding:6px 0 0 5px}.omni-art svg{width:100%;height:100%;display:block}.omni-legend{position:absolute;right:10px;top:12px;bottom:12px;width:29%;display:flex;flex-direction:column;justify-content:center;gap:7px;padding:10px;border-radius:20px;background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(255,255,255,.87));box-shadow:0 10px 24px rgba(0,0,0,.06);backdrop-filter:blur(12px)}.legend-row{display:grid;grid-template-columns:25px 1fr;gap:8px;align-items:center;min-height:32px;padding:5px 4px;color:#6f7378;font-size:11px;font-weight:760;line-height:1.14;border-radius:12px}.legend-row ha-icon{--mdc-icon-size:21px}.legend-row.active{color:var(--primary-text-color);background:rgba(255,255,255,.78);box-shadow:inset 0 0 0 1px rgba(0,0,0,.035)}.legend-row.water.active{background:#edf8ff}.legend-row.water.active ha-icon{color:#1baae8}.legend-row.dust.active{background:#f2f4f5}.legend-row.dust.active ha-icon{color:#68727c}.legend-row.dry.active{background:#fff4eb}.legend-row.dry.active ha-icon{color:#f49b54}.legend-row.charge.active{background:#effbf2;color:#2f9a52}.legend-row.charge.active ha-icon{color:#35ad5c}'''

text, css_count = re.subn(
    r"\.omni-scene\{.*?\.legend-row\.charge\.active ha-icon\{color:#35ad5c\}",
    scene_css,
    text,
    count=1,
    flags=re.S,
)
if css_count != 1:
    raise SystemExit(f"Unable to replace OMNI scene CSS: {css_count}")

hero = r'''  _hero() {
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
    const blue = wash ? "#17afe9" : "#88cde8";
    const gray = dust ? "#6f7880" : "#a9b0b6";
    const orange = dry ? "#f39a4d" : "#efbb93";
    const green = chargeActive ? "#38b55d" : "#a7c9b1";
    const blueOpacity = wash ? "1" : ".42";
    const grayOpacity = dust ? "1" : ".34";
    const orangeOpacity = dry ? "1" : ".38";

    return `<section class="card hero" data-more="composite_status">
      <div class="hero-top"><div><span class="eyebrow">Состояние</span><h1>${escapeHtml(compositeLabel)}</h1><p class="hero-hint">${escapeHtml(this._heroHint(snap))}</p></div><div class="connection-badge ${connection !== "Локально" ? "bad" : ""}"><i class="dot"></i>${escapeHtml(connection)}</div></div>
      <div class="omni-scene">
        <div class="omni-art">
          <svg viewBox="0 0 430 198" aria-label="OMNI station live visualization" role="img">
            <defs>
              <linearGradient id="stationShell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".62" stop-color="#f6f8f9"/><stop offset="1" stop-color="#e8edf0"/></linearGradient>
              <linearGradient id="baseDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3c3d"/><stop offset="1" stop-color="#1c1d1e"/></linearGradient>
              <linearGradient id="robotShell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".75" stop-color="#f2f4f5"/><stop offset="1" stop-color="#e7ebed"/></linearGradient>
              <linearGradient id="tankBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${wash ? '#d8f4ff' : '#eff9fd'}"/><stop offset="1" stop-color="${wash ? '#70cff5' : '#cce9f5'}"/></linearGradient>
              <linearGradient id="tankGray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${dust ? '#d5dce1' : '#eef1f3'}"/><stop offset="1" stop-color="${dust ? '#929ca4' : '#cfd5d9'}"/></linearGradient>
              <linearGradient id="tankWarm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${dry ? '#ffe2c8' : '#fff3e9'}"/><stop offset="1" stop-color="${dry ? '#ffa75e' : '#f3d2b8'}"/></linearGradient>
              <filter id="shadow" x="-20%" y="-20%" width="160%" height="180%"><feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#000" flood-opacity=".12"/></filter>
              <filter id="softShadow" x="-20%" y="-20%" width="160%" height="180%"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#000" flood-opacity=".10"/></filter>
              <filter id="glowBlue" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <filter id="glowGray" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <filter id="glowWarm" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>

            <ellipse cx="91" cy="167" rx="68" ry="14" fill="#d8e0e4" opacity=".70"/>
            <ellipse cx="281" cy="168" rx="136" ry="16" fill="#d6dee3" opacity=".78"/>

            <g filter="url(#shadow)">
              <rect x="136" y="14" width="268" height="141" rx="27" fill="url(#stationShell)" stroke="#cdd5da" stroke-width="2"/>
              <rect x="153" y="28" width="67" height="86" rx="14" fill="url(#tankBlue)" stroke="#cfd8dc"/>
              <rect x="229" y="28" width="67" height="86" rx="14" fill="url(#tankGray)" stroke="#cfd8dc"/>
              <rect x="305" y="28" width="67" height="86" rx="14" fill="url(#tankWarm)" stroke="#cfd8dc"/>
              <rect x="149" y="109" width="238" height="46" rx="17" fill="url(#baseDark)"/>
              <rect x="180" y="119" width="179" height="25" rx="12.5" fill="#0d0f10"/>
              <rect x="169" y="39" width="34" height="56" rx="10" fill="rgba(255,255,255,.20)"/>
              <rect x="245" y="39" width="34" height="56" rx="10" fill="rgba(255,255,255,.17)"/>
              <rect x="321" y="39" width="34" height="56" rx="10" fill="rgba(255,255,255,.17)"/>
              <rect x="164" y="150" width="208" height="7" rx="3.5" fill="#ccd3d7" opacity=".75"/>
            </g>

            <g opacity=".62" stroke="#d3dade" stroke-width="2.2"><line x1="186" y1="113" x2="186" y2="154"/><line x1="262" y1="113" x2="262" y2="154"/><line x1="338" y1="113" x2="338" y2="154"/></g>
            <g fill="none" stroke-linecap="round">
              <path d="M186 112 L186 146 L126 146 L101 139" stroke="${blue}" opacity="${blueOpacity}" stroke-width="5" ${wash ? 'filter="url(#glowBlue)"' : ''}/>
              <path d="M262 112 L262 152 L132 152 L104 145" stroke="${gray}" opacity="${grayOpacity}" stroke-width="4" ${dust ? 'filter="url(#glowGray)"' : ''}/>
              <path d="M338 112 L338 158 L138 158 L108 150" stroke="${orange}" opacity="${orangeOpacity}" stroke-width="5" ${dry ? 'filter="url(#glowWarm)"' : ''}/>
              <path d="M152 136 L121 136" stroke="${green}" stroke-width="5.5"/>
            </g>

            <g transform="translate(13,91)" filter="url(#softShadow)">
              <ellipse cx="67" cy="39" rx="64" ry="31" fill="#f1f3f4" stroke="#cfd6da" stroke-width="2"/>
              <ellipse cx="67" cy="33" rx="58" ry="26" fill="url(#robotShell)" stroke="#d9dfe2"/>
              <rect x="14" y="40" width="106" height="10" rx="5" fill="#25282a"/>
              <rect x="20" y="42" width="30" height="4" rx="2" fill="#101315" opacity=".98"/>
              <circle cx="67" cy="18" r="13" fill="#eef2f4" stroke="#cfd6da"/>
              <circle cx="67" cy="18" r="6" fill="#c9d0d4"/>
              <circle cx="67" cy="31" r="2.2" fill="#d6dde1"/>
              <path d="M112 34 Q121 38 121 44" fill="none" stroke="#c7ced2" stroke-width="2"/>
            </g>

            <circle cx="141" cy="136" r="18" fill="#ffffff" stroke="${green}" stroke-width="3"/>
            <path d="M137 124 L147 124 L143 134 L150 134 L137 149 L141 138 L133 138 Z" fill="${green}"/>

            <g opacity=".82">
              <path d="M181 54 C175 63 173 68 173 73 A13 13 0 0 0 199 73 C199 67 195 61 189 53 C187 50 184 50 181 54 Z" fill="none" stroke="${blue}" stroke-width="3"/>
              <path d="M249 58 h27 l-3 29 h-21 z" fill="none" stroke="${gray}" stroke-width="3"/><path d="M253 54 h19" stroke="${gray}" stroke-width="3" stroke-linecap="round"/>
              <path d="M326 58 c-6 7 6 7 0 14 c-6 7 6 7 0 14 M338 58 c-6 7 6 7 0 14 c-6 7 6 7 0 14 M350 58 c-6 7 6 7 0 14 c-6 7 6 7 0 14" fill="none" stroke="${orange}" stroke-width="3" stroke-linecap="round"/>
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
'''

text, hero_count = re.subn(
    r"  _hero\(\) \{.*?\n  \}\n\n  _quickActions\(\) \{",
    hero + "\n  _quickActions() {",
    text,
    count=1,
    flags=re.S,
)
if hero_count != 1:
    raise SystemExit(f"Unable to replace hero: {hero_count}")

PANEL.write_text(text, encoding="utf-8")

const = CONST.read_text(encoding="utf-8")
const = const.replace('VERSION = "v1.00_b028"', 'VERSION = "v1.00_b029"')
const = const.replace('DASHBOARD_VERSION = "v0.6.5"', 'DASHBOARD_VERSION = "v0.6.6"')
CONST.write_text(const, encoding="utf-8")

manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
manifest["version"] = "1.0.0b29"
MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

panel = json.loads(PANEL_JSON.read_text(encoding="utf-8"))
panel["panel"]["dashboard_version"] = "v0.6.6"
mobile = panel["panel"].setdefault("mobile_fit", {})
mobile["overview_scene"] = "render_quality_live_omni_illustration"
mobile["overview_scene_visual_depth"] = "soft_3d_station_robot_shadows_and_tinted_modules"
mobile["overview_scene_verified_only"] = True
PANEL_JSON.write_text(json.dumps(panel, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

changelog = CHANGELOG.read_text(encoding="utf-8")
needle = "### Added\n\n"
entry = (
    "- `v1.00_b029` / dashboard `v0.6.6`: refine the Overview OMNI illustration toward the approved render with a larger robot, deeper station shell, three visibly tinted modules, stronger dock geometry and softer floor/shadow depth.\n"
    "- `v1.00_b029` / dashboard `v0.6.6`: keep blue/gray/orange/green process paths tied only to verified Home Assistant state while inactive modules retain a subtle presentation tint rather than looking blank.\n"
)
if entry not in changelog:
    changelog = changelog.replace(needle, needle + entry, 1)
CHANGELOG.write_text(changelog, encoding="utf-8")
