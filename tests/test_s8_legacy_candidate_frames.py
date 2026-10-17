from __future__ import annotations

import base64
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from s8_legacy_candidate_frames import room_clean_v0, spot_clean_v0, zone_clean_v0  # noqa: E402
from tuya_robot_protocol import decode_frame  # noqa: E402


class S8LegacyCandidateFrameTests(unittest.TestCase):
    def test_room_one_matches_public_v0_vector(self) -> None:
        raw = room_clean_v0([1])
        self.assertEqual("aa00041401010117", raw.hex())
        self.assertEqual("qgAEFAEBARc=", base64.b64encode(raw).decode("ascii"))

    def test_room_multiple(self) -> None:
        frame = decode_frame(room_clean_v0([4, 5, 3]))
        self.assertEqual(0x14, frame.command)
        self.assertEqual(bytes([1, 3, 4, 5, 3]), frame.data)
        self.assertTrue(frame.checksum_valid)

    def test_spot_v0(self) -> None:
        frame = decode_frame(spot_clean_v0(0x0094, 0xFC2E))
        self.assertEqual(0x16, frame.command)
        self.assertEqual(bytes.fromhex("0094fc2e"), frame.data)

    def test_zone_v0(self) -> None:
        points = [(0x0094, 0xFC2E), (0x0240, 0xFC2E), (0x0240, 0xFB0E), (0x0094, 0xFB0E)]
        frame = decode_frame(zone_clean_v0(points))
        self.assertEqual(0x28, frame.command)
        self.assertEqual(1, frame.data[0])
        self.assertEqual(1, frame.data[1])
        self.assertEqual(4, frame.data[2])
        self.assertTrue(frame.checksum_valid)


if __name__ == "__main__":
    unittest.main()
