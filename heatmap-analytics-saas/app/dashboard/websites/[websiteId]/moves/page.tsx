import MoveHeatmap from '@/components/MoveHeatmap';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Helper function to create a fetch instance with the auth cookie
async function getAuthenticatedFetch() {
    const cookieStore = cookies();
    const token = (await cookieStore).get('token')?.value;

    if (!token) {
        redirect('/login');
    }

    return (url: string, options: RequestInit = {}) => {
        const headers = new Headers(options.headers);
        headers.set('Cookie', `token=${token}`);
        return fetch(url, { ...options, headers });
    };
}

async function getWebsiteData(websiteId: string, authedFetch: any) {
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/websites/${websiteId}`);
    if (!res.ok) return null;
    return res.json();
}

async function getWebsitePages(websiteId: string, authedFetch: any) {
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/websites/${websiteId}/pages`);
    if (!res.ok) return [];
    return res.json();
}

async function getWebsiteStats(websiteId: string, authedFetch: any) {
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/websites/${websiteId}/stats`);
    if (!res.ok) return null;
    return res.json();
}

export default async function MoveHeatmapPage({ params }: { params: Promise<{ websiteId: string }> }) {
    const { websiteId } = await params;
    const authedFetch = await getAuthenticatedFetch();

    // Fetch all data in parallel
    const [website, pages, stats] = await Promise.all([
        getWebsiteData(websiteId, authedFetch),
        getWebsitePages(websiteId, authedFetch),
        getWebsiteStats(websiteId, authedFetch)
    ]);

    if (!website) {
        return <div>Website not found or you do not have permission to view it.</div>;
    }

    return (
        <MoveHeatmap 
            websiteId={website.id} 
            websiteUrl={website.url} 
            initialPages={pages} 
            stats={stats}
        />
    );
}
