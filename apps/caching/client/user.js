// ============================================
// User Portal - State & Logic
// ============================================

const ENVIRONMENTS = ['development', 'staging', 'production'];

// Maps environment -> array of resolved flags
let flagsByEnv = {};
let myOverrides = [];
let users = [];
let currentUserId = null;
let currentApiKey = null;
let currentEnvironment = 'development';

// ============================================
// Initialization
// ============================================

async function init() {
  try {
    // Fetch users first
    users = await fetchUsers();

    if (users.length === 0) {
      showError('No users found. Please create users first.');
      return;
    }

    // Set initial user (first user or from localStorage)
    const savedUserId = localStorage.getItem('selectedUserId');
    const savedUser = users.find(u => u._id === savedUserId);

    if (savedUser) {
      setCurrentUser(savedUser._id);
    } else {
      setCurrentUser(users[0]._id);
    }

    // Populate user dropdown
    populateUserSelect();

    // Set initial environment (from localStorage or default)
    const savedEnv = localStorage.getItem('selectedEnvironment');
    if (savedEnv && ENVIRONMENTS.includes(savedEnv)) {
      currentEnvironment = savedEnv;
    }
    updateEnvDisplay();

    // Fetch flags and overrides
    await loadData();

    setupEventListeners();
  } catch (error) {
    console.error('Failed to initialize:', error);
    showError('Failed to load data. Please refresh the page.');
  }
}

function setCurrentUser(userId) {
  const user = users.find(u => u._id === userId);
  if (!user) return;

  currentUserId = userId;
  currentApiKey = getUserApiKey(userId);

  // Save to localStorage
  localStorage.setItem('selectedUserId', userId);

  // Update header UI
  updateHeaderUser(user);
}

function updateHeaderUser(user) {
  const avatarEl = document.getElementById('userAvatar');
  const nameEl = document.getElementById('userName');

  avatarEl.textContent = getInitials(user.name);
  avatarEl.style.backgroundColor = getAvatarColor(user._id);
  nameEl.textContent = user.name;
}

function populateUserSelect() {
  const select = document.getElementById('userSelect');
  select.innerHTML = users.map(user =>
    `<option value="${user._id}" ${user._id === currentUserId ? 'selected' : ''}>${user.name}</option>`
  ).join('');
}

function updateEnvDisplay() {
  const badgeEl = document.getElementById('envBadgeDisplay');
  const selectEl = document.getElementById('envSelect');

  badgeEl.textContent = getEnvShortName(currentEnvironment);
  badgeEl.className = `env-badge-display ${currentEnvironment}`;
  selectEl.value = currentEnvironment;

  localStorage.setItem('selectedEnvironment', currentEnvironment);
}

async function loadData() {
  try {
    // Fetch resolved flags only for the current environment
    const [flags, overrides] = await Promise.all([
      fetchMyFlags(currentApiKey, currentEnvironment),
      fetchMyOverrides(currentApiKey),
    ]);

    flagsByEnv[currentEnvironment] = flags;
    myOverrides = overrides;

    renderFlags();
  } catch (error) {
    console.error('Failed to load data:', error);
    showError('Failed to load data');
  }
}

function setupEventListeners() {
  // User select change
  document.getElementById('userSelect').addEventListener('change', async (e) => {
    setCurrentUser(e.target.value);
    await loadData();
    closePanel();
  });

  // Environment select change
  document.getElementById('envSelect').addEventListener('change', async (e) => {
    currentEnvironment = e.target.value;
    updateEnvDisplay();
    await loadData();
  });

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

  // Use current environment flags
  const flags = flagsByEnv[currentEnvironment] || [];

  if (flags.length === 0) {
    showEmptyState(
      container,
      'No Feature Flags',
      'No feature flags have been created yet.',
      '<a href="index.html" class="btn btn-primary">Go to Admin Panel</a>'
    );
    return;
  }

  container.innerHTML = `
    <table class="flags-table">
      <thead>
        <tr>
          <th class="flag-name-cell">Flag</th>
          <th class="env-cell">Status</th>
        </tr>
      </thead>
      <tbody>
        ${flags.map(flag => renderUserFlagRow(flag)).join('')}
      </tbody>
    </table>
  `;

  // Add toggle handlers
  container.querySelectorAll('.user-toggle').forEach(toggle => {
    toggle.addEventListener('click', async () => {
      const flagId = toggle.dataset.toggleId;
      await handleToggleOverride(flagId, currentEnvironment);
    });
  });
}

function renderUserFlagRow(flag) {
  return `
    <tr data-flag-id="${flag._id}">
      <td class="flag-name-cell">
        <div class="flag-name">${escapeHtml(flag.name)}</div>
        <div class="flag-description">${escapeHtml(flag.description || '')}</div>
      </td>
      ${renderUserEnvCell(flag._id, currentEnvironment)}
    </tr>
  `;
}

function renderUserEnvCell(flagId, env) {
  // Get the resolved flag value for this environment from me/feature-flags
  const envFlags = flagsByEnv[env] || [];
  const resolvedFlag = envFlags.find(f => f._id === flagId);
  const effectiveValue = resolvedFlag ? resolvedFlag.enabled : false;

  return `
    <td class="env-cell">
      <div class="toggle-switch ${effectiveValue ? 'on' : 'off'} toggle-switch-small user-toggle" data-toggle-id="${flagId}" data-env="${env}"></div>
    </td>
  `;
}

// ============================================
// Toggle Override (inline)
// ============================================

async function handleToggleOverride(flagId, environment) {
  // Get current resolved value from the environment-specific flags
  const envFlags = flagsByEnv[environment] || [];
  const resolvedFlag = envFlags.find(f => f._id === flagId);
  if (!resolvedFlag) return;

  const currentValue = resolvedFlag.enabled;
  const newValue = !currentValue;

  // Check if user already has an override for this flag+environment
  const existingOverride = findUserOverrideForFlagAndEnv(flagId, environment, myOverrides);

  try {
    if (existingOverride) {
      // Update existing override
      await updateMyOverride(currentApiKey, existingOverride._id, { enabled: newValue });
    } else {
      // Create new override
      await createMyOverride(currentApiKey, {
        flagId: flagId,
        enabled: newValue,
        environment: environment,
      });
    }

    // Reload data to get fresh resolved values
    await loadData();
  } catch (error) {
    console.error('Failed to toggle override:', error);
    showError(error.message || 'Failed to toggle override');
  }
}

// ============================================
// Start the app
// ============================================

document.addEventListener('DOMContentLoaded', init);
