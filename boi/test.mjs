// Chạy: node boi/test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildMapping, commitHash, verifyLock, makeRng, shuffle, gmt7 } from "./js/core.js";
import { parseDraw, parseCorrection, splitBySizes } from "./js/parser.js";
import { createSession, addRound, addPickedRound, applyCorrectionText, fixCell, errorsOf, reveal, exportJSON, importJSON, loadSessions, saveSessions, ensureMapping, newDraw, pendingDraw, normalizeSession } from "./js/state.js";
import { startPick, togglePick, saveTier, editTier, pickReady, savedCount, tierComplete } from "./js/pick.js";
import { cardName } from "./js/reading.js";
import { spreadById, SPREADS, defaultYear } from "./js/spreads.js";
import { moneyTable, periodEstimate, roundNice } from "./js/money.js";
import { analyze, allSentences, ruleFollowUp } from "./js/insight.js";
import { suggestSpread, mainTopic } from "./js/topic.js";
import { mergeKnowledge, tarotMeaning, capMeaning, cardYesNo } from "./js/data.js";
import { friendlyError, LOCAL_KEY, TRAM_KEY, TRAM_URL, aiFailNotice } from "./js/ai.js";
import { streamWithFallback, partialJSON, normalizeReading, readingRequest, SYSTEM_READING, SYSTEM_CHAT, LOCAL_BASE, phanLoaiLoiAI } from "./js/ai.js";
import { goiCoDau, tyLeDau, tyLeDauBai, matDau, normYN, suaTenLa, YN, BAO_MAT_DAU, NHAC_DAU, NGUONG_DAU, SCHEMA } from "./js/ai.js";
import { probeBridge, bridge, aiKey, store, docDiaChiCauNoi } from "./js/store.js";
import { ROUTES } from "./js/views.js";
import * as DT from "./dao-tao/dao-tao-core.js";
import { giaiTuDong, taoBoiAuto, viTriNgauNhien, chonTrai, thamSoTrai, laCauHoiBoi, tachCauHoi, HOI_LAI } from "./js/auto.js";
import { cauTraiChieu, chieuTrongLoi, chieuTraLoi, traiChieu, nghiaTrai } from "./js/loi.js";
import { kiemLoiGuiKhach, loiGuiKhachLuat, chotLoiGuiKhach, demChu, doanVan, tenLaTrong, SYSTEM_LGK, tenViTriCua, chuCamTrong, yKhop, tyLeCauSao, viTriTrong, traLoiThang, nguCanh, hopNguCanh } from "./js/loi.js";
import { datCuuTram, via, cauNoi, quaCauNoi } from "./js/ai.js";
import { WORKER_BASE, diaChiCauNoi } from "./js/store.js";
import { AI_THU_LAI } from "./js/auto.js";
import { SYSTEM_GON, SCHEMA_GON, GON_MAX_TOKENS, GON_HEN_GIO, gonRequest } from "./js/ai.js";
import { lichNen, huyNen, canAI, NEN_LICH, runLGK, lgkCua } from "./js/views.js";
import { doDaiLgk, dongDoDai, laMocThoiGian } from "./js/loi.js";
import { giaiLoiGuiKhach } from "./js/auto.js";
// chờ thử lại rút ngắn cho test (thật: cầu nối 1,5 s, BoiAuto 3 s)
cauNoi.thuLaiMs = 5;
AI_THU_LAI.ms = 5;
// store.js đăng ký đường cứu trạm → cầu nối khi được nạp; các test cũ dùng fetch giả trả 200 cho mọi địa chỉ nên tắt đi, test riêng tự bật
const CUU_THAT = true;
datCuuTram(null);
const datLaiCauNoi = () => { datCuuTram(null); bridge.ok = true; bridge.xa = true; bridge.local = null; via.base = WORKER_BASE; via.token = ""; };

const HERE = dirname(fileURLToPath(import.meta.url));
const readJSON = (f) => JSON.parse(readFileSync(join(HERE, f), "utf8"));
export const db = mergeKnowledge(
  { tarot: readJSON("data/tarot.json"), lenormand: readJSON("data/lenormand.json") },
  readJSON("data/tarot_them.json"), readJSON("data/lenormand_them.json"),
);

const tests = [];
const test = (name, fn) => tests.push([name, fn]);
const SEED = "0123456789abcdef".repeat(4);
const T_IN = "T: 8 37 50 69/ 68 75 36 22/ 8 36 55 71";
const L_IN = "Lenor: 22 25 27 29 / 10 20 25 21/ 11 23 26 34";

test("dữ liệu đủ 78 + 36 lá, đủ trường", () => {
  assert.equal(db.tarot.la.length, 78);
  assert.equal(db.lenormand.la.length, 36);
  assert.equal(db.lenormand.la[0].en, "Rider");
  assert.equal(db.lenormand.la[35].en, "Cross");
  for (const c of db.tarot.la) {
    for (const k of ["en", "vi", "tu_khoa", "tien", "rui_ro", "loi_khuyen"]) assert.ok(c[k], `${c.en} thiếu ${k}`);
    for (const k of ["tien_trinh", "hieu_qua", "ket_qua", "tin_hieu"]) assert.ok(c.vi_tri[k], `${c.en} thiếu vị trí ${k}`);
    assert.ok(c.diem_tien >= -2 && c.diem_tien <= 2);
  }
  const names = new Set(db.lenormand.la.map((c) => c.en));
  for (const k of Object.keys(db.lenormand.cap)) for (const p of k.split("+")) assert.ok(names.has(p), k);
});

test("xáo tất định theo seed, là hoán vị, hai bộ độc lập", async () => {
  const a = await buildMapping(SEED, false);
  const b = await buildMapping(SEED, false);
  assert.deepEqual(a, b);
  assert.deepEqual([...a.tarot].sort((x, y) => x - y), [...Array(78).keys()]);
  assert.deepEqual([...a.lenormand].sort((x, y) => x - y), Array.from({ length: 36 }, (_, i) => i + 1));
  const c = await buildMapping("f".repeat(64), false);
  assert.notDeepEqual(a.tarot, c.tarot);
  assert.equal(a.tarotRev, null);
  const r = await buildMapping(SEED, true);
  assert.deepEqual(r.tarot, a.tarot, "bật lá ngược không đổi thứ tự xáo");
  assert.equal(r.tarotRev.length, 78);
  // PRNG đều: 0..n-1, không lệch rõ
  const rng = makeRng(SEED, "kiem-tra");
  const counts = [0, 0, 0];
  for (let i = 0; i < 3000; i++) counts[await rng.int(3)]++;
  for (const x of counts) assert.ok(x > 850 && x < 1150, `phân bố lệch ${counts}`);
  assert.equal((await shuffle(1, rng)).length, 1);
});

test("mã khoá khớp, đổi ánh xạ là lộ", async () => {
  const m = await buildMapping(SEED, false);
  const h = await commitHash(SEED, m);
  assert.match(h, /^[0-9a-f]{64}$/);
  const ok = await verifyLock({ seed: SEED, reversals: false, mapping: m, hash: h });
  assert.ok(ok.hashOk && ok.mappingOk);
  const tampered = { ...m, tarot: [...m.tarot] };
  [tampered.tarot[0], tampered.tarot[1]] = [tampered.tarot[1], tampered.tarot[0]];
  const bad = await verifyLock({ seed: SEED, reversals: false, mapping: tampered, hash: h });
  assert.equal(bad.mappingOk, false);
  const bad2 = await verifyLock({ seed: SEED, reversals: false, mapping: m, hash: "0".repeat(64) });
  assert.equal(bad2.hashOk, false);
  assert.match(gmt7(new Date("2026-10-24T23:00:00Z")), /^25\/10\/2026 06:00:00 \(GMT\+7\)$/);
});

test("parser: ví dụ của chủ nhân, nhãn, số 0 đầu, dấu phẩy, gạch ngang", () => {
  const p = parseDraw(`${T_IN}\n${L_IN}`);
  assert.deepEqual(p.tarot.tiers.map((t) => t.map((x) => x.n)), [[8, 37, 50, 69], [68, 75, 36, 22], [8, 36, 55, 71]]);
  assert.deepEqual(p.lenormand.tiers.map((t) => t.map((x) => x.n)), [[22, 25, 27, 29], [10, 20, 25, 21], [11, 23, 26, 34]]);
  assert.ok(p.tarot.slash && p.lenormand.slash);
  const q = parseDraw("Tarot: 08, 07 – 3\nLenormand: 01–02, 03");
  assert.deepEqual(q.tarot.tiers[0].map((x) => x.n), [8, 7, 3]);
  assert.equal(q.tarot.tiers[0][0].raw, "08");
  assert.deepEqual(q.lenormand.tiers[0].map((x) => x.n), [1, 2, 3]);
  const r = parseDraw("L: 5 6 / 7 T: 9");
  assert.deepEqual(r.lenormand.tiers.map((t) => t.map((x) => x.n)), [[5, 6], [7]]);
  assert.deepEqual(r.tarot.tiers[0].map((x) => x.n), [9]);
  // Không có "/" → chia theo mẫu trải
  const s = parseDraw("T: 1 2 3 4 5 6 7 8 9 10 11 12", { tarot: [4, 4, 4], lenormand: [4, 4, 4] });
  assert.deepEqual(s.tarot.tiers.map((t) => t.length), [4, 4, 4]);
  assert.equal(s.tarot.slash, false);
  assert.deepEqual(splitBySizes([1, 2, 3, 4, 5].map((n) => ({ n })), [2, 2]).map((t) => t.length), [2, 2, 1]);
  // Không nhãn → bộ mặc định
  assert.equal(parseDraw("3 4 5", {}, "lenormand").lenormand.tiers[0].length, 3);
  assert.deepEqual(parseCorrection("Là số 04"), [4]);
  assert.deepEqual(parseCorrection("là số 4 và 12"), [4, 12]);
  assert.equal(parseCorrection("T: 4"), null);
});

async function demoSession(seed = SEED) {
  const sp = spreadById("3thang");
  return createSession({ cauHoi: "thu nhập 3 tháng tới", spreadId: sp.id, tiers: sp.tiers(), money: true, reversals: false, seed });
}

test("state: số 40 lỗi để trống đúng ô, 'Là số 04' chỉ thay ô đó; mỗi tầng một bảng riêng", async () => {
  const s = await demoSession();
  const m = await ensureMapping(s, 0);
  assert.equal(m.v, 2);
  assert.equal(m.tang.length, 3, "3 tầng → 3 bảng");
  const { round, errors } = addRound(s, `${T_IN}\n${L_IN.replace("34", "40")}`);
  assert.equal(errors.length, 1);
  assert.deepEqual([errors[0].deck, errors[0].tier, errors[0].idx, errors[0].n], ["lenormand", 2, 3, 40]);
  const before = JSON.stringify(round.lenormand[2].slice(0, 3));
  assert.equal(round.lenormand[2].filter((c) => c.ok).length, 3, "các số hợp lệ vẫn lật");
  // số 8 ở tầng 1 và tầng 3 đọc từ HAI bảng khác nhau
  assert.equal(round.tarot[0][0].card, m.tang[0].tarot[7]);
  assert.equal(round.tarot[2][0].card, m.tang[2].tarot[7]);
  const fix = applyCorrectionText(s, "Là số 04");
  assert.equal(fix.filled.length, 1);
  assert.equal(round.lenormand[2][3].n, 4);
  assert.equal(round.lenormand[2][3].card, m.tang[2].lenormand[3], "ô thay đọc bảng của đúng tầng 3");
  assert.equal(round.lenormand[2][3].fixedFrom, "40");
  assert.equal(JSON.stringify(round.lenormand[2].slice(0, 3)), before, "không đụng ô khác");
  assert.equal(errorsOf(round).length, 0);
  // lượt đã dùng thì không rút tiếp trên bộ cũ
  assert.throws(() => addRound(s, "L: 3"), /Rút thêm/u);
  const v = await reveal(s);
  assert.ok(v.hashOk && v.mappingOk);
});

test("rút thêm: xáo bộ mới (seed mới, mã khoá mới), số ngoài khoảng giữ ô trống; kiểm chứng mọi lượt", async () => {
  const s = await demoSession();
  addRound(s, T_IN);
  assert.equal(pendingDraw(s), -1);
  const d1 = await newDraw(s);
  assert.equal(d1, 1);
  assert.equal(await newDraw(s), 1, "bấm lại không sinh thêm lượt khi lượt mới chưa dùng");
  assert.notEqual(s.draws[1].seed, s.draws[0].seed);
  assert.notEqual(s.draws[1].hash, s.draws[0].hash);
  assert.notDeepEqual((await ensureMapping(s, 1)).tang[0].tarot, (await ensureMapping(s, 0)).tang[0].tarot, "rút thêm không dùng lại bảng cũ");
  addRound(s, "L: 99");
  assert.equal(s.rounds[1].draw, 1);
  assert.equal(fixCell(s, 1, "lenormand", 0, 0, 37).ok, false);
  assert.equal(errorsOf(s.rounds[1]).length, 1);
  assert.equal(fixCell(s, 1, "lenormand", 0, 0, 5).ok, true);
  assert.equal(s.rounds[1].lenormand[0][0].card, (await ensureMapping(s, 1)).tang[0].lenormand[4]);
  const v = await reveal(s);
  assert.equal(v.draws.length, 2);
  assert.ok(v.hashOk && v.mappingOk);
  // sửa tay một lá đã lật → kiểm chứng lộ ngay
  const c = s.rounds[0].tarot[0][0];
  c.card = (c.card + 1) % 78;
  assert.equal((await reveal(s)).mappingOk, false);
});

test("phiên cũ (v1, một bảng chung) vẫn mở, giải và kiểm chứng được; bảng cũ bị xoá khỏi bộ nhớ máy", async () => {
  const old = await buildMapping(SEED, false);
  const legacy = { v: 1, id: "qcu", cauHoi: "cũ", spreadId: "3thang", tiers: spreadById("3thang").tiers(), money: true, reversals: false, nam: null, seed: SEED, hash: await commitHash(SEED, old), mapping: old, lockedAt: "2026-10-01T00:00:00.000Z", lockedAtText: "x", rounds: [] };
  normalizeSession(legacy);
  assert.equal(legacy.mapping, undefined, "không giữ bảng ánh xạ cũ");
  assert.equal(legacy.draws[0].kieu, 1);
  await ensureMapping(legacy, 0);
  addRound(legacy, T_IN);
  assert.equal(legacy.rounds[0].tarot[2][0].card, legacy.rounds[0].tarot[0][0].card, "v1: cùng số = cùng lá");
  assert.equal(legacy.rounds[0].tarot[2][0].repeatOf.doclap, false);
  assert.ok((await reveal(legacy)).hashOk);
});

test("lưu/xuất/nhập JSON không mất ánh xạ, không ghi đè", async () => {
  const s = await demoSession();
  addRound(s, T_IN);
  const mem = new Map();
  const fake = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  assert.ok(saveSessions([s], fake));
  const back = loadSessions(fake);
  assert.equal(back[0].seed, s.seed);
  assert.deepEqual(back[0].rounds, JSON.parse(JSON.stringify(s.rounds)));
  const list = [];
  assert.equal(importJSON(exportJSON([s]), list), 1);
  assert.equal(importJSON(exportJSON([s]), list), 0, "trùng id thì bỏ qua");
  assert.equal((await reveal(list[0])).hashOk, true, "seed đủ để kiểm chứng sau khi nhập");
});

test("mẫu trải đúng số lá", () => {
  const n = (id) => { const t = spreadById(id).tiers(2027); return [t.length, t.reduce((a, x) => a + x.t, 0), t.reduce((a, x) => a + x.l, 0)]; };
  assert.deepEqual(n("3thang"), [3, 12, 12]);
  assert.deepEqual(n("12thang"), [12, 36, 36]);
  assert.deepEqual(n("canam"), [1, 12, 9]);
  assert.deepEqual(n("cokhong"), [3, 9, 9]);
  assert.deepEqual(n("vanhan"), [5, 15, 15]);
  assert.ok(SPREADS.find((s) => s.id === "tudo"));
});

test("quy đổi tiền ra số hợp lệ", async () => {
  const s = await demoSession();
  addRound(s, `${T_IN}\n${L_IN}`);
  const m = moneyTable(db, s, { thuNhap: 20, mucTieu: 30 });
  assert.equal(m.rows.length, 3);
  for (const r of m.rows) {
    for (const k of ["low", "center", "high"]) assert.ok(Number.isFinite(r[k]) && r[k] >= 0, `${k}=${r[k]}`);
    assert.ok(r.low <= r.center && r.center <= r.high);
    assert.ok(r.margin >= 0.3 && r.margin <= 0.4);
  }
  assert.ok(Number.isFinite(m.total) && Number.isFinite(m.perMonth) && Number.isFinite(m.targetPct));
  assert.equal(moneyTable(db, s, {}).missing, true);
  // lá cản kéo xuống, lá tiền kéo lên
  const card = (en) => db.tarot.la.find((c) => c.en === en) || db.lenormand.la.find((c) => c.en === en);
  const it = (en) => ({ s: card(en).diem_tien, v: card(en).toc_do });
  const down = periodEstimate([it("The Tower"), it("Five of Pentacles")], [it("Mountain"), it("Mice")], 20);
  const up = periodEstimate([it("Ace of Pentacles"), it("The Sun")], [it("Fish"), it("Clover")], 20);
  assert.ok(down.center < 20 && up.center > 20, `${down.center} / ${up.center}`);
  // canam: 12 dòng + so năm trước
  const sp = spreadById("canam");
  const y = await createSession({ cauHoi: "cả năm", spreadId: "canam", tiers: sp.tiers(2027), money: true, seed: SEED });
  addRound(y, "T: 1 2 3 4 5 6 7 8 9 10 11 12\nL: 1 2 3 4 5 6 7 8 9");
  const ym = moneyTable(db, y, { thuNhap: 15, namTruoc: 150 });
  assert.equal(ym.rows.length, 12);
  assert.ok(Number.isFinite(ym.vsPrevPct));
  assert.equal(roundNice(-3), 0);
  assert.equal(roundNice(7.3), 7.5);
});

// ---- 3 ca mẫu chạy động cơ luật: đủ mục, không lặp câu ----
const CASES = [
  { name: "tiền 3 tháng", q: "thu nhập 3 tháng tới", spread: "3thang", money: true, rev: false, input: `${T_IN}\n${L_IN}`, seed: SEED },
  { name: "có/không", q: "Có nên ký hợp đồng với bên này không?", spread: "cokhong", money: false, rev: false, input: "T: 16 3 44 / 70 12 5 / 61 29 77\nL: 14 25 33 / 8 30 20 / 2 6 19", seed: "a".repeat(64) },
  { name: "tình cảm có lá ngược", q: "Người ấy có quay lại không?", spread: "tinhcam", money: false, rev: true, input: "T: 1 2 3 4 5 6 7 8 9\nL: 24 28 29 7 13 36 31 33 4", seed: "b".repeat(64) },
];
const normS = (x) => x.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
for (const c of CASES) {
  test(`động cơ luật — ca ${c.name}: đủ mục, không lặp câu`, async () => {
    const sp = spreadById(c.spread);
    const s = await createSession({ cauHoi: c.q, spreadId: sp.id, tiers: sp.tiers(2027), money: c.money, reversals: c.rev, seed: c.seed });
    addRound(s, c.input);
    const r = analyze(db, s, { xungHo: "Queen Linh", thuNhap: 20, mucTieu: 30 });
    assert.ok(r.tong_quan && r.tong_ket.startsWith("Queen Linh"), "thiếu tổng quan/tổng kết");
    assert.ok(r.chu_de_troi.length >= 2, "thiếu chủ đề trội");
    assert.equal(r.tang.length, 3);
    r.tang.forEach((t, i) => {
      assert.equal(t.tarot_doc.length, s.rounds[0].tarot[i].length, `tầng ${i + 1} thiếu đọc Tarot`);
      assert.ok(t.dong_chay, `tầng ${i + 1} thiếu dòng chảy`);
      assert.ok(t.lenormand_cap.length >= 1 && t.lenormand_bo_ba.length >= 1 && t.lenormand_chuoi, `tầng ${i + 1} thiếu Lenormand cặp/bộ ba/chuỗi`);
      assert.ok(t.diem >= 1 && t.diem <= 10);
      assert.ok(t.chot && t.diem_nghen && t.loi_khuyen, `tầng ${i + 1} thiếu chốt/nghẽn/khuyên`);
      if (c.spread === "cokhong") assert.ok(t.tra_loi);
    });
    assert.ok(r.noi_tang.length >= 2 && r.mau_thuan.length >= 1 && r.loi_khuyen.length >= 1);
    if (c.money) assert.ok(r.tien && r.tien.includes("không phải dự báo tài chính"));
    const sents = allSentences(r).filter((x) => x.length >= 18).map(normS);
    const dup = sents.filter((x, i) => sents.indexOf(x) !== i);
    assert.deepEqual(dup, [], "có câu lặp");
    const fu = ruleFollowUp(r, "tầng 2 thế nào, có rủi ro gì?");
    assert.ok(fu.includes(r.tang[1].ten) && fu.length > 80);
  });
}

test("kho tri thức offline: đủ lá, đúng chủ đề, nghĩa cặp, hỏi tiếp theo tên lá", async () => {
  assert.equal(db.tarot.la.filter((c) => c.tri).length, 78, "thiếu tri thức Tarot");
  assert.equal(db.lenormand.la.filter((c) => c.tri).length, 36, "thiếu tri thức Lenormand");
  for (const c of db.tarot.la) for (const k of ["chung", "tinh", "viec", "suc_khoe", "van_han"]) assert.ok(c.tri[k]?.length > 20, `${c.en}.${k}`);
  assert.equal(mainTopic("Tháng sau đi phỏng vấn có đỗ không?"), "viec");
  assert.equal(mainTopic("Sức khoẻ mẹ tôi sau phẫu thuật"), "suckhoe");
  assert.equal(mainTopic("Người ấy nghĩ gì về tôi?"), "tinh");
  const sun = db.tarot.la.find((c) => c.en === "The Sun");
  assert.equal(tarotMeaning(sun, false, "viec"), sun.tri.viec);
  assert.equal(tarotMeaning(sun, true, "tinh"), sun.tri.nguoc.tinh);
  assert.equal(tarotMeaning(sun, false, "tinh", "Người kia nghĩ gì"), sun.tri.doi_phuong);
  const [k, v] = Object.entries(db.lenormand.capDay)[0];
  const [ea, eb] = k.split("+"), A = db.lenormand.la.find((c) => c.en === ea), B = db.lenormand.la.find((c) => c.en === eb);
  assert.equal(capMeaning(db, A, B, "tinh", false), v.t);
  assert.equal(capMeaning(db, A, B, "viec", false), v.v);
  // một ca công việc: lá Tarot được đọc bằng nghĩa công việc, hỏi tiếp theo tên lá trả lời được
  const sp = spreadById("cokhong");
  const s = await createSession({ cauHoi: "Đi phỏng vấn công ty mới có đỗ không?", spreadId: sp.id, tiers: sp.tiers(2027), money: false, reversals: false, seed: "c".repeat(64) });
  addRound(s, ["T: 20 34 56 / 11 2 41 / 7 66 18", "L: 1 25 33 / 9 16 31 / 2 3 4"].join(String.fromCharCode(10)));
  const r = analyze(db, s, { xungHo: "Queen Linh" });
  const x = r.tang[0].tarot_doc.join(" ");
  const c0 = r._cards.find((c) => c.deck === "tarot");
  assert.ok(c0?.nghia && x.toLowerCase().includes(c0.nghia.slice(1, 40).toLowerCase()), "tầng 1 chưa dùng nghĩa công việc");
  const fu = ruleFollowUp(r, `lá ${c0.vi} nghĩa là gì?`);
  assert.ok(fu.includes(c0.vi) && fu.includes(c0.nghia.slice(0, 20)), "hỏi tiếp theo tên lá chưa trả lời");
});

