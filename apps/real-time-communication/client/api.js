// API module - handles all HTTP requests and authentication

const API_BASE = '/api';

// Hardcoded API keys for each user (for demo purposes)
const API_KEYS = {
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890': 'alice-1234',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901': 'bob-1234',
  'c3d4e5f6-a7b8-9012-cdef-123456789012': 'charlie-1234',
};

// Current user ID (set by app.js)
let currentUserId = null;

function setCurrentUserId(userId) {
  currentUserId = userId;
}

function getCurrentUserId() {
  return currentUserId;
}

function getApiKey() {
  return API_KEYS[currentUserId] || 'alice-1234';
}

function getAuthHeaders() {
  return { 'x-api-key': getApiKey() };
}

function setApiKeyCookie() {
  document.cookie = `apiKey=${getApiKey()}; path=/`;
}

// Task API functions
async function fetchTasks() {
  const response = await fetch(`${API_BASE}/tasks`, { headers: getAuthHeaders() });
  return response.json();
}

async function fetchTaskUpdates(changedSince) {
  if(!changedSince){
    return fetchTasks();
  }
  
  const url = `${API_BASE}/tasks?changedSince=${encodeURIComponent(changedSince)}&includeDeleted=true`;
  const response = await fetch(url, { headers: getAuthHeaders() });
  return response.json();
}

async function fetchUsers() {
  const response = await fetch(`${API_BASE}/users`, { headers: getAuthHeaders() });
  return response.json();
}

async function createTask(taskData) {
  const response = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(taskData)
  });
  return response.json();
}

async function changeTaskStatus(id, status) {
  const response = await fetch(`${API_BASE}/tasks/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ status })
  });
  return response.json();
}

async function updateTask(id, data) {
  const response = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data)
  });
  return response.json();
}

async function assignTask(id, assigneeId) {
  const response = await fetch(`${API_BASE}/tasks/${id}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ assigneeId: assigneeId || undefined })
  });
  return response.json();
}

async function deleteTaskApi(id) {
  const response = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return response.ok;
}

// Comment API functions
async function fetchComments(taskId) {
  const response = await fetch(`${API_BASE}/comments?taskId=${taskId}`, { headers: getAuthHeaders() });
  return response.json();
}

async function createComment(commentData) {
  const response = await fetch(`${API_BASE}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(commentData)
  });
  return response.json();
}

async function updateCommentApi(id, content) {
  const response = await fetch(`${API_BASE}/comments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ content })
  });
  return response.json();
}

async function deleteCommentApi(id, authorId) {
  const response = await fetch(`${API_BASE}/comments/${id}?authorId=${authorId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return response.ok;
}
