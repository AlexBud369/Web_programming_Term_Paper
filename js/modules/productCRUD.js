import { showSimpleModal, closeModal } from './modal.js';
import { validateProduct } from './adminValidation.js';
import { getNextAvailableId } from './idManager.js';
import { translations } from './pages-translations/admin_translations.js';

async function fetchProducts() {
    const lang = localStorage.getItem('language') || 'en';
    try {
        const res = await fetch('http://localhost:3000/products');
        if (!res.ok) {
            throw new Error(`HTTP error: ${res.status}`);
        }
        return await res.json();
    } catch (error) {
        console.error('Error fetching products:', error);
        showSimpleModal(
            translations.modal_error_title[lang],
            translations.error_loading_product[lang],
            'modal-error'
        );
        throw error;
    }
}

async function isDuplicateProduct(productData, excludeId = null) {
    const products = await fetchProducts();
    return products.some(product => 
        product.id !== excludeId &&
        product.name === productData.name &&
        product.brand === productData.brand &&
        product.category === productData.category
    );
}

async function handleProductSubmit(productData, isEditMode, productId) {
    const lang = localStorage.getItem('language') || 'en';
    if (await isDuplicateProduct(productData, isEditMode ? productId : null)) {
        const products = await fetchProducts();
        const existingProduct = products.find(p => 
            p.name === productData.name && 
            p.brand === productData.brand &&
            p.category === productData.category
        );
        
        const updatedProduct = {
            ...existingProduct,
            colors: [...new Set([...existingProduct.colors, ...productData.colors])],
            sizes: [...new Set([...existingProduct.sizes, ...productData.sizes])],
            price: productData.price,
            image: productData.image,
            video: productData.video,
            description: productData.description,
            style: productData.style,
            tableData: {
                ...existingProduct.tableData,
                Fabric: productData.tableData.Fabric,
                Pattern: productData.tableData.Pattern,
                Fit: productData.tableData.Fit,
                Neck: productData.tableData.Neck,
                Sleeve: productData.tableData.Sleeve,
                Style: productData.style
            }
        };
        
        await updateProduct(existingProduct.id, updatedProduct);
        return { isDuplicate: true, product: updatedProduct };
    }
    return { isDuplicate: false };
}

async function createProduct(product) {
    const lang = localStorage.getItem('language') || 'en';
    const products = await fetchProducts();
    const id = await getNextAvailableId(products);
    const newProduct = { id, ...product };
    try {
        const res = await fetch('http://localhost:3000/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct)
        });
        if (!res.ok) {
            throw new Error(`HTTP error: ${res.status}`);
        }
        return await res.json();
    } catch (error) {
        console.error('Error creating product:', error);
        throw error;
    }
}

