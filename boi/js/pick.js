// Luồng chọn bài theo từng tầng — thuần dữ liệu (không DOM) để màn Chọn bài và test dùng chung.
// s.pick = { di, cur, deck, saved: [{tarot:[k…], lenormand:[k…]} | null …], draft, extra }
// k là vị trí lá úp trong lưới (1-based), không hiện cho người rút; lá thật chỉ biết khi lật.
import { MAX } from "./state.js";

const empty = () => ({ tarot: [], lenormand: [] });
const copy = (d) => ({ tarot: [...(d?.tarot || [])], lenormand: [...(d?.lenormand || [])] });

// Số lá cần cho tầng ti; lượt rút thêm thì tuỳ ý (tối đa cả bộ)
export function needOf(s, ti, extra) {
  return extra ? { ...MAX } : { tarot: s.tiers[ti]?.t || 0, lenormand: s.tiers[ti]?.l || 0 };
}
const firstDeck = (s, ti) => (s.tiers[ti]?.t ? "tarot" : "lenormand");

export function startPick(s, di, extra = false) {
  const n = s.tiers.length;
  if (!s.pick || s.pick.di !== di || s.pick.saved?.length !== n) {
    s.pick = { di, cur: 0, deck: firstDeck(s, 0), saved: Array(n).fill(null), draft: empty(), extra };
  }
  return s.pick;
}

export const pickReady = (p) => p.saved.every(Boolean) && p.cur >= p.saved.length;
export const savedCount = (p) => p.saved.filter(Boolean).length;

export function tierComplete(s, p, ti = p.cur) {
  const d = ti === p.cur ? p.draft : p.saved[ti];
  if (!d) return false;
  if (p.extra) return true;
  const nd = needOf(s, ti, false);
  return d.tarot.length === nd.tarot && d.lenormand.length === nd.lenormand;
}

// Bấm một lá úp: chọn / bỏ chọn. Đủ Tarot thì tự sang Lenormand.
export function togglePick(s, p, deck, k) {
  const nd = needOf(s, p.cur, p.extra);
  const list = p.draft[deck];
  const i = list.indexOf(k);
  if (i >= 0) { list.splice(i, 1); return { ok: true, picked: false }; }
  if (!Number.isInteger(k) || k < 1 || k > MAX[deck]) return { ok: false, reason: "range" };
  if (list.length >= nd[deck]) return { ok: false, reason: "full", need: nd[deck] };
  list.push(k);
  let switched = false;
  if (!p.extra && deck === "tarot" && list.length === nd.tarot && nd.lenormand && p.draft.lenormand.length < nd.lenormand) {
    p.deck = "lenormand";
    switched = true;
  }
  return { ok: true, picked: true, switched };
}

// "Lưu": cất tầng hiện tại, chuyển sang tầng chưa lưu kế tiếp với bộ bài mới (nháp trống). next = -1 khi đã đủ.
export function saveTier(s, p) {
  if (!tierComplete(s, p)) return { ok: false, need: needOf(s, p.cur, p.extra) };
  p.saved[p.cur] = copy(p.draft);
  const next = p.saved.findIndex((x) => !x);
  p.cur = next < 0 ? p.saved.length : next;
  p.draft = empty();
  p.deck = next < 0 ? "tarot" : firstDeck(s, next);
  return { ok: true, next };
}

// Xem lại / sửa một tầng đã lưu trước khi giải: đưa lá đã chọn của tầng đó về nháp
export function editTier(s, p, i) {
  if (!p.saved[i]) return false;
  if (p.cur < p.saved.length && p.cur !== i && tierComplete(s, p)) p.saved[p.cur] = copy(p.draft);
  p.cur = i;
  p.draft = copy(p.saved[i]);
  p.saved[i] = null;
  p.deck = firstDeck(s, i);
  return true;
}
