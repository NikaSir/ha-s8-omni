from homeassistant.components.vacuum import StateVacuumEntity, VacuumEntityFeature
from homeassistant.exceptions import HomeAssistantError

from .const import (
    DOMAIN,
    DP_BATTERY,
    DP_FAULT,
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
        VacuumEntityFeature.PAUSE | VacuumEntityFeature.FAN_SPEED
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
        self.coordinator.trace_blocked_command(
            "start",
            "disabled_in_protocol_capture_build",
        )
        raise HomeAssistantError(
            "Запуск временно отключён в диагностической сборке. "
            "Используйте штатное приложение и запишите DP-переходы."
        )

    async def async_pause(self):
        await self.coordinator.async_set_sequence(
            [(DP_POWER_GO, False), (DP_PAUSE, True)],
            operation="pause",
        )

    async def async_return_to_base(self, **kwargs):
        self.coordinator.trace_blocked_command(
            "return_to_base",
            "disabled_after_real_device_failure",
        )
        raise HomeAssistantError(
            "Возврат временно отключён: проверенные последовательности этой модели "
            "не выполняют команду. Запишите эталон через штатное приложение."
        )

    async def async_set_fan_speed(self, fan_speed, **kwargs):
        if fan_speed not in SUCTION_OPTIONS:
            raise ValueError(f"Unsupported fan speed: {fan_speed}")
        await self.coordinator.async_set_dp(DP_SUCTION, fan_speed)
