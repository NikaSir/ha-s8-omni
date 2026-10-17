#!/usr/bin/env python3
"""Offline inspector for Tuya robot-vacuum binary command frames.

This utility is intentionally transport-free: it never connects to a device and
never writes a Tuya datapoint.  It decodes/encodes the public Tuya
RobotProtocol frame format and scans sanitized schema exports for datapoint
*codes*.  A numeric DP id is never treated as proof of a semantic role.

Source model:
- Standard frame: AA + version + length + command + data + checksum
- Extended frame: AB + 00 + 4-byte length + command + data + checksum
- Checksum: sum(command + data) modulo 256

The command catalogue is the public Tuya RobotProtocol catalogue.  Presence in
this catalogue does not prove that a particular S8 OMNI firmware implements the
command or which datapoint carries it.
"""

from __future__ import annotations

import argparse
import base64
import binascii
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterator, Mapping, Sequence


class ProtocolError(ValueError):
    """Raised when a frame or payload is malformed."""


@dataclass(frozen=True)
class CommandInfo:
    name: str
    direction: str
    family: str


COMMANDS: dict[int, CommandInfo] = {
    0x12: CommandInfo("virtual_wall_v1_set", "app_to_robot", "virtual_wall"),
    0x13: CommandInfo("virtual_wall_v1_report", "robot_to_app", "virtual_wall"),
    0x48: CommandInfo("virtual_wall_v2_set", "app_to_robot", "virtual_wall"),
    0x49: CommandInfo("virtual_wall_v2_report", "robot_to_app", "virtual_wall"),
    0x1A: CommandInfo("forbidden_area_v1_set", "app_to_robot", "forbidden_area"),
    0x1B: CommandInfo("forbidden_area_v1_report", "robot_to_app", "forbidden_area"),
    0x38: CommandInfo("forbidden_area_v2_set", "app_to_robot", "forbidden_area"),
    0x39: CommandInfo("forbidden_area_v2_report", "robot_to_app", "forbidden_area"),
    0x14: CommandInfo("room_clean_v1_set", "app_to_robot", "room_clean"),
    0x15: CommandInfo("room_clean_v1_report", "robot_to_app", "room_clean"),
    0x56: CommandInfo("room_clean_v2_set", "app_to_robot", "room_clean"),
    0x57: CommandInfo("room_clean_v2_report", "robot_to_app", "room_clean"),
    0x26: CommandInfo("room_order_set_or_request", "app_to_robot", "room_order"),
    0x27: CommandInfo("room_order_report", "robot_to_app", "room_order"),
    0x16: CommandInfo("spot_clean_v1_set", "app_to_robot", "spot_clean"),
    0x17: CommandInfo("spot_clean_v1_report", "robot_to_app", "spot_clean"),
    0x3E: CommandInfo("spot_clean_v2_set", "app_to_robot", "spot_clean"),
    0x3F: CommandInfo("spot_clean_v2_report", "robot_to_app", "spot_clean"),
    0x1C: CommandInfo("partition_split_set", "app_to_robot", "map_edit"),
    0x1D: CommandInfo("partition_split_result", "robot_to_app", "map_edit"),
    0x1E: CommandInfo("partition_merge_set", "app_to_robot", "map_edit"),
    0x1F: CommandInfo("partition_merge_result", "robot_to_app", "map_edit"),
    0x22: CommandInfo("room_property_v1_set", "app_to_robot", "room_property"),
    0x23: CommandInfo("room_property_v1_report", "robot_to_app", "room_property"),
    0x58: CommandInfo("room_property_v2_set", "app_to_robot", "room_property"),
    0x59: CommandInfo("room_property_v2_report", "robot_to_app", "room_property"),
    0x24: CommandInfo("room_name_set", "app_to_robot", "room_name"),
    0x25: CommandInfo("room_name_report", "robot_to_app", "room_name"),
    0x28: CommandInfo("zone_clean_v1_set", "app_to_robot", "zone_clean"),
    0x29: CommandInfo("zone_clean_v1_report", "robot_to_app", "zone_clean"),
    0x3A: CommandInfo("zone_clean_v2_set", "app_to_robot", "zone_clean"),
    0x3B: CommandInfo("zone_clean_v2_report", "robot_to_app", "zone_clean"),
    0x32: CommandInfo("dnd_v1_set", "app_to_robot", "dnd"),
    0x33: CommandInfo("dnd_v1_report", "robot_to_app", "dnd"),
    0x40: CommandInfo("dnd_v2_set", "app_to_robot", "dnd"),
    0x41: CommandInfo("dnd_v2_report", "robot_to_app", "dnd"),
    0x30: CommandInfo("local_timer_v1_set", "app_to_robot", "timer"),
    0x31: CommandInfo("local_timer_v1_report", "robot_to_app", "timer"),
    0x44: CommandInfo("local_timer_v2_set", "app_to_robot", "timer"),
    0x45: CommandInfo("local_timer_v2_report", "robot_to_app", "timer"),
    0x36: CommandInfo("ai_object_set", "app_to_robot", "ai"),
    0x37: CommandInfo("ai_object_report", "robot_to_app", "ai"),
    0x3C: CommandInfo("quick_map_start", "app_to_robot", "map"),
    0x3D: CommandInfo("quick_map_result", "robot_to_app", "map"),
    0x42: CommandInfo("map_reset", "app_to_robot", "map"),
    0x43: CommandInfo("map_reset_result", "robot_to_app", "map"),
    0x52: CommandInfo("room_floor_material_set", "app_to_robot", "room_property"),
    0x53: CommandInfo("room_floor_material_report", "robot_to_app", "room_property"),
    0x2A: CommandInfo("map_save", "app_to_robot", "map_management"),
    0x2B: CommandInfo("map_save_result", "robot_to_app", "map_management"),
    0x2C: CommandInfo("map_delete", "app_to_robot", "map_management"),
    0x2D: CommandInfo("map_delete_result", "robot_to_app", "map_management"),
    0x2E: CommandInfo("map_use", "app_to_robot", "map_management"),
    0x2F: CommandInfo("map_use_result", "robot_to_app", "map_management"),
    0x34: CommandInfo("voice_package_set", "app_to_robot", "voice"),
    0x35: CommandInfo("voice_package_report", "robot_to_app", "voice"),
}

