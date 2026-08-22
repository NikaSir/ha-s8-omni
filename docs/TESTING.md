# v1.00_b009 acceptance checklist

Before device-side testing, back up Home Assistant and disable **only S8 OMNI** in LocalTuya to avoid two local Tuya clients contending for the device.

## Already verified

- [x] Integration installs through HACS and creates the S8 OMNI device.
- [x] Local polling returns live robot and station datapoints.
- [x] Volume DP26 writes from Home Assistant and is reflected in the official application.
- [x] Do Not Disturb DP25 writes from Home Assistant and is reflected in the official application.
- [x] Water DP10 switching is bidirectional for observed states; `closed` is confirmed by Tuya status log.
- [x] Live values for battery, cleaning time/area, fault, work mode and consumable resources are visible.
- [x] Start cleaning is confirmed on the physical robot.
- [x] Return to base is confirmed on the physical robot.
- [x] Station dust collection, roller/mop cleaning and drying have been observed.
- [x] Dashboard renders correctly on iPhone Pro Max portrait across all five main views.
- [x] Explicit Back route is `/dashboard-actions` and fixed bottom navigation is implemented in the NikaS app shell.

## Remaining protocol acceptance

1. Set water to **Medium** in the official application and capture `cistern`; confirm whether raw value is `normal`.
2. Change suction `normal → strong → normal` from Home Assistant and confirm physical/application state and local reflection.
3. Verify Pause from Home Assistant on the physical robot.
4. Verify Start after Pause resumes cleaning rather than starting an unrelated mode.
5. Keep Stop unimplemented unless a controlled test proves unambiguous semantics.
6. Keep station writes, DND schedule, cleaning timer, map/room payloads and consumable resets out of public UI until verified.

## Reconfigure acceptance

1. Open **Reconfigure** and confirm IP address, Device ID, Local Key and protocol version are pre-filled.
2. Confirm Local Key is password-style.
3. Submit unchanged valid values and verify reload.
4. Submit an invalid Local Key and confirm working configuration is not overwritten.
5. After Tuya re-pair, enter the new Local Key and verify reconnect without removing the entry.
6. Change polling interval and confirm automatic reload.

## Dashboard v0.4.2 — NikaS app-shell acceptance

Control viewport: **iPhone Pro Max · portrait**.

### Header

- [ ] Header is visible on Overview, Cleaning, Station, Maintenance and Diagnostics.
- [ ] Left control is `mdi:arrow-left` and explicitly navigates to `/dashboard-actions`.
- [ ] Center title is **S8 OMNI**.
- [ ] Right control is `mdi:refresh` and invokes only the integration-owned **Обновить сейчас** Home Assistant button entity.
- [ ] Header remains compact and respects the iOS top safe area.
- [ ] Back and Refresh touch targets are approximately 44×44 pt or larger.
- [ ] Back never uses `history.back()`.
- [ ] Hold/double tap on Header performs no robot/station action.
- [ ] Hero does not repeat a large `S8 OMNI · vX` title; it begins from current state.

### Refresh behavior

- [ ] Pressing Refresh requests an immediate local coordinator refresh.
- [ ] Refresh does not change DP1/DP2/DP4/DP134/DP135/DP136 by itself.
- [ ] Refresh button shows temporary busy feedback and becomes usable again.
- [ ] If the refresh entity cannot be resolved, the header action stays disabled instead of falling back to a raw/network write.
- [ ] Telemetry age returns to a fresh value after a successful manual refresh.

### Bottom navigation

- [ ] Overview / Cleaning / Station / Maintenance / Diagnostics remains visible during long vertical scroll.
- [ ] Active section is visually unambiguous.
- [ ] Bottom safe area is respected.
- [ ] Last content is not hidden under the navigation bar.
- [ ] No primary top-tab navigation exists.

### Mobile geometry

- [ ] No horizontal scroll.
- [ ] No clipped labels on iPhone Pro Max portrait.
- [ ] Main Start/Pause/Home actions remain one-hand reachable.
- [ ] Critical buttons are not packed too closely.
- [ ] Long press on entity-backed rows opens native Home Assistant more-info.

### Daily-use behavior

- [ ] Dashboard version in Diagnostics/header is `v0.4.2`.
- [ ] With DP5 `charge_done`/`charging` and sticky DP4 `chargego`, daily UI shows base/charging state rather than «Возврат на базу».
- [ ] Diagnostics still shows factual raw DP4 `chargego` when present.
- [ ] Suction has Тихий / Нормальный / Сильный segmented choices.
- [ ] Water has Закрыто / Низкий / Средний / Высокий segmented choices.
- [ ] Segment selection uses only the existing Home Assistant select entity.
- [ ] Daily screens do not expose DP/protocol implementation prose.
- [ ] Active station operation gets a prominent live-operation banner.

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

### Unknown/unavailable assertions

- [ ] Unknown DP5 is not rendered as idle/standby.
- [ ] Missing station DP is not rendered as Off.
- [ ] If no station operation is active but any required station DP is missing, station status is `unknown`, not `idle`.
- [ ] Whole-device communication failure renders unavailable rather than a stale normal state.
- [ ] Telemetry age remains available for diagnostics after the last successful update.

### Safety assertions

- [x] No panel action writes Tuya DP directly.
- [x] No LocalTuya service is called by the panel.
- [x] No cloud API is called by the panel.
- [x] No station write buttons appear while DP134/135/136 remain read-only.
- [x] Map/room controls remain deferred until a stable integration API exists.
- [x] Consumable percentages are not invented.
- [x] Header Refresh is implemented through a public Home Assistant button entity rather than a frontend network/Tuya call.

Stop testing additional write commands if any command behaves unexpectedly; collect Home Assistant logs before further changes.
