from __future__ import annotations

import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "custom_components" / "s8_omni" / "frontend" / "s8-omni-panel.js"


class PanelMobileAuditUiV0729Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.source = SOURCE.read_text(encoding="utf-8")
        cls.hero = cls.source.split("  _hero() {", 1)[1].split(
            "  _quickActions() {", 1
        )[0]
        cls.actions = cls.source.split("  _quickActions() {", 1)[1].split(
            "  _overview() {", 1
        )[0]

    def test_longest_entity_suffix_wins(self) -> None:
        self.assertIn(
            "const ENTITY_SUFFIXES_BY_LENGTH = [...ENTITY_SUFFIXES].sort((left, right) => right.length - left.length)",
            self.source,
        )
        self.assertIn("ENTITY_SUFFIXES_BY_LENGTH.find", self.source)
        self.assertNotIn("ENTITY_SUFFIXES.find", self.source)

    def test_station_operation_precedes_charging_kpi(self) -> None:
        dust = self.hero.index('stationLabel = "Сбор пыли"')
        wash = self.hero.index('stationLabel = "Промывка"')
        dry = self.hero.index('stationLabel = "Сушка"')
        charging = self.hero.index('stationLabel = "Заряжает"')
        self.assertLess(max(dust, wash, dry), charging)
        self.assertIn('stationLabel === "Заряжает" ? "Идёт зарядка"', self.hero)
        self.assertIn(': "Операция активна"', self.hero)

    def test_active_station_work_always_owns_action_row(self) -> None:
        self.assertIn("const stationActive = activeStationStops.length > 0", self.actions)
        station = self.actions.split("if (stationActive) {", 1)[1].split("if (attention)", 1)[0]
        self.assertIn('activeStationStops.includes("stop_roller_drying")', self.actions)
        self.assertIn("data-station-stop", self.actions)
        self.assertIn("verifiedStationStop", station)
        attention = self.actions.split("if (attention) {", 1)[1].split("if (cleaning)", 1)[0]
        self.assertNotIn('data-action="start"', attention)

    def test_overview_uses_four_separate_surfaces(self) -> None:
        self.assertIn('class="hero-primary"', self.hero)
        self.assertIn(".state-hero{grid-template-rows:auto auto auto;padding:0;background:transparent;border:0", self.source)
        self.assertIn(".state-hero>.hero-primary{grid-row:1", self.source)
        self.assertIn(".state-hero .resource-strip{grid-row:2", self.source)
        self.assertIn(".state-hero .hero-metrics{grid-row:3", self.source)

    def test_phone_geometry_and_indicator_are_stable(self) -> None:
        self.assertIn(".state-hero .state-scene{height:264px}", self.source)
        self.assertIn("grid-template-columns:minmax(0,1fr) minmax(168px,42%)", self.source)
        self.assertIn(".state-hero .connection-copy{display:grid;grid-template-rows:auto auto", self.source)
        self.assertIn(".state-hero .connection-copy strong,.state-hero .connection-copy small{display:block", self.source)

    def test_header_center_returns_to_parent(self) -> None:
        self.assertIn('data-header-home aria-label="Вернуться в исходную базовую панель NikaS"', self.source)
        self.assertIn("s8SafeReturnRoute(this._returnRoute)", self.source)
        self.assertIn('new Event("location-changed")', self.source)
        self.assertIn('this.shadowRoot.querySelector("[data-header-home]")', self.source)

    def test_zoom_and_manifest_match_current_contract(self) -> None:
        self.assertIn("const VIEW_SCALE_MIN = 0.75", self.source)
        self.assertIn("const VIEW_SCALE_MAX = 2.00", self.source)
        panel = json.loads((ROOT / "panel.json").read_text(encoding="utf-8"))["panel"]
        self.assertEqual([0.75, 2.0], panel["workspace_transform"]["scale_range"])
        self.assertEqual("source_aware_return", panel["navigation"]["header_center_action"])


if __name__ == "__main__":
    unittest.main()
