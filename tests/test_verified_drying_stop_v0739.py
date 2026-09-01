from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class VerifiedStationControlsV0740Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.button = (
            ROOT / "custom_components/s8_omni/button.py"
        ).read_text(encoding="utf-8")
        cls.frontend = (
            ROOT / "custom_components/s8_omni/frontend/s8-omni-panel.js"
        ).read_text(encoding="utf-8")

    def test_all_captured_station_transitions_are_exposed(self) -> None:
        for action in ("start", "stop"):
            for operation in ("dust_collection", "roller_cleaning", "roller_drying"):
                self.assertIn(f'"{action}_{operation}"', self.button)
        self.assertIn("self.desc.value", self.button)
        self.assertIn('not in {"charging", "charge_done"}', self.button)
        self.assertIn("async_wait_for_state", self.button)
        self.assertIn("Станция не подтвердила изменение операции", self.button)

    def test_overview_and_station_use_verified_commands(self) -> None:
        actions = self.frontend.split("  _quickActions() {", 1)[1].split(
            "  _overview() {", 1
        )[0]
        binding = self.frontend.split("  _bindStableContent(root) {", 1)[1].split(
            "  _patchStableDom() {", 1
        )[0]
        self.assertIn("activeStationStops.length === 1", actions)
        self.assertIn("Остановить текущую операцию станции?", binding)
        self.assertIn(
            'this._call("button", "press", button.dataset.stationStop)', binding
        )
        self.assertIn('button.dataset.stationCommand', binding)


if __name__ == "__main__":
    unittest.main()
