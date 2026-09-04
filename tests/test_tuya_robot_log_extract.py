from __future__ import annotations

import base64
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from tuya_robot_log_extract import extract_frames  # noqa: E402


class TuyaRobotLogExtractTests(unittest.TestCase):
    ROOM1_HEX = "aa00041401010117"
    ROOM1_B64 = base64.b64encode(bytes.fromhex(ROOM1_HEX)).decode("ascii")

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
