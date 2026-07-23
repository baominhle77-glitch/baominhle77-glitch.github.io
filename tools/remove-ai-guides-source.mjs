import { readFile, writeFile } from "node:fs/promises";

const target = "tools/apply-role-system.mjs";
const before = await readFile(target, "utf8");
let source = before;

source = source.replace(
  /\n  function marketGuide\(screenId, title, intro, points\) \{[\s\S]*?\n  function applyMarketBranding\(\) \{/,
  "\n  function applyMarketBranding() {"
);

source = source
  .replace(/\n[ \t]*addMarketGuides\(\);/g, "")
  .replace(/\n[ \t]*watchMarketResult\([^\n]+\);/g, "")
  .replace(/\n\.market-guide \{[\s\S]*?\n\.market-dynamic-analysis p \{[^\n]*\}\n/g, "\n");

const forbidden = [
  "function marketGuide",
  "function addMarketGuides",
  "addMarketGuides(",
  "function cardNames",
  "function renderMarketSynthesis",
  "function watchMarketResult",
  "watchMarketResult(",
  "Khung luận Tarot",
  "Khung luận Lenormand",
  "Khung luận Bài Tây",
  "Khung luận Kinh Dịch",
  "Khung luận Tử Vi",
  "Khung luận Bát Tự",
  "Kết nối toàn trải bài",
  ".market-guide",
  ".market-dynamic-analysis"
];

for (const marker of forbidden) {
  if (source.includes(marker)) throw new Error(`Chưa gỡ sạch marker: ${marker}`);
}

for (const required of ["function injectCommunity", "function applyMarketBranding", "market-brand-title"]) {
  if (!source.includes(required)) throw new Error(`Làm mất phần giao diện cần giữ: ${required}`);
}

if (source === before) throw new Error("Không có thay đổi nào được áp dụng.");
await writeFile(target, source);
console.log("Đã gỡ toàn bộ khung luận và phần kết nối trải bài do lớp bổ sung tạo ra.");
