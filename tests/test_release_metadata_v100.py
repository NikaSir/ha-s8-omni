from __future__ import annotations

import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INTEGRATION = ROOT / "custom_components" / "s8_omni"


class StableReleaseMetadataV100Tests(unittest.TestCase):
    def test_home_assistant_and_hacs_manifest_is_release_ready(self) -> None:
        manifest = json.loads((INTEGRATION / "manifest.json").read_text(encoding="utf-8"))

        self.assertEqual("1.0.2", manifest["version"])
        self.assertEqual(["@NikaSir"], manifest["codeowners"])
        self.assertEqual("device", manifest["integration_type"])
        self.assertEqual("https://github.com/NikaSir/ha-s8-omni", manifest["documentation"])
        self.assertEqual(
            "https://github.com/NikaSir/ha-s8-omni/issues",
            manifest["issue_tracker"],
        )

    def test_integration_and_ui_release_versions_are_coherent(self) -> None:
        constants = (INTEGRATION / "const.py").read_text(encoding="utf-8")
        source = (INTEGRATION / "frontend" / "s8-omni-panel.js").read_text(encoding="utf-8")
        panel = json.loads((ROOT / "panel.json").read_text(encoding="utf-8"))["panel"]
        standard = json.loads((ROOT / ".nikas-ui-standard.json").read_text(encoding="utf-8"))

        self.assertIn('VERSION = "v1.0.2"', constants)
        self.assertIn('DASHBOARD_VERSION = "v1.0.2"', constants)
        self.assertIn('const UI_VERSION = "v1.0.2"', source)
        self.assertEqual("v1.0.2", panel["dashboard_version"])
        self.assertEqual(["Пылесос", "UI v1.0.2"], panel["navigation"]["header_center_lines"])
        self.assertEqual("1.0.2", standard["ui_version"])

    def test_every_frontend_child_import_uses_stable_release_cache_key(self) -> None:
        bootstrap = (INTEGRATION / "frontend" / "s8-omni-panel-bootstrap.js").read_text(
            encoding="utf-8"
        )

        self.assertEqual(4, bootstrap.count("?v=1.0.2"))
        self.assertNotIn("?v=1.0.0b", bootstrap)

    def test_public_readme_announces_stable_release(self) -> None:
        readme = (ROOT / "README.md").read_text(encoding="utf-8")

        self.assertIn("Stable release: **v1.0.2** (`1.0.2`).", readme)
        self.assertNotIn("This is an early test build", readme)

    def test_changelog_starts_with_stable_release(self) -> None:
        changelog = (ROOT / "CHANGELOG.md").read_text(encoding="utf-8")

        self.assertTrue(changelog.startswith("## v1.0.2 / UI v1.0.2\n"))
        self.assertIn("first stable S8 OMNI release", changelog)

    def test_ci_contains_official_hacs_validation(self) -> None:
        workflow = (ROOT / ".github" / "workflows" / "repository-checks.yml").read_text(
            encoding="utf-8"
        )

        self.assertIn("hacs-validation:", workflow)
        self.assertIn("uses: hacs/action@main", workflow)
        self.assertIn("category: integration", workflow)


if __name__ == "__main__":
    unittest.main()
