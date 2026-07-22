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

await edit("assets/gate.js", (source) => {
  const oldCommunityStart = source.indexOf("  function injectCommunity() {");
  const oldCommunityEnd = oldCommunityStart >= 0 ? source.indexOf("\n  function ", oldCommunityStart + 10) : -1;
  const communityBlock = `  function injectCommunity() {
    if (APP !== "boitoan" || document.getElementById("gate-community-link")) return;
    var link = document.createElement("a");
    link.id = "gate-community-link";
    link.className = "gate-community-link";
    link.href = new URL("community.html", location.href).href;
    link.innerHTML = '<span aria-hidden="true">◈</span><span>Cộng đồng</span>';
    link.setAttribute("aria-label", "Mở cộng đồng Khách và Reader");

    var nav = document.querySelector(".bottom-nav, .bottom-tabs, nav[aria-label], nav.fixed-bottom");
    if (nav) {
      link.classList.add("gate-community-link--nav");
      nav.insertBefore(link, nav.firstChild);
      return;
    }

    var header = document.querySelector("header, .app-header, .hero, .brand");
    if (header) {
      link.classList.add("gate-community-link--inline");
      header.insertAdjacentElement("afterend", link);
      return;
    }

    link.classList.add("gate-community-link--fallback");
    document.body.appendChild(link);
  }

`;
  if (oldCommunityStart >= 0 && oldCommunityEnd > oldCommunityStart) {
    source = source.slice(0, oldCommunityStart) + communityBlock + source.slice(oldCommunityEnd + 1);
  } else {
    source = insertOnce(source, "  function reveal(method) {", communityBlock, "nút Cộng đồng");
  }

  const brandBlock = `  function normalizeMarketBranding() {
    if (APP !== "boitoan") return;
    document.documentElement.classList.add("gate-brand-market");
    var replacements = [
      [/Hiên Nhi Hiên 89/g, "Cái Chợ của Hiên Nhi"],
      [/Hiên Nhi 89/g, "Cái Chợ của Hiên Nhi"],
      [/\s*[·•-]?\s*khu vực riêng tư/gi, ""],
      [/\s*[·•-]?\s*riêng tư/gi, ""],
      [/\s*[·•-]?\s*Không lập chỉ mục/gi, ""],
      [/\s*[·•-]?\s*Truy cập được ghi nhận/gi, ""]
    ];
    function clean(root) {
      var walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
      var nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(function (node) {
        if (!node.parentElement || /^(SCRIPT|STYLE|TEXTAREA|INPUT)$/i.test(node.parentElement.tagName)) return;
        var text = node.nodeValue;
        replacements.forEach(function (item) { text = text.replace(item[0], item[1]); });
        text = text.replace(/\s+·\s*$/g, "").replace(/\s{2,}/g, " ");
        if (text !== node.nodeValue) node.nodeValue = text;
      });
    }
    clean(document.body);
    if (!window.__marketBrandObserver) {
      window.__marketBrandObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType === 1) clean(node);
            else if (node.nodeType === 3 && node.parentElement) clean(node.parentElement);
          });
        });
      });
      window.__marketBrandObserver.observe(document.body, { childList: true, subtree: true });
    }
  }

`;
  if (!source.includes("function normalizeMarketBranding()")) {
    source = insertOnce(source, "  function reveal(method) {", brandBlock, "nhận diện Cái Chợ của Hiên Nhi");
  }

  if (!source.includes("    injectCommunity();\n    normalizeMarketBranding();")) {
    source = source.replace(
      "    injectAdvice();\n    trackAccess",
      "    injectAdvice();\n    injectCommunity();\n    normalizeMarketBranding();\n    trackAccess"
    );
  }
  source = source.replace(
    'var name = String(CFG.owner);',
    'var name = APP === "boitoan" ? "Cái Chợ của Hiên Nhi" : String(CFG.owner);'
  );
  source = source.replace(
    'var bot = document.createElement("div"); bot.className = "gate-owner-bottom"; bot.textContent = "✦ " + name + " · khu vực riêng tư ✦";',
    'var bot = document.createElement("div"); bot.className = "gate-owner-bottom"; bot.textContent = "✦ " + name + " ✦";'
  );
  if (!source.includes('localStorage.removeItem("community_token_boitoan")')) {
    source = source.replace(
      '        if (APP === "boitoan") localStorage.removeItem(TOKEN_KEY);',
      '        if (APP === "boitoan") {\n          localStorage.removeItem(TOKEN_KEY);\n          localStorage.removeItem("community_token_boitoan");\n        }'
    );
  }
  return source;
});

