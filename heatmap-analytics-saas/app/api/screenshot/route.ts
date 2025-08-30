import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    const screenshotBuffer = await page.screenshot({ type: 'jpeg', quality: 80 });

    // Return as base64 encoded string
    return new NextResponse(screenshotBuffer.toString('base64'), {
      headers: { 'Content-Type': 'image/jpeg' },
      status: 200,
    });
  } catch (error) {
    console.error('Error taking screenshot:', error);
    return NextResponse.json({ error: 'Failed to take screenshot' }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
