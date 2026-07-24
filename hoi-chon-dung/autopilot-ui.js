const API_BASE = "https://hiennhi89-gate.hiennhi89.workers.dev";

const badge = document.getElementById("autopilotBadge");
const footer = document.getElementById("autopilotFooter");

function localTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function render(status) {
  if (!badge || !footer) return;
  if (status.mode === "active") {
    const updated = localTime(status.last_run_at);
    badge.textContent = `Autopilot · ${status.selected_products || status.catalog_products || 0} sản phẩm`;
    badge.title = updated ? `Công ty tự kiểm tra lần cuối lúc ${updated}` : "Công ty tự kiểm tra theo lịch";
    footer.textContent = `Công ty tự tuyển sản phẩm, xác minh link và cập nhật khoảng 6 giờ/lần${updated ? `; lần gần nhất ${updated}` : ""}.`;
    return;
  }
  if (status.mode === "onboarding_required") {
    badge.textContent = "Autopilot đang kết nối nguồn";
    badge.title = "Công ty đang hoàn tất kết nối mạng affiliate một lần";
    footer.textContent = "Hệ thống đang ở chế độ dự phòng trong khi công ty hoàn tất kết nối nguồn affiliate; chủ sở hữu không phải chọn sản phẩm hay gắn từng link.";
    return;
  }
  if (status.mode === "error") {
    badge.textContent = "Autopilot đang tự thử lại";
    badge.title = "Lỗi nguồn dữ liệu không làm lộ thông tin người dùng";
    footer.textContent = "Autopilot phát hiện lỗi nguồn và đang tự thử lại; catalog gần nhất vẫn được giữ để tránh gián đoạn.";
    return;
  }
  badge.textContent = "Autopilot đang khởi động";
  footer.textContent = "Công ty tự động nghiên cứu, tuyển sản phẩm, tạo link và tối ưu; trạng thái sẽ cập nhật sau vòng chạy đầu.";
}

async function loadStatus() {
  try {
    const response = await fetch(`${API_BASE}/api/choice/autopilot/status`, {
      headers: { accept: "application/json" }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    render(await response.json());
  } catch (_) {
    if (badge) badge.textContent = "Autopilot hoạt động nền";
    if (footer) footer.textContent = "Catalog gần nhất vẫn hoạt động khi dịch vụ trạng thái tạm thời không phản hồi.";
  }
}

loadStatus();
