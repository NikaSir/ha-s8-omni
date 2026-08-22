import "./s8-omni-panel-v7.js";

const UI_VERSION = "v0.5.0";
const DETAIL_CLEANING_SETTINGS = "cleaning-settings";
const SUCTION_LABELS = { gentle: "Тихий", normal: "Нормальный", strong: "Сильный" };
const WATER_LABELS = { closed: "Закрыто", low: "Низкий", normal: "Средний", high: "Высокий" };
const S8OmniPanel = customElements.get("s8-omni-panel");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function installDrilldownStyles(root) {
  if (root.querySelector("style[data-s8-cleaning-drilldown]")) return;

  const style = document.createElement("style");
  style.dataset.s8CleaningDrilldown = "true";
  style.textContent = `
    .s8-drill-entry {
      width: 100%;
      min-height: 76px;
      border: 0;
      border-radius: 20px;
      padding: 14px 16px;
      display: grid;
      grid-template-columns: 48px minmax(0, 1fr) 28px;
      align-items: center;
      gap: 12px;
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
      font: inherit;
      text-align: left;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .s8-drill-entry:active { transform: scale(.985); }
    .s8-drill-entry .icon-box {
      width: 48px;
      height: 48px;
      border-radius: 16px;
      display: grid;
      place-items: center;
      background: var(--card-background-color);
      color: var(--primary-color);
    }
    .s8-drill-entry .icon-box ha-icon { --mdc-icon-size: 27px; }
    .s8-drill-entry .copy { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
    .s8-drill-entry .copy strong { font-size: 17px; line-height: 1.15; }
    .s8-drill-entry .copy span { color: var(--secondary-text-color); font-size: 13px; line-height: 1.25; }
    .s8-drill-entry > ha-icon { --mdc-icon-size: 23px; color: var(--secondary-text-color); }

    .s8-settings-intro {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 15px 17px;
      border-radius: 20px;
      background: color-mix(in srgb, var(--primary-color) 8%, var(--card-background-color));
      border: 1px solid color-mix(in srgb, var(--primary-color) 22%, transparent);
    }
    .s8-settings-intro ha-icon { --mdc-icon-size: 25px; color: var(--primary-color); margin-top: 1px; }
    .s8-settings-intro div { display: flex; flex-direction: column; gap: 3px; }
    .s8-settings-intro strong { font-size: 15px; }
    .s8-settings-intro span { color: var(--secondary-text-color); font-size: 13px; line-height: 1.35; }
  `;
  root.append(style);
}

function updateDisplayedVersion(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);
  for (const textNode of nodes) {
    for (const oldVersion of ["v0.4.0", "v0.4.1", "v0.4.2", "v0.4.3"]) {
      if (textNode.nodeValue?.includes(oldVersion)) {
        textNode.nodeValue = textNode.nodeValue.replaceAll(oldVersion, UI_VERSION);
      }
    }
  }
}

function configureHeader(panel, root) {
  const header = root.querySelector(".s8-app-header");
  if (!header) return;

  const title = header.querySelector(".s8-app-title strong");
  const subtitle = header.querySelector(".s8-app-title span");
  const oldBack = header.querySelector(".s8-app-back");

  if (panel._detail === DETAIL_CLEANING_SETTINGS) {
    if (title) title.textContent = "Настройки уборки";
    if (subtitle) subtitle.textContent = "S8 OMNI · Уборка";

    if (oldBack) {
      const back = oldBack.cloneNode(true);
      back.setAttribute("aria-label", "Назад к уборке");
      back.title = "Уборка";
      oldBack.replaceWith(back);
      back.addEventListener("click", () => {
        panel._detail = null;
        panel._view = "cleaning";
        panel._queueRender?.();
      });
    }
    return;
  }

  if (title) title.textContent = "S8 OMNI";
  if (subtitle) subtitle.textContent = `Робот-пылесос · UI ${UI_VERSION}`;
}

