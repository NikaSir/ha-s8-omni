const Panel = customElements.get("s8-omni-panel");

const PRESETS = {
  "dry-quiet": { label: "Сухая · Тихий", suction: "gentle", water: "closed" },
  "dry-max": { label: "Сухая · Макс", suction: "strong", water: "closed" },
  "wet-quiet": { label: "Влажная · Тихий", suction: "gentle", water: "low" },
  "wet-max": { label: "Влажная · Макс", suction: "strong", water: "high" },
};

const SUCTION_NAMES = {
  gentle: "Тихий",
  normal: "Нормальный",
  strong: "Сильный",
};

const WATER_NAMES = {
  closed: "Выкл.",
  low: "Низкий",
  middle: "Средний",
  high: "Высокий",
};

const USER_PRESET_STORAGE_VERSION = 1;
const USER_PRESET_SUCTION = ["gentle", "normal", "strong"];
const USER_PRESET_WATER = ["low", "middle", "high"];
const INACTIVE_CLEANING_STATES = ["idle", "charging", "charged", "sleeping"];

function cleaningMetric(value) {
  if ((typeof value !== "number" && typeof value !== "string") || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function presetDescription(preset) {
  if (!preset) return "Не настроено";
  const suction = { gentle: "мин.", normal: "норм.", strong: "макс." }[preset.suction];
  const water = { closed: "выкл.", low: "мин.", middle: "сред.", high: "макс." }[preset.water];
  return `<span>Всасывание: ${suction}</span><span>Вода: ${water}</span>`;
}

function escapePatchHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function panelEntryKey(panel) {
  return String(panel?._config?.entry_id || panel?.config?.entry_id || "default");
}

function userPresetStorageKey(panel, kind) {
  return `nikas.s8_omni.user_preset.v${USER_PRESET_STORAGE_VERSION}.${panelEntryKey(panel)}.${kind}`;
}

function readUserPreset(panel, kind) {
  try {
    const raw = window.localStorage.getItem(userPresetStorageKey(panel, kind));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !USER_PRESET_SUCTION.includes(parsed.suction)) return null;
    if (kind === "dry") return { label: "Сухая · Польз.", suction: parsed.suction, water: "closed", user: true };
    if (!USER_PRESET_WATER.includes(parsed.water)) return null;
    return { label: "Влажная · Польз.", suction: parsed.suction, water: parsed.water, user: true };
  } catch (_error) {
    return null;
  }
}

function writeUserPreset(panel, kind, preset) {
  const payload = kind === "dry"
    ? { suction: preset.suction, water: "closed" }
    : { suction: preset.suction, water: preset.water };
  window.localStorage.setItem(userPresetStorageKey(panel, kind), JSON.stringify(payload));
}

function resolvePreset(panel, key) {
  if (PRESETS[key]) return PRESETS[key];
  if (key === "dry-user") return readUserPreset(panel, "dry");
  if (key === "wet-user") return readUserPreset(panel, "wet");
  return null;
}

function closePresetDialog(panel) {
  panel.shadowRoot?.querySelector("[data-preset-dialog]")?.remove();
}

function showPresetConfirm(panel, preset, changes) {
  return new Promise((resolve) => {
    closePresetDialog(panel);
    const overlay = document.createElement("div");
    overlay.className = "preset-dialog-backdrop";
    overlay.dataset.presetDialog = "confirm";
    overlay.innerHTML = `
      <section class="preset-dialog" role="dialog" aria-modal="true" aria-labelledby="preset-confirm-title">
        <h3 id="preset-confirm-title">Применить предустановку «${escapePatchHtml(preset.label)}»?</h3>
        <div class="preset-dialog-summary">${changes.map(([, , text]) => `<p>${escapePatchHtml(text)}</p>`).join("")}</div>
        <div class="preset-dialog-actions">
          <button type="button" class="preset-dialog-button secondary" data-preset-cancel>Отмена</button>
          <button type="button" class="preset-dialog-button primary" data-preset-apply>Применить</button>
        </div>
      </section>`;
    const finish = (value) => {
      overlay.remove();
      resolve(value);
    };
    overlay.querySelector("[data-preset-cancel]")?.addEventListener("click", () => finish(false), { once: true });
    overlay.querySelector("[data-preset-apply]")?.addEventListener("click", () => finish(true), { once: true });
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) finish(false);
    });
    panel.shadowRoot?.appendChild(overlay);
    overlay.querySelector("[data-preset-apply]")?.focus();
  });
}

