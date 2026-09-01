from dataclasses import dataclass

from homeassistant.components.button import ButtonEntity
from homeassistant.exceptions import HomeAssistantError

from .const import DOMAIN, DP_DUST, DP_ROLL_CLEAN, DP_ROLL_DRY
from .entity import S8OmniEntity


@dataclass(frozen=True)
class StopDesc:
    key: str
    name: str
    dp: int


STOP_DESCS = [
    StopDesc("stop_dust_collection", "Остановить сбор пыли", DP_DUST),
    StopDesc("stop_roller_cleaning", "Остановить мойку швабры", DP_ROLL_CLEAN),
    StopDesc("stop_roller_drying", "Остановить сушку швабры", DP_ROLL_DRY),
]


async def async_setup_entry(hass, entry, async_add_entities):
    coordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities(
        [
            S8OmniRefreshButton(coordinator),
            S8OmniDiagnosticCaptureButton(coordinator),
            *[S8OmniStopOperationButton(coordinator, desc) for desc in STOP_DESCS],
        ]
    )


class S8OmniRefreshButton(S8OmniEntity, ButtonEntity):
    _attr_name = "Обновить сейчас"
    _attr_icon = "mdi:refresh"

    def __init__(self, coordinator):
        super().__init__(coordinator, "refresh")

    async def async_press(self) -> None:
        await self.coordinator.async_request_refresh()


class S8OmniDiagnosticCaptureButton(S8OmniEntity, ButtonEntity):
    _attr_name = "Записать команды штатного приложения"
    _attr_icon = "mdi:record-rec"

    def __init__(self, coordinator):
        super().__init__(coordinator, "diagnostic_capture")

    @property
    def extra_state_attributes(self):
        until = self.coordinator.diagnostic_capture_until
        return {
            "capture_active": self.coordinator.diagnostic_capture_active,
            "capture_until": until.isoformat() if until is not None else None,
            "duration_seconds": 90,
        }

    async def async_press(self) -> None:
        await self.coordinator.async_start_diagnostic_capture(90)


class S8OmniStopOperationButton(S8OmniEntity, ButtonEntity):
    _attr_icon = "mdi:stop"

    def __init__(self, coordinator, desc: StopDesc):
        super().__init__(coordinator, desc.key)
        self.desc = desc
        self._attr_name = desc.name

    @property
    def available(self):
        return super().available and self.coordinator.data is not None and self.desc.dp in self.coordinator.data

    async def async_press(self) -> None:
        self.coordinator.trace_blocked_command(
            self.desc.key,
            "disabled_in_protocol_capture_build",
        )
        raise HomeAssistantError(
            "Остановка станции временно отключена в диагностической сборке. "
            "Остановите операцию штатным приложением во время записи DP."
        )
