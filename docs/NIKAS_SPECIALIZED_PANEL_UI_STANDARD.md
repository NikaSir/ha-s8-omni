# NikaS Specialized Panel UI Standard v1.3

**Status:** REQUIRED  
**Canonical source:** `NikaSir/ha-contract-generated-ui`  
**Canonical documents:** `docs/SPECIALIZED_PANEL_SHELL_STANDARD.md`, `docs/SPECIALIZED_PANEL_ZOOM_STANDARD.md`, `docs/INTEGRATION_DASHBOARD_UI_STANDARD.md`  
**Field reference:** Stark SolarPower mobile panel  
**Local role:** synchronized implementation snapshot; do not create repository-specific variants.

## Ownership boundary

This repository owns domain/integration UI. Shared standard owns safe areas, Header, Home Assistant menu behavior, peer-device selector placement, zoom viewport behavior and Bottom Tab Bar. **Do not refactor domain UI while adopting shell v1.3.**

## Header / safe area

- Safe area consumed exactly once; no device-specific offsets.
- Permanent left Header control is Home Assistant `☰` and MUST dispatch `hass-toggle-menu`.
- Never use Back, browser history, integration drawer or device action there.
- Parent/drill-down navigation belongs inside work area when required.
- Title is geometrically centered; at most one shell/global action on right.
- Header/menu/title/right action remain native scale below notch/Dynamic Island.

## Device Selector

For multiple peer physical devices: directly below Header, native scale, fixed order, no reorder on selection, selection survives Bottom Tabs, detailed content only for selected peer. Subordinate channels are not peer devices merely because selectable.

## Bottom Tab Bar

Primary 3–5 sections use one full-width fixed edge-attached safe-area-aware Bottom Tab Bar. Final work content clears it. Bar remains native scale.

## Zoom — Stark field baseline

- Exactly one zoomable work viewport per panel instance.
- Only work area scales; Header, Device Selector and Bottom Tab Bar stay native.
- Two-finger focal-point pinch; enlarged content pans/scrolls.
- Permanent `− / % / +` controls are not used.
- Pinch end at **97–103%** snaps to exactly **100%**.
- **Two-finger double tap** resets scale and work-area scroll to **100%**.
- Reset briefly shows `Масштаб 100%` at native scale.
- Scale persists locally per panel/client and preferably per peer device when applicable.
- Shell lifecycle is idempotent: never wrap an already zoomable area again.
- Repeated HA updates must not create nested wrappers, duplicate gesture handlers, blank wrapper space or progressive shrinkage.

## Stark-derived data / visual / delivery rules

- Normal measurements neutral; semantic colors only for confirmed health/warning/fault.
- `unknown`, `unavailable`, stale/source loss never healthy.
- Backend semantic entities/thresholds own factual meaning; do not invent unsupported derived values.
- Panel-critical artwork ships locally; no external CDN/Base64 production images; background art contains no live HA values; dynamic layers remain runtime UI; use cache busting.
- Prefer native more-info/history where appropriate.
- Avoid full rebuilds for unrelated HA churn while preserving one shell/viewport, selected peer, active tab and zoom.
- Production frontend uses one deterministic entry module and CI validation.

## Acceptance

Preserve existing domain behavior and field-check safe areas, `hass-toggle-menu`, centered Header, selector where applicable, fixed Bottom Tab Bar, focal-point pinch, 97–103% snap, two-finger reset + `Масштаб 100%`, persistence, exactly one viewport after repeated HA updates, explicit unavailable/stale states and unchanged domain safety.

> Canonical policy remains in `ha-contract-generated-ui`; canonical standard wins on conflict.