import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Construct the path to schema.sql
    const schemaPath = path.join(process.cwd(), 'schema.sql');
    // Read the schema file
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    // Drop tables before creating them to ensure a clean state
    await sql.query(`DROP TABLE IF EXISTS mousemove_events CASCADE;`);
    await sql.query(`DROP TABLE IF EXISTS click_events CASCADE;`);
    await sql.query(`DROP TABLE IF EXISTS websites CASCADE;`);
    await sql.query(`DROP TABLE IF EXISTS users CASCADE;`);

    // Split the SQL into individual statements and execute them
    const statements = schemaSql.split(';').filter(s => s.trim());

    for (const statement of statements) {
        await sql.query(statement);
    }

    return NextResponse.json({ success: true, message: 'Database reset and re-initialized successfully from schema.sql.' }, { status: 200 });
  } catch (error: any) {
    console.error('Database reset failed:', error);
    return NextResponse.json({ success: false, message: 'Database reset failed.', error: error.message }, { status: 500 });
  }
}
