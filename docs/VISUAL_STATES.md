# S8 OMNI visual state model

The Overview hero illustration is state-driven and must never invent device telemetry.

## Cleaning

When the robot is actively cleaning, the hero depicts the robot away from the dock, a short movement route, suction airflow and water delivery. Suction and water labels come only from the integration's public Home Assistant entities.

## Returning

When the robot is returning, the route visually points toward the OMNI dock. The illustration communicates movement back to base without changing command semantics.

## Station operation

When the robot is on the dock and an OMNI station operation is active, the illustration emphasizes that operation:

- dust collection;
- roller cleaning / washing;
- drying.

The operation is derived only from the normalized station state / verified station telemetry.

## Idle / charged

When the robot is docked and the station is idle, the illustration may show the station's physical service areas such as clean water, dirty water and dust/filter modules. These are illustrative parts only unless the integration exposes factual public entities for them. The UI must not display invented level/OK values.

## Unknown / unavailable

When current telemetry is not trustworthy, the illustration must switch to an unavailable/unknown treatment and must not present the previous robot/station picture as current truth.

## Safety

The hero is visual presentation only. It does not write Tuya DP values and does not create new command paths.
