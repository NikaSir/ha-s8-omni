# Tuya laser-vacuum command comparison — 2026-09-04

## Purpose

Compare independent Tuya laser-vacuum implementations while keeping donor evidence separate from facts captured from the actual S8 OMNI.

## Actual S8 OMNI — strongest evidence

The saved Home Assistant Tuya diagnostic for product ID `ouh93tro69lmgafr` resolves the numeric schema directly:

```text
DP14 = path_data       Raw
DP15 = command_trans   Raw
DP16 = request         get_map|get_path|get_both
DP32 = device_timer    Raw
DP33 = disturb_time_set Raw
DP35 = voice_data      Raw
```

The same diagnostic contains an actual DP15 value which decodes into five consecutive, checksum-valid `AA 00` RobotProtocol frames:

```text
aa00011717      -> 0x17 spot-clean counterpart
aa0002130013    -> 0x13 virtual-wall V1 counterpart
aa00021b001b    -> 0x1B restricted-area V1 counterpart
aa000329000029  -> 0x29 zone-clean V1 counterpart
aa000315000015  -> 0x15 room-clean V1 counterpart
```

This promotes the **legacy V0 generation itself** from family hypothesis to actual S8 wire-format evidence.

The product's DP4 schema is:

```text
smart, zone, pose, part, chargego
```

and DP5 includes `part_clean`. Therefore room-selection on this S8 is expected to use the device's `part` naming, not the newer generic-template label `select_room`.

## Reference A — official Tuya RobotProtocol

The public Tuya `RobotProtocol` defines the matching legacy App→Robot commands:

```text
room clean        0x14 -> 0x15
spot clean        0x16 -> 0x17
virtual wall      0x12 -> 0x13
restricted area   0x1A -> 0x1B
zone clean        0x28 -> 0x29
```

For one room and one pass the V0 room frame shape is:

```text
AA 00 04 14 01 01 ROOM_ID CHECKSUM
```

where:

```text
CHECKSUM = (0x14 + 0x01 + 0x01 + ROOM_ID) & 0xFF
```

The newer public panel template also exposes newer generations (`0x56`, `0x3A`, `0x3E`, `0x38`), but those are no longer the leading candidates for this S8 firmware because the actual S8 has reported the old counterpart opcodes.

## Reference B — Proscenic Q8, independent 2026 reverse engineering

The `Verandi/proscenic-q8-tuya` project independently captured and reproduced exactly the V1 room-clean frame:

```text
AA 00 04 14 01 01 ROOM_ID CHECKSUM
```

and transports it through a semantic `command_trans` datapoint. This is independent confirmation that the old public format is used by real Tuya products.

It is now a supporting reference rather than the basis for the S8 hypothesis.

## Reference C — Airrobo T20+ / Abir X9 field research

Recent community research on another Tuya laser-vacuum family reports map/session state affecting some room commands. This remains a useful warning that a syntactically correct frame is not always sufficient for a different firmware.

For S8 we therefore still require one outbound Smart Life capture before enabling a new production write, even though the command generation is now strongly constrained.

## Reference D — BSTY M3-2 / Amicro Smart

BSTY M3-2 documentation identifies Amicro Smart as its control application and remains a plausible OEM-family reference for the KaringBee hardware lineage.

No BSTY/Amicro raw frame is needed to establish DP15 or the RobotProtocol generation anymore: those are now established from the actual S8 diagnostic.

## Comparison matrix

| Evidence | command transport | Room generation | `AA 00` observed | S8 role |
|---|---|---|---|---|
| **Actual S8 OMNI** | **DP15 `command_trans`** | counterpart `0x15` observed | **yes** | **S8 wire evidence** |
| Tuya public RobotProtocol | semantic `command_trans` | `0x14/0x15` V1; newer `0x56/57` | yes | protocol specification |
| Proscenic Q8 | `command_trans` | `0x14` | yes | independent supporting reference |
| Airrobo T20+ / Abir X9 | raw complex transport | OEM/map-state dependent | platform-specific | cautionary reference |
| BSTY M3-2 / Amicro | not yet captured | unknown | unknown | OEM family reference |

## Revised S8 candidate matrix

| S8 action | Numeric DP / scalar mode | Leading command | Confidence before outbound capture |
|---|---|---:|---|
| Locate robot | DP11 `seek` | Boolean pulse | schema verified |
| Manual movement | DP12 `direction_control` | enum | schema verified |
| Request map/path | DP16 `request` | `get_map/get_path/get_both` | schema verified |
| Selected-room clean | **DP15**, DP4=`part` | **`0x14`** | counterpart and transport verified |
| Zone clean | **DP15**, DP4=`zone` | **`0x28`** | counterpart and transport verified |
| Spot / where-to-clean | **DP15**, DP4=`pose` | **`0x16`** | counterpart and transport verified |
| Virtual wall | **DP15** | **`0x12`** | counterpart and transport verified |
| No-go / no-mop area | **DP15** | **`0x1A`** | counterpart and transport verified |
| Timer | DP32 | `0x30` set / actual `0x31` report | generation verified |
| DND schedule | DP33 | **`0x32` set / actual `0x33` report** | generation verified |
| Voice package | DP35 | `0x34` set / actual extended `0x35` report | generation verified |

`DP145` is no longer an active hypothesis: it is absent from the actual saved cloud schema and from repeated LAN status snapshots.

## Remaining decision rule for a write

For room/zone/spot, the next outbound capture should answer only the remaining implementation details:

1. exact payload bytes for a real room/zone/point;
2. whether Smart Life publishes only DP15 first or combines any scalar writes;
3. exact order around DP4 (`part|zone|pose`), DP1 and DP2;
4. whether the same room produces an identical frame on two successive runs;
5. whether any map/session bytes are appended beyond the public legacy payload.

The best experiment remains:

```text
same room -> stop
same room -> stop
different room -> stop
```

If the only changing payload byte is `ROOM_ID` and checksum, the public `0x14` encoder can be promoted with high confidence after physical readback.
