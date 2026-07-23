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

await edit("backend/community.js", (source) => {
  if (source.includes("/* Account V3 plaintext public entry */")) return source;

  const oldEntryResponse = `async function entryResponse(env, profile, did, status = 200, extra = {}) {
  const key = entryDecryptKey(env);
  if (!key) return json({ error: "decrypt_key_unavailable" }, 503);
  const [communityToken, gateToken] = await Promise.all([
    issueCommunitySession(env, profile, did),
    issueGateSession(env, profile, did),
  ]);
  return json({ token: communityToken, gate_token: gateToken, key, profile: publicProfile(profile, true), ...extra }, status);
}`;
  const newEntryResponse = `async function entryResponse(env, profile, did, status = 200, extra = {}) {
  const [communityToken, gateToken] = await Promise.all([
    issueCommunitySession(env, profile, did),
    issueGateSession(env, profile, did),
  ]);
  const payload = { token: communityToken, gate_token: gateToken, profile: publicProfile(profile, true), ...extra };
  const key = entryDecryptKey(env);
  if (key) payload.key = key;
  return json(payload, status);
}`;
  source = replaceRequired(source, oldEntryResponse, newEntryResponse, "entryResponse không bắt buộc khóa giải mã");
  source = source.replaceAll('  if (!entry.existingGate && !entryDecryptKey(env)) return json({ error: "decrypt_key_unavailable" }, 503);\n', "");

  const registerRate = '  if (entry.rateLimited) return json({ error: "rate_limited" }, 429);\n  const created = await createAccount(env, body || {}, entry.did);';
  const registerReady = '  if (entry.rateLimited) return json({ error: "rate_limited" }, 429);\n  if (!sessionSecret(env)) return json({ error: "community_server" }, 503);\n  const created = await createAccount(env, body || {}, entry.did);';
  source = replaceRequired(source, registerRate, registerReady, "kiểm tra SESSION_SECRET trước khi tạo tài khoản");

  const loginRate = '  if (entry.rateLimited) return json({ error: "rate_limited" }, 429);\n  const authenticated = await authenticateAccount(env, body || {}, entry.did);';
  const loginReady = '  if (entry.rateLimited) return json({ error: "rate_limited" }, 429);\n  if (!sessionSecret(env)) return json({ error: "community_server" }, 503);\n  const authenticated = await authenticateAccount(env, body || {}, entry.did);';
  source = replaceRequired(source, loginRate, loginReady, "kiểm tra SESSION_SECRET trước khi đăng nhập");

  const existingRegister = `  if (entry.existingGate) {
    return json({ token: await issueCommunitySession(env, created.profile, entry.did), profile: publicProfile(created.profile, true) }, 201);
  }
`;
  if (!source.includes(existingRegister)) throw new Error("Không tìm thấy nhánh register existingGate cũ");
  source = source.replace(existingRegister, "");

  const existingLogin = `  if (entry.existingGate) {
    return json({ token: await issueCommunitySession(env, authenticated.profile, entry.did), profile: publicProfile(authenticated.profile, true) });
  }
`;
  if (!source.includes(existingLogin)) throw new Error("Không tìm thấy nhánh login existingGate cũ");
  source = source.replace(existingLogin, "");

  const meReadOnly = '  if (request.method === "GET") return json({ profile: publicProfile(auth.profile, true), session_mode: auth.claims.mode || "member" });\n  if (auth.claims.mode === "impersonation") return json({ error: "read_only_impersonation" }, 403);';
  const meDelete = '  if (request.method === "GET") return json({ profile: publicProfile(auth.profile, true), session_mode: auth.claims.mode || "member" });\n  if (request.method === "DELETE") {\n    if (auth.claims.mode === "impersonation") return json({ error: "read_only_impersonation" }, 403);\n    await deleteMemberAccount(env, auth.profile.id);\n    return json({ ok: true, deleted: auth.profile.id });\n  }\n  if (auth.claims.mode === "impersonation") return json({ error: "read_only_impersonation" }, 403);';
  source = replaceRequired(source, meReadOnly, meDelete, "member tự xóa tài khoản đã xác thực");

  source = replaceRequired(
    source,
    '  for (const prefix of ["community-session:", "community-device:", "community-review:", "community-user-conversation:"]) {',
    '  for (const prefix of ["community-session:", "session:", "community-device:", "community-review:", "community-user-conversation:"]) {',
    "thu hồi cả gate session khi xóa member"
  );
  source = replaceRequired(
    source,
    '    if (path === "/api/community/me" && (request.method === "GET" || request.method === "PUT")) return handleMe(request, env);',
    '    if (path === "/api/community/me" && (request.method === "GET" || request.method === "PUT" || request.method === "DELETE")) return handleMe(request, env);',
    "route DELETE /api/community/me"
  );

  source = source.replace("\nexport async function handleCommunity", "\n/* Account V3 plaintext public entry */\n/* Account V3 self delete cleanup */\nexport async function handleCommunity");
  return source;
});

