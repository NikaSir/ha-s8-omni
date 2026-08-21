# S8 OMNI verified Tuya DP contract

This document records datapoints verified through Tuya Developer Platform, LocalTuya observation and controlled physical tests. Names below are internal protocol semantics; UI translations belong in Home Assistant presentation.

| DP | Code / meaning | Type | Verified notes |
|---:|---|---|---|
| 1 | `power_go` / `switch_go` | bool | `true` while running/continuing; `false` during pause/stop transitions |
| 2 | `pause` | bool | `true` when paused/idle; `false` while running |
| 4 | `mode` | enum | observed `smart`, `chargego`; model also exposes zone/pose/part variants |
| 5 | `status` | enum | robot reporting state; observed `smart`, `paused`, `standby`, `sleep`, `goto_charge`, `charge_done`, `charging`, `repositing` |
| 6 | `clean_time` | value | minutes |
| 7 | `clean_area` | value | square metres in current HA presentation |
| 8 | `battery_percentage` | value | 0–100 % |
| 9 | `suction` | enum | `gentle`, `normal`, `strong` |
| 10 | `cistern` | enum | water delivery level; `high` confirmed as High |
| 17 | `edge_brush_life` | value | remaining side-brush resource, minutes |
| 19 | `roll_brush_life` | value | remaining main/roller-brush resource, minutes |
| 21 | `filter_life` | value | remaining filter resource, minutes |
| 25 | `do_not_disturb` | bool | DND |
| 26 | `volume_set` | value | 0–100 %, experimentally confirmed by 0→30 % change |
| 27 | `break_clean` | bool | resume-cleaning-related state; diagnostic by default |
| 28 | `fault` | bitmap | raw fault value; `0` = no reported fault at test time; bit meanings are not invented |
| 39 | `customize_mode_switch` | bool | custom-mode flag; diagnostic by default |
| 41 | `work_mode` | enum | observed `both_work` |
| 47 | `child_lock` | bool | child lock |
| 134 | `dp_dust` | bool | station dust collection; Device Logs confirmed dust on/off |
| 135 | `dp_roll_clean` | bool | station roller self-cleaning; Device Logs confirmed on/off |
| 136 | `dp_roll_hot` | bool | station roller drying; `true` confirmed during drying |

## Command sequences used in b001

- **Start / continue:** `mode=smart` → `pause=false` → `power_go=true`.
- **Pause:** `power_go=false` → `pause=true`.
- **Return home:** `mode=chargego` → `pause=false` → `power_go=true`.

DP5 `status` is treated as report-only and is never written.

## State rule

`docked` means only **at the dock**; it must not imply that station operations have finished. Station operations are represented separately by DP134/135/136.

## Raw/String DP policy

Unknown Raw/String datapoints are not decoded from a single sample. Multiple controlled samples are required before interpretation is added.
