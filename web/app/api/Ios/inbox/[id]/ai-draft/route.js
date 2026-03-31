/* ========================================================================== */
/* VLOSA — INBOX AI DRAFT ROUTE                                               */
/* -------------------------------------------------------------------------- */
/* POST /api/los/inbox/:id/ai-draft                                            */
/*   -> generates (or regenerates) an AI summary + suggested reply             */
/*                                                                            */
/* This uses the selected Anything AI integration (default assumption here:    */
/* Google Gemini 2.5 Flash).                                                  */
/*                                                                            */
/* Safety model:                                                              */
/* - We draft only. We do NOT send.                                            */
/* - User must approve in the UI.                                              */
/*                                                                            */
/* Auth: protected (requires login)                                            */
/* ========================================================================== */

/* =============================== Imports ================================== */

import sql from "@/app/api/utils/sql"; // DB helper.

import { getLosContext, logActivity } from "@/app/api/los/_utils"; // Auth context + audit.

/* =============================== Helpers ================================= */

function buildSystemPrompt({ persona, rules }) {
  // Build system prompt for the model.
  const tone = persona?.tone ? String(persona.tone) : "";
  const structure = persona?.structure ? String(persona.structure) : "";
  const values = persona?.values_and_beliefs
    ? String(persona.values_and_beliefs)
    : "";
  const allow = persona?.phrases_allow ? String(persona.phrases_allow) : "";
  const block = persona?.phrases_block ? String(persona.phrases_block) : "";

  const neverUnknown = !!rules?.communications?.neverRespondToUnknownNumbers;
  const allowedStart = rules?.communications?.allowedWindowStart || "08:00";
  const allowedEnd = rules?.communications?.allowedWindowEnd || "21:00";
  const sendWithoutApproval = !!rules?.email?.sendEmailsWithoutApproval;

  return [
    "You are VLOSA — a life-operations copilot that drafts messages in the user's voice.",
    "Write clean, concise text. No emojis.",
    "You must NOT claim you performed an action you did not perform.",
    "You are generating a draft only; the human will approve before sending.",
    "",
    `Persona tone: ${tone || "(not set)"}`,
    `Persona structure: ${structure || "(not set)"}`,
    `Values/beliefs: ${values || "(not set)"}`,
    `Phrases allowed: ${allow || "(not set)"}`,
    `Phrases blocked: ${block || "(not set)"}`,
    "",
    "Rules:",
    `- Never respond to unknown numbers: ${neverUnknown ? "true" : "false"}`,
    `- Allowed communication window: ${allowedStart}–${allowedEnd}`,
    `- Send emails without approval: ${sendWithoutApproval ? "true" : "false"} (but for this system, DO NOT send)`,
    "",
    "Output format:",
    "Return JSON ONLY with keys: ai_summary, suggested_reply.",
    "ai_summary should be 1-3 sentences.",
    "suggested_reply should be the full draft email reply.",
  ].join("\n");
}

function safeJsonParse(text) {
  // Parse JSON defensively.
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

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
  // Support windows that cross midnight.
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

/* ================================= POST ================================== */

export async function POST(request, { params }) {
  // Handle POST.

  const ctx = await getLosContext({ requireAuth: true });
  if (!ctx.ok) {
    return ctx.unauthorizedResponse;
  }

  const id = params.id; // Inbox id.

  const inboxRows = await sql(
    "SELECT * FROM los_inbox_items WHERE id = $1 AND profile_key = $2 LIMIT 1",
    [id, ctx.profileKey],
  );
  const item = inboxRows[0] || null;

  if (!item) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const personaRows = await sql(
    "SELECT * FROM los_persona WHERE profile_key = $1 LIMIT 1",
    [ctx.profileKey],
  );
  const persona = personaRows[0] || null;

  const settingsRows = await sql(
    "SELECT * FROM los_settings WHERE profile_key = $1 LIMIT 1",
    [ctx.profileKey],
  );
  const settings = settingsRows[0] || null;
  const rules = settings?.rules || {};

  // ============================= RULE ENFORCEMENT =============================
  // Enforce quiet hours + communication windows for Gmail drafting actions.

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

  const draftEmails = rules?.email?.draftEmailsAutomatically !== false;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const inQuietHours = isNowInWindow(nowMinutes, quietStart, quietEnd);
  if (inQuietHours) {
    return Response.json(
      { error: "Quiet hours are active. Drafting is blocked right now." },
      { status: 403 },
    );
  }

  const inAllowedWindow = isNowInWindow(nowMinutes, allowedStart, allowedEnd);
  if (!inAllowedWindow) {
    return Response.json(
      {
        error:
          "Outside your allowed communication window. Drafting is blocked right now.",
      },
      { status: 403 },
    );
  }

  if (!draftEmails) {
    return Response.json(
      { error: "Drafting is disabled by your Rules Engine." },
      { status: 403 },
    );
  }

  // If the user wants “never respond to unknown numbers”, treat missing from_address as unknown.
  const neverUnknown = !!rules?.communications?.neverRespondToUnknownNumbers;
  if (neverUnknown && !item.from_address) {
    return Response.json(
      { error: "Blocked by rules: sender is unknown." },
      { status: 403 },
    );
  }

  // =========================== END RULE ENFORCEMENT ===========================

  const systemPrompt = buildSystemPrompt({ persona, rules });

  const fromLine =
    item.from_name || item.from_address
      ? `${item.from_name || ""} ${item.from_address ? `<${item.from_address}>` : ""}`.trim()
      : "(unknown)";
  const subjectLine = item.subject ? String(item.subject) : "(no subject)";
  const bodyText = item.body_text ? String(item.body_text) : "";
  const snippet = item.ai_summary
    ? String(item.ai_summary)
    : item.body_text
      ? String(item.body_text).slice(0, 500)
      : "";

  const userPrompt = [
    "Draft a reply to this email.",
    "",
    `From: ${fromLine}`,
    `Subject: ${subjectLine}`,
    "",
    bodyText
      ? `Body:\n${bodyText}`
      : `Snippet:\n${snippet || "(no content provided)"}`,
  ].join("\n");

  const aiRes = await fetch("/integrations/google-gemini-2-5-flash/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!aiRes.ok) {
    const text = await aiRes.text();
    console.error("[ai-draft] gemini error", aiRes.status, text);
    return Response.json(
      { error: `AI draft failed: [${aiRes.status}] ${aiRes.statusText}` },
      { status: 400 },
    );
  }

  const aiJson = await aiRes.json();
  const content = aiJson?.choices?.[0]?.message?.content
    ? String(aiJson.choices[0].message.content)
    : "";

  const parsed = safeJsonParse(content);

  const aiSummary =
    typeof parsed?.ai_summary === "string"
      ? parsed.ai_summary
      : content
        ? content.slice(0, 200)
        : "";
  const suggestedReply =
    typeof parsed?.suggested_reply === "string" ? parsed.suggested_reply : null;

  const updatedRows = await sql(
    "UPDATE los_inbox_items SET ai_summary = $1, suggested_reply = $2, updated_at = NOW() WHERE id = $3 AND profile_key = $4 RETURNING *",
    [aiSummary || null, suggestedReply || null, id, ctx.profileKey],
  );

  const updated = updatedRows[0] || null;

  await logActivity({
    profileKey: ctx.profileKey,
    userId: ctx.userId,
    actionType: "inbox.ai_draft",
    message: updated
      ? `Generated AI draft: ${updated.subject}`
      : `Generated AI draft: ${id}`,
    metadata: { id },
  });

  return Response.json({ item: updated });
}



