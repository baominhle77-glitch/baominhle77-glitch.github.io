/* ============ DỮ LIỆU NÂNG CAO: MÁY LUẬN GIẢI + TRI THỨC CHUYÊN SÂU ============ */

/* Điểm cát hung từng lá (−2 rất nghịch … +2 rất thuận) — dùng cho máy luận trả lời câu hỏi */
const TAROT_SCORE=[1,2,0,2,1,1,2,1,1,0,1,0,0,-1,1,-2,-2,2,-1,2,1,2,
2,1,1,2,-1,2,0,1,0,-1,1,0,1,1,
2,2,1,-1,-1,1,-1,0,2,2,1,0,1,1,
1,-1,-2,0,-2,0,-1,-1,-2,-2,0,-1,0,0,
2,0,1,-1,-2,1,0,1,2,2,1,0,1,2];
const LEN_SCORE=[1,1,1,1,0,-1,-1,-2,2,-1,-1,0,1,-1,0,2,1,1,0,1,-2,0,-2,2,1,0,0,0,0,1,2,1,2,2,1,-2];
const BT_SCORE=[2,1,0,0,-1,1,-1,1,2,2,1,1,1,
1,1,-1,1,1,-1,-1,1,1,2,0,0,0,
2,1,1,-1,1,1,0,-1,1,2,1,1,1,
-1,-2,-1,-1,-2,0,-1,-1,-2,-2,-1,-1,-1];
const KD_SCORE={1:2,2:1,3:-1,4:0,5:1,6:-1,7:0,8:1,9:0,10:0,11:2,12:-2,13:1,14:2,15:2,16:1,17:1,18:-1,19:1,20:0,21:0,22:0,23:-2,24:1,25:0,26:1,27:0,28:-1,29:-2,30:1,31:2,32:1,33:0,34:1,35:2,36:-2,37:1,38:-1,39:-2,40:1,41:0,42:2,43:0,44:-1,45:1,46:2,47:-2,48:0,49:0,50:2,51:0,52:0,53:1,54:-2,55:2,56:0,57:0,58:1,59:1,60:0,61:1,62:0,63:1,64:0};

/* Số học trong tarot: ý nghĩa số 1-10 và 4 lá người (Court) */
const TAROT_NUM={
"Át (1)":"Hạt giống thuần khiết của chất bài: khởi đầu, tiềm năng nguyên vẹn chưa khai mở; một cánh cửa vừa hé.",
"Số 2":"Nhị nguyên: lựa chọn, cân bằng, đối tác, phản chiếu; hai lực cần được hoà giải hoặc kết đôi.",
"Số 3":"Sáng tạo và tăng trưởng: kết quả đầu tiên của sự kết hợp, mở rộng, cộng đồng nhỏ.",
"Số 4":"Ổn định, cấu trúc, nền móng: bốn góc vững — nhưng cũng có thể là sự tù đọng nếu giữ quá chặt.",
"Số 5":"Khủng hoảng giữa chu kỳ: xáo trộn, thử thách, mất mát tạm — cú lắc cần thiết để trưởng thành.",
"Số 6":"Hài hoà tái lập sau biến động: hào phóng, chữa lành, sự cân bằng có ý thức.",
"Số 7":"Nội quan và đánh giá: dừng lại nhìn sâu, thử thách lòng kiên định, tìm ý nghĩa.",
"Số 8":"Sức mạnh vận động: làm chủ, tăng tốc, gặt quả của kỷ luật; quyền lực đi đôi trách nhiệm.",
"Số 9":"Gần viên mãn: thành tựu cá nhân, độ chín — kèm bài học cuối trước khi khép chu kỳ.",
"Số 10":"Chu kỳ hoàn tất: kết thúc và chuyển giao — mang cả quả ngọt lẫn gánh nặng của sự trọn vẹn.",
"Bồi (Page)":"Nguyên tố ở dạng học trò: tin tức, khởi đầu học hỏi, người trẻ hoặc phần non trẻ trong ta.",
"Kỵ Sĩ (Knight)":"Nguyên tố đang hành động: theo đuổi, chuyển động, năng lượng thuần chưa điềm đạm.",
"Hoàng Hậu (Queen)":"Nguyên tố chín ở dạng nội tại: nuôi dưỡng, thấu hiểu, làm chủ từ bên trong.",
"Vua (King)":"Nguyên tố chín ở dạng ngoại hiện: lãnh đạo, cấu trúc, làm chủ và điều hành ra bên ngoài."
};

