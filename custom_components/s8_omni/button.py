from homeassistant.components.button import ButtonEntity

from .const import DOMAIN
from .entity import S8OmniEntity


async def async_setup_entry(hass, entry, async_add_entities):
    coordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([S8OmniRefreshButton(coordinator)])


class S8OmniRefreshButton(S8OmniEntity, ButtonEntity):
    _attr_name = "Обновить сейчас"
    _attr_icon = "mdi:refresh"

    def __init__(self, coordinator):
        super().__init__(coordinator, "refresh")

    async def async_press(self) -> None:
        """Request an immediate local telemetry refresh."""
        await self.coordinator.async_request_refresh()
