import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getToken } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { websiteId: string } }) {
  try {
    const user = await getToken(req);
    if (!user || !user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { websiteId } = await params;
    console.log('API (GET /api/websites/[websiteId]): websiteId', websiteId);

    const { rows } = await sql`
      SELECT id, url FROM websites WHERE id = ${websiteId} AND user_id = ${user.userId}
    `;
    console.log('API (GET /api/websites/[websiteId]): SQL result rows', rows);

    if (rows.length === 0) {
      console.log('API (GET /api/websites/[websiteId]): Website not found for user', user.userId, 'and websiteId', websiteId);
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching website:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
