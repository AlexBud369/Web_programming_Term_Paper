import { initAddToCart } from './modules/addToCart.js';
import { showSimpleModal, showAddToCartModal } from './modules/modal.js';
import { initBurgerMenu } from './modules/burgerMenu.js';
import { checkAuth, updateUserProfile } from './modules/auth.js';
import { initFavorites } from './modules/favorites.js';
import { initLanguageSwitcher } from './modules/languageSwitcher.js';
import { initThemeSwitcher } from './modules/themeSwitcher.js';
import { translations as productTranslations } from './modules/pages-translations/product_translations.js';
import { showPreloader, hidePreloader, initPreloader } from './modules/preloader.js';

const API_URL = 'http://localhost:3000/products';

async function fetchProduct(id) {
    const lang = localStorage.getItem('language') || 'en';
    try {
        showPreloader();
        const res = await fetch(`${API_URL}/${id}`);
        if (res.status === 404) {
            showSimpleModal('error_title', 'product_not_found', 'modal-error', lang);
            setTimeout(() => window.location.assign('../pages/page_404_error.html'), 1500);
            return null;
        }
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        return await res.json();
    } catch (error) {     
        console.error('Error fetching product:', error.message);
        showSimpleModal('error_title', 'error_loading_product', 'modal-error', lang);
        return null;
    } finally {
        hidePreloader();
    }
}

async function fetchSimilarProducts(currentProduct) {
    const lang = localStorage.getItem('language') || 'en';
    try {
        showPreloader();
        const res = await fetch(API_URL);
        if (res.status === 404) {
            showSimpleModal('error_title', 'no_similar_products', 'modal-error', lang);
            setTimeout(() => window.location.assign('../pages/page_404_error.html'), 1500);
            return [];
        }
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const products = await res.json();
        return products
            .filter(product => product.id !== currentProduct.id)
            .filter(product => {
                const priceDiff = Math.abs(product.price - currentProduct.price) <= 15;
                const hasCommonColor = product.colors?.some(color => currentProduct.colors?.includes(color));
                const hasCommonSize = product.sizes?.some(size => currentProduct.sizes?.includes(size));
                const sameStyle = product.style === currentProduct.style;
                return priceDiff || hasCommonColor || hasCommonSize || sameStyle;
            })
            .slice(0, 4);
    } catch (error) {
        console.error('Error fetching similar products:', error.message);
        showSimpleModal('error_title', 'no_similar_products', 'modal-error', lang);
        return [];
    } finally {
        hidePreloader();
    }
}

function generateStars(rating) {
    const lang = localStorage.getItem('language') || 'en';
    const fullStars = Math.floor(rating || 0);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;

    return [
        ...Array(fullStars).fill(`<img src="../images/home_page_icons/full_star_icon.svg" alt="${productTranslations.star_alt?.[lang] || 'Full Star'}" class="rating-icon">`),
        ...(halfStar ? [`<img src="../images/home_page_icons/half_star_icon.svg" alt="${productTranslations.star_half?.[lang] || 'Half Star'}" class="rating-icon">`] : []),
        ...Array(emptyStars).fill(`<img src="../images/home_page_icons/star_outline_icon.svg" alt="${productTranslations.star_outline_alt?.[lang] || 'Empty Star'}" class="rating-icon">`)
    ].join('');
}

