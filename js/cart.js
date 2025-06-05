import { showModal } from './modules/modal.js';
import { clearCart } from './cartManager.js';

export async function initCart() {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const elements = {
    cartItems: document.querySelector('.cart-items'),
    cartTotal: document.querySelector('.cart-total'),
    checkoutForm: document.querySelector('#checkout-form'),
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

  function updateCartItemQuantity(itemId, newQuantity) {
    const item = cart.find(item => item.id === itemId);
    if (item) {
      if (newQuantity > item.quantity) {
        const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (totalQuantity >= 10) {
          showModal('Error', 'Cannot add more items. The cart is limited to 10 items in total.');
          return false;
        }
      }
      if (newQuantity <= 0) {
        cart = cart.filter(i => i.id !== itemId);
      } else {
        item.quantity = newQuantity;
      }
      localStorage.setItem('cart', JSON.stringify(cart));
      renderCart();
      return true;
    }
    return false;
  }

  function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    return true;
  }

  elements.cartItems.addEventListener('click', async (e) => {
    const cartItem = e.target.closest('.cart-item');
    if (!cartItem) return;
    const itemId = parseInt(cartItem.dataset.id);
    if (!itemId) return;

    if (e.target.closest('.decrease')) {
      const item = cart.find(item => item.id === itemId);
      if (item) {
        updateCartItemQuantity(itemId, item.quantity - 1);
      }
    }

    if (e.target.closest('.increase')) {
      const item = cart.find(item => item.id === itemId);
      if (item) {
        updateCartItemQuantity(itemId, item.quantity + 1);
      }
    }

    if (e.target.closest('.delete-btn')) {
      removeFromCart(itemId);
    }
  });
  
  function initializePickupPoint() {
    const pickupInput = document.querySelector('#pickup-point');
    const pickupRadio = document.querySelector('input[name="delivery"][value="pickup"]');
    if (pickupRadio.checked) {
      pickupInput.setAttribute('required', 'true');
      pickupInput.setAttribute('aria-required', 'true');
    } else {
      pickupInput.removeAttribute('required');
      pickupInput.removeAttribute('aria-required');
    }
  }

  document.querySelectorAll('input[name="delivery"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const pickupInput = document.querySelector('#pickup-point');
      if (radio.value === 'pickup') {
        pickupInput.setAttribute('required', 'true');
        pickupInput.setAttribute('aria-required', 'true');
      } else {
        pickupInput.removeAttribute('required');
        pickupInput.removeAttribute('aria-required');
      }
    });
  });

  elements.checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(elements.checkoutForm);
    const requiredFields = [
      { name: 'first-name', label: 'First Name' },
      { name: 'last-name', label: 'Last Name' },
      { name: 'country', label: 'Country/Region' },
      { name: 'street-address', label: 'Street Address' },
      { name: 'city', label: 'City' },
      { name: 'state', label: 'State' },
      { name: 'postal-code', label: 'Postal Code' },
      { name: 'phone', label: 'Phone' },
    ];

    const deliveryMethod = formData.get('delivery');
    if (deliveryMethod === 'pickup') {
      requiredFields.push({ name: 'pickup-point', label: 'Pickup Point' });
    }

    const missingFields = requiredFields.filter(field => !formData.get(field.name)?.trim());
    if (missingFields.length > 0) {
      const missingLabels = missingFields.map(field => field.label).join(', ');
      showModal('Error', `Please fill in the following fields: ${missingLabels}`);
      return;
    }

    const phone = formData.get('phone');
    if (!/^\+375[0-9]{9}$/.test(phone)) {
      showModal('Error', 'Phone number must be in the format +375XXXXXXXXX');
      return;
    }

    const paymentMethod = formData.get('payment');
    if (paymentMethod === 'credit-card' && !formData.get('card-type')) {
      showModal('Error', 'Please select a card type for credit card payment');
      return;
    }

    if (cart.length === 0) {
      showModal('Error', 'Your cart is empty.');
      return;
    }

    await clearCart();
    alert('Order Successfully Placed!');
    renderCart();
  });

  renderCart();
  initializePickupPoint();
}