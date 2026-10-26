// Mỗi câu hỏi = một state. Mỗi lượt rút (trải chính và mỗi lần "Rút thêm") có seed 32 byte riêng lấy từ
// crypto.getRandomValues, và mỗi tầng của lượt đó xáo Fisher–Yates riêng từ đủ 78 + 36 lá.
// Bảng ánh xạ chỉ nằm trong bộ nhớ (tính lại từ seed khi cần); localStorage chỉ giữ seed + mã khoá để kiểm chứng.
import { newSeed, buildMapping, commitHash, gmt7 } from "./core.js";
import { parseDraw, parseCorrection } from "./parser.js";

export const MAX = { tarot: 78, lenormand: 36 };
const STORE_KEY = "boi.v1.sessions";

// (seed, kiểu, số tầng) → bảng ánh xạ; không bao giờ ghi xuống ổ
const tables = new Map();
const tkey = (d, reversals) => `${d.seed}|${d.kieu === 2 ? d.tang : 0}|${reversals ? 1 : 0}`;

async function lockDraw(seed, reversals, nTiers, now) {
  const mapping = await buildMapping(seed, reversals, nTiers);
  const hash = await commitHash(seed, mapping);
  const d = { seed, hash, kieu: 2, tang: nTiers, at: now.toISOString(), atText: gmt7(now) };
  tables.set(tkey(d, reversals), mapping);
  return d;
}

export async function createSession({ cauHoi, spreadId, tiers, money, reversals, nam = null, seed = newSeed(), now = new Date() }) {
  const draw = await lockDraw(seed, !!reversals, Math.max(1, tiers.length), now);
  return {
    v: 2,
    id: "q" + now.getTime().toString(36) + seed.slice(0, 6),
    cauHoi: String(cauHoi || "").trim(),
    spreadId, tiers, money: !!money, reversals: !!reversals, nam,
    seed, hash: draw.hash, draws: [draw],
    lockedAt: now.toISOString(), lockedAtText: gmt7(now),
    rounds: [], revealed: false, verify: null,
  };
}

// Phiên bản cũ (v1): một bảng chung, từng lưu nguyên bảng vào máy → chỉ giữ seed (bảng v1 tính lại được), xoá bảng
export function normalizeSession(s) {
  if (!s || s.draft) return s;
  if (!Array.isArray(s.draws) && s.seed) s.draws = [{ seed: s.seed, hash: s.hash, kieu: 1, at: s.lockedAt, atText: s.lockedAtText }];
  delete s.mapping;
  return s;
}
export const drawsOf = (s) => normalizeSession(s).draws || [];
const drawIndexOf = (round) => round.draw ?? 0;
// Lượt rút đã khoá nhưng chưa dùng (đang chờ người chọn lá); -1 nếu không có
export function pendingDraw(s) {
  const used = new Set(s.rounds.map(drawIndexOf));
  return drawsOf(s).findIndex((_, i) => !used.has(i));
}
// "Rút thêm": xáo một bộ mới hoàn toàn (seed mới), không dùng lại bảng cũ
export async function newDraw(s, { seed = newSeed(), now = new Date() } = {}) {
  const p = pendingDraw(s);
  if (p >= 0) return p;
  s.draws.push(await lockDraw(seed, s.reversals, Math.max(1, s.tiers.length), now));
  return s.draws.length - 1;
}
// Bảo đảm bảng của một lượt có trong bộ nhớ (sau khi tải lại trang thì tính lại từ seed)
export async function ensureMapping(s, di = 0) {
  const d = drawsOf(s)[di];
  if (!d) throw new Error("Không có lượt rút này.");
  const k = tkey(d, s.reversals);
  if (!tables.has(k)) tables.set(k, await buildMapping(d.seed, s.reversals, d.kieu === 2 ? d.tang : 0));
  return tables.get(k);
}
export const mappingOf = ensureMapping;
// Trải chính xáo riêng từng tầng (phiên mới) hay dùng một bảng chung (phiên cũ)
export const isFresh = (s) => drawsOf(s)[0]?.kieu === 2;
function tableFor(s, di, ti) {
  const d = drawsOf(s)[di];
  const m = d && tables.get(tkey(d, s.reversals));
  if (!m) throw new Error("Bộ bài chưa xáo xong — thử lại sau một giây.");
  return m.v === 2 ? m.tang[Math.min(ti, m.tang.length - 1)] : m;
}

