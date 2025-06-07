import { applyFilters, initFilters } from './modules/filtering.js';
import { initPagination } from './modules/pagination.js';
import { getSortParams } from './modules/sorting.js';
import { initSearch } from './modules/search.js';
import { showProductForm, deleteProduct } from './modules/productCRUD.js';
import { showSimpleModal } from './modules/modal.js';
import { checkAuth, updateUserProfile } from './modules/auth.js'; 
import { initBurgerMenu } from './modules/burgerMenu.js'; 

const productsGrid = document.getElementById('products-grid');
const productsCount = document.getElementById('products-count');
const noResults = document.getElementById('no-results');
const addProductBtn = document.querySelector('.add-product-btn');
let currentPage = 1;

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

    if (priceMin && !isNaN(priceMin)) {
        queryParams.push(`price_gte=${encodeURIComponent(priceMin)}`);
    }
    if (priceMax && !isNaN(priceMax)) {
        queryParams.push(`price_lte=${encodeURIComponent(priceMax)}`);
    }

    if (selectedCategories.length > 0) {
        selectedCategories.forEach(category => {
            queryParams.push(`category=${encodeURIComponent(category)}`);
        });
    }

    if (colors.length > 0) {
        colors.forEach(color => {
            queryParams.push(`colors=${encodeURIComponent(color)}`);
        });
    }

    if (sizes.length > 0) {
        sizes.forEach(size => {
            queryParams.push(`sizes=${encodeURIComponent(size)}`);
        });
    }

    if (style) {
        queryParams.push(`style=${encodeURIComponent(style)}`);
    }

    if (searchInput) {
        queryParams.push(`q=${encodeURIComponent(searchInput)}`);
    }

    const sortParams = getSortParams(sortOption);
    queryParams.push(...sortParams);

    const query = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    const url = `http://localhost:3000/products${query}`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`HTTP error: ${res.status}`);
        }
        const filteredProducts = await res.json();

        const countUrl = `http://localhost:3000/products${query.replace(/_page=\d+&_limit=\d+/, '')}`;
        const countRes = await fetch(countUrl);
        if (!countRes.ok) {
            throw new Error(`HTTP error: ${countRes.status}`);
        }
        const totalProducts = (await countRes.json()).length;

        renderProducts(filteredProducts, totalProducts);
    } catch (error) {
        console.error('Error fetching products:', error);
        showSimpleModal('Error', 'Failed to load products. Please try again later.', 'modal-error');
        renderProducts([], 0);
    }
}

function renderProducts(products, totalItems) {
    if (!productsGrid || !noResults || !productsCount) {
        console.error('Required DOM elements are missing');
        return;
    }

    productsGrid.innerHTML = '';
    noResults.style.display = products.length === 0 ? 'block' : 'none';
    productsCount.textContent = `${totalItems} items`;

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <button class="quick-view" data-product-id="${product.id}">Quick View</button>
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-brand">${product.brand}</p>
                <div class="product-rating">
                    ${generateStars(product.rating)}
                    <span class="rating-count">(${product.rating})</span>
                </div>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <p class="product-colors">Colors: ${product.colors?.join(', ') || 'N/A'}</p>
                <p class="product-category">Category: ${product.category}</p>
                <div class="admin-actions">
                    <button class="edit-btn" data-id="${product.id}">Edit</button>
                    <button class="delete-btn" data-id="${product.id}">Delete</button>
                </div>
            </div>
        `;
        productsGrid.appendChild(productCard);
    });

    productsGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('quick-view')) {
            const productId = e.target.dataset.productId;
            console.log(`Quick View clicked for product ID: ${productId}`);
            window.location.href = `product.html?id=${productId}`;
        }
    });

    productsGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-btn')) {
            const productId = e.target.dataset.id;
            console.log(`Edit button clicked for product ID: ${productId}`);
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
                    showSimpleModal('Error', `Failed to load product data: ${error.message}`, 'modal-error');
                });
        }
    });

    productsGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const productId = e.target.dataset.id;
            console.log(`Delete button clicked for product ID: ${productId}`);
            fetch(`http://localhost:3000/products/${productId}`)
                .then(res => {
                    if (!res.ok) throw new Error(`Failed to fetch product: ${res.status}`);
                    return res.json();
                })
                .then(product => {
                    showSimpleModal('Confirm Delete', `Are you sure you want to delete product "${product.name}"?`, 'modal-confirm', [
                        { text: 'Yes', class: 'confirm-btn', action: async () => {
                            try {
                                await deleteProduct(productId);
                                showSimpleModal('Success', 'Product deleted successfully!', 'modal-success');
                                fetchProducts(document.getElementById('sort-by').value, currentPage);
                            } catch (error) {
                                console.error('Error deleting product:', error);
                                showSimpleModal('Error', `Failed to delete product: ${error.message}`, 'modal-error');
                            }
                        }},
                        { text: 'No', class: 'cancel-btn', action: () => {} }
                    ]);
                })
                .catch(error => {
                    console.error('Error fetching product for delete:', error);
                    showSimpleModal('Error', `Failed to load product data: ${error.message}`, 'modal-error');
                });
        }
    });

    initPagination(totalItems, currentPage, 9, (page) => {
        currentPage = page;
        fetchProducts(document.getElementById('sort-by').value, page);
    });
}

function generateStars(rating) {
    const fullStars = Math.floor(rating || 0);
    const halfStar = (rating || 0) % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    return `
        ${'<img src="../images/star-filled.svg" alt="Star" class="rating-icon">'.repeat(fullStars)}
        ${halfStar ? '<img src="../images/star-half.svg" alt="Half Star" class="rating-icon">' : ''}
        ${'<img src="../images/star-empty.svg" alt="Star" class="rating-icon">'.repeat(emptyStars)}
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    const auth = checkAuth('admin');
    if (!auth.isAuthenticated) {
        window.location.href = '../auth/signin.html';
        return;
    }
    if (!auth.hasRequiredRole) {
        window.location.href = '../pages/account.html';
        return;
    }

    updateUserProfile();
    if (!addProductBtn || !productsGrid || !noResults || !productsCount) {
        console.error('Required DOM elements are missing on page load');
        return;
    }

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
        showProductForm(null, () => {
            console.log('Add callback triggered');
            fetchProducts(document.getElementById('sort-by').value, currentPage);
        });
    });

    initBurgerMenu(false); 
});