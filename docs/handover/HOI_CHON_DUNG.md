# HỘI CHỌN ĐÚNG — BÀN GIAO MVP

**Task-ID:** `AFFILIATE-20260724-01`  
**Production:** `https://hiennhi89.pages.dev/hoi-chon-dung/`  
**Backend:** `https://hiennhi89-gate.hiennhi89.workers.dev/api/choice/*`  
**Trạng thái:** `SUCCESS` — đã deploy và hậu kiểm production ngày 24/07/2026.  
**Source production:** `f57023af442839da852354672bea8036e579a9fd`  
**PR:** `#84`  
**CI trước merge:** `30100845932`, `30100845901` — SUCCESS  
**Deploy + production smoke:** `30100989464`, job `89506673059` — SUCCESS

## 1. Mục tiêu

Ứng dụng cộng đồng hỗ trợ người dùng mô tả nhu cầu, nhận ba lựa chọn phù hợp, xem ưu/nhược điểm, so sánh, lưu, bình chọn và chủ động chuyển tới nơi bán. Link affiliate được công bố rõ; hệ thống không dùng countdown giả, đánh giá giả hoặc cam kết sản phẩm tốt nhất tuyệt đối.

## 2. Frontend/PWA

Nguồn trong `hoi-chon-dung/`:

- `index.html`: SEO, Open Graph, JSON-LD `Organization`, `WebApplication`, `FAQPage`, biểu mẫu chọn và công bố affiliate.
- `app.js`: tải catalog, fallback offline, chấm điểm theo danh mục/ngân sách/ưu tiên/nhu cầu, so sánh, lưu, bình chọn, chia sẻ và cài PWA.
- `app.css`: responsive mobile-first.
- `manifest.webmanifest`, `sw.js`, `icon.svg`: PWA và app shell offline.
- `sitemap.xml`: chỉ công khai URL Hội Chọn Đúng.
- `data/seed-products.js`: 12 sản phẩm mẫu thuộc Tarot, sáng tạo nội dung và in 3D.

## 3. API và dữ liệu

Module `backend/choice.js`, tích hợp vào Worker bằng `tools/apply-choice-system.mjs` trong workflow.

| Route | Chức năng |
|---|---|
| `GET /api/choice/health` | health/version |
| `GET /api/choice/products` | catalog công khai, lọc theo danh mục/từ khóa; không lộ URL đích thô |
| `GET /api/choice/meta` | danh mục và số sản phẩm |
| `POST /api/choice/vote` | bình chọn, khử lặp cùng người/sản phẩm/ngày |
| `GET /r/choice/:id` | ghi nhận click và chuyển hướng 302 tới affiliate hoặc link tham khảo |

KV:

- `choice:catalog:v1`: catalog.
- `choice:vote-dedupe:<digest>`: chống bình chọn lặp, TTL 24 giờ.
- `choice:votes:<product>`: tổng bình chọn động.
- `choice:click-dedupe:<digest>`: chống đếm click lặp trong 5 phút.
- `choice:click-total:<product>` và `choice:click-day:<day>:<product>`: tổng click.

Digest dùng `SESSION_SECRET` và dữ liệu request để khử lặp; không lưu IP thô trong catalog hoặc khóa thống kê.

## 4. Quản trị qua Telegram hiện có

Chỉ tài khoản owner khớp đồng thời `chat.id` và `from.id` với `TELEGRAM_CHAT_ID` mới mutation được.

- `/chon` hoặc `/hoichondung`: hướng dẫn.
- `/dssp`: danh sách sản phẩm.
- `/xemsp <id>`: xem chi tiết.
- `/themsp`: thêm bằng biểu mẫu nhiều dòng.
- `/suasp <id>`: sửa trường, gồm `Link affiliate`.
- `/ansp <id>`, `/hiensp <id>`: ẩn/hiện.
- `/xoasp <id>`: xóa có nút xác nhận.
- `/thongkesp`: tổng sản phẩm, lượt bình chọn và click.

Ví dụ gắn link affiliate thật:

```text
/suasp rider-waite-smith-tarot
Link affiliate: https://link-affiliate-hop-le.example/...
```

## 5. Trạng thái link lúc seed

`affiliate_url` của 12 sản phẩm mẫu đang để trống. `merchant_url` chỉ là link tìm kiếm tham khảo HTTPS để ứng dụng không dẫn tới trang giả hoặc gian hàng chưa xác minh. Vì vậy production hiện có thể chạy, đo hành vi và kiểm chứng luồng chuyển hướng nhưng **chưa phát sinh hoa hồng** cho tới khi owner cập nhật link affiliate thật qua Telegram.

## 6. Kiểm thử và bằng chứng production

- `node --test hoi-chon-dung/app.test.mjs`: 5/5 đạt — SEO/PWA/disclosure/catalog/service worker.
- `node --test backend/choice.test.mjs`: 6/6 đạt — URL an toàn, API không lộ link, vote dedupe, click redirect/dedupe, quyền Telegram, lọc danh mục.
- PR #84 merge thành source `f57023af442839da852354672bea8036e579a9fd`.
- Điều phối đa-agent `30100845932`: success.
- Frontend/Worker/WebKit hiện hữu `30100845901`: success.
- Workflow production `30100989464`, job `89506673059`: success toàn bộ các bước kiểm tra cấu hình Cloudflare, source, build site, deploy Worker trước Pages, deploy Pages và hậu kiểm production.
- Recorder production commit `a5dfe91920171f1af1b65f1e090e1ac42b9eb070` ghi source trên ở trạng thái `SUCCESS`.

## 7. Giới hạn MVP

- Gợi ý là chấm điểm quy tắc tại trình duyệt, chưa dùng mô hình AI sinh nội dung.
- Catalog dùng Workers KV; cập nhật có thể cần thời gian ngắn để đồng bộ ở các điểm mạng.
- Chưa có tài khoản thành viên và bài review dài; bình chọn hiện là tín hiệu cộng đồng tối giản.
- Giá là khoảng tham khảo, không phải giá thời gian thực.
