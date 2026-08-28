# v1.00_b017 acceptance checklist

Before device-side testing, back up Home Assistant and disable **only S8 OMNI** in LocalTuya to avoid two local Tuya clients contending for the device.

## Already verified

- [x] Integration installs through HACS and creates the S8 OMNI device.
- [x] Local polling returns live robot and station datapoints.
- [x] Volume DP26 and DND DP25 writes are reflected in the official application.
- [x] Water DP10 includes verified `closed`.
- [x] Live battery, cleaning metrics, fault, work mode and consumable resources are visible.
- [x] Start cleaning and Return to base are confirmed on the physical robot.
- [x] Station dust collection, roller/mop cleaning and drying have been observed.
- [x] Dashboard renders on iPhone Pro Max portrait across all five main views.
- [x] Safe direct-open fallback is `/dashboard-actions`; source-aware Header return accepts only Дом, Действия and Инфраструктура roots.
- [x] Header Refresh uses an integration-owned Home Assistant button entity.
- [x] Sanitized Home Assistant Download diagnostics is implemented.
- [x] Production frontend is one self-contained `s8-omni-panel.js` bundle.

## Remaining protocol acceptance

1. Set water to **Medium** in the official application and capture `cistern`; confirm whether raw value is `normal`.
2. Change suction `normal → strong → normal` from Home Assistant and confirm physical/application state and local reflection.
3. Verify Pause from Home Assistant on the physical robot.
4. Verify Start after Pause resumes cleaning rather than starting an unrelated mode.
5. Keep Stop unimplemented unless a controlled test proves unambiguous semantics.
6. Keep station writes, DND schedule, cleaning timer, map/room payloads and consumable resets out of public UI until verified.

## Dashboard v0.7.17 — NikaS app-shell and iPhone fit acceptance

Control viewport: **iPhone Pro Max · portrait**. Also inspect a narrow viewport near 360 CSS px for defensive layout behavior.

### Header

- [ ] Header is visible on Overview, Cleaning, Station, Maintenance and Diagnostics.
- [ ] Left control is icon-only `mdi:menu` and emits the native composed/bubbling `hass-toggle-menu` event.
- [ ] Any Back control required by a detail view is inside the working area and never replaces the system Menu.
- [ ] Center title is **S8 OMNI** without a decorative robot/brand icon beside it.
- [ ] Secondary line is `Робот-пылесос · UI v0.5.4` and does not force horizontal overflow.
- [ ] Right control is the single global `mdi:refresh` action.
- [ ] Desktop/default Header grid is symmetric `52 px | minmax(0,1fr) | 52 px`.
- [ ] Mobile Header grid is symmetric `48 px | minmax(0,1fr) | 48 px`.
- [ ] Menu and Refresh use matching plaques and remain at least 44×44 px touch targets.
- [ ] Title stays visually centered relative to the viewport.
- [ ] Center title is a visible 44 px+ plaque with keyboard focus and pressed feedback.
- [ ] Open from Дом, Действия and Инфраструктура separately; the same mounted title returns to the actual source each time.
- [ ] Header respects iOS top/left/right Safe Area.
- [ ] Header contains no device action or integration-specific navigation.
- [ ] Hold/double tap on Header performs no robot/station action.

### Primary action row

- [ ] `Уборка`, `Пауза`, `Домой` occupy three equal columns on iPhone Pro Max portrait.
- [ ] Mobile actions use icon-above-text composition; no label is clipped by a neighboring action.
- [ ] Secondary labels `Smart`, `Приостановить`, `На станцию` remain legible without horizontal scrolling.
- [ ] All three action cards remain comfortable touch targets (>44 px in both practical dimensions).
- [ ] Primary color is used for the active/frequent Start action, not as arbitrary subsystem decoration.
- [ ] Disabled action styling is clearly distinguishable from an enabled action.

### Canonical Bottom Tab Bar

- [ ] The bar spans the full useful width of the iPhone viewport.
- [ ] The bar is attached to the bottom edge; it is not centered as a floating card.
- [ ] Overview / Cleaning / Station / Maintenance / Diagnostics remains visible during long vertical scroll.
- [ ] Active section is styled inside the common bar and is not detached as a separate floating element.
- [ ] Bottom, left and right iOS Safe Area insets are respected.
- [ ] Last content/card scrolls completely above the Tab Bar.
- [ ] `Обзор / Уборка / Станция / Сервис / Диагн.` do not force horizontal overflow.
- [ ] Tab touch targets remain large enough for one-handed use.

### Full-screen fit

