const UI_VERSION = "v0.5.4";

const ROBOT_LABELS = {
  idle: "Ожидание",
  cleaning: "Убирает",
  zone_cleaning: "Уборка зоны",
  room_cleaning: "Уборка комнат",
  paused: "Уборка приостановлена",
  going_to_position: "Движется к точке",
  position_reached: "Точка достигнута",
  position_not_reached: "Точка не достигнута",
  returning_to_dock: "Возвращается на базу",
  charging: "Заряжается",
  charged: "Заряжен",
  sleeping: "Сон",
  error: "Ошибка",
  wall_following: "Уборка вдоль стен",
  manual_control: "Ручное управление",
  repositioning: "Определяет положение",
  creating_map: "Создаёт карту",
  unknown: "Состояние неизвестно",
};

const STATION_LABELS = {
  idle: "Ожидание",
  dust_collection: "Очистка пылесборника",
  roller_cleaning: "Промывка / очистка",
  drying: "Сушка",
  multiple_operations: "Несколько операций",
  unknown: "Нет достоверных данных",
};

const COMPOSITE_LABELS = {
  idle: "Готов к уборке",
  cleaning: "Убирает",
  zone_cleaning: "Убирает зону",
  room_cleaning: "Убирает комнаты",
  paused: "Уборка приостановлена",
  returning_to_dock: "Возвращается на базу",
  charging: "Заряжается",
  charged: "На базе · Заряжен",
  sleeping: "Сон",
  repositioning: "Определяет положение",
  docked_dust_collection: "На базе · Очистка пылесборника",
  docked_roller_cleaning: "На базе · Промывка / очистка",
  docked_drying: "На базе · Сушка",
  docked_station_active: "На базе · Станция работает",
  error: "Требуется внимание",
  unknown: "Состояние неизвестно",
};

