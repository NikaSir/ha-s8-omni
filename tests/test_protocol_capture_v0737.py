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

    def test_only_verified_pause_transport_remains_exposed(self) -> None:
        features = self.vacuum.split("_attr_supported_features", 1)[1].split("def __init__", 1)[0]
        pause = self.vacuum.split("    async def async_pause", 1)[1].split(
            "    async def async_return_to_base", 1
        )[0]
        self.assertIn("VacuumEntityFeature.PAUSE", features)
        self.assertNotIn("VacuumEntityFeature.START", features)
        self.assertNotIn("VacuumEntityFeature.RETURN_HOME", features)
        self.assertIn('operation="pause"', pause)

    def test_panel_disables_unverified_quick_actions(self) -> None:
        actions = self.frontend.split("  _quickActions() {", 1)[1].split("  _overview() {", 1)[0]
        self.assertNotIn('"start", available', actions)
        self.assertNotIn('"home", available', actions)
        self.assertNotIn("data-station-stop", actions)
        self.assertIn('"pause", available', actions)

    def test_manifest_declares_diagnostic_action_lockout(self) -> None:
        generated = self.panel["generated_ui"]
        ownership = self.panel["ownership"]
        self.assertEqual(generated["quick_actions"], ["vacuum.pause"])
        self.assertFalse(ownership["station_stop_commands_public"])
        self.assertFalse(ownership["station_stop_immediate"])
        self.assertFalse(ownership["start_and_return_exposed"])
        self.assertTrue(ownership["diagnostic_capture_read_only"])


if __name__ == "__main__":
    unittest.main()
