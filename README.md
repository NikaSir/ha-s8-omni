# S8 OMNI for Home Assistant

Standalone Home Assistant custom integration for the **S8 OMNI** robot vacuum and OMNI station, built from verified Tuya LAN datapoints.

> Current development line: **v1.00_b046** (`1.0.0b46`). This is an early test build.

## Scope

- Local Tuya LAN communication, protocol 3.3 by default.
- Robot status, battery, cleaning metrics and consumable lifetimes.
- Start, pause and return-to-base commands using experimentally verified DP sequences.
- Suction, water level, volume, Do Not Disturb and child lock controls.
- Real OMNI station telemetry: dust collection, roller cleaning and roller drying.
- Normalized robot, station and reusable composite status semantics.
- Diagnostics including local connection health, telemetry age and raw Tuya context.
- Sanitized Home Assistant **Download diagnostics** support that redacts Host, Device ID and Local Key and excludes raw map/path/command payloads.
- Reconfigure flow for IP address, Device ID, Local Key and protocol version without removing the integration entry.
- Automatic integration reload when the polling interval is changed.
- Integration-owned native panel at **`/dashboard-s8-omni`**.
- Public **Обновить сейчас** button that requests an immediate coordinator refresh without writing a Tuya control DP.

## Native S8 OMNI panel

`ha-s8-omni` owns its full appliance UI instead of exposing a loose collection of Lovelace entities as the primary experience.

Dashboard **v0.7.13** follows **Home Assistant NikaS · Integration Dashboard UI Standard v1.2** and **NikaS Integration Panel Template v1.0**, with the primary acceptance viewport **iPhone Pro Max portrait**:

- symmetric Header: 52 px Menu/Back slot / centered title / 52 px Refresh, reduced to 48 px side slots on narrow mobile;
- root views use an icon-only **Menu** button that opens the native Home Assistant sidebar; the **Настройки уборки** drill-down uses an explicit Back arrow to return to its parent Cleaning view;
- Refresh calls the public Home Assistant `button` entity owned by `ha-s8-omni`; the frontend does not write Tuya DP directly;
- the mobile type scale is deliberately balanced: major display headings are reduced while supporting labels/captions are enlarged, targeting roughly **12–31 px** on iPhone-width layouts;
- **full-width fixed bottom Tab Bar** is the sole primary navigation between Overview, Cleaning, Station, Maintenance and Diagnostics;
- the bottom bar spans the useful viewport width, has no floating-card geometry and respects iOS Safe Area;
- page content reserves enough bottom clearance for the final card to scroll completely above the Tab Bar;
- Overview owns composite robot + station state, frequent Start/Pause/Home controls and compact Robot/Station summaries;
- daily-use cards use compact Russian state labels such as **Зарядка**, **Уборка**, **Пауза**, **Возврат**, **Сбор пыли** and **Промывка**; Diagnostics retains the underlying normalized/raw values;
- the Overview scene reserves a separate station-text safe zone so station state never overlaps the OMNI illustration;
- while cleaning, **Пауза** becomes the primary action and the **Уборка** tile shows the running state instead of appearing accidentally disabled;
- the root **Уборка** tab is deliberately read-only and starts with **Текущая уборка** time/area metrics;
- **Всасывание** and **Подача воды** are shown as two separate key profile cards;
- the standalone **Настроить уборку** card is visually separated from those information cards and shows secondary context for **Громкость** and **Не беспокоить**;
- Start/Pause/Home are not repeated on the root Cleaning tab; daily actions stay on Overview;
- editable suction, water, volume and DND controls live only one level lower and are not duplicated on the root Cleaning tab;
- drill-down Back returns to the Cleaning root view while the bottom Tab Bar remains available for switching root sections;
- Station view uses a compact three-column summary (**Робот / Заряд / Операция**) instead of three tall rows, keeps the three OMNI operation rows compact, and targets a typical iPhone Pro Max state without required vertical scrolling;
- Station view keeps independent dust collection / roller cleaning / drying state and uses a prominent active-operation indicator;
- Maintenance view keeps factual remaining resource and translates user-facing minute units to **мин**;
- Diagnostics keeps normalized and raw state context;
- loading keeps Header and Bottom Tab Bar visible rather than rendering a blank page;
- no duplicate large S8 OMNI title appears inside the hero card;
- Map / Rooms remains reserved until a stable public integration API exists.

### Availability and stale-data rule

The daily-use panel treats local connection state as part of current truth. A failed local poll must not leave the last Tuya snapshot looking current.

When local communication is disconnected or cannot be confirmed:

