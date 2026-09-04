# S8 OMNI Tuya cloud schema evidence — 2026-09-04

## Classification

This document records the Tuya cloud schema and raw status values of the **actual S8 OMNI** from a saved Home Assistant Tuya diagnostic.

Product ID:

```text
ouh93tro69lmgafr
```

This is `S8_SCHEMA_VERIFIED` evidence. A writable function still requires physical confirmation before being promoted to the production write contract.

## Numeric datapoint map recovered from the actual product schema

| DP | Tuya code | Type | Schema detail |
|---:|---|---|---|
| 1 | `power_go` | Boolean | cleaning switch |
| 2 | `pause` | Boolean | pause state/control |
| 3 | `switch_charge` | Boolean | schema-defined charging control; not physically adopted in current integration |
| 4 | `mode` | Enum | `smart`, `zone`, `pose`, `part`, `chargego` |
| 5 | `status` | Enum | `standby`, `zone_clean`, `part_clean`, `cleaning`, `paused`, `goto_pos`, `pos_arrived`, `pos_unarrive`, `goto_charge`, `charging`, `charge_done`, `sleep` |
| 6 | `clean_time` | Integer | minutes |
| 7 | `clean_area` | Integer | area |
| 8 | `electricity_left` | Integer | 0..100 % |
| 9 | `suction` | Enum | `gentle`, `normal`, `strong` |
| 10 | `cistern` | Enum | `closed`, `low`, `middle`, `high` |
| 11 | `seek` | Boolean | locate robot |
| 12 | `direction_control` | Enum | `forward`, `backward`, `turn_left`, `turn_right`, `stop` |
| 13 | `reset_map` | Boolean | map reset |
| 14 | `path_data` | Raw | path transport |
| 15 | `command_trans` | Raw | **complex RobotProtocol command transport** |
| 16 | `request` | Enum | `get_map`, `get_path`, `get_both` |
| 17 | `edge_brush` | Integer | 0..12000 min |
| 18 | `reset_edge_brush` | Boolean | side-brush reset |
| 19 | `roll_brush` | Integer | 0..18000 min |
| 20 | `reset_roll_brush` | Boolean | roller-brush reset |
| 21 | `filter` | Integer | 0..9000 min |
| 22 | `reset_filter` | Boolean | filter reset |
| 25 | `switch_disturb` | Boolean | master DND switch |
| 26 | `volume_set` | Integer | 0..100 % |
| 27 | `break_clean` | Boolean | breakpoint/resume feature |
| 28 | `fault` | Bitmap | 30 labelled bits |
| 32 | `device_timer` | Raw | RobotProtocol timer transport |
| 33 | `disturb_time_set` | Raw | RobotProtocol DND schedule transport |
| 35 | `voice_data` | Raw | extended RobotProtocol voice transport |
| 39 | `customize_mode_switch` | Boolean | room/custom cleaning flag |

Manufacturer-specific station DPs 134/135/136 are not represented in this older cloud schema snapshot, but are separately verified by actual LAN telemetry and official-app physical captures.

## DP145 conclusion

DP145 is absent from:

1. the saved Tuya cloud/local strategy schema for product `ouh93tro69lmgafr`; and
2. repeated TinyTuya LAN `reported_dp_ids` snapshots of the actual robot.

It is therefore removed from active S8 command hypotheses. No write to DP145 is authorized.

## Actual DP15 value captured from S8

Saved Tuya status contains:

```text
command_trans = qgABFxeqAAITABOqAAIbABuqAAMpAAApqgADFQAAFQ==
```

Base64 decoding yields 31 bytes containing five consecutive, checksum-valid Tuya RobotProtocol V0 (`AA 00`) frames:

```text
aa00011717
aa0002130013
aa00021b001b
aa000329000029
aa000315000015
```

Frame interpretation using Tuya's public legacy command pairs:

| Command | Observed S8 frame | Legacy family |
|---:|---|---|
| `0x17` | `AA 00 01 17 17` | spot-clean counterpart/query/report family |
| `0x13` | `AA 00 02 13 00 13` | virtual-wall V1 counterpart; zero walls/data count |
| `0x1B` | `AA 00 02 1B 00 1B` | restricted-area V1 counterpart; zero areas |
| `0x29` | `AA 00 03 29 00 00 29` | zone-clean V1 counterpart; empty/default selection |
| `0x15` | `AA 00 03 15 00 00 15` | room-clean V1 counterpart; empty/default selection |

