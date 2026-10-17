# TuyaOS 2026 laser-vacuum complex protocol — relevance to S8 OMNI

Date: 2026-09-04
Classification: `TUYA_STANDARD`, not `S8_VERIFIED`

## New official evidence

Current TuyaOS documentation (updated April 2026) explicitly separates robot controls into two classes:

1. **Basic controls** — cleaning switch, status and similar simple features are communicated through ordinary DPs.
2. **Complex controls** — virtual walls, room properties, selected-room cleaning, zone cleaning, spot cleaning, schedules, DND and map editing are handled by dedicated laser-vacuum SDK APIs.

The SDK parses complex commands coming from the cloud/panel and delivers structured callbacks to the robot business application.

This is consistent with our empirical S8 observation: ordinary TinyTuya `status()` returns the simple operational datapoints but no obvious room/map command endpoint.

It does not prove which legacy/transport DP or cloud channel the S8 firmware uses internally.

## Official command families in current TuyaOS

The April 2026 documentation lists at least:

```text
VIRTUAL_WALL_SET / QUERY
RESTRICTED_AREA_SET / QUERY
ROOM_PROPERTY_SET / QUERY
ROOM_CLEAN_SET / QUERY
ZONE_CLEAN_SET / QUERY
SPOT_CLEAN_SET / QUERY
SCHEDULE_SET / QUERY
QUIET_HOUR_SET / QUERY
PART_DIVI_SET
PART_MERGE_SET
PART_DEFAULT_SET
RESET_CURR_MAP_SET
SAVE_CURR_MAP_SET
DELETE_CLOUD_MAP_SET
VOICE_LANGUAGE_QUERY
DEV_INFO_QUERY
```

The semantic coverage closely matches the older public Ray `RobotProtocol` command families (`0x12`, `0x14`, `0x3A`, `0x3E`, etc.). This supports continuity of the feature model but does **not** guarantee byte-for-byte compatibility across firmware generations.

## Room clean structure

Current TuyaOS exposes selected-room cleaning to device firmware as a structured object conceptually containing:

```text
num
map_id
ids[]
sweep_mode[]
param[]
```

Important official note: for SET commands sent by the panel, `map_id` is not supplied to the application; the device determines the current map itself. When reporting/querying, the device must include `map_id` so the panel can match data to the correct map.

This is useful for interpreting third-party reports about dynamic map/session state: map identity can be validated at a different layer than the visible room-ID payload.

## Per-room cleaning parameters

Current cleaning parameter structures include semantic fields for:

```text
suction
cistern
water_value (1..30)
route_preference
clean_direction
y_mop
clean_cnt
```

This confirms that per-room suction/water/route/count concepts are first-class features in modern Tuya laser-vacuum SDKs. It does not prove that the S8 firmware implements every field.

## Zone and spot clean

The current API supports polygonal zone cleaning with independent cleaning parameters per zone and spot cleaning with map coordinates and cleaning parameters.

Again, this matches the older RobotProtocol feature model while allowing the underlying transport framing to evolve.

## Implication for S8 reverse engineering

The absence of a `command_trans` DP from ordinary S8 LAN polling is no longer surprising and must not be interpreted as evidence that map-based control is impossible locally.

There are at least three plausible architectures:

```text
A. Legacy Raw DP transport (`command_trans`) visible only on write/event paths.
B. OEM-specific Raw DP transport filtered from normal status snapshots.
C. Newer complex-protocol/cloud SDK path where the robot-side Tuya SDK parses the transport before the application layer.
```

Our capture strategy remains valid because panel-side interception sees the control request before ambiguity is introduced by the device-side implementation.

## Evidence promotion rule

For S8, a complex function becomes verified only after the actual Smart Life panel action is captured and correlated with device behaviour. Current TuyaOS documentation is used to interpret semantics, never to invent numeric DP IDs or write payloads.

## Primary sources

- Tuya Developer: `Complex Protocol Control for Laser Robot Vacuum`, updated 2026-04-22.
- Tuya Developer: `Device Control and Protocol Interaction`, updated 2026-04-08.
