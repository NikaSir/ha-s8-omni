"""Normalized S8 OMNI robot, station and composite status semantics."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from .const import (
    DP_BATTERY,
    DP_DUST,
    DP_FAULT,
    DP_MODE,
    DP_ROLL_CLEAN,
    DP_ROLL_DRY,
    DP_STATUS,
)

ROBOT_STATUS_OPTIONS = [
    "idle",
    "cleaning",
    "zone_cleaning",
    "room_cleaning",
    "paused",
    "going_to_position",
    "position_reached",
    "position_not_reached",
    "returning_to_dock",
    "charging",
    "charged",
    "sleeping",
    "error",
    "wall_following",
    "manual_control",
    "repositioning",
    "creating_map",
    "unknown",
]

STATION_STATUS_OPTIONS = [
    "idle",
    "dust_collection",
    "roller_cleaning",
    "drying",
    "multiple_operations",
    "unknown",
]

COMPOSITE_STATUS_OPTIONS = [
    "idle",
    "cleaning",
    "zone_cleaning",
    "room_cleaning",
    "paused",
    "returning_to_dock",
    "charging",
    "charged",
    "sleeping",
    "repositioning",
    "docked_dust_collection",
    "docked_roller_cleaning",
    "docked_drying",
    "docked_station_active",
    "error",
    "unknown",
]

ROBOT_STATUS_MAP = {
    "standby": "idle",
    "smart": "cleaning",
    "cleaning": "cleaning",
    "zone_clean": "zone_cleaning",
    "part_clean": "room_cleaning",
    "select_room": "room_cleaning",
    "paused": "paused",
    "goto_pos": "going_to_position",
    "pos_arrived": "position_reached",
    "pos_unarrive": "position_not_reached",
    "goto_charge": "returning_to_dock",
    "charging": "charging",
    "charge_done": "charged",
    "sleep": "sleeping",
    "fault": "error",
    "wall_follow": "wall_following",
    "direction_control": "manual_control",
    "repositing": "repositioning",
    "create_map": "creating_map",
}

ACTIVE_STATION_LABELS = {
    DP_DUST: "dust_collection",
    DP_ROLL_CLEAN: "roller_cleaning",
    DP_ROLL_DRY: "drying",
}


def _fault_active(value: Any) -> bool:
    return value not in (0, "0", None, False)


def robot_status(data: Mapping[int, Any]) -> str:
    """Return normalized robot status without inventing a normal state."""
    if _fault_active(data.get(DP_FAULT)):
        return "error"
    raw = data.get(DP_STATUS)
    if raw is None:
        return "unknown"
    return ROBOT_STATUS_MAP.get(str(raw), "unknown")


def station_operations(data: Mapping[int, Any]) -> list[str]:
    """Return all explicitly active station operations."""
    return [
        label
        for dp, label in ACTIVE_STATION_LABELS.items()
        if dp in data and data.get(dp) is True
    ]


def missing_station_dps(data: Mapping[int, Any]) -> list[int]:
    """Return station datapoints missing from an otherwise successful snapshot."""
    return [dp for dp in ACTIVE_STATION_LABELS if dp not in data]


def station_status(data: Mapping[int, Any]) -> str:
    """Return normalized station status.

    If more than one station operation is active, no arbitrary priority is
    invented: the state is ``multiple_operations`` and callers can inspect
    ``station_operations``. If no operation is active but at least one station
    datapoint is absent, the state is ``unknown`` rather than ``idle``.
    """
    operations = station_operations(data)
    if len(operations) > 1:
        return "multiple_operations"
    if len(operations) == 1:
        return operations[0]
    if missing_station_dps(data):
        return "unknown"
    return "idle"


def robot_on_dock(data: Mapping[int, Any]) -> bool | None:
    """Return dock presence only when it can be inferred safely."""
    raw = data.get(DP_STATUS)
    if raw in ("charging", "charge_done"):
        return True
    if station_operations(data):
        # These OMNI station operations require the robot to be physically docked.
        return True
    if raw in (
        "smart",
        "cleaning",
        "zone_clean",
        "part_clean",
        "select_room",
        "goto_charge",
        "goto_pos",
        "wall_follow",
        "direction_control",
        "create_map",
        "repositing",
    ):
        return False
    return None


def composite_status(data: Mapping[int, Any]) -> str:
    """Return the canonical robot + station status used by all UIs."""
    robot = robot_status(data)
    station = station_status(data)

    if robot == "error":
        return "error"

    if station == "dust_collection":
        return "docked_dust_collection"
    if station == "roller_cleaning":
        return "docked_roller_cleaning"
    if station == "drying":
        return "docked_drying"
    if station == "multiple_operations":
        return "docked_station_active"

    if robot in {
        "idle",
        "cleaning",
        "zone_cleaning",
        "room_cleaning",
        "paused",
        "returning_to_dock",
        "charging",
        "charged",
        "sleeping",
        "repositioning",
    }:
        return robot
    return "unknown"


def composite_attributes(data: Mapping[int, Any]) -> dict[str, Any]:
    """Return reusable factual context for generated and native UIs."""
    return {
        "raw_status": data.get(DP_STATUS),
        "robot_status": robot_status(data),
        "station_status": station_status(data),
        "station_operations": station_operations(data),
        "missing_station_dps": missing_station_dps(data),
        "robot_on_dock": robot_on_dock(data),
        "battery": data.get(DP_BATTERY),
        "mode": data.get(DP_MODE),
        "fault": data.get(DP_FAULT),
    }
