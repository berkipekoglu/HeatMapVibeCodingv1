import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

/**
 * Handles POST requests from the tracker.
 * Differentiates between 'click' and 'mousemove' events.
 * @param {Request} request - The incoming request object.
 */
export async function POST(request: Request) {
  try {
    const { type, payload } = await request.json();

    if (!type || !payload || !payload.sessionId) {
      return NextResponse.json({ message: "Invalid data structure or missing session ID" }, { status: 400 });
    }

    // Get or create the session ID in the database
    const dbSessionId = await getOrCreateDbSession(payload.websiteId, payload.sessionId);

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

/**
 * Finds an existing session in the DB or creates a new one.
 * This is a simplified implementation. A more robust version might use a single
 * 'INSERT ... ON CONFLICT DO NOTHING' query for better performance.
 * @param {string} websiteId - The ID of the website.
 * @param {string} clientSessionId - The session ID from the client's sessionStorage.
 * @returns {Promise<string>} The database UUID for the session.
 */
import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import UAParser from "ua-parser-js";

/**
 * Handles POST requests from the tracker.
 * Differentiates between 'click' and 'mousemove' events.
 * @param {Request} request - The incoming request object.
 */
export async function POST(request: Request) {
  try {
    const { type, payload } = await request.json();

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
  const { websiteId, sessionId, userAgent } = payload;

  const parser = new UAParser(userAgent);
  const uaResult = parser.getResult();
  
  const browser = uaResult.browser.name;
  const os = uaResult.os.name;
  const device = uaResult.device.type || 'desktop'; // Default to desktop if undefined

  // Using INSERT ... ON CONFLICT to handle session creation and updates atomically.
  // This query tries to insert a new session.
  // If the session ID already exists, it updates the user_agent fields,
  // but only if they are currently NULL. This prevents overwriting existing data.
  const result = await sql`
    INSERT INTO sessions (id, website_id, user_agent, browser, os, device)
    VALUES (${sessionId}, ${websiteId}, ${userAgent}, ${browser}, ${os}, ${device})
    ON CONFLICT (id) DO UPDATE 
      SET 
        user_agent = COALESCE(sessions.user_agent, EXCLUDED.user_agent),
        browser = COALESCE(sessions.browser, EXCLUDED.browser),
        os = COALESCE(sessions.os, EXCLUDED.os),
        device = COALESCE(sessions.device, EXCLUDED.device)
    RETURNING id;
  `;

  return result.rows[0].id;
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
