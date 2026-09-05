from __future__ import annotations

import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "custom_components" / "s8_omni" / "frontend" / "s8-omni-panel.js"
BOOTSTRAP = ROOT / "custom_components" / "s8_omni" / "frontend" / "s8-omni-panel-bootstrap.js"
PRESETS = ROOT / "custom_components" / "s8_omni" / "frontend" / "s8-omni-cleaning-presets.js"


class PanelCurrentRulesUiV0733Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.source = SOURCE.read_text(encoding="utf-8")
        cls.bootstrap = BOOTSTRAP.read_text(encoding="utf-8")
        cls.presets = PRESETS.read_text(encoding="utf-8")
        cls.bind = cls.source.split("  _bindStableContent(root) {", 1)[1].split(
            "  _patchStableDom() {", 1
        )[0]
        cls.settings = cls.source.split("  _cleaningSettings() {", 1)[1].split(
            "  _operation(", 1
        )[0]

    def test_all_cleaning_writes_share_one_draft_and_apply(self) -> None:
        self.assertIn('["suction", "water", "volume", "do_not_disturb"]', self.source)
        self.assertIn('this._setCleaningDraft("volume", Number(volume.value))', self.bind)
        self.assertIn('key === "do_not_disturb"', self.bind)
        self.assertIn("Изменения готовы", self.settings)
        self.assertEqual(1, self.settings.count("data-apply-cleaning"))
        self.assertNotIn('this._call("number", "set_value", "volume"', self.bind)

    def test_apply_requires_confirmation_and_device_readback(self) -> None:
        self.assertIn("Применить параметры уборки?", self.bind)
        self.assertIn("window.confirm", self.bind)
        self.assertIn("_waitForReadback", self.source)
        self.assertIn("COMMAND_READBACK_TIMEOUT_MS", self.source)
        self.assertIn("устройство не подтвердило новое значение", self.source)
        for domain in ("select", "number", "switch"):
            self.assertIn(f'await this._callConfirmed("{domain}"', self.bind)

    def test_verified_transport_and_station_controls_are_bound(self) -> None:
        self.assertIn('action === "start" ? "start"', self.bind)
        self.assertIn('action === "pause" ? "pause"', self.bind)
        self.assertIn('action === "home" ? "return_to_base"', self.bind)
        self.assertIn('action === "start" ? "Запустить уборку?"', self.bind)
        self.assertIn('action === "home" ? "Отправить пылесос на базу?"', self.bind)
        self.assertIn('button.matches("[data-station-stop]")', self.bind)
        self.assertIn('this._call("button", "press", button.dataset.stationStop)', self.bind)
        self.assertIn("Остановить текущую операцию станции?", self.bind)
        self.assertIn('button.matches("[data-station-command]")', self.bind)

    def test_button_unknown_state_is_callable_before_first_press(self) -> None:
        self.assertIn('domain === "button"', self.bootstrap)
        self.assertIn('targetState !== "unavailable"', self.bootstrap)
        self.assertIn('!["unknown", "unavailable"].includes(targetState)', self.bootstrap)

    def test_child_lock_is_confirmed_and_read_back(self) -> None:
        self.assertIn("блокировку от детей?", self.bind)
        self.assertIn('await this._callConfirmed("switch"', self.bind)

    def test_shell_owns_viewport_and_hero_is_first_paint_priority(self) -> None:
        self.assertIn("createNikasShellScrollBoundaryGuard", self.source)
        self.assertIn("block-size:100%", self.source)
        self.assertNotIn("100dvh", self.source)
        self.assertIn('loading="eager" decoding="sync" fetchpriority="high"', self.source)

    def test_approved_cleaning_presets_are_separate_from_cleaning_type(self) -> None:
        self.assertIn('data-more="mode"', self.presets)
        self.assertIn('Тип уборки', self.presets)
        self.assertIn('"dry-quiet"', self.presets)
        self.assertIn('suction: "gentle"', self.presets)
        self.assertIn('water: "closed"', self.presets)
        self.assertIn('"dry-max"', self.presets)
        self.assertIn('suction: "strong"', self.presets)
        self.assertIn('"wet-quiet"', self.presets)
        self.assertIn('water: "low"', self.presets)
        self.assertIn('"wet-max"', self.presets)
        self.assertIn('water: "high"', self.presets)
        self.assertIn('data-user-preset="dry"', self.presets)
        self.assertIn('data-user-preset="wet"', self.presets)
        self.assertNotIn('<h2>Как убирать</h2>', self.presets)

    def test_preset_writes_are_confirmed_and_read_back(self) -> None:
        self.assertIn('window.confirm(`Применить предустановку', self.presets)
        self.assertIn('await panel._callConfirmed(', self.presets)
        self.assertIn('"select_option"', self.presets)

    def test_version_metadata_cannot_drift_from_runtime(self) -> None:
        standard = json.loads((ROOT / ".nikas-ui-standard.json").read_text(encoding="utf-8"))
        constants = (ROOT / "custom_components" / "s8_omni" / "const.py").read_text(encoding="utf-8")
        manifest = json.loads((ROOT / "custom_components" / "s8_omni" / "manifest.json").read_text(encoding="utf-8"))
        panel = json.loads((ROOT / "panel.json").read_text(encoding="utf-8"))["panel"]
        self.assertEqual("0.7.41", standard["ui_version"])
        self.assertIn('const UI_VERSION = "v0.7.41"', self.source)
        self.assertIn('VERSION = "v1.00_b085"', constants)
        self.assertIn('DASHBOARD_VERSION = "v0.7.41"', constants)
        self.assertEqual("1.0.0b85", manifest["version"])
        self.assertEqual("v0.7.41", panel["dashboard_version"])
        self.assertNotIn("v0.7.31:", self.source)


if __name__ == "__main__":
    unittest.main()
