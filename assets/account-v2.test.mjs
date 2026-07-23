import assert from "node:assert/strict";
import fs from "node:fs";

const gate = fs.readFileSync(new URL("./gate.js", import.meta.url), "utf8");
const gateCss = fs.readFileSync(new URL("./gate.css", import.meta.url), "utf8");
const community = fs.readFileSync(new URL("./community.js", import.meta.url), "utf8");
const admin = fs.readFileSync(new URL("./community-admin.js", import.meta.url), "utf8");
const adminHtml = fs.readFileSync(new URL("../boitoan/community-admin.html", import.meta.url), "utf8");
const e2eWorkflow = fs.readFileSync(new URL("../.github/workflows/e2e-reader-production.yml", import.meta.url), "utf8");

assert.match(gate, /class="gate-entry-choice"/, "màn đầu phải chỉ có các lựa chọn");
assert.match(gate, /data-entry-stage hidden/, "màn thao tác phải ẩn trước khi chọn");
assert.match(gate, /data-entry-open="login"[\s\S]*data-entry-open="register"[\s\S]*data-entry-open="admin"/);
assert.match(gate, /if \(!payload\) \{[\s\S]*reveal\(method \|\| "member"\)/, "trang plaintext không được ép giải mã sau đăng ký");
assert.match(gate, /community_profile_boitoan/, "phải lưu hồ sơ để hiện badge vai trò trong app");
assert.match(gate, /claimPrimaryAdminDevice/, "Admin đăng nhập phải khóa thiết bị Admin tổng");
assert.match(gate, /function marketAdminSession\(/, "phải nhận diện phiên Admin trên app chính");
assert.match(gate, /community-admin\.html/, "badge và bottom navigation Admin phải mở trang quản trị");
assert.match(gate, /Mở quản trị/, "giao diện Admin phải có chỉ dẫn quản trị rõ ràng");
assert.match(gate, /admin \? "Quản trị" : "Cộng đồng"/, "bottom navigation phải đổi thành Quản trị cho Admin");
assert.match(gateCss, /input\[type="checkbox"\][\s\S]*width:auto !important/, "checkbox không được kéo thành ô dài trên iPhone");
assert.match(gateCss, /a\.market-account-identity/, "badge Admin có thể bấm trên thiết bị cảm ứng");
assert.match(community, /function renderPosts\(/, "member phải có khu thảo luận chung");
assert.match(community, /community-role-badge role-/, "vai trò phải hiện cạnh tên");
assert.match(community, /requestedView === "profile"\) renderProfile\(\)/, "Admin tổng phải vào thẳng Trang cá nhân");
assert.match(community, /tokenClaims\(\)\.mode === "impersonation"/);
assert.match(community, /Chế độ chỉ đọc/);
assert.match(community, /Quay lại khu vực Admin/);
assert.match(admin, /Xóa tài khoản/);
assert.match(admin, /Xem trang cá nhân/);
assert.match(admin, /admin_view=profile/);
assert.doesNotMatch(admin, /admin_view=1/);
assert.match(admin, /Mở bài thảo luận/);
assert.match(adminHtml, /data-admin-tab="posts"/);

assert.match(e2eWorkflow, /workflow_run:/, "E2E phải chạy sau deploy production");
assert.match(e2eWorkflow, /Reader production verification/, "E2E chỉ chạy cho commit nghiệm thu được đánh dấu");
assert.match(e2eWorkflow, /role:'reader'/, "E2E phải tạo tài khoản Reader thật");
assert.match(e2eWorkflow, /E2E iPad Safari/, "E2E phải đăng nhập trên nền tảng thứ hai");
assert.match(e2eWorkflow, /-X DELETE[\s\S]*\/api\/community\/me/, "E2E phải xóa tài khoản qua API đã xác thực");
assert.match(e2eWorkflow, /token_not_revoked/);
assert.match(e2eWorkflow, /account_still_loginable/);
assert.match(e2eWorkflow, /READER_E2E_STATUS\.md/);

console.log("Account V3 frontend and production E2E contracts PASS");
