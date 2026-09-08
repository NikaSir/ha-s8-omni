// Run with `node tests/ui/panel-regression.mjs` after installing Playwright and Chromium.
// Loads the real bootstrap and all child modules; no runtime methods are replaced.
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
  browser = await playwright.chromium.launch({
    headless:true,
    ...(process.env.S8_UI_BROWSER_EXECUTABLE ? {executablePath:process.env.S8_UI_BROWSER_EXECUTABLE} : {}),
  });
} catch (error) {
  await new Promise(resolve => server.close(resolve));
  throw error;
}
const page = await browser.newPage({viewport:{width:390,height:844}});
page.setDefaultTimeout(10_000);
const failures = [];
let acceptConfirmation = false;
const confirmations = [];
page.on("pageerror",error => { failures.push(error.message); console.error(error.stack || error.message); });
page.on("dialog",async dialog => {
  confirmations.push(dialog.message());
  if (acceptConfirmation) await dialog.accept();
  else await dialog.dismiss();
});
const active = page.locator("[data-stable-view]:not([hidden])");
const calls = () => page.evaluate(() => window.fixture.calls);
const countCalls = async count => assert.equal((await calls()).length,count);
const patch = async () => {
  // A Playwright click can scroll a control into view. The panel deliberately
  // defers DOM patches until that native scrolling finishes, so two animation
  // frames alone do not imply that the event's render has completed.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForFunction(() => {
    const panel = window.fixture.panel;
    return !panel._nativeScrollActive
      && panel._gesturePointers.size === 0
      && !panel._stablePatchQueued
      && !panel._renderQueued
      && !panel._renderDeferred
      && Date.now() >= panel._suppressClicksUntil;
  });
};
const navigate = async view => {
  await page.locator(`nav [data-view="${view}"]`).click();
  await page.waitForFunction(view => window.fixture.panel._view === view,view);
  await patch();
};
const inputVolume = async value => {
  await active.locator("[data-volume]").evaluate((input,value) => {
    input.value = String(value);
    input.dispatchEvent(new Event("input",{bubbles:true}));
    input.dispatchEvent(new Event("change",{bubbles:true}));
  },value);
  await patch();
};
const report = label => console.log(`PASS ${label}`);

