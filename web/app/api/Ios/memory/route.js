/* ========================================================================== */
/* VLOSA — MEMORY API ROUTE                                                   */
/* -------------------------------------------------------------------------- */
/* GET  /api/los/memory                                                       */
/*   -> list memory entries for the current signed-in user                     */
/* POST /api/los/memory                                                       */
/*   -> create a new memory entry for the current signed-in user               */
/*                                                                            */
/* Auth: protected (requires login).                                           */
/* ========================================================================== */

/* =============================== Imports ================================== */

import sql from "@/app/api/utils/sql"; // Postgres helper.
import { getLosContext, logActivity } from "../_utils"; // LOS context + audit.

/* ================================= GET =================================== */

export async function GET() {
  // Handle GET /api/los/memory.

  const ctx = await getLosContext({ requireAuth: true }); // Require auth.
  if (!ctx.ok) {
    // If unauthorized...
    return ctx.unauthorizedResponse; // Return 401.
  }

  const profileKey = ctx.profileKey; // Profile.

  const rows = await sql`
    SELECT *
    FROM los_memory
    WHERE profile_key = ${profileKey}
    ORDER BY pinned DESC, created_at DESC
    LIMIT 200
  `; // Query.

  return Response.json({ memories: rows }); // Return list.
}

/* ================================= POST ================================== */

export async function POST(request) {
  // Handle POST /api/los/memory.

  const ctx = await getLosContext({ requireAuth: true }); // Require auth.
  if (!ctx.ok) {
    // If unauthorized...
    return ctx.unauthorizedResponse; // Return 401.
  }

  const profileKey = ctx.profileKey; // Profile.
  const userId = ctx.userId; // User.

  const body = await request.json(); // Parse JSON.

  const content = typeof body?.content === "string" ? body.content.trim() : ""; // Validate.
  const source = typeof body?.source === "string" ? body.source : null; // Optional source.

  if (!content) {
    // Enforce required field.
    return new Response(JSON.stringify({ error: "content is required" }), {
      // Build response.
      status: 400, // Bad request.
      headers: { "Content-Type": "application/json" }, // JSON.
    }); // End response.
  }

  const rows = await sql`
    INSERT INTO los_memory (profile_key, user_id, content, source)
    VALUES (${profileKey}, ${userId}, ${content}, ${source})
    RETURNING *
  `; // Insert.

  const memory = rows[0] || null; // Normalize.

  await logActivity({
    // Audit.
    profileKey, // Profile.
    userId, // User.
    actionType: "memory.create", // Type.
    message: "Captured a memory", // Human message.
    metadata: { memoryId: memory ? memory.id : null }, // Context.
  }); // End log.

  return Response.json({ memory }); // Return created.
}



