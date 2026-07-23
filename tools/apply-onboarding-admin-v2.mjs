import { readFile, writeFile } from "node:fs/promises";

async function edit(path, mutate) {
  const before = await readFile(path, "utf8");
  const after = mutate(before);
  if (after !== before) await writeFile(path, after);
}

function replaceRequired(source, pattern, replacement, label) {
  if (!pattern.test(source)) throw new Error(`Không tìm thấy khối ${label}`);
  return source.replace(pattern, replacement);
}

function insertBeforeOnce(source, marker, addition, signature, label) {
  if (source.includes(signature)) return source;
  const index = source.indexOf(marker);
  if (index < 0) throw new Error(`Không tìm thấy điểm nối ${label}`);
  return source.slice(0, index) + addition + source.slice(index);
}

await edit("backend/community.js", (source) => {
  const publicEntryV2 = `async function publicEntry(request, env, body, route) {
  const gate = await gateAuth(request, env);
  if (gate) return { did: gate.did, existingGate: true };
  const did = clean(body && body.device_id, 80);
  if (!body || body.entry !== true || !isUuid(did)) return null;
  if (env.PUBLIC_RATE_LIMITER && typeof env.PUBLIC_RATE_LIMITER.limit === "function") {
    const result = await env.PUBLIC_RATE_LIMITER.limit({ key: \`community-entry:\${route}:\${did}\` });
    if (!result || !result.success) return { rateLimited: true };
  }
  return { did, existingGate: false };
}`;
  source = replaceRequired(source, /async function publicEntry\(request, env, body, route\) \{[\s\S]*?\n\}/, publicEntryV2, "publicEntry v2");

  const createAccountV2 = `async function createAccount(env, body, did) {
  const username = clean(body && body.username, 30).toLowerCase();
  const password = String(body && body.password || "");
  const role = body && body.role;
  if (!validUsername(username) || password.length < 8 || password.length > 128 || !validRole(role)) return { error: "invalid_account", status: 400 };
  const existingLogin = await getJson(env, loginKey(username));
  if (existingLogin) {
    if (!(await verifyPassword(password, existingLogin.password))) return { error: "username_exists", status: 409 };
    const existingProfile = await getJson(env, profileKey(existingLogin.id));
    if (!existingProfile || existingProfile.suspended) return { error: "account_unavailable", status: 403 };
    await putJson(env, deviceAccountKey(did), { uid: existingProfile.id, bound_at: Date.now() });
    return { profile: existingProfile, recovered: true };
  }
  const validated = validateProfileBody(body || {}, role);
  if (validated.error) return { error: validated.error, status: 400 };
  const id = crypto.randomUUID();
  const now = Date.now();
  const passwordRecord = await createPasswordRecord(password);
  const profile = { id, username, role, ...validated.value, suspended: false, rating: 0, review_count: 0, created_at: now, updated_at: now };
  await Promise.all([
    putJson(env, loginKey(username), { id, username, role, password: passwordRecord, created_at: now }),
    putJson(env, profileKey(id), profile),
    putJson(env, deviceAccountKey(did), { uid: id, bound_at: now }),
    role === "reader" ? putJson(env, readerIndexKey(id), { uid: id, created_at: now }) : Promise.resolve(),
  ]);
  return { profile, recovered: false };
}`;
  source = replaceRequired(source, /async function createAccount\(env, body, did\) \{[\s\S]*?\n\}/, createAccountV2, "createAccount v2");

  const entryResponseV2 = `async function entryResponse(env, profile, did, status = 200, extra = {}) {
  const [communityToken, gateToken] = await Promise.all([
    issueCommunitySession(env, profile, did),
    issueGateSession(env, profile, did),
  ]);
  const key = entryDecryptKey(env);
  return json({ token: communityToken, gate_token: gateToken, key, profile: publicProfile(profile, true), ...extra }, status);
}`;
  source = replaceRequired(source, /async function entryResponse\(env, profile, did, status = 200, extra = \{\}\) \{[\s\S]*?\n\}/, entryResponseV2, "entryResponse v2");

  const registerV2 = `async function handleRegister(request, env) {
  const body = await readJson(request);
  const entry = await publicEntry(request, env, body, "register");
  if (!entry) return json({ error: "gate_approval_required" }, 401);
  if (entry.rateLimited) return json({ error: "rate_limited" }, 429);
  if (body && body.smoke_test === true) {
    return json({ ok: true, onboarding_ready: true, plaintext_compatible: true });
  }
  const created = await createAccount(env, body || {}, entry.did);
  if (created.error) return json({ error: created.error }, created.status);
  if (entry.existingGate) {
    return json({ token: await issueCommunitySession(env, created.profile, entry.did), profile: publicProfile(created.profile, true), recovered_existing: !!created.recovered }, created.recovered ? 200 : 201);
  }
  const telegramNotified = created.recovered ? null : await notifyNewMember(request, env, created.profile, entry.did, body && body.device).catch(() => false);
  return entryResponse(env, created.profile, entry.did, created.recovered ? 200 : 201, {
    telegram_notified: telegramNotified,
    recovered_existing: !!created.recovered,
  });
}
async function handleLogin(request, env) {
  const body = await readJson(request);
  const entry = await publicEntry(request, env, body, "login");
  if (!entry) return json({ error: "gate_approval_required" }, 401);
  if (entry.rateLimited) return json({ error: "rate_limited" }, 429);
  const authenticated = await authenticateAccount(env, body || {}, entry.did);
  if (authenticated.error) return json({ error: authenticated.error }, authenticated.status);
  if (entry.existingGate) {
    return json({ token: await issueCommunitySession(env, authenticated.profile, entry.did), profile: publicProfile(authenticated.profile, true) });
  }
  return entryResponse(env, authenticated.profile, entry.did);
}`;
  source = replaceRequired(
    source,
    /async function handleRegister\(request, env\) \{[\s\S]*?\n\}\nasync function handleLogin\(request, env\) \{[\s\S]*?\n\}(?=\nasync function handleMe)/,
    registerV2,
    "register/login v2"
  );

  const adminHelpers = `const DISCUSSION_TTL = 3650 * 24 * 60 * 60;
function discussionKey(id) { return \`community-post:\${id}\`; }
function discussionCommentPrefix(id) { return \`community-post-comment:\${id}:\`; }
function discussionCommentKey(id, at, cid) { return \`\${discussionCommentPrefix(id)}\${String(at).padStart(13, "0")}:\${cid}\`; }
function adminAuditKey(at, id) { return \`community-admin-audit:\${String(at).padStart(13, "0")}:\${id}\`; }
async function adminAudit(env, request, action, target = "", meta = {}) {
  const now = Date.now();
  await putJson(env, adminAuditKey(now, crypto.randomUUID()), {
    action: clean(action, 80), target: clean(target, 100), meta,
    device_id: clean(request.headers.get("x-owner-device-id"), 80), created_at: now,
  }, DISCUSSION_TTL);
}
async function issueImpersonationSession(env, profile, did) {
  const sid = crypto.randomUUID();
  const expiresAt = Date.now() + COMMUNITY_SESSION_TTL * 1000;
  await putJson(env, sessionKey(sid), { active: true, uid: profile.id, did, impersonated: true, expires_at: expiresAt }, COMMUNITY_SESSION_TTL);
  return makeJwt(sessionSecret(env), { aud: "community", sid, uid: profile.id, did, role: profile.role, admin_impersonation: true });
}
async function deleteMember(env, profile) {
  await Promise.all([
    env.KV.delete(loginKey(profile.username)),
    env.KV.delete(profileKey(profile.id)),
    profile.role === "reader" ? env.KV.delete(readerIndexKey(profile.id)) : Promise.resolve(),
  ]);
  const sessionPage = await env.KV.list({ prefix: "community-session:", limit: 1000 });
  const sessions = await Promise.all(sessionPage.keys.map(async (key) => ({ key: key.name, value: await getJson(env, key.name) })));
  await Promise.all(sessions.filter((item) => item.value && item.value.uid === profile.id).map((item) => env.KV.delete(item.key)));
  const devicePage = await env.KV.list({ prefix: \`community-device:\${APP}:\`, limit: 1000 });
  const devices = await Promise.all(devicePage.keys.map(async (key) => ({ key: key.name, value: await getJson(env, key.name) })));
  await Promise.all(devices.filter((item) => item.value && item.value.uid === profile.id).map((item) => env.KV.delete(item.key)));
  const reviewPage = await env.KV.list({ prefix: "community-review:", limit: 1000 });
  const reviews = await Promise.all(reviewPage.keys.map(async (key) => ({ key: key.name, value: await getJson(env, key.name) })));
  const affectedReaders = new Set();
  await Promise.all(reviews.filter((item) => item.value && (item.value.author_id === profile.id || item.value.reader_id === profile.id)).map(async (item) => {
    if (item.value.reader_id !== profile.id) affectedReaders.add(item.value.reader_id);
    await env.KV.delete(item.key);
  }));
  await Promise.all([...affectedReaders].map((readerId) => recalculateRating(env, readerId)));
  const conversationPage = await env.KV.list({ prefix: "community-conversation:", limit: 1000 });
  const conversations = await Promise.all(conversationPage.keys.map(async (key) => ({ key: key.name, value: await getJson(env, key.name) })));
  await Promise.all(conversations.filter((item) => item.value && (item.value.guest_id === profile.id || item.value.reader_id === profile.id)).map(async (item) => {
    const rec = item.value;
    if (rec.guest_id === profile.id) rec.guest_name = "Tài khoản đã xóa";
    if (rec.reader_id === profile.id) rec.reader_name = "Tài khoản đã xóa";
    rec.account_deleted_at = Date.now();
    await putJson(env, item.key, rec, MESSAGE_TTL);
  }));
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
  const post = isUuid(postId) && await getJson(env, discussionKey(postId));
  if (!post) return json({ error: "post_not_found" }, 404);
  if (!action && request.method === "GET") {
    const comments = (await listByPrefix(env, discussionCommentPrefix(postId), 200)).sort((a, b) => a.created_at - b.created_at);
    return json({ post, comments });
  }
  if (action === "comments" && request.method === "POST") {
    const body = await readJson(request);
    const text = clean(body && body.text, 3000);
    if (!text) return json({ error: "invalid_comment" }, 400);
    const now = Date.now();
    const comment = {
      id: crypto.randomUUID(), post_id: postId, author_id: auth.profile.id,
      author_name: auth.profile.display_name, author_role: auth.profile.role,
      text, created_at: now,
    };
    post.comment_count = Number(post.comment_count || 0) + 1;
    post.updated_at = now;
    await Promise.all([
      putJson(env, discussionCommentKey(postId, now, comment.id), comment, DISCUSSION_TTL),
      putJson(env, discussionKey(postId), post, DISCUSSION_TTL),
    ]);
    return json({ comment }, 201);
  }
  return json({ error: "not_found" }, 404);
}

`;
  source = insertBeforeOnce(source, "function adminTokenOk(request, env) {", adminHelpers, "const DISCUSSION_TTL", "Admin/discussion helpers");

  const handleAdminV2 = `async function handleAdmin(request, env, path) {
  if (!adminTokenOk(request, env)) return json({ error: "unauthorized" }, 401);
  const parts = path.split("/").filter(Boolean);
  const action = parts[3] || "";
  const targetId = parts[4] || "";
  const subAction = parts[5] || "";
  if (action === "capabilities" && request.method === "GET") {
    const boundDevice = await env.KV.get("community-owner-device");
    return json({ owner_bound: !!boundDevice, is_super_admin: await ownerDeviceOk(request, env) });
  }
  if (action === "bind-owner-device" && request.method === "POST") {
    const body = await readJson(request);
    const deviceId = clean(body && body.device_id, 80);
    if (!isUuid(deviceId)) return json({ error: "invalid_device" }, 400);
    const old = await env.KV.get("community-owner-device");
    if (old && !secureEqual(old, deviceId)) return json({ error: "owner_device_already_bound" }, 409);
    await env.KV.put("community-owner-device", deviceId);
    await adminAudit(env, request, "bind_super_admin_device", deviceId);
    return json({ ok: true, device_id: deviceId, is_super_admin: true });
  }
  if (action === "users" && !targetId && request.method === "GET") {
    const users = await listByPrefix(env, "community-profile:", 1000);
    return json({ users: users.map((p) => ({ ...publicProfile(p, true), suspended: !!p.suspended })) });
  }
  if (action === "users" && targetId && !subAction && request.method === "PATCH") {
    const profile = isUuid(targetId) && await getJson(env, profileKey(targetId));
    if (!profile) return json({ error: "not_found" }, 404);
    const body = await readJson(request);
    if (typeof body.suspended === "boolean") profile.suspended = body.suspended;
    profile.updated_at = Date.now();
    await putJson(env, profileKey(targetId), profile);
    await adminAudit(env, request, profile.suspended ? "suspend_member" : "restore_member", targetId);
    return json({ profile: publicProfile(profile, true), suspended: profile.suspended });
  }
  if (action === "users" && targetId && !subAction && request.method === "DELETE") {
    const profile = isUuid(targetId) && await getJson(env, profileKey(targetId));
    if (!profile) return json({ error: "not_found" }, 404);
    await deleteMember(env, profile);
    await adminAudit(env, request, "delete_member", targetId, { username: profile.username, role: profile.role });
    return json({ ok: true });
  }
  if (action === "users" && targetId && subAction === "impersonate" && request.method === "POST") {
    if (!(await ownerDeviceOk(request, env))) return json({ error: "owner_device_required" }, 403);
    const profile = isUuid(targetId) && await getJson(env, profileKey(targetId));
    if (!profile || profile.suspended) return json({ error: "account_unavailable" }, 404);
    const did = clean(request.headers.get("x-owner-device-id"), 80);
    const token = await issueImpersonationSession(env, profile, did);
    await adminAudit(env, request, "impersonate_member", targetId, { username: profile.username, role: profile.role });
    return json({ token, profile: publicProfile(profile, true) });
  }
  if (action === "reviews" && request.method === "GET") {
    return json({ reviews: await listByPrefix(env, "community-review:", 1000) });
  }
  if (action === "reviews" && targetId && subAction && request.method === "DELETE") {
    const readerId = targetId, authorId = subAction;
    if (!isUuid(readerId) || !isUuid(authorId)) return json({ error: "invalid_review" }, 400);
    await env.KV.delete(reviewKey(readerId, authorId));
    await recalculateRating(env, readerId);
    await adminAudit(env, request, "delete_review", \`\${readerId}:\${authorId}\`);
    return json({ ok: true });
  }
  if (action === "posts" && !targetId && request.method === "GET") {
    return json({ posts: (await listByPrefix(env, "community-post:", 100)).sort((a, b) => b.created_at - a.created_at) });
  }
  if (action === "posts" && !targetId && request.method === "POST") {
    const body = await readJson(request);
    const title = clean(body && body.title, 180);
    const text = clean(body && body.text, 8000);
    if (!title || !text) return json({ error: "invalid_post" }, 400);
    const now = Date.now();
    const post = { id: crypto.randomUUID(), title, text, created_at: now, updated_at: now, comment_count: 0, status: "open" };
    await putJson(env, discussionKey(post.id), post, DISCUSSION_TTL);
    await adminAudit(env, request, "create_discussion", post.id, { title });
    return json({ post }, 201);
  }
  if (action === "posts" && targetId && request.method === "DELETE") {
    if (!isUuid(targetId)) return json({ error: "invalid_post" }, 400);
    await env.KV.delete(discussionKey(targetId));
    const comments = await env.KV.list({ prefix: discussionCommentPrefix(targetId), limit: 1000 });
    await Promise.all(comments.keys.map((key) => env.KV.delete(key.name)));
    await adminAudit(env, request, "delete_discussion", targetId);
    return json({ ok: true });
  }
  if (action === "conversations") {
    if (!(await ownerDeviceOk(request, env))) return json({ error: "owner_device_required" }, 403);
    const cid = targetId || "";
    if (!cid && request.method === "GET") return json({ conversations: await listByPrefix(env, "community-conversation:", 1000) });
    if (cid && subAction === "messages" && request.method === "GET") {
      return json({ messages: (await listByPrefix(env, messagePrefix(cid), 1000)).sort((a, b) => a.created_at - b.created_at) });
    }
  }
  return json({ error: "not_found" }, 404);
}`;
  source = replaceRequired(source, /async function handleAdmin\(request, env, path\) \{[\s\S]*?\n\}(?=\n\nexport async function handleCommunity)/, handleAdminV2, "handleAdmin v2");

  if (!source.includes('if (path === "/api/community/posts" || path.startsWith("/api/community/posts/"))')) {
    source = source.replace(
      '    if (path === "/api/community/conversations" || path.startsWith("/api/community/conversations/")) return handleConversations(request, env, path);',
      '    if (path === "/api/community/conversations" || path.startsWith("/api/community/conversations/")) return handleConversations(request, env, path);\n    if (path === "/api/community/posts" || path.startsWith("/api/community/posts/")) return handlePosts(request, env, path);'
    );
  }
  return source;
});

