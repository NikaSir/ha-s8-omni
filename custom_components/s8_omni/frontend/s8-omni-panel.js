const UI_VERSION = "v0.6.8";

const ROBOT_LABELS = {
  idle: "Ожидание", cleaning: "Уборка", zone_cleaning: "Зона", room_cleaning: "Комнаты",
  paused: "Пауза", going_to_position: "К точке", position_reached: "У точки", position_not_reached: "Нет позиции",
  returning_to_dock: "Возврат", charging: "Зарядка", charged: "Заряжен", sleeping: "Сон", error: "Ошибка",
  wall_following: "Вдоль стен", manual_control: "Вручную", repositioning: "Поиск позиции", creating_map: "Карта", unknown: "Нет данных",
};
const STATION_LABELS = { idle: "Ожидание", dust_collection: "Сбор пыли", roller_cleaning: "Промывка", drying: "Сушка", multiple_operations: "Несколько", unknown: "Нет данных" };
const COMPOSITE_LABELS = {
  idle: "Готов к уборке", cleaning: "Уборка", zone_cleaning: "Зона", room_cleaning: "Комнаты", paused: "Пауза",
  returning_to_dock: "Возврат", charging: "Зарядка", charged: "На базе · Заряжен", sleeping: "Сон", repositioning: "Поиск позиции",
  docked_dust_collection: "На базе · Сбор пыли", docked_roller_cleaning: "На базе · Промывка", docked_drying: "На базе · Сушка",
  docked_station_active: "На базе · Станция активна", error: "Требуется внимание", unknown: "Нет данных",
};
const MODE_LABELS = { smart: "Smart", zone: "Зона", pose: "Точка", part: "Частичная", chargego: "Возврат", wallfollow: "Вдоль стен", selectroom: "Комнаты" };
const SUCTION_LABELS = { gentle: "Тихий", normal: "Нормальный", strong: "Сильный" };
const WATER_LABELS = { closed: "Закрыто", low: "Низкий", normal: "Средний", high: "Высокий" };
const STATION_OPERATION_LABELS = { dust_collection: "Сбор пыли", roller_cleaning: "Промывка", drying: "Сушка" };
const ENTITY_SUFFIXES = [
  "vacuum", "battery", "clean_time", "clean_area", "side_brush_life", "main_brush_life", "filter_life",
  "fault", "work_mode", "raw_status", "robot_status", "station_status", "composite_status", "last_telemetry",
  "telemetry_age", "local_connection", "dust_collection", "roller_cleaning", "roller_drying", "custom_mode",
  "resume_cleaning", "do_not_disturb", "child_lock", "mode", "suction", "water", "volume", "refresh",
];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