test("Có/Không theo ngữ cảnh: 4 lá Tiền không còn Có tuyệt đối", async () => {
  const T = (en) => db.tarot.la.find((c) => c.en === en);
  const yn = (en, q, rev = false) => cardYesNo(T(en), rev, q)?.tra_loi;
  // không lá nào trả Có ở cả hai chiều xuôi/ngược với cùng lý do tuyệt đối
  for (const en of ["Ace of Pentacles", "Four of Pentacles", "Knight of Pentacles", "King of Pentacles"]) {
    const ck = T(en).tri.co_khong;
    assert.ok(ck.ngu_canh?.length >= 2, `${en} thiếu ngữ cảnh`);
    assert.notEqual(ck.xuoi, "Có", `${en} còn Có tuyệt đối`);
    assert.doesNotMatch(ck.ly_do, /luôn|chắc chắn đạt|tối đa/u, en);
  }
  assert.equal(yn("Four of Pentacles", "Tháng này có tiết kiệm được không?"), "Có");
  assert.equal(yn("Four of Pentacles", "Có nên đầu tư vào quán cà phê không?"), "Nghiêng Không");
  assert.equal(yn("Four of Pentacles", "Có nên đầu tư vào quán cà phê không?", true), "Có, có điều kiện");
  assert.equal(yn("Four of Pentacles", "Tình hình tài chính có ổn không?"), "Có, có điều kiện", "“chi” không được khớp nhầm trong “chính”");
  assert.equal(yn("Ace of Pentacles", "Có nên mở cửa hàng online không?"), "Có");
  assert.equal(yn("Ace of Pentacles", "Có nên nghỉ việc không?"), "Nghiêng Không");
  assert.equal(yn("Knight of Pentacles", "Tuần này có nhận được tiền không?"), "Nghiêng Không");
  assert.equal(yn("Knight of Pentacles", "Có nên tất tay vào coin không?"), "Không");
  assert.equal(yn("King of Pentacles", "Có nên ký hợp đồng thuê mặt bằng không?"), "Có");
  assert.equal(yn("King of Pentacles", "Có nên đánh bạc gỡ lại không?"), "Nghiêng Không");
  assert.equal(yn("The Sun", "Có thành không?", true), "Có, có điều kiện");
  // bản giải luật và prompt AI đều dùng câu trả lời theo ngữ cảnh
  const sp = spreadById("cokhong");
  const s = await createSession({ cauHoi: "Có nên đầu tư thêm vào cửa hàng không?", spreadId: sp.id, tiers: sp.tiers(2027), money: false, reversals: false, seed: "d".repeat(64) });
  const n4 = (await ensureMapping(s, 0)).tang[0].tarot.indexOf(67) + 1; // vị trí nào ra 4 Tiền trong bảng tầng 1
  const rest = Array.from({ length: 78 }, (_, i) => i + 1).filter((n) => n !== n4).slice(0, 8);
  addRound(s, [`T: ${n4} ${rest[0]} ${rest[1]} / ${rest.slice(2, 5).join(" ")} / ${rest.slice(5, 8).join(" ")}`, "L: 1 2 3 / 4 5 6 / 7 8 9"].join(String.fromCharCode(10)));
  const four = s.rounds[0].tarot[0][0];
  assert.equal(db.tarot.la[four.card].en, "Four of Pentacles");
  const r = analyze(db, s, { xungHo: "Queen Linh" });
  assert.match(r.tang[0].tarot_doc[0], /nghiêng “Nghiêng Không”/u);
  assert.match(readingRequest(db, s, { reading: r, settings: {} }), /Có\/Không theo đúng câu hỏi này: Nghiêng Không/u);
});

test("lỗi cầu nối/AI ra câu dễ hiểu", () => {
  assert.match(friendlyError(new TypeError("Failed to fetch"), LOCAL_KEY), /Cầu nối AI trên máy/u);
  assert.match(friendlyError(new TypeError("Failed to fetch"), "k"), /Không kết nối được/u);
  assert.match(friendlyError({ timeout: true }), /quá lâu/u);
  assert.match(friendlyError({ status: 429, message: "x" }), /quá tải/u);
});

test("gợi ý mẫu trải theo câu hỏi", () => {
  assert.equal(suggestSpread("thu nhập 3 tháng tới").id, "3thang");
  assert.equal(suggestSpread("Có nên ký hợp đồng này không?").id, "cokhong");
  assert.equal(suggestSpread("Người ấy có quay lại không?").id, "tinhcam");
  assert.equal(suggestSpread("vận hạn tháng này").id, "vanhan");
  assert.equal(suggestSpread("tài chính năm 2027 từng tháng").id, "12thang");
  assert.equal(suggestSpread("tổng quan cả năm 2027").year, 2027);
});

