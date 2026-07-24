import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { SEED_PRODUCTS } from "../hoi-chon-dung/data/seed-products.js";

const SITE = "https://hiennhi89.pages.dev";
const APP_PATH = "/hoi-chon-dung";
const API_DEFAULT = "https://hiennhi89-gate.hiennhi89.workers.dev/api/choice/products";
const OUTBOUND_ORIGIN = "https://hiennhi89-gate.hiennhi89.workers.dev";
const DEFAULT_IMAGE = `${SITE}${APP_PATH}/og-image.svg`;

const CATEGORY_CONFIG = Object.freeze({
  tarot: {
    slug: "tarot",
    label: "Tarot và phụ kiện",
    title: "Chọn bộ bài Tarot và phụ kiện phù hợp",
    intro: "So sánh bộ bài, khăn trải và phụ kiện theo kinh nghiệm sử dụng, ngân sách, kích thước và phong cách hình ảnh.",
    guideSlug: "chon-bo-bai-tarot-cho-nguoi-moi",
    guideTitle: "Cách chọn bộ bài Tarot cho người mới",
    guideIntro: "Người mới nên ưu tiên hệ biểu tượng dễ học, kích thước lá vừa tay, chất lượng in rõ và nguồn tài liệu đủ phong phú."
  },
  creator: {
    slug: "sang-tao-noi-dung",
    label: "Thiết bị sáng tạo nội dung",
    title: "Chọn micro, đèn và tripod quay video",
    intro: "So sánh thiết bị quay nội dung theo cổng kết nối, môi trường ghi âm, độ cơ động, tải trọng và ngân sách.",
    guideSlug: "chon-micro-quay-video-bang-dien-thoai",
    guideTitle: "Cách chọn micro quay video bằng điện thoại",
    guideIntro: "Hãy bắt đầu từ cổng kết nối, khoảng cách quay, tiếng ồn môi trường và mức độ di chuyển trước khi chọn micro có dây hay không dây."
  },
  "3d": {
    slug: "in-3d",
    label: "Vật tư in 3D",
    title: "Chọn filament và resin in 3D phù hợp",
    intro: "So sánh PLA, PETG, resin và vật tư theo loại máy, độ bền, độ chi tiết, điều kiện bảo quản và quy trình an toàn.",
    guideSlug: "chon-vat-lieu-in-3d-phu-hop",
    guideTitle: "Cách chọn vật liệu in 3D phù hợp",
    guideIntro: "Chọn vật liệu theo loại máy, mục đích sử dụng, độ bền cần thiết và khả năng kiểm soát nhiệt, độ ẩm hoặc hậu xử lý."
  }
});

