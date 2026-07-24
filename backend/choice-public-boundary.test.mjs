import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (name) => readFile(new URL(name, import.meta.url), "utf8");

test("Worker không công khai API trạng thái vận hành", async () => {
  const worker = await read("./worker.js");
  assert.match(worker, /Hội Chọn Đúng internal status boundary v3/);
  assert.match(worker, /url\.pathname\.startsWith\("\/api\/choice\/autopilot\/"\)/);
  assert.match(worker, /json\(\{ error: "not_found" \}, 404\)/);
  assert.doesNotMatch(worker, /handleChoiceAutopilotRequest/);
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
