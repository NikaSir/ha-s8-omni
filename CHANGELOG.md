# Changelog

All notable project changes are recorded here.

## [Unreleased]

### Added

- `v1.00_b009` / dashboard `v0.4.2`: add a public **Обновить сейчас** button entity that requests an immediate coordinator refresh without writing any robot/station Tuya control DP.
- `v1.00_b009` / dashboard `v0.4.2`: add the refresh action to the right side of the unified NikaS header while preserving explicit Back on the left and fixed bottom navigation for internal sections.
- `v1.00_b008` / dashboard `v0.4.1`: complete the Home Assistant NikaS application shell by making the existing five-section navigation a fixed, iOS-safe bottom bar that remains available during long vertical scrolling.
- `v1.00_b008` / dashboard `v0.4.1`: keep explicit Header Back to `/dashboard-actions`, preserve the accepted `Обзор / Уборка / Станция / Сервис / Диагн.` navigation model, and reserve the hero for current appliance state rather than duplicate device naming.
- `v1.00_b007` / dashboard `v0.4.0`: adopt the Home Assistant NikaS specialized-panel app shell with a persistent **← Назад** header.
- `v1.00_b007` / dashboard `v0.4.0`: make Back explicitly navigate to `/dashboard-actions`; browser-history back is not used.
- `v1.00_b007` / dashboard `v0.4.0`: publish the S8 OMNI parent route and navigation contract in `panel.json` and panel config metadata.
- `v1.00_b007` / dashboard `v0.4.0`: remove duplicate S8 OMNI naming from the hero so the header identifies the application and the hero identifies current state.
- `v1.00_b006` / dashboard `v0.3.0`: replace compact system selects for suction and water with large mobile-first segmented controls using the existing public Home Assistant select entities.
- `v1.00_b006` / dashboard `v0.3.0`: add a prominent live-operation banner on the Station view while dust collection, cleaning or drying is active.
- `v1.00_b006` / dashboard `v0.3.0`: simplify user-facing copy so protocol/DP implementation details remain in Diagnostics/documentation instead of daily-control screens.
- `v1.00_b005` / dashboard `v0.2.1`: add a persistent **Меню** control that opens the native Home Assistant sidebar from every S8 OMNI panel view using Home Assistant's `hass-toggle-menu` event.
- `v1.00_b004`: add the integration-owned native S8 OMNI panel at `/dashboard-s8-omni`, dashboard version `v0.2.0`.
- `v1.00_b004`: add mobile-first Overview, Cleaning, Station, Maintenance and Diagnostics views targeted at iPhone Pro Max portrait use.
- `v1.00_b004`: add appliance-specific robot/dock visual context, factual battery/mode/telemetry indicators and state-driven robot/station motion cues.
- `v1.00_b004`: add normalized robot status, station status and composite robot + station status sensors for reuse by the native panel and `ha-contract-generated-ui`.
- `v1.00_b004`: add local Tuya LAN connection health, last successful telemetry timestamp and telemetry-age diagnostics.
- `v1.00_b004`: expose DP1/DP2 and raw station flags as diagnostic attributes of the composite status sensor.
- `v1.00_b004`: publish machine-readable navigation metadata in `panel.json`.
- `v1.00_b003`: add a Home Assistant **Reconfigure** flow for S8 OMNI local connection parameters: IP address, Device ID, Local Key and Tuya protocol version.
- `v1.00_b003`: validate reconfigured connection values against the robot before saving and reload the config entry only after a successful update.
- `v1.00_b003`: use a password-style input for Local Key in the initial and reconfigure flows.
- `v1.00_b003`: automatically reload the integration after changing the polling interval through Options.
- Standalone `s8_omni` Home Assistant integration skeleton.
- Local Tuya LAN coordinator using `tinytuya`.
- Config flow for IP address, Device ID, Local Key, protocol version and scan interval.
- Vacuum entity with start, pause, return-to-base and fan-speed control.
- Battery, cleaning time/area, brush/filter lifetime, fault and work-mode sensors.
- OMNI station binary sensors for dust collection, roller cleaning and roller drying.
- Controls for DND, child lock, suction, water level and volume.
- HACS metadata, protocol documentation and acceptance test plan.

### Fixed

- `v1.00_b008`: bottom navigation is now truly fixed instead of relying on `position: sticky`; the last content receives safe bottom clearance and the bar remains in the one-handed thumb zone.
- `v1.00_b006`: dashboard version labels now reflect the shipped panel version instead of retaining the base `v0.2.0` string.
- `v1.00_b006`: a sticky Tuya `mode=chargego` is no longer shown to the user as «Возврат на базу» after the robot is already charging or charged; raw DP4 remains visible in Diagnostics.
- `v1.00_b004`: an unrecognized or missing robot status is no longer silently coerced to `idle`.
- `v1.00_b004`: a missing individual station/switch/select/number datapoint is no longer silently presented as an ordinary `off`/normal value.
- `v1.00_b002`: add the fourth verified DP10 / `cistern` water level `closed` (application label: «Закрыто»). The value was captured from Tuya `Get Status Reporting Log` during a live device test.

### Known limitations

- Stop command is intentionally not implemented through `v1.00_b009`.
- Consumable/map reset writes are intentionally deferred pending verification.
- DND schedule, cleaning timers and raw map/control payloads are intentionally deferred pending verification.
- Station DP134/135/136 remain read-only until station write semantics are verified end-to-end.
