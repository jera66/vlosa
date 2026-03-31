/* ========================================================================== */
/* VLOSA — SINGLE INBOX ITEM API ROUTE                                        */
/* -------------------------------------------------------------------------- */
/* GET    /api/los/inbox/:id                                                   */
/*   -> fetch one inbox item                                                   */
/* PUT    /api/los/inbox/:id                                                   */
/*   -> update fields like status, ai_summary, suggested_reply                 */
/* DELETE /api/los/inbox/:id                                                   */
/*   -> delete an inbox item                                                   */
/*                                                                            */
/* Auth: protected (requires login).                                           */
/* ========================================================================== */

/* =============================== Imports ================================== */

import sql from "@/app/api/utils/sql"; // Postgres helper.
import { getLosContext, logActivity } from "../../_utils"; // LOS context + audit.

/* ================================= GET =================================== */

export async function GET(request, { params }) {
  // Handle GET /api/los/inbox/[id].

  const ctx = await getLosContext({ requireAuth: true }); // Require auth.
  if (!ctx.ok) {
    // If unauthorized...
    return ctx.unauthorizedResponse; // Return 401.
  }

  const profileKey = ctx.profileKey; // Profile.
  const id = params.id; // Inbox id.

  const rows =
    await sql`SELECT * FROM los_inbox_items WHERE id = ${id} AND profile_key = ${profileKey} LIMIT 1`; // Fetch.
  const item = rows[0] || null; // Normalize.

  return Response.json({ item }); // Return.
}

/* ================================= PUT =================================== */

export async function PUT(request, { params }) {
  // Handle PUT /api/los/inbox/[id].

  const ctx = await getLosContext({ requireAuth: true }); // Require auth.
  if (!ctx.ok) {
    // If unauthorized...
    return ctx.unauthorizedResponse; // Return 401.
  }

  const profileKey = ctx.profileKey; // Profile.
  const userId = ctx.userId; // User.
  const id = params.id; // Inbox id.

  const body = await request.json(); // Parse JSON.

  const status = typeof body?.status === "string" ? body.status : undefined; // Optional.
  const priority =
    typeof body?.priority === "string" ? body.priority : undefined; // Optional.
  const aiSummary =
    typeof body?.ai_summary === "string" ? body.ai_summary : undefined; // Optional.
  const suggestedReply =
    typeof body?.suggested_reply === "string"
      ? body.suggested_reply
      : undefined; // Optional.
  const subject = typeof body?.subject === "string" ? body.subject : undefined; // Optional.
  const bodyText = body?.body_text !== undefined ? body.body_text : undefined; // Optional.

  const setParts = []; // SET fragments.
  const values = []; // Values.
  let idx = 1; // Placeholder index.

  if (status !== undefined) {
    // If status provided...
    setParts.push(`status = $${idx}`); // Add.
    values.push(status); // Add.
    idx += 1; // Next.
  }

  if (priority !== undefined) {
    // If priority provided...
    setParts.push(`priority = $${idx}`); // Add.
    values.push(priority); // Add.
    idx += 1; // Next.
  }

  if (aiSummary !== undefined) {
    // If aiSummary provided...
    setParts.push(`ai_summary = $${idx}`); // Add.
    values.push(aiSummary); // Add.
    idx += 1; // Next.
  }

  if (suggestedReply !== undefined) {
    // If suggestedReply provided...
    setParts.push(`suggested_reply = $${idx}`); // Add.
    values.push(suggestedReply); // Add.
    idx += 1; // Next.
  }

  if (subject !== undefined) {
    // If subject provided...
    setParts.push(`subject = $${idx}`); // Add.
    values.push(subject); // Add.
    idx += 1; // Next.
  }

  if (bodyText !== undefined) {
    // If body_text provided...
    setParts.push(`body_text = $${idx}`); // Add.
    values.push(bodyText); // Add.
    idx += 1; // Next.
  }

  if (setParts.length > 0) {
    // If anything changed...
    setParts.push("updated_at = NOW()"); // Timestamp.
  }

  if (setParts.length === 0) {
    // If nothing to update...
    const rows =
      await sql`SELECT * FROM los_inbox_items WHERE id = ${id} AND profile_key = ${profileKey} LIMIT 1`; // Fetch.
    return Response.json({ item: rows[0] || null }); // Return.
  }

  values.push(id); // Add id.
  values.push(profileKey); // Add profile.

  const query = `UPDATE los_inbox_items SET ${setParts.join(", ")} WHERE id = $${idx} AND profile_key = $${idx + 1} RETURNING *`; // Build.

  const rows = await sql(query, values); // Execute.
  const item = rows[0] || null; // Normalize.

  await logActivity({
    // Audit.
    profileKey, // Profile.
    userId, // User.
    actionType: "inbox.update", // Type.
    message: item
      ? `Updated inbox item: ${item.subject}`
      : `Updated inbox item: ${id}`, // Message.
    metadata: { id, status, priority }, // Context.
  }); // End.

  return Response.json({ item }); // Return.
}

/* ================================ DELETE ================================= */

export async function DELETE(request, { params }) {
  // Handle DELETE /api/los/inbox/[id].

  const ctx = await getLosContext({ requireAuth: true }); // Require auth.
  if (!ctx.ok) {
    // If unauthorized...
    return ctx.unauthorizedResponse; // Return 401.
  }

  const profileKey = ctx.profileKey; // Profile.
  const userId = ctx.userId; // User.
  const id = params.id; // Inbox id.

  const rows =
    await sql`DELETE FROM los_inbox_items WHERE id = ${id} AND profile_key = ${profileKey} RETURNING *`; // Delete.
  const item = rows[0] || null; // Normalize.

  await logActivity({
    // Audit.
    profileKey, // Profile.
    userId, // User.
    actionType: "inbox.delete", // Type.
    message: item
      ? `Deleted inbox item: ${item.subject}`
      : `Deleted inbox item: ${id}`, // Message.
    metadata: { id }, // Context.
  }); // End.

  return Response.json({ item }); // Return.
}



