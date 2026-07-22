# Bàn giao hệ thống ba webapp

> **Mọi agent phải đọc `AGENTS.md` trước file này.** Sau đó đọc
> `docs/handover/ACTIVE_TASKS.json` và `docs/handover/NHAT-KY-PHOI-HOP.md` trước khi sửa.

**Cập nhật:** 23/07/2026 04:24 (GMT+7)  
**`main` mới nhất khi lập bàn giao:** `fc5a147596b34d62ed2464fbcaea038530be83cc`  
**Production đã xác nhận gần nhất:** `8790f37f429987a716d62ab1e3d43ceb1053a3d7`

Hệ thống Khách/Reader/Admin đã merge vào source tại commit `489b751391007976a2a39c4f25bfdcd36db99e25`. Workflow đã được bổ sung hậu kiểm và cơ chế ghi `docs/handover/PRODUCTION_STATUS.md`, nhưng tại thời điểm cập nhật file này **chưa có file trạng thái production mới trên `main`**; vì vậy không được tuyên bố phần cộng đồng đã xác nhận production cho đến khi hậu kiểm tạo file hoặc có bằng chứng tương đương.

---

## 1. Ba webapp và vị trí

Repository `baominhle77-glitch.github.io` là **nguồn chuẩn duy nhất** cho cả ba app.

| App | Mô tả | Nguồn trong repo | URL production |
|---|---|---|---|
| 🔮 Bói toán | PWA tra cứu, luận giải và cộng đồng Reader | `boitoan/` | `https://hiennhi89.pages.dev/boitoan/` |
| 🕯️ SPARE | Kho tra cứu tâm linh riêng + chat | root | `https://hiennhi89.pages.dev/` |
| ⚕️ MEDORA | Học y khoa | `medora/` | `https://hiennhi89.pages.dev/medora/` |

MEDORA được nhập từ commit `84a8632` của repository cũ `baominhle77-glitch.github.io-`. Repository cũ không còn là nguồn deploy production.

## 2. Gate, mã hóa và quyền truy cập

### Gate

- `robots.txt` chặn công cụ tìm kiếm và bot AI đã khai báo.
- Trang dùng `noindex, nofollow, noarchive, nosnippet` và `referrer: no-referrer`.
- `assets/gate.js` + `assets/gate.css` là lớp gate dùng chung.
- Ba app chạy `mode: 'approval'` và nhận khóa giải mã sau khi chủ duyệt.

### Payload mã hóa

- Nội dung app được đóng trong payload **AES-256-GCM**; source public không chứa plaintext nội dung chính.
- Bói toán đã gộp các file dữ liệu/app cũ vào payload; không khôi phục các file plaintext đã xóa.
- Công cụ: `tools/encrypt.mjs`, `tools/decrypt.mjs`, `tools/set-password.mjs`.
- File `*.src.html` không được commit.
- SPARE dùng secret riêng `DECRYPT_KEY_SPARE`; Bói toán và MEDORA dùng `DECRYPT_KEY` chung, trừ khi có binding app-specific mới.
- Đổi mật khẩu app phải đồng bộ payload mã hóa, gate và Worker secret của đúng app.

### Backend approval

- `backend/worker.js` là Cloudflare Worker cho telemetry, duyệt Telegram/trang Admin, session và API.
- Worker production: `hiennhi89-gate.hiennhi89.workers.dev`.
- Phiên approval hiện có thời hạn 12 giờ; chat cũ của hệ thống gốc lưu tối đa 30 ngày trong KV.
- Telemetry/browser ID là best-effort, không phải định danh thiết bị vật lý tuyệt đối.

## 3. Hệ thống tài khoản Bói toán

Source đã có:

- Vai trò người dùng: **Khách** và **Reader/Người luận giải**; quản trị qua `ADMIN_TOKEN`.
- Đăng ký/đăng nhập chỉ sau khi qua gate duyệt.
- Khách có hồ sơ cá nhân, không có trường đánh giá trên chính hồ sơ Khách.
- Reader có giới thiệu, mảng chuyên sâu, thông tin nhận phí và QR; API từ chối link trong hồ sơ/thông tin thanh toán.
- Review công khai 1–5 sao + nội dung; Khách tự gỡ review của mình, Admin gỡ được, Reader không được gỡ.
- Chat Reader–Khách giữ tối đa 30 ngày, polling khoảng 1,5 giây, có báo phí/báo chuyển khoản/xác nhận/nội dung luận giải.
- Chat Reader–Khách không sao chép sang Telegram.
- Chỉ hai người tham gia đọc chat. Quyền Admin đọc chat cần đồng thời `ADMIN_TOKEN` và đúng owner-device ID đã khóa trong KV; Admin khác không đọc được nội dung chat.

