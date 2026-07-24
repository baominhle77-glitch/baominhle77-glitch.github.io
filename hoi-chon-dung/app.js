import { CHOICE_CATEGORIES, SEED_PRODUCTS } from "./data/seed-products.js";

const API_BASE = "https://hiennhi89-gate.hiennhi89.workers.dev";
const STORAGE_KEYS = Object.freeze({ saved: "hoi-chon-dung:saved:v1", compare: "hoi-chon-dung:compare:v1" });

const state = {
  products: [],
  category: "tarot",
  communityFilter: "all",
  saved: new Set(readStoredArray(STORAGE_KEYS.saved)),
  compare: new Set(readStoredArray(STORAGE_KEYS.compare)),
  deferredPrompt: null,
  lastRecommendation: []
};

const $ = (id) => document.getElementById(id);
const categoryOptions = $("categoryOptions");
const filterChips = $("filterChips");
const communityGrid = $("communityGrid");
const loadingState = $("loadingState");
const resultsSection = $("resultsSection");
const resultsGrid = $("resultsGrid");
const resultsTitle = $("resultsTitle");
const resultsReason = $("resultsReason");
const compareTray = $("compareTray");
const compareCount = $("compareCount");
const compareDialog = $("compareDialog");
const compareContent = $("compareContent");
const toast = $("toast");

function readStoredArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch (_) {
    return [];
  }
}

function writeStoredSet(key, set) {
  try { localStorage.setItem(key, JSON.stringify([...set])); } catch (_) { /* storage may be unavailable */ }
}

