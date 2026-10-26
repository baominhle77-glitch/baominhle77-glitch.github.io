// Bản giải → Markdown (dùng cho MAU_GIAI.md, chép/tải về)
import { cardName } from "./reading.js";
import { spreadById } from "./spreads.js";

export function readingToMarkdown(db, session, reading, roundIndex = 0) {
  const round = session.rounds[roundIndex];
  const L = [];
  L.push(`# ${session.cauHoi}`);
  L.push("");
  L.push(`- Mẫu trải: ${spreadById(session.spreadId).ten}`);
  L.push(`- Mã khoá SHA-256: \`${session.hash}\` — khoá lúc ${session.lockedAtText}`);
  L.push(`- Nguồn giải: ${reading.nguon === "ai" ? `AI (${reading.model || ""})` : "động cơ luật"}`);
  L.push("");
  L.push(round.chon ? "| Tầng | Tarot | Lenormand |" : "| Tầng | Tarot (số → tên lá) | Lenormand (số → tên lá) |");
  L.push("|---|---|---|");
  reading.tang.forEach((t, ti) => {
    const tc = (round.tarot[ti] || []).map((c) => cardName(db, "tarot", c)).join("<br>") || "—";
    const lc = (round.lenormand[ti] || []).map((c) => cardName(db, "lenormand", c)).join("<br>") || "—";
    L.push(`| ${t.ten} | ${tc} | ${lc} |`);
  });
  L.push("");
  if (reading.tong_quan) L.push(reading.tong_quan, "");
  if (reading.chu_de_troi?.length) { L.push("## Chủ đề trội"); reading.chu_de_troi.forEach((x) => L.push(`- ${x}`)); L.push(""); }
  for (const t of reading.tang) {
    L.push(`## ${t.ten} — ${t.diem ?? "?"}/10${t.tra_loi ? ` · ${t.tra_loi}` : ""}`);
    if (t.tarot_doc?.length) { L.push("**Tarot theo vị trí**"); t.tarot_doc.forEach((x) => L.push(`- ${x}`)); }
    if (t.dong_chay) L.push("", `**Dòng chảy:** ${t.dong_chay}`);
    if (t.lenormand_cap?.length) { L.push("", "**Lenormand theo cặp**"); t.lenormand_cap.forEach((x) => L.push(`- ${x}`)); }
    if (t.lenormand_bo_ba?.length) { L.push("", "**Bộ ba**"); t.lenormand_bo_ba.forEach((x) => L.push(`- ${x}`)); }
    if (t.lenormand_chuoi) L.push("", `**Cả chuỗi:** ${t.lenormand_chuoi}`);
    if (t.lech) L.push("", `**Lệch giữa hai bộ:** ${t.lech}`);
    L.push("", `> **Chốt tầng:** ${t.chot}`, ">", `> **Điểm nghẽn:** ${t.diem_nghen}`, ">", `> **Lời khuyên:** ${t.loi_khuyen}`);
    (t.lap || []).forEach((x) => L.push("", `↻ ${x}`));
    (t.o_trong || []).forEach((x) => L.push("", `⚠ ${x}`));
    L.push("");
  }
  if (reading.noi_tang?.length) { L.push("## Nối các tầng"); reading.noi_tang.forEach((x) => L.push(`- ${x}`)); L.push(""); }
  if (reading.mau_thuan?.length) { L.push("## Mâu thuẫn"); reading.mau_thuan.forEach((x) => L.push(`- ${x}`)); L.push(""); }
  const m = reading._money;
  if (m && m.rows) {
    L.push("## Quy đổi tiền (triệu đồng)", "", "| Tháng | Tarot | Lenormand | Khoảng thực tế | Con số trung tâm |", "|---|---|---|---|---|");
    m.rows.forEach((r) => L.push(`| ${r.ky} | ${r.tarot} | ${r.lenormand} | ${r.low} – ${r.high} | **${r.center}** |`));
    L.push("");
  }
  if (reading.tien) L.push(reading.tien, "");
  L.push("## Tổng kết", "", reading.tong_ket, "");
  if (reading.loi_khuyen?.length) { L.push("**Lời khuyên thực tế**"); reading.loi_khuyen.forEach((x) => L.push(`- ${x}`)); L.push(""); }
  if (reading.canh_bao?.length) { L.push("**Cảnh báo**"); reading.canh_bao.forEach((x) => L.push(`- ${x}`)); L.push(""); }
  return L.join("\n");
}
