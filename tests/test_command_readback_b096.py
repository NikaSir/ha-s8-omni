"""Run confirmation regressions through the actual registered frontend modules."""

from pathlib import Path
import subprocess
import unittest


ROOT = Path(__file__).resolve().parents[1]


class CommandReadbackB096Tests(unittest.TestCase):
    def test_production_bootstrap_preserves_unknown_and_requires_valid_readback(self):
        result = subprocess.run(
            ["node", "tests/ui/command-readback-regression.mjs"],
            cwd=ROOT, capture_output=True, text=True, timeout=30, check=False,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
