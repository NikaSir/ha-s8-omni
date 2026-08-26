const UI_VERSION = "v0.7.20";
const ASSET_ROOT = "/s8_omni/frontend/assets";
const VIEW_SCALE_MIN = 0.72;
const VIEW_SCALE_MAX = 2.20;
const VIEW_SCALE_SNAP_MIN = 0.97;
const VIEW_SCALE_SNAP_MAX = 1.03;
const VIEW_STATE_PREFIX = "s8_omni.view_transform.v2";
const HERO_IMAGES = {
  dock: `${ASSET_ROOT}/hero-dock.webp?v=${encodeURIComponent(UI_VERSION)}`,
  away: `${ASSET_ROOT}/hero-away.webp?v=${encodeURIComponent(UI_VERSION)}`,
  dust: `${ASSET_ROOT}/hero-dust.webp?v=${encodeURIComponent(UI_VERSION)}`,
  wash: `${ASSET_ROOT}/hero-wash.webp?v=${encodeURIComponent(UI_VERSION)}`,
  dry: `${ASSET_ROOT}/hero-dry.webp?v=${encodeURIComponent(UI_VERSION)}`,
};

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
  "stop_dust_collection", "stop_roller_cleaning", "stop_roller_drying",
];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function s8SameTreeShape(current, desired) {
  if (!current || !desired || current.nodeType !== desired.nodeType) return false;
  if (current.nodeType === Node.ELEMENT_NODE && current.tagName !== desired.tagName) return false;
  if (current.childNodes.length !== desired.childNodes.length) return false;
  for (let index = 0; index < current.childNodes.length; index += 1) {
    if (!s8SameTreeShape(current.childNodes[index], desired.childNodes[index])) return false;
  }
  return true;
}

function s8SameChildrenShape(current, desired) {
  if (!current || !desired || current.childNodes.length !== desired.childNodes.length) return false;
  for (let index = 0; index < current.childNodes.length; index += 1) {
    if (!s8SameTreeShape(current.childNodes[index], desired.childNodes[index])) return false;
  }
  return true;
}

function s8SyncAttributes(current, desired) {
  for (const attribute of Array.from(current.attributes)) {
    if (!desired.hasAttribute(attribute.name)) current.removeAttribute(attribute.name);
  }
  for (const attribute of Array.from(desired.attributes)) {
    if (current.getAttribute(attribute.name) !== attribute.value) {
      current.setAttribute(attribute.name, attribute.value);
    }
  }
  if (
    desired.hasAttribute("value")
    && current.value !== undefined
    && current.getRootNode()?.activeElement !== current
  ) {
    current.value = desired.getAttribute("value");
  }
}

function s8SyncTree(current, desired) {
  if (current.nodeType === Node.TEXT_NODE) {
    if (current.nodeValue !== desired.nodeValue) current.nodeValue = desired.nodeValue;
    return;
  }
  if (current.nodeType === Node.ELEMENT_NODE) s8SyncAttributes(current, desired);
  for (let index = 0; index < current.childNodes.length; index += 1) {
    s8SyncTree(current.childNodes[index], desired.childNodes[index]);
  }
}

function s8SyncChildren(current, desired) {
  for (let index = 0; index < current.childNodes.length; index += 1) {
    s8SyncTree(current.childNodes[index], desired.childNodes[index]);
  }
}

