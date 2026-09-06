from __future__ import annotations

import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "custom_components" / "s8_omni" / "frontend" / "s8-omni-panel.js"
BOOTSTRAP = ROOT / "custom_components" / "s8_omni" / "frontend" / "s8-omni-panel-bootstrap.js"
PRESETS = ROOT / "custom_components" / "s8_omni" / "frontend" / "s8-omni-cleaning-presets.js"
SERVICE = ROOT / "custom_components" / "s8_omni" / "frontend" / "s8-omni-service-settings.js"


class PanelCurrentRulesUiV0733Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.source = SOURCE.read_text(encoding="utf-8")
        cls.bootstrap = BOOTSTRAP.read_text(encoding="utf-8")
        cls.presets = PRESETS.read_text(encoding="utf-8")
        cls.service = SERVICE.read_text(encoding="utf-8")
        cls.bind = cls.source.split("  _bindStableContent(root) {", 1)[1].split(
            "  _patchStableDom() {", 1
        )[0]

    def test_all_cleaning_writes_share_one_draft_and_apply(self) -> None:
        self.assertIn('["suction", "water", "volume", "do_not_disturb"]', self.source)
        self.assertIn('this._setCleaningDraft("volume", Number(volume.value))', self.bind)
        self.assertIn('key === "do_not_disturb"', self.bind)
        self.assertIn('data-apply-cleaning', self.service)
        self.assertIn("Изменения готовы", self.service)
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

    def test_child_modules_are_cache_busted_with_release_version(self) -> None:
        self.assertIn('import "./s8-omni-panel.js?v=1.0.0b90";', self.bootstrap)
        self.assertIn('import "./s8-omni-cleaning-presets.js?v=1.0.0b90";', self.bootstrap)
        self.assertIn('import "./s8-omni-service-settings.js?v=1.0.0b90";', self.bootstrap)
        self.assertNotIn('import "./s8-omni-cleaning-presets.js";', self.bootstrap)

    def test_child_lock_is_confirmed_and_read_back(self) -> None:
        self.assertIn("блокировку от детей?", self.bind)
        self.assertIn('await this._callConfirmed("switch"', self.bind)

    def test_service_owns_volume_dnd_and_apply(self) -> None:
        self.assertIn("Голосовые уведомления", self.service)
        self.assertIn("Не беспокоить", self.service)
        self.assertIn('data-volume', self.service)
        self.assertIn('data-toggle="do_not_disturb"', self.service)
        self.assertIn('data-apply-cleaning', self.service)
        settings = self.service.split("Panel.prototype._cleaningSettings", 1)[1].split("const oldMaintenance", 1)[0]
        self.assertNotIn("Голосовые уведомления", settings)
        self.assertNotIn("Не беспокоить", settings)
        self.assertNotIn('data-apply-cleaning', settings)
        self.assertIn("Кнопка «Применить» находится в разделе «Сервис»", settings)

    def test_selected_preset_is_persisted_only_after_device_values_match(self) -> None:
        self.assertIn("nikas.s8_omni.selected_preset", self.service)
        self.assertIn("rememberAfterReadback", self.service)
        self.assertIn("_controlValuesEqual(\"suction\"", self.service)
        self.assertIn("_controlValuesEqual(\"water\"", self.service)
        self.assertIn("storeSelected(panel, key)", self.service)
        self.assertIn("preset-option.selected", self.service)
        self.assertIn("user-preset-shell.selected", self.service)

    def test_user_preset_highlight_reads_entry_and_legacy_default_storage(self) -> None:
        self.assertIn('userKeyForEntry(entryKey(panel), kind)', self.service)
        self.assertIn('userKeyForEntry("default", kind)', self.service)
        self.assertIn('new Set(keys)', self.service)

    def test_approved_cleaning_presets_are_two_full_width_rows_without_mode_card(self) -> None:
        self.assertNotIn('Тип уборки', self.presets)
        self.assertNotIn('cleaning-type-card', self.presets)
        self.assertIn('.preset-groups{display:grid;grid-template-columns:1fr;gap:10px}', self.presets)
        self.assertEqual(1, self.presets.count('class="preset-group dry"'))
        self.assertEqual(1, self.presets.count('class="preset-group wet"'))
        for key in ('"dry-quiet"', '"dry-max"', '"wet-quiet"', '"wet-max"'):
            self.assertIn(key, self.presets)
        self.assertIn('data-cleaning-preset="dry-user"', self.presets)
        self.assertIn('data-cleaning-preset="wet-user"', self.presets)
        self.assertIn('data-user-preset-edit="dry"', self.presets)
        self.assertIn('data-user-preset-edit="wet"', self.presets)

    def test_preset_confirmation_is_custom_wide_and_cancelable(self) -> None:
        self.assertIn('width:min(520px,calc(100vw - 24px))', self.presets)
        self.assertIn('data-preset-cancel>Отмена', self.presets)
        self.assertIn('data-preset-apply>Применить', self.presets)
        self.assertIn('await showPresetConfirm(panel, preset, changes)', self.presets)
        self.assertNotIn('window.confirm(`Применить предустановку', self.presets)
        self.assertIn('await panel._callConfirmed(', self.presets)
        self.assertIn('"select_option"', self.presets)

    def test_user_presets_are_persistent_and_editor_never_writes_device(self) -> None:
        self.assertIn('window.localStorage.getItem(userPresetStorageKey(panel, kind))', self.presets)
        self.assertIn('window.localStorage.setItem(userPresetStorageKey(panel, kind)', self.presets)
        editor = self.presets.split('function showUserPresetEditor', 1)[1].split('async function applyPreset', 1)[0]
        self.assertIn('Настройки только сохраняются в предустановку', editor)
        self.assertIn('writeUserPreset(panel, kind', editor)
        self.assertNotIn('_callConfirmed', editor)
        self.assertNotIn('_switchWorkspace', editor)
        self.assertNotIn('_setCleaningDraft', editor)

    def test_version_metadata_cannot_drift_from_runtime(self) -> None:
        standard = json.loads((ROOT / ".nikas-ui-standard.json").read_text(encoding="utf-8"))
        constants = (ROOT / "custom_components" / "s8_omni" / "const.py").read_text(encoding="utf-8")
        manifest = json.loads((ROOT / "custom_components" / "s8_omni" / "manifest.json").read_text(encoding="utf-8"))
        panel = json.loads((ROOT / "panel.json").read_text(encoding="utf-8"))["panel"]
        self.assertEqual("0.7.41", standard["ui_version"])
        self.assertIn('const UI_VERSION = "v0.7.41"', self.source)
        self.assertIn('VERSION = "v1.00_b090"', constants)
        self.assertIn('DASHBOARD_VERSION = "v0.7.41"', constants)
        self.assertEqual("1.0.0b90", manifest["version"])
        self.assertEqual("v0.7.41", panel["dashboard_version"])
        self.assertNotIn("v0.7.31:", self.source)


if __name__ == "__main__":
    unittest.main()
