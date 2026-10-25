# LUẬT BẢN SẮC KÊNH

**Bắt buộc.** SX, NC, KĐ và GĐ đọc trước khi viết, dựng hoặc chấm bất kỳ video nào.

- **Ban hành:** GĐ, 25/09/2026, theo lệnh Chủ tịch 25/09, ý 2.
- **Liên kết:** từ mục C10 của `00_YEU_CAU_BAT_DI_BAT_DICH.md`. Đọc cùng `LUAT_NGUYEN_BAN_VA_RUI_RO.md`.
- **Thay thế:** cột "Bản sắc hình" của `out\_giam_doc\5_MAU_BAN_SAC.md`.

## 0. Vì sao phải có luật này: bằng chứng đo được

Chủ tịch nhận xét 25/09: khác kênh, khác chủ đề mà vẫn chung màu mè, chung kiểu giao diện, trông như sản xuất hàng loạt. Đo lại thì **đúng như vậy**, dù màu hai mẫu rất khác nhau. Số đo chi tiết ở `LUAT_NGUYEN_BAN_VA_RUI_RO.md` §6.

**"Khuôn chung" mẫu 1 và mẫu 2 đang dùng.** Từ nay KHÔNG kênh nào được dùng chung các thứ này:

| # | Thành phần chung | Bằng chứng |
|---|---|---|
| 1 | Nền tối gần đen | Mode độ sáng nền: M1 = 15–25 (mã `#0A1628` có Y = 20,75, nằm ngay biên bin 20; khung giải mã từ mp4 có Y = 19), M2 = 5 (thang 0–255). Sửa theo K41-4 |
| 2 | Nét sáng trên nền trống | Chỉ 17 % và 3 % điểm ảnh có màu |
| 3 | Chuyển cảnh toàn màn bằng mờ dần | `FadeOut` mọi phần tử trong `end()`: M1 `canh.py:247–249`, M2 `:199–201`. **Số lần `FadeIn` (142 và 122) KHÔNG phải bằng chứng**, vì con số này không phân biệt phần tử lẻ với chuyển cảnh (K41-1) |
| 4 | Nhãn "chip" bo góc | `SurroundingRectangle(corner_radius=…)` bao quanh chữ: M1 `:84`, `:89`; M2 `:77`. Hai `RoundedRectangle` của M2 là đầu dò và vỏ thạch anh, **không phải chip**. Luật cũ đếm nhầm vật (K41-1) |
| 5 | Dòng nguồn chạy ở đáy, tiêu đề in hoa đậm ở trên giữa, bố cục đối xứng giữa màn | Xem khung |
| 6 | Hoạt cảnh mặc định của Manim (`Create`, `Write`, `Transform`) | `Create` 13 và 24 lần, `Transform` 1 và 2 lần (KĐ, phiếu 41) |

➜ **Màu chỉ là một trục.** Hai kênh khác màu mà cùng ngữ pháp hình thì vẫn là **một khuôn**.

## 1. Năm nguyên tắc

- **N1. Mỗi kênh là một "thế giới vật liệu" riêng, suy ra từ chính lĩnh vực của kênh**, không chọn màu tuỳ hứng.
  - Nước → bàn quang học trong studio. UART → màn máy hiện sóng. Địa chất → sổ thực địa và lát đá. Ô tô → bản vẽ kỹ thuật. Quân sự → bản đồ địa hình.
  - Kênh mới phải chọn một thế giới vật liệu **chưa kênh nào dùng**.
- **N2. Không có thành phần hình dùng chung giữa các kênh.**
  - Mỗi kênh một module riêng `E:\Studio\ban_sac\K<n>_<ten>.py`, chứa: màu, chữ, nhãn, mũi tên, khung, chuyển cảnh, cách hiện nguồn, khuôn hook.
  - `canh.py` chỉ được import module của **kênh mình**.
  - Thư viện chung chỉ chứa thứ **không nhìn thấy trên màn**: tính toán, ghép tiếng, xuất file.
- **N3. Khác nhau trên 13 trục (bảng §2).**
  - Mỗi cặp kênh phải khác nhau ở **ít nhất 11/13 trục**.
  - Bắt buộc khác ở **5 trục cứng**: (2) độ sáng nền, (3) kiểu tô, (6) họ chữ, (9) chuyển cảnh, (10) hook.
- **N4. Trong cùng kênh: nhận diện giữ nguyên, nội dung hình phải đổi.**
  - Mỗi video có **ít nhất 1 "thiết bị hình" mới**, chưa xuất hiện trong 5 video trước của kênh.
  - Không một bố cục cảnh nào chiếm **quá 30 %** thời lượng. Ngưỡng này là GIẢ THUYẾT.
  - Đây là yêu cầu của Y1 và Y2: cùng intro và outro thì được, phần chính phải khác.
