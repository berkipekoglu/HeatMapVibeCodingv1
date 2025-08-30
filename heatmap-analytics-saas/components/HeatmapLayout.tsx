"use client";

import React from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { ArrowLeft, MousePointerClick, Eye } from "lucide-react";

interface HeatmapLayoutProps {
  children: React.ReactNode;
  websiteId: string;
  websiteName: string;
  websiteUrl: string;
}

export default function HeatmapLayout({
  children,
  websiteId,
  websiteName,
  websiteUrl,
}: HeatmapLayoutProps) {
  return (
    <div className="flex flex-col h-fit">
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
                {websiteName}
              </h1>
              <p className="text-sm text-gray-500 truncate">{websiteUrl}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/websites/${websiteId}/clicks`}>
                <Eye className="w-4 h-4 mr-2" />
                Click Map
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/websites/${websiteId}/moves`}>
                <MousePointerClick className="w-4 h-4 mr-2" />
                Move Map
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-grow overflow-hidden">{children}</main>
    </div>
  );
}