- Hero shows **Нет связи** / unconfirmed state instead of the previous robot status;
- Robot and Station summaries show **Нет данных** / unavailable semantics rather than `idle` or another cached state;
- battery, mode, dock position, station operations and current-session metrics are not presented as current values;
- Start / Pause / Home and editable controls are disabled;
- telemetry age remains visible so the last successful update can be diagnosed;
- raw/last-known context may still be inspected on the technical Diagnostics screen, but is not promoted as current operational state.

### Panel lifecycle when the robot is offline

Starting with `v1.00_b017`, the S8 OMNI application shell no longer depends on a successful first Tuya poll.

Setup order is intentionally:

```text
register panel → set up HA entities → attempt local refresh
```

not:

```text
first device refresh → register panel
```

Therefore, if the robot is powered off or unreachable while Home Assistant starts:

- the S8 OMNI config entry still loads;
- **Пылесос** remains present in the sidebar;
- `/dashboard-s8-omni` still opens;
- the local-connection entity reports disconnected;
- coordinator-backed data entities are unavailable rather than silently showing cached state as current;
- regular coordinator polling continues and the UI recovers automatically when the robot returns.

See [`docs/LIFECYCLE.md`](docs/LIFECYCLE.md).

### Production frontend bundle

The production panel is shipped as one self-contained JavaScript file:

`custom_components/s8_omni/frontend/s8-omni-panel.js`

Home Assistant registers only that file through `module_url`, using `?v=<dashboard version>` for cache busting. The production bundle does **not** import previous UI versions at runtime. Historical UI implementations belong in Git history/tags/releases, not in the browser dependency chain.

CI validates JavaScript syntax and rejects historical frontend imports or extra versioned production panel files.

User-facing screens avoid protocol/DP implementation wording; raw Tuya and integration-contract details remain in Diagnostics and documentation.

The frontend never writes Tuya DP directly, never calls LocalTuya and never uses Tuya cloud APIs. New commands appear only after `ha-s8-omni` exposes a verified Home Assistant entity/service.

See [`docs/PANEL.md`](docs/PANEL.md).

## Diagnostics export

Home Assistant's **Download diagnostics** action returns a deliberately sanitized snapshot for support and debugging.

Redacted or excluded:

- IP / Host;
- Device ID;
- Local Key;
- raw map/path/command/timer payloads;
- any secret value appearing in a coordinator exception message.

Included where available:

- integration/dashboard versions;
- non-secret connection settings such as protocol version and polling interval;
- coordinator health and last successful telemetry time;
- normalized robot/station/composite state;
- the known safe scalar datapoints used by the public integration entities.

## Important coexistence rule

Do **not** keep S8 OMNI active in LocalTuya while testing this integration. Two local Tuya clients can contend for the same device. The built-in cloud Tuya integration may remain enabled temporarily as a reference during acceptance testing.

## Installation

### HACS custom repository

1. Add this repository to HACS as a custom **Integration** repository.
2. Install **S8 OMNI**.
3. Restart Home Assistant.
4. Go to **Settings → Devices & services → Add integration → S8 OMNI**.
5. Enter the device IP address, Device ID, Local Key and protocol version (`3.3`).
6. Open **`/dashboard-s8-omni`** or use the **Пылесос** sidebar entry.

### Manual

Copy `custom_components/s8_omni` to `/config/custom_components/s8_omni`, restart Home Assistant and add the integration from the UI.

## Reconfiguring the local connection

Use the S8 OMNI integration entry's **Reconfigure** action to update the IP address, Local Key or protocol version. The integration tests the new values against the robot before saving them and reloads the entry after a successful update. The Device ID is treated as the identity of the existing entry and cannot be changed to a different robot.

The Local Key field uses a password-style input. Never paste Local Keys, cloud credentials or temporary access tokens into screenshots or public issues.

## Current limitations

- `Stop` is intentionally not exposed yet. The observed physical/API behavior is not sufficiently unambiguous for a safe standalone implementation.
- Map/brush/filter reset commands are not implemented yet because their write semantics have not been verified end-to-end.
- Station DP 134/135/136 are read-only in this build.
- DND schedule, cleaning timers, map operations and manual-direction control are not exposed until their payloads are verified.
- Unknown/unavailable device state is never silently treated as normal.

## Verified DP contract

See [`docs/PROTOCOL.md`](docs/PROTOCOL.md).

## Test plan

See [`docs/TESTING.md`](docs/TESTING.md).

## Security

Never commit Local Keys, cloud credentials, tokens, private Device IDs or diagnostic payloads containing secrets.

## License

MIT.
