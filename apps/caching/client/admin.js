// ============================================
// Admin Dashboard - State & Logic
// ============================================

let flags = [];
let overrides = [];
let users = [];
let selectedFlag = null;

// ============================================
// Initialization
// ============================================

async function init() {
  try {
    // Fetch all data in parallel
    const [flagsData, overridesData, usersData] = await Promise.all([
      fetchFlags(),
      fetchAllOverrides(),
      fetchUsers(),
    ]);

    flags = flagsData;
    overrides = overridesData;
    users = usersData;

    renderFlags();
    setupEventListeners();
  } catch (error) {
    console.error('Failed to initialize:', error);
    showError('Failed to load data. Please refresh the page.');
  }
}

function setupEventListeners() {
  // Add Flag button
  document.getElementById('addFlagBtn').addEventListener('click', openAddFlagModal);

  // Modal overlay click to close
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') {
      closeModal();
    }
  });

  // Close panel on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closePanel();
      closeModal();
    }
  });
}

// ============================================
// Render Flags (Table Format)
// ============================================

function renderFlags() {
  const container = document.getElementById('flagsList');

  if (flags.length === 0) {
    showEmptyState(
      container,
      'No Feature Flags',
      'Create your first feature flag to get started.',
      '<button class="btn btn-primary" onclick="openAddFlagModal()">+ Create Flag</button>'
    );
    return;
  }

  // Get all unique environments
  const allEnvs = ['development', 'staging', 'production'];

  container.innerHTML = `
    <table class="flags-table">
      <thead>
        <tr>
          <th class="flag-name-cell">Flag</th>
          <th class="env-cell default-cell">Default</th>
          ${allEnvs.map(env => `<th class="env-cell">${getEnvShortName(env)}</th>`).join('')}
          <th class="overrides-cell">Overrides</th>
        </tr>
      </thead>
      <tbody>
        ${flags.map(flag => renderFlagRow(flag, allEnvs)).join('')}
      </tbody>
    </table>
  `;

  // Add row click to open panel
  container.querySelectorAll('.flag-name-cell').forEach(cell => {
    cell.addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      const flagId = row?.dataset.flagId;
      if (flagId) {
        openFlagPanel(flagId);
      }
    });
  });
}

function renderFlagRow(flag, allEnvs) {
  const overrideCount = countOverridesForFlag(flag._id, overrides);
  const flagOverrides = overrides.filter(o => o.flagId === flag._id);
  const isSelected = selectedFlag && selectedFlag._id === flag._id;

  return `
    <tr class="${isSelected ? 'selected' : ''}" data-flag-id="${flag._id}">
      <td class="flag-name-cell">
        <div class="flag-name">${escapeHtml(flag.name)}</div>
        <div class="flag-description">${escapeHtml(flag.description || '')}</div>
      </td>
      <td class="env-cell default-cell">
        <div class="env-cell-content">
          <div class="status-badge ${flag.enabled ? 'on' : 'off'}">${flag.enabled ? 'ON' : 'OFF'}</div>
        </div>
      </td>
      ${allEnvs.map(env => renderEnvCell(flag, env, flagOverrides)).join('')}
      <td class="overrides-cell">
        <span class="overrides-count ${overrideCount > 0 ? 'has-overrides' : ''}">
          ${overrideCount}
        </span>
      </td>
    </tr>
  `;
}

function renderEnvCell(flag, env, flagOverrides) {
  // Check if there's an environment-specific override for this flag (without userId)
  // User-scoped overrides (with userId) should not affect the column styling
  const envOverride = flagOverrides.find(o => o.environment === env && !o.userId);
  const hasOverride = !!envOverride;
  const displayValue = hasOverride ? envOverride.enabled : flag.enabled;

  return `
    <td class="env-cell ${hasOverride ? 'has-env-override' : 'no-env-override'}">
      <div class="env-cell-content">
        <div class="status-badge ${displayValue ? 'on' : 'off'}">${displayValue ? 'ON' : 'OFF'}</div>
      </div>
    </td>
  `;
}

// ============================================
// Toggle Flag
// ============================================

async function toggleFlag(flagId, enabled) {
  try {
    await updateFlag(flagId, { enabled });

    // Update local state
    const flag = flags.find(f => f._id === flagId);
    if (flag) {
      flag.enabled = enabled;
    }

    renderFlags();

    // Update panel if open
    if (selectedFlag && selectedFlag._id === flagId) {
      selectedFlag.enabled = enabled;
      renderFlagPanel();
    }
  } catch (error) {
    console.error('Failed to toggle flag:', error);
    showError('Failed to update flag');
  }
}

// ============================================
// Flag Panel
// ============================================

