# Bàn giao Admin V8 — Spirituality Market

- Hoàn tất: 23/07/2026, GMT+7.
- Vấn đề gốc: phép PBKDF2 200.000 vòng trong Cloudflare Worker có thể lỗi/vượt ngân sách CPU; lỗi bị catch và hiển thị nhầm thành “Mật khẩu Admin không đúng”.
- Giải pháp V8: PBKDF2-SHA256 10.000 vòng phù hợp edge, salt/hash riêng được ghim trong `backend/wrangler.toml`, auth version V8, trim khoảng trắng, lỗi crypto trả `admin_auth_unavailable` thay vì giả thành sai mật khẩu.
- Hai cấp quyền giữ nguyên: `regular` và `primary`; JWT gắn thiết bị; chỉ một thiết bị Admin tổng hoạt động.
- Cache Bói toán: `boitoan-v16`.

## Bằng chứng

- CI điều phối: `30013651155` — success.
- CI Account V8 build/frontend/Worker/health: `30013651230` — success.
- Runtime V8 merge: `6ff652bd1159f5ca4aa6ad8c57598437e9eaad65`.
- Workflow bằng chứng merge: `b6b9e742fd4a4ccaf232e88b7c511aaf9cf89bf8`.
- Deploy production: `30014457630`.
- Verification production: `30014502155` — success.
- `docs/handover/ADMIN_V8_PRODUCTION_STATUS.md` xác nhận frontend HTTP 200, `config_ok=true`, `crypto_ok=true`, PBKDF2 10.000 vòng và đường login production thực thi crypto bình thường.

## Nghiệm thu người dùng

Mở `https://hiennhi89.pages.dev/boitoan/?v=16`, chọn Admin và nhập mật khẩu của cấp cần sử dụng. Mật khẩu thật không được ghi trong repository hoặc workflow.
