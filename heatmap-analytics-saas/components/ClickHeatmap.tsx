"use client";

import { useEffect, useRef, useState } from "react";
import H from "heatmap.js";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Label } from "./ui/label";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Type definitions
interface HeatmapEvent {
  x: number;
  y: number;
  viewport_width: number;
  viewport_height: number;
}

interface StatsData {
  clicksOverTime: any[];
  browserStats: { browser: string; count: number }[];
  osStats: { os: string; count: number }[];
  deviceStats: { device: string; count: number }[];
}

interface HeatmapProps {
  websiteId: string;
  websiteUrl: string;
  initialPages: string[];
  stats: StatsData | null;
}

export default function ClickHeatmap({
  websiteId,
  websiteUrl,
  initialPages,
  stats,
}: HeatmapProps) {
  const [eventData, setEventData] = useState<HeatmapEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Loading click data...");
  const [screenshotUrl, setScreenshotUrl] = useState<string>("");
  const [pages, setPages] = useState<string[]>(initialPages);
  const [selectedPage, setSelectedPage] = useState<string>(websiteUrl);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedDevice, setSelectedDevice] = useState<string>("all");
  const [selectedBrowser, setSelectedBrowser] = useState<string>("all");
  const [selectedOs, setSelectedOs] = useState<string>("all");

  const heatmapContainerRef = useRef<HTMLDivElement>(null);
  const screenshotRef = useRef<HTMLImageElement>(null);
  const heatmapInstance = useRef<any>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchDataForPage = async () => {
      if (!websiteId || !selectedPage) return;

      setIsLoading(true);
      setStatusMessage("Loading click data for selected filters...");
      setScreenshotUrl("");
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);

      try {
        const params = new URLSearchParams({
          url: selectedPage,
          ...(dateRange?.from && { startDate: dateRange.from.toISOString() }),
          ...(dateRange?.to && { endDate: dateRange.to.toISOString() }),
          ...(selectedDevice !== "all" && { device: selectedDevice }),
          ...(selectedBrowser !== "all" && { browser: selectedBrowser }),
          ...(selectedOs !== "all" && { os: selectedOs }),
        });

        const dataRes = await fetch(
          `/api/websites/${websiteId}/clicks?${params.toString()}`
        );
        if (!dataRes.ok) throw new Error("Failed to fetch click data");
        const data = await dataRes.json();
        console.log("Fetched heatmap data:", data);
        setEventData(data);

        if (data.length > 0) {
          setStatusMessage("Loading website preview...");
          const representativeWidth = data[0].viewport_width;
          const initialUrl = `/api/screenshot?url=${encodeURIComponent(
            selectedPage
          )}&websiteId=${websiteId}&w=${representativeWidth}&t=${Date.now()}`;
          console.log("Setting screenshot URL to:", initialUrl);
          setScreenshotUrl(initialUrl);
        } else {
          setStatusMessage("No click data available for this selection.");
          console.log("No data found, setting isLoading to false.");
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
  }, [
    websiteId,
    selectedPage,
    dateRange,
    selectedDevice,
    selectedBrowser,
    selectedOs,
  ]);

  // ... (handleImageLoad and heatmap rendering useEffect remain the same)
  const handleImageLoad = () => {
    const img = screenshotRef.current;
    if (!img) return;

    if (img.src.includes("placeholder.svg")) {
      setStatusMessage(
        "Generating website preview... (this may take a moment)"
      );
      pollingTimeoutRef.current = setTimeout(() => {
        const newUrl = `${screenshotUrl.split("&t=")[0]}&t=${Date.now()}`;
        setScreenshotUrl(newUrl);
      }, 3000);
    } else {
      // Real image has loaded, stop loading state
      console.log("Real image loaded, setting isLoading to false.");
      setIsLoading(false);
      setStatusMessage("");
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
    }
  };

  useEffect(() => {
    if (
      isLoading ||
      !screenshotUrl ||
      !eventData.length ||
      !heatmapContainerRef.current ||
      !screenshotRef.current
    ) {
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
        heatmapInstance.current = H.create({
          container: heatmapContainerRef.current,
          radius: 25,
          maxOpacity: 0.6,
          minOpacity: 0.1,
          blur: 0.85,
        });
      }
      const dataPoints = eventData.map((event) => ({
        x: Math.round(event.x * (screenshotWidth / event.viewport_width)),
        y: event.y,
        value: 1,
      }));
      console.log(
        `Passing ${dataPoints.length} data points to heatmap.js`,
        dataPoints.slice(0, 5)
      ); // Log first 5 points
      heatmapInstance.current.setData({ max: 5, data: dataPoints });
    };
    if (img.complete) setupHeatmap();
    else img.onload = setupHeatmap;
  }, [isLoading, screenshotUrl, eventData]);

  // ... (rest of the imports)

  // ... (rest of the component code)

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-4 p-4 border rounded-lg bg-card">
        <div className="flex-1 min-w-[150px]">
          <Label
            htmlFor="page-select"
            className="text-sm font-medium text-muted-foreground"
          >
            Page
          </Label>
          <Select value={selectedPage} onValueChange={setSelectedPage}>
            <SelectTrigger id="page-select" className="mt-1 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pages.map((page) => (
                <SelectItem key={page} value={page}>
                  {new URL(page).pathname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <Label
            htmlFor="device-select"
            className="text-sm font-medium text-muted-foreground"
          >
            Device
          </Label>
          <Select value={selectedDevice} onValueChange={setSelectedDevice}>
            <SelectTrigger id="device-select" className="mt-1 w-full">
              <SelectValue placeholder="All Devices" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Devices</SelectItem>
              {stats?.deviceStats.map((s) => (
                <SelectItem key={s.device} value={s.device}>
                  {s.device}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <Label
            htmlFor="browser-select"
            className="text-sm font-medium text-muted-foreground"
          >
            Browser
          </Label>
          <Select value={selectedBrowser} onValueChange={setSelectedBrowser}>
            <SelectTrigger id="browser-select" className="mt-1 w-full">
              <SelectValue placeholder="All Browsers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Browsers</SelectItem>
              {stats?.browserStats.map((s) => (
                <SelectItem key={s.browser} value={s.browser}>
                  {s.browser}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <Label
            htmlFor="os-select"
            className="text-sm font-medium text-muted-foreground"
          >
            OS
          </Label>
          <Select value={selectedOs} onValueChange={setSelectedOs}>
            <SelectTrigger id="os-select" className="mt-1 w-full">
              <SelectValue placeholder="All OS" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All OS</SelectItem>
              {stats?.osStats.map((s) => (
                <SelectItem key={s.os} value={s.os}>
                  {s.os}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[300px]">
          <Label className="text-sm font-medium text-muted-foreground">
            Date Range
          </Label>
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
        </div>
      </div>

      <div className="w-full flex justify-center items-start pt-4">
        {(isLoading ||
          (statusMessage && statusMessage.includes("Generating"))) && (
          <div className="inset-0 flex items-center justify-center z-20">
            <Empty className="w-full">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Spinner />
                </EmptyMedia>
                <EmptyTitle>
                  {statusMessage.includes("Generating")
                    ? "Site Önizlemesi Oluşturuluyor"
                    : "Veriler Yükleniyor"}
                </EmptyTitle>
                <EmptyDescription>
                  Lütfen bekleyin, bu işlem birkaç saniye sürebilir. Sayfayı
                  yenilemeyin.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        )}

        {!isLoading && eventData.length === 0 && (
          <Empty className="w-full py-10">
            <EmptyHeader>
              <EmptyTitle>Veri Bulunamadı</EmptyTitle>
              <EmptyDescription>
                Yaptığınız filtreleme seçimi için gösterilecek herhangi bir
                tıklama verisi bulunamadı.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {screenshotUrl && (
          <div
            className="relative inline-block shadow-lg"
            style={{
              fontSize: 0,
              visibility: isLoading ? "hidden" : "visible",
            }}
          >
            <img
              ref={screenshotRef}
              src={screenshotUrl}
              alt="Website Screenshot"
              onLoad={handleImageLoad}
              className="relative z-0"
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
