import { applyFilters, initFilters } from './modules/filtering.js';
import { initPagination } from './modules/pagination.js';
import { getSortParams } from './modules/sorting.js';
import { initSearch } from './modules/search.js';
import { showProductForm, deleteProduct } from './modules/productCRUD.js';
import { showSimpleModal, closeModal } from './modules/modal.js';
import { checkAuth, updateUserProfile } from './modules/auth.js';
import { initBurgerMenu } from './modules/burgerMenu.js';
import { initLanguageSwitcher } from './modules/languageSwitcher.js';
import { initThemeSwitcher } from './modules/themeSwitcher.js';
import { translations } from './modules/pages-translations/admin_translations.js';
import { showPreloader, hidePreloader, initPreloader } from './modules/preloader.js';

const productsGrid = document.getElementById('products-grid');
const productsCount = document.getElementById('products-count');
const noResults = document.getElementById('no-results');
const addProductBtn = document.querySelector('.add-product-btn');
let currentPage = 1;

async function fetchProducts(sortOption, page = 1) {
    const lang = localStorage.getItem('language') || 'en';
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
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const filteredProducts = await res.json();

        const countQueryParams = queryParams.filter(param => !param.startsWith('_page') && !param.startsWith('_limit'));
        const countQuery = countQueryParams.length > 0 ? `?${countQueryParams.join('&')}` : '';
        const countUrl = `http://localhost:3000/products${countQuery}`;
        const countRes = await fetch(countUrl);
        if (!countRes.ok) throw new Error(`HTTP error: ${countRes.status}`);
        const totalProducts = (await countRes.json()).length;

        renderProducts(filteredProducts, totalProducts, lang);
    } catch (error) {
        console.error('Error fetching products:', error);
        showSimpleModal(
            translations.error('error_loading_products', lang) || 'Error',
            translations.error('error_loading_products', lang) || 'Failed to load products. Please try again later.',
            'modal-error'
        );
        renderProducts([], 0, lang);
    } finally {
        hidePreloader();
    }
}

function renderProducts(products, totalItems, lang = 'en') {
    if (!productsGrid || !noResults || !productsCount) {
        console.error('Required DOM elements are missing');
        return;
    }

    productsGrid.innerHTML = '';
    noResults.style.display = products.length === 0 ? 'block' : 'none';
    productsCount.innerHTML = `<span data-i18n="total_products">${translations.total_products?.[lang] || 'Total Products'}</span>: ${totalItems}`;

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <button class="quick-view" data-product-id="${product.id}" data-i18n="quick_view">${translations.quick_view?.[lang] || 'Quick View'}</button>
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-brand">${product.brand}</p>
                <div class="product-rating">
                    ${generateStars(product.rating)}
                    <span class="rating-count">(${product.rating.toFixed(1)})</span>
                </div>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <p class="product-colors"><span data-i18n="colors">${translations.colors?.[lang] || 'Colors'}</span>: ${product.colors?.join(', ') || 'N/A'}</p>
                <p class="product-category"><span data-i18n="category">${translations.category?.[lang] || 'Category'}</span>: ${product.category}</p>
                <div class="admin-actions">
                    <button class="edit-btn" data-id="${product.id}" data-i18n="edit">${translations.edit?.[lang] || 'Edit'}</button>
                    <button class="delete-btn" data-id="${product.id}" data-i18n="delete">${translations.delete?.[lang] || 'Delete'}</button>
                </div>
            </div>
        `;
        productsGrid.appendChild(productCard);
    });

    productsGrid.removeEventListener('click', handleGridClick);
    productsGrid.addEventListener('click', handleGridClick);

    try {
        initPagination(totalItems, currentPage, 9, (page) => {
            currentPage = page;
            fetchProducts(document.getElementById('sort-by').value, page);
        }, translations, lang);
    } catch (error) {
        console.error('Error initializing pagination:', error);
    }
}

function handleGridClick(e) {
    const lang = localStorage.getItem('language') || 'en';
    if (e.target.classList.contains('quick-view')) {
        const productId = e.target.dataset.productId;
        console.log(`Quick View clicked for product ID: ${productId}`);
        window.location.assign(`product.html?id=${productId}`);
    } else if (e.target.classList.contains('edit-btn')) {
        const productId = e.target.dataset.id;
        console.log(`Edit button clicked for product ID: ${productId}`);
        if (!productId) {
            console.error('Invalid product ID for edit');
            showSimpleModal(
                translations.error('error_invalid_id', lang) || 'Error',
                translations.error('error_invalid_id', lang) || 'Invalid product ID',
                'modal-error'
            );
            return;
        }
        showPreloader();
        fetch(`http://localhost:3000/products/${productId}`)
            .then(res => {
                if (!res.ok) throw new Error(`Failed to fetch product: ${res.status}`);
                return res.json();
            })
            .then(product => {
                console.log('Fetched product:', product);
                showProductForm(product, () => {
                    console.log('Edit callback triggered');
                    fetchProducts(document.getElementById('sort-by').value, currentPage);
                });
            })
            .catch(error => {
                console.error('Error fetching product for edit:', error);
                if (error.message.includes('404')) {
                    console.log(`Product ID ${productId} not found, redirecting to 404 page`);
                    window.location.assign('../pages/page_404_error.html');
                } else {
                    showSimpleModal(
                        translations.error('error_loading_product', lang) || 'Error',
                        translations.error('error_loading_product', lang) || 'Failed to load product',
                        'modal-error'
                    );
                }
            })
            .finally(() => hidePreloader());
    } else if (e.target.classList.contains('delete-btn')) {
        const productId = e.target.dataset.id;
        console.log(`Delete button clicked for product ID: ${productId}`);
        if (!productId) {
            console.error('Invalid product ID for delete');
            showSimpleModal(
                translations.error('error_invalid_id', lang) || 'Error',
                translations.error('error_invalid_id', lang) || 'Invalid product ID',
                'modal-error'
            );
            return;
        }
        showPreloader();
        fetch(`http://localhost:3000/products/${productId}`)
            .then(res => {
                if (!res.ok) throw new Error(`Failed to fetch product: ${res.status}`);
                return res.json();
            })
            .then(product => {
                showSimpleModal(
                    translations.confirm('confirm_delete_product', lang) || 'Confirm Delete',
                    `${translations.confirm('confirm_delete_product_prompt', lang) || 'Are you sure you want to delete product'} "${product.name}"?`,
                    'modal-confirm',
                    [
                        {
                            text: translations.confirmation_yes?.[lang] || 'Yes',
                            class: 'modal-btn confirm-btn',
                            action: async () => {
                                try {
                                    showPreloader();
                                    await deleteProduct(productId);
                                    showSimpleModal(
                                        translations.success('delete_product_success', lang) || 'Success',
                                        translations.success('delete_product_success', lang) || 'Product deleted successfully!',
                                        'modal-success'
                                    );
                                    fetchProducts(document.getElementById('sort-by').value, currentPage);
                                } catch (error) {
                                    console.error('Error deleting product:', error);
                                    showSimpleModal(
                                        translations.error('error_delete_product', lang) || 'Error',
                                        translations.error('error_delete_product', lang) || 'Failed to delete product',
                                        'modal-error'
                                    );
                                } finally {
                                    hidePreloader();
                                }
                            }
                        },
                        {
                            text: translations.confirmation_no?.[lang] || 'No',
                            class: 'modal-btn cancel-btn',
                            action: () => closeModal()
                        }
                    ]
                );
            })
            .catch(error => {
                console.error('Error fetching product for delete:', error);
                if (error.message.includes('404')) {
                    console.log(`Product ID ${productId} not found, redirecting to 404 page`);
                    window.location.assign('../pages/page_404_error.html');
                } else {
                    showSimpleModal(
                        translations.error('error_loading_product', lang) || 'Error',
                        translations.error('error_loading_product', lang) || 'Failed to load product',
                        'modal-error'
                    );
                }
            })
            .finally(() => hidePreloader());
    }
}

