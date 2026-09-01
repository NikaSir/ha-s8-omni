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

    def test_captured_start_is_sent_as_one_atomic_request(self) -> None:
        start = self.vacuum.split("    async def async_start", 1)[1].split(
            "    async def async_pause", 1
        )[0]
        self.assertIn("async_set_dps", start)
        self.assertIn('DP_MODE: "smart"', start)
        self.assertIn("DP_PAUSE: False", start)
        self.assertIn("DP_POWER_GO: True", start)
        self.assertNotIn("async_set_sequence", start)

    def test_captured_return_pauses_active_cleaning_before_chargego(self) -> None:
        return_home = self.vacuum.split("    async def async_return_to_base", 1)[1].split(
            "    async def async_set_fan_speed", 1
        )[0]
        self.assertIn("async_set_dp", return_home)
        self.assertIn("DP_MODE", return_home)
        self.assertIn('"chargego"', return_home)
        self.assertIn("if actively_cleaning", return_home)
        self.assertIn("async_set_sequence", return_home)
        self.assertIn("[(DP_POWER_GO, False), (DP_PAUSE, True)]", return_home)
        self.assertIn('in {"standby", "paused"}', return_home)
        self.assertIn('in {"goto_charge", "repositing", "charging", "charge_done"}', return_home)
        self.assertIn("async_wait_for_state", return_home)

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
