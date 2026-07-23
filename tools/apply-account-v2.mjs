import { readFile, writeFile } from "node:fs/promises";

async function edit(path, mutate) {
  const before = await readFile(path, "utf8");
  const after = mutate(before);
  if (after !== before) await writeFile(path, after);
}

function replaceRange(source, startMarker, endMarker, replacement, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`Không tìm thấy khối ${label}`);
  return source.slice(0, start) + replacement + source.slice(end);
}

function insertBeforeOnce(source, marker, addition, unique, label) {
  if (source.includes(unique)) return source;
  const index = source.indexOf(marker);
  if (index < 0) throw new Error(`Không tìm thấy điểm nối ${label}`);
  return source.slice(0, index) + addition + source.slice(index);
}

await edit("assets/gate.js", (source) => {
  const finishBlock = `  function finishMemberEntry(data, remember, method) {
    if (!data || !data.gate_token || !data.token) return Promise.reject(Object.assign(new Error("entry_incomplete"), { code: "entry_incomplete" }));
    try {
      localStorage.setItem(TOKEN_KEY, data.gate_token);
      localStorage.setItem("community_token_boitoan", data.token);
      localStorage.setItem("community_profile_boitoan", JSON.stringify(data.profile || {}));
      localStorage.removeItem("market_admin_session");
      localStorage.removeItem("market_admin_primary");
      sessionStorage.setItem(SESSION_KEY, "1");
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, "1");
        if (data.key) localStorage.setItem("gate_key_" + APP, data.key);
      }
    } catch (e) {}
    var payload = document.querySelector('script[type="application/gate-payload"]');
    if (!payload) {
      reveal(method || "member");
      return Promise.resolve();
    }
    if (!data.key) return Promise.reject(Object.assign(new Error("decrypt_key_unavailable"), { code: "decrypt_key_unavailable" }));
    return decryptPayload(data.key).then(function (html) {
      injectHtml(html);
      reveal(method || "member");
    }).catch(function (error) {
      error.code = error.code || "decrypt_failed";
      throw error;
    });
  }

`;
  source = replaceRange(source, "  function finishMemberEntry", "  function buildBoitoanEntryUI", finishBlock, "hoàn tất đăng nhập thành viên");

  const entryBlock = `  function buildBoitoanEntryUI() {
    var root = document.createElement("div");
    root.id = "gate-root";
    root.innerHTML =
      '<div class="gate-card gate-member-card" role="dialog" aria-modal="true" aria-label="Cổng Spirituality Market">' +
        '<div class="gate-entry-brand"><div class="gate-sigil market-gate-sigil" aria-hidden="true"><span></span></div><h1 class="gate-title">Spirituality Market</h1></div>' +
        '<section class="gate-entry-choice" aria-label="Chọn cách truy cập">' +
          '<p class="gate-sub">Chọn một mục để tiếp tục.</p>' +
          '<button type="button" class="gate-entry-option" data-entry-open="login"><strong>Đăng nhập</strong><small>Dành cho Khách hoặc Reader đã có tài khoản.</small><span>›</span></button>' +
          '<button type="button" class="gate-entry-option" data-entry-open="register"><strong>Đăng ký</strong><small>Tạo tài khoản Khách hoặc Reader / Người xem bói.</small><span>›</span></button>' +
          '<button type="button" class="gate-entry-option" data-entry-open="admin"><strong>Admin</strong><small>Mở khu vực quản trị bằng mật khẩu Admin.</small><span>›</span></button>' +
        '</section>' +
        '<section class="gate-entry-stage" data-entry-stage hidden>' +
          '<button type="button" class="gate-entry-back">← Quay lại</button>' +
          '<h2 class="gate-entry-heading"></h2><p class="gate-entry-description"></p>' +
          '<form class="gate-form gate-member-login" autocomplete="on" hidden>' +
            '<label>Tên đăng nhập<input class="gate-input" name="username" required minlength="3" maxlength="30" autocomplete="username"></label>' +
            '<label>Mật khẩu<input class="gate-input" name="password" type="password" required minlength="8" maxlength="128" autocomplete="current-password"></label>' +
            '<label class="gate-remember"><input type="checkbox" name="remember" checked> Ghi nhớ trên thiết bị này</label>' +
            '<button class="gate-btn" type="submit">Vào ứng dụng</button><div class="gate-msg" aria-live="polite"></div>' +
          '</form>' +
          '<form class="gate-form gate-member-register" autocomplete="on" hidden>' +
            '<fieldset class="gate-role-choice"><legend>Chọn loại tài khoản</legend>' +
              '<label class="gate-role-card"><input type="radio" name="role" value="guest" checked><span><strong>Khách</strong><small>Xem bài, tìm Reader, trò chuyện và đánh giá.</small></span></label>' +
              '<label class="gate-role-card"><input type="radio" name="role" value="reader"><span><strong>Reader / Người xem bói</strong><small>Tạo hồ sơ chuyên môn, nhận khách và luận giải.</small></span></label>' +
            '</fieldset>' +
            '<label>Tên hiển thị<input class="gate-input" name="display_name" required maxlength="80" autocomplete="name"></label>' +
            '<label>Tên đăng nhập<input class="gate-input" name="username" required pattern="[a-zA-Z0-9_]{3,30}" maxlength="30" placeholder="Chữ, số hoặc dấu _" autocomplete="username"></label>' +
            '<label>Mật khẩu<input class="gate-input" name="password" type="password" required minlength="8" maxlength="128" placeholder="Tối thiểu 8 ký tự" autocomplete="new-password"></label>' +
            '<label class="gate-remember"><input type="checkbox" name="remember" checked> Ghi nhớ trên thiết bị này</label>' +
            '<p class="gate-privacy">Khi đăng ký, hệ thống gửi Admin tên hiển thị, tên đăng nhập, vai trò và dữ liệu kỹ thuật thiết bị đã nêu. Không gửi mật khẩu.</p>' +
            '<button class="gate-btn" type="submit">Tạo tài khoản và vào app</button><div class="gate-msg" aria-live="polite"></div>' +
          '</form>' +
          '<form class="gate-form gate-admin-login" autocomplete="off" hidden>' +
            '<label>Mật khẩu Admin<input class="gate-input" name="password" type="password" required autocomplete="current-password"></label>' +
            '<label class="gate-remember"><input type="checkbox" name="remember" checked> Ghi nhớ thiết bị Admin</label>' +
            '<button class="gate-btn" type="submit">Đăng nhập Admin</button><div class="gate-msg" aria-live="polite"></div>' +
          '</form>' +
        '</section>' +
        '<div class="gate-foot">Spirituality Market · Truy cập được ghi nhận</div>' +
      '</div>';
    document.body.appendChild(root);

    var choice = root.querySelector(".gate-entry-choice");
    var stage = root.querySelector("[data-entry-stage]");
    var heading = root.querySelector(".gate-entry-heading");
    var description = root.querySelector(".gate-entry-description");
    var forms = {
      login: root.querySelector(".gate-member-login"),
      register: root.querySelector(".gate-member-register"),
      admin: root.querySelector(".gate-admin-login"),
    };
    var copy = {
      login: ["Đăng nhập", "Sử dụng tài khoản Khách hoặc Reader / Người xem bói."],
      register: ["Tạo tài khoản", "Chọn đúng vai trò trước khi hoàn tất đăng ký."],
      admin: ["Admin", "Đăng nhập khu vực quản trị."],
    };
    function openStage(name) {
      choice.hidden = true;
      stage.hidden = false;
      heading.textContent = copy[name][0];
      description.textContent = copy[name][1];
      Object.keys(forms).forEach(function (key) { forms[key].hidden = key !== name; });
      var first = forms[name].querySelector('input:not([type="checkbox"]):not([type="radio"])');
      if (first) setTimeout(function () { first.focus(); }, 20);
    }
    function backToChoice() {
      stage.hidden = true;
      choice.hidden = false;
      Object.keys(forms).forEach(function (key) {
        forms[key].hidden = true;
        var msg = forms[key].querySelector(".gate-msg");
        if (msg) { msg.className = "gate-msg"; msg.textContent = ""; }
      });
    }
    root.querySelectorAll("[data-entry-open]").forEach(function (button) {
      button.addEventListener("click", function () { openStage(button.getAttribute("data-entry-open")); });
    });
    root.querySelector(".gate-entry-back").addEventListener("click", backToChoice);

    function entryRequest(path, payload) {
      return fetch(BACKEND + path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.assign({ entry: true, device_id: deviceId(), device: fingerprint() }, payload)),
      }).then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (data) {
          if (!response.ok) { var error = new Error(data.error || "entry_failed"); error.code = data.error || "entry_failed"; error.detail = data.detail || ""; throw error; }
          return data;
        });
      });
    }

    forms.login.addEventListener("submit", function (event) {
      event.preventDefault();
      var form = forms.login, button = form.querySelector("button[type=submit]"), msg = form.querySelector(".gate-msg");
      button.disabled = true; msg.className = "gate-msg wait"; msg.textContent = "Đang đăng nhập…";
      entryRequest("/api/community/login", { username: form.username.value.trim().toLowerCase(), password: form.password.value })
        .then(function (data) { return finishMemberEntry(data, form.remember.checked, "member-login"); })
        .catch(function (error) { button.disabled = false; msg.className = "gate-msg err"; msg.textContent = memberEntryError(error.code || error.message); });
    });

    forms.register.addEventListener("submit", function (event) {
      event.preventDefault();
      var form = forms.register, button = form.querySelector("button[type=submit]"), msg = form.querySelector(".gate-msg");
      button.disabled = true; msg.className = "gate-msg wait"; msg.textContent = "Đang tạo tài khoản…";
      entryRequest("/api/community/register", {
        role: form.role.value,
        display_name: form.display_name.value.trim(),
        username: form.username.value.trim().toLowerCase(),
        password: form.password.value,
        bio: "",
      }).then(function (data) {
        msg.className = "gate-msg ok";
        msg.textContent = "Đã tạo tài khoản. Đang mở ứng dụng…";
        return finishMemberEntry(data, form.remember.checked, "member-register");
      }).catch(function (error) {
        button.disabled = false; msg.className = "gate-msg err";
        msg.textContent = memberEntryError(error.code || error.message);
        if ((error.code || error.message) === "username_exists") msg.textContent += " Hãy quay lại và chọn Đăng nhập nếu đây là tài khoản vừa tạo trước đó.";
      });
    });

    forms.admin.addEventListener("submit", function (event) {
      event.preventDefault();
      var form = forms.admin, button = form.querySelector("button[type=submit]"), msg = form.querySelector(".gate-msg"), pass = form.password.value;
      button.disabled = true; msg.className = "gate-msg wait"; msg.textContent = "Đang kiểm tra Admin…";
      unlockLocalOrEncrypted(pass, form.remember.checked).then(function () {
        try {
          localStorage.setItem("market_admin_session", "1");
          localStorage.removeItem("community_profile_boitoan");
          localStorage.removeItem("community_token_boitoan");
        } catch (e) {}
        return claimPrimaryAdminDevice(pass);
      }).catch(function () {
        button.disabled = false; msg.className = "gate-msg err"; msg.textContent = "Mật khẩu Admin không đúng.";
      });
    });
  }

`;
  source = replaceRange(source, "  function buildBoitoanEntryUI", "  /* -------------------------- giao diện khóa -------------------------- */", entryBlock, "onboarding hai màn hình");

  const identityBlock = `  function storedAccountProfile() {
    try { return JSON.parse(localStorage.getItem("community_profile_boitoan") || "null"); } catch (e) { return null; }
  }
  function accountRoleLabel(role) {
    if (role === "reader") return "Reader / Người xem bói";
    if (role === "guest") return "Khách";
    return "Admin";
  }
  function injectAccountIdentity(method) {
    if (APP !== "boitoan") return;
    var old = document.getElementById("market-account-identity");
    if (old) old.remove();
    var profile = storedAccountProfile();
    var admin = !profile && (method === "password" || method === "saved-key" || method === "remembered" || localStorage.getItem("market_admin_session") === "1");
    var role = admin ? "admin" : profile && profile.role;
    if (!role) return;
    var display = admin ? "Admin" : (profile.display_name || profile.username || "Thành viên");
    var primary = false;
    try { primary = admin && localStorage.getItem("market_admin_primary") === "1"; } catch (e) {}
    var chip = document.createElement("div");
    chip.id = "market-account-identity";
    chip.className = "market-account-identity role-" + role;
    chip.innerHTML = '<span class="market-account-avatar"></span><span class="market-account-copy"><strong></strong><small></small></span>';
    chip.querySelector(".market-account-avatar").textContent = display.trim().slice(0, 1).toUpperCase() || "✦";
    chip.querySelector("strong").textContent = display;
    chip.querySelector("small").textContent = primary ? "Admin tổng" : accountRoleLabel(role);
    var header = document.querySelector("#gate-content .wrap > header, body > .wrap > header");
    if (header) header.appendChild(chip); else document.body.appendChild(chip);
  }
  function claimPrimaryAdminDevice(password) {
    if (!BACKEND || !password) return Promise.resolve(false);
    return fetch(BACKEND + "/api/community/admin/bind-owner-device", {
      method: "POST",
      headers: { "content-type": "application/json", "authorization": "Bearer " + password, "x-owner-device-id": deviceId() },
      body: JSON.stringify({ device_id: deviceId(), replace: true }),
    }).then(function (response) {
      if (!response.ok) return false;
      try { localStorage.setItem("market_admin_primary", "1"); } catch (e) {}
      injectAccountIdentity("password");
      return true;
    }).catch(function () { return false; });
  }

`;
  source = insertBeforeOnce(source, "  function reveal(method) {", identityBlock, "function claimPrimaryAdminDevice", "nhận diện vai trò trong app");
  if (!source.includes("    injectAccountIdentity(method || \"session\");")) {
    source = source.replace("    applyMarketBranding();\n    trackAccess", "    applyMarketBranding();\n    injectAccountIdentity(method || \"session\");\n    trackAccess");
  }
  source = source.replace(
    '        if (APP === "boitoan") {\n          localStorage.removeItem(TOKEN_KEY);\n          localStorage.removeItem("community_token_boitoan");\n        }',
    '        if (APP === "boitoan") {\n          localStorage.removeItem(TOKEN_KEY);\n          localStorage.removeItem("community_token_boitoan");\n          localStorage.removeItem("community_profile_boitoan");\n          localStorage.removeItem("market_admin_session");\n          localStorage.removeItem("market_admin_primary");\n        }'
  );
  return source;
});

