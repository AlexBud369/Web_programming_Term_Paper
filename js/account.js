import { initPagination, getPaginatedItems } from './modules/pagination.js';
import { getFavorites, initFavorites } from './modules/favorites.js';
import { initAddToCart } from './modules/addToCart.js';
import { showSimpleModal, showAddToCartModal } from './modules/modal.js';
import { initProfileEditing } from './modules/profile.js';
import { checkAuth, updateUserProfile } from './modules/auth.js';
import { initBurgerMenu } from './modules/burgerMenu.js';
import { initLanguageSwitcher } from './modules/languageSwitcher.js';
import { initThemeSwitcher } from './modules/themeSwitcher.js';
import { translations as accountTranslations } from './modules/pages-translations/account_translations.js';
import { translations as headerTranslations } from './modules/pages-translations/header_translations.js';
import { showPreloader, hidePreloader, initPreloader } from './modules/preloader.js';

const wishlistGrid = document.getElementById('wishlist-grid');
const noResults = document.getElementById('no-results');
let currentPage = 1;

const categoryTranslationKeys = {
    'Tops & T-Shirts': 'category_tops_tshirts',
    'Printed T-Shirts': 'category_printed',
    'Plain T-Shirts': 'category_plain',
    'Kurti': 'category_kurti',
    'Boxers': 'category_boxers',
    'Full Sleeve T-Shirts': 'category_full_sleeve_tshirts',
    'Joggers': 'category_joggers',
    'Pajamas': 'category_pajamas',
    'Jeans': 'category_jeans'
};

const colorTranslationKeys = {
    purple: 'color_purple',
    black: 'color_black',
    white: 'color_white',
    red: 'color_red',
    orange: 'color_orange',
    navy: 'color_navy',
    brown: 'color_brown',
    green: 'color_green',
    yellow: 'color_yellow',
    grey: 'color_grey',
    pink: 'color_pink',
    blue: 'color_blue',
    gold: 'color_gold'
};

function getTranslation(key, lang, fallback) {
    return accountTranslations[key]?.[lang] || accountTranslations[key]?.['en'] || fallback || key;
}

function updateNavigation(lang = localStorage.getItem('language') || 'en') {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.dataset.i18n;
        const translation = headerTranslations[key]?.[lang] || accountTranslations[key]?.[lang] || element.textContent || key;
        element.textContent = translation;
    });
}

