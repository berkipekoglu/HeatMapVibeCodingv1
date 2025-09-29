import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
const UAParser = require('ua-parser-js');

/**
 * Handles POST requests from the tracker.
 * Differentiates between 'click' and 'mousemove' events.
 * @param {Request} request - The incoming request object.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Tracker API received data:", JSON.stringify(body, null, 2)); // Log the incoming data

    const { type, payload } = body;

    if (!type || !payload || !payload.sessionId) {
      return NextResponse.json({ message: "Invalid data structure or missing session ID" }, { status: 400 });
    }

    // Get or create the session ID in the database
    const dbSessionId = await getOrCreateDbSession(payload);

    switch (type) {
      case 'click':
        await handleSingleEvent(payload, dbSessionId);
        break;
      case 'mousemove':
        await handleMoveEvent(payload, dbSessionId);
        break;
      default:
        return NextResponse.json({ message: "Invalid event type" }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Data received successfully" },
      { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
    );

  } catch (error) {
    console.error("Error processing tracking data:", error);
    return NextResponse.json(
      { message: "Error processing request" },
      { status: 500 }
    );
  }
}

async function getOrCreateDbSession(payload: any): Promise<string> {
  const { websiteId, sessionId: clientSessionId, userAgent } = payload;

  // 1. Try to find the session by the client-generated ID
  const findResult = await sql`
    SELECT id FROM sessions WHERE client_session_id = ${clientSessionId};
  `;

  if (findResult.rows.length > 0) {
    return findResult.rows[0].id; // Return existing session's UUID
  }

  // 2. If not found, create a new session
  const parser = new UAParser(userAgent);
  const uaResult = parser.getResult();
  
  const browser = uaResult.browser.name;
  const os = uaResult.os.name;
  const device = uaResult.device.type || 'desktop';

  const createResult = await sql`
    INSERT INTO sessions (client_session_id, website_id, user_agent, browser, os, device)
    VALUES (${clientSessionId}, ${websiteId}, ${userAgent}, ${browser}, ${os}, ${device})
    RETURNING id;
  `;

  return createResult.rows[0].id; // Return the new session's UUID
}

async function handleSingleEvent(payload: any, dbSessionId: string) {
  const { x, y, url, websiteId, viewportWidth, viewportHeight } = payload;
  if (typeof x !== "number" || typeof y !== "number" || !url || !websiteId || typeof viewportWidth !== "number" || typeof viewportHeight !== "number") {
    throw new Error("Invalid click data format");
  }

  await sql`
    INSERT INTO click_events (website_id, session_id, x, y, url, viewport_width, viewport_height)
    VALUES (${websiteId}, ${dbSessionId}, ${x}, ${y}, ${url}, ${viewportWidth}, ${viewportHeight});
  `;
}

async function handleMoveEvent(payload: any, dbSessionId: string) {
  const { points, url, websiteId, viewportWidth, viewportHeight } = payload;
  if (!Array.isArray(points) || points.length === 0 || !url || !websiteId || typeof viewportWidth !== "number" || typeof viewportHeight !== "number") {
    throw new Error("Invalid mousemove data format");
  }

  await sql`
    INSERT INTO mousemove_events (website_id, session_id, points, url, viewport_width, viewport_height)
    VALUES (${websiteId}, ${dbSessionId}, ${JSON.stringify(points)}, ${url}, ${viewportWidth}, ${viewportHeight});
  `;
}

// Handler for OPTIONS requests (CORS preflight)
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}