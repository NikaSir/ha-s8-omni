# Changelog

All notable project changes are recorded here.

## [Unreleased]

### Added

- `v1.00_b012` / dashboard `v0.5.0`: introduce a canonical **Cleaning settings** drill-down below the root Cleaning tab.
- `v1.00_b012` / dashboard `v0.5.0`: keep the root Cleaning tab operational (state, Start/Pause/Home and cleaning metrics) while suction, water, volume and DND controls exist only on the child settings screen.
- `v1.00_b012` / dashboard `v0.5.0`: Overview **Настроить** and Cleaning **Настройки уборки** open the same child screen; child Back returns to Cleaning while the fixed bottom Tab Bar still switches root sections.
- `v1.00_b011`: add Home Assistant **Download diagnostics** support with sanitized integration/coordinator state.
- `v1.00_b011`: redact Host, Device ID and Local Key from exported diagnostics; exclude raw map/path/command/timer payloads and redact known connection identifiers from exception text.
- `v1.00_b010` / dashboard `v0.4.3`: adopt the NikaS canonical **full-width fixed bottom Tab Bar**; remove floating-card geometry from the primary section navigation.
- `v1.00_b010` / dashboard `v0.4.3`: keep the active section visually inside the shared bottom bar, preserve iOS Safe Area, and reserve enough page-bottom clearance so the last card scrolls fully above navigation.
- `v1.00_b009` / dashboard `v0.4.2`: add a public **Обновить сейчас** button entity and expose it in the unified Header.
- `v1.00_b008` / dashboard `v0.4.1`: make the five-section navigation fixed during long vertical scrolling.
- `v1.00_b007` / dashboard `v0.4.0`: adopt the explicit **← Назад** Header with parent route `/dashboard-actions` and no browser-history navigation.
- `v1.00_b006` / dashboard `v0.3.0`: add mobile segmented suction/water controls, station live-operation emphasis and cleaner daily-use copy.
- `v1.00_b004`: add the integration-owned native S8 OMNI panel at `/dashboard-s8-omni` with normalized robot/station/composite status semantics.
- `v1.00_b003`: add safe Reconfigure flow for IP address, Device ID, Local Key and Tuya protocol version.
- Standalone `s8_omni` Home Assistant integration, local Tuya LAN coordinator, config flow, vacuum controls, sensors and OMNI station telemetry.

### Fixed

- `v1.00_b012`: cleaning profile controls are no longer duplicated on the root Cleaning tab.
- `v1.00_b010`: the bottom navigation no longer renders as a centered/floating rounded card; it spans the full useful viewport width with zero outer radius.
- `v1.00_b008`: bottom navigation is fixed instead of relying on sticky positioning.
- `v1.00_b006`: dashboard version labels reflect the shipped panel version and stale `mode=chargego` is not shown as an active return-to-base action after charging/charged.
- `v1.00_b004`: unknown/missing robot or station datapoints are no longer silently coerced into normal states.
- `v1.00_b002`: add the verified DP10 / `cistern` water level `closed`.

### Known limitations

- Stop command is intentionally not implemented through `v1.00_b012`.
- Consumable/map reset writes are intentionally deferred pending verification.
- DND schedule, cleaning timers and raw map/control payloads are intentionally deferred pending verification.
- Station DP134/135/136 remain read-only until station write semantics are verified end-to-end.
