const UI_VERSION = "v0.8.0";
const VIEWS = [
  ["overview", "mdi:robot-vacuum", "Статус"],
  ["cleaning", "mdi:play-circle-outline", "Уборка"],
  ["station", "mdi:home-automation", "Станция"],
  ["maintenance", "mdi:tools", "Сервис"],
  ["diagnostics", "mdi:stethoscope", "Диагностика"],
];
const LABEL = {
  composite_status: {
    idle:"Готов к уборке", cleaning:"Уборка", zone_cleaning:"Зональная уборка", room_cleaning:"Уборка комнаты", paused:"Пауза",
    returning_to_dock:"Возврат на базу", charging:"Зарядка", charged:"На базе", sleeping:"Сон", repositioning:"Определение позиции",
    docked_dust_collection:"На базе · Сбор пыли", docked_roller_cleaning:"На базе · Промывка", docked_drying:"На базе · Сушка",
    docked_station_active:"На базе · Станция активна", error:"Требуется внимание", unknown:"Нет данных"
  },
  robot_status: {idle:"Ожидание",cleaning:"Уборка",zone_cleaning:"Зона",room_cleaning:"Комната",paused:"Пауза",returning_to_dock:"Возврат",charging:"Зарядка",charged:"Заряжен",sleeping:"Сон",error:"Ошибка",repositioning:"Определение позиции",unknown:"Нет данных"},
  station_status: {idle:"Ожидание",dust_collection:"Сбор пыли",roller_cleaning:"Промывка",drying:"Сушка",multiple_operations:"Несколько операций",unknown:"Нет данных"},
  suction: {gentle:"Тихий",normal:"Нормальный",strong:"Сильный"},
  water: {closed:"Выкл.",low:"Низкий",middle:"Средний",high:"Высокий"},
};

