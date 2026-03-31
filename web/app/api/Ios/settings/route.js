/* ========================================================================== */
/* VLOSA — SETTINGS API ROUTE                                                */
/* -------------------------------------------------------------------------- */
/* GET  /api/los/settings                                                     */
/*   -> returns machine settings for the current signed-in user                */
/* PUT  /api/los/settings                                                     */
/*   -> updates machine settings for the current signed-in user                */
/*                                                                            */
/* Settings stored here are “machine-wide” (shared by web + mobile):           */
/* - automation_posture: "approval_first" | "auto_run"                         */
/* - quiet_hours_start / quiet_hours_end: time strings                         */
/* - rules: JSON blob (Rules Engine v1)                                       */
/*                                                                            */
/* Auth:                                                                      */
/* - This route is protected (requires a logged-in user).                      */
/* ========================================================================== */

/* =============================== Imports ================================== */

import sql from "@/app/api/utils/sql"; // Import Postgres helper.
import { ensureSettingsRow, getLosContext, logActivity } from "../_utils"; // Import shared LOS helpers.

/* ============================== Constants ================================= */

function defaultRules() {
  // Build a default “Rules Engine v1” object.
  return {
    // Return object.
    communications: {
      // Communication boundaries.
      neverRespondToUnknownNumbers: true, // Safe default.
      allowedWindowStart: "08:00", // Allowed start time.
      allowedWindowEnd: "21:00", // Allowed end time.
    }, // End communications.
    scheduling: {
      // Scheduling boundaries.
      neverScheduleOnSaturdays: true, // Example rule.
    }, // End scheduling.
    email: {
      // Email automation permissions.
      draftEmailsAutomatically: true, // Drafts are low-risk.
      sendEmailsWithoutApproval: false, // Sending is higher risk.
    }, // End email.
  }; // End return.
}

function mergeRules(existingRules, patchRules) {
  // Merge rules in a junior-friendly, predictable way.
  const base =
    existingRules && typeof existingRules === "object" ? existingRules : {}; // Normalize base.
  const patch = patchRules && typeof patchRules === "object" ? patchRules : {}; // Normalize patch.
  return {
    // Shallow merge top level.
    ...base, // Keep old top-level sections.
    ...patch, // Overwrite top-level sections provided.
    communications: {
      // Merge nested communications.
      ...(base.communications || {}), // Keep existing.
      ...(patch.communications || {}), // Apply patch.
    }, // End communications.
    scheduling: {
      // Merge nested scheduling.
      ...(base.scheduling || {}), // Keep existing.
      ...(patch.scheduling || {}), // Apply patch.
    }, // End scheduling.
    email: {
      // Merge nested email.
      ...(base.email || {}), // Keep existing.
      ...(patch.email || {}), // Apply patch.
    }, // End email.
  }; // End return.
}

/* ================================ GET ===================================== */

export async function GET() {
  // Handle GET /api/los/settings.

  const ctx = await getLosContext({ requireAuth: true }); // Require a signed-in user.
  if (!ctx.ok) {
    // If not signed in...
    return ctx.unauthorizedResponse; // Return 401.
  }

  const profileKey = ctx.profileKey; // Read profile key.
  const userId = ctx.userId; // Read user id.

  await ensureSettingsRow(profileKey, userId); // Ensure row exists.

  const rows =
    await sql`SELECT * FROM los_settings WHERE profile_key = ${profileKey} LIMIT 1`; // Fetch row.
  const settings = rows[0] || null; // Pull first row.

  const rules = settings && settings.rules ? settings.rules : defaultRules(); // Ensure rules exist.

  if (settings && !settings.rules) {
    // If settings exists but rules missing, backfill defaults.
    await sql`UPDATE los_settings SET rules = ${rules}, updated_at = NOW() WHERE profile_key = ${profileKey}`; // Backfill.
  }

  const safeSettings = settings ? { ...settings, rules } : null; // Return settings with guaranteed rules.

  return Response.json({ settings: safeSettings }); // Return JSON.
}

