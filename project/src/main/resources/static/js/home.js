// ===== HOMEPAGE =====
document.addEventListener("booksLoaded", () => {
  // Render new arrivals
  const newGrid = document.getElementById("new-arrivals-grid");
  if (newGrid) {
    newGrid.innerHTML = getNewArrivals(8).map(createProductCard).join("");
  }
  // Render bestsellers
  const bsGrid = document.getElementById("bestsellers-grid");
  if (bsGrid) {
    bsGrid.innerHTML = getBestsellers(8).map(createProductCard).join("");
  }
});
