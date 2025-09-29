import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getToken } from "../../../../../lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { websiteId: string } }
) {
  const token = await getToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { websiteId } = await params;

  try {
    // Verify user ownership
    const ownerCheck = await sql`
      SELECT id FROM websites WHERE id = ${websiteId} AND user_id = ${token.userId};
    `;
    if (ownerCheck.rowCount === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Run all stats queries in parallel
    const [clicksOverTime, browserStats, osStats, deviceStats] =
      await Promise.all([
        // Clicks in the last 14 days, grouped by day
        sql`
        SELECT DATE(timestamp) as date, COUNT(*) as clicks
        FROM click_events
        WHERE website_id = ${websiteId} AND timestamp >= NOW() - INTERVAL '14 days'
        GROUP BY DATE(timestamp)
        ORDER BY date ASC;
      `,
        // Stats by browser
        sql`
        SELECT browser, COUNT(*) as count
        FROM sessions
        WHERE website_id = ${websiteId} AND browser IS NOT NULL
        GROUP BY browser
        ORDER BY count DESC;
      `,
        // Stats by OS
        sql`
        SELECT os, COUNT(*) as count
        FROM sessions
        WHERE website_id = ${websiteId} AND os IS NOT NULL
        GROUP BY os
        ORDER BY count DESC;
      `,
        // Stats by device type
        sql`
        SELECT device, COUNT(*) as count
        FROM sessions
        WHERE website_id = ${websiteId} AND device IS NOT NULL
        GROUP BY device
        ORDER BY count DESC;
      `,
      ]);

    return NextResponse.json({
      clicksOverTime: clicksOverTime.rows,
      browserStats: browserStats.rows,
      osStats: osStats.rows,
      deviceStats: deviceStats.rows,
    });
  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