await edit("assets/gate.css", (source) => {
  if (source.includes("/* Account V2: staged onboarding */")) return source;
  return source + `

/* Account V2: staged onboarding */
.gate-member-card { width:min(92vw,430px); max-height:calc(100dvh - 28px); overflow:auto; padding:24px 20px 20px; }
.gate-entry-brand { display:grid; justify-items:center; gap:3px; margin-bottom:14px; }
.gate-entry-choice { display:grid; gap:11px; }
.gate-entry-choice[hidden], .gate-entry-stage[hidden], .gate-member-card form[hidden] { display:none !important; }
.gate-entry-option { position:relative; display:grid; gap:4px; width:100%; min-height:76px; padding:14px 42px 14px 15px; border:1px solid #493865; border-radius:14px; background:linear-gradient(150deg,#211831,#151020); color:#f3eef8; text-align:left; cursor:pointer; }
.gate-entry-option strong { color:#f5dfa1; font-size:1rem; }
.gate-entry-option small { color:#b9adc9; font-size:.78rem; line-height:1.4; }
.gate-entry-option > span { position:absolute; right:16px; top:50%; transform:translateY(-50%); color:#d8b45c; font-size:1.8rem; }
.gate-entry-stage { display:grid; gap:8px; text-align:left; }
.gate-entry-back { justify-self:start; border:0; background:none; color:#d8b45c; padding:4px 0 8px; font-weight:750; cursor:pointer; }
.gate-entry-heading { margin:0; color:#f5dfa1; font:600 1.25rem/1.2 ui-serif,Georgia,serif; text-align:center; }
.gate-entry-description { margin:0 0 10px; color:#b9adc9; font-size:.82rem; text-align:center; }
.gate-member-card .gate-form > label:not(.gate-remember) { display:grid; gap:6px; margin:0; color:#d8cde6; font-size:.78rem; font-weight:700; text-align:left; }
.gate-member-card input[type="checkbox"], .gate-member-card input[type="radio"] { width:auto !important; min-width:18px; height:18px; padding:0 !important; margin:0; -webkit-appearance:auto !important; appearance:auto !important; accent-color:#d8b45c; }
.gate-member-card .gate-remember { display:flex; align-items:center; justify-content:flex-start; gap:9px; margin:2px 0; }
.gate-member-card .gate-role-card { display:grid; grid-template-columns:22px minmax(0,1fr); align-items:start; }
.market-account-identity { display:inline-grid; grid-template-columns:34px minmax(0,auto); align-items:center; gap:9px; margin:11px auto 0; padding:7px 11px 7px 7px; border:1px solid #d8b45c66; border-radius:999px; background:#171124dd; text-align:left; }
.market-account-avatar { display:grid; place-items:center; width:34px; height:34px; border-radius:50%; background:linear-gradient(145deg,#8b6fd0,#4d357f); color:#fff; font-weight:850; }
.market-account-copy { display:grid; line-height:1.15; }
.market-account-copy strong { color:#f3eef8; font:750 .82rem/1.2 ui-sans-serif,-apple-system,sans-serif; }
.market-account-copy small { color:#f0cf72; font:700 .67rem/1.2 ui-sans-serif,-apple-system,sans-serif; }
.market-account-identity.role-admin { border-color:#f0cf72; box-shadow:0 0 0 3px #d8b45c18; }
@media (max-width:380px) { .gate-member-card{padding:20px 15px 16px}.gate-entry-option{min-height:70px}.gate-entry-option strong{font-size:.94rem} }
`;
});