SUCTION = {0: "closed", 1: "gentle", 2: "normal", 3: "strong", 4: "max"}
CISTERN = {0: "closed", 1: "low", 2: "middle", 3: "high"}
Y_MOP = {0: "off", 1: "on", 3: "high"}
CLEAN_MODE = {0: "both_work", 1: "only_sweep", 2: "only_mop", 3: "mop_after_sweep"}
FORBIDDEN_MODE = {0: "all", 1: "no_sweep", 2: "no_mop"}

SENSITIVE_KEYS = {
    "access_token",
    "accesstoken",
    "device_id",
    "deviceid",
    "dev_id",
    "devid",
    "gid",
    "host",
    "ip",
    "local_key",
    "localkey",
    "password",
    "refresh_token",
    "refreshtoken",
    "secret",
    "sid",
    "token",
    "uid",
    "uuid",
}

INTERESTING_CODES = {
    "basic_private",
    "command_trans",
    "device_info",
    "device_timer",
    "disturb_time_set",
    "map_data",
    "map_reset",
    "path_data",
    "pending_save_map",
    "request",
    "stream_data",
    "voice_data",
}

ROLE_BY_CODE = {
    "command_trans": "binary_command_transport_candidate",
    "map_data": "map_payload_candidate",
    "path_data": "path_payload_candidate",
    "request": "map_or_path_request_candidate",
    "device_info": "device_capability_payload_candidate",
    "device_timer": "binary_timer_transport_candidate",
    "disturb_time_set": "binary_dnd_transport_candidate",
    "pending_save_map": "map_state_flag_not_command_transport",
    "manual_status": "manual_control_state_not_command_transport",
}


@dataclass(frozen=True)
class Frame:
    header: str
    protocol_version: int
    length_field_bytes: int
    declared_command_and_data_length: int
    command: int
    data: bytes
    checksum: int
    calculated_checksum: int
    length_valid: bool
    checksum_valid: bool
    raw: bytes

    @property
    def command_info(self) -> CommandInfo | None:
        return COMMANDS.get(self.command)

    def to_dict(self, *, decode_payload_data: bool = True) -> dict[str, Any]:
        info = self.command_info
        result: dict[str, Any] = {
            "classification": "TUYA_STANDARD_NOT_S8_VERIFIED",
            "header": self.header,
            "protocol_version": self.protocol_version,
            "length_field_bytes": self.length_field_bytes,
            "declared_command_and_data_length": self.declared_command_and_data_length,
            "actual_command_and_data_length": 1 + len(self.data),
            "length_valid": self.length_valid,
            "command_hex": f"0x{self.command:02X}",
            "command_name": info.name if info else "unknown",
            "direction": info.direction if info else "unknown",
            "family": info.family if info else "unknown",
            "data_hex": self.data.hex(),
            "checksum_hex": f"0x{self.checksum:02X}",
            "calculated_checksum_hex": f"0x{self.calculated_checksum:02X}",
            "checksum_valid": self.checksum_valid,
            "raw_hex": self.raw.hex(),
        }
        if decode_payload_data:
            try:
                result["payload"] = decode_payload(self)
            except ProtocolError as exc:
                result["payload_error"] = str(exc)
        return result


