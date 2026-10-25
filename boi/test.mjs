// Chạy: node boi/test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildMapping, commitHash, verifyLock, makeRng, shuffle, gmt7 } from "./js/core.js";
import { parseDraw, parseCorrection, splitBySizes } from "./js/parser.js";
import { createSession, addRound, applyCorrectionText, fixCell, errorsOf, reveal, exportJSON, importJSON, loadSessions, saveSessions } from "./js/state.js";
import { spreadById, SPREADS } from "./js/spreads.js";
import { moneyTable, periodEstimate, roundNice } from "./js/money.js";
import { analyze, allSentences, ruleFollowUp } from "./js/insight.js";
import { suggestSpread } from "./js/topic.js";
import { streamWithFallback, partialJSON, normalizeReading, readingRequest, SYSTEM_READING } from "./js/ai.js";

const HERE = dirname(fileURLToPath(import.meta.url));
export const db = {
  tarot: JSON.parse(readFileSync(join(HERE, "data/tarot.json"), "utf8")),
  lenormand: JSON.parse(readFileSync(join(HERE, "data/lenormand.json"), "utf8")),
};

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

test("state: số 40 lỗi để trống đúng ô, 'Là số 04' chỉ thay ô đó; lá lặp", async () => {
  const s = await demoSession();
  const { round, errors } = addRound(s, `${T_IN}\n${L_IN.replace("34", "40")}`);
  assert.equal(errors.length, 1);
  assert.deepEqual([errors[0].deck, errors[0].tier, errors[0].idx, errors[0].n], ["lenormand", 2, 3, 40]);
  const before = JSON.stringify(round.lenormand[2].slice(0, 3));
  assert.equal(round.lenormand[2].filter((c) => c.ok).length, 3, "các số hợp lệ vẫn lật");
  // số lặp: Tarot 8 ở tầng 1 và tầng 3, cùng một lá
  assert.equal(round.tarot[2][0].card, round.tarot[0][0].card);
  assert.deepEqual(round.tarot[2][0].repeatOf, { round: 1, tier: 1, pos: 1 });
  assert.equal(round.lenormand[1][2].card, round.lenormand[0][1].card, "Lenormand 25 lặp");
  const fix = applyCorrectionText(s, "Là số 04");
  assert.equal(fix.filled.length, 1);
  assert.equal(round.lenormand[2][3].n, 4);
  assert.equal(round.lenormand[2][3].card, s.mapping.lenormand[3]);
  assert.equal(round.lenormand[2][3].fixedFrom, "40");
  assert.equal(JSON.stringify(round.lenormand[2].slice(0, 3)), before, "không đụng ô khác");
  assert.equal(errorsOf(round).length, 0);
  // số thay vẫn sai → giữ ô trống
  addRound(s, "L: 99");
  assert.equal(fixCell(s, 1, "lenormand", 0, 0, 37).ok, false);
  assert.equal(errorsOf(s.rounds[1]).length, 1);
  // rút thêm cùng state: số cũ → lá cũ
  addRound(s, "T: 37");
  assert.equal(s.rounds[2].tarot[0][0].card, round.tarot[0][1].card);
  assert.ok(s.rounds[2].tarot[0][0].repeatOf);
  const v = await reveal(s);
  assert.ok(v.hashOk && v.mappingOk);
});

test("lưu/xuất/nhập JSON không mất ánh xạ, không ghi đè", async () => {
  const s = await demoSession();
  addRound(s, T_IN);
  const mem = new Map();
  const fake = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  assert.ok(saveSessions([s], fake));
  const back = loadSessions(fake);
  assert.deepEqual(back[0].mapping, s.mapping);
  const list = [];
  assert.equal(importJSON(exportJSON([s]), list), 1);
  assert.equal(importJSON(exportJSON([s]), list), 0, "trùng id thì bỏ qua");
  assert.equal((await verifyLock(list[0])).hashOk, true);
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
  assert.ok(!JSON.stringify(mem.get("boi.v1.models")).includes("KHOA"), "không lưu khoá vào bộ nhớ model");
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
