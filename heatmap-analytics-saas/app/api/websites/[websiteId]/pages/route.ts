import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getToken } from '../../../../../lib/auth'; // Adjust path as needed

export async function GET(request: Request, { params }: { params: Promise<{ websiteId: string }> }) {
  const token = await getToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { websiteId } = await params;

  try {
    // First, verify the user owns this website to prevent unauthorized access
    const ownerCheck = await sql`
      SELECT id FROM websites WHERE id = ${websiteId} AND user_id = ${token.userId};
    `;

    if (ownerCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch distinct page URLs from both click and move events
    const { rows } = await sql`
      WITH all_pages AS (
        SELECT DISTINCT url FROM click_events WHERE website_id = ${websiteId}
        UNION
        SELECT DISTINCT url FROM mousemove_events WHERE website_id = ${websiteId}
      )
      SELECT * FROM all_pages ORDER BY url;
    `;

    // Normalize and deduplicate URLs
    const normalizedPages = new Set(rows.map(row => {
      try {
        const url = new URL(row.url);
        return url.origin + url.pathname;
      } catch (e) {
        return row.url; // Return original if it's not a valid URL
      }
    }));

    return NextResponse.json(Array.from(normalizedPages));

  } catch (error) {
    console.error('Error fetching website pages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