def _strip_hex(value: str) -> str:
    value = value.strip()
    if value.lower().startswith(("base64:", "b64:")):
        _, encoded = value.split(":", 1)
        try:
            return base64.b64decode(encoded.strip(), validate=True).hex()
        except (binascii.Error, ValueError) as exc:
            raise ProtocolError(f"invalid base64 input: {exc}") from exc

    if len(value) >= 2 and value[0] == value[-1] == '"':
        try:
            decoded = json.loads(value)
        except json.JSONDecodeError:
            decoded = value[1:-1]
        if isinstance(decoded, str):
            value = decoded

    value = value.strip()
    value = re.sub(r"(?i)\b0x", "", value)
    value = re.sub(r"[\s:_.,;\-\[\](){}]+", "", value)
    if not value:
        raise ProtocolError("empty frame")
    if len(value) % 2:
        raise ProtocolError("hex input has an odd number of digits")
    if not re.fullmatch(r"(?i)[0-9a-f]+", value):
        raise ProtocolError("input is neither hexadecimal nor base64:<value>")
    return value.lower()


def decode_frame(value: str | bytes, *, strict: bool = True) -> Frame:
    """Decode one AA/AB Tuya RobotProtocol frame."""

    raw = bytes.fromhex(_strip_hex(value)) if isinstance(value, str) else bytes(value)
    if len(raw) < 5:
        raise ProtocolError("frame is too short")

    header = raw[0]
    protocol_version = raw[1]

    if header == 0xAA:
        if protocol_version == 0:
            length_field_bytes = 1
            command_offset = 3
            declared_length = raw[2]
        elif protocol_version == 1:
            if len(raw) < 8:
                raise ProtocolError("AA v1 frame is too short")
            length_field_bytes = 4
            command_offset = 6
            declared_length = int.from_bytes(raw[2:6], "big")
        else:
            raise ProtocolError(f"unsupported AA protocol version: {protocol_version}")
        header_name = "AA_STANDARD"
    elif header == 0xAB:
        if len(raw) < 8:
            raise ProtocolError("AB frame is too short")
        length_field_bytes = 4
        command_offset = 6
        declared_length = int.from_bytes(raw[2:6], "big")
        header_name = "AB_EXTENDED"
    else:
        raise ProtocolError(f"unsupported frame header: 0x{header:02X}")

    if declared_length < 1:
        raise ProtocolError("declared length must include at least the command byte")

    checksum_offset = command_offset + declared_length
    expected_total = checksum_offset + 1
    length_valid = len(raw) == expected_total
    if len(raw) < expected_total:
        raise ProtocolError(
            f"truncated frame: declared total {expected_total} bytes, received {len(raw)}"
        )
    if strict and len(raw) != expected_total:
        raise ProtocolError(
            f"trailing bytes: declared total {expected_total} bytes, received {len(raw)}"
        )

    command = raw[command_offset]
    data = raw[command_offset + 1 : checksum_offset]
    checksum = raw[checksum_offset]
    calculated = sum(raw[command_offset:checksum_offset]) & 0xFF
    checksum_valid = checksum == calculated

    if strict and not checksum_valid:
        raise ProtocolError(
            f"checksum mismatch: got 0x{checksum:02X}, expected 0x{calculated:02X}"
        )

    return Frame(
        header=header_name,
        protocol_version=protocol_version,
        length_field_bytes=length_field_bytes,
        declared_command_and_data_length=declared_length,
        command=command,
        data=data,
        checksum=checksum,
        calculated_checksum=calculated,
        length_valid=length_valid,
        checksum_valid=checksum_valid,
        raw=raw[:expected_total],
    )


def encode_frame(
    command: int,
    data: bytes = b"",
    *,
    header: str = "aa",
    protocol_version: int = 1,
) -> bytes:
    """Build an offline Tuya RobotProtocol frame without any transport."""

    if not 0 <= command <= 0xFF:
        raise ProtocolError("command must be in range 0..255")
    command_and_data = bytes([command]) + bytes(data)
    length = len(command_and_data)
    checksum = sum(command_and_data) & 0xFF
    header_normalized = header.lower()

    if header_normalized == "aa":
        if protocol_version == 0:
            if length > 0xFF:
                raise ProtocolError("AA v0 length exceeds one-byte field")
            return b"\xAA\x00" + bytes([length]) + command_and_data + bytes([checksum])
        if protocol_version == 1:
            return (
                b"\xAA\x01"
                + length.to_bytes(4, "big")
                + command_and_data
                + bytes([checksum])
            )
        raise ProtocolError("AA protocol version must be 0 or 1")

    if header_normalized == "ab":
        if protocol_version != 0:
            raise ProtocolError("public Tuya AB format uses protocol version 0")
        return (
            b"\xAB\x00"
            + length.to_bytes(4, "big")
            + command_and_data
            + bytes([checksum])
        )

    raise ProtocolError("header must be 'aa' or 'ab'")


