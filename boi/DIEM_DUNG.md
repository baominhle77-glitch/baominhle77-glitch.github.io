# Điểm dừng web bói (`boi/`)

Cập nhật: 28/10/2026 (GMT+7). Task-ID: BOI-20261028-01. Nhánh: `claude/sleepy-babbage-z3mzgb`.

## Đã xong và đã merge vào `main`
- Phần 1 — ô “Lời gửi khách” `#loi-gui-khach` (PR #153): `boi/js/loi.js`, cổng kiểm + viết lại 1 lần + bản luật viết xuôi.
- Phần 2 — `window.BoiAuto.giai(cauHoi, {trai})` (PR #154): `boi/js/auto.js`, mỗi câu một seed mới, xếp hàng.
- Phần 3 — trang `boi/dao-tao/` (PR #155, `TIEN_DO.md` mục 27); mục 28: chuyển người cho ca hoàn tiền và tự hại.

## Ca khách gặng hỏi AI (phiếu v5, mục 29)
- Lần đầu: mẫu “Mình là trợ lý của Tarot debaderlis…”. Gặng lần 2 trở đi: agent tự trả lời thật “Mình là trợ lý tự động của Tarot debaderlis…”, không chuyển người, không chối.

## Tên khách (mục 30)
- `window.BoiAuto.giai(cauHoi, {trai, tenKhach})`; trống thì gọi “bạn”. Lời gửi khách không bao giờ dùng xưng hô trong Cài đặt.

## Lời gửi khách đọc từ nghĩa thật (mục 31) và nút Đào tạo (mục 32)
- Đường AI đang hỏng phía trạm (thử 28/10: quá giờ 60 s, rồi 429). Lý do hiện dưới ô Lời gửi khách và trong console `[loi-gui-khach]`.

## Bản luật trả lời thẳng + lọc ngữ cảnh (mục 33, PR #159, merge 1e491372)
- Câu thứ hai luôn trả lời gọn đúng câu hỏi (Có/Không nói rõ nghiêng về đâu); câu nghĩa lọc theo ngữ cảnh (người ấy ↔ độc thân, đi làm ↔ kinh doanh); cổng chặn “người độc thân” khi khách hỏi về một người cụ thể.

## Trạm 429 → cầu nối (mục 34)
- Trạm 429/quá giờ → dò cầu nối một lần (dù chưa bật cờ); có thì gọi lại qua cầu nối (nguồn “ai”, lyDo “trạm 429 → cầu nối”); không có → bản luật, lyDo “trạm 429, cầu nối không có → luật”.

## Agent tự chọn kiểu trải (mục 35)
- `BoiAuto.giai(q, {tenKhach})` không truyền trai → tự chọn theo câu hỏi (`suggestSpread`), trả `trai`, `tenTrai`, `lyDoTrai`. Trang đào tạo không còn ô Kiểu trải.

## Trang đào tạo nối lại khi đường hầm chập chờn (mục 36)
- Lỗi mạng → dò lại cầu nối rồi gửi lại 1 lần; 429 báo quá lượt; mẫu sửa lưu hỏng nằm ở hàng chờ `boi.daotao.mau-cho.v1`, tự gửi khi cầu nối sống.

## Việc còn lại (ngoài `boi/`, phiên máy nhà làm)
- Hai route `POST /tro_ly/tra_loi`, `POST/GET /tro_ly/mau_sua` trên cầu nối máy nhà (trang đào tạo đã gọi đúng khuôn, xem `boi/dao-tao/dao-tao-core.js`).
- Agent máy nhà áp đúng cổng chặn chữ như `kiemTraLoiAgent` (danh sách `CHU_CAM` trong `boi/js/loi.js`) và trả `{chuyen_nguoi:true, ly_do}` khi khách đòi hoàn tiền hoặc có ý tự hại; khi khách gặng hỏi lần 2 có phải AI không thì trả lời thật theo mẫu phiếu v5.
- Sổ khoá `docs/handover/ACTIVE_TASKS.json` chưa ghi BOI-20261028-01 (lệnh chỉ sửa `boi/**`), nên `coordination-guard` đỏ trên các PR này.

## Lệnh chạy lại
- `node boi/test.mjs` (58/58 đạt ngày 28/10/2026).
- Mở thử: https://baominhle77-glitch.github.io/boi/dao-tao/ (nút “Đào tạo nhắn tin” ở thanh tab dưới của web bói).
