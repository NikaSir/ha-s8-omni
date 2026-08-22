# S8 OMNI lifecycle and panel availability

## Principle

The integration-owned S8 OMNI panel is part of the Home Assistant application shell. Its existence must not depend on the robot being reachable during Home Assistant startup.

Hardware availability and UI availability are separate concerns:

```text
Home Assistant starts
  ↓
create coordinator
  ↓
register /dashboard-s8-omni
  ↓
set up HA entities
  ↓
attempt local Tuya refresh
  ↓
reachable    → live data
unreachable  → panel + entities remain, state is unavailable / no data
```

## Required behavior

- `/dashboard-s8-omni` is registered before the first device I/O attempt.
- Entity platforms are loaded even when the robot is offline.
- The first local refresh is non-fatal to config-entry setup.
- A failed local refresh leaves the config entry loaded and sets coordinator health to failed.
- `binary_sensor` local connection remains available and reports disconnected.
- Other coordinator-backed entities become unavailable rather than presenting stale data as current.
- The native panel stays in the sidebar and renders its unavailable-state shell.
- Automatic coordinator polling continues so recovery happens without deleting/re-adding the integration.

## What must not happen

Do not gate panel or platform registration behind:

```python
await coordinator.async_config_entry_first_refresh()
```

That pattern makes a transient hardware outage a UI lifecycle failure: if the first poll fails, the config entry never reaches panel registration and the S8 OMNI application disappears from Home Assistant.

## Removal and reload

A normal config-entry unload still unloads platforms and removes the panel when the last S8 OMNI entry is unloaded. Reconfigure/reload therefore preserves the existing lifecycle contract without leaving an orphan panel.