def _enum(value: int, mapping: Mapping[int, str]) -> dict[str, Any]:
    return {"raw": value, "name": mapping.get(value, "unknown")}


def _tuya_signed_16(value: int) -> int:
    return value - 65535 if value > 32767 else value


def _point(data: bytes, offset: int) -> tuple[dict[str, Any], int]:
    if offset + 4 > len(data):
        raise ProtocolError("payload ends inside an X/Y coordinate pair")
    raw_x = int.from_bytes(data[offset : offset + 2], "big")
    raw_y = int.from_bytes(data[offset + 2 : offset + 4], "big")
    return (
        {
            "x_raw_u16": raw_x,
            "y_raw_u16": raw_y,
            "x_tuya_delta_units": _tuya_signed_16(raw_x),
            "y_tuya_delta_units": _tuya_signed_16(raw_y),
            "note": "origin and mapScale are required for absolute map coordinates",
        },
        offset + 4,
    )


def _require_exact(data: bytes, expected: int, name: str) -> None:
    if len(data) != expected:
        raise ProtocolError(f"{name}: expected {expected} data bytes, got {len(data)}")


def _parse_room_records(
    data: bytes,
    *,
    record_size: int,
    has_clean_mode: bool,
) -> dict[str, Any]:
    if not data:
        raise ProtocolError("room record payload is empty")
    count = data[0]
    expected = 1 + count * record_size
    _require_exact(data, expected, "room records")
    rooms: list[dict[str, Any]] = []
    offset = 1
    for _ in range(count):
        room_id = data[offset]
        offset += 1
        room: dict[str, Any] = {"room_id": room_id}
        if has_clean_mode:
            room["clean_mode"] = _enum(data[offset], CLEAN_MODE)
            offset += 1
        room["suction"] = _enum(data[offset], SUCTION)
        room["cistern"] = _enum(data[offset + 1], CISTERN)
        room["y_mop"] = _enum(data[offset + 2], Y_MOP)
        room["clean_times"] = data[offset + 3]
        offset += 4
        rooms.append(room)
    return {"room_count": count, "rooms": rooms}


def _parse_named_areas(
    data: bytes,
    *,
    protocol_version: int,
    forbidden: bool,
) -> dict[str, Any]:
    if len(data) < 2:
        raise ProtocolError("named-area payload is too short")
    count = data[1]
    offset = 2
    areas: list[dict[str, Any]] = []
    for index in range(count):
        area: dict[str, Any] = {"index": index}
        if forbidden:
            if offset >= len(data):
                raise ProtocolError("forbidden-area payload ends before mode")
            area["mode"] = _enum(data[offset], FORBIDDEN_MODE)
            offset += 1
            if protocol_version == 2:
                if offset >= len(data):
                    raise ProtocolError("forbidden-area payload ends before shape")
                area["shape_type"] = data[offset]
                offset += 1
        if offset >= len(data):
            raise ProtocolError("area payload ends before point count")
        point_count = data[offset]
        offset += 1
        points = []
        for _ in range(point_count):
            point, offset = _point(data, offset)
            points.append(point)
        if offset + 20 > len(data):
            raise ProtocolError("area payload ends inside fixed 19-byte name field")
        name_length = data[offset]
        offset += 1
        raw_name = data[offset : offset + 19]
        offset += 19
        area["point_count"] = point_count
        area["points"] = points
        area["name_length"] = name_length
        area["name"] = raw_name[:name_length].decode("utf-8", errors="replace")
        areas.append(area)
    if offset != len(data):
        raise ProtocolError(f"named-area payload has {len(data) - offset} trailing bytes")
    return {
        "area_protocol_version": protocol_version,
        "area_count": count,
        "areas": areas,
    }