await edit("assets/gate.js", (source) => {
  if (source.includes("/* Account V3 admin navigation */")) return source;
  const start = source.indexOf("  function injectCommunity() {");
  const end = source.indexOf("  function applyMarketBranding() {", start);
  if (start < 0 || end < 0) throw new Error("Không tìm thấy injectCommunity");
  const navigationBlock = `  function marketAdminSession() {
    try { return localStorage.getItem("market_admin_session") === "1" && !storedAccountProfile(); } catch (e) { return false; }
  }

  function injectCommunity() {
    if (APP !== "boitoan") return;
    var nav = document.querySelector("body nav");
    if (!nav) { setTimeout(injectCommunity, 80); return; }
    var link = document.getElementById("gate-community-link");
    if (!link) {
      link = document.createElement("a");
      link.id = "gate-community-link";
      link.className = "gate-community-link";
      link.innerHTML = '<span class="i">✦</span><span class="market-nav-label"></span>';
      nav.appendChild(link);
    }
    var admin = marketAdminSession();
    var targetHref = new URL(admin ? "community-admin.html" : "community.html", location.href).href;
    var targetLabel = admin ? "Quản trị" : "Cộng đồng";
    var targetAria = admin ? "Mở khu vực quản trị Spirituality Market" : "Mở Spirituality Market";
    if (link.href !== targetHref) link.href = targetHref;
    var labelNode = link.querySelector(".market-nav-label");
    if (!labelNode) {
      labelNode = document.createElement("span");
      labelNode.className = "market-nav-label";
      link.appendChild(labelNode);
    }
    // MutationObserver của applyMarketBranding theo dõi childList. Không được gán
    // textContent vô điều kiện vì chính thao tác đó tạo mutation mới và lặp vô hạn trên WebKit.
    if (labelNode.textContent !== targetLabel) labelNode.textContent = targetLabel;
    if (link.getAttribute("aria-label") !== targetAria) link.setAttribute("aria-label", targetAria);
    if (!document.body.classList.contains("market-has-community-nav")) document.body.classList.add("market-has-community-nav");
  }

`;
  source = source.slice(0, start) + navigationBlock + source.slice(end);
  source = replaceRequired(source, '    var chip = document.createElement("div");\n    chip.id = "market-account-identity";', '    var chip = document.createElement(admin ? "a" : "div");\n    if (admin) { chip.href = new URL("community-admin.html", location.href).href; chip.setAttribute("aria-label", "Mở khu vực quản trị"); }\n    chip.id = "market-account-identity";', "badge Admin thành liên kết quản trị");
  source = replaceRequired(source, '    chip.querySelector("small").textContent = primary ? "Admin tổng" : accountRoleLabel(role);', '    chip.querySelector("small").textContent = admin ? ((primary ? "Admin tổng" : "Admin") + " · Mở quản trị") : accountRoleLabel(role);', "nhãn mở quản trị");
  source = replaceRequired(source, '    if (header) header.appendChild(chip); else document.body.appendChild(chip);', '    if (header) header.appendChild(chip); else document.body.appendChild(chip);\n    injectCommunity();', "đồng bộ bottom navigation");
  source = replaceRequired(source, '          localStorage.removeItem("community_token_boitoan");\n        } catch (e) {}\n        return claimPrimaryAdminDevice(pass);', '          localStorage.removeItem("community_token_boitoan");\n        } catch (e) {}\n        injectAccountIdentity("password");\n        injectCommunity();\n        return claimPrimaryAdminDevice(pass);', "hiện lối quản trị ngay sau đăng nhập Admin");
  const startup = "  if (document.readyState === \"loading\") {";
  if (!source.includes(startup)) throw new Error("Không tìm thấy điểm khởi động gate");
  source = source.replace(startup, "  /* Account V3 admin navigation */\n  /* Account V3 iOS mutation guard */\n" + startup);
  return source;
});

await edit("assets/gate.css", (source) => {
  if (source.includes("/* Account V3 admin navigation */")) return source;
  return source + `

/* Account V3 admin navigation */
a.market-account-identity { text-decoration:none; cursor:pointer; -webkit-tap-highlight-color:transparent; }
a.market-account-identity:active { transform:scale(.98); }
`;
});

const backend = await readFile("backend/community.js", "utf8");
const gate = await readFile("assets/gate.js", "utf8");
for (const marker of ["Account V3 plaintext public entry", "Account V3 self delete cleanup", "if (key) payload.key = key", "gate_token: gateToken", 'request.method === "DELETE"', '"session:"']) {
  if (!backend.includes(marker)) throw new Error(`Thiếu marker backend: ${marker}`);
}
for (const marker of ["Account V3 admin navigation", "Account V3 iOS mutation guard", "community-admin.html", "Mở quản trị", "marketAdminSession", "labelNode.textContent !== targetLabel"]) {
  if (!gate.includes(marker)) throw new Error(`Thiếu marker frontend: ${marker}`);
}
if (gate.includes('link.querySelector(".market-nav-label").textContent = admin ?')) throw new Error("injectCommunity vẫn gán textContent vô điều kiện và có thể lặp MutationObserver");
if (backend.includes('if (!entry.existingGate && !entryDecryptKey(env))')) throw new Error("Backend vẫn bắt buộc DECRYPT_KEY cho public entry");
console.log("Account V3 hotfix: Admin có lối quản trị; Reader đa nền tảng; iOS không còn vòng lặp MutationObserver.");
