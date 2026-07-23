import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const gate = fs.readFileSync(new URL("./gate.js", import.meta.url), "utf8");
const root = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const boitoan = fs.readFileSync(new URL("../boitoan/index.html", import.meta.url), "utf8");
const medora = fs.readFileSync(new URL("../medora/index.html", import.meta.url), "utf8");

assert.match(gate, /device_id: deviceId\(\)/, "request/access must include browser profile UUID");
assert.match(gate, /[?&]did=" \+ encodeURIComponent\(deviceId\(\)\)/, "status polling must bind approval to browser profile UUID");
assert.match(gate, /if \(currentDeviceId\) return currentDeviceId/, "browser ID must remain stable when storage is blocked");
assert.match(gate, /reveal\("password"\)/);
assert.match(gate, /reveal\("approved"\)/);
assert.match(gate, /reveal\("saved-key"\)/);
assert.match(gate, /return "session"/);
assert.match(gate, /return "remembered"/);

const passwordPayloadPattern = /JSON\.stringify\(\{[^}]*pass(?:word)?\s*:/gis;
const passwordPayloads = [...gate.matchAll(passwordPayloadPattern)];
assert.equal(passwordPayloads.length, 1, "chỉ request đăng nhập Admin được phép chứa mật khẩu");
const passwordPayloadIndex = passwordPayloads[0].index;
const passwordPayloadContext = gate.slice(Math.max(0, passwordPayloadIndex - 700), passwordPayloadIndex + 500);
assert.match(passwordPayloadContext, /fetch\(BACKEND \+ "\/api\/community\/admin\/login"[\s\S]*method: "POST"/, "mật khẩu chỉ được gửi bằng POST tới endpoint Admin login");
assert.match(passwordPayloadContext, /body: JSON\.stringify\(\{ password: pass, device_id: deviceId\(\), remember:/, "payload Admin login chỉ gồm thông tin xác thực cần thiết");

assert.match(gate, /textContent = String\(message\.text \|\| ""\)/, "chat messages must render as text");
assert.match(gate, /data\.status === "expired"/, "expired approval must stop polling and stay locked");
assert.doesNotMatch(gate, /catch\(function \(\) \{ reveal\("approved"\); \}\)/, "decryption failure must not reveal content");
assert.match(gate, /if \(!data\.key\)[\s\S]*Backend chưa có khóa giải mã/, "encrypted approval must fail closed without a key");
assert.match(gate, /data\.error === "telegram_unavailable"[\s\S]*Bot Telegram chưa sẵn sàng/,
  "Telegram outage must be explained without reporting a pending approval");
assert.match(gate, /document\.querySelectorAll\("\.screen"\)/, "advice action must be added to every Bói toán screen");
assert.match(gate, /body: JSON\.stringify\(\{ client_id: randomId\(\), section: section, question: text \}\)/,
  "advice request must use a retry ID and current section");
assert.match(gate, /adviceId = data\.id;[\s\S]*sessionStorage\.setItem\(adviceStorageKey, adviceId\)[\s\S]*pollAdvice\(\)/,
  "advice request must survive reload while waiting for a quote");
assert.match(gate, /data\.payment_status === "pending"[\s\S]*setTimeout\(pollAdvice, 5000\)/,
  "pending payment must continue polling verified backend status");
assert.match(gate, /history\.replaceState\(null, "", cleanUrl\.href\)/,
  "payment return query must be removed after restoring advice");
assert.doesNotMatch(gate, /[?&]payment[^\n]*(?:===|==)[^\n]*paid/,
  "frontend must not trust payment return query as proof of payment");

const deviceSectionEnd = gate.indexOf("/* -------------------------- tiện ích mã hóa");
const instrumentedDeviceId = gate.slice(0, deviceSectionEnd)
  .replace("function deviceId() {", "globalThis.__deviceId = function deviceId() {") + "\n})();";
let generated = 0;
const storageBlocked = {
  window: { GATE: {} },
  document: { documentElement: { classList: { add() {} } } },
  localStorage: {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
  },
  crypto: {
    randomUUID() {
      generated += 1;
      return `00000000-0000-4000-8000-${String(generated).padStart(12, "0")}`;
    },
  },
};
vm.runInNewContext(instrumentedDeviceId, storageBlocked);
assert.equal(storageBlocked.__deviceId(), storageBlocked.__deviceId(),
  "browser ID must remain stable for the page lifetime when localStorage throws");
assert.equal(generated, 1, "stable fallback must only generate one browser ID");

for (const [name, html] of [["root", root], ["boitoan", boitoan], ["medora", medora]]) {
  assert.match(html, /(?:src|href)="\/?assets\/gate\.(?:js|css)"/, `${name} must use shared gate assets`);
}

console.log("Gate contract and privacy tests PASS");
