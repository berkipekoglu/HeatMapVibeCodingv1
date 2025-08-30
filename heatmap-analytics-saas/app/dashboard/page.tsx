import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient, { WebsiteData } from "./DashboardClient";

export default async function DashboardPage() {
  let websites: WebsiteData[] = [];

  try {
    const cookieStore = cookies(); // Get the cookie store
    const token = (await cookieStore).get("token")?.value; // Retrieve the token

    if (!token) {
      // If token is not found, redirect to login
      redirect("/login");
    }

    const headersList = headers();
    const host = (await headersList).get("host") || "";
    const protocol = host.startsWith("localhost") ? "http" : "https";
    const res = await fetch(`${protocol}://${host}/api/websites`, {
      headers: {
        Cookie: `token=${token}`,
      },
      cache: "no-store",
    });

    if (res.status === 401) {
      redirect("/login");
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch websites. Status: ${res.status}`);
    }

    websites = await res.json();
  } catch (error: any) {
    // The `redirect` function throws a special error that we should not catch.
    // We re-throw it to let Next.js handle the redirect.
    if (error.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Dashboard Page Error:", error);
    // Render the page with an empty state in case of other errors.
  }

  // Calculate metrics
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
    />
  );
}
