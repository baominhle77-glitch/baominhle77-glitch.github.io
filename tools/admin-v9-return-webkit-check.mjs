import { webkit } from "playwright";

const pagesOrigin = "https://hiennhi89.pages.dev";
const workerOrigin = "https://hiennhi89-gate.hiennhi89.workers.dev";
const deviceId = "a13e2fd1-4be5-4c1a-8a2a-2f1b8e6d9734";
const fakeToken = "admin-v10.fixture.token";
const sourceSha = process.argv[2] || "production";

function fixtureHtml() {
  return `<!doctype html>
<html lang="vi" class="gate-locked">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Admin V10 Return Fixture</title>
  <script>
    window.GATE = {
      app: "boitoan",
      mode: "approval",
      backend: "${workerOrigin}",
      owner: "Spirituality Market",
      title: "Spirituality Market",
      subtitle: "Admin V10 fixture"
    };
  </script>
</head>
<body>
  <div id="gate-content">
    <main><section class="screen"><h1 id="admin-v10-app-marker">Giao diện Bói toán</h1></section></main>
    <nav><button type="button"><span class="i">⌂</span><span>Trang chủ</span></button></nav>
  </div>
  <script src="/assets/gate.js?admin-v10=${encodeURIComponent(sourceSha)}"></script>
</body>
</html>`;
}

async function seedMinimalAdmin(context) {
  await context.addInitScript(({ deviceId, fakeToken }) => {
    localStorage.setItem("gate_device_id", deviceId);
    localStorage.setItem("market_admin_token", fakeToken);
    localStorage.removeItem("market_admin_session");
    localStorage.removeItem("market_admin_level");
    localStorage.removeItem("market_admin_primary");
    localStorage.removeItem("market_admin_auth_version");
    localStorage.removeItem("gate_remember_boitoan");
    sessionStorage.removeItem("gate_ok_boitoan");
  }, { deviceId, fakeToken });
}

async function routeFixture(page, valid) {
  await page.route(`${pagesOrigin}/boitoan/?admin_return=1*`, async (route) => {
    if (!route.request().isNavigationRequest()) return route.continue();
    await route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: fixtureHtml() });
  });
  await page.route(`${workerOrigin}/api/community/admin/session`, async (route) => {
    if (valid) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ level: "primary", primary: true }) });
    } else {
      await route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "unauthorized" }) });
    }
  });
  await page.route(`${workerOrigin}/api/access`, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
}

async function assertValidReturn(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await seedMinimalAdmin(context);
  const page = await context.newPage();
  await routeFixture(page, true);
  await page.goto(`${pagesOrigin}/boitoan/?admin_return=1&v=18&fixture=${Date.now()}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForFunction(() => !document.documentElement.classList.contains("gate-locked"), null, { timeout: 15000 });
  const result = await page.evaluate(() => ({
    marker: !!document.getElementById("admin-v10-app-marker"),
    gate: !!document.getElementById("gate-root"),
    level: localStorage.getItem("market_admin_level"),
    session: localStorage.getItem("market_admin_session"),
    primary: localStorage.getItem("market_admin_primary"),
    authVersion: localStorage.getItem("market_admin_auth_version"),
    sessionFlag: sessionStorage.getItem("gate_ok_boitoan"),
    search: location.search,
  }));
  if (!result.marker || result.gate || result.level !== "primary" || result.session !== "1" || result.primary !== "1" || result.authVersion !== "2026-07-23-v8" || result.sessionFlag !== "1" || result.search.includes("admin_return")) {
    throw new Error(`valid_admin_return_contract:${JSON.stringify(result)}`);
  }
  await context.close();
}

async function assertInvalidReturnLocks(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await seedMinimalAdmin(context);
  const page = await context.newPage();
  await routeFixture(page, false);
  await page.goto(`${pagesOrigin}/boitoan/?admin_return=1&v=18&invalid=${Date.now()}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector("#gate-root", { timeout: 15000 });
  const result = await page.evaluate(() => ({
    locked: document.documentElement.classList.contains("gate-locked"),
    token: localStorage.getItem("market_admin_token"),
    session: localStorage.getItem("market_admin_session"),
    level: localStorage.getItem("market_admin_level"),
    remember: localStorage.getItem("gate_remember_boitoan"),
    sessionFlag: sessionStorage.getItem("gate_ok_boitoan"),
  }));
  if (!result.locked || result.token || result.session || result.level || result.remember || result.sessionFlag) {
    throw new Error(`invalid_admin_return_contract:${JSON.stringify(result)}`);
  }
  await context.close();
}

const browser = await webkit.launch({ headless: true });
try {
  await assertValidReturn(browser);
  await assertInvalidReturnLocks(browser);
  console.log("Admin V10 WebKit return-to-app PASS with minimal real storage");
} finally {
  await browser.close();
}
