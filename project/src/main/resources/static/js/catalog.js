// ===== CATALOG PAGE =====

// Category display name mapping (Vietnamese labels → data values)
const CATEGORY_MAP = {
  "Giả tưởng":   "Fiction",
  "Khoa học":    "Science",
  "Lịch sử":     "History",
  "Self-Help":   "Self-Help",
  "Trẻ em":      "Children",
  "Tiểu sử":     "Biography",
  "Kinh doanh":  "Business",
  "Phi giả tưởng": "Non-Fiction",
};

// State
let currentFilters = {
  category: null,
  search: null,
  minPrice: null,
  maxPrice: null,
  sort: "popular",
  sale: false,
};
let currentPage = 1;
const PAGE_SIZE = 24;

// ── Bootstrap ──────────────────────────────────────────────
document.addEventListener("booksLoaded", () => {
  readURLParams();
  renderSidebar();
  renderCatalog();
  bindEvents();
});

// ── Read filters from URL (e.g. ?category=Fiction&search=magic) ──
function readURLParams() {
  const p = new URLSearchParams(window.location.search);
  if (p.get("category")) currentFilters.category = p.get("category");
  if (p.get("search"))   currentFilters.search   = p.get("search");
  if (p.get("sort"))     currentFilters.sort      = p.get("sort");
  if (p.get("sale"))     currentFilters.sale      = true;
  if (p.get("minPrice")) currentFilters.minPrice  = p.get("minPrice");
  if (p.get("maxPrice")) currentFilters.maxPrice  = p.get("maxPrice");
}

// ── Sidebar: active category pills ──────────────────────────
function renderSidebar() {
  const catList = document.getElementById("cat-list");
  if (!catList) return;

  const categories = ["All", ...Object.keys(CATEGORY_MAP)];
  catList.innerHTML = categories.map(label => {
    const val = label === "All" ? null : CATEGORY_MAP[label];
    const active = currentFilters.category === val && !(label === "All" && currentFilters.category);
    const isAll  = label === "All" && !currentFilters.category;
    return `
      <button class="cat-pill ${active || isAll ? "active" : ""}"
              onclick="setCategory(${val ? `'${val}'` : null})">
        ${label}
      </button>`;
  }).join("");

  // Price inputs
  const minEl = document.getElementById("price-min");
  const maxEl = document.getElementById("price-max");
  if (minEl && currentFilters.minPrice) minEl.value = currentFilters.minPrice;
  if (maxEl && currentFilters.maxPrice) maxEl.value = currentFilters.maxPrice;

  // Sort select
  const sortEl = document.getElementById("sort-select");
  if (sortEl) sortEl.value = currentFilters.sort || "popular";

  // Search input
  const searchEl = document.getElementById("catalog-search");
  if (searchEl && currentFilters.search) searchEl.value = currentFilters.search;

  // Sale toggle
  const saleEl = document.getElementById("sale-toggle");
  if (saleEl) saleEl.checked = currentFilters.sale;
}

// ── Main render ──────────────────────────────────────────────
function renderCatalog() {
  const grid    = document.getElementById("catalog-grid");
  const heading = document.getElementById("catalog-heading");
  const countEl = document.getElementById("result-count");
  if (!grid) return;

  const results = filterBooks(currentFilters);
  const total   = results.length;
  const start   = (currentPage - 1) * PAGE_SIZE;
  const page    = results.slice(start, start + PAGE_SIZE);

  // Heading
  if (heading) {
    const label = currentFilters.category
      ? Object.keys(CATEGORY_MAP).find(k => CATEGORY_MAP[k] === currentFilters.category) || currentFilters.category
      : currentFilters.search
        ? `Kết quả cho "${currentFilters.search}"`
        : currentFilters.sale
          ? "Sách khuyến mãi"
          : "Tất cả sách";
    heading.textContent = label;
  }
  if (countEl) countEl.textContent = `${total} cuốn sách`;

  // Grid
  if (page.length === 0) {
    grid.innerHTML = `
      <div class="catalog-empty">
        <div style="font-size:64px">📭</div>
        <h3>Không tìm thấy sách nào</h3>
        <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
        <button class="btn-primary" onclick="clearAllFilters()">Xóa bộ lọc</button>
      </div>`;
  } else {
    grid.innerHTML = page.map(createProductCard).join("");
  }

  renderPagination(total);
  updateActiveURL();
}

