# Học từ mã nguồn mở — Xưởng Video Mô Phỏng

**Lệnh:** GĐ Studio `gd-20261024-1220` (Chủ tịch duyệt 24/10/2026), mục 2. **Task:** `EDU-20261024-04`.
**Người đọc:** Claude Code, 24/10/2026, bản sao nông (`git clone --depth 1`) đọc trong môi trường làm việc. Chỉ ghi điều đã đọc thật trong mã/tài liệu; chỗ nào là suy luận của tôi thì ghi rõ "(suy luận)".

## 1. HyperFrames — `github.com/heygen-com/hyperframes` (Apache-2.0)

Commit đã đọc: `3596a7f22bcceeb562c010ad7bab37e4e84fc7c3` (2026-10-24).

**Tệp đã đọc**
- `README.md` — định vị: "turning HTML, CSS, media, and seekable animations into deterministic MP4 videos".
- `docs/concepts/determinism.mdx` — luật tất định.
- `docs/concepts/frame-adapters.mdx` — giao diện `FrameAdapter`.
- `docs/concepts/compositions.mdx` — composition lồng nhau, `data-start` / `data-duration`.
- `skills/hyperframes/references/motion.md` — số đo chuyển động từ phim ra mắt của họ.
- `skills/hyperframes/references/captions.md` — luật phụ đề theo mốc từ.
- `registry/blocks/camera-dolly-zoom/registry-item.json` — mẫu khai báo khối (tên, mô tả, thời lượng, biến có kiểu và khoảng).
- Danh mục `packages/lint/src/rules/` (captions, composition, fonts, media, structure…) — có bước lint chặn render.

**Ý tưởng chính**
1. *Khung N chỉ phụ thuộc số N*: `time = floor(frame) / fps`, không bao giờ hỏi đồng hồ. Cấm `Date.now`, `requestAnimationFrame`, `Math.random` không hạt giống, tải tài nguyên giữa lúc render.
2. *Hợp đồng adapter*: `getDurationFrames()`, `seekFrame(frame)` tua tới/lui/ngẫu nhiên đều cho cùng trạng thái; vòng đời `init → seekFrame* → destroy`.
3. *Xem trước và xuất dùng chung một runtime*: xem trước chỉ khác ở chỗ chạy theo thời gian thực, nên có thể giật; xuất không bao giờ rớt khung.
4. *Khối có schema*: mỗi khối khai `variables` có kiểu, khoảng, mặc định, kèm mô tả "khi nào dùng / cần gì".
5. *Chuyển động có số đo* (motion.md): vào chậm, ra gọn; ease theo vai trò (đến `expo.out`/`power4.out`, camera `power2.inOut`, zoom xuyên/ra `power3.in`); thoát ngắn hơn vào 40–50 %; chồng lấp 30–50 %; so le chữ 1 khung, từ 60–120 ms, mục danh sách 40–80 ms. Tiêu đề đã đáp thì đứng yên, chuyển động dời sang camera/thế giới. Danh sách "mặc định trông như máy làm": thở/nổi/nhấp nháy giả chuyển động, mọi thứ trượt lên mờ dần.
6. *Chuyển cảnh có nguyên nhân*: 3–5 kiểu mỗi phim; tối đa 1/3 mối nối là cắt cứng; có bảng cách dựng (zoom xuyên vật, vật thành thế giới, morph, ngập màu, quét, mống mắt…).
7. *Phụ đề*: nhóm 2–3 từ (năng lượng cao), 3–5 (trò chuyện); ngắt ở cuối câu hoặc khoảng lặng ≥ 150 ms; một nhóm hiện một lúc; không mở đúng 0 s; ngang 80–120 px từ đáy, dọc ~600–700 px từ đáy; khớp từ theo vị trí, không theo chữ.
8. *Lint trước render*: có quy tắc cho chữ, phông, cấu trúc, phụ đề; lỗi chặn render (`shouldBlockRender.ts`).

**Áp dụng vào Xưởng**
- `engine/thoigian.js`: `t = i / fps` với `i` nguyên; `render(t)` thuần, tua mọi thứ tự (mục 1–3).
- Mô phỏng tích phân bước cố định từ 0 với checkpoint 1 s để tua lùi nhanh (mở rộng ý 1 cho vật lý).
- Khối có khai báo (`id`, `thoi_luong`, tham số có khoảng) — ý 4.
- Bảng ease theo vai trò + thời lượng + so le — ý 5, khớp mục 3 của skill `video-chat-luong-cao`.
- Phụ đề động nhóm 2–5 từ theo `words.json` — ý 7.
- Bộ kiểm trước xuất (chữ trong vùng an toàn, không vào vùng cấm PiP, tương phản) — ý 8, phục vụ mục cứng H2.
- **Không chép mã** HyperFrames vào repo ở bản này (chỉ dùng ý tưởng), nên chưa cần thông báo bản quyền Apache-2.0. Nếu sau này chép, phải giữ thông báo.

## 2. Motion Canvas — `github.com/motion-canvas/motion-canvas` (MIT)

Commit đã đọc: `7b91435c301d530351dcf5ebb91dd139c002e405` (2026-07-02).

**Tệp đã đọc**
- `packages/core/src/tweening/tween.ts` — tween là generator chạy theo `thread.fixed` (thời gian cố định của luồng), không theo đồng hồ.
- `packages/core/src/tweening/timingFunctions.ts` — bộ easing Penner đầy đủ (sine, quad, cubic, quart, quint, expo, circ, back, elastic, bounce) và `linear`.
- `packages/core/src/tweening/spring.ts` — spring tích phân theo bước (mass, stiffness, damping, settleTolerance).
- `packages/core/src/flow/sequence.ts` — `sequence(delay, ...tasks)`: so le các tác vụ.
- Danh mục `packages/core/src/{flow,signals,threading}` — `all`, `any`, `chain`, `delay`, `loop`, `waitFor`; signals có `createComputed`, `createEffect`.
- `packages/2d/src/lib/components/Camera.ts` — camera là một Node: `zoom`, `centerOn(node|vector, duration)`, `followCurve`.
- `packages/2d/src/lib/components/Node.ts` — `localToParent`, `localToWorld` nhân ma trận cha-con; `absoluteScale`; cache canvas theo node.

