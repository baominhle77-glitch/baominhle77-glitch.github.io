import { SEED_PLACES } from "./data/seed-places.js";

const API_BASE = "https://hiennhi89-gate.hiennhi89.workers.dev";
const FAVORITES_KEY = "vietnam-travel:favorites:v1";
const CATEGORY_LABELS = Object.freeze({
  "di-san": "Di sản",
  "thien-nhien": "Thiên nhiên",
  "bien-dao": "Biển đảo",
  "van-hoa": "Văn hóa",
  "tam-linh": "Tâm linh",
  "phieu-luu": "Phiêu lưu",
  "do-thi": "Đô thị",
  "am-thuc": "Ẩm thực",
  "song-nuoc": "Sông nước",
  "nghi-duong": "Nghỉ dưỡng",
  "lich-su": "Lịch sử"
});

const REGION_GRADIENTS = Object.freeze({
  "Miền Bắc": "linear-gradient(135deg, #145a4a, #5f927b 55%, #d8b65b)",
  "Miền Trung": "linear-gradient(135deg, #175c6b, #4f97a3 52%, #e7bd68)",
  "Tây Nguyên": "linear-gradient(135deg, #69422f, #9f7250 48%, #d8b55e)",
  "Miền Nam": "linear-gradient(135deg, #1c6a62, #5ca78d 50%, #e7c166)"
});

const state = {
  places: [],
  query: "",
  region: "",
  category: "",
  sort: "featured",
  favoritesOnly: false,
  favorites: readFavorites(),
  activePlace: null,
  dataUpdatedAt: "",
  source: ""
};

const els = Object.fromEntries([
  "places", "searchInput", "regionFilter", "categoryFilter", "sortSelect", "favoritesOnly",
  "totalCount", "regionCount", "favoriteCount", "resultText", "resetFilters", "emptyState",
  "emptyReset", "dataStatus", "placeDialog", "dialogClose", "dialogVisual", "dialogLocation",
  "dialogTitle", "dialogFavorite", "dialogCategories", "dialogSummary", "dialogHighlights",
  "dialogBestTime", "dialogDuration", "dialogAddress", "dialogTips", "dialogMap", "dialogShare",
  "dialogSource", "placeCardTemplate"
].map((id) => [id, document.getElementById(id)]));

function readFavorites() {
  try {
    const value = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    return new Set(Array.isArray(value) ? value.filter((item) => typeof item === "string") : []);
  } catch (_) {
    return new Set();
  }
}

function saveFavorites() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...state.favorites]));
  els.favoriteCount.textContent = String(state.favorites.size);
}

function stripVietnamese(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function normalize(value) {
  return stripVietnamese(value).toLowerCase().replace(/\s+/g, " ").trim();
}

function safeUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : "";
  } catch (_) {
    return "";
  }
}

function categoryLabel(category) {
  return CATEGORY_LABELS[category] || category.replace(/-/g, " ");
}

function makeTag(category) {
  const span = document.createElement("span");
  span.className = "tag";
  span.textContent = categoryLabel(category);
  return span;
}

function visualBackground(place) {
  const image = safeUrl(place.image_url);
  if (image) return `linear-gradient(to top, rgba(7,39,29,.25), rgba(7,39,29,.02)), url("${image.replaceAll('"', "%22")}")`;
  return REGION_GRADIENTS[place.region] || "linear-gradient(135deg, #176a50, #83a96c 58%, #e2bc63)";
}

function filteredPlaces() {
  const query = normalize(state.query);
  const output = state.places.filter((place) => {
    if (state.favoritesOnly && !state.favorites.has(place.id)) return false;
    if (state.region && place.region !== state.region) return false;
    if (state.category && !(place.categories || []).includes(state.category)) return false;
    if (!query) return true;
    return normalize([
      place.name,
      place.province,
      place.region,
      place.summary,
      ...(place.highlights || []),
      ...(place.categories || []).map(categoryLabel)
    ].join(" ")).includes(query);
  });

  return output.sort((a, b) => {
    if (state.sort === "name") return a.name.localeCompare(b.name, "vi");
    if (state.sort === "province") return a.province.localeCompare(b.province, "vi") || a.name.localeCompare(b.name, "vi");
    return Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name, "vi");
  });
}

function toggleFavorite(id) {
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);
  saveFavorites();
  render();
  if (state.activePlace?.id === id) updateDialogFavorite();
}

