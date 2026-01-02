// SSE module - Server-Sent Events for real-time updates

function createSSEClient(onTaskUpdate, onCommentUpdate, onAssignment) {
  let eventSource = null;

  function start() {
    if (eventSource) return;

    eventSource = new EventSource('/api/events', { withCredentials: true });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.domain === 'task') {
          if (data.type === 'assigned') {
            onAssignment(data.payload);
          } else {
            onTaskUpdate(data.type, data.payload);
          }
        } else if (data.domain === 'comment') {
          onCommentUpdate(data.type, data.payload);
        }
      } catch (e) {
        console.error('Could not parse SSE event:', event.data);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      // Browser will auto-reconnect
    };
  }

  function stop() {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  }

  function isConnected() {
    return eventSource !== null && eventSource.readyState === EventSource.OPEN;
  }

  // Auto-pause when tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  function reconnect() {
    stop();
    start();
  }

  return { start, stop, reconnect, isConnected };
}
