from pathlib import Path

path = Path('custom_components/s8_omni/frontend/s8-omni-panel.js')
text = path.read_text(encoding='utf-8')

text = text.replace(
    'set panel(value) { this._panel = value; this._restoreTransform(true); this._ensureRegistry(); this._queueRender(); }',
    'set panel(value) { this._panel = value; if (!this._gesturePointers?.size) this._restoreTransform(true); else this._renderDeferred = true; this._ensureRegistry(); this._queueRender(); }',
    1,
)
old = '''        if (now - this._twoFingerTapAt < 460) {
          this._twoFingerTapAt = 0;
          this._resetTransform(true);
          this._suppressClicksUntil = Date.now() + 360;
        } else {
          this._twoFingerTapAt = now;
        }
'''
new = '''        if (now - this._twoFingerTapAt < 460) {
          this._twoFingerTapAt = 0;
          this._resetTransform(true);
          this._suppressClicksUntil = Date.now() + 360;
        } else {
          this._twoFingerTapAt = now;
          this._suppressClicksUntil = Date.now() + 320;
        }
'''
if old not in text:
    raise SystemExit('two-finger tap block not found')
text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
