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
    if (!window.__marketBrandObserver) {
      window.__marketBrandObserver = new MutationObserver(function () {
        injectCommunity();
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
