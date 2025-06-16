import { showErrorModal } from './modal.js';
import { translations } from './pages-translations/cart_translations.js';

export async function updateCartItemQuantity(itemId, newQuantity) {
    const lang = localStorage.getItem('language') || 'en';
    try {
        console.log(`Updating cart item ${itemId} to quantity ${newQuantity}`);
        const res = await fetch('http://localhost:3000/cart');
        if (res.status === 404) {
            console.warn('Fetch cart returned 404, redirecting');
            window.location.assign('../pages/page_404_error.html');
            return false;
        }
        if (!res.ok) throw new Error(`Failed to fetch cart: ${res.status}`);
        const cart = await res.json();
        const item = cart.find(item => item.id === itemId);
        if (!item) throw new Error('Item not found');

        if (newQuantity > item.quantity) {
            const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
            if (totalQuantity >= 10) {
                showErrorModal(
                    translations.cart_limit?.[lang] || translations.cart_limit?.['en'] || 'Cannot add more items. The cart is limited to 10 items in total.',
                    'cart'
                );
                return false;
            }
        }

        if (newQuantity <= 0) {
            console.log(`Deleting item ${itemId} as quantity is <= 0`);
            const deleteRes = await fetch(`http://localhost:3000/cart/${itemId}`, { method: 'DELETE' });
            if (deleteRes.status === 404) {
                console.warn('Delete item returned 404, redirecting');
                window.location.assign('../pages/page_404_error.html');
                return false;
            }
            if (!deleteRes.ok) throw new Error(`Failed to delete item: ${deleteRes.status}`);
        } else {
            const updatedItem = { ...item, quantity: newQuantity };
            console.log(`Patching item ${itemId} with`, updatedItem);
            const patchRes = await fetch(`http://localhost:3000/cart/${itemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedItem)
            });
            if (patchRes.status === 404) {
                console.warn('Patch item returned 404, redirecting');
                window.location.assign('../pages/page_404_error.html');
                return false;
            }
            if (!patchRes.ok) throw new Error(`Failed to update item: ${patchRes.status}`);
        }
        console.log(`Successfully updated item ${itemId}`);
        return true;
    } catch (error) {
        console.error('Error updating cart item:', error);
        showErrorModal(
            translations.error_updating_cart?.[lang] || translations.error_updating_cart?.['en'] || 'Failed to update cart item.',
            'cart'
        );
        return false;
    }
}

export async function removeFromCart(itemId) {
    const lang = localStorage.getItem('language') || 'en';
    try {
        console.log(`Removing item ${itemId} from cart`);
        const res = await fetch(`http://localhost:3000/cart/${itemId}`, { method: 'DELETE' });
        if (res.status === 404) {
            console.warn('Remove item returned 404, redirecting');
            window.location.assign('../pages/page_404_error.html');
            return false;
        }
        if (!res.ok) throw new Error(`Failed to remove item: ${res.status}`);
        console.log(`Successfully removed item ${itemId}`);
        return true;
    } catch (error) {
        console.error('Error removing cart item:', error);
        showErrorModal(
            translations.error_removing_cart?.[lang] || translations.error_removing_cart?.['en'] || 'Failed to remove item from cart.',
            'cart'
        );
        return false;
    }
}

export function updateCartCount() {
    console.log('Updating cart count');
    fetch('http://localhost:3000/cart')
        .then(res => {
            if (res.status === 404) {
                console.warn('Cart count fetch returned 404, redirecting');
                window.location.assign('../pages/page_404_error.html');
                return [];
            }
            if (!res.ok) throw new Error(`Failed to fetch cart for count: ${res.status}`);
            return res.json();
        })
        .then(cart => {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            console.log(`Cart count updated to ${totalItems}`);
            const cartLink = document.querySelector('.cart-link');
            if (cartLink) {
                cartLink.dataset.count = totalItems;
                cartLink.style.setProperty('--cart-count', `"${totalItems}"`);
            }
        })
        .catch(error => console.error('Error updating cart count:', error));
}