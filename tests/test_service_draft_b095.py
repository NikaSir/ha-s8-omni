"""Exercise service draft cancellation against the production event handlers."""

from pathlib import Path
import subprocess
import unittest


ROOT = Path(__file__).resolve().parents[1]


class ServiceDraftB095Tests(unittest.TestCase):
    def test_draft_cancel_and_live_input_do_not_send_device_commands(self) -> None:
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const stored = new Map([['user-preset', '{"suction":"normal","water":"high"}']]);
const context = vm.createContext({
  HTMLElement: class {},
  customElements: { get: key => registry.get(key), define: (key, value) => registry.set(key, value) },
  window: { localStorage: { getItem: key => stored.get(key), setItem: (key, value) => stored.set(key, value) }, confirm: () => true },
  setTimeout, clearTimeout,
});
const frontend = 'custom_components/s8_omni/frontend/';
for (const file of ['s8-omni-panel.js', 's8-omni-service-settings.js']) {
  vm.runInContext(fs.readFileSync(frontend + file, 'utf8'), context);
}
class Node {
  constructor(...selectors) {
    this.selectors = new Set(selectors); this.listeners = {}; this.nodes = new Map();
    this.disabled = false; this.dataset = {}; this.classes = new Set();
    this.classList = { toggle: (name, enabled) => enabled ? this.classes.add(name) : this.classes.delete(name) };
  }
  matches(selector) { return this.selectors.has(selector); }
  closest(selector) { return this.matches(selector) ? this : null; }
  contains(node) { return [...this.nodes.values()].includes(node); }
  querySelector(selector) { return this.nodes.get(selector); }
  querySelectorAll() { return []; }
  addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); }
  async dispatch(type, target) {
    for (const listener of this.listeners[type] || []) await listener({ target });
  }
}
(async () => {
  const panel = Object.create(registry.get('s8-omni-panel').prototype);
  let connected = true;
  const state = { volume: '50', do_not_disturb: 'off', child_lock: 'off' };
  const calls = [];
  panel._snapshot = () => ({ connected });
  panel._stateValue = key => state[key];
  panel._cleaningDraft = {};
  panel._busyCommands = new Set();
  panel._boundStableViews = new WeakSet();
  panel._queueLivePatch = () => {};
  panel._call = async (...args) => { calls.push(args); return true; };
  panel._callConfirmed = async (...args) => { calls.push(args); return true; };
  const root = new Node();
  const volume = new Node('[data-volume]');
  const cancel = new Node('button', '[data-cancel-service-draft]');
  const apply = new Node('button', '[data-apply-cleaning]');
  const status = new Node();
  const label = new Node();
  const dnd = new Node('button', '[data-toggle]'); dnd.dataset.toggle = 'do_not_disturb';
  const child = new Node('button', '[data-toggle]'); child.dataset.toggle = 'child_lock';
  for (const [selector, node] of [
    ['[data-volume]', volume], ['[data-volume-label]', label], ['[data-apply-cleaning]', apply],
    ['[data-cancel-service-draft]', cancel], ['[data-service-draft-status]', status], ['dnd', dnd], ['child', child],
  ]) root.nodes.set(selector, node);
  panel._bindStableContent(root);
  panel._bindStableContent(root); // Stable DOM rebinding must not duplicate handlers.

  volume.value = '65';
  await volume.dispatch('input', volume);
  await root.dispatch('input', volume);
  assert.equal(panel._cleaningDraft.volume, 65);
  assert.equal(status.textContent, 'Неприменённые изменения');
  assert.equal(cancel.disabled, false);
  assert.equal(apply.disabled, false);
  assert.equal(calls.length, 0);

  volume.value = '50';
  await volume.dispatch('input', volume);
  await root.dispatch('input', volume);
  assert.equal(Object.keys(panel._cleaningDraft).length, 0);
  assert.equal(status.textContent, 'Нет изменений');
  assert.equal(cancel.disabled, true);
  assert.equal(apply.disabled, true);

  await root.dispatch('click', dnd);
  assert.equal(panel._cleaningDraft.do_not_disturb, true);
  assert.equal(calls.length, 0);
  cancel.disabled = false;
  connected = false;
  await root.dispatch('click', cancel);
  assert.equal(Object.keys(panel._cleaningDraft).length, 0);
  assert.equal(calls.length, 0);
  assert.equal(state.do_not_disturb, 'off');
  assert.equal(stored.get('user-preset'), '{"suction":"normal","water":"high"}');

  panel._cleaningDraft = { volume: 65 };
  panel._busyCommands.add('number.set_value');
  await root.dispatch('click', cancel);
  assert.equal(panel._cleaningDraft.volume, 65);
  panel._busyCommands.clear();
  connected = true;
  await root.dispatch('click', child);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].slice(0, 3), ['switch', 'turn_on', 'child_lock']);
  assert.equal(panel._cleaningDraft.volume, 65);
  assert.equal(Object.hasOwn(panel._cleaningDraft, 'child_lock'), false);
})().catch(error => { console.error(error); process.exitCode = 1; });
"""
        result = subprocess.run(
            ["node", "-"], input=script, text=True, capture_output=True, cwd=ROOT, check=False
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
