## v1.00_b058 / UI v0.7.22

- Adopted NIKAS Specialized Panel UI Standard v1.6: each tab is mounted once and retained as a hidden/inert stable DOM view; polling never replaces the panel tree.
- Updated the connection/freshness indicator pointwise with LIDER status tint, 15 px primary text and 12 px secondary text; telemetry age cannot trigger structural rendering.
- Enforced the 12–25 px meaningful typography range and hardened two-finger double-tap reset so pinch/reset cannot open entity details or history.
- Kept Header and Bottom Tab Bar as permanent fixed shell nodes while short and long views scroll only inside the Work Viewport.
- Added an accessible label to the permanent Bottom Tab Bar without changing its geometry.

## v1.00_b057 / UI v0.7.21

- Fixed the mobile panel shell to the visual viewport with `position: fixed; inset: 0`, preventing short views and outer Home Assistant scrolling from moving the Bottom Tab Bar.
- Kept Header, work viewport and Bottom Tab Bar as three isolated grid rows; only the work viewport owns vertical scrolling.
- Reduced the mobile Overview product scene from 352 px to 320 px so the full quick-action row remains above the Bottom Tab Bar without shrinking buttons or typography.

## v1.00_b056 / UI v0.7.20

- Mounted the panel shell once: Header, zoom viewport and Bottom Tab Bar now remain permanent DOM nodes across Home Assistant polling updates.
- Replaced full `shadowRoot.innerHTML` redraws with in-place synchronization of changed text nodes, classes and attributes; telemetry age is excluded from the structural key.
- Structural content changes are deferred during native scrolling and momentum, while connection/freshness categories and live values update without recreating the shell or product image.

## v1.00_b055 / UI v0.7.19

- Fixed iPhone viewport overflow by making the panel host the single dynamic-viewport height owner and clearing the legacy `min-height: 100vh` constraint.
- At exactly 100%, the work canvas now uses `transform: none`; full panel re-renders are deferred until native iOS scrolling and momentum have stopped.
- Reduced the mobile Overview scene from 376 px to 352 px so the quick actions remain above the fixed Bottom Tab Bar without reducing Header, indicator or text sizes.

## v1.00_b052 / UI v0.7.17

- Implemented NIKAS Specialized Panel UI Standard v1.5: native vertical scrolling and fixed transform origin at 100%, scale-gated axis-clamped pan above 100%, UPS Header plaques and 28 px Bottom Tab icons.
- The permanent Header left action is always the Home Assistant menu; Cleaning Settings Back moved into the work area.
- Tab and detail transitions return the work area to the top while retaining a valid saved scale.

## v1.00_b043 / UI v0.7.10

## v1.00_b049 / UI v0.7.16

- State-aware photographic Overview Hero for docked, cleaning/return, dust collection, mop washing and mop drying.
- Overview status grid removed; resources are shown as a compact strip inside the Hero.
- Added stop-only public buttons for DP134/135/136 station operations.
- Added permanent `− / % / +` workspace zoom controls while preserving pinch/pan and fixed HA shell.


- Removed the duplicate blue **Локально** badge from the product scene; the standard connection badge in the Hero header remains the single connectivity indicator.
- Finalized the approved Overview composition without changing live Home Assistant state semantics, controls, local assets or navigation.

## v1.00_b038 / UI v0.7.5

- Installed the two approved product scenes from the accepted UI renders: cleaning and docked.
- The hero selects the scene from verified dock state: cleaning/away uses the cleaning scene; charging/charged/docked/station operation uses the dock scene.
- Product art is embedded as compact verified JPEG data URIs inside the standalone frontend bundle.
- Preserved the HA menu header, live composite state, verified process legend, controls, status cards, navigation and no-synthetic-data rules.

## v1.00_b038 / UI v0.7.5

- Replaced the schematic/fallback Overview artwork with two approved product scenes taken from the accepted UI renders: cleaning and docked.
- The hero selects the scene from verified robot/dock state: cleaning/away uses the cleaning scene; charging/charged/docked/station operation uses the dock scene.
- Product art is embedded as verified JPEG data URIs inside the standalone frontend bundle, removing WebP/Canvas decoding failure modes.
- Preserved the existing HA menu header, live composite state, verified process legend, controls, status cards, navigation and no-synthetic-data rules.

