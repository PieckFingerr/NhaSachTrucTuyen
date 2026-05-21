// ===== CART MANAGEMENT =====

let cart = JSON.parse(localStorage.getItem("pt_cart") || "[]");
let appliedCoupon = null;

function saveCart() {
  localStorage.setItem("pt_cart", JSON.stringify(cart));
  updateCartUI();
}

// ── Đồng bộ stock xuống DB qua API ──────────────────────────
async function syncStockToServer(bookId, qty, restore = false) {
  try {
    const endpoint = restore
      ? `/api/books/${bookId}/stock/restore`
      : `/api/books/${bookId}/stock`;
    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: qty }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, available: err.available ?? null };
    }
    const data = await res.json();
    // Cập nhật lại stock trong BOOKS array (in-memory)
    const book = BOOKS.find((b) => b.id === bookId);
    if (book) book.stock = data.stock;
    return { ok: true, stock: data.stock };
  } catch {
    // Nếu không có server (dev offline), vẫn cho phép hoạt động
    return { ok: true };
  }
}

// ── Thêm vào giỏ — giảm stock ngay ─────────────────────────
async function addToCart(bookId, qty = 1) {
  const book = getBookById(bookId);
  if (!book) return;

  const existing = cart.find((i) => i.id === bookId);
  const currentQty = existing ? existing.qty : 0;

  if (currentQty + qty > book.stock) {
    showToast(`Chỉ còn ${book.stock} cuốn trong kho!`, "error");
    return;
  }

  // Trừ stock trên server trước
  const result = await syncStockToServer(bookId, qty);
  if (!result.ok) {
    const avail = result.available ?? book.stock;
    showToast(
      avail === 0
        ? "Sách đã hết hàng!"
        : `Chỉ còn ${avail} cuốn trong kho!`,
      "error"
    );
    // Đồng bộ lại stock hiện thực từ server nếu lệch
    if (result.available !== null) {
      const b = BOOKS.find((b) => b.id === bookId);
      if (b) b.stock = result.available;
    }
    return;
  }

  // Trừ stock in-memory (phòng trường hợp server offline không trả về)
  book.stock = Math.max(0, book.stock - qty);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: bookId, qty });
  }
  saveCart();
  showToast(`"${book.title}" đã thêm vào giỏ!`, "success");
}

// ── Xoá khỏi giỏ — hoàn stock ───────────────────────────────
async function removeFromCart(bookId) {
  const item = cart.find((i) => i.id === bookId);
  if (!item) return;

  await syncStockToServer(bookId, item.qty, true);
  const book = BOOKS.find((b) => b.id === bookId);
  if (book) book.stock += item.qty;

  cart = cart.filter((i) => i.id !== bookId);
  saveCart();
}

// ── Đổi số lượng trong giỏ ──────────────────────────────────
async function updateQty(bookId, newQty) {
  const item = cart.find((i) => i.id === bookId);
  const book = getBookById(bookId);
  if (!book || !item) return;

  if (newQty < 1) {
    await removeFromCart(bookId);
    return;
  }

  const delta = newQty - item.qty; // dương = thêm, âm = bớt
  if (delta === 0) return;

  if (delta > 0) {
    // Cần thêm hàng → kiểm tra & trừ stock
    if (delta > book.stock) {
      showToast(`Chỉ còn ${book.stock} cuốn nữa!`, "error");
      return;
    }
    const result = await syncStockToServer(bookId, delta);
    if (!result.ok) {
      showToast("Không đủ hàng trong kho!", "error");
      return;
    }
    book.stock = Math.max(0, book.stock - delta);
  } else {
    // Bớt hàng → hoàn stock
    const restoreQty = Math.abs(delta);
    await syncStockToServer(bookId, restoreQty, true);
    book.stock += restoreQty;
  }

  item.qty = newQty;
  saveCart();
}

function clearCart() {
  // Hoàn stock cho tất cả item (không await để không chặn)
  cart.forEach((item) => syncStockToServer(item.id, item.qty, true));
  cart = [];
  appliedCoupon = null;
  saveCart();
}

// Dùng sau khi đặt hàng thành công — KHÔNG hoàn stock vì đã bán rồi
function clearCartAfterOrder() {
  cart = [];
  appliedCoupon = null;
  saveCart();
}

function getCartSubtotal() {
  return cart.reduce((sum, item) => {
    const book = getBookById(item.id);
    return sum + (book ? book.price * item.qty : 0);
  }, 0);
}

