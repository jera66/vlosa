/* ========================================================================== */
/* VLOSA — INBOX API ROUTE                                                    */
/* -------------------------------------------------------------------------- */
/* GET  /api/los/inbox                                                        */
/*   -> list inbox/triage items for the current signed-in user                 */
/* POST /api/los/inbox                                                        */
/*   -> create a new inbox item (manual ingestion for v1)                      */
/*                                                                            */
/* This is the foundation for Inbox/Triage. Later, integrations will           */
/* create items automatically (Gmail, Outlook, SMS, etc.).                     */
/*                                                                            */
/* Auth: protected (requires login).                                           */
/* ========================================================================== */

/* =============================== Imports ================================== */

import sql from "@/app/api/utils/sql"; // Postgres helper.
import { getLosContext, logActivity } from "../_utils"; // LOS context + audit.

/* ================================= GET =================================== */

export async function GET(request) {
  // Handle GET /api/los/inbox.

  const ctx = await getLosContext({ requireAuth: true }); // Require auth.
  if (!ctx.ok) {
    // If unauthorized...
    return ctx.unauthorizedResponse; // Return 401.
  }

  const profileKey = ctx.profileKey; // Profile key.

  const url = new URL(request.url); // Parse URL.
  const status = url.searchParams.get("status"); // Optional status filter.

  let query = "SELECT * FROM los_inbox_items WHERE profile_key = $1"; // Base SQL.
  const values = [profileKey]; // Params.

  if (status) {
    // If status provided...
    query += " AND status = $2"; // Add filter.
    values.push(status); // Add value.
  }

  query += " ORDER BY created_at DESC"; // Sort newest first.

  const items = await sql(query, values); // Execute.

  return Response.json({ items }); // Return list.
}

/* ================================= POST ================================== */

export async function POST(request) {
  // Handle POST /api/los/inbox.

  const ctx = await getLosContext({ requireAuth: true }); // Require auth.
  if (!ctx.ok) {
    // If unauthorized...
    return ctx.unauthorizedResponse; // Return 401.
  }

  const profileKey = ctx.profileKey; // Profile.
  const userId = ctx.userId; // User.

  const body = await request.json(); // Parse JSON.

  const subject = typeof body?.subject === "string" ? body.subject.trim() : ""; // Required.
  const bodyText = typeof body?.body_text === "string" ? body.body_text : null; // Optional.
  const fromName = typeof body?.from_name === "string" ? body.from_name : null; // Optional.
  const fromAddress =
    typeof body?.from_address === "string" ? body.from_address : null; // Optional.
  const priority =
    typeof body?.priority === "string" ? body.priority : "routine"; // Default.
  const status = typeof body?.status === "string" ? body.status : "incoming"; // Default.
  const aiSummary =
    typeof body?.ai_summary === "string" ? body.ai_summary : null; // Optional.
  const suggestedReply =
    typeof body?.suggested_reply === "string" ? body.suggested_reply : null; // Optional.

  if (!subject) {
    // Validate.
    return new Response(JSON.stringify({ error: "subject is required" }), {
      // Response.
      status: 400, // Bad request.
      headers: { "Content-Type": "application/json" }, // JSON.
    }); // End.
  }

  const rows = await sql`
    INSERT INTO los_inbox_items (
      profile_key,
      user_id,
      source,
      from_name,
      from_address,
      subject,
      body_text,
      priority,
      status,
      ai_summary,
      suggested_reply
    )
    VALUES (
      ${profileKey},
      ${userId},
      'manual',
      ${fromName},
      ${fromAddress},
      ${subject},
      ${bodyText},
      ${priority},
      ${status},
      ${aiSummary},
      ${suggestedReply}
    )
    RETURNING *
  `; // Insert.

  const item = rows[0] || null; // Normalize.

  await logActivity({
    // Audit.
    profileKey, // Profile.
    userId, // User.
    actionType: "inbox.create", // Type.
    message: `Inbox item created: ${subject}`, // Message.
    metadata: { inboxId: item ? item.id : null, status, priority }, // Context.
  }); // End log.

  return Response.json({ item }); // Return created.
}



