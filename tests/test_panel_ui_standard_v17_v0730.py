from __future__ import annotations

import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "custom_components" / "s8_omni" / "frontend" / "s8-omni-panel.js"


class PanelUiStandardV17V0730Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.source = SOURCE.read_text(encoding="utf-8")
        cls.panel = json.loads((ROOT / "panel.json").read_text(encoding="utf-8"))["panel"]

    def test_source_route_allowlist_and_precedence(self) -> None:
        self.assertIn('const SOURCE_ROUTE_KEY = "nikas.specialized.source_route.v1"', self.source)
        self.assertIn('const RETURN_ROUTE_KEY = "nikas.s8_omni.return_route.v1"', self.source)
        self.assertIn('const SAFE_DEFAULT_ROUTE = "/dashboard-actions"', self.source)
        self.assertIn('["/dashboard-house", "/dashboard-actions", "/dashboard-infrastructure"]', self.source)
        resolver = self.source.split("function s8ResolveReturnRoute", 1)[1].split(
            "function s8SameTreeShape", 1
        )[0]
        for marker in ('["return_to", "from"]', "handedOff", "saved", "document.referrer", "configured"):
            self.assertIn(marker, resolver)
        self.assertLess(resolver.index("explicit\n"), resolver.index("handedOff\n"))
        self.assertLess(resolver.index("handedOff\n"), resolver.index("saved\n"))
        self.assertNotIn("history.back", self.source)

    def test_route_is_captured_once_and_navigation_is_explicit(self) -> None:
        self.assertIn("this._returnRoute = null", self.source)
        self.assertIn("if (!this._returnRoute) this._returnRoute = s8ResolveReturnRoute(this)", self.source)
        self.assertIn("window.history.pushState(null, \"\", path)", self.source)
        self.assertIn('window.dispatchEvent(new Event("location-changed"))', self.source)

    def test_center_title_is_visible_semantic_plaque(self) -> None:
        self.assertIn('button class="header-title" type="button" data-header-home', self.source)
        self.assertIn(".header-title{width:100%;min-height:44px", self.source)
        self.assertIn("background:var(--card-background-color)", self.source)
        self.assertIn(".header-title:focus-visible{outline:3px", self.source)
        self.assertIn(".header-title:active{transform:translateY(1px)", self.source)
        self.assertIn("@media(max-width:520px){.header-title strong{font-size:21px}.header-title span{font-size:13px}", self.source)
        self.assertIn("<strong>S8 OMNI</strong><span>UI ${UI_VERSION}</span>", self.source)

    def test_manifest_declares_v17_contract(self) -> None:
        navigation = self.panel["navigation"]
        self.assertEqual("NIKAS Specialized Panel UI Standard v1.7", self.panel["standard"])
        self.assertEqual("NikaS Integration Panel Template v1.7", self.panel["template"])
        self.assertEqual("source_aware_return", navigation["header_center_action"])
        self.assertEqual("nikas.specialized.source_route.v1", navigation["header_source_route_key"])
        self.assertEqual(44, navigation["header_title_touch_height_px"])
        self.assertTrue(navigation["header_title_visible_surface"])
        self.assertTrue(navigation["header_title_focus_visible"])
        registration = (ROOT / "custom_components" / "s8_omni" / "__init__.py").read_text(encoding="utf-8")
        self.assertIn('"parent_route": PANEL_PARENT_PATH', registration)

    def test_verified_station_stop_contract_is_unchanged(self) -> None:
        for key in ("stop_dust_collection", "stop_roller_cleaning", "stop_roller_drying"):
            self.assertIn(key, self.source)
        self.assertIn('this._call("button", "press", key)', self.source)


if __name__ == "__main__":
    unittest.main()