await edit("backend/community.js", (source) => {
  source = source.replace(
    "async function issueCommunitySession(env, profile, did) {\n  const sid = crypto.randomUUID();\n  const expiresAt = Date.now() + COMMUNITY_SESSION_TTL * 1000;\n  await putJson(env, sessionKey(sid), { active: true, uid: profile.id, did, expires_at: expiresAt }, COMMUNITY_SESSION_TTL);\n  return makeJwt(sessionSecret(env), { aud: \"community\", sid, uid: profile.id, did, role: profile.role });\n}",
    "async function issueCommunitySession(env, profile, did, options = {}) {\n  const sid = crypto.randomUUID();\n  const expiresAt = Date.now() + COMMUNITY_SESSION_TTL * 1000;\n  const mode = options.mode === \"impersonation\" ? \"impersonation\" : \"member\";\n  await putJson(env, sessionKey(sid), { active: true, uid: profile.id, did, mode, expires_at: expiresAt }, COMMUNITY_SESSION_TTL);\n  return makeJwt(sessionSecret(env), { aud: \"community\", sid, uid: profile.id, did, role: profile.role, mode });\n}"
  );
  source = source.replace(
    "  if (request.method === \"GET\") return json({ profile: publicProfile(auth.profile, true) });\n  const body = await readJson(request);",
    "  if (request.method === \"GET\") return json({ profile: publicProfile(auth.profile, true), session_mode: auth.claims.mode || \"member\" });\n  if (auth.claims.mode === \"impersonation\") return json({ error: \"read_only_impersonation\" }, 403);\n  const body = await readJson(request);"
  );
  source = source.replace(
    "  if (request.method === \"POST\") {\n    const auth = viewer;\n    if (auth.profile.role !== \"guest\")",
    "  if (request.method === \"POST\") {\n    const auth = viewer;\n    if (auth.claims.mode === \"impersonation\") return json({ error: \"read_only_impersonation\" }, 403);\n    if (auth.profile.role !== \"guest\")"
  );
  source = source.replace(
    "  if (request.method === \"DELETE\") {\n    const auth = viewer;",
    "  if (request.method === \"DELETE\") {\n    const auth = viewer;\n    if (auth.claims.mode === \"impersonation\") return json({ error: \"read_only_impersonation\" }, 403);"
  );
  source = source.replace(
    "async function handleConversations(request, env, path) {\n  const auth = await communityAuth(request, env);\n  if (!auth) return json({ error: \"unauthorized\" }, 401);",
    "async function handleConversations(request, env, path) {\n  const auth = await communityAuth(request, env);\n  if (!auth) return json({ error: \"unauthorized\" }, 401);\n  if (auth.claims.mode === \"impersonation\" && request.method !== \"GET\") return json({ error: \"read_only_impersonation\" }, 403);"
  );

  const helpers = `function postKey(id) { return \`community-post:\${id}\`; }
function postCommentPrefix(id) { return \`community-post-comment:\${id}:\`; }
function postCommentKey(id, at, cid) { return \`\${postCommentPrefix(id)}\${String(at).padStart(13, "0")}:\${cid}\`; }
function auditKey(at, id) { return \`community-audit:\${String(at).padStart(13, "0")}:\${id}\`; }
async function adminAudit(env, request, action, target, extra = {}) {
  const at = Date.now();
  await putJson(env, auditKey(at, crypto.randomUUID()), {
    action, target: clean(target, 120), device_id: clean(request.headers.get("x-owner-device-id"), 80), created_at: at, ...extra,
  }, ACCOUNT_TTL);
}
async function deleteMemberAccount(env, uid) {
  const profile = isUuid(uid) && await getJson(env, profileKey(uid));
  if (!profile) return null;
  const deletions = [
    env.KV.delete(loginKey(profile.username)), env.KV.delete(profileKey(uid)), env.KV.delete(readerIndexKey(uid)),
  ];
  for (const prefix of ["community-session:", "community-device:", "community-review:", "community-user-conversation:"]) {
    const page = await env.KV.list({ prefix, limit: 1000 });
    for (const key of page.keys) {
      const value = await getJson(env, key.name);
      if ((value && (value.uid === uid || value.author_id === uid || value.reader_id === uid)) || key.name.startsWith(\`community-user-conversation:\${uid}:\`)) deletions.push(env.KV.delete(key.name));
    }
  }
  await Promise.all(deletions);
  return profile;
}
async function handlePosts(request, env, path) {
  const auth = await communityAuth(request, env);
  if (!auth) return json({ error: "unauthorized" }, 401);
  const parts = path.split("/").filter(Boolean);
  const postId = parts[3] || "";
  const action = parts[4] || "";
  if (!postId && request.method === "GET") {
    const posts = (await listByPrefix(env, "community-post:", 100)).sort((a, b) => b.created_at - a.created_at);
    return json({ posts });
  }
  if (!isUuid(postId)) return json({ error: "invalid_post" }, 400);
  const post = await getJson(env, postKey(postId));
  if (!post) return json({ error: "not_found" }, 404);
  if (!action && request.method === "GET") {
    const comments = (await listByPrefix(env, postCommentPrefix(postId), 200)).sort((a, b) => a.created_at - b.created_at);
    return json({ post, comments, session_mode: auth.claims.mode || "member" });
  }
  if (action === "comments" && request.method === "POST") {
    if (auth.claims.mode === "impersonation") return json({ error: "read_only_impersonation" }, 403);
    if (post.closed) return json({ error: "post_closed" }, 409);
    const body = await readJson(request);
    const text = clean(body && body.text, 2000);
    if (!text) return json({ error: "invalid_comment" }, 400);
    const now = Date.now(), id = crypto.randomUUID();
    const comment = { id, post_id: postId, author_id: auth.profile.id, author_name: auth.profile.display_name, author_role: auth.profile.role, text, created_at: now };
    await putJson(env, postCommentKey(postId, now, id), comment, ACCOUNT_TTL);
    post.comment_count = Number(post.comment_count || 0) + 1; post.updated_at = now;
    await putJson(env, postKey(postId), post, ACCOUNT_TTL);
    return json({ comment }, 201);
  }
  return json({ error: "not_found" }, 404);
}

`;
  source = insertBeforeOnce(source, "function adminTokenOk(request, env)", helpers, "async function handlePosts", "bài thảo luận và audit Admin");

  const adminBlock = `async function handleAdmin(request, env, path) {
  if (!adminTokenOk(request, env)) return json({ error: "unauthorized" }, 401);
  const parts = path.split("/").filter(Boolean);
  const action = parts[3] || "";
  if (action === "bind-owner-device" && request.method === "POST") {
    const body = await readJson(request);
    const deviceId = clean(body && body.device_id, 80);
    if (!isUuid(deviceId)) return json({ error: "invalid_device" }, 400);
    const old = await env.KV.get("community-owner-device");
    if (old && !secureEqual(old, deviceId) && body.replace !== true) return json({ error: "owner_device_already_bound" }, 409);
    await env.KV.put("community-owner-device", deviceId);
    await adminAudit(env, request, old && !secureEqual(old, deviceId) ? "owner_device_replaced" : "owner_device_bound", deviceId);
    return json({ ok: true, device_id: deviceId, replaced: !!old && !secureEqual(old, deviceId) });
  }
  if (action === "users" && request.method === "GET") {
    const users = await listByPrefix(env, "community-profile:", 100);
    return json({ users: users.map((p) => ({ ...publicProfile(p, true), suspended: !!p.suspended })) });
  }
  if (action === "users" && parts[4]) {
    const uid = parts[4];
    const profile = isUuid(uid) && await getJson(env, profileKey(uid));
    if (!profile) return json({ error: "not_found" }, 404);
    if (parts[5] === "impersonate" && request.method === "POST") {
      if (!(await ownerDeviceOk(request, env))) return json({ error: "owner_device_required" }, 403);
      const did = clean(request.headers.get("x-owner-device-id"), 80);
      const token = await issueCommunitySession(env, profile, did, { mode: "impersonation" });
      await adminAudit(env, request, "member_view", uid, { role: profile.role });
      return json({ token, profile: publicProfile(profile, true), view_only: true });
    }
    if (request.method === "PATCH") {
      const body = await readJson(request);
      if (typeof body.suspended === "boolean") profile.suspended = body.suspended;
      profile.updated_at = Date.now();
      await putJson(env, profileKey(uid), profile);
      await adminAudit(env, request, profile.suspended ? "member_suspended" : "member_restored", uid);
      return json({ profile: publicProfile(profile, true), suspended: profile.suspended });
    }
    if (request.method === "DELETE") {
      await deleteMemberAccount(env, uid);
      await adminAudit(env, request, "member_deleted", uid, { username: profile.username, role: profile.role });
      return json({ ok: true });
    }
  }
  if (action === "reviews" && request.method === "GET") return json({ reviews: await listByPrefix(env, "community-review:", 100) });
  if (action === "reviews" && parts[4] && parts[5] && request.method === "DELETE") {
    const readerId = parts[4], authorId = parts[5];
    if (!isUuid(readerId) || !isUuid(authorId)) return json({ error: "invalid_review" }, 400);
    await env.KV.delete(reviewKey(readerId, authorId));
    await recalculateRating(env, readerId);
    await adminAudit(env, request, "review_deleted", `${readerId}:${authorId}`);
    return json({ ok: true });
  }
  if (action === "posts") {
    const postId = parts[4] || "";
    if (!postId && request.method === "GET") return json({ posts: (await listByPrefix(env, "community-post:", 100)).sort((a, b) => b.created_at - a.created_at) });
    if (!postId && request.method === "POST") {
      const body = await readJson(request);
      const title = clean(body && body.title, 160), text = clean(body && body.text, 5000);
      if (!title || !text) return json({ error: "invalid_post" }, 400);
      const id = crypto.randomUUID(), now = Date.now();
      const post = { id, title, text, closed: false, comment_count: 0, created_at: now, updated_at: now };
      await putJson(env, postKey(id), post, ACCOUNT_TTL);
      await adminAudit(env, request, "post_created", id);
      return json({ post }, 201);
    }
    const post = isUuid(postId) && await getJson(env, postKey(postId));
    if (!post) return json({ error: "not_found" }, 404);
    if (request.method === "PATCH") {
      const body = await readJson(request);
      if (typeof body.closed === "boolean") post.closed = body.closed;
      post.updated_at = Date.now();
      await putJson(env, postKey(postId), post, ACCOUNT_TTL);
      await adminAudit(env, request, post.closed ? "post_closed" : "post_reopened", postId);
      return json({ post });
    }
    if (request.method === "DELETE") {
      const page = await env.KV.list({ prefix: postCommentPrefix(postId), limit: 1000 });
      await Promise.all([env.KV.delete(postKey(postId)), ...page.keys.map((key) => env.KV.delete(key.name))]);
      await adminAudit(env, request, "post_deleted", postId);
      return json({ ok: true });
    }
  }
  if (action === "conversations") {
    if (!(await ownerDeviceOk(request, env))) return json({ error: "owner_device_required" }, 403);
    const cid = parts[4] || "";
    if (!cid && request.method === "GET") return json({ conversations: await listByPrefix(env, "community-conversation:", 100) });
    if (cid && parts[5] === "messages" && request.method === "GET") return json({ messages: (await listByPrefix(env, messagePrefix(cid), 100)).sort((a, b) => a.created_at - b.created_at) });
  }
  return json({ error: "not_found" }, 404);
}
`;
  source = replaceRange(source, "async function handleAdmin(request, env, path) {", "export async function handleCommunity", adminBlock + "\n", "quyền Admin mở rộng");
  if (!source.includes('if (path === "/api/community/posts" || path.startsWith("/api/community/posts/"))')) {
    source = source.replace(
      '    if (path === "/api/community/conversations" || path.startsWith("/api/community/conversations/")) return handleConversations(request, env, path);',
      '    if (path === "/api/community/conversations" || path.startsWith("/api/community/conversations/")) return handleConversations(request, env, path);\n    if (path === "/api/community/posts" || path.startsWith("/api/community/posts/")) return handlePosts(request, env, path);'
    );
  }
  return source;
});

