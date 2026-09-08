"""Exercise production refresh state without a browser or real device."""
from pathlib import Path
import subprocess
import unittest


class RefreshFeedbackTests(unittest.TestCase):
    def test_refresh_lifecycle(self):
        script = r'''
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
let Panel;
const context = vm.createContext({HTMLElement: class {},
  customElements: {get: () => null, define: (_, cls) => { Panel = cls; }},
  setTimeout, clearTimeout, Date});
vm.runInContext(fs.readFileSync('custom_components/s8_omni/frontend/s8-omni-panel.js', 'utf8'), context);
(async () => {
 for (const mode of ['fast', 'slow', 'error']) {
  const panel = Object.create(Panel.prototype);
  panel._busyCommands = new Set(); panel._refreshPending = false;
  panel._entityId = () => 'button.fixture_refresh';
  panel._queueLivePatch = () => {};
  let calls = 0, release;
  panel._call = async (...args) => {
    assert.deepEqual(args, ['button', 'press', 'refresh']); calls++;
    if (mode !== 'fast') await new Promise(resolve => { release = resolve; });
    return mode !== 'error';
  };
  const started = Date.now();
  const pending = panel._refresh();
  assert.equal(panel._refreshPending, true);
  assert.match(panel._header(), /refresh is-refreshing/);
  assert.doesNotMatch(panel._header(), /refresh loading/);
  assert.match(panel._header(), /aria-busy="true" disabled/);
  await panel._refresh(); assert.equal(calls, 1);
  if (mode !== 'fast') {
    await new Promise(resolve => setTimeout(resolve, 750));
    assert.equal(panel._refreshPending, true); release();
  }
  assert.equal(await pending, mode !== 'error');
  assert.ok(Date.now() - started >= 700);
  assert.equal(panel._refreshPending, false);
  assert.doesNotMatch(panel._header(), /refresh is-refreshing/);
  panel._busyCommands.add('other');
  await panel._refresh(); assert.equal(calls, 1);
  assert.match(panel._header(), /aria-busy="false" disabled/);
 }
})().catch(error => { console.error(error); process.exitCode = 1; });
'''
        subprocess.run(['node', '-e', script], cwd=Path(__file__).resolve().parents[1], check=True)
