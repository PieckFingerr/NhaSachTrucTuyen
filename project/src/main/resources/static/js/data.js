// ===== PAGETURN — LIVE DATA from Spring Boot =====
const API_BASE = "/api"; // same origin, no CORS needed

let BOOKS = [];

async function loadBooks() {
  try {
    const res = await fetch(`${API_BASE}/books`);
    if (!res.ok) throw new Error("API error " + res.status);
    const data = await res.json();

    BOOKS = data.map(b => {
      const price = Math.round(b.price) || 0;
      const hasSale = price > 0 && Math.random() < 0.3;
      const discountPct = hasSale ? (Math.floor(Math.random() * 4) + 1) * 10 : 0;
      const originalPrice = hasSale
        ? Math.round(price / (1 - discountPct / 100) / 1000) * 1000
        : null;

      return {
        id:            b.id,
        title:         b.title        || "Untitled",
        author:        b.author       || "Unknown",
        category:      b.category     || "General",
        description:   b.description  || "",
        thumbnail:     b.thumbnail    || "",
        isbn:          b.isbn         || "",
        price,
        originalPrice,
        stock:         b.stock        || 0,
        rating:        parseFloat((b.rating || 0).toFixed(1)),
        reviews:       b.reviews      || 0,
        emoji:         categoryEmoji(b.category),
        isNew:         b.id > (data.length - 10),
        isBestseller:  b.reviews > 200,
      };
    });

    document.dispatchEvent(new Event("booksLoaded"));
  } catch (err) {
    console.error("Failed to load books:", err);
    document.dispatchEvent(new Event("booksLoaded"));
  }
}
function categoryEmoji(cat) {
  const map = {
    "Fiction": "📚", "Science": "🔬", "History": "🏛️",
    "Self-Help": "🧘", "Biography": "🎓", "Business": "💼",
    "Children": "🧸", "General": "📖", "Non-Fiction": "💡",
  };
  if (!cat) return "📖";
  for (const key of Object.keys(map)) {
    if (cat.toLowerCase().includes(key.toLowerCase())) return map[key];
  }
  return "📖";
}

function formatPrice(amount) {
  return "₫" + Math.round(amount).toLocaleString("vi-VN");
}

function getBookById(id) {
  return BOOKS.find(b => b.id === parseInt(id));
}

function getNewArrivals(limit = 8) {
  return BOOKS.filter(b => b.isNew).slice(0, limit);
}

function getBestsellers(limit = 8) {
  return BOOKS.filter(b => b.isBestseller).slice(0, limit);
}

function filterBooks({ category, minPrice, maxPrice, search, sort, sale } = {}) {
  let results = [...BOOKS];
  if (minPrice)  results = results.filter(b => b.price >= parseInt(minPrice));
  if (maxPrice)  results = results.filter(b => b.price <= parseInt(maxPrice));
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(b =>
      b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
    );
  }
  if (sale) results = results.filter(b => b.originalPrice && b.originalPrice > b.price);
  switch (sort) {
    case "price-asc":  results.sort((a, b) => a.price - b.price); break;
    case "price-desc": results.sort((a, b) => b.price - a.price); break;
    case "newest":     results = results.filter(b => b.isNew).concat(results.filter(b => !b.isNew)); break;
    case "popular":    results.sort((a, b) => b.reviews - a.reviews); break;
    case "rating":     results.sort((a, b) => b.rating - a.rating); break;
  }
  return results;
}

// Kick off immediately
loadBooks();

let COUPONS = JSON.parse(localStorage.getItem("pt_coupons") || JSON.stringify([
    { code: "BOOK40",    type: "percent", value: 40, minOrder: 0,      description: "Giảm 40% tất cả sách",        active: true },
    { code: "SUMMER20",  type: "percent", value: 20, minOrder: 300000, description: "Giảm 20% đơn trên ₫300k",     active: true },
    { code: "WELCOME50", type: "fixed",   value: 50000, minOrder: 200000, description: "Giảm ₫50k đơn trên ₫200k", active: true },
]));