/* Bộ đôi Lenormand kinh điển (đọc cặp lá liền kề) */
const LEN_PAIRS=[
["Kỵ Sĩ + Trái Tim","Tin nhắn tình cảm, lời tỏ tình đang đến; người mang rung động mới ghé vào đời bạn."],
["Kỵ Sĩ + Quan Tài","Tin về sự kết thúc, tin buồn; một chương sắp khép được báo trước."],
["Cỏ Ba Lá + Con Cá","Vận may tiền bạc ngắn hạn: khoản lộc nhỏ, cơ hội chớp nhoáng sinh lời."],
["Con Tàu + Chiếc Nhẫn","Hợp đồng với đối tác xa, hôn nhân/cam kết gắn với người phương xa hoặc chuyến đi."],
["Ngôi Nhà + Trái Tim","Tình cảm hướng về mái ấm: tình yêu bền, chuyện về chung nhà, hạnh phúc gia đạo."],
["Cái Cây + Chuột","Sức khoẻ bị bào mòn âm thầm — dấu hiệu cần đi khám sớm, đừng chờ triệu chứng nặng."],
["Đám Mây + Mặt Trời","U ám rồi bừng sáng: rắc rối chỉ là tạm thời, kết cục tốt đẹp rõ rệt."],
["Con Rắn + Trái Tim","Người thứ ba hoặc sự quyến rũ có toan tính trong chuyện tình cảm — tỉnh táo."],
["Quan Tài + Mặt Trời","Kết thúc để tái sinh rực rỡ; sau chôn cất là hồi sinh mạnh mẽ."],
["Bó Hoa + Chiếc Nhẫn","Lời cầu hôn, lễ đính ước; món quà đi kèm cam kết."],
["Lưỡi Hái + Chiếc Nhẫn","Hợp đồng bị cắt, hôn ước gãy đổ đột ngột; đọc kỹ điều khoản chấm dứt."],
["Cây Roi + Bầy Chim","Cãi vã ồn ào, tranh luận dai dẳng thành thị phi; giữ mồm trong nhóm đông."],
["Đứa Trẻ + Con Cò","Tin vui thai sản, em bé sắp đến; khởi đầu mới được 'khai sinh'."],
["Con Cáo + Con Gấu","Kẻ mưu mẹo bên cạnh người quyền lực: cẩn thận cấp dưới/đồng nghiệp lấy lòng sếp hại bạn."],
["Ngôi Sao + Quyển Sách","Tri thức dẫn đường: học hành thi cử sáng, nghiên cứu được định hướng tốt."],
["Con Cò + Ngôi Nhà","Chuyển nhà, thay đổi chỗ ở theo hướng tốt hơn."],
["Con Chó + Chiếc Nhẫn","Tình bạn thành cam kết bền; đối tác trung thành đáng ký kết lâu dài."],
["Tòa Tháp + Quyển Sách","Cơ quan, trường học, pháp lý và hồ sơ; việc giấy tờ với tổ chức lớn."],
["Khu Vườn + Trái Tim","Tình cảm được công khai; gặp gỡ đông người mang duyên."],
["Ngọn Núi + Chìa Khóa","Trở ngại lớn nhưng có lời giải; kiên trì sẽ tìm ra cửa mở."],
["Ngã Rẽ + Đám Mây","Phân vân giữa các lựa chọn trong mù mờ — khoan quyết, chờ thông tin rõ."],
["Con Chuột + Con Cá","Hao tiền, rò rỉ tài chính; kiểm tra các khoản trừ tự động, nợ xấu."],
["Trái Tim + Chìa Khóa","Tình yêu định mệnh, câu trả lời chắc chắn 'có' cho chuyện tình cảm."],
["Chiếc Nhẫn + Con Cá","Hợp đồng tiền bạc, cam kết đầu tư; vòng quay vốn được ký kết."],
["Lá Thư + Con Cá","Giấy tờ tiền bạc: hoá đơn, chứng từ, thông báo chuyển khoản."],
["Mặt Trăng + Khu Vườn","Danh tiếng nở rộ nơi công chúng; được nhiều người biết đến và mến mộ."],
["Chìa Khóa + Con Cá","Mở khoá dòng tiền: cơ hội tài chính chắc chắn, nút thắt tiền bạc được gỡ."],
["Mỏ Neo + Chiếc Nhẫn","Cam kết cực bền: hôn nhân vững, hợp đồng dài hạn đáng tin."],
["Thập Giá + Mặt Trời","Gánh nặng đến hồi được cất; sau thử thách là ánh sáng — khổ tận cam lai."],
["Con Rắn + Con Cáo","Cảnh báo kép về mưu kế: môi trường nhiều người khôn lỏi — kiểm tra mọi lời hứa."]
];

