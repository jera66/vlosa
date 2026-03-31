/* ========================================================================== */ // File banner line 1.
/* VLOSA — MOBILE API CLIENT                                                  */ // File banner line 2.
/* -------------------------------------------------------------------------- */ // File banner line 3.
/* This file centralizes ALL fetch() calls for the Expo app.                   */ // File banner line 4.
/*                                                                            */ // File banner line 5.
/* Why?                                                                        */ // File banner line 6.
/* - Keeps screens smaller and easier to understand.                           */ // File banner line 7.
/* - Gives you one place to change error handling later.                       */ // File banner line 8.
/*                                                                            */ // File banner line 9.
/* IMPORTANT:                                                                   */ // File banner line 10.
/* - All URLs are relative ("/api/..."), which Anything routes correctly.      */ // File banner line 11.
/* - If a route returns non-2xx, we throw, and screens show the error.         */ // File banner line 12.
/* ========================================================================== */ // File banner line 13.

/* =============================== Helpers ================================== */ // Section header.

export async function fetchJson(url, options) {
  // Define a helper that fetches JSON.
  // Fetch JSON and throw if not OK. // Explain intent.
  const response = await fetch(url, options); // Make the HTTP request.

  const contentType = response.headers.get("content-type") || ""; // Detect JSON.

  const tryReadJson = async () => {
    // Try to read JSON when possible.
    if (contentType.includes("application/json")) {
      return response.json();
    }
    return null;
  };

  if (!response.ok) {
    // If we got a non-2xx response...
    let serverMessage = ""; // Human message.
    let rawText = ""; // Fallback text.

    try {
      // First try JSON.
      const json = await tryReadJson();
      if (json && typeof json.error === "string") {
        serverMessage = json.error;
      } else if (json && typeof json.message === "string") {
        serverMessage = json.message;
      }
    } catch (e) {
      // Ignore JSON parse errors.
    }

    if (!serverMessage) {
      // If no JSON message, try plain text.
      try {
        rawText = await response.text();
      } catch (e) {
        rawText = "";
      }
    }

    const nice =
      serverMessage || rawText || response.statusText || "Request failed"; // Choose.

    throw new Error(`${nice} (HTTP ${response.status})`); // Throw clean message.
  }

  // If OK, return JSON (or null).
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return null;
}

/* ============================== Settings ================================== */ // Section header.

export async function getLosSettings() {
  // Load shared machine settings.
  // GET settings. // Explain.
  const data = await fetchJson("/api/los/settings"); // Call backend.
  return data.settings; // Return the settings row.
} // End getLosSettings. // Explain.

export async function updateLosSettings(payload) {
  // Update shared machine settings.
  // PUT settings. // Explain.
  const data = await fetchJson("/api/los/settings", {
    // Call backend.
    method: "PUT", // Update.
    headers: { "Content-Type": "application/json" }, // JSON.
    body: JSON.stringify(payload), // Serialize.
  }); // End request.
  return data.settings; // Return updated row.
} // End updateLosSettings. // Explain.

/* ================================ Tasks =================================== */ // Section header.

export async function listLosTasks() {
  // List tasks.
  // GET tasks. // Explain.
  const data = await fetchJson("/api/los/tasks"); // Call.
  return data.tasks || []; // Normalize list.
} // End listLosTasks. // Explain.

export async function createLosTask(payload) {
  // Create a new task.
  // POST task. // Explain.
  const data = await fetchJson("/api/los/tasks", {
    // Call.
    method: "POST", // Create.
    headers: { "Content-Type": "application/json" }, // JSON.
    body: JSON.stringify(payload), // Serialize.
  }); // End.
  return data.task; // Return created task.
} // End createLosTask. // Explain.

export async function updateLosTask(id, payload) {
  // Update a task by id.
  // PUT task. // Explain.
  const data = await fetchJson(`/api/los/tasks/${encodeURIComponent(id)}`, {
    // Call.
    method: "PUT", // Update.
    headers: { "Content-Type": "application/json" }, // JSON.
    body: JSON.stringify(payload), // Serialize.
  }); // End.
  return data.task; // Return updated task.
} // End updateLosTask. // Explain.

export async function deleteLosTask(id) {
  // Delete a task by id.
  // DELETE task. // Explain.
  const data = await fetchJson(`/api/los/tasks/${encodeURIComponent(id)}`, {
    // Call.
    method: "DELETE", // Delete.
  }); // End.
  return data.task; // Return deleted task (for UI).
} // End deleteLosTask. // Explain.

/* =============================== Persona ================================== */ // Section header.

export async function getLosPersona() {
  // Load persona.
  // GET persona. // Explain.
  const data = await fetchJson("/api/los/persona"); // Call.
  return data.persona; // Return.
} // End getLosPersona. // Explain.

export async function updateLosPersona(payload) {
  // Update persona.
  // PUT persona. // Explain.
  const data = await fetchJson("/api/los/persona", {
    // Call.
    method: "PUT", // Update.
    headers: { "Content-Type": "application/json" }, // JSON.
    body: JSON.stringify(payload), // Serialize.
  }); // End.
  return data.persona; // Return.
} // End updateLosPersona. // Explain.

/* =============================== Memory ================================== */ // Section header.

