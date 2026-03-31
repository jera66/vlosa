// ============================= Time Helpers ==============================

export function safeTimeString(value, fallback) {
  const text = value === null || value === undefined ? "" : String(value);
  const trimmed = text.trim();
  const base = trimmed.length >= 5 ? trimmed.slice(0, 5) : trimmed;
  return base || fallback;
}

// =========================== User Name Helpers ===========================

export function computeFirstName(user) {
  // Compute a "first name" suitable for UI labels.
  const rawName = user?.name ? String(user.name).trim() : ""; // Name.
  const rawEmail = user?.email ? String(user.email).trim() : ""; // Email.

  if (rawName) {
    // Prefer real name.
    const parts = rawName.split(/\s+/).filter(Boolean); // Split on spaces.
    const first = parts.length > 0 ? parts[0] : ""; // First token.
    return first || ""; // Return.
  }

  if (rawEmail) {
    // Fallback: derive from email local-part.
    const local = rawEmail.split("@")[0] || ""; // Before @.
    const token = local.split(/[._-]+/).filter(Boolean)[0] || ""; // First segment.
    const pretty = token ? token[0].toUpperCase() + token.slice(1) : ""; // Capitalize.
    return pretty || ""; // Return.
  }

  return ""; // No name available.
}

export function computeDisplayName(user) {
  const name = user?.name ? String(user.name).trim() : "";
  const email = user?.email ? String(user.email).trim() : "";
  if (name) {
    return name;
  }
  if (email) {
    return email;
  }
  return "";
}

export function computeAvatarText(displayName) {
  const base = displayName || "ME";
  const letters = base.replace(/[^A-Za-z0-9]/g, "");
  const two = letters.slice(0, 2).toUpperCase();
  return two || "ME";
}



