import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient, { WebsiteData, StatsData } from "./DashboardClient";

async function getAuthenticatedFetch() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  const headersList = await headers();
  const host = headersList.get("host") || "";
  const protocol = host.startsWith("localhost") ? "http" : "https";

  return (url: string, options: RequestInit = {}) => {
    const requestHeaders = new Headers(options.headers);
    requestHeaders.set("Cookie", `token=${token}`);
    return fetch(`${protocol}://${host}${url}`, {
      ...options,
      headers: requestHeaders,
      cache: "no-store",
    });
  };
}

export default async function DashboardPage() {
  let websites: WebsiteData[] = [];
  let stats: StatsData | null = null;
  let performanceMetrics: any[] = [];
  let jsErrors: any[] = [];

  try {
    const authedFetch = await getAuthenticatedFetch();

    const websitesRes = await authedFetch("/api/websites");
    if (websitesRes.status === 401) redirect("/login");
    if (!websitesRes.ok)
      throw new Error(
        `Failed to fetch websites. Status: ${websitesRes.status}`
      );
    websites = await websitesRes.json();

    if (websites.length > 0) {
      const firstWebsiteId = websites[0].id;
      const [statsRes, perfRes, errorsRes] = await Promise.all([
        authedFetch(`/api/websites/${firstWebsiteId}/stats`),
        authedFetch(`/api/websites/${firstWebsiteId}/performance`),
        authedFetch(`/api/websites/${firstWebsiteId}/errors`),
      ]);

      if (statsRes.ok) stats = await statsRes.json();
      if (perfRes.ok) performanceMetrics = await perfRes.json();
      if (errorsRes.ok) jsErrors = await errorsRes.json();
    }
  } catch (error: any) {
    if (error.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Dashboard Page Error:", error);
  }

  const totalWebsites = websites.length;
  const totalClicks = websites.reduce(
    (acc, site) => acc + (site.click_count || 0),
    0
  );

  return (
    <DashboardClient
      initialWebsites={websites}
      totalWebsites={totalWebsites}
      totalClicks={totalClicks}
      initialStats={stats}
      performanceMetrics={performanceMetrics}
      jsErrors={jsErrors}
    />
  );
}