function generateStars(rating) {
    const fullStars = Math.floor(rating || 0);
    const halfStar = (rating || 0) % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    return `
        ${'<img src="../images/home_page_icons/full_star_icon.svg" alt="Star" class="rating-icon">'.repeat(fullStars)}
        ${halfStar ? '<img src="../images/home_page_icons/half_star_icon.svg" alt="Half Star" class="rating-icon">' : ''}
        ${'<img src="../images/home_page_icons/star_outline_icon.svg" alt="Star" class="rating-icon">'.repeat(emptyStars)}
    `;
}

function updateLanguage(lang, translations) {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.dataset.i18n;
        const translation = translations[key]?.[lang] || element.textContent || key;
        element.textContent = translation;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.dataset.i18nPlaceholder;
        const translation = translations[key]?.[lang] || element.placeholder || key;
        element.placeholder = translation;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('admin.js loaded');
    initPreloader();
    const lang = localStorage.getItem('language') || 'en';
    const auth = checkAuth('admin');
    if (!auth.isAuthenticated || !auth.hasRequiredRole) {
        console.log('Access denied: User not authenticated or not an admin');
        showSimpleModal(
            translations.error('access_denied', lang) || 'Error',
            translations.error('access_denied', lang) || 'Access denied',
            'modal-error'
        );
        setTimeout(() => {
            window.location.assign('../auth/signin.html');
        }, 1500);
        return;
    }

    if (!addProductBtn || !productsGrid || !noResults || !productsCount) {
        console.error('Required DOM elements are missing on page load');
        showSimpleModal(
            translations.error('error_missing_elements', lang) || 'Error',
            translations.error('error_missing_elements', lang) || 'Page elements not found',
            'modal-error'
        );
        return;
    }

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

    addProductBtn.addEventListener('click', () => {
        console.log('Add product button clicked');
        showPreloader();
        showProductForm(null, () => {
            console.log('Add callback triggered');
            fetchProducts(document.getElementById('sort-by').value, currentPage);
        });
        hidePreloader();
    });

    initBurgerMenu(false);
    initLanguageSwitcher('.header-controls .language-selector');
    initLanguageSwitcher('.mobile-menu .language-selector');
    const headerThemeToggle = document.querySelector('.header-controls .custom-toggle .toggle-input');
    const mobileThemeToggle = document.querySelector('.mobile-menu .custom-toggle .toggle-input');
    if (headerThemeToggle) initThemeSwitcher(headerThemeToggle);
    if (mobileThemeToggle) initThemeSwitcher(mobileThemeToggle);

    window.addEventListener('languageChanged', () => {
        const newLang = localStorage.getItem('language') || 'en';
        fetchProducts(document.getElementById('sort-by').value, currentPage);
        updateLanguage(newLang, translations);
    });
});