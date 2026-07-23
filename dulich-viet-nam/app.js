(() => {
  "use strict";

  const config = window.TRAVEL_CONFIG || {};
  const state = { places: [], filtered: [], dataSource: "" };
  const els = {
    grid: document.querySelector("#placeGrid"),
    template: document.querySelector("#placeCardTemplate"),
    search: document.querySelector("#searchInput"),
    region: document.querySelector("#regionFilter"),
    province: document.querySelector("#provinceFilter"),
    category: document.querySelector("#categoryFilter"),
    featured: document.querySelector("#featuredFilter"),
    reset: document.querySelector("#resetFilters"),
    status: document.querySelector("#resultStatus"),
    source: document.querySelector("#dataSource"),
    empty: document.querySelector("#emptyState"),
    dialog: document.querySelector("#placeDialog"),
    dialogContent: document.querySelector("#dialogContent"),
    closeDialog: document.querySelector("#closeDialog"),
    statPlaces: document.querySelector("#statPlaces"),
    statProvinces: document.querySelector("#statProvinces"),
    statCategories: document.querySelector("#statCategories")
  };

  const normalize = (value) => String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  const uniqueSorted = (items) => [...new Set(items.filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "vi"));

  function fillSelect(select, values, allLabel) {
    select.replaceChildren(new Option(allLabel, ""));
    values.forEach((value) => select.add(new Option(value, value)));
  }

  async function fetchJson(url) {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async function loadPlaces() {
    const apiUrl = String(config.apiBase || "").replace(/\/$/, "");
    if (apiUrl) {
      try {
        const payload = await fetchJson(`${apiUrl}/places?limit=500`);
        const rows = Array.isArray(payload) ? payload : payload.data;
        if (Array.isArray(rows)) {
          state.dataSource = "Cloudflare D1";
          return rows;
        }
      } catch (error) {
        console.warn("Không tải được API, chuyển sang dữ liệu tĩnh:", error);
      }
    }

    const payload = await fetchJson(config.staticDataUrl || "./data/places.json");
    state.dataSource = "Dữ liệu mẫu trong GitHub";
    return Array.isArray(payload) ? payload : payload.data || [];
  }

  function hydrateFilters() {
    fillSelect(els.region, uniqueSorted(state.places.map((p) => p.region)), "Tất cả vùng");
    fillSelect(els.province, uniqueSorted(state.places.map((p) => p.province)), "Tất cả tỉnh/thành");
    fillSelect(els.category, uniqueSorted(state.places.map((p) => p.category)), "Tất cả loại hình");

    els.statPlaces.textContent = state.places.length;
    els.statProvinces.textContent = uniqueSorted(state.places.map((p) => p.province)).length;
    els.statCategories.textContent = uniqueSorted(state.places.map((p) => p.category)).length;
  }

  function matchesSearch(place, query) {
    if (!query) return true;
    const haystack = normalize([
      place.name, place.province, place.district, place.region, place.category,
      place.summary, place.description, place.highlights, place.best_time,
      ...(Array.isArray(place.tags) ? place.tags : String(place.tags || "").split(","))
    ].join(" "));
    return haystack.includes(query);
  }

  function applyFilters() {
    const query = normalize(els.search.value);
    state.filtered = state.places.filter((place) =>
      matchesSearch(place, query)
      && (!els.region.value || place.region === els.region.value)
      && (!els.province.value || place.province === els.province.value)
      && (!els.category.value || place.category === els.category.value)
      && (!els.featured.checked || Boolean(Number(place.featured) || place.featured === true))
    );

    renderPlaces();
  }

  function tagsOf(place) {
    if (Array.isArray(place.tags)) return place.tags;
    return String(place.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean);
  }

  function renderPlaces() {
    els.grid.replaceChildren();
    const fragment = document.createDocumentFragment();

    state.filtered.forEach((place) => {
      const card = els.template.content.firstElementChild.cloneNode(true);
      card.querySelector(".place-card__region").textContent = place.region || "Việt Nam";
      card.querySelector(".place-card__category").textContent = place.category || "Điểm đến";
      const featured = card.querySelector(".place-card__featured");
      featured.hidden = !(Boolean(Number(place.featured)) || place.featured === true);
      card.querySelector(".place-card__name").textContent = place.name;
      card.querySelector(".place-card__location").textContent = [place.district, place.province].filter(Boolean).join(", ");
      card.querySelector(".place-card__summary").textContent = place.summary || place.description || "";
      const tags = card.querySelector(".place-card__tags");
      tagsOf(place).slice(0, 4).forEach((tag) => {
        const span = document.createElement("span");
        span.textContent = tag;
        tags.append(span);
      });
      card.querySelector("button").addEventListener("click", () => openPlace(place));
      fragment.append(card);
    });

    els.grid.append(fragment);
    els.empty.hidden = state.filtered.length !== 0;
    els.status.textContent = `Hiển thị ${state.filtered.length} / ${state.places.length} địa điểm`;
    els.source.textContent = `Nguồn đang dùng: ${state.dataSource}`;
  }

  function safeText(value, fallback = "Đang cập nhật") {
    const text = String(value ?? "").trim();
    return text || fallback;
  }

  function mapUrl(place) {
    if (place.map_url) return place.map_url;
    if (place.latitude != null && place.longitude != null) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.latitude},${place.longitude}`)}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${place.province}, Việt Nam`)}`;
  }

  function detailBox(label, value) {
    const box = document.createElement("div");
    box.className = "detail-box";
    const strong = document.createElement("strong");
    strong.textContent = label;
    const span = document.createElement("span");
    span.textContent = safeText(value);
    box.append(strong, span);
    return box;
  }

  function detailSection(title, text) {
    const section = document.createElement("section");
    section.className = "detail-section";
    const heading = document.createElement("h3");
    heading.textContent = title;
    const paragraph = document.createElement("p");
    paragraph.textContent = safeText(text);
    section.append(heading, paragraph);
    return section;
  }

  function openPlace(place) {
    els.dialogContent.replaceChildren();

    const kicker = document.createElement("p");
    kicker.className = "detail-kicker";
    kicker.textContent = [place.category, place.region].filter(Boolean).join(" · ");

    const title = document.createElement("h2");
    title.className = "detail-title";
    title.textContent = place.name;

    const location = document.createElement("p");
    location.className = "detail-location";
    location.textContent = [place.district, place.province, "Việt Nam"].filter(Boolean).join(", ");

    const lead = document.createElement("p");
    lead.textContent = safeText(place.summary || place.description);

    const grid = document.createElement("div");
    grid.className = "detail-grid";
    grid.append(
      detailBox("Thời điểm phù hợp", place.best_time),
      detailBox("Thời lượng gợi ý", place.suggested_duration),
      detailBox("Giá vé", place.ticket_info),
      detailBox("Giờ hoạt động", place.opening_hours)
    );

    const actions = document.createElement("div");
    actions.className = "detail-actions";
    const map = document.createElement("a");
    map.href = mapUrl(place);
    map.target = "_blank";
    map.rel = "noopener noreferrer";
    map.textContent = "Mở bản đồ";
    actions.append(map);

    if (place.official_url) {
      const official = document.createElement("a");
      official.href = place.official_url;
      official.target = "_blank";
      official.rel = "noopener noreferrer";
      official.textContent = "Nguồn chính thức";
      actions.append(official);
    }

    els.dialogContent.append(
      kicker, title, location, lead, grid,
      detailSection("Điểm đặc trưng", place.highlights),
      detailSection("Trải nghiệm gợi ý", place.experiences),
      detailSection("Lưu ý", place.travel_notes),
      actions
    );

    els.dialog.showModal();
  }

  function resetFilters() {
    els.search.value = "";
    els.region.value = "";
    els.province.value = "";
    els.category.value = "";
    els.featured.checked = false;
    applyFilters();
  }

  function bindEvents() {
    [els.search, els.region, els.province, els.category, els.featured]
      .forEach((element) => element.addEventListener("input", applyFilters));
    els.reset.addEventListener("click", resetFilters);
    els.closeDialog.addEventListener("click", () => els.dialog.close());
    els.dialog.addEventListener("click", (event) => {
      if (event.target === els.dialog) els.dialog.close();
    });
  }

  async function init() {
    bindEvents();
    try {
      state.places = (await loadPlaces()).filter((place) => place && place.name);
      state.places.sort((a, b) => (Number(b.featured) - Number(a.featured)) || a.name.localeCompare(b.name, "vi"));
      hydrateFilters();
      applyFilters();
    } catch (error) {
      console.error(error);
      els.status.textContent = "Không tải được dữ liệu địa điểm.";
      els.source.textContent = "Kiểm tra config.js hoặc đường dẫn data/places.json";
      els.empty.hidden = false;
    }

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(console.warn));
    }
  }

  init();
})();
