import asyncio
from datetime import datetime, timedelta, timezone
import logging

import tinytuya

from homeassistant.helpers.storage import Store
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .const import (
    CONF_DEVICE_ID,
    CONF_LOCAL_KEY,
    CONF_PROTOCOL_VERSION,
    CONF_SCAN_INTERVAL,
    CLEAN_MODE_OPTIONS,
    DEFAULT_CLEAN_MODE,
    DEFAULT_PROTOCOL_VERSION,
    DEFAULT_SCAN_INTERVAL,
    DOMAIN,
    DP_MODE,
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
        self.last_poll_success: bool | None = None
        scan = int(
            entry.options.get(
                CONF_SCAN_INTERVAL,
                entry.data.get(CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL),
            )
        )
        self.scan_interval_seconds = max(3, min(60, scan))

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
        self._clean_mode_store = Store(hass, 1, f"{DOMAIN}.{entry.entry_id}.clean_mode")
        self._clean_mode_loaded = False
        self.last_clean_mode: str | None = None
        super().__init__(
            hass,
            _LOGGER,
            name=f"{DOMAIN}_{self.device_id}",
            update_interval=timedelta(seconds=self.scan_interval_seconds),
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
            await self._async_update_clean_mode(data)
        except Exception as err:
            self.last_poll_success = False
            raise UpdateFailed(f"S8 OMNI local read failed: {err}") from err
        self.last_poll_success = True
        self.last_successful_update = datetime.now(timezone.utc)
        return data

    @property
    def stale_after_seconds(self):
        return self.scan_interval_seconds * 3

    @property
    def telemetry_age_seconds(self):
        last = self.last_successful_update
        if last is None:
            return None
        return max(0, int((datetime.now(timezone.utc) - last).total_seconds()))

    @property
    def telemetry_status(self):
        if self.last_successful_update is None:
            return "no_data"
        if self.last_poll_success is False:
            return "stale"
        age = self.telemetry_age_seconds
        if age is None:
            return "no_data"
        return "current" if age <= self.stale_after_seconds else "stale"

    async def _async_load_clean_mode(self):
        if self._clean_mode_loaded:
            return
        saved = await self._clean_mode_store.async_load()
        if isinstance(saved, dict) and saved.get("mode") in CLEAN_MODE_OPTIONS:
            self.last_clean_mode = saved["mode"]
        self._clean_mode_loaded = True

    async def _async_remember_clean_mode(self, mode):
        mode = str(mode or "").lower()
        if mode not in CLEAN_MODE_OPTIONS:
            return
        await self._async_load_clean_mode()
        if self.last_clean_mode == mode:
            return
        self.last_clean_mode = mode
        await self._clean_mode_store.async_save({"mode": mode})

    async def _async_update_clean_mode(self, data):
        await self._async_load_clean_mode()
        mode = str(data.get(DP_MODE) or "").lower()
        if mode in CLEAN_MODE_OPTIONS:
            await self._async_remember_clean_mode(mode)

    @property
    def effective_clean_mode(self):
        return self.last_clean_mode or DEFAULT_CLEAN_MODE

    @property
    def clean_mode_source(self):
        return "remembered" if self.last_clean_mode else "default"

    def _set_sync(self, dp, value):
        result = self._device.set_value(dp, value)
        if isinstance(result, dict) and ("Error" in result or "Err" in result):
            raise RuntimeError(str(result))

    async def async_set_dp(self, dp, value, refresh=True):
        async with self._command_lock:
            await self.hass.async_add_executor_job(self._set_sync, dp, value)
        if dp == DP_MODE and str(value) in CLEAN_MODE_OPTIONS:
            await self._async_remember_clean_mode(value)
        if refresh:
            await self.async_request_refresh()

    async def async_set_sequence(self, values):
        remembered_mode = None
        async with self._command_lock:
            for dp, value in values:
                await self.hass.async_add_executor_job(self._set_sync, dp, value)
                if dp == DP_MODE and str(value) in CLEAN_MODE_OPTIONS:
                    remembered_mode = value
                await asyncio.sleep(0.15)
        if remembered_mode is not None:
            await self._async_remember_clean_mode(remembered_mode)
        await self.async_request_refresh()
