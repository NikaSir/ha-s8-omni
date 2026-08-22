# S8 OMNI for Home Assistant

Standalone Home Assistant custom integration for the **S8 OMNI** robot vacuum and OMNI station, built from verified Tuya LAN datapoints.

> Current development line: **v1.00_b004** (`1.0.0b4`).

## Native S8 OMNI panel

The integration now owns and ships its canonical UI at:

**`/dashboard-s8-omni`**

The panel is designed mobile-first for iPhone Pro Max portrait use and is intended to behave like a dedicated vacuum application inside Home Assistant rather than a generic entity list.

Current views:

- **Overview** — composite robot + station status, battery, Start/Pause/Home and current station activity;
- **Cleaning** — verified cleaning actions, suction, water, volume and DND;
- **Station** — independent OMNI station status and operation telemetry;
- **Maintenance** — brush/filter resource and fault information;
- **Diagnostics** — raw status, normalized status, station DP availability and telemetry age.

See [`docs/PANEL.md`](docs/PANEL.md). Machine-readable navigation metadata for `ha-contract-generated-ui` is published in [`panel.json`](panel.json).

## Scope

- Local Tuya LAN communication, protocol 3.3 by default.
- Robot status, battery, cleaning metrics and consumable lifetimes.
- Start, pause and return-to-base commands using verified DP sequences.
- Suction, four-state water control, volume, Do Not Disturb and child lock controls.
- Real OMNI station telemetry: dust collection, roller cleaning and roller drying.
- Normalized robot status, station status and reusable **composite status**.
- Explicit distinction between `unknown`, missing individual DP data and whole-device `unavailable`.
- Last successful local telemetry timestamp and telemetry age diagnostics.
- Reconfigure flow for IP address, Device ID, Local Key and protocol version without removing the integration entry.
- Automatic integration reload when the polling interval is changed.

## Important coexistence rule

Do **not** keep S8 OMNI active in LocalTuya while testing this integration. Two local Tuya clients can contend for the same device. The built-in cloud Tuya integration may remain enabled temporarily as a reference during acceptance testing.

## Installation

### HACS custom repository

1. Add this repository to HACS as a custom **Integration** repository.
2. Install **S8 OMNI**.
3. Restart Home Assistant.
4. Go to **Settings → Devices & services → Add integration → S8 OMNI**.
5. Enter the device IP address, Device ID, Local Key and protocol version (`3.3`).
6. Open **Пылесос** in the sidebar or navigate directly to `/dashboard-s8-omni`.

### Manual

Copy `custom_components/s8_omni` to `/config/custom_components/s8_omni`, restart Home Assistant and add the integration from the UI.

## Reconfiguring the local connection

Use the S8 OMNI integration entry's **Reconfigure** action to update the IP address, Local Key or protocol version. The integration tests the new values against the robot before saving them and reloads the entry after a successful update. The Device ID is treated as the identity of the existing entry and cannot be changed to a different robot.

The Local Key field uses a password-style input. Never paste Local Keys, cloud credentials or temporary access tokens into screenshots or public issues.

## UI ownership and safety

The native panel never writes Tuya DPs directly. All actions go through Home Assistant entities/services provided by `ha-s8-omni`.

Station write controls, room/zone payloads, maps, DND schedule payloads and consumable reset buttons are deliberately absent until the integration exposes verified public APIs for them.

## Current limitations

- `Stop` is intentionally not exposed yet because its physical/API semantics are not sufficiently unambiguous.
- Map/brush/filter reset commands are not implemented yet because their write semantics have not been verified end-to-end.
- Station DP 134/135/136 are read-only in this build.
- DND schedule, cleaning timers, map operations and manual-direction control are not exposed until their payloads are verified.
- No percentage is invented for consumable life when only verified remaining minutes are available.

## Verified DP contract

See [`docs/PROTOCOL.md`](docs/PROTOCOL.md).

## Test plan

See [`docs/TESTING.md`](docs/TESTING.md).

## Security

Never commit Local Keys, cloud credentials, tokens, private Device IDs or diagnostic payloads containing secrets.

## License

MIT.
