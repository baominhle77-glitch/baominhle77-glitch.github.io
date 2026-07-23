import assert from "node:assert/strict";
import fs from "node:fs";

const gate = fs.readFileSync(new URL("./gate.js", import.meta.url), "utf8");
const gateCss = fs.readFileSync(new URL("./gate.css", import.meta.url), "utf8");
const community = fs.readFileSync(new URL("./community.js", import.meta.url), "utf8");
const admin = fs.readFileSync(new URL("./community-admin.js", import.meta.url), "utf8");
const adminHtml = fs.readFileSync(new URL("../boitoan/community-admin.html", import.meta.url), "utf8");
const boitoanHtml = fs.readFileSync(new URL("../boitoan/index.html", import.meta.url), "utf8");
const backend = fs.readFileSync(new URL("../backend/community.js", import.meta.url), "utf8");
const deploy = fs.readFileSync(new URL("../.github/workflows/deploy-pages.yml", import.meta.url), "utf8");
const webkitReturn = fs.readFileSync(new URL("../tools/admin-v9-return-webkit-check.mjs", import.meta.url), "utf8");
const e2eWorkflow = fs.readFileSync(new URL("../.github/workflows/e2e-reader-production.yml", import.meta.url), "utf8");
const plaintextPasswordAssignment = /(?:regular|primary|admin)?_?password\s*[:=]\s*["'][^"']{6,}["']/i;

assert.match(gate, /class="gate-entry-choice"/);
assert.match(gate, /data-entry-stage hidden/);
assert.match(gate, /data-entry-open="login"[\s\S]*data-entry-open="register"[\s\S]*data-entry-open="admin"/);
assert.match(gateCss, /input\[type="checkbox"\][\s\S]*width:auto !important/);

assert.match(gate, /Bói toán V11/);
assert.match(gate, /function openAppContent\(/);
assert.match(gate, /decryptPayload\(key\)[\s\S]*injectHtml\(html\)[\s\S]*host\.children\.length[\s\S]*reveal/);
assert.match(gate, /openAppContent\(data\.key, "admin-session"\)/);
assert.doesNotMatch(gate, /reveal\("admin-return"\)/);
assert.match(gate, /function adminReturnRequested\(/);
assert.match(gate, /2026-07-24-v11/);
assert.match(boitoanHtml, /application\/gate-payload/);
assert.match(boitoanHtml, /\/assets\/gate\.js\?v=19/);

assert.match(gate, /\/api\/community\/admin\/login/);
assert.match(gate, /market_admin_token/);
assert.match(gate, /localStorage\.setItem\("market_admin_level", data\.level\)/);
assert.doesNotMatch(gate, /localStorage\.setItem\("market_admin_level"[^\n]+\n[\s\S]{0,180}localStorage\.removeItem\("market_admin_level"\)/);
assert.match(backend, /const ADMIN_AUTH_VERSION = "2026-07-24-v11"/);
assert.match(backend, /device_id: deviceId, key/);
assert.match(backend, /action === "session"[\s\S]*device_id: auth\.did, key/);
assert.doesNotMatch(backend, plaintextPasswordAssignment);

assert.match(community, /function renderPosts\(/);
assert.match(community, /community-role-badge role-/);
assert.match(community, /requestedView === "profile"\) renderProfile\(\)/);
assert.match(community, /tokenClaims\(\)\.mode === "impersonation"/);
assert.match(community, /Chế độ chỉ đọc/);
assert.match(community, /Quay lại khu vực Admin/);

assert.match(admin, /market_admin_token/);
assert.match(admin, /\/api\/community\/admin\/session/);
assert.match(admin, /adminAuthVersion !== ADMIN_AUTH_VERSION/);
assert.match(admin, /if \(primary\) action\.append/);
assert.match(admin, /conversationTab\.hidden=!primary/);
assert.match(admin, /Xóa tài khoản/);
assert.match(admin, /Xem trang cá nhân/);
assert.match(admin, /admin_view=profile/);
assert.match(admin, /Mở bài thảo luận/);
assert.doesNotMatch(admin, /community-admin-token|Mật khẩu Admin/);
assert.match(adminHtml, /data-admin-tab="posts"/);
assert.match(adminHtml, /community-admin-level-badge/);
assert.match(adminHtml, /href="\.\/\?admin_return=1&v=19"/);

assert.match(gate, /if \(labelNode\.textContent !== targetLabel\) labelNode\.textContent = targetLabel/);
assert.doesNotMatch(gate, /link\.querySelector\("\.market-nav-label"\)\.textContent\s*=/);
assert.match(webkitReturn, /createCipheriv/);
assert.match(webkitReturn, /application\/gate-payload/);
assert.match(webkitReturn, /#admin-v11-app-marker/);
assert.match(webkitReturn, /#gate-content \.screen\.active/);
assert.match(webkitReturn, /key: fixtureKey/);

assert.doesNotMatch(deploy, /node tools\/apply-role-system\.mjs/);
assert.doesNotMatch(deploy, /node tools\/apply-account-v2-runner\.mjs/);
assert.match(deploy, /- name: Deploy Worker trước Pages/);
assert.match(deploy, /- name: Deploy Pages/);
assert.ok(deploy.indexOf("- name: Deploy Worker trước Pages") < deploy.indexOf("- name: Deploy Pages"));
assert.match(deploy, /application\/gate-payload/);
assert.match(deploy, /\/assets\/gate\.js\?v=19/);
assert.match(deploy, /openAppContent\(data\.key, \\"admin-session\\"\)/);

assert.match(e2eWorkflow, /workflow_run:/);
assert.match(e2eWorkflow, /role:'reader'/);
assert.match(e2eWorkflow, /playwright@1\.52\.0/);
assert.match(e2eWorkflow, /-X DELETE[\s\S]*\/api\/community\/me/);

console.log("Bói toán V11 direct-source, encrypted bootstrap, roles and deploy contracts PASS");
