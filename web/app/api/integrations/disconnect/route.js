/* ========================================================================== */
/* VLOSA — GMAIL DISCONNECT ROUTE                                             */
/* -------------------------------------------------------------------------- */
/* POST /api/integrations/gmail/disconnect                                     */
/*   -> deletes stored Gmail tokens for the current user                       */
/*                                                                            */
/* Auth: protected                                                             */
/* ========================================================================== */

/* =============================== Imports ================================== */

import { getLosContext, logActivity } from "@/app/api/los/_utils"; // Context + audit.

import { deleteGmailIntegration } from "../_utils.js"; // Gmail DB helper.

/* ================================= POST ================================== */

export async function POST() {
  // Handle disconnect.

  const ctx = await getLosContext({ requireAuth: true }); // Require auth.
  if (!ctx.ok) {
    // If unauthorized...
    return ctx.unauthorizedResponse; // 401.
  }

  const deleted = await deleteGmailIntegration(ctx.profileKey); // Delete tokens.

  await logActivity({
    profileKey: ctx.profileKey,
    userId: ctx.userId,
    actionType: "gmail.disconnect",
    message: "Disconnected Gmail",
    metadata: { deleted: !!deleted },
  });

  return Response.json({ ok: true, deleted: !!deleted }); // Done.
}



