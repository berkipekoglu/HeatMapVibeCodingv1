import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getToken } from '../../../../../lib/auth'; // Adjust path as needed

export async function GET(request: Request, { params }: { params: { websiteId: string } }) {
  const token = await getToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { websiteId } = params;

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

    const pages = rows.map(row => row.url);

    return NextResponse.json(pages);

  } catch (error) {
    console.error('Error fetching website pages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
