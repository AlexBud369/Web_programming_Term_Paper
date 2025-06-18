import { showSimpleModal } from './modal.js';

export async function getFavorites(userId) {
    const lang = localStorage.getItem('language') || 'en';
    try {
        const res = await fetch(`http://localhost:3000/favorites?userId=${userId}`, {
            headers: { 'Accept': 'application/json' }
        });
        if (res.status === 404) {
            window.location.assign('../pages/page_404_error.html');
            return [];
        }
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const favorites = await res.json();
        return favorites.filter(fav => fav.product && typeof fav.product.id === 'number');
    } catch (error) {
        console.error('Error fetching favorites:', error.message);
        showSimpleModal(
            'error_title',
            'error_loading',
            'modal-error',
            null,
            lang
        );
        throw error;
    }
}

export async function toggleFavorite(productId, productData, userId) {
    const lang = localStorage.getItem('language') || 'en';
    try {
        console.log('Toggling favorite for:', { productId, userId });
        const favorites = await getFavorites(userId);
        const existingFavorite = favorites.find(fav => fav.productId === productId && fav.userId === userId);

        if (existingFavorite) {
            const res = await fetch(`http://localhost:3000/favorites/${existingFavorite.id}`, {
                method: 'DELETE'
            });
            if (res.status === 404) {
                window.location.assign('../pages/page_404_error.html');
                return false;
            }
            if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
            sessionStorage.setItem('showSuccessModal', JSON.stringify({ messageKey: 'removed_from_favorites', params: {} }));
            setTimeout(() => {
                console.log('Reloading page after removing favorite');
                window.location.reload();
            }, 3000);
            return false;
        } else {
            const res = await fetch(`http://localhost:3000/favorites`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    productId,
                    product: productData
                })
            });
            if (res.status === 404) {
                window.location.assign('../pages/page_404_error.html');
                return false;
            }
            if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
            sessionStorage.setItem('showSuccessModal', JSON.stringify({ messageKey: 'added_to_favorites', params: {} }));
            setTimeout(() => {
                console.log('Reloading page after adding favorite');
                window.location.reload();
            }, 3000);
            return true;
        }
    } catch (error) {
        console.error('Error toggling favorite:', error.message);
        showSimpleModal(
            'error_title',
            'error_updating_favorites',
            'modal-error',
            null,
            lang
        );
        throw error;
    }
}

export function initFavorites(products, userId, callback) {
    const favoriteButtons = document.querySelectorAll('.favorite-btn');
    const lang = localStorage.getItem('language') || 'en';
    console.log('initFavorites: Found buttons:', favoriteButtons.length, 'Products:', products.length, 'UserId:', userId);
    favoriteButtons.forEach(button => {
        const productId = parseInt(button.dataset.productId);
        console.log('Processing favorite button for productId:', productId, 'Dataset:', button.dataset);
        const product = products.find(p => p.id === productId);

        if (!product) {
            console.warn('Product not found for productId:', productId);
            return;
        }

        getFavorites(userId).then(favorites => {
            const isFavorite = favorites.some(fav => fav.productId === productId);
            button.classList.toggle('active', isFavorite);
            console.log('Set favorite status for productId:', productId, 'isFavorite:', isFavorite);
        }).catch(error => {
            console.error('Error initializing favorite button:', error.message);
        });

        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Favorite button clicked:', productId, 'Button:', button);
            try {
                const isFavorite = await toggleFavorite(productId, product, userId);
                button.classList.toggle('active', isFavorite);
                callback(productId, isFavorite);
            } catch (error) {
                console.error('Error in favorite button click:', error.message);
                showSimpleModal(
                    'error_title',
                    'error_updating_favorites',
                    'modal-error',
                    null,
                    lang
                );
            }
        });
    });
}