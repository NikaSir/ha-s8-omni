from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BUTTON = (ROOT / "custom_components/s8_omni/button.py").read_text(encoding="utf-8")
INIT = (ROOT / "custom_components/s8_omni/__init__.py").read_text(encoding="utf-8")
BOOTSTRAP = (ROOT / "custom_components/s8_omni/frontend/s8-omni-panel-bootstrap.js").read_text(encoding="utf-8")


class StationStopB081Tests(unittest.TestCase):
    def test_button_module_accepts_first_unknown_state(self) -> None:
        self.assertIn('domain === "button"', BOOTSTRAP)
        self.assertIn('targetState !== "unavailable"', BOOTSTRAP)
        self.assertIn('s8-omni-panel-bootstrap.js', INIT)

    def test_station_readback_accepts_tuya_bool_or_integer(self) -> None:
        self.assertIn("def _dp_bool_matches", BUTTON)
        self.assertIn('actual in (0, 1, "0", "1")', BUTTON)
        self.assertIn("_dp_bool_matches(data.get(self.desc.dp), self.desc.value)", BUTTON)


if __name__ == "__main__":
    unittest.main()
