// Execute the registered production bootstrap and all its native ES imports.
// Only browser/HA boundaries and elapsed time are synthetic; no control,
// confirmation, draft, or production event-handler methods are substituted.
import assert from "node:assert/strict";

globalThis.HTMLElement = class {};
const registry = new Map();
globalThis.customElements = {
  get: key => registry.get(key), define: (key, value) => registry.set(key, value),
};
globalThis.window = {localStorage: {getItem: () => null, setItem: () => {}}, confirm: () => true};
await import("../../custom_components/s8_omni/frontend/s8-omni-panel-bootstrap.js");
const Panel = customElements.get("s8-omni-panel");
assert.ok(Panel);

let clock = 0;
let onTick = () => {};
const RealDate = globalThis.Date;
globalThis.Date = class extends RealDate { static now() { return clock; } };
globalThis.setTimeout = (callback, milliseconds) => {
  queueMicrotask(() => { clock += milliseconds; onTick(); callback(); });
};

function fixture() {
  clock = 0;
  onTick = () => {};
  const panel = Object.create(Panel.prototype);
  panel._entities = Object.fromEntries([
    ["volume", "number"], ["do_not_disturb", "switch"], ["child_lock", "switch"],
    ["suction", "select"], ["water", "select"], ["local_connection", "binary_sensor"],
    ["telemetry_age", "sensor"], ["vacuum", "vacuum"], ["refresh", "button"],
  ].map(([key, domain]) => [key, `${domain}.fixture_${key}`]));
  const calls = [];
  panel._hass = {states: {}, callService: async (...args) => { calls.push(args); }};
  const set = (key, state, attributes = {}, timestamps = {}) => {
    const entityId = panel._entities[key];
    panel._hass.states[entityId] = {entity_id: entityId, state, attributes, ...timestamps};
  };
  set("volume", "50"); set("do_not_disturb", "on"); set("child_lock", "on");
  set("suction", "normal", {options: ["gentle", "normal", "strong"]});
  set("water", "high", {options: ["closed", "low", "middle", "high"]});
  set("local_connection", "on", {has_successful_snapshot: true, telemetry_status: "current"});
  set("telemetry_age", "0"); set("vacuum", "docked"); set("refresh", "unknown");
  panel._cleaningDraft = {};
  panel._busyCommands = new Set();
  panel._boundStableViews = new WeakSet();
  panel._queueLivePatch = () => {}; // DOM scheduling is outside this logic test.
  return {panel, set, calls};
}

class Element {
  constructor(...selectors) {
    this.selectors = new Set(selectors); this.listeners = []; this.nodes = [];
    this.disabled = false; this.dataset = {};
  }
  matches(selector) { return this.selectors.has(selector); }
  closest(selector) { return this.matches(selector) ? this : null; }
  contains(node) { return this.nodes.includes(node); }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  addEventListener(type, listener) { this.listeners.push([type, listener]); }
  async click(target) {
    for (const [type, listener] of this.listeners) if (type === "click") await listener({target});
  }
}

function applyButton(panel) {
  const root = new Element();
  const button = new Element("button", "[data-apply-cleaning]");
  root.nodes.push(button);
  panel._bindStableContent(root);
  return () => root.click(button);
}

const invalid = [undefined, null, "unknown", "unavailable", "none", "", "  ", "bad", NaN, Infinity, [], {}];
let scenarios = 0;
async function check(name, run) {
  await run(); scenarios++;
  console.log(`OK ${name}`);
}

await check("unknown/missing/malformed control values never become zero or off", async () => {
  const {panel, set} = fixture();
  for (const key of ["volume", "do_not_disturb", "child_lock"]) {
    const expected = key === "volume" ? 0 : false;
    for (const value of [...invalid, true, false, "0x0", "0.4", "-1", "101"]) {
      set(key, value);
      assert.equal(panel._controlValue(key), null, `${key}: ${String(value)}`);
      assert.equal(panel._readbackMatches(key, expected), false);
      assert.equal(panel._controlValuesEqual(key, null, expected), false);
    }
    delete panel._hass.states[panel._entityId(key)];
    assert.equal(panel._controlValue(key), null);
    assert.equal(panel._readbackMatches(key, expected), false);
  }
});

