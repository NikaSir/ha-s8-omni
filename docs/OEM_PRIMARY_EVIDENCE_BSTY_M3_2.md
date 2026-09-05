# Primary OEM-family evidence: BSTY M3-2 / Amicro Smart

Date: 2026-09-04

Classification: **FAMILY_REFERENCE / PRIMARY OEM EVIDENCE**

This document does not authorize any new write to KaringBee S8 OMNI. It records primary documentation for a closely related BSTY platform so that protocol hypotheses can be ranked by evidence quality.

## Source

FCC user manual for **Intelligent Robot Vacuum Cleaner M3-2**:

`FCC ID 2BAU6M3-2 — User Manual`

The manual identifies the after-sales contact as `support@bstyhome.com`, references `bstyhome.com`, and names the black product variant as `M3-2 black`.

## Application identity

The Wi-Fi setup section explicitly instructs the owner to search for and install **Amicro Smart** in the App Store / Google Play and then pair the robot through that application.

This is stronger evidence than reseller descriptions because it comes from the model's submitted user manual.

## Cleaning modes exposed by the M3-2 platform

The manual lists a broad set of map-aware cleaning modes, including:

- Intelligent cleaning
- Dry sweep
- Local dry sweep (approximately 1 m × 1 m)
- Mopping
- Local mopping
- Deep mopping
- Marble cleaning
- Balcony sweeping
- Plank mopping

These modes show that the Amicro/BSTY platform supports more than simple on/off DP control and has a controller-side cleaning state machine with map/location semantics.

## Dock / station functions

The station control description includes:

- roller washing process;
- return to base;
- child lock controlled by the application;
- dust collection;
- start / pause.

That function set overlaps strongly with the known KaringBee S8 OMNI architecture and with the already verified S8 station controls DP134/135/136.

## Research significance

The evidence chain is now:

```text
BSTY M3-2 user manual
  -> explicitly uses Amicro Smart
  -> map-aware cleaning modes
  -> roller washing + dust collection + return + app child lock

Mi-Lux / Probot M3 family
  -> similar BSTY mechanical architecture

KaringBee S8 OMNI community evidence
  -> described as an evolution of BSTY hardware
```

This makes **Amicro Smart / BSTY M3-2** a higher-priority protocol donor than unrelated Tuya robot vacuums.

However, the only permissible use before an S8 capture is comparative analysis:

1. capture one safe action from S8 Smart Life;
2. capture or decode the same action on an Amicro/BSTY reference;
3. compare DP code, frame header, command byte, payload length and response;
4. promote a hypothesis only after the S8 itself reproduces it with physical/readback confirmation.

## What is still unknown

The FCC manual does **not** prove:

- that S8 uses the same Amicro controller firmware;
- that S8 uses the Amicro Smart application rather than a Tuya Panel MiniApp in Smart Life;
- that binary command IDs or payload layouts are identical;
- that numeric DP assignments are shared;
- that map transport is identical.

Therefore donor frames remain read-only research material.

## Primary reference

FCC ID `2BAU6M3-2`, User Manual, Intelligent Robot Vacuum Cleaner M3-2.