### Strong consequence

The actual S8 is not merely schema-compatible with Tuya's public RobotProtocol: it has been observed carrying the legacy V0 wire format in DP15.

Therefore the highest-priority S8 write candidates become the matching legacy App→Robot commands:

```text
room clean       0x14  -> counterpart 0x15 observed
zone clean       0x28  -> counterpart 0x29 observed
spot clean       0x16  -> counterpart 0x17 observed
virtual wall     0x12  -> counterpart 0x13 observed
restricted area  0x1A  -> counterpart 0x1B observed
```

The newer Tuya command generations (`0x56`, `0x3A`, `0x3E`, `0x38`) remain useful references but are no longer the first candidates for this S8 firmware.

## S8 mode naming consequence

The product schema uses:

```text
smart
zone
pose
part
chargego
```

There is no `select_room` enum value in the actual S8 schema. Room-selection cleaning is therefore expected to pair with `mode=part`, consistent with reported state `part_clean`.

This corrects the generic current-template sequence which uses a newer semantic label `select_room`.

## Actual timer payload

Saved S8 status:

```text
device_timer = qgAMMQMBAX8UHgAAAgMC7g==
```

Decoded:

```text
AA 00 0C 31
03 01 01 7F 14 1E 00 00 02 03 02
EE
```

Using Tuya's public `0x30/0x31` V1 timer codec this means:

```text
time zone     = +3
number        = 1 timer
enabled       = 1
week mask     = 0x7F = every day
time          = 20:30
room count    = 0 = whole-house task
clean mode    = 0
fan level     = 2
water level   = 3
clean count   = 2
```

Thus S8 also directly confirms the legacy timer generation `0x30/0x31` on DP32.

## Actual DND schedule payload

Saved S8 status:

```text
disturb_time_set = qgAIMwAXOwAGKACz
```

Decoded:

```text
AA 00 08 33 00 17 3B 00 06 28 00 B3
```

Using Tuya's public DND V1 decoder (`0x32/0x33`):

```text
time-zone byte = 0
start           = 23:59
end             = 06:40
```

This proves that S8 uses the older DND pair `0x32/0x33` on DP33, not the newer `0x40/0x41` transport previously considered as the leading candidate.

The time-zone byte is recorded exactly as observed. Its relationship to the Home Assistant/Tuya account timezone must not be inferred from one sample.

## Actual voice payload

Saved S8 status:

```text
voice_data = qwAAAAAHNQAAAAADZJw=
```

Decoded extended frame:

```text
AB 00 00000007 35 00000000 03 64 9C
```

Tuya's public `decodeVoice0x35` gives:

```text
languageId = 0
status     = 3
progress   = 100
```

This confirms the extended `AB` voice protocol `0x34/0x35` on DP35.

## Revised confidence ladder

### S8 wire-format verified

- DP15 is `command_trans` Raw.
- DP15 carries concatenated `AA 00` legacy RobotProtocol frames.
- S8 has produced counterpart opcodes `0x17`, `0x13`, `0x1B`, `0x29`, `0x15`.
- DP32 carries timer `0x31` V0 frames.
- DP33 carries DND `0x33` V0 frames.
- DP35 carries extended voice `AB ... 0x35` frames.

### S8 schema verified but not production-write verified

- DP3 `switch_charge`.
- DP11 `seek`.
- DP12 `direction_control`.
- DP13 `reset_map`.
- DP14 `path_data`.
- DP16 `request`.
- DP18/20/22 consumable resets.
- DP32/33/35 corresponding write operations.

### Needs one outbound S8 capture before production write

- room clean `0x14` + `mode=part` + cleaning start;
- zone clean `0x28` + `mode=zone` + cleaning start;
- spot clean `0x16` + `mode=pose` + cleaning start;
- virtual-wall `0x12`;
- restricted-area `0x1A`.

The binary frame generation is now strongly constrained by actual S8 evidence, but the exact write ordering and payload for a live S8 task should still be captured once from Smart Life before enabling these controls in Home Assistant.
