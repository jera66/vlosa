/* ========================================================================== */
/* VLOSA — TASKS API ROUTE                                                    */
/* -------------------------------------------------------------------------- */
/* GET  /api/los/tasks                                                        */
/*   -> list tasks for the current signed-in user                              */
/* POST /api/los/tasks                                                        */
/*   -> create a new task for the current signed-in user                       */
/*                                                                            */
/* Auth: protected (requires login).                                           */
/* ========================================================================== */

/* =============================== Imports ================================== */

import sql from "@/app/api/utils/sql"; // Postgres helper.
import { getLosContext, logActivity } from "../_utils"; // LOS context + audit.

/* ================================= GET =================================== */

export async function GET(request) {
  // Handle GET /api/los/tasks.

  const ctx = await getLosContext({ requireAuth: true }); // Require auth.
  if (!ctx.ok) {
    // If unauthorized...
    return ctx.unauthorizedResponse; // Return 401.
  }

  const profileKey = ctx.profileKey; // Profile key.

  const url = new URL(request.url); // Parse URL.
  const status = url.searchParams.get("status"); // Optional status filter.

  let query = "SELECT * FROM los_tasks WHERE profile_key = $1"; // Base SQL.
  const values = [profileKey]; // SQL params.

  if (status) {
    // If status provided...
    query += " AND status = $2"; // Add filter.
    values.push(status); // Add value.
  }

  query += " ORDER BY created_at DESC"; // Sort.

  const tasks = await sql(query, values); // Execute.

  return Response.json({ tasks }); // Return.
}

/* ================================= POST ================================== */

export async function POST(request) {
  // Handle POST /api/los/tasks.

  const ctx = await getLosContext({ requireAuth: true }); // Require auth.
  if (!ctx.ok) {
    // If unauthorized...
    return ctx.unauthorizedResponse; // Return 401.
  }

  const profileKey = ctx.profileKey; // Profile key.
  const userId = ctx.userId; // User id.

  const body = await request.json(); // Parse JSON.

  const title = typeof body?.title === "string" ? body.title.trim() : ""; // Validate title.
  const priority =
    typeof body?.priority === "string" ? body.priority : "routine"; // Default priority.
  const status = typeof body?.status === "string" ? body.status : "incoming"; // Default status.
  const dueAt = body?.due_at !== undefined ? body.due_at : null; // Optional due date.

  if (!title) {
    // Enforce required field.
    return new Response(JSON.stringify({ error: "title is required" }), {
      // Build response.
      status: 400, // Bad request.
      headers: { "Content-Type": "application/json" }, // JSON.
    }); // End response.
  }

  const rows = await sql`
    INSERT INTO los_tasks (profile_key, user_id, title, status, priority, due_at)
    VALUES (${profileKey}, ${userId}, ${title}, ${status}, ${priority}, ${dueAt})
    RETURNING *
  `; // Insert.

  const task = rows[0] || null; // Normalize.

  await logActivity({
    // Audit.
    profileKey, // Profile.
    userId, // User.
    actionType: "task.create", // Type.
    message: `Created task: ${title}`, // Message.
    metadata: { taskId: task ? task.id : null, status, priority }, // Context.
  }); // End log.

  return Response.json({ task }); // Return created.
}



