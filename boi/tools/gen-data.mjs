// Sinh boi/data/tarot.json và boi/data/lenormand.json từ bảng gọn bên dưới.
// Chạy: node boi/tools/gen-data.mjs  (sửa nghĩa lá ở đây rồi chạy lại, không sửa JSON bằng tay)
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "data");

// [en, vi, biểu tượng, từ khoá, tiền/công việc, rủi ro, tiến trình, hiệu quả, kết quả, tín hiệu mức tiền, lời khuyên, điểm tiền, điểm chung, tốc độ]
const MAJOR = [
  ["The Fool", "Chàng Khờ", "🎒", "khởi đầu mới, liều lĩnh, tự do, ngây thơ", "Bước vào việc mới hoặc nguồn thu mới khi chưa có kế hoạch rõ; tiền đến từ thử nghiệm.", "Bốc đồng, thiếu tính toán, dễ hụt chân vì tin người hoặc tin vận may.", "Mới bắt đầu, còn đang dò đường", "Hứng khởi nhưng thiếu cấu trúc, hiệu quả chưa ổn định", "Kết quả mở: có cơ hội nhưng chưa chắc thành tiền", "Mức tiền nhỏ, thất thường, phụ thuộc lần thử", "Thử nhỏ trước, đặt giới hạn lỗ rồi mới nhảy.", 0, 1, 1.3],
  ["The Magician", "Nhà Ảo Thuật", "✨", "năng lực, chủ động, kỹ năng, biến ý tưởng thành việc", "Tự tạo ra tiền bằng kỹ năng, bán hàng, đàm phán; có đủ công cụ trong tay.", "Thao túng, nói hay hơn làm; cẩn thận người dẻo miệng.", "Chủ động ra tay, đang triển khai", "Làm đúng việc, hiệu quả cao nhờ kỹ năng", "Tự tay tạo ra kết quả, thành hình rõ", "Tiền tăng nhờ chủ động, mức khá", "Dùng đúng thế mạnh của mình, đừng chờ người khác mở đường.", 1.5, 1.5, 1.3],
  ["The High Priestess", "Nữ Tư Tế", "🌙", "trực giác, bí mật, chờ đợi, điều chưa lộ", "Tiền và thông tin còn ẩn; chưa nên quyết khi chưa đủ dữ kiện.", "Có điều bị giấu, hợp đồng có chi tiết chưa đọc kỹ.", "Âm thầm, chưa lộ diện", "Hiệu quả chậm, khó đo", "Kết quả chưa rõ, cần thêm thời gian", "Mức tiền đứng, chưa bật", "Quan sát, hỏi kỹ, đọc kỹ giấy tờ trước khi gật đầu.", 0, 0.5, 0.6],
  ["The Empress", "Hoàng Hậu", "🌾", "sung túc, sinh sôi, nuôi dưỡng, sáng tạo", "Thu nhập tăng tự nhiên, kinh doanh sinh lời, việc nuôi dưỡng ra quả.", "Chi tiêu hưởng thụ quá tay, dễ dãi với người khác.", "Phát triển đều, đang lớn dần", "Sinh lời tốt, công sức ra quả", "Kết quả đầy đặn, dư dả", "Tiền tăng rõ, mức tốt", "Chăm đều nguồn thu đang có, đừng tiêu trước phần chưa về.", 1.5, 1.5, 0.9],
  ["The Emperor", "Hoàng Đế", "👑", "kiểm soát, kỷ luật, cấu trúc, quyền lực", "Tiền đến từ hệ thống, quản trị, vị trí ổn định; kế hoạch rõ thì thắng.", "Cứng nhắc, áp đặt, xung đột với cấp trên/quyền lực.", "Có khung, đi theo kế hoạch", "Hiệu quả nhờ kỷ luật", "Kết quả vững, kiểm soát được", "Tiền ổn định, tăng có kiểm soát", "Lập kế hoạch, đặt quy tắc tài chính và giữ đúng.", 1, 1, 0.8],
  ["The Hierophant", "Giáo Hoàng", "📜", "truyền thống, quy chuẩn, thầy, tổ chức", "Tiền theo kênh chính thống: lương, hợp đồng, tổ chức; học thêm để tăng thu.", "Gò bó, phụ thuộc quy trình, bị nói theo 'lệ'.", "Theo quy trình, thủ tục", "Hiệu quả ổn nhưng không bứt", "Kết quả đúng chuẩn, an toàn", "Tiền đều, mức trung bình khá", "Đi đường chính thống, có giấy tờ, hỏi người có chuyên môn.", 0.5, 0.5, 0.7],
  ["The Lovers", "Đôi Tình Nhân", "💞", "lựa chọn, hợp tác, giá trị, gắn kết", "Hợp tác/đối tác quyết định tiền; một lựa chọn lớn cần làm.", "Chọn theo cảm xúc, hợp tác lệch giá trị.", "Đứng trước lựa chọn, đang kết nối", "Hiệu quả phụ thuộc người cùng làm", "Kết quả tốt nếu chọn đúng người/đúng hướng", "Tiền khá nhờ hợp tác", "Chọn theo giá trị lâu dài, viết rõ thoả thuận hợp tác.", 0.5, 1.5, 1],
  ["The Chariot", "Cỗ Xe", "🏇", "quyết tâm, tiến lên, chiến thắng, kiểm soát hướng đi", "Đẩy mạnh doanh số, thắng nhờ quyết tâm; di chuyển, mở rộng.", "Hiếu thắng, đi nhanh mất kiểm soát.", "Tiến nhanh, có đà", "Hiệu quả cao nếu giữ hướng", "Thắng, đạt mục tiêu", "Tiền tăng nhanh, mức tốt", "Chọn một hướng và dồn lực; đừng bắt cá hai tay.", 1.5, 1.5, 1.4],
  ["Strength", "Sức Mạnh", "🦁", "bản lĩnh, kiên nhẫn, mềm mà mạnh, tự chủ", "Giữ được nhịp làm việc, thuyết phục khách bằng sự bền bỉ.", "Kìm nén quá lâu, gồng gánh một mình.", "Bền bỉ vượt khó", "Hiệu quả nhờ kiên trì", "Giữ vững được, thắng bằng sức bền", "Tiền ổn, tăng chậm mà chắc", "Kiên nhẫn với việc khó, kiểm soát cảm xúc khi giao dịch.", 1, 1.5, 0.8],
  ["The Hermit", "Ẩn Sĩ", "🏮", "rút lui, chiêm nghiệm, chuyên sâu, một mình", "Thu nhập chậm, tập trung chuyên môn; giai đoạn học/chuẩn bị.", "Cô lập, bỏ lỡ cơ hội vì quá thận trọng.", "Chậm lại, rút về làm sâu", "Hiệu quả thấp về tiền, cao về hiểu biết", "Kết quả nhỏ, chưa phải lúc gặt", "Tiền thấp, đi ngang", "Dùng giai đoạn này để mài chuyên môn, không chi lớn.", -0.5, 0, 0.5],
  ["Wheel of Fortune", "Bánh Xe Số Phận", "☸️", "chu kỳ, bước ngoặt, may rủi, thời vận", "Thời vận xoay chuyển; có cơ hội bất ngờ, thu nhập lên xuống theo chu kỳ.", "Phó mặc vận may, lúc lên quên phòng lúc xuống.", "Đang đổi chiều", "Hiệu quả tuỳ thời điểm", "Bước ngoặt, thường theo hướng tốt lên", "Tiền dao động, có nhịp bật", "Nắm thời cơ khi đến nhưng luôn để quỹ dự phòng.", 1, 1, 1.3],
  ["Justice", "Công Lý", "⚖️", "công bằng, hợp đồng, nhân quả, minh bạch", "Tiền đúng công sức; hợp đồng, giấy tờ, pháp lý quyết định.", "Tranh chấp pháp lý nếu làm ẩu; trả giá cho sai lầm cũ.", "Cân nhắc, xét lại", "Hiệu quả tương xứng công sức", "Kết quả công bằng, đúng phần mình", "Tiền đúng mức đã thoả thuận", "Làm rõ giấy tờ, sòng phẳng mọi khoản.", 0.5, 0.5, 0.8],
  ["The Hanged Man", "Người Treo Ngược", "🙃", "tạm dừng, hy sinh, nhìn khác đi, chờ", "Tiền bị treo, chậm thanh toán; cần đổi góc nhìn về cách kiếm tiền.", "Chờ vô ích, hy sinh không được đền đáp.", "Bị treo, đứng yên", "Hiệu quả thấp, tốn công chờ", "Chưa có kết quả, phải đổi cách", "Tiền chậm, bị giữ lại", "Đừng đổ thêm tiền vào việc đang kẹt; đổi cách tiếp cận.", -1, -0.5, 0.4],
  ["Death", "Thần Chết", "🥀", "kết thúc, chuyển hoá, dọn sạch, sang trang", "Một nguồn thu/công việc kết thúc để mở cái mới; buộc phải thay đổi.", "Bám víu cái đã hết, mất thu nhập đột ngột.", "Đang khép lại một giai đoạn", "Hiệu quả cũ chấm dứt", "Kết thúc để đổi mới", "Tiền giảm trước khi đổi chiều", "Chấp nhận cắt bỏ cái không còn sinh lời, chuẩn bị phương án mới.", -1, 0, 1],
  ["Temperance", "Tiết Chế", "🏺", "cân bằng, điều độ, hoà hợp, từ từ", "Thu chi cân đối, tiền tăng đều; phối hợp nhiều nguồn nhỏ.", "Lưng chừng, không dám dứt khoát.", "Đi đều, điều chỉnh dần", "Hiệu quả vừa phải, bền", "Kết quả cân bằng, đủ dùng", "Tiền đều, mức trung bình", "Giữ nhịp đều, chia nhỏ mục tiêu, đừng dồn tất cả một chỗ.", 0.5, 1, 0.6],
  ["The Devil", "Ác Quỷ", "⛓️", "ràng buộc, cám dỗ, nghiện, vật chất", "Tiền có nhưng bị trói: nợ, hợp đồng bất lợi, kênh kiếm tiền mờ ám.", "Vay nóng, cờ bạc, đầu tư 'lãi khủng', bị kiểm soát bởi tiền.", "Bị cuốn vào, khó dứt", "Có tiền nhưng phải trả giá", "Kết quả trói buộc, lợi ngắn hại dài", "Tiền có thể to nhưng không sạch/không giữ", "Tránh vay nóng, cờ bạc, kèo lãi cao; đọc kỹ ràng buộc.", -1, -1.5, 1],
  ["The Tower", "Toà Tháp", "🗼", "sụp đổ, biến cố, sự thật phơi bày, đột ngột", "Biến cố tài chính đột ngột: mất việc, vỡ kế hoạch, chi phí bất ngờ.", "Sụp đổ cấu trúc cũ, lừa đảo lộ ra, mất tiền nhanh.", "Đứt gãy đột ngột", "Hiệu quả sụp, phải làm lại", "Đổ vỡ rồi mới dựng lại", "Tiền tụt mạnh", "Giữ quỹ khẩn cấp, không dồn hết vốn vào một chỗ.", -2, -2, 1.5],
  ["The Star", "Ngôi Sao", "⭐", "hy vọng, chữa lành, cảm hứng, tầm nhìn", "Phục hồi sau khó khăn; tiền tăng chậm nhưng có hướng sáng.", "Mơ mộng, kỳ vọng xa hơn thực lực.", "Hồi phục, có hy vọng", "Hiệu quả tăng dần", "Kết quả sáng, mở đường lâu dài", "Tiền khá dần lên", "Giữ niềm tin nhưng có kế hoạch cụ thể từng bước.", 1, 1.5, 0.7],
  ["The Moon", "Mặt Trăng", "🌘", "mơ hồ, ảo tưởng, lo âu, che giấu", "Tiền mập mờ, thông tin không rõ; dễ bị lừa hoặc tự lừa mình.", "Lừa đảo, giấy tờ mờ, người hứa hẹn không thật, lo âu quyết sai.", "Mù mờ, chưa thấy đường", "Hiệu quả khó đo, dễ hiểu sai", "Kết quả không như vẻ ngoài", "Tiền bấp bênh, có nguy cơ hụt", "Kiểm chứng mọi lời hứa tiền, không chuyển khoản khi chưa rõ.", -1.5, -1, 0.8],
  ["The Sun", "Mặt Trời", "☀️", "thành công, rõ ràng, niềm vui, sinh lực", "Thành công rõ ràng, tiền về minh bạch, được công nhận.", "Chủ quan, phô trương.", "Thuận lợi, sáng sủa", "Hiệu quả rất tốt", "Thành công rõ", "Tiền tăng mạnh, mức cao", "Tận dụng giai đoạn thuận để tích luỹ, đừng tiêu hết.", 2, 2, 1.2],
  ["Judgement", "Phán Xét", "📯", "thức tỉnh, đánh giá lại, cơ hội thứ hai, kết quả", "Được đánh giá, xét duyệt; khoản cũ quay lại; quyết định quan trọng.", "Bị xét lại sai sót cũ, chần chừ bỏ lỡ lời gọi.", "Đang được xem xét", "Hiệu quả được ghi nhận", "Có kết luận, thường là tích cực", "Tiền lên nhờ cơ hội thứ hai", "Rà lại việc cũ, đòi lại khoản xứng đáng, trả lời lời mời đúng lúc.", 1, 1, 1.1],
  ["The World", "Thế Giới", "🌍", "hoàn thành, trọn vẹn, mở rộng, thành tựu", "Hoàn tất dự án, nhận trọn phần; mở rộng ra thị trường lớn.", "Tự mãn sau khi xong, quên chuẩn bị chu kỳ mới.", "Về đích", "Hiệu quả trọn vẹn", "Hoàn thành, đạt đủ", "Tiền cao, trọn vẹn", "Chốt sổ, thu đủ, rồi lên kế hoạch chu kỳ mới.", 2, 2, 0.9],
];

