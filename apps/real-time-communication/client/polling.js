// Polling module - periodic fetching of task updates

function createPoller(fetchFn, onUpdate, intervalMs = 1000) {
  let pollInterval = null;
  let lastPollTime = null;

  function start() {
    if (pollInterval) return;

    lastPollTime = new Date().toISOString();

    pollInterval = setInterval(async () => {
      try {
        const data = await fetchFn(lastPollTime);
        lastPollTime = new Date().toISOString();

        if (data.length > 0) {
          onUpdate(data);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, intervalMs);
  }

  function stop() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  function isRunning() {
    return pollInterval !== null;
  }

  // Auto-pause when tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  return { start, stop, isRunning };
}
