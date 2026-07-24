export const CHOICE_TAXONOMY = Object.freeze([
  {
    id: "tarot", label: "Tarot & không gian thực hành", icon: "✦",
    description: "Bộ bài, khăn trải và phụ kiện giúp thực hành thuận tay hơn.",
    slug: "tarot", title: "Chọn bộ bài Tarot và phụ kiện phù hợp",
    intro: "So sánh bộ bài, khăn trải và phụ kiện theo kinh nghiệm sử dụng, ngân sách, kích thước và phong cách hình ảnh.",
    guideSlug: "chon-bo-bai-tarot-cho-nguoi-moi", guideTitle: "Cách chọn bộ bài Tarot cho người mới",
    guideIntro: "Ưu tiên hệ biểu tượng dễ học, kích thước vừa tay, chất lượng in rõ và nguồn tài liệu phong phú.",
    tips: ["Chọn hệ biểu tượng có nhiều tài liệu nếu mới bắt đầu.", "Kiểm tra kích thước lá và chất lượng cán.", "Không mua chỉ vì hình đẹp nếu biểu tượng khó đọc."],
    keywords: ["bài tarot", "khăn trải tarot", "túi đựng tarot"], priorities: ["de-dung", "tham-my", "gon-nhe"],
    bestFor: ["Người học hoặc thực hành Tarot", "Người muốn phụ kiện gọn và dễ dùng"],
    avoidIf: ["Cần kiểm tra kỹ kích thước, chất liệu và đánh giá mới nhất trước khi mua"]
  },
  {
    id: "creator", label: "Sáng tạo nội dung", icon: "◉",
    description: "Micro, đèn, tripod và phụ kiện cho video ngắn, livestream, podcast.",
    slug: "sang-tao-noi-dung", title: "Chọn thiết bị sáng tạo nội dung phù hợp",
    intro: "So sánh micro, đèn, tripod và phụ kiện theo cổng kết nối, môi trường ghi âm, độ cơ động và ngân sách.",
    guideSlug: "chon-thiet-bi-sang-tao-noi-dung", guideTitle: "Cách chọn thiết bị quay video và livestream",
    guideIntro: "Bắt đầu từ thiết bị đang dùng, khoảng cách quay, tiếng ồn và mức độ di chuyển.",
    tips: ["Xác định cổng kết nối trước khi mua.", "Quay cố định có thể ưu tiên thiết bị có dây.", "Trong nơi ồn, vị trí micro quan trọng hơn thông số quảng cáo."],
    keywords: ["micro cài áo", "tripod điện thoại", "đèn led quay video", "webcam livestream"], priorities: ["quay-video", "am-thanh", "gon-nhe", "de-dung"],
    bestFor: ["Người làm video ngắn, livestream hoặc podcast", "Người cần thiết bị dễ triển khai"],
    avoidIf: ["Cần đối chiếu cổng kết nối, tải trọng và khả năng tương thích"]
  },
  {
    id: "3d", label: "In 3D", icon: "⬡",
    description: "Filament, resin, dụng cụ và vật tư phục vụ in FDM hoặc resin.",
    slug: "in-3d", title: "Chọn vật tư in 3D phù hợp",
    intro: "So sánh PLA, PETG, resin và vật tư theo loại máy, độ bền, độ chi tiết, bảo quản và an toàn.",
    guideSlug: "chon-vat-lieu-in-3d-phu-hop", guideTitle: "Cách chọn vật liệu và vật tư in 3D",
    guideIntro: "Chọn theo loại máy, mục đích sử dụng, độ bền và khả năng kiểm soát nhiệt, độ ẩm hoặc hậu xử lý.",
    tips: ["PLA thường dễ bắt đầu hơn PETG.", "Resin cần thông gió và bảo hộ phù hợp.", "Kiểm tra đường kính filament hoặc loại resin tương thích."],
    keywords: ["filament PLA", "filament PETG", "resin in 3d", "dụng cụ in 3d"], priorities: ["de-in", "on-dinh", "do-ben", "chi-tiet"],
    bestFor: ["Người in 3D cần vật tư phổ thông", "Người muốn cân bằng chi phí và độ ổn định"],
    avoidIf: ["Cần kiểm tra profile máy, màu, kích thước và yêu cầu an toàn"]
  },
  {
    id: "tech", label: "Công nghệ & phụ kiện số", icon: "⌘",
    description: "Phụ kiện điện thoại, máy tính và thiết bị số thiết thực hằng ngày.",
    slug: "cong-nghe-phu-kien-so", title: "Chọn phụ kiện công nghệ đáng mua",
    intro: "So sánh sạc, cáp, tai nghe và phụ kiện số theo chuẩn kết nối, công suất, độ bền và bảo hành.",
    guideSlug: "chon-phu-kien-cong-nghe-an-toan", guideTitle: "Cách chọn phụ kiện công nghệ an toàn",
    guideIntro: "Kiểm tra chuẩn kết nối, công suất hỗ trợ, chứng nhận an toàn và chính sách bảo hành trước khi mua.",
    tips: ["Đối chiếu đúng chuẩn USB-C, Lightning hoặc jack âm thanh.", "Không chọn sạc chỉ dựa trên công suất quảng cáo.", "Ưu tiên nơi bán có bảo hành rõ ràng."],
    keywords: ["sạc nhanh usb c", "cáp sạc bền", "tai nghe bluetooth", "giá đỡ laptop"], priorities: ["tuong-thich", "an-toan", "do-ben", "bao-hanh"],
    bestFor: ["Người cần phụ kiện số dùng hằng ngày", "Người ưu tiên độ tương thích và bảo hành"],
    avoidIf: ["Cần kiểm tra chuẩn sạc, cổng kết nối và thiết bị hỗ trợ"]
  },
  {
    id: "home", label: "Nhà cửa & gia dụng", icon: "⌂",
    description: "Đồ gia dụng, lưu trữ và tiện ích giúp không gian gọn và dễ dùng hơn.",
    slug: "nha-cua-gia-dung", title: "Chọn đồ gia dụng và tiện ích nhà cửa",
    intro: "So sánh sản phẩm theo kích thước, công suất, độ bền, vệ sinh và điều kiện bảo hành.",
    guideSlug: "chon-do-gia-dung-phu-hop", guideTitle: "Cách chọn đồ gia dụng phù hợp",
    guideIntro: "Đo không gian, xác định tần suất dùng và kiểm tra công suất, vật liệu, vệ sinh, bảo hành.",
    tips: ["Đo kích thước vị trí sử dụng trước khi đặt hàng.", "Kiểm tra điện áp và công suất thiết bị.", "Ưu tiên sản phẩm dễ vệ sinh và có linh kiện thay thế."],
    keywords: ["hộp đựng đồ", "máy hút bụi mini", "kệ nhà bếp", "đèn cảm biến"], priorities: ["gon-gang", "de-ve-sinh", "do-ben", "tiet-kiem"],
    bestFor: ["Người muốn tối ưu không gian sống", "Người cần tiện ích gia dụng dễ dùng"],
    avoidIf: ["Cần kiểm tra kích thước, điện áp và điều kiện bảo hành"]
  },
  {
    id: "beauty", label: "Làm đẹp & chăm sóc cá nhân", icon: "◇",
    description: "Mỹ phẩm và dụng cụ chăm sóc cá nhân không thuộc nhóm thuốc hoặc thực phẩm bổ sung.",
    slug: "lam-dep-cham-soc-ca-nhan", title: "Chọn sản phẩm làm đẹp và chăm sóc cá nhân",
    intro: "So sánh theo loại da, thành phần, hạn sử dụng, cách dùng và nguồn phân phối.",
    guideSlug: "chon-my-pham-va-dung-cu-lam-dep", guideTitle: "Cách chọn mỹ phẩm và dụng cụ làm đẹp",
    guideIntro: "Bắt đầu từ nhu cầu thật, loại da, thành phần và khả năng thử trước; không dựa vào cam kết quá mức.",
    tips: ["Đọc bảng thành phần và hạn sử dụng.", "Thử trên vùng nhỏ khi dùng sản phẩm mới.", "Không dùng mỹ phẩm thay thế chẩn đoán hoặc điều trị y khoa."],
    keywords: ["kem chống nắng", "son tint", "máy sấy tóc", "cọ trang điểm"], priorities: ["thanh-phan-ro", "nguon-goc", "de-dung", "phu-hop"],
    bestFor: ["Người muốn so sánh mỹ phẩm và dụng cụ cá nhân", "Người ưu tiên nguồn gốc và hướng dẫn rõ"],
    avoidIf: ["Cần kiểm tra dị ứng, thành phần, hạn dùng và hướng dẫn của nhà sản xuất"]
  },
  {
    id: "fashion", label: "Thời trang & phụ kiện", icon: "♢",
    description: "Trang phục và phụ kiện phổ thông theo nhu cầu, kích thước và hoàn cảnh sử dụng.",
    slug: "thoi-trang-phu-kien", title: "Chọn thời trang và phụ kiện phù hợp",
    intro: "So sánh theo bảng size, chất liệu, độ hoàn thiện, hoàn cảnh sử dụng và chính sách đổi trả.",
    guideSlug: "chon-thoi-trang-online-it-rui-ro", guideTitle: "Cách mua thời trang online ít rủi ro",
    guideIntro: "Đo số đo thật, đọc bảng size của từng nơi bán và ưu tiên chính sách đổi trả rõ ràng.",
    tips: ["Không dùng size quen thuộc thay cho bảng size của shop.", "Đọc mô tả chất liệu và ảnh đánh giá thật.", "Kiểm tra điều kiện đổi size trước khi mua."],
    keywords: ["túi đeo chéo", "áo khoác nữ", "giày thể thao", "phụ kiện tóc"], priorities: ["dung-size", "chat-lieu", "doi-tra", "de-phoi"],
    bestFor: ["Người mua thời trang online", "Người cần phụ kiện dễ phối và dễ đổi trả"],
    avoidIf: ["Cần đo số đo và đối chiếu bảng size riêng của nơi bán"]
  },
  {
    id: "mom-baby", label: "Mẹ & bé", icon: "♡",
    description: "Đồ dùng sinh hoạt, đồ chơi giáo dục và phụ kiện an toàn cho gia đình có trẻ nhỏ.",
    slug: "me-va-be", title: "Chọn đồ dùng mẹ và bé an toàn",
    intro: "So sánh theo độ tuổi, vật liệu, kích thước, cảnh báo an toàn và khả năng vệ sinh.",
    guideSlug: "chon-do-dung-me-va-be-an-toan", guideTitle: "Cách chọn đồ dùng mẹ và bé an toàn",
    guideIntro: "Ưu tiên sản phẩm đúng độ tuổi, vật liệu rõ ràng, không có chi tiết nhỏ nguy hiểm và dễ vệ sinh.",
    tips: ["Đọc giới hạn độ tuổi và cảnh báo nghẹt/hóc.", "Kiểm tra vật liệu và cạnh sắc.", "Không dùng sản phẩm thay cho thiết bị y tế hoặc giám sát người lớn."],
    keywords: ["đồ chơi giáo dục", "balo trẻ em", "bình nước trẻ em", "thảm chơi em bé"], priorities: ["an-toan", "dung-do-tuoi", "de-ve-sinh", "do-ben"],
    bestFor: ["Gia đình có trẻ nhỏ", "Người ưu tiên độ tuổi và cảnh báo an toàn"],
    avoidIf: ["Cần kiểm tra độ tuổi, kích thước chi tiết và chứng nhận an toàn"]
  },
  {
    id: "pets", label: "Thú cưng", icon: "♧",
    description: "Đồ dùng vệ sinh, ăn uống và vận động cho chó mèo và thú cưng phổ biến.",
    slug: "thu-cung", title: "Chọn đồ dùng cho thú cưng",
    intro: "So sánh theo kích thước, giống, thói quen, vật liệu, vệ sinh và độ bền.",
    guideSlug: "chon-do-dung-cho-thu-cung", guideTitle: "Cách chọn đồ dùng cho thú cưng",
    guideIntro: "Chọn theo kích thước thật, hành vi và khả năng vệ sinh; tránh sản phẩm có chi tiết dễ nuốt.",
    tips: ["Đo kích thước thú cưng thay vì chỉ chọn theo giống.", "Kiểm tra vật liệu và chi tiết dễ bong.", "Thức ăn và sản phẩm điều trị cần theo tư vấn chuyên môn phù hợp."],
    keywords: ["cát mèo", "đồ chơi cho mèo", "dây dắt chó", "máy lọc nước thú cưng"], priorities: ["dung-kich-thuoc", "de-ve-sinh", "an-toan", "do-ben"],
    bestFor: ["Người nuôi chó mèo", "Người cần đồ dùng dễ vệ sinh và bền"],
    avoidIf: ["Cần kiểm tra kích thước, vật liệu và nguy cơ thú cưng nuốt phải"]
  },
  {
    id: "office", label: "Học tập & văn phòng", icon: "▤",
    description: "Thiết bị và dụng cụ giúp bàn học, bàn làm việc gọn và hiệu quả hơn.",
    slug: "hoc-tap-van-phong", title: "Chọn đồ học tập và văn phòng",
    intro: "So sánh theo tư thế sử dụng, kích thước bàn, khả năng tương thích và độ bền.",
    guideSlug: "chon-phu-kien-ban-hoc-lam-viec", guideTitle: "Cách chọn phụ kiện bàn học và làm việc",
    guideIntro: "Ưu tiên công thái học, kích thước thật của bàn và khả năng điều chỉnh thay vì chỉ nhìn thiết kế.",
    tips: ["Đo diện tích bàn trước khi mua.", "Ưu tiên phụ kiện có thể điều chỉnh.", "Bàn phím và chuột cần phù hợp hệ điều hành và kiểu kết nối."],
    keywords: ["bàn phím cơ", "chuột không dây", "đèn bàn học", "giá đỡ màn hình"], priorities: ["cong-thai-hoc", "gon-gang", "tuong-thich", "do-ben"],
    bestFor: ["Người học tập hoặc làm việc tại bàn", "Người muốn tối ưu không gian và tư thế"],
    avoidIf: ["Cần kiểm tra kích thước bàn, kiểu kết nối và khả năng điều chỉnh"]
  },
  {
    id: "fitness", label: "Thể thao & vận động", icon: "△",
    description: "Dụng cụ vận động phổ thông, không bao gồm thuốc hoặc sản phẩm giảm cân.",
    slug: "the-thao-van-dong", title: "Chọn dụng cụ thể thao và vận động",
    intro: "So sánh theo mục tiêu tập, mức kháng lực, kích thước, độ bám và điều kiện sử dụng.",
    guideSlug: "chon-dung-cu-tap-luyen-tai-nha", guideTitle: "Cách chọn dụng cụ tập luyện tại nhà",
    guideIntro: "Chọn dụng cụ phù hợp thể lực hiện tại, không gian tập và kỹ thuật; tăng tải từ từ.",
    tips: ["Chọn mức kháng lực phù hợp thể lực hiện tại.", "Kiểm tra độ bám và giới hạn tải.", "Dừng tập và tìm tư vấn chuyên môn khi có đau bất thường."],
    keywords: ["thảm yoga", "dây kháng lực", "bình nước thể thao", "con lăn massage"], priorities: ["an-toan", "dung-muc", "do-ben", "de-bao-quan"],
    bestFor: ["Người tập luyện tại nhà", "Người cần dụng cụ vận động phổ thông"],
    avoidIf: ["Cần kiểm tra giới hạn tải, kỹ thuật sử dụng và tình trạng sức khỏe"]
  },
  {
    id: "travel", label: "Du lịch & di chuyển", icon: "✈",
    description: "Vali, túi, phụ kiện và tiện ích giúp hành trình gọn và thuận tiện hơn.",
    slug: "du-lich-di-chuyen", title: "Chọn đồ du lịch và phụ kiện di chuyển",
    intro: "So sánh theo kích thước hành lý, trọng lượng, độ bền, chống nước và quy định hãng vận chuyển.",
    guideSlug: "chon-phu-kien-du-lich-gon-nhe", guideTitle: "Cách chọn phụ kiện du lịch gọn nhẹ",
    guideIntro: "Đối chiếu kích thước hành lý, khối lượng, thời tiết và cách di chuyển trước khi mua.",
    tips: ["Kiểm tra giới hạn kích thước của hãng bay hoặc nhà xe.", "Ưu tiên vật liệu nhẹ nhưng dễ vệ sinh.", "Không để giấy tờ hoặc tài sản quan trọng trong ngăn ngoài dễ mở."],
    keywords: ["vali du lịch", "gối cổ du lịch", "túi chống nước", "túi chia hành lý"], priorities: ["gon-nhe", "do-ben", "chong-nuoc", "de-sap-xep"],
    bestFor: ["Người thường xuyên di chuyển", "Người muốn hành lý gọn và dễ quản lý"],
    avoidIf: ["Cần kiểm tra quy định kích thước, trọng lượng và chất liệu"]
  }
]);

export const BLOCKED_AFFILIATE_TERMS = Object.freeze([
  "thuốc", "thuốc kê đơn", "kháng sinh", "giảm cân", "tăng cân", "thực phẩm chức năng", "viên uống", "detox", "thuốc nam", "thuốc bắc",
  "rượu", "bia", "thuốc lá", "vape", "nicotine", "cần sa", "cbd", "nấm ảo giác",
  "dao", "súng", "đạn", "taser", "dùi cui", "pháo", "chất nổ",
  "sex toy", "18+", "kích dục", "cá cược", "casino", "đánh bạc",
  "thuốc trừ sâu", "chất độc", "phóng xạ", "hàng giả", "replica", "fake 1:1"
]);
