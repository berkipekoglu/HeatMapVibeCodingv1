"use client";

import React, { useEffect, useState, useRef } from "react";
import H from "heatmap.js";
import { Button } from "./ui/button";

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

interface HeatmapClientProps {
  websiteId: string;
  websiteUrl: string;
}

export default function HeatmapClient({
  websiteId,
  websiteUrl,
}: HeatmapClientProps) {
  const [heatmapType, setHeatmapType] = useState<"click" | "move">("click");
  const [eventData, setEventData] = useState<HeatmapEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(
    "Loading heatmap data..."
  );
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const heatmapContainerRef = useRef<HTMLDivElement>(null);
  const screenshotRef = useRef<HTMLImageElement>(null);
  const heatmapInstance = useRef<any>(null);

  // Combined effect for fetching data and then the screenshot
  useEffect(() => {
    const fetchAll = async () => {
      if (!websiteId) return;

      setIsLoading(true);
      setScreenshotUrl(null); // Reset screenshot on new data fetch

      // 1. Fetch heatmap event data
      setLoadingMessage(`Loading ${heatmapType} data...`);
      const endpoint = heatmapType === "click" ? "clicks" : "moves";
      let data: HeatmapEvent[] = [];
      try {
        const dataRes = await fetch(`/api/websites/${websiteId}/${endpoint}`);
        if (!dataRes.ok) throw new Error(`Failed to fetch ${heatmapType} data`);
        data = await dataRes.json();
        setEventData(data);
      } catch (error) {
        console.error(`Error fetching ${heatmapType} data:`, error);
        setEventData([]);
        setIsLoading(false);
        return; // Stop if data fetching fails
      }

      if (data.length === 0) {
        console.log("No data found, skipping screenshot.");
        setIsLoading(false);
        return;
      }

      // 2. Fetch screenshot using the viewport width from the first data point
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
  }, [websiteId, websiteUrl, heatmapType]);

  // Effect for rendering the heatmap
  useEffect(() => {
    if (
      isLoading ||
      !screenshotUrl ||
      !heatmapContainerRef.current ||
      !screenshotRef.current
    ) {
      return;
    }

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
        });
      }

      // Configure heatmap based on type
      heatmapInstance.current.configure({
        radius: heatmapType === "click" ? 25 : 15,
        maxOpacity: 0.6,
        minOpacity: 0.1,
        blur: 0.85,
      });

      const dataPoints: HeatmapDataPoint[] = eventData.map((event) => {
        const scaleX = screenshotWidth / event.viewport_width;
        return {
          x: Math.round(event.x * scaleX),
          y: event.y,
          value: 1,
        };
      });

      heatmapInstance.current.setData({
        max: heatmapType === "click" ? 5 : 10,
        data: dataPoints,
      });
    };

    if (img.complete) {
      setupHeatmap();
    } else {
      img.onload = setupHeatmap;
    }

    return () => {
      img.onload = null;
    };
  }, [isLoading, screenshotUrl, eventData, heatmapType]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 p-2 border-b bg-gray-50 flex items-center justify-center space-x-2">
        <Button
          variant={heatmapType === "click" ? "default" : "outline"}
          onClick={() => setHeatmapType("click")}
        >
          Click Map
        </Button>
        <Button
          variant={heatmapType === "move" ? "default" : "outline"}
          onClick={() => setHeatmapType("move")}
        >
          Move Map
        </Button>
      </div>
      <div className="flex-grow relative w-full h-full overflow-auto flex justify-center items-center bg-gray-100 p-4">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-20">
            <p className="text-lg text-gray-600">{loadingMessage}</p>
          </div>
        )}
        {!isLoading && eventData.length === 0 && (
          <div className="text-center p-4">
            <p className="text-lg text-gray-600">
              No data available for this period or heatmap type.
            </p>
          </div>
        )}
        {!isLoading && !screenshotUrl && eventData.length > 0 && (
          <div className="text-red-500 text-center p-4">
            <p>
              Failed to load website preview. Please ensure the URL is
              accessible.
            </p>
          </div>
        )}
        {screenshotUrl && (
          <div className="relative inline-block" style={{ fontSize: 0 }}>
            <img
              ref={screenshotRef}
              src={screenshotUrl}
              alt="Website Screenshot"
              className="absolute max-w-full max-h-full object-contain"
            />
            <div
              ref={heatmapContainerRef}
              className="absolute top-0 left-0 z-10 pointer-events-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
