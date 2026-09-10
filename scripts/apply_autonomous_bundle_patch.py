#!/usr/bin/env python3
"""Apply the bounded REG-S8-IMPORTS migration on the audit branch."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_exact(relative: str, old: str, new: str, count: int = 1) -> None:
    path = ROOT / relative
    text = path.read_text(encoding="utf-8")
    actual = text.count(old)
    if actual != count:
        raise SystemExit(f"{relative}: expected {count} occurrences, found {actual}: {old!r}")
    path.write_text(text.replace(old, new), encoding="utf-8")


def update_json(relative: str, mutate) -> None:
    path = ROOT / relative
    data = json.loads(path.read_text(encoding="utf-8"))
    mutate(data)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    replace_exact(
        "custom_components/s8_omni/__init__.py",
        'PANEL_MODULE = f"{PANEL_STATIC_URL}/s8-omni-panel-bootstrap.js?v={DASHBOARD_VERSION}-{VERSION}"',
        'PANEL_MODULE = f"{PANEL_STATIC_URL}/s8-omni-production.js?v={DASHBOARD_VERSION}-{VERSION}"',
    )
    replace_exact(
        "custom_components/s8_omni/const.py",
        'VERSION = "v1.0.4"\nDASHBOARD_VERSION = "v1.0.4"',
        'VERSION = "v1.0.5"\nDASHBOARD_VERSION = "v1.0.5"',
    )
    replace_exact(
        "custom_components/s8_omni/frontend/s8-omni-panel.js",
        'const UI_VERSION = "v1.0.4";',
        'const UI_VERSION = "v1.0.5";',
    )
    replace_exact(
        "custom_components/s8_omni/frontend/s8-omni-panel-bootstrap.js",
        "v=1.0.4",
        "v=1.0.5",
        count=4,
    )

    update_json(
        "custom_components/s8_omni/manifest.json",
        lambda data: data.__setitem__("version", "1.0.5"),
    )

    def standard(data: dict) -> None:
        production = "custom_components/s8_omni/frontend/s8-omni-production.js"
        data["runtime_files"] = [production]
        data["production_entrypoint"] = production
        data["build_source_files"] = [
            "scripts/build_s8_production.py",
            "custom_components/s8_omni/frontend/s8-omni-panel.js",
            "custom_components/s8_omni/frontend/s8-omni-cleaning-presets.js",
            "custom_components/s8_omni/frontend/s8-omni-service-settings.js",
            "custom_components/s8_omni/frontend/s8-omni-preset-live-highlight.js",
            "custom_components/s8_omni/frontend/s8-omni-panel-bootstrap.js",
        ]
        data["ui_version"] = "1.0.5"
        data["bundle_contract"]["autonomous"] = True
        data["bundle_contract"]["runtime_imports"] = False
        data["bundle_contract"]["deterministic"] = True

    update_json(".nikas-ui-standard.json", standard)

    replace_exact(
        "tests/ui/fixture.html",
        'import "/frontend/s8-omni-panel-bootstrap.js";',
        'import "/frontend/s8-omni-production.js";',
    )
    replace_exact(
        "tests/ui/command-readback-regression.mjs",
        "// Execute the registered production bootstrap and all its native ES imports.",
        "// Execute the single registered autonomous production bundle.",
    )
    replace_exact(
        "tests/ui/command-readback-regression.mjs",
        'await import("../../custom_components/s8_omni/frontend/s8-omni-panel-bootstrap.js");',
        'await import("../../custom_components/s8_omni/frontend/s8-omni-production.js");',
    )
    replace_exact(
        "tests/ui/panel-regression.mjs",
        "// Loads the real bootstrap and all child modules; no runtime methods are replaced.",
        "// Loads the real autonomous production bundle; no runtime methods are replaced.",
    )
    replace_exact(
        "tests/test_command_readback_b096.py",
        "def test_production_bootstrap_preserves_unknown_and_requires_valid_readback(self):",
        "def test_production_bundle_preserves_unknown_and_requires_valid_readback(self):",
    )
    replace_exact(
        "tests/test_autonomous_production_bundle.py",
        '"__s8CleaningPresetPatch",',
        '"__s8CleaningPresets",',
    )

    replace_exact(
        "README.md",
        "> Stable release: **v1.0.4** (`1.0.4`).",
        "> Stable release: **v1.0.5** (`1.0.5`).",
    )
    replace_exact(
        "README.md",
        "Dashboard **v1.0.4** follows **NIKAS Specialized Panel UI Standard v2.2**",
        "Dashboard **v1.0.5** follows **NIKAS Specialized Panel UI Standard v2.2**",
    )
    changelog = ROOT / "CHANGELOG.md"
    existing = changelog.read_text(encoding="utf-8")
    entry = (
        "## v1.0.5 / UI v1.0.5\n\n"
        "- Replaces the runtime bootstrap import chain with one deterministic autonomous `s8-omni-production.js`.\n"
        "- Preserves the existing cleaning presets, service settings, live preset highlighting and unknown-state button compatibility in isolated build scopes.\n"
        "- Registers only the generated production bundle in Home Assistant and runs command-readback/browser regressions against that exact entrypoint.\n"
        "- Adds byte-for-byte build verification; source modules remain build-time inputs and are no longer runtime dependencies.\n\n"
    )
    if existing.startswith("## v1.0.5 / UI v1.0.5"):
        raise SystemExit("CHANGELOG already contains v1.0.5")
    changelog.write_text(entry + existing, encoding="utf-8")

    workflow = ".github/workflows/repository-checks.yml"
    replace_exact(
        workflow,
        "      - name: Validate bundled JavaScript syntax\n",
        "      - name: Verify autonomous production bundle\n"
        "        run: python scripts/build_s8_production.py --check\n"
        "      - name: Validate bundled JavaScript syntax\n",
    )
    replace_exact(
        workflow,
        'source = Path("custom_components/s8_omni/frontend/s8-omni-panel.js").read_text(encoding="utf-8")',
        'source = Path("custom_components/s8_omni/frontend/s8-omni-production.js").read_text(encoding="utf-8")',
    )
    replace_exact(workflow, 'const UI_VERSION = "v1.0.4"', 'const UI_VERSION = "v1.0.5"')
    replace_exact(
        workflow,
        "      - name: Exercise production bootstrap in Chromium",
        "      - name: Exercise autonomous production bundle in Chromium",
    )


if __name__ == "__main__":
    main()
