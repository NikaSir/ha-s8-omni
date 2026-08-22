# S8 OMNI native panel

The S8 OMNI integration owns and ships its canonical Home Assistant UI.

## Stable routes

- Panel: `/dashboard-s8-omni`
- Parent / Back: `/dashboard-actions`

Dashboard version: `v0.4.2`.

The panel is registered through Home Assistant's custom-panel API. No Lovelace YAML, LocalTuya command, cloud request or direct Tuya DP write is required by the frontend.

## Home Assistant NikaS app shell

Primary viewport: **iPhone Pro Max, portrait**.

The panel follows the shared NikaS specialized-panel navigation model:

1. **Header** — persistent application header with explicit Back on the left, centered **S8 OMNI** title and one global **Refresh** action on the right.
2. **Content** — current robot/station state and the selected S8 OMNI workflow.
3. **Bottom navigation** — fixed Overview / Cleaning / Station / Maintenance / Diagnostics navigation with iOS bottom safe-area handling.

Header and bottom navigation have separate responsibilities:

- Header Back exits the S8 OMNI application.
- Header Refresh requests an immediate local coordinator refresh through the public `button` entity owned by `ha-s8-omni`.
- Bottom navigation switches sections inside S8 OMNI.

Back uses the explicit fixed parent route `/dashboard-actions`. It does **not** call `history.back()` and does not depend on how the panel was opened.

The Refresh action is not a robot/station command and does not write any Tuya control datapoint. It invokes the Home Assistant `button.press` service for the integration-owned **Обновить сейчас** entity.

The hero card does not repeat S8 OMNI as another large title. The header identifies the application; the hero identifies **current state**. Integration/dashboard version remains available in Diagnostics and as compact header secondary text.

## Daily-use UX

The appliance UI remains mobile-first and device-specific:

- composite robot + station state;
- compact robot-to-dock visual scene;
- battery, local-connection and telemetry-age context;
- one-handed Start / Pause / Home actions;
- segmented suction and water controls using public Home Assistant select entities;
- stale Tuya `mode=chargego` is not shown as a current user action after the robot is already charging/charged;
- station live-operation emphasis during dust collection, cleaning or drying;
- raw DP/protocol detail stays out of daily screens.

## Views

### Overview

- composite robot + station status;
- visual robot/dock position context;
- robot status;
- station status;
- battery;
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
- inferred dock presence only when factually supported;
- battery;
- dust collection, roller cleaning and drying states;
- prominent live-operation banner while the station is active.

The panel does **not** create station write commands. Controls are added only after their write semantics are verified and exposed by `ha-s8-omni` as entities/services.

### Maintenance

- filter resource in minutes;
- edge/side brush resource in minutes;
- main/roller brush resource in minutes;
- fault state;
- child lock.

No percentage is derived because the integration does not yet have a verified maximum-lifetime contract. Consumable resets remain absent until DP18/20/22 writes are verified end-to-end.

### Diagnostics

- local Tuya LAN connection health;
- device availability;
- telemetry age;
- normalized composite, robot and station status;
- missing station DP list;
- DP5 raw status;
- DP4 mode;
- DP1 `power_go`;
- DP2 `pause`;
- DP28 fault;
- raw DP134/135/136 station flags;
- integration/dashboard versions and stable route.

Raw/technical values are confined to this view.

## State and safety contract

`ha-s8-omni` owns normalized robot, station and composite status semantics. The panel consumes those entities rather than reinterpreting Tuya data independently.

- Whole-device communication failure -> `unavailable`.
- Unknown/unrecognized DP5 -> normalized robot state `unknown`.
- Missing individual station DP -> that station entity is unavailable.
- No active station operation plus missing station DP -> station `unknown`, never idle by assumption.
- Multiple simultaneous station operations -> `multiple_operations`; no arbitrary priority hides another operation.

The frontend never writes Tuya DP directly, never calls LocalTuya, never calls Tuya cloud APIs and never exposes unverified station/map/reset controls.

## Long press

Entity-backed status, metric and control rows support long press to open native Home Assistant `more-info`.

Header and bottom-navigation elements are navigation/global-panel controls only and do not invoke device-specific actions on hold or double tap.

## Navigation metadata

Machine-readable metadata is published in repository root `panel.json`, including panel route, parent route, header refresh action, fixed bottom-navigation contract and reusable entity suffixes for `ha-contract-generated-ui`.

## Current deferred capabilities

- station write controls;
- DND start/end time (DP33 payload);
- scheduled cleaning (DP32 payload);
- map and room payload parsing;
- manual direction control;
- consumable reset writes;
- direct raw Tuya DP actions from UI.
