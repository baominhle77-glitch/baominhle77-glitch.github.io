# AGENTS.md — Quy tắc bắt buộc cho mọi agent

File này áp dụng cho **mọi AI/agent/công cụ** làm việc trong repository này: ChatGPT/Codex, Claude Code, GitHub Copilot, VS Code agent và công cụ tự động khác.

## 1. Thứ tự phải đọc trước khi sửa

1. `AGENTS.md` — quy tắc bắt buộc.
2. `HANDOVER.md` — kiến trúc và trạng thái hệ thống.
3. `docs/handover/ACTIVE_TASKS.json` — phạm vi đang được agent khác giữ.
4. `docs/handover/NHAT-KY-PHOI-HOP.md` — lịch sử thay đổi.
5. File bàn giao chuyên biệt của phần định sửa, nếu có.

Không bắt đầu chỉnh sửa khi chưa đọc đủ các file trên.

## 2. Nguồn chuẩn và vùng nhạy cảm

- Repository này là **nguồn chuẩn duy nhất** cho SPARE, Bói toán và MEDORA.
- Production chạy trên Cloudflare Pages + Cloudflare Worker.
- Các vùng nhạy cảm, chỉ một task được sửa tại một thời điểm:
  - `backend/**`
  - `.github/workflows/**`
  - `tools/encrypt.mjs`, `tools/decrypt.mjs`, `tools/set-password.mjs`
  - `index.html`, `boitoan/index.html`, `medora/index.html`
  - `assets/gate.*`, `sw.js`, `boitoan/sw.js`
  - cấu hình Cloudflare và mọi file liên quan deploy
- Không đưa token, mật khẩu, khóa giải mã, secret hoặc dữ liệu chat riêng tư vào commit, issue, PR, log hay file bàn giao.

## 3. Khóa phạm vi trước khi làm

Trước khi sửa mã:

1. Tạo một Task-ID duy nhất, dạng `AREA-YYYYMMDD-NN`, ví dụ `COMMUNITY-20260723-01`.
2. Tạo branch dạng `agent/<task-id>-<mo-ta-ngan>`.
3. Ghi task vào `docs/handover/ACTIVE_TASKS.json` với:
   - `id`
   - `owner`
   - `branch`
   - `base_sha`
   - `paths`
   - `status: in_progress`
   - `started_at`
   - `heartbeat_at`
   - `summary`
4. Chạy `node tools/validate-coordination.mjs`.
5. Không được tiếp tục nếu một task đang hoạt động có phạm vi giao nhau.

Phạm vi đường dẫn phải càng hẹp càng tốt. Không dùng `*` hoặc toàn repository trừ khi task thực sự là migration toàn hệ thống và đã được chủ yêu cầu rõ.

## 4. Nguyên tắc branch và tích hợp

- Không sửa trực tiếp `main` bằng agent.
- Luôn bắt đầu từ `main` mới nhất.
- Trước mỗi lần push cuối: fetch/rebase hoặc kiểm tra lại `main`; không force-push lên branch của agent khác.
- Mỗi PR chỉ giải quyết **một Task-ID**.
- Không tự merge nếu CI chưa đạt hoặc PR còn xung đột.
- Nếu phát hiện agent khác vừa sửa cùng file: dừng, cập nhật task thành `blocked`, ghi lý do vào nhật ký, rồi rebase hoặc tách phạm vi.

## 5. Yêu cầu bắt buộc trong PR

PR phải có:

- `Task-ID:`
- agent thực hiện
- phạm vi file đã khóa
- mô tả thay đổi
- kiểm thử đã chạy và kết quả
- ảnh hưởng deploy
- xác nhận không thêm secret
- cập nhật file bàn giao
- trạng thái khóa đã được giải phóng hoặc nêu rõ còn giữ

Mọi PR mã nguồn phải cập nhật ít nhất một trong các file:

- `docs/handover/NHAT-KY-PHOI-HOP.md`
- `docs/handover/ACTIVE_TASKS.json`
- `HANDOVER.md`
- file bàn giao chuyên biệt tương ứng

## 6. Quy tắc riêng cho payload mã hóa

- Không chỉnh trực tiếp chuỗi payload mã hóa bằng tay.
- Quy trình: giải mã bằng công cụ trong `tools/` → sửa bản plaintext cục bộ → kiểm thử → mã hóa lại.
- File plaintext nguồn không được commit.
- Khi đổi mật khẩu/khóa: phải đồng bộ payload, cấu hình gate và Worker secret đúng app; thiếu một bước sẽ làm production không mở được.
- Không ghi giá trị mật khẩu hoặc khóa vào bàn giao; chỉ ghi trạng thái và tên binding.

## 7. Quy tắc Cloudflare và deploy

- `backend/wrangler.toml` và workflow trong repository là nguồn chuẩn cấu hình; không sửa lệch trên dashboard rồi bỏ quên source.
- Deploy production theo thứ tự: **Pages trước, Worker sau**.
- Không deploy Worker riêng nếu contract frontend/API vừa thay đổi.
- Sau deploy phải hậu kiểm endpoint công khai, kiểm soát truy cập API, CORS và cập nhật `docs/handover/PRODUCTION_STATUS.md`.
- Secret chỉ đặt bằng GitHub Secrets/Cloudflare Worker Secrets.

## 8. Kiểm thử tối thiểu trước PR

Chạy các kiểm tra có liên quan; với thay đổi hệ thống chung phải chạy toàn bộ:

```bash
node tools/validate-coordination.mjs
node --check assets/gate.js
node --check assets/community.js
node --check assets/community-admin.js
node assets/gate.test.mjs
node --check sw.js
node --check boitoan/sw.js
node sw.test.mjs
node boitoan/sw.test.mjs
node --check backend/community.js
node backend/community.test.mjs
node --check backend/worker.js
node backend/worker.test.mjs
```

Nếu một lệnh không áp dụng, ghi rõ lý do trong PR; không ghi “đã test” khi chưa chạy.

## 9. Kết thúc và bàn giao

Trước khi kết thúc task:

1. Cập nhật `docs/handover/NHAT-KY-PHOI-HOP.md` bằng thời gian GMT+7, Task-ID, commit/PR, file đã sửa, test, deploy và việc còn lại.
2. Chuyển task trong `ACTIVE_TASKS.json` sang `completed`, `blocked` hoặc `cancelled`; không để `in_progress` mồ côi.
3. Ghi commit production nếu đã deploy.
4. Nêu rõ việc nào chưa kiểm chứng; không suy đoán là đã hoàn tất.

## 10. Quy tắc ưu tiên khi mâu thuẫn

Ưu tiên theo thứ tự:

1. Yêu cầu mới nhất, rõ ràng của chủ sở hữu.
2. An toàn dữ liệu, bí mật và khả năng khôi phục production.
3. `AGENTS.md` và task lock đang hoạt động.
4. `HANDOVER.md` và tài liệu kiến trúc.
5. Nội dung PR/issue cũ.

Khi không chắc, dừng ở trạng thái an toàn và ghi `blocked`; không tự ý sửa rộng để “cho xong”.