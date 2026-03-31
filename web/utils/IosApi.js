/* ========================================================================== */
/* VLOSA — WEB API CLIENT                                                     */
/* -------------------------------------------------------------------------- */
/* Goal: Keep ALL fetch() logic in one place so pages stay readable.           */
/*                                                                            */
/* This file is intentionally very explicit (junior-friendly).                 */
/* ========================================================================== */

/* =============================== Helpers ================================== */

export async function fetchJson(url, options) {
  // Fetch JSON and throw if the response is not OK.
  const response = await fetch(url, options); // Call the backend.
  if (!response.ok) {
    // If the backend returned an error...
    throw new Error(
      `When fetching ${url}, the response was [${response.status}] ${response.statusText}`,
    ); // Throw a helpful message.
  }
  return response.json(); // Parse and return JSON.
}

/* ============================== Settings ================================== */

export async function getLosSettings() {
  // GET settings.
  const data = await fetchJson("/api/los/settings"); // Call endpoint.
  return data.settings; // Return settings.
}

export async function updateLosSettings(payload) {
  // PUT settings.
  const data = await fetchJson("/api/los/settings", {
    method: "PUT", // Update.
    headers: { "Content-Type": "application/json" }, // JSON.
    body: JSON.stringify(payload), // Serialize.
  }); // End call.
  return data.settings; // Return updated.
}

/* =============================== Persona ================================== */

export async function getLosPersona() {
  // GET persona.
  const data = await fetchJson("/api/los/persona"); // Call.
  return data.persona; // Return.
}

export async function updateLosPersona(payload) {
  // PUT persona.
  const data = await fetchJson("/api/los/persona", {
    method: "PUT", // Update.
    headers: { "Content-Type": "application/json" }, // JSON.
    body: JSON.stringify(payload), // Serialize.
  }); // End call.
  return data.persona; // Return.
}

/* ================================ Tasks =================================== */

export async function listLosTasks({ status } = {}) {
  // GET tasks.
  const qs = status ? `?status=${encodeURIComponent(status)}` : ""; // Query string.
  const data = await fetchJson(`/api/los/tasks${qs}`); // Call.
  return data.tasks || []; // Return list.
}

export async function createLosTask(payload) {
  // POST tasks.
  const data = await fetchJson("/api/los/tasks", {
    method: "POST", // Create.
    headers: { "Content-Type": "application/json" }, // JSON.
    body: JSON.stringify(payload), // Serialize.
  }); // End call.
  return data.task; // Return created.
}

export async function updateLosTask(id, payload) {
  // PUT task.
  const data = await fetchJson(`/api/los/tasks/${encodeURIComponent(id)}`, {
    method: "PUT", // Update.
    headers: { "Content-Type": "application/json" }, // JSON.
    body: JSON.stringify(payload), // Serialize.
  }); // End call.
  return data.task; // Return updated.
}

export async function deleteLosTask(id) {
  // DELETE task.
  const data = await fetchJson(`/api/los/tasks/${encodeURIComponent(id)}`, {
    method: "DELETE", // Delete.
  }); // End call.
  return data.task; // Return deleted.
}

/* =============================== Memory ================================== */

export async function listLosMemory() {
  // GET memory.
  const data = await fetchJson("/api/los/memory"); // Call.
  return data.memories || []; // Return list.
}

export async function createLosMemory(payload) {
  // POST memory.
  const data = await fetchJson("/api/los/memory", {
    method: "POST", // Create.
    headers: { "Content-Type": "application/json" }, // JSON.
    body: JSON.stringify(payload), // Serialize.
  }); // End call.
  return data.memory; // Return created.
}

export async function updateLosMemory(id, payload) {
  // PUT memory.
  const data = await fetchJson(`/api/los/memory/${encodeURIComponent(id)}`, {
    method: "PUT", // Update.
    headers: { "Content-Type": "application/json" }, // JSON.
    body: JSON.stringify(payload), // Serialize.
  }); // End call.
  return data.memory; // Return.
}

export async function deleteLosMemory(id) {
  // DELETE memory.
  const data = await fetchJson(`/api/los/memory/${encodeURIComponent(id)}`, {
    method: "DELETE", // Delete.
  }); // End call.
  return data.memory; // Return.
}

/* =============================== Activity ================================= */

export async function listLosActivity({ limit } = {}) {
  // GET activity.
  const qs = limit ? `?limit=${encodeURIComponent(String(limit))}` : ""; // Query.
  const data = await fetchJson(`/api/los/activity${qs}`); // Call.
  return data.activity || []; // Return.
}

/* ================================ Inbox =================================== */

export async function listLosInboxItems({ status } = {}) {
  // GET inbox items.
  const qs = status ? `?status=${encodeURIComponent(status)}` : ""; // Query.
  const data = await fetchJson(`/api/los/inbox${qs}`); // Call.
  return data.items || []; // Return list.
}

export async function getLosInboxItem(id) {
  // GET one inbox item.
  const data = await fetchJson(`/api/los/inbox/${encodeURIComponent(id)}`); // Call.
  return data.item; // Return.
}

export async function createLosInboxItem(payload) {
  // POST inbox item.
  const data = await fetchJson("/api/los/inbox", {
    method: "POST", // Create.
    headers: { "Content-Type": "application/json" }, // JSON.
    body: JSON.stringify(payload), // Serialize.
  }); // End call.
  return data.item; // Return created.
}

export async function updateLosInboxItem(id, payload) {
  // PUT inbox item.
  const data = await fetchJson(`/api/los/inbox/${encodeURIComponent(id)}`, {
    method: "PUT", // Update.
    headers: { "Content-Type": "application/json" }, // JSON.
    body: JSON.stringify(payload), // Serialize.
  }); // End call.
  return data.item; // Return updated.
}

export async function deleteLosInboxItem(id) {
  // DELETE inbox item.
  const data = await fetchJson(`/api/los/inbox/${encodeURIComponent(id)}`, {
    method: "DELETE", // Delete.
  }); // End call.
  return data.item; // Return deleted.
}



