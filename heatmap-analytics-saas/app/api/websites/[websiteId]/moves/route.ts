
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

interface MoveEventFromDB {
    points: { x: number, y: number }[];
    viewport_width: number;
    viewport_height: number;
}

export async function GET(request: NextRequest, context: any) {
  const { websiteId } = await context.params;

  if (!websiteId) {
    return NextResponse.json({ error: 'Website ID is required' }, { status: 400 });
  }

  try {
    // 1. Authenticate user from JWT Cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    let userId;
    try {
      userId = (jwt.verify(token, process.env.JWT_SECRET!) as any).userId;
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // 2. Verify that the website belongs to this user
    const { rows: websiteRows } = await sql`
      SELECT id FROM websites WHERE id = ${websiteId} AND user_id = ${userId};
    `;

    if (websiteRows.length === 0) {
      return NextResponse.json({ error: 'Forbidden: You do not own this website or it does not exist' }, { status: 403 });
    }

    // 3. Fetch mouse movement data
    const { rows: moveEvents } = await sql<MoveEventFromDB>`
      SELECT points, viewport_width, viewport_height FROM mousemove_events WHERE website_id = ${websiteId};
    `;

    // 4. Process and flatten the data for the heatmap library
    const flattenedPoints = moveEvents.flatMap(event => {
        // The 'points' column is a JSONB array of objects [{x, y}, {x, y}]
        // We need to return each point as a separate object in the final array.
        return event.points.map(point => ({
            x: point.x,
            y: point.y,
            viewport_width: event.viewport_width,
            viewport_height: event.viewport_height
        }));
    });

    return NextResponse.json(flattenedPoints, { status: 200 });

  } catch (error) {
    console.error('Moves API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
