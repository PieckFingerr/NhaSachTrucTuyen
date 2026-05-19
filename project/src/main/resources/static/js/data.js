// ===== PAGETURN — LIVE DATA from Spring Boot =====
const API_BASE = "/api"; // same origin, no CORS needed

let BOOKS = [];

async function loadBooks() {
  try {
    const res = await fetch(`${API_BASE}/books`);
    if (!res.ok) throw new Error("API error " + res.status);
    const data = await res.json();

    BOOKS = data.map(b => ({
      id:            b.id,
      title:         b.title        || "Untitled",
      author:        b.author       || "Unknown",
      category:      b.category     || "General",
      description:   b.description  || "",
      thumbnail:     b.thumbnail    || "",
      isbn:          b.isbn         || "",
      price:         Math.round(b.price),
      originalPrice: null,   // add this column to DB later if you want sale prices
      stock:         b.stock,
      rating:        parseFloat(b.rating.toFixed(1)),
      reviews:       b.reviews,
      emoji:         categoryEmoji(b.category),
      isNew:         b.id > (data.length - 10),   // last 10 inserted = "new"
      isBestseller:  b.reviews > 200,
    }));

    document.dispatchEvent(new Event("booksLoaded"));
  } catch (err) {
    console.error("Failed to load books:", err);
    document.dispatchEvent(new Event("booksLoaded")); // still fire so page renders
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
  if (category)  results = results.filter(b => b.category?.toLowerCase().includes(category.toLowerCase()));
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