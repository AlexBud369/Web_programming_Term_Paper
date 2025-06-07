import { showSimpleModal } from './modal.js';

function validateProduct(product) {
    const errors = [];

    if (!product.name) errors.push('Name is required');
    if (!product.brand) errors.push('Brand is required');
    if (!product.price || isNaN(product.price) || product.price <= 1) errors.push('Price must be a number greater than 1');
    if (!product.image || !product.image.startsWith('/images/')) errors.push('Image URL must start with /images/');
    if (!product.video || !product.video.startsWith('/videos/')) errors.push('Video URL must start with /videos/');
    if (!product.description) errors.push('Description is required');
    if (!product.category) errors.push('Category is required');
    if (!product.style) errors.push('Style is required');
    if (!product.colors.length) errors.push('At least one color must be selected');
    if (!product.sizes.length) errors.push('At least one size must be selected');
    if (!product.tableData.Fabric) errors.push('Fabric is required');
    if (!product.tableData.Pattern) errors.push('Pattern is required');
    if (!product.tableData.Fit) errors.push('Fit is required');
    if (!product.tableData.Neck) errors.push('Neck is required');
    if (!product.tableData.Sleeve) errors.push('Sleeve is required');

    if (errors.length > 0) {
        console.error('Validation errors:', errors);
        showSimpleModal('Error', errors.join('<br>'), 'modal-error');
        return false;
    }

    return true;
}

export { validateProduct };