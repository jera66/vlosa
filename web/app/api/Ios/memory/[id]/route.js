/* ========================================================================== */
/* VLOSA — SINGLE MEMORY API ROUTE                                            */
/* -------------------------------------------------------------------------- */
/* PUT    /api/los/memory/:id                                                  */
/*   -> update a memory entry (currently: pinned)                              */
/* DELETE /api/los/memory/:id                                                  */
/*   -> delete a memory entry                                                  */
/*                                                                            */
/* Auth: protected (requires login).                                           */
/* ========================================================================== */

/* =============================== Imports ================================== */

import sql from "@/app/api/utils/sql"; // Postgres helper.
import { getLosContext, logActivity } from "../../_utils"; // LOS context + audit.

/* ================================= PUT =================================== */

export async function PUT(request, { params }) {
  // Handle PUT /api/los/memory/[id].

  const ctx = await getLosContext({ requireAuth: true }); // Require auth.
  if (!ctx.ok) {
    // If unauthorized...
    return ctx.unauthorizedResponse; // Return 401.
  }

  const profileKey = ctx.profileKey; // Profile.
  const userId = ctx.userId; // User.
  const id = params.id; // Memory id.

  const body = await request.json(); // Parse JSON.

  const pinned = body?.pinned; // Expected boolean.

  if (typeof pinned !== "boolean") {
    // Validate.
    return new Response(JSON.stringify({ error: "pinned must be boolean" }), {
      // Response.
      status: 400, // Bad request.
      headers: { "Content-Type": "application/json" }, // JSON.
    }); // End response.
  }

  const rows = await sql`
    UPDATE los_memory
    SET pinned = ${pinned}
    WHERE id = ${id} AND profile_key = ${profileKey}
    RETURNING *
  `; // Update.

  const memory = rows[0] || null; // Normalize.

  await logActivity({
    // Audit.
    profileKey, // Profile.
    userId, // User.
    actionType: "memory.update", // Type.
    message: pinned ? "Pinned a memory" : "Unpinned a memory", // Message.
    metadata: { id, pinned }, // Context.
  }); // End log.

  return Response.json({ memory }); // Return.
}

/* ================================ DELETE ================================= */

export async function DELETE(request, { params }) {
  // Handle DELETE /api/los/memory/[id].

  const ctx = await getLosContext({ requireAuth: true }); // Require auth.
  if (!ctx.ok) {
    // If unauthorized...
    return ctx.unauthorizedResponse; // Return 401.
  }

  const profileKey = ctx.profileKey; // Profile.
  const userId = ctx.userId; // User.
  const id = params.id; // Memory id.

  const rows = await sql`
    DELETE FROM los_memory
    WHERE id = ${id} AND profile_key = ${profileKey}
    RETURNING *
  `; // Delete.

  const memory = rows[0] || null; // Normalize.

  await logActivity({
    // Audit.
    profileKey, // Profile.
    userId, // User.
    actionType: "memory.delete", // Type.
    message: "Forgot a memory", // Message.
    metadata: { id }, // Context.
  }); // End log.

  return Response.json({ memory }); // Return.
}



