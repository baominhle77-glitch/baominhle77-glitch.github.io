/* ============================================================
   DỮ LIỆU MỞ RỘNG data5.js
   — Lenormand danh từ/tính từ (máy tự ghép câu)
   — Golden Dawn: nguyên tố + chiêm tinh 22 Ẩn Chính, elemental dignity
   — Lá Hoàng gia (Court cards) & Nghệ thuật đọc bài
   Nguồn: Rachel Pollack, "78 Degrees of Wisdom"; Elemental Dignities (Golden Dawn).
   ============================================================ */

/* ---------- LENORMAND: mỗi lá vừa là DANH TỪ (chủ thể) vừa là TÍNH TỪ (bổ nghĩa) ----------
   Cùng thứ tự & chỉ số mảng với LENORMAND (0..35).
   noun = cụm danh từ khi lá đứng làm chủ thể/tâm điểm.
   adj  = cụm vị ngữ khi lá đứng bổ nghĩa cho lá bên cạnh (ghép sau chủ thể). */
const LEN_NA = [
{noun:"một tin tức hoặc người mới đang tiến đến",adj:"đến nhanh và khởi động chuyển động"},
{noun:"một vận may nhỏ thoáng qua",adj:"mang chút may mắn nhẹ nhõm nhưng ngắn ngủi"},
{noun:"một hành trình hoặc chuyện làm ăn từ xa",adj:"gắn với sự dịch chuyển, đường xa và thương mại"},
{noun:"chuyện gia đình và mái ấm",adj:"mang tính ổn định, thuộc về nhà cửa và người thân"},
{noun:"vấn đề sức khoẻ và sự phát triển bén rễ",adj:"diễn ra chậm, sâu và cần thời gian"},
{noun:"một nỗi hoang mang, rắc rối chưa rõ ràng",adj:"bị che phủ bởi mờ mịt và bất định"},
{noun:"một sự phức tạp, người khôn khéo hoặc cám dỗ",adj:"đi đường vòng, tiềm ẩn mưu mẹo hoặc phản trắc"},
{noun:"một sự kết thúc hoặc giai đoạn ngủ đông",adj:"đang khép lại, cạn kiệt, cần buông để đi tiếp"},
{noun:"một món quà, lời mời hoặc niềm vui đẹp",adj:"mang sự dễ chịu, được trân trọng và duyên dáng"},
{noun:"một quyết định cắt đứt dứt khoát",adj:"đến đột ngột, sắc bén và không báo trước"},
{noun:"một cuộc tranh cãi hoặc sự lặp lại",adj:"gây xung đột, cọ xát và lặp đi lặp lại"},
{noun:"những cuộc trò chuyện và bàn tán",adj:"kèm chút lo lắng lặt vặt, rộn ràng theo cặp"},
{noun:"một khởi đầu nhỏ còn non trẻ",adj:"mới mẻ, ngây thơ, quy mô còn nhỏ"},
{noun:"chuyện mưu sinh hoặc sự khôn ranh",adj:"cần cảnh giác và tính toán tự bảo vệ"},
{noun:"một người có quyền lực hoặc nguồn tiền lớn",adj:"mạnh mẽ, che chở nhưng có thể lấn át"},
{noun:"niềm hy vọng và định hướng dài hạn",adj:"sáng rõ, đầy cảm hứng và dẫn lối"},
{noun:"một sự thay đổi, dịch chuyển tích cực",adj:"đang nâng cấp, chuyển sang trạng thái tốt hơn"},
{noun:"một tình bạn, người trung thành",adj:"đáng tin, ở bên và ủng hộ"},
{noun:"một cơ quan, ranh giới hoặc sự đơn độc",adj:"mang tính chính thức, tách biệt, nhìn từ trên cao"},
{noun:"một sự kiện, đám đông hoặc chốn công cộng",adj:"mang tính xã hội, được nhiều người biết"},
{noun:"một trở ngại lớn",adj:"đang bị chặn, trì hoãn và nặng nề khó vượt"},
{noun:"một lựa chọn giữa nhiều ngả đường",adj:"phân nhánh, đòi hỏi tự quyết định"},
{noun:"một sự hao mòn hoặc mất mát âm thầm",adj:"bị bào mòn, hao hụt và gặm nhấm dần"},
{noun:"chuyện tình cảm và sự rung động chân thành",adj:"mang tình yêu, sự ấm áp và thiện cảm"},
{noun:"một cam kết, hợp đồng hoặc vòng lặp",adj:"gắn kết, ràng buộc và có tính giao ước"},
{noun:"một bí mật hoặc tri thức chưa mở",adj:"còn kín, cần học hỏi, chưa lộ ra"},
{noun:"một văn bản, tin nhắn hoặc giấy tờ",adj:"được ghi thành chữ, mang thông tin cụ thể"},
{noun:"người đàn ông trong câu chuyện",adj:"liên quan trực tiếp tới một người nam"},
{noun:"người phụ nữ trong câu chuyện",adj:"liên quan trực tiếp tới một người nữ"},
{noun:"sự bình yên chín chắn hoặc người lớn tuổi",adj:"điềm đạm, thanh khiết và trưởng thành"},
{noun:"thành công và sinh lực rực rỡ",adj:"tràn năng lượng tích cực, chắc chắn tốt lành"},
{noun:"danh tiếng, sự công nhận và đời sống cảm xúc",adj:"được nhìn thấy, giàu cảm xúc và trực giác"},
{noun:"một câu trả lời chắc chắn, một giải pháp",adj:"khẳng định «có», mở khoá và rất quan trọng"},
{noun:"dòng tiền, kinh doanh và sự dồi dào",adj:"trôi chảy, sinh lợi và nhiều nguồn"},
{noun:"sự ổn định lâu dài, một bến đỗ",adj:"bền vững, kiên trì và neo giữ chắc chắn"},
{noun:"một gánh nặng hoặc bài học định mệnh",adj:"nặng nề nhưng có hạn kỳ, mang tính thử thách"}
];

