const API_BASE = "/api";

export async function fetchStatistics() {
  const res = await fetch(`${API_BASE}/statistics`);
  if (!res.ok) throw new Error("Failed to fetch statistics");
  return res.json();
}

export async function fetchEvents(limit = 100, event_type = null, severity = null) {
  let url = `${API_BASE}/events?limit=${limit}`;
  if (event_type) url += `&event_type=${event_type}`;
  if (severity) url += `&severity=${severity}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

export async function fetchEventDetails(eventId) {
  const res = await fetch(`${API_BASE}/events/${eventId}`);
  if (!res.ok) throw new Error("Failed to fetch event details");
  return res.json();
}

export async function fetchIncidents(limit = 50) {
  const res = await fetch(`${API_BASE}/incidents?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch incidents");
  return res.json();
}

export async function fetchIncidentDetails(incidentId) {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}`);
  if (!res.ok) throw new Error("Failed to fetch incident details");
  return res.json();
}

export async function updateIncidentStatus(incidentId, status) {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error("Failed to update incident status");
  return res.json();
}

export async function fetchAlerts(limit = 50) {
  const res = await fetch(`${API_BASE}/alerts?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}

export async function fetchContainmentStatus() {
  const res = await fetch(`${API_BASE}/containment`);
  if (!res.ok) throw new Error("Failed to fetch containment status");
  return res.json();
}

export async function manualContain(sourceIp, reason, durationSeconds = 60) {
  const res = await fetch(`${API_BASE}/containment/block`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source_ip: sourceIp, reason, duration_seconds: durationSeconds })
  });
  if (!res.ok) throw new Error("Failed to trigger containment");
  return res.json();
}

export async function manualUnblock(sourceIp, reason = "Manual analyst release") {
  const res = await fetch(`${API_BASE}/containment/unblock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source_ip: sourceIp, reason })
  });
  if (!res.ok) throw new Error("Failed to release containment");
  return res.json();
}

export async function fetchSystemStatus() {
  const res = await fetch(`${API_BASE}/system-status`);
  if (!res.ok) throw new Error("Failed to fetch system status");
  return res.json();
}

export async function runSimulation(type, payload = {}) {
  const endpointMap = {
    "sqli": "/simulator/sql-injection",
    "idor": "/simulator/idor",
    "xss": "/simulator/xss",
    "multistep": "/simulator/multi-step",
    "demo": "/simulator/demo"
  };
  const path = endpointMap[type] || "/simulator/demo";
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Simulation ${type} failed`);
  return res.json();
}

export async function runStressTest(requests = 100, concurrency = 5) {
  const res = await fetch(`${API_BASE}/stress-test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requests, concurrency })
  });
  if (!res.ok) throw new Error("Stress test failed");
  return res.json();
}

export async function resetDemoData() {
  const res = await fetch(`${API_BASE}/reset-demo`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to reset demo data");
  return res.json();
}

// AI Security Analyst API
export async function analyzeIncidentWithAI(incidentId) {
  const res = await fetch(`${API_BASE}/ai/analyze-incident`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ incident_id: incidentId })
  });
  if (!res.ok) throw new Error("Failed to analyze incident with AI");
  return res.json();
}

export async function chatWithAIAnalyst(message, context = {}) {
  const res = await fetch(`${API_BASE}/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, context })
  });
  if (!res.ok) throw new Error("AI Analyst chat failed");
  return res.json();
}

export async function explainEventWithAI(event) {
  const res = await fetch(`${API_BASE}/ai/explain-event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event })
  });
  if (!res.ok) throw new Error("Failed to explain event with AI");
  return res.json();
}

