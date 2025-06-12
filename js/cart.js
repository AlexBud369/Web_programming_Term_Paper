import { showErrorModal, showSuccessModal, showSimpleModal } from './modules/modal.js';
import { updateCartItemQuantity, removeFromCart, updateCartCount } from './modules/cartOperations.js';
import { validateCheckoutForm } from './modules/formValidation.js';
import { checkAuth, updateUserProfile } from './modules/auth.js';
import { initBurgerMenu } from './modules/burgerMenu.js';
import { initLanguageSwitcher } from './modules/languageSwitcher.js';
import { initThemeSwitcher } from './modules/themeSwitcher.js';
import { translations } from './modules/pages-translations/cart_translations.js';
import { showPreloader, hidePreloader, initPreloader } from './modules/preloader.js';

function getTranslation(key, lang, fallback) {
    return translations[key]?.[lang] || fallback || key;
}

export async function initCart() {
    const elements = {
        cartItems: document.querySelector('.cart-items'),
        cartTotal: document.querySelector('.cart-total'),
        cartSubtotal: document.querySelector('#cart-subtotal'),
        cartShipping: document.querySelector('#cart-shipping'),
        cartTotalAmount: document.querySelector('#cart-total'),
        checkoutForm: document.querySelector('#checkout-form'),
    };

    const lang = localStorage.getItem('language') || 'en';
    if (!elements.cartItems || !elements.cartTotal) {
        console.error('Cart elements not found');
        showSimpleModal(
            getTranslation('modal_error_title', lang, 'Error'),
            getTranslation('error_missing_elements', lang, 'Required page elements are missing.'),
            'modal-error'
        );
        return;
    }

    const cardSelect = document.querySelector('.card-select');
    if (cardSelect) {
        cardSelect.value = 'belkart';
    }

    async function fetchCart() {
        try {
            showPreloader();
            const res = await fetch('http://localhost:3000/cart');
            if (!res.ok) throw new Error('Failed to fetch cart');
            return await res.json();
        } catch (error) {
            console.error('Error fetching cart:', error);
            showSimpleModal(
                getTranslation('modal_error_title', lang, 'Error'),
                getTranslation('error_loading_cart', lang, 'Failed to load cart. Please try again.'),
                'modal-error'
            );
            return [];
        } finally {
            hidePreloader();
        }
    }

    async function renderCart(lang = localStorage.getItem('language') || 'en') {
        const cart = await fetchCart();
        if (cart.length === 0) {
            elements.cartItems.innerHTML = `
                <div class="empty-cart">
                    <p data-i18n="cart_empty_message">${getTranslation('cart_empty_message', lang, 'Your cart is empty.')}</p>
                    <a href="/pages/catalog.html" data-i18n="continue_shopping">${getTranslation('continue_shopping', lang, 'Continue Shopping')}</a>
                </div>
            `;
            elements.cartTotal.innerHTML = `
                <div class="total-row">
                    <span data-i18n="cart_subtotal_label">${getTranslation('cart_subtotal_label', lang, 'Subtotal')}</span>
                    <span id="cart-subtotal">$0.00</span>
                </div>
                <div class="total-row">
                    <span data-i18n="cart_shipping_label">${getTranslation('cart_shipping_label', lang, 'Shipping')}</span>
                    <span id="cart-shipping">$0.00</span>
                </div>
                <div class="total-row total">
                    <span data-i18n="cart_total_label">${getTranslation('cart_total_label', lang, 'Total')}</span>
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
                        <p class="product-color"><span data-i18n="color_label">${getTranslation('color_label', lang, 'Color')}</span>: ${getTranslation(`color_${item.color.toLowerCase()}`, lang, item.color)}</p>
                        <p class="product-size"><span data-i18n="size_label">${getTranslation('size_label', lang, 'Size')}</span>: ${item.size}</p>
                    </div>
                </div>
                <div class="cart-column product-price">$${item.price.toFixed(2)}</div>
                <div class="cart-column quantity-control">
                    <button class="quantity-btn decrease" aria-label="${getTranslation('decrease_quantity', lang, 'Decrease quantity')}">-</button>
                    <span class="quantity-label">${item.quantity}</span>
                    <button class="quantity-btn increase" aria-label="${getTranslation('increase_quantity', lang, 'Increase quantity')}">+</button>
                </div>
                <div class="cart-column shipping">$${item.shipping?.toFixed(2) || '7.00'}</div>
                <div class="cart-column subtotal">$${(item.price * item.quantity).toFixed(2)}</div>
                <div class="cart-column action">
                    <button class="delete-btn" aria-label="${getTranslation('remove_item', lang, 'Remove {name} from cart').replace('{name}', item.name)}">
                        <img src="../images/cart_images/deletecon.svg" alt="${getTranslation('delete', lang, 'Delete')}">
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

    function updateLanguage(lang = localStorage.getItem('language') || 'en') {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.dataset.i18n;
            const translation = getTranslation(key, lang, element.textContent || key);
            element.innerHTML = translation;
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.dataset.i18nPlaceholder;
            const translation = getTranslation(key, lang, element.placeholder || key);
            element.placeholder = translation;
        });

        document.querySelectorAll('.current-language').forEach(element => {
            const translation = getTranslation('lang_current', lang, lang.toUpperCase());
            element.textContent = translation;
        });
    }

    elements.cartItems.addEventListener('click', async (e) => {
        const cartItem = e.target.closest('.cart-item');
        if (!cartItem) return;
        const itemId = parseInt(cartItem.dataset.id);
        if (!itemId) return;

        const lang = localStorage.getItem('language') || 'en';

        if (e.target.closest('.decrease')) {
            const item = (await fetchCart()).find(item => item.id === itemId);
            if (item) {
                showPreloader();
                const success = await updateCartItemQuantity(itemId, item.quantity - 1);
                hidePreloader();
                if (success) {
                    localStorage.setItem('showCartModal', JSON.stringify({
                        title: getTranslation('modal_success_title', lang, 'Success'),
                        message: getTranslation('quantity_updated', lang, 'Quantity updated successfully!'),
                        type: 'modal-success'
                    }));
                    window.location.reload();
                }
            }
        }

        if (e.target.closest('.increase')) {
            const item = (await fetchCart()).find(item => item.id === itemId);
            if (item) {
                showPreloader();
                const success = await updateCartItemQuantity(itemId, item.quantity + 1);
                hidePreloader();
                if (success) {
                    localStorage.setItem('showCartModal', JSON.stringify({
                        title: getTranslation('modal_success_title', lang, 'Success'),
                        message: getTranslation('quantity_updated', lang, 'Quantity updated successfully!'),
                        type: 'modal-success'
                    }));
                    window.location.reload();
                }
            }
        }

        if (e.target.closest('.delete-btn')) {
            showPreloader();
            const success = await removeFromCart(itemId);
            hidePreloader();
            if (success) {
                localStorage.setItem('showCartModal', JSON.stringify({
                    title: getTranslation('modal_success_title', lang, 'Success'),
                    message: getTranslation('item_removed', lang, 'Item removed from cart!'),
                    type: 'modal-success'
                }));
                window.location.reload();
            }
        }
    });

    elements.checkoutForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const lang = localStorage.getItem('language') || 'en';
        const auth = checkAuth();
        if (!auth.isAuthenticated) {
            showSimpleModal(
                getTranslation('modal_error_title', lang, 'Error'),
                getTranslation('error_not_authenticated', lang, 'Please log in to proceed.'),
                'modal-error'
            );
            setTimeout(() => window.location.assign('../auth/signin.html'), 1500);
            return;
        }

        const cart = await fetchCart();
        if (cart.length === 0) {
            showSimpleModal(
                getTranslation('modal_error_title', lang, 'Error'),
                getTranslation('cart_empty_message', lang, 'Your cart is empty.'),
                'modal-error'
            );
            return;
        }

        const isValid = await validateCheckoutForm(elements.checkoutForm);
        if (!isValid) {
            showSimpleModal(
                getTranslation('modal_error_title', lang, 'Error'),
                getTranslation('form_validation_error', lang, 'Please fill out the form correctly.'),
                'modal-error'
            );
            return;
        }

        try {
            showPreloader();
            for (const item of cart) {
                await fetch(`http://localhost:3000/cart/${item.id}`, { method: 'DELETE' });
            }
            localStorage.setItem('showOrderSuccessModal', 'true');
            updateCartCount();
            window.location.reload();
        } catch (error) {
            console.error('Error processing order:', error);
            showSimpleModal(
                getTranslation('modal_error_title', lang, 'Error'),
                getTranslation('error_place_order', lang, 'Failed to place order. Please try again.'),
                'modal-error'
            );
        } finally {
            hidePreloader();
        }
    });

    await renderCart(lang);
    updateLanguage(lang);
    updateCartCount();
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('cart.js loaded');
    initPreloader();
    const lang = localStorage.getItem('language') || 'en';
    const auth = checkAuth();
    if (!auth.isAuthenticated) {
        showSimpleModal(
            getTranslation('modal_error_title', lang, 'Error'),
            getTranslation('error_not_authenticated', lang, 'Please log in to proceed.'),
            'modal-error'
        );
        setTimeout(() => window.location.assign('../auth/signin.html'), 1500);
        return;
    }

    const modalData = localStorage.getItem('showCartModal');
    if (modalData) {
        const { title, message, type } = JSON.parse(modalData);
        showSimpleModal(title, message, type);
        localStorage.removeItem('showCartModal');
    }

    const orderSuccessModal = localStorage.getItem('showOrderSuccessModal');
    if (orderSuccessModal === 'true') {
        showSuccessModal(
            getTranslation('order_success_message', lang, 'Order Successfully Placed!')
        );
        localStorage.removeItem('showOrderSuccessModal');
    }

    initCart();
    initBurgerMenu(false);
    initLanguageSwitcher('.header-controls .language-selector');
    initLanguageSwitcher('.mobile-menu .language-selector');
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
    updateUserProfile();
    window.addEventListener('languageChanged', () => {
        const newLang = localStorage.getItem('language') || 'en';
        initCart();
        updateLanguage(newLang);
    });
});