const SUITS = {
  wands: { vi: "Gậy", en: "Wands", nguyenTo: "Lửa", linhVuc: "hành động, dự án, động lực", td: 1.3 },
  cups: { vi: "Cốc", en: "Cups", nguyenTo: "Nước", linhVuc: "cảm xúc, quan hệ, sự hài lòng", td: 0.9 },
  swords: { vi: "Kiếm", en: "Swords", nguyenTo: "Khí", linhVuc: "suy nghĩ, quyết định, xung đột", td: 1.2 },
  pentacles: { vi: "Tiền", en: "Pentacles", nguyenTo: "Đất", linhVuc: "tiền bạc, công việc, vật chất", td: 0.7 },
};
const RANKS = [
  ["Ace", "Át"], ["Two", "2"], ["Three", "3"], ["Four", "4"], ["Five", "5"], ["Six", "6"], ["Seven", "7"],
  ["Eight", "8"], ["Nine", "9"], ["Ten", "10"], ["Page", "Tiểu đồng"], ["Knight", "Hiệp sĩ"], ["Queen", "Hoàng hậu"], ["King", "Vua"],
];

// [từ khoá, tiền/công việc, rủi ro, tiến trình, hiệu quả, kết quả, tín hiệu, lời khuyên, điểm tiền, điểm chung, tốc độ (để trống = theo chất)]
const MINOR = {
  wands: [
    ["khởi động, cảm hứng, cơ hội mới, tia lửa", "Cơ hội việc/dự án mới, nguồn thu mới vừa nhen lên.", "Hăng lúc đầu rồi bỏ dở.", "Vừa khởi động", "Có đà ban đầu", "Mở ra cơ hội mới", "Tiền có tín hiệu tăng từ việc mới", "Bắt tay làm ngay khi còn hứng, đặt mốc kiểm tra.", 1, 1.5],
    ["lên kế hoạch, tầm nhìn, cân nhắc mở rộng", "Đang tính bước mở rộng, chọn thị trường/hướng đi.", "Nghĩ nhiều làm ít, dậm chân ở kế hoạch.", "Đang lập kế hoạch", "Chưa ra tiền, đang chuẩn bị", "Kết quả tuỳ quyết định mở rộng", "Tiền giữ mức, chờ bước đi", "Chọn một kế hoạch cụ thể và chốt thời hạn.", 0.5, 0.5],
    ["mở rộng, chờ hàng về, tầm xa", "Việc đã gieo bắt đầu có phản hồi; mở rộng ra ngoài, hợp tác xa.", "Chờ đợi quá lâu, phụ thuộc bên ngoài.", "Đang mở rộng", "Hiệu quả bắt đầu thấy", "Có kết quả từ việc đã đầu tư", "Tiền tăng vừa", "Theo dõi sát kênh mới, mở rộng có kiểm soát.", 1, 1],
    ["ổn định, ăn mừng, nền tảng, mái nhà", "Đạt mốc, ổn định; có lý do ăn mừng một thành quả.", "Ngủ quên trên mốc nhỏ.", "Đạt mốc ổn định", "Hiệu quả tốt, vững", "Kết quả đáng mừng", "Tiền ổn, tăng nhẹ", "Ghi nhận thành quả rồi đặt mốc tiếp theo.", 1, 1.5],
    ["cạnh tranh, va chạm, tranh giành", "Cạnh tranh gắt, tranh khách, mâu thuẫn trong nhóm.", "Tốn sức vào tranh cãi, chia nhỏ lợi nhuận.", "Va chạm, giành giật", "Hiệu quả bị phân tán", "Kết quả lẫn lộn, phải giành", "Tiền dao động vì cạnh tranh", "Chọn trận đáng đánh, đừng phí sức vào cãi vã.", -0.5, -0.5],
    ["chiến thắng, được công nhận, tiến bộ", "Được ghi nhận, thắng thầu, lên chức, doanh số tốt.", "Kiêu ngạo, dựa vào tiếng hơn thực lực.", "Tiến lên thuận", "Hiệu quả cao, được ghi nhận", "Thắng, có thành tích", "Tiền tăng tốt", "Tận dụng uy tín để chốt giao dịch lớn hơn.", 1.5, 1.5],
    ["phòng thủ, giữ vị trí, kiên định", "Phải giữ chỗ đứng trước cạnh tranh; làm nhiều để giữ thu nhập.", "Kiệt sức vì phòng thủ, một chọi nhiều.", "Đang giữ thế", "Hiệu quả tốn sức", "Giữ được nhưng mệt", "Tiền giữ mức, không tăng", "Củng cố điểm mạnh nhất, bỏ bớt mặt trận phụ.", 0, 0],
    ["tốc độ, tin nhanh, chuyển động", "Mọi thứ tăng tốc: tin tức, đơn hàng, thanh toán đến nhanh.", "Vội vàng, quyết khi chưa đủ thông tin.", "Tăng tốc", "Hiệu quả nhanh", "Kết quả đến sớm", "Tiền về nhanh, mức khá", "Phản hồi nhanh nhưng vẫn kiểm tra trước khi chốt.", 1, 1, 1.5],
    ["kiên trì, phòng bị, mệt nhưng chưa bỏ", "Gần đích nhưng mỏi; phải giữ sức cho chặng cuối.", "Kiệt sức, nghi ngờ mọi người.", "Gồng chặng cuối", "Hiệu quả giảm vì mệt", "Giữ được nếu không bỏ", "Tiền đứng, sát mức cũ", "Nghỉ ngắn để hồi sức, đừng bỏ khi đã gần xong.", -0.5, 0],
    ["gánh nặng, quá tải, ôm việc", "Ôm quá nhiều việc, làm nhiều nhưng tiền không tương xứng.", "Quá tải, đổ vỡ vì gánh một mình.", "Quá tải", "Hiệu quả thấp so với công", "Mệt, kết quả nặng nề", "Tiền không tương xứng công sức", "Bỏ bớt việc không sinh lời, nhờ người hoặc thuê ngoài.", -1, -1],
    ["tin mới, ý tưởng, khám phá", "Tin về cơ hội nhỏ, học kỹ năng mới, thử kênh bán mới.", "Hứng một lúc, thiếu kiên nhẫn.", "Mới thăm dò", "Hiệu quả nhỏ", "Có tin vui nhỏ", "Tiền nhỏ, tín hiệu đầu", "Thử nhanh, đo kết quả rồi mới mở rộng.", 0.5, 1],
    ["xông pha, phiêu lưu, nhanh và nóng", "Lao vào việc mới, đi lại, chạy doanh số; tiền đến nhanh đi nhanh.", "Nóng vội, bỏ dở, chi tiêu bốc đồng.", "Lao nhanh", "Hiệu quả nhanh nhưng không đều", "Kết quả nhanh, dễ hụt hơi", "Tiền lên xuống nhanh", "Giữ lửa nhưng có lộ trình; đừng tiêu ngay khi vừa có.", 0.5, 0.5, 1.5],
    ["tự tin, thu hút, chủ động, ấm áp", "Tự tin bán hàng, thu hút khách; quản việc khéo.", "Ghen tị, muốn làm trung tâm.", "Chủ động dẫn dắt", "Hiệu quả tốt nhờ thu hút", "Kết quả tốt, được nể", "Tiền tăng khá", "Đứng ra dẫn dắt, chủ động chào hàng.", 1, 1.5],
    ["lãnh đạo, tầm nhìn, quyết đoán", "Dẫn dắt dự án lớn, làm chủ; tiền từ tầm nhìn và quyết đoán.", "Độc đoán, coi nhẹ chi tiết.", "Dẫn dắt mạnh", "Hiệu quả cao nhờ quyết đoán", "Kết quả lớn do mình cầm lái", "Tiền tăng tốt", "Quyết đoán nhưng giao chi tiết cho người kỹ tính.", 1.5, 1.5],
  ],
  cups: [
    ["tình cảm mới, cảm hứng, tràn đầy", "Công việc mang lại niềm vui; khách hàng/đối tác thiện cảm.", "Cảm tính, chọn vì thích chứ không vì lợi.", "Mở lòng, khởi đầu tốt", "Hiệu quả nhờ thiện cảm", "Kết quả vui, hài lòng", "Tiền khá, đi kèm hài lòng", "Làm việc mình thích nhưng vẫn tính giá rõ ràng.", 0.5, 1.5],
    ["kết nối, đối tác, đồng thuận", "Hợp tác hai bên cùng có lợi, ký thoả thuận.", "Hợp tác dựa trên cảm tình, thiếu giấy tờ.", "Kết nối, bắt tay", "Hiệu quả nhờ hợp tác", "Thoả thuận thành", "Tiền khá nhờ đối tác", "Chốt thoả thuận bằng văn bản dù quen thân.", 1, 1.5],
    ["ăn mừng, cộng đồng, bạn bè", "Thu nhập từ cộng đồng, nhóm, sự kiện; có dịp ăn mừng.", "Tiệc tùng tốn kém, chi tiêu theo hội.", "Vui vẻ, được ủng hộ", "Hiệu quả nhờ mạng lưới", "Kết quả đáng ăn mừng", "Tiền khá, chi cũng nhiều", "Dùng mạng lưới để kiếm, đừng để hội nhóm kéo chi.", 0.5, 1.5],
    ["chán nản, thờ ơ, bỏ lỡ", "Thờ ơ với cơ hội đang có; chán việc hiện tại.", "Bỏ lỡ lời mời vì đang bất mãn.", "Trì trệ, chán", "Hiệu quả thấp do thiếu động lực", "Bỏ lỡ cơ hội", "Tiền đứng, có cơ hội bị bỏ qua", "Nhìn lại cơ hội đang được đưa tới trước khi gạt đi.", -0.5, -0.5],
    ["mất mát, tiếc nuối, nhìn vào cái mất", "Mất một khoản/cơ hội, buồn vì kết quả; vẫn còn phần giữ lại.", "Chìm trong tiếc nuối, bỏ quên phần còn lại.", "Mất mát, hụt", "Hiệu quả kém", "Kết quả buồn, có hao hụt", "Tiền giảm", "Ghi nhận cái mất, cứu phần còn lại, đừng gỡ bằng liều.", -1, -1],
    ["hoài niệm, chuyện cũ, người quen", "Khách/việc cũ quay lại, tiền từ mối quen.", "Sống mãi trong cái cũ, ngại đổi mới.", "Quay về cái cũ", "Hiệu quả ổn từ mối quen", "Kết quả nhỏ, ấm áp", "Tiền nhỏ, ổn", "Liên hệ lại khách cũ, nhưng đừng chỉ dựa vào họ.", 0.5, 0.5],
    ["ảo tưởng, nhiều lựa chọn, mơ mộng", "Quá nhiều lựa chọn đẹp trên giấy; dễ chọn cái hão.", "Ảo tưởng lợi nhuận, kèo 'quá đẹp', bị dụ.", "Mơ hồ giữa nhiều lựa chọn", "Hiệu quả kém do phân tán", "Kết quả không như kỳ vọng", "Tiền ảo, khó thành thật", "Kiểm chứng từng lựa chọn bằng số liệu thật.", -1, -0.5],
    ["rời bỏ, tìm ý nghĩa, bỏ đi", "Rời bỏ công việc/nguồn thu không còn ý nghĩa.", "Bỏ đi khi chưa có phương án thay.", "Rời bỏ cái cũ", "Hiệu quả cũ giảm", "Khép lại để tìm cái hợp hơn", "Tiền giảm tạm thời", "Chỉ rời khi đã có đường lui tài chính.", -0.5, 0],
    ["toại nguyện, hài lòng, điều ước", "Đạt điều mong muốn, thu nhập đủ đầy, hài lòng.", "Tự mãn, hưởng thụ quá đà.", "Thuận, như ý", "Hiệu quả tốt", "Toại nguyện", "Tiền tốt, đúng mong muốn", "Tận hưởng nhưng trích ra một phần tích luỹ.", 1.5, 2],
    ["viên mãn, gia đình, hạnh phúc bền", "Ổn định lâu dài, tài chính gia đình êm.", "Lý tưởng hoá, che giấu vấn đề nhỏ.", "Êm ấm, ổn định", "Hiệu quả bền", "Viên mãn", "Tiền ổn tốt", "Giữ sự êm ấm bằng kế hoạch tài chính chung rõ ràng.", 1, 2],
    ["tin vui, ý tưởng sáng tạo, nhạy cảm", "Tin vui nhỏ, lời mời, ý tưởng sáng tạo kiếm tiền.", "Ngây thơ, dễ tin.", "Có tin vui", "Hiệu quả nhỏ", "Kết quả nhẹ nhàng, dễ chịu", "Tiền nhỏ, tín hiệu tốt", "Đón ý tưởng mới nhưng thử nhỏ trước.", 0.5, 1],
    ["lời mời, lãng mạn, đề nghị", "Lời đề nghị/hợp đồng mời gọi hấp dẫn.", "Lời hứa đẹp nhưng không thực hiện.", "Có lời mời đến", "Hiệu quả tuỳ thực chất lời mời", "Đề nghị hấp dẫn", "Tiền có thể đến từ đề nghị", "Xem kỹ thực chất lời mời, hỏi rõ điều khoản tiền.", 0.5, 1],
    ["thấu cảm, chăm sóc, trực giác", "Làm việc chăm sóc/tư vấn tốt; hiểu khách nên bán được.", "Ôm cảm xúc người khác, cho vay vì thương.", "Nhẹ nhàng, thấu hiểu", "Hiệu quả nhờ thấu cảm", "Kết quả ổn, được tin", "Tiền ổn", "Giúp người nhưng đặt giới hạn tiền bạc rõ ràng.", 0.5, 1],
    ["điềm tĩnh, cân bằng cảm xúc, bao dung", "Quản lý bình tĩnh, giữ quan hệ làm ăn lâu dài.", "Né xung đột cần giải quyết.", "Điềm tĩnh, kiểm soát", "Hiệu quả ổn định", "Kết quả êm", "Tiền ổn, tăng nhẹ", "Giữ bình tĩnh khi đàm phán, đừng nhân nhượng quá mức.", 1, 1],
  ],
  swords: [
    ["sáng suốt, quyết định, sự thật, đột phá", "Ý tưởng rõ ràng, quyết định đúng; cắt bỏ cái rối.", "Lời nói sắc làm mất lòng.", "Thấy rõ, quyết", "Hiệu quả nhờ quyết định đúng", "Đột phá", "Tiền tăng nhờ hướng đi rõ", "Ra quyết định dứt khoát dựa trên dữ kiện.", 1, 1, 1.4],
    ["bế tắc, né tránh, phân vân", "Chưa dám quyết, hai lựa chọn giằng co.", "Né sự thật, để việc kéo dài.", "Bế tắc, chưa quyết", "Hiệu quả đứng", "Chưa có kết quả", "Tiền đứng", "Thu thập dữ kiện rồi chọn, đừng bịt mắt chờ.", -0.5, -0.5],
    ["đau lòng, tổn thương, thất vọng", "Thất vọng về tiền/đối tác, mất mát gây tổn thương.", "Bị phản bội, tin sai người.", "Tổn thương", "Hiệu quả kém", "Kết quả đau", "Tiền giảm, có tổn thất", "Chấp nhận tổn thất, rút bài học, không trả đũa.", -1.5, -1.5],
    ["nghỉ ngơi, hồi phục, tạm ngưng", "Tạm nghỉ, chậm việc để hồi sức; thu nhập chững.", "Nghỉ quá lâu mất nhịp.", "Tạm dừng", "Hiệu quả thấp", "Hồi sức chuẩn bị", "Tiền chững", "Nghỉ có thời hạn rồi quay lại.", -0.5, 0, 0.5],
    ["thắng thua, mâu thuẫn, được ăn cả", "Tranh chấp, thắng mà mất lòng; có người chơi xấu.", "Bị lừa, bị chơi xấu; thắng kiểu được vạ má sưng.", "Xung đột", "Hiệu quả trả giá bằng quan hệ", "Thắng không vẻ vang", "Tiền dao động, có hao", "Không tham kèo thắng bằng mọi giá; giữ uy tín.", -1, -1.5],
    ["chuyển dịch, rời khó khăn, sang bờ mới", "Rời khỏi giai đoạn khó, chuyển hướng ổn hơn.", "Mang theo vấn đề cũ sang chỗ mới.", "Đang chuyển hướng", "Hiệu quả cải thiện dần", "Qua được khó khăn", "Tiền cải thiện chậm", "Chuyển hướng nhưng xử lý dứt điểm việc cũ.", 0.5, 0.5],
    ["mưu mẹo, gian dối, lén lút", "Có người gian lận, ăn cắp ý tưởng/tiền; hoặc mình phải khéo.", "Lừa đảo, mất trộm, thông tin bị lấy.", "Có khuất tất", "Hiệu quả bị rút ruột", "Kết quả không như thoả thuận", "Tiền có thể bị hụt/lấy mất", "Kiểm tra sổ sách, bảo mật tài khoản, không giao tiền khi chưa rõ.", -1.5, -1.5],
    ["bị trói, tự giới hạn, kẹt", "Thấy mình kẹt trong việc/thu nhập; thực ra lối ra có.", "Tự giới hạn, sợ thay đổi.", "Bị kẹt", "Hiệu quả thấp", "Kẹt nếu không tự gỡ", "Tiền bị giới hạn", "Liệt kê lối ra thật sự, bắt đầu từ bước nhỏ nhất.", -1, -1],
    ["lo âu, mất ngủ, sợ hãi", "Lo lắng tiền bạc nhiều hơn thực tế; áp lực nợ.", "Quyết sai vì hoảng.", "Lo âu", "Hiệu quả kém vì căng thẳng", "Kết quả bị nỗi sợ phóng đại", "Tiền căng", "Viết con số thật ra giấy; nỗi lo thường lớn hơn thực tế.", -1, -1],
    ["chạm đáy, kết thúc đau, hết đường", "Chạm đáy tài chính hoặc việc kết thúc hẳn.", "Mất mát lớn, phản bội.", "Đổ vỡ", "Hiệu quả về không", "Kết thúc đau rồi mới lên", "Tiền tụt sâu", "Cắt lỗ dứt điểm, bắt đầu lại từ nền.", -2, -2],
    ["quan sát, tò mò, tin tức", "Theo dõi thông tin, nghiên cứu thị trường.", "Soi mói, tin đồn.", "Đang dò xét", "Hiệu quả nhỏ", "Có thông tin mới", "Tiền chưa đổi", "Thu thập thông tin trước khi hành động.", 0, 0],
    ["lao vào, quyết liệt, vội", "Hành động mạnh, nhanh để giành cơ hội.", "Hấp tấp, nói trước nghĩ sau.", "Lao nhanh", "Hiệu quả nhanh nhưng dễ sai", "Kết quả nhanh, có va chạm", "Tiền dao động mạnh", "Nhanh nhưng phải có kế hoạch B.", 0, 0, 1.5],
    ["sắc sảo, độc lập, thẳng thắn", "Phân tích tỉnh táo, đàm phán thẳng, tự chủ tài chính.", "Lạnh lùng, đa nghi quá mức.", "Tỉnh táo", "Hiệu quả nhờ lý trí", "Kết quả rõ ràng", "Tiền ổn nhờ tính toán", "Tách cảm xúc khỏi quyết định tiền.", 0.5, 0.5],
    ["lý trí, quyền lực trí tuệ, luật", "Quyết định dựa trên chuyên môn, pháp lý, chiến lược.", "Cứng nhắc, lạnh lùng.", "Có chiến lược", "Hiệu quả nhờ đầu óc", "Kết quả hợp lý", "Tiền ổn, tăng có tính toán", "Hỏi chuyên gia, làm đúng pháp lý.", 1, 0.5],
  ],
  pentacles: [
    ["cơ hội tiền, hạt giống, khởi đầu vật chất", "Cơ hội tiền mới thật sự: việc mới, khoản thu mới, vốn ban đầu.", "Bỏ lỡ vì chần chừ.", "Có hạt giống tiền", "Hiệu quả tốt nếu gieo đúng", "Có tiền mới", "Tiền tăng, tín hiệu rõ", "Nắm lấy cơ hội, gieo đều đặn.", 2, 1.5],
    ["cân đối, xoay xở, linh hoạt", "Xoay xở nhiều nguồn, thu chi tung hứng.", "Quay vòng vốn căng, chậm một nhịp là hụt.", "Đang xoay xở", "Hiệu quả vừa", "Cân đối được", "Tiền dao động quanh mức cũ", "Lập bảng thu chi, ưu tiên khoản quan trọng.", 0, 0],
    ["làm việc nhóm, tay nghề, được công nhận", "Tay nghề được đánh giá, làm nhóm ra tiền.", "Làm không công vì nể.", "Hợp sức, xây dựng", "Hiệu quả nhờ tay nghề", "Kết quả được công nhận", "Tiền tăng vừa", "Nâng tay nghề, định giá đúng công sức.", 1, 1],
    ["giữ tiền, an toàn, keo kiệt", "Giữ chặt tiền, tích luỹ; ổn nhưng không tăng.", "Bám tiền quá, không dám đầu tư cần thiết.", "Giữ chặt", "Hiệu quả an toàn", "Giữ được, không tăng", "Tiền đứng, an toàn", "Giữ quỹ an toàn nhưng chi cho việc sinh lời.", 0.5, 0],
    ["thiếu thốn, khó khăn, bị bỏ rơi", "Thiếu tiền, mất việc, chi vượt thu.", "Túng quẫn dẫn tới vay nóng, bị lợi dụng.", "Khó khăn", "Hiệu quả kém", "Thiếu hụt", "Tiền giảm rõ", "Tìm hỗ trợ chính thống, cắt chi, không vay nóng.", -2, -1.5],
    ["cho nhận, hỗ trợ, cân bằng", "Có người hỗ trợ/được trả công xứng đáng; hoặc mình giúp người.", "Cho vay không đòi được.", "Có cho có nhận", "Hiệu quả cân bằng", "Được hỗ trợ", "Tiền khá", "Cho vay chỉ khoản có thể mất; nhận hỗ trợ có điều kiện rõ.", 1, 1],
    ["chờ thu hoạch, kiên nhẫn đầu tư", "Đầu tư đang lớn, chưa đến lúc gặt.", "Sốt ruột rút sớm.", "Chờ thu hoạch", "Hiệu quả chậm", "Kết quả cần thêm thời gian", "Tiền tăng chậm", "Đánh giá lại khoản đầu tư rồi kiên nhẫn.", 0, 0, 0.5],
    ["chăm chỉ, rèn nghề, tỉ mỉ", "Làm đều tay, tăng thu nhập nhờ chăm chỉ.", "Làm nhiều mà không nâng giá.", "Làm đều", "Hiệu quả bền", "Kết quả chắc", "Tiền tăng đều", "Chuẩn hoá cách làm, tăng giá theo tay nghề.", 1, 1],
    ["tự chủ tài chính, sung túc, độc lập", "Tự chủ, dư dả nhờ công sức riêng.", "Cô lập, khoe của.", "Tự chủ", "Hiệu quả cao", "Sung túc", "Tiền tốt", "Duy trì nguồn thu tự chủ, tiếp tục tích luỹ.", 1.5, 1.5],
    ["giàu bền, gia sản, di sản", "Tài chính vững, tài sản lâu dài, nguồn tiền gia đình.", "Tranh chấp thừa kế, bảo thủ.", "Vững chắc", "Hiệu quả lâu dài", "Giàu bền", "Tiền cao, ổn định", "Xây tài sản dài hạn, minh bạch giấy tờ.", 2, 1.5],
    ["học hỏi, cơ hội nhỏ, tin tiền", "Tin về khoản tiền nhỏ, học nghề mới để kiếm tiền.", "Chậm chạp, mơ mà không làm.", "Đang học", "Hiệu quả nhỏ", "Có tin tiền nhỏ", "Tiền nhỏ, có tín hiệu", "Học kỹ năng ra tiền, bắt đầu từ việc nhỏ.", 0.5, 0.5],
    ["chậm chắc, trách nhiệm, đều đặn", "Tiến chậm nhưng chắc, làm việc đều.", "Quá chậm, bỏ lỡ thời điểm.", "Chậm mà chắc", "Hiệu quả đều", "Kết quả chắc", "Tiền tăng chậm", "Giữ nhịp đều, đừng bỏ giữa chừng.", 0.5, 0.5, 0.5],
    ["chu đáo, thực tế, vun vén", "Quản lý tài chính gia đình giỏi, kinh doanh thực tế.", "Ôm việc, lo quá xa.", "Vun vén", "Hiệu quả thực tế", "Kết quả đủ đầy", "Tiền khá", "Vun vén đều tay, ưu tiên quỹ dự phòng.", 1, 1],
    ["thành đạt, giàu có, làm chủ", "Làm chủ tài chính, kinh doanh lớn, lợi nhuận ổn định.", "Vật chất hoá mọi thứ.", "Làm chủ", "Hiệu quả cao", "Thành đạt", "Tiền cao", "Đầu tư có kỷ luật, giữ uy tín làm ăn.", 2, 1.5],
  ],
};

