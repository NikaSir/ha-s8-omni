from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class DiagnosticProtocolFixesV0734Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.constants = (ROOT / "custom_components/s8_omni/const.py").read_text(encoding="utf-8")
        cls.coordinator = (ROOT / "custom_components/s8_omni/coordinator.py").read_text(encoding="utf-8")
        cls.vacuum = (ROOT / "custom_components/s8_omni/vacuum.py").read_text(encoding="utf-8")
        cls.frontend = (ROOT / "custom_components/s8_omni/frontend/s8-omni-panel.js").read_text(encoding="utf-8")

    def test_real_device_middle_water_value_is_the_public_option(self) -> None:
        self.assertIn('WATER_OPTIONS = ["closed", "low", "middle", "high"]', self.constants)
        self.assertIn('middle: "Средний"', self.frontend)
        self.assertNotIn('normal: "Средний"', self.frontend)

    def test_paused_job_resumes_by_clearing_only_the_pause_latch(self) -> None:
        start = self.vacuum.split("    async def async_start", 1)[1].split(
            "    async def async_pause", 1
        )[0]
        paused_branch = start.split('if str(self.dp(DP_STATUS)) == "paused":', 1)[1].split(
            "        await self.coordinator.async_set_sequence(", 1
        )[0]
        self.assertIn("async_set_dp(DP_PAUSE, False)", paused_branch)
        self.assertIn("return", paused_branch)
        self.assertNotIn("DP_POWER_GO", paused_branch)
        self.assertNotIn("DP_MODE", paused_branch)

    def test_return_home_preserves_verified_pause_while_triggering_chargego(self) -> None:
        return_home = self.vacuum.split("    async def async_return_to_base", 1)[1].split(
            "    async def async_set_fan_speed", 1
        )[0]
        self.assertEqual(1, return_home.count("async_set_sequence_after_confirmation"))
        self.assertIn("[(DP_POWER_GO, False), (DP_PAUSE, True)]", return_home)
        self.assertIn("data.get(DP_PAUSE) is True", return_home)
        self.assertIn('(DP_MODE, "chargego")', return_home)
        self.assertIn("[(DP_POWER_GO, True)]", return_home)
        self.assertIn('str(data.get(DP_MODE)) == "chargego"', return_home)
        self.assertNotIn("(DP_PAUSE, False)", return_home)
        self.assertEqual(1, return_home.count("await self.coordinator.async_set_sequence("))

    def test_guarded_sequence_reads_before_sending_trigger_values(self) -> None:
        method = self.coordinator.split(
            "    async def async_set_sequence_after_confirmation", 1
        )[1]
        first_write = method.index("self._set_sync, *first")
        readback = method.index("self._read_sync")
        confirmation = method.index("if confirmation(data)")
        failure = method.index("raise HomeAssistantError")
        remaining_write = method.index("for dp, value in values")
        self.assertLess(first_write, readback)
        self.assertLess(readback, confirmation)
        self.assertLess(confirmation, failure)
        self.assertLess(failure, remaining_write)

    def test_missing_station_dps_are_not_presented_as_online_idle(self) -> None:
        hero = self.frontend.split("  _hero() {", 1)[1].split("  _quickActions() {", 1)[0]
        self.assertIn('snap.station === "unknown" ? "Нет данных" : "Ожидает"', hero)
        self.assertIn('snap.unreliable || snap.station === "unknown"', hero)
        self.assertIn('stationLabel === "Нет данных" ? "Состояние неизвестно"', hero)


if __name__ == "__main__":
    unittest.main()
