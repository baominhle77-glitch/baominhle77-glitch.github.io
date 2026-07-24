import { readFile, writeFile } from "node:fs/promises";

const path = "backend/choice-revenue.js";
let source = await readFile(path, "utf8");

source = source.replace(
  `function aggregateRange(daily, days) {\n  const start = dateDaysAgo(days - 1);\n  const rows = daily.filter((item) => item.date >= start);`,
  `function aggregateRange(daily, days, applyWindow = true) {\n  const start = dateDaysAgo(days - 1);\n  const rows = applyWindow ? daily.filter((item) => item.date >= start) : daily;`
);
source = source.replace(
  "const previous7 = aggregateRange(previous7Rows, 7);",
  "const previous7 = aggregateRange(previous7Rows, 7, false);"
);
source = source.replace(
  "fetch(force?'./api/refresh':'./api/summary'",
  "fetch(force?'/owner/choice/revenue/api/refresh':'/owner/choice/revenue/api/summary'"
);
source = source.replace(
  "fetch('./logout'",
  "fetch('/owner/choice/revenue/logout'"
);

for (const required of [
  "function aggregateRange(daily, days, applyWindow = true)",
  "aggregateRange(previous7Rows, 7, false)",
  "/owner/choice/revenue/api/summary",
  "/owner/choice/revenue/api/refresh",
  "/owner/choice/revenue/logout"
]) {
  if (!source.includes(required)) throw new Error(`Revenue module thiếu bản sửa bắt buộc: ${required}`);
}
for (const forbidden of ["fetch(force?'./api/", "fetch('./logout'"]) {
  if (source.includes(forbidden)) throw new Error(`Revenue module còn URL tương đối sai: ${forbidden}`);
}

await writeFile(path, source);
console.log("choice-revenue-ok: sửa cửa sổ so sánh 7 ngày và endpoint dashboard tuyệt đối");
