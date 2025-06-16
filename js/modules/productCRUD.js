import { showSimpleModal, closeModal } from './modal.js';
import { validateProduct } from './adminValidation.js';
import { getNextAvailableId } from './idManager.js';
import { translations } from './pages-translations/admin_translations.js';

async function fetchProducts() {
    const lang = localStorage.getItem('language') || 'en';
    try {
        const res = await fetch('http://localhost:3000/products');
        if (res.status === 404) {
            window.location.assign('../pages/page_404_error.html');
            return [];
        }
        if (!res.ok) {
            throw new Error(`HTTP error: ${res.status}`);
        }
        return await res.json();
    } catch (error) {
        console.error('Error fetching products:', error);
        showSimpleModal(
            translations.modal_error_title?.[lang] || 'Error',
            translations.error_loading_product?.[lang] || 'Failed to load product',
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
        console.log('Creating product:', newProduct);
        const res = await fetch('http://localhost:3000/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct)
        });
        if (res.status === 404) {
            window.location.assign('../pages/page_404_error.html');
            return null;
        }
        if (!res.ok) {
            throw new Error(`HTTP error: ${res.status}`);
        }
        return await res.json();
    } catch (error) {
        console.error('Error creating product:', error);
        showSimpleModal(
            translations.modal_error_title?.[lang] || 'Error',
            translations.error_adding_product?.[lang] || 'Failed to add product',
            'modal-error'
        );
        throw error;
    }
}

