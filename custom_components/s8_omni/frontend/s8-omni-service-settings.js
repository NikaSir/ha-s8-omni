const Panel = customElements.get("s8-omni-panel");

const SERVICE_SUCTION_NAMES = {
  gentle: "Тихий",
  normal: "Нормальный",
  strong: "Сильный",
};
const SERVICE_WATER_NAMES = {
  closed: "Выкл.",
  low: "Низкий",
  middle: "Средний",
  high: "Высокий",
};
const SERVICE_WORK_MODE_NAMES = {
  both_work: "Сухая и влажная",
  sweep: "Сухая",
  sweep_work: "Сухая",
  mop: "Влажная",
  mop_work: "Влажная",
};
const SELECTED_PRESET_VERSION = 1;

function entryKey(panel) {
  return String(panel?._panel?.config?.entry_id || panel?._config?.entry_id || panel?.config?.entry_id || "default");
}
function selectedKey(panel) {
  return `nikas.s8_omni.selected_preset.v${SELECTED_PRESET_VERSION}.${entryKey(panel)}`;
}
function userKeyForEntry(entry, kind) {
  return `nikas.s8_omni.user_preset.v1.${entry}.${kind}`;
}
function readUser(panel, kind) {
  try {
    const keys = [userKeyForEntry(entryKey(panel), kind), userKeyForEntry("default", kind)];
    for (const key of [...new Set(keys)]) {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!parsed?.suction) continue;
      if (kind === "dry") return { suction: parsed.suction, water: "closed" };
      if (parsed.water) return { suction: parsed.suction, water: parsed.water };
    }
  } catch (_error) {}
  return null;
}
function presetValues(panel, key) {
  const fixed = {
    "dry-quiet": { suction: "gentle", water: "closed" },
    "dry-max": { suction: "strong", water: "closed" },
    "wet-quiet": { suction: "gentle", water: "low" },
    "wet-max": { suction: "strong", water: "high" },
  };
  if (fixed[key]) return fixed[key];
  if (key === "dry-user") return readUser(panel, "dry");
  if (key === "wet-user") return readUser(panel, "wet");
  return null;
}
function presetMatches(panel, key) {
  const preset = key ? presetValues(panel, key) : null;
  if (!preset) return false;
  return panel._controlValuesEqual("suction", panel._controlValue("suction"), preset.suction)
    && panel._controlValuesEqual("water", panel._controlValue("water"), preset.water);
}
function currentPreset(panel) {
  let key = null;
  try { key = window.localStorage.getItem(selectedKey(panel)); } catch (_error) {}
  return key && presetMatches(panel, key) ? key : null;
}
function storeSelected(panel, key) {
  try { window.localStorage.setItem(selectedKey(panel), key); } catch (_error) {}
}
function commitPendingSelection(panel) {
  const key = panel.__s8PendingPresetSelection;
  if (!key || !presetMatches(panel, key)) return false;
  storeSelected(panel, key);
  panel.__s8PendingPresetSelection = null;
  panel.__s8PresetCandidate = null;
  panel._queueLivePatch();
  return true;
}
function markSelected(markup, key) {
  if (!key) return markup;
  if (key === "dry-user" || key === "wet-user") {
    const needle = `<div class="user-preset-shell"><button class="user-preset-apply" type="button" data-cleaning-preset="${key}"`;
    return markup.replace(needle, `<div class="user-preset-shell selected"><button class="user-preset-apply" type="button" data-cleaning-preset="${key}"`);
  }
  const needle = `class="preset-option" type="button" data-cleaning-preset="${key}"`;
  return markup.replace(needle, `class="preset-option selected" type="button" data-cleaning-preset="${key}"`);
}

