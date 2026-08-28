# Specialized Panel Compliance Audit

**Audit target:** NIKAS Specialized Panel UI Standard v1.9 and Navigation Contract v1.1

**Runtime:** `custom_components/s8_omni/frontend/s8-omni-panel.js` v0.7.31

**Manifest:** integration `1.0.0b66`

## Compliance

| Requirement | Result | Evidence / blocker |
|---|---|---|
| One autonomous bundle and one viewport/canvas | PASS | One versioned `s8-omni-panel.js`, one `.work-viewport` and one `.work-canvas`; no runtime imports. |
| Stable application shell | PASS | Header, viewport, canvas and Bottom Tab Bar mount once; telemetry uses point patches and cached hidden/inert views. |
| Height-locked phone shell and scroll isolation | PASS | Host owns the phone viewport; only the work viewport scrolls and `overscroll-behavior` blocks chaining. |
| 75–200% focal pinch and bounded enlarged pan | PASS | Midpoint pinch, factual per-axis bounds, resize/tab clamps and local persistence are implemented. |
| Native 100% behavior | PASS | Native vertical scroll, hidden horizontal overflow, identity transform and invariant x/y zero. |
| Snap/reset interaction safety | PASS | 97–103% snap and guarded two-finger double tap reset to 100%/origin without more-info activation. |
| Fixed Header geometry | PASS | Symmetric 52/48 px rails, matching 44×44 plaques, 25 px icons, 23/14 and 21/13 typography. |
| Source-aware center title return | PASS | Persistent semantic button has visible surface/focus/active states; it captures one validated source route using the common hand-off key and explicit HA navigation. |
| Fixed Bottom Tab Bar | PASS | Full-width edge-attached bar, 52 px minimum tabs, 28 px `ha-icon`, 12/700 labels and safe-area clearance. |
| Two-level connection indicator | PASS | Stable 16/13 px local transport/freshness subtree with semantic tint; polling does not remount it. |
| Typography envelope | PASS | Meaningful content remains within 12–25 px. |
| Trust semantics and command safety | PASS | Unknown/unavailable/stale data is non-normal; discovered entity targets are checked before service dispatch, duplicate in-flight calls are rejected and failures remain visible without optimistic success. |
| Packaged brand and local artwork | PASS | Shipped 256/512 px integration icons and versioned local state assets are validated in CI. |
| Verified station commands preserved | PASS | DP134/135/136 Stop buttons remain public integration entities; real-device washing and drying Stop were confirmed. |
| Automated v1.9 guards | PASS | Repository tests verify canonical source-route precedence/allowlist, timestamped one-shot hand-off, title plaque, stable DOM, zoom, Header, navigation, assets and versions. |
| Strict source hand-off | PASS | Route and timestamp are a required pair; invalid, expired and future timestamps are consumed and rejected before safe fallbacks. |
| Mandatory real-phone acceptance | GAP | The rebuilt version still requires Companion App verification after installation. |

## Required phone check

Open S8 OMNI separately from Дом, Действия and Инфраструктура and verify that the center title returns to the same source. Then test Overview, Cleaning Settings and long Diagnostics at 100% and above 100%; perform ten tab switches, scroll across several telemetry polls, pinch/reset, and confirm that Header/Bottom Tab Bar never move or flash. Recheck dust collection, roller washing and drying Stop actions on the physical station.
