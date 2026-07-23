import fs from "node:fs";
import { webkit } from "playwright";

const origin = "https://hiennhi89.pages.dev";
const iphoneUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Version/18.5 Mobile/15E148 Safari/604.1";

function safeErrorMessage(error) {
  return String(error && error.message || error || "webkit_unknown")
    .slice(0, 500)
    .replace(/[\r\n]+/g, " ");
}

function fixtureHtml(state, sourceSha) {
  const safeState = JSON.stringify(state).replace(/</g, "\\u003c");
  const safeSha = String(sourceSha || "unknown").replace(/[^a-f0-9]/gi, "").slice(0, 40) || "unknown";
  return `<!doctype html>
<html lang="vi" class="gate-locked">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>WebKit Gate Fixture</title>
  <link rel="stylesheet" href="/assets/gate.css?webkit=${safeSha}">
  <script>
    window.GATE = {
      app: "boitoan",
      mode: "approval",
      backend: "https://hiennhi89-gate.hiennhi89.workers.dev",
      owner: "Spirituality Market",
      title: "Spirituality Market",
      subtitle: "E2E WebKit"
    };
  </script>
</head>
<body>
  <script>
    (function () {
      var state = ${safeState};
      localStorage.setItem("gate_token_boitoan", state.gate_token);
      localStorage.setItem("community_token_boitoan", state.token);
      localStorage.setItem("community_profile_boitoan", JSON.stringify(state.profile));
      localStorage.setItem("gate_remember_boitoan", "1");
      localStorage.removeItem("market_admin_session");
      localStorage.removeItem("market_admin_primary");
      sessionStorage.setItem("gate_ok_boitoan", "1");
      window.__e2eChildMutations = 0;
      new MutationObserver(function (records) {
        window.__e2eChildMutations += records.reduce(function (sum, record) {
          return sum + record.addedNodes.length + record.removedNodes.length;
        }, 0);
      }).observe(document, { childList: true, subtree: true });
    })();
  </script>
  <div id="gate-content">
    <div class="wrap">
      <header><h1>Spirituality Market</h1></header>
      <main><section class="screen"><h2>Trang thử WebKit</h2></section></main>
      <nav><button type="button"><span class="i">⌂</span><span>Trang chủ</span></button></nav>
    </div>
  </div>
  <script src="/assets/gate.js?webkit=${safeSha}"></script>
</body>
</html>`;
}

async function assertLockedProductionLoads(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: iphoneUA,
  });
  try {
    const page = await context.newPage();
    let crashed = false;
    const errors = [];
    page.on("crash", () => { crashed = true; });
    page.on("pageerror", (error) => errors.push(safeErrorMessage(error)));
    const response = await page.goto(`${origin}/boitoan/?webkit-locked=${Date.now()}`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.waitForTimeout(2500);
    if (crashed) throw new Error("locked_page_crashed");
    if (!response || response.status() !== 200) {
      throw new Error(`locked_http_${response ? response.status() : "none"}`);
    }
    if (errors.some((message) => /maximum call stack|out of memory|mutation/i.test(message))) {
      throw new Error(`locked_pageerror:${errors.slice(0, 3).join("|")}`);
    }
  } finally {
    await context.close();
  }
}

async function assertProductionGateStable(browser, state, sourceSha) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: iphoneUA,
  });
  try {
    const page = await context.newPage();
    let crashed = false;
    const errors = [];
    page.on("crash", () => { crashed = true; });
    page.on("pageerror", (error) => errors.push(safeErrorMessage(error)));

    await page.route(/https:\/\/hiennhi89\.pages\.dev\/boitoan\/\?webkit-fixture=/, async (route) => {
      if (!route.request().isNavigationRequest()) {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: fixtureHtml(state, sourceSha),
      });
    });

    const response = await page.goto(`${origin}/boitoan/?webkit-fixture=${Date.now()}`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.waitForTimeout(2000);
    const firstCount = await page.evaluate(() => Number(window.__e2eChildMutations || 0));
    await page.waitForTimeout(2000);

    if (crashed) throw new Error("fixture_page_crashed");
    if (!response || response.status() !== 200) {
      throw new Error(`fixture_http_${response ? response.status() : "none"}`);
    }
    if (errors.length) throw new Error(`fixture_pageerror:${errors.slice(0, 3).join("|")}`);

    const result = await page.evaluate((initialMutations) => ({
      locked: document.documentElement.classList.contains("gate-locked"),
      nav: !!document.querySelector("#gate-content nav, body nav"),
      communityLinks: document.querySelectorAll("#gate-community-link").length,
      labels: document.querySelectorAll("#gate-community-link .market-nav-label").length,
      label: document.querySelector("#gate-community-link .market-nav-label")?.textContent || "",
      mutations: Number(window.__e2eChildMutations || 0),
      mutationDelta: Number(window.__e2eChildMutations || 0) - initialMutations,
      title: document.title,
    }), firstCount);

    if (result.locked || !result.nav || result.communityLinks !== 1 || result.labels !== 1 || result.label !== "Cộng đồng") {
      throw new Error(`fixture_dom_contract:${JSON.stringify(result)}`);
    }
    if (result.mutations > 1000 || result.mutationDelta > 100) {
      throw new Error(`fixture_mutation_loop:${JSON.stringify(result)}`);
    }

    const gateSource = await page.evaluate(async (sha) => {
      const response = await fetch(`/assets/gate.js?verify=${encodeURIComponent(sha)}`, { cache: "no-store" });
      return response.ok ? response.text() : "";
    }, sourceSha);
    if (!gateSource.includes("Account V3 iOS mutation guard")) {
      throw new Error("production_gate_missing_ios_guard");
    }

    console.log(`WebKit production gate PASS; mutations=${result.mutations}; delta=${result.mutationDelta}; title=${result.title}`);
  } finally {
    await context.close();
  }
}

async function main() {
  const statePath = process.argv[2];
  const errorPath = process.argv[3];
  const sourceSha = process.argv[4] || "unknown";
  if (!statePath || !errorPath) throw new Error("webkit_arguments_missing");

  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  if (!state.token || !state.gate_token || !state.profile) {
    throw new Error("webkit_entry_contract");
  }

  const browser = await webkit.launch({ headless: true });
  try {
    await assertLockedProductionLoads(browser);
    await assertProductionGateStable(browser, state, sourceSha);
  } finally {
    await browser.close();
  }
}

const errorPath = process.argv[3];
main().catch((error) => {
  const message = safeErrorMessage(error);
  if (errorPath) {
    try { fs.writeFileSync(errorPath, message, "utf8"); } catch (_) {}
  }
  console.error(`WEBKIT_E2E_ERROR: ${message}`);
  process.exitCode = 1;
});