if (Panel && !Panel.prototype.__s8ServiceSettingsB094) {
  Panel.prototype.__s8ServiceSettingsB094 = true;

  const oldStyles = Panel.prototype._styles;
  Panel.prototype._styles = function serviceStyles() {
    return `${oldStyles.call(this)}
      .preset-option.selected,.user-preset-shell.selected{border-color:color-mix(in srgb,var(--primary-color) 72%,var(--divider-color));background:color-mix(in srgb,var(--primary-color) 13%,var(--card-background-color));box-shadow:0 0 0 2px color-mix(in srgb,var(--primary-color) 18%,transparent)}
      .preset-option.selected strong,.user-preset-shell.selected .user-preset-apply strong{color:var(--primary-color)}
      .service-settings-block{margin-top:12px}
    `;
  };

  const oldCleaning = Panel.prototype._cleaning;
  Panel.prototype._cleaning = function serviceCleaning() {
    let markup = oldCleaning.call(this);
    markup = markup.replace(/Громкость:[^<]*· Не беспокоить:[^<]*/g, "Всасывание и подача воды");
    return markSelected(markup, currentPreset(this));
  };

  Panel.prototype._cleaningSettings = function serviceCleaningSettings() {
    const snap = this._snapshot();
    const raw = snap.connected ? String(snap.workMode || "").toLowerCase() : "";
    const workMode = SERVICE_WORK_MODE_NAMES[raw] || "Нет данных";
    const suctionHint = SERVICE_SUCTION_NAMES[snap.connected ? this._stateValue("suction") : null] || "Нет данных";
    const waterHint = SERVICE_WATER_NAMES[snap.connected ? this._stateValue("water") : null] || "Нет данных";
    return `${this._trustBanner(snap)}<section class="card"><div class="mode-readout" data-more="work_mode"><span>Вид уборки</span><strong>${workMode}</strong></div>${this._segmentControl("suction",SERVICE_SUCTION_NAMES,"three","Мощность всасывания",suctionHint)}${this._segmentControl("water",SERVICE_WATER_NAMES,"four","Подача воды",waterHint)}</section><section class="future-card"><span class="icon"><ha-icon icon="mdi:information-outline"></ha-icon></span><div><strong>Применение параметров</strong><p>Изменения сохраняются как черновик. Кнопка «Применить» находится в разделе «Сервис».</p></div></section>`;
  };

  const oldMaintenance = Panel.prototype._maintenance;
  Panel.prototype._maintenance = function serviceMaintenance() {
    const base = oldMaintenance.call(this);
    const snap = this._snapshot();
    const volume = this._state("volume");
    const dnd = this._state("do_not_disturb");
    const busy = this._busyCommands.size > 0;
    const rawVolume = snap.connected && this._available(volume) ? Number(volume.state) : null;
    const rawDnd = snap.connected && this._available(dnd) ? dnd.state === "on" : null;
    const volumeValue = Object.prototype.hasOwnProperty.call(this._cleaningDraft, "volume") ? this._cleaningDraft.volume : rawVolume;
    const dndValue = Object.prototype.hasOwnProperty.call(this._cleaningDraft, "do_not_disturb") ? this._cleaningDraft.do_not_disturb : rawDnd;
    const dndUsable = rawDnd !== null && !busy;
    const hasDraft = this._hasCleaningDraft();
    return `${base}<div class="service-settings-block"><section class="card"><div class="section-title"><div><span class="eyebrow">Звук</span><h2>Громкость</h2></div></div><div class="slider-row"><div class="slider-head"><span><strong>Голосовые уведомления</strong></span><strong data-volume-label>${volumeValue === null ? "—" : `${Math.round(volumeValue)}%`}</strong></div><input type="range" min="0" max="100" step="1" value="${volumeValue === null ? 0 : volumeValue}" data-volume ${volumeValue === null || busy ? "disabled" : ""}></div></section><section class="card"><div class="section-title"><div><span class="eyebrow">Поведение</span><h2>Автоматизация</h2></div></div><button class="toggle-row" type="button" data-toggle="do_not_disturb" ${dndUsable ? "" : "disabled"}><span><strong>Не беспокоить</strong><small>Без звука, расписания и возобновления уборки; период задаётся в приложении.</small></span><span class="toggle ${dndValue === true ? "on" : ""}"></span></button></section><section class="card apply-card"><div><strong>${hasDraft ? "Изменения готовы" : "Настройки без изменений"}</strong><small>${hasDraft ? "Параметры будут записаны после подтверждения и проверены по данным устройства." : "Сначала измените один или несколько параметров."}</small></div><button class="apply-button" type="button" data-apply-cleaning ${hasDraft && !busy ? "" : "disabled"}>Применить</button></section></div>`;
  };

  const oldCallConfirmed = Panel.prototype._callConfirmed;
  Panel.prototype._callConfirmed = async function serviceCallConfirmed(...args) {
    const result = await oldCallConfirmed.apply(this, args);
    if (result) commitPendingSelection(this);
    return result;
  };

  const oldBind = Panel.prototype._bindStableContent;
  Panel.prototype._bindStableContent = function serviceBind(root) {
    oldBind.call(this, root);
    if (!root || root.__s8PresetSelectionB094) return;
    root.__s8PresetSelectionB094 = true;
    root.addEventListener("click", (event) => {
      const presetButton = event.target?.closest?.("[data-cleaning-preset]");
      if (presetButton && root.contains(presetButton) && !presetButton.disabled) {
        const key = presetButton.dataset.cleaningPreset;
        this.__s8PresetCandidate = key;
        if (presetMatches(this, key)) {
          storeSelected(this, key);
          this.__s8PresetCandidate = null;
          this._queueLivePatch();
        }
      }
    });

    const shadow = this.shadowRoot;
    if (shadow && !shadow.__s8PresetDialogSelectionB094) {
      shadow.__s8PresetDialogSelectionB094 = true;
      shadow.addEventListener("click", (event) => {
        const applyButton = event.target?.closest?.("[data-preset-apply]");
        if (applyButton && this.__s8PresetCandidate) {
          this.__s8PendingPresetSelection = this.__s8PresetCandidate;
          return;
        }
        const cancelButton = event.target?.closest?.("[data-preset-cancel]");
        if (cancelButton) {
          this.__s8PresetCandidate = null;
          this.__s8PendingPresetSelection = null;
        }
      });
    }
  };
}