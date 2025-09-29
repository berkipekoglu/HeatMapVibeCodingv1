"use client";

import { useEffect, useRef, useState } from "react";
import H from "heatmap.js";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";

// Type definitions
interface HeatmapEvent {
  x: number;
  y: number;
  viewport_width: number;
  viewport_height: number;
}

interface HeatmapProps {
  websiteId: string;
  websiteUrl: string;
  initialPages: string[];
}

export default function MoveHeatmap({ websiteId, websiteUrl, initialPages }: HeatmapProps) {
  const [eventData, setEventData] = useState<HeatmapEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Loading move data...");
  const [screenshotUrl, setScreenshotUrl] = useState<string>("");
  const [pages, setPages] = useState<string[]>(initialPages);
  const [selectedPage, setSelectedPage] = useState<string>(websiteUrl);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const heatmapContainerRef = useRef<HTMLDivElement>(null);
  const screenshotRef = useRef<HTMLImageElement>(null);
  const heatmapInstance = useRef<any>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchDataForPage = async () => {
      if (!websiteId || !selectedPage) return;

      setIsLoading(true);
      setStatusMessage("Loading move data for selected page...");
      setScreenshotUrl("");
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);

      try {
        let apiUrl = `/api/websites/${websiteId}/moves?url=${encodeURIComponent(selectedPage)}`;
        if (dateRange?.from) {
          apiUrl += `&startDate=${dateRange.from.toISOString()}`;
        }
        if (dateRange?.to) {
          apiUrl += `&endDate=${dateRange.to.toISOString()}`;
        }

        const dataRes = await fetch(apiUrl);
        if (!dataRes.ok) throw new Error("Failed to fetch move data");
        const data = await dataRes.json();
        setEventData(data);

        if (data.length > 0) {
          setStatusMessage("Loading website preview...");
          const representativeWidth = data[0].viewport_width;
          const initialUrl = `/api/screenshot?url=${encodeURIComponent(
            selectedPage
          )}&websiteId=${websiteId}&w=${representativeWidth}&t=${Date.now()}`;
          setScreenshotUrl(initialUrl);
        } else {
          setStatusMessage("No move data available for this selection.");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setEventData([]);
        setStatusMessage("Failed to load data for this selection.");
        setIsLoading(false);
      }
    };

    fetchDataForPage();

    return () => {
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
    };
  }, [websiteId, selectedPage, dateRange]);

  const handleImageLoad = () => {
    const img = screenshotRef.current;
    if (!img) return;

    if (img.src.includes("placeholder.svg")) {
      setStatusMessage("Generating website preview... (this may take a moment)");
      pollingTimeoutRef.current = setTimeout(() => {
        const newUrl = `${screenshotUrl.split('&t=')[0]}&t=${Date.now()}`;
        setScreenshotUrl(newUrl);
      }, 3000);
    } else {
      setIsLoading(false);
      setStatusMessage("");
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
    }
  };

  useEffect(() => {
    if (isLoading || !screenshotUrl || !eventData.length || !heatmapContainerRef.current || !screenshotRef.current) {
      return;
    }
    const img = screenshotRef.current;
    if (img.src.includes("placeholder.svg")) return;
    const setupHeatmap = () => {
      const screenshotWidth = img.naturalWidth;
      if (screenshotWidth === 0) return;
      if (heatmapContainerRef.current) {
        heatmapContainerRef.current.style.width = `${screenshotWidth}px`;
        heatmapContainerRef.current.style.height = `${img.naturalHeight}px`;
      }
      if (!heatmapInstance.current) {
        heatmapInstance.current = H.create({ container: heatmapContainerRef.current, radius: 15, maxOpacity: 0.5, minOpacity: 0.1, blur: 0.9 });
      }
      const dataPoints = eventData.map((event) => ({
        x: Math.round(event.x * (screenshotWidth / event.viewport_width)),
        y: event.y,
        value: 1,
      }));
      heatmapInstance.current.setData({ max: 10, data: dataPoints });
    };
    if (img.complete) setupHeatmap();
    else img.onload = setupHeatmap;
  }, [isLoading, screenshotUrl, eventData]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label htmlFor="page-select" className="mr-2 font-semibold text-sm">Page:</label>
          <select 
            id="page-select"
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="p-2 border rounded-md bg-white shadow-sm text-sm"
          >
            {pages.map(page => (
              <option key={page} value={page}>{new URL(page).pathname}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mr-2 font-semibold text-sm">Date Range:</label>
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
        </div>
      </div>

      <div className="relative w-full flex justify-center items-start pt-4">
        {(isLoading || statusMessage) && !(!isLoading && eventData.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-20">
            <p className="text-lg text-gray-600">{statusMessage}</p>
          </div>
        )}
        
        {!isLoading && eventData.length === 0 && (
          <div className="text-center p-4">
            <p className="text-lg text-gray-600">{statusMessage}</p>
          </div>
        )}

        {screenshotUrl && (
          <div className="relative inline-block shadow-lg" style={{ fontSize: 0 }}>
            <img
              ref={screenshotRef}
              src={screenshotUrl}
              alt="Website Screenshot"
              onLoad={handleImageLoad}
              className="relative z-0"
              style={{ visibility: isLoading ? 'hidden' : 'visible' }}
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
