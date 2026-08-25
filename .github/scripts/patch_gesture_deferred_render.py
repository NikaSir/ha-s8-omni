from pathlib import Path

path = Path('custom_components/s8_omni/frontend/s8-omni-panel.js')
text = path.read_text(encoding='utf-8')

text = text.replace('    this._renderQueued = false;\n    this._viewTransform = { scale: 1, x: 0, y: 0 };', '    this._renderQueued = false;\n    this._renderDeferred = false;\n    this._viewTransform = { scale: 1, x: 0, y: 0 };', 1)

old_queue = '''  _queueRender() {
    if (this._renderQueued) return;
    this._renderQueued = true;
    requestAnimationFrame(() => { this._renderQueued = false; this._render(); });
  }
'''
new_queue = '''  _queueRender() {
    if (this._gesturePointers?.size) { this._renderDeferred = true; return; }
    if (this._renderQueued) return;
    this._renderQueued = true;
    requestAnimationFrame(() => { this._renderQueued = false; this._render(); });
  }
'''
if old_queue not in text:
    raise SystemExit('queueRender block not found')
text = text.replace(old_queue, new_queue, 1)

needle = '''      this._gestureStart = null;
      this._gestureMoved = false;
      this._hadMultiTouch = false;
    };
'''
replacement = '''      this._gestureStart = null;
      this._gestureMoved = false;
      this._hadMultiTouch = false;
      if (this._renderDeferred) { this._renderDeferred = false; this._queueRender(); }
    };
'''
if needle not in text:
    raise SystemExit('gesture finish block not found')
text = text.replace(needle, replacement, 1)
path.write_text(text, encoding='utf-8')
