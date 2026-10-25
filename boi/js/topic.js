// Nhận diện chủ đề câu hỏi → gợi ý mẫu trải + giọng văn phù hợp.
const norm = (s) => String(s || "").toLowerCase().normalize("NFC");

const RULES = {
  tien: /tiền|thu nhập|lương|doanh (thu|số)|kinh doanh|tài chính|lãi|lỗ|nợ|đầu tư|buôn|bán hàng|kiếm|khách hàng|giàu|tài lộc|hoa hồng|thưởng|chứng khoán|coin|vốn/u,
  tinh: /tình|yêu|người ấy|crush|người yêu|vợ|chồng|hôn nhân|cưới|chia tay|quay lại|nhắn tin|anh ấy|cô ấy|đối phương|ngoại tình|duyên/u,
  cokhong: /có nên|nên không|được không|có .{1,40} không\??$|liệu|hay không|đúng không|thật không|có phải/u,
  viec: /công việc|việc làm|xin việc|nghỉ việc|chuyển việc|đổi việc|sếp|đồng nghiệp|phỏng vấn|thi cử|kỳ thi|đi thi|thi đỗ|đỗ đại học|thi đại học|trượt|thăng chức|thăng tiến|sự nghiệp|dự án|công ty|học hành|học tập|học bổng|du học/u,
  suckhoe: /sức khoẻ|sức khỏe|bệnh|ốm|đau|khám|phẫu thuật|mổ|mang thai|có bầu|sinh con|điều trị/u,
  vanhan: /vận hạn|hạn|xui|giải hạn|sao chiếu|tai ương|kiếp nạn|đen đủi/u,
  nam: /cả năm|năm (19|20)\d\d|năm tới|năm nay|năm sau|12 tháng|từng tháng|mười hai tháng/u,
  ba_thang: /(3|ba) tháng|quý (này|tới|sau)|mấy tháng|tháng tới|tháng sau/u,
};

export function detectTopics(question) {
  const q = norm(question).trim();
  const hit = {};
  for (const [k, re] of Object.entries(RULES)) hit[k] = re.test(q);
  const yearMatch = q.match(/năm ((?:19|20)\d\d)/u);
  return { ...hit, year: yearMatch ? Number(yearMatch[1]) : null };
}

// Chủ đề chính dùng cho giọng văn: tien | tinh | viec | suckhoe | cokhong | vanhan | chung
export function mainTopic(question) {
  const t = detectTopics(question);
  if (t.vanhan) return "vanhan";
  if (t.tien || t.nam) return "tien";
  if (t.tinh) return "tinh";
  if (t.viec) return "viec";
  if (t.suckhoe) return "suckhoe";
  if (t.cokhong) return "cokhong";
  return "chung";
}

export function suggestSpread(question) {
  const t = detectTopics(question);
  const why = [];
  let id;
  if (t.vanhan) { id = "vanhan"; why.push("câu hỏi nói về vận hạn/xui rủi"); }
  else if (t.nam && /12 tháng|từng tháng|mười hai tháng/u.test(norm(question))) { id = "12thang"; why.push("câu hỏi cần xem từng tháng trong năm"); }
  else if (t.nam) { id = "canam"; why.push("câu hỏi nhìn tổng thể cả năm"); }
  else if (t.tinh) { id = "tinhcam"; why.push(t.cokhong ? "câu hỏi tình cảm (dạng Có/Không vẫn đọc được trong trải tình cảm)" : "câu hỏi về tình cảm"); }
  else if (t.cokhong && !t.ba_thang) { id = "cokhong"; why.push("câu hỏi dạng Có/Không"); }
  else if (t.tien || t.ba_thang) { id = "3thang"; why.push(t.tien ? "câu hỏi về tiền/thu nhập" : "câu hỏi về vài tháng tới"); }
  else { id = "tudo"; why.push("không thấy chủ đề rõ — tự đặt tầng"); }
  return { id, why: why.join(", "), money: !!(t.tien || (t.nam && !t.tinh)), year: t.year, topics: t };
}
