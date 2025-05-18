import { initCatalog } from './modules/catalog.js';
import { initProductDetails } from './modules/product-details.js';
import { initCart } from './modules/cart.js';

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  if (path.includes('catalog.html')) {
    initCatalog();
  } else if (path.includes('product.html')) {
    initProductDetails();
  } else if (path.includes('cart.html')) {
    initCart();
  }
});