## v1.00_b037 / UI v0.7.4

- Replaced the broken embedded WebP payload with a verified PNG source for reliable Canvas decoding in Home Assistant iOS WebView.
- Rebalanced the hero art/legend split so all process labels remain readable on iPhone portrait.
- Preserved Canvas rendering, verified-only process overlays, controls, and the SVG emergency fallback.

## v1.00_b036 / UI v0.7.3

- Replaced product-art `<img>` delivery with Canvas rendering via `createImageBitmap()` from the verified WebP bytes already embedded in the standalone bundle.
- This bypasses Home Assistant/iOS WebView image-source restrictions affecting both `data:` and `blob:` URLs in `<img>`.
- Added a local SVG fallback so the Overview hero can no longer become visually blank if bitmap decoding is unavailable.
- Preserved the approved product illustration, live verified overlays, legend, controls, and verified-only state semantics.

## v1.00_b035 / UI v0.7.2

- Replaced static/data-URI Overview product-art delivery with a Blob URL built from verified WebP bytes embedded in the standalone frontend bundle.
- Product artwork no longer depends on HACS copying a secondary frontend asset or on `data:` image handling in the Home Assistant iOS WebView.
- Preserved the approved product illustration, live verified overlays, process legend, controls, and verified-only state semantics.

## v1.00_b031 / UI v0.6.8

## v1.00_b034 / UI v0.7.1

- Fixed Overview product-art delivery on iOS/Home Assistant WebView by replacing the embedded data URI with a bundled static WebP asset served by Home Assistant.
- Kept the approved product-art composition and all verified live process overlays unchanged.
- Added cache busting to the product-art asset URL.

## v1.00_b033 / UI v0.7.0

- Replaced the hand-drawn Overview robot/station SVG with the approved product-art composition from the target render.
- Kept verified Home Assistant state dynamic by overlaying live wash, dust, drying and dock/charge highlights on the product illustration.
- Refined hero metrics, quick actions and status cards with lighter product-style surfaces and softer depth.
- No synthetic tank percentages and no unverified station commands were added.

## v1.00_b032 / UI v0.6.9

- Increased contrast and opacity of the Overview OMNI process legend for reliable readability on the bright hero illustration.
- Preserved verified-only process highlighting and the existing robot/station composition.

- Rebalanced Overview hero to match the approved render composition: larger robot and station, less empty space, narrower legend, deeper product materials and larger glass-like tanks.
- Verified HA state remains the only source for process highlighting; no synthetic tank levels or unverified station writes were added.

## v1.00_b030 — UI v0.6.7

- Rebuilt the Overview robot/station scene as a premium product illustration: deeper OMNI body, glass-like tanks, larger detailed robot, stronger dock geometry and cleaner live process paths.
- Preserved verified-state-only behavior; no synthetic tank percentages or unverified station commands.

# Changelog

All notable project changes are recorded here.

## [Unreleased]

### Added

