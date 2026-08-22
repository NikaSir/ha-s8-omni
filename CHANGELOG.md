# Changelog

All notable project changes are recorded here.

## [Unreleased]

### Added

- `v1.00_b016` / dashboard `v0.5.4`: align the S8 OMNI Header and primary action row with **NikaS Integration Panel Template v1.0**: symmetric 52 px Header slots, 48 px narrow-mobile slots, icon-only Back, centered title and one Refresh action.
- `v1.00_b016` / dashboard `v0.5.4`: make the three frequent actions use equal mobile columns with vertical icon/text composition so **Уборка / Пауза / Домой** fit the iPhone Pro Max portrait viewport without horizontal clipping.
- `v1.00_b016` / dashboard `v0.5.4`: preserve Header + loading state + Bottom Tab Bar during frontend/entity-registry loading.
- `v1.00_b015` / dashboard `v0.5.3`: harden the integration-owned frontend into one autonomous production bundle: `s8-omni-panel.js`.
- `v1.00_b015` / dashboard `v0.5.3`: register the stable bundle name through `module_url` and use the dashboard version query string only for cache busting.
- `v1.00_b015` / dashboard `v0.5.3`: add CI assertions that the production panel module exists, contains no historical-version runtime imports and is the only JavaScript file shipped in the production frontend directory.
- `v1.00_b014` / dashboard `v0.5.2`: add compact **Робот** and **Станция** status cards below the frequent Overview actions so the first screen remains concise while still showing both subsystem states.
- `v1.00_b014` / dashboard `v0.5.2`: robot summary shows normalized state plus factual dock context; station summary shows normalized state plus active station operation or an explicit telemetry warning.
- `v1.00_b013` / dashboard `v0.5.1`: split the first two root tabs by responsibility: **Overview** now owns composite system state/health and frequent actions, while **Cleaning** owns the active cleaning workflow, session metrics and the entry to cleaning settings.
- `v1.00_b013` / dashboard `v0.5.1`: remove the large composite robot/station hero and station-operation block from the Cleaning tab; remove cleaning time/area/suction/water and station detail blocks from Overview.
- `v1.00_b013` / dashboard `v0.5.1`: keep the existing **Настройки уборки** drill-down as the only editable profile screen and preserve the canonical full-width fixed bottom Tab Bar.
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

- `v1.00_b016`: a failed local connection can no longer leave the last robot/station DP snapshot looking like the current state. The daily UI switches to **Нет связи / Нет данных**, keeps telemetry age visible, and disables device commands until local communication is confirmed again.
- `v1.00_b016`: stale battery, mode, dock position, station operations and maintenance/control values are no longer presented as current while the local connection is disconnected or unconfirmed.
- `v1.00_b016`: reduce mobile Header/button pressure and add explicit overflow protection for Header subtitle, Hero/state text, status cards, metrics and Bottom Tab Bar labels.
- `v1.00_b015`: remove the production runtime chain `v10 → v9 → ... → v2`; panel startup no longer depends on historical frontend files or their browser-cache state.
- `v1.00_b013`: Overview and Cleaning no longer repeat the same large robot/station status and cleaning information blocks.
- `v1.00_b012`: cleaning profile controls are no longer duplicated on the root Cleaning tab.
- `v1.00_b010`: the bottom navigation no longer renders as a centered/floating rounded card; it spans the full useful viewport width with zero outer radius.
- `v1.00_b008`: bottom navigation is fixed instead of relying on sticky positioning.
- `v1.00_b006`: dashboard version labels reflect the shipped panel version and stale `mode=chargego` is not shown as an active return-to-base action after charging/charged.
- `v1.00_b004`: unknown/missing robot or station datapoints are no longer silently coerced into normal states.
- `v1.00_b002`: add the verified DP10 / `cistern` water level `closed`.

### Known limitations

- Stop command is intentionally not implemented through `v1.00_b016`.
- Consumable/map reset writes are intentionally deferred pending verification.
- DND schedule, cleaning timers and raw map/control payloads are intentionally deferred pending verification.
- Station DP134/135/136 remain read-only until station write semantics are verified end-to-end.