function arg(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function esc(value) {
  return clean(value, 10000)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function xml(value) {
  return esc(value);
}

function safeUrl(value) {
  try {
    const url = new URL(clean(value, 2000));
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : "";
  } catch (_) {
    return "";
  }
}

function slug(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function money(value) {
  const amount = Math.max(0, Math.round(Number(value || 0)));
  return amount ? new Intl.NumberFormat("vi-VN").format(amount) + "đ" : "Đang cập nhật";
}

function priceRange(product) {
  const min = Math.max(0, Math.round(Number(product.price_min || 0)));
  const max = Math.max(min, Math.round(Number(product.price_max || min)));
  if (!min) return "Đang cập nhật";
  return min === max ? money(min) : `${money(min)} – ${money(max)}`;
}

function isoDate(value) {
  const date = new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function list(items, fallback) {
  const values = Array.isArray(items) ? items.map((item) => clean(item, 220)).filter(Boolean).slice(0, 6) : [];
  return values.length ? values : [fallback];
}

function normalizeProduct(raw) {
  const category = CATEGORY_CONFIG[raw?.category] ? raw.category : "";
  const id = slug(raw?.id || raw?.name);
  if (!category || !id || !clean(raw?.name, 180)) return null;
  const outboundPath = clean(raw?.outbound_path, 200);
  return {
    id,
    name: clean(raw.name, 180),
    category,
    summary: clean(raw.summary, 900) || `Thông tin tham khảo về ${clean(raw.name, 180)}.`,
    price_min: Math.max(0, Math.round(Number(raw.price_min || 0))),
    price_max: Math.max(0, Math.round(Number(raw.price_max || raw.price_min || 0))),
    currency: clean(raw.currency, 8) || "VND",
    best_for: list(raw.best_for, "Người cần đối chiếu nhu cầu trước khi mua"),
    avoid_if: list(raw.avoid_if, "Cần kiểm tra kỹ thông số và chính sách tại nơi bán"),
    pros: list(raw.pros, "Có thông tin để so sánh trước khi quyết định"),
    cons: list(raw.cons, "Giá và tồn kho có thể thay đổi"),
    tags: Array.isArray(raw.tags) ? raw.tags.map((item) => clean(item, 80)).filter(Boolean).slice(0, 12) : [],
    merchant: clean(raw.merchant, 120) || "Nơi bán",
    link_type: raw.link_type === "affiliate" ? "affiliate" : "reference",
    link_ready: Boolean(raw.link_ready && outboundPath.startsWith("/r/choice/")),
    outbound_url: outboundPath.startsWith("/r/choice/") ? `${OUTBOUND_ORIGIN}${outboundPath}` : "",
    updated_at: isoDate(raw.updated_at),
    image_url: safeUrl(raw.image_url) || DEFAULT_IMAGE,
    votes: Math.max(0, Math.round(Number(raw.votes || raw.votes_base || 0)))
  };
}

async function loadProducts() {
  const input = arg("input");
  if (input) {
    const parsed = JSON.parse(await readFile(resolve(input), "utf8"));
    const rows = Array.isArray(parsed) ? parsed : parsed.products;
    return (rows || []).map(normalizeProduct).filter(Boolean);
  }
  const api = arg("api", API_DEFAULT);
  try {
    const response = await fetch(api, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`catalog_http_${response.status}`);
    const data = await response.json();
    const products = (data.products || []).map(normalizeProduct).filter(Boolean);
    if (products.length) return products;
  } catch (error) {
    console.warn(`SEO catalog fallback: ${error.message}`);
  }
  return SEED_PRODUCTS.map((item) => normalizeProduct({
    ...item,
    link_type: item.affiliate_url ? "affiliate" : "reference",
    link_ready: false,
    outbound_path: "",
    votes: item.votes_base
  })).filter(Boolean);
}

const STYLE = `:root{--paper:#f7f3ea;--white:#fffdf8;--ink:#173b34;--muted:#536963;--forest:#174c43;--mint:#dcece6;--lime:#dce971;--sand:#ead7b5;--line:#d8d1c5}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;line-height:1.65}a{color:inherit}.shell{width:min(1040px,calc(100% - 28px));margin:auto}.top{border-bottom:1px solid var(--line);background:rgba(247,243,234,.94)}.topin{min-height:70px;display:flex;align-items:center;justify-content:space-between;gap:18px}.brand{text-decoration:none;font-weight:900;letter-spacing:.07em}.top nav{display:flex;gap:18px}.top nav a{text-decoration:none;color:var(--muted);font-size:.86rem}.hero{padding:64px 0 42px;background:radial-gradient(circle at 90% 10%,rgba(220,233,113,.45),transparent 28%)}.crumb{font-size:.78rem;color:var(--muted)}h1,h2,h3{font-family:Georgia,serif;font-weight:500;line-height:1.12}h1{font-size:clamp(2.5rem,7vw,5rem);letter-spacing:-.045em;margin:18px 0}.lead{font-size:1.05rem;color:var(--muted);max-width:760px}.price{font-size:1.25rem;font-weight:900;margin-top:22px}.cta{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;border-radius:999px;background:var(--forest);color:white;text-decoration:none;font-weight:850;margin-top:18px}.cta.secondary{background:transparent;color:var(--ink);border:1px solid var(--line)}main{padding:40px 0 80px}.grid{display:grid;grid-template-columns:1.25fr .75fr;gap:24px}.card{border:1px solid var(--line);border-radius:20px;background:var(--white);padding:22px}.card h2,.card h3{margin-top:0}.facts{display:grid;grid-template-columns:1fr 1fr;gap:12px}.fact{border-radius:14px;background:var(--mint);padding:14px}.fact strong,.fact span{display:block}.fact span{font-size:.75rem;color:var(--muted)}ul{padding-left:20px}.products{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.product{display:flex;flex-direction:column;border:1px solid var(--line);border-radius:18px;background:var(--white);padding:18px;text-decoration:none}.product h3{font-size:1.15rem;margin:8px 0}.product p{font-size:.84rem;color:var(--muted)}.tag{display:inline-block;width:max-content;border-radius:999px;background:var(--mint);padding:4px 8px;font-size:.68rem;font-weight:800}.disclosure{margin-top:28px;border-left:4px solid var(--forest);background:var(--sand);padding:16px;border-radius:10px}.faq details{border-top:1px solid var(--line);padding:14px 0}.faq summary{cursor:pointer;font-weight:800}.footer{border-top:1px solid var(--line);padding:34px 0;color:var(--muted);font-size:.8rem}@media(max-width:800px){.grid{grid-template-columns:1fr}.products{grid-template-columns:1fr 1fr}.top nav{display:none}}@media(max-width:520px){.products,.facts{grid-template-columns:1fr}.hero{padding-top:42px}h1{font-size:2.65rem}}`;

function layout({ title, description, canonical, image = DEFAULT_IMAGE, body, structured }) {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${esc(canonical)}"><meta property="og:type" content="website"><meta property="og:locale" content="vi_VN"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:image" content="${esc(image)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${esc(image)}"><title>${esc(title)}</title><style>${STYLE}</style><script type="application/ld+json">${jsonLd(structured)}</script></head><body><header class="top"><div class="shell topin"><a class="brand" href="${APP_PATH}/">HỘI CHỌN ĐÚNG</a><nav><a href="${APP_PATH}/#chon">Chọn sản phẩm</a><a href="${APP_PATH}/danh-muc/tarot/">Tarot</a><a href="${APP_PATH}/danh-muc/sang-tao-noi-dung/">Sáng tạo</a><a href="${APP_PATH}/danh-muc/in-3d/">In 3D</a></nav></div></header>${body}<footer class="footer"><div class="shell">Hội Chọn Đúng cung cấp thông tin so sánh để hỗ trợ quyết định. Giá, tồn kho và chính sách cuối cùng do nơi bán xác nhận.</div></footer></body></html>`;
}

function breadcrumbs(items) {
  return items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: item.url }));
}

function productUrl(product) {
  return `${SITE}${APP_PATH}/san-pham/${product.id}/`;
}

function productCard(product) {
  return `<a class="product" href="${APP_PATH}/san-pham/${esc(product.id)}/"><span class="tag">${esc(CATEGORY_CONFIG[product.category].label)}</span><h3>${esc(product.name)}</h3><p>${esc(product.summary)}</p><strong>${esc(priceRange(product))}</strong></a>`;
}

function productPage(product, related) {
  const config = CATEGORY_CONFIG[product.category];
  const canonical = productUrl(product);
  const description = `${product.name}: giá tham khảo ${priceRange(product)}, đối tượng phù hợp, ưu điểm, điểm cần cân nhắc và đường dẫn tới nơi bán.`.slice(0, 160);
  const offer = product.price_min ? {
    "@type": "Offer",
    priceCurrency: product.currency,
    price: product.price_min,
    availability: product.link_ready ? "https://schema.org/InStock" : "https://schema.org/OnlineOnly",
    url: canonical,
    seller: { "@type": "Organization", name: product.merchant }
  } : undefined;
  const structured = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${canonical}#product`,
        name: product.name,
        description: product.summary,
        image: [product.image_url],
        category: config.label,
        ...(offer ? { offers: offer } : {})
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs([
          { name: "Hội Chọn Đúng", url: `${SITE}${APP_PATH}/` },
          { name: config.label, url: `${SITE}${APP_PATH}/danh-muc/${config.slug}/` },
          { name: product.name, url: canonical }
        ])
      }
    ]
  };
  const cta = product.outbound_url
    ? `<a class="cta" href="${esc(product.outbound_url)}" rel="sponsored nofollow noopener" target="_blank">Xem giá tại nơi bán</a>`
    : `<a class="cta" href="${APP_PATH}/#chon">Tạo bảng chọn phù hợp</a>`;
  const body = `<section class="hero"><div class="shell"><div class="crumb"><a href="${APP_PATH}/">Trang chủ</a> · <a href="${APP_PATH}/danh-muc/${config.slug}/">${esc(config.label)}</a></div><h1>${esc(product.name)}</h1><p class="lead">${esc(product.summary)}</p><div class="price">${esc(priceRange(product))}</div>${cta}</div></section><main class="shell"><div class="grid"><article class="card"><h2>Đánh giá nhanh</h2><div class="facts"><div class="fact"><span>Phù hợp với</span><strong>${esc(product.best_for[0])}</strong></div><div class="fact"><span>Cần kiểm tra</span><strong>${esc(product.avoid_if[0])}</strong></div></div><h3>Điểm đáng cân nhắc</h3><ul>${product.pros.map((item) => `<li>${esc(item)}</li>`).join("")}</ul><h3>Điểm cần lưu ý</h3><ul>${[...product.avoid_if, ...product.cons].slice(0, 6).map((item) => `<li>${esc(item)}</li>`).join("")}</ul><div class="disclosure"><strong>Công bố liên kết tiếp thị:</strong> Hội Chọn Đúng có thể nhận hoa hồng nếu bạn mua qua liên kết trên. Giá của bạn không tăng vì khoản hoa hồng này.</div></article><aside class="card"><h2>Thông tin tham khảo</h2><p><strong>Nơi bán:</strong> ${esc(product.merchant)}</p><p><strong>Khoảng giá:</strong> ${esc(priceRange(product))}</p><p><strong>Cập nhật:</strong> ${esc(new Date(product.updated_at).toLocaleDateString("vi-VN"))}</p><p>Hãy kiểm tra thông số, khả năng tương thích, bảo hành, đổi trả và tổng giá trước khi thanh toán.</p>${cta}</aside></div><section><h2>Sản phẩm cùng nhóm</h2><div class="products">${related.map(productCard).join("")}</div></section></main>`;
  return layout({ title: `${product.name}: giá và ưu nhược điểm | Hội Chọn Đúng`, description, canonical, image: product.image_url, body, structured });
}

function categoryPage(category, products) {
  const config = CATEGORY_CONFIG[category];
  const canonical = `${SITE}${APP_PATH}/danh-muc/${config.slug}/`;
  const description = `${config.title}. ${config.intro}`.slice(0, 160);
  const structured = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        name: config.title,
        itemListElement: products.map((product, index) => ({ "@type": "ListItem", position: index + 1, url: productUrl(product), name: product.name }))
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: `Nên chọn ${config.label.toLowerCase()} theo tiêu chí nào?`, acceptedAnswer: { "@type": "Answer", text: "Hãy bắt đầu từ hoàn cảnh sử dụng, khả năng tương thích, ngân sách và điểm bạn không muốn đánh đổi." } },
          { "@type": "Question", name: "Giá trên trang có phải giá cuối cùng không?", acceptedAnswer: { "@type": "Answer", text: "Không. Giá là thông tin tham khảo tại lần cập nhật; nơi bán xác nhận giá, tồn kho và chính sách cuối cùng." } }
        ]
      },
      { "@type": "BreadcrumbList", itemListElement: breadcrumbs([{ name: "Hội Chọn Đúng", url: `${SITE}${APP_PATH}/` }, { name: config.label, url: canonical }]) }
    ]
  };
  const body = `<section class="hero"><div class="shell"><div class="crumb"><a href="${APP_PATH}/">Trang chủ</a> · Danh mục</div><h1>${esc(config.title)}</h1><p class="lead">${esc(config.intro)}</p><a class="cta" href="${APP_PATH}/#chon">Nhận gợi ý theo nhu cầu</a></div></section><main class="shell"><section><h2>Lựa chọn đang được quan tâm</h2><div class="products">${products.map(productCard).join("")}</div></section><section class="card faq"><h2>Cách lựa chọn an toàn hơn</h2><p>Không có một sản phẩm tốt nhất cho mọi người. Hãy đối chiếu nhu cầu thực tế, thông số, điều kiện sử dụng, đánh giá gần nhất và chính sách đổi trả.</p><details><summary>Nên ưu tiên giá hay độ phù hợp?</summary><p>Ưu tiên khả năng đáp ứng đúng nhu cầu trước, sau đó so sánh tổng chi phí, bảo hành và độ bền.</p></details><details><summary>Khi nào nên hoãn mua?</summary><p>Hoãn mua khi thông số không rõ, không xác định được khả năng tương thích hoặc nơi bán không công bố chính sách đổi trả.</p></details><a class="cta secondary" href="${APP_PATH}/huong-dan/${config.guideSlug}/">Đọc hướng dẫn chi tiết</a></section></main>`;
  return layout({ title: `${config.title} | Hội Chọn Đúng`, description, canonical, body, structured });
}