function renderProduct(product, lang = 'en') {
    const container = document.querySelector('.product-detail-container');
    if (!container) {
        showSimpleModal('error_title', 'error_missing_elements', 'modal-error', lang);
        return;
    }

    if (!product) {
        container.innerHTML = `<p data-i18n="product_not_found">${productTranslations.product_not_found?.[lang] || 'Product not found'}</p>`;
        return;
    }

    const mainImage = document.querySelector('.main-image');
    if (mainImage) {
        mainImage.src = product.image || '../images/default-image.jpg';
        mainImage.alt = product.name || 'Product Image';
    }

    const productTitle = document.querySelector('.product-title');
    if (productTitle) {
        productTitle.textContent = product.name || 'Unnamed Product';
    }

    const productRating = document.querySelector('.product-rating');
    if (productRating) {
        productRating.innerHTML = `
            <div class="stars">${generateStars(product.rating)}</div>
            <span class="rating-score">${(product.rating || 0).toFixed(1)}</span>
        `;
    }

    const sizesContainer = document.querySelector('.product-sizes');
    if (sizesContainer) {
        const sizes = Array.isArray(product.sizes) ? product.sizes : ['M'];
        sizesContainer.innerHTML = sizes.map(size => `
            <span class="size-option" data-size="${size}">${size}</span>
        `).join('');
    }

    const colorsContainer = document.querySelector('.product-colors');
    if (colorsContainer) {
        const colors = Array.isArray(product.colors) ? product.colors : ['Unknown'];
        colorsContainer.innerHTML = colors.map(color => `
            <span class="color-option" style="background-color: ${color.toLowerCase()};" data-color="${color}"></span>
        `).join('');
    }

    const productPrice = document.querySelector('.product-price');
    if (productPrice) {
        productPrice.textContent = `$${product.price.toFixed(2)}`;
    }

    const description = document.querySelector('.description-content p');
    if (description) {
        description.textContent = product.description || productTranslations.no_description?.[lang] || 'No description available.';
    }

    const featuresTable = document.querySelector('.features-table');
    if (featuresTable) {
        featuresTable.innerHTML = `
            <tr>${Object.keys(product.tableData || {}).map(key => `<td data-i18n="${key.toLowerCase().replace(/\s/g, '_')}">${productTranslations[key.toLowerCase().replace(/\s/g, '_')]?.[lang] || key}</td>`).join('')}</tr>
            <tr>${Object.values(product.tableData || {}).map(value => `<td>${value}</td>`).join('')}</tr>
        `;
    }

    const video = document.querySelector('.product-video');
    if (video) {
        const source = video.querySelector('source');
        if (source) {
            source.src = product.video || '';
        }
        video.poster = product.image || '../images/default-image.jpg';
        video.innerHTML += `<p data-i18n="video_not_supported">${productTranslations.video_not_supported?.[lang] || 'Video not supported'}</p>`;
    }

    const favoriteButton = document.querySelector('.favorite-btn');
    if (favoriteButton) {
        favoriteButton.dataset.productId = product.id;
        favoriteButton.innerHTML = `
            <img src="../images/home_page_icons/heart_icon.svg" alt="${productTranslations.add_to_favorites?.[lang] || 'Add to Favorites'}" class="favorite-icon">
        `;
    }

    const addToCartButton = document.querySelector('.add-to-cart');
    if (addToCartButton) {
        addToCartButton.dataset.productId = product.id;
        addToCartButton.innerHTML = `
            <img src="../images/product_images/cart_icon.svg" alt="Cart" class="cart-icon">
            <span data-i18n="add_to_cart">${productTranslations.add_to_cart?.[lang] || 'Add to Cart'}</span>
        `;
    }

    const auth = checkAuth();
    if (auth.isAuthenticated) {
        const user = JSON.parse(localStorage.getItem('user'));
        const USER_ID = user.id;
        initAddToCart('product', '.add-to-cart', [product], showAddToCartModal);
        initFavorites([product], USER_ID, (productId, isFavorite) => {
            if (favoriteButton) {
                favoriteButton.classList.toggle('active', isFavorite);
                const icon = favoriteButton.querySelector('.favorite-icon');
                if (icon) {
                    icon.src = isFavorite 
                        ? '../images/home_page_icons/heart_filled_icon.svg' 
                        : '../images/home_page_icons/heart_icon.svg';
                    icon.alt = isFavorite 
                        ? productTranslations.remove_from_favorites?.[lang] || 'Remove from Favorites' 
                        : productTranslations.add_to_favorites?.[lang] || 'Add to Favorites';
                    showSimpleModal('success_title', isFavorite ? 'added_to_favorites' : 'removed_from_favorites', 'modal-success', lang);
                }
            }
        });
    } else {
        [favoriteButton, addToCartButton].forEach(button => {
            if (button) {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    showSimpleModal(
                        'modal_login_required',
                        button.classList.contains('favorite-btn') ? 'modal_favorites_message' : 'modal_cart_message',
                        'modal-error',
                        lang
                    );
                    setTimeout(() => window.location.assign('../auth/signin.html'), 1000);
                });
            }
        });
    }
}

