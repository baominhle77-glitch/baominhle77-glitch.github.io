/* ============ DỮ LIỆU CHIÊM TINH CÁ NHÂN HOÁ + THẦN SỐ CHUYÊN SÂU ============ */

/* Thành phố sinh: [tên, vĩ độ, kinh độ đông, múi giờ] — để tính điểm Mọc chuẩn */
const CITIES=[
["Hà Nội",21.03,105.85,7],["Hải Phòng",20.86,106.68,7],["Nam Định",20.42,106.17,7],
["Thanh Hóa",19.81,105.78,7],["Vinh",18.68,105.68,7],["Huế",16.46,107.60,7],
["Đà Nẵng",16.05,108.20,7],["Quy Nhơn",13.78,109.22,7],["Nha Trang",12.24,109.19,7],
["Buôn Ma Thuột",12.67,108.05,7],["Đà Lạt",11.94,108.44,7],["Phan Thiết",10.93,108.10,7],
["Biên Hòa",10.95,106.82,7],["TP. Hồ Chí Minh",10.82,106.63,7],["Vũng Tàu",10.35,107.08,7],
["Mỹ Tho",10.36,106.36,7],["Cần Thơ",10.04,105.79,7],["Long Xuyên",10.39,105.44,7],
["Rạch Giá",10.01,105.09,7],["Cà Mau",9.18,105.15,7],
["— Nước ngoài —",0,0,99],
["Tokyo",35.68,139.65,9],["Seoul",37.57,126.98,9],["Bắc Kinh",39.90,116.40,8],
["Singapore",1.35,103.82,8],["Bangkok",13.75,100.50,7],["Sydney",-33.87,151.21,10],
["Paris",48.85,2.35,1],["London",51.51,-0.13,0],["Los Angeles",34.05,-118.24,-8]
];

/* 12 cung: nguyên tố (0=Hỏa 1=Đất 2=Khí 3=Nước), thể (0=Thống lĩnh/Cardinal 1=Kiên định/Fixed 2=Linh hoạt/Mutable), cực (0=Dương 1=Âm) */
const SIGN_ELEM=[0,1,2,3,0,1,2,3,0,1,2,3];
const SIGN_MODE=[0,1,2,0,1,2,0,1,2,0,1,2];
const SIGN_POL =[0,1,0,1,0,1,0,1,0,1,0,1];
const ELEM_NAME=["Hỏa","Đất","Khí","Nước"];
const MODE_NAME=["Thống lĩnh (Cardinal)","Kiên định (Fixed)","Linh hoạt (Mutable)"];

const ELEM_DESC=[
"Hỏa (Bạch Dương–Sư Tử–Nhân Mã): nhiệt huyết, hành động, cảm hứng, bản năng dẫn dắt. Người nhiều Hỏa sống bằng đam mê và ý chí, cần được truyền lửa và tự do bung sức; điểm mù là thiếu kiên nhẫn và bỏ quên cảm xúc người khác.",
"Đất (Kim Ngưu–Xử Nữ–Ma Kết): thực tế, bền bỉ, chú trọng kết quả cụ thể và sự an toàn vật chất. Người nhiều Đất xây đời bằng kỷ luật và độ tin cậy; điểm mù là bảo thủ, sa vào vật chất, ngại thay đổi.",
"Khí (Song Tử–Thiên Bình–Bảo Bình): tư duy, ngôn từ, kết nối, ý tưởng. Người nhiều Khí sống trong thế giới của trí óc và các mối quan hệ xã hội; điểm mù là sống trên đầu, thiếu chiều sâu cảm xúc, do dự.",
"Nước (Cự Giải–Bọ Cạp–Song Ngư): cảm xúc, trực giác, thấu cảm, chiều sâu. Người nhiều Nước cảm nhận thế giới trước khi lý giải nó; điểm mù là quá nhạy cảm, dễ bị cuốn, ranh giới bản thân mờ."
];
const MODE_DESC=[
"Thống lĩnh: khởi xướng, mở đầu, thúc đẩy. Bạn giỏi bắt đầu và tạo động lực, nhưng dễ bỏ dở khi hết hứng khởi ban đầu.",
"Kiên định: duy trì, bền bỉ, chốt hạ. Bạn giỏi giữ vững và đi đến cùng, nhưng dễ cứng nhắc, kháng cự thay đổi.",
"Linh hoạt: thích nghi, chuyển hoá, kết nối. Bạn giỏi xoay chuyển theo hoàn cảnh, nhưng dễ phân tán, thiếu một hướng cố định."
];

