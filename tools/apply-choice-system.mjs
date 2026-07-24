import { readFile, writeFile } from "node:fs/promises";

const workerPath = "backend/worker.js";
const autopilotPath = "backend/choice-autopilot.js";
const choiceImportLine = 'import { handleChoiceRequest, handleChoiceTelegramUpdate } from "./choice.js";';
const oldAutopilotImportLine = 'import { handleChoiceAutopilotRequest, handleChoiceAutopilotTelegram, runChoiceAutopilot } from "./choice-autopilot.js";';
const autopilotImportLine = 'import { handleChoiceAutopilotTelegram, runChoiceAutopilot } from "./choice-autopilot.js";';
const requestMarker = "Hội Chọn Đúng API integration v2";
const telegramMarker = "Hội Chọn Đúng Telegram integration v2";
const scheduledMarker = "Hội Chọn Đúng Autopilot scheduled v2";
const privateStatusMarker = "Hội Chọn Đúng internal status boundary v3";

let source = await readFile(workerPath, "utf8");

if (!source.includes(choiceImportLine)) source = `${choiceImportLine}\n${source}`;
source = source.replace(oldAutopilotImportLine, autopilotImportLine);
if (!source.includes(autopilotImportLine)) source = `${autopilotImportLine}\n${source}`;

const oldPublicStatusHook = `const choiceAutopilotResponse = await handleChoiceAutopilotRequest(request, env);\n  if (choiceAutopilotResponse) return withCors(choiceAutopilotResponse, cors);`;
const privateStatusHook = `// ${privateStatusMarker}\n  if (url.pathname.startsWith("/api/choice/autopilot/")) {\n    return withCors(json({ error: "not_found" }, 404), cors);\n  }`;
source = source.replace(oldPublicStatusHook, privateStatusHook);

