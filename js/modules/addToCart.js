import { showAddToCartModal, showSuccessModal, showErrorModal } from './modal.js';

export async function initAddToCart(pageType, selector, products = []) {
    const buttons = document.querySelectorAll(selector);
    buttons.forEach(button => {
        button.addEventListener('click', async () => {
            const productId = button.dataset.productId;
            const product = products.find(p => p.id == productId) || await fetchProduct(productId);
            if (!product) {
                showErrorModal('Product not found');
                return;
            }

            const cartRes = await fetch('http://localhost:3000/cart');
            if (!cartRes.ok) {
                showErrorModal('Failed to fetch cart');
                return;
            }
            const cartItems = await cartRes.json();
            const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
            if (totalItems >= 10 && pageType !== 'product') {
                showErrorModal('Cannot add to cart. Maximum 10 items allowed.');
                return;
            }

            if (pageType === 'product' && !button.closest('.related-products')) {
                const color = document.querySelector('#color-select')?.value || product.colors[0];
                const size = document.querySelector('#size-select')?.value || product.sizes[0];
                await addToCart(product, color, size);
            } else {
                showAddToCartModal(product, async (color, size) => {
                    await addToCart(product, color, size);
                });
            }
        });
    });
}

async function fetchProduct(productId) {
    try {
        const res = await fetch(`http://localhost:3000/products/${productId}`);
        if (!res.ok) throw new Error('Failed to fetch product');
        return await res.json();
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

async function addToCart(product, color, size, quantity = 1) {
    try {
        const cartRes = await fetch('http://localhost:3000/cart');
        if (!cartRes.ok) throw new Error('Failed to fetch cart');
        const cartItems = await cartRes.json();
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

        const existingItem = cartItems.find(
            item => item.productId === product.id && item.color === color && item.size === size
        );

        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if (totalItems + quantity > 10) {
                showErrorModal('Cannot add to cart. Maximum 10 items allowed.');
                return false;
            }
            const updatedItem = { ...existingItem, quantity: newQuantity };
            const updateRes = await fetch(`http://localhost:3000/cart/${existingItem.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedItem)
            });
            if (!updateRes.ok) throw new Error('Failed to update cart item');
        } else {
            if (totalItems + quantity > 10) {
                showErrorModal('Cannot add to cart. Maximum 10 items allowed.');
                return false;
            }
            const cartItem = {
                productId: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                color,
                size,
                quantity,
                shipping: 5.00 
            };
            const addRes = await fetch('http://localhost:3000/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cartItem)
            });
            if (!addRes.ok) throw new Error('Failed to add item to cart');
        }

        showSuccessModal(`${product.name} added to cart!`);
        sessionStorage.setItem('showSuccessModal', 'true');
        updateCartCount();
        return true;
    } catch (error) {
        console.error('Error adding to cart:', error);
        showErrorModal('Failed to add item to cart.');
        return false;
    }
}

function updateCartCount() {
    fetch('http://localhost:3000/cart')
        .then(res => res.json())
        .then(cart => {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            const cartLink = document.querySelector('.cart-link');
            if (cartLink) {
                cartLink.dataset.count = totalItems;
                cartLink.style.setProperty('--cart-count', `"${totalItems}"`);
            }
        })
        .catch(error => console.error('Error updating cart count:', error));
}