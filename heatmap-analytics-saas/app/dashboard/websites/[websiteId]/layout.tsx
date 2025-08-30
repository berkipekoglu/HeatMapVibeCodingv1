import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MousePointerClick, Eye } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { getToken } from "@/lib/auth";
import { sql } from "@vercel/postgres";

// Re-introduce getWebsiteData here
async function getWebsiteData(websiteId: string) {
  const token = await getToken();
  if (!token) {
    redirect("/login");
  }

  const { rows } = await sql`
        SELECT id, name, url FROM websites WHERE id = ${websiteId} AND user_id = ${token.userId};
    `;
  return rows[0];
}

export default async function WebsiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { websiteId: string };
}) {
  const { websiteId } = await params;
  const website = await getWebsiteData(websiteId);

  if (!website) {
    notFound(); // Or handle error appropriately
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex-shrink-0 p-4 border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost" size="icon">
              <Link href="/dashboard">
                <ArrowLeft className="w-5 h-5" />
                <span className="sr-only">Back to Dashboard</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {website.name}
              </h1>
              <p className="text-sm text-gray-500 truncate">{website.url}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/websites/${website.id}/clicks`}>
                <Eye className="w-4 h-4 mr-2" />
                Click Map
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/websites/${website.id}/moves`}>
                <MousePointerClick className="w-4 h-4 mr-2" />
                Move Map
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-grow text-center items-center mt-2">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              websiteUrl: website.url,
            } as any);
          }
          return child;
        })}
      </main>
    </div>
  );
}
