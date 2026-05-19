// ===== CART MANAGEMENT =====

let cart = JSON.parse(localStorage.getItem("pt_cart") || "[]");
let appliedCoupon = null;

function saveCart() {
  localStorage.setItem("pt_cart", JSON.stringify(cart));
  updateCartUI();
}

function addToCart(bookId, qty = 1) {
  const book = getBookById(bookId);
  if (!book) return;

  // Check stock
  const existing = cart.find(i => i.id === bookId);
  const currentQty = existing ? existing.qty : 0;
  if (currentQty + qty > book.stock) {
    showToast(`Only ${book.stock} in stock!`, "error");
    return;
  }

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: bookId, qty });
  }
  saveCart();
  showToast(`"${book.title}" added to cart!`, "success");
}

function removeFromCart(bookId) {
  cart = cart.filter(i => i.id !== bookId);
  saveCart();
}

function updateQty(bookId, newQty) {
  const book = getBookById(bookId);
  if (!book) return;
  if (newQty < 1) { removeFromCart(bookId); return; }
  if (newQty > book.stock) {
    showToast(`Only ${book.stock} in stock!`, "error");
    return;
  }
  const item = cart.find(i => i.id === bookId);
  if (item) { item.qty = newQty; saveCart(); }
}

function clearCart() {
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
  if (appliedCoupon.type === "percent") return Math.round(subtotal * appliedCoupon.value / 100);
  return Math.min(appliedCoupon.value, subtotal);
}

function getCartTotal() {
  return getCartSubtotal() - getDiscount();
}

function applyCoupon() {
  const code = document.getElementById("coupon-input")?.value?.trim().toUpperCase();
  if (!code) return;
  const coupon = COUPONS.find(c => c.code === code);
  if (!coupon) { showToast("Invalid coupon code", "error"); return; }
  const subtotal = getCartSubtotal();
  if (subtotal < coupon.minOrder) {
    showToast(`Minimum order ₫${coupon.minOrder.toLocaleString()} required`, "error");
    return;
  }
  appliedCoupon = coupon;
  updateCartUI();
  showToast(`Coupon applied! ${coupon.description}`, "success");
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
    itemsEl.innerHTML = `<div class="cart-empty"><div class="empty-icon">🛒</div><p>Your cart is empty</p></div>`;
  } else {
    itemsEl.innerHTML = cart.map(item => {
      const book = getBookById(item.id);
      if (!book) return "";
      return `
        <div class="cart-item">
          <div class="cart-item-img">
            ${book.thumbnail
              ? `<img src="${book.thumbnail}" alt="${book.title}"
                    style="width:100%;height:100%;object-fit:cover;border-radius:6px"
                    onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                 <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center">${book.emoji}</div>`
              : book.emoji}
          </div>
          <div class="cart-item-info">
            <div class="cart-item-title">${book.title}</div>
            <div class="cart-item-author">${book.author}</div>
            <div class="cart-item-controls">
              <button class="qty-btn" onclick="updateQty(${book.id}, ${item.qty - 1})">−</button>
              <span class="qty-num">${item.qty}</span>
              <button class="qty-btn" onclick="updateQty(${book.id}, ${item.qty + 1})">+</button>
              <span class="cart-item-price">${formatPrice(book.price * item.qty)}</span>
              <button class="cart-item-remove" onclick="removeFromCart(${book.id})" title="Remove">×</button>
            </div>
          </div>
        </div>
      `;
    }).join("");
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
  if (cart.length === 0) { showToast("Your cart is empty!", "error"); return; }
  if (!currentUser) {
    toggleCart();
    openAuth('login');
    return;
  }
  toggleCart();
  window.location.href = "/checkout";
}

// Init
updateCartUI();