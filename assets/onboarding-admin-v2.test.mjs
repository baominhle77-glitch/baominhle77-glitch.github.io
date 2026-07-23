import assert from "node:assert/strict";
import fs from "node:fs";

const gate = fs.readFileSync(new URL("./gate.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("./gate.css", import.meta.url), "utf8");
const community = fs.readFileSync(new URL("./community.js", import.meta.url), "utf8");
const admin = fs.readFileSync(new URL("./community-admin.js", import.meta.url), "utf8");
const adminHtml = fs.readFileSync(new URL("../boitoan/community-admin.html", import.meta.url), "utf8");

assert.match(gate, /gate-entry-home/, "cửa đầu phải là màn hình chọn luồng riêng");
assert.match(gate, /gate-entry-detail/, "biểu mẫu phải nằm ở màn hình bước hai");
assert.match(gate, /data-entry-open="login"/);
assert.match(gate, /data-entry-open="register"/);
assert.match(gate, /data-entry-open="admin"/);
assert.match(gate, /if \(!hasPayload\)/, "app HTML thường phải mở trực tiếp, không gọi giải mã bắt buộc");
assert.match(gate, /recovered_existing/, "đăng ký lại đúng mật khẩu phải khôi phục tài khoản tạo dở");
assert.doesNotMatch(gate, /gate-entry-tabs/, "không được dồn ba form thành tab trên cùng một trang");
assert.match(css, /gate-member-card \.gate-remember input[^}]*width:18px!important/s, "checkbox không được giãn thành ô dài");
assert.match(css, /gate-step-choice/, "màn hình chọn luồng phải có layout riêng");
assert.match(community, /function renderPosts\(\)/, "member phải có khu thảo luận chung");
assert.match(community, /\/api\/community\/posts/, "UI member phải dùng API thảo luận");
assert.match(admin, /Xóa tài khoản/, "Admin phải có thao tác xóa member");
assert.match(admin, /Mở như member/, "Tổng Admin phải có thao tác mở giao diện member");
assert.match(admin, /Mở chủ đề cho mọi member/, "Admin phải có thao tác mở chủ đề chung");
assert.match(adminHtml, /data-admin-tab="posts"/, "trang Admin phải có tab Thảo luận");

console.log("onboarding/admin v2 frontend contracts PASS");
