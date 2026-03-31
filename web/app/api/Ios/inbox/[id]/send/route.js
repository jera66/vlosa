/* ========================================================================== */
/* VLOSA — INBOX SEND (GMAIL) ROUTE                                           */
/* -------------------------------------------------------------------------- */
/* POST /api/los/inbox/:id/send                                               */
/*                                                                            */
/* Purpose:                                                                   */
/* - Send the current suggested_reply as an email via Gmail.                  */
/*                                                                            */
/* Rule enforcement (your request):                                           */
/* - Block sending during quiet hours.                                        */
/* - Block sending outside allowed communication window.                      */
/* - Block sending unless posture/rules allow it (approval-first).            */
/*                                                                            */
/* Safety defaults:                                                           */
/* - We require the inbox item to be status='approved' unless:                */
/*   (automation_posture='auto_run' AND rules.email.sendEmailsWithoutApproval=true) */
/* ========================================================================== */

/* =============================== Imports ================================== */

import sql from "@/app/api/utils/sql"; // DB.

import { getLosContext, logActivity } from "@/app/api/los/_utils"; // Auth context + audit.

import { refreshAccessTokenIfNeeded } from "@/app/api/integrations/gmail/_utils"; // Gmail token.

/* =============================== Helpers ================================== */

function parseTimeToMinutes(value, fallback) {
  // Convert "HH:MM" -> minutes since midnight.
  const raw =
    (value ? String(value) : "") || (fallback ? String(fallback) : "");
  const m = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) {
    return null;
  }
  const h = Math.max(0, Math.min(23, Number(m[1])));
  const min = Math.max(0, Math.min(59, Number(m[2])));
  return h * 60 + min;
}

function isNowInWindow(nowMinutes, startMinutes, endMinutes) {
  // Support windows that may cross midnight.
  if (startMinutes === null || endMinutes === null) {
    return false;
  }
  if (startMinutes === endMinutes) {
    return true;
  }
  if (startMinutes < endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }
  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
}

function base64UrlEncode(str) {
  // Base64url encode for Gmail API.
  const b64 = Buffer.from(str, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/* ================================= POST ================================== */

export async function POST(request, { params }) {
  // Send reply.

  const ctx = await getLosContext({ requireAuth: true });
  if (!ctx.ok) {
    return ctx.unauthorizedResponse;
  }

  const id = params?.id ? String(params.id) : "";
  if (!id) {
    return Response.json({ error: "Missing inbox id" }, { status: 400 });
  }

  const itemRows = await sql(
    "SELECT * FROM los_inbox_items WHERE id = $1 AND profile_key = $2 LIMIT 1",
    [id, ctx.profileKey],
  );
  const item = itemRows?.[0] || null;

  if (!item) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const settingsRows = await sql(
    "SELECT * FROM los_settings WHERE profile_key = $1 LIMIT 1",
    [ctx.profileKey],
  );
  const settings = settingsRows?.[0] || null;

  const rules = settings?.rules || {};

  const automationPosture = settings?.automation_posture || "approval_first";

  const quietStart = parseTimeToMinutes(settings?.quiet_hours_start, "22:00");
  const quietEnd = parseTimeToMinutes(settings?.quiet_hours_end, "07:00");

  const allowedStart = parseTimeToMinutes(
    rules?.communications?.allowedWindowStart,
    "08:00",
  );
  const allowedEnd = parseTimeToMinutes(
    rules?.communications?.allowedWindowEnd,
    "21:00",
  );

  const sendWithoutApproval = !!rules?.email?.sendEmailsWithoutApproval;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const inQuietHours = isNowInWindow(nowMinutes, quietStart, quietEnd);
  if (inQuietHours) {
    return Response.json(
      {
        error: `Quiet hours are active. Sending is blocked right now.`,
      },
      { status: 403 },
    );
  }

  const inAllowedWindow = isNowInWindow(nowMinutes, allowedStart, allowedEnd);
  if (!inAllowedWindow) {
    return Response.json(
      {
        error: `Outside your allowed communication window. Sending is blocked right now.`,
      },
      { status: 403 },
    );
  }

  const needsApproved = !(
    automationPosture === "auto_run" && sendWithoutApproval
  );

  if (needsApproved && String(item.status || "") !== "approved") {
    return Response.json(
      {
        error:
          "This reply must be approved before sending. Tap Approve first, then Send.",
      },
      { status: 403 },
    );
  }

  const to = item.from_address ? String(item.from_address) : "";
  if (!to) {
    return Response.json(
      { error: "Missing recipient address for this email." },
      { status: 400 },
    );
  }

  const subject = item.subject ? String(item.subject) : "(no subject)";
  const replySubject = subject.toLowerCase().startsWith("re:")
    ? subject
    : `Re: ${subject}`;

  const body = item.suggested_reply ? String(item.suggested_reply) : "";
  if (!body.trim()) {
    return Response.json(
      { error: "No suggested reply to send. Generate or write one first." },
      { status: 400 },
    );
  }

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

  const mime = [
    `To: ${to}`,
    `Subject: ${replySubject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "",
    body,
  ].join("\r\n");

  const raw = base64UrlEncode(mime);

  const sendRes = await fetch(
    "https://www.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    },
  );

  if (!sendRes.ok) {
    const text = await sendRes.text().catch(() => "");
    console.error("[gmail send] failed", sendRes.status, text);
    return Response.json(
      { error: `Gmail send failed: [${sendRes.status}] ${sendRes.statusText}` },
      { status: 400 },
    );
  }

  await sql(
    "UPDATE los_inbox_items SET status = $1, updated_at = NOW() WHERE id = $2 AND profile_key = $3",
    ["sent", id, ctx.profileKey],
  );

  await logActivity({
    profileKey: ctx.profileKey,
    userId: ctx.userId,
    actionType: "gmail.send",
    message: `Sent email reply: ${replySubject}`,
    metadata: { inboxId: id, to },
  });

  return Response.json({ ok: true });
}



