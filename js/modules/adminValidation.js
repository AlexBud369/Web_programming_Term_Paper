import { showSimpleModal } from './modal.js';
import { translations } from './pages-translations/admin_translations.js';

function validateProduct(product) {
    const lang = localStorage.getItem('language') || 'en';
    const errors = [];

    const imageUrlRegex = /^\/images\/[\w\-\.\/]+?\.(jpg|svg|png)$/i;
    const videoUrlRegex = /^\/videos\/[\w\-\.\/]+?\.mp4$/i;

    const getTranslation = (key, fallback) => {
        return translations[key] && translations[key][lang] ? translations[key][lang] : fallback;
    };

    if (!product.name) {
        errors.push(`${getTranslation('product_name_label', 'Name')}: ${getTranslation('error_required_field', 'This field is required')}`);
    }
    if (!product.brand) {
        errors.push(`${getTranslation('product_brand_label', 'Brand')}: ${getTranslation('error_required_field', 'This field is required')}`);
    }
    if (!product.price || isNaN(product.price) || product.price <= 1) {
        errors.push(`${getTranslation('product_price_label', 'Price')}: ${getTranslation('error_invalid_price', 'Must be a number greater than 1')}`);
    }
    if (!product.image) {
        errors.push(`${getTranslation('product_image_label', 'Image URL')}: ${getTranslation('error_required_field', 'This field is required')}`);
    } else if (!imageUrlRegex.test(product.image)) {
        errors.push(`${getTranslation('product_image_label', 'Image URL')}: ${getTranslation('error_invalid_image_url', 'Must start with /images/ and end with .jpg, .svg, or .png')}`);
    }
    if (!product.video) {
        errors.push(`${getTranslation('product_video_label', 'Video URL')}: ${getTranslation('error_required_field', 'This field is required')}`);
    } else if (!videoUrlRegex.test(product.video)) {
        errors.push(`${getTranslation('product_video_label', 'Video URL')}: ${getTranslation('error_invalid_video_url', 'Must start with /videos/ and end with .mp4')}`);
    }
    if (!product.description) {
        errors.push(`${getTranslation('product_description_label', 'Description')}: ${getTranslation('error_required_field', 'This field is required')}`);
    }
    if (!product.category) {
        errors.push(`${getTranslation('product_category_label', 'Category')}: ${getTranslation('error_required_field', 'This field is required')}`);
    }
    if (!product.style) {
        errors.push(`${getTranslation('product_style_label', 'Style')}: ${getTranslation('error_required_field', 'This field is required')}`);
    }
    if (!product.colors.length) {
        errors.push(`${getTranslation('product_colors_label', 'Colors')}: ${getTranslation('error_at_least_one', 'At least one must be selected')}`);
    }
    if (!product.sizes.length) {
        errors.push(`${getTranslation('product_sizes_label', 'Sizes')}: ${getTranslation('error_at_least_one', 'At least one must be selected')}`);
    }
    if (!product.tableData.Fabric) {
        errors.push(`${getTranslation('product_fabric_label', 'Fabric')}: ${getTranslation('error_required_field', 'This field is required')}`);
    }
    if (!product.tableData.Pattern) {
        errors.push(`${getTranslation('product_pattern_label', 'Pattern')}: ${getTranslation('error_required_field', 'This field is required')}`);
    }
    if (!product.tableData.Fit) {
        errors.push(`${getTranslation('product_fit_label', 'Fit')}: ${getTranslation('error_required_field', 'This field is required')}`);
    }
    if (!product.tableData.Neck) {
        errors.push(`${getTranslation('product_neck_label', 'Neck')}: ${getTranslation('error_required_field', 'This field is required')}`);
    }
    if (!product.tableData.Sleeve) {
        errors.push(`${getTranslation('product_sleeve_label', 'Sleeve')}: ${getTranslation('error_required_field', 'This field is required')}`);
    }

    if (errors.length > 0) {
        console.error('Validation errors:', errors);
        showSimpleModal(
            getTranslation('modal_error_title', 'Error'),
            errors.join('<br>'),
            'modal-error'
        );
        return false;
    }

    return true;
}

export { validateProduct };