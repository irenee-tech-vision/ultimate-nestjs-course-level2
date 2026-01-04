// App module - state management, initialization, and event handlers

// Global state
let tasks = [];
let users = [];
let currentTaskId = null;
let originalTitle = '';
let originalDescription = '';

// Track typing users per task: taskId -> Map<userId, userName>
const typingUsers = new Map();

// Service instances
let poller = null;
let sseClient = null;
let wsClient = null;

// Board rendering wrapper
function refreshBoard() {
  renderBoard(tasks, currentTaskId);
  setupDragAndDrop(tasks, handleStatusChange, openPanel);
}

// Handle task status change (from drag-drop)
async function handleStatusChange(taskId, newStatus) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.status = newStatus;
    refreshBoard();
    await changeTaskStatus(taskId, newStatus);
  }
}

// Handle incoming task updates (used by polling in chunk 3)
function handleTaskUpdates(updatedTasks) {
  updatedTasks.forEach(task => {
    const index = tasks.findIndex(t => t.id === task.id);
    if (task.deletedAt) {
      // Remove deleted tasks
      if (index !== -1) tasks.splice(index, 1);
    } else if (index !== -1) {
      // Update existing task
      tasks[index] = task;
    } else {
      // Add new task
      tasks.push(task);
    }
  });
  refreshBoard();
}

// Handle individual task events from SSE (chunk 3)
function handleTaskEvent(type, task) {
  if (type === 'deleted') {
    tasks = tasks.filter(t => t.id !== task.id);
  } else if (type === 'created') {
    if (!tasks.find(t => t.id === task.id)) {
      tasks.push(task);
    }
  } else if (type === 'updated') {
    const index = tasks.findIndex(t => t.id === task.id);
    if (index !== -1) {
      tasks[index] = task;
    } else {
      tasks.push(task);
    }
  }
  refreshBoard();
}

// Handle comment events from SSE (chunk 3)
function handleCommentEvent(type, comment) {
  // Only refresh if viewing the affected task
  if (currentTaskId === comment.taskId) {
    loadComments(currentTaskId);
  }
}

// Handle assignment events from SSE (chunk 3)
function handleAssignmentEvent(task) {
  const isAssignedToMe = task.assigneeId === getCurrentUserId();
  const message = isAssignedToMe
    ? `You have been assigned to task "${task.title}"`
    : `You have been unassigned from task "${task.title}"`;
  console.log('Assignment event:', task);
  alert(message);
}

// Handle typing updates from WebSocket (chunk 3)
function handleTypingUpdate(data) {
  if (data.isTyping) {
    if (!typingUsers.has(data.taskId)) {
      typingUsers.set(data.taskId, new Map());
    }
    typingUsers.get(data.taskId).set(data.userId, data.userName);
  } else {
    const taskTypers = typingUsers.get(data.taskId);
    if (taskTypers) {
      taskTypers.delete(data.userId);
    }
  }
  renderTypingIndicator(typingUsers, currentTaskId);
}

// Comments
async function loadComments(taskId) {
  try {
    const comments = await fetchComments(taskId);
    renderComments(comments, users, getCurrentUserId());
  } catch (error) {
    console.error('Failed to load comments:', error);
    document.getElementById('commentsList').innerHTML = '<div class="no-comments">Failed to load comments</div>';
  }
}

function handleCommentInput() {
  adjustCommentInput();

  // Notify others that we're typing
  if (wsClient) {
    wsClient.startTyping();
  }
}

async function submitComment() {
  if (!currentTaskId || !getCurrentUserId()) return;

  const input = document.getElementById('commentInput');
  const content = input.value.trim();
  if (!content) return;

  const submitBtn = document.getElementById('commentSubmit');
  submitBtn.disabled = true;

  // Stop typing indicator when submitting
  if (wsClient) {
    wsClient.stopTyping();
  }

  try {
    await createComment({
      taskId: currentTaskId,
      content: content,
      authorId: getCurrentUserId()
    });

    input.value = '';
    input.style.height = 'auto';
    await loadComments(currentTaskId);
  } catch (error) {
    console.error('Failed to post comment:', error);
    submitBtn.disabled = false;
  }
}

async function deleteComment(commentId) {
  if (!getCurrentUserId()) return;

  closeAllCommentMenus();

  if (!confirm('Are you sure you want to delete this comment?')) return;

  const success = await deleteCommentApi(commentId, getCurrentUserId());
  if (success) {
    await loadComments(currentTaskId);
  } else {
    alert('Failed to delete comment. You can only delete your own comments.');
  }
}

