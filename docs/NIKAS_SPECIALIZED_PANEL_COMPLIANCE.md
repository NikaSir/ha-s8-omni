# Specialized Panel Compliance Audit

**Audit target:** NIKAS Specialized Panel UI Standard v1.6
**Runtime:** `custom_components/s8_omni/frontend/s8-omni-panel.js` v0.7.24
**Manifest:** integration `1.0.0b60`

## Compliance

| Requirement | Result | Evidence / blocker |
|---|---|---|
| One autonomous production bundle and one viewport/canvas | PASS | One `s8-omni-panel.js`, one `.work-viewport` and one `.work-canvas`; registration uses the single versioned module URL. |
| 75–200% focal pinch, 97–103 snap, two-finger reset toast, persistence | PASS | Midpoint pinch, scale constants, reset/toast and per-entry/view localStorage are implemented. |
| Native vertical scroll at 100%; x/y zero; no horizontal or one-finger transform pan | PASS | `is-native` uses `overflow-y:auto`, `overflow-x:hidden`, `touch-action:pan-y`; clamp returns x/y zero at scale <=1; at exactly 100% the canvas uses `transform:none`. |
| Stable iOS scroll, viewport ownership and live updates | PASS | On phones the host is fixed with `inset:0`; Header and Bottom Tab Bar are permanent shell nodes. Every view is mounted at most once, retained hidden/inert, and polling updates existing nodes without whole-tree replacement. |
| Pan only above 100% and only overflowing axes | PASS | Pan creation/move is gated by `scale > 1`; independent minX/minY clamp actual scaled overflow. |
| Clamp after gesture/render/resize | PASS | Clamp runs at completion, after render and on window/visualViewport resize. |
| Tab/detail transition returns to top, saved scale retained | PASS | `_switchWorkspace()` restores scale but resets x/y and native scroll top. |
| Hold/more-info and click guards | PASS | The second pointer immediately cancels holds and suppresses synthetic clicks; a guarded two-finger double tap resets scale, transform and native scroll without opening history or more-info. |
| Fixed UPS Header | PASS | 52/1fr/52 (48 narrow), 62/60 minimum plus safe area, matching 44×44 radius-16 bordered plaques, 25 px icons and v1.6 title/subtitle typography (23/14 wider, 21/13 phone). |
| Permanent left system menu; internal Back | PASS | Header always uses `mdi:menu` and composed/bubbling `hass-toggle-menu`; Cleaning Settings Back is now `.inline-back` inside content. |
| Pointwise two-level connection indicator | PASS | The opt-in shared indicator keeps a stable node; only semantic channel/freshness categories, lamp, text, classes and values change. LIDER status tint/border and 16/13 typography are applied. |
| Meaningful typography range | PASS | Runtime CSS declarations are constrained to 12–25 px; actions, navigation and essential telemetry never use annotation-sized text. |
| Fixed UPS Bottom Tab Bar | PASS | Outside viewport, safe-area aware, equal 52 px minimum tabs, MDI `ha-icon` 28 px, 12/700 labels and 11% active theme background. |
| Machine-readable contract and CI agree | PASS | `panel.json` and repository checks now require native-scroll-at-100, >100 pan gating, axis clamp, resize clamp and tab-top reset. |
| Local product art and stable delivery | PASS | One production module and local state-specific JPG/WEBP assets; no runtime historical imports. |
| Approved brand source exists | PASS | The selected S8 OMNI mark is preserved as the square alpha assets `brand/icon.png` and `brand/icon@2x.png`. |
| Integration icon packaged through supported brand path | PASS | Domain `s8_omni` ships 256 px `custom_components/s8_omni/brand/icon.png` and its 512 px `icon@2x.png` companion. The theme-neutral artwork needs no dark variant. |
| README/repository visual identity | PASS | README displays the packaged approved mark; the same square source is suitable for repository avatar/social-preview configuration. |
| iPhone field acceptance | GAP | Static and CI checks pass, but Companion App verification is still required after installation. |

## Required phone check

Test Overview, Cleaning Settings and long Diagnostics at 100% and above 100%. Confirm native scroll without flicker across several 5-second telemetry polls; verify both long and short tabs cannot move the Header or Bottom navigation, and that all three Overview quick actions remain fully visible above the Bottom Tab Bar.
