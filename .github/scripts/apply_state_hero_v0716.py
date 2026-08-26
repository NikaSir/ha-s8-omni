import json
import re
from pathlib import Path

JS = Path('custom_components/s8_omni/frontend/s8-omni-panel.js')
text = JS.read_text(encoding='utf-8')
text = text.replace('const UI_VERSION = "v0.7.15";', 'const UI_VERSION = "v0.7.16";', 1)

old_art = '''const PRODUCT_CLEAN_IMAGE = `${ASSET_ROOT}/product-clean.jpg?v=${encodeURIComponent(UI_VERSION)}`;
const PRODUCT_DOCK_IMAGE = `${ASSET_ROOT}/product-dock.jpg?v=${encodeURIComponent(UI_VERSION)}`;

function productArtUrl(mode) {
  return mode === "dock" ? PRODUCT_DOCK_IMAGE : PRODUCT_CLEAN_IMAGE;
}
'''
new_art = '''const HERO_IMAGES = {
  dock: `${ASSET_ROOT}/hero-dock.webp?v=${encodeURIComponent(UI_VERSION)}`,
  away: `${ASSET_ROOT}/hero-away.webp?v=${encodeURIComponent(UI_VERSION)}`,
  dust: `${ASSET_ROOT}/hero-dust.webp?v=${encodeURIComponent(UI_VERSION)}`,
  wash: `${ASSET_ROOT}/hero-wash.webp?v=${encodeURIComponent(UI_VERSION)}`,
  dry: `${ASSET_ROOT}/hero-dry.webp?v=${encodeURIComponent(UI_VERSION)}`,
};
'''
if old_art not in text:
    raise SystemExit('old art constants not found')
text = text.replace(old_art, new_art, 1)

text = text.replace(
    '  "resume_cleaning", "do_not_disturb", "child_lock", "mode", "suction", "water", "volume", "refresh",\n',
    '  "resume_cleaning", "do_not_disturb", "child_lock", "mode", "suction", "water", "volume", "refresh",\n  "stop_dust_collection", "stop_roller_cleaning", "stop_roller_drying",\n',
    1,
)

old_workspace = '''  _workspace(content) {
    this._restoreTransform(false);
    return `<div class="work-viewport" data-work-viewport><div class="work-canvas" data-work-canvas style="transform:${this._transformCss()}"><div class="content">${content}</div></div><div class="scale-toast" data-scale-toast aria-live="polite"></div></div>`;
  }
'''
new_workspace = '''  _workspace(content) {
    this._restoreTransform(false);
    const percent = Math.round(this._viewTransform.scale * 100);
    return `<div class="work-viewport" data-work-viewport><div class="work-canvas" data-work-canvas style="transform:${this._transformCss()}"><div class="content">${content}</div></div><div class="zoom-controls" aria-label="Масштаб рабочей области"><button type="button" data-zoom-out aria-label="Уменьшить масштаб">−</button><button type="button" data-zoom-reset data-zoom-value aria-label="Вернуть масштаб 100 процентов">${percent}%</button><button type="button" data-zoom-in aria-label="Увеличить масштаб">+</button></div><div class="scale-toast" data-scale-toast aria-live="polite"></div></div>`;
  }
'''
if old_workspace not in text:
    raise SystemExit('workspace block not found')
text = text.replace(old_workspace, new_workspace, 1)

needle = '''  _clampTransform(state = this._viewTransform) {
'''
zoom_methods = '''  _zoomTo(nextScale) {
    const viewport = this.shadowRoot?.querySelector("[data-work-viewport]");
    if (!viewport) return;
    const scale = Math.max(VIEW_SCALE_MIN, Math.min(VIEW_SCALE_MAX, Number(nextScale) || 1));
    const current = this._viewTransform;
    const center = { x: viewport.clientWidth / 2, y: viewport.clientHeight / 2 };
    const contentX = (center.x - current.x) / current.scale;
    const contentY = (center.y - current.y) / current.scale;
    this._viewTransform = this._clampTransform({
      scale,
      x: center.x - contentX * scale,
      y: center.y - contentY * scale,
    });
    this._clampAndApplyTransform(true);
    this._showScaleToast();
  }

  _zoomBy(delta) { this._zoomTo(this._viewTransform.scale + delta); }

'''
if zoom_methods not in text:
    text = text.replace(needle, zoom_methods + needle, 1)

