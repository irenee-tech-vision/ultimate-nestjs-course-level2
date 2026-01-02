// UI module - handles all rendering and DOM manipulation

const statusConfig = {
  'to-do': { label: 'Todo', order: 0 },
  'in-progress': { label: 'In Progress', order: 1 },
  'blocked': { label: 'Blocked', order: 2 },
  'completed': { label: 'Done', order: 3 }
};

// Avatar color generation (deterministic based on userId)
function getAvatarColor(userId) {
  const colors = [
    '#e63946', '#2a9d8f', '#9d4edd', '#f4a261', '#457b9d', '#e9c46a',
    '#06d6a0', '#118ab2', '#ef476f', '#ffd166', '#073b4c', '#8338ec',
    '#ff006e', '#3a86ff', '#fb5607', '#8ac926'
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Date formatting
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCommentTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Board rendering
function renderTaskCard(task, currentTaskId) {
  const avatar = task.assigneeName && task.assigneeId
    ? `<div class="task-avatar" style="background-color: ${getAvatarColor(task.assigneeId)}">${task.assigneeName.substring(0, 2)}</div>`
    : '';
  const selectedClass = task.id === currentTaskId ? ' selected' : '';

  return `
    <div class="task-card${selectedClass}" draggable="true" data-id="${task.id}">
      ${avatar}
      <div class="task-title">${escapeHtml(task.title)}</div>
      <div class="task-meta">
        <span class="task-date">${formatDate(task.createdAt)}</span>
      </div>
    </div>
  `;
}

function renderColumn(status, statusTasks, currentTaskId) {
  const config = statusConfig[status];
  return `
    <div class="column" data-status="${status}" data-testid="column-${status}">
      <div class="column-header" data-testid="column-header-${status}">
        <div class="column-indicator"></div>
        <span class="column-title" data-testid="column-title-${status}">${config.label}</span>
        <span class="column-count" data-testid="column-count-${status}">${statusTasks.length}</span>
      </div>
      <div class="tasks-container" data-status="${status}" data-testid="tasks-container-${status}">
        ${statusTasks.map(task => renderTaskCard(task, currentTaskId)).join('')}
      </div>
      <button class="add-task-btn" data-testid="add-task-btn-${status}" onclick="openAddModal('${status}')">
        + ADD TASK
      </button>
    </div>
  `;
}

function renderBoard(tasks, currentTaskId) {
  const board = document.getElementById('board');
  const statuses = Object.keys(statusConfig).sort(
    (a, b) => statusConfig[a].order - statusConfig[b].order
  );

  const columns = statuses.map(status => {
    const statusTasks = tasks
      .filter(t => t.status === status)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return renderColumn(status, statusTasks, currentTaskId);
  });

  board.innerHTML = columns.join('');
}

// Comments rendering
function renderComments(comments, users, currentUserId) {
  const commentsList = document.getElementById('commentsList');
  const commentsCount = document.getElementById('commentsCount');

  commentsCount.textContent = comments.length;

  if (comments.length === 0) {
    commentsList.innerHTML = '';
    return;
  }

  // Sort comments by createdAt ascending (oldest first)
  const sortedComments = [...comments].sort((a, b) =>
    new Date(a.createdAt) - new Date(b.createdAt)
  );

  commentsList.innerHTML = sortedComments.map(comment => {
    const author = users.find(u => u.id === comment.authorId);
    const authorName = author ? author.name : 'Unknown';
    const initials = authorName.substring(0, 2);
    const avatarColor = getAvatarColor(comment.authorId);
    const isAuthor = comment.authorId === currentUserId;

    return `
      <div class="comment-item" data-comment-id="${comment.id}">
        <div class="comment-header">
          <div class="comment-avatar" style="background-color: ${avatarColor}">${initials}</div>
          <span class="comment-author">${escapeHtml(authorName)}</span>
          <div class="comment-actions">
            <span class="comment-time">${formatCommentTime(comment.createdAt)}</span>
            <div class="comment-menu-container">
              <button class="comment-menu-btn${isAuthor ? '' : ' hidden'}" onclick="toggleCommentMenu(event, '${comment.id}')" title="More options">&#8942;</button>
              <div class="comment-menu" id="comment-menu-${comment.id}">
                <button class="comment-menu-item" onclick="startEditComment('${comment.id}')">
                  <span>&#9998;</span> Edit
                </button>
                <button class="comment-menu-item danger" onclick="deleteComment('${comment.id}')">
                  <span>&#128465;</span> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="comment-content" id="comment-content-${comment.id}">${escapeHtml(comment.content)}</div>
        <div class="comment-edit-container" id="comment-edit-${comment.id}">
          <textarea class="comment-edit-input" id="comment-edit-input-${comment.id}">${comment.content}</textarea>
          <div class="comment-edit-actions">
            <button class="btn btn-secondary" onclick="cancelEditComment('${comment.id}')">Cancel</button>
            <button class="btn btn-primary" onclick="saveEditComment('${comment.id}')">Save</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Scroll to bottom
  commentsList.scrollTop = commentsList.scrollHeight;
}

// Typing indicator
function renderTypingIndicator(typingUsers, currentTaskId) {
  const indicator = document.getElementById('typingIndicator');
  if (!indicator) return;

  const taskTypers = typingUsers.get(currentTaskId);

  if (!taskTypers || taskTypers.size === 0) {
    indicator.textContent = '';
    indicator.classList.remove('visible');
    return;
  }

  const names = Array.from(taskTypers.values());
  let text;
  if (names.length === 1) {
    text = `${names[0]} is typing...`;
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are typing...`;
  } else {
    text = `${names[0]} and ${names.length - 1} others are typing...`;
  }

  indicator.textContent = text;
  indicator.classList.add('visible');
}

// Header user display
function updateHeaderUserDisplay(users, currentUserId) {
  const user = users.find(u => u.id === currentUserId);
  const avatar = document.getElementById('headerUserAvatar');
  const name = document.getElementById('headerUserName');

  if (user) {
    avatar.textContent = user.name.substring(0, 2);
    avatar.style.backgroundColor = getAvatarColor(user.id);
    name.textContent = user.name;
  } else {
    avatar.textContent = '--';
    name.textContent = 'No user';
  }
}

// Populate header user select
function populateHeaderUserSelect(users, currentUserId) {
  const select = document.getElementById('headerUserSelect');
  select.innerHTML = '';

  users.forEach(user => {
    const option = document.createElement('option');
    option.value = user.id;
    option.textContent = user.name;
    select.appendChild(option);
  });

  if (currentUserId) {
    select.value = currentUserId;
  }
}

// Sync header user select value
function syncHeaderUserSelect(currentUserId) {
  const select = document.getElementById('headerUserSelect');
  if (currentUserId) {
    select.value = currentUserId;
  }
}

function populateUserSelects(users) {
  const selects = [document.getElementById('addAssignee'), document.getElementById('panelAssignee')];
  selects.forEach(select => {
    // Clear existing options except the first one (Unassigned)
    while (select.options.length > 1) {
      select.remove(1);
    }
    users.forEach(user => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = user.name;
      select.appendChild(option);
    });
  });
}

// Assignee display in panel
function updateAssigneeDisplay(assigneeName, assigneeId) {
  const avatar = document.getElementById('panelAssigneeAvatar');
  const name = document.getElementById('panelAssigneeName');

  if (assigneeName && assigneeId) {
    avatar.textContent = assigneeName.substring(0, 2);
    avatar.classList.remove('unassigned');
    avatar.style.backgroundColor = getAvatarColor(assigneeId);
    name.textContent = assigneeName;
  } else {
    avatar.textContent = '?';
    avatar.classList.add('unassigned');
    avatar.style.backgroundColor = '';
    name.textContent = 'Unassigned';
  }
}

// Panel functions
function openSidePanel() {
  document.getElementById('sidePanel').classList.add('open');
  document.getElementById('boardContainer').classList.add('panel-open');
}

function closeSidePanel() {
  document.getElementById('sidePanel').classList.remove('open');
  document.getElementById('boardContainer').classList.remove('panel-open');
}

// Modal functions
function openModal() {
  document.getElementById('addModal').classList.add('active');
  document.getElementById('addTitle').focus();
}

function closeModal() {
  document.getElementById('addModal').classList.remove('active');
  document.getElementById('addTaskForm').reset();
}

// Comment menu functions
function toggleCommentMenu(event, commentId) {
  event.stopPropagation();
  const menu = document.getElementById(`comment-menu-${commentId}`);
  const isOpen = menu.classList.contains('open');

  closeAllCommentMenus();

  if (!isOpen) {
    menu.classList.add('open');
  }
}

function closeAllCommentMenus() {
  document.querySelectorAll('.comment-menu.open').forEach(menu => {
    menu.classList.remove('open');
  });
}

function startEditComment(commentId) {
  closeAllCommentMenus();

  const contentEl = document.getElementById(`comment-content-${commentId}`);
  const editContainer = document.getElementById(`comment-edit-${commentId}`);

  contentEl.style.display = 'none';
  editContainer.classList.add('active');

  const input = document.getElementById(`comment-edit-input-${commentId}`);
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
}

function cancelEditComment(commentId) {
  const contentEl = document.getElementById(`comment-content-${commentId}`);
  const editContainer = document.getElementById(`comment-edit-${commentId}`);

  contentEl.style.display = '';
  editContainer.classList.remove('active');

  // Reset the input to original content
  const input = document.getElementById(`comment-edit-input-${commentId}`);
  input.value = contentEl.textContent;
}

// Comment input handling
function adjustCommentInput() {
  const input = document.getElementById('commentInput');
  const submitBtn = document.getElementById('commentSubmit');
  submitBtn.disabled = !input.value.trim();

  // Auto-resize
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 100) + 'px';
}

// Drag and drop setup
function setupDragAndDrop(tasks, onStatusChange, onTaskClick) {
  const cards = document.querySelectorAll('.task-card');
  const containers = document.querySelectorAll('.tasks-container');

  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', card.dataset.id);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });

    // Click to open side panel
    card.addEventListener('click', (e) => {
      if (!card.classList.contains('dragging')) {
        onTaskClick(card.dataset.id);
      }
    });
  });

  containers.forEach(container => {
    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      container.classList.add('drag-over');
    });

    container.addEventListener('dragleave', () => {
      container.classList.remove('drag-over');
    });

    container.addEventListener('drop', async (e) => {
      e.preventDefault();
      container.classList.remove('drag-over');

      const taskId = e.dataTransfer.getData('text/plain');
      const newStatus = container.dataset.status;

      const task = tasks.find(t => t.id === taskId);
      if (task && task.status !== newStatus) {
        onStatusChange(taskId, newStatus);
      }
    });
  });
}

// Close menus when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.comment-menu-container')) {
    closeAllCommentMenus();
  }
});

// Update service badge indicators
function updateServiceBadges(polling, sse, ws) {
  const pollingBadge = document.getElementById('pollingBadge');
  const sseBadge = document.getElementById('sseBadge');
  const wsBadge = document.getElementById('wsBadge');

  pollingBadge.classList.toggle('active', polling);
  sseBadge.classList.toggle('active', sse);
  wsBadge.classList.toggle('active', ws);

  pollingBadge.title = `Polling: ${polling ? 'On' : 'Off'} (click to toggle)`;
  sseBadge.title = `SSE: ${sse ? 'On' : 'Off'} (click to toggle)`;
  wsBadge.title = `WebSocket: ${ws ? 'On' : 'Off'} (click to toggle)`;
}

// Initialize toggle states from settings
function initToggleStates() {
  updateServiceBadges(
    getSetting('pollingEnabled'),
    getSetting('sseEnabled'),
    getSetting('websocketEnabled')
  );
}
