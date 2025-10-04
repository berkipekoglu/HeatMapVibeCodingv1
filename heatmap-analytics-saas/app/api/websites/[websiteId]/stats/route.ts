import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getToken } from "../../../../../lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  const token = await getToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { websiteId } = await params;
  const { searchParams } = new URL(request.url);

  try {
    // Verify user ownership
    const ownerCheck = await sql`
      SELECT id FROM websites WHERE id = ${websiteId} AND user_id = ${token.userId};
    `;
    if (ownerCheck.rowCount === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // --- Build Dynamic WHERE Clause from Filters ---
    const filters: string[] = [`e.website_id = '${websiteId}'`];
    if (searchParams.has('startDate')) {
      filters.push(`e.timestamp >= '${searchParams.get('startDate')}'`);
    }
    if (searchParams.has('endDate')) {
      filters.push(`e.timestamp <= '${searchParams.get('endDate')}'`);
    }
    if (searchParams.has('pageUrl')) {
      const pageUrl = searchParams.get('pageUrl')!;
      const normalizedUrl = pageUrl.endsWith('/') ? pageUrl.slice(0, -1) : pageUrl;
      filters.push(`(e.url = '${pageUrl}' OR e.url = '${normalizedUrl}/' OR e.url = '${normalizedUrl}/index.html')`);
    }
    if (searchParams.has('device')) {
      filters.push(`s.device = '${searchParams.get('device')}'`);
    }
    if (searchParams.has('browser')) {
      filters.push(`s.browser = '${searchParams.get('browser')}'`);
    }
    if (searchParams.has('os')) {
      filters.push(`s.os = '${searchParams.get('os')}'`);
    }

    const whereClause = filters.join(' AND ');

    const baseQuery = `FROM click_events e JOIN sessions s ON e.session_id = s.id WHERE ${whereClause}`;

    // Run all stats queries in parallel
    const [clicksOverTime, browserStats, osStats, deviceStats] = await Promise.all([
      sql.query(`SELECT DATE(e.timestamp) as date, COUNT(*) as clicks ${baseQuery} GROUP BY DATE(e.timestamp) ORDER BY date ASC`),
      sql.query(`SELECT s.browser, COUNT(DISTINCT s.id) as count ${baseQuery} AND s.browser IS NOT NULL GROUP BY s.browser ORDER BY count DESC`),
      sql.query(`SELECT s.os, COUNT(DISTINCT s.id) as count ${baseQuery} AND s.os IS NOT NULL GROUP BY s.os ORDER BY count DESC`),
      sql.query(`SELECT s.device, COUNT(DISTINCT s.id) as count ${baseQuery} AND s.device IS NOT NULL GROUP BY s.device ORDER BY count DESC`),
    ]);

    // Parse string counts to numbers for recharts
    const parseCounts = (row: any) => ({ ...row, count: parseInt(row.count, 10) });

    return NextResponse.json({
      clicksOverTime: clicksOverTime.rows.map(row => ({ ...row, clicks: parseInt(row.clicks, 10) })),
      browserStats: browserStats.rows.map(parseCounts),
      osStats: osStats.rows.map(parseCounts),
      deviceStats: deviceStats.rows.map(parseCounts),
    });
  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
