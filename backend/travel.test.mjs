import test from "node:test";
import assert from "node:assert/strict";
import { handleTravelRequest, handleTravelTelegramUpdate, __test } from "./travel.js";

class FakeKV {
  constructor() { this.values = new Map(); }
  async get(key) { return this.values.has(key) ? this.values.get(key) : null; }
  async put(key, value) { this.values.set(key, String(value)); }
  async delete(key) { this.values.delete(key); }
}

function env() {
  return { KV: new FakeKV(), TELEGRAM_CHAT_ID: "123456" };
}

function ownerMessage(text, messageId = 1) {
  return {
    update_id: messageId,
    message: {
      message_id: messageId,
      chat: { id: 123456 },
      from: { id: 123456 },
      text
    }
  };
}

function ownerCallback(data, updateId = 50) {
  return {
    update_id: updateId,
    callback_query: {
      id: `callback-${updateId}`,
      from: { id: 123456 },
      data,
      message: {
        message_id: 88,
        chat: { id: 123456 },
        text: "Xác nhận"
      }
    }
  };
}

async function apiPlaces(currentEnv, query = "") {
  const response = await handleTravelRequest(new Request(`https://example.com/api/travel/places${query}`), currentEnv);
  assert.equal(response.status, 200);
  return response.json();
}

test("slug và parser trường tiếng Việt ổn định", () => {
  assert.equal(__test.slugify("Quần thể Tràng An"), "quan-the-trang-an");
  const fields = __test.parseFields(`/them\nTên: Suối Tiên\nTỉnh: Hà Nội\nVùng: Miền Bắc\nMô tả: Dòng 1\nDòng 2\nLoại: thiên nhiên, tâm linh`);
  assert.equal(fields.name, "Suối Tiên");
  assert.equal(fields.province, "Hà Nội");
  assert.equal(fields.summary, "Dòng 1 Dòng 2");
  assert.deepEqual(fields.categories, ["thien-nhien", "tam-linh"]);
});

test("API tự seed và chỉ trả địa điểm công khai", async () => {
  const currentEnv = env();
  const data = await apiPlaces(currentEnv);
  assert.ok(data.count >= 20);
  assert.equal(data.places.every((place) => place.published), true);
  assert.ok(await currentEnv.KV.get(__test.STORE_KEY));
});

test("Telegram chỉ nhận lệnh của chủ bot", async () => {
  const currentEnv = env();
  const rejected = await handleTravelTelegramUpdate({
    update_id: 1,
    message: { message_id: 1, chat: { id: 999 }, from: { id: 999 }, text: "/travel" }
  }, currentEnv);
  assert.equal(rejected, null);
  const accepted = await handleTravelTelegramUpdate(ownerMessage("/travel"), currentEnv);
  assert.equal(accepted.handled, true);
  assert.match(accepted.calls[0].body.text, /QUẢN TRỊ ĐỊA ĐIỂM/);
});

test("thêm, sửa, ẩn, hiện và xóa địa điểm qua Telegram", async () => {
  const currentEnv = env();
  const before = await apiPlaces(currentEnv);

  const added = await handleTravelTelegramUpdate(ownerMessage(`/them
Tên: Thung lũng Mây
Tỉnh: Lào Cai
Vùng: Miền Bắc
Loại: thiên nhiên, phiêu lưu
Mô tả: Điểm thử nghiệm tự động
Điểm nổi bật: săn mây, trekking
Thời lượng: 1 ngày`), currentEnv);
  assert.equal(added.handled, true);
  assert.match(added.calls[0].body.text, /Đã thêm địa điểm/);

  let data = await apiPlaces(currentEnv, "?q=thung%20lung%20may");
  assert.equal(data.count, 1);
  const id = data.places[0].id;

  const edited = await handleTravelTelegramUpdate(ownerMessage(`/sua ${id}\nMô tả: Nội dung đã sửa\nMẹo: Đi sớm`), currentEnv);
  assert.match(edited.calls[0].body.text, /Đã cập nhật/);
  data = await apiPlaces(currentEnv, `?q=${encodeURIComponent("Nội dung đã sửa")}`);
  assert.equal(data.count, 1);

  const hidden = await handleTravelTelegramUpdate(ownerMessage(`/an ${id}`), currentEnv);
  assert.match(hidden.calls[0].body.text, /Đã ẩn/);
  data = await apiPlaces(currentEnv, `?q=${encodeURIComponent("Thung lũng Mây")}`);
  assert.equal(data.count, 0);

  const shown = await handleTravelTelegramUpdate(ownerMessage(`/hien ${id}`), currentEnv);
  assert.match(shown.calls[0].body.text, /Đã hiện/);
  data = await apiPlaces(currentEnv, `?q=${encodeURIComponent("Thung lũng Mây")}`);
  assert.equal(data.count, 1);

  const confirm = await handleTravelTelegramUpdate(ownerMessage(`/xoa ${id}`), currentEnv);
  assert.equal(confirm.calls[0].body.reply_markup.inline_keyboard[0][0].callback_data, `travel:delete:${id}`);

  const deleted = await handleTravelTelegramUpdate(ownerCallback(`travel:delete:${id}`), currentEnv);
  assert.equal(deleted.handled, true);
  assert.match(deleted.calls[1].body.text, /Đã xóa vĩnh viễn/);
  data = await apiPlaces(currentEnv, `?q=${encodeURIComponent("Thung lũng Mây")}`);
  assert.equal(data.count, 0);

  const after = await apiPlaces(currentEnv);
  assert.equal(after.count, before.count);
});

test("lọc vùng và danh mục ở API", async () => {
  const currentEnv = env();
  const central = await apiPlaces(currentEnv, `?region=${encodeURIComponent("Miền Trung")}`);
  assert.ok(central.count > 0);
  assert.equal(central.places.every((place) => place.region === "Miền Trung"), true);

  const spiritual = await apiPlaces(currentEnv, "?category=tam-linh");
  assert.ok(spiritual.count > 0);
  assert.equal(spiritual.places.every((place) => place.categories.includes("tam-linh")), true);
});
