# 🤝 NHẬT KÝ PHỐI HỢP GIỮA CÁC CÔNG CỤ AI

> File này để các AI/công cụ cùng làm trên repository nắm được phạm vi, bằng chứng kiểm thử và việc còn chờ.

**Thương hiệu hiển thị:** Spirituality Market.  
**Quy tắc điều phối:** đọc `AGENTS.md`, `docs/handover/ACTIVE_TASKS.json` và chuẩn đối tượng trước khi sửa; không ghi mật khẩu, token hoặc secret vào repository.  
**Quy tắc độ tin cậy:** không kết luận source/production đã hoàn tất nếu chưa có log, test hoặc nghiệm thu thực tế.

---

## Trạng thái mật khẩu và hạ tầng

- **SPARE** (`/`) dùng mật khẩu riêng.
- **Bói toán** (`/boitoan/`) có hai cấp Admin; chỉ lưu PBKDF2 hash + salt, không lưu plaintext.
- **MEDORA** (`/medora/`) giữ cơ chế truy cập riêng hiện hành.
- **Hội Chọn Đúng** (`/hoi-chon-dung/`) có Growth Autopilot nội bộ; giao diện public không hiển thị trạng thái vận hành hoặc doanh thu.
- Không commit `*.src.html`, mật khẩu, token hoặc secret.
- Production frontend: `hiennhi89.pages.dev`.
- Backend: `hiennhi89-gate.hiennhi89.workers.dev`.

---

## Nhật ký thay đổi — mới nhất trên cùng

### 2026-07-25 15:00 GMT+7 — Claude Code — BOITOAN-20260725-08 — ĐANG LÀM ⏳

**Trả nốt món nợ: rà kho chữ các bộ bài còn lại theo đúng chuẩn đã áp cho Lenormand.**

Quét theo *loại lỗi* (Điều 1B.2) trên từng bộ dữ liệu, không tìm lại chuỗi đã biết. Kết quả quét
xác định đúng chỗ hỏng: `TAROT_EXT` 62 chỗ, `BT_EXT` 7 chỗ, `LEN_PAIRS` 2 chỗ, `ZODIAC` 1 chỗ.

Đã viết lại **69 câu** bị các lỗi sau:
- **Ẩn dụ trong ngoặc kép** làm người đọc phải tự đoán: *thay máu · lửa nhỏ hầm lâu · ba cốc đổ ·
  hai cốc còn · gồng nốt · nằm nghỉ · đâm sau lưng · thợ cả · gia tộc · nhà thờ*.
- **Chữ tiếng Anh lẫn vào**: `stress`, `retreat`, `DCA`.
- **Nhãn VIẾT HOA giữa câu**: `chọn MỘT`, `KHÔNG mang oán`.
- **Dấu gạch chéo thay cho từ**: `em/anh`, `chồng/bạn đời`, `thắng kiện/thắng kèo`, `Dự án/vai trò`.
- **Chữ *quẻ* lọt sang bài Tarot** (`quẻ 'về chung nhà được đấy'`).
- Câu nối bằng dấu chấm phẩy dài lê thê, tách thành câu riêng và xưng hô với *bạn*.

Quét lại sau khi sửa: `TAROT · TAROT_EXT · BAITAY · BT_EXT · RUNES · TEALEAF · LENORMAND ·
LEN_EXT · LEN_PAIRS` đều **0** ngoặc kép ẩn dụ, **0** chữ tiếng Anh, **0** nhãn viết hoa, **0**
chữ *quẻ*.

**Cố ý giữ nguyên:** phần Kinh Dịch (`KD_EXT`) vẫn dùng chữ *quẻ* và trích nguyên văn kinh điển
trong ngoặc kép (*kháng long hữu hối*, *chư hầu*) — đó là thuật ngữ đúng của hệ thống này, đã có
chú giải tiếng Việt kèm theo, nên không phải lỗi cùng loại.