async function saveEditComment(commentId) {
  const input = document.getElementById(`comment-edit-input-${commentId}`);
  const newContent = input.value.trim();

  if (!newContent) {
    alert('Comment cannot be empty');
    return;
  }

  try {
    await updateCommentApi(commentId, newContent);
    await loadComments(currentTaskId);
  } catch (error) {
    console.error('Failed to update comment:', error);
    alert('Failed to update comment');
  }
}

// Side Panel
function openPanel(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  currentTaskId = taskId;
  originalTitle = task.title;
  originalDescription = task.description || '';

  document.getElementById('panelTaskId').value = task.id;
  document.getElementById('panelTitle').value = task.title;
  document.getElementById('panelDescription').value = task.description || '';
  document.getElementById('panelAssignee').value = task.assigneeId || '';
  updateAssigneeDisplay(task.assigneeName, task.assigneeId);

  openSidePanel();
  document.getElementById('saveBtn').disabled = true;

  // Reset and load comments
  document.getElementById('commentInput').value = '';
  document.getElementById('commentSubmit').disabled = true;
  loadComments(taskId);

  // Set WebSocket context for typing indicators
  if (wsClient) {
    const currentUser = users.find(u => u.id === getCurrentUserId());
    wsClient.setContext(taskId, getCurrentUserId(), currentUser?.name || 'Unknown');
  }

  // Render typing indicator for this task
  renderTypingIndicator(typingUsers, currentTaskId);

  refreshBoard(); // Re-render to show selected state
}

function closePanel() {
  // Clear WebSocket context and stop typing
  if (wsClient) {
    wsClient.clearContext();
  }

  closeSidePanel();
  currentTaskId = null;

  // Reset comments
  document.getElementById('commentsList').innerHTML = '';
  document.getElementById('commentsCount').textContent = '0';
  document.getElementById('commentInput').value = '';

  refreshBoard(); // Re-render to remove selected state
}

function checkForChanges() {
  const currentTitle = document.getElementById('panelTitle').value;
  const currentDescription = document.getElementById('panelDescription').value;

  const hasChanges = currentTitle !== originalTitle || currentDescription !== originalDescription;
  document.getElementById('saveBtn').disabled = !hasChanges;
}

async function handleAssigneeChange() {
  if (!currentTaskId) return;

  const newAssigneeId = document.getElementById('panelAssignee').value || undefined;
  const task = tasks.find(t => t.id === currentTaskId);
  if (!task) return;

  // Only update if actually changed
  if (task.assigneeId === newAssigneeId) return;

  const updatedTask = await assignTask(currentTaskId, newAssigneeId);

  // Update local state
  task.assigneeId = updatedTask.assigneeId;
  task.assigneeName = updatedTask.assigneeName;

  // Update panel display
  updateAssigneeDisplay(updatedTask.assigneeName, updatedTask.assigneeId);

  refreshBoard();
}

async function saveChanges() {
  if (!currentTaskId) return;

  const newTitle = document.getElementById('panelTitle').value;
  const newDescription = document.getElementById('panelDescription').value;

  const task = tasks.find(t => t.id === currentTaskId);
  if (!task) return;

  const updatedTask = await updateTask(currentTaskId, {
    title: newTitle,
    description: newDescription
  });

  // Update local state
  task.title = updatedTask.title;
  task.description = updatedTask.description;

  // Update original values
  originalTitle = newTitle;
  originalDescription = newDescription;

  document.getElementById('saveBtn').disabled = true;
  refreshBoard();
}

async function deleteTask() {
  if (!currentTaskId) return;

  if (!confirm('Are you sure you want to delete this task?')) return;

  const success = await deleteTaskApi(currentTaskId);
  if (success) {
    tasks = tasks.filter(t => t.id !== currentTaskId);
    closePanel();
    refreshBoard();
  } else {
    alert('Failed to delete task');
  }
}

// Add Task Modal
let currentStatus = 'to-do';

function openAddModal(status) {
  currentStatus = status;
  document.getElementById('addStatus').value = status;
  openModal();
}

function closeAddModal() {
  closeModal();
}

// Form submission - Add Task
document.getElementById('addTaskForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const taskData = {
    title: formData.get('title'),
    description: formData.get('description') || '',
    status: formData.get('status'),
    assigneeId: formData.get('assignee') || undefined
  };

  const newTask = await createTask(taskData);
  // Check for duplicate in case SSE event arrived before HTTP response
  if (!tasks.find(t => t.id === newTask.id)) {
    tasks.push(newTask);
  }
  refreshBoard();
  closeAddModal();
});

// Close modal on overlay click
document.getElementById('addModal').addEventListener('click', (e) => {
  if (e.target.id === 'addModal') {
    closeAddModal();
  }
});

