# S8 OMNI native panel

The S8 OMNI integration owns and ships its canonical Home Assistant UI.

## Stable routes

- Panel: `/dashboard-s8-omni`
- Parent / Back from root views: `/dashboard-actions`

Dashboard version: `v0.5.3`.

The panel is registered through Home Assistant's custom-panel API. No Lovelace YAML, LocalTuya command, cloud request or direct Tuya DP write is required by the frontend.

## Home Assistant NikaS app shell

Primary viewport: **iPhone Pro Max, portrait**.

The panel follows **Home Assistant NikaS · Integration Dashboard UI Standard v1.2**:

1. **Header** — compact persistent application header with explicit Back on the left, geometrically centered title and one global Refresh action on the right.
2. **Content** — current system state or selected workflow.
3. **Bottom Tab Bar** — full-width, fixed Overview / Cleaning / Station / Maintenance / Diagnostics navigation with iOS Safe Area handling.

On the five root views:

- Header Back exits the S8 OMNI application to `/dashboard-actions`.
- Header Refresh requests an immediate local coordinator refresh through the public `button` entity owned by `ha-s8-omni`.
- Bottom Tab Bar switches root sections inside S8 OMNI.
- browser history is not used as the root Back contract.

The hero card does not repeat S8 OMNI as another large title. The Header identifies the application; the hero identifies **current state**.

## View responsibilities

### Overview

Overview answers: **what is happening now and is the system healthy?**

It owns:

- composite robot + station hero;
- robot/dock visual context;
- battery, local connection and telemetry age;
- Start / Pause / Home;
- compact **Робот** summary;
- compact **Станция** summary;
- explicit unknown/unavailable/error handling.

It intentionally does not duplicate cleaning time/area, suction/water configuration or the full station-operation list.

### Cleaning

Cleaning owns the active cleaning workflow:

- Start / Pause / Home;
- factual cleaning time and area;
- one entry point to **Настройки уборки**;
- reserved future Map / Rooms workflow.

It does not repeat the large composite system hero.

### Cleaning settings

Second-level screen, not a sixth root tab. It is the only editable cleaning-profile screen:

- suction;
- water;
- volume;
- Do Not Disturb.

On this child screen Header Back returns to root **Cleaning**. The full-width Bottom Tab Bar remains visible; choosing another root tab exits the child workflow and opens that section.

### Station

Station owns station-specific detail:

- normalized station status;
- dock presence when factually supported;
- battery;
- dust collection;
- roller/mop cleaning;
- drying;
- explicit missing/unknown station telemetry.

Station write controls remain absent until their semantics are verified and exposed as public integration entities/services.

### Maintenance

Maintenance owns factual consumable/service information:

- filter resource in minutes;
- side-brush resource in minutes;
- main-brush resource in minutes;
- fault state;
- child lock.

No invented percentages or unverified reset commands are shown.

### Diagnostics

Diagnostics contains technical state:

- local Tuya LAN connection health;
- availability and telemetry age;
- normalized composite/robot/station state;
- missing station DP list;
- raw DP5/DP4/DP1/DP2/DP28;
- raw DP134/135/136;
- integration/dashboard versions;
- production bundle mode.

## Production frontend bundle

Dashboard `v0.5.3` is the frontend hardening release.

Production runtime consists of exactly one integration-owned JavaScript entry point:

```text
Home Assistant
    ↓
/s8_omni/frontend/s8-omni-panel.js?v=v0.5.3
    ↓
<s8-omni-panel>
```

The registered bundle is **self-contained**. It does not import `s8-omni-panel-v2.js`, `v3.js`, or any other historical UI file at runtime.

Historical frontend implementations belong in Git history/tags/releases. They are not browser dependencies and are not required to be present in browser cache.

The stable production filename is `s8-omni-panel.js`; `DASHBOARD_VERSION` is appended as a query parameter for cache busting.

CI verifies:

- JavaScript syntax;
- the stable production bundle exists;
- `module_url` references the stable bundle;
- the production bundle contains no relative `import` statement;
- versioned historical panel files are not shipped in the active production frontend directory.

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

## State and safety contract

`ha-s8-omni` owns normalized robot, station and composite status semantics. The panel consumes those entities rather than reinterpreting Tuya data independently.

- Whole-device communication failure -> `unavailable`.
- Unknown/unrecognized DP5 -> normalized robot state `unknown`.
- Missing individual station DP -> that station entity is unavailable.
- No active station operation plus missing station DP -> station `unknown`, never idle by assumption.
- Multiple simultaneous station operations -> `multiple_operations`; no arbitrary priority hides another operation.

The frontend never writes Tuya DP directly, never calls LocalTuya, never calls Tuya cloud APIs and never exposes unverified station/map/reset controls.

## Long press

Entity-backed status, metric and control rows support long press to open native Home Assistant `more-info` where applicable.

Header, child-navigation and Bottom Tab Bar elements are navigation/global-panel controls only and do not invoke device-specific actions on hold or double tap.

## Current deferred capabilities

- station write controls;
- DND start/end time (DP33 payload);
- scheduled cleaning (DP32 payload);
- map and room payload parsing;
- manual direction control;
- consumable reset writes;
- direct raw Tuya DP actions from UI.
