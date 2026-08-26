from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = (
    ROOT
    / "custom_components"
    / "s8_omni"
    / "frontend"
    / "s8-omni-panel.js"
)


class PanelUiStandardV16UiV0722Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.source = SOURCE.read_text(encoding="utf-8")

    def test_scale_range_and_snap_match_v16(self) -> None:
        self.assertIn("const VIEW_SCALE_MIN = 0.75;", self.source)
        self.assertIn("const VIEW_SCALE_MAX = 2.00;", self.source)
        self.assertIn("const VIEW_SCALE_SNAP_MIN = 0.97;", self.source)
        self.assertIn("const VIEW_SCALE_SNAP_MAX = 1.03;", self.source)

    def test_two_finger_reset_has_ios_touch_fallback(self) -> None:
        self.assertIn("_registerTwoFingerTap(now", self.source)
        self.assertIn('addEventListener("touchstart"', self.source)
        self.assertIn('addEventListener("touchmove"', self.source)
        self.assertIn('addEventListener("touchend"', self.source)
        self.assertIn("this._touchTapHandledAt = now", self.source)
        self.assertIn('this._showScaleToast("Масштаб 100%")', self.source)

    def test_lider_indicator_surface_follows_primary_status(self) -> None:
        final = self.source.split(
            "/* v0.7.22: v1.6 LIDER indicator surface", 1
        )[1]
        self.assertIn(".connection-indicator.local{color:var(--success-color", final)
        self.assertIn("var(--success-color,#43a047) 11%", final)
        self.assertIn("var(--success-color,#43a047) 30%", final)
        self.assertIn("var(--error-color,#db4437) 10%", final)
        self.assertIn("var(--error-color,#db4437) 30%", final)
        self.assertIn(".connection-copy strong{font-size:16px", final)
        self.assertIn(".connection-copy small{font-size:13px", final)

    def test_final_type_scale_is_12_to_25_for_meaningful_copy(self) -> None:
        final = self.source.split(
            "/* v0.7.22: v1.6 LIDER indicator surface", 1
        )[1].split("@keyframes spin", 1)[0]
        self.assertIn(
            ".hero h1,.state-hero h1,.station-hero h2,.view-heading h2{font-size:25px}",
            final,
        )
        self.assertIn(".hero-metrics span,.hero-metrics small", final)
        self.assertIn(".resource-chip strong,.resource-chip small", final)
        self.assertIn("font-size:12px", final)

    def test_fixed_shell_and_single_work_viewport_remain(self) -> None:
        self.assertIn(
            ":host{position:fixed;inset:0;width:auto;height:auto;min-height:0;max-height:none}",
            self.source,
        )
        self.assertEqual(1, self.source.count('class="work-viewport ${mode}"'))
        self.assertEqual(1, self.source.count("shadowRoot.innerHTML"))


if __name__ == "__main__":
    unittest.main()
