import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { Client } from '@upstash/qstash';
import { getToken } from '@/lib/auth';
import { sql } from '@vercel/postgres';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN!,
});

export async function POST(req: NextRequest) {
  const token = await getToken(req);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { websiteId, websiteUrl } = await req.json();

  if (!websiteId || !websiteUrl) {
    return NextResponse.json({ error: 'Website ID and URL are required' }, { status: 400 });
  }

  try {
    // Verify user owns the website
    const ownerCheck = await sql`
      SELECT id FROM websites WHERE id = ${websiteId} AND user_id = ${token.userId};
    `;

    if (ownerCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Clear all cached screenshots for this website by finding all related keys
    // This is a simplified approach. For production, avoid using SCAN in an API route if possible.
    const pattern = `screenshot:${websiteId}:*`;
    let cursor = 0;
    do {
      const [nextCursor, keys] = await redis.scan(cursor, { match: pattern });
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      cursor = nextCursor;
    } while (cursor !== 0);

    // Publish a job to QStash to regenerate for a default viewport (e.g., 1280px)
    // The user will see the placeholder and then the new image on their next visit.
    await qstashClient.publishJSON({
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/process-screenshot`,
      body: {
        url: websiteUrl,
        websiteId: websiteId,
        viewportWidth: 1280, // Regenerate for a default common width
      },
    });

    return NextResponse.json({ success: true, message: 'Screenshot refresh initiated.' });

  } catch (error) {
    console.error('[SCREENSHOT_REFRESH_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
