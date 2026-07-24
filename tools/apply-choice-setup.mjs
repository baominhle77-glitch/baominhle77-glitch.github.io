import { readFile, writeFile } from "node:fs/promises";

const path = "backend/worker.js";
const importLine = 'import { handleChoiceSetupRequest, handleChoiceSetupTelegram } from "./choice-setup.js";';
const routeMarker = "Hội Chọn Đúng owner setup route v1";
const telegramMarker = "Hội Chọn Đúng owner setup Telegram v1";
const revenueRouteMarker = "Hội Chọn Đúng owner revenue route v1";
const revenueTelegramMarker = "Hội Chọn Đúng owner revenue Telegram v1";

let source = await readFile(path, "utf8");
if (!source.includes(importLine)) source = `${importLine}\n${source}`;

if (!source.includes(routeMarker)) {
  const needle = `  // ${revenueRouteMarker}\n`;
  if (!source.includes(needle)) throw new Error("Không tìm thấy owner revenue route để nối setup");
  const hook = [
    `  // ${routeMarker}`,
    "  const choiceSetupResponse = await handleChoiceSetupRequest(request, env);",
    "  if (choiceSetupResponse) return choiceSetupResponse;",
    ""
  ].join("\n");
  source = source.replace(needle, `${hook}\n${needle}`);
}

if (!source.includes(telegramMarker)) {
  const needle = `  // ${revenueTelegramMarker}\n`;
  if (!source.includes(needle)) throw new Error("Không tìm thấy owner revenue Telegram để nối setup");
  const hook = [
    `  // ${telegramMarker}`,
    "  const choiceSetupUpdate = choiceAutopilotIsOwner",
    "    ? await handleChoiceSetupTelegram(update, env)",
    "    : null;",
    "  if (choiceSetupUpdate && choiceSetupUpdate.handled) {",
    "    await env.KV.put(updateKey, \"1\", { expirationTtl: TELEGRAM_UPDATE_TTL });",
    "    for (const call of choiceSetupUpdate.calls || []) {",
    "      if (call && call.method && call.body) await tg(env, call.method, call.body);",
    "    }",
    "    return json({ ok: true });",
    "  }",
    ""
  ].join("\n");
  source = source.replace(needle, `${hook}\n${needle}`);
}

for (const required of [importLine, routeMarker, telegramMarker, "handleChoiceSetupRequest", "handleChoiceSetupTelegram"]) {
  if (!source.includes(required)) throw new Error(`Worker thiếu tích hợp setup: ${required}`);
}

await writeFile(path, source);
console.log("choice-setup-ok: route và Telegram owner-only đã nối idempotent vào Worker");
