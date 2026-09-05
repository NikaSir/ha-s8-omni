const Panel = customElements.get("s8-omni-panel");

const PRESETS = {
  "dry-quiet": {
    label: "Сухая · Тихий",
    suction: "gentle",
    water: "closed",
  },
  "dry-max": {
    label: "Сухая · Макс",
    suction: "strong",
    water: "closed",
  },
  "wet-quiet": {
    label: "Влажная · Тихий",
    suction: "gentle",
    water: "low",
  },
  "wet-max": {
    label: "Влажная · Макс",
    suction: "strong",
    water: "high",
  },
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

function escapePatchHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function applyPreset(panel, key) {
  const preset = PRESETS[key];
  if (!preset || !panel._snapshot().connected || panel._busyCommands.size > 0) return;

  const changes = [
    ["suction", preset.suction, `Всасывание: ${SUCTION_NAMES[preset.suction]}`],
    ["water", preset.water, `Подача воды: ${WATER_NAMES[preset.water]}`],
  ].filter(([control, value]) => !panel._controlValuesEqual(control, value, panel._controlValue(control)));

  if (!changes.length) return;
  const summary = changes.map(([, , text]) => text).join("\n");
  if (!window.confirm(`Применить предустановку «${preset.label}»?\n\n${summary}`)) return;

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
  panel._cleaningPresetContext = null;
  panel._queueLivePatch();
}

function openUserPreset(panel, kind) {
  if (!panel._snapshot().connected || panel._busyCommands.size > 0) return;
  panel._cleaningPresetContext = kind;
  if (kind === "dry") {
    panel._setCleaningDraft("water", "closed");
  } else if (kind === "wet") {
    const currentWater = panel._controlValue("water");
    if (!currentWater || currentWater === "closed") panel._setCleaningDraft("water", "low");
  }
  panel._switchWorkspace("cleaning", "cleaning-settings");
}

if (Panel && !Panel.prototype.__s8CleaningPresets) {
  Panel.prototype.__s8CleaningPresets = true;

  const originalStyles = Panel.prototype._styles;
  Panel.prototype._styles = function patchedStyles() {
    return `${originalStyles.call(this)}
      /* Approved dry/wet presets: two full-width rows. */
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
      .preset-option{min-height:76px;padding:8px 7px;border:1px solid color-mix(in srgb,var(--divider-color) 72%,transparent);border-radius:14px;background:color-mix(in srgb,var(--card-background-color) 94%,transparent);color:var(--primary-text-color);display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:3px;text-align:left;overflow:hidden}
      .preset-option ha-icon{--mdc-icon-size:22px;color:var(--secondary-text-color);margin-bottom:1px}
      .preset-group.wet .preset-option ha-icon,.preset-option.user ha-icon{color:var(--primary-color)}
      .preset-option strong{font-size:13px;line-height:1.05;font-weight:800;white-space:nowrap}
      .preset-option small{font-size:12px;line-height:1.1;color:var(--secondary-text-color);white-space:normal;overflow-wrap:normal;word-break:normal}
      .preset-option:disabled{opacity:.42}
      .preset-context{margin-bottom:10px;padding:11px 13px;border:1px solid color-mix(in srgb,var(--primary-color) 20%,var(--divider-color));border-radius:16px;background:color-mix(in srgb,var(--primary-color) 6%,var(--card-background-color))}
      .preset-context strong{display:block;font-size:14px}.preset-context span{display:block;margin-top:3px;color:var(--secondary-text-color);font-size:12px;line-height:1.2}
      @media(max-width:390px){.preset-options{gap:5px}.preset-option{min-height:72px;padding:7px 5px}.preset-option strong{font-size:12.5px}.preset-option small{font-size:11.5px}}
    `;
  };

  Panel.prototype._cleaning = function patchedCleaning() {
    const snap = this._snapshot();
    const cleanTime = snap.connected ? this._stateValue("clean_time") : null;
    const cleanArea = snap.connected ? this._stateValue("clean_area") : null;
    const volumeObj = this._state("volume");
    const volumeValue = snap.connected && this._available(volumeObj) ? Number(volumeObj.state) : null;
    const dndObj = this._state("do_not_disturb");
    const dnd = snap.connected && this._available(dndObj) ? (dndObj.state === "on" ? "Вкл" : "Выкл") : "Нет данных";
    const presetUsable = snap.connected && this._busyCommands.size === 0;
    const disabled = presetUsable ? "" : " disabled";

    return `${this._trustBanner(snap)}
      <section class="card">
        <div class="section-title"><h2>Текущая уборка</h2></div>
        <div class="metric-grid">
          <div class="metric" data-more="clean_time"><ha-icon icon="mdi:timer-outline"></ha-icon><span>Время</span><strong>${escapePatchHtml(this._formatCleaningTime(cleanTime, cleanArea, snap))}</strong></div>
          <div class="metric" data-more="clean_area"><ha-icon icon="mdi:ruler-square"></ha-icon><span>Площадь</span><strong>${cleanArea !== null ? `${escapePatchHtml(cleanArea)} м²` : "—"}</strong></div>
        </div>
      </section>
      <section class="card preset-card">
        <div class="section-title"><h2>Предустановки уборки</h2></div>
        <div class="preset-groups">
          <div class="preset-group dry">
            <div class="preset-group-head"><ha-icon icon="mdi:fan"></ha-icon><span><strong>Сухая уборка</strong><small>Воды нет</small></span></div>
            <div class="preset-options">
              <button class="preset-option" type="button" data-cleaning-preset="dry-quiet"${disabled}><ha-icon icon="mdi:fan-speed-1"></ha-icon><strong>Тихий</strong><small>Мин. всасывание</small></button>
              <button class="preset-option" type="button" data-cleaning-preset="dry-max"${disabled}><ha-icon icon="mdi:fan-speed-3"></ha-icon><strong>Макс</strong><small>Макс. всасывание</small></button>
              <button class="preset-option user" type="button" data-user-preset="dry"${disabled}><ha-icon icon="mdi:tune-variant"></ha-icon><strong>Польз.</strong><small>Настроить</small></button>
            </div>
          </div>
          <div class="preset-group wet">
            <div class="preset-group-head"><ha-icon icon="mdi:water-outline"></ha-icon><span><strong>Влажная уборка</strong><small>Сухая + подача воды</small></span></div>
            <div class="preset-options">
              <button class="preset-option" type="button" data-cleaning-preset="wet-quiet"${disabled}><ha-icon icon="mdi:water-outline"></ha-icon><strong>Тихий</strong><small>Мин. всасывание · Мин. воды</small></button>
              <button class="preset-option" type="button" data-cleaning-preset="wet-max"${disabled}><ha-icon icon="mdi:water-plus-outline"></ha-icon><strong>Макс</strong><small>Макс. всасывание · Макс. воды</small></button>
              <button class="preset-option user" type="button" data-user-preset="wet"${disabled}><ha-icon icon="mdi:tune-variant"></ha-icon><strong>Польз.</strong><small>Настроить</small></button>
            </div>
          </div>
        </div>
      </section>
      <button class="settings-entry" type="button" data-detail="cleaning-settings"><span class="icon"><ha-icon icon="mdi:tune-variant"></ha-icon></span><span><strong>Настроить уборку</strong><span>Громкость: ${Number.isFinite(volumeValue) ? `${Math.round(volumeValue)}%` : "Нет данных"} · Не беспокоить: ${escapePatchHtml(dnd)}</span></span><ha-icon icon="mdi:chevron-right"></ha-icon></button>
      <section class="future-card"><span class="icon"><ha-icon icon="mdi:map-outline"></ha-icon></span><div><span class="eyebrow">Следующий этап</span><strong>Карта и комнаты</strong><p>Комнатная и зональная уборка появятся после завершения безопасной поддержки в интеграции.</p></div></section>`;
  };

  const originalCleaningSettings = Panel.prototype._cleaningSettings;
  Panel.prototype._cleaningSettings = function patchedCleaningSettings() {
    const settings = originalCleaningSettings.call(this).replace("<span>Режим уборки</span>", "<span>Вид уборки</span>");
    if (!this._cleaningPresetContext) return settings;
    const dry = this._cleaningPresetContext === "dry";
    const context = `<section class="preset-context"><strong>Пользовательская · ${dry ? "Сухая" : "Влажная"}</strong><span>${dry ? "Подача воды подготовлена как «Выкл.». Настройте требуемое всасывание." : "Настройте всасывание и подачу воды для влажной уборки."}</span></section>`;
    return `${context}${settings}`;
  };

  const originalBindStableContent = Panel.prototype._bindStableContent;
  Panel.prototype._bindStableContent = function patchedBindStableContent(root) {
    originalBindStableContent.call(this, root);
    if (!root || root.__s8CleaningPresetBindings) return;
    root.__s8CleaningPresetBindings = true;
    root.addEventListener("click", async (event) => {
      const presetButton = event.target?.closest?.("[data-cleaning-preset]");
      if (presetButton && root.contains(presetButton) && !presetButton.disabled) {
        await applyPreset(this, presetButton.dataset.cleaningPreset);
        return;
      }
      const userButton = event.target?.closest?.("[data-user-preset]");
      if (userButton && root.contains(userButton) && !userButton.disabled) {
        openUserPreset(this, userButton.dataset.userPreset);
      }
    });
  };
}
