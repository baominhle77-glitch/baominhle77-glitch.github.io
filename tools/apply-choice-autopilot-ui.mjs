import { readFile, writeFile } from "node:fs/promises";

const path = "hoi-chon-dung/index.html";
const marker = "<!-- Public audience boundary v3 -->";
let source = await readFile(path, "utf8");

source = source
  .replace(/\s*<!-- Affiliate Autopilot UI v2 -->\s*/g, "\n")
  .replace(/<span id="autopilotBadge" class="live-dot">[\s\S]*?<\/span>/g, '<span class="live-dot">Dữ liệu cộng đồng</span>')
  .replace(/<article><span>01<\/span><h3>Công ty tự tuyển nguồn<\/h3><p>[\s\S]*?<\/p><\/article>/g,
    '<article><span>01</span><h3>Nhu cầu đi trước sản phẩm</h3><p>Hoàn cảnh sử dụng, ngân sách và ưu tiên của bạn được xem xét trước khi xếp hạng lựa chọn.</p></article>')
  .replace(/<article><span>01<\/span><h3>Nhu cầu đi trước sản phẩm<\/h3><p>[\s\S]*?<\/p><\/article>/g,
    '<article><span>01</span><h3>Nhu cầu đi trước sản phẩm</h3><p>Hoàn cảnh sử dụng, ngân sách và ưu tiên của bạn được xem xét trước khi xếp hạng lựa chọn.</p></article>')
  .replace(/<article><span>03<\/span><h3>Click được theo dõi, danh tính không bị bán<\/h3><p>[\s\S]*?<\/p><\/article>/g,
    '<article><span>03</span><h3>Tôn trọng quyền riêng tư</h3><p>Dữ liệu được dùng để cải thiện gợi ý; chúng tôi không bán thông tin nhận dạng cá nhân của bạn.</p></article>')
  .replace(/<p>Khoản hoa hồng không làm tăng giá của bạn\. Autopilot[\s\S]*?<\/p>/g,
    '<p>Khoản hoa hồng không làm tăng giá của bạn. Giá, tồn kho và chính sách bán hàng có thể thay đổi; hãy kiểm tra thông tin cuối cùng tại nơi bán trước khi đặt hàng.</p>')
  .replace(/<p>Khoản hoa hồng không làm tăng giá của bạn\. Liên kết nào chưa được gắn affiliate[\s\S]*?<\/p>/g,
    '<p>Khoản hoa hồng không làm tăng giá của bạn. Giá, tồn kho và chính sách bán hàng có thể thay đổi; hãy kiểm tra thông tin cuối cùng tại nơi bán trước khi đặt hàng.</p>')
  .replace(/<div><strong>Autopilot<\/strong><p id="autopilotFooter">[\s\S]*?<\/p><\/div>/g,
    '<div><strong>Trước khi mua</strong><p>Đối chiếu thông số, khả năng tương thích, bảo hành, đổi trả và tổng giá tại nơi bán.</p></div>')
  .replace(/<div><strong>Cập nhật<\/strong><p>Dữ liệu mẫu ngày 24\/07\/2026\. Bình chọn và click được cập nhật qua Cloudflare Worker\.<\/p><\/div>/g,
    '<div><strong>Trước khi mua</strong><p>Đối chiếu thông số, khả năng tương thích, bảo hành, đổi trả và tổng giá tại nơi bán.</p></div>')
  .replace(/\n\s*<script type="module" src="\.\/autopilot-ui\.js"><\/script>/g, "")
  .replace(/\n?<!-- Public audience boundary v3 -->\n?/g, "\n");

source = source.replace("<body>", `<body>\n  ${marker}`);

for (const forbidden of [
  "autopilotBadge", "autopilotFooter", "./autopilot-ui.js", "Affiliate Autopilot UI v2",
  "chủ sở hữu", "onboarding_required", "Cloudflare Worker", "Công ty tự tuyển nguồn"
]) {
  if (source.toLowerCase().includes(forbidden.toLowerCase())) {
    throw new Error(`Public UI còn nội dung nội bộ bị cấm: ${forbidden}`);
  }
}

for (const required of ["Trước khi mua", "Tôn trọng quyền riêng tư", marker]) {
  if (!source.includes(required)) throw new Error(`Thiếu nội dung public cần thiết: ${required}`);
}

await writeFile(path, source);
console.log("choice-public-ui-ok: đã loại nội dung owner/internal và giữ thông tin hữu ích cho người dùng");
