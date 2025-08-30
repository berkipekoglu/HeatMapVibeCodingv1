"use client";

import React, { useEffect, useState, useRef } from "react";
import H from "heatmap.js";

interface ClickEvent {
  x: number;
  y: number;
  viewport_width: number; // Changed to snake_case
  viewport_height: number; // Changed to snake_case
}

interface HeatmapDataPoint {
  x: number;
  y: number;
  value: number;
}

interface HeatmapClientProps {
  websiteId: string;
  initialClickData: ClickEvent[];
  websiteUrl: string;
}

export default function HeatmapClient({
  websiteId,
  initialClickData,
  websiteUrl,
}: HeatmapClientProps) {
  console.log("HeatmapClient: initialClickData received:", initialClickData);
  const [clickData] = useState<ClickEvent[]>(initialClickData);
  const [isLoading, setIsLoading] = useState(true);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const heatmapContainerRef = useRef<HTMLDivElement>(null);
  const screenshotRef = useRef<HTMLImageElement>(null);
  const heatmapInstance = useRef<any>(null);

  useEffect(() => {
    console.log(
      "HeatmapClient useEffect: Component mounted or clickData changed."
    );

    const fetchScreenshot = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/screenshot?url=${encodeURIComponent(websiteUrl)}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch screenshot");
        }
        const base64Image = await response.text();
        setScreenshotUrl(`data:image/jpeg;base64,${base64Image}`);
      } catch (error) {
        console.error("Error fetching screenshot:", error);
        setScreenshotUrl(null); // Clear screenshot on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchScreenshot();
  }, [websiteUrl]); // Re-fetch screenshot if websiteUrl changes

  useEffect(() => {
    if (!heatmapContainerRef.current || !screenshotRef.current || isLoading) {
      console.log(
        "HeatmapClient useEffect (heatmap setup): Refs not ready or still loading."
      );
      return;
    }

    // Ensure heatmap container matches screenshot dimensions
    const img = screenshotRef.current;
    const updateHeatmapDimensions = () => {
      if (heatmapContainerRef.current) {
        const screenshotWidth = img.naturalWidth;
        const screenshotHeight = img.naturalHeight;

        console.log(
          "HeatmapClient: img.naturalWidth:",
          img.naturalWidth,
          "img.naturalHeight:",
          img.naturalHeight
        );

        if (screenshotWidth === 0 || screenshotHeight === 0) {
          console.error(
            "HeatmapClient: Screenshot dimensions are 0. Cannot set heatmap dimensions."
          );
          return;
        }

        heatmapContainerRef.current.style.width = `${screenshotWidth}px`;
        heatmapContainerRef.current.style.height = `${screenshotHeight}px`;
        console.log(
          "HeatmapClient: Heatmap container dimensions set to",
          screenshotWidth,
          screenshotHeight
        );

        // Initialize heatmap instance if not already
        if (!heatmapInstance.current) {
          console.log("HeatmapClient: Initializing heatmap.js.");
          heatmapInstance.current = H.create({
            container: heatmapContainerRef.current,
            radius: 25,
            maxOpacity: 0.6,
            minOpacity: 0.1,
            blur: 0.85,
          });
          console.log(
            "HeatmapClient: heatmapInstance created.",
            heatmapInstance.current
          );
        }

        // Prepare data for heatmap with scaling
        const dataPoints: HeatmapDataPoint[] = clickData.map((click) => {
          // Calculate scaling factors
          const scaleX = screenshotWidth / click.viewport_width;
          const scaleY = screenshotHeight / click.viewport_height;

          return {
            x: Math.round(click.x * scaleX),
            y: Math.round(click.y * scaleY),
            value: 1, // All clicks have the same weight for now
          };
        });

        console.log("HeatmapClient: Data points prepared.", dataPoints);
        if (dataPoints.length > 0) {
          console.log(
            "HeatmapClient: Setting heatmap data. Data points count:",
            dataPoints.length
          );
          // Set data on the heatmap instance
          heatmapInstance.current.setData({
            max: 5, // Adjust max value for better visualization if needed
            data: dataPoints,
          });
        } else {
          console.log("HeatmapClient: No data points to set for heatmap.");
          heatmapInstance.current.setData({ max: 1, data: [] }); // Clear heatmap if no data
        }
      }
    };

    // If image is already loaded, update dimensions immediately
    if (img.complete) {
      updateHeatmapDimensions();
    } else {
      // Otherwise, wait for image to load
      img.onload = updateHeatmapDimensions;
    }

    // Cleanup for image onload
    return () => {
      if (img) {
        img.onload = null;
      }
    };
  }, [isLoading, screenshotUrl, clickData]); // Dependencies for heatmap setup

  return (
    <div className="relative w-full h-full overflow-auto flex justify-center items-center bg-gray-100">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <p className="text-lg text-gray-600">Generating website preview...</p>
        </div>
      )}
      {!isLoading && !screenshotUrl && (
        <div className="text-red-500 text-center p-4">
          <p>
            Failed to load website preview. Please ensure the URL is accessible.
          </p>
        </div>
      )}
      {!isLoading && screenshotUrl && (
        <div
          className="relative"
          style={{ maxWidth: "100%", maxHeight: "100%" }}
        >
          <img
            ref={screenshotRef}
            src={screenshotUrl}
            alt="Website Screenshot"
            className="absolute top-0 left-0 w-full h-full object-contain"
            onLoad={() => setIsLoading(false)} // This might be redundant due to fetchScreenshot's finally block
          />
          <div
            ref={heatmapContainerRef}
            className="absolute top-4 left-0 z-10 pointer-events-none"
            style={{ width: "100%", height: "100%" }} // Initial size, will be updated by JS
          />
        </div>
      )}
    </div>
  );
}
