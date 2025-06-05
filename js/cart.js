import { showErrorModal, showSuccessModal } from './modules/modal.js';
import { updateCartItemQuantity, removeFromCart, updateCartCount } from './modules/cartOperations.js';
import { validateCheckoutForm } from './modules/formValidation.js';
import { checkAuth, updateUserProfile } from './modules/auth.js'; 
import { initBurgerMenu } from './modules/burgerMenu.js'; 

export async function initCart() {
    const elements = {
        cartItems: document.querySelector('.cart-items'),
        cartTotal: document.querySelector('.cart-total'),
        cartSubtotal: document.querySelector('#cart-subtotal'),
        cartShipping: document.querySelector('#cart-shipping'),
        cartTotalAmount: document.querySelector('#cart-total'),
        checkoutForm: document.querySelector('#checkout-form'),
        successNotification: document.querySelector('#success-notification'),
        notificationClose: document.querySelector('#success-notification .modal-ok-btn'),
    };

    if (!elements.cartItems || !elements.cartTotal) {
        console.error('Cart elements not found');
        return;
    }

    const cardSelect = document.querySelector('.card-select');
    if (cardSelect) {
        cardSelect.value = 'belkart';
    }

    async function fetchCart() {
        try {
            const res = await fetch('http://localhost:3000/cart');
            if (!res.ok) throw new Error('Failed to fetch cart');
            return await res.json();
        } catch (error) {
            console.error('Error fetching cart:', error);
            showErrorModal('Failed to load cart.');
            return [];
        }
    }

    async function renderCart() {
        const cart = await fetchCart();
        if (cart.length === 0) {
            elements.cartItems.innerHTML = `
                <div class="empty-cart">
                    <p>Your cart is empty.</p>
                    <a href="/pages/catalog.html">Continue Shopping</a>
                </div>
            `;
            elements.cartTotal.innerHTML = `
                <div class="total-row">
                    <span>Subtotal</span>
                    <span id="cart-subtotal">$0.00</span>
                </div>
                <div class="total-row">
                    <span>Shipping</span>
                    <span id="cart-shipping">$0.00</span>
                </div>
                <div class="total-row total">
                    <span>Total</span>
                    <span id="cart-total">$0.00</span>
                </div>
            `;
            return;
        }

        elements.cartItems.innerHTML = cart.map(item => `
            <div class="cart-item" role="listitem" data-id="${item.id}">
                <div class="cart-column product-details">
                    <img src="${item.image}" alt="${item.name}" class="product-image">
                    <div class="product-info">
                        <h3 class="product-name">${item.name}</h3>
                        <p class="product-color">Color: ${item.color}</p>
                        <p class="product-size">Size: ${item.size}</p>
                    </div>
                </div>
                <div class="cart-column product-price">$${item.price.toFixed(2)}</div>
                <div class="cart-column quantity-control">
                    <button class="quantity-btn decrease" aria-label="Decrease quantity">-</button>
                    <span class="quantity-label">${item.quantity}</span>
                    <button class="quantity-btn increase" aria-label="Increase quantity">+</button>
                </div>
                <div class="cart-column shipping">$${item.shipping?.toFixed(2) || 7}</div>
                <div class="cart-column subtotal">$${(item.price * item.quantity).toFixed(2)}</div>
                <div class="cart-column action">
                    <button class="delete-btn" aria-label="Remove ${item.name} from cart">
                        <img src="../images/home_page/deletecart.svg" alt="Delete">
                    </button>
                </div>
            </div>
        `).join('');

        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const shipping = cart.length > 0 ? cart.reduce((sum, item) => sum + (item.shipping || 7), 0) : 0;
        const total = subtotal + shipping;

        elements.cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
        elements.cartShipping.textContent = `$${shipping.toFixed(2)}`; 
        elements.cartTotalAmount.textContent = `$${total.toFixed(2)}`; 
    }

    elements.cartItems.addEventListener('click', async (e) => {
        const cartItem = e.target.closest('.cart-item');
        if (!cartItem) return;
        const itemId = parseInt(cartItem.dataset.id);
        if (!itemId) return;

        if (e.target.closest('.decrease')) {
            const item = (await fetchCart()).find(item => item.id === itemId);
            if (item) {
                const success = await updateCartItemQuantity(itemId, item.quantity - 1);
                if (success) await renderCart();
            }
        }

        if (e.target.closest('.increase')) {
            const item = (await fetchCart()).find(item => item.id === itemId);
            if (item) {
                const success = await updateCartItemQuantity(itemId, item.quantity + 1);
                if (success) await renderCart();
            }
        }

        if (e.target.closest('.delete-btn')) {
            const success = await removeFromCart(itemId);
            if (success) await renderCart();
        }
    });

    elements.checkoutForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const auth = checkAuth();
        if (!auth.isAuthenticated) {
            showErrorModal('Please log in to place an order.');
            window.location.href = '../auth/signin.html';
            return;
        }

        const isValid = await validateCheckoutForm(elements.checkoutForm);
        if (!isValid) return;

        try {
            const cart = await fetchCart();
            for (const item of cart) {
                await fetch(`http://localhost:3000/cart/${item.id}`, { method: 'DELETE' });
            }

            if (elements.successNotification) {
                elements.successNotification.style.display = 'flex';
                setTimeout(() => {
                    elements.successNotification.querySelector('.modal-content').classList.add('show');
                }, 10);
            }

            await renderCart();
            updateCartCount();
        } catch (error) {
            console.error('Error processing order:', error);
            showErrorModal('Failed to place order.');
        }
    });

    elements.notificationClose?.addEventListener('click', () => {
        if (elements.successNotification) {
            elements.successNotification.querySelector('.modal-content').classList.remove('show');
            setTimeout(() => {
                elements.successNotification.style.display = 'none';
            }, 300);
        }
    });

    updateUserProfile();
    await renderCart();
    updateCartCount();
}

document.addEventListener('DOMContentLoaded', () => {
    initCart();
    initBurgerMenu(false);
});