/* Sao Thuỷ — cách nghĩ & giao tiếp, theo cung (0=Bạch Dương…11=Song Ngư) */
const MERCURY_SIGN=[
"nghĩ nhanh, nói thẳng, quyết đoán; học bằng cách lao vào làm, thiếu kiên nhẫn với tiểu tiết",
"tư duy chậm mà chắc, thực tế, nhớ lâu; một khi định kiến thì khó lay chuyển",
"trí óc linh hoạt đa chiều, hoạt ngôn, hiếu kỳ; giỏi kết nối ý nhưng dễ phân tán, hời hợt",
"nghĩ bằng cảm xúc và ký ức, trực giác mạnh; chủ quan, nhớ dai điều đã lắng nghe",
"tư duy tự tin, biểu đạt cuốn hút và có uy; giỏi thuyết phục nhưng chạm tự ái khi bị bác bỏ",
"phân tích sắc bén, tỉ mỉ, phản biện chặt chẽ; dễ sa đà vào chi tiết và soi lỗi",
"cân nhắc mọi phía, ngoại giao, công bằng trong lời; điểm yếu là do dự, ngại quyết",
"tư duy điều tra, đào tận gốc, nhìn thấu động cơ ẩn; hoài nghi, lời nói sắc như dao",
"tư duy tầm rộng, triết lý, lạc quan; giỏi thấy bức tranh lớn nhưng xem nhẹ chi tiết và dễ nói quá",
"tư duy chiến lược, kỷ luật, thực dụng dài hạn; dè dặt, nói ít mà chắc, hơi bi quan",
"tư duy đột phá, khách quan, độc lập; nhìn xa hơn thời đại nhưng ngang bướng khi đã tin điều gì",
"tư duy bằng hình ảnh và trực giác, giàu chất thơ; phi tuyến, khó diễn đạt điều mình cảm"
];
/* Sao Kim — cách yêu & giá trị */
const VENUS_SIGN=[
"yêu bốc lửa, chủ động chinh phục, thích sự đuổi bắt; nồng nhiệt nhưng mau chán nếu thiếu thử thách",
"yêu bền và cảm quan, chung thuỷ, trọng sự ổn định; có xu hướng chiếm hữu và ghen về vật chất",
"yêu bằng trò chuyện và trí tuệ, cần sự đa dạng và vui vẻ; khó đi vào chiều sâu, dễ 'yêu bằng đầu'",
"yêu để nuôi dưỡng và được che chở, gắn bó gia đình; nhạy cảm, dễ tổn thương, cần cảm giác an toàn",
"yêu nồng nhiệt và hào phóng, lãng mạn phô bày; cần được ngưỡng mộ và trung thành tuyệt đối",
"yêu bằng hành động chăm sóc thiết thực, kín đáo, kén chọn; ngại phô trương, sợ không hoàn hảo",
"yêu sự hài hoà và lãng mạn đẹp đôi, cần bạn đời để trọn vẹn; ngại đơn độc, dễ chiều lòng đến mất mình",
"yêu mãnh liệt tận cùng, sâu và độc quyền; chung thuỷ tuyệt đối nhưng chiếm hữu và dễ ghen sâu",
"yêu tự do và phiêu lưu, chân thành phóng khoáng; cần không gian riêng, dị ứng ràng buộc ngột ngạt",
"yêu nghiêm túc và cam kết dài lâu, thực tế; dè dặt biểu lộ nhưng một khi trao thì bền vững",
"yêu như tình tri kỷ, cần tự do và sự độc lập; ít ghen theo lối thường, coi trọng tình bạn trong tình yêu",
"yêu vô điều kiện, lãng mạn mộng mơ, giàu hy sinh; dễ lý tưởng hoá đối phương và chịu thiệt vì tình"
];
/* Sao Hoả — động lực, hành động, cơn giận */
const MARS_SIGN=[
"hành động thẳng và dũng cảm, khởi sự tức thì; nóng nảy bùng nhanh nhưng cũng nguội nhanh",
"hành động bền bỉ và kiên định, sức chịu đựng lớn; chậm khởi động, giận âm ỉ nhưng bùng thì dữ",
"năng lượng nhanh và phân tán, hành động bằng lời và trí; hiếu thắng trong tranh luận, thiếu bền",
"hành động theo cảm xúc và bản năng bảo vệ; giận thì rút vào vỏ, công kích gián tiếp khi bị chạm",
"hành động tự tin và phô trương, có phong độ thủ lĩnh; kiêu hãnh, giận bùng kịch tính rồi rộng lượng",
"hành động tỉ mỉ, hiệu quả, có phương pháp; giận bằng phê phán sắc và cằn nhằn hơn là bùng nổ",
"hành động cần cân nhắc và đồng thuận, né xung đột trực diện; giỏi thuyết phục hơn áp đảo",
"hành động chiến lược ngầm, ý chí sắt đá, bền tới cùng; giận sâu, nhớ lâu, không quên món nợ",
"hành động phiêu lưu và bốc đồng, mê chinh phục chân trời; giận bùng thẳng thắn rồi quên ngay",
"hành động kỷ luật và kiên trì vì mục tiêu, tham vọng lạnh; kìm nén cơn giận, bền bỉ đáng gờm",
"hành động vì lý tưởng và theo cách khác người, khó đoán; giận lạnh và xa cách hơn là bùng nổ",
"hành động gián tiếp theo trực giác, né đối đầu; giận theo lối thụ động, dễ tự rút lui hoặc hy sinh"
];
/* Điểm Mọc (Ascendant) — lớp vỏ, ấn tượng đầu, cách tiếp cận đời & vóc dáng */
const ASC_SIGN=[
"toát ra sự mạnh mẽ, nhanh nhẹn, thẳng thắn; tiếp cận cuộc đời như một cuộc chinh phục, lao tới trước rồi tính sau",
"cho cảm giác điềm đạm, vững chãi, đáng tin; tiếp cận đời chậm rãi, thực tế, ưa cái đẹp và sự ổn định bền",
"trẻ trung, linh hoạt, hoạt ngôn; tiếp cận đời bằng sự tò mò, giao tiếp và thích nghi liên tục",
"dịu dàng, hơi e dè lúc đầu, giàu biểu cảm; tiếp cận đời qua cảm xúc và nhu cầu được an toàn, che chở",
"cuốn hút, ấm áp, có phong thái; bước vào đời với sự tự tin toả sáng và mong được ghi nhận",
"gọn gàng, ý tứ, khiêm tốn; tiếp cận đời bằng sự phân tích, hữu ích và chú ý đến từng chi tiết",
"duyên dáng, lịch thiệp, hoà nhã; tiếp cận đời qua các mối quan hệ, sự cân bằng và thẩm mỹ",
"cường độ mạnh, bí ẩn, ánh nhìn sâu; tiếp cận đời một cách kín đáo, cảnh giác và thấu suốt",
"cởi mở, phóng khoáng, lạc quan; tiếp cận đời như một cuộc phiêu lưu đi tìm ý nghĩa",
"nghiêm nghị, chín chắn hơn tuổi, dè dặt; tiếp cận đời có trách nhiệm, tạo cảm giác đáng tin cậy",
"độc đáo, khác lạ, thân thiện mà xa cách; tiếp cận đời theo cách riêng, phá khuôn, hướng tương lai",
"mềm mại, mơ màng, dễ gần; tiếp cận đời bằng trực giác và lòng trắc ẩn, ranh giới bản thân dễ mờ"
];

