"""Exercise release preflight against independent manifest fixtures."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


class ReleaseTagContractTests(unittest.TestCase):
    def test_only_exact_manifest_version_is_accepted(self):
        with tempfile.TemporaryDirectory() as directory:
            manifest = Path(directory) / 'manifest.json'
            manifest.write_text(json.dumps({'version': '1.0.9-beta004'}))
            for tag, expected in [('1.0.9-beta004', 0), ('v1.0.9-beta004', 1),
                                  ('1.0.9-beta003', 1), ('', 1)]:
                with self.subTest(tag=tag):
                    result = subprocess.run(
                        [sys.executable, str(ROOT / 'scripts/check_release_tag.py'),
                         '--manifest', str(manifest), '--tag', tag],
                        capture_output=True, text=True)
                    self.assertEqual(expected, result.returncode, result.stderr)


if __name__ == '__main__':
    unittest.main()
