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
  console.log('\n--- [PROCESS_SCREENSHOT_WORKER] --- ');
  try {
    const body = await req.json();
    const { url, viewportWidth, websiteId } = body;
    console.log(`[WORKER] Received job for URL: ${url}`);

    if (!url || !viewportWidth || !websiteId) {
      console.error('[WORKER_ERROR] Missing required parameters');
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    let browser;
    let screenshotBuffer: Buffer;
    try {
      console.log('[WORKER] Launching Playwright...');
      browser = await chromium.launch();
      const page = await browser.newPage();
      await page.setViewportSize({ width: viewportWidth, height: 720 });
      await page.goto(url, { waitUntil: 'networkidle' });
      screenshotBuffer = await page.screenshot({ type: 'jpeg', quality: 80, fullPage: true });
      console.log('[WORKER] Playwright screenshot successful.');
    } catch (playwrightError) {
        console.error('[WORKER_ERROR] Playwright failed:', playwrightError);
        throw playwrightError; // Re-throw to be caught by the outer catch block
    } finally {
      if (browser) {
        await browser.close();
      }
    }

    console.log('[WORKER] Uploading to Vercel Blob...');
    const blob = await put(`screenshots/${websiteId}-${viewportWidth}.jpeg`, screenshotBuffer, {
      access: 'public',
      contentType: 'image/jpeg',
      allowOverwrite: true, // Allow overwriting existing screenshots
    });
    console.log(`[WORKER] Upload successful. Blob URL: ${blob.url}`);

    const cacheKey = `screenshot:${websiteId}:${viewportWidth}`;
    console.log(`[WORKER] Setting Redis cache. Key: ${cacheKey}`);
    await redis.set(cacheKey, blob.url, { ex: 86400 });
    console.log('[WORKER] Redis cache set successfully.');

    console.log('--- [PROCESS_SCREENSHOT_WORKER END] ---\n');
    return NextResponse.json({ success: true, url: blob.url });

  } catch (error) {
    console.error('[PROCESS_SCREENSHOT_ERROR]', error);
    return NextResponse.json({ error: 'Failed to process screenshot' }, { status: 500 });
  }
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
