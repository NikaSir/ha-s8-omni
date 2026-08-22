# S8 OMNI native panel

The S8 OMNI integration owns and ships its canonical Home Assistant UI.

## Stable routes

- Panel: `/dashboard-s8-omni`
- Parent / Back from root views: `/dashboard-actions`

Dashboard version: `v0.5.0`.

The panel is registered through Home Assistant's custom-panel API. No Lovelace YAML, LocalTuya command, cloud request or direct Tuya DP write is required by the frontend.

## Home Assistant NikaS app shell

Primary viewport: **iPhone Pro Max, portrait**.

The panel follows **Home Assistant NikaS · Integration Dashboard UI Standard v1.2**:

1. **Header** — compact persistent application header with explicit Back on the left, geometrically centered title and one global Refresh action on the right.
2. **Content** — current robot/station state and the selected workflow.
3. **Bottom Tab Bar** — full-width, fixed Overview / Cleaning / Station / Maintenance / Diagnostics navigation with iOS Safe Area handling.

On the five root views:

- Header Back exits the S8 OMNI application to `/dashboard-actions`.
- Header Refresh requests an immediate local coordinator refresh through the public `button` entity owned by `ha-s8-omni`.
- Bottom Tab Bar switches root sections inside S8 OMNI.
- browser history is not used as the root Back contract.

The hero card does not repeat S8 OMNI as another large title. The Header identifies the application; the hero identifies **current state**.

## Root view versus drill-down rule

Dashboard `v0.5.0` introduces the first explicit second-level workflow: **Cleaning settings**.

The hierarchy is:

```text
S8 OMNI
├─ Overview
├─ Cleaning
│  └─ Cleaning settings
├─ Station
├─ Maintenance
└─ Diagnostics
```

The root **Cleaning** tab is operational. It contains:

- current composite/robot state;
- Start / Pause / Home;
- factual cleaning time and area;
- one entry point to Cleaning settings;
- the reserved future Map / Rooms workflow.

The root Cleaning tab does **not** duplicate editable suction, water, volume or DND controls.

The **Cleaning settings** drill-down contains the editable profile only:

- suction;
- water;
- volume;
- Do Not Disturb.

Overview **Настроить** and Cleaning **Настройки уборки** both open this same child screen. There is one canonical place to edit the cleaning profile.

On the child screen:

- Header title becomes **Настройки уборки**;
- Header Back returns to the root **Cleaning** view rather than exiting the S8 OMNI application;
- Refresh remains a global read-only panel action;
- Bottom Tab Bar remains visible and selecting any root tab closes the drill-down and opens that root section.

This establishes the reusable panel rule: **root tab = state/workflow; child screen = detailed configuration**. Configuration should not be copied back onto the root tab merely for convenience.

## Canonical bottom Tab Bar geometry

The Tab Bar:

- spans the full useful viewport width;
- is fixed to the bottom edge and remains visible during vertical scrolling;
- is not rendered as a centered or floating card;
- has no floating-card outer corner radius;
- includes iOS left/right/bottom Safe Area padding;
- leaves enough page-bottom clearance for the final card to scroll completely above navigation;
- keeps active-tab styling inside the shared bar;
- is the only primary root-section navigation.

## Daily-use UX

The appliance UI remains mobile-first and device-specific:

- composite robot + station state;
- compact robot-to-dock visual scene;
- battery, local-connection and telemetry-age context;
- one-handed Start / Pause / Home actions;
- cleaning profile controls through public Home Assistant entities on the dedicated child screen;
- stale Tuya `mode=chargego` is not shown as a current user action after the robot is already charging/charged;
- station live-operation emphasis during dust collection, cleaning or drying;
- raw DP/protocol detail stays out of daily screens.

## Views

### Overview

Composite robot + station status, robot/dock context, battery, connection/telemetry health, Start/Pause/Home, cleaning metrics and explicit unknown/unavailable/error handling. **Настроить** opens Cleaning settings directly.

### Cleaning

Operational cleaning screen: state, Start/Pause/Home, factual time/area, one **Настройки уборки** drill-down entry and reserved Map / Rooms workflow. Editable cleaning-profile controls are intentionally absent from this root tab.

### Cleaning settings

Second-level screen for suction, water, volume and DND. It is not a sixth root tab.

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

Machine-readable metadata is published in repository root `panel.json`, including panel route, parent route, Header refresh action, canonical full-width fixed bottom Tab Bar contract and the Cleaning settings drill-down contract.

## Current deferred capabilities

- station write controls;
- DND start/end time (DP33 payload);
- scheduled cleaning (DP32 payload);
- map and room payload parsing;
- manual direction control;
- consumable reset writes;
- direct raw Tuya DP actions from UI.
