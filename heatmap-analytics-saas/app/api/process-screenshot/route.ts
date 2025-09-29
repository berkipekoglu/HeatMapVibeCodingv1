import { NextRequest, NextResponse } from "next/server";
import { verifySignature } from "@upstash/qstash/dist/nextjs";
import { chromium } from "playwright";
import { put } from "@vercel/blob";
import { Redis } from "@upstash/redis";

// Redis istemcisini başlat
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

async function handler(req: NextRequest) {
  const body = await req.json();
  const { url, viewportWidth, websiteId } = body;

  if (!url || !viewportWidth || !websiteId) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  // Playwright ile ekran görüntüsü al
  let browser;
  let screenshotBuffer: Buffer;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setViewportSize({ width: viewportWidth, height: 720 });
    await page.goto(url, { waitUntil: "networkidle" });
    screenshotBuffer = await page.screenshot({
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Vercel Blob'a yükle
  const blob = await put(
    `screenshots/${websiteId}-${viewportWidth}.jpeg`,
    screenshotBuffer,
    {
      access: "public",
      contentType: "image/jpeg",
    }
  );

  // Redis'e URL'i kaydet (24 saat geçerli)
  const cacheKey = `screenshot:${websiteId}:${viewportWidth}`;
  await redis.set(cacheKey, blob.url, { ex: 86400 }); // 86400 saniye = 24 saat

  return NextResponse.json({ success: true, url: blob.url });
}

// QStash isteğini manuel olarak doğrulayan yeni POST fonksiyonu
export async function POST(req: NextRequest) {
  const signature = req.headers.get("upstash-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  // Klonlama, body'nin birden fazla kez okunabilmesini sağlar
  const bodyAsText = await req.clone().text();

  const isValid = await verifySignature(
    bodyAsText,
    signature,
    process.env.QSTASH_CURRENT_SIGNING_KEY!,
    process.env.QSTASH_NEXT_SIGNING_KEY!
  );

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    // İmza geçerliyse, asıl işi yapacak olan handler'ı çağır
    return await handler(req);
  } catch (error) {
    console.error("[PROCESS_SCREENSHOT_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to process screenshot" },
      { status: 500 }
    );
  }
}
