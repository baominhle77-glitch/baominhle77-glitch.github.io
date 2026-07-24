import { readFile, writeFile } from "node:fs/promises";

const path = "backend/worker.js";
const importLine = 'import { handleChoiceRequest, handleChoiceTelegramUpdate } from "./choice.js";';
const requestMarker = "Hội Chọn Đúng API integration v1";
const telegramMarker = "Hội Chọn Đúng Telegram integration v1";

let source = await readFile(path, "utf8");

if (!source.includes(importLine)) source = `${importLine}\n${source}`;

if (!source.includes(requestMarker)) {
  const tryPattern = /(\n[ \t]*try \{\r?\n)([ \t]*)(?=(?:\/\/ Travel API integration v1|const travelResponse|const communityResponse|if \(url\.pathname === "\/api\/request"))/;
  const match = source.match(tryPattern);
  if (!match) throw new Error("Không tìm thấy điểm nối Hội Chọn Đúng API trong backend/worker.js");
  const indent = match[2];
  const hook = `${match[1]}${indent}// ${requestMarker}\n${indent}const choiceResponse = await handleChoiceRequest(request, env);\n${indent}if (choiceResponse) return withCors(choiceResponse, cors);\n\n${indent}`;
  source = source.replace(tryPattern, hook);
}

if (!source.includes(telegramMarker)) {
  const telegramNeedle = '  if (await env.KV.get(updateKey)) return json({ ok: true, duplicate: true });\n';
  const index = source.indexOf(telegramNeedle);
  if (index < 0) throw new Error("Không tìm thấy điểm nối Telegram webhook trong backend/worker.js");
  const addition = `${telegramNeedle}\n  // ${telegramMarker}\n  const choiceUpdate = await handleChoiceTelegramUpdate(update, env);\n  if (choiceUpdate && choiceUpdate.handled) {\n    await env.KV.put(updateKey, "1", { expirationTtl: TELEGRAM_UPDATE_TTL });\n    for (const call of choiceUpdate.calls || []) {\n      if (call && call.method && call.body) await tg(env, call.method, call.body);\n    }\n    return json({ ok: true });\n  }\n`;
  source = source.slice(0, index) + addition + source.slice(index + telegramNeedle.length);
}

await writeFile(path, source);
console.log("choice-system-ok: Worker đã có Hội Chọn Đúng API, click redirect và quản trị Telegram");
