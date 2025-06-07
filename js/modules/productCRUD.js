import { showSimpleModal, closeModal } from './modal.js';
import { validateProduct } from './adminValidation.js';
import { getNextAvailableId } from './idManager.js';

async function fetchProducts() {
    try {
        const res = await fetch('http://localhost:3000/products');
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        return await res.json();
    } catch (error) {
        console.error('Error fetching products:', error);
        showSimpleModal('Error', 'Failed to fetch products', 'modal-error');
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
    const products = await fetchProducts();
    const id = await getNextAvailableId(products);
    const newProduct = { id, ...product };
    try {
        const res = await fetch('http://localhost:3000/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct)
        });
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
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
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        return await res.json();
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
}

async function deleteProduct(id) {
    try {
        const res = await fetch(`http://localhost:3000/products/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
}

function showProductForm(product = null, callback) {
    console.log('showProductForm called with product:', product);
    const isEdit = !!product;
    const modalContainer = document.querySelector('#modal-container');
    if (!modalContainer) {
        console.error('Modal container not found');
        showSimpleModal('Error', 'Modal container not found', 'modal-error');
        return;
    }

    const availableColors = ['purple', 'black', 'white', 'red', 'orange', 'navy', 'brown', 'green', 'yellow', 'grey', 'pink', 'blue'];
    const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXS', 'XXL', '3XL', '4XL'];

    const modalContent = `
        <div class="modal-overlay">
            <div class="modal-content product-form-modal">
                <h2 class="modal-title">${isEdit ? 'Edit Product' : 'Add New Product'}</h2>
                <form class="product-form" id="product-form">
                    <div class="form-group">
                        <label for="name">Name:</label>
                        <input type="text" id="name" name="name" class="form-input" placeholder="Product Name" value="${product?.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="brand">Brand:</label>
                        <input type="text" id="brand" name="brand" class="form-input" placeholder="Brand" value="${product?.brand || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="price">Price:</label>
                        <input type="number" id="price" name="price" class="form-input" placeholder="Price" min="1" step="0.01" value="${product?.price || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="image">Image URL (/images/...):</label>
                        <input type="text" id="image" name="image" class="form-input" placeholder="Image URL (/images/...)" value="${product?.image || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="video">Video URL (/videos/...):</label>
                        <input type="text" id="video" name="video" class="form-input" placeholder="Video URL (/videos/...)" value="${product?.video || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="description">Description:</label>
                        <textarea id="description" name="description" class="form-textarea" placeholder="Description" required>${product?.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="category">Category:</label>
                        <select id="category" name="category" class="form-select" required>
                            <option value="Printed T-Shirts" ${product?.category === 'Printed T-Shirts' ? 'selected' : ''}>Printed T-Shirts</option>
                            <option value="Full Sleeve T-Shirts" ${product?.category === 'Full Sleeve T-Shirts' ? 'selected' : ''}>Full Sleeve T-Shirts</option>
                            <option value="Tops & T-Shirts" ${product?.category === 'Tops & T-Shirts' ? 'selected' : ''}>Tops & T-Shirts</option>
                            <option value="Plain T-Shirts" ${product?.category === 'Plain T-Shirts' ? 'selected' : ''}>Plain T-Shirts</option>
                            <option value="Kurti" ${product?.category === 'Kurti' ? 'selected' : ''}>Kurti</option>
                            <option value="Boxers" ${product?.category === 'Boxers' ? 'selected' : ''}>Boxers</option>
                            <option value="Joggers" ${product?.category === 'Joggers' ? 'selected' : ''}>Joggers</option>
                            <option value="Pajamas" ${product?.category === 'Pajamas' ? 'selected' : ''}>Pajamas</option>
                            <option value="Jeans" ${product?.category === 'Jeans' ? 'selected' : ''}>Jeans</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="style">Style:</label>
                        <select id="style" name="style" class="form-select" required>
                            <option value="Classic" ${product?.style === 'Classic' ? 'selected' : ''}>Classic</option>
                            <option value="Casual" ${product?.style === 'Casual' ? 'selected' : ''}>Casual</option>
                            <option value="Formal" ${product?.style === 'Formal' ? 'selected' : ''}>Formal</option>
                            <option value="Sport" ${product?.style === 'Sport' ? 'selected' : ''}>Sport</option>
                            <option value="Elegant" ${product?.style === 'Elegant' ? 'selected' : ''}>Elegant</option>
                            <option value="Formal Evening" ${product?.style === 'Formal Evening' ? 'selected' : ''}>Formal Evening</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Colors:</label>
                        <div class="color-options" id="color-options">
                            ${availableColors.map(color => `
                                <div class="color-option ${product?.colors?.includes(color) ? 'active' : ''}" 
                                     data-color="${color}" 
                                     style="background-color: ${color};"></div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Sizes:</label>
                        <div class="size-options" id="size-options">
                            ${availableSizes.map(size => `
                                <div class="size-option ${product?.sizes?.includes(size) ? 'active' : ''}" 
                                     data-size="${size}">${size}</div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="fabric">Fabric:</label>
                        <input type="text" id="fabric" name="fabric" class="form-input" placeholder="e.g., Cotton, Polyester" value="${product?.tableData?.Fabric || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="pattern">Pattern:</label>
                        <input type="text" id="pattern" name="pattern" class="form-input" placeholder="e.g., Printed, Solid" value="${product?.tableData?.Pattern || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="fit">Fit:</label>
                        <input type="text" id="fit" name="fit" class="form-input" placeholder="e.g., Regular, Slim" value="${product?.tableData?.Fit || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="neck">Neck:</label>
                        <input type="text" id="neck" name="neck" class="form-input" placeholder="e.g., Crew Neck, V-Neck" value="${product?.tableData?.Neck || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="sleeve">Sleeve:</label>
                        <input type="text" id="sleeve" name="sleeve" class="form-input" placeholder="e.g., Short Sleeve, Long Sleeve" value="${product?.tableData?.Sleeve || ''}" required>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="modal-btn confirm-btn">${isEdit ? 'Update' : 'Save'}</button>
                        <button type="button" class="modal-btn cancel-btn" id="cancel-btn">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    modalContainer.innerHTML = modalContent;
    const modalContentElement = modalContainer.querySelector('.modal-content');
    if (!modalContentElement) {
        console.error('Modal content element not found after rendering');
        showSimpleModal('Error', 'Failed to render modal content', 'modal-error');
        return;
    }

    setTimeout(() => modalContentElement.classList.add('show'), 10);

    const form = document.getElementById('product-form');
    if (!form) {
        console.error('Product form not found');
        showSimpleModal('Error', 'Failed to find product form', 'modal-error');
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
                    'Info', 
                    `Product updated: new colors/sizes added to "${updatedProduct.name}"`, 
                    'modal-success'
                );
            } else {
                if (isEdit) {
                    await updateProduct(product.id, productData);
                    showSimpleModal('Success', 'Product updated successfully!', 'modal-success');
                } else {
                    await createProduct(productData);
                    showSimpleModal('Success', 'Product added successfully!', 'modal-success');
                }
            }
            closeModal();
            callback();
        } catch (error) {
            console.error(`Error ${isEdit ? 'updating' : 'adding'} product:`, error);
            showSimpleModal('Error', `Failed to ${isEdit ? 'update' : 'add'} product: ${error.message}`, 'modal-error');
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

export { createProduct, updateProduct, deleteProduct, showProductForm };