/* Ngũ hành của can & chi + tàng can trong 12 chi (bát tự) */
const CAN_HANH=["Mộc","Mộc","Hỏa","Hỏa","Thổ","Thổ","Kim","Kim","Thủy","Thủy"];
const CHI_HANH=["Thủy","Thổ","Mộc","Mộc","Thổ","Hỏa","Hỏa","Thổ","Kim","Kim","Thổ","Thủy"];
const TANG_CAN=[[9],[5,9,7],[0,2,4],[1],[4,1,9],[2,4,6],[3,5],[5,3,1],[6,8,4],[7],[4,7,3],[8,0]];

/* 10 Thiên can — tính chất & nhật chủ bát tự */
const CAN_INFO={
"Giáp":"Mộc dương — cây đại thụ vươn thẳng. Nhật chủ Giáp: chính trực, thích dẫn đầu, có lòng nhân, khó uốn mình; hợp vai trò tiên phong, quản lý; bài học là sự mềm dẻo.",
"Ất":"Mộc âm — dây leo, hoa cỏ. Nhật chủ Ất: mềm mỏng khéo léo, sức sống dai, biết nương thế mà lớn; giỏi ngoại giao, thẩm mỹ; bài học là giữ chính kiến.",
"Bính":"Hỏa dương — mặt trời. Nhật chủ Bính: nhiệt thành, hào phóng, quang minh, thích được toả sáng; truyền cảm hứng giỏi; bài học là kiên nhẫn với người chậm hơn mình.",
"Đinh":"Hỏa âm — ngọn đèn, lò lửa. Nhật chủ Đinh: ấm áp bền bỉ, sâu sắc, soi sáng âm thầm; trực giác tinh nhạy; bài học là đừng tự đốt mình vì người khác.",
"Mậu":"Thổ dương — núi lớn, thành lũy. Nhật chủ Mậu: vững chãi, trọng tín, che chở người khác; điềm đạm khó lay; bài học là đừng trì trệ bảo thủ.",
"Kỷ":"Thổ âm — ruộng vườn phù sa. Nhật chủ Kỷ: bao dung, nuôi dưỡng, tỉ mỉ, giỏi vun vén; hợp giáo dục, chăm sóc; bài học là đặt ranh giới cho lòng tốt.",
"Canh":"Kim dương — gươm đao, khoáng thạch. Nhật chủ Canh: quả cảm, quyết đoán, trọng nghĩa khí, dám phá dám lập; hợp việc cải cách, kỹ nghệ; bài học là bớt sắc cạnh trong lời nói.",
"Tân":"Kim âm — trang sức, kim hoàn. Nhật chủ Tân: tinh tế, cầu toàn, trọng danh dự và hình ảnh; gu thẩm mỹ sắc bén; bài học là chấp nhận sự không hoàn hảo.",
"Nhâm":"Thủy dương — sông lớn, biển cả. Nhật chủ Nhâm: phóng khoáng, trí tuệ linh hoạt, thích tự do xê dịch; nhìn xa trông rộng; bài học là sự bền chí một dòng.",
"Quý":"Thủy âm — mưa móc, sương mù. Nhật chủ Quý: nhạy cảm, thông minh thầm lặng, thấm vào lòng người; trực giác gần như đọc được ý; bài học là đừng để tâm tư thành lo âu."
};

