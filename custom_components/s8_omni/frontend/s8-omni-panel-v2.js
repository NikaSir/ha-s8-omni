const DASHBOARD_VERSION = "v0.2.0";

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
];

const CLEANING_STATES = new Set([
  "cleaning",
  "zone_cleaning",
  "room_cleaning",
  "wall_following",
  "manual_control",
  "creating_map",
]);

const STATION_ACTIVE = new Set(["dust_collection", "roller_cleaning", "drying", "multiple_operations"]);

const STATUS_META = {
  idle: { tone: "good", icon: "mdi:robot-vacuum", hint: "Робот готов к следующей уборке" },
  cleaning: { tone: "active", icon: "mdi:robot-vacuum", hint: "Уборка выполняется" },
  zone_cleaning: { tone: "active", icon: "mdi:selection-marker", hint: "Уборка выбранной зоны" },
  room_cleaning: { tone: "active", icon: "mdi:floor-plan", hint: "Уборка выбранных комнат" },
  paused: { tone: "warn", icon: "mdi:pause-circle-outline", hint: "Можно продолжить или вернуть робот домой" },
  returning_to_dock: { tone: "warn", icon: "mdi:home-import-outline", hint: "Робот движется к станции OMNI" },
  charging: { tone: "charge", icon: "mdi:battery-charging", hint: "Робот на станции и заряжает аккумулятор" },
  charged: { tone: "good", icon: "mdi:battery-check", hint: "Робот на станции, заряд завершён" },
  sleeping: { tone: "neutral", icon: "mdi:sleep", hint: "Робот находится в спящем режиме" },
  repositioning: { tone: "warn", icon: "mdi:crosshairs-gps", hint: "Робот определяет своё положение" },
  docked_dust_collection: { tone: "station", icon: "mdi:delete-sweep-outline", hint: "Станция очищает пылесборник робота" },
  docked_roller_cleaning: { tone: "station", icon: "mdi:waves", hint: "Станция выполняет промывку / очистку" },
  docked_drying: { tone: "station", icon: "mdi:weather-windy", hint: "Станция выполняет сушку" },
  docked_station_active: { tone: "station", icon: "mdi:home-automation", hint: "Станция выполняет несколько операций" },
  error: { tone: "bad", icon: "mdi:alert-octagon-outline", hint: "Откройте диагностику и проверьте Fault" },
  unknown: { tone: "bad", icon: "mdi:help-circle-outline", hint: "Недостаточно достоверной телеметрии" },
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
    this._entities = {};
    this._loadingRegistry = false;
    this._registryLoaded = false;
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
    if (!this._hass || !this._panel || this._loadingRegistry || this._registryLoaded) return;
    const entryId = this._panel?.config?.entry_id;
    if (!entryId) return;

    this._loadingRegistry = true;
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
      this._loadingRegistry = false;
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

  _isUnavailable(key) {
    const stateObj = this._state(key);
    return !stateObj || stateObj.state === "unavailable";
  }

  _label(map, value, fallback = "Нет данных") {
    if (value === null || value === undefined || value === "unavailable" || value === "unknown") {
      return value === "unknown" && map.unknown ? map.unknown : fallback;
    }
    return map[value] || value;
  }

  _formatDuration(seconds) {
    const value = Number(seconds);
    if (!Number.isFinite(value)) return "Нет данных";
    if (value < 60) return `${Math.round(value)} с`;
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

  _connectionLabel() {
    const stateObj = this._state("local_connection");
    if (!stateObj) return this._isUnavailable("vacuum") ? "Нет связи" : "Локально";
    if (stateObj.state === "unavailable" || stateObj.state === "unknown") return "Неизвестно";
    return stateObj.state === "on" ? "Локально" : "Нет связи";
  }

  _snapshot() {
    const compositeObj = this._state("composite_status");
    const vacuum = this._state("vacuum");
    const robot = this._stateValue("robot_status", "unknown");
    const station = this._stateValue("station_status", "unknown");
    const unavailable = !vacuum || vacuum.state === "unavailable";
    const compositeKey = unavailable ? "unknown" : this._stateValue("composite_status", "unknown");
    const battery = this._numeric("battery") ?? Number(vacuum?.attributes?.battery_level);
    const batteryValue = Number.isFinite(battery) ? Math.max(0, Math.min(100, battery)) : null;
    const attrs = compositeObj?.attributes || {};
    return {
      compositeObj,
      attrs,
      vacuum,
      robot,
      station,
      unavailable,
      compositeKey,
      battery: batteryValue,
      mode: this._stateValue("mode", attrs.mode ?? null),
      age: this._stateValue("telemetry_age"),
      onDock: attrs.robot_on_dock,
      stationOperations: Array.isArray(attrs.station_operations) ? attrs.station_operations : [],
    };
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
        this._queueRender();
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
          setTimeout(() => {
            button.disabled = false;
          }, 700);
        }
      });
    });

    this.shadowRoot.querySelectorAll("select[data-control]").forEach((select) => {
      select.addEventListener("change", () => {
        this._call("select", "select_option", select.dataset.control, { option: select.value });
      });
    });

    this.shadowRoot.querySelectorAll("input[type=range][data-control]").forEach((slider) => {
      slider.addEventListener("input", () => {
        const output = this.shadowRoot.querySelector(`[data-range-value="${slider.dataset.control}"]`);
        if (output) output.textContent = `${slider.value}%`;
      });
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
        timer = setTimeout(() => this._showMoreInfo(node.dataset.more), 520);
      });
      node.addEventListener("pointerup", cancel);
      node.addEventListener("pointercancel", cancel);
      node.addEventListener("pointerleave", cancel);
    });
  }

  _row(title, value, key = null, tone = "") {
    return `<div class="data-row ${tone}" ${key ? `data-more="${escapeHtml(key)}"` : ""}>
      <span>${escapeHtml(title)}</span><strong>${escapeHtml(value)}</strong>
    </div>`;
  }

  _select(key, labels, title) {
    const stateObj = this._state(key);
    if (!stateObj) return this._row(title, "Нет entity", key, "muted");
    if (stateObj.state === "unavailable") return this._row(title, "Недоступно", key, "muted");
    const options = stateObj.attributes.options || [];
    const optionHtml = options
      .map((value) => `<option value="${escapeHtml(value)}" ${stateObj.state === value ? "selected" : ""}>${escapeHtml(labels[value] || value)}</option>`)
      .join("");
    return `<div class="control-row" data-more="${escapeHtml(key)}">
      <div><strong>${escapeHtml(title)}</strong><span>Удерживать — more-info</span></div>
      <select data-control="${escapeHtml(key)}">${optionHtml}</select>
    </div>`;
  }

  _operationTile(key, title, icon) {
    const stateObj = this._state(key);
    const unavailable = !stateObj || stateObj.state === "unavailable" || stateObj.state === "unknown";
    const active = !unavailable && stateObj.state === "on";
    const value = unavailable ? "Нет данных" : active ? "Работает" : "Ожидание";
    return `<div class="operation-tile ${active ? "active" : ""} ${unavailable ? "unavailable" : ""}" data-more="${escapeHtml(key)}">
      <div class="operation-icon"><ha-icon icon="${icon}"></ha-icon></div>
      <div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(value)}</span></div>
      <i></i>
    </div>`;
  }

  _quickActions() {
    const snap = this._snapshot();
    const cleaning = CLEANING_STATES.has(snap.robot);
    const returning = snap.robot === "returning_to_dock";
    const paused = snap.robot === "paused";
    const unavailable = snap.unavailable;
    return `<section class="action-deck" aria-label="Основные действия">
      <button class="action primary" data-action="start" ${unavailable || (cleaning && !paused) || returning ? "disabled" : ""}>
        <span class="action-icon"><ha-icon icon="${paused ? "mdi:play-circle" : "mdi:play"}"></ha-icon></span>
        <span><strong>${paused ? "Продолжить" : "Уборка"}</strong><small>${paused ? "Продолжить задачу" : "Smart"}</small></span>
      </button>
      <button class="action" data-action="pause" ${unavailable || !cleaning ? "disabled" : ""}>
        <span class="action-icon"><ha-icon icon="mdi:pause"></ha-icon></span>
        <span><strong>Пауза</strong><small>Приостановить</small></span>
      </button>
      <button class="action" data-action="home" ${unavailable || returning ? "disabled" : ""}>
        <span class="action-icon"><ha-icon icon="mdi:home-import-outline"></ha-icon></span>
        <span><strong>Домой</strong><small>На станцию</small></span>
      </button>
    </section>`;
  }

  _trustBanner(snap) {
    if (snap.unavailable) {
      return `<div class="trust-banner bad"><ha-icon icon="mdi:wifi-off"></ha-icon><div><strong>S8 OMNI недоступен</strong><span>Последние известные значения не считаются текущим нормальным состоянием.</span></div></div>`;
    }
    if (snap.robot === "error") {
      return `<div class="trust-banner bad"><ha-icon icon="mdi:alert-octagon-outline"></ha-icon><div><strong>Ошибка робота</strong><span>Fault: ${escapeHtml(this._stateValue("fault", "Нет данных"))}</span></div></div>`;
    }
    if (snap.robot === "unknown" || snap.station === "unknown") {
      return `<div class="trust-banner warn"><ha-icon icon="mdi:shield-alert-outline"></ha-icon><div><strong>Телеметрия неполная</strong><span>Unknown / unavailable не преобразуются в «Ожидание».</span></div></div>`;
    }
    return "";
  }

  _hero() {
    const snap = this._snapshot();
    const meta = STATUS_META[snap.compositeKey] || STATUS_META.unknown;
    const title = snap.unavailable ? "Устройство недоступно" : this._label(COMPOSITE_LABELS, snap.compositeKey, "Состояние неизвестно");
    const batteryText = snap.battery === null ? "—" : `${Math.round(snap.battery)}%`;
    const batteryWidth = snap.battery === null ? 0 : snap.battery;
    const atDock = snap.onDock === true || STATION_ACTIVE.has(snap.station) || ["charging", "charged"].includes(snap.robot);
    const robotClass = atDock ? "at-dock" : snap.robot === "returning_to_dock" ? "returning" : "away";
    const activityClass = CLEANING_STATES.has(snap.robot) ? "cleaning" : snap.robot === "returning_to_dock" ? "returning-motion" : snap.robot === "charging" ? "charging" : STATION_ACTIVE.has(snap.station) ? "station-work" : "";
    const modeLabel = this._label(MODE_LABELS, snap.mode, "Режим не определён");
    const hint = CLEANING_STATES.has(snap.robot) ? `${modeLabel} · ${meta.hint}` : meta.hint;

    return `<section class="hero tone-${meta.tone}" data-more="vacuum">
      <div class="hero-top">
        <div><div class="eyebrow">S8 OMNI · ${DASHBOARD_VERSION}</div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(hint)}</p></div>
        <div class="connection-chip ${this._connectionLabel() === "Нет связи" ? "bad" : ""}"><i></i>${escapeHtml(this._connectionLabel())}</div>
      </div>

      <div class="vacuum-stage ${activityClass}">
        <div class="stage-caption"><span>Робот</span><strong>${escapeHtml(this._label(ROBOT_LABELS, snap.robot, "Нет данных"))}</strong></div>
        <div class="track"><span></span></div>
        <div class="robot-disc ${robotClass}"><ha-icon icon="${meta.icon}"></ha-icon><span></span></div>
        <div class="dock"><div class="dock-top"><i></i></div><div class="dock-body"><ha-icon icon="mdi:home-automation"></ha-icon></div><span>OMNI</span></div>
        <div class="stage-station"><span>Станция</span><strong>${escapeHtml(this._label(STATION_LABELS, snap.station, "Нет данных"))}</strong></div>
      </div>

      <div class="hero-facts">
        <div class="battery-fact" data-more="battery"><span>АКБ</span><strong>${batteryText}</strong><div class="battery-bar"><i style="width:${batteryWidth}%"></i></div></div>
        <div data-more="mode"><span>Режим</span><strong>${escapeHtml(modeLabel)}</strong></div>
        <div data-more="telemetry_age"><span>Телеметрия</span><strong>${snap.age === null ? "—" : escapeHtml(this._formatDuration(snap.age))}</strong></div>
      </div>
    </section>`;
  }

  _overview() {
    const snap = this._snapshot();
    const cleanTime = this._stateValue("clean_time");
    const cleanArea = this._stateValue("clean_area");
    return `${this._hero()}${this._trustBanner(snap)}${this._quickActions()}
      <section class="card now-card">
        <div class="section-title"><div><span class="eyebrow">Текущая задача</span><h2>Уборка</h2></div><button class="text-link" data-view="cleaning">Настроить</button></div>
        <div class="metric-grid">
          <div data-more="clean_time"><ha-icon icon="mdi:timer-outline"></ha-icon><span>Время</span><strong>${cleanTime !== null ? `${escapeHtml(cleanTime)} мин` : "—"}</strong></div>
          <div data-more="clean_area"><ha-icon icon="mdi:ruler-square"></ha-icon><span>Площадь</span><strong>${cleanArea !== null ? `${escapeHtml(cleanArea)} м²` : "—"}</strong></div>
          <div data-more="suction"><ha-icon icon="mdi:fan"></ha-icon><span>Всасывание</span><strong>${escapeHtml(this._label(SUCTION_LABELS, this._stateValue("suction"), "—"))}</strong></div>
          <div data-more="water"><ha-icon icon="mdi:water-outline"></ha-icon><span>Вода</span><strong>${escapeHtml(this._label(WATER_LABELS, this._stateValue("water"), "—"))}</strong></div>
        </div>
      </section>
      <section class="card station-card">
        <div class="section-title"><div><span class="eyebrow">Док-станция</span><h2>OMNI</h2></div><button class="text-link" data-view="station">Открыть</button></div>
        <div class="operation-grid">
          ${this._operationTile("dust_collection", "Пылесборник", "mdi:delete-sweep-outline")}
          ${this._operationTile("roller_cleaning", "Промывка", "mdi:waves")}
          ${this._operationTile("roller_drying", "Сушка", "mdi:weather-windy")}
        </div>
      </section>`;
  }

  _cleaning() {
    const snap = this._snapshot();
    const volume = this._state("volume");
    const dnd = this._state("do_not_disturb");
    const volumeValue = this._available(volume) ? Number(volume.state) : null;
    return `${this._hero()}${this._trustBanner(snap)}${this._quickActions()}
      <section class="card">
        <div class="section-title"><div><span class="eyebrow">Профиль</span><h2>Параметры уборки</h2></div></div>
        ${this._row("Текущий режим", this._label(MODE_LABELS, this._stateValue("mode"), "Нет данных"), "mode")}
        ${this._select("suction", SUCTION_LABELS, "Мощность всасывания")}
        ${this._select("water", WATER_LABELS, "Количество воды")}
        ${volume ? `<div class="slider-row" data-more="volume"><div><strong>Громкость</strong><span>Голосовые уведомления робота</span></div><output data-range-value="volume">${volumeValue === null ? "—" : `${Math.round(volumeValue)}%`}</output><input data-control="volume" type="range" min="0" max="100" step="1" value="${volumeValue === null ? 0 : volumeValue}" ${volumeValue === null ? "disabled" : ""}></div>` : ""}
      </section>
      <section class="card">
        <div class="section-title"><div><span class="eyebrow">Поведение</span><h2>Автоматизация</h2></div></div>
        ${dnd ? `<button class="toggle-row" data-toggle="do_not_disturb"><span><strong>Не беспокоить</strong><small>Расписание появится после подтверждения публичного API DP33.</small></span><span class="toggle ${dnd.state === "on" ? "on" : ""}"></span></button>` : this._row("Не беспокоить", "Нет entity")}
      </section>
      <section class="future-card"><div class="future-icon"><ha-icon icon="mdi:map-outline"></ha-icon></div><div><span class="eyebrow">Следующий этап</span><strong>Карта и комнаты</strong><p>Архитектурное место готово. Комнатная и зональная уборка будут подключены только через безопасный публичный API ha-s8-omni.</p></div></section>`;
  }

  _station() {
    const snap = this._snapshot();
    const stationLabel = this._label(STATION_LABELS, snap.station, "Нет данных");
    const dockLabel = snap.onDock === true ? "На базе" : snap.onDock === false ? "Не на базе" : "Неизвестно";
    const battery = snap.battery === null ? "Нет данных" : `${Math.round(snap.battery)}%`;
    return `<section class="station-hero ${STATION_ACTIVE.has(snap.station) ? "active" : ""}">
      <div class="station-machine"><div class="machine-light"></div><ha-icon icon="mdi:home-automation"></ha-icon><span>OMNI</span></div>
      <div><div class="eyebrow">Станция S8 OMNI</div><h1>${escapeHtml(stationLabel)}</h1><p>${snap.station === "unknown" ? "Станция не считается ожидающей, пока её телеметрия неполна." : "Отдельный статус станции не зависит от generic vacuum.state."}</p></div>
    </section>
      ${this._trustBanner(snap)}
      <section class="card">
        ${this._row("Робот", dockLabel, "composite_status", snap.onDock === null || snap.onDock === undefined ? "muted" : "")}
        ${this._row("Заряд", battery, "battery")}
        ${this._row("Текущая операция", stationLabel, "station_status", snap.station === "unknown" ? "muted" : "")}
      </section>
      <section class="card">
        <div class="section-title"><div><span class="eyebrow">Состояние</span><h2>Операции станции</h2></div></div>
        <div class="operation-grid vertical">
          ${this._operationTile("dust_collection", "Очистка пылесборника", "mdi:delete-sweep-outline")}
          ${this._operationTile("roller_cleaning", "Промывка / очистка", "mdi:waves")}
          ${this._operationTile("roller_drying", "Сушка", "mdi:weather-windy")}
        </div>
      </section>
      <section class="future-card compact"><div class="future-icon"><ha-icon icon="mdi:shield-check-outline"></ha-icon></div><div><strong>Команды станции появятся после проверки</strong><p>Frontend не пишет Tuya DP напрямую. Очистка, промывка и сушка станут кнопками только после проверенного entity/service интеграции.</p></div></section>`;
  }

  _resourceCard(key, title, icon) {
    const value = this._stateValue(key);
    return `<div class="resource-card" data-more="${escapeHtml(key)}"><div class="resource-icon"><ha-icon icon="${icon}"></ha-icon></div><div><span>${escapeHtml(title)}</span><strong>${value === null ? "Нет данных" : `${escapeHtml(value)} мин`}</strong><small>Остаточный ресурс от устройства</small></div></div>`;
  }

  _maintenance() {
    const fault = this._stateValue("fault");
    const child = this._state("child_lock");
    const faultActive = fault !== null && !["0", 0, false].includes(fault);
    return `<section class="page-head"><span class="eyebrow">S8 OMNI</span><h1>Обслуживание</h1><p>Только фактический остаточный ресурс в минутах — без выдуманных процентов.</p></section>
      <section class="resource-grid">
        ${this._resourceCard("filter_life", "Фильтр", "mdi:air-filter")}
        ${this._resourceCard("side_brush_life", "Боковая щётка", "mdi:rotate-orbit")}
        ${this._resourceCard("main_brush_life", "Основная щётка", "mdi:brush")}
      </section>
      <section class="card">
        <div class="section-title"><div><span class="eyebrow">Система</span><h2>Защита и ошибки</h2></div></div>
        ${this._row("Fault", fault === null ? "Нет данных" : fault, "fault", faultActive ? "bad-text" : "")}
        ${child ? `<button class="toggle-row" data-toggle="child_lock"><span><strong>Блокировка от детей</strong><small>Проверенная публичная сущность интеграции</small></span><span class="toggle ${child.state === "on" ? "on" : ""}"></span></button>` : ""}
      </section>
      <section class="future-card compact"><div class="future-icon"><ha-icon icon="mdi:restore"></ha-icon></div><div><strong>Reset расходников пока скрыт</strong><p>DP18 / DP20 / DP22 появятся здесь только после end-to-end проверки записи.</p></div></section>`;
  }

  _diagnostics() {
    const snap = this._snapshot();
    const attrs = snap.attrs || {};
    const connection = this._connectionLabel();
    const availability = snap.unavailable ? "Недоступно" : "Доступно";
    const age = snap.age === null ? "Нет данных" : this._formatDuration(snap.age);
    const missing = Array.isArray(attrs.missing_station_dps) && attrs.missing_station_dps.length ? attrs.missing_station_dps.join(", ") : "Нет";
    return `<section class="page-head"><span class="eyebrow">Технический экран</span><h1>Диагностика</h1><p>Здесь допустимы raw-значения. На Overview они не выводятся.</p></section>
      <section class="diagnostic-health ${snap.unavailable ? "bad" : snap.robot === "unknown" || snap.station === "unknown" ? "warn" : "good"}">
        <div><span>Локальная связь</span><strong>${escapeHtml(connection)}</strong></div>
        <div><span>Устройство</span><strong>${availability}</strong></div>
        <div><span>Возраст данных</span><strong>${escapeHtml(age)}</strong></div>
      </section>
      <section class="card">
        <div class="section-title"><div><span class="eyebrow">Нормализовано</span><h2>Состояния</h2></div></div>
        ${this._row("Composite", snap.compositeObj?.state || "Нет entity", "composite_status")}
        ${this._row("Robot status", this._state("robot_status")?.state || "Нет entity", "robot_status")}
        ${this._row("Station status", this._state("station_status")?.state || "Нет entity", "station_status")}
        ${this._row("Station DP отсутствуют", missing, "station_status", missing !== "Нет" ? "muted" : "")}
      </section>
      <section class="card">
        <div class="section-title"><div><span class="eyebrow">Tuya</span><h2>Raw</h2></div></div>
        ${this._row("DP5 status", attrs.raw_status ?? "Нет данных", "composite_status")}
        ${this._row("DP4 mode", attrs.mode ?? this._state("mode")?.state ?? "Нет данных", "mode")}
        ${this._row("DP1 power_go", attrs.power_go ?? "Нет данных", "composite_status")}
        ${this._row("DP2 pause", attrs.pause ?? "Нет данных", "composite_status")}
        ${this._row("DP28 fault", attrs.fault ?? this._state("fault")?.state ?? "Нет данных", "fault")}
        ${this._row("DP134 dp_dust", attrs.dp_dust ?? this._state("dust_collection")?.state ?? "Нет данных", "dust_collection", this._isUnavailable("dust_collection") ? "muted" : "")}
        ${this._row("DP135 dp_roll_clean", attrs.dp_roll_clean ?? this._state("roller_cleaning")?.state ?? "Нет данных", "roller_cleaning", this._isUnavailable("roller_cleaning") ? "muted" : "")}
        ${this._row("DP136 dp_roll_hot", attrs.dp_roll_hot ?? this._state("roller_drying")?.state ?? "Нет данных", "roller_drying", this._isUnavailable("roller_drying") ? "muted" : "")}
      </section>
      <section class="card">
        <div class="section-title"><div><span class="eyebrow">Контракт</span><h2>Панель</h2></div></div>
        ${this._row("Integration", this._panel?.config?.integration_version || "—")}
        ${this._row("Dashboard", DASHBOARD_VERSION)}
        ${this._row("Route", "/dashboard-s8-omni")}
        ${this._row("Owner", "ha-s8-omni")}
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
      ["station", "mdi:home-automation", "Станция"],
      ["maintenance", "mdi:tools", "Сервис"],
      ["diagnostics", "mdi:stethoscope", "Диагн."],
    ];
    return `<nav>${items.map(([view, icon, label]) => `<button data-view="${view}" class="${this._view === view ? "active" : ""}"><ha-icon icon="${icon}"></ha-icon><span>${label}</span></button>`).join("")}</nav>`;
  }

  _renderLoading() {
    return `<style>${this._styles()}</style><main><div class="content"><section class="loading-card"><div class="loading-orb"><ha-icon icon="mdi:robot-vacuum"></ha-icon></div><strong>S8 OMNI</strong><span>Подключаем интерфейс…</span></section></div></main>`;
  }

  _render() {
    if (!this.shadowRoot) return;
    if (!this._hass || !this._panel || this._loadingRegistry || !this._registryLoaded) {
      this.shadowRoot.innerHTML = this._renderLoading();
      return;
    }
    if (this._registryError) {
      this.shadowRoot.innerHTML = `<style>${this._styles()}</style><main><div class="content"><section class="trust-banner bad"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><div><strong>Не удалось загрузить реестр сущностей</strong><span>${escapeHtml(this._registryError)}</span></div></section></div></main>`;
      return;
    }
    this.shadowRoot.innerHTML = `<style>${this._styles()}</style><main><div class="content">${this._body()}</div>${this._nav()}</main>`;
    this._bind();
  }

  _styles() {
    return `
      :host {
        display:block;
        min-height:100%;
        background:var(--primary-background-color);
        color:var(--primary-text-color);
        font-family:var(--paper-font-body1_-_font-family, system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif);
        -webkit-tap-highlight-color:transparent;
      }
      * { box-sizing:border-box; }
      button, select, input { font:inherit; }
      button { -webkit-tap-highlight-color:transparent; }
      main { min-height:100vh; overflow-x:hidden; padding-bottom:0; }
      .content { width:min(100%, 560px); margin:0 auto; padding:14px 12px 16px; }
      h1, h2, p { margin:0; }
      h1 { margin-top:5px; font-size:clamp(27px, 7vw, 34px); line-height:1.08; letter-spacing:-.8px; }
      h2 { margin-top:3px; font-size:20px; line-height:1.15; letter-spacing:-.25px; }
      p { margin-top:7px; color:var(--secondary-text-color); font-size:13px; line-height:1.42; }
      .eyebrow { display:block; color:var(--secondary-text-color); font-size:10.5px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; }
      .hero, .card, .station-hero, .diagnostic-health, .resource-card, .future-card, .loading-card {
        border-radius:24px;
        background:var(--card-background-color);
        box-shadow:var(--ha-card-box-shadow, 0 5px 20px rgba(0,0,0,.08));
      }
      .hero { position:relative; overflow:hidden; padding:19px; margin-bottom:12px; border:1px solid color-mix(in srgb, var(--divider-color) 55%, transparent); }
      .hero:before { content:""; position:absolute; inset:-70px -60px auto auto; width:190px; height:190px; border-radius:50%; background:color-mix(in srgb, var(--primary-color) 10%, transparent); filter:blur(4px); pointer-events:none; }
      .hero.tone-active:before, .hero.tone-station:before { background:color-mix(in srgb, var(--primary-color) 18%, transparent); }
      .hero.tone-bad { border-color:color-mix(in srgb, var(--error-color) 42%, var(--divider-color)); }
      .hero.tone-warn { border-color:color-mix(in srgb, var(--warning-color, orange) 42%, var(--divider-color)); }
      .hero-top { position:relative; z-index:1; display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
      .hero-top > div:first-child { min-width:0; }
      .hero-top p { max-width:340px; }
      .connection-chip { flex:0 0 auto; display:flex; align-items:center; gap:6px; min-height:30px; padding:0 10px; border-radius:999px; background:var(--secondary-background-color); color:var(--secondary-text-color); font-size:11px; font-weight:800; }
      .connection-chip i { width:7px; height:7px; border-radius:50%; background:var(--success-color, var(--primary-color)); }
      .connection-chip.bad i { background:var(--error-color); }
      .vacuum-stage { position:relative; min-height:168px; margin:18px -5px 3px; border-radius:22px; overflow:hidden; background:linear-gradient(145deg, color-mix(in srgb, var(--secondary-background-color) 84%, transparent), color-mix(in srgb, var(--primary-color) 5%, var(--card-background-color))); border:1px solid color-mix(in srgb, var(--divider-color) 60%, transparent); }
      .stage-caption, .stage-station { position:absolute; z-index:3; top:13px; display:flex; flex-direction:column; gap:2px; max-width:42%; }
      .stage-caption { left:14px; }
      .stage-station { right:14px; text-align:right; align-items:flex-end; }
      .stage-caption span, .stage-station span { color:var(--secondary-text-color); font-size:10px; text-transform:uppercase; letter-spacing:.08em; }
      .stage-caption strong, .stage-station strong { font-size:12px; line-height:1.25; }
      .track { position:absolute; left:55px; right:70px; bottom:45px; height:1px; border-top:2px dashed color-mix(in srgb, var(--secondary-text-color) 22%, transparent); }
      .track span { position:absolute; left:0; top:-3px; width:7px; height:7px; border-radius:50%; background:color-mix(in srgb, var(--primary-color) 45%, transparent); }
      .robot-disc { position:absolute; z-index:2; bottom:22px; width:76px; height:76px; border-radius:50%; display:grid; place-items:center; background:linear-gradient(145deg, color-mix(in srgb, var(--card-background-color) 84%, white 16%), color-mix(in srgb, var(--secondary-background-color) 92%, black 8%)); border:1px solid var(--divider-color); box-shadow:0 8px 18px rgba(0,0,0,.16); transition:left .45s ease, right .45s ease, transform .3s ease; }
      .robot-disc.away { left:28px; }
      .robot-disc.returning { left:calc(52% - 38px); }
      .robot-disc.at-dock { right:52px; }
      .robot-disc ha-icon { --mdc-icon-size:38px; color:var(--primary-color); }
      .robot-disc > span { position:absolute; width:13px; height:4px; border-radius:4px; top:10px; background:color-mix(in srgb, var(--primary-color) 60%, transparent); }
      .dock { position:absolute; right:18px; bottom:15px; z-index:1; width:70px; height:95px; display:flex; flex-direction:column; align-items:center; }
      .dock-top { width:42px; height:18px; border-radius:9px 9px 3px 3px; background:color-mix(in srgb, var(--secondary-text-color) 20%, var(--card-background-color)); display:grid; place-items:center; }
      .dock-top i { width:12px; height:4px; border-radius:4px; background:var(--primary-color); opacity:.65; }
      .dock-body { width:58px; height:60px; border-radius:12px 12px 16px 16px; display:grid; place-items:center; background:color-mix(in srgb, var(--secondary-background-color) 90%, var(--card-background-color)); border:1px solid var(--divider-color); }
      .dock-body ha-icon { --mdc-icon-size:27px; color:var(--secondary-text-color); }
      .dock > span { margin-top:3px; font-size:9px; font-weight:900; letter-spacing:.12em; color:var(--secondary-text-color); }
      .vacuum-stage.cleaning .robot-disc { animation:cleaning-motion 2.2s ease-in-out infinite; }
      .vacuum-stage.returning-motion .robot-disc { animation:returning-motion 1.5s ease-in-out infinite; }
      .vacuum-stage.charging .robot-disc > span { animation:charge-led 1.25s ease-in-out infinite; }
      .vacuum-stage.station-work .dock-top i { animation:station-led 1.1s ease-in-out infinite; }
      @keyframes cleaning-motion { 0%,100%{transform:translateX(0) rotate(-3deg)} 50%{transform:translateX(8px) rotate(3deg)} }
      @keyframes returning-motion { 0%,100%{transform:translateX(-4px)} 50%{transform:translateX(4px)} }
      @keyframes charge-led { 0%,100%{opacity:.35} 50%{opacity:1} }
      @keyframes station-led { 0%,100%{opacity:.35; transform:scaleX(.7)} 50%{opacity:1; transform:scaleX(1)} }
      .hero-facts { position:relative; z-index:1; display:grid; grid-template-columns:1fr 1.15fr .9fr; gap:8px; margin-top:12px; }
      .hero-facts > div { min-width:0; padding:11px 12px; border-radius:16px; background:var(--secondary-background-color); }
      .hero-facts span { display:block; color:var(--secondary-text-color); font-size:10px; margin-bottom:4px; text-transform:uppercase; letter-spacing:.06em; }
      .hero-facts strong { display:block; min-width:0; font-size:13px; line-height:1.2; overflow-wrap:anywhere; }
      .battery-bar { height:4px; margin-top:7px; border-radius:4px; overflow:hidden; background:color-mix(in srgb, var(--secondary-text-color) 14%, transparent); }
      .battery-bar i { display:block; height:100%; border-radius:4px; background:var(--primary-color); }
      .action-deck { display:grid; grid-template-columns:1.22fr .9fr .9fr; gap:9px; margin-bottom:12px; }
      .action { min-width:0; min-height:72px; border:1px solid color-mix(in srgb, var(--divider-color) 70%, transparent); border-radius:20px; padding:10px; color:var(--primary-text-color); background:var(--card-background-color); display:flex; align-items:center; gap:9px; text-align:left; box-shadow:var(--ha-card-box-shadow, 0 4px 14px rgba(0,0,0,.07)); }
      .action.primary { color:var(--text-primary-color, white); background:linear-gradient(145deg, var(--primary-color), color-mix(in srgb, var(--primary-color) 74%, black)); border-color:transparent; }
      .action-icon { width:36px; height:36px; flex:0 0 36px; border-radius:13px; display:grid; place-items:center; background:color-mix(in srgb, currentColor 11%, transparent); }
      .action ha-icon { --mdc-icon-size:22px; }
      .action > span:last-child { min-width:0; display:flex; flex-direction:column; gap:2px; }
      .action strong { font-size:13px; }
      .action small { color:inherit; opacity:.68; font-size:9.5px; line-height:1.15; }
      .action:disabled { opacity:.36; box-shadow:none; }
      .action:not(:disabled):active, nav button:active, .text-link:active, .toggle-row:active { transform:scale(.98); }
      .trust-banner { display:flex; align-items:flex-start; gap:11px; margin-bottom:12px; padding:13px 14px; border-radius:18px; border:1px solid transparent; background:var(--card-background-color); }
      .trust-banner.warn { border-color:color-mix(in srgb, var(--warning-color, orange) 42%, var(--divider-color)); background:color-mix(in srgb, var(--warning-color, orange) 8%, var(--card-background-color)); }
      .trust-banner.bad { border-color:color-mix(in srgb, var(--error-color) 42%, var(--divider-color)); background:color-mix(in srgb, var(--error-color) 8%, var(--card-background-color)); }
      .trust-banner ha-icon { flex:0 0 auto; --mdc-icon-size:24px; }
      .trust-banner > div { display:flex; flex-direction:column; gap:3px; }
      .trust-banner strong { font-size:13px; }
      .trust-banner span { color:var(--secondary-text-color); font-size:11px; line-height:1.35; }
      .card { padding:17px; margin-bottom:12px; }
      .section-title { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:11px; }
      .section-title > div { min-width:0; }
      .text-link { min-height:42px; padding:0 8px; border:0; background:transparent; color:var(--primary-color); font-weight:800; font-size:12px; }
      .metric-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
      .metric-grid > div { min-height:91px; padding:12px; border-radius:17px; background:var(--secondary-background-color); display:grid; grid-template-columns:auto 1fr; grid-template-rows:auto auto; gap:5px 8px; align-content:center; }
      .metric-grid ha-icon { grid-row:1 / span 2; align-self:center; --mdc-icon-size:25px; color:var(--primary-color); }
      .metric-grid span { color:var(--secondary-text-color); font-size:10px; }
      .metric-grid strong { font-size:16px; overflow-wrap:anywhere; }
      .operation-grid { display:grid; grid-template-columns:1fr; gap:8px; }
      .operation-tile { position:relative; min-height:66px; padding:10px 36px 10px 10px; border-radius:17px; display:grid; grid-template-columns:38px 1fr; align-items:center; gap:10px; background:var(--secondary-background-color); border:1px solid transparent; overflow:hidden; }
      .operation-grid:not(.vertical) .operation-tile { min-height:61px; }
      .operation-tile.active { border-color:color-mix(in srgb, var(--primary-color) 35%, var(--divider-color)); background:color-mix(in srgb, var(--primary-color) 9%, var(--secondary-background-color)); }
      .operation-tile.unavailable { opacity:.58; }
      .operation-icon { width:38px; height:38px; border-radius:13px; display:grid; place-items:center; background:var(--card-background-color); }
      .operation-icon ha-icon { --mdc-icon-size:22px; color:var(--primary-color); }
      .operation-tile > div:nth-child(2) { min-width:0; display:flex; flex-direction:column; gap:2px; }
      .operation-tile strong { font-size:12px; line-height:1.2; }
      .operation-tile span { color:var(--secondary-text-color); font-size:10px; }
      .operation-tile > i { position:absolute; right:13px; width:8px; height:8px; border-radius:50%; background:color-mix(in srgb, var(--secondary-text-color) 20%, transparent); }
      .operation-tile.active > i { background:var(--primary-color); box-shadow:0 0 0 6px color-mix(in srgb, var(--primary-color) 10%, transparent); }
      .data-row { min-height:55px; display:flex; align-items:center; justify-content:space-between; gap:18px; border-bottom:1px solid var(--divider-color); }
      .data-row:last-child { border-bottom:0; }
      .data-row span { font-size:13px; }
      .data-row strong { max-width:58%; text-align:right; font-size:13px; overflow-wrap:anywhere; }
      .data-row.muted strong, .data-row.muted span { color:var(--secondary-text-color); }
      .data-row.bad-text strong { color:var(--error-color); }
      .control-row { min-height:72px; display:flex; align-items:center; justify-content:space-between; gap:13px; border-bottom:1px solid var(--divider-color); }
      .control-row > div { min-width:0; display:flex; flex-direction:column; gap:3px; }
      .control-row strong { font-size:13px; }
      .control-row span { color:var(--secondary-text-color); font-size:9.5px; }
      select { max-width:47%; min-height:46px; border:1px solid var(--divider-color); border-radius:14px; padding:0 10px; background:var(--secondary-background-color); color:var(--primary-text-color); }
      .slider-row { display:grid; grid-template-columns:1fr auto; gap:5px 10px; align-items:center; padding:13px 0 4px; }
      .slider-row > div { display:flex; flex-direction:column; gap:3px; }
      .slider-row strong { font-size:13px; }
      .slider-row span { color:var(--secondary-text-color); font-size:10px; }
      .slider-row output { font-weight:800; font-size:13px; }
      .slider-row input { grid-column:1 / -1; width:100%; min-height:38px; accent-color:var(--primary-color); }
      .toggle-row { width:100%; min-height:68px; border:0; border-bottom:1px solid var(--divider-color); padding:8px 0; background:transparent; color:inherit; display:flex; align-items:center; justify-content:space-between; gap:16px; text-align:left; }
      .toggle-row > span:first-child { display:flex; flex-direction:column; gap:4px; }
      .toggle-row strong { font-size:13px; }
      .toggle-row small { color:var(--secondary-text-color); font-size:10px; line-height:1.35; }
      .toggle { width:48px; height:28px; flex:0 0 48px; border-radius:20px; background:var(--disabled-color); position:relative; }
      .toggle:after { content:""; position:absolute; width:22px; height:22px; top:3px; left:3px; border-radius:50%; background:white; box-shadow:0 1px 4px rgba(0,0,0,.2); transition:transform .2s ease; }
      .toggle.on { background:var(--primary-color); }
      .toggle.on:after { transform:translateX(20px); }
      .future-card { display:flex; align-items:flex-start; gap:13px; padding:15px; margin-bottom:12px; box-shadow:none; border:1px dashed color-mix(in srgb, var(--secondary-text-color) 28%, transparent); background:transparent; }
      .future-card.compact { border-radius:20px; }
      .future-icon { width:42px; height:42px; flex:0 0 42px; border-radius:14px; display:grid; place-items:center; background:var(--secondary-background-color); }
      .future-icon ha-icon { --mdc-icon-size:24px; color:var(--secondary-text-color); }
      .future-card > div:last-child { min-width:0; }
      .future-card strong { display:block; margin-top:3px; font-size:13px; }
      .future-card p { margin-top:4px; font-size:11px; }
      .station-hero { display:grid; grid-template-columns:84px 1fr; align-items:center; gap:16px; padding:17px; margin-bottom:12px; overflow:hidden; border:1px solid color-mix(in srgb, var(--divider-color) 55%, transparent); }
      .station-hero.active { border-color:color-mix(in srgb, var(--primary-color) 36%, var(--divider-color)); background:linear-gradient(145deg, color-mix(in srgb, var(--primary-color) 8%, var(--card-background-color)), var(--card-background-color)); }
      .station-machine { position:relative; height:105px; border-radius:20px 20px 25px 25px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:5px; background:var(--secondary-background-color); border:1px solid var(--divider-color); }
      .station-machine ha-icon { --mdc-icon-size:36px; color:var(--primary-color); }
      .station-machine span { font-size:9px; font-weight:900; letter-spacing:.14em; color:var(--secondary-text-color); }
      .machine-light { position:absolute; top:9px; width:18px; height:4px; border-radius:4px; background:color-mix(in srgb, var(--primary-color) 55%, transparent); }
      .station-hero.active .machine-light { animation:station-led 1.1s ease-in-out infinite; }
      .page-head { padding:10px 5px 17px; }
      .resource-grid { display:grid; gap:9px; margin-bottom:12px; }
      .resource-card { min-height:88px; padding:13px; display:grid; grid-template-columns:48px 1fr; align-items:center; gap:12px; }
      .resource-icon { width:48px; height:48px; border-radius:16px; display:grid; place-items:center; background:color-mix(in srgb, var(--primary-color) 9%, var(--secondary-background-color)); }
      .resource-icon ha-icon { --mdc-icon-size:27px; color:var(--primary-color); }
      .resource-card > div:last-child { min-width:0; display:grid; grid-template-columns:1fr auto; gap:3px 8px; align-items:baseline; }
      .resource-card span { font-size:12px; }
      .resource-card strong { font-size:17px; }
      .resource-card small { grid-column:1 / -1; color:var(--secondary-text-color); font-size:9.5px; }
      .diagnostic-health { display:grid; grid-template-columns:repeat(3, 1fr); gap:1px; margin-bottom:12px; overflow:hidden; border:1px solid var(--divider-color); box-shadow:none; }
      .diagnostic-health > div { min-width:0; padding:12px 9px; background:var(--card-background-color); }
      .diagnostic-health span { display:block; min-height:24px; color:var(--secondary-text-color); font-size:9.5px; line-height:1.2; }
      .diagnostic-health strong { display:block; margin-top:5px; font-size:11px; overflow-wrap:anywhere; }
      .diagnostic-health.good { border-color:color-mix(in srgb, var(--success-color, var(--primary-color)) 30%, var(--divider-color)); }
      .diagnostic-health.warn { border-color:color-mix(in srgb, var(--warning-color, orange) 38%, var(--divider-color)); }
      .diagnostic-health.bad { border-color:color-mix(in srgb, var(--error-color) 38%, var(--divider-color)); }
      .loading-card { min-height:360px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; color:var(--secondary-text-color); }
      .loading-card strong { color:var(--primary-text-color); font-size:20px; }
      .loading-orb { width:78px; height:78px; border-radius:50%; display:grid; place-items:center; margin-bottom:6px; background:color-mix(in srgb, var(--primary-color) 10%, var(--secondary-background-color)); animation:loading-pulse 1.4s ease-in-out infinite; }
      .loading-orb ha-icon { --mdc-icon-size:40px; color:var(--primary-color); }
      @keyframes loading-pulse { 0%,100%{transform:scale(.96); opacity:.72} 50%{transform:scale(1); opacity:1} }
      nav { position:sticky; bottom:0; z-index:20; width:100%; display:grid; grid-template-columns:repeat(5, minmax(0, 1fr)); gap:2px; padding:7px max(6px, env(safe-area-inset-right)) calc(7px + env(safe-area-inset-bottom)) max(6px, env(safe-area-inset-left)); background:color-mix(in srgb, var(--card-background-color) 93%, transparent); border-top:1px solid var(--divider-color); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); }
      nav button { min-width:0; min-height:56px; border:0; border-radius:15px; background:transparent; color:var(--secondary-text-color); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; font-size:9.5px; transition:background .18s ease, color .18s ease, transform .12s ease; }
      nav button.active { color:var(--primary-color); background:color-mix(in srgb, var(--primary-color) 10%, transparent); }
      nav ha-icon { --mdc-icon-size:23px; }
      @media (max-width:390px) {
        .content { padding-left:9px; padding-right:9px; }
        .hero { padding:16px; }
        .hero-facts { grid-template-columns:1fr 1fr; }
        .hero-facts > div:last-child { grid-column:1 / -1; }
        .action-deck { grid-template-columns:1.2fr 1fr 1fr; gap:6px; }
        .action { padding:8px; gap:5px; }
        .action-icon { width:30px; height:30px; flex-basis:30px; border-radius:11px; }
        .action small { display:none; }
        .metric-grid { gap:6px; }
      }
      @media (min-width:720px) {
        .content { width:min(100%, 920px); padding-top:22px; }
        .operation-grid:not(.vertical) { grid-template-columns:repeat(3, 1fr); }
        .resource-grid { grid-template-columns:repeat(3, 1fr); }
        .resource-card { grid-template-columns:44px 1fr; }
        nav { width:min(100%, 620px); margin:0 auto 10px; border:1px solid var(--divider-color); border-radius:22px; }
      }
      @media (prefers-reduced-motion: reduce) {
        *, *:before, *:after { animation:none !important; transition:none !important; scroll-behavior:auto !important; }
      }
    `;
  }
}

if (!customElements.get("s8-omni-panel")) {
  customElements.define("s8-omni-panel", S8OmniPanel);
}
