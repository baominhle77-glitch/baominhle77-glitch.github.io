import { readFile, writeFile } from "node:fs/promises";

const path = "tools/build-choice-seo.mjs";
let source = await readFile(path, "utf8");

source = source.replace(
  '  if (!rows.length) continue;\n  await write(join(output, "danh-muc", config.slug, "index.html"), categoryPage(category, rows));',
  '  await write(join(output, "danh-muc", config.slug, "index.html"), categoryPage(category, rows));'
);

source = source.replace(
  '<div class="products">${products.map(productCard).join("")}</div>',
  '<div class="products">${products.length ? products.map(productCard).join("") : `<p>Danh sách lựa chọn sẽ xuất hiện khi có đủ dữ liệu giá, tồn kho và nơi bán để đối chiếu.</p>`}</div>'
);

for (const required of [
  'await write(join(output, "danh-muc", config.slug, "index.html"), categoryPage(category, rows));',
  'products.length ? products.map(productCard).join("")'
]) {
  if (!source.includes(required)) throw new Error(`SEO đa danh mục thiếu: ${required}`);
}
if (source.includes("if (!rows.length) continue")) throw new Error("SEO còn bỏ qua danh mục chưa có sản phẩm");

await writeFile(path, source);
console.log("choice-seo-multiniche-ok: mọi danh mục có landing page và hướng dẫn dù catalog đang chờ nguồn");
