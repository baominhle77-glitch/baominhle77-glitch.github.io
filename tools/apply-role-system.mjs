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
  const functionBlock = `  function injectCommunity() {
    if (APP !== "boitoan" || document.getElementById("gate-community-link")) return;
    var link = document.createElement("a");
    link.id = "gate-community-link";
    link.className = "gate-community-link";
    link.href = new URL("community.html", location.href).href;
    link.textContent = "✦ Cộng đồng";
    link.setAttribute("aria-label", "Mở cộng đồng Khách và Reader");
    document.body.appendChild(link);
  }

`;
  source = insertOnce(source, "  function reveal(method) {", functionBlock, "nút Cộng đồng");
  if (!source.includes("    injectCommunity();\n    trackAccess")) {
    source = source.replace("    injectAdvice();\n    trackAccess", "    injectAdvice();\n    injectCommunity();\n    trackAccess");
  }
  if (!source.includes('localStorage.removeItem("community_token_boitoan")')) {
    source = source.replace(
      '        if (APP === "boitoan") localStorage.removeItem(TOKEN_KEY);',
      '        if (APP === "boitoan") {\n          localStorage.removeItem(TOKEN_KEY);\n          localStorage.removeItem("community_token_boitoan");\n        }'
    );
  }
  return source;
});

await edit("assets/gate.css", (source) => {
  if (source.includes(".gate-community-link")) return source;
  return source + `

.gate-community-link {
  position: fixed; z-index: 2147483000;
  left: 12px; bottom: calc(18px + env(safe-area-inset-bottom));
  min-height: 48px; display: inline-flex; align-items: center; justify-content: center;
  padding: 0 17px; border: 2px solid #d4a94e; border-radius: 999px;
  background: linear-gradient(180deg, #4a3919, #241a0c); color: #fff3cf;
  font: 800 15px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  text-decoration: none; box-shadow: 0 10px 32px #000a, 0 0 0 4px #d4a94e22;
}
.gate-community-link:focus-visible { outline: 3px solid #a98fe0; outline-offset: 3px; }
@media (max-width: 480px) { .gate-community-link { left: 8px; bottom: calc(14px + env(safe-area-inset-bottom)); } }
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

console.log("Đã áp dụng lớp tích hợp Khách / Reader / Admin.");