await edit("assets/community.js", (source) => {
  if (!source.includes("function saveProfile(profile)")) {
    source = source.replace(
      '  function setStorage(key, value) { try { if (value) localStorage.setItem(key, value); else localStorage.removeItem(key); } catch (_) {} }',
      '  function setStorage(key, value) { try { if (value) localStorage.setItem(key, value); else localStorage.removeItem(key); } catch (_) {} }\n  function saveProfile(profile) { state.profile = profile || null; setStorage("community_profile_boitoan", profile ? JSON.stringify(profile) : ""); return state.profile; }\n  function roleLabel(role) { return role === "reader" ? "Reader / Người xem bói" : role === "guest" ? "Khách" : "Admin"; }\n  function tokenClaims() { try { var token=getStorage(COMMUNITY_TOKEN_KEY), part=token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/"); return JSON.parse(atob(part+"=".repeat((4-part.length%4)%4))); } catch (_) { return {}; } }'
    );
  }
  source = source.replaceAll("state.profile = data.profile", "saveProfile(data.profile)");
  source = source.replace('setStorage(COMMUNITY_TOKEN_KEY, ""); state.profile = null; renderAuth();', 'setStorage(COMMUNITY_TOKEN_KEY, ""); saveProfile(null); renderAuth();');

  const tabsBlock = `  function topTabs(active) {
    var nav = el("nav", null, "community-tabs");
    var entries = [["posts", "Thảo luận", renderPosts]];
    if (state.profile.role === "guest") entries.push(["readers", "Reader", renderReaders]);
    entries.push(["conversations", state.profile.role === "reader" ? "Khách hàng" : "Trò chuyện", renderConversations]);
    entries.push(["profile", "Trang cá nhân", renderProfile]);
    entries.forEach(function (item) {
      var tab = button(item[1], item[0] === active ? "active" : "", item[2]);
      tab.className = item[0] === active ? "active" : "";
      nav.appendChild(tab);
    });
    return nav;
  }

`;
  source = replaceRange(source, "  function topTabs(active) {", "  function dashboardHeader() {", tabsBlock, "tab theo vai trò");

  const headerBlock = `  function dashboardHeader() {
    var wrap = el("div", null, "community-dashboard-head");
    var identity = el("div", null, "community-account-identity");
    var avatar = el("span", (state.profile.display_name || state.profile.username || "?").trim().slice(0, 1).toUpperCase(), "community-avatar");
    var text = el("div");
    var titleLine = el("div", null, "community-name-line");
    titleLine.append(el("h1", "Xin chào, " + state.profile.display_name), el("span", roleLabel(state.profile.role), "community-role-badge role-" + state.profile.role));
    text.append(titleLine, el("p", state.profile.role === "reader" ? "Quản lý hồ sơ, khách hàng và nội dung luận giải." : "Tìm Reader, trò chuyện, đánh giá và tham gia thảo luận."));
    identity.append(avatar, text);
    var logout = button("Đăng xuất", "community-secondary", function () { setStorage(COMMUNITY_TOKEN_KEY, ""); saveProfile(null); renderAuth(); });
    wrap.append(identity, logout);
    return wrap;
  }

`;
  source = replaceRange(source, "  function dashboardHeader() {", "  function loadDashboard() {", headerBlock, "định danh vai trò");

  const loadBlock = `  function loadDashboard() {
    ACCOUNT_BUTTON.hidden = false;
    ACCOUNT_BUTTON.onclick = renderProfile;
    return Promise.all([api("/api/community/posts"), api("/api/community/conversations"), state.profile.role === "guest" ? api("/api/community/readers") : Promise.resolve({ readers: [] })]).then(function (results) {
      state.posts = results[0].posts || [];
      state.conversations = results[1].conversations || [];
      state.readers = results[2].readers || [];
      if (state.profile.role === "reader") renderConversations(); else renderReaders();
    }).catch(function (error) {
      if (error.status === 401) { setStorage(COMMUNITY_TOKEN_KEY, ""); saveProfile(null); renderAuth(); return; }
      APP.replaceChildren(el("section", humanError(error), "community-card community-state error"));
    });
  }

  function renderPosts() {
    clearPoll();
    var card = el("section", null, "community-card");
    card.append(dashboardHeader(), topTabs("posts"), el("h2", "Thảo luận chung"));
    var list = el("div", null, "community-post-list");
    if (!state.posts || !state.posts.length) list.append(el("p", "Admin chưa mở bài thảo luận nào.", "community-empty"));
    (state.posts || []).forEach(function (post) {
      var item = button(post.title, "community-post-card", function () { openPost(post.id); });
      item.append(el("p", post.text.length > 220 ? post.text.slice(0, 217) + "…" : post.text), el("small", (post.closed ? "Đã đóng · " : "") + Number(post.comment_count || 0) + " bình luận · " + formatDate(post.updated_at || post.created_at)));
      list.append(item);
    });
    card.append(list); APP.replaceChildren(card);
  }

  function openPost(id) {
    clearPoll(); APP.replaceChildren(el("section", "Đang tải bài thảo luận…", "community-card"));
    api("/api/community/posts/" + encodeURIComponent(id)).then(function (data) {
      var card = el("section", null, "community-card");
      card.append(button("← Thảo luận", "community-secondary", renderPosts), dashboardHeader(), topTabs("posts"));
      card.append(el("h2", data.post.title), el("p", data.post.text, "community-post-body"));
      var comments = el("div", null, "community-comment-list");
      (data.comments || []).forEach(function (comment) {
        var row = el("article", null, "community-comment");
        var head = el("div", null, "community-comment-head");
        head.append(el("strong", comment.author_name), el("span", roleLabel(comment.author_role), "community-role-badge role-" + comment.author_role));
        row.append(head, el("p", comment.text), el("small", formatDate(comment.created_at))); comments.append(row);
      });
      if (!(data.comments || []).length) comments.append(el("p", "Chưa có bình luận.", "community-empty"));
      card.append(comments);
      if (!data.post.closed && tokenClaims().mode !== "impersonation") {
        var form = el("form", null, "community-form community-comment-form");
        form.innerHTML = '<label>Tham gia thảo luận<textarea name="text" rows="4" maxlength="2000" required></textarea></label><button class="community-primary" type="submit">Đăng bình luận</button><p class="community-state" role="status"></p>';
        form.addEventListener("submit", function (event) {
          event.preventDefault(); var submit=form.querySelector("button"), status=form.querySelector(".community-state"); submit.disabled=true; setMessage(status,"Đang đăng…");
          api("/api/community/posts/" + encodeURIComponent(id) + "/comments", jsonOptions("POST", { text: form.text.value.trim() })).then(function () { return api("/api/community/posts"); }).then(function (posts) { state.posts=posts.posts||[]; openPost(id); }).catch(function (error) { submit.disabled=false; setMessage(status,humanError(error),true); });
        });
        card.append(form);
      } else if (data.post.closed) card.append(el("p", "Bài thảo luận đã được Admin đóng.", "community-state"));
      APP.replaceChildren(card);
    }).catch(function (error) { APP.replaceChildren(el("section", humanError(error), "community-card community-state error")); });
  }

`;
  source = replaceRange(source, "  function loadDashboard() {", "  function readerCard(reader) {", loadBlock, "dashboard theo vai trò và thảo luận");
  source = source.replace(
    '    card.append(el("h3", reader.display_name));',
    '    var readerTitle = el("div", null, "community-name-line"); readerTitle.append(el("h3", reader.display_name), el("span", "Reader", "community-role-badge role-reader")); card.append(readerTitle);'
  );
  source = source.replace(
    '    var communityToken = getStorage(COMMUNITY_TOKEN_KEY);',
    '    var communityToken = getStorage(COMMUNITY_TOKEN_KEY);\n    if (!state.posts) state.posts = [];'
  );
  return source;
});

