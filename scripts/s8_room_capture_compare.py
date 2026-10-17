#!/usr/bin/env python3
"""Compare multiple outbound Smart Life S8 room-clean captures offline.

The tool consumes Frida log files accepted by ``s8_room_capture_analyzer.py``.
It extracts the first valid DP15/0x14 room SET from each capture and reports:
- clean-times and room IDs;
- raw frame equality;
- data-byte positions that differ between captures;
- whether repeated captures of an identical room selection are byte-identical.

No device transport or write path exists here.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from s8_room_capture_analyzer import analyze


def _first_room_set(text: str) -> dict[str, Any] | None:
    result = analyze(text)
    for item in result["room_set_0x14"]:
        if "room_ids" in item:
            return item
    return None


def compare_captures(named_texts: list[tuple[str, str]]) -> dict[str, Any]:
    captures: list[dict[str, Any]] = []
    for name, text in named_texts:
        room_set = _first_room_set(text)
        captures.append({"name": name, "room_set": room_set})

    valid = [item for item in captures if item["room_set"] is not None]
    payloads: list[bytes] = []
    for item in valid:
        raw = bytes.fromhex(item["room_set"]["raw_hex"])
        # AA v0: header/version/length, then command. Compare cmd+data only;
        # checksum is derived and therefore intentionally excluded.
        payloads.append(raw[3:-1])

    differing_positions: list[dict[str, Any]] = []
    if payloads and len({len(payload) for payload in payloads}) == 1:
        width = len(payloads[0])
        for index in range(width):
            values = [payload[index] for payload in payloads]
            if len(set(values)) > 1:
                differing_positions.append(
                    {
                        "cmd_data_offset": index,
                        "values_hex": [f"{value:02x}" for value in values],
                    }
                )

    identical_selection_groups: dict[str, list[str]] = {}
    for item in valid:
        selection = ",".join(str(value) for value in item["room_set"]["room_ids"])
        identical_selection_groups.setdefault(selection, []).append(item["room_set"]["raw_hex"])

    stability = {
        selection: len(set(frames)) == 1
        for selection, frames in identical_selection_groups.items()
        if len(frames) > 1
    }

    return {
        "classification": "S8_OUTBOUND_ROOM_CAPTURE_COMPARISON",
        "captures": captures,
        "valid_capture_count": len(valid),
        "differing_cmd_data_positions": differing_positions,
        "same_selection_byte_identical": stability,
        "interpretation_hint": {
            "cmd_data_offset_0": "command byte (expected 0x14)",
            "cmd_data_offset_1": "cleanTimes",
            "cmd_data_offset_2": "roomCount",
            "cmd_data_offset_3_plus": "roomIds",
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Compare outbound S8 room-clean Frida captures")
    parser.add_argument("inputs", nargs="+", help="two or more Frida log files")
    args = parser.parse_args()
    if len(args.inputs) < 2:
        parser.error("at least two capture files are required")
    named_texts = [
        (path, Path(path).read_text(encoding="utf-8", errors="replace")) for path in args.inputs
    ]
    print(json.dumps(compare_captures(named_texts), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
