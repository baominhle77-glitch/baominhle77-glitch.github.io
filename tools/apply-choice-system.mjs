import { readFile, writeFile } from "node:fs/promises";

const path = "backend/worker.js";
const choiceImportLine = 'import { handleChoiceRequest, handleChoiceTelegramUpdate } from "./choice.js";';
const autopilotImportLine = 'import { handleChoiceAutopilotRequest, handleChoiceAutopilotTelegram, runChoiceAutopilot } from "./choice-autopilot.js";';
const requestMarker = "Hội Chọn Đúng API integration v2";
const telegramMarker = "Hội Chọn Đúng Telegram integration v2";
const scheduledMarker = "Hội Chọn Đúng Autopilot scheduled v2";

let source = await readFile(path, "utf8");

if (!source.includes(choiceImportLine)) source = `${choiceImportLine}\n${source}`;
if (!source.includes(autopilotImportLine)) source = `${autopilotImportLine}\n${source}`;

if (!source.includes(requestMarker)) {
  const tryPattern = /(\n[ \t]*try \{\r?\n)([ \t]*)(?=(?:\/\/ Travel API integration v1|const travelResponse|const communityResponse|if \(url\.pathname === "\/api\/request"))/;
  const match = source.match(tryPattern);
  if (!match) throw new Error("Không tìm thấy điểm nối Hội Chọn Đúng API trong backend/worker.js");
  const indent = match[2];
  const hook = `${match[1]}${indent}// ${requestMarker}\n${indent}const choiceAutopilotResponse = await handleChoiceAutopilotRequest(request, env);\n${indent}if (choiceAutopilotResponse) return withCors(choiceAutopilotResponse, cors);\n${indent}const choiceResponse = await handleChoiceRequest(request, env);\n${indent}if (choiceResponse) return withCors(choiceResponse, cors);\n\n${indent}`;
  source = source.replace(tryPattern, hook);
}

if (!source.includes(telegramMarker)) {
  const telegramNeedle = '  if (await env.KV.get(updateKey)) return json({ ok: true, duplicate: true });\n';
  const index = source.indexOf(telegramNeedle);
  if (index < 0) throw new Error("Không tìm thấy điểm nối Telegram webhook trong backend/worker.js");
  const addition = `${telegramNeedle}\n  // ${telegramMarker}\n  const choiceAutopilotUpdate = await handleChoiceAutopilotTelegram(update, env);\n  if (choiceAutopilotUpdate && choiceAutopilotUpdate.handled) {\n    await env.KV.put(updateKey, "1", { expirationTtl: TELEGRAM_UPDATE_TTL });\n    for (const call of choiceAutopilotUpdate.calls || []) {\n      if (call && call.method && call.body) await tg(env, call.method, call.body);\n    }\n    return json({ ok: true });\n  }\n  const choiceUpdate = await handleChoiceTelegramUpdate(update, env);\n  if (choiceUpdate && choiceUpdate.handled) {\n    await env.KV.put(updateKey, "1", { expirationTtl: TELEGRAM_UPDATE_TTL });\n    for (const call of choiceUpdate.calls || []) {\n      if (call && call.method && call.body) await tg(env, call.method, call.body);\n    }\n    return json({ ok: true });\n  }\n`;
  source = source.slice(0, index) + addition + source.slice(index + telegramNeedle.length);
}

if (!source.includes(scheduledMarker)) {
  const scheduledNeedle = "\n  },\n};\n\nfunction withCors";
  const index = source.indexOf(scheduledNeedle);
  if (index < 0) throw new Error("Không tìm thấy điểm nối scheduled trong backend/worker.js");
  const addition = `\n  },\n  // ${scheduledMarker}\n  async scheduled(controller, env, ctx) {\n    ctx.waitUntil(runChoiceAutopilot(env, {\n      trigger: "cron",\n      scheduled_time: controller?.scheduledTime || Date.now()\n    }));\n  },\n};\n\nfunction withCors`;
  source = source.slice(0, index) + addition + source.slice(index + scheduledNeedle.length);
}

await writeFile(path, source);
console.log("choice-system-ok: API, Telegram và cron Affiliate Autopilot đã được tích hợp idempotent");
