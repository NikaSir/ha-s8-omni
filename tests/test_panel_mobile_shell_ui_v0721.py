from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "custom_components" / "s8_omni" / "frontend" / "s8-omni-panel.js"

class PanelMobileShellUiV0741Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.source = SOURCE.read_text(encoding="utf-8")

    def test_shell_is_bound_to_home_assistant_host(self) -> None:
        self.assertIn(":host{display:block;position:relative;inline-size:100%;block-size:100%", self.source)
        self.assertNotIn("100vh", self.source)
        self.assertNotIn("100dvh", self.source)
        self.assertNotIn(":host{position:fixed;inset:0", self.source)

    def test_only_work_viewport_scrolls(self) -> None:
        self.assertIn("grid-template-rows:calc(60px + env(safe-area-inset-top,0px)) minmax(0,1fr) calc(64px + env(safe-area-inset-bottom,0px))", self.source)
        self.assertIn(".work-viewport.is-native{overflow-x:hidden;overflow-y:auto;", self.source)

    def test_boundary_guard_blocks_scroll_chaining(self) -> None:
        self.assertIn("shouldBlockNikasShellBoundaryMove", self.source)
        self.assertIn("createNikasShellScrollBoundaryGuard", self.source)
        self.assertIn('host.addEventListener("touchmove", moveTouch, { passive: false, capture: true })', self.source)
        self.assertIn("this._scrollBoundaryCleanup?.()", self.source)

    def test_bottom_navigation_geometry_and_labels(self) -> None:
        self.assertIn("nav button ha-icon{--mdc-icon-size:26px", self.source)
        self.assertIn('"Диагностика"', self.source)
        self.assertIn("line-height:14px", self.source)

    def test_stable_dom_contract_is_preserved(self) -> None:
        self.assertEqual(1, self.source.count("shadowRoot.innerHTML"))
        setter = self.source.split("set hass(value)", 1)[1].split("get hass()", 1)[0]
        self.assertIn("this._queueLivePatch()", setter)

if __name__ == "__main__":
    unittest.main()
