import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest, context: any) { // context: any is temporary
  console.log('Clicks API: Request received.');
  const { websiteId } = await context.params; // ADDED AWAIT HERE

  if (!websiteId) {
    console.log('Clicks API: Website ID is missing.');
    return NextResponse.json({ error: 'Website ID is required' }, { status: 400 });
  }

  try {
    // 1. Kullanıcı kimliğini doğrula (JWT Cookie'den)
    console.log('Clicks API: Authenticating user...');
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      console.log('Clicks API: No token provided.');
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    let userId;
    try {
      userId = (jwt.verify(token, process.env.JWT_SECRET!) as any).userId;
      console.log('Clicks API: User authenticated. userId:', userId);
    } catch (error) {
      console.log('Clicks API: Invalid token.', error);
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // 2. Web sitesinin bu kullanıcıya ait olduğunu doğrula
    console.log('Clicks API: Verifying website ownership...');
    const { rows: websiteRows } = await sql`
      SELECT id FROM websites WHERE id = ${websiteId} AND user_id = ${userId};
    `;

    if (websiteRows.length === 0) {
      console.log('Clicks API: Website not found or not owned by user.');
      return NextResponse.json({ error: 'Forbidden: You do not own this website or it does not exist' }, { status: 403 });
    }
    console.log('Clicks API: Website ownership verified.');

    // 3. Tıklama verilerini getir
    console.log('Clicks API: Fetching click data...');
    const { rows: clickEvents } = await sql`
      SELECT x, y, viewport_width, viewport_height, timestamp FROM click_events WHERE website_id = ${websiteId};
    `;
    console.log('Clicks API: Click data fetched. Count:', clickEvents.length);

    return NextResponse.json(clickEvents, { status: 200 });

  } catch (error) {
    console.error('Clicks API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}