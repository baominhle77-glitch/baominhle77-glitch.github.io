// window.BoiAuto: giải tự động một câu hỏi để lấy ô "Lời gửi khách".
// Dùng đúng cơ chế xáo/khoá hiện có: mỗi câu một seed 32 byte mới (crypto.getRandomValues), mỗi tầng xáo riêng,
// mã khoá SHA-256 có trước khi chọn lá; vị trí lá úp chọn bằng crypto.getRandomValues. Gọi nhiều câu thì xếp hàng,
// câu nào xong câu đó, mỗi câu một kết quả độc lập.
import { createSession, addPickedRound, ensureMapping } from "./state.js";
import { spreadById, SPREADS, defaultYear } from "./spreads.js";
import { suggestSpread } from "./topic.js";
import { analyze } from "./insight.js";
import { chotLoiGuiKhach } from "./loi.js";
import { goiCoDau, SYSTEM_READING, readingRequest, partialJSON, normalizeReading } from "./ai.js";

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

// "1la" | "3la" | id mẫu trải có sẵn | "tu-chon" (gợi ý theo câu hỏi)
export function chonTrai(cauHoi, trai = "3la") {
  if (trai === "tu-chon" || trai === "auto") return spreadById(suggestSpread(cauHoi).id);
  const sp = SPREADS.find((x) => x.id === trai);
  if (!sp) throw new Error(`Không có mẫu trải "${trai}". Dùng: ${SPREADS.map((x) => x.id).join(", ")}, tu-chon.`);
  return sp;
}

// tenKhach: tên khách của riêng câu này (trống = gọi "bạn"); settings.xungHo KHÔNG được dùng để gọi khách
export async function giaiTuDong({ db, cauHoi, trai = "3la", nguoc = false, tenKhach = "", settings = {}, key = null, fetchImpl, storage, onSession }) {
  const q = String(cauHoi || "").trim();
  if (!q) throw new Error("Thiếu câu hỏi.");
  if (!db) throw new Error("Bộ bài chưa tải xong.");
  const sp = chonTrai(q, trai);
  const s = await createSession({ cauHoi: q, tenKhach, spreadId: sp.id, tiers: sp.tiers(defaultYear()), money: !!sp.money, reversals: !!nguoc, nam: sp.needsYear ? defaultYear() : null });
  // bản giải chi tiết của lượt tự động cũng gọi đúng khách (hoặc "bạn"), không dùng xưng hô đã lưu
  const caiDat = { ...settings, xungHo: s.tenKhach || "bạn" };
  await ensureMapping(s, 0);
  addPickedRound(s, s.tiers.map((t) => ({ tarot: viTriNgauNhien(78, t.t), lenormand: viTriNgauNhien(36, t.l) })));
  const rule = analyze(db, s, caiDat, 0);
  let reading = null, model = "";
  const call = key ? (system, text) => goiCoDau({ provider: "gemini", key, system, json: false, messages: [{ role: "user", text }], fetchImpl, storage }).then((r) => r.text) : null;
  if (key) {
    try {
      const res = await goiCoDau({ provider: "gemini", key, system: SYSTEM_READING, json: true, fetchImpl, storage, messages: [{ role: "user", text: readingRequest(db, s, { reading: rule, money: rule._money, settings: caiDat }) }] });
      const r = normalizeReading(partialJSON(res.text), rule, { db, session: s });
      if (r && r.tang.length) { reading = r; model = res.model; }
    } catch (_) { /* AI lỗi → lời gửi theo luật */ }
  }
  const lgk = await chotLoiGuiKhach({ db, session: s, rule, reading, tenKhach: s.tenKhach, xungHo: settings.xungHo || "", call: reading ? call : null });
  if (reading) s.ai = { provider: "gemini", model, at: new Date().toISOString(), rounds: 1, reading: { ...reading, _money: null }, raw: "", loiGuiKhach: lgk.text, loiNguon: lgk.nguon };
  s.tuDong = true;
  onSession?.(s);
  return { loiGuiKhach: lgk.text, maKhoa: s.hash, nguon: lgk.nguon, trai: sp.id, phien: s.id, tenKhach: s.tenKhach };
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
