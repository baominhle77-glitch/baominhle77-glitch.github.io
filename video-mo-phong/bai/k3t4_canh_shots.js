import { veTranhRieng } from "./k3t4_shot_rieng.js";
// K3t4 Quyết 016. Mỗi HS.shots = một cảnh giải nghĩa bằng vật/hành động riêng.
// HS latest @f9c2ade2: 8 beats refined per KĐ 016; 126 shots/34 beats.
// t0/t1: chiếu tuyến tính *trong từng beat* sang timestamp giọng GĐ đã khóa 592.008 s;
// không thay đổi SRT / MP3 / hộp chữ HS. hs_t0/hs_t1 giữ nguyên để truy vết.
export const SHOTS = [{"id":"h1","si":0,"loai":"mo_hinh_3d","chu_the":"tia laser","khop":["lunar","laser"],"hinh":"Kính thiên văn trạm mặt đất bắn tia laser xanh lục mảnh lên Mặt Trăng lơ lửng trên nền sao, máy quay đẩy chậm theo tia","vat_chinh_pct":45,"t0":0.1,"t1":4.0662,"hs_t0":0.1,"hs_t1":3.3},{"id":"h1","si":1,"loai":"so_do_dong","chu_the":"chấm đo","khop":["normal points","full-rate"],"hinh":"Hàng chục chấm sáng thời gian bay về rải trên trục ngang, rồi gom dần thành một điểm vàng duy nhất có nhãn normal point","vat_chinh_pct":50,"t0":4.0662,"t1":8.962,"hs_t0":3.3,"hs_t1":7.25},{"id":"h2","si":0,"loai":"phong_to_chi_tiet","chu_the":"đầu thu","khop":["station","returning","light"],"hinh":"Cận cảnh đầu thu của trạm: xung sáng quay về chạm cảm biến, đồng hồ đếm nano giây nhảy số mỗi lần chạm","vat_chinh_pct":55,"t0":8.962,"t1":12.252,"hs_t0":7.25,"hs_t1":10.54},{"id":"h2","si":1,"loai":"so_sanh_doi_chieu","chu_the":"tủ lưu trữ","khop":["archive","summary"],"hinh":"Bên trái chồng phiếu đo dày cao dần, bên phải tủ lưu trữ chỉ nhận một tấm thẻ tóm tắt, mũi tên nối hai bên kèm dấu hỏi lớn","vat_chinh_pct":45,"t0":12.252,"t1":16.762,"hs_t0":10.54,"hs_t1":15.05},{"id":"h3","si":0,"loai":"vat_the_minh_hoa","chu_the":"sổ cái","khop":["ledger","columns"],"hinh":"Cuốn sổ cái mở ra giữa màn, bốn cột lần lượt hiện tiêu đề measured dated counted assumed với biểu tượng thước, lịch, bộ đếm, dấu hỏi","vat_chinh_pct":50,"t0":16.762,"t1":21.682,"hs_t0":15.05,"hs_t1":19.97},{"id":"h3","si":1,"loai":"so_sanh_doi_chieu","chu_the":"dòng báo cáo","khop":["reported","replace"],"hinh":"Một dòng báo cáo đơn lẻ trượt vào định che cả bốn cột nhưng bị bật ra, bốn cột vẫn sáng nguyên","vat_chinh_pct":40,"t0":21.682,"t1":25.587,"hs_t0":19.97,"hs_t1":23.875},{"id":"h4","si":0,"loai":"so_do_dong","chu_the":"phễu lọc","khop":["summary","accepted observations"],"hinh":"Phễu lọc: các chấm đo rơi xuống, chấm đỏ bị loại ra ngoài, chấm xanh được chấp nhận chảy xuống thành một ô tóm tắt","vat_chinh_pct":50,"t0":25.587,"t1":29.992,"hs_t0":23.875,"hs_t1":28.28},{"id":"h4","si":1,"loai":"con_so_lon","chu_the":"bảng quy tắc","khop":["processing rules","invent measurements"],"hinh":"Bảng quy tắc xử lý đóng dấu bên phải, một con số giả bay vào bị gạch chéo đỏ kèm chữ lớn KHÔNG BỊA SỐ","vat_chinh_pct":40,"t0":29.992,"t1":34.737,"hs_t0":28.28,"hs_t1":33.025},{"id":"t1","si":0,"loai":"mat_cat_lop","chu_the":"trạm đo","khop":["station","detector"],"hinh":"Mặt cắt trạm đo: kính thiên văn, đường quang đi xuống tới khối cảm biến được tô sáng, nhãn detector chỉ vào","vat_chinh_pct":55,"t0":34.737,"t1":38.2222,"hs_t0":33.025,"hs_t1":36.51},{"id":"t1","si":1,"loai":"quy_dao_chuyen_dong","chu_the":"xung laser","khop":["laser pulse","reflector"],"hinh":"Toàn cảnh Trái Đất và Mặt Trăng: xung laser chạy dọc đường thẳng từ trạm tới tấm phản xạ trên bề mặt Mặt Trăng","vat_chinh_pct":45,"t0":38.2222,"t1":42.8224,"hs_t0":36.51,"hs_t1":41.11},{"id":"t1","si":2,"loai":"phong_to_chi_tiet","chu_the":"đồng hồ trạm","khop":["returning signal","arrival timing"],"hinh":"Phóng to đồng hồ trạm: tín hiệu quay về cực yếu, vạch thời gian đến được đánh dấu bằng kim đỏ trên thang nano giây","vat_chinh_pct":50,"t0":42.8224,"t1":48.1327,"hs_t0":41.11,"hs_t1":46.42},{"id":"t1","si":3,"loai":"bieu_do","chu_the":"đồ thị","khop":["secular orbital trend"],"hinh":"Đồ thị khoảng cách theo năm chỉ có đúng một chấm, đường xu hướng dài vẽ thử từ chấm đó bị gạch bỏ, chữ một lần đo chưa đủ","vat_chinh_pct":50,"t0":48.1327,"t1":52.75,"hs_t0":46.42,"hs_t1":51.037},{"id":"a1","si":0,"loai":"so_sanh_doi_chieu","chu_the":"hai cột","khop":["full-rate measurements","normal points"],"hinh":"Hai cột song song: trái là dải dày đặc từng xung riêng lẻ, phải là vài điểm tóm tắt to, nhãn tên chuẩn ILRS trên đầu mỗi cột","vat_chinh_pct":50,"t0":52.75,"t1":57.4546,"hs_t0":51.037,"hs_t1":55.42},{"id":"a1","si":1,"loai":"truc_thoi_gian","chu_the":"khung ngăn","khop":["interval","lunar targets"],"hinh":"Trục thời gian có các khung ngăn chiều dài thay đổi trượt dọc, mỗi khung gom các chấm đo bên trong thành một điểm, nhãn mục tiêu Mặt Trăng","vat_chinh_pct":45,"t0":57.4546,"t1":64.4745,"hs_t0":55.42,"hs_t1":61.96},{"id":"a1","si":2,"loai":"anh_that","chu_the":"trang định nghĩa","khop":["variable","product definition"],"hinh":"Trang định nghĩa sản phẩm ILRS hiện như giấy tờ, dòng chữ variable được khoanh đỏ, đóng dấu ĐỊNH NGHĨA chứ không phải số đo","vat_chinh_pct":45,"t0":64.4745,"t1":70.4639,"hs_t0":61.96,"hs_t1":67.54},{"id":"a1","si":3,"loai":"anh_that","chu_the":"ảnh Apollo","khop":["Apollo","laser reflector"],"hinh":"Ảnh thật tấm phản xạ laser Apollo 14 trên nền đất xám Mặt Trăng, ba ô trống đếm, thời điểm, sai số hiện dấu gạch ngang","vat_chinh_pct":55,"t0":70.4639,"t1":75.425,"hs_t0":67.54,"hs_t1":72.162},{"id":"a2","si":0,"loai":"truc_thoi_gian","chu_the":"nhãn epoch","khop":["observation","epoch"],"hinh":"Mỗi chấm đo được gắn một nhãn ngày giờ treo bên dưới, trục thời gian kéo dài sang phải với các nhãn epoch nối tiếp","vat_chinh_pct":45,"t0":75.425,"t1":79.423,"hs_t0":72.162,"hs_t1":76.16},{"id":"a2","si":1,"loai":"quy_dao_chuyen_dong","chu_the":"Trái Đất Mặt Trăng","khop":["Earth rotates","Moon travels","geometry"],"hinh":"Trái Đất tự quay, Mặt Trăng chạy trên quỹ đạo, đường nối trạm và tấm phản xạ đổi góc và độ dài liên tục theo vị trí","vat_chinh_pct":50,"t0":79.423,"t1":84.483,"hs_t0":76.16,"hs_t1":81.22},{"id":"a2","si":2,"loai":"so_do_dong","chu_the":"hộp nén","khop":["dates","removed","collected"],"hinh":"Các chấm đo bị gom vào một chiếc hộp nén, nhãn ngày giờ của từng chấm định rơi ra nhưng được kẹp lại vào hộp bằng ghim đỏ","vat_chinh_pct":45,"t0":84.483,"t1":89.343,"hs_t0":81.22,"hs_t1":86.08},{"id":"a2","si":3,"loai":"so_sanh_doi_chieu","chu_the":"hai hộp","khop":["compact product","provenance","comparisons"],"hinh":"Hai hộp sản phẩm gọn đặt cạnh nhau, mỗi hộp kéo theo sợi dây nguồn gốc về các chấm đo có ngày, dấu bằng giữa hai hộp sáng lên","vat_chinh_pct":45,"t0":89.343,"t1":94.625,"hs_t0":86.08,"hs_t1":91.362},{"id":"a3","si":0,"loai":"vat_the_minh_hoa","chu_the":"bốn xung giả định","khop":["hypothetical"],"hinh":"Trang sổ trắng đặt giữa khung, đúng bốn dấu xung rời xuất hiện thành một hàng, chưa có số đo.","vat_chinh_pct":44,"t0":94.625,"t1":99.771,"hs_t0":91.362,"hs_t1":96.508},{"id":"a3","si":1,"loai":"phong_to_chi_tiet","chu_the":"dấu kiểm định bốn vạch minh họa","khop":["assumed"],"hinh":"Cận cảnh đúng bốn vạch giả định vừa vẽ, con dấu đỏ NOT NASA DATA hạ xuống đóng chéo qua cả bốn vạch; tờ sổ không biến thành hồ sơ NASA.","vat_chinh_pct":50,"t0":99.771,"t1":104.913,"hs_t0":96.508,"hs_t1":101.65},{"id":"a3","si":2,"loai":"so_do_dong","chu_the":"bốn xung vào máy đếm không hiện trị số","khop":["nanoseconds"],"hinh":"Bốn xung sáng nối tiếp chạy trên dây dẫn vào đầu nhận của máy đếm, đèn báo mỗi xung nháy một lần nhưng màn số nanosecond và tên trạm không xuất hiện.","vat_chinh_pct":47,"t0":104.913,"t1":110.601,"hs_t0":101.65,"hs_t1":107.338},{"id":"a3","si":3,"loai":"truc_thoi_gian","chu_the":"dãy bốn sự kiện lớp học bị cấm nhận là dữ liệu lịch sử","khop":["observations"],"hinh":"Bốn sự kiện sáng được xếp theo thứ tự trên trục CLASSROOM EXAMPLE; nhãn HISTORICAL DATA định trượt xuống rồi bị một nét gạch chéo đỏ chặn lại.","vat_chinh_pct":53,"t0":110.601,"t1":115.5,"hs_t0":107.338,"hs_t1":112.237},{"id":"a4","si":0,"loai":"so_do_dong","chu_the":"cổng kiểm chất lượng tách nhánh quan trắc","khop":["quality"],"hinh":"Các thẻ quan trắc thật đi vào cổng QUALITY TEST, thanh chắn nâng hoặc hạ theo thẻ quy tắc, mũi tên chia sang lối đạt điều kiện và lối cần kiểm lại; chưa xác định thẻ nào đạt.","vat_chinh_pct":44,"t0":115.5,"t1":119.086,"hs_t0":112.237,"hs_t1":115.823},{"id":"a4","si":1,"loai":"mat_cat_lop","chu_the":"tia laser qua khí quyển cần hiệu chỉnh có nguồn","khop":["correction"],"hinh":"Mặt cắt trạm và tầng khí quyển cho thấy tia sáng xuyên hai môi trường, đường tia đi qua bước CORRECTION được gắn cờ CẦN CHỨNG CỨ, không hiển thị bất kỳ hệ số tự đặt.","vat_chinh_pct":50,"t0":119.086,"t1":124.288,"hs_t0":115.823,"hs_t1":121.025},{"id":"a4","si":2,"loai":"so_sanh_doi_chieu","chu_the":"cửa nhận hoặc loại chặn thẻ chưa có tiêu chí","khop":["rejected"],"hinh":"Một thẻ sự kiện thử rẽ vào cửa ACCEPTED rồi sang REJECTED, cả hai thanh chắn đóng sập khi tấm quy tắc gốc chưa tới; dấu dừng xuất hiện trước bước quyết định.","vat_chinh_pct":47,"t0":124.288,"t1":128.788,"hs_t0":121.025,"hs_t1":125.525},{"id":"a4","si":3,"loai":"anh_that","chu_the":"trang đặc tả lưu trữ ILRS","khop":["specifications"],"hinh":"Mục lục tài liệu ILRS hiện cùng thẻ dẫn tới thông số xử lý gốc, đánh dấu vị trí cần tra quy tắc thật.","vat_chinh_pct":53,"t0":128.788,"t1":133.025,"hs_t0":125.525,"hs_t1":129.762},{"id":"a5","si":0,"loai":"anh_that","chu_the":"danh mục sản phẩm ILRS","khop":["formats"],"hinh":"Trang danh mục ILRS có nhiều dạng bản ghi, thẻ định dạng được phóng to trên bàn để phân biệt các mục.","vat_chinh_pct":44,"t0":133.025,"t1":136.908,"hs_t0":129.762,"hs_t1":133.645},{"id":"a5","si":1,"loai":"so_sanh_doi_chieu","chu_the":"hai kiểu ghi quan trắc","khop":["represented"],"hinh":"Hai tờ hồ sơ minh họa cùng dữ liệu bằng hàng chấm và bảng cột, một tên định dạng riêng hiện trên mỗi tờ.","vat_chinh_pct":50,"t0":136.908,"t1":142.372,"hs_t0":133.645,"hs_t1":139.109},{"id":"a5","si":2,"loai":"so_do_dong","chu_the":"đường truy nguyên dữ liệu","khop":["provenance"],"hinh":"Dây nguồn đi từ trạm phát qua bộ phản xạ tới tờ lịch quan trắc rồi khối xử lý, từng mắt xích được vẽ rõ.","vat_chinh_pct":47,"t0":142.372,"t1":147.917,"hs_t0":139.109,"hs_t1":144.654},{"id":"a5","si":3,"loai":"vat_the_minh_hoa","chu_the":"thẻ số mất thông tin","khop":["orphan"],"hinh":"Một thẻ số lẻ không có dây nguồn nằm ngoài các ô trạm, mục tiêu, thời gian và quy trình đều còn trống.","vat_chinh_pct":53,"t0":147.917,"t1":153.725,"hs_t0":144.654,"hs_t1":150.462},{"id":"a6","si":0,"loai":"vat_the_minh_hoa","chu_the":"sổ cái bốn cột","khop":["ledger"],"hinh":"Cuốn sổ mở ở trung tâm có bốn cột cùng biểu tượng đồng hồ, lịch, bàn tính và bánh răng giảm dữ liệu.","vat_chinh_pct":44,"t0":153.725,"t1":158.3418,"hs_t0":150.462,"hs_t1":155.079},{"id":"a6","si":1,"loai":"phong_to_chi_tiet","chu_the":"đồng hồ thu ánh sáng","khop":["timing"],"hinh":"Cận cảnh cảm biến nhận xung và chốt mốc đồng hồ, tờ ngày giờ được kẹp vào bên cạnh để phân biệt hai đại lượng.","vat_chinh_pct":50,"t0":158.3418,"t1":162.9585,"hs_t0":155.079,"hs_t1":159.696},{"id":"a6","si":2,"loai":"so_sanh_doi_chieu","chu_the":"số được đếm và giả định","khop":["assumed"],"hinh":"Bên trái ngăn đếm bản ghi đã nhận, bên phải tờ phương pháp giảm dữ liệu, không đặt con số chung cho hai ô.","vat_chinh_pct":47,"t0":162.9585,"t1":168.5793,"hs_t0":159.696,"hs_t1":165.317},{"id":"a6","si":3,"loai":"so_do_dong","chu_the":"bốn tuyến thông tin tách biệt","khop":["substitute"],"hinh":"Bốn tuyến nguồn chạy vào bốn cột sổ, một thẻ định chạy nhầm cột dừng trước cánh cửa phân loại.","vat_chinh_pct":53,"t0":168.5793,"t1":173.887,"hs_t0":165.317,"hs_t1":170.625},{"id":"t2","si":0,"loai":"mat_cat_lop","chu_the":"phần có và không trong tóm tắt","khop":["summary"],"hinh":"Tờ báo cáo cắt thành vùng thông tin giữ lại và vùng không có, mỗi vùng là ngăn riêng trong tập dữ liệu.","vat_chinh_pct":44,"t0":173.887,"t1":178.1242,"hs_t0":170.625,"hs_t1":174.862},{"id":"t2","si":1,"loai":"so_do_dong","chu_the":"dây chuyền xử lý từ xung","khop":["processed"],"hinh":"Hàng dấu xung thô đi vào hộp giảm dữ liệu và biến thành thẻ sản phẩm, không xuất hiện thêm xung vật lý nào.","vat_chinh_pct":50,"t0":178.1242,"t1":182.9565,"hs_t0":174.862,"hs_t1":179.694},{"id":"t2","si":2,"loai":"mo_hinh_3d","chu_the":"photon và cảm biến thực","khop":["photon"],"hinh":"Một photon sáng bay chạm cảm biến trạm trong mô hình ba chiều, tấm thẻ cơ sở dữ liệu đứng ở không gian khác.","vat_chinh_pct":47,"t0":182.9565,"t1":187.3928,"hs_t0":179.694,"hs_t1":184.13},{"id":"t2","si":3,"loai":"so_sanh_doi_chieu","chu_the":"dữ liệu máy và hồ sơ","khop":["database"],"hinh":"Bên trái là ánh sáng tới ống thu, bên phải là bản ghi số trong kho lưu trữ, hai hình có nhãn khác vai trò.","vat_chinh_pct":53,"t0":187.3928,"t1":191.275,"hs_t0":184.13,"hs_t1":188.012},{"id":"b1","si":0,"loai":"so_do_dong","chu_the":"bốn ô dữ liệu giả định","khop":["event"],"hinh":"Bốn thẻ sự kiện rỗng đi qua sơ đồ mũi tên vào một hộp tóm tắt, chữ ví dụ hiện trên toàn mô hình.","vat_chinh_pct":44,"t0":191.275,"t1":196.075,"hs_t0":188.012,"hs_t1":192.812},{"id":"b1","si":1,"loai":"phong_to_chi_tiet","chu_the":"con dấu cảnh báo quy trình lớp học","khop":["illustrative"],"hinh":"Máy quay áp sát đúng sơ đồ bốn sự kiện vừa hợp thành một hộp, con dấu dài CLASSROOM FLOW — NOT OFFICIAL ILRS ALGORITHM đóng chéo lên đường xử lý đang chạy.","vat_chinh_pct":50,"t0":196.075,"t1":201.11,"hs_t0":192.812,"hs_t1":197.847},{"id":"b1","si":2,"loai":"mat_cat_lop","chu_the":"hai cửa điều kiện","khop":["conditional"],"hinh":"Mặt cắt phễu có cửa chọn sự kiện rồi cửa giảm dữ liệu, ô kết quả nằm dưới cả hai bước.","vat_chinh_pct":47,"t0":201.11,"t1":204.918,"hs_t0":197.847,"hs_t1":201.655},{"id":"b1","si":3,"loai":"so_sanh_doi_chieu","chu_the":"nhánh điều kiện đạt và chưa đạt","khop":["satisfied"],"hinh":"Hai nhánh xử lý minh họa: nhánh đã thỏa quy tắc tới hộp sản phẩm, nhánh chưa thỏa giữ nguyên ô kết quả rỗng.","vat_chinh_pct":53,"t0":204.918,"t1":210.4,"hs_t0":201.655,"hs_t1":207.137},{"id":"b2","si":0,"loai":"bieu_do","chu_the":"đường trung bình giả định","khop":["averaging"],"hinh":"Bốn chấm rải rác và đường trung bình số học hiện trên biểu đồ, dấu hỏi cảnh báo đường này chưa là chuẩn ILRS.","vat_chinh_pct":44,"t0":210.4,"t1":214.813,"hs_t0":207.137,"hs_t1":211.55},{"id":"b2","si":1,"loai":"phong_to_chi_tiet","chu_the":"thẻ chất lượng quan trắc","khop":["quality"],"hinh":"Hai thẻ điểm đo phóng lớn có trường kiểm tra chất lượng khác nhau, chưa gán nhãn tốt xấu khi thiếu tiêu chuẩn.","vat_chinh_pct":50,"t0":214.813,"t1":218.746,"hs_t0":211.55,"hs_t1":215.483},{"id":"b2","si":2,"loai":"mat_cat_lop","chu_the":"lớp hiệu chỉnh số liệu","khop":["corrections"],"hinh":"Bảng quan trắc tách lớp đo thô và lớp hiệu chỉnh, ô thông số nguồn ở lớp dưới vẫn để trống.","vat_chinh_pct":47,"t0":218.746,"t1":222.315,"hs_t0":215.483,"hs_t1":219.052},{"id":"b2","si":3,"loai":"so_sanh_doi_chieu","chu_the":"bình quân và hồ sơ hợp lệ","khop":["certify"],"hinh":"Tờ tính bình quân lớp học đặt cạnh một bản ghi ILRS có chuẩn, cửa xác nhận ở giữa chưa mở.","vat_chinh_pct":53,"t0":222.315,"t1":227.344,"hs_t0":219.052,"hs_t1":224.081},{"id":"b2","si":4,"loai":"anh_that","chu_the":"trang giải thích bất định và quy tắc","khop":["documentation"],"hinh":"Mục lục tài liệu nguồn có hàng quy ước xử lý và hàng định nghĩa bất định, kính lúp chỉ chính hai mục cần tra.","vat_chinh_pct":46,"t0":227.344,"t1":232.225,"hs_t0":224.081,"hs_t1":228.962},{"id":"b3","si":0,"loai":"mo_hinh_3d","chu_the":"vỏ khí quyển quanh Trái Đất","khop":["atmosphere"],"hinh":"Quả địa cầu ba chiều có tầng khí quyển bán trong suốt, tia laser từ trạm đi qua lớp không khí ra không gian.","vat_chinh_pct":44,"t0":232.225,"t1":236.344,"hs_t0":228.962,"hs_t1":233.081},{"id":"b3","si":1,"loai":"quy_dao_chuyen_dong","chu_the":"tia sáng hai chiều","khop":["travel"],"hinh":"Mô hình Mặt Trăng và trạm quan sát cho thấy một xung bay tới gương rồi quay về trên cùng tuyến truyền.","vat_chinh_pct":50,"t0":236.344,"t1":241.356,"hs_t0":233.081,"hs_t1":238.093},{"id":"b3","si":2,"loai":"mat_cat_lop","chu_the":"khí quyển và căn chỉnh trạm","khop":["calibration"],"hinh":"Mặt cắt tách vùng ảnh hưởng khí quyển khỏi bộ căn chỉnh trạm, mỗi khối có ô hệ số để trống.","vat_chinh_pct":47,"t0":241.356,"t1":246.166,"hs_t0":238.093,"hs_t1":242.903},{"id":"b3","si":3,"loai":"so_do_dong","chu_the":"hai bước hiệu chỉnh từ khí quyển tới trạm","khop":["documentation"],"hinh":"Tia laser đi xuyên lớp khí quyển rồi vào bộ hiệu chuẩn trạm, hai mũi tên tách rõ tới bước xử lý khí quyển và bước calibration; mỗi bước nhận biển YÊU CẦU TÀI LIỆU NGUỒN, không có trị số ước đoán.","vat_chinh_pct":53,"t0":246.166,"t1":251.975,"hs_t0":242.903,"hs_t1":248.712},{"id":"b4","si":0,"loai":"truc_thoi_gian","chu_the":"hai mốc dữ liệu cách xa","khop":["epochs"],"hinh":"Hai thẻ quan trắc nằm tại hai ngày riêng trên một trục, chưa có đường nối suy tốc độ trực tiếp giữa chúng.","vat_chinh_pct":44,"t0":251.975,"t1":257.0046,"hs_t0":248.712,"hs_t1":253.784},{"id":"b4","si":1,"loai":"bieu_do","chu_the":"điểm dữ liệu và tốc độ Mặt Trăng","khop":["receding"],"hinh":"Hai chấm rời trên trục khoảng cách và Mặt Trăng bên cạnh, dấu hỏi đặt ở chỗ định vẽ đường xu thế.","vat_chinh_pct":50,"t0":257.0046,"t1":262.0481,"hs_t0":253.784,"hs_t1":258.87},{"id":"b4","si":2,"loai":"quy_dao_chuyen_dong","chu_the":"vị trí trạm và quỹ đạo thay đổi","khop":["geometry"],"hinh":"Trái Đất quay mang kính quan sát tới vị trí mới, Mặt Trăng đi trên quỹ đạo làm hai tia đo đổi góc.","vat_chinh_pct":47,"t0":262.0481,"t1":268.107,"hs_t0":258.87,"hs_t1":264.98},{"id":"b4","si":3,"loai":"so_do_dong","chu_the":"hồ sơ có ngày tới mô hình","khop":["model"],"hinh":"Nhiều tệp gắn ngày đi vào một mô hình động lực học, ô tham số quỹ đạo xuất hiện sau bước xử lý chứ không trước.","vat_chinh_pct":53,"t0":268.107,"t1":272.375,"hs_t0":264.98,"hs_t1":269.284},{"id":"b5","si":0,"loai":"con_so_lon","chu_the":"tham số dài hạn đã công bố","khop":["published"],"hinh":"Bảng số 38,30 milimét mỗi năm nằm trên thẻ kết quả khớp quỹ đạo, tách xa các điểm đo riêng.","vat_chinh_pct":44,"t0":272.524,"t1":276.931,"hs_t0":269.284,"hs_t1":273.691},{"id":"b5","si":1,"loai":"so_sanh_doi_chieu","chu_the":"mm mỗi năm và normal point","khop":["normal"],"hinh":"Thẻ đơn vị mm mỗi năm trong nghiên cứu nằm trái, tập normal point bên phải có ô giá trị không dùng chung đơn vị.","vat_chinh_pct":50,"t0":276.931,"t1":280.949,"hs_t0":273.691,"hs_t1":277.709},{"id":"b5","si":2,"loai":"anh_that","chu_the":"thẻ bài nghiên cứu Williams Boggs","khop":["Williams"],"hinh":"Tờ nghiên cứu với tên Williams và Boggs cùng DOI đặt trên giá tài liệu, vùng tham số công bố được đánh dấu.","vat_chinh_pct":47,"t0":280.949,"t1":285.915,"hs_t0":277.709,"hs_t1":282.675},{"id":"b5","si":3,"loai":"vat_the_minh_hoa","chu_the":"hai hộp phân biệt đại lượng","khop":["rate"],"hinh":"Hai hộp mang nhãn kết quả mô hình và thời gian xung, đơn vị tốc độ chỉ được giữ trong hộp thứ nhất.","vat_chinh_pct":53,"t0":285.915,"t1":289.436,"hs_t0":282.675,"hs_t1":286.196},{"id":"b6","si":0,"loai":"phong_to_chi_tiet","chu_the":"ký hiệu bất định của tham số","khop":["uncertainty"],"hinh":"Ký hiệu cộng trừ và đơn vị mỗi năm hiện lớn cạnh tốc độ mô hình, đường dẫn tới đúng loại thông số nghiên cứu.","vat_chinh_pct":44,"t0":289.436,"t1":293.731,"hs_t0":286.196,"hs_t1":290.491},{"id":"b6","si":1,"loai":"so_sanh_doi_chieu","chu_the":"ba đối tượng thống kê khác","khop":["error"],"hinh":"Ba ô biểu tượng xung đơn, normal point và tham số dài hạn, đường nối ngăn sao chép sai số giữa các ô.","vat_chinh_pct":50,"t0":293.731,"t1":298.649,"hs_t0":290.491,"hs_t1":295.409},{"id":"b6","si":2,"loai":"vat_the_minh_hoa","chu_the":"hai tập hồ sơ khác mục đích","khop":["research"],"hinh":"Một tập hồ sơ phòng đo đứng cạnh bản báo cáo khoa học, mỗi tập mang màu nhãn riêng để phân biệt mục đích.","vat_chinh_pct":47,"t0":298.649,"t1":302.158,"hs_t0":295.409,"hs_t1":298.918},{"id":"b6","si":3,"loai":"bieu_do","chu_the":"hai hệ đơn vị không thể so trực tiếp","khop":["definitions"],"hinh":"Hai trục đồ thị mm mỗi năm và thời gian về đặt cạnh nhau, dấu không cùng định nghĩa nằm tại giao điểm.","vat_chinh_pct":53,"t0":302.158,"t1":307.161,"hs_t0":298.918,"hs_t1":303.921},{"id":"b7","si":0,"loai":"so_do_dong","chu_the":"tuyến từ xung sang dữ liệu xử lý","khop":["reduced"],"hinh":"Dòng xung riêng đi vào khối giảm dữ liệu rồi tới một tập hồ sơ, mũi tên tiếp nối tới bản nghiên cứu có nguồn.","vat_chinh_pct":44,"t0":307.161,"t1":311.929,"hs_t0":303.921,"hs_t1":308.689},{"id":"b7","si":1,"loai":"so_sanh_doi_chieu","chu_the":"một xung và cả hệ Trái Đất Mặt Trăng","khop":["proof"],"hinh":"Một photon lẻ đối diện cả chuỗi quan trắc nhiều ngày, dấu không đủ bằng chứng đặt ở đường suy luận giữa.","vat_chinh_pct":50,"t0":311.929,"t1":316.26,"hs_t0":308.689,"hs_t1":313.02},{"id":"b7","si":2,"loai":"truc_thoi_gian","chu_the":"đường ngày quan trắc","khop":["timing"],"hinh":"Nhiều dấu đo có thẻ epoch riêng sắp dọc trục ngày, mỗi dấu nối tới bản ghi thô của chính nó.","vat_chinh_pct":47,"t0":316.26,"t1":321.406,"hs_t0":313.02,"hs_t1":318.166},{"id":"b7","si":3,"loai":"mo_hinh_3d","chu_the":"mô hình động lực quỹ đạo","khop":["dynamical"],"hinh":"Mô hình ba chiều Trái Đất và Mặt Trăng có nhiều vị trí theo thời gian, hồ sơ giảm dữ liệu đưa vào hộp tính tham số.","vat_chinh_pct":53,"t0":321.406,"t1":325.336,"hs_t0":318.166,"hs_t1":322.096},{"id":"t3","si":0,"loai":"so_sanh_doi_chieu","chu_the":"ba loại nguồn độc lập","khop":["sources"],"hinh":"Ba giá trưng bày riêng cho ảnh thiết bị NASA, bài phân tích quỹ đạo và tài liệu ILRS, mỗi loại có dấu nguồn khác.","vat_chinh_pct":44,"t0":325.336,"t1":331.322,"hs_t0":322.096,"hs_t1":328.082},{"id":"t3","si":1,"loai":"anh_that","chu_the":"ảnh NASA Apollo 14 LR3","khop":["retroreflector"],"hinh":"Ảnh thật Apollo 14 LR3 có mã AS14-67-9386 cạnh sơ đồ tia phản xạ, không chèn số liệu thô vào ảnh.","vat_chinh_pct":50,"t0":331.322,"t1":335.978,"hs_t0":328.082,"hs_t1":332.738},{"id":"t3","si":2,"loai":"bieu_do","chu_the":"kết quả nghiên cứu quỹ đạo","khop":["rate"],"hinh":"Tờ phân tích tốc độ dài hạn có vùng bất định và tên tham số, tách khỏi các thẻ xung đo đơn lẻ.","vat_chinh_pct":47,"t0":335.978,"t1":341.281,"hs_t0":332.738,"hs_t1":338.041},{"id":"t3","si":3,"loai":"vat_the_minh_hoa","chu_the":"hồ sơ xử lý normal point cần tra","khop":["processing"],"hinh":"Một tài liệu giảm dữ liệu còn chưa được mở được đặt giữa hai nguồn kia, ô quy trình đang chờ kiểm.","vat_chinh_pct":53,"t0":341.281,"t1":345.361,"hs_t0":338.041,"hs_t1":342.121},{"id":"c1","si":0,"loai":"anh_that","chu_the":"ảnh thiết bị phản xạ LR3","khop":["photograph"],"hinh":"Ảnh cận cảnh gương phản xạ Apollo 14 trên đất xám cho thấy cấu tạo phần cứng, bên cạnh bảng thống kê để trắng.","vat_chinh_pct":44,"t0":345.361,"t1":350.082,"hs_t0":342.121,"hs_t1":346.842},{"id":"c1","si":1,"loai":"mat_cat_lop","chu_the":"cột trọng số quan trắc","khop":["weighting"],"hinh":"Mặt cắt tệp quan trắc có cột trọng số trống, tấm ảnh phần cứng ở trên không có thông tin để điền cột.","vat_chinh_pct":50,"t0":350.082,"t1":355.06,"hs_t0":346.842,"hs_t1":351.82},{"id":"c1","si":2,"loai":"so_sanh_doi_chieu","chu_the":"bài báo và danh sách xung","khop":["statistically"],"hinh":"Một bên là tóm tắt bài nghiên cứu có ô tham số suy ra, bên kia danh sách xung gốc chưa truy xuất.","vat_chinh_pct":47,"t0":355.06,"t1":360.221,"hs_t0":351.82,"hs_t1":356.981},{"id":"c1","si":3,"loai":"so_do_dong","chu_the":"chuỗi suy luận tách riêng","khop":["record"],"hinh":"Hai tuyến chứng cứ từ ảnh thiết bị và bài nghiên cứu đi tới hai kết luận khác nhau, không đi tắt vào bản ghi NP.","vat_chinh_pct":53,"t0":360.221,"t1":365.211,"hs_t0":356.981,"hs_t1":361.971},{"id":"c2","si":0,"loai":"anh_that","chu_the":"danh mục truy cập kho ILRS","khop":["archive"],"hinh":"Ảnh trang danh mục ILRS chỉ lối mở các tệp khoa học có tên nguồn, dòng sản phẩm được khoanh rõ.","vat_chinh_pct":44,"t0":365.211,"t1":369.966,"hs_t0":361.971,"hs_t1":366.726},{"id":"c2","si":1,"loai":"so_sanh_doi_chieu","chu_the":"hai quy ước báo cáo","khop":["conventions"],"hinh":"Hai thẻ định dạng dữ liệu nằm cạnh nhau, tiêu đề từng cột được so sánh trước khi dùng các giá trị.","vat_chinh_pct":50,"t0":369.966,"t1":374.786,"hs_t0":366.726,"hs_t1":371.546},{"id":"c2","si":2,"loai":"bieu_do","chu_the":"dải bất định và điểm được chọn","khop":["uncertainty"],"hinh":"Một nhóm chấm nằm trong dải bất định, một số điểm mang biểu tượng chờ kiểm chất lượng thay vì bị xóa tùy tiện.","vat_chinh_pct":47,"t0":374.786,"t1":380.145,"hs_t0":371.546,"hs_t1":376.905},{"id":"c2","si":3,"loai":"phong_to_chi_tiet","chu_the":"câu hỏi khoa học và chọn dữ liệu","khop":["question"],"hinh":"Kính lúp soi thẻ câu hỏi nghiên cứu vừa thay đổi, mũi tên đi tới bước xem lại danh sách dữ liệu được chọn.","vat_chinh_pct":53,"t0":380.145,"t1":384.099,"hs_t0":376.905,"hs_t1":380.859},{"id":"c3","si":0,"loai":"con_so_lon","chu_the":"thẻ định nghĩa normal point","khop":["normal"],"hinh":"Thẻ NORMAL POINT đặt cạnh giải thích thuật ngữ kỹ thuật, dấu hỏi cảnh báo chữ normal không có nghĩa hoàn hảo.","vat_chinh_pct":44,"t0":384.099,"t1":389.366,"hs_t0":380.859,"hs_t1":386.126},{"id":"c3","si":1,"loai":"mo_hinh_3d","chu_the":"hạt sáng về trạm quan trắc","khop":["return"],"hinh":"Mô hình một photon quay về cảm biến đặt cạnh giả thuyết hoàn hảo bị bác, không hiển thị phép đo số giả.","vat_chinh_pct":50,"t0":389.366,"t1":393.497,"hs_t0":386.126,"hs_t1":390.257},{"id":"c3","si":2,"loai":"so_sanh_doi_chieu","chu_the":"xung đơn và thẻ khoảng cách","khop":["distance"],"hinh":"Chấm tín hiệu đơn lẻ ở trái và phiếu khoảng cách trống ở phải, bước suy ngay kết quả có dấu hỏi.","vat_chinh_pct":47,"t0":393.497,"t1":397.839,"hs_t0":390.257,"hs_t1":394.599},{"id":"c3","si":3,"loai":"vat_the_minh_hoa","chu_the":"thẻ sản phẩm quan trắc đã xử lý","khop":["processed"],"hinh":"Tấm thẻ normal point đóng dấu sản phẩm xử lý đi vào tủ dữ liệu, các điểm quan trắc nguồn vẫn nối bên dưới.","vat_chinh_pct":53,"t0":397.839,"t1":401.936,"hs_t0":394.599,"hs_t1":398.696},{"id":"c4","si":0,"loai":"bieu_do","chu_the":"biểu đồ có điểm chưa xác minh","khop":["invented"],"hinh":"Đường cong hấp dẫn có nhiều dấu chấm không kèm hồ sơ, nhãn GIẢ ĐỊNH làm rõ đây không phải quan trắc.","vat_chinh_pct":44,"t0":401.936,"t1":406.986,"hs_t0":398.696,"hs_t1":403.746},{"id":"c4","si":1,"loai":"vat_the_minh_hoa","chu_the":"bảng số liệu nguồn chưa mở","khop":["empty"],"hinh":"Một bảng với các ô số rỗng nằm giữa màn, biểu tượng tệp cần mở giải thích vì sao không được tự điền.","vat_chinh_pct":50,"t0":406.986,"t1":412.006,"hs_t0":403.746,"hs_t1":408.766},{"id":"c4","si":2,"loai":"so_do_dong","chu_the":"lộ trình tìm mã bản ghi trong kho ILRS","khop":["archive"],"hinh":"Mũi tên điều hướng chạy qua ba vật thể riêng: mục lục ILRS mở ra, danh sách loại bản ghi được chọn, rồi con trỏ dừng tại vị trí mã bản ghi; không tự điền một mã giả.","vat_chinh_pct":47,"t0":412.006,"t1":416.862,"hs_t0":408.766,"hs_t1":413.622},{"id":"c4","si":3,"loai":"so_sanh_doi_chieu","chu_the":"đường cong tự vẽ bị cổng đối chiếu nguồn chặn","khop":["illustration"],"hinh":"Đường cong minh họa bên trái thử băng qua cổng VERIFY SOURCE FILE để thành kết luận, thanh chắn đỏ sập xuống và gạch bỏ đường cong khi không có tệp quan trắc đối chiếu.","vat_chinh_pct":53,"t0":416.862,"t1":421.299,"hs_t0":413.622,"hs_t1":418.059},{"id":"c5","si":0,"loai":"anh_that","chu_the":"ảnh lớp san hô và phản xạ Apollo","khop":["coral"],"hinh":"Ảnh mặt cắt san hô có những dải sinh trưởng tách khỏi ảnh LR3 Apollo 14, hai ảnh mang chú thích nguồn riêng.","vat_chinh_pct":44,"t0":421.299,"t1":424.715,"hs_t0":418.059,"hs_t1":421.475},{"id":"c5","si":1,"loai":"so_sanh_doi_chieu","chu_the":"quy tắc đếm san hô và xung","khop":["counted"],"hinh":"Các dải san hô bên trái và các chấm sự kiện laser bên phải có chỉ số đếm khác nhau rõ ràng.","vat_chinh_pct":50,"t0":424.715,"t1":429.786,"hs_t0":421.475,"hs_t1":426.546},{"id":"c5","si":2,"loai":"mat_cat_lop","chu_the":"mặt cắt sinh học và đường sáng","khop":["objects"],"hinh":"Mặt cắt san hô và sơ đồ ống kính laser nằm trong hai ngăn không giao nhau, mỗi bên có cấu trúc riêng.","vat_chinh_pct":47,"t0":429.786,"t1":434.293,"hs_t0":426.546,"hs_t1":431.053},{"id":"c5","si":3,"loai":"con_so_lon","chu_the":"hai số không được hoán đổi","khop":["interchangeable"],"hinh":"Hai ô đơn vị khác nhau có con số minh họa, một mũi tên tráo giá trị bị gạch bỏ vì đối tượng không tương đương.","vat_chinh_pct":53,"t0":434.293,"t1":439.174,"hs_t0":431.053,"hs_t1":435.934},{"id":"c6","si":0,"loai":"vat_the_minh_hoa","chu_the":"bảng kê ba trường chưa xác minh","khop":["unresolved"],"hinh":"Bảng kiểm dựng đứng bật ra ba hàng EVENT COUNT, TIME SPAN, UNCERTAINTY theo thứ tự; con dấu NOT VERIFIED đóng phủ lên tiêu đề chung, phân biệt ba điều chưa có chứng cứ.","vat_chinh_pct":44,"t0":439.174,"t1":444.254,"hs_t0":435.934,"hs_t1":441.014},{"id":"c6","si":1,"loai":"so_do_dong","chu_the":"dòng full-rate vào bộ đếm bị khóa","khop":["event"],"hinh":"Chuỗi chấm full-rate lần lượt chảy theo mũi tên vào máy đếm, nhưng chốt khóa SOURCE FILE REQUIRED hạ xuống cắt đường truyền trước bộ cộng, ngăn hiển thị số sự kiện giả.","vat_chinh_pct":50,"t0":444.254,"t1":448.305,"hs_t0":441.014,"hs_t1":445.065},{"id":"c6","si":2,"loai":"truc_thoi_gian","chu_the":"hai cửa sổ thời gian đổi chiều rộng và cảnh báo bất định","khop":["uncertainty"],"hinh":"Hai cửa sổ thời gian trượt qua chuỗi mốc, một cửa thu hẹp còn một cửa mở rộng; bảng thống kê cạnh trục bật nhãn UNCERTAINTY NOT VERIFIED để tách span khỏi sai số.","vat_chinh_pct":47,"t0":448.305,"t1":453.094,"hs_t0":445.065,"hs_t1":449.854},{"id":"c6","si":3,"loai":"so_do_dong","chu_the":"đường tới phép làm lại minh bạch","khop":["reproducible"],"hinh":"Mũi tên từ kho ILRS đi qua tệp gốc và bản đặc tả xử lý tới ô kết quả, từng bước được đánh dấu cần xác minh.","vat_chinh_pct":53,"t0":453.094,"t1":457.811,"hs_t0":449.854,"hs_t1":454.571},{"id":"b0","si":0,"loai":"vat_the_minh_hoa","chu_the":"cuốn sổ bốn cột chứng cứ","khop":["ledger"],"hinh":"Trang sổ chia vùng đo và vùng ngày có hình đồng hồ và lịch, từng loại thông tin được giữ đúng cột.","vat_chinh_pct":44,"t0":457.811,"t1":463.493,"hs_t0":454.571,"hs_t1":460.253},{"id":"b0","si":1,"loai":"so_do_dong","chu_the":"ngăn đếm và ngăn giả định","khop":["counted"],"hinh":"Thẻ quan trắc đi qua cửa xác nhận vào ngăn counted, thẻ phương pháp tách vào ngăn assumed bên cạnh.","vat_chinh_pct":50,"t0":463.493,"t1":467.281,"hs_t0":460.253,"hs_t1":464.041},{"id":"b0","si":2,"loai":"mat_cat_lop","chu_the":"bốn tầng dữ liệu riêng","khop":["dynamical"],"hinh":"Mặt cắt tủ tài liệu có tầng đo, ngày, đếm và mô hình quỹ đạo, mỗi tầng được gắn tên đầy đủ.","vat_chinh_pct":47,"t0":467.281,"t1":472.025,"hs_t0":464.041,"hs_t1":468.785},{"id":"b0","si":3,"loai":"truc_thoi_gian","chu_the":"đường truy ngược từ kết luận","khop":["backward"],"hinh":"Một ô kết quả dẫn dây ngược qua hồ sơ xử lý tới ngày quan trắc và cảm biến đầu tiên để truy nguồn.","vat_chinh_pct":53,"t0":472.025,"t1":476.099,"hs_t0":468.785,"hs_t1":472.859},{"id":"r1","si":0,"loai":"anh_that","chu_the":"trang nguồn dữ liệu ILRS","khop":["ILRS"],"hinh":"Ảnh trang công khai của ILRS đặt trên bàn, hai mục full-rate và normal point được chỉ bằng hai mũi tên.","vat_chinh_pct":44,"t0":476.099,"t1":479.526,"hs_t0":472.859,"hs_t1":476.286},{"id":"r1","si":1,"loai":"so_sanh_doi_chieu","chu_the":"hai danh mục loại dữ liệu","khop":["categories"],"hinh":"Hai khung ghi xung đơn và điểm tổng hợp, ô số của một trạm cụ thể đều để trống.","vat_chinh_pct":50,"t0":479.526,"t1":484.724,"hs_t0":476.286,"hs_t1":481.484},{"id":"r1","si":2,"loai":"so_do_dong","chu_the":"hai nhánh tra cứu kho ILRS","khop":["archive"],"hinh":"Trang chỉ mục ILRS bung thành hai tuyến truy cập FULL-RATE và NORMAL POINTS, hai mũi tên chuyển từng loại tới danh mục tài liệu nguồn khác nhau và gắn dấu DOCUMENT.","vat_chinh_pct":47,"t0":484.724,"t1":489.286,"hs_t0":481.484,"hs_t1":486.046},{"id":"r1","si":3,"loai":"mo_hinh_3d","chu_the":"mô hình máy laser đo Mặt Trăng","khop":["ranging"],"hinh":"Trạm kính thiên văn bắn tia tới vật phản xạ trên Mặt Trăng, ô sản phẩm dữ liệu được đặt tách khỏi thiết bị.","vat_chinh_pct":53,"t0":489.286,"t1":493.786,"hs_t0":486.046,"hs_t1":490.546},{"id":"r2","si":0,"loai":"quy_dao_chuyen_dong","chu_the":"đường tia laser đi và về","khop":["round-trip"],"hinh":"Tia sáng chạy từ Trái Đất tới gương trên Mặt Trăng rồi quay lại, hai mũi tên chỉ hướng đo riêng.","vat_chinh_pct":44,"t0":493.786,"t1":499.8283,"hs_t0":490.546,"hs_t1":496.64},{"id":"r2","si":1,"loai":"so_sanh_doi_chieu","chu_the":"nguyên lý và sai số tự nghĩ","khop":["fictional"],"hinh":"Sơ đồ phản xạ ở trái và ô phương sai normal point chưa có dữ liệu ở phải, dấu không suy được nằm giữa.","vat_chinh_pct":50,"t0":499.8283,"t1":503.7943,"hs_t0":496.64,"hs_t1":500.64},{"id":"r2","si":2,"loai":"anh_that","chu_the":"ảnh có mã thiết bị Apollo 14","khop":["photograph"],"hinh":"Ảnh NASA Apollo 14 LR3 mang mã lưu trữ và credit riêng, không gắn những kích thước không có nguồn.","vat_chinh_pct":47,"t0":503.7943,"t1":508.4316,"hs_t0":500.64,"hs_t1":505.317},{"id":"r2","si":3,"loai":"mat_cat_lop","chu_the":"hình LR3 và thước chưa hiệu chuẩn","khop":["scaled"],"hinh":"Hình minh họa mặt cắt có thước đo chưa định chuẩn, vật thể LR3 đặt cạnh để nhắc ảnh không chứng minh kích thước.","vat_chinh_pct":53,"t0":508.4316,"t1":513.174,"hs_t0":505.317,"hs_t1":510.1},{"id":"r3","si":0,"loai":"anh_that","chu_the":"thẻ bài nghiên cứu tốc độ quỹ đạo","khop":["model-derived"],"hinh":"Tờ nghiên cứu Williams Boggs có tên tác giả và mã DOI, phần ước lượng tham số nằm trong khung chỉ nguồn.","vat_chinh_pct":44,"t0":513.34,"t1":517.006,"hs_t0":510.1,"hs_t1":513.766},{"id":"r3","si":1,"loai":"con_so_lon","chu_the":"đơn vị milimét mỗi năm","khop":["millimetres"],"hinh":"Dòng mm mỗi năm được phóng lớn dưới trị số tốc độ dài hạn, không mang biểu tượng đồng hồ xung.","vat_chinh_pct":50,"t0":517.006,"t1":521.53,"hs_t0":513.766,"hs_t1":518.29},{"id":"r3","si":2,"loai":"so_sanh_doi_chieu","chu_the":"tốc độ quỹ đạo và thời gian đi về","khop":["pulse"],"hinh":"Trục milimét mỗi năm đối diện mặt đồng hồ xung, hai loại đại lượng tách bằng đường viền giải thích.","vat_chinh_pct":47,"t0":521.53,"t1":525.66,"hs_t0":518.29,"hs_t1":522.42},{"id":"r3","si":3,"loai":"phong_to_chi_tiet","chu_the":"dòng DOI của bài nghiên cứu","khop":["remain"],"hinh":"Kính lúp phóng lớn DOI trên tờ sổ nguồn, đường nối đi tới đúng ô tham số đã công bố.","vat_chinh_pct":53,"t0":525.66,"t1":530.34,"hs_t0":522.42,"hs_t1":527.1},{"id":"r4","si":0,"loai":"vat_the_minh_hoa","chu_the":"bảng việc cần để tái lập","khop":["entry"],"hinh":"Tờ danh sách kiểm kê tệp quan trắc, quy tắc giảm dữ liệu, số lần đo và quy ước bất định còn chờ.","vat_chinh_pct":44,"t0":530.34,"t1":534.182,"hs_t0":527.1,"hs_t1":530.942},{"id":"r4","si":1,"loai":"so_do_dong","chu_the":"bốn đầu vào của phép tái lập","khop":["specification"],"hinh":"Bốn thẻ đầu vào đi qua mũi tên vào hộp tái lập nghiên cứu, mỗi thẻ gắn yêu cầu nguồn cụ thể.","vat_chinh_pct":50,"t0":534.182,"t1":539.944,"hs_t0":530.942,"hs_t1":536.704},{"id":"r4","si":2,"loai":"mat_cat_lop","chu_the":"ô kết quả rỗng có chú giải","khop":["numerical"],"hinh":"Mặt cắt bảng số liệu có ô số sự kiện và bất định chưa điền, chú thích lý do thiếu đặt bên phải.","vat_chinh_pct":47,"t0":539.944,"t1":543.965,"hs_t0":536.704,"hs_t1":540.725},{"id":"r4","si":3,"loai":"so_do_dong","chu_the":"máy tính xuất số chính xác giả bị bác bỏ","khop":["precision"],"hinh":"Máy tính trên bàn liên tục nhả dải thập phân dài quá mức không có nguồn, dấu gạch chéo đỏ cắt dải số và một mũi tên quay lại thao tác mở tệp quan trắc gốc để kiểm phương pháp.","vat_chinh_pct":53,"t0":543.965,"t1":548.84,"hs_t0":540.725,"hs_t1":545.6},{"id":"s8","si":0,"loai":"truc_thoi_gian","chu_the":"cửa sổ thời gian chọn lại","khop":["choices"],"hinh":"Một cửa sổ trượt dọc trục ngày chọn các nhóm chấm khác nhau, nhãn ngày được giữ dưới từng chấm.","vat_chinh_pct":44,"t0":548.84,"t1":552.523,"hs_t0":545.6,"hs_t1":549.283},{"id":"s8","si":1,"loai":"mat_cat_lop","chu_the":"lớp hiệu chỉnh có tài liệu","khop":["different"],"hinh":"Dải ảnh hưởng hiệu chỉnh được xếp trên đường tín hiệu, tham số còn trống tới khi có quy tắc được dẫn.","vat_chinh_pct":50,"t0":552.523,"t1":556.207,"hs_t0":549.283,"hs_t1":552.967},{"id":"s8","si":2,"loai":"anh_that","chu_the":"hai hồ sơ phát hành kho lưu trữ","khop":["archive"],"hinh":"Hai bìa hồ sơ của hai bản lưu trữ đặt cạnh nhau với nhãn phiên bản riêng, dây nguồn nối về ILRS.","vat_chinh_pct":47,"t0":556.207,"t1":561.334,"hs_t0":552.967,"hs_t1":558.094},{"id":"s8","si":3,"loai":"quy_dao_chuyen_dong","chu_the":"Mặt Trăng vẫn di chuyển liên tục","khop":["Moon"],"hinh":"Quỹ đạo Mặt Trăng tiếp tục liền mạch khi trang sổ được lật dưới khung, không có bước nhảy tốc độ đột ngột.","vat_chinh_pct":53,"t0":561.334,"t1":566.027,"hs_t0":558.094,"hs_t1":562.787},{"id":"k1","si":0,"loai":"anh_that","chu_the":"ảnh thật Apollo 14 LR3 trở lại","khop":["photograph"],"hinh":"Ảnh NASA AS14-67-9386 mở lớn trong khung, góc dưới có mã nguồn và nét chỉ trực tiếp vào thiết bị phản xạ.","vat_chinh_pct":44,"t0":566.027,"t1":570.6295,"hs_t0":562.787,"hs_t1":566.953},{"id":"k1","si":1,"loai":"so_sanh_doi_chieu","chu_the":"ảnh thiết bị và dữ liệu normal point","khop":["record"],"hinh":"Ảnh LR3 thật ở trái cạnh một hồ sơ normal point có nhiều điểm gắn thời gian ở phải, không đánh đồng hai vật.","vat_chinh_pct":50,"t0":570.6295,"t1":576.0373,"hs_t0":566.953,"hs_t1":571.848},{"id":"k1","si":2,"loai":"truc_thoi_gian","chu_the":"cửa sổ Lunar Variable ILRS","khop":["intervals"],"hinh":"Dải điểm full-rate được gom vào hai khung khoảng thời gian dài ngắn khác nhau, cả hai có nhãn Lunar Variable.","vat_chinh_pct":47,"t0":576.0373,"t1":581.5888,"hs_t0":571.848,"hs_t1":576.873},{"id":"k1","si":3,"loai":"vat_the_minh_hoa","chu_the":"ba trường không thể suy từ ảnh","khop":["epoch"],"hinh":"Ba thẻ ngày đo số lần nhận và bất định để dấu hỏi bên cạnh ảnh LR3, không có dữ liệu tự thêm.","vat_chinh_pct":53,"t0":581.5888,"t1":586.452,"hs_t0":576.873,"hs_t1":581.275},{"id":"k2","si":0,"loai":"mo_hinh_3d","chu_the":"mô hình quỹ đạo ở tập tiếp","khop":["models"],"hinh":"Mô hình ba chiều Trái Đất và Mặt Trăng có nhiều vị trí theo thời gian, tiêu đề tập sau nằm cạnh tham số suy luận dài hạn.","vat_chinh_pct":44,"t0":586.452,"t1":591.952,"hs_t0":581.275,"hs_t1":586.775}];
const INK="#2E2A26",PAPER="#EFE6D3",PURPLE="#7B3F98",SPINE="#9E3C77";
const NAVY="#172638",BONE="#FFF5E7",TEAL="#67B8AA",GOLD="#E3B65D",STONE="#D7C9B9";
const min=(a,b)=>Math.min(a,b),max=(a,b)=>Math.max(a,b),cl=(v,a=0,b=1)=>max(a,min(b,v));
const findShot=t=>SHOTS.find(s=>t>=s.t0&&t<s.t1)||SHOTS[t<SHOTS[0].t0?0:SHOTS.length-1];
const cx=(o,u)=>o.x+o.w*u,cy=(o,v)=>o.y+o.h*v;
function line(c,x,y,xx,yy,color=INK,width=3){c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.lineWidth=width;c.strokeStyle=color;c.stroke();}
function ellipse(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,max(.01,rx),max(.01,ry),0,0,Math.PI*2);c.fillStyle=color;c.fill();}
function circle(c,x,y,r,color){ellipse(c,x,y,r,r,color);}
function bar(c,x,y,w,h,co){c.fillStyle=co;c.fillRect(x,y,w,h);}
function rr(c,x,y,w,h,r,color){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=color;c.fill();}
function arrow(c,x,y,xx,yy,color=SPINE,w=5){
 line(c,x,y,xx,yy,color,w);const a=Math.atan2(yy-y,xx-x),v=15;
 line(c,xx,yy,xx-v*Math.cos(a-.5),yy-v*Math.sin(a-.5),color,w);
 line(c,xx,yy,xx-v*Math.cos(a+.5),yy-v*Math.sin(a+.5),color,w);
}
function ball(c,x,y,r,colors){
 const g=c.createRadialGradient(x-r*.4,y-r*.45,r*.1,x,y,r);
 g.addColorStop(0,colors[0]);g.addColorStop(.58,colors[1]);g.addColorStop(1,colors[2]);
 circle(c,x,y,r,g);c.strokeStyle="rgba(255,255,255,.4)";c.lineWidth=2;
 c.beginPath();c.arc(x,y,r,Math.PI*.33,Math.PI*1.55);c.stroke();
}
function label(rc,o,s){
 // Chỉ viết nhãn do HS khóa trong shot.khop, tuyệt đối không invent chữ trong hình.
 const c=rc.ctx,ss=s.khop.slice(0,2);
 c.save();c.font="600 30px Georgia, serif";c.textBaseline="middle";
 ss.forEach((v,i)=>{
   const text=String(v),txt=c.measureText(text).width,py=o.y+o.h-53-i*52,px=o.x+18;
   // Cỡ chữ giữ 24 px, nhãn nằm trong vùng vật, không chạm nguồn / phụ đề / PiP.
   const bw=min(o.w-28,txt+24);
   rr(c,px-8,py-22,bw,44,6,INK);
   c.fillStyle=BONE;c.fillText(text,px,py);
   // Nhãn là chữ thật, khai hộp để QA phát hiện chồng và vùng cấm.
   rc.khungChu.push({text,lop:"giua",x0:px,y0:py-22,x1:px+txt,y1:py+22,alpha:1});
 });
 c.restore();
}
function page(c,o,color=BONE){
 c.save();c.shadowColor="rgba(0,0,0,.23)";c.shadowBlur=18;c.shadowOffsetY=9;
 rr(c,cx(o,.10),cy(o,.12),o.w*.80,o.h*.68,9,color);c.restore();
 c.strokeStyle=INK;c.lineWidth=2;c.strokeRect(cx(o,.10),cy(o,.12),o.w*.80,o.h*.68);
}
function drawDots(c,o,n,bright=false,p=0){
 for(let i=0;i<n;i++){
  const u=.16+((i*37+n*13)%71)/100*.86,v=.25+((i*19+n*7)%51)/100;
  const x=cx(o,u),y=cy(o,v),rrr=3+(i%3)*2;
  circle(c,x,y,rrr,bright?(i%3?TEAL:GOLD):(i%4?PURPLE:SPINE));
 }
}
function tickAxis(c,o,light=false){const co=light?BONE:INK;line(c,cx(o,.13),cy(o,.76),cx(o,.87),cy(o,.76),co,4);
 for(let i=0;i<8;i++)line(c,cx(o,.13+i*.105),cy(o,.74),cx(o,.13+i*.105),cy(o,.785),co,2);
}
function veMoHinh3D(rc,o,s,p){
 const c=rc.ctx;bar(c,o.x,o.y,o.w,o.h,NAVY);
 // Sao có tọa độ cố định là bối cảnh thiên văn, không dùng để lách đổi cảnh.
 for(let i=0;i<24;i++)circle(c,cx(o,((i*37+11)%93)/100),cy(o,((i*17+31)%83)/100),1.6,BONE);
 ball(c,cx(o,.28),cy(o,.59),o.h*.21,["#A4E5D4","#398EA4","#244C68"]);
 ball(c,cx(o,.77),cy(o,.32),o.h*.15,["#F7F0D7","#999BA8","#505F75"]);
 c.strokeStyle="#A9A3D8";c.lineWidth=3;c.beginPath();c.ellipse(cx(o,.51),cy(o,.52),o.w*.34,o.h*.17,-.18,0,Math.PI*2);c.stroke();
 const a=cx(o,.36),b=cy(o,.52),e=cx(o,.69),f=cy(o,.37);
 const phrase=(s.hinh+" "+s.chu_the).toLowerCase();
 if(/photon|return/.test(phrase)){circle(c,a+(e-a)*(1-p),b+(f-b)*(1-p),11,GOLD);arrow(c,e,f,a,b,GOLD,5)}
 else{arrow(c,a,b,e,f,TEAL,6);circle(c,a+(e-a)*p,b+(f-b)*p,9,GOLD)}
 // Kính trạm cụ thể: ống kính hướng vào đường sáng, bệ có chân.
 line(c,cx(o,.20),cy(o,.83),cx(o,.26),cy(o,.67),BONE,9);
 rr(c,cx(o,.225),cy(o,.63),o.w*.09,o.h*.045,5,STONE);
 if(/model|dynamical|orbit|quỹ đạo/.test(phrase)){
  for(let i=0;i<3;i++)circle(c,cx(o,.68)+Math.cos(i*1.9+p*.5)*o.w*.11,cy(o,.38)+Math.sin(i*1.9+p*.5)*o.h*.19,5,GOLD);
 }
}
function veBanDo(rc,o,s,p){
 const c=rc.ctx;bar(c,o.x,o.y,o.w,o.h,"#D3E0D9");
 for(let j=0;j<6;j++){c.strokeStyle="#8F9B95";c.lineWidth=2;line(c,cx(o,.12),cy(o,.18+j*.11),cx(o,.88),cy(o,.15+j*.10),"#84968E",2);}
 c.beginPath();c.moveTo(cx(o,.15),cy(o,.23));c.bezierCurveTo(cx(o,.3),cy(o,.12),cx(o,.52),cy(o,.52),cx(o,.78),cy(o,.38));c.lineTo(cx(o,.8),cy(o,.72));c.lineTo(cx(o,.17),cy(o,.72));c.closePath();c.fillStyle="#85AD98";c.fill();
 circle(c,cx(o,.27),cy(o,.56),13,SPINE);circle(c,cx(o,.68),cy(o,.38),13,SPINE);arrow(c,cx(o,.28),cy(o,.55),cx(o,.28+.37*p),cy(o,.55-.13*p),GOLD,6);
}
function veSoDoDong(rc,o,s,p){
 const c=rc.ctx;bar(c,o.x,o.y,o.w,o.h,"#F2E6D5");const h=s.hinh.toLowerCase();
 if(/phễu|lọc|funnel|ngăn|cửa/.test(h)){
  c.fillStyle=PURPLE;c.beginPath();c.moveTo(cx(o,.13),cy(o,.23));c.lineTo(cx(o,.86),cy(o,.23));c.lineTo(cx(o,.57),cy(o,.60));c.lineTo(cx(o,.57),cy(o,.73));c.lineTo(cx(o,.44),cy(o,.73));c.lineTo(cx(o,.44),cy(o,.60));c.closePath();c.fill();
  for(let i=0;i<24;i++){const x=cx(o,.2+(i%8)*.083),y=cy(o,.25+Math.floor(i/8)*.08+p*.08);circle(c,x,y,4,i%4===0?SPINE:TEAL)}
  rr(c,cx(o,.38),cy(o,.75),o.w*.25,o.h*.10,8,NAVY);circle(c,cx(o,.5),cy(o,.8),8,GOLD);
 }else if(/chấm|xung|normal|pulse/.test(h)){
  tickAxis(c,o);for(let i=0;i<26;i++){const a=i/25,y=.32+.13*Math.sin(i*2.5);
   const x=cx(o,(1-p)*(.15+a*.72)+p*.57);circle(c,x,cy(o,y),4+(i%3),i%2?PURPLE:TEAL)}
  circle(c,cx(o,.57),cy(o,.45),p*16,GOLD);
 }else{
  // Những tuyến xử lý có vật vào/ra, các hộp khác bố cục tùy chu_the.
  const count=/bốn|four/.test(h)?4:3;
  for(let i=0;i<count;i++){const x=cx(o,.1+i*.23);
   rr(c,x,cy(o,.29+(i%2)*.12),o.w*.17,o.h*.22,8,i%2?PURPLE:NAVY);
   circle(c,x+o.w*.085,cy(o,.4+(i%2)*.12),12,GOLD);
   if(i<count-1)arrow(c,x+o.w*.17,cy(o,.42),x+o.w*.22,cy(o,.42),SPINE,4);
  }
  arrow(c,cx(o,.3),cy(o,.69),cx(o,.3+.4*p),cy(o,.69),TEAL,7);
 }
}
function veBieuDo(rc,o,s,p){
 const c=rc.ctx;bar(c,o.x,o.y,o.w,o.h,"#F8F6EE");
 const x0=cx(o,.12),y0=cy(o,.77),x1=cx(o,.88),y1=cy(o,.16);
 for(let i=0;i<7;i++){line(c,x0,cy(o,.22+i*.085),x1,cy(o,.22+i*.085),"#D1D0CB",2)}
 line(c,x0,y0,x1,y0,INK,5);line(c,x0,y0,x0,y1,INK,5);
 const h=s.hinh.toLowerCase(),few=/một chấm|one|hai chấm|two/.test(h);
 const count=few?(/hai|two/.test(h)?2:1):7;
 for(let i=0;i<count;i++){const u=.23+i*.095,v=.62-.27*(i/Math.max(1,count-1))+.09*Math.sin(i*2.6);
   circle(c,cx(o,u),cy(o,v),9,i%2?SPINE:PURPLE)}
 if(/uncertainty|bất định|dải/.test(h))bar(c,cx(o,.2),cy(o,.35),o.w*.63,o.h*.22,"rgba(123,63,152,.22)");
 else if(/trung bình|bình quân|average/.test(h))line(c,cx(o,.19),cy(o,.49),cx(o,.85),cy(o,.49),TEAL,6);
 else if(/trend|xu thế|curve|đường/.test(h)){
  c.setLineDash([14,12]);line(c,cx(o,.20),cy(o,.64),cx(o,.82),cy(o,.30),SPINE,5);c.setLineDash([]);
  if(few){line(c,cx(o,.52),cy(o,.30),cx(o,.61),cy(o,.44),SPINE,8);line(c,cx(o,.52),cy(o,.44),cx(o,.61),cy(o,.30),SPINE,8)}
 }
}
function veTrucThoiGian(rc,o,s,p){
 const c=rc.ctx;bar(c,o.x,o.y,o.w,o.h,"#E9DFC7");tickAxis(c,o);
 const n=/hai|two/.test(s.hinh.toLowerCase())?2:7;
 for(let i=0;i<n;i++){
 const u=.19+i*.68/Math.max(1,n-1);
 line(c,cx(o,u),cy(o,.45),cx(o,u),cy(o,.76),SPINE,3);
 circle(c,cx(o,u),cy(o,.45),11,i%2?PURPLE:TEAL);
 // Ngày/epoch là thẻ trống, không bịa ngày tháng lịch sử.
 rr(c,cx(o,u)-o.w*.037,cy(o,.30),o.w*.074,o.h*.11,4,BONE);
 }
 if(/khung|interval|window|cửa sổ/.test((s.hinh+" "+s.khop.join(" ")).toLowerCase())){
 c.strokeStyle=GOLD;c.lineWidth=6;c.strokeRect(cx(o,.21+.32*p),cy(o,.34),o.w*.28,o.h*.38);
 }
 arrow(c,cx(o,.14),cy(o,.64),cx(o,.82),cy(o,.64),INK,4);
}
function vePhongToChiTiet(rc,o,s,p){
 const c=rc.ctx;bar(c,o.x,o.y,o.w,o.h,"#293C49");
 const h=s.hinh.toLowerCase();
 if(/đồng hồ|timing|nano|clock|thời gian/.test(h)){
  circle(c,cx(o,.46),cy(o,.44),o.h*.27,STONE);
  circle(c,cx(o,.46),cy(o,.44),o.h*.23,NAVY);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;line(c,cx(o,.46)+Math.cos(a)*o.h*.18,cy(o,.44)+Math.sin(a)*o.h*.18,cx(o,.46)+Math.cos(a)*o.h*.22,cy(o,.44)+Math.sin(a)*o.h*.22,GOLD,3)}
  arrow(c,cx(o,.46),cy(o,.44),cx(o,.46)+Math.cos(p*2.3)*o.h*.17,cy(o,.44)+Math.sin(p*2.3)*o.h*.17,GOLD,5);
 } else if(/lúp|doi|tài liệu|thẻ|source|DOI|ký hiệu/.test(h)){
  page(c,o,"#EEE9DC");
  c.strokeStyle=PURPLE;c.lineWidth=12;c.beginPath();c.arc(cx(o,.46),cy(o,.40),o.h*.16,0,Math.PI*2);c.stroke();
  line(c,cx(o,.54),cy(o,.51),cx(o,.71),cy(o,.74),SPINE,17);
  for(let i=0;i<6;i++)bar(c,cx(o,.23),cy(o,.21+i*.065),o.w*.3,o.h*.018,i%2?INK:SPINE);
 }else{
  rr(c,cx(o,.18),cy(o,.2),o.w*.54,o.h*.5,16,STONE);
  for(let i=0;i<5;i++)rr(c,cx(o,.26+i*.075),cy(o,.29),o.w*.045,o.h*.27,6,i%2?PURPLE:TEAL);
  circle(c,cx(o,.5),cy(o,.49),o.h*.075,GOLD);
  arrow(c,cx(o,.82),cy(o,.48),cx(o,.57),cy(o,.48),GOLD,8);
 }
}
function veSoSanhDoiChieu(rc,o,s,p){
 const c=rc.ctx;bar(c,o.x,o.y,o.w,o.h,"#ECE4D7");
 const phrase=s.hinh.toLowerCase();
 const leftDark=/photon|laser|ánh sáng|nhánh|xung/.test(phrase);
 rr(c,cx(o,.055),cy(o,.12),o.w*.42,o.h*.65,9,leftDark?NAVY:"#DDD3C1");
 rr(c,cx(o,.525),cy(o,.12),o.w*.42,o.h*.65,9,!leftDark?NAVY:"#DFDACD");
 for(let side=0;side<2;side++){
 const bx=side?.575:.105, light=(side?!leftDark:leftDark),co=light?GOLD:PURPLE;
 if(/ảnh|Apollo|LR3/.test(phrase)&&side===0){
  // Không nhái ảnh thật trong hàm so sánh: chỉ khung vật chứng, hình gốc ở veAnhThat.
  rr(c,cx(o,bx),cy(o,.2),o.w*.3,o.h*.38,5,STONE);
  ellipse(c,cx(o,bx+.15),cy(o,.39),o.w*.09,o.h*.065,INK);
 }else if(/bốn|four|column|cột/.test(phrase)){
  for(let i=0;i<4;i++)rr(c,cx(o,bx+i*.077),cy(o,.28),o.w*.055,o.h*.30,3,i%2?TEAL:co);
 }else{
  for(let i=0;i<(side?3:13);i++){
   const u=bx+((i*13)%25)*.01,v=.26+Math.floor(i/5)*.085;
   circle(c,cx(o,u),cy(o,v),i<5?8:5,co);
  }
 }
 }
 // Phân biệt giả thiết đối chiếu: dấu không suy được thay vì biến dữ liệu.
 circle(c,cx(o,.5),cy(o,.47),o.h*.065,PAPER);line(c,cx(o,.48),cy(o,.4),cx(o,.52),cy(o,.54),SPINE,6);
}
function veConSoLon(rc,o,s,p){
 const c=rc.ctx;bar(c,o.x,o.y,o.w,o.h,"#F2E5D5");
 rr(c,cx(o,.16),cy(o,.17),o.w*.67,o.h*.53,18,INK);
 const number=s.hinh.includes("38,30")?"38,30":(s.hinh.includes("normal")?"?":"—");
 c.save();c.fillStyle=GOLD;c.font="700 "+Math.round(o.h*.27)+"px Georgia, serif";c.textAlign="center";c.textBaseline="middle";
 c.fillText(number,cx(o,.5),cy(o,.44));c.restore();
 if(number==="—"||number==="?"){
  line(c,cx(o,.61),cy(o,.28),cx(o,.76),cy(o,.59),SPINE,11);
 }else{
  for(let i=0;i<5;i++)bar(c,cx(o,.2+i*.12),cy(o,.72),o.w*.06,o.h*.06,PURPLE);
 }
}
function veVatTheMinhHoa(rc,o,s,p){
 const c=rc.ctx;bar(c,o.x,o.y,o.w,o.h,"#D7C6B7");page(c,o);
 const h=s.hinh.toLowerCase();
 if(/sổ|ledger|cột|column/.test(h)){
  for(let i=0;i<4;i++){const xx=cx(o,.16+i*.18);bar(c,xx,cy(o,.18),o.w*.15,o.h*.49,i%2?"#E3CBB8":"#F5F0DC");
   for(let j=0;j<5;j++)bar(c,xx+6,cy(o,.28+j*.06),o.w*.10,o.h*.014,j%2?PURPLE:INK);
  }
 }else if(/hồ sơ|thẻ|phiếu|tờ/.test(h)){
  for(let i=0;i<3;i++){const x=cx(o,.20+i*.20),y=cy(o,.18+(i%2)*.085);
    rr(c,x,y,o.w*.15,o.h*.43,8,i%2?PURPLE:INK);
    for(let j=0;j<3;j++)bar(c,x+8,y+18+j*25,o.w*.09,6,BONE);
  }
 }else{
  for(let i=0;i<5;i++){rr(c,cx(o,.20+i*.12),cy(o,.25+Math.sin(i)*.07),o.w*.095,o.h*.31,9,i%2?SPINE:INK);
   circle(c,cx(o,.25+i*.12),cy(o,.43),8,GOLD);
  }
 }
}
function veMatCatLop(rc,o,s,p){
 const c=rc.ctx;bar(c,o.x,o.y,o.w,o.h,"#2C3745");
 const cols=["#D1B8A7","#B99EAB","#7B3F98","#5A6D79","#67B8AA"];
 const h=s.hinh.toLowerCase(),n=/bốn|four/.test(h)?4:3;
 for(let i=0;i<n;i++){
  const y=cy(o,.15+i*.58/n);bar(c,cx(o,.12),y,o.w*.75,o.h*.52/n,cols[(i+2)%5]);
  for(let j=0;j<5;j++)bar(c,cx(o,.2+j*.11),y+12,o.w*.07,o.h*.05,i%2?BONE:INK);
 }
 line(c,cx(o,.82),cy(o,.16),cx(o,.82),cy(o,.73),GOLD,5);
 // Đường ánh sáng/cảm biến xuyên lớp theo câu ở shot.
 if(/sensor|detector|khí|calibration|ống kính|trạm/.test(h))
  arrow(c,cx(o,.48),cy(o,.17),cx(o,.48+.07*Math.sin(p*2)),cy(o,.70),TEAL,7);
}
function veQuyDaoChuyenDong(rc,o,s,p){
 const c=rc.ctx;bar(c,o.x,o.y,o.w,o.h,NAVY);
 c.strokeStyle="#6B9AAF";c.lineWidth=3;c.beginPath();c.ellipse(cx(o,.51),cy(o,.49),o.w*.33,o.h*.28,-.13,0,Math.PI*2);c.stroke();
 ball(c,cx(o,.30),cy(o,.48),o.h*.21,["#9AE9CA","#3C95AD","#1E4E71"]);
 const theta=-.8+p*.7;
 ball(c,cx(o,.51)+Math.cos(theta)*o.w*.32,cy(o,.49)+Math.sin(theta)*o.h*.28,o.h*.11,["#F1E9CA","#A7A8B0","#46576A"]);
 arrow(c,cx(o,.37),cy(o,.45),cx(o,.70),cy(o,.38),TEAL,6);
 if(/return|về|hai chiều|two|round-trip/.test(s.hinh.toLowerCase()))
  arrow(c,cx(o,.70),cy(o,.43),cx(o,.36),cy(o,.52),GOLD,6);
 for(let i=0;i<4;i++)circle(c,cx(o,.45+i*.06),cy(o,.41),3+i%3,GOLD);
}
const PAINTERS={
 "anh_that":veAnhThat,"ban_do":veBanDo,"mo_hinh_3d":veMoHinh3D,
 "so_do_dong":veSoDoDong,"bieu_do":veBieuDo,"truc_thoi_gian":veTrucThoiGian,
 "phong_to_chi_tiet":vePhongToChiTiet,"so_sanh_doi_chieu":veSoSanhDoiChieu,
 "con_so_lon":veConSoLon,"vat_the_minh_hoa":veVatTheMinhHoa,
 "mat_cat_lop":veMatCatLop,"quy_dao_chuyen_dong":veQuyDaoChuyenDong
};
function veAnhThat(rc,o,s,p,img){
 const c=rc.ctx,h=s.hinh.toLowerCase();
 bar(c,o.x,o.y,o.w,o.h,"#3A3636");
 if(/apollo|lr3|nasa|reflector|ảnh thật/.test(h)&&img.complete&&img.naturalWidth){
  // HS vẽ vòng LR3 trong thumbnail thật AS14-67-9386; không trá hình dữ liệu NP.
  c.drawImage(img,857,127,363,383,cx(o,.18),cy(o,.08),o.w*.65,o.h*.74);
  c.strokeStyle=GOLD;c.lineWidth=5;c.beginPath();c.ellipse(cx(o,.18+.65*.52),cy(o,.08+.74*.69),o.w*.65*.21,o.h*.74*.13,0,0,Math.PI*2);c.stroke();
 }else{
  // Hồ sơ nguồn: đồ họa biểu thị tài liệu chờ tra cứu, không giả là ảnh chụp có thật.
  page(c,o,"#E9E1D4");
  for(let i=0;i<7;i++)bar(c,cx(o,.18),cy(o,.23+i*.063),o.w*(i%2?.43:.60),o.h*.018,i===2?SPINE:"#A8A299");
  rr(c,cx(o,.68),cy(o,.25),o.w*.11,o.h*.19,4,PURPLE);
  circle(c,cx(o,.55),cy(o,.43),o.h*.06,GOLD);
 }
}
// Một shot có hai trạng thái vật CHỨNG MINH cùng một câu:
// nửa đầu cho thấy vật/nguồn đầu vào, nửa sau chuyển thành hành động hoặc kết quả.
// Khác hình là khác vật cụ thể, không phải thay màu nền / tô bóng / nét quét.
function veBuocDau(rc,o,s,p,img) {
 const c=rc.ctx,h=s.hinh.toLowerCase();
 const color=s.loai==="mo_hinh_3d"||s.loai==="quy_dao_chuyen_dong"||s.loai==="mat_cat_lop"||s.loai==="phong_to_chi_tiet"?NAVY:"#F0E5D7";
 bar(c,o.x,o.y,o.w,o.h,color);
 // Phác vật thể trước khi nó tham gia phép biến đổi; mọi biểu tượng lấy từ danh từ
 // trong mô tả HS, hoàn toàn không hiển thị số liệu không có nguồn.
 if(s.loai==="mo_hinh_3d"||s.loai==="quy_dao_chuyen_dong"){
    if(/khí quyển|atmosphere/.test(h)){
      ball(c,cx(o,.49),cy(o,.44),o.h*.27,["#A9DEC8","#4387B0","#263F64"]);
      c.strokeStyle=TEAL;c.lineWidth=15;c.beginPath();c.arc(cx(o,.49),cy(o,.44),o.h*.33,.2,Math.PI*1.8);c.stroke();
    }else if(/photon|cảm biến|sensor/.test(h)){
      rr(c,cx(o,.35),cy(o,.2),o.w*.30,o.h*.51,12,STONE);
      circle(c,cx(o,.5),cy(o,.45),o.h*.15,INK);
      circle(c,cx(o,.5),cy(o,.45),o.h*.07,GOLD);
    }else{
      ball(c,cx(o,.5),cy(o,.45),o.h*.32,["#A5E7D4","#4387A9","#2C466A"]);
      rr(c,cx(o,.18),cy(o,.69),o.w*.25,o.h*.08,10,STONE);
      line(c,cx(o,.30),cy(o,.69),cx(o,.40),cy(o,.55),TEAL,8);
    }
 }else if(s.loai==="anh_that"){
   if(/apollo|lr3|nasa|phản xạ/.test(h)&&img.complete&&img.naturalWidth){
     c.drawImage(img,857,127,363,383,cx(o,.10),cy(o,.06),o.w*.8,o.h*.80);
   }else if(/Williams|doi|nghiên cứu|boggs|mô hình/.test(h)){
     // Trang nghiên cứu: hình tờ giấy/chân dung tư liệu chỉ là infographic,
     // không giả dữ liệu cụ thể hay bịa bản scan chính thức.
     rr(c,cx(o,.16),cy(o,.10),o.w*.65,o.h*.71,8,BONE);
     bar(c,cx(o,.21),cy(o,.16),o.w*.54,o.h*.075,INK);
     for(let i=0;i<7;i++)bar(c,cx(o,.21),cy(o,.29+i*.057),o.w*(i%3===0?.31:.47),o.h*.014,STONE);
     circle(c,cx(o,.72),cy(o,.63),o.h*.11,PURPLE);
   }else{
     // Danh mục nguồn, các mục chọn trông như các thẻ tra cứu, không phải screenshot.
     for(let i=0;i<4;i++){rr(c,cx(o,.12+i*.19),cy(o,.16+(i%2)*.08),o.w*.15,o.h*.42,5,i%2?PURPLE:INK);
       bar(c,cx(o,.14+i*.19),cy(o,.25+(i%2)*.08),o.w*.11,o.h*.035,BONE);}
   }
 }else if(s.loai==="so_sanh_doi_chieu"){
   const left=/xung|photon|laser|thời gian|timing|Earth/.test(h)?NAVY:"#DED1BE";
   rr(c,cx(o,.15),cy(o,.13),o.w*.68,o.h*.60,12,left);
   if(/bốn|cột|ledger|four/.test(h)){
     for(let i=0;i<4;i++)bar(c,cx(o,.20+i*.155),cy(o,.24),o.w*.12,o.h*.39,i%2?PURPLE:TEAL);
   }else if(/thẻ|dữ liệu|hồ sơ|tài liệu|record/.test(h)){
     for(let i=0;i<3;i++){rr(c,cx(o,.24+i*.12),cy(o,.25+i*.045),o.w*.25,o.h*.30,5,i%2?STONE:BONE);}
   }else{
     for(let i=0;i<14;i++)circle(c,cx(o,.23+i%7*.082),cy(o,.27+Math.floor(i/7)*.19),8,i%2?TEAL:PURPLE);
   }
 }else if(s.loai==="so_do_dong"){
   if(/xung|chấm|pulse|point/.test(h)){
     for(let i=0;i<40;i++)circle(c,cx(o,.1+(i%10)*.08),cy(o,.22+Math.floor(i/10)*.13),7,i%4?PURPLE:TEAL);
   }else if(/phễu|lọc/.test(h)){
     c.beginPath();c.moveTo(cx(o,.15),cy(o,.14));c.lineTo(cx(o,.85),cy(o,.14));c.lineTo(cx(o,.55),cy(o,.68));c.lineTo(cx(o,.45),cy(o,.68));c.closePath();c.fillStyle=PURPLE;c.fill();
     for(let i=0;i<16;i++)circle(c,cx(o,.2+(i%8)*.076),cy(o,.14+(i%2)*.07),5,GOLD);
   }else{
     for(let i=0;i<4;i++)rr(c,cx(o,.12+i*.20),cy(o,.23),o.w*.15,o.h*.38,9,i%2?PURPLE:NAVY);
   }
 }else if(s.loai==="vat_the_minh_hoa"){
   if(/sổ|ledger|column/.test(h)){
     rr(c,cx(o,.29),cy(o,.12),o.w*.43,o.h*.63,12,INK);
     rr(c,cx(o,.34),cy(o,.17),o.w*.34,o.h*.53,9,STONE);
     line(c,cx(o,.51),cy(o,.18),cx(o,.51),cy(o,.68),PURPLE,5);
   }else if(/thẻ|hồ sơ|phiếu|sổ/.test(h)){
     rr(c,cx(o,.2),cy(o,.22),o.w*.50,o.h*.50,10,PURPLE);
     rr(c,cx(o,.29),cy(o,.16),o.w*.46,o.h*.52,10,INK);
     rr(c,cx(o,.36),cy(o,.13),o.w*.42,o.h*.53,10,BONE);
   }else{
     rr(c,cx(o,.23),cy(o,.23),o.w*.55,o.h*.42,13,INK);
     for(let i=0;i<6;i++)circle(c,cx(o,.3+i*.085),cy(o,.42),9,TEAL);
   }
 }else if(s.loai==="con_so_lon"){
   rr(c,cx(o,.24),cy(o,.14),o.w*.54,o.h*.55,15,NAVY);
   c.save();c.fillStyle=GOLD;c.font="700 "+Math.round(o.h*.26)+"px Georgia,serif";
   c.textAlign="center";c.textBaseline="middle";c.fillText("?",cx(o,.5),cy(o,.42));c.restore();
 }else if(s.loai==="bieu_do"){
   tickAxis(c,o);
   for(let i=0;i<7;i++){const t=i/7;circle(c,cx(o,.18+t*.66),cy(o,.25+((i*7)%5)*.095),o.h*.024,SPINE);}
 }else if(s.loai==="truc_thoi_gian"){
   rr(c,cx(o,.20),cy(o,.13),o.w*.61,o.h*.48,10,BONE);
   for(let i=0;i<5;i++)circle(c,cx(o,.27+i*.11),cy(o,.43),o.h*.035,i%2?PURPLE:TEAL);
 }else if(s.loai==="mat_cat_lop"){
   rr(c,cx(o,.15),cy(o,.18),o.w*.72,o.h*.44,13,STONE);
   for(let i=0;i<4;i++)bar(c,cx(o,.22+i*.14),cy(o,.27),o.w*.1,o.h*.19,i%2?INK:PURPLE);
 }else if(s.loai==="phong_to_chi_tiet"){
   rr(c,cx(o,.20),cy(o,.12),o.w*.6,o.h*.62,12,STONE);
   circle(c,cx(o,.5),cy(o,.43),o.h*.25,INK);
   circle(c,cx(o,.5),cy(o,.43),o.h*.14,GOLD);
 }else if(s.loai==="ban_do"){
   for(let i=0;i<5;i++)rr(c,cx(o,.15+i*.13),cy(o,.24+Math.sin(i)*.10),o.w*.12,o.h*.3,8,TEAL);
 }
 // Mỗi chuyển pha là mở rộng nguồn -> phép xử lý/kết quả MÔ TẢ TRONG SHOT,
 // không sinh nhãn giả, không chèn flash hay rung nền.
}

