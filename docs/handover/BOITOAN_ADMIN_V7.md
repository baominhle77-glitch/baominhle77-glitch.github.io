# Bàn giao Admin V7 — BOITOAN-20260723-11

**Hoàn tất:** 23/07/2026 20:23 (GMT+7)  
**Trạng thái:** `COMPLETED / PRODUCTION SUCCESS`

## Phản hồi nghiệm thu thực tế

Người dùng kiểm tra trên iPhone và xác nhận ba lỗi:

1. mở link Bói toán tự khôi phục phiên Admin cũ dù đã bấm Khóa/đăng xuất;
2. nhập đúng mật khẩu Admin tổng nhưng backend trả `invalid_admin_login`;
3. trang Quản trị mở, hiện tải dữ liệu rồi bị trả nhanh về app vì token và cấp quyền local không đồng nhất với server.

## Nguyên nhân đã xác lập

- Account V6 dùng lại tên biến cấu hình salt/hash của V5–V6. Biến salt cũ còn tồn tại trên Cloudflare có thể ghi đè salt mặc định mới, khiến hash không khớp dù người dùng nhập đúng mật khẩu.
- Nút `Khóa` trước đây chỉ xóa gate session/token, không xóa toàn bộ `market_admin_*` và không thu hồi JWT Admin.
- App chính chỉ dựa vào cờ localStorage để hiện badge/lối Quản trị; chưa kiểm tra phiên bản auth và chưa xác nhận JWT với backend trước khi hiển thị.
- Trang Quản trị có thể render trạng thái/tab trước khi server trả kết quả xác thực, gây hiện nhanh rồi chuyển trang.

## Sửa V7

- Tách namespace cấu hình mật khẩu thành `ADMIN_V7_*`, bỏ qua toàn bộ biến salt/hash/iterations V5–V6 còn sót trên Cloudflare.
- Tăng `ADMIN_AUTH_VERSION` lên `2026-07-23-v7`; phiên Admin cũ tự mất hiệu lực.
- Trước mỗi lần đăng nhập Admin mới: thu hồi JWT cũ và xóa sạch trạng thái Admin local.
- Nút `Khóa` bắt buộc xóa toàn bộ phiên Admin và gửi yêu cầu thu hồi phiên backend.
- App chính chỉ nhận là Admin khi có đủ token, level `regular|primary`, auth version V7 và không có hồ sơ member; sau đó còn xác nhận `/api/community/admin/session` với backend.
- Trang Quản trị ẩn dữ liệu và các tab cho đến khi server xác nhận phiên hợp lệ.
- Phiên cũ/không hợp lệ được chuyển về form Admin có cờ `reauth=1`, không còn vòng mở trang rồi quay lại liên tục.
- Cache Bói toán tăng từ `v14` lên `v15` để iPhone nhận asset mới.

## Phân quyền giữ nguyên

- `regular`: quản lý/khóa/xóa member, xóa review, quản lý bài thảo luận; không đọc hội thoại riêng và không impersonate member.
- `primary`: toàn bộ quyền regular, thêm đọc hội thoại riêng và mở trang cá nhân member chỉ đọc; chỉ một thiết bị primary hoạt động.

## Bảo mật

- Không ghi mật khẩu Admin dạng rõ vào source, test, log hoặc tài liệu.
- Mật khẩu tiếp tục được kiểm tra bằng PBKDF2-SHA256 hash + salt.
- `ADMIN_TOKEN` cũ không được chấp nhận tại Community API.
- JWT Admin gắn `device_id`, level, auth version và bản ghi phiên KV.

## Bằng chứng kiểm thử và production

- PR runtime: `#70`.
- Coordination CI: run `30010743764` — `SUCCESS`.
- Account V7 build/frontend/Worker CI: run `30010743857` — `SUCCESS`.
- Test backend cố ý cung cấp cấu hình V5–V6 sai; cả regular và primary V7 vẫn đăng nhập đúng bằng cấu hình V7.
- Merge production source: `abe06500e237870c13690d5c9eca26957e19d18d`.
- Deploy workflow: run `30010842776`.
- Cloudflare Pages / Worker / hậu kiểm: `success / success / success`.
- Production status recorder commit: `c25ac673396d6d52b5724abe8394f99747fceb4e`.

## Nghiệm thu người dùng cần thực hiện

1. Mở lại `https://hiennhi89.pages.dev/boitoan/`.
2. Nếu tab cũ vẫn đang mở, tải lại trang một lần để Service Worker v15 nhận quyền kiểm soát.
3. Chọn `Admin` và đăng nhập lại bằng mật khẩu của cấp cần dùng.
4. Với Admin tổng, badge phải hiển thị `Admin tổng · Mở quản trị`; trang Quản trị phải đứng yên, tải dữ liệu và hiện tab Hội thoại.
5. Bấm `Khóa` rồi mở lại: app không được tự khôi phục phiên Admin vừa đăng xuất.