- [ ] There is no horizontal scroll on Overview.
- [ ] There is no horizontal scroll on Cleaning or Cleaning settings.
- [ ] There is no horizontal scroll on Station, Maintenance or Diagnostics.
- [ ] Hero status text can wrap vertically without expanding beyond viewport width.
- [ ] Connection badge does not push the Hero beyond viewport width.
- [ ] Robot/Station status cards fit as two columns on iPhone Pro Max portrait.
- [ ] Long status text wraps inside its card rather than overflowing.
- [ ] Metric values and diagnostic values wrap or ellipsize instead of widening the page.

### Overview versus Cleaning

- [ ] Overview contains the composite robot + station hero, frequent actions and compact Robot/Station status cards.
- [ ] Overview does not repeat cleaning time/area or editable profile controls.
- [ ] Cleaning does not repeat the large composite hero.
- [ ] Cleaning contains Start/Pause/Home, factual time/area, one Settings entry and future Map/Rooms area.
- [ ] Root Cleaning does not contain editable suction/water/volume/DND controls.

### Cleaning settings child screen

- [ ] Child Header title is **Настройки уборки** with context `S8 OMNI · Уборка`.
- [ ] Child Back returns to root **Cleaning**, not `/dashboard-actions`.
- [ ] Suction choices: Тихий / Нормальный / Сильный.
- [ ] Water choices: Закрыто / Низкий / Средний / Высокий.
- [ ] Volume and DND controls are present.
- [ ] Bottom Tab Bar remains visible with **Уборка** active.
- [ ] Selecting another root tab closes the child workflow.
- [ ] Existing entity/service writes are unchanged: public select/number/switch entities only.

## v1.00_b016+ — disconnected / stale-state acceptance

This is a mandatory regression test because a previous live screenshot showed the last `repositioning` snapshot while the robot was actually offline.

### Controlled disconnect while Home Assistant is already running

1. Start with S8 OMNI online and confirm Header badge is **Локально**.
2. Record current robot/station status and telemetry age.
3. Make the robot locally unreachable in a controlled way without changing integration configuration.
4. Wait for a failed coordinator poll.

Expected daily-use UI after the failed poll:

- [ ] connection badge becomes **Нет связи** (or unconfirmed wording if connection truth itself is unknown);
- [ ] Hero primary status is **Нет связи** / unknown, not the previous robot DP5 state;
- [ ] Hero robot state is `Нет данных`, not the previous `repositioning`, cleaning, charging, etc.;
- [ ] Hero station state is `Нет данных`, not `Ожидание` by assumption;
- [ ] battery is `—`, not the last percentage presented as current;
- [ ] mode is `Нет данных`;
- [ ] dock position is unknown; the visual robot is not falsely shown docked/away;
- [ ] Overview Robot card says unavailable/no current telemetry;
- [ ] Overview Station card says no current telemetry;
- [ ] Start, Pause and Home are disabled;
- [ ] suction/water/volume/DND and child-lock writes are disabled while disconnected;
- [ ] station operation rows show `Нет данных` rather than `Ожидание`;
- [ ] maintenance resource values are not presented as fresh current values;
- [ ] telemetry age remains visible and increases from the last successful snapshot;
- [ ] Diagnostics explicitly reports device unavailable/unconfirmed and can still expose raw diagnostic context without promoting it as current state.

### Recovery

5. Restore local connectivity and wait for or manually request a successful refresh.

Expected recovery:

- [ ] badge returns to **Локально**;
- [ ] robot/station/composite status returns only after a successful current snapshot;
- [ ] battery/mode/dock/station operation values return;
- [ ] appropriate device controls become enabled again;
- [ ] telemetry age resets to a fresh value.

## v1.00_b017 — offline startup / panel lifecycle acceptance

This is the lifecycle regression test. The panel must be treated as Home Assistant application infrastructure, not as a side effect of a successful hardware poll.

### Static/source assertions

- [x] `async_setup_entry()` does not call `async_config_entry_first_refresh()`.
- [x] panel registration occurs before the first `coordinator.async_refresh()` call.
- [x] HA platform setup occurs before the first device refresh, so entities exist even with no initial data.
- [x] CI enforces `panel registration → platform setup → non-gating refresh` order.

### Controlled offline start

1. Start with the integration configured and working.
2. Power off or otherwise make **only S8 OMNI** locally unreachable.
3. Fully restart Home Assistant while the robot remains unreachable.
4. Do not turn the robot back on until Home Assistant startup has completed.

Expected behavior after HA startup:

- [ ] S8 OMNI config entry is **loaded**, not stuck in `Retrying setup` solely because the robot is offline;
- [ ] **Пылесос** remains present in the Home Assistant sidebar;
- [ ] `/dashboard-s8-omni` opens normally;
- [ ] Header and Bottom Tab Bar are present;
- [ ] the local-connection entity remains available and reports disconnected;
- [ ] coordinator-backed robot/station/metric entities are unavailable or no-data, not stale-current;
- [ ] Hero shows **Нет связи / Нет данных** semantics;
- [ ] Start/Pause/Home and editable device controls are disabled;
- [ ] no raw/stale value is promoted as current operational truth;
- [ ] repeated coordinator polling continues while the robot is offline.