export function khungVatShot(t,F){
 const s=findShot(t),doc=F.ten==="9x16";
 const pct=cl(s.vat_chinh_pct/100,.30,.78);
 // N: cạnh phải < 79% W = 1516px, cách PiP bắt đầu x=1552px.
 // D: khung vật bắt đầu y=30%, hoàn toàn dưới PiP kết thúc 26,5% H.
 // Quyết 016: không nhốt vật trong thẻ ~30% frame. Khung chính trải rộng
 // 91% bề ngang tại vùng y nằm hoàn toàn DƯỚI PiP; vật/ảnh có quyền tràn rộng.
 const w=F.W*.91;
 const h=F.H*(doc?.442:.47);
 const x=F.W*.045,y=F.H*(doc?.285:.236);
 return [x,y,x+w,y+h];
}
export function veCanhShot(rc,img){
 const {ctx,t,fmt}=rc,s=findShot(t);
 const [x,y,x1,y1]=khungVatShot(t,fmt);
 const o={x,y,w:x1-x,h:y1-y},p=cl((t-s.t0)/max(.05,s.t1-s.t0));
 ctx.save();
 // Lớp xa trải toàn bộ vùng nhìn trên dải phụ đề: thiên văn thật có
 // không gian tối; tư liệu/đồ thị có giấy K3. Không thêm bản lề thẻ chung.
 ctx.restore();
 if(s.loai==="mo_hinh_3d"||s.loai==="quy_dao_chuyen_dong"){
   ctx.fillStyle=NAVY;ctx.fillRect(0,0,rc.W,rc.H*.73);
   for(let i=0;i<26;i++)circle(ctx,rc.W*((i*29+7)%101)/101,rc.H*((i*19+13)%70)/100,1.6,BONE);
 }else if(s.loai==="anh_that"){
   // Ảnh hiện tràn chiều rộng; nền tối tăng độ rõ nguồn ảnh, không giả tạo bản ghi NP.
   ctx.fillStyle="#514B47";ctx.fillRect(0,rc.H*.08,rc.W,rc.H*.64);
 }
 ctx.save();ctx.beginPath();ctx.rect(x,y,o.w,o.h);ctx.clip();
 if(!veTranhRieng(rc,o,s,p,img)){
   if(p<.48) veBuocDau(rc,o,s,p/.48,img);
   else PAINTERS[s.loai](rc,o,s,(p-.48)/.52,img);
 }
 ctx.restore();
 // Không vẽ khung thẻ bao quanh shot; các vật/biểu đồ có bóng, viền riêng.
 label(rc,o,s);
}
