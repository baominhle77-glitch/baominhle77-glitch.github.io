// Kho tri thức giải offline: gắn thêm nghĩa theo chủ đề (tình, việc, sức khoẻ, vận hạn, lá ngược, Có/Không)
// và nghĩa 1260 cặp Lenormand vào bộ bài gốc. Thiếu tệp thì bộ giải vẫn chạy bằng dữ liệu gốc.
export function mergeKnowledge(db, tarotThem, lenThem) {
  for (const x of tarotThem?.la || []) { const c = db.tarot.la[x.id]; if (c) c.tri = x; }
  for (const x of lenThem?.la || []) { const c = db.lenormand.la[x.id - 1]; if (c) c.tri = x; }
  db.lenormand.capDay = lenThem?.cap || {};
  return db;
}

const TINH_NGUOI = /người kia|đối phương|người ấy|anh ấy|cô ấy|họ nghĩ|suy nghĩ của/iu;

// Một câu nghĩa của lá Tarot theo chủ đề câu hỏi; null nếu không có tri thức phù hợp (giữ cách đọc cũ).
export function tarotMeaning(card, rev, topic, pos = "") {
  const t = card?.tri;
  if (!t) return null;
  if (rev) {
    const n = t.nguoc || {};
    return (topic === "tien" ? n.tien : topic === "tinh" ? n.tinh : topic === "viec" ? n.viec : null) || n.chung || null;
  }
  if (topic === "tinh") return TINH_NGUOI.test(pos) ? t.doi_phuong || t.tinh : t.tinh;
  if (topic === "viec") return t.viec;
  if (topic === "suckhoe") return t.suc_khoe;
  if (topic === "vanhan") return t.van_han;
  if (topic === "tien") return null;
  return t.chung;
}

// Nghĩa Lenormand một lá theo chủ đề
export function lenMeaning(card, topic) {
  const t = card?.tri;
  if (!t) return null;
  return { tinh: t.tinh, viec: t.viec, suckhoe: t.suc_khoe, vanhan: t.van_han }[topic] || t.chung;
}

// Nghĩa cặp Lenormand theo chủ đề: v = việc/tiền, t = tình cảm, c = chung
export function capMeaning(db, a, b, topic, money) {
  const x = db.lenormand.capDay?.[`${a.en}+${b.en}`];
  if (!x) return null;
  return (money || topic === "tien" || topic === "viec" ? x.v : topic === "tinh" ? x.t : x.c) || x.c || null;
}
