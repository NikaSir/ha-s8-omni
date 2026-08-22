import "./s8-omni-panel-v3.js";

const UI_VERSION = "v0.3.0";
const SUCTION_LABELS = { gentle: "Тихий", normal: "Нормальный", strong: "Сильный" };
const WATER_LABELS = { closed: "Закрыто", low: "Низкий", normal: "Средний", high: "Высокий" };
const STATION_LABELS = {
  dust_collection: "Очистка пылесборника",
  roller_cleaning: "Промывка / очистка",
  drying: "Сушка",
  multiple_operations: "Несколько операций",
};
const ACTIVE_STATION_STATES = new Set(Object.keys(STATION_LABELS));

function replaceText(root, from, to) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);
  for (const textNode of nodes) {
    if (textNode.nodeValue?.includes(from)) {
      textNode.nodeValue = textNode.nodeValue.replaceAll(from, to);
    }
  }
}

function addPolishStyles(root) {
  if (root.querySelector("style[data-s8-polish]")) return;
  const style = document.createElement("style");
  style.dataset.s8Polish = "true";
  style.textContent = `
    .s8-segment-row {
      display: block !important;
      padding: 14px 0 !important;
      min-height: 0 !important;
    }
    .s8-segment-row > div:first-child { margin-bottom: 12px; }
    .s8-segments {
      width: 100%;
      display: grid;
      grid-template-columns: repeat(var(--s8-segment-count), minmax(0, 1fr));
      gap: 7px;
    }
    .s8-segment {
      min-width: 0;
      min-height: 46px;
      border: 1px solid color-mix(in srgb, var(--divider-color) 82%, transparent);
      border-radius: 14px;
      padding: 7px 6px;
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
      font: inherit;
      font-size: 13px;
      font-weight: 750;
      line-height: 1.1;
      text-align: center;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .s8-segment.active {
      border-color: color-mix(in srgb, var(--primary-color) 72%, transparent);
      background: color-mix(in srgb, var(--primary-color) 14%, var(--card-background-color));
      color: var(--primary-color);
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary-color) 18%, transparent);
    }
    .s8-segment:active { transform: scale(.97); }
    .s8-segment:disabled { opacity: .42; cursor: default; }
    .s8-station-live {
      display: flex;
      align-items: center;
      gap: 13px;
      margin: 0 0 14px;
      padding: 15px 17px;
      border-radius: 20px;
      background: color-mix(in srgb, var(--primary-color) 12%, var(--card-background-color));
      border: 1px solid color-mix(in srgb, var(--primary-color) 35%, transparent);
      box-shadow: var(--ha-card-box-shadow, 0 3px 14px rgba(0,0,0,.08));
    }
    .s8-station-live ha-icon {
      --mdc-icon-size: 28px;
      color: var(--primary-color);
      animation: s8StationPulse 1.7s ease-in-out infinite;
    }
    .s8-station-live > div { display:flex; flex-direction:column; gap:2px; min-width:0; }
    .s8-station-live span { color:var(--secondary-text-color); font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; }
    .s8-station-live strong { font-size:17px; line-height:1.2; }
    @keyframes s8StationPulse { 0%,100%{opacity:.62; transform:scale(.94)} 50%{opacity:1; transform:scale(1.04)} }
    @media (prefers-reduced-motion: reduce) { .s8-station-live ha-icon { animation:none; } }
    @media (max-width: 390px) {
      .s8-segment { font-size: 12px; padding-inline: 3px; }
      .s8-segments { gap: 5px; }
    }
  `;
  root.append(style);
}

function simplifyCopy(root) {
  const replacements = [
    ["Отдельный статус станции не зависит от generic vacuum.state.", "Станция работает независимо от основного статуса робота."],
    ["Расписание появится после подтверждения публичного API DP33.", "Режим действует в заданном расписании."],
    ["Архитектурное место готово. Комнатная и зональная уборка будут подключены только через безопасный публичный API ha-s8-omni.", "Карта и комнаты появятся здесь после завершения поддержки в интеграции."],
    ["Команды станции появятся после проверки", "Управление станцией"],
    ["Frontend не пишет Tuya DP напрямую. Очистка, промывка и сушка станут кнопками только после проверенного entity/service интеграции.", "Очистка, промывка и сушка появятся здесь после завершения проверки команд станции."],
    ["Только фактический остаточный ресурс в минутах — без выдуманных процентов.", "Остаточный ресурс расходников."],
    ["Проверенная публичная сущность интеграции", "Защита кнопок робота"],
    ["Reset расходников пока скрыт", "Сброс ресурса"],
    ["DP18 / DP20 / DP22 появятся здесь только после end-to-end проверки записи.", "Сброс станет доступен после завершения проверки безопасной команды."],
  ];
  for (const [from, to] of replacements) replaceText(root, from, to);
}

