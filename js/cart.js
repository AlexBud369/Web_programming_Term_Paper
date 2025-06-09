import { showErrorModal, showSuccessModal, showSimpleModal } from './modules/modal.js';
import { updateCartItemQuantity, removeFromCart, updateCartCount } from './modules/cartOperations.js';
import { validateCheckoutForm } from './modules/formValidation.js';
import { checkAuth, updateUserProfile } from './modules/auth.js';
import { initBurgerMenu } from './modules/burgerMenu.js';
import { initLanguageSwitcher } from './modules/languageSwitcher.js';
import { initThemeSwitcher } from './modules/themeSwitcher.js';
import { translations } from './modules/pages-translations/cart_translations.js';

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
        const lang = localStorage.getItem('language') || 'en';
        showSimpleModal(translations.modal_error_title[lang], translations.error_missing_elements[lang], 'modal-error');
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
            const lang = localStorage.getItem('language') || 'en';
            showSimpleModal(translations.modal_error_title[lang], translations.error_loading_cart[lang], 'modal-error');
            return [];
        }
    }

    async function renderCart(lang = localStorage.getItem('language') || 'en') {
        const cart = await fetchCart();
        if (cart.length === 0) {
            elements.cartItems.innerHTML = `
                <div class="empty-cart">
                    <p data-i18n="cart_empty_message">${translations.cart_empty_message[lang]}</p>
                    <a href="/pages/catalog.html" data-i18n="continue_shopping">${translations.continue_shopping[lang]}</a>
                </div>
            `;
            elements.cartTotal.innerHTML = `
                <div class="total-row">
                    <span data-i18n="cart_subtotal_label">${translations.cart_subtotal_label[lang]}</span>
                    <span id="cart-subtotal">$0.00</span>
                </div>
                <div class="total-row">
                    <span data-i18n="cart_shipping_label">${translations.cart_shipping_label[lang]}</span>
                    <span id="cart-shipping">$0.00</span>
                </div>
                <div class="total-row total">
                    <span data-i18n="cart_total_label">${translations.cart_total_label[lang]}</span>
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
                        <p class="product-color"><span data-i18n="color_label">${translations.color_label[lang]}</span>: ${translations[`color_${item.color.toLowerCase()}`]?.[lang] || item.color}</p>
                        <p class="product-size"><span data-i18n="size_label">${translations.size_label[lang]}</span>: ${item.size}</p>
                    </div>
                </div>
                <div class="cart-column product-price">$${item.price.toFixed(2)}</div>
                <div class="cart-column quantity-control">
                    <button class="quantity-btn decrease" aria-label="${translations.decrease_quantity[lang]}">-</button>
                    <span class="quantity-label">${item.quantity}</span>
                    <button class="quantity-btn increase" aria-label="${translations.increase_quantity[lang]}">+</button>
                </div>
                <div class="cart-column shipping">$${item.shipping?.toFixed(2) || '7.00'}</div>
                <div class="cart-column subtotal">$${(item.price * item.quantity).toFixed(2)}</div>
                <div class="cart-column action">
                    <button class="delete-btn" aria-label="${translations.remove_item[lang].replace('{name}', item.name)}">
                        <img src="../images/home_page/deletecart.svg" alt="${translations.delete[lang]}">
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
            const translation = translations[key]?.[lang];
            if (translation) {
                element.innerHTML = translation;
            } else {
                console.warn(`Translation missing for key "${key}" in language "${lang}"`);
            }
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.dataset.i18nPlaceholder;
            const translation = translations[key]?.[lang];
            if (translation) {
                element.placeholder = translation;
            } else {
                console.warn(`Placeholder translation missing for key "${key}" in language "${lang}"`);
            }
        });

        document.querySelectorAll('.current-language').forEach(element => {
            const translation = translations.lang_current?.[lang] || lang.toUpperCase();
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
                const success = await updateCartItemQuantity(itemId, item.quantity - 1);
                if (success) {
                    localStorage.setItem('showCartModal', JSON.stringify({
                        title: translations.modal_success_title[lang],
                        message: translations.quantity_updated[lang],
                        type: 'modal-success'
                    }));
                    window.location.reload();
                }
            }
        }

        if (e.target.closest('.increase')) {
            const item = (await fetchCart()).find(item => item.id === itemId);
            if (item) {
                const success = await updateCartItemQuantity(itemId, item.quantity + 1);
                if (success) {
                    localStorage.setItem('showCartModal', JSON.stringify({
                        title: translations.modal_success_title[lang],
                        message: translations.quantity_updated[lang],
                        type: 'modal-success'
                    }));
                    window.location.reload();
                }
            }
        }

        if (e.target.closest('.delete-btn')) {
            const success = await removeFromCart(itemId);
            if (success) {
                localStorage.setItem('showCartModal', JSON.stringify({
                    title: translations.modal_success_title[lang],
                    message: translations.item_removed[lang],
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
            showSimpleModal(translations.modal_error_title[lang], translations.error_not_authenticated[lang], 'modal-error');
            setTimeout(() => window.location.assign('../auth/signin.html'), 1500);
            return;
        }

        const isValid = await validateCheckoutForm(elements.checkoutForm);
        if (!isValid) {
            showSimpleModal(translations.modal_error_title[lang], translations.form_validation_error[lang], 'modal-error');
            return;
        }

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

            await renderCart(lang);
            updateCartCount();
        } catch (error) {
            console.error('Error processing order:', error);
            showSimpleModal(translations.modal_error_title[lang], translations.error_place_order[lang], 'modal-error');
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

    const lang = localStorage.getItem('language') || 'en';
    await renderCart(lang);
    updateLanguage(lang);
    updateCartCount();
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('cart.js loaded');
    const lang = localStorage.getItem('language') || 'en';
    const auth = checkAuth();
    if (!auth.isAuthenticated) {
        showSimpleModal(translations.modal_error_title[lang], translations.error_not_authenticated[lang], 'modal-error');
        setTimeout(() => window.location.assign('../auth/signin.html'), 1500);
        return;
    }

    const modalData = localStorage.getItem('showCartModal');
    if (modalData) {
        const { title, message, type } = JSON.parse(modalData);
        showSimpleModal(title, message, type);
        localStorage.removeItem('showCartModal');
    }

    initCart();
    initBurgerMenu(false);
    initLanguageSwitcher('.header-controls .language-selector');
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