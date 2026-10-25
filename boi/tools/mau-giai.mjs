// Sinh boi/MAU_GIAI.md: bản giải mẫu bằng động cơ luật. Chạy: node boi/tools/mau-giai.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createSession, addRound } from "../js/state.js";
import { spreadById } from "../js/spreads.js";
import { analyze } from "../js/insight.js";
import { readingToMarkdown } from "../js/markdown.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const db = {
  tarot: JSON.parse(readFileSync(join(ROOT, "data/tarot.json"), "utf8")),
  lenormand: JSON.parse(readFileSync(join(ROOT, "data/lenormand.json"), "utf8")),
};
const SEED = "4d41552d4749414922626f692d7461726f742d6c656e6f726d616e642d3031";
const sp = spreadById("3thang");
const tiers = sp.tiers({ year: 2026, month: 10, day: 25 });
const s = await createSession({ cauHoi: "thu nhập 3 tháng tới", spreadId: sp.id, tiers, money: true, seed: SEED, now: new Date("2026-10-25T00:00:00Z") });
addRound(s, "T: 8 37 50 69/ 68 75 36 22/ 8 36 55 71\nLenor: 22 25 27 29 / 10 20 25 21/ 11 23 26 34", "tarot", new Date("2026-10-25T00:02:00Z"));
const settings = { xungHo: "Queen Linh", thuNhap: 20, mucTieu: 30 };
const r = analyze(db, s, settings);
const md = [
  "<!-- Sinh tự động bởi boi/tools/mau-giai.mjs — không sửa tay -->",
  "> **Bản mẫu động cơ luật (không dùng AI).** Seed cố định để ai chạy lại cũng ra đúng bản này; khi bói thật, seed ngẫu nhiên nên cùng dãy số sẽ ra lá khác.",
  `> Seed mẫu: \`${SEED}\` · Giả định bối cảnh tiền: thu nhập hiện tại 20 tr/tháng, mục tiêu 30 tr/tháng.`,
  "",
  readingToMarkdown(db, s, r),
].join("\n");
writeFileSync(join(ROOT, "MAU_GIAI.md"), md);
console.log("Đã ghi MAU_GIAI.md");
