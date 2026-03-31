/* ========================================================================== */
/* VLOSA — API UTILITIES (BACKEND)                                            */
/* -------------------------------------------------------------------------- */
/* This file exists to keep shared backend logic in ONE place.                 */
/*                                                                            */
/* What lives here:                                                            */
/* - How we figure out “who is the current user?” (auth)                       */
/* - How we map a user -> a profile_key (our LOS data partition key)           */
/* - Audit logging (activity log)                                              */
/* - “Ensure row exists” helpers                                               */
/*                                                                            */
/* Big design point:                                                           */
/* - With User Accounts enabled, each signed-in user gets their OWN profile.   */
/* - We keep using profile_key everywhere so the rest of the DB stays simple. */
/* ========================================================================== */

/* =============================== Imports ================================== */

import sql from "@/app/api/utils/sql"; // Import our Postgres helper (server-side only).
import { auth } from "@/auth"; // Import Anything/NextAuth session reader.

/* ============================ Profile Keys ================================ */

export const DEFAULT_PROFILE_KEY = "default"; // Legacy single-user profile key (kept for safety).

export function profileKeyForUserId(userId) {
  // Build a stable profile key string for a given user id.
  return `user:${String(userId)}`; // Prefix avoids collisions and keeps keys readable.
}

/* =========================== Auth / Context =============================== */

export async function getLosContext(options) {
  // Get the “LOS context” for the current request.
  const requireAuth = options?.requireAuth !== false; // Default: require auth unless explicitly disabled.
  const session = await auth(); // Read session from Anything auth.
  const userId =
    session?.user?.id !== undefined && session?.user?.id !== null
      ? String(session.user.id)
      : null; // Normalize id -> string.
  const profileKey = userId ? profileKeyForUserId(userId) : DEFAULT_PROFILE_KEY; // Use per-user key when signed in.
  const isAuthenticated = !!userId; // Boolean “is signed in”.
  if (requireAuth && !isAuthenticated) {
    // If this route requires auth and we do not have it...
    return {
      // Return a structured context object.
      ok: false, // Not ok.
      session, // Session (likely null).
      userId: null, // No user.
      profileKey: null, // No profile.
      unauthorizedResponse: Response.json(
        { error: "Unauthorized" },
        { status: 401 },
      ), // Standard 401 response.
    }; // End return.
  }
  return {
    // Success context.
    ok: true, // Good.
    session, // Session object.
    userId, // User id string.
    profileKey, // Profile key string.
    unauthorizedResponse: null, // No error response.
  }; // End return.
}

/* ============================= Activity Log =============================== */

export async function logActivity(payload) {
  // Insert one activity log entry.
  const profileKey = payload?.profileKey; // Profile partition.
  const userId = payload?.userId || null; // User id for convenience.
  const actionType = payload?.actionType; // Machine-readable action type.
  const message = payload?.message; // Human-readable message.
  const metadata = payload?.metadata || null; // Optional JSON metadata.

  if (!profileKey) {
    // Validate required input.
    throw new Error("logActivity requires profileKey"); // Fail fast.
  }
  if (!actionType) {
    // Validate required input.
    throw new Error("logActivity requires actionType"); // Fail fast.
  }
  if (!message) {
    // Validate required input.
    throw new Error("logActivity requires message"); // Fail fast.
  }

  await sql`INSERT INTO los_activity_log (profile_key, user_id, action_type, message, metadata) VALUES (${profileKey}, ${userId}, ${actionType}, ${message}, ${metadata})`; // Write the log row.
}

/* ============================ Ensure Rows ================================ */

export async function ensureSettingsRow(profileKey, userId) {
  // Ensure a los_settings row exists for this profile.
  await sql`INSERT INTO los_settings (profile_key, user_id) VALUES (${profileKey}, ${userId || null}) ON CONFLICT (profile_key) DO NOTHING`; // Insert if missing.
}

export async function ensurePersonaRow(profileKey, userId) {
  // Ensure a los_persona row exists for this profile.
  await sql`INSERT INTO los_persona (profile_key, user_id) VALUES (${profileKey}, ${userId || null}) ON CONFLICT (profile_key) DO NOTHING`; // Insert if missing.
}



