import MoveHeatmap from '@/components/MoveHeatmap';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Helper function to create a fetch instance with the auth cookie
async function getAuthenticatedFetch() {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        redirect('/login');
    }

    return (url: string, options: RequestInit = {}) => {
        const headers = new Headers(options.headers);
        headers.set('Cookie', `token=${token}`);
        return fetch(url, { ...options, headers });
    };
}

async function getWebsiteDetails(websiteId: string, authedFetch: any) {
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/websites/${websiteId}`);
    if (!res.ok) return null;
    return res.json();
}

async function getWebsitePages(websiteId: string, authedFetch: any) {
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/websites/${websiteId}/pages`);
    if (!res.ok) return [];
    return res.json();
}

export default async function MoveHeatmapPage({ params }: { params: { websiteId: string } }) {
    const { websiteId } = params;
    const authedFetch = await getAuthenticatedFetch();

    const website = await getWebsiteDetails(websiteId, authedFetch);
    const pages = await getWebsitePages(websiteId, authedFetch);

    if (!website) {
        return <div>Website not found or you do not have permission to view it.</div>;
    }

    return (
        <MoveHeatmap 
            websiteId={website.id} 
            websiteUrl={website.url} 
            initialPages={pages} 
        />
    );
}
