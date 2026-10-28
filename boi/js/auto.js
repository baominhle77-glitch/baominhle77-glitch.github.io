// window.BoiAuto: giải tự động một câu hỏi để lấy ô "Lời gửi khách".
// Dùng đúng cơ chế xáo/khoá hiện có: mỗi câu một seed 32 byte mới (crypto.getRandomValues), mỗi tầng xáo riêng,
// mã khoá SHA-256 có trước khi chọn lá; vị trí lá úp chọn bằng crypto.getRandomValues. Gọi nhiều câu thì xếp hàng,
// câu nào xong câu đó, mỗi câu một kết quả độc lập.
import { createSession, addPickedRound, ensureMapping } from "./state.js";
import { spreadById, SPREADS, defaultYear } from "./spreads.js";
import { suggestSpread } from "./topic.js";
import { analyze } from "./insight.js";
import { chotLoiGuiKhach } from "./loi.js";
import { goiCoDau, SYSTEM_READING, readingRequest, partialJSON, normalizeReading, phanLoaiLoiAI, LOCAL_KEY } from "./ai.js";

// k vị trí khác nhau trong 1..n, đều, không lệch (loại bỏ phần dư)
export function viTriNgauNhien(n, k, rand = globalThis.crypto) {
  const out = new Set();
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / n) * n;
  while (out.size < Math.min(k, n)) {
    rand.getRandomValues(buf);
    if (buf[0] < limit) out.add((buf[0] % n) + 1);
  }
  return [...out];
}

// Khách không chọn kiểu trải: agent tự chọn theo câu hỏi ("tu-chon", mặc định). Vẫn nhận "1la" | "3la" | id mẫu trải
// khi truyền tường minh (để test).
export function chonTrai(cauHoi, trai = "tu-chon") {
  if (!trai || trai === "tu-chon" || trai === "auto") return spreadById(suggestSpread(cauHoi).id);
  const sp = SPREADS.find((x) => x.id === trai);
  if (!sp) throw new Error(`Không có mẫu trải "${trai}". Dùng: ${SPREADS.map((x) => x.id).join(", ")}, tu-chon.`);
  return sp;
}

// Tham số trải do agent tự điền, không hỏi khách: năm (câu hỏi nêu năm thì theo năm đó, không thì năm mặc định),
// bảng tiền (mẫu trải tiền hoặc câu hỏi về tiền), tên tầng Có/Không và trải tự do đặt theo chính câu hỏi.
export function thamSoTrai(cauHoi, sp, goiY = suggestSpread(cauHoi)) {
  const nam = sp.needsYear ? (goiY.year >= 1900 && goiY.year <= 2200 ? goiY.year : defaultYear()) : null;
  let tiers = sp.tiers(nam || defaultYear()).map((t) => ({ ...t }));
  const cau = cauHoi.trim().replace(/\s+/g, " ").slice(0, 120);
  if (sp.id === "cokhong") tiers = [cau, "Làm theo hướng đó thì có thuận không?", "Kết quả có giữ được lâu không?"].map((ten, i) => ({ ...tiers[i], ten }));
  if (sp.id === "tudo") tiers = [{ ten: cau, t: 3, l: 3, pos: ["Hiện trạng", "Diễn biến", "Kết quả"] }];
  return { tiers, nam, money: !!(sp.money || goiY.money) };
}

