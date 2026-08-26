from __future__ import annotations

import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "custom_components" / "s8_omni" / "frontend" / "s8-omni-panel.js"


class PanelUiStandardV16V0722Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.source = SOURCE.read_text(encoding="utf-8")

    def test_views_are_mounted_once_and_retained(self) -> None:
        self.assertEqual(1, self.source.count("shadowRoot.innerHTML"))
        self.assertNotIn("replaceChildren", self.source)
        for marker in (
            "data-stable-view",
            "_boundStableViews = new WeakSet()",
            'activeView.removeAttribute("inert")',
            'view.setAttribute("inert", "")',
            "view.hidden = !active",
        ):
            self.assertIn(marker, self.source)

    def test_indicator_is_pointwise_and_lider_styled(self) -> None:
        self.assertIn("class=\"trust-banner connection-indicator", self.source)
        self.assertIn(".connection-indicator.local{background:color-mix(in srgb,var(--success-color,#43a047) 11%,var(--card-background-color))", self.source)
        self.assertIn("border-color:color-mix(in srgb,var(--success-color,#43a047) 30%,var(--divider-color))", self.source)
        self.assertIn(".connection-copy strong{font-size:15px", self.source)
        self.assertIn(".connection-copy small{font-size:12px", self.source)
        key = self.source.split("  _stableStructureKey() {", 1)[1].split("_bindStableContent", 1)[0]
        self.assertNotIn("telemetry_age", key)
        self.assertNotIn("this._hass.states", key)

    def test_meaningful_typography_is_12_to_25_px(self) -> None:
        sizes = [float(value) for value in re.findall(r"font-size:([0-9.]+)px", self.source)]
        self.assertTrue(sizes)
        self.assertGreaterEqual(min(sizes), 12)
        self.assertLessEqual(max(sizes), 25)

    def test_two_finger_reset_blocks_hold_and_synthetic_clicks(self) -> None:
        gesture = self.source.split("  _bindWorkspaceGestures() {", 1)[1].split("  _bind(root", 1)[0]
        self.assertIn("this._multiTapStartedAt = performance.now()", gesture)
        self.assertIn("this._cancelLongPresses()", gesture)
        self.assertIn("this._suppressClicksUntil = Date.now() + 480", gesture)
        self.assertIn("this._resetWorkspaceTransform(true)", gesture)
        self.assertIn("viewport.scrollTop = 0", self.source)

    def test_header_and_bottom_bar_remain_shell_siblings(self) -> None:
        self.assertIn('data-icon="mdi:menu"', self.source)
        self.assertIn('new CustomEvent("hass-toggle-menu"', self.source)
        self.assertIn("<header class=\"app-header\">", self.source)
        self.assertIn("<nav aria-label=\"Основные разделы\">", self.source)
        self.assertIn("grid-template-rows:auto minmax(0,1fr) auto", self.source)


if __name__ == "__main__":
    unittest.main()