### 2026-07-25 14:35 GMT+7 — Claude Code — BOITOAN-20260725-07 — ĐANG LÀM ⏳

**Số thành viên công khai phải tự cập nhật.** Sau khi dọn rác và sinh đủ 385 nick, `/api/community/stats`
vẫn trả **161** vì bộ đếm được cache với hạn dùng bằng `ACCOUNT_TTL` và không chỗ nào xoá nó.

- Cache đếm nay có hạn dùng **60 giây** (`STATS_CACHE_TTL`), nên số thành viên tự đúng lại mà không
  phải nhớ xoá cache ở mọi chỗ có thay đổi.
- Sinh nick xong xoá cache ngay; dọn rác cũng luôn xoá cache, kể cả lô không xoá được hồ sơ nào.

**Việc đã chạy thật trên production hôm nay** (sau khi PR #103 merge `8d51645` và deploy xong):

| Việc | Kết quả kiểm chứng |
|---|---|
| Dọn hồ sơ nick mô phỏng đời cũ | quét **2.086**, xoá **2.085** hồ sơ rác; số thành viên từ 2.086 về 161 |
| Sinh đủ nick khoang riêng | `done: 385 / target: 385` — **109 khách + 276 reader**, đúng yêu cầu |
| Đăng nhập Admin tổng | `POST /api/community/admin/login` trả **HTTP 200**, `level: primary` |

Con số 2.086 trước đây là do bản sinh nick đời trước tạo mỗi nick một khoá hồ sơ thật và bị gọi lại
nhiều lần. Sau khi dọn, trong KV chỉ còn **1 hồ sơ thành viên thật**; toàn bộ phần còn lại là 385 nick
mô phỏng nằm trong khoá chỉ mục.

### 2026-07-25 11:40 GMT+7 — Claude Code — BOITOAN-20260725-06 — HOÀN TẤT ✅

**Chịu lỗi hạn mức ghi KV.** Khi chạy sinh nick thật trên production đã chạm trần
**1.000 lượt ghi/ngày của KV gói miễn phí** ở nick thứ **160/385**
(đủ 109 khách + 51/276 reader). Hai lỗi lộ ra và đã sửa:

- `GET /api/community/stats` **chết** khi không ghi được cache — nay bọc `try/catch`, vẫn trả số
  liệu dù không lưu được cache. Cùng cách với `bumpStats`.
- Sinh nick nay trả `quota_exhausted: true` kèm tiến độ thật thay vì lỗi máy chủ chung; tiến độ
  `done` giữ nguyên nên gọi lại là chạy tiếp đúng chỗ. Giao diện hiện thông báo rõ thay vì quay vô tận.

**Đăng nhập Admin.** Hạn mức ghi cạn làm mọi lượt đăng nhập Admin đổ về một câu báo lỗi chung,
khiến chủ sở hữu tưởng sai mật khẩu. Đã sửa ba chỗ:

- Backend trả `storage_quota_exhausted` (503) kèm câu giải thích, thay cho `community_server` (500).
- Giao diện đọc mã lỗi đó và nói thẳng: mật khẩu vẫn đúng, chỉ là hết hạn mức ghi trong ngày.
- `handleAdminLogin` trước đây đọc **từng** bản ghi phiên khi dọn phiên cũ. Nay phiên Admin mang
  `metadata { v, p }` nên chỉ cần một lần `list`; bản ghi đời cũ chưa có metadata thì đọc tối đa
  `ADMIN_SESSION_PROBE_LIMIT = 20`. Một lần đăng nhập không còn phụ thuộc số phiên tồn đọng.

**Kiểm chứng trên production** (10:20 GMT+7, sau khi hạn mức làm mới lúc 00:00 UTC):
`POST /api/community/admin/login` với mật khẩu Admin tổng trả **HTTP 200**, `level: primary`.
Đăng nhập đã hoạt động trở lại.

**Giọng đọc bài — viết lại toàn bộ theo góp ý của chủ sở hữu.** Sáu lỗi được chỉ ra và đã sửa:

1. **Gọi sai tên.** Trải bài phương Tây mà dùng chữ *quẻ* (từ của Kinh Dịch). Nay Lenormand, Tarot,
   Bài Tây dùng *trải bài · lá bài · lá cuối*; nhãn Celtic Cross đổi *Tâm quẻ* thành *Tâm bài*.
   Chữ *quẻ* chỉ còn ở phần Kinh Dịch, nơi nó đúng.
2. **Nghĩa lá bị cắt cụt.** `lenBit` cắt câu ở dấu chấm phẩy nên người đọc chỉ thấy một mảnh.
   Thay bằng `lenFull`: lấy trọn nghĩa theo lĩnh vực và tách dấu chấm phẩy thành câu riêng.
3. **Câu nối lặp y hệt mọi lượt** ("đây là cái nền đã có sẵn từ trước…"). Nay câu nối đổi theo
   cực tính từng lá và theo chiều đi giữa các lá, chọn ổn định theo chỉ số lá nên cùng một quẻ
   đọc lại vẫn ra đúng câu đó.
4. **Không xưng hô.** Toàn bộ lời đọc nay nói với *bạn*.
5. **Từ địa phương và từ lóng**: *khúc, xử, trôi, sáng ra, gợn, ngả về, networking, bàn bài* —
   đã thay bằng từ phổ thông. Riêng *bàn bài* là từ chủ sở hữu đã cấm và vẫn còn sót trong
   `buildAnswerPanel`; nay đã hết.
6. **Khẳng định thứ không thể biết.** Kho chữ cũ viết "cắt hợp đồng" cho lá Scythe, trong khi lá
   chỉ nói về một việc bị cắt dứt khoát. **Đã viết lại toàn bộ 108 câu nghĩa của `LEN_EXT`**
   (36 lá × 3 lĩnh vực): nói dứt khoát *việc gì xảy ra* và *bạn nên làm gì*, không đoán bừa
   *vật gì* bị tác động; bỏ hết ẩn dụ, chữ tiếng Anh và dấu ngoặc kép mỉa mai.

Ngoài ra sửa hai chỗ tự mâu thuẫn: câu nối trước đây chỉ nhìn hiệu số điểm nên nói "chuyển sang
chiều thuận hơn" ngay trước một lá xấu, và nói "giữ nguyên chiều cũ" ngay trước lá Stork (nghĩa là
đổi thay). Nay lời bình theo **cực tính tuyệt đối** của lá đang nói, câu nối mới theo chiều đi.

