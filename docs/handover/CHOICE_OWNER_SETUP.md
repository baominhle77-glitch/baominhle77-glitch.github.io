# HỘI CHỌN ĐÚNG — TRUNG TÂM KẾT NỐI CHỦ SỞ HỮU

**Task-ID:** `GROWTH-20260725-02`  
**Trạng thái:** `in_progress`  
**Phân loại:** Owner/Internal — không công khai nội dung này trên website người dùng.

## Mục tiêu

- Chủ sở hữu chỉ thực hiện những bước bên thứ ba bắt buộc: đăng ký, đăng nhập, KYC, khai báo ngân hàng và cấp quyền.
- Công ty tự xử lý phần còn lại: lấy API key qua kênh riêng, tìm sản phẩm, tạo link affiliate, cập nhật web, SEO, đo click/đơn/hoa hồng và tối ưu.
- Tạo một Trung tâm kết nối owner-only, mở từ Telegram bằng vé một lần; không đặt liên kết trên public site.

## Kết nối dự kiến

1. ACCESSTRADE Publisher: đăng ký/đăng nhập, thông tin thanh toán, API key.
2. Google Search Console: xác minh property và cấp quyền service account khi cần.
3. Bing Webmaster Tools: đăng nhập miễn phí, import property từ Search Console hoặc xác minh trực tiếp.
4. Pinterest Business: tài khoản doanh nghiệp miễn phí để phục vụ phân phối nội dung hữu cơ sau khi có adapter và quyền hợp lệ.

## Nguyên tắc tiền và dữ liệu

- Hoa hồng affiliate thuộc tài khoản Publisher của chủ sở hữu.
- Không lưu thông tin ngân hàng trong repository hoặc public UI.
- Dashboard owner chỉ hiển thị dữ liệu kinh doanh tổng hợp; không lưu tên, email hoặc số điện thoại khách hàng.
- Không tự động đăng/spam lên tài khoản nền tảng khi chưa được cấp quyền và chưa có adapter đạt kiểm thử.

## Việc cần xác minh trước khi kết luận hoàn tất

- CI điều phối và regression.
- Route setup owner-only, vé một lần/cookie bảo mật/noindex.
- Mở rộng taxonomy và discovery đa lĩnh vực.
- SEO publisher sinh trang danh mục động cho mọi lĩnh vực được phép.
- Production smoke và ranh giới public/private.
