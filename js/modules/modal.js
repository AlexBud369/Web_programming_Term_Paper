import { translations as modalTranslations } from './pages-translations/modal_translations.js';

function getTranslation(key, lang, fallback, params = {}) {
    if (!key) {
        console.warn('Translation key is undefined, using fallback:', fallback);
        return fallback || 'Unknown';
    }
    let text = modalTranslations[key]?.[lang] || modalTranslations[key]?.['en'] || fallback || key;
    if (text === key) {
        console.warn(`Translation not found for key: ${key}, lang: ${lang}, using key as fallback`);
    }
    Object.keys(params).forEach(param => {
        text = text.replace(`{${param}}`, params[param]);
    });
    return text;
}

export function showAddToCartModal(product, onAdd) {
    const modalContainer = document.querySelector('#modal-container');
    if (!modalContainer) {
        console.error('Modal container not found');
        return;
    }

    modalContainer.innerHTML = '';
    const lang = localStorage.getItem('language') || 'en';
    document.body.style.overflow = 'hidden';

    const colors = Array.isArray(product.colors) ? product.colors : ['Unknown'];
    const sizes = Array.isArray(product.sizes) ? product.sizes : ['M'];

    const translatedColors = colors.map(color => ({
        value: color,
        label: getTranslation(`color_${color.toLowerCase()}`, lang, color)
    }));

    const modalHTML = `
        <div class="modal-overlay">
            <div class="modal-dialog-content add-to-cart-modal">
                <h2 class="modal-title">${getTranslation('add_to_cart_title', lang, 'Add {name} to Cart', { name: product.name })}</h2>
                <form class="product-form add-to-cart-form">
                    <div class="modal-form-group">
                        <label for="color-options">${getTranslation('color_label', lang, 'Color')}</label>
                        <div class="options-container" id="color-options">
                            ${translatedColors.map((color, index) => `
                                <div class="color-option ${index === 0 ? 'active' : ''}" 
                                     data-value="${color.value}" 
                                     style="background-color: ${color.value.toLowerCase()};"
                                     aria-label="${color.label}"></div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="modal-form-group">
                        <label for="size-options">${getTranslation('size_label', lang, 'Size')}</label>
                        <div class="options-container" id="size-options">
                            ${sizes.map((size, index) => `
                                <div class="size-option ${index === 0 ? 'active' : ''}" 
                                     data-value="${size}">${size}</div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="modal-dialog-actions">
                        <button type="button" class="modal-dialog-btn confirm-btn">${getTranslation('add_button', lang, 'Add to Cart')}</button>
                        <button type="button" class="modal-dialog-btn cancel-btn">${getTranslation('cancel_button', lang, 'Cancel')}</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    modalContainer.innerHTML = modalHTML;

    const modalOverlay = modalContainer.querySelector('.modal-overlay');
    const modalContent = modalContainer.querySelector('.modal-dialog-content');
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
            console.log('Calling onAdd with:', { selectedColor, selectedSize });
            onAdd(selectedColor, selectedSize);
            closeModal();
        } else {
            showSimpleModal(
                getTranslation('error_title', lang, 'Error'),
                getTranslation('form_validation_error', lang, 'Please select color and size.'),
                'modal-error',
                null,
                lang
            );
        }
    });

    cancelButton.addEventListener('click', closeModal);

    modalOverlay.addEventListener('click', (e) => {
        if (!modalContent.contains(e.target)) {
            closeModal();
        }
    });
}

export function showSuccessModal(messageKey, lang = localStorage.getItem('language') || 'en', params = {}, onClose = null) {
    showSimpleModal(
        getTranslation('success_title', lang, 'Success'),
        getTranslation(messageKey, lang, messageKey, params),
        'modal-success product-form-modal',
        null,
        lang,
        params,
        onClose
    );
}

export function showErrorModal(messageKey, lang = localStorage.getItem('language') || 'en', params = {}, onClose = null) {
    showSimpleModal(
        getTranslation('error_title', lang, 'Error'),
        getTranslation(messageKey, lang, messageKey, params),
        'modal-error product-form-modal',
        null,
        lang,
        params,
        onClose
    );
}

export function showSimpleModal(titleKey, messageKey, modalClass, buttons = null, lang = localStorage.getItem('language') || 'en', params = {}, onClose = null) {
    console.log('showSimpleModal called with:', { titleKey, messageKey, modalClass, lang, params });
    const modalContainer = document.querySelector('#modal-container');
    if (!modalContainer) {
        console.error('Modal container not found');
        return;
    }

    modalContainer.innerHTML = '';
    document.body.style.overflow = 'hidden';

    if (!['en', 'ru'].includes(lang)) {
        console.warn(`Invalid language: ${lang}, defaulting to 'en'`);
        lang = 'en';
    }

    const validButtons = buttons || [{
        text: getTranslation('close', lang, 'Close'),
        class: 'modal-ok-btn modal-dialog-btn',
        action: () => closeModal()
    }];

    const modalHTML = `
        <div class="modal-overlay ${modalClass}">
            <div class="modal-dialog-content">
                <h2 class="modal-title">${getTranslation(titleKey, lang, titleKey, params)}</h2>
                <p class="modal-message">${getTranslation(messageKey, lang, messageKey, params)}</p>
                <div class="modal-dialog-actions">
                    ${validButtons.map(btn => `<button class="modal-dialog-btn ${btn.class}" type="button">${btn.text}</button>`).join('')}
                </div>
            </div>
        </div>
    `;

    modalContainer.innerHTML = modalHTML;

    const modalOverlay = modalContainer.querySelector('.modal-overlay');
    const modalContent = modalContainer.querySelector('.modal-dialog-content');
    const modalButtons = modalContainer.querySelectorAll('.modal-dialog-btn');

    setTimeout(() => modalContent.classList.add('show'), 10);
    setTimeout(() => closeModal(), 3000);

    function closeModal() {
        modalContent.classList.remove('show');
        setTimeout(() => {
            modalContainer.innerHTML = '';
            document.body.style.overflow = '';
            sessionStorage.removeItem('showSuccessModal');
            if (onClose) {
                onClose();
            }
        }, 300);
    }

    modalButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            if (validButtons[index].action) {
                validButtons[index].action();
            }
            if (!validButtons[index].action.toString().includes('closeModal')) {
                closeModal();
            }
        });
    });

    modalOverlay.addEventListener('click', (e) => {
        if (!modalContent.contains(e.target)) {
            closeModal();
        }
    });
}

export function closeModal() {
    const modalContainer = document.querySelector('#modal-container');
    const modalContent = modalContainer.querySelector('.modal-dialog-content');
    if (modalContent) {
        modalContent.classList.remove('show');
        setTimeout(() => {
            modalContainer.innerHTML = '';
            document.body.style.overflow = '';
            sessionStorage.removeItem('showSuccessModal');
        }, 300);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const successModalData = sessionStorage.getItem('showSuccessModal');
    if (successModalData) {
        try {
            const { messageKey, params } = JSON.parse(successModalData);
            const lang = localStorage.getItem('language') || 'en';
            showSuccessModal(messageKey, lang, params);
        } catch (error) {
            console.error('Error parsing showSuccessModal data:', error);
        }
        sessionStorage.removeItem('showSuccessModal');
    }
});