if (!source.includes(requestMarker)) {
  const tryPattern = /(\n[ \t]*try \{\r?\n)([ \t]*)(?=(?:\/\/ Travel API integration v1|const travelResponse|const communityResponse|if \(url\.pathname === "\/api\/request"))/;
  const match = source.match(tryPattern);
  if (!match) throw new Error("Không tìm thấy điểm nối Hội Chọn Đúng API trong backend/worker.js");
  const indent = match[2];
  const hook = `${match[1]}${indent}// ${requestMarker}\n${indent}// Hội Chọn Đúng API integration v1 compatibility marker\n${indent}if (url.pathname === "/api/choice/autopilot/run" && request.method === "POST") {\n${indent}  const expected = String(env.CHOICE_AUTOPILOT_TRIGGER || "");\n${indent}  const provided = String(request.headers.get("x-choice-autopilot-trigger") || "");\n${indent}  if (!expected || !secureEqual(expected, provided)) return withCors(json({ error: "unauthorized" }, 401), cors);\n${indent}  return withCors(json(await runChoiceAutopilot(env, { trigger: "deploy" })), cors);\n${indent}}\n${indent}// ${privateStatusMarker}\n${indent}if (url.pathname.startsWith("/api/choice/autopilot/")) {\n${indent}  return withCors(json({ error: "not_found" }, 404), cors);\n${indent}}\n${indent}const choiceResponse = await handleChoiceRequest(request, env);\n${indent}if (choiceResponse) return withCors(choiceResponse, cors);\n\n${indent}`;
  source = source.replace(tryPattern, hook);
}

if (!source.includes(privateStatusMarker)) {
  const runEnd = '  return withCors(json(await runChoiceAutopilot(env, { trigger: "deploy" })), cors);\n  }';
  if (!source.includes(runEnd)) throw new Error("Không tìm thấy điểm khóa status Autopilot");
  source = source.replace(runEnd, `${runEnd}\n  // ${privateStatusMarker}\n  if (url.pathname.startsWith("/api/choice/autopilot/")) {\n    return withCors(json({ error: "not_found" }, 404), cors);\n  }`);
}

if (!source.includes(telegramMarker)) {
  const telegramNeedle = '  if (await env.KV.get(updateKey)) return json({ ok: true, duplicate: true });\n';
  const index = source.indexOf(telegramNeedle);
  if (index < 0) throw new Error("Không tìm thấy điểm nối Telegram webhook trong backend/worker.js");
  const addition = `${telegramNeedle}\n  // ${telegramMarker}\n  // Hội Chọn Đúng Telegram integration v1 compatibility marker\n  const choiceAutopilotOwner = String(env.TELEGRAM_CHAT_ID || "");\n  const choiceAutopilotIsOwner = !!choiceAutopilotOwner\n    && String(update?.message?.chat?.id || "") === choiceAutopilotOwner\n    && String(update?.message?.from?.id || "") === choiceAutopilotOwner;\n  const choiceAutopilotCommand = String(update?.message?.text || "").trim().split(/\\s+/, 1)[0].toLowerCase().split("@")[0];\n  const choiceAutopilotInput = choiceAutopilotCommand === "/chon"\n    ? { ...update, message: { ...update.message, text: "/autopilot" } }\n    : update;\n  const choiceAutopilotUpdate = choiceAutopilotIsOwner\n    ? await handleChoiceAutopilotTelegram(choiceAutopilotInput, env)\n    : null;\n  if (choiceAutopilotUpdate && choiceAutopilotUpdate.handled) {\n    await env.KV.put(updateKey, "1", { expirationTtl: TELEGRAM_UPDATE_TTL });\n    for (const call of choiceAutopilotUpdate.calls || []) {\n      if (call && call.method && call.body) await tg(env, call.method, call.body);\n    }\n    return json({ ok: true });\n  }\n  const choiceUpdate = await handleChoiceTelegramUpdate(update, env);\n  if (choiceUpdate && choiceUpdate.handled) {\n    await env.KV.put(updateKey, "1", { expirationTtl: TELEGRAM_UPDATE_TTL });\n    for (const call of choiceUpdate.calls || []) {\n      if (call && call.method && call.body) await tg(env, call.method, call.body);\n    }\n    return json({ ok: true });\n  }\n`;
  source = source.slice(0, index) + addition + source.slice(index + telegramNeedle.length);
}

if (!source.includes(scheduledMarker)) {
  const scheduledNeedle = "\n  },\n};\n\nfunction withCors";
  const index = source.indexOf(scheduledNeedle);
  if (index < 0) throw new Error("Không tìm thấy điểm nối scheduled trong backend/worker.js");
  const addition = `\n  },\n  // ${scheduledMarker}\n  async scheduled(controller, env, ctx) {\n    ctx.waitUntil(runChoiceAutopilot(env, {\n      trigger: "cron",\n      scheduled_time: controller?.scheduledTime || Date.now()\n    }));\n  },\n};\n\nfunction withCors`;
  source = source.slice(0, index) + addition + source.slice(index + scheduledNeedle.length);
}

await writeFile(workerPath, source);

let autopilot = await readFile(autopilotPath, "utf8");
const replacements = [
  ['utm_medium: "autopilot"', 'utm_medium: "recommendation"'],
  ['slugify(`at-${candidate.category}-${candidate.source_id}`)', 'slugify(`goi-y-${candidate.category}-${candidate.source_id}`)'],
  ['summary: `${candidate.title} từ ${candidate.shop_name}; ${soldText}, ${discountText}. Hệ thống tự chọn dựa trên độ phù hợp, sức bán và tính khả dụng.`', 'summary: `${candidate.title} từ ${candidate.shop_name}; ${soldText}, ${discountText}. Phù hợp để tham khảo khi bạn ưu tiên tính khả dụng và thông tin bán hàng rõ ràng.`'],
  ['`Được Autopilot xếp hạng ${candidate.opportunity_score}/100`', '"Thông tin sản phẩm đã được đối chiếu trước khi đưa vào danh sách"'],
  ['tags: [...new Set([candidate.keyword, candidate.shop_name, "autopilot", "accesstrade"])]', 'tags: [...new Set([candidate.keyword, candidate.shop_name])]']
];
for (const [before, after] of replacements) autopilot = autopilot.replace(before, after);
for (const forbidden of ['utm_medium: "autopilot"', 'Được Autopilot xếp hạng', '"autopilot", "accesstrade"', 'Hệ thống tự chọn dựa trên']) {
  if (autopilot.includes(forbidden)) throw new Error(`Dữ liệu public còn nhãn nội bộ: ${forbidden}`);
}
await writeFile(autopilotPath, autopilot);

console.log("choice-system-ok: API nội bộ đã khóa, Telegram/cron giữ nguyên và dữ liệu public đã được làm sạch");
