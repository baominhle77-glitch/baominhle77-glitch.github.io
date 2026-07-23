import { readFile, writeFile } from "node:fs/promises";

const path = "backend/worker.js";
const importLine = 'import { handleTravelRequest, handleTravelTelegramUpdate } from "./travel.js";';
const requestMarker = "Travel API integration v1";
const telegramMarker = "Travel Telegram integration v1";

let source = await readFile(path, "utf8");

if (!source.includes(importLine)) source = `${importLine}\n${source}`;

if (!source.includes(requestMarker)) {
  const tryPattern = /(\n[ \t]*try \{\r?\n)([ \t]*)(?=(?:const communityResponse|if \(url\.pathname === "\/api\/request"))/;
  const match = source.match(tryPattern);
  if (!match) throw new Error("Không tìm thấy điểm nối Travel API trong backend/worker.js");
  const indent = match[2];
  const hook = `${match[1]}${indent}// ${requestMarker}\n${indent}const travelResponse = await handleTravelRequest(request, env);\n${indent}if (travelResponse) return withCors(travelResponse, cors);\n\n${indent}`;
  source = source.replace(tryPattern, hook);
}

if (!source.includes(telegramMarker)) {
  const telegramNeedle = '  if (await env.KV.get(updateKey)) return json({ ok: true, duplicate: true });\n';
  const index = source.indexOf(telegramNeedle);
  if (index < 0) throw new Error("Không tìm thấy điểm nối Telegram webhook trong backend/worker.js");
  const addition = `${telegramNeedle}\n  // ${telegramMarker}\n  const travelUpdate = await handleTravelTelegramUpdate(update, env);\n  if (travelUpdate && travelUpdate.handled) {\n    // Ghi nhận update trước khi gọi Telegram để mutation không bị chạy lại nếu API Telegram lỗi.\n    await env.KV.put(updateKey, "1", { expirationTtl: TELEGRAM_UPDATE_TTL });\n    for (const call of travelUpdate.calls || []) {\n      if (call && call.method && call.body) await tg(env, call.method, call.body);\n    }\n    return json({ ok: true });\n  }\n`;
  source = source.slice(0, index) + addition + source.slice(index + telegramNeedle.length);
}

await writeFile(path, source);
console.log("travel-system-ok: Worker đã có Travel API và điều khiển Telegram");
