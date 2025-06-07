import { initPagination, getPaginatedItems } from './modules/pagination.js';
import { getFavorites } from './modules/favorites.js';
import { initAddToCart } from './modules/addToCart.js';
import { showSuccessModalAfterReload } from './modules/modal.js';
import { initProfileEditing } from './modules/profile.js';
import { checkAuth, updateUserProfile } from './modules/auth.js'; 
import { initBurgerMenu } from './modules/burgerMenu.js'; 

const wishlistGrid = document.getElementById('wishlist-grid');
const noResults = document.getElementById('no-results');
let currentPage = 1;

async function renderWishlist(page = 1) {
    if (!wishlistGrid || !noResults) {
        console.error('Wishlist grid or no-results element not found');
        return;
    }

    const auth = checkAuth();
    if (!auth.isAuthenticated) {
        wishlistGrid.innerHTML = '<p>Please log in to view your favorites.</p>';
        noResults.style.display = 'block';
        noResults.textContent = 'Please log in to view your favorites.';
        window.location.href = '../auth/signin.html';
        return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
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
        noResults.textContent = products.length === 0 ? 'No items in your favorites.' : '';

        paginatedItems.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.dataset.id = product.id;
            productCard.innerHTML = `
                <div class="product-image-container">
                    <img src="${product.image}" alt="${product.name}" class="product-image">
                    <button class="quick-view" data-product-id="${product.id}">Quick View</button>
                    <button class="favorite-btn active" data-product-id="${product.id}" data-favorite-id="${product.favoriteId}">
                        <img src="../images/home_page_icons/heart_filled_icon.svg" alt="Remove from Favorites" class="favorite-icon">
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
                    <p class="product-colors">Colors: ${product.colors.join(', ')}</p>
                    <p class="product-category">Category: ${product.category}</p>
                    <button class="add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
                </div>
            `;
            wishlistGrid.appendChild(productCard);
        });

        wishlistGrid.querySelectorAll('.quick-view').forEach(button => {
            button.addEventListener('click', () => {
                const productId = button.dataset.productId;
                window.location.href = `product.html?id=${productId}`;
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
                    renderWishlist(page);
                } catch (error) {
                    console.error('Error removing favorite:', error.message);
                    alert('Failed to remove favorite. Please try again.');
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
        wishlistGrid.innerHTML = '<p>Error loading favorites. Please try again later.</p>';
        noResults.style.display = 'block';
        noResults.textContent = 'Error loading favorites.';
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

document.addEventListener('DOMContentLoaded', () => {
    const auth = checkAuth();
    if (!auth.isAuthenticated) {
        window.location.href = '../auth/signin.html';
        return;
    }

    updateUserProfile();
    renderWishlist(currentPage);
    showSuccessModalAfterReload();
    initProfileEditing();
    initBurgerMenu(false); 
});