async function updateProduct(id, product) {
    const lang = localStorage.getItem('language') || 'en';
    try {
        console.log('Updating product:', id, product);
        const res = await fetch(`http://localhost:3000/products/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });
        if (res.status === 404) {
            window.location.assign('../pages/page_404_error.html');
            return null;
        }
        if (!res.ok) {
            throw new Error(`HTTP error: ${res.status}`);
        }
        return await res.json();
    } catch (error) {
        console.error('Error updating product:', error);
        showSimpleModal(
            translations.modal_error_title?.[lang] || 'Error',
            translations.error_updating_product?.[lang] || 'Failed to update product',
            'modal-error'
        );
        throw error;
    }
}

async function deleteProduct(id) {
    const lang = localStorage.getItem('language') || 'en';
    try {
        console.log('Deleting product:', id);
        const res = await fetch(`http://localhost:3000/products/${id}`, {
            method: 'DELETE'
        });
        if (res.status === 404) {
            window.location.assign('../pages/page_404_error.html');
            return;
        }
        if (!res.ok) {
            throw new Error(`HTTP error: ${res.status}`);
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        showSimpleModal(
            translations.modal_error_title?.[lang] || 'Error',
            translations.error_delete_product?.[lang] || 'Failed to delete product',
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
            translations.modal_error_title?.[lang] || 'Error',
            translations.error_missing_elements?.[lang] || 'Page elements not found',
            'modal-error'
        );
        return;
    }

    const availableColors = ['purple', 'black', 'white', 'red', 'orange', 'navy', 'brown', 'green', 'yellow', 'grey', 'pink', 'blue'];
    const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXS', 'XXL', '3XL', '4XL'];

    const modalContent = `
        <div class="modal-overlay product-form-modal">
            <div class="modal-dialog-content product-form-modal">
                <h2 class="modal-title">${isEdit ? translations.edit_product_title?.[lang] || 'Edit Product' : translations.add_product_title?.[lang] || 'Add Product'}</h2>
                <div class="product-form-wrapper" id="product-form-wrapper">
                    <label for="name">${translations.product_name_label?.[lang] || 'Name'}:</label>
                    <input type="text" id="name" name="name" class="form-input" placeholder="${translations.product_name_placeholder?.[lang] || 'Enter product name'}" value="${product?.name || ''}" required>
                    <label for="brand">${translations.product_brand_label?.[lang] || 'Brand'}:</label>
                    <input type="text" id="brand" name="brand" class="form-input" placeholder="${translations.product_brand_placeholder?.[lang] || 'Enter brand'}" value="${product?.brand || ''}" required>
                    <label for="price">${translations.product_price_label?.[lang] || 'Price'}:</label>
                    <input type="number" id="price" name="price" class="form-input" placeholder="${translations.product_price_placeholder?.[lang] || 'Enter price'}" min="1" step="0.01" value="${product?.price || ''}" required>
                    <label for="image">${translations.product_image_label?.[lang] || 'Image URL'}:</label>
                    <input type="text" id="image" name="image" class="form-input" placeholder="${translations.product_image_placeholder?.[lang] || 'Enter image URL'}" value="${product?.image || ''}" required>
                    <label for="video">${translations.product_video_label?.[lang] || 'Video URL'}:</label>
                    <input type="text" id="video" name="video" class="form-input" placeholder="${translations.product_video_placeholder?.[lang] || 'Enter video URL'}" value="${product?.video || ''}" required>
                    <label for="description">${translations.product_description_label?.[lang] || 'Description'}:</label>
                    <textarea id="description" name="description" class="form-textarea" placeholder="${translations.product_description_placeholder?.[lang] || 'Enter description'}" required>${product?.description || ''}</textarea>
                    <label for="category">${translations.product_category_label?.[lang] || 'Category'}:</label>
                    <select id="category" name="category" class="form-select" required>
                        <option value="Printed T-Shirts" ${product?.category === 'Printed T-Shirts' ? 'selected' : ''}>${translations.category_printed_tshirts?.[lang] || 'Printed T-Shirts'}</option>
                        <option value="Full Sleeve T-Shirts" ${product?.category === 'Full Sleeve T-Shirts' ? 'selected' : ''}>${translations.category_full_sleeve_tshirts?.[lang] || 'Full Sleeve T-Shirts'}</option>
                        <option value="Tops & T-Shirts" ${product?.category === 'Tops & T-Shirts' ? 'selected' : ''}>${translations.category_tops_tshirts?.[lang] || 'Tops & T-Shirts'}</option>
                        <option value="Plain T-Shirts" ${product?.category === 'Plain T-Shirts' ? 'selected' : ''}>${translations.category_plain_tshirts?.[lang] || 'Plain T-Shirts'}</option>
                        <option value="Kurti" ${product?.category === 'Kurti' ? 'selected' : ''}>${translations.category_kurti?.[lang] || 'Kurti'}</option>
                        <option value="Boxers" ${product?.category === 'Boxers' ? 'selected' : ''}>${translations.category_boxers?.[lang] || 'Boxers'}</option>
                        <option value="Joggers" ${product?.category === 'Joggers' ? 'selected' : ''}>${translations.category_joggers?.[lang] || 'Joggers'}</option>
                        <option value="Pajamas" ${product?.category === 'Pajamas' ? 'selected' : ''}>${translations.category_pajamas?.[lang] || 'Pajamas'}</option>
                        <option value="Jeans" ${product?.category === 'Jeans' ? 'selected' : ''}>${translations.category_jeans?.[lang] || 'Jeans'}</option>
                    </select>
                    <label for="style">${translations.product_style_label?.[lang] || 'Style'}:</label>
                    <select id="style" name="style" class="form-select" required>
                        <option value="Classic" ${product?.style === 'Classic' ? 'selected' : ''}>${translations.style_classic?.[lang] || 'Classic'}</option>
                        <option value="Casual" ${product?.style === 'Casual' ? 'selected' : ''}>${translations.style_casual?.[lang] || 'Casual'}</option>
                        <option value="Formal" ${product?.style === 'Formal' ? 'selected' : ''}>${translations.style_formal?.[lang] || 'Formal'}</option>
                        <option value="Sport" ${product?.style === 'Sport' ? 'selected' : ''}>${translations.style_sport?.[lang] || 'Sport'}</option>
                        <option value="Elegant" ${product?.style === 'Elegant' ? 'selected' : ''}>${translations.style_elegant?.[lang] || 'Elegant'}</option>
                        <option value="Formal Evening" ${product?.style === 'Formal Evening' ? 'selected' : ''}>${translations.style_formal_evening?.[lang] || 'Formal Evening'}</option>
                    </select>
                    <label>${translations.product_colors_label?.[lang] || 'Colors'}:</label>
                    <div class="color-options" id="color-options">
                        ${availableColors.map(color => `
                            <div class="color-option ${product?.colors?.includes(color) ? 'active' : ''}" 
                                 data-color="${color}" 
                                 style="background-color: ${color};"></div>
                        `).join('')}
                    </div>
                    <label>${translations.product_sizes_label?.[lang] || 'Sizes'}:</label>
                    <div class="size-options" id="size-options">
                        ${availableSizes.map(size => `
                            <div class="size-option ${product?.sizes?.includes(size) ? 'active' : ''}" 
                                 data-size="${size}">${size}</div>
                        `).join('')}
                    </div>
                    <label for="fabric">${translations.product_fabric_label?.[lang] || 'Fabric'}:</label>
                    <input type="text" id="fabric" name="fabric" class="form-input" placeholder="${translations.product_fabric_placeholder?.[lang] || 'Enter fabric'}" value="${product?.tableData?.Fabric || ''}" required>
                    <label for="pattern">${translations.product_pattern_label?.[lang] || 'Pattern'}:</label>
                    <input type="text" id="pattern" name="pattern" class="form-input" placeholder="${translations.product_pattern_placeholder?.[lang] || 'Enter pattern'}" value="${product?.tableData?.Pattern || ''}" required>
                    <label for="fit">${translations.product_fit_label?.[lang] || 'Fit'}:</label>
                    <input type="text" id="fit" name="fit" class="form-input" placeholder="${translations.product_fit_placeholder?.[lang] || 'Enter fit'}" value="${product?.tableData?.Fit || ''}" required>
                    <label for="neck">${translations.product_neck_label?.[lang] || 'Neck'}:</label>
                    <input type="text" id="neck" name="neck" class="form-input" placeholder="${translations.product_neck_placeholder?.[lang] || 'Enter neck'}" value="${product?.tableData?.Neck || ''}" required>
                    <label for="sleeve">${translations.product_sleeve_label?.[lang] || 'Sleeve'}:</label>
                    <input type="text" id="sleeve" name="sleeve" class="form-input" placeholder="${translations.product_sleeve_placeholder?.[lang] || 'Enter sleeve'}" value="${product?.tableData?.Sleeve || ''}" required>
                    <div class="modal-dialog-actions">
                        <button type="button" class="modal-dialog-btn confirm-btn" id="save-btn">${isEdit ? translations.update_button?.[lang] || 'Update' : translations.save_button?.[lang] || 'Save'}</button>
                        <button type="button" class="modal-dialog-btn cancel-btn" id="cancel-btn">${translations.cancel_button?.[lang] || 'Cancel'}</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    modalContainer.innerHTML = modalContent;
    const modalContentElement = modalContainer.querySelector('.modal-dialog-content');
    if (!modalContentElement) {
        console.error('Modal dialog content element not found after rendering');
        showSimpleModal(
            translations.modal_error_title?.[lang] || 'Error',
            translations.error_missing_elements?.[lang] || 'Page elements not found',
            'modal-error'
        );
        return;
    }

    setTimeout(() => {
        modalContentElement.classList.add('show');
    }, 10);

    const formWrapper = document.getElementById('product-form-wrapper');
    if (!formWrapper) {
        console.error('Product form wrapper not found');
        showSimpleModal(
            translations.modal_error_title?.[lang] || 'Error',
            translations.error_missing_elements?.[lang] || 'Page elements not found',
            'modal-error'
        );
        return;
    }

    const colorOptions = document.querySelectorAll('#color-options .color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            option.classList.toggle('active');
        });
    });

    const sizeOptions = document.querySelectorAll('#size-options .size-option');
    sizeOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            option.classList.toggle('active');
        });
    });

    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Save button clicked');
            const formData = {
                name: document.getElementById('name')?.value.trim(),
                brand: document.getElementById('brand')?.value.trim(),
                price: parseFloat(document.getElementById('price')?.value),
                image: document.getElementById('image')?.value.trim(),
                video: document.getElementById('video')?.value.trim(),
                description: document.getElementById('description')?.value.trim(),
                category: document.getElementById('category')?.value,
                style: document.getElementById('style')?.value,
                colors: Array.from(document.querySelectorAll('#color-options .color-option.active'))
                    .map(option => option.dataset.color),
                sizes: Array.from(document.querySelectorAll('#size-options .size-option.active'))
                    .map(option => option.dataset.size),
                rating: product?.rating || 0,
                tableData: {
                    Fabric: document.getElementById('fabric')?.value.trim(),
                    Pattern: document.getElementById('pattern')?.value.trim(),
                    Fit: document.getElementById('fit')?.value.trim(),
                    Neck: document.getElementById('neck')?.value.trim(),
                    Sleeve: document.getElementById('sleeve')?.value.trim(),
                    Style: document.getElementById('style')?.value
                }
            };

            if (!validateProduct(formData)) {
                console.log('Validation failed');
                showSimpleModal(
                    translations.modal_error_title?.[lang] || 'Error',
                    translations.error_validation_failed?.[lang] || 'Please fill in all required fields correctly',
                    'modal-error'
                );
                return;
            }

            try {
                console.log('Submitting product:', formData);
                const { isDuplicate, product: updatedProduct } = await handleProductSubmit(formData, isEdit, product?.id);
                
                if (isDuplicate) {
                    showSimpleModal(
                        translations.modal_info_title?.[lang] || 'Info',
                        translations.duplicate_product_updated?.[lang] || 'Duplicate product updated',
                        'modal-success'
                    );
                } else {
                    if (isEdit) {
                        await updateProduct(product.id, formData);
                        showSimpleModal(
                            translations.modal_success_title?.[lang] || 'Success',
                            translations.update_product_success?.[lang] || 'Product updated successfully',
                            'modal-success'
                        );
                    } else {
                        await createProduct(formData);
                        showSimpleModal(
                            translations.modal_success_title?.[lang] || 'Success',
                            translations.add_product_success?.[lang] || 'Product added successfully',
                            'modal-success'
                        );
                    }
                }
                closeModal();
                console.log('Calling callback after save');
                callback();
            } catch (error) {
                console.error(`Error ${isEdit ? 'updating' : 'adding'} product:`, error);
                showSimpleModal(
                    translations.modal_error_title?.[lang] || 'Error',
                    translations[`error_${isEdit ? 'updating' : 'adding'}_product`]?.[lang] || `Failed to ${isEdit ? 'update' : 'add'} product: ${error.message}`,
                    'modal-error'
                );
            }
        });
    } else {
        console.error('Save button not found');
    }

    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Cancel button clicked');
            closeModal();
        });
    } else {
        console.error('Cancel button not found');
    }

    const modalOverlay = modalContainer.querySelector('.modal-overlay');
    setTimeout(() => {
        modalOverlay.addEventListener('click', (e) => {
            if (!modalContentElement.contains(e.target)) {
                closeModal();
            }
        });
    }, 100);
}

export { createProduct, updateProduct, deleteProduct };