/* 12 Địa chi — con giáp, giờ, tháng, tính chất */
const CHI_INFO={
"Tý":"Chuột — Thủy · giờ 23–1h · tháng 11 âm. Nhanh nhạy, mưu trí, giỏi xoay xở tích lũy; ẩn tàng can Quý. Hợp Sửu; tam hợp Thân–Thìn; xung Ngọ.",
"Sửu":"Trâu — Thổ · giờ 1–3h · tháng 12 âm. Bền bỉ, chịu khó, đáng tin, chậm mà chắc; tàng Kỷ–Quý–Tân. Hợp Tý; tam hợp Tỵ–Dậu; xung Mùi.",
"Dần":"Hổ — Mộc · giờ 3–5h · tháng Giêng. Dũng mãnh, quyết đoán, khí phách thủ lĩnh; tàng Giáp–Bính–Mậu. Hợp Hợi; tam hợp Ngọ–Tuất; xung Thân.",
"Mão":"Mèo — Mộc · giờ 5–7h · tháng 2 âm. Nhã nhặn, tinh tế, thận trọng, ưa hoà bình; tàng Ất. Hợp Tuất; tam hợp Hợi–Mùi; xung Dậu.",
"Thìn":"Rồng — Thổ · giờ 7–9h · tháng 3 âm. Khí độ lớn, lý tưởng cao, thích biến hoá; tàng Mậu–Ất–Quý. Hợp Dậu; tam hợp Thân–Tý; xung Tuất.",
"Tỵ":"Rắn — Hỏa · giờ 9–11h · tháng 4 âm. Sâu sắc, trực giác mạnh, quyến rũ trí tuệ; tàng Bính–Mậu–Canh. Hợp Thân; tam hợp Dậu–Sửu; xung Hợi.",
"Ngọ":"Ngựa — Hỏa · giờ 11–13h · tháng 5 âm. Hào sảng, yêu tự do, bùng nổ năng lượng; tàng Đinh–Kỷ. Hợp Mùi; tam hợp Dần–Tuất; xung Tý.",
"Mùi":"Dê — Thổ · giờ 13–15h · tháng 6 âm. Ôn hoà, nghệ sĩ tính, giàu lòng trắc ẩn; tàng Kỷ–Đinh–Ất. Hợp Ngọ; tam hợp Hợi–Mão; xung Sửu.",
"Thân":"Khỉ — Kim · giờ 15–17h · tháng 7 âm. Lanh lợi, đa tài, ứng biến như thần; tàng Canh–Nhâm–Mậu. Hợp Tỵ; tam hợp Tý–Thìn; xung Dần.",
"Dậu":"Gà — Kim · giờ 17–19h · tháng 8 âm. Chỉn chu, cầu toàn, tinh mắt, trọng nguyên tắc; tàng Tân. Hợp Thìn; tam hợp Tỵ–Sửu; xung Mão.",
"Tuất":"Chó — Thổ · giờ 19–21h · tháng 9 âm. Trung thành, nghĩa hiệp, bảo vệ người thân; tàng Mậu–Tân–Đinh. Hợp Mão; tam hợp Dần–Ngọ; xung Thìn.",
"Hợi":"Lợn — Thủy · giờ 21–23h · tháng 10 âm. Chân thành, phúc hậu, hưởng phúc, ít mưu toan; tàng Nhâm–Giáp. Hợp Dần; tam hợp Mão–Mùi; xung Tỵ."
};