export function sizesOf(session) {
  return { tarot: session.tiers.map((t) => t.t), lenormand: session.tiers.map((t) => t.l) };
}

function makeCell(session, deck, raw, n, di, ti) {
  if (!Number.isInteger(n) || n < 1 || n > MAX[deck]) return { raw, n, ok: false };
  const m = tableFor(session, di, ti);
  if (deck === "tarot") {
    const rev = m.tarotRev ? !!m.tarotRev[n - 1] : false;
    return { raw, n, ok: true, card: m.tarot[n - 1], rev };
  }
  return { raw, n, ok: true, card: m.lenormand[n - 1] };
}

// Đánh dấu lá ra lại theo thứ tự rút trong toàn bộ câu hỏi (theo lá, không theo số).
// doclap = lượt này xáo riêng từng tầng (v2) → lá ra lại là rút độc lập, tức chủ đề lặp lại xuyên các tầng.
export function markRepeats(session) {
  const seen = { tarot: new Map(), lenormand: new Map() };
  const draws = drawsOf(session);
  for (const [ri, round] of session.rounds.entries()) {
    const doclap = draws[drawIndexOf(round)]?.kieu === 2;
    for (const deck of ["tarot", "lenormand"]) {
      for (const [ti, tier] of (round[deck] || []).entries()) {
        for (const [ci, cell] of tier.entries()) {
          cell.repeatOf = null;
          if (!cell.ok) continue;
          const where = seen[deck].get(cell.card);
          if (where) cell.repeatOf = { ...where, doclap };
          else seen[deck].set(cell.card, { round: ri + 1, tier: ti + 1, pos: ci + 1 });
        }
      }
    }
  }
}

export function errorsOf(round) {
  const out = [];
  for (const deck of ["tarot", "lenormand"]) {
    (round[deck] || []).forEach((tier, ti) => tier.forEach((cell, ci) => {
      if (!cell.ok) out.push({ deck, tier: ti, idx: ci, n: cell.n, raw: cell.raw });
    }));
  }
  return out;
}

function pendingOrThrow(session) {
  const di = pendingDraw(session);
  if (di < 0) throw new Error("Lượt rút này đã dùng — bấm “Rút thêm” để xáo bộ mới.");
  return di;
}

// Thêm một lượt rút từ chuỗi người dùng gõ (dùng bộ đang chờ). Số ngoài khoảng giữ nguyên là ô lỗi, không tự thay.
export function addRound(session, text, defaultDeck = "tarot", now = new Date()) {
  const di = pendingOrThrow(session);
  const parsed = parseDraw(text, sizesOf(session), defaultDeck);
  if (!parsed.tarot && !parsed.lenormand) throw new Error("Không đọc được số nào.");
  const round = { at: now.toISOString(), atText: gmt7(now), draw: di, input: String(text), slash: {}, tarot: [], lenormand: [] };
  for (const deck of ["tarot", "lenormand"]) {
    if (!parsed[deck]) continue;
    round.slash[deck] = parsed[deck].slash;
    round[deck] = parsed[deck].tiers.map((tier, ti) => tier.map(({ raw, n }) => makeCell(session, deck, raw, n, di, ti)));
  }
  session.rounds.push(round);
  markRepeats(session);
  return { round, errors: errorsOf(round) };
}

// Thêm lượt rút từ các lá úp người dùng bấm theo từng tầng: picks[ti] = {tarot:[vị trí 1-based], lenormand:[…]}.
// Vị trí chỉ là chỗ của lá úp trong lưới, không hiện ra cho người rút.
export function addPickedRound(session, picks, now = new Date()) {
  const di = pendingOrThrow(session);
  const round = { at: now.toISOString(), atText: gmt7(now), draw: di, input: "", chon: true, slash: {}, tarot: [], lenormand: [] };
  let last = -1;
  picks.forEach((p, ti) => { if ((p?.tarot?.length || 0) + (p?.lenormand?.length || 0)) last = ti; });
  if (last < 0) throw new Error("Chưa chọn lá nào.");
  for (const deck of ["tarot", "lenormand"]) {
    const tiers = picks.slice(0, last + 1).map((p, ti) => (p?.[deck] || []).map((n) => ({ ...makeCell(session, deck, String(n), n, di, ti), chon: true })));
    round[deck] = tiers.some((t) => t.length) ? tiers : [];
  }
  session.rounds.push(round);
  markRepeats(session);
  return { round, errors: errorsOf(round) };
}