function node(tag, options = {}, children = []) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(options)) {
    if (key === "className") element.className = value;
    else if (key === "text") element.textContent = String(value);
    else if (key === "htmlFor") element.htmlFor = value;
    else if (key.startsWith("aria-")) element.setAttribute(key, String(value));
    else if (key === "dataset") Object.assign(element.dataset, value);
    else if (key === "disabled") element.disabled = !!value;
    else if (key === "hidden") element.hidden = !!value;
    else if (key in element) element[key] = value;
    else element.setAttribute(key, String(value));
  }
  const list = Array.isArray(children) ? children : [children];
  for (const child of list) {
    if (child === null || child === undefined || child === false) continue;
    element.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return element;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function formatMoney(value) {
  const amount = Number(value || 0);
  if (!amount) return "Chưa có giá";
  return `${new Intl.NumberFormat("vi-VN").format(amount)}đ`;
}

function formatPriceRange(product) {
  const min = Number(product.price_min || 0);
  const max = Number(product.price_max || min);
  if (!min && !max) return "Chưa có giá tham khảo";
  if (min === max) return formatMoney(min);
  return `${formatMoney(min)} – ${formatMoney(max)}`;
}

function categoryLabel(id) {
  return CHOICE_CATEGORIES.find((item) => item.id === id)?.label || id;
}

function fallbackProducts() {
  return SEED_PRODUCTS.map((product) => ({
    ...product,
    link_ready: !!(product.affiliate_url || product.merchant_url),
    link_type: product.affiliate_url ? "affiliate" : product.merchant_url ? "reference" : "none",
    votes: Number(product.votes_base || 0),
    clicks: 0,
    outbound_path: ""
  }));
}

async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function loadProducts() {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/api/choice/products`, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.products) || !data.products.length) throw new Error("empty_catalog");
    state.products = data.products;
    loadingState.hidden = true;
  } catch (_) {
    state.products = fallbackProducts();
    loadingState.textContent = "Đang dùng dữ liệu dự phòng. Bình chọn trực tuyến có thể tạm thời chưa đồng bộ.";
    loadingState.hidden = false;
  }
  pruneStoredIds();
  renderCommunity();
  updateCompareTray();
}

function pruneStoredIds() {
  const valid = new Set(state.products.map((item) => item.id));
  state.saved = new Set([...state.saved].filter((id) => valid.has(id)));
  state.compare = new Set([...state.compare].filter((id) => valid.has(id)));
  writeStoredSet(STORAGE_KEYS.saved, state.saved);
  writeStoredSet(STORAGE_KEYS.compare, state.compare);
}

function renderCategoryOptions() {
  categoryOptions.replaceChildren();
  CHOICE_CATEGORIES.forEach((category, index) => {
    const id = `category-${category.id}`;
    const input = node("input", {
      type: "radio",
      id,
      name: "category",
      value: category.id,
      checked: index === 0
    });
    input.addEventListener("change", () => { state.category = category.id; });
    const label = node("label", { htmlFor: id }, [
      node("span", { className: "category-icon", text: category.icon }),
      node("span", {}, [
        node("strong", { text: category.label }),
        node("small", { text: category.description })
      ])
    ]);
    categoryOptions.append(node("div", { className: "category-option" }, [input, label]));
  });
}

function renderFilterChips() {
  filterChips.replaceChildren();
  const options = [{ id: "all", label: "Tất cả" }, ...CHOICE_CATEGORIES.map(({ id, label }) => ({ id, label }))];
  for (const option of options) {
    const button = node("button", {
      type: "button",
      text: option.label,
      "aria-pressed": String(state.communityFilter === option.id)
    });
    button.addEventListener("click", () => {
      state.communityFilter = option.id;
      renderFilterChips();
      renderCommunity();
    });
    filterChips.append(button);
  }
}

function scoreProduct(product, criteria) {
  let score = 20;
  const reasons = [];
  if (product.category === criteria.category) {
    score += 42;
    reasons.push(`đúng nhóm ${categoryLabel(product.category).toLowerCase()}`);
  }

  const budget = Number(criteria.budget || 0);
  const min = Number(product.price_min || 0);
  const max = Number(product.price_max || min);
  if (budget > 0) {
    if (min <= budget) {
      score += max <= budget ? 18 : 10;
      reasons.push("nằm trong hoặc gần ngân sách");
    } else {
      const overRatio = (min - budget) / Math.max(budget, 1);
      score -= Math.min(28, Math.round(overRatio * 30));
    }
  }

  if ((product.priorities || []).includes(criteria.priority)) {
    score += 22;
    reasons.push("khớp ưu tiên chính");
  }

  const need = normalizeText(criteria.need);
  const haystack = normalizeText([
    product.name,
    product.summary,
    ...(product.tags || []),
    ...(product.best_for || []),
    ...(product.priorities || [])
  ].join(" "));
  const tokens = [...new Set(need.split(/[^a-z0-9]+/).filter((token) => token.length >= 3))].slice(0, 18);
  const matched = tokens.filter((token) => haystack.includes(token)).length;
  if (matched) {
    score += Math.min(18, matched * 3);
    reasons.push("khớp từ khóa trong nhu cầu");
  }

  score += product.featured ? 4 : 0;
  score += Math.min(7, Math.log10(Math.max(1, Number(product.votes || product.votes_base || 0))) * 3);
  return {
    product,
    score,
    match: Math.max(54, Math.min(98, Math.round(score))),
    reasons
  };
}

function recommend(criteria) {
  return state.products
    .filter((product) => product.published !== false)
    .map((product) => scoreProduct(product, criteria))
    .sort((a, b) => b.score - a.score || Number(b.product.votes || 0) - Number(a.product.votes || 0))
    .slice(0, 3);
}

function detailBlock(title, items) {
  const safeItems = Array.isArray(items) ? items.slice(0, 3) : [];
  if (!safeItems.length) return null;
  const list = node("ul");
  safeItems.forEach((item) => list.append(node("li", { text: item })));
  return node("div", { className: "product-detail" }, [node("strong", { text: title }), list]);
}

function outboundUrl(product) {
  if (product.outbound_path) return `${API_BASE}${product.outbound_path}`;
  return product.affiliate_url || product.merchant_url || "";
}

function productCard(product, options = {}) {
  const match = Number(options.match || 0);
  const badgeText = options.rank ? `Lựa chọn ${options.rank}` : categoryLabel(product.category);
  const card = node("article", { className: `product-card${options.rank === 1 ? " is-best" : ""}` });
  const visual = node("div", { className: "product-visual", text: product.visual || "◇", "aria-hidden": "true" });
  const body = node("div", { className: "product-body" });
  const topLine = node("div", { className: "product-topline" }, [
    node("span", { className: "product-badge", text: badgeText }),
    node("span", {
      className: `link-badge ${product.link_type || "none"}`,
      text: product.link_type === "affiliate" ? "Link tiếp thị" : product.link_type === "reference" ? "Link tham khảo" : "Chưa có link"
    })
  ]);
  body.append(topLine, node("h3", { text: product.name }), node("p", { className: "product-summary", text: product.summary }));

  body.append(node("div", { className: "price-row" }, [
    node("strong", { text: formatPriceRange(product) }),
    node("span", { text: `${Number(product.votes || product.votes_base || 0).toLocaleString("vi-VN")} lượt chọn` })
  ]));

  if (match) {
    body.append(node("div", { className: "match-bar" }, [
      node("div", {}, [node("span", { text: "Mức phù hợp dự kiến" }), node("strong", { text: `${match}%` })]),
      node("div", { className: "match-track" }, node("i", { style: `width:${match}%` }))
    ]));
  }

  body.append(detailBlock("Phù hợp với", product.best_for), detailBlock("Cần cân nhắc", product.avoid_if || product.cons));

  const actionArea = node("div", { className: "product-actions" });
  const target = outboundUrl(product);
  const outbound = node("a", {
    className: `outbound-button${target ? "" : " is-disabled"}`,
    href: target || "#",
    target: target ? "_blank" : "",
    rel: "sponsored noopener noreferrer",
    text: target ? "Xem nơi bán" : "Đang cập nhật link",
    "aria-disabled": String(!target)
  });
  if (!target) outbound.addEventListener("click", (event) => event.preventDefault());

  const voteButton = node("button", { type: "button", text: "Hữu ích", "aria-label": `Bình chọn ${product.name}` });
  voteButton.addEventListener("click", () => vote(product.id, voteButton));
  const saveButton = node("button", {
    type: "button",
    text: state.saved.has(product.id) ? "Đã lưu" : "Lưu",
    "aria-pressed": String(state.saved.has(product.id))
  });
  saveButton.addEventListener("click", () => toggleSaved(product.id));
  const compareButton = node("button", {
    type: "button",
    text: state.compare.has(product.id) ? "Đã chọn" : "So sánh",
    "aria-pressed": String(state.compare.has(product.id))
  });
  compareButton.addEventListener("click", () => toggleCompare(product.id));

  actionArea.append(outbound, node("div", { className: "secondary-actions" }, [voteButton, saveButton, compareButton]));
  body.append(actionArea);
  card.append(visual, body);
  return card;
}

function renderCommunity() {
  renderFilterChips();
  const products = state.products
    .filter((product) => product.published !== false)
    .filter((product) => state.communityFilter === "all" || product.category === state.communityFilter)
    .sort((a, b) => Number(b.votes || b.votes_base || 0) - Number(a.votes || a.votes_base || 0))
    .slice(0, 6);
  communityGrid.replaceChildren();
  if (!products.length) {
    communityGrid.append(node("div", { className: "empty-state", text: "Chưa có sản phẩm phù hợp bộ lọc này." }));
    return;
  }
  products.forEach((product) => communityGrid.append(productCard(product)));
}

function renderRecommendations(items, criteria) {
  state.lastRecommendation = items.map((item) => item.product.id);
  resultsGrid.replaceChildren();
  if (!items.length) {
    resultsGrid.append(node("div", { className: "empty-state", text: "Chưa tìm thấy lựa chọn phù hợp. Hãy thử mở rộng ngân sách hoặc mô tả nhu cầu rõ hơn." }));
    return;
  }
  const budgetText = Number(criteria.budget) ? `ngân sách ${formatMoney(criteria.budget)}` : "ngân sách chưa cố định";
  resultsTitle.textContent = `Ba lựa chọn phù hợp với ${categoryLabel(criteria.category).toLowerCase()}`;
  resultsReason.textContent = `Xếp hạng dựa trên ${budgetText}, ưu tiên đã chọn và nội dung mô tả của bạn. Đây là gợi ý, không phải cam kết phù hợp tuyệt đối.`;
  items.forEach((item, index) => resultsGrid.append(productCard(item.product, { rank: index + 1, match: item.match })));
  resultsSection.hidden = false;
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function vote(productId, button) {
  const product = state.products.find((item) => item.id === productId);
  if (!product || button.disabled) return;
  button.disabled = true;
  const previous = button.textContent;
  button.textContent = "Đang ghi nhận…";
  try {
    const response = await fetchWithTimeout(`${API_BASE}/api/choice/vote`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ product_id: productId })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    product.votes = Number(data.votes || product.votes || 0);
    showToast(data.duplicate ? "Bạn đã bình chọn sản phẩm này trong hôm nay." : "Đã ghi nhận lựa chọn của bạn.");
    renderCommunity();
    rerenderRecommendationsIfNeeded();
  } catch (_) {
    showToast("Chưa thể đồng bộ bình chọn. Hãy thử lại sau.");
  } finally {
    button.disabled = false;
    button.textContent = previous;
  }
}

function toggleSaved(productId) {
  if (state.saved.has(productId)) state.saved.delete(productId);
  else state.saved.add(productId);
  writeStoredSet(STORAGE_KEYS.saved, state.saved);
  showToast(state.saved.has(productId) ? "Đã lưu vào thiết bị này." : "Đã bỏ khỏi danh sách lưu.");
  renderCommunity();
  rerenderRecommendationsIfNeeded();
}

function toggleCompare(productId) {
  if (state.compare.has(productId)) {
    state.compare.delete(productId);
  } else if (state.compare.size >= 3) {
    showToast("Chỉ so sánh tối đa 3 sản phẩm cùng lúc.");
    return;
  } else {
    state.compare.add(productId);
  }
  writeStoredSet(STORAGE_KEYS.compare, state.compare);
  updateCompareTray();
  renderCommunity();
  rerenderRecommendationsIfNeeded();
}

function rerenderRecommendationsIfNeeded() {
  if (resultsSection.hidden || !state.lastRecommendation.length) return;
  const items = state.lastRecommendation
    .map((id, index) => ({ product: state.products.find((item) => item.id === id), match: Math.max(60, 95 - index * 7) }))
    .filter((item) => item.product);
  resultsGrid.replaceChildren(...items.map((item, index) => productCard(item.product, { rank: index + 1, match: item.match })));
}

function updateCompareTray() {
  compareTray.hidden = state.compare.size === 0;
  compareCount.textContent = `${state.compare.size} sản phẩm`;
}

function openCompare() {
  const products = [...state.compare].map((id) => state.products.find((item) => item.id === id)).filter(Boolean);
  if (products.length < 2) {
    showToast("Hãy chọn ít nhất 2 sản phẩm để so sánh.");
    return;
  }
  const table = node("table", { className: "compare-table" });
  const header = node("tr", {}, [node("th", { text: "Tiêu chí" }), ...products.map((product) => node("th", { text: product.name }))]);
  table.append(header);
  const rows = [
    ["Giá tham khảo", (product) => formatPriceRange(product)],
    ["Phù hợp với", (product) => (product.best_for || []).join("; ") || "Chưa có dữ liệu"],
    ["Điểm mạnh", (product) => (product.pros || []).join("; ") || "Chưa có dữ liệu"],
    ["Cần cân nhắc", (product) => ([...(product.avoid_if || []), ...(product.cons || [])].slice(0, 4).join("; ") || "Chưa có dữ liệu")],
    ["Cộng đồng chọn", (product) => `${Number(product.votes || product.votes_base || 0).toLocaleString("vi-VN")} lượt`],
    ["Loại liên kết", (product) => product.link_type === "affiliate" ? "Liên kết tiếp thị" : product.link_type === "reference" ? "Liên kết tham khảo" : "Chưa có link"]
  ];
  for (const [label, getter] of rows) table.append(node("tr", {}, [node("th", { text: label }), ...products.map((product) => node("td", { text: getter(product) }))]));
  compareContent.replaceChildren(table);
  compareDialog.showModal();
}

let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
}

function setupEvents() {
  $("choiceForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const need = $("needInput").value.trim();
    if (!need) {
      showToast("Hãy mô tả nhu cầu trước khi tạo bảng chọn.");
      $("needInput").focus();
      return;
    }
    const criteria = {
      category: state.category,
      need,
      budget: Number($("budgetInput").value || 0),
      priority: $("priorityInput").value
    };
    renderRecommendations(recommend(criteria), criteria);
  });

  $("resetButton").addEventListener("click", () => {
    resultsSection.hidden = true;
    state.lastRecommendation = [];
    $("needInput").focus();
  });

  $("openCompareButton").addEventListener("click", openCompare);
  $("clearCompareButton").addEventListener("click", () => {
    state.compare.clear();
    writeStoredSet(STORAGE_KEYS.compare, state.compare);
    updateCompareTray();
    renderCommunity();
    rerenderRecommendationsIfNeeded();
  });
  $("closeCompareButton").addEventListener("click", () => compareDialog.close());
  compareDialog.addEventListener("click", (event) => {
    if (event.target === compareDialog) compareDialog.close();
  });

  $("shareButton").addEventListener("click", async () => {
    const shareData = {
      title: "Hội Chọn Đúng",
      text: "Mô tả nhu cầu, so sánh rõ và tham khảo cộng đồng trước khi mua.",
      url: location.href
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(location.href);
        showToast("Đã sao chép đường dẫn ứng dụng.");
      }
    } catch (error) {
      if (error?.name !== "AbortError") showToast("Chưa thể chia sẻ đường dẫn.");
    }
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.deferredPrompt = event;
    $("installButton").hidden = false;
  });
  $("installButton").addEventListener("click", async () => {
    if (!state.deferredPrompt) return;
    state.deferredPrompt.prompt();
    await state.deferredPrompt.userChoice;
    state.deferredPrompt = null;
    $("installButton").hidden = true;
  });
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try { await navigator.serviceWorker.register("./sw.js", { scope: "./" }); } catch (_) { /* offline shell is optional */ }
}

renderCategoryOptions();
setupEvents();
registerServiceWorker();
loadProducts();