/* ---------- GOLDEN DAWN: nguyên tố + chiêm tinh 22 Ẩn Chính (0..21) ----------
   el = nguyên tố dùng cho elemental dignity (Hỏa/Nước/Khí/Đất). */
const MAJOR_ASTRO = [
{el:"Khí", astro:"Nguyên tố Khí (Thiên Vương) — hơi thở khởi nguyên, tự do vô định."},
{el:"Khí", astro:"Sao Thủy (Mercury) — trí tuệ, giao tiếp, đôi tay khéo léo."},
{el:"Nước",astro:"Mặt Trăng (Luna) — trực giác, tiềm thức, bí mật."},
{el:"Đất", astro:"Sao Kim (Venus) — tình yêu, phồn thực, cái đẹp nuôi dưỡng."},
{el:"Hỏa", astro:"Bạch Dương (Aries · Hỏa) — quyền lực khởi tạo, ý chí trật tự."},
{el:"Đất", astro:"Kim Ngưu (Taurus · Đất) — truyền thống, bền bỉ, giá trị."},
{el:"Khí", astro:"Song Tử (Gemini · Khí) — lựa chọn, kết nối, đối thoại."},
{el:"Nước",astro:"Cự Giải (Cancer · Nước) — ý chí bọc trong vỏ giáp, mái nhà."},
{el:"Hỏa", astro:"Sư Tử (Leo · Hỏa) — sức mạnh nội tâm, lòng can đảm dịu dàng."},
{el:"Đất", astro:"Xử Nữ (Virgo · Đất) — đi tìm minh triết, chắt lọc, tĩnh lặng."},
{el:"Hỏa", astro:"Sao Mộc (Jupiter) — mở rộng, vận may, chu kỳ số phận."},
{el:"Khí", astro:"Thiên Bình (Libra · Khí) — cân bằng, nhân quả, công lý."},
{el:"Nước",astro:"Nguyên tố Nước (Hải Vương) — buông bỏ, hy sinh, đảo chiều góc nhìn."},
{el:"Nước",astro:"Bọ Cạp (Scorpio · Nước) — chuyển hoá tận gốc, chết đi sống lại."},
{el:"Hỏa", astro:"Nhân Mã (Sagittarius · Hỏa) — điều hoà, pha trộn, hướng đích."},
{el:"Đất", astro:"Ma Kết (Capricorn · Đất) — ràng buộc vật chất, dục vọng, kỷ luật."},
{el:"Hỏa", astro:"Sao Hỏa (Mars) — phá vỡ đột ngột, giải phóng dữ dội."},
{el:"Khí", astro:"Bảo Bình (Aquarius · Khí) — hy vọng, tầm nhìn, chữa lành."},
{el:"Nước",astro:"Song Ngư (Pisces · Nước) — ảo ảnh, mộng mị, trực giác đêm tối."},
{el:"Hỏa", astro:"Mặt Trời (Sol) — sinh lực, niềm vui, thành công hiển lộ."},
{el:"Hỏa", astro:"Nguyên tố Hỏa (Diêm Vương) — thức tỉnh, phán xét, tái sinh."},
{el:"Đất", astro:"Sao Thổ (Saturn) — hoàn tất, cấu trúc, thời gian viên mãn."}
];

