import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  const widthQuery = searchParams.get('w');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  const viewportWidth = widthQuery ? parseInt(widthQuery, 10) : 1280; // Default to 1280 if not provided
  if (isNaN(viewportWidth) || viewportWidth <= 0) {
      return NextResponse.json({ error: 'Invalid width parameter' }, { status: 400 });
  }

  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Set viewport to match the user's browser width
    await page.setViewportSize({ width: viewportWidth, height: 720 }); // Height is arbitrary for fullPage screenshots

    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Take a screenshot of the full scrollable page
    const screenshotBuffer = await page.screenshot({ type: 'jpeg', quality: 80, fullPage: true });

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
