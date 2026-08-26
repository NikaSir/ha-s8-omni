from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "custom_components" / "s8_omni" / "frontend" / "s8-omni-panel.js"


class PanelDynamicActionsUiV0723Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.source = SOURCE.read_text(encoding="utf-8")
        cls.bind = cls.source.split("  _bindStableContent(root) {", 1)[1].split(
            "  _patchStableDom() {", 1
        )[0]

    def test_initial_and_later_views_share_the_same_binding_path(self) -> None:
        shell_bind = self.source.split("  _bind() {", 1)[1].split(
            "  _finishRender() {", 1
        )[0]
        self.assertIn(
            'this._bindStableContent(this.shadowRoot.querySelector("[data-stable-view]"))',
            shell_bind,
        )
        self.assertIn("this._bindStableContent(activeView)", self.source)

    def test_clicks_are_delegated_to_the_stable_view_root(self) -> None:
        self.assertIn('root.addEventListener("click", async (event) =>', self.bind)
        self.assertIn('event.target?.closest?.("button")', self.bind)
        self.assertIn("root.contains(button)", self.bind)
        self.assertNotIn('root.querySelectorAll("[data-action]")', self.bind)

    def test_live_button_role_is_resolved_when_clicked(self) -> None:
        for selector in (
            "[data-station-stop]",
            "[data-action]",
            "[data-select-key]",
            "[data-toggle]",
        ):
            self.assertIn(f'button.matches("{selector}")', self.bind)
        self.assertIn("const action = button.dataset.action", self.bind)
        self.assertIn('action === "pause" ? "pause"', self.bind)
        self.assertIn('action === "stop" ? "stop"', self.bind)
        self.assertIn('action === "home" ? "return_to_base"', self.bind)
        self.assertIn("setTimeout(() => this._queueLivePatch(), 650)", self.bind)
        self.assertNotIn("button.disabled = false", self.bind)

    def test_runtime_and_manifest_versions_match(self) -> None:
        self.assertIn('const UI_VERSION = "v0.7.23"', self.source)
        self.assertIn('DASHBOARD_VERSION = "v0.7.23"', (ROOT / "custom_components" / "s8_omni" / "const.py").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
