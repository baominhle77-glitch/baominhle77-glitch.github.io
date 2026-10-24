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
| 9. Mặt lá SVG riêng từng lá (js/cards.js) | chưa |
| 10. SPA hash router + các màn + thiết kế (index.html, css, js/app.js, js/views.js) | chưa |
| 11. AI: Gemini mặc định, model dự phòng, JSON có cấu trúc, streaming, hỏi tiếp (js/ai.js) | chưa |
| 12. PWA (manifest, sw.js, icon) | chưa |
| 13. Kiểm trình duyệt + Lighthouse | chưa |
| 14. Sổ khoá + PR + merge + kiểm link | chưa |

Bước tiếp theo: dòng "chưa" đầu tiên. Chạy test: `node boi/test.mjs`.
