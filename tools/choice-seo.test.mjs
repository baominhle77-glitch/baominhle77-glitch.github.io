import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { CHOICE_TAXONOMY } from "./choice-taxonomy.mjs";

const exec = promisify(execFile);
const ROOT = resolve(new URL("..", import.meta.url).pathname);

async function buildFixture() {
  const dir = await mkdtemp(join(tmpdir(), "choice-seo-"));
  const input = join(dir, "products.json");
  const output = join(dir, "out");
  const products = [
    {
      id: "micro-test", name: "Micro cài áo thử nghiệm", category: "creator",
      summary: "Micro nhỏ gọn dùng quay video bằng điện thoại trong môi trường nói chuyện gần.",
      price_min: 350000, price_max: 550000, currency: "VND",
      best_for: ["Người quay video bằng điện thoại"], avoid_if: ["Thiết bị không tương thích cổng kết nối"],
      pros: ["Nhỏ gọn", "Dễ mang theo"], cons: ["Cần kiểm tra đầu chuyển"], tags: ["micro", "điện thoại"],
      merchant: "Shop thử nghiệm", link_type: "affiliate", link_ready: true,
      outbound_path: "/r/choice/micro-test", updated_at: "2026-07-25T00:00:00Z", votes: 12
    },
    {
      id: "tarot-test", name: "Bộ bài Tarot thử nghiệm", category: "tarot",
      summary: "Bộ bài có hệ biểu tượng rõ để người mới đối chiếu và học từng lá.",
      price_min: 250000, price_max: 450000, currency: "VND",
      best_for: ["Người mới học Tarot"], avoid_if: ["Muốn phong cách hình ảnh tối giản"],
      pros: ["Biểu tượng rõ"], cons: ["Cần kiểm tra chất lượng in"], merchant: "Shop thử nghiệm",
      link_type: "affiliate", link_ready: true, outbound_path: "/r/choice/tarot-test", updated_at: "2026-07-25T00:00:00Z"
    },
    {
      id: "pla-test", name: "PLA thử nghiệm cho máy in 3D", category: "3d",
      summary: "Filament PLA phổ thông cho mẫu trang trí và người mới làm quen in FDM.",
      price_min: 300000, price_max: 500000, currency: "VND",
      best_for: ["Người mới in FDM"], avoid_if: ["Ứng dụng cần chịu nhiệt cao"],
      pros: ["Dễ bắt đầu"], cons: ["Cần bảo quản khô"], merchant: "Shop thử nghiệm",
      link_type: "affiliate", link_ready: true, outbound_path: "/r/choice/pla-test", updated_at: "2026-07-25T00:00:00Z"
    }
  ];
  await writeFile(input, JSON.stringify({ products }), "utf8");
  await exec(process.execPath, [join(ROOT, "tools/build-choice-seo.mjs"), "--input", input, "--out", output], { cwd: ROOT });
  return { dir, output };
}

test("tạo trang sản phẩm HTML tĩnh có canonical, Product schema và affiliate disclosure", async () => {
  const { output } = await buildFixture();
  const html = await readFile(join(output, "san-pham/micro-test/index.html"), "utf8");
  assert.match(html, /<link rel="canonical" href="https:\/\/hiennhi89\.pages\.dev\/hoi-chon-dung\/san-pham\/micro-test\/">/);
  assert.match(html, /"@type":"Product"/);
  assert.match(html, /"@type":"Offer"/);
  assert.match(html, /rel="sponsored nofollow noopener"/);
  assert.match(html, /Công bố liên kết tiếp thị/);
  assert.match(html, /og:title/);
  assert.match(html, /twitter:card/);
  assert.doesNotMatch(html, /Autopilot|onboarding_required|Cloudflare Worker|API key|chủ sở hữu/i);
});

test("tạo landing page và hướng dẫn cho mọi lĩnh vực, kể cả khi chưa có sản phẩm", async () => {
  const { output } = await buildFixture();
  for (const config of CHOICE_TAXONOMY) {
    const category = await readFile(join(output, "danh-muc", config.slug, "index.html"), "utf8");
    const guide = await readFile(join(output, "huong-dan", config.guideSlug, "index.html"), "utf8");
    assert.match(category, /"@type":"ItemList"/);
    assert.match(category, /"@type":"FAQPage"/);
    assert.match(guide, /"@type":"Article"/);
    assert.match(category, new RegExp(config.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  const emptyCategory = await readFile(join(output, "danh-muc", "cong-nghe-phu-kien-so", "index.html"), "utf8");
  assert.match(emptyCategory, /Danh sách lựa chọn sẽ xuất hiện khi có đủ dữ liệu/);
});

test("sitemap, RSS và URL list chứa toàn bộ danh mục/hướng dẫn", async () => {
  const { output } = await buildFixture();
  const sitemap = await readFile(join(output, "sitemap.xml"), "utf8");
  const feed = await readFile(join(output, "feed.xml"), "utf8");
  const urls = JSON.parse(await readFile(join(output, "seo-urls.json"), "utf8"));
  assert.match(sitemap, /\/san-pham\/micro-test\//);
  for (const config of CHOICE_TAXONOMY) {
    assert.match(sitemap, new RegExp(`/danh-muc/${config.slug}/`));
    assert.match(sitemap, new RegExp(`/huong-dan/${config.guideSlug}/`));
  }
  assert.match(feed, /<rss version="2\.0">/);
  assert.ok(urls.urls.length >= CHOICE_TAXONOMY.length * 2 + 4);
  assert.ok(urls.urls.every((url) => url.startsWith("https://hiennhi89.pages.dev/hoi-chon-dung/")));
});

test("IndexNow kiểm tra host và Google Search Console hỗ trợ dry-run", async () => {
  const { output } = await buildFixture();
  const indexNow = await exec(process.execPath, [join(ROOT, "tools/submit-indexnow.mjs"), join(output, "seo-urls.json")], {
    cwd: ROOT,
    env: { ...process.env, INDEXNOW_DRY_RUN: "1" }
  });
  assert.match(indexNow.stdout, /"dry_run":true/);
  assert.match(indexNow.stdout, /hiennhi89\.pages\.dev/);

  const google = await exec(process.execPath, [join(ROOT, "tools/submit-google-sitemap.mjs")], {
    cwd: ROOT,
    env: {
      ...process.env,
      GOOGLE_SEARCH_CONSOLE_DRY_RUN: "1",
      GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON: JSON.stringify({ client_email: "seo@example.iam.gserviceaccount.com", private_key: "test-key" })
    }
  });
  assert.match(google.stdout, /"dry_run":true/);
  assert.match(google.stdout, /hoi-chon-dung\/sitemap\.xml/);
});
