import "./s8-omni-panel-v9.js";

const UI_VERSION = "v0.5.2";
const S8OmniPanel = customElements.get("s8-omni-panel");

const ROBOT_LABELS = {
  idle: "Ожидание",
  cleaning: "Убирает",
  zone_cleaning: "Убирает зону",
  room_cleaning: "Убирает комнаты",
  paused: "Пауза",
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

const OPERATION_LABELS = {
  dust_collection: "Очистка пылесборника",
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

function installOverviewStatusStyles(root) {
  if (root.querySelector("style[data-s8-overview-status-cards]")) return;
  const style = document.createElement("style");
  style.dataset.s8OverviewStatusCards = "true";
  style.textContent = `
    .s8-status-summary {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-top: 12px;
    }
    .s8-status-card {
      min-height: 104px;
      border-radius: 22px;
      padding: 15px 16px;
      display: grid;
      grid-template-columns: 42px minmax(0, 1fr);
      align-items: center;
      gap: 11px;
      background: var(--card-background-color);
      box-shadow: var(--ha-card-box-shadow, 0 4px 18px rgba(0,0,0,.06));
      box-sizing: border-box;
    }
    .s8-status-icon {
      width: 42px;
      height: 42px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      background: color-mix(in srgb, var(--primary-color) 10%, var(--secondary-background-color));
      color: var(--primary-color);
    }
    .s8-status-icon ha-icon { --mdc-icon-size: 25px; }
    .s8-status-copy { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
    .s8-status-copy span {
      color: var(--secondary-text-color);
      font-size: 11px;
      font-weight: 750;
      letter-spacing: .10em;
      text-transform: uppercase;
    }
    .s8-status-copy strong {
      font-size: 17px;
      line-height: 1.15;
      overflow-wrap: anywhere;
    }
    .s8-status-copy small {
      color: var(--secondary-text-color);
      font-size: 12px;
      line-height: 1.25;
    }
    @media (max-width: 380px) {
      .s8-status-card { padding: 13px; grid-template-columns: 38px minmax(0,1fr); gap: 9px; }
      .s8-status-icon { width: 38px; height: 38px; border-radius: 12px; }
      .s8-status-copy strong { font-size: 16px; }
    }
  `;
  root.append(style);
}

function updateDisplayedVersion(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);
  for (const textNode of nodes) {
    for (const oldVersion of ["v0.5.0", "v0.5.1"]) {
      if (textNode.nodeValue?.includes(oldVersion)) {
        textNode.nodeValue = textNode.nodeValue.replaceAll(oldVersion, UI_VERSION);
      }
    }
  }
}

if (S8OmniPanel && !S8OmniPanel.prototype.__s8OverviewStatusCardsV052) {
  S8OmniPanel.prototype.__s8OverviewStatusCardsV052 = true;
  const originalRender = S8OmniPanel.prototype._render;

  S8OmniPanel.prototype._overview = function () {
    const snap = this._snapshot();
    const robotLabel = ROBOT_LABELS[snap.robot] || "Состояние неизвестно";
    const stationLabel = STATION_LABELS[snap.station] || "Нет достоверных данных";

    let robotContext = "Положение неизвестно";
    if (snap.onDock === true) robotContext = "На базе";
    if (snap.onDock === false) robotContext = "Не на базе";

    let stationContext = "Нет активных операций";
    if (snap.station === "unknown") stationContext = "Проверьте телеметрию станции";
    else if (snap.stationOperations.length) {
      stationContext = snap.stationOperations.map((value) => OPERATION_LABELS[value] || value).join(" · ");
    }

    return `<div class="s8-overview-root">${this._hero()}${this._trustBanner(snap)}${this._quickActions()}
      <section class="s8-status-summary" aria-label="Статусы робота и станции">
        <div class="s8-status-card" data-more="robot_status">
          <div class="s8-status-icon"><ha-icon icon="mdi:robot-vacuum"></ha-icon></div>
          <div class="s8-status-copy"><span>Робот</span><strong>${escapeHtml(robotLabel)}</strong><small>${escapeHtml(robotContext)}</small></div>
        </div>
        <div class="s8-status-card" data-more="station_status">
          <div class="s8-status-icon"><ha-icon icon="mdi:home-automation"></ha-icon></div>
          <div class="s8-status-copy"><span>Станция</span><strong>${escapeHtml(stationLabel)}</strong><small>${escapeHtml(stationContext)}</small></div>
        </div>
      </section>
    </div>`;
  };

  S8OmniPanel.prototype._render = function (...args) {
    originalRender.apply(this, args);
    const root = this.shadowRoot;
    if (!root) return;
    installOverviewStatusStyles(root);
    updateDisplayedVersion(root);
  };
}
