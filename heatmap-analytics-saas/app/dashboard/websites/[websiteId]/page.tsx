import React from "react";
import HeatmapClient from "@/components/HeatmapClient";
import { notFound } from "next/navigation";
import { cookies, headers } from "next/headers";
import Link from "next/link";

interface ClickEvent {
  x: number;
  y: number;
  viewport_width: number;
  viewport_height: number;
}

interface WebsiteData {
  id: string;
  url: string;
}

interface PageProps {
  params: {
    websiteId: string;
  };
}

async function getWebsiteData(
  websiteId: string,
  cookie: string | undefined,
  host: string
): Promise<WebsiteData | null> {
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const url = `${protocol}://${host}/api/websites/${websiteId}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(cookie && { Cookie: `token=${cookie}` }),
  };

  try {
    const response = await fetch(url, { cache: "no-store", headers });
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(
        `Failed to fetch website data. Status: ${response.status}`
      );
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching website data from ${url}:`, error);
    return null;
  }
}

async function getClickData(
  websiteId: string,
  cookie: string | undefined,
  host: string
): Promise<ClickEvent[]> {
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const url = `${protocol}://${host}/api/websites/${websiteId}/clicks`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(cookie && { Cookie: `token=${cookie}` }),
  };

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: headers,
    });

    if (!response.ok) {
      console.error(
        `API Error: Failed to fetch click data for ${websiteId}. Status: ${response.status}`
      );
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error(
      `Network Error: Could not fetch click data from ${url}.`,
      error
    );
    return [];
  }
}

export default async function WebsiteHeatmapPage({ params }: PageProps) {
  const { websiteId } = await params; // Await params here
  const cookieStore = await cookies(); // Await cookies()
  const token = cookieStore.get("token")?.value;
  const headersList = headers();
  const host = (await headersList).get("host") || "";

  const [websiteData, clickData] = await Promise.all([
    getWebsiteData(websiteId, token, host),
    getClickData(websiteId, token, host),
  ]);

  console.log("Heatmap Page: websiteData", websiteData);
  console.log("Heatmap Page: clickData", clickData);

  if (!websiteData) {
    notFound();
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white shadow-sm z-20">
        <div className="max-w-full mx-auto py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Heatmap</h1>
            <p className="text-sm text-gray-500 truncate">{websiteData.url}</p>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>
      <main className="flex-grow relative">
        <HeatmapClient
          websiteId={websiteId}
          initialClickData={clickData}
          websiteUrl={websiteData.url}
        />
      </main>
    </div>
  );
}