// tenKhach: tên khách của riêng câu này (trống = gọi "bạn"); settings.xungHo KHÔNG được dùng để gọi khách
// trai: mặc định "tu-chon" — mỗi câu (kể cả nhiều câu trong một gói) tự chọn trải riêng theo nội dung câu đó
export async function giaiTuDong({ db, cauHoi, trai = "tu-chon", nguoc = false, tenKhach = "", settings = {}, key = null, fetchImpl, storage, onSession }) {
  const q = String(cauHoi || "").trim();
  if (!q) throw new Error("Thiếu câu hỏi.");
  if (!db) throw new Error("Bộ bài chưa tải xong.");
  const goiY = suggestSpread(q);
  const sp = chonTrai(q, trai);
  const tuChon = sp.id === goiY.id && (!trai || trai === "tu-chon" || trai === "auto");
  const lyDoTrai = tuChon ? goiY.why : `trải được chỉ định: ${sp.ten}`;
  const ts = thamSoTrai(q, sp, goiY);
  const s = await createSession({ cauHoi: q, tenKhach, spreadId: sp.id, tiers: ts.tiers, money: ts.money, reversals: !!nguoc, nam: ts.nam });
  // bản giải chi tiết của lượt tự động cũng gọi đúng khách (hoặc "bạn"), không dùng xưng hô đã lưu
  const caiDat = { ...settings, xungHo: s.tenKhach || "bạn" };
  await ensureMapping(s, 0);
  addPickedRound(s, s.tiers.map((t) => ({ tarot: viTriNgauNhien(78, t.t), lenormand: viTriNgauNhien(36, t.l) })));
  const rule = analyze(db, s, caiDat, 0);
  let reading = null, model = "", aiLoi = "", cuu = "", khoa = key;
  // trạm 429 đã phải chuyển sang cầu nối → lượt viết lại lời gửi đi thẳng cầu nối
  const call = key ? (system, text) => goiCoDau({ provider: "gemini", key: khoa, system, json: false, messages: [{ role: "user", text }], fetchImpl, storage }).then((r) => r.text) : null;
  if (key) {
    try {
      const res = await goiCoDau({ provider: "gemini", key, system: SYSTEM_READING, json: true, fetchImpl, storage, messages: [{ role: "user", text: readingRequest(db, s, { reading: rule, money: rule._money, settings: caiDat }) }] });
      const r = normalizeReading(partialJSON(res.text), rule, { db, session: s });
      if (res.cuu) { cuu = res.cuu; khoa = LOCAL_KEY; }
      if (r && r.tang.length) { reading = r; model = res.model; }
    } catch (e) { aiLoi = e.cuu || `AI lỗi: ${phanLoaiLoiAI(e, key)}`; /* AI lỗi → lời gửi theo luật */ }
  }
  const lgk = await chotLoiGuiKhach({ db, session: s, rule, reading, tenKhach: s.tenKhach, xungHo: settings.xungHo || "", call: reading ? call : null });
  if (reading) s.ai = { provider: "gemini", model, at: new Date().toISOString(), rounds: 1, reading: { ...reading, _money: null }, raw: "", loiGuiKhach: lgk.text, loiNguon: lgk.nguon };
  s.tuDong = true;
  onSession?.(s);
  // lý do lời gửi rơi về bản luật, hoặc đường AI đã đi (trạm 429 → cầu nối) — để biết đường nào cần chữa
  const lyDo = lgk.nguon === "luat" ? (reading ? `${cuu ? `${cuu}; ` : ""}bị cổng trả lại: ${lgk.loi.join("; ")}` : key ? (aiLoi || "AI lỗi: không rõ") : "không gọi AI") : cuu;
  if (lyDo && key) console[lgk.nguon === "luat" ? "warn" : "info"]("[loi-gui-khach]", lgk.nguon === "luat" ? "bản theo luật vì:" : "đường AI:", lyDo);
  return { loiGuiKhach: lgk.text, maKhoa: s.hash, nguon: lgk.nguon, lyDo, trai: sp.id, tenTrai: sp.ten, lyDoTrai, phien: s.id, tenKhach: s.tenKhach };
}

// Hàng đợi: lời gọi sau chờ lời gọi trước xong (kể cả khi lời trước lỗi)
export function taoBoiAuto(ctx) {
  let hang = Promise.resolve();
  const giai = (cauHoi, opts = {}) => {
    const job = hang.then(async () => giaiTuDong({ ...(await ctx()), cauHoi, ...opts }));
    hang = job.catch(() => {});
    return job;
  };
  return { giai };
}
