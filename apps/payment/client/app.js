let currentOrder = null;

// DOM Elements
const orderForm = document.getElementById('orderForm');
const orderSection = document.getElementById('orderSection');
const paymentSection = document.getElementById('paymentSection');
const orderDetails = document.getElementById('orderDetails');
const checkoutBtn = document.getElementById('checkoutBtn');
const customPayBtn = document.getElementById('customPayBtn');
const newOrderBtn = document.getElementById('newOrderBtn');
const errorAlert = document.getElementById('errorAlert');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  orderForm.addEventListener('submit', handleCreateOrder);
  checkoutBtn.addEventListener('click', handleCheckoutPay);
  customPayBtn.addEventListener('click', handleCustomPay);
  newOrderBtn.addEventListener('click', handleNewOrder);
});

async function handleCreateOrder(e) {
  e.preventDefault();
  hideError();

  const amount = parseInt(document.getElementById('amount').value, 10);
  const currency = document.getElementById('currency').value;
  const description = document.getElementById('description').value;

  try {
    setFormLoading(true);
    currentOrder = await createOrder({ amount, currency, description });
    showPaymentSection();
  } catch (error) {
    showError(error.message);
  } finally {
    setFormLoading(false);
  }
}

async function handleCheckoutPay() {
  if (!currentOrder) return;
  hideError();

  try {
    setCheckoutLoading(true);
    const { url } = await createCheckoutSession(currentOrder.id);
    window.location.href = url;
  } catch (error) {
    showError(error.message);
    setCheckoutLoading(false);
  }
}

function handleCustomPay() {
  if (!currentOrder) return;
  window.location.href = `/payment.html?orderId=${currentOrder.id}`;
}

function handleNewOrder() {
  currentOrder = null;
  orderForm.reset();
  orderSection.classList.remove('hidden');
  paymentSection.classList.add('hidden');
  hideError();
}

function showPaymentSection() {
  orderSection.classList.add('hidden');
  paymentSection.classList.remove('hidden');

  const amountDisplay = (currentOrder.amount / 100).toFixed(2);
  const currencyDisplay = currentOrder.currency.toUpperCase();

  orderDetails.innerHTML = `
    <div class="order-row">
      <span class="order-label">Order ID</span>
      <span class="order-value">${currentOrder.id.slice(0, 8)}...</span>
    </div>
    <div class="order-row">
      <span class="order-label">Description</span>
      <span class="order-value">${escapeHtml(currentOrder.description || 'No description')}</span>
    </div>
    <div class="order-row">
      <span class="order-label">Amount</span>
      <span class="order-value amount">${currencyDisplay} ${amountDisplay}</span>
    </div>
  `;
}

function setFormLoading(loading) {
  const submitBtn = orderForm.querySelector('button[type="submit"]');
  submitBtn.disabled = loading;
  submitBtn.innerHTML = loading
    ? '<div class="loading-spinner"></div> Creating...'
    : 'Create Order';
}

function setCheckoutLoading(loading) {
  checkoutBtn.disabled = loading;
  checkoutBtn.innerHTML = loading
    ? '<div class="loading-spinner"></div> Redirecting...'
    : 'Pay with Stripe Checkout';
}

function showError(message) {
  errorAlert.textContent = message;
  errorAlert.classList.remove('hidden');
}

function hideError() {
  errorAlert.classList.add('hidden');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