- **N5. Cấm câu hook sáo ở mọi kênh.** Máy đếm bằng grep: "Did you know", "What if I told you", "In this video", "Let's dive in", "You won't believe", "Have you ever wondered".

## 2. Bảng 13 trục cho 5 kênh

| Trục | K1 Nước (vật lý) | K2 UART (điện tử) | K3 San hô (lịch sử Trái Đất) | K4 Vi sai (ô tô) | K5 Cấp đơn vị NATO (quân sự) |
|---|---|---|---|---|---|
| **1 Thế giới vật liệu** | Bàn quang học trong studio chụp ảnh | Màn máy hiện sóng | Trang sổ thực địa cùng lát cắt đá | Tờ bản vẽ kỹ thuật | Bản đồ địa hình giấy, có lớp phim trong phủ lên |
| **2 Độ sáng nền ★** (mode Y, 0–255) | **TRUNG-SÁNG 140–175**: xám trung tính, chuyển sắc như phông studio | **TỐI 0–20** | **SÁNG 220–245**, ấm | **TRUNG-TỐI 60–90**, xanh bản vẽ | **SÁNG 185–210**, lục xám nhạt |
| **3 Kiểu tô ★** | Khối có bóng đổ; nước trong suốt, khúc xạ | Nét phát sáng trên nền trống. **Chỉ kênh này được dùng** | Kết cấu: vân giấy, dải đá tô loãng (sắc kỷ 18 % trên giấy) viền mực, vạch sinh trưởng (đổi từ "tô đặc" 18/10, phiếu 79 Lỗi 5) | Nét trắng mảnh đều; gạch chéo ở mặt cắt | Lớp phủ bán trong suốt, đường đồng mức, ký hiệu tô màu chuẩn |
| **4 Nền phụ** | Không lưới; bóng mờ mặt bàn | Lưới 8×10 ô có vạch chia. **Chỉ kênh này có lưới kẻ ngang màn** | Vân giấy, mép giấy, số trang | Khung bản vẽ; ô tên bản vẽ ở góc dưới phải (16:9). Bản 9:16: ô tên ở góc **trên phải**, trong vùng an toàn và ngoài ô PiP, vì đáy phải khổ dọc là vùng nút và chữ của nền tảng; gói phải khai toạ độ ô tên và CHROME_MASK dọc (GĐ 18:5x 18/10, phiếu 83 Lỗi 3) | Chỉ đánh dấu toạ độ ở mép, không kẻ lưới ngang màn |
| **5 Màu** (hex) | Nền `#8E969D`→`#A7ADB3` (sửa 25/09: `#C4C9CE` cũ có Y = 200, nằm ngoài chính dải 140–175 của kênh); mực `#1C232B`; xanh nước `#1F6FD1` cho trọng lực và khối lượng; cam `#E8772E` cho sức căng mặt; **dải viền xanh nước `#1F6FD1` ở mép khung = màu nhận diện K1 khi có ô PiP** (phiếu 108 Lỗi 1, GĐ 01:0x 22/10: K1 PiP 9:16 – K2 t1 = 0,837 < 1,0 vì mặt người kéo sắc độ về bin 0/20; chọn chính màu xanh nước đã có của kênh (bin 200) chứ không thêm hex mới, để t2 không rời t1 đã đăng (≤ 0,3) và không chạm K4 `#553FBE` bin 240–260; bề rộng SX chọn, mốc đầu 28 px như K5, tăng tới khi BS-3 ≥ 1,0 với K2–K5 và ≤ 0,3 với K1 t1 ở CẢ HAI khổ; nằm ngoài ô PiP và vùng an toàn; không đo trừ ô PiP (Quyết 1 19/10); áp cả 16:9 cho đồng nhất hai khổ; số chính thức là số KĐ đo khi chấm hẹp) | Nền `#050A06`; vệt `#FFB000`; lục phosphor `#3DDC84`; đỏ lỗi `#FF4D4D` | Nền `#EFE6D3`; mực sắt `#2E2A26` (thay `#3B2A1E` 18/10); nhấn tím `#7B3F98`; **gáy vải đỏ tía `#C2187F` ở mép trái trang = màu nhận diện K3** (phiếu 89 Lỗi 3, GĐ 04:2x 19/10; chọn hướng (b), không đo trừ ô PiP; SX đo thử BS-3 16:9 K1 1,514 · K2 1,304 · K4 2,761 · K5 1,509; 9:16 K1 1,597 · K2 1,374 · K4 2,956 · K5 1,415; số chính thức là số KĐ đo ở phiếu chấm K3 nộp lại 04:18); **màu các kỷ theo bảng ICS chính thức, chỉ tô loãng 18 % + viền mực, không tô đặc** (phiếu 79 Lỗi 5, GĐ 12:1x 18/10; số đo ở ban_sac/K3_DAN_Y_SERI.md §6: K3–K1 4,154/2,947, K3–K2 3,413/1,631), ví dụ Devon `#CB8C37`, Silur `#B3E1B6`, Carbon `#67A599` (khớp ICS chart v2026-06, C10 A1) | Nền `#553FBE` (thay `#1D4F91` theo phiếu 83 Lỗi 4, GĐ 18:5x 18/10: mã cũ cùng bin sắc độ 200 với K1, BS-3 K4–K1 chỉ 0,047/0,062; số đo mã mới, bản thử 8 beat 19:1x 18/10, do_ban_sac.py, 1 khung/2 s, 59 khung mỗi khổ: nền Y mode 75; BS-3 16:9 K4–K1 20,723 · K4–K2 6,442 · K4–K3 3,685; 9:16 K4–K1 20,723 · K4–K2 6,268 · K4–K3 5,413; ở ban_sac/K4_DAN_Y_SERI.md); nét `#F2F6FA`; đỏ đánh dấu `#E63946` | Nền `#C6CCB4` (sửa 25/09 21:35: mã cũ `#E3E6D6` cho Y ≈ 228, nằm ngoài dải K5 185–210 và rơi vào dải K3 220–245; mã mới Y ≈ 201, cảnh thử đo 199/189); đồng mức `#9A6B3F`; **màu ký hiệu theo APP-6**: bạn `#80E0FF`, địch `#FF8080` (khớp bảng Light MIL-STD-2525C ở 2 nguồn thứ cấp, C10 A2–A3; bản gốc APP-6 là PDF, chưa mở); **viền olive drab `#6B8E23` 28 px quanh mép khung tờ bản đồ = màu nhận diện K5** (phiếu 90 Lỗi 4, GĐ 07:31 19/10; hướng (b) như K3; trần :95 không đổi, không đo trừ ô PiP; SX mô phỏng BS-3 nhỏ nhất ≈ 1,24 (16:9) / 1,16 (9:16); số chính thức là số KĐ đo ở phiếu chấm K5 nộp lại) |
| **6 Họ chữ ★** | Sans nhân văn, chữ thường | Mono, CHỮ IN | Serif cổ; chú thích in nghiêng | Chữ kỹ thuật kiểu ISO 3098, nghiêng | Chữ stencil, CHỮ IN |
| ↳ Phông | Segoe UI (có sẵn) → nên thay Source Sans 3 (OFL) | Consolas → JetBrains Mono (OFL) | Georgia → EB Garamond (OFL) | Bahnschrift (đi kèm Windows 10/11, bản số hoá DIN 1451; dùng được theo C10 B1, B2) → Osifont (chưa tải, cần xin phép tải). Agency FB bị Pango thay thầm bằng phông khác nên cấm. **Bahnschrift độc quyền K4**: kênh khác không được dùng | Stencil (Office, `C:\Windows\Fonts\STENCIL.TTF` 55 596 B, © 1992 URW / Microsoft, EmbeddingRights=Editable): **ĐƯỢC dùng cho bản đăng** từ quyết GĐ 17:2x 18/10 (FAQ Microsoft font-faq đọc 17:23: chữ thành bitmap trong video; cấm nhúng file phông vào mp4, phụ đề hay gói giao). Stencil thiếu dấu `·` (NX50-2) nên mỗi lần dựng phải đo cmap. Dự phòng: Big Shoulders Stencil (OFL, có tiếng Việt C10 B12) |
| **7 Nhãn, chú thích** | Đường dẫn mảnh và chữ trần, **không khung**; số đo hiện bằng thước kẹp vẽ | Ô đọc số kiểu máy đo ở thanh phải; con trỏ đo dọc | Chú thích viết tay ở lề trái như sổ thực địa; băng dính giấy | Đường kích thước có mũi tên hai đầu; số chi tiết trong vòng tròn | Hộp chú giải ở góc; khung ký hiệu APP-6; cờ nhãn nhỏ |
| **8 Nguồn trên màn** (tầng 7 bắt buộc) | Chú thích nhỏ ở góc trên phải | Thanh trạng thái của máy, ở trên | Chú thích cuối trang có số (¹ ²) | Trong ô tên bản vẽ, dạng "REF:" | Trong hộp chú giải |
| **9 Chuyển cảnh ★** (chính / phụ) | Zoom liên tục qua các thang độ lớn, không cắt / chuyển lấy nét | Quét ngang theo vệt trigger / tín hiệu nhiễu rồi bắt lại | Lật trang / trầm tích phủ lớp từ dưới lên | Tách rời chi tiết (exploded view) / mặt cắt trượt | Lia và thu phóng bản đồ tới một ô toạ độ / lớp phim trong trượt vào |
| **10 Hook ★** (5–8 s đầu) | **Hiện tượng nhìn thấy được**: quay chậm, kèm 1 con số đo được | **Hỏng trước, giải thích sau**: giây 0 là dữ liệu rác | **Vật chứng**: đọc một vật thật như đọc bản ghi | **Tình huống lái**: xe vào cua, bộ phận nào gãy nếu thiếu chi tiết này | **Phép nhân quy mô**: từ 1 người lính nhân lên thành cấu trúc |
| **11 Nhịp dựng** (độ dài cảnh trung bình, GIẢ THUYẾT) | 6–9 s | 3–5 s | 9–13 s | 5–7 s | 4–6 s |
| **12 Âm thanh** | Giọng en-US-AndrewNeural; tiếng nước tổng hợp | en-GB-RyanNeural; tiếng rơ-le, tiếng bíp | en-US-ChristopherNeural; tiếng giấy, gỗ, nền trầm | en-AU-WilliamNeural; tiếng bánh răng, cơ khí | en-US-GuyNeural; tiếng bộ đàm nhiễu nhẹ |
| **13 Thumbnail** | Vật thể lớn trên nền xám, 1 con số | Màn máy có vệt tín hiệu, chữ mono | Lát đá hoặc vật chứng, chữ serif | Bản vẽ mặt cắt, 1 mũi tên đỏ | Mảnh bản đồ có ký hiệu, chữ stencil |

