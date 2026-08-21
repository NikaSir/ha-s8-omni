# S8 OMNI for Home Assistant

Home Assistant integration project for **S8 OMNI** robot-vacuum and station telemetry/control.

## Status

Repository bootstrap is in progress. Current verified behavior is based on Home Assistant/LocalTuya experimentation and will be migrated only after the device protocol and entity contract are documented sufficiently for a standalone integration.

## Scope

This repository is intended for the Home Assistant integration layer: robot status/control, battery/mode/fan telemetry, station operations, composite status, diagnostics, tests, documentation, HACS packaging, and releases.

## Repository policy

- Default branch: `main`.
- Tuya local keys, cloud credentials, tokens, device secrets, and private diagnostic payloads must never be committed.
- Unknown/unavailable device state must not be silently mapped to a normal state.
- Shared contribution/security defaults are inherited from `NikaSir/.github` unless overridden here.

## Target layout

```text
custom_components/s8_omni/
docs/
.github/workflows/
hacs.json
```

Standalone integration code will be introduced after the verified LocalTuya behavior is converted into a documented protocol/entity contract.