function showUserPresetEditor(panel, kind) {
  closePresetDialog(panel);
  const saved = readUserPreset(panel, kind);
  const currentSuction = panel._controlValue("suction");
  const currentWater = panel._controlValue("water");
  const suction = saved?.suction || (USER_PRESET_SUCTION.includes(currentSuction) ? currentSuction : "normal");
  const water = kind === "dry"
    ? "closed"
    : (saved?.water || (USER_PRESET_WATER.includes(currentWater) ? currentWater : "low"));

  const overlay = document.createElement("div");
  overlay.className = "preset-dialog-backdrop";
  overlay.dataset.presetDialog = "editor";
  overlay.innerHTML = `
    <section class="preset-dialog preset-editor" role="dialog" aria-modal="true" aria-labelledby="preset-editor-title">
      <h3 id="preset-editor-title">Пользовательская · ${kind === "dry" ? "Сухая" : "Влажная"}</h3>
      <p class="preset-editor-note">Настройки только сохраняются в предустановку. Пылесосу они сейчас не отправляются.</p>
      <label class="preset-editor-field">
        <span>Всасывание</span>
        <select data-user-suction>
          ${USER_PRESET_SUCTION.map((value) => `<option value="${value}"${value === suction ? " selected" : ""}>${escapePatchHtml(SUCTION_NAMES[value])}</option>`).join("")}
        </select>
      </label>
      ${kind === "dry" ? `
        <div class="preset-editor-field fixed"><span>Подача воды</span><strong>Выкл.</strong></div>` : `
        <label class="preset-editor-field">
          <span>Подача воды</span>
          <select data-user-water>
            ${USER_PRESET_WATER.map((value) => `<option value="${value}"${value === water ? " selected" : ""}>${escapePatchHtml(WATER_NAMES[value])}</option>`).join("")}
          </select>
        </label>`}
      <div class="preset-dialog-actions">
        <button type="button" class="preset-dialog-button secondary" data-preset-cancel>Отмена</button>
        <button type="button" class="preset-dialog-button primary" data-user-save>Сохранить</button>
      </div>
    </section>`;

  const close = () => overlay.remove();
  overlay.querySelector("[data-preset-cancel]")?.addEventListener("click", close, { once: true });
  overlay.querySelector("[data-user-save]")?.addEventListener("click", () => {
    const selectedSuction = overlay.querySelector("[data-user-suction]")?.value;
    const selectedWater = kind === "dry" ? "closed" : overlay.querySelector("[data-user-water]")?.value;
    if (!USER_PRESET_SUCTION.includes(selectedSuction)) return;
    if (kind === "wet" && !USER_PRESET_WATER.includes(selectedWater)) return;
    writeUserPreset(panel, kind, { suction: selectedSuction, water: selectedWater });
    close();
    panel._queueLivePatch();
  }, { once: true });
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  panel.shadowRoot?.appendChild(overlay);
  overlay.querySelector("[data-user-suction]")?.focus();
}

async function applyPreset(panel, key) {
  const preset = resolvePreset(panel, key);
  if (!preset || !panel._snapshot().connected || panel._busyCommands.size > 0) return;

  const changes = [
    ["suction", preset.suction, `Всасывание: ${SUCTION_NAMES[preset.suction]}`],
    ["water", preset.water, `Подача воды: ${WATER_NAMES[preset.water]}`],
  ].filter(([control, value]) => !panel._controlValuesEqual(control, value, panel._controlValue(control)));

  if (!changes.length) return;
  if (!await showPresetConfirm(panel, preset, changes)) return;

  for (const [control, value] of changes) {
    const applied = await panel._callConfirmed(
      "select",
      "select_option",
      control,
      { option: value },
      value,
    );
    if (!applied) return;
    delete panel._cleaningDraft[control];
  }
  panel._queueLivePatch();
}