**§2a. Bảng màu v2 — thẩm mỹ (GĐ 24/10/2026 theo lệnh Chủ tịch "cách phối màu thiếu tính thẩm mỹ"; thay mã ở trục 5 cho mọi tập mới/dựng lại; nền K1/K2/K3/K5 giữ nguyên).**
- Căn cứ đo (`tools/do_bang_mau_mau.py` → `out/_nghien_cuu/trinh_bay/bang_mau_mau.json`, storyboard chỉ trong bộ nhớ): Animated Physics rC4i66wL3gQ nền #080808, nhấn vàng #99874E + lam #2B5361 + chàm #362D5C, S_tb 0,53, có màu 2,4 %; PoleZero B3sInoKRI2s nền đen, cam #7B4633 / lam #275F7B / lục #496F31 / đỏ #943743, S_tb 0,62; Lagon3D-En j_a9LuLMgYU nền xanh đêm #182858 (V ≈ 0,35), S 0,70; UnclassifiedYTT tsED3AjQ9Fw nền #F8E8E8, có màu 1,3 %, S 0,57. Tập t2 của mình: K1 1 họ sắc (xanh 91 %), K3 gáy #C2187F chiếm 81 % điểm có màu S 0,76, K4 nền tím S 0,65 phủ 98 % khung, K5 viền olive 82 %.
- Nguyên tắc: giữ nguyên SẮC ĐỘ nhận diện (chữ ký BS-3), hạ bão hoà/độ sáng màu nhấn, viền, nền; thêm vignette mép (điều 6 chiều sâu) ở K1 22 %, K4 30 %, K5 12 %.
- Mã v2: K1 xanh nước/viền `#1F6FD1`→`#3F6A9E`, cam `#E8772E`→`#D1834F`; K2 giữ nguyên (đã khớp PoleZero); K3 gáy `#C2187F`→`#9E3C77`; K4 nền `#553FBE`→`#463A8A` (Y ≈ 71, trong dải 60–90), đỏ `#E63946`→`#D6515A`; K5 viền `#6B8E23`→`#718A3E`. Màu APP-6, ICS, mực, nét giữ nguyên (chuẩn ngoài).
- Bổ sung 24/10 23:3x (phiên web đo, GĐ duyệt): cam K1 v2 `#D1834F` gần cùng độ sáng nền K1 (≈ 1,01:1 với `#8E969D`), nên mọi khối/mũi tên/dấu cam phải có **viền mực mảnh 2 px**; hộp nền phụ đề ≥ 4,5:1 ở mọi khung.
- Kiểm mô phỏng trên t2 16:9 (`tools/kiem_bs3_mau_v2.py`, 1 khung/2 s): BS-3 nhỏ nhất K2–K3 1,313→1,073, K2–K5 1,192→1,114 (vẫn ≥ 1,0); lệch so với t2 cùng kênh ≤ 0,017 (≤ 0,3); nền Y mode K4 75→66. Đây là MÔ PHỎNG chỉnh màu khung, số chính thức là số KĐ đo trên bản SX dựng; nếu cặp nào < 1,0 thì SX tăng V/S màu nhận diện từng bước 0,05 tới khi đạt. Ảnh trước/sau: `out/_giam_doc/_mau_v2/truoc_sau_v2.jpg`.

