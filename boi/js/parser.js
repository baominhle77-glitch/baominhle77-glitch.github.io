// Đọc chuỗi số kiểu "T: 8 37 50 69/ 68 75 36 22" và "Lenor: 22 25 27 29 / 10 20 25 21".
// "/" tách tầng; không có "/" thì chia theo số lá từng tầng của mẫu trải.

const LABEL = /(?<![\p{L}\p{N}])(tarot|lenormand|lenor|len|t|l)(?![\p{L}])\s*[:：=]?/giu;

function deckOf(label) {
  return /^t/i.test(label) ? "tarot" : "lenormand";
}

function numbersIn(text) {
  return (text.match(/\d+/g) || []).map((raw) => ({ raw, n: parseInt(raw, 10) }));
}

export function splitBySizes(nums, sizes) {
  const tiers = [];
  let i = 0;
  for (const size of sizes) {
    if (i >= nums.length) break;
    if (size <= 0) { tiers.push([]); continue; }
    tiers.push(nums.slice(i, i + size));
    i += size;
  }
  const last = sizes.length ? Math.max(1, sizes[sizes.length - 1]) : nums.length || 1;
  while (i < nums.length) {
    tiers.push(nums.slice(i, i + last));
    i += last;
  }
  return tiers;
}

function parseSegment(text, sizes) {
  const parts = text.split("/");
  if (parts.length > 1) {
    const tiers = parts.map(numbersIn);
    while (tiers.length && !tiers[tiers.length - 1].length) tiers.pop();
    return { tiers, slash: true };
  }
  const nums = numbersIn(text);
  return { tiers: splitBySizes(nums, sizes), slash: false };
}

// sizes = { tarot: [4,4,4], lenormand: [4,4,4] } theo mẫu trải; defaultDeck dùng khi không ghi nhãn
export function parseDraw(text, sizes = { tarot: [], lenormand: [] }, defaultDeck = "tarot") {
  const src = String(text || "");
  const marks = [...src.matchAll(LABEL)].filter((m) => {
    // Chỉ coi là nhãn khi ngay sau đó là số (tránh bắt chữ "l"/"t" lạc trong câu)
    const after = src.slice(m.index + m[0].length);
    return /^\s*\d/.test(after);
  });
  const result = { tarot: null, lenormand: null };
  const add = (deck, seg) => {
    const parsed = parseSegment(seg, sizes[deck] || []);
    if (!parsed.tiers.length) return;
    if (!result[deck]) result[deck] = parsed;
    else {
      result[deck].tiers.push(...parsed.tiers);
      result[deck].slash = result[deck].slash || parsed.slash;
    }
  };
  if (!marks.length) {
    add(defaultDeck, src);
    return result;
  }
  const head = src.slice(0, marks[0].index);
  if (/\d/.test(head)) add(defaultDeck, head);
  marks.forEach((m, k) => {
    const start = m.index + m[0].length;
    const end = k + 1 < marks.length ? marks[k + 1].index : src.length;
    add(deckOf(m[1]), src.slice(start, end));
  });
  return result;
}

// "Là số 04", "là số 4 và 12", "số 04" → [4] / [4, 12]; không phải câu sửa → null
export function parseCorrection(text) {
  const s = String(text || "").trim();
  if (!/^(là|la)(?![\p{L}])|(?<![\p{L}])(số|so)(?![\p{L}])/iu.test(s)) return null;
  const nums = numbersIn(s).map((x) => x.n);
  return nums.length ? nums : null;
}