await edit("assets/community-admin.js", () => `(function () {
  "use strict";
  var BACKEND=String(window.COMMUNITY_BACKEND||"").replace(/\\/+$/,"");
  var form=document.getElementById("community-admin-login"), tokenInput=document.getElementById("community-admin-token"), status=document.getElementById("community-admin-state"), content=document.getElementById("community-admin-content"), bindButton=document.getElementById("community-bind-owner");
  var deviceId=""; try{deviceId=localStorage.getItem("gate_device_id")||""}catch(_){}
  document.getElementById("community-owner-device-id").textContent=deviceId||"Thiết bị này chưa có mã cổng Bói toán.";
  var currentTab="users";
  function el(tag,text,cls){var n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n}
  function button(text,cls,handler){var n=el("button",text,cls);n.type="button";n.addEventListener("click",handler);return n}
  function setStatus(text,error){status.textContent=text||"";status.classList.toggle("error",!!error)}
  function headers(extra){return Object.assign({authorization:"Bearer "+tokenInput.value,"x-owner-device-id":deviceId},extra||{})}
  function api(path,options){options=options||{};options.headers=headers(options.headers);return fetch(BACKEND+path,options).then(function(r){return r.json().catch(function(){return{}}).then(function(d){if(!r.ok){var e=new Error(d.error||"HTTP "+r.status);e.status=r.status;throw e}return d})})}
  function jsonOptions(method,body){return{method:method,headers:{"content-type":"application/json"},body:JSON.stringify(body||{})}}
  function formatDate(v){return v?new Date(v).toLocaleString("vi-VN"):""}
  function table(heads){var w=el("div",null,"community-table-wrap"),t=el("table",null,"community-table"),r=el("tr");heads.forEach(function(h){r.append(el("th",h))});t.append(r);w.append(t);return{wrap:w,table:t}}
  function cell(r,v){var n=el("td",v);r.append(n);return n}
  function errorText(e){if(e.message==="owner_device_required")return"Chỉ thiết bị Admin tổng được sử dụng chức năng này.";if(e.status===401)return"Mật khẩu Admin không đúng.";return"Không thực hiện được: "+e.message}
  function confirmAction(text,work){if(confirm(text))work()}
  function loadUsers(){currentTab="users";setStatus("Đang tải tài khoản…");api("/api/community/admin/users").then(function(data){var t=table(["Tài khoản","Vai trò","Hồ sơ","Trạng thái","Thao tác"]);(data.users||[]).forEach(function(user){var r=el("tr");cell(r,user.username+"\n"+user.display_name);cell(r,user.role==="reader"?"Reader / Người xem bói":"Khách");cell(r,user.bio||"");cell(r,user.suspended?"Đã khóa":"Hoạt động");var a=cell(r,"");a.className="community-admin-actions";a.append(button(user.suspended?"Mở khóa":"Khóa",user.suspended?"community-secondary":"community-danger",function(){api("/api/community/admin/users/"+user.id,jsonOptions("PATCH",{suspended:!user.suspended})).then(loadUsers)}));a.append(button("Xem giao diện","community-secondary",function(){api("/api/community/admin/users/"+user.id+"/impersonate",{method:"POST"}).then(function(result){localStorage.setItem("community_token_boitoan",result.token);localStorage.setItem("community_profile_boitoan",JSON.stringify(result.profile));location.assign("./community.html?admin_view=1")}).catch(function(e){setStatus(errorText(e),true)})}));a.append(button("Xóa tài khoản","community-danger",function(){confirmAction("Xóa tài khoản "+user.username+"? Thao tác này không thể hoàn tác.",function(){api("/api/community/admin/users/"+user.id,{method:"DELETE"}).then(loadUsers)})}));t.table.append(r)});content.replaceChildren(el("h2","Tài khoản member"),t.wrap);setStatus("Đã tải "+(data.users||[]).length+" tài khoản.")}).catch(function(e){setStatus(errorText(e),true)})}
  function loadReviews(){currentTab="reviews";setStatus("Đang tải đánh giá…");api("/api/community/admin/reviews").then(function(data){var t=table(["Reader","Khách","Sao","Nội dung","Lúc",""]);(data.reviews||[]).sort(function(a,b){return b.updated_at-a.updated_at}).forEach(function(review){var r=el("tr");cell(r,review.reader_id);cell(r,review.author_name||review.author_id);cell(r,review.rating);cell(r,review.text);cell(r,formatDate(review.updated_at));cell(r,"").append(button("Xóa review","community-danger",function(){confirmAction("Xóa review này?",function(){api("/api/community/admin/reviews/"+review.reader_id+"/"+review.author_id,{method:"DELETE"}).then(loadReviews)})}));t.table.append(r)});content.replaceChildren(el("h2","Đánh giá công khai"),t.wrap);setStatus("Đã tải "+(data.reviews||[]).length+" đánh giá.")}).catch(function(e){setStatus(errorText(e),true)})}
  function loadPosts(){currentTab="posts";setStatus("Đang tải bài thảo luận…");api("/api/community/admin/posts").then(function(data){var box=el("div",null,"community-admin-posts"),create=el("form",null,"community-form");create.innerHTML='<label>Tiêu đề<input name="title" maxlength="160" required></label><label>Nội dung mở thảo luận<textarea name="text" rows="5" maxlength="5000" required></textarea></label><button class="community-primary" type="submit">Mở bài thảo luận</button><p class="community-state"></p>';create.addEventListener("submit",function(event){event.preventDefault();var s=create.querySelector("button"),m=create.querySelector(".community-state");s.disabled=true;m.textContent="Đang đăng…";api("/api/community/admin/posts",jsonOptions("POST",{title:create.title.value.trim(),text:create.text.value.trim()})).then(loadPosts).catch(function(e){s.disabled=false;m.textContent=errorText(e);m.classList.add("error")})});box.append(create);(data.posts||[]).forEach(function(post){var item=el("article",null,"community-admin-post");item.append(el("h3",post.title),el("p",post.text),el("small",(post.closed?"Đã đóng · ":"")+Number(post.comment_count||0)+" bình luận · "+formatDate(post.updated_at)));var actions=el("div",null,"community-admin-actions");actions.append(button(post.closed?"Mở lại":"Đóng bài","community-secondary",function(){api("/api/community/admin/posts/"+post.id,jsonOptions("PATCH",{closed:!post.closed})).then(loadPosts)}),button("Xóa bài","community-danger",function(){confirmAction("Xóa bài thảo luận này?",function(){api("/api/community/admin/posts/"+post.id,{method:"DELETE"}).then(loadPosts)})}));item.append(actions);box.append(item)});content.replaceChildren(el("h2","Bài thảo luận chung"),box);setStatus("Đã tải bài thảo luận.")}).catch(function(e){setStatus(errorText(e),true)})}
  function loadConversations(){currentTab="conversations";setStatus("Đang kiểm tra thiết bị Admin tổng…");api("/api/community/admin/conversations").then(function(data){var list=el("div",null,"community-conversation-list");(data.conversations||[]).sort(function(a,b){return b.updated_at-a.updated_at}).forEach(function(c){var item=button(c.guest_name+" ↔ "+c.reader_name,"community-conversation-item",function(){loadMessages(c)});item.append(el("small",formatDate(c.updated_at)));list.append(item)});if(!(data.conversations||[]).length)list.append(el("p","Chưa có hội thoại.","community-empty"));content.replaceChildren(el("h2","Hội thoại riêng"),list);setStatus("Đã tải hội thoại.")}).catch(function(e){content.replaceChildren(el("h2","Hội thoại riêng"),el("p",errorText(e),"community-state error"));setStatus(errorText(e),true)})}
  function loadMessages(c){setStatus("Đang tải nội dung hội thoại…");api("/api/community/admin/conversations/"+c.id+"/messages").then(function(data){var back=button("← Danh sách hội thoại","community-secondary",loadConversations),list=el("div",null,"community-chat-messages");(data.messages||[]).forEach(function(m){var item=el("article",null,"community-message"+(m.type==="reading"?" reading":""));item.append(el("strong",m.sender_name+" · "+m.sender_role),el("span",m.text),el("small",formatDate(m.created_at)));list.append(item)});content.replaceChildren(back,el("h2",c.guest_name+" ↔ "+c.reader_name),list);setStatus("Đã tải "+(data.messages||[]).length+" tin nhắn.")}).catch(function(e){setStatus(errorText(e),true)})}
  function activateTab(tab){document.querySelectorAll("[data-admin-tab]").forEach(function(n){n.classList.toggle("active",n.dataset.adminTab===tab)});if(tab==="users")loadUsers();else if(tab==="reviews")loadReviews();else if(tab==="posts")loadPosts();else loadConversations()}
  form.addEventListener("submit",function(event){event.preventDefault();activateTab(currentTab)});document.querySelectorAll("[data-admin-tab]").forEach(function(n){n.addEventListener("click",function(){activateTab(n.dataset.adminTab)})});
  bindButton.addEventListener("click",function(){if(!deviceId){setStatus("Thiết bị này chưa có mã cổng Bói toán.",true);return}api("/api/community/admin/bind-owner-device",jsonOptions("POST",{device_id:deviceId,replace:true})).then(function(){localStorage.setItem("market_admin_primary","1");setStatus("Đã đặt thiết bị này làm Admin tổng.")}).catch(function(e){setStatus(errorText(e),true)})});
}());
`);

