export function showAddToCartModal(product, onAdd) {
    const modalContainer = document.querySelector('#modal-container');
    if (!modalContainer) {
        console.error('Modal container not found');
        return;
    }

    document.body.style.overflow = 'hidden';

    const modalHTML = `
        <div class="modal-overlay">
            <div class="modal-content add-to-cart-modal">
                <h2 class="modal-title">Select Options for ${product.name}</h2>
                <form class="add-to-cart-form">
                    <div class="form-group">
                        <label for="color-select">Color:</label>
                        <select id="color-select">
                            ${product.colors.map((color, index) => `
                                <option value="${color}" ${index === 0 ? 'selected' : ''}>${color}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="size-select">Size:</label>
                        <select id="size-select">
                            ${product.sizes.map((size, index) => `
                                <option value="${size}" ${index === 0 ? 'selected' : ''}>${size}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="modal-btn confirm-btn">Add</button>
                        <button type="button" class="modal-btn cancel-btn">Cancel</button>
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

    setTimeout(() => modalContent.classList.add('show'), 10);

    function closeModal() {
        modalContent.classList.remove('show');
        setTimeout(() => {
            modalContainer.innerHTML = '';
            document.body.style.overflow = '';
        }, 300);
    }

    addButton.addEventListener('click', () => {
        const color = modalContainer.querySelector('#color-select').value;
        const size = modalContainer.querySelector('#size-select').value;
        onAdd(color, size);
        closeModal();
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
    showSimpleModal('Success', message, 'modal-success');
}

export function showErrorModal(message) {
    showSimpleModal('Error', message, 'modal-error');
}

export function showSimpleModal(title, message, modalClass, buttons = [{ text: 'OK', class: 'modal-ok-btn', action: () => {} }]) {
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
    if (sessionStorage.getItem('showSuccessModal') === 'true') {
        showSimpleModal('Success', 'Item successfully added to cart!', 'modal-success');
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