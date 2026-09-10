# Close Tuya schema reference: Cecotec Conga X70

## Classification

`FAMILY_REFERENCE_ONLY`

This file records a very close public Tuya laser-vacuum schema for comparison with the actual S8 OMNI schema. It is **not** authorization to copy writes from the donor device.

Public source: make-all/tuya-local issue #4083, product ID `j9a3cjk1xuzjakgp` (Cecotec Conga X70).

## Why this reference matters

The Conga X70 public cloud spec matches the S8's old laser-vacuum contract unusually closely:

```text
DP1   switch_go / power_go family
DP2   pause
DP3   switch_charge
DP4   mode = smart, zone, pose, part, chargego
DP5   status = standby, zone_clean, part_clean, cleaning, paused,
       goto_pos, pos_arrived, pos_unarrive, goto_charge, charging,
       charge_done, sleep
DP6   clean_time
DP7   clean_area
DP8   battery
DP9   suction
DP10  cistern
DP11  seek
DP12  direction_control
DP13  map reset
DP14  path_data Raw
DP15  command_trans Raw
DP16  request = get_map|get_path|get_both
DP17/19/21 consumable life
DP25  DND switch
DP26  volume
DP27  break_clean
DP28  fault
DP32  device_timer Raw
DP33  disturb_time_set Raw
DP35  voice_data Raw
DP39  customize_mode_switch
```

The exact field names vary slightly (`battery_percentage`, `map_reset`, etc.), but the numeric layout, scalar mode family, and Raw transports line up with the recovered S8 schema.

## Consequence

This independently supports the conclusion that the S8 belongs to Tuya's older laser-vacuum DP contract rather than a newer `select_room`-centric schema.

It does **not** prove that Conga X70 and S8 use identical RobotProtocol payloads, map versions, room IDs, station extensions, or firmware behavior.

## Write-safety rule

No Conga X70 command may be sent to S8 unless the same command has first been observed outbound from the S8 Smart Life panel or otherwise physically verified on the S8 itself.