await edit("assets/gate.css", (source) => {
  const marker = "/* ===== CÁI CHỢ CỦA HIÊN NHI: COMMUNITY + BRAND PATCH ===== */";
  const index = source.indexOf(marker);
  if (index >= 0) source = source.slice(0, index).trimEnd() + "\n";
  return source + `

${marker}
:root {
  --market-font-sans: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --market-font-serif: ui-serif, "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
}
.gate-brand-market body { font-family: var(--market-font-sans); }
.gate-brand-market .gate-owner-top,
.gate-brand-market .gate-owner-bottom {
  font-family: var(--market-font-serif);
  font-weight: 650;
  letter-spacing: .09em;
}
.gate-brand-market .gate-owner-bg {
  inset: 7% -12%;
  transform: rotate(-20deg);
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  align-content: space-around;
  gap: 9vh 7vw;
  white-space: normal;
  font-size: clamp(18px, 4vw, 46px);
  color: rgba(158, 126, 218, .055);
  text-align: center;
}
.gate-brand-market .gate-owner-bg::before {
  content: "Cái Chợ của Hiên Nhi   ◈   Cái Chợ của Hiên Nhi   ◈   Cái Chợ của Hiên Nhi   ◈   Cái Chợ của Hiên Nhi   ◈   Cái Chợ của Hiên Nhi   ◈   Cái Chợ của Hiên Nhi   ◈   Cái Chợ của Hiên Nhi   ◈   Cái Chợ của Hiên Nhi   ◈   Cái Chợ của Hiên Nhi";
}
.gate-brand-market .gate-owner-bg { font-size: 0; }
.gate-brand-market .gate-owner-bg::before {
  font: 650 clamp(18px, 4vw, 46px)/2.8 var(--market-font-serif);
  word-spacing: 2.5vw;
}
.gate-community-link {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 44px;
  padding: 9px 14px;
  border: 1px solid rgba(212,169,78,.72);
  border-radius: 999px;
  background: linear-gradient(145deg, rgba(64,47,18,.96), rgba(24,17,10,.96));
  color: #fff1c8;
  font: 750 14px/1 var(--market-font-sans);
  text-decoration: none;
  box-shadow: 0 8px 22px #0008, inset 0 0 18px #d4a94e14;
  -webkit-tap-highlight-color: transparent;
}
.gate-community-link > span:first-child { color: #eacb78; font-size: 17px; }
.gate-community-link--nav {
  position: static !important;
  flex: 0 0 auto;
  min-width: 88px;
  margin: 0 4px;
  padding: 8px 11px;
  border-radius: 14px;
  box-shadow: none;
}
.gate-community-link--inline {
  position: relative;
  z-index: 20;
  width: fit-content;
  margin: 10px auto 4px;
}
.gate-community-link--fallback {
  position: fixed;
  z-index: 2147483001;
  right: 12px;
  bottom: calc(150px + env(safe-area-inset-bottom));
}
@media (max-width: 520px) {
  .gate-community-link--nav { min-width: 72px; padding: 7px 8px; font-size: 12px; }
  .gate-community-link--fallback { right: 8px; bottom: calc(152px + env(safe-area-inset-bottom)); }
  .gate-brand-market .gate-owner-top,
  .gate-brand-market .gate-owner-bottom { font-size: 10px; max-width: calc(100vw - 24px); overflow: hidden; text-overflow: ellipsis; }
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

console.log("Đã áp dụng lớp Khách / Reader / Admin và nhận diện Cái Chợ của Hiên Nhi.");
