from __future__ import annotations

import json
from pathlib import Path

BRANCH = "feat/hero-visual-polish-v065b"
PANEL = Path("custom_components/s8_omni/frontend/s8-omni-panel.js")
CONST = Path("custom_components/s8_omni/const.py")
MANIFEST = Path("custom_components/s8_omni/manifest.json")
PANEL_JSON = Path("panel.json")

text = PANEL.read_text(encoding="utf-8")
if 'const UI_VERSION = "v0.6.5";' in text:
    print("v0.6.5 hero already applied")
    raise SystemExit(0)

text = text.replace('const UI_VERSION = "v0.6.4";', 'const UI_VERSION = "v0.6.5";', 1)

css_start = text.index("      .omni-scene{")
css_end = text.index("\n      .hero-metrics", css_start)
new_css = '''      .omni-scene{position:relative;z-index:1;height:188px;margin-top:12px;border-radius:22px;border:1px solid color-mix(in srgb,var(--divider-color) 74%,transparent);background:linear-gradient(135deg,#f8fafb 0%,#f1f5f7 58%,#eef9fd 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.92);overflow:hidden}.omni-scene::before{content:"";position:absolute;inset:auto 14px 12px 14px;height:44px;border-radius:18px;background:linear-gradient(180deg,rgba(230,236,239,.2),rgba(223,231,235,.75));filter:blur(.4px)}.omni-scene::after{content:"";position:absolute;right:-28px;bottom:-34px;width:146px;height:146px;border-radius:50%;background:radial-gradient(circle,#d9f1fb 0%,rgba(217,241,251,0) 68%)}.omni-art{position:absolute;left:0;top:0;width:68%;height:100%;padding:8px 4px 2px 8px}.omni-art svg{width:100%;height:100%;display:block}.omni-legend{position:absolute;right:10px;top:12px;bottom:12px;width:29%;display:flex;flex-direction:column;justify-content:center;gap:8px;padding:10px 9px;border-radius:20px;background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(255,255,255,.83));box-shadow:0 8px 22px rgba(0,0,0,.05);backdrop-filter:blur(12px)}.legend-row{display:grid;grid-template-columns:25px 1fr;gap:8px;align-items:center;min-height:32px;padding:4px 2px;color:#6d6f73;font-size:11px;font-weight:760;line-height:1.14;border-radius:12px}.legend-row ha-icon{--mdc-icon-size:21px}.legend-row.active{color:var(--primary-text-color);background:rgba(255,255,255,.72);box-shadow:inset 0 0 0 1px rgba(0,0,0,.04)}.legend-row.water.active{background:#eef8ff}.legend-row.water.active ha-icon{color:#1da8e5}.legend-row.dust.active{background:#f3f4f5}.legend-row.dust.active ha-icon{color:#68727c}.legend-row.dry.active{background:#fff5ed}.legend-row.dry.active ha-icon{color:#ff944d}.legend-row.charge.active{background:#f0fbf2;color:#2e9a50}.legend-row.charge.active ha-icon{color:#35ad5c}'''
text = text[:css_start] + new_css + text[css_end:]

