import "./s8-omni-panel-v8.js";

const UI_VERSION = "v0.5.1";
const S8OmniPanel = customElements.get("s8-omni-panel");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function installSplitStyles(root) {
  if (root.querySelector("style[data-s8-overview-cleaning-split]")) return;

  const style = document.createElement("style");
  style.dataset.s8OverviewCleaningSplit = "true";
  style.textContent = `
    .s8-cleaning-task {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .s8-cleaning-task > div {
      min-height: 104px;
      border-radius: 20px;
      padding: 15px;
      display: grid;
      grid-template-columns: 42px minmax(0, 1fr);
      grid-template-rows: auto auto;
      align-content: center;
      column-gap: 10px;
      background: var(--secondary-background-color);
    }
    .s8-cleaning-task ha-icon {
      grid-row: 1 / span 2;
      align-self: center;
      --mdc-icon-size: 29px;
      color: var(--primary-color);
    }
    .s8-cleaning-task span {
      color: var(--secondary-text-color);
      font-size: 13px;
      align-self: end;
    }
    .s8-cleaning-task strong {
      font-size: 22px;
      line-height: 1.1;
      align-self: start;
    }
    .s8-overview-root + .s8-overview-root { display: none; }
    @media (max-width: 360px) {
      .s8-cleaning-task > div { padding: 13px; grid-template-columns: 36px minmax(0, 1fr); }
      .s8-cleaning-task strong { font-size: 20px; }
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
    for (const oldVersion of ["v0.4.3", "v0.5.0"]) {
      if (textNode.nodeValue?.includes(oldVersion)) {
        textNode.nodeValue = textNode.nodeValue.replaceAll(oldVersion, UI_VERSION);
      }
    }
  }
}

if (S8OmniPanel && !S8OmniPanel.prototype.__s8OverviewCleaningSplitV051) {
  S8OmniPanel.prototype.__s8OverviewCleaningSplitV051 = true;

  const originalRender = S8OmniPanel.prototype._render;

  S8OmniPanel.prototype._overview = function () {
    const snap = this._snapshot();

    // Overview answers only: what is happening now, is everything healthy,
    // and what are the three frequent robot actions. Cleaning-session metrics,
    // profile controls and station detail belong to their dedicated root tabs.
    return `<div class="s8-overview-root">${this._hero()}${this._trustBanner(snap)}${this._quickActions()}</div>`;
  };

  S8OmniPanel.prototype._cleaning = function () {
    const cleanTime = this._stateValue("clean_time");
    const cleanArea = this._stateValue("clean_area");

    // Cleaning owns the active cleaning workflow, not the global robot/station
    // hero. This intentionally avoids repeating Overview's composite status.
    return `${this._quickActions()}
      <section class="card now-card">
        <div class="section-title"><div><span class="eyebrow">Текущая задача</span><h2>Уборка</h2></div></div>
        <div class="s8-cleaning-task">
          <div data-more="clean_time"><ha-icon icon="mdi:timer-outline"></ha-icon><span>Время</span><strong>${cleanTime !== null ? `${escapeHtml(cleanTime)} мин` : "—"}</strong></div>
          <div data-more="clean_area"><ha-icon icon="mdi:ruler-square"></ha-icon><span>Площадь</span><strong>${cleanArea !== null ? `${escapeHtml(cleanArea)} м²` : "—"}</strong></div>
        </div>
      </section>
      <section class="card">
        <div class="section-title"><div><span class="eyebrow">Профиль</span><h2>Как убирать</h2></div></div>
        <button class="s8-drill-entry" type="button" data-detail="cleaning-settings">
          <span class="icon-box"><ha-icon icon="mdi:tune-variant"></ha-icon></span>
          <span class="copy"><strong>Настройки уборки</strong><span>Всасывание, вода, громкость и режим «Не беспокоить»</span></span>
          <ha-icon icon="mdi:chevron-right"></ha-icon>
        </button>
      </section>
      <section class="future-card"><div class="future-icon"><ha-icon icon="mdi:map-outline"></ha-icon></div><div><span class="eyebrow">Следующий этап</span><strong>Карта и комнаты</strong><p>Комнатная и зональная уборка появятся после завершения поддержки в интеграции.</p></div></section>`;
  };

  S8OmniPanel.prototype._render = function (...args) {
    originalRender.apply(this, args);
    const root = this.shadowRoot;
    if (!root) return;

    installSplitStyles(root);
    updateDisplayedVersion(root);
  };
}
