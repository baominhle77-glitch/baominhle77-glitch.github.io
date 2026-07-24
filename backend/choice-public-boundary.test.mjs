import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (name) => readFile(new URL(name, import.meta.url), "utf8");

test("Worker và module không công khai API trạng thái vận hành", async () => {
  const [worker, moduleSource] = await Promise.all([
    read("./worker.js"),
    read("./choice-autopilot.js")
  ]);
  assert.match(worker, /Hội Chọn Đúng internal status boundary v3/);
  assert.match(worker, /url\.pathname\.startsWith\("\/api\/choice\/autopilot\/"\)/);
  assert.match(worker, /json\(\{ error: "not_found" \}, 404\)/);
  assert.doesNotMatch(worker, /handleChoiceAutopilotRequest/);
  assert.doesNotMatch(moduleSource, /handleChoiceAutopilotRequest/);
  assert.doesNotMatch(moduleSource, /\/api\/choice\/autopilot\/status/);
  assert.doesNotMatch(moduleSource, /cache-control[^\n]+public/);
});

test("dữ liệu sản phẩm công khai không chứa nhãn vận hành hoặc nguồn nội bộ", async () => {
  const source = await read("./choice-autopilot.js");
  assert.match(source, /utm_medium: "recommendation"/);
  assert.match(source, /slugify\(`goi-y-/);
  assert.match(source, /Thông tin sản phẩm đã được đối chiếu trước khi đưa vào danh sách/);
  assert.match(source, /tags: \[\.\.\.new Set\(\[candidate\.keyword, candidate\.shop_name\]\)\]/);
  assert.doesNotMatch(source, /utm_medium: "autopilot"/);
  assert.doesNotMatch(source, /Được Autopilot xếp hạng/);
  assert.doesNotMatch(source, /Hệ thống tự chọn dựa trên/);
  assert.doesNotMatch(source, /"autopilot", "accesstrade"/);
});

test("dashboard doanh thu là route owner riêng, noindex và phiên HttpOnly", async () => {
  const [worker, revenue] = await Promise.all([
    read("./worker.js"),
    read("./choice-revenue.js")
  ]);
  assert.match(worker, /Hội Chọn Đúng owner revenue route v1/);
  assert.match(worker, /handleChoiceRevenueRequest\(request, env\)/);
  assert.match(worker, /Hội Chọn Đúng owner revenue Telegram v1/);
  assert.match(revenue, /x-robots-tag": "noindex, nofollow, noarchive"/);
  assert.match(revenue, /HttpOnly; Secure; SameSite=Strict/);
  assert.match(revenue, /String\(message\?\.chat\?\.id/);
  assert.match(revenue, /String\(message\?\.from\?\.id/);
  assert.doesNotMatch(revenue, /customer_phone|customer_email|customer_name/);
});

test("Growth cycle chạy đồng bộ doanh thu 5 phút nhưng chỉ khám phá sản phẩm khi đủ 6 giờ", async () => {
  const [worker, revenue, wrangler] = await Promise.all([
    read("./worker.js"),
    read("./choice-revenue.js"),
    read("./wrangler.toml")
  ]);
  assert.match(worker, /runChoiceGrowthCycle/);
  assert.match(worker, /Hội Chọn Đúng growth cycle 5m v1/);
  assert.match(revenue, /DISCOVERY_INTERVAL_MS = 6 \* 60 \* 60 \* 1000/);
  assert.match(wrangler, /crons = \["\*\/5 \* \* \* \*"\]/);
});
