// Sinh boi/MAU_GIAI.md: bản giải mẫu bằng động cơ luật. Chạy: node boi/tools/mau-giai.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createSession, addPickedRound } from "../js/state.js";
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
// Mô phỏng người dùng bấm lá úp theo từng tầng rồi "Lưu" (mỗi tầng một bảng xáo riêng); vị trí lá úp không hiện cho người rút
const PICKS = [
  { tarot: [8, 37, 50, 69], lenormand: [22, 25, 27, 29] },
  { tarot: [68, 75, 36, 22], lenormand: [10, 20, 25, 21] },
  { tarot: [8, 36, 55, 71], lenormand: [11, 23, 26, 34] },
];
addPickedRound(s, PICKS, new Date("2026-10-25T00:02:00Z"));
const settings = { xungHo: "Queen Linh", thuNhap: 20, mucTieu: 30 };
const r = analyze(db, s, settings);
const md = [
  "<!-- Sinh tự động bởi boi/tools/mau-giai.mjs — không sửa tay -->",
  "> **Bản mẫu động cơ luật (không dùng AI).** Seed cố định để ai chạy lại cũng ra đúng bản này. Khi bói thật: mỗi câu hỏi một seed mới (crypto.getRandomValues), mỗi tầng xáo lại đủ 78 Tarot + 36 Lenormand, người dùng bấm lá úp (không số) cho từng tầng rồi “Lưu”; lá ra lại ở nhiều tầng là chủ đề lặp lại xuyên các tháng.",
  `> Seed mẫu: \`${SEED}\` · Giả định bối cảnh tiền: thu nhập hiện tại 20 tr/tháng, mục tiêu 30 tr/tháng.`,
  "",
  readingToMarkdown(db, s, r),
  "",
  "---",
  "",
  "## Bản AI giải theo văn phong nào",
  "",
  "Khi trạm AI trả lời được, bản giải AI dùng cùng khuôn mục như trên nhưng viết theo văn phong reader thật (tóm tắt và nguồn ở `VAN_PHONG_READER.md`; prompt ở `js/ai.js`):",
  "",
  "- Mở bài gọi người hỏi theo xưng hô, nhắc lại câu hỏi bằng lời đời thường, nói ngay cảm giác chung và kết luận sơ bộ.",
  "- Mỗi tầng là một chương: từng lá Tarot có tên lá + một chi tiết hình ảnh thật trên lá + nghĩa đúng ở vị trí; các lá nối thành một mạch chuyện; Lenormand đọc thành câu.",
  "- Nối các tầng, gọi rõ lá ra lại ở nhiều tầng là chủ đề lặp lại; rồi kết luận chung + một việc cụ thể nên làm đầu tiên.",
  "- Luôn tiếng Việt; giọng ấm, thẳng; không câu sáo rỗng kiểu AI.",
  "",
  "Ví dụ giọng văn (viết tay để minh hoạ, không phải đầu ra AI thật):",
  "",
  "> Queen Linh, bạn hỏi ba tháng tới tiền vào ra sao. Nói gọn trước: không có tháng nào sập, nhưng tiền tháng này đến từ việc bạn tự cầm lái và làm cho có quy củ, không tự rơi xuống. Tháng 11 mở bằng Cỗ Xe — người đứng thẳng trên cỗ xe đá, hai con nhân sư một đen một trắng kéo hai hướng: bạn đang muốn chạy nhanh trong khi việc còn hai đầu kéo nhau. Hoàng Đế ngay sau đó, ông vua ngồi trên ngai đá khắc đầu cừu đực, nói rằng chỉ có kỷ luật mới giữ được cỗ xe ấy. Rồi 8 Tiền: người thợ cặm cụi khắc từng đồng tiền, mấy đồng làm xong đã treo lên — tiền tháng này là tiền của tay nghề, làm đến đâu chắc đến đó. Hoàng Đế còn ra lại ở tháng 12 dù bộ bài đã xáo lại đủ 78 lá, nên chuyện kiểm soát chưa xong, nó theo bạn sang tháng sau. Việc nên làm ngay tuần này: viết ra một bảng thu–chi theo tuần và giữ đúng nó tới hết tháng 12.",
].join("\n");
writeFileSync(join(ROOT, "MAU_GIAI.md"), md);
console.log("Đã ghi MAU_GIAI.md");
