// Production bundle, synthetic HA only. Run alongside panel-regression.mjs.
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {resolve} from "node:path";
import {createFixtureServer} from "./fixture-server.mjs";

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require("playwright"); }
catch (error) {
  if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw error;
  playwright = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,"playwright"));
}
const server = createFixtureServer();
await new Promise(resolve => server.listen(0,"127.0.0.1",resolve));
let browser;
try {
  browser = await playwright.chromium.launch({headless:true,
    ...(process.env.S8_UI_BROWSER_EXECUTABLE ? {executablePath:process.env.S8_UI_BROWSER_EXECUTABLE} : {})});
  const page = await browser.newPage({viewport:{width:430,height:932}});
  const errors = [];
  page.on("pageerror",error => errors.push(error.message));
  const patch = async () => {
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.waitForFunction(() => {
      const p = window.fixture.panel;
      return !p._nativeScrollActive && !p._stablePatchQueued && !p._renderQueued && !p._renderDeferred;
    });
  };
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => window.fixture?.panel?._registryLoaded && window.fixture.panel._stableMounted);
  await patch();
  await page.evaluate(() => {
    const root = window.fixture.panel.shadowRoot;
    window.kept = Object.fromEntries([".app-header",".header-title","[data-refresh]",
      "[data-connection-icon]","[data-freshness-icon]","[data-work-viewport]","nav"]
      .map(selector => [selector,root.querySelector(selector)]));
  });

  // Widths include the complete shell matrix, narrow phones, and sidebar hosts.
  const sizes = [[320,844,0],[360,844,0],[390,844,0],[430,932,0],[932,430,0],
    [768,1024,0],[1024,768,0],[1440,900,0],[768,1024,256],[1440,900,256]];
  for (const [width,height,sidebar] of sizes) for (const dark of [false,true]) {
    await page.setViewportSize({width,height});
    await page.evaluate(({dark,sidebar}) => {
      const panel = window.fixture.panel;
      panel.style.width = `calc(100% - ${sidebar}px)`;
      panel.style.marginLeft = `${sidebar}px`;
      window.fixture.setTheme(dark);
    },{dark,sidebar});
    await patch();
    const m = await page.evaluate(() => {
      const root = window.fixture.panel.shadowRoot;
      const bounds = selector => root.querySelector(selector).getBoundingClientRect();
      const header = bounds(".app-header"),title = bounds(".header-title");
      const line = bounds(".header-title span"),menu = bounds("[data-header-primary]");
      const refresh = root.querySelector("[data-refresh]");
      const button = bounds("[data-refresh]"),icons = bounds(".connection-indicator");
      const version = root.querySelector(".header-title span");
      const titleStyle = getComputedStyle(root.querySelector(".header-title"));
      const viewport = root.querySelector("[data-work-viewport]");
      return {headerHeight:header.height,titleHeight:title.height,
        centered:Math.abs(title.x+title.width/2-(header.x+header.width/2)),
        actions:[menu.width,menu.height,button.width,button.height],
        versions:version.textContent,font:parseFloat(getComputedStyle(version).fontSize),
        lineFits:line.left >= title.left+parseFloat(titleStyle.paddingLeft)-0.5
          && line.right <= title.right-parseFloat(titleStyle.paddingRight)+0.5,
        lineHeight:line.height,whiteSpace:getComputedStyle(version).whiteSpace,
        color:getComputedStyle(refresh).color,background:getComputedStyle(refresh).backgroundColor,
        iconSize:[icons.width,icons.height],overflow:viewport.scrollWidth > viewport.clientWidth+1};
    });
    assert.equal(m.headerHeight,60);
    assert.equal(m.titleHeight,52);
    assert.ok(m.centered < 0.5,JSON.stringify(m));
    assert.deepEqual(m.actions,[44,44,44,44]);
    assert.equal(m.versions,"UI v1.0.14 / 1.0.9-beta006");
    assert.ok(m.font >= 10.99 && m.font <= 14.01);
    assert.ok(m.lineFits,`version clipped at ${width}/${sidebar}: ${JSON.stringify(m)}`);
    assert.equal(m.whiteSpace,"nowrap");
    assert.ok(m.lineHeight < 18);
    assert.equal(m.color,dark ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)");
    if (!dark) assert.equal(m.background,"rgb(255, 255, 255)");
    assert.deepEqual(m.iconSize,[56,24]);
    assert.equal(m.overflow,false);
  }
  console.log("PASS complete versions, centered 60/52/44px header, theme colors and compact icons: 20 viewport/theme cases");

  await page.setViewportSize({width:430,height:932});
  await page.evaluate(() => {
    window.fixture.panel.style.width = "100%";
    window.fixture.panel.style.marginLeft = "0";
    window.fixture.setTheme(false);
  });
  const statuses = [
    {connection:"on",age:"0",attrs:{has_successful_snapshot:true,telemetry_status:"current"},cloud:"mdi:cloud",icon:"mdi:check-circle-outline",fresh:"Данные актуальны",tone:"current"},
    {connection:"on",age:"16",attrs:{has_successful_snapshot:true,telemetry_status:"current",stale_after_seconds:15},cloud:"mdi:cloud",icon:"mdi:clock-alert-outline",fresh:"Данные устарели",tone:"stale"},
    {connection:"on",age:"unknown",attrs:{has_successful_snapshot:false,telemetry_status:"no_data"},cloud:"mdi:cloud",icon:"mdi:clock-outline",fresh:"Нет данных",tone:"no-data"},
    {connection:"off",age:"2",attrs:{has_successful_snapshot:true,telemetry_status:"stale"},cloud:"mdi:cloud-off-outline",icon:"mdi:clock-alert-outline",fresh:"Данные устарели",tone:"stale"},
    {connection:"off",age:"unknown",attrs:{has_successful_snapshot:false,telemetry_status:"no_data"},cloud:"mdi:cloud-off-outline",icon:"mdi:clock-outline",fresh:"Нет данных",tone:"no-data"},
    {connection:"unavailable",age:"unknown",attrs:{},cloud:"mdi:cloud-question-outline",icon:"mdi:clock-outline",fresh:"Нет данных",tone:"no-data"},
    {connection:"invalid",age:"0",attrs:{},cloud:"mdi:cloud-question-outline",icon:"mdi:clock-outline",fresh:"Нет данных",tone:"no-data"},
  ];
  for (const s of [...statuses,statuses[0]]) {
    await page.evaluate(s => {
      window.fixture.setState("telemetry_age",s.age);
      window.fixture.setState("local_connection",s.connection,s.attrs);
    },s);
    await patch();
    const m = await page.evaluate(() => {
      const root = window.fixture.panel.shadowRoot;
      const cloud = root.querySelector("[data-connection-icon]");
      const fresh = root.querySelector("[data-freshness-icon]");
      return {cloud:cloud.querySelector("ha-icon").getAttribute("icon"),
        icon:fresh.querySelector("ha-icon").getAttribute("icon"),
        label:fresh.getAttribute("aria-label"),cloudLabel:cloud.getAttribute("aria-label"),
        role:fresh.getAttribute("role"),classes:fresh.className,
        cloudColor:getComputedStyle(cloud).color,freshColor:getComputedStyle(fresh).color,
        badge:getComputedStyle(fresh.querySelector(".question-badge")).display,
        retained:Object.entries(window.kept).every(([selector,node]) => root.querySelector(selector) === node)};
    });
    assert.equal(m.cloud,s.cloud);
    assert.equal(m.icon,s.icon);
    assert.equal(m.label,s.fresh);
    assert.equal(m.role,"img");
    assert.ok(m.cloudLabel);
    assert.ok(m.classes.split(" ").includes(s.tone));
    assert.equal(m.badge,s.tone === "no-data" ? "flex" : "none");
    if (s.connection === "on") assert.equal(m.cloudColor,"rgb(67, 160, 71)");
    if (s.tone === "stale") assert.equal(m.freshColor,"rgb(246, 166, 35)");
    assert.equal(m.retained,true);
  }
  console.log("PASS independent connection/freshness, missing snapshots, outage and recovery retain mounted nodes");

  await page.setViewportSize({width:430,height:640});
  await page.evaluate(() => {
    window.fixture.setState("telemetry_age","30");
    window.fixture.panel.shadowRoot.querySelector("[data-work-viewport]").scrollTop = 120;
  });
  await patch();
  const originalScroll = await page.locator("[data-work-viewport]").evaluate(el => el.scrollTop);
  assert.ok(originalScroll > 0);
  await page.locator("[data-refresh]").evaluate(el => el.click());
  await page.waitForFunction(() => !window.fixture.panel._refreshPending);
  await patch();
  assert.equal(await page.locator("[data-work-viewport]").evaluate(el => el.scrollTop),originalScroll);
  assert.equal(await page.locator("[data-freshness-icon]").getAttribute("aria-label"),"Данные устарели");
  await page.evaluate(() => {
    const panel = window.fixture.panel;
    panel.shadowRoot.querySelector("[data-work-viewport]").scrollTop = 0;
    panel._viewTransform = {scale:1.5,x:-40,y:-80};
    panel._clampAndApplyTransform(false);
    window.transformBefore = {...panel._viewTransform};
    window.fixture.setState("battery","99");
    panel.shadowRoot.querySelector("[data-refresh]").click();
  });
  await page.waitForFunction(() => !window.fixture.panel._refreshPending);
  await patch();
  assert.equal(await page.evaluate(() => {
    const p = window.fixture.panel,r = p.shadowRoot;
    return JSON.stringify(p._viewTransform) === JSON.stringify(window.transformBefore)
      && Object.entries(window.kept).every(([selector,node]) => r.querySelector(selector) === node);
  }),true);
  console.log("PASS refresh preserves stale truth, native scroll, work zoom/pan and mounted header/icons");
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.evaluate(() => window.fixture.panel.shadowRoot.querySelector("[data-refresh]").click());
  assert.equal(await page.locator("[data-refresh] ha-icon").evaluate(el => getComputedStyle(el).animationName),"none");
  await page.waitForFunction(() => !window.fixture.panel._refreshPending);
  assert.equal(await page.locator("[data-refresh] ha-icon").getAttribute("icon"),"mdi:check");
  console.log("PASS reduced-motion refresh keeps visible result");
  assert.deepEqual(errors,[]);
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
