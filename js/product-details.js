import { initAddToCart } from './modules/addToCart.js';
import { showSuccessModalAfterReload } from './modules/modal.js';
import { initBurgerMenu } from './modules/burgerMenu.js'; 

const API_URL = 'http://localhost:3000/products';

async function fetchProduct(id) {
    try {
        const res = await fetch(`${API_URL}/${id}`);
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        return await res.json();
    } catch (error) {
        console.error('Error fetching product:', error.message);
        return null;
    }
}

async function fetchSimilarProducts(currentProduct) {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const products = await res.json();
        return products
            .filter(product => product.id !== currentProduct.id)
            .filter(product => {
                const priceDiff = Math.abs(product.price - currentProduct.price) <= 15;
                const hasCommonColor = product.colors.some(color => currentProduct.colors.includes(color));
                const hasCommonSize = product.sizes.some(size => currentProduct.sizes.includes(size));
                const sameStyle = product.style === currentProduct.style;
                return priceDiff || hasCommonColor || hasCommonSize || sameStyle;
            })
            .slice(0, 4);
    } catch (error) {
        console.error('Error fetching similar products:', error.message);
        return [];
    }
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    return `
        ${'<img src="../images/home_page_icons/full_star_icon.svg" alt="Full Star" class="rating-icon">'.repeat(fullStars)}
        ${halfStar ? '<img src="../images/home_page_icons/half_star_icon.svg" alt="Half Star" class="rating-icon">' : ''}
        ${'<img src="../images/home_page_icons/star_outline_icon.svg" alt="Outline Star" class="rating-icon">'.repeat(emptyStars)}
    `;
}

function renderProduct(product) {
    if (!product) {
        const container = document.querySelector('.product-detail-container');
        if (container) {
            container.innerHTML = '<p>Product not found.</p>';
        }
        return;
    }

    let selectedColor = null;
    let selectedSize = null;

    const mainImage = document.querySelector('.main-image');
    if (mainImage) {
        mainImage.src = product.image;
        mainImage.alt = product.name;
    }

    const productTitle = document.querySelector('.product-title');
    if (productTitle) {
        productTitle.textContent = product.name;
    }

    const productRating = document.querySelector('.product-rating');
    if (productRating) {
        productRating.innerHTML = `
            <div class="stars">${generateStars(product.rating)}</div>
            <span class="rating-score">${product.rating.toFixed(1)}</span>
        `;
    }

    const sizesContainer = document.querySelector('.product-sizes');
    if (sizesContainer) {
        sizesContainer.innerHTML = product.sizes.map(size => `
            <button class="size-option" data-size="${size}">${size}</button>
        `).join('');
        sizesContainer.querySelectorAll('.size-option').forEach(button => {
            button.addEventListener('click', () => {
                sizesContainer.querySelectorAll('.size-option').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                selectedSize = button.dataset.size;
            });
        });
    }

    const colorsContainer = document.querySelector('.product-colors');
    if (colorsContainer) {
        colorsContainer.innerHTML = product.colors.map(color => `
            <div class="color-option" style="background-color: ${color};" data-color="${color}"></div>
        `).join('');
        colorsContainer.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', () => {
                colorsContainer.querySelectorAll('.color-option').forEach(opt => opt.style.border = '2px solid transparent');
                option.style.border = '2px solid #8A33FD';
                selectedColor = option.dataset.color;
            });
        });
    }

    const productPrice = document.querySelector('.product-price');
    if (productPrice) {
        productPrice.textContent = `$${product.price.toFixed(2)}`;
    }

    const description = document.querySelector('.description-content p');
    if (description) {
        description.textContent = product.description || 'No description available.';
    }

    const featuresTable = document.querySelector('.features-table');
    if (featuresTable) {
        featuresTable.innerHTML = `
            <tr>${Object.keys(product.tableData).map(key => `<td>${key}</td>`).join('')}</tr>
            <tr>${Object.values(product.tableData).map(value => `<td>${value}</td>`).join('')}</tr>
        `;
    }

    const video = document.querySelector('.product-video');
    if (video) {
        const source = video.querySelector('source');
        if (source) {
            source.src = product.video || '';
        }
        video.poster = product.image;
    }

    const addToCartButton = document.querySelector('.add-to-cart');
    if (addToCartButton) {
        addToCartButton.dataset.productId = product.id;
        initAddToCart('product', '.add-to-cart', [product]);
    }
}

function renderSimilarProducts(products) {
    const similarGrid = document.querySelector('.similar-grid');
    if (!similarGrid) {
        console.error('Similar products grid not found');
        return;
    }

    similarGrid.innerHTML = products.length ? products.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image-container">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <button class="quick-view" data-product-id="${product.id}">Quick View</button>
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-brand">${product.brand}</p>
                <div class="product-rating">
                    ${generateStars(product.rating)}
                    <span class="rating-count">(${product.rating.toFixed(1)})</span>
                </div>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <p class="product-colors">${product.colors.length} colors</p>
                <p class="product-category">${product.category}</p>
                <button class="add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
            </div>
        </div>
    `).join('') : '<p>No similar products found.</p>';

    similarGrid.querySelectorAll('.quick-view').forEach(button => {
        button.addEventListener('click', () => {
            const productId = button.dataset.productId;
            window.location.href = `product.html?id=${productId}`;
        });
    });

    initAddToCart('catalog', '.add-to-cart-btn', products);
}

async function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    if (!productId) {
        const container = document.querySelector('.product-detail-container');
        if (container) {
            container.innerHTML = '<p>Invalid product ID.</p>';
        }
        return;
    }

    const product = await fetchProduct(productId);
    if (product) {
        renderProduct(product);
        const similarProducts = await fetchSimilarProducts(product);
        renderSimilarProducts(similarProducts);
    } else {
        const container = document.querySelector('.product-detail-container');
        if (container) {
            container.innerHTML = '<p>Product not found.</p>';
        }
    }

    showSuccessModalAfterReload();
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    initBurgerMenu(false); 
});