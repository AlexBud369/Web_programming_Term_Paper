import { showErrorModal, showSuccessModal, showSimpleModal } from './modules/modal.js';
import { updateCartItemQuantity, removeFromCart, updateCartCount } from './modules/cartOperations.js';
import { validateCheckoutForm } from './modules/formValidation.js';
import { checkAuth, updateUserProfile } from './modules/auth.js';
import { initBurgerMenu } from './modules/burgerMenu.js';
import { initLanguageSwitcher } from './modules/languageSwitcher.js';
import { initThemeSwitcher } from './modules/themeSwitcher.js';
import { translations as cartTranslations } from './modules/pages-translations/cart_translations.js';
import { translations as headerTranslations } from './modules/pages-translations/header_translations.js';
import { translations as footerTranslations } from './modules/pages-translations/footer_translations.js';
import { showPreloader, hidePreloader, initPreloader } from './modules/preloader.js';

function getTranslation(key, lang, fallback) {
    return cartTranslations[key]?.[lang] || cartTranslations[key]?.['en'] || fallback || key;
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
            'modal-error',
            'cart'
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
            if (res.status === 404) {
                console.warn('Cart fetch returned 404, redirecting');
                window.location.assign('../pages/page_404_error.html');
                return [];
            }
            if (!res.ok) throw new Error(`Failed to fetch cart: ${res.status}`);
            return await res.json();
        } catch (error) {
            console.error('Error fetching cart:', error);
            showSimpleModal(
                getTranslation('modal_error_title', lang, 'Error'),
                getTranslation('error_loading_cart', lang, 'Failed to load cart. Please try again.'),
                'modal-error',
                'cart'
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
                    <button type="button" class="quantity-btn decrease" aria-label="${getTranslation('decrease_quantity', lang, 'Decrease quantity')}">-</button>
                    <span class="quantity-label">${item.quantity}</span>
                    <button type="button" class="quantity-btn increase" aria-label="${getTranslation('increase_quantity', lang, 'Increase quantity')}">+</button>
                </div>
                <div class="cart-column shipping">$${item.shipping?.toFixed(2) || '7.00'}</div>
                <div class="cart-column subtotal">$${(item.price * item.quantity).toFixed(2)}</div>
                <div class="cart-column action">
                    <button type="button" class="delete-btn" aria-label="${getTranslation('remove_item', lang, 'Remove {name} from cart').replace('{name}', item.name)}">
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
        e.preventDefault();
        e.stopPropagation();
        console.log('Cart items click:', e.target);

        const cartItem = e.target.closest('.cart-item');
        if (!cartItem) return;
        const itemId = parseInt(cartItem.dataset.id);
        if (!itemId) return;

        const lang = localStorage.getItem('language') || 'en';

        const button = e.target.closest('button');
        if (button) {
            const form = button.closest('form');
            if (form) {
                form.addEventListener('submit', (submitEvent) => {
                    submitEvent.preventDefault();
                    console.log('Prevented form submission for button:', button);
                });
            }
        }

        if (e.target.closest('.decrease')) {
            console.log('Decrease button clicked, itemId:', itemId);
            const item = (await fetchCart()).find(item => item.id === itemId);
            if (item) {
                sessionStorage.setItem('cartModal', JSON.stringify({
                    type: 'success',
                    message: getTranslation('quantity_updated', lang, 'Quantity updated successfully!'),
                    pageType: 'cart'
                }));
                showPreloader();
                const success = await updateCartItemQuantity(itemId, item.quantity - 1);
                hidePreloader();
                if (success) {
                    sessionStorage.removeItem('cartModal');
                    showSuccessModal(getTranslation('quantity_updated', lang, 'Quantity updated successfully!'), 'cart');
                    await renderCart(lang);
                    updateCartCount();
                }
            }
        }

        if (e.target.closest('.increase')) {
            console.log('Increase button clicked, itemId:', itemId);
            const item = (await fetchCart()).find(item => item.id === itemId);
            if (item) {
                sessionStorage.setItem('cartModal', JSON.stringify({
                    type: 'success',
                    message: getTranslation('quantity_updated', lang, 'Quantity updated successfully!'),
                    pageType: 'cart'
                }));
                showPreloader();
                const success = await updateCartItemQuantity(itemId, item.quantity + 1);
                hidePreloader();
                if (success) {
                    sessionStorage.removeItem('cartModal');
                    showSuccessModal(getTranslation('quantity_updated', lang, 'Quantity updated successfully!'), 'cart');
                    await renderCart(lang);
                    updateCartCount();
                }
            }
        }

        if (e.target.closest('.delete-btn')) {
            console.log('Delete button clicked, itemId:', itemId);
            sessionStorage.setItem('cartModal', JSON.stringify({
                type: 'success',
                message: getTranslation('item_removed', lang, 'Item removed from cart!'),
                pageType: 'cart'
            }));
            showPreloader();
            const success = await removeFromCart(itemId);
            hidePreloader();
            if (success) {
                sessionStorage.removeItem('cartModal');
                showSuccessModal(getTranslation('item_removed', lang, 'Item removed from cart!'), 'cart');
                await renderCart(lang);
                updateCartCount();
            }
        }
    });

    elements.checkoutForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Checkout form submitted');
        const lang = localStorage.getItem('language') || 'en';
        const auth = checkAuth();
        if (!auth.isAuthenticated) {
            showSimpleModal(
                getTranslation('modal_error_title', lang, 'Error'),
                getTranslation('error_not_authenticated', lang, 'Please log in to proceed.'),
                'modal-error',
                'cart'
            );
            setTimeout(() => window.location.assign('../auth/signin.html'), 1500);
            return;
        }

        const cart = await fetchCart();
        if (cart.length === 0) {
            showSimpleModal(
                getTranslation('modal_error_title', lang, 'Error'),
                getTranslation('cart_empty_message', lang, 'Your cart is empty.'),
                'modal-error',
                'cart'
            );
            return;
        }

        const isValid = await validateCheckoutForm(elements.checkoutForm);
        if (!isValid) {
            showSimpleModal(
                getTranslation('modal_error_title', lang, 'Error'),
                getTranslation('form_validation_error', lang, 'Please fill out the form correctly.'),
                'modal-error',
                'cart'
            );
            return;
        }

        try {
            showPreloader();
            for (const item of cart) {
                const res = await fetch(`http://localhost:3000/cart/${item.id}`, { method: 'DELETE' });
                if (res.status === 404) {
                    console.warn('Delete cart item returned 404, redirecting');
                    window.location.assign('../pages/page_404_error.html');
                    return;
                }
                if (!res.ok) throw new Error(`Failed to delete item ${item.id}`);
            }
            showSuccessModal(getTranslation('order_success_message', lang, 'Order Successfully Placed!'), 'cart');
            await renderCart(lang);
            updateCartCount();
        } catch (error) {
            console.error('Error processing order:', error);
            showSimpleModal(
                getTranslation('modal_error_title', lang, 'Error'),
                getTranslation('error_place_order', lang, 'Failed to place order. Please try again.'),
                'modal-error',
                'cart'
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
    localStorage.removeItem('showCartModal');
    localStorage.removeItem('showOrderSuccessModal');

    const pendingModal = sessionStorage.getItem('cartModal');
    if (pendingModal) {
        const { type, message, pageType } = JSON.parse(pendingModal);
        if (type === 'success') {
            showSuccessModal(message, pageType);
        } else if (type === 'error') {
            showErrorModal(message, pageType);
        }
        sessionStorage.removeItem('cartModal');
    }

    const lang = localStorage.getItem('language') || 'en';
    const auth = checkAuth();
    if (!auth.isAuthenticated) {
        showSimpleModal(
            getTranslation('modal_error_title', lang, 'Error'),
            getTranslation('error_not_authenticated', lang, 'Please log in to proceed.'),
            'modal-error',
            'cart'
        );
        setTimeout(() => window.location.assign('../auth/signin.html'), 1500);
        return;
    }

    initCart();
    initBurgerMenu(false, false, false, headerTranslations);
    initLanguageSwitcher('.header-controls .language-selector, .mobile-menu .language-selector', { ...cartTranslations, ...headerTranslations, ...footerTranslations });
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