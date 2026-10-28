# Điểm dừng web bói (`boi/`)

Cập nhật: 28/10/2026 (GMT+7). Task-ID: BOI-20261028-01. Nhánh: `claude/sleepy-babbage-z3mzgb`.

## Đã xong và đã merge vào `main`
- Phần 1 — ô “Lời gửi khách” `#loi-gui-khach` (PR #153): `boi/js/loi.js`, cổng kiểm + viết lại 1 lần + bản luật viết xuôi.
- Phần 2 — `window.BoiAuto.giai(cauHoi, {trai})` (PR #154): `boi/js/auto.js`, mỗi câu một seed mới, xếp hàng.
- Phần 3 — trang `boi/dao-tao/` (PR #155, `TIEN_DO.md` mục 27); mục 28: chuyển người cho ca hoàn tiền và tự hại.

## Ca khách gặng hỏi AI (phiếu v5, mục 29)
- Lần đầu: mẫu “Mình là trợ lý của Tarot debaderlis…”. Gặng lần 2 trở đi: agent tự trả lời thật “Mình là trợ lý tự động của Tarot debaderlis…”, không chuyển người, không chối.

## Việc còn lại (ngoài `boi/`, phiên máy nhà làm)
- Hai route `POST /tro_ly/tra_loi`, `POST/GET /tro_ly/mau_sua` trên cầu nối máy nhà (trang đào tạo đã gọi đúng khuôn, xem `boi/dao-tao/dao-tao-core.js`).
- Agent máy nhà áp đúng cổng chặn chữ như `kiemTraLoiAgent` (danh sách `CHU_CAM` trong `boi/js/loi.js`) và trả `{chuyen_nguoi:true, ly_do}` khi khách đòi hoàn tiền hoặc có ý tự hại; khi khách gặng hỏi lần 2 có phải AI không thì trả lời thật theo mẫu phiếu v5.
- Sổ khoá `docs/handover/ACTIVE_TASKS.json` chưa ghi BOI-20261028-01 (lệnh chỉ sửa `boi/**`), nên `coordination-guard` đỏ trên các PR này.

## Lệnh chạy lại
- `node boi/test.mjs` (40/40 đạt ngày 28/10/2026).
- Mở thử: https://baominhle77-glitch.github.io/boi/dao-tao/ (không có link từ trang khách).
