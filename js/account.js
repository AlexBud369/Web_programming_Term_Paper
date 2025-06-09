import { initPagination, getPaginatedItems } from './modules/pagination.js';
import { getFavorites } from './modules/favorites.js';
import { initAddToCart } from './modules/addToCart.js';
import { showSuccessModalAfterReload, showSimpleModal } from './modules/modal.js';
import { initProfileEditing } from './modules/profile.js';
import { checkAuth, updateUserProfile } from './modules/auth.js';
import { initBurgerMenu } from './modules/burgerMenu.js';
import { initAccessibility } from './modules/accessibility.js';
import { initLanguageSwitcher } from './modules/languageSwitcher.js';
import { initThemeSwitcher } from './modules/themeSwitcher.js';
import { translations } from './modules/pages-translations/account_translations.js';

const wishlistGrid = document.getElementById('wishlist-grid');
const noResults = document.getElementById('no-results');
let currentPage = 1;

async function renderWishlist(page = 1) {
    console.log('Rendering wishlist, page:', page);
    if (!wishlistGrid || !noResults) {
        console.error('Wishlist grid or no-results element not found');
        showSimpleModal('Error', translations.error_missing_elements[localStorage.getItem('language') || 'en'], 'modal-error');
        return;
    }

    const auth = checkAuth();
    const lang = localStorage.getItem('language') || 'en';
    if (!auth.isAuthenticated) {
        console.log('User not authenticated, showing not_authenticated message');
        wishlistGrid.innerHTML = `<p data-i18n="not_authenticated">${translations.not_authenticated[lang]}</p>`;
        noResults.style.display = 'block';
        noResults.setAttribute('data-i18n', 'not_authenticated');
        noResults.textContent = translations.not_authenticated[lang];
        setTimeout(() => window.location.assign('../auth/signin.html'), 1500);
        return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    console.log('User for wishlist:', user);
    const USER_ID = user.id;

    try {
        const favorites = await getFavorites(USER_ID);
        const products = favorites
            .filter(fav => fav.product && typeof fav.product.id === 'number')
            .map(fav => ({
                ...fav.product,
                favoriteId: fav.id
            }));
        
        const paginatedItems = getPaginatedItems(products, page, 9);
        wishlistGrid.innerHTML = '';
        noResults.style.display = products.length === 0 ? 'block' : 'none';
        noResults.setAttribute('data-i18n', 'wishlist_no_results');
        noResults.textContent = products.length === 0 ? translations.wishlist_no_results[lang] : '';

        paginatedItems.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.dataset.id = product.id;
            productCard.innerHTML = `
                <div class="product-image-container">
                    <img src="${product.image}" alt="${product.name}" class="product-image">
                    <button class="quick-view" data-product-id="${product.id}" data-i18n="quick_view">${translations.quick_view[lang]}</button>
                    <button class="favorite-btn active" data-product-id="${product.id}" data-favorite-id="${product.favoriteId}">
                        <img src="../images/home_page_icons/heart_filled_icon.svg" alt="${translations.remove_from_favorites[lang]}" class="favorite-icon">
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
                    <p class="product-colors" data-i18n="colors_label">${translations.colors_label[lang]}: ${product.colors.join(', ')}</p>
                    <p class="product-category" data-i18n="category_label">${translations.category_label[lang]}: ${product.category}</p>
                    <button class="add-to-cart-btn" data-product-id="${product.id}" data-i18n="add_to_cart">${translations.add_to_cart[lang]}</button>
                </div>
            `;
            wishlistGrid.appendChild(productCard);
        });

        wishlistGrid.querySelectorAll('.quick-view').forEach(button => {
            button.addEventListener('click', () => {
                const productId = button.dataset.productId;
                window.location.assign(`product.html?id=${productId}`);
            });
        });

        wishlistGrid.querySelectorAll('.favorite-btn').forEach(button => {
            button.addEventListener('click', async () => {
                const productId = parseInt(button.dataset.productId);
                const favoriteId = parseInt(button.dataset.favoriteId);
                
                try {
                    const res = await fetch(`http://localhost:3000/favorites/${favoriteId}`, {
                        method: 'DELETE'
                    });
                    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
                    showSimpleModal('Success', translations.favorite_removed[lang], 'modal-success');
                    renderWishlist(page);
                } catch (error) {
                    console.error('Error removing favorite:', error.message);
                    showSimpleModal('Error', translations.error_removing_favorite[lang], 'modal-error');
                }
            });
        });

        initAddToCart('wishlist', '.add-to-cart-btn', products);
        initPagination(products.length, page, 9, (newPage) => {
            currentPage = newPage;
            renderWishlist(newPage);
        });
    } catch (error) {
        console.error('Error rendering wishlist:', error.message);
        wishlistGrid.innerHTML = `<p data-i18n="error_loading">${translations.error_loading[lang]}</p>`;
        noResults.style.display = 'block';
        noResults.setAttribute('data-i18n', 'error_loading');
        noResults.textContent = translations.error_loading[lang];
    }
}

function generateStars(rating) {
    const lang = localStorage.getItem('language') || 'en';
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    return `
        ${'<img src="../images/home_page_icons/full_star_icon.svg" alt="${translations.star_alt[lang]}" class="rating-icon">'.repeat(fullStars)}
        ${halfStar ? `<img src="../images/home_page_icons/half_star_icon.svg" alt="${translations.half_star_alt[lang]}" class="rating-icon">` : ''}
        ${'<img src="../images/home_page_icons/star_outline_icon.svg" alt="${translations.star_outline_alt[lang]}" class="rating-icon">'.repeat(emptyStars)}
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('account.js loaded');
    const auth = checkAuth();
    console.log('Auth status:', auth);
    const lang = localStorage.getItem('language') || 'en';
    if (!auth.isAuthenticated) {
        console.log('Redirecting to signin.html due to unauthenticated user');
        showSimpleModal('Error', translations.please_login[lang], 'modal-error');
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
    });
});