function openFlagPanel(flagId) {
  selectedFlag = flags.find(f => f._id === flagId);
  if (!selectedFlag) return;

  renderFlagPanel();
  openPanel();
  renderFlags(); // Re-render to show selected state
}

function renderFlagPanel() {
  if (!selectedFlag) return;

  const flagOverrides = getOverridesForFlag(selectedFlag._id, overrides);

  // Split overrides into environment overrides (no userId) and user overrides (has userId)
  const envOverrides = flagOverrides.filter(o => !o.userId);
  const userOverrides = flagOverrides.filter(o => o.userId);

  setPanelContent(`
    <div class="panel-header">
      <div>
        <div class="panel-title">${escapeHtml(selectedFlag.name)}</div>
      </div>
      <button class="panel-close" onclick="closeFlagPanel()">&times;</button>
    </div>
    <div class="panel-content">
      <div class="panel-section">
        <div class="panel-section-title">Details</div>
        <div class="form-group">
          <label>Name</label>
          <input type="text" id="panelFlagName" value="${escapeHtml(selectedFlag.name)}">
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="panelFlagDesc">${escapeHtml(selectedFlag.description || '')}</textarea>
        </div>
        <div class="form-group">
          <label>Default Status</label>
          <div class="toggle-row">
            <span class="toggle-label">
              Enabled
              <span class="toggle-status ${selectedFlag.enabled ? 'on' : 'off'}">
                ${selectedFlag.enabled ? 'ON' : 'OFF'}
              </span>
            </span>
            <div class="toggle-switch ${selectedFlag.enabled ? 'on' : 'off'}" id="panelToggle"></div>
          </div>
        </div>
        <div class="panel-section-actions">
          <button class="btn btn-danger" onclick="confirmDeleteFlag()">Delete Flag</button>
          <button class="btn btn-primary" onclick="saveFlagChanges()">Save Changes</button>
        </div>
      </div>

      <div class="panel-section">
        <div class="panel-section-title">
          <span>Environment Overrides (${envOverrides.length})</span>
          <button class="btn btn-ghost" onclick="openAddEnvOverrideModal()">+ Add</button>
        </div>
        ${envOverrides.length > 0 ? `
          <div class="overrides-list">
            ${envOverrides.map(override => renderEnvOverrideItem(override)).join('')}
          </div>
        ` : `
          <div class="no-overrides">No environment overrides</div>
        `}
      </div>

      <div class="panel-section">
        <div class="panel-section-title">
          <span>User Overrides (${userOverrides.length})</span>
          <button class="btn btn-ghost" onclick="openAddOverrideModal()">+ Add</button>
        </div>
        ${userOverrides.length > 0 ? `
          <div class="overrides-list">
            ${userOverrides.map(override => renderUserOverrideItem(override)).join('')}
          </div>
        ` : `
          <div class="no-overrides">No user overrides</div>
        `}
      </div>
    </div>
  `);

  // Add panel toggle handler
  document.getElementById('panelToggle').addEventListener('click', () => {
    selectedFlag.enabled = !selectedFlag.enabled;
    renderFlagPanel();
  });

  // Add override toggle handlers
  document.querySelectorAll('.override-item .toggle-switch').forEach(toggle => {
    toggle.addEventListener('click', async (e) => {
      e.stopPropagation();
      const overrideId = toggle.dataset.toggleId;
      const override = overrides.find(o => o._id === overrideId);
      if (override) {
        await toggleOverride(overrideId, !override.enabled);
      }
    });
  });

  // Add delete override handlers
  document.querySelectorAll('.override-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const overrideId = btn.dataset.overrideId;
      await removeOverride(overrideId);
    });
  });
}

function renderEnvOverrideItem(override) {
  const envLabel = override.environment ? getEnvShortName(override.environment) : 'unknown';
  const envClass = override.environment?.toLowerCase() || '';

  return `
    <div class="override-item env-override-item">
      <div class="env-override-badge ${envClass}">${envLabel}</div>
      <div class="override-info">
        <div class="override-name">${override.environment || 'Unknown'}</div>
      </div>
      <div class="override-actions">
        ${renderToggle(override.enabled, override._id, 'toggle-switch-small')}
        <button class="override-delete" data-override-id="${override._id}">&times;</button>
      </div>
    </div>
  `;
}

function renderUserOverrideItem(override) {
  const user = users.find(u => u._id === override.userId);
  const userName = user?.name || 'Unknown User';
  const envLabel = override.environment ? getEnvShortName(override.environment) : '';

  return `
    <div class="override-item user-override-item">
      ${renderAvatar(userName, override.userId, 'small')}
      <div class="override-info">
        <div class="override-name">${escapeHtml(userName)}</div>
        ${envLabel ? `<div class="override-env">${envLabel}</div>` : ''}
      </div>
      <div class="override-actions">
        ${renderToggle(override.enabled, override._id, 'toggle-switch-small')}
        <button class="override-delete" data-override-id="${override._id}">&times;</button>
      </div>
    </div>
  `;
}

