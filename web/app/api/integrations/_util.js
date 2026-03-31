/* ========================================================================== */
/* VLOSA — GMAIL INTEGRATION UTILITIES                                        */
/* -------------------------------------------------------------------------- */
/* This file holds helper code that is shared across Gmail routes.             */
/*                                                                            */
/* Why a helper file?                                                         */
/* - Keeps each route short and focused on one job.                            */
/* - Keeps OAuth token logic in one place.                                     */
/*                                                                            */
/* IMPORTANT (security):                                                      */
/* - Access/refresh tokens are stored server-side only (database).             */
/* - Client IDs / secrets come from process.env (Secrets).                     */
/* - Never return tokens to the frontend.                                      */
/* ========================================================================== */

/* =============================== Imports ================================== */

import sql from "@/app/api/utils/sql"; // Postgres helper.

/* ============================== Constants ================================= */

export const GMAIL_PROVIDER = "gmail"; // Provider key used in DB.

export function requireGoogleOAuthEnv() {
  // Validate env vars exist before we try OAuth.
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID; // Client ID.
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET; // Client secret.

  if (!clientId || !clientSecret) {
    // If missing...
    throw new Error(
      "Missing GOOGLE_OAUTH_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET. Add them in Project Settings → Secrets.",
    ); // Throw.
  }

  return { clientId, clientSecret }; // Return both.
}

export function getRedirectUri() {
  // Build the redirect URI that Google will send the user back to.
  const appUrl = process.env.APP_URL; // Base app URL (Anything sets this).
  if (!appUrl) {
    // If missing...
    throw new Error("Missing APP_URL (platform env var)"); // Throw.
  }
  return `${appUrl}/api/integrations/gmail/callback`; // Callback URL.
}

export function gmailScopes() {
  // The scopes we request from Google.
  // NOTE: We keep this conservative, but "send" is needed to actually send replies.
  return [
    "https://www.googleapis.com/auth/gmail.readonly", // Read mail.
    "https://www.googleapis.com/auth/gmail.modify", // Archive/label.
    "https://www.googleapis.com/auth/gmail.compose", // Create drafts.
    "https://www.googleapis.com/auth/gmail.send", // Send messages (required for 'Send via Gmail').
  ];
}

/* ============================== DB Helpers ================================ */

export async function getGmailIntegration(profileKey) {
  // Load the Gmail integration row for this profile.
  const rows = await sql(
    "SELECT * FROM los_integrations WHERE profile_key = $1 AND provider = $2 LIMIT 1",
    [profileKey, GMAIL_PROVIDER],
  ); // Query.
  return rows[0] || null; // Normalize.
}

export async function upsertGmailIntegration({
  // Upsert Gmail integration.
  profileKey,
  userId,
  emailAddress,
  accessToken,
  refreshToken,
  tokenExpiresAt,
  scopes,
  metadata,
}) {
  // Upsert row.
  const rows = await sql(
    `INSERT INTO los_integrations (
      profile_key,
      user_id,
      provider,
      email_address,
      access_token,
      refresh_token,
      token_expires_at,
      scopes,
      metadata
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    ON CONFLICT (profile_key, provider)
    DO UPDATE SET
      user_id = EXCLUDED.user_id,
      email_address = EXCLUDED.email_address,
      access_token = EXCLUDED.access_token,
      refresh_token = COALESCE(EXCLUDED.refresh_token, los_integrations.refresh_token),
      token_expires_at = EXCLUDED.token_expires_at,
      scopes = EXCLUDED.scopes,
      metadata = EXCLUDED.metadata,
      updated_at = NOW()
    RETURNING *`,
    [
      profileKey,
      userId || null,
      GMAIL_PROVIDER,
      emailAddress || null,
      accessToken || null,
      refreshToken || null,
      tokenExpiresAt || null,
      scopes || null,
      metadata || null,
    ],
  ); // Execute.
  return rows[0] || null; // Return.
}

