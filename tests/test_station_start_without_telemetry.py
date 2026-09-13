from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BUTTON = (ROOT / "custom_components/s8_omni/button.py").read_text(encoding="utf-8")
PANEL = (
    ROOT / "custom_components/s8_omni/frontend/s8-omni-panel.js"
).read_text(encoding="utf-8")


class StationStartWithoutTelemetryTests(unittest.TestCase):
    def test_backend_exposes_start_without_inactive_station_dp(self) -> None:
        self.assertIn("if self.desc.value:", BUTTON)
        self.assertIn(
            "return super().available and self.coordinator.data is not None",
            BUTTON,
        )
        self.assertIn(
            "_dp_bool_matches(self.coordinator.data.get(self.desc.dp), True)",
            BUTTON,
        )

    def test_frontend_does_not_require_operation_telemetry_for_start(self) -> None:
        operation = PANEL.split("  _operation(key, label, icon, snap) {", 1)[1].split(
            "  _station() {", 1
        )[0]
        self.assertIn("const telemetryUsable", operation)
        self.assertIn("const active = telemetryUsable", operation)
        self.assertIn("const commandUsable = snap.connected", operation)
        self.assertNotIn("const commandUsable = usable &&", operation)


if __name__ == "__main__":
    unittest.main()
