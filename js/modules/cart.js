import { showModal } from './modal.js';

export async function initCart() {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const elements = {
    cartItems: document.querySelector('.cart-items'),
    cartTotal: document.querySelector('.cart-total')
  };

  function renderCart() {
    if (cart.length === 0) {
      elements.cartItems.innerHTML = `
        <div class="empty-cart">
          <p>Your cart is empty.</p>
          <a href="/pages/catalog.html">Continue Shopping</a>
        </div>
      `;
      elements.cartTotal.innerHTML = '';
      return;
    }

    elements.cartItems.innerHTML = cart.map(item => `
      <div class="cart-item" role="listitem" data-id="${item.id}">
        <div class="product-details">
          <img src="${item.image}" alt="${item.name}" class="product-image">
          <div class="product-info">
            <h3 class="product-name">${item.name}</h3>
            <p class="product-color">Color: ${item.color}</p>
            <p class="product-size">Size: ${item.size}</p>
          </div>
        </div>
        <div class="product-price">$${item.price.toFixed(2)}</div>
        <div class="quantity-control">
          <button class="quantity-btn decrease">-</button>
          <span class="quantity-label">${item.quantity}</span>
          <button class="quantity-btn increase">+</button>
        </div>
        <div class="shipping-cost">$5.00</div>
        <div class="subtotal">$${(item.price * item.quantity).toFixed(2)}</div>
        <button class="delete-btn" aria-label="Remove ${item.name} from cart">
          <img src="/images/cart_images/deletecon.svg" alt="Delete">
        </button>
      </div>
    `).join('');

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = cart.length > 0 ? 5 : 0;
    const total = subtotal + shipping;

    elements.cartTotal.innerHTML = `
      <div class="total-block">
        <span>Subtotal:</span>
        <span class="subtotal-amount">$${subtotal.toFixed(2)}</span>
      </div>
      <div class="total-block">
        <span>Shipping:</span>
        <span class="shipping-amount">$${shipping.toFixed(2)}</span>
      </div>
      <div class="total-block">
        <span>Total:</span>
        <span class="total-amount">$${total.toFixed(2)}</span>
      </div>
    `;
  }

  renderCart();
}