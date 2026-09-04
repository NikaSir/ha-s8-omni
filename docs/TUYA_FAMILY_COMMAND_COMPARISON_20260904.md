# Tuya laser-vacuum command comparison — 2026-09-04

## Purpose

Compare independent Tuya laser-vacuum implementations without treating donor datapoint numbers or payloads as S8 facts.

## Reference A — official Tuya RobotProtocol

The public Tuya `RobotProtocol` defines room clean V1 with command byte `0x14`.

For one room and one pass the payload shape is:

```text
AA 00 04 14 01 01 ROOM_ID CHECKSUM
```

for frame protocol version 0, where:

```text
CHECKSUM = (0x14 + 0x01 + 0x01 + ROOM_ID) & 0xFF
```

The newer public panel template can also use `0x56` room-clean V2 with per-room cleaning parameters.

## Reference B — Proscenic Q8, independent 2026 reverse engineering

The `Verandi/proscenic-q8-tuya` project independently captured and reproduced exactly the V1 room-clean frame:

```text
AA 00 04 14 01 01 ROOM_ID CHECKSUM
```

It sends the resulting Base64 value through a Tuya command whose semantic code is exactly:

```text
command_trans
```

This is a strong independent confirmation that the public Tuya V1 command is deployed in real consumer products and is not merely a sample codec.

It is **not** evidence that S8 uses the same numeric DP or room payload version.

## Reference C — Airrobo T20+ / Abir X9, 2026 field research

Recent `tuya-local` community research reports:

- Tuya protocol 3.3;
- advanced map navigation carried on raw DP15;
- room commands requiring additional map/session state and resisting static replay;
- zone and Pin&Go payloads that can be replayed locally in that OEM firmware;
- command acceptance depending on robot motion/state in that platform.

This reference is important because it demonstrates that two Tuya laser-vacuum families can expose the same high-level UI concepts while applying different additional validation rules around map-based commands.

Therefore a syntactically valid `0x14`, `0x3A` or `0x3E` frame is not automatically sufficient for S8.

## Reference D — BSTY M3-2 / Amicro Smart

The BSTY M3-2 user documentation identifies Amicro Smart as the control application. This creates a plausible hardware/software family reference for KaringBee S8 research because the BSTY/Amicro branch exposes very similar dock, roller-wash and cleaning-mode semantics.

No captured BSTY/Amicro raw frame is currently classified as S8-compatible.

## Comparison matrix

| Evidence | `command_trans` semantic code | Room cmd | Frame v0 `AA 00` | Extra token/state possible | S8 status |
|---|---|---:|---|---|---|
| Tuya public RobotProtocol | yes in panel template | `0x14` / `0x56` | yes | implementation-dependent | `TUYA_STANDARD` |
| Proscenic Q8 | yes | `0x14` | yes | not required in published room example | `FAMILY_REFERENCE` |
| Airrobo T20+ / Abir X9 | raw DP15 observed | map/room proprietary wrapper reported | platform-specific | yes | `FAMILY_REFERENCE` |
| BSTY M3-2 / Amicro | not yet captured | unknown | unknown | unknown | `FAMILY_REFERENCE` |
| Actual S8 OMNI | not yet captured | unknown | unknown | unknown | pending |

## New decision rule

A future S8 room/zone capture must be classified in this order:

1. Does Smart Life publish an exact DP code `command_trans`, or only a numeric/raw endpoint?
2. Does its decoded payload begin with a valid Tuya `AA`/`AB` frame?
3. Which frame protocol version is used (`AA 00`, `AA 01`, or extended `AB`)?
4. Is the command byte one of the public RobotProtocol values (`0x14`, `0x56`, `0x3A`, `0x3E`, etc.)?
5. Are there bytes before/after the public payload indicating map ID, session token, sequence, timestamp, or OEM extension?
6. Does the same action generate a stable payload across two captures?
7. Does only the expected semantic field change when selecting a different room or point?

Only after those checks may an offline encoder be considered for S8.

## Immediate implication

The highest-value next capture is **one room, repeated twice without changing the room**, followed by **a different room**. The three frames let us distinguish:

- static public V1/V2 protocol;
- room-ID-only delta;
- dynamic sequence/token fields;
- map-session-dependent wrappers.

This is more informative than attempting a single replay immediately.