**Còn nợ:** kho chữ của Tarot, Bài Tây, Rune, Bài Trà chưa được rà cùng chuẩn này; mới sửa các
chỗ lộ ra khi quét theo loại lỗi. Việc tiếp theo là rà trọn từng bộ.

**Dọn rác dữ liệu nick mô phỏng.** `GET /api/community/stats` đang trả **2.086 thành viên** —
sai. Nguyên nhân: bản sinh nick đời trước tạo **mỗi nick một khoá hồ sơ thật** và bị gọi lại nhiều
lần, để lại hàng loạt hồ sơ `simulated: true` trùng tên; bản mới lại giữ nick trong khoá chỉ mục,
nên cùng một nick bị đếm hai lần.

- Thêm `POST /api/community/admin/simulated/cleanup` (chỉ Admin tổng): quét `community-profile:`
  theo lô 200 kèm con trỏ, xoá hồ sơ có cờ `simulated` cùng khoá `community-reader:` của nó, rồi
  xoá cache đếm để số thành viên tính lại từ đầu. Trả `cursor` để gọi tiếp cho tới `done`.
- `GET /api/community/readers` trước đây **không** hiện reader mô phỏng (chúng nằm trong chỉ mục,
  không có khoá hồ sơ). Nay ghép cả hai nguồn. Đồng thời bỏ bước đọc bản ghi trỏ — tên khoá
  `community-reader:<uid>` đã chứa uid — nên chi phí giảm một nửa.

