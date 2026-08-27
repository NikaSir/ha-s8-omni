from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = (
    ROOT
    / "custom_components"
    / "s8_omni"
    / "frontend"
    / "s8-omni-panel.js"
)


class PanelMobileShellUiV0722Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.source = SOURCE.read_text(encoding="utf-8")

    def test_phone_shell_is_fixed_to_visual_viewport(self) -> None:
        mobile = self.source.split("@media(max-width:520px){", 1)[1].split(
            "@keyframes spin", 1
        )[0]
        self.assertIn(
            ":host{position:fixed;inset:0;width:auto;height:auto;min-height:0;max-height:none}",
            mobile,
        )
        self.assertIn("main{position:absolute;inset:0;width:auto;height:auto}", mobile)

    def test_only_work_viewport_scrolls(self) -> None:
        self.assertIn(
            "main{height:100%;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr) auto;overflow:hidden",
            self.source,
        )
        self.assertIn(
            ".work-viewport.is-native{overflow-x:hidden;overflow-y:auto;",
            self.source,
        )

    def test_overview_actions_clear_bottom_navigation(self) -> None:
        mobile = self.source.split("@media(max-width:520px){", 1)[1].split(
            "@keyframes spin", 1
        )[0]
        self.assertIn("@media(max-width:520px){.state-hero .state-scene{height:264px}", self.source)
        self.assertIn("nav button{min-height:52px", mobile)

    def test_stable_dom_contract_is_preserved(self) -> None:
        self.assertEqual(1, self.source.count("shadowRoot.innerHTML"))
        setter = self.source.split("set hass(value)", 1)[1].split("get hass()", 1)[0]
        self.assertIn("this._queueLivePatch()", setter)


if __name__ == "__main__":
    unittest.main()
