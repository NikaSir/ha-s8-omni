from dataclasses import dataclass

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.const import PERCENTAGE, UnitOfArea, UnitOfTime
from homeassistant.helpers.entity import EntityCategory

from .const import (
    DOMAIN,
    DP_BATTERY,
    DP_CLEAN_AREA,
    DP_CLEAN_TIME,
    DP_FAULT,
    DP_FILTER_LIFE,
    DP_MAIN_BRUSH_LIFE,
    DP_SIDE_BRUSH_LIFE,
    DP_STATUS,
    DP_WORK_MODE,
)
from .entity import S8OmniEntity


@dataclass(frozen=True)
class Desc:
    key: str
    name: str
    dp: int
    unit: str | None = None
    device_class: object | None = None
    category: object | None = None
    enabled: bool = True


DESCS = [
    Desc("battery", "Заряд", DP_BATTERY, PERCENTAGE, SensorDeviceClass.BATTERY),
    Desc("clean_time", "Время уборки", DP_CLEAN_TIME, UnitOfTime.MINUTES),
    Desc("clean_area", "Площадь уборки", DP_CLEAN_AREA, UnitOfArea.SQUARE_METERS),
    Desc("side_brush_life", "Ресурс боковой щётки", DP_SIDE_BRUSH_LIFE, UnitOfTime.MINUTES),
    Desc("main_brush_life", "Ресурс основной щётки", DP_MAIN_BRUSH_LIFE, UnitOfTime.MINUTES),
    Desc("filter_life", "Ресурс фильтра", DP_FILTER_LIFE, UnitOfTime.MINUTES),
    Desc("fault", "Fault", DP_FAULT, category=EntityCategory.DIAGNOSTIC),
    Desc("work_mode", "Режим уборки", DP_WORK_MODE),
    Desc("raw_status", "Raw status", DP_STATUS, category=EntityCategory.DIAGNOSTIC, enabled=False),
]


async def async_setup_entry(hass, entry, async_add_entities):
    coordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([S8Sensor(coordinator, desc) for desc in DESCS])


class S8Sensor(S8OmniEntity, SensorEntity):
    def __init__(self, coordinator, desc: Desc):
        super().__init__(coordinator, desc.key)
        self.desc = desc
        self._attr_name = desc.name
        self._attr_native_unit_of_measurement = desc.unit
        self._attr_device_class = desc.device_class
        self._attr_entity_category = desc.category
        self._attr_entity_registry_enabled_default = desc.enabled

    @property
    def native_value(self):
        return self.dp(self.desc.dp)
