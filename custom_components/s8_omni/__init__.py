from pathlib import Path
import base64
import logging
import re

from aiohttp import web

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import HomeAssistantView, StaticPathConfig
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
PANEL_MODULE = f"{PANEL_STATIC_URL}/s8-omni-panel.js?v={DASHBOARD_VERSION}"

_LOGGER = logging.getLogger(__name__)
_PRODUCT_ART_CACHE: dict[str, bytes] = {}


def _product_art_bytes(mode: str) -> bytes:
    """Decode and cache the verified product-art JPEG embedded in the frontend bundle."""
    safe = "dock" if mode == "dock" else "clean"
    if safe in _PRODUCT_ART_CACHE:
        return _PRODUCT_ART_CACHE[safe]
    text = (FRONTEND_DIR / "s8-omni-panel.js").read_text(encoding="utf-8")
    name = f"PRODUCT_ART_{safe.upper()}_BASE64"
    match = re.search(rf'const {name} = "([^"]+)";', text)
    if not match:
        raise FileNotFoundError(name)
    data = base64.b64decode(match.group(1), validate=True)
    if not (data.startswith(b"\xff\xd8") and data.endswith(b"\xff\xd9")):
        raise ValueError(f"Invalid JPEG payload: {name}")
    _PRODUCT_ART_CACHE[safe] = data
    return data


class S8ProductArtView(HomeAssistantView):
    """Serve non-sensitive product artwork from a normal same-origin URL."""

    url = "/s8_omni/product-art/{mode}.jpg"
    name = "api:s8_omni:product_art"
    requires_auth = False

    async def get(self, request, mode: str):
        if mode not in {"clean", "dock"}:
            return web.Response(status=404)
        try:
            data = _product_art_bytes(mode)
        except (FileNotFoundError, ValueError, base64.binascii.Error):
            _LOGGER.exception("Unable to serve S8 OMNI product art: %s", mode)
            return web.Response(status=500)
        return web.Response(
            body=data,
            content_type="image/jpeg",
            headers={"Cache-Control": "public, max-age=86400"},
        )


async def _async_register_panel(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Serve and register the integration-owned native panel.

    Return True only when this call registered the panel. This lets setup clean up
    safely after a real platform/setup exception without removing somebody else's
    route in the unlikely event of a path collision.
    """
    if not hass.data.get("s8_omni_product_art_view_registered"):
        hass.http.register_view(S8ProductArtView)
        hass.data["s8_omni_product_art_view_registered"] = True

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
    ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if ok:
        domain_data = hass.data.get(DOMAIN, {})
        domain_data.pop(entry.entry_id, None)
        if not domain_data:
            frontend.async_remove_panel(hass, PANEL_PATH, warn_if_unknown=False)
    return ok