class S8OmniPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._panel = null;
    this._view = "overview";
    this._detail = null;
    this._entities = {};
    this._registryLoaded = false;
    this._registryLoading = false;
    this._registryError = null;
    this._renderQueued = false;
  }

  set hass(value) { this._hass = value; this._ensureRegistry(); this._queueRender(); }
  get hass() { return this._hass; }
  set panel(value) { this._panel = value; this._ensureRegistry(); this._queueRender(); }
  set narrow(_value) {}
  connectedCallback() { this._queueRender(); }

  _queueRender() {
    if (this._renderQueued) return;
    this._renderQueued = true;
    requestAnimationFrame(() => { this._renderQueued = false; this._render(); });
  }

  async _ensureRegistry() {
    if (!this._hass || !this._panel || this._registryLoading) return;
    const entryId = this._panel?.config?.entry_id;
    if (!entryId || (this._registryLoaded && Object.keys(this._entities).length)) return;
    this._registryLoading = true;
    this._registryError = null;
    try {
      const entries = await this._hass.callWS({ type: "config/entity_registry/list" });
      const mapped = {};
      for (const item of entries) {
        if (item.config_entry_id !== entryId || item.platform !== "s8_omni") continue;
        const suffix = ENTITY_SUFFIXES.find((key) => item.unique_id?.endsWith(`_${key}`));
        if (suffix) mapped[suffix] = item.entity_id;
      }
      this._entities = mapped;
      this._registryLoaded = true;
    } catch (err) {
      this._registryError = String(err);
      this._registryLoaded = true;
    } finally {
      this._registryLoading = false;
      this._queueRender();
    }
  }

  _entityId(key) { return this._entities[key] || null; }
  _state(key) { const id = this._entityId(key); return id && this._hass ? this._hass.states[id] : null; }
  _available(obj) { return Boolean(obj && !["unavailable", "unknown", "none"].includes(obj.state)); }
  _stateValue(key, fallback = null) { const obj = this._state(key); return this._available(obj) ? obj.state : fallback; }
  _numeric(key) { const value = Number(this._stateValue(key)); return Number.isFinite(value) ? value : null; }
  _label(map, value, fallback = "Нет данных") {
    if (value === null || value === undefined || value === "unavailable") return fallback;
    if (value === "unknown") return map.unknown || "Неизвестно";
    return map[value] || String(value);
  }
  _formatDuration(seconds) {
    const value = Number(seconds);
    if (!Number.isFinite(value)) return "Нет данных";
    if (value < 60) return `${Math.max(0, Math.round(value))} с`;
    const minutes = Math.floor(value / 60); const rest = Math.round(value % 60);
    return rest ? `${minutes} мин ${rest} с` : `${minutes} мин`;
  }
  _formatEntity(key, fallback = "Нет данных") {
    const obj = this._state(key);
    if (!obj) return fallback;
    if (obj.state === "unavailable") return "Недоступно";
    if (obj.state === "unknown") return "Неизвестно";
    const unit = obj.attributes?.unit_of_measurement;
    return unit ? `${obj.state} ${unit === "min" ? "мин" : unit}` : obj.state;
  }
  _connectionState() {
    const obj = this._state("local_connection");
    if (!obj || ["unknown", "unavailable"].includes(obj.state)) return "unknown";
    return obj.state === "on" ? "connected" : "disconnected";
  }
  _connectionLabel() {
    const state = this._connectionState();
    return state === "connected" ? "Локально" : state === "disconnected" ? "Нет связи" : "Связь неизвестна";
  }

  _snapshot() {
    const vacuum = this._state("vacuum");
    const compositeObj = this._state("composite_status");
    const attrs = compositeObj?.attributes || {};
    const connection = this._connectionState();
    const unavailable = connection === "disconnected" || !vacuum || vacuum.state === "unavailable";
    const unreliable = unavailable || connection === "unknown";
    const rawBattery = this._numeric("battery") ?? Number(vacuum?.attributes?.battery_level);
    return {
      vacuum, compositeObj, attrs, connection, connected: connection === "connected", unavailable, unreliable,
      robot: unreliable ? "unknown" : this._stateValue("robot_status", "unknown"),
      station: unreliable ? "unknown" : this._stateValue("station_status", "unknown"),
      composite: unreliable ? "unknown" : this._stateValue("composite_status", "unknown"),
      battery: !unreliable && Number.isFinite(rawBattery) ? Math.max(0, Math.min(100, rawBattery)) : null,
      age: this._stateValue("telemetry_age"),
      mode: unreliable ? null : this._stateValue("mode", attrs.mode ?? null),
      onDock: unreliable ? null : attrs.robot_on_dock,
      stationOperations: !unreliable && Array.isArray(attrs.station_operations) ? attrs.station_operations : [],
      missingStationDps: !unreliable && Array.isArray(attrs.missing_station_dps) ? attrs.missing_station_dps : [],
    };
  }

  _modeLabel(snap) {
    if (snap.unreliable) return "Нет данных";
    if (["charging", "charged"].includes(snap.robot)) return "На базе";
    return this._label(MODE_LABELS, snap.mode, "Нет данных");
  }

  async _call(domain, service, key, extra = {}) {
    const entityId = this._entityId(key);
    if (!entityId || !this._hass) return;
    await this._hass.callService(domain, service, { entity_id: entityId, ...extra });
  }
  _showMoreInfo(key) {
    const entityId = this._entityId(key);
    if (!entityId) return;
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
  }
  _toggleMenu() { this.dispatchEvent(new CustomEvent("hass-toggle-menu", { bubbles: true, composed: true })); }

  _styles() {
    return `
      :host{display:block;min-height:100vh;background:var(--primary-background-color);color:var(--primary-text-color);font-family:var(--ha-font-family-body,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif);overflow-x:hidden}
      *{box-sizing:border-box;min-width:0}button,input,select{font:inherit}button{-webkit-tap-highlight-color:transparent}h1,h2,h3,p{margin:0}
      main{min-height:100vh;padding-bottom:calc(82px + env(safe-area-inset-bottom))}
      .app-header{position:sticky;top:0;z-index:60;display:grid;grid-template-columns:48px minmax(0,1fr) 48px;align-items:center;gap:8px;min-height:calc(64px + env(safe-area-inset-top));padding:max(8px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) 8px max(12px,env(safe-area-inset-left));background:color-mix(in srgb,var(--primary-background-color) 97%,transparent);border-bottom:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);backdrop-filter:blur(18px) saturate(130%)}
      .header-action{width:48px;height:48px;border:0;border-radius:15px;display:grid;place-items:center;background:var(--card-background-color);color:var(--primary-text-color);box-shadow:0 3px 12px rgba(0,0,0,.07)}.header-action.refresh{color:var(--primary-color)}.header-action:disabled{opacity:.38}.header-action ha-icon{--mdc-icon-size:28px}.header-action.loading ha-icon{animation:spin .8s linear infinite}
      .header-title{text-align:center;display:flex;flex-direction:column;gap:2px;overflow:hidden}.header-title strong{font-size:22px;line-height:1.05;white-space:nowrap}.header-title span{color:var(--secondary-text-color);font-size:12px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .content{width:min(100%,900px);margin:0 auto;padding:12px 10px 18px}.card{background:var(--card-background-color);border:1px solid color-mix(in srgb,var(--divider-color) 72%,transparent);border-radius:22px;padding:15px;margin-bottom:12px;box-shadow:0 6px 18px rgba(0,0,0,.04)}.eyebrow{display:block;color:var(--secondary-text-color);font-size:11px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}
      .hero{position:relative;overflow:hidden;background:linear-gradient(135deg,var(--card-background-color) 62%,color-mix(in srgb,var(--primary-color) 7%,var(--card-background-color)) 100%)}.hero::after{content:"";position:absolute;width:205px;height:205px;right:-70px;top:-92px;border-radius:50%;background:color-mix(in srgb,var(--primary-color) 7%,transparent);pointer-events:none}.hero-top{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:start;gap:10px;position:relative;z-index:2}.hero h1{margin-top:5px;font-size:30px;line-height:1.02;letter-spacing:-.035em}.hero-hint{margin-top:6px;color:var(--secondary-text-color);font-size:13px;line-height:1.28}.connection-badge{display:inline-flex;align-items:center;gap:7px;min-height:34px;padding:0 11px;border-radius:999px;background:var(--secondary-background-color);color:var(--secondary-text-color);font-size:12px;font-weight:800;white-space:nowrap}.dot{width:8px;height:8px;border-radius:50%;background:var(--success-color,#43a047)}.connection-badge.bad .dot{background:var(--error-color,#db4437)}
      .omni-scene{position:relative;z-index:1;height:210px;margin-top:12px;border-radius:22px;border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);background:linear-gradient(145deg,#fcfdfe 0%,#f4f8fa 52%,#edf8fc 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.98);overflow:hidden}.omni-scene::before{content:"";position:absolute;left:12px;right:104px;bottom:7px;height:54px;border-radius:50%;background:radial-gradient(ellipse at center,rgba(183,194,201,.48) 0%,rgba(183,194,201,.13) 56%,rgba(183,194,201,0) 78%)}.omni-scene::after{content:"";position:absolute;right:-12px;top:-16px;width:174px;height:174px;border-radius:50%;background:radial-gradient(circle,#dff4fd 0%,rgba(223,244,253,0) 69%)}.omni-art{position:absolute;left:-2px;top:0;width:78%;height:100%;padding:0}.omni-art svg{width:100%;height:100%;display:block}.omni-legend{position:absolute;right:8px;top:18px;bottom:18px;width:24%;display:flex;flex-direction:column;justify-content:center;gap:6px;padding:8px 7px;border-radius:19px;background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(255,255,255,.88));box-shadow:0 10px 25px rgba(0,0,0,.055);backdrop-filter:blur(12px)}.legend-row{display:grid;grid-template-columns:23px 1fr;gap:6px;align-items:center;min-height:31px;padding:4px 3px;color:#70757a;font-size:10.5px;font-weight:760;line-height:1.12;border-radius:11px}.legend-row ha-icon{--mdc-icon-size:20px}.legend-row.active{color:var(--primary-text-color);background:rgba(255,255,255,.82);box-shadow:inset 0 0 0 1px rgba(0,0,0,.035)}.legend-row.water.active{background:#edf8ff}.legend-row.water.active ha-icon{color:#12a9e8}.legend-row.dust.active{background:#f2f4f5}.legend-row.dust.active ha-icon{color:#626c74}.legend-row.dry.active{background:#fff3e9}.legend-row.dry.active ha-icon{color:#f08f43}.legend-row.charge.active{background:#eefaf1;color:#2d9950}.legend-row.charge.active ha-icon{color:#32ad58}
      .hero-metrics{position:relative;z-index:2;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}.hero-metrics>div{min-height:68px;border-radius:18px;padding:10px;background:var(--secondary-background-color);overflow:hidden}.hero-metrics span{display:block;color:var(--secondary-text-color);font-size:10px;text-transform:uppercase;letter-spacing:.07em;white-space:nowrap}.hero-metrics strong{display:block;margin-top:4px;font-size:19px;line-height:1.05;white-space:nowrap}.battery-bar{height:4px;border-radius:999px;background:var(--divider-color);margin-top:8px;overflow:hidden}.battery-bar i{display:block;height:100%;border-radius:inherit;background:var(--primary-color)}
      .trust-banner{display:flex;gap:10px;padding:11px 13px;margin:0 0 10px;border-radius:17px;background:color-mix(in srgb,var(--error-color,#db4437) 9%,var(--card-background-color));border:1px solid color-mix(in srgb,var(--error-color,#db4437) 32%,transparent)}.trust-banner ha-icon{color:var(--error-color,#db4437);--mdc-icon-size:22px}.trust-banner strong{display:block;font-size:14px}.trust-banner span{display:block;color:var(--secondary-text-color);font-size:12px;margin-top:2px}
      .quick-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:11px}.action{min-height:94px;border:1px solid color-mix(in srgb,var(--divider-color) 80%,transparent);border-radius:22px;padding:8px 5px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;background:var(--card-background-color);color:var(--primary-text-color);text-align:center}.action.primary{background:var(--primary-color);color:var(--text-primary-color,white);border-color:transparent}.action:disabled{opacity:.34}.action.running{background:color-mix(in srgb,var(--primary-color) 15%,var(--card-background-color));color:var(--primary-color)}.action.running:disabled{opacity:1}.action-icon{width:50px;height:50px;border-radius:16px;display:grid;place-items:center;background:rgba(0,0,0,.09)}.action.primary .action-icon{background:rgba(0,0,0,.15)}.action-icon ha-icon{--mdc-icon-size:34px}.action strong{font-size:14px;line-height:1}.action .action-sub{font-size:11px;opacity:.72;white-space:nowrap}
      .statuses-card{padding:14px}.statuses-card>h2{font-size:24px;line-height:1;margin-bottom:12px;letter-spacing:-.02em}.status-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.status-card{min-height:100px;border:0;border-radius:18px;padding:10px 7px;background:var(--secondary-background-color);color:var(--primary-text-color);text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden}.status-icon{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:var(--card-background-color);color:var(--primary-color);margin-bottom:7px}.status-icon ha-icon{--mdc-icon-size:25px}.status-card strong{font-size:11px}.status-card b{display:block;margin-top:3px;font-size:14px;line-height:1.05;white-space:nowrap}.status-card span.meta{display:block;margin-top:3px;color:var(--secondary-text-color);font-size:10px;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%}.status-card.good b,.status-card.good .status-icon{color:var(--success-color,#43a047)}.status-card.warn b,.status-card.warn .status-icon{color:var(--error-color,#db4437)}
      .section-title{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}.section-title h2{font-size:24px}.metric-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.metric{min-height:108px;border-radius:20px;padding:14px;background:var(--secondary-background-color);display:grid;grid-template-columns:40px minmax(0,1fr);grid-template-rows:auto auto;align-content:center;column-gap:10px}.metric ha-icon{grid-row:1/span 2;align-self:center;color:var(--primary-color);--mdc-icon-size:28px}.metric span{color:var(--secondary-text-color);font-size:13px;align-self:end}.metric strong{font-size:21px;align-self:start}.profile-metric strong{font-size:19px;white-space:nowrap}
      .settings-entry{width:100%;min-height:82px;border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);border-radius:20px;padding:13px;display:grid;grid-template-columns:48px minmax(0,1fr) 24px;gap:10px;align-items:center;background:var(--card-background-color);color:var(--primary-text-color);text-align:left;margin-bottom:12px}.settings-entry .icon{width:48px;height:48px;border-radius:15px;display:grid;place-items:center;background:var(--secondary-background-color);color:var(--primary-color)}.settings-entry strong{display:block;font-size:16px}.settings-entry span span{display:block;margin-top:3px;color:var(--secondary-text-color);font-size:12px;line-height:1.25}
      .future-card{display:grid;grid-template-columns:46px minmax(0,1fr);gap:10px;padding:13px;margin-bottom:12px;border-radius:20px;border:1px dashed var(--divider-color)}.future-card .icon{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;background:var(--secondary-background-color);color:var(--secondary-text-color)}.future-card strong{font-size:15px}.future-card p{margin-top:3px;color:var(--secondary-text-color);font-size:12px;line-height:1.35}
      .segment-group{margin-bottom:16px}.segment-label{display:flex;justify-content:space-between;gap:10px;margin-bottom:8px}.segment-label strong{font-size:15px}.segment-label span{color:var(--secondary-text-color);font-size:12px}.segments{display:grid;gap:5px;padding:5px;border-radius:16px;background:var(--secondary-background-color)}.segments.three{grid-template-columns:repeat(3,1fr)}.segments.four{grid-template-columns:repeat(4,1fr)}.segment{min-height:42px;border:0;border-radius:12px;background:transparent;color:var(--secondary-text-color);font-size:11px;font-weight:750}.segment.active{background:var(--card-background-color);color:var(--primary-color);box-shadow:0 2px 8px rgba(0,0,0,.05)}
      .slider-row,.toggle-row,.info-row{padding:13px 0;border-top:1px solid var(--divider-color)}.slider-row:first-child,.toggle-row:first-child,.info-row:first-child{border-top:0}.slider-head,.toggle-row,.info-row{display:flex;justify-content:space-between;gap:12px;align-items:center}.slider-head strong,.toggle-row strong,.info-row strong{font-size:14px}.toggle-row small,.info-row span{color:var(--secondary-text-color);font-size:12px}input[type=range]{width:100%;margin-top:11px;accent-color:var(--primary-color)}.toggle-row{width:100%;border-left:0;border-right:0;border-bottom:0;background:transparent;color:var(--primary-text-color);text-align:left}.toggle{width:46px;height:27px;border-radius:999px;background:var(--disabled-color,#bdbdbd);padding:3px}.toggle::after{content:"";display:block;width:21px;height:21px;border-radius:50%;background:white;box-shadow:0 1px 5px rgba(0,0,0,.18)}.toggle.on{background:var(--primary-color)}.toggle.on::after{transform:translateX(19px)}
      .station-hero{display:grid;grid-template-columns:70px minmax(0,1fr);gap:12px;align-items:center;padding:12px 14px}.station-device{width:70px;height:84px;border-radius:19px;background:var(--secondary-background-color);border:1px solid var(--divider-color);display:grid;place-items:center;color:var(--primary-color)}.station-device ha-icon{--mdc-icon-size:34px}.station-hero h2{font-size:27px;margin-top:4px}.station-hero p{margin-top:5px;color:var(--secondary-text-color);font-size:12px}.station-summary-card{padding:8px 10px}.station-summary{display:grid;grid-template-columns:repeat(3,1fr)}.station-summary-item{min-height:50px;padding:6px 8px;border-left:1px solid var(--divider-color)}.station-summary-item:first-child{border-left:0}.station-summary-item span{color:var(--secondary-text-color);font-size:10px}.station-summary-item strong{display:block;margin-top:4px;font-size:15px}.operation-list{display:grid;gap:6px}.operation{min-height:58px;border-radius:16px;padding:8px 9px;background:var(--secondary-background-color);display:grid;grid-template-columns:40px minmax(0,1fr) 28px;gap:8px;align-items:center}.operation.active{background:color-mix(in srgb,var(--primary-color) 9%,var(--secondary-background-color))}.operation .icon{width:40px;height:40px;border-radius:13px;display:grid;place-items:center;background:var(--card-background-color);color:var(--primary-color)}.operation strong{font-size:14px}.operation span{display:block;color:var(--secondary-text-color);font-size:12px}.operation i{width:10px;height:10px;border-radius:50%;background:var(--divider-color)}.operation.active i{background:var(--primary-color);box-shadow:0 0 0 7px color-mix(in srgb,var(--primary-color) 12%,transparent)}
      .resource{min-height:88px;border-radius:20px;padding:13px;margin-bottom:9px;background:var(--card-background-color);border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);display:grid;grid-template-columns:52px minmax(0,1fr) auto;gap:11px;align-items:center}.resource .icon{width:52px;height:52px;border-radius:16px;display:grid;place-items:center;background:color-mix(in srgb,var(--primary-color) 11%,var(--secondary-background-color));color:var(--primary-color)}.resource strong{font-size:15px}.resource span{display:block;color:var(--secondary-text-color);font-size:12px}.resource b{font-size:19px;white-space:nowrap}
      .diagnostic-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;padding:11px;margin-bottom:12px;border:1px solid color-mix(in srgb,var(--success-color,#43a047) 42%,var(--divider-color));border-radius:20px}.diagnostic-strip span{display:block;color:var(--secondary-text-color);font-size:11px}.diagnostic-strip strong{display:block;margin-top:5px;font-size:14px}.info-row>span:first-child{color:var(--primary-text-color);font-size:13px}.info-row>strong{text-align:right;font-size:14px}
      .view-heading{padding:5px 4px 12px}.view-heading h2{font-size:27px;margin-top:4px}.view-heading p{color:var(--secondary-text-color);font-size:13px;margin-top:5px;line-height:1.3}.loading{min-height:55vh;display:grid;place-items:center;text-align:center;color:var(--secondary-text-color)}.loading ha-icon{--mdc-icon-size:50px;color:var(--primary-color)}
      nav{position:fixed;left:0;right:0;bottom:0;z-index:70;display:grid;grid-template-columns:repeat(5,1fr);gap:1px;padding:6px max(7px,env(safe-area-inset-right)) calc(6px + env(safe-area-inset-bottom)) max(7px,env(safe-area-inset-left));background:color-mix(in srgb,var(--card-background-color) 97%,transparent);border-top:1px solid color-mix(in srgb,var(--divider-color) 72%,transparent);box-shadow:0 -3px 14px rgba(0,0,0,.05);backdrop-filter:blur(18px) saturate(135%)}nav button{min-height:56px;border:0;border-radius:16px;background:transparent;color:var(--secondary-text-color);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:4px 2px}nav button ha-icon{--mdc-icon-size:24px}nav button span{font-size:11px;white-space:nowrap}nav button.active{background:color-mix(in srgb,var(--primary-color) 10%,transparent);color:var(--primary-color)}
      @keyframes spin{to{transform:rotate(360deg)}}
      @media(max-width:360px){.hero-top{grid-template-columns:1fr}.connection-badge{justify-self:start}.status-grid{grid-template-columns:repeat(2,1fr)}.segments.four{grid-template-columns:repeat(2,1fr)}.diagnostic-strip{grid-template-columns:1fr}.omni-legend{width:31%}.omni-art{width:67%}}
      @media(prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important;animation:none!important}}
    `;
  }

  _header() {
    const detail = this._detail === "cleaning-settings";
    return `<header class="app-header"><button class="header-action" type="button" data-header-primary aria-label="${detail ? "Назад" : "Меню"}"><ha-icon icon="${detail ? "mdi:arrow-left" : "mdi:menu"}"></ha-icon></button><div class="header-title"><strong>${detail ? "Настройки уборки" : "S8 OMNI"}</strong><span>${detail ? "S8 OMNI · Уборка" : `Робот-пылесос · UI ${UI_VERSION}`}</span></div><button class="header-action refresh" type="button" data-refresh aria-label="Обновить" ${this._entityId("refresh") ? "" : "disabled"}><ha-icon icon="mdi:refresh"></ha-icon></button></header>`;
  }

  _trustBanner(snap) {
    if (!snap.unreliable && snap.composite !== "unknown" && snap.composite !== "error") return "";
    const title = snap.connection === "disconnected" ? "S8 OMNI недоступен" : snap.connection === "unknown" ? "Связь не подтверждена" : snap.composite === "error" ? "Требуется внимание" : "Состояние не подтверждено";
    const text = snap.connection === "disconnected" ? "Последние данные сохранены только для диагностики." : snap.connection === "unknown" ? "Текущая локальная телеметрия пока не подтверждена." : snap.composite === "error" ? "Проверьте ошибку робота в Диагностике." : "Часть данных отсутствует или неизвестна.";
    return `<div class="trust-banner"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><div><strong>${title}</strong><span>${text}</span></div></div>`;
  }

  _heroHint(snap) {
    if (snap.connection === "disconnected") return "Нет актуальной локальной телеметрии";
    if (snap.connection === "unknown") return "Текущая связь с устройством не подтверждена";
    if (snap.robot === "charged") return "Робот на станции, заряд завершён";
    if (snap.robot === "charging") return "Робот на станции и заряжается";
    if (["cleaning", "zone_cleaning", "room_cleaning"].includes(snap.composite)) return "Выполняется уборка";
    if (snap.composite === "returning_to_dock") return "Робот возвращается на станцию";
    return "Робот и станция работают как единая система";
  }

  _hero() {
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

  _quickActions() {
    const snap = this._snapshot(); const vacuum = snap.vacuum;
    const available = snap.connected && this._available(vacuum);
    const cleaning = vacuum?.state === "cleaning"; const paused = vacuum?.state === "paused";
    const startClass = cleaning ? "action running" : "action primary"; const pauseClass = cleaning ? "action primary" : "action";
    const startTitle = cleaning ? "Уборка" : paused ? "Продолжить" : "Уборка";
    return `<div class="quick-actions"><button class="${startClass}" data-action="start" ${available && !cleaning ? "" : "disabled"}><span class="action-icon"><ha-icon icon="${cleaning ? "mdi:robot-vacuum" : "mdi:play"}"></ha-icon></span><strong>${startTitle}</strong><span class="action-sub">${cleaning ? "Идёт" : paused ? "Возобновить" : "Smart"}</span></button><button class="${pauseClass}" data-action="pause" ${available && cleaning ? "" : "disabled"}><span class="action-icon"><ha-icon icon="mdi:pause"></ha-icon></span><strong>Пауза</strong><span class="action-sub">${cleaning ? "Приостановить" : "Недоступно"}</span></button><button class="action" data-action="home" ${available ? "" : "disabled"}><span class="action-icon"><ha-icon icon="mdi:home-import-outline"></ha-icon></span><strong>Домой</strong><span class="action-sub">На станцию</span></button></div>`;
  }

  _overview() {
    const snap = this._snapshot();
    const robot = snap.unreliable ? "Нет данных" : this._label(ROBOT_LABELS, snap.robot, "Нет данных");
    const station = snap.unreliable ? "Нет данных" : this._label(STATION_LABELS, snap.station, "Нет данных");
    const robotContext = snap.unreliable ? "Нет данных" : snap.onDock === true ? "На базе" : snap.onDock === false ? "Не на базе" : "Позиция неизвестна";
    const operation = snap.unreliable ? "Нет данных" : snap.stationOperations.length ? snap.stationOperations.map((x) => STATION_OPERATION_LABELS[x] || x).join(" · ") : snap.missingStationDps.length ? "Часть данных" : "Нет операций";
    const conn = snap.connected ? "Локально" : snap.connection === "disconnected" ? "Нет связи" : "Неизвестно";
    const faultObj = this._state("fault");
    const faultRaw = snap.connected && this._available(faultObj) ? String(faultObj.state) : null;
    const faultOk = faultRaw === "0";
    const faultTitle = faultRaw === null ? "Нет данных" : faultOk ? "OK" : "Ошибка";
    const faultMeta = faultRaw === null ? "Недоступно" : faultOk ? "Ошибок нет" : `Код ${faultRaw}`;
    return `<div>${this._hero()}${this._trustBanner(snap)}${this._quickActions()}<section class="card statuses-card"><h2>Статусы</h2><div class="status-grid">
      <button class="status-card" data-more="robot_status" type="button"><span class="status-icon"><ha-icon icon="mdi:robot-vacuum"></ha-icon></span><strong>Робот</strong><b>${escapeHtml(robot)}</b><span class="meta">${escapeHtml(robotContext)}</span></button>
      <button class="status-card" data-more="station_status" type="button"><span class="status-icon"><ha-icon icon="mdi:home-automation"></ha-icon></span><strong>Станция</strong><b>${escapeHtml(station)}</b><span class="meta">${escapeHtml(operation)}</span></button>
      <button class="status-card ${snap.connected ? "good" : "warn"}" data-more="local_connection" type="button"><span class="status-icon"><ha-icon icon="mdi:lan-connect"></ha-icon></span><strong>Связь</strong><b>${escapeHtml(conn)}</b><span class="meta">${snap.age === null ? "—" : escapeHtml(this._formatDuration(snap.age))}</span></button>
      <button class="status-card ${faultOk ? "good" : faultRaw === null ? "" : "warn"}" data-more="fault" type="button"><span class="status-icon"><ha-icon icon="mdi:shield-check-outline"></ha-icon></span><strong>Система</strong><b>${escapeHtml(faultTitle)}</b><span class="meta">${escapeHtml(faultMeta)}</span></button>
    </div></section></div>`;
  }

  _cleaning() {
    const snap = this._snapshot();
    const cleanTime = snap.connected ? this._stateValue("clean_time") : null; const cleanArea = snap.connected ? this._stateValue("clean_area") : null;
    const suction = snap.connected ? this._label(SUCTION_LABELS, this._stateValue("suction"), "Нет данных") : "Нет данных";
    const water = snap.connected ? this._label(WATER_LABELS, this._stateValue("water"), "Нет данных") : "Нет данных";
    const volumeObj = this._state("volume"); const volumeValue = snap.connected && this._available(volumeObj) ? Number(volumeObj.state) : null;
    const dndObj = this._state("do_not_disturb"); const dnd = snap.connected && this._available(dndObj) ? (dndObj.state === "on" ? "Вкл" : "Выкл") : "Нет данных";
    return `${this._trustBanner(snap)}<section class="card"><div class="section-title"><h2>Текущая уборка</h2></div><div class="metric-grid"><div class="metric" data-more="clean_time"><ha-icon icon="mdi:timer-outline"></ha-icon><span>Время</span><strong>${cleanTime !== null ? `${escapeHtml(cleanTime)} мин` : "—"}</strong></div><div class="metric" data-more="clean_area"><ha-icon icon="mdi:ruler-square"></ha-icon><span>Площадь</span><strong>${cleanArea !== null ? `${escapeHtml(cleanArea)} м²` : "—"}</strong></div></div></section><section class="card"><div class="section-title"><h2>Как убирать</h2></div><div class="metric-grid"><div class="metric profile-metric" data-more="suction"><ha-icon icon="mdi:fan"></ha-icon><span>Всасывание</span><strong>${escapeHtml(suction)}</strong></div><div class="metric profile-metric" data-more="water"><ha-icon icon="mdi:water-outline"></ha-icon><span>Подача воды</span><strong>${escapeHtml(water)}</strong></div></div></section><button class="settings-entry" type="button" data-detail="cleaning-settings"><span class="icon"><ha-icon icon="mdi:tune-variant"></ha-icon></span><span><strong>Настроить уборку</strong><span>Громкость: ${Number.isFinite(volumeValue) ? `${Math.round(volumeValue)}%` : "Нет данных"} · Не беспокоить: ${escapeHtml(dnd)}</span></span><ha-icon icon="mdi:chevron-right"></ha-icon></button><section class="future-card"><span class="icon"><ha-icon icon="mdi:map-outline"></ha-icon></span><div><span class="eyebrow">Следующий этап</span><strong>Карта и комнаты</strong><p>Комнатная и зональная уборка появятся после завершения безопасной поддержки в интеграции.</p></div></section>`;
  }

  _segmentControl(key, labels, columns, title, hint) {
    const snap = this._snapshot(); const obj = this._state(key); const value = snap.connected && this._available(obj) ? obj.state : null;
    return `<div class="segment-group" data-more="${key}"><div class="segment-label"><strong>${title}</strong><span>${hint}</span></div><div class="segments ${columns}">${Object.entries(labels).map(([raw,label]) => `<button class="segment ${value === raw ? "active" : ""}" type="button" data-select-key="${key}" data-select-value="${raw}" ${value === null ? "disabled" : ""}>${label}</button>`).join("")}</div></div>`;
  }

  _cleaningSettings() {
    const snap = this._snapshot(); const volume = this._state("volume"); const dnd = this._state("do_not_disturb");
    const volumeValue = snap.connected && this._available(volume) ? Number(volume.state) : null; const dndUsable = snap.connected && this._available(dnd);
    return `${this._trustBanner(snap)}<section class="card"><div class="section-title"><div><span class="eyebrow">Уборка</span><h2>Параметры</h2></div></div>${this._segmentControl("suction",SUCTION_LABELS,"three","Мощность всасывания",this._label(SUCTION_LABELS,snap.connected ? this._stateValue("suction") : null,"Нет данных"))}${this._segmentControl("water",WATER_LABELS,"four","Количество воды",this._label(WATER_LABELS,snap.connected ? this._stateValue("water") : null,"Нет данных"))}</section><section class="card"><div class="section-title"><div><span class="eyebrow">Звук</span><h2>Громкость</h2></div></div><div class="slider-row"><div class="slider-head"><span><strong>Голосовые уведомления</strong></span><strong data-volume-label>${volumeValue === null ? "—" : `${Math.round(volumeValue)}%`}</strong></div><input type="range" min="0" max="100" step="1" value="${volumeValue === null ? 0 : volumeValue}" data-volume ${volumeValue === null ? "disabled" : ""}></div></section><section class="card"><div class="section-title"><div><span class="eyebrow">Поведение</span><h2>Автоматизация</h2></div></div><button class="toggle-row" type="button" data-toggle="do_not_disturb" ${dndUsable ? "" : "disabled"}><span><strong>Не беспокоить</strong><small>Переключатель режима без расписания.</small></span><span class="toggle ${dndUsable && dnd?.state === "on" ? "on" : ""}"></span></button></section>`;
  }

  _operation(key, label, icon, connected) {
    const obj = this._state(key); const usable = connected && this._available(obj); const active = usable && obj.state === "on";
    return `<div class="operation ${active ? "active" : ""}" data-more="${key}"><span class="icon"><ha-icon icon="${icon}"></ha-icon></span><span><strong>${label}</strong><span>${!usable ? "Нет данных" : active ? "Работает" : "Ожидание"}</span></span><i></i></div>`;
  }

  _station() {
    const snap = this._snapshot(); const station = snap.unreliable ? "Нет данных" : this._label(STATION_LABELS, snap.station, "Нет данных");
    const operation = snap.unreliable ? "Нет данных" : snap.stationOperations.length ? snap.stationOperations.map((x) => STATION_OPERATION_LABELS[x] || x).join(" · ") : "Ожидание";
    const robotPosition = snap.unreliable ? "Нет данных" : snap.onDock === true ? "На базе" : snap.onDock === false ? "Не на базе" : "Неизвестно";
    const charge = snap.battery === null ? "—" : `${Math.round(snap.battery)}%`;
    return `<div>${this._trustBanner(snap)}<section class="card station-hero" data-more="station_status"><div class="station-device"><ha-icon icon="mdi:home-automation"></ha-icon></div><div><span class="eyebrow">Станция S8 OMNI</span><h2>${escapeHtml(station)}</h2><p>${snap.unreliable ? "Нет подтверждённого текущего состояния станции." : `Текущая операция: ${escapeHtml(operation)}.`}</p></div></section><section class="card station-summary-card"><div class="station-summary"><div class="station-summary-item"><span>Робот</span><strong>${escapeHtml(robotPosition)}</strong></div><div class="station-summary-item"><span>Заряд</span><strong>${escapeHtml(charge)}</strong></div><div class="station-summary-item"><span>Операция</span><strong>${escapeHtml(operation)}</strong></div></div></section><section class="card"><div class="section-title"><h2>Операции станции</h2></div><div class="operation-list">${this._operation("dust_collection","Сбор пыли","mdi:delete-sweep-outline",snap.connected)}${this._operation("roller_cleaning","Промывка","mdi:waves",snap.connected)}${this._operation("roller_drying","Сушка","mdi:weather-windy",snap.connected)}</div></section><section class="future-card"><span class="icon"><ha-icon icon="mdi:shield-check-outline"></ha-icon></span><div><strong>Управление станцией</strong><p>Команды появятся после подтверждения публичного API интеграции.</p></div></section></div>`;
  }

  _resource(key, title, icon, connected) {
    return `<div class="resource" data-more="${key}"><span class="icon"><ha-icon icon="${icon}"></ha-icon></span><span><strong>${title}</strong><span>Остаточный ресурс от устройства</span></span><b>${escapeHtml(connected ? this._formatEntity(key,"—") : "—")}</b></div>`;
  }
  _maintenance() {
    const snap = this._snapshot(); const child = this._state("child_lock"); const childUsable = snap.connected && this._available(child);
    return `${this._trustBanner(snap)}<section class="view-heading"><span class="eyebrow">S8 OMNI</span><h2>Обслуживание</h2><p>Остаточный ресурс расходников.</p></section>${this._resource("filter_life","Фильтр","mdi:air-filter",snap.connected)}${this._resource("side_brush_life","Боковая щётка","mdi:fan",snap.connected)}${this._resource("main_brush_life","Основная щётка","mdi:brush",snap.connected)}<section class="card"><div class="section-title"><div><span class="eyebrow">Система</span><h2>Защита и ошибки</h2></div></div><div class="info-row" data-more="fault"><span>Ошибка</span><strong>${escapeHtml(snap.connected ? this._formatEntity("fault","—") : "—")}</strong></div><button class="toggle-row" type="button" data-toggle="child_lock" ${childUsable ? "" : "disabled"}><span><strong>Блокировка от детей</strong><small>Защита кнопок робота</small></span><span class="toggle ${childUsable && child?.state === "on" ? "on" : ""}"></span></button></section>`;
  }

  _diagRow(label, value) { return `<div class="info-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value === null || value === undefined ? "—" : String(value))}</strong></div>`; }
  _diagnostics() {
    const snap = this._snapshot(); const attrs = snap.attrs || {};
    const device = snap.connected ? "Доступно" : snap.connection === "disconnected" ? "Недоступно" : "Не подтверждено";
    return `<section class="view-heading"><span class="eyebrow">Технический экран</span><h2>Диагностика</h2><p>Нормализованные и raw-значения интеграции.</p></section><div class="diagnostic-strip"><div><span>Локальная связь</span><strong>${escapeHtml(this._connectionLabel())}</strong></div><div><span>Устройство</span><strong>${device}</strong></div><div><span>Возраст данных</span><strong>${snap.age === null ? "—" : escapeHtml(this._formatDuration(snap.age))}</strong></div></div><section class="card"><div class="section-title"><h2>Состояния</h2></div><div class="info-list">${this._diagRow("Composite",snap.connected ? this._stateValue("composite_status") : "unavailable")}${this._diagRow("Robot status",snap.connected ? this._stateValue("robot_status") : "unavailable")}${this._diagRow("Station status",snap.connected ? this._stateValue("station_status") : "unavailable")}${this._diagRow("Station DP отсутствуют",snap.connected && snap.missingStationDps.length ? snap.missingStationDps.join(", ") : snap.connected ? "Нет" : "—")}</div></section><section class="card"><div class="section-title"><h2>Tuya Raw</h2></div><div class="info-list">${this._diagRow("DP5 status",attrs.raw_status)}${this._diagRow("DP4 mode",attrs.mode)}${this._diagRow("DP1 power_go",attrs.power_go)}${this._diagRow("DP2 pause",attrs.pause)}${this._diagRow("DP28 fault",attrs.fault)}${this._diagRow("DP134 dp_dust",attrs.dp_dust)}${this._diagRow("DP135 dp_roll_clean",attrs.dp_roll_clean)}${this._diagRow("DP136 dp_roll_hot",attrs.dp_roll_hot)}</div></section><section class="card"><div class="section-title"><h2>Панель</h2></div><div class="info-list">${this._diagRow("Integration",this._panel?.config?.integration_version || "—")}${this._diagRow("Dashboard",UI_VERSION)}${this._diagRow("Bundle","standalone")}${this._diagRow("Route","/dashboard-s8-omni")}</div></section>`;
  }

  _body() {
    if (this._detail === "cleaning-settings") return this._cleaningSettings();
    if (this._view === "cleaning") return this._cleaning();
    if (this._view === "station") return this._station();
    if (this._view === "maintenance") return this._maintenance();
    if (this._view === "diagnostics") return this._diagnostics();
    return this._overview();
  }
  _nav() {
    const items = [["overview","mdi:home-outline","Обзор"],["cleaning","mdi:robot-vacuum","Уборка"],["station","mdi:home-automation","Станция"],["maintenance","mdi:tools","Сервис"],["diagnostics","mdi:stethoscope","Диагн."]];
    const active = this._detail ? "cleaning" : this._view;
    return `<nav>${items.map(([view,icon,label]) => `<button type="button" data-view="${view}" class="${active === view ? "active" : ""}"><ha-icon icon="${icon}"></ha-icon><span>${label}</span></button>`).join("")}</nav>`;
  }

  _bind() {
    this.shadowRoot.querySelector("[data-header-primary]")?.addEventListener("click", () => { if (this._detail) { this._detail = null; this._view = "cleaning"; this._queueRender(); } else this._toggleMenu(); });
    this.shadowRoot.querySelector("[data-refresh]")?.addEventListener("click", async (event) => { const b = event.currentTarget; if (!this._entityId("refresh") || b.disabled) return; b.disabled = true; b.classList.add("loading"); try { await this._call("button","press","refresh"); } finally { setTimeout(() => { b.disabled = false; b.classList.remove("loading"); }, 700); } });
    this.shadowRoot.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => { this._detail = null; this._view = b.dataset.view; this._queueRender(); }));
    this.shadowRoot.querySelectorAll("[data-detail]").forEach((b) => b.addEventListener("click", () => { this._detail = b.dataset.detail; this._view = "cleaning"; this._queueRender(); }));
    this.shadowRoot.querySelectorAll("[data-action]").forEach((b) => b.addEventListener("click", async () => { if (b.disabled || !this._snapshot().connected) return; b.disabled = true; try { if (b.dataset.action === "start") await this._call("vacuum","start","vacuum"); if (b.dataset.action === "pause") await this._call("vacuum","pause","vacuum"); if (b.dataset.action === "home") await this._call("vacuum","return_to_base","vacuum"); } finally { setTimeout(() => { b.disabled = false; }, 650); } }));
    this.shadowRoot.querySelectorAll("[data-select-key]").forEach((b) => b.addEventListener("click", async () => { if (b.disabled || !this._snapshot().connected) return; await this._call("select","select_option",b.dataset.selectKey,{ option: b.dataset.selectValue }); }));
    const volume = this.shadowRoot.querySelector("[data-volume]"); volume?.addEventListener("input", () => { const label = this.shadowRoot.querySelector("[data-volume-label]"); if (label) label.textContent = `${volume.value}%`; }); volume?.addEventListener("change", () => { if (this._snapshot().connected) this._call("number","set_value","volume",{ value: Number(volume.value) }); });
    this.shadowRoot.querySelectorAll("[data-toggle]").forEach((b) => b.addEventListener("click", () => { if (b.disabled || !this._snapshot().connected) return; const key = b.dataset.toggle; this._call("switch",this._state(key)?.state === "on" ? "turn_off" : "turn_on",key); }));
    this.shadowRoot.querySelectorAll("[data-more]").forEach((node) => { let timer = null; const cancel = () => { if (timer) clearTimeout(timer); timer = null; }; node.addEventListener("pointerdown", () => { cancel(); timer = setTimeout(() => { timer = null; this._showMoreInfo(node.dataset.more); }, 520); }); node.addEventListener("pointerup",cancel); node.addEventListener("pointercancel",cancel); node.addEventListener("pointerleave",cancel); });
  }

  _render() {
    if (!this.shadowRoot) return;
    if (!this._hass || !this._panel || this._registryLoading || !this._registryLoaded) {
      this.shadowRoot.innerHTML = `<style>${this._styles()}</style><main>${this._header()}<div class="content"><div class="loading"><div><ha-icon icon="mdi:robot-vacuum"></ha-icon><p>Подключаем интерфейс…</p></div></div></div>${this._nav()}</main>`; this._bind(); return;
    }
    if (this._registryError) {
      this.shadowRoot.innerHTML = `<style>${this._styles()}</style><main>${this._header()}<div class="content"><div class="trust-banner"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><div><strong>Не удалось загрузить реестр сущностей</strong><span>${escapeHtml(this._registryError)}</span></div></div></div>${this._nav()}</main>`; this._bind(); return;
    }
    this.shadowRoot.innerHTML = `<style>${this._styles()}</style><main>${this._header()}<div class="content">${this._body()}</div>${this._nav()}</main>`;
    this._bind();
  }
}

if (!customElements.get("s8-omni-panel")) customElements.define("s8-omni-panel", S8OmniPanel);