/* Ý nghĩa các điểm trong bản đồ */
const POINT_ROLE={
sun:"Mặt Trời — CÁI TÔI cốt lõi, ý chí sống, điều bạn đang trở thành",
moon:"Mặt Trăng — THẾ GIỚI NỘI TÂM, nhu cầu cảm xúc, bản năng và phản xạ khi không phòng bị",
asc:"Điểm Mọc — LỚP VỎ, ấn tượng đầu tiên, cách bạn bước vào cuộc đời và cơ thể",
mercury:"Sao Thuỷ — TRÍ ÓC, cách nghĩ, học và giao tiếp",
venus:"Sao Kim — TÌNH YÊU, cách yêu, thứ bạn trân trọng và bị thu hút",
mars:"Sao Hoả — ĐỘNG LỰC, cách hành động, khẳng định mình và biểu lộ cơn giận"
};

/* Góc hợp Mặt Trời – Mặt Trăng */
const SUNMOON_ASPECT=[
[0,8,"Giao hội (Conjunction)","Mặt Trời và Mặt Trăng chập nhau — bạn sinh gần kỳ trăng non. Ý chí và cảm xúc dồn về một hướng: tính cách tập trung, mãnh liệt, làm gì cũng dồn toàn lực. Điểm mù: khó nhìn bản thân một cách khách quan vì lý trí và cảm xúc luôn 'đồng loã' với nhau."],
[60,6,"Lục hợp (Sextile)","Mặt Trời và Mặt Trăng hoà hợp nhẹ — con người ý chí và con người cảm xúc hỗ trợ nhau một cách tự nhiên và dễ chịu. Bạn tương đối cân bằng, biết dùng cả lý trí lẫn trực giác; cần chủ động thì mới khai thác hết tiềm năng này."],
[90,8,"Vuông góc (Square)","Mặt Trời vuông Mặt Trăng — điều bạn MUỐN (ý chí) và điều bạn CẦN (cảm xúc) kéo về hai phía. Có một sự giằng co nội tâm thường trực, đôi khi giữa lý trí và trái tim, hoặc giữa hình mẫu cha và mẹ. Đây là nguồn căng thẳng nhưng cũng là động cơ trưởng thành mạnh nhất: người có góc này thường rất nỗ lực và sâu sắc."],
[120,8,"Tam hợp (Trine)","Mặt Trời tam hợp Mặt Trăng — hoà hợp nội tâm tự nhiên: bạn khá 'ở yên trong da mình', ít mâu thuẫn giữa mình muốn gì và mình cần gì. Đây là món quà của sự bình an nội tại; mặt trái là đôi khi thiếu động lực thay đổi vì mọi thứ đã đủ dễ chịu."],
[180,8,"Đối đỉnh (Opposition)","Mặt Trời đối Mặt Trăng — bạn sinh gần kỳ trăng tròn. Luôn có cảm giác hai nửa giằng co: bản thân và người khác, ý chí và cảm xúc, công việc và gia đình. Bạn nhạy bén nhìn ra cả hai phía của mọi việc; bài học cả đời là học cách cân bằng thay vì bị kéo qua lại giữa hai cực."]
];

