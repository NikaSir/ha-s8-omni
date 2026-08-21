from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN, VERSION


class S8OmniEntity(CoordinatorEntity):
    _attr_has_entity_name = True

    def __init__(self, coordinator, suffix: str):
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.device_id}_{suffix}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.device_id)},
            name="Пылесос S8 OMNI",
            manufacturer="Tuya",
            model="S8 OMNI",
            sw_version=VERSION,
        )

    def dp(self, dp_id: int, default=None):
        return self.coordinator.data.get(dp_id, default) if self.coordinator.data else default