await check("real numeric zero and literal on/off retain their meaning", async () => {
  const {panel, set} = fixture();
  for (const value of [0, "0", "0.0", "50", "100"]) {
    set("volume", value);
    assert.equal(panel._controlValue("volume"), Number(value));
    assert.equal(panel._readbackMatches("volume", Number(value)), true);
  }
  for (const key of ["do_not_disturb", "child_lock"]) for (const value of ["on", "off"]) {
    set(key, value);
    assert.equal(panel._controlValue(key), value === "on");
    assert.equal(panel._readbackMatches(key, value === "on"), true);
  }
});

await check("zero/off drafts survive unavailable states and application sends nothing", async () => {
  for (const [key, value] of [["volume", 0], ["do_not_disturb", false]]) {
    const {panel, set, calls} = fixture();
    set(key, "unavailable");
    panel._setCleaningDraft(key, value);
    assert.equal(panel._hasCleaningDraft(), true);
    await applyButton(panel)();
    assert.equal(panel._cleaningDraft[key], value);
    assert.equal(calls.length, 0);
    assert.match(panel._commandError, /недоступна/);
  }
});

await check("malformed targets are rejected before dispatch", async () => {
  for (const value of invalid) {
    const {panel, set, calls} = fixture();
    set("volume", value);
    assert.equal(await panel._callConfirmed("number", "set_value", "volume", {value: 0}, 0), false);
    assert.equal(calls.length, 0);
  }
});

await check("unavailable, unknown and missing responses time out without deleting drafts", async () => {
  for (const [key, expected] of [["volume", 0], ["do_not_disturb", false]]) for (const value of invalid) {
    const {panel, set, calls} = fixture();
    panel._setCleaningDraft(key, expected);
    panel._hass.callService = async (...args) => { calls.push(args); set(key, value); };
    await applyButton(panel)();
    assert.equal(calls.length, 1);
    assert.equal(panel._cleaningDraft[key], expected);
    assert.equal(panel._hasCleaningDraft(), true);
    assert.match(panel._commandError, /не подтвердило/);
    assert.equal(panel._busyCommands.size, 0);
    assert.ok(clock > 0);
  }
});

await check("HA service failure preserves the draft and original error", async () => {
  const {panel} = fixture();
  panel._setCleaningDraft("volume", 0);
  panel._hass.callService = async () => { throw new Error("synthetic transport failure"); };
  await applyButton(panel)();
  assert.equal(panel._cleaningDraft.volume, 0);
  assert.equal(panel._commandError, "synthetic transport failure");
  assert.equal(panel._busyCommands.size, 0);
});

await check("fresh valid zero/off responses succeed and clear applied drafts", async () => {
  for (const [key, expected, response] of [["volume", 0, "0"], ["do_not_disturb", false, "off"]]) {
    const {panel, set, calls} = fixture();
    panel._setCleaningDraft(key, expected);
    onTick = () => { set(key, response); };
    await applyButton(panel)();
    assert.equal(calls.length, 1);
    assert.equal(Object.hasOwn(panel._cleaningDraft, key), false);
    assert.equal(panel._commandError, null);
    assert.equal(panel._busyCommands.size, 0);
  }
});

await check("child lock confirms both valid directions", async () => {
  for (const expected of [false, true]) {
    const {panel, set, calls} = fixture();
    set("child_lock", expected ? "off" : "on");
    onTick = () => set("child_lock", expected ? "on" : "off");
    assert.equal(await panel._callConfirmed("switch", expected ? "turn_on" : "turn_off", "child_lock", {}, expected), true);
    assert.equal(calls.length, 1);
  }
});

