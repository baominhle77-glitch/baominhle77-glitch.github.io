import { readFile, writeFile } from "node:fs/promises";

async function edit(path, mutate) {
  const before = await readFile(path, "utf8");
  const after = mutate(before);
  if (after !== before) await writeFile(path, after, "utf8");
}

function replaceRequired(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) throw new Error(`Không tìm thấy điểm sửa ${label}`);
  return source.replace(before, after);
}

await edit("assets/gate.js", (source) => {
  if (source.includes("/* Account V10 authoritative Admin return */")) return source;

  const oldCandidate = `  function storedAdminReturnCandidate() {
    if (APP !== "boitoan" || !BACKEND) return false;
    try {
      var level = localStorage.getItem("market_admin_level") || "";
      return localStorage.getItem("market_admin_session") === "1"
        && !!localStorage.getItem("market_admin_token")
        && localStorage.getItem("market_admin_auth_version") === MARKET_ADMIN_AUTH_VERSION
        && (level === "regular" || level === "primary");
    } catch (e) { return false; }
  }`;

  const newCandidate = `  /* Account V10 authoritative Admin return */
  function adminReturnCandidate() {
    if (APP !== "boitoan" || !BACKEND) return false;
    try {
      var requested = new URLSearchParams(location.search).get("admin_return") === "1";
      var token = localStorage.getItem("market_admin_token") || "";
      return requested || !!token;
    } catch (e) {
      return /(?:^|[?&])admin_return=1(?:&|$)/.test(location.search || "");
    }
  }`;
  source = replaceRequired(source, oldCandidate, newCandidate, "ứng viên quay lại Admin không phụ thuộc cờ frontend");

  source = replaceRequired(
    source,
    `    var token = "";
    try { token = localStorage.getItem("market_admin_token") || ""; } catch (e) {}
    fetch(BACKEND + "/api/community/admin/session", {`,
    `    var token = "";
    try { token = localStorage.getItem("market_admin_token") || ""; } catch (e) {}
    if (!token) { clearMarketAdminSession(); clearGateUnlockFlags(); onInvalid(); return; }
    fetch(BACKEND + "/api/community/admin/session", {`,
    "không gọi backend khi thiếu JWT"
  );

  source = replaceRequired(
    source,
    `    if (!hasPayload && storedAdminReturnCandidate()) {
      injectOwner();
      restoreAdminApp(startWithoutAdminReturn);
      return;
    }`,
    `    if (adminReturnCandidate()) {
      injectOwner();
      restoreAdminApp(startWithoutAdminReturn);
      return;
    }`,
    "luôn xác minh JWT trước cổng, kể cả khi trạng thái frontend thiếu"
  );

  return source;
});

await edit("boitoan/community-admin.html", (source) => {
  source = source.replace('href="./?admin_return=1"', 'href="./?admin_return=1&v=18"');
  if (!source.includes('id="community-back-to-app"') || !source.includes('admin_return=1&v=18')) {
    throw new Error("Không cập nhật được link quay lại Admin V10");
  }
  return source;
});

await edit("boitoan/index.html", (source) => {
  if (source.includes('/assets/gate.js?v=18')) return source;
  return replaceRequired(source, '<script src="/assets/gate.js" defer></script>', '<script src="/assets/gate.js?v=18" defer></script>', "cache bust gate.js V18");
});

await edit("boitoan/sw.js", (source) => source.replace(/var CACHE="boitoan-v\d+";/, 'var CACHE="boitoan-v18";'));
await edit("boitoan/sw.test.mjs", (source) => {
  const keysLine = '    keys: async () => ["hiennhi89-v2", "boitoan-v10", "boitoan-v11", "boitoan-v12", "boitoan-v13", "boitoan-v14", "boitoan-v15", "boitoan-v16", "boitoan-v17", "boitoan-v18"],';
  const assertLine = 'assert.deepEqual(deletedCaches, ["boitoan-v10", "boitoan-v11", "boitoan-v12", "boitoan-v13", "boitoan-v14", "boitoan-v15", "boitoan-v16", "boitoan-v17"], "Bói toán must preserve caches owned by root Service Worker and current v18");';
  source = source.replace(/    keys: async \(\) => \[[^\n]+\],/, keysLine);
  source = source.replace(/assert\.deepEqual\(deletedCaches, \[[^\n]+\], "Bói toán must preserve caches owned by root Service Worker and current v\d+"\);/, assertLine);
  return source;
});

await edit("assets/account-v2.test.mjs", (source) => {
  const declaration = 'const plaintextPasswordAssignment = /(?:regular|primary|admin)?_?password\\s*[:=]\\s*["\\\'][^"\\\']{6,}["\\\']/i;';
  if (!source.includes("const plaintextPasswordAssignment")) {
    source = source.replace(
      'const webkitCheck = fs.readFileSync(new URL("../tools/webkit-production-check.mjs", import.meta.url), "utf8");',
      'const webkitCheck = fs.readFileSync(new URL("../tools/webkit-production-check.mjs", import.meta.url), "utf8");\n' + declaration
    );
  }
  source = source.replace(
    /assert\.doesNotMatch\((adminV(?:6|7|9|10)), \/[^\n]+\/, "([^"]+)"\);/g,
    'assert.doesNotMatch($1, plaintextPasswordAssignment, "$2");'
  );
  return source;
});

for (const [path, markers] of [
  ["assets/gate.js", ["Account V10 authoritative Admin return", "adminReturnCandidate", "requested || !!token", "restoreAdminApp(startWithoutAdminReturn)"]],
  ["boitoan/community-admin.html", ["community-back-to-app", "admin_return=1&v=18"]],
  ["boitoan/index.html", ["/assets/gate.js?v=18"]],
  ["boitoan/sw.js", ["boitoan-v18"]],
  ["boitoan/sw.test.mjs", ["boitoan-v18", "current v18"]],
  ["assets/account-v2.test.mjs", ["plaintextPasswordAssignment"]],
]) {
  const value = await readFile(path, "utf8");
  for (const marker of markers) if (!value.includes(marker)) throw new Error(`Thiếu marker ${marker} trong ${path}`);
}

console.log("Account V10: JWT và phản hồi backend là nguồn sự thật; tự phục hồi phiên Admin dù thiếu cờ frontend, cache v18.");
