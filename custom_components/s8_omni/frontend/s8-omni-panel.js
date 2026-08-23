const UI_VERSION = "v0.6.0";

const ROBOT_LABELS = {
  idle: "Ожидание",
  cleaning: "Уборка",
  zone_cleaning: "Зона",
  room_cleaning: "Комнаты",
  paused: "Пауза",
  going_to_position: "К точке",
  position_reached: "У точки",
  position_not_reached: "Нет позиции",
  returning_to_dock: "Возврат",
  charging: "Зарядка",
  charged: "Заряжен",
  sleeping: "Сон",
  error: "Ошибка",
  wall_following: "Вдоль стен",
  manual_control: "Вручную",
  repositioning: "Поиск позиции",
  creating_map: "Карта",
  unknown: "Нет данных",
};

const STATION_LABELS = {
  idle: "Ожидание",
  dust_collection: "Сбор пыли",
  roller_cleaning: "Промывка",
  drying: "Сушка",
  multiple_operations: "Несколько",
  unknown: "Нет данных",
};

const COMPOSITE_LABELS = {
  idle: "Готов к уборке",
  cleaning: "Уборка",
  zone_cleaning: "Зона",
  room_cleaning: "Комнаты",
  paused: "Пауза",
  returning_to_dock: "Возврат",
  charging: "Зарядка",
  charged: "На базе · Заряжен",
  sleeping: "Сон",
  repositioning: "Поиск позиции",
  docked_dust_collection: "На базе · Сбор пыли",
  docked_roller_cleaning: "На базе · Промывка",
  docked_drying: "На базе · Сушка",
  docked_station_active: "На базе · Станция активна",
  error: "Требуется внимание",
  unknown: "Нет данных",
};

const MODE_LABELS = {
  smart: "Smart",
  zone: "Зона",
  pose: "Точка",
  part: "Частичная",
  chargego: "Возврат",
  wallfollow: "Вдоль стен",
  selectroom: "Комнаты",
};

const SUCTION_LABELS = { gentle: "Тихий", normal: "Нормальный", strong: "Сильный" };
const WATER_LABELS = { closed: "Закрыто", low: "Низкий", normal: "Средний", high: "Высокий" };

const ENTITY_SUFFIXES = [
  "vacuum",
  "battery",
  "clean_time",
  "clean_area",
  "side_brush_life",
  "main_brush_life",
  "filter_life",
  "fault",
  "work_mode",
  "raw_status",
  "robot_status",
  "station_status",
  "composite_status",
  "last_telemetry",
  "telemetry_age",
  "local_connection",
  "dust_collection",
  "roller_cleaning",
  "roller_drying",
  "custom_mode",
  "resume_cleaning",
  "do_not_disturb",
  "child_lock",
  "mode",
  "suction",
  "water",
  "volume",
  "refresh",
];

