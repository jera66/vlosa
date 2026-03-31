/* ========================================================================== */
/* VLOSA — GMAIL CONNECT ROUTE                                                */
/* -------------------------------------------------------------------------- */
/* GET /api/integrations/gmail/connect                                         */
/*   -> returns a Google OAuth URL to connect Gmail                            */
/*                                                                            */
/* The frontend should open this URL in a browser/webview.                     */
/*                                                                            */
/* Auth: protected (requires login)                                            */
/* ========================================================================== */

/* =============================== Imports ================================== */

import { randomUUID } from "crypto"; // For CSRF-safe state tokens.

import { getLosContext, logActivity } from "@/app/api/los/_utils"; // User + audit.

import {
  GMAIL_PROVIDER,
  getRedirectUri,
  gmailScopes,
  insertOAuthState,
  requireGoogleOAuthEnv,
} from "../_utils.js"; // Gmail helpers.

/* ================================= GET =================================== */

export async function GET() {
  // Handle GET /api/integrations/gmail/connect.

  const ctx = await getLosContext({ requireAuth: true }); // Require auth.
  if (!ctx.ok) {
    // If unauthorized...
    return ctx.unauthorizedResponse; // Return 401.
  }

  const { clientId } = requireGoogleOAuthEnv(); // Validate env.

  const redirectUri = getRedirectUri(); // Callback URL.
  const scope = gmailScopes().join(" "); // Space-separated.

  const state = randomUUID(); // CSRF token.

  await insertOAuthState({
    state,
    profileKey: ctx.profileKey,
    provider: GMAIL_PROVIDER,
  }); // Save.

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth"); // OAuth base.

  authUrl.searchParams.set("client_id", clientId); // Client id.
  authUrl.searchParams.set("redirect_uri", redirectUri); // Redirect.
  authUrl.searchParams.set("response_type", "code"); // Code.
  authUrl.searchParams.set("scope", scope); // Scopes.
  authUrl.searchParams.set("access_type", "offline"); // Refresh token.
  authUrl.searchParams.set("prompt", "consent"); // Ensure refresh token.
  authUrl.searchParams.set("include_granted_scopes", "true"); // Incremental.
  authUrl.searchParams.set("state", state); // CSRF.

  await logActivity({
    profileKey: ctx.profileKey,
    userId: ctx.userId,
    actionType: "gmail.connect.start",
    message: "Started Gmail connect flow",
    metadata: { redirectUri },
  });

  return Response.json({ url: authUrl.toString() }); // Return URL.
}



