# v1.00_b012 acceptance checklist

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

## Dashboard v0.5.0 — NikaS navigation acceptance

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
- [ ] All tab touch targets remain comfortably usable one-handed.

### Cleaning root versus child settings

- [ ] Root **Cleaning** contains state/hero, Start/Pause/Home and factual cleaning time/area.
- [ ] Root **Cleaning** does **not** contain editable suction controls.
- [ ] Root **Cleaning** does **not** contain editable water controls.
- [ ] Root **Cleaning** does **not** contain the volume slider.
- [ ] Root **Cleaning** does **not** contain the DND toggle.
- [ ] Root **Cleaning** contains one clear **Настройки уборки** drill-down entry.
- [ ] Overview **Настроить** opens the same canonical Cleaning settings child screen.
- [ ] Child Header title is **Настройки уборки** with secondary context `S8 OMNI · Уборка`.
- [ ] Child Back returns to root **Cleaning**, not `/dashboard-actions`.
- [ ] Child screen contains suction segmented controls: Тихий / Нормальный / Сильный.
- [ ] Child screen contains water segmented controls: Закрыто / Низкий / Средний / Высокий.
- [ ] Child screen contains volume and DND controls.
- [ ] Existing entity/service writes are unchanged: select/number/switch entities only.
- [ ] Bottom Tab Bar remains visible on the child screen with **Уборка** active.
- [ ] Selecting another root tab from the child screen closes the drill-down and opens that root view.
- [ ] Returning to Cleaning after switching tabs opens the Cleaning root, not stale child settings.
- [ ] No duplicated full settings form appears on Overview or root Cleaning.

### Refresh behavior

- [ ] Pressing Refresh requests an immediate local coordinator refresh.
- [ ] Refresh does not change DP1/DP2/DP4/DP134/DP135/DP136 by itself.
- [ ] Refresh shows temporary busy feedback and becomes usable again.
- [ ] If the refresh entity cannot be resolved, the Header action stays disabled.
- [ ] Telemetry age returns to a fresh value after a successful manual refresh.

### Mobile geometry

- [ ] No horizontal scroll on root views or Cleaning settings.
- [ ] No clipped labels on iPhone Pro Max portrait.
- [ ] Main Start/Pause/Home actions remain one-hand reachable.
- [ ] Cleaning settings segmented controls remain comfortable at portrait width.
- [ ] Critical buttons are not packed too closely.
- [ ] Long press on entity-backed rows opens native Home Assistant more-info.

### Daily-use behavior

- [ ] Dashboard version in Diagnostics/Header is `v0.5.0`.
- [ ] With DP5 `charge_done`/`charging` and sticky DP4 `chargego`, daily UI shows base/charging state rather than «Возврат на базу».
- [ ] Diagnostics still shows factual raw DP4 `chargego` when present.
- [ ] Active station operation gets a prominent live-operation banner.

## Download diagnostics acceptance

From **Settings → Devices & services → S8 OMNI → Download diagnostics**:

- [ ] Diagnostics download is available for the S8 OMNI config entry.
- [ ] Integration version is `v1.00_b012`; dashboard version is `v0.5.0`.
- [ ] Host/IP is replaced by a redaction marker.
- [ ] Device ID is replaced by a redaction marker.
- [ ] Local Key is replaced by a redaction marker.
- [ ] No Local Key fragment, Device ID or private IP appears inside the exported coordinator exception text.
- [ ] Raw map/path/command/timer payloads are absent.
- [ ] Export contains coordinator health, last successful telemetry timestamp and reported DP IDs.
- [ ] Export contains normalized robot/station/composite state.
- [ ] Export contains only the known safe scalar datapoints used by public entities.
- [ ] Generating diagnostics performs no device write and does not trigger a station/robot command.

If any identifier or secret appears unredacted, do not share the file; stop and fix the diagnostics exporter first.

### Required state scenarios

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

### Safety assertions

- [x] No panel action writes Tuya DP directly.
- [x] No LocalTuya service is called by the panel.
- [x] No cloud API is called by the panel.
- [x] No station write buttons appear while DP134/135/136 remain read-only.
- [x] Map/room controls remain deferred until a stable integration API exists.
- [x] Consumable percentages are not invented.
- [x] Diagnostics exporter deliberately excludes raw map/path/command/timer payloads.
- [x] Cleaning settings drill-down reuses existing public HA entities and introduces no new device write contract.

Stop testing additional write commands if any command behaves unexpectedly; collect Home Assistant logs before further changes.
