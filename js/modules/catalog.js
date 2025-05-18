import { fetchProducts, filterProducts, sortProducts } from './productsManager.js';
import { showModal } from './modal.js';

export async function initCatalog() {
  const products = await fetchProducts();
  let filteredProducts = [...products];
  let currentPage = 1;
  const itemsPerPage = 9;

  const filters = {
    search: '',
    categories: [],
    priceMin: 20,
    priceMax: 250,
    colors: [],
    sizes: [],
    style: ''
  };

  const elements = {
    searchInput: document.querySelector('#search-input'),
    sortSelect: document.querySelector('#sort-by'),
    categoryFilter: document.querySelector('#category-filter'),
    priceMinSlider: document.querySelector('#price-range-min'),
    priceMaxSlider: document.querySelector('#price-range-max'),
    minPriceValue: document.querySelector('#min-price-value'),
    maxPriceValue: document.querySelector('#max-price-value'),
    colorFilter: document.querySelector('#color-filter'),
    sizeFilter: document.querySelector('#size-filter'),
    styleFilter: document.querySelector('#style-filter'),
    clearFilters: document.querySelector('.clear-filters'),
    productsGrid: document.querySelector('#products-grid'),
    productsCount: document.querySelector('#products-count'),
    pagination: document.querySelector('#pagination'),
    noResults: document.querySelector('#no-results')
  };

  function renderProducts() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedProducts = filteredProducts.slice(start, end);

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
    elements.pagination.style.display = filteredProducts.length === 0 ? 'none' : 'flex';

    renderPagination();
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

  function renderPagination() {
    if (filteredProducts.length === 0) return;

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const pageNumbers = elements.pagination.querySelector('#page-numbers');
    pageNumbers.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.innerHTML += `<button class="page-btn ${i === currentPage ? 'active' : ''}">${i}</button>`;
    }

    elements.pagination.querySelector('.prev-btn').disabled = currentPage === 1;
    elements.pagination.querySelector('.next-btn').disabled = currentPage === totalPages;
  }

  function applyFilters() {
    filteredProducts = filterProducts(products, filters);
    filteredProducts = sortProducts(filteredProducts, elements.sortSelect.value);
    currentPage = 1;
    renderProducts();
  }

  elements.searchInput.addEventListener('input', (e) => {
    filters.search = e.target.value;
    applyFilters();
  });

  elements.sortSelect.addEventListener('change', () => {
    applyFilters();
  });

  elements.categoryFilter.addEventListener('change', (e) => {
    if (e.target.name === 'category') {
      filters.categories = Array.from(elements.categoryFilter.querySelectorAll('input:checked'))
        .map(input => input.value);
      applyFilters();
    }
  });

  elements.priceMinSlider.addEventListener('input', () => {
    filters.priceMin = parseInt(elements.priceMinSlider.value);
    elements.minPriceValue.textContent = filters.priceMin;
    if (filters.priceMin > filters.priceMax) {
      filters.priceMax = filters.priceMin;
      elements.priceMaxSlider.value = filters.priceMax;
      elements.maxPriceValue.textContent = filters.priceMax;
    }
    applyFilters();
  });

  elements.priceMaxSlider.addEventListener('input', () => {
    filters.priceMax = parseInt(elements.priceMaxSlider.value);
    elements.maxPriceValue.textContent = filters.priceMax;
    if (filters.priceMax < filters.priceMin) {
      filters.priceMin = filters.priceMax;
      elements.priceMinSlider.value = filters.priceMin;
      elements.minPriceValue.textContent = filters.priceMin;
    }
    applyFilters();
  });

  elements.colorFilter.addEventListener('click', (e) => {
    const colorOption = e.target.closest('.color-option');
    if (colorOption) {
      const color = colorOption.dataset.color;
      colorOption.classList.toggle('active');
      if (colorOption.classList.contains('active')) {
        filters.colors.push(color);
      } else {
        filters.colors = filters.colors.filter(c => c !== color);
      }
      applyFilters();
    }
  });

  elements.sizeFilter.addEventListener('click', (e) => {
    const sizeOption = e.target.closest('.size-option');
    if (sizeOption) {
      const size = sizeOption.dataset.size;
      sizeOption.classList.toggle('active');
      if (sizeOption.classList.contains('active')) {
        filters.sizes.push(size);
      } else {
        filters.sizes = filters.sizes.filter(s => s !== size);
      }
      applyFilters();
    }
  });

  elements.styleFilter.addEventListener('change', () => {
    filters.style = elements.styleFilter.value;
    applyFilters();
  });

  elements.clearFilters.addEventListener('click', () => {
    filters.search = '';
    filters.categories = [];
    filters.priceMin = 20;
    filters.priceMax = 250;
    filters.colors = [];
    filters.sizes = [];
    filters.style = '';

    elements.searchInput.value = '';
    elements.sortSelect.value = 'default';
    elements.categoryFilter.querySelectorAll('input').forEach(input => input.checked = false);
    elements.priceMinSlider.value = 20;
    elements.priceMaxSlider.value = 250;
    elements.minPriceValue.textContent = '20';
    elements.maxPriceValue.textContent = '250';
    elements.colorFilter.querySelectorAll('.color-option').forEach(option => option.classList.remove('active'));
    elements.sizeFilter.querySelectorAll('.size-option').forEach(option => option.classList.remove('active'));
    elements.styleFilter.value = '';

    applyFilters();
  });

  elements.pagination.addEventListener('click', (e) => {
    const btn = e.target.closest('.page-btn');
    if (!btn || btn.disabled) return;

    if (btn.classList.contains('prev-btn')) {
      currentPage--;
    } else if (btn.classList.contains('next-btn')) {
      currentPage++;
    } else {
      currentPage = parseInt(btn.textContent);
    }

    renderProducts();
  });

  renderProducts();
}