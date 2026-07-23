import { readFile, writeFile, unlink } from "node:fs/promises";
import { pathToFileURL } from "node:url";

async function importRuntime(templateName) {
  const templatePath = new URL(`./${templateName}`, import.meta.url);
  const runtimePath = new URL(`./.${templateName.replace(/\.mjs$/, "")}-runtime-${process.pid}-${Date.now()}.mjs`, import.meta.url);
  const source = (await readFile(templatePath, "utf8")).replaceAll("community-admin/session", "/api/community/admin/session");
  await writeFile(runtimePath, source, "utf8");
  try {
    await import(pathToFileURL(runtimePath.pathname).href + `?v=${Date.now()}`);
  } finally {
    await unlink(runtimePath).catch(() => {});
  }
}

await importRuntime("apply-admin-session-v5.mjs");
await importRuntime("apply-admin-levels-v6.mjs");

const gatePath = new URL("../assets/gate.js", import.meta.url);
let gate = await readFile(gatePath, "utf8");
const primaryOnly = '        if (!data.token || !data.primary) throw new Error("admin_session_incomplete");';
const dualLevel = '        if (!data.token || (data.level !== "regular" && data.level !== "primary")) throw new Error("admin_session_incomplete");';
if (gate.includes(primaryOnly)) gate = gate.replace(primaryOnly, dualLevel);
else if (!gate.includes(dualLevel)) throw new Error("Không tìm thấy hợp đồng phiên Admin frontend");
await writeFile(gatePath, gate, "utf8");

for (const marker of ["Account V5 single admin login", "Account V6 dual admin UI", "market_admin_level", dualLevel]) {
  if (!gate.includes(marker)) throw new Error(`Thiếu marker Admin frontend: ${marker}`);
}
console.log("Account Admin V5-V6: đăng nhập một lần, hai cấp quyền và frontend nhận regular/primary.");
