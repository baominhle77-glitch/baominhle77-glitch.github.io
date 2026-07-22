import { readFile, writeFile } from "node:fs/promises";

async function edit(path, mutate) {
  const before = await readFile(path, "utf8");
  const after = mutate(before);
  if (after !== before) await writeFile(path, after);
}

function insertOnce(source, marker, addition, label) {
  if (source.includes(addition.trim())) return source;
  const index = source.indexOf(marker);
  if (index < 0) throw new Error(`Không tìm thấy điểm nối ${label}`);
  return source.slice(0, index) + addition + source.slice(index);
}

await edit("backend/worker.js", (source) => {
  if (!source.includes('import { handleCommunity } from "./community.js";')) {
    source = 'import { handleCommunity } from "./community.js";\n' + source;
  }
  source = source.replace(
    '"Access-Control-Allow-Headers": "content-type, authorization",',
    '"Access-Control-Allow-Headers": "content-type, authorization, x-owner-device-id",'
  );
  if (!source.includes("const communityResponse = await handleCommunity")) {
    const routePattern = /(\n[ \t]*try \{\r?\n)([ \t]*if \(url\.pathname === "\/api\/request")/;
    const match = source.match(routePattern);
    if (!match) throw new Error("Không tìm thấy điểm nối Worker community API");
    const indent = match[2].match(/^[ \t]*/)[0];
    const hook = `${match[1]}${indent}const communityResponse = await handleCommunity(request, env);\n${indent}if (communityResponse) return withCors(communityResponse, cors);\n\n${match[2]}`;
    source = source.replace(routePattern, hook);
  }
  return source;
});

await edit("boitoan/index.html", (source) => {
  source = source
    .replace(/owner:\s*'Hiên Nhi Hiên 89'/, "owner: 'Cái Chợ của Hiên Nhi'")
    .replace(/title:\s*'Bói Toán\s*·\s*Riêng tư'/i, "title: 'Cái Chợ của Hiên Nhi'")
    .replace(/subtitle:\s*'Nhập mật khẩu để mở kho tra cứu\.'/i, "subtitle: 'Mở kho tra cứu và luận giải.'");
  return source;
});

await edit("assets/gate.js", (source) => {
  const marketBlock = `  function marketSigil() {
    return '<span class="market-sigil" aria-hidden="true"></span>';
  }

  function injectCommunity() {
    if (APP !== "boitoan" || document.getElementById("gate-community-link")) return;
    var nav = document.querySelector("body nav");
    if (!nav) {
      setTimeout(injectCommunity, 80);
      return;
    }
    var link = document.createElement("a");
    link.id = "gate-community-link";
    link.className = "gate-community-link";
    link.href = new URL("community.html", location.href).href;
    link.innerHTML = '<span class="i">✦</span><span class="market-nav-label">Cộng đồng</span>';
    link.setAttribute("aria-label", "Mở Cái Chợ của Hiên Nhi");
    nav.appendChild(link);
    document.body.classList.add("market-has-community-nav");
  }

  function marketGuide(screenId, title, intro, points) {
    var screen = document.getElementById(screenId);
    if (!screen || screen.querySelector(":scope > .market-guide")) return;
    var panel = document.createElement("details");
    panel.className = "market-guide";
    var summary = document.createElement("summary");
    summary.textContent = title;
    var lead = document.createElement("p");
    lead.className = "market-guide-lead";
    lead.textContent = intro;
    var list = document.createElement("ol");
    points.forEach(function (text) {
      var item = document.createElement("li");
      item.textContent = text;
      list.appendChild(item);
    });
    panel.append(summary, lead, list);
    var firstPanel = screen.querySelector(":scope > .panel");
    if (firstPanel) firstPanel.insertAdjacentElement("afterend", panel);
    else screen.appendChild(panel);
  }

  function addMarketGuides() {
    marketGuide("scr-tarot", "Khung luận Tarot 7 tầng",
      "Không đọc từng lá rời. Hãy đi từ câu hỏi, vị trí và hình ảnh đến mạch chung của toàn trải bài.", [
        "Xác định đúng câu hỏi, phạm vi thời gian và vai trò của từng vị trí trong trải bài.",
        "Đọc hình ảnh trước từ khóa: hướng nhìn, chuyển động, màu sắc, vật thể nổi bật và cảm giác đầu tiên.",
        "Ghép số học, nguyên tố, Ẩn chính–Ẩn phụ và phẩm chất của bộ Hoàng gia.",
        "Phân biệt thuận/nghịch như hai cách biểu hiện của cùng một năng lượng, không mặc định nghịch là xấu.",
        "Tìm lá trội, nguyên tố thiếu, cặp tương hỗ hoặc xung đột và các biểu tượng lặp.",
        "Đọc quan hệ giữa các lá theo câu chuyện: nguyên nhân → trạng thái → hướng phát triển.",
        "Kết luận thành thông điệp có điều kiện, rủi ro, cơ hội và hành động thực tế."
      ]);
    marketGuide("scr-lenormand", "Khung luận Lenormand theo cú pháp",
      "Lenormand mạnh ở sự cụ thể. Ý nghĩa chính hình thành từ lá đứng cạnh nhau, hướng và vị trí trong cụm.", [
        "Giữ câu hỏi ngắn, rõ chủ thể và khung thời gian; tránh hỏi nhiều việc trong một lần.",
        "Xác định lá chủ đề rồi đọc lá kế bên như từ bổ nghĩa, động từ hoặc hoàn cảnh.",
        "Với 3 lá, đọc theo cụm 1+2, 2+3 và câu hoàn chỉnh 1→2→3.",
        "Với 9 lá, ưu tiên lá trung tâm, hàng–cột–chéo và các cụm chạm trực tiếp trung tâm.",
        "Theo dõi hướng nhìn/chuyển động, khoảng cách và nhóm chủ đề: người, tin tức, công việc, tiền, trở ngại.",
        "Không tách từng lá thành bài diễn văn; chốt bằng một câu cụ thể rồi mới mở rộng điều kiện."
      ]);
    marketGuide("scr-baitay", "Khung luận Bài Tây truyền thống",
      "Luận theo chất bài, màu, cấp số và nhịp tiến triển giữa các lá thay vì chỉ tra một nghĩa cố định.", [
        "Chất Cơ thiên về cảm xúc–quan hệ; Rô về vật chất–tin tức; Chuồn về công việc–hành động; Bích về thử thách–kết thúc.",
        "Đọc số như giai đoạn phát triển; lá hình là người, vai trò hoặc cách hành xử.",
        "Đối chiếu đỏ/đen, chất trội/chất vắng và cặp cùng số để nhận ra thuận lợi hay ma sát.",
        "Trải 3–5 lá phải có mạch thời gian hoặc mạch nguyên nhân, không cộng nghĩa cơ học.",
        "Chốt điều kiện có thể thay đổi kết quả và hành động kiểm chứng được."
      ]);
    marketGuide("scr-kinhdich", "Khung luận Kinh Dịch",
      "Một quẻ không chỉ là tốt/xấu; trọng tâm là thời, thế, vị và cách chuyển đúng với hoàn cảnh.", [
        "Đọc quẻ chủ để nhận diện tình thế hiện tại và nguyên tắc vận hành.",
        "Xem tượng quẻ, Thoán và cấu trúc nội–ngoại quái trước khi đi vào chi tiết.",
        "Hào động cho biết điểm biến đổi; xét vị trí hào, đắc trung/đắc chính và quan hệ ứng–thừa–tỷ.",
        "Quẻ biến mô tả hướng chuyển khi tác động của hào động được thực hiện.",
        "Kết luận theo ba phần: nên giữ gì, nên đổi gì và dấu hiệu nào cho thấy thời đã chuyển."
      ]);
    marketGuide("scr-tuvi", "Khung luận Tử Vi nhiều lớp",
      "Không kết luận từ một sao đơn lẻ. Cần đọc cung, chính tinh, phụ tinh và hệ liên kết toàn lá số.", [
        "Bắt đầu từ Mệnh–Thân, cục và quan hệ sinh khắc tổng thể.",
        "Đọc chính tinh theo trạng thái và bối cảnh cung; phụ tinh làm rõ cách biểu hiện.",
        "Xét tam phương tứ chính, giáp cung, xung chiếu và các bộ sao trước khi chốt.",
        "Phân biệt bản chất lâu dài với vận hạn theo đại vận, tiểu vận và lưu niên.",
        "Nêu cả năng lực, điểm dễ lệch và điều kiện kích hoạt; tránh định mệnh hóa."
      ]);
    marketGuide("scr-battu", "Khung luận Bát Tự cân bằng khí",
      "Trọng tâm là Nhật chủ trong mùa sinh và dòng khí toàn cục, không phải đếm ngũ hành đơn giản.", [
        "Xác định vượng suy theo tiết khí, nguyệt lệnh, thông căn, thấu can và tàng can.",
        "Đọc Thập thần theo vai trò và quan hệ với Nhật chủ, không gắn nhãn tốt/xấu cố định.",
        "Xem tổ hợp hợp–xung–hình–hại và khả năng hóa khí trong đúng điều kiện.",
        "Chọn hỷ/kỵ theo nhu cầu cân bằng thực tế của mệnh cục; tránh dùng một công thức cho mọi lá số.",
        "Đối chiếu đại vận–lưu niên để nhận thời điểm kích hoạt và mức độ biến động."
      ]);
  }

  function cardNames(result) {
    return Array.prototype.map.call(result.querySelectorAll(".tcard .nm"), function (node) {
      return node.textContent.trim();
    }).filter(Boolean);
  }

  function renderMarketSynthesis(result, kind) {
    var old = result.querySelector(":scope > .market-dynamic-analysis");
    if (old) old.remove();
    var names = cardNames(result);
    if (!names.length) return;
    var box = document.createElement("section");
    box.className = "market-dynamic-analysis";
    var heading = document.createElement("h3");
    heading.textContent = "✦ Kết nối toàn trải bài";
    var flow = document.createElement("p");
    flow.innerHTML = "<strong>Mạch lá:</strong> " + names.join(" → ");
    var note = document.createElement("p");
    if (kind === "lenormand" && names.length > 1) {
      var pairs = [];
      for (var i = 0; i < names.length - 1; i++) pairs.push(names[i] + " + " + names[i + 1]);
      note.innerHTML = "<strong>Cặp cần đọc:</strong> " + pairs.join(" · ");
    } else if (kind === "tarot") {
      note.textContent = names.length === 1
        ? "Đọc lá này theo câu hỏi và lĩnh vực đã chọn; tách cơ hội, bóng tối và hành động."
        : "Đọc sự chuyển dịch giữa các vị trí, sau đó kiểm tra lá/biểu tượng/nguyên tố lặp trước khi kết luận.";
    } else {
      note.textContent = "Đọc chiều chuyển của chuỗi, chất bài trội và điểm đổi nhịp; không cộng nghĩa từng lá một cách máy móc.";
    }
    box.append(heading, flow, note);
    result.appendChild(box);
  }

  function watchMarketResult(id, kind) {
    var result = document.getElementById(id);
    if (!result || result.getAttribute("data-market-watch") === "1") return;
    result.setAttribute("data-market-watch", "1");
    var options = { childList: true, subtree: true };
    var observer = new MutationObserver(function () {
      observer.disconnect();
      renderMarketSynthesis(result, kind);
      observer.observe(result, options);
    });
    observer.observe(result, options);
    renderMarketSynthesis(result, kind);
  }

  function applyMarketBranding() {
    if (APP !== "boitoan") return;
    document.body.classList.add("market-brand");
    document.title = "Cái Chợ của Hiên Nhi · Bói toán";
    var headerTitle = document.querySelector("#gate-content .wrap > header h1, body > .wrap > header h1");
    if (headerTitle && !headerTitle.classList.contains("market-brand-title")) {
      headerTitle.classList.add("market-brand-title");
      headerTitle.innerHTML = marketSigil() + '<span>Cái Chợ của Hiên Nhi</span>';
    }
    injectCommunity();
    addMarketGuides();
    watchMarketResult("tarotResult", "tarot");
    watchMarketResult("lenResult", "lenormand");
    watchMarketResult("btResult", "baitay");
    if (!window.__marketBrandObserver) {
      window.__marketBrandObserver = new MutationObserver(function () {
        injectCommunity();
        addMarketGuides();
      });
      window.__marketBrandObserver.observe(document.getElementById("gate-content") || document.body, { childList: true, subtree: true });
    }
  }

`;

  source = insertOnce(source, "  function reveal(method) {", marketBlock, "nhận diện Cái Chợ của Hiên Nhi");

  if (!source.includes("    applyMarketBranding();\n    trackAccess")) {
    source = source.replace(
      "    injectAdvice();\n    trackAccess",
      "    injectAdvice();\n    applyMarketBranding();\n    trackAccess"
    );
  }

  source = source
    .replace('var TITLE = CFG.title || "Khu vực riêng tư";', 'var TITLE = CFG.title || "Cái Chợ của Hiên Nhi";')
    .replace('<div class="gate-sigil">🔒</div>', '<div class="gate-sigil market-gate-sigil" aria-hidden="true"><span></span></div>')
    .replace('<div class="gate-foot">Khu vực riêng tư · Không lập chỉ mục · Truy cập được ghi nhận</div>', '<div class="gate-foot">Cái Chợ của Hiên Nhi · Truy cập được ghi nhận</div>')
    .replace('"Chủ sở hữu: " + CFG.owner + " · Khu vực riêng tư · Không lập chỉ mục"', '"Cái Chợ của Hiên Nhi · Truy cập được ghi nhận"')
    .replace('var bg = document.createElement("div"); bg.className = "gate-owner-bg"; bg.textContent = name;', 'var bg = document.createElement("div"); bg.className = "gate-owner-pattern";\n    for (var i = 0; i < 18; i++) { var mark = document.createElement("span"); mark.textContent = name; bg.appendChild(mark); }')
    .replace('bot.textContent = "✦ " + name + " · khu vực riêng tư ✦";', 'bot.textContent = "✦ " + name + " ✦";');

  if (!source.includes('localStorage.removeItem("community_token_boitoan")')) {
    source = source.replace(
      '        if (APP === "boitoan") localStorage.removeItem(TOKEN_KEY);',
      '        if (APP === "boitoan") {\n          localStorage.removeItem(TOKEN_KEY);\n          localStorage.removeItem("community_token_boitoan");\n        }'
    );
  }
  return source;
});

await edit("assets/gate.css", (source) => {
  if (source.includes("/* Cái Chợ của Hiên Nhi: runtime integration */")) return source;
  return source + `

/* Cái Chợ của Hiên Nhi: runtime integration */
.gate-app-boitoan body {
  font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", sans-serif !important;
  text-rendering: optimizeLegibility;
}
.gate-app-boitoan h1, .gate-app-boitoan h2, .gate-app-boitoan h3,
.gate-app-boitoan .btn, .gate-app-boitoan .back {
  font-family: ui-serif, "New York", "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif !important;
}
.market-gate-sigil, .market-sigil {
  position: relative; display: inline-block; width: 42px; height: 42px;
  border: 1px solid #d4a94eaa; border-radius: 50%;
  background: radial-gradient(circle at 38% 34%, #8b6fd066, #171124 64%);
  box-shadow: 0 0 0 5px #d4a94e12, inset 0 0 20px #8b6fd055;
}
.market-gate-sigil { margin: 0 auto 13px; }
.market-gate-sigil::before, .market-sigil::before {
  content: ""; position: absolute; left: 10px; top: 9px; width: 17px; height: 17px;
  border: 2px solid #f5dfa1; border-radius: 50%; box-shadow: 6px 1px 0 -1px #171124;
  transform: rotate(-17deg);
}
.market-gate-sigil::after, .market-sigil::after {
  content: "✦"; position: absolute; right: 6px; top: 4px; color: #f5dfa1;
  font-size: 12px; text-shadow: 0 0 10px #f5dfa1bb;
}
.market-gate-sigil span { display: none; }
.market-brand-title {
  display: flex !important; align-items: center; justify-content: center; gap: 11px;
  text-transform: none !important; letter-spacing: .055em !important;
  font-size: clamp(1.18rem, 5vw, 1.48rem) !important;
}
.market-brand-title .market-sigil { width: 34px; height: 34px; flex: 0 0 34px; }
.market-brand-title .market-sigil::before { left: 7px; top: 6px; width: 14px; height: 14px; }
.market-brand-title .market-sigil::after { right: 5px; top: 3px; font-size: 10px; }

.gate-app-boitoan nav {
  display: grid !important; grid-template-columns: repeat(5, minmax(0, 1fr));
  align-items: stretch; justify-content: initial !important; gap: 0;
}
.gate-app-boitoan nav button, .gate-community-link {
  min-width: 0; width: 100%; min-height: 52px; padding: 2px 2px !important;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
  color: var(--ink-faint, #6f668f); background: none; border: 0;
  font: 400 .62rem/1.15 ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  text-decoration: none; text-align: center;
}
.gate-community-link .i { color: #d4a94e; font-size: 1.25rem; line-height: 1; }
.gate-community-link .market-nav-label { color: #d4a94e; overflow-wrap: anywhere; }
.gate-community-link:focus-visible { outline: 2px solid #a98fe0; outline-offset: -2px; border-radius: 8px; }

.gate-owner-pattern {
  position: absolute; inset: -22vh -25vw; display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr)); grid-auto-rows: 18vh;
  align-items: center; justify-items: center; transform: rotate(-22deg) scale(1.08);
  opacity: .075;
}
.gate-owner-pattern span {
  color: #8b6fd0; font: 700 clamp(17px, 3.4vw, 38px)/1.1 ui-serif, Georgia, serif;
  letter-spacing: .055em; white-space: nowrap; user-select: none;
}
.gate-owner-top, .gate-owner-bottom { font-family: ui-serif, "New York", Georgia, serif; }

.market-guide {
  margin: 12px 0; border: 1px solid #8b6fd066; border-radius: 14px;
  background: linear-gradient(155deg, #211831dd, #151020dd); overflow: hidden;
}
.market-guide summary {
  cursor: pointer; list-style: none; padding: 13px 15px; color: #f5dfa1;
  font: 700 .93rem/1.3 ui-serif, "New York", Georgia, serif;
}
.market-guide summary::-webkit-details-marker { display: none; }
.market-guide summary::after { content: "＋"; float: right; color: #8b6fd0; }
.market-guide[open] summary::after { content: "−"; }
.market-guide-lead { margin: 0; padding: 0 15px 9px; color: #c1b7d2; font-size: .82rem; }
.market-guide ol { margin: 0; padding: 0 18px 15px 34px; color: #d9d1e6; font-size: .81rem; }
.market-guide li + li { margin-top: 6px; }

.market-dynamic-analysis {
  margin: 12px 0; padding: 14px; border: 1px solid #d4a94e88; border-radius: 14px;
  background: linear-gradient(145deg, #3a2f1a99, #1d1728dd);
}
.market-dynamic-analysis h3 { margin: 0 0 8px; color: #f5dfa1; font-size: .96rem; }
.market-dynamic-analysis p { margin: 5px 0; color: #ddd5e9; font-size: .83rem; overflow-wrap: anywhere; }

@media (max-width: 380px) {
  .gate-app-boitoan nav button, .gate-community-link { font-size: .56rem; }
  .market-brand-title { font-size: 1.08rem !important; gap: 7px; }
  .market-brand-title .market-sigil { width: 30px; height: 30px; flex-basis: 30px; }
}
`;
});

await edit("boitoan/sw.js", (source) => {
  const oldAssets = '"/assets/gate.css","/assets/gate.js"';
  const newAssets = '"/assets/gate.css","/assets/gate.js","/assets/community.css","/assets/community.js","/assets/community-admin.js"';
  if (!source.includes("/assets/community.js")) {
    if (!source.includes(oldAssets)) throw new Error("Không tìm thấy danh sách asset Bói toán");
    source = source.replace(oldAssets, newAssets);
  }
  return source;
});

console.log("Đã áp dụng hệ thống Khách / Reader / Admin và nhận diện Cái Chợ của Hiên Nhi.");
