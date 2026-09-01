from __future__ import annotations

import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "custom_components" / "s8_omni" / "frontend" / "s8-omni-panel.js"


class PanelCleaningUiV0732Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.source = SOURCE.read_text(encoding="utf-8")
        cls.cleaning = cls.source.split("  _cleaning() {", 1)[1].split(
            "  _segmentControl(", 1
        )[0]
        cls.settings = cls.source.split("  _cleaningSettings() {", 1)[1].split(
            "  _operation(", 1
        )[0]
        cls.bind = cls.source.split("  _bindStableContent(root) {", 1)[1].split(
            "  _patchStableDom() {", 1
        )[0]

    def test_current_metrics_and_profile_use_shared_two_section_surfaces(self) -> None:
        self.assertIn(".metric-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0", self.source)
        self.assertIn(".metric:first-child::after", self.source)
        self.assertEqual(2, self.cleaning.count('class="metric-grid"'))
        self.assertIn("this._formatCleaningTime(cleanTime, cleanArea, snap)", self.cleaning)
        self.assertIn('return active ? "< 1 мин" : "—"', self.source)

    def test_map_and_rooms_reminder_is_preserved(self) -> None:
        self.assertIn("Следующий этап", self.cleaning)
        self.assertIn("Карта и комнаты", self.cleaning)
        self.assertIn("Комнатная и зональная уборка появятся", self.cleaning)

    def test_verified_cleaning_names_and_read_only_work_mode(self) -> None:
        self.assertIn('closed: "Выкл."', self.source)
        self.assertIn('both_work: "Сухая и влажная"', self.source)
        self.assertIn('mop_work: "Влажная"', self.source)
        self.assertIn('<span>Режим уборки</span>', self.settings)
        self.assertNotIn('_segmentControl("work_mode"', self.source)

    def test_suction_and_water_are_staged_until_apply(self) -> None:
        self.assertIn("this._setCleaningDraft(key, value)", self.bind)
        self.assertIn('button.matches("[data-apply-cleaning]")', self.bind)
        self.assertIn('await this._callConfirmed("select", "select_option", key', self.bind)
        segment_branch = self.bind.split('if (button.matches("[data-select-key]")) {', 1)[1].split(
            'if (button.matches("[data-apply-cleaning]")) {', 1
        )[0]
        self.assertNotIn("await this._call", segment_branch)
        self.assertIn("Применить", self.settings)

    def test_dnd_is_kept_but_unverified_period_is_not_invented(self) -> None:
        self.assertIn("Не беспокоить", self.settings)
        self.assertIn("период задаётся в приложении", self.settings)
        self.assertNotIn("23:59", self.source)
        self.assertNotIn("06:40", self.source)

    def test_consumables_show_derived_percent_and_exact_minutes_without_reset(self) -> None:
        self.assertIn("RESOURCE_LIFE_MINUTES", self.source)
        self.assertIn("filter_life: 9000", self.source)
        self.assertIn("side_brush_life: 12000", self.source)
        self.assertIn("main_brush_life: 18000", self.source)
        self.assertIn("Math.floor((minutes / limit) * 100)", self.source)
        self.assertIn("Осталось ${life.minutes} мин", self.source)
        self.assertNotIn("data-reset-resource", self.source)

    def test_captured_station_start_and_stop_commands_are_enabled(self) -> None:
        self.assertIn("общей кнопкой «Стоп»", self.source)
        button_source = (ROOT / "custom_components" / "s8_omni" / "button.py").read_text(encoding="utf-8")
        self.assertIn("start_dust_collection", button_source)
        self.assertIn("start_roller_cleaning", button_source)
        self.assertIn("start_roller_drying", button_source)
        self.assertIn("stop_dust_collection", button_source)
        self.assertIn("stop_roller_cleaning", button_source)
        self.assertIn("stop_roller_drying", button_source)
        self.assertIn("raise HomeAssistantError", button_source)
        self.assertIn("async_set_dp(", button_source)
        self.assertIn("self.desc.value", button_source)

    def test_manifest_records_the_cleaning_contract(self) -> None:
        panel = json.loads((ROOT / "panel.json").read_text(encoding="utf-8"))["panel"]
        detail = panel["navigation"]["drill_down"]["cleaning-settings"]
        self.assertEqual(
            "draft_explicit_apply_confirmation_write_readback",
            detail["select_write_strategy"],
        )
        self.assertEqual(
            ["suction", "water", "volume", "do_not_disturb"],
            detail["draft_fields"],
        )
        self.assertTrue(detail["single_apply"])
        self.assertTrue(detail["readback_required"])
        self.assertEqual("official_application_not_public_entity", detail["dnd_period_source"])
        self.assertTrue(panel["mobile_fit"]["cleaning_key_profile_layout"].startswith("one_shared"))


if __name__ == "__main__":
    unittest.main()