// ── Pagination ───────────────────────────────────────────────
function renderPagination(total) {
  const el = document.getElementById("pagination");
  if (!el) return;
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) { el.innerHTML = ""; return; }

  let html = `<button class="page-btn" onclick="goPage(${currentPage - 1})" ${currentPage === 1 ? "disabled" : ""}>‹</button>`;
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - currentPage) <= 2) {
      html += `<button class="page-btn ${i === currentPage ? "active" : ""}" onclick="goPage(${i})">${i}</button>`;
    } else if (Math.abs(i - currentPage) === 3) {
      html += `<span class="page-ellipsis">…</span>`;
    }
  }
  html += `<button class="page-btn" onclick="goPage(${currentPage + 1})" ${currentPage === pages ? "disabled" : ""}>›</button>`;
  el.innerHTML = html;
}

function goPage(n) {
  const total = filterBooks(currentFilters).length;
  const pages = Math.ceil(total / PAGE_SIZE);
  if (n < 1 || n > pages) return;
  currentPage = n;
  renderCatalog();
  document.getElementById("catalog-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── Filter setters (called from sidebar & homepage nav) ─────
function setCategory(val) {
  currentFilters.category = val;
  currentPage = 1;
  renderSidebar();
  renderCatalog();
}

function setSort(val) {
  currentFilters.sort = val;
  currentPage = 1;
  renderCatalog();
}

function applyPriceFilter() {
  const min = document.getElementById("price-min")?.value;
  const max = document.getElementById("price-max")?.value;
  currentFilters.minPrice = min || null;
  currentFilters.maxPrice = max || null;
  currentPage = 1;
  renderCatalog();
}

function catalogSearch() {
  const q = document.getElementById("catalog-search")?.value.trim();
  currentFilters.search = q || null;
  currentPage = 1;
  renderCatalog();
}

function toggleSaleFilter() {
  currentFilters.sale = document.getElementById("sale-toggle")?.checked || false;
  currentPage = 1;
  renderCatalog();
}

function clearAllFilters() {
  currentFilters = { category: null, search: null, minPrice: null, maxPrice: null, sort: "popular", sale: false };
  currentPage = 1;
  renderSidebar();
  renderCatalog();
}

// ── Sync URL bar (no reload) ──────────────────────────────────
function updateActiveURL() {
  const p = new URLSearchParams();
  if (currentFilters.category) p.set("category", currentFilters.category);
  if (currentFilters.search)   p.set("search",   currentFilters.search);
  if (currentFilters.sort && currentFilters.sort !== "popular") p.set("sort", currentFilters.sort);
  if (currentFilters.sale)     p.set("sale", "1");
  if (currentFilters.minPrice) p.set("minPrice", currentFilters.minPrice);
  if (currentFilters.maxPrice) p.set("maxPrice", currentFilters.maxPrice);
  const qs = p.toString();
  history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
}

// ── Event bindings ───────────────────────────────────────────
function bindEvents() {
  // Sort select
  document.getElementById("sort-select")?.addEventListener("change", e => setSort(e.target.value));
  // Price apply button
  document.getElementById("price-apply")?.addEventListener("click", applyPriceFilter);
  // Price inputs — apply on Enter
  ["price-min", "price-max"].forEach(id => {
    document.getElementById(id)?.addEventListener("keydown", e => { if (e.key === "Enter") applyPriceFilter(); });
  });
  // Catalog search — search on Enter
  document.getElementById("catalog-search")?.addEventListener("keydown", e => { if (e.key === "Enter") catalogSearch(); });
  document.getElementById("catalog-search-btn")?.addEventListener("click", catalogSearch);
  // Sale toggle
  document.getElementById("sale-toggle")?.addEventListener("change", toggleSaleFilter);
}