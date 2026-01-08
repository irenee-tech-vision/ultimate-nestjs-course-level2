// WebSocket module - real-time typing indicators via Socket.io

function createWebSocketClient(onTypingUpdate) {
  let socket = null;
  let currentTaskId = null;
  let currentUserId = null;
  let currentUserName = null;
  let typingTimeout = null;
  let isTyping = false;
  const TYPING_TIMEOUT_MS = 1500;

  // Check if Socket.io is available
  if (typeof io === 'undefined') {
    console.warn('Socket.io not available - typing indicators disabled');
  } else {
    socket = io();

    // Log client ID once connected
    socket.on('connect', () => {
      console.log('WebSocket connected for typing indicators');
      console.log('Client ID:', socket.id);

      setTimeout(() => {
        socket.emit('ping', { timestamp: Date.now() });
      }, 5000);
    });

    // Listen for typing updates from other users
    socket.on('typing:update', (data) => {
      onTypingUpdate(data.data);
    });
  }

  function setContext(taskId, userId, userName) {
    // If switching tasks while typing, stop typing on the previous one
    if (currentTaskId && currentTaskId !== taskId && isTyping) {
      stopTyping();
    }
    currentTaskId = taskId;
    currentUserId = userId;
    currentUserName = userName;
  }

  function clearContext() {
    if (isTyping) {
      stopTyping();
    }
    currentTaskId = null;
  }

  function startTyping() {
    if (!socket || !currentTaskId || !currentUserId) return;

    // Only emit if not already typing
    if (!isTyping) {
      isTyping = true;
      socket.emit('typing:start', {
        taskId: currentTaskId,
        userId: currentUserId,
        userName: currentUserName,
      });
    }

    // Reset the auto-stop timeout
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(stopTyping, TYPING_TIMEOUT_MS);
  }

  function stopTyping() {
    if (!socket || !currentTaskId || !currentUserId || !isTyping) return;

    clearTimeout(typingTimeout);
    isTyping = false;
    socket.emit('typing:stop', {
      taskId: currentTaskId,
      userId: currentUserId,
    });
  }

  function isConnected() {
    return socket && socket.connected;
  }

  return { setContext, clearContext, startTyping, stopTyping, isConnected };
}
