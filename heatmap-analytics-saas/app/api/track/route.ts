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

    if (!type || !payload) {
        return NextResponse.json({ message: "Invalid data structure" }, { status: 400 });
    }

    switch (type) {
        case 'click':
            await handleSingleEvent(payload);
            break;
        case 'mousemove':
            await handleMoveEvent(payload);
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

async function handleSingleEvent(payload: any) {
    const { x, y, url, websiteId, viewportWidth, viewportHeight } = payload;
    if (typeof x !== "number" || typeof y !== "number" || !url || !websiteId || typeof viewportWidth !== "number" || typeof viewportHeight !== "number") {
        throw new Error("Invalid click data format");
    }

    await sql`
        INSERT INTO click_events (website_id, x, y, url, viewport_width, viewport_height)
        VALUES (${websiteId}, ${x}, ${y}, ${url}, ${viewportWidth}, ${viewportHeight});
    `;
}

async function handleMoveEvent(payload: any) {
    const { points, url, websiteId, viewportWidth, viewportHeight } = payload;
    if (!Array.isArray(points) || points.length === 0 || !url || !websiteId || typeof viewportWidth !== "number" || typeof viewportHeight !== "number") {
        throw new Error("Invalid mousemove data format");
    }

    // JSON.stringify is needed to insert the array into the JSONB column.
    await sql`
        INSERT INTO mousemove_events (website_id, points, url, viewport_width, viewport_height)
        VALUES (${websiteId}, ${JSON.stringify(points)}, ${url}, ${viewportWidth}, ${viewportHeight});
    `;
}


// Handler for OPTIONS requests (CORS preflight)
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*", // Should be restricted to specific domains later
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