/* Thập thần trong bát tự */
const THAPTHAN_INFO={
"Tỷ Kiên":"Cùng hành cùng âm dương với nhật chủ — anh em, bạn đồng trang lứa, cái tôi. Nhiều Tỷ Kiên: độc lập, cứng cỏi, hợp tự lập nghiệp; dễ tranh tài với người ngang hàng.",
"Kiếp Tài":"Cùng hành khác âm dương — bạn cạnh tranh, người 'chia phần'. Nhiều Kiếp Tài: quảng giao, dám làm, nhưng phải giữ tiền chặt và chọn bạn hùn cẩn thận.",
"Thực Thần":"Nhật chủ sinh ra, cùng âm dương — tài hoa, hưởng thụ, ẩm thực, nghệ thuật. Người có Thực Thần vượng: sáng tạo an nhiên, sống có gu, phúc về ăn lộc.",
"Thương Quan":"Nhật chủ sinh ra, khác âm dương — tài năng phá cách, ngôn luận sắc bén. Thương Quan vượng: thông minh nổi loạn, không ưa khuôn phép; dùng đúng thành nghệ sĩ, chuyên gia; dùng sai thành khẩu thiệt.",
"Chính Tài":"Nhật chủ khắc, khác âm dương — tiền lương chính đáng, người vợ (nam mệnh), của cải bền. Chính Tài vượng: thực tế, quản lý tiền giỏi, trọng gia đình.",
"Thiên Tài":"Nhật chủ khắc, cùng âm dương — tiền cơ hội, kinh doanh, đầu tư, người cha. Thiên Tài vượng: nhạy bén thương trường, tiền vào nhanh — cần kỷ luật để giữ.",
"Chính Quan":"Khắc nhật chủ, khác âm dương — chức vụ, pháp luật, người chồng (nữ mệnh). Chính Quan vượng: đường công danh chính thống thuận, sống chuẩn mực, được nể trọng.",
"Thất Sát":"Khắc nhật chủ, cùng âm dương — quyền lực cạnh tranh, áp lực lớn. Thất Sát vượng có chế hoá: làm tướng làm chủ, dám đương đầu; thiếu chế hoá: đời nhiều sóng gió thử lửa.",
"Chính Ấn":"Sinh nhật chủ, khác âm dương — học vấn, bằng cấp, người mẹ, sự che chở. Chính Ấn vượng: hiếu học, nhân hậu, được quý nhân nâng đỡ, hợp nghề giáo dục nghiên cứu.",
"Thiên Ấn":"Sinh nhật chủ, cùng âm dương — tri thức dị biệt, huyền học, kỹ năng độc môn. Thiên Ấn vượng: tư duy khác người, hợp ngành chuyên sâu hẹp (y, lý số, kỹ thuật đặc thù)."
};

/* Ngũ hành chuyên sâu */
const NGUHANH_INFO={
"Mộc":"Cây cối — sinh trưởng, vươn lên, nhân từ. Mùa xuân; phương Đông; màu xanh lục; tạng Gan–Mật; vị chua. Sinh Hỏa, khắc Thổ; được Thủy sinh, bị Kim khắc. Nghề hợp: giáo dục, y dược thảo mộc, thời trang, nội thất gỗ, nông lâm, xuất bản.",
"Hỏa":"Lửa — bốc lên, toả sáng, lễ nghĩa. Mùa hạ; phương Nam; màu đỏ; tạng Tim–Ruột non; vị đắng. Sinh Thổ, khắc Kim; được Mộc sinh, bị Thủy khắc. Nghề hợp: năng lượng, truyền thông, ẩm thực nhiệt, mỹ thuật ánh sáng, điện – điện tử, giải trí.",
"Thổ":"Đất — chở đỡ, hoá dục, trung tín. Tứ quý (cuối mỗi mùa); trung ương; màu vàng nâu; tạng Tỳ–Vị; vị ngọt. Sinh Kim, khắc Thủy; được Hỏa sinh, bị Mộc khắc. Nghề hợp: bất động sản, xây dựng, nông nghiệp, gốm sứ, bảo hiểm, kho vận.",
"Kim":"Kim loại — thu liễm, sắc bén, cương nghị. Mùa thu; phương Tây; màu trắng; tạng Phổi–Ruột già; vị cay. Sinh Thủy, khắc Mộc; được Thổ sinh, bị Hỏa khắc. Nghề hợp: tài chính ngân hàng, cơ khí, kim hoàn, pháp lý, quân đội – công an, y khoa dao kéo.",
"Thủy":"Nước — thấm xuống, lưu thông, trí tuệ. Mùa đông; phương Bắc; màu đen xanh dương; tạng Thận–Bàng quang; vị mặn. Sinh Mộc, khắc Hỏa; được Kim sinh, bị Thổ khắc. Nghề hợp: thương mại lưu thông, vận tải đường thuỷ, du lịch, truyền thông số, nghiên cứu, đồ uống."
};

