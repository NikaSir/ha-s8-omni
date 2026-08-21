# v1.00_b001 acceptance checklist

Before testing, back up Home Assistant and disable **only S8 OMNI** in LocalTuya to avoid two local Tuya clients contending for the device.

1. Add the integration through UI and verify successful local connection.
2. At the dock verify vacuum state, battery, fault, cleaning metrics and consumable resources.
3. Verify volume against the Tuya reference; change 30→20 %, verify, then restore 30 %.
4. Toggle Do Not Disturb and verify bidirectional state reflection.
5. Start cleaning and verify state becomes cleaning.
6. Pause and verify the robot physically pauses and state reflects pause/idle appropriately.
7. Start again and verify cleaning resumes.
8. Return home and verify `goto_charge`/returning then docked after arrival.
9. During station dust collection verify DP134.
10. During roller cleaning verify DP135.
11. During roller drying verify DP136.
12. Verify unknown/unavailable communication is not displayed as a normal robot state.

Stop testing additional write commands if any command behaves unexpectedly; collect Home Assistant logs before further changes.
