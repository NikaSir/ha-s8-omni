from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
VACUUM = (ROOT / "custom_components" / "s8_omni" / "vacuum.py").read_text(encoding="utf-8")


def test_return_waits_for_standby_not_paused() -> None:
    assert 'str(data.get(DP_STATUS)) == "standby"' in VACUUM
    assert 'str(data.get(DP_STATUS)) in {"standby", "paused"}' not in VACUUM
    assert "timeout=25.0" in VACUUM


def test_chargego_is_sent_only_after_standby_wait() -> None:
    standby_wait = VACUUM.index('str(data.get(DP_STATUS)) == "standby"')
    chargego_write = VACUUM.index('"chargego"', standby_wait)
    assert standby_wait < chargego_write
    assert "Пылесос остановился, но не перешёл в режим ожидания" in VACUUM
