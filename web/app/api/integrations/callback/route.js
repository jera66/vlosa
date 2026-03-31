/* ========================================================================== */
/* VLOSA — GMAIL OAUTH CALLBACK ROUTE                                          */
/* -------------------------------------------------------------------------- */
/* GET /api/integrations/gmail/callback?code=...&state=...                     */
/*   -> exchanges the OAuth code for tokens and stores them in the DB          */
/*                                                                            */
/* This route returns a small HTML "success" page so the user can close it.   */
/*                                                                            */
/* Auth: handled via state token (ties callback to the correct LOS profile).  */
/* ========================================================================== */

/* =============================== Imports ================================== */

import { getLosContext, logActivity } from "@/app/api/los/_utils"; // Context + audit.

import {
  consumeOAuthState,
  getRedirectUri,
  requireGoogleOAuthEnv,
  upsertGmailIntegration,
} from "../_utils.js"; // Gmail helpers.

/* =============================== Helpers ================================= */

function htmlPage({ title, message }) {
  // Build a minimal HTML response.
  const safeTitle = title ? String(title) : "VLOSA"; // Normalize.
  const safeMessage = message ? String(message) : ""; // Normalize.
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${safeTitle}</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: #F5F6FA; color: #0B1220; padding: 24px; }
    .card { max-width: 720px; margin: 0 auto; background: #F5F6FA; border-radius: 18px; padding: 20px; box-shadow: 12px 12px 24px rgba(0,0,0,0.12), -8px -8px 18px rgba(255,255,255,0.8); }
    h1 { font-size: 20px; margin: 0; }
    p { margin-top: 10px; line-height: 1.4; }
    code { background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${safeTitle}</h1>
    <p>${safeMessage}</p>
    <p>You can close this tab and return to the app.</p>
  </div>
</body>
</html>`;
}

/* ================================= GET =================================== */

export async function GET(request) {
  // Handle Google redirect.

  const url = new URL(request.url); // Parse URL.

  const code = url.searchParams.get("code"); // OAuth code.
  const state = url.searchParams.get("state"); // CSRF state.
  const oauthError = url.searchParams.get("error"); // OAuth error.

  if (oauthError) {
    // If user denied or Google errored...
    return new Response(
      htmlPage({
        title: "Gmail connection failed",
        message: `OAuth error: <code>${oauthError}</code>`,
      }),
      { headers: { "Content-Type": "text/html" }, status: 400 },
    );
  }

  if (!code || !state) {
    // If missing required params...
    return new Response(
      htmlPage({
        title: "Gmail connection failed",
        message: "Missing OAuth code or state.",
      }),
      { headers: { "Content-Type": "text/html" }, status: 400 },
    );
  }

  const stateRow = await consumeOAuthState({ state, provider: "gmail" }); // Verify+consume.

  if (!stateRow) {
    // Invalid / reused state.
    return new Response(
      htmlPage({
        title: "Gmail connection failed",
        message: "Invalid or expired state token.",
      }),
      { headers: { "Content-Type": "text/html" }, status: 400 },
    );
  }

  const profileKey = stateRow.profile_key; // Tie callback to user.

  // Optional: cookie-based session might exist (web). Not required.
  const ctx = await getLosContext({ requireAuth: false }); // Optional.
  const maybeUserId = ctx.ok ? ctx.userId : null; // Best effort.

  const { clientId, clientSecret } = requireGoogleOAuthEnv(); // Env.
  const redirectUri = getRedirectUri(); // Must match the connect flow.

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });

  if (!tokenResponse.ok) {
    // If exchange failed...
    const text = await tokenResponse.text();

    await logActivity({
      profileKey,
      userId: maybeUserId,
      actionType: "gmail.connect.error",
      message: "Failed exchanging Gmail OAuth code for tokens",
      metadata: {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        text,
      },
    });

    return new Response(
      htmlPage({
        title: "Gmail connection failed",
        message: `Token exchange failed: <code>[${tokenResponse.status}] ${tokenResponse.statusText}</code>`,
      }),
      { headers: { "Content-Type": "text/html" }, status: 400 },
    );
  }

  const tokenJson = await tokenResponse.json(); // Parse.

  const accessToken = tokenJson.access_token || null; // Access token.
  const refreshToken = tokenJson.refresh_token || null; // Refresh token (may be null).
  const expiresIn = tokenJson.expires_in || null; // Seconds.
  const scope = tokenJson.scope || null; // Scopes string.

  const tokenExpiresAt = expiresIn
    ? new Date(Date.now() + Number(expiresIn) * 1000)
    : null; // Expiry timestamp.

  // Optional: get the Gmail account email address.
  let emailAddress = null;
  try {
    if (accessToken) {
      const profileRes = await fetch(
        "https://www.googleapis.com/gmail/v1/users/me/profile",
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (profileRes.ok) {
        const profileJson = await profileRes.json();
        emailAddress = profileJson.emailAddress || null;
      }
    }
  } catch (e) {
    console.error("[gmail callback] profile fetch failed", e);
  }

  await upsertGmailIntegration({
    profileKey,
    userId: maybeUserId,
    emailAddress,
    accessToken,
    refreshToken,
    tokenExpiresAt,
    scopes: scope,
    metadata: { connectedAt: new Date().toISOString() },
  });

  await logActivity({
    profileKey,
    userId: maybeUserId,
    actionType: "gmail.connect.success",
    message: "Connected Gmail successfully",
    metadata: { emailAddress, scope },
  });

  return new Response(
    htmlPage({
      title: "Gmail connected",
      message: emailAddress
        ? `Connected Gmail account: <code>${emailAddress}</code>`
        : "Connected Gmail account.",
    }),
    { headers: { "Content-Type": "text/html" }, status: 200 },
  );
}



