import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getToken } from '../../../../../lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ websiteId: string }> }) {
  const token = await getToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { websiteId } = await params;

  try {
    const ownerCheck = await sql`
      SELECT id FROM websites WHERE id = ${websiteId} AND user_id = ${token.userId};
    `;
    if (ownerCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch average values for each metric name
    const { rows } = await sql`
      SELECT 
        metric_name,
        AVG(value) as average_value,
        COUNT(*) as data_points
      FROM performance_metrics
      WHERE website_id = ${websiteId}
      GROUP BY metric_name;
    `;

    return NextResponse.json(rows);

  } catch (error) {
    console.error('Performance API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