await check("already satisfied valid target is a no-op, not a fabricated command response", async () => {
  const {panel, calls} = fixture();
  panel._commandError = "Previous response timed out";
  let patches = 0;
  panel._queueLivePatch = () => { patches++; };
  assert.equal(await panel._callConfirmed("number", "set_value", "volume", {value: 50}, 50), true);
  assert.equal(calls.length, 0);
  assert.equal(panel._commandError, null);
  assert.ok(patches > 0, "Clear the stale error in the rendered command feedback");
});

await check("unchanged cache and unrelated updates do not prove a new target response", async () => {
  const {panel, set} = fixture();
  const before = {entityId: panel._entityId("volume"), value: "50", last_updated: "2026-09-07T10:00:00Z", last_reported: "2026-09-07T10:00:00Z"};
  set("volume", "50", {}, {last_updated: before.last_updated, last_reported: before.last_reported});
  assert.equal(panel._readbackMatches("volume", 50, before), false);
  set("water", "low");
  assert.equal(panel._readbackMatches("volume", 50, before), false);
  for (const field of ["last_updated", "last_reported"]) {
    set("volume", "50", {}, {[field]: "2026-09-07T10:00:01Z"});
    assert.equal(panel._readbackMatches("volume", 50, before), true);
  }
});

await check("entity remapping cannot confirm another device's matching value", async () => {
  const {panel, set} = fixture();
  onTick = () => { panel._entities.volume = "number.different_fixture"; set("volume", "0"); };
  assert.equal(await panel._callConfirmed("number", "set_value", "volume", {value: 0}, 0), false);
});

await check("disconnected or explicitly stale telemetry cannot confirm a matching update", async () => {
  for (const mode of ["off", "unknown", "unavailable", "stale", "no_data"]) {
    const {panel, set} = fixture();
    onTick = () => {
      set("volume", "0");
      set("local_connection", ["stale", "no_data"].includes(mode) ? "on" : mode,
        {has_successful_snapshot: true, telemetry_status: mode});
    };
    assert.equal(await panel._callConfirmed("number", "set_value", "volume", {value: 0}, 0), false);
  }
});

await check("missing freshness evidence is not converted to a current zero-age snapshot", async () => {
  for (const value of invalid) {
    const {panel, set, calls} = fixture();
    set("local_connection", "on", {});
    set("telemetry_age", value);
    assert.equal(panel._telemetryFreshnessState(), "no_data");
    assert.equal(await panel._callConfirmed("number", "set_value", "volume", {value: 0}, 0), false);
    assert.equal(calls.length, 0);
    set("volume", "0");
    assert.equal(panel._readbackMatches("volume", 0), false);
  }
  const {panel, set} = fixture();
  set("telemetry_age", "unavailable");
  assert.equal(panel._telemetryFreshnessState(), "current"); // Explicit successful/current metadata is still authoritative.
  set("local_connection", "on", {has_successful_snapshot: true});
  assert.equal(panel._telemetryFreshnessState(), "no_data");
});

await check("a valid update after an unknown interim response can still confirm", async () => {
  const {panel, set} = fixture();
  let tick = 0;
  onTick = () => set("volume", ++tick === 1 ? "unknown" : "0");
  assert.equal(await panel._callConfirmed("number", "set_value", "volume", {value: 0}, 0), true);
  assert.equal(tick, 2);
});

await check("an overlapping command cannot dispatch during pending confirmation", async () => {
  const {panel, set, calls} = fixture();
  let overlap;
  onTick = () => {
    overlap ??= panel._callConfirmed("switch", "turn_off", "child_lock", {}, false);
    set("volume", "0");
  };
  assert.equal(await panel._callConfirmed("number", "set_value", "volume", {value: 0}, 0), true);
  assert.equal(await overlap, false);
  assert.equal(calls.length, 1);
});

await check("bootstrap retains legitimate unknown-state button compatibility", async () => {
  const {panel, calls} = fixture();
  assert.equal(await panel._call("button", "press", "refresh"), true);
  assert.equal(calls.length, 1);
});

console.log(`Passed ${scenarios} production command-readback scenarios (synthetic HA, no device commands).`);
