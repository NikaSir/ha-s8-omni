"""Cover preset highlight recovery across frontend storage revisions."""
from pathlib import Path
import subprocess
import unittest


class PresetHighlightMigrationTests(unittest.TestCase):
    def test_legacy_and_inferred_user_selection(self) -> None:
        script = r'''
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

for (const [path, resolver] of [
  ["custom_components/s8_omni/frontend/s8-omni-service-settings.js", "currentPreset(panel)"],
  ["custom_components/s8_omni/frontend/s8-omni-preset-live-highlight.js", "selectedPreset(panel)"],
]) {
  class Panel {}
  Panel.prototype._styles = () => "";
  Panel.prototype._cleaning = () => "";
  Panel.prototype._maintenance = () => "";
  Panel.prototype._callConfirmed = async () => true;
  Panel.prototype._bindStableContent = () => {};
  Panel.prototype._patchStableDom = () => {};
  const values = {suction: "normal", water: "high"};
  const storage = new Map([
    ["nikas.s8_omni.user_preset.v1.default.wet", JSON.stringify(values)],
  ]);
  const context = vm.createContext({
    customElements: {get: () => Panel},
    queueMicrotask,
    window: {localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key),
    }},
  });
  context.panel = {
    _panel: {config: {entry_id: "ui-regression"}},
    _controlValue: key => values[key],
    _controlValuesEqual: (_key, left, right) => left === right,
  };
  vm.runInContext(fs.readFileSync(path, "utf8"), context);

  assert.equal(vm.runInContext(resolver, context), "wet-user");
  storage.set("nikas.s8_omni.selected_preset.v1.default", "wet-user");
  assert.equal(vm.runInContext(resolver, context), "wet-user");

  storage.clear();
  storage.set("nikas.s8_omni.user_preset.v1.default.dry", JSON.stringify({suction: "gentle", water: "closed"}));
  values.suction = "gentle";
  values.water = "closed";
  assert.equal(vm.runInContext(resolver, context), "dry-quiet");
}
'''
        subprocess.run(
            ["node", "-e", script],
            cwd=Path(__file__).resolve().parents[1],
            check=True,
        )


if __name__ == "__main__":
    unittest.main()
