# S8 OMNI v1.0.0 acceptance

This checklist is the release gate for integration `v1.0.0` and panel `UI v1.0.0`.

Before device-side testing, back up Home Assistant and disable **only S8 OMNI** in LocalTuya. Do not run Smart Life and `ha-s8-omni` as competing local clients during command verification.

## Automated gate

The pull request must pass all three independent CI jobs:

- repository checks: JSON, Python compilation, JavaScript syntax, NikaS v2.2 contract and Python regressions;
- browser regression: production bootstrap and command/readback behavior in Chromium;
- HACS validation: current repository, manifest, information and brand requirements.

Automated browser fixtures do not replace physical robot, Home Assistant registry, iOS safe-area, touch-gesture or installed-cache acceptance.

## Stable baseline already established

- [x] Integration installs through HACS and creates one S8 OMNI device.
- [x] Local polling returns robot, station, battery, cleaning and consumable telemetry.
- [x] Start, Pause, Continue and Return to base have been captured and physically confirmed.
- [x] Dust collection, mop washing and mop drying have verified Start and Stop directions.
- [x] Volume, Do Not Disturb and child lock use public Home Assistant entities with confirmed readback.
- [x] The five-view panel renders on iPhone Pro Max portrait and follows NikaS Specialized Panel UI Standard v2.2.
- [x] Diagnostics export redacts Host, Device ID and Local Key and excludes raw map/path/command/timer payloads.
- [x] Unknown or stale local telemetry is never presented as a current normal state.

## Final physical smoke test

Run this sequence after installing the release candidate and restarting Home Assistant:

1. **At the dock**
   - [ ] Header shows `Локально · Данные актуальны`.
   - [ ] Robot state, charge and station idle state match the official application.
   - [ ] Refresh shows immediate busy feedback, completes, and changes no control DP.

2. **Start, Pause and Continue**
   - [ ] `Уборка` starts Smart cleaning and reaches factual cleaning state.
   - [ ] `Пауза` reaches factual paused state.
   - [ ] `Уборка` from paused continues the same job and does not pause again.

3. **Return to base**
   - [ ] `Домой` during cleaning first reaches the verified paused/standby transition and then factual return state.
   - [ ] The robot docks and charging/station telemetry appears without a manual integration reload.

4. **Station operations while docked**
   - [ ] Dust collection starts and stops.
   - [ ] Mop washing starts and stops.
   - [ ] Mop drying starts and stops.
   - [ ] An active operation exposes the unified immediate `Стоп` on Overview.
   - [ ] Station Start remains unavailable while the robot is away from the dock.

5. **Service settings**
   - [ ] Volume, Do Not Disturb and child lock can be changed together and applied with one confirmation.
   - [ ] Each changed value clears from the draft only after matching entity-state readback.
   - [ ] `Отменить` discards the complete local draft without sending a service call.
   - [ ] A failed or unconfirmed write leaves the draft available for retry and shows a visible error.

6. **Connection loss and recovery**
   - [ ] After a failed local poll the badge becomes `Нет связи` or `Нет данных` and previous telemetry is not shown as current.
   - [ ] Start, Pause, Home, station operations and editable settings are disabled while current truth is unavailable.
   - [ ] The panel remains registered and usable after a Home Assistant restart while the robot is offline.
   - [ ] Restoring the robot returns live data and controls automatically without reloading the config entry.

7. **Installed frontend**
   - [ ] A cold local-LAN load and a cold Home Assistant Cloud/Nabu Casa load show `UI v1.0.0`.
   - [ ] Header, fixed Bottom Tab Bar, long vertical scroll, iOS safe areas, pinch/pan and two-finger reset remain correct.
   - [ ] No `Unable to load custom panel`, `Configuration error`, white remount flash or historical panel-module request appears.
   - [ ] The Header title returns to the actual originating NikaS base panel.

## Diagnostics and privacy

Download diagnostics from **Settings → Devices & services → S8 OMNI** and verify:

- [ ] integration version is `v1.0.0` and dashboard version is `v1.0.0`;
- [ ] Host/IP, Device ID and Local Key are redacted;
- [ ] raw map, path, command, timer and account payloads are absent;
- [ ] normalized robot/station/composite state and known safe scalar datapoints remain available.

## Deliberate v1.0.0 limits

- General `vacuum.stop` is not exposed; Pause and the verified station-operation Stop controls remain separate.
- Map/Rooms, DND schedule, cleaning timers, manual-direction control and consumable resets remain unavailable.
- No complex/raw DP write may enter production from APK research alone. It requires a controlled outbound capture on this S8 OMNI and physical state confirmation.

Stop testing additional writes if any command behaves unexpectedly. Preserve secret-free Home Assistant logs and diagnostics before changing the protocol implementation.