function fixDisplayVersion(root) {
  replaceText(root, "v0.2.0", UI_VERSION);
  replaceText(root, "v0.2.1", UI_VERSION);
}

function fixStickyReturnMode(panel, root) {
  const robot = panel._stateValue?.("robot_status", "unknown");
  const mode = panel._stateValue?.("mode", null);
  if (!(["charged", "charging"].includes(robot) && mode === "chargego")) return;

  replaceText(root, "Возврат на базу", "На базе");
  replaceText(root, "Текущий режим", "Состояние");
  replaceText(root, "РЕЖИМ", "СОСТОЯНИЕ");
}

function upgradeSelect(panel, root, key, labels) {
  const select = root.querySelector(`select[data-control="${key}"]`);
  if (!select) return;

  const stateObj = panel._state?.(key);
  const current = stateObj?.state;
  const unavailable = !stateObj || current === "unavailable" || current === "unknown";
  const options = [...select.options].map((option) => option.value);
  if (!options.length) return;

  const row = select.parentElement;
  if (row) row.classList.add("s8-segment-row");

  const segments = document.createElement("div");
  segments.className = "s8-segments";
  segments.style.setProperty("--s8-segment-count", String(options.length));
  segments.dataset.segmentControl = key;

  for (const value of options) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `s8-segment${value === current ? " active" : ""}`;
    button.textContent = labels[value] || value;
    button.disabled = unavailable;
    button.setAttribute("aria-pressed", value === current ? "true" : "false");
    button.addEventListener("pointerdown", (event) => event.stopPropagation());
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      if (button.disabled || value === current) return;
      [...segments.children].forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      try {
        await panel._call("select", "select_option", key, { option: value });
      } catch (err) {
        console.warn(`S8 OMNI panel: failed to set ${key}`, err);
        panel._queueRender?.();
      }
    });
    segments.append(button);
  }

  select.replaceWith(segments);
}

function addStationLiveBanner(panel, root) {
  root.querySelector(".s8-station-live")?.remove();
  if (panel._view !== "station") return;

  const station = panel._stateValue?.("station_status", "unknown");
  if (!ACTIVE_STATION_STATES.has(station)) return;

  const content = root.querySelector(".content");
  if (!content) return;

  const banner = document.createElement("div");
  banner.className = "s8-station-live";
  banner.innerHTML = `
    <ha-icon icon="${station === "drying" ? "mdi:weather-windy" : station === "roller_cleaning" ? "mdi:waves" : station === "dust_collection" ? "mdi:delete-sweep-outline" : "mdi:home-automation"}"></ha-icon>
    <div><span>Станция работает</span><strong>${STATION_LABELS[station] || "Активная операция"}</strong></div>
  `;

  const first = content.firstElementChild;
  if (first?.nextSibling) content.insertBefore(banner, first.nextSibling);
  else content.append(banner);
}

const S8OmniPanel = customElements.get("s8-omni-panel");

if (S8OmniPanel && !S8OmniPanel.prototype.__s8DailyPolishPatched) {
  S8OmniPanel.prototype.__s8DailyPolishPatched = true;
  const originalRender = S8OmniPanel.prototype._render;

  S8OmniPanel.prototype._render = function (...args) {
    originalRender.apply(this, args);
    const root = this.shadowRoot;
    if (!root) return;

    addPolishStyles(root);
    fixDisplayVersion(root);
    simplifyCopy(root);
    fixStickyReturnMode(this, root);
    upgradeSelect(this, root, "suction", SUCTION_LABELS);
    upgradeSelect(this, root, "water", WATER_LABELS);
    addStationLiveBanner(this, root);
  };
}