export async function listLosMemory() {
  // List memory items.
  // GET memory. // Explain.
  const data = await fetchJson("/api/los/memory"); // Call.
  return data.memories || []; // Normalize.
} // End listLosMemory. // Explain.

export async function createLosMemory(payload) {
  // Create a memory item.
  // POST memory. // Explain.
  const data = await fetchJson("/api/los/memory", {
    // Call.
    method: "POST", // Create.
    headers: { "Content-Type": "application/json" }, // JSON.
    body: JSON.stringify(payload), // Serialize.
  }); // End.
  return data.memory; // Return.
} // End createLosMemory. // Explain.

export async function updateLosMemory(id, payload) {
  // Update memory.
  // PUT memory. // Explain.
  const data = await fetchJson(`/api/los/memory/${encodeURIComponent(id)}`, {
    // Call.
    method: "PUT", // Update.
    headers: { "Content-Type": "application/json" }, // JSON.
    body: JSON.stringify(payload), // Serialize.
  }); // End.
  return data.memory; // Return.
} // End updateLosMemory. // Explain.

export async function deleteLosMemory(id) {
  // Delete memory.
  // DELETE memory. // Explain.
  const data = await fetchJson(`/api/los/memory/${encodeURIComponent(id)}`, {
    // Call.
    method: "DELETE", // Delete.
  }); // End.
  return data.memory; // Return.
} // End deleteLosMemory. // Explain.

/* =============================== Activity ================================= */ // Section header.

export async function listLosActivity() {
  // List activity log.
  // GET activity. // Explain.
  const data = await fetchJson("/api/los/activity?limit=80"); // Call.
  return data.activity || []; // Normalize.
} // End listLosActivity. // Explain.

/* ================================ Inbox =================================== */ // Section header.

export async function listLosInboxItems() {
  // List inbox items.
  // GET inbox. // Explain.
  const data = await fetchJson("/api/los/inbox"); // Call.
  return data.items || []; // Normalize.
} // End listLosInboxItems. // Explain.

export async function createLosInboxItem(payload) {
  // Create inbox item.
  // POST inbox. // Explain.
  const data = await fetchJson("/api/los/inbox", {
    // Call.
    method: "POST", // Create.
    headers: { "Content-Type": "application/json" }, // JSON.
    body: JSON.stringify(payload), // Serialize.
  }); // End.
  return data.item; // Return.
} // End createLosInboxItem. // Explain.

export async function updateLosInboxItem(id, payload) {
  // Update inbox item.
  // PUT inbox. // Explain.
  const data = await fetchJson(`/api/los/inbox/${encodeURIComponent(id)}`, {
    // Call.
    method: "PUT", // Update.
    headers: { "Content-Type": "application/json" }, // JSON.
    body: JSON.stringify(payload), // Serialize.
  }); // End.
  return data.item; // Return.
} // End updateLosInboxItem. // Explain.

export async function deleteLosInboxItem(id) {
  // Delete inbox item.
  // DELETE inbox. // Explain.
  const data = await fetchJson(`/api/los/inbox/${encodeURIComponent(id)}`, {
    // Call.
    method: "DELETE", // Delete.
  }); // End.
  return data.item; // Return.
} // End deleteLosInboxItem. // Explain.

export async function generateInboxAiDraft(id) {
  // Ask backend to generate an AI draft for one inbox item.
  // POST AI draft generator. // Explain.
  const data = await fetchJson(
    `/api/los/inbox/${encodeURIComponent(id)}/ai-draft`,
    {
      // Call.
      method: "POST", // POST.
    },
  ); // End.
  return data.item; // Return updated item (ai_summary + suggested_reply).
} // End generateInboxAiDraft. // Explain.

/* =========================== Gmail Integration ============================ */ // Section header.

export async function getGmailStatus() {
  // Ask server if Gmail is connected.
  // GET Gmail connection status. // Explain.
  const data = await fetchJson("/api/integrations/gmail/status"); // Call.
  return data; // Return full status payload.
} // End getGmailStatus. // Explain.

export async function getGmailConnectUrl() {
  // Ask server for Google OAuth URL.
  // GET connect URL. // Explain.
  const data = await fetchJson("/api/integrations/gmail/connect"); // Call.
  return data.url; // Return URL string.
} // End getGmailConnectUrl. // Explain.

export async function syncGmail(payload) {
  // Trigger a Gmail sync.
  // POST Gmail sync. // Explain.
  const data = await fetchJson("/api/integrations/gmail/sync", {
    // Call.
    method: "POST", // POST.
    headers: { "Content-Type": "application/json" }, // JSON.
    body: JSON.stringify(payload || {}), // Payload (ex: {limit: 20}).
  }); // End.
  return data; // Return results (inserted/skipped).
} // End syncGmail. // Explain.

export async function disconnectGmail() {
  // Disconnect Gmail.
  // POST Gmail disconnect. // Explain.
  const data = await fetchJson("/api/integrations/gmail/disconnect", {
    // Call.
    method: "POST", // POST.
  }); // End.
  return data; // Return result.
} // End disconnectGmail. // Explain.

export async function sendInboxReplyGmail(id) {
  // Send an approved reply via Gmail.
  const data = await fetchJson(
    `/api/los/inbox/${encodeURIComponent(id)}/send`,
    {
      method: "POST",
    },
  );
  return data;
}



