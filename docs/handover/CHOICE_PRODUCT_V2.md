# HỘI CHỌN ĐÚNG — BÀN GIAO PRODUCT V2

## 1. Lý do phải làm lại

Bản cũ trộn khám phá, tư vấn, bình chọn và so sánh trong một trang. Khi API lỗi, frontend dùng `SEED_PRODUCTS`; một số `merchant_url` là Google Search nên nút “Xem nơi bán” mở Google và vẫn gắn nhãn “Link tham khảo”. Đây là lỗi kiến trúc, không phải lỗi giao diện đơn lẻ.

## 2. Yêu cầu chủ sở hữu đã chốt

- Chỉ lấy sản phẩm từ Shopee Việt Nam, Lazada Việt Nam, Tiki, Sendo và TikTok Shop Việt Nam.
- Người xem cần biết sản phẩm nào đang hot/trend và lý do.
- Có ảnh/clip sản phẩm khi nguồn cung cấp.
- Cùng một sản phẩm phải gom nhiều shop thật, mỗi shop có affiliate link riêng.
- Mỗi shop hiển thị giá, điểm sao/số review, uy tín, số đã bán, ưu/nhược điểm khi nguồn có dữ liệu xác minh.
- Không bịa rating/review; thiếu dữ liệu phải ghi rõ chưa có dữ liệu xác minh.
- Không dùng Google, merchant URL thường, link tham khảo hoặc dữ liệu seed làm phương án dự phòng.
- Tách luồng rõ ràng trên di động.

## 3. Kiến trúc sản phẩm V2

1. `/hoi-chon-dung/` — Đang hot.
2. `/hoi-chon-dung/kham-pha.html` — Khám phá và bộ lọc.
3. `/hoi-chon-dung/san-pham.html?id=...` — Hồ sơ sản phẩm và bảng các shop.
4. `/hoi-chon-dung/tu-van.html` — Tư vấn theo nhu cầu/ngân sách.
5. `/hoi-chon-dung/so-sanh.html` — So sánh tối đa bốn sản phẩm.

Thẻ sản phẩm chỉ mở trang chi tiết nội bộ. Chỉ nút của từng shop mới mở `/r/choice/<offer-id>`.

## 4. Nguyên tắc dữ liệu

- Store version 3, mô hình offer-first.
- API chỉ công khai nhóm sản phẩm có ít nhất một offer affiliate hợp lệ.
- Offer phải có deeplink ACCESSTRADE và URL đích thuộc allowlist sàn Việt Nam.
- API không trả `affiliate_url` hoặc `merchant_url` thô.
- Cùng seller bị khử trùng; cùng sản phẩm ở seller khác được gom bằng `comparison_key`.
- Kho rỗng hoặc JSON lỗi trả catalog rỗng, không tự sinh seed.
- Rating/review/số bán/media là nullable; không có nguồn thì giao diện hiển thị trạng thái thiếu dữ liệu.
- Redirect sai hoặc thiếu affiliate trả HTTP 410, không fallback Google/merchant.

## 5. Nguồn mã khẩn cấp

Source of truth cho V2 trong giai đoạn rebuild:

- `tools/apply-choice-product-v2.mjs`
- `tools/choice-v2-payload/part-01.txt` … `part-08.txt`

Materializer giải nén 23 file V2, sau đó các materializer taxonomy/AccessTrade/Worker chạy tiếp. Mọi workflow deploy/validate/Growth/production bắt buộc gọi materializer V2 trước.

## 6. Kiểm thử đã dựng

- Backend V2: catalog fail-closed, nhóm nhiều shop, product detail, nullable rating, affiliate-only, redirect 410, bộ lọc.
- Marketplace: chặn ngoài Việt Nam, cho phép deeplink Shopee VN, gom Shopee/Lazada, chống shop trùng.
- Frontend: năm màn hình, không import seed, không Google/merchant fallback, media/rating/offer, service worker V5.
- SEO: chỉ catalog live, đủ 12 danh mục, không seed fallback.

Kiểm thử cục bộ: backend 8/8; marketplace 4/4; frontend 5/5; SEO 2/2.

## 7. Trạng thái thực hiện

- Nhánh review sạch: `agent/GROWTH-20260725-04-rebuild-v2-clean` trên `main` sau PR #119.
- PR #120 đã đóng không merge vì nhánh cũ lệch lịch sử sổ điều phối; không mất mã.
- PR thay thế được mở từ nhánh sạch và là nguồn duy nhất được phép merge.
- Chưa được ghi “production hoàn tất” cho đến khi PR sạch merge, Worker deploy trước Pages, catalog tái tạo và production smoke kiểm tra link offer thật.

## 8. Việc còn lại

1. CI chính thức trên PR sạch.
2. Sửa mọi regression do materializer/workflow.
3. Merge khi toàn bộ guard xanh.
4. Deploy Worker trước Pages.
5. Hậu kiểm production: năm URL, service worker V5, API `affiliate_only=true`, không URL thô, offer redirect deeplink sàn Việt Nam.
6. Kiểm tra trực tiếp WebKit/iPhone và cập nhật file này bằng commit/run evidence.
