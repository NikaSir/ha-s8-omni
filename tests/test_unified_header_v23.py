from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PANEL = (ROOT / "custom_components/s8_omni/frontend/s8-omni-panel.js").read_text(encoding="utf-8")


def test_refresh_action_is_black_at_rest():
    assert ".header-action.refresh{color:var(--primary-text-color)}" in PANEL
