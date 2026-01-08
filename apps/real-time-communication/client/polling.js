// Polling module - periodic fetching of task updates

function createPoller(fetchFn, onUpdate, intervalMs = 1000) {
  let pollInterval = null;

  function start() {
    if (pollInterval) return;

    let lastPollTime;
    pollInterval = setInterval(async () => {
      try {
        const data = await fetchFn(lastPollTime);
        lastPollTime = new Date().toISOString();

        if (data.length > 0) {
          onUpdate(data);
        }
        // hello
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