await edit("assets/gate.js", (source) => {
  const finishV2 = `  function finishMemberEntry(data, remember, method) {
    if (!data || !data.gate_token || !data.token) return Promise.reject(new Error("entry_incomplete"));
    var hasPayload = !!document.querySelector('script[type="application/gate-payload"]');
    if (hasPayload && !data.key) return Promise.reject(new Error("decrypt_key_unavailable"));
    try {
      localStorage.setItem(TOKEN_KEY, data.gate_token);
      localStorage.setItem("community_token_boitoan", data.token);
      if (data.profile && data.profile.role) localStorage.setItem("community_role_boitoan", data.profile.role);
      sessionStorage.setItem(SESSION_KEY, "1");
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, "1");
        if (data.key) localStorage.setItem("gate_key_" + APP, data.key);
      }
    } catch (e) {}
    if (!hasPayload) {
      reveal(method || "member");
      return Promise.resolve();
    }
    return decryptPayload(data.key).then(function (html) {
      injectHtml(html);
      reveal(method || "member");
    });
  }`;
  source = replaceRequired(source, /  function finishMemberEntry\(data, remember, method\) \{[\s\S]*?\n  \}/, finishV2, "finishMemberEntry v2");

  const uiV2 = `  function buildBoitoanEntryUI() {
    var root = document.createElement("div");
    root.id = "gate-root";
    root.innerHTML =
      '<div class="gate-card gate-member-card" role="dialog" aria-modal="true" aria-label="Spirituality Market">' +
        '<div class="gate-sigil market-gate-sigil" aria-hidden="true"><span></span></div>' +
        '<h1 class="gate-title">Spirituality Market</h1>' +
        '<section class="gate-entry-home">' +
          '<p class="gate-sub">Chọn một mục để tiếp tục.</p>' +
          '<div class="gate-step-choice">' +
            '<button type="button" data-entry-open="login"><strong>Đăng nhập</strong><small>Dành cho Khách hoặc Reader đã có tài khoản</small></button>' +
            '<button type="button" data-entry-open="register"><strong>Đăng ký</strong><small>Tạo tài khoản Khách hoặc Reader / Người xem bói</small></button>' +
            '<button type="button" data-entry-open="admin"><strong>Admin</strong><small>Vào khu vực quản trị</small></button>' +
          '</div>' +
        '</section>' +
        '<section class="gate-entry-detail" hidden>' +
          '<button type="button" class="gate-entry-back">← Quay lại</button>' +
          '<h2 class="gate-entry-heading"></h2>' +
          '<p class="gate-entry-description"></p>' +
          '<form class="gate-form gate-member-login" autocomplete="on" hidden>' +
            '<input class="gate-input" name="username" required minlength="3" maxlength="30" placeholder="Tên đăng nhập" autocomplete="username">' +
            '<input class="gate-input" name="password" type="password" required minlength="8" maxlength="128" placeholder="Mật khẩu" autocomplete="current-password">' +
            '<label class="gate-remember"><input type="checkbox" name="remember" checked><span>Ghi nhớ trên thiết bị này</span></label>' +
            '<button class="gate-btn" type="submit">Vào ứng dụng</button>' +
            '<div class="gate-msg" aria-live="polite"></div>' +
          '</form>' +
          '<form class="gate-form gate-member-register" autocomplete="on" hidden>' +
            '<fieldset class="gate-role-choice"><legend>Chọn loại tài khoản</legend>' +
              '<label class="gate-role-card"><input type="radio" name="role" value="guest" checked><span><strong>Khách</strong><small>Xem bài, tìm Reader, trò chuyện và đánh giá.</small></span></label>' +
              '<label class="gate-role-card"><input type="radio" name="role" value="reader"><span><strong>Reader / Người xem bói</strong><small>Tạo hồ sơ chuyên môn, nhận khách và luận giải.</small></span></label>' +
            '</fieldset>' +
            '<input class="gate-input" name="display_name" required maxlength="80" placeholder="Tên hiển thị" autocomplete="name">' +
            '<input class="gate-input" name="username" required pattern="[a-zA-Z0-9_]{3,30}" maxlength="30" placeholder="Tên đăng nhập: chữ, số hoặc _" autocomplete="username">' +
            '<input class="gate-input" name="password" type="password" required minlength="8" maxlength="128" placeholder="Mật khẩu từ 8 ký tự" autocomplete="new-password">' +
            '<label class="gate-remember"><input type="checkbox" name="remember" checked><span>Ghi nhớ trên thiết bị này</span></label>' +
            '<details class="gate-privacy"><summary>Dữ liệu kỹ thuật gửi Admin</summary><p>Tên hiển thị, tên đăng nhập, vai trò, mã trình duyệt, trình duyệt/nền tảng, màn hình, ngôn ngữ, múi giờ, quốc gia và IP rút gọn. Không gửi mật khẩu.</p></details>' +
            '<button class="gate-btn" type="submit">Tạo tài khoản và vào app</button>' +
            '<div class="gate-msg" aria-live="polite"></div>' +
          '</form>' +
          '<form class="gate-form gate-admin-login" autocomplete="off" hidden>' +
            '<input class="gate-input" name="password" type="password" required placeholder="Mật khẩu Admin" autocomplete="current-password">' +
            '<label class="gate-remember"><input type="checkbox" name="remember" checked><span>Ghi nhớ thiết bị Admin</span></label>' +
            '<button class="gate-btn" type="submit">Đăng nhập Admin</button>' +
            '<div class="gate-msg" aria-live="polite"></div>' +
          '</form>' +
        '</section>' +
        '<div class="gate-foot">Spirituality Market · Truy cập được ghi nhận</div>' +
      '</div>';
    document.body.appendChild(root);

    var home = root.querySelector(".gate-entry-home");
    var detail = root.querySelector(".gate-entry-detail");
    var heading = root.querySelector(".gate-entry-heading");
    var description = root.querySelector(".gate-entry-description");
    var forms = {
      login: root.querySelector(".gate-member-login"),
      register: root.querySelector(".gate-member-register"),
      admin: root.querySelector(".gate-admin-login"),
    };
    var copy = {
      login: ["Đăng nhập", "Nhập tài khoản Khách hoặc Reader đã đăng ký."],
      register: ["Tạo tài khoản", "Chọn Khách hoặc Reader / Người xem bói rồi điền thông tin."],
      admin: ["Admin", "Đăng nhập khu vực quản trị."],
    };
    function openStep(type) {
      home.hidden = true;
      detail.hidden = false;
      heading.textContent = copy[type][0];
      description.textContent = copy[type][1];
      Object.keys(forms).forEach(function (key) { forms[key].hidden = key !== type; });
      var first = forms[type].querySelector("input:not([type=checkbox]):not([type=radio])");
      if (first) setTimeout(function () { first.focus(); }, 30);
    }
    function goHome() {
      detail.hidden = true;
      home.hidden = false;
      Object.keys(forms).forEach(function (key) {
        forms[key].hidden = true;
        var msg = forms[key].querySelector(".gate-msg");
        if (msg) { msg.className = "gate-msg"; msg.textContent = ""; }
      });
    }
    root.querySelectorAll("[data-entry-open]").forEach(function (button) {
      button.addEventListener("click", function () { openStep(button.getAttribute("data-entry-open")); });
    });
    root.querySelector(".gate-entry-back").addEventListener("click", goHome);

    function entryRequest(path, payload) {
      return fetch(BACKEND + path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.assign({ entry: true, device_id: deviceId(), device: fingerprint() }, payload)),
      }).then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (data) {
          if (!response.ok) {
            var error = new Error(data.error || "entry_failed");
            error.code = data.error || "entry_failed";
            error.status = response.status;
            error.detail = data.detail || "";
            throw error;
          }
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
        .catch(function (error) {
          button.disabled = false; msg.className = "gate-msg err";
          msg.textContent = memberEntryError(error.code || error.message);
        });
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
        msg.textContent = data.recovered_existing ? "Tài khoản đã được tạo trước đó và mật khẩu khớp. Đang mở app…" : "Đã tạo tài khoản. Đang mở app…";
        return finishMemberEntry(data, form.remember.checked, "member-register");
      }).catch(function (error) {
        button.disabled = false; msg.className = "gate-msg err";
        msg.textContent = memberEntryError(error.code || error.message);
      });
    });

    forms.admin.addEventListener("submit", function (event) {
      event.preventDefault();
      var form = forms.admin, button = form.querySelector("button[type=submit]"), msg = form.querySelector(".gate-msg");
      button.disabled = true; msg.className = "gate-msg wait"; msg.textContent = "Đang kiểm tra Admin…";
      unlockLocalOrEncrypted(form.password.value, form.remember.checked).catch(function () {
        button.disabled = false; msg.className = "gate-msg err"; msg.textContent = "Mật khẩu Admin không đúng.";
      });
    });
  }`;
  source = replaceRequired(source, /  function buildBoitoanEntryUI\(\) \{[\s\S]*?\n  \}(?=\n\n  \/\* -------------------------- giao diện khóa)/, uiV2, "buildBoitoanEntryUI v2");
  return source;
});

