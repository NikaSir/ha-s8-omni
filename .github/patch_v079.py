from pathlib import Path

path = Path('custom_components/s8_omni/frontend/s8-omni-panel.js')
text = path.read_text(encoding='utf-8')

old = 'const UI_VERSION = "v0.7.8";'
if old not in text:
    raise SystemExit('Unexpected UI version; patch not applied')
text = text.replace(old, 'const UI_VERSION = "v0.7.9";', 1)

marker = '      @keyframes spin{to{transform:rotate(360deg)}}'
override = '''      /* v0.7.9 approved-render geometry */
      .content{padding-bottom:calc(126px + env(safe-area-inset-bottom))}
      .omni-scene{height:252px}
      .omni-art{left:0;top:0;bottom:0;width:75%;overflow:hidden;border-radius:21px;background:#f7f5f1}
      .product-art{width:100%;height:100%;object-fit:cover;object-position:52% center;border-radius:21px;filter:none}
      .omni-legend{right:7px;top:10px;bottom:10px;width:30%;gap:5px;padding:7px}
      .legend-row{min-height:34px;padding:4px 5px}
      .legend-copy strong{font-size:9.7px;line-height:1.05}
      .legend-copy small{font-size:8.8px}
      .status-card{min-height:119px;padding:7px 6px 8px}
      .status-thumb{height:52px;margin-bottom:4px}
      .status-card strong{font-size:9.5px}
      .status-card b{font-size:12px;line-height:1.08}
      .status-card span.meta{font-size:9px;min-height:18px}
      @media(max-width:430px){.omni-scene{height:246px}.omni-art{width:74%}.omni-legend{width:31%;right:5px}.status-thumb{height:49px}.status-card{min-height:116px}}
'''
if marker not in text:
    raise SystemExit('CSS marker not found')
text = text.replace(marker, override + marker, 1)

path.write_text(text, encoding='utf-8')
