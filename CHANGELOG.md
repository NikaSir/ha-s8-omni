# Changelog

All notable project changes are recorded here.

## [Unreleased]

### Added

- `v1.00_b003`: add a Home Assistant **Reconfigure** flow for S8 OMNI local connection parameters: IP address, Device ID, Local Key and Tuya protocol version.
- `v1.00_b003`: validate reconfigured connection values against the robot before saving and reload the config entry only after a successful update.
- `v1.00_b003`: use a password-style input for Local Key in the initial and reconfigure flows.
- `v1.00_b003`: automatically reload the integration after changing the polling interval through Options.
- Standalone `s8_omni` Home Assistant integration skeleton.
- Local Tuya LAN coordinator using `tinytuya`.
- Config flow for IP address, Device ID, Local Key, protocol version and scan interval.
- Vacuum entity with start, pause, return-to-base and fan-speed control.
- Battery, cleaning time/area, brush/filter lifetime, fault and work-mode sensors.
- OMNI station binary sensors for dust collection, roller cleaning and roller drying.
- Controls for DND, child lock, suction, water level and volume.
- HACS metadata, protocol documentation and acceptance test plan.

### Fixed

- `v1.00_b002`: add the fourth verified DP10 / `cistern` water level `closed` (application label: «Закрыто»). The value was captured from Tuya `Get Status Reporting Log` during a live device test.

### Known limitations

- Stop command is intentionally not implemented in `v1.00_b001` / `v1.00_b002` / `v1.00_b003`.
- Consumable/map reset writes are intentionally deferred pending verification.
- DND schedule, cleaning timers and raw map/control payloads are intentionally deferred pending verification.