function guidePage(category, products) {
  const config = CATEGORY_CONFIG[category];
  const canonical = `${SITE}${APP_PATH}/huong-dan/${config.guideSlug}/`;
  const structured = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Article", headline: config.guideTitle, description: config.guideIntro, dateModified: new Date().toISOString(), author: { "@type": "Organization", name: "Hội Chọn Đúng" }, publisher: { "@type": "Organization", name: "Hội Chọn Đúng" }, mainEntityOfPage: canonical },
      { "@type": "BreadcrumbList", itemListElement: breadcrumbs([{ name: "Hội Chọn Đúng", url: `${SITE}${APP_PATH}/` }, { name: "Hướng dẫn", url: `${SITE}${APP_PATH}/#cach-hoat-dong` }, { name: config.guideTitle, url: canonical }]) }
    ]
  };
  const specifics = category === "tarot"
    ? ["Chọn hệ biểu tượng có nhiều tài liệu học nếu bạn mới bắt đầu.", "Kiểm tra kích thước lá bài và chất lượng cán để xào bài thoải mái.", "Tránh mua chỉ vì hình đẹp nếu biểu tượng quá khó đọc với bạn."]
    : category === "creator"
      ? ["Xác định cổng Lightning, USB-C hoặc 3,5 mm trước khi mua.", "Quay cố định có thể ưu tiên micro có dây; di chuyển nhiều nên cân nhắc không dây.", "Trong nơi ồn, khoảng cách micro tới miệng quan trọng hơn thông số quảng cáo."]
      : ["PLA thường dễ bắt đầu; PETG cần kiểm soát độ ẩm và thiết lập tốt hơn.", "Resin cần thông gió, găng bảo hộ và quy trình rửa–hậu lưu hóa.", "Kiểm tra đường kính filament hoặc loại resin tương thích với máy trước khi đặt hàng."];
  const body = `<section class="hero"><div class="shell"><div class="crumb"><a href="${APP_PATH}/">Trang chủ</a> · Hướng dẫn</div><h1>${esc(config.guideTitle)}</h1><p class="lead">${esc(config.guideIntro)}</p></div></section><main class="shell"><article class="card"><h2>Bắt đầu từ hoàn cảnh sử dụng</h2><p>Đừng bắt đầu bằng câu hỏi “mẫu nào tốt nhất”. Hãy xác định người sử dụng, tần suất, thiết bị liên quan, ngân sách tối đa và điều bạn không chấp nhận. Các tiêu chí này giúp loại nhanh lựa chọn không phù hợp.</p><h2>Ba kiểm tra quan trọng</h2><ul>${specifics.map((item) => `<li>${esc(item)}</li>`).join("")}</ul><h2>Đọc thông tin nơi bán</h2><p>Đối chiếu tên phiên bản, thông số, phụ kiện đi kèm, thời gian bảo hành, điều kiện đổi trả và tổng giá sau vận chuyển. Không dựa riêng vào phần trăm giảm giá hoặc số lượt bán.</p><h2>Khi đã thu hẹp còn ba lựa chọn</h2><p>So sánh theo cùng một bộ tiêu chí: mức đáp ứng nhu cầu, rủi ro tương thích, chi phí sở hữu và khả năng đổi trả. Một lựa chọn rẻ hơn chưa chắc tiết kiệm hơn nếu cần mua thêm đầu chuyển, phụ kiện hoặc vật tư xử lý.</p></article><section><h2>Lựa chọn để tham khảo</h2><div class="products">${products.slice(0, 6).map(productCard).join("")}</div><a class="cta" href="${APP_PATH}/#chon">Tạo bảng chọn cá nhân</a></section></main>`;
  return layout({ title: `${config.guideTitle} | Hội Chọn Đúng`, description: config.guideIntro, canonical, body, structured });
}

