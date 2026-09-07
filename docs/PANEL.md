# S8 OMNI native panel

The S8 OMNI integration owns and ships its canonical Home Assistant UI.

## Stable routes

- Panel: `/dashboard-s8-omni`

Dashboard version: `v0.7.43`.

The panel is registered through Home Assistant's custom-panel API. No Lovelace YAML, LocalTuya command, cloud request or direct Tuya DP write is required by the frontend.

## Home Assistant NikaS app shell

Primary viewport: **iPhone Pro Max, portrait**.

The panel follows **NIKAS Specialized Panel UI Standard v2.2**, **Navigation Contract v1.2** and **NikaS Integration Panel Template v2.2**:

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

The two side slots remain symmetric, so `Пылесос` stays centered against the viewport rather than the free space between controls. Menu and Refresh remain at least 44×44 px touch targets and use matching plaques. The center title is also a visible semantic 52 px-high button with `Пылесос` and the exact `UI v0.7.43` second line. It captures the validated source base-panel route once and returns through explicit Home Assistant navigation.

On the five root views:

- Header Menu emits the native composed/bubbling `hass-toggle-menu` event.
- Header Refresh requests an immediate local coordinator refresh through the public `button` entity owned by `ha-s8-omni`.
- Bottom Tab Bar switches root sections inside S8 OMNI.
- the center title returns to the originating Дом, Действия or Инфраструктура base panel; any detail Back action remains inside the working area and never replaces the system Menu.

The hero card does not repeat S8 OMNI as another large title. The Header identifies the application; the hero identifies **current state**.

## iPhone fit contract

At the primary iPhone Pro Max portrait width, the panel must not depend on horizontal overflow or clipped labels.

Dashboard `v0.7.43` applies these mobile rules:

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
- explicit unknown/unavailable/error handling, including a visible warning for a confirmed active device fault.

It intentionally does not duplicate cleaning time/area, suction/water configuration or the full station-operation list.

### Cleaning

Cleaning owns:

- compact factual cleaning time and area, with an explicit not-running state when the robot is confirmed docked or idle;
- two full-width groups, **Сухая уборка** and **Влажная уборка**, each containing **Тихий / Макс / Польз.**;
- separate editors for the two user presets;
- the visible **Карта и комнаты** next-stage reminder.

It does not repeat the composite hero, transport actions or a generic **Настроить уборку** entry. Quiet/maximum preset meanings are unchanged: dry uses minimum/maximum suction with water closed; wet uses minimum suction/low water or maximum suction/high water.

### User-preset settings and application

**Настроить** on a user preset opens its suction/water editor. Saving stores that preset locally per integration entry and dry/wet kind; it never sends a command to the robot. Dry presets keep water closed, while wet presets require an enabled water level.

Selecting a preset is a separate application workflow: show the confirmation summary, write verified public Home Assistant entities, then read the requested values back. The selected preset highlight follows confirmed live suction/water values. Canceling an editor or application dialog does not issue a write.

The old `cleaning-settings` view remains as an internal compatibility path, with no entry from the current Cleaning screen. It is not the primary profile-editing workflow.

### Station

Station owns station-specific detail:

- normalized station status;
- dock presence when factually supported;
- battery;
- dust collection;
- roller/mop cleaning;
- drying;
- explicit missing/unknown station telemetry.

A single station hero contains station status plus robot/charge context; the same operation is not repeated in a second summary card.

Station exposes separate confirmed **Запустить / Остановить** controls for dust collection, mop washing and drying. Start is enabled only while the robot is factually docked. When one station operation is active, Overview also exposes the verified unified **Стоп** action; these immediate commands remain separate from cleaning-profile settings.

### Maintenance

Maintenance owns:

- one card with filter, side-brush and main-brush resource rows;
- one settings card grouping child lock, volume and Do Not Disturb;
- local service draft status and **Отменить / Применить** actions.

Resource percentages use the manufacturer lifetime counters. Remaining usage time is formatted without rounding away minutes: for example, `2419` minutes becomes **40 ч 19 мин**. This is usage time, not a calendar replacement estimate. No unverified reset command is shown.

Volume and DND changes stay in a local draft until Apply is confirmed, and each write requires entity-state readback. Cancel discards only the draft. Child lock is visually grouped in the same settings card, with its own confirmation that writes immediately and checks readback. It is not a draft field and does not wait for Apply. DND wording explains that its restrictions apply during the configured hours; the period itself is configured in the official application.

### Diagnostics

Diagnostics contains technical state:

- device fault detail, moved from Maintenance; **Ошибок нет** requires an explicit current zero without an error state, unknown data says **Нет данных**, stale data says **Данные устарели**, and a confirmed nonzero fault remains an error;
- local Tuya LAN connection health;
- availability and telemetry age;
- normalized composite/robot/station state;
- **Данные станции** summary; **Получены** requires an explicit complete station-data report, while missing or unconfirmed data stays explicit;
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

Home Assistant registers the stable `s8-omni-panel-bootstrap.js` module with dashboard and integration versions in its query string. The bootstrap imports:

- `s8-omni-panel.js` — self-contained core panel and fixed shell;
- `s8-omni-cleaning-presets.js` — current preset UI and application workflow;
- `s8-omni-service-settings.js` — service controls and selection bookkeeping;
- `s8-omni-preset-live-highlight.js` — point updates of the confirmed selected preset.

Each child import is also cache-busted with the integration version (`1.0.0b96`). This prevents a refreshed bootstrap from loading an older child module from browser cache.

The core panel does not import previous UI implementations. Historical frontend versions belong in Git history, not in the browser dependency chain.

CI verifies syntax for every shipped frontend module, regression behavior, version agreement and the NikaS core-panel contract.

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

- DND start/end time (DP33 payload);
- scheduled cleaning (DP32 payload);
- map and room payload parsing;
- manual direction control;
- consumable reset writes;
- direct raw Tuya DP actions from UI.
