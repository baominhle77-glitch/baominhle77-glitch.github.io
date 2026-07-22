# Thỏa thuận phối hợp đa-agent

**Áp dụng từ:** 23/07/2026 (GMT+7)  
**Repository:** `baominhle77-glitch/baominhle77-glitch.github.io`  
**Mục tiêu:** nhiều agent làm song song nhưng không ghi đè, không sửa chồng, không làm production lệch source và luôn bàn giao đủ để agent khác tiếp tục ngay.

## 1. Bộ file điều phối

| File | Vai trò |
|---|---|
| `AGENTS.md` | Quy tắc bắt buộc, dùng chung cho mọi agent |
| `.github/copilot-instructions.md` | Chỉ dẫn tự động cho GitHub Copilot/agent |
| `docs/handover/ACTIVE_TASKS.json` | Sổ khóa phạm vi máy đọc được |
| `docs/handover/NHAT-KY-PHOI-HOP.md` | Nhật ký con người đọc, mới nhất đặt trên cùng |
| `HANDOVER.md` | Kiến trúc, production và việc còn lại |
| `.github/pull_request_template.md` | Hợp đồng PR bắt buộc |
| `.github/workflows/coordination-guard.yml` | CI kiểm tra Task-ID, branch, phạm vi và bàn giao |
| `tools/validate-coordination.mjs` | Phát hiện task trùng ID/branch/phạm vi |

`AGENTS.md` là điểm vào đầu tiên. File nhật ký không thay thế task lock; task lock không thay thế bàn giao kỹ thuật.

## 2. Trạng thái một task

```text
planned → in_progress → completed
                     ↘ blocked
                     ↘ cancelled
```

- `planned`: mới mô tả, chưa khóa file.
- `in_progress`: đã có owner, branch, base SHA và paths; agent được phép sửa đúng phạm vi.
- `blocked`: dừng có chủ đích vì xung đột, thiếu quyền, thiếu dữ kiện hoặc CI/production lỗi.
- `completed`: mã, test, bàn giao và giải phóng khóa đã xong.
- `cancelled`: không tiếp tục; phải ghi lý do.

Chỉ `in_progress` và `blocked` nằm trong `active_tasks`. Task hoàn tất/hủy chuyển sang `recently_completed` và giữ lại `paths`, `branch`, `base_sha`, `completed_at` để truy vết.

## 3. Cách nhận việc

1. Đồng bộ `main` mới nhất.
2. Đọc danh sách task và nhật ký.
3. Chọn Task-ID riêng.
4. Khóa đường dẫn hẹp nhất có thể.
5. Chạy validator.
6. Mở PR sớm ở dạng draft khi task lớn, để agent khác thấy phạm vi đã giữ.
7. Cập nhật `heartbeat_at` khi phiên làm việc kéo dài hoặc trước khi tạm dừng.

Một task không được nhận cả `backend/**` và toàn bộ frontend nếu công việc có thể tách thành hai PR độc lập.

## 4. Cách xác định chồng chéo

- Hai task cùng khóa một file: chồng chéo.
- Một task khóa `backend/**`, task khác khóa `backend/worker.js`: chồng chéo.
- `assets/gate.js` và `assets/community.js`: không chồng nếu khóa theo file.
- Hai task cùng sửa payload mã hóa `boitoan/index.html`: luôn coi là chồng chéo, kể cả sửa hai chức năng khác nhau, vì re-encrypt tạo diff toàn file.
- Workflow deploy và `backend/wrangler.toml` là một cụm hạ tầng; task liên quan phải ghi rõ thứ tự deploy và hậu kiểm.

Khi phát hiện chồng chéo, task bắt đầu sau phải dừng hoặc thu hẹp phạm vi. Không giải quyết bằng force-push hay chép đè file.

## 5. Ma trận trách nhiệm theo vùng

