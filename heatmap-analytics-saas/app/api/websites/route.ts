import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getToken } from '@/lib/auth';

// GET: Fetch all websites for the logged-in user with click counts
export async function GET(req: NextRequest) {
  try {
    const user = await getToken(req);
    if (!user || !user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userIdString = String(user.userId);

    const { rows } = await sql`
      SELECT
        w.id,
        w.name,
        w.url,
        w.created_at,
        COUNT(c.id)::int AS click_count
      FROM
        websites w
      LEFT JOIN
        click_events c ON w.id = c.website_id
      WHERE
        w.user_id = ${userIdString}
      GROUP BY
        w.id, w.name, w.url, w.created_at
      ORDER BY
        w.created_at DESC
    `;

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching websites:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Add a new website for the logged-in user
export async function POST(req: NextRequest) {
  try {
    const user = await getToken(req);
    if (!user || !user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, url } = await req.json();

    if (!url || !name) {
      return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 });
    }

    try {
      new URL(url);
    } catch (_) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const { rows } = await sql`
      INSERT INTO websites (user_id, name, url)
      VALUES (${user.userId}, ${name}, ${url})
      RETURNING id, name, url, created_at
    `;

    // Add click_count to the new record
    const newWebsite = { ...rows[0], click_count: 0 };

    return NextResponse.json(newWebsite, { status: 201 });
  } catch (error) {
    console.error('Error adding website:', error);
    if (error.code === '23505') {
        return NextResponse.json({ error: 'Website with this URL already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}