
import { fetchProducts, getProductById } from './productsManager.js';
import { addToCart } from './cartManager.js';

export async function initProductDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = parseInt(urlParams.get('id'));
  const products = await fetchProducts();
  const product = getProductById(products, productId);

  if (!product) {
    document.querySelector('.product-detail-container').innerHTML = '<p>Product not found.</p>';
    return;
  }

  const elements = {
    mainImage: document.querySelector('.main-image'),
    productTitle: document.querySelector('.product-title'),
    productRating: document.querySelector('.product-rating'),
    productSizes: document.querySelector('.product-sizes'),
    productColors: document.querySelector('.product-colors'),
    productPrice: document.querySelector('.product-price'),
    addToCartBtn: document.querySelector('.add-to-cart'),
    description: document.querySelector('.description-content p'),
    featuresTable: document.querySelector('.features-table'),
    productVideo: document.querySelector('.product-video source'),
    similarGrid: document.querySelector('.similar-grid')
  };

  let selectedColor = product.colors[0];
  let selectedSize = product.sizes[0];

  function renderProductDetails() {
    elements.mainImage.src = product.image;
    elements.mainImage.alt = product.name;
    elements.productTitle.textContent = product.name;
    elements.productRating.innerHTML = `
      <div class="stars">
        ${renderStars(product.rating)}
      </div>
      <span class="rating-score">${product.rating.toFixed(1)}</span>
      <div class="comments">
        <img src="/images/product_images/comment_icon.svg" alt="Comments" class="comment-icon">
        <span class="rating-count">${Math.floor(Math.random() * 200 + 50)} comments</span>
      </div>
    `;
    elements.productSizes.innerHTML = product.sizes.map(size => `
      <button type="button" class="size-option ${size === selectedSize ? 'active' : ''}" value="${size}">${size}</button>
    `).join('');
    elements.productColors.innerHTML = product.colors.map(color => `
      <button type="button" class="color-option ${color === selectedColor ? 'active' : ''}" style="background-color: ${color};" data-color="${color}"></button>
    `).join('');
    elements.productPrice.textContent = `$${product.price.toFixed(2)}`;
    elements.description.textContent = product.description;
    elements.featuresTable.innerHTML = `
      <tr>
        ${Object.keys(product.tableData).slice(0, 3).map(key => `
          <td>
            <div class="table-cell-content">
              <span class="cell-title">${key}</span>
              <span class="cell-value">${product.tableData[key]}</span>
            </div>
          </td>
        `).join('')}
      </tr>
      <tr>
        ${Object.keys(product.tableData).slice(3, 6).map(key => `
          <td>
            <div class="table-cell-content">
              <span class="cell-title">${key}</span>
              <span class="cell-value">${product.tableData[key]}</span>
            </div>
          </td>
        `).join('')}
      </tr>
    `;
    elements.productVideo.src = product.video;
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

  function renderSimilarProducts() {
    const similarProducts = products
      .filter(p => p.id !== product.id)
      .map(p => {
        const categoryMatch = p.category === product.category ? 3 : 0;
        const colorMatches = p.colors.filter(c => product.colors.includes(c)).length;
        const sizeMatches = p.sizes.filter(s => product.sizes.includes(s)).length;
        const score = categoryMatch + colorMatches + sizeMatches;
        return { product: p, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(item => item.product);

    elements.similarGrid.innerHTML = similarProducts.map(p => `
      <div class="product-card" data-id="${p.id}">
        <div class="product-image-container">
          <img src="${p.image}" alt="${p.name}" class="product-image">
          <button class="quick-view">Quick View</button>
        </div>
        <div class="product-info">
          <h3 class="product-name">${p.name}</h3>
          <p class="product-brand">${p.brand}</p>
          <div class="product-rating">
            ${renderStars(p.rating)}
            <span class="rating-count">(${Math.floor(Math.random() * 100 + 50)})</span>
          </div>
          <div class="product-price">$${p.price.toFixed(2)}</div>
          <div class="product-colors">${p.colors.length} colors</div>
          <div class="product-category">${p.category}</div>
          <button class="add-to-cart" data-id="${p.id}">Add to Cart</button>
        </div>
      </div>
    `).join('');
  }

  elements.productSizes.addEventListener('click', (e) => {
    const sizeOption = e.target.closest('.size-option');
    if (sizeOption) {
      selectedSize = sizeOption.value;
      elements.productSizes.querySelectorAll('.size-option').forEach(btn => btn.classList.remove('active'));
      sizeOption.classList.add('active');
    }
  });

  elements.productColors.addEventListener('click', (e) => {
    const colorOption = e.target.closest('.color-option');
    if (colorOption) {
      selectedColor = colorOption.dataset.color;
      elements.productColors.querySelectorAll('.color-option').forEach(btn => btn.classList.remove('active'));
      colorOption.classList.add('active');
    }
  });

  elements.addToCartBtn.addEventListener('click', async () => {
    await addToCart(product, selectedColor, selectedSize);
  });

  elements.similarGrid.addEventListener('click', async (e) => {
    const quickView = e.target.closest('.quick-view');
    const addToCartBtn = e.target.closest('.add-to-cart');

    if (quickView) {
      const productId = quickView.closest('.product-card').dataset.id;
      window.location.href = `/pages/product.html?id=${productId}`;
    }

    if (addToCartBtn) {
      const productId = parseInt(addToCartBtn.dataset.id);
      const similarProduct = products.find(p => p.id === productId);
      await addToCart(similarProduct, similarProduct.colors[0], similarProduct.sizes[0]);
    }
  });

  renderProductDetails();
  renderSimilarProducts();
}