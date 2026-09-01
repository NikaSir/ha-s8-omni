const UI_VERSION = "v0.7.39";
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
    if (url.pathname === "/dashboard-house-v11" || url.pathname.startsWith("/dashboard-house-v11/")) {
      return "/dashboard-house-v11/home";
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
    this._busyCommands = new Set();
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
      this._resizeBou