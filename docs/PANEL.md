# S8 OMNI native panel

The S8 OMNI integration owns and ships its canonical Home Assistant UI.

## Stable route

`/dashboard-s8-omni`

The route is registered by the integration through Home Assistant's custom-panel API. No Lovelace YAML, LocalTuya command, cloud request or direct Tuya DP write is required by the panel.

Dashboard version: `v0.3.0`.

## UX target

Primary viewport: **iPhone Pro Max, portrait**.

The layout is mobile-first, has no intentional horizontal scrolling, uses large touch targets and keeps the primary robot/station state and frequent commands near the top. Desktop and iPad widen the content without changing the information hierarchy.

The visual model is deliberately appliance-specific rather than a generic Lovelace entity list. The Overview contains a compact robot-to-dock scene, factual battery/mode/telemetry indicators and one-handed Start/Pause/Home controls. Motion is state-driven and respects `prefers-reduced-motion`.

A sticky top application bar provides **Меню**, which fires Home Assistant's native `hass-toggle-menu` event. This opens the normal Home Assistant sidebar instead of navigating to a hard-coded dashboard path, so the panel remains compatible with the user's sidebar/menu organization.

## v0.3.0 daily-use polish

The v0.3.0 pass is based on live iPhone Pro Max review rather than desktop-only layout assumptions.

- suction and water use large segmented touch controls instead of compact browser selects;
- the stale Tuya `mode=chargego` value is not presented as «Возврат на базу» after the normalized robot state is already charging/charged; the raw mode remains factual in Diagnostics;
- user-facing screens avoid protocol terms such as DP numbers, `generic vacuum.state`, LocalTuya and frontend implementation notes;
- the Station view gains an explicit live-operation banner while dust collection, cleaning or drying is active;
- dashboard version shown in the UI is kept aligned with shipped panel metadata.

## Views

### Overview

- composite robot + station status;
- visual robot/dock position context;
- robot status;
- station status;
- battery with factual level indicator;
- local connection health;
- telemetry age;
- Start / Pause / Home;
- current cleaning time and area;
- suction and water summary;
- station operation states;
- explicit warning for unavailable/unknown/error.

### Cleaning

- Start / Pause / Home;
- current state/mode context;
- verified suction and water controls as large segmented buttons;
- volume;
- Do Not Disturb toggle;
- reserved Map / Rooms area.

Room/zone selection is intentionally not implemented until the integration exposes a stable public API carrying the required room/zone payload.

### Station

- normalized station status;
- inferred dock presence only when it is factually supported;
- battery;
- dust collection, roller cleaning and drying states;
- prominent live-operation banner when the station is active;
- state-driven station activity indicator.

The panel does **not** create station write commands. Controls will be added only after their write semantics are verified and exposed by `ha-s8-omni` as entities/services.

### Maintenance

- filter resource in minutes;
- edge/side brush resource in minutes;
- main/roller brush resource in minutes;
- fault state;
- child lock.

No percentage is derived because the integration does not yet have a verified maximum lifetime contract. Consumable reset buttons are deliberately absent until DP18/20/22 writes are verified end-to-end.

### Diagnostics

- local Tuya LAN connection health;
- device availability;
- telemetry age;
- normalized composite status;
- normalized robot and station status;
- missing station DP list;
- DP5 raw status;
- DP4 mode;
- DP1 `power_go`;
- DP2 `pause`;
- DP28 fault;
- raw DP134/135/136 station flags;
- integration/dashboard versions and stable route.

Raw/technical values are confined to this view.

## Composite status ownership

`ha-s8-omni` exposes normalized robot, station and composite status sensors. The panel consumes those entities rather than reinterpreting Tuya values independently.

The composite sensor also exposes factual attributes including raw status, normalized robot status, station status, active station operations, missing station datapoints, dock-presence inference, battery, mode, fault, DP1/DP2 command-state context and raw station flags.

### Station multi-operation rule

No arbitrary priority is invented when several station flags are active at once. The station state becomes `multiple_operations`, while `active_operations` lists all active operations. This prevents a drying flag, dust collection flag or cleaning flag from silently hiding another active operation.

### Unknown/unavailable rule

- Whole-device communication failure -> Home Assistant data entities become `unavailable`, while the diagnostic local-connection entity reports disconnected.
- Successful robot snapshot with unknown/unrecognized DP5 -> normalized robot state `unknown`.
- Missing individual station DP -> that DP entity is unavailable.
- No active station operation plus one or more missing station DPs -> station state `unknown`, **not** `idle`.

## Long press

Rows, metrics and status elements carrying a real Home Assistant entity support long press to open native `more-info`.

## Navigation contract

Machine-readable metadata is published in repository root `panel.json` for `ha-contract-generated-ui` and other consumers.

The generated central UI may show a compact vacuum status and frequent Start/Home actions, but detailed robot, station, maintenance and future map controls remain owned by this panel.

The panel's **Меню** button opens the Home Assistant navigation drawer. It is intentionally not a hard-coded link to `/dashboard-house`, `/dashboard-actions` or another central dashboard, because the Home Assistant sidebar is the navigation authority.

## Current deferred capabilities

The following remain intentionally absent until a verified integration API exists:

- station write controls;
- DND start/end time (DP33 payload);
- scheduled cleaning (DP32 payload);
- map and room payload parsing;
- manual direction control;
- consumable reset writes;
- direct raw Tuya DP actions from UI.
