import { readFile, writeFile } from "node:fs/promises";

const path = "backend/choice.js";
let source = await readFile(path, "utf8");

source = source.replace(
  '    visual: clean(product.visual, 8) || "◇",\n    summary:',
  '    visual: clean(product.visual, 8) || "◇",\n    image_url: normalizeUrl(product.image_url),\n    summary:'
);
source = source.replace(
  '    updated_at: clean(product.updated_at, 40)\n  };',
  '    updated_at: clean(product.updated_at, 40),\n    last_verified_at: clean(product.last_verified_at, 40)\n  };'
);
source = source.replace(
  '    visual: input.visual ?? previous?.visual ?? "◇",\n    summary,',
  '    visual: input.visual ?? previous?.visual ?? "◇",\n    image_url: input.image_url ?? previous?.image_url ?? "",\n    summary,'
);
source = source.replace(
  '    created_at: previous?.created_at || now,\n    updated_at: now',
  '    created_at: previous?.created_at || now,\n    updated_at: now,\n    last_verified_at: input.last_verified_at ?? previous?.last_verified_at ?? now'
);

for (const required of [
  "image_url: normalizeUrl(product.image_url)",
  "last_verified_at: clean(product.last_verified_at, 40)",
  "image_url: input.image_url ?? previous?.image_url ?? \"\""
]) {
  if (!source.includes(required)) throw new Error(`Choice public product thiếu trường SEO: ${required}`);
}

await writeFile(path, source);
console.log("choice-public-product-ok: API công khai có ảnh sản phẩm và thời điểm xác minh, không lộ metadata nội bộ");
