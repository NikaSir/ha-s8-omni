from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "custom_components" / "s8_omni" / "frontend" / "s8-omni-panel.js"


class PanelStateTransitionGridUiV0728Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.source = SOURCE.read_text(encoding="utf-8")

    def test_state_hero_uses_one_explicit_grid_column(self) -> None:
        self.assertIn(
            ".state-hero{grid-template-rows:auto auto auto;padding:0;background:transparent;border:0;border-radius:0;box-shadow:none;overflow:visible;margin-bottom:10px}",
            self.source,
        )
        self.assertIn(
            ".state-hero>.hero-primary,.state-hero>.resource-strip,.state-hero>.hero-metrics{grid-column:1;justify-self:stretch;width:100%;min-width:0;max-width:100%}",
            self.source,
        )

    def test_non_idle_states_share_the_same_hero_geometry(self) -> None:
        hero_state = self.source.split("  _heroState(snap) {", 1)[1].split(
            "  _resourceStrip(snap) {", 1
        )[0]
        expected = {
            "charging": 'image: "charging", title: "Заряжается"',
            "cleaning": 'image: "cleaning", title: "Уборка"',
            "paused": 'image: "paused", title: "Пауза"',
            "returning": 'image: "returning", title: "Возврат"',
            "error": 'image: "error", title: "Требуется внимание"',
        }
        for state, marker in expected.items():
            with self.subTest(state=state):
                self.assertIn(marker, hero_state)

    def test_scene_resource_and_metrics_rows_stay_full_width(self) -> None:
        for marker in (
            ".state-hero>.hero-primary{grid-row:1;position:relative",
            ".state-hero .resource-strip{grid-row:2",
            ".state-hero .hero-metrics{grid-row:3",
        ):
            self.assertIn(marker, self.source)


if __name__ == "__main__":
    unittest.main()
