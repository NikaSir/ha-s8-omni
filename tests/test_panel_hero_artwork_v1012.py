from __future__ import annotations

import struct
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "custom_components" / "s8_omni" / "frontend" / "assets"
HERO_ASSETS = (
    "hero-away.webp",
    "hero-base.webp",
    "hero-charging.webp",
    "hero-cleaning.webp",
    "hero-dock.webp",
    "hero-dry.webp",
    "hero-dust.webp",
    "hero-error.webp",
    "hero-paused.webp",
    "hero-return.webp",
    "hero-wash.webp",
)


def _webp_dimensions(path: Path) -> tuple[int, int]:
    """Read WebP canvas dimensions without adding an image dependency to CI."""
    data = path.read_bytes()
    if data[:4] != b"RIFF" or data[8:12] != b"WEBP":
        raise AssertionError(f"{path.name} is not a RIFF WebP image")

    offset = 12
    while offset + 8 <= len(data):
        chunk_type = data[offset : offset + 4]
        chunk_size = struct.unpack_from("<I", data, offset + 4)[0]
        chunk = data[offset + 8 : offset + 8 + chunk_size]
        if chunk_type == b"VP8 " and len(chunk) >= 10:
            if chunk[3:6] != b"\x9d\x01\x2a":
                raise AssertionError(f"{path.name} has an invalid VP8 frame header")
            width, height = struct.unpack_from("<HH", chunk, 6)
            return width & 0x3FFF, height & 0x3FFF
        if chunk_type == b"VP8L" and len(chunk) >= 5:
            bits = int.from_bytes(chunk[1:5], "little")
            return (bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1
        if chunk_type == b"VP8X" and len(chunk) >= 10:
            width = int.from_bytes(chunk[4:7], "little") + 1
            height = int.from_bytes(chunk[7:10], "little") + 1
            return width, height
        offset += 8 + chunk_size + (chunk_size & 1)

    raise AssertionError(f"{path.name} has no supported WebP image chunk")


class PanelHeroArtworkV1012Tests(unittest.TestCase):
    def test_every_state_artwork_is_retina_ready_and_uses_one_canvas(self) -> None:
        expected_canvas = (1536, 1024)
        for name in HERO_ASSETS:
            with self.subTest(name=name):
                path = ASSET_DIR / name
                self.assertTrue(path.is_file(), f"missing state artwork: {name}")
                self.assertEqual(expected_canvas, _webp_dimensions(path))
                self.assertGreaterEqual(
                    path.stat().st_size,
                    40_000,
                    f"{name} is too aggressively compressed for a Retina hero",
                )


if __name__ == "__main__":
    unittest.main()
