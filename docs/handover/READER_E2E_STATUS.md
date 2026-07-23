# Trạng thái E2E Reader production

- Trạng thái: `PENDING`
- Cập nhật: `2026-07-23T15:29:00+07:00`
- Task: `BOITOAN-20260723-08`
- Kịch bản bắt buộc: đăng ký Reader thật → đăng nhập thiết bị thứ hai → đọc `/me` → tự xóa → token cũ `401` → đăng nhập lại `401 invalid_login`.
- Chưa được coi là hoàn tất cho tới khi workflow production ghi `SUCCESS` cùng đầy đủ mã trạng thái.
