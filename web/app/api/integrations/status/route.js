/* ========================================================================== */
/* VLOSA — GMAIL STATUS ROUTE                                                 */
/* -------------------------------------------------------------------------- */
/* GET /api/integrations/gmail/status                                          */
/*   -> returns whether Gmail is connected for the current signed-in user      */
/*                                                                            */
/* Auth: protected (requires login)                                            */
/* ========================================================================== */

/* =============================== Imports ================================== */

import { getLosContext } from "@/app/api/los/_utils"; // Current user context.
import { getGmailIntegration } from "../_utils.js"; // Gmail DB helper.

/* ================================= GET =================================== */

export async function GET() {
  // Handle GET.

  const ctx = await getLosContext({ requireAuth: true }); // Require auth.
  if (!ctx.ok) {
    // If unauthorized...
    return ctx.unauthorizedResponse; // Return 401.
  }

  const integration = await getGmailIntegration(ctx.profileKey); // Load row.

  const connected = !!integration; // Boolean.

  return Response.json({
    connected,
    provider: "gmail",
    email_address: integration?.email_address || null,
    scopes: integration?.scopes || null,
    token_expires_at: integration?.token_expires_at || null,
  }); // Return.
}



