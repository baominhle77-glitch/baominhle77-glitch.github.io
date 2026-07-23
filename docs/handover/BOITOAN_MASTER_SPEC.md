# BÓI TOÁN / SPIRITUALITY MARKET — ĐẶC TẢ CHUẨN DUY NHẤT

Cập nhật: 24/07/2026 (GMT+7) — Bói toán V11.

## 1. Mục tiêu

Một PWA mobile-first chứa các công cụ Tarot, Lenormand, Bài Tây, Kinh Dịch, Tử Vi, Bát Tự, thần số học, lịch/tra cứu và lịch sử. Nội dung thuật toán gốc phải giữ nguyên; các hộp “Khung luận AI” và “Kết nối toàn trải bài” đã bị loại bỏ theo yêu cầu.

## 2. Một cửa đăng nhập

Màn đầu chỉ có ba lựa chọn: Đăng nhập, Đăng ký, Admin. Không render đồng thời nhiều form.

- Khách: xem bài, tìm Reader, chat, review và thảo luận.
- Reader / Người xem bói: hồ sơ chuyên môn, chuyên môn, dữ liệu nhận phí/QR không chứa liên kết, quản lý khách và gửi luận giải.
- Admin thường: quản lý member, review và bài thảo luận; không đọc chat riêng và không impersonate member.
- Admin tổng: toàn bộ quyền Admin thường, đọc toàn bộ hội thoại và mở trang cá nhân member bằng impersonation chỉ đọc; chỉ một thiết bị primary hoạt động.

## 3. Dữ liệu và quyền

- Member password không lưu plaintext; phiên member 30 ngày.
- Review 1–5 sao: khách gỡ review của mình; Admin gỡ; Reader không gỡ.
- Chat Khách–Reader và dữ liệu liên quan có TTL 30 ngày.
- Admin tổng chỉ đọc khi impersonate; backend chặn mọi mutation.
- Mọi quyền nhạy cảm được cưỡng chế ở backend, không chỉ ẩn nút UI.
- Mật khẩu, token, secret, chat riêng, QR thật và mã thiết bị không commit vào repository.

## 4. Luồng mở ứng dụng V11

`#gate-content` chứa payload AES-GCM. Mọi loại phiên đều phải đi qua **một hàm duy nhất**:

1. backend xác thực phiên;
2. backend trả `key` giải mã qua HTTPS cho phiên hợp lệ;
3. frontend gọi `openAppContent(key)`;
4. `decryptPayload` → `injectHtml` → xác nhận DOM không rỗng → `reveal`;
5. nếu thiếu/sai key hoặc phiên lỗi: xóa phiên tương ứng và quay về cổng, tuyệt đối không reveal trang rỗng.

Không được kiểm thử Admin bằng fixture plaintext. Fixture WebKit phải dùng payload AES thật và chỉ đạt khi nội dung hiển thị thực tế.

## 5. Source và deploy

- Repository là nguồn chuẩn duy nhất.
- `assets/gate.js`, `assets/community*.js`, `backend/community.js`, `boitoan/*` là source production trực tiếp.
- Các runner patch V2–V10 là legacy/no-op; build không được tự sửa Bói toán.
- Deploy Worker trước Pages để frontend mới không gặp backend cũ.
- Smoke test bắt buộc kiểm `/boitoan/`, payload, asset version, Community/Admin và API session.
- WebKit hậu kiểm production bắt buộc xác nhận gate-content có nội dung và `.screen.active` hiển thị.

## 6. Quy tắc thay đổi

Giữ các kiểm soát bảo mật và test có giá trị. Bỏ mọi lớp patch, test marker giả hoặc quy trình chỉ tạo “xanh” nhưng không kiểm trải nghiệm thật. Không tuyên bố hoàn tất trước khi CI, deploy, WebKit production và nghiệm thu iPhone đều đạt.
