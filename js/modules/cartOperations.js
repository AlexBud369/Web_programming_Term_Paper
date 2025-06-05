import { showErrorModal } from './modal.js';

export async function updateCartItemQuantity(itemId, newQuantity) {
    try {
        const res = await fetch('http://localhost:3000/cart');
        if (!res.ok) throw new Error('Failed to fetch cart');
        const cart = await res.json();
        const item = cart.find(item => item.id === itemId);
        if (!item) throw new Error('Item not found');

        if (newQuantity > item.quantity) {
            const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
            if (totalQuantity >= 10) {
                showErrorModal('Cannot add more items. The cart is limited to 10 items in total.');
                return false;
            }
        }

        if (newQuantity <= 0) {
            await fetch(`http://localhost:3000/cart/${itemId}`, { method: 'DELETE' });
        } else {
            const updatedItem = { ...item, quantity: newQuantity };
            await fetch(`http://localhost:3000/cart/${itemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedItem)
            });
        }
        return true;
    } catch (error) {
        console.error('Error updating cart item:', error);
        showErrorModal('Failed to update cart item.');
        return false;
    }
}

export async function removeFromCart(itemId) {
    try {
        const res = await fetch(`http://localhost:3000/cart/${itemId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to remove item');
        return true;
    } catch (error) {
        console.error('Error removing cart item:', error);
        showErrorModal('Failed to remove item from cart.');
        return false;
    }
}

export function updateCartCount() {
    fetch('http://localhost:3000/cart')
        .then(res => res.json())
        .then(cart => {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            const cartLink = document.querySelector('.cart-link');
            if (cartLink) {
                cartLink.dataset.count = totalItems;
                cartLink.style.setProperty('--cart-count', `"${totalItems}"`);
            }
        })
        .catch(error => console.error('Error updating cart count:', error));
}