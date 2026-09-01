## v1.00_b074 / UI v0.7.39

- Verified the official drying Stop transition from a real-device trace: `DP136` changes from `true` to `false` without any concurrent DP1/2/4/5 transport changes.
- Enabled the red Overview `Стоп` action only while roller drying is active. It requires confirmation and presses the dedicated `stop_roller_drying` entity.
- Kept dust-collection and roller-cleaning Stop commands fail-closed until separate captures verify their transitions.

## v1.00_b073 / UI v0.7.38

- Rebuilt Fresh Start from the official-app trace as one atomic Tuya LAN request containing `mode=smart`, `pause=false` and `power_go=true`; intermediate transport states can no longer pause the robot immediately after launch.
- Rebuilt Return to base as the single verified `mode=chargego` write. It no longer sends Pause, Stop or an additional DP1 trigger before returning.
- Restored confirmed Start and Home controls on Overview with explicit confirmation while keeping all unverified station Stop writes disabled.
- Added regression guards for the captured 2026-09-01 protocol: DP1/DP2 remain in the running state until the robot docks and changes them autonomously.

## v1.00_b072 / UI v0.7.37

- Added a bounded, secret-free protocol timeline for DP1/2/4/5/134/135/136 to both DEBUG logging and downloaded diagnostics.
- Added the read-only `Записать команды штатного приложения` button: it samples the verified control datapoints once per second for 90 seconds while the official app performs the reference sequence.
- Serialized normal polling, diagnostic capture and writes through one lock so the integration never opens overlapping LAN transactions to the vacuum.
- Disabled the disproved Start, Return and station Stop paths in the diagnostic build; the real-device-confirmed Pause command remained available.
- Recorded the 2026-09-01 baseline: the official app successfully moved from cleaning to return, docked, charged and automatically started roller cleaning, while the integration's composed return sequence did not move the robot.

## v1.00_b071 / UI v0.7.36

- Kept the real-device-confirmed Pause command unchanged.
- Resume from `paused` now clears only DP2 and no longer sends the extra DP1 transport command that made the robot pause again.
- Return to base now preserves the verified paused state, confirms `mode=chargego`, and only then sends the DP1 execution trigger.
- Added regression guards that prevent resume and return-to-base from reintroducing `pause=false`/DP1 ordering mistakes.

## v1.00_b070 / UI v0.7.35

- Removed `pause=false` and `power_go=true` from Return to base after real-device testing showed that the trigger resumes Smart cleaning even after a transient `chargego` readback.
- Return to base now writes only `mode=chargego` and succeeds only after DP5 factually reports return, charging or charged.
- Extended safe DP5 readback to 3.5 seconds; timeout fails closed without sending any cleaning continuation command.

## v1.00_b069 / UI v0.7.34

- Corrected the verified DP10 Medium water value from the assumed `normal` to the real-device diagnostic value `middle`.
- Made return-to-base fail closed: `chargego` is now read back before any trigger DP can be sent, and no cleaning trigger is written when return mode is unconfirmed.
- Skips remaining return writes when the robot already reports returning, charging or charged after the first step.
- Shows missing DP134/135/136 station telemetry consistently as `Нет данных` on Overview instead of the false `Ожидает / На связи` state.
- Added regression guards for the diagnostic findings and synchronized all integration, panel and cache-busting versions.

## v1.00_b068 / UI v0.7.33

- Rebuilt the cleaning-profile write path as one durable draft for suction, water, volume and Do Not Disturb, with a single explicit Apply action.
- Added a native confirmation summary and entity-state readback after every profile write; unconfirmed values fail closed while remaining draft changes stay available for retry.
- Prevented coordinator telemetry updates from overwriting unsaved slider and switch values, and added confirmation to Start, Return to base and child-lock changes.
- Preserved the proven station-operation emergency Stop as an immediate action without adding unsupported station-start controls.
- Made the panel host own the visual viewport, prioritized the first Overview image, aligned machine-readable version metadata and added regression checks for the complete contract.

## v1.00_b067 / UI v0.7.32

- Reworked Cleaning into compact shared two-section metric surfaces while preserving the visible `Карта и комнаты` next-stage reminder.
- Shows an active session with a zero-minute DP6 value as `< 1 мин`, stages suction/water edits until `Применить`, and keeps volume/DND on their verified entity-service paths.
- Adds the confirmed DP41 work-type readout, uses `Выкл.` for closed water, and documents that the DND period remains configured in the official application.
- Derives consumable percentages from the manufacturer life counters while retaining exact remaining minutes and warning tones; no unverified reset command is exposed.
- Preserves the stop-only DP134/135/136 station contract and replaces the obsolete station-command placeholder with a factual explanation of the unified `Стоп` action.

## v1.00_b066 / UI v0.7.31

- Requires both source-route hand-off values, rejects missing, invalid, stale and future timestamps, and consumes the pair before applying Header return-route precedence.
- Adopts NIKAS Specialized Panel UI Standard v1.9, Navigation Contract v1.1, explicit integration/registry data truth and autonomous single-entrypoint guards.
- Preserves the verified integration-owned entity-service command path; the frontend still never constructs raw Tuya DP payloads.

## v1.00_b066 / UI v0.7.30

- Rebuilt the S8 OMNI application shell against NIKAS Specialized Panel UI Standard v1.7 while preserving the verified robot and station DP semantics.
- Made the persistent Header title plaque capture and val