const tarot = [];
MAJOR.forEach((c, i) => {
  const [en, vi, sym, kw, tien, rr, tt, hq, kq, th, kh, dt, dc, td] = c;
  tarot.push({
    id: i, en, vi, nhom: "major", chat: null, so: i, bieu_tuong: sym, tu_khoa: kw,
    tien, rui_ro: rr, vi_tri: { tien_trinh: tt, hieu_qua: hq, ket_qua: kq, tin_hieu: th },
    loi_khuyen: kh, diem_tien: dt, diem_chung: dc, toc_do: td,
  });
});
for (const [suit, info] of Object.entries(SUITS)) {
  MINOR[suit].forEach((c, r) => {
    const [kw, tien, rr, tt, hq, kq, th, kh, dt, dc, td] = c;
    const [rEn, rVi] = RANKS[r];
    tarot.push({
      id: tarot.length, en: `${rEn} of ${info.en}`, vi: `${rVi} ${info.vi}`, nhom: "minor", chat: suit, so: r + 1,
      bieu_tuong: null, tu_khoa: kw, tien, rui_ro: rr,
      vi_tri: { tien_trinh: tt, hieu_qua: hq, ket_qua: kq, tin_hieu: th },
      loi_khuyen: kh, diem_tien: dt, diem_chung: dc, toc_do: td ?? info.td,
    });
  });
}