test("AI: dò model, 429 → model dự phòng, streaming SSE ghép JSON, JSON dở vẫn đọc được", async () => {
  const s = await demoSession();
  addRound(s, `${T_IN}\n${L_IN}`);
  const rule = analyze(db, s, { thuNhap: 20 });
  const answer = JSON.stringify({ tong_quan: "Tổng quan.", chu_de_troi: ["a"], tang: [{ ten: "T1", diem: 7, tarot_doc: ["x"], dong_chay: "d", lenormand_cap: ["c"], chot: "c", diem_nghen: "n", loi_khuyen: "k" }], noi_tang: ["n"], mau_thuan: ["m"], tong_ket: "Kết.", loi_khuyen: ["l"] });
  const calls = [];
  const sseBody = (chunks) => new ReadableStream({ start(c) { for (const ch of chunks) c.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: ch }] } }] })}\r\n\r\n`)); c.close(); } });
  const fakeFetch = async (url, opts = {}) => {
    calls.push(url);
    if (url.includes("/models?")) return new Response(JSON.stringify({ models: [{ name: "models/gemini-2.5-flash", supportedGenerationMethods: ["generateContent"] }, { name: "models/gemini-9.0-pro", supportedGenerationMethods: ["generateContent"] }, { name: "models/embedding-001", supportedGenerationMethods: ["embedContent"] }] }), { status: 200 });
    assert.equal(opts.headers["x-goog-api-key"], "KHOA-GIA");
    const body = JSON.parse(opts.body);
    assert.equal(body.generationConfig.responseMimeType, "application/json");
    assert.ok(body.systemInstruction.parts[0].text.includes("lão luyện"));
    if (url.includes("gemini-9.0-pro")) return new Response(JSON.stringify({ error: { message: "quota" } }), { status: 429 });
    return new Response(sseBody([answer.slice(0, 40), answer.slice(40, 90), answer.slice(90)]), { status: 200 });
  };
  const mem = new Map();
  const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) };
  const seen = [];
  const out = await streamWithFallback({ provider: "gemini", key: "KHOA-GIA", system: SYSTEM_READING, json: true, storage, fetchImpl: fakeFetch,
    messages: [{ role: "user", text: readingRequest(db, s, { reading: rule, money: rule._money }) }], onText: (full) => seen.push(full) });
  assert.equal(out.model, "gemini-2.5-flash", "phải nhảy sang model dự phòng sau 429");
  assert.ok(calls.some((u) => u.includes("gemini-9.0-pro")), "phải thử model mạnh nhất trước");
  assert.equal(seen.length, 3, "streaming theo từng khúc");
  const r = normalizeReading(partialJSON(out.text), rule);
  assert.equal(r.tang[0].diem, 7);
  assert.ok(partialJSON(seen[1]), "JSON dở dang vẫn dựng được");
  assert.ok(!JSON.stringify(mem.get("boi.v2.models")).includes("KHOA"), "không lưu khoá vào bộ nhớ model");
});

test("trạm AI: ok → hiện chữ + model; 429 → câu báo + bản giải theo luật; mạng hỏng; quá 60 s", async () => {
  const s = await demoSession();
  addRound(s, `${T_IN}\n${L_IN}`);
  const rule = analyze(db, s, { thuNhap: 20 });
  const answer = JSON.stringify({ tong_quan: "Tổng quan từ trạm.", chu_de_troi: ["a"], tang: [{ ten: "T1", diem: 8, tarot_doc: ["x"], dong_chay: "d", lenormand_cap: ["c"], chot: "c", diem_nghen: "n", loi_khuyen: "k" }], noi_tang: ["n"], mau_thuan: ["m"], tong_ket: "Kết.", loi_khuyen: ["l"] });
  const messages = [{ role: "user", text: readingRequest(db, s, { reading: rule, money: rule._money }) }];
  const calls = [];
  const okFetch = async (url, opts = {}) => {
    calls.push({ url, opts });
    return new Response(JSON.stringify({ ok: true, model: "gemini-2.5-flash", data: { candidates: [{ content: { parts: [{ text: "suy nghĩ", thought: true }, { text: answer.slice(0, 50) }, { text: answer.slice(50) }] } }] } }), { status: 200 });
  };
  const seen = [], models = [];
  const out = await streamWithFallback({ provider: "gemini", key: TRAM_KEY, system: SYSTEM_READING, json: true, fetchImpl: okFetch, messages, onText: (full) => seen.push(full), onModel: (m) => models.push(m) });
  assert.equal(calls.length, 1, "trạm chỉ gọi một lần, không dò model");
  assert.equal(calls[0].url, TRAM_URL);
  assert.equal(calls[0].opts.method, "POST");
  assert.equal(calls[0].opts.redirect, "follow");
  assert.equal(calls[0].opts.headers["content-type"], "text/plain;charset=utf-8", "text/plain để khỏi preflight CORS");
  assert.ok(!Object.keys(calls[0].opts.headers).some((h) => /key|token|authorization/i.test(h)), "web không gửi khoá nào");
  const sent = JSON.parse(calls[0].opts.body);
  assert.equal(sent.model, "gemini-flash-latest");
  assert.equal(sent.body.generationConfig.responseMimeType, "application/json");
  assert.ok(sent.body.systemInstruction.parts[0].text.includes("lão luyện"));
  assert.equal(sent.body.contents[0].role, "user");
  assert.equal(out.model, "gemini-2.5-flash", "model thật lấy từ trạm");
  assert.equal(out.text, answer, "bỏ phần thought, ghép đủ chữ");
  assert.deepEqual(seen, [answer]);
  assert.deepEqual(models, ["gemini-flash-latest"]);
  assert.equal(normalizeReading(partialJSON(out.text), rule).tong_quan, "Tổng quan từ trạm.");

  // 429 → câu báo tiếng Việt + lời dẫn tới bản giải theo luật; động cơ luật vẫn cho bản đầy đủ
  const busy = async () => new Response(JSON.stringify({ ok: false, status: 429, error: "quota" }), { status: 200 });
  const e429 = await streamWithFallback({ provider: "gemini", key: TRAM_KEY, system: SYSTEM_READING, json: true, fetchImpl: busy, messages }).then(() => null, (e) => e);
  assert.equal(e429?.status, 429);
  const n = aiFailNotice(e429, TRAM_KEY);
  assert.match(n.status, /Đang đông người hỏi, thử lại sau ít phút/u);
  assert.match(n.note, /bản giải theo luật/u);
  assert.ok(rule.tang.length && rule.tong_ket, "bản giải theo luật vẫn có đủ để hiện");

  // Mạng hỏng / lỗi khác / quá thời hạn
  const down = async () => { throw new TypeError("Failed to fetch"); };
  const eNet = await streamWithFallback({ provider: "gemini", key: TRAM_KEY, system: "s", messages, fetchImpl: down }).then(() => null, (e) => e);
  assert.equal(friendlyError(eNet, TRAM_KEY), "Không kết nối được máy giải, kiểm tra mạng.");
  const e500 = await streamWithFallback({ provider: "gemini", key: TRAM_KEY, system: "s", messages, fetchImpl: async () => new Response("<html>lỗi</html>", { status: 500 }) }).then(() => null, (e) => e);
  assert.equal(friendlyError(e500, TRAM_KEY), "Máy giải đang bận.");
  const hang = (url, opts) => new Promise((_, rej) => opts.signal.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError"))));
  const eSlow = await streamWithFallback({ provider: "gemini", key: TRAM_KEY, system: "s", messages, fetchImpl: hang, tramTimeoutMs: 30 }).then(() => null, (e) => e);
  assert.ok(eSlow?.timeout, "quá thời hạn phải có cờ timeout");
  assert.equal(friendlyError(eSlow, TRAM_KEY), "Máy giải đang bận.");
});

test("mỗi câu hỏi một bảng ánh xạ MỚI (crypto.getRandomValues), không ghi bảng vào localStorage", async () => {
  const sp = spreadById("3thang");
  const q1 = await createSession({ cauHoi: "câu 1", spreadId: sp.id, tiers: sp.tiers(), money: true });
  const q2 = await createSession({ cauHoi: "câu 2", spreadId: sp.id, tiers: sp.tiers(), money: true });
  assert.match(q1.seed, /^[0-9a-f]{64}$/);
  assert.notEqual(q1.seed, q2.seed, "seed mới cho mỗi câu hỏi");
  assert.notEqual(q1.hash, q2.hash);
  const m1 = await ensureMapping(q1, 0), m2 = await ensureMapping(q2, 0);
  assert.notDeepEqual(m1.tang[0].tarot, m2.tang[0].tarot, "2 câu hỏi liên tiếp → 2 bảng Tarot khác nhau");
  assert.notDeepEqual(m1.tang[0].lenormand, m2.tang[0].lenormand, "2 câu hỏi liên tiếp → 2 bảng Lenormand khác nhau");
  // các tầng trong cùng câu hỏi cũng xáo riêng, mỗi tầng là hoán vị đủ 78 / 36
  assert.notDeepEqual(m1.tang[0].tarot, m1.tang[1].tarot);
  for (const t of m1.tang) {
    assert.deepEqual([...t.tarot].sort((x, y) => x - y), [...Array(78).keys()]);
    assert.deepEqual([...t.lenormand].sort((x, y) => x - y), Array.from({ length: 36 }, (_, i) => i + 1));
  }
  // lưu xuống máy: chỉ seed + mã khoá, không có bảng ánh xạ để tái dùng
  addRound(q1, T_IN);
  const mem = new Map();
  const fake = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  saveSessions([q1, q2, { ...q2, id: "x", mapping: m2 }], fake);
  const raw = [...mem.values()].join("");
  assert.doesNotMatch(raw, /"mapping"|"tang":\[\{/u, "localStorage không chứa bảng ánh xạ");
  assert.ok(!raw.includes(JSON.stringify(m1.tang[0].tarot)), "không có hoán vị 78 lá trong localStorage");
  assert.doesNotMatch(exportJSON([q1]), /"mapping"/u);
});

// Tìm vị trí (1-based) của một lá trong bảng một tầng
const slotOf = (m, ti, deck, card) => m.tang[ti][deck].indexOf(card) + 1;

test("luồng Lưu từng tầng: đủ lá mới Lưu được, xáo lại, sửa tầng đã lưu, đủ tầng mới Giải bài; lá trùng = chủ đề lặp lại", async () => {
  const s = await demoSession("e".repeat(64));
  const m = await ensureMapping(s, 0);
  const p = startPick(s, 0, false);
  assert.equal(p.cur, 0);
  assert.equal(pickReady(p), false);
  // Tầng 1: 4 Tarot + 4 Lenormand. Cài cho lá Vua Gậy (id 50) ra ở tầng 1 và tầng 3, Con Cá ở tầng 1 và 2
  const KING = db.tarot.la.findIndex((c) => c.en === "King of Wands");
  const FISH = db.lenormand.la.find((c) => c.en === "Fish").id;
  const t1 = [slotOf(m, 0, "tarot", KING), ...[1, 2, 3, 4, 5].filter((k) => m.tang[0].tarot[k - 1] !== KING).slice(0, 3)];
  const l1 = [slotOf(m, 0, "lenormand", FISH), ...[1, 2, 3, 4, 5].filter((k) => m.tang[0].lenormand[k - 1] !== FISH).slice(0, 3)];
  for (const k of t1.slice(0, 3)) assert.ok(togglePick(s, p, "tarot", k).ok);
  assert.equal(saveTier(s, p).ok, false, "chưa đủ lá thì không Lưu");
  const last = togglePick(s, p, "tarot", t1[3]);
  assert.ok(last.ok && last.switched, "đủ Tarot thì tự sang Lenormand");
  assert.equal(togglePick(s, p, "tarot", 70).reason, "full", "không chọn quá số lá của tầng");
  for (const k of l1) togglePick(s, p, "lenormand", k);
  assert.ok(tierComplete(s, p));
  const r1 = saveTier(s, p);
  assert.deepEqual([r1.ok, r1.next, p.cur, savedCount(p)], [true, 1, 1, 1]);
  assert.deepEqual(p.draft, { tarot: [], lenormand: [] }, "sang tầng 2 là bộ mới, chưa chọn gì");
  assert.equal(pickReady(p), false, "mới lưu 1/3 thì chưa có Giải bài");
  // Tầng 2: Con Cá lại ở vị trí khác vì bảng tầng 2 xáo riêng
  const l2 = [slotOf(m, 1, "lenormand", FISH), ...[6, 7, 8, 9, 10].filter((k) => m.tang[1].lenormand[k - 1] !== FISH).slice(0, 3)];
  for (const k of [11, 12, 13, 14]) togglePick(s, p, "tarot", k);
  for (const k of l2) togglePick(s, p, "lenormand", k);
  saveTier(s, p);
  // Tầng 3: Vua Gậy ra lại
  const t3 = [slotOf(m, 2, "tarot", KING), ...[20, 21, 22, 23, 24].filter((k) => m.tang[2].tarot[k - 1] !== KING).slice(0, 3)];
  for (const k of t3) togglePick(s, p, "tarot", k);
  for (const k of [30, 31, 32, 33]) togglePick(s, p, "lenormand", k);
  const r3 = saveTier(s, p);
  assert.equal(r3.next, -1);
  assert.ok(pickReady(p), "đủ 3/3 tầng → hiện Giải bài");
  // Xem lại / sửa tầng 2 trước khi giải: Giải bài ẩn lại cho tới khi Lưu
  assert.ok(editTier(s, p, 1));
  assert.equal(pickReady(p), false);
  assert.deepEqual(p.draft.lenormand, l2, "nháp nạp lại đúng lá đã chọn của tầng 2");
  togglePick(s, p, "tarot", 14); togglePick(s, p, "tarot", 15);
  saveTier(s, p);
  assert.ok(pickReady(p));
  assert.deepEqual(p.saved[1].tarot, [11, 12, 13, 15]);
  // Giải bài
  addPickedRound(s, p.saved);
  const round = s.rounds[0];
  assert.equal(round.tarot[0][0].card, KING);
  assert.equal(round.tarot[2][0].card, KING);
  assert.equal(round.lenormand[1][0].card, FISH);
  assert.ok(round.tarot[0][0].chon && !cardName(db, "tarot", round.tarot[0][0]).match(/\d+ →/), "lá bấm từ lưới úp không mang số");
  assert.deepEqual(round.tarot[2][0].repeatOf, { round: 1, tier: 1, pos: 1, doclap: true });
  assert.ok(round.lenormand[1][0].repeatOf?.doclap);
  const r = analyze(db, s, { xungHo: "Queen Linh", thuNhap: 20 });
  assert.match(r.tang[2].lap.join(" "), /chủ đề lặp lại xuyên các tháng/u);
  assert.match(r.noi_tang.join(" "), /Vua Gậy ra ở cả Tháng .+ và Tháng .+ dù mỗi tháng xáo lại đủ bộ/u);
  assert.match(r.noi_tang.join(" "), /Con Cá ra ở cả/u);
  assert.match(r.tang[2].tarot_doc[0], /ra lại dù bộ bài xáo lại đủ lá/u);
  const req = readingRequest(db, s, { reading: r, settings: {} });
  assert.match(req, /mỗi tầng xáo lại từ đủ 78 Tarot \+ 36 Lenormand/u);
  assert.match(req, /RA LẠI \(đã ra ở tầng 1/u);
  assert.ok((await reveal(s)).mappingOk);
});

test("trải 1 tầng vẫn Lưu → Giải bài", async () => {
  const sp = spreadById("canam");
  const s = await createSession({ cauHoi: "cả năm", spreadId: sp.id, tiers: sp.tiers(2027), money: true });
  const p = startPick(s, 0, false);
  for (let k = 1; k <= 12; k++) togglePick(s, p, "tarot", k);
  for (let k = 1; k <= 9; k++) togglePick(s, p, "lenormand", k);
  assert.equal(pickReady(p), false, "chưa Lưu thì chưa Giải bài");
  assert.equal(saveTier(s, p).next, -1);
  assert.ok(pickReady(p));
  await ensureMapping(s, 0);
  addPickedRound(s, p.saved);
  assert.equal(s.rounds[0].tarot[0].length, 12);
});

test("prompt AI: văn phong reader thật, luôn tiếng Việt, đọc từng tầng rồi kết luận chung", async () => {
  for (const k of ["LUÔN viết bằng tiếng Việt", "chi tiết hình ảnh", "TỪNG TẦNG", "CHỦ ĐỀ LẶP LẠI", "CẤM sáo rỗng", "kết luận chung"]) assert.ok(SYSTEM_READING.includes(k), k);
  assert.match(SYSTEM_CHAT, /Luôn trả lời bằng tiếng Việt/u);
  const s = await demoSession();
  addRound(s, T_IN);
  assert.match(readingRequest(db, s, {}), /hoàn toàn bằng tiếng Việt: mở bài, rồi đọc lần lượt từng tầng/u);
});

test("ngoài máy nhà: dò 127.0.0.1 trả về nhanh, đi thẳng Worker cố định (không đọc cau_noi.json); Worker chết/treo → bản luật, KHÔNG rơi sang Gemini", async () => {
  const refused = async () => { throw new TypeError("Failed to fetch"); };
  const hang = (url, opts = {}) => new Promise((_, rej) => opts.signal?.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError"))));
  try {
    assert.equal(WORKER_BASE, "https://boi-cau-noi.hiennhi89.workers.dev/claude");
    assert.equal(aiKey(), LOCAL_KEY, "mặc định đi cầu nối Claude, trạm chỉ là dự phòng");
    let t0 = Date.now();
    const goi = [];
    assert.equal(await probeBridge(async (u, o) => { goi.push(u); return refused(u, o); }, { on: true }), true);
    assert.ok(Date.now() - t0 < 1000);
    assert.deepEqual(goi, [`${LOCAL_BASE}/ping`], "chỉ ping 127.0.0.1, không đọc cau_noi.json");
    assert.equal(bridge.local, false);
    assert.equal(via.base, WORKER_BASE);
    assert.deepEqual(diaChiCauNoi(), [WORKER_BASE], "máy khác: chỉ Worker");
    t0 = Date.now();
    await probeBridge(hang, { on: true, localMs: 40 });
    assert.ok(Date.now() - t0 < 1000, "127.0.0.1 treo vẫn dò xong nhanh");
    assert.equal(aiKey(), LOCAL_KEY);
    // Worker chết (cả 2 lượt) → trạm
    // Chỉ Claude (GĐ 30/10): Worker chết (cả 2 lượt) → lỗi cầu nối, không gọi trạm
    let thuLai = 0, tram = 0;
    const eA = await streamWithFallback({ provider: "gemini", key: LOCAL_KEY, system: "s", json: true, messages: [{ role: "user", text: "x" }],
      fetchImpl: (url, o) => { if (url === TRAM_URL) tram++; return refused(url, o); }, onThuLai: () => thuLai++ }).then(() => null, (e) => e);
    assert.equal(eA.cuu, "cầu nối Claude lỗi (cầu nối chết) → luật");
    assert.equal(thuLai, 1, "thử lại cầu nối đúng 1 lần");
    assert.equal(tram, 0, "không gọi trạm Gemini");
    t0 = Date.now();
    const eB = await streamWithFallback({ provider: "gemini", key: LOCAL_KEY, system: "s", json: true, messages: [{ role: "user", text: "x" }], localTimeoutMs: 50,
      fetchImpl: (url, o) => (url.startsWith(WORKER_BASE) ? hang(url, o) : refused(url, o)) }).then(() => null, (e) => e);
    assert.equal(eB.cuu, "cầu nối Claude lỗi (cầu nối quá giờ) → luật", "Worker treo → sau hạn chờ dừng, không treo");
    assert.ok(Date.now() - t0 < 2000);
  } finally { datLaiCauNoi(); }
});

// ---- Vòng 2: chống mất dấu, nhãn phán một bộ, tên lá theo dữ liệu, bỏ ô nhập số ----
const tramReply = (text, model = "gemini-flash-lite-latest") => new Response(JSON.stringify({ ok: true, model, data: { candidates: [{ content: { parts: [{ text }] } }] } }), { status: 200 });
const BAI = (ch) => JSON.stringify({ tong_quan: ch, chu_de_troi: [ch], tang: [{ ten: "Tháng 11/2026", diem: 7, tarot_doc: [ch], dong_chay: ch, lenormand_cap: [ch], chot: ch, diem_nghen: ch, loi_khuyen: ch }], noi_tang: [ch], mau_thuan: [ch], tong_ket: ch, loi_khuyen: [ch] });
const KHONG_DAU = "Chao Queen Linh, toi ngoi day voi ban va doc tung la mot. Thang nay tien vao deu nhung phai giu ky luat chi tieu.";
const CO_DAU = "Chào Queen Linh, tôi ngồi đây với bạn và đọc từng lá một. Tháng này tiền vào đều nhưng phải giữ kỷ luật chi tiêu.";

test("(b) tỉ lệ dấu: câu không dấu < 0,15, câu có dấu > 0,2; JSON chỉ tính giá trị chuỗi", () => {
  assert.ok(tyLeDau("Chao Queen Linh, toi ngoi day voi ban") < NGUONG_DAU);
  assert.ok(tyLeDau("Chào Queen Linh, tôi ngồi đây với bạn") > 0.2);
  assert.ok(tyLeDauBai(BAI(CO_DAU)) > 0.2, "khoá JSON không dấu không kéo tỉ lệ xuống");
  assert.ok(tyLeDauBai(BAI(KHONG_DAU)) < NGUONG_DAU);
  assert.equal(matDau(BAI(KHONG_DAU)), true);
  assert.equal(matDau(BAI(CO_DAU)), false);
  assert.equal(matDau("OK"), false, "quá ít chữ thì không kết luận");
});

test("(a) trạm trả không dấu → gọi lại đúng 1 lần; lần 2 có dấu → nhận; lần 2 vẫn không dấu → bản luật + câu báo", async () => {
  const s = await demoSession();
  addRound(s, `${T_IN}\n${L_IN}`);
  const rule = analyze(db, s, { thuNhap: 20 });
  const messages = [{ role: "user", text: readingRequest(db, s, { reading: rule, money: rule._money }) }];
  // lần 2 có dấu
  const sent = [], shown = [];
  const lan2Ok = async (url, o) => { sent.push(JSON.parse(o.body)); return tramReply(BAI(sent.length === 1 ? KHONG_DAU : CO_DAU)); };
  const ok = await goiCoDau({ provider: "gemini", key: TRAM_KEY, system: SYSTEM_READING, json: true, messages, fetchImpl: lan2Ok, onText: (t) => shown.push(t) });
  assert.equal(sent.length, 2, "gọi lại đúng 1 lần");
  assert.equal(ok.lan, 2);
  assert.ok(tyLeDauBai(ok.text) > 0.2);
  const lastMsg = sent[1].body.contents.at(-1).parts[0].text;
  assert.ok(lastMsg.endsWith(NHAC_DAU), "lần gọi lại có dòng nhắc mất dấu");
  assert.ok(!sent[0].body.contents.at(-1).parts[0].text.includes(NHAC_DAU));
  assert.equal(shown.length, 1, "chữ không dấu không được đẩy ra màn hình");
  assert.ok(!matDau(shown[0]));
  // có dấu ngay lần 1 → chỉ 1 lần gọi
  let n1 = 0;
  await goiCoDau({ provider: "gemini", key: TRAM_KEY, system: "s", json: true, messages, fetchImpl: async () => { n1++; return tramReply(BAI(CO_DAU)); } });
  assert.equal(n1, 1);
  // lần 2 vẫn không dấu → lỗi matDau, câu báo, bản luật vẫn đủ
  let n2 = 0;
  const e = await goiCoDau({ provider: "gemini", key: TRAM_KEY, system: "s", json: true, messages, fetchImpl: async () => { n2++; return tramReply(BAI(KHONG_DAU)); } }).then(() => null, (x) => x);
  assert.equal(n2, 2, "không gọi quá 2 lần");
  assert.ok(e?.matDau);
  assert.equal(friendlyError(e, TRAM_KEY), BAO_MAT_DAU);
  assert.equal(aiFailNotice(e, TRAM_KEY).status, "Máy giải trả chữ không dấu, đang dùng bản giải theo luật.");
  assert.ok(rule.tang.length && rule.tong_ket, "bản giải theo luật vẫn có để hiện");
  // hỏi tiếp (chữ thường, không JSON) cũng qua cổng
  let n3 = 0;
  const e3 = await goiCoDau({ provider: "gemini", key: TRAM_KEY, system: SYSTEM_CHAT, json: false, messages: [{ role: "user", text: "Thang 12 the nao?" }], fetchImpl: async () => { n3++; return tramReply(KHONG_DAU); } }).then(() => null, (x) => x);
  assert.equal(n3, 2);
  assert.ok(e3?.matDau);
});

test("(c) nhãn phán: một bộ có dấu trùng động cơ luật; gập không dấu về đúng nhãn; không khớp lấy theo điểm", async () => {
  assert.deepEqual(YN, ["CÓ", "CÓ, NHƯNG CÓ ĐIỀU KIỆN", "NGHIÊNG VỀ KHÔNG", "KHÔNG"]);
  assert.deepEqual(SCHEMA.properties.tang.items.properties.tra_loi.enum, YN);
  assert.ok(SYSTEM_READING.includes(YN.join(" / ")));
  assert.ok(!/CÓ CÓ ĐIỀU KIỆN|NGHIÊNG KHÔNG /.test(SYSTEM_READING), "prompt không còn bộ nhãn cũ");
  assert.equal(normYN("CO CO DIEU KIEN"), "CÓ, NHƯNG CÓ ĐIỀU KIỆN");
  assert.equal(normYN("7.5/10 CÓ"), "CÓ");
  assert.equal(normYN("CÓ ĐIỀU KIỆN"), "CÓ, NHƯNG CÓ ĐIỀU KIỆN");
  assert.equal(normYN("nghieng khong"), "NGHIÊNG VỀ KHÔNG");
  assert.equal(normYN("KHÔNG"), "KHÔNG");
  assert.equal(normYN("???"), null);
  const sp = spreadById("cokhong");
  const s = await createSession({ cauHoi: "Có nên ký hợp đồng không?", spreadId: sp.id, tiers: sp.tiers(2027), money: false, seed: SEED });
  addRound(s, "T: 1 2 3 / 4 5 6 / 7 8 9\nL: 1 2 3 / 4 5 6 / 7 8 9");
  const rule = analyze(db, s, {});
  const tier = (tra_loi, diem) => ({ ten: "t", diem, tra_loi, tarot_doc: ["x", "y", "z"], dong_chay: "d", lenormand_cap: ["c"], chot: "c", diem_nghen: "n", loi_khuyen: "k" });
  const r = normalizeReading({ tang: [tier("CÓ ĐIỀU KIỆN", 6), tier("7.5/10 CÓ", 7.5), tier("hmm", 3)] }, rule);
  assert.deepEqual(r.tang.map((t) => t.tra_loi), ["CÓ, NHƯNG CÓ ĐIỀU KIỆN", "CÓ", "KHÔNG"]);
  // câu hỏi không phải Có/Không thì không gắn nhãn phán
  const s2 = await demoSession();
  addRound(s2, T_IN);
  assert.equal(normalizeReading({ tang: [tier("CÓ", 7)] }, analyze(db, s2, {})).tang[0].tra_loi, null);
});

test("(d) tên lá theo dữ liệu: AI tự dịch sai → thay bằng tên dữ liệu; nhãn tên lá đứng trước mỗi câu Tarot", async () => {
  assert.equal(suaTenLa(db, "La Phân Xết (Judgement)"), "Phán Xét (Judgement)");
  assert.equal(suaTenLa(db, "Tháng này lá Phân Xết (Judgement) gọi bạn."), "Tháng này lá Phán Xét (Judgement) gọi bạn.");
  assert.equal(suaTenLa(db, "Gặp Nguoi Đàn Ông (Man) ở đây."), "Gặp Người Đàn Ông (Man) ở đây.");
  assert.equal(suaTenLa(db, "Mặt Trăng (The Moon) mờ."), "Mặt Trăng (The Moon) mờ.", "tên đúng giữ nguyên");
  assert.equal(suaTenLa(db, "Không có ngoặc"), "Không có ngoặc");
  const s = await demoSession();
  addRound(s, T_IN);
  const rule = analyze(db, s, {});
  const r = normalizeReading({ tong_quan: "Bắt đầu với La Phân Xết (Judgement).", tang: [{ ten: "t", diem: 7, tarot_doc: ["a", "b", "c", "d"] }] }, rule, { db, session: s });
  assert.equal(r.tong_quan, "Bắt đầu với Phán Xét (Judgement).");
  assert.deepEqual(r.tang[0].tarot_ten, s.rounds[0].tarot[0].map((c) => cardName(db, "tarot", c)), "nhãn lấy từ dữ liệu, đúng thứ tự lá đã lật");
  assert.match(SYSTEM_READING, /không tự dịch/u);
});

test("(e) thân gửi trạm chỉ có ASCII (không byte > 127), giải mã lại đúng chữ có dấu; temperature 0.7; dòng dặn có dấu", async () => {
  const s = await demoSession();
  addRound(s, `${T_IN}\n${L_IN}`);
  const rule = analyze(db, s, { thuNhap: 20 });
  const req = readingRequest(db, s, { reading: rule, money: rule._money });
  let raw = "";
  await streamWithFallback({ provider: "gemini", key: TRAM_KEY, system: SYSTEM_READING, json: true, messages: [{ role: "user", text: req }], fetchImpl: async (u, o) => { raw = o.body; return tramReply(BAI(CO_DAU)); } });
  assert.ok([...Buffer.from(raw, "utf8")].every((b) => b < 128), "không còn byte > 127");
  const back = JSON.parse(raw);
  assert.equal(back.body.contents[0].parts[0].text, req, "giải mã lại đúng nguyên văn");
  assert.equal(back.body.generationConfig.temperature, 0.7);
  const DAU = "Mọi giá trị chuỗi phải là tiếng Việt CÓ DẤU đầy đủ; khoá JSON không dấu chỉ là tên trường, không được bắt chước.";
  assert.ok(SYSTEM_READING.trimEnd().endsWith(DAU));
  assert.ok(req.trimEnd().endsWith(DAU));
});

test("(f) màn chọn bài: không có ô gõ số, không lộ dải số 01–78 / 01–36", async () => {
  const s = await demoSession();
  store.sessions.push(s);
  const [, view] = ROUTES.find(([re]) => re.test(`/chon-so/${s.id}`));
  const { html } = view(`/chon-so/${s.id}`.match(/^\/chon-so\/([\w-]+)$/), new URLSearchParams());
  assert.ok(html.includes("grid-backs"), "đúng là màn chọn bài");
  assert.ok(!/id="typed"|<textarea/.test(html), "không có textarea #typed");
  assert.ok(!/01[–-]78|01[–-]36|(Tarot|Lenormand) \d+(\s*\/\s*\d+){2,}/.test(html), "không lộ dải số / số lá kiểu Tarot 3/3/3");
  assert.ok(!/<button[^>]*class="pick[^"]*"[^>]*>[^<]+<\/button>/.test(html), "lá úp không mang chữ/số hiển thị");
  store.sessions.pop();
});

// ---- Ô "Lời gửi khách" ----
// AI giả: viết lời gửi khách từ khối "NGHĨA THẬT CỦA TỪNG LÁ" có trong prompt (như AI thật phải làm)
function aiGiaTuNghia(prompt, ten = "") {
  const khoi = String(prompt).slice(Math.max(0, String(prompt).indexOf("=== NGHĨA THẬT CỦA TỪNG LÁ")));
  const nghia = [...khoi.matchAll(/^ {2}(?:Tarot \[[^\]]+\]|Lenormand) [^:]+: (.+)$/gmu)].map((m) => m[1].replace(" Lời khuyên của lá:", ""));
  const cau = nghia.flatMap((t) => t.split(/(?<=[.!?])\s+/u)).filter((c) => c.length > 15 && !/lá bài|lá này|Lá /u.test(c) && !chuCamTrong(c).length && !tenLaTrong(c, db).length);
  const out = [[], [], []];
  out[0].push(ten ? `${ten} ơi, trải bài của bạn nói khá rõ.` : "Về câu bạn hỏi, trải bài nói khá rõ.");
  let k = 0, n = 6;
  for (const c of cau) { if (n + c.split(/\s+/).length > 190) break; out[Math.min(2, Math.floor(k / 2))].push(c); n += c.split(/\s+/).length; k++; }
  out[2].push("Tuần này hãy làm một việc nhỏ đúng hướng đó.");
  const dem = () => out.flat().join(" ").split(/\s+/).length;
  const dem2 = ["Bạn hãy để ý những dấu hiệu nhỏ trong mấy ngày tới.", "Mỗi lựa chọn nhỏ hôm nay đều góp vào kết quả bạn muốn.", "Hãy giữ nhịp đều và đừng vội vàng kết luận."];
  for (let i = 0; dem() < 128 && i < dem2.length; i++) out[1].push(dem2[i]);
  return out.filter((p) => p.length).map((p) => p.join(" ")).join("\n\n");
}
// Lời gửi giả cho câu nhiều mốc: phần đầu dựng từ nghĩa thật (qua cổng ý khớp) + mỗi mốc 2–3 câu, thêm câu tới đủ số chữ
function aiDaiTuNghia(prompt, ten = "", soChu = 650) {
  const dau = aiGiaTuNghia(prompt, ten);
  const moc = (/theo thứ tự: ([^.]+)\./u.exec(prompt)?.[1] || "").split(", ").filter(Boolean);
  const loai = ["tiền vào đều tay", "có thêm một khoản nhỏ từ việc cũ", "chi tiêu dễ bị kéo lên", "công việc chính giữ nhịp ổn", "có người quen rủ góp vốn", "dòng tiền chậm lại một chút"];
  const viec = ["ghi lại mọi khoản chi trong tuần đầu", "để riêng một phần cho quỹ dự phòng", "hỏi kỹ giấy tờ trước khi ký", "dồn sức cho việc đang mang lại thu nhập chính", "hẹn lại khách cũ", "rà lại các khoản trả góp"];
  const them = ["Bạn nên giữ sổ thu chi gọn gàng để thấy rõ tiền đi đâu.", "Đừng để cảm xúc quyết định những khoản chi lớn.", "Một cuộc nói chuyện thẳng thắn với người cùng làm sẽ giúp bạn đỡ lo.", "Nhìn lại kế hoạch đầu năm để chỉnh cho sát.", "Những khoản nhỏ góp lại sẽ thành chỗ dựa cho tháng sau."];
  const khoi = moc.map((m, i) => [`${m} ${loai[i % loai.length]}, đây là điểm thuận bạn nên tận dụng.`, `Việc nên làm: ${viec[i % viec.length]}.`]);
  const ghep = () => [dau, ...Array.from({ length: Math.ceil(khoi.length / 3) }, (_, d) => khoi.slice(d * 3, d * 3 + 3).map((c) => c.join(" ")).join(" "))].join("\n\n");
  for (let k = 0; demChu(ghep()) < soChu && k < 200; k++) {
    const b = khoi[k % khoi.length];
    b.splice(b.length - 1, 0, k < khoi.length ? "Điều cần cẩn trọng là đừng hứa chi tiền khi chưa chắc khoản thu." : them[k % them.length]);
  }
  return ghep();
}
const LGK_OK = [
  "Bạn ơi, mình đã đọc kỹ câu bạn hỏi về chuyện công việc mới. Nhìn chung con đường đang mở ra theo hướng thuận, nhưng không phải kiểu dễ dàng ngồi chờ. Cơ hội đến từ chính những gì bạn đã chuẩn bị trong mấy tháng qua, và người quyết định đang để ý đến bạn nhiều hơn bạn nghĩ.",
  "Điều mình thấy rõ nhất là bạn đang tự nghi ngờ mình hơi nhiều. Chính sự do dự đó làm bạn chậm một nhịp so với người khác. Nếu bạn nói rõ mong muốn của mình, mọi chuyện sẽ trôi hơn hẳn, và những lo lắng hiện giờ phần lớn sẽ tự tan khi bạn bắt tay vào việc.",
  "Trong tuần này, bạn hãy viết ra ba điều bạn làm tốt nhất ở công việc cũ, rồi mang chúng vào buổi nói chuyện sắp tới. Đừng hạ giá bản thân, cứ bình tĩnh nói về những gì bạn đã làm được. Mình tin bạn sẽ thấy khác ngay sau buổi đó.",
].join("\n\n");

test("lời gửi khách — cổng kiểm: CHẶN lỗi cứng (tên lá, đầu dòng, đánh số, tiêu đề, in đậm, mất dấu, chữ cấm); độ dài/số đoạn chỉ là cảnh báo", () => {
  assert.ok(demChu(LGK_OK) >= 120 && demChu(LGK_OK) <= 220, `mẫu dài ${demChu(LGK_OK)}`);
  assert.equal(kiemLoiGuiKhach(LGK_OK, db).ok, true);
  assert.deepEqual(kiemLoiGuiKhach(LGK_OK, db).loi, []);
  const bad = (t, re) => { const k = kiemLoiGuiKhach(t, db); assert.equal(k.ok, false, t.slice(0, 40)); assert.match(k.loi.join("; "), re); };
  const mem = (t, re) => { const k = kiemLoiGuiKhach(t, db); assert.equal(k.ok, true, `lỗi mềm không chặn: ${k.loi}`); assert.match(k.canhBao.join("; "), re); };
  bad(LGK_OK.replace("Nhìn chung", "Lá Mặt Trăng cho thấy, nhìn chung"), /tên lá: Mặt Trăng/u);
  bad(LGK_OK.replace("Nhìn chung", "The Tower cho thấy"), /tên lá: The Tower/u);
  bad(LGK_OK.replace("Trong tuần này", "- Trong tuần này"), /đầu dòng/u);
  bad(LGK_OK.replace("Trong tuần này", "• Trong tuần này"), /đầu dòng/u);
  bad(LGK_OK.replace("Trong tuần này", "2. Trong tuần này"), /đánh số/u);
  bad(LGK_OK.replace("Trong tuần này", "## Lời khuyên\nTrong tuần này"), /tiêu đề/u);
  bad(LGK_OK.replace("Trong tuần này", "Lời khuyên:\nTrong tuần này"), /tiêu đề/u);
  bad(LGK_OK.replace("Mình tin bạn", "**Mình tin bạn**"), /in đậm/u);
  mem(LGK_OK.split("\n\n")[0], /dài|đoạn/u);
  mem(LGK_OK.replace(/\n\n/g, " "), /1 đoạn/u);
  mem(LGK_OK + "\n\n" + LGK_OK + "\n\n" + LGK_OK, /dài/u);
  bad("Ban oi, minh da doc ky cau ban hoi. ".repeat(14) + "\n\nThang nay ban nen giu nhip.", /mất dấu/u);
  assert.deepEqual(tenLaTrong("căn ngôi nhà nhỏ và trái tim ấm", db), [], "chữ thường trong câu không bị coi là tên lá");
  for (const [w, re] of [["web", /web/], ["app", /app/], ["ứng dụng", /app/], ["AI", /AI/], ["hệ thống", /hệ thống/], ["máy", /máy/], ["công cụ", /công cụ/], ["bốc ngẫu nhiên", /ngẫu nhiên/], ["thuật toán", /thuật toán/], ["seed", /seed/], ["mã khoá", /mã khoá/]]) {
    bad(LGK_OK.replace("Nhìn chung", `Theo ${w} thì nhìn chung`), new RegExp("chữ cấm: .*" + re.source, "u"));
  }
  assert.ok(kiemLoiGuiKhach(LGK_OK.replace("Nhìn chung", "Ai cũng mong điều tốt, và nhìn chung"), db).ok, "“Ai” (đại từ) không bị bắt nhầm là AI");
  assert.match(SYSTEM_LGK, /Không nhắc tới web, ứng dụng, AI, công cụ, máy/u);
});

async function sessionNgauNhien(id, i) {
  const sp = spreadById(id);
  const q = { "3thang": "Thu nhập 3 tháng tới thế nào?", cokhong: "Có nên ký hợp đồng không?", tinhcam: "Người ấy có quay lại không?", vanhan: "Vận hạn 4–6 tuần tới", canam: "Tổng quan cả năm 2027", "12thang": "Tài chính năm 2027" }[id];
  const s = await createSession({ cauHoi: q, spreadId: id, tiers: sp.tiers(2027), money: !!sp.money, reversals: i % 2 === 0 });
  const p = startPick(s, 0, false);
  for (const [ti, t] of s.tiers.entries()) {
    p.cur = ti; p.draft = { tarot: [], lenormand: [] };
    for (let k = 1; k <= t.t; k++) togglePick(s, p, "tarot", ((k * 7 + i * 13 + ti * 5) % 78) + 1);
    for (let k = 1; k <= t.l; k++) togglePick(s, p, "lenormand", ((k * 5 + i * 11 + ti * 3) % 36) + 1);
    p.saved[ti] = { tarot: [...p.draft.tarot], lenormand: [...p.draft.lenormand] };
  }
  addPickedRound(s, p.saved);
  return s;
}

test("lời gửi khách — bản luật viết xuôi luôn qua cổng (nhiều mẫu trải, seed ngẫu nhiên), không tên lá", async () => {
  const ids = ["3thang", "cokhong", "tinhcam", "vanhan", "canam", "12thang"];
  for (let i = 0; i < 36; i++) {
    const s = await sessionNgauNhien(ids[i % ids.length], i);
    const settings = i % 3 ? {} : { xungHo: "Queen Linh" };
    const t = loiGuiKhachLuat(db, s, analyze(db, s, settings), settings);
    const k = kiemLoiGuiKhach(t, db);
    assert.ok(k.ok, `${s.spreadId}: ${k.loi.join("; ")}\n${t}`);
    assert.ok(doanVan(t).length >= 2 && doanVan(t).length <= 4);
  }
  // câu hỏi có tên lá thì không trích nguyên văn
  const s = await sessionNgauNhien("cokhong", 1);
  s.cauHoi = "Lá Mặt Trăng hôm qua có nghĩa là tôi nên dừng không?";
  assert.ok(kiemLoiGuiKhach(loiGuiKhachLuat(db, s, analyze(db, s, {}), {}), db).ok);
});

test("lời gửi khách — AI đạt thì dùng; trượt thì viết lại đúng 1 lần; vẫn trượt thì bản luật", async () => {
  const s = await sessionNgauNhien("3thang", 2);
  const rule = analyze(db, s, {});
  const tot = aiGiaTuNghia(readingRequest(db, s, { reading: rule }));
  assert.ok(kiemLoiGuiKhach(tot, db, { session: s }).ok, kiemLoiGuiKhach(tot, db, { session: s }).loi.join("; "));
  const ok = await chotLoiGuiKhach({ db, session: s, rule, reading: { loi_gui_khach: tot }, call: async () => assert.fail("không được gọi lại") });
  assert.deepEqual([ok.nguon, ok.text], ["ai", tot]);
  const calls = [];
  const coTen = LGK_OK.replace("Nhìn chung", "Lá Vua Gậy cho thấy, nhìn chung");
  const r2 = await chotLoiGuiKhach({ db, session: s, rule, reading: { loi_gui_khach: coTen, tong_quan: "x", tang: [] }, call: async (sys, msg) => { calls.push({ sys, msg }); return aiGiaTuNghia(msg); } });
  assert.equal(calls.length, 1, "viết lại đúng 1 lần");
  assert.equal(calls[0].sys, SYSTEM_LGK);
  assert.match(calls[0].msg, /tên lá: Vua Gậy/u, "lời nhắc nói rõ lý do bị trả lại");
  assert.equal(r2.nguon, "ai-viet-lai");
  assert.match(calls[0].msg, /NGHĨA THẬT CỦA TỪNG LÁ ĐÃ TRẢI/u, "viết lại có đủ nghĩa thật của các lá");
  let n = 0;
  const r3 = await chotLoiGuiKhach({ db, session: s, rule, reading: { loi_gui_khach: "- Mặt Trăng: lo âu" }, call: async () => { n++; return "1. Vua Gậy\n2. Con Rắn"; } });
  assert.equal(n, 1);
  assert.equal(r3.nguon, "luat");
  assert.ok(kiemLoiGuiKhach(r3.text, db).ok, "bản luật dự phòng qua cổng");
  const r4 = await chotLoiGuiKhach({ db, session: s, rule, reading: { loi_gui_khach: "x" }, call: async () => { throw new TypeError("Failed to fetch"); } });
  assert.equal(r4.nguon, "luat", "lỗi mạng khi viết lại → bản luật");
  assert.ok(SCHEMA.required.includes("loi_gui_khach"));
  assert.match(SYSTEM_READING, /LỜI GỬI KHÁCH/u);
  assert.match(SYSTEM_READING, /KHÔNG nêu tên bất kỳ lá nào/u);
});

test("lời gửi khách — màn giải có ô #loi-gui-khach riêng và nút chép riêng", async () => {
  const s = await sessionNgauNhien("tinhcam", 3);
  store.db = db;
  store.sessions.push(s);
  const [, view] = ROUTES.find(([re]) => re.test(`/giai/${s.id}`));
  const { html } = view(`/giai/${s.id}`.match(/^\/giai\/([\w-]+)$/), new URLSearchParams("ban=luat"));
  assert.match(html, /id="loi-gui-khach"/);
  // bản đang hiện là luật → nút chép bị khoá, chờ bản AI, có nút giải AI lại ngay
  assert.match(html, /id="chepLgk" disabled aria-disabled="true">Đang chờ bản AI…</);
  assert.match(html, /id="giaiLaiNgay"[^>]*>Giải AI lại ngay</);
  assert.doesNotMatch(html, />Chép lời gửi khách</);
  const m = html.match(/id="loi-gui-khach"[^>]*data-text="([^"]*)"/);
  const txt = m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'");
  assert.ok(kiemLoiGuiKhach(txt, db).ok, "ô hiện bản qua cổng");
  assert.ok(html.indexOf('id="loi-gui-khach"') < html.indexOf('id="aiCard"'), "ô tách riêng, đứng trước bản giải đầy đủ");
  // có bản AI qua cổng → nút chép mở, chép đúng bản AI (kể cả khi đang xem bản luật)
  s.ai = { provider: "gemini", model: "claude-haiku-5-5", at: new Date().toISOString(), rounds: s.rounds.length, reading: analyze(db, s, {}, 0), raw: "", loiGuiKhach: txt, loiNguon: "ai" };
  const h2 = view(`/giai/${s.id}`.match(/^\/giai\/([\w-]+)$/), new URLSearchParams("ban=luat")).html;
  assert.match(h2, /id="chepLgk">Chép lời gửi khách</);
  assert.match(h2, /data-nguon="ai"/);
  assert.doesNotMatch(h2, /giaiLaiNgay/);
  // AI có nhưng lời gửi bị cổng trả về luật → vẫn khoá
  s.ai.loiNguon = "luat";
  assert.match(view(`/giai/${s.id}`.match(/^\/giai\/([\w-]+)$/), new URLSearchParams("")).html, /Đang chờ bản AI…/);
  assert.equal(canAI(s), true);
  store.sessions.pop();
});

// ---- window.BoiAuto ----
test("BoiAuto: mỗi câu một seed mới, bốc đúng số lá, mã khoá kiểm chứng được; AI đạt cổng → dùng; không AI → bản luật", async () => {
  const vt = viTriNgauNhien(78, 12);
  assert.equal(new Set(vt).size, 12);
  assert.ok(vt.every((k) => k >= 1 && k <= 78));
  assert.equal(chonTrai("Có nên ký hợp đồng không?", "tu-chon").id, "cokhong");
  assert.throws(() => chonTrai("x", "khong-co"), /Không có mẫu trải/u);
  const saved = [];
  const a = await giaiTuDong({ db, cauHoi: "Tháng này tôi có nên đổi việc không?", trai: "3la", onSession: (s) => saved.push(s) });
  const b = await giaiTuDong({ db, cauHoi: "Tháng này tôi có nên đổi việc không?", trai: "1la", onSession: (s) => saved.push(s) });
  assert.match(a.maKhoa, /^[0-9a-f]{64}$/);
  assert.notEqual(a.maKhoa, b.maKhoa, "mỗi câu một mã khoá");
  assert.notEqual(saved[0].seed, saved[1].seed, "mỗi câu một seed mới");
  assert.equal(saved[0].rounds[0].tarot[0].length, 3);
  assert.equal(saved[1].rounds[0].tarot[0].length, 1);
  assert.equal(a.nguon, "luat");
  assert.ok(kiemLoiGuiKhach(a.loiGuiKhach, db).ok && kiemLoiGuiKhach(b.loiGuiKhach, db).ok);
  const v = await reveal(saved[0]);
  assert.ok(v.hashOk && v.mappingOk, "kiểm chứng được như bói tay");
  // AI (trạm giả) trả bài có lời gửi khách đạt cổng → dùng bản AI
  const sent = [];
  const fakeTram = async (url, o) => {
    sent.push(JSON.parse(o.body));
    const t = JSON.stringify({ tong_quan: CO_DAU, chu_de_troi: [CO_DAU], tang: [{ ten: "Câu hỏi", diem: 7, tarot_doc: [CO_DAU, CO_DAU, CO_DAU], dong_chay: CO_DAU, lenormand_cap: [], chot: CO_DAU, diem_nghen: CO_DAU, loi_khuyen: CO_DAU }], noi_tang: [CO_DAU], mau_thuan: [CO_DAU], tong_ket: CO_DAU, loi_khuyen: [CO_DAU], loi_gui_khach: aiGiaTuNghia(sent.at(-1).body.contents.at(-1).parts[0].text) });
    return tramReply(t, "gemini-x");
  };
  const c = await giaiTuDong({ db, cauHoi: "Công việc mới của tôi thế nào?", trai: "3la", key: TRAM_KEY, fetchImpl: fakeTram });
  assert.equal(c.nguon, "ai");
  assert.match(sent[0].body.contents.at(-1).parts[0].text, /NGHĨA THẬT CỦA TỪNG LÁ ĐÃ TRẢI/u, "prompt AI có nghĩa thật từng lá");
  assert.equal(sent.length, 1);
});

test("BoiAuto: gọi nhiều câu cùng lúc thì xếp hàng, câu nào xong câu đó, kết quả độc lập", async () => {
  const order = [];
  const auto = taoBoiAuto(async () => ({ db, onSession: (s) => order.push(s.cauHoi) }));
  const qs = ["Câu một về tình cảm?", "Câu hai về tiền bạc?", "Câu ba về công việc?"];
  const res = await Promise.all(qs.map((q) => auto.giai(q, { trai: "1la" })));
  assert.deepEqual(order, qs, "chạy lần lượt theo thứ tự gọi");
  assert.equal(new Set(res.map((r) => r.maKhoa)).size, 3, "3 câu → 3 mã khoá khác nhau");
  assert.ok(res.every((r) => kiemLoiGuiKhach(r.loiGuiKhach, db).ok));
  // một câu lỗi không chặn câu sau
  const bad = auto.giai("Câu lỗi về tình cảm?", { trai: "khong-co" });
  const ok = auto.giai("Câu sau vẫn chạy?", { trai: "1la" });
  await assert.rejects(bad, /Không có mẫu trải/u);
  // câu rỗng không còn là lỗi: hỏi lại khách
  assert.equal((await auto.giai("", {})).canHoiLai, true);
  assert.match((await ok).maKhoa, /^[0-9a-f]{64}$/);
});

// ---- Trang Đào tạo nhắn tin ----
test("đào tạo: 11 tình huống (8 khó + ai bốc bài + gặng lần 2 + tự hại), mẫu Chủ tịch qua cổng; gặng lần 2 trả lời thật, hoàn tiền và tự hại chuyển người", () => {
  assert.equal(DT.TINH_HUONG.length, 11);
  for (const id of ["mien-phi", "mac-ca", "nghi-lua", "may-ai", "ngoai-goi", "hoan-tien", "nang-loi", "lan-man", "ai-boc", "gang-lan-2", "tu-hai"]) assert.ok(DT.TINH_HUONG.find((t) => t.id === id), id);
  assert.deepEqual(DT.TINH_HUONG.filter((t) => t.chuyen).map((t) => t.id).sort(), ["hoan-tien", "tu-hai"]);
  const gang = DT.TINH_HUONG.find((t) => t.id === "gang-lan-2").mau;
  assert.equal(gang, "Mình là trợ lý tự động của Tarot debaderlis. Bài của bạn được xào và trải riêng cho đúng câu hỏi bạn gửi. Bạn muốn mình nói kỹ thêm phần nào trong lời giải không?");
  assert.ok(DT.kiemTraLoiAgent(gang).ok, "câu trả lời thật ở lần gặng qua cổng (không chối là AI)");
  const may = DT.TINH_HUONG.find((t) => t.id === "may-ai").mau, boc = DT.TINH_HUONG.find((t) => t.id === "ai-boc").mau;
  assert.ok(may.startsWith("Mình là trợ lý của Tarot debaderlis, phụ trách trải bài và nhắn với bạn"));
  assert.ok(boc.startsWith("Bài của bạn được xào mới và trải riêng cho đúng câu hỏi, theo cách trải của Tarot debaderlis"));
  for (const t of DT.TINH_HUONG) if (t.mau) assert.ok(DT.kiemTraLoiAgent(t.mau).ok, t.id);
  assert.equal(DT.NHAN_CHUYEN, "CHUYỂN CHỦ TỊCH TRẢ LỜI");
  assert.deepEqual(DT.KENH, ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]);
});

test("đào tạo: cổng câu trả lời agent chặn “người thật”, “bốc tay”, “tự tay”, “không phải AI/máy”, chữ AI, web, tên công cụ", () => {
  const chan = (t, re) => { const k = DT.kiemTraLoiAgent(t); assert.equal(k.ok, false, t); assert.match(k.loi.join(", "), re); };
  chan("Mình là người thật mà bạn.", /người thật/u);
  chan("Bài được bốc tay cẩn thận.", /bốc tay/u);
  chan("Mình tự tay xào bài cho bạn.", /tự tay/u);
  chan("Mình không phải AI đâu.", /không phải AI/u);
  chan("Mình không phải là máy nha.", /không phải máy/u);
  chan("Bên mình dùng AI để giải.", /AI/u);
  chan("Bạn vào web của bên mình nhé.", /web/u);
  chan("Lời giải soạn bằng Gemini.", /tên công cụ|AI/u);
  chan("Bên mình dùng ChatGPT.", /tên công cụ/u);
  chan("Đây là công cụ của mình.", /công cụ/u);
  assert.ok(DT.kiemTraLoiAgent("Ai cũng có lúc thấy mệt mà bạn. Mình ở đây nghe bạn kể.").ok, "“Ai” đại từ không bị chặn");
  // ô Lời gửi khách cũng chặn các chuỗi này
  assert.match(kiemLoiGuiKhach(LGK_OK.replace("Nhìn chung", "Mình là người thật, nhìn chung"), db).loi.join(", "), /người thật/u);
});

test("đào tạo: gọi cầu nối đúng route/khuôn; cầu nối tắt → lỗi rõ, không rơi về AI khác; chuyển người hiện nhãn; mẫu sửa mới nhất trên đầu", async () => {
  assert.equal(DT.goc("https://abc.trycloudflare.com/claude"), "https://abc.trycloudflare.com");
  assert.equal(DT.goc("http://127.0.0.1:8787/claude"), "http://127.0.0.1:8787");
  const lich = [{ vai: "khach", noi_dung: "Chào chị" }, { vai: "he_thong", noi_dung: "lỗi" }, { vai: "agent", noi_dung: "Chào bạn" }];
  assert.deepEqual(DT.yeuCauTraLoi({ kenh: "03", goi: "3", cau_con: "2", lich_su: lich }), { kenh: "03", goi: 3, cau_con: 2, lich_su: [{ vai: "khach", noi_dung: "Chào chị" }, { vai: "agent", noi_dung: "Chào bạn" }] });
  assert.deepEqual(Object.keys(DT.yeuCauMauSua({ kenh: "01", goi: 1, lich_su: lich, ban_agent: "a", ban_chu_tich: " b ", ly_do: " c " })), ["kenh", "goi", "lich_su", "ban_agent", "ban_chu_tich", "ly_do"]);
  // cầu nối tắt
  const calls = [];
  const e1 = await DT.goiTroLy({ base: "", path: "/tro_ly/tra_loi", body: {}, fetchImpl: async (u) => { calls.push(u); } }).then(() => null, (e) => e);
  assert.ok(e1?.tat && e1.message === DT.LOI_CAU_NOI_TAT);
  assert.equal(calls.length, 0, "không gọi nơi nào khác khi cầu nối tắt");
  const e2 = await DT.goiTroLy({ base: "http://127.0.0.1:8787", path: "/tro_ly/tra_loi", body: {}, fetchImpl: async () => { throw new TypeError("Failed to fetch"); } }).then(() => null, (e) => e);
  assert.ok(e2?.tat);
  const e3 = await DT.goiTroLy({ base: "http://x", path: "/tro_ly/mau_sua", method: "GET", fetchImpl: async () => new Response("{}", { status: 404 }) }).then(() => null, (e) => e);
  assert.match(e3.message, /chưa có route \/tro_ly\/mau_sua/u);
  const hang = (u, o) => new Promise((_, rej) => o.signal.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError"))));
  const e4 = await DT.goiTroLy({ base: "http://x", path: "/tro_ly/tra_loi", body: {}, fetchImpl: hang, ms: 30 }).then(() => null, (e) => e);
  assert.match(e4.message, /quá lâu/u);
  // cầu nối sống: đúng route, đúng khuôn, kèm mã ghép
  const seen = [];
  const ok = await DT.goiTroLy({ base: "https://t.example", token: "MA", path: "/tro_ly/tra_loi", body: { kenh: "01" }, fetchImpl: async (u, o) => { seen.push({ u, o }); return new Response(JSON.stringify({ tra_loi: "Chào bạn, mình nghe đây.", ghi_chu_ky_thuat: "ok" }), { status: 200 }); } });
  assert.equal(seen[0].u, "https://t.example/tro_ly/tra_loi");
  assert.equal(seen[0].o.method, "POST");
  assert.equal(seen[0].o.headers["x-boi-token"], "MA");
  assert.deepEqual(JSON.parse(seen[0].o.body), { kenh: "01" });
  assert.deepEqual(DT.docTraLoi(ok), { vai: "agent", noi_dung: "Chào bạn, mình nghe đây.", ghi_chu: "ok" });
  // chuyển người: câu giữ khách mặc định, nhãn chuyển
  const cn = DT.docTraLoi({ chuyen_nguoi: true, ly_do: "khách gặng lần 2" });
  assert.deepEqual([cn.chuyen_nguoi, cn.noi_dung, cn.ly_do], [true, "Bạn đợi mình chút nhé.", "khách gặng lần 2"]);
  // agent lỡ lộ chữ → BỊ CHẶN
  assert.deepEqual(DT.docTraLoi({ tra_loi: "Mình là người thật, không phải AI." }).bi_chan, ["AI", "người thật", "không phải AI"]);
  assert.throws(() => DT.docTraLoi({ tra_loi: "" }), /rỗng/u);
  // mẫu sửa mới nhất trên đầu
  assert.deepEqual(DT.sapMauSua([{ ban_chu_tich: "a", luc: "2026-10-28T01:00:00Z" }, { ban_chu_tich: "b", luc: "2026-10-28T03:00:00Z" }]).map((m) => m.ban_chu_tich), ["b", "a"]);
  assert.deepEqual(DT.sapMauSua({ mau: [{ ban_chu_tich: "cũ" }, { ban_chu_tich: "mới" }] }).map((m) => m.ban_chu_tich), ["mới", "cũ"]);
});

test("đào tạo: trang noindex; web bói có nút “Đào tạo nhắn tin” cạnh Cài đặt, trang đào tạo có nút “← Về web bói”; service worker không chiếm trang đào tạo", () => {
  const html = readFileSync(join(HERE, "dao-tao/index.html"), "utf8");
  assert.match(html, /<meta name="robots" content="noindex/);
  assert.match(html, /<a [^>]*href="\.\.\/"[^>]*>← Về web bói<\/a>/);
  const idx = readFileSync(join(HERE, "index.html"), "utf8");
  const nav = idx.slice(idx.indexOf('<nav class="tabbar"'), idx.indexOf("</nav>"));
  assert.match(nav, /<a href="dao-tao\/"[^>]*>.*Đào tạo nhắn tin<\/a>/u);
  assert.ok(nav.indexOf("Cài đặt") < nav.indexOf("Đào tạo nhắn tin"), "đặt cạnh Cài đặt");
  const sw = readFileSync(join(HERE, "sw.js"), "utf8");
  assert.match(sw, /\/dao-tao\/"\)\) return;/);
  assert.ok(!/dao-tao/.test(sw.slice(sw.indexOf("const CORE"), sw.indexOf("];"))), "không cache trang đào tạo");
});

// ---- Lỗi khẩn 28/10: lời gửi khách gọi "Queen Linh" cho mọi khách ----
test("tên khách theo từng lượt: “Lan” rồi “Hùng” → mỗi lời gửi đúng tên của lượt đó, không còn “Queen Linh”", async () => {
  const caiDat = { xungHo: "Queen Linh" }; // tên xưng hô đã lưu trong Cài đặt (của chủ web)
  const auto = taoBoiAuto(async () => ({ db, settings: caiDat }));
  const lan = await auto.giai("Tháng này em có nên nhận lời đi làm xa không?", { trai: "3la", tenKhach: "Lan" });
  const hung = await auto.giai("Tháng này em có nên nhận lời đi làm xa không?", { trai: "3la", tenKhach: "Hùng" });
  assert.match(lan.loiGuiKhach, /^Lan ơi/u);
  assert.match(hung.loiGuiKhach, /^Hùng ơi/u);
  for (const r of [lan, hung]) {
    assert.ok(!/Queen Linh/u.test(r.loiGuiKhach), "không còn Queen Linh");
    assert.ok(kiemLoiGuiKhach(r.loiGuiKhach, db, { tenKhach: r.tenKhach, xungHo: "Queen Linh" }).ok);
  }
  assert.ok(!/Lan/u.test(hung.loiGuiKhach) && !/Hùng/u.test(lan.loiGuiKhach), "tên lượt trước không lọt sang lượt sau");
  // đường AI: lời gửi gọi đúng tên thì nhận; prompt có dòng GỌI KHÁCH đúng tên lượt này
  const sent = [];
  const fake = async (u, o) => { const b = JSON.parse(o.body); sent.push(b.body.contents.at(-1).parts[0].text); const ten = /gọi đúng tên “([^”]+)”/u.exec(sent.at(-1))?.[1] || ""; if (!b.body.generationConfig?.responseMimeType) return tramReply(aiGiaTuNghia(sent.at(-1), ten), "gemini-x"); return tramReply(JSON.stringify({ tong_quan: CO_DAU, tang: [{ ten: "Câu hỏi", diem: 7, tarot_doc: [CO_DAU, CO_DAU, CO_DAU], dong_chay: CO_DAU, chot: CO_DAU, diem_nghen: CO_DAU, loi_khuyen: CO_DAU }], tong_ket: CO_DAU, loi_gui_khach: aiGiaTuNghia(sent.at(-1), ten) }), "gemini-x"); };
  const autoAI = taoBoiAuto(async () => ({ db, settings: caiDat, key: TRAM_KEY, fetchImpl: fake }));
  const a1 = await autoAI.giai("Em có nên chuyển nhà không?", { tenKhach: "Lan" });
  const a2 = await autoAI.giai("Em có nên chuyển nhà không?", { tenKhach: "Hùng" });
  for (const a of [a1, a2]) assert.ok(["ai", "ai-viet-lai"].includes(a.nguon), a.lyDo);
  assert.match(a1.loiGuiKhach, /^Lan ơi/u);
  assert.match(a2.loiGuiKhach, /^Hùng ơi/u);
  assert.ok(sent.some((t) => /GỌI KHÁCH TRONG "loi_gui_khach": gọi đúng tên “Lan”/u.test(t)));
  assert.ok(sent.some((t) => /GỌI KHÁCH TRONG "loi_gui_khach": gọi đúng tên “Hùng”/u.test(t)));
  assert.ok(!sent.some((t) => /Queen Linh/u.test(t)), "lượt tự động không gửi “Queen Linh” cho AI");
  // AI lỡ gọi "Queen Linh" → cổng chặn, viết lại 1 lần; vẫn sai → bản luật gọi đúng tên
  const sai = async (u, o) => tramReply(JSON.stringify({ tong_quan: CO_DAU, tang: [{ ten: "Câu hỏi", diem: 7, tarot_doc: [CO_DAU, CO_DAU, CO_DAU], dong_chay: CO_DAU, chot: CO_DAU, diem_nghen: CO_DAU, loi_khuyen: CO_DAU }], tong_ket: CO_DAU, loi_gui_khach: aiGiaTuNghia(JSON.parse(o.body).body.contents.at(-1).parts[0].text, "Queen Linh") }), "gemini-x");
  const a3 = await taoBoiAuto(async () => ({ db, settings: caiDat, key: TRAM_KEY, fetchImpl: sai })).giai("Em có nên chuyển nhà không?", { tenKhach: "Lan" });
  assert.equal(a3.nguon, "luat");
  assert.match(a3.loiGuiKhach, /^Lan ơi/u);
});

test("không có tên khách → không gọi tên riêng nào (“Về câu bạn hỏi…”)", async () => {
  const r = await giaiTuDong({ db, cauHoi: "Tháng này em có nên nhận lời đi làm xa không?", trai: "3la", settings: { xungHo: "Queen Linh" } });
  assert.match(r.loiGuiKhach, /^Về câu bạn hỏi/u);
  assert.ok(!/Queen Linh/u.test(r.loiGuiKhach) && !/^[^\s,.]+(?: [^\s,.]+)? ơi,/u.test(r.loiGuiKhach), "không gọi tên ai");
  assert.equal(r.tenKhach, "");
  // màn Hỏi mới có ô Tên khách trống; màn giải gọi theo tên của lượt đó
  const [, askView] = ROUTES.find(([re]) => re.test("/hoi-moi"));
  assert.match(askView([], new URLSearchParams()).html, /id="tenKhach"[^>]*value=""/);
  const s = await sessionNgauNhien("tinhcam", 7);
  s.tenKhach = "Lan";
  store.db = db; store.settings.xungHo = "Queen Linh"; store.sessions.push(s);
  const [, view] = ROUTES.find(([re]) => re.test(`/giai/${s.id}`));
  const html = view(`/giai/${s.id}`.match(/^\/giai\/([\w-]+)$/), new URLSearchParams("ban=luat")).html;
  const txt = html.match(/id="loi-gui-khach"[^>]*data-text="([^"]*)"/)[1];
  assert.match(txt, /^Lan ơi/u);
  assert.ok(!/Queen Linh/u.test(txt));
  store.sessions.pop();
});

test("cổng chặn “Queen Linh ơi” (khác tên khách) và tên vị trí như “Hao tài”; bản luật nói thành ý thường", async () => {
  const k = kiemLoiGuiKhach(LGK_OK.replace("Bạn ơi", "Queen Linh ơi"), db, { tenKhach: "Lan", xungHo: "Queen Linh" });
  assert.equal(k.ok, false);
  assert.match(k.loi.join("; "), /gọi sai tên: Queen Linh/u);
  assert.ok(kiemLoiGuiKhach(LGK_OK.replace("Bạn ơi", "Queen Linh ơi"), db, { tenKhach: "Queen Linh", xungHo: "Queen Linh" }).ok, "khách đúng tên Queen Linh thì được gọi");
  const s = await sessionNgauNhien("vanhan", 4);
  assert.ok(tenViTriCua(s).includes("Hao tài") && tenViTriCua(s).includes("Khía cạnh khác"));
  // nền: một lời gửi thật của chính trải này (qua cổng), rồi chèn thêm một câu để thử
  const nen = loiGuiKhachLuat(db, s, analyze(db, s, {}), {});
  assert.ok(kiemLoiGuiKhach(nen, db, { session: s }).ok);
  const chen = (cau) => nen.replace("\n\n", `\n\n${cau} `);
  const kh = kiemLoiGuiKhach(chen("Ở phần Hao tài, mọi chuyện cũng vậy."), db, { session: s });
  assert.equal(kh.ok, false);
  assert.match(kh.loi.join("; "), /tên vị trí\/tầng: Hao tài/u);
  assert.match(kiemLoiGuiKhach(chen("Về Khía cạnh khác, mọi chuyện cũng vậy."), db, { session: s }).loi.join("; "), /Khía cạnh khác/u);
  assert.match(kiemLoiGuiKhach(chen("Ô 2 cho thấy điều tương tự."), db, { session: s }).loi.join("; "), /tên tầng\/ô/u);
  assert.ok(kiemLoiGuiKhach(chen("Bạn nên tránh hao tài lúc này."), db, { session: s }).ok, "chữ thường “hao tài” trong câu không phải tên vị trí");
  assert.ok(!tenViTriCua(s).includes("4–6 tuần tới"), "chữ có trong câu khách hỏi thì được nhắc lại");
  // bản luật: các mẫu nhiều tầng không nêu tên tầng/vị trí
  for (const [i, id] of ["vanhan", "3thang", "tinhcam", "12thang", "cokhong"].entries()) {
    const ss = await sessionNgauNhien(id, i + 20);
    const t = loiGuiKhachLuat(db, ss, analyze(db, ss, {}), { tenKhach: "Hùng" });
    const kk = kiemLoiGuiKhach(t, db, { tenKhach: "Hùng", xungHo: "Queen Linh", session: ss });
    assert.ok(kk.ok, `${id}: ${kk.loi.join("; ")}\n${t}`);
  }
});

// ---- Lỗi khẩn số 2 (28/10): lời gửi khách phải đọc ra thông điệp của chính trải bài ----
async function trai3La(q, i) {
  const sp = spreadById("3la");
  const s = await createSession({ cauHoi: q, spreadId: sp.id, tiers: sp.tiers(), money: false, seed: (i.toString(16) + "a").repeat(64).slice(0, 64) });
  await ensureMapping(s, 0);
  addPickedRound(s, [{ tarot: [1 + i, 20 + i, 50 + i], lenormand: [] }]);
  return s;
}

test("cùng câu hỏi tình cảm, 2 trải khác nhau → 2 lời khác nhau rõ rệt, mỗi lời ≥ 3 ý khớp nghĩa lá thật, 0 tên lá, 0 tên vị trí", async () => {
  const q = "Người ấy còn thương em không?";
  const a = await trai3La(q, 1), b = await trai3La(q, 7);
  assert.notDeepEqual(a.rounds[0].tarot[0].map((c) => c.card), b.rounds[0].tarot[0].map((c) => c.card), "hai trải khác nhau");
  const ta = loiGuiKhachLuat(db, a, analyze(db, a, {}), {}), tb = loiGuiKhachLuat(db, b, analyze(db, b, {}), {});
  for (const [s, t] of [[a, ta], [b, tb]]) {
    assert.ok(kiemLoiGuiKhach(t, db, { session: s }).ok, kiemLoiGuiKhach(t, db, { session: s }).loi.join("; "));
    assert.ok(yKhop(t, db, s).length >= 3, `chỉ ${yKhop(t, db, s).length} ý khớp`);
    assert.deepEqual(tenLaTrong(t, db), []);
    assert.deepEqual(viTriTrong(t, ["Hiện trạng", "Diễn biến", "Kết quả", ...tenViTriCua(s)]), []);
  }
  // khác nhau rõ rệt: ít câu chung
  const cau = (t) => new Set(t.split(/(?<=[.!?])\s+/u).map((x) => x.trim()));
  const chung = [...cau(ta)].filter((x) => cau(tb).has(x));
  assert.ok(chung.length <= 2, `hai lời trùng ${chung.length} câu: ${chung.join(" | ")}`);
  // lời của trải A không khớp đủ ý với trải B (tức là thật sự đọc từ lá của mình)
  assert.ok(yKhop(ta, db, a).length > yKhop(ta, db, b).length);
  // câu thứ hai trả lời thẳng câu hỏi; 0 câu "người độc thân" khi khách hỏi về người ấy
  for (const t of [ta, tb]) {
    const c2 = t.split(/(?<=[.!?])\s+/u)[1];
    assert.match(c2, /^(Câu trả lời là còn|Câu trả lời nghiêng|Nói thẳng: tình cảm phía người ấy)/u, c2);
    assert.ok(!/người độc thân|đang độc thân/iu.test(t), "không chen ý “người độc thân”");
  }
  console.log(`\n  — Mẫu A —\n${ta}\n\n  — Mẫu B —\n${tb}\n`);
});

test("bản theo luật của trải 3 lá đọc như một thông điệp liền, không còn câu sáo đóng sẵn", async () => {
  const s = await trai3La("Tháng này công việc của em thế nào?", 3);
  const t = loiGuiKhachLuat(db, s, analyze(db, s, {}), { tenKhach: "Lan" });
  assert.ok(!t.includes("Nói thật lòng: chuyện này được hay không nằm nhiều ở cách bạn làm"));
  assert.ok(tyLeCauSao(t) <= 0.2, `câu sáo ${tyLeCauSao(t)}`);
  assert.ok(kiemLoiGuiKhach(t, db, { session: s, tenKhach: "Lan" }).ok);
  // mạch: đang diễn ra → gốc rễ → hướng tới → điều nên làm
  const iHien = t.search(/Lúc này,/u), iGoc = t.search(/Gốc rễ|Điều đang níu|Cái khó|Điều đang đẩy|Lực đẩy/u), iHuong = t.search(/Thời gian tới,/u), iLam = t.search(/Điều nên làm lúc này/u);
  assert.ok(iHien >= 0 && iHuong > iHien && iLam > iHuong, t);
  assert.ok(iGoc < 0 || (iGoc > iHien && iGoc < iHuong), t);
  assert.ok(!/lá này|lá bài/iu.test(t), "không còn giọng “lá này nghĩa là”");
});

test("cổng chặn một lời toàn câu sáo / chung chung", async () => {
  const s = await trai3La("Người ấy còn thương em không?", 2);
  const sao = [
    "Bạn ơi, bức tranh không xấu, nhưng cũng chưa đến mức yên tâm buông tay. Tin tốt là cửa đang mở, chỉ cần bạn bước đúng nhịp. Nói gọn trước: hướng đi đang thuận, và phần thuận này có cơ sở chứ không phải may rủi.",
    "Điều quan trọng là bạn đã hỏi đúng lúc, khi mọi thứ vẫn còn trong tầm tay mình. Những gì bạn chuẩn bị bây giờ sẽ quyết định phần lớn kết quả về sau. Bạn không cần làm mọi thứ cùng lúc, chỉ cần làm đúng việc đầu tiên.",
    "Hãy tin vào cảm nhận của bạn, nhưng kiểm lại bằng những con số và sự việc cụ thể. Thay vì đoán ý người kia, hãy hỏi thẳng một câu và lắng nghe đến hết trước khi trả lời. Cho mình vài ngày không nhắn trước, dành thời gian đó chăm sóc bản thân rồi mới quyết định bước tiếp.",
  ].join("\n\n");
  assert.ok(demChu(sao) >= 120 && demChu(sao) <= 220, `${demChu(sao)}`);
  const k = kiemLoiGuiKhach(sao, db, { session: s });
  // GĐ 30/10: câu sáo / ít ý khớp là lỗi MỀM → vẫn dùng bản AI, chỉ ghi cảnh báo
  assert.equal(k.ok, true);
  assert.match(k.canhBao.join("; "), /chung chung: \d+ % câu là câu sáo/u);
  assert.match(k.canhBao.join("; "), /chung chung: chỉ \d+ ý khớp nghĩa lá/u);
  const rule = analyze(db, s, {});
  let n = 0;
  const r = await chotLoiGuiKhach({ db, session: s, rule, reading: { loi_gui_khach: sao }, call: async () => { n++; return sao; } });
  assert.equal(n, 0, "lỗi mềm không gọi viết lại");
  assert.equal(r.nguon, "ai");
  assert.ok(r.canhBao.length >= 2);
  // lỗi cứng (tên lá) → viết lại đúng 1 lần, kèm nghĩa thật
  let msg = "";
  const r2 = await chotLoiGuiKhach({ db, session: s, rule, reading: { loi_gui_khach: sao.replace("Bạn ơi", "Bạn ơi, lá Mặt Trăng cho thấy") }, call: async (sys, m) => { n++; msg = m; return sao; } });
  assert.equal(n, 1);
  assert.match(msg, /NGHĨA THẬT CỦA TỪNG LÁ ĐÃ TRẢI/u);
  assert.equal(r2.nguon, "ai-viet-lai");
});

test("ghi lý do đường AI hỏng (cầu nối chết / 429 / quá giờ / bị cổng trả lại)", async () => {
  assert.equal(phanLoaiLoiAI(new TypeError("Failed to fetch"), LOCAL_KEY), "cầu nối chết");
  assert.equal(phanLoaiLoiAI({ status: 429 }, TRAM_KEY), "429 — trạm hết lượt/đang đông");
  assert.equal(phanLoaiLoiAI({ timeout: true }, TRAM_KEY), "trạm quá giờ");
  assert.equal(phanLoaiLoiAI({ timeout: true }, LOCAL_KEY), "cầu nối quá giờ");
  assert.equal(phanLoaiLoiAI({ matDau: true }, TRAM_KEY), "AI trả chữ không dấu");
  const r = await giaiTuDong({ db, cauHoi: "Người ấy còn thương em không?", key: TRAM_KEY, fetchImpl: async () => new Response(JSON.stringify({ ok: false, status: 429, error: "quota" }), { status: 200 }) });
  assert.equal(r.nguon, "luat");
  assert.equal(r.lyDo, "trạm lỗi (429 — trạm hết lượt/đang đông) → luật");
});

test("câu trả lời thẳng: “còn/có/nên … không” nói rõ nghiêng về đâu; Có/Không dùng đúng nhãn; câu hỏi mở nói gọn hướng chung", () => {
  const ss = (q, spreadId = "3la") => ({ cauHoi: q, spreadId, money: false });
  const t = (d) => [{ diem: d }];
  assert.equal(traLoiThang(ss("Người ấy còn thương em không?"), t(7.5), { diem_tb: 7.5 }), "Câu trả lời là còn, và điều đó khá rõ.");
  assert.match(traLoiThang(ss("Người ấy còn thương em không?"), t(5.5), { diem_tb: 5.5 }, { tu_khoa: "do dự, sợ hãi" }), /^Câu trả lời là còn, nhưng đang bị che bởi sự do dự\./u);
  assert.equal(traLoiThang(ss("Người ấy còn thương em không?"), t(3), { diem_tb: 3 }), "Nói thẳng: tình cảm phía người ấy đang nguội đi nhiều.");
  assert.equal(traLoiThang(ss("Em có nên nghỉ việc không?"), t(3), { diem_tb: 3 }), "Câu trả lời nghiêng về không, ít nhất là ở thời điểm này.");
  assert.equal(traLoiThang(ss("Em có nên nghỉ việc không?"), t(8), { diem_tb: 8 }), "Câu trả lời nghiêng rõ về có.");
  assert.equal(traLoiThang(ss("Có nên ký hợp đồng?", "cokhong"), [{ diem: 6, tra_loi: "CÓ, NHƯNG CÓ ĐIỀU KIỆN" }], {}), "Câu trả lời gọn là: có, nhưng có điều kiện.");
  assert.equal(traLoiThang(ss("Tháng này công việc thế nào?"), t(7), { diem_tb: 7 }), "Nói gọn: chuyện này đang đi theo hướng thuận.");
});

test("lọc câu nghĩa theo ngữ cảnh câu hỏi; cổng chặn “người độc thân” khi hỏi về người ấy", async () => {
  assert.deepEqual(nguCanh("Người ấy còn thương em không?"), { coNguoi: true, docThan: false, lamThue: false, kinhDoanh: false });
  assert.equal(nguCanh("Bao giờ em có người yêu?").docThan, true);
  assert.equal(hopNguCanh("Người độc thân có thể gặp được một người chững chạc.", nguCanh("Anh ấy có quay lại không?")), false);
  assert.equal(hopNguCanh("Người có đôi cần vun đắp mối quan hệ hiện tại.", nguCanh("Bao giờ em có người yêu?")), false);
  assert.equal(hopNguCanh("Doanh thu cửa hàng sẽ tăng.", nguCanh("Em có nên đổi việc ở công ty không?")), false);
  assert.equal(hopNguCanh("Sếp sẽ để ý đến bạn.", nguCanh("Cửa hàng em tháng này buôn bán thế nào?")), false);
  assert.equal(hopNguCanh("Người độc thân có thể gặp được một người chững chạc.", nguCanh("Tháng này tình cảm thế nào?")), true, "câu hỏi chung thì giữ");
  const s = await trai3La("Người ấy còn thương em không?", 1);
  const nen = loiGuiKhachLuat(db, s, analyze(db, s, {}), {});
  const k = kiemLoiGuiKhach(nen.replace("\n\n", "\n\nNgười độc thân có thể gặp được một người mới. "), db, { session: s });
  assert.equal(k.ok, true, "sai ngữ cảnh là cảnh báo mềm");
  assert.match(k.canhBao.join("; "), /sai ngữ cảnh: nói “người độc thân”/u);
});

// ---- Đường AI 28/10: trạm 429/quá giờ → dò cầu nối một lần (kể cả khi chưa bật cờ) ----
const sseCuu = (text) => new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] })}\r\n\r\n`)); c.close(); } });
const tra429 = () => new Response(JSON.stringify({ ok: false, status: 429, error: "quota" }), { status: 200 });

