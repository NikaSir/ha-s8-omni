#!/usr/bin/env python3
"""Decode S8 OMNI legacy Tuya RobotProtocol payloads observed on the real device.

Offline-only helper. It contains no device transport and no write path.

Supported actual S8 evidence:
- DP15 concatenated legacy AA 00 RobotProtocol frames;
- DP32 timer report 0x31;
- DP33 DND report 0x33;
- DP35 extended voice report 0x35.
"""

from __future__ import annotations

import argparse
import base64
import json
from typing import Any

from tuya_robot_log_extract import split_frame_stream
from tuya_robot_protocol import Frame, ProtocolError, decode_frame


S8_LEGACY_COMPLEX_ORDER = (0x17, 0x13, 0x1B, 0x29, 0x15)


def _signed_u8(value: int) -> int:
    return value - 256 if value > 127 else value


def decode_timer_31(frame: Frame) -> dict[str, Any]:
    if frame.command != 0x31:
        raise ProtocolError(f"expected timer report 0x31, got 0x{frame.command:02X}")
    data = frame.data
    if len(data) < 2:
        raise ProtocolError("timer payload too short")

    timezone_hours = _signed_u8(data[0])
    count = data[1]
    offset = 2
    timers: list[dict[str, Any]] = []

    for index in range(count):
        if offset + 5 > len(data):
            raise ProtocolError("timer record truncated before room list")
        enabled = data[offset] == 1
        week_mask = data[offset + 1]
        hour = data[offset + 2]
        minute = data[offset + 3]
        room_count = data[offset + 4]
        offset += 5

        if offset + room_count + 4 > len(data):
            raise ProtocolError("timer record truncated")
        room_ids = list(data[offset : offset + room_count])
        offset += room_count
        clean_mode, fan_level, water_level, clean_count = data[offset : offset + 4]
        offset += 4

        timers.append(
            {
                "index": index,
                "enabled": enabled,
                "week_mask_hex": f"0x{week_mask:02X}",
                "week_bits_monday_first": [bool(week_mask & (1 << bit)) for bit in range(7)],
                "time": f"{hour:02d}:{minute:02d}",
                "room_count": room_count,
                "room_ids": room_ids,
                "clean_mode_raw": clean_mode,
                "fan_level_raw": fan_level,
                "water_level_raw": water_level,
                "clean_count": clean_count,
            }
        )

    if offset != len(data):
        raise ProtocolError(f"timer payload has {len(data) - offset} trailing bytes")

    return {
        "command": "0x31",
        "timezone_hours": timezone_hours,
        "timer_count": count,
        "timers": timers,
    }


def decode_dnd_33(frame: Frame) -> dict[str, Any]:
    if frame.command != 0x33:
        raise ProtocolError(f"expected DND report 0x33, got 0x{frame.command:02X}")
    data = frame.data
    if len(data) != 7:
        raise ProtocolError(f"DND 0x33 expected 7 data bytes, got {len(data)}")
    return {
        "command": "0x33",
        "timezone_hours_raw_signed": _signed_u8(data[0]),
        "start": f"{data[1]:02d}:{data[2]:02d}",
        "start_day_offset": data[3],
        "end": f"{data[4]:02d}:{data[5]:02d}",
        "end_day_offset": data[6],
    }


def decode_voice_35(frame: Frame) -> dict[str, Any]:
    if frame.command != 0x35:
        raise ProtocolError(f"expected voice report 0x35, got 0x{frame.command:02X}")
    data = frame.data
    if len(data) != 6:
        raise ProtocolError(f"voice 0x35 expected 6 data bytes, got {len(data)}")
    return {
        "command": "0x35",
        "language_id": int.from_bytes(data[0:4], "big"),
        "status": data[4],
        "progress": data[5],
    }


def decode_room_15(frame: Frame) -> dict[str, Any]:
    """Decode legacy room-clean state/report shape: times, count, room IDs."""
    if frame.command != 0x15:
        raise ProtocolError(f"expected room state 0x15, got 0x{frame.command:02X}")
    data = frame.data
    if len(data) < 2:
        raise ProtocolError("room 0x15 payload too short for state/report")
    clean_times = data[0]
    room_count = data[1]
    if len(data) != 2 + room_count:
        raise ProtocolError("room 0x15 room count does not match payload length")
    return {
        "command": "0x15",
        "clean_times": clean_times,
        "room_count": room_count,
        "room_ids": list(data[2:]),
    }


