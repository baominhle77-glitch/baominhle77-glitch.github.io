import { readFile, writeFile } from "node:fs/promises";

async function edit(path, mutate) {
  const before = await readFile(path, "utf8");
  const after = mutate(before);
  if (after !== before) await writeFile(path, after, "utf8");
}

await edit("backend/account-v2.test.mjs", (source) => source
  .replaceAll("ADMIN_V7_", "ADMIN_V8_")
  .replaceAll("Account V7", "Account V8"));

await edit("backend/community.test.mjs", (source) => source
  .replaceAll("ADMIN_V7_", "ADMIN_V8_")
  .replaceAll("Account V7", "Account V8"));

await edit("assets/account-v2.test.mjs", (source) => {
  if (!source.includes('const adminV8 = fs.readFileSync(new URL("../tools/apply-admin-v8-edge-login.mjs", import.meta.url), "utf8");')) {
    source = source.replace(
      'const adminV6 = fs.readFileSync(new URL("../tools/apply-admin-levels-v6.mjs", import.meta.url), "utf8");',
      'const adminV6 = fs.readFileSync(new URL("../tools/apply-admin-levels-v6.mjs", import.meta.url), "utf8");\nconst adminV8 = fs.readFileSync(new URL("../tools/apply-admin-v8-edge-login.mjs", import.meta.url), "utf8");'
    );
  }
  if (!source.includes('assert.match(gate, /Account V8 frontend auth contract/);')) {
    source = source.replace(
      'assert.match(gate, /market_admin_level/, "phải lưu cấp Admin do backend trả về");',
      'assert.match(gate, /market_admin_level/, "phải lưu cấp Admin do backend trả về");\nassert.match(gate, /Account V8 frontend auth contract/);\nassert.match(gate, /2026-07-23-v8/);'
    );
  }
  if (!source.includes('assert.match(adminV8, /adminAuthHealth/);')) {
    source = source.replace(
      'assert.doesNotMatch(adminV6, /hiennhi89|hiennhihien8991/, "không được ghi mật khẩu Admin dạng rõ trong source");',
      'assert.doesNotMatch(adminV6, /hiennhi89|hiennhihien8991/, "không được ghi mật khẩu Admin dạng rõ trong source");\nassert.match(adminV8, /PBKDF2 10000 vòng phù hợp edge/);\nassert.match(adminV8, /adminAuthHealth/);\nassert.match(adminV8, /admin_auth_unavailable/);\nassert.doesNotMatch(adminV8, /hiennhi89|hiennhihien8991/, "V8 không được ghi mật khẩu Admin dạng rõ");'
    );
  }
  source = source.replace(
    'console.log("Account V6 dual Admin roles, frontend and WebKit production E2E contracts PASS");',
    'console.log("Account V8 edge-safe dual Admin roles, frontend and WebKit production E2E contracts PASS");'
  );
  return source;
});

for (const [path, markers] of [
  ["backend/account-v2.test.mjs", ["ADMIN_V8_PASSWORD_SALT_B64", "Account V8"]],
  ["backend/community.test.mjs", ["ADMIN_V8_PASSWORD_SALT_B64"]],
  ["assets/account-v2.test.mjs", ["adminV8", "Account V8 frontend auth contract", "adminAuthHealth"]],
]) {
  const value = await readFile(path, "utf8");
  for (const marker of markers) if (!value.includes(marker)) throw new Error(`Thiếu marker ${marker} trong ${path}`);
}

console.log("Account V8 test contracts updated.");
