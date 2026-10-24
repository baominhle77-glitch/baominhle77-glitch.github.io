// Mỗi câu hỏi = một state: seed + bảng ánh xạ cố định + các lượt rút. Lượt rút thêm dùng lại đúng state.
import { newSeed, buildMapping, commitHash, gmt7, verifyLock } from "./core.js";
import { parseDraw, parseCorrection } from "./parser.js";

export const MAX = { tarot: 78, lenormand: 36 };
const STORE_KEY = "boi.v1.sessions";

export async function createSession({ cauHoi, spreadId, tiers, money, reversals, nam = null, seed = newSeed(), now = new Date() }) {
  const mapping = await buildMapping(seed, !!reversals);
  const hash = await commitHash(seed, mapping);
  return {
    v: 1,
    id: "q" + now.getTime().toString(36) + seed.slice(0, 6),
    cauHoi: String(cauHoi || "").trim(),
    spreadId, tiers, money: !!money, reversals: !!reversals, nam,
    seed, hash, mapping,
    lockedAt: now.toISOString(), lockedAtText: gmt7(now),
    rounds: [], revealed: false, verify: null,
  };
}

export function sizesOf(session) {
  return { tarot: session.tiers.map((t) => t.t), lenormand: session.tiers.map((t) => t.l) };
}

function makeCell(session, deck, raw, n) {
  if (!Number.isInteger(n) || n < 1 || n > MAX[deck]) return { raw, n, ok: false };
  if (deck === "tarot") {
    const rev = session.mapping.tarotRev ? !!session.mapping.tarotRev[n - 1] : false;
    return { raw, n, ok: true, card: session.mapping.tarot[n - 1], rev };
  }
  return { raw, n, ok: true, card: session.mapping.lenormand[n - 1] };
}

// Đánh dấu lá lặp theo thứ tự rút trong toàn bộ câu hỏi
export function markRepeats(session) {
  const seen = { tarot: new Map(), lenormand: new Map() };
  for (const [ri, round] of session.rounds.entries()) {
    for (const deck of ["tarot", "lenormand"]) {
      for (const [ti, tier] of (round[deck] || []).entries()) {
        for (const [ci, cell] of tier.entries()) {
          cell.repeatOf = null;
          if (!cell.ok) continue;
          const where = seen[deck].get(cell.n);
          if (where) cell.repeatOf = where;
          else seen[deck].set(cell.n, { round: ri + 1, tier: ti + 1, pos: ci + 1 });
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

// Thêm một lượt rút từ chuỗi người dùng gõ. Số ngoài khoảng giữ nguyên là ô lỗi, không tự thay.
export function addRound(session, text, defaultDeck = "tarot", now = new Date()) {
  const parsed = parseDraw(text, sizesOf(session), defaultDeck);
  if (!parsed.tarot && !parsed.lenormand) throw new Error("Không đọc được số nào.");
  const round = { at: now.toISOString(), atText: gmt7(now), input: String(text), slash: {}, tarot: [], lenormand: [] };
  for (const deck of ["tarot", "lenormand"]) {
    if (!parsed[deck]) continue;
    round.slash[deck] = parsed[deck].slash;
    round[deck] = parsed[deck].tiers.map((tier) => tier.map(({ raw, n }) => makeCell(session, deck, raw, n)));
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
  const next = makeCell(session, deck, String(n).padStart(2, "0"), n);
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

export async function reveal(session) {
  session.verify = await verifyLock(session);
  session.revealed = true;
  return session.verify;
}

// ---- Lưu trữ (localStorage hoặc kho giả lập khi test) ----
export function loadSessions(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(STORE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (_) {
    return [];
  }
}
export function saveSessions(list, storage = globalThis.localStorage) {
  try {
    storage?.setItem(STORE_KEY, JSON.stringify(list));
    return true;
  } catch (_) {
    return false;
  }
}

export function exportJSON(list) {
  return JSON.stringify({ app: "boi-tarot-lenormand", v: 1, exportedAt: new Date().toISOString(), sessions: list }, null, 1);
}

// Gộp theo id; không ghi đè state đã có (ánh xạ không bao giờ bị thay)
export function importJSON(text, existing) {
  const data = JSON.parse(text);
  const incoming = Array.isArray(data) ? data : data.sessions;
  if (!Array.isArray(incoming)) throw new Error("Tệp không đúng định dạng.");
  const ids = new Set(existing.map((s) => s.id));
  let added = 0;
  for (const s of incoming) {
    if (!s || !s.id || !s.seed || !s.mapping || !s.hash || ids.has(s.id)) continue;
    existing.push(s);
    ids.add(s.id);
    added++;
  }
  return added;
}
