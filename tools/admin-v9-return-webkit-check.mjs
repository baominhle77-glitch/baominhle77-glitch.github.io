import { webkit } from "playwright";
import { createCipheriv, pbkdf2Sync } from "node:crypto";
import { readFile } from "node:fs/promises";

const pagesOrigin = "https://hiennhi89.pages.dev";
const workerOrigin = "https://hiennhi89-gate.hiennhi89.workers.dev";
const deviceId = "a13e2fd1-4be5-4c1a-8a2a-2f1b8e6d9734";
const fakeToken = "admin-v11.fixture.token";
const fixtureKey = "fixture-only-admin-key-v11";
const sourceSha = process.argv[2] || "production";
const localGate = process.env.LOCAL_GATE_JS === "1" ? await readFile(new URL("../assets/gate.js", import.meta.url), "utf8") : "";

function encryptedPayload() {
  const plain = `<main id="v11-app"><section class="screen active"><h1 id="admin-v11-app-marker">Giao diện Bói toán đã giải mã</h1></section></main><nav><button type="button"><span class="i">⌂</span><span>Trang chủ</span></button></nav>`;
  const salt = Buffer.from("v11-fixture-salt", "utf8");
  const iv = Buffer.from("v11-admin-iv", "utf8");
  const key = pbkdf2Sync(fixtureKey, salt, 200000, 32, "sha256");
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final(), cipher.getAuthTag()]);
  return { saltB64: salt.toString("base64"), ivB64: iv.toString("base64"), ctB64: ct.toString("base64"), iterations: 200000 };
}

function fixtureHtml() {
  const payload = JSON.stringify(encryptedPayload()).replace(/</g, "\u003c");
  return `<!doctype html><html lang="vi" class="gate-locked"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin V11 encrypted fixture</title><script>window.GATE={app:"boitoan",mode:"approval",backend:"${workerOrigin}",owner:"Spirituality Market",title:"Spirituality Market",subtitle:"V11 encrypted fixture"};</script></head><body><div id="gate-content"></div><script type="application/gate-payload">${payload}</script><script src="/assets/gate.js?admin-v11=${encodeURIComponent(sourceSha)}"></script></body></html>`;
}

async function seedMinimalAdmin(context) {
  await context.addInitScript(({ deviceId, fakeToken }) => {
    localStorage.setItem("gate_device_id", deviceId);
    localStorage.setItem("market_admin_token", fakeToken);
    for (const key of ["market_admin_session","market_admin_level","market_admin_primary","market_admin_auth_version","gate_remember_boitoan","gate_key_boitoan"]) localStorage.removeItem(key);
    sessionStorage.removeItem("gate_ok_boitoan");
  }, { deviceId, fakeToken });
}

async function routeFixture(page, valid) {
  if (localGate) {
    await page.route(`${pagesOrigin}/assets/gate.js*`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/javascript; charset=utf-8", body: localGate });
    });
  }
  await page.route(`${pagesOrigin}/boitoan/?admin_return=1*`, async (route) => {
    if (!route.request().isNavigationRequest()) return route.continue();
    await route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: fixtureHtml() });
  });
  await page.route(`${workerOrigin}/api/community/admin/session`, async (route) => {
    await route.fulfill(valid
      ? { status: 200, contentType: "application/json", body: JSON.stringify({ level: "primary", primary: true, key: fixtureKey }) }
      : { status: 401, contentType: "application/json", body: JSON.stringify({ error: "unauthorized" }) });
  });
  await page.route(`${workerOrigin}/api/access`, async (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{\"ok\":true}" }));
}

async function assertValidReturn(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await seedMinimalAdmin(context);
  const page = await context.newPage();
  await routeFixture(page, true);
  await page.goto(`${pagesOrigin}/boitoan/?admin_return=1&v=19&fixture=${Date.now()}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector("#admin-v11-app-marker", { state: "visible", timeout: 15000 });
  const result = await page.evaluate(() => ({
    visibleText: document.getElementById("admin-v11-app-marker")?.textContent || "",
    childCount: document.getElementById("gate-content")?.children.length || 0,
    activeScreen: !!document.querySelector("#gate-content .screen.active"),
    locked: document.documentElement.classList.contains("gate-locked"),
    gate: !!document.getElementById("gate-root"),
    level: localStorage.getItem("market_admin_level"), session: localStorage.getItem("market_admin_session"),
    primary: localStorage.getItem("market_admin_primary"), authVersion: localStorage.getItem("market_admin_auth_version"),
    sessionFlag: sessionStorage.getItem("gate_ok_boitoan"), search: location.search,
  }));
  if (!result.visibleText || result.childCount < 2 || !result.activeScreen || result.locked || result.gate || result.level !== "primary" || result.session !== "1" || result.primary !== "1" || result.authVersion !== "2026-07-24-v11" || result.sessionFlag !== "1" || result.search.includes("admin_return")) {
    throw new Error(`valid_encrypted_admin_return_contract:${JSON.stringify(result)}`);
  }
  await context.close();
}

async function assertInvalidReturnLocks(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await seedMinimalAdmin(context);
  const page = await context.newPage();
  await routeFixture(page, false);
  await page.goto(`${pagesOrigin}/boitoan/?admin_return=1&v=19&invalid=${Date.now()}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector("#gate-root", { timeout: 15000 });
  const result = await page.evaluate(() => ({ locked: document.documentElement.classList.contains("gate-locked"), token: localStorage.getItem("market_admin_token"), session: localStorage.getItem("market_admin_session"), content: document.getElementById("gate-content")?.children.length || 0 }));
  if (!result.locked || result.token || result.session || result.content) throw new Error(`invalid_admin_return_contract:${JSON.stringify(result)}`);
  await context.close();
}

const browser = await webkit.launch({ headless: true });
try {
  await assertValidReturn(browser);
  await assertInvalidReturnLocks(browser);
  console.log(`Admin V11 encrypted WebKit return-to-app PASS (${localGate ? "local source" : "production asset"})`);
} finally { await browser.close(); }
