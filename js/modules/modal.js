import { translations as cartTranslations } from './pages-translations/cart_translations.js';
import { translations as adminTranslations } from './pages-translations/admin_translations.js';

function getTranslation(translations, key, lang, fallback) {
    return translations[key]?.[lang] || fallback || key;
}

export function showAddToCartModal(product, onAdd) {
    const modalContainer = document.querySelector('#modal-container');
    if (!modalContainer) {
        console.error('Modal container not found');
        return;
    }

    const lang = localStorage.getItem('language') || 'en';
    document.body.style.overflow = 'hidden';

    if (!cartTranslations.add_to_cart_title || !cartTranslations.add_to_cart_title[lang]) {
        console.error(`Translation missing for add_to_cart_title in language ${lang}`);
        showSimpleModal(
            getTranslation(adminTranslations, 'modal_error_title', lang, 'Error'),
            'Translation data is missing. Please try again later.',
            'modal-error'
        );
        return;
    }

    const colors = Array.isArray(product.colors) ? product.colors : ['Unknown'];
    const sizes = Array.isArray(product.sizes) ? product.sizes : ['M'];

    const translatedColors = colors.map(color => ({
        value: color,
        label: getTranslation(cartTranslations, `color_${color.toLowerCase()}`, lang, color)
    }));

    const modalHTML = `
        <div class="modal-overlay">
            <div class="modal-content add-to-cart-modal">
                <h2 class="modal-title">${getTranslation(cartTranslations, 'add_to_cart_title', lang, 'Add {name} to Cart').replace('{name}', product.name)}</h2>
                <form class="product-form add-to-cart-form">
                    <div class="form-group">
                        <label for="color-options">${getTranslation(cartTranslations, 'color_label', lang, 'Color')}:</label>
                        <div class="options-container" id="color-options">
                            ${translatedColors.map((color, index) => `
                                <div class="color-option ${index === 0 ? 'active' : ''}" 
                                     data-value="${color.value}" 
                                     style="background-color: ${color.value.toLowerCase()};"
                                     aria-label="${color.label}"></div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="size-options">${getTranslation(cartTranslations, 'size_label', lang, 'Size')}:</label>
                        <div class="options-container" id="size-options">
                            ${sizes.map((size, index) => `
                                <div class="size-option ${index === 0 ? 'active' : ''}" 
                                     data-value="${size}">${size}</div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="modal-btn confirm-btn">${getTranslation(cartTranslations, 'add_button', lang, 'Add to Cart')}</button>
                        <button type="button" class="modal-btn cancel-btn">${getTranslation(cartTranslations, 'cancel_button', lang, 'Cancel')}</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    modalContainer.innerHTML = modalHTML;

    const modalOverlay = modalContainer.querySelector('.modal-overlay');
    const modalContent = modalContainer.querySelector('.modal-content');
    const addButton = modalContainer.querySelector('.confirm-btn');
    const cancelButton = modalContainer.querySelector('.cancel-btn');
    const colorOptions = modalContainer.querySelectorAll('.color-option');
    const sizeOptions = modalContainer.querySelectorAll('.size-option');

    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            colorOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
        });
    });

    sizeOptions.forEach(option => {
        option.addEventListener('click', () => {
            sizeOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
        });
    });

    setTimeout(() => modalContent.classList.add('show'), 10);

    function closeModal() {
        modalContent.classList.remove('show');
        setTimeout(() => {
            modalContainer.innerHTML = '';
            document.body.style.overflow = '';
        }, 300);
    }

    addButton.addEventListener('click', () => {
        const selectedColor = modalContainer.querySelector('.color-option.active')?.dataset.value;
        const selectedSize = modalContainer.querySelector('.size-option.active')?.dataset.value;
        if (selectedColor && selectedSize) {
            onAdd(selectedColor, selectedSize);
            closeModal();
        } else {
            showSimpleModal(
                getTranslation(adminTranslations, 'modal_error_title', lang, 'Error'),
                getTranslation(cartTranslations, 'form_validation_error', lang, 'Please select color and size.'),
                'modal-error'
            );
        }
    });

    cancelButton.addEventListener('click', closeModal);

    setTimeout(() => {
        modalOverlay.addEventListener('click', (e) => {
            if (!modalContent.contains(e.target)) {
                closeModal();
            }
        });
    }, 100);
}

export function showSuccessModal(message) {
    const lang = localStorage.getItem('language') || 'en';
    showSimpleModal(
        getTranslation(adminTranslations, 'modal_success_title', lang, 'Success'),
        message,
        'modal-success'
    );
}

export function showErrorModal(message) {
    const lang = localStorage.getItem('language') || 'en';
    showSimpleModal(
        getTranslation(adminTranslations, 'modal_error_title', lang, 'Error'),
        message,
        'modal-error'
    );
}

export function showSimpleModal(title, message, modalClass, buttons = [{ text: getTranslation(adminTranslations, 'ok_button', localStorage.getItem('language') || 'en', 'OK'), class: 'modal-ok-btn', action: () => {} }]) {
    const modalContainer = document.querySelector('#modal-container');
    if (!modalContainer) {
        console.error('Modal container not found');
        return;
    }

    document.body.style.overflow = 'hidden';

    const modalHTML = `
        <div class="modal-overlay ${modalClass}">
            <div class="modal-content">
                <h2 class="modal-title">${title}</h2>
                <p class="modal-message">${message}</p>
                <div class="modal-actions">
                    ${buttons.map(btn => `<button class="modal-btn ${btn.class}">${btn.text}</button>`).join('')}
                </div>
            </div>
        </div>
    `;

    modalContainer.innerHTML = modalHTML;

    const modalOverlay = modalContainer.querySelector('.modal-overlay');
    const modalContent = modalContainer.querySelector('.modal-content');
    const modalButtons = modalContainer.querySelectorAll('.modal-btn');

    setTimeout(() => modalContent.classList.add('show'), 10);

    function closeModal() {
        modalContent.classList.remove('show');
        setTimeout(() => {
            modalContainer.innerHTML = '';
            document.body.style.overflow = '';
        }, 300);
    }

    modalButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            buttons[index].action();
            closeModal();
        });
    });

    setTimeout(() => {
        modalOverlay.addEventListener('click', (e) => {
            if (!modalContent.contains(e.target)) {
                closeModal();
            }
        });
    }, 100);
}

export function showSuccessModalAfterReload() {
    const lang = localStorage.getItem('language') || 'en';
    if (sessionStorage.getItem('showSuccessModal') === 'true') {
        if (!cartTranslations.item_added_to_cart || !cartTranslations.item_added_to_cart[lang]) {
            console.error(`Translation missing for item_added_to_cart in language ${lang}`);
            showSimpleModal(
                getTranslation(adminTranslations, 'modal_error_title', lang, 'Error'),
                'Translation data is missing. Please try again later.',
                'modal-error'
            );
        } else {
            showSimpleModal(
                getTranslation(adminTranslations, 'modal_success_title', lang, 'Success'),
                cartTranslations.item_added_to_cart[lang],
                'modal-success'
            );
        }
        sessionStorage.removeItem('showSuccessModal');
    }
}

export function closeModal() {
    const modalContainer = document.querySelector('#modal-container');
    const modalContent = modalContainer.querySelector('.modal-content');
    if (modalContent) {
        modalContent.classList.remove('show');
        setTimeout(() => {
            modalContainer.innerHTML = '';
            document.body.style.overflow = '';
        }, 300);
    }
}