await edit("assets/gate.css", (source) => {
  if (source.includes("/* Spirituality Market onboarding v2 */")) return source;
  return source + `

/* Spirituality Market onboarding v2 */
.gate-member-card{width:min(92vw,430px)!important;max-height:calc(100dvh - 28px)!important;padding:24px 18px 18px!important;overflow:auto!important}
.gate-entry-home[hidden],.gate-entry-detail[hidden],.gate-form[hidden]{display:none!important}
.gate-step-choice{display:grid;gap:11px;margin:18px 0 8px}
.gate-step-choice button{display:grid;gap:4px;width:100%;padding:15px 16px;border:1px solid #443766;border-radius:14px;background:linear-gradient(145deg,#211a35,#161226);color:#e8e2f4;text-align:left;cursor:pointer}
.gate-step-choice button:active{transform:scale(.985)}
.gate-step-choice strong{color:#f1d27d;font-size:1rem}
.gate-step-choice small{color:#aaa0c3;font-size:.77rem;line-height:1.4}
.gate-entry-detail{display:grid;gap:10px;text-align:left}
.gate-entry-back{justify-self:start;border:0;background:none;color:#b79be8;padding:6px 0;font:600 .85rem/1.2 ui-sans-serif,-apple-system,sans-serif;cursor:pointer}
.gate-entry-heading{margin:0;color:#e9c86f;font:600 1.16rem/1.25 ui-serif,Georgia,serif;text-align:center}
.gate-entry-description{margin:0 0 8px;color:#aaa0c3;font-size:.8rem;line-height:1.45;text-align:center}
.gate-member-card .gate-form{gap:11px}
.gate-member-card .gate-remember{display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:9px!important;text-align:left!important}
.gate-member-card .gate-remember input,.gate-member-card .gate-role-card input{width:18px!important;height:18px!important;min-width:18px!important;max-width:18px!important;padding:0!important;margin:0!important;appearance:auto!important;-webkit-appearance:auto!important}
.gate-member-card .gate-remember span{flex:1;color:#aaa0c3;font-size:.78rem}
.gate-role-choice{display:grid!important;gap:9px!important;margin:0!important}
.gate-role-card{display:grid!important;grid-template-columns:22px 1fr!important;align-items:start!important;gap:9px!important;padding:12px!important}
.gate-role-card span{min-width:0}
.gate-privacy{margin:2px 0;color:#8f86a8;font-size:.7rem;line-height:1.45}
.gate-privacy summary{cursor:pointer;color:#ad9bc9}
.gate-privacy p{margin:7px 0 0}
.community-post-list{display:grid;gap:12px}.community-post-card{padding:16px;border:1px solid #332a52;border-radius:14px;background:#171225}.community-post-card h3{margin:0 0 7px;color:#d4a94e}.community-post-card p{white-space:pre-wrap;overflow-wrap:anywhere}.community-post-meta{color:#8f86a8;font-size:.75rem}.community-post-comments{display:grid;gap:9px;margin:14px 0}.community-post-comment{padding:11px;border:1px solid #332a52;border-radius:11px;background:#211a35}.community-post-comment strong,.community-post-comment small{display:block}.community-admin-actions{display:flex;flex-wrap:wrap;gap:6px}.community-admin-capability{margin-top:8px;color:#a89fc4;font-size:.78rem}
@media(max-width:380px){.gate-member-card{width:94vw!important;padding:20px 14px 16px!important}.gate-step-choice button{padding:13px}.gate-title{font-size:1.02rem!important}}
`;
});