const MODE_LABELS = {
  smart: "Smart",
  zone: "Уборка зоны",
  pose: "Точка",
  part: "Частичная уборка",
  chargego: "Возврат на базу",
  wallfollow: "Вдоль стен",
  selectroom: "Уборка комнат",
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
  dust_collection: "Очистка пылесборника",
  roller_cleaning: "Промывка / очистка",
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
    if (!this._hass || !this._panel || this._registryLoaded || this._registryLoading) return;
    const entryId = this._panel?.config?.entry_id;
    if (!entryId) return;

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
    } catch (err) {
      this._registryError = String(err);
    } finally {
      this._registryLoaded = true;
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
    return Boolean(
      stateObj &&
      stateObj.state !== "unavailable" &&
      stateObj.state !== "unknown" &&
      stateObj.state !== "none"
    );
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
    return unit ? `${stateObj.state} ${unit}` : stateObj.state;
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
      vacuum,
      compositeObj,
      attrs,
      connection,
      connected: connection === "connected",
      unavailable,
      unreliable,
      robot,
      station,
      composite,
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
    this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId },
      bubbles: true,
      composed: true,
    }));
  }

  _navigate(path) {
    if (!path) return;
    window.history.pushState(null, "", path);
    window.dispatchEvent(new CustomEvent("location-changed"));
  }

  _styles() {
    return `
      :host {
        display: block;
        min-height: 100vh;
        background: var(--primary-background-color);
        color: var(--primary-text-color);
        font-family: var(--ha-font-family-body, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
        overflow-x: hidden;
      }
      * { box-sizing: border-box; }
      button, input, select { font: inherit; }
      button { -webkit-tap-highlight-color: transparent; }
      main { min-height: 100vh; padding-bottom: calc(92px + env(safe-area-inset-bottom)); }
      .app-header {
        position: sticky;
        top: 0;
        z-index: 60;
        display: grid;
        grid-template-columns: 52px minmax(0,1fr) 52px;
        align-items: center;
        gap: 10px;
        min-height: calc(72px + env(safe-area-inset-top));
        padding: max(10px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) 10px max(16px, env(safe-area-inset-left));
        background: color-mix(in srgb, var(--primary-background-color) 95%, transparent);
        border-bottom: 1px solid color-mix(in srgb, var(--divider-color) 72%, transparent);
        backdrop-filter: blur(18px) saturate(130%);
        -webkit-backdrop-filter: blur(18px) saturate(130%);
      }
      .header-action {
        width: 52px;
        height: 52px;
        min-width: 44px;
        min-height: 44px;
        border: 0;
        border-radius: 16px;
        display: grid;
        place-items: center;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        box-shadow: var(--ha-card-box-shadow, 0 3px 12px rgba(0,0,0,.07));
      }
      .header-action.refresh { color: var(--primary-color); }
      .header-action:active { transform: scale(.97); }
      .header-action:disabled { opacity: .38; }
      .header-action ha-icon { --mdc-icon-size: 29px; }
      .header-action.loading ha-icon { animation: spin .8s linear infinite; }
      .header-title { min-width: 0; text-align: center; display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
      .header-title strong { font-size: 24px; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .header-title span { color: var(--secondary-text-color); font-size: 12px; font-weight: 650; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .content { width: min(100%, 920px); margin: 0 auto; padding: 14px 12px 24px; }
      .card {
        background: var(--card-background-color);
        border: 1px solid color-mix(in srgb, var(--divider-color) 70%, transparent);
        border-radius: 24px;
        padding: 18px;
        margin-bottom: 14px;
        box-shadow: 0 6px 18px rgba(0,0,0,.04);
      }
      .hero {
        position: relative;
        overflow: hidden;
        background: linear-gradient(135deg, var(--card-background-color) 55%, color-mix(in srgb, var(--primary-color) 10%, var(--card-background-color)) 100%);
      }
      .hero::after {
        content: "";
        position: absolute;
        width: 240px;
        height: 240px;
        right: -80px;
        top: -100px;
        border-radius: 50%;
        background: color-mix(in srgb, var(--primary-color) 9%, transparent);
        pointer-events: none;
      }
      .eyebrow { display: block; color: var(--secondary-text-color); font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
      h1,h2,h3,p { margin: 0; }
      .hero-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; position: relative; z-index: 1; }
      .hero h1 { margin-top: 5px; font-size: clamp(33px, 8vw, 46px); line-height: 1.03; letter-spacing: -.03em; overflow-wrap: anywhere; }
      .hero-hint { margin-top: 8px; color: var(--secondary-text-color); font-size: 16px; line-height: 1.3; }
      .connection-badge { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 7px; min-height: 38px; max-width: 130px; padding: 0 13px; border-radius: 999px; background: var(--secondary-background-color); color: var(--secondary-text-color); font-size: 14px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .dot { width: 8px; height: 8px; flex: 0 0 auto; border-radius: 50%; background: var(--success-color, #43a047); }
      .connection-badge.bad .dot { background: var(--error-color, #db4437); }
      .connection-badge.unknown .dot { background: var(--disabled-color, #9e9e9e); }
      .scene {
        position: relative;
        z-index: 1;
        height: 172px;
        margin-top: 16px;
        border-radius: 22px;
        border: 1px solid color-mix(in srgb, var(--divider-color) 80%, transparent);
        background: color-mix(in srgb, var(--secondary-background-color) 72%, transparent);
        overflow: hidden;
      }
      .scene-label { position: absolute; top: 16px; font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--secondary-text-color); }
      .scene-label.robot { left: 16px; }
      .scene-label.station { right: 16px; }
      .scene-state { position: absolute; top: 35px; max-width: 43%; font-size: 15px; font-weight: 800; line-height: 1.15; }
      .scene-state.robot { left: 16px; }
      .scene-state.station { right: 16px; text-align: right; }
      .track { position: absolute; left: 14%; right: 23%; top: 69%; border-top: 2px dashed color-mix(in srgb, var(--secondary-text-color) 25%, transparent); }
      .track::before { content: ""; position: absolute; left: 0; top: -5px; width: 8px; height: 8px; border-radius: 50%; background: color-mix(in srgb, var(--primary-color) 55%, white); }
      .dock { position: absolute; right: 8%; bottom: 26px; width: 66px; height: 86px; border-radius: 16px 16px 20px 20px; background: color-mix(in srgb, var(--secondary-background-color) 90%, var(--primary-text-color) 10%); border: 1px solid var(--divider-color); display: grid; place-items: center; color: var(--secondary-text-color); }
      .dock ha-icon { --mdc-icon-size: 32px; }
      .robot-orb { position: absolute; right: 15%; bottom: 20px; width: 86px; height: 86px; border-radius: 50%; background: var(--card-background-color); border: 1px solid var(--divider-color); box-shadow: 0 8px 18px rgba(0,0,0,.07); display: grid; place-items: center; color: var(--primary-color); }
      .robot-orb.away { right: auto; left: 33%; }
      .robot-orb.unknown { right: auto; left: calc(50% - 43px); opacity: .58; color: var(--secondary-text-color); }
      .robot-orb ha-icon { --mdc-icon-size: 42px; }
      .hero-metrics { position: relative; z-index: 1; display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 9px; margin-top: 12px; }
      .hero-metrics > div { min-width: 0; min-height: 74px; border-radius: 18px; padding: 12px; background: var(--secondary-background-color); }
      .hero-metrics span { display: block; color: var(--secondary-text-color); font-size: 11px; text-transform: uppercase; letter-spacing: .1em; }
      .hero-metrics strong { display: block; margin-top: 5px; font-size: 18px; line-height: 1.1; overflow-wrap: anywhere; }
      .battery-bar { height: 5px; border-radius: 999px; background: var(--divider-color); margin-top: 10px; overflow: hidden; }
      .battery-bar i { display: block; height: 100%; border-radius: inherit; background: var(--primary-color); }
      .trust-banner { display: flex; gap: 11px; align-items: flex-start; padding: 13px 15px; margin: 0 0 14px; border-radius: 18px; background: color-mix(in srgb, var(--error-color, #db4437) 10%, var(--card-background-color)); border: 1px solid color-mix(in srgb, var(--error-color, #db4437) 35%, transparent); }
      .trust-banner ha-icon { color: var(--error-color, #db4437); --mdc-icon-size: 24px; }
      .trust-banner strong { display: block; font-size: 14px; }
      .trust-banner span { display: block; color: var(--secondary-text-color); font-size: 12px; margin-top: 2px; }
      .quick-actions { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 9px; margin-bottom: 14px; }
      .action {
        min-width: 0;
        min-height: 78px;
        border: 1px solid color-mix(in srgb, var(--divider-color) 82%, transparent);
        border-radius: 22px;
        padding: 11px;
        display: grid;
        grid-template-columns: 44px minmax(0,1fr);
        align-items: center;
        gap: 9px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        text-align: left;
        overflow: hidden;
      }
      .action.primary { background: var(--primary-color); color: var(--text-primary-color, white); border-color: transparent; }
      .action:disabled { opacity: .38; }
      .action-icon { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; background: color-mix(in srgb, currentColor 10%, transparent); }
      .action ha-icon { --mdc-icon-size: 24px; }
      .action strong { display: block; font-size: 16px; line-height: 1.05; overflow-wrap: anywhere; }
      .action span { min-width: 0; display: block; margin-top: 3px; font-size: 12px; opacity: .72; line-height: 1.15; }
      .section-title { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; }
      .section-title h2 { margin-top: 4px; font-size: 27px; letter-spacing: -.02em; }
      .text-link { border: 0; background: transparent; color: var(--primary-color); font-weight: 800; padding: 10px 0; }
      .status-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; }
      .status-card { min-width: 0; min-height: 116px; border: 0; border-radius: 21px; padding: 15px; background: var(--secondary-background-color); color: var(--primary-text-color); text-align: left; display: grid; grid-template-columns: 48px minmax(0,1fr); gap: 12px; align-items: center; overflow: hidden; }
      .status-icon { width: 48px; height: 48px; border-radius: 16px; display: grid; place-items: center; background: var(--card-background-color); color: var(--primary-color); }
      .status-icon ha-icon { --mdc-icon-size: 27px; }
      .status-copy { min-width: 0; }
      .status-copy strong { display: block; font-size: 17px; }
      .status-copy b { display: block; margin-top: 4px; font-size: 16px; overflow-wrap: anywhere; }
      .status-copy span { display: block; margin-top: 4px; color: var(--secondary-text-color); font-size: 12px; line-height: 1.25; overflow-wrap: anywhere; }
      .metric-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; }
      .metric { min-width: 0; min-height: 118px; border-radius: 21px; padding: 15px; background: var(--secondary-background-color); display: grid; grid-template-columns: 42px minmax(0,1fr); grid-template-rows: auto auto; align-content: center; column-gap: 10px; }
      .metric ha-icon { grid-row: 1 / span 2; align-self: center; color: var(--primary-color); --mdc-icon-size: 29px; }
      .metric span { color: var(--secondary-text-color); font-size: 13px; align-self: end; }
      .metric strong { font-size: 22px; align-self: start; overflow-wrap: anywhere; }
      .drill-entry { width: 100%; min-height: 78px; border: 0; border-radius: 20px; padding: 14px; display: grid; grid-template-columns: 48px minmax(0,1fr) 26px; gap: 12px; align-items: center; background: var(--secondary-background-color); color: var(--primary-text-color); text-align: left; }
      .drill-entry .icon { width: 48px; height: 48px; border-radius: 16px; display: grid; place-items: center; background: var(--card-background-color); color: var(--primary-color); }
      .drill-entry strong { display: block; font-size: 17px; }
      .drill-entry span { display: block; margin-top: 4px; color: var(--secondary-text-color); font-size: 12px; line-height: 1.3; }
      .future-card { display: grid; grid-template-columns: 48px minmax(0,1fr); gap: 12px; padding: 15px; margin-bottom: 14px; border-radius: 22px; border: 1px dashed var(--divider-color); }
      .future-card .icon { width: 48px; height: 48px; border-radius: 16px; display: grid; place-items: center; background: var(--secondary-background-color); color: var(--secondary-text-color); }
      .future-card strong { display: block; font-size: 16px; }
      .future-card p { margin-top: 4px; color: var(--secondary-text-color); font-size: 12px; line-height: 1.4; }
      .segment-group { margin-bottom: 18px; }
      .segment-label { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin-bottom: 9px; }
      .segment-label strong { font-size: 16px; }
      .segment-label span { color: var(--secondary-text-color); font-size: 12px; }
      .segments { display: grid; gap: 6px; padding: 5px; border-radius: 17px; background: var(--secondary-background-color); }
      .segments.three { grid-template-columns: repeat(3,minmax(0,1fr)); }
      .segments.four { grid-template-columns: repeat(4,minmax(0,1fr)); }
      .segment { min-height: 44px; border: 0; border-radius: 13px; background: transparent; color: var(--secondary-text-color); font-size: 12px; font-weight: 750; padding: 5px; }
      .segment.active { background: var(--card-background-color); color: var(--primary-color); box-shadow: 0 2px 8px rgba(0,0,0,.06); }
      .slider-row, .toggle-row, .info-row { padding: 14px 0; border-top: 1px solid var(--divider-color); }
      .slider-row:first-child, .toggle-row:first-child, .info-row:first-child { border-top: 0; }
      .slider-head, .toggle-row, .info-row { display: flex; justify-content: space-between; gap: 14px; align-items: center; }
      .slider-head strong, .toggle-row strong, .info-row strong { font-size: 15px; }
      .slider-head span, .toggle-row small, .info-row span { color: var(--secondary-text-color); font-size: 12px; }
      input[type=range] { width: 100%; margin-top: 12px; accent-color: var(--primary-color); }
      .toggle-row { width: 100%; border-left: 0; border-right: 0; border-bottom: 0; background: transparent; color: var(--primary-text-color); text-align: left; }
      .toggle { width: 48px; height: 28px; border-radius: 999px; background: var(--disabled-color, #bdbdbd); padding: 3px; flex: 0 0 auto; }
      .toggle::after { content: ""; display: block; width: 22px; height: 22px; border-radius: 50%; background: white; transition: transform .18s ease; box-shadow: 0 1px 5px rgba(0,0,0,.18); }
      .toggle.on { background: var(--primary-color); }
      .toggle.on::after { transform: translateX(20px); }
      .station-hero { display: grid; grid-template-columns: 92px minmax(0,1fr); gap: 16px; align-items: center; }
      .station-device { width: 92px; height: 122px; border-radius: 24px; background: var(--secondary-background-color); border: 1px solid var(--divider-color); display: grid; place-items: center; color: var(--primary-color); }
      .station-device ha-icon { --mdc-icon-size: 42px; }
      .station-hero h2 { font-size: 38px; line-height: 1; margin-top: 6px; overflow-wrap: anywhere; }
      .station-hero p { margin-top: 9px; color: var(--secondary-text-color); line-height: 1.35; }
      .operation-list { display: grid; gap: 9px; }
      .operation { min-height: 72px; border-radius: 20px; padding: 12px; background: var(--secondary-background-color); display: grid; grid-template-columns: 48px minmax(0,1fr) 12px; gap: 12px; align-items: center; }
      .operation .icon { width: 48px; height: 48px; border-radius: 16px; display: grid; place-items: center; background: var(--card-background-color); color: var(--primary-color); }
      .operation strong { display: block; font-size: 15px; }
      .operation span { display: block; margin-top: 3px; color: var(--secondary-text-color); font-size: 12px; }
      .operation i { width: 9px; height: 9px; border-radius: 50%; background: var(--divider-color); }
      .operation.active i { background: var(--primary-color); box-shadow: 0 0 0 5px color-mix(in srgb, var(--primary-color) 14%, transparent); }
      .resource { min-height: 96px; border: 1px solid color-mix(in srgb, var(--divider-color) 70%, transparent); border-radius: 22px; padding: 15px; margin-bottom: 10px; background: var(--card-background-color); display: grid; grid-template-columns: 58px minmax(0,1fr) auto; gap: 13px; align-items: center; box-shadow: 0 5px 16px rgba(0,0,0,.035); }
      .resource .icon { width: 58px; height: 58px; border-radius: 18px; display: grid; place-items: center; background: color-mix(in srgb, var(--primary-color) 12%, var(--secondary-background-color)); color: var(--primary-color); }
      .resource strong { font-size: 16px; }
      .resource span { display: block; margin-top: 4px; color: var(--secondary-text-color); font-size: 12px; }
      .resource b { font-size: 22px; white-space: nowrap; }
      .diagnostic-strip { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 8px; padding: 13px; margin-bottom: 14px; border: 1px solid color-mix(in srgb, var(--success-color, #43a047) 45%, var(--divider-color)); border-radius: 22px; }
      .diagnostic-strip span { display: block; color: var(--secondary-text-color); font-size: 11px; }
      .diagnostic-strip strong { display: block; margin-top: 6px; font-size: 14px; overflow-wrap: anywhere; }
      .info-list { margin-top: 3px; }
      .info-row > span:first-child { color: var(--primary-text-color); font-size: 14px; }
      .info-row > strong { text-align: right; overflow-wrap: anywhere; }
      nav {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 70;
        display: grid;
        grid-template-columns: repeat(5,minmax(0,1fr));
        gap: 2px;
        padding: 7px max(7px, env(safe-area-inset-right)) calc(7px + env(safe-area-inset-bottom)) max(7px, env(safe-area-inset-left));
        background: color-mix(in srgb, var(--card-background-color) 96%, transparent);
        border-top: 1px solid color-mix(in srgb, var(--divider-color) 72%, transparent);
        box-shadow: 0 -3px 14px rgba(0,0,0,.05);
        backdrop-filter: blur(18px) saturate(135%);
        -webkit-backdrop-filter: blur(18px) saturate(135%);
      }
      nav button { min-width: 0; min-height: 58px; border: 0; border-radius: 18px; background: transparent; color: var(--secondary-text-color); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; padding: 5px 2px; overflow: hidden; }
      nav button ha-icon { --mdc-icon-size: 25px; }
      nav button span { max-width: 100%; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      nav button.active { background: color-mix(in srgb, var(--primary-color) 10%, transparent); color: var(--primary-color); }
      .loading { min-height: 60vh; display: grid; place-items: center; text-align: center; color: var(--secondary-text-color); }
      .loading ha-icon { --mdc-icon-size: 54px; color: var(--primary-color); }
      @keyframes spin { to { transform: rotate(360deg); } }
      @media (max-width: 480px) {
        main { padding-bottom: calc(88px + env(safe-area-inset-bottom)); }
        .app-header {
          grid-template-columns: 48px minmax(0,1fr) 48px;
          gap: 8px;
          min-height: calc(68px + env(safe-area-inset-top));
          padding: max(8px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) 8px max(12px, env(safe-area-inset-left));
        }
        .header-action { width: 48px; height: 48px; border-radius: 15px; }
        .header-action ha-icon { --mdc-icon-size: 27px; }
        .header-title strong { font-size: 22px; }
        .header-title span { font-size: 11px; }
        .content { padding-left: 11px; padding-right: 11px; }
        .card { border-radius: 22px; padding: 17px; }
        .hero h1 { font-size: clamp(34px, 9vw, 39px); }
        .connection-badge { min-height: 36px; max-width: 118px; padding: 0 11px; font-size: 13px; }
        .quick-actions { grid-template-columns: repeat(3,minmax(0,1fr)); gap: 8px; }
        .action { min-height: 88px; padding: 9px 5px; grid-template-columns: 1fr; grid-template-rows: 38px auto; justify-items: center; align-content: center; gap: 6px; text-align: center; }
        .action-icon { width: 38px; height: 38px; border-radius: 13px; }
        .action ha-icon { --mdc-icon-size: 22px; }
        .action strong { font-size: 14px; line-height: 1.05; }
        .action > span:last-child > span { margin-top: 3px; font-size: 11px; line-height: 1.05; }
        .status-card { min-height: 108px; grid-template-columns: 44px minmax(0,1fr); padding: 13px; gap: 10px; }
        .status-icon { width: 44px; height: 44px; }
        .segments.four .segment { font-size: 11px; }
        nav { padding-left: max(5px, env(safe-area-inset-left)); padding-right: max(5px, env(safe-area-inset-right)); gap: 1px; }
        nav button { min-height: 58px; border-radius: 16px; padding-left: 1px; padding-right: 1px; }
        nav button span { font-size: 10.5px; }
      }
      @media (max-width: 360px) {
        .header-title strong { font-size: 20px; }
        .header-title span { font-size: 10px; }
        .hero-metrics { grid-template-columns: 1fr 1fr; }
        .hero-metrics > div:last-child { grid-column: 1 / -1; }
        .quick-actions { gap: 6px; }
        .action { min-height: 84px; padding-left: 3px; padding-right: 3px; }
        .action strong { font-size: 13px; }
        .action > span:last-child > span { font-size: 10px; }
        .status-grid { grid-template-columns: 1fr; }
        .segments.four { grid-template-columns: repeat(2,1fr); }
        nav button span { font-size: 10px; }
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; }
      }
    `;
  }

  _header() {
    const isDetail = this._detail === "cleaning-settings";
    return `
      <header class="app-header">
        <button class="header-action" type="button" data-header-back aria-label="Назад">
          <ha-icon icon="mdi:arrow-left"></ha-icon>
        </button>
        <div class="header-title">
          <strong>${isDetail ? "Настройки уборки" : "S8 OMNI"}</strong>
          <span>${isDetail ? "S8 OMNI · Уборка" : `Робот-пылесос · UI ${UI_VERSION}`}</span>
        </div>
        <button class="header-action refresh" type="button" data-refresh aria-label="Обновить" ${this._entityId("refresh") ? "" : "disabled"}>
          <ha-icon icon="mdi:refresh"></ha-icon>
        </button>
      </header>`;
  }

  _trustBanner(snap) {
    if (!snap.unreliable && snap.composite !== "unknown" && snap.composite !== "error") return "";
    const age = snap.age === null ? null : this._formatDuration(snap.age);
    const title = snap.unavailable ? "S8 OMNI недоступен" : snap.unreliable ? "Связь не подтверждена" : snap.composite === "error" ? "Требуется внимание" : "Состояние не подтверждено";
    const text = snap.unavailable
      ? `Нет актуальной локальной телеметрии.${age ? ` Последние данные: ${age} назад.` : ""}`
      : snap.unreliable
        ? "Текущие значения не считаются достоверными до восстановления локальной связи."
        : snap.composite === "error"
          ? "Проверьте ошибку робота в Диагностике."
          : "Часть данных отсутствует или неизвестна.";
    return `<div class="trust-banner"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span></div></div>`;
  }

  _hero() {
    const snap = this._snapshot();
    const compositeLabel = snap.unavailable ? "Нет связи" : this._label(COMPOSITE_LABELS, snap.composite, "Состояние неизвестно");
    const robotLabel = snap.unavailable ? "Нет данных" : this._label(ROBOT_LABELS, snap.robot, "Нет данных");
    const stationLabel = snap.unavailable ? "Нет данных" : this._label(STATION_LABELS, snap.station, "Нет данных");
    const connection = this._connectionLabel();
    const connectionClass = snap.connection === "connected" ? "" : snap.connection === "disconnected" ? "bad" : "unknown";
    const icon = snap.unavailable ? "mdi:robot-vacuum" : snap.robot === "charging" ? "mdi:battery-charging" : snap.robot === "charged" ? "mdi:battery-check" : "mdi:robot-vacuum";
    const away = !snap.unreliable && snap.onDock === false;
    const unknownPosition = snap.unreliable || snap.onDock === null || snap.onDock === undefined;
    const battery = snap.battery === null ? "—" : `${Math.round(snap.battery)}%`;
    const age = snap.age === null ? "—" : this._formatDuration(snap.age);
    const hint = snap.unavailable
      ? "Нет актуальной локальной телеметрии"
      : snap.unreliable
        ? "Текущая связь с роботом не подтверждена"
        : snap.robot === "charged"
          ? "Робот на станции, заряд завершён"
          : snap.robot === "charging"
            ? "Робот на станции и заряжается"
            : snap.composite === "cleaning"
              ? "Выполняется уборка"
              : "Робот и станция работают как единая система";
    return `
      <section class="card hero" data-more="composite_status">
        <div class="hero-top">
          <div>
            <span class="eyebrow">Состояние</span>
            <h1>${escapeHtml(compositeLabel)}</h1>
            <p class="hero-hint">${escapeHtml(hint)}</p>
          </div>
          <div class="connection-badge ${connectionClass}"><i class="dot"></i>${escapeHtml(connection)}</div>
        </div>
        <div class="scene">
          <span class="scene-label robot">Робот</span><b class="scene-state robot">${escapeHtml(robotLabel)}</b>
          <span class="scene-label station">Станция</span><b class="scene-state station">${escapeHtml(stationLabel)}</b>
          <div class="track"></div>
          <div class="dock"><ha-icon icon="mdi:home-automation"></ha-icon></div>
          <div class="robot-orb ${unknownPosition ? "unknown" : away ? "away" : ""}"><ha-icon icon="${icon}"></ha-icon></div>
        </div>
        <div class="hero-metrics">
          <div data-more="battery"><span>АКБ</span><strong>${battery}</strong><div class="battery-bar"><i style="width:${snap.battery ?? 0}%"></i></div></div>
          <div data-more="mode"><span>Режим</span><strong>${escapeHtml(this._modeLabel(snap))}</strong></div>
          <div data-more="telemetry_age"><span>Телеметрия</span><strong>${escapeHtml(age)}</strong></div>
        </div>
      </section>`;
  }

  _quickActions() {
    const snap = this._snapshot();
    const vacuum = snap.vacuum;
    const available = snap.connected && !snap.unreliable && this._available(vacuum);
    const cleaning = available && vacuum?.state === "cleaning";
    const paused = available && vacuum?.state === "paused";
    return `
      <div class="quick-actions">
        <button class="action primary" data-action="start" ${available && !cleaning ? "" : "disabled"}>
          <span class="action-icon"><ha-icon icon="mdi:play"></ha-icon></span>
          <span><strong>${paused ? "Продолжить" : "Уборка"}</strong><span>${paused ? "Возобновить" : "Smart"}</span></span>
        </button>
        <button class="action" data-action="pause" ${available && cleaning ? "" : "disabled"}>
          <span class="action-icon"><ha-icon icon="mdi:pause"></ha-icon></span>
          <span><strong>Пауза</strong><span>Приостановить</span></span>
        </button>
        <button class="action" data-action="home" ${available ? "" : "disabled"}>
          <span class="action-icon"><ha-icon icon="mdi:home-import-outline"></ha-icon></span>
          <span><strong>Домой</strong><span>На станцию</span></span>
        </button>
      </div>`;
  }

  _overview() {
    const snap = this._snapshot();
    const robotLabel = snap.unavailable ? "Недоступен" : this._label(ROBOT_LABELS, snap.robot, "Нет данных");
    const stationLabel = snap.unavailable ? "Нет данных" : this._label(STATION_LABELS, snap.station, "Нет данных");
    const robotContext = snap.unavailable
      ? "Нет актуальной телеметрии"
      : snap.onDock === true
        ? "На базе"
        : snap.onDock === false
          ? "Не на базе"
          : "Положение неизвестно";
    const operation = snap.unavailable
      ? "Нет актуальной телеметрии"
      : snap.stationOperations.length
        ? snap.stationOperations.map((item) => STATION_OPERATION_LABELS[item] || item).join(" · ")
        : snap.missingStationDps.length
          ? "Часть телеметрии станции отсутствует"
          : "Активных операций нет";
    return `${this._hero()}${this._trustBanner(snap)}${this._quickActions()}
      <section class="card">
        <div class="section-title"><div><span class="eyebrow">Система</span><h2>Статусы</h2></div></div>
        <div class="status-grid">
          <button class="status-card" data-more="robot_status" type="button">
            <span class="status-icon"><ha-icon icon="mdi:robot-vacuum"></ha-icon></span>
            <span class="status-copy"><strong>Робот</strong><b>${escapeHtml(robotLabel)}</b><span>${escapeHtml(robotContext)}</span></span>
          </button>
          <button class="status-card" data-more="station_status" type="button">
            <span class="status-icon"><ha-icon icon="mdi:home-automation"></ha-icon></span>
            <span class="status-copy"><strong>Станция</strong><b>${escapeHtml(stationLabel)}</b><span>${escapeHtml(operation)}</span></span>
          </button>
        </div>
      </section>`;
  }

  _cleaning() {
    const snap = this._snapshot();
    const cleanTime = snap.unreliable ? null : this._stateValue("clean_time");
    const cleanArea = snap.unreliable ? null : this._stateValue("clean_area");
    return `${this._quickActions()}
      <section class="card">
        <div class="section-title"><div><span class="eyebrow">Текущая задача</span><h2>Уборка</h2></div></div>
        <div class="metric-grid">
          <div class="metric" data-more="clean_time"><ha-icon icon="mdi:timer-outline"></ha-icon><span>Время</span><strong>${cleanTime !== null ? `${escapeHtml(cleanTime)} мин` : "—"}</strong></div>
          <div class="metric" data-more="clean_area"><ha-icon icon="mdi:ruler-square"></ha-icon><span>Площадь</span><strong>${cleanArea !== null ? `${escapeHtml(cleanArea)} м²` : "—"}</strong></div>
        </div>
      </section>
      <section class="card">
        <div class="section-title"><div><span class="eyebrow">Профиль</span><h2>Как убирать</h2></div></div>
        <button class="drill-entry" type="button" data-detail="cleaning-settings">
          <span class="icon"><ha-icon icon="mdi:tune-variant"></ha-icon></span>
          <span><strong>Настройки уборки</strong><span>Всасывание, вода, громкость и «Не беспокоить»</span></span>
          <ha-icon icon="mdi:chevron-right"></ha-icon>
        </button>
      </section>
      <section class="future-card"><span class="icon"><ha-icon icon="mdi:map-outline"></ha-icon></span><div><span class="eyebrow">Следующий этап</span><strong>Карта и комнаты</strong><p>Комнатная и зональная уборка появятся после завершения безопасной поддержки в интеграции.</p></div></section>`;
  }

  _segmentControl(key, labels, columnsClass, title, hint) {
    const stateObj = this._state(key);
    const value = this._available(stateObj) && this._connectionState() === "connected" ? stateObj.state : null;
    const options = Object.entries(labels);
    return `<div class="segment-group" data-more="${key}">
      <div class="segment-label"><strong>${title}</strong><span>${hint}</span></div>
      <div class="segments ${columnsClass}">${options.map(([raw,label]) => `<button class="segment ${value === raw ? "active" : ""}" type="button" data-select-key="${key}" data-select-value="${raw}" ${value === null ? "disabled" : ""}>${label}</button>`).join("")}</div>
    </div>`;
  }

  _cleaningSettings() {
    const connected = this._connectionState() === "connected";
    const volume = this._state("volume");
    const dnd = this._state("do_not_disturb");
    const volumeValue = connected && this._available(volume) ? Number(volume.state) : null;
    const dndAvailable = connected && this._available(dnd);
    return `
      <section class="card">
        <div class="section-title"><div><span class="eyebrow">Уборка</span><h2>Параметры</h2></div></div>
        ${this._segmentControl("suction", SUCTION_LABELS, "three", "Мощность всасывания", this._label(SUCTION_LABELS, connected ? this._stateValue("suction") : null, "Нет данных"))}
        ${this._segmentControl("water", WATER_LABELS, "four", "Количество воды", this._label(WATER_LABELS, connected ? this._stateValue("water") : null, "Нет данных"))}
      </section>
      <section class="card">
        <div class="section-title"><div><span class="eyebrow">Звук</span><h2>Громкость</h2></div></div>
        <div class="slider-row" data-more="volume">
          <div class="slider-head"><div><strong>Голосовые уведомления</strong><span>Громкость сообщений робота</span></div><strong data-volume-label>${volumeValue === null ? "—" : `${Math.round(volumeValue)}%`}</strong></div>
          <input type="range" min="0" max="100" step="1" value="${volumeValue === null ? 0 : volumeValue}" data-volume ${volumeValue === null ? "disabled" : ""}>
        </div>
      </section>
      <section class="card">
        <div class="section-title"><div><span class="eyebrow">Поведение</span><h2>Автоматизация</h2></div></div>
        <button class="toggle-row" type="button" data-toggle="do_not_disturb" ${dndAvailable ? "" : "disabled"}>
          <span><strong>Не беспокоить</strong><small>Переключатель режима без расписания.</small></span><span class="toggle ${dndAvailable && dnd?.state === "on" ? "on" : ""}"></span>
        </button>
      </section>`;
  }

  _station() {
    const snap = this._snapshot();
    const stationLabel = snap.unavailable ? "Нет данных" : this._label(STATION_LABELS, snap.station, "Нет данных");
    const operation = snap.unavailable
      ? "Нет данных"
      : snap.stationOperations.length
        ? snap.stationOperations.map((item) => STATION_OPERATION_LABELS[item] || item).join(" · ")
        : snap.missingStationDps.length
          ? "Нет полного состояния"
          : "Ожидание";
    return `
      ${this._trustBanner(snap)}
      <section class="card station-hero" data-more="station_status">
        <div class="station-device"><ha-icon icon="mdi:home-automation"></ha-icon></div>
        <div><span class="eyebrow">Станция S8 OMNI</span><h2>${escapeHtml(stationLabel)}</h2><p>${snap.unavailable ? "Нет актуальной локальной телеметрии станции." : snap.station === "unknown" ? "Нет достоверного полного состояния станции." : `Текущая операция: ${escapeHtml(operation)}.`}</p></div>
      </section>
      <section class="card">
        <div class="info-list">
          <div class="info-row"><span>Робот</span><strong>${snap.unavailable ? "Нет данных" : snap.onDock === true ? "На базе" : snap.onDock === false ? "Не на базе" : "Неизвестно"}</strong></div>
          <div class="info-row"><span>Заряд</span><strong>${snap.battery === null ? "—" : `${Math.round(snap.battery)}%`}</strong></div>
          <div class="info-row"><span>Текущая операция</span><strong>${escapeHtml(operation)}</strong></div>
        </div>
      </section>
      <section class="card">
        <div class="section-title"><div><span class="eyebrow">Состояние</span><h2>Операции станции</h2></div></div>
        <div class="operation-list">
          ${this._operation("dust_collection", "Очистка пылесборника", "mdi:delete-sweep-outline")}
          ${this._operation("roller_cleaning", "Промывка / очистка", "mdi:waves")}
          ${this._operation("roller_drying", "Сушка", "mdi:weather-windy")}
        </div>
      </section>
      <section class="future-card"><span class="icon"><ha-icon icon="mdi:shield-check-outline"></ha-icon></span><div><strong>Управление станцией</strong><p>Кнопки операций появятся только после подтверждения публичных команд интеграции.</p></div></section>`;
  }

  _operation(key, label, icon) {
    const stateObj = this._state(key);
    const connected = this._connectionState() === "connected";
    const active = connected && stateObj?.state === "on";
    const text = !connected || !stateObj || stateObj.state === "unavailable" || stateObj.state === "unknown" ? "Нет данных" : active ? "Работает" : "Ожидание";
    return `<div class="operation ${active ? "active" : ""}" data-more="${key}"><span class="icon"><ha-icon icon="${icon}"></ha-icon></span><span><strong>${label}</strong><span>${text}</span></span><i></i></div>`;
  }

  _maintenance() {
    const connected = this._connectionState() === "connected";
    const fault = connected ? this._formatEntity("fault", "—") : "—";
    const child = this._state("child_lock");
    const childAvailable = connected && this._available(child);
    return `
      <section style="padding:8px 6px 14px"><span class="eyebrow">S8 OMNI</span><h2 style="font-size:34px;margin-top:5px">Обслуживание</h2><p style="color:var(--secondary-text-color);margin-top:6px">Остаточный ресурс расходников.</p></section>
      ${this._resource("filter_life", "Фильтр", "mdi:air-filter", connected)}
      ${this._resource("side_brush_life", "Боковая щётка", "mdi:fan", connected)}
      ${this._resource("main_brush_life", "Основная щётка", "mdi:brush", connected)}
      <section class="card">
        <div class="section-title"><div><span class="eyebrow">Система</span><h2>Защита и ошибки</h2></div></div>
        <div class="info-row" data-more="fault"><span>Fault</span><strong>${escapeHtml(fault)}</strong></div>
        <button class="toggle-row" type="button" data-toggle="child_lock" ${childAvailable ? "" : "disabled"}><span><strong>Блокировка от детей</strong><small>Защита кнопок робота</small></span><span class="toggle ${childAvailable && child?.state === "on" ? "on" : ""}"></span></button>
      </section>
      <section class="future-card"><span class="icon"><ha-icon icon="mdi:restore"></ha-icon></span><div><strong>Сброс ресурса</strong><p>Сброс станет доступен после завершения проверки безопасной команды.</p></div></section>`;
  }

  _resource(key, title, icon, connected = true) {
    const value = connected ? this._formatEntity(key, "—") : "—";
    return `<div class="resource" data-more="${key}"><span class="icon"><ha-icon icon="${icon}"></ha-icon></span><span><strong>${title}</strong><span>Остаточный ресурс от устройства</span></span><b>${escapeHtml(value)}</b></div>`;
  }

  _diagnostics() {
    const snap = this._snapshot();
    const attrs = snap.attrs || {};
    const deviceState = snap.unavailable ? "Недоступно" : snap.unreliable ? "Не подтверждено" : "Доступно";
    return `
      <section style="padding:8px 6px 14px"><span class="eyebrow">Технический экран</span><h2 style="font-size:34px;margin-top:5px">Диагностика</h2><p style="color:var(--secondary-text-color);margin-top:6px">Нормализованные и raw-значения интеграции.</p></section>
      <div class="diagnostic-strip"><div><span>Локальная связь</span><strong>${escapeHtml(this._connectionLabel())}</strong></div><div><span>Устройство</span><strong>${deviceState}</strong></div><div><span>Возраст данных</span><strong>${snap.age === null ? "—" : escapeHtml(this._formatDuration(snap.age))}</strong></div></div>
      <section class="card">
        <div class="section-title"><div><span class="eyebrow">Нормализовано</span><h2>Состояния</h2></div></div>
        <div class="info-list">
          ${this._diagRow("Composite", snap.composite)}
          ${this._diagRow("Robot status", snap.robot)}
          ${this._diagRow("Station status", snap.station)}
          ${this._diagRow("Station DP отсутствуют", snap.missingStationDps.length ? snap.missingStationDps.join(", ") : snap.unreliable ? "Нет актуальных данных" : "Нет")}
        </div>
      </section>
      <section class="card">
        <div class="section-title"><div><span class="eyebrow">Tuya</span><h2>Raw</h2></div></div>
        <div class="info-list">
          ${this._diagRow("DP5 status", attrs.raw_status)}
          ${this._diagRow("DP4 mode", attrs.mode)}
          ${this._diagRow("DP1 power_go", attrs.power_go)}
          ${this._diagRow("DP2 pause", attrs.pause)}
          ${this._diagRow("DP28 fault", attrs.fault)}
          ${this._diagRow("DP134 dp_dust", attrs.dp_dust)}
          ${this._diagRow("DP135 dp_roll_clean", attrs.dp_roll_clean)}
          ${this._diagRow("DP136 dp_roll_hot", attrs.dp_roll_hot)}
        </div>
      </section>
      <section class="card">
        <div class="section-title"><div><span class="eyebrow">Контракт</span><h2>Панель</h2></div></div>
        <div class="info-list">
          ${this._diagRow("Integration", this._panel?.config?.integration_version || "—")}
          ${this._diagRow("Dashboard", UI_VERSION)}
          ${this._diagRow("Bundle", "standalone")}
          ${this._diagRow("Route", "/dashboard-s8-omni")}
          ${this._diagRow("Owner", "ha-s8-omni")}
        </div>
      </section>`;
  }

  _diagRow(label, value) {
    const shown = value === null || value === undefined ? "—" : String(value);
    return `<div class="info-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(shown)}</strong></div>`;
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
    const items = [
      ["overview", "mdi:home-outline", "Обзор"],
      ["cleaning", "mdi:robot-vacuum", "Уборка"],
      ["station", "mdi:home-automation", "Станция"],
      ["maintenance", "mdi:tools", "Сервис"],
      ["diagnostics", "mdi:stethoscope", "Диагн."],
    ];
    const activeView = this._detail ? "cleaning" : this._view;
    return `<nav>${items.map(([view,icon,label]) => `<button type="button" data-view="${view}" class="${activeView === view ? "active" : ""}" aria-current="${activeView === view ? "page" : "false"}"><ha-icon icon="${icon}"></ha-icon><span>${label}</span></button>`).join("")}</nav>`;
  }

  _bind() {
    this.shadowRoot.querySelector("[data-header-back]")?.addEventListener("click", () => {
      if (this._detail) {
        this._detail = null;
        this._view = "cleaning";
        this._queueRender();
        return;
      }
      const parent = this._panel?.config?.parent_path || "/dashboard-actions";
      this._navigate(parent);
    });

    this.shadowRoot.querySelector("[data-refresh]")?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      if (!this._entityId("refresh") || button.disabled) return;
      button.disabled = true;
      button.classList.add("loading");
      try {
        await this._call("button", "press", "refresh");
      } finally {
        setTimeout(() => {
          button.disabled = false;
          button.classList.remove("loading");
        }, 700);
      }
    });

    this.shadowRoot.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", () => {
        this._detail = null;
        this._view = button.dataset.view;
        this._queueRender();
      });
    });

    this.shadowRoot.querySelectorAll("[data-detail]").forEach((button) => {
      button.addEventListener("click", () => {
        this._detail = button.dataset.detail;
        this._view = "cleaning";
        this._queueRender();
      });
    });

    this.shadowRoot.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", async () => {
        if (button.disabled) return;
        button.disabled = true;
        try {
          if (button.dataset.action === "start") await this._call("vacuum", "start", "vacuum");
          if (button.dataset.action === "pause") await this._call("vacuum", "pause", "vacuum");
          if (button.dataset.action === "home") await this._call("vacuum", "return_to_base", "vacuum");
        } finally {
          setTimeout(() => { button.disabled = false; }, 650);
        }
      });
    });

    this.shadowRoot.querySelectorAll("[data-select-key]").forEach((button) => {
      button.addEventListener("click", async () => {
        if (button.disabled) return;
        await this._call("select", "select_option", button.dataset.selectKey, { option: button.dataset.selectValue });
      });
    });

    const volume = this.shadowRoot.querySelector("[data-volume]");
    volume?.addEventListener("input", () => {
      const label = this.shadowRoot.querySelector("[data-volume-label]");
      if (label) label.textContent = `${volume.value}%`;
    });
    volume?.addEventListener("change", () => this._call("number", "set_value", "volume", { value: Number(volume.value) }));

    this.shadowRoot.querySelectorAll("[data-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.disabled) return;
        const key = button.dataset.toggle;
        const on = this._state(key)?.state === "on";
        this._call("switch", on ? "turn_off" : "turn_on", key);
      });
    });

    this.shadowRoot.querySelectorAll("[data-more]").forEach((node) => {
      let timer = null;
      const cancel = () => { if (timer) clearTimeout(timer); timer = null; };
      node.addEventListener("pointerdown", () => {
        cancel();
        timer = setTimeout(() => {
          timer = null;
          this._showMoreInfo(node.dataset.more);
        }, 520);
      });
      node.addEventListener("pointerup", cancel);
      node.addEventListener("pointercancel", cancel);
      node.addEventListener("pointerleave", cancel);
    });
  }

  _render() {
    if (!this.shadowRoot) return;
    if (!this._hass || !this._panel || this._registryLoading || !this._registryLoaded) {
      this.shadowRoot.innerHTML = `<style>${this._styles()}</style><main>${this._header()}<div class="content"><div class="loading"><div><ha-icon icon="mdi:robot-vacuum"></ha-icon><p>Подключаем интерфейс…</p></div></div></div>${this._nav()}</main>`;
      this._bind();
      return;
    }
    if (this._registryError) {
      this.shadowRoot.innerHTML = `<style>${this._styles()}</style><main>${this._header()}<div class="content"><div class="trust-banner"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><div><strong>Не удалось загрузить реестр сущностей</strong><span>${escapeHtml(this._registryError)}</span></div></div></div>${this._nav()}</main>`;
      this._bind();
      return;
    }

    this.shadowRoot.innerHTML = `<style>${this._styles()}</style><main>${this._header()}<div class="content">${this._body()}</div>${this._nav()}</main>`;
    this._bind();
  }
}

if (!customElements.get("s8-omni-panel")) {
  customElements.define("s8-omni-panel", S8OmniPanel);
}
