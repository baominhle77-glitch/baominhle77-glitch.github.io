import { readFile, writeFile } from "node:fs/promises";

const path = "backend/worker.js";
const importLine = 'import { handleChoiceCredentialBootstrapRequest } from "./choice-credential-bootstrap.js";';
const marker = "Hội Chọn Đúng credential bootstrap route v1";
const setupMarker = "Hội Chọn Đúng owner setup route v1";

let source = await readFile(path, "utf8");
if (!source.includes(importLine)) source = `${importLine}\n${source}`;

if (!source.includes(marker)) {
  const needle = `  // ${setupMarker}\n`;
  if (!source.includes(needle)) throw new Error("Không tìm thấy owner setup route để nối credential bootstrap");
  const hook = [
    `  // ${marker}`,
    "  const choiceCredentialBootstrapResponse = await handleChoiceCredentialBootstrapRequest(request, env);",
    "  if (choiceCredentialBootstrapResponse) return choiceCredentialBootstrapResponse;",
    ""
  ].join("\n");
  source = source.replace(needle, `${hook}\n${needle}`);
}

for (const required of [importLine, marker, "handleChoiceCredentialBootstrapRequest(request, env)"]) {
  if (!source.includes(required)) throw new Error(`Worker thiếu credential bootstrap: ${required}`);
}

await writeFile(path, source);
console.log("choice-credential-bootstrap-ok: route RSA một lần đã nối vào Worker");
