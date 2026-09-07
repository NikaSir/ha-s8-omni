"""Exercise rendered cleaning states without contacting Home Assistant."""

from __future__ import annotations

import json
from pathlib import Path
import shutil
import subprocess
import unittest


ROOT = Path(__file__).resolve().parents[1]


@unittest.skipUnless(shutil.which("node"), "Node.js is required for frontend behavior checks")
class CleaningSummaryB095Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        script = r"""
const fs = require("node:fs");
const vm = require("node:vm");
const elements = new Map();
const storage = new Map();
const context = vm.createContext({
  HTMLElement: class {},
  customElements: { get: key => elements.get(key), define: (key, value) => elements.set(key, value) },
  window: { localStorage: { getItem: key => storage.get(key) ?? null } },
});
const base = "custom_components/s8_omni/frontend/";
for (const name of ["s8-omni-panel.js", "s8-omni-cleaning-presets.js"]) {
  vm.runInContext(`(() => {${fs.readFileSync(base + name, "utf8")}\n})()`, context);
}
const Panel = elements.get("s8-omni-panel");
function render(snapshot = {}, values = {}, freshness = "current") {
  const panel = Object.create(Panel.prototype);
  panel._config = { entry_id: "test" };
  panel._busyCommands = new Set();
  panel._snapshot = () => ({ connected: true, unreliable: false, robot: "charged", composite: "charged", ...snapshot });
  panel._stateValue = key => values[key] ?? null;
  panel._telemetryFreshnessState = () => freshness;
  panel._trustBanner = () => "";
  return panel._cleaning();
}
const results = {
  docked: render(),
  idle: render({ robot: "idle", composite: "idle" }),
  cleaning: render({ robot: "cleaning", composite: "cleaning" }, { clean_time: "0", clean_area: "0" }),
  paused: render({ robot: "paused", composite: "paused" }, { clean_time: "17", clean_area: "8.5" }),
  unknown: render({ robot: "unknown", composite: "unknown" }),
  unknownZero: render({ robot: "unknown", composite: "unknown" }, { clean_time: "0", clean_area: "0" }),
  conflicting: render({ robot: "charged", composite: "cleaning" }, { clean_time: "17", clean_area: "8.5" }),
  stale: render({}, { clean_time: "17", clean_area: "8.5" }, "stale"),
  unavailable: render({ connected: false, unreliable: true }, { clean_time: "17", clean_area: "8.5" }),
  invalid: render({ robot: "unknown", composite: "unknown" }, { clean_time: -1, clean_area: " " }),
};
storage.set("nikas.s8_omni.user_preset.v1.test.wet", JSON.stringify({ suction: "normal", water: "high" }));
results.custom = render();
process.stdout.write(JSON.stringify(results));
"""
        result = subprocess.run(
            ["node", "-e", script], cwd=ROOT, check=True, text=True, capture_output=True
        )
        cls.markup = json.loads(result.stdout)

    def test_confirmed_inactive_state_uses_short_summary(self) -> None:
        for name in ("docked", "idle"):
            with self.subTest(name=name):
                self.assertIn('class="cleaning-summary-idle">', self.markup[name])
                self.assertIn('class="cleaning-summary-metrics" hidden>', self.markup[name])

    def test_active_zero_is_real_start_and_paused_metrics_remain_visible(self) -> None:
        self.assertIn("&lt; 1 мин", self.markup["cleaning"])
        self.assertIn("0 м²", self.markup["cleaning"])
        self.assertIn("17 мин", self.markup["paused"])
        self.assertIn("8.5 м²", self.markup["paused"])

    def test_unknown_and_zero_are_not_interchanged(self) -> None:
        self.assertNotIn("0 м²", self.markup["unknown"])
        self.assertNotIn("0 мин", self.markup["unknown"])
        self.assertIn("0 м²", self.markup["unknownZero"])
        self.assertIn("0 мин", self.markup["unknownZero"])
        self.assertNotIn("0 м²", self.markup["invalid"])

    def test_uncertain_or_conflicting_status_never_claims_inactivity(self) -> None:
        for name in ("unknown", "conflicting", "stale", "unavailable"):
            with self.subTest(name=name):
                self.assertIn('class="cleaning-summary-idle" hidden>', self.markup[name])
                self.assertIn('class="cleaning-summary-metrics">', self.markup[name])
                self.assertIn('data-more="clean_time"', self.markup[name])
        self.assertNotIn("17 мин", self.markup["unavailable"])
        self.assertNotIn("8.5 м²", self.markup["unavailable"])

    def test_inactive_and_active_states_keep_metrics_nodes_for_more_info_bindings(self) -> None:
        for name, markup in self.markup.items():
            with self.subTest(name=name):
                self.assertEqual(1, markup.count('data-more="clean_time"'))
                self.assertEqual(1, markup.count('data-more="clean_area"'))
                self.assertEqual(1, markup.count('class="cleaning-summary-idle"'))
                self.assertEqual(1, markup.count('class="cleaning-summary-metrics"'))

    def test_presets_keep_independent_editors_and_map_reminder(self) -> None:
        markup = self.markup["custom"]
        self.assertEqual(6, markup.count('data-cleaning-preset="'))
        self.assertEqual(2, markup.count('data-user-preset-edit="'))
        self.assertNotIn('data-detail="cleaning-settings"', markup)
        self.assertIn("Карта и комнаты", markup)
        self.assertIn("Всасывание: норм.", markup)
        self.assertIn("Вода: макс.", markup)
        self.assertIn('class="user-preset-shell"><button class="user-preset-apply" type="button" data-cleaning-preset="wet-user">', markup)


if __name__ == "__main__":
    unittest.main()
