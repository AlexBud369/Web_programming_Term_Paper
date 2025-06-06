import { showErrorModal } from './modal.js';

export async function validateCheckoutForm(form) {

    try {
        const res = await fetch('http://localhost:3000/cart');
        if (!res.ok) throw new Error('Failed to fetch cart');
        const cart = await res.json();
        if (cart.length === 0) {
            showErrorModal('Please add at least one item to your cart.');
            return false;
        }
    } catch (error) {
        console.error('Error checking cart:', error);
        showErrorModal('Failed to check cart.');
        return false;
    }

    const requiredFields = [
        { id: 'first-name', label: 'First Name' },
        { id: 'last-name', label: 'Last Name' },
        { id: 'country', label: 'Country/Region' },
        { id: 'street-address', label: 'Street Address' },
        { id: 'city', label: 'City' },
        { id: 'state', label: 'State' },
        { id: 'postal-code', label: 'Postal Code' },
        { id: 'phone', label: 'Phone' },
    ];

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    for (const field of requiredFields) {
        if (!data[field.id] || data[field.id].trim() === '') {
            showErrorModal(`Please fill in the ${field.label} field.`);
            return false;
        }
    }

    const phoneRegex = /^\+375[0-9]{9}$/;
    if (!phoneRegex.test(data.phone)) {
        showErrorModal('Please enter a valid Belarusian phone number (+375XXXXXXXXX).');
        return false;
    }


    if (data.delivery === 'pickup') {
        if (!data['pickup-point'] || data['pickup-point'].trim() === '') {
            showErrorModal('Please fill in the Pickup Point field.');
            return false;
        }
    }

    return true;
}