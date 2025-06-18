import { translations } from './pages-translations/modal_translations.js';

function validateProduct(product, isEditing = false) {
    const lang = localStorage.getItem('language') || 'en';
    const imageUrlRegex = /^\/images\/[\w\-\.\/]+?\.(jpg|svg|png)$/i;
    const videoUrlRegex = /^\/videos\/[\w\-\.\/]+?\.mp4$/i;

    const getTranslation = (key, fallback, params = {}) => {
        let translation = translations[key]?.[lang] || fallback;
        Object.entries(params).forEach(([param, value]) => {
            translation = translation.replace(`{${param}}`, value);
        });
        return translation;
    };

    const fieldValidations = [
        { 
            field: 'name', 
            label: 'product_name_label', 
            required: true, 
            errorKey: 'error_required_field' 
        },
        { 
            field: 'brand', 
            label: 'product_brand_label', 
            required: true, 
            errorKey: 'error_required_field' 
        },
        { 
            field: 'price', 
            label: 'product_price_label', 
            required: true,
            validate: value => !isNaN(value) && value >= 1, 
            errorKey: 'error_invalid_price' 
        },
        { 
            field: 'image', 
            label: 'product_image_label', 
            required: true, 
            validate: value => imageUrlRegex.test(value), 
            errorKey: 'error_invalid_image_url' 
        },
        { 
            field: 'video', 
            label: 'product_video_label', 
            required: true, 
            validate: value => videoUrlRegex.test(value), 
            errorKey: 'error_invalid_video_url' 
        },
        { 
            field: 'description', 
            label: 'product_description_label', 
            required: true, 
            errorKey: 'error_required_field' 
        },
        { 
            field: 'category', 
            label: 'product_category_label', 
            required: true, 
            errorKey: 'error_required_field' 
        },
        { 
            field: 'style', 
            label: 'product_style_label', 
            required: true, 
            errorKey: 'error_required_field' 
        },
        { 
            field: 'colors', 
            label: 'product_colors_label', 
            validate: value => value.length > 0, 
            errorKey: 'error_at_least_one' 
        },
        { 
            field: 'sizes', 
            label: 'product_sizes_label', 
            validate: value => value.length > 0, 
            errorKey: 'error_at_least_one' 
        },
        { 
            field: 'tableData.Fabric', 
            label: 'product_fabric_label', 
            required: true, 
            errorKey: 'error_required_field' 
        },
        { 
            field: 'tableData.Pattern', 
            label: 'product_pattern_label', 
            required: true, 
            errorKey: 'error_required_field' 
        },
        { 
            field: 'tableData.Fit', 
            label: 'product_fit_label', 
            required: true, 
            errorKey: 'error_required_field' 
        },
        { 
            field: 'tableData.Neck', 
            label: 'product_neck_label', 
            required: !isEditing, 
            errorKey: 'error_required_field' 
        },
        { 
            field: 'tableData.Sleeve', 
            label: 'product_sleeve_label', 
            required: !isEditing, 
            errorKey: 'error_required_field' 
        },
    ];

    for (const { field, label, required, validate, errorKey } of fieldValidations) {
        const value = field.includes('.') 
            ? field.split('.').reduce((obj, key) => obj?.[key] || '', product) 
            : product[field];
        
        const labelTranslation = getTranslation(label, field);

        console.log(`Validating field: ${field}, Value: ${value}, Label: ${labelTranslation}, Required: ${required}, Validate: ${validate ? validate(value) : true}`);

        if (required && (value === '' || value === null || value === undefined)) {
            const errorMessage = `${labelTranslation}: ${getTranslation(errorKey, errorKey)}`;
            console.error('Validation error:', errorMessage);
            alert(errorMessage);
            return errorMessage;
        } else if (validate && !validate(value)) {
            const errorMessage = `${labelTranslation}: ${getTranslation(errorKey, errorKey)}`;
            console.error('Validation error:', errorMessage);
            alert(errorMessage);
            return errorMessage;
        }
    }

    return true;
}

export { validateProduct };