// Thay đúng một ô lỗi
export function fixCell(session, roundIndex, deck, tier, idx, n) {
  const round = session.rounds[roundIndex];
  const cell = round?.[deck]?.[tier]?.[idx];
  if (!cell) throw new Error("Không có ô này.");
  if (cell.ok) throw new Error("Ô này đã có lá hợp lệ.");
  const next = makeCell(session, deck, String(n).padStart(2, "0"), n, drawIndexOf(round), tier);
  if (!next.ok) return { ok: false, max: MAX[deck] };
  next.fixedFrom = cell.raw;
  round[deck][tier][idx] = next;
  markRepeats(session);
  return { ok: true, cell: next };
}

// "Là số 04" → lấp lần lượt các ô lỗi của lượt gần nhất
export function applyCorrectionText(session, text) {
  const nums = parseCorrection(text);
  if (!nums) return null;
  const ri = session.rounds.length - 1;
  const errs = ri >= 0 ? errorsOf(session.rounds[ri]) : [];
  const filled = [], rejected = [];
  let k = 0;
  for (const n of nums) {
    const e = errs[k];
    if (!e) break;
    const r = fixCell(session, ri, e.deck, e.tier, e.idx, n);
    if (r.ok) { filled.push({ ...e, to: n }); k++; } else rejected.push({ ...e, to: n });
  }
  return { filled, rejected, remaining: errorsOf(session.rounds[ri]) };
}

// Công khai seed: tính lại từng lượt rút từ seed, so mã khoá và so từng lá đã lật với bảng tính lại
export async function reveal(session) {
  const draws = drawsOf(session);
  const out = [];
  for (const [di, d] of draws.entries()) {
    const used = session.rounds.filter((r) => drawIndexOf(r) === di);
    if (!used.length && di > 0) continue;
    const m = await buildMapping(d.seed, session.reversals, d.kieu === 2 ? d.tang : 0);
    const recomputed = await commitHash(d.seed, m);
    tables.set(tkey(d, session.reversals), m);
    let cellsOk = true;
    for (const r of used) for (const deck of ["tarot", "lenormand"]) (r[deck] || []).forEach((tier, ti) => tier.forEach((c) => {
      if (!c.ok) return;
      const t = m.v === 2 ? m.tang[Math.min(ti, m.tang.length - 1)] : m;
      if (t[deck][c.n - 1] !== c.card || (deck === "tarot" && !!(t.tarotRev?.[c.n - 1]) !== !!c.rev)) cellsOk = false;
    }));
    out.push({ di, seed: d.seed, hash: d.hash, recomputed, hashOk: recomputed === d.hash, cellsOk, kieu: d.kieu });
  }
  session.verify = { hashOk: out.every((x) => x.hashOk), mappingOk: out.every((x) => x.cellsOk), recomputed: out[0]?.recomputed, draws: out };
  session.revealed = true;
  return session.verify;
}

// ---- Lưu trữ (localStorage hoặc kho giả lập khi test) ----
export function loadSessions(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(STORE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.map(normalizeSession) : [];
  } catch (_) {
    return [];
  }
}
export function saveSessions(list, storage = globalThis.localStorage) {
  try {
    storage?.setItem(STORE_KEY, JSON.stringify(list, noTable));
    return true;
  } catch (_) {
    return false;
  }
}

// Không bao giờ ghi bảng ánh xạ ra ổ/tệp — seed đủ để kiểm chứng
const noTable = (k, v) => (k === "mapping" ? undefined : v);
export function exportJSON(list) {
  return JSON.stringify({ app: "boi-tarot-lenormand", v: 2, exportedAt: new Date().toISOString(), sessions: list }, noTable, 1);
}

// Gộp theo id; không ghi đè state đã có
export function importJSON(text, existing) {
  const data = JSON.parse(text);
  const incoming = Array.isArray(data) ? data : data.sessions;
  if (!Array.isArray(incoming)) throw new Error("Tệp không đúng định dạng.");
  const ids = new Set(existing.map((s) => s.id));
  let added = 0;
  for (const s of incoming) {
    if (!s || !s.id || !s.seed || !s.hash || !(s.mapping || Array.isArray(s.draws)) || ids.has(s.id)) continue;
    existing.push(normalizeSession(s));
    ids.add(s.id);
    added++;
  }
  return added;
}
