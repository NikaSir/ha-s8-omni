from dataclasses import dataclass

from homeassistant.components.select import SelectEntity

from .const import (
    CLEAN_MODE_OPTIONS,
    DOMAIN,
    DP_MODE,
    DP_SUCTION,
    DP_WATER,
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
    Desc("mode", "Режим уборки", DP_MODE, CLEAN_MODE_OPTIONS),
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
    def available(self):
        return super().available and self.coordinator.data is not None and self.desc.dp in self.coordinator.data

    @property
    def current_option(self):
        value = self.dp(self.desc.dp)
        if self.desc.key == "mode":
            raw = str(value) if value is not None else None
            if raw in self.desc.options:
                return raw
            return self.coordinator.effective_clean_mode
        return str(value) if value is not None else None

    @property
    def extra_state_attributes(self):
        if self.desc.key != "mode":
            return None
        return {
            "raw_dp4_mode": self.dp(self.desc.dp),
            "clean_mode_source": self.coordinator.clean_mode_source,
        }

    async def async_select_option(self, option):
        if option not in self.desc.options:
            raise ValueError(f"Unsupported option: {option}")
        await self.coordinator.async_set_dp(self.desc.dp, option)
