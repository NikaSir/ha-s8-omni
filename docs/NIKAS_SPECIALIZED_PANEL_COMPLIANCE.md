# NikaS specialized-panel compliance — S8 OMNI

**Audit date:** 2026-09-03  
**Standard:** NikaS Specialized Panel UI Standard v2.2 / Navigation Contract v1.2  
**Runtime:** `custom_components/s8_omni/frontend/s8-omni-panel.js` UI v0.7.41  
**Manifest:** integration `1.0.0b77`

| Area | Result | Evidence |
|---|---|---|
| Home Assistant host boundary | PASS | The shell is host-bound; no `100vh`, `100dvh` or viewport-fixed host remains. |
| Canonical shell rows | PASS | Header 60px, work viewport `minmax(0,1fr)`, Bottom Tab Bar 64px plus safe areas. |
| Edge-scroll containment | PASS | Shell v2.1 capture/non-passive touch boundary guard blocks chaining at short views and real top/bottom edges. |
| Internal scrolling | PASS | `data-work-viewport` remains the only native vertical scroller at 100% scale. |
| Bottom navigation | PASS | Five destinations, 52px controls, 26px icons and 12px/700 uncut labels. |
| Header return | PASS | Source-aware allowlist covers House v13, Rooms v11, Actions and Infrastructure; no `history.back()`. |
| Stable DOM and gestures | PASS | Existing point-patch updates, pinch/zoom and two-finger reset behavior remain intact. |
| Data truth and command safety | PASS | Entity-registry discovery, explicit unknown/unavailable states, confirmations and readback are preserved. |
| S8 command protocol | PASS | No device service, station-command or Tuya protocol implementation was changed. |
| Version coherence | PASS | Runtime, constants, manifest, panel metadata and profile agree on UI v0.7.41 / b077. |

## Field acceptance

After HACS update and Home Assistant restart, verify portrait/landscape phone, tablet and desktop. On the phone confirm: short views stay fixed, Diagnostics scrolls only inside the work area, top/bottom overscroll does not launch Home Assistant refresh, and all five navigation labels remain visible.
