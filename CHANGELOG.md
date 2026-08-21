# Changelog

All notable project changes are recorded here.

## [Unreleased]

### Added

- Standalone `s8_omni` Home Assistant integration skeleton.
- Local Tuya LAN coordinator using `tinytuya`.
- Config flow for IP address, Device ID, Local Key, protocol version and scan interval.
- Vacuum entity with start, pause, return-to-base and fan-speed control.
- Battery, cleaning time/area, brush/filter lifetime, fault and work-mode sensors.
- OMNI station binary sensors for dust collection, roller cleaning and roller drying.
- Controls for DND, child lock, suction, water level and volume.
- HACS metadata, protocol documentation and acceptance test plan.

### Known limitations

- Stop command is intentionally not implemented in `v1.00_b001`.
- Consumable/map reset writes are intentionally deferred pending verification.
