let _pollTimer = null;

function stopPolling() {
  if (_pollTimer) {
    clearInterval(_pollTimer);
    _pollTimer = null;
  }
}

function startPolling(jobId, intervalMs, onUpdate, onDone) {
  stopPolling();
  _pollTimer = setInterval(async () => {
    try {
      const job = await pollJob(jobId);
      onUpdate(job);
      if (job.status === "completed" || job.status === "failed") {
        stopPolling();
        onDone(job);
      }
    } catch (e) {
      console.error("Poll error:", e);
    }
  }, intervalMs);
}

function startCpuPolling(jobId, onUpdate, onDone) {
  startPolling(jobId, 3000, onUpdate, onDone);
}

function startColabPolling(jobId, onUpdate, onDone) {
  startPolling(jobId, 30000, onUpdate, onDone);
}
