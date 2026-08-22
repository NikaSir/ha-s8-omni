import asyncio
from datetime import datetime, timedelta, timezone
import logging

import tinytuya

from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .const import (
    CONF_DEVICE_ID,
    CONF_LOCAL_KEY,
    CONF_PROTOCOL_VERSION,
    CONF_SCAN_INTERVAL,
    DEFAULT_PROTOCOL_VERSION,
    DEFAULT_SCAN_INTERVAL,
    DOMAIN,
)

_LOGGER = logging.getLogger(__name__)


class S8OmniCoordinator(DataUpdateCoordinator):
    def __init__(self, hass, entry):
        self.entry = entry
        self.host = entry.data["host"]
        self.device_id = entry.data[CONF_DEVICE_ID]
        self.local_key = entry.data[CONF_LOCAL_KEY]
        self.protocol_version = entry.data.get(CONF_PROTOCOL_VERSION, DEFAULT_PROTOCOL_VERSION)
        self.last_successful_update: datetime | None = None
        scan = int(
            entry.options.get(
                CONF_SCAN_INTERVAL,
                entry.data.get(CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL),
            )
        )

        self._device = tinytuya.Device(
            dev_id=self.device_id,
            address=self.host,
            local_key=self.local_key,
            version=float(self.protocol_version),
        )
        try:
            self._device.set_socketPersistent(False)
        except Exception:
            pass

        self._command_lock = asyncio.Lock()
        super().__init__(
            hass,
            _LOGGER,
            name=f"{DOMAIN}_{self.device_id}",
            update_interval=timedelta(seconds=max(3, scan)),
        )

    def _read_sync(self):
        payload = self._device.status()
        if not isinstance(payload, dict) or "dps" not in payload:
            raise RuntimeError(f"Unexpected Tuya response: {payload!r}")
        out = {}
        for key, value in payload["dps"].items():
            try:
                out[int(key)] = value
            except Exception:
                pass
        return out

    async def _async_update_data(self):
        try:
            data = await self.hass.async_add_executor_job(self._read_sync)
        except Exception as err:
            raise UpdateFailed(f"S8 OMNI local read failed: {err}") from err
        self.last_successful_update = datetime.now(timezone.utc)
        return data

    def _set_sync(self, dp, value):
        result = self._device.set_value(dp, value)
        if isinstance(result, dict) and ("Error" in result or "Err" in result):
            raise RuntimeError(str(result))

    async def async_set_dp(self, dp, value, refresh=True):
        async with self._command_lock:
            await self.hass.async_add_executor_job(self._set_sync, dp, value)
        if refresh:
            await self.async_request_refresh()

    async def async_set_sequence(self, values):
        async with self._command_lock:
            for dp, value in values:
                await self.hass.async_add_executor_job(self._set_sync, dp, value)
                await asyncio.sleep(0.15)
        await self.async_request_refresh()
