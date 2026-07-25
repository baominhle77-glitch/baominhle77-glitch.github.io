import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { brotliDecompressSync } from "node:zlib";

// CHOICE_PRODUCT_V2_PAYLOAD
const PARTS = Array.from({ length: 8 }, (_, index) =>
  `tools/choice-v2-payload/part-${String(index + 1).padStart(2, "0")}.txt`
);

const encoded = (await Promise.all(PARTS.map((path) => readFile(path, "utf8"))))
  .join("")
  .replace(/\s+/g, "");
const archive = brotliDecompressSync(Buffer.from(encoded, "base64"));

function tarText(start, length) {
  return archive.subarray(start, start + length).toString("utf8").replace(/\0.*$/s, "").trim();
}

let offset = 0;
const written = [];
while (offset + 512 <= archive.length) {
  const header = archive.subarray(offset, offset + 512);
  if (header.every((byte) => byte === 0)) break;
  const name = tarText(offset, 100);
  const prefix = tarText(offset + 345, 155);
  const target = [prefix, name].filter(Boolean).join("/");
  const sizeRaw = tarText(offset + 124, 12).replace(/[^0-7]/g, "");
  const size = sizeRaw ? Number.parseInt(sizeRaw, 8) : 0;
  const type = String.fromCharCode(header[156] || 48);
  offset += 512;

  if (!target || target.startsWith("/") || target.split("/").includes("..")) {
    throw new Error(`Đường dẫn payload không hợp lệ: ${target || "empty"}`);
  }
  if (type === "0" || type === "\0") {
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, archive.subarray(offset, offset + size));
    written.push(target);
  }
  offset += Math.ceil(size / 512) * 512;
}

for (const required of [
  "backend/choice.js",
  "backend/choice.test.mjs",
  "backend/choice-vn-marketplace.test.mjs",
  "hoi-chon-dung/index.html",
  "hoi-chon-dung/kham-pha.html",
  "hoi-chon-dung/san-pham.html",
  "hoi-chon-dung/tu-van.html",
  "hoi-chon-dung/so-sanh.html",
  "hoi-chon-dung/shared.js",
  "hoi-chon-dung/app.test.mjs",
  "tools/apply-choice-vn-marketplace.mjs",
  "tools/apply-choice-autopilot-ui.mjs",
  "tools/build-choice-seo.mjs",
  "tools/choice-seo.test.mjs"
]) {
  if (!written.includes(required)) throw new Error(`Payload V2 thiếu file: ${required}`);
}

// ROUTE_REGEX_VALIDATOR_V2: payload dùng RegExp cho product detail, không phải chuỗi startsWith.
const marketplacePath = "tools/apply-choice-vn-marketplace.mjs";
let marketplaceSource = await readFile(marketplacePath, "utf8");
marketplaceSource = marketplaceSource.replace(
  'for (const required of ["normalizeAffiliateUrl", "affiliate_only", "/api/choice/product/", "không chuyển bạn sang Google"])',
  'for (const required of ["normalizeAffiliateUrl", "affiliate_only", "const productMatch = url.pathname.match", "không chuyển bạn sang Google"])'
);
if (!marketplaceSource.includes('"const productMatch = url.pathname.match"')) {
  throw new Error("Không cập nhật được validator route product V2");
}
await writeFile(marketplacePath, marketplaceSource);

console.log(`choice-product-v2-materialized: ${written.length} file(s), strict affiliate-only, no seed/google fallback`);
