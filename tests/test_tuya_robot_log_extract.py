from __future__ import annotations

import base64
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from tuya_robot_log_extract import extract_frames, split_frame_stream  # noqa: E402


class TuyaRobotLogExtractTests(unittest.TestCase):
    ROOM1_HEX = "aa00041401010117"
    ROOM1_B64 = base64.b64encode(bytes.fromhex(ROOM1_HEX)).decode("ascii")
    REAL_S8_COMMAND_TRANS = "qgABFxeqAAITABOqAAIbABuqAAMpAAApqgADFQAAFQ=="

    def test_proscenic_q8_room_frame_matches_public_v1_shape(self) -> None:
        frames = extract_frames({"command_trans": self.ROOM1_B64})
        self.assertEqual(1, len(frames))
        frame = frames[0]
        self.assertEqual("0x14", frame["command_hex"])
        self.assertEqual("room_clean_v1_set", frame["command_name"])
        self.assertEqual(0, frame["protocol_version"])
        self.assertEqual(1, frame["payload"]["clean_times"])
        self.assertEqual([1], frame["payload"]["room_ids"])
        self.assertEqual("base64", frame["source_encoding"])

    def test_unprefixed_base64_inside_frida_style_json(self) -> None:
        value = {
            "tag": "S8_DP_TX",
            "method": "publishDps",
            "dps": {"15": self.ROOM1_B64},
        }
        frames = extract_frames(value)
        self.assertEqual([self.ROOM1_HEX], [item["raw_hex"] for item in frames])

    def test_real_s8_command_trans_stream_splits_into_five_v0_frames(self) -> None:
        frames = extract_frames({"15": self.REAL_S8_COMMAND_TRANS})
        self.assertEqual(
            ["0x17", "0x13", "0x1B", "0x29", "0x15"],
            [frame["command_hex"] for frame in frames],
        )
        self.assertTrue(all(frame["protocol_version"] == 0 for frame in frames))
        self.assertTrue(all(frame["checksum_valid"] for frame in frames))
        self.assertTrue(all(frame["source_encoding"] == "base64" for frame in frames))

    def test_split_real_s8_stream_preserves_exact_frame_boundaries(self) -> None:
        raw = base64.b64decode(self.REAL_S8_COMMAND_TRANS)
        frames = split_frame_stream(raw)
        self.assertEqual(
            [
                "aa00011717",
                "aa0002130013",
                "aa00021b001b",
                "aa000329000029",
                "aa000315000015",
            ],
            [frame.raw.hex() for frame in frames],
        )

    def test_plain_hex_is_still_supported(self) -> None:
        frames = extract_frames(f"tx={self.ROOM1_HEX}")
        self.assertEqual(1, len(frames))
        self.assertEqual("hex", frames[0]["source_encoding"])

    def test_random_base64_is_ignored(self) -> None:
        harmless = base64.b64encode(b"not a robot frame").decode("ascii")
        self.assertEqual([], extract_frames({"value": harmless}))

    def test_bad_checksum_is_rejected_by_default(self) -> None:
        bad = base64.b64encode(bytes.fromhex("aa00041401010100")).decode("ascii")
        self.assertEqual([], extract_frames({"value": bad}))

    def test_duplicate_hex_and_base64_are_deduplicated(self) -> None:
        value = [self.ROOM1_HEX, self.ROOM1_B64]
        frames = extract_frames(value)
        self.assertEqual(1, len(frames))


if __name__ == "__main__":
    unittest.main()
