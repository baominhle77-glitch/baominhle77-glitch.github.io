// Xáo bài công bằng kiểu commit–reveal.
// seed 32 byte ngẫu nhiên → PRNG = SHA-256(seed ‖ nhãn ‖ bộ đếm 32 bit) → Fisher–Yates.
// Mã khoá = SHA-256(seedHex + "|" + bảng ánh xạ chuẩn hoá), hiện ngay khi khoá; seed chỉ công khai sau khi trải.

const enc = new TextEncoder();
const subtle = () => globalThis.crypto.subtle;

export const toHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
export function fromHex(hex) {
  if (!/^[0-9a-f]*$/i.test(hex) || hex.length % 2) throw new Error("seed không hợp lệ");
  return Uint8Array.from(hex.match(/../g) || [], (h) => parseInt(h, 16));
}

export async function sha256(data) {
  const bytes = typeof data === "string" ? enc.encode(data) : data;
  return new Uint8Array(await subtle().digest("SHA-256", bytes));
}
export const sha256Hex = async (data) => toHex(await sha256(data));

export function newSeed() {
  const s = new Uint8Array(32);
  globalThis.crypto.getRandomValues(s);
  return toHex(s);
}

// Dòng số ngẫu nhiên tất định theo seed + nhãn (mỗi bộ bài một nhãn riêng → độc lập)
export function makeRng(seedHex, label) {
  const seed = fromHex(seedHex);
  const lab = enc.encode(label);
  let counter = 0;
  const buf = [];
  async function refill() {
    const msg = new Uint8Array(seed.length + lab.length + 4);
    msg.set(seed, 0);
    msg.set(lab, seed.length);
    new DataView(msg.buffer).setUint32(seed.length + lab.length, counter++);
    const h = await sha256(msg);
    const dv = new DataView(h.buffer);
    for (let i = 0; i < 8; i++) buf.push(dv.getUint32(i * 4));
  }
  async function u32() {
    if (!buf.length) await refill();
    return buf.shift();
  }
  // Số nguyên đều trong [0, n) — loại bỏ phần dư để không lệch
  async function int(n) {
    const limit = Math.floor(0x100000000 / n) * n;
    for (;;) {
      const x = await u32();
      if (x < limit) return x % n;
    }
  }
  return { u32, int };
}

export async function shuffle(n, rng) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = await rng.int(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Bảng ánh xạ: số k (1-based) → lá. tarot[k-1] = id lá 0..77; lenormand[k-1] = số lá 1..36
// tiers = 0 → bản cũ (v1): một bảng dùng chung mọi tầng.
// tiers ≥ 1 → v2: mỗi tầng một lần xáo Fisher–Yates riêng từ đủ 78 + 36 lá (nhãn "tarot#2", "lenormand#2"…),
// nên một lá có thể ra lại ở tầng khác — đó là rút độc lập, không phải số trùng.
async function deckOnce(seedHex, reversals, suffix) {
  const tarot = await shuffle(78, makeRng(seedHex, "tarot" + suffix));
  const lenormand = (await shuffle(36, makeRng(seedHex, "lenormand" + suffix))).map((i) => i + 1);
  let tarotRev = null;
  if (reversals) {
    const r = makeRng(seedHex, "tarot-nguoc" + suffix);
    tarotRev = [];
    for (let i = 0; i < 78; i++) tarotRev.push((await r.u32()) & 1);
  }
  return { tarot, tarotRev, lenormand };
}
export async function buildMapping(seedHex, reversals, tiers = 0) {
  if (!tiers) return deckOnce(seedHex, reversals, "");
  const tang = [];
  for (let i = 0; i < tiers; i++) tang.push(await deckOnce(seedHex, reversals, `#${i + 1}`));
  return { v: 2, tang };
}

const one = (m) => ({ tarot: m.tarot, tarotRev: m.tarotRev, lenormand: m.lenormand });
export const canonical = (m) => (m.v === 2
  ? JSON.stringify({ v: 2, tang: m.tang.map(one) })
  : JSON.stringify({ v: 1, ...one(m) }));
export const commitHash = (seedHex, mapping) => sha256Hex(seedHex + "|" + canonical(mapping));

// Tính lại từ seed: bảng ánh xạ có trùng và mã khoá có khớp không
export async function verifyLock({ seed, reversals, mapping, hash }) {
  const rebuilt = await buildMapping(seed, reversals, mapping.v === 2 ? mapping.tang.length : 0);
  const recomputed = await commitHash(seed, rebuilt);
  return {
    mappingOk: canonical(rebuilt) === canonical(mapping),
    hashOk: recomputed === hash,
    recomputed,
  };
}

// Giờ Hà Nội (GMT+7), không phụ thuộc múi giờ máy
export function gmt7(date = new Date()) {
  const d = new Date(date.getTime() + 7 * 3600 * 1000);
  const p = (x) => String(x).padStart(2, "0");
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} (GMT+7)`;
}
export function gmt7Parts(date = new Date()) {
  const d = new Date(date.getTime() + 7 * 3600 * 1000);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}
