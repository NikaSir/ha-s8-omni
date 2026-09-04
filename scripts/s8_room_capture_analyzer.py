#!/usr/bin/env python3
"""Analyze one Smart Life S8 room-clean capture from Frida logs.

Offline-only. Reads `[S8_DP_TX]` events emitted by
`research/s8_apk/frida_smartlife_publish_dps.js` and reports:
- chronological DP writes;
- DP15 RobotProtocol frames;
- legacy room SET 0x14 payloads (`cleanTimes`, `roomCount`, `roomIds`);
- scalar sequencing around DP4/DP1/DP2.

No network or device write path exists in this script.
"""

from __future__ import annotations

import argparse
import base64
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from tuya_robot_log_extract import split_frame_stream
from tuya_robot_protocol import ProtocolError

PREFIX = "[S8_DP_TX] "


@dataclass
class Event:
    index: int
    ts: str
    method: str
    dps: dict[str, Any]


def _decode_dps(value: Any) -> dict[str, Any]:
    if isinstance(value, dict):
        return {str(key): child for key, child in value.items()}
    if isinstance(value, str):
        text = value.strip()
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            return {}
        if isinstance(parsed, dict):
            return {str(key): child for key, child in parsed.items()}
    return {}


def parse_events(text: str) -> list[Event]:
    events: list[Event] = []
    for line in text.splitlines():
        pos = line.find(PREFIX)
        if pos < 0:
            continue
        payload = line[pos + len(PREFIX) :].strip()
        try:
            raw = json.loads(payload)
        except json.JSONDecodeError:
            continue
        dps = _decode_dps(raw.get("dps"))
        if not dps:
            continue
        events.append(
            Event(
                index=len(events),
                ts=str(raw.get("ts", "")),
                method=str(raw.get("method", "")),
                dps=dps,
            )
        )
    return events


def decode_room_set_14_base64(value: str) -> list[dict[str, Any]]:
    try:
        raw = base64.b64decode(value, validate=True)
    except Exception as exc:
        raise ProtocolError(f"invalid DP15 Base64: {exc}") from exc
    frames = split_frame_stream(raw, strict=True)
    room_sets: list[dict[str, Any]] = []
    for frame in frames:
        if frame.command != 0x14:
            continue
        data = frame.data
        if len(data) < 2:
            raise ProtocolError("room SET 0x14 payload too short")
        clean_times = data[0]
        room_count = data[1]
        if len(data) != 2 + room_count:
            raise ProtocolError("room SET 0x14 room count does not match payload length")
        room_sets.append(
            {
                "command": "0x14",
                "clean_times": clean_times,
                "room_count": room_count,
                "room_ids": list(data[2:]),
                "raw_hex": frame.raw.hex(),
                "base64": base64.b64encode(frame.raw).decode("ascii"),
            }
        )
    return room_sets


def analyze(text: str) -> dict[str, Any]:
    events = parse_events(text)
    timeline: list[dict[str, Any]] = []
    room_sets: list[dict[str, Any]] = []

    for event in events:
        for dp, value in event.dps.items():
            timeline.append(
                {
                    "event_index": event.index,
                    "ts": event.ts,
                    "method": event.method,
                    "dp": dp,
                    "value": value,
                }
            )
            if dp == "15" and isinstance(value, str):
                try:
                    decoded = decode_room_set_14_base64(value)
                except ProtocolError as exc:
                    room_sets.append(
                        {
                            "event_index": event.index,
                            "ts": event.ts,
                            "error": str(exc),
                            "raw_value": value,
                        }
                    )
                else:
                    for item in decoded:
                        room_sets.append({"event_index": event.index, "ts": event.ts, **item})

    scalar_sequence = [
        item for item in timeline if item["dp"] in {"1", "2", "4", "15"}
    ]
    return {
        "classification": "S8_OUTBOUND_CAPTURE_ANALYSIS",
        "event_count": len(events),
        "timeline": timeline,
        "scalar_and_command_sequence": scalar_sequence,
        "room_set_0x14": room_sets,
        "room_set_verified_in_capture": any("room_ids" in item for item in room_sets),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Analyze outbound Smart Life S8 room-clean Frida capture")
    parser.add_argument("input", help="Frida log file")
    args = parser.parse_args()
    text = Path(args.input).read_text(encoding="utf-8", errors="replace")
    print(json.dumps(analyze(text), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
