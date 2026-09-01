from dataclasses import dataclass

from homeassistant.components.button import ButtonEntity
from homeassistant.exceptions import HomeAssistantError

from .const import DOMAIN, DP_DUST, DP_ROLL_CLEAN, DP_ROLL_DRY, DP_STATUS
from .entity import S8OmniEntity


@dataclass(frozen=True)
class OperationDesc:
    key: str
    name: str
    dp: int
    value: bool


OPERATION_DESCS = [
    OperationDesc("start_dust_collection", "Запустить сбор пыли", DP_DUST, True),
    OperationDesc("stop_dust_collection", "Остановить сбор пыли", DP_DUST, False),
    OperationDesc("start_roller_cleaning", "Запустить мойку швабры", DP_ROLL_CLEAN, True),
    OperationDesc("stop_roller_cleaning", "Остановить мойку швабры", DP_ROLL_CLEAN, False),
    OperationDesc("start_roller_drying", "Запустить сушку швабры", DP_ROLL_DRY, True),
    OperationDesc("stop_roller_drying", "Остановить сушку швабры", DP_ROLL_DRY, False),
]


async def async_setup_entry(hass, entry, async_add_entities):
    coordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities(
        [
            S8OmniRefreshButton(coordinator),
            S8OmniDiagnosticCaptureButton(coordinator),
            *[S8OmniStationOperationButton(coordinator, desc) for desc in OPERATION_DESCS],
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


class S8OmniStationOperationButton(S8OmniEntity, ButtonEntity):

    def __init__(self, coordinator, desc: OperationDesc):
        super().__init__(coordinator, desc.key)
        self.desc = desc
        self._attr_name = desc.name
        self._attr_icon = "mdi:play" if desc.value else "mdi:stop"

    @property
    def available(self):
        return super().available and self.coordinator.data is not None and self.desc.dp in self.coordinator.data

    async def async_press(self) -> None:
        if self.desc.value and str(self.dp(DP_STATUS)) not in {"charging", "charge_done"}:
            raise HomeAssistantError(
                "Операцию станции можно запустить только когда робот находится на базе."
            )
        await self.coordinator.async_set_dp(
            self.desc.dp,
            self.desc.value,
            operation=self.desc.key,
        )
        confirmed = await self.coordinator.async_wait_for_state(
            lambda data: data.get(self.desc.dp) is self.desc.value,
            operation=self.desc.key,
            timeout=12.0,
        )
        if confirmed is None:
            raise HomeAssistantError(
                "Станция не подтвердила изменение операции."
            )