// ---- Lệnh GĐ 30/10: AI nhanh nhất, lời gửi khách luôn là bản AI ----
const baiCauNoi = (o) => {
  const b = JSON.parse(o.body);
  const msg = b.contents.at(-1).parts[0].text;
  const ten = /gọi đúng tên “([^”]+)”/u.exec(msg)?.[1] || "";
  const text = b.generationConfig?.responseMimeType
    ? JSON.stringify({ tong_quan: CO_DAU, tang: [{ ten: "Câu hỏi", diem: 7, tarot_doc: [CO_DAU, CO_DAU, CO_DAU], dong_chay: CO_DAU, chot: CO_DAU, diem_nghen: CO_DAU, loi_khuyen: CO_DAU }], tong_ket: CO_DAU, loi_gui_khach: aiGiaTuNghia(msg, ten) })
    : aiGiaTuNghia(msg, ten);
  return new Response(sseCuu(text), { status: 200 });
};
// máy giả: nhật ký thứ tự gọi + kịch bản lỗi cho từng đích
function mayGia({ local = "chet", worker = [], tram = "429" } = {}) {
  const log = [];
  let w = 0;
  const f = async (u, o = {}) => {
    if (u === `${LOCAL_BASE}/ping`) { log.push("ping-local"); if (local === "chet") throw new TypeError("Failed to fetch"); return new Response("{}", { status: 200 }); }
    if (u.includes("api.github.com") || u.includes("cau_noi.json")) { log.push("github"); throw new TypeError("Failed to fetch"); }
    if (/\/v1beta\/models\?/.test(u)) return new Response(JSON.stringify({ models: [] }), { status: 200 });
    if (u.startsWith(`${LOCAL_BASE}/v1beta/models/`)) { log.push("local"); if (local !== "tot") throw new TypeError("Failed to fetch"); return baiCauNoi(o); }
    if (u.startsWith(`${WORKER_BASE}/v1beta/models/`)) {
      const kq = worker[w++] ?? "tot";
      log.push("worker");
      if (kq === "mang") throw new TypeError("Failed to fetch");
      if (kq === "500") return new Response("{}", { status: 500 });
      if (kq === "rong") return new Response(sseCuu(""), { status: 200 });
      return baiCauNoi(o);
    }
    if (u === TRAM_URL) {
      log.push("tram");
      if (tram === "mang") throw new TypeError("Failed to fetch");
      if (tram === "429") return tra429();
      if (tram === "500") return new Response("<html>", { status: 500 });
      return tramReply(BAI(CO_DAU));
    }
    throw new TypeError("Failed to fetch");
  };
  return { f, log };
}

