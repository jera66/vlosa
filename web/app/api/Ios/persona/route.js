/* ========================================================================== */
/* VLOSA — PERSONA API ROUTE                                                  */
/* -------------------------------------------------------------------------- */
/* GET /api/los/persona                                                       */
/*   -> returns persona settings for the current signed-in user                */
/* PUT /api/los/persona                                                       */
/*   -> updates persona settings for the current signed-in user                */
/*                                                                            */
/* Persona is how your “digital twin voice” is shaped:                         */
/* - tone                                                                       */
/* - structure                                                                  */
/* - values_and_beliefs                                                         */
/* - phrases_allow / phrases_block                                              */
/*                                                                            */
/* Auth: protected (requires login).                                           */
/* ========================================================================== */

/* =============================== Imports ================================== */

import sql from "@/app/api/utils/sql"; // Postgres helper.
import { ensurePersonaRow, getLosContext, logActivity } from "../_utils"; // Shared LOS helpers.

/* ================================= GET =================================== */

export async function GET() {
  // Handle GET /api/los/persona.

  const ctx = await getLosContext({ requireAuth: true }); // Require signed-in user.
  if (!ctx.ok) {
    // If unauthorized...
    return ctx.unauthorizedResponse; // Return 401.
  }

  const profileKey = ctx.profileKey; // Profile key.
  const userId = ctx.userId; // User id.

  await ensurePersonaRow(profileKey, userId); // Ensure a row exists.

  const rows =
    await sql`SELECT * FROM los_persona WHERE profile_key = ${profileKey} LIMIT 1`; // Fetch persona.
  const persona = rows[0] || null; // Normalize.

  return Response.json({ persona }); // Return JSON.
}

/* ================================= PUT =================================== */

export async function PUT(request) {
  // Handle PUT /api/los/persona.

  const ctx = await getLosContext({ requireAuth: true }); // Require auth.
  if (!ctx.ok) {
    // If unauthorized...
    return ctx.unauthorizedResponse; // Return 401.
  }

  const profileKey = ctx.profileKey; // Profile.
  const userId = ctx.userId; // User.

  await ensurePersonaRow(profileKey, userId); // Ensure row exists.

  const body = await request.json(); // Parse JSON body.

  const tone = body?.tone; // Optional string.
  const structure = body?.structure; // Optional string.
  const valuesAndBeliefs = body?.values_and_beliefs; // Optional string.
  const phrasesAllow = body?.phrases_allow; // Optional string.
  const phrasesBlock = body?.phrases_block; // Optional string.

  const setParts = []; // Dynamic SET parts.
  const values = []; // Placeholder values.
  let idx = 1; // Placeholder counter.

  if (typeof tone === "string") {
    // If tone present...
    setParts.push(`tone = $${idx}`); // Add SET.
    values.push(tone); // Add value.
    idx += 1; // Increment.
  }

  if (typeof structure === "string") {
    // If structure present...
    setParts.push(`structure = $${idx}`); // Add SET.
    values.push(structure); // Add value.
    idx += 1; // Increment.
  }

  if (typeof valuesAndBeliefs === "string") {
    // If values present...
    setParts.push(`values_and_beliefs = $${idx}`); // Add SET.
    values.push(valuesAndBeliefs); // Add value.
    idx += 1; // Increment.
  }

  if (typeof phrasesAllow === "string") {
    // If allow list present...
    setParts.push(`phrases_allow = $${idx}`); // Add SET.
    values.push(phrasesAllow); // Add value.
    idx += 1; // Increment.
  }

  if (typeof phrasesBlock === "string") {
    // If block list present...
    setParts.push(`phrases_block = $${idx}`); // Add SET.
    values.push(phrasesBlock); // Add value.
    idx += 1; // Increment.
  }

  if (setParts.length > 0) {
    // If anything changed...
    setParts.push("updated_at = NOW()"); // Update timestamp.
  }

  if (setParts.length === 0) {
    // If nothing to change...
    const rows =
      await sql`SELECT * FROM los_persona WHERE profile_key = ${profileKey} LIMIT 1`; // Re-fetch.
    return Response.json({ persona: rows[0] || null }); // Return current.
  }

  values.push(profileKey); // WHERE value.

  const query = `UPDATE los_persona SET ${setParts.join(", ")} WHERE profile_key = $${idx} RETURNING *`; // Build SQL.

  const updatedRows = await sql(query, values); // Execute.
  const persona = updatedRows[0] || null; // Normalize.

  await logActivity({
    // Audit log.
    profileKey, // Profile.
    userId, // User.
    actionType: "persona.update", // Type.
    message: "Updated persona settings", // Human message.
    metadata: { tone, structure }, // Small context.
  }); // End log.

  return Response.json({ persona }); // Return updated.
}



