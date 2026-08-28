# NIKAS Specialized Panel UI Standard v1.7

**Status:** REQUIRED

**Canonical source:** `NikaSir/ha-contract-generated-ui/docs/NIKAS_SPECIALIZED_PANEL_UI_STANDARD.md`

**Primary acceptance viewport:** iPhone Pro Max, portrait

This repository follows the canonical v1.7 standard. The canonical document supersedes every earlier local shell, Header, zoom, scrolling and Bottom Tab Bar rule.

## S8 OMNI implementation profile

- Height-locked application shell: fixed Header, one work viewport/canvas and fixed Bottom Tab Bar.
- Only the work canvas scales; Header and navigation remain at native size.
- Native vertical scrolling at 100%; no horizontal movement and no transform panning at 100%.
- Focal two-finger pinch in the 75–200% range, 97–103% snap, two-finger double-tap reset and local persistence.
- Stable DOM mounted once; routine `hass` and freshness updates patch existing nodes without replacing the shell.
- Optional two-level local transport/freshness indicator uses the canonical LIDER typography, vocabulary and tinted surface.
- Header uses matching Menu/Refresh plaques and a visible two-line center button: `S8 OMNI` / `UI vX.Y.Z`.
- The title button captures its validated source route once. It accepts only `/dashboard-house`, `/dashboard-actions` and `/dashboard-infrastructure`, uses `sessionStorage["nikas.specialized.source_route.v1"]`, and falls back to `/dashboard-actions`.
- Parent navigation uses `history.pushState()` plus `location-changed`; `history.back()` is prohibited.
- Packaged integration brand assets and all state artwork remain local and versioned.
- Publication uses commits, branches and pull requests without GitHub Releases or automatic release tags.

## S8 OMNI domain invariants

The shell migration must not change verified device semantics. DP5 remains report-only. Station telemetry/actions remain DP134 dust collection, DP135 roller washing and DP136 roller drying. Active station operations own the action row and expose their verified Stop entities. Unknown, unavailable or stale data never appears healthy and device actions remain blocked without trusted local telemetry.

> Update this synchronized profile only together with the canonical v1.7 source and `docs/NIKAS_SPECIALIZED_PANEL_COMPLIANCE.md`.