**Ranh giới nội dung công khai.** `assets/gate.js` từng để tên hạ tầng nội bộ trong câu báo lỗi
đăng nhập, làm `tools/check-public-content.mjs` đỏ. Đã đổi câu đó.

**Bài học — đừng sửa thẳng file đã có script làm sạch.** Chân trang `hoi-chon-dung/index.html`
cũng chứa tên hạ tầng, nhưng đó là **bản gốc trước khi làm sạch**: `tools/apply-choice-autopilot-ui.mjs`
lấy đúng câu ấy làm mốc neo rồi thay bằng khối "Trước khi mua". Sửa thẳng file gốc khiến regex
không khớp, khối bắt buộc không được chèn, và `validate` đỏ ở chỗ khác. Đã trả file về nguyên
trạng. **Quy tắc rút ra: trước khi sửa một file public, kiểm tra xem có `tools/apply-*.mjs` nào
đang sinh hoặc làm sạch file đó không — nếu có thì sửa ở script, không sửa ở file.**

### 2026-07-25 11:00 GMT+7 — Claude Code — BOITOAN-20260725-05 — HOÀN TẤT ✅

**Sửa lỗi treo ở Khoang riêng** (chủ sở hữu báo: bấm sinh nick thì kẹt ở "Đang tải khoang riêng…").

- Nguyên nhân: `listByPrefix(env, "community-profile:", 1000)` **đọc từng hồ sơ một**, nên 385 nick
  làm một request phát sinh cả nghìn lượt đọc KV, vượt trần subrequest của Worker → treo. Hàm sinh
  nick cũ còn ghi 661 lượt trong một request, cũng vượt trần.
- Sửa: danh sách nick mô phỏng nay nằm gọn trong **một khoá chỉ mục** `community-simulated-index`
  nên xem danh sách chỉ tốn 1 lượt đọc; sinh nick chạy **theo lô 40 nick**, gọi lại nhiều lần và
  giao diện tự lặp cho tới khi đủ 385 (chủ sở hữu chỉ bấm một lần, hoặc công ty tự chạy qua API).
- `GET /api/community/stats` cũng có đúng lỗi này (quét mọi hồ sơ) và sẽ treo khi có 385 nick. Nay
  đếm bằng khoá bộ đếm `community-stats-counters`, chỉ dùng `KV.list` (không đọc từng giá trị).

### 2026-07-25 10:15 GMT+7 — Claude Code — BOITOAN-20260725-04 — HOÀN TẤT ✅

- PR #100 merge `dc98895`; CI 4/4 success. Đã kiểm chứng production: `community-admin.js` có
  `loadSimulated`/`useSimAccount`, trang quản trị có tab `simulated`, `community.js` có `puppetBar`;
  `GET /api/community/admin/simulated` trả **401** khi không có quyền admin; `/api/community/stats`
  vẫn trả 200.
- Chủ sở hữu cần bấm một lần: Admin tổng → tab **Khoang riêng** → **Sinh 385 nick**.


- **Khoang riêng của Admin tổng**: tab `Khoang riêng` chỉ hiện khi phiên admin ở mức `primary`;
  backend chặn cứng bằng `primary_admin_required`, không chỉ ẩn nút.
- **385 nick mô phỏng**: 109 khách + 276 reader, sinh một lần bằng `POST /api/community/admin/simulated`.
  Mỗi nick có tên tiếng Việt, hồ sơ, thâm niên và chuyên môn (với reader), màu avatar riêng;
  **QR và số tài khoản để trống** cho chủ sở hữu tự đặt. Nick mô phỏng **không có bản ghi đăng nhập**
  nên không ai đăng nhập được từ ngoài.