/* ================================ PUT ===================================== */

export async function PUT(request) {
  // Handle PUT /api/los/settings.

  const ctx = await getLosContext({ requireAuth: true }); // Require auth.
  if (!ctx.ok) {
    // If unauthorized...
    return ctx.unauthorizedResponse; // Return 401.
  }

  const profileKey = ctx.profileKey; // Profile key.
  const userId = ctx.userId; // User id.

  await ensureSettingsRow(profileKey, userId); // Ensure row exists.

  const body = await request.json(); // Parse JSON.

  const automationPosture = body?.automation_posture; // Read posture.
  const quietHoursStart = body?.quiet_hours_start; // Read quiet start.
  const quietHoursEnd = body?.quiet_hours_end; // Read quiet end.
  const rulesPatch = body?.rules; // Read rules patch.

  const currentRows =
    await sql`SELECT * FROM los_settings WHERE profile_key = ${profileKey} LIMIT 1`; // Fetch existing.
  const current = currentRows[0] || null; // Normalize.

  const currentRules =
    current && current.rules ? current.rules : defaultRules(); // Normalize existing rules.
  const nextRules = rulesPatch
    ? mergeRules(currentRules, rulesPatch)
    : currentRules; // Merge rules if provided.

  const setParts = []; // Collect SET expressions.
  const values = []; // Collect values.
  let idx = 1; // Placeholder index.

  if (typeof automationPosture === "string" && automationPosture.length > 0) {
    // If posture provided...
    setParts.push(`automation_posture = $${idx}`); // Add posture.
    values.push(automationPosture); // Add value.
    idx += 1; // Increment.
  }

  if (typeof quietHoursStart === "string" && quietHoursStart.length > 0) {
    // If quiet start provided...
    setParts.push(`quiet_hours_start = $${idx}`); // Add.
    values.push(quietHoursStart); // Add.
    idx += 1; // Increment.
  }

  if (typeof quietHoursEnd === "string" && quietHoursEnd.length > 0) {
    // If quiet end provided...
    setParts.push(`quiet_hours_end = $${idx}`); // Add.
    values.push(quietHoursEnd); // Add.
    idx += 1; // Increment.
  }

  if (rulesPatch && typeof rulesPatch === "object") {
    // If rules patch provided...
    setParts.push(`rules = $${idx}`); // Add rules.
    values.push(nextRules); // Add JSON.
    idx += 1; // Increment.
  }

  if (setParts.length > 0) {
    // Only if we are updating...
    setParts.push("updated_at = NOW()"); // Always bump updated_at.
  }

  if (setParts.length === 0) {
    // If no valid fields...
    const rows =
      await sql`SELECT * FROM los_settings WHERE profile_key = ${profileKey} LIMIT 1`; // Re-fetch.
    const settings = rows[0] || null; // Normalize.
    const rules = settings && settings.rules ? settings.rules : defaultRules(); // Guarantee rules.
    return Response.json({
      settings: settings ? { ...settings, rules } : null,
    }); // Return.
  }

  values.push(profileKey); // WHERE value.

  const query = `UPDATE los_settings SET ${setParts.join(", ")} WHERE profile_key = $${idx} RETURNING *`; // Build SQL.

  const updatedRows = await sql(query, values); // Execute.
  const settings = updatedRows[0] || null; // Normalize.

  await logActivity({
    // Write audit log.
    profileKey, // Profile.
    userId, // User.
    actionType: "settings.update", // Type.
    message: "Updated system settings", // Message.
    metadata: {
      // Extra context.
      automationPosture, // New posture.
      quietHoursStart, // New quiet start.
      quietHoursEnd, // New quiet end.
      rules: rulesPatch ? nextRules : undefined, // Only include rules if changed.
    }, // End metadata.
  }); // End log.

  const safeSettings = settings
    ? { ...settings, rules: settings.rules || nextRules }
    : null; // Ensure rules exist.

  return Response.json({ settings: safeSettings }); // Return JSON.
}



