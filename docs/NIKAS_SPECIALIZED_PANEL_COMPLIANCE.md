# Specialized Panel Compliance Audit

**Audit target:** NikaS Specialized Panel UI Standard v1.4
**Audited main:** `e5e2c8d57efb81d2431421b4d4459a3cc3f214c9`
**Runtime inspected:** `custom_components/s8_omni/frontend/s8-omni-panel.js`
**Policy:** audit only; runtime is intentionally unchanged in this PR.

## Summary

S8 OMNI already implements one canvas, focal pinch, reset/snap, clamping, safe-area shell, MDI navigation and local assets. Its manifest explicitly records the superseded behaviour (`native_scroll: false`, `one_pointer_pan: true`), so the new 100% scroll model is a confirmed runtime and contract GAP.

## Compliance

| Requirement | Result | Evidence / required correction |
|---|---|---|
| One work viewport/canvas; shell outside it | PASS | `_workspace()` emits one `.work-viewport`/`.work-canvas`; grid rows keep Header and nav outside. |
| Pinch midpoint, 75–200%, 97–103% snap, two-finger reset/toast | PASS | `_bindWorkspaceGestures()`, `_resetTransform()`, scale constants. |
| Scale persisted per entry/view | PASS | `_transformStorageKey()` and localStorage. |
| 100% native vertical scroll; x/y zero; no one-finger pan | GAP | CSS has `.work-viewport{overflow:hidden;touch-action:none}` and absolute canvas; pointerdown always starts pan and pointermove prevents default. `panel.json` explicitly says `native_scroll:false`. |
| Pan only above 100% | GAP | Runtime and `panel.json one_pointer_pan:true` allow it at all scales. Gate pan on `scale > 1`. |
| Pan only on overflowing axes; edge/resize clamp | PASS (for transform mode) | `_clampTransform()` independently clamps x/y using actual scaled dimensions; resize and render re-clamp. |
| Tab change returns to top; invalid offsets reset | GAP | `_switchWorkspace()` restores stored transform, including x/y, for the destination view. Preserve scale if desired but reset scrollTop/origin and discard invalid offsets. |
| More-info protection | PASS | Second pointer and pan cancel holds; click guard exists; deliberate stationary hold remains. |
| Header menu/Refresh/safe area | PASS (root behaviour) | Root menu emits bubbling/composed `hass-toggle-menu`; Refresh is a card-background plaque and primary-coloured. |
| Permanent left rail is menu only | GAP | `_header()` replaces the menu with `mdi:arrow-left` for detail. Put parent navigation inside the work area and retain system menu in Header. `panel.json navigation.header_detail_back` codifies the contradiction. |
| UPS Header geometry | GAP | Runtime: 48px rails/buttons, 15px radius, no border, 28px icon, min 64px, title 22px. Required: 52 rails (48 narrow), 44×44 plaques, radius 16, 1px border, icon 25, 62/60 height, title 21/800; subtitle already 12 but weight 650 must move to ~560. |
| Bottom Bar fixed/full-width/safe-area/`ha-icon` | PASS | Full-width shell grid row, equal tabs, safe-area, MDI through `ha-icon`. |
| UPS Bottom Bar sizing/theme | GAP | Runtime uses icon 24, label 11 without 700, 56px tabs, 16px radius and 10% active background. Required: icon 28, label 12/700, radius 13–14, approximately 11% primary. |
| Local production assets/stable entry | PASS | Single `s8-omni-panel.js`, local JPG/WEBP assets and cache-busted registered URL. |
| HACS/HA integration path | PASS | README directs HACS custom Integration; `hacs.json`, manifest domain `s8_omni` and installation paths agree. |
| Approved source brand asset exists | GAP | No repository icon/logo source exists. Do not invent one; obtain/approve a square S8 OMNI source asset first. |
| Integration icon is actually wired | GAP | After approval, provide `icon.png` and `icon@2x.png` through the supported Home Assistant Brands custom-integration path for `s8_omni`; add dark variants if needed. |
| Repository visual identity | GAP | README has no hero/logo and no repo-owned social-preview asset. After source approval, add it to README and configure GitHub social preview/avatar. |

## Runtime/manifest contradictions to remove in the implementation PR

1. `workspace_transform.native_scroll: false` directly contradicts v1.4 native scrolling at 100%.
2. `workspace_transform.one_pointer_pan: true` lacks the mandatory `scale > 1` condition.
3. `navigation.header_detail_back` places Back in the permanent left rail; the rail must always remain the HA menu.
4. Stored destination-view x/y are restored on tab entry instead of returning to top.
5. Header and Bottom sizing fields/CSS encode pre-UPS dimensions.

## Required phone acceptance after runtime correction

Test Overview, Cleaning and long Diagnostics on iPhone: native vertical scroll at 100%; no sideways/top displacement; controls and holds do not become pans; only overflowing axes pan above 100%; release/resize clamps; root and detail retain HA menu; internal Back is in content; 44px Header plaques and 28px nav icons match UPS.
