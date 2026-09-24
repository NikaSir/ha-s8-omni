#!/usr/bin/env python3
"""Extract Tuya RobotProtocol frames from Smart Life / Frida / JSON logs.

This is an offline-only helper. It recognizes:
- plain AA/AB hex frames;
- `base64:` / `b64:` prefixed frames;
- ordinary unprefixed Base64 strings whose decoded bytes start with AA/AB;
- multiple AA/AB frames concatenated into one Raw DP value.

It delegates individual frame validation and payload decoding to
``tuya_robot_protocol.py``. No network or device-write code exists here.
"""

from __future__ import annotations

import argparse
import base64
import binascii
import json
import re
from pathlib import Path
from typing import Any, Iterator, Mapping, Sequence

from tuya_robot_protocol import ProtocolError, decode_frame

_HEX_RE = re.compile(r"(?i)(?<![0-9a-f])(?:aa|ab)[0-9a-f]{8,}(?![0-9a-f])")
_BASE64_RE = re.compile(r"^[A-Za-z0-9+/]+={0,2}$")


def _all_strings(value: Any) -> Iterator[str]:
    if isinstance(value, str):
        yield value
    elif isinstance(value, Mapping):
        for key, child in value.items():
            yield str(key)
            yield from _all_strings(child)
    elif isinstance(value, Sequence) and not isinstance(value, (str, bytes, bytearray)):
        for child in value:
            yield from _all_strings(child)


def _decode_unprefixed_base64(text: str) -> bytes | None:
    """Return decoded AA/AB bytes for a plausible unprefixed Base64 value."""
    candidate = text.strip()
    if len(candidate) < 8 or len(candidate) % 4 != 0 or not _BASE64_RE.fullmatch(candidate):
        return None
    try:
        raw = base64.b64decode(candidate, validate=True)
    except (binascii.Error, ValueError):
        return None
    if len(raw) < 5 or raw[0] not in (0xAA, 0xAB):
        return None
    return raw


def _frame_total_length(raw: bytes, offset: int) -> int:
    """Return one framed command length in bytes, including checksum."""
    remaining = len(raw) - offset
    if remaining < 4:
        raise ProtocolError("truncated frame header")

    header = raw[offset]
    version = raw[offset + 1]
    if header == 0xAA and version == 0:
        declared = raw[offset + 2]
        return 3 + declared + 1
    if header == 0xAA and version == 1:
        if remaining < 7:
            raise ProtocolError("truncated AA v1 frame header")
        declared = int.from_bytes(raw[offset + 2 : offset + 6], "big")
        return 6 + declared + 1
    if header == 0xAB:
        if remaining < 7:
            raise ProtocolError("truncated AB frame header")
        declared = int.from_bytes(raw[offset + 2 : offset + 6], "big")
        return 6 + declared + 1
    raise ProtocolError(f"unsupported frame header/version at offset {offset}")


def split_frame_stream(raw: bytes, *, strict: bool = True) -> list:
    """Split a Raw DP byte stream containing one or more consecutive frames."""
    frames = []
    offset = 0
    while offset < len(raw):
        total = _frame_total_length(raw, offset)
        if total <= 0 or offset + total > len(raw):
            raise ProtocolError("truncated concatenated RobotProtocol stream")
        chunk = raw[offset : offset + total]
        frames.append(decode_frame(chunk, strict=strict))
        offset += total
    return frames


def _candidate_frames(candidate: str | bytes, *, strict: bool) -> list:
    """Decode a candidate that can be a single frame or a concatenated stream."""
    if isinstance(candidate, bytes):
        return split_frame_stream(candidate, strict=strict)

    lowered = candidate.lower()
    if lowered.startswith(("base64:", "b64:")):
        _, encoded = candidate.split(":", 1)
        try:
            raw = base64.b64decode(encoded.strip(), validate=True)
        except (binascii.Error, ValueError) as exc:
            raise ProtocolError(f"invalid base64 input: {exc}") from exc
        return split_frame_stream(raw, strict=strict)

    return [decode_frame(candidate, strict=strict)]


def extract_frames(value: Any, *, strict: bool = True) -> list[dict[str, Any]]:
    """Extract and deduplicate valid RobotProtocol frames from arbitrary JSON/text."""
    found: dict[str, dict[str, Any]] = {}

    for text in _all_strings(value):
        candidates: list[str | bytes] = list(_HEX_RE.findall(text))
        stripped = text.strip()

        if stripped.lower().startswith(("base64:", "b64:")):
            candidates.append(stripped)
        elif stripped.lower().startswith(("aa", "ab")):
            candidates.append(stripped)
        else:
            raw = _decode_unprefixed_base64(stripped)
            if raw is not None:
                candidates.append(raw)

        for candidate in candidates:
            try:
                frames = _candidate_frames(candidate, strict=strict)
            except (ProtocolError, ValueError):
                continue
            source_encoding = "base64" if isinstance(candidate, bytes) or (
                isinstance(candidate, str) and candidate.lower().startswith(("base64:", "b64:"))
            ) else "hex"
            for frame in frames:
                item = frame.to_dict()
                item["source_encoding"] = source_encoding
                found.setdefault(frame.raw.hex(), item)

    return list(found.values())


def _load(path_or_value: str) -> Any:
    try:
        path = Path(path_or_value)
        is_file = path.exists()
    except OSError:
        is_file = False
        path = Path(".")
    if is_file:
        text = path.read_text(encoding="utf-8", errors="replace")
    else:
        text = path_or_value
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return text


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Extract valid AA/AB Tuya RobotProtocol frames from logs (offline only)."
    )
    parser.add_argument("input", help="text/JSON path or inline value")
    parser.add_argument(
        "--relaxed",
        action="store_true",
        help="allow checksum/trailing-byte issues to be reported by the decoder",
    )
    args = parser.parse_args(argv)
    print(
        json.dumps(
            {
                "classification": "TUYA_STANDARD_NOT_S8_VERIFIED",
                "frames": extract_frames(_load(args.input), strict=not args.relaxed),
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
