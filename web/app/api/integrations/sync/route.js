/* ========================================================================== */
/* VLOSA — GMAIL SYNC ROUTE                                                   */
/* -------------------------------------------------------------------------- */
/* POST /api/integrations/gmail/sync                                           */
/*   -> pulls the latest Gmail messages and ingests them into los_inbox_items  */
/*                                                                            */
/* Notes:                                                                      */
/* - v1 keeps this simple: we pull the most recent N messages.                 */
/* - We de-dupe using a unique index: (profile_key, source, external_id).      */
/* - AI summary/reply is initially set to snippet and left editable.           */
/*                                                                            */
/* Auth: protected (requires login)                                            */
/* ========================================================================== */

/* =============================== Imports ================================== */

import sql from "@/app/api/utils/sql"; // DB helper.

import { getLosContext, logActivity } from "@/app/api/los/_utils"; // Context + audit.

import {
  getGmailIntegration,
  refreshAccessTokenIfNeeded,
  parseFromHeader,
  upsertGmailIntegration,
} from "../_utils.js"; // Gmail helpers.

/* =============================== Helpers ================================= */

function headerValue(headers, name) {
  // Find a header value by name (case-insensitive).
  const target = String(name || "").toLowerCase(); // Normalize name.
  const arr = Array.isArray(headers) ? headers : []; // Normalize headers.
  const found = arr.find((h) => String(h.name || "").toLowerCase() === target); // Find.
  return found ? String(found.value || "") : ""; // Return value.
}

async function getGmailProfileHistoryId(accessToken) {
  // Fetch Gmail profile to get a stable historyId.
  const res = await fetch(
    "https://www.googleapis.com/gmail/v1/users/me/profile",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!res.ok) {
    return null;
  }
  const json = await res.json();
  const hid = json?.historyId ? String(json.historyId) : null;
  return hid;
}

async function listMessageIdsIncremental({
  accessToken,
  startHistoryId,
  limit,
}) {
  // Use history.list to fetch newly-added messages since startHistoryId.
  const url = new URL("https://www.googleapis.com/gmail/v1/users/me/history");
  url.searchParams.set("startHistoryId", String(startHistoryId));
  url.searchParams.set("historyTypes", "messageAdded");
  url.searchParams.set("maxResults", String(limit));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const error = `Gmail history failed: [${res.status}] ${res.statusText}${text ? ` — ${text}` : ""}`;
    return { ok: false, error, status: res.status };
  }

  const json = await res.json();
  const history = Array.isArray(json.history) ? json.history : [];

  const ids = [];

  for (const h of history) {
    const adds = Array.isArray(h?.messagesAdded) ? h.messagesAdded : [];
    for (const a of adds) {
      const id = a?.message?.id ? String(a.message.id) : "";
      if (id) {
        ids.push(id);
      }
    }
  }

  const nextHistoryId = json?.historyId ? String(json.historyId) : null;

  return { ok: true, ids, nextHistoryId };
}

/* ================================= POST ================================== */

export async function POST(request) {
  // Sync Gmail -> los_inbox_items.

  const ctx = await getLosContext({ requireAuth: true });
  if (!ctx.ok) {
    return ctx.unauthorizedResponse;
  }

  const body = await request.json().catch(() => ({}));

  const limit =
    typeof body?.limit === "number" && body.limit > 0 && body.limit <= 100
      ? Math.floor(body.limit)
      : 40;

  const tokenResult = await refreshAccessTokenIfNeeded({
    profileKey: ctx.profileKey,
  });

  if (!tokenResult.ok) {
    return Response.json(
      { error: tokenResult.error || "Gmail not connected" },
      { status: 400 },
    );
  }

  const accessToken = tokenResult.accessToken;

  const integration = await getGmailIntegration(ctx.profileKey);
  const meta =
    integration?.metadata && typeof integration.metadata === "object"
      ? integration.metadata
      : {};
  const startHistoryId = meta?.historyId ? String(meta.historyId) : null;

  let messageIds = [];
  let usedMode = "full";
  let nextHistoryId = null;

  if (startHistoryId) {
    // Try incremental sync first.
    usedMode = "incremental";
    const inc = await listMessageIdsIncremental({
      accessToken,
      startHistoryId,
      limit,
    });

    if (!inc.ok) {
      // If history is invalid/too old, fall back to full sync.
      console.error("[gmail sync] incremental failed", inc.status, inc.error);
      usedMode = "full";
      messageIds = [];
    } else {
      messageIds = inc.ids;
      nextHistoryId = inc.nextHistoryId;
    }
  }

  if (usedMode === "full") {
    // Full sync: list the most recent messages.
    const listRes = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=${encodeURIComponent(String(limit))}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!listRes.ok) {
      const text = await listRes.text();
      console.error("[gmail sync] list failed", listRes.status, text);
      return Response.json(
        {
          error: `Gmail list failed: [${listRes.status}] ${listRes.statusText}`,
        },
        { status: 400 },
      );
    }

    const listJson = await listRes.json();
    const messages = Array.isArray(listJson.messages) ? listJson.messages : [];
    messageIds = messages
      .map((m) => (m?.id ? String(m.id) : ""))
      .filter(Boolean);

    // Also set a baseline historyId so next sync can be incremental.
    nextHistoryId = await getGmailProfileHistoryId(accessToken);
  }

  let inserted = 0;
  let skipped = 0;

  for (const messageId of messageIds) {
    const msgRes = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(messageId)}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!msgRes.ok) {
      skipped += 1;
      continue;
    }

    const msgJson = await msgRes.json();

    const headers = msgJson?.payload?.headers;
    const fromRaw = headerValue(headers, "From");
    const subject = headerValue(headers, "Subject") || "(no subject)";

    const parsedFrom = parseFromHeader(fromRaw);

    const snippet = msgJson?.snippet ? String(msgJson.snippet) : null;

    const rows = await sql(
      `INSERT INTO los_inbox_items (
        profile_key,
        user_id,
        source,
        external_id,
        from_name,
        from_address,
        subject,
        body_text,
        priority,
        status,
        ai_summary,
        suggested_reply
      )
      VALUES ($1,$2,'gmail',$3,$4,$5,$6,$7,'routine','incoming',$8,NULL)
      ON CONFLICT (profile_key, source, external_id)
      DO NOTHING
      RETURNING *`,
      [
        ctx.profileKey,
        ctx.userId,
        messageId,
        parsedFrom.name,
        parsedFrom.email,
        subject,
        null,
        snippet,
      ],
    );

    if (rows && rows.length > 0) {
      inserted += 1;
    } else {
      skipped += 1;
    }
  }

  if (nextHistoryId && integration) {
    const nextMeta = {
      ...(meta || {}),
      historyId: String(nextHistoryId),
      lastSyncAt: new Date().toISOString(),
    };

    await upsertGmailIntegration({
      profileKey: ctx.profileKey,
      userId: ctx.userId,
      emailAddress: integration.email_address,
      accessToken: integration.access_token,
      refreshToken: null,
      tokenExpiresAt: integration.token_expires_at,
      scopes: integration.scopes,
      metadata: nextMeta,
    });
  }

  await logActivity({
    profileKey: ctx.profileKey,
    userId: ctx.userId,
    actionType: "gmail.sync",
    message: "Synced Gmail into Inbox",
    metadata: { inserted, skipped, requestedLimit: limit, mode: usedMode },
  });

  return Response.json({
    ok: true,
    inserted,
    skipped,
    requestedLimit: limit,
    mode: usedMode,
  });
}



