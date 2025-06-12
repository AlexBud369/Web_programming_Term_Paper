import { initPagination, getPaginatedItems } from './modules/pagination.js';
import { getFavorites, initFavorites } from './modules/favorites.js';
import { initAddToCart } from './modules/addToCart.js';
import { showSuccessModalAfterReload, showSimpleModal } from './modules/modal.js';
import { initProfileEditing } from './modules/profile.js';
import { checkAuth, updateUserProfile } from './modules/auth.js';
import { initBurgerMenu } from './modules/burgerMenu.js';
import { initAccessibility } from './modules/accessibility.js';
import { initLanguageSwitcher } from './modules/languageSwitcher.js';
import { initThemeSwitcher } from './modules/themeSwitcher.js';
import { translations } from './modules/pages-translations/account_translations.js';
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

async function renderWishlist(page = 1) {
    console.log('Rendering wishlist, page:', page);
    if (!wishlistGrid || !noResults) {
        console.error('Wishlist grid or no-results element not found');
        showSimpleModal('Error', translations.error_missing_elements?.[localStorage.getItem('language') || 'en'] || 'Page elements not found', 'modal-error');
        return;
    }

    const auth = checkAuth();
    const lang = localStorage.getItem('language') || 'en';
    if (!auth.isAuthenticated) {
        console.log('User not authenticated, showing not_authenticated message');
        wishlistGrid.innerHTML = `<p data-i18n="not_authenticated">${translations.not_authenticated?.[lang] || 'Please log in to view your wishlist.'}</p>`;
        noResults.style.display = 'block';
        noResults.setAttribute('data-i18n', 'not_authenticated');
        noResults.textContent = translations.not_authenticated?.[lang] || 'Please log in to view your wishlist.';
        setTimeout(() => window.location.assign('../auth/signin.html'), 1500);
        return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    console.log('User for wishlist:', user);
    const USER_ID = user.id;

    try {
        showPreloader();
        const favorites = await getFavorites(USER_ID);
        console.log('Favorites fetched:', favorites);
        const products = favorites
            .filter(fav => {
                if (!fav || !fav.product || typeof fav.product.id !== 'number') {
                    console.warn('Invalid favorite item:', fav);
                    return false;
                }
                return true;
            })
            .map(fav => {
                console.log('Processing favorite product:', fav.product);
                return {
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
                };
            });

        console.log('Processed products:', products);

        const paginatedItems = getPaginatedItems(products, page, 6);
        wishlistGrid.innerHTML = '';
        noResults.style.display = products.length === 0 ? 'block' : 'none';
        noResults.setAttribute('data-i18n', 'wishlist_no_results');
        noResults.textContent = products.length === 0 ? translations.wishlist_no_results?.[lang] || 'No items in your favorites.' : '';

        const showImages = localStorage.getItem('a11yShowImages') !== 'false';
        paginatedItems.forEach(product => {
            const categoryKey = categoryTranslationKeys[product.category] || product.category.toLowerCase().replace(/ & /g, '_').replace(/\s+/g, '_');
            const translatedCategory = translations[categoryKey]?.[lang] || product.category;
            const translatedColors = product.colors.map(color => translations[colorTranslationKeys[color.toLowerCase()]]?.[lang] || color).join(', ');

            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.dataset.id = product.id;
            productCard.innerHTML = `
                <div class="product-image-container" data-transcription="${showImages ? '' : translations.image_hidden?.[lang] || 'Image hidden for accessibility'}">
                    <img src="${product.image}" alt="${product.name}" class="product-image">
                    <button class="quick-view" data-product-id="${product.id}" data-i18n="quick_view">${translations.quick_view?.[lang] || 'Quick View'}</button>
                    <button class="favorite-btn active" data-product-id="${product.id}" data-favorite-id="${product.favoriteId}">
                        <img src="../images/home_page_icons/heart_icon.svg" alt="${translations.remove_from_favorites?.[lang] || 'Remove from Favorites'}" class="favorite-icon">
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
                    <p class="product-colors" data-i18n="colors_label">${translations.colors_label?.[lang] || 'Colors'}: ${translatedColors}</p>
                    <p class="product-category" data-i18n="category_label">${translations.category_label?.[lang] || 'Category'}: ${translatedCategory}</p>
                    <button class="add-to-cart-btn" data-product-id="${product.id}" data-i18n="add_to_cart" data-context="product-card">${translations.add_to_cart?.[lang] || 'Add to Cart'}</button>
                </div>
            `;
            wishlistGrid.appendChild(productCard);
        });

        wishlistGrid.querySelectorAll('.quick-view').forEach(button => {
            button.addEventListener('click', () => {
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
                    ? translations.remove_from_favorites?.[lang] || 'Remove from Favorites'
                    : translations.add_to_favorites?.[lang] || 'Add to Favorites';
                if (!isFavorite) {
                    renderWishlist(page);
                }
            }
        });

        initAddToCart('wishlist', '.add-to-cart-btn', products);
        initPagination(products.length, currentPage, 6, (newPage) => {
            currentPage = newPage;
            renderWishlist(newPage);
        }, translations, lang);
    } catch (error) {
        console.error('Error rendering wishlist:', error.message);
        wishlistGrid.innerHTML = `<p data-i18n="error_loading">${translations.error_loading?.[lang] || 'Failed to load wishlist.'}</p>`;
        noResults.style.display = 'block';
        noResults.setAttribute('data-i18n', 'error_loading');
        noResults.textContent = translations.error_loading?.[lang] || 'Failed to load wishlist.';
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
        ...Array(fullStars).fill(`<img src="../images/home_page_icons/full_star_icon.svg" alt="${translations.star_alt?.[lang] || 'Full Star'}" class="rating-icon">`),
        ...(halfStar ? [`<img src="../images/home_page_icons/half_star_icon.svg" alt="${translations.half_star_alt?.[lang] || 'Half Star'}" class="rating-icon">`] : []),
        ...Array(emptyStars).fill(`<img src="../images/home_page_icons/star_outline_icon.svg" alt="${translations.star_outline_alt?.[lang] || 'Empty Star'}" class="rating-icon">`)
    ];

    return stars.join('');
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('account.js loaded');
    initPreloader();
    const auth = checkAuth();
    console.log('Auth status:', auth);
    const lang = localStorage.getItem('language') || 'en';
    if (!auth.isAuthenticated) {
        console.log('Redirecting to signin.html due to unauthenticated user');
        showSimpleModal('Error', translations.please_login?.[lang] || 'Please log in to access this page.', 'modal-error');
        setTimeout(() => window.location.assign('../auth/signin.html'), 1500);
        return;
    }

    console.log('Calling updateUserProfile');
    updateUserProfile();
    renderWishlist(currentPage);
    showSuccessModalAfterReload();
    initProfileEditing();
    initLanguageSwitcher('.language-selector');
    initBurgerMenu();

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

    const a11ySettings = document.querySelector('.a11y-settings');
    if (a11ySettings) {
        initAccessibility(a11ySettings);
        console.log('Accessibility initialized');
    } else {
        console.warn('Accessibility settings not found');
    }

    window.addEventListener('languageChanged', () => {
        console.log('Language changed, re-rendering');
        const newLang = localStorage.getItem('language') || 'en';
        renderWishlist(currentPage);
        initProfileEditing();
        initPagination(wishlistGrid.querySelectorAll('.product-card').length, currentPage, 6, (newPage) => {
            currentPage = newPage;
            renderWishlist(newPage);
        }, translations, newLang);
    });
});