/* Nhóm ngũ hành cho tổng hợp cặp Kim–Hoả */
const ELEM_HARMONY=[[0,2],[1,3]]; /* Hỏa-Khí hợp, Đất-Nước hợp */

/* ---------- THẦN SỐ CHUYÊN SÂU ---------- */
/* Nhóm bản chất của số: dùng cho logic hoà hợp giữa các con số cốt lõi */
const NUM_FAMILY={1:"khẳng định",8:"khẳng định",3:"biểu đạt",5:"biểu đạt",2:"quan hệ",6:"quan hệ",9:"quan hệ",4:"cấu trúc",7:"cấu trúc",11:"quan hệ",22:"cấu trúc",33:"quan hệ"};
const FAMILY_DESC={
"khẳng định":"nhóm Ý CHÍ – THÀNH TỰU (1, 8): bản năng dẫn dắt, cạnh tranh, tạo ra kết quả và nắm quyền chủ động",
"biểu đạt":"nhóm BIỂU ĐẠT – TỰ DO (3, 5): bản năng sáng tạo, giao tiếp, trải nghiệm và lan toả",
"quan hệ":"nhóm QUAN HỆ – PHỤNG SỰ (2, 6, 9): bản năng kết nối, chăm sóc, hoà giải và cho đi",
"cấu trúc":"nhóm TRÍ TUỆ – CẤU TRÚC (4, 7): bản năng xây nền, phân tích, kỷ luật và tìm chân lý"
};
/* Ma trận hoà hợp giữa hai nhóm số (chỉ báo mức tương thích nội tâm) */
function familyRelation(a,b){
  if(a===b)return ["đồng điệu","hai lực cùng bản chất — bạn hành động rất nhất quán, ít giằng xé nội tâm; rủi ro là thiếu sự đa dạng để tự cân bằng"];
  var pair=[a,b].sort().join("|");
  var M={
    "cấu trúc|khẳng định":["bổ trợ mạnh","ý chí thành tựu đi cùng nền tảng kỷ luật — một sự kết hợp rất hiệu quả: bạn vừa dám làm vừa xây được cái bền"],
    "biểu đạt|khẳng định":["bổ trợ","tham vọng đi cùng sức biểu đạt — bạn vừa muốn dẫn đầu vừa biết toả sáng và thu hút; cần hướng năng lượng kẻo dàn trải"],
    "khẳng định|quan hệ":["căng – cần dung hoà","một bên muốn dẫn dắt và thắng, một bên muốn kết nối và cho đi — mâu thuẫn giữa 'cái tôi' và 'chúng ta'; khi cân bằng được, bạn thành người lãnh đạo có trái tim"],
    "biểu đạt|cấu trúc":["căng – cần dung hoà","một bên khao khát tự do và phá cách, một bên cần kỷ luật và trật tự — sự giằng co giữa bay bổng và nề nếp; hợp nhất được thì thành người sáng tạo có kỷ luật hiếm có"],
    "biểu đạt|quan hệ":["hài hoà","biểu đạt đi cùng sự quan tâm — bạn kết nối người khác bằng sự ấm áp và sáng tạo; dễ mến, giàu sức lan toả"],
    "cấu trúc|quan hệ":["bổ trợ","chiều sâu trí tuệ đi cùng lòng phụng sự — bạn chăm sóc và xây dựng một cách bền bỉ, đáng tin; đôi khi cần bớt nghiêm để gần người hơn"]
  };
  return M[pair]||["trung tính","hai lực khác bản chất nhưng không xung khắc — cho bạn sự linh hoạt để xoay giữa nhiều vai"];
}
const KARMIC_DEBT={
13:"Nợ nghiệp 13 → 4: tiền kiếp trốn tránh lao động, tìm đường tắt. Bài học đời này là làm việc kiên trì, có tổ chức, không nản khi chưa thấy quả. Vượt qua sẽ có nền tảng vững chắc phi thường.",
14:"Nợ nghiệp 14 → 5: tiền kiếp lạm dụng tự do, buông thả giác quan (ăn chơi, dục vọng). Bài học là điều độ và thích nghi có kỷ luật giữa biến động. Vượt qua sẽ đạt tự do đích thực, không lệ thuộc.",
16:"Nợ nghiệp 16 → 7: tiền kiếp kiêu ngạo, đổ vỡ vì cái tôi trong tình cảm. Bài học là buông bản ngã, khiêm nhường, tái sinh sau những cú sụp đổ 'định mệnh'. Vượt qua sẽ có trực giác và chiều sâu tâm linh hiếm thấy.",
19:"Nợ nghiệp 19 → 1: tiền kiếp lạm dụng quyền lực, ích kỷ, chỉ biết mình. Bài học là tự lực nhưng biết nhận sự giúp đỡ và cho lại; đứng vững mà không đè lên người khác. Vượt qua sẽ thành người lãnh đạo độc lập chân chính."
};
/* Cầu nối (Bridge) — cách hoá giải khoảng cách giữa hai con số cốt lõi */
const BRIDGE_DESC={
0:"trùng nhau — hai mặt này của bạn hoàn toàn thống nhất, không cần bắc cầu; sức mạnh là sự nhất quán",
1:"cách nhau rất gần — chỉ cần điều chỉnh nhỏ là hai mặt hoà làm một",
2:"khoảng cách vừa — hai mặt hơi lệch pha; ý thức một chút là dung hoà được",
3:"khoảng cách đáng kể — hai mặt kéo về hai hướng khác nhau, cần chủ động bắc cầu",
4:"khoảng cách lớn — hai mặt của bạn khá mâu thuẫn, đây là một trong những căng thẳng nội tâm chính cần hoà giải cả đời"
};
const PERSONAL_MONTH_HINT={
1:"tháng khởi sự, chủ động đề xuất",2:"tháng hợp tác, kiên nhẫn, chăm quan hệ",3:"tháng giao tiếp, sáng tạo, mở rộng",
4:"tháng làm việc chăm, củng cố nền",5:"tháng thay đổi, di chuyển, linh hoạt",6:"tháng gia đình, trách nhiệm, chăm sóc",
7:"tháng nghỉ ngơi, học hỏi, hướng nội",8:"tháng tiền bạc, quyết đoán kinh doanh",9:"tháng hoàn tất, buông bỏ, dọn dẹp"
};
