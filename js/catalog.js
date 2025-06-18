import { applyFilters, initFilters } from './modules/filtering.js';
import { initPagination, getPaginatedItems } from './modules/pagination.js';
import { getSortParams } from './modules/sorting.js';
import { initSearch } from './modules/search.js';
import { initFavorites } from './modules/favorites.js';
import { initAddToCart } from './modules/addToCart.js';
import { showSimpleModal, showAddToCartModal } from './modules/modal.js';
import { checkAuth, updateUserProfile } from './modules/auth.js';
import { initBurgerMenu } from './modules/burgerMenu.js';
import { initLanguageSwitcher } from './modules/languageSwitcher.js';
import { initThemeSwitcher } from './modules/themeSwitcher.js';
import { translations as catalogTranslations } from './modules/pages-translations/catalog_translations.js';
import { translations as headerTranslations } from './modules/pages-translations/header_translations.js';
import { translations as footerTranslations } from './modules/pages-translations/footer_translations.js';
import { translations as modalTranslations } from './modules/pages-translations/modal_translations.js';
import { showPreloader, hidePreloader, initPreloader } from './modules/preloader.js';

const productsGrid = document.getElementById('products-grid');
const productsCount = document.getElementById('products-count');
const noResults = document.getElementById('no-results');
let currentPage = 1;
let allProducts = [];

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

function getPluralForm(count) {
    if (count === 1) return 'товар';
    if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'товара';
    return 'товаров';
}

async function fetchProducts(sortOption, page = 1) {
    const checkedCategories = document.querySelectorAll('#category-filter input[name="category"]:checked');
    const selectedCategories = Array.from(checkedCategories).map(checkbox => checkbox.value);

    const priceMinInput = document.getElementById('price-range-min');
    const priceMaxInput = document.getElementById('price-range-max');
    let priceMin = parseInt(priceMinInput?.value) || 0;
    let priceMax = parseInt(priceMaxInput?.value) || 250;

    if (priceMin > priceMax) {
        [priceMin, priceMax] = [priceMax, priceMin];
        priceMinInput.value = priceMin;
        priceMaxInput.value = priceMax;
    }

    const selectedColors = document.querySelectorAll('#color-filter .color-option.active');
    const colors = Array.from(selectedColors).map(color => color.dataset.color);

    const selectedSizes = document.querySelectorAll('#size-filter .size-option.active');
    const sizes = Array.from(selectedSizes).map(size => size.dataset.size);

    const style = document.getElementById('style-filter')?.value || '';
    const searchInput = document.getElementById('search-input')?.value.trim() || '';

    const queryParams = [`_page=${page}`, `_limit=9`];

    if (priceMin && !isNaN(priceMin)) queryParams.push(`price_gte=${encodeURIComponent(priceMin)}`);
    if (priceMax && !isNaN(priceMax)) queryParams.push(`price_lte=${encodeURIComponent(priceMax)}`);
    if (selectedCategories.length > 0) selectedCategories.forEach(category => queryParams.push(`category=${encodeURIComponent(category)}`));
    if (colors.length > 0) colors.forEach(color => queryParams.push(`colors_like=${encodeURIComponent(color)}`));
    if (sizes.length > 0) sizes.forEach(size => queryParams.push(`sizes_like=${encodeURIComponent(size)}`));
    if (style) queryParams.push(`style=${encodeURIComponent(style)}`);
    if (searchInput) queryParams.push(`q=${encodeURIComponent(searchInput)}`);

    const sortParams = getSortParams(sortOption);
    queryParams.push(...sortParams);

    const query = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    const url = `http://localhost:3000/products${query}`;

    try {
        showPreloader();
        console.log(`Fetching products from: ${url}`);
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (res.status === 404) {
            console.log('404 error for products, redirecting');
            window.location.assign('../pages/page_404_error.html');
            return;
        }
        if (!res.ok) throw new Error(`HTTP error: ${res.status} for ${url}`);
        const filteredProducts = await res.json();

        const countQueryParams = queryParams.filter(param => !param.startsWith('_page=') && !param.startsWith('_limit='));
        const countQuery = countQueryParams.length > 0 ? `?${countQueryParams.join('&')}` : '';
        const countUrl = `http://localhost:3000/products${countQuery}`;
        console.log('Fetching total count from:', countUrl);
        let totalProducts = 0;
        try {
            const countRes = await fetch(countUrl, { headers: { 'Accept': 'application/json' } });
            if (countRes.status === 404) {
                console.log('404 error for count, redirecting');
                window.location.assign('../pages/page_404_error.html');
                return;
            }
            if (!countRes.ok) throw new Error(`HTTP error: ${countRes.status} for ${countUrl}`);
            const allProductsData = await countRes.json();
            totalProducts = allProductsData.length;
        } catch (countError) {
            console.warn('Failed to fetch total count, using filtered length:', countError.message);
            totalProducts = filteredProducts.length;
        }

        console.log('Fetched products:', filteredProducts.length, 'Total products:', totalProducts);
        allProducts = filteredProducts;
        renderProducts(filteredProducts, totalProducts, localStorage.getItem('language') || 'en');
    } catch (error) {
        console.error('Error fetching products:', error.message);
        if (noResults) {
            noResults.textContent = catalogTranslations.no_results?.[lang] || catalogTranslations.no_results?.['en'] || 'Failed to load products. Please check the server or try again later.';
            noResults.style.display = 'block';
        }
        renderProducts([], 0);
    } finally {
        hidePreloader();
    }
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    return `
        ${'<img src="../images/home_page_icons/full_star_icon.svg" alt="Star" class="rating-icon">'.repeat(fullStars)}
        ${halfStar ? '<img src="../images/home_page_icons/half_star_icon.svg" alt="Half Star" class="rating-icon">' : ''}
        ${'<img src="../images/home_page_icons/star_outline_icon.svg" alt="Star" class="rating-icon">'.repeat(emptyStars)}
    `;
}

