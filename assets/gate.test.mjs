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
assert.doesNotMatch(gate, /JSON\.stringify\(\{[^}]*pass(?:word)?\s*:/is, "network JSON must never contain password");
assert.match(gate, /textContent = String\(message\.text \|\| ""\)/, "chat messages must render as text");
assert.match(gate, /data\.status === "expired"/, "expired approval must stop polling and stay locked");
assert.doesNotMatch(gate, /catch\(function \(\) \{ reveal\("approved"\); \}\)/, "decryption failure must not reveal content");
assert.match(gate, /if \(!data\.key\)[\s\S]*Backend chưa có khóa giải mã/, "encrypted approval must fail closed without a key");
assert.match(gate, /data\.error === "telegram_unavailable"[\s\S]*Bot Telegram chưa sẵn sàng/,
  "Telegram outage must be explained without reporting a pending approval");

const deviceSectionEnd = gate.indexOf("/* -------------------------- tiện ích mã hóa");
const instrumentedDeviceId = gate.slice(0, deviceSectionEnd)
  .replace("function deviceId() {", "globalThis.__deviceId = function deviceId() {") + "\n})();";
let generated = 0;
const storageBlocked = {
  window: { GATE: {} },
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