await edit("assets/community.js", (source) => {
  if (!source.includes("post_not_found:")) {
    source = source.replace(
      '      community_server: "Hệ thống tạm thời chưa xử lý được yêu cầu."',
      '      community_server: "Hệ thống tạm thời chưa xử lý được yêu cầu.",\n      post_not_found: "Chủ đề không còn tồn tại.",\n      invalid_post: "Chủ đề chưa hợp lệ.",\n      invalid_comment: "Vui lòng nhập nội dung bình luận."'
    );
  }
  const postsUi = `  function renderPosts() {
    clearPoll();
    var card = el("section", null, "community-card");
    card.append(dashboardHeader(), topTabs("posts"), el("h2", "Thảo luận chung"));
    var list = el("div", null, "community-post-list");
    list.append(el("p", "Đang tải chủ đề…", "community-state"));
    card.append(list); APP.replaceChildren(card);
    api("/api/community/posts").then(function (data) {
      list.replaceChildren();
      var posts = data.posts || [];
      if (!posts.length) list.append(el("p", "Admin chưa mở chủ đề thảo luận nào.", "community-empty"));
      posts.forEach(function (post) {
        var item = el("article", null, "community-post-card");
        item.append(el("h3", post.title), el("p", post.text.length > 420 ? post.text.slice(0, 417) + "…" : post.text), el("div", Number(post.comment_count || 0) + " bình luận · " + formatDate(post.created_at), "community-post-meta"));
        item.append(button("Mở thảo luận", "community-primary", function () { openPost(post.id); }));
        list.append(item);
      });
    }).catch(function (error) { list.replaceChildren(el("p", humanError(error), "community-state error")); });
  }

  function openPost(postId) {
    clearPoll(); APP.replaceChildren(el("section", "Đang tải chủ đề…", "community-card"));
    api("/api/community/posts/" + encodeURIComponent(postId)).then(function (data) {
      var post = data.post, comments = data.comments || [];
      var card = el("section", null, "community-card");
      card.append(button("← Danh sách thảo luận", "community-secondary", renderPosts), el("h1", post.title), el("p", post.text), el("div", formatDate(post.created_at), "community-post-meta"));
      var list = el("div", null, "community-post-comments");
      if (!comments.length) list.append(el("p", "Chưa có bình luận.", "community-empty"));
      comments.forEach(function (comment) {
        var item = el("article", null, "community-post-comment");
        item.append(el("strong", comment.author_name + " · " + (comment.author_role === "reader" ? "Reader" : "Khách")), el("span", comment.text), el("small", formatDate(comment.created_at)));
        list.append(item);
      });
      var form = el("form", null, "community-form");
      form.innerHTML = '<label>Bình luận<textarea name="text" maxlength="3000" rows="4" required></textarea></label><button class="community-primary" type="submit">Gửi bình luận</button><p class="community-state" role="status"></p>';
      form.addEventListener("submit", function (event) {
        event.preventDefault(); var submit = form.querySelector("button"), status = form.querySelector(".community-state");
        submit.disabled = true; setMessage(status, "Đang gửi…");
        api("/api/community/posts/" + encodeURIComponent(postId) + "/comments", jsonOptions("POST", { text: form.text.value.trim() })).then(function () { openPost(postId); }).catch(function (error) { submit.disabled = false; setMessage(status, humanError(error), true); });
      });
      card.append(el("h2", "Bình luận"), list, form); APP.replaceChildren(card);
    }).catch(function (error) { APP.replaceChildren(el("section", humanError(error), "community-card community-state error")); });
  }

`;
  source = insertBeforeOnce(source, "  function topTabs(active) {", postsUi, "function renderPosts()", "UI thảo luận member");
  source = source.replace(
    '["conversations", "Trò chuyện", renderConversations],\n      ["profile", "Trang cá nhân", renderProfile]',
    '["conversations", "Trò chuyện", renderConversations],\n      ["posts", "Thảo luận", renderPosts],\n      ["profile", "Trang cá nhân", renderProfile]'
  );
  return source;
});