async function write(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf8");
}

const output = resolve(arg("out", "_choice_seo"));
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const products = await loadProducts();
const urls = [`${SITE}${APP_PATH}/`];

for (const product of products) {
  const related = products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 3);
  await write(join(output, "san-pham", product.id, "index.html"), productPage(product, related));
  urls.push(productUrl(product));
}
for (const category of Object.keys(CATEGORY_CONFIG)) {
  const config = CATEGORY_CONFIG[category];
  const rows = products.filter((item) => item.category === category);
  if (!rows.length) continue;
  await write(join(output, "danh-muc", config.slug, "index.html"), categoryPage(category, rows));
  await write(join(output, "huong-dan", config.guideSlug, "index.html"), guidePage(category, rows));
  urls.push(`${SITE}${APP_PATH}/danh-muc/${config.slug}/`, `${SITE}${APP_PATH}/huong-dan/${config.guideSlug}/`);
}

const lastmodByUrl = new Map(products.map((product) => [productUrl(product), product.updated_at]));
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${xml(url)}</loc><lastmod>${xml(lastmodByUrl.get(url) || new Date().toISOString())}</lastmod></url>`).join("\n")}\n</urlset>\n`;
await write(join(output, "sitemap.xml"), sitemap);

const recent = [...products].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 30);
const feed = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>Hội Chọn Đúng — sản phẩm mới cập nhật</title><link>${SITE}${APP_PATH}/</link><description>Thông tin so sánh sản phẩm được cập nhật gần đây.</description><language>vi</language><lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${recent.map((product) => `<item><title>${xml(product.name)}</title><link>${xml(productUrl(product))}</link><guid isPermaLink="true">${xml(productUrl(product))}</guid><pubDate>${new Date(product.updated_at).toUTCString()}</pubDate><description>${xml(product.summary)}</description></item>`).join("")}</channel></rss>\n`;
await write(join(output, "feed.xml"), feed);
await write(join(output, "seo-urls.json"), JSON.stringify({ generated_at: new Date().toISOString(), urls }, null, 2));
await write(join(output, "seo-build.json"), JSON.stringify({ generated_at: new Date().toISOString(), products: products.length, urls: urls.length }, null, 2));

console.log(`choice-seo-ok: ${products.length} sản phẩm, ${urls.length} URL tại ${output}`);
