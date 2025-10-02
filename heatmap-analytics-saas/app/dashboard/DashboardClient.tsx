"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart as BarChartIcon,
  Globe,
  PlusCircle,
  Eye,
  Code,
  Copy,
  Check,
  MousePointerClick,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Data Structures
export interface WebsiteData {
  id: string;
  name: string;
  url: string;
  created_at: string;
  click_count: number;
}

export interface StatsData {
  clicksOverTime: { date: string; clicks: number }[];
  browserStats: { browser: string; count: number }[];
  osStats: { os: string; count: number }[];
  deviceStats: { device: string; count: number }[];
}

interface DashboardClientProps {
  initialWebsites: WebsiteData[];
  totalClicks: number;
  totalWebsites: number;
  initialStats: StatsData | null;
  performanceMetrics: any[];
  jsErrors: any[];
}

// Chart Components
const ClicksChart = ({ data }: { data: StatsData["clicksOverTime"] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <XAxis
        dataKey="date"
        stroke="#888888"
        fontSize={12}
        tickLine={false}
        axisLine={false}
      />
      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
      <Tooltip
        wrapperClassName="!bg-background !border-border"
        formatter={(value) => [value, "Tıklamalar"]}
        labelFormatter={(label) =>
          `Tarih: ${new Date(label).toLocaleDateString()}`
        }
      />
      <Bar dataKey="clicks" fill="#8884d8" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

const DeviceChart = ({ data }: { data: StatsData["deviceStats"] }) => {
  const COLORS = { desktop: "#8884d8", mobile: "#82ca9d" };
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="device"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[entry.device as keyof typeof COLORS] || "#d3d3d3"}
            />
          ))}
        </Pie>
        <Tooltip wrapperClassName="!bg-background !border-border" />
      </PieChart>
    </ResponsiveContainer>
  );
};

