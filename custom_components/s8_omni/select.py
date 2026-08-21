from dataclasses import dataclass

from homeassistant.components.select import SelectEntity

from .const import (
    DOMAIN,
    DP_MODE,
    DP_SUCTION,
    DP_WATER,
    MODE_OPTIONS,
    SUCTION_OPTIONS,
    WATER_OPTIONS,
)
from .entity import S8OmniEntity


@dataclass(frozen=True)
class Desc:
    key: str
    name: str
    dp: int
    options: list[str]


DESCS = [
    Desc("mode", "Режим", DP_MODE, MODE_OPTIONS),
    Desc("suction", "Мощность всасывания", DP_SUCTION, SUCTION_OPTIONS),
    Desc("water", "Подача воды", DP_WATER, WATER_OPTIONS),
]


async def async_setup_entry(hass, entry, async_add_entities):
    coordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([S8Select(coordinator, desc) for desc in DESCS])


class S8Select(S8OmniEntity, SelectEntity):
    def __init__(self, coordinator, desc: Desc):
        super().__init__(coordinator, desc.key)
        self.desc = desc
        self._attr_name = desc.name
        self._attr_options = desc.options

    @property
    def current_option(self):
        value = self.dp(self.desc.dp)
        return str(value) if value is not None else None

    async def async_select_option(self, option):
        if option not in self.desc.options:
            raise ValueError(f"Unsupported option: {option}")
        await self.coordinator.async_set_dp(self.desc.dp, option)
