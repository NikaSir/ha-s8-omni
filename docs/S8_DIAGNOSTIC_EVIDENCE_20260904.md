# S8 OMNI local diagnostic evidence — 2026-09-04

## Status

This file records evidence from previously saved Home Assistant diagnostics for the user's actual S8 OMNI. It is stronger than family references, but it still does not prove a write-only or panel-only datapoint that was never returned by the LAN status call.

## Observed datapoints

The latest saved diagnostic capture reported exactly these datapoint IDs through normal Tuya LAN polling:

```text
1, 2, 4, 5, 6, 7, 8, 9, 10,
17, 19, 21, 25, 26, 27, 28,
39, 41, 47, 134, 135, 136
```

The same set is present in multiple saved diagnostics.

### Consequence for DP145

DP145 was **not observed** in those LAN status snapshots. It must therefore be removed from the active list of observed S8 datapoints.

Important nuance: absence from `reported_dp_ids` does not mathematically prove that DP145 cannot be write-only or panel-only. It proves only that our actual S8 did not return it in the ordinary local status response captured by the integration.

Therefore the correct classification is:

```text
DP145 = NOT_OBSERVED_ON_S8_LAN
```

not `S8_VERIFIED`, not a `command_trans` candidate, and not safe to write.

## Verified station capture

A 90-second diagnostic capture recorded the following real station transitions while the robot remained docked/charging:

```text
roller_cleaning true
-> all station operations false
-> roller_drying true
-> all false
-> dust_collection true
-> all false
-> roller_cleaning true
-> all false
-> roller_drying true
```

This confirms that DP134/135/136 are independent station operation flags and that the station can transition between those operations while robot `mode=chargego` and `status=charging` remain unchanged.

## Limitation of the old protocol trace

The historic `protocol_trace` stores normalized/known fields and the integration's own requested/acknowledged writes. It does **not** preserve every raw DP returned in every Tuya packet.

Consequently:

- the trace is sufficient to verify DP1/2/4 and DP134/135/136 state transitions;
- it cannot prove the absence of an unknown Raw DP during a Smart Life room/zone action;
- future captures intended to discover `command_trans` must preserve the complete raw DP dictionary before normalization/filtering.

## Required change to the research method

For room/zone/point research, collect two independent streams:

1. **Panel-side TX** — intercept `publishDps` / `publishCommands` in Smart Life.
2. **LAN-side RAW** — record the complete unfiltered TinyTuya status/receive payload, including previously unknown DP IDs and raw/string values.

A datapoint is promoted to `S8_VERIFIED_COMMAND_TRANSPORT` only when its exact numeric ID and payload are observed in the actual S8 action and the physical result matches.