/* Bát quái — 8 quẻ đơn */
const BATQUAI_INFO={
"Càn ☰":"Trời — thuần dương, hành Kim, phương Tây Bắc. Gia đình: người cha. Cơ thể: đầu, phổi. Tính chất: cương kiện, sáng tạo, lãnh đạo, quyền uy. Vật tượng: trời, vua, ngựa, vàng ngọc.",
"Đoài ☱":"Đầm — hành Kim, phương Tây. Gia đình: thiếu nữ (con gái út). Cơ thể: miệng, họng. Tính chất: vui vẻ, ngôn từ, giao tiếp, thu hoạch. Vật tượng: ao đầm, ca hát, dê.",
"Ly ☲":"Lửa — hành Hỏa, phương Nam. Gia đình: trung nữ (con gái giữa). Cơ thể: mắt, tim. Tính chất: sáng rõ, văn minh, bám dính, danh tiếng. Vật tượng: mặt trời, chim trĩ, sách vở, mạng lưới.",
"Chấn ☳":"Sấm — hành Mộc, phương Đông. Gia đình: trưởng nam. Cơ thể: chân, gan. Tính chất: chấn động, khởi phát, quyết đoán, tiếng vang. Vật tượng: sấm sét, rồng, cây tre non.",
"Tốn ☴":"Gió — hành Mộc, phương Đông Nam. Gia đình: trưởng nữ. Cơ thể: đùi, mật. Tính chất: thuận nhập, len lỏi, mệnh lệnh, buôn bán. Vật tượng: gió, gà, cây cao, sợi dây.",
"Khảm ☵":"Nước — hành Thủy, phương Bắc. Gia đình: trung nam (con trai giữa). Cơ thể: tai, thận. Tính chất: hiểm sâu, trí tuệ, ẩn tàng, lao khổ. Vật tượng: mưa, sông ngòi, lợn, bánh xe.",
"Cấn ☶":"Núi — hành Thổ, phương Đông Bắc. Gia đình: thiếu nam (con trai út). Cơ thể: tay, dạ dày. Tính chất: dừng đúng lúc, bền tĩnh, tích tụ. Vật tượng: núi, chó, cửa ngõ, đá.",
"Khôn ☷":"Đất — thuần âm, hành Thổ, phương Tây Nam. Gia đình: người mẹ. Cơ thể: bụng, tỳ. Tính chất: nhu thuận, bao dung, chở đỡ, cần lao. Vật tượng: đất đai, trâu bò, vải vóc, đám đông."
};