- `v1.00_b029` / dashboard `v0.6.6`: refine the Overview OMNI illustration toward the approved render with a larger robot, deeper station shell, three visibly tinted modules, stronger dock geometry and softer floor/shadow depth.
- `v1.00_b029` / dashboard `v0.6.6`: keep blue/gray/orange/green process paths tied only to verified Home Assistant state while inactive modules retain a subtle presentation tint rather than looking blank.
- `v1.00_b024` / dashboard `v0.6.1`: compact the Station root view for iPhone Pro Max: replace three tall status rows with a three-column **Робот / Заряд / Операция** summary, reduce Station hero height and tighten the OMNI operation list.
- `v1.00_b024` / dashboard `v0.6.1`: define the Station acceptance target as a typical operational state that does not require vertical scrolling while preserving the fixed Bottom Tab Bar, readable operation rows and the existing active-operation indicator.
- `v1.00_b023` / dashboard `v0.6.0`: replace the root-view Back button with the native Home Assistant **Menu** action (`hass-toggle-menu`); the **Настройки уборки** drill-down keeps an explicit Back button to its parent view.
- `v1.00_b023` / dashboard `v0.6.0`: rebalance the mobile typography scale so large headings are less dominant while labels, secondary text and Bottom Tab Bar captions are easier to read on iPhone Pro Max.
- `v1.00_b022` / dashboard `v0.5.9`: add a compact daily-use state vocabulary for mobile cards: **Зарядка**, **Уборка**, **Пауза**, **Возврат**, **Сбор пыли**, **Промывка** and other short user-facing labels while raw/diagnostic values remain unchanged.
- `v1.00_b022` / dashboard `v0.5.9`: make frequent actions state-aware: while cleaning, **Пауза** becomes the primary action and **Уборка** becomes a readable running-state tile instead of looking accidentally disabled.
- `v1.00_b022` / dashboard `v0.5.9`: enlarge the active OMNI station-operation indicator and add a subtle active-row highlight so station work is visible at a glance.
- `v1.00_b021` / dashboard `v0.5.8`: restructure the root **Уборка** tab into **Текущая уборка** + two separate read-only profile cards for **Всасывание** and **Подача воды** + one **Настроить уборку** drill-down entry.
- `v1.00_b021` / dashboard `v0.5.8`: keep volume and DND as secondary context on the settings entry instead of mixing all four profile values into one dense sentence.
- `v1.00_b020` / dashboard `v0.5.7`: restore the earlier balanced card proportions as the visual reference: more generous card height/padding, larger scene, larger KPI/status typography and darker action-icon surfaces.
- `v1.00_b019` / dashboard `v0.5.6`: simplify the root **Уборка** tab into a read-only current-cleaning screen; frequent Start/Pause/Home actions remain on **Обзор** instead of being duplicated on Cleaning.
- `v1.00_b019` / dashboard `v0.5.6`: rename the root cleaning section to **Текущая уборка** and keep factual time/area metrics there.
- `v1.00_b019` / dashboard `v0.5.6`: make **Как убирать** show the live current profile — suction, water, volume and DND — and keep the whole summary as the single drill-down entry to **Настройки уборки**.
- `v1.00_b017`: decouple the native panel and entity-platform lifecycle from robot reachability during Home Assistant startup. `/dashboard-s8-omni` and the integration entities are registered before the first local Tuya I/O attempt.
- `v1.00_b017`: document the offline-safe setup contract in `docs/LIFECYCLE.md` and add CI protection against reintroducing `async_config_entry_first_refresh()` as a setup gate.
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

- `v1.00_b024`: remove the oversized vertical whitespace from the Station summary card and shorten the overall Station screen so its primary information and operation states fit the mobile viewport more naturally.
- `v1.00_b023`: reduce the gap between display headings and small supporting copy by using a tighter 12–31 px mobile type scale instead of the previous 10/11–34+ px spread.
- `v1.00_b022`: reserve a dedicated safe text zone for station state in the Overview scene so station labels no longer overlap the OMNI illustration.
- `v1.00_b022`: prevent Russian state/value words from being split inside status and profile cards; use compact labels and safer typography instead.
- `v1.00_b022`: separate **Как убирать** information cards from the standalone **Настроить уборку** navigation card, fix the child-lock title/subtitle layout, and translate consumable `min` units to `мин` on the user-facing Service screen.
- `v1.00_b021`: the Cleaning profile summary no longer compresses suction, water, volume and DND into one primary text block; the two cleaning-critical parameters are visually independent while editing still exists only on the drill-down screen.
- `v1.00_b019`: the root Cleaning tab no longer duplicates the frequent device-action row from Overview.
- `v1.00_b017`: an offline robot at Home Assistant startup no longer prevents the config entry from loading or makes the S8 OMNI panel disappear from the sidebar. The first refresh is non-gating; failed local polling leaves the panel visible and entities unavailable/disconnected until recovery.
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

- Stop command is intentionally not implemented through `v1.00_b024`.
- Consumable/map reset writes are intentionally deferred pending verification.
- DND schedule, cleaning timers and raw map/control payloads are intentionally deferred pending verification.
- Station DP134/135/136 remain read-only until station write semantics are verified end-to-end.
