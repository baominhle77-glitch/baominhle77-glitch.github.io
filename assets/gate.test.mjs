import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const gate = fs.readFileSync(new URL("./gate.js", import.meta.url), "utf8");
const root = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const boitoan = fs.readFileSync(new URL("../boitoan/index.html", import.meta.url), "utf8");
const medora = fs.readFileSync(new URL("../medora/index.html", import.meta.url), "utf8");

assert.match(gate, /device_id: deviceId\(\)/, "mọi phiên phải gắn mã thiết bị");
assert.match(gate, /[?&]did=" \+ encodeURIComponent\(deviceId\(\)\)/, "poll duyệt phải gắn mã thiết bị");
assert.match(gate, /if \(currentDeviceId\) return currentDeviceId/, "mã thiết bị phải ổn định khi storage bị chặn");

// V11: payload mã hóa phải được giải mã, bơm DOM và kiểm tra nội dung trước reveal.
assert.match(gate, /Bói toán V11/);
assert.match(gate, /function openAppContent\(key, method\)/);
assert.match(gate, /decryptPayload\(key\)[\s\S]*injectHtml\(html\)[\s\S]*host\.children\.length[\s\S]*reveal\(method\)/);
assert.match(gate, /openAppContent\(savedKey, "saved-key"\)/);
assert.match(gate, /openAppContent\(data\.key, "approved"\)/);
assert.match(gate, /openAppContent\(data\.key, "admin-session"\)/);
assert.doesNotMatch(gate, /reveal\("admin-return"\)/);
assert.doesNotMatch(gate, /catch\(function \(\) \{ reveal\("approved"\); \}\)/, "giải mã lỗi không được mở nội dung");
assert.match(gate, /if \(!data\.key\)[\s\S]*Backend chưa có khóa giải mã/, "phiên duyệt mã hóa phải fail-closed khi thiếu key");

// Mật khẩu Admin chỉ được POST đến endpoint đăng nhập.
const passwordPayloadPattern = /JSON\.stringify\(\{[^}]*password\s*:/gis;
const passwordPayloads = [...gate.matchAll(passwordPayloadPattern)];
assert.equal(passwordPayloads.length, 1);
const context = gate.slice(Math.max(0, passwordPayloads[0].index - 700), passwordPayloads[0].index + 500);
assert.match(context, /fetch\(BACKEND \+ "\/api\/community\/admin\/login"[\s\S]*method: "POST"/);
assert.match(context, /body: JSON\.stringify\(\{ password: pass, device_id: deviceId\(\), remember:/);

assert.match(gate, /textContent = String\(message\.text \|\| ""\)/, "tin nhắn phải render bằng textContent");
assert.match(gate, /data\.status === "expired"/, "phiên duyệt hết hạn phải dừng");
assert.match(gate, /data\.error === "telegram_unavailable"[\s\S]*Bot Telegram chưa sẵn sàng/);
assert.match(gate, /document\.querySelectorAll\("\.screen"\)/);
assert.match(gate, /body: JSON\.stringify\(\{ client_id: randomId\(\), section: section, question: text \}\)/);
assert.match(gate, /data\.payment_status === "pending"[\s\S]*setTimeout\(pollAdvice, 5000\)/);
assert.doesNotMatch(gate, /[?&]payment[^\n]*(?:===|==)[^\n]*paid/, "không được tin query thanh toán");

const deviceSectionEnd = gate.indexOf("/* -------------------------- tiện ích mã hóa");
const instrumented = gate.slice(0, deviceSectionEnd)
  .replace("function deviceId() {", "globalThis.__deviceId = function deviceId() {") + "\n})();";
let generated = 0;
const sandbox = {
  window: { GATE: {} },
  document: { documentElement: { classList: { add() {} } } },
  localStorage: { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } },
  crypto: { randomUUID() { generated += 1; return `00000000-0000-4000-8000-${String(generated).padStart(12, "0")}`; } },
};
vm.runInNewContext(instrumented, sandbox);
assert.equal(sandbox.__deviceId(), sandbox.__deviceId());
assert.equal(generated, 1);

for (const [name, html] of [["root", root], ["boitoan", boitoan], ["medora", medora]]) {
  assert.match(html, /(?:src|href)="\/?assets\/gate\.(?:js|css)(?:\?[^\"]*)?"/, `${name} phải dùng gate asset chung`);
}
assert.match(boitoan, /application\/gate-payload/);
assert.match(boitoan, /\/assets\/gate\.js\?v=19/);

console.log("Gate V11 encrypted bootstrap and privacy contracts PASS");
