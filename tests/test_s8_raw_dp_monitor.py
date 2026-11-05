from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from s8_raw_dp_monitor import describe_value, diff_dps, normalize_dps  # noqa: E402


class S8RawDpMonitorTests(unittest.TestCase):
    def test_normalize_dps(self) -> None:
        self.assertEqual({1: True, 136: False}, normalize_dps({"dps": {"1": True, "136": False}}))

    def test_changed_dps_only(self) -> None:
        previous = {1: False, 2: True, 136: False}
        current = {1: False, 2: True, 136: True, 199: "abc"}
        self.assertEqual({136: True, 199: "abc"}, diff_dps(previous, current))

    def test_first_sample_contains_every_dp(self) -> None:
        current = {1: False, 2: True}
        self.assertEqual(current, diff_dps(None, current))

    def test_short_string_is_preserved(self) -> None:
        result = describe_value("qgAEFAEBARc=")
        self.assertEqual("str", result["type"])
        self.assertEqual("qgAEFAEBARc=", result["value"])
        self.assertIn("sha256", result)

    def test_large_string_is_hashed_not_emitted(self) -> None:
        result = describe_value("x" * 5000)
        self.assertTrue(result["truncated"])
        self.assertNotIn("value", result)
        self.assertEqual(5000, result["length"])

    def test_invalid_status_response_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            normalize_dps({"status": "ok"})


if __name__ == "__main__":
    unittest.main()