class S8OmniOperational extends HTMLElement {
  constructor(){
    super(); this.attachShadow({mode:"open"});
    this._hass=null; this._panel=null; this._view="overview"; this._entities={}; this._loaded=false; this._loading=false;
    this._draft={}; this._busy=false; this._error=null;
  }
  set panel(p){ this._panel=p; this._loadRegistry(); this.render(); }
  set hass(h){ this._hass=h; this._loadRegistry(); this.render(); }
  connectedCallback(){ this.render(); }
  async _loadRegistry(){
    if(this._loaded||this._loading||!this._hass?.callWS) return;
    this._loading=true;
    try{
      const rows=await this._hass.callWS({type:"config/entity_registry/list"});
      const entry=this._panel?.config?.entry_id;
      for(const row of rows){
        if(row.platform!=="s8_omni") continue;
        if(entry && row.config_entry_id && row.config_entry_id!==entry) continue;
        const uid=String(row.unique_id||"");
        const suffix=uid.includes("_")?uid.slice(uid.lastIndexOf("_")+1):uid;
        const known=["vacuum","battery","clean_time","clean_area","side_brush_life","main_brush_life","filter_life","fault","work_mode","raw_status","robot_status","station_status","composite_status","last_telemetry","telemetry_age","local_connection","dust_collection","roller_cleaning","roller_drying","custom_mode","resume_cleaning","do_not_disturb","child_lock","mode","suction","water","volume","refresh","diagnostic_capture","start_dust_collection","stop_dust_collection","start_roller_cleaning","stop_roller_cleaning","start_roller_drying","stop_roller_drying"];
        for(const key of known){ if(uid.endsWith(`_${key}`)) this._entities[key]=row.entity_id; }
      }
      this._loaded=true;
    }catch(e){ this._error=`Не удалось прочитать реестр сущностей: ${e?.message||e}`; }
    finally{ this._loading=false; this.render(); }
  }
  _id(k){return this._entities[k]||null}
  _s(k){const id=this._id(k); return id?this._hass?.states?.[id]:null}
  _v(k){return this._s(k)?.state??null}
  _a(k,n){return this._s(k)?.attributes?.[n]}
  _available(k){const s=this._s(k); return !!s && !["unavailable","unknown"].includes(String(s.state));}
  _label(k,v){return LABEL[k]?.[v]||v||"—"}
  _connected(){return this._v("local_connection")==="on"}
  _telemetry(){return this._a("local_connection","telemetry_status")||"no_data"}
  _fmt(v,unit=""){if(v===null||v===undefined||v==="unknown"||v==="unavailable") return "—"; return `${v}${unit}`}
  _life(k,max){const n=Number(this._v(k)); if(!Number.isFinite(n)) return {text:"—",pct:0}; return {text:`${Math.max(0,Math.round(n/60))} ч`,pct:Math.max(0,Math.min(100,Math.round(n/max*100)))} }
  async _call(domain,service,key,data={}){
    const id=this._id(key); if(!id||!this._hass) return false;
    this._busy=true; this._error=null; this.render();
    try{await this._hass.callService(domain,service,{entity_id:id,...data}); return true}
    catch(e){this._error=e?.message||String(e); return false}
    finally{this._busy=false; this.render()}
  }
  async _command(action){
    const connected=this._connected(); if(!connected){this._error="Нет локальной связи с пылесосом."; this.render(); return;}
    if(action==="start"){
      if(!confirm("Запустить или продолжить уборку?"))return;
      await this._call("vacuum","start","vacuum");
    } else if(action==="pause"){
      await this._call("vacuum","pause","vacuum");
    } else if(action==="home"){
      if(!confirm("Вернуть пылесос на базу?"))return;
      await this._call("vacuum","return_to_base","vacuum");
    }
  }
  async _station(kind,start){
    const key=`${start?"start":"stop"}_${kind}`;
    const name={dust_collection:"сбор пыли",roller_cleaning:"промывку ролика",roller_drying:"сушку ролика"}[kind];
    if(!confirm(`${start?"Запустить":"Остановить"} ${name}?`)) return;
    await this._call("button","press",key);
  }
  _draftValue(k){return Object.prototype.hasOwnProperty.call(this._draft,k)?this._draft[k]:this._v(k)}
  async _applySettings(){
    const jobs=[];
    const map={suction:["select","select_option","option"],water:["select","select_option","option"],volume:["number","set_value","value"],do_not_disturb:["switch",null,null],child_lock:["switch",null,null]};
    for(const [k,v] of Object.entries(this._draft)){
      if(String(v)===String(this._v(k))) continue;
      if(k==="do_not_disturb"||k==="child_lock") jobs.push(this._call("switch",v?"turn_on":"turn_off",k));
      else {const [d,s,p]=map[k]; jobs.push(this._call(d,s,k,{[p]:k==="volume"?Number(v):v}));}
    }
    await Promise.all(jobs); this._draft={}; this.render();
  }
  _header(){
    const conn=this._connected(); const tel=this._telemetry();
    return `<header><button class="icon" data-back><ha-icon icon="mdi:chevron-left"></ha-icon></button><div class="title"><strong>Пылесос</strong><span>S8 OMNI · ${UI_VERSION}</span></div><button class="icon" data-refresh><ha-icon icon="mdi:refresh"></ha-icon></button></header>
      <div class="connection ${conn?"ok":"bad"}"><i></i><div><b>${conn?"Локально":"Нет связи"}</b><small>${tel==="fresh"?"Данные актуальны":tel==="stale"?"Данные устарели":"Нет данных"}</small></div></div>`;
  }
  _nav(){return `<nav>${VIEWS.map(([id,icon,label])=>`<button data-view="${id}" class="${this._view===id?"active":""}"><ha-icon icon="${icon}"></ha-icon><span>${label}</span></button>`).join("")}</nav>`}
  _overview(){
    const c=this._v("composite_status")||"unknown", robot=this._v("robot_status")||"unknown", station=this._v("station_status")||"unknown";
    const running=["cleaning","zone_cleaning","room_cleaning"].includes(robot), paused=robot==="paused", returning=robot==="returning_to_dock";
    return `<section class="hero"><div><span class="eyebrow">Текущее состояние</span><h1>${this._label("composite_status",c)}</h1><p>Робот: ${this._label("robot_status",robot)} · Станция: ${this._label("station_status",station)}</p></div><div class="battery"><b>${this._fmt(this._v("battery"),"%")}</b><span>заряд</span></div></section>
      <section class="stats"><div><span>Время</span><b>${this._fmt(this._v("clean_time")," мин")}</b></div><div><span>Площадь</span><b>${this._fmt(this._v("clean_area")," м²")}</b></div><div><span>Всасывание</span><b>${this._label("suction",this._v("suction"))}</b></div><div><span>Вода</span><b>${this._label("water",this._v("water"))}</b></div></section>
      <section class="card"><span class="eyebrow">Управление</span><div class="actions"><button class="primary" data-command="start" ${running&&!paused?"disabled":""}><ha-icon icon="mdi:play"></ha-icon>${paused?"Продолжить":"Старт"}</button><button data-command="pause" ${!running?"disabled":""}><ha-icon icon="mdi:pause"></ha-icon>Пауза</button><button data-command="home" ${returning?"disabled":""}><ha-icon icon="mdi:home-import-outline"></ha-icon>На базу</button></div></section>
      <section class="card note"><ha-icon icon="mdi:map-clock-outline"></ha-icon><div><b>Карта и комнаты временно отключены</b><span>Будут добавлены после подтверждения команд DP15 и формата карты. Рабочие функции панели от этого не зависят.</span></div></section>`;
  }
  _cleaning(){
    const s=this._draftValue("suction")||"normal", w=this._draftValue("water")||"middle", vol=this._draftValue("volume")??50, dnd=!!this._draftValue("do_not_disturb");
    const dirty=Object.keys(this._draft).some(k=>String(this._draft[k])!==String(this._v(k)));
    return `<section class="card"><span class="eyebrow">Параметры уборки</span><label>Мощность всасывания<select data-draft="suction"><option value="gentle" ${s==="gentle"?"selected":""}>Тихий</option><option value="normal" ${s==="normal"?"selected":""}>Нормальный</option><option value="strong" ${s==="strong"?"selected":""}>Сильный</option></select></label><label>Подача воды<select data-draft="water"><option value="closed" ${w==="closed"?"selected":""}>Выкл.</option><option value="low" ${w==="low"?"selected":""}>Низкая</option><option value="middle" ${w==="middle"?"selected":""}>Средняя</option><option value="high" ${w==="high"?"selected":""}>Высокая</option></select></label><label>Громкость <b>${vol}%</b><input data-draft="volume" type="range" min="0" max="100" step="1" value="${vol}"></label><label class="toggle"><span>Не беспокоить</span><input data-draft="do_not_disturb" type="checkbox" ${dnd?"checked":""}></label><button class="apply" data-apply ${dirty?"":"disabled"}>Применить изменения</button></section>
      <section class="card note"><ha-icon icon="mdi:information-outline"></ha-icon><div><b>Режимы комнаты, зоны и точки скрыты</b><span>Пока не используем неподтверждённые сложные команды. Обычная Smart-уборка полностью доступна с главной страницы.</span></div></section>`;
  }
  _station(){
    const docked=["charging","charged"].includes(this._v("robot_status"));
    const rows=[["dust_collection","mdi:delete-empty","Сбор пыли"],["roller_cleaning","mdi:water-sync","Промывка ролика"],["roller_drying","mdi:weather-sunny","Сушка ролика"]];
    return `<section class="card"><span class="eyebrow">Станция</span>${rows.map(([k,icon,name])=>{const on=this._v(k)==="on"; return `<div class="station-row ${on?"on":""}"><ha-icon icon="${icon}"></ha-icon><div><b>${name}</b><span>${on?"Активно":"Ожидание"}</span></div><button data-station="${k}" data-start="${on?"0":"1"}" ${!on&&!docked?"disabled":""}>${on?"Стоп":"Старт"}</button></div>`}).join("")}</section><section class="card note"><ha-icon icon="mdi:shield-check-outline"></ha-icon><div><b>Защита запуска</b><span>Сбор пыли, промывка и сушка запускаются только при подтверждённом нахождении робота на базе. Команда подтверждается фактическим состоянием DP134/135/136.</span></div></section>`;
  }
  _maintenance(){
    const lock=!!this._draftValue("child_lock"), f=this._life("filter_life",9000), s=this._life("side_brush_life",12000), m=this._life("main_brush_life",18000); const dirty=Object.keys(this._draft).some(k=>String(this._draft[k])!==String(this._v(k)));
    const resource=(name,x)=>`<div class="resource"><div><b>${name}</b><span>${x.text}</span></div><progress max="100" value="${x.pct}"></progress></div>`;
    return `<section class="card"><span class="eyebrow">Расходники</span>${resource("Фильтр",f)}${resource("Боковая щётка",s)}${resource("Основной ролик",m)}<p class="muted">Сброс расходников не выведен: соответствующие write-команды пока не подтверждены физически.</p></section><section class="card"><span class="eyebrow">Безопасность</span><label class="toggle"><span>Блокировка от детей</span><input data-draft="child_lock" type="checkbox" ${lock?"checked":""}></label><button class="apply" data-apply ${dirty?"":"disabled"}>Применить изменения</button></section>`;
  }
  _diagnostics(){
    const rows=[["Локальная связь",this._connected()?"Локально":"Нет связи"],["Актуальность",this._telemetry()==="fresh"?"Данные актуальны":this._telemetry()==="stale"?"Данные устарели":"Нет данных"],["Robot status",this._v("robot_status")],["Station status",this._v("station_status")],["Raw status",this._v("raw_status")],["Fault",this._v("fault")],["Возраст телеметрии",this._fmt(this._v("telemetry_age")," с")],["Последняя телеметрия",this._v("last_telemetry")]];
    return `<section class="card"><span class="eyebrow">Диагностика</span><div class="diag">${rows.map(([a,b])=>`<div><span>${a}</span><b>${b??"—"}</b></div>`).join("")}</div><div class="actions"><button data-refresh><ha-icon icon="mdi:refresh"></ha-icon>Обновить</button><button data-capture ${this._available("diagnostic_capture")?"":"disabled"}><ha-icon icon="mdi:record-rec"></ha-icon>Записать 90 с</button></div></section><section class="card note"><ha-icon icon="mdi:flask-outline"></ha-icon><div><b>Исследовательские DP не используются для управления</b><span>DP15, карта, комнаты, зоны и точечная уборка остаются вне production UI до завершения пассивного перехвата штатного приложения.</span></div></section>`;
  }
  _styles(){return `<style>
    :host{display:block;height:100%;background:var(--primary-background-color);color:var(--primary-text-color);font-family:var(--ha-font-family-body,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif)}*{box-sizing:border-box}button,input,select{font:inherit}button{border:0}.shell{min-height:100%;padding-bottom:calc(84px + env(safe-area-inset-bottom))}header{position:sticky;top:0;z-index:30;display:grid;grid-template-columns:48px 1fr 48px;align-items:center;gap:8px;padding:calc(8px + env(safe-area-inset-top)) 12px 8px;background:color-mix(in srgb,var(--primary-background-color) 96%,transparent);backdrop-filter:blur(16px);border-bottom:1px solid var(--divider-color)}.icon{height:44px;border-radius:14px;background:var(--card-background-color);color:var(--primary-text-color)}.title{text-align:center;display:flex;flex-direction:column}.title strong{font-size:21px}.title span{font-size:12px;color:var(--secondary-text-color)}.connection{width:min(880px,calc(100% - 20px));margin:10px auto 0;display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:16px;background:var(--card-background-color);border:1px solid var(--divider-color)}.connection i{width:10px;height:10px;border-radius:50%;background:var(--error-color,#d33)}.connection.ok i{background:var(--success-color,#42a047)}.connection div{display:flex;flex-direction:column}.connection b{font-size:14px}.connection small{font-size:12px;color:var(--secondary-text-color)}main{width:min(880px,100%);margin:0 auto;padding:10px}.card,.hero,.stats{background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:22px;margin-bottom:12px;box-shadow:0 5px 18px rgba(0,0,0,.04)}.hero{padding:18px;display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center;background:linear-gradient(140deg,var(--card-background-color),color-mix(in srgb,var(--primary-color) 8%,var(--card-background-color)))}.hero h1{margin:5px 0;font-size:28px;line-height:1.05}.hero p{margin:0;color:var(--secondary-text-color)}.eyebrow{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:var(--secondary-text-color)}.battery{width:82px;height:82px;border-radius:50%;display:grid;place-items:center;align-content:center;background:color-mix(in srgb,var(--primary-color) 10%,var(--card-background-color))}.battery b{font-size:22px}.battery span{font-size:11px;color:var(--secondary-text-color)}.stats{display:grid;grid-template-columns:repeat(4,1fr);overflow:hidden}.stats div{padding:14px;text-align:center;border-right:1px solid var(--divider-color)}.stats div:last-child{border:0}.stats span{display:block;color:var(--secondary-text-color);font-size:11px}.stats b{font-size:15px}.card{padding:16px}.actions{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:12px}.actions button,.apply,.station-row button{min-height:48px;border-radius:15px;background:color-mix(in srgb,var(--primary-color) 9%,var(--card-background-color));color:var(--primary-text-color);font-weight:750}.actions button.primary,.apply{background:var(--primary-color);color:var(--text-primary-color,#fff)}button:disabled{opacity:.38}.actions ha-icon{vertical-align:middle;margin-right:6px}.note{display:flex;gap:12px;align-items:flex-start}.note ha-icon{color:var(--primary-color)}.note div{display:flex;flex-direction:column;gap:4px}.note span,.muted{color:var(--secondary-text-color);font-size:13px;line-height:1.35}.card label{display:flex;flex-direction:column;gap:7px;margin-top:14px;font-size:13px;font-weight:700}.card select,.card input[type=range]{width:100%}.card select{min-height:44px;padding:0 12px;border-radius:13px;border:1px solid var(--divider-color);background:var(--primary-background-color);color:var(--primary-text-color)}.toggle{flex-direction:row!important;justify-content:space-between;align-items:center}.toggle input{width:22px;height:22px}.apply{width:100%;margin-top:16px}.station-row{display:grid;grid-template-columns:42px 1fr 86px;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid var(--divider-color)}.station-row:last-child{border:0}.station-row>ha-icon{color:var(--secondary-text-color)}.station-row.on>ha-icon{color:var(--primary-color)}.station-row div{display:flex;flex-direction:column}.station-row span{font-size:12px;color:var(--secondary-text-color)}.resource{margin-top:15px}.resource div{display:flex;justify-content:space-between}.resource progress{width:100%;height:9px;margin-top:7px}.diag>div{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--divider-color)}.diag span{color:var(--secondary-text-color)}.diag b{text-align:right;word-break:break-word}nav{position:fixed;z-index:40;left:0;right:0;bottom:0;display:grid;grid-template-columns:repeat(5,1fr);padding:7px max(6px,env(safe-area-inset-left)) calc(7px + env(safe-area-inset-bottom));background:color-mix(in srgb,var(--card-background-color) 96%,transparent);border-top:1px solid var(--divider-color);backdrop-filter:blur(16px)}nav button{min-height:54px;background:transparent;color:var(--secondary-text-color);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:10px;font-weight:700}nav button.active{color:var(--primary-color)}nav ha-icon{--mdc-icon-size:24px}.error{width:min(880px,calc(100% - 20px));margin:8px auto;padding:10px 14px;border-radius:14px;background:color-mix(in srgb,var(--error-color,#d33) 10%,var(--card-background-color));color:var(--error-color,#d33);font-weight:700;font-size:13px}@media(max-width:600px){.stats{grid-template-columns:repeat(2,1fr)}.stats div:nth-child(2){border-right:0}.actions{grid-template-columns:1fr}.hero h1{font-size:24px}.battery{width:72px;height:72px}.connection{margin-top:8px}}
  </style>`}
  render(){
    if(!this.shadowRoot) return;
    let body=this._overview(); if(this._view==="cleaning")body=this._cleaning(); if(this._view==="station")body=this._station(); if(this._view==="maintenance")body=this._maintenance(); if(this._view==="diagnostics")body=this._diagnostics();
    this.shadowRoot.innerHTML=`${this._styles()}<div class="shell">${this._header()}${this._error?`<div class="error">${this._error}</div>`:""}<main>${body}</main>${this._nav()}</div>`;
    this.shadowRoot.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>{this._view=b.dataset.view;this._draft={};this.render()});
    this.shadowRoot.querySelectorAll("[data-command]").forEach(b=>b.onclick=()=>this._command(b.dataset.command));
    this.shadowRoot.querySelectorAll("[data-station]").forEach(b=>b.onclick=()=>this._station(b.dataset.station,b.dataset.start==="1"));
    this.shadowRoot.querySelectorAll("[data-draft]").forEach(el=>el.onchange=()=>{this._draft[el.dataset.draft]=el.type==="checkbox"?el.checked:el.value;this.render()});
    this.shadowRoot.querySelectorAll("[data-apply]").forEach(b=>b.onclick=()=>this._applySettings());
    this.shadowRoot.querySelectorAll("[data-refresh]").forEach(b=>b.onclick=()=>this._call("button","press","refresh"));
    this.shadowRoot.querySelectorAll("[data-capture]").forEach(b=>b.onclick=()=>this._call("button","press","diagnostic_capture"));
    this.shadowRoot.querySelectorAll("[data-back]").forEach(b=>b.onclick=()=>{const p=this._panel?.config?.parent_route||"/dashboard-actions/home";history.pushState(null,"",p);window.dispatchEvent(new Event("location-changed"))});
  }
}
if(!customElements.get("s8-omni-operational")) customElements.define("s8-omni-operational",S8OmniOperational);
