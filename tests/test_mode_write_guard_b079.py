from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SELECT_SOURCE = (ROOT / "custom_components" / "s8_omni" / "select.py").read_text(encoding="utf-8")
VACUUM_SOURCE = (ROOT / "custom_components" / "s8_omni" / "vacuum.py").read_text(encoding="utf-8")


class ModeWriteGuardB079Tests(unittest.TestCase):
    def test_direct_mode_select_is_fail_closed(self) -> None:
        self.assertIn('if self.desc.key == "mode":', SELECT_SOURCE)
        self.assertIn('trace_blocked_command("direct_mode_select"', SELECT_SOURCE)
        self.assertIn("raise HomeAssistantError(reason)", SELECT_SOURCE)
        self.assertNotIn("await self.coordinator.async_set_dp(self.desc.dp, option)\n        await", SELECT_SOURCE)

    def test_verified_vacuum_actions_remain_canonical(self) -> None:
        self.assertIn('DP_MODE: "smart"', VACUUM_SOURCE)
        self.assertIn("DP_PAUSE: False", VACUUM_SOURCE)
        self.assertIn("DP_POWER_GO: True", VACUUM_SOURCE)
        self.assertIn("[(DP_POWER_GO, False), (DP_PAUSE, True)]", VACUUM_SOURCE)
        self.assertIn('DP_MODE,\n            "chargego"', VACUUM_SOURCE)


if __name__ == "__main__":
    unittest.main()
