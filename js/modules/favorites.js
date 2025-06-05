export async function getFavorites(userId) {
    try {
        const res = await fetch(`http://localhost:3000/favorites?userId=${userId}`, {
            headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const favorites = await res.json();
        return favorites.filter(fav => fav.product && typeof fav.product.id === 'number');
    } catch (error) {
        console.error('Error fetching favorites:', error.message);
        throw error;
    }
}

export async function toggleFavorite(productId, productData, userId) {
    try {
        const favorites = await getFavorites(userId);
        const existingFavorite = favorites.find(fav => fav.productId === productId && fav.userId === userId);

        if (existingFavorite) {
            const res = await fetch(`http://localhost:3000/favorites/${existingFavorite.id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
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
            if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
            return true; 
        }
    } catch (error) {
        console.error('Error toggling favorite:', error.message);
        throw error;
    }
}

export function initFavorites(products, userId, callback) {
    const favoriteButtons = document.querySelectorAll('.favorite-btn');
    favoriteButtons.forEach(button => {
        const productId = parseInt(button.dataset.productId);
        const product = products.find(p => p.id === productId);

        getFavorites(userId).then(favorites => {
            const isFavorite = favorites.some(fav => fav.productId === productId);
            button.classList.toggle('active', isFavorite);
        }).catch(error => {
            console.error('Error initializing favorite button:', error.message);
        });

        button.addEventListener('click', async () => {
            try {
                const isFavorite = await toggleFavorite(productId, product, userId);
                button.classList.toggle('active', isFavorite);
                callback(productId, isFavorite);
            } catch (error) {
                alert('Failed to update favorites. Please try again.');
            }
        });
    });
}