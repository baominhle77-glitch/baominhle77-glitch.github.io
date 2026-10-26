# Tiến độ web Bói Tarot + Lenormand (`boi/`)

Nhánh hiện tại: `agent/BOI-20261025-03` (trước: `claude/boi-web`) → PR vào `main` (GitHub Pages phục vụ từ `main`). Link: https://baominhle77-glitch.github.io/boi/
Spec gốc + bản bổ sung (SPA nhiều màn, thiết kế cao cấp, PWA, AI chính khi có khoá, động cơ luật sâu).

| Phần | Trạng thái |
|---|---|
| 1. Khung trang (index.html, css) | xong (viết lại thành SPA ở phần 10) |
| 2. Dữ liệu lá (data/*.json; sinh từ tools/gen-data.mjs) | xong |
| 3. Cơ chế xáo/khoá (js/core.js, state.js, parser.js, spreads.js) | xong |
| 4. Giải bài cơ bản (js/reading.js) | xong |
| 5. Quy đổi tiền (js/money.js) | xong |
| 6. Test lõi (test.mjs) | xong |
| 7. Nhận diện chủ đề + gợi ý mẫu trải (js/topic.js; thêm mẫu Tình cảm) | xong |
| 8. Động cơ luật sâu (js/insight.js, js/markdown.js) + MAU_GIAI.md (sinh bằng tools/mau-giai.mjs) + 3 ca test | xong |
| 9. Mặt lá SVG riêng từng lá (js/cards.js) | xong |
| 10. SPA hash router + 10 màn + thiết kế (index.html, css, js/app.js, js/views.js, js/store.js) | xong, đã chạy e2e Playwright (Pixel 7) không lỗi |
| 11. AI: Gemini mặc định, dò model mạnh nhất + dự phòng 429/404, JSON có cấu trúc, streaming, hỏi tiếp (js/ai.js) | xong (chưa thử với khoá thật — không có khoá trong phiên này) |
| 12. PWA (manifest.webmanifest, sw.js, icons/) | xong |
| 13. Kiểm trình duyệt + Lighthouse | xong: e2e Pixel 7 không lỗi; offline chạy; Lighthouse mobile (local, chưa nén) Perf 94–95, A11y 100, BP 100 |
| 14. Sổ khoá (BOI-20261025-01) + PR + merge + kiểm link | PR https://github.com/baominhle77-glitch/baominhle77-glitch.github.io/pull/138 — CI xanh (coordination-guard, validate, handover), tự merge; link Pages kiểm 200 sau merge |
| 15. Kho tri thức giải offline (data/tarot_them.json, data/lenormand_them.json; app.js nạp tuỳ chọn qua mergeKnowledge): Tarot 78 lá theo chủ đề tiền/tình/công việc/sức khoẻ/lời khuyên, Lenormand 36 lá + 1260 cặp | xong; **đã đối chiếu** ở phần 19 |
| 16. Cầu nối AI máy nhà (E:/Studio/tools/boi_cau_noi_ai.mjs, 127.0.0.1:8787, task Windows "BOI Cau Noi AI" chạy lúc đăng nhập): web tự dò, có cầu thì dùng khoá trên máy, không cần dán khoá | xong, đã thử thật: bản giải AI chạy qua cầu |
| 17. Danh sách model Gemini mới (bỏ model đã ngừng; dò 8 model mạnh nhất + bí danh -latest) | xong |
| 18. Gộp kho tri thức đủ: Tarot 78/78, Lenormand 36/36, cặp 1260/1260, lỗi 0; test 14/14 | xong |
| 19. Đối chiếu nghĩa phần 15 (BOI-20261025-03) | xong. Cách làm: (a) kiểm chéo cực tính Có/Không của 78 lá Tarot + 36 lá Lenormand với điểm `diem_chung` của dữ liệu gốc — không lá tiêu cực nào trả Có, không lá tích cực nào trả Không; (b) soát theo quy ước RWS / Petit Lenormand phổ biến; (c) quét văn bản 78 lá + 36 lá + 1260 cặp: không ký tự lạ, không chữ Anh sót, không trường rỗng, đủ 1260/1260 cặp có đủ c/t/v; (d) đọc mẫu các lá nặng (Tử Thần, Ác Quỷ, Toà Tháp, 3/10 Kiếm, 5 Tiền, Mặt Trăng) và 6 cặp Lenormand — khớp nghĩa chuẩn. Sửa: Mặt Trời ngược “Có” → “Có, có điều kiện” (bỏ chữ “luôn”); Mặt Trăng ngược “Có” → “Chưa rõ” (sáng tỏ ≠ Có). Giới hạn: không tra mạng từng lá; nguồn mạng về Có/Không chủ yếu là blog Tarot, chỉ là truyền thống diễn giải, không phải chuẩn tuyệt đối |
| 20. Có/Không theo ngữ cảnh cho 4 lá Tiền (Át, 4, Hiệp Sĩ, Vua Tiền) — trước đây trả “Có” cố định | xong: `co_khong.ngu_canh` trong data/tarot_them.json (nhóm khớp nguyên từ theo câu hỏi: giữ/chi, bắt đầu/buông, nhanh/liều, tiền/tình); `cardYesNo()` ở js/data.js; động cơ luật (js/insight.js) và prompt AI (js/ai.js) đều dùng câu trả lời theo câu hỏi, cả lá ngược. Ví dụ 4 Tiền: “tiết kiệm được không” → Có; “có nên đầu tư” → Nghiêng Không |
| 21. Web chắc chắn | xong: chuyển trang chỉ trượt phần nội dung (thanh trên/tab đứng yên), trượt theo chiều đi/về, quay lại thì về đúng chỗ đang cuộn; dò lại cầu nối 127.0.0.1:8787 khi quay lại tab/có mạng; cầu nối hoặc AI lỗi → câu báo dễ hiểu + bản giải offline hiện ngay, quá 60 giây không có chữ thì tự dừng chờ; sw.js lên `boi-v4` để máy cũ nhận bản mới. Khoá API không nằm trong mã (quét chuỗi khoá: 0). e2e Playwright Pixel 7: không lỗi trang, không tràn ngang (412/412), lỗi cầu nối rơi về offline đúng |
| 22. Gọi trạm AI (Google Apps Script) làm mặc định — lệnh GĐ, Chủ tịch duyệt (26/10/2026) | xong trên nhánh `claude/determined-brown-r799sm` (PR riêng, chưa merge). `js/ai.js`: `TRAM_URL`, POST `text/plain;charset=utf-8`, `redirect: "follow"`, dừng sau 60 s; `{ok,model,data}` → chữ ở `data.candidates[0].content.parts[*].text` (bỏ phần thought); lỗi → 429 “Đang đông người hỏi, thử lại sau ít phút”, mạng hỏng “Không kết nối được máy giải, kiểm tra mạng”, khác “Máy giải đang bận”, rồi hiện **bản giải theo luật**. Dòng “Giải bởi AI (<model>)” dưới bài. Bỏ ô nhập khoá/chọn nhà cung cấp/model trong Cài đặt; khoá cũ đã dán bị xoá khỏi máy. Cầu nối 127.0.0.1/đường hầm chỉ còn là lựa chọn ẩn: link `?cau-noi=1` (tắt `?cau-noi=0`) hoặc `?ghep=<mã>`. `sw.js` lên `boi-v6`, không cache `script.google.com`/`script.googleusercontent.com`. Test 17/17. **Đã biết (phía trạm):** ngày 26/10 trạm trả `404` cho model `gemini-flash-latest` vì chuỗi dự phòng kết thúc ở `gemini-2.5-flash` (đã ngừng); có lượt treo > 60 s → web báo “Máy giải đang bận” + bản luật. Cần sửa chuỗi model trong trạm |

Đã xong 22 phần. Lớp AI đã thử với khoá Gemini thật qua cầu nối máy nhà. Chạy test: `node boi/test.mjs` (17/17 đạt ngày 26/10/2026).