**Ý tưởng chính**
1. *Thời gian của luồng là nguồn sự thật*: mọi tween đọc thời gian cố định, nên dựng lại ở bất kỳ khung nào cũng ra cùng kết quả.
2. *Cảnh viết như kịch bản tuần tự* (generator `yield*`), với `all`/`chain`/`sequence` để song song, nối tiếp, so le.
3. *Đồ thị cảnh*: node có transform cục bộ, ma trận thế giới = cha × cục bộ; camera là node nên lia/zoom = tween thuộc tính camera.
4. *Signals*: giá trị phụ thuộc giá trị khác được tính lại tự động (ví dụ nhãn bám theo vật).

**Áp dụng vào Xưởng**
- `engine/easing.js`: viết lại bộ easing Penner theo công thức chuẩn (power/expo/back/sine), có tên kiểu GSAP (`power3.out`…) để khớp skill.
- `engine/canh.js`: node `{x, y, scale, rotation, opacity, children}`, vẽ đệ quy với `ctx.save/translate/rotate/scale`; camera là node gốc.
- Dòng thời gian: thay vì generator (khó tua lùi ngẫu nhiên), tôi chọn **danh sách tween khai báo có thời điểm tuyệt đối**, giá trị tại `t` tính trực tiếp, tua mọi thứ tự O(số tween) (suy luận: generator của Motion Canvas phải chạy lại từ đầu khi tua lùi).
- Thuộc tính tính được (signals) → hàm `(t) => giá trị` gắn vào node (ví dụ nhãn bám mép vũng nước).
- **Không chép mã** Motion Canvas ở bản này; công thức Penner là công thức công khai.

## 3. Remotion — `github.com/remotion-dev/remotion` (giấy phép riêng: miễn phí cho cá nhân/công ty nhỏ, công ty lớn cần giấy phép) — CHỈ đọc khái niệm, KHÔNG chép mã

Commit đã đọc: `c81a206c5f6a6e285d2586f0d4d117db04316125` (2026-10-24). Chỉ đọc tài liệu.

**Tệp đã đọc**
- `LICENSE.md` — để biết vì sao không được chép.
- `packages/docs/docs/spring.mdx` — `spring({frame, fps, config})`: spring là hàm của số khung, bắt đầu ở khung 0, dịch thời điểm bằng `frame - 20`.
- Tên tệp trong `packages/core/src/`: `interpolate.ts`, `interpolate-colors.ts`, `easing.ts`, `Sequence.tsx`, `use-current-frame.ts` — xác nhận bộ khái niệm.

**Khái niệm học được**
- `useCurrentFrame()`: thành phần chỉ biết số khung hiện tại.
- `interpolate(frame, [in…], [out…], {extrapolate})`: ánh xạ khoảng → khoảng, có kẹp.
- `spring` là hàm thuần của khung (không cần trạng thái) → khung nào cũng dựng độc lập được.
- `Sequence from/durationInFrames`: dời gốc thời gian cho một nhánh con.

**Áp dụng vào Xưởng** (tự viết, không chép)
- `lerpKhoang(t, [t0,t1], [a,b])` có kẹp; `springDong(t, {damping})` dạng nghiệm đóng của dao động tắt dần (công thức vật lý chuẩn), để mọi khung tính độc lập.
- Mỗi beat có gốc thời gian riêng (`t - beat.batDau`), giống `Sequence`.

## 4. Quyết định công cụ

| Việc | Chọn | Lý do |
|---|---|---|
| Tween/easing | Tự viết (Penner) | Tất định, nhỏ, không phụ thuộc. GSAP có "Standard No-Charge License" (không phải mã nguồn mở) với điều khoản về công cụ cạnh tranh dựng hoạt hình; Xưởng là công cụ dựng video nên tránh rủi ro (skill mục 6 cho phép thay bằng tự viết). |
| Ghép MP4 | `mp4-muxer@5.2.2` (MIT, ghim, có bản quyền kèm) | Đúng lệnh GĐ. Tác giả đã ghi "superseded by Mediabunny" (Mediabunny là MPL-2.0) — giữ mp4-muxer vì lệnh nêu đích danh và giấy phép MIT đơn giản hơn. |
| Mã hoá | WebCodecs `VideoEncoder` | H.264 `avc1.640028` nếu trình duyệt có; không có thì VP9 `vp09.00.40.08`. Chromium trong môi trường thử của tôi KHÔNG có H.264 (đã đo `isConfigSupported`: avc1 false, vp09/av01 true, opus true, mp4a false). |
| Âm thanh | `AudioContext.decodeAudioData` → `AudioEncoder` (AAC nếu có, không thì Opus) | Nạp tệp giọng edge-tts của Studio; không dùng `speechSynthesis` cho bản xuất. |
| Phông K1 | Source Sans 3 (OFL-1.1, `@fontsource/source-sans-3`) | Đúng khuôn K1 (phương án thay Segoe UI); nhúng tệp phông vào repo để canvas vẽ tất định, không tải giữa lúc render. |

## 5. Chưa đọc trong lượt này

- `3b1b/manim` / ManimCommunity (skill mục 7 có nêu; lệnh GĐ mục 2 không nêu). Sẽ đọc khi dựng khối công thức/biến hình.
