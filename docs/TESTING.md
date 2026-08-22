# v1.00_b003 acceptance checklist

Before testing, back up Home Assistant and disable **only S8 OMNI** in LocalTuya to avoid two local Tuya clients contending for the device.

## Already verified

- [x] Integration installs through HACS and creates the S8 OMNI device.
- [x] Local polling returns live robot and station datapoints.
- [x] Volume DP26 writes from Home Assistant and is reflected in the official application.
- [x] Do Not Disturb DP25 writes from Home Assistant and is reflected in the official application.
- [x] Water DP10 switching is bidirectional for observed states; `closed` is confirmed by Tuya status log and is included from `v1.00_b002`.
- [x] Live values for battery, cleaning time/area, fault, work mode and consumable resources are visible.

## Remaining device-side acceptance

1. Set water to **Medium** in the official application and capture `cistern` in Tuya `Get Status Reporting Log`; confirm whether the raw value is `normal`.
2. Change suction `normal → strong → normal` from Home Assistant and confirm both physical/application state and local reflection.
3. Start cleaning from Home Assistant and verify the robot physically starts and the reported state becomes cleaning.
4. Pause and verify the robot physically pauses and the state reflects pause/idle appropriately.
5. Start again and verify cleaning resumes.
6. Return home and verify `goto_charge`/returning, followed by docked after arrival.
7. During station dust collection verify DP134.
8. During roller cleaning verify DP135.
9. During roller drying verify DP136.
10. Verify unknown/unavailable communication is not displayed as a normal robot state.

## v1.00_b003 configuration acceptance

1. Open the integration entry's **Reconfigure** action and confirm IP address, Device ID, Local Key and protocol version are pre-filled.
2. Confirm Local Key is rendered as a password-style field.
3. Submit unchanged valid values and verify the entry reloads successfully.
4. Enter an intentionally invalid Local Key, submit, and confirm the flow reports a connection error without overwriting the working configuration.
5. After the planned Tuya re-pair, enter the new Local Key and verify the existing config entry reconnects without removing/re-adding the integration.
6. Change the polling interval in Options and confirm the integration reloads automatically with the new interval.

Stop testing additional write commands if any command behaves unexpectedly; collect Home Assistant logs before further changes.
