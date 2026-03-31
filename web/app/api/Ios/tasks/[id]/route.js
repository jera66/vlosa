/* ========================================================================== */
/* VLOSA — SINGLE TASK API ROUTE                                              */
/* -------------------------------------------------------------------------- */
/* PUT    /api/los/tasks/:id                                                   */
/*   -> update a task (title/status/priority/due_at)                            */
/* DELETE /api/los/tasks/:id                                                   */
/*   -> delete a task                                                          */
/*                                                                            */
/* Auth: protected (requires login).                                           */
/* ========================================================================== */

/* =============================== Imports ================================== */

import sql from "@/app/api/utils/sql"; // Postgres helper.
import { getLosContext, logActivity } from "../../_utils"; // LOS context + audit.

/* ================================= PUT =================================== */

export async function PUT(request, { params }) {
  // Handle PUT /api/los/tasks/[id].

  const ctx = await getLosContext({ requireAuth: true }); // Require auth.
  if (!ctx.ok) {
    // If unauthorized...
    return ctx.unauthorizedResponse; // Return 401.
  }

  const profileKey = ctx.profileKey; // Profile key.
  const userId = ctx.userId; // User id.
  const id = params.id; // Task id from URL.

  const body = await request.json(); // Parse JSON.

  const title = typeof body?.title === "string" ? body.title.trim() : undefined; // Optional title.
  const status = typeof body?.status === "string" ? body.status : undefined; // Optional status.
  const priority =
    typeof body?.priority === "string" ? body.priority : undefined; // Optional priority.
  const dueAt = body?.due_at !== undefined ? body.due_at : undefined; // Optional due date (can be null).

  const setParts = []; // Collect SET fragments.
  const values = []; // Collect values.
  let idx = 1; // Placeholder index.

  if (title !== undefined) {
    // If title provided...
    setParts.push(`title = $${idx}`); // Add SET.
    values.push(title); // Add value.
    idx += 1; // Next.
  }

  if (status !== undefined) {
    // If status provided...
    setParts.push(`status = $${idx}`); // Add SET.
    values.push(status); // Add value.
    idx += 1; // Next.
  }

  if (priority !== undefined) {
    // If priority provided...
    setParts.push(`priority = $${idx}`); // Add SET.
    values.push(priority); // Add value.
    idx += 1; // Next.
  }

  if (dueAt !== undefined) {
    // If due_at provided...
    setParts.push(`due_at = $${idx}`); // Add SET.
    values.push(dueAt); // Add value.
    idx += 1; // Next.
  }

  if (setParts.length > 0) {
    // If anything changed...
    setParts.push("updated_at = NOW()"); // Bump timestamp.
  }

  if (setParts.length === 0) {
    // If nothing to update...
    const rows =
      await sql`SELECT * FROM los_tasks WHERE id = ${id} AND profile_key = ${profileKey} LIMIT 1`; // Fetch current.
    return Response.json({ task: rows[0] || null }); // Return current.
  }

  values.push(id); // Add id.
  values.push(profileKey); // Add profile.

  const query = `UPDATE los_tasks SET ${setParts.join(", ")} WHERE id = $${idx} AND profile_key = $${idx + 1} RETURNING *`; // Build SQL.

  const rows = await sql(query, values); // Execute.
  const task = rows[0] || null; // Normalize.

  await logActivity({
    // Audit.
    profileKey, // Profile.
    userId, // User.
    actionType: "task.update", // Type.
    message: task ? `Updated task: ${task.title}` : `Updated task: ${id}`, // Message.
    metadata: { id, status, priority }, // Context.
  }); // End log.

  return Response.json({ task }); // Return.
}

/* ================================ DELETE ================================= */

export async function DELETE(request, { params }) {
  // Handle DELETE /api/los/tasks/[id].

  const ctx = await getLosContext({ requireAuth: true }); // Require auth.
  if (!ctx.ok) {
    // If unauthorized...
    return ctx.unauthorizedResponse; // Return 401.
  }

  const profileKey = ctx.profileKey; // Profile.
  const userId = ctx.userId; // User.
  const id = params.id; // Task id.

  const rows =
    await sql`DELETE FROM los_tasks WHERE id = ${id} AND profile_key = ${profileKey} RETURNING *`; // Delete.
  const task = rows[0] || null; // Normalize.

  await logActivity({
    // Audit.
    profileKey, // Profile.
    userId, // User.
    actionType: "task.delete", // Type.
    message: task ? `Deleted task: ${task.title}` : `Deleted task: ${id}`, // Message.
    metadata: { id }, // Context.
  }); // End log.

  return Response.json({ task }); // Return.
}