Cấu trúc:

- `backend/community.js`
- `assets/community.js`
- `assets/community-admin.js`
- `assets/community.css`
- `boitoan/community.html`
- `boitoan/community-admin.html`
- `tools/apply-role-system.mjs`
- `docs/handover/ROLE_SYSTEM.md`

Việc vận hành còn cần làm sau khi production được xác nhận:

1. Mở trang quản trị cộng đồng trên đúng thiết bị chủ.
2. Khóa owner-device lần đầu.
3. Test E2E: tạo Khách, tạo Reader, review, chat, báo phí, thanh toán và quyền Admin.
4. Ghi kết quả/dữ liệu thử đã dọn vào nhật ký.

## 4. PWA và cửa hàng ứng dụng

- Root và Bói toán có manifest/service worker.
- Service worker không được cache navigation, HTML mã hóa hoặc API.
- Có icon PNG 192×192 và 512×512 thật.
- ChPlay/App Store/iOS chưa hoàn tất: còn tài khoản developer, đóng gói, listing, privacy disclosure, test và submission.

## 5. CI/CD và Cloudflare

- `.github/workflows/deploy-pages.yml`: deploy từ `main`, preflight secret/binding, chạy test, build site, deploy Pages trước và Worker sau.
- Workflow có concurrency `cloudflare-production`, không hủy deploy đang chạy.
- Wrangler pin `4.112.0` để giảm biến động.
- `.github/workflows/deploy-worker.yml`: chỉ dùng thủ công cho khôi phục; không dùng thay workflow phối hợp khi frontend/API cùng đổi.
- `backend/wrangler.toml` và workflow trong repository là nguồn chuẩn cấu hình Cloudflare; tránh sửa dashboard mà không cập nhật source.
- Hậu kiểm mới yêu cầu trang cộng đồng trả HTTP 200 và API Reader không có phiên trả HTTP 401; thành công phải tạo `docs/handover/PRODUCTION_STATUS.md`.
- Tại thời điểm 04:24 ngày 23/07/2026, file trạng thái mới chưa xuất hiện; production mới nhất được xác nhận vẫn là commit `8790f37`.

## 6. Điều phối nhiều agent

Cơ chế mới:

- `AGENTS.md`: quy tắc bắt buộc cho mọi agent.
- `docs/handover/ACTIVE_TASKS.json`: khóa phạm vi máy đọc được.
- `tools/validate-coordination.mjs`: phát hiện task trùng ID/branch/phạm vi.
- `.github/workflows/coordination-guard.yml`: kiểm tra PR có Task-ID, đúng branch, chỉ sửa trong phạm vi đã khóa và có cập nhật bàn giao.
- `.github/pull_request_template.md`: checklist bắt buộc.
- `.github/copilot-instructions.md`: hướng dẫn GitHub Copilot/agent.
- `docs/handover/PHOI-HOP-DA-AGENT.md`: thỏa thuận vận hành chi tiết.

Nguyên tắc: một PR = một Task-ID; không sửa trực tiếp `main`; không sửa vùng đang bị task khác khóa; mọi task phải cập nhật bàn giao và giải phóng khóa.

## 7. Việc còn lại ưu tiên

1. Xác định kết quả workflow deploy cho source cộng đồng và commit mới nhất; chỉ chốt khi có hậu kiểm.
2. Test E2E production có ghi KV/Telegram/community rồi dọn dữ liệu thử.
3. Khóa owner-device trên thiết bị chủ và ghi migration procedure nếu sau này đổi thiết bị.
4. Cân nhắc bật/chuẩn hóa Workers Logs/Traces trong `wrangler.toml` sau khi xác định chi phí và dữ liệu được phép ghi.
5. Hoàn thiện đóng gói iOS/Android khi có tài khoản developer và bộ privacy disclosure.

## 8. Bí mật và mật khẩu

- Giá trị mật khẩu cổng được bàn giao riêng, không lưu trong repository.
- Worker cần các binding/secret phù hợp, gồm: `ADMIN_TOKEN`, `DECRYPT_KEY`, `DECRYPT_KEY_SPARE`, `SESSION_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET` và khóa thanh toán nếu bật.
- Token, mật khẩu, QR riêng, dữ liệu chat và secret không được chép vào issue/PR/log/bàn giao.
- Credential từng lộ trong hội thoại hoặc môi trường ngoài repository phải được rotate/revoke theo quyết định của chủ; tài liệu chỉ ghi trạng thái, không ghi giá trị.

---

Xem thêm: `docs/ARCHITECTURE.md`, `docs/handover/ROLE_SYSTEM.md`, `docs/handover/PHOI-HOP-DA-AGENT.md`.