async function checkImageExists(url) {
    try {
        const res = await fetch(url, { method: 'HEAD' });
        return res.ok;
    } catch {
        return false;
    }
}

async function renderProducts(products, totalProducts, lang = localStorage.getItem('language') || 'en') {
    if (!productsGrid || !noResults || !productsCount) {
        console.error('Required elements not found:', {
            productsGrid: !!productsGrid,
            noResults: !!noResults,
            productsCount: !!productsCount
        });
        return;
    }

    console.log(`Rendering products: ${products.length} items, Total: ${totalProducts}, Language: ${lang}`);
    productsGrid.innerHTML = '';
    noResults.style.display = products.length === 0 ? 'block' : 'none';
    noResults.innerHTML = `<span data-i18n="no_results">${catalogTranslations.no_results?.[lang] || catalogTranslations.no_results?.['en'] || 'No results found'}</span>`;

    const countText = lang === 'ru'
        ? `${totalProducts} ${getPluralForm(totalProducts)}`
        : (catalogTranslations.products_count?.[lang] || catalogTranslations.products_count?.['en'] || '{count} items').replace('{count}', totalProducts);
    productsCount.innerHTML = `<span data-i18n="products_count" data-i18n-data='{"count": ${totalProducts}}'>${countText}</span>`;

    for (const product of products) {
        const categoryKey = categoryTranslationKeys[product.category] || product.category.toLowerCase().replace(/ & /g, '_').replace(/\s+/g, '_');
        const translatedCategory = catalogTranslations[categoryKey]?.[lang] || catalogTranslations[categoryKey]?.['en'] || product.category;
        const translatedColors = product.colors.map(color =>
            catalogTranslations[colorTranslationKeys[color.toLowerCase()]]?.[lang] ||
            catalogTranslations[colorTranslationKeys[color.toLowerCase()]]?.['en'] ||
            color
        ).join(', ');

        const imagePath = product.image || `../images/catalog_images/catalog_card${product.id}.png`;
        const imageExists = await checkImageExists(imagePath);

        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.dataset.id = product.id;
        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${imageExists ? imagePath : '../images/placeholder_image.png'}" alt="${product.name}" class="product-image">
                <button type="button" class="quick-view" data-product-id="${product.id}" data-i18n="quick_view">
                    ${catalogTranslations.quick_view?.[lang] || catalogTranslations.quick_view?.['en'] || 'Quick View'}
                </button>
                <button type="button" class="favorite-btn" data-product-id="${product.id}">
                    <img src="../images/home_page_icons/heart_icon.svg" alt="${catalogTranslations.add_to_favorites?.[lang] || catalogTranslations.add_to_favorites?.['en'] || 'Add to Favorites'}" class="favorite-icon">
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
                <p class="product-colors">${catalogTranslations.colors_title?.[lang] || catalogTranslations.colors_title?.['en'] || 'Colors'}: ${translatedColors}</p>
                <p class="product-category">${translatedCategory}</p>
                <button type="button" class="add-to-cart-btn" data-product-id="${product.id}" data-i18n="add_to_cart" data-context="product-card">
                    ${catalogTranslations.add_to_cart?.[lang] || catalogTranslations.add_to_cart?.['en'] || 'Add to Cart'}
                </button>
            </div>
        `;
        productsGrid.appendChild(productCard);
    }

    const auth = checkAuth();
    if (auth.isAuthenticated) {
        const user = JSON.parse(localStorage.getItem('user'));
        const USER_ID = user.id;
        console.log('Initializing favorites with:', { products: products.length, userId: USER_ID, lang });
        const favoriteButtons = document.querySelectorAll('.favorite-btn');
        console.log('Favorite buttons found:', favoriteButtons.length);
        initFavorites(products, USER_ID, (productId, isFavorite) => {
            console.log('Favorites callback:', { productId, isFavorite, lang });
            const button = productsGrid.querySelector(`.favorite-btn[data-product-id="${productId}"]`);
            if (button) {
                button.classList.toggle('active', isFavorite);
                const icon = button.querySelector('.favorite-icon');
                icon.src = isFavorite
                    ? '../images/home_page_icons/heart_icon.svg'
                    : '../images/home_page_icons/heart_icon.svg';
                icon.alt = isFavorite
                    ? modalTranslations.removed_from_favorites?.[lang] || 'Remove from Favorites'
                    : modalTranslations.added_to_favorites?.[lang] || 'Add to Favorites';
            } else {
                console.warn('Favorite button not found for productId:', productId);
            }
        });
        initAddToCart('catalog', '.add-to-cart-btn[data-context="product-card"]', products, showAddToCartModal);
    } else {
        productsGrid.querySelectorAll('.favorite-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Favorite button clicked (unauthenticated):', button);
                showSimpleModal(
                    'modal_login_required',
                    'modal_favorites_message',
                    'modal-error',
                    null,
                    lang
                );
                setTimeout(() => window.location.assign('../auth/signin.html'), 1500);
            });
        });
        productsGrid.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Add to cart button clicked (unauthenticated):', button);
                showSimpleModal(
                    'modal_login_required',
                    'modal_cart_message',
                    'modal-error',
                    null,
                    lang
                );
                setTimeout(() => window.location.assign('../auth/signin.html'), 1500);
            });
        });
    }

    productsGrid.querySelectorAll('.quick-view').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Quick view button clicked:', button);
            const productId = button.dataset.productId;
            window.location.assign(`../pages/product.html?id=${productId}`);
        });
    });

    productsGrid.addEventListener('click', (e) => {
        console.log('Click on products grid:', e.target, 'Class:', e.target.className, 'Parent:', e.target.closest('.product-card'));
    });

    productsGrid.querySelectorAll('button').forEach(button => {
        const parentForm = button.closest('form');
        if (parentForm) {
            console.warn('Button inside form detected:', button);
            parentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Prevented form submission for button:', button);
            });
        }
    });

    initPagination(totalProducts || 0, currentPage, 9, (page) => {
        currentPage = page;
        fetchProducts(document.getElementById('sort-by')?.value || 'default', page);
    }, catalogTranslations, lang);
}

document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('error', (e) => {
        console.error('Global error:', e.message, e.filename, e.lineno, e.colno, e.error);
        if (e.target?.src?.includes('kaspersky-labs.com')) {
            console.warn('Ignoring Kaspersky script error:', e);
            e.preventDefault();
        }
    }, true);

    console.log('catalog.js loaded');
    initPreloader();
    sessionStorage.removeItem('showSuccessModal');

    if (sessionStorage.getItem('catalog_refresh_needed') === 'true') {
        console.log('Catalog refresh needed, fetching products');
        fetchProducts('default', 1);
        sessionStorage.removeItem('catalog_refresh_needed');
    }

    console.log('Calling updateUserProfile');
    updateUserProfile();
    initFilters(sortOption => {
        currentPage = 1;
        fetchProducts(sortOption, currentPage);
    });
    initSearch(sortOption => {
        currentPage = 1;
        fetchProducts(sortOption, currentPage);
    });
    fetchProducts('default', currentPage);
    initBurgerMenu(false, false, false, headerTranslations);
    initLanguageSwitcher('.header-controls .language-selector, .mobile-menu .language-selector', { ...catalogTranslations, ...headerTranslations, ...footerTranslations });
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
    window.addEventListener('languageChanged', (e) => {
        const newLang = e.detail.lang;
        const sortOption = document.getElementById('sort-by')?.value || 'default';
        fetchProducts(sortOption, currentPage);
        initPagination(allProducts.length || 0, currentPage, 9, (page) => {
            currentPage = page;
            fetchProducts(sortOption, page);
        }, catalogTranslations, newLang);
    });

    window.onbeforeunload = () => {
        console.log('Page is about to reload');
    };
});