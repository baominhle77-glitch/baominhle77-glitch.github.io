# Bàn giao hệ thống ba webapp

> **Mọi agent phải đọc `AGENTS.md` trước file này.** Sau đó đọc
> `docs/handover/ACTIVE_TASKS.json` và `docs/handover/NHAT-KY-PHOI-HOP.md` trước khi sửa.

**Cập nhật:** 23/07/2026 05:14 (GMT+7)  
**`main` hiện tại:** `a5d3f7afa78f62e7002e151b48121bb4894d2e1f`  
**Task đang làm:** `BOITOAN-20260723-02` — PR #19  
**Production đã xác nhận gần nhất:** xem `docs/handover/PRODUCTION_STATUS.md` nếu file tồn tại; không suy đoán production từ trạng thái source.

PR #19 đã đạt hai workflow kiểm thử: hệ thống Khách/Reader/Admin và coordination guard. PR **chưa merge** tại thời điểm ghi file này; branding “Cái Chợ của Hiên Nhi” và sửa mobile **chưa được coi là production** cho đến khi workflow deploy hậu kiểm xong.

---

## 1. Ba webapp và vị trí

Repository `baominhle77-glitch.github.io` là nguồn chuẩn duy nhất.

| App | Nguồn | Production |
|---|---|---|
| Bói toán / Cái Chợ của Hiên Nhi | `boitoan/`, `assets/`, `backend/` | `https://hiennhi89.pages.dev/boitoan/` |
| SPARE | root | `https://hiennhi89.pages.dev/` |
| MEDORA | `medora/` | `https://hiennhi89.pages.dev/medora/` |

## 2. Gate, mã hóa và quyền truy cập

- Nội dung ba app nằm trong payload AES-256-GCM; không chỉnh ciphertext bằng tay.
- Công cụ hợp lệ: `tools/decrypt.mjs`, `tools/encrypt.mjs`, `tools/set-password.mjs`.
- File `*.src.html` không commit.
- SPARE ưu tiên `DECRYPT_KEY_SPARE`; Bói toán/MEDORA dùng `DECRYPT_KEY` nếu chưa có binding riêng.
- Worker: `backend/worker.js`; production tại `hiennhi89-gate.hiennhi89.workers.dev`.
- Approval cấp session; dữ liệu chat cộng đồng giữ tối đa 30 ngày theo backend hiện hành.

## 3. Hệ thống Khách / Reader / Admin

Source hiện có:

- Khách và Reader đăng ký/đăng nhập sau gate.
- Reader có hồ sơ, chuyên môn, thông tin nhận phí và QR; backend từ chối link trong hồ sơ/thanh toán.
- Review 1–5 sao; Khách gỡ review của mình, Admin gỡ được, Reader không gỡ được.
- Chat Reader–Khách polling khoảng 1,5 giây, giữ tối đa 30 ngày, có báo phí và trạng thái thanh toán.
- Chat cộng đồng không sao chép sang Telegram.
- Admin đọc chat chỉ khi có `ADMIN_TOKEN` và đúng owner-device ID đã khóa; Admin khác không đọc được.

Các file chính:

- `backend/community.js`
- `assets/community.js`, `assets/community-admin.js`, `assets/community.css`
- `boitoan/community.html`, `boitoan/community-admin.html`
- `tools/apply-role-system.mjs`
- `docs/handover/ROLE_SYSTEM.md`

## 4. Task `BOITOAN-20260723-02` — trạng thái PR #19

### Đã thay đổi trong source

- `assets/community.css`: layout mobile mới, system-font stack, serif fallback, watermark lặp và logo sigil CSS.
- `boitoan/community.html`: lựa chọn loại tài khoản thành hai thẻ rõ ràng; không còn chữ Reader bị xếp dọc.
- `boitoan/community-admin.html`: đồng bộ branding.
- `tools/apply-role-system.mjs`:
  - chèn nút Cộng đồng thành mục thứ năm trong thanh điều hướng, không dùng nút nổi;
  - đổi phần hiển thị Bói toán sang “Cái Chợ của Hiên Nhi” sau giải mã;
  - bỏ dòng “khu vực riêng tư” khỏi watermark/footer hiển thị;
  - tạo logo trăng khuyết + sao bằng CSS;
  - tăng mật độ watermark;
  - bổ sung khung luận Tarot, Lenormand, Bài Tây, Kinh Dịch, Tử Vi và Bát Tự;
  - bổ sung phần kết nối toàn trải bài Tarot/Lenormand/Bài Tây.
- `docs/research/DIVINATION_SOURCES.md`: ghi nguồn Drive/Canva và phương pháp tổng hợp; không chép nguyên văn tài liệu.

