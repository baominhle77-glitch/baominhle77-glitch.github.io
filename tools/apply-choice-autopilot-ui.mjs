import { readFile, writeFile } from "node:fs/promises";

const path = "hoi-chon-dung/index.html";
const marker = "<!-- Affiliate Autopilot UI v2 -->";
let source = await readFile(path, "utf8");

if (!source.includes(marker)) {
  source = source.replace(
    '<span class="live-dot">Dữ liệu cộng đồng</span>',
    `${marker}\n            <span id="autopilotBadge" class="live-dot">Autopilot đang kiểm tra</span>`
  );

  source = source.replace(
    '<article><span>01</span><h3>Nhu cầu đi trước sản phẩm</h3><p>Hệ thống đọc hoàn cảnh, ngân sách và ưu tiên trước khi xếp hạng lựa chọn.</p></article>',
    '<article><span>01</span><h3>Công ty tự tuyển nguồn</h3><p>Autopilot tự tìm, lọc, tạo deep link và chỉ giữ sản phẩm vượt ngưỡng phù hợp, sức bán và an toàn thương hiệu.</p></article>'
  );

  source = source.replace(
    '<p>Khoản hoa hồng không làm tăng giá của bạn. Liên kết nào chưa được gắn affiliate sẽ được hiển thị là “link tham khảo”. Thông tin giá chỉ là khoảng tham khảo và có thể thay đổi tại nơi bán.</p>',
    '<p>Khoản hoa hồng không làm tăng giá của bạn. Autopilot tự tạo và xác minh liên kết tiếp thị; nếu nguồn tạm thời chưa sẵn sàng, liên kết được ghi rõ là “tham khảo”. Giá và tồn kho vẫn có thể thay đổi tại nơi bán.</p>'
  );

  source = source.replace(
    '<div><strong>Cập nhật</strong><p>Dữ liệu mẫu ngày 24/07/2026. Bình chọn và click được cập nhật qua Cloudflare Worker.</p></div>',
    '<div><strong>Autopilot</strong><p id="autopilotFooter">Công ty đang tải trạng thái tự động vận hành.</p></div>'
  );

  source = source.replace(
    '  <script type="module" src="./app.js"></script>',
    '  <script type="module" src="./app.js"></script>\n  <script type="module" src="./autopilot-ui.js"></script>'
  );
}

for (const required of ["autopilotBadge", "autopilotFooter", "./autopilot-ui.js", marker]) {
  if (!source.includes(required)) throw new Error(`Thiếu marker UI Autopilot: ${required}`);
}

await writeFile(path, source);
console.log("choice-autopilot-ui-ok: giao diện công khai đã hiển thị trạng thái công ty tự vận hành");
