from pathlib import Path
import json

p=Path('custom_components/s8_omni/frontend/s8-omni-panel.js')
s=p.read_text(encoding='utf-8')
def rep(old,new,label):
    global s
    if old not in s: raise SystemExit(f'missing {label}')
    s=s.replace(old,new,1)
rep('const UI_VERSION = "v0.6.6";','const UI_VERSION = "v0.6.7";','ui version')
rep('height:194px;margin-top:12px','height:200px;margin-top:12px','scene height')
rep('width:69%;height:100%;padding:6px 0 0 5px','width:72%;height:100%;padding:4px 0 0 3px','art width')
rep('right:10px;top:12px;bottom:12px;width:29%','right:9px;top:12px;bottom:12px;width:27%','legend width')
rep('color:#6f7378;font-size:11px;font-weight:760','color:#555d62;font-size:10.5px;font-weight:780','legend text')
rep('viewBox="0 0 430 198"','viewBox="0 0 455 205"','viewbox')
rep('const blue = wash ? "#17afe9" : "#88cde8";','const blue = wash ? "#0faeea" : "#72c6e8";','blue')
rep('const gray = dust ? "#6f7880" : "#a9b0b6";','const gray = dust ? "#616c74" : "#9ca6ad";','gray')
rep('const orange = dry ? "#f39a4d" : "#efbb93";','const orange = dry ? "#f28e42" : "#e8a574";','orange')
rep('const green = chargeActive ? "#38b55d" : "#a7c9b1";','const green = chargeActive ? "#2fb157" : "#86bd96";','green')
old='''            <g filter="url(#shadow)">
              <rect x="136" y="14" width="268" height="141" rx="27" fill="url(#stationShell)" stroke="#cdd5da" stroke-width="2"/>
              <rect x="153" y="28" width="67" height="86" rx="14" fill="url(#tankBlue)" stroke="#cfd8dc"/>
              <rect x="229" y="28" width="67" height="86" rx="14" fill="url(#tankGray)" stroke="#cfd8dc"/>
              <rect x="305" y="28" width="67" height="86" rx="14" fill="url(#tankWarm)" stroke="#cfd8dc"/>
              <rect x="149" y="109" width="238" height="46" rx="17" fill="url(#baseDark)"/>
              <rect x="180" y="119" width="179" height="25" rx="12.5" fill="#0d0f10"/>
              <rect x="169" y="39" width="34" height="56" rx="10" fill="rgba(255,255,255,.20)"/>
              <rect x="245" y="39" width="34" height="56" rx="10" fill="rgba(255,255,255,.17)"/>
              <rect x="321" y="39" width="34" height="56" rx="10" fill="rgba(255,255,255,.17)"/>
              <rect x="164" y="150" width="208" height="7" rx="3.5" fill="#ccd3d7" opacity=".75"/>
            </g>'''
new='''            <g filter="url(#shadow)">
              <path d="M151 22 Q151 12 164 12 H378 Q391 12 397 23 L409 38 V142 Q409 156 394 160 H168 Q151 158 151 142 Z" fill="url(#stationShell)" stroke="#c9d3d8" stroke-width="1.8"/>
              <path d="M390 18 L409 38 V142 Q409 154 397 158 L390 153 Z" fill="#dfe6e9" opacity=".88"/>
              <rect x="166" y="29" width="66" height="88" rx="14" fill="url(#tankBlue)" stroke="#c7d5db"/>
              <rect x="240" y="29" width="66" height="88" rx="14" fill="url(#tankGray)" stroke="#cbd3d7"/>
              <rect x="314" y="29" width="66" height="88" rx="14" fill="url(#tankWarm)" stroke="#d7d0ca"/>
              <path d="M160 112 H397 V143 Q397 158 382 158 H176 Q160 158 160 143 Z" fill="url(#baseDark)"/>
              <rect x="190" y="123" width="174" height="24" rx="12" fill="#0b0d0e"/>
              <path d="M177 154 H376" stroke="#cbd3d7" stroke-width="5" stroke-linecap="round" opacity=".72"/>
              <path d="M175 37 Q185 30 202 30 H222 V108 H175 Z" fill="rgba(255,255,255,.26)"/>
              <path d="M249 37 Q259 30 276 30 H296 V108 H249 Z" fill="rgba(255,255,255,.22)"/>
              <path d="M323 37 Q333 30 350 30 H370 V108 H323 Z" fill="rgba(255,255,255,.22)"/>
              <path d="M170 92 Q199 84 228 92 V112 H170 Z" fill="${blue}" opacity="${wash ? '.38' : '.18'}"/>
              <path d="M244 91 Q273 85 302 91 V112 H244 Z" fill="${gray}" opacity="${dust ? '.32' : '.15'}"/>
              <path d="M318 91 Q347 84 376 91 V112 H318 Z" fill="${orange}" opacity="${dry ? '.36' : '.17'}"/>
            </g>'''
