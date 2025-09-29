import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getToken } from '../../../../../lib/auth';

export async function GET(request: NextRequest, { params }: { params: { websiteId: string } }) {
  const token = await getToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { websiteId } = params;
  const { searchParams } = new URL(request.url);
  const pageUrl = searchParams.get('url');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
    const ownerCheck = await sql`
      SELECT id FROM websites WHERE id = ${websiteId} AND user_id = ${token.userId};
    `;

    if (ownerCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let query = `
      SELECT x, y, viewport_width, viewport_height, timestamp 
      FROM click_events 
      WHERE website_id = '${websiteId}'
    `;

    if (pageUrl) {
      query += ` AND url = '${pageUrl}'`;
    }
    if (startDate) {
      query += ` AND timestamp >= '${startDate}'`;
    }
    if (endDate) {
      query += ` AND timestamp <= '${endDate}'`;
    }

    const { rows: clickEvents } = await sql.query(query);

    return NextResponse.json(clickEvents, { status: 200 });

  } catch (error) {
    console.error('Clicks API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
