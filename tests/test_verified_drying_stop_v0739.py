from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class VerifiedDryingStopV0739Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.button = (
            ROOT / "custom_components/s8_omni/button.py"
        ).read_text(encoding="utf-8")
        cls.frontend = (
            ROOT / "custom_components/s8_omni/frontend/s8-omni-panel.js"
        ).read_text(encoding="utf-8")

    def test_only_drying_stop_writes_false(self) -> None:
        press = self.button.split(
            "    async def async_press(self) -> None:", 3
        )[3]
        verified = press.split("self.coordinator.trace_blocked_command", 1)[0]
        blocked = press.split("self.coordinator.trace_blocked_command", 1)[1]
        self.assertIn("if self.desc.dp == DP_ROLL_DRY", verified)
        self.assertIn("self.desc.dp,\n                False", verified)
        self.assertNotIn("DP_DUST", verified)
        self.assertNotIn("DP_ROLL_CLEAN", verified)
        self.assertIn("raise HomeAssistantError", blocked)

    def test_overview_enables_only_active_drying_stop(self) -> None:
        actions = self.frontend.split("  _quickActions() {", 1)[1].split(
            "  _overview() {", 1
        )[0]
        binding = self.frontend.split("  _bindStableContent(root) {", 1)[1].split(
            "  _patchStableDom() {", 1
        )[0]
        self.assertIn(
            'activeStationStops.includes("stop_roller_drying")', actions
        )
        self.assertNotIn(
            'activeStationStops.includes("stop_dust_collection")', actions
        )
        self.assertNotIn(
            'activeStationStops.includes("stop_roller_cleaning")', actions
        )
        self.assertIn("Остановить сушку швабры?", binding)
        self.assertIn(
            'this._call("button", "press", button.dataset.stationStop)', binding
        )


if __name__ == "__main__":
    unittest.main()
