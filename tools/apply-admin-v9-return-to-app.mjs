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
  if (source.includes("/* Account V9 Admin return-to-app */")) return source;

  const oldStart = `  function start() {
    injectOwner(); // watermark chủ sở hữu (hiện cả khi khóa lẫn sau mở khóa)
    var hasPayload = !!document.querySelector('script[type="application/gate-payload"]');

    if (hasPayload) {
      // GHI NHỚ MÁY NÀY: nếu máy này đã lưu khóa -> tự giải mã, khỏi nhập lại
      // (bền vững kể cả sau khi tắt máy vì dùng localStorage).
      var savedKey = null;
      try { savedKey = localStorage.getItem("gate_key_" + APP); } catch (e) {}
      if (savedKey) {
        decryptPayload(savedKey)
          .then(function (html) { injectHtml(html); reveal("saved-key"); })
          .catch(function () {
            // khóa lưu không còn đúng (vd đổi mật khẩu) -> xóa và hiện lại cổng
            try { localStorage.removeItem("gate_key_" + APP); } catch (e) {}
            buildUI();
          });
        return;
      }
      buildUI();
      return;
    }

    // Trang local (không mã hóa): dùng cờ đã-mở-khóa như cũ.
    var method = unlockedMethod();
    if (method && MODE !== "encrypted") { reveal(method); return; }
    buildUI();
  }`;

  const newStart = `  /* Account V9 Admin return-to-app */
  function storedAdminReturnCandidate() {
    if (APP !== "boitoan" || !BACKEND) return false;
    try {
      var level = localStorage.getItem("market_admin_level") || "";
      return localStorage.getItem("market_admin_session") === "1"
        && !!localStorage.getItem("market_admin_token")
        && localStorage.getItem("market_admin_auth_version") === MARKET_ADMIN_AUTH_VERSION
        && (level === "regular" || level === "primary");
    } catch (e) { return false; }
  }

  function clearGateUnlockFlags() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(REMEMBER_KEY);
    } catch (e) {}
  }

  function continueGateStart(hasPayload) {
    if (hasPayload) {
      var savedKey = null;
      try { savedKey = localStorage.getItem("gate_key_" + APP); } catch (e) {}
      if (savedKey) {
        decryptPayload(savedKey)
          .then(function (html) { injectHtml(html); reveal("saved-key"); })
          .catch(function () {
            try { localStorage.removeItem("gate_key_" + APP); } catch (e) {}
            buildUI();
          });
        return;
      }
      buildUI();
      return;
    }

    var method = unlockedMethod();
    if (method && MODE !== "encrypted") { reveal(method); return; }
    buildUI();
  }

  function restoreAdminApp(onInvalid) {
    var token = "";
    try { token = localStorage.getItem("market_admin_token") || ""; } catch (e) {}
    fetch(BACKEND + "/api/community/admin/session", {
      headers: { authorization: "Bearer " + token, "x-owner-device-id": deviceId() },
      cache: "no-store"
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok || (data.level !== "regular" && data.level !== "primary")) {
          throw new Error("invalid_admin_return_session");
        }
        return data;
      });
    }).then(function (data) {
      try {
        localStorage.setItem("market_admin_session", "1");
        localStorage.setItem("market_admin_level", data.level);
        localStorage.setItem("market_admin_auth_version", MARKET_ADMIN_AUTH_VERSION);
        if (data.primary) localStorage.setItem("market_admin_primary", "1");
        else localStorage.removeItem("market_admin_primary");
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch (e) {}
      if (history && history.replaceState && /[?&]admin_return=1(?:&|$)/.test(location.search)) {
        history.replaceState(null, "", location.pathname + location.hash);
      }
      reveal("admin-return");
    }).catch(function () {
      clearMarketAdminSession();
      clearGateUnlockFlags();
      onInvalid();
    });
  }

  function start() {
    injectOwner();
    var hasPayload = !!document.querySelector('script[type="application/gate-payload"]');
    if (!hasPayload && storedAdminReturnCandidate()) {
      restoreAdminApp(function () { continueGateStart(false); });
      return;
    }
    continueGateStart(hasPayload);
  }`;

  return replaceRequired(source, oldStart, newStart, "khôi phục JWT Admin trước khi dựng cổng đăng nhập");
});

await edit("boitoan/community-admin.html", (source) => {
  if (source.includes('id="community-back-to-app"')) return source;
  return replaceRequired(
    source,
    '<a class="community-back" href="./">← Bói toán</a>',
    '<a id="community-back-to-app" class="community-back" href="./?admin_return=1">← Bói toán</a>',
    "liên kết quay lại app từ trang Quản trị"
  );
});

await edit("assets/community-admin.js", (source) => {
  if (source.includes("/* Account V9 Admin return navigation */")) return source;

  source = replaceRequired(
    source,
    '  var status = document.getElementById("community-admin-state");',
    '  /* Account V9 Admin return navigation */\n  var status = document.getElementById("community-admin-state");',
    "marker điều hướng Admin V9"
  );

  source = replaceRequired(
    source,
    '      localStorage.removeItem("market_admin_auth_version");',
    '      localStorage.removeItem("market_admin_auth_version");\n      localStorage.removeItem("gate_remember_boitoan");\n      sessionStorage.removeItem("gate_ok_boitoan");',
    "đăng xuất Admin xóa cờ mở app"
  );

  source = replaceRequired(
    source,
    '  function returnToLogin() { clearAdmin(); location.replace("./?admin=1&reauth=1"); }',
    '  var backToApp = document.getElementById("community-back-to-app");\n  if (backToApp) backToApp.addEventListener("click", function () {\n    try { sessionStorage.setItem("gate_ok_boitoan", "1"); } catch (_) {}\n  });\n  function returnToLogin() { clearAdmin(); location.replace("./?admin=1&reauth=1"); }',
    "giữ phiên khi bấm quay lại Bói toán"
  );
  return source;
});

for (const [path, markers] of [
  ["assets/gate.js", ["Account V9 Admin return-to-app", "storedAdminReturnCandidate", "restoreAdminApp", 'reveal("admin-return")', "/api/community/admin/session"]],
  ["boitoan/community-admin.html", ["community-back-to-app", "admin_return=1"]],
  ["assets/community-admin.js", ["Account V9 Admin return navigation", "gate_ok_boitoan", "gate_remember_boitoan"]],
]) {
  const value = await readFile(path, "utf8");
  for (const marker of markers) if (!value.includes(marker)) throw new Error(`Thiếu marker ${marker} trong ${path}`);
}

console.log("Account V9: quay từ Quản trị về Bói toán bằng JWT Admin đã xác minh, không rơi về cổng đăng nhập.");
