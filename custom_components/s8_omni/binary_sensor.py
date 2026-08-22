from dataclasses import dataclass

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.helpers.entity import EntityCategory

from .const import (
    DOMAIN,
    DP_CUSTOM_MODE,
    DP_DUST,
    DP_RESUME_CLEANING,
    DP_ROLL_CLEAN,
    DP_ROLL_DRY,
)
from .entity import S8OmniEntity


@dataclass(frozen=True)
class Desc:
    key: str
    name: str
    dp: int
    enabled: bool = True
    category: object | None = None


DESCS = [
    Desc("dust_collection", "Сбор пыли", DP_DUST),
    Desc("roller_cleaning", "Очистка ролика", DP_ROLL_CLEAN),
    Desc("roller_drying", "Сушка ролика", DP_ROLL_DRY),
    Desc("custom_mode", "Пользовательский режим", DP_CUSTOM_MODE, False, EntityCategory.DIAGNOSTIC),
    Desc("resume_cleaning", "Возобновление уборки", DP_RESUME_CLEANING, False, EntityCategory.DIAGNOSTIC),
]


async def async_setup_entry(hass, entry, async_add_entities):
    coordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([S8Binary(coordinator, desc) for desc in DESCS])


class S8Binary(S8OmniEntity, BinarySensorEntity):
    def __init__(self, coordinator, desc: Desc):
        super().__init__(coordinator, desc.key)
        self.desc = desc
        self._attr_name = desc.name
        self._attr_entity_registry_enabled_default = desc.enabled
        self._attr_entity_category = desc.category

    @property
    def available(self):
        return super().available and self.coordinator.data is not None and self.desc.dp in self.coordinator.data

    @property
    def is_on(self):
        value = self.dp(self.desc.dp)
        return None if value is None else bool(value)