- **Chế độ điều khiển (`puppet`)**: khác `impersonation` chỉ đọc — phiên `puppet` **được ghi**, nên
  Admin tổng dùng các nick này bình luận, trả lời, thích và nhắn tin qua lại với nhau. Chỉ cấp cho
  tài khoản có cờ `simulated`, và chỉ Admin tổng xin được.
- Giao diện cộng đồng hiện **thanh báo đang dùng nick nào**, kèm nút quay lại khoang riêng; toàn bộ
  màn hình render theo đúng nick đang dùng.
- Số thành viên công khai đã tính cả 385 nick này vì chúng là hồ sơ thật trong KV.
- Kiểm thử: `community.test.mjs` và `gate.test.mjs` xanh; `node --check` các tệp JS đã sửa.

### 2026-07-25 09:10 GMT+7 — Claude Code — BOITOAN-20260725-03 — HOÀN TẤT ✅

- **Sửa lỗi chủ sở hữu chỉ ra**: gọi đúng là **bài trà** (không phải "bã trà"), và **tên các lá
  Bài Trà nay bằng tiếng Anh** theo bộ biểu tượng tasseography chuẩn (Anchor, Bird, Bell, Book,
  Cat, Circle, Clover, Cross, Crown, Dog, Fish, Flower, Hand, Heart, Horseshoe, House, Key,
  Ladder, Moon, Mountain, Ring, Ship, Snake, Star, Sun, Tree — 26 biểu tượng), đồng bộ với quy
  tắc tên lá tiếng Anh của cả app. Bộ cũ có mục sai ("chìa vôi") đã bỏ.
- **Trả lời và thích bình luận** (giao diện): bình luận dựng thành cây theo `parent_id`, thụt lề
  tối đa 3 cấp; nút thích cho cả bình luận và bài đăng, bấm là đổi ngay rồi mới chờ máy chủ.
- **Avatar chữ cái + badge loại nick** cạnh mỗi tên trong bình luận (khách/reader/admin có màu
  riêng); badge vốn đã có ở thẻ Reader nay phủ nốt phần bình luận.
- **Số thành viên** hiển thị ngay đầu trang cộng đồng, **ai cũng thấy kể cả chưa đăng nhập**, tự
  cập nhật mỗi 20 giây (60 giây khi tab ẩn), rê chuột thấy tách khách/reader/admin.
- **Chat mượt hơn**: trước đây mỗi 1,5 giây vẽ lại toàn bộ danh sách và gửi xong thì dựng lại cả
  màn hình. Nay chỉ nối tin mới, giữ nguyên vị trí đang đọc (chỉ tự cuộn khi đang ở đáy), gửi
  hiện tin ngay lập tức rồi đối chiếu với máy chủ, poll giãn ra 8 giây khi tab ẩn.
- PR #99 merge `ea28771`; CI 4/4 success; đã kiểm chứng production (community.js, trang cộng đồng, CSS, app và API stats đều đúng bản mới).
- Kiểm thử: `community.test.mjs` và `gate.test.mjs` xanh; `node --check` toàn bộ script app và
  `assets/community.js`; vòng mã hoá/giải mã khớp; vùng `<head>` app không đổi.

### 2026-07-25 04:10 GMT+7 — Claude Code — BOITOAN-20260725-02 — ĐANG LÀM ⏳

- **Thêm hai môn mới**: `Rune` (24 rune Elder Futhark, rút 1 hoặc 3, có nghĩa theo lĩnh vực) và
  `Bài Trà` (đọc bã trà theo vùng tách: vành / thân / đáy / gần quai / đối diện quai, 24 biểu tượng).
- **Áp chuẩn đọc của Lenormand cho Tarot và Bài Tây**: lời quẻ kể liền một mạch, bỏ mũi tên `→`,
  bỏ các câu hướng dẫn cách đọc (`đọc cả nghĩa…`, `đối chiếu lá 7 với lá 8…`, `trực giác của bạn
  là một nửa của quẻ bài`, `Trải móng ngựa đọc theo cung…`).
