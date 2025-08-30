"use client";

import React, { useEffect, useState, useRef } from "react";
import H from "heatmap.js";

// Type definitions
interface HeatmapEvent {
  x: number;
  y: number;
  viewport_width: number;
  viewport_height: number;
}

interface HeatmapDataPoint {
  x: number;
  y: number;
  value: number;
}

interface HeatmapProps {
  websiteId: string;
  websiteUrl: string;
}

export default function ClickHeatmap({ websiteId, websiteUrl }: HeatmapProps) {
  const [eventData, setEventData] = useState<HeatmapEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Loading click data...");
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const heatmapContainerRef = useRef<HTMLDivElement>(null);
  const screenshotRef = useRef<HTMLImageElement>(null);
  const heatmapInstance = useRef<any>(null);

  // Effect for fetching data and then the screenshot
  useEffect(() => {
    const fetchAll = async () => {
      if (!websiteId) return;

      setIsLoading(true);
      setScreenshotUrl(null);

      // 1. Fetch click data
      setLoadingMessage("Loading click data...");
      let data: HeatmapEvent[] = [];
      try {
        const dataRes = await fetch(`/api/websites/${websiteId}/clicks`);
        if (!dataRes.ok) throw new Error("Failed to fetch click data");
        data = await dataRes.json();
        setEventData(data);
      } catch (error) {
        console.error("Error fetching click data:", error);
        setEventData([]);
        setIsLoading(false);
        return;
      }

      if (data.length === 0) {
        setIsLoading(false);
        return;
      }

      // 2. Fetch screenshot
      setLoadingMessage("Generating website preview...");
      try {
        const representativeWidth = data[0].viewport_width;
        const screenshotRes = await fetch(
          `/api/screenshot?url=${encodeURIComponent(
            websiteUrl
          )}&w=${representativeWidth}`
        );
        if (!screenshotRes.ok) throw new Error("Failed to fetch screenshot");
        const base64Image = await screenshotRes.text();
        setScreenshotUrl(`data:image/jpeg;base64,${base64Image}`);
      } catch (error) {
        console.error("Error fetching screenshot:", error);
        setScreenshotUrl(null);
      }

      setIsLoading(false);
    };

    fetchAll();
  }, [websiteId, websiteUrl]);

  // Effect for rendering the heatmap
  useEffect(() => {
    if (
      isLoading ||
      !screenshotUrl ||
      !heatmapContainerRef.current ||
      !screenshotRef.current
    )
      return;

    const img = screenshotRef.current;

    const setupHeatmap = () => {
      const screenshotWidth = img.naturalWidth;
      if (screenshotWidth === 0) return;

      if (heatmapContainerRef.current) {
        heatmapContainerRef.current.style.width = `${screenshotWidth}px`;
        heatmapContainerRef.current.style.height = `${img.naturalHeight}px`;
      }

      if (!heatmapInstance.current && heatmapContainerRef.current) {
        heatmapInstance.current = H.create({
          container: heatmapContainerRef.current,
          radius: 25,
          maxOpacity: 0.6,
          minOpacity: 0.1,
          blur: 0.85,
        });
      }

      const dataPoints: HeatmapDataPoint[] = eventData.map((event) => {
        const scaleX = screenshotWidth / event.viewport_width;
        return {
          x: Math.round(event.x * scaleX),
          y: event.y,
          value: 1,
        };
      });

      heatmapInstance.current.setData({
        max: 5,
        data: dataPoints,
      });
    };

    if (img.complete) setupHeatmap();
    else img.onload = setupHeatmap;

    return () => {
      img.onload = null;
    };
  }, [isLoading, screenshotUrl, eventData]);

  return (
    <div className="relative w-full h-full overflow-auto flex justify-center bg-gray-100 p-4">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-20">
          <p className="text-lg text-gray-600">{loadingMessage}</p>
        </div>
      )}
      {!isLoading && eventData.length === 0 && (
        <div className="text-center p-4">
          <p className="text-lg text-gray-600">
            No click data available for this period.
          </p>
        </div>
      )}
      {!isLoading && !screenshotUrl && eventData.length > 0 && (
        <div className="text-red-500 text-center p-4">
          <p>
            Failed to load website preview. Please ensure the URL is accessible.
          </p>
        </div>
      )}
      {screenshotUrl && (
        <div className="relative inline-block" style={{ fontSize: 0 }}>
          <img
            ref={screenshotRef}
            src={screenshotUrl}
            alt="Website Screenshot"
            className="absolute w-fit h-fit object-fill"
          />
          <div
            ref={heatmapContainerRef}
            className="absolute top-0 left-0 z-10 pointer-events-none"
          />
        </div>
      )}
    </div>
  );
}
