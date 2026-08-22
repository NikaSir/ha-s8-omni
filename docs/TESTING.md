# v1.00_b015 acceptance checklist

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
- [x] Explicit root Back route is `/dashboard-actions`.
- [x] Header Refresh uses an integration-owned Home Assistant button entity.
- [x] Sanitized Home Assistant Download diagnostics is implemented.

## Remaining protocol acceptance

1. Set water to **Medium** in the official application and capture `cistern`; confirm whether raw value is `normal`.
2. Change suction `normal → strong → normal` from Home Assistant and confirm physical/application state and local reflection.
3. Verify Pause from Home Assistant on the physical robot.
4. Verify Start after Pause resumes cleaning rather than starting an unrelated mode.
5. Keep Stop unimplemented unless a controlled test proves unambiguous semantics.
6. Keep station writes, DND schedule, cleaning timer, map/room payloads and consumable resets out of public UI until verified.

## Dashboard v0.5.3 — app-shell acceptance

Control viewport: **iPhone Pro Max · portrait**.

### Root Header

- [ ] Header is visible on Overview, Cleaning, Station, Maintenance and Diagnostics.
- [ ] Left control is `mdi:arrow-left` and explicitly navigates to `/dashboard-actions` on all five root views.
- [ ] Center title is **S8 OMNI** without a second large device title in the hero.
- [ ] Right control is `mdi:refresh` and invokes only the integration-owned **Обновить сейчас** entity.
- [ ] Header remains compact and respects iOS top Safe Area.
- [ ] Back and Refresh touch targets are approximately 44×44 pt or larger.
- [ ] Root Back never uses `history.back()`.
- [ ] Hold/double tap on Header performs no robot/station action.

### Canonical bottom Tab Bar

- [ ] The bar spans the full useful width of the iPhone viewport.
- [ ] The bar is attached to the bottom edge; it is not centered as a floating card.
- [ ] The outer Tab Bar has no floating-card corner radius.
- [ ] Overview / Cleaning / Station / Maintenance / Diagnostics remains visible during long vertical scroll.
- [ ] Active section is styled inside the common bar and is not detached as a separate floating element.
- [ ] Bottom, left and right iOS Safe Area insets are respected.
- [ ] Last content/card scrolls completely above the Tab Bar.
- [ ] No primary top-tab navigation exists.

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

## v1.00_b015 — frontend bundle hardening acceptance

Production module: `custom_components/s8_omni/frontend/s8-omni-panel.js`.

Static/source assertions:

- [x] `module_url` points to stable `s8-omni-panel.js?v=<dashboard version>`.
- [x] Production bundle contains no relative runtime `import` of a previous panel version.
- [x] Production bundle registers `<s8-omni-panel>` by itself.
- [x] Historical `s8-omni-panel-v*.js` files are not required by the production module.
- [ ] CI confirms exactly one production JavaScript panel file is shipped in the active frontend directory.

Runtime acceptance:

1. [ ] Load `/dashboard-s8-omni` on local LAN after clearing Home Assistant/Companion frontend cache.
2. [ ] Load `/dashboard-s8-omni` through Home Assistant Cloud / Nabu Casa with a cold client cache.
3. [ ] Fully restart Home Assistant and open S8 OMNI before any previous S8 panel resource is cached.
4. [ ] Open and close the panel repeatedly from the parent dashboard.
5. [ ] Verify Back returns to `/dashboard-actions`.
6. [ ] Verify Refresh still requests coordinator refresh.
7. [ ] Verify no `Unable to load custom panel` message appears.
8. [ ] Verify no `Configuration error` appears.
9. [ ] Verify browser/network trace does not request `s8-omni-panel-v2.js` ... `s8-omni-panel-v10.js`.
10. [ ] Verify Overview, Cleaning, Cleaning settings, Station, Maintenance and Diagnostics all render from the single bundle.

A warmed browser cache is not sufficient evidence for this release. At least one cold-cache local test and one cold-cache Cloud test are required before treating the hardening release as production-ready.

## Refresh behavior

- [ ] Pressing Refresh requests an immediate local coordinator refresh.
- [ ] Refresh does not change DP1/DP2/DP4/DP134/DP135/DP136 by itself.
- [ ] Refresh shows temporary busy feedback and becomes usable again.
- [ ] If the refresh entity cannot be resolved, the Header action stays disabled.
- [ ] Telemetry age returns to a fresh value after a successful manual refresh.

## Download diagnostics acceptance

From **Settings → Devices & services → S8 OMNI → Download diagnostics**:

- [ ] Diagnostics download is available for the S8 OMNI config entry.
- [ ] Integration version is `v1.00_b015`; dashboard version is `v0.5.3`.
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
- [ ] Whole S8 OMNI unavailable.
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

Stop testing additional write commands if any command behaves unexpectedly; collect Home Assistant logs before further changes.
