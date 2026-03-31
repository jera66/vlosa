/* ========================================================================== */
/* VLOSA — USER PROFILE API ROUTE (BACKEND)                                   */
/* -------------------------------------------------------------------------- */
/* This route stores “extra” profile fields that are NOT part of auth itself: */
/* - first_name                                                               */
/* - last_name                                                                */
/* - phone                                                                    */
/*                                                                            */
/* Why a separate table?                                                      */
/* - Anything’s auth system is internal, and we avoid depending on its schema.*/
/* - We still want richer user info for the VLOSA machine.                    */
/*                                                                            */
/* Endpoints:                                                                 */
/* - POST /api/los/user-profile                                               */
/*   Public (no auth). Used by the Sign Up form BEFORE the user exists.       */
/*   Saves data keyed by email ("pending profile").                           */
/*                                                                            */
/* - GET /api/los/user-profile                                                */
/*   Auth required. Returns the profile for the current signed-in user.       */
/*   If there is a pending profile with the same email, we link it to userId. */
/*                                                                            */
/* - PUT /api/los/user-profile                                                */
/*   Auth required. Updates the signed-in user’s profile.                      */
/* ========================================================================== */

/* =============================== Imports ================================== */

import sql from "@/app/api/utils/sql"; // Postgres helper.
import { auth } from "@/auth"; // Anything auth session reader.

/* ============================== Helpers =================================== */

function normalizeEmail(value) {
  // Convert any input to a safe, trimmed email string.
  const text = value === null || value === undefined ? "" : String(value); // Cast.
  const trimmed = text.trim().toLowerCase(); // Normalize.
  return trimmed; // Return.
}

function normalizeText(value) {
  // Convert any input to a safe, trimmed string.
  const text = value === null || value === undefined ? "" : String(value); // Cast.
  const trimmed = text.trim(); // Trim.
  return trimmed; // Return.
}

function jsonError(message, status) {
  // Return a consistent JSON error response.
  return Response.json({ error: message }, { status }); // Build response.
}

/* ================================= POST ================================== */

export async function POST(request) {
  // Handle POST /api/los/user-profile (public, used by Sign Up page).

  const body = await request.json(); // Parse JSON body.

  const email = normalizeEmail(body?.email); // Email key.
  const firstName = normalizeText(body?.first_name); // First name.
  const lastName = normalizeText(body?.last_name); // Last name.
  const phone = normalizeText(body?.phone); // Phone (optional).

  if (!email) {
    // Validate email.
    return jsonError("Email is required", 400); // 400 bad request.
  }
  if (!firstName) {
    // Validate first.
    return jsonError("First name is required", 400); // 400.
  }
  if (!lastName) {
    // Validate last.
    return jsonError("Last name is required", 400); // 400.
  }

  const rows = await sql(
    // Upsert keyed by email.
    "\n      INSERT INTO los_user_profiles (email, user_id, first_name, last_name, phone)\n      VALUES ($1, NULL, $2, $3, $4)\n      ON CONFLICT (email)\n      DO UPDATE SET\n        first_name = EXCLUDED.first_name,\n        last_name = EXCLUDED.last_name,\n        phone = EXCLUDED.phone,\n        updated_at = NOW()\n      RETURNING *\n    ",
    [email, firstName, lastName, phone || null],
  ); // Execute.

  const profile = rows[0] || null; // Extract first row.

  return Response.json({ profile }); // Return profile.
}

/* ================================== GET ================================== */