**BS-3 của K3 (NX81-6, GĐ duyệt 15:2x 18/10/2026):** BS-3 đo mỗi tập, hai khổ, ≥ 1,0 với K1 và K2. Lý do: chữ ký màu K3 dựa trên rất ít điểm màu (nền giấy sáng, dải đá tô loãng 18 %), nên một tập có thể trượt dù tập trước đạt.

**Định nghĩa "vật thật" ở trục 10, kênh K3 (GĐ trả lời phiếu 42 §7 và câu hỏi NC 25/09 23:28; ghi 26/09 01:07):**
- Tính là vật thật: ảnh chụp hoặc ảnh quét của **một mẫu vật cụ thể, có tên** (bảo tàng, bài báo, kho dữ liệu), giấy phép dùng được, ghi nguồn trên màn.
- Cũng tính: hình vẽ lại **đúng tỉ lệ từ ảnh có nguồn của chính mẫu đó**, mọi số đọc trên hình (số vân, bề dày, năm) lấy từ nguồn ấy, và trên màn ghi "vẽ lại theo <nguồn>, mẫu <tên>".
- KHÔNG tính: hình vẽ tay chung chung, mẫu "điển hình" không có tên, hay số đọc tự đặt. Hook kiểu đó là mô phỏng, BS-5 TRƯỢT.

