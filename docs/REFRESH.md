# Manual refresh contract

S8 OMNI exposes an integration-owned Home Assistant button named **Обновить сейчас**.

Pressing the button calls the coordinator's `async_request_refresh()` and performs an immediate local telemetry read. It is a read/refresh operation only.

The refresh contract must not:

- write robot or station Tuya datapoints;
- call LocalTuya;
- call Tuya cloud APIs;
- change cleaning, pause, mode or station-operation state by itself.

The native panel header uses this public button entity through Home Assistant's `button.press` service. If the entity cannot be resolved, the header action remains disabled rather than falling back to a direct device/network call.
