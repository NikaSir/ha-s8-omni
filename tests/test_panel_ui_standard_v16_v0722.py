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
            'view.removeAttribute("inert")',
            'view.setAttribute("inert", "")',
            "view.hidden = !active",
        ):
            self.assertIn(marker, self.source)

    def test_indicator_is_pointwise_and_lider_styled(self) -> None:
        self.assertIn("class=\"connection-indicator", self.source)
        self.assertIn(".connection-indicator.local{background:color-mix(in srgb,var(--success-color,#43a047) 11%,var(--card-background-color))", self.source)
        self.assertIn("border-color:color-mix(in srgb,var(--success-color,#43a047) 30%,var(--divider-color))", self.source)
        self.assertIn(".connection-copy strong{font-size:16px", self.source)
        self.assertIn(".connection-copy small{font-size:13px", self.source)
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
        self.assertIn("this._resetTransform(true)", gesture)
        self.assertIn("viewport.scrollTop = 0", self.source)

    def test_header_and_bottom_bar_remain_shell_siblings(self) -> None:
        self.assertIn('icon="mdi:menu"', self.source)
        self.assertIn('new CustomEvent("hass-toggle-menu"', self.source)
        self.assertIn("<header class=\"app-header\">", self.source)
        self.assertIn("<nav aria-label=\"Основные разделы\">", self.source)
        self.assertIn("grid-template-rows:auto minmax(0,1fr) auto", self.source)

    def test_overview_state_transition_keeps_explicit_geometry(self) -> None:
        self.assertIn(
            ".state-hero{display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto auto auto auto;align-content:start;width:100%;min-width:0}",
            self.source,
        )
        self.assertIn(
            ".state-hero>.hero-top,.state-hero>.state-scene,.state-hero>.resource-strip,.state-hero>.hero-metrics{grid-column:1;justify-self:stretch;width:100%;min-width:0;max-width:100%}",
            self.source,
        )
        self.assertIn(
            ".state-hero .hero-top{grid-row:1;grid-template-columns:minmax(0,1fr) minmax(168px,max-content)",
            self.source,
        )
        self.assertIn(
            ".state-hero .state-scene{grid-row:2;width:100%;min-width:0;contain:layout paint",
            self.source,
        )
        self.assertIn(
            ".state-hero .state-image{position:absolute;inset:0;width:100%;height:100%;max-width:none}",
            self.source,
        )
        self.assertIn(
            ".state-hero .resource-strip{grid-row:3}",
            self.source,
        )
        self.assertIn(
            ".state-hero .hero-metrics{grid-row:4;width:100%;min-width:0;gap:0;background:",
            self.source,
        )
        self.assertIn(
            ".state-hero .connection-indicator{min-width:168px;max-width:100%}",
            self.source,
        )

    def test_resource_strip_is_a_separate_hero_row(self) -> None:
        hero = self.source.split("  _hero() {", 1)[1].split("  _quickActions() {", 1)[0]
        self.assertIn(
            '</div>${this._resourceStrip(snap)}<div class="hero-metrics">',
            hero,
        )
        scene = hero.split('<div class="state-scene', 1)[1].split("</div>", 1)[0]
        self.assertNotIn("_resourceStrip", scene)
        self.assertIn(".resource-strip{position:relative", self.source)
        self.assertNotIn(".resource-strip{position:absolute", self.source)

    def test_overview_metrics_use_non_overlapping_grid(self) -> None:
        self.assertIn(
            ".state-hero .hero-metrics{grid-row:4;width:100%;min-width:0;gap:0;background:",
            self.source,
        )
        self.assertIn(
            ".state-hero .hero-metrics>div{position:relative;display:grid;grid-template-columns:28px minmax(0,1fr)",
            self.source,
        )
        self.assertIn(
            "padding:8px 8px 7px;background:transparent;border:0;border-radius:0;box-shadow:none;overflow:hidden",
            self.source,
        )
        self.assertIn(
            '.state-hero .hero-metrics>div:not(:last-child)::after{content:"";',
            self.source,
        )
        self.assertIn(
            ".state-hero .hero-metrics .metric-icon{position:static;grid-column:1;grid-row:1/span 2",
            self.source,
        )
        self.assertIn(
            ".state-hero .hero-metrics span{grid-column:2;grid-row:1;color:var(--primary-text-color);font-size:13px;font-weight:750;text-transform:none;letter-spacing:0",
            self.source,
        )
        self.assertIn(
            ".state-hero .hero-metrics .battery-bar{grid-column:1/-1;grid-row:4;margin:6px 0 0}",
            self.source,
        )


if __name__ == "__main__":
    unittest.main()
