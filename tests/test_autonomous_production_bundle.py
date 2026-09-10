from __future__ import annotations

import json
import re
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / "custom_components" / "s8_omni" / "frontend"
PRODUCTION = FRONTEND / "s8-omni-production.js"


class AutonomousProductionBundleTests(unittest.TestCase):
    def test_home_assistant_registers_single_production_bundle(self) -> None:
        init_source = (ROOT / "custom_components" / "s8_omni" / "__init__.py").read_text(encoding="utf-8")
        self.assertIn('s8-omni-production.js?v={DASHBOARD_VERSION}-{VERSION}', init_source)
        self.assertNotIn('s8-omni-panel-bootstrap.js?v={DASHBOARD_VERSION}-{VERSION}', init_source)

    def test_production_bundle_is_autonomous_and_contains_all_extensions(self) -> None:
        source = PRODUCTION.read_text(encoding="utf-8")
        self.assertIsNone(re.search(r"(?m)^\s*import\s", source))
        for marker in (
            'const UI_VERSION = "v1.0.5"',
            "__s8CleaningPresets",
            "__s8ServiceSettingsB094",
            "__s8PresetLiveHighlightB093",
            "__s8ButtonUnknownCompatibilityPatch",
        ):
            self.assertIn(marker, source)

    def test_standard_declares_real_runtime_entrypoint(self) -> None:
        standard = json.loads((ROOT / ".nikas-ui-standard.json").read_text(encoding="utf-8"))
        expected = "custom_components/s8_omni/frontend/s8-omni-production.js"
        self.assertEqual(standard["runtime_files"], [expected])
        self.assertEqual(standard["production_entrypoint"], expected)
        self.assertEqual(standard["ui_version"], "1.0.5")
        self.assertTrue(standard["bundle_contract"]["autonomous"])
        self.assertFalse(standard["bundle_contract"]["runtime_imports"])

    def test_committed_bundle_matches_builder(self) -> None:
        result = subprocess.run(
            [sys.executable, str(ROOT / "scripts" / "build_s8_production.py"), "--check"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
