# S8 OMNI Home test — b084

Physical facts entering this test:

- `DP2=true` is the native Pause command and produces the robot pause voice prompt.
- `DP1=false` silently stops execution and must not be used as Pause.
- `DP1=true` after `chargego` resumes the cleaning job and is not a Home trigger.

Controlled candidate under test:

1. If cleaning, write `DP2=true`.
2. Require readback `DP2=true` and `DP5=paused`.
3. Write `DP4=chargego`.
4. Require readback `DP4=chargego`.
5. Write `DP2=false` to release the paused state into the newly selected mode.
6. Require `DP5` to become one of `goto_charge`, `repositing`, `charging`, `charge_done`.

`DP1` is deliberately not written anywhere in this Home sequence.

This sequence is a controlled test candidate, not yet S8_PHYSICALLY_VERIFIED.
