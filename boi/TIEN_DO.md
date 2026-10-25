# Tiến độ web Bói Tarot + Lenormand (`boi/`)

Nhánh: `claude/boi-web` → PR vào `main` (GitHub Pages phục vụ từ `main`). Link: https://baominhle77-glitch.github.io/boi/
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
| 15. Kho tri thức giải offline (data/tarot_them.json, data/lenormand_them.json; app.js nạp tuỳ chọn qua mergeKnowledge): Tarot 78 lá theo chủ đề tiền/tình/công việc/sức khoẻ/lời khuyên, Lenormand 36 lá + 1260 cặp | xong (sinh bằng Gemini/Gemma, chưa đối chiếu tra mạng — sẽ chạy lượt đối chiếu riêng) |
| 16. Cầu nối AI máy nhà (E:/Studio/tools/boi_cau_noi_ai.mjs, 127.0.0.1:8787, task Windows "BOI Cau Noi AI" chạy lúc đăng nhập): web tự dò, có cầu thì dùng khoá trên máy, không cần dán khoá | xong, đã thử thật: bản giải AI chạy qua cầu |
| 17. Danh sách model Gemini mới (bỏ model đã ngừng; dò 8 model mạnh nhất + bí danh -latest) | xong |
| 18. Gộp kho tri thức đủ: Tarot 78/78, Lenormand 36/36, cặp 1260/1260, lỗi 0; test 14/14 | xong |

Đã xong 18 phần. Lớp AI đã thử với khoá Gemini thật qua cầu nối máy nhà. Chạy test: `node boi/test.mjs`.