const adminJs = `(function () {
  "use strict";
  var BACKEND = String(window.COMMUNITY_BACKEND || "").replace(/\\/+$/, "");
  var form = document.getElementById("community-admin-login");
  var tokenInput = document.getElementById("community-admin-token");
  var status = document.getElementById("community-admin-state");
  var content = document.getElementById("community-admin-content");
  var bindButton = document.getElementById("community-bind-owner");
  var deviceId = "", capabilities = { owner_bound: false, is_super_admin: false }, currentTab = "users";
  try { deviceId = localStorage.getItem("gate_device_id") || ""; } catch (_) {}
  document.getElementById("community-owner-device-id").textContent = deviceId || "Thiết bị này chưa có mã cổng Bói toán.";
  function el(tag, text, cls) { var node = document.createElement(tag); if (text !== undefined && text !== null) node.textContent = String(text); if (cls) node.className = cls; return node; }
  function button(text, cls, handler) { var node = el("button", text, cls); node.type = "button"; node.addEventListener("click", handler); return node; }
  function setStatus(text, error) { status.textContent = text || ""; status.classList.toggle("error", !!error); }
  function headers(extra) { return Object.assign({ authorization: "Bearer " + tokenInput.value, "x-owner-device-id": deviceId }, extra || {}); }
  function api(path, options) { options = options || {}; options.headers = headers(options.headers); return fetch(BACKEND + path, options).then(function (response) { return response.json().catch(function () { return {}; }).then(function (data) { if (!response.ok) { var error = new Error(data.error || "HTTP " + response.status); error.status = response.status; throw error; } return data; }); }); }
  function jsonOptions(method, body) { return { method: method, headers: { "content-type": "application/json" }, body: JSON.stringify(body || {}) }; }
  function formatDate(value) { return value ? new Date(value).toLocaleString("vi-VN") : ""; }
  function table(headersList) { var wrap = el("div", null, "community-table-wrap"), t = el("table", null, "community-table"), row = el("tr"); headersList.forEach(function (name) { row.append(el("th", name)); }); t.append(row); wrap.append(t); return { wrap: wrap, table: t }; }
  function cell(row, value) { var node = el("td", value); row.append(node); return node; }
  function errorText(error) { if (error.message === "owner_device_required") return "Chỉ thiết bị Tổng Admin đã xác nhận mới được dùng chức năng này."; if (error.message === "owner_device_already_bound") return "Đã có thiết bị Tổng Admin khác được xác nhận."; if (error.status === 401) return "Mật khẩu Admin không đúng."; return "Không thực hiện được: " + error.message; }
  function loadCapabilities() { return api("/api/community/admin/capabilities").then(function (data) { capabilities = data; bindButton.hidden = !!data.is_super_admin; var note = document.getElementById("community-admin-capability"); if (note) note.textContent = data.is_super_admin ? "Thiết bị này là Tổng Admin." : data.owner_bound ? "Thiết bị này là Admin thường." : "Chưa xác nhận thiết bị Tổng Admin."; return data; }); }
  function loadUsers() { currentTab = "users"; setStatus("Đang tải tài khoản…"); api("/api/community/admin/users").then(function (data) { var t = table(["Tài khoản", "Vai trò", "Hồ sơ", "Trạng thái", "Thao tác"]); (data.users || []).forEach(function (user) { var row = el("tr"); cell(row, user.username + "\n" + user.display_name); cell(row, user.role === "reader" ? "Reader / Người xem bói" : "Khách"); cell(row, user.bio || ""); cell(row, user.suspended ? "Đã khóa" : "Hoạt động"); var action = cell(row, ""), actions = el("div", null, "community-admin-actions"); actions.append(button(user.suspended ? "Mở khóa" : "Khóa", user.suspended ? "community-secondary" : "community-danger", function () { api("/api/community/admin/users/" + user.id, jsonOptions("PATCH", { suspended: !user.suspended })).then(loadUsers); })); actions.append(button("Xóa tài khoản", "community-danger", function () { if (!confirm("Xóa tài khoản " + user.username + "? Thao tác này không thể hoàn tác.")) return; api("/api/community/admin/users/" + user.id, { method: "DELETE" }).then(loadUsers).catch(function (error) { setStatus(errorText(error), true); }); })); if (capabilities.is_super_admin) actions.append(button("Mở như member", "community-primary", function () { api("/api/community/admin/users/" + user.id + "/impersonate", { method: "POST" }).then(function (result) { localStorage.setItem("community_token_boitoan", result.token); window.open("./community.html?admin_view=1", "_blank"); }).catch(function (error) { setStatus(errorText(error), true); }); })); action.append(actions); t.table.append(row); }); content.replaceChildren(el("h2", "Tài khoản member"), t.wrap); setStatus("Đã tải " + (data.users || []).length + " tài khoản."); }).catch(function (error) { setStatus(errorText(error), true); }); }
  function loadReviews() { currentTab = "reviews"; setStatus("Đang tải đánh giá…"); api("/api/community/admin/reviews").then(function (data) { var t = table(["Reader", "Khách", "Sao", "Nội dung", "Lúc", ""]); (data.reviews || []).sort(function (a, b) { return b.updated_at - a.updated_at; }).forEach(function (review) { var row = el("tr"); cell(row, review.reader_id); cell(row, review.author_name || review.author_id); cell(row, review.rating); cell(row, review.text); cell(row, formatDate(review.updated_at)); var action = cell(row, ""); action.append(button("Xóa review", "community-danger", function () { api("/api/community/admin/reviews/" + review.reader_id + "/" + review.author_id, { method: "DELETE" }).then(loadReviews); })); t.table.append(row); }); content.replaceChildren(el("h2", "Đánh giá công khai"), t.wrap); setStatus("Đã tải " + (data.reviews || []).length + " đánh giá."); }).catch(function (error) { setStatus(errorText(error), true); }); }
  function loadPosts() { currentTab = "posts"; setStatus("Đang tải chủ đề…"); api("/api/community/admin/posts").then(function (data) { var section = el("div"), create = el("form", null, "community-form"); create.innerHTML = '<label>Tiêu đề<input name="title" maxlength="180" required></label><label>Nội dung<textarea name="text" maxlength="8000" rows="5" required></textarea></label><button class="community-primary" type="submit">Mở chủ đề cho mọi member</button><p class="community-state"></p>'; create.addEventListener("submit", function (event) { event.preventDefault(); var s = create.querySelector(".community-state"), b = create.querySelector("button"); b.disabled = true; s.textContent = "Đang tạo…"; api("/api/community/admin/posts", jsonOptions("POST", { title: create.title.value.trim(), text: create.text.value.trim() })).then(loadPosts).catch(function (error) { b.disabled = false; s.textContent = errorText(error); s.classList.add("error"); }); }); var list = el("div", null, "community-post-list"); (data.posts || []).forEach(function (post) { var item = el("article", null, "community-post-card"); item.append(el("h3", post.title), el("p", post.text), el("div", Number(post.comment_count || 0) + " bình luận · " + formatDate(post.created_at), "community-post-meta"), button("Xóa chủ đề", "community-danger", function () { if (!confirm("Xóa chủ đề này?")) return; api("/api/community/admin/posts/" + post.id, { method: "DELETE" }).then(loadPosts); })); list.append(item); }); section.append(el("h2", "Mở thảo luận chung"), create, el("h2", "Các chủ đề"), list); content.replaceChildren(section); setStatus("Đã tải chủ đề."); }).catch(function (error) { setStatus(errorText(error), true); }); }
  function loadConversations() { currentTab = "conversations"; setStatus("Đang kiểm tra quyền Tổng Admin…"); api("/api/community/admin/conversations").then(function (data) { var list = el("div", null, "community-conversation-list"); (data.conversations || []).sort(function (a, b) { return b.updated_at - a.updated_at; }).forEach(function (conversation) { var item = button(conversation.guest_name + " ↔ " + conversation.reader_name, "community-conversation-item", function () { loadMessages(conversation); }); item.append(el("small", formatDate(conversation.updated_at))); list.append(item); }); if (!(data.conversations || []).length) list.append(el("p", "Chưa có hội thoại.", "community-empty")); content.replaceChildren(el("h2", "Hội thoại riêng"), list); setStatus("Đã tải hội thoại."); }).catch(function (error) { content.replaceChildren(el("h2", "Hội thoại riêng"), el("p", errorText(error), "community-state error")); setStatus(errorText(error), true); }); }
  function loadMessages(conversation) { setStatus("Đang tải nội dung hội thoại…"); api("/api/community/admin/conversations/" + conversation.id + "/messages").then(function (data) { var back = button("← Danh sách hội thoại", "community-secondary", loadConversations), list = el("div", null, "community-chat-messages"); (data.messages || []).forEach(function (message) { var item = el("article", null, "community-message" + (message.type === "reading" ? " reading" : "")); item.append(el("strong", message.sender_name + " · " + message.sender_role), el("span", message.text), el("small", formatDate(message.created_at))); list.append(item); }); content.replaceChildren(back, el("h2", conversation.guest_name + " ↔ " + conversation.reader_name), list); setStatus("Đã tải " + (data.messages || []).length + " tin nhắn."); }).catch(function (error) { setStatus(errorText(error), true); }); }
  function activateTab(tab) { document.querySelectorAll("[data-admin-tab]").forEach(function (node) { node.classList.toggle("active", node.dataset.adminTab === tab); }); if (tab === "users") loadUsers(); else if (tab === "reviews") loadReviews(); else if (tab === "posts") loadPosts(); else loadConversations(); }
  form.addEventListener("submit", function (event) { event.preventDefault(); setStatus("Đang xác thực Admin…"); loadCapabilities().then(function () { activateTab(currentTab); }).catch(function (error) { setStatus(errorText(error), true); }); });
  document.querySelectorAll("[data-admin-tab]").forEach(function (node) { node.addEventListener("click", function () { activateTab(node.dataset.adminTab); }); });
  bindButton.addEventListener("click", function () { if (!deviceId) { setStatus("Thiết bị này chưa có mã cổng Bói toán.", true); return; } api("/api/community/admin/bind-owner-device", jsonOptions("POST", { device_id: deviceId })).then(function () { return loadCapabilities(); }).then(function () { setStatus("Đã xác nhận thiết bị Tổng Admin."); activateTab(currentTab); }).catch(function (error) { setStatus(errorText(error), true); }); });
}());
`;
await writeFile("assets/community-admin.js", adminJs);

