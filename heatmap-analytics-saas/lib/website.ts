import { getToken } from './auth';
import { sql } from '@vercel/postgres';
import { redirect } from 'next/navigation';

export async function getWebsiteData(websiteId: string) {
    const token = await getToken();
    if (!token) {
        redirect('/login');
    }

    const { rows } = await sql`
        SELECT id, name, url FROM websites WHERE id = ${websiteId} AND user_id = ${token.userId};
    `;
    return rows[0];
}
