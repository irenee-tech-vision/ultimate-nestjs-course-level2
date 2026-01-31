const API_BASE = '/api';

async function createOrder(data) {
  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create order');
  }

  return response.json();
}

async function getOrder(orderId) {
  const response = await fetch(`${API_BASE}/orders/${orderId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch order');
  }

  return response.json();
}

async function createCheckoutSession(orderId) {
  const response = await fetch(`${API_BASE}/payments/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create checkout session');
  }

  return response.json();
}

async function createPaymentIntent(orderId) {
  const response = await fetch(`${API_BASE}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create payment intent');
  }

  return response.json();
}
