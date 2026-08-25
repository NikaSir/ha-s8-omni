from pathlib import Path
import re

path = Path("custom_components/s8_omni/frontend/s8-omni-panel.js")
text = path.read_text(encoding="utf-8")

if 'const UI_VERSION = "v0.7.7";' in text:
    raise SystemExit("v0.7.7 already applied")

# Drop the embedded images entirely. Product art is now installed as ordinary
# JPEG files inside the integration's already registered static frontend tree.
header_pattern = re.compile(
    r'\Aconst UI_VERSION = "v0\.7\.6";\n'
    r'const PRODUCT_ART_CLEAN_BASE64 = ".*?";\n'
    r'const PRODUCT_ART_DOCK_BASE64 = ".*?";\n'
    r'function productArtUrl\(mode\) \{.*?\n\}\n',
    re.S,
)
header_replacement = '''const UI_VERSION = "v0.7.7";
function productArtUrl(mode) {
  const safeMode = mode === "dock" ? "dock" : "clean";
  return `/s8_omni/frontend/product-${safeMode}.jpg?v=${encodeURIComponent(UI_VERSION)}`;
}
'''
text, count = header_pattern.subn(header_replacement, text, count=1)
if count != 1:
    raise SystemExit("Unable to replace product-art header")

snapshot_old = '      mode: unreliable ? null : this._stateValue("mode", attrs.mode ?? null),\n      onDock: unreliable ? null : attrs.robot_on_dock,'
snapshot_new = '      mode: unreliable ? null : this._stateValue("mode", attrs.mode ?? null),\n      workMode: unreliable ? null : this._stateValue("work_mode", null),\n      onDock: unreliable ? null : attrs.robot_on_dock,'
if snapshot_old not in text:
    raise SystemExit("Unable to locate snapshot mode block")
text = text.replace(snapshot_old, snapshot_new, 1)

mode_old = '''  _modeLabel(snap) {
    if (snap.unreliable) return "Нет данных";
    return this._label(MODE_LABELS, snap.mode, "Нет данных");
  }
'''
mode_new = '''  _modeLabel(snap) {
    if (snap.unreliable) return "Нет данных";
    const work = String(snap.workMode ?? "").toLowerCase();
    if (MODE_LABELS[work]) return MODE_LABELS[work];
    if (snap.mode === "chargego" && snap.onDock === true) return "Нет данных";
    return this._label(MODE_LABELS, snap.mode, "Нет данных");
  }
'''
if mode_old not in text:
    raise SystemExit("Unable to locate mode label block")
text = text.replace(mode_old, mode_new, 1)

# Replace the operational status strip with the approved product-card treatment.
overview_start = text.index('  _overview() {')
overview_end = text.index('\n  _cleaning() {', overview_start)
new_overview = '''  _overview() {
    const snap = this._snapshot();
    const robot = snap.unreliable ? "Нет данных" : this._label(ROBOT_LABELS, snap.robot, "Нет данных");
    const stationRaw = snap.unreliable ? "Нет данных" : this._label(STATION_LABELS, snap.station, "Нет данных");
    const station = snap.station === "idle" && !snap.unreliable ? "Готова" : stationRaw;
    const robotContext = snap.unreliable ? "Нет данных" : snap.onDock === true ? "На базе" : snap.onDock === false ? "В работе" : "Позиция неизвестна";
    const operation = snap.unreliable ? "Нет данных" : snap.stationOperations.length ? snap.stationOperations.map((x) => STATION_OPERATION_LABELS[x] || x).join(" · ") : snap.missingStationDps.length ? "Часть данных" : "В ожидании";
    const asset = (name) => `/s8_omni/frontend/status-${name}.jpg?v=${encodeURIComponent(UI_VERSION)}`;
    return `<div>${this._hero()}${this._trustBanner(snap)}${this._quickActions()}<section class="card statuses-card"><div class="statuses-head"><h2>Статусы</h2><button type="button" data-view="station">Все <ha-icon icon="mdi:chevron-right"></ha-icon></button></div><div class="status-grid">
      <button class="status-card good" data-more="robot_status" type="button"><img class="status-thumb" src="${asset("robot")}" alt="Робот" /><strong>Робот</strong><b>${escapeHtml(robot)}</b><span class="meta">${escapeHtml(robotContext)}</span></button>
      <button class="status-card good" data-more="station_status" type="button"><img class="status-thumb" src="${asset("station")}" alt="Станция" /><strong>Станция</strong><b>${escapeHtml(station)}</b><span class="meta">${escapeHtml(operation)}</span></button>
      <div class="status-card neutral"><img class="status-thumb" src="${asset("water")}" alt="Чистая вода" /><strong>Чистая вода</strong><b>Не контрол.</b><span class="meta">Датчика уровня нет</span></div>
      <div class="status-card neutral"><img class="status-thumb" src="${asset("dustbin")}" alt="Пылесборник" /><strong>Пылесборник</strong><b>Не контрол.</b><span class="meta">Датчика заполнения нет</span></div>
    </div></section></div>`;
  }
'''
text = text[:overview_start] + new_overview + text[overview_end:]

# Late CSS overrides deliberately sit after the existing rules so the patch is
# small and easy to retire when the panel stylesheet is next consolidated.
marker = '      @keyframes spin{to{transform:rotate(360deg)}}'
if marker not in text:
    raise SystemExit("Unable to locate CSS insertion marker")
overrides = '''      .content{padding-bottom:calc(156px + env(safe-area-inset-bottom))}
      .omni-scene{height:248px}.omni-art{left:0;top:0;bottom:0;width:71%;overflow:hidden;border-radius:21px}.product-art{width:100%;height:100%;object-fit:cover;object-position:center;border-radius:21px;filter:none}.omni-legend{right:6px;top:9px;bottom:9px;width:35%;gap:5px;padding:8px}.legend-copy strong{white-space:normal;line-height:1.05}.legend-copy small{white-space:nowrap}.action.primary.running{background:linear-gradient(145deg,color-mix(in srgb,var(--primary-color) 92%,white),var(--primary-color));color:var(--text-primary-color,white);border-color:transparent;box-shadow:0 9px 20px color-mix(in srgb,var(--primary-color) 22%,transparent)}.status-card{min-height:142px;justify-content:flex-start;padding:8px 6px 9px}.status-thumb{display:block;width:100%;height:68px;object-fit:contain;border-radius:12px;background:#fff;margin-bottom:5px}.status-card strong{font-size:10px}.status-card b{font-size:13px;white-space:normal}.status-card span.meta{white-space:normal;min-height:22px}.status-card.neutral b{color:var(--secondary-text-color)}
      @media(max-width:430px){.omni-scene{height:242px}.omni-art{width:70%}.omni-legend{width:36%;right:5px}.legend-copy strong{font-size:9.5px}.status-thumb{height:62px}.status-card{min-height:136px}}
'''
text = text.replace(marker, overrides + marker, 1)

path.write_text(text, encoding="utf-8")
print("Applied UI v0.7.7 static-JPEG patch")