export async function GET() {
  // Handle GET /api/los/user-profile (requires auth).

  const session = await auth(); // Read session.
  const user = session?.user || null; // Pull user.

  if (!user?.id) {
    // Must be signed in.
    return jsonError("Unauthorized", 401); // 401.
  }

  const userId = String(user.id); // Normalize id.
  const email = normalizeEmail(user.email); // Normalize email.

  // 1) If a profile is already linked to this userId, return it.
  const linkedRows = await sql(
    "SELECT * FROM los_user_profiles WHERE user_id = $1 LIMIT 1",
    [userId],
  ); // Query.

  if (linkedRows.length > 0) {
    // If found...
    return Response.json({ profile: linkedRows[0] }); // Return.
  }

  // 2) If we have an email, try to link a pending profile (same email, no user_id).
  if (email) {
    // Only if we have email.
    const pendingRows = await sql(
      "SELECT * FROM los_user_profiles WHERE email = $1 AND user_id IS NULL LIMIT 1",
      [email],
    ); // Query.

    if (pendingRows.length > 0) {
      // If a pending profile exists...
      await sql(
        "UPDATE los_user_profiles SET user_id = $1, updated_at = NOW() WHERE email = $2 AND user_id IS NULL",
        [userId, email],
      ); // Link it.

      const newlyLinked = await sql(
        "SELECT * FROM los_user_profiles WHERE user_id = $1 LIMIT 1",
        [userId],
      ); // Re-fetch.

      return Response.json({ profile: newlyLinked[0] || null }); // Return.
    }
  }

  // 3) No profile exists yet.
  return Response.json({ profile: null }); // Return null (UI can prompt later).
}

/* ================================== PUT ================================== */

export async function PUT(request) {
  // Handle PUT /api/los/user-profile (requires auth).

  const session = await auth(); // Read session.
  const user = session?.user || null; // Pull user.

  if (!user?.id) {
    // Must be signed in.
    return jsonError("Unauthorized", 401); // 401.
  }

  const userId = String(user.id); // Normalize id.
  const email = normalizeEmail(user.email); // Normalize email.

  const body = await request.json(); // Parse JSON.

  const firstName =
    body?.first_name !== undefined ? normalizeText(body.first_name) : undefined; // Optional.
  const lastName =
    body?.last_name !== undefined ? normalizeText(body.last_name) : undefined; // Optional.
  const phone =
    body?.phone !== undefined ? normalizeText(body.phone) : undefined; // Optional.

  // Ensure we have a row to update.
  const existingRows = await sql(
    "SELECT * FROM los_user_profiles WHERE user_id = $1 LIMIT 1",
    [userId],
  ); // Query.

  const exists = existingRows.length > 0; // Boolean.

  if (!exists) {
    // If no row exists, we can only create it if we have required fields.
    if (!email) {
      // Email is required for creation.
      return jsonError("Could not create profile (missing email)", 400); // 400.
    }
    if (!firstName || !lastName) {
      // Names required for creation.
      return jsonError("First name and last name are required", 400); // 400.
    }

    const createdRows = await sql(
      "\n        INSERT INTO los_user_profiles (email, user_id, first_name, last_name, phone)\n        VALUES ($1, $2, $3, $4, $5)\n        RETURNING *\n      ",
      [email, userId, firstName, lastName, phone || null],
    ); // Insert.

    return Response.json({ profile: createdRows[0] || null }); // Return.
  }

  // Build a safe partial update (no destructive overwrites).
  const setParts = []; // Collect SET parts.
  const values = []; // Collect values.
  let idx = 1; // Placeholder counter.

  if (typeof firstName === "string" && firstName.length > 0) {
    // If updating first name...
    setParts.push(`first_name = $${idx}`); // Add.
    values.push(firstName); // Add value.
    idx += 1; // Increment.
  }

  if (typeof lastName === "string" && lastName.length > 0) {
    // If updating last name...
    setParts.push(`last_name = $${idx}`); // Add.
    values.push(lastName); // Add value.
    idx += 1; // Increment.
  }

  if (phone !== undefined) {
    // If phone provided (may be empty to clear).
    setParts.push(`phone = $${idx}`); // Add.
    values.push(phone ? phone : null); // Null clears.
    idx += 1; // Increment.
  }

  if (setParts.length === 0) {
    // Nothing to update.
    return Response.json({ profile: existingRows[0] }); // Return existing.
  }

  setParts.push("updated_at = NOW()"); // Always update timestamp.

  values.push(userId); // WHERE param.

  const query = `UPDATE los_user_profiles SET ${setParts.join(", ")} WHERE user_id = $${idx} RETURNING *`; // SQL.

  const updatedRows = await sql(query, values); // Execute update.

  return Response.json({ profile: updatedRows[0] || null }); // Return.
}



