from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from s8_legacy_payload_decode import (  # noqa: E402
    decode_command_trans_bundle,
    decode_dnd_33,
    decode_timer_31,
    decode_voice_35,
)
from tuya_robot_protocol import decode_frame  # noqa: E402


class S8LegacyPayloadDecodeTests(unittest.TestCase):
    COMMAND_TRANS = "qgABFxeqAAITABOqAAIbABuqAAMpAAApqgADFQAAFQ=="
    TIMER = "qgAMMQMBAX8UHgAAAgMC7g=="
    DND = "qgAIMwAXOwAGKACz"
    VOICE = "qwAAAAAHNQAAAAADZJw="

    def test_actual_s8_command_bundle(self) -> None:
        decoded = decode_command_trans_bundle(self.COMMAND_TRANS)
        self.assertEqual(5, decoded["frame_count"])
        self.assertEqual(
            ["0x17", "0x13", "0x1B", "0x29", "0x15"],
            [item["command_hex"] for item in decoded["frames"]],
        )
        self.assertEqual("S8_PANEL_LEGACY_QUERY_BUNDLE", decoded["bundle_classification"])
        self.assertEqual("APP_TO_ROBOT_QUERY", decoded["direction"])
        self.assertEqual(
            [
                "spot_clean_query",
                "virtual_wall_query",
                "restricted_area_query",
                "zone_clean_query",
                "room_clean_query",
            ],
            decoded["query_sequence"],
        )

    def test_actual_s8_timer(self) -> None:
        result = decode_timer_31(decode_frame(f"base64:{self.TIMER}"))
        self.assertEqual(3, result["timezone_hours"])
        self.assertEqual(1, result["timer_count"])
        timer = result["timers"][0]
        self.assertTrue(timer["enabled"])
        self.assertEqual("0x7F", timer["week_mask_hex"])
        self.assertEqual([True] * 7, timer["week_bits_monday_first"])
        self.assertEqual("20:30", timer["time"])
        self.assertEqual(0, timer["room_count"])
        self.assertEqual([], timer["room_ids"])
        self.assertEqual(0, timer["clean_mode_raw"])
        self.assertEqual(2, timer["fan_level_raw"])
        self.assertEqual(3, timer["water_level_raw"])
        self.assertEqual(2, timer["clean_count"])

    def test_actual_s8_dnd(self) -> None:
        result = decode_dnd_33(decode_frame(f"base64:{self.DND}"))
        self.assertEqual(0, result["timezone_hours_raw_signed"])
        self.assertEqual("23:59", result["start"])
        self.assertEqual(0, result["start_day_offset"])
        self.assertEqual("06:40", result["end"])
        self.assertEqual(0, result["end_day_offset"])

    def test_actual_s8_voice(self) -> None:
        result = decode_voice_35(decode_frame(f"base64:{self.VOICE}"))
        self.assertEqual(0, result["language_id"])
        self.assertEqual(3, result["status"])
        self.assertEqual(100, result["progress"])


if __name__ == "__main__":
    unittest.main()