### Cách tích hợp

Không giải mã và ghi đè toàn bộ `boitoan/index.html`. Lớp mới được chèn vào `assets/gate.js/gate.css` trong bước build, sau khi payload đã giải mã. Cách này giữ nguyên các sửa thuật toán Tử Vi/Bát Tự gần nhất của agent khác.

### Kiểm thử đã đạt

- Run `29962090012`: role system, frontend, service worker, Worker — **success**.
- Run `29962089978`: Task-ID, branch, phạm vi và bàn giao — **success**.
- `node --check tools/apply-role-system.mjs` đạt trước khi đẩy.

### Chưa hoàn tất

- PR #19 chưa merge.
- Chưa có smoke test production cho branding/layout mới.
- Chưa test E2E production bằng tài khoản Khách + Reader thật trên màn hình nhỏ.
- Chưa khóa owner-device trên thiết bị chủ nếu production chưa thực hiện bước này.

## 5. Nguồn kiến thức Drive/Canva

Đã rà các nhóm nguồn:

- Tarot: giáo trình của chủ, `78 Độ Minh Triết`, lịch sử/trường phái, Mary K. Greer, Liz Dean và Court Cards.
- Lenormand: Rana George, Caitlín Matthews, Marcus Katz/Tali Goodwin, Andy Boroveshengra và tài liệu dịch/giáo trình trong Drive.
- Bài Tây/cartomancy: tài liệu đối chiếu Tarot–Lenormand–cartomancy và giáo trình Gypsy.
- Tử Vi: tài liệu lập và giải Tử Vi trong Drive.
- Canva: thiết kế `Giáo trình tarot hình ảnh`, 63 trang.
- Chưa tìm thấy giáo trình Kinh Dịch chuyên biệt đủ rõ trong lượt rà; phần hiện tại chỉ dùng nguyên tắc phổ quát, chưa thay thuật toán quẻ.

Chi tiết tại `docs/research/DIVINATION_SOURCES.md`.

## 6. OpenAI Developers

- Người dùng yêu cầu bỏ vì không lấy được API key.
- Plugin Management trả `not_installed`; repository không có cấu hình `OPENAI` được tìm thấy.
- Không thêm OpenAI API, không tạo dependency mới và không chờ API key cho task này.

## 7. CI/CD và Cloudflare

- `.github/workflows/deploy-pages.yml` deploy từ `main`, chạy `tools/apply-role-system.mjs`, test source/Worker, deploy Pages trước Worker và hậu kiểm.
- Concurrency: `cloudflare-production`, không hủy deploy đang chạy.
- `backend/wrangler.toml` và workflow trong repo là source of truth.
- Sau merge PR #19 phải xác nhận:
  1. `/boitoan/community.html` HTTP 200;
  2. API Reader không phiên HTTP 401;
  3. nút Cộng đồng nằm trong nav 5 mục trên mobile;
  4. role cards không tràn chữ tại chiều rộng khoảng 375–430 px;
  5. branding/watermark không còn chuỗi “khu vực riêng tư” ở phần hiển thị Bói toán;
  6. app mở khóa và các màn Tarot/Lenormand/Bài Tây/Kinh Dịch/Tử Vi/Bát Tự vẫn hoạt động.

## 8. PWA và iOS/Android

- Root và Bói toán có manifest/service worker; không cache navigation, payload HTML hay API.
- Đóng gói App Store/Google Play chưa hoàn tất; vẫn cần tài khoản developer, privacy disclosure, test thiết bị và submission.
- Không phụ thuộc OpenAI API để đóng gói app.

## 9. Điều phối nhiều agent

- Một PR = một Task-ID.
- Không sửa vùng đang bị khóa trong `docs/handover/ACTIVE_TASKS.json`.
- `tools/apply-role-system.mjs` là điểm build nhạy cảm: agent khác không sửa cho đến khi `BOITOAN-20260723-02` hoàn tất hoặc blocked.
- Không ghi secret/token/mật khẩu/QR/dữ liệu chat vào repo.

## 10. Việc tiếp theo theo thứ tự

1. Cập nhật nhật ký PR #19 và chạy CI cuối.
2. Merge PR #19 khi cả hai workflow vẫn đạt.
3. Theo dõi deploy Cloudflare; chỉ chốt sau hậu kiểm.
4. Test trực tiếp trên iPhone các kích thước mobile và luồng Khách/Reader.
5. Chuyển task sang `completed`, giải phóng paths và ghi commit production.

---

Xem thêm: `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/handover/ROLE_SYSTEM.md`, `docs/handover/PHOI-HOP-DA-AGENT.md`, `docs/research/DIVINATION_SOURCES.md`.
