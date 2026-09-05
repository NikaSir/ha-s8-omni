DOMAIN = "s8_omni"
VERSION = "v1.00_b087"
DASHBOARD_VERSION = "v0.7.41"

PANEL_ID = "s8_omni"
PANEL_PATH = "dashboard-s8-omni"
PANEL_TITLE = "Пылесос"
PANEL_ICON = "mdi:robot-vacuum"
PANEL_STATIC_URL = "/s8_omni/frontend"
PANEL_PARENT_PATH = "/dashboard-actions/home"

CONF_DEVICE_ID = "device_id"
CONF_LOCAL_KEY = "local_key"
CONF_PROTOCOL_VERSION = "protocol_version"
CONF_SCAN_INTERVAL = "scan_interval"

DEFAULT_PROTOCOL_VERSION = "3.3"
DEFAULT_SCAN_INTERVAL = 5

DP_POWER_GO = 1
DP_PAUSE = 2
DP_MODE = 4
DP_STATUS = 5
DP_CLEAN_TIME = 6
DP_CLEAN_AREA = 7
DP_BATTERY = 8
DP_SUCTION = 9
DP_WATER = 10
DP_SIDE_BRUSH_LIFE = 17
DP_MAIN_BRUSH_LIFE = 19
DP_FILTER_LIFE = 21
DP_DND = 25
DP_VOLUME = 26
DP_RESUME_CLEANING = 27
DP_FAULT = 28
DP_CUSTOM_MODE = 39
DP_WORK_MODE = 41
DP_CHILD_LOCK = 47
DP_DUST = 134
DP_ROLL_CLEAN = 135
DP_ROLL_DRY = 136

SUCTION_OPTIONS = ["gentle", "normal", "strong"]
# DP10 / Tuya code `cistern` is verified to expose four levels.
# `closed` was captured on 2026-08-21 and `middle` was confirmed by the
# 2026-08-30 Home Assistant config-entry diagnostics from the real device.
WATER_OPTIONS = ["closed", "low", "middle", "high"]
# These values are retained for factual display/remembering of DP4 states.
# Direct DP4 writes are blocked in select.py; only verified vacuum actions may write mode.
CLEAN_MODE_OPTIONS = ["smart", "selectroom", "zone", "pose", "part"]
DEFAULT_CLEAN_MODE = "smart"
MODE_OPTIONS = ["smart", "zone", "pose", "part", "chargego", "wallfollow", "selectroom"]
