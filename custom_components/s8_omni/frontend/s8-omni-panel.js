Warning: truncated output (original token count: 33572)
Total output lines: 1741

const UI_VERSION = "v1.0.3";
const ASSET_ROOT = "/s8_omni/frontend/assets";
const VIEW_SCALE_MIN = 0.75;
const VIEW_SCALE_MAX = 2.00;
const VIEW_SCALE_SNAP_MIN = 0.97;
const VIEW_SCALE_SNAP_MAX = 1.03;
const VIEW_STATE_PREFIX = "s8_omni.view_transform.v2";
const SOURCE_ROUTE_KEY = "nikas.specialized.source_route.v1";
const SOURCE_ROUTE_AT_KEY = "nikas.specialized.source_route_at.v1";
const RETURN_ROUTE_KEY = "nikas.s8_omni.return_route.v1";
const SAFE_DEFAULT_ROUTE = "/dashboard-actions/home";
const SOURCE_ROUTE_TTL_MS = 30_000;
const COMMAND_READBACK_TIMEOUT_MS = 6_500;
const HERO_IMAGES = {
  base: `${ASSET_ROOT}/hero-base.webp?v=${encodeURIComponent(UI_VERSION)}`,
  charging: `${ASSET_ROOT}/hero-charging.webp?v=${encodeURIComponent(UI_VERSION)}`,
  cleaning: `${ASSET_ROOT}/hero-cleaning.webp?v=${encodeURIComponent(UI_VERSION)}`,
  paused: `${ASSET_ROOT}/hero-paused.webp?v=${encodeURIComponent(UI_VERSION)}`,
  returning: `${ASSET_ROOT}/hero-return.webp?v=${encodeURIComponent(UI_VERSION)}`,
  error: `${ASSET_ROOT}/hero-error.webp?v=${encodeURIComponent(UI_VERSION)}`,
  dock: `${ASSET_ROOT}/hero-dock.webp?v=${encodeURIComponent(UI_VERSION)}`,
  away: `${ASSET_ROOT}/hero-away.webp?v=${encodeURIComponent(UI_VERSION)}`,
  dust: `${ASSET_ROOT}/hero-dust.webp?v=${encodeURIComponent(UI_VERSION)}`,
  wash: `${ASSET_ROOT}/hero-wash.webp?v=${encodeURIComponent(UI_VERSION)}`,
  dry: `${ASSET_ROOT}/hero-dry.webp?v=${encodeURIComponent(UI_VERSION)}`,
};
if (typeof Image !== "undefined") {
  for (const src of Object.values(HERO_IMAGES)) {
    const image = new Image();
    image.decoding = "async";
    image.src = src;
  }
}

