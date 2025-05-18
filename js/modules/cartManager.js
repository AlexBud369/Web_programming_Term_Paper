import { showModal } from './modal.js';

export function getCart() {
  try {
    return JSON.parse(localStorage.getItem('cart')) || [];
  } catch (error) {
    console.error('Error fetching cart:', error);
    return [];
  }
}

export function saveCart(cart) {
  try {
    localStorage.setItem('cart', JSON.stringify(cart));
    return true;
  } catch (error) {
    console.error('Error saving cart:', error);
    return false;
  }
}

export async function addToCart(product, color, size, quantity = 1) {
  try {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    const existingItem = cart.find(
      item => item.productId === product.id && item.color === color && item.size === size
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (totalItems + quantity > 10) {
        showModal('Error', 'Cannot add to cart. Maximum 10 items allowed.');
        return false;
      }
      existingItem.quantity = newQuantity;
    } else {
      if (totalItems + quantity > 10) {
        showModal('Error', 'Cannot add to cart. Maximum 10 items allowed.');
        return false;
      }
      cart.push({
        id: Date.now(),
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        color,
        size,
        quantity
      });
    }

    saveCart(cart);
    showModal('Success', `${product.name} added to cart!`);
    updateCartCount();
    return true;
  } catch (error) {
    console.error('Error adding to cart:', error);
    showModal('Error', 'Failed to add item to cart.');
    return false;
  }
}

function updateCartCount() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartLink = document.querySelector('.cart-link');
  if (cartLink) {
    cartLink.dataset.count = totalItems;
    cartLink.style.setProperty('--cart-count', `"${totalItems}"`);
  }
}