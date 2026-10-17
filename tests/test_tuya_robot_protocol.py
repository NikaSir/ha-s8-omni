from __future__ import annotations

import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from tuya_robot_protocol import (  # noqa: E402
    ProtocolError,
    decode_frame,
    encode_frame,
    extract_frames,
    scan_schema,
)


class TuyaRobotProtocolTests(unittest.TestCase):
    def test_official_room_clean_v1_example(self) -> None:
        frame = decode_frame("aa010000000614010304050324")
        self.assertTrue(frame.length_valid)
        self.assertTrue(frame.checksum_valid)
        self.assertEqual(0x14, frame.command)
        self.assertEqual(
            {
                "clean_times": 1,
                "room_count": 3,
                "room_ids": [4, 5, 3],
            },
            frame.to_dict()["payload"],
        )

    def test_official_room_clean_v2_example(self) -> None:
        value = (
            "aa010000002556"
            "070202010001040301000106020100010302010001"
            "00020100010102010001050201ff01"
            "8e"
        )
        frame = decode_frame(value)
        payload = frame.to_dict()["payload"]
        self.assertEqual(7, payload["room_count"])
        self.assertEqual(2, payload["rooms"][0]["room_id"])
        self.assertEqual("normal", payload["rooms"][0]["suction"]["name"])
        self.assertEqual("low", payload["rooms"][0]["cistern"]["name"])
        self.assertEqual(255, payload["rooms"][-1]["y_mop"]["raw"])
        self.assertTrue(frame.checksum_valid)

    def test_official_v0_request_example(self) -> None:
        frame = decode_frame("aa00011515")
        self.assertEqual(0, frame.protocol_version)
        self.assertEqual(0x15, frame.command)
        self.assertEqual(b"", frame.data)
        self.assertTrue(frame.checksum_valid)

    def test_official_zone_clean_v1_example(self) -> None:
        frame = decode_frame(
            "aa0100000014280101040094fc2e0240fc2e0240fb0e0094fb0e40"
        )
        payload = frame.to_dict()["payload"]
        self.assertEqual(1, payload["clean_times"])
        self.assertEqual(1, payload["zone_count"])
        self.assertEqual(4, payload["zones"][0]["point_count"])
        self.assertEqual(148, payload["zones"][0]["points"][0]["x_tuya_delta_units"])
        self.assertEqual(-977, payload["zones"][0]["points"][0]["y_tuya_delta_units"])

    def test_official_zone_clean_v2_protocols(self) -> None:
        frames = (
            "aa01000000293a010101040094fc2e0240fc2e0240fb0e0094fb0e"
            "000000000000000000000000000000000000000053",
            "aa010000002c3a020001010101040094fc2e0240fc2e0240fb0e0094fb0e"
            "000000000000000000000000000000000000000056",
            "aa01000000353a0301000000040094fc2e0240fc2e0240fb0e0094fb0e"
            "01000001010000000000000000000000000000000000000000000000000057",
        )
        for expected_version, value in enumerate(frames, start=1):
            with self.subTest(expected_version=expected_version):
                payload = decode_frame(value).to_dict()["payload"]
                self.assertEqual(expected_version, payload["zone_protocol_version"])
                self.assertEqual(1, payload["zone_count"])
                self.assertEqual(4, payload["zones"][0]["point_count"])

    def test_round_trip_encoder(self) -> None:
        raw = encode_frame(0x14, bytes.fromhex("0103040503"))
        self.assertEqual("aa010000000614010304050324", raw.hex())
        frame = decode_frame(raw)
        self.assertEqual([4, 5, 3], frame.to_dict()["payload"]["room_ids"])

    def test_checksum_mismatch_is_rejected_in_strict_mode(self) -> None:
        with self.assertRaisesRegex(ProtocolError, "checksum mismatch"):
            decode_frame("aa010000000614010304050300")
        frame = decode_frame("aa010000000614010304050300", strict=False)
        self.assertFalse(frame.checksum_valid)

    def test_trailing_bytes_are_rejected_in_strict_mode(self) -> None:
        with self.assertRaisesRegex(ProtocolError, "trailing bytes"):
            decode_frame("aa00011515ff")
        frame = decode_frame("aa00011515ff", strict=False)
        self.assertFalse(frame.length_valid)

    def test_schema_binding_uses_code_not_dp_number(self) -> None:
        schema = {
            "dataPointInfo": [
                {"abilityId": 15, "code": "command_trans", "type": "Raw", "maxlen": 128},
                {"abilityId": 145, "code": "pending_save_map", "type": "Boolean"},
                {"abilityId": 16, "code": "request", "type": "Enum"},
            ],
            "deviceId": "secret-device-id",
            "localKey": "secret-local-key",
        }
        result = scan_schema(schema)
        self.assertTrue(result["command_transport_confirmed"])
        self.assertEqual(15, result["command_transport_candidates"][0]["dp_id"])
        self.assertTrue(any("DP145" in warning for warning in result["warnings"]))
        pending = [
            item
            for item in result["related_datapoints"]
            if item["code"] == "pending_save_map"
        ][0]
        self.assertEqual("map_state_flag_not_command_transport", pending["role"])

    def test_schema_without_code_never_guesses_dp145(self) -> None:
        result = scan_schema({"abilityId": 145, "type": "Raw"})
        self.assertFalse(result["command_transport_confirmed"])
        self.assertEqual([], result["command_transport_candidates"])
        self.assertTrue(any("Do not guess" in warning for warning in result["warnings"]))

    def test_extract_frames_from_json(self) -> None:
        value = {
            "trace": [
                {"value": "aa00011515"},
                {"value": "not a frame"},
                {"nested": "prefix aa010000000614010304050324 suffix"},
            ]
        }
        frames = extract_frames(value, strict=True)
        self.assertEqual(
            {"aa00011515", "aa010000000614010304050324"},
            {item["raw_hex"] for item in frames},
        )

    def test_base64_input(self) -> None:
        frame = decode_frame("base64:qgABFRU=")
        self.assertEqual(0x15, frame.command)


if __name__ == "__main__":
    unittest.main()
