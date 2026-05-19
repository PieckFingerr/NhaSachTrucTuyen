// ===== UI UTILITIES =====

function showToast(message, type = "default") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const icons = { success: "✓", error: "✕", info: "ℹ", default: "•" };
  toast.innerHTML = `<span>${icons[type] || icons.default}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "fadeOut 0.3s ease forwards";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function createProductCard(book) {
  const isLowStock = book.stock > 0 && book.stock < 5;
  const isOutOfStock = book.stock === 0;
  const discount = book.originalPrice
    ? Math.round((1 - book.price / book.originalPrice) * 100)
    : 0;

  return `
    <div class="product-card" onclick="openQuickView(${book.id})">
      <div class="product-img">
        ${book.thumbnail
          ? `<img src="${book.thumbnail}" alt="${book.title}"
                style="width:100%;height:100%;object-fit:cover;border-radius:8px 8px 0 0"
                onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
          : ""}
        <div class="product-img-inner" style="${book.thumbnail ? 'display:none' : ''}">${book.emoji}</div>
        ${discount > 0 ? `<div class="product-badge">-${discount}%</div>` : ""}
        ${book.isNew && discount === 0 ? `<div class="product-badge new">NEW</div>` : ""}
      </div>
      <div class="product-info">
        <div class="product-cat">${book.category}</div>
        <div class="product-title">${book.title}</div>
        <div class="product-author">${book.author}</div>
        <div class="product-stars">${"★".repeat(Math.floor(book.rating))}${"☆".repeat(5 - Math.floor(book.rating))} <span style="color:var(--text-muted);font-size:11px">(${book.reviews})</span></div>
        <div class="product-pricing">
          <span class="price-current">${formatPrice(book.price)}</span>
          ${book.originalPrice ? `<span class="price-original">${formatPrice(book.originalPrice)}</span>` : ""}
        </div>
        <div class="product-stock ${isLowStock ? "low" : ""}">
          ${isOutOfStock ? "hết hàng" : isLowStock ? `Only ${book.stock} left!` : `In stock (${book.stock})`}
        </div>
        <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(${book.id})" ${isOutOfStock ? "disabled" : ""}>
          ${isOutOfStock ? "hết hàng" : "Thêm vào giỏ hàng"}
        </button>
      </div>
    </div>
  `;
}

function openQuickView(bookId) {
  const book = getBookById(bookId);
  if (!book) return;
  const modal = document.getElementById("quickview-modal");
  const content = document.getElementById("quickview-content");
  const isLowStock = book.stock > 0 && book.stock < 5;
  const discount = book.originalPrice
    ? Math.round((1 - book.price / book.originalPrice) * 100)
    : 0;

  content.innerHTML = `
  <div class="qv-image">
    ${book.thumbnail
      ? `<img src="${book.thumbnail}" alt="${book.title}"
            style="width:100%;height:100%;object-fit:cover;border-radius:8px"
            onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:80px">${book.emoji}</div>`
      : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:80px">${book.emoji}</div>`}
  </div>
  <div class="qv-info">
    <div class="qv-cat">${book.category}</div>
    <h2 class="qv-title">${book.title}</h2>
    <p class="qv-author">by <strong>${book.author}</strong></p>
    <div class="qv-stars">${"★".repeat(Math.floor(book.rating))}${"☆".repeat(5 - Math.floor(book.rating))}</div>
    <p class="qv-reviews">${book.reviews} reviews</p>
    <div class="qv-right-panel">
      <div class="qv-price">${formatPrice(book.price)}</div>
      ${book.originalPrice ? `
        <div class="qv-orig">
          <span style="text-decoration: line-through;">${formatPrice(book.originalPrice)}</span>
          <span style="text-decoration: none; color: var(--accent); font-size: 13px; margin-left: 6px;">Save ${discount}%</span>
        </div>` : ""}
      <p class="qv-desc">${book.description}</p>
      <p class="qv-stock">${book.stock === 0 ? "❌ hết hàng" : isLowStock ? `⚠️ Only ${book.stock} left in stock` : `✓ In stock (${book.stock} available)`}</p>
      <div class="qv-qty">
        <span class="qv-qty-label">Qty:</span>
        <div class="qv-qty-ctrl">
          <button class="qty-btn" onclick="qvChangeQty(-1)">−</button>
          <span class="qty-num" id="qv-qty">1</span>
          <button class="qty-btn" onclick="qvChangeQty(1)">+</button>
        </div>
      </div>
      <div class="qv-actions">
        <button class="btn-primary" onclick="addToCart(${book.id}, parseInt(document.getElementById('qv-qty').textContent)); closeQuickView()" ${book.stock === 0 ? "disabled" : ""}>
          ${book.stock === 0 ? "hết hàng" : "Thêm vào giỏ hàng"}
        </button>
      </div>
      <div class="qv-recommend">
        <div class="qv-recommend-header">
          <div class="qv-recommend-title">You may also like</div>
          <div class="qv-rec-arrows">
            <button class="qv-rec-arrow" onclick="qvRecScroll(-1)">‹</button>
            <button class="qv-rec-arrow" onclick="qvRecScroll(1)">›</button>
          </div>
        </div>
        <div class="qv-recommend-list" id="qv-rec-list">
          ${BOOKS.filter(b => b.id !== book.id && b.category === book.category)
            .slice(0, 10)
            .map(b => createProductCard(b))
            .join("")}
        </div>
      </div>
    </div>
  </div>
`;
  modal.classList.remove("hidden");
  modal._bookId = bookId;
}

function qvChangeQty(delta) {
  const el = document.getElementById("qv-qty");
  const modal = document.getElementById("quickview-modal");
  const book = getBookById(modal._bookId);
  if (!el || !book) return;
  const newVal = Math.max(
    1,
    Math.min(book.stock, parseInt(el.textContent) + delta),
  );
  el.textContent = newVal;
}

function closeQuickView() {
  document.getElementById("quickview-modal")?.classList.add("hidden");
}

function doSearch() {
  const query = document.getElementById("search-input")?.value.trim();
  if (!query) return;
  window.location.href = `/catalog?search=${encodeURIComponent(query)}`;
}

// Close modals on overlay click
document
  .getElementById("quickview-modal")
  ?.addEventListener("click", function (e) {
    if (e.target === this) closeQuickView();
  });

function qvRecScroll(dir) {
  const list = document.getElementById("qv-rec-list");
  if (!list) return;
  list.scrollBy({ left: dir * 320, behavior: "smooth" });
}