function getDiscount() {
  if (!appliedCoupon) return 0;
  const subtotal = getCartSubtotal();
  if (subtotal < appliedCoupon.minOrder) return 0;
  if (appliedCoupon.type === "percent")
    return Math.round((subtotal * appliedCoupon.value) / 100);
  return Math.min(appliedCoupon.value, subtotal);
}

function getCartTotal() {
  return getCartSubtotal() - getDiscount();
}

// ── Áp dụng coupon — kiểm tra active flag ───────────────────
function applyCoupon() {
  const code = document
    .getElementById("coupon-input")
    ?.value?.trim()
    .toUpperCase();
  if (!code) return;

  // Ưu tiên đọc coupon từ localStorage (admin có thể đã sửa)
  const storedCoupons = JSON.parse(
    localStorage.getItem("pt_coupons") || "[]"
  );
  const allCoupons = storedCoupons.length > 0 ? storedCoupons : COUPONS;
  const coupon = allCoupons.find((c) => c.code === code);

  if (!coupon) {
    showToast("Mã giảm giá không hợp lệ", "error");
    return;
  }

  // ★ Kiểm tra coupon có đang hoạt động không
  if (coupon.active === false) {
    showToast(`Mã "${code}" hiện không khả dụng`, "error");
    return;
  }

  const subtotal = getCartSubtotal();
  if (subtotal < coupon.minOrder) {
    showToast(
      `Đơn hàng tối thiểu ${formatPrice(coupon.minOrder)} để dùng mã này`,
      "error"
    );
    return;
  }

  appliedCoupon = coupon;
  updateCartUI();
  showToast(`Áp dụng thành công! ${coupon.description}`, "success");
}

function updateCartUI() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const badge = document.getElementById("cart-badge");
  const countEl = document.getElementById("cart-count");
  if (badge) badge.textContent = count;
  if (countEl) countEl.textContent = count;

  const itemsEl = document.getElementById("cart-items");
  if (!itemsEl) return;

  if (cart.length === 0) {
    itemsEl.innerHTML = `<div class="cart-empty"><div class="empty-icon">🛒</div><p>Giỏ hàng trống</p></div>`;
  } else {
    itemsEl.innerHTML = cart
      .map((item) => {
        const book = getBookById(item.id);
        if (!book) return "";
        return `
        <div class="cart-item">
          <div class="cart-item-img">
            ${
              book.thumbnail
                ? `<img src="${book.thumbnail}" alt="${book.title}"
                    style="width:100%;height:100%;object-fit:cover;border-radius:6px"
                    onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                 <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center">${book.emoji}</div>`
                : book.emoji
            }
          </div>
          <div class="cart-item-info">
            <div class="cart-item-title">${book.title}</div>
            <div class="cart-item-author">${book.author}</div>
            <div class="cart-item-controls">
              <button class="qty-btn" onclick="updateQty(${book.id}, ${item.qty - 1})">−</button>
              <span class="qty-num">${item.qty}</span>
              <button class="qty-btn" onclick="updateQty(${book.id}, ${item.qty + 1})">+</button>
              <span class="cart-item-price">${formatPrice(book.price * item.qty)}</span>
              <button class="cart-item-remove" onclick="removeFromCart(${book.id})" title="Xoá">×</button>
            </div>
          </div>
        </div>
      `;
      })
      .join("");
  }

  // Totals
  const subtotal = getCartSubtotal();
  const discount = getDiscount();
  const total = getCartTotal();
  const subEl = document.getElementById("cart-subtotal");
  const totEl = document.getElementById("cart-total");
  const discRow = document.getElementById("discount-row");
  const discEl = document.getElementById("cart-discount");
  if (subEl) subEl.textContent = formatPrice(subtotal);
  if (totEl) totEl.textContent = formatPrice(total);
  if (discRow) discRow.classList.toggle("hidden", discount === 0);
  if (discEl) discEl.textContent = "-" + formatPrice(discount);
}

function toggleCart() {
  const sidebar = document.getElementById("cart-sidebar");
  if (sidebar) sidebar.classList.toggle("hidden");
  updateCartUI();
}

function goToCheckout() {
  if (cart.length === 0) {
    showToast("Giỏ hàng trống!", "error");
    return;
  }
  if (!currentUser) {
    toggleCart();
    openAuth("login");
    return;
  }
  toggleCart();
  window.location.href = "/checkout";
}

// Init
updateCartUI();