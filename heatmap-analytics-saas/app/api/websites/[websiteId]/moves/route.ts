import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getToken } from "../../../../../lib/auth";

interface MoveEventFromDB {
  points: { x: number; y: number }[];
  viewport_width: number;
  viewport_height: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  console.log("\n--- Moves API Request Start ---");
  const token = await getToken(request);
  if (!token) {
    console.log("Moves API Error: Unauthorized (no token)");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { websiteId } = await params;
  const { searchParams } = new URL(request.url);
  const pageUrl = searchParams.get("url");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const device = searchParams.get("device");
  const browser = searchParams.get("browser");
  const os = searchParams.get("os");

  console.log(`Fetching moves for websiteId: ${websiteId}`);
  console.log(`Filter Params:`, { pageUrl, startDate, endDate, device, browser, os });

  try {
    const ownerCheck = await sql`
      SELECT id FROM websites WHERE id = ${websiteId} AND user_id = ${token.userId};
    `;

    if (ownerCheck.rowCount === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let query = `
      SELECT e.points, e.viewport_width, e.viewport_height 
      FROM mousemove_events e
      LEFT JOIN sessions s ON e.session_id = s.id
      WHERE e.website_id = '${websiteId}'
    `;

    if (pageUrl)
      query += ` AND (e.url = '${pageUrl}' OR e.url = '${pageUrl.slice(
        0,
        -1
      )}' OR e.url = '${pageUrl}index.html')`;
    if (startDate) query += ` AND e.timestamp >= '${startDate}'`;
    if (endDate) query += ` AND e.timestamp <= '${endDate}'`;
    if (device) query += ` AND s.device = '${device}'`;
    if (browser) query += ` AND s.browser = '${browser}'`;
    if (os) query += ` AND s.os = '${os}'`;

    console.log("Executing Query:", query.replace(/\s+/g, " ").trim());

    const { rows: moveEvents } = await sql.query(query);

    console.log(`Query returned ${moveEvents.length} rows.`);
    console.log("--- Moves API Request End ---\n");

    const flattenedPoints = moveEvents.flatMap((event: any) => {
      return event.points.map((point: any) => ({
        x: point.x,
        y: point.y,
        viewport_width: event.viewport_width,
        viewport_height: event.viewport_height,
      }));
    });

    return NextResponse.json(flattenedPoints, { status: 200 });
  } catch (error) {
    console.error("Moves API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
