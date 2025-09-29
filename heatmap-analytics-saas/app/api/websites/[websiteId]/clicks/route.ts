import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getToken } from '../../../../../lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ websiteId: string }> }) {
  console.log("\n--- Clicks API Request Start ---");
  const token = await getToken(request);
  if (!token) {
    console.log("Clicks API Error: Unauthorized (no token)");
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { websiteId } = await params;
  const { searchParams } = new URL(request.url);
  const pageUrl = searchParams.get('url');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const device = searchParams.get('device');
  const browser = searchParams.get('browser');
  const os = searchParams.get('os');

  console.log(`Fetching clicks for websiteId: ${websiteId}`);
  console.log(`Filter Params:`, { pageUrl, startDate, endDate, device, browser, os });

  try {
    const ownerCheck = await sql`
      SELECT id FROM websites WHERE id = ${websiteId} AND user_id = ${token.userId};
    `;

    if (ownerCheck.rowCount === 0) {
      console.log(`Clicks API Error: Forbidden (user ${token.userId} does not own website ${websiteId})`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let query = `
      SELECT e.x, e.y, e.viewport_width, e.viewport_height, e.timestamp 
      FROM click_events e
      LEFT JOIN sessions s ON e.session_id = s.id
      WHERE e.website_id = '${websiteId}'
    `;

    if (pageUrl) {
      // Handle trailing slashes and index.html variations
      const normalizedUrl = pageUrl.endsWith('/') ? pageUrl.slice(0, -1) : pageUrl;
      query += ` AND (e.url = '${pageUrl}' OR e.url = '${normalizedUrl}/' OR e.url = '${normalizedUrl}/index.html')`;
    }
    if (startDate) query += ` AND e.timestamp >= '${startDate}'`;
    if (endDate) query += ` AND e.timestamp <= '${endDate}'`;
    if (device) query += ` AND s.device = '${device}'`;
    if (browser) query += ` AND s.browser = '${browser}'`;
    if (os) query += ` AND s.os = '${os}'`;

    console.log("Executing Query:", query.replace(/\s+/g, ' ').trim());

    const { rows: clickEvents } = await sql.query(query);

    console.log(`Query returned ${clickEvents.length} rows.`);
    console.log("--- Clicks API Request End ---\n");

    return NextResponse.json(clickEvents, { status: 200 });

  } catch (error) {
    console.error('Clicks API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
