#!/usr/bin/env python3
"""Build S8 OMNI *offline candidate* legacy RobotProtocol SET frames.

No network, no TinyTuya and no device write path exists in this script.
The generated frames are for comparison with Smart Life captures only until a
matching outbound S8 frame has been physically verified.
"""

from __future__ import annotations

import argparse
import base64
import json
from typing import Any

from tuya_robot_protocol import ProtocolError, encode_frame


def room_clean_v0(room_ids: list[int], *, clean_times: int = 1) -> bytes:
    if not room_ids:
        raise ProtocolError("at least one room id is required")
    if not 1 <= clean_times <= 255:
        raise ProtocolError("clean_times must be 1..255")
    if len(room_ids) > 255 or any(not 0 <= value <= 255 for value in room_ids):
        raise ProtocolError("room IDs must be bytes and count must fit one byte")
    payload = bytes([clean_times, len(room_ids), *room_ids])
    return encode_frame(0x14, payload, header="aa", protocol_version=0)


def spot_clean_v0(x_raw: int, y_raw: int) -> bytes:
    if not 0 <= x_raw <= 0xFFFF or not 0 <= y_raw <= 0xFFFF:
        raise ProtocolError("spot raw coordinates must be unsigned 16-bit values")
    payload = x_raw.to_bytes(2, "big") + y_raw.to_bytes(2, "big")
    return encode_frame(0x16, payload, header="aa", protocol_version=0)


def zone_clean_v0(points: list[tuple[int, int]], *, clean_times: int = 1) -> bytes:
    if len(points) < 3 or len(points) > 255:
        raise ProtocolError("zone requires 3..255 raw points")
    if not 1 <= clean_times <= 255:
        raise ProtocolError("clean_times must be 1..255")
    payload = bytearray([clean_times, 1, len(points)])
    for x_raw, y_raw in points:
        if not 0 <= x_raw <= 0xFFFF or not 0 <= y_raw <= 0xFFFF:
            raise ProtocolError("zone raw coordinates must be unsigned 16-bit values")
        payload.extend(x_raw.to_bytes(2, "big"))
        payload.extend(y_raw.to_bytes(2, "big"))
    return encode_frame(0x28, bytes(payload), header="aa", protocol_version=0)


def describe(raw: bytes, *, action: str, scalar_mode: str) -> dict[str, Any]:
    return {
        "classification": "S8_CANDIDATE_OFFLINE_ONLY",
        "action": action,
        "expected_scalar_mode": scalar_mode,
        "raw_hex": raw.hex(),
        "base64": base64.b64encode(raw).decode("ascii"),
        "warning": "Compare with an outbound Smart Life capture before any device write.",
    }


def _parse_room_ids(text: str) -> list[int]:
    return [int(part.strip(), 0) for part in text.split(",") if part.strip()]


def _parse_points(text: str) -> list[tuple[int, int]]:
    points = []
    for item in text.split(";"):
        x_text, y_text = item.split(",", 1)
        points.append((int(x_text.strip(), 0), int(y_text.strip(), 0)))
    return points


def main() -> int:
    parser = argparse.ArgumentParser(description="Build offline S8 legacy SET-frame candidates")
    sub = parser.add_subparsers(dest="kind", required=True)

    room = sub.add_parser("room")
    room.add_argument("room_ids", help="comma-separated byte IDs, e.g. 1 or 1,3")
    room.add_argument("--times", type=int, default=1)

    spot = sub.add_parser("spot")
    spot.add_argument("x", type=lambda v: int(v, 0))
    spot.add_argument("y", type=lambda v: int(v, 0))

    zone = sub.add_parser("zone")
    zone.add_argument("points", help="raw x,y pairs separated by ';', e.g. 1,2;3,4;5,6;7,8")
    zone.add_argument("--times", type=int, default=1)

    args = parser.parse_args()
    try:
        if args.kind == "room":
            raw = room_clean_v0(_parse_room_ids(args.room_ids), clean_times=args.times)
            result = describe(raw, action="room_clean_0x14", scalar_mode="part")
        elif args.kind == "spot":
            raw = spot_clean_v0(args.x, args.y)
            result = describe(raw, action="spot_clean_0x16", scalar_mode="pose")
        else:
            raw = zone_clean_v0(_parse_points(args.points), clean_times=args.times)
            result = describe(raw, action="zone_clean_0x28", scalar_mode="zone")
    except (ProtocolError, ValueError) as exc:
        parser.error(str(exc))
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