old_apply = '''    this._viewTransform = this._clampTransform(this._viewTransform);
    canvas.style.transform = this._transformCss();
    if (persist) this._saveTransform();
'''
new_apply = '''    this._viewTransform = this._clampTransform(this._viewTransform);
    canvas.style.transform = this._transformCss();
    const value = this.shadowRoot?.querySelector("[data-zoom-value]");
    if (value) value.textContent = `${Math.round(this._viewTransform.scale * 100)}%`;
    if (persist) this._saveTransform();
'''
if old_apply not in text:
    raise SystemExit('apply transform block not found')
text = text.replace(old_apply, new_apply, 1)

# Replace old Hero resolver/hint + Hero + actions + Overview in one controlled region.
start = text.index('  _heroHint(snap) {')
end = text.index('  _cleaning() {', start)
replacement = r'''  _activeStationStopKeys(snap) {
    const ops = new Set(snap.stationOperations || []);
    const keys = [];
    if (ops.has("dust_collection") || snap.station === "dust_collection") keys.push("stop_dust_collection");
    if (ops.has("roller_cleaning") || snap.station === "roller_cleaning") keys.push("stop_roller_cleaning");
    if (ops.has("drying") || snap.station === "drying") keys.push("stop_roller_drying");
    return keys;
  }

  _heroState(snap) {
    if (snap.connection === "disconnected") return { image: "dock", title: "Нет связи", hint: "Нет актуальной локальной телеметрии", tone: "error" };
    if (snap.connection === "unknown") return { image: "dock", title: "Связь не подтверждена", hint: "Ожидаем текущую локальную телеметрию", tone: "warn" };
    const ops = new Set(snap.stationOperations || []);
    if (ops.size > 1 || snap.station === "multiple_operations") {
      const labels = [...ops].map((x) => STATION_OPERATION_LABELS[x] || x).join(" · ");
      return { image: "dock", title: "Станция работает", hint: labels || "Выполняется несколько операций станции", tone: "operation" };
    }
    if (ops.has("dust_collection") || snap.station === "dust_collection") return { image: "dust", title: "Сбор пыли", hint: "Станция опустошает пылесборник робота", tone: "operation" };
    if (ops.has("roller_cleaning") || snap.station === "roller_cleaning") return { image: "wash", title: "Мойка швабры", hint: "Станция промывает швабру", tone: "operation" };
    if (ops.has("drying") || snap.station === "drying") return { image: "dry", title: "Сушка швабры", hint: "Станция сушит швабру тёплым воздухом", tone: "warm" };
    if (snap.composite === "returning_to_dock" || snap.robot === "returning_to_dock") return { image: "away", title: "Возврат на станцию", hint: "Робот возвращается на станцию", tone: "operation" };
    if (["cleaning", "zone_cleaning", "room_cleaning"].includes(snap.composite) || ["cleaning", "zone_cleaning", "room_cleaning"].includes(snap.robot)) return { image: "away", title: "Уборка", hint: "Робот выполняет уборку", tone: "operation" };
    if (snap.composite === "paused" || snap.robot === "paused") return { image: "away", title: "Пауза", hint: "Уборка приостановлена", tone: "neutral" };
    if (snap.robot === "charging") return { image: "dock", title: "Зарядка", hint: "Робот на станции и заряжается", tone: "good" };
    if (snap.robot === "charged") return { image: "dock", title: "На базе · Заряжен", hint: "Робот на станции, заряд завершён", tone: "good" };
    if (snap.onDock === true) return { image: "dock", title: "Простой", hint: "Робот и станция в ожидании", tone: "neutral" };
    return { image: "away", title: "Простой", hint: "Робот ожидает команду", tone: "neutral" };
  }

  _resourceStrip(snap) {
    const value = snap.unreliable ? "Нет данных" : "Нет датчика";
    return `<div class="resource-strip"><div class="resource-chip"><ha-icon icon="mdi:water"></ha-icon><span><strong>Чистая вода</strong><small>${value}</small></span></div><div class="resource-chip dirty"><ha-icon icon="mdi:water-opacity"></ha-icon><span><strong>Грязная вода</strong><small>${value}</small></span></div><div class="resource-chip dustbag"><ha-icon icon="mdi:delete-outline"></ha-icon><span><strong>Пыль/мешок</strong><small>${value}</small></span></div></div>`;
  }

  _hero() {
    const snap = this._snapshot();
    const state = this._heroState(snap);
    const connection = this._connectionLabel();
    const charging = !snap.unreliable && snap.robot === "charging";
    const charged = !snap.unreliable && snap.robot === "charged";
    const battery = snap.battery === null ? "—" : `${Math.round(snap.battery)}%`;
    const age = snap.age === null ? "—" : this._formatDuration(snap.age);
    const mode = this._modeLabel(snap), modeMeta = this._modeMeta(snap, mode);
    const batteryIcon = this._batteryIcon(snap, charging, charged), modeIcon = this._modeIcon(snap), telemetryIcon = this._telemetryIcon(snap), telemetryMeta = this._telemetryMeta(snap);
    const batteryTone = snap.battery !== null && snap.battery < 15 ? " low" : "";
    const image = HERO_IMAGES[state.image] || HERO_IMAGES.dock;
    return `<section class="card hero state-hero ${state.tone || ""}" data-more="composite_status"><div class="hero-top"><div><span class="eyebrow">Состояние</span><h1>${escapeHtml(state.title)}</h1><p class="hero-hint">${escapeHtml(state.hint)}</p></div><div class="connection-badge ${connection !== "Локально" ? "bad" : ""}"><i class="dot"></i>${escapeHtml(connection)}</div></div><div class="state-scene ${snap.unreliable ? "muted" : ""}"><img class="state-image" src="${image}" alt="S8 OMNI — ${escapeHtml(state.title)}" />${this._resourceStrip(snap)}</div><div class="hero-metrics"><div data-more="battery"><ha-icon class="metric-icon battery${batteryTone}" icon="${batteryIcon}"></ha-icon><span>АКБ</span><strong>${battery}</strong><small>Текущий заряд</small><div class="battery-bar"><i style="width:${snap.battery ?? 0}%"></i></div></div><div data-more="mode"><ha-icon class="metric-icon mode" icon="${modeIcon}"></ha-icon><span>Режим</span><strong>${escapeHtml(mode)}</strong><small>${escapeHtml(modeMeta)}</small></div><div data-more="telemetry_age"><ha-icon class="metric-icon telemetry" icon="${telemetryIcon}"></ha-icon><span>Телеметрия</span><strong>${escapeHtml(age)}</strong><small>${escapeHtml(telemetryMeta)}</small></div></div></section>`;
  }

  _quickActions() {
    const snap = this._snapshot();
    const vacuum = snap.vacuum, available = snap.connected && this._available(vacuum);
    const cleaning = vacuum?.state === "cleaning" || ["cleaning", "zone_cleaning", "room_cleaning"].includes(snap.robot);
    const paused = vacuum?.state === "paused" || snap.robot === "paused";
    const returning = snap.robot === "returning_to_dock" || snap.composite === "returning_to_dock";
    const docked = snap.onDock === true || ["charging", "charged"].includes(snap.robot);
    const stationStops = this._activeStationStopKeys(snap).filter((key) => Boolean(this._entityId(key)));
    const stationActive = stationStops.length > 0;
    const stopKeys = stationStops.join(",");

    if (stationActive) {
      return `<div class="quick-actions"><button class="action ready" type="button" disabled><span class="action-icon"><ha-icon icon="mdi:play"></ha-icon></span><strong>Уборка</strong><span class="action-sub">Недоступно</span></button><button class="action" type="button" disabled><span class="action-icon"><ha-icon icon="mdi:pause"></ha-icon></span><strong>Пауза</strong><span class="action-sub">Недоступно</span></button><button class="action primary stop" type="button" data-station-stop="${stopKeys}"><span class="action-icon"><ha-icon icon="mdi:stop"></ha-icon></span><strong>Стоп</strong><span class="action-sub">Прервать</span></button></div>`;
    }
    if (cleaning) {
      return `<div class="quick-actions"><button class="action running" type="button" disabled><span class="action-icon"><ha-icon icon="mdi:robot-vacuum"></ha-icon></span><strong>Уборка</strong><span class="action-sub">Идёт</span></button><button class="action primary" type="button" data-action="pause" ${available ? "" : "disabled"}><span class="action-icon"><ha-icon icon="mdi:pause"></ha-icon></span><strong>Пауза</strong><span class="action-sub">Приостановить</span></button><button class="action primary stop" type="button" data-action="stop" ${available ? "" : "disabled"}><span class="action-icon"><ha-icon icon="mdi:stop"></ha-icon></span><strong>Стоп</strong><span class="action-sub">Завершить</span></button></div>`;
    }
    if (paused) {
      return `<div class="quick-actions"><button class="action primary" type="button" data-action="start" ${available ? "" : "disabled"}><span class="action-icon"><ha-icon icon="mdi:play"></ha-icon></span><strong>Продолжить</strong><span class="action-sub">Уборку</span></button><button class="action" type="button" disabled><span class="action-icon"><ha-icon icon="mdi:pause"></ha-icon></span><strong>Пауза</strong><span class="action-sub">Активна</span></button><button class="action primary stop" type="button" data-action="stop" ${available ? "" : "disabled"}><span class="action-icon"><ha-icon icon="mdi:stop"></ha-icon></span><strong>Стоп</strong><span class="action-sub">Завершить</span></button></div>`;
    }
    if (returning) {
      return `<div class="quick-actions"><button class="action ready" type="button" disabled><span class="action-icon"><ha-icon icon="mdi:play"></ha-icon></span><strong>Уборка</strong><span class="action-sub">Недоступно</span></button><button class="action" type="button" disabled><span class="action-icon"><ha-icon icon="mdi:pause"></ha-icon></span><strong>Пауза</strong><span class="action-sub">Недоступно</span></button><button class="action primary stop" type="button" data-action="stop" ${available ? "" : "disabled"}><span class="action-icon"><ha-icon icon="mdi:stop"></ha-icon></span><strong>Стоп</strong><span class="action-sub">Прервать</span></button></div>`;
    }
    const homeClass = docked ? "action primary running" : "action";
    return `<div class="quick-actions"><button class="action ready" type="button" data-action="start" ${available ? "" : "disabled"}><span class="action-icon"><ha-icon icon="mdi:play"></ha-icon></span><strong>Уборка</strong><span class="action-sub">Smart</span></button><button class="action" type="button" disabled><span class="action-icon"><ha-icon icon="mdi:pause"></ha-icon></span><strong>Пауза</strong><span class="action-sub">Недоступно</span></button><button class="${homeClass}" type="button" data-action="home" ${available && !docked ? "" : "disabled"}><span class="action-icon"><ha-icon icon="${docked ? "mdi:home-check" : "mdi:home"}"></ha-icon></span><strong>Домой</strong><span class="action-sub">${docked ? "На базе ✓" : "На станцию"}</span></button></div>`;
  }

  _overview() {
    const snap = this._snapshot();
    return `<div>${this._hero()}${this._trustBanner(snap)}${this._quickActions()}</div>`;
  }

'''
text = text[:start] + replacement + text[end:]