def decode_zone_29_header(frame: Frame) -> dict[str, Any]:
    """Decode the stable leading fields of legacy zone-clean state/report."""
    if frame.command != 0x29:
        raise ProtocolError(f"expected zone state 0x29, got 0x{frame.command:02X}")
    data = frame.data
    if len(data) < 2:
        raise ProtocolError("zone 0x29 payload too short for state/report")
    return {
        "command": "0x29",
        "clean_times": data[0],
        "zone_count": data[1],
        "remaining_payload_hex": data[2:].hex(),
    }


def _frame_semantics(frame: Frame) -> dict[str, Any]:
    item: dict[str, Any] = {"command": f"0x{frame.command:02X}"}
    if frame.command == 0x15 and len(frame.data) >= 2:
        item.update({"kind": "room_state_shape", **decode_room_15(frame)})
    elif frame.command == 0x29 and len(frame.data) >= 2:
        item.update({"kind": "zone_state_shape", **decode_zone_29_header(frame)})
    elif frame.command == 0x13 and frame.data == b"\x00":
        item.update({"kind": "virtual_wall_empty_state_shape", "wall_count": 0})
    elif frame.command == 0x1B and frame.data == b"\x00":
        item.update({"kind": "restricted_area_empty_state_shape", "area_count": 0})
    elif frame.command == 0x17 and not frame.data:
        item.update({"kind": "spot_query_shape_or_empty_counterpart"})
    else:
        item.update({"kind": "unclassified"})
    return item


def _classify_command_bundle(frames: list[Frame]) -> dict[str, Any]:
    commands = tuple(frame.command for frame in frames)
    if commands == S8_LEGACY_COMPLEX_ORDER:
        return {
            "bundle_classification": "S8_LEGACY_COMPLEX_STATE_BUNDLE",
            "direction": "NOT_PROVEN_FROM_STATUS_SNAPSHOT",
            "frame_semantics": [_frame_semantics(frame) for frame in frames],
            "interpretation": (
                "The opcode family matches Tuya legacy complex controls, but this saved status value "
                "must not be labelled App-to-Robot. Official V0 query frames for 0x13/0x15/0x29 "
                "contain no payload, while the S8 snapshot carries zero-count payloads for several "
                "counterpart opcodes. Treat it as a legacy complex-state snapshot until an outbound "
                "publishDps capture proves direction."
            ),
        }
    return {
        "bundle_classification": "UNCLASSIFIED_LEGACY_FRAME_BUNDLE",
        "direction": "UNKNOWN",
        "frame_semantics": [_frame_semantics(frame) for frame in frames],
    }


def decode_command_trans_bundle(value: str) -> dict[str, Any]:
    try:
        raw = base64.b64decode(value, validate=True)
    except Exception as exc:
        raise ProtocolError(f"invalid Base64 command_trans: {exc}") from exc
    frames = split_frame_stream(raw, strict=True)
    result = {
        "frame_count": len(frames),
        "frames": [frame.to_dict() for frame in frames],
    }
    result.update(_classify_command_bundle(frames))
    return result


def decode_named(kind: str, value: str) -> dict[str, Any]:
    if kind == "command_trans":
        return decode_command_trans_bundle(value)

    frame = decode_frame(f"base64:{value}")
    if kind == "timer":
        return decode_timer_31(frame)
    if kind == "dnd":
        return decode_dnd_33(frame)
    if kind == "voice":
        return decode_voice_35(frame)
    if kind == "room":
        return decode_room_15(frame)
    if kind == "zone":
        return decode_zone_29_header(frame)
    raise ProtocolError(f"unsupported kind: {kind}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Decode real S8 legacy Raw-DP payloads offline")
    parser.add_argument("kind", choices=("command_trans", "timer", "dnd", "voice", "room", "zone"))
    parser.add_argument("value", help="Base64 Raw DP value")
    args = parser.parse_args()
    try:
        result = decode_named(args.kind, args.value)
    except ProtocolError as exc:
        parser.error(str(exc))
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