**Cấm ở mọi kênh:**
- chip bo góc của mẫu cũ;
- `FadeIn`/`FadeOut` toàn màn dùng làm chuyển cảnh;
- `Circumscribe`;
- `Write` cho câu dài;
- dòng nguồn chạy ở đáy.
  - **Định nghĩa (trả lời K42-1, 25/09):** là **một dòng** nguồn, **không đánh số**, căn giữa hoặc chạy hết bề ngang, nằm trong 15 % đáy màn, và **không nối** với dấu nào trong nội dung. Đây là khuôn của M1/M2.
  - **Chú thích cuối trang của K3 KHÔNG thuộc lệnh cấm**, với đủ 3 điều kiện:
    1. mỗi dòng có số, và số đó hiện thành dấu nâng (`gan_so`) trong nội dung của **cùng khung**;
    2. căn trái, có vạch kẻ ngắn phía trên (`chu_thich_cuoi_trang`);
    3. dùng serif của K3.
    Thiếu một điều kiện là TRƯỢT như dòng nguồn ở đáy.
  - **REF của K4** chỉ được nằm **trong ô tên bản vẽ** (`khung_ban_ve`). Viết REF ra ngoài ô là TRƯỢT.
  - K3 và K4 đều đặt nguồn ở nửa dưới, nhưng khác vị trí (trái / phải), hình thức (chú thích đánh số / ô kẻ bảng) và phông. Trục 8 không phải trục cứng ★; BS-8 vẫn chấm trục này.

**Âm thanh:** chỉ dùng âm tự tổng hợp, hoặc YouTube Audio Library có ghi giấy phép vào manifest (cổng C9).

**Phông chữ (C10, NC 03/10/2026, sửa bởi GĐ):** phông đi kèm Windows (Segoe UI, Consolas, Georgia, Bahnschrift) ĐƯỢC dùng để làm chữ trong video theo hướng dẫn Microsoft (C10 B1), với 3 điều kiện: chữ thành ảnh bitmap; không đính kèm file phông vào video hay phụ đề; ứng dụng dựng không phải bản chỉ cho gia đình/học sinh. Phông Office: riêng Stencil được dùng cho bản đăng từ 17:2x 18/10 (quyết GĐ, căn cứ learn.microsoft.com/en-us/typography/fonts/font-faq, cùng 3 điều kiện trên); phông Office khác vẫn chưa có căn cứ → không dùng cho bản đăng. Phông OFL dùng tự do cho chữ trong video; sản phẩm không bị OFL ràng buộc (C10 B13). Tải phông mới: chỉ từ nguồn chính thức, đo cmap bằng `ban_sac/kiem_phong_vi.py`, ghi vào `NHAT_KY_CAI_DAT.md`.

## 3. Cổng bản sắc (đo được; KĐ chạy, GĐ viết code)

