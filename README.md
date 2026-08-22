# S8 OMNI for Home Assistant

Standalone Home Assistant custom integration for the **S8 OMNI** robot vacuum and OMNI station, built from verified Tuya LAN datapoints.

> Current development line: **v1.00_b011** (`1.0.0b11`). This is an early test build.

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

Dashboard **v0.4.3** follows **Home Assistant NikaS · Integration Dashboard UI Standard v1.2** and is mobile-first for **iPhone Pro Max portrait**:

- persistent compact header with explicit **← Назад**, geometrically centered **S8 OMNI** title and **Обновить** action;
- Back explicitly navigates to **`/dashboard-actions`** and never uses browser-history back;
- Refresh calls the public Home Assistant `button` entity owned by `ha-s8-omni`; the frontend does not write Tuya DP directly;
- **full-width fixed bottom Tab Bar** is the sole primary navigation between Overview, Cleaning, Station, Maintenance and Diagnostics;
- the bottom bar spans the useful viewport width, has no floating-card geometry and respects iOS Safe Area;
- the active tab remains visually inside the shared Tab Bar rather than becoming a detached floating card;
- page content reserves enough bottom clearance for the final card to scroll completely above the Tab Bar;
- Overview with composite robot + station state, robot/dock visual context, battery, telemetry health and one-handed Start/Pause/Home controls;
- Cleaning controls with large segmented choices for suction and water, plus volume and DND;
- user-facing state semantics suppress the stale Tuya `chargego` mode after the robot is already charging/charged;
- Station view with independent dust collection / roller cleaning / drying state and a prominent live-operation banner;
- Maintenance view with factual remaining resource in minutes;
- Diagnostics with normalized and raw state context;
- no duplicate large S8 OMNI title inside the hero card; the hero starts from current state instead;
- reserved architecture for future Map / Rooms support.

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
