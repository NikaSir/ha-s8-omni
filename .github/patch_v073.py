from pathlib import Path
import json
import re

JS = Path('custom_components/s8_omni/frontend/s8-omni-panel.js')
CONST = Path('custom_components/s8_omni/const.py')
MANIFEST = Path('custom_components/s8_omni/manifest.json')
PANEL = Path('panel.json')
CHANGELOG = Path('CHANGELOG.md')

text = JS.read_text(encoding='utf-8')
text = text.replace('const UI_VERSION = "v0.7.2";', 'const UI_VERSION = "v0.7.3";', 1)

helper_pattern = re.compile(
    r'let _productArtUrl = null;\nfunction productArtUrl\(\) \{.*?\n\}\n',
    re.S,
)
helper_replacement = r'''let _productArtBitmapPromise = null;
function productArtBytes() {
  const binary = atob(PRODUCT_ART_BASE64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
function productArtBitmap() {
  if (_productArtBitmapPromise) return _productArtBitmapPromise;
  if (typeof createImageBitmap !== "function") {
    _productArtBitmapPromise = Promise.reject(new Error("createImageBitmap unavailable"));
    return _productArtBitmapPromise;
  }
  const bytes = productArtBytes();
  _productArtBitmapPromise = createImageBitmap(new Blob([bytes], { type: "image/webp" }));
  return _productArtBitmapPromise;
}
class S8ProductArt extends HTMLElement {
  connectedCallback() {
    if (this._mounted) return;
    this._mounted = true;
    this.style.display = "block";
    this.style.position = "relative";
    this.style.width = "100%";
    this.style.height = "100%";
    this.style.overflow = "hidden";
    this.innerHTML = `<canvas aria-hidden="true" style="display:block;width:100%;height:100%"></canvas><div class="product-art-fallback" style="display:none;position:absolute;inset:0;place-items:center"><svg viewBox="0 0 430 190" width="100%" height="100%" aria-label="S8 OMNI fallback"><rect x="145" y="20" width="250" height="128" rx="24" fill="#f8fafb" stroke="#d4dadd"/><rect x="162" y="34" width="62" height="78" rx="13" fill="#d8f3ff"/><rect x="234" y="34" width="62" height="78" rx="13" fill="#e0e4e7"/><rect x="306" y="34" width="62" height="78" rx="13" fill="#ffe0c4"/><rect x="158" y="112" width="226" height="36" rx="15" fill="#232526"/><ellipse cx="83" cy="135" rx="61" ry="29" fill="#f5f7f8" stroke="#d4dadd"/><rect x="27" y="139" width="108" height="9" rx="4.5" fill="#25282a"/></svg></div>`;
    this._canvas = this.querySelector("canvas");
    this._fallback = this.querySelector(".product-art-fallback");
    this._resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(() => this._paint()) : null;
    if (this._resizeObserver) this._resizeObserver.observe(this);
    requestAnimationFrame(() => this._paint());
  }
  disconnectedCallback() {
    if (this._resizeObserver) this._resizeObserver.disconnect();
  }
  async _paint() {
    if (!this.isConnected || !this._canvas) return;
    const rect = this.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) {
      requestAnimationFrame(() => this._paint());
      return;
    }
    try {
      const bitmap = await productArtBitmap();
      if (!this.isConnected) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (this._canvas.width !== width) this._canvas.width = width;
      if (this._canvas.height !== height) this._canvas.height = height;
      const ctx = this._canvas.getContext("2d", { alpha: true });
      if (!ctx) throw new Error("2d canvas unavailable");
      ctx.clearRect(0, 0, width, height);
      const scale = Math.min(width / bitmap.width, height / bitmap.height);
      const drawWidth = bitmap.width * scale;
      const drawHeight = bitmap.height * scale;
      const x = (width - drawWidth) / 2;
      const y = (height - drawHeight) / 2;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, x, y, drawWidth, drawHeight);
      this._canvas.style.display = "block";
      if (this._fallback) this._fallback.style.display = "none";
    } catch (err) {
      this._canvas.style.display = "none";
      if (this._fallback) this._fallback.style.display = "grid";
      console.warn("S8 OMNI product art canvas fallback", err);
    }
  }
}
if (!customElements.get("s8-product-art")) customElements.define("s8-product-art", S8ProductArt);
'''
text, count = helper_pattern.subn(helper_replacement, text, count=1)
if count != 1:
    raise SystemExit(f'productArtUrl helper replacement failed: {count}')

old_img = '<img class="product-art" src="${productArtUrl()}" alt="S8 OMNI robot and station" />'
new_art = '<s8-product-art class="product-art" aria-label="S8 OMNI robot and station"></s8-product-art>'
if old_img not in text:
    raise SystemExit('product art img markup not found')
text = text.replace(old_img, new_art, 1)

# Ensure the custom element owns an explicit render box instead of relying on image intrinsic size.
text = text.replace(
    '.product-art{width:100%;max-height:100%;object-fit:contain;border-radius:20px;',
    '.product-art{display:block;width:100%;height:100%;max-height:100%;border-radius:20px;',
    1,
)
JS.write_text(text, encoding='utf-8')

const = CONST.read_text(encoding='utf-8')
const = const.replace('VERSION = "v1.00_b035"', 'VERSION = "v1.00_b036"')
const = const.replace('DASHBOARD_VERSION = "v0.7.2"', 'DASHBOARD_VERSION = "v0.7.3"')
CONST.write_text(const, encoding='utf-8')

manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
manifest['version'] = '1.0.0b36'
MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

panel = json.loads(PANEL.read_text(encoding='utf-8'))
panel['panel']['dashboard_version'] = 'v0.7.3'
panel['panel']['frontend']['product_art_delivery'] = 'embedded_webp_bytes_to_canvas_via_createImageBitmap'
PANEL.write_text(json.dumps(panel, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

entry = '''## v1.00_b036 / UI v0.7.3\n\n- Replaced product-art `<img>` delivery with Canvas rendering via `createImageBitmap()` from the verified WebP bytes already embedded in the standalone bundle.\n- This bypasses Home Assistant/iOS WebView image-source restrictions affecting both `data:` and `blob:` URLs in `<img>`.\n- Added a local SVG fallback so the Overview hero can no longer become visually blank if bitmap decoding is unavailable.\n- Preserved the approved product illustration, live verified overlays, legend, controls, and verified-only state semantics.\n\n'''
ch = CHANGELOG.read_text(encoding='utf-8')
if entry not in ch:
    CHANGELOG.write_text(entry + ch, encoding='utf-8')
