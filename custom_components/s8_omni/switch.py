from dataclasses import dataclass

from homeassistant.components.switch import SwitchEntity

from .const import DOMAIN, DP_CHILD_LOCK, DP_DND
from .entity import S8OmniEntity


@dataclass(frozen=True)
class Desc:
    key: str
    name: str
    dp: int


DESCS = [
    Desc("do_not_disturb", "Не беспокоить", DP_DND),
    Desc("child_lock", "Блокировка от детей", DP_CHILD_LOCK),
]


async def async_setup_entry(hass, entry, async_add_entities):
    coordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([S8Switch(coordinator, desc) for desc in DESCS])


class S8Switch(S8OmniEntity, SwitchEntity):
    def __init__(self, coordinator, desc: Desc):
        super().__init__(coordinator, desc.key)
        self.desc = desc
        self._attr_name = desc.name

    @property
    def is_on(self):
        return bool(self.dp(self.desc.dp, False))

    async def async_turn_on(self, **kwargs):
        await self.coordinator.async_set_dp(self.desc.dp, True)

    async def async_turn_off(self, **kwargs):
        await self.coordinator.async_set_dp(self.desc.dp, False)
