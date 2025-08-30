import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Attempt a simple query to check the connection
    await sql`SELECT 1`;
    return NextResponse.json({ success: true, message: 'Database connection successful.' }, { status: 200 });
  } catch (error: any) {
    console.error('Database connection test failed:', error);
    return NextResponse.json({ success: false, message: 'Database connection failed.', error: error.message }, { status: 500 });
  }
}
