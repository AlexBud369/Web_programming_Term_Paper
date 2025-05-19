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
    productVideo: document.querySelector('.product-video source')
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

  renderProductDetails();
}