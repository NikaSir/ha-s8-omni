# S8 OMNI native panel

The S8 OMNI integration owns and ships its canonical Home Assistant UI.

## Stable routes

- Panel: `/dashboard-s8-omni`

Dashboard version: `v0.7.36`.

The panel is registered through Home Assistant's custom-panel API. No Lovelace YAML, LocalTuya command, cloud request or direct Tuya DP write is required by the frontend.

## Home Assistant NikaS app shell

Primary viewport: **iPhone Pro Max, portrait**.

The panel follows **NIKAS Specialized Panel UI Standard v1.9**, **Navigation Contract v1.1** and **NikaS Integration Panel Template v1.9**:

1. **Header** — compact persistent application header with the Home Assistant system Menu on the left, geometrically centered title and one global Refresh action on the right.
2. **Content** — current system state or selected workflow.
3. **Bottom Tab Bar** — full-width, fixed Overview / Cleaning / Station / Maintenance / Diagnostics navigation with iOS Safe Area handling.

### Header geometry

Canonical layout:

```text
52 px | minmax(0, 1fr) | 52 px
```

On mobile widths up to 480 CSS px:

```text
48 px | minmax(0, 1fr) | 48 px
```

The two side slots remain symmetric, so `S8 OMNI` stays centered against the viewport rather than the free space between controls. Menu and Refresh remain at least 44×44 px touch targets and use matching plaques. The center title is also a visible semantic 44 px button with `S8 OMNI` and the exact version-only second line. It captures the validated source base-panel route once and returns through explicit Home Assistant navigation.

On the five root views:

- Header Menu emits the native composed/bubbling `hass-toggle-menu` event.
- Header Refresh requests an immediate local coordinator refresh through the public `button` entity owned by `ha-s8-omni`.
- Bottom Tab Bar switches root sections inside S8 OMNI.
- the center title returns to the originating Дом, Действия or Инфраструктура base panel; any detail Back action remains inside the working area and never replaces the system Menu.

The hero card does not repeat S8 OMNI as another large title. The Header identifies the application; the hero identifies **current state**.

## iPhone fit contract

At the primary iPhone Pro Max portrait width, the panel must not depend on horizontal overflow or clipped labels.

Dashboard `v0.7.36` applies these mobile rules:

- Header side controls reduce from 52 px to 48 px while preserving symmetric geometry;
- the three frequent actions remain **three equal columns**;
- each mobile action uses a vertical composition: icon above, primary label, short secondary label;
- the actions no longer allocate a wider first column, so `Уборка / Пауза / Домой` follow the same geometry;
- Hero, status cards, metrics and diagnostics use `minmax(0, 1fr)` and explicit overflow/wrapping protection;
- Bottom Tab Bar keeps five equal columns, short labels and iOS Safe Area padding;
- final content retains enough bottom clearance to scroll entirely above the fixed Tab Bar.

At very narrow widths the text size is reduced, but primary navigation and command touch targets are not shrunk below the project minimum.

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

All four values share one local draft. **Применить** first shows the complete change summary, then writes only confirmed public Home Assistant entities and verifies each new value by reading entity state back. Polling updates may refresh factual telemetry but cannot overwrite an unsaved draft value.

On this child screen an inline Back control inside the working area returns to root **Cleaning**; the Header keeps the system Menu. The full-width Bottom Tab Bar remains visible; choosing another root tab exits the child workflow and opens that section.

### Station

Station owns station-specific detail:

- normalized station status;
- dock presence when factually supported;
- battery;
- dust collection;
- roller/mop cleaning;
- drying;
- explicit missing/unknown station telemetry.

Station start controls remain absent. When dust collection, mop washing or drying is already active, Overview exposes the verified public unified **Стоп** action as an immediate emergency control; it is not mixed with profile settings or presented as an operation-start toggle.

### Maintenance

Maintenance owns factual consumable/service information:

- filter resource in minutes;
- side-brush resource in minutes;
- main-brush resource in minutes;
- fault state;
- child lock.

Derived percentages identify the same manufacturer lifetime counters while exact remaining minutes remain visible. No unverified reset command is shown.

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

## Current truth versus last-known data

A Home Assistant state object may still contain the last successfully reported DP values after the next Tuya LAN poll has failed. Those cached values are useful for diagnostics but are **not current operational truth**.

Dashboard `v0.5.4` therefore combines the public `local_connection` state with vacuum availability:

- `local_connection = on` and the vacuum entity is available -> current operational state may be shown;
- `local_connection = off` -> the system is treated as **disconnected**, regardless of the last cached robot/station values;
- missing/unknown connection truth -> current robot/station values are treated as unconfirmed.

While disconnected or unconfirmed:

- Hero does not show the last robot state as current;
- robot/station state, battery, mode, dock position and station operations become `Нет данных` / unknown in daily-use screens;
- Start / Pause / Home are disabled;
- cleaning settings and other device writes are disabled;
- station and maintenance operational values are not presented as fresh;
- telemetry age remains visible and continues to identify how old the last successful snapshot is;
- raw technical values may remain visible in Diagnostics specifically as diagnostic context.

This enforces the project rule: **unknown / unavailable / stale ≠ normal**.

## Loading shell

During panel/entity-registry loading, the shell remains visible:

```text
Header
↓
Loading state
↓
Bottom Tab Bar
```

A blank white screen is not an accepted loading state.

## Production frontend bundle

Dashboard `v0.5.3` introduced frontend bundling hardening; `v0.5.4` preserves it.

Production runtime consists of exactly one integration-owned JavaScript entry point:

```text
Home Assistant
    ↓
/s8_omni/frontend/s8-omni-panel.js?v=v0.5.4
    ↓
<s8-omni-panel>
```

The registered bundle is **self-contained**. It does not import historical UI files at runtime.

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

`ha-s8-omni` owns normalized robot, station and composite status semantics. The panel consumes those entities rather than writing or decoding Tuya control payloads independently.

- Whole-device communication failure -> unavailable/disconnected UI, never the previous DP snapshot as current.
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
