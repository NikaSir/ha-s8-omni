from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PANEL = (ROOT / "custom_components/s8_omni/frontend/s8-omni-panel.js").read_text(encoding="utf-8")


def test_refresh_action_is_black_at_rest():
    assert ".header-action.refresh{color:var(--primary-text-color)}" in PANEL

def test_hero_accent_uses_canonical_density():
    canonical = "background:color-mix(in srgb,var(--primary-color,#03a9d9) 12%,var(--card-background-color,#fff))"
    assert canonical in PANEL
    assert "background:color-mix(in srgb,var(--primary-color) 7%,transparent)" not in PANEL

