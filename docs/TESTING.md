# v1.00_b004 acceptance checklist

Before device-side testing, back up Home Assistant and disable **only S8 OMNI** in LocalTuya to avoid two local Tuya clients contending for the device.

## Already verified

- [x] Integration installs through HACS and creates the S8 OMNI device.
- [x] Local polling returns live robot and station datapoints.
- [x] Volume DP26 writes from Home Assistant and is reflected in the official application.
- [x] Do Not Disturb DP25 writes from Home Assistant and is reflected in the official application.
- [x] Water DP10 switching is bidirectional for observed states; `closed` is confirmed by Tuya status log and is included from `v1.00_b002`.
- [x] Live values for battery, cleaning time/area, fault, work mode and consumable resources are visible.
- [x] Start cleaning is confirmed on the physical robot.
- [x] Return to base is confirmed on the physical robot.
- [x] Station dust collection has been observed and confirmed.
- [x] Station roller/mop cleaning has been observed and confirmed.
- [x] Station drying has been observed and confirmed.

## Remaining protocol acceptance

1. Set water to **Medium** in the official application and capture `cistern` in Tuya `Get Status Reporting Log`; confirm whether the raw value is `normal`.
2. Change suction `normal → strong → normal` from Home Assistant and confirm both physical/application state and local reflection.
3. Verify Pause from Home Assistant on the physical robot.
4. Verify Start after Pause resumes cleaning rather than starting an unrelated mode.
5. Keep Stop unimplemented unless a separate controlled test proves unambiguous semantics.
6. Keep station writes, DND schedule, cleaning timer, map/room payloads and consumable resets out of public UI until their write contracts are verified.

## v1.00_b003 configuration acceptance

1. Open the integration entry's **Reconfigure** action and confirm IP address, Device ID, Local Key and protocol version are pre-filled.
2. Confirm Local Key is rendered as a password-style field.
3. Submit unchanged valid values and verify the entry reloads successfully.
4. Enter an intentionally invalid Local Key, submit, and confirm the flow reports a connection error without overwriting the working configuration.
5. After the planned Tuya re-pair, enter the new Local Key and verify the existing config entry reconnects without removing/re-adding the integration.
6. Change the polling interval in Options and confirm the integration reloads automatically with the new interval.

## v1.00_b004 panel acceptance — iPhone Pro Max portrait

Open `/dashboard-s8-omni` and verify all of the following without using the Tuya application as the primary UI.

### Layout and navigation

- [ ] No horizontal scrolling at iPhone Pro Max portrait width.
- [ ] Overview status and Start/Pause/Home controls are visible near the top.
- [ ] Bottom navigation provides Overview, Cleaning, Station, Maintenance and Diagnostics.
- [ ] Touch targets are comfortably separated and usable one-handed.
- [ ] Home Assistant header and iOS safe areas do not cover content or navigation.
- [ ] Long press on entity-backed rows opens native Home Assistant more-info.

### Required state scenarios

- [ ] Robot at base with no active station operation.
- [ ] Normal cleaning.
- [ ] Pause, when physical Pause acceptance is complete.
- [ ] Return to base.
- [ ] Charging.
- [ ] Charge complete.
- [ ] Station dust collection.
- [ ] Station roller/mop cleaning.
- [ ] Station drying.
- [ ] Robot fault.
- [ ] Unknown/unrecognized robot status.
- [ ] Whole S8 OMNI unavailable.
- [ ] One station DP missing from an otherwise successful snapshot.

### Critical dock/station scenario

When the vacuum entity is docked while an OMNI station operation is active, the panel must show the active station operation in the composite status. A station operation must never be hidden behind a generic «На базе» state.

### Unknown/unavailable assertions

- [ ] Unknown robot DP5 is not rendered as idle/standby.
- [ ] A missing station DP is not rendered as Off.
- [ ] If no station operation is active but any required station DP is missing, station status is `unknown`, not `idle`.
- [ ] Whole-device communication failure renders entities/panel as unavailable rather than preserving a stale normal state.
- [ ] Telemetry age remains useful for diagnostics after the last successful update.

### UI safety assertions

- [ ] No panel action writes a Tuya DP directly.
- [ ] No LocalTuya service is called by the panel.
- [ ] No cloud API is called by the panel.
- [ ] No station write buttons appear while DP134/135/136 remain read-only.
- [ ] Map/room controls remain a placeholder until the integration provides a stable public API.
- [ ] Consumable percentages are not invented from remaining minutes.

Stop testing additional write commands if any command behaves unexpectedly; collect Home Assistant logs before further changes.
