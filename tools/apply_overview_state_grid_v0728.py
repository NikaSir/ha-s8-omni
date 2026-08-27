from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
JS = ROOT / "custom_components" / "s8_omni" / "frontend" / "s8-omni-panel.js"
CONST = ROOT / "custom_components" / "s8_omni" / "const.py"
MANIFEST = ROOT / "custom_components" / "s8_omni" / "manifest.json"
PANEL = ROOT / "panel.json"
CHANGELOG = ROOT / "CHANGELOG.md"
TEST_DYNAMIC = ROOT / "tests" / "test_panel_dynamic_actions_ui_v0723.py"
TEST_OVERVIEW = ROOT / "tests" / "test_panel_overview_ui_v0727.py"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


text = JS.read_text(encoding="utf-8")
text = replace_once(text, 'const UI_VERSION = "v0.7.27";', 'const UI_VERSION = "v0.7.28";', "UI version")
text = replace_once(
    text,
    '.state-hero{display:grid;grid-template-rows:auto auto auto auto;align-content:start}',
    '.state-hero{display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto auto auto auto;align-content:start;width:100%;min-width:0}',
    "state hero explicit column",
)
anchor = '.state-hero .hero-top{grid-row:1;grid-template-columns:minmax(0,1fr) minmax(168px,max-content);width:100%;isolation:isolate}'
replacement = anchor + '\n      .state-hero>.hero-top,.state-hero>.state-scene,.state-hero>.resource-strip,.state-hero>.hero-metrics{grid-column:1;justify-self:stretch;width:100%;min-width:0;max-width:100%}'
text = replace_once(text, anchor, replacement, "state hero child column lock")
text = replace_once(
    text,
    '      /* v0.7.27: approved state-aware Overview composition. */',
    '      /* v0.7.28: lock the state-aware Overview to one explicit grid column across live state transitions. */',
    "overview css marker",
)
JS.write_text(text, encoding="utf-8")

const = CONST.read_text(encoding="utf-8")
const = replace_once(const, 'VERSION = "v1.00_b063"', 'VERSION = "v1.00_b064"', "integration build")
const = replace_once(const, 'DASHBOARD_VERSION = "v0.7.27"', 'DASHBOARD_VERSION = "v0.7.28"', "dashboard version")
CONST.write_text(const, encoding="utf-8")

manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
if manifest.get("version") != "1.0.0b63":
    raise SystemExit(f"manifest version mismatch: {manifest.get('version')}")
manifest["version"] = "1.0.0b64"
MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

panel = json.loads(PANEL.read_text(encoding="utf-8"))
if panel["panel"].get("dashboard_version") != "v0.7.27":
    raise SystemExit("panel dashboard version mismatch")
panel["panel"]["dashboard_version"] = "v0.7.28"
panel["panel"]["mobile_fit"]["overview_target"] = "approved_v0.7.28_state_transition_grid_fix"
PANEL.write_text(json.dumps(panel, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

for path in (TEST_DYNAMIC, TEST_OVERVIEW):
    test = path.read_text(encoding="utf-8")
    test = test.replace('v0.7.27', 'v0.7.28')
    test = test.replace('v1.00_b063', 'v1.00_b064')
    test = test.replace('1.0.0b63', '1.0.0b64')
    path.write_text(test, encoding="utf-8")

entry = """## v1.00_b064 / UI v0.7.28

- Fixed the live Overview state-transition layout collapse seen when the robot entered Cleaning and other non-idle states.
- Added an explicit single-column CSS Grid track to the state Hero and pinned Header, scene, resource strip and KPI strip to that column, removing the implicit-track sizing ambiguity on iOS/WebView.
- Preserved the approved v0.7.27 state images, resource strip, state-aware actions, fixed bottom navigation and stable pointwise DOM update model.

"""
changelog = CHANGELOG.read_text(encoding="utf-8")
if not changelog.startswith("## v1.00_b063 / UI v0.7.27"):
    raise SystemExit("unexpected changelog head")
CHANGELOG.write_text(entry + changelog, encoding="utf-8")

print("Applied S8 OMNI state-grid fix v0.7.28 / b064")
