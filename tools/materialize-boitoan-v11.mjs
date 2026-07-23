import { readFile, writeFile, rm, mkdtemp } from "node:fs/promises";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = new URL("../", import.meta.url);
const chunkNames = [0, 1, 2, 3, 4].map((n) => `.migration/boitoan-v11-patch-${String(n).padStart(2, "0")}.b64`);
const expectedB64 = "1c63deaf7cef5d1731884f67466cf03806b89766b6c33c52fd391a9f9dae47f5";
const expectedPatch = "df68060cc86109255a6bff0518632de0196baa8794bdee793db8a35903282de0";
const legacy = [
  "apply-role-system.mjs", "apply-account-v2.mjs", "apply-account-v2-profile-view.mjs",
  "apply-account-v2-runner.mjs", "apply-account-v3-hotfix.mjs", "apply-account-v4-edge-auth.mjs",
  "apply-admin-session-v5.mjs", "apply-admin-levels-v6.mjs", "apply-admin-v7-login-hotfix.mjs",
  "apply-admin-v8-edge-login.mjs", "apply-admin-v8-tests.mjs", "apply-admin-v9-return-to-app.mjs",
  "apply-admin-v10-authoritative-return.mjs", "apply-admin-v5-v6-runner.mjs"
];

function sha(value) { return createHash("sha256").update(value).digest("hex"); }
const b64 = (await Promise.all(chunkNames.map((name) => readFile(new URL(name, root), "utf8")))).join("");
if (sha(b64) !== expectedB64) throw new Error("Các mảnh migration V11 không khớp checksum");
const patch = gunzipSync(Buffer.from(b64, "base64"));
if (sha(patch) !== expectedPatch) throw new Error("Patch V11 không khớp checksum");

const temp = await mkdtemp(join(tmpdir(), "boitoan-v11-"));
const patchPath = join(temp, "v11.patch");
try {
  await writeFile(patchPath, patch);
  const result = spawnSync("patch", ["-p1", "--forward", "--batch", "-i", patchPath], { cwd: new URL(root).pathname, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`Không áp dụng được V11 patch: ${result.status}`);
  for (const name of legacy) {
    await writeFile(new URL(`tools/${name}`, root), `// Legacy migration retained for compatibility. Bói toán V11 uses direct materialized source.\nconsole.log("${name}: no-op on Bói toán V11 direct source.");\n`);
  }
  for (const name of chunkNames) await rm(new URL(name, root), { force: true });
  await rm(new URL(".migration", root), { recursive: true, force: true });
  console.log("Bói toán V11 materialized: direct source, encrypted bootstrap, no legacy patch chain.");
} finally {
  await rm(temp, { recursive: true, force: true });
}
