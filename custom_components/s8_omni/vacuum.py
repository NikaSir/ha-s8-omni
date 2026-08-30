from homeassistant.components.vacuum import StateVacuumEntity, VacuumEntityFeature

from .const import (
    DOMAIN,
    DP_BATTERY,
    DP_FAULT,
    DP_MODE,
    DP_PAUSE,
    DP_POWER_GO,
    DP_STATUS,
    DP_SUCTION,
    SUCTION_OPTIONS,
)
from .entity import S8OmniEntity

STATUS_MAP = {
    "cleaning": "cleaning",
    "smart": "cleaning",
    "zone_clean": "cleaning",
    "part_clean": "cleaning",
    "select_room": "cleaning",
    "wall_follow": "cleaning",
    "direction_control": "cleaning",
    "paused": "paused",
    "goto_charge": "returning",
    "repositing": "returning",
    "charging": "docked",
    "charge_done": "docked",
    "standby": "idle",
    "sleep": "idle",
    "goto_pos": "cleaning",
    "pos_arrived": "idle",
    "pos_unarrive": "idle",
    "create_map": "cleaning",
    "fault": "error",
}


async def async_setup_entry(hass, entry, async_add_entities):
    async_add_entities([S8OmniVacuum(hass.data[DOMAIN][entry.entry_id])])


class S8OmniVacuum(S8OmniEntity, StateVacuumEntity):
    _attr_name = None
    _attr_supported_features = (
        VacuumEntityFeature.START
        | VacuumEntityFeature.PAUSE
        | VacuumEntityFeature.RETURN_HOME
        | VacuumEntityFeature.FAN_SPEED
    )
    _attr_fan_speed_list = SUCTION_OPTIONS

    def __init__(self, coordinator):
        super().__init__(coordinator, "vacuum")

    @property
    def state(self):
        if self.dp(DP_FAULT, 0) not in (0, "0", None, False):
            return "error"
        raw = self.dp(DP_STATUS)
        if raw is None:
            return None
        # Unknown raw Tuya states must remain unknown; never coerce them to idle.
        return STATUS_MAP.get(str(raw))

    @property
    def battery_level(self):
        try:
            return int(self.dp(DP_BATTERY))
        except Exception:
            return None

    @property
    def fan_speed(self):
        value = self.dp(DP_SUCTION)
        return str(value) if value is not None else None

    async def async_start(self):
        await self.coordinator.async_set_sequence(
            [(DP_MODE, "smart"), (DP_PAUSE, False), (DP_POWER_GO, True)]
        )

    async def async_pause(self):
        await self.coordinator.async_set_sequence(
            [(DP_POWER_GO, False), (DP_PAUSE, True)]
        )

    async def async_return_to_base(self, **kwargs):
        return_states = {"goto_charge", "charging", "charge_done"}
        await self.coordinator.async_set_sequence_after_confirmation(
            (DP_MODE, "chargego"),
            [(DP_PAUSE, False), (DP_POWER_GO, True)],
            lambda data: str(data.get(DP_MODE)) == "chargego"
            or str(data.get(DP_STATUS)) in return_states,
            skip_remaining=lambda data: str(data.get(DP_STATUS)) in return_states,
            failure_message=(
                "Режим возврата на базу не подтверждён устройством. "
                "Команда запуска уборки не отправлена."
            ),
        )

    async def async_set_fan_speed(self, fan_speed, **kwargs):
        if fan_speed not in SUCTION_OPTIONS:
            raise ValueError(f"Unsupported fan speed: {fan_speed}")
        await self.coordinator.async_set_dp(DP_SUCTION, fan_speed)
