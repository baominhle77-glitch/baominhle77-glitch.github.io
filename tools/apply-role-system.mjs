import { readFile, writeFile } from "node:fs/promises";

const BRAND = "Spirituality Market";

async function edit(path, mutate) {
  const before = await readFile(path, "utf8");
  const after = mutate(before);
  if (after !== before) await writeFile(path, after);
}

function insertOnce(source, marker, addition, label) {
  if (source.includes(addition.trim())) return source;
  const index = source.indexOf(marker);
  if (index < 0) throw new Error(`Không tìm thấy điểm nối ${label}`);
  return source.slice(0, index) + addition + source.slice(index);
}

function replaceBlock(source, pattern, replacement, label) {
  if (!pattern.test(source)) throw new Error(`Không tìm thấy khối ${label}`);
  return source.replace(pattern, replacement);
}

await edit("backend/worker.js", (source) => {
  if (!source.includes('import { handleCommunity } from "./community.js";')) {
    source = 'import { handleCommunity } from "./community.js";\n' + source;
  }
  source = source.replace(
    '"Access-Control-Allow-Headers": "content-type, authorization",',
    '"Access-Control-Allow-Headers": "content-type, authorization, x-owner-device-id",'
  );
  if (!source.includes("const communityResponse = await handleCommunity")) {
    const routePattern = /(\n[ \t]*try \{\r?\n)([ \t]*if \(url\.pathname === "\/api\/request")/;
    const match = source.match(routePattern);
    if (!match) throw new Error("Không tìm thấy điểm nối Worker community API");
    const indent = match[2].match(/^[ \t]*/)[0];
    const hook = `${match[1]}${indent}const communityResponse = await handleCommunity(request, env);\n${indent}if (communityResponse) return withCors(communityResponse, cors);\n\n${match[2]}`;
    source = source.replace(routePattern, hook);
  }
  return source;
});

await edit("backend/community.js", (source) => {
  if (!source.includes("const GATE_SESSION_TTL")) {
    source = source.replace(
      "const COMMUNITY_SESSION_TTL = 30 * 24 * 60 * 60;",
      "const COMMUNITY_SESSION_TTL = 30 * 24 * 60 * 60;\nconst GATE_SESSION_TTL = 12 * 60 * 60;"
    );
  }

  const onboardingHelpers = `async function publicEntry(request, env, body, route) {
  const gate = await gateAuth(request, env);
  if (gate) return { did: gate.did, existingGate: true };
  const did = clean(body && body.device_id, 80);
  if (!body || body.entry !== true || !isUuid(did)) return null;
  if (env.PUBLIC_RATE_LIMITER && typeof env.PUBLIC_RATE_LIMITER.limit === "function") {
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const result = await env.PUBLIC_RATE_LIMITER.limit({ key: \`community-entry:\${route}:\${ip}:\${did}\` });
    if (!result || !result.success) return { rateLimited: true };
  }
  return { did, existingGate: false };
}
function entryDecryptKey(env) {
  return String(env.DECRYPT_KEY_BOITOAN || env.DECRYPT_KEY || "");
}
async function issueGateSession(env, profile, did) {
  const secret = sessionSecret(env);
  if (!secret) throw new Error("invalid_session_secret");
  const sid = crypto.randomUUID();
  const cid = (await hmac(secret, \`chat:\${APP}:\${did}\`)).slice(0, 32);
  await putJson(env, \`session:\${sid}\`, {
    active: true, app: APP, did, cid, uid: profile.id,
    expires_at: Date.now() + GATE_SESSION_TTL * 1000,
  }, GATE_SESSION_TTL);
  const token = await makeJwt(secret, {
    ver: 2, aud: "gate-chat", app: APP, scope: ["access", "log", "chat"],
    sid, cid, did, sub: profile.id,
  }, GATE_SESSION_TTL);
  return token;
}
function browserLabel(ua) {
  const value = String(ua || "");
  if (/Edg\\//.test(value)) return "Edge";
  if (/OPR\\//.test(value)) return "Opera";
  if (/Firefox\\//.test(value)) return "Firefox";
  if (/CriOS\\//.test(value)) return "Chrome iOS";
  if (/Chrome\\//.test(value)) return "Chrome";
  if (/Safari\\//.test(value) && /Version\\//.test(value)) return "Safari";
  return "Khác";
}
function redactedIp(request) {
  const raw = String(request.headers.get("cf-connecting-ip") || "");
  const v4 = raw.match(/^(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})$/);
  if (v4 && v4.slice(1).every((part) => Number(part) <= 255)) return \`\${v4[1]}.\${v4[2]}.\${v4[3]}.0/24\`;
  if (raw.includes(":")) return raw.split(":").slice(0, 4).join(":") + "::/64";
  return "";
}
function cleanEntryDevice(value) {
  const device = value && typeof value === "object" ? value : {};
  return {
    ua: clean(device.ua, 260),
    lang: clean(device.lang, 20),
    tz: clean(device.tz, 60),
    screen: /^\\d{2,5}x\\d{2,5}$/.test(String(device.screen || "")) ? String(device.screen) : "",
    platform: clean(device.platform, 60),
  };
}
async function notifyNewMember(request, env, profile, did, deviceValue) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return false;
  const device = cleanEntryDevice(deviceValue);
  const country = request.cf && /^[A-Z]{2}$/.test(request.cf.country || "") ? request.cf.country : "?";
  const text = [
    "Thành viên mới · Spirituality Market",
    \`Vai trò: \${profile.role === "reader" ? "Reader / Người xem bói" : "Khách"}\`,
    \`Tên hiển thị: \${profile.display_name}\`,
    \`Tên đăng nhập: \${profile.username}\`,
    \`Trình duyệt: \${browserLabel(device.ua || request.headers.get("user-agent"))}\`,
    \`Nền tảng: \${device.platform || "?"} · Màn hình: \${device.screen || "?"}\`,
    \`Ngôn ngữ: \${device.lang || "?"} · Múi giờ: \${device.tz || "?"}\`,
    \`Mã trình duyệt: \${did}\`,
    \`Quốc gia/IP rút gọn: \${country} · \${redactedIp(request) || "không rõ"}\`,
    \`Lúc: \${new Date().toISOString()}\`,
  ].join("\\n");
  const response = await fetch(\`https://api.telegram.org/bot\${env.TELEGRAM_BOT_TOKEN}/sendMessage\`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text }),
  });
  const data = await response.json().catch(() => ({}));
  return !!(response.ok && data.ok);
}
async function createAccount(env, body, did) {
  const username = clean(body && body.username, 30).toLowerCase();
  const password = String(body && body.password || "");
  const role = body && body.role;
  if (!validUsername(username) || password.length < 8 || password.length > 128 || !validRole(role)) return { error: "invalid_account", status: 400 };
  if (await env.KV.get(loginKey(username))) return { error: "username_exists", status: 409 };
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
  return { profile };
}
async function authenticateAccount(env, body, did) {
  const username = clean(body && body.username, 30).toLowerCase();
  const password = String(body && body.password || "");
  const login = validUsername(username) && await getJson(env, loginKey(username));
  if (!login || !(await verifyPassword(password, login.password))) return { error: "invalid_login", status: 401 };
  const profile = await getJson(env, profileKey(login.id));
  if (!profile || profile.suspended) return { error: "account_unavailable", status: 403 };
  await putJson(env, deviceAccountKey(did), { uid: profile.id, bound_at: Date.now() });
  return { profile };
}
async function entryResponse(env, profile, did, status = 200, extra = {}) {
  const key = entryDecryptKey(env);
  if (!key) return json({ error: "decrypt_key_unavailable" }, 503);
  const [communityToken, gateToken] = await Promise.all([
    issueCommunitySession(env, profile, did),
    issueGateSession(env, profile, did),
  ]);
  return json({ token: communityToken, gate_token: gateToken, key, profile: publicProfile(profile, true), ...extra }, status);
}

`;
  source = insertOnce(source, "async function handleRegister(request, env) {", onboardingHelpers, "helper onboarding thành viên");

  const registerBlock = `async function handleRegister(request, env) {
  const body = await readJson(request);
  const entry = await publicEntry(request, env, body, "register");
  if (!entry) return json({ error: "gate_approval_required" }, 401);
  if (entry.rateLimited) return json({ error: "rate_limited" }, 429);
  if (!entry.existingGate && !entryDecryptKey(env)) return json({ error: "decrypt_key_unavailable" }, 503);
  const created = await createAccount(env, body || {}, entry.did);
  if (created.error) return json({ error: created.error }, created.status);
  if (entry.existingGate) {
    return json({ token: await issueCommunitySession(env, created.profile, entry.did), profile: publicProfile(created.profile, true) }, 201);
  }
  const telegramNotified = await notifyNewMember(request, env, created.profile, entry.did, body && body.device).catch(() => false);
  return entryResponse(env, created.profile, entry.did, 201, { telegram_notified: telegramNotified });
}
async function handleLogin(request, env) {
  const body = await readJson(request);
  const entry = await publicEntry(request, env, body, "login");
  if (!entry) return json({ error: "gate_approval_required" }, 401);
  if (entry.rateLimited) return json({ error: "rate_limited" }, 429);
  if (!entry.existingGate && !entryDecryptKey(env)) return json({ error: "decrypt_key_unavailable" }, 503);
  const authenticated = await authenticateAccount(env, body || {}, entry.did);
  if (authenticated.error) return json({ error: authenticated.error }, authenticated.status);
  if (entry.existingGate) {
    return json({ token: await issueCommunitySession(env, authenticated.profile, entry.did), profile: publicProfile(authenticated.profile, true) });
  }
  return entryResponse(env, authenticated.profile, entry.did);
}
`;
  source = replaceBlock(
    source,
    /async function handleRegister\(request, env\) \{[\s\S]*?\n\}\nasync function handleLogin\(request, env\) \{[\s\S]*?\n\}\n(?=async function handleMe)/,
    registerBlock,
    "đăng ký và đăng nhập thành viên"
  );
  return source;
});

await edit("boitoan/index.html", (source) => source
  .replace(/owner:\s*'Hiên Nhi Hiên 89'/, `owner: '${BRAND}'`)
  .replace(/owner:\s*'Cái Chợ của Hiên Nhi'/, `owner: '${BRAND}'`)
  .replace(/title:\s*'Bói Toán\s*·\s*Riêng tư'/i, `title: '${BRAND}'`)
  .replace(/title:\s*'Cái Chợ của Hiên Nhi'/i, `title: '${BRAND}'`)
  .replace(/subtitle:\s*'Nhập mật khẩu để mở kho tra cứu\.'/i, "subtitle: 'Đăng nhập Admin hoặc tài khoản thành viên để tiếp tục.'")
  .replace(/subtitle:\s*'Mở kho tra cứu và luận giải\.'/i, "subtitle: 'Đăng nhập Admin hoặc tài khoản thành viên để tiếp tục.'")
);

await edit("boitoan/community.html", (source) => source
  .replaceAll("Cái Chợ của Hiên Nhi", BRAND)
  .replaceAll("Reader / Người luận giải", "Reader / Người xem bói")
  .replace("Hệ thống đang kiểm tra phiên truy cập.", "Hệ thống đang kiểm tra tài khoản thành viên.")
  .replace("Cần phiên truy cập đã được duyệt", "Cần đăng nhập thành viên")
);

await edit("boitoan/community-admin.html", (source) => source
  .replaceAll("Cái Chợ của Hiên Nhi", BRAND)
  .replaceAll("Thiết bị chủ", "Thiết bị Admin")
  .replaceAll("Khóa thiết bị chủ này", "Khóa thiết bị Admin này")
);

await edit("boitoan/manifest.webmanifest", (source) => source
  .replace('"name": "Bói Toán — Tra cứu & Thực hành"', `"name": "${BRAND}"`)
  .replace('"short_name": "Bói Toán"', `"short_name": "${BRAND}"`)
);

await edit("assets/community.js", (source) => source
  .replaceAll("Reader / Người luận giải", "Reader / Người xem bói")
  .replaceAll("chủ báo giá", "Admin báo giá")
  .replaceAll("chủ kích hoạt", "Admin kích hoạt")
  .replaceAll("chủ được", "Admin được")
);

await edit("assets/gate.js", (source) => {
  const marketBlock = `  function marketSigil() {
    return '<span class="market-sigil" aria-hidden="true"></span>';
  }

  function injectCommunity() {
    if (APP !== "boitoan" || document.getElementById("gate-community-link")) return;
    var nav = document.querySelector("body nav");
    if (!nav) {
      setTimeout(injectCommunity, 80);
      return;
    }
    var link = document.createElement("a");
    link.id = "gate-community-link";
    link.className = "gate-community-link";
    link.href = new URL("community.html", location.href).href;
    link.innerHTML = '<span class="i">✦</span><span class="market-nav-label">Cộng đồng</span>';
    link.setAttribute("aria-label", "Mở Spirituality Market");
    nav.appendChild(link);
    document.body.classList.add("market-has-community-nav");
  }

  function applyMarketBranding() {
    if (APP !== "boitoan") return;
    document.body.classList.add("market-brand");
    document.title = "Spirituality Market · Bói toán";
    var headerTitle = document.querySelector("#gate-content .wrap > header h1, body > .wrap > header h1");
    if (headerTitle && !headerTitle.classList.contains("market-brand-title")) {
      headerTitle.classList.add("market-brand-title");
      headerTitle.innerHTML = marketSigil() + '<span>Spirituality Market</span>';
    }
    injectCommunity();
    if (!window.__marketBrandObserver) {
      window.__marketBrandObserver = new MutationObserver(function () { injectCommunity(); });
      window.__marketBrandObserver.observe(document.getElementById("gate-content") || document.body, { childList: true, subtree: true });
    }
  }

`;
  source = insertOnce(source, "  function reveal(method) {", marketBlock, "nhận diện Spirituality Market");

  const onboardingBlock = `  function memberEntryError(code) {
    var messages = {
      invalid_login: "Tên đăng nhập hoặc mật khẩu không đúng.",
      username_exists: "Tên đăng nhập đã được sử dụng.",
      invalid_account: "Thông tin chưa hợp lệ. Tên đăng nhập cần 3–30 ký tự; mật khẩu ít nhất 8 ký tự.",
      display_name_required: "Vui lòng nhập tên hiển thị.",
      account_unavailable: "Tài khoản hiện không khả dụng.",
      decrypt_key_unavailable: "Hệ thống chưa sẵn sàng cấp quyền vào app. Vui lòng báo Admin.",
      rate_limited: "Bạn thao tác quá nhanh. Vui lòng thử lại sau.",
      community_server: "Hệ thống tài khoản đang gặp lỗi. Vui lòng thử lại.",
    };
    return messages[code] || "Không thực hiện được. Vui lòng thử lại.";
  }

  function finishMemberEntry(data, remember, method) {
    if (!data || !data.key || !data.gate_token || !data.token) return Promise.reject(new Error("entry_incomplete"));
    try {
      localStorage.setItem(TOKEN_KEY, data.gate_token);
      localStorage.setItem("community_token_boitoan", data.token);
      sessionStorage.setItem(SESSION_KEY, "1");
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, "1");
        localStorage.setItem("gate_key_" + APP, data.key);
      }
    } catch (e) {}
    return decryptPayload(data.key).then(function (html) {
      injectHtml(html);
      reveal(method || "member");
    });
  }

  function buildBoitoanEntryUI() {
    var root = document.createElement("div");
    root.id = "gate-root";
    root.innerHTML =
      '<div class="gate-card gate-member-card" role="dialog" aria-modal="true" aria-label="Đăng nhập Spirituality Market">' +
        '<div class="gate-sigil market-gate-sigil" aria-hidden="true"><span></span></div>' +
        '<h1 class="gate-title">Spirituality Market</h1>' +
        '<p class="gate-sub">Chọn đúng loại tài khoản trước khi vào ứng dụng.</p>' +
        '<div class="gate-entry-tabs" role="tablist">' +
          '<button type="button" class="active" data-entry-tab="login">Đăng nhập</button>' +
          '<button type="button" data-entry-tab="register">Tạo tài khoản</button>' +
          '<button type="button" data-entry-tab="admin">Admin</button>' +
        '</div>' +
        '<form class="gate-form gate-member-login" autocomplete="on">' +
          '<input class="gate-input" name="username" required minlength="3" maxlength="30" placeholder="Tên đăng nhập" autocomplete="username">' +
          '<input class="gate-input" name="password" type="password" required minlength="8" maxlength="128" placeholder="Mật khẩu" autocomplete="current-password">' +
          '<label class="gate-remember"><input type="checkbox" name="remember" checked> Ghi nhớ trên thiết bị này</label>' +
          '<button class="gate-btn" type="submit">Vào ứng dụng</button>' +
          '<div class="gate-msg" aria-live="polite"></div>' +
        '</form>' +
        '<form class="gate-form gate-member-register" autocomplete="on" hidden>' +
          '<fieldset class="gate-role-choice"><legend>Loại tài khoản</legend>' +
            '<label class="gate-role-card"><input type="radio" name="role" value="guest" checked><span><strong>Khách</strong><small>Xem bài, tìm Reader, trò chuyện và đánh giá.</small></span></label>' +
            '<label class="gate-role-card"><input type="radio" name="role" value="reader"><span><strong>Reader / Người xem bói</strong><small>Tạo hồ sơ chuyên môn, nhận khách và luận giải.</small></span></label>' +
          '</fieldset>' +
          '<input class="gate-input" name="display_name" required maxlength="80" placeholder="Tên hiển thị" autocomplete="name">' +
          '<input class="gate-input" name="username" required pattern="[a-zA-Z0-9_]{3,30}" maxlength="30" placeholder="Tên đăng nhập: chữ, số hoặc _" autocomplete="username">' +
          '<input class="gate-input" name="password" type="password" required minlength="8" maxlength="128" placeholder="Mật khẩu từ 8 ký tự" autocomplete="new-password">' +
          '<label class="gate-remember"><input type="checkbox" name="remember" checked> Ghi nhớ trên thiết bị này</label>' +
          '<p class="gate-privacy">Khi đăng ký, hệ thống gửi Admin: tên hiển thị, tên đăng nhập, vai trò, mã trình duyệt, loại trình duyệt/nền tảng, kích thước màn hình, ngôn ngữ, múi giờ, quốc gia và IP đã rút gọn. Không gửi mật khẩu.</p>' +
          '<button class="gate-btn" type="submit">Tạo tài khoản và vào app</button>' +
          '<div class="gate-msg" aria-live="polite"></div>' +
        '</form>' +
        '<form class="gate-form gate-admin-login" autocomplete="off" hidden>' +
          '<input class="gate-input" name="password" type="password" required placeholder="Mật khẩu Admin" autocomplete="current-password">' +
          '<label class="gate-remember"><input type="checkbox" name="remember" checked> Ghi nhớ thiết bị Admin</label>' +
          '<button class="gate-btn" type="submit">Đăng nhập Admin</button>' +
          '<div class="gate-msg" aria-live="polite"></div>' +
        '</form>' +
        '<div class="gate-foot">Spirituality Market · Truy cập được ghi nhận</div>' +
      '</div>';
    document.body.appendChild(root);

    var forms = {
      login: root.querySelector(".gate-member-login"),
      register: root.querySelector(".gate-member-register"),
      admin: root.querySelector(".gate-admin-login"),
    };
    function show(tab) {
      Object.keys(forms).forEach(function (key) { forms[key].hidden = key !== tab; });
      root.querySelectorAll("[data-entry-tab]").forEach(function (button) {
        button.classList.toggle("active", button.getAttribute("data-entry-tab") === tab);
      });
      var first = forms[tab].querySelector("input:not([type=checkbox]):not([type=radio])");
      if (first) first.focus();
    }
    root.querySelectorAll("[data-entry-tab]").forEach(function (button) {
      button.addEventListener("click", function () { show(button.getAttribute("data-entry-tab")); });
    });

    function entryRequest(path, payload) {
      return fetch(BACKEND + path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.assign({ entry: true, device_id: deviceId(), device: fingerprint() }, payload)),
      }).then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (data) {
          if (!response.ok) { var error = new Error(data.error || "entry_failed"); error.code = data.error || "entry_failed"; throw error; }
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
        msg.textContent = data.telegram_notified === false ? "Đã tạo tài khoản. Đang mở app; thông báo Telegram chưa gửi được." : "Đã tạo tài khoản. Đang mở app…";
        return finishMemberEntry(data, form.remember.checked, "member-register");
      }).catch(function (error) { button.disabled = false; msg.className = "gate-msg err"; msg.textContent = memberEntryError(error.code || error.message); });
    });

    forms.admin.addEventListener("submit", function (event) {
      event.preventDefault();
      var form = forms.admin, button = form.querySelector("button[type=submit]"), msg = form.querySelector(".gate-msg");
      button.disabled = true; msg.className = "gate-msg wait"; msg.textContent = "Đang kiểm tra Admin…";
      unlockLocalOrEncrypted(form.password.value, form.remember.checked).catch(function () {
        button.disabled = false; msg.className = "gate-msg err"; msg.textContent = "Mật khẩu Admin không đúng.";
      });
    });
  }

`;
  source = insertOnce(source, "  /* -------------------------- giao diện khóa -------------------------- */", onboardingBlock, "onboarding đầu ứng dụng");
  if (!source.includes('if (APP === "boitoan" && MODE === "approval") { buildBoitoanEntryUI(); return; }')) {
    source = source.replace(
      "  function buildUI() {\n",
      '  function buildUI() {\n    if (APP === "boitoan" && MODE === "approval") { buildBoitoanEntryUI(); return; }\n'
    );
  }

  if (!source.includes("    applyMarketBranding();\n    trackAccess")) {
    source = source.replace("    injectAdvice();\n    trackAccess", "    injectAdvice();\n    applyMarketBranding();\n    trackAccess");
  }

  source = source
    .replaceAll("Cái Chợ của Hiên Nhi", "Spirituality Market")
    .replaceAll("Chủ sở hữu", "Admin")
    .replaceAll("chủ sở hữu", "Admin")
    .replaceAll("chủ app", "Admin")
    .replaceAll("Chủ app", "Admin")
    .replaceAll("chủ báo giá", "Admin báo giá")
    .replaceAll("chủ kích hoạt", "Admin kích hoạt")
    .replaceAll("chủ sẽ duyệt", "Admin sẽ duyệt")
    .replaceAll("báo chủ", "báo Admin")
    .replace('var TITLE = CFG.title || "Khu vực riêng tư";', 'var TITLE = CFG.title || "Spirituality Market";')
    .replace('<div class="gate-sigil">🔒</div>', '<div class="gate-sigil market-gate-sigil" aria-hidden="true"><span></span></div>')
    .replace('<div class="gate-foot">Khu vực riêng tư · Không lập chỉ mục · Truy cập được ghi nhận</div>', '<div class="gate-foot">Spirituality Market · Truy cập được ghi nhận</div>')
    .replace('"Admin: " + CFG.owner + " · Khu vực riêng tư · Không lập chỉ mục"', '"Spirituality Market · Truy cập được ghi nhận"')
    .replace('var bg = document.createElement("div"); bg.className = "gate-owner-bg"; bg.textContent = name;', 'var bg = document.createElement("div"); bg.className = "gate-owner-pattern";\n    for (var i = 0; i < 18; i++) { var mark = document.createElement("span"); mark.textContent = name; bg.appendChild(mark); }')
    .replace('bot.textContent = "✦ " + name + " · khu vực riêng tư ✦";', 'bot.textContent = "✦ " + name + " ✦";');

  if (!source.includes('localStorage.removeItem("community_token_boitoan")')) {
    source = source.replace(
      '        if (APP === "boitoan") localStorage.removeItem(TOKEN_KEY);',
      '        if (APP === "boitoan") {\n          localStorage.removeItem(TOKEN_KEY);\n          localStorage.removeItem("community_token_boitoan");\n        }'
    );
  }
  return source;
});

await edit("assets/gate.css", (source) => {
  if (!source.includes("/* Spirituality Market: runtime integration */")) {
    source += `

/* Spirituality Market: runtime integration */
.gate-app-boitoan body { font-family: ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif !important; text-rendering:optimizeLegibility; }
.gate-app-boitoan h1,.gate-app-boitoan h2,.gate-app-boitoan h3,.gate-app-boitoan .btn,.gate-app-boitoan .back { font-family:ui-serif,"New York","Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif !important; }
.market-gate-sigil,.market-sigil { position:relative;display:inline-block;width:42px;height:42px;border:1px solid #d4a94eaa;border-radius:50%;background:radial-gradient(circle at 38% 34%,#8b6fd066,#171124 64%);box-shadow:0 0 0 5px #d4a94e12,inset 0 0 20px #8b6fd055; }
.market-gate-sigil { margin:0 auto 13px; }
.market-gate-sigil::before,.market-sigil::before { content:"";position:absolute;left:10px;top:9px;width:17px;height:17px;border:2px solid #f5dfa1;border-radius:50%;box-shadow:6px 1px 0 -1px #171124;transform:rotate(-17deg); }
.market-gate-sigil::after,.market-sigil::after { content:"✦";position:absolute;right:6px;top:4px;color:#f5dfa1;font-size:12px;text-shadow:0 0 10px #f5dfa1bb; }
.market-gate-sigil span { display:none; }
.market-brand-title { display:flex !important;align-items:center;justify-content:center;gap:11px;text-transform:none !important;letter-spacing:.055em !important;font-size:clamp(1.18rem,5vw,1.48rem) !important; }
.market-brand-title .market-sigil { width:34px;height:34px;flex:0 0 34px; }
.market-brand-title .market-sigil::before { left:7px;top:6px;width:14px;height:14px; }
.market-brand-title .market-sigil::after { right:5px;top:3px;font-size:10px; }
.gate-app-boitoan nav { display:grid !important;grid-template-columns:repeat(5,minmax(0,1fr));align-items:stretch;justify-content:initial !important;gap:0; }
.gate-app-boitoan nav button,.gate-community-link { min-width:0;width:100%;min-height:52px;padding:2px 2px !important;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;color:var(--ink-faint,#6f668f);background:none;border:0;font:400 .62rem/1.15 ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;text-decoration:none;text-align:center; }
.gate-community-link .i { color:#d4a94e;font-size:1.25rem;line-height:1; }
.gate-community-link .market-nav-label { color:#d4a94e;overflow-wrap:anywhere; }
.gate-community-link:focus-visible { outline:2px solid #a98fe0;outline-offset:-2px;border-radius:8px; }
.gate-owner-pattern { position:absolute;inset:-22vh -25vw;display:grid;grid-template-columns:repeat(3,minmax(180px,1fr));grid-auto-rows:18vh;align-items:center;justify-items:center;transform:rotate(-22deg) scale(1.08);opacity:.075; }
.gate-owner-pattern span { color:#8b6fd0;font:700 clamp(17px,3.4vw,38px)/1.1 ui-serif,Georgia,serif;letter-spacing:.055em;white-space:nowrap;user-select:none; }
.gate-owner-top,.gate-owner-bottom { font-family:ui-serif,"New York",Georgia,serif; }
.gate-member-card { width:min(94vw,520px);max-height:calc(100dvh - 24px);overflow:auto; }
.gate-entry-tabs { display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:14px 0; }
.gate-entry-tabs button { border:1px solid #332a52;border-radius:10px;background:#161226;color:#a89fc4;padding:10px 6px;font:600 .78rem/1.2 ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
.gate-entry-tabs button.active { color:#f5dfa1;border-color:#d4a94e;background:#2a2213; }
.gate-role-choice { border:0;padding:0;margin:0 0 10px;display:grid;gap:8px; }
.gate-role-choice legend { color:#d4a94e;font-size:.84rem;margin-bottom:6px; }
.gate-role-card { position:relative;display:flex;align-items:flex-start;gap:9px;padding:11px;border:1px solid #332a52;border-radius:12px;background:#161226;text-align:left; }
.gate-role-card:has(input:checked) { border-color:#d4a94e;background:#241d3d;box-shadow:0 0 0 2px #d4a94e18; }
.gate-role-card input { margin-top:3px;accent-color:#d4a94e; }
.gate-role-card span { display:grid;gap:2px; }
.gate-role-card strong { color:#e8e2f4;font-size:.9rem; }
.gate-role-card small { color:#a89fc4;font-size:.72rem;line-height:1.35; }
.gate-privacy { color:#8f86a8;font-size:.68rem;line-height:1.45;text-align:left;margin:8px 0 2px; }
@media (max-width:380px) { .gate-app-boitoan nav button,.gate-community-link{font-size:.56rem}.market-brand-title{font-size:1.08rem !important;gap:7px}.market-brand-title .market-sigil{width:30px;height:30px;flex-basis:30px}.gate-entry-tabs button{font-size:.7rem;padding:9px 3px} }
`;
  }
  source = source.replaceAll("Cái Chợ của Hiên Nhi", "Spirituality Market");
  return source;
});

await edit("boitoan/sw.js", (source) => {
  const oldAssets = '"/assets/gate.css","/assets/gate.js"';
  const newAssets = '"/assets/gate.css","/assets/gate.js","/assets/community.css","/assets/community.js","/assets/community-admin.js"';
  if (!source.includes("/assets/community.js")) {
    if (!source.includes(oldAssets)) throw new Error("Không tìm thấy danh sách asset Bói toán");
    source = source.replace(oldAssets, newAssets);
  }
  return source;
});

const checks = [
  ["assets/gate.js", ["buildBoitoanEntryUI", "Spirituality Market", "/api/community/register", "Đăng nhập Admin"]],
  ["backend/community.js", ["publicEntry", "issueGateSession", "notifyNewMember", "telegram_notified"]],
  ["boitoan/community.html", ["Spirituality Market", "Reader / Người xem bói"]],
];
for (const [path, markers] of checks) {
  const source = await readFile(path, "utf8");
  for (const marker of markers) if (!source.includes(marker)) throw new Error(`Thiếu marker ${marker} trong ${path}`);
}

console.log("Đã áp dụng Spirituality Market, onboarding Khách / Reader / Người xem bói và quyền Admin.");
