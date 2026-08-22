# S8 OMNI native panel

The S8 OMNI integration owns and ships its canonical Home Assistant UI.

## Stable routes

- Panel: `/dashboard-s8-omni`
- Parent / Back: `/dashboard-actions`

Dashboard version: `v0.4.3`.

The panel is registered through Home Assistant's custom-panel API. No Lovelace YAML, LocalTuya command, cloud request or direct Tuya DP write is required by the frontend.

## Home Assistant NikaS app shell

Primary viewport: **iPhone Pro Max, portrait**.

The panel follows the shared NikaS specialized-panel navigation model:

1. **Header** — compact persistent application header with explicit Back on the left, centered **S8 OMNI** title and one global **Refresh** action on the right.
2. **Content** — current robot/station state and the selected S8 OMNI workflow.
3. **Bottom Tab Bar** — full-width, fixed Overview / Cleaning / Station / Maintenance / Diagnostics navigation with iOS bottom Safe Area handling.

Header and bottom navigation have separate responsibilities:

- Header Back exits the S8 OMNI application to `/dashboard-actions`.
- Header Refresh requests an immediate local coordinator refresh through the public `button` entity owned by `ha-s8-omni`.
- Bottom Tab Bar switches sections inside S8 OMNI.

Back uses the explicit fixed parent route `/dashboard-actions`. It does **not** call `history.back()` and does not depend on how the panel was opened.

The Refresh action is not a robot/station command and does not write any Tuya control datapoint. It invokes the Home Assistant `button.press` service for the integration-owned **Обновить сейчас** entity.

The hero card does not repeat S8 OMNI as another large title. The Header identifies the application; the hero identifies **current state**. Integration/dashboard version remains available in Diagnostics and as compact Header secondary text.

## Canonical bottom Tab Bar geometry

Dashboard `v0.4.3` implements the NikaS reference navigation geometry:

- the Tab Bar spans the full useful viewport width;
- it is fixed to the bottom edge and remains visible during vertical scrolling;
- it is not rendered as a centered or floating card;
- the outer bar has no floating-card corner radius;
- iOS left/right/bottom Safe Area is included in the bar padding;
- the page reserves bottom clearance so the final card scrolls completely above navigation;
- active tab styling remains inside the shared bar and does not detach as a separate floating element;
- primary section navigation exists only in this bottom bar.

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

Composite robot + station status, robot/dock context, battery, connection/telemetry health, Start/Pause/Home, cleaning metrics and explicit unknown/unavailable/error handling.

### Cleaning

Start/Pause/Home, current state/mode context, verified suction/water segmented controls, volume, Do Not Disturb and reserved Map / Rooms area.

### Station

Normalized station status, dock presence when factually supported, battery, dust collection, roller cleaning, drying and a prominent live-operation banner.

### Maintenance

Filter, side-brush and main-brush remaining resource in minutes, fault state and child lock. No invented percentages or unverified reset commands.

### Diagnostics

Local Tuya LAN connection health, availability, telemetry age, normalized states, missing station DP list, raw DP5/DP4/DP1/DP2/DP28 and raw DP134/135/136 flags, plus integration/dashboard versions.

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

Machine-readable metadata is published in repository root `panel.json`, including panel route, parent route, Header refresh action, canonical full-width fixed bottom Tab Bar contract and reusable entity suffixes for `ha-contract-generated-ui`.

## Current deferred capabilities

- station write controls;
- DND start/end time (DP33 payload);
- scheduled cleaning (DP32 payload);
- map and room payload parsing;
- manual direction control;
- consumable reset writes;
- direct raw Tuya DP actions from UI.
