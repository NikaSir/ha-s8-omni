from homeassistant.components.number import NumberEntity, NumberMode
from homeassistant.const import PERCENTAGE

from .const import DOMAIN, DP_VOLUME
from .entity import S8OmniEntity


async def async_setup_entry(hass, entry, async_add_entities):
    async_add_entities([S8Volume(hass.data[DOMAIN][entry.entry_id])])


class S8Volume(S8OmniEntity, NumberEntity):
    _attr_name = "Громкость"
    _attr_native_min_value = 0
    _attr_native_max_value = 100
    _attr_native_step = 1
    _attr_native_unit_of_measurement = PERCENTAGE
    _attr_mode = NumberMode.SLIDER

    def __init__(self, coordinator):
        super().__init__(coordinator, "volume")

    @property
    def native_value(self):
        try:
            return float(self.dp(DP_VOLUME))
        except Exception:
            return None

    async def async_set_native_value(self, value):
        await self.coordinator.async_set_dp(DP_VOLUME, int(round(value)))
