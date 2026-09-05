from pathlib import Path


def test_pause_uses_only_dp2_and_does_not_stop_power_go():
    source = Path("custom_components/s8_omni/vacuum.py").read_text(encoding="utf-8")

    start = source.index("    async def async_pause(self):")
    end = source.index("\n    async def async_return_to_base", start)
    pause_block = source[start:end]

    assert "DP_PAUSE" in pause_block
    assert "True" in pause_block
    assert "DP_POWER_GO" not in pause_block
    assert "async_set_dp" in pause_block
    assert "async_set_sequence" not in pause_block


def test_manifest_is_current_b086():
    manifest = Path("custom_components/s8_omni/manifest.json").read_text(encoding="utf-8")
    assert '"version": "1.0.0b86"' in manifest