# Bind permanent zoom controls and stop-only station buttons.
bind_needle = '    this.shadowRoot.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => this._switchWorkspace(b.dataset.view, null)));\n'
bind_add = bind_needle + '''    this.shadowRoot.querySelector("[data-zoom-out]")?.addEventListener("click", () => this._zoomBy(-0.10));
    this.shadowRoot.querySelector("[data-zoom-in]")?.addEventListener("click", () => this._zoomBy(0.10));
    this.shadowRoot.querySelector("[data-zoom-reset]")?.addEventListener("click", () => this._resetTransform(true));
    this.shadowRoot.querySelectorAll("[data-station-stop]").forEach((b) => b.addEventListener("click", async () => {
      if (b.disabled || !this._snapshot().connected) return;
      const keys = String(b.dataset.stationStop || "").split(",").filter(Boolean);
      if (!keys.length) return;
      b.disabled = true;
      try { for (const key of keys) await this._call("button", "press", key); }
      finally { setTimeout(() => { b.disabled = false; }, 700); }
    }));
'''
if bind_needle not in text:
    raise SystemExit('bind insertion point not found')
text = text.replace(bind_needle, bind_add, 1)

# Add v0.7.16 visual contract as an overriding CSS layer.
css_marker = '      /* v0.7.15 stable iOS gesture canvas */\n'
css = r'''      /* v0.7.16 state-aware photographic Hero */
      .state-hero{padding:14px;overflow:hidden}
      .state-hero .hero-top{margin-bottom:10px}
      .state-hero h1{font-size:32px}
      .state-scene{position:relative;height:330px;border-radius:22px;overflow:hidden;background:#f4f2ee;border:1px solid color-mix(in srgb,var(--divider-color) 60%,transparent);box-shadow:0 8px 24px rgba(20,42,52,.06)}
      .state-image{display:block;width:100%;height:100%;object-fit:cover;object-position:center;transition:opacity .18s ease,filter .18s ease}
      .state-scene.muted .state-image{opacity:.55;filter:grayscale(.28)}
      .resource-strip{position:absolute;left:10px;right:10px;bottom:10px;z-index:3;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));align-items:stretch;background:rgba(255,255,255,.94);border:1px solid rgba(80,96,104,.10);border-radius:17px;box-shadow:0 8px 22px rgba(16,34,44,.08);backdrop-filter:blur(14px) saturate(120%);overflow:hidden}
      .resource-chip{min-height:58px;display:grid;grid-template-columns:36px minmax(0,1fr);align-items:center;gap:7px;padding:8px 9px;position:relative}
      .resource-chip:not(:last-child)::after{content:"";position:absolute;right:0;top:12px;bottom:12px;width:1px;background:var(--divider-color)}
      .resource-chip ha-icon{--mdc-icon-size:25px;color:#19a9e4}.resource-chip.dirty ha-icon{color:#707980}.resource-chip.dustbag ha-icon{color:#6d7479}
      .resource-chip strong,.resource-chip small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.resource-chip strong{font-size:10px}.resource-chip small{font-size:9px;color:var(--secondary-text-color);margin-top:2px}
      .state-hero .hero-metrics{margin-top:9px}
      .state-hero.operation h1{color:var(--primary-color)}.state-hero.warm h1{color:#c56b22}.state-hero.error h1{color:var(--error-color,#db4437)}
      .action.primary .action-icon ha-icon,.action.primary.running .action-icon ha-icon{color:currentColor!important;opacity:1!important}
      .action.primary.running:disabled{opacity:1}.action.primary.running:disabled .action-icon{opacity:1}
      .zoom-controls{position:absolute;right:10px;bottom:10px;z-index:96;display:grid;grid-template-columns:34px 54px 34px;height:36px;background:rgba(255,255,255,.94);border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);border-radius:999px;box-shadow:0 5px 16px rgba(0,0,0,.11);backdrop-filter:blur(12px);overflow:hidden}
      .zoom-controls button{border:0;background:transparent;color:var(--primary-text-color);font-size:17px;font-weight:750;padding:0;min-width:0}.zoom-controls button+button{border-left:1px solid var(--divider-color)}.zoom-controls [data-zoom-value]{font-size:11px;color:var(--secondary-text-color)}
      @media(max-width:430px){.state-scene{height:318px}.resource-strip{left:7px;right:7px;bottom:7px}.resource-chip{grid-template-columns:29px minmax(0,1fr);gap:4px;padding:7px 5px}.resource-chip ha-icon{--mdc-icon-size:22px}.resource-chip strong{font-size:8.8px}.resource-chip small{font-size:8.2px}.state-hero h1{font-size:30px}}
'''
if css_marker not in text:
    raise SystemExit('css marker not found')
