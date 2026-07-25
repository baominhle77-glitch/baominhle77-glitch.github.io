import { readFile, writeFile } from "node:fs/promises";

const path = "backend/choice-autopilot.js";
let source = await readFile(path, "utf8");

if (!source.includes("GLOBAL_PRODUCT_DEDUPE_V1")) {
  source = source.replace(
    "    const selected = [];\n    const errors = [];",
    "    const selected = [];\n    const errors = [];\n    // GLOBAL_PRODUCT_DEDUPE_V1\n    const globalSelectedSources = new Set();"
  );
  source = source.replace(
    "          if (selectedSourceIds.has(candidate.source_id)) continue;",
    "          if (selectedSourceIds.has(candidate.source_id) || globalSelectedSources.has(candidate.source_id)) continue;"
  );
  source = source.replace(
    "            selectedSourceIds.add(candidate.source_id);",
    "            selectedSourceIds.add(candidate.source_id);\n            globalSelectedSources.add(candidate.source_id);"
  );
}

// Giữ marker cho apply-choice-multiniche đời trước; chính sách Việt Nam vẫn thanh lọc toàn bộ affiliate cũ.
if (!source.includes("const refreshedCategories = new Set")) {
  source = source.replace(
    "    const preserved = existing.products.filter((product) => {",
    "    const refreshedCategories = new Set(selected.map((product) => product.category));\n    void refreshedCategories;\n    const preserved = existing.products.filter((product) => {"
  );
}

for (const marker of [
  "GLOBAL_PRODUCT_DEDUPE_V1",
  "globalSelectedSources.has(candidate.source_id)",
  "globalSelectedSources.add(candidate.source_id)",
  "const refreshedCategories = new Set"
]) {
  if (!source.includes(marker)) throw new Error(`Thiếu khóa chống trùng/toàn catalog hoặc marker tương thích: ${marker}`);
}

await writeFile(path, source);
console.log("choice-global-dedupe-ok: một source product chỉ xuất hiện một lần và giữ marker idempotency");