test("A: ngoài máy nhà lượt đầu đi thẳng Worker cố định — không chờ cau_noi.json, không gọi trạm", async () => {
  datCuuTram(CUU_THAT);
  try {
    const { f, log } = mayGia();
    await probeBridge(f, { on: true });
    const r = await giaiTuDong({ db, cauHoi: "Em có nên chuyển nhà không?", tenKhach: "Lan", key: aiKey(), fetchImpl: f });
    assert.ok(["ai", "ai-viet-lai"].includes(r.nguon), r.lyDo);
    assert.equal(r.lyDo, "");
    assert.match(r.loiGuiKhach, /^Lan ơi/u);
    assert.deepEqual(log.slice(0, 2), ["ping-local", "worker"]);
    assert.ok(!log.includes("tram") && !log.includes("github"), log.join(","));
  } finally { datLaiCauNoi(); }
});

test("B: Worker lỗi mạng 1 lần rồi tốt → thử lại sau 1,5 s, nguồn “ai”, không sang trạm; lỗi 5xx / rỗng cũng thử lại", async () => {
  datCuuTram(CUU_THAT);
  try {
    for (const loi of ["mang", "500", "rong"]) {
      const { f, log } = mayGia({ worker: [loi] });
      await probeBridge(f, { on: true });
      const r = await giaiTuDong({ db, cauHoi: "Công việc tháng này của tôi thế nào?", tenKhach: "Hùng", key: aiKey(), fetchImpl: f });
      assert.ok(["ai", "ai-viet-lai"].includes(r.nguon), `${loi}: ${r.lyDo}`);
      assert.deepEqual(log.filter((x) => x !== "github").slice(0, 3), ["ping-local", "worker", "worker"], `${loi}: ${log.join(",")}`);
      assert.ok(!log.includes("tram"), `${loi}: không sang trạm`);
    }
    assert.equal(cauNoi.thuLaiMs, 5, "test rút ngắn; mặc định thật 1500 ms");
  } finally { datLaiCauNoi(); }
});