text = text.replace(css_marker, css + css_marker, 1)
JS.write_text(text, encoding='utf-8')

# Stop-only station operation buttons: no start semantics exposed.
button = Path('custom_components/s8_omni/button.py')
button.write_text('''from dataclasses import dataclass\n\nfrom homeassistant.components.button import ButtonEntity\n\nfrom .const import DOMAIN, DP_DUST, DP_ROLL_CLEAN, DP_ROLL_DRY\nfrom .entity import S8OmniEntity\n\n\n@dataclass(frozen=True)\nclass StopDesc:\n    key: str\n    name: str\n    dp: int\n\n\nSTOP_DESCS = [\n    StopDesc("stop_dust_collection", "Остановить сбор пыли", DP_DUST),\n    StopDesc("stop_roller_cleaning", "Остановить мойку швабры", DP_ROLL_CLEAN),\n    StopDesc("stop_roller_drying", "Остановить сушку швабры", DP_ROLL_DRY),\n]\n\n\nasync def async_setup_entry(hass, entry, async_add_entities):\n    coordinator = hass.data[DOMAIN][entry.entry_id]\n    async_add_entities([S8OmniRefreshButton(coordinator), *[S8OmniStopOperationButton(coordinator, desc) for desc in STOP_DESCS]])\n\n\nclass S8OmniRefreshButton(S8OmniEntity, ButtonEntity):\n    _attr_name = "Обновить сейчас"\n    _attr_icon = "mdi:refresh"\n\n    def __init__(self, coordinator):\n        super().__init__(coordinator, "refresh")\n\n    async def async_press(self) -> None:\n        await self.coordinator.async_request_refresh()\n\n\nclass S8OmniStopOperationButton(S8OmniEntity, ButtonEntity):\n    _attr_icon = "mdi:stop"\n\n    def __init__(self, coordinator, desc: StopDesc):\n        super().__init__(coordinator, desc.key)\n        self.desc = desc\n        self._attr_name = desc.name\n\n    @property\n    def available(self):\n        return super().available and self.coordinator.data is not None and self.desc.dp in self.coordinator.data\n\n    async def async_press(self) -> None:\n        # Stop-only public API: verified station DPs are booleans, so false interrupts\n        # the active operation. Starting station operations is intentionally not exposed.\n        await self.coordinator.async_set_dp(self.desc.dp, False)\n''', encoding='utf-8')

