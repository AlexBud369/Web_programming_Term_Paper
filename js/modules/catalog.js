import { fetchProducts } from './productsManager.js';
import { showModal } from './modal.js';

export async function initCatalog() {
  const products = await fetchProducts();
  let filteredProducts = [...products];
  const itemsPerPage = 9;

  const elements = {
    productsGrid: document.querySelector('#products-grid'),
    productsCount: document.querySelector('#products-count'),
    noResults: document.querySelector('#no-results')
  };

  function renderProducts() {
    const paginatedProducts = filteredProducts.slice(0, itemsPerPage);

    elements.productsGrid.innerHTML = paginatedProducts.map(product => `
      <div class="product-card" data-id="${product.id}">
        <div class="product-image-container">
          <img src="${product.image}" alt="${product.name}" class="product-image">
          <button class="quick-view">Quick View</button>
        </div>
        <div class="product-info">
          <h3 class="product-name">${product.name}</h3>
          <p class="product-brand">${product.brand}</p>
          <div class="product-rating">
            ${renderStars(product.rating)}
            <span class="rating-count">(${Math.floor(Math.random() * 100 + 50)})</span>
          </div>
          <div class="product-price">$${product.price.toFixed(2)}</div>
          <div class="product-colors">${product.colors.length} colors</div>
          <div class="product-category">${product.category}</div>
          <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
        </div>
      </div>
    `).join('');

    elements.productsCount.textContent = `${filteredProducts.length} items`;
    elements.noResults.style.display = filteredProducts.length === 0 ? 'block' : 'none';
  }

  function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    let stars = '';
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars += `<img src="/images/home_page_icons/full_star_icon.svg" alt="Full Star" class="rating-icon">`;
      } else if (i === fullStars && halfStar) {
        stars += `<img src="/images/home_page_icons/half_star_icon.svg" alt="Half Star" class="rating-icon">`;
      } else {
        stars += `<img src="/images/home_page_icons/star_outline_icon.svg" alt="Outline Star" class="rating-icon">`;
      }
    }
    return stars;
  }

  renderProducts();
}