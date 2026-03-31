/* ========================================================================== */
/* VLOSA — ACTIVITY LOG API ROUTE                                             */
/* -------------------------------------------------------------------------- */
/* GET /api/los/activity                                                       */
/*   -> list recent activity entries for the current signed-in user            */
/*                                                                            */
/* Auth: protected (requires login).                                           */
/* ========================================================================== */

/* =============================== Imports ================================== */

import sql from "@/app/api/utils/sql"; // Postgres helper.
import { getLosContext } from "../_utils"; // LOS context.

/* ================================= GET =================================== */

export async function GET(request) {
  // Handle GET /api/los/activity.

  const ctx = await getLosContext({ requireAuth: true }); // Require auth.
  if (!ctx.ok) {
    // If unauthorized...
    return ctx.unauthorizedResponse; // Return 401.
  }

  const profileKey = ctx.profileKey; // Profile key.

  const url = new URL(request.url); // Parse URL.
  const limitParam = url.searchParams.get("limit"); // Optional limit.

  const limit = Number.isFinite(Number(limitParam))
    ? Math.min(200, Number(limitParam))
    : 50; // Clamp limit.

  const rows = await sql(
    "SELECT * FROM los_activity_log WHERE profile_key = $1 ORDER BY created_at DESC LIMIT $2",
    [profileKey, limit],
  ); // Execute query.

  return Response.json({ activity: rows }); // Return JSON.
}



