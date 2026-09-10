# External `command_trans` evidence for Tuya robot vacuums

Date: 2026-09-04

## Status

This file is **external protocol evidence only**. It does not authorize any new write to S8 OMNI.

## 1. Proscenic Q8: live reverse-engineered room command

A public 2026 reverse-engineering project for the Tuya-based Proscenic Q8 captured the Smart Life room-cleaning command and reproduced it through Tuya OpenAPI using datapoint code `command_trans`.

The reproduced room packet is:

```text
AA 00 04 14 01 01 ROOM_ID CHECKSUM
```

with:

```text
CHECKSUM = (0x14 + 0x01 + 0x01 + ROOM_ID) & 0xFF
```

The project sends the packet as Base64 to the semantic datapoint code:

```json
{"code":"command_trans","value":"<base64-packet>"}
```

This is byte-for-byte compatible with the public Tuya RobotProtocol room-clean command family `0x14` that we already use as a standard reference.

Important limitation: this was tested on Proscenic Q8, not S8 OMNI.

Reference:
- https://github.com/Verandi/proscenic-q8-tuya
- `services/robot_service.py`

## 2. Numeric DP id varies by product

A separate 2025 Tuya schema captured for Bobsweep Bio3 shows:

```text
DP105  code=command_trans  type=raw  maxlen=128  rw
DP104  code=path_data      type=raw  maxlen=128  rw
DP106  code=request        type=enum get_map/get_path/get_both rw
```

An older Abir X8 schema shows:

```text
DP15   code=command_trans  type=raw  maxlen=128  rw
DP14   code=path_data      type=raw  maxlen=128  rw
DP16   code=request        type=enum get_map/get_path/get_both rw
```

Therefore numeric DP is product-specific. `command_trans` is the stable semantic identifier; `15`, `105`, `199`, etc. are not portable.

References:
- make-all/tuya-local issue #3926 (Bobsweep Bio3)
- make-all/tuya-local issue #1033 (Abir X8)

## 3. Direct evidence from our S8 OMNI diagnostics

The saved S8 OMNI LAN diagnostics from 2026-09-01 report only these datapoint IDs:

```text
1, 2, 4, 5, 6, 7, 8, 9, 10,
17, 19, 21, 25, 26, 27, 28,
39, 41, 47,
134, 135, 136
```

No DP145 and no other Raw-like command datapoint was present in the ordinary LAN status response.

This does **not** prove that S8 lacks a `command_trans` transport. Complex command datapoints may be write-oriented, cloud/panel-visible, P2P-backed, or simply omitted from ordinary LAN status reporting. It does prove that DP145 was not part of the observed S8 LAN telemetry and must not be promoted on that basis.

## 4. Updated hypothesis ranking

### Strong

- S8 belongs to a Tuya laser-vacuum architecture in which complex room/map actions may be encoded as RobotProtocol frames.
- `0x14` is a real production room-clean command on at least one current Tuya vacuum and matches Tuya's public RobotProtocol.
- Exact datapoint binding must be resolved by `code == command_trans`, never by numeric ID.

### Still unknown for S8

- Whether S8 exposes `command_trans` at all.
- Its numeric DP id.
- Whether room cleaning uses `0x14` or `0x56`.
- Whether the S8 payload includes map/session/version tokens beyond the generic Tuya frame.
- Whether room IDs are stable across map edits/remapping.

## 5. Required proof before implementation

Promote room/zone commands to `S8_VERIFIED` only after all of the following:

1. Capture S8's actual outgoing panel write.
2. Resolve exact semantic datapoint code and numeric id.
3. Decode Base64/Raw frame and verify length/checksum.
4. Match the command byte and payload structure against the public Tuya reference.
5. Reproduce one safe room action on S8.
6. Confirm physical behavior and status/readback.
7. Verify stop/pause/home recovery.

Until then the production integration remains unchanged.