// [en, vi, biểu tượng, từ khoá, tiền/công việc, rủi ro, chủ thể (khi đứng trước), tính chất (khi đứng sau), lời khuyên, điểm tiền, điểm chung, tốc độ]
const LEN = [
  ["Rider", "Kỵ Sĩ", "🐎", "tin tức, đến nhanh, người mang tin", "Tin về tiền/việc đến nhanh, khách mới, đơn hàng mới.", "Tin vội, chưa kiểm chứng.", "tin tức, việc đến nhanh", "nhanh, sắp đến", "Phản hồi nhanh nhưng xác minh tin trước.", 1, 1, 1.5],
  ["Clover", "Cỏ Bốn Lá", "🍀", "may mắn nhỏ, cơ hội ngắn, vui", "May mắn nhỏ, khoản thu bất ngờ nhỏ, cơ hội chớp nhoáng.", "May mắn ngắn, đừng đặt cược lớn.", "cơ hội nhỏ, vận may", "may mắn, nhẹ nhàng, ngắn hạn", "Chớp cơ hội nhỏ ngay, đừng chờ.", 1, 1, 1.3],
  ["Ship", "Con Tàu", "⛵", "đi xa, giao thương, chuyển dịch", "Giao thương, buôn bán xa, tiền từ nơi xa hoặc đi lại.", "Xa vời, chậm cập bến.", "giao thương, hành trình", "xa, đang dịch chuyển, nước ngoài", "Mở rộng kênh xa nhưng tính đủ thời gian vận chuyển.", 1, 0.5, 0.8],
  ["House", "Ngôi Nhà", "🏠", "gia đình, nền tảng, nhà cửa, an toàn", "Tài chính gia đình, bất động sản, kinh doanh tại nhà; nền ổn.", "Bó hẹp trong vùng an toàn.", "gia đình, nền tảng", "ổn định, an toàn, trong nhà", "Củng cố nền tảng trước khi mở rộng.", 0.5, 1, 0.7],
  ["Tree", "Cái Cây", "🌳", "sức khoẻ, phát triển chậm, gốc rễ", "Tăng trưởng chậm mà bền, đầu tư dài hạn.", "Quá chậm; để ý sức khoẻ khi làm quá sức.", "sức khoẻ, sự phát triển", "chậm, bền, lâu dài", "Kiên nhẫn với tăng trưởng dài hạn, giữ sức khoẻ.", 0.5, 0.5, 0.5],
  ["Clouds", "Mây Đen", "☁️", "mù mờ, rối, không chắc chắn", "Tình hình tiền không rõ, thông tin rối, khó quyết.", "Hiểu nhầm, quyết sai vì thiếu thông tin.", "sự mơ hồ, rối rắm", "không rõ ràng, bất ổn", "Chờ tan mây, làm rõ thông tin trước khi chi.", -1, -1, 0.9],
  ["Snake", "Con Rắn", "🐍", "khéo léo, đường vòng, cám dỗ, người xảo", "Đường kiếm tiền vòng vèo, phức tạp; có người khôn khéo xen vào.", "Người xảo quyệt, ghen ghét, lừa đảo tinh vi.", "người khéo/xảo, đường vòng", "vòng vèo, phức tạp, có toan tính", "Đọc kỹ điều khoản, cảnh giác người quá khéo.", -1, -1, 0.8],
  ["Coffin", "Quan Tài", "⚰️", "kết thúc, cạn kiệt, buông bỏ", "Một nguồn thu kết thúc, cạn vốn, đóng dự án.", "Mất mát, kiệt sức.", "sự kết thúc, cạn kiệt", "dừng lại, kết thúc, cạn", "Đóng hẳn cái đã hết để dồn sức cho cái mới.", -1.5, -1.5, 0.9],
  ["Bouquet", "Bó Hoa", "💐", "quà tặng, lời mời, vui vẻ, thiện cảm", "Lời mời đẹp, quà, thưởng; thiện cảm giúp việc.", "Đẹp bề ngoài.", "quà, lời mời", "dễ chịu, được đón nhận, vui", "Nhận lời mời, giữ phép lịch sự trong làm ăn.", 1, 1.5, 1.1],
  ["Scythe", "Lưỡi Hái", "🔪", "cắt đột ngột, quyết định nhanh, nguy hiểm", "Cắt giảm đột ngột, quyết định chớp nhoáng, khoản thu bị cắt.", "Tai nạn, mất tiền bất ngờ, quyết định vội.", "sự cắt đứt đột ngột", "đột ngột, sắc, cắt giảm", "Cẩn trọng với quyết định vội, kiểm tra trước khi ký/chuyển.", -1, -1, 1.5],
  ["Whip", "Cây Roi", "🪢", "tranh cãi, lặp lại, áp lực, rèn luyện", "Công việc lặp đi lặp lại, áp lực, tranh cãi tiền.", "Mâu thuẫn kéo dài, vòng lặp sai lầm.", "sự tranh cãi, áp lực lặp lại", "căng, lặp đi lặp lại, va chạm", "Phá vòng lặp: đổi cách làm, nói rõ một lần.", -1, -1, 1.1],
  ["Birds", "Đôi Chim", "🐦", "trao đổi, bàn bạc, lo lắng nhỏ, cặp đôi", "Bàn bạc, đàm phán, gọi điện; nhiều lời trao đổi về tiền.", "Bàn nhiều làm ít, lo lắng vặt.", "cuộc trao đổi, bàn bạc", "nhiều lời, xôn xao, hai người", "Ghi chép kết quả mỗi cuộc bàn, chốt việc cụ thể.", 0, 0, 1.2],
  ["Child", "Đứa Trẻ", "👶", "mới, nhỏ, khởi đầu, ngây thơ", "Việc nhỏ mới bắt đầu, khoản thu nhỏ, dự án non.", "Non kinh nghiệm, ngây thơ.", "khởi đầu nhỏ, việc mới", "mới, nhỏ, non", "Bắt đầu nhỏ, học nhanh, đừng kỳ vọng lớn ngay.", 0.5, 1, 1.2],
  ["Fox", "Con Cáo", "🦊", "công việc, mưu mẹo, tự lợi, cảnh giác", "Công việc kiếm sống, khôn ngoan; nhưng cũng là dấu hiệu gian lận.", "Lừa đảo, người tự lợi, việc không như vẻ ngoài.", "công việc/người khôn lỏi", "khôn lỏi, có mánh, không thật", "Kiểm tra kỹ người và giấy tờ; không tin lời hứa lợi nhuận.", -0.5, -1, 1],
  ["Bear", "Con Gấu", "🐻", "sức mạnh, tiền lớn, sếp, bảo vệ", "Tiền lớn, quỹ, sếp/đối tác mạnh; quản lý tài chính.", "Kiểm soát, người quyền lực chèn ép.", "tiền lớn/người có thế lực", "mạnh, lớn, có quyền", "Làm việc với người có thực lực, giữ quyền chủ động.", 1.5, 0.5, 0.8],
  ["Stars", "Các Vì Sao", "🌟", "hy vọng, định hướng, mạng lưới, rõ đường", "Hướng đi rõ, mạng lưới online, tăng trưởng theo kế hoạch.", "Mơ xa.", "định hướng, hy vọng", "rõ ràng, tỏa sáng, có hướng", "Bám theo mục tiêu đã rõ, dùng mạng lưới.", 1, 1.5, 0.9],
  ["Stork", "Con Cò", "🕊️", "thay đổi, cải thiện, chuyển nhà", "Thay đổi theo hướng tốt hơn, chuyển việc, cải thiện thu nhập.", "Đổi vì đổi.", "sự thay đổi, cải thiện", "đổi mới, tốt lên", "Chủ động đổi cái cần đổi.", 1, 1, 1],
  ["Dog", "Con Chó", "🐕", "bạn trung thành, người tin cậy, hỗ trợ", "Người tin cậy hỗ trợ, khách quen trung thành.", "Tin nhầm người quen.", "người bạn/người tin cậy", "trung thành, đáng tin", "Dựa vào người thật sự tin cậy, vẫn cần giấy tờ.", 1, 1.5, 0.9],
  ["Tower", "Toà Tháp", "🏰", "tổ chức, cơ quan, cô lập, quy chuẩn", "Tổ chức lớn, công ty, cơ quan nhà nước, thủ tục.", "Cô lập, quan liêu.", "tổ chức, cơ quan", "chính thức, lâu dài, cứng", "Làm việc qua kênh chính thức, giữ hồ sơ.", 0.5, 0, 0.6],
  ["Garden", "Khu Vườn", "🌷", "cộng đồng, công chúng, sự kiện, mạng xã hội", "Tiền từ công chúng, mạng xã hội, sự kiện.", "Phô bày quá mức.", "cộng đồng, công chúng", "công khai, đông người", "Xuất hiện trước công chúng, xây cộng đồng khách.", 0.5, 1, 1],
  ["Mountain", "Ngọn Núi", "⛰️", "trở ngại, chậm trễ, bế tắc", "Trở ngại lớn, chậm thanh toán, việc bị chặn.", "Kẹt lâu, đối thủ cản đường.", "trở ngại, sự cản", "chậm, nặng nề, bị chặn", "Đi vòng hoặc chia nhỏ mục tiêu; kiên nhẫn.", -1.5, -1, 0.5],
  ["Crossroads", "Ngã Rẽ", "🔀", "lựa chọn, nhiều hướng, phân vân", "Phải chọn giữa nhiều hướng kiếm tiền.", "Phân vân mất thời cơ.", "lựa chọn, ngã rẽ", "nhiều lựa chọn, phân nhánh", "Chọn dựa trên số liệu, chọn rồi thì đi.", 0, 0, 1],
  ["Mice", "Con Chuột", "🐭", "hao hụt, mất mát, gặm nhấm, lo", "Hao tài dần, chi phí ẩn, mất cắp, thất thoát.", "Mất trộm, bị rút tiền, lo âu bào mòn.", "sự hao hụt, thất thoát", "hao mòn, bị gặm, giảm dần", "Rà soát chi tiêu, khoá bảo mật tài khoản, cắt khoản rò rỉ.", -1.5, -1.5, 0.9],
  ["Heart", "Trái Tim", "❤️", "tình yêu, đam mê, thiện ý", "Làm việc mình yêu, thiện ý của người khác.", "Cảm tính trong tiền bạc.", "tình cảm, đam mê", "yêu thích, thiện ý", "Làm bằng đam mê nhưng tính bằng đầu óc.", 0.5, 1.5, 1],
  ["Ring", "Chiếc Nhẫn", "💍", "hợp đồng, cam kết, chu kỳ, gắn kết", "Hợp đồng, cam kết, thoả thuận lặp lại, thu nhập định kỳ.", "Ràng buộc bất lợi nếu không đọc kỹ.", "hợp đồng, cam kết", "ràng buộc, cam kết, lặp lại", "Ký kết rõ ràng, đọc kỹ điều khoản ràng buộc.", 1, 1, 0.8],
  ["Book", "Quyển Sách", "📖", "bí mật, kiến thức, học, chưa biết", "Kiến thức chuyên môn, thông tin chưa lộ, học để kiếm tiền.", "Bí mật bị giấu.", "kiến thức, bí mật", "kín, chưa lộ, chuyên môn", "Học thêm, tìm hiểu sâu trước khi quyết.", 0.5, 0.5, 0.7],
  ["Letter", "Lá Thư", "✉️", "giấy tờ, tin nhắn, văn bản", "Giấy tờ, hoá đơn, email, tin nhắn chuyển tiền.", "Giấy tờ sai, tin nhắn giả mạo.", "giấy tờ, tin nhắn", "bằng văn bản, thông báo", "Lưu bằng chứng mọi giao dịch bằng văn bản.", 0.5, 0.5, 1.2],
  ["Man", "Người Đàn Ông", "🤵", "người hỏi (nam) hoặc người nam quan trọng", "Một người nam ảnh hưởng tới tiền/việc.", "Phụ thuộc người khác.", "người đàn ông", "nam tính, chủ động", "Xác định rõ vai trò của người này trong việc tiền.", 0, 0, 1],
  ["Woman", "Người Phụ Nữ", "👩", "người hỏi (nữ) hoặc người nữ quan trọng", "Bản thân người hỏi (nữ) hoặc người nữ ảnh hưởng tới tiền.", "Phụ thuộc người khác.", "người phụ nữ", "nữ tính, tinh tế", "Đặt mình làm trung tâm quyết định.", 0, 0, 1],
  ["Lily", "Hoa Huệ", "⚜️", "bình yên, chín chắn, lâu dài, đạo đức", "Thu nhập bền, đều; làm ăn đàng hoàng, người lớn tuổi.", "Chậm, an phận.", "sự bình yên, chín chắn", "lâu dài, êm, đứng đắn", "Giữ cách làm đàng hoàng, nhắm đường dài.", 0.5, 1, 0.6],
  ["Sun", "Mặt Trời", "☀️", "thành công, năng lượng, rõ ràng", "Thành công rõ, tiền tăng, được công nhận.", "Chủ quan.", "thành công, sức sống", "rõ ràng, thành công, mạnh", "Đẩy mạnh khi đang thuận, tích luỹ phần dư.", 2, 2, 1.2],
  ["Moon", "Mặt Trăng", "🌙", "danh tiếng, cảm xúc, ghi nhận, chu kỳ", "Được ghi nhận, danh tiếng giúp kiếm tiền; theo chu kỳ.", "Cảm xúc lên xuống chi phối quyết định.", "danh tiếng, sự ghi nhận", "được chú ý, có cảm xúc", "Xây uy tín, để danh tiếng làm việc cho mình.", 0.5, 1, 0.9],
  ["Key", "Chìa Khoá", "🔑", "giải pháp, chắc chắn, mở khoá", "Giải pháp, chắc chắn thành; mở được nút thắt tiền.", "Chủ quan cho là chắc.", "giải pháp, chìa khoá", "chắc chắn, mở ra, quan trọng", "Dùng đúng giải pháp đã thấy, làm ngay.", 1.5, 1.5, 1.3],
  ["Fish", "Con Cá", "🐟", "tiền bạc, kinh doanh, dòng tiền, dư dả", "Dòng tiền, kinh doanh, buôn bán, thu nhập dồi dào.", "Tiền vào nhiều ra cũng nhiều.", "dòng tiền, kinh doanh", "sinh lời, nhiều, có tiền", "Quản lý dòng tiền, tách tiền kinh doanh và cá nhân.", 2, 1, 1],
  ["Anchor", "Mỏ Neo", "⚓", "ổn định, bền, công việc chính, kiên định", "Công việc ổn định, thu nhập chắc, gắn bó lâu.", "Trì trệ, mắc kẹt.", "sự ổn định, việc chính", "bền, cố định, giữ lâu", "Giữ nền ổn định làm gốc, phát triển thêm nhánh.", 1, 1, 0.5],
  ["Cross", "Thập Giá", "✝️", "gánh nặng, trách nhiệm, thử thách, định mệnh", "Gánh nặng tài chính, nghĩa vụ, nợ phải trả.", "Áp lực kéo dài, mệt mỏi.", "gánh nặng, trách nhiệm", "nặng, phải gánh, thử thách", "Chia nhỏ gánh nặng, ưu tiên trả nợ, xin hỗ trợ khi cần.", -1, -1, 0.7],
];

