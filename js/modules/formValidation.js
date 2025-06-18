import { showErrorModal } from './modal.js';
import { translations as cartTranslations } from './pages-translations/cart_translations.js';

export async function validateCheckoutForm(form) {
    const lang = localStorage.getItem('language') || 'en';

    try {
        const res = await fetch('http://localhost:3000/cart');
        if (!res.ok) throw new Error('Failed to fetch cart');
        const cart = await res.json();
        if (cart.length === 0) {
            showErrorModal('error_empty_cart', lang);
            return false;
        }
    } catch (error) {
        console.error('Error checking cart:', error);
        showErrorModal('error_check_cart', lang);
        return false;
    }

    const requiredFields = [
        { id: 'first-name', key: 'first_name_label' },
        { id: 'last-name', key: 'last_name_label' },
        { id: 'country', key: 'country_label' },
        { id: 'street-address', key: 'street_address_label' },
        { id: 'city', key: 'city_label' },
        { id: 'state', key: 'state_label' },
        { id: 'postal-code', key: 'postal_code_label' },
        { id: 'phone', key: 'phone_label' },
    ];

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    for (const field of requiredFields) {
        if (!data[field.id] || data[field.id].trim() === '') {
            showErrorModal('error_empty_field', lang, { label: cartTranslations[field.key]?.[lang] || field.id });
            return false;
        }
    }

    const phoneRegex = /^\+375[0-9]{9}$/;
    if (!phoneRegex.test(data.phone)) {
        showErrorModal('error_invalid_phone', lang);
        return false;
    }

    if (data.delivery === 'pickup' && (!data['pickup-point'] || data['pickup-point'].trim() === '')) {
        showErrorModal('error_empty_pickup_point', lang);
        return false;
    }

    return true;
}