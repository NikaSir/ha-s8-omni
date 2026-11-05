# S8 OMNI OEM-family reference: BSTY / Amicro

Date: 2026-09-04

## Status

This document is a **FAMILY_REFERENCE**, not an S8 command contract. Nothing in this file authorizes a new write to the S8 OMNI.

## Why this family matters

A KaringBee S8 OMNI discussion on 4PDA explicitly describes the model as an evolution of an older BSTY robot. Independent listings for the BSTY/Probot M3 and Mi-Lux M3 show a closely related mechanical architecture: LiDAR navigation, onboard clean/dirty-water handling, roller washing during cleaning, a dock with 2.5 L clean and dirty tanks, a 1.5 L dust bag, automatic refilling/draining, dust collection and roller drying.

The Mi-Lux M3 listing states that the robot uses the **Amicro Smart** application. Amicro Smart is published by Zhuhai Amicro Semiconductor and supports laser, vision and inertial-navigation robot vacuums. Public APK metadata for Amicro Smart 2.2.2 states that this version updated its Tuya SDK.

This gives a plausible OEM chain for research:

```text
KaringBee S8 OMNI
  <- later BSTY-family hardware
  <- BSTY / Probot / Mi-Lux M3 family
  <- Amicro robot controller + Tuya connectivity stack
```

This chain is useful for finding terminology, UI semantics, map behaviour and transport architecture. It is **not** proof that the binary command bytes are identical.

## Independent technical clues

Public reverse-engineering work on another robot using an Amicro ARM controller (Eufy RoboVac G10 Hybrid) shows an Amicro application processor connected by UART to a Tuya-compatible Wi-Fi module. The project reports 115200 8N1 and describes the Wi-Fi module as a replaceable Tuya-side transport while the Amicro controller retains the robot logic.

That architecture fits the working hypothesis for S8:

```text
Smart Life panel / Tuya cloud or LAN
        |
        v
Tuya Wi-Fi module / DP transport
        |
       UART
        |
        v
Amicro-class robot controller
        |
        +-- navigation / map
        +-- cleaning state machine
        +-- dock interaction
```

For our project the important consequence is that a Tuya DP number is only the transport endpoint. Complex map/room commands may be decoded again by the robot controller firmware, so numeric DP matches across models do not imply protocol compatibility.

## Functional overlap with S8

A public Amicro Smart guide for a self-cleaning robot exposes the same semantic modes we already see around the S8 family:

- `Both work`
- `Only sweep`
- `Only Mop`
- deep-mop style mode
- suction selection
- dust collection at the dock
- roller/mop washing at the dock

This is consistent with the public Tuya RobotProtocol enums (`both_work`, `only_sweep`, `only_mop`, `mop_after_sweep`) and therefore strengthens the value of those enum names as a family reference. It still does not prove that S8 uses every enum value or the same command IDs.

## What this changes in the investigation

The next-best donor is no longer a random Tuya vacuum. Research priority becomes:

1. KaringBee S8 Smart Life Panel MiniApp and its exact schema.
2. BSTY/Mi-Lux/Probot M3 family panel/application captures.
3. Amicro Smart APK and Amicro controller references.
4. Generic Tuya `SweepRobotTemplate` only after the OEM-family evidence above.

If an Amicro/BSTY trace and the S8 Smart Life trace produce the same frame header, command byte, payload length and semantic response for the same safe action, that becomes a strong FAMILY_REFERENCE candidate. It still requires a controlled S8 physical confirmation before promotion to `S8_VERIFIED`.

## Safety rule

Do not send any donor frame to S8 solely because it came from BSTY, Mi-Lux, Probot or Amicro Smart. First capture the corresponding S8 action passively, compare the frame, then reproduce only after the exact command transport DP has been identified by code and write capability.

## Public references used for this research

- 4PDA KaringBee S8 OMNI discussion: S8 described as an evolved BSTY-family machine.
- Probot BSTY M3 product documentation: 2.5 L clean/dirty dock tanks, 1.5 L dust bag, LiDAR, automatic refill/drain, washing and drying.
- Mi-Lux M3 product documentation: manufactured in cooperation with BSTY and controlled with Amicro Smart.
- Amicro Smart APK metadata: package `com.amicro.hoslam`, Amicro Semiconductor, laser/vision/inertial robot support; 2.2.2 update notes include a Tuya SDK update.
- Rjevski/esphome-eufy-robovac-g10-hybrid: independent Amicro-controller + Tuya-module hardware reverse engineering.

All of the above remain external references and are not copied into the S8 verified protocol contract without direct S8 evidence.