| Cổng | Đo gì | Qua khi |
|---|---|---|
| **BS-1 Độ sáng nền** | Mode Y từng khung (`do_ban_sac.py`, 1 khung mỗi 2 s) | ≥ 90 % số khung nằm trong dải trục 2 của kênh |
| **BS-2 Kiểu tô** | Tỉ lệ điểm ảnh có màu | K2: ≤ 10 % (vẫn là cổng loại, khớp số đo 3,6 %). **Các kênh khác: chỉ ghi số, không loại** (sửa 25/09 21:35). Ngưỡng cũ ≥ 25 % mâu thuẫn với chính bảng màu §2: cảnh thử dựng bằng module đo K1 10,4 %, K3 15,2 %, K4 100 % (nền xanh bão hoà nên con số vô nghĩa), K5 0,9 %. KĐ ghi con số vào phiếu. Dải riêng từng kênh chốt sau 2 video thật đầu tiên của kênh đó (GIẢ THUYẾT). **Làm rõ 17/10/2026 04:4x (GĐ):** BS-2 đo trên khung video như BS-1 (1 khung mỗi 2 s). Ảnh bìa KHÔNG chịu BS-2 (bìa buộc có chữ ≥ 80 px theo A2 nên thước này vô nghĩa trên bìa); bìa chấm theo barem A1–A4 + trục 13, KĐ chỉ ghi số BS-2 của bìa vào phiếu. |
| **BS-3 Chữ ký màu** | Khoảng cách Bhattacharyya của histogram sắc độ | Với kênh khác ≥ 1,0; với các video trước của chính kênh ≤ 0,3. **Chỉ là điều kiện CẦN, không đủ** (§0) |
| **BS-4 Kiểm code** | Phân tích cú pháp (AST) của `canh.py`. **Không** grep theo tên lớp, cũng không đếm chữ (K41-1) | (a) Chỉ import `ban_sac/K<n>` của kênh mình. (b) **Chip bắt theo hình dạng:** mọi khung bo góc bao quanh chữ đều là chip, bất kể lớp nào (`RoundedRectangle`, `SurroundingRectangle(corner_radius>0)`, `BackgroundRectangle`…). Ngoại lệ duy nhất là vật thể thật được module kênh khai tên (ví dụ đầu dò, vỏ thạch anh của K2). (c) Không có lệnh làm mờ áp lên toàn bộ `self.mobjects` hay một `Group` chứa tất cả, ở bất kỳ hàm nào kể cả `end()`. (d) `Create`/`Write`/`Transform`/`FadeIn` không được gọi trực tiếp trong `canh.py`, chỉ được gọi qua hàm hoạt cảnh của module kênh. (e) Lưới (`NumberPlane`, `Axes` có lưới, vòng lặp vẽ đường song song) chỉ được dùng ở kênh nào mà trục 4 cho phép. (f) Không có mã màu hay phông ngoài bảng của kênh |
| **BS-5 Hook** | `script.json` có trường `hook_kieu` | Đúng kiểu hook của kênh; không câu sáo N5; câu mở không trùng 5-gram với 20 video gần nhất của mình |
| **BS-6 Nhìn như người duyệt, bản 2** (bản 1 là cổng sai, K41-2) | Như bản 1: KĐ xếp 1 khung mỗi 10 s cạnh video mới nhất của 4 kênh kia, cộng lưới 6 thumbnail. **Khác bản 1:** mọi khung được chuẩn hoá trước khi xem, gồm chuyển thang xám, cân bằng histogram, chỉ giữ biên, và làm mờ mọi vùng chữ. Như vậy chỉ còn bố cục, hình khối và nhịp. Màu, nền và phông đã có BS-1…BS-4 đo | Trên ảnh đã chuẩn hoá vẫn nói đúng kênh ≥ 80 % số khung (ngưỡng là GIẢ THUYẾT). Hiệu chỉnh: cặp M1 v2 / M2 **phải trượt** cổng này. Nếu vẫn qua thì đổi cách chuẩn hoá |
| **BS-8 Ma trận 13 trục (N3)** | KĐ lập bảng 13 hàng cho video mới so với video mới nhất của từng kênh kia. Mỗi trục ghi GIỐNG hoặc KHÁC, kèm bằng chứng (khung và dòng code). Có hàng riêng cho bố cục: vị trí tiêu đề, bố cục đối xứng giữa màn hay lệch (K41-3) | Khác ≥ 11/13 trục **và** khác cả 5 trục cứng, với **từng** kênh kia. Hiện KĐ chấm tay; tự động hoá sau |
| **BS-7 Hiệu chỉnh** | Chạy BS-1 đến BS-6 lên mẫu 1 v2 và mẫu 2 hiện tại | **Hai mẫu này PHẢI TRƯỢT**, vì Chủ tịch đã phán là giống. Nếu bộ cổng cho qua thì bộ cổng sai, sửa cổng trước khi dùng |