export async function deleteGmailIntegration(profileKey) {
  // Remove Gmail integration row.
  const rows = await sql(
    "DELETE FROM los_integrations WHERE profile_key = $1 AND provider = $2 RETURNING *",
    [profileKey, GMAIL_PROVIDER],
  ); // Execute.
  return rows[0] || null; // Return.
}

export async function insertOAuthState({ state, profileKey, provider }) {
  // Save state for CSRF protection.
  await sql(
    "INSERT INTO los_oauth_states (state, profile_key, provider) VALUES ($1,$2,$3)",
    [state, profileKey, provider],
  ); // Insert.
}

export async function consumeOAuthState({ state, provider }) {
  // Fetch + delete a state token (one-time use).
  const rows = await sql(
    "DELETE FROM los_oauth_states WHERE state = $1 AND provider = $2 RETURNING *",
    [state, provider],
  ); // Delete + return.
  return rows[0] || null; // Normalize.
}

/* ============================ Token Refresh =============================== */

export function isTokenExpired(tokenExpiresAt) {
  // Decide if token is expired (with a small safety buffer).
  if (!tokenExpiresAt) {
    // If missing...
    return true; // Treat as expired.
  }
  const expiresMs = new Date(tokenExpiresAt).getTime(); // Convert.
  const nowMs = Date.now(); // Now.
  const bufferMs = 1000 * 60; // 1 minute.
  return nowMs >= expiresMs - bufferMs; // Expired?
}

export async function refreshAccessTokenIfNeeded({ profileKey }) {
  // Ensure we have a valid access token; refresh if needed.
  const { clientId, clientSecret } = requireGoogleOAuthEnv(); // Env.

  const integration = await getGmailIntegration(profileKey); // Load.
  if (!integration || !integration.refresh_token) {
    // If not connected...
    return { ok: false, error: "Gmail is not connected" }; // Return.
  }

  const stillValid = !isTokenExpired(integration.token_expires_at); // Check.
  if (stillValid && integration.access_token) {
    // If valid...
    return { ok: true, accessToken: integration.access_token }; // Return.
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    // Refresh token.
    method: "POST", // POST.
    headers: { "Content-Type": "application/x-www-form-urlencoded" }, // Form.
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: integration.refresh_token,
    }).toString(),
  });

  if (!tokenResponse.ok) {
    // If refresh failed...
    const text = await tokenResponse.text(); // Read details.
    return {
      ok: false,
      error: `Gmail token refresh failed: [${tokenResponse.status}] ${tokenResponse.statusText} ${text}`,
    };
  }

  const tokenJson = await tokenResponse.json(); // Parse.
  const newAccessToken = tokenJson.access_token; // Access token.
  const expiresIn = tokenJson.expires_in; // Seconds.

  const nextExpiresAt = expiresIn
    ? new Date(Date.now() + Number(expiresIn) * 1000)
    : null; // Compute expiry.

  await upsertGmailIntegration({
    profileKey,
    userId: integration.user_id,
    emailAddress: integration.email_address,
    accessToken: newAccessToken,
    refreshToken: null, // Keep existing refresh token.
    tokenExpiresAt: nextExpiresAt,
    scopes: integration.scopes,
    metadata: integration.metadata,
  }); // Save.

  return { ok: true, accessToken: newAccessToken }; // Return.
}

/* ============================== Parsing ================================== */

export function parseFromHeader(fromValue) {
  // Very small parser: "Name <email@x.com>" -> { name, email }
  const raw = fromValue ? String(fromValue) : ""; // Normalize.
  const match = raw.match(/^(.*)<([^>]+)>\s*$/); // Match name+email.
  if (match) {
    const name = match[1].trim().replace(/^\"|\"$/g, ""); // Strip quotes.
    const email = match[2].trim(); // Email.
    return { name: name || null, email: email || null, raw }; // Return.
  }
  // Fallback: maybe it's just an email.
  const looksLikeEmail = raw.includes("@"); // Naive.
  return { name: null, email: looksLikeEmail ? raw.trim() : null, raw }; // Return.
}



