from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
VACUUM = ROOT / "custom_components" / "s8_omni" / "vacuum.py"


class ReturnViaPauseReleaseB084Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.source = VACUUM.read_text(encoding="utf-8")
        cls.return_block = cls.source.split("    async def async_return_to_base", 1)[1].split(
            "    async def async_set_fan_speed", 1
        )[0]

    def test_return_never_writes_power_go(self) -> None:
        self.assertNotIn("DP_POWER_GO,", self.return_block)

    def test_active_cleaning_uses_native_pause_only(self) -> None:
        self.assertIn("DP_PAUSE,\n                True", self.return_block)
        self.assertIn('str(data.get(DP_STATUS)) == "paused"', self.return_block)

    def test_chargego_is_released_by_unpausing(self) -> None:
        self.assertIn('(DP_MODE, "chargego")', self.return_block)
        self.assertIn("[(DP_PAUSE, False)]", self.return_block)
        self.assertIn('str(data.get(DP_MODE)) == "chargego"', self.return_block)

    def test_return_requires_device_readback(self) -> None:
        for state in ("goto_charge", "repositing", "charging", "charge_done"):
            self.assertIn(state, self.return_block)


if __name__ == "__main__":
    unittest.main()
