#!/usr/bin/env python3
"""Read-only raw Tuya DP monitor for S8 OMNI protocol research.

The script polls the device status and prints only datapoints that changed.
It never sends CONTROL commands and has no write code path.

Secrets are accepted from environment variables by default:
  S8_HOST
  S8_DEVICE_ID
  S8_LOCAL_KEY
  S8_PROTOCOL_VERSION (optional, default 3.3)

Short scalar/string values are preserved so a transient Raw command frame can
be analysed. Large values (for example map blobs) are not emitted: only type,
length and SHA-256 are recorded.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import time
from datetime import datetime, timezone
from typing import Any

MAX_INLINE_STRING = 4096
MAX_INLINE_BYTES = 4096


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def describe_value(value: Any) -> dict[str, Any]:
    """Return a bounded diagnostic representation of one DP value."""
    if value is None or isinstance(value, (bool, int, float)):
        return {"type": type(value).__name__, "value": value}

    if isinstance(value, bytes):
        if len(value) <= MAX_INLINE_BYTES:
            return {
                "type": "bytes",
                "length": len(value),
                "hex": value.hex(),
                "sha256": _sha256(value),
            }
        return {
            "type": "bytes",
            "length": len(value),
            "sha256": _sha256(value),
            "truncated": True,
        }

    if isinstance(value, str):
        encoded = value.encode("utf-8", errors="replace")
        out = {
            "type": "str",
            "length": len(value),
            "utf8_bytes": len(encoded),
            "sha256": _sha256(encoded),
        }
        if len(value) <= MAX_INLINE_STRING:
            out["value"] = value
        else:
            out["truncated"] = True
        return out

    try:
        rendered = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    except Exception:
        rendered = repr(value)
    encoded = rendered.encode("utf-8", errors="replace")
    out = {
        "type": type(value).__name__,
        "length": len(rendered),
        "sha256": _sha256(encoded),
    }
    if len(rendered) <= MAX_INLINE_STRING:
        out["value"] = rendered
    else:
        out["truncated"] = True
    return out


def normalize_dps(payload: Any) -> dict[int, Any]:
    """Normalize TinyTuya status response to int-keyed datapoints."""
    if not isinstance(payload, dict) or not isinstance(payload.get("dps"), dict):
        raise ValueError(f"unexpected Tuya status response: {payload!r}")
    result: dict[int, Any] = {}
    for key, value in payload["dps"].items():
        try:
            result[int(key)] = value
        except (TypeError, ValueError):
            continue
    return result


def diff_dps(previous: dict[int, Any] | None, current: dict[int, Any]) -> dict[int, Any]:
    """Return only new/changed datapoints; first sample returns every DP."""
    if previous is None:
        return dict(current)
    return {dp: value for dp, value in current.items() if previous.get(dp) != value or dp not in previous}


def event_record(changes: dict[int, Any], *, full_dp_ids: list[int]) -> dict[str, Any]:
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "reported_dp_ids": sorted(full_dp_ids),
        "changes": {str(dp): describe_value(value) for dp, value in sorted(changes.items())},
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Read-only S8 OMNI raw Tuya DP monitor")
    parser.add_argument("--host", default=os.getenv("S8_HOST"))
    parser.add_argument("--device-id", default=os.getenv("S8_DEVICE_ID"))
    parser.add_argument("--local-key", default=os.getenv("S8_LOCAL_KEY"))
    parser.add_argument(
        "--version",
        default=os.getenv("S8_PROTOCOL_VERSION", "3.3"),
        help="Tuya protocol version (default: 3.3)",
    )
    parser.add_argument("--interval", type=float, default=0.5, help="poll period in seconds")
    parser.add_argument("--duration", type=float, default=90.0, help="capture duration in seconds")
    parser.add_argument("--output", help="optional JSONL output file; stdout is always used")
    return parser


def _emit(record: dict[str, Any], output_handle) -> None:
    line = json.dumps(record, ensure_ascii=False, separators=(",", ":"))
    print(line, flush=True)
    if output_handle is not None:
        output_handle.write(line + "\n")
        output_handle.flush()


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    missing = [name for name, value in (("host", args.host), ("device-id", args.device_id), ("local-key", args.local_key)) if not value]
    if missing:
        print(
            "Missing connection settings: " + ", ".join(missing) + ". Prefer S8_HOST/S8_DEVICE_ID/S8_LOCAL_KEY environment variables.",
            file=sys.stderr,
        )
        return 2

    try:
        import tinytuya  # imported only for actual device capture
    except ImportError:
        print("tinytuya is required for live capture", file=sys.stderr)
        return 2

    device = tinytuya.Device(
        dev_id=args.device_id,
        address=args.host,
        local_key=args.local_key,
        version=float(args.version),
    )
    try:
        device.set_socketPersistent(False)
    except Exception:
        pass

    output_handle = open(args.output, "a", encoding="utf-8") if args.output else None
    previous: dict[int, Any] | None = None
    deadline = time.monotonic() + max(1.0, args.duration)

    try:
        _emit(
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event": "capture_started",
                "read_only": True,
                "interval": args.interval,
                "duration": args.duration,
            },
            output_handle,
        )
        while time.monotonic() < deadline:
            try:
                current = normalize_dps(device.status())
                changes = diff_dps(previous, current)
                if changes:
                    _emit(event_record(changes, full_dp_ids=list(current)), output_handle)
                previous = current
            except Exception as exc:
                _emit(
                    {
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "event": "read_failed",
                        "error_type": type(exc).__name__,
                    },
                    output_handle,
                )
            time.sleep(max(0.2, args.interval))
    except KeyboardInterrupt:
        pass
    finally:
        _emit(
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event": "capture_finished",
                "read_only": True,
            },
            output_handle,
        )
        if output_handle is not None:
            output_handle.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
