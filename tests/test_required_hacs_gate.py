"""Protect required validate coverage; use only the Python standard library.

The workflow uses simple block mappings. Extract those bounded blocks instead
of introducing a YAML dependency, then execute the actual aggregate run script.
"""

import json
import os
from pathlib import Path
import re
import subprocess
import textwrap
import unittest


ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github/workflows/repository-checks.yml"
REQUIRED = ("repository-checks", "hacs-validation")


class RequiredHacsGateTests(unittest.TestCase):
    def setUp(self):
        self.source = WORKFLOW.read_text(encoding="utf-8")
        self.jobs = dict(re.findall(
            r"^  ([\w-]+):\n(.*?)(?=^  [\w-]+:|\Z)",
            self.source.split("\njobs:\n", 1)[1], re.M | re.S,
        ))

    def gate(self):
        self.assertIn("repository-checks", self.jobs,
                      "Required validate must aggregate repository-checks and HACS")
        self.assertIn("validate", self.jobs)
        return self.jobs["validate"]

    def run_gate(self, results):
        gate = self.gate()
        script = re.search(r"^        run: \|\n((?:          .*\n|\n)+)", gate, re.M)
        self.assertIsNotNone(script, "Aggregate must have an executable run script")
        env = os.environ.copy()
        env["S8_JOB_RESULTS"] = json.dumps(results)
        return subprocess.run(
            ["bash", "--noprofile", "--norc", "-e", "-o", "pipefail", "-c",
             textwrap.dedent(script.group(1))],
            env=env, text=True, capture_output=True, timeout=5,
        )

    def success(self):
        return {name: {"result": "success", "outputs": {}} for name in REQUIRED}

    def test_required_contexts_cover_code_and_hacs_without_skip_or_error_bypass(self):
        gate = self.gate()
        self.assertEqual(set(self.jobs), {"validate", "browser-regression", *REQUIRED})
        needs = re.search(r"^    needs: \[([^\]]+)\]$", gate, re.M)
        self.assertIsNotNone(needs)
        self.assertEqual([name.strip() for name in needs.group(1).split(",")], list(REQUIRED))
        self.assertRegex(gate, r"(?m)^    if: \$\{\{ always\(\) \}\}$")
        self.assertRegex(gate, r"(?m)^          S8_JOB_RESULTS: \$\{\{ toJSON\(needs\) \}\}$")
        self.assertEqual(len(re.findall(r"^      - ", gate, re.M)), 1)
        self.assertNotRegex(gate, r"(?m)^        if:")
        self.assertRegex(gate, r"(?m)^        shell: bash$")
        for job_id, block in self.jobs.items():
            self.assertNotIn("continue-on-error:", block)
            name = re.search(r"^    name: (.+)$", block, re.M)
            if job_id in ("validate", "browser-regression") and name:
                self.assertEqual(name.group(1), job_id)
        self.assertIn("python -m unittest discover -s tests", self.jobs["repository-checks"])
        self.assertIn("uses: hacs/action@", self.jobs["hacs-validation"])
        self.assertIn("node tests/ui/panel-regression.mjs", self.jobs["browser-regression"])

    def test_both_successful_dependencies_pass(self):
        result = self.run_gate(self.success())
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_each_unsuccessful_dependency_blocks_validate(self):
        for name in REQUIRED:
            for status in ("failure", "cancelled", "skipped", "neutral", "", None):
                with self.subTest(job=name, status=status):
                    results = self.success()
                    results[name]["result"] = status
                    self.assertNotEqual(self.run_gate(results).returncode, 0)

    def test_missing_or_unexpected_results_block_validate(self):
        cases = [{}]
        for name in REQUIRED:
            missing_job = self.success()
            del missing_job[name]
            cases.append(missing_job)
            missing_result = self.success()
            missing_result[name] = {"outputs": {}}
            cases.append(missing_result)
        extra = self.success()
        extra["unexpected"] = {"result": "success"}
        cases.append(extra)
        for results in cases:
            with self.subTest(results=results):
                self.assertNotEqual(self.run_gate(results).returncode, 0)


if __name__ == "__main__":
    unittest.main()
