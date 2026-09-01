import asyncio
from collections import deque
from datetime import datetime, timedelta, timezone
import logging

import tinytuya

from homeassistant.exceptions import HomeAssistantError
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
    DP_DUST,
    DP_MODE,
    DP_PAUSE,
    DP_POWER_GO,
    DP_ROLL_CLEAN,
    DP_ROLL_DRY,
    DP_STATUS,
)

_LOGGER = logging.getLogger(__name__)

TRACE_DPS = (
    DP_POWER_GO,
    DP_PAUSE,
    DP_MODE,
    DP_STATUS,
    DP_DUST,
    DP_ROLL_CLEAN,
    DP_ROLL_DRY,
)
TRACE_DP_NAMES = {
    DP_POWER_GO: "power_go",
    DP_PAUSE: "pause",
    DP_MODE: "mode",
    DP_STATUS: "status",
    DP_DUST: "station_dust_collection",
    DP_ROLL_CLEAN: "station_roller_cleaning",
    DP_ROLL_DRY: "station_roller_drying",
}


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
        self.command_trace = deque(maxlen=240)
        self._last_trace_snapshot = None
        self._diagnostic_capture_task = None
        self._diagnostic_capture_until = None
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

    @staticmethod
    def _trace_snapshot(data):
        return {
            TRACE_DP_NAMES[dp]: data.get(dp)
            for dp in TRACE_DPS
            if dp in data
        }

    def _trace(self, event, *, operation=None, dp=None, value=None, data=None, outcome=None):
        """Record a bounded, secret-free command/state event for diagnostics."""
        item = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event": event,
        }
        if operation is not None:
            item["operation"] = operation
        if dp is not None:
            item["dp"] = int(dp)
            item["dp_name"] = TRACE_DP_NAMES.get(dp, f"dp_{dp}")
        if value is not None:
            item["value"] = value
        if outcome is not None:
            item["outcome"] = outcome
        if data is not None:
            item["snapshot"] = self._trace_snapshot(data)
        self.command_trace.append(item)
        _LOGGER.debug("S8 OMNI protocol trace: %s", item)

    def trace_blocked_command(self, operation, reason):
        self._trace("command_blocked", operation=operation, outcome=reason)

    @property
    def diagnostic_capture_active(self):
        task = self._diagnostic_capture_task
        return task is not None and not task.done()

    @property
    def diagnostic_capture_until(self):
        return self._diagnostic_capture_until

    async def async_start_diagnostic_capture(self, duration_seconds=90):
        """Start a temporary read-only, one-second DP capture window."""
        if self.diagnostic_capture_active:
            return
        duration_seconds = max(15, min(180, int(duration_seconds)))
        self._diagnostic_capture_until = datetime.now(timezone.utc) + timedelta(
            seconds=duration_seconds
        )
        self._diagnostic_capture_task = self.hass.async_create_task(
            self._async_diagnostic_capture(duration_seconds),
            f"{DOMAIN}_{self.entry.entry_id}_diagnostic_capture",
        )

    async def async_stop_diagnostic_capture(self):
        task = self._diagnostic_capture_task
        if task is None or task.done():
            return
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass

    async def _async_diagnostic_capture(self, duration_seconds):
        self._trace("capture_started", outcome=f"{duration_seconds}s")
        try:
            for _ in range(duration_seconds):
                try:
                    async with self._command_lock:
                        data = await self.hass.async_add_executor_job(self._read_sync)
                    await self._async_accept_successful_data(data)
                    self.async_set_updated_data(data)
                except Exception as err:
                    self._trace(
                        "capture_read_failed",
                        outcome=type(err).__name__,
                    )
                await asyncio.sleep(1)
        finally:
            self._diagnostic_capture_until = None
            self._trace("capture_finished")

    async def _async_update_data(self):
        try:
            async with self._command_lock:
                data = await self.hass.async_add_executor_job(self._read_sync)
        except Exception as err:
            self.last_poll_success = False
            raise UpdateFailed(f"S8 OMNI local read failed: {err}") from err

        await self._async_accept_successful_data(data)
        return data

    async def _async_accept_successful_data(self, data):
        """Record one factual Tuya response without inventing missing datapoints."""
        # Connectivity describes the Tuya LAN transaction itself. Auxiliary local
        # bookkeeping must never turn a successful device response into "Нет связи".
        self.last_poll_success = True
        self.last_successful_update = datetime.now(timezone.utc)
        snapshot = self._trace_snapshot(data)
        if snapshot != self._last_trace_snapshot:
            self._last_trace_snapshot = snapshot
            self._trace("state_changed", data=data)
        try:
            await self._async_update_clean_mode(data)
        except Exception as err:
            _LOGGER.warning("S8 OMNI clean-mode bookkeeping failed after a successful local poll: %s", err)

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
        return result

    async def async_set_dp(self, dp, value, refresh=True, *, operation=None):
        operation = operation or f"set_dp_{dp}"
        self._trace("write_requested", operation=operation, dp=dp, value=value)
        try:
            async with self._command_lock:
                await self.hass.async_add_executor_job(self._set_sync, dp, value)
        except Exception as err:
            self._trace(
                "write_failed",
                operation=operation,
                dp=dp,
                value=value,
                outcome=type(err).__name__,
            )
            raise
        self._trace("write_acknowledged", operation=operation, dp=dp, value=value)
        if dp == DP_MODE and str(value) in CLEAN_MODE_OPTIONS:
            await self._async_remember_clean_mode(value)
        if refresh:
            await self.async_request_refresh()

    async def async_set_sequence(self, values, *, operation=None):
        operation = operation or "set_sequence"
        remembered_mode = None
        async with self._command_lock:
            for dp, value in values:
                self._trace("write_requested", operation=operation, dp=dp, value=value)
                try:
                    await self.hass.async_add_executor_job(self._set_sync, dp, value)
                except Exception as err:
                    self._trace(
                        "write_failed",
                        operation=operation,
                        dp=dp,
                        value=value,
                        outcome=type(err).__name__,
                    )
                    raise
                self._trace("write_acknowledged", operation=operation, dp=dp, value=value)
                if dp == DP_MODE and str(value) in CLEAN_MODE_OPTIONS:
                    remembered_mode = value
                await asyncio.sleep(0.15)
        if remembered_mode is not None:
            await self._async_remember_clean_mode(remembered_mode)
        await self.async_request_refresh()

    async def async_set_sequence_after_confirmation(
        self,
        first,
        values,
        confirmation,
        *,
        skip_remaining=None,
        operation=None,
        failure_message="Устройство не подтвердило первый шаг команды.",
    ):
        """Continue a multi-DP command only after factual device readback.

        This is intentionally fail-closed. A Tuya write acknowledgement alone is
        not proof that the device changed mode, so later trigger DPs are never
        sent until a fresh status response confirms the safe prerequisite.
        """
        operation = operation or "confirmed_sequence"
        confirmed_data = None
        async with self._command_lock:
            self._trace(
                "write_requested",
                operation=operation,
                dp=first[0],
                value=first[1],
            )
            try:
                await self.hass.async_add_executor_job(self._set_sync, *first)
            except Exception as err:
                self._trace(
                    "write_failed",
                    operation=operation,
                    dp=first[0],
                    value=first[1],
                    outcome=type(err).__name__,
                )
                raise
            self._trace(
                "write_acknowledged",
                operation=operation,
                dp=first[0],
                value=first[1],
            )
            for delay in (0.35, 0.65, 1.00, 1.50):
                await asyncio.sleep(delay)
                try:
                    data = await self.hass.async_add_executor_job(self._read_sync)
                except Exception as err:
                    _LOGGER.debug("S8 OMNI command readback failed: %s", err)
                    continue
                await self._async_accept_successful_data(data)
                self.async_set_updated_data(data)
                self._trace("confirmation_readback", operation=operation, data=data)
                if confirmation(data):
                    confirmed_data = data
                    break

            if confirmed_data is None:
                self._trace("confirmation_failed", operation=operation)
                raise HomeAssistantError(failure_message)

            if not (skip_remaining and skip_remaining(confirmed_data)):
                for dp, value in values:
                    self._trace("write_requested", operation=operation, dp=dp, value=value)
                    try:
                        await self.hass.async_add_executor_job(self._set_sync, dp, value)
                    except Exception as err:
                        self._trace(
                            "write_failed",
                            operation=operation,
                            dp=dp,
                            value=value,
                            outcome=type(err).__name__,
                        )
                        raise
                    self._trace("write_acknowledged", operation=operation, dp=dp, value=value)
                    await asyncio.sleep(0.15)

        await self.async_request_refresh()