test("E: chỉ Claude — Worker chết 2 lượt → bản luật, không gọi trạm Gemini; Worker sống lại ở lượt thử lại của BoiAuto → nguồn “ai”", async () => {
  datCuuTram(CUU_THAT);
  try {
    const { f, log } = mayGia({ worker: ["mang", "mang"], tram: "tot" });
    await probeBridge(f, { on: true });
    const r = await giaiTuDong({ db, cauHoi: "Em có nên chuyển nhà không?", tenKhach: "Lan", key: aiKey(), fetchImpl: f });
    assert.ok(["ai", "ai-viet-lai"].includes(r.nguon), r.lyDo);
    assert.ok(!log.includes("tram"), log.join(","));
    assert.deepEqual(log.filter((x) => x !== "github").slice(0, 4), ["ping-local", "worker", "worker", "worker"], "lượt 2 của BoiAuto gặp Worker sống lại");
  } finally { datLaiCauNoi(); }
});

test("B: cầu nối hỏng hết → bản luật, lyDo nói rõ; BoiAuto tự thử lại AI 1 lượt; không gọi trạm Gemini", async () => {
  datCuuTram(CUU_THAT);
  try {
    const { f, log } = mayGia({ worker: Array(20).fill("mang"), tram: "tot" });
    await probeBridge(f, { on: true });
    const r = await giaiTuDong({ db, cauHoi: "Người ấy còn thương em không?", tenKhach: "Lan", key: aiKey(), fetchImpl: f });
    assert.equal(r.nguon, "luat");
    assert.equal(r.lyDo, "cầu nối Claude lỗi (cầu nối chết) → luật");
    assert.ok(kiemLoiGuiKhach(r.loiGuiKhach, db, { tenKhach: "Lan" }).ok, "bản luật vẫn qua cổng");
    assert.equal(log.filter((x) => x === "tram").length, 0);
    assert.equal(log.filter((x) => x === "worker").length, 4, "2 lượt AI × (cầu nối + thử lại)");
  } finally { datLaiCauNoi(); }
});

test("C2: máy nhà — 127.0.0.1 hỏng (ping được, giải lỗi) → Worker → nguồn “ai”; 127.0.0.1 tốt thì đi 127.0.0.1", async () => {
  datCuuTram(CUU_THAT);
  try {
    const a = mayGia({ local: "hong" });
    await probeBridge(a.f, { on: true });
    assert.equal(bridge.local, true);
    assert.deepEqual(diaChiCauNoi(), [LOCAL_BASE, WORKER_BASE]);
    const ra = await giaiTuDong({ db, cauHoi: "Em có nên chuyển nhà không?", key: aiKey(), fetchImpl: a.f });
    assert.ok(["ai", "ai-viet-lai"].includes(ra.nguon), ra.lyDo);
    assert.deepEqual(a.log.slice(0, 3), ["ping-local", "local", "worker"]);
    assert.ok(!a.log.includes("tram"));
    assert.equal(via.base, WORKER_BASE, "nhớ địa chỉ vừa chạy tốt");
    datLaiCauNoi();
    const b = mayGia({ local: "tot" });
    await probeBridge(b.f, { on: true });
    const rb = await giaiTuDong({ db, cauHoi: "Em có nên chuyển nhà không?", key: aiKey(), fetchImpl: b.f });
    assert.ok(["ai", "ai-viet-lai"].includes(rb.nguon));
    assert.deepEqual(b.log.slice(0, 2), ["ping-local", "local"]);
    assert.ok(!b.log.includes("worker"));
  } finally { datLaiCauNoi(); }
});

test("C: bản luật vì AI lỗi → tự giải lại AI ở nền 5 s, 15 s, 45 s rồi mỗi 60 s; có bản AI là dừng", async () => {
  assert.deepEqual(NEN_LICH, [5000, 15000, 45000, 60000]);
  const s = await sessionNgauNhien("tinhcam", 3);
  store.db = db;
  store.sessions.push(s);
  try {
    let lan = 0;
    const lich = [3, 3, 3, 3];
    const xong = new Promise((res) => {
      const chay = async () => {
        lan++;
        if (lan < 4) return false;
        s.ai = { loiGuiKhach: "x", loiNguon: "ai" };
        res();
        return true;
      };
      assert.equal(lichNen(s, { rerender: () => {} }, null, { lich, chay }), 3);
    });
    await xong;
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(lan, 4, "thử lại tới khi có bản AI");
    assert.equal(canAI(s), false);
    huyNen(s.id);
  } finally { store.sessions.pop(); }
});

// ---- Lệnh Chủ tịch 30/10: "bot bản gọn, low" — BoiAuto < 30 s bằng Claude ----
const sseMH = (text, modelVersion) => new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }], modelVersion })}\r\n\r\n`)); c.close(); } });
function cauNoiGon({ local = "tot", modelVersion = "claude-haiku-5-5", treMs = 0, tram = "mang" } = {}) {
  const goi = [];
  const f = async (u, o = {}) => {
    if (u === `${LOCAL_BASE}/ping`) { if (local === "chet") throw new TypeError("Failed to fetch"); return new Response("{}", { status: 200 }); }
    if (/\/v1beta\/models\?/.test(u)) return new Response(JSON.stringify({ models: [] }), { status: 200 });
    if (/\/v1beta\/models\/.+:streamGenerateContent/.test(u)) {
      const laLocal = u.startsWith(LOCAL_BASE);
      const b = JSON.parse(o.body);
      goi.push({ u, b, dich: laLocal ? "local" : u.startsWith(WORKER_BASE) ? "worker" : "khac" });
      if (laLocal && local !== "tot") throw new TypeError("Failed to fetch");
      if (treMs) await new Promise((r) => setTimeout(r, treMs));
      const msg = b.contents.at(-1).parts[0].text;
      const ten = /gọi đúng tên “([^”]+)”/u.exec(msg)?.[1] || "";
      const text = b.generationConfig?.responseMimeType
        ? JSON.stringify(b.generationConfig.responseSchema.properties.tang
          ? { tong_quan: CO_DAU, tang: [{ ten: "Câu hỏi", diem: 7, tarot_doc: [CO_DAU, CO_DAU, CO_DAU], dong_chay: CO_DAU, chot: CO_DAU, diem_nghen: CO_DAU, loi_khuyen: CO_DAU }], tong_ket: CO_DAU, loi_gui_khach: aiGiaTuNghia(msg, ten) }
          : { loi_gui_khach: aiGiaTuNghia(msg, ten), tong_ket: CO_DAU, tra_loi: YN[1] })
        : aiGiaTuNghia(msg, ten);
      return new Response(sseMH(text, modelVersion), { status: 200 });
    }
    if (u === TRAM_URL) {
      goi.push({ u, b: JSON.parse(o.body), dich: "tram" });
      if (tram === "mang") throw new TypeError("Failed to fetch");
      const body = JSON.parse(o.body).body;
      const msg = body.contents.at(-1).parts[0].text;
      const ten = /gọi đúng tên “([^”]+)”/u.exec(msg)?.[1] || "";
      const t = body.generationConfig?.responseMimeType ? JSON.stringify({ loi_gui_khach: aiGiaTuNghia(msg, ten), tong_ket: CO_DAU, tra_loi: YN[1] }) : aiGiaTuNghia(msg, ten);
      return new Response(JSON.stringify({ ok: true, model: "gemini-flash-latest", data: { candidates: [{ content: { parts: [{ text: t }] } }], modelVersion: "gemini-2.5-flash" } }), { status: 200 });
    }
    throw new TypeError("Failed to fetch");
  };
  return { f, goi };
}

test("bot gọn: gửi no_luc=low + lược đồ gọn (3 trường) + maxOutputTokens 4096; đủ lá Tarot + Lenormand; moHinh = modelVersion cầu nối", async () => {
  datCuuTram(CUU_THAT);
  try {
    const { f, goi } = cauNoiGon();
    await probeBridge(f, { on: true });
    assert.equal(bridge.local, true);
    const saved = [];
    const r = await giaiTuDong({ db, cauHoi: "Em có nên chuyển nhà không?", tenKhach: "Lan", trai: "tinhcam", key: aiKey(), fetchImpl: f, onSession: (x) => saved.push(x) });
    assert.ok(["ai", "ai-viet-lai"].includes(r.nguon), r.lyDo);
    assert.equal(r.moHinh, "claude-haiku-5-5", "nguồn phản ánh đúng mô hình đã viết");
    assert.match(r.loiGuiKhach, /^Lan ơi/u);
    assert.ok(kiemLoiGuiKhach(r.loiGuiKhach, db, { tenKhach: "Lan" }).ok, "cổng kiểm vẫn áp dụng cho bản gọn");
    assert.deepEqual(Object.keys(r).filter((k) => ["loiGuiKhach", "maKhoa", "nguon", "lyDo", "moHinh"].includes(k)).sort(), ["loiGuiKhach", "lyDo", "maKhoa", "moHinh", "nguon"]);
    const g = goi[0];
    assert.equal(g.dich, "local", "127.0.0.1 trước");
    assert.match(g.u, /:streamGenerateContent\?alt=sse&no_luc=low$/);
    const gc = g.b.generationConfig;
    assert.deepEqual(Object.keys(gc.responseSchema.properties), ["loi_gui_khach", "tong_ket", "tra_loi"]);
    assert.deepEqual(gc.responseSchema, SCHEMA_GON);
    assert.equal(gc.maxOutputTokens, 4096);
    assert.equal(GON_MAX_TOKENS, 4096);
    assert.equal(g.b.systemInstruction.parts[0].text, SYSTEM_GON);
    assert.doesNotMatch(SYSTEM_GON, /tarot_doc|dong_chay|noi_tang|mau_thuan|lenormand_cap/u, "bỏ hướng dẫn cho các trường đã cắt");
    assert.match(SYSTEM_GON, /LỜI GỬI KHÁCH/u);
    // đủ bài đã rút: mọi lá Tarot + Lenormand của mọi tầng đều có trong lời nhắc
    const msg = g.b.contents.at(-1).parts[0].text;
    const s0 = saved[0];
    const cells = s0.rounds[0].tarot.flat().map((c) => ["tarot", c]).concat(s0.rounds[0].lenormand.flat().map((c) => ["lenormand", c]));
    assert.ok(cells.length >= 18);
    for (const [deck, c] of cells) assert.ok(msg.includes(cardName(db, deck, c)), `thiếu lá ${cardName(db, deck, c)}`);
    assert.doesNotMatch(msg, /BẢN NHÁP CỦA ĐỘNG CƠ LUẬT|XƯNG HÔ TRONG BẢN GIẢI CHI TIẾT/u);
    assert.ok(msg.length < readingRequest(db, s0, { reading: analyze(db, s0, {}, 0) }).length, "lời nhắc gọn ngắn hơn bản đầy đủ");
    // phiên bot lưu bản gọn: web không coi là bản giải đầy đủ
    assert.equal(s0.ai, undefined, "bot không tạo bản giải đầy đủ");
    assert.equal(s0.lgk.nguon, r.nguon);
    assert.equal(s0.lgk.moHinh, "claude-haiku-5-5");
  } finally { datLaiCauNoi(); }
});

test("bot gọn: 127.0.0.1 hỏng → Worker (vẫn no_luc=low); cầu nối chết hết → bản luật (không Gemini); hẹn giờ gọn 35 s không cắt bản chậm", async () => {
  datCuuTram(CUU_THAT);
  try {
    const a = cauNoiGon({ local: "hong", modelVersion: "cx/gpt-5" });
    await probeBridge(a.f, { on: true });
    const ra = await giaiTuDong({ db, cauHoi: "Em có nên chuyển nhà không?", key: aiKey(), fetchImpl: a.f });
    assert.deepEqual(a.goi.slice(0, 2).map((x) => x.dich), ["local", "worker"]);
    assert.match(a.goi[1].u, /&no_luc=low$/);
    assert.equal(ra.moHinh, "cx/gpt-5", "cầu nối rơi GPT thì moHinh nói thật là GPT");
    datLaiCauNoi();
    // cầu nối chết (127.0.0.1 không có, Worker hỏng) → bản luật, không gọi trạm Gemini
    const b = cauNoiGon({ tram: "tot" });
    const dead = async (u, o) => (u === TRAM_URL ? b.f(u, o) : u.includes("/v1beta/") || u.endsWith("/ping") ? Promise.reject(new TypeError("Failed to fetch")) : b.f(u, o));
    await probeBridge(dead, { on: true });
    const rb = await giaiTuDong({ db, cauHoi: "Em có nên chuyển nhà không?", key: aiKey(), fetchImpl: dead });
    assert.equal(rb.nguon, "luat");
    assert.equal(rb.moHinh, "");
    assert.equal(b.goi.filter((g) => g.dich === "tram").length, 0, "không rơi sang Gemini");
    datLaiCauNoi();
    // hẹn giờ gọn = 35 s: phản hồi chậm hơn localTimeoutMs vẫn được nhận
    assert.equal(GON_HEN_GIO, 35000);
    const c = cauNoiGon({ local: "chet", treMs: 60 });
    await probeBridge(c.f, { on: true });
    const out = await streamWithFallback({ provider: "gemini", key: LOCAL_KEY, gon: true, json: true, system: SYSTEM_GON, messages: [{ role: "user", text: "x" }], fetchImpl: c.f, localTimeoutMs: 20 });
    assert.equal(out.key, LOCAL_KEY);
    assert.equal(out.moHinh, "claude-haiku-5-5");
  } finally { datLaiCauNoi(); }
});

test("chế độ đầy đủ (web): không gửi no_luc, lược đồ đầy đủ, không giới hạn 4096", async () => {
  datCuuTram(CUU_THAT);
  try {
    const { f, goi } = cauNoiGon();
    await probeBridge(f, { on: true });
    const out = await streamWithFallback({ provider: "gemini", key: LOCAL_KEY, json: true, system: SYSTEM_READING, messages: [{ role: "user", text: "x" }], fetchImpl: f });
    assert.equal(out.moHinh, "claude-haiku-5-5");
    assert.doesNotMatch(goi[0].u, /no_luc/);
    assert.match(goi[0].u, /:streamGenerateContent\?alt=sse$/);
    assert.ok(goi[0].b.generationConfig.responseSchema.properties.tang, "lược đồ đầy đủ");
    assert.equal(goi[0].b.generationConfig.maxOutputTokens, undefined);
  } finally { datLaiCauNoi(); }
});

// ---- GĐ 30/10: ô Lời gửi khách = đúng đường bản gọn của bot; độ dài theo câu hỏi; cổng chỉ chặn lỗi cứng ----
test("độ dài theo câu hỏi: câu ngắn 150–300 chữ; “Tài chính năm 2027 từng tháng” 600–800 chữ, 4–10 đoạn, đủ 12 tháng; tên tháng không bị coi là tên vị trí", async () => {
  const ngan = await createSession({ cauHoi: "Em có nên chuyển nhà không?", spreadId: "3la", tiers: spreadById("3la").tiers(), seed: SEED });
  assert.deepEqual([doDaiLgk(ngan).min, doDaiLgk(ngan).max, doDaiLgk(ngan).nhieu], [150, 300, false]);
  const sp = chonTrai("Tài chính năm 2027 từng tháng", "tu-chon");
  assert.equal(sp.id, "12thang");
  const dai = await createSession({ cauHoi: "Tài chính năm 2027 từng tháng", spreadId: sp.id, tiers: sp.tiers(2027), money: true, seed: SEED });
  const d = doDaiLgk(dai);
  assert.deepEqual([d.min, d.max, d.doanMin, d.doanMax, d.nhieu, d.moc.length], [600, 800, 4, 10, true, 12]);
  assert.match(dongDoDai(dai), /TỐI THIỂU 600 chữ .*4–10 đoạn/u);
  assert.match(dongDoDai(dai), /MỖI mốc 2–3 câu/u);
  assert.doesNotMatch(dongDoDai(ngan), /TỐI THIỂU/u, "câu ngắn giữ nguyên 150–300");
  assert.match(dongDoDai(dai), /Tháng 1\/2027, .*Tháng 12\/2027/u);
  assert.ok(laMocThoiGian("Tháng 3/2027") && laMocThoiGian("4–6 tuần tới") && !laMocThoiGian("Hao tài"));
  await ensureMapping(dai, 0);
  addPickedRound(dai, dai.tiers.map((t) => ({ tarot: viTriNgauNhien(78, t.t), lenormand: viTriNgauNhien(36, t.l) })));
  const msg = gonRequest(db, dai, { reading: analyze(db, dai, {}, 0) });
  assert.match(msg, /ĐỘ DÀI LỜI GỬI: TỐI THIỂU 600 chữ/u);
  assert.match(SYSTEM_GON, /ĐỘ DÀI LỜI GỬI/u);
  // nhắc tên tháng trong lời gửi là được (không phải lỗi cứng “tên vị trí”)
  const thang = Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}/2027 tiền vào đều, bạn giữ nhịp chi tiêu và để dành một phần nhỏ cho việc sắp tới.`).join("\n\n");
  const k = kiemLoiGuiKhach(`Bạn ơi, năm 2027 nhìn chung khá ổn về tiền.\n\n${thang}`, db, { session: dai });
  assert.ok(!k.loi.some((x) => /vị trí/u.test(x)), k.loi.join("; "));
});

test("ô Lời gửi khách trên web dùng ĐÚNG đường bản gọn của bot (no_luc=low, lược đồ gọn), chữ chảy dần; lỗi mềm vẫn là bản AI, nút chép mở", async () => {
  datCuuTram(CUU_THAT);
  const fetchCu = globalThis.fetch;
  const s = await sessionNgauNhien("tinhcam", 5);
  s.tenKhach = "Lan";
  store.db = db;
  store.sessions.push(s);
  try {
    const { f, goi } = cauNoiGon();
    globalThis.fetch = f;
    await probeBridge(f, { on: true });
    const chu = [];
    let ve = 0;
    const ok = await runLGK(s, null, { rerender: () => ve++ }, analyze(db, s, {}, 0), { giai: (o) => giaiLoiGuiKhach({ ...o, onText: (t) => { chu.push(t); o.onText(t); } }) });
    assert.equal(ok, true);
    assert.ok(chu.length >= 1, "chữ lời gửi chảy ra trước khi xong");
    assert.equal(goi[0].dich, "local");
    assert.match(goi[0].u, /&no_luc=low$/, "cùng đường gọn với bot");
    assert.deepEqual(goi[0].b.generationConfig.responseSchema, SCHEMA_GON);
    assert.equal(goi[0].b.systemInstruction.parts[0].text, SYSTEM_GON);
    assert.ok(["ai", "ai-viet-lai"].includes(s.lgk.nguon));
    assert.equal(s.lgk.moHinh, "claude-haiku-5-5");
    assert.equal(ve, 1);
    assert.equal(canAI(s), false);
    // màn giải: nút chép mở với bản AI, kể cả khi có cảnh báo mềm
    s.lgk = { ...s.lgk, canhBao: ["dài 120 chữ (nên 150–300)"] };
    const [, view] = ROUTES.find(([re]) => re.test(`/giai/${s.id}`));
    const html = view(`/giai/${s.id}`.match(/^\/giai\/([\w-]+)$/), new URLSearchParams("ban=luat")).html;
    assert.match(html, /id="chepLgk">Chép lời gửi khách</);
    assert.match(html, /Lưu ý nhẹ \(vẫn gửi được\): dài 120 chữ/u);
    assert.match(html, /Viết bởi claude-haiku-5-5/u);
    assert.doesNotMatch(html, /đang xem bản luật/u);
    // AI lỗi → dòng lý do là lý do THẬT
    s.lgk = { text: "x", nguon: "luat", lyDo: "cầu nối Claude lỗi (cầu nối chết) → luật", canhBao: [] };
    const h2 = view(`/giai/${s.id}`.match(/^\/giai\/([\w-]+)$/), new URLSearchParams("ban=luat")).html;
    assert.match(h2, /Bản theo luật vì cầu nối Claude lỗi \(cầu nối chết\) → luật\./u);
    assert.match(h2, /Đang chờ bản AI…/u);
    assert.doesNotMatch(h2, /đang xem bản luật/u);
    huyNen(s.id);
  } finally { globalThis.fetch = fetchCu; store.sessions.pop(); datLaiCauNoi(); }
});

test("F: bot gửi khách khi chỉ có lỗi mềm — lời AI ngắn 1 đoạn vẫn nguon “ai” kèm cảnh báo; lỗi cứng (tên lá) mới viết lại", async () => {
  datCuuTram(CUU_THAT);
  try {
    const ngan = "Lan ơi, chuyện chuyển nhà lần này nghiêng về có, nhưng đừng vội ký giấy tờ khi chưa xem kỹ chi phí phát sinh. Tuần này bạn nên đi xem thêm một chỗ nữa rồi mới chốt.";
    const goi = [];
    const f = async (u, o = {}) => {
      if (u === `${LOCAL_BASE}/ping`) throw new TypeError("Failed to fetch");
      if (/\/v1beta\/models\?/.test(u)) return new Response(JSON.stringify({ models: [] }), { status: 200 });
      if (u.startsWith(`${WORKER_BASE}/v1beta/models/`)) {
        const b = JSON.parse(o.body);
        goi.push(b);
        const text = b.generationConfig?.responseMimeType ? JSON.stringify({ loi_gui_khach: goi.length === 1 ? ngan : "x", tong_ket: CO_DAU }) : ngan;
        return new Response(sseMH(text, "claude-haiku-5-5"), { status: 200 });
      }
      throw new TypeError("Failed to fetch");
    };
    await probeBridge(f, { on: true });
    const r = await giaiTuDong({ db, cauHoi: "Em có nên chuyển nhà không?", tenKhach: "Lan", key: aiKey(), fetchImpl: f });
    assert.equal(r.nguon, "ai", r.lyDo);
    assert.equal(r.loiGuiKhach, ngan);
    assert.ok(r.canhBao.some((x) => /dài \d+ chữ|đoạn/u.test(x)), r.canhBao.join("; "));
    assert.equal(goi.length, 1, "không gọi viết lại vì chỉ có lỗi mềm");
  } finally { datLaiCauNoi(); }
});

