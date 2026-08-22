const DASHBOARD_VERSION = "v0.1.0";

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
  idle: "Ожидание",
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
  error: "Ошибка",
  unknown: "Состояние неизвестно",
};

const SUCTION_LABELS = { gentle: "Тихий", normal: "Нормальный", strong: "Сильный" };
const WATER_LABELS = { closed: "Закрыто", low: "Низкий", normal: "Средний", high: "Высокий" };
const MODE_LABELS = {
  smart: "Smart",
  zone: "Уборка зоны",
  pose: "Точка",
  part: "Частичная уборка",
  chargego: "Возврат на базу",
  wallfollow: "Вдоль стен",
  selectroom: "Уборка комнат",
};

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
];

class S8OmniPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._panel = null;
    this._view = "overview";
    this._entities = {};
    this._loadingRegistry = false;
    this._registryLoaded = false;
  }

  set hass(value) {
    this._hass = value;
    this._ensureRegistry();
    this._render();
  }

  set panel(value) {
    this._panel = value;
    this._ensureRegistry();
    this._render();
  }

  set narrow(_value) {}

  async _ensureRegistry() {
    if (!this._hass || !this._panel || this._loadingRegistry || this._registryLoaded) return;
    const entryId = this._panel?.config?.entry_id;
    if (!entryId) return;
    this._loadingRegistry = true;
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
      console.warn("S8 OMNI panel: entity registry lookup failed", err);
    } finally {
      this._loadingRegistry = false;
      this._render();
    }
  }

  _entityId(key) {
    return this._entities[key];
  }

  _state(key) {
    const id = this._entityId(key);
    return id && this._hass ? this._hass.states[id] : null;
  }

  _stateValue(key, fallback = null) {
    const state = this._state(key);
    if (!state || state.state === "unavailable" || state.state === "unknown") return fallback;
    return state.state;
  }

  _isUnavailable(key) {
    const state = this._state(key);
    return !state || state.state === "unavailable";
  }

  _label(map, value, fallback = "Нет данных") {
    if (value === null || value === undefined || value === "unavailable") return fallback;
    return map[value] || value;
  }

  _escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  async _call(domain, service, key, extra = {}) {
    const entityId = this._entityId(key);
    if (!entityId || !this._hass) return;
    await this._hass.callService(domain, service, { entity_id: entityId, ...extra });
  }

  _showMoreInfo(key) {
    const entityId = this._entityId(key);
    if (!entityId) return;
    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        detail: { entityId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  _bind() {
    this.shadowRoot.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", () => {
        this._view = button.dataset.view;
        this._render();
      });
    });

    this.shadowRoot.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", async () => {
        if (button.disabled) return;
        const action = button.dataset.action;
        button.disabled = true;
        try {
          if (action === "start") await this._call("vacuum", "start", "vacuum");
          if (action === "pause") await this._call("vacuum", "pause", "vacuum");
          if (action === "home") await this._call("vacuum", "return_to_base", "vacuum");
        } finally {
          setTimeout(() => { button.disabled = false; }, 800);
        }
      });
    });

    this.shadowRoot.querySelectorAll("select[data-control]").forEach((select) => {
      select.addEventListener("change", () => {
        this._call("select", "select_option", select.dataset.control, { option: select.value });
      });
    });

    this.shadowRoot.querySelectorAll("input[type=range][data-control]").forEach((slider) => {
      slider.addEventListener("change", () => {
        this._call("number", "set_value", slider.dataset.control, { value: Number(slider.value) });
      });
    });

    this.shadowRoot.querySelectorAll("button[data-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.toggle;
        const on = this._state(key)?.state === "on";
        this._call("switch", on ? "turn_off" : "turn_on", key);
      });
    });

    this.shadowRoot.querySelectorAll("[data-more]").forEach((node) => {
      let timer = null;
      const cancel = () => {
        if (timer) clearTimeout(timer);
        timer = null;
      };
      node.addEventListener("pointerdown", () => {
        cancel();
        timer = setTimeout(() => this._showMoreInfo(node.dataset.more), 550);
      });
      node.addEventListener("pointerup", cancel);
      node.addEventListener("pointercancel", cancel);
      node.addEventListener("pointerleave", cancel);
    });
  }

  _select(key, labels, title, filter = null) {
    const state = this._state(key);
    if (!state) return this._row(title, "Нет entity", key, true);
    if (state.state === "unavailable") return this._row(title, "Недоступно", key, true);
    let options = state.attributes.options || [];
    if (filter) options = options.filter(filter);
    const optionHtml = options
      .map((value) => `<option value="${this._escape(value)}" ${state.state === value ? "selected" : ""}>${this._escape(labels[value] || value)}</option>`)
      .join("");
    return `<div class="control-card" data-more="${key}"><div><div class="control-title">${title}</div><div class="control-sub">Долгое нажатие — more-info</div></div><select data-control="${key}">${optionHtml}</select></div>`;
  }

  _row(title, value, key = null, muted = false) {
    return `<div class="row ${muted ? "muted" : ""}" ${key ? `data-more="${key}"` : ""}><span>${title}</span><strong>${this._escape(value)}</strong></div>`;
  }

  _operationRow(key, title) {
    const state = this._state(key);
    const value = !state ? "Нет entity" : state.state === "unavailable" ? "Нет данных" : state.state === "on" ? "Активно" : "Ожидание";
    return this._row(title, value, key, !state || state.state === "unavailable");
  }

  _quickActions() {
    const robot = this._stateValue("robot_status", "unknown");
    const unavailable = this._isUnavailable("vacuum");
    const cleaning = ["cleaning", "zone_cleaning", "room_cleaning", "wall_following", "manual_control", "creating_map"].includes(robot);
    const returning = robot === "returning_to_dock";
    const paused = robot === "paused";
    return `<div class="quick-actions">
      <button class="primary" data-action="start" ${unavailable || (cleaning && !paused) || returning ? "disabled" : ""}><ha-icon icon="mdi:play"></ha-icon><span>${paused ? "Продолжить" : "Старт"}</span></button>
      <button data-action="pause" ${unavailable || !cleaning ? "disabled" : ""}><ha-icon icon="mdi:pause"></ha-icon><span>Пауза</span></button>
      <button data-action="home" ${unavailable || returning ? "disabled" : ""}><ha-icon icon="mdi:home-map-marker"></ha-icon><span>Домой</span></button>
    </div>`;
  }

  _hero() {
    const compositeState = this._state("composite_status");
    const vacuum = this._state("vacuum");
    const robot = this._stateValue("robot_status", "unknown");
    const station = this._stateValue("station_status", "unknown");
    const composite = compositeState?.state === "unavailable" || vacuum?.state === "unavailable"
      ? "Устройство недоступно"
      : this._label(COMPOSITE_LABELS, compositeState?.state || "unknown");
    const battery = this._stateValue("battery", vacuum?.attributes?.battery_level ?? null);
    const issue = vacuum?.state === "unavailable" || robot === "error" || robot === "unknown" || station === "unknown";
    const animationClass = robot.includes("clean") ? "cleaning" : robot === "returning_to_dock" ? "returning" : robot === "charging" ? "charging" : "";
    return `<section class="hero ${issue ? "attention" : ""}" data-more="vacuum">
      <div class="hero-head"><div><div class="eyebrow">S8 OMNI · ${DASHBOARD_VERSION}</div><h1>${this._escape(composite)}</h1></div><div class="robot-orb ${animationClass}"><ha-icon icon="mdi:robot-vacuum"></ha-icon></div></div>
      <div class="hero-grid">
        <div><span>Робот</span><strong>${this._escape(this._label(ROBOT_LABELS, robot))}</strong></div>
        <div><span>АКБ</span><strong>${battery !== null ? `${this._escape(battery)}%` : "Нет данных"}</strong></div>
        <div><span>Станция</span><strong>${this._escape(this._label(STATION_LABELS, station))}</strong></div>
      </div>
    </section>`;
  }

  _overview() {
    const cleanTime = this._stateValue("clean_time");
    const cleanArea = this._stateValue("clean_area");
    const fault = this._stateValue("fault", "—");
    const robot = this._stateValue("robot_status", "unknown");
    const station = this._stateValue("station_status", "unknown");
    const alert = this._isUnavailable("vacuum")
      ? `<div class="alert"><ha-icon icon="mdi:wifi-off"></ha-icon><div><strong>S8 OMNI недоступен</strong><span>Последняя известная телеметрия не считается текущим нормальным состоянием.</span></div></div>`
      : robot === "error"
        ? `<div class="alert"><ha-icon icon="mdi:alert-circle"></ha-icon><div><strong>Ошибка робота</strong><span>Fault: ${this._escape(fault)}</span></div></div>`
        : robot === "unknown" || station === "unknown"
          ? `<div class="alert subtle"><ha-icon icon="mdi:help-circle-outline"></ha-icon><div><strong>Неполные данные</strong><span>Unknown не трактуется как ожидание.</span></div></div>`
          : "";
    return `${this._hero()}${alert}${this._quickActions()}
      <section class="card"><div class="section-title"><span>Сейчас</span></div>
        <div class="metrics"><div><span>Время уборки</span><strong>${cleanTime !== null ? `${this._escape(cleanTime)} мин` : "—"}</strong></div><div><span>Площадь</span><strong>${cleanArea !== null ? `${this._escape(cleanArea)} м²` : "—"}</strong></div></div>
      </section>
      <section class="card"><div class="section-title"><span>Станция OMNI</span><button class="link" data-view="station">Открыть</button></div>
        ${this._operationRow("dust_collection", "Очистка пылесборника")}
        ${this._operationRow("roller_cleaning", "Промывка / очистка")}
        ${this._operationRow("roller_drying", "Сушка")}
      </section>`;
  }

  _cleaning() {
    const mode = this._stateValue("mode");
    const volume = this._state("volume");
    const dnd = this._state("do_not_disturb");
    return `${this._hero()}${this._quickActions()}
      <section class="card"><div class="section-title"><span>Уборка</span></div>
        ${this._row("Текущий режим", this._label(MODE_LABELS, mode), "mode")}
        ${this._select("suction", SUCTION_LABELS, "Мощность всасывания")}
        ${this._select("water", WATER_LABELS, "Количество воды")}
        ${volume ? `<div class="slider-card" data-more="volume"><div><span>Громкость</span><strong>${this._escape(volume.state)}%</strong></div><input data-control="volume" type="range" min="0" max="100" step="1" value="${this._escape(volume.state)}" ${volume.state === "unavailable" ? "disabled" : ""}></div>` : ""}
      </section>
      <section class="card"><div class="section-title"><span>Поведение</span></div>
        ${dnd ? `<button class="toggle-row" data-toggle="do_not_disturb"><span><strong>Не беспокоить</strong><small>Временной интервал будет добавлен после публичного API DP33.</small></span><span class="toggle ${dnd.state === "on" ? "on" : ""}"></span></button>` : ""}
      </section>
      <section class="card placeholder"><ha-icon icon="mdi:map-outline"></ha-icon><div><strong>Карта / комнаты</strong><span>Место зарезервировано. Комнатная и зональная уборка появятся только после стабильного публичного API интеграции.</span></div></section>`;
  }

  _station() {
    const stationState = this._state("station_status");
    const composite = this._state("composite_status");
    const attrs = composite?.attributes || {};
    const onDock = attrs.robot_on_dock === true ? "На базе" : attrs.robot_on_dock === false ? "Не на базе" : "Неизвестно";
    const battery = this._stateValue("battery");
    return `<section class="page-head"><div class="eyebrow">OMNI</div><h1>Станция</h1><p>${this._escape(this._label(STATION_LABELS, stationState?.state || "unknown"))}</p></section>
      <section class="card">
        ${this._row("Робот", onDock, "composite_status")}
        ${this._row("Заряд", battery !== null ? `${battery}%` : "Нет данных", "battery")}
        ${this._row("Текущая операция", this._label(STATION_LABELS, stationState?.state || "unknown"), "station_status")}
      </section>
      <section class="card"><div class="section-title"><span>Операции станции</span></div>
        ${this._operationRow("dust_collection", "Очистка пылесборника")}
        ${this._operationRow("roller_cleaning", "Промывка / очистка")}
        ${this._operationRow("roller_drying", "Сушка")}
      </section>
      <section class="card placeholder"><ha-icon icon="mdi:shield-check-outline"></ha-icon><div><strong>Управление станцией не подменяется DP-записями</strong><span>Кнопки появятся только после проверенных entity/service в ha-s8-omni.</span></div></section>`;
  }

  _maintenance() {
    const fault = this._stateValue("fault", "—");
    const child = this._state("child_lock");
    return `<section class="page-head"><div class="eyebrow">S8 OMNI</div><h1>Обслуживание</h1><p>Ресурс показывается только в фактически доступных минутах.</p></section>
      <section class="card"><div class="section-title"><span>Расходные материалы</span></div>
        ${this._row("Фильтр", this._stateValue("filter_life") !== null ? `${this._stateValue("filter_life")} мин` : "Нет данных", "filter_life")}
        ${this._row("Боковая щётка", this._stateValue("side_brush_life") !== null ? `${this._stateValue("side_brush_life")} мин` : "Нет данных", "side_brush_life")}
        ${this._row("Основная щётка", this._stateValue("main_brush_life") !== null ? `${this._stateValue("main_brush_life")} мин` : "Нет данных", "main_brush_life")}
      </section>
      <section class="card"><div class="section-title"><span>Состояние</span></div>
        ${this._row("Fault", fault, "fault", fault !== "0" && fault !== 0 && fault !== "—")}
        ${child ? `<button class="toggle-row" data-toggle="child_lock"><span><strong>Блокировка от детей</strong><small>Публичная сущность интеграции</small></span><span class="toggle ${child.state === "on" ? "on" : ""}"></span></button>` : ""}
      </section>
      <section class="card placeholder"><ha-icon icon="mdi:restore"></ha-icon><div><strong>Reset расходников</strong><span>Не выводится до end-to-end проверки DP18/20/22.</span></div></section>`;
  }

  _diagnostics() {
    const composite = this._state("composite_status");
    const age = this._stateValue("telemetry_age");
    const attrs = composite?.attributes || {};
    return `<section class="page-head"><div class="eyebrow">Технический экран</div><h1>Диагностика</h1><p>Raw значения остаются здесь и не выходят на пользовательский Overview.</p></section>
      <section class="card">
        ${this._row("Доступность устройства", this._isUnavailable("vacuum") ? "Недоступно" : "Доступно", "vacuum", this._isUnavailable("vacuum"))}
        ${this._row("Возраст телеметрии", age !== null ? `${age} с` : "Нет данных", "telemetry_age")}
        ${this._row("Composite", composite?.state || "Нет entity", "composite_status")}
        ${this._row("Robot status", this._state("robot_status")?.state || "Нет entity", "robot_status")}
        ${this._row("Raw status", attrs.raw_status ?? "Нет данных", "composite_status")}
        ${this._row("Mode", attrs.mode ?? this._state("mode")?.state ?? "Нет данных", "mode")}
        ${this._row("Fault", attrs.fault ?? this._state("fault")?.state ?? "Нет данных", "fault")}
        ${this._row("Station status", this._state("station_status")?.state || "Нет entity", "station_status")}
        ${this._row("dp_dust", this._state("dust_collection")?.state || "Нет entity", "dust_collection", this._isUnavailable("dust_collection"))}
        ${this._row("dp_roll_clean", this._state("roller_cleaning")?.state || "Нет entity", "roller_cleaning", this._isUnavailable("roller_cleaning"))}
        ${this._row("dp_roll_hot", this._state("roller_drying")?.state || "Нет entity", "roller_drying", this._isUnavailable("roller_drying"))}
      </section>
      <section class="card"><div class="section-title"><span>Контракт</span></div>
        ${this._row("Integration", this._panel?.config?.integration_version || "—")}
        ${this._row("Dashboard", DASHBOARD_VERSION)}
        ${this._row("Route", "/dashboard-s8-omni")}
      </section>`;
  }

  _body() {
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
      ["station", "mdi:ev-station", "Станция"],
      ["maintenance", "mdi:tools", "Сервис"],
      ["diagnostics", "mdi:stethoscope", "Диагн."],
    ];
    return `<nav>${items.map(([view, icon, label]) => `<button data-view="${view}" class="${this._view === view ? "active" : ""}"><ha-icon icon="${icon}"></ha-icon><span>${label}</span></button>`).join("")}</nav>`;
  }

  _render() {
    if (!this.shadowRoot) return;
    if (!this._hass || !this._panel) {
      this.shadowRoot.innerHTML = `<div style="padding:24px">S8 OMNI…</div>`;
      return;
    }
    this.shadowRoot.innerHTML = `<style>${this._styles()}</style><main><div class="content">${this._body()}</div>${this._nav()}</main>`;
    this._bind();
  }

  _styles() {
    return `
      :host { display:block; min-height:100%; background:var(--primary-background-color); color:var(--primary-text-color); font-family:var(--paper-font-body1_-_font-family, system-ui, -apple-system, sans-serif); }
      * { box-sizing:border-box; }
      main { min-height:100vh; overflow-x:hidden; }
      .content { width:min(100%, 620px); margin:0 auto; padding:16px 14px 18px; }
      h1 { margin:5px 0 0; font-size:28px; line-height:1.15; letter-spacing:-.4px; }
      p { margin:7px 0 0; color:var(--secondary-text-color); line-height:1.4; }
      .eyebrow { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--secondary-text-color); }
      .hero, .card, .page-head { background:var(--card-background-color); border-radius:22px; padding:18px; margin-bottom:12px; box-shadow:var(--ha-card-box-shadow, 0 2px 8px rgba(0,0,0,.08)); }
      .hero { padding:20px; }
      .hero.attention { outline:1px solid var(--warning-color, #f0a020); }
      .hero-head { display:flex; align-items:center; justify-content:space-between; gap:12px; }
      .robot-orb { width:62px; height:62px; flex:0 0 62px; border-radius:50%; display:grid; place-items:center; background:color-mix(in srgb, var(--primary-color) 13%, transparent); }
      .robot-orb ha-icon { --mdc-icon-size:34px; color:var(--primary-color); }
      .robot-orb.cleaning ha-icon { animation:clean 1.8s ease-in-out infinite; }
      .robot-orb.returning ha-icon { animation:returning 1.2s ease-in-out infinite; }
      .robot-orb.charging { animation:pulse 1.7s ease-in-out infinite; }
      @keyframes clean { 0%,100%{transform:rotate(-8deg)} 50%{transform:rotate(8deg)} }
      @keyframes returning { 0%,100%{transform:translateX(-3px)} 50%{transform:translateX(3px)} }
      @keyframes pulse { 0%,100%{opacity:.65} 50%{opacity:1} }
      @media (prefers-reduced-motion: reduce) { * { animation:none !important; } }
      .hero-grid { display:grid; grid-template-columns:1fr 72px 1.15fr; gap:10px; margin-top:20px; }
      .hero-grid div, .metrics div { min-width:0; }
      .hero-grid span, .metrics span { display:block; color:var(--secondary-text-color); font-size:12px; margin-bottom:4px; }
      .hero-grid strong { display:block; font-size:14px; line-height:1.25; overflow-wrap:anywhere; }
      .quick-actions { display:grid; grid-template-columns:1.25fr 1fr 1fr; gap:10px; margin:12px 0; }
      .quick-actions button { min-height:62px; border:0; border-radius:18px; background:var(--card-background-color); color:var(--primary-text-color); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; font:inherit; font-weight:700; box-shadow:var(--ha-card-box-shadow, 0 2px 8px rgba(0,0,0,.08)); }
      .quick-actions button.primary { background:var(--primary-color); color:var(--text-primary-color, white); }
      button:disabled { opacity:.38; }
      .section-title { display:flex; align-items:center; justify-content:space-between; gap:12px; font-size:17px; font-weight:800; margin-bottom:8px; }
      .link { border:0; background:none; color:var(--primary-color); font:inherit; font-weight:700; padding:8px; }
      .metrics { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
      .metrics div { background:var(--secondary-background-color); border-radius:16px; padding:14px; }
      .metrics strong { font-size:21px; }
      .row { min-height:54px; display:flex; align-items:center; justify-content:space-between; gap:18px; border-bottom:1px solid var(--divider-color); }
      .row:last-child { border-bottom:0; }
      .row span { color:var(--primary-text-color); }
      .row strong { text-align:right; max-width:55%; overflow-wrap:anywhere; }
      .row.muted { color:var(--secondary-text-color); }
      .row.muted strong { color:var(--secondary-text-color); }
      .alert { display:flex; gap:12px; padding:14px 16px; border-radius:18px; margin:12px 0; background:color-mix(in srgb, var(--error-color) 12%, var(--card-background-color)); }
      .alert.subtle { background:color-mix(in srgb, var(--warning-color, #f0a020) 12%, var(--card-background-color)); }
      .alert ha-icon { flex:0 0 auto; color:var(--error-color); }
      .alert div { display:flex; flex-direction:column; gap:4px; }
      .alert span { color:var(--secondary-text-color); font-size:13px; line-height:1.35; }
      .control-card, .slider-card { min-height:70px; display:flex; align-items:center; justify-content:space-between; gap:12px; border-bottom:1px solid var(--divider-color); }
      .control-title { font-weight:700; }
      .control-sub { margin-top:3px; color:var(--secondary-text-color); font-size:11px; }
      select { max-width:48%; min-height:44px; border:1px solid var(--divider-color); border-radius:12px; padding:0 10px; background:var(--secondary-background-color); color:var(--primary-text-color); font:inherit; }
      .slider-card { display:block; padding:12px 0; }
      .slider-card > div { display:flex; justify-content:space-between; margin-bottom:8px; }
      input[type=range] { width:100%; min-height:38px; accent-color:var(--primary-color); }
      .toggle-row { width:100%; min-height:68px; border:0; border-bottom:1px solid var(--divider-color); background:none; color:inherit; display:flex; align-items:center; justify-content:space-between; gap:16px; text-align:left; font:inherit; padding:8px 0; }
      .toggle-row span:first-child { display:flex; flex-direction:column; gap:4px; }
      .toggle-row small { color:var(--secondary-text-color); line-height:1.3; }
      .toggle { width:48px; height:28px; border-radius:20px; background:var(--disabled-color); position:relative; flex:0 0 auto; }
      .toggle:after { content:""; position:absolute; width:22px; height:22px; top:3px; left:3px; border-radius:50%; background:white; transition:transform .2s; }
      .toggle.on { background:var(--primary-color); }
      .toggle.on:after { transform:translateX(20px); }
      .placeholder { display:flex; align-items:flex-start; gap:14px; box-shadow:none; border:1px dashed var(--divider-color); background:transparent; }
      .placeholder ha-icon { color:var(--secondary-text-color); --mdc-icon-size:28px; }
      .placeholder div { display:flex; flex-direction:column; gap:5px; }
      .placeholder span { color:var(--secondary-text-color); font-size:13px; line-height:1.4; }
      .page-head { box-shadow:none; background:transparent; padding:12px 4px 16px; }
      nav { position:sticky; bottom:0; z-index:5; display:grid; grid-template-columns:repeat(5,1fr); gap:2px; background:color-mix(in srgb, var(--card-background-color) 94%, transparent); border-top:1px solid var(--divider-color); backdrop-filter:blur(16px); padding:7px max(6px, env(safe-area-inset-right)) calc(7px + env(safe-area-inset-bottom)) max(6px, env(safe-area-inset-left)); }
      nav button { min-width:0; min-height:54px; border:0; border-radius:14px; background:transparent; color:var(--secondary-text-color); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; font:inherit; font-size:10px; }
      nav button.active { color:var(--primary-color); background:color-mix(in srgb, var(--primary-color) 10%, transparent); }
      nav ha-icon { --mdc-icon-size:23px; }
      @media (min-width:760px) { .content { width:min(100%, 920px); padding-top:24px; } .hero-grid { grid-template-columns:1.1fr .7fr 1.2fr; } .quick-actions { grid-template-columns:repeat(3,1fr); } nav { width:min(100%, 620px); margin:0 auto 10px; border:1px solid var(--divider-color); border-radius:20px; } }
    `;
  }
}

if (!customElements.get("s8-omni-panel")) {
  customElements.define("s8-omni-panel", S8OmniPanel);
}