async function updateProduct(id, product) {
    try {
        const res = await fetch(`http://localhost:3000/products/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });
        if (!res.ok) {
            throw new Error(`HTTP error: ${res.status}`);
        }
        return await res.json();
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
}

async function deleteProduct(id) {
    const lang = localStorage.getItem('language') || 'en';
    try {
        const res = await fetch(`http://localhost:3000/products/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) {
            throw new Error(`HTTP error: ${res.status}`);
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        showSimpleModal(
            translations.modal_error_title[lang],
            translations.error_delete_product[lang],
            'modal-error'
        );
        throw error;
    }
}

export function showProductForm(product = null, callback) {
    console.log('showProductForm called with product:', product);
    const lang = localStorage.getItem('language') || 'en';
    const isEdit = !!product;
    const modalContainer = document.querySelector('#modal-container');
    if (!modalContainer) {
        console.error('Modal container not found');
        showSimpleModal(
            translations.modal_error_title[lang],
            translations.error_missing_elements[lang],
            'modal-error'
        );
        return;
    }

    const availableColors = ['purple', 'black', 'white', 'red', 'orange', 'navy', 'brown', 'green', 'yellow', 'grey', 'pink', 'blue'];
    const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXS', 'XXL', '3XL', '4XL'];

    const modalContent = `
        <div class="modal-overlay">
            <div class="modal-content product-form-modal">
                <h2 class="modal-title">${isEdit ? translations.edit_product_title[lang] : translations.add_product_title[lang]}</h2>
                <form class="product-form" id="product-form">
                    <div class="form-group">
                        <label for="name">${translations.product_name_label[lang]}:</label>
                        <input type="text" id="name" name="name" class="form-input" placeholder="${translations.product_name_placeholder[lang]}" value="${product?.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="brand">${translations.product_brand_label[lang]}:</label>
                        <input type="text" id="brand" name="brand" class="form-input" placeholder="${translations.product_brand_placeholder[lang]}" value="${product?.brand || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="price">${translations.product_price_label[lang]}:</label>
                        <input type="number" id="price" name="price" class="form-input" placeholder="${translations.product_price_placeholder[lang]}" min="1" step="0.01" value="${product?.price || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="image">${translations.product_image_label[lang]}:</label>
                        <input type="text" id="image" name="image" class="form-input" placeholder="${translations.product_image_placeholder[lang]}" value="${product?.image || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="video">${translations.product_video_label[lang]}:</label>
                        <input type="text" id="video" name="video" class="form-input" placeholder="${translations.product_video_placeholder[lang]}" value="${product?.video || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="description">${translations.product_description_label[lang]}:</label>
                        <textarea id="description" name="description" class="form-textarea" placeholder="${translations.product_description_placeholder[lang]}" required>${product?.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="category">${translations.product_category_label[lang]}:</label>
                        <select id="category" name="category" class="form-select" required>
                            <option value="Printed T-Shirts" ${product?.category === 'Printed T-Shirts' ? 'selected' : ''}>${translations.category_printed_tshirts[lang]}</option>
                            <option value="Full Sleeve T-Shirts" ${product?.category === 'Full Sleeve T-Shirts' ? 'selected' : ''}>${translations.category_full_sleeve_tshirts[lang]}</option>
                            <option value="Tops & T-Shirts" ${product?.category === 'Tops & T-Shirts' ? 'selected' : ''}>${translations.category_tops_tshirts[lang]}</option>
                            <option value="Plain T-Shirts" ${product?.category === 'Plain T-Shirts' ? 'selected' : ''}>${translations.category_plain_tshirts[lang]}</option>
                            <option value="Kurti" ${product?.category === 'Kurti' ? 'selected' : ''}>${translations.category_kurti[lang]}</option>
                            <option value="Boxers" ${product?.category === 'Boxers' ? 'selected' : ''}>${translations.category_boxers[lang]}</option>
                            <option value="Joggers" ${product?.category === 'Joggers' ? 'selected' : ''}>${translations.category_joggers[lang]}</option>
                            <option value="Pajamas" ${product?.category === 'Pajamas' ? 'selected' : ''}>${translations.category_pajamas[lang]}</option>
                            <option value="Jeans" ${product?.category === 'Jeans' ? 'selected' : ''}>${translations.category_jeans[lang]}</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="style">${translations.product_style_label[lang]}:</label>
                        <select id="style" name="style" class="form-select" required>
                            <option value="Classic" ${product?.style === 'Classic' ? 'selected' : ''}>${translations.style_classic[lang]}</option>
                            <option value="Casual" ${product?.style === 'Casual' ? 'selected' : ''}>${translations.style_casual[lang]}</option>
                            <option value="Formal" ${product?.style === 'Formal' ? 'selected' : ''}>${translations.style_formal[lang]}</option>
                            <option value="Sport" ${product?.style === 'Sport' ? 'selected' : ''}>${translations.style_sport[lang]}</option>
                            <option value="Elegant" ${product?.style === 'Elegant' ? 'selected' : ''}>${translations.style_elegant[lang]}</option>
                            <option value="Formal Evening" ${product?.style === 'Formal Evening' ? 'selected' : ''}>${translations.style_formal_evening[lang]}</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>${translations.product_colors_label[lang]}:</label>
                        <div class="color-options" id="color-options">
                            ${availableColors.map(color => `
                                <div class="color-option ${product?.colors?.includes(color) ? 'active' : ''}" 
                                     data-color="${color}" 
                                     style="background-color: ${color};"></div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="form-group">
                        <label>${translations.product_sizes_label[lang]}:</label>
                        <div class="size-options" id="size-options">
                            ${availableSizes.map(size => `
                                <div class="size-option ${product?.sizes?.includes(size) ? 'active' : ''}" 
                                     data-size="${size}">${size}</div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="fabric">${translations.product_fabric_label[lang]}:</label>
                        <input type="text" id="fabric" name="fabric" class="form-input" placeholder="${translations.product_fabric_placeholder[lang]}" value="${product?.tableData?.Fabric || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="pattern">${translations.product_pattern_label[lang]}:</label>
                        <input type="text" id="pattern" name="pattern" class="form-input" placeholder="${translations.product_pattern_placeholder[lang]}" value="${product?.tableData?.Pattern || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="fit">${translations.product_fit_label[lang]}:</label>
                        <input type="text" id="fit" name="fit" class="form-input" placeholder="${translations.product_fit_placeholder[lang]}" value="${product?.tableData?.Fit || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="neck">${translations.product_neck_label[lang]}:</label>
                        <input type="text" id="neck" name="neck" class="form-input" placeholder="${translations.product_neck_placeholder[lang]}" value="${product?.tableData?.Neck || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="sleeve">${translations.product_sleeve_label[lang]}:</label>
                        <input type="text" id="sleeve" name="sleeve" class="form-input" placeholder="${translations.product_sleeve_placeholder[lang]}" value="${product?.tableData?.Sleeve || ''}" required>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="modal-btn confirm-btn">${isEdit ? translations.update_button[lang] : translations.save_button[lang]}</button>
                        <button type="button" class="modal-btn cancel-btn" id="cancel-btn">${translations.cancel_button[lang]}</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    modalContainer.innerHTML = modalContent;
    const modalContentElement = modalContainer.querySelector('.modal-content');
    if (!modalContentElement) {
        console.error('Modal content element not found after rendering');
        showSimpleModal(
            translations.modal_error_title[lang],
            translations.error_missing_elements[lang],
            'modal-error'
        );
        return;
    }

    setTimeout(() => {
        modalContentElement.classList.add('show');
    }, 10);

    const form = document.getElementById('product-form');
    if (!form) {
        console.error('Product form not found');
        showSimpleModal(
            translations.modal_error_title[lang],
            translations.error_missing_elements[lang],
            'modal-error'
        );
        return;
    }

    const colorOptions = document.querySelectorAll('#color-options .color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            option.classList.toggle('active');
        });
    });

    const sizeOptions = document.querySelectorAll('#size-options .size-option');
    sizeOptions.forEach(option => {
        option.addEventListener('click', () => {
            option.classList.toggle('active');
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submitted');
        const formData = new FormData(form);
        const selectedColors = Array.from(document.querySelectorAll('#color-options .color-option.active'))
            .map(option => option.dataset.color);
        const selectedSizes = Array.from(document.querySelectorAll('#size-options .size-option.active'))
            .map(option => option.dataset.size);

        const productData = {
            name: formData.get('name').trim(),
            brand: formData.get('brand').trim(),
            price: parseFloat(formData.get('price')),
            image: formData.get('image').trim(),
            video: formData.get('video').trim(),
            description: formData.get('description').trim(),
            category: formData.get('category'),
            style: formData.get('style'),
            colors: selectedColors,
            sizes: selectedSizes,
            rating: product?.rating || 0,
            tableData: {
                Fabric: formData.get('fabric').trim(),
                Pattern: formData.get('pattern').trim(),
                Fit: formData.get('fit').trim(),
                Neck: formData.get('neck').trim(),
                Sleeve: formData.get('sleeve').trim(),
                Style: formData.get('style')
            }
        };

        if (!validateProduct(productData)) {
            console.log('Validation failed');
            return;
        }

        try {
            const { isDuplicate, product: updatedProduct } = await handleProductSubmit(productData, isEdit, product?.id);
            
            if (isDuplicate) {
                showSimpleModal(
                    translations.modal_info_title[lang], 
                    translations.duplicate_product_updated[lang], 
                    'modal-success'
                );
            } else {
                if (isEdit) {
                    await updateProduct(product.id, productData);
                    showSimpleModal(
                        translations.modal_success_title[lang],
                        translations.update_product_success[lang],
                        'modal-success'
                    );
                } else {
                    await createProduct(productData);
                    showSimpleModal(
                        translations.modal_success_title[lang],
                        translations.add_product_success[lang],
                        'modal-success'
                    );
                }
            }
            closeModal();
            callback();
        } catch (error) {
            console.error(`Error ${isEdit ? 'updating' : 'adding'} product:`, error);
            showSimpleModal(
                translations.modal_error_title[lang],
                translations[`error_${isEdit ? 'updating' : 'adding'}_product`][lang] + ` ${error.message}`,
                'modal-error'
            );
        }
    });

    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            console.log('Cancel button clicked');
            closeModal();
        });
    } else {
        console.error('Cancel button not found');
    }
}

export { createProduct, updateProduct, deleteProduct};