// ---- GĐ 30/10 chiều: câu nhiều mốc 600–800 chữ, vẫn < 30 s ----
function cauNoi12({ soChu = 650, soChuThem = 0, treMs = 0 } = {}) {
  const goi = [];
  const f = async (u, o = {}) => {
    if (u === `${LOCAL_BASE}/ping`) throw new TypeError("Failed to fetch");
    if (/\/v1beta\/models\?/.test(u)) return new Response(JSON.stringify({ models: [] }), { status: 200 });
    if (u.startsWith(`${WORKER_BASE}/v1beta/models/`)) {
      const b = JSON.parse(o.body);
      goi.push({ u, b });
      if (treMs) await new Promise((r) => setTimeout(r, treMs));
      const msg = b.contents.at(-1).parts[0].text;
      const ten = /gọi đúng tên “([^”]+)”/u.exec(msg)?.[1] || "";
      const text = b.generationConfig?.responseMimeType
        ? JSON.stringify({ loi_gui_khach: aiDaiTuNghia(msg, ten, soChu), tong_ket: CO_DAU, tra_loi: YN[1] })
        : aiDaiTuNghia(msg, ten, soChuThem || soChu);
      return new Response(sseMH(text, "claude-haiku-5-5"), { status: 200 });
    }
    throw new TypeError("Failed to fetch");
  };
  return { f, goi };
}
const CAU_12 = "Tài chính năm 2027 của tôi từng tháng thế nào?";

test("câu 12 tháng: AI trả 650 chữ → nguon “ai”, không cảnh báo, không gọi thêm; lời nhắc đòi tối thiểu 600 chữ, mỗi tháng 2–3 câu, max token lớn hơn", async () => {
  datCuuTram(CUU_THAT);
  try {
    const { f, goi } = cauNoi12({ soChu: 650 });
    await probeBridge(f, { on: true });
    const r = await giaiTuDong({ db, cauHoi: CAU_12, tenKhach: "Lan", key: aiKey(), fetchImpl: f });
    assert.equal(r.trai, "12thang");
    assert.equal(r.nguon, "ai", r.lyDo);
    const n = demChu(r.loiGuiKhach);
    assert.ok(n >= 600 && n <= 800, `${n} chữ`);
    assert.deepEqual(r.canhBao, [], r.canhBao.join("; "));
    assert.equal(goi.length, 1, "đủ dài thì không gọi viết dài thêm");
    for (let m = 1; m <= 12; m++) assert.match(r.loiGuiKhach, new RegExp(`Tháng ${m}/2027`, "u"));
    const msg = goi[0].b.contents.at(-1).parts[0].text;
    assert.match(msg, /TỐI THIỂU 600 chữ/u);
    assert.match(msg, /MỖI mốc 2–3 câu cụ thể/u);
    assert.equal(goi[0].b.generationConfig.maxOutputTokens, 8192);
    assert.match(goi[0].u, /&no_luc=low$/);
    // câu ngắn giữ nguyên: 4096 token, không dòng TỐI THIỂU
    const g = cauNoiGon();
    await probeBridge(g.f, { on: true });
    const ngan = await giaiTuDong({ db, cauHoi: "Người yêu cũ có quay lại với tôi không?", key: aiKey(), fetchImpl: g.f });
    assert.ok(["ai", "ai-viet-lai"].includes(ngan.nguon));
    assert.equal(g.goi[0].b.generationConfig.maxOutputTokens, 4096);
    assert.doesNotMatch(g.goi[0].b.contents.at(-1).parts[0].text, /TỐI THIỂU/u);
  } finally { datLaiCauNoi(); }
});

