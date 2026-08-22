import voluptuous as vol
import tinytuya

from homeassistant import config_entries
from homeassistant.const import CONF_HOST
from homeassistant.core import callback
from homeassistant.helpers.selector import (
    TextSelector,
    TextSelectorConfig,
    TextSelectorType,
)

from .const import (
    CONF_DEVICE_ID,
    CONF_LOCAL_KEY,
    CONF_PROTOCOL_VERSION,
    CONF_SCAN_INTERVAL,
    DEFAULT_PROTOCOL_VERSION,
    DEFAULT_SCAN_INTERVAL,
    DOMAIN,
)

_PROTOCOL_VERSIONS = ["3.1", "3.2", "3.3"]
_LOCAL_KEY_SELECTOR = TextSelector(
    TextSelectorConfig(type=TextSelectorType.PASSWORD)
)


def _connection_schema(defaults, *, include_scan_interval=False):
    schema = {
        vol.Required(CONF_HOST, default=defaults.get(CONF_HOST, "")): TextSelector(),
        vol.Required(
            CONF_DEVICE_ID, default=defaults.get(CONF_DEVICE_ID, "")
        ): TextSelector(),
        vol.Required(
            CONF_LOCAL_KEY, default=defaults.get(CONF_LOCAL_KEY, "")
        ): _LOCAL_KEY_SELECTOR,
        vol.Required(
            CONF_PROTOCOL_VERSION,
            default=defaults.get(CONF_PROTOCOL_VERSION, DEFAULT_PROTOCOL_VERSION),
        ): vol.In(_PROTOCOL_VERSIONS),
    }
    if include_scan_interval:
        schema[
            vol.Optional(
                CONF_SCAN_INTERVAL,
                default=defaults.get(CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL),
            )
        ] = vol.All(vol.Coerce(int), vol.Range(min=3, max=60))
    return vol.Schema(schema)


class S8OmniConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def _async_validate_connection(self, user_input):
        try:
            device = tinytuya.Device(
                dev_id=user_input[CONF_DEVICE_ID],
                address=user_input[CONF_HOST],
                local_key=user_input[CONF_LOCAL_KEY],
                version=float(user_input[CONF_PROTOCOL_VERSION]),
            )
            result = await self.hass.async_add_executor_job(device.status)
        except Exception:
            return False
        return isinstance(result, dict) and "dps" in result

    async def async_step_user(self, user_input=None):
        errors = {}
        if user_input is not None:
            if not await self._async_validate_connection(user_input):
                errors["base"] = "cannot_connect"
            else:
                await self.async_set_unique_id(user_input[CONF_DEVICE_ID])
                self._abort_if_unique_id_configured()
                return self.async_create_entry(title="Пылесос S8 OMNI", data=user_input)

        return self.async_show_form(
            step_id="user",
            data_schema=_connection_schema({}, include_scan_interval=True),
            errors=errors,
        )

    async def async_step_reconfigure(self, user_input=None):
        entry = self._get_reconfigure_entry()
        errors = {}

        if user_input is not None:
            if not await self._async_validate_connection(user_input):
                errors["base"] = "cannot_connect"
            else:
                await self.async_set_unique_id(user_input[CONF_DEVICE_ID])
                self._abort_if_unique_id_mismatch()
                return self.async_update_reload_and_abort(
                    entry,
                    data_updates=user_input,
                )

        return self.async_show_form(
            step_id="reconfigure",
            data_schema=_connection_schema(entry.data),
            errors=errors,
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry):
        return S8OmniOptionsFlow()


class S8OmniOptionsFlow(config_entries.OptionsFlowWithReload):
    async def async_step_init(self, user_input=None):
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)
        current = self.config_entry.options.get(
            CONF_SCAN_INTERVAL,
            self.config_entry.data.get(CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL),
        )
        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {
                    vol.Required(
                        CONF_SCAN_INTERVAL,
                        default=current,
                    ): vol.All(vol.Coerce(int), vol.Range(min=3, max=60))
                }
            ),
        )
