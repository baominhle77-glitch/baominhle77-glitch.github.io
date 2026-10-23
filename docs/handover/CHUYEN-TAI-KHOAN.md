# ĐỔI TÀI KHOẢN CLAUDE GIỮA CHỪNG — QUY TRÌNH

**Mục tiêu:** chuyển sang nick Claude khác bất cứ lúc nào (kể cả khi nick cũ hết hạn mức đột ngột) mà không mất tiến độ.

## Nguyên tắc cốt lõi

Repository GitHub là **trí nhớ chung duy nhất**. Mọi thứ chỉ nằm trong cuộc trò chuyện, trong container cloud hoặc trong tài khoản Claude cũ đều **không** sang được nick mới:

| Thứ | Có sang nick mới không? | Cách giữ |
|---|---|---|
| Code, tài liệu đã **push** lên GitHub | Có | Push sau mỗi lượt có thay đổi |
| Code đã sửa nhưng **chưa push** | Không (container bị thu hồi) | Commit + push ngay, kể cả việc dở (ghi "WIP") |
| Lịch sử chat, trí nhớ, Project, tùy chọn cá nhân của nick cũ | Không | Ghi điều quan trọng vào `DIEM-DUNG.md` / file bàn giao |
| Kết nối GitHub, connector, môi trường cloud (mạng, biến môi trường, setup script), lịch chạy tự động, Artifact | Không — gắn theo từng tài khoản | Thiết lập một lần cho mỗi nick (mục "Chuẩn bị") |
| Khóa API Claude nhập trong app Video Mô Phỏng | Gắn theo **trình duyệt**, không theo nick | Không cần làm gì nếu dùng cùng trình duyệt |

## Chuẩn bị một lần cho mỗi nick

1. Đăng nhập nick → kết nối GitHub tại https://claude.ai/connect-github và cấp quyền repository `baominhle77-glitch/baominhle77-glitch.github.io` cho Claude GitHub App.
2. Chép cùng một đoạn "Tùy chọn cá nhân" (Settings → Profile) sang mọi nick.
3. Nếu dùng Claude Code trên web: tạo môi trường cloud có cùng chế độ mạng giữa các nick.
4. Không lưu mật khẩu, token, khóa vào repository hay vào file bàn giao.

## Trước khi rời nick cũ (nếu còn kịp)

Gõ cho Claude: **"Chốt điểm dừng"** — Claude sẽ cập nhật `docs/handover/DIEM-DUNG.md`, commit và push. Nếu nick cũ bị chặn đột ngột thì bỏ qua: theo `CLAUDE.md`, điểm dừng đã được cập nhật sau mỗi lượt trả lời.

## Mở đầu trên nick mới — dán nguyên câu này

```
Tiếp tục dự án trong repo baominhle77-glitch/baominhle77-glitch.github.io.
Đọc CLAUDE.md, AGENTS.md rồi docs/handover/DIEM-DUNG.md; làm tiếp đúng nhánh và
bước tiếp theo ghi ở đó (tôi cho phép dùng nhánh ghi trong DIEM-DUNG.md thay cho
nhánh mặc định của phiên). Tóm tắt cho tôi tình trạng hiện tại trước khi sửa gì.
```

## Xử lý khóa task bị bỏ dở

Khi nick cũ dừng giữa chừng, task trong `ACTIVE_TASKS.json` có thể vẫn ở `in_progress`. Nếu `DIEM-DUNG.md` xác nhận task đó do chính chủ dự án đang làm, phiên mới **nhận lại cùng Task-ID** (cập nhật `heartbeat_at`, ghi nhật ký "tiếp quản từ phiên trước") chứ không tạo task mới chồng phạm vi.