if (Panel && !Panel.prototype.__s8CleaningPresets) {
  Panel.prototype.__s8CleaningPresets = true;

  const originalStyles = Panel.prototype._styles;
  Panel.prototype._styles = function patchedStyles() {
    return `${originalStyles.call(this)}
      /* Approved dry/wet presets: two full-width rows. */
      .cleaning-summary{padding:12px 14px}
      .cleaning-summary-idle{display:flex;align-items:center;gap:9px;min-height:28px;font-size:14px;color:var(--secondary-text-color)}
      .cleaning-summary-idle[hidden],.cleaning-summary-metrics[hidden]{display:none}
      .cleaning-summary-idle ha-icon{--mdc-icon-size:22px;color:var(--primary-color)}
      .cleaning-summary .section-title{margin-bottom:6px}
      .cleaning-summary .section-title h2{font-size:18px}
      .cleaning-summary .metric-grid{padding:0;background:transparent;border-radius:0}
      .cleaning-summary .metric{min-height:58px;padding:8px;grid-template-columns:26px minmax(0,1fr);column-gap:8px}
      .cleaning-summary .metric ha-icon{--mdc-icon-size:23px}
      .cleaning-summary .metric strong{font-size:19px}
      .preset-card{padding:14px}
      .preset-groups{display:grid;grid-template-columns:1fr;gap:10px}
      .preset-group{border:1px solid color-mix(in srgb,var(--divider-color) 62%,transparent);border-radius:18px;padding:10px;min-width:0}
      .preset-group.dry{background:color-mix(in srgb,#f5e8cf 34%,var(--card-background-color))}
      .preset-group.wet{background:color-mix(in srgb,var(--primary-color) 7%,var(--card-background-color))}
      .preset-group-head{display:grid;grid-template-columns:28px minmax(0,1fr);align-items:center;gap:7px;margin-bottom:9px}
      .preset-group-head ha-icon{--mdc-icon-size:25px;color:var(--secondary-text-color)}
      .preset-group.wet .preset-group-head ha-icon{color:var(--primary-color)}
      .preset-group-head strong{display:block;font-size:15px;line-height:1.08;font-weight:800}
      .preset-group-head small{display:block;margin-top:2px;font-size:12px;line-height:1.1;color:var(--secondary-text-color)}
      .preset-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
      .preset-option{min-height:76px;padding:8px 7px;border:1px solid color-mix(in srgb,var(--divider-color) 72%,transparent);border-radius:14px;background:color-mix(in srgb,var(--card-background-color) 94%,transparent);color:var(--primary-text-color);display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;gap:5px;text-align:left;overflow:hidden}
      .preset-option ha-icon{--mdc-icon-size:22px;color:var(--secondary-text-color);margin-bottom:1px}
      .preset-option-title{display:flex;align-items:center;gap:4px;min-height:23px}
      .preset-group.wet .preset-option ha-icon,.user-preset-shell ha-icon{color:var(--primary-color)}
      .preset-option strong{font-size:13px;line-height:1.05;font-weight:800;white-space:nowrap}
      .preset-option small,.user-preset-apply small{display:grid;gap:3px;font-size:12px;line-height:1.2;color:var(--secondary-text-color);white-space:normal;overflow-wrap:normal;word-break:normal}
      .preset-option:disabled{opacity:.42}
      .user-preset-shell{min-height:76px;border:1px solid color-mix(in srgb,var(--divider-color) 72%,transparent);border-radius:14px;background:color-mix(in srgb,var(--card-background-color) 94%,transparent);display:grid;grid-template-rows:minmax(0,1fr) 44px;overflow:hidden}
      .user-preset-apply,.user-preset-edit{border:0;background:transparent;color:var(--primary-text-color);font:inherit;text-align:left}
      .user-preset-apply{padding:8px 7px;display:grid;align-content:start;gap:5px;min-height:44px}
      .user-preset-apply strong{font-size:13px;font-weight:800;min-height:23px;display:flex;align-items:center}
      .user-preset-apply:disabled{opacity:.45}
      .user-preset-edit{padding:7px;color:var(--primary-color);font-size:12px;font-weight:750;border-top:1px solid color-mix(in srgb,var(--divider-color) 55%,transparent)}
      .preset-dialog-backdrop{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:12px;background:rgba(25,32,41,.28);backdrop-filter:blur(5px)}
      .preset-dialog{width:min(520px,calc(100vw - 24px));max-width:calc(100% - 8px);box-sizing:border-box;padding:22px;border:1px solid color-mix(in srgb,var(--divider-color) 68%,transparent);border-radius:24px;background:color-mix(in srgb,var(--card-background-color) 97%,transparent);box-shadow:0 18px 48px rgba(15,28,42,.22)}
      .preset-dialog h3{margin:0 0 16px;font-size:22px;line-height:1.22;font-weight:800;color:var(--primary-text-color)}
      .preset-dialog-summary{display:grid;gap:7px;margin:0 0 20px;padding:14px 16px;border-radius:16px;background:color-mix(in srgb,var(--primary-color) 6%,var(--card-background-color))}
      .preset-dialog-summary p{margin:0;font-size:16px;line-height:1.3;color:var(--primary-text-color)}
      .preset-dialog-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}
      .preset-dialog-button{min-height:48px;border-radius:16px;font-size:16px;font-weight:800;border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent)}
      .preset-dialog-button.secondary{background:var(--card-background-color);color:var(--primary-text-color)}
      .preset-dialog-button.primary{background:color-mix(in srgb,var(--primary-color) 16%,var(--card-background-color));color:var(--primary-color);border-color:color-mix(in srgb,var(--primary-color) 35%,var(--divider-color))}
      .preset-editor-note{margin:0 0 16px;color:var(--secondary-text-color);font-size:14px;line-height:1.35}
      .preset-editor-field{display:grid;grid-template-columns:minmax(0,1fr) minmax(150px,42%);align-items:center;gap:12px;padding:12px 0;border-top:1px solid color-mix(in srgb,var(--divider-color) 65%,transparent)}
      .preset-editor-field span{font-size:15px;font-weight:700}.preset-editor-field select{width:100%;min-height:44px;border:1px solid var(--divider-color);border-radius:13px;padding:0 10px;background:var(--card-background-color);color:var(--primary-text-color);font-size:15px}.preset-editor-field.fixed strong{text-align:right;font-size:15px}
      @media(max-width:390px){.preset-options{gap:5px}.preset-option{padding:8px 5px}.user-preset-apply,.user-preset-edit{padding-inline:5px}.preset-option-title{gap:3px}.preset-option strong,.user-preset-apply strong{font-size:12.5px}.preset-dialog{width:calc(100vw - 16px);padding:18px}.preset-dialog h3{font-size:20px}.preset-editor-field{grid-template-columns:1fr}}
    `;
  };

  Panel.prototype._cleaning = function patchedCleaning() {
    const snap = this._snapshot();
    const cleanTime = snap.connected && !snap.unreliable ? cleaningMetric(this._stateValue("clean_time")) : null;
    const cleanArea = snap.connected && !snap.unreliable ? cleaningMetric(this._stateValue("clean_area")) : null;
    const knownIdle = snap.connected && !snap.unreliable && this._telemetryFreshnessState() === "current"
      && INACTIVE_CLEANING_STATES.includes(snap.robot) && INACTIVE_CLEANING_STATES.includes(snap.composite);
    const formattedTime = this._formatCleaningTime(cleanTime, cleanArea, snap);
    const timeText = cleanTime === 0 && formattedTime === "—" ? "0 мин" : formattedTime;
    const presetUsable = snap.connected && this._busyCommands.size === 0;
    const disabled = presetUsable ? "" : " disabled";
    const dryUser = readUserPreset(this, "dry");
    const wetUser = readUserPreset(this, "wet");

    return `${this._trustBanner(snap)}
      <section class="card cleaning-summary">
        <div class="cleaning-summary-idle"${knownIdle ? "" : " hidden"}><ha-icon icon="mdi:robot-vacuum"></ha-icon><span>Уборка не выполняется</span></div>
        <div class="cleaning-summary-metrics"${knownIdle ? " hidden" : ""}>
          <div class="section-title"><h2>Текущая уборка</h2></div>
          <div class="metric-grid">
            <div class="metric" data-more="clean_time"><ha-icon icon="mdi:timer-outline"></ha-icon><span>Время</span><strong>${escapePatchHtml(timeText)}</strong></div>
            <div class="metric" data-more="clean_area"><ha-icon icon="mdi:ruler-square"></ha-icon><span>Площадь</span><strong>${cleanArea !== null ? `${escapePatchHtml(cleanArea)} м²` : "—"}</strong></div>
          </div>
        </div>
      </section>
      <section class="card preset-card">
        <div class="section-title"><h2>Предустановки уборки</h2></div>
        <div class="preset-groups">
          <div class="preset-group dry">
            <div class="preset-group-head"><ha-icon icon="mdi:fan"></ha-icon><span><strong>Сухая уборка</strong><small>Без подачи воды</small></span></div>
            <div class="preset-options">
              <button class="preset-option" type="button" data-cleaning-preset="dry-quiet"${disabled}><span class="preset-option-title"><ha-icon icon="mdi:fan-speed-1"></ha-icon><strong>Тихий</strong></span><small>${presetDescription(PRESETS["dry-quiet"])}</small></button>
              <button class="preset-option" type="button" data-cleaning-preset="dry-max"${disabled}><span class="preset-option-title"><ha-icon icon="mdi:fan-speed-3"></ha-icon><strong>Макс</strong></span><small>${presetDescription(PRESETS["dry-max"])}</small></button>
              <div class="user-preset-shell"><button class="user-preset-apply" type="button" data-cleaning-preset="dry-user"${!presetUsable || !dryUser ? " disabled" : ""}><strong>Польз.</strong><small>${presetDescription(dryUser)}</small></button><button class="user-preset-edit" type="button" data-user-preset-edit="dry">Настроить</button></div>
            </div>
          </div>
          <div class="preset-group wet">
            <div class="preset-group-head"><ha-icon icon="mdi:water-outline"></ha-icon><span><strong>Влажная уборка</strong><small>Сухая + подача воды</small></span></div>
            <div class="preset-options">
              <button class="preset-option" type="button" data-cleaning-preset="wet-quiet"${disabled}><span class="preset-option-title"><ha-icon icon="mdi:water-outline"></ha-icon><strong>Тихий</strong></span><small>${presetDescription(PRESETS["wet-quiet"])}</small></button>
              <button class="preset-option" type="button" data-cleaning-preset="wet-max"${disabled}><span class="preset-option-title"><ha-icon icon="mdi:water-plus-outline"></ha-icon><strong>Макс</strong></span><small>${presetDescription(PRESETS["wet-max"])}</small></button>
              <div class="user-preset-shell"><button class="user-preset-apply" type="button" data-cleaning-preset="wet-user"${!presetUsable || !wetUser ? " disabled" : ""}><strong>Польз.</strong><small>${presetDescription(wetUser)}</small></button><button class="user-preset-edit" type="button" data-user-preset-edit="wet">Настроить</button></div>
            </div>
          </div>
        </div>
      </section>
      <section class="future-card"><span class="icon"><ha-icon icon="mdi:map-outline"></ha-icon></span><div><span class="eyebrow">Следующий этап</span><strong>Карта и комнаты</strong><p>Комнатная и зональная уборка появятся после завершения безопасной поддержки в интеграции.</p></div></section>`;
  };

  const originalCleaningSettings = Panel.prototype._cleaningSettings;
  Panel.prototype._cleaningSettings = function patchedCleaningSettings() {
    return originalCleaningSettings.call(this).replace("<span>Режим уборки</span>", "<span>Вид уборки</span>");
  };

  const originalBindStableContent = Panel.prototype._bindStableContent;
  Panel.prototype._bindStableContent = function patchedBindStableContent(root) {
    originalBindStableContent.call(this, root);
    if (!root || root.__s8CleaningPresetBindings) return;
    root.__s8CleaningPresetBindings = true;
    root.addEventListener("click", async (event) => {
      const editButton = event.target?.closest?.("[data-user-preset-edit]");
      if (editButton && root.contains(editButton)) {
        showUserPresetEditor(this, editButton.dataset.userPresetEdit);
        return;
      }
      const presetButton = event.target?.closest?.("[data-cleaning-preset]");
      if (presetButton && root.contains(presetButton) && !presetButton.disabled) {
        await applyPreset(this, presetButton.dataset.cleaningPreset);
      }
    });
  };
}
