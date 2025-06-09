import { initAddToCart } from './modules/addToCart.js';
import { showSuccessModalAfterReload, showSimpleModal } from './modules/modal.js';
import { initBurgerMenu } from './modules/burgerMenu.js';
import { checkAuth, updateUserProfile } from './modules/auth.js';
import { initFavorites } from './modules/favorites.js';
import { initLanguageSwitcher } from './modules/languageSwitcher.js';
import { initThemeSwitcher } from './modules/themeSwitcher.js';
import { translations } from './modules/pages-translations/product_translations.js';

const API_URL = 'http://localhost:3000/products';

async function fetchProduct(id) {
    const lang = localStorage.getItem('language') || 'en';
    try {
        const res = await fetch(`${API_URL}/${id}`);
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        return await res.json();
    } catch (error) {
        console.error('Error fetching product:', error.message);
        showSimpleModal('Error', translations.error_loading[lang], 'modal-error');
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
    const fullStars = Math.floor(rating || 0);
    const halfStar = (rating || 0) % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    return `
        ${'<img src="../images/home_page_icons/full_star_icon.svg" alt="Full Star" class="rating-icon">'.repeat(fullStars)}
        ${halfStar ? '<img src="../images/home_page_icons/half_star_icon.svg" alt="Half Star" class="rating-icon">' : ''}
        ${'<img src="../images/home_page_icons/star_outline_icon.svg" alt="Outline Star" class="rating-icon">'.repeat(emptyStars)}
    `;
}

function renderProduct(product, lang = 'en') {
    if (!product) {
        const container = document.querySelector('.product-detail-container');
        if (container) {
            container.innerHTML = `<p data-i18n="product_not_found">${translations.product_not_found[lang]}</p>`;
        }
        return;
    }

    let selectedColor = null;
    let selectedSize = null;

    // Main image
    const mainImage = document.querySelector('.main-image');
    if (mainImage) {
        mainImage.src = product.image;
        mainImage.alt = product.name;
    }

    // Title
    const productTitle = document.querySelector('.product-title');
    if (productTitle) {
        productTitle.textContent = product.name;
    }

    // Rating
    const productRating = document.querySelector('.product-rating');
    if (productRating) {
        productRating.innerHTML = `
            <div class="stars">${generateStars(product.rating)}</div>
            <span class="rating-score">${product.rating.toFixed(1)}</span>
        `;
    }

    // Sizes
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

    // Colors
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

    // Price
    const productPrice = document.querySelector('.product-price');
    if (productPrice) {
        productPrice.textContent = `$${product.price.toFixed(2)}`;
    }

    // Description
    const description = document.querySelector('.description-content p');
    if (description) {
        description.textContent = product.description || translations.no_description[lang];
    }

    // Features table
    const featuresTable = document.querySelector('.features-table');
    if (featuresTable) {
        featuresTable.innerHTML = `
            <tr>${Object.keys(product.tableData).map(key => `<td data-i18n="${key.toLowerCase().replace(/\s/g, '_')}">${translations[key.toLowerCase().replace(/\s/g, '_')]?.[lang] || key}</td>`).join('')}</tr>
            <tr>${Object.values(product.tableData).map(value => `<td>${value}</td>`).join('')}</tr>
        `;
    }

    // Video
    const video = document.querySelector('.product-video');
    if (video) {
        const source = video.querySelector('source');
        if (source) {
            source.src = product.video || '';
        }
        video.poster = product.image;
        video.innerHTML += `<p data-i18n="video_not_supported">${translations.video_not_supported[lang]}</p>`;
    }

    // Favorite button
    const favoriteButton = document.querySelector('.favorite-btn');
    if (favoriteButton) {
        favoriteButton.dataset.productId = product.id;
        favoriteButton.innerHTML = `
            <img src="../images/home_page_icons/heart_icon.svg" alt="${translations.add_to_favorites[lang]}" class="favorite-icon">
        `;
    }

    // Add to Cart button
    const addToCartButton = document.querySelector('.add-to-cart');
    if (addToCartButton) {
        addToCartButton.dataset.productId = product.id;
        addToCartButton.innerHTML = `<span data-i18n="add_to_cart">${translations.add_to_cart[lang]}</span>`;
    }

    // Initialize buttons based on auth status
    const auth = checkAuth();
    if (auth.isAuthenticated) {
        initAddToCart('product', '.add-to-cart', [product]);
        initFavorites([product], auth.userId, (productId, isFavorite) => {
            if (favoriteButton) {
                favoriteButton.classList.toggle('active', isFavorite);
                const icon = favoriteButton.querySelector('.favorite-icon');
                if (icon) {
                    icon.src = isFavorite 
                        ? '../images/home_page_icons/heart_filled_icon.svg' 
                        : '../images/home_page_icons/heart_icon.svg';
                    icon.alt = isFavorite ? translations.remove_from_favorites[lang] : translations.add_to_favorites[lang];
                }
            }
        });
    } else {
        [favoriteButton, addToCartButton].forEach(button => {
            if (button) {
                button.addEventListener('click', () => {
                    showSimpleModal(
                        translations.modal_login_required[lang],
                        translations.modal_login_message[lang],
                        'modal-error'
                    );
                    setTimeout(() => window.location.assign('../auth/signin.html'), 1500);
                });
            }
        });
    }
}

function renderSimilarProducts(products, lang = 'en') {
    const similarGrid = document.querySelector('.similar-grid');
    if (!similarGrid) {
        console.error('Similar products grid not found');
        return;
    }

    similarGrid.innerHTML = products.length ? products.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image-container">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <button class="quick-view" data-product-id="${product.id}" data-i18n="quick_view">${translations.quick_view[lang]}</button>
                <button class="favorite-btn" data-product-id="${product.id}">
                    <img src="../images/home_page_icons/heart_icon.svg" alt="${translations.add_to_favorites[lang]}" class="favorite-icon">
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
                <p class="product-colors"><span data-i18n="colors_title">${translations.colors_title[lang]}</span>: ${product.colors.length} <span data-i18n="colors">${translations.colors[lang]}</span></p>
                <p class="product-category"><span data-i18n="category_title">${translations.category_title[lang]}</span>: ${product.category}</p>
                <button class="add-to-cart-btn" data-product-id="${product.id}" data-i18n="add_to_cart">${translations.add_to_cart[lang]}</button>
            </div>
        </div>
    `).join('') : `<p data-i18n="no_similar_products">${translations.no_similar_products[lang]}</p>`;

   
    similarGrid.removeEventListener('click', handleSimilarGridClick);
    similarGrid.addEventListener('click', handleSimilarGridClick);

   
    const auth = checkAuth();
    if (auth.isAuthenticated) {
        initAddToCart('catalog', '.add-to-cart-btn', products);
        initFavorites(products, auth.userId, (productId, isFavorite) => {
            const button = similarGrid.querySelector(`.favorite-btn[data-product-id="${productId}"]`);
            if (button) {
                button.classList.toggle('active', isFavorite);
                const icon = button.querySelector('.favorite-icon');
                if (icon) {
                    icon.src = isFavorite 
                        ? '../images/home_page_icons/heart_filled_icon.svg' 
                        : '../images/home_page_icons/heart_icon.svg';
                    icon.alt = isFavorite ? translations.remove_from_favorites[lang] : translations.add_to_favorites[lang];
                }
            }
        });
    } else {
        similarGrid.querySelectorAll('.favorite-btn, .add-to-cart-btn').forEach(button => {
            button.addEventListener('click', () => {
                showSimpleModal(
                    translations.modal_login_required[lang],
                    translations.modal_login_message[lang],
                    'modal-error'
                );
                setTimeout(() => window.location.assign('../auth/signin.html'), 1500);
            });
        });
    }
}

function handleSimilarGridClick(e) {
    const lang = localStorage.getItem('language') || 'en';
    if (e.target.closest('.quick-view')) {
        const button = e.target.closest('.quick-view');
        const productId = button.dataset.productId;
        window.location.assign(`product.html?id=${productId}`);
    } else if (e.target.closest('.favorite-btn') && !checkAuth().isAuthenticated) {
        showSimpleModal(
            translations.modal_login_required[lang],
            translations.modal_login_message[lang],
            'modal-error'
        );
        setTimeout(() => window.location.assign('../auth/signin.html'), 1500);
    } else if (e.target.closest('.add-to-cart-btn') && !checkAuth().isAuthenticated) {
        showSimpleModal(
            translations.modal_login_required[lang],
            translations.modal_login_message[lang],
            'modal-error'
        );
        setTimeout(() => window.location.assign('../auth/signin.html'), 1500);
    }
}

async function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    const lang = localStorage.getItem('language') || 'en';

    if (!productId) {
        const container = document.querySelector('.product-detail-container');
        if (container) {
            container.innerHTML = `<p data-i18n="invalid_product_id">${translations.invalid_product_id[lang]}</p>`;
        }
        return;
    }

    const product = await fetchProduct(productId);
    if (product) {
        renderProduct(product, lang);
        const similarProducts = await fetchSimilarProducts(product);
        renderSimilarProducts(similarProducts, lang);
    } else {
        const container = document.querySelector('.product-detail-container');
        if (container) {
            container.innerHTML = `<p data-i18n="product_not_found">${translations.product_not_found[lang]}</p>`;
        }
    }

    showSuccessModalAfterReload();
}

function updateLanguage(lang, translations) {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.dataset.i18n;
        const translation = translations[key]?.[lang];
        if (translation) {
            element.innerHTML = translation;
        } else {
            console.warn(`Translation missing for key "${key}" in language "${lang}"`);
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.dataset.i18nPlaceholder;
        const translation = translations[key]?.[lang];
        if (translation) {
            element.placeholder = translation;
        } else {
            console.warn(`Placeholder translation missing for key "${key}" in language "${lang}"`);
        }
    });

    document.querySelectorAll('.current-language').forEach(element => {
        const translation = translations.lang_current?.[lang] || lang.toUpperCase();
        element.textContent = translation;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('product-details.js loaded');
    updateUserProfile();
    init();
    initBurgerMenu(false);
    initLanguageSwitcher('.header-controls .language-selector');
    const headerThemeToggle = document.querySelector('.header-controls .custom-toggle .toggle-input');
    const mobileThemeToggle = document.querySelector('.mobile-menu .custom-toggle .toggle-input');
    if (headerThemeToggle) {
        console.log('Header theme toggle found:', headerThemeToggle);
        initThemeSwitcher(headerThemeToggle);
    }
    if (mobileThemeToggle) {
        console.log('Mobile theme toggle found:', mobileThemeToggle);
        initThemeSwitcher(mobileThemeToggle);
    }
    window.addEventListener('languageChanged', () => {
        const lang = localStorage.getItem('language') || 'en';
        init();
        updateLanguage(lang, translations);
    });
});