- **Sửa lỗi lọc lĩnh vực ở Tarot và Bài Tây** — cùng lỗi đã sửa cho Lenormand: trải 1–3 lá trước
  đây luôn hiện cả ba/bốn lĩnh vực dù khách đã chọn một.
- **Rút bài ngẫu nhiên thật sự**: `rnd()` bỏ thiên lệch modulo bằng rejection sampling trên
  `crypto.getRandomValues`; `Lá bài ngày` không còn gieo hạt theo ngày (`mulberry32(seed)` đã gỡ),
  nay rút ngẫu nhiên mỗi lần mở.
- Kiểm thử: `node --check` toàn bộ khối script hợp lệ; quét toàn file còn 0 cụm meta, 0 mũi tên
  trong lời quẻ, 0 chỗ gieo hạt; chạy thử lời quẻ Rune và Bài Trà cho kết quả trọn ý.

### 2026-07-25 02:40 GMT+7 — Claude Code — BOITOAN-20260725-01 — ĐANG LÀM ⏳

- Chủ sở hữu chỉ ra ba lỗi còn sót sau BOITOAN-20260724-16, đã sửa cả ba:
  1. **Tên lá bài hiển thị bằng tiếng Anh** trên toàn app (Rider, Scythe, Anchor…), không còn
     tên Việt. Thêm `enName()` và áp cho Lenormand, Tarot, lá bài ngày và lịch sử tra cứu.
  2. **Bỏ hết từ ngữ meta**: `bàn bài`, `Nói thẳng ra thì`, `mở đầu, cho thấy`, `đây mới là chỗ
     mọi chuyện đi về`, `Đọc gọn lại`, và đoạn khuyên mang giọng lên lớp (`lenAdvice` đã gỡ).
  3. **Đọc hẳn ra thay vì hướng dẫn cách đọc**: `lenParas` nay ghép các lá thành một câu chuyện
     liền và nói thẳng kết quả; bỏ mọi câu chỉ dẫn người dùng tự suy.
- Nghĩa mỗi lá cắt tới dấu chấm phẩy đầu tiên nên câu trọn ý, không bị cụt giữa chừng.
- Kiểm thử: quét toàn file còn 0 cụm meta, 0 chỗ hiển thị tên Việt; `node --check` toàn bộ khối
  script hợp lệ; vòng mã hoá/giải mã khớp; vùng `<head>` giống hệt bản cũ.

### 2026-07-25 01:45 GMT+7 — Claude Code — BOITOAN-20260724-16 — ĐANG LÀM ⏳

- Phạm vi: `boitoan/index.html` (máy diễn giải Lenormand), sổ khóa và nhật ký.
- Vấn đề: phần diễn giải lắp ghép rời rạc — mỗi lá một khối nghĩa riêng, lộ nhãn kỹ thuật
  `Là chủ thể / Là bổ nghĩa` và các đoạn giảng phương pháp ra màn hình người dùng; trải 1–3 lá
  đổ nghĩa cả ba lĩnh vực kể cả khi khách đã chọn một lĩnh vực.
- Đã sửa: đọc theo tổ hợp thành một mạch (nền → chuyện chính → lá cuối chốt); lọc đúng lĩnh vực
  được chọn; bỏ nhãn `Máy ghép câu` và các đoạn giải thích ngữ pháp bàn bài; đổi giọng khối trả lời;
  đổi tiêu đề `Tổng luận phối hợp` → `Lời quẻ`.
- Giữ nguyên: dữ liệu 36 lá, thuật toán rút bài, toàn bộ `<head>` (pbkdf2, backend, `mode: 'approval'`).
- Kiểm thử: vòng tròn giải mã → sửa → mã hóa lại → giải mã lại khớp nội dung, file mã hóa không rò
  plaintext; `node --check` 10 khối script inline hợp lệ; vùng `<head>` giống hệt bản cũ.
