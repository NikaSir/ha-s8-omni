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

## LIDER central title plaque reference

The centered two-line Header title plaque uses the LIDER reference geometry and tone:

- `justify-self:center`; `min-width:min(290px,100%)`; `max-width:100%`; `min-height:44px`; `padding:5px 14px`;
- on narrow phones: `min-width:0; width:100%; padding-inline:8px`;
- `1px` border with primary-color mix `24%`; `16px` radius; primary-color background mix `5%`; `0 5px 16px rgba(23,45,76,.06)` shadow;
- pressed: background mix `13%`, border mix `42%`, `0 2px 7px rgba(23,45,76,.05)`; focus-visible: `2px` primary outline and `2px` offset.
- The focus state and pressed response are mandatory and remain visibly distinct from the default state.

A transparent/plain-text title, a white-only local variant, or an integration-specific color is not conforming.