hero_start = text.index("  _hero() {")
hero_end = text.index("  _quickActions() {", hero_start)
new_hero = r'''  _hero() {
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
    const blue = wash ? "#21aae8" : "#cfd7db";
    const gray = dust ? "#6f7880" : "#d1d6d9";
    const orange = dry ? "#f39b52" : "#dbd7d4";
    const green = chargeActive ? "#39b55f" : "#d4ddd7";

    return `<section class="card hero" data-more="composite_status">
      <div class="hero-top"><div><span class="eyebrow">Состояние</span><h1>${escapeHtml(compositeLabel)}</h1><p class="hero-hint">${escapeHtml(this._heroHint(snap))}</p></div><div class="connection-badge ${connection !== "Локально" ? "bad" : ""}"><i class="dot"></i>${escapeHtml(connection)}</div></div>
      <div class="omni-scene">
        <div class="omni-art">
          <svg viewBox="0 0 430 190" aria-label="OMNI station live visualization" role="img">
            <defs>
              <linearGradient id="shell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#edf1f3"/></linearGradient>
              <linearGradient id="dockBase" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3a3b"/><stop offset="1" stop-color="#1e1f20"/></linearGradient>
              <linearGradient id="robotTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#eceeef"/></linearGradient>
              <linearGradient id="glassBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${wash ? '#d8f3ff' : '#f4f7f9'}"/><stop offset="1" stop-color="${wash ? '#78d1f5' : '#e9edef'}"/></linearGradient>
              <linearGradient id="glassGray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${dust ? '#d7dde1' : '#f4f7f8'}"/><stop offset="1" stop-color="${dust ? '#9ea6ad' : '#e8ebed'}"/></linearGradient>
              <linearGradient id="glassWarm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${dry ? '#ffe0c4' : '#f6f3f1'}"/><stop offset="1" stop-color="${dry ? '#ffab63' : '#ebe7e4'}"/></linearGradient>
              <filter id="shadow" x="-20%" y="-20%" width="160%" height="180%"><feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#000" flood-opacity=".10"/></filter>
              <filter id="shadowSoft" x="-20%" y="-20%" width="160%" height="180%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity=".08"/></filter>
              <filter id="glowBlue" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <filter id="glowGray" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <filter id="glowWarm" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <g opacity=".55"><ellipse cx="93" cy="153" rx="66" ry="14" fill="#d8dee2"/><ellipse cx="282" cy="155" rx="140" ry="16" fill="#d9e0e4"/></g>
            <g filter="url(#shadow)">
              <rect x="150" y="16" width="246" height="134" rx="26" fill="url(#shell)" stroke="#cfd6da" stroke-width="2"/>
              <rect x="168" y="30" width="58" height="86" rx="13" fill="url(#glassBlue)" stroke="#d6dce0"/>
              <rect x="236" y="30" width="58" height="86" rx="13" fill="url(#glassGray)" stroke="#d6dce0"/>
              <rect x="304" y="30" width="58" height="86" rx="13" fill="url(#glassWarm)" stroke="#d6dce0"/>
              <rect x="162" y="116" width="222" height="34" rx="15" fill="url(#dockBase)"/>
              <rect x="195" y="124" width="157" height="20" rx="10" fill="#111315"/>
              <rect x="182" y="41" width="30" height="56" rx="9" fill="rgba(255,255,255,.18)"/>
              <rect x="250" y="41" width="30" height="56" rx="9" fill="rgba(255,255,255,.16)"/>
              <rect x="318" y="41" width="30" height="56" rx="9" fill="rgba(255,255,255,.16)"/>
            </g>
            <g opacity=".55" stroke="#d8dddf" stroke-width="2"><line x1="196" y1="118" x2="196" y2="150"/><line x1="265" y1="118" x2="265" y2="150"/><line x1="333" y1="118" x2="333" y2="150"/></g>
            <path d="M197 116 L197 144 L122 144 L98 137" fill="none" stroke="${blue}" stroke-width="4.5" stroke-linecap="round" ${wash ? 'filter="url(#glowBlue)"' : ''}/>
            <path d="M266 116 L266 149 L126 149 L101 143" fill="none" stroke="${gray}" stroke-width="3.5" stroke-linecap="round" ${dust ? 'filter="url(#glowGray)"' : ''}/>
            <path d="M334 116 L334 154 L132 154 L104 148" fill="none" stroke="${orange}" stroke-width="4.5" stroke-linecap="round" ${dry ? 'filter="url(#glowWarm)"' : ''}/>
            <path d="M154 132 L118 132" fill="none" stroke="${green}" stroke-width="5" stroke-linecap="round"/>
            <g transform="translate(22,96)" filter="url(#shadowSoft)">
              <ellipse cx="60" cy="34" rx="58" ry="29" fill="#f4f6f7" stroke="#d2d8dc" stroke-width="2"/>
              <ellipse cx="60" cy="28" rx="52" ry="23" fill="url(#robotTop)" stroke="#dadfe3"/>
              <rect x="14" y="36" width="92" height="10" rx="5" fill="#25282a"/>
              <rect x="18" y="39" width="28" height="4" rx="2" fill="#111315" opacity=".95"/>
              <circle cx="60" cy="18" r="12" fill="#ebeff1" stroke="#d0d6da"/>
              <circle cx="60" cy="18" r="6" fill="#cfd5d8"/>
              <circle cx="60" cy="28" r="2" fill="#dee3e6"/>
            </g>
            <circle cx="145" cy="132" r="17" fill="#ffffff" stroke="${green}" stroke-width="3"/>
            <path d="M141 121 L150 121 L146 130 L152 130 L141 144 L144 134 L137 134 Z" fill="${green}"/>
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
text = text[:hero_start] + new_hero + text[hero_end:]
PANEL.write_text(text, encoding="utf-8")

const_text = CONST.read_text(encoding="utf-8")
const_text = const_text.replace('VERSION = "v1.00_b027"', 'VERSION = "v1.00_b028"')
const_text = const_text.replace('DASHBOARD_VERSION = "v0.6.4"', 'DASHBOARD_VERSION = "v0.6.5"')
CONST.write_text(const_text, encoding="utf-8")

manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
manifest["version"] = "1.0.0b28"
MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

panel = json.loads(PANEL_JSON.read_text(encoding="utf-8"))
panel["panel"]["dashboard_version"] = "v0.6.5"
panel["panel"]["mobile_fit"]["overview_scene"] = "illustrated_three_tank_omni_station_with_verified_live_process_paths"
PANEL_JSON.write_text(json.dumps(panel, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

print("Applied S8 OMNI v1.00_b028 / UI v0.6.5 hero visual polish")