| Vùng | Yêu cầu bổ sung |
|---|---|
| `boitoan/index.html` | Cần đúng mật khẩu cục bộ, không commit plaintext, test trình duyệt sau mã hóa |
| `backend/**` | Test Worker, quyền truy cập, TTL/KV, CORS, không lộ chat/secret |
| `assets/community*`, `boitoan/community*` | Test vai trò Khách/Reader/Admin và session qua gate |
| `sw.js`, `boitoan/sw.js`, manifest/icon | Test cache/navigation/PWA; không cache HTML mã hóa hoặc API |
| `.github/workflows/**` | Không giảm quyền bảo vệ; test CI; nêu ảnh hưởng deploy |
| `backend/wrangler.toml` | Source of truth Cloudflare; mọi binding phải có tài liệu và preflight |
| `HANDOVER.md`, `docs/handover/**` | Không ghi secret; phân biệt đã xác nhận và việc còn chờ |

## 6. Quy tắc deploy Cloudflare

1. Chỉ deploy từ source đã commit và test.
2. Frontend/API thay đổi cùng contract: Pages trước, Worker sau.
3. Workflow production dùng concurrency để không có hai deploy chồng nhau.
4. Sau deploy phải xác nhận tối thiểu:
   - trang chính/đường dẫn mới trả mã HTTP mong đợi;
   - endpoint cần đăng nhập từ chối request không có phiên;
   - CORS đúng origin production;
   - secret/binding bắt buộc tồn tại;
   - không có plaintext hoặc token trong site/repo.
5. Ghi source commit, thời gian UTC/GMT+7 và kết quả vào `PRODUCTION_STATUS.md`.
6. Không coi “workflow đã chạy” là “production đã đúng” nếu chưa có hậu kiểm.

## 7. Quy tắc với agent dùng công cụ ngoài GitHub

Adobe, Canva, Google Drive, Documents, PDF, Presentations, Spreadsheets, Visualize hoặc công cụ thiết kế khác có thể tạo tài sản hỗ trợ, nhưng:

- GitHub vẫn là nguồn chuẩn của mã và tài liệu kỹ thuật.
- Mọi file đưa vào app phải có nguồn, định dạng, quyền sử dụng và đường dẫn đích rõ.
- Không sửa trực tiếp production từ công cụ ngoài rồi bỏ qua repository.
- Tài sản lớn hoặc file nhị phân phải tránh trùng tên và ghi checksum/phiên bản khi cần.
- Kết quả từ công cụ ngoài phải được ghi vào nhật ký cùng Task-ID trước khi task hoàn tất.

## 8. Tình huống khẩn cấp

Có thể hotfix trực tiếp chỉ khi production lỗi nghiêm trọng và chủ yêu cầu xử lý ngay. Sau hotfix phải:

1. tạo Task-ID hồi tố;
2. ghi chính xác commit và lý do bỏ quy trình thường;
3. chạy test/hậu kiểm;
4. cập nhật task ledger và bàn giao trong cùng phiên;
5. mở issue/PR theo dõi nếu còn nợ kiểm thử hoặc refactor.

Không dùng “khẩn cấp” cho thay đổi tính năng thông thường.

## 9. Tiêu chí task hoàn tất

Task chỉ được đánh dấu `completed` khi đồng thời:

- diff nằm đúng phạm vi;
- CI liên quan đạt;
- test được ghi bằng lệnh/kết quả cụ thể;
- không còn xung đột với `main`;
- bàn giao đã cập nhật;
- production status đã ghi nếu có deploy;
- khóa phạm vi đã giải phóng.

Nếu thiếu bất kỳ điều kiện nào, dùng `blocked` hoặc giữ `in_progress`; không ghi hoàn tất để tạo cảm giác yên tâm giả.

## 10. Nguyên tắc cuối cùng

- Source trước dashboard.
- Task-ID trước chỉnh sửa.
- Khóa phạm vi trước chạy song song.
- CI trước merge.
- Hậu kiểm trước tuyên bố production thành công.
- Bàn giao trước kết thúc phiên.