function TrackerScriptDialog({ site }: { site: WebsiteData }) {
  const [hasCopied, setHasCopied] = useState(false);
  const scriptText = `<script async defer data-website-id="${site.id}" src="${process.env.NEXT_PUBLIC_APP_URL}/tracker.js"></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptText).then(() => {
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2500);
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Get Tracker Code">
          <Code className="h-4 w-4" />
          <span className="sr-only">Get Tracker Code</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>"{site.name}" için Tracker Scripti</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Bu kodu kopyalayıp, sitenizin &lt;head&gt; etiketinin içine
            yapıştırın.
          </p>
          <div className="relative">
            <pre className="bg-gray-900 text-white rounded-md p-4 pr-16 text-sm overflow-x-auto text-wrap">
              <code>{scriptText}</code>
            </pre>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-gray-400 hover:text-white hover:bg-gray-700"
              onClick={handleCopy}
            >
              {hasCopied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="sr-only">{hasCopied ? "Copied" : "Copy"}</span>
            </Button>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Component
const PerformanceCard = ({
  title,
  value,
  unit,
}: {
  title: string;
  value: number;
  unit: string;
}) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        {value.toFixed(2)}
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </CardContent>
  </Card>
);

const ErrorsTable = ({ errors }: { errors: any[] }) => (
  <Card className="col-span-1 md:col-span-2 lg:col-span-4">
    <CardHeader>
      <CardTitle>Latest JavaScript Errors</CardTitle>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Error Message</TableHead>
            <TableHead>Timestamp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {errors.length > 0 ? (
            errors.map((error, index) => (
              <TableRow key={index}>
                <TableCell className="font-mono text-xs">
                  {error.error_message}
                </TableCell>
                <TableCell>
                  {new Date(error.timestamp).toLocaleString()}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={2} className="text-center h-24">
                No JavaScript errors recorded.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

export default function DashboardClient({
  initialWebsites,
  totalClicks,
  totalWebsites,
  initialStats,
  performanceMetrics,
  jsErrors,
}: DashboardClientProps) {
  const [websites, setWebsites] = useState<WebsiteData[]>(initialWebsites);
  console.log("initialStats:", initialStats);
  const [stats, setStats] = useState<StatsData | null>(initialStats);
  const [error, setError] = useState("");
  const [formState, setFormState] = useState({ name: "", url: "" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const router = useRouter();

  const lcp = performanceMetrics.find(
    (m) => m.metric_name === "largest-contentful-paint"
  );
  const cls = performanceMetrics.find(
    (m) => m.metric_name === "cumulative-layout-shift"
  );

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handleRefreshScreenshot = async (site: WebsiteData) => {
    setRefreshing(site.id);
    try {
      await fetch("/api/screenshot/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId: site.id, websiteUrl: site.url }),
      });
    } catch (err) {
      console.error("Failed to refresh screenshot", err);
    }
    setTimeout(() => setRefreshing(null), 2500);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });

      const data = await res.json();

      if (res.ok) {
        setWebsites([data, ...websites]);
        setFormState({ name: "", url: "" });
        setIsDialogOpen(false);
      } else {
        setError(data.error || "Failed to add website.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChartIcon className="w-6 h-6 mr-2 text-indigo-600" />
            Dashboard
          </h1>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Çıkış Yap
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Metric Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Website</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWebsites}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                İzlenen Toplam Tıklama Sayısı
              </CardTitle>
              <BarChartIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClicks}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Clicks (Last 14 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ClicksChart data={stats.clicksOverTime} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <DeviceChart data={stats.deviceStats} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Site Health Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Site Health</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {performanceMetrics.find(
              (m) => m.metric_name === "largest-contentful-paint"
            ) && (
              <PerformanceCard
                title="Largest Contentful Paint (LCP)"
                value={
                  performanceMetrics.find(
                    (m) => m.metric_name === "largest-contentful-paint"
                  ).average_value / 1000
                }
                unit="s"
              />
            )}
            {performanceMetrics.find(
              (m) => m.metric_name === "cumulative-layout-shift"
            ) && (
              <PerformanceCard
                title="Cumulative Layout Shift (CLS)"
                value={
                  performanceMetrics.find(
                    (m) => m.metric_name === "cumulative-layout-shift"
                  ).average_value
                }
                unit=""
              />
            )}
          </div>
          <ErrorsTable errors={jsErrors} />
        </div>

        {/* Websites Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Web Siteleriniz</CardTitle>
              <p className="text-sm text-muted-foreground">
                İzlenen sitelerinizi yönetin ve ısı haritalarını görüntüleyin.
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Website Ekle
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Yeni Bir Web Sitesi Ekle</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Başlık
                      </Label>
                      <Input
                        id="name"
                        value={formState.name}
                        onChange={(e) =>
                          setFormState({ ...formState, name: e.target.value })
                        }
                        className="col-span-3"
                        placeholder="My Awesome Blog"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="url" className="text-right">
                        URL
                      </Label>
                      <Input
                        id="url"
                        type="url"
                        value={formState.url}
                        onChange={(e) =>
                          setFormState({ ...formState, url: e.target.value })
                        }
                        className="col-span-3"
                        placeholder="https://example.com"
                        required
                      />
                    </div>
                  </div>
                  {error && (
                    <p className="text-red-500 text-sm text-center mb-2">
                      {error}
                    </p>
                  )}
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">
                        İptal
                      </Button>
                    </DialogClose>
                    <Button type="submit">Web Sitesi Ekle</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Başlık</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead className="text-center">Tıklama Sayısı</TableHead>
                  <TableHead className="text-right">Eylemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {websites.length > 0 ? (
                  websites.map((site) => (
                    <TableRow key={site.id}>
                      <TableCell className="font-medium">{site.name}</TableCell>
                      <TableCell>
                        <a
                          href={site.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary"
                        >
                          {site.url}
                        </a>
                      </TableCell>
                      <TableCell className="text-center">
                        {site.click_count}
                      </TableCell>
                      <TableCell className="text-right flex items-center justify-end space-x-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/dashboard/websites/${site.id}/clicks`}>
                            <Eye className="w-4 h-4 mr-2" />
                            Click Map
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/dashboard/websites/${site.id}/moves`}>
                            <MousePointerClick className="w-4 h-4 mr-2" />
                            Move Map
                          </Link>
                        </Button>
                        <TrackerScriptDialog site={site} />
                        <Button
                          variant="outline"
                          size="icon"
                          title="Refresh Screenshot"
                          onClick={() => handleRefreshScreenshot(site)}
                          disabled={refreshing === site.id}
                        >
                          <RefreshCw
                            className={`h-4 w-4 ${
                              refreshing === site.id ? "animate-spin" : ""
                            }`}
                          />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      No websites added yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