await edit("boitoan/community-admin.html", (source) => {
  source = source.replace("<strong>Thiết bị Admin</strong>", "<strong>Thiết bị Admin tổng</strong>");
  source = source.replace("Khóa thiết bị Admin này", "Đặt thiết bị này làm Admin tổng");
  if (!source.includes('data-admin-tab="posts"')) source = source.replace('<button type="button" data-admin-tab="reviews">Đánh giá</button>', '<button type="button" data-admin-tab="reviews">Đánh giá</button>\n      <button type="button" data-admin-tab="posts">Thảo luận</button>');
  return source;
});

await edit("assets/community.css", (source) => {
  source = source.replaceAll("C%C3%A1i%20Ch%E1%BB%A3%20c%E1%BB%A7a%20Hi%C3%AAn%20Nhi", "Spirituality%20Market");
  if (source.includes("/* Account V2 role UI */")) return source;
  return source + `

/* Account V2 role UI */
.community-account-identity { display:flex; align-items:center; gap:11px; min-width:0; }
.community-avatar { display:grid; place-items:center; width:44px; height:44px; flex:0 0 44px; border-radius:50%; background:linear-gradient(145deg,#8b6fd0,#4d357f); color:white; font-weight:850; font-size:1rem; }
.community-name-line { display:flex; align-items:center; flex-wrap:wrap; gap:8px; }
.community-name-line h1,.community-name-line h3 { margin:0; }
.community-role-badge { display:inline-flex; align-items:center; min-height:24px; padding:3px 9px; border:1px solid #725a94; border-radius:999px; background:#2a203d; color:#dbcdf0; font-size:.7rem; font-weight:800; white-space:nowrap; }
.community-role-badge.role-reader { border-color:#d8b45c88; color:#f0cf72; }
.community-role-badge.role-guest { border-color:#8669c788; color:#cbb8f0; }
.community-post-list,.community-comment-list,.community-admin-posts { display:grid; gap:12px; }
.community-post-card { width:100%; display:grid; gap:6px; text-align:left; padding:16px; border:1px solid var(--line); border-radius:15px; background:#171124; color:var(--text); }
.community-post-card p,.community-admin-post p,.community-comment p { margin:0; color:var(--muted); white-space:pre-wrap; }
.community-post-card small,.community-admin-post small,.community-comment small { color:var(--muted); }
.community-post-body { white-space:pre-wrap; padding:15px; border:1px solid #ffffff14; border-radius:14px; background:#120e1c; }
.community-comment { display:grid; gap:6px; padding:13px; border:1px solid #ffffff16; border-radius:14px; background:#120e1c; }
.community-comment-head { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.community-admin-post { display:grid; gap:8px; padding:15px; border:1px solid var(--line); border-radius:15px; background:#171124; }
.community-admin-actions { display:flex; flex-wrap:wrap; gap:7px; }
.community-table td { white-space:pre-line; }
@media (max-width:640px) { .community-dashboard-head{align-items:flex-start}.community-account-identity{align-items:flex-start}.community-name-line{display:grid;gap:4px}.community-admin-actions{min-width:150px} }
`;
});

const checks = [
  ["assets/gate.js", ["gate-entry-choice", "claimPrimaryAdminDevice", "if (!payload)", "community_profile_boitoan"]],
  ["backend/community.js", ["handlePosts", "read_only_impersonation", "member_deleted", "member_view"]],
  ["assets/community.js", ["renderPosts", "community-role-badge", "Reader / Người xem bói"]],
  ["assets/community-admin.js", ["Xóa tài khoản", "Xem giao diện", "Mở bài thảo luận"]],
];
for (const [path, markers] of checks) {
  const value = await readFile(path, "utf8");
  for (const marker of markers) if (!value.includes(marker)) throw new Error(`Thiếu marker ${marker} trong ${path}`);
}
console.log("Đã áp dụng Account V2: onboarding hai màn hình, sửa đăng ký, badge vai trò và quyền Admin mở rộng.");