const lenormand = LEN.map((c, i) => {
  const [en, vi, sym, kw, tien, rr, ct, tc, kh, dt, dc, td] = c;
  return { id: i + 1, en, vi, bieu_tuong: sym, tu_khoa: kw, tien, rui_ro: rr, chu_the: ct, tinh_chat: tc, loi_khuyen: kh, diem_tien: dt, diem_chung: dc, toc_do: td };
});

// Cặp phổ biến: "Lá trước+Lá sau" → nghĩa ghép (đã tính chiều đọc)
const PAIRS = {
  "Clover+Fish": "Khoản tiền may mắn, lợi nhuận nhỏ bất ngờ; buôn bán gặp may.",
  "Fish+Clover": "Dòng tiền gặp may trong ngắn hạn; chốt lời nhanh.",
  "Fox+Ring": "Hợp đồng có gian lận hoặc điều khoản bẫy; không ký khi chưa đọc kỹ.",
  "Ring+Fox": "Cam kết bị lợi dụng, đối tác tự lợi.",
  "Whip+House": "Cãi vã, áp lực trong gia đình; việc nhà lặp đi lặp lại gây mệt.",
  "House+Whip": "Nền tảng gia đình đang căng, tranh cãi chuyện tiền trong nhà.",
  "Fish+Mice": "Tiền bị hao hụt dần, chi phí ẩn gặm dòng tiền.",
  "Mice+Fish": "Hao tài, thất thoát tiền; rà soát tài khoản ngay.",
  "Fish+Key": "Giải pháp tài chính chắc chắn; tiền thông.",
  "Key+Fish": "Chìa khoá là kinh doanh/bán hàng; tiền mở ra.",
  "Fish+Sun": "Tiền dồi dào, kinh doanh thành công rõ.",
  "Sun+Fish": "Thành công mang lại tiền; kỳ thu nhập tốt.",
  "Fish+Anchor": "Thu nhập ổn định, dòng tiền đều lâu dài.",
  "Anchor+Fish": "Công việc chính ra tiền đều.",
  "Fish+Ring": "Hợp đồng tiền bạc, thu nhập định kỳ.",
  "Ring+Fish": "Cam kết mang lại tiền, hợp đồng sinh lời.",
  "Fish+Mountain": "Tiền bị chặn, chậm thanh toán.",
  "Mountain+Fish": "Trở ngại tài chính, phải vượt mới có tiền.",
  "Fish+Coffin": "Cạn tiền, kinh doanh đóng lại.",
  "Coffin+Fish": "Một nguồn tiền khép lại.",
  "Fish+Clouds": "Tài chính mập mờ, số liệu không rõ.",
  "Clouds+Fish": "Tiền đang rối, chưa thấy rõ lời lỗ.",
  "Fish+Snake": "Tiền đi đường vòng, dễ bị dụ đầu tư.",
  "Snake+Fish": "Người khéo nhắm vào tiền của bạn.",
  "Fox+Fish": "Kèo tiền có mánh, lợi nhuận ảo.",
  "Fish+Fox": "Dòng tiền có người ăn chặn.",
  "Bear+Fish": "Khoản tiền lớn, nhà đầu tư/sếp chi tiền.",
  "Fish+Bear": "Tiền tích tụ lớn, quỹ mạnh.",
  "Rider+Fish": "Tin về tiền đến nhanh, khoản thu sắp về.",
  "Letter+Fish": "Giấy tờ tiền, hoá đơn, thông báo chuyển khoản.",
  "Fish+Letter": "Tiền đi kèm giấy tờ; giữ chứng từ.",
  "Scythe+Fish": "Tiền bị cắt đột ngột.",
  "Fish+Scythe": "Chi đột ngột, quyết định tiền vội.",
  "Fish+Cross": "Gánh nặng tài chính, nợ.",
  "Cross+Fish": "Áp lực nghĩa vụ tiền.",
  "Stork+Fish": "Thu nhập cải thiện nhờ thay đổi.",
  "Ship+Fish": "Tiền từ giao thương xa.",
  "Garden+Fish": "Tiền từ công chúng, bán online, sự kiện.",
  "Child+Fish": "Khoản tiền nhỏ mới.",
  "Fish+Child": "Kinh doanh nhỏ, bắt đầu lại.",
  "Clover+Key": "Cơ hội nhỏ mở ra giải pháp.",
  "Key+Ring": "Hợp đồng chắc chắn thành.",
  "Ring+Key": "Cam kết là chìa khoá.",
  "Snake+Ring": "Hợp đồng phức tạp, có toan tính.",
  "Fox+Letter": "Giấy tờ giả, tin nhắn lừa đảo.",
  "Letter+Fox": "Văn bản có mánh khoé.",
  "Mice+Letter": "Giấy tờ thất lạc hoặc thông tin bị đánh cắp.",
  "Clouds+Snake": "Rối ren do người xảo; thông tin bị bóp méo.",
  "Mountain+Key": "Trở ngại có lời giải.",
  "Key+Mountain": "Giải pháp bị chặn, phải chờ.",
  "Coffin+Stork": "Kết thúc để đổi sang cái tốt hơn.",
  "Sun+Key": "Thành công chắc chắn.",
  "Anchor+Ring": "Cam kết ổn định lâu dài, hợp đồng dài hạn.",
  "Tower+Ring": "Hợp đồng với tổ chức/cơ quan.",
  "Dog+Fish": "Người tin cậy giúp về tiền.",
  "Birds+Ring": "Đàm phán hợp đồng.",
  "Whip+Fish": "Tranh cãi về tiền.",
  "Cross+Mice": "Gánh nặng bào mòn, lo âu kéo dài.",
  "Rider+Letter": "Tin nhắn/giấy tờ đến nhanh.",
};

const LUAT_GHEP = [
  "Lá trước là CHỦ THỂ (việc gì/ai), lá sau là TÍNH CHẤT (việc đó ra sao).",
  "Hai lá cùng tốt: củng cố, việc thuận. Hai lá cùng xấu: cảnh báo rõ, ưu tiên phòng thủ.",
  "Chủ thể tốt + tính chất xấu: việc tốt nhưng bị cản/hao — nhìn vào lá sau để biết điểm nghẽn.",
  "Chủ thể xấu + tính chất tốt: vấn đề có lối ra, xấu chuyển dần sang tốt.",
  "Cả chuỗi: lá đầu là điểm khởi, lá cuối là xu hướng kết; lá giữa là diễn biến.",
];

writeFileSync(join(OUT, "tarot.json"), JSON.stringify({ phien_ban: 1, chat: SUITS, la: tarot }, null, 1));
writeFileSync(join(OUT, "lenormand.json"), JSON.stringify({ phien_ban: 1, la: lenormand, cap: PAIRS, luat_ghep: LUAT_GHEP }, null, 1));
console.log(`tarot ${tarot.length} lá, lenormand ${lenormand.length} lá, ${Object.keys(PAIRS).length} cặp`);
