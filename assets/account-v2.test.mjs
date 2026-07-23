import assert from "node:assert/strict";
import fs from "node:fs";

const gate = fs.readFileSync(new URL("./gate.js", import.meta.url), "utf8");
const gateCss = fs.readFileSync(new URL("./gate.css", import.meta.url), "utf8");
const community = fs.readFileSync(new URL("./community.js", import.meta.url), "utf8");
const admin = fs.readFileSync(new URL("./community-admin.js", import.meta.url), "utf8");
const adminHtml = fs.readFileSync(new URL("../boitoan/community-admin.html", import.meta.url), "utf8");

assert.match(gate, /class="gate-entry-choice"/, "màn đầu phải chỉ có các lựa chọn");
assert.match(gate, /data-entry-stage hidden/, "màn thao tác phải ẩn trước khi chọn");
assert.match(gate, /data-entry-open="login"[\s\S]*data-entry-open="register"[\s\S]*data-entry-open="admin"/);
assert.match(gate, /if \(!payload\) \{[\s\S]*reveal\(method \|\| "member"\)/, "trang plaintext không được ép giải mã sau đăng ký");
assert.match(gate, /community_profile_boitoan/, "phải lưu hồ sơ để hiện badge vai trò trong app");
assert.match(gate, /claimPrimaryAdminDevice/, "Admin đăng nhập phải khóa thiết bị Admin tổng");
assert.match(gateCss, /input\[type="checkbox"\][\s\S]*width:auto !important/, "checkbox không được kéo thành ô dài trên iPhone");
assert.match(gateCss, /market-account-identity/);
assert.match(community, /function renderPosts\(/, "member phải có khu thảo luận chung");
assert.match(community, /community-role-badge role-/, "vai trò phải hiện cạnh tên");
assert.match(community, /state\.profile\.role === "reader" \? "Khách hàng" : "Trò chuyện"/, "tab phải khác theo vai trò");
assert.match(community, /requestedView === "profile"\) renderProfile\(\)/, "Admin tổng phải vào thẳng Trang cá nhân");
assert.match(community, /tokenClaims\(\)\.mode === "impersonation"/, "Trang cá nhân Admin phải nhận diện phiên impersonation");
assert.match(community, /Chế độ chỉ đọc/, "Trang cá nhân member phải chỉ đọc khi Admin tổng xem");
assert.match(community, /Quay lại khu vực Admin/, "Phải có đường quay lại khu vực Admin");
assert.match(admin, /Xóa tài khoản/);
assert.match(admin, /Xem trang cá nhân/);
assert.match(admin, /admin_view=profile/);
assert.doesNotMatch(admin, /admin_view=1/, "Không được mở dashboard mặc định cũ");
assert.match(admin, /Mở bài thảo luận/);
assert.match(adminHtml, /data-admin-tab="posts"/);

console.log("Account V2 frontend contracts PASS");
