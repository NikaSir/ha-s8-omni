from __future__ import annotations

import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class ProtocolCaptureV0737Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.coordinator = (ROOT / "custom_components/s8_omni/coordinator.py").read_text(encoding="utf-8")
        cls.diagnostics = (ROOT / "custom_components/s8_omni/diagnostics.py").read_text(encoding="utf-8")
        cls.buttons = (ROOT / "custom_components/s8_omni/button.py").read_text(encoding="utf-8")
        cls.vacuum = (ROOT / "custom_components/s8_omni/vacuum.py").read_text(encoding="utf-8")
        cls.frontend = (ROOT / "custom_components/s8_omni/frontend/s8-omni-panel.js").read_text(encoding="utf-8")
        cls.panel = json.loads((ROOT / "panel.json").read_text(encoding="utf-8"))

    def test_trace_is_bounded_and_contains_only_named_control_dps(self) -> None:
        self.assertIn("self.command_trace = deque(maxlen=240)", self.coordinator)
        for name in (
            "power_go",
            "pause",
            "mode",
            "status",
            "station_dust_collection",
            "station_roller_cleaning",
            "station_roller_drying",
        ):
            self.assertIn(f'"{name}"', self.coordinator)
        self.assertNotIn('TRACE_DP_NAMES = {CONF_', self.coordinator)

    def test_capture_is_read_only_and_serialized_with_normal_polling(self) -> None:
        capture = self.coordinator.split("    async def _async_diagnostic_capture", 1)[1].split(
            "    async def _async_update_data", 1
        )[0]
        update = self.coordinator.split("    async def _async_update_data", 1)[1].split(
            "    async def _async_accept_successful_data", 1
        )[0]
        self.assertIn("async with self._command_lock", capture)
        self.assertIn("self._read_sync", capture)
        self.assertNotIn("self._set_sync", capture)
        self.assertIn("async with self._command_lock", update)

    def test_capture_button_and_diagnostics_export_are_present(self) -> None:
        self.assertIn('"Записать команды штатного приложения"', self.buttons)
        self.assertIn("async_start_diagnostic_capture(90)", self.buttons)
        self.assertIn('result["protocol_trace"] = list(coordinator.command_trace)', self.diagnostics)
        self.assertIn('"diagnostic_capture_active": coordinator.diagnostic_capture_active', self.diagnostics)

    def test_verified_transport_uses_captured_protocol(self) -> None:
        features = self.vacuum.split("_attr_supported_features", 1)[1].split("def __init__", 1)[0]
        start = self.vacuum.split("    async def async_start", 1)[1].split(
            "    async def async_pause", 1
        )[0]
        return_home = self.vacuum.split("    async def async_return_to_base", 1)[1].split(
            "    async def async_set_fan_speed", 1
        )[0]
        transport = self.coordinator.split("    def _set_multiple_sync", 1)[1].split(
            "    def _read_sync", 1
        )[0]
        atomic = self.coordinator.split("    async def async_set_dps", 1)[1].split(
            "    async def async_set_sequence", 1
        )[0]
        pause = self.vacuum.split("    async def async_pause", 1)[1].split(
            "    async def async_return_to_base", 1
        )[0]
        self.assertIn("VacuumEntityFeature.START", features)
        self.assertIn("VacuumEntityFeature.PAUSE", features)
        self.assertIn("VacuumEntityFeature.RETURN_HOME", features)
        self.assertIn("async_set_dps", start)
        self.assertIn('DP_MODE: "smart"', start)
        self.assertIn("DP_PAUSE: False", start)
        self.assertIn("DP_POWER_GO: True", start)
        self.assertIn("set_multiple_values", transport)
        self.assertIn("self._set_multiple_sync", atomic)
        self.assertNotIn("async_set_sequence", start)
        self.assertIn('operation="pause"', pause)
        self.assertIn("async_set_sequence", return_home)
        self.assertIn("[(DP_POWER_GO, False), (DP_PAUSE, True)]", return_home)
        self.assertIn("async_set_dp", return_home)
        self.assertIn('"chargego"', return_home)
        self.assertIn("async_wait_for_state", return_home)

    def test_panel_exposes_verified_transport_and_drying_stop(self) -> None:
        actions = self.frontend.split("  _quickActions() {", 1)[1].split("  _overview() {", 1)[0]
        self.assertIn('"start", available', actions)
        self.assertIn('"home", available', actions)
        self.assertIn("data-station-stop", actions)
        self.assertIn("activeStationStops.length === 1", actions)
        self.assertIn('"pause", available', actions)

    def test_manifest_declares_verified_transport_and_station_lockout(self) -> None:
        generated = self.panel["generated_ui"]
        ownership = self.panel["ownership"]
        self.assertEqual(
            generated["quick_actions"],
            [
                "vacuum.start",
                "vacuum.pause",
                "vacuum.return_to_base",
                "button.stop_dust_collection",
                "button.stop_roller_cleaning",
                "button.stop_roller_drying",
            ],
        )
        self.assertTrue(ownership["station_start_commands_exposed"])
        self.assertTrue(ownership["station_stop_commands_public"])
        self.assertTrue(ownership["station_stop_immediate"])
        self.assertEqual(3, len(ownership["verified_station_start_commands"]))
        self.assertEqual(3, len(ownership["verified_station_stop_commands"]))
        self.assertTrue(ownership["station_stop_requires_confirmation"])
        self.assertTrue(ownership["start_and_return_exposed"])
        self.assertTrue(ownership["diagnostic_capture_read_only"])


if __name__ == "__main__":
    unittest.main()
