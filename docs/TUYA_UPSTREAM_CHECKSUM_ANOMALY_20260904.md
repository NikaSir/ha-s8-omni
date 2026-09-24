# Tuya RobotProtocol upstream checksum anomaly — 2026-09-04

## Finding

The public Tuya `RobotProtocol` room-clean unit test contains this V0 `0x15` report fixture:

```text
aa000615010304050324
```

Its command+data bytes are:

```text
15 01 03 04 05 03
```

Their sum modulo 256 is:

```text
0x15 + 0x01 + 0x03 + 0x04 + 0x05 + 0x03 = 0x25
```

Tuya's own `getCheckSum(value)` implementation in `utils/RobotProtocol/src/utils/command.ts` performs exactly this byte sum modulo 256.

Therefore the checksum-consistent frame is:

```text
aa000615010304050325
```

## Classification

This is treated as an **upstream test-fixture anomaly**, not as an alternative checksum algorithm.

Reasons:

1. Tuya's encoder implementation explicitly sums `cmd + data` modulo 256.
2. Other public RobotProtocol vectors and actual S8 frames validate with that same checksum rule.
3. The disputed room fixture differs by exactly one in the final checksum byte.

## Research rule

Do not weaken strict checksum validation to accommodate this one fixture.

For S8 research:

- retain strict checksum validation;
- use checksum-valid generated vectors for decoder unit tests;
- preserve the upstream `...24` value only as documentary evidence of the fixture anomaly;
- never infer a second S8 checksum scheme from this upstream typo alone.
