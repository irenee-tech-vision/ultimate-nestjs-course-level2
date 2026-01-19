// ============================================
// UI Helper Functions
// ============================================

// Avatar colors - deterministic based on ID
const AVATAR_COLORS = [
  '#e63946', '#f4a261', '#2a9d8f', '#9d4edd',
  '#3b82f6', '#ec4899', '#14b8a6', '#f59e0b',
];

function getAvatarColor(id) {
  if (!id) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash = hash & hash;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function renderAvatar(name, id, size = 'medium') {
  const color = getAvatarColor(id);
  const initials = getInitials(name);
  const sizeClass = size === 'small' ? 'override-avatar' : 'user-avatar';
  return `<div class="${sizeClass}" style="background-color: ${color}">${initials}</div>`;
}

// Environment badge colors
const ENV_COLORS = {
  development: 'development',
  staging: 'staging',
  production: 'production',
  dev: 'development',
  stg: 'staging',
  prod: 'production',
};

function getEnvClass(env) {
  return ENV_COLORS[env?.toLowerCase()] || 'development';
}

function getEnvShortName(env) {
  const names = {
    development: 'dev',
    staging: 'stg',
    production: 'prod',
  };
  return names[env?.toLowerCase()] || env?.substring(0, 4) || 'env';
}

// XSS Prevention
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Group flags by name
function groupFlagsByName(flags) {
  const groups = {};
  flags.forEach(flag => {
    const name = flag.name;
    if (!groups[name]) {
      groups[name] = {
        name: name,
        description: flag.description,
        environments: [],
      };
    }
    groups[name].environments.push(flag);
  });

  // Sort environments within each group
  const envOrder = { development: 0, staging: 1, production: 2 };
  Object.values(groups).forEach(group => {
    group.environments.sort((a, b) => {
      const orderA = envOrder[a.environment?.toLowerCase()] ?? 99;
      const orderB = envOrder[b.environment?.toLowerCase()] ?? 99;
      return orderA - orderB;
    });
  });

  return Object.values(groups);
}

// Render toggle switch HTML
function renderToggle(enabled, id = '', extraClass = '') {
  const state = enabled ? 'on' : 'off';
  return `<div class="toggle-switch ${state} ${extraClass}" data-toggle-id="${id}"></div>`;
}

// ============================================
// Panel Management
// ============================================

function openPanel() {
  const panel = document.getElementById('sidePanel');
  const main = document.querySelector('.main-content');
  if (panel) panel.classList.add('open');
  if (main) main.classList.add('panel-open');
}

function closePanel() {
  const panel = document.getElementById('sidePanel');
  const main = document.querySelector('.main-content');
  if (panel) panel.classList.remove('open');
  if (main) main.classList.remove('panel-open');
}

function setPanelContent(html) {
  const panel = document.getElementById('sidePanel');
  if (panel) panel.innerHTML = html;
}

// ============================================
// Modal Management
// ============================================

function openModal() {
  const modal = document.getElementById('modalOverlay');
  if (modal) modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('modalOverlay');
  if (modal) modal.classList.remove('active');
}

function setModalContent(html) {
  const modal = document.getElementById('modal');
  if (modal) modal.innerHTML = html;
}

// ============================================
// Utility Functions
// ============================================

function showLoading(container) {
  container.innerHTML = `
    <div class="loading">
      <div class="loading-spinner"></div>
      <div>Loading...</div>
    </div>
  `;
}

function showEmptyState(container, title, text, actionHtml = '') {
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">🚩</div>
      <div class="empty-state-title">${escapeHtml(title)}</div>
      <div class="empty-state-text">${escapeHtml(text)}</div>
      ${actionHtml}
    </div>
  `;
}

function showError(message) {
  alert(message); // Simple for now, could be enhanced with toast notifications
}

// Count overrides for a specific flag
function countOverridesForFlag(flagId, overrides) {
  return overrides.filter(o => o.flagId === flagId).length;
}

// Count total overrides for a flag group (all environments)
function countOverridesForFlagGroup(flagGroup, overrides) {
  let count = 0;
  flagGroup.environments.forEach(flag => {
    count += countOverridesForFlag(flag._id, overrides);
  });
  return count;
}

// Get overrides for a specific flag
function getOverridesForFlag(flagId, overrides) {
  return overrides.filter(o => o.flagId === flagId);
}

// Find user's override for a specific flag
function findUserOverrideForFlag(flagId, userId, overrides) {
  return overrides.find(o => o.flagId === flagId && o.userId === userId);
}

// Find user's override for a specific flag and environment
function findUserOverrideForFlagAndEnv(flagId, environment, overrides) {
  return overrides.find(o => o.flagId === flagId && o.environment === environment);
}
