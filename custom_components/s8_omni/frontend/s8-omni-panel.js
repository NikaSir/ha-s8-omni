const UI_VERSION = "v0.7.3";
const PRODUCT_ART_BASE64 = "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";
let _productArtBitmapPromise = null;
function productArtBytes() {
  const binary = atob(PRODUCT_ART_BASE64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
function productArtBitmap() {
  if (_productArtBitmapPromise) return _productArtBitmapPromise;
  if (typeof createImageBitmap !== "function") {
    _productArtBitmapPromise = Promise.reject(new Error("createImageBitmap unavailable"));
    return _productArtBitmapPromise;
  }
  const bytes = productArtBytes();
  _productArtBitmapPromise = createImageBitmap(new Blob([bytes], { type: "image/webp" }));
  return _productArtBitmapPromise;
}
class S8ProductArt extends HTMLElement {
  connectedCallback() {
    if (this._mounted) return;
    this._mounted = true;
    this.style.display = "block";
    this.style.position = "relative";
    this.style.width = "100%";
    this.style.height = "100%";
    this.style.overflow = "hidden";
    this.innerHTML = `<canvas aria-hidden="true" style="display:block;width:100%;height:100%"></canvas><div class="product-art-fallback" style="display:none;position:absolute;inset:0;place-items:center"><svg viewBox="0 0 430 190" width="100%" height="100%" aria-label="S8 OMNI fallback"><rect x="145" y="20" width="250" height="128" rx="24" fill="#f8fafb" stroke="#d4dadd"/><rect x="162" y="34" width="62" height="78" rx="13" fill="#d8f3ff"/><rect x="234" y="34" width="62" height="78" rx="13" fill="#e0e4e7"/><rect x="306" y="34" width="62" height="78" rx="13" fill="#ffe0c4"/><rect x="158" y="112" width="226" height="36" rx="15" fill="#232526"/><ellipse cx="83" cy="135" rx="61" ry="29" fill="#f5f7f8" stroke="#d4dadd"/><rect x="27" y="139" width="108" height="9" rx="4.5" fill="#25282a"/></svg></div>`;
    this._canvas = this.querySelector("canvas");
    this._fallback = this.querySelector(".product-art-fallback");
    this._resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(() => this._paint()) : null;
    if (this._resizeObserver) this._resizeObserver.observe(this);
    requestAnimationFrame(() => this._paint());
  }
  disconnectedCallback() {
    if (this._resizeObserver) this._resizeObserver.disconnect();
  }
  async _paint() {
    if (!this.isConnected || !this._canvas) return;
    const rect = this.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) {
      requestAnimationFrame(() => this._paint());
      return;
    }
    try {
      const bitmap = await productArtBitmap();
      if (!this.isConnected) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (this._canvas.width !== width) this._canvas.width = width;
      if (this._canvas.height !== height) this._canvas.height = height;
      const ctx = this._canvas.getContext("2d", { alpha: true });
      if (!ctx) throw new Error("2d canvas unavailable");
      ctx.clearRect(0, 0, width, height);
      const scale = Math.min(width / bitmap.width, height / bitmap.height);
      const drawWidth = bitmap.width * scale;
      const drawHeight = bitmap.height * scale;
      const x = (width - drawWidth) / 2;
      const y = (height - drawHeight) / 2;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, x, y, drawWidth, drawHeight);
      this._canvas.style.display = "block";
      if (this._fallback) this._fallback.style.display = "none";
    } catch (err) {
      this._canvas.style.display = "none";
      if (this._fallback) this._fallback.style.display = "grid";
      console.warn("S8 OMNI product art canvas fallback", err);
    }
  }
}
if (!customElements.get("s8-product-art")) customElements.define("s8-product-art", S8ProductArt);

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
      .omni-scene{position:relative;z-index:1;height:210px;margin-top:12px;border-radius:22px;border:1px solid color-mix(in srgb,var(--divider-color) 64%,transparent);background:linear-gradient(145deg,#ffffff 0%,#f7fbfd 56%,#edf8fc 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.98),0 8px 24px rgba(18,56,72,.035);overflow:hidden}.omni-scene::before{content:"";position:absolute;left:12px;right:102px;bottom:8px;height:42px;border-radius:50%;background:radial-gradient(ellipse at center,rgba(161,177,186,.26) 0%,rgba(161,177,186,.06) 58%,rgba(161,177,186,0) 78%)}.omni-scene::after{content:"";position:absolute;right:-16px;top:-24px;width:184px;height:184px;border-radius:50%;background:radial-gradient(circle,rgba(211,243,255,.78) 0%,rgba(223,244,253,0) 68%)}.omni-art{position:absolute;left:5px;top:7px;bottom:7px;width:77%;display:grid;place-items:center;z-index:2}.product-art{display:block;width:100%;height:100%;max-height:100%;border-radius:20px;filter:drop-shadow(0 10px 13px rgba(43,62,70,.13));transition:opacity .2s ease,filter .2s ease}.omni-art.muted .product-art{opacity:.52;filter:grayscale(.3) drop-shadow(0 8px 11px rgba(43,62,70,.08))}.tank-glow,.charge-glow{position:absolute;pointer-events:none;opacity:0;transition:opacity .22s ease}.tank-glow.on,.charge-glow.on{opacity:1}.tank-glow{top:13%;height:57%;width:17%;border-radius:18px}.tank-glow.wash{left:38.5%;box-shadow:inset 0 0 0 2px rgba(30,170,229,.35),0 0 26px 7px rgba(30,170,229,.23)}.tank-glow.dust{left:54.5%;box-shadow:inset 0 0 0 2px rgba(92,103,111,.28),0 0 22px 6px rgba(92,103,111,.16)}.tank-glow.dry{left:70.5%;box-shadow:inset 0 0 0 2px rgba(242,144,70,.38),0 0 28px 8px rgba(242,144,70,.28)}.charge-glow{left:1%;top:35%;width:39%;height:42%;border-radius:50%;box-shadow:inset 0 0 0 2px rgba(54,177,91,.25),0 0 27px 7px rgba(54,177,91,.20)}.omni-legend{position:absolute;right:8px;top:10px;bottom:10px;width:24%;z-index:5;display:flex;flex-direction:column;justify-content:center;gap:7px;padding:9px;border-radius:19px;background:rgba(255,255,255,.98);border:1px solid rgba(101,112,118,.11);box-shadow:0 10px 26px rgba(0,0,0,.075);backdrop-filter:blur(14px) saturate(115%)}.legend-row{display:grid;grid-template-columns:23px minmax(0,1fr);gap:7px;align-items:center;min-height:32px;padding:5px 5px;color:#4b5359;font-size:11px;font-weight:800;line-height:1.12;border-radius:11px;background:rgba(248,250,251,.96);border:1px solid rgba(91,101,107,.065)}.legend-row ha-icon{--mdc-icon-size:20px;color:#667078}.legend-row.active{color:#20272c;background:#ffffff;border-color:rgba(72,82,88,.10);box-shadow:0 2px 7px rgba(0,0,0,.045)}.legend-row.water.active{background:#edf8ff;color:#166d96;border-color:#c8e9f7}.legend-row.water.active ha-icon{color:#16a9e5}.legend-row.dust.active{background:#f1f3f4;color:#454d53;border-color:#d8dde0}.legend-row.dust.active ha-icon{color:#626c74}.legend-row.dry.active{background:#fff3e9;color:#a85d22;border-color:#f5d7bd}.legend-row.dry.active ha-icon{color:#ee914c}.legend-row.charge.active{background:#edf9f0;color:#2e914b;border-color:#bfe3c8}.legend-row.charge.active ha-icon{color:#32aa56}
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
    const chargeActive = charging || charged || docked;
    const battery = snap.battery === null ? "—" : `${Math.round(snap.battery)}%`;
    const age = snap.age === null ? "—" : this._formatDuration(snap.age);

    return `<section class="card hero" data-more="composite_status">
      <div class="hero-top"><div><span class="eyebrow">Состояние</span><h1>${escapeHtml(compositeLabel)}</h1><p class="hero-hint">${escapeHtml(this._heroHint(snap))}</p></div><div class="connection-badge ${connection !== "Локально" ? "bad" : ""}"><i class="dot"></i>${escapeHtml(connection)}</div></div>
      <div class="omni-scene">
        <div class="omni-art ${snap.unreliable ? "muted" : ""}">
          <s8-product-art class="product-art" aria-label="S8 OMNI robot and station"></s8-product-art>
          <i class="tank-glow wash ${wash ? "on" : ""}"></i>
          <i class="tank-glow dust ${dust ? "on" : ""}"></i>
          <i class="tank-glow dry ${dry ? "on" : ""}"></i>
          <i class="charge-glow ${chargeActive ? "on" : ""}"></i>
        </div>
        <div class="omni-legend">
          <div class="legend-row water ${wash ? "active" : ""}"><ha-icon icon="mdi:water-outline"></ha-icon><span>Промывка</span></div>
          <div class="legend-row dust ${dust ? "active" : ""}"><ha-icon icon="mdi:delete-outline"></ha-icon><span>Пыль/мешок</span></div>
          <div class="legend-row dry ${dry ? "active" : ""}"><ha-icon icon="mdi:weather-windy"></ha-icon><span>Тёплый воздух</span></div>
          <div class="legend-row charge ${chargeActive ? "active" : ""}"><ha-icon icon="${charging ? "mdi:battery-charging" : "mdi:flash"}"></ha-icon><span>${charging ? "Зарядка" : docked ? "На базе" : "Заряд"}</span></div>
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