- Còn chờ: CI của PR #92 và nghiệm thu thực tế trên iPhone.

### 2026-07-25 01:22 GMT+7 — ChatGPT GPT-5.6 — SEO-20260725-01 — HOÀN TẤT KỸ THUẬT ✅

- Triển khai Growth Autopilot khép kín: tìm sản phẩm → lọc → tạo deep link affiliate → cập nhật catalog/web → dựng SEO → gửi IndexNow → đồng bộ click/đơn/hoa hồng → dashboard owner.
- Worker cron chạy 5 phút để đồng bộ doanh thu; discovery/tạo lại link và SEO chỉ chạy khi đủ 6 giờ. Deploy trigger chạy ngay vòng đầu.
- `backend/choice-revenue.js` đọc AccessTrade order-list/transactions và click KV; tính doanh số, commission pending/approved/rejected, conversion, EPC, approved EPC, AOV, biểu đồ 30 ngày, top sản phẩm/campaign và cảnh báo.
- Dashboard owner-only `/owner/choice/revenue`: đúng Telegram owner dùng `/doanhthu` nhận vé một lần 10 phút; cookie `HttpOnly; Secure; SameSite=Strict` 12 giờ; không phiên `401`; mọi response `noindex/no-store`; không giữ tên, điện thoại hoặc email khách hàng.
- Lệnh owner: `/doanhthu`, `/doanhthu-ngay`, `/doanhthu7`, `/doanhthu30`, `/dongbo-doanhthu`.
- SEO publisher tự tạo HTML tĩnh sản phẩm/danh mục/hướng dẫn, Product/Offer/Breadcrumb/ItemList/FAQ/Article JSON-LD, canonical, Open Graph, Twitter metadata, sitemap và RSS.
- IndexNow key và bulk submission đã deploy; production step IndexNow success. Google Search Console script có nhánh skip an toàn khi chưa có service account.
- Public API sản phẩm có ảnh/thời điểm xác minh nhưng không lộ URL affiliate thô, metadata vận hành hoặc doanh thu.
- PR #91 merge source `a73a807c7fedbcf7d8adad6ad8b0a0cd5d83e4b0`.
- CI điều phối `30116008064`: success.
- Validation cuối `30116312380`: Worker, Affiliate, Revenue, SEO, public-private boundary, frontend và WebKit AES thật đều success.
- Production `30116421342`: source, SEO build, Worker-before-Pages, Growth trigger, Pages, IndexNow, Google step và smoke đều success.
- Production recorder commit `915178f6ead00c4052391caf925ceea385b5fc75`; internal recorder `30116490615`, commit `e9ee55f3d55c14d10b83bbbb48efc794a7c0a6c6`.
- Recorder xác nhận `onboarding_required`, credential false, sản phẩm/đơn thật bằng 0. Đây là external onboarding AccessTrade bắt buộc một lần, không phải lỗi kỹ thuật.
- Sau khi owner đăng nhập/KYC và gửi `/atkey <API_KEY>`, hệ thống tự tạo link, cập nhật web và đồng bộ doanh thu; owner không vận hành từng sản phẩm.
- Task chuyển `completed`; toàn bộ khóa được giải phóng.

### 2026-07-24 23:41 GMT+7 — ChatGPT GPT-5.6 — GOVERNANCE-20260724-01 — HOÀN TẤT ✅

