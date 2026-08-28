from __future__ import annotations

import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "custom_components" / "s8_omni" / "frontend" / "s8-omni-panel.js"


class PanelOverviewUiV0727Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.source = SOURCE.read_text(encoding="utf-8")
        cls.hero_state = cls.source.split("  _heroState(snap) {", 1)[1].split(
            "  _resourceStrip(snap) {", 1
        )[0]
        cls.resource_strip = cls.source.split("  _resourceStrip(snap) {", 1)[1].split(
            "  _hero() {", 1
        )[0]
        cls.hero = cls.source.split("  _hero() {", 1)[1].split(
            "  _quickActions() {", 1
        )[0]
        cls.actions = cls.source.split("  _quickActions() {", 1)[1].split(
            "  _overview() {", 1
        )[0]

    def test_runtime_version_and_six_approved_state_images(self) -> None:
        self.assertIn('const UI_VERSION = "v0.7.31"', self.source)
        for name in (
            "hero-base.webp",
            "hero-charging.webp",
            "hero-cleaning.webp",
            "hero-paused.webp",
            "hero-return.webp",
            "hero-error.webp",
        ):
            self.assertIn(name, self.source)

    def test_approved_operational_status_vocabulary(self) -> None:
        for text in (
            'title: "На базе", hint: "Готов к уборке"',
            'title: "Заряжается", hint: `Идёт зарядка · ${charge}`',
            'title: "Уборка", hint: "Выполняется уборка"',
            'title: "Пауза", hint: "Уборка приостановлена"',
            'title: "Возврат", hint: "Возвращается на базу"',
            'title: "Требуется внимание", hint: "Проверьте робот или станцию"',
        ):
            self.assertIn(text, self.hero_state)

    def test_resource_strip_remains_unchanged(self) -> None:
        for text in ("Чистая вода", "Грязная вода", "Пыль/мешок", "Нет датчика"):
            self.assertIn(text, self.resource_strip)
        self.assertEqual(3, self.resource_strip.count('class="resource-chip'))

    def test_overview_summary_uses_station_not_telemetry_kpi(self) -> None:
        self.assertIn("<span>Станция</span>", self.hero)
        self.assertNotIn("<span>Телеметрия</span>", self.hero)
        self.assertNotIn('<span class="eyebrow">Состояние</span>', self.hero)
        for label in ("Готова", "Заряжает", "Ожидает", "Ошибка"):
            self.assertIn(label, self.hero)

    def test_quick_actions_follow_operational_state(self) -> None:
        for state in ("cleaning", "paused", "returning", "attention"):
            self.assertIn(state, self.actions)
        self.assertIn('actionButton("Пауза", "mdi:pause", "pause", available, true)', self.actions)
        self.assertIn('actionButton("Домой", "mdi:home", "home", available, true)', self.actions)
        self.assertIn('actionButton("Уборка", "mdi:play", null, false)', self.actions)

    def test_panel_manifest_tracks_v0727_artwork_contract(self) -> None:
        panel = json.loads((ROOT / "panel.json").read_text(encoding="utf-8"))["panel"]
        self.assertEqual("v0.7.31", panel["dashboard_version"])
        self.assertEqual(264, panel["workspace_transform"]["mobile_overview_scene_height_px"])
        states = set(panel["frontend"]["product_art_states"])
        self.assertTrue({"base", "charging", "cleaning", "paused", "returning", "error"} <= states)


if __name__ == "__main__":
    unittest.main()
