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
  BarChart,
  Globe,
  PlusCircle,
  Eye,
  Code,
  Copy,
  Check,
  MousePointerClick,
} from "lucide-react";

export interface WebsiteData {
  id: string;
  name: string;
  url: string;
  created_at: string;
  click_count: number;
}

interface DashboardClientProps {
  initialWebsites: WebsiteData[];
  totalClicks: number;
  totalWebsites: number;
}

// Helper component for the tracker script modal to manage its own state
function TrackerScriptDialog({ site }: { site: WebsiteData }) {
  const [hasCopied, setHasCopied] = useState(false);
  const scriptText = `<script async defer data-website-id="${site.id}" src="http://localhost:3000/tracker.js"></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptText).then(() => {
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2500);
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="ml-2">
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

export default function DashboardClient({
  initialWebsites,
  totalClicks,
  totalWebsites,
}: DashboardClientProps) {
  const [websites, setWebsites] = useState<WebsiteData[]>(initialWebsites);
  const [error, setError] = useState("");
  const [formState, setFormState] = useState({ name: "", url: "" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
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
        setIsDialogOpen(false); // Close dialog on success
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
            <BarChart className="w-6 h-6 mr-2 text-indigo-600" />
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
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClicks}</div>
            </CardContent>
          </Card>
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
