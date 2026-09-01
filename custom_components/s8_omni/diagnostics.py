"""Diagnostics for the S8 OMNI integration."""

from __future__ import annotations

from typing import Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import (
    CONF_DEVICE_ID,
    CONF_LOCAL_KEY,
    DOMAIN,
    DP_BATTERY,
    DP_CHILD_LOCK,
    DP_CLEAN_AREA,
    DP_CLEAN_TIME,
    DP_CUSTOM_MODE,
    DP_DND,
    DP_DUST,
    DP_FAULT,
    DP_FILTER_LIFE,
    DP_MAIN_BRUSH_LIFE,
    DP_MODE,
    DP_PAUSE,
    DP_POWER_GO,
    DP_RESUME_CLEANING,
    DP_ROLL_CLEAN,
    DP_ROLL_DRY,
    DP_SIDE_BRUSH_LIFE,
    DP_STATUS,
    DP_SUCTION,
    DP_VOLUME,
    DP_WATER,
    DP_WORK_MODE,
    VERSION,
    DASHBOARD_VERSION,
)
from .status import composite_attributes, composite_status, robot_status, station_status

TO_REDACT = {"host", CONF_DEVICE_ID, CONF_LOCAL_KEY}

SAFE_DP_NAMES = {
    DP_POWER_GO: "power_go",
    DP_PAUSE: "pause",
    DP_MODE: "mode",
    DP_STATUS: "status",
    DP_CLEAN_TIME: "clean_time",
    DP_CLEAN_AREA: "clean_area",
    DP_BATTERY: "battery",
    DP_SUCTION: "suction",
    DP_WATER: "water",
    DP_SIDE_BRUSH_LIFE: "side_brush_life",
    DP_MAIN_BRUSH_LIFE: "main_brush_life",
    DP_FILTER_LIFE: "filter_life",
    DP_DND: "do_not_disturb",
    DP_VOLUME: "volume",
    DP_RESUME_CLEANING: "resume_cleaning",
    DP_FAULT: "fault",
    DP_CUSTOM_MODE: "custom_mode",
    DP_WORK_MODE: "work_mode",
    DP_CHILD_LOCK: "child_lock",
    DP_DUST: "station_dust_collection",
    DP_ROLL_CLEAN: "station_roller_cleaning",
    DP_ROLL_DRY: "station_roller_drying",
}


def _safe_exception(coordinator) -> dict[str, str] | None:
    """Return a redacted coordinator exception summary."""
    err = coordinator.last_exception
    if err is None:
        return None

    message = str(err)
    for value in (coordinator.host, coordinator.device_id, coordinator.local_key):
        if value:
            message = message.replace(str(value), "**REDACTED**")

    return {"type": type(err).__name__, "message": message}


def _safe_datapoints(data: dict[int, Any]) -> dict[str, Any]:
    """Return only known non-secret scalar datapoints.

    Raw map/path/command/timer payloads are intentionally excluded from diagnostics.
    """
    return {
        name: data[dp]
        for dp, name in SAFE_DP_NAMES.items()
        if dp in data
    }


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: ConfigEntry
) -> dict[str, Any]:
    """Return sanitized diagnostics for a config entry."""
    coordinator = hass.data.get(DOMAIN, {}).get(entry.entry_id)

    result: dict[str, Any] = {
        "integration": {
            "version": VERSION,
            "dashboard_version": DASHBOARD_VERSION,
        },
        "entry_data": async_redact_data(dict(entry.data), TO_REDACT),
        "entry_options": async_redact_data(dict(entry.options), TO_REDACT),
    }

    if coordinator is None:
        result["coordinator"] = {"loaded": False}
        return result

    data = dict(coordinator.data or {})
    update_interval = coordinator.update_interval
    result["coordinator"] = {
        "loaded": True,
        "last_update_success": coordinator.last_update_success,
        "last_exception": _safe_exception(coordinator),
        "last_successful_update": (
            coordinator.last_successful_update.isoformat()
            if coordinator.last_successful_update is not None
            else None
        ),
        "update_interval_seconds": (
            update_interval.total_seconds() if update_interval is not None else None
        ),
        "reported_dp_ids": sorted(data),
        "diagnostic_capture_active": coordinator.diagnostic_capture_active,
        "diagnostic_capture_until": (
            coordinator.diagnostic_capture_until.isoformat()
            if coordinator.diagnostic_capture_until is not None
            else None
        ),
    }
    result["normalized_status"] = {
        "robot": robot_status(data),
        "station": station_status(data),
        "composite": composite_status(data),
        "attributes": composite_attributes(data),
    }
    result["safe_datapoints"] = _safe_datapoints(data)
    result["protocol_trace"] = list(coordinator.command_trace)
    return result
