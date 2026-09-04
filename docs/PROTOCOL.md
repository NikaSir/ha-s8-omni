# S8 OMNI verified Tuya DP contract

> Каноническая база знаний по устройству: [`docs/S8_OMNI_KNOWLEDGE_BASE.md`](S8_OMNI_KNOWLEDGE_BASE.md). Этот файл остаётся узким production-контрактом подтверждённых DP, статусов, связи и уже разрешённых управляющих последовательностей.

This document records datapoints verified through Tuya Developer Platform, LocalTuya observation and controlled physical tests. Names below are internal protocol semantics; UI translations belong in Home Assistant presentation.

| DP | Code / meaning | Type | Verified notes |
|---:|---|---|---|
| 1 | `power_go` / `switch_go` | bool | `true` while running/continuing; `false` during pause/stop transitions |
| 2 | `pause` | bool | `true` when paused/idle; `false` while running |
| 4 | `mode` | enum | observed `smart`, `chargego`; model also exposes zone/pose/part variants |
| 5 | `status` | enum | robot reporting state; observed `smart`, `paused`, `standby`, `sleep`, `goto_charge`, `charge_done`, `charging`, `repositing` and model-supported cleaning/navigation states |
| 6 | `clean_time` | value | minutes |
| 7 | `clean_area` | value | square metres in current HA presentation |
| 8 | `battery_percentage` | value | 0–100 % |
| 9 | `suction` | enum | `gentle`, `normal`, `strong`; official app labels are Quiet, Normal, Strong |
| 10 | `cistern` | enum | water delivery level; verified values are `closed`, `low`, `middle`, `high`. The real-device Home Assistant diagnostics captured `middle` on 2026-08-30; official app labels it Medium |
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
| 134 | `dp_dust` | bool | station dust collection; official-app capture confirmed `true` start / `false` stop |
| 135 | `dp_roll_clean` | bool | station roller self-cleaning; official-app capture confirmed `true` start / `false` stop |
| 136 | `dp_roll_hot` | bool | station roller drying; official-app capture confirmed `true` start / `false` stop |

## Command sequences used in current builds

- **Fresh start:** one atomic Tuya request containing `mode=smart`, `pause=false` and `power_go=true`. The official application capture showed all three values change in the same polling interval; separate writes are not used because the robot can act on an intermediate transport state.
- **Continue a paused job:** write only `pause=false`. Real-device testing showed that this resumes the existing job immediately; a following `power_go=true` makes the robot pause again.
- **Pause:** `power_go=false` → `pause=true`.
- **Return home during active cleaning:** write `power_go=false` → `pause=true`, wait for factual `status=standby|paused`, then write `mode=chargego` and wait up to 30 seconds for `status=goto_charge|repositing|charging|charge_done`. The 2026-09-01 real-device trace showed direct `chargego` being acknowledged three times without movement; after Pause reached `standby`, `chargego` produced `goto_charge` after about 15 seconds and `charging` after another 25 seconds.
- **Return home while not cleaning:** write `mode=chargego` directly and wait for the same factual return/dock states.
- **Station operations:** DP134/135/136 use `true` to start and `false` to stop dust collection, mop washing and mop drying respectively. The official-app diagnostic capture recorded both transitions for all three controls. Start is guarded to docked states (`charging` / `charge_done`).

DP4 also carries the user-selected Clean Mode. Because `chargego` is a temporary service value used by return-to-base, the integration remembers the last non-service Clean Mode (`smart`, `selectroom`, `zone`, `pose`, or observed `part`) and exposes that remembered value through the Home Assistant `mode` select while docked. DP41 `work_mode` is a separate device work-type signal and is not used as the Clean Mode selector.

DP5 `status` is treated as report-only and is never written.

## Normalized status contract

Starting with `v1.00_b004`, the integration owns the status interpretation used by every UI.

### Robot status

Known DP5 values are normalized to stable semantic states, including:

- `standby` → `idle`
- `smart` / `cleaning` → `cleaning`
- `zone_clean` → `zone_cleaning`
- `part_clean` / `select_room` → `room_cleaning`
- `paused` → `paused`
- `goto_charge` → `returning_to_dock`
- `charging` → `charging`
- `charge_done` → `charged`
- `sleep` → `sleeping`
- `fault` or non-zero DP28 → `error`
- `repositing` → `repositioning`

An absent or unrecognized DP5 becomes `unknown`. It is never coerced to `idle`.

### Station status

Station status is derived only from the three verified station telemetry flags:

- DP134 true → `dust_collection`
- DP135 true → `roller_cleaning`
- DP136 true → `drying`

If more than one flag is true, the station state is `multiple_operations` and the integration exposes all active operations in an attribute. No arbitrary priority is invented.

If all three station DPs are present and false, the station state is `idle`. If no station operation is active but at least one required station DP is missing, the station state is `unknown` rather than `idle`.

### Composite status

The reusable composite sensor combines robot, station, dock inference, battery, mode and fault context. Active station work overrides a generic docked presentation so that, for example, a robot at the dock while DP136 is true is represented as `docked_drying`, not simply `docked`.

This composite entity is the canonical status source for the native `/dashboard-s8-omni` panel and for `ha-contract-generated-ui` summary rendering.

## Official app terminology reference

The English application UI is used as the semantic reference because its Russian localization is inconsistent. The following labels are confirmed from the application UI, but they do **not** by themselves prove a raw DP write mapping:

- Clean modes: `Smart`, `Select Room`, `Zone Cleaning`, `Where To Sweep`.
- Water: `Closed`, `Low`, `Medium`, `High`.
- Suction: `Quiet`, `Normal`, `Strong`.
- Settings: `Timer`, `Room Manage`, `Record`, `Voice and volume`, `Switch disturb`, `Manual`, `Consumables management`, `Seek Robot`.
- Switches/functions: `Button Child Lock`, `Breakpoint continuous scanning`, `Dust box collects dust`, `Mop self cleaning`, `Mop drying`.
- DND contains an enable switch plus explicit start and end times.
- Consumables UI exposes filter, edge brush and roller brush remaining life plus separate Reset actions.

These labels are a presentation/semantics reference only. New write commands are added to the integration only after controlled DP logging and physical verification.

## State rule

`docked` means only **at the dock**; it must not imply that station operations have finished. Station operations are represented separately by DP134/135/136.

## Raw/String DP policy

Unknown Raw/String datapoints are not decoded from a single sample. Multiple controlled samples are required before interpretation is added.


## Local connection and telemetry freshness contract

S8 OMNI is `local_polling` only. The shared robot/station connectivity entity represents the direct Tuya LAN poll and does not imply any Tuya Cloud fallback.

- `unknown` before the first completed poll is presented as **Нет данных**.
- successful current poll is presented as **Локально**.
- failed current poll is presented as **Нет связи**.
- telemetry is **Данные актуальны** only while a successful snapshot exists, the latest poll is successful, and snapshot age is no greater than three configured polling periods.
- telemetry becomes **Данные устарели** immediately after a failed current poll, even if the last successful snapshot is younger than the time threshold.
- if no successful snapshot has ever been received, telemetry is **Нет данных**.
- default polling interval is 5 seconds; configured range is 3–60 seconds; stale threshold is `scan_interval * 3`.

When disconnected, cached robot/station/battery/mode values are retained only for diagnostics and are not presented by the native panel as current truth. Device actions remain disabled while Header and bottom navigation stay usable. Polling continues so recovery is automatic.