if (S8OmniPanel && !S8OmniPanel.prototype.__s8CleaningDrilldownV050) {
  S8OmniPanel.prototype.__s8CleaningDrilldownV050 = true;

  const originalOverview = S8OmniPanel.prototype._overview;
  const originalBody = S8OmniPanel.prototype._body;
  const originalBind = S8OmniPanel.prototype._bind;
  const originalRender = S8OmniPanel.prototype._render;

  S8OmniPanel.prototype._overview = function (...args) {
    return originalOverview
      .apply(this, args)
      .replace('data-view="cleaning">Настроить</button>', 'data-detail="cleaning-settings">Настроить</button>');
  };

  S8OmniPanel.prototype._cleaning = function () {
    const snap = this._snapshot();
    const cleanTime = this._stateValue("clean_time");
    const cleanArea = this._stateValue("clean_area");

    return `${this._hero()}${this._trustBanner(snap)}${this._quickActions()}
      <section class="card now-card">
        <div class="section-title"><div><span class="eyebrow">Текущая задача</span><h2>Уборка</h2></div></div>
        <div class="metric-grid">
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

  S8OmniPanel.prototype._cleaningSettings = function () {
    const volume = this._state("volume");
    const dnd = this._state("do_not_disturb");
    const volumeValue = this._available(volume) ? Number(volume.state) : null;

    return `<section class="s8-settings-intro">
        <ha-icon icon="mdi:tune-variant"></ha-icon>
        <div><strong>Параметры уборки</strong><span>Здесь меняется профиль уборки. На основной вкладке «Уборка» остаются только состояние и управление процессом.</span></div>
      </section>
      <section class="card">
        <div class="section-title"><div><span class="eyebrow">Уборка</span><h2>Параметры</h2></div></div>
        ${this._select("suction", SUCTION_LABELS, "Мощность всасывания")}
        ${this._select("water", WATER_LABELS, "Количество воды")}
      </section>
      <section class="card">
        <div class="section-title"><div><span class="eyebrow">Звук</span><h2>Громкость</h2></div></div>
        ${volume ? `<div class="slider-row" data-more="volume"><div><strong>Голосовые уведомления</strong><span>Громкость сообщений робота</span></div><output data-range-value="volume">${volumeValue === null ? "—" : `${Math.round(volumeValue)}%`}</output><input data-control="volume" type="range" min="0" max="100" step="1" value="${volumeValue === null ? 0 : volumeValue}" ${volumeValue === null ? "disabled" : ""}></div>` : this._row("Громкость", "Нет данных")}
      </section>
      <section class="card">
        <div class="section-title"><div><span class="eyebrow">Поведение</span><h2>Автоматизация</h2></div></div>
        ${dnd ? `<button class="toggle-row" data-toggle="do_not_disturb"><span><strong>Не беспокоить</strong><small>Переключатель режима без настройки расписания.</small></span><span class="toggle ${dnd.state === "on" ? "on" : ""}"></span></button>` : this._row("Не беспокоить", "Нет данных")}
      </section>`;
  };

  S8OmniPanel.prototype._body = function (...args) {
    if (this._detail === DETAIL_CLEANING_SETTINGS) return this._cleaningSettings();
    return originalBody.apply(this, args);
  };

  S8OmniPanel.prototype._bind = function (...args) {
    originalBind.apply(this, args);

    this.shadowRoot?.querySelectorAll("[data-detail]").forEach((button) => {
      button.addEventListener("click", () => {
        this._detail = button.dataset.detail;
        this._view = "cleaning";
        this._queueRender();
      });
    });

    this.shadowRoot?.querySelectorAll("nav [data-view]").forEach((button) => {
      button.addEventListener("click", () => {
        if (!this._detail) return;
        this._detail = null;
        this._queueRender();
      });
    });
  };

  S8OmniPanel.prototype._render = function (...args) {
    originalRender.apply(this, args);
    const root = this.shadowRoot;
    if (!root) return;

    installDrilldownStyles(root);
    updateDisplayedVersion(root);
    configureHeader(this, root);
  };
}
