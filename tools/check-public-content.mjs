import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";

const ROOT = resolve(".");
const DEFAULT_ROOTS = [
  "index.html",
  "assets/gate.js",
  "assets/community.js",
  "boitoan/index.html",
  "boitoan/community.html",
  "medora/index.html",
  "vietnam-travel/index.html",
  "vietnam-travel/app.js",
  "hoi-chon-dung/index.html",
  "hoi-chon-dung/app.js"
];

const FORBIDDEN = [
  [/(?:chủ sở hữu|chu so huu)/iu, "nội dung dành cho chủ sở hữu"],
  [/owner[-_ ]?only/iu, "nhãn owner-only"],
  [/onboarding_required/iu, "trạng thái onboarding nội bộ"],
  [/(?:api key|worker secret|trigger secret)/iu, "credential hoặc secret nội bộ"],
  [/(?:cloudflare worker|workers kv|\bcron\b)/iu, "tên hạ tầng nội bộ"],
  [/(?:production mode|source deploy|workflow deploy|runtime source)/iu, "trạng thái triển khai nội bộ"],
  [/(?:autopilot)/iu, "tên cơ chế vận hành nội bộ"],
  [/(?:đang kết nối nguồn affiliate|đang hoàn tất kết nối mạng affiliate)/iu, "trạng thái nguồn affiliate nội bộ"],
  [/(?:công ty đang tải trạng thái|công ty tự tuyển nguồn|chế độ dự phòng)/iu, "báo cáo vận hành công ty"],
  [/(?:không phải chọn sản phẩm hay gắn từng link|không cần chọn sản phẩm hoặc gắn link thủ công)/iu, "hướng dẫn dành cho chủ sở hữu"],
];

function stripHtml(source) {
  return source
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractJsStrings(source) {
  const withoutComments = source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1 ");
  const strings = [];
  const pattern = /(["'`])((?:\\.|(?!\1)[\s\S])*?)\1/g;
  for (const match of withoutComments.matchAll(pattern)) strings.push(match[2]);
  return strings.join(" ").replace(/\\n|\\r|\\t/g, " ");
}

async function collect(path) {
  const absolute = resolve(path);
  try {
    const entries = await readdir(absolute, { withFileTypes: true });
    const nested = [];
    for (const entry of entries) {
      if (["node_modules", ".git", "backend", "tools", "docs", ".github"].includes(entry.name)) continue;
      const child = join(absolute, entry.name);
      if (entry.isDirectory()) nested.push(...await collect(child));
      else if ([".html", ".js"].includes(extname(entry.name)) && !/admin|\.test\./i.test(entry.name)) nested.push(child);
    }
    return nested;
  } catch (_) {
    return [absolute];
  }
}

const requested = process.argv.slice(2);
const inputs = requested.length ? requested : DEFAULT_ROOTS;
const files = [...new Set((await Promise.all(inputs.map(collect))).flat())];
const violations = [];

for (const file of files) {
  let source;
  try {
    source = await readFile(file, "utf8");
  } catch (_) {
    continue;
  }
  const publicText = extname(file) === ".html" ? stripHtml(source) : extractJsStrings(source);
  for (const [pattern, label] of FORBIDDEN) {
    const match = publicText.match(pattern);
    if (match) violations.push(`${relative(ROOT, file)}: ${label} → “${match[0]}”`);
  }
}

if (violations.length) {
  console.error("PUBLIC_CONTENT_BOUNDARY_FAILED");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(`public-content-ok: ${files.length} file công khai không chứa nội dung owner/internal bị cấm`);
