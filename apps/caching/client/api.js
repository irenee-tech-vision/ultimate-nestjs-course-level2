// API Configuration
const API_BASE = '/api';

// Hardcoded API keys for demo purposes (maps userId to apiKey)
const API_KEYS = {
  '69637b74a4f23cc082497f67': 'alice-1234',
  '69637b8997be6a5125627c31': 'bob-1234',
  '69637b964936a86a16289e68': 'charlie-1234',
};

// Store users fetched from API
let usersCache = [];

// ============================================
// Users API
// ============================================

async function fetchUsers() {
  const response = await fetch(`${API_BASE}/users`);
  if (!response.ok) throw new Error('Failed to fetch users');
  usersCache = await response.json();
  return usersCache;
}

function getCachedUsers() {
  return usersCache;
}

function getUserById(userId) {
  return usersCache.find(u => u._id === userId);
}

function getUserApiKey(userId) {
  // Use hardcoded API keys for demo
  return API_KEYS[userId] || null;
}

// ============================================
// Feature Flags API
// ============================================

async function fetchFlags() {
  const response = await fetch(`${API_BASE}/admin/feature-flags`);
  if (!response.ok) throw new Error('Failed to fetch feature flags');
  return response.json();
}

async function createFlag(data) {
  const response = await fetch(`${API_BASE}/admin/feature-flags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create feature flag');
  }
  return response.json();
}

async function updateFlag(id, data) {
  const response = await fetch(`${API_BASE}/admin/feature-flags/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update feature flag');
  }
  return response.json();
}

async function deleteFlag(id) {
  const response = await fetch(`${API_BASE}/admin/feature-flags/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete feature flag');
  }
  return true;
}

// ============================================
// Admin Overrides API
// ============================================

async function fetchAllOverrides() {
  const response = await fetch(`${API_BASE}/admin/overrides`);
  if (!response.ok) throw new Error('Failed to fetch overrides');
  return response.json();
}

async function createOverrideAdmin(data) {
  const response = await fetch(`${API_BASE}/admin/overrides`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create override');
  }
  return response.json();
}

async function updateOverrideAdmin(id, data) {
  const response = await fetch(`${API_BASE}/admin/overrides/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update override');
  }
  return response.json();
}

async function deleteOverrideAdmin(id) {
  const response = await fetch(`${API_BASE}/admin/overrides/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete override');
  }
  return true;
}

// ============================================
// User Feature Flags API (requires API key)
// ============================================

async function fetchMyFlags(apiKey, environment) {
  const response = await fetch(`${API_BASE}/me/feature-flags?environment=${encodeURIComponent(environment)}`, {
    headers: { 'x-api-key': apiKey },
  });
  if (!response.ok) throw new Error('Failed to fetch my feature flags');
  return response.json();
}

// ============================================
// User Overrides API (requires API key)
// ============================================

async function fetchMyOverrides(apiKey) {
  const response = await fetch(`${API_BASE}/me/overrides`, {
    headers: { 'x-api-key': apiKey },
  });
  if (!response.ok) throw new Error('Failed to fetch my overrides');
  return response.json();
}

async function createMyOverride(apiKey, data) {
  const response = await fetch(`${API_BASE}/me/overrides`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create override');
  }
  return response.json();
}

async function updateMyOverride(apiKey, id, data) {
  const response = await fetch(`${API_BASE}/me/overrides/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update override');
  }
  return response.json();
}

async function deleteMyOverride(apiKey, id) {
  const response = await fetch(`${API_BASE}/me/overrides/${id}`, {
    method: 'DELETE',
    headers: { 'x-api-key': apiKey },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete override');
  }
  return true;
}
