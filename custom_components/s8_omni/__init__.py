from pathlib import Path
import logging

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import (
    DASHBOARD_VERSION,
    DOMAIN,
    PANEL_ICON,
    PANEL_ID,
    PANEL_PARENT_PATH,
    PANEL_PATH,
    PANEL_STATIC_URL,
    PANEL_TITLE,
    VERSION,
)
from .coordinator import S8OmniCoordinator

PLATFORMS = ["vacuum", "sensor", "binary_sensor", "switch", "select", "number", "button"]
FRONTEND_DIR = Path(__file__).parent / "frontend"
PANEL_MODULE = f"{PANEL_STATIC_URL}/s8-omni-panel.js?v={DASHBOARD_VERSION}-{VERSION}"

_LOGGER = logging.getLogger(__name__)


async def _async_register_panel(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Serve and register the integration-owned native panel.

    Return True only when this call registered the panel. This lets setup clean up
    safely after a real platform/setup exception without removing somebody else's
    route in the unlikely event of a path collision.
    """
    try:
        await hass.http.async_register_static_paths(
            [StaticPathConfig(PANEL_STATIC_URL, str(FRONTEND_DIR), True)]
        )
    except RuntimeError:
        pass

    if frontend.async_panel_exists(hass, PANEL_PATH):
        _LOGGER.warning(
            "Cannot register S8 OMNI panel at /%s because that route already exists",
            PANEL_PATH,
        )
        return False

    await panel_custom.async_register_panel(
        hass=hass,
        frontend_url_path=PANEL_PATH,
        webcomponent_name="s8-omni-panel",
        module_url=PANEL_MODULE,
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        require_admin=False,
        handle_safe_area=True,
        config={
            "entry_id": entry.entry_id,
            "panel_id": PANEL_ID,
            "owner": "ha-s8-omni",
            "integration_version": VERSION,
            "dashboard_version": DASHBOARD_VERSION,
            "parent_path": PANEL_PARENT_PATH,
            "parent_route": PANEL_PARENT_PATH,
            "preferred_view": "overview",
            "expose_in_generated_ui": True,
        },
    )
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up S8 OMNI without making panel lifetime depend on hardware reachability."""
    coordinator = S8OmniCoordinator(hass, entry)
    domain_data = hass.data.setdefault(DOMAIN, {})
    domain_data[entry.entry_id] = coordinator

    panel_registered = False
    try:
        panel_registered = await _async_register_panel(hass, entry)
        await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
        await coordinator.async_refresh()
    except Exception:
        domain_data.pop(entry.entry_id, None)
        if panel_registered and not domain_data:
            frontend.async_remove_panel(hass, PANEL_PATH, warn_if_unknown=False)
        raise

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    coordinator = hass.data.get(DOMAIN, {}).get(entry.entry_id)
    if coordinator is not None:
        await coordinator.async_stop_diagnostic_capture()
    ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if ok:
        domain_data = hass.data.get(DOMAIN, {})
        domain_data.pop(entry.entry_id, None)
        if not domain_data:
            frontend.async_remove_panel(hass, PANEL_PATH, warn_if_unknown=False)
    return ok