# Versions and manifests.
const = Path('custom_components/s8_omni/const.py')
c = const.read_text(encoding='utf-8').replace('VERSION = "v1.00_b048"', 'VERSION = "v1.00_b049"', 1).replace('DASHBOARD_VERSION = "v0.7.15"', 'DASHBOARD_VERSION = "v0.7.16"', 1)
const.write_text(c, encoding='utf-8')
manifest_path = Path('custom_components/s8_omni/manifest.json')
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
manifest['version'] = '1.0.0b49'
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

panel_path = Path('panel.json')
panel = json.loads(panel_path.read_text(encoding='utf-8'))
p = panel['panel']
p['dashboard_version'] = 'v0.7.16'
frontend = p['frontend']
for asset in ['assets/hero-dock.webp','assets/hero-away.webp','assets/hero-dust.webp','assets/hero-wash.webp','assets/hero-dry.webp']:
    if asset not in frontend['assets']:
        frontend['assets'].append(asset)
frontend['product_art_states'] = ['dock','away','dust_collection','roller_cleaning','drying']
p['navigation']['view_responsibilities']['overview'] = 'state_aware_photographic_hero_resource_strip_kpis_and_actions_without_status_grid'
p['mobile_fit']['overview_scene'] = 'state_specific_local_webp_background_plus_live_text_and_resource_strip'
p['mobile_fit']['status_layout'] = 'removed_from_overview_use_station_view_for_details'
p['mobile_fit']['status_heading'] = None
p['workspace_transform']['permanent_zoom_controls'] = True
panel['ownership']['station_commands_require_public_integration_api'] = True
panel_path.write_text(json.dumps(panel, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

readme = Path('README.md')
r = readme.read_text(encoding='utf-8').replace('v1.00_b048', 'v1.00_b049', 1).replace('1.0.0b48', '1.0.0b49', 1).replace('Dashboard **v0.7.15**', 'Dashboard **v0.7.16**', 1)
readme.write_text(r, encoding='utf-8')

protocol = Path('docs/PROTOCOL.md')
pr = protocol.read_text(encoding='utf-8')
anchor = '- **Return home:** `mode=chargego` → `pause=false` → `power_go=true`.\n'
addition = anchor + '- **Stop station dust collection:** `dp_dust=false` (stop-only public button).\n- **Stop mop self-cleaning:** `dp_roll_clean=false` (stop-only public button).\n- **Stop mop drying:** `dp_roll_hot=false` (stop-only public button).\n'
if 'Stop station dust collection' not in pr and anchor in pr:
    pr = pr.replace(anchor, addition, 1)
protocol.write_text(pr, encoding='utf-8')

changelog = Path('CHANGELOG.md')
cl = changelog.read_text(encoding='utf-8')
entry = '''## v1.00_b049 / UI v0.7.16\n\n- State-aware photographic Overview Hero for docked, cleaning/return, dust collection, mop washing and mop drying.\n- Overview status grid removed; resources are shown as a compact strip inside the Hero.\n- Added stop-only public buttons for DP134/135/136 station operations.\n- Added permanent `− / % / +` workspace zoom controls while preserving pinch/pan and fixed HA shell.\n\n'''
if 'v1.00_b049 / UI v0.7.16' not in cl:
    pos = cl.find('\n', cl.find('#')) + 1 if cl.startswith('#') else 0
    cl = cl[:pos] + '\n' + entry + cl[pos:]
changelog.write_text(cl, encoding='utf-8')
