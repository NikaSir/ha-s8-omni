# Browser regression fixture

The fixture loads the production `s8-omni-panel-bootstrap.js` and its versioned child modules. It supplies an in-memory Home Assistant entity registry, states, and service implementation. There is no connection to Home Assistant, Tuya, or a physical device; all entity identifiers and values are synthetic.

## Run the automated regression

Run from the repository root with Node.js 22. Install the test dependency in a temporary directory so package files are not added to the integration:

```sh
s8_ui_test_deps="$(mktemp -d)"
npm install --prefix "$s8_ui_test_deps" --no-save --package-lock=false --ignore-scripts playwright@1.62.0
export NODE_PATH="$s8_ui_test_deps/node_modules"
node "$s8_ui_test_deps/node_modules/playwright/cli.js" install --with-deps chromium
node tests/ui/panel-regression.mjs
```

`--with-deps` installs Chromium's system dependencies on supported Linux hosts and may require administrator privileges. If the dependencies are already present, use `install chromium` instead. Alternatively set `S8_UI_BROWSER_EXECUTABLE` to an existing compatible Chromium executable.

The runner starts its own HTTP server on an available loopback port, launches headless Chromium at 390 × 844, and closes both on completion. Any assertion or uncaught browser error makes the process fail. The independent `browser-regression` GitHub Actions job runs these same commands with Playwright pinned to 1.62.0.

The regression covers:

- Volume draft editing and cancellation without a service call.
- DND confirmation cancellation, explicit application, and device readback before the draft is cleared.
- Live telemetry preserving the slider element, its input handler, and a pending edit; cancellation returns to the latest received value.
- Six dry/wet presets and the retained map reminder, with no duplicate manual-settings entry.
- User preset saving and confirmation cancellation without writes; separate application of suction and water, with selection retained only after both readbacks.
- Cleaning-state changes preserving preset handlers.
- Consumable time formatting, one station idle summary, three station operation controls, and workspace bounds at 100% scale.

## Open the fixture manually

No Playwright installation is needed to run the local server:

```sh
node tests/ui/fixture-server.mjs
```

Open `http://127.0.0.1:8765/` in a local browser. The panel fills the browser host. For a 430-pixel panel with an adjacent diagnostic toolbar, open `http://127.0.0.1:8765/?tools=1` in a desktop browser. Set `S8_UI_FIXTURE_PORT` before starting the server to choose a different port.

The toolbar can publish synthetic robot states and volume telemetry, hold or release simulated device readbacks, and display every recorded service call. To inspect the confirmation flow, disable automatic readback, apply a change, then press **Подтвердить ожидающие записи**. Clearing the command journal does not change device state or stored user presets. Reloading resets synthetic device state; browser local storage retains saved presets.

## Limits

These checks exercise the actual panel DOM and event bindings against synthetic data. Volume changes dispatch input/change events at the range element; this checks draft handling and stable DOM bindings, not pointer dragging. Button actions use real browser clicks, including automatic scrolling into view. Assertions wait for the panel's native-scroll and render queues to settle without waiting for a particular expected field value.

They do not validate Tuya commands, physical cleaning or station actions, real Home Assistant registry timing, WebSocket transport, iOS safe areas or touch gestures, or cache behaviour after an installed release update. `ha-icon` is a size-preserving test element without rendered SVG artwork; image assets come from the repository. Screenshot comparison is not part of the regression.

## Command confirmation regression

`node tests/ui/command-readback-regression.mjs` imports the same production bootstrap and all four child modules with Node's ES module loader. It executes production parsing, equality, command/readback and Apply handlers using synthetic HA states, minimal DOM boundaries and a virtual clock. The unittest wrapper `tests/test_command_readback_b096.py` runs it in the repository CI regression step.

The scenarios cover unknown/missing/malformed states, valid zero/on/off, timeout/error draft retention, connected/current telemetry, target identity, post-dispatch updates, no-op writes and overlapping commands. No physical commands are sent. These tests establish frontend handling of HA state objects, not the validity of raw device DP data or real-device command acknowledgement.