// Close modal/panel on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAddModal();
    closePanel();
  }
});

// User change (header switcher)
function handleHeaderUserChange() {
  const select = document.getElementById('headerUserSelect');
  setCurrentUserId(select.value);
  setSetting('userId', select.value);
  updateHeaderUserDisplay(users, getCurrentUserId());
  setApiKeyCookie();

  // Reconnect SSE with new user credentials
  if (sseClient && sseClient.isConnected()) {
    sseClient.reconnect();
  }
}

// Service toggle handlers
function togglePollingFromHeader() {
  const currentState = getSetting('pollingEnabled');
  setPollingEnabled(!currentState);
}

function toggleSSEFromHeader() {
  const currentState = getSetting('sseEnabled');
  setSSEEnabled(!currentState);
}

function toggleWSFromHeader() {
  const currentState = getSetting('websocketEnabled');
  setWSEnabled(!currentState);
}

// Service enable/disable logic
function setPollingEnabled(enabled) {
  setSetting('pollingEnabled', enabled);

  if (enabled) {
    if (!poller) {
      poller = createPoller(fetchTaskUpdates, handleTaskUpdates);
    }
    poller.start();
  } else if (poller) {
    poller.stop();
  }

  updateServiceBadges(
    getSetting('pollingEnabled'),
    getSetting('sseEnabled'),
    getSetting('websocketEnabled')
  );
}

function setSSEEnabled(enabled) {
  setSetting('sseEnabled', enabled);

  if (enabled) {
    if (!sseClient) {
      sseClient = createSSEClient(handleTaskEvent, handleCommentEvent, handleAssignmentEvent);
    }
    sseClient.start();
  } else if (sseClient) {
    sseClient.stop();
  }

  updateServiceBadges(
    getSetting('pollingEnabled'),
    getSetting('sseEnabled'),
    getSetting('websocketEnabled')
  );
}

function setWSEnabled(enabled) {
  setSetting('websocketEnabled', enabled);

  if (enabled) {
    if (!wsClient) {
      wsClient = createWebSocketClient(handleTypingUpdate);
    }
    // WebSocket connects automatically when created
  } else if (wsClient) {
    // Note: WebSocket client doesn't have a stop method in current implementation
    // The socket will be garbage collected when wsClient is reassigned
    wsClient = null;
  }

  updateServiceBadges(
    getSetting('pollingEnabled'),
    getSetting('sseEnabled'),
    getSetting('websocketEnabled')
  );
}

// Manual refresh
async function manualRefresh() {
  const refreshBtn = document.getElementById('refreshBtn');
  refreshBtn.classList.add('refreshing');

  try {
    tasks = await fetchTasks();
    refreshBoard();
  } catch (error) {
    console.error('Failed to refresh tasks:', error);
  } finally {
    // Remove class after animation completes
    setTimeout(() => {
      refreshBtn.classList.remove('refreshing');
    }, 800);
  }
}

// Initialize services based on saved settings
function initServices() {
  const settings = loadSettings();

  // Initialize toggle UI states
  initToggleStates();

  // Start services based on saved settings
  if (settings.pollingEnabled) {
    poller = createPoller(fetchTaskUpdates, handleTaskUpdates);
    poller.start();
  }

  if (settings.sseEnabled) {
    sseClient = createSSEClient(handleTaskEvent, handleCommentEvent, handleAssignmentEvent);
    sseClient.start();
  }

  if (settings.websocketEnabled) {
    wsClient = createWebSocketClient(handleTypingUpdate);
  }
}

// Initialize
async function init() {
  try {
    // Set first user as default before fetching
    setCurrentUserId('a1b2c3d4-e5f6-7890-abcd-ef1234567890');

    [tasks, users] = await Promise.all([fetchTasks(), fetchUsers()]);

    // Load saved user from localStorage, or fall back to first user
    const savedUserId = getSetting('userId');
    const savedUserExists = savedUserId && users.some(u => u.id === savedUserId);

    if (savedUserExists) {
      setCurrentUserId(savedUserId);
      setApiKeyCookie();
    } else if (users.length > 0) {
      setCurrentUserId(users[0].id);
      setSetting('userId', users[0].id);
      setApiKeyCookie();
    }

    populateUserSelects(users);
    populateHeaderUserSelect(users, getCurrentUserId());
    updateHeaderUserDisplay(users, getCurrentUserId());
    refreshBoard();

    // Initialize real-time services based on saved settings
    initServices();

  } catch (error) {
    console.error('Failed to load data:', error);
    document.getElementById('board').innerHTML = `
      <div class="loading">Failed to load tasks. Make sure the server is running.</div>
    `;
  }
}

init();
