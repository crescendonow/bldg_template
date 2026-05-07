const API_BASE = window.BLDG_API_BASE || "";

async function submitExtract(roiGeojson, method, options, formats) {
  const resp = await fetch(`${API_BASE}/api/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      roi_geojson: roiGeojson,
      method,
      formats,
      ...options,
    }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: resp.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return resp.json();
}

async function pollJob(jobId) {
  const resp = await fetch(`${API_BASE}/api/jobs/${jobId}`);
  if (!resp.ok) throw new Error("Failed to fetch job status");
  return resp.json();
}

function getDownloadUrl(jobId, fmt) {
  return `${API_BASE}/api/download/${jobId}/${fmt}`;
}
