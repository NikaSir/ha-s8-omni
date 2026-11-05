from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from s8_room_capture_analyzer import analyze, room_hex_id_candidates  # noqa: E402


class S8RoomCaptureAnalyzerTests(unittest.TestCase):
    def test_extracts_room_set_and_scalar_order(self) -> None:
        log = "\n".join(
            [
                '[S8_DP_TX] {"ts":"2026-09-04T12:00:00Z","method":"publishDps","dps":"{\\"15\\":\\"qgAEFAEBAxk=\\"}"}',
                '[S8_DP_TX] {"ts":"2026-09-04T12:00:01Z","method":"publishDps","dps":"{\\"4\\":\\"part\\"}"}',
                '[S8_DP_TX] {"ts":"2026-09-04T12:00:02Z","method":"publishDps","dps":"{\\"2\\":false,\\"1\\":true}"}',
            ]
        )
        result = analyze(log)
        self.assertTrue(result["room_set_verified_in_capture"])
        room = result["room_set_0x14"][0]
        self.assertEqual([3], room["room_ids"])
        self.assertEqual(1, room["clean_times"])
        self.assertEqual("0c", room["room_hex_id_candidates"][0]["map_v1_room_hex_id"])
        self.assertEqual("1f", room["room_hex_id_candidates"][0]["map_v2_v3_room_hex_id"])
        self.assertEqual(
            ["15", "4", "2", "1"],
            [item["dp"] for item in result["scalar_and_command_sequence"]],
        )
        self.assertEqual("part", result["expected_s8_room_mode_candidate"])

    def test_room_hex_candidates_match_tuya_mapping(self) -> None:
        self.assertEqual(
            {"map_v1_room_hex_id": "10", "map_v2_v3_room_hex_id": "27"},
            room_hex_id_candidates(4),
        )

    def test_ignores_non_probe_lines(self) -> None:
        result = analyze("ordinary log line")
        self.assertEqual(0, result["event_count"])
        self.assertFalse(result["room_set_verified_in_capture"])


if __name__ == "__main__":
    unittest.main()