try {
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => window.fixture?.panel?._registryLoaded && window.fixture.panel._stableMounted);
  await patch();

  // Exercise real click binding and live DOM reconciliation with synthetic HA.
  for (const outcome of ["fast", "slow", "error"]) {
    await page.evaluate(outcome => {
      const panel = window.fixture.panel;
      window.fixture.refreshCalls = 0;
      panel._hass.callService = async () => {
        window.fixture.refreshCalls++;
        if (outcome !== "fast") await new Promise(resolve => { window.fixture.releaseRefresh = resolve; });
        if (outcome === "error") throw new Error("Synthetic refresh failure");
      };
      window.fixture.refreshStartedAt = performance.now();
      panel.shadowRoot.querySelector("[data-refresh]").click();
      window.fixture.immediateBusy = panel.shadowRoot.querySelector("[data-refresh]").getAttribute("aria-busy");
    }, outcome);
    assert.equal(await page.evaluate(() => window.fixture.immediateBusy), "true");
    await patch();
    const refresh = page.locator("[data-refresh]");
    assert.equal(await refresh.getAttribute("aria-busy"), "true");
    assert.match(await refresh.getAttribute("class"), /is-refreshing/);
    assert.equal(await refresh.isEnabled(), false);
    assert.deepEqual(await refresh.evaluate(element => {
      const bounds = element.getBoundingClientRect();
      return {width: Math.round(bounds.width),height: Math.round(bounds.height)};
    }), {width: 44,height: 44});
    assert.equal(await refresh.locator("ha-icon").evaluate(el => getComputedStyle(el).animationName), "spin");
    await page.evaluate(() => {
      window.fixture.panel.shadowRoot.querySelector("[data-refresh]").click();
      window.fixture.panel._refresh();
    });
    assert.equal(await page.evaluate(() => window.fixture.refreshCalls), 1);
    if (outcome !== "fast") {
      await page.waitForTimeout(800);
      assert.equal(await refresh.getAttribute("aria-busy"), "true");
      await page.evaluate(() => window.fixture.releaseRefresh());
    }
    await page.waitForFunction(() => !window.fixture.panel._refreshPending);
    assert.ok(await page.evaluate(() => performance.now() - window.fixture.refreshStartedAt >= 700));
    await patch();
    assert.equal(await refresh.getAttribute("aria-busy"), "false");
    assert.equal(await refresh.isEnabled(), true);
    assert.doesNotMatch(await refresh.getAttribute("class"), /is-refreshing/);
    if (outcome === "error") assert.match(await active.innerText(), /Synthetic refresh failure/);
    await page.evaluate(() => {
      window.fixture.panel._commandError = null;
      window.fixture.setState("battery", "100"); // Restore the standard HA fixture.
    });
    await patch();
    report(`refresh ${outcome}: stable animation, minimum duration and duplicate guard`);
  }

  await navigate("maintenance");
  assert.match(await active.locator('[data-more="side_brush_life"]').innerText(),/40 ч 19 мин/);
  await inputVolume(72);
  await countCalls(0);
  assert.equal(await active.locator("[data-volume]").inputValue(),"72");
  assert.equal(await active.locator("[data-apply-cleaning]").isEnabled(),true);
  await active.locator("[data-cancel-service-draft]").click();
  assert.deepEqual(await page.evaluate(() => window.fixture.panel._cleaningDraft),{},"cancel must clear the draft immediately");
  await patch();
  await countCalls(0);
  assert.equal(await active.locator("[data-volume]").inputValue(),"50");
  assert.equal(await active.locator("[data-apply-cleaning]").isEnabled(),false);
  report("volume edit/cancel changes only the local draft");

  await active.locator('[data-toggle="do_not_disturb"]').click();
  await patch();
  await countCalls(0);
  await active.locator("[data-apply-cleaning]").click();
  await countCalls(0);
  assert.match(confirmations.at(-1),/Не беспокоить/);
  assert.equal(await active.locator("[data-apply-cleaning]").isEnabled(),true);
  acceptConfirmation = true;
  await page.evaluate(() => { window.fixture.autoReadback = false; });
  await active.locator("[data-apply-cleaning]").click();
  await page.waitForFunction(() => window.fixture.readbacks.length === 1);
  await countCalls(1);
  assert.deepEqual((await calls())[0],{domain:"switch",service:"turn_on",data:{entity_id:"switch.fixture_do_not_disturb"}});
  assert.equal(await page.evaluate(() => window.fixture.panel._controlValue("do_not_disturb")),false);
  assert.equal(await page.evaluate(() => window.fixture.panel._hasCleaningDraft()),true);
  await page.evaluate(() => window.fixture.flushReadbacks());
  await page.waitForFunction(() => !window.fixture.panel._hasCleaningDraft() && window.fixture.panel._busyCommands.size === 0);
  await patch();
  assert.equal(await active.locator("[data-apply-cleaning]").isEnabled(),false);
  report("DND requires confirmation and keeps its draft until device readback");

  await page.evaluate(() => {
    window.fixture.sliderBeforePatch = window.fixture.panel.shadowRoot.querySelector('[data-stable-view]:not([hidden]) [data-volume]');
  });
  await inputVolume(66);
  await page.evaluate(() => {
    window.fixture.setState("volume","55");
    window.fixture.setState("battery","99");
  });
  await patch();
  assert.equal(await page.evaluate(() => window.fixture.sliderBeforePatch === window.fixture.panel.shadowRoot.querySelector('[data-stable-view]:not([hidden]) [data-volume]')),true);
  assert.equal(await active.locator("[data-volume]").inputValue(),"66");
  await active.locator("[data-cancel-service-draft]").click();
  await patch();
  assert.equal(await active.locator("[data-volume]").inputValue(),"55");
  await inputVolume(67);
  assert.equal(await active.locator("[data-apply-cleaning]").isEnabled(),true);
  await active.locator("[data-cancel-service-draft]").click();
  await countCalls(1);
  report("live telemetry preserves slider DOM, input binding and unsaved edits");

  await navigate("cleaning");
  assert.equal(await active.locator(".preset-group.dry").count(),1);
  assert.equal(await active.locator(".preset-group.wet").count(),1);
  assert.equal(await active.locator("[data-cleaning-preset]").count(),6);
  assert.equal(await active.locator('[data-detail="cleaning-settings"]').count(),0);
  assert.match(await active.locator(".future-card").innerText(),/Карта и комнаты/);
  await active.locator('[data-user-preset-edit="wet"]').click();
  await page.locator("[data-user-suction]").selectOption("normal");
  await page.locator("[data-user-water]").selectOption("high");
  await page.locator("[data-user-save]").click();
  await patch();
  await countCalls(1);
  assert.equal(await page.evaluate(() => window.fixture.panel._controlValue("suction")),"gentle");
  assert.equal(await page.evaluate(() => window.fixture.panel._controlValue("water")),"closed");
  assert.equal(await page.evaluate(() => Object.keys(localStorage).some(key => key.startsWith("nikas.s8_omni.user_preset.") && key.endsWith(".wet"))),true);
  await active.locator('[data-cleaning-preset="wet-user"]').click();
  await page.locator("[data-preset-cancel]").click();
  await patch();
  await countCalls(1);
  await active.locator('[data-cleaning-preset="wet-user"]').click();
  await page.locator("[data-preset-apply]").click();
  await page.waitForFunction(() => window.fixture.calls.length === 2 && window.fixture.readbacks.length === 1);
  await page.evaluate(() => window.fixture.flushReadbacks());
  await page.waitForFunction(() => window.fixture.calls.length === 3 && window.fixture.readbacks.length === 1);
  // One acknowledged field is not enough to highlight a two-field preset.
  assert.equal(await active.locator(".user-preset-shell.selected").count(),0);
  await page.evaluate(() => window.fixture.flushReadbacks());
  await page.waitForFunction(() => window.fixture.panel._busyCommands.size === 0);
  await patch();
  assert.deepEqual((await calls()).slice(1),[
    {domain:"select",service:"select_option",data:{entity_id:"select.fixture_suction",option:"normal"}},
    {domain:"select",service:"select_option",data:{entity_id:"select.fixture_water",option:"high"}},
  ]);
  assert.equal(await active.locator('.user-preset-shell.selected [data-cleaning-preset="wet-user"]').count(),1);
  await page.evaluate(() => window.fixture.setState("battery","98"));
  await patch();
  assert.equal(await active.locator('.user-preset-shell.selected [data-cleaning-preset="wet-user"]').count(),1);
  report("user preset save/cancel sends nothing; apply/readback preserves selected highlight");

  await page.evaluate(() => {
    window.fixture.setState("robot_status","cleaning");
    window.fixture.setState("composite_status","cleaning",{robot_on_dock:false,station_operations:[],missing_station_dps:[]});
    window.fixture.setState("clean_time","120");
    window.fixture.setState("clean_area","2");
  });
  await patch();
  assert.match(await active.locator('[data-more="clean_area"]').innerText(),/2 м²/);
  await page.evaluate(() => {
    window.fixture.setState("robot_status","charged");
    window.fixture.setState("composite_status","charged",{robot_on_dock:true,station_operations:[],missing_station_dps:[]});
  });
  await patch();
  assert.match(await active.innerText(),/Уборка не выполняется/);
  await active.locator('[data-user-preset-edit="dry"]').click();
  assert.equal(await page.locator('[data-preset-dialog="editor"]').count(),1);
  await page.locator("[data-preset-cancel]").click();
  await countCalls(3);
  report("cleaning status changes reconcile metric structure without losing preset handlers");

  await navigate("station");
  assert.equal((await active.innerText()).match(/Ожидание/g)?.length,1);
  assert.equal(await active.locator("[data-station-command]").count(),3);
  report("station idle summary is not duplicated and retains all three operation controls");

  for (const view of ["overview","cleaning","station","maintenance","diagnostics"]) {
    await navigate(view);
    const layout = await page.evaluate(() => {
      const shadow = window.fixture.panel.shadowRoot;
      const visible = shadow.querySelector('[data-stable-view]:not([hidden])');
      const rect = visible.getBoundingClientRect();
      const header = shadow.querySelector(".app-header").getBoundingClientRect();
      const nav = shadow.querySelector("nav").getBoundingClientRect();
      return {left:rect.left,right:rect.right,width:innerWidth,headerTop:header.top,navBottom:nav.bottom,height:innerHeight};
    });
    assert.ok(layout.left >= -1 && layout.right <= layout.width+1,`${view}: content exceeds horizontal viewport`);
    assert.ok(layout.headerTop >= -1 && layout.navBottom <= layout.height+1,`${view}: shell exceeds host`);
  }
  report("five workspaces stay inside the mobile host at 100% scale");

  await navigate("maintenance");
  const settings = active.locator(".service-settings-card");
  assert.equal(await settings.locator("[data-volume]").count(),1);
  assert.equal(await settings.locator('[data-toggle="do_not_disturb"]').count(),1);
  assert.equal(await settings.locator('[data-toggle="child_lock"]').count(),1);
  assert.equal(await settings.evaluate((card) => {
    const dnd = card.querySelector('[data-toggle="do_not_disturb"]');
    const child = card.querySelector('[data-toggle="child_lock"]');
    const actions = card.querySelector(".service-apply-bar");
    return Boolean(dnd.compareDocumentPosition(child) & Node.DOCUMENT_POSITION_FOLLOWING)
      && Boolean(child.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING);
  }),true);
  assert.equal(await active.locator(".protection-card").count(),0);
  assert.equal(await active.locator('[data-more="fault"]').count(),0);
  const beforeInvalidChild = (await calls()).length;
  for (const value of ["unknown", "unavailable", "", "malformed", true, false]) {
    await page.evaluate(value => window.fixture.setState("child_lock",value),value);
    await patch();
    const childControl = settings.locator('[data-toggle="child_lock"]');
    assert.equal(await childControl.isDisabled(),true,`child lock ${String(value)} must be disabled`);
    await childControl.evaluate(button => button.click());
    await countCalls(beforeInvalidChild);
  }
  await page.evaluate(() => window.fixture.setState("child_lock","off"));
  await patch();
  report("relocated child lock rejects unknown and malformed state without dispatch");
  await inputVolume(72);
  const beforeChild = (await calls()).length;
  const confirmationsBeforeChild = confirmations.length;
  await settings.locator('[data-toggle="child_lock"]').click();
  await patch();
  await countCalls(beforeChild);
  assert.equal(confirmations.length,confirmationsBeforeChild);
  assert.equal(await settings.locator('[data-toggle="child_lock"]').getAttribute("aria-pressed"),"true");
  assert.deepEqual(await page.evaluate(() => window.fixture.panel._cleaningDraft),{volume:72,child_lock:true});
  assert.equal(await page.evaluate(() => window.fixture.panel._controlValue("volume")),55);
  await settings.locator("[data-cancel-service-draft]").click();
  await patch();
  await countCalls(beforeChild);
  assert.deepEqual(await page.evaluate(() => window.fixture.panel._cleaningDraft),{});
  assert.equal(await settings.locator("[data-volume]").inputValue(),"55");
  assert.equal(await settings.locator('[data-toggle="child_lock"]').getAttribute("aria-pressed"),"false");

  await settings.locator('[data-toggle="do_not_disturb"]').click();
  await settings.locator('[data-toggle="child_lock"]').click();
  await patch();
  assert.deepEqual(await page.evaluate(() => window.fixture.panel._cleaningDraft),{do_not_disturb:false,child_lock:true});
  await page.evaluate(() => { window.fixture.autoReadback = true; });
  acceptConfirmation = true;
  await settings.locator("[data-apply-cleaning]").click();
  await page.waitForFunction(() => !window.fixture.panel._hasCleaningDraft() && window.fixture.panel._busyCommands.size === 0);
  await patch();
  assert.match(confirmations.at(-1),/Не беспокоить: Выкл[\s\S]*Блокировка от детей: Вкл/);
  assert.deepEqual((await calls()).slice(beforeChild),[
    {domain:"switch",service:"turn_off",data:{entity_id:"switch.fixture_do_not_disturb"}},
    {domain:"switch",service:"turn_on",data:{entity_id:"switch.fixture_child_lock"}},
  ]);
  assert.equal(await settings.locator('[data-toggle="do_not_disturb"]').getAttribute("aria-pressed"),"false");
  assert.equal(await settings.locator('[data-toggle="child_lock"]').getAttribute("aria-pressed"),"true");
  report("child lock and DND share one confirmed Apply/Cancel draft");

  await navigate("diagnostics");
  const fault = active.locator('.fault-status[data-more="fault"]');
  assert.equal(await fault.locator("strong").innerText(),"Ошибок нет");
  await page.evaluate(() => window.fixture.setState("fault","16"));
  await patch();
  assert.equal(await fault.locator("strong").innerText(),"Код ошибки: 16");
  assert.match(await fault.getAttribute("class"),/\berror\b/);
  await navigate("overview");
  assert.equal(await active.locator(".state-hero h1").innerText(),"Требуется внимание");
  await navigate("diagnostics");
  await page.evaluate(() => window.fixture.setState("fault","unknown"));
  await patch();
  assert.equal(await fault.locator("strong").innerText(),"Нет данных");
  await page.evaluate(() => {
    window.fixture.setState("fault","0");
    window.fixture.setState("telemetry_age","60");
  });
  await patch();
  assert.equal(await fault.locator("strong").innerText(),"Данные устарели");
  await page.evaluate(() => {
    window.fixture.setState("telemetry_age","0");
    window.fixture.setState("composite_status","error");
  });
  await patch();
  assert.equal(await fault.locator("strong").innerText(),"Требуется внимание · код не получен");
  assert.match(await fault.getAttribute("class"),/\berror\b/);
  await navigate("overview");
  assert.equal(await active.locator(".state-hero h1").innerText(),"Требуется внимание");
  await countCalls(beforeChild+2);
  report("diagnostics distinguishes clear, active, unknown and stale faults; overview keeps active warnings");

  assert.deepEqual(failures,[],"uncaught errors from the real bootstrap");
  console.log("All browser UI regressions passed.");
} catch (error) {
  const diagnostic = await page.evaluate(() => {
    const panel = window.fixture?.panel;
    const view = panel?.shadowRoot.querySelector('[data-stable-view]:not([hidden])');
    const slider = view?.querySelector("[data-volume]");
    const focused = panel?.shadowRoot.activeElement;
    return {
      view:panel?._view,
      draft:panel?._cleaningDraft,
      nativeScrollActive:panel?._nativeScrollActive,
      gesturePointers:panel?._gesturePointers.size,
      renderDeferred:panel?._renderDeferred,
      renderQueued:panel?._renderQueued,
      patchQueued:panel?._stablePatchQueued,
      focused:focused ? {tag:focused.tagName,attributes:Object.fromEntries(Array.from(focused.attributes,attr => [attr.name,attr.value]))} : null,
      slider:slider ? {value:slider.value,attribute:slider.getAttribute("value")} : null,
      draftStatus:view?.querySelector("[data-service-draft-status]")?.textContent,
      cancelDisabled:view?.querySelector("[data-cancel-service-draft]")?.disabled,
      calls:window.fixture?.calls,
    };
  }).catch(() => ({fixtureUnavailable:true}));
  console.error("Fixture at failure:",JSON.stringify(diagnostic,null,2));
  throw error;
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