function favoriteButtonState(button, id) {
  const saved = state.favorites.has(id);
  button.classList.toggle("is-saved", saved);
  button.textContent = saved ? "♥" : "♡";
  button.setAttribute("aria-label", saved ? "Bỏ khỏi yêu thích" : "Lưu yêu thích");
  button.setAttribute("aria-pressed", String(saved));
}

function renderCard(place) {
  const fragment = els.placeCardTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".place-card");
  const visual = fragment.querySelector(".card-visual");
  const favorite = fragment.querySelector(".card-favorite");
  const detail = fragment.querySelector(".detail-button");

  card.dataset.placeId = place.id;
  visual.style.backgroundImage = visualBackground(place);
  fragment.querySelector(".card-region").textContent = place.region;
  fragment.querySelector(".card-location").textContent = place.province;
  fragment.querySelector(".card-title").textContent = place.name;
  fragment.querySelector(".card-summary").textContent = place.summary;
  fragment.querySelector(".card-duration").textContent = place.duration || "Thời lượng linh hoạt";

  const tags = fragment.querySelector(".card-tags");
  (place.categories || []).slice(0, 3).forEach((category) => tags.appendChild(makeTag(category)));
  favoriteButtonState(favorite, place.id);

  favorite.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleFavorite(place.id);
  });
  detail.addEventListener("click", () => openDialog(place));
  card.addEventListener("dblclick", () => openDialog(place));
  return fragment;
}

function render() {
  const places = filteredPlaces();
  const filtersActive = !!(state.query || state.region || state.category || state.favoritesOnly);
  els.places.replaceChildren(...places.map(renderCard));
  els.resultText.textContent = `${places.length} địa điểm${filtersActive ? " phù hợp" : " đang hiển thị"}`;
  els.resetFilters.hidden = !filtersActive;
  els.emptyState.hidden = places.length !== 0;
  els.places.hidden = places.length === 0;
  els.favoritesOnly.setAttribute("aria-pressed", String(state.favoritesOnly));
  els.favoritesOnly.querySelector("span").textContent = state.favoritesOnly ? "♥" : "♡";
  els.favoriteCount.textContent = String(state.favorites.size);
}

function resetFilters() {
  state.query = "";
  state.region = "";
  state.category = "";
  state.favoritesOnly = false;
  els.searchInput.value = "";
  els.regionFilter.value = "";
  els.categoryFilter.value = "";
  render();
}

function fillFilters() {
  const regions = [...new Set(state.places.map((place) => place.region).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "vi"));
  const categories = [...new Set(state.places.flatMap((place) => place.categories || []))]
    .sort((a, b) => categoryLabel(a).localeCompare(categoryLabel(b), "vi"));

  els.regionFilter.replaceChildren(new Option("Tất cả vùng", ""), ...regions.map((region) => new Option(region, region)));
  els.categoryFilter.replaceChildren(new Option("Tất cả loại hình", ""), ...categories.map((category) => new Option(categoryLabel(category), category)));
  els.regionCount.textContent = String(regions.length);
}

function updateDialogFavorite() {
  if (!state.activePlace) return;
  favoriteButtonState(els.dialogFavorite, state.activePlace.id);
}

function openDialog(place) {
  state.activePlace = place;
  els.dialogVisual.style.backgroundImage = visualBackground(place);
  els.dialogLocation.textContent = `${place.province} · ${place.region}`;
  els.dialogTitle.textContent = place.name;
  els.dialogSummary.textContent = place.summary;
  els.dialogCategories.replaceChildren(...(place.categories || []).map(makeTag));
  updateDialogFavorite();

  const highlights = place.highlights || [];
  if (highlights.length) {
    const title = document.createElement("h3");
    title.textContent = "Điểm nổi bật";
    const list = document.createElement("ul");
    highlights.forEach((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      list.appendChild(item);
    });
    els.dialogHighlights.replaceChildren(title, list);
    els.dialogHighlights.hidden = false;
  } else {
    els.dialogHighlights.hidden = true;
    els.dialogHighlights.replaceChildren();
  }

  els.dialogBestTime.textContent = place.best_time || "Chưa cập nhật";
  els.dialogDuration.textContent = place.duration || "Chưa cập nhật";
  els.dialogAddress.textContent = place.address || `${place.province}, Việt Nam`;
  els.dialogTips.textContent = place.tips || "Kiểm tra thông tin chính thức và thời tiết trước khi đi.";

  const mapUrl = safeUrl(place.map_url);
  els.dialogMap.hidden = !mapUrl;
  els.dialogMap.href = mapUrl || "#";

  const sourceUrl = safeUrl(place.source_url);
  els.dialogSource.hidden = !sourceUrl;
  els.dialogSource.href = sourceUrl || "#";

  if (!els.placeDialog.open) els.placeDialog.showModal();
  history.replaceState(null, "", `#${encodeURIComponent(place.id)}`);
}

