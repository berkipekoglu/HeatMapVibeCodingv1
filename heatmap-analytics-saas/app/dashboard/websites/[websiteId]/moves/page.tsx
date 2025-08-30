
import { getToken } from '@/lib/auth';
import { sql } from '@vercel/postgres';
import { redirect } from 'next/navigation';
import MoveHeatmap from '@/components/MoveHeatmap';
import HeatmapLayout from '@/components/HeatmapLayout';

async function getWebsiteData(websiteId: string) {
    const token = await getToken();
    if (!token) {
        redirect('/login');
    }

    const { rows } = await sql`
        SELECT id, name, url FROM websites WHERE id = ${websiteId} AND user_id = ${token.userId};
    `;
    return rows[0];
}

export default async function MoveHeatmapPage({ params }: { params: { websiteId: string } }) {
    const website = await getWebsiteData(params.websiteId);

    if (!website) {
        return <div>Website not found or you do not have permission to view it.</div>;
    }

    return (
        <HeatmapLayout websiteId={website.id} websiteName={website.name} websiteUrl={website.url}>
            <MoveHeatmap websiteId={website.id} websiteUrl={website.url} />
        </HeatmapLayout>
    );
}