**Kết quả BS-7 lần 1 (KĐ, phiếu 41, 25/09 21:10):**
- Cả hai mẫu TRƯỢT, đúng yêu cầu.
- Mẫu 1 v2 trượt BS-1, BS-2, BS-4, BS-5.
- Mẫu 2 **chỉ** trượt BS-4 và BS-5, đều ở những mục dễ sửa. Như vậy ngữ pháp chung có thể còn nguyên mà vẫn qua cổng, tức là **bộ cổng còn yếu**.
- Bốn khiếm khuyết cổng K41-1 đến K41-4 đã sửa ngày 25/09:
  - K41-1 (đếm nhầm vật): sửa ở §0 dòng 3–4 và BS-4 (b)(c);
  - K41-2 (BS-6 bản 1 là cổng sai): BS-6 bản 2;
  - K41-3 (không đo bố cục, `Create`/`Transform`, lưới, 11/13 trục): BS-4 (d)(e) và BS-8;
  - K41-4 (số không tái tạo được): §0 dòng 1, `do_ban_sac.py` dùng histogram 256 bin.
- **Phải chạy lại BS-7** khi đã có code BS-4 và BS-6 bản 2. Yêu cầu lần này là mẫu 2 phải trượt thêm **ít nhất một cổng ngữ pháp** (BS-6 bản 2 hoặc BS-8), chứ không chỉ trượt code/hook.

## 4. Áp vào 5 mẫu hiện có