/* Nguyên tố theo bộ chất (Minor Arcana) */
const SUIT_ELEM_NOTE = {
"Hỏa":"Gậy (Wands · Hỏa) — hành động, đam mê, ý chí, tinh thần.",
"Nước":"Cốc (Cups · Nước) — cảm xúc, tình cảm, quan hệ, trực giác.",
"Khí":"Kiếm (Swords · Khí) — tư duy, sự thật, lời nói, xung đột.",
"Đất":"Tiền (Pentacles · Đất) — vật chất, tiền bạc, sức khoẻ, nền tảng."
};

/* ---------- LÁ HOÀNG GIA (Court cards): người / tình huống / thông điệp ----------
   Khớp theo tên trong TAROT. */
const COURT_META = [
{n:"Bồi Gậy (Page of Wands)",person:"Người trẻ nhiệt huyết, ưa khám phá; sứ giả mang cơ hội.",situation:"Giai đoạn học hỏi, thử nghiệm ý tưởng mới đầy hào hứng.",message:"Có tin vui về một cơ hội — hãy dấn thân với tinh thần học hỏi."},
{n:"Kỵ Sĩ Gậy (Knight of Wands)",person:"Chàng trai bốc lửa, phiêu lưu, hành động nhanh nhưng dễ bốc đồng.",situation:"Mọi việc tăng tốc, dời chỗ, du hành, dự án bứt phá.",message:"Hãy hành động táo bạo — nhưng chuẩn bị sẵn phanh và kế hoạch B."},
{n:"Hoàng Hậu Gậy (Queen of Wands)",person:"Người phụ nữ tự tin, quyến rũ, ấm áp và truyền cảm hứng.",situation:"Bạn toả sáng nhờ sự tự tin và mạng lưới quan hệ rộng.",message:"Giữ lửa bằng đời sống riêng phong phú; tự tin là tài sản."},
{n:"Vua Gậy (King of Wands)",person:"Nhà lãnh đạo có tầm nhìn, doanh nhân truyền lửa cho đội ngũ.",situation:"Thời điểm nhận vai đầu tàu hoặc gặp người đỡ đầu tầm cỡ.",message:"Nhìn xa, giao việc, giữ lửa — nhưng đừng áp đặt lộ trình lên người khác."},
{n:"Bồi Cốc (Page of Cups)",person:"Tâm hồn mơ mộng, nhạy cảm; sứ giả của tình cảm và sáng tạo.",situation:"Một lời tỏ tình, tin nhắn ngọt hoặc ý tưởng nghệ thuật chớm nở.",message:"Đón nhận cảm xúc trong sáng; nghe trực giác, đáp lại chân thành."},
{n:"Kỵ Sĩ Cốc (Knight of Cups)",person:"Chàng lãng mạn đa cảm, mang lời tỏ tình hoặc lời mời đẹp.",situation:"Một đề nghị tình cảm/hợp tác nghe rất đẹp đang tới.",message:"Cho thời gian để xem sự lãng mạn có đi cùng trách nhiệm không."},
{n:"Hoàng Hậu Cốc (Queen of Cups)",person:"Người phụ nữ thấu cảm sâu, bao dung, trực giác mạnh.",situation:"Bạn là chỗ dựa cảm xúc; nghề chăm sóc con người vượng.",message:"Giữ lòng trắc ẩn mà không đánh mất ranh giới của mình."},
{n:"Vua Cốc (King of Cups)",person:"Người đàn ông điềm đạm, làm chủ cảm xúc, cố vấn nhân hậu.",situation:"Giữa sóng gió cảm xúc, người bình tĩnh giữ được con thuyền.",message:"Lãnh đạo bằng trí tuệ cảm xúc; tìm kênh xả lành cho chính mình."},
{n:"Bồi Kiếm (Page of Swords)",person:"Người trẻ lanh lợi, tò mò, hay dò xét; sứ giả tin tức.",situation:"Có tin cần kiểm chứng; giai đoạn học hỏi, quan sát.",message:"Sắc bén nhưng thận trọng — lời nói có thể làm tổn thương."},
{n:"Kỵ Sĩ Kiếm (Knight of Swords)",person:"Người lao thẳng vào mục tiêu, tranh luận sắc, hành động thần tốc.",situation:"Xung đột lời nói, quyết định gấp, tin tức tới dồn dập.",message:"Nhanh và thẳng — nhưng đừng để lời như dao và thiếu kế hoạch."},
{n:"Hoàng Hậu Kiếm (Queen of Swords)",person:"Người phụ nữ sắc sảo, độc lập, nói thẳng, phán đoán công tâm.",situation:"Cần sự minh bạch, ranh giới rõ và lý trí lạnh.",message:"Nói thật, giữ ranh giới; cẩn thận kẻo lạnh lùng hoá cô lập."},
{n:"Vua Kiếm (King of Swords)",person:"Người trí tuệ, quyền uy về luật lệ/chuyên môn, phán quyết công minh.",situation:"Vấn đề pháp lý, đánh giá, quyết định cần công tâm.",message:"Dùng trí tuệ để phân xử đúng công tội, tránh độc đoán lạnh lùng."},
{n:"Bồi Tiền (Page of Pentacles)",person:"Người trẻ chăm chỉ, thực tế; sứ giả về tiền hoặc học hành.",situation:"Cơ hội học nghề, tin tức tài chính, kế hoạch dài hạn khởi động.",message:"Kiên trì học và thực hành; đặt nền cho một mục tiêu cụ thể."},
{n:"Kỵ Sĩ Tiền (Knight of Pentacles)",person:"Người bền bỉ, đáng tin, tiến chậm mà chắc, làm tròn bổn phận.",situation:"Giai đoạn xây từng viên gạch, ổn định, đáng tin cậy.",message:"Chậm mà chắc thắng; cẩn thận kẻo cầu toàn hoá trì trệ."},
{n:"Hoàng Hậu Tiền (Queen of Pentacles)",person:"Người phụ nữ đảm đang, thực tế, vun vén tổ ấm lẫn tài chính.",situation:"Cân bằng việc nhà — việc tiền, chăm sóc cụ thể và ấm áp.",message:"Vun vén thực tế; đừng ôm đồm đến mức bỏ bê bản thân."},
{n:"Vua Tiền (King of Pentacles)",person:"Doanh nhân thành đạt, vững vàng, hào phóng, chạm đâu ra tiền.",situation:"Nền tảng tài chính vững; cơ hội đầu tư, mở rộng có kiểm soát.",message:"Xây dựng bền vững và hào phóng; đừng dùng tiền để kiểm soát người."}
];