const STATION_OPERATION_LABELS = {
  dust_collection: "Сбор пыли",
  roller_cleaning: "Промывка",
  drying: "Сушка",
};

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

  set hass(value) {
    this._hass = value;
    this._ensureRegistry();
    this._queueRender();
  }

  get hass() {
    return this._hass;
  }

  set panel(value) {
    this._panel = value;
    this._ensureRegistry();
    this._queueRender();
  }

  set narrow(_value) {}

  connectedCallback() {
    this._queueRender();
  }

  _queueRender() {
    if (this._renderQueued) return;
    this._renderQueued = true;
    requestAnimationFrame(() => {
      this._renderQueued = false;
      this._render();
    });
  }

  async _ensureRegistry() {
    if (!this._hass || !this._panel || this._registryLoading) return;
    const entryId = this._panel?.config?.entry_id;
    if (!entryId) return;
    if (this._registryLoaded && Object.keys(this._entities).length) return;

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

  _entityId(key) {
    return this._entities[key] || null;
  }

  _state(key) {
    const entityId = this._entityId(key);
    return entityId && this._hass ? this._hass.states[entityId] : null;
  }

  _available(stateObj) {
    return Boolean(stateObj && stateObj.state !== "unavailable" && stateObj.state !== "unknown" && stateObj.state !== "none");
  }

  _stateValue(key, fallback = null) {
    const stateObj = this._state(key);
    return this._available(stateObj) ? stateObj.state : fallback;
  }

  _numeric(key) {
    const value = Number(this._stateValue(key));
    return Number.isFinite(value) ? value : null;
  }

  _label(map, value, fallback = "Нет данных") {
    if (value === null || value === undefined || value === "unavailable") return fallback;
    if (value === "unknown") return map.unknown || "Неизвестно";
    return map[value] || String(value);
  }

  _formatDuration(seconds) {
    const value = Number(seconds);
    if (!Number.isFinite(value)) return "Нет данных";
    if (value < 60) return `${Math.max(0, Math.round(value))} с`;
    const minutes = Math.floor(value / 60);
    const rest = Math.round(value % 60);
    return rest ? `${minutes} мин ${rest} с` : `${minutes} мин`;
  }

  _formatEntity(key, fallback = "Нет данных") {
    const stateObj = this._state(key);
    if (!stateObj) return fallback;
    if (stateObj.state === "unavailable") return "Недоступно";
    if (stateObj.state === "unknown") return "Неизвестно";
    const unit = stateObj.attributes?.unit_of_measurement;
    const shownUnit = unit === "min" ? "мин" : unit;
    return shownUnit ? `${stateObj.state} ${shownUnit}` : stateObj.state;
  }

  _connectionState() {
    const stateObj = this._state("local_connection");
    if (!stateObj || stateObj.state === "unknown" || stateObj.state === "unavailable") return "unknown";
    return stateObj.state === "on" ? "connected" : "disconnected";
  }

  _snapshot() {
    const vacuum = this._state("vacuum");
    const compositeObj = this._state("composite_status");
    const attrs = compositeObj?.attributes || {};
    const connection = this._connectionState();
    const vacuumUnavailable = !vacuum || vacuum.state === "unavailable";
    const unavailable = connection === "disconnected" || vacuumUnavailable;
    const unreliable = unavailable || connection === "unknown";
    const robot = unreliable ? "unknown" : this._stateValue("robot_status", "unknown");
    const station = unreliable ? "unknown" : this._stateValue("station_status", "unknown");
    const composite = unreliable ? "unknown" : this._stateValue("composite_status", "unknown");
    const rawBattery = this._numeric("battery") ?? Number(vacuum?.attributes?.battery_level);
    const batteryValue = !unreliable && Number.isFinite(rawBattery) ? Math.max(0, Math.min(100, rawBattery)) : null;
    const stationOperations = !unreliable && Array.isArray(attrs.station_operations) ? attrs.station_operations : [];
    return {
      vacuum, compositeObj, attrs, connection,
      connected: connection === "connected",
      unavailable, unreliable, robot, station, composite,
      battery: batteryValue,
      age: this._stateValue("telemetry_age"),
      mode: unreliable ? null : this._stateValue("mode", attrs.mode ?? null),
      onDock: unreliable ? null : attrs.robot_on_dock,
      stationOperations,
      missingStationDps: !unreliable && Array.isArray(attrs.missing_station_dps) ? attrs.missing_station_dps : [],
    };
  }

  _connectionLabel() {
    const state = this._connectionState();
    if (state === "connected") return "Локально";
    if (state === "disconnected") return "Нет связи";
    return "Связь неизвестна";
  }

  _modeLabel(snap) {
    if (snap.unreliable) return "Нет данных";
    if (snap.robot === "charging" || snap.robot === "charged") return "На базе";
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

  _navigate(path) {
    if (!path) return;
    window.history.pushState(null, "", path);
    window.dispatchEvent(new CustomEvent("location-changed"));
  }

  _toggleMenu() {
    this.dispatchEvent(new CustomEvent("hass-toggle-menu", { bubbles: true, composed: true }));
  }

  _styles() {
    return `
      :host { display:block; min-height:100vh; background:var(--primary-background-color); color:var(--primary-text-color); font-family:var(--ha-font-family-body,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif); overflow-x:hidden; }
      * { box-sizing:border-box; min-width:0; }
      button,input,select { font:inherit; }
      button { -webkit-tap-highlight-color:transparent; }
      main { min-height:100vh; padding-bottom:calc(88px + env(safe-area-inset-bottom)); }
      .app-header { position:sticky; top:0; z-index:60; display:grid; grid-template-columns:52px minmax(0,1fr) 52px; align-items:center; gap:10px; min-height:calc(70px + env(safe-area-inset-top)); padding:max(9px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) 9px max(16px,env(safe-area-inset-left)); background:color-mix(in srgb,var(--primary-background-color) 96%,transparent); border-bottom:1px solid color-mix(in srgb,var(--divider-color) 72%,transparent); backdrop-filter:blur(18px) saturate(130%); -webkit-backdrop-filter:blur(18px) saturate(130%); }
      .header-action { width:52px; height:52px; min-width:44px; min-height:44px; border:0; border-radius:16px; display:grid; place-items:center; background:var(--card-background-color); color:var(--primary-text-color); box-shadow:var(--ha-card-box-shadow,0 3px 12px rgba(0,0,0,.07)); }
      .header-action.refresh { color:var(--primary-color); }
      .header-action:active { transform:scale(.97); }
      .header-action:disabled { opacity:.38; }
      .header-action ha-icon { --mdc-icon-size:29px; }
      .header-action.loading ha-icon { animation:spin .8s linear infinite; }
      .header-title { text-align:center; display:flex; flex-direction:column; gap:2px; overflow:hidden; }
      .header-title strong { font-size:23px; line-height:1.08; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .header-title span { color:var(--secondary-text-color); font-size:13px; font-weight:650; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .content { width:min(100%,920px); margin:0 auto; padding:14px 12px 24px; }
      .card { background:var(--card-background-color); border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent); border-radius:24px; padding:18px; margin-bottom:14px; box-shadow:0 7px 22px rgba(0,0,0,.045); }
      .eyebrow { display:block; color:var(--secondary-text-color); font-size:12px; font-weight:800; letter-spacing:.13em; text-transform:uppercase; }
      h1,h2,h3,p { margin:0; }
      .hero { position:relative; overflow:hidden; background:linear-gradient(135deg,var(--card-background-color) 58%,color-mix(in srgb,var(--primary-color) 9%,var(--card-background-color)) 100%); }
      .hero::after { content:""; position:absolute; width:230px; height:230px; right:-75px; top:-105px; border-radius:50%; background:color-mix(in srgb,var(--primary-color) 8%,transparent); pointer-events:none; }
      .hero-top { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:start; gap:12px; position:relative; z-index:1; }
      .hero h1 { margin-top:5px; font-size:clamp(30px,7vw,40px); line-height:1.04; letter-spacing:-.03em; overflow-wrap:normal; word-break:normal; }
      .hero-hint { margin-top:8px; color:var(--secondary-text-color); font-size:15px; line-height:1.3; }
      .connection-badge { display:inline-flex; align-items:center; gap:7px; min-height:36px; padding:0 12px; border-radius:999px; background:var(--secondary-background-color); color:var(--secondary-text-color); font-size:13px; font-weight:800; white-space:nowrap; }
      .dot { width:8px; height:8px; border-radius:50%; background:var(--success-color,#43a047); }
      .connection-badge.bad .dot { background:var(--error-color,#db4437); }
      .scene { position:relative; z-index:1; height:166px; margin-top:15px; border-radius:22px; border:1px solid color-mix(in srgb,var(--divider-color) 80%,transparent); background:color-mix(in srgb,var(--secondary-background-color) 72%,transparent); overflow:hidden; }
      .scene-label { position:absolute; top:15px; font-size:12px; letter-spacing:.13em; text-transform:uppercase; color:var(--secondary-text-color); white-space:nowrap; }
      .scene-label.robot { left:16px; }
      .scene-label.station { right:108px; text-align:right; }
      .scene-state { position:absolute; top:36px; max-width:40%; font-size:16px; font-weight:800; line-height:1.12; overflow-wrap:normal; word-break:normal; hyphens:none; }
      .scene-state.robot { left:16px; }
      .scene-state.station { right:108px; text-align:right; white-space:nowrap; }
      .track { position:absolute; left:14%; right:23%; top:70%; border-top:2px dashed color-mix(in srgb,var(--secondary-text-color) 24%,transparent); }
      .track::before { content:""; position:absolute; left:0; top:-5px; width:8px; height:8px; border-radius:50%; background:color-mix(in srgb,var(--primary-color) 55%,white); }
      .dock { position:absolute; right:8%; bottom:23px; width:64px; height:82px; border-radius:16px 16px 20px 20px; background:color-mix(in srgb,var(--secondary-background-color) 90%,var(--primary-text-color) 10%); border:1px solid var(--divider-color); display:grid; place-items:center; color:var(--secondary-text-color); }
      .dock ha-icon { --mdc-icon-size:31px; }
      .robot-orb { position:absolute; right:15%; bottom:17px; width:84px; height:84px; border-radius:50%; background:var(--card-background-color); border:1px solid var(--divider-color); box-shadow:0 9px 20px rgba(0,0,0,.08); display:grid; place-items:center; color:var(--primary-color); }
      .robot-orb.away { right:auto; left:33%; }
      .robot-orb ha-icon { --mdc-icon-size:43px; }
      .hero-metrics { position:relative; z-index:1; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-top:13px; }
      .hero-metrics>div { min-height:82px; border-radius:19px; padding:12px; background:var(--secondary-background-color); overflow:hidden; }
      .hero-metrics span { display:block; color:var(--secondary-text-color); font-size:12px; text-transform:uppercase; letter-spacing:.08em; white-space:nowrap; }
      .hero-metrics strong { display:block; margin-top:5px; font-size:21px; line-height:1.1; overflow-wrap:normal; word-break:normal; hyphens:none; }
      .battery-bar { height:5px; border-radius:999px; background:var(--divider-color); margin-top:10px; overflow:hidden; }
      .battery-bar i { display:block; height:100%; border-radius:inherit; background:var(--primary-color); }
      .trust-banner { display:flex; gap:11px; align-items:flex-start; padding:12px 14px; margin:0 0 12px; border-radius:18px; background:color-mix(in srgb,var(--error-color,#db4437) 10%,var(--card-background-color)); border:1px solid color-mix(in srgb,var(--error-color,#db4437) 35%,transparent); }
      .trust-banner ha-icon { color:var(--error-color,#db4437); --mdc-icon-size:23px; }
      .trust-banner strong { display:block; font-size:15px; }
      .trust-banner span { display:block; color:var(--secondary-text-color); font-size:13px; margin-top:3px; }
      .quick-actions { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-bottom:14px; }
      .action { min-height:112px; border:1px solid color-mix(in srgb,var(--divider-color) 82%,transparent); border-radius:24px; padding:10px 7px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; background:var(--card-background-color); color:var(--primary-text-color); text-align:center; overflow:hidden; }
      .action.primary { background:var(--primary-color); color:var(--text-primary-color,white); border-color:transparent; }
      .action:disabled { opacity:.34; }
      .action.running { background:color-mix(in srgb,var(--primary-color) 16%,var(--card-background-color)); color:var(--primary-color); border-color:color-mix(in srgb,var(--primary-color) 28%,var(--divider-color)); }
      .action.running:disabled { opacity:1; }
      .action-icon { width:60px; height:60px; flex:0 0 60px; border-radius:19px; display:grid; place-items:center; background:rgba(0,0,0,.10); box-shadow:inset 0 0 0 1px color-mix(in srgb,currentColor 9%,transparent); }
      .action.primary .action-icon { background:rgba(0,0,0,.17); }
      .action.running .action-icon { background:color-mix(in srgb,var(--primary-color) 18%,var(--secondary-background-color)); }
      .action-icon ha-icon { --mdc-icon-size:42px; }
      .action strong { display:block; font-size:16px; line-height:1.06; white-space:nowrap; }
      .action .action-sub { display:block; font-size:12px; opacity:.75; line-height:1.1; white-space:nowrap; }
      .statuses-card { padding:17px 18px 18px; }
      .statuses-card>h2 { font-size:25px; line-height:1.05; margin-bottom:14px; letter-spacing:-.015em; }
      .status-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
      .status-card { min-height:112px; border:0; border-radius:22px; padding:14px; background:var(--secondary-background-color); color:var(--primary-text-color); text-align:left; display:grid; grid-template-columns:48px minmax(0,1fr); gap:12px; align-items:center; overflow:hidden; }
      .status-icon { width:48px; height:48px; border-radius:16px; display:grid; place-items:center; background:var(--card-background-color); color:var(--primary-color); }
      .status-icon ha-icon { --mdc-icon-size:28px; }
      .status-copy strong { display:block; font-size:15px; line-height:1.08; }
      .status-copy b { display:block; margin-top:4px; font-size:19px; line-height:1.1; overflow-wrap:normal; word-break:normal; hyphens:none; }
      .status-copy span { display:block; margin-top:4px; color:var(--secondary-text-color); font-size:13px; line-height:1.25; overflow-wrap:normal; word-break:normal; }
      .section-title { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:14px; }
      .section-title h2 { margin-top:3px; font-size:25px; letter-spacing:-.015em; }
      .metric-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
      .metric { min-height:122px; border-radius:22px; padding:16px; background:var(--secondary-background-color); display:grid; grid-template-columns:44px minmax(0,1fr); grid-template-rows:auto auto; align-content:center; column-gap:11px; overflow:hidden; }
      .metric ha-icon { grid-row:1/span 2; align-self:center; color:var(--primary-color); --mdc-icon-size:31px; }
      .metric span { color:var(--secondary-text-color); font-size:14px; align-self:end; }
      .metric strong { font-size:22px; align-self:start; overflow-wrap:normal; word-break:normal; hyphens:none; }
      .profile-metric { grid-template-columns:36px minmax(0,1fr); column-gap:9px; }
      .profile-metric ha-icon { --mdc-icon-size:28px; }
      .profile-metric strong { font-size:20px; white-space:nowrap; }
      .drill-entry,.settings-entry { width:100%; min-height:90px; border:0; border-radius:22px; padding:15px; display:grid; grid-template-columns:52px minmax(0,1fr) 26px; gap:12px; align-items:center; background:var(--secondary-background-color); color:var(--primary-text-color); text-align:left; }
      .settings-entry { margin:0 0 14px; background:var(--card-background-color); border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent); box-shadow:0 7px 22px rgba(0,0,0,.045); }
      .drill-entry .icon,.settings-entry .icon { width:52px; height:52px; border-radius:17px; display:grid; place-items:center; background:var(--card-background-color); color:var(--primary-color); }
      .settings-entry .icon { background:var(--secondary-background-color); }
      .drill-entry strong,.settings-entry strong { display:block; font-size:17px; line-height:1.24; }
      .drill-entry span,.settings-entry span { display:block; margin-top:4px; color:var(--secondary-text-color); font-size:13px; line-height:1.32; }
      .future-card { display:grid; grid-template-columns:50px minmax(0,1fr); gap:12px; padding:15px; margin-bottom:14px; border-radius:22px; border:1px dashed var(--divider-color); }
      .future-card .icon { width:50px; height:50px; border-radius:16px; display:grid; place-items:center; background:var(--secondary-background-color); color:var(--secondary-text-color); }
      .future-card strong { display:block; font-size:16px; } .future-card p { margin-top:4px; color:var(--secondary-text-color); font-size:13px; line-height:1.4; }
      .segment-group { margin-bottom:18px; } .segment-label { display:flex; justify-content:space-between; align-items:baseline; gap:10px; margin-bottom:9px; }
      .segment-label strong { font-size:16px; } .segment-label span { color:var(--secondary-text-color); font-size:13px; }
      .segments { display:grid; gap:6px; padding:5px; border-radius:17px; background:var(--secondary-background-color); }
      .segments.three { grid-template-columns:repeat(3,minmax(0,1fr)); } .segments.four { grid-template-columns:repeat(4,minmax(0,1fr)); }
      .segment { min-height:44px; border:0; border-radius:13px; background:transparent; color:var(--secondary-text-color); font-size:12px; font-weight:750; padding:5px; }
      .segment.active { background:var(--card-background-color); color:var(--primary-color); box-shadow:0 2px 8px rgba(0,0,0,.05); }
      .slider-row,.toggle-row,.info-row { padding:14px 0; border-top:1px solid var(--divider-color); }
      .slider-row:first-child,.toggle-row:first-child,.info-row:first-child { border-top:0; }
      .slider-head,.toggle-row,.info-row { display:flex; justify-content:space-between; gap:14px; align-items:center; }
      .toggle-row>span:first-child { display:flex; flex-direction:column; gap:4px; min-width:0; }
      .slider-head strong,.toggle-row strong,.info-row strong { font-size:15px; }
      .toggle-row strong,.toggle-row small { display:block; }
      .slider-head span,.toggle-row small,.info-row span { color:var(--secondary-text-color); font-size:13px; }
      input[type=range] { width:100%; margin-top:12px; accent-color:var(--primary-color); }
      .toggle-row { width:100%; border-left:0; border-right:0; border-bottom:0; background:transparent; color:var(--primary-text-color); text-align:left; }
      .toggle { width:48px; height:28px; border-radius:999px; background:var(--disabled-color,#bdbdbd); padding:3px; flex:0 0 auto; }
      .toggle::after { content:""; display:block; width:22px; height:22px; border-radius:50%; background:white; transition:transform .18s ease; box-shadow:0 1px 5px rgba(0,0,0,.18); }
      .toggle.on { background:var(--primary-color); } .toggle.on::after { transform:translateX(20px); }
      .station-hero { display:grid; grid-template-columns:92px minmax(0,1fr); gap:16px; align-items:center; }
      .station-device { width:92px; height:122px; border-radius:24px; background:var(--secondary-background-color); border:1px solid var(--divider-color); display:grid; place-items:center; color:var(--primary-color); }
      .station-device ha-icon { --mdc-icon-size:42px; }
      .station-hero h2 { font-size:32px; line-height:1.05; margin-top:6px; overflow-wrap:normal; word-break:normal; }
      .station-hero p { margin-top:9px; color:var(--secondary-text-color); font-size:14px; line-height:1.38; }
      .operation-list { display:grid; gap:9px; }
      .operation { min-height:74px; border-radius:20px; padding:12px; background:var(--secondary-background-color); display:grid; grid-template-columns:48px minmax(0,1fr) 34px; gap:12px; align-items:center; border:1px solid transparent; }
      .operation.active { background:color-mix(in srgb,var(--primary-color) 9%,var(--secondary-background-color)); border-color:color-mix(in srgb,var(--primary-color) 24%,transparent); }
      .operation .icon { width:48px; height:48px; border-radius:16px; display:grid; place-items:center; background:var(--card-background-color); color:var(--primary-color); }
      .operation strong { display:block; font-size:15px; }
      .operation span { display:block; margin-top:3px; color:var(--secondary-text-color); font-size:13px; }
      .operation i { width:10px; height:10px; justify-self:center; border-radius:50%; background:var(--divider-color); position:relative; }
      .operation.active i { width:28px; height:28px; background:color-mix(in srgb,var(--primary-color) 18%,transparent); border:2px solid color-mix(in srgb,var(--primary-color) 34%,transparent); box-shadow:0 0 0 4px color-mix(in srgb,var(--primary-color) 8%,transparent); }
      .operation.active i::after { content:""; position:absolute; inset:7px; border-radius:50%; background:var(--primary-color); }
      .resource { min-height:98px; border-radius:22px; padding:15px; margin-bottom:10px; background:var(--card-background-color); border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent); display:grid; grid-template-columns:58px minmax(0,1fr) auto; gap:13px; align-items:center; }
      .resource .icon { width:58px; height:58px; border-radius:18px; display:grid; place-items:center; background:color-mix(in srgb,var(--primary-color) 12%,var(--secondary-background-color)); color:var(--primary-color); }
      .resource strong { font-size:16px; }
      .resource span { display:block; margin-top:4px; color:var(--secondary-text-color); font-size:13px; }
      .resource b { font-size:21px; white-space:nowrap; }
      .diagnostic-strip { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; padding:13px; margin-bottom:14px; border:1px solid color-mix(in srgb,var(--success-color,#43a047) 45%,var(--divider-color)); border-radius:22px; }
      .diagnostic-strip span { display:block; color:var(--secondary-text-color); font-size:12px; }
      .diagnostic-strip strong { display:block; margin-top:6px; font-size:15px; overflow-wrap:normal; word-break:normal; }
      .info-list { margin-top:3px; }
      .info-row>span:first-child { color:var(--primary-text-color); font-size:14px; }
      .info-row>strong { text-align:right; font-size:15px; overflow-wrap:normal; word-break:normal; }
      nav { position:fixed; left:0; right:0; bottom:0; z-index:70; display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:1px; padding:7px max(7px,env(safe-area-inset-right)) calc(7px + env(safe-area-inset-bottom)) max(7px,env(safe-area-inset-left)); background:color-mix(in srgb,var(--card-background-color) 97%,transparent); border-top:1px solid color-mix(in srgb,var(--divider-color) 72%,transparent); box-shadow:0 -3px 14px rgba(0,0,0,.055); backdrop-filter:blur(18px) saturate(135%); -webkit-backdrop-filter:blur(18px) saturate(135%); }
      nav button { min-height:58px; border:0; border-radius:17px; background:transparent; color:var(--secondary-text-color); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; padding:5px 2px; overflow:hidden; }
      nav button ha-icon { --mdc-icon-size:25px; }
      nav button span { font-size:12px; max-width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      nav button.active { background:color-mix(in srgb,var(--primary-color) 10%,transparent); color:var(--primary-color); }
      .loading { min-height:56vh; display:grid; place-items:center; text-align:center; color:var(--secondary-text-color); }
      .loading ha-icon { --mdc-icon-size:52px; color:var(--primary-color); }
      .view-heading { padding:6px 5px 14px; }
      .view-heading h2 { font-size:30px; margin-top:5px; letter-spacing:-.02em; }
      .view-heading p { color:var(--secondary-text-color); font-size:15px; margin-top:6px; line-height:1.35; }
      @keyframes spin { to { transform:rotate(360deg); } }
      @media (max-width:430px) {
        main { padding-bottom:calc(82px + env(safe-area-inset-bottom)); }
        .app-header { grid-template-columns:48px minmax(0,1fr) 48px; gap:8px; min-height:calc(68px + env(safe-area-inset-top)); padding-left:max(10px,env(safe-area-inset-left)); padding-right:max(10px,env(safe-area-inset-right)); }
        .header-action { width:48px; height:48px; border-radius:15px; }
        .header-title strong { font-size:21px; }
        .header-title span { font-size:12px; }
        .content { padding:12px 10px 20px; }
        .card { border-radius:22px; padding:17px; margin-bottom:12px; }
        .hero { padding:17px; }
        .hero h1 { font-size:31px; }
        .hero-hint { font-size:14px; }
        .connection-badge { min-height:34px; padding:0 11px; font-size:12px; }
        .scene { height:154px; margin-top:13px; }
        .scene-label.station,.scene-state.station { right:98px; }
        .hero-metrics { gap:9px; margin-top:11px; }
        .hero-metrics>div { min-height:76px; padding:11px; }
        .hero-metrics span { font-size:11px; }
        .hero-metrics strong { font-size:20px; }
        .action { min-height:108px; border-radius:22px; }
        .action-icon { width:60px; height:60px; flex-basis:60px; }
        .action-icon ha-icon { --mdc-icon-size:42px; }
        .action strong { font-size:15px; }
        .action .action-sub { font-size:12px; }
        .statuses-card { padding:15px 16px 16px; }
        .statuses-card>h2 { font-size:24px; margin-bottom:12px; }
        .status-card { min-height:108px; grid-template-columns:46px minmax(0,1fr); gap:10px; padding:12px; }
        .status-icon { width:46px; height:46px; border-radius:15px; }
        .status-icon ha-icon { --mdc-icon-size:27px; }
        .status-copy strong { font-size:14px; }
        .status-copy b { font-size:18px; }
        .status-copy span { font-size:12px; }
        .metric { min-height:116px; padding:15px; }
        .metric strong { font-size:22px; }
        .profile-metric { grid-template-columns:34px minmax(0,1fr); gap:8px; }
        .profile-metric strong { font-size:19px; }
        .view-heading h2 { font-size:28px; }
        .view-heading p { font-size:14px; }
        .station-hero h2 { font-size:30px; }
      }
      @media (max-width:360px) {
        .header-title strong { font-size:20px; }
        .header-title span { font-size:11px; }
        .hero-top { grid-template-columns:1fr; }
        .connection-badge { justify-self:start; }
        .hero-metrics { grid-template-columns:1fr 1fr; }
        .hero-metrics>div:last-child { grid-column:1/-1; }
        .quick-actions { gap:6px; }
        .action { min-height:104px; padding-left:3px; padding-right:3px; }
        .action-icon { width:54px; height:54px; flex-basis:54px; }
        .action-icon ha-icon { --mdc-icon-size:38px; }
        .action strong { font-size:13px; }
        .action .action-sub { display:none; }
        .status-grid { grid-template-columns:1fr; }
        .segments.four { grid-template-columns:repeat(2,1fr); }
        .diagnostic-strip { grid-template-columns:1fr; }
      }
      @media (prefers-reduced-motion:reduce) { *,*::before,*::after { scroll-behavior:auto !important; transition:none !important; animation:none !important; } }
    `;
  }

  _header() {
    const isDetail = this._detail === "cleaning-settings";
    const primaryIcon = isDetail ? "mdi:arrow-left" : "mdi:menu";
    const primaryLabel = isDetail ? "Назад" : "Меню";
    return `<header class="app-header"><button class="header-action" type="button" data-header-primary aria-label="${primaryLabel}"><ha-icon icon="${primaryIcon}"></ha-icon></button><div class="header-title"><strong>${isDetail ? "Настройки уборки" : "S8 OMNI"}</strong><span>${isDetail ? "S8 OMNI · Уборка" : `Робот-пылесос · UI ${UI_VERSION}`}</span></div><button class="header-action refresh" type="button" data-refresh aria-label="Обновить" ${this._entityId("refresh") ? "" : "disabled"}><ha-icon icon="mdi:refresh"></ha-icon></button></header>`;
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
    const robotLabel = snap.unreliable ? "Нет данных" : this._label(ROBOT_LABELS, snap.robot, "Нет данных");
    const stationLabel = snap.unreliable ? "Нет данных" : this._label(STATION_LABELS, snap.station, "Нет данных");
    const connection = this._connectionLabel();
    const connectionBad = connection !== "Локально";
    const icon = snap.robot === "charging" ? "mdi:battery-charging" : snap.robot === "charged" ? "mdi:battery-check" : "mdi:robot-vacuum";
    const away = !snap.unreliable && snap.onDock === false;
    const battery = snap.battery === null ? "—" : `${Math.round(snap.battery)}%`;
    const age = snap.age === null ? "—" : this._formatDuration(snap.age);
    return `<section class="card hero" data-more="composite_status"><div class="hero-top"><div><span class="eyebrow">Состояние</span><h1>${escapeHtml(compositeLabel)}</h1><p class="hero-hint">${escapeHtml(this._heroHint(snap))}</p></div><div class="connection-badge ${connectionBad ? "bad" : ""}"><i class="dot"></i>${escapeHtml(connection)}</div></div><div class="scene"><span class="scene-label robot">Робот</span><b class="scene-state robot">${escapeHtml(robotLabel)}</b><span class="scene-label station">Станция</span><b class="scene-state station">${escapeHtml(stationLabel)}</b><div class="track"></div><div class="dock"><ha-icon icon="mdi:home-automation"></ha-icon></div><div class="robot-orb ${away ? "away" : ""}"><ha-icon icon="${snap.unreliable ? "mdi:robot-vacuum-alert" : icon}"></ha-icon></div></div><div class="hero-metrics"><div data-more="battery"><span>АКБ</span><strong>${battery}</strong><div class="battery-bar"><i style="width:${snap.battery ?? 0}%"></i></div></div><div data-more="mode"><span>Режим</span><strong>${escapeHtml(this._modeLabel(snap))}</strong></div><div data-more="telemetry_age"><span>Телеметрия</span><strong>${escapeHtml(age)}</strong></div></div></section>`;
  }

  _quickActions() {
    const snap = this._snapshot();
    const vacuum = snap.vacuum;
    const available = snap.connected && this._available(vacuum);
    const cleaning = vacuum?.state === "cleaning";
    const paused = vacuum?.state === "paused";
    const startClass = cleaning ? "action running" : "action primary";
    const pauseClass = cleaning ? "action primary" : "action";
    const startIcon = cleaning ? "mdi:robot-vacuum" : "mdi:play";
    const startTitle = cleaning ? "Уборка" : paused ? "Продолжить" : "Уборка";
    const startSub = cleaning ? "Идёт" : paused ? "Возобновить" : "Smart";
    return `<div class="quick-actions"><button class="${startClass}" data-action="start" ${available && !cleaning ? "" : "disabled"}><span class="action-icon"><ha-icon icon="${startIcon}"></ha-icon></span><strong>${startTitle}</strong><span class="action-sub">${startSub}</span></button><button class="${pauseClass}" data-action="pause" ${available && cleaning ? "" : "disabled"}><span class="action-icon"><ha-icon icon="mdi:pause"></ha-icon></span><strong>Пауза</strong><span class="action-sub">${cleaning ? "Приостановить" : "Недоступно"}</span></button><button class="action" data-action="home" ${available ? "" : "disabled"}><span class="action-icon"><ha-icon icon="mdi:home-import-outline"></ha-icon></span><strong>Домой</strong><span class="action-sub">На станцию</span></button></div>`;
  }

  _overview() {
    const snap = this._snapshot();
    const robotLabel = snap.unreliable ? "Нет данных" : this._label(ROBOT_LABELS, snap.robot, "Нет данных");
    const stationLabel = snap.unreliable ? "Нет данных" : this._label(STATION_LABELS, snap.station, "Нет данных");
    const robotContext = snap.unreliable ? "Нет данных" : snap.onDock === true ? "На базе" : snap.onDock === false ? "Не на базе" : "Позиция неизвестна";
    const operation = snap.unreliable ? "Нет данных" : snap.stationOperations.length ? snap.stationOperations.map((item) => STATION_OPERATION_LABELS[item] || item).join(" · ") : snap.missingStationDps.length ? "Часть данных" : "Нет операций";
    return `<div class="overview-stack">${this._hero()}${this._trustBanner(snap)}${this._quickActions()}<section class="card statuses-card"><h2>Статусы</h2><div class="status-grid"><button class="status-card" data-more="robot_status" type="button"><span class="status-icon"><ha-icon icon="mdi:robot-vacuum"></ha-icon></span><span class="status-copy"><strong>Робот</strong><b>${escapeHtml(robotLabel)}</b><span>${escapeHtml(robotContext)}</span></span></button><button class="status-card" data-more="station_status" type="button"><span class="status-icon"><ha-icon icon="mdi:home-automation"></ha-icon></span><span class="status-copy"><strong>Станция</strong><b>${escapeHtml(stationLabel)}</b><span>${escapeHtml(operation)}</span></span></button></div></section></div>`;
  }

  _cleaning() {
    const snap = this._snapshot();
    const cleanTime = snap.connected ? this._stateValue("clean_time") : null;
    const cleanArea = snap.connected ? this._stateValue("clean_area") : null;
    const suction = snap.connected ? this._label(SUCTION_LABELS, this._stateValue("suction"), "Нет данных") : "Нет данных";
    const water = snap.connected ? this._label(WATER_LABELS, this._stateValue("water"), "Нет данных") : "Нет данных";
    const volumeObj = this._state("volume");
    const volumeValue = snap.connected && this._available(volumeObj) ? Number(volumeObj.state) : null;
    const volume = Number.isFinite(volumeValue) ? `${Math.round(volumeValue)}%` : "Нет данных";
    const dndObj = this._state("do_not_disturb");
    const dnd = snap.connected && this._available(dndObj) ? (dndObj.state === "on" ? "Вкл" : "Выкл") : "Нет данных";
    return `${this._trustBanner(snap)}<section class="card"><div class="section-title"><div><h2>Текущая уборка</h2></div></div><div class="metric-grid"><div class="metric" data-more="clean_time"><ha-icon icon="mdi:timer-outline"></ha-icon><span>Время</span><strong>${cleanTime !== null ? `${escapeHtml(cleanTime)} мин` : "—"}</strong></div><div class="metric" data-more="clean_area"><ha-icon icon="mdi:ruler-square"></ha-icon><span>Площадь</span><strong>${cleanArea !== null ? `${escapeHtml(cleanArea)} м²` : "—"}</strong></div></div></section><section class="card"><div class="section-title"><div><h2>Как убирать</h2></div></div><div class="metric-grid"><div class="metric profile-metric" data-more="suction"><ha-icon icon="mdi:fan"></ha-icon><span>Всасывание</span><strong>${escapeHtml(suction)}</strong></div><div class="metric profile-metric" data-more="water"><ha-icon icon="mdi:water-outline"></ha-icon><span>Подача воды</span><strong>${escapeHtml(water)}</strong></div></div></section><button class="settings-entry" type="button" data-detail="cleaning-settings"><span class="icon"><ha-icon icon="mdi:tune-variant"></ha-icon></span><span><strong>Настроить уборку</strong><span>Громкость: ${escapeHtml(volume)} · Не беспокоить: ${escapeHtml(dnd)}</span></span><ha-icon icon="mdi:chevron-right"></ha-icon></button><section class="future-card"><span class="icon"><ha-icon icon="mdi:map-outline"></ha-icon></span><div><span class="eyebrow">Следующий этап</span><strong>Карта и комнаты</strong><p>Комнатная и зональная уборка появятся после завершения безопасной поддержки в интеграции.</p></div></section>`;
  }

  _segmentControl(key, labels, columnsClass, title, hint) {
    const snap = this._snapshot();
    const stateObj = this._state(key);
    const value = snap.connected && this._available(stateObj) ? stateObj.state : null;
    return `<div class="segment-group" data-more="${key}"><div class="segment-label"><strong>${title}</strong><span>${hint}</span></div><div class="segments ${columnsClass}">${Object.entries(labels).map(([raw,label]) => `<button class="segment ${value === raw ? "active" : ""}" type="button" data-select-key="${key}" data-select-value="${raw}" ${value === null ? "disabled" : ""}>${label}</button>`).join("")}</div></div>`;
  }

  _cleaningSettings() {
    const snap = this._snapshot();
    const volume = this._state("volume");
    const dnd = this._state("do_not_disturb");
    const volumeValue = snap.connected && this._available(volume) ? Number(volume.state) : null;
    const dndUsable = snap.connected && this._available(dnd);
    return `${this._trustBanner(snap)}<section class="card"><div class="section-title"><div><span class="eyebrow">Уборка</span><h2>Параметры</h2></div></div>${this._segmentControl("suction",SUCTION_LABELS,"three","Мощность всасывания",this._label(SUCTION_LABELS,snap.connected ? this._stateValue("suction") : null,"Нет данных"))}${this._segmentControl("water",WATER_LABELS,"four","Количество воды",this._label(WATER_LABELS,snap.connected ? this._stateValue("water") : null,"Нет данных"))}</section><section class="card"><div class="section-title"><div><span class="eyebrow">Звук</span><h2>Громкость</h2></div></div><div class="slider-row" data-more="volume"><div class="slider-head"><div><strong>Голосовые уведомления</strong><span>Громкость сообщений робота</span></div><strong data-volume-label>${volumeValue === null ? "—" : `${Math.round(volumeValue)}%`}</strong></div><input type="range" min="0" max="100" step="1" value="${volumeValue === null ? 0 : volumeValue}" data-volume ${volumeValue === null ? "disabled" : ""}></div></section><section class="card"><div class="section-title"><div><span class="eyebrow">Поведение</span><h2>Автоматизация</h2></div></div><button class="toggle-row" type="button" data-toggle="do_not_disturb" ${dndUsable ? "" : "disabled"}><span><strong>Не беспокоить</strong><small>Переключатель режима без расписания.</small></span><span class="toggle ${dndUsable && dnd?.state === "on" ? "on" : ""}"></span></button></section>`;
  }

  _operation(key, label, icon, connected) {
    const stateObj = this._state(key);
    const usable = connected && this._available(stateObj);
    const active = usable && stateObj.state === "on";
    const text = !usable ? "Нет данных" : active ? "Работает" : "Ожидание";
    return `<div class="operation ${active ? "active" : ""}" data-more="${key}"><span class="icon"><ha-icon icon="${icon}"></ha-icon></span><span><strong>${label}</strong><span>${text}</span></span><i></i></div>`;
  }

  _station() {
    const snap = this._snapshot();
    const stationLabel = snap.unreliable ? "Нет данных" : this._label(STATION_LABELS,snap.station,"Нет данных");
    const operation = snap.unreliable ? "Нет данных" : snap.stationOperations.length ? snap.stationOperations.map((item)=>STATION_OPERATION_LABELS[item]||item).join(" · ") : "Ожидание";
    return `${this._trustBanner(snap)}<section class="card station-hero" data-more="station_status"><div class="station-device"><ha-icon icon="mdi:home-automation"></ha-icon></div><div><span class="eyebrow">Станция S8 OMNI</span><h2>${escapeHtml(stationLabel)}</h2><p>${snap.unreliable ? "Нет подтверждённого текущего состояния станции." : `Текущая операция: ${escapeHtml(operation)}.`}</p></div></section><section class="card"><div class="info-list"><div class="info-row"><span>Робот</span><strong>${snap.unreliable ? "Нет данных" : snap.onDock === true ? "На базе" : snap.onDock === false ? "Не на базе" : "Неизвестно"}</strong></div><div class="info-row"><span>Заряд</span><strong>${snap.battery === null ? "—" : `${Math.round(snap.battery)}%`}</strong></div><div class="info-row"><span>Текущая операция</span><strong>${escapeHtml(operation)}</strong></div></div></section><section class="card"><div class="section-title"><div><span class="eyebrow">Состояние</span><h2>Операции станции</h2></div></div><div class="operation-list">${this._operation("dust_collection","Сбор пыли","mdi:delete-sweep-outline",snap.connected)}${this._operation("roller_cleaning","Промывка","mdi:waves",snap.connected)}${this._operation("roller_drying","Сушка","mdi:weather-windy",snap.connected)}</div></section><section class="future-card"><span class="icon"><ha-icon icon="mdi:shield-check-outline"></ha-icon></span><div><strong>Управление станцией</strong><p>Кнопки операций появятся только после подтверждения публичных команд интеграции.</p></div></section>`;
  }

  _resource(key,title,icon,connected) {
    const value = connected ? this._formatEntity(key,"—") : "—";
    return `<div class="resource" data-more="${key}"><span class="icon"><ha-icon icon="${icon}"></ha-icon></span><span><strong>${title}</strong><span>Остаточный ресурс от устройства</span></span><b>${escapeHtml(value)}</b></div>`;
  }

  _maintenance() {
    const snap = this._snapshot();
    const fault = snap.connected ? this._formatEntity("fault","—") : "—";
    const child = this._state("child_lock");
    const childUsable = snap.connected && this._available(child);
    return `${this._trustBanner(snap)}<section class="view-heading"><span class="eyebrow">S8 OMNI</span><h2>Обслуживание</h2><p>Остаточный ресурс расходников.</p></section>${this._resource("filter_life","Фильтр","mdi:air-filter",snap.connected)}${this._resource("side_brush_life","Боковая щётка","mdi:fan",snap.connected)}${this._resource("main_brush_life","Основная щётка","mdi:brush",snap.connected)}<section class="card"><div class="section-title"><div><span class="eyebrow">Система</span><h2>Защита и ошибки</h2></div></div><div class="info-row" data-more="fault"><span>Ошибка</span><strong>${escapeHtml(fault)}</strong></div><button class="toggle-row" type="button" data-toggle="child_lock" ${childUsable ? "" : "disabled"}><span><strong>Блокировка от детей</strong><small>Защита кнопок робота</small></span><span class="toggle ${childUsable && child?.state === "on" ? "on" : ""}"></span></button></section><section class="future-card"><span class="icon"><ha-icon icon="mdi:restore"></ha-icon></span><div><strong>Сброс ресурса</strong><p>Сброс станет доступен после завершения проверки безопасной команды.</p></div></section>`;
  }

  _diagRow(label,value) {
    const shown = value === null || value === undefined ? "—" : String(value);
    return `<div class="info-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(shown)}</strong></div>`;
  }

  _diagnostics() {
    const snap = this._snapshot(); const attrs = snap.attrs || {};
    const deviceState = snap.connected ? "Доступно" : snap.connection === "disconnected" ? "Недоступно" : "Не подтверждено";
    return `<section class="view-heading"><span class="eyebrow">Технический экран</span><h2>Диагностика</h2><p>Нормализованные и raw-значения интеграции.</p></section><div class="diagnostic-strip"><div><span>Локальная связь</span><strong>${escapeHtml(this._connectionLabel())}</strong></div><div><span>Устройство</span><strong>${deviceState}</strong></div><div><span>Возраст данных</span><strong>${snap.age === null ? "—" : escapeHtml(this._formatDuration(snap.age))}</strong></div></div><section class="card"><div class="section-title"><div><span class="eyebrow">Нормализовано</span><h2>Состояния</h2></div></div><div class="info-list">${this._diagRow("Composite",snap.connected ? this._stateValue("composite_status") : "unavailable")}${this._diagRow("Robot status",snap.connected ? this._stateValue("robot_status") : "unavailable")}${this._diagRow("Station status",snap.connected ? this._stateValue("station_status") : "unavailable")}${this._diagRow("Station DP отсутствуют",snap.connected && snap.missingStationDps.length ? snap.missingStationDps.join(", ") : snap.connected ? "Нет" : "—")}</div></section><section class="card"><div class="section-title"><div><span class="eyebrow">Tuya</span><h2>Raw</h2></div></div><div class="info-list">${this._diagRow("DP5 status",attrs.raw_status)}${this._diagRow("DP4 mode",attrs.mode)}${this._diagRow("DP1 power_go",attrs.power_go)}${this._diagRow("DP2 pause",attrs.pause)}${this._diagRow("DP28 fault",attrs.fault)}${this._diagRow("DP134 dp_dust",attrs.dp_dust)}${this._diagRow("DP135 dp_roll_clean",attrs.dp_roll_clean)}${this._diagRow("DP136 dp_roll_hot",attrs.dp_roll_hot)}</div></section><section class="card"><div class="section-title"><div><span class="eyebrow">Контракт</span><h2>Панель</h2></div></div><div class="info-list">${this._diagRow("Integration",this._panel?.config?.integration_version || "—")}${this._diagRow("Dashboard",UI_VERSION)}${this._diagRow("Bundle","standalone")}${this._diagRow("Route","/dashboard-s8-omni")}${this._diagRow("Owner","ha-s8-omni")}</div></section>`;
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
    const activeView = this._detail ? "cleaning" : this._view;
    return `<nav>${items.map(([view,icon,label])=>`<button type="button" data-view="${view}" class="${activeView===view?"active":""}" aria-current="${activeView===view?"page":"false"}"><ha-icon icon="${icon}"></ha-icon><span>${label}</span></button>`).join("")}</nav>`;
  }

  _bind() {
    this.shadowRoot.querySelector("[data-header-primary]")?.addEventListener("click",()=>{
      if(this._detail){this._detail=null;this._view="cleaning";this._queueRender();return;}
      this._toggleMenu();
    });
    this.shadowRoot.querySelector("[data-refresh]")?.addEventListener("click",async(event)=>{ const button=event.currentTarget; if(!this._entityId("refresh")||button.disabled)return; button.disabled=true; button.classList.add("loading"); try{await this._call("button","press","refresh");}finally{setTimeout(()=>{button.disabled=false;button.classList.remove("loading");},700);} });
    this.shadowRoot.querySelectorAll("[data-view]").forEach((button)=>button.addEventListener("click",()=>{this._detail=null;this._view=button.dataset.view;this._queueRender();}));
    this.shadowRoot.querySelectorAll("[data-detail]").forEach((button)=>button.addEventListener("click",()=>{this._detail=button.dataset.detail;this._view="cleaning";this._queueRender();}));
    this.shadowRoot.querySelectorAll("[data-action]").forEach((button)=>button.addEventListener("click",async()=>{ if(button.disabled||!this._snapshot().connected)return; button.disabled=true; try{if(button.dataset.action==="start")await this._call("vacuum","start","vacuum");if(button.dataset.action==="pause")await this._call("vacuum","pause","vacuum");if(button.dataset.action==="home")await this._call("vacuum","return_to_base","vacuum");}finally{setTimeout(()=>{button.disabled=false;},650);} }));
    this.shadowRoot.querySelectorAll("[data-select-key]").forEach((button)=>button.addEventListener("click",async()=>{if(button.disabled||!this._snapshot().connected)return;await this._call("select","select_option",button.dataset.selectKey,{option:button.dataset.selectValue});}));
    const volume=this.shadowRoot.querySelector("[data-volume]"); volume?.addEventListener("input",()=>{const label=this.shadowRoot.querySelector("[data-volume-label]");if(label)label.textContent=`${volume.value}%`;}); volume?.addEventListener("change",()=>{if(this._snapshot().connected)this._call("number","set_value","volume",{value:Number(volume.value)});});
    this.shadowRoot.querySelectorAll("[data-toggle]").forEach((button)=>button.addEventListener("click",()=>{if(button.disabled||!this._snapshot().connected)return;const key=button.dataset.toggle;const on=this._state(key)?.state==="on";this._call("switch",on?"turn_off":"turn_on",key);}));
    this.shadowRoot.querySelectorAll("[data-more]").forEach((node)=>{let timer=null;const cancel=()=>{if(timer)clearTimeout(timer);timer=null;};node.addEventListener("pointerdown",()=>{cancel();timer=setTimeout(()=>{timer=null;this._showMoreInfo(node.dataset.more);},520);});node.addEventListener("pointerup",cancel);node.addEventListener("pointercancel",cancel);node.addEventListener("pointerleave",cancel);});
  }

  _render() {
    if (!this.shadowRoot) return;
    if (!this._hass || !this._panel || this._registryLoading || !this._registryLoaded) { this.shadowRoot.innerHTML=`<style>${this._styles()}</style><main>${this._header()}<div class="content"><div class="loading"><div><ha-icon icon="mdi:robot-vacuum"></ha-icon><p>Подключаем интерфейс…</p></div></div></div>${this._nav()}</main>`; this._bind(); return; }
    if (this._registryError) { this.shadowRoot.innerHTML=`<style>${this._styles()}</style><main>${this._header()}<div class="content"><div class="trust-banner"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><div><strong>Не удалось загрузить реестр сущностей</strong><span>${escapeHtml(this._registryError)}</span></div></div></div>${this._nav()}</main>`; this._bind(); return; }
    this.shadowRoot.innerHTML=`<style>${this._styles()}</style><main>${this._header()}<div class="content">${this._body()}</div>${this._nav()}</main>`;
    this._bind();
  }
}

if (!customElements.get("s8-omni-panel")) customElements.define("s8-omni-panel",S8OmniPanel);
