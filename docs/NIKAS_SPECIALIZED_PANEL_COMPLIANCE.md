# Specialized Panel Compliance Audit

**Audit target:** NIKAS Specialized Panel UI Standard v1.5
**Runtime:** `custom_components/s8_omni/frontend/s8-omni-panel.js` v0.7.20
**Manifest:** integration `1.0.0b56`

## Compliance

| Requirement | Result | Evidence / blocker |
|---|---|---|
| One autonomous production bundle and one viewport/canvas | PASS | One `s8-omni-panel.js`, one `.work-viewport` and one `.work-canvas`; registration uses the single versioned module URL. |
| 75–200% focal pinch, 97–103 snap, two-finger reset toast, persistence | PASS | Midpoint pinch, scale constants, reset/toast and per-entry/view localStorage are implemented. |
| Native vertical scroll at 100%; x/y zero; no horizontal or one-finger transform pan | PASS | `is-native` uses `overflow-y:auto`, `overflow-x:hidden`, `touch-action:pan-y`; clamp returns x/y zero at scale <=1; at exactly 100% the canvas uses `transform:none`. |
| Stable iOS scroll, viewport ownership and live updates | PASS | The host alone owns `100dvh`; the shell mounts once. Home Assistant polling synchronizes only changed text/classes/attributes, and structural content changes are blocked during native scroll momentum. |
| Pan only above 100% and only overflowing axes | PASS | Pan creation/move is gated by `scale > 1`; independent minX/minY clamp actual scaled overflow. |
| Clamp after gesture/render/resize | PASS | Clamp runs at completion, after render and on window/visualViewport resize. |
| Tab/detail transition returns to top, saved scale retained | PASS | `_switchWorkspace()` restores scale but resets x/y and native scroll top. |
| Hold/more-info and click guards | PASS | Second pointer cancels holds; movement cancels pending holds; synthetic click guard remains. |
| Fixed UPS Header | PASS | 52/1fr/52 (48 narrow), 62/60 minimum plus safe area, matching 44×44 radius-16 bordered plaques, 25 px icons and 21/12 typography. |
| Permanent left system menu; internal Back | PASS | Header always uses `mdi:menu` and composed/bubbling `hass-toggle-menu`; Cleaning Settings Back is now `.inline-back` inside content. |
| Fixed UPS Bottom Tab Bar | PASS | Outside viewport, safe-area aware, equal 52 px minimum tabs, MDI `ha-icon` 28 px, 12/700 labels and 11% active theme background. |
| Machine-readable contract and CI agree | PASS | `panel.json` and repository checks now require native-scroll-at-100, >100 pan gating, axis clamp, resize clamp and tab-top reset. |
| Local product art and stable delivery | PASS | One production module and local state-specific JPG/WEBP assets; no runtime historical imports. |
| Approved brand source exists | PASS | The selected S8 OMNI mark is preserved as the square alpha assets `brand/icon.png` and `brand/icon@2x.png`. |
| Integration icon packaged through supported brand path | PASS | Domain `s8_omni` ships 256 px `custom_components/s8_omni/brand/icon.png` and its 512 px `icon@2x.png` companion. The theme-neutral artwork needs no dark variant. |
| README/repository visual identity | PASS | README displays the packaged approved mark; the same square source is suitable for repository avatar/social-preview configuration. |
| iPhone field acceptance | GAP | Static and CI checks pass, but Companion App verification is still required after installation. |

## Required phone check

Test Overview, Cleaning Settings and long Diagnostics at 100% and above 100%. Confirm native scroll without flicker or image disappearance across several 5-second telemetry polls, no horizontal/top displacement, stationary more-info, axis-limited pan, clamping after resize, permanent HA menu and fixed UPS-sized Header/Bottom navigation.


<!-- v1.6-adoption -->
## v1.6 adoption delta — 2026-08-26

This section is normative. Earlier PASS evidence in this file was collected against v1.5 and does not waive the new v1.6 checks.

- **Indicator policy:** **ENABLED by explicit request.** The primary line reports the real S8 channel (`Локально` in the current local path); the secondary line reports freshness. Device mode remains separate.
- **Indicator surface:** must use the LIDER treatment: primary status color for text/lamp, 8–12% tinted background and approximately 30% border, with 15px/12px typography.
- **Stable DOM:** live telemetry and freshness changes update only existing nodes; no whole-panel, image, viewport, Header or tab-bar redraw.
- **Fixed chrome GAP:** final CSS currently overrides Header and navigation to `position:relative`. This allows the outer Home Assistant/iOS scroll layer to move both menus, especially on short views. Runtime must restore a truly stationary Header/Bottom Bar and make Work Viewport the sole scroll owner.
- **Typography re-audit required:** meaningful text must be at least 12px and the common 9–25px scale must be enforced.
- **Phone acceptance required:** upward scroll during polling, short tabs, inertia, pinch reset without history/more-info, and all lower controls above Bottom Tab Bar.
