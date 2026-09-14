from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from s8_room_capture_compare import compare_captures  # noqa: E402


def make_log(frame_b64: str) -> str:
    return (
        '[S8_DP_TX] {"ts":"2026-09-04T12:00:00Z","method":"publishDps",'
        f'"dps":"{{\\"15\\":\\"{frame_b64}\\"}}"}}'
    )


class S8RoomCaptureCompareTests(unittest.TestCase):
    def test_same_room_is_stable_and_different_room_changes_room_byte(self) -> None:
        # room 3 -> AA 00 04 14 01 01 03 19
        room3 = make_log("qgAEFAEBAxk=")
        # room 4 -> AA 00 04 14 01 01 04 1A
        room4 = make_log("qgAEFAEBBBo=")
        result = compare_captures([("r3-a", room3), ("r3-b", room3), ("r4", room4)])
        self.assertEqual(3, result["valid_capture_count"])
        self.assertTrue(result["same_selection_byte_identical"]["3"])
        self.assertEqual(
            [{"cmd_data_offset": 3, "values_hex": ["03", "03", "04"]}],
            result["differing_cmd_data_positions"],
        )

    def test_missing_room_set_is_reported(self) -> None:
        result = compare_captures([("a", "ordinary"), ("b", "ordinary")])
        self.assertEqual(0, result["valid_capture_count"])
        self.assertEqual([], result["differing_cmd_data_positions"])


if __name__ == "__main__":
    unittest.main()