/* ---------- NGHỆ THUẬT ĐỌC BÀI — 10 nguyên tắc (tinh thần 78 Degrees of Wisdom) ---------- */
const READING_ART = [
{n:"1. Đặt câu hỏi rõ ràng",m:"Câu hỏi càng cụ thể, lá bài trả lời càng sắc. «Chuyện này sẽ ra sao nếu tôi giữ nguyên cách làm?» tốt hơn «Số phận tôi thế nào?». Bài phản chiếu tình huống bạn ĐANG hỏi."},
{n:"2. Vị trí quyết định nghĩa",m:"Cùng một lá, ở ô «thách thức» khác hẳn ở ô «kết quả». Luôn đọc lá TRONG vai trò của vị trí nó rơi vào, đừng đọc nghĩa lá tách rời khỏi trải bài."},
{n:"3. Đọc lá trong quan hệ với nhau",m:"Không lá nào đứng một mình. Nghĩa thật nảy ra khi các lá cạnh nhau soi chiếu, mâu thuẫn hoặc cộng hưởng — hãy đọc cả bàn như một câu, không phải danh sách rời rạc."},
{n:"4. Elemental Dignity (nguyên tố hợp/kỵ)",m:"Golden Dawn: hai lá CÙNG nguyên tố tăng lực cho nhau; Hỏa hợp Khí, Nước hợp Đất (cùng hướng chủ động/thụ động); Hỏa–Nước và Khí–Đất KỴ nhau, làm suy yếu hoặc trung hoà. Lá mạnh cạnh lá kỵ thì bị ghìm bớt."},
{n:"5. Ẩn Chính vs Ẩn Phụ",m:"Nhiều lá Ẩn Chính (Major) = lực số phận, bước ngoặt lớn, ngoài tầm kiểm soát thường ngày. Nhiều Ẩn Phụ (Minor) = chuyện đời thường, xoay chuyển được bằng hành động cụ thể."},
{n:"6. Chất bộ áp đảo (suit dominance)",m:"Đếm bộ trội: nhiều Gậy = hành động/đam mê; nhiều Cốc = cảm xúc/quan hệ; nhiều Kiếm = tư duy/xung đột; nhiều Tiền = vật chất/nền tảng. Bộ trội cho biết CHẤT LIỆU của câu trả lời."},
{n:"7. Lá ngược không phải nghĩa đối lập",m:"Lá ngược = năng lượng bị chặn, chậm, hướng vào trong hoặc chưa thông — chứ không đơn giản là «điều ngược lại». Đọc như tiềm năng đang tắc, cần khơi cho chảy."},
{n:"8. Lá Hoàng gia = người hoặc khía cạnh bản thân",m:"Court card có thể là một người thật quanh bạn, hoặc một mặt tính cách/vai trò bạn đang mang. Xét lá xung quanh để biết đó là ai và đang đóng vai gì."},
{n:"9. Trực giác cộng với hình ảnh",m:"Cảm giác đầu tiên khi lật lá và chi tiết hình vẽ (màu, hướng nhìn, cử chỉ) là một nửa của quẻ bài. Sách cho khung, trực giác cho hồn — dùng cả hai."},
{n:"10. Tương lai là dòng chảy, không phải bản án",m:"Lá «kết quả» cho biết xu hướng NẾU giữ nguyên hướng đi hiện tại. Đổi hành động ở điểm nút (thường là lá giữa/lá thách thức) sẽ đổi kết cục. Bài để trao quyền, không phải để định đoạt thay bạn."}
];