### Recovery without reloading the integration

5. Restore robot power/connectivity without restarting Home Assistant and without reloading/re-adding the integration.

Expected behavior:

- [ ] the next successful coordinator poll restores live entities automatically;
- [ ] local connection becomes **Локально**;
- [ ] Hero, robot/station cards and metrics repopulate from the new snapshot;
- [ ] controls become available according to current state;
- [ ] the sidebar panel did not disappear at any point.

## v1.00_b015+ — frontend bundle hardening acceptance

Production module: `custom_components/s8_omni/frontend/s8-omni-panel.js`.

Static/source assertions:

- [x] `module_url` points to stable `s8-omni-panel.js?v=<dashboard version>`.
- [x] Production bundle contains no relative runtime `import` of a previous panel version.
- [x] Production bundle registers `<s8-omni-panel>` by itself.
- [x] Historical `s8-omni-panel-v*.js` files are not required by the production module.
- [x] CI confirms exactly one production JavaScript panel file is shipped in the active frontend directory.

Runtime acceptance:

1. [ ] Load `/dashboard-s8-omni` on local LAN after clearing Home Assistant/Companion frontend cache.
2. [ ] Load `/dashboard-s8-omni` through Home Assistant Cloud / Nabu Casa with a cold client cache.
3. [ ] Fully restart Home Assistant and open S8 OMNI before any previous S8 panel resource is cached.
4. [ ] Open and close the panel repeatedly from the parent dashboard.
5. [ ] Verify the Header title returns to the originating base panel, with `/dashboard-actions` used only as the safe direct-open fallback.
6. [ ] Verify Refresh still requests coordinator refresh.
7. [ ] Verify no `Unable to load custom panel` message appears.
8. [ ] Verify no `Configuration error` appears.
9. [ ] Verify browser/network trace does not request historical `s8-omni-panel-v*.js` files.
10. [ ] Verify Overview, Cleaning, Cleaning settings, Station, Maintenance and Diagnostics all render from the single bundle.
11. [ ] During initial registry loading, Header + loading content + Bottom Tab Bar are visible; there is no blank white screen.

A warmed browser cache is not sufficient evidence. At least one cold-cache local test and one cold-cache Cloud test are required before treating the frontend release as production-ready.

## Refresh behavior

- [ ] Pressing Refresh requests an immediate local coordinator refresh.
- [ ] Refresh does not change DP1/DP2/DP4/DP134/DP135/DP136 by itself.
- [ ] Refresh shows temporary busy feedback and becomes usable again.
- [ ] If the refresh entity cannot be resolved, the Header action stays disabled.
- [ ] Telemetry age returns to a fresh value after a successful manual refresh.

## Download diagnostics acceptance

From **Settings → Devices & services → S8 OMNI → Download diagnostics**:

- [ ] Diagnostics download is available for the S8 OMNI config entry.
- [ ] Integration version is `v1.00_b066`; dashboard version is `v0.7.30`.
- [ ] Host/IP is replaced by a redaction marker.
- [ ] Device ID is replaced by a redaction marker.
- [ ] Local Key is replaced by a redaction marker.
- [ ] Raw map/path/command/timer payloads are absent.
- [ ] Export contains normalized robot/station/composite state and known safe scalar datapoints.

## Required state scenarios

- [x] Robot at base with no active station operation.
- [x] Charge complete represented in Overview/Diagnostics (`charge_done`).
- [ ] Normal cleaning.
- [ ] Pause.
- [ ] Charging.
- [ ] Station dust collection active.
- [ ] Station roller/mop cleaning active.
- [ ] Station drying active.
- [ ] Robot fault.
- [ ] Unknown/unrecognized robot status.
- [ ] Whole S8 OMNI unavailable / disconnected with stale last-known DP values present.
- [ ] Home Assistant restart while S8 OMNI remains offline.
- [ ] Recovery after whole-device disconnect without config-entry reload.
- [ ] One station DP missing from otherwise successful snapshot.

## Safety assertions

- [x] No panel action writes Tuya DP directly.
- [x] No LocalTuya service is called by the panel.
- [x] No cloud API is called by the panel.
- [x] No station write buttons appear while DP134/135/136 remain read-only.
- [x] Map/room controls remain deferred until a stable integration API exists.
- [x] Consumable percentages are not invented.
- [x] Diagnostics exporter deliberately excludes raw map/path/command/timer payloads.
- [x] Cleaning settings drill-down reuses existing public HA entities and introduces no new device write contract.
- [x] Disconnected UI disables public device-write controls rather than attempting a command against stale state.

Stop testing additional write commands if any command behaves unexpectedly; collect Home Assistant logs before further changes.