function closeFlagPanel() {
  selectedFlag = null;
  closePanel();
  renderFlags();
}

// ============================================
// Save Flag Changes
// ============================================

async function saveFlagChanges() {
  if (!selectedFlag) return;

  const name = document.getElementById('panelFlagName').value.trim();
  const description = document.getElementById('panelFlagDesc').value.trim();
  const enabled = selectedFlag.enabled;

  if (!name) {
    showError('Name is required');
    return;
  }

  try {
    await updateFlag(selectedFlag._id, { name, description, enabled });

    // Update local state
    Object.assign(selectedFlag, { name, description, enabled });

    renderFlags();
    renderFlagPanel();
  } catch (error) {
    console.error('Failed to save flag:', error);
    showError('Failed to save changes');
  }
}

// ============================================
// Delete Flag
// ============================================

function confirmDeleteFlag() {
  if (!selectedFlag) return;

  if (confirm(`Are you sure you want to delete "${selectedFlag.name}" (${selectedFlag.environment})?`)) {
    deleteFlagAction();
  }
}

async function deleteFlagAction() {
  if (!selectedFlag) return;

  try {
    await deleteFlag(selectedFlag._id);

    // Remove from local state
    flags = flags.filter(f => f._id !== selectedFlag._id);
    overrides = overrides.filter(o => o.flagId !== selectedFlag._id);

    closeFlagPanel();
    renderFlags();
  } catch (error) {
    console.error('Failed to delete flag:', error);
    showError('Failed to delete flag');
  }
}

// ============================================
// Toggle Override
// ============================================

async function toggleOverride(overrideId, enabled) {
  try {
    await updateOverrideAdmin(overrideId, { enabled });

    // Update local state
    const override = overrides.find(o => o._id === overrideId);
    if (override) {
      override.enabled = enabled;
    }

    renderFlagPanel();
    renderFlags();
  } catch (error) {
    console.error('Failed to toggle override:', error);
    showError('Failed to update override');
  }
}

// ============================================
// Remove Override
// ============================================

async function removeOverride(overrideId) {
  if (!confirm('Are you sure you want to remove this override?')) return;

  try {
    await deleteOverrideAdmin(overrideId);

    // Remove from local state
    overrides = overrides.filter(o => o._id !== overrideId);

    renderFlagPanel();
    renderFlags();
  } catch (error) {
    console.error('Failed to remove override:', error);
    showError('Failed to remove override');
  }
}

// ============================================
// Add Flag Modal
// ============================================

function openAddFlagModal() {
  setModalContent(`
    <div class="modal-header">
      <h2>Create Feature Flag</h2>
    </div>
    <div class="form-group">
      <label>Name</label>
      <input type="text" id="newFlagName" placeholder="e.g., dark-mode">
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea id="newFlagDesc" placeholder="What does this flag do?"></textarea>
    </div>
    <div class="form-group">
      <label>Initial Status</label>
      <div class="toggle-row">
        <span class="toggle-label">Enabled</span>
        <div class="toggle-switch off" id="newFlagToggle"></div>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="createNewFlag()">Create Flag</button>
    </div>
  `);

  // Add toggle handler
  document.getElementById('newFlagToggle').addEventListener('click', function() {
    this.classList.toggle('on');
    this.classList.toggle('off');
  });

  openModal();
  document.getElementById('newFlagName').focus();
}

async function createNewFlag() {
  const name = document.getElementById('newFlagName').value.trim();
  const description = document.getElementById('newFlagDesc').value.trim();
  const enabled = document.getElementById('newFlagToggle').classList.contains('on');

  if (!name) {
    showError('Name is required');
    return;
  }

  try {
    const newFlag = await createFlag({ name, description, enabled });
    flags.push(newFlag);

    closeModal();
    renderFlags();
  } catch (error) {
    console.error('Failed to create flag:', error);
    showError(error.message || 'Failed to create flag');
  }
}

// ============================================
// Add Environment Override Modal
// ============================================