def decode_payload(frame: Frame) -> dict[str, Any]:
    """Decode the known public Tuya payload shape for one frame."""

    cmd = frame.command
    data = frame.data

    if cmd in {0x14, 0x15}:
        if len(data) < 2:
            raise ProtocolError("room-clean v1 payload is too short")
        clean_times, count = data[0], data[1]
        _require_exact(data, 2 + count, "room-clean v1")
        return {
            "clean_times": clean_times,
            "room_count": count,
            "room_ids": list(data[2:]),
        }

    if cmd in {0x56, 0x57}:
        return _parse_room_records(data, record_size=5, has_clean_mode=False)

    if cmd in {0x22, 0x23}:
        return _parse_room_records(data, record_size=5, has_clean_mode=False)

    if cmd in {0x58, 0x59}:
        return _parse_room_records(data, record_size=6, has_clean_mode=True)

    if cmd in {0x26, 0x27}:
        if not data:
            return {"request_only": True, "room_count": 0, "room_ids": []}
        count = data[0]
        _require_exact(data, count + 1, "room-order")
        return {"room_count": count, "room_ids": list(data[1:])}

    if cmd in {0x24, 0x25}:
        if not data:
            raise ProtocolError("room-name payload is empty")
        count = data[0]
        offset = 1
        rooms = []
        for _ in range(count):
            if offset + 21 > len(data):
                raise ProtocolError("room-name payload ends inside a room record")
            room_id = data[offset]
            name_length = data[offset + 1]
            raw_name = data[offset + 2 : offset + 21]
            offset += 21
            rooms.append(
                {
                    "room_id": room_id,
                    "name_length": name_length,
                    "name": raw_name[:name_length].decode("utf-8", errors="replace"),
                }
            )
        if offset != len(data):
            raise ProtocolError(f"room-name payload has {len(data) - offset} trailing bytes")
        return {"room_count": count, "rooms": rooms}

    if cmd in {0x16, 0x17}:
        _require_exact(data, 4, "spot-clean v1")
        point, _ = _point(data, 0)
        return {"points": [point]}

    if cmd in {0x3E, 0x3F}:
        if not data:
            raise ProtocolError("spot-clean v2 payload is empty")
        pv = data[0]
        if pv == 1:
            _require_exact(data, 9, "spot-clean v2 protocol 1")
            point, _ = _point(data, 5)
            return {
                "spot_protocol_version": 1,
                "clean_mode": _enum(data[1], CLEAN_MODE),
                "suction": _enum(data[2], SUCTION),
                "cistern": _enum(data[3], CISTERN),
                "clean_times": data[4],
                "points": [point],
            }
        if pv == 2:
            if len(data) < 2:
                raise ProtocolError("spot-clean v2 protocol 2 payload is too short")
            count = data[1]
            _require_exact(data, 2 + count * 4, "spot-clean v2 protocol 2")
            points = []
            offset = 2
            for _ in range(count):
                point, offset = _point(data, offset)
                points.append(point)
            return {"spot_protocol_version": 2, "point_count": count, "points": points}
        raise ProtocolError(f"unsupported spot-clean payload protocol: {pv}")

    if cmd in {0x28, 0x29}:
        if len(data) < 2:
            raise ProtocolError("zone-clean v1 payload is too short")
        clean_times, count = data[0], data[1]
        zones = []
        offset = 2
        for index in range(count):
            if offset >= len(data):
                raise ProtocolError("zone-clean v1 payload ends before point count")
            point_count = data[offset]
            offset += 1
            points = []
            for _ in range(point_count):
                point, offset = _point(data, offset)
                points.append(point)
            zones.append({"index": index, "point_count": point_count, "points": points})
        if offset != len(data):
            raise ProtocolError(f"zone-clean v1 payload has {len(data) - offset} trailing bytes")
        return {"clean_times": clean_times, "zone_count": count, "zones": zones}

    if cmd in {0x3A, 0x3B}:
        if not data:
            raise ProtocolError("zone-clean v2 payload is empty")
        pv = data[0]
        if pv in {1, 2}:
            offset = 1
            result: dict[str, Any] = {"zone_protocol_version": pv}
            if pv == 2:
                if len(data) < 6:
                    raise ProtocolError("zone-clean protocol 2 payload is too short")
                result["clean_mode"] = _enum(data[offset], CLEAN_MODE)
                result["suction"] = _enum(data[offset + 1], SUCTION)
                result["cistern"] = _enum(data[offset + 2], CISTERN)
                offset += 3
            if offset + 2 > len(data):
                raise ProtocolError("zone-clean payload ends before counts")
            result["clean_times"] = data[offset]
            count = data[offset + 1]
            offset += 2
            sub = bytes([pv, count]) + data[offset:]
            parsed = _parse_named_areas(sub, protocol_version=pv, forbidden=False)
            result["zone_count"] = parsed["area_count"]
            result["zones"] = parsed["areas"]
            return result
        if pv == 3:
            if len(data) < 2:
                raise ProtocolError("zone-clean protocol 3 payload is too short")
            count = data[1]
            offset = 2
            zones = []
            for index in range(count):
                if offset + 4 > len(data):
                    raise ProtocolError("zone-clean protocol 3 record is truncated")
                zone_id, local_save, shape_type, point_count = data[offset : offset + 4]
                offset += 4
                points = []
                for _ in range(point_count):
                    point, offset = _point(data, offset)
                    points.append(point)
                if offset + 30 > len(data):
                    raise ProtocolError("zone-clean protocol 3 advanced record is truncated")
                clean_times = data[offset]
                order = data[offset + 1]
                clean_mode = data[offset + 2]
                suction = data[offset + 3]
                cistern = data[offset + 4]
                reserved = data[offset + 5 : offset + 10]
                name_length = data[offset + 10]
                name_raw = data[offset + 11 : offset + 30]
                offset += 30
                zones.append(
                    {
                        "index": index,
                        "id": zone_id,
                        "local_save": local_save,
                        "shape_type": shape_type,
                        "point_count": point_count,
                        "points": points,
                        "clean_times": clean_times,
                        "order": order,
                        "clean_mode": _enum(clean_mode, CLEAN_MODE),
                        "suction": _enum(suction, SUCTION),
                        "cistern": _enum(cistern, CISTERN),
                        "reserved_hex": reserved.hex(),
                        "name_length": name_length,
                        "name": name_raw[:name_length].decode("utf-8", errors="replace"),
                    }
                )
            if offset != len(data):
                raise ProtocolError(
                    f"zone-clean protocol 3 payload has {len(data) - offset} trailing bytes"
                )
            return {"zone_protocol_version": 3, "zone_count": count, "zones": zones}
        raise ProtocolError(f"unsupported zone-clean payload protocol: {pv}")

    if cmd in {0x12, 0x13}:
        if not data:
            raise ProtocolError("virtual-wall v1 payload is empty")
        count = data[0]
        _require_exact(data, 1 + count * 8, "virtual-wall v1")
        walls = []
        offset = 1
        for index in range(count):
            points = []
            for _ in range(2):
                point, offset = _point(data, offset)
                points.append(point)
            walls.append({"index": index, "points": points})
        return {"wall_count": count, "walls": walls}

    if cmd in {0x48, 0x49}:
        if len(data) < 2:
            raise ProtocolError("virtual-wall v2 payload is too short")
        pv, count = data[0], data[1]
        _require_exact(data, 2 + count * 9, "virtual-wall v2")
        walls = []
        offset = 2
        for index in range(count):
            mode = data[offset]
            offset += 1
            points = []
            for _ in range(2):
                point, offset = _point(data, offset)
                points.append(point)
            walls.append(
                {"index": index, "mode": _enum(mode, FORBIDDEN_MODE), "points": points}
            )
        return {"wall_protocol_version": pv, "wall_count": count, "walls": walls}

    if cmd in {0x1A, 0x1B}:
        if not data:
            raise ProtocolError("forbidden-area v1 payload is empty")
        count = data[0]
        offset = 1
        areas = []
        for index in range(count):
            if offset + 2 > len(data):
                raise ProtocolError("forbidden-area v1 record is truncated")
            mode, point_count = data[offset], data[offset + 1]
            offset += 2
            points = []
            for _ in range(point_count):
                point, offset = _point(data, offset)
                points.append(point)
            areas.append(
                {
                    "index": index,
                    "mode": _enum(mode, FORBIDDEN_MODE),
                    "point_count": point_count,
                    "points": points,
                }
            )
        if offset != len(data):
            raise ProtocolError(
                f"forbidden-area v1 payload has {len(data) - offset} trailing bytes"
            )
        return {"area_count": count, "areas": areas}

    if cmd in {0x38, 0x39}:
        if not data:
            raise ProtocolError("forbidden-area v2 payload is empty")
        pv = data[0]
        if pv not in {1, 2}:
            raise ProtocolError(f"unsupported forbidden-area payload protocol: {pv}")
        return _parse_named_areas(data, protocol_version=pv, forbidden=True)

    if cmd == 0x1C:
        _require_exact(data, 9, "partition split")
        first, offset = _point(data, 1)
        second, _ = _point(data, offset)
        return {"room_id": data[0], "line": [first, second]}

    if cmd == 0x1D:
        _require_exact(data, 1, "partition split result")
        return {"return_code": data[0], "success": data[0] == 1}

    if cmd == 0x1E:
        return {"room_ids": list(data)}

    if cmd == 0x1F:
        _require_exact(data, 1, "partition merge result")
        return {"return_code": data[0], "success": data[0] == 1}

    if cmd in {0x40, 0x41}:
        _require_exact(data, 9, "DND v2")
        tz = data[2] - 256 if data[2] > 200 else data[2]
        return {
            "dnd_protocol_version": data[0],
            "enabled": data[1] == 1,
            "time_zone_hours": tz,
            "start": {"hour": data[3], "minute": data[4], "day_offset": data[5]},
            "end": {"hour": data[6], "minute": data[7], "day_offset": data[8]},
        }

    if cmd in {0x3C, 0x3D, 0x42, 0x43}:
        return {"raw_status_or_request_hex": data.hex()}

    return {
        "decoded": False,
        "reason": "command is catalogued, but this offline inspector has no conservative payload decoder",
        "raw_data_hex": data.hex(),
    }


