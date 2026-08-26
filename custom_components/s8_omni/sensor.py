from dataclasses import dataclass
from datetime import datetime, timezone

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
from .status import (
    COMPOSITE_STATUS_OPTIONS,
    ROBOT_STATUS_OPTIONS,
    STATION_STATUS_OPTIONS,
    composite_attributes,
    composite_status,
    robot_status,
    station_status,
)


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
    Desc("work_mode", "Тип работы", DP_WORK_MODE, category=EntityCategory.DIAGNOSTIC),
    Desc("raw_status", "Raw status", DP_STATUS, category=EntityCategory.DIAGNOSTIC, enabled=False),
]


async def async_setup_entry(hass, entry, async_add_entities):
    coordinator = hass.data[DOMAIN][entry.entry_id]
    entities = [S8Sensor(coordinator, desc) for desc in DESCS]
    entities.extend(
        [
            S8RobotStatusSensor(coordinator),
            S8StationStatusSensor(coordinator),
            S8CompositeStatusSensor(coordinator),
            S8LastTelemetrySensor(coordinator),
            S8TelemetryAgeSensor(coordinator),
        ]
    )
    async_add_entities(entities)


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
    def available(self):
        return super().available and self.coordinator.data is not None and self.desc.dp in self.coordinator.data

    @property
    def native_value(self):
        return self.dp(self.desc.dp)


class S8RobotStatusSensor(S8OmniEntity, SensorEntity):
    _attr_translation_key = "robot_status"
    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = ROBOT_STATUS_OPTIONS

    def __init__(self, coordinator):
        super().__init__(coordinator, "robot_status")

    @property
    def native_value(self):
        return robot_status(self.coordinator.data or {})

    @property
    def extra_state_attributes(self):
        data = self.coordinator.data or {}
        return {"raw_status": data.get(DP_STATUS)}


class S8StationStatusSensor(S8OmniEntity, SensorEntity):
    _attr_translation_key = "station_status"
    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = STATION_STATUS_OPTIONS

    def __init__(self, coordinator):
        super().__init__(coordinator, "station_status")

    @property
    def native_value(self):
        return station_status(self.coordinator.data or {})

    @property
    def extra_state_attributes(self):
        attrs = composite_attributes(self.coordinator.data or {})
        return {
            "active_operations": attrs["station_operations"],
            "missing_station_dps": attrs["missing_station_dps"],
        }


class S8CompositeStatusSensor(S8OmniEntity, SensorEntity):
    _attr_translation_key = "composite_status"
    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = COMPOSITE_STATUS_OPTIONS

    def __init__(self, coordinator):
        super().__init__(coordinator, "composite_status")

    @property
    def native_value(self):
        return composite_status(self.coordinator.data or {})

    @property
    def extra_state_attributes(self):
        return composite_attributes(self.coordinator.data or {})


class S8LastTelemetrySensor(S8OmniEntity, SensorEntity):
    _attr_name = "Последняя телеметрия"
    _attr_device_class = SensorDeviceClass.TIMESTAMP
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(self, coordinator):
        super().__init__(coordinator, "last_telemetry")

    @property
    def available(self):
        return self.coordinator.last_successful_update is not None

    @property
    def native_value(self):
        return self.coordinator.last_successful_update


class S8TelemetryAgeSensor(S8OmniEntity, SensorEntity):
    _attr_name = "Возраст телеметрии"
    _attr_device_class = SensorDeviceClass.DURATION
    _attr_native_unit_of_measurement = UnitOfTime.SECONDS
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(self, coordinator):
        super().__init__(coordinator, "telemetry_age")

    @property
    def available(self):
        return self.coordinator.last_successful_update is not None

    @property
    def native_value(self):
        return self.coordinator.telemetry_age_seconds

    @property
    def extra_state_attributes(self):
        return {
            "scan_interval_seconds": self.coordinator.scan_interval_seconds,
            "stale_after_seconds": self.coordinator.stale_after_seconds,
            "telemetry_status": self.coordinator.telemetry_status,
        }