await edit("boitoan/community-admin.html", (source) => {
  source = source
    .replaceAll("Thiết bị Admin", "Thiết bị Tổng Admin")
    .replaceAll("Khóa thiết bị Admin này", "Xác nhận thiết bị Tổng Admin")
    .replace('<button type="button" data-admin-tab="conversations">Hội thoại</button>', '<button type="button" data-admin-tab="posts">Thảo luận</button>\n      <button type="button" data-admin-tab="conversations">Hội thoại</button>')
    .replace('</div>\n    </section>', '</div>\n      <p id="community-admin-capability" class="community-admin-capability"></p>\n    </section>');
  return source;
});

const markers = [
  ["assets/gate.js", ["gate-entry-home", "gate-entry-detail", "if (!hasPayload)", "recovered_existing"]],
  ["backend/community.js", ["plaintext_compatible", "handlePosts", "deleteMember", "impersonate_member"]],
  ["assets/community.js", ["renderPosts", "/api/community/posts"]],
  ["assets/community-admin.js", ["Xóa tài khoản", "Mở như member", "Mở chủ đề cho mọi member"]],
];
for (const [path, required] of markers) {
  const source = await readFile(path, "utf8");
  for (const marker of required) if (!source.includes(marker)) throw new Error(`Thiếu marker ${marker} trong ${path}`);
}

console.log("Đã áp dụng onboarding hai bước, sửa đăng ký plaintext và phân cấp Admin/Tổng Admin.");