const ROBOT_LABELS = {
  idle: "Ожидание", cleaning: "Уборка", zone_cleaning: "Зона", room_cleaning: "Комнаты",
  paused: "Пауза", going_to_position: "К точке", position_reached: "У точки", position_not_reached: "Нет позиции",
  returning_to_dock: "Возврат", charging: "Зарядка", charged: "Заряжен", sleeping: "Сон", error: "Ошибка",
  wall_following: "Вдоль стен", manual_control: "Вручную", repositioning: "Поиск позиции", creating_map: "Карта", unknown: "Нет данных",
};
const STATION_LABELS = { idle: "Ожидание", dust_collection: "Сбор пыли", roller_cleaning: "Промывка", drying: "Сушка", multiple_operations: "Несколько", unknown: "Нет данных" };
const COMPOSITE_LABELS = {
  idle: "Готов к уборке", cleaning: "Уборка", zone_cleaning: "Зона", room_cleaning: "Комнаты", paused: "Пауза",
  returning_to_dock: "Возврат", charging: "Зарядка", charged: "На базе", sleeping: "Сон", repositioning: "Поиск позиции",
  docked_dust_collection: "На базе · Сбор пыли", docked_roller_cleaning: "На базе · Промывка", docked_drying: "На базе · Сушка",
  docked_station_active: "На базе · Станция активна", error: "Требуется внимание", unknown: "Нет данных",
};
const MODE_LABELS = { smart: "Smart", zone: "Зона", pose: "Точка", part: "Частичная", chargego: "Возврат", wallfollow: "Вдоль стен", selectroom: "Комнаты" };
const SUCTION_LABELS = { gentle: "Тихий", normal: "Нормальный", strong: "Сильный" };
const WATER_LABELS = { closed: "Выкл.", low: "Низкий", middle: "Средний", high: "Высокий" };
const WORK_MODE_LABELS = { both_work: "Сухая и влажная", sweep: "Сухая", sweep_work: "Сухая", mop: "Влажная", mop_work: "Влажная" };
const RESOURCE_LIFE_MINUTES = { filter_life: 9000, side_brush_life: 12000, main_brush_life: 18000 };
const STATION_OPERATION_LABELS = { dust_collection: "Сбор пыли", roller_cleaning: "Промывка", drying: "Сушка" };
const ENTITY_SUFFIXES = [
  "vacuum", "battery", "clean_time", "clean_area", "side_brush_life", "main_brush_life", "filter_life",
  "fault", "work_mode", "raw_status", "robot_status", "station_status", "composite_status", "last_telemetry",
  "telemetry_age", "local_connection", "dust_collection", "roller_cleaning", "roller_drying", "custom_mode",
  "resume_cleaning", "do_not_disturb", "child_lock", "mode", "suction", "water", "volume", "refresh",
  "start_dust_collection", "start_roller_cleaning", "start_roller_drying",
  "stop_dust_collection", "stop_roller_cleaning", "stop_roller_drying",
];
const ENTITY_SUFFIXES_BY_LENGTH = [...ENTITY_SUFFIXES].sort((left, right) => right.length - left.length);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function s8SafeReturnRoute(value) {
  if (!value) return null;
  try {
    const url = new URL(decodeURIComponent(String(value).trim()), window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (url.pathname === "/dashboard-house-v13" || url.pathname.startsWith("/dashboard-house-v13/")) {
      return "/dashboard-house-v13/home";
    }
    if (url.pathname === "/dashboard-rooms-v11" || url.pathname.startsWith("/dashboard-rooms-v11/")) {
      return "/dashboard-rooms-v11/rooms";
    }
    if (url.pathname === "/dashboard-actions" || url.pathname.startsWith("/dashboard-actions/")) {
      return "/dashboard-actions/home";
    }
    if (url.pathname === "/dashboard-infrastructure" || url.pathname.startsWith("/dashboard-infrastructure/")) {
      return "/dashboard-infrastructure/overview";
    }
    return null;
  } catch (_err) {
    return null;
  }
}

const NIKAS_SHELL_BOUNDARY_THRESHOLD_PX = 4;

function shouldBlockNikasShellBoundaryMove({
  deltaX,
  deltaY,
  inViewport,
  scrollTop,
  scrollHeight,
  clientHeight,
}) {
  if (!Number.isFinite(deltaY) || Math.abs(deltaY) <= Math.abs(Number(deltaX) || 0)) return false;
  if (!inViewport) return true;
  const maximumScroll = Math.max(0, (Number(scrollHeight) || 0) - (Number(clientHeight) || 0));
  if (maximumScroll <= 1) return true;
  const currentScroll = Math.max(0, Number(scrollTop) || 0);
  if (deltaY > 0 && currentScroll <= 1) return true;
  return deltaY < 0 && currentScroll >= maximumScroll - 1;
}

function createNikasShellScrollBoundaryGuard({ host, viewport }) {
  if (!host?.addEventListener || !viewport) return () => {};
  let touch = null;

  const eventStartedInViewport = (event) => {
    const path = typeof event.composedPath === "function" ? event.composedPath() : [];
    return path.includes(viewport) || Boolean(viewport.contains?.(event.target));
  };
  const rememberTouch = (event) => {
    if (event.touches.length !== 1) {
      touch = null;
      return;
    }
    const current = event.touches[0];
    touch = {
      x: current.clientX,
      y: current.clientY,
      startX: current.clientX,
      startY: current.clientY,
      inViewport: eventStartedInViewport(event),
      blocked: false,
    };
  };
  const moveTouch = (event) => {
    if (event.touches.length !== 1) {
      touch = null;
      return;
    }
    const current = event.touches[0];
    if (!touch) {
      rememberTouch(event);
      return;
    }
    const deltaX = current.clientX - touch.x;
    const deltaY = current.clientY - touch.y;
    const travelX = current.clientX - touch.startX;
    const travelY = current.clientY - touch.startY;
    touch.x = current.clientX;
    touch.y = current.clientY;
    const verticalIntent = Math.abs(travelY) > NIKAS_SHELL_BOUNDARY_THRESHOLD_PX
      && Math.abs(travelY) > Math.abs(travelX);
    if (!touch.blocked && verticalIntent) {
      touch.blocked = shouldBlockNikasShellBoundaryMove({
        deltaX,
        deltaY,
        inViewport: touch.inViewport,
        scrollTop: viewport.scrollTop,
        scrollHeight: viewport.scrollHeight,
        clientHeight: viewport.clientHeight,
      });
    }
    if (touch.blocked && event.cancelable) event.preventDefault();
  };
  const endTouch = (event) => {
    if (event.touches.length === 1) rememberTouch(event);
    else touch = null;
  };
  const cancelTouch = () => { touch = null; };

  host.addEventListener("touchstart", rememberTouch, { passive: false, capture: true });
  host.addEventListener("touchmove", moveTouch, { passive: false, capture: true });
  host.addEventListener("touchend", endTouch, { passive: true, capture: true });
  host.addEventListener("touchcancel", cancelTouch, { passive: true, capture: true });

  return () => {
    host.removeEventListener("touchstart", rememberTouch, true);
    host.removeEventListener("touchmove", moveTouch, true);
    host.removeEventListener("touchend", endTouch, true);
    host.removeEventListener("touchcancel", cancelTouch, true);
    touch = null;
  };
}

function s8ResolveReturnRoute(panel) {
  const current = new URL(window.location.href);
  const explicit = ["return_to", "from"]
    .map((key) => s8SafeReturnRoute(current.searchParams.get(key)))
    .find(Boolean) || null;
  let handedOff = null;
  let saved = null;
  try {
    const handedOffRaw = sessionStorage.getItem(SOURCE_ROUTE_KEY);
    const handedOffAtRaw = sessionStorage.getItem(SOURCE_ROUTE_AT_KEY);
    const handedOffAt = Number(handedOffAtRaw);
    const handedOffAge = Date.now() - handedOffAt;
    const handoffIsFresh = handedOffRaw !== null
      && handedOffAtRaw !== null
      && Number.isFinite(handedOffAt)
      && handedOffAge >= 0
      && handedOffAge <= SOURCE_ROUTE_TTL_MS;
    handedOff = handoffIsFresh ? s8SafeReturnRoute(handedOffRaw) : null;
    sessionStorage.removeItem(SOURCE_ROUTE_KEY);
    sessionStorage.removeItem(SOURCE_ROUTE_AT_KEY);
    saved = s8SafeReturnRoute(sessionStorage.getItem(RETURN_ROUTE_KEY));
  } catch (_err) {}
  const configured = s8SafeReturnRoute(
    panel?._panel?.config?.parent_route || panel?._panel?.config?.parent_path,
  );
  const route = explicit
    || handedOff
    || saved
    || s8SafeReturnRoute(document.referrer)
    || configured
    || SAFE_DEFAULT_ROUTE;
  try { sessionStorage.setItem(RETURN_ROUTE_KEY, route); } catch (_err) {}
  return route;
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

function s8SameNodeKind(current, desired) {
  return Boolean(
    current
    && desired
    && current.nodeType === desired.nodeType
    && (current.nodeType !== Node.ELEMENT_NODE || current.tagName === desired.tagName)
  );
}

function s8ReconcileTree(current, desired) {
  if (!s8SameNodeKind(current, desired)) return false;
  if (current.nodeType === Node.TEXT_NODE) {
    if (current.nodeValue !== desired.nodeValue) current.nodeValue = desired.nodeValue;
    return true;
  }
  if (current.nodeType === Node.ELEMENT_NODE) s8SyncAttributes(current, desired);
  let index = 0;
  while (index < desired.childNodes.length) {
    const wanted = desired.childNodes[index];
    const existing = current.childNodes[index];
    if (!existing) {
      current.appendChild(wanted.cloneNode(true));
    } else if (!s8SameNodeKind(existing, wanted)) {
      existing.replaceWith(wanted.cloneNode(true));
    } else {
      s8ReconcileTree(existing, wanted);
    }
    index += 1;
  }
  while (current.childNodes.length > desired.childNodes.length) {
    current.lastChild.remove();
  }
  return true;
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
    this._multiTapStartedAt = 0;
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
    this._boundStableViews = new WeakSet();
    this._returnRoute = null;
    this._scrollBoundaryCleanup = null;
    this._busyCommands = new Set();
    this._refreshPending = false;
    this._commandError = null;
    this._cleaningDraft = {};
    this._onRealViewportResize = () => requestAnimationFrame(() => this._clampAndApplyTransform(false));
  }

  set hass(value) { this._hass = value; this._ensureRegistry(); this._queueLivePatch(); }
  get hass() { return this._hass; }
  set panel(value) { this._panel = value; if (!this._returnRoute) this._returnRoute = s8ResolveReturnRoute(this); if (!this._gesturePointers?.size) this._restoreTransform(true); else this._renderDeferred = true; this._ensureRegistry(); this._queueRender(); }
  set narrow(_value) {}
  connectedCallback() {
    if (this._panel && !this._returnRoute) this._returnRoute = s8ResolveReturnRoute(this);
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
    this._scrollBoundaryCleanup?.();
    this._scrollBoundaryCleanup = null;
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
        const suffix = ENTITY_SUFFIXES_BY_LENGTH.find((key) => item.unique_id?.endsWith(`_${key}`));
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
  _formatCleaningTime(value, area, snap) {
    if (value === null || value === undefined || value === "") return "—";
    const minutes = Number(value); const squareMeters = Number(area);
    if (!Number.isFinite(minutes)) return "—";
    const active = ["cleaning", "zone_cleaning", "room_cleaning", "paused", "returning_to_dock"].includes(snap?.robot)
      || (Number.isFinite(squareMeters) && squareMeters > 0);
    if (minutes <= 0) return active ? "< 1 мин" : "—";
    return `${Math.max(1, Math.round(minutes))} мин`;
  }
  _resourceLife(key, connected) {
    const rawValue = connected ? this._stateValue(key) : null;
    const raw = rawValue === null || rawValue === undefined || rawValue === "" ? NaN : Number(rawValue);
    const limit = RESOURCE_LIFE_MINUTES[key];
    if (!Number.isFinite(raw) || !Number.isFinite(limit) || limit <= 0) {
      return { percent: null, minutes: null, tone: "unknown" };
    }
    const minutes = Math.max(0, Math.round(raw));
    const percent = Math.max(0, Math.min(100, Math.floor((minutes / limit) * 100)));
    return { percent, minutes, tone: percent <= 10 ? "critical" : percent <= 25 ? "warning" : "normal" };
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
    const rawAge = this._stateValue("telemetry_age");
    const age = typeof rawAge === "number" || (typeof rawAge === "string" && rawAge.trim()) ? Number(rawAge) : NaN;
    const validAge = Number.isFinite(age) && age >= 0;
    const hasSnapshot = attrs.has_successful_snapshot !== false && (attrs.has_successful_snapshot === true || validAge);
    if (!hasSnapshot) return "no_data";
    if (connection === "disconnected") return "stale";
    const declared = String(attrs.telemetry_status || "").toLowerCase();
    const configuredThreshold = Number(attrs.stale_after_seconds);
    const scan = Number(attrs.scan_interval_seconds);
    const threshold = Number.isFinite(configuredThreshold) && configuredThreshold > 0
      ? configuredThreshold
      : Number.isFinite(scan) && scan > 0 ? scan * 3 : 15;
    if (validAge && age > threshold) return "stale";
    if (declared === "stale") return "stale";
    if (declared === "no_data" || (!validAge && declared !== "current")) return "no_data";
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
    const viewKey = escapeHtml(this._stableViewKey());
    return `<div class="work-viewport ${mode}" data-work-viewport><div class="work-canvas" data-work-canvas style="transform:${this._transformCss()}"><div class="content"><div class="stable-view" data-stable-view="${viewKey}">${content}</div></div></div><div class="scale-toast" data-scale-toast aria-live="polite"></div></div>`;
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
    if (detail !== "cleaning-settings" || this._detail !== detail) this._cleaningDraft = {};
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
      this._multiTapStartedAt = performance.now();
      this._gestureMoved = false;
      this._suppressClicksUntil = Date.now() + 480;
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
      const duration = this._multiTapStartedAt ? now - this._multiTapStartedAt : 999;
      if (!cancelled && wasMulti && !moved && duration < 300) {
        if (now - this._twoFingerTapAt < 560) {
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
      this._multiTapStartedAt = 0;
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
    const state = entityId ? this._hass?.states?.[entityId] : null;
    const targetState = String(state?.state || "").toLowerCase();
    const targetAvailable = state && !["unknown", "unavailable"].includes(targetState);
    if (!entityId || !this._hass || !targetAvailable) {
      this._commandError = "Цель команды недоступна или не подтверждена Home Assistant.";
      this._queueLivePatch();
      return false;
    }
    const commandKey = `${domain}.${service}:${entityId}`;
    if (this._busyCommands.has(com…13572 tokens truncated…ning = 700 - (Date.now() - startedAt);
      if (remaining > 0) await new Promise(resolve => setTimeout(resolve, remaining));
      this._refreshPending = false;
      this._queueLivePatch();
    }
  }

  _trustBanner(snap) {
    const visible = snap.unreliable || snap.composite === "unknown" || snap.composite === "error";
    const title = snap.connection === "disconnected" ? "S8 OMNI недоступен" : snap.connection === "unknown" ? "Связь не подтверждена" : snap.composite === "error" ? "Требуется внимание" : "Состояние не подтверждено";
    const text = snap.connection === "disconnected" ? "Последние данные сохранены только для диагностики." : snap.connection === "unknown" ? "Текущая локальная телеметрия пока не подтверждена." : snap.composite === "error" ? "Проверьте ошибку робота в Диагностике." : "Часть данных отсутствует или неизвестна.";
    return `<div class="trust-banner${visible ? "" : " is-hidden"}" aria-hidden="${visible ? "false" : "true"}"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><div><strong>${title}</strong><span>${text}</span></div></div>`;
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
    if (snap.connection === "disconnected") return { image: "base", title: "Нет связи", hint: "Нет актуальной локальной телеметрии", tone: "error" };
    if (snap.connection === "unknown") return { image: "base", title: "Нет данных", hint: "Первоначальный локальный опрос ещё не завершён", tone: "warn" };
    const faultValue = Number(this._stateValue("fault", 0));
    if (snap.composite === "error" || (Number.isFinite(faultValue) && faultValue !== 0)) {
      return { image: "error", title: "Требуется внимание", hint: "Проверьте робот или станцию", tone: "error" };
    }
    const ops = new Set(snap.stationOperations || []);
    if (ops.size > 1 || snap.station === "multiple_operations") {
      const labels = [...ops].map((x) => STATION_OPERATION_LABELS[x] || x).join(" · ");
      return { image: "dock", title: "Станция работает", hint: labels || "Выполняется несколько операций станции", tone: "operation" };
    }
    if (ops.has("dust_collection") || snap.station === "dust_collection") return { image: "dust", title: "Сбор пыли", hint: "Станция опустошает пылесборник робота", tone: "operation" };
    if (ops.has("roller_cleaning") || snap.station === "roller_cleaning") return { image: "wash", title: "Мойка швабры", hint: "Станция промывает швабру", tone: "operation" };
    if (ops.has("drying") || snap.station === "drying") return { image: "dry", title: "Сушка швабры", hint: "Станция сушит швабру тёплым воздухом", tone: "warm" };
    if (snap.composite === "returning_to_dock" || snap.robot === "returning_to_dock") return { image: "returning", title: "Возврат", hint: "Возвращается на базу", tone: "operation" };
    if (["cleaning", "zone_cleaning", "room_cleaning"].includes(snap.composite) || ["cleaning", "zone_cleaning", "room_cleaning"].includes(snap.robot)) return { image: "cleaning", title: "Уборка", hint: "Выполняется уборка", tone: "operation" };
    if (snap.composite === "paused" || snap.robot === "paused") return { image: "paused", title: "Пауза", hint: "Уборка приостановлена", tone: "neutral" };
    if (snap.robot === "charging") {
      const charge = snap.battery === null ? "—" : `${Math.round(snap.battery)}%`;
      return { image: "charging", title: "Заряжается", hint: `Идёт зарядка · ${charge}`, tone: "good" };
    }
    if (snap.robot === "charged" || snap.onDock === true) return { image: "base", title: "На базе", hint: "Готов к уборке", tone: "good" };
    return { image: "away", title: "Ожидание", hint: "Робот ожидает команду", tone: "neutral" };
  }

  _resourceStrip(snap) {
    // Tank and bag levels are not exposed by the integration.
    const value = "Нет данных";
    return `<div class="resource-strip"><div class="resource-chip"><ha-icon icon="mdi:water"></ha-icon><span><strong>Чистая вода</strong><small>${value}</small></span></div><div class="resource-chip dirty"><ha-icon icon="mdi:water-opacity"></ha-icon><span><strong>Грязная вода</strong><small>${value}</small></span></div><div class="resource-chip dustbag"><ha-icon icon="mdi:delete-outline"></ha-icon><span><strong>Пыль/мешок</strong><small>${value}</small></span></div></div>`;
  }

  _hero() {
    const snap = this._snapshot();
    const state = this._heroState(snap);
    const connection = this._connectionIndicatorState();
    const charging = !snap.unreliable && snap.robot === "charging";
    const charged = !snap.unreliable && snap.robot === "charged";
    const battery = snap.battery === null ? "—" : `${Math.round(snap.battery)}%`;
    const mode = this._modeLabel(snap), modeMeta = this._modeMeta(snap, mode);
    const batteryIcon = this._batteryIcon(snap, charging, charged), modeIcon = this._modeIcon(snap);
    const batteryTone = snap.battery !== null && snap.battery < 15 ? " low" : "";
    const image = HERO_IMAGES[state.image] || HERO_IMAGES.base;
    const ops = new Set(snap.stationOperations || []);
    let stationLabel = snap.station === "unknown" ? "Нет данных" : "Ожидает";
    let stationTone = "";
    let stationIcon = "mdi:home";
    if (snap.unreliable || snap.station === "unknown") {
      stationLabel = "Нет данных";
      stationIcon = "mdi:home-question";
    } else if (state.tone === "error") {
      stationLabel = "Ошибка";
      stationTone = "error";
      stationIcon = "mdi:home-alert-outline";
    } else if (ops.size > 1 || snap.station === "multiple_operations") {
      stationLabel = "Работает";
    } else if (ops.has("dust_collection") || snap.station === "dust_collection") {
      stationLabel = "Сбор пыли";
    } else if (ops.has("roller_cleaning") || snap.station === "roller_cleaning") {
      stationLabel = "Промывка";
    } else if (ops.has("drying") || snap.station === "drying") {
      stationLabel = "Сушка";
    } else if (snap.robot === "charging") {
      stationLabel = "Заряжает";
    } else if (snap.onDock === true || snap.robot === "charged") {
      stationLabel = "Готова";
    }
    const stationMeta = stationLabel === "Нет данных" ? "Состояние неизвестно"
      : stationLabel === "Ошибка" ? "Требует внимания"
      : stationLabel === "Готова" ? "Готова к работе"
      : stationLabel === "Заряжает" ? "Идёт зарядка"
      : stationLabel === "Ожидает" ? "На связи"
      : "Операция активна";
    return `<section class="card hero state-hero ${state.tone || ""}" data-more="composite_status"><div class="hero-primary"><div class="hero-top"><div><h1>${escapeHtml(state.title)}</h1><p class="hero-hint">${escapeHtml(state.hint)}</p></div><div class="connection-indicator ${connection.tone}" data-more="local_connection" role="status" aria-label="${escapeHtml(connection.label)} · ${escapeHtml(connection.freshnessLabel)}"><i class="connection-lamp"></i><span class="connection-copy"><strong>${escapeHtml(connection.label)}</strong><small class="${connection.freshnessTone}">${escapeHtml(connection.freshnessLabel)}</small></span></div></div><div class="state-scene ${snap.unreliable ? "muted" : ""}"><img class="state-image" src="${image}" alt="S8 OMNI — ${escapeHtml(state.title)}" loading="eager" decoding="sync" fetchpriority="high" /></div></div>${this._resourceStrip(snap)}<div class="hero-metrics"><div data-more="battery"><ha-icon class="metric-icon battery${batteryTone}" icon="${batteryIcon}"></ha-icon><span>АКБ</span><strong>${battery}</strong><small>Текущий заряд</small><div class="battery-bar"><i style="width:${snap.battery ?? 0}%"></i></div></div><div data-more="mode"><ha-icon class="metric-icon mode" icon="${modeIcon}"></ha-icon><span>Режим</span><strong>${escapeHtml(mode)}</strong><small>${escapeHtml(modeMeta)}</small></div><div class="${stationTone ? `station-${stationTone}` : ""}" data-more="station_status"><ha-icon class="metric-icon station ${stationTone}" icon="${stationIcon}"></ha-icon><span>Станция</span><strong>${escapeHtml(stationLabel)}</strong><small>${escapeHtml(stationMeta)}</small></div></div></section>`;
  }

  _quickActions() {
    const snap = this._snapshot();
    const commandBusy = this._busyCommands.size > 0;
    const vacuum = snap.vacuum, available = snap.connected && this._available(vacuum) && !commandBusy;
    const cleaning = vacuum?.state === "cleaning" || ["cleaning", "zone_cleaning", "room_cleaning"].includes(snap.robot);
    const paused = vacuum?.state === "paused" || snap.robot === "paused";
    const returning = snap.robot === "returning_to_dock" || snap.composite === "returning_to_dock";
    const docked = snap.onDock === true || ["charging", "charged"].includes(snap.robot);
    const faultValue = Number(this._stateValue("fault", 0));
    const attention = snap.composite === "error" || (Number.isFinite(faultValue) && faultValue !== 0);
    const activeStationStops = this._activeStationStopKeys(snap);
    const stationActive = activeStationStops.length > 0;
    const verifiedStationStop = activeStationStops.length === 1 ? activeStationStops[0] : null;
    const actionButton = (label, icon, action = null, enabled = false, ready = false, extra = "", stationStop = null) => `<button class="action${ready ? " ready" : ""}${extra ? ` ${extra}` : ""}" type="button"${action ? ` data-action="${action}"` : ""}${stationStop ? ` data-station-stop="${stationStop}"` : ""}${enabled ? "" : " disabled"}><span class="action-icon"><ha-icon icon="${icon}"></ha-icon></span><strong>${label}</strong></button>`;

    if (stationActive) {
      return `<div class="quick-actions">${actionButton("Уборка", "mdi:play", null, false)}${actionButton("Пауза", "mdi:pause", null, false)}${actionButton("Стоп", "mdi:stop", null, available && Boolean(verifiedStationStop), false, "stop", verifiedStationStop)}</div>`;
    }
    if (attention) {
      return `<div class="quick-actions">${actionButton("Уборка", "mdi:play", null, false)}${actionButton("Пауза", "mdi:pause", null, false)}${actionButton("Домой", "mdi:home", null, false)}</div>`;
    }
    if (cleaning) {
      return `<div class="quick-actions">${actionButton("Уборка", "mdi:play", null, false)}${actionButton("Пауза", "mdi:pause", "pause", available, true)}${actionButton("Домой", "mdi:home", "home", available, true)}</div>`;
    }
    if (paused) {
      return `<div class="quick-actions">${actionButton("Уборка", "mdi:play", "start", available, true)}${actionButton("Пауза", "mdi:pause", null, false)}${actionButton("Домой", "mdi:home", "home", available, true)}</div>`;
    }
    if (returning) {
      return `<div class="quick-actions">${actionButton("Уборка", "mdi:play", null, false)}${actionButton("Пауза", "mdi:pause", "pause", available, true)}${actionButton("Домой", "mdi:home", null, false)}</div>`;
    }
    return `<div class="quick-actions">${actionButton("Уборка", "mdi:play", "start", available, true)}${actionButton("Пауза", "mdi:pause", null, false)}${actionButton("Домой", "mdi:home", "home", available && !docked, !docked)}</div>`;
  }

  _overview() {
    return `<div>${this._hero()}${this._quickActions()}</div>`;
  }

  _cleaning() {
    const snap = this._snapshot();
    const cleanTime = snap.connected ? this._stateValue("clean_time") : null; const cleanArea = snap.connected ? this._stateValue("clean_area") : null;
    const suction = snap.connected ? this._label(SUCTION_LABELS, this._stateValue("suction"), "Нет данных") : "Нет данных";
    const water = snap.connected ? this._label(WATER_LABELS, this._stateValue("water"), "Нет данных") : "Нет данных";
    const volumeObj = this._state("volume"); const volumeValue = snap.connected && this._available(volumeObj) ? Number(volumeObj.state) : null;
    const dndObj = this._state("do_not_disturb"); const dnd = snap.connected && this._available(dndObj) ? (dndObj.state === "on" ? "Вкл" : "Выкл") : "Нет данных";
    return `${this._trustBanner(snap)}<section class="card"><div class="section-title"><h2>Текущая уборка</h2></div><div class="metric-grid"><div class="metric" data-more="clean_time"><ha-icon icon="mdi:timer-outline"></ha-icon><span>Время</span><strong>${escapeHtml(this._formatCleaningTime(cleanTime, cleanArea, snap))}</strong></div><div class="metric" data-more="clean_area"><ha-icon icon="mdi:ruler-square"></ha-icon><span>Площадь</span><strong>${cleanArea !== null ? `${escapeHtml(cleanArea)} м²` : "—"}</strong></div></div></section><section class="card"><div class="section-title"><h2>Как убирать</h2></div><div class="metric-grid"><div class="metric profile-metric" data-more="suction"><ha-icon icon="mdi:fan"></ha-icon><span>Всасывание</span><strong>${escapeHtml(suction)}</strong></div><div class="metric profile-metric" data-more="water"><ha-icon icon="mdi:water-outline"></ha-icon><span>Подача воды</span><strong>${escapeHtml(water)}</strong></div></div></section><button class="settings-entry" type="button" data-detail="cleaning-settings"><span class="icon"><ha-icon icon="mdi:tune-variant"></ha-icon></span><span><strong>Настроить уборку</strong><span>Громкость: ${Number.isFinite(volumeValue) ? `${Math.round(volumeValue)}%` : "Нет данных"} · Не беспокоить: ${escapeHtml(dnd)}</span></span><ha-icon icon="mdi:chevron-right"></ha-icon></button><section class="future-card"><span class="icon"><ha-icon icon="mdi:map-outline"></ha-icon></span><div><span class="eyebrow">Следующий этап</span><strong>Карта и комнаты</strong><p>Комнатная и зональная уборка появятся после завершения безопасной поддержки в интеграции.</p></div></section>`;
  }

  _segmentControl(key, labels, columns, title, hint) {
    const snap = this._snapshot(); const obj = this._state(key); const value = snap.connected && this._available(obj) ? obj.state : null;
    const selected = Object.prototype.hasOwnProperty.call(this._cleaningDraft, key) ? this._cleaningDraft[key] : value;
    const selectedHint = selected !== null && labels[selected] ? labels[selected] : hint;
    return `<div class="segment-group" data-more="${key}"><div class="segment-label"><strong>${title}</strong><span>${selectedHint}</span></div><div class="segments ${columns}">${Object.entries(labels).map(([raw,label]) => `<button class="segment ${selected === raw ? "active" : ""}" type="button" data-select-key="${key}" data-select-value="${raw}" ${value === null || this._busyCommands.size > 0 ? "disabled" : ""}>${label}</button>`).join("")}</div></div>`;
  }

  _cleaningSettings() {
    const snap = this._snapshot(); const volume = this._state("volume"); const dnd = this._state("do_not_disturb");
    const commandBusy = this._busyCommands.size > 0;
    const rawVolume = snap.connected && this._available(volume) ? Number(volume.state) : null;
    const rawDnd = snap.connected && this._available(dnd) ? dnd.state === "on" : null;
    const volumeValue = Object.prototype.hasOwnProperty.call(this._cleaningDraft, "volume") ? this._cleaningDraft.volume : rawVolume;
    const dndValue = Object.prototype.hasOwnProperty.call(this._cleaningDraft, "do_not_disturb") ? this._cleaningDraft.do_not_disturb : rawDnd;
    const dndUsable = rawDnd !== null && !commandBusy;
    const workModeRaw = snap.connected ? String(snap.workMode || "").toLowerCase() : "";
    const workMode = WORK_MODE_LABELS[workModeRaw] || "Нет данных";
    const hasDraft = this._hasCleaningDraft();
    return `${this._trustBanner(snap)}<section class="card"><div class="mode-readout" data-more="work_mode"><span>Режим уборки</span><strong>${escapeHtml(workMode)}</strong></div>${this._segmentControl("suction",SUCTION_LABELS,"three","Мощность всасывания",this._label(SUCTION_LABELS,snap.connected ? this._stateValue("suction") : null,"Нет данных"))}${this._segmentControl("water",WATER_LABELS,"four","Подача воды",this._label(WATER_LABELS,snap.connected ? this._stateValue("water") : null,"Нет данных"))}</section><section class="card"><div class="section-title"><div><span class="eyebrow">Звук</span><h2>Громкость</h2></div></div><div class="slider-row"><div class="slider-head"><span><strong>Голосовые уведомления</strong></span><strong data-volume-label>${volumeValue === null ? "—" : `${Math.round(volumeValue)}%`}</strong></div><input type="range" min="0" max="100" step="1" value="${volumeValue === null ? 0 : volumeValue}" data-volume ${volumeValue === null || commandBusy ? "disabled" : ""}></div></section><section class="card"><div class="section-title"><div><span class="eyebrow">Поведение</span><h2>Автоматизация</h2></div></div><button class="toggle-row" type="button" data-toggle="do_not_disturb" ${dndUsable ? "" : "disabled"}><span><strong>Не беспокоить</strong><small>Без звука, расписания и возобновления уборки; период задаётся в приложении.</small></span><span class="toggle ${dndValue === true ? "on" : ""}"></span></button></section><section class="card apply-card"><div><strong>${hasDraft ? "Изменения готовы" : "Настройки без изменений"}</strong><small>${hasDraft ? "Параметры будут записаны после подтверждения и проверены по данным устройства." : "Сначала измените один или несколько параметров."}</small></div><button class="apply-button" type="button" data-apply-cleaning ${hasDraft && !commandBusy ? "" : "disabled"}>Применить</button></section>`;
  }

  _operation(key, label, icon, snap) {
    const obj = this._state(key); const usable = snap.connected && this._available(obj); const active = usable && obj.state === "on";
    const commandKey = `${active ? "stop" : "start"}_${key}`; const command = this._state(commandKey);
    const docked = snap.onDock === true || ["charging", "charged"].includes(snap.robot);
    const commandUsable = usable && command && command.state !== "unavailable" && this._busyCommands.size === 0 && (active || docked);
    const commandLabel = active ? "Остановить" : "Запустить";
    return `<div class="operation ${active ? "active" : commandUsable ? "ready" : ""}" data-more="${key}"><span class="icon"><ha-icon icon="${icon}"></ha-icon></span><span><strong>${label}</strong><span>${!usable ? "Нет данных" : active ? "Работает" : docked ? "Готово к запуску" : "Робот не на базе"}</span></span><button class="operation-control ${active ? "stop" : "start"}" type="button" data-station-command="${commandKey}" data-station-label="${label}" ${commandUsable ? "" : "disabled"}>${commandLabel}</button></div>`;
  }

  _station() {
    const snap = this._snapshot();
    const station = snap.unreliable ? "Нет данных" : this._label(STATION_LABELS, snap.station, "Нет данных");
    const robotPosition = snap.unreliable ? "Положение неизвестно" : snap.onDock === true ? "Робот на базе" : snap.onDock === false ? "Робот не на базе" : "Положение неизвестно";
    const charge = snap.battery === null ? "—" : `${Math.round(snap.battery)}%`;
    const operation = !snap.unreliable && snap.stationOperations.length > 1
      ? snap.stationOperations.map((x) => STATION_OPERATION_LABELS[x] || x).join(" · ") : "";
    return `<div>${this._trustBanner(snap)}<section class="card station-hero" data-more="station_status"><div class="station-device"><ha-icon icon="mdi:home-automation"></ha-icon></div><div><span class="eyebrow">Станция S8 OMNI</span><h2>${escapeHtml(station)}</h2><p class="station-position">${escapeHtml(robotPosition)} · Заряд ${escapeHtml(charge)}</p><p class="station-operations${operation ? "" : " is-hidden"}">${escapeHtml(operation)}</p></div></section><section class="card"><div class="section-title"><h2>Операции станции</h2></div><div class="operation-list">${this._operation("dust_collection","Сбор пыли","mdi:delete-sweep-outline",snap)}${this._operation("roller_cleaning","Промывка","mdi:waves",snap)}${this._operation("roller_drying","Сушка","mdi:weather-windy",snap)}</div></section><section class="future-card"><span class="icon"><ha-icon icon="mdi:information-outline"></ha-icon></span><div><strong>Ручное управление станцией</strong><p>Запуск доступен только когда робот находится на базе. Активную операцию можно остановить здесь или общей кнопкой «Стоп» на «Обзоре».</p></div></section></div>`;
  }

  _formatResourceTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return hours ? `${hours} ч${remainder ? ` ${remainder} мин` : ""}` : `${remainder} мин`;
  }

  _resource(key, title, icon, connected) {
    const life = this._resourceLife(key, connected);
    const minutes = life.minutes === null ? "Нет данных" : `Осталось ${this._formatResourceTime(life.minutes)}`;
    const percent = life.percent === null ? "—" : `${life.percent}%`;
    return `<div class="resource ${life.tone}" data-more="${key}"><span class="icon"><ha-icon icon="${icon}"></ha-icon></span><span><strong>${title}</strong><span>${escapeHtml(minutes)}</span></span><b>${escapeHtml(percent)}</b></div>`;
  }
  _maintenance() {
    const snap = this._snapshot();
    return `${this._trustBanner(snap)}<section class="view-heading"><span class="eyebrow">S8 OMNI</span><h2>Обслуживание</h2><p>Остаточный ресурс расходников.</p></section><section class="card resource-list" aria-label="Ресурс расходников">${this._resource("filter_life","Фильтр","mdi:air-filter",snap.connected)}${this._resource("side_brush_life","Боковая щётка","mdi:fan",snap.connected)}${this._resource("main_brush_life","Основная щётка","mdi:brush",snap.connected)}</section>`;
  }

  _faultStatus(snap) {
    if (!snap.connected || snap.unreliable) return { text: "Нет данных", active: false };
    const freshness = this._telemetryFreshnessState();
    if (freshness !== "current") return { text: freshness === "stale" ? "Данные устарели" : "Нет данных", active: false };
    const raw = this._stateValue("fault");
    const numeric = (typeof raw === "number" || typeof raw === "string" && raw.trim() !== "") ? Number(raw) : NaN;
    const code = Number.isSafeInteger(numeric) && numeric >= 0 ? numeric : null;
    if (code !== null && code !== 0) return { text: `Код ошибки: ${code}`, active: true };
    if (snap.composite === "error" || snap.robot === "error") return { text: "Требуется внимание · код не получен", active: true };
    return { text: code === 0 ? "Ошибок нет" : "Нет данных", active: false };
  }

  _diagRow(label, value) { return `<div class="info-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value === null || value === undefined ? "—" : String(value))}</strong></div>`; }
  _diagnostics() {
    const snap = this._snapshot(); const attrs = snap.attrs || {};
    const fault = this._faultStatus(snap);
    const device = snap.connected ? "Доступно" : snap.connection === "disconnected" ? "Недоступно" : "Не подтверждено";
    const stationData = snap.unreliable || !Array.isArray(attrs.missing_station_dps) ? "Нет данных"
      : snap.missingStationDps.length ? `Нет DP: ${snap.missingStationDps.join(", ")}` : "Получены";
    return `<section class="view-heading"><span class="eyebrow">Технический экран</span><h2>Диагностика</h2><p>Нормализованные и raw-значения интеграции.</p></section><div class="diagnostic-strip"><div><span>Локальная связь</span><strong>${escapeHtml(this._connectionLabel())}</strong></div><div><span>Устройство</span><strong>${device}</strong></div><div><span>Возраст данных</span><strong>${snap.age === null ? "—" : escapeHtml(this._formatDuration(snap.age))}</strong></div></div><section class="card"><div class="section-title"><h2>Состояния</h2></div><div class="info-list"><div class="info-row fault-status${fault.active ? " error" : ""}" data-more="fault"><span>Ошибки</span><strong>${escapeHtml(fault.text)}</strong></div>${this._diagRow("Composite",snap.connected ? this._stateValue("composite_status") : "unavailable")}${this._diagRow("Robot status",snap.connected ? this._stateValue("robot_status") : "unavailable")}${this._diagRow("Station status",snap.connected ? this._stateValue("station_status") : "unavailable")}${this._diagRow("Данные станции",stationData)}</div></section><section class="card"><div class="section-title"><h2>Tuya Raw</h2></div><div class="info-list">${this._diagRow("DP5 status",attrs.raw_status)}${this._diagRow("DP4 mode",attrs.mode)}${this._diagRow("DP41 work_mode",snap.connected ? this._stateValue("work_mode") : "unavailable")}${this._diagRow("DP1 power_go",attrs.power_go)}${this._diagRow("DP2 pause",attrs.pause)}${this._diagRow("DP28 fault",attrs.fault)}${this._diagRow("DP134 dp_dust",attrs.dp_dust)}${this._diagRow("DP135 dp_roll_clean",attrs.dp_roll_clean)}${this._diagRow("DP136 dp_roll_hot",attrs.dp_roll_hot)}</div></section><section class="card"><div class="section-title"><h2>Панель</h2></div><div class="info-list">${this._diagRow("Версия интеграции",this._panel?.config?.integration_version || "—")}${this._diagRow("Версия UI",UI_VERSION)}${this._diagRow("Bundle","standalone")}${this._diagRow("Route","/dashboard-s8-omni")}</div></section>`;
  }

  _body() {
    if (this._detail === "cleaning-settings") {
      return `<div class="detail-heading"><button class="inline-back" type="button" data-detail-back aria-label="Вернуться в Уборку"><ha-icon icon="mdi:arrow-left"></ha-icon></button><div><span class="eyebrow">Уборка</span><h2>Параметры</h2></div></div>${this._cleaningSettings()}`;
    }
    if (this._view === "cleaning") return this._cleaning();
    if (this._view === "station") return this._station();
    if (this._view === "maintenance") return this._maintenance();
    if (this._view === "diagnostics") return this._diagnostics();
    return this._overview();
  }
  _nav() {
    const items = [["overview","mdi:home-outline","Обзор"],["cleaning","mdi:robot-vacuum","Уборка"],["station","mdi:home-automation","Станция"],["maintenance","mdi:tools","Сервис"],["diagnostics","mdi:stethoscope","Диагностика"]];
    const active = this._detail ? "cleaning" : this._view;
    return `<nav aria-label="Основные разделы">${items.map(([view,icon,label]) => `<button type="button" data-view="${view}" class="${active === view ? "active" : ""}"><ha-icon icon="${icon}"></ha-icon><span>${label}</span></button>`).join("")}</nav>`;
  }

  _bind() {
    this.shadowRoot.querySelector("[data-header-primary]")?.addEventListener("click", () => this._toggleMenu());
    this.shadowRoot.querySelector("[data-header-home]")?.addEventListener("click", () => this._navigateParent());
    this.shadowRoot.querySelector("[data-refresh]")?.addEventListener("click", () => this._refresh());
    this.shadowRoot.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => this._switchWorkspace(b.dataset.view, null)));
    this._bindStableContent(this.shadowRoot.querySelector("[data-stable-view]"));
    this._bindWorkspaceGestures();
  }

  _ensureScrollBoundaryGuard() {
    if (this._scrollBoundaryCleanup) return;
    const viewport = this.shadowRoot?.querySelector("[data-work-viewport]");
    if (!viewport) return;
    this._scrollBoundaryCleanup = createNikasShellScrollBoundaryGuard({ host: this, viewport });
  }

  _finishRender() {
    this._bind();
    this._ensureScrollBoundaryGuard();
    requestAnimationFrame(() => {
      this._clampAndApplyTransform(false);
      this._restoreNativeScroll();
    });
  }

  _stableViewKey() {
    if (!this._hass || !this._panel || this._registryLoading || !this._registryLoaded) return "loading";
    if (this._registryError) return "registry-error";
    if (this._detail) return `detail:${this._detail}`;
    return `view:${this._view}`;
  }

  _stableBodyMarkup() {
    if (!this._hass || !this._panel || this._registryLoading || !this._registryLoaded) {
      return `<div class="loading"><div><ha-icon icon="mdi:robot-vacuum"></ha-icon><p>Подключаем интерфейс…</p></div></div>`;
    }
    if (this._registryError) {
      return `<div class="trust-banner"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><div><strong>Не удалось загрузить реестр сущностей</strong><span>${escapeHtml(this._registryError)}</span></div></div>`;
    }
    const commandBusy = this._busyCommands.size > 0;
    const commandFeedback = `<div class="trust-banner command-feedback${commandBusy ? " busy" : this._commandError ? " error" : " is-hidden"}" aria-live="polite"><ha-icon icon="${commandBusy ? "mdi:progress-clock" : "mdi:alert-circle-outline"}"></ha-icon><div><strong>${commandBusy ? "Команда выполняется" : "Команда не выполнена"}</strong><span>${escapeHtml(commandBusy ? "Ожидаем ответ Home Assistant." : this._commandError || "")}</span></div></div>`;
    return `${commandFeedback}${this._body()}`;
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
    if (!root || this._boundStableViews.has(root)) return;
    this._boundStableViews.add(root);
    root.addEventListener("click", async (event) => {
      const button = event.target?.closest?.("button");
      if (!button || !root.contains(button) || button.disabled) return;
      if (button.matches("[data-detail-back]")) {
        this._switchWorkspace("cleaning", null);
        return;
      }
      if (button.matches("[data-detail]")) {
        this._switchWorkspace("cleaning", button.dataset.detail);
        return;
      }
      if (!this._snapshot().connected) return;
      if (button.matches("[data-station-stop]")) {
        if (!window.confirm("Остановить текущую операцию станции?")) return;
        button.disabled = true;
        try { await this._call("button", "press", button.dataset.stationStop); }
        finally { setTimeout(() => this._queueLivePatch(), 650); }
        return;
      }
      if (button.matches("[data-station-command]")) {
        const command = button.dataset.stationCommand; const label = button.dataset.stationLabel || "операцию";
        const start = command.startsWith("start_");
        if (!window.confirm(`${start ? "Запустить" : "Остановить"} «${label}»?`)) return;
        button.disabled = true;
        try { await this._call("button", "press", command); }
        finally { setTimeout(() => this._queueLivePatch(), 650); }
        return;
      }
      if (button.matches("[data-action]")) {
        const action = button.dataset.action;
        const service = action === "start" ? "start" : action === "pause" ? "pause" : action === "home" ? "return_to_base" : null;
        if (!service) return;
        const confirmation = action === "start" ? "Запустить уборку?" : action === "home" ? "Отправить пылесос на базу?" : null;
        if (confirmation && !window.confirm(confirmation)) return;
        button.disabled = true;
        try { await this._call("vacuum", service, "vacuum"); }
        finally { setTimeout(() => this._queueLivePatch(), 650); }
        return;
      }
      if (button.matches("[data-select-key]")) {
        const key = button.dataset.selectKey; const value = button.dataset.selectValue;
        this._setCleaningDraft(key, value);
        this._queueLivePatch();
        return;
      }
      if (button.matches("[data-apply-cleaning]")) {
        const draft = { ...this._cleaningDraft };
        const changes = ["suction", "water", "volume", "do_not_disturb", "child_lock"].filter(
          (key) => Object.prototype.hasOwnProperty.call(draft, key)
            && !this._controlValuesEqual(key, draft[key], this._controlValue(key)),
        );
        if (!changes.length) return;
        const summary = changes.map((key) => {
          if (key === "suction") return `Всасывание: ${SUCTION_LABELS[draft[key]] || draft[key]}`;
          if (key === "water") return `Подача воды: ${WATER_LABELS[draft[key]] || draft[key]}`;
          if (key === "volume") return `Громкость: ${Math.round(Number(draft[key]))}%`;
          if (key === "do_not_disturb") return `Не беспокоить: ${draft[key] ? "Вкл" : "Выкл"}`;
          return `Блокировка от детей: ${draft[key] ? "Вкл" : "Выкл"}`;
        }).join("\n");
        if (!window.confirm(`Применить настройки?\n\n${summary}`)) return;
        for (const key of changes) {
          let applied = false;
          if (["suction", "water"].includes(key)) {
            applied = await this._callConfirmed("select", "select_option", key, { option: draft[key] }, draft[key]);
          } else if (key === "volume") {
            applied = await this._callConfirmed("number", "set_value", key, { value: Number(draft[key]) }, Number(draft[key]));
          } else {
            applied = await this._callConfirmed("switch", draft[key] ? "turn_on" : "turn_off", key, {}, Boolean(draft[key]));
          }
          if (!applied) return;
          delete this._cleaningDraft[key];
        }
        this._cleaningDraft = {};
        this._queueLivePatch();
        return;
      }
      if (button.matches("[data-toggle]")) {
        const key = button.dataset.toggle;
        if (["do_not_disturb", "child_lock"].includes(key)) {
          const current = Object.prototype.hasOwnProperty.call(this._cleaningDraft, key)
            ? Boolean(this._cleaningDraft[key])
            : this._controlValue(key);
          if (current === null) { this._queueLivePatch(); return; }
          this._setCleaningDraft(key, !current);
          this._queueLivePatch();
          return;
        }
      }
    });
    const volume = root.querySelector("[data-volume]");
    volume?.addEventListener("input", () => {
      const label = root.querySelector("[data-volume-label]");
      if (label) label.textContent = `${volume.value}%`;
      this._setCleaningDraft("volume", Number(volume.value));
      const apply = root.querySelector("[data-apply-cleaning]");
      if (apply) apply.disabled = !this._hasCleaningDraft() || this._busyCommands.size > 0;
    });
    volume?.addEventListener("change", () => {
      this._queueLivePatch();
    });
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
    const viewKey = this._stableViewKey();
    const desiredView = s8ElementFromMarkup(
      `<div class="stable-view" data-stable-view="${escapeHtml(viewKey)}">${this._stableBodyMarkup()}</div>`,
    );

    if (s8SameTreeShape(currentHeader, desiredHeader)) s8SyncTree(currentHeader, desiredHeader);
    if (s8SameTreeShape(currentNav, desiredNav)) s8SyncTree(currentNav, desiredNav);
    if (!currentContent || !desiredView) return;

    let activeView = Array.from(currentContent.children).find(
      (node) => node.dataset?.stableView === viewKey,
    );
    if (!activeView) {
      activeView = desiredView;
      currentContent.appendChild(activeView);
      this._bindStableContent(activeView);
    } else if (s8SameTreeShape(activeView, desiredView)) {
      s8SyncTree(activeView, desiredView);
    } else {
      s8ReconcileTree(activeView, desiredView);
    }

    for (const view of Array.from(currentContent.children)) {
      const active = view === activeView;
      view.hidden = !active;
      if (active) view.removeAttribute("inert");
      else view.setAttribute("inert", "");
    }
    this._stableStructureCache = this._stableStructureKey();

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