function openAddEnvOverrideModal() {
  if (!selectedFlag) return;

  // Filter out environments that already have an override for this flag
  const allEnvs = ['development', 'staging', 'production'];
  const existingEnvs = overrides
    .filter(o => o.flagId === selectedFlag._id && !o.userId)
    .map(o => o.environment);

  const availableEnvs = allEnvs.filter(env => !existingEnvs.includes(env));

  if (availableEnvs.length === 0) {
    showError('All environments already have overrides for this flag');
    return;
  }

  setModalContent(`
    <div class="modal-header">
      <h2>Add Environment Override</h2>
    </div>
    <div class="form-group">
      <label>Environment</label>
      <select id="newEnvOverrideEnv">
        ${availableEnvs.map(env => `
          <option value="${env}">${env.charAt(0).toUpperCase() + env.slice(1)}</option>
        `).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>Override Value</label>
      <div class="toggle-row">
        <span class="toggle-label">Enabled</span>
        <div class="toggle-switch off" id="newEnvOverrideToggle"></div>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="createNewEnvOverride()">Add Override</button>
    </div>
  `);

  // Add toggle handler
  document.getElementById('newEnvOverrideToggle').addEventListener('click', function() {
    this.classList.toggle('on');
    this.classList.toggle('off');
  });

  openModal();
}

async function createNewEnvOverride() {
  if (!selectedFlag) return;

  const environment = document.getElementById('newEnvOverrideEnv').value;
  const enabled = document.getElementById('newEnvOverrideToggle').classList.contains('on');

  try {
    const newOverride = await createOverrideAdmin({
      flagId: selectedFlag._id,
      environment,
      enabled,
    });

    overrides.push(newOverride);

    closeModal();
    renderFlagPanel();
    renderFlags();
  } catch (error) {
    console.error('Failed to create environment override:', error);
    showError(error.message || 'Failed to create environment override');
  }
}

// ============================================
// Add User Override Modal
// ============================================

let selectedOverrideUserId = null;

function openAddOverrideModal() {
  if (!selectedFlag) return;

  if (users.length === 0) {
    showError('No users available');
    return;
  }

  selectedOverrideUserId = users[0]._id;

  setModalContent(`
    <div class="modal-header">
      <h2>Add User Override</h2>
    </div>
    <div class="form-group">
      <label>User</label>
      <div class="add-override-user-select" id="userSelect">
        ${users.map(user => `
          <div class="user-option ${user._id === selectedOverrideUserId ? 'selected' : ''}" data-user-id="${user._id}">
            <div class="user-option-avatar" style="background-color: ${getAvatarColor(user._id)}">${getInitials(user.name)}</div>
            <div class="user-option-name">${escapeHtml(user.name)}</div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="form-group">
      <label>Environment</label>
      <select id="newOverrideEnv">
        <option value="development">Development</option>
        <option value="staging">Staging</option>
        <option value="production">Production</option>
      </select>
    </div>
    <div class="form-group">
      <label>Override Value</label>
      <div class="toggle-row">
        <span class="toggle-label">Enabled</span>
        <div class="toggle-switch off" id="newOverrideToggle"></div>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="createOverrideBtn" onclick="createNewOverride()">Add Override</button>
    </div>
  `);

  // Function to update available environments based on selected user
  function updateAvailableEnvironments() {
    const envSelect = document.getElementById('newOverrideEnv');
    const createBtn = document.getElementById('createOverrideBtn');
    const allEnvs = ['development', 'staging', 'production'];

    // Get environments already used by this user for this flag
    const usedEnvs = overrides
      .filter(o => o.flagId === selectedFlag._id && o.userId === selectedOverrideUserId)
      .map(o => o.environment);

    const availableEnvs = allEnvs.filter(env => !usedEnvs.includes(env));

    if (availableEnvs.length === 0) {
      envSelect.innerHTML = '<option value="">No environments available</option>';
      envSelect.disabled = true;
      createBtn.disabled = true;
    } else {
      envSelect.innerHTML = availableEnvs.map(env =>
        `<option value="${env}">${env.charAt(0).toUpperCase() + env.slice(1)}</option>`
      ).join('');
      envSelect.disabled = false;
      createBtn.disabled = false;
    }
  }

  // Add user selection handlers
  document.querySelectorAll('.user-option').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('.user-option').forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
      selectedOverrideUserId = option.dataset.userId;
      updateAvailableEnvironments();
    });
  });

  // Add toggle handler
  document.getElementById('newOverrideToggle').addEventListener('click', function() {
    this.classList.toggle('on');
    this.classList.toggle('off');
  });

  // Initial update of available environments
  updateAvailableEnvironments();

  openModal();
}

async function createNewOverride() {
  if (!selectedFlag || !selectedOverrideUserId) return;

  const enabled = document.getElementById('newOverrideToggle').classList.contains('on');
  const environment = document.getElementById('newOverrideEnv').value;

  try {
    const newOverride = await createOverrideAdmin({
      flagId: selectedFlag._id,
      userId: selectedOverrideUserId,
      enabled,
      environment,
    });

    overrides.push(newOverride);

    closeModal();
    renderFlagPanel();
    renderFlags();
  } catch (error) {
    console.error('Failed to create override:', error);
    showError(error.message || 'Failed to create override');
  }
}

// ============================================
// Start the app
// ============================================

document.addEventListener('DOMContentLoaded', init);
