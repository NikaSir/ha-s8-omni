from pathlib import Path
import json

INIT=Path('custom_components/s8_omni/__init__.py')
CONST=Path('custom_components/s8_omni/const.py')
MANIFEST=Path('custom_components/s8_omni/manifest.json')
PANEL=Path('panel.json')

p=INIT.read_text(encoding='utf-8')
p=p.replace('from pathlib import Path\nimport logging\n','from pathlib import Path\nimport base64\nimport logging\nimport re\n\nfrom aiohttp import web\n',1)
p=p.replace('from homeassistant.components.http import StaticPathConfig','from homeassistant.components.http import HomeAssistantView, StaticPathConfig',1)
marker='_LOGGER = logging.getLogger(__name__)\n'
block='''_LOGGER = logging.getLogger(__name__)\n_PRODUCT_ART_CACHE: dict[str, bytes] = {}\n\ndef _product_art_bytes(mode: str) -> bytes:\n    safe = "dock" if mode == "dock" else "clean"\n    if safe in _PRODUCT_ART_CACHE:\n        return _PRODUCT_ART_CACHE[safe]\n    text = (FRONTEND_DIR / "s8-omni-panel.js").read_text(encoding="utf-8")\n    name = f"PRODUCT_ART_{safe.upper()}_BASE64"\n    match = re.search(rf'const {name} = "([^"]+)";', text)\n    if not match:\n        raise FileNotFoundError(name)\n    data = base64.b64decode(match.group(1), validate=True)\n    if not (data.startswith(b"\\xff\\xd8") and data.endswith(b"\\xff\\xd9")):\n        raise ValueError(f"Invalid JPEG payload: {name}")\n    _PRODUCT_ART_CACHE[safe] = data\n    return data\n\nclass S8ProductArtView(HomeAssistantView):\n    url = "/s8_omni/product-art/{mode}.jpg"\n    name = "api:s8_omni:product_art"\n    requires_auth = False\n\n    async def get(self, request, mode: str):\n        if mode not in {"clean", "dock"}:\n            return web.Response(status=404)\n        try:\n            data = _product_art_bytes(mode)\n        except (FileNotFoundError, ValueError, base64.binascii.Error):\n            _LOGGER.exception("Unable to serve S8 OMNI product art: %s", mode)\n            return web.Response(status=500)\n        return web.Response(body=data, content_type="image/jpeg", headers={"Cache-Control": "public, max-age=86400"})\n'''
if 'class S8ProductArtView' not in p:
    p=p.replace(marker,block,1)
needle='async def _async_register_panel(hass: HomeAssistant, entry: ConfigEntry) -> bool:\n'
if 's8_omni_product_art_view_registered' not in p:
    p=p.replace(needle,needle+'    if not hass.data.get("s8_omni_product_art_view_registered"):\n        hass.http.register_view(S8ProductArtView)\n        hass.data["s8_omni_product_art_view_registered"] = True\n',1)
INIT.write_text(p,encoding='utf-8')

c=CONST.read_text(encoding='utf-8').replace('VERSION = "v1.00_b038"','VERSION = "v1.00_b039"').replace('DASHBOARD_VERSION = "v0.7.5"','DASHBOARD_VERSION = "v0.7.6"')
CONST.write_text(c,encoding='utf-8')
m=json.loads(MANIFEST.read_text(encoding='utf-8')); m['version']='1.0.0b39'; MANIFEST.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
panel=json.loads(PANEL.read_text(encoding='utf-8')); panel['panel']['dashboard_version']='v0.7.6'; panel['panel']['frontend']['product_art_delivery']='same_origin_http_from_verified_embedded_jpeg'; PANEL.write_text(json.dumps(panel,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