function s8ElementFromMarkup(markup) {
  const template = document.createElement("template");
  template.innerHTML = markup;
  return template.content.firstElementChild;
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
    this._renderDeferred = false;
    this._viewTransform = { scale: 1, x: 0, y: 0 };
    this._viewTransformKey = null;
    this._gesturePointers = new Map();
    this._gestureStart = null;
    this._gestureMoved = false;
    this._hadMultiTouch = false;
    this._twoFingerTapAt = 0;
    this._suppressClicksUntil = 0;
    this._scaleToastTimer = null;
    this._resizeBound = false;
    this._nativeScrollPositions = new Map();
    this._pendingScrollTop = null;
    this._nativeScrollActive = false;
    this._nativeScrollIdleTimer = null;
    this._stableMounted = false;
    this._stablePatchQueued = false;
    this._stableStructureCache = null;
    this._onRealViewportResize = () => requestAnimationFrame(() => this._clampAndApplyTransform(false));
  }

  set hass(value) { this._hass = value; this._ensureRegistry(); this._queueLivePatch(); }
  get hass() { return this._hass; }
  set panel(value) { this._panel = value; if (!this._gesturePointers?.size) this._restoreTransform(true); else this._renderDeferred = true; this._ensureRegistry(); this._queueRender(); }
  set narrow(_value) {}
  connectedCallback() {
    if (!this._resizeBound) {
      window.addEventListener("resize", this._onRealViewportResize, { passive: true });
      window.visualViewport?.addEventListener("resize", this._onRealViewportResize, { passive: true });
      this._resizeBound = true;
    }
    this._queueRender();
  }
  disconnectedCallback() {
    if (this._resizeBound) {
      window.removeEventListener("resize", this._onRealViewportResize);
      window.visualViewport?.removeEventListener("resize", this._onRealViewportResize);
      this._resizeBound = false;
    }
    clearTimeout(this._nativeScrollIdleTimer);
    this._nativeScrollIdleTimer = null;
    this._nativeScrollActive = false;
  }

  _queueLivePatch() {
    if (!this._stableMounted) { this._queueRender(); return; }
    if (this._gesturePointers?.size || this._nativeScrollActive) { this._renderDeferred = true; return; }
    if (this._stablePatchQueued) return;
    this._stablePatchQueued = true;
    requestAnimationFrame(() => {
      this._stablePatchQueued = false;
      this._patchStableDom();
    });
  }

  _queueRender() {
    if (this._stableMounted) { this._queueLivePatch(); return; }
    if (this._gesturePointers?.size || this._nativeScrollActive) { this._renderDeferred = true; return; }
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
    return state === "connected" ? "Локально" : state === "disconnected" ? "Нет связи" : "Нет данных";
  }

  _telemetryFreshnessState() {
    const connection = this._connectionState();
    if (connection === "unknown") return "no_data";
    const obj = this._state("local_connection");
    const attrs = obj?.attributes || {};
    const age = Number(this._stateValue("telemetry_age"));
    const hasSnapshot = attrs.has_successful_snapshot === true || Number.isFinite(age);
    if (!hasSnapshot) return "no_data";
    if (connection === "disconnected") return "stale";
    const declared = String(attrs.telemetry_status || "").toLowerCase();
    const configuredThreshold = Number(attrs.stale_after_seconds);
    const scan = Number(attrs.scan_interval_seconds);
    const threshold = Number.isFinite(configuredThreshold) && configuredThreshold > 0
      ? configuredThreshold
      : Number.isFinite(scan) && scan > 0 ? scan * 3 : 15;
    if (Number.isFinite(age) && age > threshold) return "stale";
    if (declared === "stale") return "stale";
    if (declared === "no_data") return "no_data";
    return "current";
  }

  _connectionIndicatorState() {
    const state = this._connectionState();
    const freshness = this._telemetryFreshnessState();
    return {
      state,
      label: state === "connected" ? "Локально" : state === "disconnected" ? "Нет связи" : "Нет данных",
      tone: state === "connected" ? "local" : state === "disconnected" ? "offline" : "unknown",
      freshness,
      freshnessLabel: freshness === "current" ? "Данные актуальны" : freshness === "stale" ? "Данные устарели" : "Нет данных",
      freshnessTone: freshness === "current" ? "current" : freshness === "stale" ? "stale" : "no-data",
    };
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
      workMode: unreliable ? null : this._stateValue("work_mode", null),
      onDock: unreliable ? null : attrs.robot_on_dock,
      stationOperations: !unreliable && Array.isArray(attrs.station_operations) ? attrs.station_operations : [],
      missingStationDps: !unreliable && Array.isArray(attrs.missing_station_dps) ? attrs.missing_station_dps : [],
    };
  }

  _modeLabel(snap) {
    if (snap.unreliable) return "Нет данных";
    return this._label(MODE_LABELS, String(snap.mode ?? "").toLowerCase(), "Нет данных");
  }

  _modeMeta(snap, label) {
    if (snap.unreliable) return "Режим недоступен";
    if (label === "Smart") return "Автовыбор";
    if (label === "Комнаты") return "Select Room";
    if (label === "Зона") return "Zone Cleaning";
    if (label === "Точка") return "Where To Sweep";
    return "Режим уборки";
  }

  _batteryIcon(snap, charging, charged) {
    if (snap.unreliable || snap.battery === null) return "mdi:battery-unknown";
    if (charging) return "mdi:battery-charging";
    if (charged || snap.battery >= 95) return "mdi:battery-check";
    if (snap.battery >= 70) return "mdi:battery-high";
    if (snap.battery >= 35) return "mdi:battery-medium";
    if (snap.battery >= 15) return "mdi:battery-low";
    return "mdi:battery-alert";
  }

  _modeIcon(snap) {
    const mode = String(snap.mode ?? "").toLowerCase();
    const icons = {
      smart: "mdi:tune-variant",
      selectroom: "mdi:floor-plan",
      zone: "mdi:vector-square",
      pose: "mdi:map-marker-radius-outline",
      part: "mdi:shape-outline",
    };
    return icons[mode] || "mdi:tune-variant";
  }

  _telemetryIcon(_snap) {
    const freshness = this._telemetryFreshnessState();
    if (freshness === "current") return "mdi:clock-check-outline";
    if (freshness === "stale") return "mdi:clock-alert-outline";
    return "mdi:clock-question-outline";
  }

  _telemetryMeta(_snap) {
    const freshness = this._telemetryFreshnessState();
    if (freshness === "current") return "Данные актуальны";
    if (freshness === "stale") return "Данные устарели";
    return "Нет данных";
  }

  _transformStorageKey() {
    const entryId = this._panel?.config?.entry_id || "default";
    const workspace = this._detail ? `${this._view}:${this._detail}` : this._view;
    return `${VIEW_STATE_PREFIX}:${entryId}:${workspace}`;
  }

  _restoreTransform(force = false) {
    const key = this._transformStorageKey();
    if (!force && key === this._viewTransformKey) return;
    this._viewTransformKey = key;
    let state = { scale: 1, x: 0, y: 0 };
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        const scale = Number(parsed?.scale), x = Number(parsed?.x), y = Number(parsed?.y);
        if (Number.isFinite(scale) && Number.isFinite(x) && Number.isFinite(y)) {
          state = { scale: Math.max(VIEW_SCALE_MIN, Math.min(VIEW_SCALE_MAX, scale)), x, y };
        }
      }
    } catch (_err) {}
    this._viewTransform = state;
  }

  _saveTransform() {
    if (!this._viewTransformKey) this._viewTransformKey = this._transformStorageKey();
    try { localStorage.setItem(this._viewTransformKey, JSON.stringify(this._viewTransform)); } catch (_err) {}
  }

  _transformCss() {
    const { scale, x, y } = this._viewTransform;
    if (Math.abs(scale - 1) < 0.0001) return "none";
    return `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${scale.toFixed(4)})`;
  }

  _workspace(content) {
    this._restoreTransform(false);
    const mode = this._viewTransform.scale > 1 ? "is-zoomed" : "is-native";
    return `<div class="work-viewport ${mode}" data-work-viewport><div class="work-canvas" data-work-canvas style="transform:${this._transformCss()}"><div class="content">${content}</div></div><div class="scale-toast" data-scale-toast aria-live="polite"></div></div>`;
  }

  _clampTransform(state = this._viewTransform) {
    const viewport = this.shadowRoot?.querySelector("[data-work-viewport]");
    const canvas = this.shadowRoot?.querySelector("[data-work-canvas]");
    if (!viewport || !canvas) return state;
    const scale = Math.max(VIEW_SCALE_MIN, Math.min(VIEW_SCALE_MAX, Number(state.scale) || 1));
    if (scale <= 1) return { scale, x: 0, y: 0 };
    const naturalWidth = Math.max(canvas.offsetWidth, 1);
    const naturalHeight = Math.max(canvas.scrollHeight, canvas.offsetHeight, 1);
    const minX = Math.min(0, viewport.clientWidth - naturalWidth * scale);
    const minY = Math.min(0, viewport.clientHeight - naturalHeight * scale);
    return {
      scale,
      x: Math.min(0, Math.max(minX, Number(state.x) || 0)),
      y: Math.min(0, Math.max(minY, Number(state.y) || 0)),
    };
  }

  _clampAndApplyTransform(persist = true) {
    const canvas = this.shadowRoot?.querySelector("[data-work-canvas]");
    if (!canvas) return;
    this._viewTransform = this._clampTransform(this._viewTransform);
    canvas.style.transform = this._transformCss();
    const viewport = this.shadowRoot?.querySelector("[data-work-viewport]");
    if (viewport) {
      viewport.classList.toggle("is-zoomed", this._viewTransform.scale > 1);
      viewport.classList.toggle("is-native", this._viewTransform.scale <= 1);
    }
    if (persist) this._saveTransform();
  }

  _showScaleToast(label = null) {
    const toast = this.shadowRoot?.querySelector("[data-scale-toast]");
    if (!toast) return;
    const text = label || `Масштаб ${Math.round(this._viewTransform.scale * 100)}%`;
    toast.textContent = text;
    toast.classList.add("show");
    clearTimeout(this._scaleToastTimer);
    this._scaleToastTimer = setTimeout(() => toast.classList.remove("show"), 850);
  }

  _resetTransform(showToast = true) {
    this._viewTransform = { scale: 1, x: 0, y: 0 };
    this._clampAndApplyTransform(true);
    const viewport = this.shadowRoot?.querySelector("[data-work-viewport]");
    if (viewport) viewport.scrollTop = 0;
    this._nativeScrollPositions.set(this._transformStorageKey(), 0);
    if (showToast) this._showScaleToast("Масштаб 100%");
  }

  _cancelLongPresses() {
    this.shadowRoot?.querySelectorAll("[data-more]").forEach((node) => node.dispatchEvent(new Event("pointercancel")));
  }

  _switchWorkspace(view, detail = null) {
    this._saveTransform();
    this._view = view;
    this._detail = detail;
    this._viewTransformKey = null;
    this._restoreTransform(true);
    this._viewTransform = { scale: this._viewTransform.scale, x: 0, y: 0 };
    this._pendingScrollTop = 0;
    this._nativeScrollPositions.set(this._transformStorageKey(), 0);
    this._queueRender();
  }

  _restoreNativeScroll() {
    const viewport = this.shadowRoot?.querySelector("[data-work-viewport]");
    if (!viewport || this._viewTransform.scale > 1) return;
    const saved = this._pendingScrollTop ?? this._nativeScrollPositions.get(this._transformStorageKey()) ?? 0;
    this._pendingScrollTop = null;
    viewport.scrollTop = Math.max(0, saved);
  }

  _markNativeScrollActive() {
    if (this._viewTransform.scale > 1) return;
    this._nativeScrollActive = true;
    clearTimeout(this._nativeScrollIdleTimer);
    this._nativeScrollIdleTimer = setTimeout(() => {
      this._nativeScrollIdleTimer = null;
      this._nativeScrollActive = false;
      if (this._renderDeferred && !this._gesturePointers?.size) {
        this._renderDeferred = false;
        this._queueRender();
      }
    }, 180);
  }

  _bindWorkspaceGestures() {
    const viewport = this.shadowRoot?.querySelector("[data-work-viewport]");
    if (!viewport) return;
    const point = (event) => {
      const rect = viewport.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

    const startPinch = () => {
      const pts = [...this._gesturePointers.values()].slice(0, 2);
      if (pts.length < 2) return;
      const mid = midpoint(pts[0], pts[1]);
      const nativeScrollTop = this._viewTransform.scale <= 1 ? viewport.scrollTop : 0;
      if (nativeScrollTop) viewport.scrollTop = 0;
      this._gestureStart = {
        kind: "pinch",
        distance: Math.max(distance(pts[0], pts[1]), 1),
        midpoint: mid,
        scale: this._viewTransform.scale,
        x: this._viewTransform.x,
        y: this._viewTransform.y,
        contentX: (mid.x - this._viewTransform.x) / this._viewTransform.scale,
        contentY: (mid.y + nativeScrollTop - this._viewTransform.y) / this._viewTransform.scale,
        startedAt: performance.now(),
      };
      this._hadMultiTouch = true;
      this._gestureMoved = false;
      this._cancelLongPresses();
    };

    viewport.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (event.target?.closest?.("input,select")) return;
      const p = point(event);
      this._gesturePointers.set(event.pointerId, { ...p, startX: p.x, startY: p.y });
      if (this._gesturePointers.size === 1) {
        if (this._viewTransform.scale > 1) {
          try { viewport.setPointerCapture(event.pointerId); } catch (_err) {}
          this._gestureStart = { kind: "pan", id: event.pointerId, pointerX: p.x, pointerY: p.y, x: this._viewTransform.x, y: this._viewTransform.y, startedAt: performance.now() };
        } else {
          this._gestureStart = { kind: "native", id: event.pointerId, startedAt: performance.now() };
        }
        this._gestureMoved = false;
        this._hadMultiTouch = false;
      } else if (this._gesturePointers.size === 2) {
        for (const id of this._gesturePointers.keys()) {
          try { viewport.setPointerCapture(id); } catch (_err) {}
        }
        startPinch();
      }
    });

    viewport.addEventListener("pointermove", (event) => {
      if (!this._gesturePointers.has(event.pointerId)) return;
      const p = point(event);
      const previous = this._gesturePointers.get(event.pointerId);
      this._gesturePointers.set(event.pointerId, { ...previous, x: p.x, y: p.y });
      if (this._gesturePointers.size >= 2) {
        const pts = [...this._gesturePointers.values()].slice(0, 2);
        if (this._gestureStart?.kind !== "pinch") startPinch();
        const start = this._gestureStart;
        const mid = midpoint(pts[0], pts[1]);
        const nextScale = Math.max(VIEW_SCALE_MIN, Math.min(VIEW_SCALE_MAX, start.scale * distance(pts[0], pts[1]) / start.distance));
        if (Math.abs(nextScale - start.scale) > 0.008 || Math.hypot(mid.x - start.midpoint.x, mid.y - start.midpoint.y) > 3) this._gestureMoved = true;
        this._viewTransform = this._clampTransform({ scale: nextScale, x: mid.x - start.contentX * nextScale, y: mid.y - start.contentY * nextScale });
        this._clampAndApplyTransform(false);
        this._cancelLongPresses();
        event.preventDefault();
        return;
      }
      if (this._gestureStart?.kind === "native") {
        if (Math.hypot(p.x - previous.startX, p.y - previous.startY) > 4) {
          this._gestureMoved = true;
          this._markNativeScrollActive();
          this._cancelLongPresses();
        }
        return;
      }
      if (this._viewTransform.scale > 1 && this._gestureStart?.kind === "pan" && this._gestureStart.id === event.pointerId) {
        const dx = p.x - this._gestureStart.pointerX, dy = p.y - this._gestureStart.pointerY;
        if (Math.hypot(dx, dy) > 4) {
          this._gestureMoved = true;
          this._cancelLongPresses();
        }
        if (this._gestureMoved) {
          this._viewTransform = this._clampTransform({ scale: this._viewTransform.scale, x: this._gestureStart.x + dx, y: this._gestureStart.y + dy });
          this._clampAndApplyTransform(false);
          event.preventDefault();
        }
      }
    }, { passive: false });

    const finishPointer = (event, cancelled = false) => {
      if (!this._gesturePointers.has(event.pointerId)) return;
      this._gesturePointers.delete(event.pointerId);
      if (this._gesturePointers.size === 1 && this._hadMultiTouch) {
        const [remaining] = this._gesturePointers.entries();
        const [id, p] = remaining;
        this._gestureStart = this._viewTransform.scale > 1
          ? { kind: "pan", id, pointerX: p.x, pointerY: p.y, x: this._viewTransform.x, y: this._viewTransform.y, startedAt: performance.now() }
          : { kind: "native", id, startedAt: performance.now() };
        return;
      }
      if (this._gesturePointers.size) return;
      const now = performance.now();
      const wasMulti = this._hadMultiTouch;
      const moved = this._gestureMoved;
      const duration = this._gestureStart ? now - this._gestureStart.startedAt : 999;
      if (!cancelled && wasMulti && !moved && duration < 300) {
        if (now - this._twoFingerTapAt < 460) {
          this._twoFingerTapAt = 0;
          this._resetTransform(true);
          this._suppressClicksUntil = Date.now() + 360;
        } else {
          this._twoFingerTapAt = now;
          this._suppressClicksUntil = Date.now() + 320;
        }
      } else {
        if (wasMulti && this._viewTransform.scale >= VIEW_SCALE_SNAP_MIN && this._viewTransform.scale <= VIEW_SCALE_SNAP_MAX) {
          this._viewTransform.scale = 1;
          this._clampAndApplyTransform(false);
          this._showScaleToast("Масштаб 100%");
        }
        this._saveTransform();
        if (moved || wasMulti) this._suppressClicksUntil = Date.now() + 320;
      }
      this._gestureStart = null;
      this._gestureMoved = false;
      this._hadMultiTouch = false;
      if (this._renderDeferred) { this._renderDeferred = false; this._queueRender(); }
    };
    viewport.addEventListener("pointerup", (event) => finishPointer(event, false));
    viewport.addEventListener("pointercancel", (event) => finishPointer(event, true));
    viewport.addEventListener("click", (event) => {
      if (Date.now() < this._suppressClicksUntil) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
    viewport.addEventListener("scroll", () => {
      if (this._viewTransform.scale <= 1) {
        this._nativeScrollPositions.set(this._transformStorageKey(), viewport.scrollTop);
        this._markNativeScrollActive();
      }
    }, { passive: true });
    viewport.addEventListener("wheel", (event) => {
      if (this._viewTransform.scale <= 1) return;
      this._viewTransform = this._clampTransform({ scale: this._viewTransform.scale, x: this._viewTransform.x - event.deltaX, y: this._viewTransform.y - event.deltaY });
      this._clampAndApplyTransform(true);
      event.preventDefault();
    }, { passive: false });
    requestAnimationFrame(() => this._clampAndApplyTransform(false));
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
      :host{display:block;height:100%;min-height:0;background:var(--primary-background-color);color:var(--primary-text-color);font-family:var(--ha-font-family-body,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif);overflow-x:hidden}
      *{box-sizing:border-box;min-width:0}button,input,select{font:inherit}button{-webkit-tap-highlight-color:transparent}h1,h2,h3,p{margin:0}
      main{min-height:0;padding-bottom:calc(82px + env(safe-area-inset-bottom))}
      .app-header{position:sticky;top:0;z-index:60;display:grid;grid-template-columns:48px minmax(0,1fr) 48px;align-items:center;gap:8px;min-height:calc(64px + env(safe-area-inset-top));padding:max(8px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) 8px max(12px,env(safe-area-inset-left));background:color-mix(in srgb,var(--primary-background-color) 97%,transparent);border-bottom:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);backdrop-filter:blur(18px) saturate(130%)}
      .header-action{width:48px;height:48px;border:0;border-radius:15px;display:grid;place-items:center;background:var(--card-background-color);color:var(--primary-text-color);box-shadow:0 3px 12px rgba(0,0,0,.07)}.header-action.refresh{color:var(--primary-color)}.header-action:disabled{opacity:.38}.header-action ha-icon{--mdc-icon-size:28px}.header-action.loading ha-icon{animation:spin .8s linear infinite}
      .header-title{text-align:center;display:flex;flex-direction:column;gap:2px;overflow:hidden}.header-title strong{font-size:22px;line-height:1.05;white-space:nowrap}.header-title span{color:var(--secondary-text-color);font-size:12px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .content{width:min(100%,900px);margin:0 auto;padding:12px 10px 18px}.card{background:var(--card-background-color);border:1px solid color-mix(in srgb,var(--divider-color) 72%,transparent);border-radius:22px;padding:15px;margin-bottom:12px;box-shadow:0 6px 18px rgba(0,0,0,.04)}.eyebrow{display:block;color:var(--secondary-text-color);font-size:11px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}
      .hero{position:relative;overflow:hidden;background:linear-gradient(135deg,var(--card-background-color) 62%,color-mix(in srgb,var(--primary-color) 7%,var(--card-background-color)) 100%)}.hero::after{content:"";position:absolute;width:205px;height:205px;right:-70px;top:-92px;border-radius:50%;background:color-mix(in srgb,var(--primary-color) 7%,transparent);pointer-events:none}.hero-top{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:start;gap:10px;position:relative;z-index:2}.hero h1{margin-top:5px;font-size:30px;line-height:1.02;letter-spacing:-.035em}.hero-hint{margin-top:6px;color:var(--secondary-text-color);font-size:13px;line-height:1.28}.connection-indicator{justify-self:end;display:grid;grid-template-columns:10px minmax(0,1fr);align-items:center;column-gap:11px;min-height:58px;padding:12px 14px;border-radius:18px;background:var(--card-background-color);border:1px solid color-mix(in srgb,var(--divider-color) 72%,transparent);box-shadow:0 4px 14px rgba(0,0,0,.055);white-space:nowrap}.connection-lamp{display:block;width:10px;height:10px;border-radius:50%;background:var(--disabled-text-color)}.connection-copy{display:flex;flex-direction:column;gap:3px;min-width:0}.connection-copy strong{font-size:15.5px;line-height:1.05;font-weight:700;color:var(--disabled-text-color)}.connection-copy small{font-size:12.5px;line-height:1.05;font-weight:550;color:var(--secondary-text-color)}.connection-indicator.local .connection-lamp{background:var(--success-color,#43a047)}.connection-indicator.local .connection-copy strong{color:var(--success-color,#43a047)}.connection-indicator.offline .connection-lamp{background:var(--error-color,#db4437)}.connection-indicator.offline .connection-copy strong{color:var(--error-color,#db4437)}.connection-indicator.unknown .connection-lamp{background:var(--disabled-text-color)}.connection-copy small.stale{color:var(--warning-color,#f6a623);font-weight:600}.connection-copy small.no-data{color:var(--secondary-text-color)}
      .omni-scene{position:relative;z-index:1;height:210px;margin-top:12px;border-radius:22px;border:1px solid color-mix(in srgb,var(--divider-color) 64%,transparent);background:linear-gradient(145deg,#ffffff 0%,#f7fbfd 56%,#edf8fc 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.98),0 8px 24px rgba(18,56,72,.035);overflow:hidden}.omni-scene::before{content:"";position:absolute;left:12px;right:102px;bottom:8px;height:42px;border-radius:50%;background:radial-gradient(ellipse at center,rgba(161,177,186,.26) 0%,rgba(161,177,186,.06) 58%,rgba(161,177,186,0) 78%)}.omni-scene::after{content:"";position:absolute;right:-16px;top:-24px;width:184px;height:184px;border-radius:50%;background:radial-gradient(circle,rgba(211,243,255,.78) 0%,rgba(223,244,253,0) 68%)}.omni-art{position:absolute;left:4px;top:7px;bottom:7px;width:73%;display:grid;place-items:center;z-index:2}.product-art{display:block;width:100%;height:100%;max-height:100%;object-fit:cover;object-position:center;border-radius:18px;filter:drop-shadow(0 9px 13px rgba(43,62,70,.11));transition:opacity .2s ease,filter .2s ease}.omni-art.muted .product-art{opacity:.52;filter:grayscale(.3) drop-shadow(0 8px 11px rgba(43,62,70,.08))}.omni-legend{position:absolute;right:8px;top:10px;bottom:10px;width:26%;z-index:5;display:flex;flex-direction:column;justify-content:center;gap:7px;padding:9px 8px;border-radius:19px;background:rgba(255,255,255,.98);border:1px solid rgba(101,112,118,.11);box-shadow:0 10px 26px rgba(0,0,0,.075);backdrop-filter:blur(14px) saturate(115%)}.legend-row{display:grid;grid-template-columns:21px minmax(0,1fr);gap:6px;align-items:center;min-height:31px;padding:5px 4px;color:#4b5359;font-size:10.5px;font-weight:800;line-height:1.12;border-radius:11px;background:rgba(248,250,251,.96);border:1px solid rgba(91,101,107,.065)}.legend-row ha-icon{--mdc-icon-size:19px;color:#667078}.legend-row.active{color:#20272c;background:#ffffff;border-color:rgba(72,82,88,.10);box-shadow:0 2px 7px rgba(0,0,0,.045)}.legend-row.water.active{background:#edf8ff;color:#166d96;border-color:#c8e9f7}.legend-row.water.active ha-icon{color:#16a9e5}.legend-row.dust.active{background:#f1f3f4;color:#454d53;border-color:#d8dde0}.legend-row.dust.active ha-icon{color:#626c74}.legend-row.dry.active{background:#fff3e9;color:#a85d22;border-color:#f5d7bd}.legend-row.dry.active ha-icon{color:#ee914c}.legend-row.charge.active{background:#edf9f0;color:#2e914b;border-color:#bfe3c8}.legend-row.charge.active ha-icon{color:#32aa56}
      .hero-metrics{position:relative;z-index:2;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}.hero-metrics>div{min-height:68px;border-radius:18px;padding:10px;background:rgba(255,255,255,.90);border:1px solid rgba(92,108,116,.10);box-shadow:0 4px 12px rgba(20,52,66,.045);overflow:hidden}.hero-metrics span{display:block;color:var(--secondary-text-color);font-size:10px;text-transform:uppercase;letter-spacing:.07em;white-space:nowrap}.hero-metrics strong{display:block;margin-top:4px;font-size:19px;line-height:1.05;white-space:nowrap}.battery-bar{height:4px;border-radius:999px;background:var(--divider-color);margin-top:8px;overflow:hidden}.battery-bar i{display:block;height:100%;border-radius:inherit;background:var(--primary-color)}
      .trust-banner{display:flex;gap:10px;padding:11px 13px;margin:0 0 10px;border-radius:17px;background:color-mix(in srgb,var(--error-color,#db4437) 9%,var(--card-background-color));border:1px solid color-mix(in srgb,var(--error-color,#db4437) 32%,transparent)}.trust-banner ha-icon{color:var(--error-color,#db4437);--mdc-icon-size:22px}.trust-banner strong{display:block;font-size:14px}.trust-banner span{display:block;color:var(--secondary-text-color);font-size:12px;margin-top:2px}
      .quick-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:11px}.action{min-height:90px;border:1px solid color-mix(in srgb,var(--divider-color) 68%,transparent);border-radius:21px;padding:8px 5px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;background:linear-gradient(180deg,var(--card-background-color),color-mix(in srgb,var(--primary-color) 2%,var(--card-background-color)));color:var(--primary-text-color);box-shadow:0 5px 15px rgba(20,52,66,.045);text-align:center}.action.primary{background:linear-gradient(145deg,color-mix(in srgb,var(--primary-color) 92%,white),var(--primary-color));color:var(--text-primary-color,white);border-color:transparent;box-shadow:0 9px 20px color-mix(in srgb,var(--primary-color) 22%,transparent)}.action:disabled{opacity:.34}.action.running{background:color-mix(in srgb,var(--primary-color) 15%,var(--card-background-color));color:var(--primary-color)}.action.running:disabled{opacity:1}.action-icon{width:50px;height:50px;border-radius:16px;display:grid;place-items:center;background:rgba(0,0,0,.09)}.action.primary .action-icon{background:rgba(0,0,0,.15)}.action-icon ha-icon{--mdc-icon-size:34px}.action strong{font-size:14px;line-height:1}.action .action-sub{font-size:11px;opacity:.72;white-space:nowrap}
      .statuses-card{padding:14px}.statuses-card>h2{font-size:24px;line-height:1;margin-bottom:12px;letter-spacing:-.02em}.status-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.status-card{min-height:96px;border:1px solid rgba(91,108,118,.09);border-radius:18px;padding:9px 7px;background:linear-gradient(180deg,var(--card-background-color),color-mix(in srgb,var(--primary-color) 2%,var(--card-background-color)));box-shadow:0 4px 12px rgba(20,52,66,.04);color:var(--primary-text-color);text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden}.status-icon{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:color-mix(in srgb,var(--primary-color) 6%,var(--card-background-color));color:var(--primary-color);margin-bottom:7px;box-shadow:inset 0 0 0 1px rgba(92,108,116,.06)}.status-icon ha-icon{--mdc-icon-size:25px}.status-card strong{font-size:11px}.status-card b{display:block;margin-top:3px;font-size:14px;line-height:1.05;white-space:nowrap}.status-card span.meta{display:block;margin-top:3px;color:var(--secondary-text-color);font-size:10px;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%}.status-card.good b,.status-card.good .status-icon{color:var(--success-color,#43a047)}.status-card.warn b,.status-card.warn .status-icon{color:var(--error-color,#db4437)}
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
      .content{padding-bottom:calc(118px + env(safe-area-inset-bottom))}.omni-scene{height:236px}.omni-art{left:0;top:0;bottom:0;width:75%;overflow:hidden;border-radius:21px}.product-art{border-radius:21px;filter:none}.omni-legend{width:31%;gap:5px;padding:8px}.legend-row{grid-template-columns:20px minmax(0,1fr);min-height:35px;padding:4px 5px}.legend-copy{min-width:0}.legend-copy strong,.legend-copy small{display:block;overflow:hidden;text-overflow:ellipsis}.legend-copy strong{font-size:10px;white-space:nowrap}.legend-copy small{font-size:9px;font-weight:700;color:var(--secondary-text-color);margin-top:2px;white-space:nowrap}.legend-row.clean-water ha-icon{color:#139ee0}.legend-row.dirty-water ha-icon{color:#6c7479}.legend-row.dry.active{background:#fff3e9;color:#a85d22}.legend-row.charge.active{background:#edf9f0;color:#2e914b}.hero-metrics>div{position:relative;min-height:82px;padding:10px 10px 9px 44px}.hero-metrics .metric-icon{position:absolute;left:10px;top:18px;--mdc-icon-size:27px}.metric-icon.battery{color:#48b94f}.metric-icon.mode{color:var(--primary-color)}.metric-icon.telemetry{color:#43b75a}.hero-metrics small{display:block;margin-top:4px;color:var(--secondary-text-color);font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.battery-bar{margin-left:-34px}.action.ready{background:color-mix(in srgb,var(--primary-color) 9%,var(--card-background-color));color:var(--primary-color)}.statuses-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.statuses-head h2{font-size:24px;line-height:1}.statuses-head button{border:0;background:transparent;color:var(--secondary-text-color);display:flex;align-items:center;gap:2px;font-size:12px}.statuses-head ha-icon{--mdc-icon-size:18px}.status-card.neutral b{color:var(--secondary-text-color)}.status-icon.water{color:#159fdf}.status-icon.dustbin{color:#697278}@media(max-width:430px){.omni-scene{height:228px}.omni-art{width:73%}.omni-legend{width:32%;right:6px}.hero-metrics>div{padding-left:39px}.hero-metrics .metric-icon{left:8px;--mdc-icon-size:24px}.status-card span.meta{white-space:normal;min-height:22px}}
      .content{padding-bottom:calc(156px + env(safe-area-inset-bottom))}
      .omni-scene{height:248px}.omni-art{left:0;top:0;bottom:0;width:71%;overflow:hidden;border-radius:21px}.product-art{width:100%;height:100%;object-fit:cover;object-position:center;border-radius:21px;filter:none}.omni-legend{right:6px;top:9px;bottom:9px;width:35%;gap:5px;padding:8px}.legend-copy strong{white-space:normal;line-height:1.05}.legend-copy small{white-space:nowrap}.action.primary.running{background:linear-gradient(145deg,color-mix(in srgb,var(--primary-color) 92%,white),var(--primary-color));color:var(--text-primary-color,white);border-color:transparent;box-shadow:0 9px 20px color-mix(in srgb,var(--primary-color) 22%,transparent)}.status-card{min-height:142px;justify-content:flex-start;padding:8px 6px 9px}.status-thumb{display:block;width:100%;height:68px;object-fit:contain;border-radius:12px;background:#fff;margin-bottom:5px}.status-card strong{font-size:10px}.status-card b{font-size:13px;white-space:normal}.status-card span.meta{white-space:normal;min-height:22px}.status-card.neutral b{color:var(--secondary-text-color)}
      @media(max-width:430px){.omni-scene{height:242px}.omni-art{width:70%}.omni-legend{width:36%;right:5px}.legend-copy strong{font-size:9.5px}.status-thumb{height:62px}.status-card{min-height:136px}}
      /* v0.7.10 approved-render geometry */
      .content{padding-bottom:calc(126px + env(safe-area-inset-bottom))}
      .omni-scene{height:252px}
      .omni-art{left:0;top:0;bottom:0;width:75%;overflow:hidden;border-radius:21px;background:#f7f5f1}
      .product-art{width:100%;height:100%;object-fit:cover;object-position:52% center;border-radius:21px;filter:none}
      .omni-legend{right:7px;top:10px;bottom:10px;width:30%;gap:5px;padding:7px}
      .legend-row{min-height:34px;padding:4px 5px}
      .legend-copy strong{font-size:9.7px;line-height:1.05}
      .legend-copy small{font-size:8.8px}
      .status-card{min-height:119px;padding:7px 6px 8px}
      .status-thumb{height:52px;margin-bottom:4px}
      .status-card strong{font-size:9.5px}
      .status-card b{font-size:12px;line-height:1.08}
      .status-card span.meta{font-size:9px;min-height:18px}
      @media(max-width:430px){.omni-scene{height:246px}.omni-art{width:74%}.omni-legend{width:31%;right:5px}.status-thumb{height:49px}.status-card{min-height:116px}}
      /* v0.7.13 Overview polish */
      .hero-metrics small{white-space:normal;overflow:visible;text-overflow:clip;line-height:1.12;min-height:20px}
      .metric-icon.battery.low{color:var(--error-color,#db4437)}
      .statuses-card{padding:11px 12px 10px}
      .statuses-head{margin-bottom:7px}
      .status-grid{gap:6px}
      .status-card{min-height:98px;padding:5px 5px 6px}
      .status-thumb{height:40px;margin-bottom:2px}
      .status-card strong{font-size:9px;line-height:1.05}
      .status-card b{font-size:11px;line-height:1.05;margin-top:2px}
      .status-card span.meta{font-size:8.5px;min-height:16px;margin-top:2px;line-height:1.05}
      @media(max-width:430px){.status-card{min-height:94px}.status-thumb{height:37px}}
      /* v0.7.14 compact Overview density */
      .hero{padding:13px}
      .omni-scene{height:232px;margin-top:9px}
      .omni-legend{width:32%;right:6px;top:8px;bottom:8px;gap:4px;padding:6px}
      .legend-row{min-height:32px;padding:3px 4px}
      .legend-copy strong{font-size:9.3px;line-height:1.03}
      .legend-copy small{font-size:8.5px;margin-top:1px}
      .hero-metrics{margin-top:8px;gap:7px}
      .hero-metrics>div{min-height:74px;padding-top:8px;padding-bottom:7px}
      .hero-metrics .metric-icon{top:15px}
      .hero-metrics small{white-space:normal;line-height:1.05;min-height:18px}
      .quick-actions{gap:7px;margin-bottom:8px}
      .action{min-height:80px;padding:6px 4px;gap:4px}
      .action-icon{width:45px;height:45px;border-radius:14px}
      .action-icon ha-icon{--mdc-icon-size:31px}
      .statuses-card{padding:11px 12px 12px;margin-bottom:8px}
      .statuses-head{margin-bottom:7px}
      .statuses-head h2{font-size:22px}
      .status-grid{gap:6px}
      .status-card{min-height:96px;padding:6px 5px 7px}
      .status-thumb{height:43px;margin-bottom:3px}
      .status-card strong{font-size:9.2px}
      .status-card b{font-size:11.5px;margin-top:2px}
      .status-card span.meta{font-size:8.5px;min-height:16px;margin-top:2px;line-height:1.05}
      @media(max-width:430px){.omni-scene{height:226px}.omni-art{width:73%}.omni-legend{width:33%}.hero-metrics>div{min-height:72px}.action{min-height:78px}.status-card{min-height:94px}.status-thumb{height:42px}}
      /* v0.7.16 state-aware photographic Hero */
      .state-hero{padding:14px;overflow:hidden}
      .state-hero .hero-top{margin-bottom:10px}
      .state-hero h1{font-size:32px}
      .state-scene{position:relative;height:388px;border-radius:22px;overflow:hidden;background:#f4f2ee;border:1px solid color-mix(in srgb,var(--divider-color) 60%,transparent);box-shadow:0 8px 24px rgba(20,42,52,.06)}
      .state-image{display:block;width:100%;height:100%;object-fit:cover;object-position:center;transition:opacity .18s ease,filter .18s ease}
      .state-scene.muted .state-image{opacity:.55;filter:grayscale(.28)}
      .resource-strip{position:absolute;left:10px;right:10px;bottom:10px;z-index:3;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));align-items:stretch;background:rgba(255,255,255,.94);border:1px solid rgba(80,96,104,.10);border-radius:17px;box-shadow:0 8px 22px rgba(16,34,44,.08);backdrop-filter:blur(14px) saturate(120%);overflow:hidden}
      .resource-chip{min-height:58px;display:grid;grid-template-columns:36px minmax(0,1fr);align-items:center;gap:7px;padding:8px 9px;position:relative}
      .resource-chip:not(:last-child)::after{content:"";position:absolute;right:0;top:12px;bottom:12px;width:1px;background:var(--divider-color)}
      .resource-chip ha-icon{--mdc-icon-size:25px;color:#19a9e4}.resource-chip.dirty ha-icon{color:#707980}.resource-chip.dustbag ha-icon{color:#6d7479}
      .resource-chip strong,.resource-chip small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.resource-chip strong{font-size:12.4px;line-height:1.06;font-weight:780;letter-spacing:-.012em}.resource-chip small{font-size:11.2px;line-height:1.06;color:var(--secondary-text-color);margin-top:2px}
      .state-hero .hero-metrics{margin-top:9px}
      .state-hero.operation h1{color:var(--primary-color)}.state-hero.warm h1{color:#c56b22}.state-hero.error h1{color:var(--error-color,#db4437)}
      .action.primary .action-icon ha-icon,.action.primary.running .action-icon ha-icon{color:currentColor!important;opacity:1!important}
      .action.primary.running:disabled{opacity:1}.action.primary.running:disabled .action-icon{opacity:1}
      @media(max-width:430px){.state-scene{height:352px}.resource-strip{left:7px;right:7px;bottom:7px}.resource-chip{grid-template-columns:30px minmax(0,1fr);gap:4px;padding:7px 4px}.resource-chip ha-icon{--mdc-icon-size:23px}.resource-chip strong{font-size:11.7px;line-height:1.04}.resource-chip small{font-size:10.6px;line-height:1.04}.state-hero h1{font-size:30px}}
      /* v0.7.15 stable iOS gesture canvas */
      :host{height:100vh;height:100dvh;min-height:0;max-height:100dvh;overflow:hidden;overscroll-behavior:none}
      main{height:100%;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr) auto;overflow:hidden;overscroll-behavior:none;padding-bottom:0}
      .app-header{position:relative;top:auto;z-index:60}
      nav{position:relative;left:auto;right:auto;bottom:auto;z-index:70}
      .work-viewport{position:relative;min-height:0;overflow:hidden;overscroll-behavior:none;touch-action:none;background:var(--primary-background-color)}
      .work-canvas{position:absolute;left:0;top:0;width:100%;min-height:100%;transform-origin:0 0;will-change:transform;touch-action:none;-webkit-user-select:none;user-select:none}
      .work-canvas .content{padding-bottom:18px}
      .scale-toast{position:absolute;left:50%;top:12px;z-index:90;transform:translateX(-50%) translateY(-8px);padding:7px 12px;border-radius:999px;background:rgba(24,29,32,.82);color:#fff;font-size:12px;font-weight:750;opacity:0;pointer-events:none;transition:opacity .16s ease,transform .16s ease;backdrop-filter:blur(10px)}
      .scale-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
      .action.stop{color:var(--error-color,#db4437);border-color:color-mix(in srgb,var(--error-color,#db4437) 28%,var(--divider-color));background:color-mix(in srgb,var(--error-color,#db4437) 6%,var(--card-background-color))}
      .action.stop .action-icon{background:color-mix(in srgb,var(--error-color,#db4437) 12%,transparent)}
      .service-toggle-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;column-gap:18px;min-height:76px;padding-top:12px;padding-bottom:12px}
      .service-toggle-row .toggle-copy{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;min-width:0;gap:4px;text-align:left}
      .service-toggle-row .toggle-copy strong{display:block;font-size:15px;line-height:1.14;font-weight:760;color:var(--primary-text-color)}
      .service-toggle-row .toggle-copy small{display:block;font-size:12px;line-height:1.18;color:var(--secondary-text-color);white-space:normal}
      .service-toggle-row .toggle{justify-self:end;align-self:center;flex:0 0 auto}
      @media(max-width:430px){.service-toggle-row{column-gap:14px;min-height:72px}.service-toggle-row .toggle-copy strong{font-size:14.5px}.service-toggle-row .toggle-copy small{font-size:11.5px}}
      /* v0.7.17: NIKAS Specialized Panel UI Standard v1.5 shell. */
      .app-header{grid-template-columns:52px minmax(0,1fr) 52px;gap:8px;min-height:calc(62px + env(safe-area-inset-top));padding:env(safe-area-inset-top) max(12px,env(safe-area-inset-right)) 0 max(12px,env(safe-area-inset-left))}
      .header-action{width:44px;height:44px;justify-self:center;border:1px solid color-mix(in srgb,var(--divider-color) 72%,transparent);border-radius:16px;background:var(--card-background-color);box-shadow:0 3px 12px rgba(0,0,0,.07);color:var(--primary-text-color)}
      .header-action.refresh{color:var(--primary-color)}.header-action ha-icon{--mdc-icon-size:25px}
      .header-title strong{font-size:21px;font-weight:800}.header-title span{font-size:12px;font-weight:560;color:var(--secondary-text-color)}
      .work-viewport.is-native{overflow-x:hidden;overflow-y:auto;overscroll-behavior-x:none;overscroll-behavior-y:none;touch-action:pan-y;-webkit-overflow-scrolling:touch}
      .work-viewport.is-native .work-canvas{position:relative;left:auto;top:auto;min-height:100%;touch-action:pan-y;-webkit-user-select:auto;user-select:auto;will-change:auto}
      .work-viewport.is-zoomed{overflow:hidden;overscroll-behavior:none;touch-action:none}
      .work-viewport.is-zoomed .work-canvas{position:absolute;left:0;top:0;touch-action:none;-webkit-user-select:none;user-select:none;will-change:transform}
      nav{background:color-mix(in srgb,var(--card-background-color) 97%,transparent);border-top:1px solid color-mix(in srgb,var(--divider-color) 72%,transparent);box-shadow:0 -3px 14px rgba(0,0,0,.05)}
      nav button{min-height:52px;border-radius:14px;color:var(--secondary-text-color)}
      nav button ha-icon{--mdc-icon-size:28px}nav button span{font-size:12px;font-weight:700;white-space:nowrap}
      nav button.active{background:color-mix(in srgb,var(--primary-color) 11%,transparent);color:var(--primary-color);box-shadow:none}
      .inline-back{display:inline-flex;align-items:center;gap:7px;min-height:44px;margin:0 0 10px;padding:0 13px;border:1px solid color-mix(in srgb,var(--divider-color) 72%,transparent);border-radius:14px;background:var(--card-background-color);color:var(--primary-color);font-weight:700}
      .inline-back ha-icon{--mdc-icon-size:22px}
      @media(max-width:520px){
        .app-header{grid-template-columns:48px minmax(0,1fr) 48px;min-height:calc(60px + env(safe-area-inset-top));padding-top:env(safe-area-inset-top)}
        .header-action{width:44px;height:44px;border-radius:16px}.header-action ha-icon{--mdc-icon-size:25px}
        .header-title strong{font-size:21px}.header-title span{font-size:12px}
        nav button{min-height:52px;border-radius:14px}nav button ha-icon{--mdc-icon-size:28px}
      }
      @keyframes spin{to{transform:rotate(360deg)}}
      @media(max-width:360px){.hero-top{grid-template-columns:1fr}.connection-indicator{justify-self:start}.status-grid{grid-template-columns:repeat(2,1fr)}.segments.four{grid-template-columns:repeat(2,1fr)}.diagnostic-strip{grid-template-columns:1fr}.omni-legend{width:30%}.omni-art{width:69%}}
      @media(prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important;animation:none!important}}
    `;
  }

  _header() {
    const detail = this._detail === "cleaning-settings";
    return `<header class="app-header"><button class="header-action" type="button" data-header-primary aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button><div class="header-title"><strong>${detail ? "Настройки уборки" : "S8 OMNI"}</strong><span>${detail ? "S8 OMNI · Уборка" : `Робот-пылесос · UI ${UI_VERSION}`}</span></div><button class="header-action refresh" type="button" data-refresh aria-label="Обновить" ${this._entityId("refresh") ? "" : "disabled"}><ha-icon icon="mdi:refresh"></ha-icon></button></header>`;
  }

  _trustBanner(snap) {
    if (!snap.unreliable && snap.composite !== "unknown" && snap.composite !== "error") return "";
    const title = snap.connection === "disconnected" ? "S8 OMNI недоступен" : snap.connection === "unknown" ? "Связь не подтверждена" : snap.composite === "error" ? "Требуется внимание" : "Состояние не подтверждено";
    const text = snap.connection === "disconnected" ? "Последние данные сохранены только для диагностики." : snap.connection === "unknown" ? "Текущая локальная телеметрия пока не подтверждена." : snap.composite === "error" ? "Проверьте ошибку робота в Диагностике." : "Часть данных отсутствует или неизвестна.";
    return `<div class="trust-banner"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><div><strong>${title}</strong><span>${text}</span></div></div>`;
  }

  _activeStationStopKeys(snap) {
    const ops = new Set(snap.stationOperations || []);
    const keys = [];
    if (ops.has("dust_collection") || snap.station === "dust_collection") keys.push("stop_dust_collection");
    if (ops.has("roller_cleaning") || snap.station === "roller_cleaning") keys.push("stop_roller_cleaning");
    if (ops.has("drying") || snap.station === "drying") keys.push("stop_roller_drying");
    return keys;
  }

  _heroState(snap) {
    if (snap.connection === "disconnected") return { image: "dock", title: "Нет связи", hint: "Нет актуальной локальной телеметрии", tone: "error" };
    if (snap.connection === "unknown") return { image: "dock", title: "Нет данных", hint: "Первоначальный локальный опрос ещё не завершён", tone: "warn" };
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
    const connection = this._connectionIndicatorState();
    const charging = !snap.unreliable && snap.robot === "charging";
    const charged = !snap.unreliable && snap.robot === "charged";
    const battery = snap.battery === null ? "—" : `${Math.round(snap.battery)}%`;
    const age = snap.age === null ? "—" : this._formatDuration(snap.age);
    const mode = this._modeLabel(snap), modeMeta = this._modeMeta(snap, mode);
    const batteryIcon = this._batteryIcon(snap, charging, charged), modeIcon = this._modeIcon(snap), telemetryIcon = this._telemetryIcon(snap), telemetryMeta = this._telemetryMeta(snap);
    const batteryTone = snap.battery !== null && snap.battery < 15 ? " low" : "";
    const image = HERO_IMAGES[state.image] || HERO_IMAGES.dock;
    return `<section class="card hero state-hero ${state.tone || ""}" data-more="composite_status"><div class="hero-top"><div><span class="eyebrow">Состояние</span><h1>${escapeHtml(state.title)}</h1><p class="hero-hint">${escapeHtml(state.hint)}</p></div><div class="connection-indicator ${connection.tone}" data-more="local_connection" role="status" aria-label="${escapeHtml(connection.label)} · ${escapeHtml(connection.freshnessLabel)}"><i class="connection-lamp"></i><span class="connection-copy"><strong>${escapeHtml(connection.label)}</strong><small class="${connection.freshnessTone}">${escapeHtml(connection.freshnessLabel)}</small></span></div></div><div class="state-scene ${snap.unreliable ? "muted" : ""}"><img class="state-image" src="${image}" alt="S8 OMNI — ${escapeHtml(state.title)}" />${this._resourceStrip(snap)}</div><div class="hero-metrics"><div data-more="battery"><ha-icon class="metric-icon battery${batteryTone}" icon="${batteryIcon}"></ha-icon><span>АКБ</span><strong>${battery}</strong><small>Текущий заряд</small><div class="battery-bar"><i style="width:${snap.battery ?? 0}%"></i></div></div><div data-more="mode"><ha-icon class="metric-icon mode" icon="${modeIcon}"></ha-icon><span>Режим</span><strong>${escapeHtml(mode)}</strong><small>${escapeHtml(modeMeta)}</small></div><div data-more="telemetry_age"><ha-icon class="metric-icon telemetry" icon="${telemetryIcon}"></ha-icon><span>Телеметрия</span><strong>${escapeHtml(age)}</strong><small>${escapeHtml(telemetryMeta)}</small></div></div></section>`;
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
    return `<div class="quick-actions"><button class="action ready" type="button" data-action="start" ${available ? "" : "disabled"}><span class="action-icon"><ha-icon icon="mdi:play"></ha-icon></span><strong>Уборка</strong><span class="action-sub">Smart</span></button><button class="action" type="button" disabled><span class="action-icon"><ha-icon icon="mdi:pause"></ha-icon></span><strong>Пауза</strong><span class="action-sub">Недоступно</span></button><button class="${homeClass}" type="button" data-action="home" ${available && !docked ? "" : "disabled"}><span class="action-icon"><ha-icon icon="${docked ? "mdi:home" : "mdi:home"}"></ha-icon></span><strong>Домой</strong><span class="action-sub">${docked ? "На базе ✓" : "На станцию"}</span></button></div>`;
  }

  _overview() {
    const snap = this._snapshot();
    return `<div>${this._hero()}${this._trustBanner(snap)}${this._quickActions()}</div>`;
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
    return `${this._trustBanner(snap)}<section class="view-heading"><span class="eyebrow">S8 OMNI</span><h2>Обслуживание</h2><p>Остаточный ресурс расходников.</p></section>${this._resource("filter_life","Фильтр","mdi:air-filter",snap.connected)}${this._resource("side_brush_life","Боковая щётка","mdi:fan",snap.connected)}${this._resource("main_brush_life","Основная щётка","mdi:brush",snap.connected)}<section class="card"><div class="section-title"><div><span class="eyebrow">Система</span><h2>Защита и ошибки</h2></div></div><div class="info-row" data-more="fault"><span>Состояние</span><strong>${escapeHtml(snap.connected ? (String(this._stateValue("fault","—")) === "0" ? "Ошибок нет" : `Ошибка ${this._formatEntity("fault","—")}`) : "—")}</strong></div><button class="toggle-row service-toggle-row" type="button" data-toggle="child_lock" ${childUsable ? "" : "disabled"}><span class="toggle-copy"><strong>Блокировка от детей</strong><small>Защита кнопок робота</small></span><span class="toggle ${childUsable && child?.state === "on" ? "on" : ""}"></span></button></section>`;
  }

  _diagRow(label, value) { return `<div class="info-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value === null || value === undefined ? "—" : String(value))}</strong></div>`; }
  _diagnostics() {
    const snap = this._snapshot(); const attrs = snap.attrs || {};
    const device = snap.connected ? "Доступно" : snap.connection === "disconnected" ? "Недоступно" : "Не подтверждено";
    return `<section class="view-heading"><span class="eyebrow">Технический экран</span><h2>Диагностика</h2><p>Нормализованные и raw-значения интеграции.</p></section><div class="diagnostic-strip"><div><span>Локальная связь</span><strong>${escapeHtml(this._connectionLabel())}</strong></div><div><span>Устройство</span><strong>${device}</strong></div><div><span>Возраст данных</span><strong>${snap.age === null ? "—" : escapeHtml(this._formatDuration(snap.age))}</strong></div></div><section class="card"><div class="section-title"><h2>Состояния</h2></div><div class="info-list">${this._diagRow("Composite",snap.connected ? this._stateValue("composite_status") : "unavailable")}${this._diagRow("Robot status",snap.connected ? this._stateValue("robot_status") : "unavailable")}${this._diagRow("Station status",snap.connected ? this._stateValue("station_status") : "unavailable")}${this._diagRow("Station DP отсутствуют",snap.connected && snap.missingStationDps.length ? snap.missingStationDps.join(", ") : snap.connected ? "Нет" : "—")}</div></section><section class="card"><div class="section-title"><h2>Tuya Raw</h2></div><div class="info-list">${this._diagRow("DP5 status",attrs.raw_status)}${this._diagRow("DP4 mode",attrs.mode)}${this._diagRow("DP41 work_mode",snap.connected ? this._stateValue("work_mode") : "unavailable")}${this._diagRow("DP1 power_go",attrs.power_go)}${this._diagRow("DP2 pause",attrs.pause)}${this._diagRow("DP28 fault",attrs.fault)}${this._diagRow("DP134 dp_dust",attrs.dp_dust)}${this._diagRow("DP135 dp_roll_clean",attrs.dp_roll_clean)}${this._diagRow("DP136 dp_roll_hot",attrs.dp_roll_hot)}</div></section><section class="card"><div class="section-title"><h2>Панель</h2></div><div class="info-list">${this._diagRow("Integration",this._panel?.config?.integration_version || "—")}${this._diagRow("Dashboard",UI_VERSION)}${this._diagRow("Bundle","standalone")}${this._diagRow("Route","/dashboard-s8-omni")}</div></section>`;
  }

  _body() {
    if (this._detail === "cleaning-settings") {
      return `<button class="inline-back" type="button" data-detail-back><ha-icon icon="mdi:arrow-left"></ha-icon><span>Уборка</span></button>${this._cleaningSettings()}`;
    }
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
    this.shadowRoot.querySelector("[data-header-primary]")?.addEventListener("click", () => this._toggleMenu());
    this.shadowRoot.querySelector("[data-detail-back]")?.addEventListener("click", () => this._switchWorkspace("cleaning", null));
    this.shadowRoot.querySelector("[data-refresh]")?.addEventListener("click", async (event) => { const b = event.currentTarget; if (!this._entityId("refresh") || b.disabled) return; b.disabled = true; b.classList.add("loading"); try { await this._call("button","press","refresh"); } finally { setTimeout(() => { b.disabled = false; b.classList.remove("loading"); }, 700); } });
    this.shadowRoot.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => this._switchWorkspace(b.dataset.view, null)));
    this.shadowRoot.querySelectorAll("[data-station-stop]").forEach((b) => b.addEventListener("click", async () => {
      if (b.disabled || !this._snapshot().connected) return;
      const keys = String(b.dataset.stationStop || "").split(",").filter(Boolean);
      if (!keys.length) return;
      b.disabled = true;
      try { for (const key of keys) await this._call("button", "press", key); }
      finally { setTimeout(() => { b.disabled = false; }, 700); }
    }));
    this.shadowRoot.querySelectorAll("[data-detail]").forEach((b) => b.addEventListener("click", () => this._switchWorkspace("cleaning", b.dataset.detail)));
    this.shadowRoot.querySelectorAll("[data-action]").forEach((b) => b.addEventListener("click", async () => { if (b.disabled || !this._snapshot().connected) return; b.disabled = true; try { if (b.dataset.action === "start") await this._call("vacuum","start","vacuum"); if (b.dataset.action === "pause") await this._call("vacuum","pause","vacuum"); if (b.dataset.action === "stop") await this._call("vacuum","stop","vacuum"); if (b.dataset.action === "home") await this._call("vacuum","return_to_base","vacuum"); } finally { setTimeout(() => { b.disabled = false; }, 650); } }));
    this.shadowRoot.querySelectorAll("[data-select-key]").forEach((b) => b.addEventListener("click", async () => { if (b.disabled || !this._snapshot().connected) return; await this._call("select","select_option",b.dataset.selectKey,{ option: b.dataset.selectValue }); }));
    const volume = this.shadowRoot.querySelector("[data-volume]"); volume?.addEventListener("input", () => { const label = this.shadowRoot.querySelector("[data-volume-label]"); if (label) label.textContent = `${volume.value}%`; }); volume?.addEventListener("change", () => { if (this._snapshot().connected) this._call("number","set_value","volume",{ value: Number(volume.value) }); });
    this.shadowRoot.querySelectorAll("[data-toggle]").forEach((b) => b.addEventListener("click", () => { if (b.disabled || !this._snapshot().connected) return; const key = b.dataset.toggle; this._call("switch",this._state(key)?.state === "on" ? "turn_off" : "turn_on",key); }));
    this.shadowRoot.querySelectorAll("[data-more]").forEach((node) => { let timer = null; const cancel = () => { if (timer) clearTimeout(timer); timer = null; }; node.addEventListener("pointerdown", (event) => { if (event.target?.closest?.("[data-more]") !== node) return; cancel(); if (this._gesturePointers.size > 1) return; timer = setTimeout(() => { timer = null; if (!this._gestureMoved && this._gesturePointers.size < 2) this._showMoreInfo(node.dataset.more); }, 520); }); node.addEventListener("pointerup",cancel); node.addEventListener("pointercancel",cancel); node.addEventListener("pointerleave",cancel); });
    this._bindWorkspaceGestures();
  }

  _finishRender() {
    this._bind();
    requestAnimationFrame(() => {
      this._clampAndApplyTransform(false);
      this._restoreNativeScroll();
    });
  }

  _stableBodyMarkup() {
    if (!this._hass || !this._panel || this._registryLoading || !this._registryLoaded) {
      return `<div class="loading"><div><ha-icon icon="mdi:robot-vacuum"></ha-icon><p>Подключаем интерфейс…</p></div></div>`;
    }
    if (this._registryError) {
      return `<div class="trust-banner"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><div><strong>Не удалось загрузить реестр сущностей</strong><span>${escapeHtml(this._registryError)}</span></div></div>`;
    }
    return this._body();
  }

  _stableStructureKey() {
    return JSON.stringify([
      this._view,
      this._detail,
      Boolean(this._hass && this._panel && !this._registryLoading && this._registryLoaded),
      Boolean(this._registryError),
      this._panel?.config?.entry_id || null,
      Object.entries(this._entities || {}).sort(([left], [right]) => left.localeCompare(right)),
    ]);
  }

  _bindStableContent(root) {
    root.querySelector("[data-detail-back]")?.addEventListener("click", () => this._switchWorkspace("cleaning", null));
    root.querySelectorAll("[data-station-stop]").forEach((button) => button.addEventListener("click", async () => {
      if (button.disabled || !this._snapshot().connected) return;
      const keys = String(button.dataset.stationStop || "").split(",").filter(Boolean);
      if (!keys.length) return;
      button.disabled = true;
      try { for (const key of keys) await this._call("button", "press", key); }
      finally { setTimeout(() => { button.disabled = false; }, 700); }
    }));
    root.querySelectorAll("[data-detail]").forEach((button) => button.addEventListener("click", () => this._switchWorkspace("cleaning", button.dataset.detail)));
    root.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", async () => {
      if (button.disabled || !this._snapshot().connected) return;
      button.disabled = true;
      try {
        if (button.dataset.action === "start") await this._call("vacuum", "start", "vacuum");
        if (button.dataset.action === "pause") await this._call("vacuum", "pause", "vacuum");
        if (button.dataset.action === "stop") await this._call("vacuum", "stop", "vacuum");
        if (button.dataset.action === "home") await this._call("vacuum", "return_to_base", "vacuum");
      } finally {
        setTimeout(() => { button.disabled = false; }, 650);
      }
    }));
    root.querySelectorAll("[data-select-key]").forEach((button) => button.addEventListener("click", async () => {
      if (button.disabled || !this._snapshot().connected) return;
      await this._call("select", "select_option", button.dataset.selectKey, { option: button.dataset.selectValue });
    }));
    const volume = root.querySelector("[data-volume]");
    volume?.addEventListener("input", () => {
      const label = root.querySelector("[data-volume-label]");
      if (label) label.textContent = `${volume.value}%`;
    });
    volume?.addEventListener("change", () => {
      if (this._snapshot().connected) this._call("number", "set_value", "volume", { value: Number(volume.value) });
    });
    root.querySelectorAll("[data-toggle]").forEach((button) => button.addEventListener("click", () => {
      if (button.disabled || !this._snapshot().connected) return;
      const key = button.dataset.toggle;
      this._call("switch", this._state(key)?.state === "on" ? "turn_off" : "turn_on", key);
    }));
    root.querySelectorAll("[data-more]").forEach((node) => {
      let timer = null;
      const cancel = () => { if (timer) clearTimeout(timer); timer = null; };
      node.addEventListener("pointerdown", (event) => {
        if (event.target?.closest?.("[data-more]") !== node) return;
        cancel();
        if (this._gesturePointers.size > 1) return;
        timer = setTimeout(() => {
          timer = null;
          if (!this._gestureMoved && this._gesturePointers.size < 2) this._showMoreInfo(node.dataset.more);
        }, 520);
      });
      node.addEventListener("pointerup", cancel);
      node.addEventListener("pointercancel", cancel);
      node.addEventListener("pointerleave", cancel);
    });
  }

  _patchStableDom() {
    if (!this.shadowRoot || !this._stableMounted) return;
    if (this._gesturePointers?.size || this._nativeScrollActive) { this._renderDeferred = true; return; }

    const currentHeader = this.shadowRoot.querySelector(".app-header");
    const currentNav = this.shadowRoot.querySelector("nav");
    const currentContent = this.shadowRoot.querySelector("[data-work-canvas] > .content");
    const desiredHeader = s8ElementFromMarkup(this._header());
    const desiredNav = s8ElementFromMarkup(this._nav());
    const desiredContent = s8ElementFromMarkup(`<div class="content">${this._stableBodyMarkup()}</div>`);

    if (s8SameTreeShape(currentHeader, desiredHeader)) s8SyncTree(currentHeader, desiredHeader);
    if (s8SameTreeShape(currentNav, desiredNav)) s8SyncTree(currentNav, desiredNav);
    if (!currentContent || !desiredContent) return;

    const structureKey = this._stableStructureKey();
    const sameShape = s8SameChildrenShape(currentContent, desiredContent);
    if (this._stableStructureCache === structureKey && sameShape) {
      s8SyncChildren(currentContent, desiredContent);
    } else if (sameShape) {
      s8SyncChildren(currentContent, desiredContent);
    } else {
      currentContent.replaceChildren(
        ...Array.from(desiredContent.childNodes, (node) => node.cloneNode(true)),
      );
      this._bindStableContent(currentContent);
    }
    this._stableStructureCache = structureKey;

    requestAnimationFrame(() => {
      this._clampAndApplyTransform(false);
      this._restoreNativeScroll();
    });
  }

  _render() {
    if (!this.shadowRoot || this._stableMounted) {
      if (this._stableMounted) this._patchStableDom();
      return;
    }
    this._restoreTransform(false);
    this.shadowRoot.innerHTML = `<style>${this._styles()}</style><main>${this._header()}${this._workspace(this._stableBodyMarkup())}${this._nav()}</main>`;
    this._stableMounted = true;
    this._stableStructureCache = this._stableStructureKey();
    this._finishRender();
  }
}

if (!customElements.get("s8-omni-panel")) customElements.define("s8-omni-panel", S8OmniPanel);
