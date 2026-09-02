from __future__ import annotations

import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "custom_components" / "s8_omni" / "frontend" / "s8-omni-panel.js"


class PanelCurrentRulesUiV0733Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.source = SOURCE.read_text(encoding="utf-8")
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

    def test_child_lock_is_confirmed_and_read_back(self) -> None:
        self.assertIn("блокировку от детей?", self.bind)
        self.assertIn('await this._callConfirmed("switch"', self.bind)

    def test_shell_owns_viewport_and_hero_is_first_paint_priority(self) -> None:
        self.assertIn("overscroll-behavior:none;position:fixed;inset:0;width:auto", self.source)
        self.assertIn('loading="eager" decoding="sync" fetchpriority="high"', self.source)

    def test_version_metadata_cannot_drift_from_runtime(self) -> None:
        standard = json.loads((ROOT / ".nikas-ui-standard.json").read_text(encoding="utf-8"))
        constants = (ROOT / "custom_components" / "s8_omni" / "const.py").read_text(encoding="utf-8")
        manifest = json.loads((ROOT / "custom_components" / "s8_omni" / "manifest.json").read_text(encoding="utf-8"))
        panel = json.loads((ROOT / "panel.json").read_text(encoding="utf-8"))["panel"]
        self.assertEqual("0.7.40", standard["ui_version"])
        self.assertIn('const UI_VERSION = "v0.7.40"', self.source)
        self.assertIn('VERSION = "v1.00_b076"', constants)
        self.assertEqual("1.0.0b76", manifest["version"])
        self.assertEqual("v0.7.40", panel["dashboard_version"])
        self.assertNotIn("v0.7.31:", self.source)


if __name__ == "__main__":
    unittest.main()
