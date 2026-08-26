# Specialized Panel Compliance Audit

**Audit target:** NIKAS Specialized Panel UI Standard v1.5
**Runtime:** `custom_components/s8_omni/frontend/s8-omni-panel.js` v0.7.17
**Manifest:** integration `1.0.0b52`

## Compliance

| Requirement | Result | Evidence / blocker |
|---|---|---|
| One autonomous production bundle and one viewport/canvas | PASS | One `s8-omni-panel.js`, one `.work-viewport` and one `.work-canvas`; registration uses the single versioned module URL. |
| 75–200% focal pinch, 97–103 snap, two-finger reset toast, persistence | PASS | Midpoint pinch, scale constants, reset/toast and per-entry/view localStorage are implemented. |
| Native vertical scroll at 100%; x/y zero; no horizontal or one-finger transform pan | PASS | `is-native` uses `overflow-y:auto`, `overflow-x:hidden`, `touch-action:pan-y`; clamp returns x/y zero at scale <=1; a single pointer uses native mode. |
| Pan only above 100% and only overflowing axes | PASS | Pan creation/move is gated by `scale > 1`; independent minX/minY clamp actual scaled overflow. |
| Clamp after gesture/render/resize | PASS | Clamp runs at completion, after render and on window/visualViewport resize. |
| Tab/detail transition returns to top, saved scale retained | PASS | `_switchWorkspace()` restores scale but resets x/y and native scroll top. |
| Hold/more-info and click guards | PASS | Second pointer cancels holds; movement cancels pending holds; synthetic click guard remains. |
| Fixed UPS Header | PASS | 52/1fr/52 (48 narrow), 62/60 minimum plus safe area, matching 44×44 radius-16 bordered plaques, 25 px icons and 21/12 typography. |
| Permanent left system menu; internal Back | PASS | Header always uses `mdi:menu` and composed/bubbling `hass-toggle-menu`; Cleaning Settings Back is now `.inline-back` inside content. |
| Fixed UPS Bottom Tab Bar | PASS | Outside viewport, safe-area aware, equal 52 px minimum tabs, MDI `ha-icon` 28 px, 12/700 labels and 11% active theme background. |
| Machine-readable contract and CI agree | PASS | `panel.json` and repository checks now require native-scroll-at-100, >100 pan gating, axis clamp, resize clamp and tab-top reset. |
| Local product art and stable delivery | PASS | One production module and local state-specific JPG/WEBP assets; no runtime historical imports. |
| Approved brand source exists | GAP | No approved S8 OMNI integration/repository brand mark is present. Do not derive one from product photography or invent artwork. |
| Integration icon visible through supported HA Brands path | GAP | After source approval, publish `icon.png` and `icon@2x.png` for domain `s8_omni` through Home Assistant Brands; add dark variants only if necessary. |
| README/GitHub repository identity | GAP | Text identity is consistent, but a visual hero/social preview waits for the approved source asset and repository-settings update. |
| iPhone field acceptance | GAP | Static and CI checks pass, but Companion App verification is still required after installation. |

## Required phone check

Test Overview, Cleaning Settings and long Diagnostics at 100% and above 100%. Confirm native scroll, no horizontal/top displacement, stationary more-info, axis-limited pan, clamping after resize, permanent HA menu and fixed UPS-sized Header/Bottom navigation.
