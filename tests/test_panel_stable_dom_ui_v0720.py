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


class PanelStableDomUiV0720Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.source = SOURCE.read_text(encoding="utf-8")

    def test_shadow_root_mounts_once(self) -> None:
        self.assertEqual(1, self.source.count("shadowRoot.innerHTML"))
        self.assertIn("this._stableMounted = true", self.source)
        self.assertNotIn("shadowRoot.replaceChildren", self.source)

    def test_hass_updates_use_live_patch_queue(self) -> None:
        setter = self.source.split("set hass(value)", 1)[1].split("get hass()", 1)[0]
        self.assertIn("this._queueLivePatch()", setter)
        self.assertNotIn("this._queueRender()", setter)

    def test_shell_nodes_are_synchronized_not_recreated(self) -> None:
        patch = self.source.split("  _patchStableDom() {", 1)[1].split("  _render() {", 1)[0]
        self.assertIn('querySelector(".app-header")', patch)
        self.assertIn('querySelector("nav")', patch)
        self.assertIn("s8SyncTree(currentHeader, desiredHeader)", patch)
        self.assertIn("s8SyncTree(currentNav, desiredNav)", patch)
        self.assertNotIn("shadowRoot.innerHTML", patch)

    def test_telemetry_age_is_not_structural(self) -> None:
        key = self.source.split("  _stableStructureKey() {", 1)[1].split(
            "_bindStableContent", 1
        )[0]
        self.assertNotIn("telemetry_age", key)
        self.assertNotIn("this._hass.states", key)

    def test_native_scroll_blocks_structural_patch(self) -> None:
        live_queue = self.source.split("  _queueLivePatch() {", 1)[1].split(
            "  _queueRender() {", 1
        )[0]
        self.assertIn("this._nativeScrollActive", live_queue)
        patch = self.source.split("  _patchStableDom() {", 1)[1].split(
            "  _render() {", 1
        )[0]
        self.assertIn("this._nativeScrollActive", patch)
        self.assertIn("currentContent.replaceChildren", patch)


if __name__ == "__main__":
    unittest.main()