def _walk(value: Any, path: str = "$") -> Iterator[tuple[str, Any]]:
    yield path, value
    if isinstance(value, Mapping):
        for key, child in value.items():
            yield from _walk(child, f"{path}.{key}")
    elif isinstance(value, Sequence) and not isinstance(value, (str, bytes, bytearray)):
        for index, child in enumerate(value):
            yield from _walk(child, f"{path}[{index}]")


def _key_lower_map(item: Mapping[str, Any]) -> dict[str, str]:
    return {str(key).lower().replace("-", "_"): str(key) for key in item}


def _pick(item: Mapping[str, Any], *names: str) -> Any:
    keys = _key_lower_map(item)
    for name in names:
        original = keys.get(name.lower().replace("-", "_"))
        if original is not None:
            return item[original]
    return None


def _safe_metadata(item: Mapping[str, Any]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for out_key, aliases in {
        "dp_id": ("dp_id", "dpid", "dpId", "abilityId", "ability_id", "id"),
        "type": ("type", "dpType", "dp_type"),
        "mode": ("mode",),
        "property": ("property",),
        "range": ("range",),
        "maxlen": ("maxlen", "maxLen", "max_length"),
        "readable": ("readable", "canRead"),
        "writable": ("writable", "canWrite"),
    }.items():
        value = _pick(item, *aliases)
        if value is not None and not isinstance(value, (Mapping, list)):
            result[out_key] = value
        elif out_key in {"property", "range"} and value is not None:
            result[out_key] = redact(value)
    return result


def redact(value: Any) -> Any:
    """Redact common identifiers/secrets from arbitrary JSON-like data."""

    if isinstance(value, Mapping):
        result: dict[str, Any] = {}
        for key, child in value.items():
            normalized = str(key).lower().replace("-", "_")
            if normalized in SENSITIVE_KEYS:
                result[str(key)] = "<redacted>"
            else:
                result[str(key)] = redact(child)
        return result
    if isinstance(value, list):
        return [redact(child) for child in value]
    return value


def _looks_interesting_code(code: str) -> bool:
    normalized = code.lower()
    return (
        normalized in INTERESTING_CODES
        or normalized in ROLE_BY_CODE
        or any(token in normalized for token in ("command", "map", "path", "room", "zone"))
    )


def scan_schema(value: Any) -> dict[str, Any]:
    """Find datapoint definitions by semantic code, never by number alone."""

    candidates: list[dict[str, Any]] = []
    seen: set[tuple[str, str, str]] = set()

    for path, item in _walk(value):
        if not isinstance(item, Mapping):
            continue

        code = _pick(item, "code", "dpCode", "dp_code", "identifier")
        if isinstance(code, str) and _looks_interesting_code(code):
            meta = _safe_metadata(item)
            dp_id = meta.get("dp_id")
            key = (code, str(dp_id), path)
            if key not in seen:
                candidates.append(
                    {
                        "path": path,
                        "code": code,
                        "role": ROLE_BY_CODE.get(code.lower(), "related_datapoint"),
                        **meta,
                    }
                )
                seen.add(key)

        for raw_key, child in item.items():
            key_code = str(raw_key)
            if not _looks_interesting_code(key_code) or not isinstance(child, Mapping):
                continue
            meta = _safe_metadata(child)
            dp_id = meta.get("dp_id")
            dedupe_key = (key_code, str(dp_id), f"{path}.{key_code}")
            if dedupe_key not in seen:
                candidates.append(
                    {
                        "path": f"{path}.{key_code}",
                        "code": key_code,
                        "role": ROLE_BY_CODE.get(key_code.lower(), "related_datapoint"),
                        **meta,
                    }
                )
                seen.add(dedupe_key)

    candidates.sort(key=lambda item: (str(item.get("code")), str(item.get("dp_id"))))
    command_trans = [
        item for item in candidates if str(item.get("code", "")).lower() == "command_trans"
    ]
    warnings: list[str] = []
    if not command_trans:
        warnings.append(
            "No datapoint with code 'command_trans' was found. Do not guess its numeric DP id."
        )
    else:
        for item in command_trans:
            if "dp_id" not in item:
                warnings.append("A 'command_trans' definition was found without a numeric DP id.")

    for item in candidates:
        if str(item.get("dp_id")) == "145" and str(item.get("code", "")).lower() != "command_trans":
            warnings.append(
                f"DP145 is '{item.get('code')}', not 'command_trans'; it must not receive binary commands."
            )

    return {
        "classification": "SCHEMA_EVIDENCE",
        "binding_rule": "bind by exact datapoint code; never infer role from numeric DP id",
        "command_transport_confirmed": bool(command_trans and all("dp_id" in x for x in command_trans)),
        "command_transport_candidates": command_trans,
        "related_datapoints": candidates,
        "warnings": sorted(set(warnings)),
    }


_CONTINUOUS_FRAME_RE = re.compile(r"(?i)(?<![0-9a-f])(?:aa|ab)[0-9a-f]{8,}(?![0-9a-f])")


def _all_strings(value: Any) -> Iterator[str]:
    if isinstance(value, str):
        yield value
    elif isinstance(value, Mapping):
        for key, child in value.items():
            yield str(key)
            yield from _all_strings(child)
    elif isinstance(value, Sequence) and not isinstance(value, (bytes, bytearray, str)):
        for child in value:
            yield from _all_strings(child)


def extract_frames(value: Any, *, strict: bool = False) -> list[dict[str, Any]]:
    """Extract valid AA/AB frames from text or JSON-like input."""

    found: dict[str, dict[str, Any]] = {}
    for text in _all_strings(value):
        candidates = list(_CONTINUOUS_FRAME_RE.findall(text))
        stripped = text.strip()
        if stripped.lower().startswith(("aa", "ab", "base64:", "b64:")):
            candidates.append(stripped)
        for candidate in candidates:
            try:
                frame = decode_frame(candidate, strict=strict)
            except ProtocolError:
                continue
            found.setdefault(frame.raw.hex(), frame.to_dict())
    return list(found.values())


def _load_input(path_or_value: str) -> Any:
    try:
        path = Path(path_or_value)
        is_file = path.exists()
    except OSError:
        is_file = False
        path = Path(".")
    if is_file:
        raw = path.read_bytes()
        try:
            text = raw.decode("utf-8")
        except UnicodeDecodeError:
            return {"binary_base64": base64.b64encode(raw).decode("ascii")}
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return text
    try:
        return json.loads(path_or_value)
    except json.JSONDecodeError:
        return path_or_value


def _parse_command(value: str) -> int:
    parsed = int(value, 0)
    if not 0 <= parsed <= 0xFF:
        raise argparse.ArgumentTypeError("command must be in range 0..255")
    return parsed


def _json_dump(value: Any) -> None:
    print(json.dumps(value, ensure_ascii=False, indent=2, sort_keys=False))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Offline Tuya RobotProtocol frame/schema inspector (no device writes)."
    )
    sub = parser.add_subparsers(dest="action", required=True)

    frame_parser = sub.add_parser("frame", help="decode one AA/AB frame")
    frame_parser.add_argument("value", help="hex, base64:<value>, or path to a text file")
    frame_parser.add_argument(
        "--relaxed",
        action="store_true",
        help="report invalid checksum/trailing bytes instead of rejecting them",
    )

    encode_parser = sub.add_parser("encode", help="construct one offline generic frame")
    encode_parser.add_argument("command", type=_parse_command, help="command byte, e.g. 0x14")
    encode_parser.add_argument("--data", default="", help="hex payload after the command byte")
    encode_parser.add_argument("--header", choices=("aa", "ab"), default="aa")
    encode_parser.add_argument("--version", choices=(0, 1), default=1, type=int)

    schema_parser = sub.add_parser(
        "schema", help="scan a sanitized Tuya schema/device-info JSON export"
    )
    schema_parser.add_argument("input", help="JSON path or inline JSON")

    extract_parser = sub.add_parser(
        "extract", help="extract valid AA/AB frames from a text or JSON file"
    )
    extract_parser.add_argument("input", help="text/JSON path or inline value")
    extract_parser.add_argument(
        "--strict",
        action="store_true",
        help="require exact length and checksum for extracted frames",
    )

    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    try:
        if args.action == "frame":
            loaded = _load_input(args.value)
            if not isinstance(loaded, str):
                raise ProtocolError("frame input must resolve to one string")
            _json_dump(decode_frame(loaded, strict=not args.relaxed).to_dict())
            return 0

        if args.action == "encode":
            data = bytes.fromhex(_strip_hex(args.data)) if args.data else b""
            raw = encode_frame(
                args.command,
                data,
                header=args.header,
                protocol_version=args.version,
            )
            _json_dump(
                {
                    "classification": "TUYA_STANDARD_NOT_S8_VERIFIED",
                    "transport": "offline_only",
                    "raw_hex": raw.hex(),
                    "decoded": decode_frame(raw).to_dict(),
                }
            )
            return 0

        if args.action == "schema":
            _json_dump(scan_schema(_load_input(args.input)))
            return 0

        if args.action == "extract":
            _json_dump(
                {
                    "classification": "TUYA_STANDARD_NOT_S8_VERIFIED",
                    "frames": extract_frames(_load_input(args.input), strict=args.strict),
                }
            )
            return 0

        parser.error("unknown action")
    except (ProtocolError, OSError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