async function renderWishlist(page = 1) {
    const lang = localStorage.getItem('language') || 'en';
    if (!wishlistGrid || !noResults) {
        console.error('Wishlist grid or no-results element not found');
        showSimpleModal('error_title', 'error_missing_elements', 'modal-error', null, lang);
        return;
    }

    const auth = checkAuth();
    if (!auth.isAuthenticated) {
        wishlistGrid.innerHTML = `<p data-i18n="not_authenticated">${getTranslation('not_authenticated', lang, 'Please log in to view your wishlist.')}</p>`;
        noResults.style.display = 'block';
        noResults.setAttribute('data-i18n', 'not_authenticated');
        noResults.textContent = getTranslation('not_authenticated', lang, 'Please log in to view your wishlist.');
        showSimpleModal('error_title', 'not_authenticated', 'modal-error', null, lang);
        setTimeout(() => window.location.assign('../auth/signin.html'), 1500);
        return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    const USER_ID = user.id;

    try {
        showPreloader();
        const favorites = await getFavorites(USER_ID);
        const products = favorites
            .filter(fav => {
                if (!fav || !fav.product || typeof fav.product.id !== 'number') {
                    console.warn('Invalid favorite item:', fav);
                    return false;
                }
                return true;
            })
            .map(fav => ({
                id: fav.product.id,
                name: fav.product.name || 'Unnamed Product',
                brand: fav.product.brand || 'Unknown Brand',
                price: fav.product.price || 0,
                rating: fav.product.rating || 0,
                colors: Array.isArray(fav.product.colors) ? fav.product.colors : ['Unknown'],
                sizes: Array.isArray(fav.product.sizes) ? fav.product.sizes : ['M'],
                category: fav.product.category || 'Unknown',
                image: fav.product.image || `../images/catalog_images/catalog_card${fav.product.id}.png`,
                favoriteId: fav.id
            }));

        const paginatedItems = getPaginatedItems(products, page, 6);
        wishlistGrid.innerHTML = '';
        noResults.style.display = products.length === 0 ? 'block' : 'none';
        noResults.setAttribute('data-i18n', 'wishlist_no_results');
        noResults.textContent = products.length === 0 ? getTranslation('wishlist_no_results', lang, 'No items in your favorites.') : '';

        const showImages = localStorage.getItem('a11y-show-images') !== 'false';
        paginatedItems.forEach(product => {
            const categoryKey = categoryTranslationKeys[product.category] || product.category.toLowerCase().replace(/ & /g, '_').replace(/\s+/g, '_');
            const translatedCategory = getTranslation(categoryKey, lang, product.category);
            const translatedColors = product.colors.map(color => getTranslation(colorTranslationKeys[color.toLowerCase()], lang, color)).join(', ');

            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.dataset.id = product.id;
            productCard.innerHTML = `
                <div class="product-image-container" data-transcription="${showImages ? '' : getTranslation('image_hidden', lang, 'Image hidden for accessibility')}">
                    <img src="${product.image}" alt="${product.name}" class="product-image">
                    <button class="quick-view" data-product-id="${product.id}" data-i18n="quick_view">${getTranslation('quick_view', lang, 'Quick View')}</button>
                    <button class="favorite-btn active" data-product-id="${product.id}" data-favorite-id="${product.favoriteId}">
                        <img src="../images/home_page_icons/heart_icon.svg" alt="${getTranslation('remove_from_favorites', lang, 'Remove from Favorites')}" class="favorite-icon">
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
                    <p class="product-colors" data-i18n="colors_label">${getTranslation('colors_label', lang, 'Colors')}: ${translatedColors}</p>
                    <p class="product-category" data-i18n="category_label">${getTranslation('category_label', lang, 'Category')}: ${translatedCategory}</p>
                    <button class="add-to-cart-btn" data-product-id="${product.id}" data-i18n="add_to_cart" data-context="product-card">${getTranslation('add_to_cart', lang, 'Add to Cart')}</button>
                </div>
            `;
            wishlistGrid.appendChild(productCard);
        });

        wishlistGrid.querySelectorAll('.quick-view').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = button.dataset.productId;
                window.location.assign(`../pages/product.html?id=${productId}`);
            });
        });

        initFavorites(products, USER_ID, (productId, isFavorite) => {
            const button = wishlistGrid.querySelector(`.favorite-btn[data-product-id="${productId}"]`);
            if (button) {
                button.classList.toggle('active', isFavorite);
                const icon = button.querySelector('.favorite-icon');
                icon.src = isFavorite
                    ? '../images/home_page_icons/heart_icon.svg'
                    : '../images/home_page_icons/heart_icon.svg';
                icon.alt = isFavorite
                    ? getTranslation('remove_from_favorites', lang, 'Remove from Favorites')
                    : getTranslation('add_to_favorites', lang, 'Add to Favorites');
                if (!isFavorite) {
                    const card = button.closest('.product-card');
                    if (card) {
                        card.remove();
                        const remainingItems = wishlistGrid.querySelectorAll('.product-card').length;
                        noResults.style.display = remainingItems === 0 ? 'block' : 'none';
                        initPagination(remainingItems, currentPage, 6, (newPage) => {
                            currentPage = newPage;
                            renderWishlist(newPage);
                        }, accountTranslations, lang);
                    }
                }
            }
        });

        initAddToCart('wishlist', '.add-to-cart-btn', products, showAddToCartModal);
        initPagination(products.length, currentPage, 6, (newPage) => {
            currentPage = newPage;
            renderWishlist(newPage);
        }, accountTranslations, lang);
    } catch (error) {
        console.error('Error rendering wishlist:', error.message);
        wishlistGrid.innerHTML = `<p data-i18n="error_loading">${getTranslation('error_loading', lang, 'Failed to load wishlist.')}</p>`;
        noResults.style.display = 'block';
        noResults.setAttribute('data-i18n', 'error_loading');
        noResults.textContent = getTranslation('error_loading', lang, 'Failed to load wishlist.');
        showSimpleModal('error_title', 'error_loading', 'modal-error', null, lang);
    } finally {
        hidePreloader();
    }
}

function generateStars(rating) {
    const lang = localStorage.getItem('language') || 'en';
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;

    const stars = [
        ...Array(fullStars).fill(`<img src="../images/home_page_icons/full_star_icon.svg" alt="${getTranslation('star_icon', lang, 'Full Star')}" class="rating-icon">`),
        ...(halfStar ? [`<img src="../images/home_page_icons/half_star_icon.svg" alt="${getTranslation('half_star_icon', lang, 'Half Star')}" class="rating-icon">`] : []),
        ...Array(emptyStars).fill(`<img src="../images/home_page_icons/star_outline_icon.svg" alt="${getTranslation('star_outline_icon', lang, 'Empty Star')}" class="rating-icon">`)
    ];

    return stars.join('');
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('account.js loaded');
    initPreloader();
    const auth = checkAuth();
    const lang = localStorage.getItem('language') || 'en';
    if (!auth.isAuthenticated) {
        showSimpleModal('error_title', 'please_login', 'modal-error', null, lang);
        setTimeout(() => window.location.assign('../auth/signin.html'), 1500);
        return;
    }

    updateUserProfile();
    renderWishlist(currentPage);
    initProfileEditing();
    initLanguageSwitcher('.language-selector', { ...accountTranslations, ...headerTranslations });
    initBurgerMenu(false, false, false, headerTranslations);

    const headerThemeToggle = document.querySelector('.header-controls .custom-toggle .toggle-input');
    const mobileThemeToggle = document.querySelector('.mobile-menu .custom-toggle .toggle-input');
    if (headerThemeToggle) {
        initThemeSwitcher(headerThemeToggle);
    }
    if (mobileThemeToggle) {
        initThemeSwitcher(mobileThemeToggle);
    }

    window.addEventListener('languageChanged', () => {
        const newLang = localStorage.getItem('language') || 'en';
        updateNavigation(newLang);
        renderWishlist(currentPage);
    });
});