test("câu 12 tháng: AI trả ~380 chữ → vẫn nguon “ai” + cảnh báo mềm; còn ngân sách thì viết dài thêm 1 lượt duy nhất, hết ngân sách thì giữ bản đang có", async () => {
  datCuuTram(CUU_THAT);
  try {
    // hết ngân sách: không gọi thêm, giữ bản ngắn, cảnh báo mềm
    const a = cauNoi12({ soChu: 380 });
    await probeBridge(a.f, { on: true });
    const ra = await giaiTuDong({ db, cauHoi: CAU_12, tenKhach: "Lan", key: aiKey(), fetchImpl: a.f, nganSachMs: 0 });
    assert.equal(ra.nguon, "ai", ra.lyDo);
    const na = demChu(ra.loiGuiKhach);
    assert.ok(na >= 300 && na < 600, `${na} chữ`);
    assert.ok(ra.canhBao.some((x) => /dài \d+ chữ \(nên 600–800\)/u.test(x)), ra.canhBao.join("; "));
    assert.ok(ra.canhBao.includes("không đủ thời gian viết dài thêm"));
    assert.equal(a.goi.length, 1);
    // còn ngân sách: đúng 1 lượt viết dài thêm (chữ thường, no_luc=low) → bản 700 chữ thay vào
    const b = cauNoi12({ soChu: 380, soChuThem: 700 });
    await probeBridge(b.f, { on: true });
    const rb = await giaiTuDong({ db, cauHoi: CAU_12, tenKhach: "Lan", key: aiKey(), fetchImpl: b.f });
    assert.equal(rb.nguon, "ai", rb.lyDo);
    assert.equal(b.goi.length, 2, "đúng 1 lượt viết dài thêm");
    assert.match(b.goi[1].u, /&no_luc=low$/);
    assert.equal(b.goi[1].b.generationConfig.responseMimeType, undefined, "lượt thêm trả chữ thường");
    assert.match(b.goi[1].b.contents.at(-1).parts[0].text, /BẢN ĐANG CÓ \(\d+ chữ — quá ngắn/u);
    assert.ok(demChu(rb.loiGuiKhach) >= 600, `${demChu(rb.loiGuiKhach)} chữ`);
    assert.equal(rb.vietDai, "đã viết dài thêm 1 lượt");
    assert.ok(!rb.canhBao.some((x) => /dài \d+ chữ/u.test(x)), rb.canhBao.join("; "));
    // lượt thêm vẫn ngắn → giữ bản cũ + cảnh báo, không gọi lần ba
    const c = cauNoi12({ soChu: 380, soChuThem: 380 });
    await probeBridge(c.f, { on: true });
    const rc = await giaiTuDong({ db, cauHoi: CAU_12, key: aiKey(), fetchImpl: c.f });
    assert.equal(rc.nguon, "ai");
    assert.equal(c.goi.length, 2);
    assert.ok(rc.canhBao.some((x) => /dài/u.test(x)));
    // lượt đầu chậm (ước lượt sau không kịp trong 30 s) → không gọi thêm
    const d = cauNoi12({ soChu: 380, treMs: 60 });
    await probeBridge(d.f, { on: true });
    const rd = await giaiTuDong({ db, cauHoi: CAU_12, key: aiKey(), fetchImpl: d.f, nganSachMs: 100 });
    assert.equal(d.goi.length, 1, "lượt đầu 60 ms, ngân sách 100 ms → không đủ cho lượt thêm");
    assert.equal(rd.nguon, "ai");
  } finally { datLaiCauNoi(); }
});

// ---- Lệnh Chủ tịch 28/10: khách không chọn kiểu trải, agent tự chọn theo câu hỏi ----
test("agent tự chọn trải theo câu hỏi: tinhcam / 3thang / canam / cokhong / tudo; mỗi ca ra lời gửi khách qua cổng", async () => {
  const ca = [["Người ấy còn thương em không?", "tinhcam"], ["Tháng sau có tăng lương không?", "3thang"], ["Năm 2027 của em thế nào?", "canam"], ["Có nên nghỉ việc không?", "cokhong"], ["Em nên làm gì bây giờ?", "tudo"]];
  for (const [q, id] of ca) {
    let s;
    const r = await giaiTuDong({ db, cauHoi: q, tenKhach: "Lan", onSession: (x) => (s = x) });
    assert.equal(r.trai, id, q);
    assert.equal(s.spreadId, id);
    assert.ok(r.lyDoTrai && r.tenTrai, "có lý do chọn trải");
    assert.ok(kiemLoiGuiKhach(r.loiGuiKhach, db, { tenKhach: "Lan", xungHo: "Queen Linh", session: s }).ok, `${q}: lời gửi qua cổng`);
    if (id === "canam") { assert.equal(s.nam, 2027, "năm lấy từ câu hỏi"); assert.match(s.tiers[0].ten, /2027/); }
    if (id === "3thang") assert.equal(s.money, true);
    if (id === "cokhong") assert.equal(s.tiers[0].ten, q, "tầng Có/Không đặt theo chính câu hỏi");
  }
});

test("trải cần tham số thì agent tự điền: canam/12thang năm mặc định, vanhan, tudo — chạy trọn, không hỏi khách", async () => {
  const sp = (id) => SPREADS.find((x) => x.id === id);
  assert.equal(thamSoTrai("Cả năm tới của em ra sao?", sp("canam")).nam, defaultYear(), "không nêu năm → năm mặc định");
  assert.equal(thamSoTrai("Xem 12 tháng năm 2028", sp("12thang")).tiers.length, 12);
  assert.equal(thamSoTrai("x", sp("tudo")).tiers[0].pos.length, 3);
  for (const [q, id] of [["Vận hạn của em dạo này có xui không?", "vanhan"], ["Xem giúp em 12 tháng năm 2027 từng tháng", "12thang"], ["Cả năm tới của em ra sao?", "canam"]]) {
    let s;
    const r = await giaiTuDong({ db, cauHoi: q, onSession: (x) => (s = x) });
    assert.equal(r.trai, id, q);
    assert.ok(s.rounds[0].tarot.flat().length > 0);
    assert.ok(kiemLoiGuiKhach(r.loiGuiKhach, db, { session: s }).ok, `${q}: lời gửi qua cổng`);
  }
  // vẫn nhận trai khi truyền tường minh
  assert.equal((await giaiTuDong({ db, cauHoi: "Người ấy còn thương em không?", trai: "3la" })).trai, "3la");
});

test("BoiAuto.giai(q, {tenKhach}) không truyền trai → câu tình cảm không còn ra “3la”; gói nhiều câu mỗi câu tự chọn trải riêng", async () => {
  const auto = taoBoiAuto(async () => ({ db, settings: {} }));
  const r = await auto.giai("Người ấy còn thương em không?", { tenKhach: "Lan" });
  assert.notEqual(r.trai, "3la");
  assert.equal(r.trai, "tinhcam");
  assert.match(r.lyDoTrai, /tình cảm/u);
  const goi = await Promise.all(["Người ấy còn thương em không?", "Có nên nghỉ việc không?", "Tháng sau có tăng lương không?"].map((q) => auto.giai(q, { tenKhach: "Lan" })));
  assert.deepEqual(goi.map((x) => x.trai), ["tinhcam", "cokhong", "3thang"]);
});

test("trang đào tạo không còn ô “Kiểu trải”; nút Trải bài gọi auto.giaiGoi (không truyền trai); dòng “Agent chọn” chỉ ở trang đào tạo", () => {
  const html = readFileSync(join(HERE, "dao-tao/index.html"), "utf8");
  assert.ok(!/id="trai"/.test(html) && !/Kiểu trải/u.test(html));
  const js = readFileSync(join(HERE, "dao-tao/dao-tao.js"), "utf8");
  assert.ok(!/st\.trai/.test(js) && !/\$\("trai"\)/.test(js));
  assert.match(js, /auto\.giaiGoi\(q, \{ soCau \}\)/);
  assert.match(js, /Agent chọn: /u);
  // phần gửi agent/khách chỉ có nội dung tin, không kèm dòng chọn trải
  const req = DT.yeuCauTraLoi({ kenh: "01", goi: 3, cau_con: 2, lich_su: [{ vai: "agent", noi_dung: "Lan ơi…", loai: "loi_gui_khach", ten_trai: "Tình cảm 3 tầng", ly_do_trai: "câu hỏi về tình cảm" }] });
  assert.deepEqual(req.lich_su, [{ vai: "agent", noi_dung: "Lan ơi…" }]);
});

// ---- v11 (28/10): đường hầm hỏng thoáng qua ở trang đào tạo → nối lại rồi gửi lại 1 lần ----
test("đào tạo: lỗi mạng lần 1 → nối lại (dò lại cầu nối) rồi gửi lại đúng tin đó, hiện câu agent, không ⚠; hỏng cả 5 lần → báo lỗi", async () => {
  let lan = 0, noiLai = 0;
  const bat = [], gui = [];
  const fetch1 = async (u, o) => { lan++; gui.push(o.body); if (lan === 1) throw new TypeError("Failed to fetch"); return new Response(JSON.stringify({ tra_loi: "Mình nghe bạn đây." }), { status: 200 }); };
  const body = DT.yeuCauTraLoi({ kenh: "01", goi: 3, cau_con: 3, lich_su: [{ vai: "khach", noi_dung: "Em mệt lắm rồi…" }] });
  const j = await DT.goiCoThuLai(() => DT.goiTroLy({ base: "https://t.example", path: "/tro_ly/tra_loi", body, fetchImpl: fetch1 }), { noiLai: async () => { noiLai++; }, onNoiLai: (x) => bat.push(x), cho: async () => {} });
  assert.equal(DT.docTraLoi(j).noi_dung, "Mình nghe bạn đây.");
  assert.equal(lan, 2); assert.equal(noiLai, 1);
  assert.equal(gui[0], gui[1], "gửi lại đúng tin đó");
  assert.deepEqual(bat, [{ lan: 1, tong: 4 }, null], "dòng “Đang nối lại máy nhà… (lần 1/4)” bật rồi tắt");
  // hỏng cả hai lần → lỗi (trang mới hiện ⚠)
  let n = 0;
  const e = await DT.goiCoThuLai(() => DT.goiTroLy({ base: "https://t.example", path: "/tro_ly/tra_loi", body, fetchImpl: async () => { n++; throw new TypeError("Failed to fetch"); } }), { noiLai: async () => {}, cho: async () => {} }).then(() => null, (x) => x);
  assert.equal(n, 5, "1 lần đầu + 4 lần thử lại"); assert.equal(e?.message, DT.LOI_CAU_NOI_TAT);
  // chưa có địa chỉ cầu nối lúc đầu, nối lại thì có → chạy
  let base = "";
  const j2 = await DT.goiCoThuLai(() => DT.goiTroLy({ base, path: "/tro_ly/tra_loi", body, fetchImpl: async () => new Response(JSON.stringify({ tra_loi: "Có đây." }), { status: 200 }) }), { noiLai: async () => { base = "https://t2.example"; }, cho: async () => {} });
  assert.equal(j2.tra_loi, "Có đây.");
  // hết giờ thì không gửi lại (tránh agent trả lời 2 lần)
  let h = 0;
  const hang = (u, o) => { h++; return new Promise((_, rej) => o.signal.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError")))); };
  const eh = await DT.goiCoThuLai(() => DT.goiTroLy({ base: "https://t.example", path: "/x", body, fetchImpl: hang, ms: 20 }), { noiLai: async () => {}, cho: async () => {} }).then(() => null, (x) => x);
  assert.equal(h, 1); assert.match(eh.message, /quá lâu/u);
});

test("đào tạo: cầu nối trả 429 → báo quá lượt, không báo “cầu nối tắt”, không nối lại", async () => {
  let n = 0, noiLai = 0;
  const e = await DT.goiCoThuLai(() => DT.goiTroLy({ base: "https://t.example", path: "/tro_ly/tra_loi", body: {}, fetchImpl: async () => { n++; return new Response(JSON.stringify({ error: "quota" }), { status: 429 }); } }), { noiLai: async () => { noiLai++; } }).then(() => null, (x) => x);
  assert.equal(e.message, DT.LOI_QUA_LUOT);
  assert.ok(e.quaLuot && !e.tat);
  assert.notEqual(e.message, DT.LOI_CAU_NOI_TAT);
  assert.equal(n, 1); assert.equal(noiLai, 0);
});

test("đào tạo: lưu “Sửa câu này” hỏng → bản Chủ tịch sửa nằm trong hàng chờ localStorage, cầu nối sống thì gửi lại được", async () => {
  const mem = new Map(), storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
  const body = DT.yeuCauMauSua({ kenh: "02", goi: 3, lich_su: [{ vai: "khach", noi_dung: "Em mệt lắm rồi…" }], ban_agent: "Bản agent", ban_chu_tich: "Bản Chủ tịch sửa", ly_do: "giọng chưa ấm" });
  DT.themHangCho(storage, "m1", body);
  const hong = await DT.goiCoThuLai(() => DT.goiTroLy({ base: "https://t.example", path: "/tro_ly/mau_sua", body, fetchImpl: async () => { throw new TypeError("Failed to fetch"); } }), { noiLai: async () => {}, cho: async () => {} }).then(() => null, (x) => x);
  assert.ok(hong?.tat);
  assert.equal(DT.docHangCho(storage).length, 1, "lưu hỏng vẫn còn trong hàng chờ");
  assert.equal(DT.docHangCho(storage)[0].body.ban_chu_tich, "Bản Chủ tịch sửa");
  // vẫn chết → giữ nguyên
  let r = await DT.guiHangCho(storage, async () => { throw new TypeError("Failed to fetch"); });
  assert.deepEqual(r, { daGui: [], con: 1 });
  // cầu nối sống → gửi lại đúng bản đó, hàng chờ trống
  const daNhan = [];
  DT.themHangCho(storage, "m2", { ...body, ban_chu_tich: "Bản thứ hai" });
  r = await DT.guiHangCho(storage, async (b) => { daNhan.push(b); return DT.goiTroLy({ base: "https://t.example", path: "/tro_ly/mau_sua", body: b, fetchImpl: async () => new Response('{"ok":true}', { status: 200 }) }); });
  assert.deepEqual(r, { daGui: ["m1", "m2"], con: 0 });
  assert.deepEqual(daNhan.map((b) => b.ban_chu_tich), ["Bản Chủ tịch sửa", "Bản thứ hai"]);
  assert.equal(storage.getItem(DT.HANG_CHO_KEY), null);
  DT.themHangCho(storage, "m3", body); DT.boHangCho(storage, "m3");
  assert.equal(DT.docHangCho(storage).length, 0);
});

// ---- Lệnh 28/10: mọi câu sau câu trả lời thẳng phải cùng chiều với nó ----
const MAU_CU_TRAI_CHIEU = "Về câu bạn hỏi “Người ấy còn thương em không?”, trải bài nói khá rõ về chuyện đang diễn ra. Câu trả lời là còn, và điều đó khá rõ. Khoảng đầu, mối quan hệ đang có nhiều tranh cãi này lửa do sự khác biệt trong tư duy.\n\nĐiều đang đẩy bạn đi tới là người có đôi tận hưởng những khoảnh khắc ngọt ngào, thấu hiểu và gắn kết bền chặt. Thêm một chi tiết đáng để ý: gặp được người mới tốt hơn sau khi tan vỡ.\n\nVề sau, trong tình yêu, đây là biểu hiện của sự cam kết bền vững và biết cách nhường nhịn. Điều nên làm lúc này: hãy dùng sự bao dung để đối đãi với đối phương, mọi hiểu lầm sẽ được hóa giải.";

test("cùng chiều: mẫu chụp màn hình cũ bị cổng bắt câu “người mới… tan vỡ”; dựng lại đúng cặp lá đó → bản luật 0 câu trái chiều", async () => {
  assert.deepEqual(chieuTrongLoi(MAU_CU_TRAI_CHIEU), { chieu: "tot", i: 1 });
  const phienCu = { cauHoi: "Người ấy còn thương em không?", spreadId: "tinhcam", tiers: spreadById("tinhcam").tiers(), rounds: [] };
  assert.deepEqual(cauTraiChieu(MAU_CU_TRAI_CHIEU, phienCu), ["Thêm một chi tiết đáng để ý: gặp được người mới tốt hơn sau khi tan vỡ."]);
  const k = kiemLoiGuiKhach(MAU_CU_TRAI_CHIEU, db, { session: phienCu });
  assert.ok(k.canhBao.some((x) => /trái chiều câu trả lời \(đã nói có\/còn\)/u.test(x)), k.canhBao.join("; "));
  // dựng lại: trải tình cảm “Người ấy còn thương em không?”, câu trả lời “còn”, tầng đầu có cặp Lenormand Coffin + Clover
  const idLen = (en) => db.lenormand.la.findIndex((c) => c.en === en) + 1;
  let gap = 0;
  for (let lan = 0; lan < 60 && gap < 5; lan++) {
    let s;
    await giaiTuDong({ db, cauHoi: "Người ấy còn thương em không?", tenKhach: "Lan", onSession: (x) => (s = x) });
    s.rounds[0].lenormand[0] = [{ card: idLen("Coffin"), ok: true }, { card: idLen("Clover"), ok: true }, ...s.rounds[0].lenormand[0].slice(2)];
    const rule = analyze(db, s, {}, 0);
    if (chieuTraLoi(s, nghiaTrai(db, s, rule), rule) === "xau") continue;
    assert.ok(nghiaTrai(db, s, rule)[0].cap.some((c) => /người mới tốt hơn sau khi tan vỡ/u.test(c)), "ca này có đúng câu cặp lá cũ");
    gap++;
    const t = loiGuiKhachLuat(db, s, rule, { tenKhach: "Lan" });
    assert.deepEqual(cauTraiChieu(t, s), [], t);
    assert.ok(!/người mới|tan vỡ/u.test(t), t);
    assert.ok(kiemLoiGuiKhach(t, db, { tenKhach: "Lan", session: s }).ok, t);
  }
  assert.ok(gap >= 3, "đủ ca chiều “còn” để kiểm");
});

test("cùng chiều: lá cản nói như điều đang che/làm chậm thì cho qua; câu phủ định không tính; đã nói “nghiêng về không” thì chặn câu hứa chắc thành", () => {
  assert.equal(traiChieu("Điều đang che bớt câu trả lời là nỗi sợ chia tay còn lởn vởn.", "tot"), false);
  assert.equal(traiChieu("Đừng vội buông tay khi mọi chuyện còn đang ấm lại.", "tot"), false);
  assert.equal(traiChieu("Sau đó hai người sẽ chia tay.", "tot"), true);
  assert.equal(traiChieu("Đây là lúc cần dũng cảm buông bỏ những thứ không còn mang lại giá trị.", "tot", false), false, "lời khuyên buông bỏ không phải đảo ngược câu “có đỗ”");
  assert.equal(traiChieu("Cuối cùng mọi chuyện sẽ kết thúc.", "tot", false), false, "“kết thúc” chỉ là đảo ngược khi hỏi chuyện tình cảm");
  assert.equal(traiChieu("Rồi kết quả sẽ thất bại.", "tot", false), true);
  assert.equal(traiChieu("Chuyện này chắc chắn sẽ thành.", "xau"), true);
  assert.equal(traiChieu("Chuyện này chưa chắc chắn sẽ thành.", "xau"), false);
  assert.equal(traiChieu("Mọi việc sẽ suôn sẻ và viên mãn.", "xau"), true);
  assert.equal(traiChieu("Chuyện này chắc chắn sẽ thành.", "giua"), true, "có điều kiện thì không hứa chắc");
  const xau = "Về câu bạn hỏi, trải bài nói khá rõ. Câu trả lời nghiêng về không, ít nhất là ở thời điểm này. Rồi mọi việc sẽ suôn sẻ và viên mãn.";
  assert.equal(chieuTrongLoi(xau).chieu, "xau");
  assert.deepEqual(cauTraiChieu(xau), ["Rồi mọi việc sẽ suôn sẻ và viên mãn."]);
  // câu hỏi tình cảm: “chia tay” sau câu trả lời “còn” là trái chiều; câu hỏi thi cử: “kết thúc” thì không
  const tinh = "Về câu bạn hỏi, trải bài nói khá rõ. Câu trả lời là còn, và điều đó khá rõ. Rồi hai người sẽ chia tay.";
  assert.equal(cauTraiChieu(tinh, { cauHoi: "Người ấy còn thương em không?", spreadId: "tinhcam" }).length, 1);
  assert.equal(cauTraiChieu(tinh.replace("chia tay", "kết thúc kỳ thi"), { cauHoi: "Em có đỗ đại học không?", spreadId: "cokhong" }).length, 0);
  // lời không nói câu trả lời rõ thì không phán chiều
  assert.equal(chieuTrongLoi("Lan ơi, trải bài của bạn nói khá rõ. Tuần này hãy làm một việc nhỏ."), null);
});

test("cùng chiều: AI viết mâu thuẫn → cảnh báo mềm, vẫn dùng bản AI (GĐ 30/10); lỗi cứng mới viết lại 1 lần", async () => {
  let s, rule, dung;
  for (let lan = 0; lan < 40; lan++) {
    await giaiTuDong({ db, cauHoi: "Em có đỗ đại học không?", tenKhach: "Lan", onSession: (x) => (s = x) });
    rule = analyze(db, s, {}, 0);
    if (chieuTraLoi(s, nghiaTrai(db, s, rule), rule) !== "xau") { dung = loiGuiKhachLuat(db, s, rule, { tenKhach: "Lan" }); break; }
  }
  assert.ok(dung && kiemLoiGuiKhach(dung, db, { tenKhach: "Lan", session: s }).ok);
  assert.notEqual(chieuTrongLoi(dung).chieu, "xau");
  const mauThuan = dung.replace(/\n\n/u, " Rồi cuối cùng kết quả sẽ thất bại.\n\n");
  const k = kiemLoiGuiKhach(mauThuan, db, { tenKhach: "Lan", session: s });
  assert.ok(k.ok && k.canhBao.some((x) => /trái chiều câu trả lời/u.test(x)), k.canhBao.join("; "));
  let n = 0, msg = "";
  const r = await chotLoiGuiKhach({ db, session: s, rule, reading: { loi_gui_khach: mauThuan }, tenKhach: "Lan", call: async (sys, m) => { n++; msg = m; return dung; } });
  assert.equal(n, 0);
  assert.equal(r.nguon, "ai");
  assert.equal(r.text, mauThuan);
  assert.ok(r.canhBao.some((x) => /trái chiều/u.test(x)));
  // lỗi cứng (in đậm) → viết lại 1 lần, bản viết lại sạch thì nhận
  const r2 = await chotLoiGuiKhach({ db, session: s, rule, reading: { loi_gui_khach: `**${mauThuan}**` }, tenKhach: "Lan", call: async (sys, m) => { n++; msg = m; return dung; } });
  assert.equal(n, 1, "viết lại đúng 1 lần");
  assert.match(msg, /in đậm/u);
  assert.equal(r2.nguon, "ai-viet-lai");
  assert.equal(r2.text, dung);
  assert.match(SYSTEM_LGK, /cùng chiều/u);
  assert.match(SYSTEM_READING, /cùng chiều/u);
});

test("cùng chiều: 400 lượt bản luật (8 kiểu câu hỏi) đều qua cổng, 0 câu trái chiều, câu trả lời luôn đọc được chiều", async () => {
  const qs = ["Người ấy còn thương em không?", "Anh ấy có quay lại không?", "Có nên nghỉ việc không?", "Tháng sau có tăng lương không?", "Năm 2027 của em thế nào?", "Em có đỗ đại học không?", "Vận hạn của em dạo này có xui không?", "Em nên làm gì bây giờ?"];
  let qua = 0, trai = 0, khongChieu = 0;
  for (let k = 0; k < 400; k++) {
    let s;
    const r = await giaiTuDong({ db, cauHoi: qs[k % qs.length], tenKhach: k % 3 ? "Lan" : "", onSession: (x) => (s = x) });
    if (kiemLoiGuiKhach(r.loiGuiKhach, db, { tenKhach: r.tenKhach, xungHo: "Queen Linh", session: s }).ok) qua++;
    if (cauTraiChieu(r.loiGuiKhach, s).length) trai++;
    if (!chieuTrongLoi(r.loiGuiKhach)) khongChieu++;
    const cau = r.loiGuiKhach.split(/(?<=[.!?…])\s+/u).map((c) => c.replace(/^[^,:]{0,40}[,:]\s*/u, "").trim().toLowerCase()).filter((c) => c.length > 30);
    assert.equal(new Set(cau).size, cau.length, `không lặp câu: ${r.loiGuiKhach}`);
  }
  assert.equal(qua, 400);
  assert.equal(trai, 0);
  assert.equal(khongChieu, 0);
});

// ---- Lệnh 28/10 (mẫu sửa số 3): chốt câu hỏi thật trước khi trải ----
test("chốt câu hỏi: “Ai à”, “alo”, “?”, “ok”, “shop ơi”, hỏi shop/AI/giá → hỏi lại khách, 0 lá; câu bói thật → trải bình thường", async () => {
  for (const q of ["Ai à", "alo", "?", "ok", "shop ơi", "Bạn là máy hay AI trả lời tự động vậy?", "Trả lời thẳng đi: có phải AI không? Có hay không thôi.", "Ai bốc bài cho em vậy? Có bốc tay không?", "Giá vậy cao quá, bớt cho em còn một nửa được không?", "Bói thử cho em một câu miễn phí đi", "Dạo này em mệt lắm, em cũng không biết mình muốn hỏi gì nữa, chị nghe em kể chút được không…"]) {
    let phien = 0;
    const r = await giaiTuDong({ db, cauHoi: q, onSession: () => phien++ });
    assert.equal(r.canHoiLai, true, q);
    assert.equal(r.loiGuiKhach, "Câu hỏi bạn muốn hỏi là gì ạ? Bạn viết rõ giúp shop");
    assert.equal(r.maKhoa, null, `${q}: không bốc lá`);
    assert.equal(phien, 0, `${q}: không tạo phiên`);
    assert.ok(DT.kiemTraLoiAgent(r.loiGuiKhach).ok);
  }
  // đòi hoàn tiền / ý tự hại: không trải, chuyển Chủ tịch
  for (const q of ["Bói chẳng đúng gì cả, hoàn tiền lại cho em đi.", "Em mệt lắm rồi, chẳng còn thiết sống nữa, bói xem em còn cố được không…"]) {
    const r = await giaiTuDong({ db, cauHoi: q });
    assert.equal(r.chuyenNguoi, true, q); assert.equal(r.maKhoa, null);
  }
  // câu bói thật vẫn trải (không chặn nhầm)
  for (const q of ["Người ấy còn thương em không?", "Ai đang nói xấu em?", "Em có nên học AI không?", "Tháng này em kiếm được bao nhiêu tiền?", "Tình yêu?", "Em nên làm gì bây giờ?"]) assert.ok(laCauHoiBoi(q).ok, q);
  let s;
  const r = await giaiTuDong({ db, cauHoi: "Người ấy còn thương em không?", tenKhach: "Lan", onSession: (x) => (s = x) });
  assert.ok(!r.canHoiLai && r.maKhoa && s.rounds[0].tarot.flat().length > 0);
  assert.equal(r.trai, "tinhcam");
});

test("gói N câu: tách đúng câu hỏi trong tin khách; gửi thừa thì chỉ trải N câu đầu và trả về câu thừa; tin không có câu hỏi bói → hỏi lại", async () => {
  assert.deepEqual(tachCauHoi("Shop ơi\nNgười ấy còn thương em không?"), ["Người ấy còn thương em không?"]);
  assert.deepEqual(tachCauHoi("Em hỏi 3 câu: 1. Người ấy còn thương em không 2. Tháng sau có tăng lương không 3) Có nên nghỉ việc không"), ["Người ấy còn thương em không", "Tháng sau có tăng lương không", "Có nên nghỉ việc không"]);
  assert.deepEqual(tachCauHoi("Dạo này em buồn lắm. Người ấy còn thương em không? Còn chuyện công việc, tháng sau có tăng lương không?"), ["Dạo này em buồn lắm. Người ấy còn thương em không?", "Còn chuyện công việc, tháng sau có tăng lương không?"]);
  assert.deepEqual(tachCauHoi("Xem giúp em 12 tháng năm 2027 từng tháng"), ["Xem giúp em 12 tháng năm 2027 từng tháng"]);
  const auto = taoBoiAuto(async () => ({ db, settings: {} }));
  const g = await auto.giaiGoi("Người ấy còn thương em không? Tháng sau có tăng lương không? Có nên nghỉ việc không?", { soCau: 2, tenKhach: "Lan" });
  assert.deepEqual(g.cau.map((c) => c.cauHoi), ["Người ấy còn thương em không?", "Tháng sau có tăng lương không?"]);
  assert.deepEqual(g.cau.map((c) => c.trai), ["tinhcam", "3thang"], "mỗi câu tự chọn trải riêng");
  assert.deepEqual(g.thua, ["Có nên nghỉ việc không?"]);
  for (const c of g.cau) assert.ok(c.maKhoa && kiemLoiGuiKhach(c.loiGuiKhach, db, { tenKhach: "Lan" }).ok);
  const h = await auto.giaiGoi("Ai à", { soCau: 3 });
  assert.equal(h.canHoiLai, true); assert.equal(h.loiGuiKhach, HOI_LAI); assert.equal(h.cau.length, 0);
  const t = await auto.giaiGoi("Hoàn tiền cho em đi", { soCau: 3 });
  assert.equal(t.chuyenNguoi, true); assert.equal(t.cau.length, 0);
  // trang đào tạo: Trải bài gọi giaiGoi theo số câu còn lại, có ghi chú câu thừa, có nhãn hỏi lại
  const js = readFileSync(join(HERE, "dao-tao/dao-tao.js"), "utf8");
  assert.match(js, /auto\.giaiGoi\(q, \{ soCau \}\)/);
  assert.match(js, /chỉ trải \$\{r\.cau\.length\} câu đầu/u);
  assert.match(js, /Chưa trải — hỏi lại khách/u);
  // ghi chú câu thừa không đi tới agent/khách
  assert.deepEqual(DT.yeuCauTraLoi({ kenh: "01", goi: 3, cau_con: 0, lich_su: [{ vai: "ghi_chu", noi_dung: "Khách gửi 3 câu…" }] }).lich_su, []);
});

// ---- Lỗi gấp 28/10 11:25: mỗi tình huống ở trang đào tạo là một cuộc chat riêng ----
test("đào tạo: mỗi tình huống một cuộc — tự hại → câu 115; “Hỏi thêm ngoài gói”, “Đòi bói miễn phí” sau đó KHÔNG còn câu 115; gõ tay “em vẫn muốn chết” → vẫn 115", async () => {
  const C115 = "Bạn đợi mình chút nhé. Nếu bạn đang nghĩ tới việc làm hại bản thân, hãy gọi ngay 115.";
  // cầu nối giả mô phỏng máy nhà: thấy tin tự hại trong lịch sử gửi lên thì trả câu 115
  const mayNha = (body) => {
    const khach = body.lich_su.filter((m) => m.vai === "khach").map((m) => m.noi_dung);
    if (khach.some((t) => /thiết sống|muốn chết/u.test(t))) return { chuyen_nguoi: true, ly_do: "tự hại", tra_loi: C115 };
    if (/miễn phí/u.test(khach.at(-1))) return { tra_loi: "Shop chưa xem miễn phí được bạn ơi, bạn chọn gói 1 câu để mình trải kỹ cho bạn nhé." };
    return { tra_loi: "Mỗi gói tính theo số câu bạn ơi, câu thêm mình tính như gói 1 câu nhé." };
  };
  const ls = [];
  const gui = (tin, tinh_huong) => {
    ls.push({ vai: "khach", noi_dung: tin, ...(tinh_huong ? { tinh_huong } : {}) });
    const body = DT.yeuCauTraLoi({ kenh: "01", goi: 3, cau_con: 2, lich_su: DT.lichSuCuoc(ls) });
    assert.equal(body.cau_con, 2, "không đổi cau_con");
    const tl = DT.docTraLoi(mayNha(body));
    ls.push({ ...tl, ...(tinh_huong ? { tinh_huong } : {}) });
    return { tl, body };
  };
  const th = (id) => DT.TINH_HUONG.find((x) => x.id === id);
  const a = gui(th("tu-hai").tin, "tu-hai");
  assert.equal(a.tl.noi_dung, C115);
  const b = gui(th("ngoai-goi").tin, "ngoai-goi");
  assert.notEqual(b.tl.noi_dung, C115);
  assert.deepEqual(b.body.lich_su, [{ vai: "khach", noi_dung: th("ngoai-goi").tin }], "chỉ gửi cuộc của tình huống này");
  const c = gui(th("mien-phi").tin, "mien-phi");
  assert.match(c.tl.noi_dung, /chưa xem miễn phí/u);
  assert.notEqual(c.tl.noi_dung, C115);
  // tin gõ tay thuộc cuộc của tình huống gần nhất phía trên
  const d = gui("Vậy thôi, cho em hỏi gói 1 câu bao nhiêu?");
  assert.equal(d.body.lich_su.length, 3, "gõ tay tiếp nối cuộc “Đòi bói miễn phí”");
  assert.equal(d.body.lich_su[0].noi_dung, th("mien-phi").tin);
  // gõ tay ngay sau tình huống tự hại → cuộc tự hại → vẫn 115
  const ls2 = [];
  ls2.push({ vai: "khach", noi_dung: th("tu-hai").tin, tinh_huong: "tu-hai" }, { vai: "agent", noi_dung: C115, chuyen_nguoi: true, tinh_huong: "tu-hai" });
  ls2.push({ vai: "khach", noi_dung: "em vẫn muốn chết" });
  const e = DT.docTraLoi(mayNha(DT.yeuCauTraLoi({ kenh: "01", goi: 3, cau_con: 2, lich_su: DT.lichSuCuoc(ls2) })));
  assert.equal(e.noi_dung, C115);
  // mẫu sửa: chỉ lịch sử của đúng cuộc, tới trước tin agent đang sửa
  const iAgentB = ls.findIndex((m) => m.vai === "agent" && m.tinh_huong === "ngoai-goi");
  assert.deepEqual(DT.lichSuCuoc(ls, iAgentB, { denCuoi: false }).map((m) => m.noi_dung), [th("ngoai-goi").tin]);
  const ms = DT.yeuCauMauSua({ kenh: "01", goi: 3, lich_su: DT.lichSuCuoc(ls, iAgentB, { denCuoi: false }), ban_agent: ls[iAgentB].noi_dung, ban_chu_tich: "Bản sửa", ly_do: "" });
  assert.ok(!ms.lich_su.some((m) => /thiết sống/u.test(m.noi_dung)), "mẫu sửa không kéo tin tự hại của tình huống khác");
  // chưa bấm tình huống nào: cả lịch sử là một cuộc
  assert.equal(DT.lichSuCuoc([{ vai: "khach", noi_dung: "a" }, { vai: "agent", noi_dung: "b" }, { vai: "khach", noi_dung: "c" }]).length, 3);
  // trang có vạch ngăn “— Cuộc mới: … —”
  assert.match(readFileSync(join(HERE, "dao-tao/dao-tao.js"), "utf8"), /— Cuộc mới: /u);
});

// ---- Lỗi gấp 28/10 11:39: đường hầm chập chờn — thử lại 4 lần + đọc địa chỉ qua API ----
test("đào tạo: lỗi mạng 2 lần rồi được → hiện câu trả lời, không báo lỗi; chờ 2 s, 5 s rồi gửi lại; mỗi lần đọc lại địa chỉ", async () => {
  let lan = 0, doc = 0;
  const cho = [], bat = [];
  const j = await DT.goiCoThuLai(() => DT.goiTroLy({ base: "https://t.example", path: "/tro_ly/tra_loi", body: {}, fetchImpl: async () => { lan++; if (lan <= 2) throw new TypeError("Failed to fetch"); return new Response(JSON.stringify({ tra_loi: "Mình nghe đây." }), { status: 200 }); } }),
    { noiLai: async () => { doc++; }, onNoiLai: (x) => bat.push(x), cho: async (ms) => { cho.push(ms); } });
  assert.equal(DT.docTraLoi(j).noi_dung, "Mình nghe đây.");
  assert.equal(lan, 3); assert.equal(doc, 2, "mỗi lần thử lại đều đọc lại địa chỉ");
  assert.deepEqual(cho, [2000, 5000]);
  assert.deepEqual(bat, [{ lan: 1, tong: 4 }, { lan: 2, tong: 4 }, null]);
  assert.deepEqual(DT.LICH_THU_LAI, [2000, 5000, 10000, 20000]);
});

test("đào tạo: lỗi mạng 5 lần → báo “cầu nối tắt” sau 4 lần thử lại; AbortError (quá 90 s) → không thử lại, báo “trả lời quá lâu”", async () => {
  let n = 0;
  const cho = [];
  const e = await DT.goiCoThuLai(() => DT.goiTroLy({ base: "https://t.example", path: "/tro_ly/tra_loi", body: {}, fetchImpl: async () => { n++; throw new TypeError("Failed to fetch"); } }), { noiLai: async () => {}, cho: async (ms) => { cho.push(ms); } }).then(() => null, (x) => x);
  assert.equal(n, 5); assert.deepEqual(cho, [2000, 5000, 10000, 20000]);
  assert.equal(e.message, DT.LOI_CAU_NOI_TAT);
  let h = 0;
  const hang = (u, o) => { h++; return new Promise((_, rej) => o.signal.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError")))); };
  const eh = await DT.goiCoThuLai(() => DT.goiTroLy({ base: "https://t.example", path: "/x", body: {}, fetchImpl: hang, ms: 20 }), { noiLai: async () => {}, cho: async () => {} }).then(() => null, (x) => x);
  assert.equal(h, 1); assert.match(eh.message, /trả lời quá lâu/u);
});

test("đào tạo: địa chỉ đường hầm đổi giữa chừng → lần thử sau dùng địa chỉ mới (đọc qua API GitHub, không chờ Pages)", async () => {
  // máy nhà đổi địa chỉ sau lần gửi đầu: API trả địa chỉ mới, đường hầm cũ đã chết
  let diaChi = "https://cu.lhr.life";
  const goi = [];
  const mang = async (u, o = {}) => {
    if (u.startsWith("https://api.github.com/")) { assert.equal(o.headers.accept, "application/vnd.github.raw"); assert.equal(o.cache, "no-store"); return new Response(JSON.stringify({ url: diaChi }), { status: 200 }); }
    if (u.startsWith("https://cu.lhr.life")) { goi.push("cu"); throw new TypeError("Failed to fetch"); }
    if (u.startsWith("https://moi.lhr.life")) { goi.push("moi"); return new Response(JSON.stringify({ tra_loi: "Qua đường hầm mới." }), { status: 200 }); }
    throw new TypeError("Failed to fetch");
  };
  let base = "https://cu.lhr.life";
  diaChi = "https://moi.lhr.life";
  const j = await DT.goiCoThuLai(() => DT.goiTroLy({ base, path: "/tro_ly/tra_loi", body: {}, fetchImpl: mang }), { noiLai: async () => { base = await docDiaChiCauNoi(mang, 200); }, cho: async () => {} });
  assert.equal(j.tra_loi, "Qua đường hầm mới.");
  assert.deepEqual(goi, ["cu", "moi"]);
  // API lỗi/403 hết lượt → dùng bản Pages kèm ?t=
  const seen = [];
  const pages = async (u, o) => { seen.push(u); if (u.startsWith("https://api.github.com/")) return new Response('{"message":"API rate limit exceeded"}', { status: 403 }); return new Response(JSON.stringify({ url: "https://pages.lhr.life" }), { status: 200 }); };
  assert.equal(await docDiaChiCauNoi(pages, 200), "https://pages.lhr.life");
  assert.match(seen[1], /cau_noi\.json\?t=\d+$/);
  // cả hai hỏng → ""
  assert.equal(await docDiaChiCauNoi(async () => { throw new TypeError("x"); }, 50), "");
  // service worker không giữ cau_noi.json trong bộ nhớ đệm
  assert.match(readFileSync(join(HERE, "sw.js"), "utf8"), /cau_noi\.json"\)\) return;/);
});

test("đào tạo: gửi lại chống trùng — mỗi tin một ma_tin, gửi lại dùng đúng mã cũ; lỗi thì tin còn trong ô nhập và có nút Thử lại", () => {
  const a = DT.taoMaTin(), b = DT.taoMaTin();
  assert.ok(a && b && a !== b);
  const body = DT.yeuCauTraLoi({ kenh: "01", goi: 3, cau_con: 2, lich_su: [{ vai: "khach", noi_dung: "x", ma_tin: a }], ma_tin: a });
  assert.equal(body.ma_tin, a);
  assert.deepEqual(body.lich_su, [{ vai: "khach", noi_dung: "x" }]);
  const js = readFileSync(join(HERE, "dao-tao/dao-tao.js"), "utf8");
  assert.match(js, /data-thu-lai/);
  assert.match(js, /\$\("tin"\)\.value = m\.noi_dung/);
  assert.match(js, /lần \$\{noiLaiO\.lan\}\/\$\{noiLaiO\.tong\}/);
});

export async function run(extra = []) {
  let fail = 0;
  for (const [name, fn] of [...tests, ...extra]) {
    try {
      await fn();
      console.log(`✔ ${name}`);
    } catch (e) {
      fail++;
      console.log(`✘ ${name}\n  ${e.stack?.split("\n").slice(0, 3).join("\n  ")}`);
    }
  }
  console.log(fail ? `\n${fail} test lỗi` : `\nTất cả ${tests.length + extra.length} test đạt`);
  process.exitCode = fail ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await run();
