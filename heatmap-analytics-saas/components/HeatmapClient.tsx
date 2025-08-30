"use client";

import React, { useEffect, useState, useRef } from "react";
import H from "heatmap.js";
import { Button } from "./ui/button"; // Assuming shadcn button is available

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
  const [isScreenshotLoading, setIsScreenshotLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const heatmapContainerRef = useRef<HTMLDivElement>(null);
  const screenshotRef = useRef<HTMLImageElement>(null);
  const heatmapInstance = useRef<any>(null);

  // Effect for fetching the website screenshot
  useEffect(() => {
    const fetchScreenshot = async () => {
      if (!websiteUrl) return;
      setIsScreenshotLoading(true);
      try {
        const response = await fetch(
          `/api/screenshot?url=${encodeURIComponent(websiteUrl)}`
        );
        if (!response.ok) throw new Error("Failed to fetch screenshot");
        const base64Image = await response.text();
        setScreenshotUrl(`data:image/jpeg;base64,${base64Image}`);
      } catch (error) {
        console.error("Error fetching screenshot:", error);
        setScreenshotUrl(null);
      } finally {
        setIsScreenshotLoading(false);
      }
    };
    fetchScreenshot();
  }, [websiteUrl]);

  // Effect for fetching heatmap data (clicks or moves)
  useEffect(() => {
    const fetchData = async () => {
      if (!websiteId) return;
      setIsDataLoading(true);
      const endpoint = heatmapType === "click" ? "clicks" : "moves";
      try {
        const response = await fetch(`/api/websites/${websiteId}/${endpoint}`);
        if (!response.ok)
          throw new Error(`Failed to fetch ${heatmapType} data`);
        const data: HeatmapEvent[] = await response.json();
        setEventData(data);
      } catch (error) {
        console.error(`Error fetching ${heatmapType} data:`, error);
        setEventData([]);
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchData();
  }, [websiteId, heatmapType]);

  // Effect for initializing and updating the heatmap
  useEffect(() => {
    if (
      isScreenshotLoading ||
      !screenshotUrl ||
      !heatmapContainerRef.current ||
      !screenshotRef.current
    ) {
      return;
    }

    const img = screenshotRef.current;
    console.log("image width:", img.width);
    console.log("image height:", img.height);
    console.log("image natural width:", img.naturalWidth);
    console.log("image natural height:", img.naturalHeight);

    const setupHeatmap = () => {
      const screenshotWidth = img.naturalWidth;
      const screenshotHeight = img.naturalHeight;

      if (screenshotWidth === 0 || screenshotHeight === 0) return;

      if (heatmapContainerRef.current) {
        heatmapContainerRef.current.style.width = `${screenshotWidth}px`;
        heatmapContainerRef.current.style.height = `${screenshotHeight}px`;
      }

      if (!heatmapInstance.current && heatmapContainerRef.current) {
        heatmapInstance.current = H.create({
          container: heatmapContainerRef.current,
          radius: heatmapType === "click" ? 25 : 15,
          maxOpacity: 0.6,
          minOpacity: 0.1,
          blur: 0.85,
        });
      }

      // Update radius based on type
      if (heatmapInstance.current) {
        heatmapInstance.current._config.radius =
          heatmapType === "click" ? 25 : 15;
      }

      const dataPoints: HeatmapDataPoint[] = eventData.map((event) => {
        const scaleX = screenshotWidth / event.viewport_width;
        const scaleY = screenshotHeight / event.viewport_height;
        return {
          x: Math.round(event.x * scaleX),
          y: Math.round(event.y * scaleY),
          value: 1,
        };
      });

      heatmapInstance.current.setData({
        max: heatmapType === "click" ? 5 : 10, // Different max for better visualization
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
  }, [isScreenshotLoading, screenshotUrl, eventData, heatmapType]);

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
      <div className="flex-grow relative w-full h-full overflow-auto flex justify-center items-center bg-gray-100">
        {(isScreenshotLoading || isDataLoading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-20">
            <p className="text-lg text-gray-600">
              {isScreenshotLoading
                ? "Generating website preview..."
                : "Loading heatmap data..."}
            </p>
          </div>
        )}
        {!isScreenshotLoading && !screenshotUrl && (
          <div className="text-red-500 text-center p-4">
            <p>
              Failed to load website preview. Please ensure the URL is
              accessible.
            </p>
          </div>
        )}
        {screenshotUrl && (
          <div className="relative w-fit">
            <img
              ref={screenshotRef}
              src={screenshotUrl}
              alt="Website Screenshot"
              className="absolute w-full h-auto"
            />
            <div
              ref={heatmapContainerRef}
              className="absolute inset-0 z-10 pointer-events-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