- **Mẫu 2, UART:** giữ thế giới máy hiện sóng. Đây là **kênh duy nhất** có nền tối và lưới. Bỏ chip, chuyển nguồn lên thanh trạng thái, thay `FadeIn` bằng quét trigger. Làm **cùng lượt** với việc sửa phiếu 40.
- **Mẫu 1, nước:** v2 đang chờ KĐ soát **chính xác**. Về **bản sắc**, v2 **trượt luật này**. v3 chuyển sang phông studio xám cùng khối có bóng đổ, và gộp chung một lượt sửa với phiếu 44.
- **Mẫu 3, 4, 5:** dựng thẳng theo bảng §2 ngay từ đầu.
- **Tiến độ công cụ (25/09 21:35):**
  - `ban_sac\lint_bs4.py` (BS-4 bằng AST) đã có. Cách dùng: `python ban_sac\lint_bs4.py K<n> canh.py`, exit 0 nghĩa là ĐẠT.
  - Hiệu chỉnh trên M1 v2 và M2: lint bắt lại **đủ** các mục KĐ tìm tay ở phiếu 41, gồm chip `SurroundingRectangle`, làm mờ ở `end()`, lưới M1 `:73`, Bahnschrift, và 10 mã hex của M2.
  - `ban_sac\K2_may_hien_song.py` đã có, gồm bảng màu, phông, lưới, thanh trạng thái, ô đọc số, con trỏ đo, vệt rác cho hook, chuyển cảnh quét trigger, và hai vật thể thật.
  - Cảnh thử dựng bằng module: lint ĐẠT; nền Y = 8 (dải 0–20); điểm ảnh có màu 3,6 % (≤ 10 %).
  - `ban_sac\K1_ban_quang_hoc.py` đã có, gồm phông studio chuyển sắc, khối có bóng đổ, nước trong, nhãn không khung, thước kẹp, nguồn ở góc trên phải, số cho hook, và zoom qua các thang độ lớn (chuyển lấy nét chưa làm).
  - Cảnh thử dựng bằng K1: lint ĐẠT; BS-1 đạt 15/15 khung (nền Y = 159); điểm ảnh có màu chỉ 10,4 %.
    - Như vậy **ngưỡng BS-2 ≥ 25 % có thể sai với K1**: nền xám không tính là điểm ảnh có màu. Phải hiệu chỉnh lại trên cảnh thật (GIẢ THUYẾT). → Đã xử lý 21:35: ngoài K2, BS-2 chỉ ghi số (bảng §3).
  - `ban_sac\K3_so_thuc_dia.py` đã có, gồm nền giấy có vân và mép lề, số trang, chữ serif và chữ nghiêng, dải đá tô đặc mép gợn, vạch sinh trưởng dạng cung, chú thích lề trái, băng dính giấy, chú thích cuối trang đánh số, và hai chuyển cảnh: lật trang (chính) và phủ lớp trầm tích (phụ).
    - Số chú thích vẽ bằng chữ số nhỏ nâng lên. Không dùng ký tự Unicode ⁴–⁹ vì bản thử đầu ra ô vuông (thiếu glyph).
  - Cảnh thử dựng bằng K3: lint ĐẠT; nền Y = 229 (dải 220–245); điểm ảnh có màu 15,2 %; BS-1 đạt 15/18 khung.
    - Ba khung trượt (Y 210, 210, 150) đều rơi vào lúc chuyển cảnh: bóng mép trang và các lớp trầm tích phủ kín màn. Cảnh thử dồn 3 chuyển cảnh trong khoảng 36 s nên tỉ lệ này **không đại diện** cho video thật.
    - **Quyết định:** giữ nguyên BS-1, khung chuyển cảnh vẫn tính. Không miễn trừ, vì miễn trừ sẽ thành kẽ hở. `phu_lop` chỉ dùng ở ranh giới chương. Đo lại trên cảnh thật; kỳ vọng ≥ 90 % là GIẢ THUYẾT.
  - `ban_sac\K4_ban_ve_ky_thuat.py` đã có, gồm nền xanh bản vẽ, chữ DIN in hoa nghiêng, nét không tô, khung bản vẽ kép và ô tên có `REF:`, gạch mặt cắt, đường tâm, đường kích thước, số chi tiết, đánh dấu đỏ, và hai chuyển cảnh: tách rời chi tiết (chính) và mặt cắt A–A trượt ngang (phụ).
  - Cảnh thử dựng bằng K4: lint ĐẠT; BS-1 đạt 18/18 và 8/8 khung (nền Y = 71, dải 60–90); điểm ảnh có màu 100 % vì nền xanh bão hoà.
  - `ban_sac\K5_ban_do_tac_chien.py` đã có, gồm bản đồ đường đồng mức (cứ 5 vòng một vòng đậm), ký hiệu đơn vị kiểu APP-6 (bạn chữ nhật, địch hình thoi, bảng cấp đơn vị NC kiểm), cờ nhãn, hộp LEGEND có dòng SOURCE, toạ độ chỉ ở mép, hiện kiểu đóng dấu, và hai chuyển cảnh: lia camera tới ô đích (chính) và phim trong suốt trượt xuống (phụ).
  - Cảnh thử dựng bằng K5: lint ĐẠT; BS-1 đạt 14/14 khung (nền Y = 199/189); điểm ảnh có màu 0,9 %.
  - **Thứ tự nộp (trả lời KĐ 21:30):** M1 v2 dùng Bahnschrift (`M1_NUOC\canh.py:16`), trùng trục 6 ★ với K4 nên BS-8 sẽ trượt. M4 (K4) **không được nộp KĐ** trước khi M1 v3 đã chuyển sang Segoe UI.
  - `ban_sac\bs6_chuan_hoa.py` (BS-6 bản 2) đã có bản đầu, gồm các lệnh `tao` (tờ tham chiếu + tờ đề trộn + khoá), `cham` (chấm đáp án của người đoán) và `may` (chỉ số phụ: máy đoán kênh bằng tâm gần nhất, bỏ-một-ra).
    - Chạy hiệu chỉnh 21:45 trên cặp M1 v2 / M2 (bước 10 s, 42 khung): **máy vẫn tách được 0,95**, nghĩa là cặp này **qua** cổng, trái yêu cầu BS-7.
    - Nhìn tờ tham chiếu: khác biệt còn lại chủ yếu là **bước lưới** (M1 v2 lưới mịn, M2 lưới 8 × 10). Bộ lọc chữ bỏ sót chữ to và chữ nằm đè lên lưới.
    - Theo luật thì phải **đổi cách chuẩn hoá** trước khi dùng. Hướng thử (GIẢ THUYẾT): hạ độ phân giải biên xuống mức người xem lướt, và nhận diện lưới đều thành một dấu "có lưới" chung. Chưa làm.
  - KĐ 21:37: vì BS-2 chỉ ghi số, **trục 3 ★ (kiểu tô) không còn cổng tự động**; hiện chỉ dựa vào BS-6 bản 2 và BS-8 chấm tay. Cần một phép đo riêng cho trục 3 (GIẢ THUYẾT: tỉ lệ vùng tô đặc trên vùng có nét). Chưa làm.
- **Thứ tự làm:**
  1. Module `ban_sac/K1`…`K5` (GĐ hoặc SX).
  2. Lint BS-4.
  3. Dựng các cảnh.
  - Chưa có module của kênh nào thì **chưa dựng video mới cho kênh đó**.

## 5. Ai đọc, khi nào, ai được sửa

| Phòng | Khi nào phải đọc |
|---|---|
| **NC** | Trước khi viết kịch bản: kiểu hook, nhịp, cách hiện nguồn của đúng kênh |
| **SX** | Trước mỗi lần viết `canh.py` |
| **KĐ** | Mỗi phiếu chấm có mục BS-1 đến BS-6. Soát định kỳ theo `LUAT_NGUYEN_BAN_VA_RUI_RO.md` §5.6 |

- **Sửa luật:** chỉ GĐ được sửa, ghi ngày và lý do vào mục H của `00_YEU_CAU_BAT_DI_BAT_DICH.md`. Chủ tịch quyết cuối.
- **Thêm kênh:** thêm một cột vào bảng §2. Cột mới phải khác **mọi** cột cũ ở cả 5 trục cứng.