/* Thần số học Pythagoras — ý nghĩa các con số */
const SO_INFO={
1:"Người Dẫn Đường. Độc lập, tiên phong, ý chí mạnh, sinh ra để tự mở lối và đứng đầu. Điểm mạnh: quyết đoán, sáng tạo khởi xướng, không ngại đơn độc. Thách thức: cái tôi lớn, cứng đầu, khó nhờ vả người khác. Bài học đời: lãnh đạo bằng cách nâng người khác lên chứ không phải đi trước một mình. Nghề hợp: khởi nghiệp, quản lý, sáng lập, vận động viên.",
2:"Người Kết Nối. Nhạy cảm, hoà giải, giỏi lắng nghe, sức mạnh nằm ở sự dịu dàng. Điểm mạnh: ngoại giao, hợp tác, trực giác về con người. Thách thức: dựa dẫm, sợ va chạm, hay tự ái ngầm. Bài học: giữ tiếng nói riêng trong khi vẫn giữ hoà khí. Nghề hợp: nhân sự, tư vấn, ngoại giao, chăm sóc khách hàng, trị liệu.",
3:"Người Truyền Cảm Hứng. Sáng tạo, hoạt ngôn, hài hước, đem niềm vui đến mọi nhóm. Điểm mạnh: giao tiếp, nghệ thuật, lạc quan lan toả. Thách thức: phân tán, nói nhiều hơn làm, chạy trốn nỗi buồn bằng sự bận rộn. Bài học: kỷ luật hoá tài năng — một tác phẩm hoàn thành hơn mười ý tưởng dở dang. Nghề hợp: truyền thông, viết lách, biểu diễn, marketing, giảng dạy.",
4:"Người Xây Nền. Thực tế, kỷ luật, đáng tin, xây mọi thứ bằng gạch thật. Điểm mạnh: tổ chức, bền bỉ, trung thực, quản trị chi tiết. Thách thức: cứng nhắc, lo xa, khó thích nghi thay đổi. Bài học: nền móng vững là để xây cao — đừng biến kỷ luật thành nhà tù. Nghề hợp: kỹ thuật, tài chính kế toán, xây dựng, vận hành, luật.",
5:"Người Tự Do. Ưa xê dịch, tò mò, thích nghi thần tốc, sống bằng trải nghiệm. Điểm mạnh: linh hoạt, bán hàng – thuyết phục, ngoại ngữ, ứng biến. Thách thức: cả thèm chóng chán, khó cam kết, dễ sa vào hưởng thụ giác quan. Bài học: tự do thật sự đến từ vài cam kết tự nguyện được giữ trọn. Nghề hợp: du lịch, thương mại, báo chí, sự kiện, nghề tự do đa dạng.",
6:"Người Nuôi Dưỡng. Trách nhiệm, yêu gia đình, thẩm mỹ, sinh ra để chăm lo và làm đẹp. Điểm mạnh: tận tâm, chữa lành, tạo tổ ấm, được tin cậy. Thách thức: ôm việc thiên hạ, hy sinh quá mức rồi tủi thân, cầu toàn với người thân. Bài học: chăm mình trước khi chăm người — bình rỗng không rót được cho ai. Nghề hợp: y tế, giáo dục, thiết kế, ẩm thực, dịch vụ gia đình.",
7:"Người Truy Tìm. Trí tuệ phân tích, hướng nội, khát chân lý, tin vào bằng chứng và trực giác sâu. Điểm mạnh: nghiên cứu, chuyên môn sâu, độc lập tư duy. Thách thức: hoài nghi, xa cách, khó mở lòng chia sẻ. Bài học: tri thức trọn vẹn khi được trao đi; cô đơn chọn lọc khác cô lập. Nghề hợp: khoa học, phân tích dữ liệu, y học chuyên sâu, triết học – tâm linh, kỹ thuật cao.",
8:"Người Điều Hành. Tham vọng, thực lực, hiểu quyền lực và tiền bạc, sinh ra để quản trị nguồn lực lớn. Điểm mạnh: quyết đoán kinh doanh, chịu áp lực giỏi, nhìn ra giá trị. Thách thức: tham công tiếc việc, đo mọi thứ bằng thành tích, dễ va chạm quyền lợi. Bài học: quyền lực là công cụ phụng sự — cho đi cân xứng với tích lũy thì vận số 8 mới bền. Nghề hợp: điều hành doanh nghiệp, tài chính đầu tư, bất động sản, pháp lý thương mại.",
9:"Người Nhân Ái. Bao dung, lý tưởng, nghệ sĩ tính, mang tầm nhìn phụng sự cộng đồng. Điểm mạnh: thấu cảm rộng, truyền cảm hứng nhân văn, đa tài tổng hợp. Thách thức: mơ mộng phi thực tế, khó buông quá khứ, cho đi đến kiệt sức. Bài học: muốn cứu thế giới phải bắt đầu từ một việc cụ thể — và biết khép lại chu kỳ cũ. Nghề hợp: giáo dục cộng đồng, y tế nhân đạo, nghệ thuật, phi chính phủ, tâm lý.",
11:"Số Vua 11 — Người Soi Sáng (Master). Trực giác cực nhạy, ăng-ten tâm linh, truyền cảm hứng bằng sự hiện diện. Là dạng cao tần của số 2: kết nối ở tầm ý tưởng – tinh thần. Thách thức: thần kinh căng như dây đàn, lo âu, áp lực 'phải đặc biệt'. Bài học: nối đất — biến trực giác thành sản phẩm cụ thể; khi chưa vững hãy sống như số 2 lành mạnh. Nghề hợp: giảng dạy truyền cảm hứng, nghệ thuật, trị liệu, cố vấn chiến lược.",
22:"Số Vua 22 — Kiến Trúc Sư Bậc Thầy (Master). Khả năng biến giấc mơ lớn thành công trình thật — dạng cao tần của số 4: xây nền ở quy mô cộng đồng, thời đại. Thách thức: áp lực nội tâm khổng lồ, sợ chính tiềm năng của mình, dễ tự phá khi non nội lực. Bài học: chia giấc mơ lớn thành các viên gạch có thời hạn; khi quá tải hãy vận hành như số 4 vững chãi. Nghề hợp: kiến trúc – hạ tầng, sáng lập tổ chức lớn, chính sách, công nghệ nền tảng.",
33:"Số Vua 33 — Người Thầy Từ Ái (Master). Hiếm gặp; dạng cao tần của số 6: yêu thương và nâng đỡ ở quy mô rộng, chữa lành bằng sự tận hiến. Thách thức: gánh nỗi đau người khác như của mình, quên hẳn bản thân. Bài học: từ ái có kỷ luật — giúp người bằng cách dạy họ tự đứng; khi quá tải hãy sống như số 6 ấm áp. Nghề hợp: giáo dục – y tế – tâm linh phụng sự, công tác xã hội, nghệ thuật chữa lành."
};
const PY_INFO={
1:"Năm gieo hạt: khởi đầu chu kỳ 9 năm mới — mạnh dạn bắt đầu điều lớn, trồng cây nào năm nay sẽ hái suốt 9 năm tới.",
2:"Năm vun tưới & kết nối: đi chậm, xây quan hệ, kiên nhẫn với tiến độ; các mối duyên hợp tác nảy nở.",
3:"Năm nở hoa & thể hiện: sáng tạo, giao tiếp, niềm vui; đưa bản thân ra ánh sáng, cẩn thận phân tán.",
4:"Năm xây móng: làm việc chăm, củng cố cấu trúc (nhà cửa, sức khoẻ, kỹ năng); ít hào nhoáng nhưng quyết định độ bền.",
5:"Năm chuyển động: thay đổi, du lịch, cơ hội bất ngờ; linh hoạt đón gió nhưng giữ một mỏ neo.",
6:"Năm gia đạo & trách nhiệm: hôn nhân, nhà cửa, chăm sóc người thân là trọng tâm; cân bằng cho–nhận.",
7:"Năm nhìn vào trong: học sâu, nghiên cứu, tâm linh, nghỉ dưỡng; không hợp bung ra ngoài ồ ạt.",
8:"Năm gặt hái quyền lực & tiền bạc: thành quả chu kỳ chín rộ — quyết đoán thu hoạch, quản trị lớn.",
9:"Năm khép chu kỳ: buông bỏ, tha thứ, tổng kết, cho đi; dọn sạch đất để sang năm gieo mùa mới."
};