function closeDialog() {
  if (els.placeDialog.open) els.placeDialog.close();
  state.activePlace = null;
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
}

async function shareActive() {
  const place = state.activePlace;
  if (!place) return;
  const url = `${location.origin}${location.pathname}#${encodeURIComponent(place.id)}`;
  const payload = { title: place.name, text: `${place.name} — ${place.province}. ${place.summary}`, url };
  if (navigator.share) {
    await navigator.share(payload).catch(() => {});
    return;
  }
  await navigator.clipboard?.writeText(url).catch(() => {});
  const original = els.dialogShare.textContent;
  els.dialogShare.textContent = "Đã chép liên kết";
  setTimeout(() => { els.dialogShare.textContent = original; }, 1600);
}

function bindEvents() {
  els.searchInput.addEventListener("input", () => { state.query = els.searchInput.value; render(); });
  els.regionFilter.addEventListener("change", () => { state.region = els.regionFilter.value; render(); });
  els.categoryFilter.addEventListener("change", () => { state.category = els.categoryFilter.value; render(); });
  els.sortSelect.addEventListener("change", () => { state.sort = els.sortSelect.value; render(); });
  els.favoritesOnly.addEventListener("click", () => { state.favoritesOnly = !state.favoritesOnly; render(); });
  els.resetFilters.addEventListener("click", resetFilters);
  els.emptyReset.addEventListener("click", resetFilters);
  els.dialogClose.addEventListener("click", closeDialog);
  els.placeDialog.addEventListener("click", (event) => {
    if (event.target === els.placeDialog) closeDialog();
  });
  els.placeDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog();
  });
  els.dialogFavorite.addEventListener("click", () => state.activePlace && toggleFavorite(state.activePlace.id));
  els.dialogShare.addEventListener("click", shareActive);
}

function normalizeApiPlace(place) {
  return {
    id: String(place.id || ""),
    name: String(place.name || ""),
    province: String(place.province || ""),
    region: String(place.region || ""),
    categories: Array.isArray(place.categories) ? place.categories.map(String) : [],
    summary: String(place.summary || ""),
    highlights: Array.isArray(place.highlights) ? place.highlights.map(String) : [],
    best_time: String(place.best_time || ""),
    duration: String(place.duration || ""),
    address: String(place.address || ""),
    map_url: safeUrl(place.map_url),
    image_url: safeUrl(place.image_url),
    source_url: safeUrl(place.source_url),
    tips: String(place.tips || ""),
    featured: !!place.featured,
    published: place.published !== false,
    updated_at: String(place.updated_at || "")
  };
}

async function loadPlaces() {
  try {
    const response = await fetch(`${API_BASE}/api/travel/places`, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.places)) throw new Error("invalid_data");
    state.places = data.places.map(normalizeApiPlace).filter((place) => place.id && place.name && place.published);
    state.dataUpdatedAt = String(data.updated_at || "");
    state.source = "Cloudflare KV";
  } catch (_) {
    state.places = SEED_PLACES.map(normalizeApiPlace);
    state.dataUpdatedAt = "2026-07-23T00:00:00.000Z";
    state.source = "dữ liệu dự phòng trên thiết bị";
  }

  els.totalCount.textContent = String(state.places.length);
  els.dataStatus.textContent = `Nguồn: ${state.source}. Cập nhật kho: ${state.dataUpdatedAt ? new Date(state.dataUpdatedAt).toLocaleString("vi-VN") : "chưa xác định"}.`;
  fillFilters();
  render();

  const hashId = decodeURIComponent(location.hash.replace(/^#/, ""));
  if (hashId) {
    const place = state.places.find((item) => item.id === hashId);
    if (place) openDialog(place);
  }
}

bindEvents();
loadPlaces();

if ("serviceWorker" in navigator) {
  addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
