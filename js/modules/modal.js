import { translations as catalogTranslations } from './pages-translations/catalog_translations.js';
import { translations as cartTranslations } from './pages-translations/cart_translations.js';
import { translations as accountTranslations } from './pages-translations/account_translations.js';

function getTranslation(translations, key, lang, fallback) {
    return translations[key]?.[lang] || translations[key]?.['en'] || fallback || key;
}

export function showAddToCartModal(product, onAdd, pageType = 'catalog') {
    const modalContainer = document.querySelector('#modal-container');
    if (!modalContainer) {
        console.error('Modal container not found');
        return;
    }

    modalContainer.innerHTML = '';
    const lang = localStorage.getItem('language') || 'en';
    document.body.style.overflow = 'hidden';

    const translations = pageType === 'catalog' ? catalogTranslations : pageType === 'cart' ? cartTranslations : accountTranslations;

    if (!translations.add_to_cart_title || !translations.add_to_cart_title[lang]) {
        console.error(`Translation missing for add_to_cart_title in language ${lang}`);
        showSimpleModal(
            getTranslation(translations, 'error_title', lang, 'Error'),
            'Translation data is missing. Please try again later.',
            'modal-error',
            pageType
        );
        return;
    }

    const colors = Array.isArray(product.colors) ? product.colors : ['Unknown'];
    const sizes = Array.isArray(product.sizes) ? product.sizes : ['M'];

    const translatedColors = colors.map(color => ({
        value: color,
        label: getTranslation(translations, `color_${color.toLowerCase()}`, lang, color)
    }));

    const modalHTML = `
        <div class="modal-overlay">
            <div class="modal-dialog-content add-to-cart-modal">
                <h2 class="modal-title">${getTranslation(translations, 'add_to_cart_title', lang, 'Add {name} to Cart').replace('{name}', product.name)}</h2>
                <form class="product-form add-to-cart-form">
                    <div class="modal-form-group">
                        <label for="color-options">${getTranslation(translations, 'color_label', lang, 'Color')}:</label>
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
                        <label for="size-options">${getTranslation(translations, 'size_label', lang, 'Size')}:</label>
                        <div class="options-container" id="size-options">
                            ${sizes.map((size, index) => `
                                <div class="size-option ${index === 0 ? 'active' : ''}" 
                                     data-value="${size}">${size}</div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="modal-dialog-actions">
                        <button type="button" class="modal-dialog-btn confirm-btn">${getTranslation(translations, 'add_button', lang, 'Add to Cart')}</button>
                        <button type="button" class="modal-dialog-btn cancel-btn">${getTranslation(translations, 'cancel_button', lang, 'Cancel')}</button>
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
            showSuccessModal(
                getTranslation(translations, 'added_to_cart', lang, 'Added to cart!'),
                pageType
            );
        } else {
            showSimpleModal(
                getTranslation(translations, 'error_title', lang, 'Error'),
                getTranslation(translations, 'form_validation_error', lang, 'Please select color and size.'),
                'modal-error',
                pageType
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

export function showSuccessModal(message, pageType = 'catalog', buttons = []) {
    const lang = localStorage.getItem('language') || 'en';
    const translations = pageType === 'catalog' ? catalogTranslations : pageType === 'cart' ? cartTranslations : accountTranslations;
    showSimpleModal(
        getTranslation(translations, 'success_title', lang, 'Success'),
        message,
        'modal-success product-form-modal',
        pageType,
        buttons
    );
    // Add delay to keep success modal visible
    setTimeout(() => closeModal(), 2000);
}

export function showErrorModal(message, pageType = 'catalog', buttons = []) {
    const lang = localStorage.getItem('language') || 'en';
    const translations = pageType === 'catalog' ? catalogTranslations : pageType === 'cart' ? cartTranslations : accountTranslations;
    showSimpleModal(
        getTranslation(translations, 'error_title', lang, 'Error'),
        message,
        'modal-error product-form-modal',
        pageType,
        buttons
    );
}

export function showSimpleModal(title, message, modalClass, pageType = 'catalog', buttons = []) {
    const modalContainer = document.querySelector('#modal-container');
    if (!modalContainer) {
        console.error('Modal container not found');
        return;
    }

    modalContainer.innerHTML = '';
    document.body.style.overflow = 'hidden';
    const lang = localStorage.getItem('language') || 'en';
    const translations = pageType === 'catalog' ? catalogTranslations : pageType === 'cart' ? cartTranslations : accountTranslations;

    const validButtons = Array.isArray(buttons) && buttons.length > 0 ? buttons : [{
        text: getTranslation(translations, 'close', lang, 'Close'),
        class: 'modal-ok-btn modal-dialog-btn',
        action: () => {}
    }];

    const modalHTML = `
        <div class="modal-overlay ${modalClass}">
            <div class="modal-dialog-content">
                <h2 class="modal-title">${title}</h2>
                <p class="modal-message">${message}</p>
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

    function closeModal() {
        modalContent.classList.remove('show');
        setTimeout(() => {
            modalContainer.innerHTML = '';
            document.body.style.overflow = '';
        }, 300);
    }

    modalButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            console.log('Button action called:', validButtons[index].text);
            validButtons[index].action();
            closeModal();
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
        }, 300);
    }
}