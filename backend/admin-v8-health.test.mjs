import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { handleCommunity } from "./community.js";

class MemoryKV {
  constructor() { this.map = new Map(); }
  async get(key) { return this.map.get(key) ?? null; }
  async put(key, value) { this.map.set(key, String(value)); }
  async delete(key) { this.map.delete(key); }
  async list({ prefix = "", limit = 1000 } = {}) {
    const keys = [...this.map.keys()].filter((key) => key.startsWith(prefix)).slice(0, limit).map((name) => ({ name }));
    return { keys, list_complete: true };
  }
}

const toml = await readFile(new URL("./wrangler.toml", import.meta.url), "utf8");
function readVar(name) {
  const match = toml.match(new RegExp(`^${name}\\s*=\\s*"([^"]+)"`, "m"));
  assert.ok(match, `Thiếu ${name} trong wrangler.toml`);
  return match[1];
}

const env = {
  KV: new MemoryKV(),
  SESSION_SECRET: "s".repeat(64),
  ADMIN_V8_PASSWORD_SALT_B64: readVar("ADMIN_V8_PASSWORD_SALT_B64"),
  ADMIN_V8_REGULAR_PASSWORD_HASH_B64: readVar("ADMIN_V8_REGULAR_PASSWORD_HASH_B64"),
  ADMIN_V8_PRIMARY_PASSWORD_HASH_B64: readVar("ADMIN_V8_PRIMARY_PASSWORD_HASH_B64"),
  ADMIN_V8_PASSWORD_ITERATIONS: readVar("ADMIN_V8_PASSWORD_ITERATIONS"),
  DECRYPT_KEY_BOITOAN: "test-health-decrypt-key",
};

const response = await handleCommunity(new Request("https://worker.test/api/community/admin/health"), env);
assert.equal(response.status, 200, "Admin V11 crypto health phải chạy được với cấu hình deploy thật");
const data = await response.json();
assert.equal(data.service, "community-admin");
assert.equal(data.auth_version, "2026-07-24-v11");
assert.equal(data.algorithm, "PBKDF2-SHA256");
assert.equal(data.iterations, 10000);
assert.equal(data.config_ok, true);
assert.equal(data.crypto_ok, true);
assert.equal(data.decrypt_key_configured, true);

console.log("Admin V11 production config, decrypt key and edge crypto health PASS");