- Chủ sở hữu phát hiện đúng một lỗi nghiêm trọng: build đã chèn trạng thái Autopilot, chế độ dự phòng và thông điệp dành cho chủ sở hữu lên footer public.
- Đã gỡ hoàn toàn badge/footer/script nội bộ; thay bằng nội dung có ích cho người mua về quyền riêng tư, tương thích, bảo hành, đổi trả và giá cuối cùng.
- PWA tăng từ `hoi-chon-dung-v2` lên `hoi-chon-dung-v3`, xóa cache cũ khi activate và không còn cache module trạng thái.
- Đã xóa public status handler khỏi module materialized; Worker trả `404` cho route trạng thái, còn trigger run nội bộ vẫn bắt buộc secret.
- Recorder không gọi API public; đọc `choice:autopilot:status:v1` trực tiếp từ Cloudflare KV bằng quyền CI và ghi rõ tài liệu owner/internal.
- Dữ liệu sản phẩm public không còn nhãn Autopilot/AccessTrade, điểm xếp hạng nội bộ hoặc UTM mang tên cơ chế vận hành.
- Ban hành `docs/handover/AUDIENCE_PRIVACY_STANDARD.md`, cập nhật `AGENTS.md`, và merge quy chế công ty toàn cục tại `4f2c6bf2ba61c041d737e90c12d5aa82205f1d8a`.
- Cổng `tools/check-public-content.mjs` chạy trên source sau materialize và toàn bộ `_site`; một vi phạm public/private sẽ chặn merge/deploy.
- PR #89 merge source `d72e3552a5a71e6f4ef14a4205b3e6f4ed2d25b5`.
- CI: điều phối `30108929684`, regression/public-private/WebKit `30108929401`, recorder nội bộ `30108929479` — success.
- Production `30109841905`: source boundary, Worker, Pages, PWA V3 và hậu kiểm production đều success; status public trả `404` và nội dung owner/internal không tồn tại trên HTML công khai.
- Recorder `30109889703` đọc KV nội bộ thành công; commit hồ sơ `a22f0ef29f7712077e0202d7c89444b0ff288f03`.
- Task chuyển `completed`; toàn bộ khóa được giải phóng.

### 2026-07-24 22:34 GMT+7 — ChatGPT GPT-5.6 — AFFILIATE-20260724-02 — HOÀN TẤT KỸ THUẬT ✅

- Triển khai Affiliate Autopilot: tự lấy datafeed, lọc rủi ro, tuyển sản phẩm, tạo deep link, đọc giao dịch, cập nhật catalog và chạy theo cron.
- PR #86 runtime source `c4591418ae92adc77d0201e8e55737cd6ce929db`; CI `30104948933`, `30104948983`; production `30105078450`: success.
- PR #87 recorder source `5ba62c6e67ff15eb49e1eb155e3763fa52f71508`; production `30105568525`, recorder `30105641911`: success.
- Trạng thái kinh doanh và onboarding sau governance fix chỉ còn trong kênh owner/internal.

### 2026-07-24 21:29 GMT+7 — ChatGPT GPT-5.6 — AFFILIATE-20260724-01 — HOÀN TẤT ✅

- Triển khai PWA **Hội Chọn Đúng** tại `/hoi-chon-dung/`, có bộ chọn nhu cầu, so sánh, lưu, chia sẻ và bình chọn.
- PR #84 merge `f57023af442839da852354672bea8036e579a9fd`; CI và production `30100989464`: success.
- V1 sau đó được V2 thay thế về mô hình vận hành.

### 2026-07-23 19:33 GMT+7 — ChatGPT GPT-5.6 — BOITOAN-20260723-10 — HOÀN TẤT ✅

- Hoàn thiện xác thực hai cấp Admin, JWT gắn thiết bị và không lưu mật khẩu plaintext.
- PR #64 merge `f5ac80b72005e1bc9f2d934ca4ffbdb57ec427a8`; CI và production success.

### 2026-07-23 18:54 GMT+7 — ChatGPT GPT-5.6 — TRAVEL-20260723-01 — HOÀN TẤT ✅

- Tạo PWA `/vietnam-travel/`, có tìm kiếm, lọc, yêu thích, bản đồ, chia sẻ và offline shell.
- Validation `30004367095`; production `30004367100`: success.