function renderSimilarProducts(products, lang = 'en') {
    const similarGrid = document.querySelector('.similar-grid');
    if (!similarGrid) {
        console.log('Similar products grid not found');
        return;
    }

    similarGrid.innerHTML = products.length ? products.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image-container">
                <img src="${product.image || '../images/product-image.jpg'}" alt="${product.name}" class="product-image">
                <button class="quick-view" data-product-id="${product.id}" data-i18n="quick_view">${productTranslations.quick_view?.[lang] || 'Quick View'}</button>
                <button class="favorite-btn" data-product-id="${product.id}">
                    <img src="../images/home_page_icons/heart_icon.svg" alt="${productTranslations.add_to_favorites?.[lang] || 'Add to Favorites'}" class="favorite-icon">
                </button>
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-brand">${product.brand}</p>
                <div class="product-rating">
                    ${generateStars(product.rating)}
                    <span class="rating-count">(${product.rating.toFixed(1)})</span>
                </div>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <p class="product-colors"><span data-i18n="colors_title">${productTranslations.colors_title?.[lang] || 'Colors'}</span>: ${product.colors?.join(', ') || 'Unknown'}</p>
                <p class="product-category"><span data-i18n="category_title">${productTranslations.category_title?.[lang] || 'Category'}</span>: ${product.category || 'Unknown'}</p>
                <button class="add-to-cart-btn" data-product-id="${product.id}" data-i18n="add_to_cart" data-context="product-card">${productTranslations.add_to_cart?.[lang] || 'Add to Cart'}</button>
            </div>
        </div>
    `).join('') : `<p data-i18n="no_similar_products">${productTranslations.no_similar_products?.[lang] || 'No similar products found.'}</p>`;

    similarGrid.removeEventListener('click', handleSimilarGridClick);
    similarGrid.addEventListener('click', handleSimilarGridClick);

    const auth = checkAuth();
    if (auth.isAuthenticated) {
        const user = JSON.parse(localStorage.getItem('user'));
        const USER_ID = user.id;
        initAddToCart('catalog', '.add-to-cart-btn[data-context="product-card"]', products, showAddToCartModal);
        initFavorites(products, USER_ID, (productId, isFavorite) => {
            const button = similarGrid.querySelector(`.favorite-btn[data-product-id="${productId}"]`);
            if (button) {
                button.classList.toggle('active', isFavorite);
                const icon = button.querySelector('.favorite-icon');
                if (icon) {
                    icon.src = isFavorite 
                        ? '../images/home_page_icons/heart_filled_icon.svg' 
                        : '../images/home_page_icons/heart_icon.svg';
                    icon.alt = isFavorite 
                        ? productTranslations.remove_from_favorites?.[lang] || 'Remove from Favorites' 
                        : productTranslations.add_to_favorites?.[lang] || 'Add to Favorites';
                    showSimpleModal('success_title', isFavorite ? 'added_to_favorites' : 'removed_from_favorites', 'modal-success', lang);
                }
            }
        });
    } else {
        similarGrid.querySelectorAll('.favorite-btn, .add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                showSimpleModal(
                    'modal_login_required',
                    button.classList.contains('favorite-btn') ? 'modal_favorites_message' : 'modal_cart_message',
                    'modal-error',
                    lang
                );
                setTimeout(() => window.location.assign('../auth/signin.html'), 1000);
            });
        });
    }
}

function handleSimilarGridClick(e) {
    e.preventDefault();
    const button = e.target.closest('.quick-view');
    if (button) {
        const productId = button.dataset.productId;
        window.location.assign(`product.html?id=${productId}`);
    }
}

async function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    const lang = localStorage.getItem('language') || 'en';

    if (!productId || isNaN(productId)) {
        showSimpleModal('error_title', 'invalid_product_id', 'modal-error', lang);
        return;
    }

    const product = await fetchProduct(productId);
    if (product) {
        renderProduct(product, lang);
        const similarProducts = await fetchSimilarProducts(product);
        renderSimilarProducts(similarProducts, lang);
    }
}

function updateLanguage(lang) {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.dataset.i18n;
        const translation = productTranslations[key]?.[lang] || element.innerHTML;
        element.innerHTML = translation;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.dataset.i18nPlaceholder;
        const translation = productTranslations[key]?.[lang] || element.placeholder;
        element.placeholder = translation;
    });

    document.querySelectorAll('.current-language').forEach(element => {
        const translation = productTranslations.lang_current?.[lang] || lang.toUpperCase();
        element.textContent = translation;
    });

    // Повторный рендеринг для обновления переводов
    init();
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('product-details.js loaded');
    initPreloader();
    sessionStorage.removeItem('showSuccessModal');
    updateUserProfile();
    init();
    initBurgerMenu(false);
    initLanguageSwitcher('.header-controls .language-selector, .mobile-menu .language-selector', productTranslations);
    const headerThemeToggle = document.querySelector('.header-controls .custom-toggle .toggle-input');
    const mobileThemeToggle = document.querySelector('.mobile-menu .custom-toggle .toggle-input');
    if (headerThemeToggle) {
        initThemeSwitcher(headerThemeToggle);
    }
    if (mobileThemeToggle) {
        initThemeSwitcher(mobileThemeToggle);
    }
    window.addEventListener('languageChanged', () => {
        const lang = localStorage.getItem('language') || 'en';
        updateLanguage(lang);
    });
});