rep(old,new,'station group')
old='''            <g transform="translate(13,91)" filter="url(#softShadow)">
              <ellipse cx="67" cy="39" rx="64" ry="31" fill="#f1f3f4" stroke="#cfd6da" stroke-width="2"/>
              <ellipse cx="67" cy="33" rx="58" ry="26" fill="url(#robotShell)" stroke="#d9dfe2"/>
              <rect x="14" y="40" width="106" height="10" rx="5" fill="#25282a"/>
              <rect x="20" y="42" width="30" height="4" rx="2" fill="#101315" opacity=".98"/>
              <circle cx="67" cy="18" r="13" fill="#eef2f4" stroke="#cfd6da"/>
              <circle cx="67" cy="18" r="6" fill="#c9d0d4"/>
              <circle cx="67" cy="31" r="2.2" fill="#d6dde1"/>
              <path d="M112 34 Q121 38 121 44" fill="none" stroke="#c7ced2" stroke-width="2"/>
            </g>'''
new='''            <g transform="translate(7,91)" filter="url(#softShadow)">
              <ellipse cx="72" cy="45" rx="70" ry="31" fill="#dce3e7" opacity=".55"/>
              <path d="M7 34 Q10 13 35 8 Q72 0 108 9 Q132 15 137 35 V45 Q131 60 72 62 Q15 60 7 45 Z" fill="url(#robotShell)" stroke="#cbd4d9" stroke-width="2"/>
              <path d="M12 37 Q72 45 132 37 V48 Q119 59 72 60 Q24 59 12 48 Z" fill="#24282b"/>
              <rect x="24" y="40" width="35" height="8" rx="4" fill="#0d1113"/>
              <rect x="64" y="40" width="20" height="8" rx="4" fill="#343a3e"/>
              <circle cx="73" cy="17" r="14" fill="#f0f3f5" stroke="#cbd4d9"/>
              <circle cx="73" cy="16" r="7" fill="#c9d1d6"/>
              <ellipse cx="73" cy="11" rx="5" ry="2" fill="#ffffff" opacity=".65"/>
              <path d="M19 27 Q71 12 125 27" fill="none" stroke="#ffffff" stroke-width="2.2" opacity=".8"/>
              <circle cx="116" cy="41" r="3" fill="#1ba8dc" opacity=".75"/>
            </g>'''
rep(old,new,'robot group')
rep('<g opacity=".62" stroke="#d3dade" stroke-width="2.2"><line x1="186" y1="113" x2="186" y2="154"/><line x1="262" y1="113" x2="262" y2="154"/><line x1="338" y1="113" x2="338" y2="154"/></g>','<g opacity=".52" stroke="#d1d9dd" stroke-width="2"><line x1="199" y1="114" x2="199" y2="158"/><line x1="273" y1="114" x2="273" y2="158"/><line x1="347" y1="114" x2="347" y2="158"/></g>','vertical paths')
for a,b,label in [('M186 112 L186 146 L126 146 L101 139','M199 113 L199 149 L132 149 L105 141','blue path'),('M262 112 L262 152 L132 152 L104 145','M273 113 L273 155 L138 155 L108 147','gray path'),('M338 112 L338 158 L138 158 L108 150','M347 113 L347 161 L144 161 L112 153','orange path'),('M152 136 L121 136','M161 138 L126 138','charge path'),('cx="141" cy="136" r="18"','cx="150" cy="138" r="18"','charge circle'),('M137 124 L147 124 L143 134 L150 134 L137 149 L141 138 L133 138 Z','M146 126 L156 126 L152 136 L159 136 L146 151 L150 140 L142 140 Z','charge bolt')]: rep(a,b,label)
p.write_text(s,encoding='utf-8')
const=Path('custom_components/s8_omni/const.py'); const.write_text(const.read_text(encoding='utf-8').replace('VERSION = "v1.00_b029"','VERSION = "v1.00_b030"').replace('DASHBOARD_VERSION = "v0.6.6"','DASHBOARD_VERSION = "v0.6.7"'),encoding='utf-8')
m=Path('custom_components/s8_omni/manifest.json'); d=json.loads(m.read_text(encoding='utf-8')); d['version']='1.0.0b30'; m.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
pp=Path('panel.json'); d=json.loads(pp.read_text(encoding='utf-8')); d['panel']['dashboard_version']='v0.6.7'; d['panel']['mobile_fit']['overview_scene']='premium_product_illustration_live_omni_scene'; pp.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
ch=Path('CHANGELOG.md'); t=ch.read_text(encoding='utf-8'); ch.write_text('## v1.00_b030 — UI v0.6.7\n\n- Rebuilt the Overview robot/station scene as a premium product illustration: deeper OMNI body, glass-like tanks, larger detailed robot, stronger dock geometry and cleaner live process paths.\n- Preserved verified-state-only behavior; no synthetic tank percentages or unverified station commands.\n\n'+t,encoding='utf-8')
